"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Check,
  Code2,
  ExternalLink,
  Home,
  Landmark,
  MessagesSquare,
  Play,
  Server,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RaingenticMark } from "@/components/raingentic-mark";
import { formatUsd, type Negotiation, type QuoteDecision } from "@/lib/purchasing";

type View = "overview" | "buying" | "selling" | "treasury" | "developers";

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
  delivery: null | { passed: boolean; missionsPrepared: number; measuredReadinessRate: number };
  rain: null | { upstreamProcurementCents: number };
  monad: null | { amount: string; asset: string; transactionHash: string; explorerUrl: string };
};

type TreasuryResult = {
  amount: string;
  onramp: { route: string; simulationId: string; status: string; note?: string };
  offramp: { route: string; simulationId: string; status: string; note?: string };
  limitation: string;
};

type PlatformStatus = {
  rain: { configured: boolean };
  monad: { buyerConfigured: boolean; sellerConfigured: boolean };
  a2a: { configured: boolean; protocolVersion: string };
};

const initialMandate = {
  objective: "Purchase 100 agricultural drone mission readiness packets with airspace, weather, compliance, risk, and telemetry coverage for the growing season.",
  budgetCents: 150_000,
  maxUnitCostCents: 1_500,
  minimumMissions: 100,
  minimumReadinessRate: 0.9,
};

const navigation = [
  { id: "overview" as const, label: "Home", icon: Home },
  { id: "buying" as const, label: "Buy", icon: ArrowDownToLine },
  { id: "selling" as const, label: "Sell", icon: ArrowUpFromLine },
  { id: "treasury" as const, label: "Treasury", icon: Landmark },
  { id: "developers" as const, label: "Developers", icon: Code2 },
];

function ConnectionBadge({ connected, children }: { connected: boolean; children: React.ReactNode }) {
  return <Badge variant={connected ? "secondary" : "outline"} className="gap-1.5 px-2.5 py-1 text-sm"><Check className="size-3.5" />{children}</Badge>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div className="max-w-3xl"><p className="mb-2 text-sm font-semibold text-muted-foreground">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1><p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p></div>{action}</div>;
}

