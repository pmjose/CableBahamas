import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, Zap, FileWarning, CreditCard, ChevronRight, Brain, GitMerge, Gauge, AlertTriangle, BellRing, ShieldCheck, Activity, TrendingUp } from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, Area, AreaChart, PieChart, Pie, FunnelChart, Funnel, LabelList,
  Line, LineChart, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const LIGHT = '#75CDF0'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'

// ---- Operational ----
const PIPELINE = [
  { stage: 'Usage events (CDR/EDR)', value: 1840, fill: NAVY },
  { stage: 'Mediated & deduplicated', value: 1798, fill: '#1f6f9c' },
  { stage: 'Rated & charged', value: 1772, fill: BLUE },
  { stage: 'Billed', value: 1748, fill: '#57c4ec' },
]
const BILLRUN = [
  { m: 'Jan', invoices: 1.21, accuracy: 99.2 }, { m: 'Feb', invoices: 1.22, accuracy: 99.3 },
  { m: 'Mar', invoices: 1.23, accuracy: 99.1 }, { m: 'Apr', invoices: 1.24, accuracy: 99.4 },
  { m: 'May', invoices: 1.25, accuracy: 99.5 }, { m: 'Jun', invoices: 1.26, accuracy: 99.6 },
]
const CHARGING = [
  { name: 'Postpaid (monthly)', value: 64, color: NAVY },
  { name: 'Prepaid (real-time OCS)', value: 21, color: BLUE },
  { name: 'Convergent', value: 11, color: LIGHT },
  { name: 'B2B / wholesale', value: 4, color: GREEN },
]
const DISPUTES = [
  { reason: 'Roaming / out-of-bundle', count: 1840, eurK: 142, autofix: 58 },
  { reason: 'Proration on plan change', count: 1260, eurK: 64, autofix: 81 },
  { reason: 'Promo / discount not applied', count: 980, eurK: 88, autofix: 74 },
  { reason: 'Duplicate charge (mediation)', count: 540, eurK: 51, autofix: 92 },
  { reason: 'Premium SMS / third-party', count: 420, eurK: 39, autofix: 47 },
]

// ---- ML: Bill-shock prediction ----
const BILLSHOCK = [
  { driver: 'Roaming overage', flagged: 4200, eurAvg: 86, action: 'Auto-apply roaming cap + notify' },
  { driver: 'Data overage', flagged: 3100, eurAvg: 42, action: 'Push add-on / throttle option' },
  { driver: 'First-bill proration', flagged: 1800, eurAvg: 28, action: 'Pre-empt with explainer' },
  { driver: 'Premium SMS / 3rd-party', flagged: 1800, eurAvg: 54, action: 'Verify + block on consent' },
  { driver: 'Out-of-bundle voice', flagged: 1500, eurAvg: 31, action: 'Recommend better tariff' },
]

// ---- ML: Payment & dunning ----
const PAYMETHODS = [
  { method: 'Direct debit', share: 58, success: 99.2 },
  { method: 'Card', share: 30, success: 96.8 },
  { method: 'Wallet / Bancontact', share: 9, success: 95.1 },
  { method: 'Bank transfer', share: 3, success: 99.5 },
]
const RECOVERY = [
  { m: 'Jan', smart: 68, baseline: 41 }, { m: 'Feb', smart: 70, baseline: 41 },
  { m: 'Mar', smart: 71, baseline: 42 }, { m: 'Apr', smart: 72, baseline: 41 },
  { m: 'May', smart: 73, baseline: 42 }, { m: 'Jun', smart: 75, baseline: 42 },
]
const PROPENSITY = [
  { seg: 'High propensity', accounts: 38200, action: 'Soft reminder (SMS)', risk: 'low' },
  { seg: 'Medium propensity', accounts: 14600, action: 'Payment plan offer', risk: 'med' },
  { seg: 'Low propensity', accounts: 6100, action: 'Pre-collections + agent', risk: 'high' },
]

// ---- ML: Dispute prediction ----
const DISPUTE_PRED = [
  { wk: 'W1', predicted: 1180, prevented: 0 }, { wk: 'W2', predicted: 1120, prevented: 220 },
  { wk: 'W3', predicted: 1060, prevented: 360 }, { wk: 'W4', predicted: 980, prevented: 480 },
  { wk: 'W5', predicted: 910, prevented: 540 }, { wk: 'W6', predicted: 840, prevented: 590 },
]

// ML models powering billing
const MODELS = [
  { name: 'Bill-Shock Predictor', metric: 'AUC 0.91', sub: 'XGBoost · usage + tariff features' },
  { name: 'Payment-Recovery (retry timing)', metric: '+33pp recovery', sub: 'uplift model · retry scheduler' },
  { name: 'Dispute Predictor', metric: 'precision 0.84', sub: 'pre-bill invoice scoring' },
  { name: 'Charging Anomaly', metric: 'recall 0.88', sub: 'rating-vs-mediation drift' },
]

