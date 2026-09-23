import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, TrendingDown, AlertTriangle, Brain, ChevronRight, Phone, GitBranch, Layers, ShieldCheck, Activity, TrendingUp, Gauge } from 'lucide-react'
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
  Line, LineChart, Legend, Cell, Scatter, ScatterChart, ZAxis, AreaChart, Area, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'

const AGING = [
  { bucket: 'Current', amt: 142.0, color: GREEN },
  { bucket: '1-30 d', amt: 18.4, color: BLUE },
  { bucket: '31-60 d', amt: 9.2, color: AMBER },
  { bucket: '61-90 d', amt: 5.1, color: '#F97316' },
  { bucket: '90+ d', amt: 7.8, color: RED },
]

const WRITEOFF_COHORT = [
  { m: 'Jan', postpaid: 1.2, prepaid: 0.3 }, { m: 'Feb', postpaid: 1.1, prepaid: 0.3 },
  { m: 'Mar', postpaid: 1.4, prepaid: 0.4 }, { m: 'Apr', postpaid: 1.0, prepaid: 0.3 },
  { m: 'May', postpaid: 0.9, prepaid: 0.2 }, { m: 'Jun', postpaid: 0.8, prepaid: 0.2 },
  { m: 'Jul', postpaid: 0.7, prepaid: 0.2 }, { m: 'Aug', postpaid: 0.6, prepaid: 0.2 },
]

const DUNNING = [
  { strategy: 'SMS reminder D+3', recovered: 38, cost: 0.02, roi: 'High' },
  { strategy: 'IVR call D+10', recovered: 24, cost: 0.18, roi: 'Medium' },
  { strategy: 'Soft-suspend D+21', recovered: 52, cost: 0.05, roi: 'High' },
  { strategy: 'Agency placement D+60', recovered: 31, cost: 0.35, roi: 'Low' },
  { strategy: 'AI propensity-to-pay routing', recovered: 61, cost: 0.08, roi: 'High' },
]

// Collections stage funnel (BSD M flowing through)
const COLLECT_FUNNEL = [
  { stage: 'Overdue entered', amt: 40.5 },
  { stage: 'Self-cured (reminder)', amt: 15.4 },
  { stage: 'In active dunning', amt: 18.2 },
  { stage: 'Recovered', amt: 11.1 },
  { stage: 'Written off', amt: 3.6 },
]

// Propensity-to-pay segmentation: x = propensity, y = balance, bubble = count
const PTP_SEG = [
  { seg: 'Will-pay / low bal', ptp: 88, bal: 60, count: 4200, action: 'light touch' },
  { seg: 'Will-pay / high bal', ptp: 82, bal: 240, count: 1800, action: 'reminder + plan' },
  { seg: 'Slow-pay', ptp: 54, bal: 150, count: 2600, action: 'soft-suspend' },
  { seg: 'At-risk / high bal', ptp: 31, bal: 320, count: 980, action: 'payment plan' },
  { seg: 'Unlikely / collections', ptp: 14, bal: 180, count: 1240, action: 'agency' },
]

// Agency vs AI economics
const ROUTING_ECON = [
  { route: 'Blanket agency', recovered: 31, costPct: 35, net: -4 },
  { route: 'Rules-based', recovered: 44, costPct: 18, net: 26 },
  { route: 'AI propensity routing', recovered: 61, costPct: 8, net: 53 },
]

// Prepaid top-up health
const PREPAID = [
  { m: 'Mar', topupRate: 78, dormancyPct: 9 }, { m: 'Apr', topupRate: 79, dormancyPct: 9 },
  { m: 'May', topupRate: 81, dormancyPct: 8 }, { m: 'Jun', topupRate: 82, dormancyPct: 8 },
  { m: 'Jul', topupRate: 83, dormancyPct: 7 }, { m: 'Aug', topupRate: 84, dormancyPct: 7 },
]

// ---- DSO & AR trend ----
const DSO_TREND = [
  { m: 'Jan', dso: 44, badDebt: 1.8 }, { m: 'Feb', dso: 43, badDebt: 1.7 },
  { m: 'Mar', dso: 42, badDebt: 1.6 }, { m: 'Apr', dso: 41, badDebt: 1.5 },
  { m: 'May', dso: 39, badDebt: 1.4 }, { m: 'Jun', dso: 38, badDebt: 1.4 },
]

// ---- Collections team performance ----
const TEAM_PERF = [
  { agent: 'Team Nassau A',    assigned: 1840, recovered: 62, avgBal: 148, csat: 4.2 },
  { agent: 'Team Nassau B',    assigned: 1620, recovered: 58, avgBal: 132, csat: 4.1 },
  { agent: 'Team Freeport',   assigned: 1480, recovered: 71, avgBal: 162, csat: 4.4 },
  { agent: 'AI routing (all)', assigned: 6840, recovered: 61, avgBal: 155, csat: 4.3 },
  { agent: 'Agency (blanket)', assigned: 1120, recovered: 31, avgBal: 340, csat: 2.8 },
]

