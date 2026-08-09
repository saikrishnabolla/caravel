import crypto from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";

export type Ap2AuthorizationInput = {
  buyerId: string;
  agentId: string;
  merchantId: string;
  merchantName: string;
  merchantWebsite?: string;
  sku: string;
  title: string;
  quantity: number;
  amountCents: number;
  maximumCents: number;
  currency?: string;
  paymentInstrument: "x402-usdc" | "rain-card";
  paymentDescription: string;
};

type Ap2Verification = {
  valid: true;
  checkoutVct: "mandate.checkout.1";
  paymentVct: "mandate.payment.1";
  openCheckoutVct: "mandate.checkout.open.1";
  openPaymentVct: "mandate.payment.open.1";
  checkoutReference: string;
  paymentReference: string;
  merchantSignatureVerified: true;
  constraintsVerified: true;
};

type Ap2Bundle = Ap2AuthorizationInput & {
  authorizationId: string;
  nonce: string;
  audience: string;
  checkoutJwt: string;
  checkoutHash: string;
  checkoutMandateToken: string;
  paymentMandateToken: string;
  buyerPublicKey: Record<string, unknown>;
  merchantPublicKey: Record<string, unknown>;
  expiresAt: number;
  verification: Ap2Verification;
};

export type Ap2AuthorizationSummary = {
  authorizationId: string;
  protocol: "AP2";
  profile: "human-not-present";
  buyerId: string;
  agentId: string;
  merchantId: string;
  merchantName: string;
  amountCents: number;
  maximumCents: number;
  paymentInstrument: string;
  checkoutMandate: {
    openVct: string;
    closedVct: string;
    reference: string;
    merchantSignatureVerified: boolean;
  };
  paymentMandate: {
    openVct: string;
    closedVct: string;
    reference: string;
    constraintsVerified: boolean;
  };
};

declare global {
  var __raingenticAp2Bundles: Map<string, Ap2Bundle> | undefined;
}

const bundles = globalThis.__raingenticAp2Bundles ?? new Map<string, Ap2Bundle>();
globalThis.__raingenticAp2Bundles = bundles;

function pythonExecutable() {
  return path.join(process.cwd(), "services", "ap2", ".venv", "bin", "python");
}

function authorizationScript() {
  return path.join(process.cwd(), "services", "ap2", "authorize.py");
}

async function runAp2<T>(request: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable(), [authorizationScript()], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", error => reject(new Error(`Official AP2 service could not start: ${error.message}`)));
    child.on("close", code => {
      try {
        const parsed = JSON.parse(stdout || "{}") as T & { error?: string };
        if (code !== 0 || parsed.error) {
          reject(new Error(parsed.error ?? (stderr.trim() || `Official AP2 service exited with code ${code}`)));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || "Official AP2 service returned invalid output"));
      }
    });
    child.stdin.end(JSON.stringify(request));
  });
}

function summarize(bundle: Ap2Bundle): Ap2AuthorizationSummary {
  return {
    authorizationId: bundle.authorizationId,
    protocol: "AP2",
    profile: "human-not-present",
    buyerId: bundle.buyerId,
    agentId: bundle.agentId,
    merchantId: bundle.merchantId,
    merchantName: bundle.merchantName,
    amountCents: bundle.amountCents,
    maximumCents: bundle.maximumCents,
    paymentInstrument: bundle.paymentInstrument,
    checkoutMandate: {
      openVct: bundle.verification.openCheckoutVct,
      closedVct: bundle.verification.checkoutVct,
      reference: bundle.verification.checkoutReference,
      merchantSignatureVerified: bundle.verification.merchantSignatureVerified,
    },
    paymentMandate: {
      openVct: bundle.verification.openPaymentVct,
      closedVct: bundle.verification.paymentVct,
      reference: bundle.verification.paymentReference,
      constraintsVerified: bundle.verification.constraintsVerified,
    },
  };
}

export async function createOfficialAp2Authorization(
  input: Ap2AuthorizationInput,
): Promise<Ap2AuthorizationSummary> {
  const bundle = await runAp2<Ap2Bundle>({
    action: "create",
    data: { ...input, authorizationId: crypto.randomUUID() },
  });
  bundles.set(bundle.authorizationId, bundle);
  return summarize(bundle);
}

export async function verifyOfficialAp2Authorization(
  authorizationId: string,
): Promise<Ap2AuthorizationSummary> {
  const bundle = bundles.get(authorizationId);
  if (!bundle) throw new Error("AP2 authorization was not found or has expired");
  const verification = await runAp2<Ap2Verification>({ action: "verify", bundle });
  const verified = { ...bundle, verification };
  bundles.set(authorizationId, verified);
  return summarize(verified);
}
