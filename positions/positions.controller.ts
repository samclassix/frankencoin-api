import { Controller, Get } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { ApiPositionsListing, ApiPositionsOwners } from './positions.types';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Positions Controller')
@Controller('positions')
export class PositionsController {
	constructor(private readonly positionsService: PositionsService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of all positions',
	})
	getList(): ApiPositionsListing {
		return this.positionsService.getPositionsList();
	}

	@Get('open')
	@ApiResponse({
		description: 'Returns a list of open positions',
	})
	getOpen(): ApiPositionsListing {
		return this.positionsService.getPositionsOpen();
	}

	@Get('requests')
	@ApiResponse({
		description: 'Returns a list of requested positions (default: less then 5 days old)',
	})
	getRequestPositions(): ApiPositionsListing {
		return this.positionsService.getPositionsRequests();
	}

	@Get('owners')
	@ApiResponse({
		description: 'Returns a list of positions grouped by owner',
	})
	getOwners(): ApiPositionsOwners {
		return this.positionsService.getPositionsOwners();
	}
}
