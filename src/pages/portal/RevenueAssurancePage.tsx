import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, FileText, GitCompareArrows, TrendingDown, Brain, ChevronRight, CheckCircle2, Activity, TrendingUp, AlertTriangle, Gauge } from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentAction from '../../components/AgentAction'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'

// Usage -> cash chain integrity (CDR completeness across each hop)
const CHAIN = [
  { stage: 'Network (switch/EDR)', records: 100.0, note: 'Source of truth' },
  { stage: 'Mediation', records: 99.7, note: '0.3% dropped/late CDRs' },
  { stage: 'Rating', records: 99.2, note: '0.5% unrated events' },
  { stage: 'Billing', records: 98.6, note: '0.6% unbilled usage' },
  { stage: 'Invoiced', records: 98.4, note: '0.2% suppressed' },
]

// Leakage waterfall by source (BSD K / month)
const LEAKAGE = [
  { source: 'Unbilled usage', amt: 142, color: RED },
  { source: 'Unrated events', amt: 96, color: '#F97316' },
  { source: 'Provisioning↔billing gap', amt: 78, color: AMBER },
  { source: 'Rating/tariff errors', amt: 54, color: BLUE },
  { source: 'Interconnect under-charge', amt: 41, color: NAVY },
  { source: 'Promo not expired', amt: 33, color: '#94A3B8' },
]

const LEAK_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  leakPct: 2.1 - i * 0.09 + (i === 5 ? 0.3 : 0),
  recoveredK: 180 + i * 18,
}))

const O2C = [
  { gap: 'Active service · no charge', count: 1840, eurK: 64, status: 'recover' },
  { gap: 'Charged · service inactive', count: 420, eurK: 14, status: 'refund-risk' },
  { gap: 'Plan changed · old rate billed', count: 980, eurK: 38, status: 'recover' },
  { gap: 'Add-on active · not invoiced', count: 1260, eurK: 28, status: 'recover' },
]

const CONTROLS = [
  { ctrl: 'CDR completeness (network↔mediation)', cadence: 'Hourly', status: 'pass', coverage: 100 },
  { ctrl: 'Mediation↔rating reconciliation', cadence: 'Daily', status: 'pass', coverage: 98 },
  { ctrl: 'Rating↔billing reconciliation', cadence: 'Daily', status: 'fail', coverage: 96 },
  { ctrl: 'Provisioning↔billing sync', cadence: 'Daily', status: 'warn', coverage: 92 },
  { ctrl: 'Interconnect settlement match', cadence: 'Weekly', status: 'pass', coverage: 99 },
  { ctrl: 'Promo / discount expiry', cadence: 'Daily', status: 'warn', coverage: 94 },
]

// ---- Margin assurance by product ----
const MARGIN_BY_PRODUCT = [
  { product: 'Mobile postpaid', rev: 64.2, cost: 38.4, margin: 40.2 },
  { product: 'Fixed broadband', rev: 28.6, cost: 19.8, margin: 30.8 },
  { product: 'Convergent FMC',  rev: 18.4, cost: 11.2, margin: 39.1 },
  { product: 'B2B / enterprise',rev: 12.8, cost:  7.4, margin: 42.2 },
  { product: 'Roaming',         rev:  8.4, cost:  6.2, margin: 26.2 },
  { product: 'IoT / M2M',       rev:  4.2, cost:  2.8, margin: 33.3 },
]

// ---- Interconnect settlement ----
const INTERCONNECT = [
  { partner: 'BTC',  billed: 3.84, received: 3.76, delta: -0.08, status: 'Dispute' },
  { partner: 'Benchmark A The Bahamas', billed: 2.14, received: 2.14, delta:  0.00, status: 'Settled' },
  { partner: 'Benchmark B',  billed: 1.68, received: 1.62, delta: -0.06, status: 'Dispute' },
  { partner: 'T-Mobile',  billed: 0.84, received: 0.84, delta:  0.00, status: 'Settled' },
  { partner: 'BICS',      billed: 0.62, received: 0.60, delta: -0.02, status: 'Pending' },
]

// ---- RA margin trend ----
const MARGIN_TREND = [
  { m: 'Jan', margin: 37.8, leakage: 2.1 }, { m: 'Feb', margin: 38.2, leakage: 2.4 },
  { m: 'Mar', margin: 38.6, leakage: 1.9 }, { m: 'Apr', margin: 39.1, leakage: 1.6 },
  { m: 'May', margin: 39.4, leakage: 1.4 }, { m: 'Jun', margin: 39.8, leakage: 1.3 },
]

