"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatUsd, type Negotiation, type QuoteDecision } from "@/lib/purchasing";

type WorkflowResult = {
  a2a: { protocolVersion: string; taskId: string; contextId: string };
  decisions: QuoteDecision[];
  selected: QuoteDecision;
  negotiation: Negotiation;
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    status: "complete" | "declined" | "verified" | "warning";
    providerId?: string;
  }>;
  agent: { source: "openai-agent" | "deterministic-fallback"; summary: string };
  requiresApproval: boolean;
  approval: null | { provider: string; amountCents: number; reason: string };
  delivery: null | {
    passed: boolean;
    missionsPrepared: number;
    measuredReadinessRate: number;
    checks: Array<{ label: string; passed: boolean; detail: string }>;
  };
  rain: null | { upstreamProcurementCents: number };
  monad: null | {
    mode: "testnet";
    amount: string;
    asset: string;
    transactionHash: string;
    explorerUrl: string;
  };
};

type TreasuryResult = {
  mode: "sandbox";
  amount: string;
  onramp: { routeId: string; route: string; simulationId: string; status: string; note?: string };
  offramp: { routeId: string; route: string; simulationId: string; status: string; note?: string };
  limitation: string;
};

const initialMandate = {
  objective: "Purchase 100 agricultural drone mission-readiness packets with airspace, weather, Part 107/137, risk, and 90-day telemetry coverage for the growing season.",
  budgetCents: 150_000,
  maxUnitCostCents: 1_500,
  minimumMissions: 100,
  minimumReadinessRate: 0.9,
};

