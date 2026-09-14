import { Injectable, Logger } from '@nestjs/common';
import { VIEM_CONFIG } from 'app.config';
import { ADDRESS, FCSABI } from '@frankencoin/zchf';
import { mainnet } from 'viem/chains';
import { formatFloat } from 'utils/format';
import { ApiFcsDiscount, ApiFcsInfo } from './fcs.types';

@Injectable()
export class FcsService {
	private readonly logger = new Logger(this.constructor.name);
	private fcsInfo: ApiFcsInfo;
	private fcsDiscount: ApiFcsDiscount;

	getFcsInfo(): ApiFcsInfo {
		return this.fcsInfo;
	}

	getFcsDiscount(): ApiFcsDiscount {
		return this.fcsDiscount;
	}

	async updateFcsInfo() {
		this.logger.debug('Updating FcsInfo');

		const chainId = mainnet.id;
		const addr = ADDRESS[chainId].fcs;
		const contract = { address: addr, abi: FCSABI, chainId } as const;

		const [ask, bid, totalAssets, totalSupply, isBinding] = await Promise.all([
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'ask' }),
			// bid() divides by (totalSupply + recentRedemptions) and can revert while FCS supply is 0
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'bid' }).catch(() => 0n),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'totalAssets' }),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'totalSupply' }),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'isBinding' }),
		]);

		this.fcsInfo = {
			erc20: {
				name: 'Frankencoin Share',
				symbol: 'FCS',
				decimals: 18,
			},
			chain: {
				chainId,
				address: addr,
			},
			token: {
				ask: formatFloat(ask),
				bid: formatFloat(bid),
				totalAssets: formatFloat(totalAssets),
				totalSupply: formatFloat(totalSupply),
				isBinding,
			},
		};
	}

	async updateFcsDiscount() {
		this.logger.debug('Updating FcsDiscount');

		const chainId = mainnet.id;
		const addr = ADDRESS[chainId].fcs;
		const contract = { address: addr, abi: FCSABI, chainId } as const;

		const [discount, recentlyRedeemed, weightedRecentRedemptions, redemptionAnchor, recoveryPeriod] = await Promise.all([
			// same zero-supply revert risk as bid() above (currentDiscount(0) is the marginal discount)
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'currentDiscount', args: [0n] }).catch(() => 10n ** 18n),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'recentlyRedeemed' }),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'weightedRecentRedemptions' }),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'redemptionAnchor' }),
			VIEM_CONFIG[chainId].readContract({ ...contract, functionName: 'RECOVERY_PERIOD' }),
		]);

		const recoveryCountdown = Number(redemptionAnchor) + Number(recoveryPeriod) - Math.floor(Date.now() / 1000);

		this.fcsDiscount = {
			discount: formatFloat(discount),
			recentlyRedeemed: recentlyRedeemed.toString(),
			weightedRecentRedemptions: weightedRecentRedemptions.toString(),
			redemptionAnchor: Number(redemptionAnchor),
			recoveryPeriodSeconds: Number(recoveryPeriod),
			recoveryCountdownSeconds: Math.max(0, recoveryCountdown),
		};
	}
}
