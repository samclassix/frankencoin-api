import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EcosystemFrankencoinService } from './ecosystem.frankencoin.service';
import { ApiEcosystemFrankencoinInfo, ApiEcosystemMintBurnMapping } from './ecosystem.frankencoin.types';

/**
 * 
 * {
  "totalSupplyZchf": 9151881.025188236,
  "totalValueLockedInChf": 15931372.86543195,
  "fpsMarketCapInChf": 11486515.603335824
}
 */

@ApiTags('Ecosystem Controller')
@Controller('ecosystem/frankencoin')
export class EcosystemFrankencoinController {
	constructor(private readonly frankencoin: EcosystemFrankencoinService) {}

	@Get('info')
	@ApiResponse({
		description: 'Returns Frankencoin Info from.',
	})
	getFrankencoinInfo(): ApiEcosystemFrankencoinInfo {
		return this.frankencoin.getEcosystemFrankencoinInfo();
	}

	@Get('mintburnmapping')
	@ApiResponse({
		description: 'Returns mintburnmapping of frankencoin.',
	})
	getFrankencoinMintBurnMapping(): ApiEcosystemMintBurnMapping {
		return this.frankencoin.getEcosystemMintBurnMapping();
	}
}
