import { Coinbase } from "@coinbase/coinbase-sdk";

const { COINBASE_KEY_NAME, COINBASE_PRIVATE_KEY } = process.env;

if (!COINBASE_KEY_NAME || !COINBASE_PRIVATE_KEY) {
	throw new Error("COINBASE_KEY_NAME and COINBASE_PRIVATE_KEY must be set");
}

export const coinbase = new Coinbase({
	apiKeyName: COINBASE_KEY_NAME as string,
	privateKey: COINBASE_PRIVATE_KEY.replaceAll("\\n", "\n") as string,
});