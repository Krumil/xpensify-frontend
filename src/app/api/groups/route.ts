import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const tgId = searchParams.get('tgId');

	if (!tgId) {
		return NextResponse.json({ error: "You must provide a tgId parameter" }, { status: 400 });
	}

	try {
		const apiUrl = process.env.API_URL;
		if (!apiUrl) {
			throw new Error("API_URL is not defined in .env");
		}

		const response = await fetch(`${apiUrl}/groups?userId=${tgId}`);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.detail || "Failed to fetch groups");
		}

		return NextResponse.json({ groups: data.groups });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const chatId = await request.json();
		if (!chatId) {
			return NextResponse.json({ error: "You must provide a chatId" }, { status: 400 });
		}

		const apiUrl = process.env.API_URL;
		if (!apiUrl) {
			throw new Error("API_URL is not defined in .env");
		}

		const response = await fetch(`${apiUrl}/process-messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ chatId: chatId }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.detail || "Failed to process messages");
		}

		console.log('data:', data);
		return NextResponse.json(data);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: "Failed to process messages" }, { status: 500 });
	}
}