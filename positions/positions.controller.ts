import { Controller, Get } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { OwnersPositionsQueryObject, PositionQuery, PositionsQueryObject } from './positions.types';
import { Address } from 'viem';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Positions Controller')
@Controller('positions')
export class PositionsController {
	constructor(private readonly positionsService: PositionsService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of all positions',
	})
	getPositions(): PositionsQueryObject {
		const pos = this.positionsService.getPositions();
		return { num: Object.keys(pos).length, positions: pos };
	}

	@Get('open')
	@ApiResponse({
		description: 'Returns a list of open positions',
	})
	getOpenPositions(): PositionsQueryObject {
		const pos = this.positionsService.getPositions();
		const open = Object.values(pos).filter((p) => !p.closed && !p.denied);
		const mapped: { [key: Address]: PositionQuery } = {};
		for (const p of open) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, positions: mapped };
	}

	@Get('requests')
	@ApiResponse({
		description: 'Returns a list of requested positions (default: less then 5 days old)',
	})
	getRequestPositions(): PositionsQueryObject {
		// FIXME: make time diff flexable, changeable between chains/SC
		const TIMEDIFF_MS = 5 * 24 * 60 * 60 * 1000;
		const pos = this.positionsService.getPositions();
		const request = Object.values(pos).filter((p) => p.start * 1000 + TIMEDIFF_MS > Date.now());
		const mapped: { [key: Address]: PositionQuery } = {};
		for (const p of request) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, positions: mapped };
	}

	@Get('owners')
	@ApiResponse({
		description: 'Returns a list of positions grouped by owner',
	})
	getCollateral(): OwnersPositionsQueryObject {
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
