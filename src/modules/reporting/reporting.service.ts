import { Injectable, Logger } from '@nestjs/common';
import { gql } from '@apollo/client/core';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { ADDRESS } from '@frankencoin/zchf';
import { PONDER_CLIENT } from 'app.config';
import { normalizeAddress } from 'utils/format';
import { TtlCache } from 'utils/ttl-cache';
import { AnalyticsService } from 'modules/analytics/analytics.service';
import { ApiFpsYearlyRow, BalanceCheckpoint, EarningsDelta, ReportingToken } from './reporting.types';

// Recomputation only re-runs the two bounded (limit: 1000) Ponder queries plus an O(n*m) in-memory join —
// cheap enough that a single TTL per (address, token) key is enough; there's no need to special-case
// "closed years never change" on top of it yet.
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class ReportingService {
	private readonly logger = new Logger(this.constructor.name);
	private cache = new TtlCache<ApiFpsYearlyRow[]>(CACHE_TTL_MS);

	constructor(private readonly analytics: AnalyticsService) {}

	async getFpsYearlyReport(address: Address, token: ReportingToken, year?: number): Promise<ApiFpsYearlyRow[]> {
		const addr = normalizeAddress(address);
		const rows = await this.cache.getOrCompute(`${addr}:${token}`, () => this.computeFpsYearlyReport(addr, token));

		return year === undefined ? rows : rows.filter((r) => r.year === year);
	}

	private async computeFpsYearlyReport(address: Address, token: ReportingToken): Promise<ApiFpsYearlyRow[]> {
		this.logger.debug(`Computing FpsYearlyReport for ${address} (${token})`);

		const [fps1Checkpoints, fcsCheckpoints, earnings] = await Promise.all([
			this.fetchBalanceHistory(address, ADDRESS[mainnet.id].equity),
			this.fetchBalanceHistory(address, ADDRESS[mainnet.id].fcs),
			this.fetchEarningsDeltas(),
		]);

		const priceAt = this.buildPriceLookup();
		return this.buildYearlyRows(fps1Checkpoints, fcsCheckpoints, earnings, token, priceAt);
	}

	// FPS1 and FCS balance history both come out of Ponder's generic ERC20Balance pipeline
	// (Equity/FCS/Frankencoin transfers all land in the same table, keyed by `token`), so this
	// query works unchanged for either token address.
	// @dev: ponder caps a single page at 1000 items, so the full history has to be walked with
	// cursor pagination — see app/hooks/useFPSEarningsHistory.ts for the same fix on the client side.
	private async fetchBalanceHistory(address: Address, token: Address): Promise<BalanceCheckpoint[]> {
		const collected: BalanceCheckpoint[] = [];
		let after: string | null = null;

		do {
			const response = await PONDER_CLIENT.query<{
				eRC20Balances: {
					items: { created: string; to: string; balanceFrom: string; balanceTo: string }[];
					pageInfo: { endCursor: string | null; hasNextPage: boolean };
				};
			}>({
				fetchPolicy: 'no-cache',
				query: gql`
					query FpsYearlyBalanceHistory($token: String!, $addr: String!, $after: String) {
						eRC20Balances(
							where: { chainId: 1, token: $token, OR: [{ from: $addr }, { to: $addr }] }
							orderBy: "count"
							orderDirection: "asc"
							limit: 1000
							after: $after
						) {
							items {
								created
								to
								balanceFrom
								balanceTo
							}
							pageInfo {
								endCursor
								hasNextPage
							}
						}
					}
				`,
				variables: { token: token.toLowerCase(), addr: address, after },
			});

			const page = response.data?.eRC20Balances;
			if (!page?.items) break;

			for (const i of page.items) {
				collected.push({
					created: Number(i.created),
					balance: normalizeAddress(i.to) === address ? BigInt(i.balanceTo) : BigInt(i.balanceFrom),
				});
			}

			after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
		} while (after);

		return collected;
	}

	// Global earningsPerFPS delta series (Frankencoin:Profit/Loss). FCS deliberately rides this same
	// series rather than getting its own — see ponder issue #68 item 2 for the one known gap (the
	// redemption-discount windfall isn't reflected here yet).
	private async fetchEarningsDeltas(): Promise<EarningsDelta[]> {
		const collected: EarningsDelta[] = [];
		let after: string | null = null;

		do {
			const response = await PONDER_CLIENT.query<{
				frankencoinProfitLosss: {
					items: { created: string; perFPS: string }[];
					pageInfo: { endCursor: string | null; hasNextPage: boolean };
				};
			}>({
				fetchPolicy: 'no-cache',
				query: gql`
					query FpsYearlyEarnings($after: String) {
						frankencoinProfitLosss(where: { chainId: 1 }, orderBy: "count", orderDirection: "asc", limit: 1000, after: $after) {
							items {
								created
								perFPS
							}
							pageInfo {
								endCursor
								hasNextPage
							}
						}
					}
				`,
				variables: { after },
			});

			const page = response.data?.frankencoinProfitLosss;
			if (!page?.items) break;

			for (const i of page.items) {
				collected.push({ created: Number(i.created), perFPS: BigInt(i.perFPS) });
			}

			after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
		} while (after);

		return collected;
	}

	// Reuses AnalyticsService's already-cached AnalyticDailyLog rows instead of re-querying Ponder.
	// FCS value is approximated with the same fpsPrice series as FPS1 (1 FCS ~= 1 FPS1 by construction);
	// see ponder schema/FCS.ts's FCSTradeChart TODO for tightening this once real deployment data exists.
	private buildPriceLookup(): (unixSeconds: number) => bigint {
		const logs = this.analytics.getDailyLog()?.logs ?? [];
		return (unixSeconds: number) => {
			let price = 0n;
			for (const log of logs) {
				if (Number(log.timestamp) > unixSeconds) break;
				price = BigInt(log.fpsPrice);
			}
			return price;
		};
	}

	private buildYearlyRows(
		fps1Checkpoints: BalanceCheckpoint[],
		fcsCheckpoints: BalanceCheckpoint[],
		earnings: EarningsDelta[],
		token: ReportingToken,
		priceAt: (unixSeconds: number) => bigint
	): ApiFpsYearlyRow[] {
		const includeFps1 = token === 'fps1' || token === 'combined';
		const includeFcs = token === 'fcs' || token === 'combined';

		const balanceAt = (checkpoints: BalanceCheckpoint[], t: number): bigint => {
			let balance = 0n;
			for (const cp of checkpoints) {
				if (cp.created > t) break;
				balance = cp.balance;
			}
			return balance;
		};

		const combinedBalanceAt = (t: number): bigint =>
			(includeFps1 ? balanceAt(fps1Checkpoints, t) : 0n) + (includeFcs ? balanceAt(fcsCheckpoints, t) : 0n);

		const yearOf = (unixSeconds: number) => new Date(unixSeconds * 1000).getUTCFullYear();

		const earningsByYear = new Map<number, bigint>();
		for (const e of earnings) {
			const balance = combinedBalanceAt(e.created);
			if (balance === 0n) continue;
			const year = yearOf(e.created);
			const contribution = (balance * e.perFPS) / 10n ** 18n;
			earningsByYear.set(year, (earningsByYear.get(year) ?? 0n) + contribution);
		}

		const relevantCheckpoints = [...(includeFps1 ? fps1Checkpoints : []), ...(includeFcs ? fcsCheckpoints : [])];
		const years = new Set<number>([...earningsByYear.keys(), ...relevantCheckpoints.map((c) => yearOf(c.created))]);

		const currentYear = new Date().getUTCFullYear();
		const nowSeconds = Math.floor(Date.now() / 1000);

		const rows: ApiFpsYearlyRow[] = [];
		for (const year of years) {
			const yearEndSeconds = year >= currentYear ? nowSeconds : Date.UTC(year + 1, 0, 1) / 1000 - 1;
			const balance = combinedBalanceAt(yearEndSeconds);
			const value = (balance * priceAt(yearEndSeconds)) / 10n ** 18n;
			const yearEarnings = earningsByYear.get(year) ?? 0n;

			if (yearEarnings === 0n && balance === 0n && value === 0n) continue;

			rows.push({ year, earnings: yearEarnings.toString(), balance: balance.toString(), value: value.toString() });
		}

		return rows.sort((a, b) => b.year - a.year);
	}
}
