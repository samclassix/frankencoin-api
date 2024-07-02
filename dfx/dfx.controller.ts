import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EcosystemFpsService } from 'ecosystem/ecosystem.fps.service';
import { EcosystemFrankencoinService } from 'ecosystem/ecosystem.frankencoin.service';
import { EcosystemCollateralService } from 'ecosystem/ecosystem.collateral.service';

/**
 * 
 * {
  "totalSupplyZchf": 9151881.025188236, done
  "totalValueLockedInChf": 15931372.86543195, done
  "fpsMarketCapInChf": 11486515.603335824, here
}
 */

@ApiTags('DFX Controller')
@Controller('dfx')
export class DfxController {
	constructor(
		private readonly fps: EcosystemFpsService,
		private readonly frankencoin: EcosystemFrankencoinService,
		private readonly collateal: EcosystemCollateralService
	) {}

	@Get('info')
	@ApiResponse({
		description: 'Returns custom info for dfx',
	})
	async getDfxInfo() {
		const totalSupplyZchf = this.frankencoin.getEcosystemFrankencoinInfo().total.supply;
		const totalValueLockedInChf = this.collateal.getCollateralStats().totalValueLocked.chf;
		const fpsMarketCapInChf = (await this.fps.getEcosystemFpsInfo()).values.fpsMarketCapInChf;

		return {
			totalSupplyZchf,
			totalValueLockedInChf,
			fpsMarketCapInChf,
		};
	}
}
