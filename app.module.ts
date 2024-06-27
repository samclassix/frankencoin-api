// CORE IMPORTS
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// SERVICE IMPORTS
import { PositionsService } from 'positions/positions.service';
import { PricesService } from 'prices/prices.service';
import { ChallengesService } from 'challenges/challenges.service';

// CONTROLLER IMPORTS
import { PositionsController } from 'positions/positions.controller';
import { PricesController } from 'prices/prices.controller';
import { ChallengesController } from 'challenges/challenges.controller';
import { MintinghubController } from 'mintinghub/mintinghub.controller';

// APP MODULE
@Module({
	imports: [ScheduleModule.forRoot()],
	controllers: [PositionsController, PricesController, ChallengesController, MintinghubController],
	providers: [PositionsService, PricesService, ChallengesService],
})
export class AppModule {}
