import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import {
	ApiBidsBidders,
	ApiBidsChallenges,
	ApiBidsListing,
	ApiBidsListingArray,
	ApiBidsPositions,
	ApiChallengesChallengers,
	ApiChallengesListing,
	ApiChallengesListingArray,
	ApiChallengesPositions,
	ApiChallengesPrices,
} from './challenges.types';

@ApiTags('Challenges Controller')
@Controller('challenges')
export class ChallengesController {
	constructor(private readonly challengesService: ChallengesService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of all challenges sorted by created timestamp.',
	})
	getChallengesListArray(): ApiChallengesListingArray {
		return this.challengesService.getChallengesArray();
	}

	@Get('mapping')
	@ApiResponse({
		description: 'Returns a mapped list (challengeId -> challenge) of all challenges.',
	})
	getChallengesList(): ApiChallengesListing {
		return this.challengesService.getChallenges();
	}

	@Get('challengers')
	@ApiResponse({
		description: 'Returns a mapped list (challenger -> challenge[]) for all challengers.',
	})
	getChallengesChallengers(): ApiChallengesChallengers {
		return this.challengesService.getChallengersMapping();
	}

	@Get('positions')
	@ApiResponse({
		description: 'Returns a mapped list (position -> challenge[]) for all positions.',
	})
	getChallengesPositions(): ApiChallengesPositions {
		return this.challengesService.getChallengesPositions();
	}

	@Get('prices')
	@ApiResponse({
		description: 'Returns a mapped list (challenge -> active auctionPrice) for all active challenges.',
	})
	getAuctionActivePrices(): ApiChallengesPrices {
		return this.challengesService.getChallengesPrices();
	}

	@Get('bids/list')
	@ApiResponse({
		description: '',
	})
	getChallengesBidsListing(): ApiBidsListingArray {
		return this.challengesService.getBidsArray();
	}

	@Get('bids/mapping')
	@ApiResponse({
		description: '',
	})
	getChallengesBids(): ApiBidsListing {
		return this.challengesService.getBids();
	}

	@Get('bids/bidders')
	@ApiResponse({
		description: '',
	})
	getChallengesBidsBidders(): ApiBidsBidders {
		return this.challengesService.getBidsBiddersMapping();
	}

	@Get('bids/challenges')
	@ApiResponse({
		description: '',
	})
	getChallengesBidsChallenges(): ApiBidsChallenges {
		return this.challengesService.getBidsChallengesMapping();
	}

	@Get('bids/positions')
	@ApiResponse({
		description: '',
	})
	getChallengesBidsPositions(): ApiBidsPositions {
		return this.challengesService.getBidsPositionsMapping();
	}
}
