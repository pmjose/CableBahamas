import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Crown, Trophy, Medal, Award, TrendingUp, TrendingDown, Sparkles,
  AlertTriangle, Target, Users, Briefcase, Zap, GitBranch, ShieldCheck,
  MapPin, ArrowUpRight, Phone, Send, Activity, FlaskConical, Globe, Smartphone,
  BarChart3, Layers,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Cell, AreaChart, Area, ComposedChart, ScatterChart, Scatter,
  ZAxis, ReferenceLine, Legend,
} from 'recharts'
import { CLV_BY_LANE } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ---------------------------- Static demo data ---------------------------- //

const tiers = [
  { tier: 'Platinum', count: 84200,  avg: 4820, color: '#1e293b', icon: Crown,  margin: 0.46 },
  { tier: 'Gold',     count: 218400, avg: 2640, color: '#d97706', icon: Trophy, margin: 0.41 },
  { tier: 'Silver',   count: 412800, avg: 1480, color: '#64748b', icon: Medal,  margin: 0.36 },
  { tier: 'Bronze',   count: 324600, avg: 720,  color: '#92400e', icon: Award,  margin: 0.28 },
]

const cohorts = [
  { c: '2022 Q1', predicted: 2120, actual: 2186, lo: 2010, hi: 2230 },
  { c: '2022 Q3', predicted: 2240, actual: 2298, lo: 2125, hi: 2355 },
  { c: '2023 Q1', predicted: 2380, actual: 2410, lo: 2255, hi: 2505 },
  { c: '2023 Q3', predicted: 2460, actual: 2502, lo: 2330, hi: 2590 },
  { c: '2024 Q1', predicted: 2540, actual: 2548, lo: 2410, hi: 2670 },
  { c: '2024 Q3', predicted: 2620, actual: 2614, lo: 2480, hi: 2760 },
  { c: '2025 Q1', predicted: 2680, actual: null, lo: 2530, hi: 2830 },
  { c: '2025 Q3', predicted: 2740, actual: null, lo: 2570, hi: 2910 },
]

const distribution = Array.from({ length: 12 }, (_, i) => {
  const b = i * 1000
  const counts = [42, 88, 142, 186, 168, 138, 102, 76, 48, 28, 14, 8]
  return { bucket: `BSD ${b}`, n: counts[i] * 1000 }
})

// SHAP-like driver attribution (BSD  change in CLV per feature, signed)
const drivers = [
  { name: 'Tenure (>5 yrs)',          impact: 612 },
  { name: 'Bundle depth (3+)',        impact: 488 },
  { name: 'FTTH footprint',           impact: 342 },
  { name: 'Mobile + Broadband attach',impact: 296 },
  { name: 'NPS ≥ 9',                  impact: 254 },
  { name: 'Auto-pay / Direct Debit',  impact: 188 },
  { name: 'Household size ≥ 3',       impact: 142 },
  { name: 'Promo dependency',         impact: -174 },
  { name: 'Care contacts (>3/yr)',    impact: -226 },
  { name: 'Copper / FTTC area',       impact: -298 },
  { name: 'Out-of-contract > 60d',    impact: -384 },
  { name: 'Competitor overbuild',     impact: -512 },
]

// 10 deciles with cumulative CLV share (top decile = D1)
const deciles = [
  { d: 'D1',  share: 38, avg: 6120 },
  { d: 'D2',  share: 18, avg: 3340 },
  { d: 'D3',  share: 12, avg: 2280 },
  { d: 'D4',  share:  9, avg: 1690 },
  { d: 'D5',  share:  7, avg: 1280 },
  { d: 'D6',  share:  5, avg: 980  },
  { d: 'D7',  share:  4, avg: 760  },
  { d: 'D8',  share:  3, avg: 560  },
  { d: 'D9',  share:  2, avg: 360  },
  { d: 'D10', share:  2, avg: 180  },
]

// CLV-at-risk breakdown (BSD M)
const atRisk = [
  { reason: 'Out-of-contract < 90d',    valueM: 142, customers: 38400, color: '#dc2626' },
  { reason: 'Churn score > 0.7',        valueM:  98, customers: 24100, color: '#ea580c' },
  { reason: 'Competitor overbuild',     valueM:  74, customers: 19800, color: '#f59e0b' },
  { reason: '2+ care escalations',      valueM:  41, customers: 11200, color: '#eab308' },
  { reason: 'Promo expiring (60d)',     valueM:  36, customers: 14600, color: '#84cc16' },
]

const geoCLV = [
  { county: 'Nassau',    customers: 318000, avgCLV: 2180, footprint: 'FTTH+HFC',  share: 32 },
  { county: 'Freeport',      customers: 142000, avgCLV: 1860, footprint: 'FTTH+HFC',  share: 14 },
  { county: 'Abaco',    customers:  88000, avgCLV: 1720, footprint: 'FTTH',      share:  9 },
  { county: 'Eleuthera',  customers:  74000, avgCLV: 1690, footprint: 'FTTH+FTTC', share:  7 },
  { county: 'Exuma', customers:  46000, avgCLV: 1540, footprint: 'FTTC',      share:  5 },
  { county: 'Andros',  customers:  38000, avgCLV: 1480, footprint: 'FTTC',      share:  4 },
  { county: 'Bimini',     customers:  29000, avgCLV: 1340, footprint: 'Mobile+FTTC',share: 3 },
  { county: 'Other',     customers: 305000, avgCLV: 1280, footprint: 'Mixed',     share: 26 },
]

