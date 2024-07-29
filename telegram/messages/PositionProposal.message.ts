import { PositionQuery } from 'positions/positions.types';
import { formatCurrency } from 'utils/format';
import { formatUnits } from 'viem';

export function PositionProposalMessage(position: PositionQuery): string {
	const bal: number = parseInt(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals - 2)) / 100;
	const min: number = parseInt(formatUnits(BigInt(position.minimumCollateral), position.collateralDecimals - 2)) / 100;
	const price: number = parseInt(formatUnits(BigInt(position.price), 36 - position.collateralDecimals - 2)) / 100;

	return `
*New Position Proposal*
Start: ${new Date(position.start * 1000).toString().split(' ').splice(0, 6).join(' ')}
Position: ${position.position}
Owner: ${position.owner}
Minting Limit: ${formatCurrency(formatUnits(BigInt(position.limitForClones), 18), 2, 2)} ZCHF
Annual Interest: ${formatCurrency(position.annualInterestPPM / 10000, 1, 1)}%
Retained Reserve: ${formatCurrency(position.reserveContribution / 10000, 1, 1)}%
Auction Duration: ${Math.floor(position.challengePeriod / 60 / 60)} hours
Expiration: ${Math.floor((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24)} days

Collateral: ${position.collateralName} (${position.collateralSymbol})
At: ${position.collateral}
Balance: ${formatCurrency(bal, 2, 2)} ${position.collateralSymbol}
Bal. min.: ${formatCurrency(min, 2, 2)} ${position.collateralSymbol}
Price: ${formatCurrency(price, 2, 2)} ZCHF

[Challenge Position](https://app.test.frankencoin.com/monitoring/${position.position}/challenge)
[Veto Position](https://app.test.frankencoin.com/monitoring/${position.position}/veto)

[Explorer Position](https://polygonscan.com/address/${position.position})
[Explorer Owner](https://polygonscan.com/address/${position.owner}) 
[Explorer Collateral](https://polygonscan.com/address/${position.collateral}) 
                        `;
}
