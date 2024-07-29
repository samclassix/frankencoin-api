import { MinterQuery } from 'ecosystem/ecosystem.minter.types';
import { formatCurrency } from 'utils/format';

export function MinterProposalMessage(minter: MinterQuery): string {
	const d = new Date(minter.applyDate * 1000);

	return `
*New Minter Proposal*
Application Period: ${Math.floor(minter.applicationPeriod / 60 / 60)} hours
Application Veto Until: ${d.toString().split(' ').slice(0, 6).join(' ')}
Minter: ${minter.minter}
Suggestor: ${minter.suggestor}
Application Fee: ${formatCurrency(minter.applicationFee / 1e18, 2, 2)} ZCHF
Message: ${minter.applyMessage}

[Goto Governance](https://app.test.frankencoin.com/governance)
                        `;
}
