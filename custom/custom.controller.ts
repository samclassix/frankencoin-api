import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EcosystemFpsService } from 'ecosystem/ecosystem.fps.service';
import { EcosystemFrankencoinService } from 'ecosystem/ecosystem.frankencoin.service';
import { EcosystemCollateralService } from 'ecosystem/ecosystem.collateral.service';

@ApiTags('Custom Controller')
@Controller('custom')
export class CustomController {
	constructor(
		private readonly fps: EcosystemFpsService,
		private readonly frankencoin: EcosystemFrankencoinService,
		private readonly collateal: EcosystemCollateralService
	) {}

	@Get('info')
	@ApiResponse({
		description: 'Returns custom info',
	})
	async getCustomInfo() {
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
