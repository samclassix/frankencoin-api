import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EcosystemCollateralService } from './ecosystem.collateral.service';
import {
	ApiEcosystemCollateralList,
	ApiEcosystemCollateralPositions,
	ApiEcosystemCollateralPositionsDetails,
	ApiEcosystemCollateralStats,
} from './ecosystem.collateral.types';

@ApiTags('Ecosystem Controller')
@Controller('ecosystem/collateral')
export class EcosystemCollateralController {
	constructor(private readonly collateral: EcosystemCollateralService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of ERC20 information about collateral token',
	})
	getCollateralList(): ApiEcosystemCollateralList {
		return this.collateral.getCollateralList();
	}

	@Get('positions')
	@ApiResponse({
		description: 'Returns a list of collateral addresses mapped to positions.',
	})
	getCollateralPositions(): ApiEcosystemCollateralPositions {
		return this.collateral.getCollateralPositions();
	}

	@Get('positions/details')
	@ApiResponse({
		description: 'Returns a list of collateral addresses mapped to positions, with position details.',
	})
	getCollateralPositionsDetails(): ApiEcosystemCollateralPositionsDetails {
		return this.collateral.getCollateralPositionsDetails();
	}

	@Get('stats')
	@ApiResponse({
		description: 'Returns a map of collateral addresses mapped to stats.',
	})
	getCollateralStats(): ApiEcosystemCollateralStats {
		return this.collateral.getCollateralStats();
	}
}
