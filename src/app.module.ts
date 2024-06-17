// CORE IMPORTS
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// APP IMPORTS
import { AppController } from './app.controller';
import { AppService } from './app.service';

// MODULES IMPORTS

@Module({
	imports: [ScheduleModule.forRoot()],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
