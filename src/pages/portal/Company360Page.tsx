import { useState, useMemo, useEffect } from 'react'
import MlInsightSection from '../../components/MlInsightSection'
import { Link, useSearchParams } from 'react-router-dom'
import { accounts, buildAccountDetails, Account } from './_b2b_data'
import { PageHeader, Panel } from '../../components/Panel'
import AgentWorkflow from '../../components/AgentWorkflow'
import { flowById } from './_agent_flows'
import KpiCard from '../../components/KpiCard'
import AgentAction from '../../components/AgentAction'
import tt from '../../i18n/tt'
import {
  Search, Building2, Coins, Globe, Heart, Calendar, AlertTriangle, CheckCircle2,
  Sparkles, ChevronRight, MessageSquare, Lock, FileText, PhoneCall, ShieldCheck,
  TrendingUp, Network, Target, Users, Activity, TrendingDown, Briefcase, BarChart3, Gauge,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
  BarChart, Bar, ComposedChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

const RED = '#FF4438'
const RED2 = '#11567F'
const AMBER = '#F59E0B'
const BLUE = '#FF4438'
const GREEN = '#10B981'
const PURPLE = '#7C3AED'
const GREY = '#94a3b8'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const TABS = ['Overview', 'Commercial', 'Service & SLA', 'Relationships', 'Finance'] as const
type Tab = typeof TABS[number]

const statusColor: Record<string, string> = {
  Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Watch: 'bg-amber-50 text-amber-700 border-amber-200',
  'At Risk': 'bg-red-50 text-red-700 border-red-200',
  Renewal: 'bg-blue-50 text-blue-700 border-blue-200',
  Churned: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}
const flagSeverityColor: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  crit: 'bg-red-50 text-red-700 border-red-200',
}
const sentColor: Record<string, string> = {
  Champion: 'bg-emerald-50 text-emerald-700',
  Supporter: 'bg-blue-50 text-blue-700',
  Neutral: 'bg-zinc-100 text-zinc-700',
  Detractor: 'bg-red-50 text-red-700',
}

function Stat({ label, value, sub, color = 'text-vfes-dark' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt(label)}</div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-vfes-dark/55">{sub}</div>}
    </div>
  )
}

// ── Portfolio-level static data for analytics tabs ─────────────────────────────
const PORTF_SEGS = [
  { seg: 'Enterprise',        accounts: 6, arr: 48600, avgArr: 8100, nps: 42, churn: 0.8  },
  { seg: 'Mid-Market',        accounts: 8, arr: 21400, avgArr: 2675, nps: 31, churn: 1.4  },
  { seg: 'SMB',               accounts: 6, arr:  6200, avgArr: 1033, nps: 24, churn: 2.1  },
  { seg: 'Wholesale-Carrier', accounts: 4, arr: 10800, avgArr: 2700, nps: 18, churn: 0.3  },
  { seg: 'Wholesale-Infra',   accounts: 2, arr:  8400, avgArr: 4200, nps: 22, churn: 0.2  },
]
const PORTF_PIPE = [
  { stage: 'Qualify',   open: 4.2, weighted: 0.8 },
  { stage: 'Propose',   open: 7.8, weighted: 2.3 },
  { stage: 'Negotiate', open: 5.1, weighted: 3.1 },
  { stage: 'Close Won', open: 2.8, weighted: 2.8 },
]
const PORTF_ARR_TREND = [
  { q: 'Q3-23', arr: 72.4 }, { q: 'Q4-23', arr: 76.2 }, { q: 'Q1-24', arr: 79.1 },
  { q: 'Q2-24', arr: 80.8 }, { q: 'Q3-24', arr: 82.5 }, { q: 'Q4-24', arr: 84.0 },
]
const PORTF_SLA = [
  { m: 'Jun', uptime: 99.97, p1: 2, credits: 8  }, { m: 'Jul', uptime: 99.98, p1: 1, credits:  4 },
  { m: 'Aug', uptime: 99.96, p1: 3, credits: 12 }, { m: 'Sep', uptime: 99.95, p1: 4, credits: 18 },
  { m: 'Oct', uptime: 99.97, p1: 2, credits:  6 }, { m: 'Nov', uptime: 99.99, p1: 0, credits:  0 },
]
const PORTF_CHURN_DIST = [
  { band: '≥80', count: 14 }, { band: '60–79', count: 7 },
  { band: '40–59', count: 4 }, { band: '<40',   count: 1 },
]
const PORTF_WHITESPACE = [
  { play: 'SD-WAN expansion',   accounts: 8, tcv: 9200, prob: 0.62 },
  { play: 'Private 5G slice',   accounts: 5, tcv: 7400, prob: 0.44 },
  { play: 'Cloud connectivity', accounts: 9, tcv: 5800, prob: 0.71 },
  { play: 'Managed Security',   accounts: 6, tcv: 4200, prob: 0.55 },
  { play: 'IoT platform',       accounts: 4, tcv: 3100, prob: 0.38 },
]
const PORTF_COHORTS = [
  { cohort: '2022 Q1', acquired: 3, activeNow: 2, arrNow: 14200, retPct: 67  },
  { cohort: '2022 Q3', acquired: 4, activeNow: 4, arrNow: 19800, retPct: 100 },
  { cohort: '2023 Q1', acquired: 5, activeNow: 5, arrNow: 22100, retPct: 100 },
  { cohort: '2023 Q3', acquired: 6, activeNow: 5, arrNow: 24400, retPct: 83  },
  { cohort: '2024 Q1', acquired: 5, activeNow: 5, arrNow: 18800, retPct: 100 },
  { cohort: '2024 Q3', acquired: 3, activeNow: 3, arrNow: 10600, retPct: 100 },
]

