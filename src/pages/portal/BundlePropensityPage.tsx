import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Sparkles, Users, Target, CheckCircle2, AlertTriangle, ShieldCheck,
  GitBranch, Zap, Network, Briefcase, Phone, Send, ArrowUpRight, Layers,
  Wifi, Signal, Tv, Smartphone, MapPin, Activity, FlaskConical, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine, ComposedChart, Legend, Area, AreaChart, PieChart, Pie,
} from 'recharts'
import { MOBILE_PROPENSITY } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ---------------------------- Demo data ---------------------------- //

const bundles = [
  { code: 'BB_TV',  name: 'Broadband + TV',           auc: 0.89, calib: 0.96, drift: 0.03, margin: 18.4, cannibal: 12, baseTake: 0.18, icon: Tv },
  { code: 'REVConnect',   name: 'REVConnect — BB + Mobile',       auc: 0.91, calib: 0.94, drift: 0.04, margin: 24.6, cannibal: 28, baseTake: 0.22, icon: Smartphone },
  { code: 'ONE_TOTAL',   name: 'Mega — BB + TV + Mobile',  auc: 0.86, calib: 0.92, drift: 0.05, margin: 32.8, cannibal: 18, baseTake: 0.14, icon: Layers },
  { code: 'SPORTS', name: 'BB + TV + Sports add-on · Sports package',     auc: 0.84, calib: 0.88, drift: 0.09, margin: 28.2, cannibal:  8, baseTake: 0.11, icon: Signal },
]

// Threshold simulator curve — at each propensity threshold, eligible customers, predicted conversions, expected margin
const thresholdCurve = [
  { t: 0.30, eligible: 1820, conv: 308, margin: 6.8,  cac: 1.4 },
  { t: 0.40, eligible: 1480, conv: 282, margin: 7.4,  cac: 1.3 },
  { t: 0.50, eligible: 1140, conv: 256, margin: 7.9,  cac: 1.1 },
  { t: 0.60, eligible:  860, conv: 232, margin: 8.1,  cac: 0.9 },
  { t: 0.70, eligible:  620, conv: 194, margin: 7.8,  cac: 0.7 },
  { t: 0.80, eligible:  390, conv: 142, margin: 6.4,  cac: 0.5 },
  { t: 0.90, eligible:  198, conv:  82, margin: 4.2,  cac: 0.3 },
]

// Uplift quadrant — persuadables (high uplift), sure-things, sleeping-dogs, do-not-disturb
const upliftSegments = [
  { name: 'Persuadables',    x:  78, y:  22, z: 184000, color: '#10b981', desc: 'High treatment uplift · TARGET' },
  { name: 'Sure Things',     x:  82, y:   3, z: 142000, color: '#3b82f6', desc: 'Will buy anyway · save spend' },
  { name: 'Sleeping Dogs',   x:  62, y: -14, z:  74000, color: '#dc2626', desc: 'Treatment HURTS · do not contact' },
  { name: 'Do Not Disturb',  x:  18, y:  -2, z: 220000, color: '#64748b', desc: 'No response · skip' },
]

// Decile lift chart (predicted vs random)
const lift = [
  { d: 'D1', model: 4.2, random: 1.0 },
  { d: 'D2', model: 2.8, random: 1.0 },
  { d: 'D3', model: 1.9, random: 1.0 },
  { d: 'D4', model: 1.4, random: 1.0 },
  { d: 'D5', model: 1.1, random: 1.0 },
  { d: 'D6', model: 0.8, random: 1.0 },
  { d: 'D7', model: 0.6, random: 1.0 },
  { d: 'D8', model: 0.4, random: 1.0 },
  { d: 'D9', model: 0.3, random: 1.0 },
  { d: 'D10', model: 0.2, random: 1.0 },
]

// Eligibility funnel — scored → footprint OK → contract OK → consent OK → final addressable
const funnel = [
  { stage: 'Scored base',          n: 1080000, color: '#1e293b', drop: '' },
  { stage: 'Footprint eligible',   n:  742000, color: '#475569', drop: '−31% (no FTTH/HFC)' },
  { stage: 'Contract eligible',    n:  486000, color: '#64748b', drop: '−34% (in 24-mo term)' },
  { stage: 'Content rights OK',    n:  442000, color: '#94a3b8', drop: '−9% (Sports rights)' },
  { stage: 'Marketing consent',    n:  362000, color: '#cbd5e1', drop: '−18% (DPA opt-out)' },
  { stage: 'Capacity / fatigue',   n:  298000, color: '#e2e8f0', drop: '−18% (in other campaigns)' },
  { stage: 'Final addressable',    n:  298000, color: '#10b981', drop: '' },
]

// Margin waterfall — gross → cannibalisation → discount → cost-to-serve → net
const waterfall = [
  { step: 'Gross revenue',     v:  62.4, type: 'start',  color: '#1e293b' },
  { step: 'Cannibalisation',   v: -14.8, type: 'minus',  color: '#dc2626' },
  { step: 'Promo discount',    v:  -8.6, type: 'minus',  color: '#ea580c' },
  { step: 'Cost-to-serve',     v:  -5.4, type: 'minus',  color: '#f59e0b' },
  { step: 'CAC / channel',     v:  -3.8, type: 'minus',  color: '#eab308' },
  { step: 'Content / rights',  v:  -2.2, type: 'minus',  color: '#a16207' },
  { step: 'Net margin',        v:  27.6, type: 'end',    color: '#10b981' },
]

// Channel routing — conversion rate per propensity tier × channel
const channelMatrix = [
  { tier: 'P ≥ 0.8', app: 0.42, outbound: 0.34, retail: 0.28, d2d: 0.18, email: 0.14 },
  { tier: 'P 0.6–0.8', app: 0.28, outbound: 0.22, retail: 0.18, d2d: 0.12, email: 0.08 },
  { tier: 'P 0.4–0.6', app: 0.14, outbound: 0.12, retail: 0.09, d2d: 0.06, email: 0.04 },
  { tier: 'P < 0.4',   app: 0.04, outbound: 0.03, retail: 0.02, d2d: 0.01, email: 0.01 },
]
const channels = ['app', 'outbound', 'retail', 'd2d', 'email'] as const
const channelLabels: Record<typeof channels[number], string> = { app: 'App / In-product', outbound: 'Outbound call', retail: 'Retail store', d2d: 'Door-to-door', email: 'Email / SMS' }

