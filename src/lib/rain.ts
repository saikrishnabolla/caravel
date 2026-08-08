import crypto from "node:crypto";

const RAIN_SANDBOX_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAP192809jZyaw62g/eTzJ3P9H
+RmT88sXUYjQ0K8Bx+rJ83f22+9isKx+lo5UuV8tvOlKwvdDS/pVbzpG7D7NO45c
0zkLOXwDHZkou8fuj8xhDO5Tq3GzcrabNLRLVz3dkx0znfzGOhnY4lkOMIdKxlQb
LuVM/dGDC9UpulF+UwIDAQAB
-----END PUBLIC KEY-----`;

type RainConfig = {
  baseUrl: string;
  apiKey: string;
  userId: string;
  teamId?: string;
  contractId: string;
};

type RainTransactionResult = {
  transactionId: string;
  status: "authorized" | "declined" | "settled";
  declinedReason?: string;
  completionReason?: string;
};

type ScopedCardResult = {
  id: string;
  last4: string;
  expirationMonth: number | string;
  expirationYear: number | string;
  status: string;
};

export class RainApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "RainApiError";
  }
}

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

export function getRainConfig(): RainConfig {
  const apiKey = envValue("RAIN_API_KEY", "api_key");
  const userId = envValue("RAIN_USER_ID", "user_id");
  const contractId = envValue(
    "RAIN_CONTRACT_ID",
    "contract_id",
    "collateral_id",
  );

  if (!apiKey || !userId || !contractId) {
    throw new Error(
      "Rain is not configured. Expected API key, user ID, and collateral contract ID.",
    );
  }

  return {
    baseUrl:
      envValue("RAIN_API_BASE_URL") ?? "https://api-dev.raincards.xyz/v1",
    apiKey,
    userId,
    teamId: envValue("RAIN_TEAM_ID", "team_id"),
    contractId,
  };
}

async function rainRequest<T>(
  path: string,
  init: RequestInit = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const config = getRainConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Api-Key": config.apiKey,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
      ...init.headers,
    },
  });
  const body = await response.text();

  if (!response.ok) {
    let detail = body.slice(0, 500);
    try {
      const parsed = JSON.parse(body) as { message?: string; error?: string };
      detail = parsed.message ?? parsed.error ?? detail;
    } catch {
      // Rain occasionally returns plain text; the bounded response remains useful.
    }
    throw new RainApiError(
      `Rain request failed with HTTP ${response.status}`,
      response.status,
      detail,
    );
  }

  return (body ? JSON.parse(body) : {}) as T;
}

function idempotencyHeaders() {
  return { "Idempotency-Key": crypto.randomUUID() };
}

function generateSessionId() {
  const secretKey = crypto.randomUUID().replaceAll("-", "");
  const encodedSecret = Buffer.from(secretKey, "hex").toString("base64");
  const encrypted = crypto.publicEncrypt(
    {
      key: RAIN_SANDBOX_PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha1",
    },
    Buffer.from(encodedSecret, "utf8"),
  );

  return encrypted.toString("base64");
}

export async function checkRainConnection() {
  const transactions = await rainRequest<unknown[]>("/issuing/transactions?limit=1");
  return { connected: true, transactionCount: transactions.length };
}

export async function fundCollateral(amountCents = 100_000) {
  const config = getRainConfig();
  return rainRequest<{ transactionId: string }>(
    "/simulate/collateral/fund",
    {
      method: "POST",
      body: JSON.stringify({
        contractId: config.contractId,
        currency: "rusd",
        amount: amountCents,
      }),
    },
    idempotencyHeaders(),
  );
}

export async function createScopedCard(input: {
  amountCents: number;
  allowedMccs: string[];
}) {
  const config = getRainConfig();
  const response = await rainRequest<ScopedCardResult & Record<string, unknown>>(
    `/issuing/users/${config.userId}/cards/scoped`,
    {
      method: "POST",
      body: JSON.stringify({
        amountInUSDCents: input.amountCents,
        allowedMccs: input.allowedMccs,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    },
    { ...idempotencyHeaders(), sessionid: generateSessionId() },
  );

  return {
    id: response.id,
    last4: response.last4,
    expirationMonth: response.expirationMonth,
    expirationYear: response.expirationYear,
    status: response.status,
  };
}

export async function authorizeCard(input: {
  cardId: string;
  amountCents: number;
  merchantName: string;
  merchantCategoryCode: string;
}) {
  return rainRequest<RainTransactionResult>(
    "/simulate/transactions/authorize",
    {
      method: "POST",
      body: JSON.stringify({
        cardId: input.cardId,
        amount: input.amountCents,
        currency: "USD",
        merchantName: input.merchantName,
        merchantCategoryCode: input.merchantCategoryCode,
      }),
    },
    idempotencyHeaders(),
  );
}

export async function settleAuthorization(transactionId: string, amountCents: number) {
  return rainRequest<RainTransactionResult>(
    `/simulate/transactions/${transactionId}/settle`,
    { method: "POST", body: JSON.stringify({ amount: amountCents }) },
    idempotencyHeaders(),
  );
}
