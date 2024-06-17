import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PositionsService } from 'src/positions/positions.service';

@ApiTags('MintingHub Controller')
@Controller('mintinghub')
export class MintinghubController {
	constructor(private readonly positionsService: PositionsService) {}
}
