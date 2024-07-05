import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { VIEM_CONFIG } from 'api.config';
import { ChallengesService } from 'challenges/challenges.service';
import { EcosystemFpsService } from 'ecosystem/ecosystem.fps.service';
import { EcosystemFrankencoinService } from 'ecosystem/ecosystem.frankencoin.service';
import { PositionsService } from 'positions/positions.service';
import { PricesService } from 'prices/prices.service';

@Injectable()
export class ApiService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedBlockheight: number = 0;

	constructor(
		private readonly positions: PositionsService,
		private readonly prices: PricesService,
		private readonly frankencoin: EcosystemFrankencoinService,
		private readonly fps: EcosystemFpsService,
		private readonly challenges: ChallengesService
	) {
		setTimeout(() => this.updateBlockheight(), 100);
	}

	async updateWorkflow() {
		this.logger.log(`Fetched blockheight: ${this.fetchedBlockheight}`);
		const promises = [
			this.positions.updatePositons(),
			this.prices.updatePrices(),
			this.frankencoin.updateEcosystemKeyValues(),
			this.frankencoin.updateEcosystemMintBurnMapping(),
			this.fps.updateFpsInfo(),
			this.challenges.updateChallenges(),
			this.challenges.updateBids(),
		];

		return Promise.all(promises);
	}

	@Interval(5_000)
	async updateBlockheight() {
		const tmp: number = parseInt((await VIEM_CONFIG.getBlockNumber()).toString());
		if (tmp > this.fetchedBlockheight) {
			this.fetchedBlockheight = tmp;
			await this.updateWorkflow();
		}
	}
}