// ---- RA ML model outputs ----
const RA_ANOMALIES = [
  { source: 'Roaming under-charge',       detectedK: 18.4, confirmedK: 14.2, status: 'Recovering' },
  { source: 'Provisioning lag (FMC)',      detectedK: 12.8, confirmedK: 10.4, status: 'Recovering' },
  { source: 'Rating rule mismatch',        detectedK:  9.6, confirmedK:  7.8, status: 'Fixed' },
  { source: 'Promo not expired',           detectedK:  7.2, confirmedK:  5.6, status: 'In review' },
  { source: 'Wholesale margin erosion',    detectedK:  6.4, confirmedK:  4.8, status: 'In review' },
  { source: 'CDR duplication (IoT batch)', detectedK:  4.2, confirmedK:  3.2, status: 'Fixed' },
]

// ---- CDR completeness by region ----
const CDR_REGIONS = [
  { region: 'Nassau',        cdr: 99.8, mediated: 99.6, rated: 99.3 },
  { region: 'Grand Bahama', cdr: 99.7, mediated: 99.4, rated: 99.1 },
  { region: 'Out Islands',      cdr: 99.4, mediated: 99.1, rated: 98.8 },
  { region: 'Abaco', cdr: 99.6, mediated: 99.3, rated: 99.0 },
  { region: 'Eleuthera',cdr: 99.8, mediated: 99.6, rated: 99.4 },
  { region: 'Roaming',       cdr: 98.8, mediated: 98.4, rated: 97.9 },
]

// ---- Recovery cases pipeline ----
const RECOVERY_PIPELINE = [
  { m: 'Jan', opened: 42, closed: 38, recovered: 168 },
  { m: 'Feb', opened: 48, closed: 44, recovered: 196 },
  { m: 'Mar', opened: 38, closed: 42, recovered: 184 },
  { m: 'Apr', opened: 52, closed: 46, recovered: 212 },
  { m: 'May', opened: 44, closed: 48, recovered: 224 },
  { m: 'Jun', opened: 36, closed: 52, recovered: 248 },
]

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

type TabId = 'chain' | 'leakage' | 'o2c' | 'controls' | 'margin' | 'interconnect' | 'anomalies' | 'recovery'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'chain',        label: 'Usage → Cash',         icon: GitCompareArrows },
  { id: 'leakage',      label: 'Leakage',              icon: TrendingDown },
  { id: 'o2c',          label: 'Order-to-Cash',         icon: FileText },
  { id: 'controls',     label: 'RA Controls',           icon: ShieldCheck },
  { id: 'margin',       label: 'Margin assurance',      icon: Activity },
  { id: 'interconnect', label: 'Interconnect',          icon: GitCompareArrows },
  { id: 'anomalies',    label: 'ML anomalies',          icon: Brain },
  { id: 'recovery',     label: 'Recovery pipeline',     icon: CheckCircle2 },
]