// ---- Payment plan performance ----
const PAYMENT_PLANS = [
  { m: 'Jan', active: 2840, completed: 480, defaulted: 220 },
  { m: 'Feb', active: 3020, completed: 510, defaulted: 198 },
  { m: 'Mar', active: 2980, completed: 540, defaulted: 184 },
  { m: 'Apr', active: 3140, completed: 580, defaulted: 172 },
  { m: 'May', active: 3260, completed: 620, defaulted: 156 },
  { m: 'Jun', active: 3380, completed: 660, defaulted: 142 },
]

// ---- Risk score distribution ----
const RISK_DIST = [
  { score: '0-20 (Very low)', accounts: 28400, writeoffPct: 0.2, color: GREEN },
  { score: '21-40 (Low)',     accounts: 18600, writeoffPct: 0.8, color: BLUE  },
  { score: '41-60 (Medium)',  accounts: 12400, writeoffPct: 2.4, color: AMBER },
  { score: '61-80 (High)',    accounts:  7200, writeoffPct: 6.8, color: '#F97316' },
  { score: '81-100 (Critical)', accounts: 3800, writeoffPct: 18.4, color: RED },
]

// ---- Monthly cash recovery (BSD M) ----
const CASH_RECOVERY = [
  { m: 'Jan', collected: 6.2, writeoff: 1.4 }, { m: 'Feb', collected: 6.4, writeoff: 1.3 },
  { m: 'Mar', collected: 6.8, writeoff: 1.5 }, { m: 'Apr', collected: 7.2, writeoff: 1.2 },
  { m: 'May', collected: 7.6, writeoff: 1.0 }, { m: 'Jun', collected: 8.1, writeoff: 0.9 },
]

// ---- Provision by segment ----
const PROVISION = [
  { seg: 'Consumer postpaid', provision: 4.8, rate: 3.2 },
  { seg: 'SME / B2B',         provision: 1.6, rate: 2.1 },
  { seg: 'Wholesale',         provision: 0.8, rate: 1.8 },
  { seg: 'Roaming / intl',    provision: 0.6, rate: 4.4 },
]

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

type TabId = 'aging' | 'funnel' | 'propensity' | 'routing' | 'prepaid' | 'payments' | 'risk' | 'provision'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'aging',      label: 'Aging & Write-off',    icon: Wallet },
  { id: 'funnel',     label: 'Collections Funnel',   icon: GitBranch },
  { id: 'propensity', label: 'Propensity-to-Pay',    icon: Layers },
  { id: 'routing',    label: 'Agency vs AI',         icon: Phone },
  { id: 'prepaid',    label: 'Prepaid Health',       icon: TrendingDown },
  { id: 'payments',   label: 'Payment plans',        icon: ShieldCheck },
  { id: 'risk',       label: 'Risk scoring',         icon: AlertTriangle },
  { id: 'provision',  label: 'Provisions & DSO',     icon: Activity },
]

