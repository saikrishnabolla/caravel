"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Database,
  FileCheck2,
  Home,
  Landmark,
  Menu,
  Package,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
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
import { Textarea } from "@/components/ui/textarea";
import { RaingenticMark } from "@/components/raingentic-mark";
import {
  CatalogSetup,
  GuidedDemo,
  RainOperations,
  SellingWorkbench,
} from "@/components/commerce-doc-components";

type World = "buying" | "selling";
type BuyingPage = "dashboard" | "purchases" | "payment-methods" | "payment-requests" | "organization";
type SellingPage = "dashboard" | "products" | "plans" | "analytics" | "payouts" | "organization";
type Page = BuyingPage | SellingPage;

type PlatformStatus = {
  rain: { configured: boolean; environment?: string };
  monad: { buyerConfigured: boolean; sellerConfigured: boolean; network?: string };
  a2a: { configured: boolean; protocolVersion: string };
  openai: { configured: boolean };
};

type ParsedBuyingMandate = {
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

const buyingNavigationGroups = [
  { label: "Overview", items: [{ id: "dashboard" as const, label: "Dashboard", icon: Home }] },
  { label: "Buying", items: [{ id: "purchases" as const, label: "Purchases", icon: ShoppingBag },{ id: "payment-requests" as const, label: "Approvals", icon: ReceiptText },{ id: "payment-methods" as const, label: "Payments", icon: CreditCard }] },
  { label: "Company", items: [{ id: "organization" as const, label: "Organization", icon: Building2 }] },
];

const sellingNavigationGroups = [
  { label: "Overview", items: [{ id: "dashboard" as const, label: "Dashboard", icon: Home }] },
  { label: "Selling", items: [{ id: "products" as const, label: "Products", icon: Package },{ id: "plans" as const, label: "Plans and pricing", icon: BadgeDollarSign },{ id: "analytics" as const, label: "Analytics", icon: Activity },{ id: "payouts" as const, label: "Payouts", icon: Landmark }] },
  { label: "Company", items: [{ id: "organization" as const, label: "Organization", icon: Building2 }] },
];

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  purchases: "Purchases",
  "payment-methods": "Payments",
  "payment-requests": "Approvals",
  organization: "Organization",
  products: "Products",
  plans: "Plans and pricing",
  analytics: "Analytics",
  payouts: "Payouts",
};

const emptyPageContent: Record<string, { description: string; icon: typeof CreditCard; items: string[] }> = {
  "buying:dashboard": { description: "Connect payment infrastructure and define the rules your company agents must follow before they can purchase anything.", icon: Home, items: ["Connect Rain and Monad", "Set approval and budget policies", "Invite company operators"] },
  "buying:purchases": { description: "Create purchasing requests, compare sellers, and follow every order from the original business need through delivery.", icon: ShoppingBag, items: ["Import existing purchase history", "Create the first agent request", "Configure approved sellers"] },
  "buying:payment-requests": { description: "Decide which purchases agents may complete automatically and which ones must stop for a human decision.", icon: ReceiptText, items: ["Set an approval threshold", "Choose trusted vendors", "Assign company approvers"] },
  "buying:payment-methods": { description: "Connect company funds, create controlled Rain cards, and configure the stablecoin wallet agents can use for API payments.", icon: CreditCard, items: ["Connect Rain payment accounts", "Fund a Monad wallet", "Define card spending controls"] },
  "buying:organization": { description: "Add your company identity, infrastructure credentials, and the commerce policies shared by every agent.", icon: Building2, items: ["Add company details", "Connect payment providers", "Set company-wide limits"] },
  "selling:dashboard": { description: "Configure how your business publishes products, accepts agent purchases, and receives the resulting revenue.", icon: Store, items: ["Publish a product catalog", "Choose payment methods", "Configure payout destinations"] },
  "selling:products": { description: "Publish the APIs, software, services, and physical products that customers or purchasing agents can discover and buy.", icon: Package, items: ["Import an existing catalog", "Add prices and fulfillment rules", "Choose agent payment methods"] },
  "selling:plans": { description: "Set published prices and the exact boundaries within which your seller agent may negotiate with a buyer.", icon: BadgeDollarSign, items: ["Create pricing plans", "Set discount limits", "Define payment windows"] },
  "selling:analytics": { description: "Measure customer activity, agent purchases, revenue, fulfillment, and payment performance in one place.", icon: Activity, items: ["Connect transaction events", "Track product usage", "Monitor revenue and refunds"] },
  "selling:payouts": { description: "Choose where stablecoin revenue is received and how your company moves funds into or out of traditional bank accounts.", icon: Landmark, items: ["Create payment accounts", "Configure onramp routes", "Configure offramp routes"] },
  "selling:organization": { description: "Add your company identity, infrastructure credentials, and the commerce policies shared by every agent.", icon: Building2, items: ["Add company details", "Connect payment providers", "Set company-wide limits"] },
};