// Calibration — predicted vs actual take-rate by propensity bin
const calibration = [
  { bin: 0.1,  actual: 0.09 },
  { bin: 0.2,  actual: 0.18 },
  { bin: 0.3,  actual: 0.31 },
  { bin: 0.4,  actual: 0.38 },
  { bin: 0.5,  actual: 0.49 },
  { bin: 0.6,  actual: 0.58 },
  { bin: 0.7,  actual: 0.69 },
  { bin: 0.8,  actual: 0.78 },
  { bin: 0.9,  actual: 0.86 },
]

const fairness = [
  { group: '18–24',     base: 0.22, tested: 0.21 },
  { group: '25–34',     base: 0.22, tested: 0.23 },
  { group: '35–54',     base: 0.22, tested: 0.22 },
  { group: '55+',       base: 0.22, tested: 0.20 },
  { group: 'Nassau',    base: 0.22, tested: 0.23 },
  { group: 'Rural',     base: 0.22, tested: 0.21 },
  { group: 'Social C2DE', base: 0.22, tested: 0.22 },
]

const b2bBundles = [
  { seg: 'SoHo (1–9)',           bundle: 'Business BB + Mobile',            score: 0.84, customers: 18400, margin: 22 },
  { seg: 'SMB (10–49)',          bundle: 'Business BB + Cloud Voice + M365',score: 0.78, customers:  6200, margin: 84 },
  { seg: 'Mid-market (50–249)',  bundle: 'SD-WAN + Mobile fleet + Security',score: 0.71, customers:  1450, margin: 320 },
  { seg: 'Enterprise (250+)',    bundle: 'Managed network + Cyber + UCaaS', score: 0.62, customers:   180, margin: 1840 },
]

const networkUnlock = [
  { quarter: 'Q1 26', premises: 84000,  unlock: 6.2 },
  { quarter: 'Q2 26', premises: 142000, unlock: 10.4 },
  { quarter: 'Q3 26', premises: 196000, unlock: 14.8 },
  { quarter: 'Q4 26', premises: 248000, unlock: 18.6 },
]

// Top action queue — replaces old customers table
const actionQueue = [
  { id: 'VM-103412', name: 'Emma Rolle',    region: 'Andros',  current: 'Mega',          best: 'SPORTS', score: 0.78, marginLift: 124, why: 'Stream 6h/day · Sports package searches · 3-person household', play: 'Sports add-on, 3-mo trial', channel: 'App',      eligible: true,  tier: 'Persuadable' },
  { id: 'VM-102998', name: 'Jonas Willems',    region: 'Nassau',    current: '1 Gb + Mobile', best: 'ONE_TOTAL',   score: 0.84, marginLift: 168, why: 'TV competitor sub detected · partner on REVConnect',              play: 'Mega upgrade + 6mo TV free', channel: 'Outbound', eligible: true,  tier: 'Persuadable' },
  { id: 'VM-100482', name: 'Sofie Bethel',    region: 'Nassau',    current: 'Mega',          best: 'BB_TV',  score: 0.94, marginLift:   8, why: 'Already on Mega · Sure-thing — minimise spend',           play: 'Do-not-treat (paid social hold-out)',channel: '—',        eligible: true,  tier: 'Sure thing' },
  { id: 'VM-100765', name: 'Lars Ferguson', region: 'Freeport',      current: '500 Mb only',   best: 'SPORTS', score: 0.74, marginLift:  96, why: 'Sports package streaming · sports forum visits',                       play: 'Sports add-on · Sports package + 1Gb upgrade',  channel: 'Retail',   eligible: true,  tier: 'Persuadable' },
  { id: 'VM-101203', name: 'Marie Knowles', region: 'Abaco',    current: '500 Mb only',   best: 'BB_TV',  score: 0.78, marginLift:  72, why: 'Family of 4 · Netflix + Disney+ stacked',                  play: 'BB+TV bundle, no contract change',channel: 'App',     eligible: true,  tier: 'Persuadable' },
  { id: 'VM-101977', name: 'Daan Adderley',      region: 'Eleuthera',  current: '500 Mb + Mobile',best:'REVConnect',   score: 0.91, marginLift: -42, why: 'High propensity but DILUTIVE — already has both products',  play: 'Suppress (sleeping-dog risk)', channel: '—',     eligible: false, tier: 'Sleeping dog' },
  { id: 'VM-102540', name: 'Anke Bain',   region: 'Exuma', current: 'BB + TV',       best: 'ONE_TOTAL',   score: 0.62, marginLift:  88, why: 'Mobile-only on competitor · contract expiring',                 play: 'REVConnect+TV migration offer',   channel: 'Outbound', eligible: true,  tier: 'Persuadable' },
  { id: 'VM-104088', name: 'Wout Vermeulen', region: 'Bimini',     current: '500 Mb only',   best: 'REVConnect',   score: 0.84, marginLift:  64, why: 'No FTTH yet · Q3 lighting up — defer',                     play: 'Hold for Q3 FTTH wave',    channel: 'Email',    eligible: false, tier: 'Persuadable' },
]

// ---------------------------- Helpers ---------------------------- //

const fmtBSD = (n: number) => `BSD ${n.toLocaleString()}`
const fmtK = (n: number) => `${(n/1000).toFixed(0)}K`

const REGION_PROPENSITY = [
  { region: 'Nassau',         prop: 0.74, eligible: 68400, ftth: 96, take: 22, arpu: 76 },
  { region: 'Grand Bahama',   prop: 0.71, eligible: 54200, ftth: 91, take: 19, arpu: 72 },
  { region: 'Abaco',   prop: 0.68, eligible: 38400, ftth: 84, take: 17, arpu: 68 },
  { region: 'Out Islands',        prop: 0.64, eligible: 42800, ftth: 71, take: 14, arpu: 62 },
  { region: 'Eleuthera', prop: 0.72, eligible: 24600, ftth: 88, take: 21, arpu: 74 },
  { region: 'Exuma',         prop: 0.58, eligible: 18200, ftth: 62, take: 11, arpu: 56 },
  { region: 'New Providence-Capital',prop: 0.54, eligible: 14800, ftth: 54, take: 10, arpu: 52 },
]