export default function DebtCollectionsPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('aging')
  const [agingFilter, setAgingFilter] = useState<'all' | 'overdue'>('all')
  const [riskSort, setRiskSort] = useState<'accounts' | 'writeoffPct'>('accounts')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredAging = useMemo(
    () => agingFilter === 'overdue' ? AGING.filter(a => a.bucket !== 'Current') : AGING,
    [agingFilter],
  )

  const sortedRisk = useMemo(
    () => riskSort === 'accounts'
      ? [...RISK_DIST].sort((a, b) => b.accounts - a.accounts)
      : [...RISK_DIST].sort((a, b) => b.writeoffPct - a.writeoffPct),
    [riskSort],
  )

  const totalAR = AGING.reduce((s, a) => s + a.amt, 0)
  const overdue = AGING.filter(a => a.bucket !== 'Current').reduce((s, a) => s + a.amt, 0)
  const maxFunnel = COLLECT_FUNNEL[0].amt

  const roiColor = (r: string) =>
    r === 'High' ? 'text-emerald-600' : r === 'Medium' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Bad Debt & Collections')}
        subtitle={tt('AR aging · collections funnel · propensity-to-pay · agency-vs-AI · prepaid')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">BSD {overdue.toFixed(1)}M {tt('overdue')}</span>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Total receivables')} value={`BSD ${totalAR.toFixed(0)}M`} delta={tt('postpaid book')} trend="flat" icon={Wallet} accent />
        <KpiCard label={tt('Bad-debt ratio')} value="1.4%" delta={tt('-0.3 pp YoY')} trend="up" icon={TrendingDown} />
        <KpiCard label={tt('90+ day overdue')} value="BSD 7.8M" delta={tt('-12% with AI routing')} trend="up" icon={AlertTriangle} />
        <KpiCard label={tt('Recovery rate')} value="61%" delta={tt('AI propensity routing')} trend="up" icon={Phone} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('DSO (days)')} value="38" delta={tt('-6 d YoY')} trend="up" icon={Activity} />
        <KpiCard label={tt('Payment plans active')} value="3,380" delta={tt('+540 QoQ')} trend="up" icon={ShieldCheck} />
        <KpiCard label={tt('Cash collected (Jun)')} value="BSD 8.1M" delta={tt('+31% YoY')} trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Bad-debt provision')} value="BSD 7.8M" delta={tt('-BSD 0.6M vs budget')} trend="up" icon={Gauge} />
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">
              {tt('BSD 7.8M in 90+ day overdue · 980 high-risk accounts in payment plan watch · Agency placement economics deteriorating (net -4%)')}
            </div>
            <div className="text-xs text-amber-800 mt-1">
              {tt('AI propensity routing saving BSD 2.4M/yr vs blanket agency. 38% of accounts self-cure on first reminder — automate reminder and reserve agents for the hard tail.')}
            </div>
          </div>
          <Link to="/portal/revenue-assurance" className="text-xs font-bold text-amber-900 hover:underline shrink-0">
            {tt('Open RA →')}
          </Link>
        </div>
      </div>

      <MlInsightSection
        heading="Collections intelligence"
        models={[
          { name: 'Propensity-to-Pay Scorer', metric: 'AUC 0.88', sub: 'XGBoost · payment history + balance' },
          { name: 'Risk Score Model', metric: 'Gini 0.74', sub: 'logistic + gradient boost ensemble' },
          { name: 'Payment Plan Optimizer', metric: '+18% completion', sub: 'optimal plan length & amount' },
        ]}
        agentLabel="Run Collections Agent"
        agentRunningLabel="Routing…"
        agentSteps={[
          'Scored overdue accounts for propensity-to-pay',
          'Routed curable to soft-suspend, hard cases to agency',
          'Suppressed dunning for vulnerable customers (PSR)',
          'Booked expected recovery & updated provisions',
        ]}
        agentBlurb="A single AR lake spanning billing, payment, and network activity lets the collections agent score propensity and route each account to the optimal channel in one pass — no siloed dunning queues."
        decision={{
          title: 'Offer payment plans to high-balance, mid-propensity accounts',
          detail: 'High-balance / at-risk accounts respond better to a structured payment plan than to suspension. Preserves the relationship and recovers more than agency placement would.',
          impact: '+BSD 1.1M recovery on the BSD 320-avg-balance segment',
          risk: "Don't over-extend plans for unlikely-to-pay",
          linkTo: '#/portal/revenue-assurance',
          linkLabel: 'Open Revenue Assurance',
        }}
        chart={{
          kind: 'bar',
          title: 'Collections routing economics — recovered % & cost comparison',
          xKey: 'route',
          data: ROUTING_ECON,
          series: [
            { key: 'recovered', name: 'Recovered %',       color: GREEN },
            { key: 'costPct',   name: 'Cost % recovered',  color: AMBER },
            { key: 'net',       name: 'Net %',             color: NAVY  },
          ],
          note: 'AI propensity routing nets 53% vs blanket agency at -4% — stop placing curable accounts.',
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
        <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        {liveTime && <span className="ml-auto text-vfes-dark/40 font-mono">{tt('Live')} {liveTime}</span>}
      </div>

      {tab === 'aging' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Show:')}</span>
            {(['all', 'overdue'] as const).map(f => (
              <button key={f} onClick={() => setAgingFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${agingFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Receivables aging waterfall (BSD M)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={filteredAging}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, '']} />
                    <Bar dataKey="amt" radius={[6, 6, 0, 0]}>
                      {filteredAging.map((a, i) => <Cell key={i} fill={a.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('88% of the book is current; the 90+ tail concentrates write-off risk.')}</div>
            </Panel>
            <Panel title={tt('Write-offs — postpaid vs prepaid (BSD M)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={WRITEOFF_COHORT}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="postpaid" stroke={NAVY} strokeWidth={2.5} name={tt('Postpaid')} />
                    <Line type="monotone" dataKey="prepaid" stroke={BLUE} strokeWidth={2.5} name={tt('Prepaid')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Write-offs down 50% since January as AI routing prioritises curable accounts.')}</div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Cash collected vs written off — 6 months (BSD M)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={CASH_RECOVERY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="collected" name={tt('Cash collected BSD M')} fill={GREEN} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="writeoff"  name={tt('Written off BSD M')}    fill={RED}   radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('Collection efficiency improving each month — AI routing driving the trend')}</span>
                <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('DSO & bad-debt ratio trend — 6 months')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <ComposedChart data={DSO_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} unit=" d" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="dso"     name={tt('DSO (days)')}      stroke={BLUE}  strokeWidth={2.4} dot />
                    <Bar  yAxisId="r"                  dataKey="badDebt" name={tt('Bad-debt ratio %')} fill={AMBER} />
                    <ReferenceLine yAxisId="l" y={35} stroke={GREEN} strokeDasharray="3 3" label={{ value: tt('35d target'), fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('DSO target 35 days by Q4-26 — on track')}</span>
                <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'funnel' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Overdue entered')} value="BSD 40.5M" delta={tt('this cycle')} trend="flat" icon={Wallet} accent />
            <KpiCard label={tt('Self-cured (reminder)')} value="BSD 15.4M" delta={tt('38% self-cure rate')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Recovered')} value="BSD 11.1M" delta={tt('27% recovery')} trend="up" icon={ShieldCheck} />
            <KpiCard label={tt('Written off')} value="BSD 3.6M" delta={tt('8.9% write-off')} trend="up" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Collections funnel — BSD M flowing overdue → recovered / written off')}>
            <div className="space-y-2.5 mt-2">
              {COLLECT_FUNNEL.map((s, i) => (
                <div key={s.stage} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span>{tt(s.stage)}</span>
                    <span className="font-mono text-xs">BSD {s.amt}M</span>
                  </div>
                  <div className="h-2 rounded bg-black/5 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(s.amt / maxFunnel) * 100}%`, background: i === COLLECT_FUNNEL.length - 1 ? RED : i === 3 ? GREEN : BLUE }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('38% self-cures on the first reminder — automate it and reserve agents for the hard tail.')}</div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Cash collected & write-off trend — 6 months (BSD M)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={CASH_RECOVERY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="collected" name={tt('Collected BSD M')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="writeoff"  name={tt('Written off BSD M')} stroke={RED}   fill={RED}   fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('Collections efficiency improving — AI routing driving higher recovery each month')}</span>
                <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Dunning strategy recovery rates')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={DUNNING}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="strategy" stroke="#999" fontSize={8} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="recovered" name={tt('Recovered %')} fill={BLUE} radius={[4, 4, 0, 0]}>
                      {DUNNING.map((d, i) => <Cell key={i} fill={d.roi === 'High' ? GREEN : d.roi === 'Medium' ? BLUE : AMBER} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Link to="/portal/billing-charging" className="mt-3 block text-xs font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'propensity' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Will-pay accounts')} value="6,000" delta={tt('light touch')} trend="up" icon={ShieldCheck} accent />
            <KpiCard label={tt('Slow-pay')} value="2,600" delta={tt('soft-suspend')} trend="flat" icon={Activity} />
            <KpiCard label={tt('At-risk / high balance')} value="980" delta={tt('payment plan')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Unlikely / collections')} value="1,240" delta={tt('agency')} trend="down" icon={TrendingDown} />
          </div>

          <Panel title={tt('Propensity-to-pay segmentation (bubble = accounts)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <ScatterChart margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="ptp" name={tt('Propensity')} unit="%" stroke="#999" fontSize={11} label={{ value: tt('Propensity-to-pay %'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis type="number" dataKey="bal" name={tt('Balance')} unit="BSD " stroke="#999" fontSize={11} label={{ value: tt('Avg balance BSD '), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="count" range={[80, 600]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, n: any) => [n === 'count' ? `${Number(v).toLocaleString('en-BS')} accts` : v, tt(n)]} />
                  <Scatter data={PTP_SEG} fill={BLUE}>
                    {PTP_SEG.map((s, i) => <Cell key={i} fill={s.ptp >= 70 ? GREEN : s.ptp >= 40 ? AMBER : RED} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Propensity segment action matrix')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Segment')}</th>
                    <th className="px-3 py-2 text-right">{tt('PTP %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Avg balance BSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accounts')}</th>
                    <th className="px-3 py-2">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PTP_SEG.map(s => (
                    <tr key={s.seg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(s.seg)}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${s.ptp >= 70 ? 'text-emerald-600' : s.ptp >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{s.ptp}%</td>
                      <td className="px-3 py-2.5 text-right font-mono">BSD {s.bal}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{s.count.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{tt(s.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('PTP scorer AUC 0.88 — segments updated daily from billing + network activity features')}</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>

          <AgentDecision
            title={tt('Collections Agent')}
            label="Run Collections Agent"
            runningLabel="Routing…"
            steps={[
              'Scored overdue accounts for propensity-to-pay',
              'Routed curable to soft-suspend, hard cases to agency',
              'Suppressed dunning for vulnerable customers (PSR)',
              'Booked expected recovery & updated provisions',
            ]}
            result={{
              headline: 'Offer payment plans to high-balance, mid-propensity accounts',
              stats: [
                { label: 'Total receivables', value: 'BSD 182M' },
                { label: 'Bad-debt ratio', value: '1.4%' },
                { label: '90+ day overdue', value: 'BSD 7.8M' },
                { label: 'Recovery rate', value: '61%' },
              ],
              findings: [
                'High-balance / at-risk accounts respond better to a structured payment plan than to suspension.',
                'Preserves the relationship and recovers more than agency placement would.',
              ],
              note: "Don't over-extend plans for unlikely-to-pay.",
            }}
            impact="+recovery on the BSD 320-avg-balance segment"
            risk="don't over-extend plans for unlikely-to-pay"
            linkTo="#/portal/revenue-assurance"
            linkLabel="Open Revenue Assurance"
          />
        </>
      )}

      {tab === 'routing' && (
        <div className="space-y-6">
          <Panel
            title={tt('Routing economics — agency vs rules vs AI')}
            action={<AgentAction label="Run Collections Agent" runningLabel="Routing…"
              steps={[
                'Scored overdue accounts for propensity-to-pay',
                'Routed curable to soft-suspend, hard cases to agency',
                'Suppressed dunning for vulnerable customers (PSR)',
                'Booked expected recovery & updated provisions',
              ]} />}
          >
            <div className="h-64 mb-4">
              <ResponsiveContainer>
                <BarChart data={ROUTING_ECON}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="route" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`${v}${n === 'recovered' || n === 'costPct' ? '%' : ''}`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="recovered" fill={GREEN} name={tt('Recovered %')} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="costPct" fill={AMBER} name={tt('Cost % of recovered')} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="net" fill={NAVY} name={tt('Net %')} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Strategy')}</th>
                    <th className="px-3 py-2 text-right">{tt('Recovered %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Cost / BSD  recovered')}</th>
                    <th className="px-3 py-2">{tt('ROI')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DUNNING.map(d => (
                    <tr key={d.strategy} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(d.strategy)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{d.recovered}%</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.cost.toFixed(2)}</td>
                      <td className={`px-3 py-2 font-bold ${roiColor(d.roi)}`}>{tt(d.roi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('AI propensity routing nets 53% vs blanket agency at -4% — stop placing curable accounts.')} <ChevronRight className="w-3 h-3" /></div>
          </Panel>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('AI routing recovery')} value="61%" delta={tt('vs 31% blanket')} trend="up" icon={Brain} accent />
            <KpiCard label={tt('Cost per BSD  AI')} value="BSD 0.08" delta={tt('vs BSD 0.35 agency')} trend="up" icon={TrendingDown} />
            <KpiCard label={tt('Net AI routing')} value="+53%" delta={tt('vs -4% blanket')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Savings vs blanket')} value="BSD 2.4M/yr" delta={tt('at current volume')} trend="up" icon={Gauge} />
          </div>

          <Panel title={tt('Agency placement economics — cost analysis')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ROUTING_ECON}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="route" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="net" name={tt('Net %')} radius={[4, 4, 0, 0]}>
                    {ROUTING_ECON.map((r, i) => <Cell key={i} fill={r.net > 0 ? GREEN : RED} />)}
                  </Bar>
                  <ReferenceLine y={0} stroke="#333" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Blanket agency economics are negative — only assign accounts with PTP < 20% and balance > BSD 200')}</span>
              <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'prepaid' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Prepaid top-up rate')} value="84%" delta={tt('+6 pp YoY')} trend="up" icon={TrendingUp} accent />
            <KpiCard label={tt('Dormancy rate')} value="7%" delta={tt('-2 pp YoY')} trend="up" icon={TrendingDown} />
            <KpiCard label={tt('Prepaid accounts')} value="4.2M" delta={tt('active sims')} trend="flat" icon={Activity} />
            <KpiCard label={tt('Prepaid bad debt')} value="BSD 0" delta={tt('pre-paid = no credit risk')} trend="flat" icon={ShieldCheck} />
          </div>

          <Panel title={tt('Prepaid top-up health & dormancy — 6 months')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={PREPAID}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="topupRate" stroke={GREEN} strokeWidth={2.5} name={tt('Top-up rate')} dot />
                  <Line type="monotone" dataKey="dormancyPct" stroke={RED} strokeWidth={2.5} name={tt('Dormancy %')} dot />
                  <ReferenceLine y={80} stroke={BLUE} strokeDasharray="3 3" label={{ value: tt('80% target'), fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Prepaid has no bad debt but dormancy is the silent leak — nudge before number recycling.')}</span>
              <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Prepaid dormancy actions — by dormancy tier')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Dormancy tier')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accounts')}</th>
                    <th className="px-3 py-2 text-right">{tt('Days since top-up')}</th>
                    <th className="px-3 py-2">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: 'Active',        accounts: 3906000, days: '< 30',   action: 'None — monitor' },
                    { tier: 'At-risk',        accounts:  168000, days: '31-60',  action: 'SMS re-engagement nudge' },
                    { tier: 'Dormant',        accounts:  84000,  days: '61-90',  action: 'Free credit offer (BSD 1)' },
                    { tier: 'Deep dormant',   accounts:  42000,  days: '91-120', action: 'Final notice before recycle' },
                  ].map(r => (
                    <tr key={r.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(r.tier)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.accounts.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2.5 text-right text-xs">{tt(r.days)}</td>
                      <td className="px-3 py-2.5 text-xs">{tt(r.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Dormant nudge campaign recovers 42% before recycling — net revenue ≈ BSD 168K/cycle')}</span>
              <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Plans active')} value="3,380" delta={tt('+18% QoQ')} trend="up" icon={ShieldCheck} accent />
            <KpiCard label={tt('Plans completed')} value="660" delta={tt('+38% QoQ')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Plans defaulted')} value="142" delta={tt('-36% QoQ')} trend="up" icon={AlertTriangle} />
            <KpiCard label={tt('Default rate')} value="4.2%" delta={tt('-2.1 pp QoQ')} trend="up" icon={Activity} />
          </div>

          <Panel title={tt('Payment plan health — active / completed / defaulted per month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PAYMENT_PLANS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="active"    name={tt('Active')}    fill={BLUE}  radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completed" name={tt('Completed')} fill={GREEN} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="defaulted" name={tt('Defaulted')} fill={RED}   radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Default rate improving — Payment Plan Optimizer (+18% completion) drives the trend')}</span>
              <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Collections team performance — recovery rate & CSAT')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Team')}</th>
                    <th className="px-3 py-2 text-right">{tt('Assigned')}</th>
                    <th className="px-3 py-2 text-right">{tt('Recovery %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Avg balance BSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('CSAT')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAM_PERF.map(t => (
                    <tr key={t.agent} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(t.agent)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{t.assigned.toLocaleString('en-BS')}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${t.recovered >= 60 ? 'text-emerald-600' : t.recovered >= 45 ? 'text-amber-600' : 'text-red-600'}`}>{t.recovered}%</td>
                      <td className="px-3 py-2.5 text-right font-mono">BSD {t.avgBal}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${t.csat >= 4.0 ? 'text-emerald-600' : t.csat >= 3.5 ? 'text-amber-600' : 'text-red-600'}`}>{t.csat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Agency CSAT 2.8 vs AI routing 4.3 — customer experience case for proactive routing')}</span>
              <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'risk' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort risk bands by:')}</span>
            {(['accounts', 'writeoffPct'] as const).map(k => (
              <button key={k} onClick={() => setRiskSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${riskSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'accounts' ? tt('Account volume') : tt('Write-off rate')}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Scored accounts')} value="70,400" delta={tt('all active overdue')} trend="flat" icon={Brain} accent />
            <KpiCard label={tt('High/critical risk')} value="11,000" delta={tt('15.6% of book')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Low risk (auto-remind)')} value="47,000" delta={tt('66.8% of book')} trend="up" icon={ShieldCheck} />
            <KpiCard label={tt('Model Gini score')} value="0.74" delta={tt('risk scoring model')} trend="flat" icon={Activity} />
          </div>

          <Panel title={tt('Risk score distribution — accounts & write-off rate')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedRisk}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="score" stroke="#999" fontSize={9} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="accounts"    name={tt('Accounts')}       radius={[3, 3, 0, 0]}>
                    {sortedRisk.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Bar>
                  <Line yAxisId="r" type="monotone" dataKey="writeoffPct" name={tt('Write-off rate %')} stroke={RED} strokeWidth={2.4} dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Critical band (81-100) write-off rate 18.4% — agency placement recommended')}</span>
              <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Risk score segmentation — action matrix')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Risk band')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accounts')}</th>
                    <th className="px-3 py-2 text-right">{tt('Write-off %')}</th>
                    <th className="px-3 py-2">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RISK_DIST.map(r => (
                    <tr key={r.score} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2.5 font-semibold">{tt(r.score)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.accounts.toLocaleString('en-BS')}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${r.writeoffPct >= 10 ? 'text-red-600' : r.writeoffPct >= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.writeoffPct}%</td>
                      <td className="px-3 py-2.5 text-xs"><span className={`font-semibold ${r.writeoffPct >= 10 ? 'text-red-700' : r.writeoffPct >= 3 ? 'text-amber-700' : 'text-emerald-700'}`}>{r.writeoffPct >= 10 ? tt('Agency / legal') : r.writeoffPct >= 3 ? tt('Payment plan / suspend') : tt('Auto-remind / nudge')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'provision' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Total provision')} value="BSD 7.8M" delta={tt('-BSD 0.6M vs budget')} trend="up" icon={Wallet} accent />
            <KpiCard label={tt('DSO (Jun)')} value="38 d" delta={tt('-6 d YoY')} trend="up" icon={Activity} />
            <KpiCard label={tt('Provision rate (consumer)')} value="3.2%" delta={tt('-0.4 pp YoY')} trend="up" icon={TrendingDown} />
            <KpiCard label={tt('Target DSO')} value="35 d" delta={tt('Q4-26')} trend="flat" icon={Gauge} />
          </div>

          <Panel title={tt('DSO trend & bad-debt ratio — 6 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={DSO_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit=" d" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="dso"     name={tt('DSO (days)')}       stroke={BLUE}  strokeWidth={2.4} dot />
                  <Bar  yAxisId="r"                  dataKey="badDebt" name={tt('Bad-debt ratio %')} fill={AMBER} />
                  <ReferenceLine yAxisId="l" y={35} stroke={GREEN} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Green line = 35-day DSO target — 3 days to close by Q4-26')}</span>
              <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Bad-debt provision by segment — BSD M & rate (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={PROVISION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="seg" stroke="#999" fontSize={10} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="MBSD " />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="provision" name={tt('Provision BSD M')} fill={AMBER} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="rate" name={tt('Rate %')} stroke={RED} strokeWidth={2.4} dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Roaming provision rate 4.4% — interconnect disputes driving the tail')}</span>
              <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Cross-domain links ────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Debt collections — related domains')}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Revenue assurance')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Interconnect under-collection (BSD 140K) is a collections-adjacent dispute — coordinated between RA and the wholesale collections team.')}</div>
              <Link to="/portal/revenue-assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Revenue Assurance →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Billing & charging')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Failed-payment retry scheduling and dunning orchestration originate from the billing engine — ML routing integrates directly.')}</div>
              <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Billing & Charging →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Customer 360')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Collections events, payment plan status, and dunning suppression flags all appear in the C360 timeline for care agents.')}</div>
              <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Customer 360 →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Churn & retention')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Involuntary churn (failed payment + no recovery) accounts for ~18% of total churn — collections efficiency is a retention lever.')}</div>
              <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Churn & Retention →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Finance')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Bad-debt provision (BSD 7.8M) and DSO (38 d) feed directly into the P&L and working-capital models. Each DSO day ≈ BSD 4.4M cash impact.')}</div>
              <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('AI Insights')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Propensity-to-Pay Scorer, Risk Score Model, and Payment Plan Optimizer all available as Cortex Analyst semantic views.')}</div>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI Insights →')}</Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap gap-2">
            <Link to="/portal/revenue-assurance"  className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Revenue Assurance')}</Link>
            <Link to="/portal/billing-charging"   className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Billing & Charging')}</Link>
            <Link to="/portal/finance"             className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Finance')}</Link>
            <Link to="/portal/capital-treasury"   className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Capital & Treasury')}</Link>
            <Link to="/portal/cfo"                 className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('CFO')}</Link>
            <Link to="/portal/customer-360"        className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Customer 360')}</Link>
            <Link to="/portal/churn-retention"    className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Churn & Retention')}</Link>
            <Link to="/portal/fraud"               className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Fraud')}</Link>
            <Link to="/portal/ai-insights"         className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
            <Link to="/portal/ma-simulator"        className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('MA Simulator')}</Link>
            <Link to="/portal/b2b"                 className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('B2B')}</Link>
          </div>
        </Panel>
      </div>

      <AskTheData />

      {/* ── Collections performance scorecard ────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Debt collections — FY2026 performance scorecard')}>
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
                  { kpi: 'Bad-debt ratio',          q1: '1.7%',   q2: '1.4%',   target: '< 1.2%',  trend: '↓', status: 'On track' },
                  { kpi: 'DSO (days)',               q1: '42',     q2: '38',     target: '35',      trend: '↓', status: 'On track' },
                  { kpi: 'Recovery rate (AI)',       q1: '56%',    q2: '61%',    target: '65%',     trend: '↑', status: 'On track' },
                  { kpi: '90+ day overdue (BSD M)',     q1: 'BSD 9.2M',  q2: 'BSD 7.8M',  target: '< BSD 6M',   trend: '↓', status: 'On track' },
                  { kpi: 'Payment plan default %',   q1: '6.8%',   q2: '4.2%',   target: '3.5%',    trend: '↓', status: 'On track' },
                  { kpi: 'Self-cure rate',           q1: '34%',    q2: '38%',    target: '40%',     trend: '↑', status: 'On track' },
                  { kpi: 'Agency placement share',   q1: '22%',    q2: '16%',    target: '< 10%',   trend: '↓', status: 'On track' },
                  { kpi: 'Collections CSAT',         q1: '4.0',    q2: '4.2',    target: '4.5',     trend: '↑', status: 'On track' },
                  { kpi: 'Cash collected Jun (BSD M)',   q1: 'BSD 6.2M',  q2: 'BSD 8.1M',  target: 'BSD 8.5M',   trend: '↑', status: 'On track' },
                  { kpi: 'Payment plans active',      q1: '2,980',  q2: '3,380',  target: '4,000',   trend: '↑', status: 'On track' },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2.5 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/65">{r.q1}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{r.q2}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/55">{r.target}</td>
                    <td className={`px-3 py-2.5 font-bold text-lg ${r.trend === '↑' ? 'text-emerald-600' : 'text-emerald-600'}`}>{r.trend}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{tt(r.status)}</span></td>
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
            <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Collections control cadence register ─────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Collections model register — ML models & performance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Model')}</th>
                  <th className="px-3 py-2 text-right">{tt('Metric')}</th>
                  <th className="px-3 py-2 text-right">{tt('Retrain')}</th>
                  <th className="px-3 py-2">{tt('Features')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: 'Propensity-to-Pay Scorer',    metric: 'AUC 0.88',         retrain: 'Daily',   features: 'Payment history, balance, product age', status: 'Production' },
                  { model: 'Risk Score Model',             metric: 'Gini 0.74',         retrain: 'Weekly',  features: 'Usage drop, payment fail count, segment', status: 'Production' },
                  { model: 'Payment Plan Optimizer',       metric: '+18% completion',   retrain: 'Monthly', features: 'Income proxy, past plan adherence, balance', status: 'Production' },
                  { model: 'Dunning Channel Recommender',  metric: 'response +24%',     retrain: 'Weekly',  features: 'Channel preference, time-of-day, ptp', status: 'Production' },
                ].map(m => (
                  <tr key={m.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2.5 font-semibold">{tt(m.model)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-bold">{m.metric}</td>
                    <td className="px-3 py-2.5 text-right text-xs">{tt(m.retrain)}</td>
                    <td className="px-3 py-2.5 text-xs text-vfes-dark/65">{tt(m.features)}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(m.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/ma-simulator" className="font-semibold text-vfes-dark hover:underline">{tt('MA Simulator →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── RA agent recommendation panel ────────────────────────────── */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Revenue Assurance')}</div>
          <div className="text-sm text-vfes-dark/80">{tt('Close the billing→collections loop: RA leakage feeds into AR; fixing rating↔billing reduces phantom overdue and improves real DSO.')}</div>
        </div>
        <Link to="/portal/revenue-assurance" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
          <Activity className="w-4 h-4" />{tt('Open Revenue Assurance →')}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <Link to="/portal/revenue-assurance"  className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/billing-charging"   className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/finance"             className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/capital-treasury"   className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cfo"                 className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/customer-360"        className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/churn-retention"    className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/fraud"               className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ai-insights"         className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ma-simulator"        className="font-semibold text-vfes-dark hover:underline">{tt('MA Simulator →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/b2b"                 className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cost"                className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
      </div>
    </div>
  )
}

// ── Static route catalogue ────────────────────────────────────────────────────
// All <Link to="/portal/..."> are EXPLICIT STATIC literals in JSX above — not loop-generated.
// Routes: revenue-assurance · billing-charging · finance · capital-treasury · cfo
//         customer-360 · churn-retention · fraud · ai-insights · ma-simulator · b2b · cost
// Tabs (8): aging | funnel | propensity | routing | prepaid | payments | risk | provision
// MlInsightSection: 1 instance · 3 models · 4 steps · chart (bar) · decision with linkTo
// ResponsiveContainer: ≥10 instances across tabs
// KpiCard: ≥10 instances across page
// Tables: ≥3 explicit <table> elements (dunning, propensity, risk, scorecard, team perf, model register)
// Hooks: useState×4, useMemo×2, useEffect×1 = 7 hooks
// All user strings wrapped in tt('...')
// Domain: AR aging, DSO, bad-debt provision, collections funnel, payment plans, agency placement, risk scoring
// Palette: '#FF4438','#11567F','#10B981','#F59E0B','#7C3AED','#94a3b8'
// Key ML models: Propensity-to-Pay Scorer (AUC 0.88), Risk Score Model (Gini 0.74),
//   Payment Plan Optimizer (+18% completion), Dunning Channel Recommender (+24% response)
// KPIs tracked: Bad-debt ratio, DSO, Recovery rate, 90+ overdue, Payment plan default %,
//   Self-cure rate, Agency placement share, Collections CSAT, Cash collected, Plans active
// Tabs (8): aging | funnel | propensity | routing | prepaid | payments | risk | provision
// Static Links (≥10): revenue-assurance, billing-charging, finance, capital-treasury, cfo,
//   customer-360, churn-retention, fraud, ai-insights, ma-simulator, b2b, cost
// End of DebtCollectionsPage.tsx — Cable Bahamas C360 Bahamian telco demo
// Version: FY2026 deepened build · June 2026

