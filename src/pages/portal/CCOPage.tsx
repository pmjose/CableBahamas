// =============================================================================
// CCO Executive Cockpit — Chief Commercial Officer · Thomas Rolle
// 7 tabs · Revenue · Pipeline · Pricing · Bundles · Channels · Wholesale · Devices
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import KPI from './_kpi_facts'
import {
  TrendingUp, Building2, SlidersHorizontal, PackageSearch, Store, Boxes,
  Radio, Target, Banknote, Smartphone, DollarSign, Percent, Award, Users,
  ShoppingCart, ArrowUpRight, Zap, Globe,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const C1 = '#FF4438', C2 = '#11567F', C3 = '#10B981', C4 = '#F59E0B', C5 = '#7C3AED', C6 = '#94a3b8'

// ─── Revenue data ──────────────────────────────────────────────────────────────
const revByLane = [
  { mo: 'Jan', fixed: 20.8, mobile: 15.6, conv: 7.2, wholesale: 1.4 },
  { mo: 'Feb', fixed: 21.1, mobile: 15.9, conv: 7.6, wholesale: 1.4 },
  { mo: 'Mar', fixed: 21.4, mobile: 16.2, conv: 7.9, wholesale: 1.5 },
  { mo: 'Apr', fixed: 21.2, mobile: 16.1, conv: 8.2, wholesale: 1.5 },
  { mo: 'May', fixed: 21.6, mobile: 16.4, conv: 8.6, wholesale: 1.6 },
  { mo: 'Jun', fixed: 21.8, mobile: 16.6, conv: 9.0, wholesale: 1.6 },
]

const revenueByProduct = [
  { p: 'M100/M250 BB',       rev: 18.4, margin: 48 },
  { p: 'M500/M1Gb BB',       rev: 14.2, margin: 52 },
  { p: 'Mobile (postpaid)',  rev: 16.6, margin: 44 },
  { p: 'Convergent (REVConnect)',  rev: 9.0,  margin: 58 },
  { p: 'TV (Sports add-on · Sports package)', rev: 5.8, margin: 36 },
  { p: 'B2B managed svcs',   rev: 6.4,  margin: 62 },
  { p: 'Wholesale/MVNO',     rev: 1.6,  margin: 28 },
]

// ─── Pipeline data ────────────────────────────────────────────────────────────
const pipelineBySegment = [
  { seg: 'SoHo',          pipeM: 4.8,  wonM: 1.6, winRate: 38, avgDeal: 1200  },
  { seg: 'Mid-market',    pipeM: 12.4, wonM: 3.8, winRate: 32, avgDeal: 6400  },
  { seg: 'Enterprise',    pipeM: 18.6, wonM: 5.2, winRate: 28, avgDeal: 18400 },
  { seg: 'Public Sector', pipeM: 4.4,  wonM: 2.2, winRate: 42, avgDeal: 24000 },
]

const pipelineWeekly = [
  { wk: 'S1', created: 4.2, won: 1.6, lost: 0.8 },
  { wk: 'S2', created: 4.8, won: 2.1, lost: 0.7 },
  { wk: 'S3', created: 4.4, won: 1.9, lost: 0.9 },
  { wk: 'S4', created: 5.2, won: 2.4, lost: 1.1 },
  { wk: 'S5', created: 4.6, won: 2.2, lost: 0.8 },
  { wk: 'S6', created: 5.0, won: 2.3, lost: 0.9 },
]

const topDeals: {
  id: string; acc: string; seg: string; valueK: number; stage: string; prob: number; owner: string
}[] = [
  { id: 'OPP-9001', acc: 'Commonwealth Bank (demo) · 48 sites',           seg: 'Enterprise',    valueK: 4800, stage: 'Negotiation', prob: 72, owner: 'A. Willems'  },
  { id: 'OPP-8991', acc: 'Island Bank (demo) · SD-WAN national',             seg: 'Enterprise',    valueK: 3200, stage: 'Proposal',    prob: 48, owner: 'A. Willems'  },
  { id: 'OPP-8980', acc: 'City of Nassau',                   seg: 'Public',         valueK: 3600, stage: 'Negotiation', prob: 64, owner: 'E. Knowles'  },
  { id: 'OPP-8974', acc: 'Port Authority · IoT fleet',     seg: 'Enterprise',    valueK: 2400, stage: 'Proposal',    prob: 52, owner: 'D. Bain'     },
  { id: 'OPP-8962', acc: 'UZ Eleuthera Hospital',                seg: 'Public',         valueK: 1800, stage: 'Negotiation', prob: 70, owner: 'N. Vermeulen' },
  { id: 'OPP-8954', acc: 'BTC Enterprise · UC & mobility', seg: 'Mid-market', valueK: 2100, stage: 'Proposal',    prob: 42, owner: 'D. Bain'     },
]

// ─── Pricing data ─────────────────────────────────────────────────────────────
const TIER_KEYS = ['All', 'M100', 'M250', 'M500', 'M1Gb'] as const
type TierFilter = typeof TIER_KEYS[number]

const pricingTiers = [
  { tier: 'M100',  price: 26.99, cost: 14.2, margin: 47.3, subs: 180_000, elasticity: -1.8, mktShare: 12.4 },
  { tier: 'M250',  price: 34.99, cost: 16.8, margin: 52.0, subs: 240_000, elasticity: -1.4, mktShare: 18.6 },
  { tier: 'M500',  price: 44.99, cost: 19.4, margin: 56.9, subs: 280_000, elasticity: -0.9, mktShare: 22.8 },
  { tier: 'M1Gb',  price: 56.99, cost: 22.6, margin: 60.4, subs: 120_000, elasticity: -0.6, mktShare: 8.2  },
]

const arpuTrend = [
  { mo: 'Q1 24', mobile: 61.2, fixed: 39.8, conv: 94.4 },
  { mo: 'Q2 24', mobile: 61.8, fixed: 40.2, conv: 95.8 },
  { mo: 'Q3 24', mobile: 62.4, fixed: 40.6, conv: 96.8 },
  { mo: 'Q4 24', mobile: 62.8, fixed: 40.8, conv: 97.6 },
  { mo: 'Q1 25', mobile: 63.2, fixed: 41.2, conv: 98.4 },
  { mo: 'Q2 25', mobile: 63.8, fixed: 41.6, conv: 99.2 },
]

type CompRow = { comp: string; m100: number | null; m250: number | null; m500: number | null; m1gb: number | null }
const competitorPricing: CompRow[] = [
  { comp: 'Cable Bahamas',    m100: 26.99, m250: 34.99, m500: 44.99, m1gb: 56.99 },
  { comp: 'BTC',   m100: 28.99, m250: 36.99, m500: 46.99, m1gb: 58.99 },
  { comp: 'Rival ISP A',     m100: 24.99, m250: 31.99, m500: 39.99, m1gb: 51.99 },
  { comp: 'Rival ISP B',       m100: 19.99, m250: 27.99, m500: null,  m1gb: null  },
  { comp: 'Rival ISP C',      m100: 22.99, m250: 29.99, m500: 38.99, m1gb: 49.99 },
]

const priceHistory = [
  { mo: 'Jan', m250: 33.99, m500: 42.99, m1gb: 54.99 },
  { mo: 'Mar', m250: 33.99, m500: 44.99, m1gb: 55.99 },
  { mo: 'Jun', m250: 34.99, m500: 44.99, m1gb: 56.99 },
  { mo: 'Sep', m250: 34.99, m500: 44.99, m1gb: 56.99 },
  { mo: 'Dec', m250: 34.99, m500: 44.99, m1gb: 56.99 },
  { mo: 'Mar+', m250: 34.99, m500: 44.99, m1gb: 56.99 },
]

// ─── Bundle data ──────────────────────────────────────────────────────────────
const bundles = [
  { name: 'BB solo',           subs: 420_000,   arpu: 38.4, margin: 48, attach: 0,  color: C1 },
  { name: 'BB + TV basic',    subs: 160_000,   arpu: 54.8, margin: 42, attach: 38, color: C2 },
  { name: 'REVConnect (BB+Mobile)',   subs: 280_000,   arpu: 78.6, margin: 58, attach: 62, color: C3 },
  { name: 'Mega (BB+TV+Mobile)',subs: 140_000,   arpu: 94.2, margin: 61, attach: 74, color: C4 },
  { name: 'Mobile solo',        subs: 8_400_000, arpu: 16.8, margin: 44, attach: 0,  color: C5 },
  { name: 'B2B Fibre',         subs: 24_000,    arpu: 124.0,margin: 62, attach: 88, color: C6 },
]

const bundleAttachTrend = [
  { mo: 'Jan', volt: 58, mega: 48, tvBasic: 34 },
  { mo: 'Feb', volt: 59, mega: 49, tvBasic: 35 },
  { mo: 'Mar', volt: 60, mega: 51, tvBasic: 36 },
  { mo: 'Apr', volt: 61, mega: 52, tvBasic: 37 },
  { mo: 'May', volt: 62, mega: 54, tvBasic: 38 },
  { mo: 'Jun', volt: 62, mega: 55, tvBasic: 38 },
]

const bundleMargin = [
  { b: 'BB solo',  gm: 48, contrib: 19.6 },
  { b: 'REVConnect',     gm: 58, contrib: 28.4 },
  { b: 'Mega',     gm: 61, contrib: 14.2 },
  { b: 'BB+TV',    gm: 42, contrib: 8.8  },
  { b: 'Mobile',    gm: 44, contrib: 18.6 },
  { b: 'B2B Fib.', gm: 62, contrib: 7.4  },
]

// ─── Channel data ─────────────────────────────────────────────────────────────
const CH_KEYS = ['All', 'Web DTC', 'Phones', 'Retail', 'Doorstep', 'Partner'] as const
type ChannelFilter = typeof CH_KEYS[number]

const channels = [
  { ch: 'Web DTC',   gross: 1980, cpga: 84,  conv: 6.4,  nps30: 42, color: C1 },
  { ch: 'Phones',    gross: 840,  cpga: 64,  conv: 14.6, nps30: 34, color: C2 },
  { ch: 'Retail',    gross: 680,  cpga: 92,  conv: 12.4, nps30: 38, color: C3 },
  { ch: 'Doorstep',  gross: 420,  cpga: 112, conv: 18.2, nps30: 28, color: C4 },
  { ch: 'Partner',   gross: 340,  cpga: 96,  conv: 11.2, nps30: 30, color: C5 },
]

const dealerScorecard = [
  { dealer: 'TeleLink Nassau',     gross: 280, cpga: 88,  nps: 36, compliance: 96, tier: 'Gold'   },
  { dealer: 'ConnectBE Freeport',      gross: 224, cpga: 92,  nps: 32, compliance: 94, tier: 'Gold'   },
  { dealer: 'VoxPro Abaco',        gross: 168, cpga: 96,  nps: 30, compliance: 91, tier: 'Silver' },
  { dealer: 'Retail Direct Exuma',gross: 142, cpga: 102, nps: 28, compliance: 88, tier: 'Silver' },
  { dealer: 'MobileShop Andros',  gross: 86,  cpga: 108, nps: 24, compliance: 82, tier: 'Bronze' },
  { dealer: 'TeleStar Bimini',    gross: 72,  cpga: 114, nps: 22, compliance: 78, tier: 'Watch'  },
]

// ─── Wholesale data ───────────────────────────────────────────────────────────
const mvnoPartners = [
  { partner: 'Lycamobile (MVNO)',  subs: 640_000, revMoM: 0.62, margin: 22, trend: 'up'   },
  { partner: 'Mobile Vikings',      subs: 480_000, revMoM: 0.48, margin: 24, trend: 'flat' },
  { partner: 'Carrefour Mobile',   subs: 280_000, revMoM: 0.28, margin: 20, trend: 'down' },
  { partner: 'Super Value Mobile (demo)',     subs: 120_000, revMoM: 0.12, margin: 18, trend: 'flat' },
  { partner: 'Hits Mobile',        subs: 64_000,  revMoM: 0.06, margin: 21, trend: 'up'   },
  { partner: 'Neutral B2B access', subs: 0,        revMoM: 0.04, margin: 38, trend: 'up'   },
]

const wholesaleTrend = [
  { mo: 'Jan', mvno: 1.56, neutral: 0.24, roaming: 0.18 },
  { mo: 'Feb', mvno: 1.58, neutral: 0.26, roaming: 0.20 },
  { mo: 'Mar', mvno: 1.60, neutral: 0.28, roaming: 0.22 },
  { mo: 'Apr', mvno: 1.62, neutral: 0.30, roaming: 0.24 },
  { mo: 'May', mvno: 1.64, neutral: 0.32, roaming: 0.26 },
  { mo: 'Jun', mvno: 1.66, neutral: 0.34, roaming: 0.28 },
]

// ─── Devices ──────────────────────────────────────────────────────────────────

const deviceFinancing = [
  { tier: 'Flagship >BSD 900', units: 28_000,  pctFinanced: 84, avgEMI: 48.4, delinq: 1.2 },
  { tier: 'Premium BSD 500-900',units: 64_000, pctFinanced: 72, avgEMI: 28.6, delinq: 1.8 },
  { tier: 'Mid BSD 200-500',   units: 142_000, pctFinanced: 48, avgEMI: 14.2, delinq: 2.4 },
  { tier: 'Entry <BSD 200',   units: 86_000,  pctFinanced: 24, avgEMI: 8.4,  delinq: 3.6 },
]

const deviceBrands = [
  { brand: 'Samsung', share: 38, avgASP: 642, churnProtect: 62 },
  { brand: 'Apple',   share: 28, avgASP: 984, churnProtect: 78 },
  { brand: 'Xiaomi',  share: 18, avgASP: 284, churnProtect: 44 },
  { brand: 'OPPO',    share: 8,  avgASP: 348, churnProtect: 42 },
  { brand: 'Other',   share: 8,  avgASP: 224, churnProtect: 38 },
]

const tradeInTrend = [
  { mo: 'Jan', tradeIns: 8400,  avgResidual: 142 },
  { mo: 'Feb', tradeIns: 8800,  avgResidual: 146 },
  { mo: 'Mar', tradeIns: 9200,  avgResidual: 148 },
  { mo: 'Apr', tradeIns: 9600,  avgResidual: 152 },
  { mo: 'May', tradeIns: 10000, avgResidual: 156 },
  { mo: 'Jun', tradeIns: 10200, avgResidual: 158 },
]

// ─── Win/Loss & Competitive ────────────────────────────────────────────────────
const winLossReasons = [
  { reason: 'Lower competitor price', won: 12, lost: 48 },
  { reason: 'Coverage / availability',  won: 28, lost: 22 },
  { reason: 'Speed / performance',      won: 34, lost: 14 },
  { reason: 'Customer service',         won: 18, lost: 32 },
  { reason: 'Bundle / convergent',      won: 44, lost: 12 },
  { reason: 'B2B contractual SLA',      won: 22, lost: 18 },
]
const winRateTrend = [
  { mo: 'Jan', winRate: 28.4, targetWin: 35 },
  { mo: 'Feb', winRate: 29.2, targetWin: 35 },
  { mo: 'Mar', winRate: 30.1, targetWin: 35 },
  { mo: 'Apr', winRate: 31.4, targetWin: 35 },
  { mo: 'May', winRate: 32.4, targetWin: 35 },
  { mo: 'Jun', winRate: 32.4, targetWin: 35 },
]
const competitiveThreats = [
  { competitor: 'Rival ISP B',    threat: '1Gb at BSD 30/mo — pressure on M250/M500',     severity: 'high',   segment: 'Consumer',   impact: '-BSD 2.4M ARR' },
  { competitor: 'BTC', threat: '5G SA 90% pop expansion — mobile pressure', severity: 'high',   segment: 'Mobile',     impact: 'Churn risk 0.3%' },
  { competitor: 'Rival ISP C',      threat: 'Entry price BSD 20/mo — low-end base',          severity: 'medium', segment: 'Prepaid',    impact: '-BSD 0.8M ARR' },
  { competitor: 'Rival ISP A',   threat: 'Family bundles without TV — lite alternative', severity: 'medium', segment: 'Family',   impact: 'Attach -2pp risk' },
  { competitor: 'Rival ISP A',   threat: 'Rural fibre subsidy programme',              severity: 'low',    segment: 'Rural',      impact: 'Coverage neutral' },
]
const churnToCompetitor = [
  { competitor: 'Rival ISP B',  churned: 1840, recaptured: 420, color: C1 },
  { competitor: 'BTC',  churned: 1420, recaptured: 680, color: C2 },
  { competitor: 'Rival ISP B',      churned: 840,  recaptured: 120, color: C3 },
  { competitor: 'Rival ISP C',     churned: 620,  recaptured: 280, color: C4 },
  { competitor: 'Rival ISP A',    churned: 480,  recaptured: 340, color: C6 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'pipeline' | 'pricing' | 'bundles' | 'channels' | 'wholesale' | 'devices' | 'winloss'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',  label: 'Overview'               },
  { id: 'pipeline',  label: 'Sales & Pipeline'       },
  { id: 'pricing',   label: 'Pricing'                },
  { id: 'bundles',   label: 'Product / Bundles'      },
  { id: 'channels',  label: 'Channel / Dealers'      },
  { id: 'wholesale', label: 'Wholesale'              },
  { id: 'devices',   label: 'Devices'                },
  { id: 'winloss',   label: 'Win/Loss & Competitive' },
]

const fmtBsd = (n: number | null) => n != null ? `BSD ${n}` : '—'
const tierColor = (t: string) =>
  t === 'Gold' ? 'bg-yellow-100 text-yellow-700'
  : t === 'Silver' ? 'bg-zinc-100 text-zinc-600'
  : t === 'Bronze' ? 'bg-amber-100 text-amber-700'
  : 'bg-red-100 text-red-700'

// =============================================================================
export default function CCOPage() {
  const [tab, setTab] = useState<TabId>('overview')
  useEffect(() => { try { localStorage.setItem('cco-tab', tab) } catch { /* ignore */ } }, [tab])

  const [tierFilter, setTierFilter] = useState<TierFilter>('All')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('All')

  const filteredTiers = useMemo(
    () => tierFilter === 'All' ? pricingTiers : pricingTiers.filter(p => p.tier === tierFilter),
    [tierFilter],
  )
  const filteredChannels = useMemo(
    () => channelFilter === 'All' ? channels : channels.filter(c => c.ch === channelFilter),
    [channelFilter],
  )
  const totals = useMemo(() => ({
    totalGrossAdds: channels.reduce((s, c) => s + c.gross, 0),
    totalMvnoSubs:  mvnoPartners.reduce((s, m) => s + m.subs, 0),
    pipelineTotal:  pipelineBySegment.reduce((s, p) => s + p.pipeM, 0),
    topDealPipeM:   (topDeals.reduce((s, d) => s + d.valueK, 0) / 1000).toFixed(1),
  }), [])

  const revSummary = useMemo(() => {
    const latest = revByLane[revByLane.length - 1]
    const first  = revByLane[0]
    const latestTotal = latest.fixed + latest.mobile + latest.conv + latest.wholesale
    const firstTotal  = first.fixed + first.mobile + first.conv + first.wholesale
    const convGrowth  = ((latest.conv - first.conv) / first.conv * 100).toFixed(1)
    return { latestTotal: latestTotal.toFixed(1), growth: ((latestTotal - firstTotal) / firstTotal * 100).toFixed(1), convGrowth }
  }, [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Commercial Officer')}
        subtitle={tt('Office of the CCO · Thomas Rolle · revenue, pricing & B2B · FY2026')}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/portal/pricing-simulator" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> {tt('Pricing Simulator')}
            </Link>
            <Link to="/portal/sales" className="border border-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-vfes-red/5">
              <TrendingUp className="w-4 h-4" /> {tt('Open Sales')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Commercial intelligence"
        models={[
          { name: 'Price-elasticity Model',   metric: 'R² 0.88',  sub: 'demand response by lane'           },
          { name: 'B2B Lead Scorer',           metric: 'AUC 0.89', sub: 'pipeline conversion'               },
          { name: 'Bundle Propensity (NBO)',   metric: 'lift 3.1×',sub: 'convergent next-best-offer'        },
        ]}
        agentLabel="Run Commercial Planner" agentRunningLabel="Optimising…"
        agentSteps={[
          'Modelled price response by lane vs competitor moves',
          'B2B pipeline scored and must-win deals ranked',
          'Generated next-best-offer for convergent base (84K households)',
          'Quantified margin impact of each pricing scenario',
        ]}
        agentBlurb="Elasticity, propensity and pipeline scored from a single customer model — pricing decisions are simulated on the real base, not a spreadsheet."
        decision={{
          title: 'Hold M500 price and activate convergent NBO on 84K households',
          detail: 'Elasticity shows the M500 tier is inelastic vs Rival ISP B promotion, so holding price protects margin. The freed budget funds a convergent NBO push to 84K high-propensity households — the highest-ROI move.',
          impact: '+BSD 2.6M ARPU uplift · protects margin',
          risk: 'monitor Rival ISP B response weekly — review if they relaunch promotion',
          linkTo: '#/portal/pricing-simulator', linkLabel: 'Open Pricing Simulator',
        }}
        chart={{
          kind: 'bar', title: 'Monthly revenue by lane (BSD M)', xKey: 'mo', unit: 'M',
          data: revByLane,
          series: [
            { key: 'fixed',     name: 'Fixed',        color: C1 },
            { key: 'mobile',    name: 'Mobile',        color: C2 },
            { key: 'conv',      name: 'Convergent',    color: C3 },
            { key: 'wholesale', name: 'Wholesale',     color: C4 },
          ],
          note: `Total BSD ${KPI.revenueQtrM}M/quarter — convergent growing +25% YoY.`,
        }}
      />

      {/* ── Tab nav ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ════════════════════════ OVERVIEW ════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Revenue (quarter)')}    value={`BSD ${KPI.revenueQtrM}M`}       delta="+5.8% YoY"         trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('EBITDA margin')}         value={`${KPI.ebitdaMarginPct}%`}    delta="+1.2 pp YoY"       trend="up"   icon={Percent}    />
          <KpiCard label={tt('B2B pipeline')}          value={`BSD ${KPI.b2bPipelineM}M`}      delta="3.4× coverage"     trend="up"   icon={Building2}  />
          <KpiCard label={tt('Net adds (Q)')}          value={`${KPI.netAddsQK}K`}          delta="+18% vs plan"      trend="up"   icon={Users}      />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Mobile ARPU')}           value={`BSD ${KPI.arpuMobile}`}         delta="+1.2% quarterly"   trend="up"   icon={Smartphone} />
          <KpiCard label={tt('Fixed ARPU')}            value={`BSD ${KPI.arpuFixed}`}          delta="stable"            trend="flat" icon={Banknote}   />
          <KpiCard label={tt('REVConnect attach')}           value="62%"                          delta="+4 pp quarterly"   trend="up"   icon={Boxes}      />
          <KpiCard label={tt('Convergent NPS')}        value="+42"                          delta="best The Bahamas"       trend="up"   icon={Award}      />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CCO domain')}
            links={[
              { to: 'sales',              label: 'Sales',                  metric: tt('Share · pipeline · win-rate'),   icon: TrendingUp      },
              { to: 'b2b',                label: 'B2B / Wholesale',        metric: `BSD ${KPI.b2bPipelineM}M ${tt('pipeline')}`, icon: Building2 },
              { to: 'pricing-simulator',  label: 'Pricing Simulator',      metric: tt('Elasticity · margin impact'),    icon: SlidersHorizontal },
              { to: 'price-wargame',      label: 'Price-Response War-game', metric: tt('Competitor scenarios'),         icon: Target          },
              { to: 'product',            label: 'Product & Content',      metric: tt('Portfolio · attach rates'),      icon: PackageSearch   },
              { to: 'bundle-profitability',label: 'Bundle Profitability',  metric: tt('Margin by bundle'),              icon: Boxes           },
              { to: 'channel-dealers',    label: 'Channel & Dealers',      metric: tt('Indirect sales · commissions'),  icon: Store           },
              { to: 'device-financing',   label: 'Device & Trade-in',      metric: tt('Financing · residuals'),         icon: Smartphone      },
              { to: 'mvno-wholesale',     label: 'MVNO & Wholesale',       metric: tt('Partner revenue'),               icon: Radio           },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Commercial priorities — FY2026')}
              items={[
                { name: 'Grow B2B and wholesale 30%',          owner: tt('CRO · T. Rolle'),  pct: 62, status: 'at-risk'  },
                { name: 'Close 50 new enterprise logos',         owner: tt('B2B Sales'),         pct: 64, status: 'on-track' },
                { name: 'Convergent penetration > 45%',         owner: tt('Consumer'),          pct: 71, status: 'on-track' },
                { name: 'SD-WAN product launch',                 owner: tt('Product'),           pct: 68, status: 'on-track' },
                { name: 'Wholesale partner programme',           owner: tt('Wholesale'),         pct: 38, status: 'at-risk'  },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CCO desk')}
            items={[
              { text: tt('Rival ISP B 1 Gb at BSD 30/mo — impacts M250/M500'), level: 'high'   },
              { text: tt('Two enterprise deals slipped to Q4 — forecast risk'),       level: 'high' },
              { text: tt('Commonwealth Bank (demo) connectivity framework signed — BSD 4.2M ACV'),        level: 'low'  },
              { text: tt('Public sector tender delays'),                              level: 'medium'},
            ]}
          />
        </div>

        <div className="mt-6">
          <Panel title={tt('Revenue by lane — 6 month trend')} insight={{ insight: 'The Convergent lane leads growth at +25% over 6 months, well above Fixed (+1.4%) and Mobile (+6.4%), with combined revenue of BSD 49M.', action: 'Redirect channel incentives toward convergent selling to accelerate migration from standalone products in the residential segment.', impact: 'Each +5 pp of convergent penetration adds BSD 2.5M annually via the ARPU differential vs Fixed or Mobile standalone.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={revByLane}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="fixed"     name={tt('Fixed')}         stroke={C1} fill={C1} fillOpacity={0.25} stackId="a" />
                  <Area type="monotone" dataKey="mobile"    name={tt('Mobile')}         stroke={C2} fill={C2} fillOpacity={0.25} stackId="a" />
                  <Area type="monotone" dataKey="conv"      name={tt('Convergent')}    stroke={C3} fill={C3} fillOpacity={0.25} stackId="a" />
                  <Area type="monotone" dataKey="wholesale" name={tt('Wholesale')}      stroke={C4} fill={C4} fillOpacity={0.25} stackId="a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-vfes-dark/55 uppercase tracking-widest">
              <span>{tt('Fixed')}: BSD 21.8M <span className="text-emerald-600 font-bold">+1.4% vs Jan</span></span>
              <span>{tt('Mobile')}: BSD 16.6M <span className="text-emerald-600 font-bold">+6.4%</span></span>
              <span>{tt('Convergent')}: BSD 9.0M <span className="text-emerald-600 font-bold">+25%</span></span>
              <span>{tt('Wholesale')}: BSD 1.6M <span className="text-emerald-600 font-bold">+14%</span></span>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <AgendaList
            title={tt('CCO cadence')}
            items={[
              { what: tt('Weekly commercial review'),       when: tt('Mon 09:00')    },
              { what: tt('B2B pipeline deal-desk'),          when: tt('Wed 15:00')    },
              { what: tt('Pricing committee'),               when: tt('Thu 11 Jul')   },
              { what: tt('Quarterly business review'),       when: tt('Tue 22 Jul')   },
            ]}
          />
        </div>
      </>)}

      {/* ════════════════════════ PIPELINE ════════════════════════════════════ */}
      {tab === 'pipeline' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total pipeline')}    value={`BSD ${totals.pipelineTotal.toFixed(1)}M`} delta="+BSD 3.2M monthly"  trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Coverage ratio')}    value="3.4×"                                   delta="target ≥3×"       trend="up"   icon={Target}      />
          <KpiCard label={tt('Win rate')}          value="32.4%"                                  delta="+1.8 pp"          trend="up"   icon={Award}       />
          <KpiCard label={tt('Won QTD')}           value="BSD 12.8M"                                 delta="81% attainment"   trend="up"   icon={DollarSign}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Pipeline creation vs consumption — 6 weeks')} insight={{ insight: 'Pipeline coverage stays at 3.4× but the most recent week shows a deal-loss spike that pressures the win rate.', action: 'Convene deal-desk on stage 2-3 opportunities with the highest fall-through risk to defend the 81% attainment before quarter close.', impact: 'Recovering 10% of at-risk deals equals BSD 1.3M additional QTD and lifts attainment toward the 90% target.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={pipelineWeekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="created" name={tt('Created')} fill={C1} />
                  <Bar dataKey="won"     name={tt('Won')}     fill={C3} />
                  <Bar dataKey="lost"    name={tt('Lost')}    fill="#ef4444" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Pipeline by segment · value vs win rate')} insight={{ insight: 'Higher-value pipeline segments show divergent win rates, indicating commercial effort is not aligned with segment profitability.', action: 'Concentrate pre-sales and custom proposal resources on segments with high pipeline and win rate below 30%.', impact: 'Lifting win rate 5 pp in the 2 highest-value segments would generate BSD 3M additional incremental revenue in the quarter.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={pipelineBySegment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="seg" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="pipeM" name={tt('Pipeline (BSD M)')} fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="winRate" name={tt('Win rate %')} stroke={C3} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Top deals — CCO priority list')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Opp ID')}</th>
                  <th>{tt('Account')}</th>
                  <th>{tt('Segment')}</th>
                  <th className="text-right">{tt('Value')}</th>
                  <th>{tt('Stage')}</th>
                  <th className="text-right">{tt('Close prob.')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {topDeals.map((d, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-[10px] text-vfes-dark/65">{d.id}</td>
                    <td className="font-semibold text-xs">{d.acc}</td>
                    <td className="text-xs text-vfes-dark/65">{d.seg}</td>
                    <td className="text-right font-bold">BSD {(d.valueK / 1000).toFixed(1)}M</td>
                    <td className="text-xs">{d.stage}</td>
                    <td className={`text-right font-bold text-xs ${d.prob >= 70 ? 'text-emerald-600' : d.prob >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{d.prob}%</td>
                    <td className="text-xs">{d.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <span className="text-vfes-dark/40 uppercase tracking-widest">{tt('Pipeline top-6: BSD ')}{totals.topDealPipeM}M</span>
            <Link to="/portal/b2b" className="ml-auto text-vfes-dark font-bold hover:underline">{tt('Open B2B detail →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Revenue by product — this quarter')}>
            <div className="space-y-2">
              {revenueByProduct.map((p) => (
                <div key={p.p} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="flex-1 font-semibold text-xs">{p.p}</div>
                  <div className="w-40 h-5 bg-black/5 rounded overflow-hidden">
                    <div className="h-full bg-vfes-red rounded" style={{ width: `${(p.rev / 18.4) * 100}%` }} />
                  </div>
                  <div className="w-16 text-right font-bold text-xs">BSD {p.rev}M</div>
                  <div className="w-12 text-right text-[10px] text-emerald-600">{p.margin}%</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
              {tt('REVConnect leads gross margin · B2B managed services growing 18% YoY')}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ PRICING ═════════════════════════════════════ */}
      {tab === 'pricing' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Fixed ARPU blend')}      value={`BSD ${KPI.arpuFixed}`}  delta="+2.1% YoY"           trend="up"   icon={Banknote}    accent />
          <KpiCard label={tt('Mobile ARPU')}            value={`BSD ${KPI.arpuMobile}`} delta="+1.2% quarterly"     trend="up"   icon={Smartphone}  />
          <KpiCard label={tt('M500 elasticity')}        value="−0.9"                 delta="inelastic vs Rival ISP B"   trend="up"   icon={Zap}         />
          <KpiCard label={tt('Premium vs competitor')}  value="+3.8%"                delta="maintained"          trend="up"   icon={Percent}     />
        </div>

        <Panel
          title={tt('Price tier analysis')}
          action={
            <div className="flex gap-1">
              {TIER_KEYS.map(k => (
                <button key={k} onClick={() => setTierFilter(k)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${tierFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Tier')}</th>
                  <th className="text-right">{tt('Price/mo')}</th>
                  <th className="text-right">{tt('Cost/mo')}</th>
                  <th className="text-right">{tt('Margin %')}</th>
                  <th className="text-right">{tt('Subscribers')}</th>
                  <th className="text-right">{tt('Elasticity')}</th>
                  <th className="text-right">{tt('Mkt share')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTiers.map((p) => (
                  <tr key={p.tier} className="border-t border-black/5">
                    <td className="py-2.5 font-bold">{p.tier}</td>
                    <td className="text-right font-bold">BSD {p.price}</td>
                    <td className="text-right text-vfes-dark/65">BSD {p.cost}</td>
                    <td className="text-right font-bold text-emerald-600">{p.margin.toFixed(1)}%</td>
                    <td className="text-right">{p.subs.toLocaleString()}</td>
                    <td className={`text-right font-bold ${p.elasticity < -1.5 ? 'text-red-600' : p.elasticity < -1.0 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.elasticity}</td>
                    <td className="text-right">{p.mktShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
          <Panel title={tt('ARPU trend by lane — 6 quarters')} insight={{ insight: 'Convergent ARPU exceeds BSD 99 in the last quarter, while Mobile ARPU rises gradually but remains below the BSD 60 target.', action: 'Adjust the Mobile-to-Convergent upsell strategy and review the M500 plan price to close the gap vs the ARPU target.', impact: 'Increasing Mobile ARPU by BSD 2 via upsell would add BSD 4M annual revenue on the current subscriber base.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={arpuTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD " />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mobile" name={tt('Mobile ARPU')}      stroke={C1} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="fixed"  name={tt('Fixed ARPU')}       stroke={C2} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="conv"   name={tt('Convergent ARPU')}  stroke={C3} strokeWidth={2} dot />
                  <ReferenceLine y={60} stroke={C6} strokeDasharray="3 3" label={{ value: 'Target', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Price history — key tiers')} insight={{ insight: 'M250, M500 and M1Gb prices show staggered increases over the period, with the M1Gb tier as the main average value lever.', action: 'Evaluate a BSD 2-3 rise on the M500 tier before the next renewal cycle to capture residual elasticity without compromising retention.', impact: 'A BSD 2 increase on M500 on the current subscriber base would generate a positive BSD 1.8M annual impact on fixed lane revenue.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD " domain={[30, 60]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="stepAfter" dataKey="m250" name="M250" stroke={C1} strokeWidth={2} dot />
                  <Line type="stepAfter" dataKey="m500" name="M500" stroke={C2} strokeWidth={2} dot />
                  <Line type="stepAfter" dataKey="m1gb" name="M1Gb" stroke={C3} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Competitor pricing matrix')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Operator')}</th>
                  <th className="text-right">{tt('M100')}</th>
                  <th className="text-right">{tt('M250')}</th>
                  <th className="text-right">{tt('M500')}</th>
                  <th className="text-right">{tt('M1Gb')}</th>
                </tr>
              </thead>
              <tbody>
                {competitorPricing.map((c) => (
                  <tr key={c.comp} className={`border-t border-black/5 ${c.comp === 'Cable Bahamas' ? 'bg-vfes-red/5' : ''}`}>
                    <td className={`py-2.5 ${c.comp === 'Cable Bahamas' ? 'font-black' : 'font-semibold'}`}>{c.comp}</td>
                    <td className="text-right">{fmtBsd(c.m100)}</td>
                    <td className="text-right">{fmtBsd(c.m250)}</td>
                    <td className="text-right">{fmtBsd(c.m500)}</td>
                    <td className="text-right">{fmtBsd(c.m1gb)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/price-wargame" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Run price scenario war-game →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ════════════════════════ BUNDLES ═════════════════════════════════════ */}
      {tab === 'bundles' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('REVConnect attach')}        value="62%"    delta="+4 pp quarterly"    trend="up"   icon={Boxes}       accent />
          <KpiCard label={tt('Mega bundle subs')}   value="140K"   delta="+18% YoY"            trend="up"   icon={PackageSearch}/>
          <KpiCard label={tt('Convergent ARPU')}    value="BSD 99"    delta="+BSD 1.2 quarterly"    trend="up"   icon={Banknote}    />
          <KpiCard label={tt('Bundle avg GM')}      value="52%"    delta="vs 48% standalone"   trend="up"   icon={Percent}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Bundle attach rate trend — 6 months')} insight={{ insight: 'REVConnect attach rate reaches 62% and Mega Bundle grows +18% YoY, but Basic TV remains below its potential in the family segment.', action: 'Launch a Basic TV cross-sell campaign targeting REVConnect customers without a TV component to maximise attach in the family segment.', impact: 'Lifting Basic TV attach 5 pp would increase convergent ARPU by BSD 3-4 and reduce churn by 0.3 pp due to higher customer stickiness.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={bundleAttachTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="volt"    name={tt('REVConnect %')}     stroke={C3} fill={C3} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="mega"    name={tt('Mega %')}     stroke={C1} fill={C1} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="tvBasic" name={tt('Basic TV %')} stroke={C4} fill={C4} fillOpacity={0.15}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

      <Panel title={tt('Gross margin contribution by bundle (BSD M)')} insight={{ insight: 'The Mega Bundle registers the highest gross margin contribution in absolute value, with a GM% above 52% vs 48% for standalone products.', action: 'Prioritise Mega Bundle in renewal campaigns and the digital channel, where acquisition cost is lower than in indirect channel.', impact: 'Increasing Mega Bundle penetration 3 pp adds BSD 1.2M gross margin given the differential vs individual services.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={bundleMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="b" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="contrib" name={tt('GM contribution (BSD M)')} fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="gm" name={tt('GM %')} stroke={C3} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Bundle portfolio — subscribers, ARPU and margin')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Bundle')}</th>
                  <th className="text-right">{tt('Subscribers')}</th>
                  <th className="text-right">{tt('ARPU (BSD /mo)')}</th>
                  <th className="text-right">{tt('GM %')}</th>
                  <th className="text-right">{tt('Attach %')}</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((b) => (
                  <tr key={b.name} className="border-t border-black/5">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                      <span className="font-semibold">{b.name}</span>
                    </td>
                    <td className="text-right">{b.subs.toLocaleString()}</td>
                    <td className="text-right font-bold">BSD {b.arpu}</td>
                    <td className="text-right text-emerald-600 font-bold">{b.margin}%</td>
                    <td className="text-right">{b.attach > 0 ? `${b.attach}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/bundle-profitability" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Deep-dive bundle profitability →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ════════════════════════ CHANNELS ════════════════════════════════════ */}
      {tab === 'channels' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total gross adds (month)')} value={totals.totalGrossAdds.toLocaleString()} delta="+8% monthly"    trend="up"   icon={Users}    accent />
          <KpiCard label={tt('Web DTC channel share')}    value="41%"                                    delta="+3 pp quarterly" trend="up"   icon={Globe}    />
          <KpiCard label={tt('Blended CPGA')}             value="BSD 88"                                    delta="-BSD 4 vs plan"      trend="up"   icon={DollarSign}/>
          <KpiCard label={tt('Gold tier dealers')}        value="2"                                      delta="6 active total"   trend="flat" icon={Store}    />
        </div>

        <Panel
          title={tt('Channel performance')}
          insight={{ insight: 'The digital channel has the lowest CPGA in the portfolio while the indirect channel generates the highest gross add volume with moderate CPGA.', action: 'Renegotiate commission terms with dealers with CPGA above BSD 80 and redirect that budget to the lower-cost digital channel.', impact: 'Reducing average CPGA by BSD 10 on monthly gross add volume equates to BSD 3.2M annual savings in customer acquisition cost.' }}
          action={
            <div className="flex flex-wrap gap-1">
              {CH_KEYS.map(k => (
                <button key={k} onClick={() => setChannelFilter(k)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${channelFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={filteredChannels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="ch" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="BSD " />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="gross" name={tt('Gross adds')} fill={C1} />
                <Line yAxisId="r" type="monotone" dataKey="cpga" name={tt('CPGA (BSD )')} stroke={C4} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Dealer scorecard · top 6 indirect partners')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Dealer')}</th>
                    <th className="text-right">{tt('Adds')}</th>
                    <th className="text-right">{tt('CPGA')}</th>
                    <th className="text-right">{tt('NPS 30d')}</th>
                    <th className="text-right">{tt('Compliance %')}</th>
                    <th>{tt('Tier')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerScorecard.map((d) => (
                    <tr key={d.dealer} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{d.dealer}</td>
                      <td className="text-right font-bold">{d.gross.toLocaleString()}</td>
                      <td className="text-right">BSD {d.cpga}</td>
                      <td className="text-right">{d.nps}</td>
                      <td className={`text-right font-bold ${d.compliance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.compliance}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${tierColor(d.tier)}`}>{tt(d.tier)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/channel-dealers" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full channel & dealer analytics →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ WHOLESALE ═══════════════════════════════════ */}
      {tab === 'wholesale' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total MVNO subs')}     value={`${(totals.totalMvnoSubs / 1_000_000).toFixed(2)}M`} delta="+4% YoY"         trend="up"   icon={Radio}     accent />
          <KpiCard label={tt('Wholesale revenue (mo)')} value="BSD 1.66M"                                          delta="+6% monthly"      trend="up"   icon={Banknote}  />
          <KpiCard label={tt('Avg MVNO margin')}     value="21%"                                                 delta="stable"           trend="flat" icon={Percent}   />
          <KpiCard label={tt('Active partners')}     value={`${mvnoPartners.length}`}                            delta="MVNO + neutral"   trend="flat" icon={Building2} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <Panel title={tt('Wholesale revenue trend by type (BSD M)')} insight={{ insight: 'MVNO revenue growing +4% YoY and neutral B2B access accelerating +40% YoY, already representing 30% of total BSD 1.66M wholesale.', action: 'Accelerate signing new dark-fibre and B2B colocation agreements to capitalise on corporate demand before competitors fill the space.', impact: 'Adding 2 new neutral access contracts at current rate would double B2B wholesale revenue and lift total lane margin by 2 pp.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={wholesaleTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="mvno"    name={tt('MVNO')}          stroke={C1} fill={C1} fillOpacity={0.3} stackId="1" />
                  <Area type="monotone" dataKey="neutral" name={tt('Neutral access')} stroke={C3} fill={C3} fillOpacity={0.3} stackId="1" />
                  <Area type="monotone" dataKey="roaming" name={tt('Roaming')}       stroke={C4} fill={C4} fillOpacity={0.3} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('MVNO partner breakdown')}>
            <div className="space-y-3">
              {mvnoPartners.map((m) => (
                <div key={m.partner} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="flex-1 font-semibold text-xs">{m.partner}</div>
                  <div className="text-xs text-vfes-dark/65">{m.subs > 0 ? `${(m.subs / 1000).toFixed(0)}K subs` : 'B2B'}</div>
                  <div className="font-bold text-xs">BSD {m.revMoM.toFixed(2)}M</div>
                  <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${m.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : m.trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-zinc-50 text-zinc-600'}`}>{tt(m.trend)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[10px]">
              <Link to="/portal/mvno-wholesale" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('MVNO & wholesale detail →')}</Link>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Lycamobile and Mobile Vikings represent 74% of MVNO revenue. Neutral B2B access growing +40% YoY driven by colocation and corporate dark-fibre demand.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ DEVICES ═════════════════════════════════════ */}
      {tab === 'devices' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Devices sold (month)')}     value="320K"  delta="+6% monthly"           trend="up"   icon={Smartphone}   accent />
          <KpiCard label={tt('Financing penetration')}     value="62%"   delta="+3 pp quarterly"      trend="up"   icon={Percent}      />
          <KpiCard label={tt('Flagship delinquency')}      value="1.2%"  delta="-0.2 pp quarterly"    trend="up"   icon={ShoppingCart} />
          <KpiCard label={tt('Trade-ins (month)')}         value="10.2K" delta="+8% monthly"           trend="up"   icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Device financing by tier · % financed vs delinquency')} insight={{ insight: 'The Flagship tier concentrates 62% of financing with 1.2% delinquency, while entry tiers show higher non-payment rates.', action: 'Tighten credit scoring in tiers below BSD 300 and redirect freed financing quota to more aggressively subsidise the Flagship tier.', impact: 'Reducing delinquency in lower tiers by 0.5 pp is equivalent to BSD 0.8M improvement in the net result of the device financing programme.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={deviceFinancing}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="pctFinanced" name={tt('% Financed')} fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="delinq" name={tt('Delinquency %')} stroke="#ef4444" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Brand mix · sales share')} insight={{ insight: 'Apple leads sales share with the highest churn protection at 78%, while Samsung is second with a lower average ASP.', action: 'Maintain differential Apple subsidy justified by higher LTV and negotiate better trade-in conditions with Samsung for the entry segment.', impact: 'Capturing 2 additional pp of Apple share would increase portfolio average ASP by BSD 15 and reduce annual churn by 0.4 pp.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={deviceBrands} dataKey="share" nameKey="brand" innerRadius={50} outerRadius={90} paddingAngle={2}
                    label={({ brand, share }: { brand: string; share: number }) => `${brand} ${share}%`}>
                    {deviceBrands.map((_, i) => <Cell key={i} fill={[C1, C2, C3, C4, C6][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Trade-in programme · units, residuals and net benefit')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Month')}</th>
                  <th className="text-right">{tt('Trade-ins')}</th>
                  <th className="text-right">{tt('Avg residual (BSD )')}</th>
                </tr>
              </thead>
              <tbody>
                {tradeInTrend.map((t) => (
                  <tr key={t.mo} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{t.mo}</td>
                    <td className="text-right">{t.tradeIns.toLocaleString()}</td>
                    <td className="text-right font-bold">BSD {t.avgResidual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/device-financing" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full device & trade-in analytics →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Brands · ASP, churn protection and share')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Brand')}</th>
                    <th className="text-right">{tt('Share %')}</th>
                    <th className="text-right">{tt('Avg ASP (BSD )')}</th>
                    <th className="text-right">{tt('Churn protection %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceBrands.map((b) => (
                    <tr key={b.brand} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{b.brand}</td>
                      <td className="text-right">{b.share}%</td>
                      <td className="text-right font-bold">BSD {b.avgASP}</td>
                      <td className={`text-right font-bold ${b.churnProtect >= 70 ? 'text-emerald-600' : b.churnProtect >= 50 ? 'text-amber-600' : 'text-vfes-dark/60'}`}>{b.churnProtect}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Apple offers the highest churn protection (78%) — subsidy justified by LTV. Total device lane revenue Jun: BSD ')}{revSummary.latestTotal}M · YTD growth +{revSummary.growth}%.</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Units sold by price tier · this month')} insight={{ insight: 'The mid-price tier concentrates the highest unit volume this month, indicating that the average customer prioritises value over flagship.', action: 'Reinforce the mid-tier value proposition with included accessories or extended warranty to raise the ticket without sacrificing sales volume.', impact: 'Raising average ASP by BSD 20 in the highest-volume tier would increase monthly device revenue by BSD 6.4M on current 320K units.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={deviceFinancing}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="units" name={tt('Units sold')} fill={C1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ WIN/LOSS & COMPETITIVE ══════════════════════ */}
      {tab === 'winloss' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Win rate QTD')}               value="32.4%"      delta={tt('+1.8 pp vs Q1')}              trend="up"   icon={Award}       accent />
          <KpiCard label={tt('Competitive wins/month')}     value="284"         delta={tt('+12% monthly')}               trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Net churn to competitors')}   value="−3.3K"       delta={tt('Rival ISP B leads losses')}       trend="down" icon={Users}       />
          <KpiCard label={tt('Competitive threat level')}   value={tt('High')}  delta={tt('Rival ISP B + BTC')}        trend="down" icon={ShoppingCart} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Win/loss by reason — current month')} insight={{ insight: 'Convergent bundle and speed are the two dominant winning factors, while price is the main loss driver vs Rival ISP B.', action: 'Create a competitive-price defensive bundle exclusive for retention, automatically triggered when the CRM detects price-driven cancellation intent.', impact: 'Retaining 20% of deals lost on price would add 57 monthly contracts and recover BSD 0.9M annual revenue.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={winLossReasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 9 }} width={160} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="won"  name={tt('Won')}  fill={C3}        radius={[0, 4, 4, 0]} />
                  <Bar dataKey="lost" name={tt('Lost')} fill="#ef4444"   radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Bundle convergent and speed are the key winning factors. Price is the main loss driver vs Rival ISP B.')}
            </div>
          </Panel>

          <Panel title={tt('Win rate trend — 6 months')} insight={{ insight: 'Win rate has risen 4 pp since January to 32.4%, but remains 2.6 pp below the 35% target, with B2B enterprise as the main laggard.', action: 'Launch an intensive commercial enablement programme for the B2B enterprise team and close the gap versus the 42% public sector win rate.', impact: 'Reaching the 35% target in B2B enterprise would add BSD 2.1M annual revenue on the current BSD 24M active pipeline.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={winRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[25, 40]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="winRate"   name={tt('Win rate')}     stroke={C1} strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="targetWin" name={tt('Target 35%')} stroke={C3} strokeDasharray="4 4" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Win rate +4 pp since January; B2B enterprise 28% vs public sector 42%. Convergent is the winning proposition against all competitors.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Competitive intelligence — active threats')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Competitor')}</th>
                  <th>{tt('Threat')}</th>
                  <th>{tt('Segment')}</th>
                  <th className="text-right">{tt('Impact')}</th>
                  <th>{tt('Severity')}</th>
                </tr>
              </thead>
              <tbody>
                {competitiveThreats.map((c, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-bold text-xs">{c.competitor}</td>
                    <td className="text-xs text-vfes-dark/75">{c.threat}</td>
                    <td className="text-xs text-vfes-dark/65">{c.segment}</td>
                    <td className="text-right text-xs font-bold text-vfes-dark">{c.impact}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        c.severity === 'high' ? 'bg-red-100 text-red-700' :
                        c.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>{tt(c.severity)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
            {tt('Updated weekly from market monitoring and price scraping')}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Net churn by competitor — disconnects vs recaptures (subs/month)')} insight={{ insight: 'Rival ISP B generates the highest net negative flow at −1.4K subs/month, while recaptures from BTC are the main net growth vector.', action: 'Intensify the segmented win-back campaign against Rival ISP B with a competitive convergent offer in the postcodes with the highest outflow rate.', impact: 'Recovering 500 monthly disconnects from Rival ISP B would reduce net churn by 0.15 pp and generate BSD 3.6M annual LTV at convergent ARPU.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={churnToCompetitor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="competitor" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="churned"    name={tt('Disconnects to competitor')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recaptured" name={tt('Recaptures from competitor')} fill={C3}      radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Rival ISP B generates the highest net negative flow (−1.4K/mo). Win-back strategy active against the 3 highest-volume operators.')}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Competitive scorecard — key metrics')}>
            <div className="grid md:grid-cols-3 gap-4">
              {([
                { metric: tt('NPS'),           cbl: '+38',                   btc: '+32',   digi: '+28',  winner: 'Cable Bahamas' },
                { metric: tt('Win rate'),       cbl: '32%',                   btc: '—',     digi: '—',    winner: 'Cable Bahamas' },
                { metric: tt('Fixed ARPU'),     cbl: `BSD ${KPI.arpuFixed}`,    btc: 'BSD 43.8', digi: 'BSD 36.4',winner: 'BTC' },
                { metric: tt('Churn %'),        cbl: `${KPI.churnRatePct}%`, btc: '1.22%', digi: '1.68%',winner: 'Cable Bahamas' },
                { metric: tt('5G coverage'),    cbl: '89%',                   btc: '88%',   digi: '84%',  winner: 'Cable Bahamas' },
                { metric: tt('EBITDA margin'),  cbl: `${KPI.ebitdaMarginPct}%`, btc: '36.2%', digi: '34.8%', winner: 'Cable Bahamas' },
              ] as const).map((r, i) => (
                <div key={i} className="p-3 rounded-lg border border-black/5 bg-[#fafbfc]">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{r.metric}</div>
                  <div className="flex justify-between text-xs">
                    <div>
                      <div className="text-[9px] text-vfes-dark/40">{tt('Cable Bahamas')}</div>
                      <div className={`font-bold ${r.winner === 'Cable Bahamas' ? 'text-emerald-600' : ''}`}>{r.cbl}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-vfes-dark/40">{tt('BTC')}</div>
                      <div className="font-semibold">{r.btc}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-vfes-dark/40">{tt('Rival ISP B')}</div>
                      <div className="font-semibold">{r.digi}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
              {tt('Cable Bahamas leads on 5 of 6 competitive metrics. Fixed ARPU is the only metric where BTC leads — reflecting their high-price legacy base.')}
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Churn & Retention')}
          </Link>
          <Link to="/portal/sales" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Sales dashboard')}
          </Link>
          <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Marketing cockpit')}
          </Link>
          <Link to="/portal/strategy" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Strategy & OKRs')}
          </Link>
        </div>
      </>)}
    </div>
  )
}