const CAMPAIGN_PERF = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26','Q1-27','Q2-27'][i],
  roi:       2.4 + i * 0.28,
  conv:      0.11 + i * 0.012,
  contacted: 120000 + i * 8000,
  converted: 13200 + i * 960,
}))

const DEMO_SEGMENTS = [
  { seg: '18–24',      prop: 0.54, take: 14, arpu: 38, size: 420000,  note: 'Digital-native — prefer App channel' },
  { seg: '25–34',      prop: 0.72, take: 22, arpu: 52, size: 680000,  note: 'Highest propensity — top-target' },
  { seg: '35–54',      prop: 0.68, take: 19, arpu: 62, size: 840000,  note: 'High value — convergent upsell' },
  { seg: '55+',         prop: 0.48, take: 12, arpu: 48, size: 580000,  note: 'Contact by phone' },
  { seg: 'SoHo/SMB',    prop: 0.81, take: 28, arpu: 128, size: 42000, note: 'B2B — higher margin' },
]

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',          icon: Activity },
  { id: 'uplift',    label: 'Uplift',             icon: Zap },
  { id: 'channels',  label: 'Channels',           icon: Phone },
  { id: 'scenarios', label: 'Scenarios',          icon: FlaskConical },
  { id: 'model',     label: 'Model',              icon: GitBranch },
  { id: 'b2b',       label: 'B2B',                icon: Briefcase },
  { id: 'performance', label: 'Performance',      icon: ArrowUpRight },
  { id: 'segmentation', label: 'Segmentation',    icon: MapPin },
] as const
type TabId = typeof TABS[number]['id']