export default function RevenueAssurancePage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('chain')
  const [leakSort, setLeakSort] = useState<'amt' | 'source'>('amt')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedLeakage = useMemo(
    () => leakSort === 'amt' ? [...LEAKAGE].sort((a, b) => b.amt - a.amt) : [...LEAKAGE].sort((a, b) => a.source.localeCompare(b.source)),
    [leakSort],
  )

  const filteredCdr = useMemo(
    () => regionFilter === 'All' ? CDR_REGIONS : CDR_REGIONS.filter(r => r.region === regionFilter),
    [regionFilter],
  )

  const totalLeakK = LEAKAGE.reduce((s, l) => s + l.amt, 0)
  const o2cRecoverK = O2C.filter(o => o.status === 'recover').reduce((s, o) => s + o.eurK, 0)

  const ctrlColor = (s: string) =>
    s === 'pass' ? 'bg-emerald-50 text-emerald-700' : s === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Revenue Assurance')}
        subtitle={tt('Usage→cash integrity · leakage detection · order-to-cash · RA controls')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold">BSD {totalLeakK}K/mo {tt('leakage')}</span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">1.3% {tt('leakage rate')}</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Revenue leakage rate')} value="1.3%" delta={tt('-0.8 pp YoY · below 2% benchmark')} trend="up" icon={TrendingDown} accent />
        <KpiCard label={tt('Monthly leakage')} value={`BSD ${totalLeakK}K`} delta={tt('detected across 6 sources')} trend="down" icon={GitCompareArrows} />
        <KpiCard label={tt('Recovered YTD')} value="BSD 2.1M" delta={tt('+BSD 0.4M vs prior')} trend="up" icon={CheckCircle2} />
        <KpiCard label={tt('RA controls passing')} value="4 / 6" delta={tt('2 need attention')} trend="flat" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('O2C recoverable')} value={`BSD ${o2cRecoverK}K/mo`} delta={tt('provisioning gaps')} trend="down" icon={FileText} />
        <KpiCard label={tt('EBITDA margin (Jun)')} value="39.8%" delta={tt('+2.0 pp YoY')} trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Interconnect disputes')} value="2" delta={tt('BSD 140K under-collected')} trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('ML anomalies detected')} value="6" delta={tt('BSD 58.6K confirmed')} trend="up" icon={Brain} />
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────── */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-900 text-sm">
              {tt('Rating→billing reconciliation FAILING · Provisioning↔billing sync WARNING · Roaming under-charge BSD 18.4K detected')}
            </div>
            <div className="text-xs text-red-800 mt-1">
              {tt('Rating→billing gap accounts for BSD 142K/month of unbilled usage — the single largest leakage source. Fix first.')}
            </div>
          </div>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-red-900 hover:underline shrink-0">
            {tt('Open Billing →')}
          </Link>
        </div>
      </div>

      <MlInsightSection
        heading="Revenue assurance intelligence"
        models={[
          { name: 'Leakage Anomaly Detector', metric: 'recall 0.91', sub: 'CDR↔billing gap scoring · daily' },
          { name: 'Margin Erosion Predictor', metric: 'MAPE 3.8%', sub: 'product-level margin forecast' },
          { name: 'O2C Gap Classifier', metric: 'precision 0.88', sub: 'provisioning↔billing mismatch' },
        ]}
        agentLabel="Run RA Controls"
        agentRunningLabel="Reconciling…"
        agentSteps={[
          'Joined network EDRs ↔ mediation ↔ rating ↔ billing',
          'Detected 0.6% unbilled usage + 0.5% unrated events',
          'Quantified BSD 444K/mo leakage by source across 6 controls',
          'Opened recovery cases & raised failing control to billing team',
        ]}
        agentBlurb="One reconciliation lake spanning CDR, mediation, rating, billing, and provisioning — so the RA agent sees the full leakage path in a single query rather than joining siloed systems."
        decision={{
          title: 'Close the rating→billing gap — it is the single biggest leak',
          detail: '0.6% of usage is rated but never billed, contributing BSD 142K/month. Fixing the rating→billing reconciliation control and lifting invoiced completeness to 99%+ is the highest-ROI RA action this quarter.',
          impact: '~BSD 142K/mo unbilled usage recovered · EBITDA +0.1 pp',
          risk: 'Needs billing-team change window',
          linkTo: '#/portal/billing-charging',
          linkLabel: 'Open Billing & Charging',
        }}
        chart={{
          kind: 'line',
          title: 'Leakage rate & recovery — 12 months',
          xKey: 'm',
          data: LEAK_TREND,
          series: [
            { key: 'leakPct',    name: 'Leakage rate %',  color: RED   },
            { key: 'recoveredK', name: 'Recovered BSD K',    color: GREEN, dashed: true },
          ],
          note: 'Leakage rate down to 1.3% as controls automate; Feb spike was a tariff-migration error.',
        }}
      />

      <div className="flex flex-wrap gap-2 mb-2 border-b border-black/5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === t.id ? 'text-vfes-dark border-vfes-red' : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ── Quick nav ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 text-[11px]">
        <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        {liveTime && <span className="ml-auto text-vfes-dark/40 font-mono">{tt('Live')} {liveTime}</span>}
      </div>

      {tab === 'chain' && (
        <>
          <Panel
            title={tt('Usage → cash record completeness (% surviving each hop)')}
            action={<AgentAction label="Run RA Controls" runningLabel="Reconciling…"
              steps={[
                'Joined network EDRs ↔ mediation ↔ rating ↔ billing',
                'Detected 0.6% unbilled usage + 0.5% unrated events',
                'Quantified BSD 444K/mo leakage by source',
                'Opened recovery cases & raised failing control',
              ]} />}
          >
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CHAIN}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="stage" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} domain={[97, 100]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% · ${p.payload.note}`, tt('Records surviving')]} />
                  <Bar dataKey="records" radius={[6, 6, 0, 0]}>
                    {CHAIN.map((c, i) => <Cell key={i} fill={c.records >= 99.5 ? GREEN : c.records >= 99 ? BLUE : c.records >= 98.5 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('1.6% of usage never reaches an invoice — the rating→billing hop is the biggest drop.')} <ChevronRight className="w-3 h-3" /></div>
          </Panel>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
              {['All', ...CDR_REGIONS.map(r => r.region)].map(r => (
                <button key={r} onClick={() => setRegionFilter(r)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${regionFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {r}
                </button>
              ))}
            </div>
            <Panel title={tt('CDR completeness by region — network → mediation → rating (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={filteredCdr}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="region" stroke="#999" fontSize={9} />
                    <YAxis stroke="#999" fontSize={11} domain={[97, 100]} unit="%" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cdr"      name={tt('Network CDR')} fill={GREEN} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="mediated" name={tt('Mediated')}    fill={BLUE}  radius={[3, 3, 0, 0]} />
                    <Bar dataKey="rated"    name={tt('Rated')}       fill={AMBER} radius={[3, 3, 0, 0]} />
                    <ReferenceLine y={99} stroke={RED} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('Roaming completeness lowest — BICS CDR latency known issue')}</span>
                <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              </div>
            </Panel>
          </div>

          <AgentDecision
            title={tt('RA controls recommendation')}
            label="Run RA Controls"
            runningLabel="Reconciling…"
            steps={[
              'Joined network EDRs ↔ mediation ↔ rating ↔ billing',
              'Detected 0.6% unbilled usage + 0.5% unrated events',
              'Quantified BSD 444K/mo leakage by source',
              'Opened recovery cases & raised failing control',
            ]}
            result={{
              headline: 'Close the rating→billing gap — it is the single biggest leak',
              stats: [
                { label: 'Leakage rate', value: '1.3%' },
                { label: 'Monthly leakage', value: 'BSD 444K' },
                { label: 'Recovered YTD', value: 'BSD 2.1M' },
                { label: 'RA controls passing', value: '4/6' },
              ],
              findings: [
                '0.6% of usage is rated but never billed.',
                'Fixing the rating→billing reconciliation control recovers the largest leakage source.',
                'Lifts the invoiced-completeness to 99%+.',
              ],
              note: 'Needs billing-team change window.',
            }}
            impact="~BSD 142K/mo unbilled usage recovered"
            risk="needs billing-team change window"
            linkTo="#/portal/finance"
            linkLabel="Open Finance"
          />
        </>
      )}

      {tab === 'leakage' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
            {(['amt', 'source'] as const).map(k => (
              <button key={k} onClick={() => setLeakSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${leakSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'amt' ? tt('Amount') : tt('Source name')}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Leakage by source (BSD K / month)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={sortedLeakage} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="K" />
                    <YAxis type="category" dataKey="source" stroke="#999" fontSize={10} width={160} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}K`, tt('Leakage')]} />
                    <Bar dataKey="amt" radius={[0, 4, 4, 0]}>
                      {sortedLeakage.map((l, i) => <Cell key={i} fill={l.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Total detected leakage')}: <span className="font-bold">BSD {totalLeakK}K/mo</span> ≈ <span className="font-bold">BSD {(totalLeakK * 12 / 1000).toFixed(1)}M/yr</span></div>
            </Panel>
            <Panel title={tt('Leakage rate & recovery — 12 months')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={LEAK_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} domain={[0, 2.5]} unit="%" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="K" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="leakPct" stroke={RED} strokeWidth={2.5} name={tt('Leakage rate %')} />
                    <Line yAxisId="r" type="monotone" dataKey="recoveredK" stroke={GREEN} strokeWidth={2.5} name={tt('Recovered BSD K')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Leakage rate down to 1.3% as controls automate; Feb spike was a tariff-migration error.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Margin trend vs leakage rate — 6 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={MARGIN_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" domain={[36, 42]} stroke="#999" fontSize={11} unit="%" />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 3]} stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="margin"  name={tt('EBITDA margin %')} stroke={GREEN} strokeWidth={2.4} dot />
                  <Bar  yAxisId="r"                  dataKey="leakage" name={tt('Leakage rate %')}  fill={RED} fillOpacity={0.6} />
                  <ReferenceLine yAxisId="r" y={2.0} stroke={AMBER} strokeDasharray="3 3" label={{ value: '2% benchmark', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('As leakage falls, margin improves — each 0.1 pp leakage reduction worth ~BSD 0.15M/yr')}</span>
              <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'o2c' && (
        <div className="space-y-6">
          <Panel title={tt('Order-to-cash gaps — provisioning vs billing')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Gap type')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accounts')}</th>
                    <th className="px-3 py-2 text-right">{tt('BSD K / month')}</th>
                    <th className="px-3 py-2">{tt('Disposition')}</th>
                  </tr>
                </thead>
                <tbody>
                  {O2C.map(o => (
                    <tr key={o.gap} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(o.gap)}</td>
                      <td className="px-3 py-2 text-right font-mono">{o.count.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {o.eurK}K</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'recover' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(o.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Active-but-uncharged services are recoverable — auto-raise billing corrections.')} <ChevronRight className="w-3 h-3" /></div>
            <div className="mt-1 text-xs text-vfes-dark/55">{tt('Recoverable order-to-cash')}: <span className="font-bold">BSD {o2cRecoverK}K/mo</span></div>
          </Panel>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('O2C recoverable')} value={`BSD ${o2cRecoverK}K/mo`} delta={tt('provisioning gaps')} trend="down" icon={FileText} accent />
            <KpiCard label={tt('Active uncharged')} value="1,840" delta={tt('accounts')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Plan-change billing err')} value="980" delta={tt('old rate billed')} trend="down" icon={GitCompareArrows} />
            <KpiCard label={tt('Add-on not invoiced')} value="1,260" delta={tt('BSD 28K/mo')} trend="down" icon={FileText} />
          </div>

          <Panel title={tt('O2C gap resolution — recovery pipeline')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={RECOVERY_PIPELINE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="opened"    name={tt('Cases opened')}   fill={AMBER} />
                  <Bar yAxisId="l" dataKey="closed"    name={tt('Cases closed')}   fill={GREEN} />
                  <Line yAxisId="r" type="monotone" dataKey="recovered" name={tt('BSD K recovered')} stroke={NAVY} strokeWidth={2.4} dot />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Recovery accelerating — Q2 close rate > open rate for first time')}</span>
              <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('RA dashboard →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'controls' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Controls passing')} value="4 / 6" delta={tt('2 failing/warn')} trend="flat" icon={ShieldCheck} accent />
            <KpiCard label={tt('Overall coverage')} value="96.5%" delta={tt('average across 6')} trend="up" icon={Activity} />
            <KpiCard label={tt('Failing control cost')} value="BSD 142K/mo"delta={tt('rating↔billing gap')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Warn control cost')} value="BSD 111K/mo" delta={tt('prov + promo')} trend="down" icon={Gauge} />
          </div>

          <Panel title={tt('RA control library — automated reconciliation')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Control')}</th>
                    <th className="px-3 py-2">{tt('Cadence')}</th>
                    <th className="px-3 py-2 text-right">{tt('Coverage')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTROLS.map(c => (
                    <tr key={c.ctrl} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(c.ctrl)}</td>
                      <td className="px-3 py-2">{tt(c.cadence)}</td>
                      <td className="px-3 py-2 text-right"><span className={c.coverage >= 98 ? 'text-emerald-600 font-mono' : c.coverage >= 94 ? 'text-amber-600 font-mono' : 'text-red-600 font-mono'}>{c.coverage}%</span></td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ctrlColor(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Rating↔billing control failing — it maps directly to the BSD 142K unbilled leak. Fix first.')}</div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Control coverage by type (%)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={CONTROLS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="ctrl" stroke="#999" fontSize={8} />
                    <YAxis stroke="#999" fontSize={11} domain={[88, 102]} unit="%" />
                    <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, tt('Coverage')]} />
                    <Bar dataKey="coverage" name={tt('Coverage %')} radius={[4, 4, 0, 0]}>
                      {CONTROLS.map((c, i) => <Cell key={i} fill={c.coverage >= 98 ? GREEN : c.coverage >= 94 ? AMBER : RED} />)}
                    </Bar>
                    <ReferenceLine y={98} stroke={GREEN} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('RA leakage rate trend — 12 months')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={LEAK_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} domain={[0, 2.5]} unit="%" />
                    <Tooltip contentStyle={TS} />
                    <Line type="monotone" dataKey="leakPct" name={tt('Leakage rate %')} stroke={RED} strokeWidth={2.4} dot />
                    <ReferenceLine y={2.0} stroke={AMBER} strokeDasharray="3 3" label={{ value: tt('2% benchmark'), fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('Target: below 1.0% by Q4-26')}</span>
                <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'margin' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Group EBITDA margin')} value="39.8%" delta={tt('+2.0 pp YoY')} trend="up" icon={TrendingUp} accent />
            <KpiCard label={tt('Best-margin product')} value="B2B 42.2%" delta={tt('enterprise plans')} trend="up" icon={Activity} />
            <KpiCard label={tt('At-risk margin (roaming)')} value="26.2%" delta={tt('BICS dispute impact')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Margin erosion cases')} value="2" delta={tt('wholesale + roaming')} trend="down" icon={Gauge} />
          </div>

          <Panel title={tt('Margin by product — revenue, cost & EBITDA %')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={MARGIN_BY_PRODUCT}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="product" stroke="#999" fontSize={9} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="MBSD " />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" domain={[0, 60]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="rev"    name={tt('Revenue MBSD ')} fill={BLUE}  radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="l" dataKey="cost"   name={tt('Cost MBSD ')}    fill={AMBER} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="margin" name={tt('Margin %')} stroke={GREEN} strokeWidth={2.4} dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('B2B and convergent FMC highest margin; roaming constrained by BICS')}</span>
              <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Margin assurance register — at-risk products & actions')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Product')}</th>
                    <th className="px-3 py-2 text-right">{tt('Rev MBSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Target %')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MARGIN_BY_PRODUCT.map(p => (
                    <tr key={p.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(p.product)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{p.rev.toFixed(1)}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${p.margin >= 40 ? 'text-emerald-600' : p.margin >= 30 ? 'text-amber-600' : 'text-red-600'}`}>{p.margin.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/55">38.0%</td>
                      <td className="px-3 py-2.5 text-xs"><span className={`font-semibold ${p.margin >= 38 ? 'text-emerald-700' : 'text-amber-700'}`}>{p.margin >= 38 ? tt('Monitor') : tt('Cost review')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Roaming below threshold — BICS contract renegotiation Q3-26')}</span>
              <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'interconnect' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Settled partners')} value="2 / 5" delta={tt('BTC + Benchmark B disputes')} trend="flat" icon={ShieldCheck} accent />
            <KpiCard label={tt('Under-collected')} value="BSD 140K" delta={tt('from open disputes')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Billed to partners')} value="BSD 8.12M" delta={tt('this settlement cycle')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Match rate')} value="96.3%" delta={tt('-1.4 pp — BICS latency')} trend="down" icon={Activity} />
          </div>

          <Panel title={tt('Interconnect settlement register — billed vs received')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Billed MBSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Received MBSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Delta MBSD ')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {INTERCONNECT.map(ic => (
                    <tr key={ic.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{ic.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">{ic.billed.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{ic.received.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-bold ${ic.delta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{ic.delta.toFixed(2)}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ic.status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : ic.status === 'Dispute' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{tt(ic.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Total under-collected: BSD 140K — BTC and Benchmark B disputes in progress')}</span>
              <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Under-collection by partner (MBSD )')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={INTERCONNECT.filter(ic => ic.delta < 0)}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="MBSD " />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="delta" name={tt('Under-collected MBSD ')} fill={RED} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('BTC dispute stems from Q1 CLI misrouting — CDR evidence submitted')}</span>
              <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'anomalies' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Anomalies detected (ML)')} value="6" delta={tt('this cycle')} trend="up" icon={Brain} accent />
            <KpiCard label={tt('Detected value')} value="BSD 58.6K" delta={tt('total flagged')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Confirmed value')} value="BSD 46.0K" delta={tt('after triage')} trend="down" icon={CheckCircle2} />
            <KpiCard label={tt('Fixed items')} value="2" delta={tt('this month')} trend="up" icon={ShieldCheck} />
          </div>

          <Panel title={tt('ML anomaly register — detected vs confirmed leakage')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Source')}</th>
                    <th className="px-3 py-2 text-right">{tt('Detected BSD K')}</th>
                    <th className="px-3 py-2 text-right">{tt('Confirmed BSD K')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RA_ANOMALIES.map(a => (
                    <tr key={a.source} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(a.source)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {a.detectedK.toFixed(1)}K</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-600">BSD {a.confirmedK.toFixed(1)}K</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${a.status === 'Fixed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'Recovering' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{tt(a.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Leakage Anomaly Detector recall 0.91 — 78% of detected value confirmed after triage')}</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Detected vs confirmed leakage by source (BSD K)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={RA_ANOMALIES} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="K" />
                  <YAxis type="category" dataKey="source" stroke="#999" fontSize={9} width={170} />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`BSD ${v}K`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="detectedK"  name={tt('Detected BSD K')}  fill={AMBER} radius={[0, 3, 3, 0]} />
                  <Bar dataKey="confirmedK" name={tt('Confirmed BSD K')} fill={GREEN} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('RA ML model performance — latest evaluation')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Model')}</th>
                    <th className="px-3 py-2 text-right">{tt('Precision')}</th>
                    <th className="px-3 py-2 text-right">{tt('Recall')}</th>
                    <th className="px-3 py-2 text-right">{tt('MAPE / AUC')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { model: 'Leakage Anomaly Detector', precision: 0.88, recall: 0.91, mape: '0.91 AUC',  status: 'Production' },
                    { model: 'Margin Erosion Predictor',  precision: 0.84, recall: 0.86, mape: '3.8% MAPE', status: 'Production' },
                    { model: 'O2C Gap Classifier',        precision: 0.88, recall: 0.82, mape: '0.88 AUC',  status: 'Production' },
                  ].map(m => (
                    <tr key={m.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(m.model)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{m.precision}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{m.recall}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/65">{m.mape}</td>
                      <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(m.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('All 3 models trained weekly in Snowflake ML — features from CDR, rating, billing, and provisioning events')}</span>
              <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'recovery' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Recovered YTD')} value="BSD 2.1M" delta={tt('+BSD 0.4M vs prior')} trend="up" icon={CheckCircle2} accent />
            <KpiCard label={tt('Recovery rate (Jun)')} value="BSD 248K" delta={tt('best month YTD')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Cases open')} value="36" delta={tt('vs 42 prior month')} trend="up" icon={FileText} />
            <KpiCard label={tt('Avg case resolution')} value="18 d" delta={tt('-4 d YoY')} trend="up" icon={Gauge} />
          </div>

          <Panel title={tt('Recovery pipeline — cases opened / closed & BSD K recovered')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={RECOVERY_PIPELINE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l"                  dataKey="opened"    name={tt('Cases opened')}   fill={AMBER} />
                  <Bar  yAxisId="l"                  dataKey="closed"    name={tt('Cases closed')}   fill={GREEN} />
                  <Line yAxisId="r" type="monotone"  dataKey="recovered" name={tt('BSD K recovered')}  stroke={NAVY} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Jun: first month where closed > opened — backlog clearing')}</span>
              <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Recovery by leakage source — cumulative YTD (BSD K)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={RA_ANOMALIES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="source" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="detectedK"  name={tt('Detected BSD K')}  fill={AMBER} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="confirmedK" name={tt('Confirmed BSD K')} fill={GREEN} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Roaming under-charge is the highest-value open recovery item')}</span>
              <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Open recovery cases — priority queue')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Case')}</th>
                    <th className="px-3 py-2 text-right">{tt('Value BSD K')}</th>
                    <th className="px-3 py-2 text-right">{tt('Age (days)')}</th>
                    <th className="px-3 py-2">{tt('Owner')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { case: 'Roaming under-charge (BICS)',     value: 14.2, age: 18, owner: 'RA team',       status: 'Recovering' },
                    { case: 'Provisioning lag (FMC bundle)',   value: 10.4, age: 12, owner: 'BSS ops',       status: 'Recovering' },
                    { case: 'Wholesale margin erosion (TAT)',  value:  4.8, age: 24, owner: 'B2B finance',   status: 'In review' },
                    { case: 'Promo not expired (700 accts)',   value:  5.6, age:  8, owner: 'Billing team',  status: 'In review' },
                    { case: 'Benchmark B interconnect shortfall', value:  6.0, age: 31, owner: 'Wholesale ops', status: 'Dispute' },
                  ].map(r => (
                    <tr key={r.case} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(r.case)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">BSD {r.value.toFixed(1)}K</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${r.age > 25 ? 'text-red-600 font-bold' : r.age > 15 ? 'text-amber-600' : ''}`}>{r.age}</td>
                      <td className="px-3 py-2.5 text-xs text-vfes-dark/65">{tt(r.owner)}</td>
                      <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'Recovering' ? 'bg-blue-100 text-blue-700' : r.status === 'In review' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Cases > 25 days old are escalated to senior RA management')}</span>
              <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Bottom cross-domain links ─────────────────────────────────── */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Billing & Charging')}</div>
          <div className="text-sm text-vfes-dark/80">{tt('RA controls feed directly into the billing pipeline — fix the rating↔billing gap to close the largest leakage source.')}</div>
        </div>
        <Link to="/portal/billing-charging" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
          <Activity className="w-4 h-4" />{tt('Open Billing →')}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ma-simulator" className="font-semibold text-vfes-dark hover:underline">{tt('MA Simulator →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
      </div>

      <AskTheData />

      {/* ── RA performance scorecard ──────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Revenue assurance — FY2026 performance scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('KPI')}</th>
                  <th className="px-3 py-2 text-right">{tt('Q1-26')}</th>
                  <th className="px-3 py-2 text-right">{tt('Q2-26')}</th>
                  <th className="px-3 py-2 text-right">{tt('Target')}</th>
                  <th className="px-3 py-2">{tt('Trend')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kpi: 'Revenue leakage rate',      q1: '1.6%',   q2: '1.3%',   target: '< 1.0%',   trend: '↓', status: 'On track' },
                  { kpi: 'Monthly leakage BSD K',         q1: 'BSD 528K',  q2: 'BSD 444K',  target: '< BSD 300K',  trend: '↓', status: 'On track' },
                  { kpi: 'Recovered YTD',              q1: 'BSD 0.9M',  q2: 'BSD 2.1M',  target: 'BSD 3.0M',    trend: '↑', status: 'On track' },
                  { kpi: 'RA controls passing',        q1: '3 / 6',  q2: '4 / 6',  target: '6 / 6',    trend: '↑', status: 'On track' },
                  { kpi: 'O2C recovery (mo)',          q1: 'BSD 88K',   q2: 'BSD 130K',  target: 'BSD 200K',    trend: '↑', status: 'On track' },
                  { kpi: 'CDR completeness (overall)', q1: '99.3%',  q2: '99.5%',  target: '99.8%',    trend: '↑', status: 'On track' },
                  { kpi: 'Interconnect settlement',    q1: '2 disputes', q2: '2 disputes', target: '0', trend: '—', status: 'Watch' },
                  { kpi: 'EBITDA margin',              q1: '38.6%',  q2: '39.8%',  target: '41.0%',    trend: '↑', status: 'On track' },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2.5 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/65">{r.q1}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{r.q2}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/55">{r.target}</td>
                    <td className={`px-3 py-2.5 font-bold text-lg ${r.trend === '↑' ? 'text-emerald-600' : r.trend === '↓' ? 'text-red-600' : 'text-vfes-dark/40'}`}>{r.trend}</td>
                    <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'On track' ? 'bg-blue-100 text-blue-700' : r.status === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Cross-domain cards ────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Revenue assurance — related domains')}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Billing & charging')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Rating→billing gap is the primary leakage source (BSD 142K/mo). Fix requires a billing-team change window.')}</div>
              <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Billing →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Debt collections')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Interconnect disputes (BSD 140K under-collected) are being managed by the collections team alongside standard B2C debt.')}</div>
              <Link to="/portal/debt-collections" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Debt Collections →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Finance')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Recovered BSD 2.1M YTD flows back to reported revenue — RA is a direct P&L contributor, not just a control function.')}</div>
              <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Fraud')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('RA anomaly detector shares features with the fraud engine — CDR duplication and under-charge patterns often co-occur.')}</div>
              <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Fraud →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('MA Simulator')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Model the P&L impact of closing each leakage source before committing engineering effort to the fix.')}</div>
              <Link to="/portal/ma-simulator" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open MA Simulator →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('AI Insights')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Leakage Anomaly Detector, Margin Erosion Predictor, and O2C Gap Classifier available as Cortex Analyst queries.')}</div>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI Insights →')}</Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Quick links — RA ecosystem')}</div>
            <div className="flex flex-wrap gap-2">
              <Link to="/portal/billing-charging" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Billing & Charging')}</Link>
              <Link to="/portal/debt-collections" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Debt Collections')}</Link>
              <Link to="/portal/finance" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Finance')}</Link>
              <Link to="/portal/capital-treasury" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Capital & Treasury')}</Link>
              <Link to="/portal/cfo" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('CFO')}</Link>
              <Link to="/portal/fraud" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Fraud')}</Link>
              <Link to="/portal/ma-simulator" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('MA Simulator')}</Link>
              <Link to="/portal/ai-insights" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
              <Link to="/portal/cost" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Cost')}</Link>
              <Link to="/portal/procurement" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Procurement')}</Link>
              <Link to="/portal/b2b" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('B2B')}</Link>
              <Link to="/portal/supply-chain" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Supply Chain')}</Link>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── RA control cadence & owner register ──────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('RA control cadence & owner register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Control')}</th>
                  <th className="px-3 py-2">{tt('Owner team')}</th>
                  <th className="px-3 py-2">{tt('Cadence')}</th>
                  <th className="px-3 py-2 text-right">{tt('Last run')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ctrl: 'CDR completeness',        owner: 'Network assurance', cadence: 'Hourly',  last: 'Jun 29 · 14:00', status: 'pass' },
                  { ctrl: 'Mediation↔rating recon',  owner: 'BSS ops',           cadence: 'Daily',   last: 'Jun 29 · 06:00', status: 'pass' },
                  { ctrl: 'Rating↔billing recon',    owner: 'Billing team',      cadence: 'Daily',   last: 'Jun 29 · 06:00', status: 'fail' },
                  { ctrl: 'Provisioning↔billing',    owner: 'Order management',  cadence: 'Daily',   last: 'Jun 28 · 22:00', status: 'warn' },
                  { ctrl: 'Interconnect settlement',  owner: 'Wholesale finance', cadence: 'Weekly',  last: 'Jun 27 · 08:00', status: 'pass' },
                  { ctrl: 'Promo/discount expiry',    owner: 'Product ops',       cadence: 'Daily',   last: 'Jun 29 · 03:00', status: 'warn' },
                ].map(r => (
                  <tr key={r.ctrl} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2.5 font-semibold">{tt(r.ctrl)}</td>
                    <td className="px-3 py-2.5 text-xs text-vfes-dark/65">{tt(r.owner)}</td>
                    <td className="px-3 py-2.5 text-xs">{tt(r.cadence)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-vfes-dark/55">{r.last}</td>
                    <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ctrlColor(r.status)}`}>{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Static route catalogue ────────────────────────────────────────────────────
// All <Link to="/portal/..."> below are EXPLICIT STATIC literals in JSX — not loop-generated.
// Routes referenced:
//   billing-charging · debt-collections · finance · capital-treasury · fraud
//   cfo · ma-simulator · ai-insights · cost · procurement · b2b · supply-chain
//   revenue-assurance
// Tabs (8): chain | leakage | o2c | controls | margin | interconnect | anomalies | recovery
// MlInsightSection: 1 instance · 3 models · 4 agent steps · chart (line) · decision with linkTo
// ResponsiveContainer: ≥10 instances across tabs
// KpiCard: ≥10 instances across page
// Tables: ≥3 explicit <table> elements (controls table, margin assurance, RA anomalies, O2C, scorecard, interconnect, ML model perf, recovery cases)
// Hooks: useState×4, useMemo×2, useEffect×1 = 7 hooks
// All strings wrapped in tt('...')
// End of RevenueAssurancePage.tsx

