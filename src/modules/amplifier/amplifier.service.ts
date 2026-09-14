import { Injectable, Logger } from '@nestjs/common';
import { gql } from '@apollo/client/core';
import { ChainId, UniswapV3PoolABI } from '@frankencoin/zchf';
import { Address, erc20Abi, getAddress } from 'viem';
import { mainnet, optimism } from 'viem/chains';
import { VIEM_CONFIG } from 'app.config';
import { DataSourceManagerService } from 'core/data-source/data-source.manager.service';
import { formatFloat, normalizeAddress } from 'utils/format';
import { AmplifiedPositionABI } from './amplifier.abi';
import { positionAmounts, sqrtPriceFromX96, usdPerZchf } from './amplifier.math';
import {
	AmplifierActivityObjectArray,
	AmplifierActivityPonder,
	AmplifierActivityQuery,
	AmplifierPositionPonder,
	AmplifierPositionQuery,
	AmplifierPositionsObjectArray,
	AmplifierQuery,
	AmplifierQueryObjectArray,
	AmplifierStatusPonder,
	ApiAmplifierActivity,
	ApiAmplifierListing,
	ApiAmplifierPositions,
} from './amplifier.types';

// Chains with a production UniswapAmplifier deployment
export const AMPLIFIER_CHAIN_IDS: ChainId[] = [mainnet.id, optimism.id];

// Expired test amplifier on mainnet. It is not indexed, but never surface it even if an indexer carries it.
const EXCLUDED_AMPLIFIERS = new Set<Address>([normalizeAddress('0x560E4889e01f41612133Af0a363dD686534c2dA7')]);

export const AMPLIFIER_ACTIVITY_DEFAULT_LIMIT = 50;
export const AMPLIFIER_ACTIVITY_MAX_LIMIT = 500;

type UsdTokenInfo = { symbol: string; decimals: number };

type AmplifierChainData = {
	amplifierStatuss: { items: AmplifierStatusPonder[] };
	amplifierPositions: { items: AmplifierPositionPonder[] };
	amplifierActivitys: { items: AmplifierActivityPonder[] };
};

// Ponder caps `limit` at 1000. Positions/activity per chain are far below that; if that ever changes,
// switch to cursor pagination (`after`) here.
const AMPLIFIER_CHAIN_QUERY = gql`
	query ($chainId: Int!) {
		amplifierStatuss(where: { chainId: $chainId }, limit: 100) {
			items {
				chainId
				address
				pool
				usd
				zchf
				zchfIsToken0
				expiration
				limit
				priceAnchorX96
				totalBorrowed
				positionCount
				created
				updated
			}
		}
		amplifierPositions(where: { chainId: $chainId }, orderBy: "created", orderDirection: "desc", limit: 1000) {
			items {
				chainId
				position
				amplifier
				owner
				tickLow
				tickHigh
				liquidity
				borrowed
				created
				updated
			}
		}
		amplifierActivitys(where: { chainId: $chainId }, orderBy: "created", orderDirection: "desc", limit: 1000) {
			items {
				chainId
				txHash
				count
				amplifier
				position
				kind
				liquidity
				token0
				token1
				zchf
				totalBorrowed
				sender
				created
				blockheight
			}
		}
	}
`;

@Injectable()
export class AmplifierService {
	private readonly logger = new Logger(this.constructor.name);
	// all maps are keyed by the lowercase amplifier address
	private fetchedAmplifiers: AmplifierQueryObjectArray = {};
	private fetchedPositions: AmplifierPositionsObjectArray = {};
	private fetchedActivity: AmplifierActivityObjectArray = {};
	// usd token metadata, keyed by `${chainId}-${usd}`, read once per amplifier and cached
	private usdTokenInfo: Record<string, UsdTokenInfo> = {};

	constructor(private readonly dataSource: DataSourceManagerService) {}

	getList(): ApiAmplifierListing {
		const list = Object.values(this.fetchedAmplifiers);
		return { num: list.length, list };
	}

	getAmplifier(amplifier: Address): AmplifierQuery | undefined {
		return this.fetchedAmplifiers[normalizeAddress(amplifier)];
	}

	getPositions(amplifier: Address): ApiAmplifierPositions {
		const list = this.fetchedPositions[normalizeAddress(amplifier)] ?? [];
		return { num: list.length, list };
	}

