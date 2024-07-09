import { Injectable, Logger } from '@nestjs/common';
import { gql } from '@apollo/client/core';
import { PONDER_CLIENT, VIEM_CONFIG } from 'api.config';
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
	BidsBidderMapping,
	BidsChallengesMapping,
	BidsId,
	BidsPositionsMapping,
	BidsQueryItem,
	BidsQueryItemMapping,
	ChallengesChallengersMapping,
	ChallengesId,
	ChallengesPositionsMapping,
	ChallengesPricesMapping,
	ChallengesQueryItem,
	ChallengesQueryItemMapping,
	ChallengesQueryStatus,
} from './challenges.types';
import { Address } from 'viem';
import { MintingHubABI } from 'contracts/abis/MintingHub';
import { ADDRESS } from 'contracts';

@Injectable()
export class ChallengesService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedChallenges: ChallengesQueryItemMapping = {};
	private fetchedBids: BidsQueryItemMapping = {};
	private fetchedChallengesArray: ChallengesQueryItem[] = [];
	private fetchedBidsArray: BidsQueryItem[] = [];
	private fetchedPrices: ChallengesPricesMapping = {};

	constructor() {}

	getChallengesArray(): ApiChallengesListingArray {
		return {
			num: this.fetchedChallengesArray.length,
			list: this.fetchedChallengesArray,
		};
	}

	getChallenges(): ApiChallengesListing {
		return {
			num: Object.keys(this.fetchedChallenges).length,
			challenges: Object.keys(this.fetchedChallenges) as ChallengesId[],
			map: this.fetchedChallenges,
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

	// challenges prices
	getChallengesPrices(): ApiChallengesPrices {
		const pr = this.fetchedPrices;
		return {
			num: Object.keys(pr).length,
			ids: Object.keys(pr) as ChallengesId[],
			map: pr,
		};
	}

	// --------------------------------------------------------------------------
	// --------------------------------------------------------------------------
	// --------------------------------------------------------------------------
	getBidsArray(): ApiBidsListingArray {
		return {
			num: this.fetchedBidsArray.length,
			list: this.fetchedBidsArray,
		};
	}

	getBids(): ApiBidsListing {
		return {
			num: Object.keys(this.fetchedBids).length,
			bidIds: Object.keys(this.fetchedBids) as BidsId[],
			map: this.fetchedBids,
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

	// bids/challenges
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

	// --------------------------------------------------------------------------
	// --------------------------------------------------------------------------
	// --------------------------------------------------------------------------
	async updateChallengesPrices() {
		this.logger.debug('Updating challengesPrices');
		const active = Object.values(this.getChallenges().map).filter(
			(c: ChallengesQueryItem) => c.status === ChallengesQueryStatus.Active
		);

		// mapping active challenge -> prices
		const challengesPrices: ChallengesPricesMapping = {};
		const mh: Address = ADDRESS[VIEM_CONFIG.chain.id].mintingHub;
		for (const c of active) {
			const price = await VIEM_CONFIG.readContract({
				abi: MintingHubABI,
				address: mh,
				functionName: 'price',
				args: [parseInt(c.number.toString())],
			});

			challengesPrices[c.id] = price.toString();
		}

		// upsert
		this.fetchedPrices = { ...this.fetchedPrices, ...challengesPrices };
	}

	// --------------------------------------------------------------------------
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
							liqPrice
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
		this.fetchedChallengesArray = challenges.data.challenges.items as ChallengesQueryItem[];
		const mapped: ChallengesQueryItemMapping = {};
		for (const i of this.fetchedChallengesArray) {
			mapped[i.id] = i;
		}

		// upsert
		this.fetchedChallenges = { ...this.fetchedChallenges, ...mapped };
	}

	// --------------------------------------------------------------------------
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
		this.fetchedBidsArray = bids.data.challengeBids.items as BidsQueryItem[];
		const mapped: BidsQueryItemMapping = {};
		for (const i of this.fetchedBidsArray) {
			mapped[i.id] = i;
		}

		// upsert
		this.fetchedBids = { ...this.fetchedBids, ...mapped };
	}
}