// Lifecycle quadrant (x = engagement % vs cohort, y = CLV growth YoY %, z = customer count)
const lifecycle = [
  { name: 'Growth Champions', x:  78, y:  22, z: 84200,  color: '#10b981', tier: 'Platinum/Gold' },
  { name: 'Stable Core',      x:  62, y:   4, z: 412800, color: '#3b82f6', tier: 'Silver' },
  { name: 'At-Risk Premium',  x:  34, y: -12, z:  68400, color: '#dc2626', tier: 'Platinum/Gold' },
  { name: 'Declining',        x:  22, y: -18, z: 124600, color: '#f59e0b', tier: 'Silver/Bronze' },
  { name: 'New / Onboarding', x:  54, y:  18, z:  62000, color: '#8b5cf6', tier: 'All' },
  { name: 'Dormant',          x:  12, y:  -6, z:  88000, color: '#64748b', tier: 'Bronze' },
]

const channels = [
  { ch: 'Organic / Direct',  cac:  85, clv: 2240, customers: 246000 },
  { ch: 'Retention Saves',   cac: 120, clv: 2880, customers:  82000 },
  { ch: 'Referral',          cac:  60, clv: 2410, customers:  74000 },
  { ch: 'Retail Stores',     cac: 240, clv: 2120, customers: 192000 },
  { ch: 'Paid Search',       cac: 310, clv: 1880, customers: 134000 },
  { ch: 'Affiliate',         cac: 220, clv: 1620, customers:  86000 },
  { ch: 'Door-to-Door',      cac: 380, clv: 1480, customers: 116000 },
  { ch: 'Paid Social',       cac: 290, clv: 1320, customers: 110000 },
]

// Retention action queue
const actionQueue = [
  { id: 'VM-102540', name: 'Emma Rolle',    tier: 'Platinum', clv: 5840, churn: 0.82, reason: 'Cancellation request · 2 missed payments', play: 'Save offer 50% / 6mo + Gigabit upgrade', value: 'Reduce churn 65%' },
  { id: 'VM-101203', name: 'Marie Knowles',  tier: 'Gold',     clv: 3120, churn: 0.74, reason: 'Promo expiring · competitor lookup',     play: 'Loyalty bundle + BSD 120 bill credit',          value: '+BSD 840 CLV' },
  { id: 'VM-104088', name: 'Thomas Ferguson',  tier: 'Gold',     clv: 2860, churn: 0.71, reason: 'Out-of-contract 14d · 3 care tickets',  play: 'Engineer visit + 2yr fixed price',           value: '+BSD 720 CLV' },
  { id: 'VM-101977', name: 'Lars Adderley',    tier: 'Silver',   clv: 1980, churn: 0.69, reason: 'Speed complaints · FTTC area',           play: 'FTTH migration when live (Q3)',              value: '+BSD 1,140 CLV' },
  { id: 'VM-100765', name: 'Sofie Bain',     tier: 'Silver',   clv: 1740, churn: 0.58, reason: 'Bundle dropped · mobile-only risk',      play: 'Mobile + Broadband re-attach offer',         value: '+BSD 620 CLV' },
]

// B2B (VMB) segments — synthetic demo
const b2b = [
  { seg: 'SoHo (1–9)',         customers: 18400, mrr:  92,  clv: 4120 },
  { seg: 'SMB (10–49)',        customers:  6200, mrr: 286,  clv: 12480 },
  { seg: 'Mid-market (50–249)',customers:  1450, mrr: 1240, clv: 64800 },
  { seg: 'Enterprise (250+)',  customers:   180, mrr: 8400, clv: 412000 },
]

// Benchmark vs peers
const BENCHMARK_PEERS = [
  { operator: 'Cable Bahamas', clv36: 1840, churn: 1.52, cac: 275, payback: 9.4,  color: '#FF4438' },
  { operator: 'BTC',  clv36: 1720, churn: 1.68, cac: 310, payback: 10.8, color: '#11567F' },
  { operator: 'Rival ISP A',    clv36: 1640, churn: 1.84, cac: 295, payback: 10.7, color: '#F59E0B' },
  { operator: 'Rival ISP C',  clv36: 1580, churn: 1.91, cac: 280, payback: 10.6, color: '#94a3b8' },
  { operator: 'Rival ISP C',     clv36: 1320, churn: 2.12, cac: 240, payback: 10.9, color: '#7C3AED' },
]

// CLV trend vs industry (quarterly)
const CLV_TREND_INDUSTRY = Array.from({ length: 8 }, (_, i) => ({
  q: `Q${(i % 4) + 1} ${2023 + Math.floor(i / 4)}`,
  cablebahamas: 1580 + i * 40,
  industry:  1560 + i * 24,
}))

// CLV cumulative curve year by year (avg per customer)
const curve = [
  { yr: 'Y0',  cum: 0 },
  { yr: 'Y1',  cum: 720 },
  { yr: 'Y2',  cum: 1280 },
  { yr: 'Y3',  cum: 1720 },
  { yr: 'Y4',  cum: 2080 },
  { yr: 'Y5',  cum: 2380 },
]

// ---------------------------- Helpers ---------------------------- //