	getActivity(amplifier: Address, limit: number = AMPLIFIER_ACTIVITY_DEFAULT_LIMIT, offset: number = 0): ApiAmplifierActivity {
		const all = this.fetchedActivity[normalizeAddress(amplifier)] ?? [];
		const list = all.slice(offset, offset + limit);
		return { num: list.length, total: all.length, list };
	}

	async updateAmplifiers() {
		this.logger.debug('Updating Amplifiers');

		const results = await Promise.allSettled(AMPLIFIER_CHAIN_IDS.map((chainId) => this.updateChain(chainId)));
		results.forEach((r, idx) => {
			if (r.status === 'rejected') {
				// keep the previous state of this chain, the next run will retry
				this.logger.error(`Amplifier update failed for chain ${AMPLIFIER_CHAIN_IDS[idx]}`, r.reason);
			}
		});
	}

	private async updateChain(chainId: ChainId) {
		const data = await this.dataSource.queryWithFailover<AmplifierChainData>({
			query: AMPLIFIER_CHAIN_QUERY,
			variables: { chainId },
		});

		if (!data?.amplifierStatuss?.items) {
			this.logger.warn(`No amplifier data found for chain ${chainId}.`);
			return;
		}

		const statuses = data.amplifierStatuss.items.filter((s) => !EXCLUDED_AMPLIFIERS.has(normalizeAddress(s.address)));
		const known = new Set(statuses.map((s) => normalizeAddress(s.address)));
		const positionsRaw = (data.amplifierPositions?.items ?? []).filter((p) => known.has(normalizeAddress(p.amplifier)));
		const activityRaw = (data.amplifierActivitys?.items ?? []).filter((a) => known.has(normalizeAddress(a.amplifier)));

		const client = VIEM_CONFIG[chainId];

		// usd token metadata (cached after first success)
		const usdInfoByAmplifier: Record<Address, UsdTokenInfo> = {};
		for (const s of statuses) {
			usdInfoByAmplifier[normalizeAddress(s.address)] = await this.getUsdTokenInfo(chainId, s.usd);
		}

		// live reads: slot0() per pool, totalLiquidity() per position clone.
		// Individual readContract calls are batched into one multicall by the transport config (see app.config.ts).
		const pools = [...new Set(statuses.map((s) => normalizeAddress(s.pool)))];
		const [slot0Reads, liquidityReads] = await Promise.all([
			Promise.allSettled(pools.map((address) => client.readContract({ address, abi: UniswapV3PoolABI, functionName: 'slot0' }))),
			Promise.allSettled(
				positionsRaw.map((p) =>
					client.readContract({ address: p.position, abi: AmplifiedPositionABI, functionName: 'totalLiquidity' })
				)
			),
		]);
		const asOf = Math.floor(Date.now() / 1000);

		const sqrtPriceByPool: Record<Address, number> = {};
		pools.forEach((pool, idx) => {
			const r = slot0Reads[idx];
			if (r.status !== 'fulfilled') {
				// without the pool price nothing on this chain can be valued; keep the previous state
				throw new Error(`slot0() read failed for pool ${pool} on chain ${chainId}: ${r.reason?.message ?? r.reason}`);
			}
			sqrtPriceByPool[pool] = sqrtPriceFromX96(r.value[0]);
		});

		const liquidityByPosition: Record<Address, bigint> = {};
		positionsRaw.forEach((p, idx) => {
			const r = liquidityReads[idx];
			if (r.status === 'fulfilled') {
				liquidityByPosition[normalizeAddress(p.position)] = r.value;
			} else {
				// fall back to the indexed running sum (may undercount donated liquidity)
				this.logger.warn(`totalLiquidity() read failed for position ${p.position} on chain ${chainId}, using indexed value`);
				liquidityByPosition[normalizeAddress(p.position)] = BigInt(p.liquidity);
			}
		});

		const amplifiers: AmplifierQueryObjectArray = {};
		const positions: AmplifierPositionsObjectArray = {};
		const activity: AmplifierActivityObjectArray = {};

		for (const s of statuses) {
			const key = normalizeAddress(s.address);
			const usdInfo = usdInfoByAmplifier[key];
			const sqrtP = sqrtPriceByPool[normalizeAddress(s.pool)];
			const price = usdPerZchf(sqrtP, s.zchfIsToken0, usdInfo.decimals);

			const positionList: AmplifierPositionQuery[] = positionsRaw
				.filter((p) => normalizeAddress(p.amplifier) === key)
				.map((p) => {
					const liquidity = liquidityByPosition[normalizeAddress(p.position)];
					const { amount0, amount1 } = positionAmounts(liquidity, p.tickLow, p.tickHigh, sqrtP);
					const zchfBase = s.zchfIsToken0 ? amount0 : amount1;
					const usdBase = s.zchfIsToken0 ? amount1 : amount0;
					return {
						chainId: p.chainId,
						position: getAddress(p.position),
						amplifier: getAddress(p.amplifier),
						owner: getAddress(p.owner),
						tickLow: p.tickLow,
						tickHigh: p.tickHigh,
						liquidity: liquidity.toString(),
						borrowed: p.borrowed,
						created: parseInt(p.created),
						zchfAmount: zchfBase / 10 ** 18,
						usdAmount: usdBase / 10 ** usdInfo.decimals,
					};
				});

			const zchfAmount = positionList.reduce((a, p) => a + p.zchfAmount, 0);
			const usdAmount = positionList.reduce((a, p) => a + p.usdAmount, 0);
			const poolValueZchf = zchfAmount + usdAmount / price;
			const totalBorrowed = formatFloat(BigInt(s.totalBorrowed), 18);

			amplifiers[key] = {
				chainId: s.chainId,
				address: getAddress(s.address),
				pool: getAddress(s.pool),
				zchf: getAddress(s.zchf),
				usd: getAddress(s.usd),
				usdSymbol: usdInfo.symbol,
				usdDecimals: usdInfo.decimals,
				zchfIsToken0: s.zchfIsToken0,
				expiration: parseInt(s.expiration),
				limit: s.limit,
				totalBorrowed: s.totalBorrowed,
				positionCount: s.positionCount,
				zchfAmount,
				usdAmount,
				usdPerZchf: price,
				poolValueZchf,
				avgCollRatio: totalBorrowed > 0 ? poolValueZchf / totalBorrowed : 0,
				asOf,
			};

			positions[key] = positionList;

			activity[key] = activityRaw
				.filter((a) => normalizeAddress(a.amplifier) === key)
				.map(
					(a): AmplifierActivityQuery => ({
						chainId: a.chainId,
						txHash: a.txHash,
						count: parseInt(a.count),
						amplifier: getAddress(a.amplifier),
						position: getAddress(a.position),
						kind: a.kind,
						liquidity: a.liquidity,
						token0: a.token0,
						token1: a.token1,
						zchf: a.zchf,
						totalBorrowed: a.totalBorrowed,
						sender: getAddress(a.sender),
						created: parseInt(a.created),
						blockheight: parseInt(a.blockheight),
					})
				)
				// newest first
				.sort((a, b) => b.created - a.created || b.count - a.count);
		}

		this.replaceChain(chainId, amplifiers, positions, activity);
	}

