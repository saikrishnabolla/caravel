import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  CreditCard,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Network,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  WalletCards,
} from "lucide-react";
import { MotionReveal } from "@/components/motion-reveal";
import { RaingenticMark } from "@/components/raingentic-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import motion from "@/components/landing-motion.module.css";

const sources = [
  [Code2, "OpenAPI", "18 operations"],
  [Store, "Commerce", "Products and variants"],
  [CreditCard, "Billing", "Plans and prices"],
  [Globe2, "Custom API", "Internal catalog"],
] as const;

function HeroWorkspacePreview() {
  return <div className={`mx-auto mt-16 max-w-[78rem] overflow-hidden rounded-2xl border border-white/10 bg-[#090d0d] text-left shadow-[0_36px_120px_rgba(0,0,0,0.48)] ${motion.heroVisual}`}>
    <div className="flex h-12 items-center justify-between border-b border-white/10 px-4 sm:px-5"><div className="flex items-center gap-2"><RaingenticMark className="size-7" /><span className="text-sm font-medium">Commerce workspace</span></div><div className="flex items-center gap-2"><Badge variant="outline">Buying</Badge><Badge variant="outline">Selling</Badge></div></div>
    <div className="grid min-h-[29rem] lg:grid-cols-[13rem_1fr_18rem]">
      <div className="hidden border-r border-white/10 p-4 lg:block"><p className="px-2 text-sm text-muted-foreground">Workspace</p><div className="mt-3 space-y-1">{([[Package,"Products"],[ShoppingBag,"Purchases"],[ReceiptText,"Approvals"],[WalletCards,"Payments"]] as const).map(([Glyph,label],index) => { const Icon = Glyph as typeof Package; return <div key={String(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${index === 0 ? "bg-white/[0.07] text-foreground" : "text-muted-foreground"}`}><Icon className="size-4" />{label}</div>; })}</div><div className="mt-8 border-t border-white/10 pt-5"><p className="px-2 text-sm text-muted-foreground">Connections</p><div className="mt-3 space-y-3 px-2">{["Rain","Monad","OpenAI"].map(name => <div key={name} className="flex items-center justify-between text-sm"><span>{name}</span><span className="text-primary">Connected</span></div>)}</div></div></div>
      <div className="p-5 sm:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm text-muted-foreground">Product catalog</p><h3 className="mt-1 text-xl font-semibold">Everything your business sells</h3></div><Button size="sm">Add source</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["24","Products"],["4","Connected sources"],["18","Published to agents"]].map(([value,label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div><div className="mt-5 overflow-hidden rounded-xl border border-white/10"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-muted-foreground"><span>Product</span><span>Payment</span><span>Status</span></div>{[["Risk assessment API","Monad x402"],["Team software","Subscription"],["Equipment package","Rain or escrow"],["Compliance service","Rain or invoice"]].map(([product,payment],index) => <div key={product} style={{ animationDelay: `${.7 + index * .12}s` }} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 px-4 py-4 text-sm last:border-0 ${motion.statusStep}`}><div><p className="font-medium">{product}</p><p className="mt-1 text-muted-foreground">Policy enforced</p></div><span className="hidden text-muted-foreground sm:block">{payment}</span><Badge variant="secondary">Live</Badge></div>)}</div></div>
      <div className="border-t border-white/10 bg-white/[0.018] p-5 lg:border-l lg:border-t-0"><div className="flex items-start gap-3"><Bot className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-sm font-medium">Buying agent</p><p className="text-sm text-muted-foreground">Waiting for instructions</p></div></div><div className="mt-5 border-l border-white/15 pl-4 text-sm leading-6 text-foreground/90">Find a compliant data provider for 10,000 requests. Keep spend below $300 and ask before using a new vendor.</div><div className="mt-5 space-y-3.5">{([[Check,"Mandate prepared"],[Network,"3 sellers compared"],[ShieldCheck,"Company policy passed"],[FileCheck2,"Waiting for approval"]] as const).map(([Glyph,label],index) => { const Icon = Glyph as typeof Check; return <div key={label} style={{ animationDelay: `${1.4 + index * .22}s` }} className={`flex items-center gap-3 text-sm ${motion.statusStep}`}><Icon className={`size-4 ${index < 3 ? "text-primary" : "text-muted-foreground"}`} />{label}</div>; })}</div><Button className="mt-7 w-full">Review purchase</Button></div>
    </div>
  </div>;
}

function BuyingIllustration() {
  return <div className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4">
    <div className="rounded-xl bg-white/[0.05] p-4 text-sm leading-6">Buy compliance and weather coverage for 10,000 API calls. Keep it below $300.</div>
    <div className="mt-4 grid divide-y divide-white/10 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[["01","Mandate","$300 cap"],["02","Compare","3 sellers"],["03","Approve","$284 total"]].map(([number,label,value],index) => <div key={label} style={{ animationDelay: `${index * .3}s` }} className={`p-4 ${motion.statusStep}`}><p className="font-mono text-xs text-muted-foreground">{number}</p><p className="mt-3 text-sm font-medium">{label}</p><p className="mt-1 text-sm text-muted-foreground">{value}</p></div>)}</div>
  </div>;
}

function SellingIllustration() {
  return <div className="mt-7 overflow-hidden rounded-xl border border-white/10 bg-black/20">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="text-sm text-muted-foreground">Imported OpenAPI</span><Badge variant="secondary">18 operations</Badge></div>
    <div>{[["GET","/weather/metars","$0.01"],["GET","/airspace/notams","$0.03"],["POST","/mission/readiness","$0.25"]].map(([method,path,price],index) => <div key={path} style={{ animationDelay: `${index * .25}s` }} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-0 ${motion.statusStep}`}><Badge variant="outline">{method}</Badge><span className="truncate font-mono text-xs">{path}</span><span className="text-muted-foreground">{price}</span></div>)}</div>
    <div className="flex items-center justify-between border-t border-white/10 bg-primary/[0.035] px-4 py-3 text-sm"><span>Pricing policy compiled</span><span className="text-primary">Ready to publish</span></div>
  </div>;
}

function ConnectionIllustration() {
  return <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#090e0e] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
    <div className="grid lg:grid-cols-[1fr_1.05fr_1fr]">
      <div className="p-6 md:p-8"><p className="mb-5 text-sm text-muted-foreground">Your systems</p><div className="divide-y divide-white/10 border-y border-white/10">{sources.map(([Glyph,title,detail]) => { const Icon = Glyph; return <div key={title} className="flex items-center gap-3 py-4"><Icon className="size-4 shrink-0 text-muted-foreground" /><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></div>; })}</div></div>

      <div className="border-y border-white/10 bg-white/[0.018] p-6 md:p-8 lg:border-x lg:border-y-0"><div className="flex items-center gap-3"><RaingenticMark className="size-8" /><div><p className="text-sm font-medium">Raingentic policy engine</p><p className="text-sm text-muted-foreground">Control layer</p></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">Normalize products, compile business rules, choose payment rails, and prepare agent discovery.</p><div className="mt-6 divide-y divide-white/10 border-y border-white/10 text-sm">{["Price floors and budgets","Approval requirements","Negotiation boundaries","Settlement methods"].map((label,index) => <div key={label} style={{ animationDelay: `${.35 + index * .18}s` }} className={`flex items-center justify-between py-3 ${motion.statusStep}`}><span>{label}</span><Check className="size-4 text-primary" /></div>)}</div></div>

      <div className="p-6 md:p-8"><p className="mb-5 text-sm text-muted-foreground">Agent-ready output</p><div className="divide-y divide-white/10 border-y border-white/10">{([[Package,"Published catalog","Every operation and product"],[Bot,"Buying and selling agents","Natural-language control"],[ShieldCheck,"Enforced commerce policy","Deterministic boundaries"]] as const).map(([Glyph,title,detail]) => { const Icon = Glyph as typeof Package; return <div key={String(title)} className="flex gap-3 py-4"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></div>; })}</div></div>
    </div>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 px-6 py-4 text-xs text-muted-foreground md:px-8"><span>4 sources connected</span><span>Catalog normalized</span><span>Policies compiled</span><span className="text-primary">Ready to publish</span></div>
  </div>;
}

function RailIllustration() {
  return <div className="mt-12 rounded-2xl border border-white/10 bg-[#090e0e] p-5 md:p-7">
    <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">{([[WalletCards,"Monad and x402","APIs and data","$0.01"],[CreditCard,"Rain","Traditional merchants","$284"],[LockKeyhole,"Escrow or checkout","High-value orders","$28,900"]] as const).map(([Glyph,title,useCase,amount]) => { const Icon = Glyph as typeof WalletCards; return <div key={String(title)} className="p-5"><div className="flex items-center justify-between gap-3"><Icon className="size-5 text-muted-foreground" /><span className="font-mono text-xs text-muted-foreground">{amount}</span></div><h3 className="mt-6 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{useCase}</p></div>; })}</div>
    <div className="mt-5 grid grid-cols-3 border-t border-white/10 pt-4 text-center font-mono text-xs text-muted-foreground"><span>Authorize</span><span>Settle</span><span>Verify</span></div>
  </div>;
}

export function LandingPage() {
  const headline = [["Connect","your","business."],["Let","agents","transact."]];
  let wordIndex = 0;

  return <div className="min-h-screen overflow-hidden bg-background text-foreground">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/88 backdrop-blur-2xl"><div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-5 md:px-8"><Link href="/" className="flex items-center gap-3"><RaingenticMark className="size-9" /><div><p className="text-base font-semibold tracking-tight">Raingentic</p><p className="text-sm text-muted-foreground">Agent commerce infrastructure</p></div></Link><nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex"><a href="#platform" className="hover:text-foreground">Platform</a><a href="#connect" className="hover:text-foreground">Connect anything</a><a href="#rails" className="hover:text-foreground">Payment rails</a></nav><div className="flex items-center gap-2"><Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex"><Link href="/api/openapi">API</Link></Button><Button asChild size="sm"><Link href="/dashboard">Open dashboard<ArrowRight /></Link></Button></div></div></header>

    <main>
      <section className="relative px-5 pb-20 pt-36 md:px-8 md:pb-28 md:pt-44"><div aria-hidden="true" className="absolute left-1/2 top-0 h-[34rem] w-[70rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse,hsl(58_100%_65%/0.1),hsl(185_80%_55%/0.035)_45%,transparent_72%)] blur-3xl" /><div className="relative mx-auto max-w-6xl text-center"><Badge variant="outline">One platform for agent buying and selling</Badge><h1 className="mx-auto mt-7 max-w-5xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-[5.4rem] md:leading-[.96]">{headline.map((line,lineIndex) => <span key={lineIndex} className="block overflow-hidden">{line.map(word => { const delay = .08 + wordIndex++ * .09; return <span key={word} style={{ animationDelay: `${delay}s` }} className={`${motion.heroWord} mr-[.2em]`}>{word}</span>; })}</span>)}</h1><p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">Connect the APIs, products, payment providers, and policies your company already uses. Raingentic gives agents a governed way to discover, negotiate, buy, sell, and settle.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg"><Link href="/dashboard">Explore the platform<ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/dashboard?demo=workspace">Run the working demo</Link></Button></div><div className="mt-9 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"><span><strong className="text-foreground">18</strong> callable API products</span><span><strong className="text-foreground">2</strong> commerce directions</span><span><strong className="text-foreground">1</strong> policy layer</span></div><HeroWorkspacePreview /></div></section>

      <section id="platform" className="border-y border-border bg-black/10 px-5 py-24 md:px-8 md:py-32"><div className="mx-auto max-w-6xl"><MotionReveal className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold text-primary">One platform, both sides of commerce</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Your company can buy and sell through agents.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Every agent operates inside the same budgets, pricing floors, approvals, payment choices, and audit trail.</p></MotionReveal><div className="mt-14 grid gap-5 lg:grid-cols-2"><MotionReveal><div className={`h-full rounded-2xl border border-border bg-card p-7 md:p-8 ${motion.flowCard}`}><div className="flex items-center gap-3"><ShoppingBag className="size-5 text-muted-foreground" /><h3 className="text-2xl font-semibold">Buying</h3></div><p className="mt-4 leading-7 text-muted-foreground">Describe the outcome. The agent prepares a mandate, compares sellers, enforces company rules, and stops for approval.</p><BuyingIllustration /></div></MotionReveal><MotionReveal delay={160}><div className={`h-full rounded-2xl border border-border bg-card p-7 md:p-8 ${motion.flowCard}`}><div className="flex items-center gap-3"><Store className="size-5 text-muted-foreground" /><h3 className="text-2xl font-semibold">Selling</h3></div><p className="mt-4 leading-7 text-muted-foreground">Import what you already sell, price every product or operation, compile negotiation rules, and publish to agents.</p><SellingIllustration /></div></MotionReveal></div></div></section>

      <section id="connect" className="px-5 py-24 md:px-8 md:py-32"><div className="mx-auto max-w-6xl"><MotionReveal className="max-w-3xl"><p className="text-sm font-semibold text-primary">Connect anything</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Keep the business. Add the agent layer.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Raingentic reads the systems that already contain your products and prices, then turns them into governed agent-commerce products.</p></MotionReveal><MotionReveal delay={100}><ConnectionIllustration /></MotionReveal></div></section>

      <section id="rails" className="border-y border-border bg-black/10 px-5 py-24 md:px-8 md:py-32"><div className="mx-auto max-w-6xl"><MotionReveal className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold text-primary">Use the right payment rail</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">The product and policy choose how money moves.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Small machine payment, controlled card purchase, high-value escrow, or the checkout you already operate.</p></MotionReveal><MotionReveal delay={100}><RailIllustration /></MotionReveal></div></section>

      <section className="px-5 py-24 text-center md:px-8 md:py-32"><MotionReveal className="mx-auto max-w-4xl"><p className="text-sm font-semibold text-primary">Agent-ready commerce without rebuilding your company</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">Connect once. Govern every transaction.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Give agents a safe way to buy what your company needs and sell what your company already offers.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg"><Link href="/dashboard">Open the platform<ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/api/openapi">View the live API</Link></Button></div></MotionReveal></section>
    </main>

    <footer className="border-t border-border px-5 py-8 md:px-8"><div className="mx-auto flex max-w-[90rem] flex-col gap-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><RaingenticMark className="size-8" /><div><p className="font-medium text-foreground">Raingentic</p><p>Commerce infrastructure for business agents</p></div></div><div className="flex gap-6"><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link><Link href="/api/openapi" className="hover:text-foreground">API</Link><a href="#platform" className="hover:text-foreground">Platform</a></div></div></footer>
  </div>;
}
