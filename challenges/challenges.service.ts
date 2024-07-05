import { Injectable, Logger } from '@nestjs/common';
import { gql } from '@apollo/client/core';
import { PONDER_CLIENT } from 'api.config';
import {
	ApiBidsBidders,
	ApiBidsChallenges,
	ApiBidsListing,
	ApiBidsPositions,
	ApiChallengesChallengers,
	ApiChallengesListing,
	ApiChallengesPositions,
	BidsBidderMapping,
	BidsChallengesMapping,
	BidsPositionsMapping,
	BidsQueryItem,
	BidsQueryItemMapping,
	ChallengesChallengersMapping,
	ChallengesPositionsMapping,
	ChallengesQueryItem,
	ChallengesQueryItemMapping,
} from './challenges.types';
import { Address } from 'viem';

@Injectable()
export class ChallengesService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedChallenges: ChallengesQueryItemMapping = {};
	private fetchedBids: BidsQueryItemMapping = {};

	constructor() {}

	getChallenges(): ApiChallengesListing {
		return {
			num: Object.keys(this.fetchedChallenges).length,
			list: this.fetchedChallenges,
		};
	}

	getChallengersMapping(): ApiChallengesChallengers {
		const challengersMapping: ChallengesChallengersMapping = {};
		for (const challenge of Object.values(this.fetchedChallenges)) {
			if (!challengersMapping[challenge.challenger.toLowerCase()]) {
				challengersMapping[challenge.challenger.toLowerCase()] = [];
			}
			challengersMapping[challenge.challenger.toLowerCase()].push(challenge);
		}

		return {
			num: Object.keys(challengersMapping).length,
			challengers: Object.keys(challengersMapping) as Address[],
			map: challengersMapping,
		};
	}

	getChallengesPositions(): ApiChallengesPositions {
		const positionsMapping: ChallengesPositionsMapping = {};
		for (const challenge of Object.values(this.fetchedChallenges)) {
			if (!positionsMapping[challenge.position.toLowerCase()]) {
				positionsMapping[challenge.position.toLowerCase()] = [];
			}
			positionsMapping[challenge.position.toLowerCase()].push(challenge);
		}

		return {
			num: Object.keys(positionsMapping).length,
			positions: Object.keys(positionsMapping) as Address[],
			map: positionsMapping,
		};
	}

	getBids(): ApiBidsListing {
		return {
			num: Object.keys(this.fetchedBids).length,
			list: this.fetchedBids,
		};
	}

	// bids/bidders
	getBidsBiddersMapping(): ApiBidsBidders {
		const biddersMapping: BidsBidderMapping = {};
		for (const bid of Object.values(this.fetchedBids)) {
			if (!biddersMapping[bid.bidder.toLowerCase()]) {
				biddersMapping[bid.bidder.toLowerCase()] = [];
			}
			biddersMapping[bid.bidder.toLowerCase()].push(bid);
		}

		return {
			num: Object.keys(biddersMapping).length,
			bidders: Object.keys(biddersMapping) as Address[],
			map: biddersMapping,
		};
	}

	// bids/mapping
	getBidsChallengesMapping(): ApiBidsChallenges {
		const challengesMapping: BidsChallengesMapping = {};
		for (const bid of Object.values(this.fetchedBids)) {
			const challengeId = `${bid.position.toLowerCase()}-challenge-${bid.number}`;
			if (!challengesMapping[challengeId]) {
				challengesMapping[challengeId] = [];
			}
			challengesMapping[challengeId].push(bid);
		}

		return {
			num: Object.keys(challengesMapping).length,
			challenges: Object.keys(challengesMapping) as Address[],
			map: challengesMapping,
		};
	}

	// bids/positions
	getBidsPositionsMapping(): ApiBidsPositions {
		const positionsMapping: BidsPositionsMapping = {};
		for (const bid of Object.values(this.fetchedBids)) {
			const key = bid.position.toLowerCase();
			if (!positionsMapping[key]) {
				positionsMapping[key] = [];
			}
			positionsMapping[key].push(bid);
		}

		return {
			num: Object.keys(positionsMapping).length,
			positions: Object.keys(positionsMapping) as Address[],
			map: positionsMapping,
		};
	}

	async updateChallenges() {
		this.logger.debug('Updating challenges');
		const challenges = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query {
					challenges(orderBy: "created", orderDirection: "desc") {
						items {
							id
							position
							number
							challenger
							start
							created
							duration
							size
							bids
							filledSize
							acquiredCollateral
							status
						}
					}
				}
			`,
		});

		if (!challenges.data || !challenges.data.challenges) {
			this.logger.warn('No challenge found.');
			return;
		}

		// mapping
		const challengesQueryItems = challenges.data.challenges.items as ChallengesQueryItem[];
		const mapped: ChallengesQueryItemMapping = {};
		for (const i of challengesQueryItems) {
			mapped[i.id] = i;
		}

		// upsert
		this.fetchedChallenges = { ...this.fetchedChallenges, ...mapped };
	}

	async updateBids() {
		this.logger.debug('Updating bids');
		const bids = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query {
					challengeBids(orderBy: "created", orderDirection: "desc") {
						items {
							id
							position
							number
							numberBid
							bidder
							created
							bidType
							price
							filledSize
							acquiredCollateral
							challengeSize
						}
					}
				}
			`,
		});

		if (!bids.data || !bids.data.challengeBids) {
			this.logger.warn('No bids found.');
			return;
		}

		// mapping
		const bidsQueryItems = bids.data.challengeBids.items as BidsQueryItem[];
		const mapped: BidsQueryItemMapping = {};
		for (const i of bidsQueryItems) {
			mapped[i.id] = i;
		}

		// upsert
		this.fetchedBids = { ...this.fetchedBids, ...mapped };
	}
}
