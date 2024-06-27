import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { gql } from '@apollo/client/core';
import { PONDER_CLIENT } from 'app.config';

@Injectable()
export class ChallengesService {
	private readonly logger = new Logger(this.constructor.name);
	// FIXME: type this correctly
	private fetchedChallenges: any = {};

	constructor() {
		setTimeout(() => this.updateChallenges(), 100);
	}

	getChallenges() {
		return this.fetchedChallenges;
	}

	@Interval(10_000)
	async updateChallenges() {
		this.logger.debug('Updating challenges');
		const { data } = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query {
					challenges(orderBy: "status", orderDirection: "desc") {
						items {
							id
							position
							challenger
							start
							duration
							size
							filledSize
							acquiredCollateral
							number
							bid
							status
						}
					}
				}
			`,
		});

		if (!data || !data.challenges) {
			this.logger.warn('No challenge found.');
			return;
		}

		// mod

		// sort
		// challenges.sort((a, b) => {
		// 	if (a.status === b.status) return a.start > b.start ? 1 : -1;
		// 	else return a.status > b.status ? 1 : -1;
		// });

		// update/merge
		this.fetchedChallenges = data.challenges.items;
	}
}
