export type TelegramState = {
	minterApplied: number;
	positions: number;
	challenges: number;
	bids: number;
};

export type TelegramGroupState = {
	apiVersion: string;
	createdAt: number;
	updatedAt: number;
	groups: string[];
	ignore: string[];
};