type OuterTab = 'account360' | 'segments' | 'pipeline' | 'revenue' | 'service' | 'churn' | 'whitespace' | 'cohorts'
const OUTER_TABS: { id: OuterTab; label: string }[] = [
  { id: 'account360',  label: 'Account 360'   },
  { id: 'segments',    label: 'Segments'      },
  { id: 'pipeline',    label: 'Pipeline'      },
  { id: 'revenue',     label: 'Revenue'       },
  { id: 'service',     label: 'Service / SLA' },
  { id: 'churn',       label: 'Churn Risk'    },
  { id: 'whitespace',  label: 'Whitespace'    },
  { id: 'cohorts',     label: 'Cohorts'       },
]

export default function Company360Page() {
  const [params] = useSearchParams()
  const deepLinked = accounts.find((x) => x.code === params.get('a'))?.code
  const [selectedCode, setSelectedCode] = useState(deepLinked ?? accounts[0].code)
  // Re-sync if the ?a= param changes while the page is mounted (e.g. another drill-through)
  useEffect(() => { if (deepLinked && deepLinked !== selectedCode) setSelectedCode(deepLinked) }, [deepLinked])
  const [tab, setTab] = useState<Tab>('Overview')
  const [search, setSearch] = useState('')
  const [actionToast, setActionToast] = useState<string | null>(null)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [outerTab, setOuterTab] = useState<OuterTab>('account360')
  useEffect(() => { setPlanGenerated(false) }, [selectedCode])

  const a: Account = accounts.find((x) => x.code === selectedCode) ?? accounts[0]
  const det = useMemo(() => buildAccountDetails(selectedCode), [selectedCode])
  const filtered = accounts.filter(
    (x) => tt(x.name).toLowerCase().includes(search.toLowerCase()) || x.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPipe = det.pipeline.reduce((s, p) => s + p.value, 0)
  const totalTickets = det.tickets.reduce((s, t) => s + t.p1 + t.p2 + t.p3, 0)
  const slaAvg = det.slaHistory.reduce((s, x) => s + x.uptime, 0) / det.slaHistory.length
  const totalAR = det.ar.reduce((s, x) => s + x.amt, 0)
  const expansionTcv = det.expansionPlay.reduce((s, p) => s + p.tcv, 0)
  const top = det.expansionPlay[0]

  const planResult = top ? {
    headline: `Recommended play: ${tt(top.play)}`,
    stats: [
      { label: 'TCV', value: `BSD ${(top.tcv / 1000).toFixed(0)}K` },
      { label: 'Win probability', value: `${(top.prob * 100).toFixed(0)}%` },
      { label: 'Account health', value: `${a.health}/100` },
      { label: 'WAULT', value: `${a.wault}m` },
    ],
    findings: [
      `Rationale: ${tt(top.rationale)}.`,
      a.wault >= 0 && a.wault < 6
        ? `Renewal is ${a.wault} months out — sequence the expansion alongside the renewal to protect BSD ${(a.arr / 1000).toFixed(0)}K ARR.`
        : `No near-term renewal pressure (WAULT ${a.wault}m) — this is a pure growth play on a ${a.status.toLowerCase()} account.`,
      det.expansionPlay.length > 1
        ? `Ranked alternatives: ${det.expansionPlay.slice(1, 3).map((p) => `${tt(p.play)} (BSD ${(p.tcv / 1000).toFixed(0)}K · ${(p.prob * 100).toFixed(0)}%)`).join(' · ')}.`
        : 'No compliant alternatives cleared the value threshold.',
      `Addressable expansion across all plays: BSD ${(expansionTcv / 1000).toFixed(0)}K · owner ${a.ownerAE} · exec sponsor ${a.exec}.`,
    ],
    note: 'Same play is mirrored to the AE desktop and the B2B portal — one account plan, every channel.',
  } : undefined

  const fireAction = (msg: string) => {
    setActionToast(msg)
    setTimeout(() => setActionToast(null), 3000)
  }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Company 360')}
        subtitle={tt('Unified enterprise account view across ARR, network, service, relationships & expansion signals.')}
        actions={<Link to="/portal/b2b" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1"><Building2 className="w-3 h-3" />{tt('Open B2B cockpit →')}</Link>}
      />

      <div className="mb-6"><AgentWorkflow flow={flowById('b2b-quote')} compact /></div>

      {/* Cortex expansion-plan agent */}
      <div className="mb-6 rounded-2xl border border-vfes-red/20 bg-gradient-to-br from-vfes-red/5 to-white p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2">
          <Sparkles className="w-3 h-3" /> {tt('Account expansion plan for this company (Cortex)')}
        </div>
        <div className="pt-1">
          <AgentAction key={selectedCode} label="Generate Account Plan" runningLabel="Reasoning…"
            steps={[
              'Fused ARR, service mix, SLA & ticket signals',
              'Scored renewal risk & expansion propensity',
              'Selected highest-value compliant play',
              'Pushed to AE desktop & B2B portal',
            ]}
            result={planResult}
            onComplete={() => setPlanGenerated(true)} />
        </div>
        {!planGenerated && (
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Click Generate to score renewal risk & expansion propensity and produce the highest-value compliant account play.')}</div>
        )}
        {planGenerated && top && (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-xs border-t border-black/5 pt-3">
            <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold">{tt('one account plan this cycle — respect exec-sponsor cadence')}</span>
            <div className="flex items-center gap-3">
              <a href="#/portal/b2b" className="text-vfes-dark font-semibold hover:underline">{tt('Open B2B cockpit')} →</a>
              <button onClick={() => fireAction(`${tt('Plan')} "${tt(top.play)}" ${tt('applied · approval requested')}`)} className="shrink-0 bg-vfes-red text-vfes-dark text-xs font-bold px-5 py-2 rounded-lg hover:bg-vfes-red-dark">{tt('Apply')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {actionToast && (
        <div className="fixed top-20 right-6 z-50 bg-vfes-dark text-white px-4 py-3 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {actionToast}
        </div>
      )}

      <MlInsightSection
        heading={tt('B2B account intelligence')}
        models={[
          { name: tt('Account churn-risk v3.2'),    metric: 'AUC 0.91', sub: 'XGBoost · 120 features · weekly'      },
          { name: tt('Expansion propensity scorer'), metric: 'AUC 0.87', sub: 'LightGBM · product-fit signals'       },
          { name: tt('WAULT renewal predictor'),     metric: 'MAPE 6%',  sub: 'LSTM · contract + ARR cohort signals' },
        ]}
        agentLabel={tt('Run Portfolio Intelligence')}
        agentRunningLabel={tt('Scoring portfolio…')}
        agentSteps={[
          tt('Scored 26 named accounts on churn + expansion signals'),
          tt('Ranked plays by segment fit and whitespace opportunity'),
          tt('Flagged renewal-cliff logos for exec engagement'),
          tt('Generated account-level action plans for AE desktop'),
        ]}
        agentBlurb={tt('Fuses ARR, SLA, WAULT, NPS and product signals into one prioritised action list.')}
        decision={{
          title: tt('Protect top-10 logos · push SD-WAN & Private 5G expansion'),
          detail: tt('Top-10 accounts represent 78% of ARR. Pair exec sponsorship on at-risk logos with whitespace expansion plays.'),
          impact: tt('+BSD 1.2M ARR if top-3 whitespace plays convert in H2'),
          risk: tt('Concentration risk — one logo loss dents the quarter'),
          linkTo: '#/portal/company-360',
          linkLabel: tt('Company 360'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Portfolio ARR by segment (BSD K)'),
          data: PORTF_SEGS.map(s => ({ seg: s.seg.split('-')[0], arr: s.arr })),
          xKey: 'seg',
          series: [{ key: 'arr', name: tt('ARR BSD K'), color: '#FF4438' }],
          note: tt('Enterprise drives 49% of total ARR; wholesale combined is 23%.'),
        }}
      />

      {/* ── Related cockpits ────────────────────────────────────────────────────────── */}
      <div className="mb-4 mt-2 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mr-1">{tt('Cockpits')}</span>
        <Link to="/portal/b2b"                  className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Building2 className="w-3 h-3" />{tt('B2B / Wholesale')}</Link>
        <Link to="/portal/sales"                className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><TrendingUp className="w-3 h-3" />{tt('Sales')}</Link>
        <Link to="/portal/pricing-simulator"    className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Coins className="w-3 h-3" />{tt('Pricing')}</Link>
        <Link to="/portal/product"              className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><BarChart3 className="w-3 h-3" />{tt('Product')}</Link>
        <Link to="/portal/bundle-profitability" className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Target className="w-3 h-3" />{tt('Bundle P&L')}</Link>
        <Link to="/portal/mvno-wholesale"       className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Network className="w-3 h-3" />{tt('MVNO & Wholesale')}</Link>
        <Link to="/portal/roaming"              className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Globe className="w-3 h-3" />{tt('Roaming')}</Link>
        <Link to="/portal/customer-360"         className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Users className="w-3 h-3" />{tt('Customer 360')}</Link>
        <Link to="/portal/churn-retention"      className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Heart className="w-3 h-3" />{tt('Churn & Retention')}</Link>
        <Link to="/portal/finance"              className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><FileText className="w-3 h-3" />{tt('Finance')}</Link>
        <Link to="/portal/ai-insights"          className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Activity className="w-3 h-3" />{tt('AI Insights')}</Link>
      </div>

      {/* Outer tab pill nav */}
      <div className="flex flex-wrap gap-2 mb-6">
        {OUTER_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setOuterTab(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition ${outerTab === id ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
            {tt(label)}
          </button>
        ))}
      </div>

      {outerTab === 'account360' && (<>
      <div className="grid lg:grid-cols-[260px,1fr,320px] gap-6">
        {/* === Account list === */}
        <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4 h-fit lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vfes-dark/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tt('Search companies…')}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-vfes-red/40"
            />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.map((x) => (
              <button
                key={x.code}
                onClick={() => setSelectedCode(x.code)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition border ${
                  x.code === selectedCode ? 'bg-vfes-red/5 border-vfes-red/30' : 'border-transparent hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-vfes-red/10 text-vfes-dark grid place-items-center shrink-0"><Building2 className="w-4 h-4" /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{tt(x.name)}</div>
                      <div className="text-xs text-vfes-dark/55 truncate">{tt(x.segment)} · BSD {(x.arr / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${statusColor[x.status]}`}>{tt(x.status)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* === Account detail === */}
        <div className="space-y-6 min-w-0">
          {/* Header card */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 -mr-32 -mt-32 rounded-full bg-vfes-red/5 pointer-events-none" />
            <div className="relative flex items-start gap-5 flex-wrap">
              <div className="w-20 h-20 rounded-2xl grid place-items-center ring-2 ring-vfes-red/20 shadow-sm shrink-0 bg-gradient-to-br from-vfes-red/10 to-vfes-red/5 text-vfes-dark">
                <Building2 className="w-9 h-9" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-extrabold">{tt(a.name)}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/5 text-vfes-dark/70">{tt(a.segment)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/5 text-vfes-dark/70">{tt(a.vertical)}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor[a.status]}`}>{tt(a.status)}</span>
                  {a.wault >= 0 && a.wault < 6 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> {tt('Renewal cliff')}
                    </span>
                  )}
                </div>
                <div className="text-vfes-dark/60 text-sm mt-1 flex flex-wrap gap-x-5 gap-y-1">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {a.code}</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {a.region}</span>
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {tt('Owner AE')}: {a.ownerAE}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {tt('Exec sponsor')}: {a.exec}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {tt('Contract end')} {a.contractEnd}</span>
                </div>
              </div>
            </div>

            {/* Key signals strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 relative">
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label="ARR" value={`BSD ${(a.arr / 1000).toFixed(0)}K`} sub={`BSD ${(a.mrr / 1000).toFixed(0)}K MRR`} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label="Sites / circuits" value={`${a.sites} / ${a.circuits}`} sub={`${det.sites.length} ${tt('regions')}`} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label="Health" value={`${a.health}`} sub={`v1.2 · ${a.health >= 70 ? tt('healthy') : tt('at risk')}`} color={a.health >= 70 ? 'text-emerald-600' : a.health >= 50 ? 'text-amber-600' : 'text-red-600'} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label="NPS" value={`${a.nps}`} sub={a.nps > 30 ? tt('Promoter') : a.nps >= 0 ? tt('Passive') : tt('Detractor')} color={a.nps > 30 ? 'text-emerald-600' : a.nps < 0 ? 'text-red-600' : 'text-amber-600'} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label="WAULT" value={`${a.wault}m`} sub={`${tt('pipe')} BSD ${(totalPipe / 1000).toFixed(0)}K`} color={a.wault >= 12 ? 'text-emerald-600' : a.wault >= 6 ? 'text-amber-600' : 'text-red-600'} /></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-black/10 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold transition relative whitespace-nowrap ${
                  tab === t ? 'text-vfes-dark' : 'text-vfes-dark/55 hover:text-vfes-dark'
                }`}
              >
                {tt(t)}
                {tab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-vfes-red" />}
              </button>
            ))}
          </div>

          {/* === OVERVIEW === */}
          {tab === 'Overview' && (
            <div className="space-y-6">
              {det.flags.length > 0 && (
                <Panel title={`${tt('Risk flags')} (${det.flags.length})`} action={<AlertTriangle className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="grid md:grid-cols-2 gap-2">
                    {det.flags.map((f, i) => (
                      <div key={i} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${flagSeverityColor[f.severity]}`}>
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-bold">{f.kind} · {f.severity}</span>
                          <div>{tt(f.text)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('ARR trend (24mo, BSD K)')}>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <AreaChart data={det.arrTrend}>
                        <CartesianGrid stroke="#eef0f3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
                        <Area dataKey="arr" stroke={RED} fill={RED} fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
                <Panel title={tt('Service mix (MRR BSD )')}>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={det.serviceMix} dataKey="mrr" nameKey="svc" innerRadius={40} outerRadius={90}>
                          {det.serviceMix.map((_, i) => <Cell key={i} fill={[RED, RED2, AMBER, BLUE, GREEN, PURPLE, GREY, '#0ea5e9'][i % 8]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${(Number(v) / 1000).toFixed(1)}K`} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <Panel title={tt('Sites by region')} action={<Network className="w-4 h-4 text-vfes-dark/40" />}>
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                    <tr><th className="py-1.5">{tt('Region')}</th><th>{tt('Sites')}</th><th>{tt('Circuits')}</th></tr>
                  </thead>
                  <tbody>
                    {det.sites.map((s) => (
                      <tr key={s.region} className="border-t border-black/5"><td className="py-2 font-semibold">{s.region}</td><td>{s.count}</td><td>{s.circuits}</td></tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {/* === COMMERCIAL === */}
          {tab === 'Commercial' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Active contracts')}>
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Service')}</th><th>{tt('End')}</th><th>{tt('MRR')}</th><th>{tt('Auto')}</th></tr>
                    </thead>
                    <tbody>
                      {det.contracts.map((c) => (
                        <tr key={c.id} className="border-t border-black/5">
                          <td className="py-2 font-mono text-xs">{c.id}</td>
                          <td>{c.svc}</td>
                          <td>{c.end}</td>
                          <td>BSD {(c.mrr / 1000).toFixed(0)}K</td>
                          <td>{c.auto ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <Panel title={tt('Open opportunities')}>
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-1.5">{tt('Opp')}</th><th>{tt('Stage')}</th><th>{tt('BSD K')}</th><th>{tt('Close')}</th></tr>
                    </thead>
                    <tbody>
                      {det.pipeline.map((p, i) => (
                        <tr key={i} className="border-t border-black/5">
                          <td className="py-2 font-semibold text-xs">{tt(p.opp)}</td>
                          <td className="text-xs">{tt(p.stage)}</td>
                          <td>BSD {(p.value / 1000).toFixed(0)}K</td>
                          <td className="text-xs">{p.close}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </div>

              <Panel title={`${tt('Expansion playbook')} · BSD ${(expansionTcv / 1000).toFixed(0)}K ${tt('addressable')}`} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                    <tr><th className="py-1.5">{tt('Play')}</th><th>{tt('Rationale')}</th><th>{tt('TCV BSD K')}</th><th>{tt('Prob')}</th></tr>
                  </thead>
                  <tbody>
                    {det.expansionPlay.map((p, i) => (
                      <tr key={i} className="border-t border-black/5">
                        <td className="py-2 font-semibold text-xs">{tt(p.play)}</td>
                        <td className="text-vfes-dark/60 text-xs">{tt(p.rationale)}</td>
                        <td>BSD {(p.tcv / 1000).toFixed(0)}K</td>
                        <td className={p.prob >= 0.6 ? 'text-emerald-600 font-bold' : p.prob >= 0.4 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{(p.prob * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {/* === SERVICE & SLA === */}
          {tab === 'Service & SLA' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={`${tt('Tickets (12mo)')} · ${totalTickets} ${tt('total')}`}>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <BarChart data={det.tickets}>
                        <CartesianGrid stroke="#eef0f3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="p1" stackId="a" fill={RED} name={tt('P1')} />
                        <Bar dataKey="p2" stackId="a" fill={AMBER} name={tt('P2')} />
                        <Bar dataKey="p3" stackId="a" fill={GREY} name={tt('P3')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
                <Panel title={`${tt('SLA history')} · ${tt('avg')} ${slaAvg.toFixed(3)}%`}>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <ComposedChart data={det.slaHistory}>
                        <CartesianGrid stroke="#eef0f3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="l" domain={[99.85, 100]} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine yAxisId="l" y={99.95} stroke={RED} strokeDasharray="3 3" />
                        <Line yAxisId="l" dataKey="uptime" stroke={RED} strokeWidth={2} name={tt('Uptime %')} />
                        <Bar yAxisId="r" dataKey="credits" fill={GREY} name={tt('Credits BSD ')} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Source: CBL_OPS.SERVICE_ASSURANCE.B2B_SLA · ticketing (ServiceNow) · refresh hourly')}</div>
            </div>
          )}

          {/* === RELATIONSHIPS === */}
          {tab === 'Relationships' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Exec relationship map')} action={<TrendingUp className="w-4 h-4 text-vfes-dark/40" />}>
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-1.5">{tt('Role')}</th><th>{tt('Sentiment')}</th></tr>
                    </thead>
                    <tbody>
                      {det.contacts.map((c, i) => (
                        <tr key={i} className="border-t border-black/5">
                          <td className="py-2 font-semibold text-xs">{tt(c.role)}</td>
                          <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sentColor[c.sentiment]}`}>{tt(c.sentiment)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <Panel title={tt('QBRs (last 4)')}>
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-1.5">{tt('Date')}</th><th>{tt('Sponsor')}</th><th>{tt('Status')}</th></tr>
                    </thead>
                    <tbody>
                      {det.qbrs.map((q, i) => (
                        <tr key={i} className="border-t border-black/5">
                          <td className="py-2 text-xs">{q.date}</td>
                          <td className="text-xs">{q.sponsor}</td>
                          <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${q.status === 'Held' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{tt(q.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </div>
              <Panel title={tt('NPS trend')}>
                <div className="h-52">
                  <ResponsiveContainer>
                    <LineChart data={det.npsTrend}>
                      <CartesianGrid stroke="#eef0f3" />
                      <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <ReferenceLine y={0} stroke="#1f2937" strokeDasharray="3 3" />
                      <Line dataKey="nps" stroke={RED} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          )}

          {/* === FINANCE === */}
          {tab === 'Finance' && (
            <div className="space-y-6">
              <Panel title={`${tt('AR aging')} · BSD ${totalAR}K`}>
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart data={det.ar}>
                      <CartesianGrid stroke="#eef0f3" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
                      <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                        {det.ar.map((d, i) => <Cell key={i} fill={i < 2 ? GREEN : i === 2 ? AMBER : RED} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <div className="grid md:grid-cols-3 gap-4">
                <KpiCard label="ARR" value={`BSD ${(a.arr / 1000).toFixed(0)}K`} delta={`BSD ${(a.mrr / 1000).toFixed(0)}K MRR`} trend="up" icon={Coins} accent />
                <KpiCard label="Pipeline (open)" value={`BSD ${(totalPipe / 1000).toFixed(0)}K`} delta={`${det.pipeline.length} ${tt('opportunities')}`} trend="up" icon={TrendingUp} />
                <KpiCard label="Total AR" value={`BSD ${totalAR}K`} delta={tt('across 5 buckets')} trend="flat" icon={FileText} />
              </div>
            </div>
          )}
        </div>

        {/* === RIGHT RAIL === */}
        <div className="space-y-4 lg:sticky lg:top-4 h-fit">
          {/* Renewal countdown */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Renewal countdown (WAULT)')}</div>
            <div className={`text-2xl font-extrabold ${a.wault < 6 ? 'text-red-600' : a.wault < 12 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {a.wault}m
            </div>
            <div className="text-xs text-vfes-dark/55">{tt('contract ends')} {a.contractEnd}</div>
            <div className="mt-2 h-1.5 bg-black/5 rounded">
              <div className={`h-1.5 rounded ${a.wault < 6 ? 'bg-red-500' : 'bg-vfes-red'}`} style={{ width: `${Math.max(5, Math.min(100, (a.wault / 36) * 100))}%` }} />
            </div>
          </div>

          {/* Account health */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Account health')}</div>
            <div className={`text-2xl font-extrabold ${a.health >= 70 ? 'text-emerald-600' : a.health >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{a.health}<span className="text-sm font-normal text-vfes-dark/55">/100</span></div>
            <div className="text-xs text-vfes-dark/55">NPS {a.nps} · {det.flags.length} {tt('open flags')}</div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Quick actions')}</div>
            <div className="space-y-1.5">
              <button onClick={() => fireAction(`${tt('Renewal save play launched for')} ${tt(a.name)}`)} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-vfes-red/5 hover:bg-vfes-red/10 text-vfes-dark flex items-center justify-between">
                {tt('Launch renewal save play')} <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction(tt('QBR scheduled · exec sponsor invited'))} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="w-3 h-3" />{tt('Schedule QBR')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction(tt('Expansion opportunity created in CRM'))} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" />{tt('Open expansion opp')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction(tt('Exec sponsor escalation requested'))} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><PhoneCall className="w-3 h-3" />{tt('Escalate to exec sponsor')}</span> <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[10px] text-vfes-dark/55 mt-3 flex items-center gap-1"><Lock className="w-3 h-3" />{tt('All actions audited · approvals via PEGA')}</div>
          </div>

          {/* SI prompt */}
          <div className="rounded-xl bg-vfes-red/5 border border-vfes-red/15 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{tt('Ask the data')}</div>
            <div className="text-xs text-vfes-dark/70 italic">"{tt('What is the renewal save plan for')} {tt(a.name)}?"</div>
          </div>
        </div>
      </div>
      </>)}

      {/* \u2500\u2500 SEGMENTS tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'segments' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Named accounts')} value="26" delta="+3 net YTD" trend="up" icon={Building2} accent />
          <KpiCard label={tt('Total portfolio ARR')} value="\u20ac84.0M" delta="+18% YoY" trend="up" icon={Coins} />
          <KpiCard label={tt('Enterprise share')} value="58%" delta={tt('by ARR')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Wholesale share')} value="23%" delta={tt('carrier + infra')} trend="flat" icon={Network} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('ARR by segment (\u20acK)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_SEGS}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="seg" tick={{ fontSize: 9 }} tickFormatter={v => v.split('-')[0]} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}K`} />
                  <Bar dataKey="arr" fill={RED} radius={[4, 4, 0, 0]} name={tt('ARR \u20acK')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Avg ARR per account (\u20acK)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_SEGS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eef0f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="seg" type="category" tick={{ fontSize: 9 }} width={110} tickFormatter={v => v.split('-')[0]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}K`} />
                  <Bar dataKey="avgArr" fill={GREEN} radius={[0, 4, 4, 0]} name={tt('Avg ARR \u20acK')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Segment summary')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Segment')}</th><th>{tt('Accounts')}</th><th>{tt('ARR \u20acK')}</th><th>{tt('Avg ARR \u20acK')}</th><th>{tt('NPS')}</th><th>{tt('Monthly churn')}</th></tr>
            </thead>
            <tbody>
              {PORTF_SEGS.map(s => (
                <tr key={s.seg} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(s.seg)}</td>
                  <td>{s.accounts}</td>
                  <td>\u20ac{s.arr.toLocaleString()}</td>
                  <td>\u20ac{s.avgArr.toLocaleString()}</td>
                  <td className={s.nps >= 30 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{s.nps}</td>
                  <td className={s.churn > 1 ? 'text-vfes-dark font-bold' : 'text-emerald-600'}>{s.churn.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/b2b" className="text-vfes-dark font-semibold hover:underline">{tt('Open B2B Cockpit \u2192')}</Link>
          <Link to="/portal/sales" className="text-vfes-dark font-semibold hover:underline">{tt('Open Sales \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 PIPELINE tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'pipeline' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open pipeline')} value="\u20ac19.9M" delta={tt('4.2\u00d7 coverage')} trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Weighted pipeline')} value="\u20ac9.0M" delta={tt('prob-adjusted')} trend="up" icon={Gauge} />
          <KpiCard label={tt('Q commit')} value="\u20ac8.2M" delta={tt('vs \u20ac8.6M target')} trend="flat" icon={Target} />
          <KpiCard label={tt('Win rate')} value="54%" delta="+6 pts YoY" trend="up" icon={Activity} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Pipeline by stage (\u20acM open vs weighted)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_PIPE}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}M`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="open" fill={GREY} name={tt('Open')} />
                  <Bar dataKey="weighted" fill={RED} name={tt('Weighted')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Whitespace TCV by play (\u20acK)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_WHITESPACE} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eef0f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="play" type="category" tick={{ fontSize: 9 }} width={120} tickFormatter={v => v.split(' ').slice(0, 2).join(' ')} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}K`} />
                  <Bar dataKey="tcv" fill={PURPLE} radius={[0, 4, 4, 0]} name={tt('TCV \u20acK')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Pipeline stage detail')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Stage')}</th><th>{tt('Open \u20acM')}</th><th>{tt('Weighted \u20acM')}</th><th>{tt('Weighted %')}</th></tr>
            </thead>
            <tbody>
              {PORTF_PIPE.map(p => (
                <tr key={p.stage} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(p.stage)}</td>
                  <td>\u20ac{p.open}M</td>
                  <td>\u20ac{p.weighted}M</td>
                  <td className="text-xs text-vfes-dark/55">{((p.weighted / p.open) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/sales" className="text-vfes-dark font-semibold hover:underline">{tt('Sales Cockpit \u2192')}</Link>
          <Link to="/portal/b2b" className="text-vfes-dark font-semibold hover:underline">{tt('B2B Cockpit \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 REVENUE tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'revenue' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Portfolio ARR')} value="\u20ac84.0M" delta="+18% YoY" trend="up" icon={Coins} accent />
          <KpiCard label={tt('Net Revenue Retention')} value="106%" delta="+4 pts" trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Gross Revenue Retention')} value="92%" delta="-1 pt" trend="down" icon={TrendingDown} />
          <KpiCard label={tt('Avg ARR / account')} value="\u20ac3.2M" delta="26 accounts" trend="up" icon={Building2} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('ARR trend (last 6 quarters \u00b7 \u20acM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={PORTF_ARR_TREND}>
                  <CartesianGrid stroke="#eef0f3" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[70, 88]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}M`} />
                  <Area dataKey="arr" stroke={RED} fill={RED} fillOpacity={0.18} strokeWidth={2} name={tt('ARR \u20acM')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Revenue share by segment')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={PORTF_SEGS} dataKey="arr" nameKey="seg" innerRadius={45} outerRadius={95}>
                    {PORTF_SEGS.map((_, i) => <Cell key={i} fill={[RED, RED2, AMBER, BLUE, GREEN][i % 5]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${(Number(v) / 1000).toFixed(0)}K`} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('ARR growth by quarter')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Quarter')}</th><th>{tt('ARR \u20acM')}</th><th>{tt('QoQ growth')}</th></tr>
            </thead>
            <tbody>
              {PORTF_ARR_TREND.map((r, i) => (
                <tr key={r.q} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{r.q}</td>
                  <td>\u20ac{r.arr}M</td>
                  <td className={i === 0 ? 'text-vfes-dark/40 text-xs' : 'text-emerald-600 font-bold'}>
                    {i === 0 ? '\u2014' : `+${((r.arr - PORTF_ARR_TREND[i - 1].arr) / PORTF_ARR_TREND[i - 1].arr * 100).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/finance" className="text-vfes-dark font-semibold hover:underline">{tt('Finance Cockpit \u2192')}</Link>
          <Link to="/portal/bundle-profitability" className="text-vfes-dark font-semibold hover:underline">{tt('Bundle P&L \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 SERVICE / SLA tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'service' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Enterprise SLA (TTM)')} value="99.974%" delta={tt('vs 99.95 target')} trend="up" icon={ShieldCheck} accent />
          <KpiCard label={tt('P1 incidents (TTM)')} value="12" delta="-3 YoY" trend="up" icon={AlertTriangle} />
          <KpiCard label={tt('Service credits paid')} value="\u20ac48K" delta="6mo TTM" trend="down" icon={Coins} />
          <KpiCard label={tt('MTTR avg')} value="47 min" delta="-8 min QoQ" trend="up" icon={Calendar} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SLA uptime (6mo \u00b7 %)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={PORTF_SLA}>
                  <CartesianGrid stroke="#eef0f3" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" domain={[99.9, 100]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine yAxisId="l" y={99.95} stroke={RED} strokeDasharray="3 3" />
                  <Line yAxisId="l" dataKey="uptime" stroke={RED} strokeWidth={2} name={tt('Uptime %')} />
                  <Bar yAxisId="r" dataKey="credits" fill={GREY} name={tt('Credits \u20acK')} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('P1 incidents per month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_SLA}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="p1" fill={AMBER} name={tt('P1 incidents')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('SLA monthly detail')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Month')}</th><th>{tt('Uptime %')}</th><th>{tt('P1 incidents')}</th><th>{tt('Credits \u20acK')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {PORTF_SLA.map(s => (
                <tr key={s.m} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{s.m}</td>
                  <td className={s.uptime >= 99.95 ? 'text-emerald-600 font-bold' : 'text-vfes-dark font-bold'}>{s.uptime.toFixed(3)}%</td>
                  <td>{s.p1}</td>
                  <td>{s.credits > 0 ? `\u20ac${s.credits}K` : '\u2014'}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${s.uptime >= 99.95 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{s.uptime >= 99.95 ? tt('OK') : tt('Breach')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/network" className="text-vfes-dark font-semibold hover:underline">{tt('Network Cockpit \u2192')}</Link>
          <Link to="/portal/b2b" className="text-vfes-dark font-semibold hover:underline">{tt('B2B Cockpit \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 CHURN RISK tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'churn' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('At-risk accounts')} value="5" delta={tt('health < 60')} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('ARR at risk')} value="\u20ac8.4M" delta="10% of portfolio" trend="down" icon={Coins} />
          <KpiCard label={tt('Portfolio avg health')} value="74" delta={tt('out of 100')} trend="up" icon={Heart} />
          <KpiCard label={tt('Save rate (TTM)')} value="78%" delta="+4 pts YoY" trend="up" icon={CheckCircle2} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Health-score distribution (26 accounts)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_CHURN_DIST}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name={tt('Accounts')} radius={[4, 4, 0, 0]}>
                    {PORTF_CHURN_DIST.map((_, i) => <Cell key={i} fill={[GREEN, AMBER, '#f97316', RED][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Monthly churn % by segment')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_SEGS}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="seg" tick={{ fontSize: 9 }} tickFormatter={v => v.split('-')[0]} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
                  <ReferenceLine y={1} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="churn" name={tt('Monthly churn %')} radius={[4, 4, 0, 0]}>
                    {PORTF_SEGS.map((d, i) => <Cell key={i} fill={d.churn > 1 ? RED : d.churn > 0.5 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('High-churn segment summary')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Segment')}</th><th>{tt('Accounts')}</th><th>{tt('Monthly churn %')}</th><th>{tt('NPS')}</th><th>{tt('ARR \u20acK')}</th></tr>
            </thead>
            <tbody>
              {PORTF_SEGS.filter(s => s.churn > 1 || s.nps < 25).map(s => (
                <tr key={s.seg} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(s.seg)}</td>
                  <td>{s.accounts}</td>
                  <td className={s.churn > 1 ? 'text-vfes-dark font-bold' : 'text-amber-600 font-bold'}>{s.churn.toFixed(1)}%</td>
                  <td className={s.nps >= 30 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{s.nps}</td>
                  <td>\u20ac{s.arr.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/churn-retention" className="text-vfes-dark font-semibold hover:underline">{tt('Churn & Retention \u2192')}</Link>
          <Link to="/portal/customer-360" className="text-vfes-dark font-semibold hover:underline">{tt('Customer 360 \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 WHITESPACE tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'whitespace' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total whitespace TCV')} value="\u20ac29.7M" delta="5 plays" trend="up" icon={Sparkles} accent />
          <KpiCard label={tt('Top play')} value="SD-WAN" delta="\u20ac9.2M TCV \u00b7 62%" trend="up" icon={Target} />
          <KpiCard label={tt('Avg win probability')} value="54%" delta={tt('across plays')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Addressable accounts')} value="22" delta={tt('of 26 total')} trend="up" icon={Briefcase} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Whitespace TCV by play (\u20acK)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_WHITESPACE} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eef0f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="play" type="category" tick={{ fontSize: 9 }} width={130} tickFormatter={v => v.split(' ').slice(0, 2).join(' ')} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${v}K`} />
                  <Bar dataKey="tcv" fill={PURPLE} name={tt('TCV \u20acK')} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Win probability by play')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_WHITESPACE}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="play" tick={{ fontSize: 9 }} tickFormatter={v => v.split(' ')[0]} />
                  <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 1]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
                  <ReferenceLine y={0.5} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="prob" name={tt('Win probability')} radius={[4, 4, 0, 0]}>
                    {PORTF_WHITESPACE.map((d, i) => <Cell key={i} fill={d.prob >= 0.6 ? GREEN : d.prob >= 0.4 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Expansion play detail')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Play')}</th><th>{tt('Accounts')}</th><th>{tt('TCV \u20acK')}</th><th>{tt('Win prob')}</th><th>{tt('Expected value \u20acK')}</th></tr>
            </thead>
            <tbody>
              {PORTF_WHITESPACE.map(w => (
                <tr key={w.play} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(w.play)}</td>
                  <td>{w.accounts}</td>
                  <td>\u20ac{w.tcv.toLocaleString()}</td>
                  <td className={w.prob >= 0.6 ? 'text-emerald-600 font-bold' : w.prob >= 0.4 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{(w.prob * 100).toFixed(0)}%</td>
                  <td>\u20ac{Math.round(w.tcv * w.prob).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/product" className="text-vfes-dark font-semibold hover:underline">{tt('Product Cockpit \u2192')}</Link>
          <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('Pricing Simulator \u2192')}</Link>
        </div>
      </>)}

      {/* \u2500\u2500 COHORTS tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {outerTab === 'cohorts' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cohorts tracked')} value="6" delta={tt('last 3 years')} trend="flat" icon={Calendar} accent />
          <KpiCard label={tt('Best retention')} value="100%" delta={tt('2023 Q1 cohort')} trend="up" icon={CheckCircle2} />
          <KpiCard label={tt('Avg retention')} value="91.7%" delta={tt('across cohorts')} trend="up" icon={Heart} />
          <KpiCard label={tt('Latest cohort ARR')} value="\u20ac10.6M" delta="2024 Q3" trend="up" icon={Coins} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cohort retention % (active vs acquired)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_COHORTS}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="cohort" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 110]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
                  <ReferenceLine y={80} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="retPct" name={tt('Retention %')} radius={[4, 4, 0, 0]}>
                    {PORTF_COHORTS.map((d, i) => <Cell key={i} fill={d.retPct >= 90 ? GREEN : d.retPct >= 75 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Cohort ARR retained (\u20acK)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTF_COHORTS}>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="cohort" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `\u20ac${(v / 1000).toFixed(0)}K`} />
                  <Bar dataKey="arrNow" fill={RED} name={tt('ARR now \u20acK')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Cohort detail')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Cohort')}</th><th>{tt('Acquired')}</th><th>{tt('Active now')}</th><th>{tt('ARR \u20acK')}</th><th>{tt('Retention')}</th></tr>
            </thead>
            <tbody>
              {PORTF_COHORTS.map(c => (
                <tr key={c.cohort} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{c.cohort}</td>
                  <td>{c.acquired}</td>
                  <td>{c.activeNow}</td>
                  <td>\u20ac{(c.arrNow / 1000).toFixed(0)}K</td>
                  <td className={c.retPct >= 90 ? 'text-emerald-600 font-bold' : c.retPct >= 75 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{c.retPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-3 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/churn-retention" className="text-vfes-dark font-semibold hover:underline">{tt('Churn & Retention \u2192')}</Link>
          <Link to="/portal/marketing" className="text-vfes-dark font-semibold hover:underline">{tt('Marketing \u2192')}</Link>
        </div>
      </>)}

    </div>
  )
}
