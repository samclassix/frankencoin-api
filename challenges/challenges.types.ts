import { Address } from 'viem';

// --------------------------------------------------------------------------
// Ponder return types
export type ChallengesQueryItem = {
	id: ChallengesId;
	position: Address;
	number: bigint;

	challenger: Address;
	start: bigint;
	created: bigint;
	duration: bigint;
	size: bigint;

	bids: bigint;
	filledSize: bigint;
	acquiredCollateral: bigint;
	status: string;
};

export type BidsQueryItem = {
	id: BidsId;
	position: Address;
	number: bigint;
	numberBid: bigint;

	bidder: Address;
	created: bigint;
	bidType: BidsType;
	bid: bigint;

	bids: bigint;
	filledSize: bigint;
	acquiredCollateral: bigint;
	challengeSize: bigint;
};

// --------------------------------------------------------------------------
// Service
export type ChallengesStatus = 'Active' | 'Success';
export type ChallengesId = `${Address}-challenge-${bigint}`;

export type ChallengesQueryItemMapping = {
	[key: ChallengesId]: ChallengesQueryItem;
};

export type ChallengesChallengersMapping = { [key: Address]: ChallengesQueryItem[] };
export type ChallengesPositionsMapping = { [key: Address]: ChallengesQueryItem[] };

export type BidsType = 'Averted' | 'Succeeded';
export type BidsId = `${Address}-challenge-${bigint}-bid-${bigint}`;

export type BidsQueryItemMapping = {
	[key: BidsId]: BidsQueryItem;
};

export type BidsBidderMapping = { [key: Address]: BidsQueryItem[] };
export type BidsChallengesMapping = { [key: Address]: BidsQueryItem[] };
export type BidsPositionsMapping = { [key: Address]: BidsQueryItem[] };

// --------------------------------------------------------------------------
// Api
export type ApiChallengesListing = {
	num: number;
	list: ChallengesQueryItemMapping;
};

export type ApiChallengesChallengers = {
	num: number;
	challengers: Address[];
	map: ChallengesChallengersMapping;
};

export type ApiChallengesPositions = {
	num: number;
	positions: Address[];
	map: ChallengesPositionsMapping;
};

export type ApiBidsListing = {
	num: number;
	list: BidsQueryItemMapping;
};

export type ApiBidsBidders = {
	num: number;
	bidders: Address[];
	map: BidsBidderMapping;
};

export type ApiBidsChallenges = {
	num: number;
	challenges: Address[];
	map: BidsChallengesMapping;
};

export type ApiBidsPositions = {
	num: number;
	positions: Address[];
	map: BidsPositionsMapping;
};
