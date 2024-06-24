import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ERC20Info, ERC20InfoObjectArray } from 'prices/prices.types';
import { PriceQueryObjectArray } from './prices.types';
import { PricesService } from './prices.service';

@ApiTags('Prices Controller')
@Controller('prices')
export class PricesController {
	constructor(private readonly pricesService: PricesService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of price queries',
	})
	getList(): PriceQueryObjectArray {
		return this.pricesService.getPrices();
	}

	@Get('mint')
	@ApiResponse({
		description: 'Returns ERC20 information about the mint token',
	})
	getMint(): ERC20Info {
		return this.pricesService.getMint();
	}

	@Get('collateral')
	@ApiResponse({
		description: 'Returns a list of ERC20 collateral token information',
	})
	getCollateral(): ERC20InfoObjectArray {
		return this.pricesService.getCollateral();
	}
}