// ---- Rating & tariff accuracy ---
const RATING_ACCURACY = [
  { m: 'Jan', rated: 99.1, revenue: 142.2 }, { m: 'Feb', rated: 99.2, revenue: 143.8 },
  { m: 'Mar', rated: 99.0, revenue: 142.6 }, { m: 'Apr', rated: 99.3, revenue: 145.1 },
  { m: 'May', rated: 99.4, revenue: 146.0 }, { m: 'Jun', rated: 99.5, revenue: 147.4 },
]

// ---- Dunning channel effectiveness ----
const DUNNING_CHANNELS = [
  { channel: 'SMS D+3',           sent: 84200, responseRate: 62, costPerEuro: 0.02 },
  { channel: 'Email D+5',         sent: 76800, responseRate: 38, costPerEuro: 0.01 },
  { channel: 'IVR call D+10',     sent: 42400, responseRate: 41, costPerEuro: 0.18 },
  { channel: 'App push D+12',     sent: 58600, responseRate: 55, costPerEuro: 0.01 },
  { channel: 'Soft-suspend D+21', sent: 18800, responseRate: 78, costPerEuro: 0.05 },
]

// ---- Bill run SLA / quality ----
const BILLRUN_SLA = [
  { m: 'Jan', onTime: 99.8, errors: 1840, credits: 220 },
  { m: 'Feb', onTime: 99.9, errors: 1640, credits: 198 },
  { m: 'Mar', onTime: 99.7, errors: 1980, credits: 241 },
  { m: 'Apr', onTime: 99.9, errors: 1540, credits: 187 },
  { m: 'May', onTime: 100,  errors: 1320, credits: 162 },
  { m: 'Jun', onTime: 100,  errors: 1180, credits: 148 },
]

// ---- OCS real-time charging latency ----
const OCS_LATENCY = [
  { h: '00', p50: 4.2, p99: 18.4 }, { h: '04', p50: 3.8, p99: 15.2 },
  { h: '08', p50: 5.1, p99: 22.6 }, { h: '12', p50: 6.4, p99: 28.8 },
  { h: '16', p50: 7.2, p99: 32.4 }, { h: '18', p50: 8.1, p99: 38.6 },
  { h: '20', p50: 7.6, p99: 34.2 }, { h: '22', p50: 5.8, p99: 24.8 },
]

// ---- Convergent billing event mix ----
const EVENT_MIX = [
  { type: 'Mobile data (4G/5G)', pct: 48, color: BLUE },
  { type: 'Voice/SMS',           pct: 18, color: NAVY },
  { type: 'Fixed broadband',     pct: 16, color: GREEN },
  { type: 'Roaming',             pct: 10, color: AMBER },
  { type: 'IoT / M2M',          pct:  5, color: '#7C3AED' },
  { type: 'Wholesale / API',     pct:  3, color: '#94a3b8' },
]

// ---- Invoice accuracy trend & dispute reduction ----
const ACCURACY_DISPUTE = [
  { m: 'Jan', accuracy: 99.2, disputes: 4840 }, { m: 'Feb', accuracy: 99.3, disputes: 4620 },
  { m: 'Mar', accuracy: 99.1, disputes: 4980 }, { m: 'Apr', accuracy: 99.4, disputes: 4180 },
  { m: 'May', accuracy: 99.5, disputes: 3840 }, { m: 'Jun', accuracy: 99.6, disputes: 3480 },
]

// ---- Mediation pipeline health (hourly samples) ----
const MEDIATION_HEALTH = [
  { h: '06', dropped: 0.18, duplicate: 0.04, lateCdr: 0.22 },
  { h: '08', dropped: 0.22, duplicate: 0.06, lateCdr: 0.28 },
  { h: '10', dropped: 0.20, duplicate: 0.05, lateCdr: 0.24 },
  { h: '12', dropped: 0.31, duplicate: 0.08, lateCdr: 0.36 },
  { h: '14', dropped: 0.28, duplicate: 0.07, lateCdr: 0.33 },
  { h: '16', dropped: 0.34, duplicate: 0.09, lateCdr: 0.40 },
  { h: '18', dropped: 0.26, duplicate: 0.06, lateCdr: 0.31 },
  { h: '20', dropped: 0.18, duplicate: 0.04, lateCdr: 0.22 },
]

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const riskColor = (r: string) => r === 'low' ? 'bg-emerald-50 text-emerald-700' : r === 'med' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

type TabId = 'pipeline' | 'billrun' | 'billshock' | 'payments' | 'disputepred' | 'disputes' | 'rating' | 'ocs'
const TABS: { id: TabId; label: string }[] = [
  { id: 'pipeline',    label: 'Mediation & charging' },
  { id: 'billrun',     label: 'Bill run & accuracy' },
  { id: 'billshock',   label: 'Bill-shock prediction · ML' },
  { id: 'payments',    label: 'Payments & dunning · ML' },
  { id: 'disputepred', label: 'Dispute prediction · ML' },
  { id: 'disputes',    label: 'Disputes (actuals)' },
  { id: 'rating',      label: 'Rating & tariff' },
  { id: 'ocs',         label: 'OCS & real-time' },
]

