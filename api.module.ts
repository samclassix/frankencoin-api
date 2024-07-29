// CORE IMPORTS
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

// SERVICE IMPORTS
import { ApiService } from 'api.service';
import { EcosystemCollateralService } from 'ecosystem/ecosystem.collateral.service';
import { EcosystemFpsService } from 'ecosystem/ecosystem.fps.service';
import { EcosystemFrankencoinService } from 'ecosystem/ecosystem.frankencoin.service';
import { EcosystemMinterService } from 'ecosystem/ecosystem.minter.service';
import { PositionsService } from 'positions/positions.service';
import { PricesService } from 'prices/prices.service';
import { ChallengesService } from 'challenges/challenges.service';
import { TelegramService } from 'telegram/telegram.service';

// CONTROLLER IMPORTS
import { EcosystemCollateralController } from 'ecosystem/ecosystem.collateral.controller';
import { EcosystemFpsController } from 'ecosystem/ecosystem.fps.controller';
import { EcosystemFrankencoinController } from 'ecosystem/ecosystem.frankencoin.controller';
import { PositionsController } from 'positions/positions.controller';
import { PricesController } from 'prices/prices.controller';
import { ChallengesController } from 'challenges/challenges.controller';

// APP MODULE
@Module({
	imports: [ConfigModule.forRoot(), ScheduleModule.forRoot()],
	controllers: [
		EcosystemCollateralController,
		EcosystemFpsController,
		EcosystemFrankencoinController,
		PositionsController,
		PricesController,
		ChallengesController,
	],
	providers: [
		ApiService,
		EcosystemMinterService,
		EcosystemCollateralService,
		EcosystemFpsService,
		EcosystemFrankencoinService,
		PositionsService,
		PricesService,
		ChallengesService,
		TelegramService,
	],
})
export class AppModule {}
