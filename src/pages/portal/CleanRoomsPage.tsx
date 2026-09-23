import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Users, Brain, ChevronRight, Lock, TrendingUp, AlertTriangle, Activity, DollarSign, Database, Zap, Globe2 } from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, ComposedChart, Legend, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── Static data ─────────────────────────────────────────────────────────────
const ROOMS = [
  { partner: 'National Retailer', vertical: 'Retail',  use: 'Audience overlap & ad targeting',   runs: 142, analyses: 18, status: 'active',  privBudget: 0.62 },
  { partner: 'Media Network',     vertical: 'Media',   use: 'Campaign attribution',               runs: 88,  analyses: 9,  status: 'active',  privBudget: 0.41 },
  { partner: 'Island Bank (demo)',         vertical: 'Banking', use: 'Propensity co-modelling · CLV',      runs: 34,  analyses: 5,  status: 'review',  privBudget: 0.18 },
  { partner: 'Auto OEM',          vertical: 'Auto',    use: 'Connected-car footprint analysis',   runs: 21,  analyses: 3,  status: 'active',  privBudget: 0.09 },
]

const OVERLAP = [
  { segment: 'Urban 25-34',      telco: 1.84, retailer: 2.1,  overlap: 0.92 },
  { segment: 'Suburban families',telco: 2.4,  retailer: 1.9,  overlap: 1.1  },
  { segment: 'High-value 45+',   telco: 0.96, retailer: 1.2,  overlap: 0.58 },
  { segment: 'Students',         telco: 1.2,  retailer: 0.8,  overlap: 0.41 },
]

const TEMPLATES = [
  { tmpl: 'Audience overlap (count only)',  privacy: 'k-anon ≥ 50',         approved: true,  runs: 142 },
  { tmpl: 'Lift / incrementality',          privacy: 'Diff-privacy ε=1.0',   approved: true,  runs: 88  },
  { tmpl: 'Reach & frequency',             privacy: 'k-anon ≥ 100',         approved: true,  runs: 42  },
  { tmpl: 'Co-modelled propensity',        privacy: 'No row egress',        approved: false, runs: 0   },
]

const DEALS = [
  { deal: 'Retailer co-marketing Q3',    partner: 'National Retailer', value: 'BSD 1.4M', status: 'active',  lift: '+22%', expiry: '2026-09-30' },
  { deal: 'Media attribution bundle',    partner: 'Media Network',     value: 'BSD 0.8M', status: 'active',  lift: '+18%', expiry: '2026-12-31' },
  { deal: 'Bank propensity programme',   partner: 'Island Bank (demo)',         value: 'BSD 1.1M', status: 'review',  lift: '+31%', expiry: '2026-11-30' },
  { deal: 'Auto OEM data exchange',      partner: 'Auto OEM',          value: 'BSD 0.5M', status: 'active',  lift: '+14%', expiry: '2026-06-30' },
  { deal: 'Benchmark B bundle attribution',     partner: 'Benchmark B The Bahamas',       value: 'BSD 0.3M', status: 'active',  lift: '+9%',  expiry: '2026-08-31' },
]

const ACTIVATION_JOBS = [
  { job: 'Retailer overlap → DSP upload',       partner: 'National Retailer', records: '920K', latency: '4 min',  status: 'done'    },
  { job: 'Media reach & freq export',           partner: 'Media Network',     records: '410K', latency: '7 min',  status: 'done'    },
  { job: 'Bank propensity → CRM enrichment',    partner: 'Island Bank (demo)',         records: '180K', latency: '12 min', status: 'running' },
  { job: 'Auto OEM footprint → BI dashboard',  partner: 'Auto OEM',          records: '88K',  latency: '2 min',  status: 'done'    },
  { job: 'Benchmark B attribution → campaign report', partner: 'Benchmark B The Bahamas',       records: '210K', latency: '5 min',  status: 'queued'  },
]

