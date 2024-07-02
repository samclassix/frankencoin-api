// CORE IMPORTS
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

// SERVICE IMPORTS
import { EcosystemFrankencoinService } from 'ecosystem/ecosystem.frankencoin.service';
import { EcosystemCollateralService } from 'ecosystem/ecosystem.collateral.service';
import { PositionsService } from 'positions/positions.service';
import { PricesService } from 'prices/prices.service';
import { ChallengesService } from 'challenges/challenges.service';

// CONTROLLER IMPORTS
import { EcosystemFrankencoinController } from 'ecosystem/ecosystem.frankencoin.controller';
import { EcosystemCollateralController } from 'ecosystem/ecosystem.collateral.controller';
import { PositionsController } from 'positions/positions.controller';
import { PricesController } from 'prices/prices.controller';
import { ChallengesController } from 'challenges/challenges.controller';
import { MintinghubController } from 'mintinghub/mintinghub.controller';

// APP MODULE
@Module({
	imports: [ConfigModule.forRoot(), ScheduleModule.forRoot()],
	controllers: [
		EcosystemFrankencoinController,
		EcosystemCollateralController,
		PositionsController,
		PricesController,
		ChallengesController,
		MintinghubController,
	],
	providers: [EcosystemFrankencoinService, EcosystemCollateralService, PositionsService, PricesService, ChallengesService],
})
export class AppModule {}
