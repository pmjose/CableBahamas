import { Link } from 'react-router-dom'
import tt from '../i18n/tt'
import LanguageToggle from '../components/LanguageToggle'
import {
  ArrowRight, LogOut, Search, User, Sparkles, ChevronRight,
  Users, Wallet, Activity, BarChart3, Network, Brain,
  ShieldCheck, Gem, SlidersHorizontal, Filter, Layers, Zap, Bot, Eye,
  Database, Workflow, GitBranch, Server, Box, Globe2, Key, Sigma, FileText,
  Siren, BookOpen, Boxes, Cloud, Scale, Target, MessageSquareText,
  LineChart as LineIcon, BarChart, PieChart, Compass, Heart, Plug, Rocket, Wand2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const LOGO = '/CableBahamas/rev-logo.png'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={LOGO} alt="REV"
        className={`h-9 w-auto ${light ? 'brightness-0 invert' : ''}`} />
      <span className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-vfes-dark'}`}>Cable Bahamas</span>
    </span>
  )
}

export default function LandingPage() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-white text-vfes-dark">
      {/* Promo bar */}
      <div className="bg-vfes-red text-vfes-dark text-xs">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <span className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" />{tt('Cable Bahamas Data & AI Cockpit · powered by Snowflake AI Data Cloud')}</span>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest">{tt('Vision demo · synthetic data')}</span>
          </span>
          <div className="flex items-center gap-5">
            <a href="#what" className="hover:underline">{tt('What it does')}</a>
            <a href="#sections" className="hover:underline">{tt('Sections')}</a>
            <a href="#platform" className="hover:underline">{tt('Platform & AI')}</a>
            <a href="#stack" className="hover:underline">{tt('Stack')}</a>
          </div>
        </div>
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden lg:flex items-center gap-7 text-[15px] font-semibold text-vfes-dark">
            <a href="#what" className="hover:text-vfes-dark">{tt('What it does')}</a>
            <a href="#sections" className="hover:text-vfes-dark">{tt('Sections')}</a>
            <a href="#use-cases" className="hover:text-vfes-dark">{tt('Use cases')}</a>
            <a href="#platform" className="hover:text-vfes-dark">{tt('Platform & AI')}</a>
            <a href="#stack" className="hover:text-vfes-dark">{tt('Stack')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle variant="light" />
            <button className="p-2 rounded-full hover:bg-black/5"><Search className="w-5 h-5" /></button>
            <button className="p-2 rounded-full hover:bg-black/5 hidden md:block"><User className="w-5 h-5" /></button>
            <Link to="/portal" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 shadow-md shadow-vfes-red/30">
              {tt('Open Portal')} <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={logout} title={tt('Sign out')} className="p-2 rounded-full hover:bg-black/5 text-vfes-dark/50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="overview" className="relative overflow-hidden bg-vfes-dark text-white">
        <div className="absolute inset-0 opacity-25"
             style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #FF4438 0px, transparent 35%), radial-gradient(circle at 10% 80%, #FF4438 0px, transparent 30%)' }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-[10px] font-extrabold uppercase tracking-[0.3em] px-3 py-1.5 rounded-md mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {tt('Internal · executive cockpit')}
            </span>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.02] tracking-tight mb-7">
              {tt('The decisions')}<br/>
              <span className="text-vfes-red-light">{tt('behind the business.')}</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/85 mb-9 max-w-2xl leading-relaxed">
              {tt('From boardroom to NOC, every team works from the same governed Snowflake estate. Every dashboard is decision-grade, every recommendation traceable, every action one click away.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/portal/executive" className="bg-vfes-red hover:bg-white hover:text-vfes-dark text-vfes-dark font-bold px-8 py-4 rounded-full transition flex items-center justify-center gap-2 shadow-xl">
                {tt('Open the cockpit')} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#what" className="border-2 border-white/30 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-full transition text-center">
                {tt('See what it does')}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/70">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{tt('Live conversation')}</span>
                <span className="font-mono">{tt('Cortex Agent')}</span>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-2xl rounded-tl-md p-3 text-[13px] border border-white/10">
                  {tt('"Walk me into the morning — what changed overnight?"')}
                </div>
                <div className="bg-vfes-red rounded-2xl rounded-tr-md p-3 text-[13px] shadow-lg">
                  {tt('Pipeline crossed BSD 40M for the first time. Island Bank (demo) framework signed — BSD 0.42M ARR. Freeport churn anomaly spike — retention play queued.')} <span className="underline">{tt('Open exec briefing →')}</span>
                </div>
                <div className="bg-white/10 rounded-2xl rounded-tl-md p-3 text-[13px] border border-white/10">
                  {tt('"Who\'s at risk in Freeport this week?"')}
                </div>
                <div className="bg-vfes-red rounded-2xl rounded-tr-md p-3 text-[13px] shadow-lg">
                  {tt('Returning 1,284 households scored above 0.6. Best save offer for each. Export to CRM ready.')}
                </div>
              </div>
              <div className="bg-yellow-300 text-vfes-dark rounded-2xl p-3 shadow-xl">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mb-1">
                  <Sparkles className="w-3 h-3" />{tt('Ask the data')}</div>
                <div className="text-xs italic">{tt('on every page · in your words')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES — capability pillars */}
      <section id="what" className="bg-[#f6f6f8] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('What it does')}</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{tt('From signal to decision, end-to-end.')}</h2>
            <p className="text-vfes-dark/60 mt-4 max-w-2xl mx-auto text-lg">
              {tt('Six capabilities, one cockpit. Each grounded in governed Snowflake data, enriched with predictive ML and generative AI.')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { i: BarChart3, t: tt('See'),         h: tt('Decision-grade dashboards'), b: tt('Executive briefings, P&L, network health, customer experience, B2B pipeline — every cockpit refreshed continuously through Snowflake Dynamic Tables.') },
              { i: MessageSquareText, t: tt('Ask'),  h: tt('Conversational AI on every page'), b: tt('Natural language to SQL, charts and summaries. Cortex Analyst routes to the right semantic view; Cortex Agents execute multi-step plans.') },
              { i: Sparkles,  t: tt('Predict'),     h: tt('ML at the point of decision'), b: tt('Churn, CLV, propensity, fraud, demand forecasts — trained in Snowpark, registered, monitored for drift, queryable straight from SQL.') },
              { i: SlidersHorizontal, t: tt('Simulate'), h: tt('What-if before you commit'), b: tt('Move price sliders, adjust discount depth, reshape bundles. Net subscribers, margin and CLV recompute instantly with cohort-aware logic.') },
              { i: Filter,    t: tt('Activate'),    h: tt('From insight to action'),     b: tt('Score, threshold, gate, export. Targeting lists flow one click into Salesforce, PEGA, Reverse-ETL — with profitability guardrails baked in.') },
              { i: ShieldCheck, t: tt('Govern'),    h: tt('Trust by design'),            b: tt('Lineage, masking, row-access, classification, contracts, RBAC, AI guardrails — all observable through Snowflake Horizon and the Trust Center.') },
            ].map((c) => (
              <div key={c.h} className="bg-white rounded-2xl border border-black/5 p-7 hover:border-vfes-red/30 hover:shadow-xl hover:-translate-y-1 transition">
                <div className="w-12 h-12 rounded-xl bg-vfes-red/10 text-vfes-dark grid place-items-center mb-5"><c.i className="w-6 h-6" /></div>
                <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark mb-1">{c.t}</div>
                <h3 className="text-xl font-bold mb-2 leading-snug">{c.h}</h3>
                <p className="text-sm text-vfes-dark/65 leading-relaxed">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIX SECTIONS */}
      <section id="sections" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Six sections')}</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">{tt('Built for every executive seat.')}</h2>
              <p className="text-vfes-dark/60 mt-3 max-w-2xl text-lg">{tt('A curated cockpit per audience — from the board pack to the field engineer.')}</p>
            </div>
            <Link to="/portal" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">{tt('Enter the portal')} <ChevronRight className="w-4 h-4" /></Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: tt('Leadership'),       icon: BarChart3, accent: false, blurb: tt('Board-ready briefings, OKRs and a single war-room view of incidents, deals and market events.'), pages: ['Executive briefing', 'Strategy & OKRs', 'War Room'] },
              { name: tt('Customers'),         icon: Users, accent: true, blurb: tt('A unified, ML-enriched view of every household and B2B account — from acquisition through retention.'), pages: ['Customer 360', 'CLV Explorer', 'Bundle Propensity', 'Digital Funnel', 'Customer Experience', 'Marketing', 'Sales', 'AI Insights'] },
              { name: tt('Network & Operations'), icon: Network, accent: false, blurb: tt('Real-time service health, field dispatch and coverage planning grounded in DOCSIS and FTTH telemetry.'), pages: ['Operations', 'Network & Engineering', 'Field Operations', 'Coverage Map'] },
              { name: tt('Commercial'),        icon: Wallet, accent: false, blurb: tt('Margin to the SKU, price elasticity to the cohort, B2B deal economics — all simulated, all governed.'), pages: ['Finance', 'Pricing Simulator', 'Bundle Profitability', 'Product & Content', 'B2B / Wholesale', 'Procurement'] },
              { name: tt('Governance'),        icon: Scale, accent: false, blurb: tt('URCA, DPA, URCA cyber, ESG and people governance — auditable, evidenced, board-defensible.'), pages: ['Regulatory & ESG', 'Risk & Security', 'People'] },
              { name: tt('Platform & Data'),   icon: Layers, accent: true, blurb: tt('The estate that powers it all — architecture, lineage, quality, cost, agents, models, contracts and trust.'), pages: ['Architecture', 'Catalog · Lineage · Quality', 'Cost · Observability · Incidents', 'Cortex Agents · Search · Semantic', 'ML Registry · AI guardrails', 'RBAC · Trust Center · Horizon', 'Sharing · Apps · Iceberg'] },
            ].map((s) => (
              <div key={s.name} className={`rounded-2xl p-7 flex flex-col ${s.accent ? 'bg-vfes-red text-vfes-dark shadow-2xl' : 'bg-[#fafbfc] border border-black/5'}`}>
                <div className={`w-11 h-11 rounded-lg ${s.accent ? 'bg-white/15' : 'bg-vfes-red/10 text-vfes-dark'} grid place-items-center mb-4`}>
                  <s.icon className={`w-5 h-5 ${s.accent ? 'text-white' : ''}`} />
                </div>
                <h3 className="font-extrabold text-xl mb-2">{s.name}</h3>
                <p className={`text-sm leading-relaxed mb-4 ${s.accent ? 'text-white/85' : 'text-vfes-dark/65'}`}>{s.blurb}</p>
                <ul className={`text-[12px] space-y-1 mt-auto ${s.accent ? 'text-white/80' : 'text-vfes-dark/55'}`}>
                  {s.pages.map((p) => <li key={p} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 opacity-50 shrink-0" /> {tt(p)}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES — flagship workflows */}
      <section id="use-cases" className="bg-[#f6f6f8] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Flagship workflows')}</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{tt('Where decisions get made.')}</h2>
            <p className="text-vfes-dark/60 mt-4 max-w-2xl mx-auto text-lg">{tt('Six interactive workflows engineered to move the dial — each ML-grounded, semantic-view-backed, board-ready.')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { code: 'UC1', icon: SlidersHorizontal, name: tt('Price Elasticity Simulator'), body: tt('Move price sliders for any product. See acquisition, churn and migration responses by cohort. Toggle FTTH vs HFC, compare against BTC, Rival ISP A and Rival ISP C.'), to: '/portal/pricing-simulator' },
              { code: 'UC2', icon: Boxes,             name: tt('Bundle Propensity'),          body: tt('Per-customer ML scoring across four bundles. Persuadables vs. sure-things, threshold simulator, profitability gating, one-click campaign export.'), to: '/portal/bundle-propensity' },
              { code: 'UC3', icon: Sparkles,          name: tt('Bundle Profitability'),       body: tt('True margin including network, content, CPE and install. Break-even discount depth, payback period, cohort-on-cohort comparison.'), to: '/portal/bundle-profitability' },
              { code: 'UC4', icon: Gem,               name: tt('CLV Explorer'),               body: tt('36-month customer lifetime value by tier. Churn-adjusted, scenario-driven, drillable to single household with explainable feature contributions.'), to: '/portal/clv' },
              { code: 'UC5', icon: Filter,            name: tt('Digital Funnel — 500 Mb'),    body: tt('Real-time clickstream funnel with Cortex AI drop-off classification from PEGA chat. Snowflake Alerts on conversion drops route to growth squad.'), to: '/portal/digital-funnel' },
              { code: '★',  icon: Users,             name: tt('Customer 360'),               body: tt('Unified, real-time view per customer — services, billing, network experience, interactions, vulnerability flags, AI next-best-action.'), to: '/portal/customer-360' },
            ].map((u) => (
              <Link to={u.to} key={u.code} className="bg-white rounded-2xl border border-black/5 p-7 hover:border-vfes-red/40 hover:shadow-xl hover:-translate-y-1 transition group">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-lg bg-vfes-red/10 text-vfes-dark grid place-items-center"><u.icon className="w-5 h-5" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-1 rounded">{u.code}</span>
                </div>
                <h3 className="font-extrabold text-xl mb-3 leading-snug">{u.name}</h3>
                <p className="text-sm text-vfes-dark/65 leading-relaxed mb-5">{u.body}</p>
                <div className="text-sm font-bold text-vfes-dark flex items-center gap-1 group-hover:gap-2 transition-all">{tt('Open workflow')} <ArrowRight className="w-4 h-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM & AI — the engine */}
      <section id="platform" className="bg-[#0b0d12] text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #FF4438 0px, transparent 40%), radial-gradient(circle at 20% 50%, #FF4438 0px, transparent 40%)' }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-red-light mb-2">{tt('The engine')}</div>
            <h2 className="text-4xl md:text-5xl font-black">{tt('The platform behind the portal.')}</h2>
            <p className="text-white/70 mt-4 max-w-3xl mx-auto text-lg">{tt('Lineage, quality, cost, agents, models, security — every operational concern of a modern Data & AI estate, with its own first-class cockpit.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                head: tt('Platform & Data'),
                blurb: tt('How data is built, contracted and trusted.'),
                items: [
                  { i: Layers,      n: 'Architecture',     to: '/portal/architecture',     d: tt('reference diagram of the estate') },
                  { i: BookOpen,    n: 'Data Catalog',     to: '/portal/catalog',          d: tt('browse every database, schema, object') },
                  { i: Sparkles,    n: 'Data Products',    to: '/portal/data-products',    d: tt('data treated as products with owners') },
                  { i: FileText,    n: 'Data Contracts',   to: '/portal/data-contracts',   d: tt('producer ↔ consumer agreements') },
                  { i: GitBranch,   n: 'Lineage & Impact', to: '/portal/lineage',          d: tt('column-level lineage and blast-radius') },
                  { i: Workflow,    n: 'Data Engineering', to: '/portal/data-engineering', d: tt('pipelines, dynamic tables, dbt, streams') },
                  { i: ShieldCheck, n: 'Data Quality',     to: '/portal/data-quality',     d: tt('DMFs, freshness, drift, incidents') },
                  { i: Activity,    n: 'Observability',    to: '/portal/observability',    d: tt('logs, traces, metrics on event tables') },
                  { i: Siren,       n: 'Incidents',        to: '/portal/incidents',        d: tt('on-call, MTTR, postmortems') },
                  { i: GitBranch,   n: 'Environments',     to: '/portal/environments',     d: tt('DEV → STG → PROD → DR promotion') },
                ],
              },
              {
                head: tt('AI & ML'),
                blurb: tt('How intelligence is built, served and trusted.'),
                items: [
                  { i: Bot,    n: 'Cortex Agents',     to: '/portal/agents',          d: tt('multi-step agents with tools and surfaces') },
                  { i: Search, n: 'Cortex Search',     to: '/portal/cortex-search',    d: tt('enterprise-search over every corpus') },
                  { i: Eye,    n: 'Semantic Views',    to: '/portal/semantic-views',   d: tt('natural language to governed SQL') },
                  { i: Brain,  n: 'ML Registry',       to: '/portal/ml-registry',      d: tt('models, versions, drift, feature store') },
                  { i: Sigma,  n: 'AI Spend & Guard',  to: '/portal/ai-spend',         d: tt('cost, jailbreak detection, PII protection') },
                ],
              },
              {
                head: tt('Security & Apps'),
                blurb: tt('How access, cost and surfaces are governed.'),
                items: [
                  { i: Key,         n: 'RBAC Explorer',         to: '/portal/rbac',         d: tt('role hierarchy and least-privilege gaps') },
                  { i: ShieldCheck, n: 'Trust Center',          to: '/portal/trust-center', d: tt('CIS · threats · MFA · scanners') },
                  { i: Eye,         n: 'Horizon',               to: '/portal/horizon',      d: tt('masking, RLS, tags, classification') },
                  { i: Wallet,      n: 'Cost Intelligence',     to: '/portal/cost',         d: tt('credits, anomalies, optimisation') },
                  { i: Globe2,      n: 'Sharing & Marketplace', to: '/portal/sharing',      d: tt('outbound listings · inbound shares') },
                  { i: Server,      n: 'Apps & SPCS',           to: '/portal/apps',         d: tt('Streamlit, native apps, containers') },
                  { i: Box,         n: 'Iceberg & External',    to: '/portal/iceberg',      d: tt('open-format tables across catalogs') },
                ],
              },
            ].map((g) => (
              <div key={g.head} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
                <div className="text-[11px] uppercase tracking-widest font-bold text-vfes-red-light mb-1" dangerouslySetInnerHTML={{ __html: g.head }} />
                <p className="text-[12px] text-white/65 mb-4">{g.blurb}</p>
                <div className="space-y-1.5">
                  {g.items.map((it) => (
                    <Link key={it.n} to={it.to} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/10 transition group">
                      <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 grid place-items-center shrink-0 mt-0.5">
                        <it.i className="w-3.5 h-3.5 text-vfes-red-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px]">{it.n}</div>
                        <div className="text-[10px] text-white/55 leading-snug">{it.d}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white shrink-0 mt-1.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTION MODES */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('How you work with it')}</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{tt('Click. Ask. Simulate. Activate.')}</h2>
            <p className="text-vfes-dark/60 mt-4 max-w-2xl mx-auto text-lg">{tt('Four ways to engage — pick whichever fits the moment.')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { i: Compass,           t: tt('Browse'),   b: tt('Open any cockpit and read the story. Curated visuals, opinionated layouts, clear next-best-action.') },
              { i: MessageSquareText, t: tt('Ask'),      b: tt('Type a question in plain English on any page. Cortex Analyst returns the answer, the chart and the SQL.') },
              { i: Wand2,             t: tt('Simulate'), b: tt('Move sliders, change scenarios. Margin, churn and CLV recompute live with cohort-aware logic.') },
              { i: Rocket,            t: tt('Activate'), b: tt('Score, gate, export. Push lists into CRM, marketing or care queues with profitability guardrails.') },
            ].map((m) => (
              <div key={m.t} className="rounded-2xl bg-[#fafbfc] border border-black/5 p-7 hover:border-vfes-red/30 hover:shadow-xl transition">
                <div className="w-11 h-11 rounded-lg bg-vfes-red/10 text-vfes-dark grid place-items-center mb-4"><m.i className="w-5 h-5" /></div>
                <h3 className="font-extrabold text-lg mb-2">{m.t}</h3>
                <p className="text-sm text-vfes-dark/65 leading-relaxed">{m.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK */}
      <section id="stack" className="bg-vfes-dark text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25"
             style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #FF4438 0px, transparent 40%), radial-gradient(circle at 20% 50%, #FF4438 0px, transparent 40%)' }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-red-light mb-2">{tt('Snowflake-native')}</div>
            <h2 className="text-4xl md:text-5xl font-black">{tt('One AI Data Cloud. Zero copies.')}</h2>
            <p className="text-white/70 mt-4 max-w-2xl mx-auto text-lg">{tt('Every capability of the portal lives inside Snowflake — ingestion, transformation, ML, agents, apps, governance.')}</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {[
              { i: Plug,             l: 'Openflow',            d: tt('CDC from Oracle, Postgres') },
              { i: Zap,              l: 'Snowpipe Streaming',  d: tt('sub-second ingestion') },
              { i: Database,         l: 'Dynamic Tables',      d: tt('declarative pipelines') },
              { i: Workflow,         l: 'dbt project',          d: tt('governed transformation') },
              { i: Box,              l: 'Iceberg',             d: tt('open table format, no lock-in') },
              { i: Eye,              l: 'Cortex Analyst',      d: tt('natural language to SQL') },
              { i: Search,           l: 'Cortex Search',       d: tt('retrieval over every corpus') },
              { i: Bot,              l: 'Cortex Agents',       d: tt('multi-step orchestration') },
              { i: Brain,            l: 'Snowpark ML',         d: tt('training, registry, monitoring') },
              { i: Sigma,            l: 'Cortex Guard',        d: tt('jailbreak + PII protection') },
              { i: ShieldCheck,      l: 'Horizon',             d: tt('masking, RLS, tags, classification') },
              { i: Activity,         l: 'Event Tables',        d: tt('OpenTelemetry observability') },
              { i: Server,           l: 'Streamlit-in-Snow',   d: tt('this portal lives here') },
              { i: Cloud,            l: 'Container Services',  d: tt('custom runtimes & APIs') },
              { i: Globe2,           l: 'Marketplace',         d: tt('inbound and outbound shares') },
              { i: GitBranch,        l: 'DCM',                 d: tt('database change management') },
            ].map((x) => (
              <div key={x.l} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
                <x.i className="w-5 h-5 text-vfes-red-light mb-3" />
                <div className="font-bold text-sm">{x.l}</div>
                <div className="text-xs text-white/60 mt-1">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-red-light">{tt('Source systems unified')}</div>
              <div className="text-[11px] font-mono text-white/55">{tt('via Openflow CDC · Snowpipe Streaming · connectors · Marketplace shares')}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-[12px]">
              {[
                'Amdocs CRM', 'Cisco BSS / Billing', 'CMTS DOCSIS', 'OSS / NMS',
                'NetSuite GL', 'Salesforce B2B', 'Workday HR', 'Adobe Analytics',
                'PEGA ADT', 'ServiceNow', 'MyREV Web', 'Ciena Blueplanet',
                'ARC GIS (ESRI)', 'Confluent Kafka', 'Bahamas NSI', 'URCA data',
                'OECD Telecom', 'Tomorrow.io', 'Island Bank (demo) framework', 'Bahamas National Statistical Institute',
              ].map((s) => (
                <div key={s} className="bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-white/85 text-center font-semibold">{s}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHO USES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Who uses it')}</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{tt('From CEO to call-centre.')}</h2>
            <p className="text-vfes-dark/60 mt-3 max-w-2xl mx-auto text-lg">{tt('One cockpit, twelve audiences — each with their own narrative.')}</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { r: 'CEO / Board',         s: 'Executive briefing · Strategy & OKRs · War Room · CEO Briefing Agent' },
              { r: 'CFO / Finance',       s: 'Finance · CLV · Bundle Profitability · Cost Intelligence' },
              { r: 'CCO / Commercial',    s: 'Pricing Simulator · Bundle Propensity · Sales · B2B' },
              { r: 'CMO / Marketing',     s: 'Marketing · Digital Funnel · AI Insights · Customer 360' },
              { r: 'COO / Operations',    s: 'Operations · Network · Field Ops · Coverage' },
              { r: 'CTO',                 s: 'Architecture · Data Engineering · ML Registry' },
              { r: 'CDO',                 s: 'Catalog · Lineage · Data Quality · Data Contracts · Horizon' },
              { r: 'CISO',                s: 'Trust Center · RBAC · AI Guardrails · Incidents' },
              { r: 'CHRO',                s: 'People · Regulatory · ESG' },
              { r: 'CRO',                 s: 'Risk & Security · Compliance · Postmortems' },
              { r: 'Care agents',         s: 'Customer 360 · Customer Experience' },
              { r: 'Field engineers',     s: 'Field Operations · Coverage · Network' },
            ].map((p) => (
              <div key={p.r} className="rounded-xl bg-[#fafbfc] border border-black/5 p-4 hover:border-vfes-red/30 hover:shadow-md transition">
                <div className="font-bold text-sm">{p.r}</div>
                <div className="text-[11px] text-vfes-dark/55 mt-1 leading-snug">{p.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-vfes-red to-vfes-red-dark text-vfes-dark py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-3xl md:text-4xl font-black">{tt('One cockpit. Every signal.')}</h2>
            <p className="text-vfes-dark/75 mt-2 text-lg">{tt('Open the Cable Bahamas Data & AI cockpit and see the business from the inside.')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/portal/executive" className="bg-white text-vfes-dark font-black px-8 py-4 rounded-full transition hover:scale-105 inline-flex items-center gap-2 shadow-2xl">
              {tt('Executive briefing')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/portal/architecture" className="border-2 border-vfes-dark/30 hover:bg-black/5 text-vfes-dark font-black px-8 py-4 rounded-full transition inline-flex items-center gap-2">{tt('Platform architecture')}</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-vfes-dark text-white/70 text-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-xs text-white/50 text-sm">{tt('Internal Data & AI cockpit for Cable Bahamas The Bahamas · powered by Snowflake AI Data Cloud.')}</p>
          </div>
          {[
            { h: tt('Sections'),  items: ['Leadership', 'Customers', 'Network & Ops', 'Commercial', 'Governance', 'Platform & Data'] },
            { h: tt('Workflows'), items: ['Price Elasticity', 'Bundle Propensity', 'Bundle Profitability', 'CLV Explorer', 'Digital Funnel', 'Customer 360'] },
            { h: tt('Platform'),  items: ['Architecture', 'Catalog', 'Lineage', 'Data Quality', 'Cortex Agents', 'Trust Center'] },
          ].map((c) => (
            <div key={c.h}>
              <div className="font-bold text-white mb-3">{c.h}</div>
              <ul className="space-y-2">
                {c.items.map((i) => <li key={i}><a href="#" className="hover:text-white">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>{tt('© 2026 Snowflake · Internal · Built on Snowflake AI Data Cloud')}</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white">{tt('Privacy')}</a>
              <a href="#" className="hover:text-white">{tt('Cookies')}</a>
              <a href="#" className="hover:text-white">{tt('Terms')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <Link
        to="/portal"
        className="fixed bottom-6 right-6 bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50"
      >
        {tt('Open Portal')} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
