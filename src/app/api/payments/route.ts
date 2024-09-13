import { NextRequest, NextResponse } from 'next/server';
import { Wallet, Coinbase, TimeoutError } from "@coinbase/coinbase-sdk";
import { coinbase } from '@/lib/coinbase';
import { decrypt } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

console.log(coinbase);

export async function POST(request: NextRequest) {
	const { settlements, currentUserId } = await request.json();

	if (!Array.isArray(settlements) || !currentUserId) {
		return NextResponse.json({ message: "Invalid payment data" }, { status: 400 });
	}

	try {
		// Fetch current user's wallet data
		const currentUser = await prisma.users.findUnique({
			where: { tgId: currentUserId },
			include: { Wallets: true }
		});

		if (!currentUser || !currentUser.Wallets) {
			return NextResponse.json({ message: "Current user or wallet not found" }, { status: 400 });
		}

		// Decrypt and import current user's wallet
		const decryptedData = JSON.parse(decrypt(currentUser.Wallets.seed || ''));
		const userWallet = await Wallet.import({
			seed: decryptedData.seed,
			walletId: decryptedData.walletId
		});

		const results = [];
		const completedSettlementIds = [];

		const apiUrl = process.env.API_URL;
		if (!apiUrl) {
			throw new Error("API_URL is not defined in .env");
		}

		for (const settlement of settlements) {
			if (!settlement.toUserId || !settlement.amount || !settlement.id) {
				results.push({ status: 'error', message: "Invalid settlement data" });
				continue;
			}

			// Fetch recipient's wallet address
			const recipient = await prisma.users.findUnique({
				where: { tgId: settlement.toUserId },
				include: { Wallets: true }
			});

			if (!recipient || !recipient.Wallets) {
				results.push({ status: 'error', message: "Recipient or wallet not found" });
				continue;
			}

			// Create a gasless USDC transfer
			const transfer = await userWallet.createTransfer({
				amount: settlement.amount / 100,
				assetId: Coinbase.assets.Usdc,
				destination: recipient.Wallets.id,
				gasless: true
			});

			try {
				await transfer.wait();

				if (transfer.getStatus() === 'complete') {
					completedSettlementIds.push(settlement.id);
					results.push({
						status: 'success',
						message: "Payment settled successfully",
						transferId: transfer.getId(),
						settlementId: settlement.id
					});
				} else {
					results.push({ status: 'error', message: "Transfer failed", settlementId: settlement.id });
				}
			} catch (err) {
				if (err instanceof TimeoutError) {
					results.push({ status: 'error', message: "Transfer timed out", settlementId: settlement.id });
				} else {
					throw err;
				}
			}
		}

		// Make a single API call for all completed settlements
		if (completedSettlementIds.length > 0) {
			const completeResponse = await fetch(`${apiUrl}/complete-settlements`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					settlementIds: completedSettlementIds
				}),
			});

			if (!completeResponse.ok) {
				console.error('Failed to mark settlements as completed');
				// Update results for settlements that weren't marked as completed
				results.forEach(result => {
					if (result.status === 'success') {
						result.status = 'partial';
						result.message = "Payment settled but not marked as completed";
					}
				});
			}
		}

		return NextResponse.json({ results }, { status: 200 });
	} catch (error) {
		console.error('Error settling payments:', error);
		return NextResponse.json({ message: "Failed to settle payments" }, { status: 500 });
	}
}