import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FcsService } from './fcs.service';
import { ApiFcsDiscount, ApiFcsInfo } from './fcs.types';

@ApiTags('FCS Controller')
@Controller('fcs')
export class FcsController {
	constructor(private readonly fcs: FcsService) {}

	@Get('info')
	@ApiOperation({
		summary: 'Get FCS token information',
		description:
			'Returns: ApiFcsInfo, mainnet-only price (ask/bid), totalAssets, totalSupply, and binding status for the Frankencoin Share (FCS) token. ' +
			'FCS wraps FPS1 1:1, so its ask price tracks FPS1.price() directly; bid reflects the current redemption discount.',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns FCS token information',
		schema: {
			type: 'ApiFcsInfo',
			example: {
				erc20: { name: 'Frankencoin Share', symbol: 'FCS', decimals: 18 },
				chain: { chainId: 1, address: '0x0000000000000000000000000000000000000000' },
				token: { ask: 1234.49, bid: 1200.0, totalAssets: 500000, totalSupply: 405, isBinding: false },
			},
		},
	})
	getInfo(): ApiFcsInfo {
		return this.fcs.getFcsInfo();
	}

	@Get('discount')
	@ApiOperation({
		summary: 'Get FCS redemption discount',
		description:
			'Returns: ApiFcsDiscount, the current marginal redemption discount factor and the recovery countdown until recent redemptions decay back to zero, ' +
			'so the frontend does not have to reimplement the bonding-curve math from FCSMintRedeem.sol.',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns FCS discount information',
		schema: {
			type: 'ApiFcsDiscount',
			example: {
				discount: 0.92,
				recentlyRedeemed: '15000000000000000000',
				weightedRecentRedemptions: '9800000000000000000',
				redemptionAnchor: 1757260800,
				recoveryPeriodSeconds: 604800,
				recoveryCountdownSeconds: 349213,
			},
		},
	})
	getDiscount(): ApiFcsDiscount {
		return this.fcs.getFcsDiscount();
	}
}