function ConnectionBadge({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return <Badge variant={ready ? "secondary" : "outline"} className="gap-1.5"><Check className="size-3.5 text-primary" />{children}</Badge>;
}

function SummaryCard({ icon: Icon, title, value, description, action, onAction }: {
  icon: typeof CreditCard;
  title: string;
  value: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return <Card><CardHeader><div className="flex size-11 items-center justify-center rounded-xl bg-secondary"><Icon className="size-5" /></div><CardTitle className="mt-4 text-xl">{value}</CardTitle><CardDescription className="text-base text-foreground">{title}</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{description}</p></CardContent><CardFooter><Button variant="outline" className="w-full" onClick={onAction}>{action}<ArrowRight /></Button></CardFooter></Card>;
}

function Metric({ label, value, change }: { label: string; value: string; change?: string }) {
  return <div className="p-6"><div className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{label}</p>{change && <span className="text-sm font-medium text-primary">{change}</span>}</div><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div>;
}

export function CommerceDashboard({ initialDemoPrompt = false }: { initialDemoPrompt?: boolean }) {
  const [world, setWorld] = useState<World>("buying");
  const [page, setPage] = useState<Page>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [demoDataDialog, setDemoDataDialog] = useState(initialDemoPrompt);
  const [platform, setPlatform] = useState<PlatformStatus | null>(null);
  const [company, setCompany] = useState({ name: "PreFlight", website: "https://preflight.app", approvalThreshold: "500" });
  const [saved, setSaved] = useState(false);
  const [creatingPurchase, setCreatingPurchase] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Operations API");
  const [planSaved, setPlanSaved] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/platform/status").then(response => response.ok ? response.json() : null).then(setPlatform).catch(() => undefined);
    const restoreWorkspace = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("raingentic-preflight-workspace");
        if (stored) {
          const workspace = JSON.parse(stored) as { demoDataLoaded?: boolean; company?: typeof company; selectedPlan?: string };
          if (typeof workspace.demoDataLoaded === "boolean") setDemoDataLoaded(workspace.demoDataLoaded);
          if (workspace.company) setCompany(workspace.company);
          if (workspace.selectedPlan) setSelectedPlan(workspace.selectedPlan);
        }
      } catch {
        // Continue with the safe PreFlight defaults when browser persistence is unavailable.
      } finally {
        setWorkspaceLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreWorkspace);
  }, []);

  useEffect(() => {
    if (!workspaceLoaded) return;
    window.localStorage.setItem("raingentic-preflight-workspace", JSON.stringify({ demoDataLoaded, company, selectedPlan }));
  }, [company, demoDataLoaded, selectedPlan, workspaceLoaded]);

  const readiness = useMemo(() => ({
    rain: Boolean(platform?.rain.configured),
    monad: Boolean(platform?.monad.buyerConfigured && platform?.monad.sellerConfigured),
    a2a: platform?.a2a.configured ?? true,
    ap2: true,
    openai: Boolean(platform?.openai.configured),
  }), [platform]);

  const navigationGroups = world === "buying" ? buyingNavigationGroups : sellingNavigationGroups;

  function switchWorld(next: World) {
    setWorld(next);
    setPage("dashboard");
    setMobileNav(false);
    setDemoMode(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  function navigate(next: Page) {
    setPage(next);
    setMobileNav(false);
    setDemoMode(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  function loadDemoData() {
    setDemoDataLoaded(true);
    setDemoDataDialog(false);
    setDemoMode(false);
  }

  function resetDemoData() {
    setDemoDataLoaded(false);
    setDemoDataDialog(false);
    setDemoMode(false);
    setPage("dashboard");
  }

  return <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
    <div aria-hidden="true" className="pointer-events-none fixed -left-24 -top-32 z-0 size-80 rounded-full bg-[radial-gradient(circle,hsl(58_100%_65%/0.15),hsl(185_80%_55%/0.05)_42%,transparent_72%)] blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none fixed -bottom-64 -right-64 z-0 size-[44rem] rounded-full bg-[radial-gradient(circle,hsl(185_80%_55%/0.08),hsl(58_100%_65%/0.06)_38%,transparent_70%)] blur-3xl" />
    <aside className={`fixed inset-y-0 left-0 z-40 w-[17.5rem] border-r border-border bg-sidebar p-4 shadow-[24px_0_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-14 items-center gap-3 px-3"><RaingenticMark /><div><p className="text-base font-semibold leading-5 tracking-tight">Raingentic</p><p className="mt-0.5 text-sm text-muted-foreground">PreFlight workspace</p></div></div>

      <div className="mt-5 grid grid-cols-2 rounded-xl border border-border bg-black/20 p-1" aria-label="Commerce mode">
        <button type="button" aria-pressed={world === "buying"} onClick={() => switchWorld("buying")} className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${world === "buying" ? "border-border bg-white/[0.08] text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"}`}><ShoppingBag className="size-4" />Buying</button>
        <button type="button" aria-pressed={world === "selling"} onClick={() => switchWorld("selling")} className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${world === "selling" ? "border-border bg-white/[0.08] text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"}`}><Store className="size-4" />Selling</button>
      </div>

      <div className="mt-7 space-y-6">{navigationGroups.map(group => <div key={group.label}><p className="mb-2 px-3 text-sm font-medium text-muted-foreground">{group.label}</p><nav className="space-y-1">{group.items.map(item => { const Icon = item.icon; const active = page === item.id && !demoMode; return <button type="button" key={item.id} className={`flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-base font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-border bg-[#161d1d] text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-[#161d1d] hover:text-foreground"}`} onClick={() => navigate(item.id)}><Icon className={`size-5 ${active ? "text-primary" : "text-[#676d6d]"}`} />{item.label}</button>; })}</nav></div>)}</div>

      <div className="absolute inset-x-4 bottom-4"><Separator className="mb-4" /><button type="button" onClick={() => navigate("organization")} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left outline-none transition-colors hover:border-border hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-ring"><div className="flex size-10 items-center justify-center rounded-full border border-border bg-white/[0.06] text-sm font-semibold text-primary">P</div><div className="min-w-0"><p className="truncate text-sm font-medium">PreFlight</p><p className="truncate text-sm text-muted-foreground">Private company workspace</p></div><ChevronRight className="ml-auto size-4 text-muted-foreground" /></button></div>
    </aside>

    {mobileNav && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileNav(false)} />}

    <div className="relative z-10 lg:pl-[17.5rem]">
      <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-border bg-background/75 px-4 backdrop-blur-2xl md:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu /></Button><p className="text-sm font-medium text-muted-foreground">{world === "buying" ? "Buying" : "Selling"}</p><ChevronRight className="size-4 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{demoMode ? "Prepared demo" : pageTitles[page]}</p></div><div className="flex items-center gap-2 sm:gap-3">{demoDataLoaded ? <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => setDemoDataDialog(true)}><Check className="text-primary" />Demo data loaded</Button> : <Button size="sm" variant="outline" title="Populate this workspace with sample products, purchases, approvals, payment methods, and transactions." onClick={() => setDemoDataDialog(true)}><Database />Load demo data</Button>}{demoMode ? <Button size="sm" variant="outline" onClick={() => setDemoMode(false)}>Exit demo</Button> : <Button size="sm" disabled={!demoDataLoaded} title={demoDataLoaded ? "Run the prepared commerce walkthrough" : "Load demo data to enable the prepared walkthrough"} onClick={() => setDemoMode(true)}><Play />Run demo</Button>}</div></header>

      <main className="mx-auto max-w-[88rem] p-5 md:p-8 lg:p-10">
        {demoMode ? <PresentationMode /> : page === "organization" ? <Organization company={company} setCompany={setCompany} saved={saved} setSaved={setSaved} readiness={readiness} /> : !demoDataLoaded ? world === "selling" && page === "products" ? <CatalogSetup onLoadDemo={() => setDemoDataDialog(true)} /> : <EmptyWorkspacePage world={world} page={page} navigate={navigate} switchWorld={switchWorld} /> : <>
          {world === "buying" && page === "dashboard" && <BuyingDashboard navigate={navigate} readiness={readiness} />}
          {world === "buying" && page === "purchases" && <BuyingPurchases creating={creatingPurchase} setCreating={setCreatingPurchase} />}
          {world === "buying" && page === "payment-methods" && <BuyingPaymentMethods />}
          {world === "buying" && page === "payment-requests" && <BuyingPaymentRequests onDemo={() => setDemoMode(true)} />}

          {world === "selling" && page === "dashboard" && <SellingDashboard navigate={navigate} readiness={readiness} />}
          {world === "selling" && page === "products" && <Section title="Products" description="Manage the PreFlight platform, operational services, and real drone hardware sold to customers."><SellingWorkbench /></Section>}
          {world === "selling" && page === "plans" && <SellingPlans selected={selectedPlan} setSelected={value => { setSelectedPlan(value); setPlanSaved(false); }} saved={planSaved} setSaved={setPlanSaved} />}
          {world === "selling" && page === "analytics" && <SellingAnalytics />}
          {world === "selling" && page === "payouts" && <Section title="Payouts" description="Manage stablecoin revenue, payment accounts, routes, and simulated bank withdrawals."><RainOperations defaultTab="resources" /></Section>}
        </>}
      </main>
    </div>
    <Dialog.Root open={demoDataDialog} onOpenChange={setDemoDataDialog}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-6 shadow-2xl outline-none sm:p-8"><div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Database className="size-6 text-primary" /></div><Dialog.Title className="mt-5 text-2xl font-semibold tracking-tight">{demoDataLoaded ? "PreFlight demo data is loaded" : "Load controlled demo data"}</Dialog.Title><Dialog.Description className="mt-3 text-base leading-7 text-muted-foreground">{demoDataLoaded ? "The populated products, purchases, payment methods, approvals, and transactions are demonstration records. Reset them to return to PreFlight's clean private workspace." : "You are already inside PreFlight's private workspace. This adds the prepared records used for the live presentation."}</Dialog.Description>{!demoDataLoaded && <div className="mt-6 space-y-3 rounded-xl border border-border bg-black/15 p-5">{["7 individually priced API endpoints","9 software, service, and hardware products","Purchases, approvals, Rain routes, and Monad payments","A complete customer order ready to run"].map(item => <div key={item} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{item}</span></div>)}</div>}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{demoDataLoaded ? <><Dialog.Close asChild><Button variant="outline">Keep demo data</Button></Dialog.Close><Button variant="destructive" onClick={resetDemoData}><RotateCcw />Reset workspace</Button></> : <><Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close><Button onClick={loadDemoData}><Database />Load demo records</Button></>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}

function EmptyWorkspacePage({ world, page, navigate, switchWorld }: { world: World; page: Page; navigate: (page: Page) => void; switchWorld: (world: World) => void }) {
  const content = emptyPageContent[`${world}:${page}`] ?? emptyPageContent[`${world}:dashboard`];
  const Icon = content.icon;
  const actions = world === "buying" ? [
    { icon: Building2, title: "Configure your company", description: "Add company identity, approval thresholds, and server-side infrastructure connections.", label: "Open organization", run: () => navigate("organization") },
    { icon: Package, title: "Connect what you sell", description: "Import an OpenAPI document, commerce catalog, billing system, or internal product source.", label: "Connect a catalog", run: () => { switchWorld("selling"); requestAnimationFrame(() => navigate("products")); } },
    { icon: ShieldCheck, title: "Define agent authority", description: "Choose budgets, approved sellers, human-review rules, and the payment methods agents may use.", label: "Set company controls", run: () => navigate("organization") },
  ] : [
    { icon: Package, title: "Connect your catalog", description: "Import products and API operations from the systems your business already uses.", label: "Add a product source", run: () => navigate("products") },
    { icon: BadgeDollarSign, title: "Configure pricing", description: "Set list prices, price floors, discount limits, payment terms, and negotiation boundaries.", label: "Review pricing setup", run: () => navigate("plans") },
    { icon: Building2, title: "Connect infrastructure", description: "Review Rain, Monad, OpenAI, A2A, AP2, payout, and company-wide policy configuration.", label: "Open organization", run: () => navigate("organization") },
  ];
  return <Section title={pageTitles[page]} description={content.description}><div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><div><div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Icon className="size-6 text-primary" /></div><Badge variant="outline" className="mt-6">New workspace</Badge><h2 className="mt-4 text-3xl font-semibold tracking-tight">Start with your business</h2><p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Connect one source and define how agents should operate. You can begin with a single API, store, payment provider, or purchasing policy and expand from there.</p><div className="mt-7 rounded-xl border border-border bg-black/15 p-4 text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">Want to explore first?</span> Use <span className="font-medium text-foreground">Load demo data</span> in the top bar to add removable sample records. It does not replace your workspace configuration.</div></div><div className="space-y-3">{actions.map(({ icon: ActionIcon,title,description,label,run },index) => <div key={title} className="flex flex-col gap-5 rounded-xl border border-border bg-black/10 p-5 sm:flex-row sm:items-center"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">{index + 1}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><ActionIcon className="size-4 text-muted-foreground" /><p className="font-semibold">{title}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div><Button variant="outline" className="shrink-0" onClick={run}>{label}<ArrowRight /></Button></div>)}</div></div></div></Section>;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div><div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p><div className="dashboard-header-line mt-8" /></div>{children}</div>;
}

function Welcome({ world }: { world: World }) {
  return <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,hsl(184_16%_12%/0.96),hsl(180_16%_8%/0.82))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-9"><div aria-hidden="true" className="absolute -right-12 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" /><div className="relative"><div className="mb-5 h-1 w-12 rounded-full bg-primary" /><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{world === "buying" ? "Put trusted agents to work" : "Sell products to agents"}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{world === "buying" ? "Fund payment methods, delegate spending authority, and let agents purchase APIs or traditional services within your rules." : "Publish products once, control negotiation and pricing, and receive payments through your existing checkout or stablecoin rails."}</p></div></div>;
}

function BuyingDashboard({ navigate, readiness }: { navigate: (page: Page) => void; readiness: Record<string, boolean> }) {
  return <div><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1><div className="hidden gap-2 md:flex"><ConnectionBadge ready={readiness.rain}>Rain</ConnectionBadge><ConnectionBadge ready={readiness.monad}>Monad</ConnectionBadge></div></div><Welcome world="buying" /><div className="grid gap-5 md:grid-cols-2"><SummaryCard icon={CreditCard} title="Scoped cards" value="Rain connected" description="Create temporary cards with amount, merchant-category, and expiration controls." action="Manage payment methods" onAction={() => navigate("payment-methods")} /><SummaryCard icon={WalletCards} title="Stablecoin wallet" value="Monad Testnet" description="Purchase x402 APIs using test USDC and an approved payment mandate." action="View payment methods" onAction={() => navigate("payment-methods")} /><SummaryCard icon={ShieldCheck} title="Spending authority" value="$500 approval cap" description="New vendors and purchases above the configured threshold require a human decision." action="Review requests" onAction={() => navigate("payment-requests")} /><SummaryCard icon={ShoppingBag} title="Recent activity" value="3 purchase flows" description="Review agent plans, provider comparisons, authorization, payment, and delivery." action="View purchases" onAction={() => navigate("purchases")} /></div></div>;
}

function SellingDashboard({ navigate, readiness }: { navigate: (page: Page) => void; readiness: Record<string, boolean> }) {
  return <div><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1><div className="hidden gap-2 md:flex"><ConnectionBadge ready={readiness.a2a}>A2A</ConnectionBadge><ConnectionBadge ready={readiness.monad}>x402</ConnectionBadge></div></div><Welcome world="selling" /><div className="grid gap-5 md:grid-cols-2"><Card><CardHeader><CircleDollarSign className="size-9" /><CardTitle className="mt-5 text-xl">Configure payouts</CardTitle><CardDescription>Receive stablecoin revenue and demonstrate a Rain offramp to a configured payment account.</CardDescription></CardHeader><CardFooter><Button className="w-full" onClick={() => navigate("payouts")}>Manage payouts<ArrowRight /></Button></CardFooter></Card><Card><CardHeader><Store className="size-9" /><CardTitle className="mt-5 text-xl">16 published products</CardTitle><CardDescription>Seven API endpoints plus software, operational services, and real DJI and XAG hardware packages.</CardDescription></CardHeader><CardFooter><Button variant="outline" className="w-full" onClick={() => navigate("products")}>View products<ArrowRight /></Button></CardFooter></Card></div><Card className="mt-5"><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Metrics</CardTitle><CardDescription>Sample activity for the demo</CardDescription></div><Button variant="outline" onClick={() => navigate("analytics")}>View analytics</Button></div></CardHeader><CardContent className="grid divide-y border-t p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"><Metric label="Revenue" value="$7,494" change="+49.9%" /><Metric label="API calls" value="1,317" change="+14.5%" /><Metric label="Agent buyers" value="78" change="+8.3%" /><Metric label="Published products" value="16" /></CardContent></Card></div>;
}

function BuyingPaymentMethods() {
  return <Section title="Payments" description="Manage balances, cards, payment routes, and the spending authority available to company agents."><RainOperations defaultTab="transactions" /><Card className="mt-5"><CardHeader><CardTitle>Agent spending policy</CardTitle><CardDescription>Controls applied before an agent can request payment.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[["Approval threshold","$500"],["New vendors","Human review"],["API samples","Up to $5"],["Card expiration","1 hour"]].map(([label,value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</CardContent></Card></Section>;
}

function BuyingPurchases({ creating, setCreating }: { creating: boolean; setCreating: (value: boolean) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [request, setRequest] = useState("Buy airspace authorization and flight-readiness coverage for 100 agricultural drone missions in California during the next 30 days.");
  const [budget, setBudget] = useState("1500");
  const [quantity, setQuantity] = useState("100");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState("aerodata");
  const [submitted, setSubmitted] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [agentMandate, setAgentMandate] = useState<ParsedBuyingMandate | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const offers = [{ id: "aerodata", seller: "AeroData Exchange", amount: "$1,320", unit: "$13.20 per mission", note: "Approved seller, complete coverage", recommended: true },{ id: "flightops", seller: "FlightOps Network", amount: "$1,450", unit: "$14.50 per mission", note: "New seller, stronger delivery guarantee", recommended: false },{ id: "airgrid", seller: "AirGrid Services", amount: "$1,180", unit: "$11.80 per mission", note: "Lowest price, missing telemetry coverage", recommended: false }];
  const chosen = offers.find(offer => offer.id === selectedOffer) ?? offers[0];

  function startNew() { setCreating(true); setStep(1); setSubmitted(false); }

  async function askBuyingAgent() {
    setAgentThinking(true);
    setAgentError(null);
    try {
      const response = await fetch("/api/mandates/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request }) });
      const result = await response.json() as ParsedBuyingMandate & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The buying agent could not understand the request");
      setAgentMandate(result);
      setBudget(String(result.budgetCents / 100));
      setQuantity(String(result.minimumMissions));
      setApprovalRequired(result.requiresApproval || result.budgetCents > 50_000);
      setStep(2);
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "The buying agent could not prepare the mandate");
    } finally {
      setAgentThinking(false);
    }
  }

  if (creating) return <Section title="New purchase" description="Tell your purchasing agent what the business needs. You stay in control of the seller, budget, and payment."><div className="mb-6"><button type="button" className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setCreating(false)}>Back to purchases</button></div><div className="mb-6 grid grid-cols-3 overflow-hidden rounded-lg border">{[[1,"Describe need"],[2,"Compare sellers"],[3,"Review purchase"]].map(([number,label]) => <div key={String(number)} className={`flex items-center gap-3 border-r px-4 py-3 last:border-0 ${step === number ? "bg-secondary" : "bg-card"}`}><div className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${step >= Number(number) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > Number(number) ? <Check className="size-4" /> : number}</div><span className="hidden font-medium sm:block">{label}</span></div>)}</div>

  {step === 1 && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><Card><CardHeader><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Bot className="size-5 text-primary" /></div><div><CardTitle>Talk to the buying agent</CardTitle><CardDescription className="mt-1">Describe the outcome in normal language. The agent will extract the budget, quantity, coverage, geography, and approval rules.</CardDescription></div></div></CardHeader><CardContent className="space-y-5"><div className="rounded-xl border bg-black/15 p-5"><div className="mb-4 flex items-center gap-2 text-sm font-medium"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">P</span>PreFlight operator</div><Textarea aria-label="Message the buying agent" value={request} onChange={event => setRequest(event.target.value)} className="min-h-36 border-0 bg-transparent p-0 text-base leading-7 shadow-none focus-visible:ring-0" /></div>{agentError && <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm">{agentError}</div>}<div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="purchase-budget">Maximum total budget</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="purchase-budget" type="number" value={budget} onChange={event => setBudget(event.target.value)} className="pl-7" /></div></div><div className="space-y-2"><Label htmlFor="purchase-quantity">Quantity needed</Label><Input id="purchase-quantity" type="number" value={quantity} onChange={event => setQuantity(event.target.value)} /></div></div><div className="flex items-center justify-between gap-5 rounded-lg border p-4"><div><p className="font-medium">Require approval before payment</p><p className="mt-1 text-sm text-muted-foreground">Nothing moves until a person approves the selected seller and amount.</p></div><Switch checked={approvalRequired} onCheckedChange={setApprovalRequired} aria-label="Require approval before payment" /></div></CardContent><CardFooter className="justify-end"><Button onClick={() => void askBuyingAgent()} disabled={!request.trim() || agentThinking}>{agentThinking ? "Preparing mandate" : "Ask agent and find sellers"}<ChevronRight /></Button></CardFooter></Card><Card><CardHeader><ShieldCheck className="size-8 text-primary" /><CardTitle className="mt-4">Company rules</CardTitle><CardDescription>Applied automatically to every seller the agent considers.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm">{[["Budget",`Up to $${Number(budget || 0).toLocaleString()}`],["Seller policy","Approved sellers preferred"],["Required coverage","Airspace, weather, compliance, risk"],["Payment","No payment before approval"]].map(([label,value]) => <div key={label}><p className="text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</CardContent></Card></div>}

  {step === 2 && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><Card><CardHeader><CardTitle>Compare sellers</CardTitle><CardDescription>The agent found three offers that fit most or all of your request.</CardDescription></CardHeader><CardContent className="space-y-3">{agentMandate && <div className="mb-5 rounded-xl border border-primary/20 bg-primary/[0.04] p-5"><div className="flex items-center gap-2 font-medium"><Bot className="size-4 text-primary" />Buying mandate prepared</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{agentMandate.objective}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">Budget ${(agentMandate.budgetCents / 100).toLocaleString()}</Badge><Badge variant="outline">{agentMandate.minimumMissions} units</Badge><Badge variant="outline">{agentMandate.geography}</Badge>{agentMandate.categories.map(category => <Badge key={category} variant="outline">{category}</Badge>)}</div></div>}{offers.map(offer => <button type="button" key={offer.id} onClick={() => setSelectedOffer(offer.id)} className={`w-full rounded-lg border p-5 text-left transition-colors ${selectedOffer === offer.id ? "border-primary bg-secondary/45 ring-1 ring-primary" : "hover:bg-muted/30"}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{offer.seller}</p>{offer.recommended && <Badge variant="secondary">Recommended</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{offer.note}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">Airspace</Badge><Badge variant="outline">Weather</Badge><Badge variant="outline">Compliance</Badge>{offer.id !== "airgrid" && <Badge variant="outline">Telemetry</Badge>}</div></div><div className="sm:text-right"><p className="text-xl font-semibold">{offer.amount}</p><p className="mt-1 text-sm text-muted-foreground">{offer.unit}</p></div></div></button>)}</CardContent><CardFooter className="justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)}>Review selected offer<ChevronRight /></Button></CardFooter></Card><Card><CardHeader><CardTitle>Why this is recommended</CardTitle><CardDescription>The agent ranks business fit, not only price.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm">{[["Policy","Already approved by PreFlight"],["Coverage","All four required data categories"],["Delivery","100 reports within 24 hours"],["Price","$180 below your budget"]].map(([label,value]) => <div key={label} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value}</p></div></div>)}</CardContent></Card></div>}

  {step === 3 && <div className="mx-auto max-w-3xl"><Card><CardHeader><div className="flex items-start justify-between gap-5"><div><Badge variant="secondary">Ready for approval</Badge><CardTitle className="mt-4 text-2xl">{quantity} mission-readiness reports</CardTitle><CardDescription className="mt-2">Review the exact seller, amount, and delivery promise before allowing payment.</CardDescription></div><p className="text-2xl font-semibold">{chosen.amount}</p></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-5 rounded-lg border p-5 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">Seller</p><p className="mt-1 font-medium">{chosen.seller}</p></div><div><p className="text-sm text-muted-foreground">Price</p><p className="mt-1 font-medium">{chosen.amount}, {chosen.unit}</p></div><div><p className="text-sm text-muted-foreground">Delivery</p><p className="mt-1 font-medium">Within 24 hours</p></div><div><p className="text-sm text-muted-foreground">Payment</p><p className="mt-1 font-medium">Rain scoped card after approval</p></div></div><div className="rounded-lg bg-secondary/50 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-medium">Your company rules passed</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This offer is below the ${Number(budget).toLocaleString()} budget, uses an approved seller, and includes every required coverage category.</p></div></div></div>{submitted && <div className="rounded-lg border p-5 text-center"><div className="mx-auto flex size-10 items-center justify-center rounded-full bg-secondary"><Check className="size-5 text-primary" /></div><p className="mt-3 font-medium">Sent for approval</p><p className="mt-1 text-sm text-muted-foreground">The purchase now appears in Approvals. No money has moved.</p></div>}</CardContent><CardFooter className="justify-between"><Button variant="ghost" onClick={() => { setStep(2); setSubmitted(false); }}>Back</Button>{submitted ? <Button onClick={() => setCreating(false)}>Return to purchases</Button> : <Button onClick={() => setSubmitted(true)}><FileCheck2 />Send for approval</Button>}</CardFooter></Card></div>}</Section>;

  const purchases = [["Airspace coverage for 100 missions","AeroData Exchange","Research procurement agent","$1,320.00","Needs approval"],["Regional weather and winds dataset","WeatherGrid","Flight operations agent","$72.00","Processing"],["Drone operator account enrichment","Clay","GTM research agent","$300.00","Delivered"],["Cloud infrastructure services","Amazon Web Services","Engineering agent","$186.40","Paid"]];
  return <Section title="Purchases" description="See what company agents are buying, why they chose each seller, and where every order stands."><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Badge variant="secondary">All purchases</Badge><Badge variant="outline">Needs attention</Badge><Badge variant="outline">In progress</Badge></div><Button onClick={startNew}><ShoppingBag />New purchase</Button></div><div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Spend this month</p><p className="mt-2 text-2xl font-semibold">$3,816.40</p><p className="mt-1 text-sm text-muted-foreground">Across 24 purchases</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Needs attention</p><p className="mt-2 text-2xl font-semibold">1 purchase</p><p className="mt-1 text-sm text-muted-foreground">Waiting for approval</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Delivered on time</p><p className="mt-2 text-2xl font-semibold">96%</p><p className="mt-1 text-sm text-muted-foreground">Past 30 days</p></CardContent></Card></div><Card className="mt-5"><CardHeader><CardTitle>Purchase activity</CardTitle><CardDescription>Open any purchase to see the request, seller selection, approval, payment, and delivery record.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-y bg-muted/30 text-left text-muted-foreground"><th className="px-6 py-3 font-medium">Purchase</th><th className="px-4 py-3 font-medium">Seller</th><th className="px-4 py-3 font-medium">Requested by</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody>{purchases.map(([item,seller,agent,amount,status]) => <tr key={item} onClick={() => setDetailOpen(true)} className="cursor-pointer border-b last:border-0 hover:bg-muted/25"><td className="px-6 py-4"><p className="font-medium">{item}</p><p className="mt-1 text-muted-foreground">Aug 8, 2026</p></td><td className="px-4 py-4">{seller}</td><td className="px-4 py-4">{agent}</td><td className="px-4 py-4 text-right font-medium">{amount}</td><td className="px-4 py-4"><Badge variant={status === "Needs approval" ? "outline" : "secondary"}>{status}</Badge></td></tr>)}</tbody></table></div></CardContent></Card><Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" /><Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l bg-background p-6 shadow-2xl outline-none sm:p-8"><div className="flex items-start justify-between gap-5"><div><Dialog.Title className="text-xl font-semibold">Airspace coverage for 100 missions</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Purchase PF-1048, requested today</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="sm">Close</Button></Dialog.Close></div><div className="mt-7 rounded-lg bg-secondary/45 p-5"><p className="text-sm text-muted-foreground">Total purchase</p><p className="mt-1 text-3xl font-semibold">$1,320.00</p><p className="mt-2 text-sm">AeroData Exchange, 100 reports</p></div><div className="mt-7"><h3 className="font-semibold">Purchase progress</h3><div className="mt-4 space-y-1">{[["Request prepared","Business need and $1,500 budget confirmed","Complete"],["Sellers compared","Three offers evaluated, AeroData selected","Complete"],["Company policy checked","Budget, seller, and delivery rules passed","Complete"],["Human approval","Waiting for a manager decision","Current"],["Payment and delivery","Starts only after approval","Waiting"]].map(([title,detail,status],index) => <div key={title} className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b py-4 last:border-0"><div className={`flex size-7 items-center justify-center rounded-full text-sm font-medium ${status === "Complete" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{status === "Complete" ? <Check className="size-4" /> : index + 1}</div><div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p></div><Badge variant={status === "Current" ? "secondary" : "outline"}>{status}</Badge></div>)}</div></div><div className="mt-7 flex justify-end"><Button onClick={() => { setDetailOpen(false); setCreating(true); setStep(3); }}>Review for approval<ChevronRight /></Button></div></Dialog.Content></Dialog.Portal></Dialog.Root></Section>;
}

function BuyingPaymentRequests({ onDemo }: { onDemo: () => void }) {
  const [decision, setDecision] = useState<"pending" | "approved" | "declined">("pending");
  return <Section title="Approvals" description="Review purchases that your agents cannot complete automatically."><div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Waiting for you</p><p className="mt-2 text-2xl font-semibold">{decision === "pending" ? "1 request" : "0 requests"}</p><p className="mt-1 text-sm text-muted-foreground">Money has not moved</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Approved this month</p><p className="mt-2 text-2xl font-semibold">24 purchases</p><p className="mt-1 text-sm text-muted-foreground">$3,816.40 total</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Automatic limit</p><p className="mt-2 text-2xl font-semibold">$500</p><p className="mt-1 text-sm text-muted-foreground">Larger purchases stop here</p></CardContent></Card></div><Card className="mt-5"><CardHeader><CardTitle>Needs your decision</CardTitle><CardDescription>These purchases are paused until someone at PreFlight reviews them.</CardDescription></CardHeader><CardContent>{decision === "pending" ? <div className="rounded-lg border"><div className="flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary"><ShoppingBag className="size-5 text-primary" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-semibold">100 mission-readiness reports</p><Badge variant="outline">Needs approval</Badge></div><p className="mt-1 text-sm text-muted-foreground">Requested by the Research procurement agent</p></div></div><div className="lg:text-right"><p className="text-2xl font-semibold">$1,450.00</p><p className="mt-1 text-sm text-muted-foreground">$14.50 per report</p></div></div><div className="grid gap-5 bg-muted/20 p-5 md:grid-cols-3"><div><p className="text-sm text-muted-foreground">Seller</p><p className="mt-1 font-medium">MissionClear</p><p className="mt-1 text-sm text-muted-foreground">New to your organization</p></div><div><p className="text-sm text-muted-foreground">Why it stopped</p><p className="mt-1 font-medium">Above your $500 limit</p><p className="mt-1 text-sm text-muted-foreground">The seller is also not approved yet</p></div><div><p className="text-sm text-muted-foreground">Agent checked</p><p className="mt-1 font-medium">Budget and delivery requirements</p><p className="mt-1 text-sm text-muted-foreground">Both passed company rules</p></div></div><div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" onClick={onDemo}>View purchase details</Button><div className="flex gap-3"><Button variant="outline" onClick={() => setDecision("declined")}>Decline</Button><Button onClick={() => setDecision("approved")}><Check />Approve $1,450</Button></div></div></div> : <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"><div className="flex size-11 items-center justify-center rounded-full bg-secondary"><Check className="size-5 text-primary" /></div><p className="mt-4 font-medium">{decision === "approved" ? "Purchase approved" : "Purchase declined"}</p><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{decision === "approved" ? "The procurement agent may now complete the exact $1,450 purchase from MissionClear." : "The procurement agent was stopped and no money moved."}</p><Button variant="outline" className="mt-4" onClick={() => setDecision("pending")}>Reset example</Button></div>}</CardContent></Card><Card className="mt-5"><CardHeader><CardTitle>Recent decisions</CardTitle><CardDescription>Purchases your team previously approved or declined.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-y bg-muted/30 text-left text-muted-foreground"><th className="px-6 py-3 font-medium">Purchase</th><th className="px-4 py-3 font-medium">Seller</th><th className="px-4 py-3 font-medium">Decision</th><th className="px-4 py-3 text-right font-medium">Amount</th></tr></thead><tbody>{[["Airspace authorization processing","Approved Airspace Provider","Approved","$20.00"],["GTM data sample","SignalGrid","Approved","$0.01"],["Unverified terrain dataset","GeoSource Labs","Declined","$280.00"]].map(([item,seller,status,amount]) => <tr key={item} className="border-b last:border-0"><td className="px-6 py-4"><p className="font-medium">{item}</p><p className="mt-1 text-muted-foreground">Aug 8, 2026</p></td><td className="px-4 py-4">{seller}</td><td className="px-4 py-4"><Badge variant={status === "Approved" ? "secondary" : "outline"}>{status}</Badge></td><td className="px-4 py-4 text-right font-medium">{amount}</td></tr>)}</tbody></table></div></CardContent></Card></Section>;
}

function SellingPlans({ selected, setSelected, saved, setSaved }: { selected: string; setSelected: (value: string) => void; saved: boolean; setSaved: (value: boolean) => void }) {
  const plans = [["Operations API","$0.25 per assessment","Monad x402 or invoiced usage"],["PreFlight Fleet","$299 per month","Team software subscription"],["Hardware packages","From $7,499","Rain card, stablecoin, or invoice"]];
  return <Section title="Plans and pricing" description="Define how agents pay and how far negotiation may move from the published price."><div className="grid gap-5 md:grid-cols-3">{plans.map(([name,price,payment]) => <Card key={name} className={selected === name ? "ring-2 ring-primary" : ""}><CardHeader><CardTitle>{name}</CardTitle><CardDescription>{payment}</CardDescription></CardHeader><CardContent><p className="text-2xl font-semibold">{price}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Price floors and maximum discounts remain enforced by deterministic policy.</p></CardContent><CardFooter><Button variant={selected === name ? "default" : "outline"} className="w-full" onClick={() => setSelected(name)}>{selected === name ? "Selected" : "Edit plan"}</Button></CardFooter></Card>)}</div>{selected && <Card className="mt-5"><CardHeader><CardTitle>{selected} controls</CardTitle><CardDescription>Set the boundaries that the seller agent cannot exceed.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Maximum discount</Label><Input defaultValue="20" type="number" onChange={() => setSaved(false)} /></div><div className="space-y-2"><Label>Minimum quantity</Label><Input defaultValue="1" type="number" onChange={() => setSaved(false)} /></div><div className="space-y-2"><Label>Payment window</Label><Input defaultValue="Immediate" onChange={() => setSaved(false)} /></div>{saved && <div className="rounded-lg border bg-secondary/50 p-4 text-sm sm:col-span-3">Plan controls saved for this session.</div>}</CardContent><CardFooter><Button onClick={() => setSaved(true)}>Save plan</Button></CardFooter></Card>}</Section>;
}

function SellingAnalytics() {
  return <Section title="Events and analytics" description="Understand who is buying, which products agents use, and how revenue settles."><Card><CardHeader><CardTitle>Performance</CardTitle><CardDescription>Sample metrics for the video and live demonstration.</CardDescription></CardHeader><CardContent className="grid divide-y border-t p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"><Metric label="Revenue" value="$7,494" change="+49.9%" /><Metric label="API assessments" value="1,317" change="+14.5%" /><Metric label="Average purchase" value="$56.77" change="+6.2%" /><Metric label="Refund rate" value="0.8%" /></CardContent></Card><Card className="mt-5"><CardHeader><CardTitle>Recent customer activity</CardTitle></CardHeader><CardContent className="space-y-3">{[["FarmFleet operations agent","PreFlight Operations API","100 assessments","Monad x402"],["Agronomy operations team","Mission Readiness Report","24 reports","Business invoice"],["Enterprise procurement agent","DJI Matrice 4E Surveying Kit","1 order","Rain card"]].map(([buyer,product,usage,payment]) => <div key={buyer} className="grid gap-3 border-b py-3 last:border-0 md:grid-cols-4"><p className="font-medium">{buyer}</p><p>{product}</p><p>{usage}</p><p className="text-muted-foreground">{payment}</p></div>)}</CardContent></Card></Section>;
}

function Organization({ company, setCompany, saved, setSaved, readiness }: { company: { name: string; website: string; approvalThreshold: string }; setCompany: (value: { name: string; website: string; approvalThreshold: string }) => void; saved: boolean; setSaved: (value: boolean) => void; readiness: Record<string, boolean> }) {
  const [escrowContract, setEscrowContract] = useState<{ address: string; explorerUrl: string; network: string } | null>(null);
  useEffect(() => { fetch("/api/contracts/escrow").then(response => response.ok ? response.json() : null).then(setEscrowContract).catch(() => undefined); }, []);
  const connections = [
    [CreditCard,"Rain","Cards, accounts, routes, and treasury","Sandbox API key",readiness.rain],
    [CircleDollarSign,"Monad","x402 payments and contract settlement","Testnet wallet",readiness.monad],
    [Store,"A2A","Agent discovery and negotiation","Protocol enabled",readiness.a2a],
    [FileCheck2,"AP2","Signed payment authorization","Signing keys",readiness.ap2],
    [Activity,"OpenAI","Setup, buying, and pricing agents","API key",readiness.openai],
  ] as const;
  return <Section title="Organization" description="You are working inside PreFlight's private company workspace."><div className="mb-5 flex flex-wrap items-center gap-2"><Badge variant="secondary">Signed in</Badge><Badge variant="outline">Private presentation workspace</Badge><Badge variant="outline">Credentials stored server-side</Badge></div><div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]"><Card><CardHeader><CardTitle>Company profile</CardTitle><CardDescription>These details identify PreFlight to purchasing and selling agents.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="company-name">Company name</Label><Input id="company-name" value={company.name} onChange={event => { setCompany({ ...company, name: event.target.value }); setSaved(false); }} /></div><div className="space-y-2"><Label htmlFor="company-site">Website</Label><Input id="company-site" value={company.website} onChange={event => { setCompany({ ...company, website: event.target.value }); setSaved(false); }} /></div><div className="space-y-2"><Label htmlFor="approval-threshold">Approval threshold in US dollars</Label><Input id="approval-threshold" type="number" value={company.approvalThreshold} onChange={event => { setCompany({ ...company, approvalThreshold: event.target.value }); setSaved(false); }} /></div><div className="rounded-lg border bg-black/15 p-4"><p className="text-sm text-muted-foreground">Workspace access</p><p className="mt-1 font-medium">Private event environment</p><p className="mt-1 text-sm leading-6 text-muted-foreground">The demo opens directly into this account. Customer authentication and multi-organization access are intentionally outside this presentation.</p></div>{saved && <div className="rounded-lg border bg-secondary/50 p-4 text-sm">Organization settings saved for this session.</div>}</CardContent><CardFooter><Button onClick={() => setSaved(true)}>Save organization</Button></CardFooter></Card><Card><CardHeader><CardTitle>Infrastructure</CardTitle><CardDescription>Configured services available to PreFlight. Secret values are masked and never sent to the browser.</CardDescription></CardHeader><CardContent className="space-y-3">{connections.map(([Glyph,name,description,credential,ready]) => { const Icon = Glyph; return <div key={name} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><Icon className="mt-0.5 size-5 text-muted-foreground" /><div><p className="font-medium">{name}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><Badge variant={ready ? "secondary" : "outline"}>{ready ? "Connected" : "Needs setup"}</Badge></div><div className="mt-4 flex items-center justify-between gap-4 border-t pt-3 text-sm"><span className="text-muted-foreground">{credential}</span><code className="font-sans tracking-widest text-foreground">{ready ? "••••••••••••" : "Not configured"}</code></div></div>; })}</CardContent></Card></div><div className="mt-5 grid gap-5 md:grid-cols-2"><Card><CardHeader><CardTitle>Customer commerce contract</CardTitle><CardDescription>High-ticket escrow terms can be configured automatically from an approved product policy.</CardDescription></CardHeader><CardContent>{escrowContract ? <div className="space-y-4"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">PreFlight commerce escrow</p><p className="mt-1 text-sm text-muted-foreground">{escrowContract.network}</p></div><Badge variant="secondary">Deployed</Badge></div><div className="rounded-lg border bg-black/15 p-4"><p className="text-sm text-muted-foreground">Contract address</p><code className="mt-2 block break-all text-sm">{escrowContract.address}</code></div><Button asChild variant="outline"><a href={escrowContract.explorerUrl} target="_blank" rel="noreferrer">View contract<ArrowRight /></a></Button></div> : <p className="text-sm text-muted-foreground">Checking the configured Monad contract.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Production activation</CardTitle><CardDescription>The product paths are ready, but regulated production access still depends on provider approval.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between gap-4 rounded-lg border p-4"><div><p className="font-medium">Rain production</p><p className="mt-1 text-sm text-muted-foreground">Business review, production program, and banking credentials</p></div><Badge variant="outline">Onboarding required</Badge></div><div className="flex items-center justify-between gap-4 rounded-lg border p-4"><div><p className="font-medium">Monad production</p><p className="mt-1 text-sm text-muted-foreground">Production wallet policy, gas funding, and contract ownership</p></div><Badge variant="outline">Customer approval required</Badge></div></CardContent></Card></div></Section>;
}

function PresentationMode() {
  return <Section title="Company commerce story" description="Run one complete story showing how PreFlight sells, buys, approves payment, and verifies delivery."><GuidedDemo /></Section>;
}
