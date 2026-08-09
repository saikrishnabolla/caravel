"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import {
  AppWindow,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CircleDollarSign,
  Code2,
  Copy,
  CreditCard,
  Database,
  FileCheck2,
  Landmark,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  Play,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TimelineItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
};

type PurchaseResult = {
  timeline: TimelineItem[];
  requiresApproval: boolean;
  approval?: { provider: string; amountCents: number } | null;
  selected?: { provider: string; amountCents: number };
  monad?: { transactionHash: string; explorerUrl: string; amount: string; asset: string } | null;
  rain?: { settlement?: { transactionId: string } } | null;
  delivery?: { passed: boolean; missionsPrepared: number } | null;
};

type ParsedMandate = {
  objective: string;
  budgetCents: number;
  maxUnitCostCents: number;
  minimumMissions: number;
  minimumReadinessRate: number;
  geography: string;
  categories: string[];
  requiresApproval: boolean;
  source: string;
};

type Provider = {
  id: string;
  name: string;
  kind: string;
  payment: string;
  approved: boolean;
  reputation: number;
  samplePriceCents: number;
  freshness: string;
};

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "The request failed");
  return body as T;
}

function Step({ icon: Icon, title, description }: { icon: typeof Check; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Icon className="mb-5 size-5 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{message}</div>;
}

export function CommerceStory() {
  return (
    <div className="not-prose my-8 space-y-6">
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary">PreFlight reference implementation</Badge>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">One control layer for company agents that buy and sell.</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Raingentic connects an existing business to A2A, AP2, x402, Monad, and Rain without replacing its application or checkout.</p>
          </div>
          <Button asChild size="lg"><Link href="/demo">Open the guided demo<ArrowRight /></Link></Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><ShoppingCart className="size-5 text-muted-foreground" /><CardTitle className="mt-4 text-xl">Company buying</CardTitle><CardDescription>Agents purchase APIs, software, data, and traditional merchant products within business policy.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2"><Step icon={ShieldCheck} title="Controlled" description="Budget, vendor, product, and approval rules remain authoritative." /><Step icon={WalletCards} title="Rail aware" description="Use x402 for APIs and scoped Rain cards for traditional merchants." /></CardContent>
        </Card>
        <Card>
          <CardHeader><Store className="size-5 text-muted-foreground" /><CardTitle className="mt-4 text-xl">Company selling</CardTitle><CardDescription>Existing APIs and products become discoverable, negotiable, and payable by other agents.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2"><Step icon={Code2} title="API ready" description="Publish products through an Agent Card and protected endpoints." /><Step icon={CircleDollarSign} title="Policy priced" description="Agents negotiate inside price floors, bundles, and discount limits." /></CardContent>
        </Card>
      </div>
    </div>
  );
}

const defaultMandate = {
  objective: "Purchase 100 agricultural drone mission readiness packets with airspace, weather, compliance, risk, and telemetry coverage for the growing season.",
  budgetCents: 150_000,
  maxUnitCostCents: 1_500,
  minimumMissions: 100,
  minimumReadinessRate: 0.9,
};

export function GuidedDemo() {
  const [live, setLive] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [approvalGranted, setApprovalGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(approved = false) {
    setRunning(true);
    setError(null);
    try {
      const data = await jsonRequest<PurchaseResult>("/api/purchases/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandate: defaultMandate, liveRain: live, approved }),
      });
      setResult(data);
      setApprovalGranted(approved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The demo failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="not-prose my-8 space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,hsl(184_16%_12%/0.96),hsl(180_16%_8%/0.82))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-9"><div aria-hidden="true" className="absolute -right-12 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><Badge variant="outline">Company story</Badge><h2 className="mt-5 text-3xl font-semibold tracking-tight">PreFlight sells to a customer, buys what it needs, and delivers the result.</h2><p className="mt-3 text-base leading-7 text-muted-foreground">One run demonstrates the selling product, the buying product, human approval, Monad payment, Rain-controlled procurement, and verified delivery.</p></div><Button size="lg" onClick={() => void run(false)} disabled={running}>{running ? <Loader2 className="animate-spin" /> : <Play />}{running ? "Running customer order" : result ? "Run story again" : "Run the full story"}</Button></div></div>

      <Card><CardHeader><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><CardTitle>Today&apos;s customer order</CardTitle><CardDescription>The exact business story shown to judges and customers.</CardDescription></div><details className="text-sm"><summary className="cursor-pointer font-medium text-muted-foreground">Demo settings</summary><div className="mt-3 flex items-center gap-3 rounded-lg border p-3"><div><Label htmlFor="live-demo">Use sandbox and testnet payments</Label><p className="mt-1 text-sm text-muted-foreground">Leave off for a safe rehearsal.</p></div><Switch id="live-demo" checked={live} onCheckedChange={setLive} /></div></details></div></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]"><div className="rounded-lg border p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-secondary"><ShoppingCart className="size-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Customer</p><p className="font-semibold">FarmFleet Operations</p></div></div><p className="mt-5 text-lg font-semibold">Buys 100 mission-readiness reports</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Airspace, weather, compliance, risk, and telemetry for planned agricultural drone missions.</p><div className="mt-4 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Order value</span><span className="font-semibold">$1,450</span></div></div><ArrowRight className="mx-auto hidden size-5 self-center text-muted-foreground md:block" /><div className="rounded-lg border border-primary/25 bg-secondary/35 p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Store className="size-5" /></div><div><p className="text-sm text-muted-foreground">Your company</p><p className="font-semibold">PreFlight</p></div></div><p className="mt-5 text-lg font-semibold">Negotiates and controls fulfillment</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The seller agent agrees on customer terms. The buying agent sources the required upstream coverage.</p><div className="mt-4 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Approval limit</span><span className="font-semibold">$500</span></div></div><ArrowRight className="mx-auto hidden size-5 self-center text-muted-foreground md:block" /><div className="rounded-lg border p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-secondary"><PackageCheck className="size-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Customer receives</p><p className="font-semibold">Verified delivery</p></div></div><p className="mt-5 text-lg font-semibold">100 completed reports</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The delivered package is checked against quantity and readiness requirements before completion.</p><div className="mt-4 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Readiness coverage</span><span className="font-semibold">96%</span></div></div></div></CardContent></Card>

      {error && <ErrorNotice message={error} />}

      <Card><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Live order status</CardTitle><CardDescription>{!result ? "Ready to receive the customer order" : !approvalGranted ? "The order is prepared and waiting for a human decision" : "The order completed with a verified delivery record"}</CardDescription></div>{result && !approvalGranted && <Button onClick={() => void run(true)} disabled={running}>{running ? <Loader2 className="animate-spin" /> : <FileCheck2 />}Approve and continue</Button>}</div></CardHeader><CardContent>{!result ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[ShoppingCart,"1. Customer order","Waiting"],[Store,"2. Sell and negotiate","Waiting"],[WalletCards,"3. Buy upstream inputs","Waiting"],[PackageCheck,"4. Verify delivery","Waiting"]].map(([Glyph,title,status]) => { const Icon = Glyph as typeof ShoppingCart; return <div key={String(title)} className="rounded-lg border p-4"><Icon className="size-5 text-muted-foreground" /><p className="mt-4 font-medium">{String(title)}</p><p className="mt-1 text-sm text-muted-foreground">{String(status)}</p></div>; })}</div> : <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Customer order","Received",true],["Seller agreement","$1,450 agreed",true],["Human approval",approvalGranted ? "Approved" : "Waiting",approvalGranted],["Delivery",approvalGranted && result.delivery?.passed ? "Verified" : "Not started",Boolean(approvalGranted && result.delivery?.passed)]].map(([title,status,complete]) => <div key={String(title)} className={`rounded-lg border p-4 ${complete ? "border-primary/20 bg-secondary/40" : ""}`}><div className={`flex size-7 items-center justify-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{complete ? <Check className="size-4" /> : <span className="text-sm">{String(title).charAt(0)}</span>}</div><p className="mt-4 font-medium">{String(title)}</p><p className="mt-1 text-sm text-muted-foreground">{String(status)}</p></div>)}</div>{!approvalGranted && <div className="flex flex-col gap-4 rounded-lg border border-primary/25 bg-secondary/35 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Approve the $1,450 customer fulfillment plan</p><p className="mt-1 text-sm text-muted-foreground">The purchase is above PreFlight&apos;s $500 automatic limit. No money has moved.</p></div><Button onClick={() => void run(true)} disabled={running}>Approve and continue<ArrowRight /></Button></div>}{approvalGranted && <div className="flex flex-col gap-4 rounded-lg border border-primary/25 bg-secondary/35 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold"><BadgeCheck className="size-5 text-primary" />Customer order completed</div><p className="mt-1 text-sm text-muted-foreground">100 mission reports were delivered with 96% readiness coverage and passed the customer&apos;s requirements.</p></div><Badge variant="secondary">Verified delivery</Badge></div>}<details className="rounded-lg border"><summary className="cursor-pointer px-5 py-4 font-medium">Technical receipt</summary><div className="space-y-1 border-t px-5 py-2">{result.timeline.map((item,index) => <div key={item.id} className="grid gap-3 border-b py-4 last:border-0 md:grid-cols-[1.5rem_1fr_auto]"><div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{index + 1}</div><div><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p></div><Badge variant={item.status === "warning" ? "outline" : "secondary"}>{item.status}</Badge></div>)}</div></details></div>}</CardContent></Card>
    </div>
  );
}

