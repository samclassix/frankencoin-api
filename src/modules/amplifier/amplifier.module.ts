import { Module } from '@nestjs/common';
import { DataSourceModule } from 'core/data-source/data-source.module';
import { AmplifierController } from './amplifier.controller';
import { AmplifierService } from './amplifier.service';

@Module({
	imports: [DataSourceModule],
	controllers: [AmplifierController],
	providers: [AmplifierService],
	exports: [AmplifierService],
})
export class AmplifierModule {}
