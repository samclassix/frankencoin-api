import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ERC20Info, ERC20InfoObjectArray } from 'prices/prices.types';
import { PriceQueryObjectArray } from './prices.types';
import { PricesService } from './prices.service';

@ApiTags('Prices Controller')
@Controller('prices')
export class PricesController {
	constructor(private readonly pricesService: PricesService) {}

	@Get('list')
	getList(): PriceQueryObjectArray {
		return this.pricesService.getPrices();
	}

	@Get('mint')
	getMint(): ERC20Info {
		return this.pricesService.getMint();
	}

	@Get('collateral')
	getCollateral(): ERC20InfoObjectArray {
		return this.pricesService.getCollateral();
	}
}
