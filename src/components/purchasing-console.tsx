"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatUsd, type QuoteDecision } from "@/lib/purchasing";

type WorkflowResult = {
  decisions: QuoteDecision[];
  selected: QuoteDecision;
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    status: "complete" | "declined" | "verified" | "warning";
    providerId?: string;
  }>;
  delivery: {
    passed: boolean;
    checks: Array<{ label: string; passed: boolean; detail: string }>;
  };
};

const initialMandate = {
  objective: "Purchase verified GTM campaign contacts for a Canadian hardware and software business.",
  budgetCents: 5000,
  maxUnitCostCents: 40,
  minimumRecords: 100,
  minimumQualityRate: 0.9,
};

export function PurchasingConsole() {
  const [mandate, setMandate] = useState(initialMandate);
  const [liveRain, setLiveRain] = useState(false);
  const [rainStatus, setRainStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rain/health")
      .then((response) => {
        if (!response.ok) throw new Error("Rain unavailable");
        setRainStatus("connected");
      })
      .catch(() => setRainStatus("offline"));
  }, []);

  async function runWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/purchases/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandate, liveRain }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Purchase workflow failed");
      setResult(data);
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Purchase workflow failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span>Raingentic</span>
        </div>
        <div className="rail-statuses">
          <span className={`status-pill ${rainStatus}`}>
            <i /> Rain {rainStatus === "checking" ? "checking" : rainStatus}
          </span>
          <span className="status-pill planned"><i /> Monad next</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">PURCHASE CONTROL PLANE</p>
          <h1>Give an agent a goal.<br />Keep control of the money.</h1>
          <p className="hero-copy">
            One mandate connects vendor selection, payment policy, Rain card controls,
            and proof that the business received what it purchased.
          </p>
        </div>
        <div className="hero-proof">
          <span>Current proof</span>
          <strong>Rain card lifecycle</strong>
          <small>Monad x402 follows after settlement works</small>
        </div>
      </section>

      <section className="workspace">
        <form className="panel mandate-panel" onSubmit={runWorkflow}>
          <div className="panel-heading">
            <div><span className="step-number">01</span><h2>Purchase mandate</h2></div>
            <span className="label">BUSINESS INPUT</span>
          </div>

          <label>
            What should the agent purchase?
            <textarea
              value={mandate.objective}
              onChange={(event) => setMandate({ ...mandate, objective: event.target.value })}
              rows={4}
            />
          </label>

          <div className="field-grid">
            <label>
              Total budget
              <div className="input-prefix"><span>$</span><input type="number" value={mandate.budgetCents / 100} onChange={(event) => setMandate({ ...mandate, budgetCents: Number(event.target.value) * 100 })} /></div>
            </label>
            <label>
              Max per record
              <div className="input-prefix"><span>$</span><input type="number" step="0.01" value={mandate.maxUnitCostCents / 100} onChange={(event) => setMandate({ ...mandate, maxUnitCostCents: Number(event.target.value) * 100 })} /></div>
            </label>
            <label>
              Minimum records
              <input type="number" value={mandate.minimumRecords} onChange={(event) => setMandate({ ...mandate, minimumRecords: Number(event.target.value) })} />
            </label>
            <label>
              Minimum quality
              <div className="input-suffix"><input type="number" value={mandate.minimumQualityRate * 100} onChange={(event) => setMandate({ ...mandate, minimumQualityRate: Number(event.target.value) / 100 })} /><span>%</span></div>
            </label>
          </div>

          <div className="rail-toggle">
            <div>
              <strong>Use live Rain sandbox</strong>
              <span>Create a real scoped card and simulated transactions</span>
            </div>
            <button type="button" role="switch" aria-checked={liveRain} className={liveRain ? "switch active" : "switch"} onClick={() => setLiveRain(!liveRain)}><span /></button>
          </div>

          {error && <p className="error-message">{error}</p>}
          <button className="primary-button" disabled={running || (liveRain && rainStatus !== "connected")}>
            {running ? "Running purchase…" : liveRain ? "Run live Rain proof" : "Preview controlled purchase"}
            <span>→</span>
          </button>
        </form>

        <section className="panel quote-panel">
          <div className="panel-heading">
            <div><span className="step-number">02</span><h2>Provider decision</h2></div>
            <span className="label">POLICY ENGINE</span>
          </div>
          {!result ? (
            <div className="empty-state"><span>3</span><p>Run the mandate to compare three providers against deterministic rules.</p></div>
          ) : (
            <div className="quote-list">
              {result.decisions.map((quote) => (
                <article className={`quote ${quote.eligible ? "eligible" : "rejected"}`} key={quote.id}>
                  <div className="quote-top">
                    <div><strong>{quote.provider}</strong><span>{quote.description}</span></div>
                    <b>{formatUsd(quote.amountCents)}</b>
                  </div>
                  <div className="quote-metrics"><span>{formatUsd(quote.unitCostCents)}/record</span><span>{Math.round(quote.expectedQualityRate * 100)}% quality</span><span>MCC {quote.merchantCategoryCode}</span></div>
                  <p>{quote.eligible ? "✓ Meets every mandate rule" : `× ${quote.reasons.join(" · ")}`}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel timeline-panel">
          <div className="panel-heading">
            <div><span className="step-number">03</span><h2>Evidence timeline</h2></div>
            <span className="label">AUDIT RECEIPT</span>
          </div>
          {!result ? (
            <div className="timeline-placeholder"><div /><div /><div /><div /></div>
          ) : (
            <ol className="timeline">
              {result.timeline.map((item) => (
                <li key={item.id} className={item.status}>
                  <span className="timeline-dot">{item.status === "declined" ? "×" : item.status === "warning" ? "!" : "✓"}</span>
                  <div><strong>{item.title}</strong><p>{item.detail}</p>{item.providerId && <code>{item.providerId}</code>}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>

      {result && (
        <section className="receipt-bar">
          <div><span>SELECTED PROVIDER</span><strong>{result.selected.provider}</strong></div>
          <div><span>AUTHORIZED AMOUNT</span><strong>{formatUsd(result.selected.amountCents)}</strong></div>
          <div><span>DELIVERY</span><strong className={result.delivery.passed ? "pass" : "fail"}>{result.delivery.passed ? "Verified" : "Failed"}</strong></div>
          <div><span>NEXT RAIL</span><strong>Monad x402</strong></div>
        </section>
      )}
    </main>
  );
}
