// CORE IMPORTS
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// SERVICE IMPORTS
import { PositionsService } from './positions/positions.service';
import { PricesService } from './prices/prices.service';

// CONTROLLER IMPORTS
import { PositionsController } from './positions/positions.controller';
import { PricesController } from './prices/prices.controller';
import { MintinghubController } from './mintinghub/mintinghub.controller';

// APP MODULE
@Module({
	imports: [ScheduleModule.forRoot()],
	controllers: [PositionsController, PricesController, MintinghubController],
	providers: [PositionsService, PricesService],
})
export class AppModule {}
