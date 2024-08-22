import { NextRequest, NextResponse } from 'next/server';
import { Address, Coinbase } from "@coinbase/coinbase-sdk";
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '@/lib/utils';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient();
} else {
	if (!(global as any).prisma) {
		(global as any).prisma = new PrismaClient();
	}
	prisma = (global as any).prisma;
}

export async function POST(request: NextRequest) {
	const { COINBASE_KEY_NAME, COINBASE_PRIVATE_KEY } = process.env;

	if (!COINBASE_KEY_NAME || !COINBASE_PRIVATE_KEY) {
		return NextResponse.json(
			{ message: "Environment variables are not set" },
			{ status: 500 }
		);
	}

	const body = await request.json();

	if (!body?.tgId) {
		return NextResponse.json({ message: "Telegram ID is required" }, { status: 400 });
	}

	const coinbase = new Coinbase({
		apiKeyName: COINBASE_KEY_NAME,
		privateKey: COINBASE_PRIVATE_KEY,
	});

	const user = await coinbase.getDefaultUser();

	let userWallet;
	let walletData;

	// First, check if the user exists in the database
	let dbUser = await prisma.users.findUnique({
		where: { tgId: body.tgId },
		include: { Wallets: true }
	});

	if (!dbUser) {
		// Create wallet first
		try {
			userWallet = await user.createWallet({ networkId: Coinbase.networks.BaseSepolia });
			walletData = userWallet.export();
			const encryptedData = encrypt(JSON.stringify(walletData));
			const address = userWallet.getDefaultAddress()?.getId() || '';

			// Create the user with the new wallet
			dbUser = await prisma.users.create({
				data: {
					tgId: body.tgId,
					username: body.username,
					firstName: body.first_name,
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
			try {
				const faucetTransaction = await userWallet.faucet();
				console.log(`Faucet transaction: ${faucetTransaction}`);
			} catch (e) {
				console.log("Faucet is not available or failed:", e);
			}
		} catch (e) {
			console.error("Failed to create new wallet:", e);
			return NextResponse.json(
				{ message: "Failed to create new wallet" },
				{ status: 500 }
			);
		}
	} else if (dbUser.Wallets) {
		try {
			const decryptedData = JSON.parse(decrypt(dbUser.Wallets.seed || ''));
			if (!decryptedData.walletId) {
				throw new Error("Wallet ID is missing from the stored data");
			}
			userWallet = await user.importWallet(decryptedData);

			if (!userWallet.canSign()) {
				userWallet.setSeed(decryptedData.seed);
			}

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

		return NextResponse.json({
			user: {
				tgId: dbUser.tgId,
				username: dbUser.username,
				firstName: dbUser.firstName,
				wallet: dbUser.Wallets ? {
					id: dbUser.Wallets.id,
					walletId: dbUser.Wallets.walletId,
				} : null,
			}
		}, { status: 200 });
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