export function PurchasingConsole() {
  const [mandate, setMandate] = useState(initialMandate);
  const [liveRain, setLiveRain] = useState(false);
  const [rainStatus, setRainStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [treasuryStatus, setTreasuryStatus] = useState("0 routes");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [treasury, setTreasury] = useState<TreasuryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [treasuryRunning, setTreasuryRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/rain/health").then(response => {
        if (!response.ok) throw new Error("Rain unavailable");
        return response.json();
      }),
      fetch("/api/rain/treasury").then(response => response.ok ? response.json() : null),
    ])
      .then(([, status]) => {
        setRainStatus("connected");
        if (status) setTreasuryStatus(`${status.paymentRoutes} routes`);
      })
      .catch(() => setRainStatus("offline"));
  }, []);

  async function executeWorkflow(approved = false) {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandate, liveRain, approved }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Commerce workflow failed");
      setResult(data);
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Commerce workflow failed");
    } finally {
      setRunning(false);
    }
  }

  async function runTreasuryDemo() {
    setTreasuryRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/rain/treasury", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Treasury simulation failed");
      setTreasury(data);
      setTreasuryStatus("2 routes");
    } catch (treasuryError) {
      setError(treasuryError instanceof Error ? treasuryError.message : "Treasury simulation failed");
    } finally {
      setTreasuryRunning(false);
    }
  }

  function runWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executeWorkflow(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">R</span><span>Raingentic</span></div>
        <div className="rail-statuses">
          <span className="status-pill connected"><i /> A2A v1.0 ready</span>
          <span className={`status-pill ${rainStatus}`}><i /> Rain {rainStatus}</span>
          <span className="status-pill connected"><i /> Monad x402 ready</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">AGENT COMMERCE + TREASURY CONTROL PLANE</p>
          <h1>Agents negotiate.<br />Businesses keep control.</h1>
          <p className="hero-copy">
            A buyer agent negotiates an agricultural mission-readiness package, pays the seller through Monad,
            and the fulfillment agent buys traditional services through a restricted Rain card.
          </p>
        </div>
        <div className="hero-proof">
          <span>End-to-end proof</span>
          <strong>A2A → approval → sell → fulfill</strong>
          <small>Rain sandbox · Monad Testnet · x402</small>
        </div>
      </section>

      <section className="workspace">
        <form className="panel mandate-panel" onSubmit={runWorkflow}>
          <div className="panel-heading"><div><span className="step-number">01</span><h2>Buyer mandate</h2></div><span className="label">BUSINESS INPUT</span></div>
          <label>What outcome should the agent purchase?<textarea value={mandate.objective} onChange={event => setMandate({ ...mandate, objective: event.target.value })} rows={5} /></label>
          <div className="field-grid">
            <label>Total budget<div className="input-prefix"><span>$</span><input type="number" value={mandate.budgetCents / 100} onChange={event => setMandate({ ...mandate, budgetCents: Number(event.target.value) * 100 })} /></div></label>
            <label>Max per mission<div className="input-prefix"><span>$</span><input type="number" step="0.01" value={mandate.maxUnitCostCents / 100} onChange={event => setMandate({ ...mandate, maxUnitCostCents: Number(event.target.value) * 100 })} /></div></label>
            <label>Minimum missions<input type="number" value={mandate.minimumMissions} onChange={event => setMandate({ ...mandate, minimumMissions: Number(event.target.value) })} /></label>
            <label>Minimum readiness<div className="input-suffix"><input type="number" value={mandate.minimumReadinessRate * 100} onChange={event => setMandate({ ...mandate, minimumReadinessRate: Number(event.target.value) / 100 })} /><span>%</span></div></label>
          </div>
          <div className="rail-toggle">
            <div><strong>Execute sandbox/testnet payments</strong><span>Requires approval before Rain or Monad state changes</span></div>
            <button type="button" role="switch" aria-checked={liveRain} className={liveRain ? "switch active" : "switch"} onClick={() => setLiveRain(!liveRain)}><span /></button>
          </div>
          {result?.requiresApproval && result.approval && (
            <div className="approval-card">
              <span>HUMAN APPROVAL</span>
              <strong>Approve {formatUsd(result.approval.amountCents)} for {result.approval.provider}?</strong>
              <p>{result.approval.reason}. No payment has been attempted.</p>
              <button type="button" onClick={() => void executeWorkflow(true)} disabled={running}>Approve and execute →</button>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <button className="primary-button" disabled={running || (liveRain && rainStatus !== "connected")}>
            {running ? "Agents are working…" : liveRain ? "Negotiate and execute" : "Preview negotiation"}<span>→</span>
          </button>
        </form>

        <section className="panel quote-panel">
          <div className="panel-heading"><div><span className="step-number">02</span><h2>Agent negotiation</h2></div><span className="label">A2A v{result?.a2a.protocolVersion ?? "1.0"}</span></div>
          {!result ? <div className="empty-state"><span>↔</span><p>The buyer and seller will negotiate volume and seasonal pricing within deterministic rules.</p></div> : (
            <div className="quote-list">
              <div className="agent-note"><span>{result.agent.source === "openai-agent" ? "OPENAI BUYER" : "DETERMINISTIC BUYER"}</span><p>{result.agent.summary}</p></div>
              <div className="negotiation-list">
                {result.negotiation.turns.map((turn, index) => <div className={`negotiation-turn ${turn.actor}`} key={`${turn.actor}-${index}`}><b>{turn.actor === "buyer" ? "BUYER" : "SELLER"}</b><p>{turn.message}</p></div>)}
              </div>
              {result.decisions.map(quote => (
                <article className={`quote ${quote.eligible ? "eligible" : "rejected"}`} key={quote.id}>
                  <div className="quote-top"><div><strong>{quote.provider}</strong><span>{quote.description}</span></div><b>{formatUsd(quote.amountCents)}</b></div>
                  <div className="quote-metrics"><span>{formatUsd(quote.unitCostCents)}/mission</span><span>{Math.round(quote.expectedReadinessRate * 100)}% readiness</span><span>MCC {quote.merchantCategoryCode}</span></div>
                  <p>{quote.eligible ? "✓ Meets every mandate rule" : `× ${quote.reasons.join(" · ")}`}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel timeline-panel">
          <div className="panel-heading"><div><span className="step-number">03</span><h2>Evidence timeline</h2></div><span className="label">UNIFIED RECEIPT</span></div>
          {!result ? <div className="timeline-placeholder"><div /><div /><div /><div /></div> : (
            <ol className="timeline">
              {result.timeline.map(item => (
                <li key={item.id} className={item.status}>
                  <span className="timeline-dot">{item.status === "declined" ? "×" : item.status === "warning" ? "!" : "✓"}</span>
                  <div><strong>{item.title}</strong><p>{item.detail}</p>{item.providerId && <code>{item.providerId}</code>}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>

      {result?.delivery && (
        <section className="receipt-bar">
          <div><span>NEGOTIATED PACKAGE</span><strong>{formatUsd(result.selected.amountCents)}</strong></div>
          <div><span>DELIVERY</span><strong className={result.delivery.passed ? "pass" : "fail"}>{result.delivery.passed ? `${result.delivery.missionsPrepared} missions verified` : "Failed"}</strong></div>
          <div><span>RAIN FULFILLMENT</span><strong>{result.rain ? `${formatUsd(result.rain.upstreamProcurementCents)} settled` : "Ready in live mode"}</strong></div>
          <div><span>MONAD X402 SALE</span><strong>{result.monad ? `${result.monad.amount} ${result.monad.asset} settled` : "Ready in live mode"}</strong>{result.monad && <a href={result.monad.explorerUrl} target="_blank" rel="noreferrer">View transaction ↗</a>}</div>
        </section>
      )}

      <section className="treasury-panel">
        <div>
          <p className="eyebrow">RAIN TREASURY RAILS</p>
          <h2>Prove USD ↔ stablecoin movement</h2>
          <p>Provision an ACH payout account and simulate the sandbox maximum: a $100 USD onramp and offramp. Rain requires its RUSD test token on Base here; this does not claim direct Monad conversion.</p>
        </div>
        <div className="treasury-action">
          <span>{treasuryStatus}</span>
          <button onClick={() => void runTreasuryDemo()} disabled={treasuryRunning || rainStatus !== "connected"}>{treasuryRunning ? "Running simulations…" : "Run treasury sandbox proof"}</button>
        </div>
        {treasury && <div className="treasury-results">
          <article><span>ONRAMP</span><strong>{treasury.onramp.route}</strong><p>${treasury.amount} · {treasury.onramp.status}</p>{treasury.onramp.note && <p>{treasury.onramp.note}</p>}<code>{treasury.onramp.simulationId}</code></article>
          <article><span>OFFRAMP</span><strong>{treasury.offramp.route}</strong><p>${treasury.amount} · {treasury.offramp.status}</p>{treasury.offramp.note && <p>{treasury.offramp.note}</p>}<code>{treasury.offramp.simulationId}</code></article>
          <small>{treasury.limitation}</small>
        </div>}
      </section>
    </main>
  );
}
