import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PositionsService } from 'positions/positions.service';
import { TelegramGroupState, TelegramState } from './telegram.types';
import { EcosystemMinterService } from 'ecosystem/ecosystem.minter.service';
import { MinterProposalMessage } from './messages/MinterProposal.message';
import { PositionProposalMessage } from './messages/PositionProposal.message';
import { Storj } from 'storj/storj.s3.service';
import { Groups } from './dtos/groups.dto';
import { WelcomeGroupMessage } from './messages/WelcomeGroup.message';
import { StartUpMessage } from './messages/StartUp.message';
import { ChallengesService } from 'challenges/challenges.service';
import { ChallengeStartedMessage } from './messages/ChallengeStarted.message';

@Injectable()
export class TelegramService {
	private readonly logger = new Logger(this.constructor.name);
	private readonly bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
	private readonly storjPath: string = '/telegram.groups.json';
	private telegramState: TelegramState;
	private telegramGroupState: TelegramGroupState;

	constructor(
		private readonly storj: Storj,
		private readonly minter: EcosystemMinterService,
		private readonly position: PositionsService,
		private readonly challenge: ChallengesService
	) {
		const time: number = Date.now();
		this.telegramState = {
			minterApplied: time,
			positions: time,
			challenges: time,
			bids: time,
		};

		this.readBackupGroups();
	}

	async readBackupGroups() {
		this.logger.log(`Reading backup groups from storj`);
		const response = await this.storj.read(this.storjPath, Groups);

		const time: number = Date.now();
		const defaultState: TelegramGroupState = {
			apiVersion: process.env.npm_package_version,
			createdAt: time,
			updatedAt: time,
			groups: [],
			ignore: [],
		};

		if (response.messageError || response.validationError.length > 0) {
			this.logger.error(response.messageError);
			this.telegramGroupState = defaultState;
			this.logger.log(`Telegram group state created...`);
		} else {
			this.telegramGroupState = { ...defaultState, ...response.data };
			this.logger.log(`Telegram group state restored...`);
			this.sendMessageAll(StartUpMessage());
		}
	}

	async writeBackupGroups() {
		const stateToPush: TelegramGroupState = {
			...this.telegramGroupState,
			apiVersion: process.env.npm_package_version,
			updatedAt: Date.now(),
		};
		const response = await this.storj.write(this.storjPath, stateToPush);
		const httpStatusCode = response['$metadata'].httpStatusCode;
		if (httpStatusCode == 200) {
			this.logger.log(`Telegram group backup stored`);
		} else {
			this.logger.error(`Telegram group backup failed. httpStatusCode: ${httpStatusCode}`);
		}
	}

	async sendMessageAll(message: string) {
		if (this.telegramGroupState.groups.length == 0) return;
		for (const group of this.telegramGroupState.groups) {
			await this.sendMessage(group, message);
		}
	}

	async sendMessage(group: string | number, message: string) {
		try {
			this.logger.debug(`Sending message to group id ${group}`);
			await this.bot.sendMessage(group.toString(), message, { parse_mode: 'Markdown', disable_web_page_preview: true });
		} catch (error) {
			const msg = {
				deleted: 'ETELEGRAM: 403 Forbidden: the group chat was deleted',
				blocked: 'ETELEGRAM: 403 Forbidden: bot was blocked by the user',
			};

			if (typeof error === 'object') {
				if (error?.message.includes(msg.deleted)) {
					this.logger.warn(`[${group}]` + msg.deleted);
					this.ignoreTelegramGroup(group);
					//	} else if (error?.message.includes(msg.blocked)) {
					// 		this.logger.warn(`[${group}]` + msg.blocked);
					// 		this.ignoreTelegramGroup(group);
				} else {
					this.logger.warn(error?.message);
				}
			} else {
				this.logger.warn(error);
			}
		}
	}

	async updateTelegram() {
		this.logger.debug('Updating updateTelegram');

		// Fetch telegram updates
		const telegramUpdates = await this.bot.getUpdates();
		const updatedState: boolean[] = [];
		if (telegramUpdates.length > 0) {
			for (const up of telegramUpdates) {
				if (this.upsertTelegramGroup(up?.message?.chat?.id) == true) updatedState.push(true);
			}
			if (updatedState.length > 0) await this.writeBackupGroups();
		}

		// break if no groups are known
		if (this.telegramGroupState.groups.length == 0) return;

		// Minter Proposal
		const mintersList = this.minter.getMintersList().list.filter((m) => m.applyDate * 1000 > this.telegramState.minterApplied);
		if (mintersList.length > 0) {
			for (const minter of mintersList) {
				this.sendMessageAll(MinterProposalMessage(minter));
			}
			this.telegramState.minterApplied = Date.now();
		}

		// update positions
		const requestedPosition = Object.values(this.position.getPositionsRequests().map).filter(
			(r) => r.created * 1000 > this.telegramState.positions
		);
		if (requestedPosition.length > 0) {
			for (const p of requestedPosition) {
				this.sendMessageAll(PositionProposalMessage(p));
			}
			this.telegramState.positions = Date.now();
		}

		// update challenges
		const requestedChallenges = Object.values(this.challenge.getChallengesMapping().map).filter(
			(c) => parseInt(c.created.toString()) * 1000 > this.telegramState.challenges
		);
		if (requestedChallenges.length > 0) {
			for (const c of requestedChallenges) {
				const pos = this.position.getPositionsList().list.find((p) => p.position == c.position);
				if (pos == undefined) return;
				this.sendMessageAll(ChallengeStartedMessage(pos, c));
			}
			this.telegramState.challenges = Date.now();
		}
	}

	upsertTelegramGroup(id: number | string): boolean {
		if (!id) return;
		if (this.telegramGroupState.ignore.includes(id.toString())) return false;
		if (this.telegramGroupState.groups.includes(id.toString())) return false;
		this.telegramGroupState.groups.push(id.toString());
		this.logger.log(`Upserted Telegram Group: ${id}`);
		this.sendMessage(id, WelcomeGroupMessage(id));
		return true;
	}

	async ignoreTelegramGroup(id: number | string): Promise<boolean> {
		if (!id) return;
		const inGroup: boolean = this.telegramGroupState.groups.includes(id.toString());
		const inIgnore: boolean = this.telegramGroupState.ignore.includes(id.toString());
		const update: boolean = inGroup || !inIgnore;

		if (!inIgnore) this.telegramGroupState.ignore.push(id.toString());

		if (inGroup) {
			const newGroup: string[] = this.telegramGroupState.groups.filter((g) => g !== id.toString());
			this.telegramGroupState.groups = newGroup;
		}

		if (update) {
			this.logger.log(`Ignore Telegram Group: ${id}`);
			await this.writeBackupGroups();
		}

		return update;
	}
}