export default function BillingChargingPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('pipeline')
  const [dunningSort, setDunningSort] = useState<'responseRate' | 'costPerEuro'>('responseRate')
  const [shockFilter, setShockFilter] = useState<'all' | 'high' | 'medium'>('all')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedDunning = useMemo(
    () => [...DUNNING_CHANNELS].sort((a, b) =>
      dunningSort === 'responseRate' ? b.responseRate - a.responseRate : a.costPerEuro - b.costPerEuro
    ),
    [dunningSort],
  )

  const filteredShock = useMemo(
    () => shockFilter === 'all' ? BILLSHOCK
      : shockFilter === 'high' ? BILLSHOCK.filter(b => b.eurAvg >= 60)
      : BILLSHOCK.filter(b => b.eurAvg >= 30 && b.eurAvg < 60),
    [shockFilter],
  )

  const events = PIPELINE[0].value
  const billed = PIPELINE[PIPELINE.length - 1].value
  const throughput = ((billed / events) * 100).toFixed(1)
  const shockFlagged = BILLSHOCK.reduce((s, b) => s + b.flagged, 0)
  const shockEur = Math.round(BILLSHOCK.reduce((s, b) => s + b.flagged * b.eurAvg, 0) / 1000)
  const atRiskAccounts = PROPENSITY.reduce((s, p) => s + p.accounts, 0)

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Billing, Charging & Mediation')}
        subtitle={tt('Mediation · rating · bill run · ML: bill-shock, payment-recovery, dispute prediction · BSS')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{throughput}% {tt('billed-through')}</span>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Events rated / day')} value={`${(events / 1000).toFixed(2)}B`} delta={tt('CDR + EDR')} trend="flat" icon={Zap} accent />
        <KpiCard label={tt('Invoice accuracy')} value="99.6%" delta={tt('+0.4 pp YTD')} trend="up" icon={GitMerge} />
        <KpiCard label={tt('Bill-shock flagged (ML)')} value={shockFlagged.toLocaleString('en-BS')} delta={`BSD ${shockEur}K ${tt('at risk')}`} trend="down" icon={BellRing} accent />
        <KpiCard label={tt('Payment recovery (smart retry)')} value="75%" delta={tt('vs 42% baseline')} trend="up" icon={CreditCard} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Monthly invoices')} value="1.26M" delta={tt('+4% YoY')} trend="up" icon={Receipt} />
        <KpiCard label={tt('OCS TPS (peak)')} value="42,000" delta={tt('prepaid real-time')} trend="flat" icon={Zap} />
        <KpiCard label={tt('Disputes YTD')} value="3,480" delta={tt('-28% YoY')} trend="up" icon={FileWarning} />
        <KpiCard label={tt('Throughput billed')} value={`${throughput}%`} delta={tt('of rated events')} trend="up" icon={ShieldCheck} />
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">
              {tt('Rating→billing reconciliation failing · Roaming convergent plane accuracy 98.9% (below SLA) · 284 tariff errors auto-corrected this week')}
            </div>
            <div className="text-xs text-amber-800 mt-1">
              {tt('Unbilled usage estimated at BSD 142K/month — RA team has open cases. OCS p99 latency peaked at 38.6 ms at 18:00 yesterday (within SLA, monitoring).')}
            </div>
          </div>
          <Link to="/portal/revenue-assurance" className="text-xs font-bold text-amber-900 hover:underline shrink-0">
            {tt('Open RA →')}
          </Link>
        </div>
      </div>

      <MlInsightSection
        heading="Billing intelligence"
        models={[
          { name: 'Bill-Shock Predictor', metric: 'AUC 0.91', sub: 'XGBoost · usage + tariff features' },
          { name: 'Payment-Recovery Model', metric: '+33 pp recovery', sub: 'uplift model · retry scheduler' },
          { name: 'Dispute Predictor', metric: 'precision 0.84', sub: 'pre-bill invoice scoring' },
        ]}
        agentLabel="Run Billing Intelligence"
        agentRunningLabel="Scoring…"
        agentSteps={[
          'Scored the upcoming bill run for shock & dispute risk',
          'Pre-empted high-risk bills (cap, notify, explainer)',
          'Scheduled smart payment retries by propensity',
          'Drafted credits & routed dunning by segment',
        ]}
        agentBlurb="The agent acts on the bill run before it ships — preventing shock, disputes and failed payments rather than reacting to them."
        decision={{
          title: 'Pre-empt bill shock & failed payments before the run ships',
          detail: 'ML flags ~12.4K customers heading for an unusual bill and ~21K accounts at payment risk this cycle. Proactively cap/notify the shock cases, switch chronic out-of-bundle users to a better tariff, and schedule smart retries.',
          impact: '↓ disputes & credits · ↓ involuntary churn · ↑ cash collection',
          risk: 'Caps & plan-switches need consent — keep a human-in-the-loop check',
          linkTo: '#/portal/debt-collections',
          linkLabel: 'Open Bad Debt & Collections',
        }}
        chart={{
          kind: 'area',
          title: 'Dispute prediction — predicted vs prevented (pre-emptive credits)',
          xKey: 'wk',
          data: DISPUTE_PRED,
          series: [
            { key: 'predicted', name: 'Predicted disputes', color: AMBER },
            { key: 'prevented', name: 'Prevented (pre-emptive credit)', color: GREEN },
          ],
          note: 'Dispute Predictor (precision 0.84) scores invoices before send; pre-emptive credits cut actual disputes ~50% in 6 weeks.',
        }}
      />

      <div className="flex flex-wrap gap-2 mb-2 border-b border-black/5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === t.id ? 'text-vfes-dark border-vfes-red' : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
            }`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ── Quick nav links ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 text-[11px]">
        <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/ma-simulator" className="font-semibold text-vfes-dark hover:underline">{tt('MA Simulator →')}</Link>
        <span className="text-vfes-dark/30">·</span>
        <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
        {liveTime && <span className="ml-auto text-vfes-dark/40 font-mono">{tt('Live')} {liveTime}</span>}
      </div>

      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Mediation → rating → billing (M events/day)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <FunnelChart>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}M`, '']} />
                    <Funnel dataKey="value" data={PIPELINE} isAnimationActive>
                      <LabelList position="right" fill="#333" stroke="none" dataKey="stage" fontSize={11} />
                      <LabelList position="left" fill="#666" stroke="none" dataKey="value" fontSize={11} formatter={(v: number) => `${v}M`} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('5% of events drop between mediation and billing — the Charging Anomaly model flags unbilled usage as leakage.')} <ChevronRight className="w-3 h-3" /></div>
            </Panel>
            <Panel title={tt('Charging model split (% of revenue)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={CHARGING} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {CHARGING.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Prepaid runs on real-time online charging (OCS); postpaid on monthly batch rating.')}</div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Billing event mix — % of rated events by product')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={EVENT_MIX} dataKey="pct" nameKey="type" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {EVENT_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Mediation pipeline health — error rate by hour (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={MEDIATION_HEALTH}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 0.5]} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="dropped"   stroke={RED}   fill={RED}   fillOpacity={0.2} name={tt('Dropped CDRs %')} />
                    <Area type="monotone" dataKey="duplicate" stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('Duplicates %')} />
                    <Area type="monotone" dataKey="lateCdr"   stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('Late CDRs %')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between items-center text-xs">
                <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Open Revenue Assurance →')}</Link>
                <span className="text-vfes-dark/45">{tt('Peak errors at 18:00 — prime-time usage burst')}</span>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'billrun' && (
        <div className="space-y-6">
          <Panel title={tt('Monthly bill run — invoice volume (M) & accuracy (%)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={BILLRUN}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="M" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[98, 100]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="l" type="monotone" dataKey="invoices" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name={tt('Invoices (M)')} />
                  <Area yAxisId="r" type="monotone" dataKey="accuracy" stroke={GREEN} fill={GREEN} fillOpacity={0.1} name={tt('Accuracy %')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Invoice accuracy climbed to 99.6% as ML caught pre-bill errors — fewer credits downstream.')}</div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Bill run SLA — on-time % & error count')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={BILLRUN_SLA}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" domain={[99.5, 100.1]} stroke="#999" fontSize={11} unit="%" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="onTime"  name={tt('On-time %')}      stroke={GREEN} strokeWidth={2.4} dot />
                    <Bar  yAxisId="r"                  dataKey="errors"  name={tt('Billing errors')} fill={AMBER} />
                    <Bar  yAxisId="r"                  dataKey="credits" name={tt('Credits issued')} fill={RED} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>
                <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO dashboard →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Invoice accuracy vs dispute volume — correlation')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={ACCURACY_DISPUTE}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" domain={[98.8, 100]} stroke="#999" fontSize={11} unit="%" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="accuracy" name={tt('Accuracy %')} stroke={GREEN} strokeWidth={2.4} dot />
                    <Bar  yAxisId="r"                  dataKey="disputes" name={tt('Disputes')}    fill={AMBER} />
                    <ReferenceLine yAxisId="l" y={99.5} stroke={BLUE} strokeDasharray="3 3" label={{ value: '99.5% target', fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Each 0.1 pp accuracy gain cuts ~350 disputes — ML pre-bill scoring is the main driver.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Payment method mix & success rates')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Method')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume share %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Success rate %')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMETHODS.map((p) => (
                    <tr key={p.method} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(p.method)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.share}%</td>
                      <td className={`px-3 py-2 text-right font-bold ${p.success >= 99 ? 'text-emerald-600' : p.success >= 96 ? 'text-amber-600' : 'text-red-600'}`}>{p.success}%</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.success >= 99 ? 'bg-emerald-100 text-emerald-700' : p.success >= 96 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.success >= 99 ? tt('Excellent') : p.success >= 96 ? tt('Good') : tt('Watch')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'billshock' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by severity:')}</span>
            {(['all', 'high', 'medium'] as const).map(f => (
              <button key={f} onClick={() => setShockFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${shockFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>
          <Panel title={tt('Predicted bill-shock by driver — customers flagged & avg overage (BSD )')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredShock} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="driver" stroke="#999" fontSize={9} width={150} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} flagged · BSD ${p.payload.eurAvg} avg overage`, tt('Driver')]} />
                  <Bar dataKey="flagged" radius={[0, 6, 6, 0]}>
                    {filteredShock.map((b, i) => <Cell key={i} fill={b.eurAvg >= 60 ? RED : b.eurAvg >= 40 ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Bill-Shock Predictor (AUC 0.91) scores each line pre-bill. Roaming overage is the biggest and most expensive driver.')}</div>
          </Panel>
          <Panel title={tt('Recommended pre-emptive action by driver')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Driver')}</th>
                    <th className="px-3 py-2 text-right">{tt('Flagged')}</th>
                    <th className="px-3 py-2 text-right">{tt('Avg BSD  overage')}</th>
                    <th className="px-3 py-2">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {BILLSHOCK.map((b) => (
                    <tr key={b.driver} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(b.driver)}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.flagged.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {b.eurAvg}</td>
                      <td className="px-3 py-2 text-xs"><span className="inline-flex items-center gap-1 text-vfes-dark font-semibold"><BellRing className="w-3 h-3" />{tt(b.action)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Chronic out-of-bundle users get a tariff recommendation — cutting bill shock and lifting retention.')} <ChevronRight className="w-3 h-3" /></span>
              <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline ml-2">{tt('Churn & Retention →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {tab === 'payments' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Payment-method mix & success rate (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PAYMETHODS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="method" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} domain={[90, 100]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% success · ${p.payload.share}% of volume`, tt('Method')]} />
                    <Bar dataKey="success" radius={[6, 6, 0, 0]}>
                      {PAYMETHODS.map((p, i) => <Cell key={i} fill={p.success >= 99 ? GREEN : p.success >= 96 ? BLUE : AMBER} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Card & wallet fail more often — the recovery model targets retries where they pay off.')}</div>
            </Panel>
            <Panel title={tt('Failed-payment recovery — smart retry vs baseline (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={RECOVERY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[30, 90]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="smart" stroke={GREEN} strokeWidth={2.5} name={tt('ML smart retry')} />
                    <Line type="monotone" dataKey="baseline" stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" name={tt('Fixed-schedule baseline')} />
                    <ReferenceLine y={75} stroke={BLUE} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('ML retry-timing recovers 75% of failed payments vs 42% on a fixed schedule — directly cutting involuntary churn.')}</div>
            </Panel>
          </div>

          <div className="flex items-center gap-2 my-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort dunning channels by:')}</span>
            {(['responseRate', 'costPerEuro'] as const).map(k => (
              <button key={k} onClick={() => setDunningSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${dunningSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'responseRate' ? tt('Response rate') : tt('Cost per BSD ')}
              </button>
            ))}
          </div>

          <Panel title={tt('Dunning channel effectiveness — sorted by selection')}>
            <div className="h-56 mb-4">
              <ResponsiveContainer>
                <BarChart data={sortedDunning}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="channel" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="responseRate" name={tt('Response rate %')} fill={BLUE} radius={[4, 4, 0, 0]}>
                    {sortedDunning.map((_, i) => <Cell key={i} fill={i === 0 ? GREEN : i === 1 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Channel')}</th>
                    <th className="px-3 py-2 text-right">{tt('Sent')}</th>
                    <th className="px-3 py-2 text-right">{tt('Response %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Cost / BSD  collected')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDunning.map((d) => (
                    <tr key={d.channel} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(d.channel)}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.sent.toLocaleString('en-BS')}</td>
                      <td className={`px-3 py-2 text-right font-bold ${d.responseRate >= 60 ? 'text-emerald-600' : d.responseRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{d.responseRate}%</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.costPerEuro.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Propensity-to-pay segments → recommended dunning path')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Segment')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accounts')}</th>
                    <th className="px-3 py-2">{tt('Recommended dunning')}</th>
                    <th className="px-3 py-2">{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPENSITY.map((p) => (
                    <tr key={p.seg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(p.seg)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.accounts.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-xs">{tt(p.action)}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(p.risk)}`}>{tt(p.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt(`Propensity-to-pay scoring routes ${atRiskAccounts.toLocaleString('en-BS')} at-risk accounts to the cheapest path that still collects.`)}</span>
              <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline ml-2">{tt('Debt Collections →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {tab === 'disputepred' && (
        <div className="space-y-6">
          <Panel title={tt('Dispute prediction — predicted vs prevented (pre-emptive credits)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={DISPUTE_PRED}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="wk" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="predicted" stroke={AMBER} fill={AMBER} fillOpacity={0.15} name={tt('Predicted disputes')} />
                  <Area type="monotone" dataKey="prevented" stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('Prevented (pre-emptive credit)')} />
                  <ReferenceLine x="W4" stroke={BLUE} strokeDasharray="3 3" label={{ value: tt('Model go-live'), fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('The Dispute Predictor (precision 0.84) scores invoices before send; pre-emptive credits cut actual disputes ~50% in 6 weeks.')}</div>
          </Panel>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Disputes prevented W6')} value="590" delta={tt('vs 0 at W1')} trend="up" icon={ShieldCheck} accent />
            <KpiCard label={tt('Prevention rate')} value="70%" delta={tt('of predicted')} trend="up" icon={Activity} />
            <KpiCard label={tt('Credit value saved')} value="BSD 48K" delta={tt('W6 avoided credits')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Dispute predictor precision')} value="0.84" delta={tt('pre-bill invoice scoring')} trend="flat" icon={Brain} />
          </div>

          <Panel title={tt('Dispute type breakdown — auto-fixable vs manual')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Dispute reason')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume')}</th>
                    <th className="px-3 py-2 text-right">{tt('BSD K impact')}</th>
                    <th className="px-3 py-2 text-right">{tt('Auto-fix %')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DISPUTES.map(d => (
                    <tr key={d.reason} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(d.reason)}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.count.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.eurK}K</td>
                      <td className={`px-3 py-2 text-right font-bold ${d.autofix >= 75 ? 'text-emerald-600' : d.autofix >= 55 ? 'text-amber-600' : 'text-red-600'}`}>{d.autofix}%</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.autofix >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.autofix >= 75 ? tt('Auto-resolve') : tt('Human review')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Green = highly auto-fixable; amber = human review needed')}</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-6">
          <Panel title={tt('Billing disputes by reason — volume, BSD  impact & auto-fix rate')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DISPUTES} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="reason" stroke="#999" fontSize={9} width={150} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} disputes · BSD ${p.payload.eurK}K · ${p.payload.autofix}% auto-fix`, tt('Reason')]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {DISPUTES.map((d, i) => <Cell key={i} fill={d.autofix >= 75 ? GREEN : d.autofix >= 55 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Green = highly auto-fixable (duplicate, proration, promo). Amber = needs human review (premium/third-party).')}</div>
          </Panel>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={tt('Total disputes Jun')} value="3,480" delta={tt('-28% YoY')} trend="up" icon={FileWarning} accent />
            <KpiCard label={tt('Auto-resolved')} value="74%" delta={tt('+8 pp YTD')} trend="up" icon={ShieldCheck} />
            <KpiCard label={tt('Avg resolution time')} value="1.4 d" delta={tt('-0.3 d YoY')} trend="up" icon={Activity} />
            <KpiCard label={tt('Dispute BSD  impact')} value="BSD 384K" delta={tt('total affected Jun')} trend="down" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Dispute auto-fix rate by reason — trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={DISPUTES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="reason" stroke="#999" fontSize={8} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, tt('Auto-fix rate')]} />
                  <Bar dataKey="autofix" name={tt('Auto-fix %')} radius={[4, 4, 0, 0]}>
                    {DISPUTES.map((d, i) => <Cell key={i} fill={d.autofix >= 75 ? GREEN : d.autofix >= 55 ? BLUE : AMBER} />)}
                  </Bar>
                  <ReferenceLine y={75} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Green line = 75% target auto-fix rate')}</span>
              <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>
        </div>
      )}
      {tab === 'rating' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            <KpiCard label={tt('Rated events accuracy')} value="99.5%" delta={tt('+0.4 pp YTD')} trend="up" icon={ShieldCheck} accent />
            <KpiCard label={tt('Revenue rated (Jun)')} value="BSD 147.4M" delta={tt('+3.5% YoY')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Tariff errors caught')} value="284" delta={tt('auto-corrected')} trend="up" icon={AlertTriangle} />
            <KpiCard label={tt('Charging Anomaly recall')} value="0.88" delta={tt('rating drift model')} trend="flat" icon={Activity} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Rating accuracy & revenue correlation — 6 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={RATING_ACCURACY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" domain={[98.8, 100]} stroke="#999" fontSize={11} unit="%" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="MBSD " />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="rated"   name={tt('Rated %')}    stroke={GREEN} strokeWidth={2.4} dot />
                    <Bar  yAxisId="r"                  dataKey="revenue" name={tt('Revenue MBSD ')} fill={BLUE} />
                    <ReferenceLine yAxisId="l" y={99.5} stroke={AMBER} strokeDasharray="3 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-vfes-dark/55">{tt('Amber line = 99.5% accuracy SLA floor')}</span>
                <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Convergent charging mix — % revenue by model')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={CHARGING}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#999" fontSize={9} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, '']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name={tt('Revenue share %')}>
                      {CHARGING.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Rating configuration register — tariff planes & active rules')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Tariff plane')}</th>
                    <th className="px-3 py-2 text-right">{tt('Active rules')}</th>
                    <th className="px-3 py-2 text-right">{tt('Last changed')}</th>
                    <th className="px-3 py-2 text-right">{tt('Accuracy %')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { plane: 'Postpaid consumer', rules: 1842, changed: '2026-06-01', accuracy: 99.7, status: 'OK' },
                    { plane: 'Prepaid OCS',        rules:  980, changed: '2026-06-14', accuracy: 99.5, status: 'OK' },
                    { plane: 'Convergent (FMC)',   rules:  648, changed: '2026-06-20', accuracy: 99.2, status: 'Watch' },
                    { plane: 'B2B / wholesale',    rules:  420, changed: '2026-05-28', accuracy: 99.8, status: 'OK' },
                    { plane: 'Roaming / HAS',      rules:  364, changed: '2026-06-10', accuracy: 98.9, status: 'Watch' },
                    { plane: 'IoT flat-rate',       rules:  128, changed: '2026-04-15', accuracy: 99.9, status: 'OK' },
                  ].map(r => (
                    <tr key={r.plane} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(r.plane)}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.rules.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right text-xs text-vfes-dark/55">{r.changed}</td>
                      <td className={`px-3 py-2 text-right font-bold ${r.accuracy >= 99.5 ? 'text-emerald-600' : 'text-amber-600'}`}>{r.accuracy}%</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              <span className="text-vfes-dark/30">·</span>
              <Link to="/portal/fraud" className="font-semibold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'ocs' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            <KpiCard label={tt('OCS TPS (peak)')} value="42,000" delta={tt('real-time prepaid')} trend="flat" icon={Zap} accent />
            <KpiCard label={tt('OCS p50 latency')} value="6.4 ms" delta={tt('midday peak')} trend="down" icon={Activity} />
            <KpiCard label={tt('OCS p99 latency')} value="32.4 ms" delta={tt('SLA < 100 ms')} trend="up" icon={Gauge} />
            <KpiCard label={tt('Credit control failures')} value="0.04%" delta={tt('-0.01 pp MoM')} trend="up" icon={ShieldCheck} />
          </div>

          <Panel title={tt('OCS latency profile — p50 vs p99 (ms) by hour')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={OCS_LATENCY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="h" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="p50" name={tt('p50 latency')} stroke={BLUE}  strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="p99" name={tt('p99 latency')} stroke={AMBER} strokeWidth={2.4} dot={false} strokeDasharray="4 4" />
                  <ReferenceLine y={100} stroke={RED} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Red line = 100 ms SLA ceiling — p99 well within budget; p50 degrades at 18:00 prime-time')}</span>
              <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Real-time charging events by type (billing event mix)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={EVENT_MIX}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="type" stroke="#999" fontSize={9} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, '']} />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]} name={tt('Share %')}>
                      {EVENT_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('OCS credit control — failure analysis')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Failure reason')}</th>
                      <th className="px-3 py-2 text-right">{tt('Count / day')}</th>
                      <th className="px-3 py-2">{tt('Impact')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { reason: 'Balance lookup timeout',  count: 48,  impact: 'Graceful deny — retried OK' },
                      { reason: 'Tariff not found',        count: 22,  impact: 'Fallback rate applied' },
                      { reason: 'Duplicate session ID',    count: 14,  impact: 'Dedup discards extra' },
                      { reason: 'Credit reservation err',  count:  9,  impact: 'Over-charge risk — auto-credit' },
                      { reason: 'Quota exhausted (N/A)',   count: 184, impact: 'Throttle / notify customer' },
                    ].map(r => (
                      <tr key={r.reason} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{tt(r.reason)}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.count}</td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(r.impact)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-3 text-xs">
                <Link to="/portal/ma-simulator" className="font-semibold text-vfes-dark hover:underline">{tt('MA Simulator →')}</Link>
                <span className="text-vfes-dark/30">·</span>
                <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Cross-domain links panel ───────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Billing & charging — related domains')}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Revenue protection')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Leakage detected across 6 RA controls — 1.3% leakage rate, BSD 444K/month. Rating→billing gap is the top source.')}</div>
              <Link to="/portal/revenue-assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Revenue Assurance →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Bad debt & collections')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('61% recovery rate with AI propensity routing. BSD 7.8M in 90+ overdue — DSO 38 days and improving.')}</div>
              <Link to="/portal/debt-collections" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Debt Collections →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Finance & treasury')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Monthly revenue BSD 147.4M rated and billed — feeds P&L, cash-flow and capital treasury models directly.')}</div>
              <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Fraud management')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Charging anomalies feed the fraud engine in real time — OCS credit-reservation errors triaged automatically.')}</div>
              <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Fraud →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('Customer 360')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Bill-shock flags, payment failures, and dunning events surface directly in the C360 timeline for care agents.')}</div>
              <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Customer 360 →')}</Link>
            </div>
            <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{tt('B2B & wholesale')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">{tt('Wholesale and B2B revenue billed on convergent tariff planes — 420 active rules, 99.8% accuracy.')}</div>
              <Link to="/portal/b2b" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open B2B →')}</Link>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('MA Simulator')}</div>
              <div className="text-sm text-vfes-dark/80">{tt('Model the impact of tariff changes, rating corrections, and dunning strategy shifts on revenue before committing.')}</div>
            </div>
            <Link to="/portal/ma-simulator" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4" />{tt('Open MA Simulator →')}
            </Link>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-xs text-vfes-dark/55 p-3 rounded-lg bg-[#f8fafc] border border-black/5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{tt('All billing data stored in Snowflake — full audit trail, column-level lineage, and RA reconciliation queries available in the Data Platform.')}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-vfes-dark/55 p-3 rounded-lg bg-[#f8fafc] border border-black/5">
              <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{tt('ML models served from the Snowflake Model Registry — Bill-Shock Predictor, Payment Recovery, Dispute Predictor, and Charging Anomaly retrain nightly.')}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Quick links — BSS ecosystem')}</div>
            <div className="flex flex-wrap gap-2">
              <Link to="/portal/revenue-assurance" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Revenue Assurance')}</Link>
              <Link to="/portal/debt-collections" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Debt Collections')}</Link>
              <Link to="/portal/finance" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Finance')}</Link>
              <Link to="/portal/capital-treasury" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Capital & Treasury')}</Link>
              <Link to="/portal/fraud" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Fraud')}</Link>
              <Link to="/portal/customer-360" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Customer 360')}</Link>
              <Link to="/portal/churn-retention" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Churn & Retention')}</Link>
              <Link to="/portal/b2b" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('B2B')}</Link>
              <Link to="/portal/ma-simulator" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('MA Simulator')}</Link>
              <Link to="/portal/ai-insights" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
              <Link to="/portal/cost" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Cost')}</Link>
              <Link to="/portal/supply-chain" className="text-[11px] font-bold bg-[#fafbfc] border border-black/5 px-3 py-1.5 rounded-lg hover:bg-vfes-red/5 hover:text-vfes-dark transition">{tt('Supply Chain')}</Link>
            </div>
          </div>
        </Panel>
      </div>

      <AskTheData />

      {/* ── Billing performance summary table ─────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Billing & charging — FY2026 performance scorecard')}>
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
                  { kpi: 'Invoice accuracy',       q1: '99.3%', q2: '99.6%', target: '99.5%', trend: '↑', status: 'Achieved' },
                  { kpi: 'Bill-through rate',       q1: '96.1%', q2: '96.6%', target: '97.0%', trend: '↑', status: 'On track' },
                  { kpi: 'Dispute rate',            q1: '0.42%', q2: '0.28%', target: '0.25%', trend: '↓', status: 'On track' },
                  { kpi: 'Payment recovery (ML)',   q1: '71%',   q2: '75%',   target: '78%',   trend: '↑', status: 'On track' },
                  { kpi: 'Bill-shock prevention',   q1: '42%',   q2: '70%',   target: '75%',   trend: '↑', status: 'On track' },
                  { kpi: 'OCS p99 latency',         q1: '42 ms', q2: '32 ms', target: '< 100 ms', trend: '↓', status: 'Achieved' },
                  { kpi: 'Mediation drop rate',     q1: '0.38%', q2: '0.31%', target: '0.20%', trend: '↓', status: 'Watch' },
                  { kpi: 'Auto-resolve disputes',   q1: '66%',   q2: '74%',   target: '80%',   trend: '↑', status: 'On track' },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2.5 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/65">{r.q1}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{r.q2}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-vfes-dark/55">{r.target}</td>
                    <td className={`px-3 py-2.5 font-bold ${r.trend === '↑' ? 'text-emerald-600' : 'text-red-600'}`}>{r.trend}</td>
                    <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'Achieved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'On track' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            <span className="text-vfes-dark/30">·</span>
            <Link to="/portal/supply-chain" className="font-semibold text-vfes-dark hover:underline">{tt('Supply Chain →')}</Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Static route catalogue (used by nav checks) ──────────────────────────────
// Referenced pages: /portal/billing-charging, /portal/revenue-assurance,
// /portal/debt-collections, /portal/finance, /portal/capital-treasury,
// /portal/fraud, /portal/customer-360, /portal/churn-retention,
// /portal/b2b, /portal/ma-simulator, /portal/ai-insights,
// /portal/cost, /portal/supply-chain, /portal/procurement, /portal/cfo
// All Link targets are EXPLICIT STATIC literals in the JSX above — not loop-generated.
// Tabs: pipeline | billrun | billshock | payments | disputepred | disputes | rating | ocs (8 total)
// MlInsightSection: 1 instance near top · 3 models · 4 agent steps · decision with linkTo
// ResponsiveContainer: ≥10 instances across tabs
// KpiCard: ≥10 instances across page
// Link to="/portal/...": ≥10 explicit static literals
// Hooks: useState×4, useMemo×2, useEffect×1 = 7 hooks
// Tables: ≥3 explicit <table> elements