export default function BundlePropensityPage() {
  const [bundle, setBundle] = useState<string>('REVConnect')
  const [threshold, setThreshold] = useState(0.6)
  const [profitGate, setProfitGate] = useState(true)
  const [discount, setDiscount] = useState(15)
  const [contractMonths, setContractMonths] = useState(18)
  const [pushed, setPushed] = useState<string[]>([])
  const [tab, setTab] = useState<TabId>('overview')
  const [geoRegion, setGeoRegion] = useState<string>('All')

  const sel = bundles.find((b) => b.code === bundle)!
  const SelIcon = sel.icon

  const sim = useMemo(() => {
    // pick the threshold curve point
    const p = thresholdCurve.reduce((best, c) => Math.abs(c.t - threshold) < Math.abs(best.t - threshold) ? c : best)
    // discount elasticity: each +1% discount → +0.6% conv but −1% margin
    const convAdj = 1 + (discount - 15) * 0.006
    // longer contract reduces churn risk → +BSD  margin
    const contractAdj = 1 + (contractMonths - 18) * 0.012
    const conv = Math.round(p.conv * convAdj)
    const grossMargin = p.margin * (1 - (discount - 15) * 0.012) * contractAdj
    const cannibLoss = grossMargin * (sel.cannibal / 100)
    const net = grossMargin - cannibLoss
    return { eligible: p.eligible, conv, grossMargin, cannibLoss, net, cac: p.cac }
  }, [threshold, discount, contractMonths, sel.cannibal])

  const totalPushed = useMemo(() => actionQueue.filter((a) => pushed.includes(a.id)).reduce((s, a) => s + a.marginLift, 0), [pushed])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Bundle Propensity')}
        subtitle={tt('Margin-weighted bundle uptake · uplift modelling · footprint-gated')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> 4 models healthy · max drift 0.09
            </span>
            <span className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Use Case 2
            </span>
          </div>
        }
      />

      <AgentDecision
        title="Bundle propensity agent"
        label="Run Propensity Campaign" runningLabel="Building…"
        steps={[
          'Scored 255K lines for bundle propensity',
          'Filtered to 298K eligible & feasible',
          'Ranked by margin-adjusted conversion',
          'Routed to best channel within contact caps',
        ]}
        hint="Propensity × margin × channel-fit decides who gets which offer where."
        result={{
          headline: 'Lead with the convergent bundle — best margin per conversion',
          stats: [
            { label: 'Eligible base', value: '298K' },
            { label: 'Avg margin uplift', value: 'BSD 5.8/cust' },
            { label: 'Portfolio inc. margin', value: 'BSD 1.4M/Q' },
            { label: 'Persuadables', value: '17.0%' },
          ],
          findings: [
            'The margin waterfall favours convergent bundles over single-product upsell.',
            'Targeting the eligible high-propensity base maximises EBITDA per campaign dollar.',
            'Route each offer to the best-fit channel inside contact-policy caps to protect conversion.',
          ],
          note: 'Net out existing add-ons before launch to avoid cannibalising current ARPU.',
        }}
        impact="+margin/conversion vs single-product"
        risk="cannibalisation — net out existing add-ons"
        linkTo="#/portal/base-management" linkLabel="Open Base Management"
      />

      {/* ML Intelligence */}
      <MlInsightSection
        heading="Bundle propensity intelligence"
        models={[
          { name: 'Bundle Propensity XGBoost', metric: 'AUC 0.91', sub: '255K lines scored · 4 bundles' },
          { name: 'T-Learner Uplift Model', metric: '+38% lift', sub: 'causal uplift on hold-out control' },
          { name: 'Margin Waterfall Engine', metric: '44% net', sub: 'cannibalisation + promo − gross revenue' },
        ]}
        agentLabel="Run Propensity Campaign"
        agentRunningLabel="Building…"
        agentSteps={[
          'Scored 255K lines for bundle propensity',
          'Filtered to 298K eligible & feasible',
          'Ranked by margin-adjusted conversion',
          'Routed to best channel within contact caps',
        ]}
        agentBlurb="One model per bundle — AUC 0.84–0.91, calibrated and fair across demographic groups — ensures every offer goes to the right customer through the right channel."
        decision={{
          title: 'Lead with the convergent bundle — best margin per conversion',
          detail: 'The margin waterfall favours convergent bundles over single-product upsell. The persuadable segment (17%) captures 68% of conversions from just the top 30% of the scored base.',
          impact: '+margin/conversion vs single product',
          risk: 'cannibalisation — net out existing add-ons before launch',
          linkTo: '#/portal/base-management',
          linkLabel: 'Open Base Management',
        }}
        chart={{
          kind: 'bar',
          title: 'Decile lift chart — model vs random',
          xKey: 'd',
          data: lift,
          series: [
            { key: 'model',  name: 'Model',   color: '#FF4438' },
            { key: 'random', name: 'Random',  color: '#94a3b8', dashed: true },
          ],
          note: 'Top 30% captures 68% of conversions · KS = 0.41',
        }}
        registryNote="Models in Snowflake Model Registry · retrained every 2 weeks · features from Subscriber Feature Store."
      />

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (<>
      {/* Row 1 — Headline KPIs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('Final Addressable')} value={fmtK(298000)} delta="from 1.08M scored · 28%" trend="flat" icon={Users} accent />
        <KpiCard label={tt('Avg Margin Uplift / Cust.')} value={`BSD ${sim.net.toFixed(1)}`} delta={`net of ${sel.cannibal}% cannibalisation`} trend="up" icon={Target} />
        <KpiCard label={tt('Portfolio Inc. Margin (Q)')} value={`BSD ${(sim.net * sim.conv * 1000 / 1_000_000).toFixed(1)}M`} delta={`${sim.conv}K predicted conv.`} trend="up" icon={Sparkles} />
        <KpiCard label={tt('Persuadables %')} value="17.0%" delta="vs 13.1% sure-things · uplift model v2" trend="up" icon={Zap} />
      </div>

      {/* Row 2 — Trust KPIs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Model AUC')}         value={sel.auc.toFixed(2)} delta={`${sel.code} · v3.4`}        trend="up"   icon={GitBranch} />
        <KpiCard label={tt('Calibration (Brier)')}value={sel.calib.toFixed(2)} delta="1.0 = perfectly calibrated" trend="up"   icon={ShieldCheck} />
        <KpiCard label={tt('Drift (PSI)')}        value={sel.drift.toFixed(2)} delta={sel.drift < 0.1 ? 'Stable' : 'Watch'} trend={sel.drift < 0.1 ? 'flat' : 'down'} icon={GitBranch} />
        <KpiCard label={tt('Holdout actual lift')} value="+38%" delta="vs paid-social control · last Q" trend="up" icon={ArrowUpRight} />
      </div>

      {/* Mobile-led propensity signals */}
      <Panel title={tt('Mobile-led propensity signals')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Cable Bahamas · top-3 MNO')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Signal')}</th><th>{tt('Target')}</th><th>{tt('Lift')}</th><th>{tt('Channel')}</th><th>{tt('Conv.')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_PROPENSITY.map((s, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(s.signal)}</td>
                <td className="font-mono text-xs">{(s.target / 1000).toFixed(0)}K</td>
                <td>
                  <span className="text-xs font-bold text-emerald-600">{s.lift.toFixed(1)}×</span>
                </td>
                <td className="text-xs text-vfes-dark/65">{tt(s.channel)}</td>
                <td className="text-xs font-bold">{s.conversion.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('184K Mobile-only customers within propensity ≥ 0.7 to upgrade Convergent — primary growth lever.')}</div>
      </Panel>

      {/* Row 3 — Bundle selector cards */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {bundles.map((b) => {
          const Icon = b.icon
          const active = bundle === b.code
          return (
            <button
              key={b.code}
              onClick={() => setBundle(b.code)}
              className={`text-left p-4 rounded-xl border transition ${
                active ? 'bg-vfes-red text-vfes-dark border-vfes-red shadow-lg shadow-vfes-red/25' : 'bg-white border-black/5 hover:border-vfes-red/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-full grid place-items-center ${active ? 'bg-white/15' : 'bg-vfes-red/10'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-vfes-dark'}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white/80' : 'text-vfes-dark'}`}>{b.code}</span>
              </div>
              <div className={`font-bold mt-3 ${active ? 'text-white' : ''}`}>{tt(b.name)}</div>
              <div className={`grid grid-cols-2 gap-2 mt-3 text-[11px] ${active ? 'text-white/85' : 'text-vfes-dark/60'}`}>
                <div><div className="opacity-70">{tt('Margin/cust')}</div><div className="font-bold">BSD {b.margin}</div></div>
                <div><div className="opacity-70">{tt('Cannibal.')}</div><div className="font-bold">{b.cannibal}%</div></div>
                <div><div className="opacity-70">{tt('AUC')}</div><div className="font-bold">{b.auc}</div></div>
                <div><div className="opacity-70">{tt('Take rate')}</div><div className="font-bold">{(b.baseTake*100).toFixed(0)}%</div></div>
              </div>
            </button>
          )
        })}
      </div>

      </>)}

      {tab === 'uplift' && (<>
      {/* Row 4 — Threshold curve + Scenario lab */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel
            title={`Threshold Volume Curve · ${sel.code}`}
            action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('eligible × conv × margin BSD M')}</span>}
          >
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={thresholdCurve}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <ReferenceLine yAxisId="left" x={threshold} stroke="#222128" strokeDasharray="4 4" />
                  <XAxis dataKey="t" stroke="#999" fontSize={11} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis yAxisId="left" stroke="#999" fontSize={11} tickFormatter={(v) => `${v}K`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}M`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar yAxisId="left" dataKey="eligible" fill="#cbd5e1" radius={[4,4,0,0]} />
                  <Bar yAxisId="left" dataKey="conv" fill="#FF4438" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-vfes-dark/55 mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-300 rounded-sm" />{tt('Eligible (K)')}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-vfes-red rounded-sm" />{tt('Predicted conv. (K)')}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500" />{tt('Net margin BSD M')}</span>
              <span className="ml-auto font-mono text-[10px] text-vfes-dark/45">{tt('peak margin at threshold ≈ 0.60')}</span>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Offer Lab — What-if')}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Propensity threshold')}</span>
                <span className="font-bold text-vfes-dark">≥ {threshold.toFixed(2)}</span>
              </div>
              <input type="range" min={0.3} max={0.9} step={0.05} value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-vfes-red" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Promo discount')}</span>
                <span className="font-bold text-vfes-dark">−{discount}%</span>
              </div>
              <input type="range" min={0} max={40} step={5} value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value))}
                className="w-full accent-vfes-red" />
              <div className="text-[10px] text-vfes-dark/45 mt-1">{tt('Elasticity ε = +0.6 conv. / −1.0 margin per pp')}</div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Contract length')}</span>
                <span className="font-bold text-vfes-dark">{contractMonths} mo</span>
              </div>
              <input type="range" min={12} max={36} step={6} value={contractMonths}
                onChange={(e) => setContractMonths(parseInt(e.target.value))}
                className="w-full accent-vfes-red" />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer pt-2 border-t border-black/5">
              <input type="checkbox" checked={profitGate} onChange={(e) => setProfitGate(e.target.checked)} className="w-4 h-4 accent-vfes-red" />
              <span className="font-semibold">{tt('Margin-positive gate (UC3)')}</span>
            </label>
          </div>
          <div className="space-y-2 pt-4 mt-4 border-t border-black/5 text-sm">
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Eligible cust.')}</span><span className="font-bold">{sim.eligible}K</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Predicted conv.')}</span><span className="font-bold">{sim.conv}K</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Gross margin/cust')}</span><span className="font-bold">BSD {sim.grossMargin.toFixed(1)}</span></div>
            <div className="flex justify-between text-red-600"><span>{tt('− cannibalisation')}</span><span className="font-bold">−BSD {sim.cannibLoss.toFixed(1)}</span></div>
            <div className="flex justify-between border-t border-black/5 pt-2"><span className="font-bold">{tt('Net margin/cust')}</span><span className="font-bold text-emerald-600">BSD {sim.net.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Portfolio BSD ')}</span><span className="font-bold text-emerald-600">BSD {(sim.net * sim.conv / 1000).toFixed(2)}M</span></div>
          </div>
        </Panel>
      </div>

      {/* Row 5 — Uplift quadrants + Decile lift */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel
          title={tt('Uplift Quadrants — treat the persuadables, not sure-things')}
          action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('causal model · t-learner')}</span>}
        >
          <div className="h-64">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <ReferenceLine x={50} stroke="#cbd5e1" />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <XAxis type="number" dataKey="x" stroke="#999" fontSize={11} domain={[0, 100]}
                  label={{ value: 'Base conversion %', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#999' }} />
                <YAxis type="number" dataKey="y" stroke="#999" fontSize={11} domain={[-20, 30]}
                  label={{ value: 'Treatment uplift pp', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#999' }} />
                <ZAxis type="number" dataKey="z" range={[120, 700]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle}
                  formatter={(_v: any, _n: any, p: any) => [`${(p.payload.z/1000).toFixed(0)}K · ${p.payload.desc}`, p.payload.name]} />
                <Scatter data={upliftSegments}>
                  {upliftSegments.map((s, i) => <Cell key={i} fill={s.color} fillOpacity={0.78} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            {upliftSegments.map((s) => (
              <div key={tt(s.name)} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="truncate text-vfes-dark/65"><span className="font-semibold">{tt(s.name)}</span> · {(s.z/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Decile Lift Chart')} action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('D1 = 4.2× random')}</span>}>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={lift}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v}×`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(2)}×`} />
                <Bar dataKey="model" fill="#FF4438" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="random" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-3 pt-3 border-t border-black/5">
            Top 30% of scored base captures <span className="font-bold text-emerald-700">{tt('68% of conversions')}</span> · KS = 0.41
          </div>
        </Panel>
      </div>

      {/* Row 6 — Eligibility funnel + Margin waterfall */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Eligibility & Feasibility Funnel')}>
          <div className="space-y-1.5">
            {funnel.map((f, i) => {
              const w = (f.n / funnel[0].n) * 100
              return (
                <div key={f.stage} className="grid grid-cols-[180px,1fr,80px] items-center gap-2 text-xs">
                  <span className="truncate text-vfes-dark/75 font-semibold">{f.stage}</span>
                  <div className="relative h-6 bg-black/[0.03] rounded">
                    <div className="absolute inset-y-0 left-0 rounded transition-all" style={{ width: `${w}%`, background: f.color }} />
                    {f.drop && <div className="absolute inset-0 flex items-center justify-end px-2 text-[10px] font-mono text-vfes-dark/55">{f.drop}</div>}
                  </div>
                  <span className={`font-mono text-right text-[11px] ${i === funnel.length-1 ? 'text-emerald-700 font-bold' : 'text-vfes-dark/65'}`}>
                    {(f.n/1000).toFixed(0)}K
                  </span>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-black/5 text-[10px]">
            <div className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-600" />{tt('FTTH/HFC check')}</div>
            <div className="flex items-center gap-1"><Network className="w-3 h-3 text-amber-600" />{tt('Contract / ETF')}</div>
            <div className="flex items-center gap-1"><Tv className="w-3 h-3 text-slate-600" />{tt('Content rights')}</div>
            <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-vfes-dark" />{tt('DPA consent')}</div>
          </div>
        </Panel>

        <Panel title={tt('Margin Waterfall — BSD M per 100K conversions')} action={<span className="text-[10px] font-mono text-vfes-dark/45">{sel.code}</span>}>
          <div className="space-y-1.5">
            {(() => {
              let running = 0
              const max = 65
              return waterfall.map((s) => {
                let left = 0
                const width = (Math.abs(s.v) / max) * 100
                if (s.type === 'start') {
                  left = 0
                  running = s.v
                } else if (s.type === 'minus') {
                  // bar extends from new running total back to old running total
                  left = ((running + s.v) / max) * 100
                  running += s.v
                } else {
                  // end bar: from 0 to value
                  left = 0
                  running = s.v
                }
                return (
                  <div key={s.step} className="grid grid-cols-[140px,1fr,70px] items-center gap-2 text-xs">
                    <span className="truncate text-vfes-dark/75 font-semibold">{s.step}</span>
                    <div className="relative h-6 bg-black/[0.03] rounded">
                      <div className="absolute inset-y-0 rounded" style={{ left: `${left}%`, width: `${width}%`, background: s.color }} />
                    </div>
                    <span className={`font-mono text-right ${s.v < 0 ? 'text-red-600' : 'text-emerald-700 font-bold'}`}>
                      {s.v > 0 ? '+' : ''}BSD {s.v.toFixed(1)}M
                    </span>
                  </div>
                )
              })
            })()}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-3 pt-3 border-t border-black/5">
            Net retention rate <span className="font-bold text-emerald-700">44%</span> of gross · cannibalisation is biggest leak
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'channels' && (<>
      {/* Row 7 — Channel routing + Calibration */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Channel Routing — conversion rate by tier × channel')} action={<Phone className="w-4 h-4 text-vfes-dark/40" />}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <th className="py-2 text-left">{tt('Tier')}</th>
                {channels.map((c) => <th key={c} className="text-center">{channelLabels[c]}</th>)}
              </tr>
            </thead>
            <tbody>
              {channelMatrix.map((row) => (
                <tr key={row.tier} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{row.tier}</td>
                  {channels.map((c) => {
                    const v = row[c] as number
                    const pct = v * 100
                    const intensity = Math.min(1, v / 0.42)
                    return (
                      <td key={c} className="p-1 text-center">
                        <div className="rounded py-1.5 font-mono font-bold"
                          style={{ background: `rgba(225, 10, 10, ${intensity * 0.85})`, color: intensity > 0.4 ? '#fff' : '#111' }}>
                          {pct.toFixed(0)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Fatigue cap: 3 contacts / 30d
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Engineer slots: 78% utilised
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1.5 rounded">
              <Layers className="w-3 h-3" /> SIM stock: 142K
            </div>
          </div>
        </Panel>

        <Panel title={tt('Calibration & Fairness')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Calibration plot')}</div>
              <div className="h-44">
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#94a3b8" strokeDasharray="4 4" />
                    <XAxis type="number" dataKey="bin" stroke="#999" fontSize={10} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                    <YAxis type="number" dataKey="actual" stroke="#999" fontSize={10} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(2)} />
                    <Scatter data={calibration} fill="#FF4438" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/55 mt-1">Brier {sel.calib} · ECE 0.018</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Fairness — take-rate parity')}</div>
              <div className="space-y-1 mt-2">
                {fairness.map((f) => {
                  const delta = f.tested - f.base
                  const ok = Math.abs(delta) <= 0.02
                  return (
                    <div key={f.group} className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-vfes-dark/70">{f.group}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{(f.tested * 100).toFixed(1)}%</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-vfes-dark/55 mt-2 pt-2 border-t border-black/5">
                Demographic parity Δ &lt; 0.03 across all groups <span className="text-emerald-700 font-bold">{tt('✓ pass')}</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Row 8 — B2B + Network monetisation */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('VMB — B2B Bundle Propensity')} action={<Briefcase className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="space-y-3">
            {b2bBundles.map((b) => (
              <div key={b.seg} className="flex items-center justify-between p-3 bg-[#fafbfc] rounded-lg border border-black/5">
                <div className="flex-1">
                  <div className="font-bold text-sm">{b.seg}</div>
                  <div className="text-[11px] text-vfes-dark/55">{b.bundle}</div>
                  <div className="text-[10px] text-vfes-dark/45 mt-0.5">{(b.customers/1000).toFixed(1)}K accounts</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Score · margin')}</div>
                  <div className="text-lg font-extrabold text-vfes-dark">{b.score.toFixed(2)}</div>
                  <div className="text-[11px] font-bold text-emerald-700">BSD {b.margin}/mo</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 text-[10px] uppercase tracking-widest text-vfes-dark/45">
            B2B portfolio · <span className="font-bold">{tt('26.2K accounts')}</span> · Inc. ARR potential <span className="font-bold text-emerald-700">{tt('BSD 18.4M')}</span>
          </div>
        </Panel>

        <Panel title={tt('Network Monetisation — FTTH unlock')} action={<Network className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="text-xs text-vfes-dark/55 mb-3">{tt('Inc. margin BSD M unlocked by quarter as FTTH lights up new premises')}</div>
          <div className="h-44">
            <ResponsiveContainer>
              <ComposedChart data={networkUnlock}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="quarter" stroke="#999" fontSize={11} />
                <YAxis yAxisId="left" stroke="#999" fontSize={11} tickFormatter={(v) => `${v/1000}K`} />
                <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}M`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar yAxisId="left" dataKey="premises" fill="#cbd5e1" radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="unlock" stroke="#222128" strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-black/5 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('12-mo unlock')}</div><div className="font-bold">{tt('BSD 50.0M')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Capex tie-back')}</div><a className="font-bold text-vfes-dark flex items-center gap-1 hover:underline" href="#/portal/coverage-map">Coverage Map <ArrowUpRight className="w-3 h-3" /></a></div>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'scenarios' && (<>
      {/* Row 9 — Action queue */}
      <div className="mb-6">
        <Panel
          title={tt('Action Queue — top targets ranked by margin uplift × propensity × eligibility')}
          action={
            <div className="flex items-center gap-2">
              {pushed.length > 0 && (
                <span className="text-[11px] font-mono text-emerald-700">
                  {pushed.length} queued · +BSD {totalPushed} margin lift
                </span>
              )}
              <span className="text-[10px] font-mono text-vfes-dark/45">{tt('CHURN_V3_7 ⨝ NEXT_BEST_ACTION')}</span>
            </div>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55 text-left border-b border-black/5">
                <th className="py-2">{tt('Customer')}</th>
                <th>{tt('Best bundle')}</th>
                <th>{tt('Score')}</th>
                <th>{tt('Margin lift')}</th>
                <th>{tt('Tier')}</th>
                <th>{tt('Why this offer')}</th>
                <th>{tt('Channel')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {actionQueue.map((a) => {
                const isPushed = pushed.includes(a.id)
                const blocked = !a.eligible || a.tier === 'Sleeping dog' || a.tier === 'Sure thing'
                const pos = a.marginLift > 0
                return (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                    <td className="py-2.5">
                      <div className="font-semibold">{tt(a.name)}</div>
                      <div className="text-[11px] font-mono text-vfes-dark/55">{a.id} · {a.region}</div>
                    </td>
                    <td>
                      <div className="font-bold text-vfes-dark text-xs">{a.best}</div>
                      <div className="text-[10px] text-vfes-dark/55">from {a.current}</div>
                    </td>
                    <td className="font-mono font-bold">{a.score.toFixed(2)}</td>
                    <td className={`font-bold ${pos ? 'text-emerald-700' : 'text-red-600'}`}>{pos ? '+' : ''}BSD {a.marginLift}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        a.tier === 'Persuadable' ? 'bg-emerald-50 text-emerald-700' :
                        a.tier === 'Sure thing' ? 'bg-blue-50 text-blue-700' :
                        a.tier === 'Sleeping dog' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>{a.tier}</span>
                    </td>
                    <td className="text-xs text-vfes-dark/70 max-w-[260px]">{a.why}<div className="text-[10px] text-vfes-dark/45 mt-0.5">{a.play}</div></td>
                    <td className="text-xs">{a.channel}</td>
                    <td className="text-right">
                      <button
                        onClick={() => !blocked && setPushed((p) => p.includes(a.id) ? p : [...p, a.id])}
                        disabled={isPushed || blocked}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 ${
                          isPushed ? 'bg-emerald-50 text-emerald-700 cursor-default' :
                          blocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                          'bg-vfes-red text-vfes-dark hover:bg-vfes-red/90'
                        }`}
                      >
                        {isPushed ? <><ShieldCheck className="w-3 h-3" />{tt('Queued')}</> :
                         blocked ? <>{tt('Suppress')}</> :
                         <><Send className="w-3 h-3" />{tt('Push')}</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
            <div className="text-xs text-vfes-dark/55">
              Sourced from <span className="font-mono">{tt('CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY')}</span> ⨝ <span className="font-mono">{tt('UPLIFT_T_LEARNER')}</span> ⨝ <span className="font-mono">{tt('FOOTPRINT_GRAPH')}</span>
            </div>
            <div className="flex gap-2">
              <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Export to Salesforce')}</button>
              <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Export to Marketing Cloud')}</button>
              <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Genesys outbound list')}</button>
            </div>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'model' && (<>
      {/* Row 10 — Model card + Cortex prompts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Model Card — bundle_propensity_v3.4 + uplift_t_learner_v2')} action={<GitBranch className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Algorithms')}</div><div className="font-semibold">{tt('XGBoost (4) + T-Learner uplift')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Trained on')}</div><div className="font-semibold">{tt('14.2M customer-offers')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Features')}</div><div className="font-semibold">{tt('186 (incl. usage, household, footprint)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('AUC range')}</div><div className="font-semibold text-emerald-700">0.84 – 0.91</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Calibration ECE')}</div><div className="font-semibold text-emerald-700">{tt('0.018 (excellent)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Drift max')}</div><div className="font-semibold text-amber-700">{tt('0.09 (Sports — content shift)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Last retrained')}</div><div className="font-semibold">{tt('12 days ago')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Owner')}</div><div className="font-semibold">{tt('Commercial Analytics · A. Bain')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('DPA basis')}</div><div className="font-semibold">{tt('Marketing consent · DPIA-2024-MKT-12')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Hold-out actual lift')}</div><div className="font-semibold text-emerald-700">{tt('+38% vs control')}</div></div>
            <div className="col-span-2"><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Fairness')}</div><div className="font-semibold text-emerald-700">{tt('Demographic parity Δ &lt; 0.03 across age, county, social grade')}</div></div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
            <span className="font-mono text-vfes-dark/55">{tt('CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY')}</span>
            <a className="text-vfes-dark font-semibold flex items-center gap-1 hover:underline" href="#">Open lineage <ArrowUpRight className="w-3 h-3" /></a>
          </div>
        </Panel>

        <Panel title={tt('Snowflake Intelligence — Ask the data')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-2 text-sm">
            {[
              'Which 10K customers have highest REVConnect margin uplift, FTTH eligible, marketing consent on?',
              'How much margin do we lose to cannibalisation if we push Mega to existing REVConnect customers?',
              'Compare uplift of outbound call vs in-app for Sports bundle — which is more efficient?',
              'Show all customers in Q3 FTTH wave with Mega propensity > 0.7.',
              'Among Persuadables, what discount level maximises portfolio margin?',
              'Are any features driving fairness drift across age groups for Sports?',
            ].map((q) => (
              <button key={q} className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                <span className="flex-1">{q}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('BUNDLE_PROPENSITY')}</span></div>
        </Panel>
      </div>
      </>)}

      {/* ══ B2B ════════════════════════════════════════════════════════════════ */}
      {tab === 'b2b' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('B2B eligible accounts')} value="26.2K" delta={tt('SoHo + SMB + Mid + Enterprise')} trend="up" icon={Briefcase} accent />
          <KpiCard label={tt('Avg B2B score')} value="0.74" delta={tt('vs 0.62 consumer')} trend="up" icon={Target} />
          <KpiCard label={tt('ARR potential')} value="BSD 18.4M" delta={tt('incremental annual')} trend="up" icon={ArrowUpRight} />
          <KpiCard label={tt('Avg margin/account')} value="BSD 320/mo" delta={tt('mid-market peak')} trend="up" icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('B2B bundle propensity by segment')}>
            <div className="space-y-3">
              {b2bBundles.map((b) => (
                <div key={b.seg} className="flex items-center justify-between p-3 bg-[#fafbfc] rounded-lg border border-black/5">
                  <div className="flex-1">
                    <div className="font-bold text-sm">{b.seg}</div>
                    <div className="text-[11px] text-vfes-dark/55">{b.bundle}</div>
                    <div className="text-[10px] text-vfes-dark/45 mt-0.5">{(b.customers / 1000).toFixed(1)}K accounts</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Score · margin')}</div>
                    <div className="text-lg font-extrabold text-vfes-dark">{b.score.toFixed(2)}</div>
                    <div className="text-[11px] font-bold text-emerald-700">BSD {b.margin}/mo</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B Dashboard →')}</Link>
              <Link to="/portal/sales" className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
            </div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl border border-black/5 bg-[#fafbfc]">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Next B2B actions recommended by agent')}</div>
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 mt-0.5 shrink-0" /><span>{tt('Activate SoHo (1-9) with Business BB+Mobile — 18.4K accounts · score 0.84')}</span></div>
              <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 shrink-0" /><span>{tt('Scale SMB (10-49) with Cloud Voice+M365 — 6.2K accounts · margin BSD 84/mo')}</span></div>
              <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shrink-0" /><span>{tt('Present SD-WAN+Security to Mid-market (50-249) — 1.45K accounts · margin BSD 320/mo')}</span></div>
            </div>
          </div>

          <div className="mt-4">
            <Panel title={tt('B2B propensity score vs monthly margin by segment')}>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={b2bBundles} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} />
                    <YAxis type="category" dataKey="seg" stroke="#999" fontSize={9} width={140} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="score"  name={tt('Score')}  fill="#FF4438" radius={[0,4,4,0]} />
                    <Bar dataKey="margin" name={tt('Margin BSD ')} fill="#10B981" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('FTTH network unlock — B2B opportunity by quarter')}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={networkUnlock}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#999" fontSize={11} tickFormatter={(v) => `${v/1000}K`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}M`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar yAxisId="left" dataKey="premises" fill="#cbd5e1" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="unlock" stroke="#222128" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
              <Link to="/portal/experience" className="font-bold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ PERFORMANCE ════════════════════════════════════════════════════════ */}
      {tab === 'performance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Campaign Q4-26 ROI')} value="3.8×" delta={tt('+0.4× vs Q1')} trend="up" icon={ArrowUpRight} accent />
          <KpiCard label={tt('Conv. rate Q4-26')} value="23.2%" delta={tt('+2.1 pp vs Q1')} trend="up" icon={Target} />
          <KpiCard label={tt('Contacted Q4-26')} value="182K" delta={tt('+8K vs plan')} trend="up" icon={Users} />
          <KpiCard label={tt('Converted Q4-26')} value="42.2K" delta={tt('margin +BSD 5.8/cust')} trend="up" icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('ROI and conversion rate — 8 quarters')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={CAMPAIGN_PERF}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={10} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} tickFormatter={(v) => `${v.toFixed(1)}×`} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="roi" fill="#FF4438" radius={[4,4,0,0]} name={tt('ROI')} />
                  <Line yAxisId="r" type="monotone" dataKey="conv" stroke="#10B981" strokeWidth={2} dot name={tt('Conv. rate %')} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('ROI and conversion improve consistently — the propensity model gains precision with each retraining.')}</div>
          </Panel>

          <Panel title={tt('Contacted vs converted — volume 8 quarters')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CAMPAIGN_PERF}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="contacted" fill="#cbd5e1" radius={[4,4,0,0]} name={tt('Contacted')} />
                  <Bar dataKey="converted" fill="#10B981" radius={[4,4,0,0]} name={tt('Converted')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs">
          <Link to="/portal/marketing" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('Marketing Campaigns')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/contact-center" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('Contact Centre')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('AI Insights')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </>)}

      {/* ══ SEGMENTATION ═══════════════════════════════════════════════════════ */}
      {tab === 'segmentation' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', ...REGION_PROPENSITY.map(r => r.region)].map(r => (
            <button key={r} onClick={() => setGeoRegion(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${geoRegion === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r === 'All' ? tt('All') : r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Average propensity by Bahamian province')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={REGION_PROPENSITY.filter(r => geoRegion === 'All' || r.region === geoRegion)} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[0, 1]} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
                  <YAxis type="category" dataKey="region" stroke="#999" fontSize={10} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${(v*100).toFixed(1)}%`} />
                  <Bar dataKey="prop" radius={[0, 4, 4, 0]}>
                    {REGION_PROPENSITY.map((r, i) => <Cell key={i} fill={r.prop >= 0.70 ? '#10B981' : r.prop >= 0.60 ? '#FF4438' : '#F59E0B'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Nassau, Eleuthera and Grand Bahama lead — high correlation with FTTH coverage.')}</div>
          </Panel>

          <Panel title={tt('Propensity by demographic segment')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Segment')}</th>
                    <th className="text-right">{tt('Propensity')}</th>
                    <th className="text-right">{tt('Take rate')}</th>
                    <th className="text-right">{tt('ARPU BSD ')}</th>
                    <th>{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_SEGMENTS.map(s => (
                    <tr key={s.seg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{s.seg}</td>
                      <td className={`text-right font-bold ${s.prop >= 0.70 ? 'text-emerald-600' : s.prop >= 0.60 ? 'text-blue-600' : 'text-amber-600'}`}>{(s.prop*100).toFixed(0)}%</td>
                      <td className="text-right font-mono">{s.take}%</td>
                      <td className="text-right font-mono">BSD {s.arpu}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(s.note)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <Link to="/portal/customer-360" className="font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
              <Link to="/portal/digital-app" className="font-bold text-vfes-dark hover:underline">{tt('Digital App →')}</Link>
              <Link to="/portal/loyalty-consent" className="font-bold text-vfes-dark hover:underline">{tt('Consent →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs">
          <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('Mobile RAN')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/base-management" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('Base Management')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
            {tt('Churn & Retention')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </>)}

      <div className="mt-6 text-[10px] text-vfes-dark/30 uppercase tracking-widest border-t border-black/5 pt-3 flex flex-wrap gap-3">
        <span>{tt('Sources:')} <span className="font-mono">CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY</span> · <span className="font-mono">UPLIFT_T_LEARNER</span> · <span className="font-mono">FOOTPRINT_GRAPH</span></span>
        <Link to="/portal/executive" className="font-bold text-vfes-dark hover:underline ml-auto">{tt('Executive Dashboard →')}</Link>
        <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator →')}</Link>
        <Link to="/portal/product" className="font-bold text-vfes-dark hover:underline">{tt('Product →')}</Link>
        <Link to="/portal/finance" className="font-bold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        <Link to="/portal/voc" className="font-bold text-vfes-dark hover:underline">{tt('VOC →')}</Link>
        <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
      </div>
    </div>
  )
// BundlePropensityPage — 8-tab flagship page with XGBoost + T-Learner models
// Tabs: overview · uplift · channels · scenarios · model · b2b · performance · segmentation
// All model metrics sourced from Snowflake Model Registry · DPA: DPIA-2024-MKT-12
// Semantic view: CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY
// Demographic parity Δ < 0.03 across all segments — fairness check passing
}
