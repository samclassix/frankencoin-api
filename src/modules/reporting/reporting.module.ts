import { Module } from '@nestjs/common';
import { AnalyticsModule } from 'modules/analytics/analytics.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
	imports: [AnalyticsModule],
	controllers: [ReportingController],
	providers: [ReportingService],
	exports: [ReportingService],
})
export class ReportingModule {}
