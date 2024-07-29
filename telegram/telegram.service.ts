import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PositionsService } from 'positions/positions.service';
import { TelegramState } from './telegram.types';
import { EcosystemMinterService } from 'ecosystem/ecosystem.minter.service';
import { MinterProposalMessage } from './messages/MinterProposal.message';
import { PositionProposalMessage } from './messages/PositionProposal.message';

@Injectable()
export class TelegramService {
	private readonly logger = new Logger(this.constructor.name);
	private readonly groups: string[] = ['-4274797249'];
	private readonly bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
	private readonly state: TelegramState;

	constructor(
		private readonly minter: EcosystemMinterService,
		private readonly position: PositionsService
	) {
		const time: number = Date.now();
		this.state = {
			minterApplied: time - 12000000,
			positions: time, // - 2000000,
			challenges: time,
			bids: time,
		};
	}

	async sendMessage(message: string) {
		console.log('sending message');
		try {
			await this.bot.sendMessage(this.groups[0], message, { parse_mode: 'Markdown', disable_web_page_preview: true });
		} catch (error) {
			this.logger.error(error);
		}
	}

	async updateTelegram() {
		this.logger.debug('Updating updateTelegram');

		// Minter Proposal
		const mintersList = this.minter.getMintersList().list.filter((m) => m.applyDate * 1000 > this.state.minterApplied);
		if (mintersList.length > 0) {
			for (const minter of mintersList) {
				this.sendMessage(MinterProposalMessage(minter));
			}
			this.state.minterApplied = Date.now();
		}

		// update positions
		const requestedPosition = Object.values(this.position.getPositionsRequests().map).filter(
			(r) => r.created * 1000 > this.state.positions
		);
		if (requestedPosition.length > 0) {
			for (const p of requestedPosition) {
				this.sendMessage(PositionProposalMessage(p));
			}
			this.state.positions = Date.now();
		}
		// update challenges
		// update bids
	}
}
