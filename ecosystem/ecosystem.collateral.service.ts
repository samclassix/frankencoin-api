import { Injectable, Logger } from '@nestjs/common';
import { PositionsService } from 'positions/positions.service';
import { PricesService } from 'prices/prices.service';
import {
	ApiEcosystemCollateralList,
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralPositionsDetails,
	ApiEcosystemCollateralStats,
	ApiEcosystemCollateralStatsItem,
} from './ecosystem.collateral.types';
import { PositionQuery } from 'positions/positions.types';
import { Address } from 'viem';
import { FIVEDAYS_MS } from 'utils/const-helper';
import { PriceQueryCurrencies } from 'prices/prices.types';

@Injectable()
export class EcosystemCollateralService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(
		private readonly positionsService: PositionsService,
		private readonly pricesService: PricesService
	) {}

	getCollateralList(): ApiEcosystemCollateralList {
		const c = this.pricesService.getCollateral();
		return {
			num: Object.keys(c).length,
			list: c,
		};
	}

	getCollateralPositions(): ApiEcosystemCollateralPositions {
		const positions = Object.values(this.positionsService.getPositionsList().list);
		const collaterals = this.pricesService.getCollateral();
		const collateralPositions: ApiEcosystemCollateralPositions = {};

		for (const c of Object.values(collaterals)) {
			const matchedPositions = positions.filter((p: PositionQuery) => p.collateral === c.address);
			if (!collateralPositions[c.address.toLowerCase()]) collateralPositions[c.address.toLowerCase()] = [];
			const addresses: Address[] = matchedPositions.map((p: PositionQuery) => p.position);
			collateralPositions[c.address.toLowerCase()] = {
				...c,
				num: addresses.length,
				addresses: addresses,
			};
		}

		return collateralPositions;
	}

	getCollateralPositionsDetails(): ApiEcosystemCollateralPositionsDetails {
		const positions = Object.values(this.positionsService.getPositionsList().list);
		const collaterals = this.pricesService.getCollateral();
		const collateralPositions: ApiEcosystemCollateralPositionsDetails = {};

		for (const c of Object.values(collaterals)) {
			const matchedPositions = positions.filter((p: PositionQuery) => p.collateral === c.address);
			if (!collateralPositions[c.address.toLowerCase()]) collateralPositions[c.address.toLowerCase()] = [];
			const addresses: Address[] = matchedPositions.map((p: PositionQuery) => p.position);
			collateralPositions[c.address.toLowerCase()] = {
				...c,
				num: addresses.length,
				addresses: addresses,
				positions: matchedPositions,
			};
		}

		return collateralPositions;
	}

	getCollateralStats(): ApiEcosystemCollateralStats {
		const collateralPositionsDetails = this.getCollateralPositionsDetails();
		const prices = this.pricesService.getPrices();

		const zchfAddress = this.pricesService.getMint()?.address;
		if (!zchfAddress) return null;
		const zchfPrice = prices[zchfAddress.toLowerCase()]?.price?.usd;
		if (!zchfPrice) return null;

		const ecosystemTotalValueLocked: PriceQueryCurrencies = {};
		const map: { [key: Address]: ApiEcosystemCollateralStatsItem } = {};

		for (const c of Object.values(collateralPositionsDetails)) {
			const price = prices[c.address.toLowerCase()]?.price?.usd;
			if (!price) continue;

			const total = c.positions.length;
			const open = c.positions.filter((p: PositionQuery) => !p.closed && !p.denied).length;
			const requested = c.positions.filter((p: PositionQuery) => p.start * 1000 + FIVEDAYS_MS > Date.now()).length;
			const closed = c.positions.filter((p: PositionQuery) => p.closed).length;
			const denied = c.positions.filter((p: PositionQuery) => p.denied).length;
			const originals = c.positions.filter((p: PositionQuery) => p.isOriginal).length;
			const clones = c.positions.filter((p: PositionQuery) => p.isClone).length;
			const totalBalance = c.positions.reduce((a: number, b: PositionQuery) => a + parseInt(b.collateralBalance), 0);
			const totalValueLocked: PriceQueryCurrencies = {
				usd: (totalBalance / 10 ** c.decimals) * price,
				chf: ((totalBalance / 10 ** c.decimals) * price) / zchfPrice,
			};

			// upsert ecosystemTotalValueLocked usd
			if (!ecosystemTotalValueLocked.usd) {
				ecosystemTotalValueLocked.usd = totalValueLocked.usd;
			} else {
				ecosystemTotalValueLocked.usd += totalValueLocked.usd;
			}

			// upsert ecosystemTotalValueLocked chf
			if (!ecosystemTotalValueLocked.chf) {
				ecosystemTotalValueLocked.chf = totalValueLocked.chf;
			} else {
				ecosystemTotalValueLocked.chf += totalValueLocked.chf;
			}

			// upsert map
			map[c.address.toLowerCase()] = {
				address: c.address,
				name: c.name,
				symbol: c.symbol,
				decimals: c.decimals,
				positions: {
					total,
					open,
					requested,
					closed,
					denied,
					originals,
					clones,
				},
				totalBalance: {
					raw: totalBalance,
					amount: totalBalance / 10 ** c.decimals,
				},
				totalValueLocked,
				price: {
					usd: price,
					chf: Math.round((price / zchfPrice) * 100) / 100,
				},
			};
		}

		return {
			num: Object.keys(collateralPositionsDetails).length,
			addresses: Object.keys(collateralPositionsDetails) as Address[],
			totalValueLocked: ecosystemTotalValueLocked,
			map,
		};
	}
}
