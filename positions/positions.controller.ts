import { Controller, Get } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionQuery, PositionsQueryObjectArray } from './positions.types';
import { ApiTags } from '@nestjs/swagger';
import { Address } from 'viem';

@ApiTags('Positions Controller')
@Controller('positions')
export class PositionsController {
	constructor(private readonly positionsService: PositionsService) {}

	@Get('list')
	getPositionsObject(): PositionsQueryObjectArray {
		return this.positionsService.getPositions();
	}

	@Get('owners')
	getCollateral() {
		const pos = this.positionsService.getPositions();
		const ow: { [key: Address]: PositionQuery[] } = {};
		for (const p of Object.values(pos)) {
			if (!ow[p.owner]) ow[p.owner] = [];
			ow[p.owner].push(p);
		}
		return {
			num: Object.keys(ow).length,
			owners: Object.keys(ow) as Address[],
			positions: ow,
		};
	}
}