export function PurchasingConsole() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [mandate, setMandate] = useState(initialMandate);
  const [liveRain, setLiveRain] = useState(false);
  const [rainConnected, setRainConnected] = useState(false);
  const [platform, setPlatform] = useState<PlatformStatus | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [treasury, setTreasury] = useState<TreasuryResult | null>(null);
  const [treasuryRoutes, setTreasuryRoutes] = useState(0);
  const [running, setRunning] = useState(false);
  const [treasuryRunning, setTreasuryRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<"mission" | "flight">("mission");

  useEffect(() => {
    fetch("/api/rain/health").then(response => {
      setRainConnected(response.ok);
    }).catch(() => setRainConnected(false));
    fetch("/api/rain/treasury").then(response => response.ok ? response.json() : null).then(data => data && setTreasuryRoutes(data.paymentRoutes)).catch(() => undefined);
    fetch("/api/platform/status").then(response => response.ok ? response.json() : null).then(data => data && setPlatform(data)).catch(() => undefined);
  }, []);

  const connections = useMemo(() => ({
    rain: platform?.rain.configured ?? rainConnected,
    monad: Boolean(platform?.monad.buyerConfigured && platform?.monad.sellerConfigured),
    a2a: platform?.a2a.configured ?? true,
  }), [platform, rainConnected]);

  function navigate(view: View) {
    setActiveView(view);
    setError(null);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  async function executeWorkflow(approved = false) {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mandate, liveRain, approved }) });
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
      setTreasuryRoutes(2);
    } catch (treasuryError) {
      setError(treasuryError instanceof Error ? treasuryError.message : "Treasury simulation failed");
    } finally {
      setTreasuryRunning(false);
    }
  }

  function submitWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executeWorkflow(false);
  }

  return <div className="dark min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar p-4 md:flex md:flex-col">
      <div className="flex h-12 items-center gap-3 px-2"><RaingenticMark className="size-9" /><div><p className="font-semibold">Raingentic</p><p className="text-sm text-muted-foreground">PreFlight workspace</p></div></div>
      <Separator className="my-4" />
      <nav className="space-y-1">{navigation.map(item => { const Glyph = item.icon; return <Button key={item.id} variant={activeView === item.id ? "secondary" : "ghost"} className="h-10 w-full justify-start gap-3 px-3 text-sm" onClick={() => navigate(item.id)}><Glyph className="size-4" />{item.label}</Button>; })}</nav>
      <div className="mt-auto"><Separator className="mb-4" /><div className="flex items-center justify-between px-2"><span className="text-sm text-muted-foreground">Test mode</span><Button variant="outline" size="sm" onClick={() => navigate("developers")}>Configure</Button></div></div>
    </aside>

    <div className="md:pl-64">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
        <p className="text-sm font-medium text-muted-foreground">PreFlight / {navigation.find(item => item.id === activeView)?.label}</p>
        <div className="hidden items-center gap-2 sm:flex"><ConnectionBadge connected={connections.rain}>Rain</ConnectionBadge><ConnectionBadge connected={connections.monad}>Monad</ConnectionBadge><ConnectionBadge connected={connections.a2a}>A2A</ConnectionBadge></div>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">{navigation.map(item => { const Glyph = item.icon; return <Button key={item.id} aria-label={item.label} variant={activeView === item.id ? "secondary" : "ghost"} size="icon" onClick={() => navigate(item.id)}><Glyph /></Button>; })}</div>

      <main className="mx-auto max-w-7xl space-y-8 p-4 md:p-8 lg:p-10">
        {activeView === "overview" && <>
          <PageHeader eyebrow="PreFlight commerce" title="Agent commerce with business controls." description="Configure the rules once, then let agents negotiate, pay, fulfill, and prove delivery." action={<Button size="lg" onClick={() => navigate("buying")}>Run the demo<ArrowRight /></Button>} />

          <Card>
            <CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-xl">Commerce workflow</CardTitle><CardDescription className="mt-1 text-sm">The complete path from a business request to verified delivery.</CardDescription></div><Badge variant="secondary" className="gap-2 text-sm"><Check />Ready</Badge></div></CardHeader>
            <CardContent><div className="grid gap-3 md:grid-cols-4">{[[Server,"Discover","A2A Agent Card"],[MessagesSquare,"Negotiate","Business mandate"],[ShieldCheck,"Approve","Human decision"],[WalletCards,"Settle","Monad or Rain"]].map(([Glyph,title,description]) => { const StepIcon = Glyph as typeof Server; return <div key={String(title)} className="rounded-lg border bg-card p-4"><StepIcon className="mb-4 size-5 text-muted-foreground" /><p className="font-medium">{String(title)}</p><p className="mt-1 text-sm text-muted-foreground">{String(description)}</p></div>; })}</div></CardContent>
            <CardFooter><Button onClick={() => navigate("buying")}>Create a purchasing mandate<ArrowRight /></Button></CardFooter>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card><CardHeader><CardTitle>Latest execution</CardTitle><CardDescription>{result ? "Most recent commerce workflow" : "No transaction has run yet"}</CardDescription></CardHeader><CardContent>{result ? <div className="grid gap-6 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Negotiated total</p><p className="mt-2 text-3xl font-semibold">{formatUsd(result.selected.amountCents)}</p></div><div><p className="text-sm text-muted-foreground">Payment</p><p className="mt-2 font-medium">{result.monad ? `${result.monad.amount} ${result.monad.asset}` : "Preview"}</p></div><div><p className="text-sm text-muted-foreground">Delivery</p><p className="mt-2 font-medium">{result.delivery?.passed ? `${result.delivery.missionsPrepared} verified` : "Ready"}</p></div></div> : <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6"><Play className="size-5 text-muted-foreground" /><div><p className="font-medium">Run the workflow once.</p><p className="mt-1 text-sm text-muted-foreground">The result, payment, and delivery proof will appear here.</p></div><Button variant="outline" onClick={() => navigate("buying")}>Start a purchase</Button></div>}</CardContent></Card>
            <Card><CardHeader><CardTitle>Infrastructure</CardTitle><CardDescription>Services connected to this workspace</CardDescription></CardHeader><CardContent className="space-y-4">{[["Rain","Cards and treasury",connections.rain],["Monad","Agent payments",connections.monad],["A2A","Discovery and negotiation",connections.a2a]].map(([name,description,connected]) => <div key={String(name)} className="flex items-center justify-between gap-4"><div><p className="font-medium">{String(name)}</p><p className="text-sm text-muted-foreground">{String(description)}</p></div><Badge variant={connected ? "secondary" : "outline"}>{connected ? "Ready" : "Setup"}</Badge></div>)}</CardContent><CardFooter><Button variant="outline" onClick={() => navigate("developers")}>View configuration</Button></CardFooter></Card>
          </div>
        </>}

        {activeView === "buying" && <>
          <PageHeader eyebrow="Buy" title="Set the policy. Let the agents work." description="The buyer can negotiate freely, but it cannot exceed these limits." action={<Badge variant="outline" className="px-3 py-1.5 text-sm">Rain sandbox and Monad Testnet</Badge>} />
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card><form onSubmit={submitWorkflow}><CardHeader><CardTitle>Purchasing mandate</CardTitle><CardDescription>Define the outcome and nonnegotiable business limits.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="objective">Outcome</Label><Textarea id="objective" className="min-h-32 text-sm leading-6" value={mandate.objective} onChange={event => setMandate({ ...mandate, objective: event.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="budget">Budget in US dollars</Label><Input id="budget" type="number" value={mandate.budgetCents / 100} onChange={event => setMandate({ ...mandate, budgetCents: Number(event.target.value) * 100 })} /></div><div className="space-y-2"><Label htmlFor="unit">Maximum unit price</Label><Input id="unit" type="number" step="0.01" value={mandate.maxUnitCostCents / 100} onChange={event => setMandate({ ...mandate, maxUnitCostCents: Number(event.target.value) * 100 })} /></div><div className="space-y-2"><Label htmlFor="missions">Minimum missions</Label><Input id="missions" type="number" value={mandate.minimumMissions} onChange={event => setMandate({ ...mandate, minimumMissions: Number(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor="readiness">Readiness threshold percent</Label><Input id="readiness" type="number" value={mandate.minimumReadinessRate * 100} onChange={event => setMandate({ ...mandate, minimumReadinessRate: Number(event.target.value) / 100 })} /></div></div><Separator /><div className="flex items-center justify-between gap-6"><div><Label htmlFor="execute">Execute after approval</Label><p className="mt-1 text-sm text-muted-foreground">Use the configured sandbox and testnet rails.</p></div><Switch id="execute" checked={liveRain} onCheckedChange={setLiveRain} /></div>{result?.requiresApproval && result.approval && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4"><p className="font-medium">Human approval required</p><p className="mt-1 text-sm text-muted-foreground">Approve {formatUsd(result.approval.amountCents)} for {result.approval.provider}. Nothing has moved yet.</p><Button className="mt-4" type="button" onClick={() => void executeWorkflow(true)} disabled={running}>Approve and execute</Button></div>}{error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}</CardContent><CardFooter><Button className="w-full" size="lg" disabled={running || (liveRain && !rainConnected)}>{running ? "Agents are negotiating" : liveRain ? "Negotiate and request approval" : "Preview negotiation"}<ArrowRight /></Button></CardFooter></form></Card>
            <Card><CardHeader><CardTitle>Business controls</CardTitle><CardDescription>Deterministic rules that the AI cannot change.</CardDescription></CardHeader><CardContent className="space-y-5">{[["Approval","Required before payment"],["Card category","Software and data only"],["Transaction cap",formatUsd(mandate.budgetCents)],["Delivery","Verify before completion"]].map(([term,value]) => <div key={term}><p className="text-sm text-muted-foreground">{term}</p><p className="mt-1 font-medium">{value}</p></div>)}</CardContent></Card>
          </div>

          <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>A2A negotiation</CardTitle><CardDescription className="mt-1">{result ? "Buyer and seller reached an agreement" : "Run the mandate to begin"}</CardDescription></div><Badge variant="outline">A2A v{result?.a2a.protocolVersion ?? "1.0"}</Badge></div></CardHeader><CardContent>{!result ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center"><MessagesSquare className="size-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">The transcript and eligible offers will appear here.</p></div> : <Tabs defaultValue="transcript"><TabsList><TabsTrigger value="transcript">Transcript</TabsTrigger><TabsTrigger value="offers">Offers</TabsTrigger><TabsTrigger value="receipt">Receipt</TabsTrigger></TabsList><TabsContent value="transcript" className="mt-5 space-y-3"><div className="rounded-lg bg-muted p-4 text-sm leading-6">{result.agent.summary}</div>{result.negotiation.turns.map((turn,index) => <div key={`${turn.actor}-${index}`} className="rounded-lg border p-4"><Badge variant="outline" className="mb-2 capitalize">{turn.actor}</Badge><p className="text-sm leading-6 text-muted-foreground">{turn.message}</p></div>)}</TabsContent><TabsContent value="offers" className="mt-5"><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Price</TableHead><TableHead>Readiness</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{result.decisions.map(quote => <TableRow key={quote.id}><TableCell><p className="font-medium">{quote.provider}</p><p className="mt-1 text-sm text-muted-foreground">{quote.description}</p></TableCell><TableCell>{formatUsd(quote.amountCents)}</TableCell><TableCell>{Math.round(quote.expectedReadinessRate * 100)} percent</TableCell><TableCell><Badge variant={quote.eligible ? "secondary" : "outline"}>{quote.eligible ? "Selected" : "Rejected"}</Badge></TableCell></TableRow>)}</TableBody></Table></TabsContent><TabsContent value="receipt" className="mt-5 space-y-4">{result.timeline.map(item => <div key={item.id} className="flex gap-3"><div className="mt-0.5">{item.status === "warning" || item.status === "declined" ? <AlertTriangle className="size-4 text-amber-500" /> : <Check className="size-4 text-emerald-500" />}</div><div><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p></div></div>)}</TabsContent></Tabs>}</CardContent></Card>
        </>}

        {activeView === "selling" && <>
          <PageHeader eyebrow="Sell" title="Turn APIs into agent products." description="Publish a service, define the pricing floor, and collect payment through x402." />
          <Card><CardHeader><CardTitle>Product catalog</CardTitle><CardDescription>Services available to agent buyers</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Status</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><p className="font-medium">Mission readiness packet</p><p className="mt-1 text-sm text-muted-foreground">Airspace, weather, compliance, risk, and telemetry</p></TableCell><TableCell><Badge variant="secondary">Live</Badge></TableCell><TableCell>$0.01 using Monad x402</TableCell><TableCell className="text-right"><Button variant={selectedProduct === "mission" ? "secondary" : "outline"} onClick={() => setSelectedProduct("mission")}>{selectedProduct === "mission" ? "Selected" : "View"}</Button></TableCell></TableRow><TableRow><TableCell><p className="font-medium">Flight readiness report</p><p className="mt-1 text-sm text-muted-foreground">Location specific operational assessment</p></TableCell><TableCell><Badge variant="outline">Draft</Badge></TableCell><TableCell>Volume pricing</TableCell><TableCell className="text-right"><Button variant={selectedProduct === "flight" ? "secondary" : "outline"} onClick={() => setSelectedProduct("flight")}>{selectedProduct === "flight" ? "Selected" : "View"}</Button></TableCell></TableRow></TableBody></Table></CardContent></Card>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card><CardHeader><CardTitle>{selectedProduct === "mission" ? "Mission packet guardrails" : "Flight report guardrails"}</CardTitle><CardDescription>The seller cannot negotiate outside these parameters.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{[["Starting price",selectedProduct === "mission" ? "$18.00 per mission" : "$0.10 per report"],["Price floor",selectedProduct === "mission" ? "$14.50 per mission" : "$0.06 per report"],["Volume discount","Up to 20 percent"],["Settlement","Monad USDC"]].map(([term,value]) => <div key={term}><p className="text-sm text-muted-foreground">{term}</p><p className="mt-1 font-medium">{value}</p></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Agent endpoints</CardTitle><CardDescription>Public routes used by buyer agents</CardDescription></CardHeader><CardContent className="space-y-4"><div><p className="text-sm text-muted-foreground">Discovery</p><code className="mt-1 block text-sm">/.well-known/agent-card.json</code></div><div><p className="text-sm text-muted-foreground">Negotiation</p><code className="mt-1 block text-sm">/api/a2a</code></div><div><p className="text-sm text-muted-foreground">Paid delivery</p><code className="mt-1 block text-sm">/api/x402/mission-readiness</code></div></CardContent><CardFooter><Button asChild variant="outline"><a href="/.well-known/agent-card.json" target="_blank">Open Agent Card<ExternalLink /></a></Button></CardFooter></Card>
          </div>
        </>}

        {activeView === "treasury" && <>
          <PageHeader eyebrow="Treasury" title="Fund spending and withdraw revenue." description="Demonstrate the Rain sandbox routes that move between US dollars and RUSD." action={<Badge variant="outline" className="px-3 py-1.5 text-sm">Rain sandbox</Badge>} />
          <Card><CardHeader><CardTitle>Onramp and offramp proof</CardTitle><CardDescription>Rain route provisioning and sandbox simulation</CardDescription></CardHeader><CardContent><div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]"><div className="rounded-lg border p-5 text-center"><p className="text-sm text-muted-foreground">Bank account</p><p className="mt-2 text-2xl font-semibold">USD</p></div><ArrowRight className="mx-auto hidden size-5 text-muted-foreground md:block" /><div className="rounded-lg border bg-muted p-5 text-center"><p className="text-sm text-muted-foreground">Rain balance</p><p className="mt-2 text-2xl font-semibold">RUSD</p></div><ArrowRight className="mx-auto hidden size-5 text-muted-foreground md:block" /><div className="rounded-lg border p-5 text-center"><p className="text-sm text-muted-foreground">Bank account</p><p className="mt-2 text-2xl font-semibold">USD</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Simulation maximum</p><p className="mt-1 font-medium">$100.00</p></div><div><p className="text-sm text-muted-foreground">Payment routes</p><p className="mt-1 font-medium">{treasuryRoutes}</p></div><div><p className="text-sm text-muted-foreground">Environment</p><p className="mt-1 font-medium">Rain sandbox</p></div></div>{error && <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}{treasury && <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border p-4"><p className="font-medium">Onramp {treasury.onramp.status}</p><p className="mt-1 text-sm text-muted-foreground">{treasury.onramp.route}</p><code className="mt-3 block break-all text-sm">{treasury.onramp.simulationId}</code></div><div className="rounded-lg border p-4"><p className="font-medium">Offramp {treasury.offramp.status}</p><p className="mt-1 text-sm text-muted-foreground">{treasury.offramp.route}</p><code className="mt-3 block break-all text-sm">{treasury.offramp.simulationId}</code></div></div>}</CardContent><CardFooter><Button onClick={() => void runTreasuryDemo()} disabled={treasuryRunning || !rainConnected}>{treasuryRunning ? "Running proof" : "Run treasury proof"}<ArrowRight /></Button></CardFooter></Card>
        </>}

        {activeView === "developers" && <>
          <PageHeader eyebrow="Developers" title="Connect the rails once." description="Credentials remain on the server. Agents receive only the capabilities they need." action={<Button asChild variant="outline"><a href="/.well-known/agent-card.json" target="_blank">Agent Card<ExternalLink /></a></Button>} />
          <div className="grid gap-6 lg:grid-cols-3">{[["Rain","Cards and treasury",connections.rain,[["API key","RAIN_API_KEY"],["User","RAIN_USER_ID"],["Collateral","RAIN_CONTRACT_ID"]]],["Monad","Agent payments",connections.monad,[["Buyer signer","MONAD_BUYER_PRIVATE_KEY"],["Seller","MONAD_PROVIDER_ADDRESS"],["Network","eip155:10143"]]],["A2A","Discovery and tasks",connections.a2a,[["Protocol","A2A v1.0"],["Binding","JSON-RPC"],["Streaming","Enabled"]]]].map(([name,description,connected,items]) => <Card key={String(name)}><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{String(name)}</CardTitle><CardDescription className="mt-1">{String(description)}</CardDescription></div><ConnectionBadge connected={Boolean(connected)}>{connected ? "Ready" : "Setup"}</ConnectionBadge></div></CardHeader><CardContent className="space-y-4">{(items as string[][]).map(([term,value]) => <div key={term} className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{term}</p><code className="max-w-48 truncate text-sm">{value}</code></div>)}</CardContent></Card>)}</div>
          <Card><CardHeader><CardTitle>Reference integration</CardTitle><CardDescription>Working routes from the current implementation</CardDescription></CardHeader><CardContent><Tabs defaultValue="buyer"><TabsList><TabsTrigger value="buyer">Buyer</TabsTrigger><TabsTrigger value="seller">Seller</TabsTrigger></TabsList><TabsContent value="buyer" className="mt-5"><pre className="overflow-x-auto rounded-lg border bg-muted p-5 text-sm leading-7">{`const result = await fetch("/api/purchases/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mandate, liveRain: true, approved: true })
});`}</pre></TabsContent><TabsContent value="seller" className="mt-5"><pre className="overflow-x-auto rounded-lg border bg-muted p-5 text-sm leading-7">{`GET  /.well-known/agent-card.json
POST /api/a2a
GET  /api/x402/mission-readiness

Discover, negotiate, pay, and deliver.`}</pre></TabsContent></Tabs></CardContent></Card>
        </>}
      </main>
    </div>
  </div>;
}
