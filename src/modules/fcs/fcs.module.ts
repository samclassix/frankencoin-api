import { Module } from '@nestjs/common';
import { FcsController } from './fcs.controller';
import { FcsService } from './fcs.service';

@Module({
	controllers: [FcsController],
	providers: [FcsService],
	exports: [FcsService],
})
export class FcsModule {}