const buyingPrompt = "Find companies and public-service organizations operating drone programs in the United States. Purchase enough recent company and contact data to produce 100 qualified accounts. Spend no more than $300 and require approval for any new vendor.";

export function BuyingWorkbench() {
  const [request, setRequest] = useState(buyingPrompt);
  const [mandate, setMandate] = useState<ParsedMandate | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [running, setRunning] = useState<"parse" | "discover" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function parse() {
    setRunning("parse"); setError(null);
    try {
      setMandate(await jsonRequest<ParsedMandate>("/api/mandates/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request }) }));
      setProviders([]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The mandate could not be prepared"); }
    finally { setRunning(null); }
  }

  async function discover() {
    if (!mandate) return;
    setRunning("discover"); setError(null);
    try {
      const data = await jsonRequest<{ providers: Provider[] }>("/api/providers/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mandate }) });
      setProviders(data.providers);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Provider discovery failed"); }
    finally { setRunning(null); }
  }

  return (
    <div className="not-prose my-8 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-xl">Describe the business outcome</CardTitle><CardDescription>OpenAI can prepare the mandate. The user confirms it before provider discovery or payment.</CardDescription></CardHeader>
        <CardContent className="space-y-4"><Textarea value={request} onChange={event => setRequest(event.target.value)} className="min-h-36 text-base leading-7" /><Button onClick={() => void parse()} disabled={running !== null || !request.trim()}>{running === "parse" ? <Loader2 className="animate-spin" /> : <FileCheck2 />}{running === "parse" ? "Preparing mandate" : "Prepare mandate"}</Button>{error && <ErrorNotice message={error} />}</CardContent>
      </Card>

      {mandate && <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Human confirmation</CardTitle><CardDescription>These rules become authoritative after confirmation.</CardDescription></div><Badge variant="secondary">{mandate.source}</Badge></div></CardHeader><CardContent><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[["Budget",`$${(mandate.budgetCents / 100).toFixed(2)}`],["Maximum unit price",`$${(mandate.maxUnitCostCents / 100).toFixed(2)}`],["Minimum results",String(mandate.minimumMissions)],["Geography",mandate.geography],["Approval",mandate.requiresApproval ? "New vendors require approval" : "Policy approved"],["Categories",mandate.categories.join(", ")]].map(([label,value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</div></CardContent><CardFooter><Button onClick={() => void discover()} disabled={running !== null}>{running === "discover" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}{running === "discover" ? "Evaluating providers" : "Confirm and discover providers"}</Button></CardFooter></Card>}

      {providers.length > 0 && <Card><CardHeader><CardTitle>Provider evaluation</CardTitle><CardDescription>Approved providers come first. New providers remain behind human approval.</CardDescription></CardHeader><CardContent className="space-y-3">{providers.map((provider,index) => <div key={provider.id} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[2rem_1.3fr_1fr_1fr_auto] md:items-center"><div className="flex size-7 items-center justify-center rounded-full bg-secondary text-sm font-medium">{index + 1}</div><div><p className="font-medium">{provider.name}</p><p className="mt-1 text-sm text-muted-foreground">{provider.kind}</p></div><div><p className="text-sm text-muted-foreground">Payment</p><p className="mt-1 font-medium">{provider.payment}</p></div><div><p className="text-sm text-muted-foreground">Evidence</p><p className="mt-1 font-medium">{provider.reputation}/100, {provider.freshness}</p></div><Badge variant={provider.approved ? "secondary" : "outline"}>{provider.approved ? "Approved" : "Review"}</Badge></div>)}</CardContent></Card>}
    </div>
  );
}

type ProductType = "API" | "Data" | "Software" | "Service" | "Hardware";

const products: Array<{ id: string; name: string; type: ProductType; category: string; description: string; price: string; floor: string; discount: string; unit: string; payment: string; status: "Active" | "Draft" }> = [
  { id: "preflight-api", name: "PreFlight Operations API", type: "API", category: "Developer platform", description: "One commercial API for complete flight-readiness assessments. Weather, winds aloft, airspace, restrictions, traffic, terrain, land rules, obstacles, and GNSS are included capabilities, not separate products.", price: "0.25", floor: "0.15", discount: "25", unit: "per assessment", payment: "Monad x402", status: "Active" },
  { id: "preflight-fleet", name: "PreFlight Fleet", type: "Software", category: "Team software", description: "A shared operations workspace for aircraft profiles, launch sites, company policies, readiness history, and team purchasing controls.", price: "299.00", floor: "249.00", discount: "15", unit: "per month", payment: "Rain card or invoice", status: "Active" },
  { id: "preflight-enterprise", name: "PreFlight Enterprise", type: "Software", category: "Enterprise software", description: "Fleet-wide readiness workflows, custom policy, API volume, organization controls, onboarding, and priority support.", price: "1500.00", floor: "1200.00", discount: "20", unit: "per month", payment: "Rain card or invoice", status: "Active" },
  { id: "mission-report", name: "Mission Readiness Report", type: "Service", category: "Operational deliverable", description: "A customer-ready report covering weather, airspace, hazards, aviation activity, terrain, obstacles, and aircraft-specific limits for one mission.", price: "29.00", floor: "20.00", discount: "20", unit: "per report", payment: "Rain card or invoice", status: "Active" },
  { id: "site-risk-assessment", name: "Launch-Site Risk Assessment", type: "Service", category: "Operational service", description: "A deeper review for a recurring launch site, including operational constraints, local hazards, airspace context, and documented evidence.", price: "145.00", floor: "110.00", discount: "20", unit: "per site", payment: "Rain card or invoice", status: "Active" },
  { id: "compliance-review", name: "Airspace Compliance Review", type: "Service", category: "Partner-delivered service", description: "A documented airspace and operating-rules review with partner coordination when formal authorization or specialist support is required.", price: "250.00", floor: "195.00", discount: "20", unit: "per operation", payment: "Rain card or invoice", status: "Active" },
  { id: "dji-matrice-4e", name: "DJI Matrice 4E Surveying Kit", type: "Hardware", category: "Surveying and mapping", description: "A real DJI Matrice 4E enterprise mapping package with controller, batteries, charging equipment, setup, and PreFlight onboarding.", price: "7499.00", floor: "6999.00", discount: "7", unit: "starting price", payment: "Rain card or invoice", status: "Active" },
  { id: "dji-dock-3", name: "DJI Dock 3 Autonomous Operations Kit", type: "Hardware", category: "Remote operations", description: "A real DJI Dock 3 deployment packaged with a compatible Matrice 4D-series aircraft, site planning, commissioning, and operations onboarding.", price: "34999.00", floor: "32999.00", discount: "6", unit: "starting price", payment: "Rain card or invoice", status: "Active" },
  { id: "dji-agras-t50", name: "DJI AGRAS T50 Application Kit", type: "Hardware", category: "Agricultural application", description: "A real DJI AGRAS T50 agricultural drone package for spraying, spreading, and surveying, with batteries, charging equipment, and deployment support.", price: "24999.00", floor: "22999.00", discount: "8", unit: "starting price", payment: "Rain card or invoice", status: "Active" },
  { id: "xag-p150", name: "XAG P150 Agricultural Application Kit", type: "Hardware", category: "Agricultural application", description: "A real XAG P150 package for spraying, spreading, and field mapping, configured with the required application system, batteries, charger, and onboarding.", price: "30000.00", floor: "27500.00", discount: "8", unit: "starting price", payment: "Rain card or invoice", status: "Active" },
];

function ProductGlyph({ type }: { type: ProductType }) {
  const Icon = type === "API" ? Code2 : type === "Data" ? Database : type === "Software" ? AppWindow : type === "Hardware" ? PackageCheck : ShieldCheck;
  return <div className="flex size-10 items-center justify-center rounded-md bg-secondary"><Icon className="size-5 text-primary" /></div>;
}

export function SellingWorkbench() {
  const [selectedId, setSelectedId] = useState(products[0].id);
  const selected = products.find(product => product.id === selectedId) ?? products[0];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | ProductType>("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [price, setPrice] = useState(selected.price);
  const [floor, setFloor] = useState(selected.floor);
  const [discount, setDiscount] = useState(selected.discount);
  const [negotiationEnabled, setNegotiationEnabled] = useState(true);
  const [paymentChoice, setPaymentChoice] = useState(selected.payment);
  const [published, setPublished] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(id: string) {
    const product = products.find(item => item.id === id) ?? products[0];
    setSelectedId(id); setPrice(product.price); setFloor(product.floor); setDiscount(product.discount); setPaymentChoice(product.payment); setNegotiationEnabled(true); setPublished(null); setEditorOpen(true);
  }

  async function publish() {
    setRunning(true); setError(null);
    try {
      setPublished(await jsonRequest<Record<string, unknown>>("/api/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, name: selected.name, type: selected.type, price, floor, maximumDiscountPercent: discount }) }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The product could not be published"); }
    finally { setRunning(false); }
  }

  const filtered = products.filter(product => (filter === "All" || product.type === filter) && `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="not-prose my-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Catalog</p><p className="mt-2 text-2xl font-semibold">{products.length} products</p><p className="mt-1 text-sm text-muted-foreground">Platform, services, and hardware</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Published</p><p className="mt-2 text-2xl font-semibold">{products.filter(product => product.status === "Active").length} active</p><p className="mt-1 text-sm text-muted-foreground">Available to customers and agents</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Commercial model</p><p className="mt-2 text-2xl font-semibold">4 categories</p><p className="mt-1 text-sm text-muted-foreground">API, software, services, hardware</p></CardContent></Card></div>

      <Card>
        <CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Product catalog</CardTitle><CardDescription>PreFlight sells packaged outcomes. Its weather, airspace, traffic, terrain, and GNSS sources remain capabilities inside the platform.</CardDescription></div><Button onClick={() => { choose(products[0].id); setEditorOpen(true); }}><Plus />Add product</Button></div></CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-y px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search products" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" className="pl-9" /></div><div className="flex flex-wrap gap-2">{(["All","API","Software","Service","Hardware"] as const).map(value => <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} onClick={() => setFilter(value)}>{value}</Button>)}</div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b bg-muted/30 text-left text-muted-foreground"><th className="px-6 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Payment</th><th className="px-4 py-3 font-medium">Status</th><th className="w-12 px-4 py-3" /></tr></thead><tbody>{filtered.map(product => <tr key={product.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/25" onClick={() => choose(product.id)}><td className="px-6 py-4"><div className="flex items-center gap-3"><ProductGlyph type={product.type} /><div><p className="font-medium">{product.name}</p><p className="mt-1 max-w-md text-muted-foreground">{product.category}</p></div></div></td><td className="px-4 py-4"><Badge variant="outline">{product.type}</Badge></td><td className="px-4 py-4"><p className="font-medium">${Number(product.price).toLocaleString()}</p><p className="mt-1 text-muted-foreground">{product.unit}</p></td><td className="px-4 py-4">{product.payment}</td><td className="px-4 py-4"><Badge variant={product.status === "Active" ? "secondary" : "outline"}>{product.status}</Badge></td><td className="px-4 py-4"><Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={event => { event.stopPropagation(); choose(product.id); }}><MoreHorizontal /></Button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">No products match this search.</div>}</div>
        </CardContent>
      </Card>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
          <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l bg-background shadow-2xl outline-none">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b bg-background/95 px-6 py-5 backdrop-blur sm:px-8">
              <div className="flex items-center gap-3"><ProductGlyph type={selected.type} /><div><Dialog.Title className="text-xl font-semibold">{selected.name}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Edit what customers see and what buying agents are allowed to do.</Dialog.Description></div></div>
              <Dialog.Close asChild><Button variant="ghost" size="sm">Close</Button></Dialog.Close>
            </div>

            <div className="space-y-8 px-6 py-7 sm:px-8">
              <section><div className="mb-4 flex items-center gap-3"><div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</div><div><h3 className="font-semibold">Product and price</h3><p className="text-sm text-muted-foreground">Set the standard customer price.</p></div></div><div className="rounded-lg border p-5"><p className="font-medium">{selected.name}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{selected.description}</p><div className="mt-5 space-y-2"><Label htmlFor="selling-price">Customer price</Label><div className="grid grid-cols-[1fr_auto] gap-2"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="selling-price" type="number" value={price} onChange={event => setPrice(event.target.value)} className="pl-7" /></div><div className="flex min-w-32 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">{selected.unit}</div></div></div></div></section>

              <section><div className="mb-4 flex items-center gap-3"><div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</div><div><h3 className="font-semibold">Agent negotiation</h3><p className="text-sm text-muted-foreground">Choose whether buying agents can request a better price.</p></div></div><div className="rounded-lg border p-5"><div className="flex items-center justify-between gap-5"><div><p className="font-medium">Allow automatic negotiation</p><p className="mt-1 text-sm text-muted-foreground">Your seller agent can approve discounts inside the limits below.</p></div><Switch checked={negotiationEnabled} onCheckedChange={setNegotiationEnabled} aria-label="Allow automatic negotiation" /></div>{negotiationEnabled && <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="selling-discount">Largest allowed discount</Label><div className="relative"><Input id="selling-discount" type="number" value={discount} onChange={event => setDiscount(event.target.value)} className="pr-9" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div></div><div className="space-y-2"><Label htmlFor="selling-floor">Never sell below</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="selling-floor" type="number" value={floor} onChange={event => setFloor(event.target.value)} className="pl-7" /></div></div><div className="rounded-md bg-secondary/55 p-4 text-sm leading-6 sm:col-span-2">The agent may negotiate from <strong>${Number(price || 0).toLocaleString()}</strong> down to <strong>${Number(floor || 0).toLocaleString()}</strong>, with a maximum discount of <strong>{discount || 0}%</strong>.</div></div>}</div></section>

              <section><div className="mb-4 flex items-center gap-3"><div className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</div><div><h3 className="font-semibold">Payment and delivery</h3><p className="text-sm text-muted-foreground">Choose the checkout experience for this product.</p></div></div><div className="space-y-3">{[["Monad x402","Instant stablecoin payment","Best for APIs and data products"],["Rain card or invoice","Business payment","Best for services, subscriptions, and hardware"],["Existing checkout","Current payment processor","Keep the checkout already used by your company"]].map(([value,title,description]) => <button type="button" key={value} onClick={() => setPaymentChoice(value)} className={`flex w-full items-center justify-between gap-5 rounded-lg border p-4 text-left transition-colors ${paymentChoice === value ? "border-primary bg-secondary/55 ring-1 ring-primary" : "hover:bg-muted/35"}`}><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{paymentChoice === value && <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></div>}</button>)}</div><div className="mt-4 rounded-lg border bg-muted/25 p-4"><p className="text-sm text-muted-foreground">After payment</p><p className="mt-1 font-medium">{selected.type === "API" || selected.type === "Data" ? "Return the purchased API response automatically" : selected.type === "Software" ? "Activate the customer workspace automatically" : selected.type === "Service" ? "Create a fulfillment request for the operations team" : "Create a paid hardware order for fulfillment"}</p></div></section>

              <details className="rounded-lg border"><summary className="cursor-pointer px-5 py-4 font-medium">Advanced agent infrastructure</summary><div className="grid gap-4 border-t px-5 py-4 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">Product discovery</p><p className="mt-1 font-medium">Agent Card</p></div><div><p className="text-muted-foreground">Negotiation</p><p className="mt-1 font-medium">A2A</p></div><div><p className="text-muted-foreground">Payment authorization</p><p className="mt-1 font-medium">AP2 mandate</p></div><div><p className="text-muted-foreground">Settlement</p><p className="mt-1 font-medium">{paymentChoice}</p></div></div></details>

              {error && <ErrorNotice message={error} />}
              {published && <div className="rounded-lg border bg-secondary/40 p-4"><div className="flex items-center gap-2 font-medium"><BadgeCheck className="size-4" />Product published</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Customers and agents can now discover this product using the rules you selected.</p></div>}
            </div>

            <div className="sticky bottom-0 flex justify-between gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur sm:px-8"><Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close><div className="flex gap-3"><Button variant="outline">Save draft</Button><Button onClick={() => void publish()} disabled={running}>{running ? <Loader2 className="animate-spin" /> : <Store />}{running ? "Publishing" : "Publish product"}</Button></div></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

type RainLifecycle = {
  title: string;
  steps: Array<{ title: string; detail: string; status: string; id?: string }>;
};

function RainResults({ data }: { data: RainLifecycle | null }) {
  if (!data) return null;
  return <Card className="border-primary/15 bg-secondary/20"><CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-base">Sandbox execution record</CardTitle><CardDescription>{data.title}</CardDescription></div><Badge variant="secondary">Completed</Badge></div></CardHeader><CardContent className="space-y-1">{data.steps.map((step,index) => <div key={`${step.title}-${index}`} className="grid gap-3 border-b py-3 last:border-0 md:grid-cols-[1.5rem_1fr_auto] md:items-start"><div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</div><div><p className="font-medium">{step.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>{step.id && <code className="mt-2 block break-all text-xs text-muted-foreground">{step.id}</code>}</div><Badge variant="outline">{step.status}</Badge></div>)}</CardContent></Card>;
}

export function RainOperations({ defaultTab = "transactions" }: { defaultTab?: "transactions" | "resources" }) {
  const [transaction, setTransaction] = useState<RainLifecycle | null>(null);
  const [resources, setResources] = useState<RainLifecycle | null>(null);
  const [running, setRunning] = useState<"transaction" | "resources" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "transaction" | "resources") {
    setRunning(kind); setError(null);
    try {
      const data = await jsonRequest<RainLifecycle>(kind === "transaction" ? "/api/rain/lifecycle" : "/api/rain/resources", { method: "POST" });
      if (kind === "transaction") setTransaction(data); else setResources(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The Rain sandbox operation failed"); }
    finally { setRunning(null); }
  }

  return (
    <div className="not-prose my-8 space-y-5">
      {error && <ErrorNotice message={error} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-xl font-semibold">Rain payments</h2><p className="mt-1 text-sm text-muted-foreground">Manage balances, cards, bank accounts, and payment routes.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline"><ArrowDownLeft />Add funds</Button><Button variant="outline"><ArrowUpRight />Withdraw</Button><Button><Plus />Create scoped card</Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Available balance","$10,000.00","RUSD on Base"],["Pending settlement","$0.00","No pending transfers"],["August volume","$7,494.00","49.9% from July"],["Active routes","2","USD and RUSD"]].map(([label,value,detail]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></CardContent></Card>)}
      </div>

      <Tabs defaultValue={defaultTab}>
        <div className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-11 bg-transparent p-0"><TabsTrigger value="transactions" className="h-11 rounded-none border-b-2 border-transparent px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Transactions</TabsTrigger><TabsTrigger value="resources" className="h-11 rounded-none border-b-2 border-transparent px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Accounts and routes</TabsTrigger></TabsList>
        </div>

        <TabsContent value="transactions" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card>
              <CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle>Recent transactions</CardTitle><CardDescription>Card purchases and stablecoin transfers across your organization.</CardDescription></div><Button variant="outline" size="sm" onClick={() => void run("transaction")} disabled={running !== null}>{running === "transaction" ? <Loader2 className="animate-spin" /> : <RefreshCcw />}{running === "transaction" ? "Running" : "Test lifecycle"}</Button></div></CardHeader>
              <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-y bg-muted/35 text-left text-muted-foreground"><th className="px-6 py-3 font-medium">Transaction</th><th className="px-4 py-3 font-medium">Payment method</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="w-12 px-4 py-3" /></tr></thead><tbody>{[["MissionClear API","Today, 10:42 AM","Monad x402","Settled","$0.01"],["Approved Airspace Provider","Today, 9:18 AM","Rain card 4821","Settled","$20.00"],["Cloud infrastructure","Aug 7, 4:35 PM","Rain card 4821","Authorized","$186.40"],["Compliance data refund","Aug 7, 11:02 AM","Rain card 4821","Refunded","$20.00"]].map(([name,date,method,status,amount]) => <tr key={`${name}-${date}`} className="border-b last:border-0 hover:bg-muted/25"><td className="px-6 py-4"><p className="font-medium">{name}</p><p className="mt-1 text-muted-foreground">{date}</p></td><td className="px-4 py-4">{method}</td><td className="px-4 py-4"><Badge variant={status === "Authorized" ? "outline" : "secondary"}>{status}</Badge></td><td className="px-4 py-4 text-right font-medium">{amount}</td><td className="px-4 py-4"><Button variant="ghost" size="icon" aria-label={`View ${name}`}><MoreHorizontal /></Button></td></tr>)}</tbody></table></div></CardContent>
            </Card>

            <Card className="overflow-hidden"><div className="border-b border-border bg-[linear-gradient(135deg,hsl(185_25%_16%),hsl(180_18%_8%))] p-6 text-foreground"><div className="flex items-start justify-between"><div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><CreditCard className="size-5 text-primary" /></div><span className="text-sm font-medium text-muted-foreground">VIRTUAL</span></div><p className="mt-10 font-mono text-lg tracking-[0.16em]">5412 8642 1190 4821</p><div className="mt-5 flex justify-between text-sm"><div><p className="text-muted-foreground">Cardholder</p><p className="mt-1 font-medium">PROCUREMENT AGENT</p></div><div><p className="text-muted-foreground">Limit</p><p className="mt-1 font-medium">$500</p></div></div></div><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><div><p className="font-medium">Procurement card</p><p className="mt-1 text-sm text-muted-foreground">Software and data services</p></div><Badge variant="secondary">Active</Badge></div><Separator /><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Spent</p><p className="mt-1 font-medium">$206.40</p></div><div><p className="text-muted-foreground">Available</p><p className="mt-1 font-medium">$293.60</p></div></div><Button variant="outline" className="w-full"><Copy />Copy card details</Button></CardContent></Card>
          </div>
          <RainResults data={transaction} />
        </TabsContent>

        <TabsContent value="resources" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Payment accounts</CardTitle><CardDescription>Destinations for deposits and withdrawals.</CardDescription></div><Button variant="outline" size="sm"><Plus />Add account</Button></div></CardHeader><CardContent className="space-y-3">{[[Landmark,"Operating account","USD ending 1842","Verified"],[WalletCards,"Rain balance","RUSD on Base","Active"]].map(([Glyph,name,detail,status]) => { const Icon = Glyph as typeof Landmark; return <div key={String(name)} className="flex items-center justify-between gap-4 rounded-lg border p-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-secondary"><Icon className="size-5 text-primary" /></div><div><p className="font-medium">{String(name)}</p><p className="mt-1 text-sm text-muted-foreground">{String(detail)}</p></div></div><Badge variant="secondary">{String(status)}</Badge></div>; })}</CardContent></Card>
            <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Payment routes</CardTitle><CardDescription>Move money between fiat accounts and stablecoins.</CardDescription></div><Button size="sm" onClick={() => void run("resources")} disabled={running !== null}>{running === "resources" ? <Loader2 className="animate-spin" /> : <Plus />}{running === "resources" ? "Creating" : "Create route"}</Button></div></CardHeader><CardContent className="space-y-3">{[[ArrowDownLeft,"USD to RUSD","ACH deposit","Onramp"],[ArrowUpRight,"RUSD to USD","Bank withdrawal","Offramp"]].map(([Glyph,name,detail,type]) => { const Icon = Glyph as typeof ArrowDownLeft; return <div key={String(name)} className="flex items-center justify-between gap-4 rounded-lg border p-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-secondary"><Icon className="size-5 text-primary" /></div><div><p className="font-medium">{String(name)}</p><p className="mt-1 text-sm text-muted-foreground">{String(detail)}</p></div></div><div className="text-right"><Badge variant="outline">{String(type)}</Badge><p className="mt-2 text-xs text-muted-foreground">Active</p></div></div>; })}</CardContent></Card>
          </div>
          <Card><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Building2 className="mt-0.5 size-5 text-muted-foreground" /><div><p className="font-medium">Sandbox environment</p><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Accounts, routes, deposits, and withdrawals on this screen demonstrate Rain sandbox capabilities. No real bank funds move.</p></div></div><Badge variant="outline">Test data</Badge></CardContent></Card>
          <RainResults data={resources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
