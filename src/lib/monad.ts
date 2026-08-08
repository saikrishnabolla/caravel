import crypto from "node:crypto";

export type MonadX402Receipt = {
  mode: "simulation";
  network: "Monad Testnet";
  asset: "USDC";
  amount: string;
  resource: string;
  facilitator: string;
  receiptId: string;
};

export function simulateMonadX402Purchase(): MonadX402Receipt {
  return {
    mode: "simulation",
    network: "Monad Testnet",
    asset: "USDC",
    amount: "0.05",
    resource: "delivery-quality-report.json",
    facilitator: "https://x402-facilitator.molandak.org",
    receiptId: `x402-sim-${crypto.randomUUID()}`,
  };
}
