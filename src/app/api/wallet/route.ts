import { NextRequest, NextResponse } from 'next/server';
import { Wallet, Coinbase } from "@coinbase/coinbase-sdk";
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

const { COINBASE_KEY_NAME, COINBASE_PRIVATE_KEY } = process.env;

if (!COINBASE_KEY_NAME || !COINBASE_PRIVATE_KEY) {
	throw new Error("COINBASE_KEY_NAME and COINBASE_PRIVATE_KEY must be set");
}

const coinbase = new Coinbase({
	apiKeyName: COINBASE_KEY_NAME as string,
	privateKey: COINBASE_PRIVATE_KEY.replaceAll("\\n", "\n") as string,
});

export async function POST(request: NextRequest) {

	const body = await request.json();

	if (!body?.tgId) {
		return NextResponse.json({ message: "Telegram ID is required" }, { status: 400 });
	}


	let userWallet;
	let walletData;

	// First, check if the user exists in the database
	let dbUser = await prisma.users.findUnique({
		where: { tgId: body.tgId },
		include: { Wallets: true }
	});

	if (!dbUser) {
		// Create or import wallet
		try {
			userWallet = await Wallet.create();
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
			let faucetTransaction = await userWallet.faucet();
			console.log(`ETH Faucet transaction: ${faucetTransaction}`);
			faucetTransaction = await userWallet.faucet(Coinbase.assets.Usdc);
			console.log(`USDC Faucet transaction: ${faucetTransaction}`);
		} catch (e) {
			console.error("Failed to create/import new wallet:", e);
			return NextResponse.json(
				{ message: "Failed to create/import new wallet" },
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
