import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ERC20Info, ERC20InfoObjectArray, PriceQueryCurrencies, PriceQueryObjectArray } from './prices.types';
import { PositionsService } from 'positions/positions.service';
import { COINGECKO_CLIENT, VIEM_CHAIN, VIEM_CONFIG } from 'app.config';
import { Address } from 'viem';
import { EquityABI } from 'contracts/abis/Equity';

const randRef: number = Math.random() * 0.4 + 0.8;

@Injectable()
export class PricesService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedPrices: PriceQueryObjectArray = {};

	constructor(private readonly positionsService: PositionsService) {
		setTimeout(() => this.updatePrices(), 1000);
	}

	async fetchSourcesCoingecko(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		if ((VIEM_CHAIN.id as number) === 1) {
			// override for Frankencoin Pool Share
			if (erc.address.toLowerCase() === '0x1ba26788dfde592fec8bcb0eaff472a42be341b2') {
				const fetchedPrice = await VIEM_CONFIG.readContract({
					address: erc.address,
					abi: EquityABI,
					functionName: 'price',
				});
				// TODO: convert price from USD to ZCHF,
				const price = Math.round((parseInt(fetchedPrice.toString()) / 10 ** erc.decimals) * 100) / 100;
				return { usd: price };
			}
			// all other mainnet addresses
			const url = `/api/v3/simple/token_price/ethereum?contract_addresses=${erc.address}&vs_currencies=usd`;
			const data = await (await COINGECKO_CLIENT(url)).json();
			if (data.status) {
				this.logger.debug(data.status?.error_message || 'Error fetching price from coingecko');
				return null;
			}
			return Object.values(data)[0] as { usd: number };
		} else {
			const calc = (value: number) => {
				const ref: number = 1718033809979;
				return value * randRef * (1 + ((Date.now() - ref) / (3600 * 24 * 365)) * 0.001 + Math.random() * 0.01);
			};

			// TODO: for developer, this is just for testnet soft price mapping
			let price = { usd: calc(1) };
			if (erc.symbol === 'ZCHF') price = { usd: calc(1.12) };
			if (erc.symbol === 'WBTC') price = { usd: calc(69000) };
			if (erc.symbol === 'WETH') price = { usd: calc(3800) };
			if (erc.symbol === 'UNI') price = { usd: calc(10.54) };
			if (erc.symbol === 'SUP') price = { usd: calc(12453) };
			if (erc.symbol === 'BOSS') price = { usd: calc(11.54) };
			if (erc.symbol === 'BEES') price = { usd: calc(16) };
			return price;
		}
	}

	getMint(): ERC20Info {
		const p = Object.values(this.positionsService.getPositions())[0];
		if (!p) return null;
		return {
			address: p.zchf,
			name: p.zchfName,
			symbol: p.zchfSymbol,
			decimals: p.zchfDecimals,
		};
	}

	getCollateral(): ERC20InfoObjectArray {
		const pos = Object.values(this.positionsService.getPositions());
		const c: ERC20InfoObjectArray = {};

		for (const p of pos) {
			c[p.collateral.toLowerCase()] = {
				address: p.collateral,
				name: p.collateralName,
				symbol: p.collateralSymbol,
				decimals: p.collateralDecimals,
			};
		}

		return c;
	}

	getPrices(): PriceQueryObjectArray {
		return this.fetchedPrices;
	}

	@Interval(10_000)
	async updatePrices() {
		this.logger.debug('Updating Prices');

		const m = this.getMint();
		const c = this.getCollateral();

		if (!m || Object.values(c).length == 0) return;
		const a = [m, ...Object.values(c)];

		const pricesQuery: PriceQueryObjectArray = {};
		let pricesQueryNewCount: number = 0;
		let pricesQueryNewCountFailed: number = 0;
		let pricesQueryUpdateCount: number = 0;
		let pricesQueryUpdateCountFailed: number = 0;

		for (const erc of a) {
			const oldEntry = this.fetchedPrices[erc.address.toLowerCase() as Address];

			if (!oldEntry) {
				pricesQueryNewCount += 1;
				this.logger.debug(`Price for ${erc.name} not available, trying to fetch from coingecko`);
				const price = await this.fetchSourcesCoingecko(erc);
				if (!price) pricesQueryNewCountFailed += 1;

				pricesQuery[erc.address.toLowerCase() as Address] = {
					...erc,
					timestamp: price === null ? 0 : Date.now(),
					price: price === null ? { usd: 1 } : price,
				};
				continue;
			}

			// needs to update => try to fetch
			if (oldEntry.timestamp + 120_000 < Date.now()) {
				pricesQueryUpdateCount += 1;
				this.logger.debug(`Price for ${erc.name} out of date, trying to fetch from coingecko`);
				const price = await this.fetchSourcesCoingecko(erc);

				if (!price) {
					pricesQueryUpdateCountFailed += 1;
					continue;
				}

				pricesQuery[erc.address.toLowerCase() as Address] = {
					...erc,
					timestamp: Date.now(),
					price,
				};
			}
		}

		const updatesCnt = pricesQueryNewCount + pricesQueryUpdateCount;
		const fromNewStr = `from new ${pricesQueryNewCount - pricesQueryNewCountFailed} / ${pricesQueryNewCount}`;
		const fromUpdateStr = `from update ${pricesQueryUpdateCount - pricesQueryUpdateCountFailed} / ${pricesQueryUpdateCount}`;

		if (updatesCnt > 0) this.logger.log(`Prices merging, ${fromNewStr}, ${fromUpdateStr}`);
		this.fetchedPrices = { ...this.fetchedPrices, ...pricesQuery };
	}
}