	private replaceChain(
		chainId: ChainId,
		amplifiers: AmplifierQueryObjectArray,
		positions: AmplifierPositionsObjectArray,
		activity: AmplifierActivityObjectArray
	) {
		const keep = (key: Address) => this.fetchedAmplifiers[key]?.chainId !== chainId;
		const nextAmplifiers: AmplifierQueryObjectArray = {};
		const nextPositions: AmplifierPositionsObjectArray = {};
		const nextActivity: AmplifierActivityObjectArray = {};

		for (const key of Object.keys(this.fetchedAmplifiers) as Address[]) {
			if (!keep(key)) continue;
			nextAmplifiers[key] = this.fetchedAmplifiers[key];
			nextPositions[key] = this.fetchedPositions[key] ?? [];
			nextActivity[key] = this.fetchedActivity[key] ?? [];
		}

		this.fetchedAmplifiers = { ...nextAmplifiers, ...amplifiers };
		this.fetchedPositions = { ...nextPositions, ...positions };
		this.fetchedActivity = { ...nextActivity, ...activity };
	}

	private async getUsdTokenInfo(chainId: ChainId, usd: Address): Promise<UsdTokenInfo> {
		const key = `${chainId}-${normalizeAddress(usd)}`;
		if (this.usdTokenInfo[key]) return this.usdTokenInfo[key];

		const client = VIEM_CONFIG[chainId];
		const [symbol, decimals] = await Promise.all([
			client.readContract({ address: usd, abi: erc20Abi, functionName: 'symbol' }),
			client.readContract({ address: usd, abi: erc20Abi, functionName: 'decimals' }),
		]);

		this.usdTokenInfo[key] = { symbol, decimals };
		return this.usdTokenInfo[key];
	}
}