const PRIVACY_EVENTS = [
  { date: '2026-06-28', event: 'k-anon threshold enforced — 2 cells suppressed (< 50)',   room: 'Retailer DCR',  severity: 'info'   },
  { date: '2026-06-27', event: 'ε budget 62% consumed for Q2 — alert at 80%',             room: 'Retailer DCR',  severity: 'watch'  },
  { date: '2026-06-25', event: 'Row egress attempt blocked — co-modelled propensity query',room: 'Island Bank (demo) DCR', severity: 'blocked'},
  { date: '2026-06-20', event: 'Analysis template approved by DPO',                       room: 'Media DCR',     severity: 'info'   },
  { date: '2026-06-18', event: 'Auto-renewal triggered for Retailer clean room contract', room: 'Retailer DCR',  severity: 'info'   },
]

const GOVERNANCE_CHECKS = [
  { check: 'PII row-egress controls',             result: 'Pass',  last: '2026-06-28', owner: 'CDO Office'  },
  { check: 'k-anonymity threshold enforcement',   result: 'Pass',  last: '2026-06-28', owner: 'Privacy Eng' },
  { check: 'Differential privacy budget audit',   result: 'Watch', last: '2026-06-27', owner: 'Privacy Eng' },
  { check: 'Partner contract validity',           result: 'Pass',  last: '2026-06-01', owner: 'Legal'       },
  { check: 'GDPR data residency (EU only)',        result: 'Pass',  last: '2026-06-01', owner: 'DPO'         },
  { check: 'Analysis template approval pipeline', result: 'Pass',  last: '2026-05-31', owner: 'Data Gov'    },
]

const RUNS_TREND = [
  { m: 'Jan', runs: 168, analyses: 22 }, { m: 'Feb', runs: 192, analyses: 26 },
  { m: 'Mar', runs: 218, analyses: 31 }, { m: 'Apr', runs: 244, analyses: 35 },
  { m: 'May', runs: 268, analyses: 38 }, { m: 'Jun', runs: 285, analyses: 42 },
]

const REVENUE_ATTR = [
  { m: 'Jan', rev: 2.8 }, { m: 'Feb', rev: 3.0 }, { m: 'Mar', rev: 3.2 },
  { m: 'Apr', rev: 3.4 }, { m: 'May', rev: 3.6 }, { m: 'Jun', rev: 3.8 },
]

const OVERLAP_TREND = [
  { m: 'Jan', retailer: 0.82, media: 0.38, bank: 0.14 },
  { m: 'Feb', retailer: 0.85, media: 0.40, bank: 0.16 },
  { m: 'Mar', retailer: 0.88, media: 0.42, bank: 0.17 },
  { m: 'Apr', retailer: 0.90, media: 0.44, bank: 0.17 },
  { m: 'May', retailer: 0.92, media: 0.46, bank: 0.18 },
  { m: 'Jun', retailer: 0.92, media: 0.48, bank: 0.18 },
]

const PRIVACY_BUDGET_SERIES = [
  { m: 'Jan', used: 0.22, remaining: 0.78 }, { m: 'Feb', used: 0.28, remaining: 0.72 },
  { m: 'Mar', used: 0.35, remaining: 0.65 }, { m: 'Apr', used: 0.44, remaining: 0.56 },
  { m: 'May', used: 0.55, remaining: 0.45 }, { m: 'Jun', used: 0.62, remaining: 0.38 },
]

const SEGMENT_OVERLAP = [
  { segment: 'Urban 25-34', overlap: 0.92, color: BLUE  },
  { segment: 'Suburban fam',overlap: 1.1,  color: GREEN },
  { segment: 'High-val 45+',overlap: 0.58, color: AMBER },
  { segment: 'Students',    overlap: 0.41, color: PURPLE},
]

const ACTIVATION_PERF = [
  { m: 'Jan', recs: 820, latency: 5.2 }, { m: 'Feb', recs: 950, latency: 4.8 },
  { m: 'Mar', recs: 1100, latency: 4.4 }, { m: 'Apr', recs: 1250, latency: 4.2 },
  { m: 'May', recs: 1560, latency: 4.0 }, { m: 'Jun', recs: 1808, latency: 3.9 },
]

