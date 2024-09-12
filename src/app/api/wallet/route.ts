import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Wallet, Coinbase } from "@coinbase/coinbase-sdk";
import { coinbase } from '@/lib/coinbase';
import { encrypt, decrypt } from '@/lib/utils';
import { prisma } from '@/lib/prisma';


export async function POST(request: NextRequest) {
	console.log(coinbase);
	const body = await request.json();


	if (!body?.tgId) {
		console.log("Telegram ID is required");
		return NextResponse.json({ message: "Telegram ID is required" }, { status: 400 });
	}

	let userWallet, walletData, dbUser;

	// First, check if the user exists in the database
	dbUser = await prisma.users.findUnique({
		where: { tgId: body.tgId },
		include: { Wallets: true }
	});

	if (!dbUser || !dbUser.Wallets) {
		try {
			({ userWallet, walletData, dbUser } = await createOrImportWallet(body.tgId, body.username, body.first_name));
		} catch (e) {
			return NextResponse.json(
				{ message: (e as Error).message },
				{ status: 500 }
			);
		}
	} else if (dbUser.Wallets) {
		try {
			const decryptedData = JSON.parse(decrypt(dbUser.Wallets.seed || ''));
			if (!decryptedData.walletId) {
				throw new Error("Wallet ID is missing from the stored data");
			}
			userWallet = await Wallet.import({
				seed: decryptedData.seed,
				walletId: decryptedData.walletId
			});

			await userWallet.listAddresses();
		} catch (e) {
			console.error("Failed to import existing wallet:", e);
			return NextResponse.json(
				{ message: "Failed to import existing wallet: " + (e as Error).message },
				{ status: 500 }
			);
		}
	} else {
		return NextResponse.json(
			{ message: "User exists but has no associated wallet" },
			{ status: 500 }
		);
	}

	const defaultAddress = await userWallet.getDefaultAddress();
	const balances = await userWallet.listBalances();

	return NextResponse.json({
		message: dbUser.Wallets ? "Wallet imported successfully" : "Wallet created successfully",
		wallet_id: walletData ? walletData.walletId : dbUser.Wallets?.walletId,
		address: defaultAddress?.getId(),
		balances: balances,
	}, { status: 200 });
}


export async function GET(request: NextRequest) {
	const tgId = request.nextUrl.searchParams.get('tgId');

	if (!tgId) {
		console.log("Telegram ID is required");
		return NextResponse.json({ message: "Telegram ID is required" }, { status: 400 });
	}

	try {
		const dbUser = await prisma.users.findUnique({
			where: { tgId: tgId },
			include: { Wallets: true }
		});

		if (!dbUser) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		if (!dbUser.Wallets) {
			return NextResponse.json({ message: "User has no wallet" }, { status: 404 });
		}

		const decryptedData = JSON.parse(decrypt(dbUser.Wallets.seed || ''));
		const userWallet = await Wallet.import({
			seed: decryptedData.seed,
			walletId: decryptedData.walletId
		});

		let balances = await userWallet.listBalances();
		let formattedBalances = Object.fromEntries(
			Array.from(balances).map(([key, value]) => [key, value.toNumber()])
		);


		return NextResponse.json({
			user: {
				tgId: dbUser.tgId,
				username: dbUser.username,
				firstName: dbUser.firstName,
				wallet: dbUser.Wallets ? {
					id: dbUser.Wallets.id,
					walletId: dbUser.Wallets.walletId,
					balances: formattedBalances,
				} : null,
			}
		}, { status: 200 });
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

async function createOrImportWallet(tgId: string, username?: string, firstName?: string) {
	let userWallet, walletData, dbUser;

	try {
		userWallet = await Wallet.create();
		walletData = userWallet.export();
		const encryptedData = encrypt(JSON.stringify(walletData));
		const address = userWallet.getDefaultAddress()?.getId() || '';

		dbUser = await prisma.users.upsert({
			where: { tgId },
			update: {
				Wallets: {
					create: {
						id: address,
						walletId: walletData.walletId,
						seed: encryptedData,
					}
				}
			},
			create: {
				tgId,
				username,
				firstName,
				Wallets: {
					create: {
						id: address,
						walletId: walletData.walletId,
						seed: encryptedData,
					}
				}
			},
			include: { Wallets: true }
		});

		// Request faucet funds for new wallet
		let faucetTransaction = await userWallet.faucet();
		console.log(`ETH Faucet transaction: ${faucetTransaction}`);
		faucetTransaction = await userWallet.faucet(Coinbase.assets.Usdc);
		console.log(`USDC Faucet transaction: ${faucetTransaction}`);

		return { userWallet, walletData, dbUser };
	} catch (e) {
		console.error("Failed to create/import new wallet:", e);
		throw new Error("Failed to create/import new wallet");
	}
}
