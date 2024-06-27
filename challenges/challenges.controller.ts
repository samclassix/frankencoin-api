import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';

@ApiTags('Challenges Controller')
@Controller('challenges')
export class ChallengesController {
	constructor(private readonly challengesService: ChallengesService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of all challenges',
	})
	getChallenges() {
		const auc = this.challengesService.getChallenges();
		return { num: Object.keys(auc).length, challenges: auc };
	}
}