const PARTNER_PERF = [
  { partner: 'Retailer', lift: 22, roi: 3.8, overlap: 0.92 },
  { partner: 'Media',    lift: 18, roi: 2.9, overlap: 0.48 },
  { partner: 'Island Bank (demo)',lift: 31, roi: 4.1, overlap: 0.18 },
  { partner: 'Auto OEM', lift: 14, roi: 2.2, overlap: 0.09 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'collaborations' | 'overlap' | 'privacy' | 'activation' | 'analytics' | 'governance' | 'deals'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',       label: 'Overview'       },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'overlap',        label: 'Overlap'        },
  { id: 'privacy',        label: 'Privacy Budget' },
  { id: 'activation',     label: 'Activation'     },
  { id: 'analytics',      label: 'Analytics'      },
  { id: 'governance',     label: 'Governance'     },
  { id: 'deals',          label: 'Deals'          },
]

export default function CleanRoomsPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('overview')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [partnerFilter, setPartnerFilter] = useState<string>('All')
  const [templateFilter, setTemplateFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [govFilter, setGovFilter] = useState<'all' | 'pass' | 'watch'>('all')
  const [liveTime, setLiveTime] = useState('')
  const [alertDismissed, setAlertDismissed] = useState(false)

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const runOverlap = () => {
    setRunning(true); setStep(0)
    ;[1, 2, 3].forEach((s, i) => setTimeout(() => setStep(s), (i + 1) * 850))
    setTimeout(() => setRunning(false), 3000)
  }

  const filteredRooms = useMemo(
    () => partnerFilter === 'All' ? ROOMS : ROOMS.filter(r => r.vertical === partnerFilter),
    [partnerFilter],
  )

  const filteredTemplates = useMemo(
    () => templateFilter === 'all'
      ? TEMPLATES
      : TEMPLATES.filter(t => templateFilter === 'approved' ? t.approved : !t.approved),
    [templateFilter],
  )

  const filteredGov = useMemo(
    () => govFilter === 'all'
      ? GOVERNANCE_CHECKS
      : GOVERNANCE_CHECKS.filter(g => g.result.toLowerCase() === govFilter),
    [govFilter],
  )

  const totalAnalyses = useMemo(() => RUNS_TREND.reduce((s, r) => s + r.analyses, 0), [])
  const avgLift = useMemo(() => Math.round(PARTNER_PERF.reduce((s, p) => s + p.lift, 0) / PARTNER_PERF.length), [])

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Data Clean Rooms')}
        subtitle={tt('Privacy-safe collaboration · audience overlap · attribution · activation · no PII egress')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">{tt('PII-protected')}</span>
            <Link to="/portal/sharing" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Database className="w-4 h-4" /> {tt('Sharing Overview')}
            </Link>
          </div>
        }
      />

      <MlInsightSection
        heading="Clean room intelligence"
        models={[
          { name: 'Overlap Estimator',     metric: 'MAPE 3.8%', sub: 'segment-level pre-join sizing'  },
          { name: 'Propensity Co-model',   metric: 'AUC 0.91',  sub: 'joint CLV lift prediction'       },
          { name: 'Privacy Budget Planner',metric: 'ε-optimal', sub: 'query allocation optimisation'   },
        ]}
        agentLabel={tt('Run Clean Room Agent')}
        agentRunningLabel={tt('Analysing…')}
        agentSteps={[
          tt('Estimated segment overlap across 4 active partners'),
          tt('Ranked Island Bank (demo) propensity as the highest-lift collaboration'),
          tt('Modelled differential privacy budget allocation for Q3'),
          tt('Generated activation recommendation: Suburban families audience for Retailer DSP'),
        ]}
        agentBlurb={tt('One privacy-safe data layer — all partners see only aggregate counts. The model uses join statistics inside the room to optimise privacy budget spend across analyses.')}
        decision={{
          title: tt('Activate Suburban-families audience (1.1M overlap) for Retailer Q3 co-marketing'),
          detail: tt('The overlap model identifies Suburban-families as the highest joint ROI segment: 1.1M shared subscribers, 22% incremental lift in the last campaign, and only 41% of the differential privacy budget consumed. Island Bank (demo) propensity adds a cross-sell signal that can increase CLV by 31%.'),
          impact: tt('BSD 1.4M co-marketing deal · 22% lift · 1.1M audience'),
          risk: tt('ε budget at 62% for Q2 — keep Q3 query plan below ε=0.4'),
          linkTo: '/portal/clean-rooms',
          linkLabel: tt('Open Clean Rooms'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Audience overlap by segment — telco × retailer (millions)'),
          xKey: 'segment',
          unit: 'M',
          data: OVERLAP,
          series: [{ key: 'overlap', name: 'Overlap M', color: BLUE }],
          note: tt('Suburban-families overlap (1.1M) is the prime co-marketing audience — highest joint ROI.'),
        }}
      />

      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('ε privacy budget 62% consumed — alert at 80% · Island Bank (demo) DCR row-egress attempt blocked · MOBILE_VIKINGS_x_CBL awaiting partner sign-off')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Auto OEM deal expires 2026-06-30 — renewal outstanding.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/clean-rooms" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('View →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('Active clean rooms')}     value="4"     delta={tt('+1 in review')}              trend="up"   icon={ShieldCheck} accent />
        <KpiCard label={tt('Analyses run (30d)')}     value="285"   delta={tt('templated, audited')}        trend="up"   icon={Users}       />
        <KpiCard label={tt('Rows egressed')}           value="0"     delta={tt('count-only outputs')}       trend="flat" icon={Lock}        />
        <KpiCard label={tt('Incremental ad revenue')} value="BSD 3.8M" delta={tt('attributed via clean room')} trend="up"   icon={Brain}       />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Total analyses (YTD)')} value={`${totalAnalyses}`} delta="+42 in Jun"             trend="up"   icon={Activity}     accent />
        <KpiCard label={tt('Avg campaign lift')}    value={`${avgLift}%`}      delta={tt('vs control group')} trend="up"   icon={TrendingUp}  />
        <KpiCard label={tt('Privacy budget used')}  value="62%"                delta={tt('alert at 80%')}     trend="down" icon={Zap}         />
        <KpiCard label={tt('Partners active')}      value="4"                  delta={tt('retail · media · bank · auto')} trend="flat" icon={Globe2} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel
            title={tt('Audience overlap — telco × retailer (millions)')}
            action={
              <button onClick={runOverlap} disabled={running}
                className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1">
                <Brain className="w-3 h-3" /> {running ? tt('Running…') : tt('Run Overlap')}
              </button>
            }
          >
            {running && (
              <div className="mb-3 text-xs space-y-1">
                <div className={step >= 1 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 1 ? '✓' : '○'} {tt('1. Joined hashed identifiers inside clean room')}</div>
                <div className={step >= 2 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 2 ? '✓' : '○'} {tt('2. Applied k-anonymity ≥ 50 threshold')}</div>
                <div className={step >= 3 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 3 ? '✓' : '○'} {tt('3. Returned aggregate counts — no row egress')}</div>
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={OVERLAP}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="segment" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v}M`, '']} />
                  <Bar dataKey="overlap" radius={[6, 6, 0, 0]}>
                    {OVERLAP.map((_, i) => <Cell key={i} fill={i === 1 ? GREEN : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Suburban-families overlap (1.1M) is the prime co-marketing audience — highest joint ROI.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('Analyses run per month — trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={RUNS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="runs"     name={tt('Total runs')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="analyses" name={tt('New analyses')}  stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/clean-rooms" className="font-semibold text-vfes-dark hover:underline">{tt('Clean Rooms detail →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/sharing" className="font-semibold text-vfes-dark hover:underline">{tt('Sharing →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Active collaborations — summary')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Partner')}</th>
                    <th className="text-right">{tt('Runs')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROOMS.map(r => (
                    <tr key={r.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(r.partner)}</td>
                      <td className="text-right font-mono">{r.runs}</td>
                      <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/data-products" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Incremental revenue attributed via clean rooms (BSD M)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={REVENUE_ATTR}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD M" />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="rev" name={tt('Revenue BSD M')} stroke={GREEN} strokeWidth={2.4} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <Link to="/portal/b2b" className="text-xs font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Partner campaign lift vs control (%)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={PARTNER_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="lift" name={tt('Lift %')} radius={[4, 4, 0, 0]}>
                    {PARTNER_PERF.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Approved analysis templates & privacy guardrails')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Template')}</th>
                  <th>{tt('Privacy guardrail')}</th>
                  <th className="text-right">{tt('Runs')}</th>
                  <th>{tt('Approval')}</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATES.map(t => (
                  <tr key={t.tmpl} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5">{tt(t.tmpl)}</td>
                    <td className="font-mono text-xs text-vfes-dark/70">{t.privacy}</td>
                    <td className="text-right font-mono">{t.runs}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.approved ? tt('approved') : tt('pending review')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('Every template enforces aggregation thresholds; raw identifiers never leave the room.')}</div>
        </Panel>
      </>)}

      {/* ══════════════ COLLABORATIONS ════════════════════════════════════════ */}
      {tab === 'collaborations' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active rooms')}   value="4"    delta={tt('retail·media·bank·auto')} trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('In review')}       value="1"    delta={tt('Island Bank (demo) — propensity')} trend="flat" icon={AlertTriangle}/>
          <KpiCard label={tt('Total runs')}      value="285"  delta="+43 MoM"                     trend="up"   icon={Activity}   />
          <KpiCard label={tt('Egress events')}   value="0"    delta={tt('zero row egress ever')}  trend="flat" icon={Lock}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by vertical:')}</span>
          {['All', 'Retail', 'Media', 'Banking', 'Auto'].map(v => (
            <button key={v} onClick={() => setPartnerFilter(v)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${partnerFilter === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(v)}
            </button>
          ))}
        </div>

        <Panel title={tt('Active collaborations — all clean rooms')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Partner')}</th>
                  <th>{tt('Vertical')}</th>
                  <th>{tt('Use case')}</th>
                  <th className="text-right">{tt('Runs')}</th>
                  <th className="text-right">{tt('Analyses')}</th>
                  <th className="text-right">{tt('ε used')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(r => (
                  <tr key={r.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(r.partner)}</td>
                    <td className="text-xs">{tt(r.vertical)}</td>
                    <td className="text-xs text-vfes-dark/70">{tt(r.use)}</td>
                    <td className="text-right font-mono">{r.runs}</td>
                    <td className="text-right font-mono">{r.analyses}</td>
                    <td className={`text-right font-bold ${r.privBudget >= 0.6 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.privBudget}</td>
                    <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor(r.status)}`}>{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/sharing" className="font-semibold text-vfes-dark hover:underline">{tt('Sharing →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/data-products" className="font-semibold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Runs trend per clean room (monthly)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={RUNS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="runs"     name={tt('Total runs')}   stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="analyses" name={tt('New analyses')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Partner lift vs ROI — collaboration effectiveness')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PARTNER_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="lift" name={tt('Lift %')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="roi"  name={tt('ROI x')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ OVERLAP ═══════════════════════════════════════════════ */}
      {tab === 'overlap' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Best segment overlap')}  value="1.1M"  delta={tt('Suburban families')}     trend="up"   icon={Users}       accent />
          <KpiCard label={tt('Total overlap pool')}    value="3.0M"  delta={tt('across 4 partners')}    trend="up"   icon={Activity}   />
          <KpiCard label={tt('Avg overlap rate')}      value="42%"   delta="+3 pp QoQ"                   trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Suppressed cells')}      value="2"     delta={tt('k-anon < 50 threshold')} trend="flat" icon={Lock}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel
            title={tt('Audience overlap by segment — telco × retailer (M)')}
            action={
              <button onClick={runOverlap} disabled={running}
                className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1">
                <Brain className="w-3 h-3" /> {running ? tt('Running…') : tt('Re-run Overlap')}
              </button>
            }
          >
            {running && (
              <div className="mb-3 text-xs space-y-1">
                <div className={step >= 1 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 1 ? '✓' : '○'} {tt('1. Joined hashed identifiers inside clean room')}</div>
                <div className={step >= 2 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 2 ? '✓' : '○'} {tt('2. Applied k-anonymity ≥ 50 threshold')}</div>
                <div className={step >= 3 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 3 ? '✓' : '○'} {tt('3. Returned aggregate counts — no row egress')}</div>
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={OVERLAP}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="segment" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v}M`, '']} />
                  <Bar dataKey="overlap" radius={[6, 6, 0, 0]}>
                    {OVERLAP.map((_, i) => <Cell key={i} fill={i === 1 ? GREEN : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Overlap trend — all partners (M rolling 6-month)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={OVERLAP_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="retailer" name={tt('Retailer')}  stroke={BLUE}   strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="media"    name={tt('Media')}     stroke={GREEN}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="bank"     name={tt('Island Bank (demo)')} stroke={AMBER}  strokeWidth={1.8} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Marketing →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Segment overlap detail — all segments across all partners')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Segment')}</th>
                  <th className="text-right">{tt('Telco (M)')}</th>
                  <th className="text-right">{tt('Retailer (M)')}</th>
                  <th className="text-right">{tt('Overlap (M)')}</th>
                  <th className="text-right">{tt('Overlap rate')}</th>
                </tr>
              </thead>
              <tbody>
                {OVERLAP.map(o => (
                  <tr key={o.segment} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(o.segment)}</td>
                    <td className="text-right font-mono">{o.telco}M</td>
                    <td className="text-right font-mono">{o.retailer}M</td>
                    <td className={`text-right font-bold ${o.overlap >= 1.0 ? 'text-emerald-600' : 'text-vfes-dark'}`}>{o.overlap}M</td>
                    <td className="text-right font-mono text-xs text-vfes-dark/70">
                      {Math.round((o.overlap / Math.min(o.telco, o.retailer)) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/catalog" className="font-semibold text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/company-360" className="font-semibold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ PRIVACY BUDGET ════════════════════════════════════════ */}
      {tab === 'privacy' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('ε budget consumed')}    value="62%"  delta={tt('alert at 80%')}          trend="down" icon={Zap}        accent />
          <KpiCard label={tt('Budget remaining')}     value="38%"  delta={tt('≈ 6 more analyses')}     trend="flat" icon={ShieldCheck}/>
          <KpiCard label={tt('Suppressed cells')}     value="2"    delta={tt('k-anon < 50')}           trend="flat" icon={Lock}       />
          <KpiCard label={tt('Egress attempts blocked')} value="1"  delta={tt('Jun — Island Bank (demo) row query')} trend="flat" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Differential privacy ε budget — consumed vs remaining (Q2)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PRIVACY_BUDGET_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" ε" domain={[0, 1]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="used"      name={tt('ε Used')}      fill={AMBER} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" name={tt('ε Remaining')} fill={GREEN} stackId="a" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Alert', position: 'right', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 80% alert threshold. Q3 budget resets 2026-07-01.')}</div>
          </Panel>

          <Panel title={tt('Privacy events log — blocked queries & alerts')}>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Date')}</th>
                    <th>{tt('Event')}</th>
                    <th>{tt('Severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PRIVACY_EVENTS.map((e, i) => (
                    <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs">{e.date}</td>
                      <td className="text-xs text-vfes-dark/80">{tt(e.event)}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.severity === 'blocked' ? 'bg-red-100 text-red-700' : e.severity === 'watch' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {tt(e.severity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/data-contracts" className="font-semibold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/catalog" className="font-semibold text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Template privacy controls — enforcement status')}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Show:')}</span>
            {(['all', 'approved', 'pending'] as const).map(f => (
              <button key={f} onClick={() => setTemplateFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${templateFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Template')}</th>
                  <th>{tt('Privacy guardrail')}</th>
                  <th className="text-right">{tt('Runs')}</th>
                  <th>{tt('Approval')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(t => (
                  <tr key={t.tmpl} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5">{tt(t.tmpl)}</td>
                    <td className="font-mono text-xs text-vfes-dark/70">{t.privacy}</td>
                    <td className="text-right font-mono">{t.runs}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.approved ? tt('approved') : tt('pending review')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('Every template enforces aggregation thresholds; raw identifiers never leave the room.')}</div>
        </Panel>
      </>)}

      {/* ══════════════ ACTIVATION ════════════════════════════════════════════ */}
      {tab === 'activation' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Activation jobs')}   value="5"     delta={tt('4 done · 1 running')}   trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Records activated')} value="1.81M" delta="+22% MoM"                   trend="up"   icon={Users}      />
          <KpiCard label={tt('Avg job latency')}   value="3.9m"  delta="-1.3m QoQ"                  trend="up"   icon={Zap}        />
          <KpiCard label={tt('DSP upload rate')}   value="100%"  delta={tt('all jobs delivered')}   trend="flat" icon={TrendingUp} />
        </div>

        <Panel title={tt('Activation jobs — status')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Job')}</th>
                  <th>{tt('Partner')}</th>
                  <th className="text-right">{tt('Records')}</th>
                  <th className="text-right">{tt('Latency')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVATION_JOBS.map(a => (
                  <tr key={a.job} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 text-xs font-semibold">{tt(a.job)}</td>
                    <td className="text-xs">{tt(a.partner)}</td>
                    <td className="text-right font-mono">{a.records}</td>
                    <td className="text-right font-mono text-xs">{a.latency}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.status === 'done' ? 'bg-emerald-100 text-emerald-700' : a.status === 'running' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(a.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/sharing" className="font-semibold text-vfes-dark hover:underline">{tt('Sharing →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/marketing" className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Activation volume — records exported monthly (K)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ACTIVATION_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="recs" name={tt('Records (K)')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Activation latency trend — avg minutes per job')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={ACTIVATION_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" domain={[3, 7]} />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="latency" name={tt('Avg latency')} stroke={GREEN} strokeWidth={2.4} dot />
                  <ReferenceLine y={5} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed line = 5 min SLA target. Consistent improvement through Q2.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ ANALYTICS ═════════════════════════════════════════════ */}
      {tab === 'analytics' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total analyses YTD')} value={`${totalAnalyses}`} delta="+42 Jun"            trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Best lift')}           value="31%"               delta={tt('Island Bank (demo)')}    trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Attributed revenue')} value="BSD 3.8M"             delta="+BSD 0.2M MoM"         trend="up"   icon={DollarSign} />
          <KpiCard label={tt('Avg ROI')}             value="3.25x"             delta={tt('vs 2.8x target')}trend="up"  icon={Zap}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Incremental revenue attributed via clean rooms (BSD M/month)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={REVENUE_ATTR}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD M" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="rev" name={tt('Revenue BSD M')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Partner performance — lift & ROI comparison')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={PARTNER_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="lift" name={tt('Lift %')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="roi"  name={tt('ROI x')} stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/marketing" className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/caio" className="font-semibold text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Overlap by segment — comparison table')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Segment')}</th>
                  <th className="text-right">{tt('Overlap (M)')}</th>
                  <th className="text-right">{tt('Lift index')}</th>
                  <th className="text-right">{tt('Revenue index')}</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENT_OVERLAP.map(s => (
                  <tr key={s.segment} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(s.segment)}</td>
                    <td className="text-right font-mono">{s.overlap}M</td>
                    <td className={`text-right font-bold ${s.overlap >= 1.0 ? 'text-emerald-600' : s.overlap >= 0.5 ? 'text-amber-600' : 'text-vfes-dark/60'}`}>
                      {Math.round(s.overlap * 100)}
                    </td>
                    <td className="text-right font-mono text-xs text-vfes-dark/70">
                      {Math.round(s.overlap * 150)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/company-360" className="font-semibold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cdo" className="font-semibold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ GOVERNANCE ════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Governance checks')}  value="6/6"  delta={tt('5 pass · 1 watch')}    trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('PII row egress')}      value="0"    delta={tt('zero since inception')} trend="flat" icon={Lock}       />
          <KpiCard label={tt('GDPR residency')}      value="Pass" delta={tt('all data EU only')}    trend="up"   icon={Globe2}     />
          <KpiCard label={tt('DPO sign-offs')}       value="4/4"  delta={tt('templates approved')}  trend="up"   icon={Users}      />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Show:')}</span>
          {(['all', 'pass', 'watch'] as const).map(f => (
            <button key={f} onClick={() => setGovFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${govFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('Governance checks — clean room policy compliance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Check')}</th>
                  <th>{tt('Result')}</th>
                  <th>{tt('Last run')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredGov.map(g => (
                  <tr key={g.check} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(g.check)}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${g.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(g.result)}
                      </span>
                    </td>
                    <td className="text-xs font-mono text-vfes-dark/70">{g.last}</td>
                    <td className="text-xs text-vfes-dark/70">{tt(g.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/data-contracts" className="font-semibold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cdo" className="font-semibold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Privacy events — blocked queries & compliance alerts')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Date')}</th>
                    <th>{tt('Event')}</th>
                    <th>{tt('Room')}</th>
                    <th>{tt('Severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PRIVACY_EVENTS.map((e, i) => (
                    <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs">{e.date}</td>
                      <td className="text-xs text-vfes-dark/80">{tt(e.event)}</td>
                      <td className="text-xs text-vfes-dark/60">{e.room}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.severity === 'blocked' ? 'bg-red-100 text-red-700' : e.severity === 'watch' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {tt(e.severity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Privacy budget consumption trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PRIVACY_BUDGET_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" ε" domain={[0, 1]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="used"      name={tt('ε Used')}      fill={AMBER} stackId="a" />
                  <Bar dataKey="remaining" name={tt('ε Remaining')} fill={GREEN} stackId="a" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/caio" className="font-semibold text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ DEALS ═════════════════════════════════════════════════ */}
      {tab === 'deals' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active deals')}     value="4"     delta={tt('1 in review')}            trend="up"   icon={DollarSign}  accent />
          <KpiCard label={tt('Total deal value')} value="BSD 4.1M" delta="+BSD 0.5M QoQ"                   trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Avg deal lift')}    value="21%"   delta={tt('incremental attribution')} trend="up"   icon={Activity}  />
          <KpiCard label={tt('Renewals due')}     value="1"     delta={tt('Auto OEM — Jun 30')}       trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Co-marketing & data deals — pipeline')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Deal')}</th>
                  <th>{tt('Partner')}</th>
                  <th className="text-right">{tt('Value')}</th>
                  <th className="text-right">{tt('Lift')}</th>
                  <th>{tt('Expiry')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {DEALS.map(d => (
                  <tr key={d.deal} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(d.deal)}</td>
                    <td className="text-xs">{tt(d.partner)}</td>
                    <td className="text-right font-mono font-bold text-emerald-600">{d.value}</td>
                    <td className="text-right font-bold text-emerald-600">{d.lift}</td>
                    <td className="text-xs font-mono text-vfes-dark/70">{d.expiry}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(d.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/sharing" className="font-semibold text-vfes-dark hover:underline">{tt('Sharing →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/marketing" className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Partner lift comparison — campaign effectiveness (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PARTNER_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="lift" name={tt('Lift %')} radius={[4, 4, 0, 0]}>
                    {PARTNER_PERF.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER][i % 4]} />)}
                  </Bar>
                  <ReferenceLine y={20} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed line = 20% lift target. Island Bank (demo) (31%) and Retailer (22%) both above target.')}</div>
          </Panel>

          <Panel title={tt('Attributed revenue trend (BSD M cumulative)')}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={REVENUE_ATTR}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="BSD M" />
                    <Tooltip contentStyle={TS} />
                    <Line type="monotone" dataKey="rev" name={tt('Revenue BSD M')} stroke={GREEN} strokeWidth={2.4} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/company-360" className="font-semibold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-1">{tt('Snowflake Data Clean Rooms')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('All partner analyses run inside the clean room — no raw PII crosses the boundary. Snowflake Horizon enforces governance on every query.')}
            </div>
          </div>
          <Link to="/portal/clean-rooms" className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-emerald-700 flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4" />{tt('Open Clean Rooms →')}
          </Link>
        </div>
      </>)}

      <AskTheData />
    </div>
  )
}
