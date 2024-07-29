import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EcosystemMinterService } from './ecosystem.minter.service';
import { ApiMinterListing, ApiMinterMapping } from './ecosystem.minter.types';

@ApiTags('Ecosystem Controller')
@Controller('ecosystem/frankencoin/minter')
export class PositionsController {
	constructor(private readonly minter: EcosystemMinterService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of all positions',
	})
	getList(): ApiMinterListing {
		return this.minter.getMintersList();
	}

	@Get('mapping')
	@ApiResponse({
		description: 'Returns a mapping of all positions',
	})
	getMapping(): ApiMinterMapping {
		return this.minter.getMintersMapping();
	}
}
