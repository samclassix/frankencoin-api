import { Address } from 'viem';

export type ChallengeQuery = {
	position: Address;
	challenger: Address;
	number: bigint;
	start: bigint;
	duration: bigint;
	size: bigint;
	filledSize: bigint;
	acquiredCollateral: bigint;
	bid: bigint;
	status: string;
};

export type ChallengeQueryObjectArray = {
	[key: Address]: ChallengeQuery;
};
export type ChallengeQueryObject = {
	num: number;
	positions: ChallengeQueryObjectArray;
};