const fmtBSD = (n: number) => `BSD ${n.toLocaleString()}`
const fmtBSDM = (n: number) => `BSD ${n.toFixed(0)}M`
const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n}%`

// ---------------------------- Page ---------------------------- //

const TABS = [
  { id: 'overview',   label: 'Overview',            icon: Activity    },
  { id: 'drivers',    label: 'Drivers',             icon: Zap         },
  { id: 'geo',        label: 'Geography & Cohorts', icon: Globe       },
  { id: 'scenarios',  label: 'Scenarios',           icon: FlaskConical},
  { id: 'model',      label: 'Model',               icon: GitBranch   },
  { id: 'b2b',        label: 'B2B / Business',      icon: Briefcase   },
  { id: 'retention',  label: 'Retention Queue',     icon: Phone       },
  { id: 'benchmark',  label: 'Benchmark',           icon: Target      },
] as const
type TabId = typeof TABS[number]['id']

export default function CLVExplorerPage() {
  const [churnReduction, setChurnReduction] = useState(2)
  const [priceLift, setPriceLift] = useState(0)
  const [retentionSpend, setRetentionSpend] = useState(4)
  const [showCum, setShowCum] = useState(false)
  const [pushed, setPushed] = useState<string[]>([])
  const [tab, setTab] = useState<TabId>('overview')
  const [tierFilter, setTierFilter] = useState<string>('All')
  const [benchmarkSort, setBenchmarkSort] = useState<'clv36' | 'churn' | 'cac'>('clv36')

  useEffect(() => { /* clear drill-down state on tab change */ }, [tab])

  const portfolioCLV = 1840
  // Slider: every +1% churn reduction ≈ 4% CLV uplift; price +1% ≈ 0.6% (after elasticity); retention spend has diminishing returns
  const upliftCLV = portfolioCLV * (1 + churnReduction * 0.04 + priceLift * 0.006 - 0.002 * priceLift * priceLift)
  const totalCustomers = useMemo(() => tiers.reduce((s, t) => s + t.count, 0), [])
  const portfolioUpliftBSD = Math.round((upliftCLV - portfolioCLV) * totalCustomers)
  const retentionROI = Math.round((churnReduction * 0.04 * portfolioCLV * totalCustomers) / (retentionSpend * 1_000_000))
  const totalAtRiskM = atRisk.reduce((s, r) => s + r.valueM, 0)
  const filteredTiers = useMemo(
    () => tierFilter === 'All' ? tiers : tiers.filter(t => t.tier === tierFilter),
    [tierFilter],
  )
  const sortedBenchmark = useMemo(
    () => [...BENCHMARK_PEERS].sort((a, b) =>
      benchmarkSort === 'churn' ? a[benchmarkSort] - b[benchmarkSort] : b[benchmarkSort] - a[benchmarkSort]
    ),
    [benchmarkSort],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('CLV Explorer')}
        subtitle={tt('36-month customer lifetime value forecasts · Snowpark ML + BG/NBD + Survival · WACC 8.5%')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> Model healthy · MAPE 4.2%
            </span>
            <span className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Use Case 4
            </span>
          </div>
        }
      />

      <AgentDecision
        title="CLV allocation agent"
        label="Run CLV Allocator" runningLabel="Scoring channels…"
        steps={[
          'Scored acquisition channels by CLV-to-CAC',
          'Ranked convergent & referral against paid',
          'Modelled portfolio-CLV lift from reallocation',
          'Flagged volume ceilings per channel',
        ]}
        hint="The allocator scores each acquisition channel by CLV-to-CAC and proposes where to shift spend."
        result={{
          headline: 'Shift acquisition spend toward high-CLV channels & convergent',
          stats: [
            { label: 'Portfolio CLV (36m)', value: 'BSD 248M' },
            { label: 'CLV : CAC', value: '6.7×' },
            { label: 'CAC payback', value: '9.4 mo' },
            { label: 'Lever', value: 'Budget reallocation' },
          ],
          findings: [
            'CLV-to-CAC is strongest on convergent and referral channels.',
            'Reallocating acquisition budget there raises portfolio CLV without growing spend.',
          ],
          note: 'High-CLV channels have lower volume ceilings — phase the shift to avoid starving volume.',
        }}
        impact="+CLV/CAC ratio · higher-quality adds"
        risk="high-CLV channels have lower volume ceilings"
        linkTo="#/portal/marketing" linkLabel="Open Marketing"
      />

      {/* ── ML Insight ─────────────────────────────────────────── */}
      <MlInsightSection
        heading="CLV strategy"
        models={[
          { name: 'CLV Forecast v4.1', metric: 'R² 0.87',    sub: 'GBR + Cox PH · 142 features' },
          { name: 'Tier-upgrade model', metric: 'AUC 0.82',  sub: 'XGBoost · 28.4M customer-months' },
          { name: 'Churn-CLV coupler',  metric: 'MAPE 4.2%', sub: 'Survival · WACC 8.5%' },
        ]}
        agentLabel="Run CLV Allocator"
        agentRunningLabel="Scoring channels…"
        agentSteps={[
          'Scored acquisition channels by CLV-to-CAC',
          'Ranked convergent & referral against paid',
          'Modelled portfolio-CLV lift from reallocation',
          'Flagged volume ceilings per channel',
        ]}
        agentBlurb="Scores each acquisition channel by CLV-to-CAC and proposes where to shift budget."
        decision={{
          title: 'Shift acquisition spend toward high-CLV channels & convergent',
          detail: 'Reallocating acquisition budget toward convergent and referral raises portfolio CLV without growing total spend.',
          impact: '+CLV/CAC ratio · higher-quality adds',
          risk: 'High-CLV channels have lower volume ceilings — phase the shift',
          linkTo: '#/portal/marketing',
          linkLabel: 'Open Marketing',
        }}
        chart={{
          kind: 'line',
          title: 'CLV trend — portfolio vs industry (quarterly)',
          data: CLV_TREND_INDUSTRY,
          xKey: 'q',
          series: [
            { key: 'cablebahamas', name: 'Cable Bahamas', color: '#FF4438' },
            { key: 'industry',  name: 'Industry avg', color: '#94a3b8', dashed: true },
          ],
          unit: 'BSD ',
          note: 'Cable Bahamas CLV growing 1.7× faster than industry — convergent mix is the structural advantage.',
        }}
        registryNote="Models trained on 28.4M customer-months · Snowpark ML · WACC 8.5% · DPA basis: Legitimate Interest."
      />

      {/* Related links strip */}
      <div className="flex gap-3 flex-wrap text-xs font-semibold mb-4">
        <Link to="/portal/executive"        className="text-vfes-dark hover:underline">{tt('Executive \u2192')}</Link>
        <Link to="/portal/churn-retention"  className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
        <Link to="/portal/base-management"  className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
      </div>

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
      {/* ============== Row 1 — Headline KPIs ============== */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('Portfolio CLV (36m, NPV)')} value="BSD 248M" delta="+4.8% MoM" trend="up" icon={TrendingUp} accent />
        <KpiCard label={tt('Avg CLV / Customer')}        value="BSD 1,150" delta="+BSD 42 MoM" trend="up" icon={Sparkles} />
        <KpiCard label={tt('CLV-at-Risk (90d)')}         value={`BSD ${totalAtRiskM}M`} delta={`${(totalAtRiskM*100/1910).toFixed(1)}% of portfolio`} trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('CLV : CAC ratio')}           value="6.7×" delta="Best-in-class > 3×" trend="up" icon={Target} />
      </div>

      {/* ============== Row 2 — Trust / model KPIs ============== */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('CAC Payback')}      value="9.4 mo" delta="−1.2 mo YoY"     trend="up"  icon={TrendingUp} />
        <KpiCard label={tt('Model R²')}         value="0.87"   delta="GBR + Survival"  trend="up"  icon={GitBranch} />
        <KpiCard label={tt('Forecast confidence')} value="±5.6%" delta="P10–P90 band"  trend="flat" icon={ShieldCheck} />
        <KpiCard label={tt('Last retrained')}   value="6 days" delta="Drift PSI 0.04"  trend="flat" icon={GitBranch} />
      </div>

      {/* CLV by lane — Fixed / Mobile / Convergent */}
      <Panel title={tt('CLV by lane — Fixed · Mobile · Convergent')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Convergent leads CLV')}</span>}>
        <div className="grid md:grid-cols-3 gap-4">
          {CLV_BY_LANE.map((l) => (
            <div key={l.lane} className="rounded-lg border border-black/5 p-4 bg-[#fafbfc]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: l.color }}>{tt(l.lane)}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              </div>
              <div className="text-3xl font-extrabold">BSD {l.clv.toLocaleString()}</div>
              <div className="text-[11px] text-vfes-dark/55 mb-3">{tt('36-month NPV')}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Annual churn')}</span><span className="font-semibold">{l.churnAnnual.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Avg tenure')}</span><span className="font-semibold">{l.tenureMonths} mo</span></div>
                <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('EBITDA margin')}</span><span className="font-semibold">{l.ebitdaMargin}%</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Convergent customers (Fixed + Mobile) deliver 2.4× the CLV of Fixed-only and 3.9× of Mobile-only — primary case for the 184K Mobile-only → Convergent upsell motion.')}</div>
      </Panel>

      {/* ============== Row 3 — Tier cards ============== */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {tiers.map((t) => {
          const Icon = t.icon
          return (
            <div key={t.tier} className="rounded-xl bg-white border border-black/5 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full grid place-items-center text-white" style={{ background: t.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold">{t.tier}</div>
                  <div className="text-xl font-extrabold">{(t.count / 1000).toFixed(1)}K</div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm text-vfes-dark/60">{tt('Avg CLV')}</div>
                  <div className="text-2xl font-bold text-vfes-dark">{fmtBSD(t.avg)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45">{tt('Margin CLV')}</div>
                  <div className="text-sm font-bold text-emerald-600">{fmtBSD(Math.round(t.avg * t.margin))}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      </>)}

      {tab === 'scenarios' && (
        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline">{tt('Pricing Simulator \u2192')}</Link>
          <Link to="/portal/marketing"         className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
          <Link to="/portal/loyalty-consent"   className="text-vfes-dark hover:underline">{tt('Loyalty & Consent \u2192')}</Link>
        </div>
      )}

      {tab === 'model' && (
        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/ai-insights"  className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
          <Link to="/portal/operations"   className="text-vfes-dark hover:underline">{tt('Operations \u2192')}</Link>
          <Link to="/portal/war-room"     className="text-vfes-dark hover:underline">{tt('War Room \u2192')}</Link>
        </div>
      )}

      {tab === 'drivers' && (<>
      {/* ============== Row 4 — Distribution + Scenario lab ============== */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel
            title={tt('CLV Distribution (BSD )')}
            action={
              <button
                onClick={() => setShowCum((v) => !v)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded bg-black/5 hover:bg-black/10"
              >
                {showCum ? 'Show buckets' : 'Show cumulative curve'}
              </button>
            }
          >
            <div className="h-72">
              <ResponsiveContainer>
                {showCum ? (
                  <AreaChart data={curve}>
                    <defs>
                      <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4438" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#FF4438" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="yr" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtBSD(v)} />
                    <Area type="monotone" dataKey="cum" stroke="#222128" strokeWidth={2} fill="url(#curveFill)" />
                  </AreaChart>
                ) : (
                  <BarChart data={distribution}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="n" fill="#FF4438" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-2">
              Source · <span className="font-mono">{tt('CBL_ANALYTICS.ML_OUTPUTS.CLV_FORECAST')}</span> · refreshed every 24h
            </div>
          </Panel>
        </div>

        <Panel title={tt('Scenario Lab — What-if')}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Reduce churn')}</span>
                <span className="font-bold text-vfes-dark">−{churnReduction}%</span>
              </div>
              <input type="range" min={0} max={5} step={0.5} value={churnReduction}
                onChange={(e) => setChurnReduction(parseFloat(e.target.value))}
                className="w-full accent-vfes-red" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Price lift (ARPU)')}</span>
                <span className="font-bold text-vfes-dark">+{priceLift}%</span>
              </div>
              <input type="range" min={0} max={6} step={0.5} value={priceLift}
                onChange={(e) => setPriceLift(parseFloat(e.target.value))}
                className="w-full accent-vfes-red" />
              <div className="text-[10px] text-vfes-dark/45 mt-1">{tt('Elasticity ε = −0.4 (baked into model)')}</div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/55">{tt('Retention spend (BSD M / qtr)')}</span>
                <span className="font-bold text-vfes-dark">BSD {retentionSpend}M</span>
              </div>
              <input type="range" min={1} max={12} step={1} value={retentionSpend}
                onChange={(e) => setRetentionSpend(parseFloat(e.target.value))}
                className="w-full accent-vfes-red" />
            </div>
          </div>
          <div className="space-y-2 pt-4 mt-4 border-t border-black/5 text-sm">
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Current avg CLV')}</span><span className="font-bold">{fmtBSD(portfolioCLV)}</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Projected avg CLV')}</span><span className="font-bold text-emerald-600">{fmtBSD(Math.round(upliftCLV))}</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('Portfolio uplift')}</span><span className="font-bold text-emerald-600">+BSD {(portfolioUpliftBSD / 1_000_000).toFixed(0)}M</span></div>
            <div className="flex justify-between border-t border-black/5 pt-2"><span className="text-vfes-dark/55">{tt('Retention ROI')}</span><span className="font-bold">{retentionROI}× spend</span></div>
          </div>
        </Panel>
      </div>

      {/* ============== Row 5 — Driver decomposition + Lifecycle quadrant ============== */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel
          title={tt('CLV Driver Decomposition (SHAP)')}
          action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('avg|SHAP| BSD 324')}</span>}
        >
          <div className="space-y-1.5">
            {drivers.map((d) => {
              const max = 612
              const w = (Math.abs(d.impact) / max) * 50
              const positive = d.impact >= 0
              return (
                <div key={tt(d.name)} className="grid grid-cols-[180px,1fr,80px] items-center gap-2 text-xs">
                  <span className="truncate text-vfes-dark/75">{tt(d.name)}</span>
                  <div className="relative h-5 bg-black/[0.03] rounded">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/15" />
                    <div
                      className={`absolute top-0 bottom-0 ${positive ? 'left-1/2 bg-emerald-500/85' : 'right-1/2 bg-red-500/85'}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <span className={`font-mono text-right ${positive ? 'text-emerald-700' : 'text-red-600'}`}>
                    {positive ? '+' : ''}BSD {d.impact}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-3 pt-3 border-t border-black/5">
            Top positive · tenure & FTTH attach · Top negative · competitor overbuild & out-of-contract
          </div>
        </Panel>

        <Panel
          title={tt('Lifecycle Quadrants — engagement × CLV growth')}
          action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('bubble = customer count')}</span>}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <ReferenceLine x={50} stroke="#cbd5e1" />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <XAxis type="number" dataKey="x" stroke="#999" fontSize={11} domain={[0, 100]}
                  label={{ value: 'Engagement %', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#999' }} />
                <YAxis type="number" dataKey="y" stroke="#999" fontSize={11} domain={[-25, 30]}
                  label={{ value: 'CLV growth YoY', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#999' }} />
                <ZAxis type="number" dataKey="z" range={[80, 800]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={tooltipStyle}
                  formatter={(_v: any, _n: any, p: any) => [`${(p.payload.z/1000).toFixed(0)}K customers · ${p.payload.tier}`, p.payload.name]}
                />
                <Scatter data={lifecycle}>
                  {lifecycle.map((s, i) => <Cell key={i} fill={s.color} fillOpacity={0.75} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
            {lifecycle.map((s) => (
              <div key={tt(s.name)} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="truncate text-vfes-dark/65">{tt(s.name)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ============== Row 6 — Deciles + CLV-at-risk ============== */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('CLV Decile Concentration')}>
          <div className="text-xs text-vfes-dark/55 mb-3">Top decile (D1) = <span className="font-bold text-vfes-dark">{tt('38% of portfolio CLV')}</span>{tt('· protect first')}</div>
          <div className="h-60">
            <ResponsiveContainer>
              <ComposedChart data={deciles}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={11} />
                <YAxis yAxisId="left" stroke="#999" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar yAxisId="left" dataKey="share" fill="#FF4438" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avg" stroke="#1e293b" strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Top 10%')}</div><div className="font-bold">{tt('BSD 94M CLV')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Top 30%')}</div><div className="font-bold">{tt('BSD 169M CLV')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Bottom 50%')}</div><div className="font-bold">{tt('BSD 52M CLV')}</div></div>
          </div>
        </Panel>

        <Panel
          title={tt('CLV-at-Risk · 90 day window')}
          action={<button onClick={() => alert('Pushed BSD 291M of at-risk CLV to retention queue')} className="text-[11px] font-semibold px-2.5 py-1 rounded bg-vfes-red text-vfes-dark hover:bg-vfes-red/90 flex items-center gap-1"><Send className="w-3 h-3" />{tt('Push to retention')}</button>}
        >
          <div className="text-3xl font-extrabold text-vfes-dark mb-1">BSD {totalAtRiskM}M</div>
          <div className="text-xs text-vfes-dark/55 mb-4">Across {atRisk.reduce((s, r) => s + r.customers, 0).toLocaleString()} customers · {(totalAtRiskM*100/1910).toFixed(1)}% of portfolio</div>
          <div className="space-y-2">
            {atRisk.map((r) => {
              const w = (r.valueM / totalAtRiskM) * 100
              return (
                <div key={r.reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{r.reason}</span>
                    <span className="text-vfes-dark/55">{fmtBSDM(r.valueM)} · {(r.customers/1000).toFixed(1)}K cust.</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded">
                    <div className="h-2 rounded" style={{ width: `${w}%`, background: r.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'geo' && (<>
      {/* ============== Row 7 — Geography + Cohort confidence ============== */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Geographic CLV by County')} action={<MapPin className="w-4 h-4 text-vfes-dark/40" />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55 text-left border-b border-black/5">
                <th className="py-2">{tt('County')}</th>
                <th>{tt('Customers')}</th>
                <th>{tt('Avg CLV')}</th>
                <th>{tt('Footprint')}</th>
                <th className="text-right">{tt('% Portfolio')}</th>
              </tr>
            </thead>
            <tbody>
              {geoCLV.map((g) => (
                <tr key={g.county} className="border-b border-black/5 last:border-0">
                  <td className="py-2 font-semibold">{g.county}</td>
                  <td className="text-vfes-dark/70">{(g.customers/1000).toFixed(0)}K</td>
                  <td className="font-bold text-vfes-dark">{fmtBSD(g.avgCLV)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      g.footprint.includes('FTTH') ? 'bg-emerald-50 text-emerald-700' :
                      g.footprint.includes('FTTC') ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>{g.footprint}</span>
                  </td>
                  <td className="text-right font-mono text-vfes-dark/70">{g.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-3 pt-3 border-t border-black/5">
            FTTH areas average <span className="font-bold text-emerald-700">{tt('+38% CLV')}</span> vs FTTC · capex prioritisation
          </div>
        </Panel>

        <Panel title={tt('Cohort Tracking — Predicted vs Actual ± P10/P90')}>
          <div className="h-60">
            <ResponsiveContainer>
              <ComposedChart data={cohorts}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4438" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#FF4438" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="c" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => v == null ? '—' : fmtBSD(v)} />
                <Area type="monotone" dataKey="hi" stroke="none" fill="url(#bandFill)" />
                <Area type="monotone" dataKey="lo" stroke="none" fill="#fff" />
                <Line type="monotone" dataKey="predicted" stroke="#222128" strokeWidth={2} dot={{ fill: '#FF4438' }} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-vfes-dark/55 mt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vfes-red" />{tt('Predicted')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500" />{tt('Actual')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-vfes-red/15 rounded-sm" />{tt('P10–P90 band')}</span>
            <span className="ml-auto font-mono text-[10px] text-vfes-dark/45">{tt('MAPE 4.2% · drift PSI 0.04')}</span>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'scenarios' && (<>
      {/* ============== Row 8 — Acquisition channels + B2B ============== */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('CLV by Acquisition Channel · CAC vs CLV')} action={<Zap className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="space-y-2">
            {channels.map((c) => {
              const ratio = c.clv / c.cac
              const ratioPct = Math.min(100, (ratio / 30) * 100)
              const good = ratio >= 6
              return (
                <div key={c.ch} className="grid grid-cols-[140px,1fr,90px] items-center gap-2 text-xs">
                  <span className="truncate text-vfes-dark/75 font-semibold">{c.ch}</span>
                  <div className="relative h-5 bg-black/[0.03] rounded">
                    <div className={`absolute top-0 bottom-0 left-0 rounded ${good ? 'bg-emerald-500/85' : 'bg-amber-500/85'}`} style={{ width: `${ratioPct}%` }} />
                    <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-white drop-shadow">
                      {ratio.toFixed(1)}× · CAC BSD {c.cac} → CLV {fmtBSD(c.clv)}
                    </div>
                  </div>
                  <span className="font-mono text-right text-vfes-dark/65">{(c.customers/1000).toFixed(0)}K</span>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 mt-3 pt-3 border-t border-black/5">
            Reallocate from <span className="font-bold text-amber-700">{tt('Door-to-Door / Paid Social')}</span> → <span className="font-bold text-emerald-700">{tt('Referral / Retention Saves')}</span>
          </div>
        </Panel>

        <Panel title={tt('Rival ISP A Business — CLV by Segment')} action={<Briefcase className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="space-y-3">
            {b2b.map((s) => (
              <div key={s.seg} className="flex items-center justify-between p-3 bg-[#fafbfc] rounded-lg border border-black/5">
                <div>
                  <div className="font-bold text-sm">{s.seg}</div>
                  <div className="text-[11px] text-vfes-dark/55">{(s.customers/1000).toFixed(1)}K accounts · MRR {fmtBSD(s.mrr)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Avg CLV')}</div>
                  <div className="text-lg font-extrabold text-vfes-dark">{fmtBSD(s.clv)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('B2B accounts')}</div><div className="font-bold">{tt('26.2K')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('B2B portfolio')}</div><div className="font-bold">{tt('BSD 282M')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('% of total CLV')}</div><div className="font-bold">14.8%</div></div>
          </div>
        </Panel>
      </div>

      {/* ============== Row 9 — Retention action queue ============== */}
      <div className="mb-6">
        <Panel
          title={tt('Retention Action Queue — Top CLV-at-Risk Customers')}
          action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('Ranked by CLV × churn × elasticity')}</span>}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55 text-left border-b border-black/5">
                <th className="py-2">{tt('Customer')}</th>
                <th>{tt('Tier')}</th>
                <th>{tt('CLV')}</th>
                <th>{tt('Churn')}</th>
                <th>{tt('Reason')}</th>
                <th>{tt('Recommended play')}</th>
                <th>{tt('Expected value')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {actionQueue.map((a) => {
                const isPushed = pushed.includes(a.id)
                return (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                    <td className="py-2.5">
                      <div className="font-semibold">{tt(a.name)}</div>
                      <div className="text-[11px] font-mono text-vfes-dark/55">{a.id}</div>
                    </td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/5">{a.tier}</span></td>
                    <td className="font-bold text-vfes-dark">{fmtBSD(a.clv)}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.churn > 0.7 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {(a.churn * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-xs text-vfes-dark/70 max-w-[200px]">{a.reason}</td>
                    <td className="text-xs">{a.play}</td>
                    <td className="text-xs font-bold text-emerald-700">{a.value}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setPushed((p) => p.includes(a.id) ? p : [...p, a.id])}
                        disabled={isPushed}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 ${
                          isPushed ? 'bg-emerald-50 text-emerald-700 cursor-default' : 'bg-vfes-red text-vfes-dark hover:bg-vfes-red/90'
                        }`}
                      >
                        {isPushed ? <><ShieldCheck className="w-3 h-3" />{tt('Queued')}</> : <><Phone className="w-3 h-3" />{tt('Push')}</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
            <div className="text-xs text-vfes-dark/55">Sourced from <span className="font-mono">{tt('CBL_ANALYTICS.ML_OUTPUTS.CHURN_V3_7')}</span> ⨝ <span className="font-mono">{tt('CLV_FORECAST')}</span> ⨝ <span className="font-mono">{tt('NEXT_BEST_ACTION')}</span></div>
            <div className="flex gap-2">
              <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Export to Salesforce')}</button>
              <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Export to Marketing Cloud')}</button>
            </div>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'model' && (<>
      {/* ============== Row 10 — Model card + Snowflake intel ============== */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Model Card — clv_v4.1')} action={<GitBranch className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Algorithm')}</div><div className="font-semibold">{tt('GBR + Survival (Cox PH)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Trained on')}</div><div className="font-semibold">{tt('28.4M customer-months')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Features')}</div><div className="font-semibold">{tt('142 (88 behavioural, 54 demo/geo)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Discount rate')}</div><div className="font-semibold">{tt('WACC 8.5%')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Holdout R²')}</div><div className="font-semibold text-emerald-700">{tt('0.87')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('MAPE')}</div><div className="font-semibold text-emerald-700">4.2%</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Drift (PSI)')}</div><div className="font-semibold text-emerald-700">{tt('0.04 · stable')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Last retrained')}</div><div className="font-semibold">{tt('6 days ago')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Owner')}</div><div className="font-semibold">{tt('Customer Analytics · M. Johnsonberghe')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('DPA basis')}</div><div className="font-semibold">{tt('Legitimate interest · DPIA-2024-CLV-04')}</div></div>
            <div className="col-span-2"><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Fairness')}</div><div className="font-semibold text-emerald-700">{tt('Demographic parity Δ &lt; 0.03 across age, county, tenure bands')}</div></div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
            <span className="font-mono text-vfes-dark/55">{tt('CBL_ANALYTICS.ML_OUTPUTS.CLV_FORECAST')}</span>
            <a className="text-vfes-dark font-semibold flex items-center gap-1 hover:underline" href="#">Open lineage <ArrowUpRight className="w-3 h-3" /></a>
          </div>
        </Panel>

        <Panel title={tt('Snowflake Intelligence — Ask the data')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-2 text-sm">
            {[
              'What is the average 3-year CLV for Gig1 customers acquired in Q3 2025?',
              'How much CLV is at risk from customers with churn score above 0.8?',
              'Which acquisition channel has the highest CLV-to-CAC ratio?',
              'Show CLV uplift if we reduce Bronze tier churn by 3% — and the retention budget needed.',
              'Which counties have CLV growth > 10% YoY and FTTH coverage < 60%?',
              'List Platinum customers out-of-contract in the next 60 days, ranked by CLV.',
            ].map((q) => (
              <button key={q} className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                <span className="flex-1">{q}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('CLV_FORECAST')}</span></div>
        </Panel>
      </div>
      </>)}

      {/* ═══════════════════════════ TAB: geo (links) ══════════ */}
      {tab === 'geo' && (
        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/network"         className="text-vfes-dark hover:underline">{tt('Network \u2192')}</Link>
          <Link to="/portal/base-management" className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
          <Link to="/portal/experience"      className="text-vfes-dark hover:underline">{tt('Experience \u2192')}</Link>
        </div>
      )}

      {/* ═══════════════════════════ TAB: b2b ═══════════════════ */}
      {tab === 'b2b' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('B2B portfolio CLV')}    value="\u20ac282M"  delta={tt('14.8% of total')}        trend="up"   icon={Briefcase} />
          <KpiCard label={tt('Enterprise avg CLV')}   value="\u20ac412K" delta={tt('per account')}            trend="up"   icon={Award}     accent />
          <KpiCard label={tt('B2B accounts')}         value="26.2K"  delta={tt('SoHo to Enterprise')}     trend="up"   icon={Users}    />
          <KpiCard label={tt('B2B churn rate')}       value="0.41%"  delta={tt('\u22123\u00d7 consumer rate')} trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('B2B CLV by segment')} action={<Briefcase className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={b2b}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="seg" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} tickFormatter={v => v >= 1000 ? `\u20ac${(v/1000).toFixed(0)}K` : `\u20ac${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtBSD(v)} />
                  <Bar dataKey="clv" radius={[6, 6, 0, 0]} name={tt('Avg CLV')}>
                    {b2b.map((_, i) => <Cell key={i} fill={['#1e293b','#d97706','#64748b','#92400e'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('B2B MRR by segment')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={b2b} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                  <YAxis type="category" dataKey="seg" stroke="#999" fontSize={10} width={130} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`\u20ac${v}/mo`, tt('MRR')]} />
                  <Bar dataKey="mrr" radius={[0,6,6,0]} name={tt('MRR \u20ac/mo')} fill="#FF4438" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Rival ISP A Business \u2014 CLV by segment detail')}>
          <div className="space-y-3">
            {b2b.map((s) => (
              <div key={s.seg} className="flex items-center justify-between p-3 bg-[#fafbfc] rounded-lg border border-black/5">
                <div>
                  <div className="font-bold text-sm">{tt(s.seg)}</div>
                  <div className="text-[11px] text-vfes-dark/55">{(s.customers/1000).toFixed(1)}K {tt('accounts')} · {tt('MRR')} {fmtBSD(s.mrr)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Avg CLV')}</div>
                  <div className="text-lg font-extrabold text-vfes-dark">{fmtBSD(s.clv)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/b2b"         className="text-vfes-dark hover:underline">{tt('B2B \u2192')}</Link>
          <Link to="/portal/company-360" className="text-vfes-dark hover:underline">{tt('Company 360 \u2192')}</Link>
          <Link to="/portal/sales"       className="text-vfes-dark hover:underline">{tt('Sales \u2192')}</Link>
        </div>
      </>)}

      {/* ═══════════════════════════ TAB: retention ════════════ */}
      {tab === 'retention' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CLV-at-risk total')} value={`\u20ac${totalAtRiskM}M`} delta={`${(totalAtRiskM*100/1910).toFixed(1)}% of portfolio`} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('At-risk customers')} value="107.6K"  delta={tt('across all risk reasons')} trend="down" icon={Users}    />
          <KpiCard label={tt('High-risk (score>0.7)')} value="24.1K" delta={tt('\u20ac98M CLV exposed')} trend="down" icon={TrendingDown} />
          <KpiCard label={tt('Queue value (EV)')} value="\u20ac11.9M"  delta={tt('expected value of queue')} trend="up"   icon={Target}   />
        </div>

        <div className="mb-6">
          <Panel
            title={tt('Retention action queue \u2014 top CLV-at-risk customers')}
            action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('Ranked by CLV \u00d7 churn \u00d7 elasticity')}</span>}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55 text-left border-b border-black/5">
                  <th className="py-2">{tt('Customer')}</th>
                  <th>{tt('Tier')}</th>
                  <th>{tt('CLV')}</th>
                  <th>{tt('Churn')}</th>
                  <th>{tt('Reason')}</th>
                  <th>{tt('Recommended play')}</th>
                  <th>{tt('Expected value')}</th>
                </tr>
              </thead>
              <tbody>
                {actionQueue.map((a) => {
                  const isPushed = pushed.includes(a.id)
                  return (
                    <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                      <td className="py-2.5">
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-[11px] font-mono text-vfes-dark/55">{a.id}</div>
                      </td>
                      <td><span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/5">{a.tier}</span></td>
                      <td className="font-bold text-vfes-dark">{fmtBSD(a.clv)}</td>
                      <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.churn > 0.7 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{(a.churn * 100).toFixed(0)}%</span></td>
                      <td className="text-xs text-vfes-dark/70 max-w-[200px]">{a.reason}</td>
                      <td className="text-xs">{a.play}</td>
                      <td className="text-xs font-bold text-emerald-700">{a.value}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>
        </div>

        <Panel title={tt('CLV-at-risk \u2014 90-day breakdown')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={atRisk}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="reason" stroke="#999" fontSize={9} tickFormatter={v => v.split(' ')[0]} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}M`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`\u20ac${v}M`, tt('CLV at risk')]} />
                <Bar dataKey="valueM" radius={[6,6,0,0]} name={tt('\u20acM at risk')}>
                  {atRisk.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/churn-retention" className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
          <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
          <Link to="/portal/mnp"             className="text-vfes-dark hover:underline">{tt('MNP Save Desk \u2192')}</Link>
        </div>
      </>)}

      {/* ═══════════════════════════ TAB: benchmark ════════════ */}
      {tab === 'benchmark' && (<>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold">{tt('Sort by:')}</span>
          {(['clv36', 'churn', 'cac'] as const).map(s => (
            <button key={s} onClick={() => setBenchmarkSort(s)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${benchmarkSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
              {tt(s === 'clv36' ? '36m CLV' : s === 'churn' ? 'Churn rate' : 'CAC')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Peer comparison \u2014 CLV vs churn rate')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedBenchmark}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="operator" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clv36" radius={[6,6,0,0]} name={tt('36m CLV \u20ac')}>
                    {sortedBenchmark.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Cable Bahamas leads peers on 36m CLV by +\u20ac120 vs nearest operator (BTC).')}</div>
          </Panel>

          <Panel title={tt('CLV trend vs industry \u2014 quarterly')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={CLV_TREND_INDUSTRY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cablebahamas" stroke="#222128" strokeWidth={2.5} name="Cable Bahamas" dot />
                  <Line type="monotone" dataKey="industry"  stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" name={tt('Industry avg')} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Full peer benchmark table')}>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-vfes-dark/55">{tt('Tier filter:')}</span>
            {['All', 'Platinum', 'Gold', 'Silver'].map(f => (
              <button key={f} onClick={() => setTierFilter(f)}
                className={`text-xs px-2.5 py-1 rounded font-semibold ${tierFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70'}`}>
                {tt(f)}
              </button>
            ))}
            <span className="text-[10px] text-vfes-dark/40 ml-2">{filteredTiers.length} {tt('tiers shown')}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                <th className="py-2 px-3">{tt('Operator')}</th>
                <th className="py-2 px-3 text-right">{tt('36m CLV \u20ac')}</th>
                <th className="py-2 px-3 text-right">{tt('Churn %')}</th>
                <th className="py-2 px-3 text-right">{tt('CAC \u20ac')}</th>
                <th className="py-2 px-3 text-right">{tt('Payback mo')}</th>
                <th className="py-2 px-3 text-right">{tt('CLV:CAC')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedBenchmark.map(p => (
                <tr key={p.operator} className={`border-b border-black/5 ${p.operator === 'Cable Bahamas' ? 'bg-vfes-red/5 font-semibold' : 'hover:bg-[#fafbfc]'}`}>
                  <td className="py-2 px-3 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.operator}</td>
                  <td className="py-2 px-3 text-right font-mono">\u20ac{p.clv36.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-mono ${p.churn > 1.8 ? 'text-red-600' : 'text-emerald-600'}`}>{p.churn}%</td>
                  <td className="py-2 px-3 text-right font-mono">\u20ac{p.cac}</td>
                  <td className="py-2 px-3 text-right font-mono">{p.payback} mo</td>
                  <td className="py-2 px-3 text-right font-bold">{(p.clv36 / p.cac).toFixed(1)}\u00d7</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
          <Link to="/portal/finance"     className="text-vfes-dark hover:underline">{tt('Finance \u2192')}</Link>
          <Link to="/portal/marketing"   className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
        </div>
      </>)}
    </div>
  )
}
