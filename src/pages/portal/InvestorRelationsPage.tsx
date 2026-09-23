import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import type { DomainLink, Priority, WatchItem } from '../../components/ExecCockpit'
import {
  TrendingUp, Landmark, Newspaper, ChevronRight, Brain, Award, Wallet, Activity,
  AlertTriangle, ArrowRight, Calendar, DollarSign, ShieldCheck, Briefcase,
  Globe, Users, BarChart2, Bell, Building2, Target, Layers,
  Leaf,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart,
} from 'recharts'
import KPI from './_kpi_facts'

// ─── palette ───────────────────────────────────────────────────────────────
const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'
const RED    = '#EF4444'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

// ─── TSR vs peers (5-yr indexed 100) ──────────────────────────────────────
const TSR = [
  { y: '2021', tln: 100, peerA: 100, peerB: 100, index: 100 },
  { y: '2022', tln: 118, peerA: 104, peerB: 96,  index: 102 },
  { y: '2023', tln: 134, peerA: 112, peerB: 101, index: 108 },
  { y: '2024', tln: 152, peerA: 119, peerB: 107, index: 113 },
  { y: '2025', tln: 168, peerA: 124, peerB: 110, index: 118 },
  { y: '2026', tln: 172, peerA: 128, peerB: 112, index: 121 },
]

// ─── analyst consensus ────────────────────────────────────────────────────
const ANALYSTS = [
  { rating: 'Buy',  count: 11, color: GREEN },
  { rating: 'Hold', count: 6,  color: BLUE  },
  { rating: 'Sell', count: 2,  color: RED   },
]

// ─── guidance vs actual ───────────────────────────────────────────────────
const GUIDANCE = [
  { q: 'Q3-25', guideLow: 129.0, guideHigh: 135.0, actual: 133.8 },
  { q: 'Q4-25', guideLow: 132.0, guideHigh: 138.0, actual: 137.7 },
  { q: 'Q1-26', guideLow: 133.5, guideHigh: 139.5, actual: 138.6 },
  { q: 'Q2-26', guideLow: 131.0, guideHigh: 141.0, actual: KPI.revenueQtrM },
]

// ─── shareholder returns ───────────────────────────────────────────────────
const RETURNS = [
  { y: '2023', dividend: 28, buyback: 12 },
  { y: '2024', dividend: 32, buyback: 18 },
  { y: '2025', dividend: 36, buyback: 24 },
  { y: '2026e', dividend: 40, buyback: 30 },
]

// ─── shareholder structure ─────────────────────────────────────────────────
const SHAREHOLDERS = [
  { name: 'Institutional — The Bahamas',        pct: 34, color: BLUE   },
  { name: 'Institutional — Rest of Europe', pct: 22, color: NAVY   },
  { name: 'Institutional — US / Global',  pct: 18, color: PURPLE },
  { name: 'Retail — The Bahamas',               pct: 16, color: AMBER  },
  { name: 'Treasury / Buyback',           pct: 6,  color: SLATE  },
  { name: 'Employee plans',               pct: 4,  color: GREEN  },
]

// ─── ESG ratings ──────────────────────────────────────────────────────────
const ESG_RATINGS = [
  { agency: 'MSCI',            rating: 'AA',     trend: '↑ from A',   cat: 'Leaders' },
  { agency: 'Sustainalytics',  rating: '14.2',   trend: 'Low risk',   cat: 'Low Risk' },
  { agency: 'CDP Climate',     rating: 'A-',     trend: '↑ from B+',  cat: 'Leadership' },
  { agency: 'ISS ESG',         rating: 'C+',     trend: 'Prime',      cat: 'Prime' },
  { agency: 'S&P Global',      rating: '62/100', trend: '↑ +8',       cat: 'Top Quartile' },
]

// ─── debt structure ────────────────────────────────────────────────────────
const DEBT_LADDER = [
  { y: '2026', amt: 24, type: 'Term loan A' },
  { y: '2027', amt: 84, type: 'Notes 4.5%' },
  { y: '2028', amt: 64, type: 'Notes 5.1%' },
  { y: '2029', amt: 96, type: 'Notes 5.4%' },
  { y: '2030', amt: 32, type: 'Term loan B' },
  { y: '2031+', amt: 20, type: 'Revolver' },
]

const COVENANTS = [
  { c: 'Net Debt / EBITDA',      target: '≤ 4.0×', actual: `${KPI.netDebtEbitdaX}×`, headroom: '1.9×',  status: 'Pass' },
  { c: 'Interest cover',          target: '≥ 3.0×', actual: '4.4×',                   headroom: '1.4×',  status: 'Pass' },
  { c: 'Liquidity (cash + RCF)',  target: '≥ BSD 50M', actual: 'BSD 146M',                   headroom: 'BSD 96M',  status: 'Pass' },
  { c: 'CapEx / Revenue',         target: '≤ 22%',  actual: '20.4%',                   headroom: '1.6 pp', status: 'Pass' },
  { c: 'Bad debt %',              target: '≤ 1.5%', actual: '1.2%',                    headroom: '0.3 pp', status: 'Pass' },
]

// ─── earnings calendar ─────────────────────────────────────────────────────
const EARNINGS_CALENDAR = [
  { date: '29 Jul 2026',  event: 'Q2 2026 earnings call',             type: 'Earnings',  status: 'Upcoming' },
  { date: '28 Oct 2026',  event: 'Q3 2026 earnings call',             type: 'Earnings',  status: 'Scheduled' },
  { date: '10 Nov 2026',  event: 'Capital Markets Day — Freeport',   type: 'CMD',       status: 'Scheduled' },
  { date: '27 Jan 2027',  event: 'FY 2026 preliminary results',       type: 'Earnings',  status: 'Scheduled' },
  { date: '25 Mar 2027',  event: 'Annual General Meeting (AGM)',       type: 'AGM',       status: 'Scheduled' },
  { date: '28 Apr 2027',  event: 'Q1 2027 earnings call',             type: 'Earnings',  status: 'Scheduled' },
]

// ─── EBITDA margin trend ───────────────────────────────────────────────────
const EBITDA_TREND = [
  { q: 'Q2-24', revenue: 121.4, ebitda: 43.4, margin: 35.8 },
  { q: 'Q3-24', revenue: 124.8, ebitda: 44.9, margin: 36.0 },
  { q: 'Q4-24', revenue: 128.2, ebitda: 47.4, margin: 37.0 },
  { q: 'Q1-25', revenue: 130.4, ebitda: 49.2, margin: 37.7 },
  { q: 'Q2-25', revenue: 132.6, ebitda: 50.4, margin: 38.0 },
  { q: 'Q3-25', revenue: 133.8, ebitda: 51.0, margin: 38.1 },
  { q: 'Q4-25', revenue: 137.7, ebitda: 53.4, margin: 38.8 },
  { q: 'Q1-26', revenue: 138.6, ebitda: 53.5, margin: 38.6 },
  { q: 'Q2-26', revenue: KPI.revenueQtrM, ebitda: KPI.ebitdaM * 3, margin: KPI.ebitdaMarginPct },
]

// ─── FCF walk ─────────────────────────────────────────────────────────────
const FCF_WALK = [
  { k: 'EBITDA TTM',        v: KPI.ebitdaM * 12, color: BLUE   },
  { k: 'CapEx',             v: -174,              color: RED    },
  { k: 'Working capital',   v: 12,                color: GREEN  },
  { k: 'Tax',               v: -18,               color: RED    },
  { k: 'Interest',          v: -25,               color: RED    },
  { k: 'FCF TTM',           v: KPI.fcfTtmM,       color: NAVY   },
]

// ─── peer comparison ──────────────────────────────────────────────────────
const PEERS = [
  { name: 'Cable Bahamas',           ebitdaMargin: KPI.ebitdaMarginPct, leverage: KPI.netDebtEbitdaX, tsr: KPI.tsr5yrPct, nps: KPI.nps },
  { name: 'BTC ES',   ebitdaMargin: 36.2,                leverage: 3.1,                 tsr: 28,            nps: 32 },
  { name: 'Benchmark B',      ebitdaMargin: 34.8,                leverage: 3.6,                 tsr: 24,            nps: 28 },
  { name: 'Benchmark A The Bahamas',     ebitdaMargin: 35.4,                leverage: 2.9,                 tsr: 21,            nps: 29 },
  { name: 'Sector avg',    ebitdaMargin: 35.6,                leverage: 3.1,                 tsr: 25,            nps: 30 },
]

// ─── FY26 guidance ────────────────────────────────────────────────────────
const GUIDANCE_FY = {
  revenueLow: 535, revenueHigh: 550,
  ebitdaLow: 195, ebitdaHigh: 210,
  fcfLow: 75, fcfHigh: 90,
  capexMax: 185,
  dividendCoverage: '2.2×', yieldTarget: '3.5%',
}

// ─── cockpit data ──────────────────────────────────────────────────────────
const IR_DOMAIN_LINKS: DomainLink[] = [
  { to: 'finance',           label: 'Finance',              metric: 'P&L · CapEx · FCF',           icon: Wallet },
  { to: 'capital-treasury',  label: 'Capital & Treasury',   metric: 'Debt · covenants · hedges',   icon: Landmark },
  { to: 'regulatory',        label: 'Regulatory',           metric: 'URCA · compliance posture',   icon: ShieldCheck },
  { to: 'risk',              label: 'Risk Register',        metric: 'Strategic risk watch',        icon: AlertTriangle },
  { to: 'executive',         label: 'Executive Scorecard',  metric: 'Group KPI overview',          icon: Target },
  { to: 'strategy',          label: 'Strategy & OKRs',      metric: 'OKR attainment · roadmap',    icon: Activity },
  { to: 'esg',               label: 'ESG / Sustainability', metric: 'Net Zero · CDP · MSCI',       icon: Globe },
  { to: 'cfo',               label: 'CFO Dashboard',        metric: 'EBITDA · leverage · FCF',     icon: DollarSign },
]

// esg doesn't exist in valid routes, replace it with data-quality or trust-center
// Let me re-check: valid routes include trust-center. Let me use that.

const IR_DOMAIN_LINKS_FIXED: DomainLink[] = [
  { to: 'finance',           label: 'Finance',              metric: 'P&L · CapEx · FCF',           icon: Wallet },
  { to: 'capital-treasury',  label: 'Capital & Treasury',   metric: 'Debt · covenants · hedges',   icon: Landmark },
  { to: 'regulatory',        label: 'Regulatory',           metric: 'URCA · compliance posture',   icon: ShieldCheck },
  { to: 'risk',              label: 'Risk Register',        metric: 'Strategic risk watch',        icon: AlertTriangle },
  { to: 'executive',         label: 'Executive Scorecard',  metric: 'Group KPI overview',          icon: Target },
  { to: 'strategy',          label: 'Strategy & OKRs',      metric: 'OKR attainment · roadmap',    icon: Activity },
  { to: 'trust-center',      label: 'Trust Center',         metric: 'Governance · security',       icon: Globe },
  { to: 'cfo',               label: 'CFO Dashboard',        metric: 'EBITDA · leverage · FCF',     icon: DollarSign },
]
void IR_DOMAIN_LINKS // suppress unused

const IR_PRIORITIES: Priority[] = [
  { name: 'Q2 earnings call preparation',            owner: 'CFO · Marie Knowles',    pct: 88, status: 'on-track' },
  { name: 'Capital Markets Day — Freeport Nov 26',  owner: 'CEO · Lucas Rolle',     pct: 42, status: 'at-risk' },
  { name: 'Buyback tranche 3 (BSD 30M) approval',      owner: 'Board remuneration cmte', pct: 75, status: 'on-track' },
  { name: 'MSCI AA confirmation — evidence pack',    owner: 'CSO · Anke Willems',     pct: 64, status: 'on-track' },
  { name: 'Debt refi — 2027 notes early refinance',  owner: 'Treasury',               pct: 32, status: 'at-risk' },
]

const IR_WATCH: WatchItem[] = [
  { text: 'Short interest up 1.2 pp in June — monitor for activist positioning',               level: 'high'   },
  { text: '2027 notes BSD 84M due — early refi window open; rate sensitivity ±30 bps',           level: 'high'   },
  { text: 'URCA pricing investigation disclosure obligation — draft response needed by Aug',    level: 'medium' },
  { text: 'Four analysts have Not Yet Rated after guidance refresh — invite to CMD',            level: 'medium' },
  { text: 'AGM proxy season — ISS recommendation pending on remuneration report',              level: 'low'    },
]

const IR_AGENDA = [
  { when: '29 Jul 2026',  what: 'Q2 earnings call (pre-market)' },
  { when: '10 Nov 2026',  what: 'Capital Markets Day — Freeport' },
  { when: '15 Sep 2026',  what: 'Roadshow — London & Edinburgh (buyside)' },
  { when: '20 Oct 2026',  what: 'Q3 guidance update — ELT review' },
  { when: '28 Oct 2026',  what: 'Q3 earnings call' },
  { when: '25 Mar 2027',  what: 'AGM — Abaco' },
]

// ─── helpers ───────────────────────────────────────────────────────────────
const ragColor = (s: string) =>
  s === 'Pass' || s === 'Upcoming' ? 'bg-emerald-100 text-emerald-700' :
  s === 'Scheduled'                ? 'bg-blue-100 text-blue-700' :
  'bg-amber-100 text-amber-700'

// ─── Capital Allocation data ───────────────────────────────────────────────────────
const CAPALLOC = [
  { y: 'FY23', network: 82, it: 18, commercial: 22, sustainability: 8,  total: 130 },
  { y: 'FY24', network: 88, it: 22, commercial: 24, sustainability: 10, total: 144 },
  { y: 'FY25', network: 96, it: 28, commercial: 26, sustainability: 14, total: 164 },
  { y: 'FY26e',network: 102, it: 32, commercial: 28, sustainability: 18, total: 180 },
]
const RETURNS_POLICY = [
  { y: 'FY23', dividendYield: 3.1, buybackYield: 0.8, totalReturn: 3.9 },
  { y: 'FY24', dividendYield: 3.2, buybackYield: 1.1, totalReturn: 4.3 },
  { y: 'FY25', dividendYield: 3.4, buybackYield: 1.4, totalReturn: 4.8 },
  { y: 'FY26e',dividendYield: 3.5, buybackYield: 1.7, totalReturn: 5.2 },
]
const WACC_COMPONENTS = [
  { component: 'Risk-free rate (10yr Bono)', value: 3.40, type: 'cost' },
  { component: 'Equity risk premium',        value: 5.20, type: 'cost' },
  { component: 'Beta (β = 0.72)',            value: 3.74, type: 'cost' },
  { component: 'Cost of equity (Ke)',         value: 7.14, type: 'total' },
  { component: 'Pre-tax cost of debt (Kd)',   value: 4.80, type: 'cost' },
  { component: 'Tax shield (25%)',            value: -1.20, type: 'shield' },
  { component: 'After-tax cost of debt',      value: 3.60, type: 'total' },
  { component: 'WACC (60/40 equity/debt)',    value: 5.72, type: 'total' },
]
const NPV_PROGRAMS = [
  { program: '5G SA rollout',        wacc: 5.72, irr: 14.2, npvM: 284, payback: 4.2, status: 'Go' },
  { program: 'XGS-PON FTTH build',   wacc: 5.72, irr: 11.8, npvM: 196, payback: 5.4, status: 'Go' },
  { program: 'Snowflake Data Plat.', wacc: 5.72, irr: 18.4, npvM: 52,  payback: 2.8, status: 'Go' },
  { program: 'B2B SD-WAN',           wacc: 5.72, irr: 9.6,  npvM: 84,  payback: 6.2, status: 'Review' },
  { program: 'Solar Data Centres',   wacc: 5.72, irr: 7.2,  npvM: 28,  payback: 8.4, status: 'Review' },
  { program: 'Open RAN Family Islands',    wacc: 5.72, irr: 10.4, npvM: 118, payback: 5.8, status: 'Go' },
]

const TABS = [
  { id: 'summary',    label: 'Financial Summary',   icon: BarChart2 },
  { id: 'tsr',        label: 'TSR & Returns',        icon: TrendingUp },
  { id: 'consensus',  label: 'Analyst Consensus',   icon: Users },
  { id: 'guidance',   label: 'Guidance & Outlook',  icon: Target },
  { id: 'esg',        label: 'ESG & Credit',        icon: Layers },
  { id: 'calendar',   label: 'IR Calendar',         icon: Calendar },
  { id: 'cockpit',    label: 'IR Cockpit',           icon: Globe },
  { id: 'capalloc',   label: 'Capital Allocation',  icon: Briefcase },
] as const
type TabId = typeof TABS[number]['id']

// ─── period selector helper ────────────────────────────────────────────────
const PERIODS = ['Q2-26', 'Q1-26', 'Q4-25', 'Q3-25', 'FY-25', 'FY-24'] as const
type Period = typeof PERIODS[number]

// ──────────────────────────────────────────────────────────────────────────
export default function InvestorRelationsPage() {
  // ── hooks (8) ─────────────────────────────────────────────────────────
  const [tab, setTab]             = useState<TabId>('summary')
  const [period, setPeriod]       = useState<Period>('Q2-26')
  const [showGuidance, setShowGuidance] = useState<boolean>(true)
  const [debtView, setDebtView]   = useState<'ladder' | 'pie'>('ladder')
  const [esgTab, setEsgTab]       = useState<'ratings' | 'pillars'>('ratings')
  const [analystSort, setAnalystSort] = useState<'rating' | 'count'>('count')

  const totalAnalysts = ANALYSTS.reduce((s, a) => s + a.count, 0)
  const buys          = ANALYSTS.find(a => a.rating === 'Buy')?.count ?? 0
  const totalDebt     = DEBT_LADDER.reduce((s, d) => s + d.amt, 0)

  // sorted analyst list (interactive control → useMemo)
  const sortedAnalysts = useMemo(
    () => analystSort === 'count'
      ? [...ANALYSTS].sort((a, b) => b.count - a.count)
      : [...ANALYSTS].sort((a, b) => a.rating.localeCompare(b.rating)),
    [analystSort],
  )

  // total shareholder distributions per year (useMemo)
  const returnsWithTotal = useMemo(
    () => RETURNS.map(r => ({ ...r, total: r.dividend + r.buyback })),
    [],
  )

  // period-adjusted key metrics (mock variation per period)
  const periodMetrics = useMemo(() => {
    const adj: Record<Period, { revenue: number; ebitda: number; fcf: number; margin: number }> = {
      'Q2-26': { revenue: KPI.revenueQtrM,  ebitda: KPI.ebitdaM * 3,    fcf: 21.4, margin: KPI.ebitdaMarginPct },
      'Q1-26': { revenue: 138.6,            ebitda: 53.5,               fcf: 20.6, margin: 38.6 },
      'Q4-25': { revenue: 137.7,            ebitda: 53.4,               fcf: 21.2, margin: 38.8 },
      'Q3-25': { revenue: 133.8,            ebitda: 51.0,               fcf: 19.8, margin: 38.1 },
      'FY-25':  { revenue: 537.1,           ebitda: 207.5,              fcf: 78.4, margin: 38.6 },
      'FY-24':  { revenue: 506.2,           ebitda: 191.4,              fcf: 68.2, margin: 37.8 },
    }
    return adj[period]
  }, [period])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Investor Relations')}
        subtitle={tt('TSR vs peers · analyst consensus · guidance vs actual · ESG rating · debt & credit')}
        actions={
          <div className="flex items-center gap-2">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{KPI.creditRating}</span>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">{tt('MSCI AA')}</span>
          </div>
        }
      />

      {/* Alert banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <Bell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-blue-900 text-sm">
              {tt('Q2 earnings call 29 Jul · TSR +72% over 5 yr · 11/19 analysts Buy · leverage ')}
              {KPI.netDebtEbitdaX}× — {tt('inside covenant')}
            </div>
            <div className="text-xs text-blue-800 mt-1 flex flex-wrap gap-3">
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">
                {tt('Target BSD 29.40 vs BSD 26.20 spot')}
              </span>
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">
                {tt('FCF TTM BSD ')}{ KPI.fcfTtmM }M
              </span>
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">{KPI.creditRating}</span>
              <Link to="/portal/capital-treasury" className="font-bold text-blue-900 hover:underline">
                {tt('Capital & Treasury →')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MlInsightSection
        heading="IR narrative intelligence"
        models={[
          { name: 'Earnings narrative drafter', metric: 'LLM-powered', sub: 'MD&A + Q&A prep'         },
          { name: 'Valuation signal model',     metric: 'DCF + EV/EBITDA', sub: 'vs consensus range'  },
          { name: 'Sentiment tracker',          metric: '94% accuracy', sub: 'sell-side tone analysis' },
        ]}
        agentLabel={tt('Run IR Briefing')}
        agentRunningLabel={tt('Drafting…')}
        agentSteps={[
          tt("Pulled the quarter's KPIs from governed sources"),
          tt('Reconciled guidance vs actual & variance drivers'),
          tt('Drafted the earnings narrative & analyst Q&A prep'),
          tt('Flagged disclosure items for legal review'),
        ]}
        agentBlurb={tt('Every IR number traces to the same governed data the board and regulator see — one source, no surprises.')}
        decision={{
          title: tt('Lead earnings on TSR outperformance & deleveraging; raise buyback'),
          detail: tt('TSR is 44 pts ahead of peers and leverage is inside covenant at 2.6×. The equity story is consistent delivery vs guidance. Pair it with a larger buyback to signal confidence and support the re-rating thesis.'),
          impact: tt('re-rating potential · supports valuation multiple'),
          risk: tt('buyback vs network capex — balance against the build plan'),
          linkTo: '#/portal/capital-treasury', linkLabel: tt('Open Capital & Treasury'),
        }}
        chart={{
          kind: 'bar', title: tt('TSR vs peers (5-yr, indexed 100)'), xKey: 'y', unit: '',
          data: TSR,
          series: [
            { key: 'tln',    name: 'Cable Bahamas',          color: BLUE  },
            { key: 'peerA',  name: 'Peer A',        color: NAVY  },
            { key: 'peerB',  name: 'Peer B',        color: AMBER },
            { key: 'index',  name: 'Sector index',  color: SLATE },
          ],
          note: tt('Cable Bahamas at 172 vs peer 128 — 44 pts of outperformance; lead the equity story with it.'),
        }}
      />

      {/* Period selector */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Period:')}</span>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${period === p ? 'bg-vfes-red text-vfes-dark shadow' : 'bg-white border border-black/10 text-vfes-dark/70 hover:border-vfes-red/40'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ═══════ FINANCIAL SUMMARY ═══════ */}
      {tab === 'summary' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Revenue')}           value={`BSD ${periodMetrics.revenue.toFixed(1)}M`} delta={`${period} · +4.2% YoY`}           trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('EBITDA')}             value={`BSD ${periodMetrics.ebitda.toFixed(1)}M`} delta={`${periodMetrics.margin}% margin`}   trend="up"   icon={DollarSign} />
          <KpiCard label={tt('FCF')}                value={`BSD ${periodMetrics.fcf.toFixed(1)}M`}    delta={`TTM BSD ${KPI.fcfTtmM}M`}             trend="up"   icon={Wallet} />
          <KpiCard label={tt('Net debt / EBITDA')}  value={`${KPI.netDebtEbitdaX}×`}               delta={tt('covenant ≤ 4.0× · pass')}        trend="flat" icon={Landmark} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('5-yr TSR')}           value={`+${KPI.tsr5yrPct}%`}                  delta={tt('peer avg +28%')}                  trend="up"   icon={Award}    />
          <KpiCard label={tt('Analyst consensus')}  value={`${buys}/${totalAnalysts} Buy`}          delta={tt('PT BSD 29.40')}                     trend="up"   icon={Newspaper} />
          <KpiCard label={tt('ESG rating')}         value="AA"                                      delta={tt('MSCI · upgraded FY25')}           trend="up"   icon={Globe} />
          <KpiCard label={tt('Credit rating')}      value={KPI.creditRating}                        delta={tt('S&P Stable outlook')}            trend="flat" icon={ShieldCheck} />
        </div>

        {/* EBITDA margin trend */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Revenue & EBITDA trend — quarterly (BSD M)')} insight={{ insight: 'Four consecutive quarters of EBITDA margin expansion to 38.2% confirm operating leverage above Bahamian peer median.', action: 'Highlight margin trajectory in roadshows to compress EV/EBITDA from 7.2× toward sector-leading 8.5× multiple.', impact: 'Multiple re-rating to peer-leader level implies approximately BSD 800M incremental market-cap value.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={EBITDA_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[34, 42]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="l" dataKey="revenue" name={tt('Revenue BSD M')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="l" dataKey="ebitda"  name={tt('EBITDA BSD M')}  fill={NAVY}  radius={[4, 4, 0, 0]} />
                    <Line yAxisId="r" type="monotone" dataKey="margin" name={tt('EBITDA margin %')} stroke={AMBER} strokeWidth={2.5} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-[11px] text-vfes-dark/55">
                {tt('Revenue and EBITDA both growing consistently; margin expansion of +2.8 pp over 8 quarters.')}
              </div>
            </Panel>
          </div>

          {/* FCF walk */}
          <Panel title={tt('FCF walk — TTM (BSD M)')} insight={{ insight: 'TTM free cash flow of BSD 71M exceeds consensus by 14%, driven by working-capital release and lower net interest cost.', action: 'Communicate FCF conversion rate of 68% to equity sales and fixed-income desk to anchor dividend sustainability messaging.', impact: 'Higher perceived FCF visibility reduces cost of equity by ~30bps and supports a tighter credit spread on the 2028 bond.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={FCF_WALK} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="k" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                    {FCF_WALK.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('FCF TTM BSD ')}{ KPI.fcfTtmM }M — {tt('sustainable at current CapEx intensity and leverage.')}
            </div>
          </Panel>
        </div>

        {/* Peer comparison table */}
        <Panel title={tt('Peer comparison — EBITDA margin · leverage · TSR · NPS')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Company')}</th>
                  <th className="text-right">{tt('EBITDA margin')}</th>
                  <th className="text-right">{tt('Net debt / EBITDA')}</th>
                  <th className="text-right">{tt('5-yr TSR')}</th>
                  <th className="text-right">{tt('NPS')}</th>
                </tr>
              </thead>
              <tbody>
                {PEERS.map((p, i) => (
                  <tr key={i} className={`border-t border-black/5 ${p.name === 'Cable Bahamas' ? 'bg-blue-50/40 font-bold' : ''}`}>
                    <td className="py-2.5 font-semibold">{p.name}</td>
                    <td className={`text-right ${p.ebitdaMargin >= 38 ? 'text-emerald-600 font-bold' : ''}`}>{p.ebitdaMargin}%</td>
                    <td className={`text-right ${p.leverage <= 2.8 ? 'text-emerald-600 font-bold' : ''}`}>{p.leverage}×</td>
                    <td className={`text-right ${p.tsr >= 60 ? 'text-emerald-600 font-bold' : ''}`}>+{p.tsr}%</td>
                    <td className={`text-right ${p.nps >= 36 ? 'text-emerald-600 font-bold' : ''}`}>+{p.nps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
            {tt('Cable Bahamas leads on all four metrics vs Bahamian peers as of May 2026.')}
          </div>
        </Panel>
      </>)}

      {/* ═══════ TSR & RETURNS ═══════ */}
      {tab === 'tsr' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('5-yr TSR')}            value={`+${KPI.tsr5yrPct}%`}     delta={tt('vs peer +28% / index +21%')} trend="up"   icon={TrendingUp} accent />
          <KpiCard label={tt('FY26e dividend')}       value="BSD 40M"                     delta={tt('BSD 0.62 / share · +11% YoY')}  trend="up"   icon={DollarSign} />
          <KpiCard label={tt('FY26e buyback')}        value="BSD 30M"                     delta={tt('Tranche 3 · board approved')} trend="up"   icon={Award} />
          <KpiCard label={tt('Total shareholder return FY26e')} value="BSD 70M"          delta={tt('dividend + buyback combined')} trend="up"  icon={Wallet} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Total shareholder return vs peers — 5-yr indexed 100')} insight={{ insight: '5-year TSR of +78% versus peer median +28% and IBEX +21% demonstrates sustained capital-allocation discipline.', action: 'Lead roadshow narrative with TSR outperformance to attract GARP funds currently underweight the Bahamian telco sector.', impact: 'Institutional re-weighting by GARP mandates could add 3–4% to float turnover and reduce the discount to intrinsic NAV.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={TSR}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="y" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="tln"   stroke={BLUE}  strokeWidth={2.5} name="Cable Bahamas" dot />
                  <Line type="monotone" dataKey="peerA" stroke={NAVY}  strokeWidth={1.5} name={tt('Peer A')} />
                  <Line type="monotone" dataKey="peerB" stroke={AMBER} strokeWidth={1.5} name={tt('Peer B')} />
                  <Line type="monotone" dataKey="index" stroke={SLATE} strokeDasharray="4 4" strokeWidth={1.5} name={tt('Sector index')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55 flex items-center gap-1">
              <Brain className="w-3 h-3 text-vfes-dark" />
              {tt('Cable Bahamas at 172 vs peer 128 — 44 pts of outperformance; lead the equity story with it.')}
            </div>
          </Panel>

          <Panel title={tt('Shareholder returns — dividend & buyback (BSD M)')} insight={{ insight: 'Combined FY26e shareholder returns of BSD 70M represent a 5.8% total yield, double the IBEX 35 sector average.', action: 'Pre-announce the Q3 buyback tranche early to anchor share-price floor ahead of the annual consensus reset in October.', impact: 'Yield anchoring reduces price volatility and lowers the hurdle for value-oriented mandates to initiate new positions.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={returnsWithTotal}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="y" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="dividend" stackId="a" fill={NAVY} name={tt('Dividend')} />
                  <Bar dataKey="buyback"  stackId="a" fill={BLUE} name={tt('Buyback')} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Total distributions rising to BSD 70M in FY26e — sustainable at 2.6× leverage and BSD 84M FCF TTM.')}
            </div>
          </Panel>
        </div>

        {/* shareholder structure */}
        <Panel title={tt('Shareholder structure — % of issued share capital')} insight={{ insight: 'Institutional free float of 54% is concentrated in three sovereign-adjacent funds, creating single-seller tail risk.', action: 'Target UK and Nordic long-only growth funds at the Q4 non-deal roadshow to diversify the investor base.', impact: 'Broader ownership reduces technical selling pressure and supports a tighter bid-ask spread and lower liquidity premium.' }}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SHAREHOLDERS} dataKey="pct" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                    {SHAREHOLDERS.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm self-center">
              {SHAREHOLDERS.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
                  <span className="flex-1">{tt(s.name)}</span>
                  <span className="font-bold">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </>)}

      {/* ═══════ ANALYST CONSENSUS ═══════ */}
      {tab === 'consensus' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Coverage analysts')}   value={`${totalAnalysts}`}          delta={tt('active coverage')}          trend="up"   icon={Users}     accent />
          <KpiCard label={tt('Buy ratings')}          value={`${buys}`}                   delta={`${Math.round((buys / totalAnalysts) * 100)}% of coverage`} trend="up" icon={Award} />
          <KpiCard label={tt('Consensus target')}     value="BSD 29.40"                      delta={tt('+12.2% vs BSD 26.20 spot')}    trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Implied upside')}       value="+12.2%"                      delta={tt('consensus vs spot')}         trend="up"   icon={Activity}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Analyst consensus — rating distribution')} insight={{ insight: '11 of 19 analysts hold a Buy rating with a consensus price target of BSD 29.40, implying 12% upside to current spot.', action: 'Host a capital-allocation deep-dive call to convert the three remaining Hold-rated analysts ahead of Q3 results.', impact: 'Moving two Hold ratings to Buy historically correlates with a 5–7% re-rating over the following 90-day window in comparable peers.' }} action={
            <div className="flex gap-1">
              {(['count', 'rating'] as const).map(s => (
                <button key={s} onClick={() => setAnalystSort(s)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${ analystSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
                  {tt(s === 'count' ? 'Sort: count' : 'Sort: A-Z')}
                </button>
              ))}
            </div>
          }>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sortedAnalysts}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="rating" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} analysts`, '']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {sortedAnalysts.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('11 of 19 rate Buy; consensus price target BSD 29.40 vs BSD 26.20 spot — ~12% implied upside.')}
            </div>
          </Panel>

          {/* Price target distribution */}
          <Panel title={tt('Price target range — sell-side coverage')} insight={{ insight: 'Sell-side price targets cluster between BSD 27 and BSD 32 with the mode at BSD 29–30, placing spot BSD 26.20 at a 10% discount to consensus mid.', action: 'Increase one-on-one outreach to the two outlier Sell-rated analysts to address FCF sustainability concerns directly.', impact: 'Narrowing the bear-bull price-target spread tightens implied volatility and lowers the cost of any future equity issuance.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={[
                  { t: 'BSD 22-23', n: 1 }, { t: 'BSD 23-24', n: 1 }, { t: 'BSD 24-25', n: 2 },
                  { t: 'BSD 25-26', n: 2 }, { t: 'BSD 26-27', n: 3 }, { t: 'BSD 27-28', n: 2 },
                  { t: 'BSD 28-29', n: 3 }, { t: 'BSD 29-30', n: 3 }, { t: 'BSD 30-31', n: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine x="BSD 26-27" stroke={AMBER} strokeDasharray="4 4" label={{ value: tt('Spot'), fontSize: 10, fill: AMBER }} />
                  <ReferenceLine x="BSD 29-30" stroke={GREEN}  strokeDasharray="4 4" label={{ value: tt('Consensus'), fontSize: 10, fill: GREEN }} />
                  <Area type="monotone" dataKey="n" name={tt('# analysts')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Price targets cluster BSD 27–31; 4 NYR analysts expected to initiate after Q2 earnings.')}
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Full P&L detail')}
          </Link>
          <Link to="/portal/cfo" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('CFO dashboard')}
          </Link>
        </div>
      </>)}

      {/* ═══════ GUIDANCE & OUTLOOK ═══════ */}
      {tab === 'guidance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FY26 revenue guidance')}  value={`BSD ${GUIDANCE_FY.revenueLow}–${GUIDANCE_FY.revenueHigh}M`} delta={tt('current guidance range')} trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('FY26 EBITDA guidance')}   value={`BSD ${GUIDANCE_FY.ebitdaLow}–${GUIDANCE_FY.ebitdaHigh}M`} delta={tt('37–39% margin target')}    trend="up" icon={DollarSign} />
          <KpiCard label={tt('FY26 FCF guidance')}      value={`BSD ${GUIDANCE_FY.fcfLow}–${GUIDANCE_FY.fcfHigh}M`}       delta={tt('after CapEx')}              trend="up" icon={Wallet} />
          <KpiCard label={tt('FY26 CapEx')}             value={`≤ BSD ${GUIDANCE_FY.capexMax}M`}                           delta={tt('≤22% revenue intensity')}   trend="flat" icon={Briefcase} />
        </div>

        {/* toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-vfes-dark/60">{tt('Show guidance band:')}</span>
          <button onClick={() => setShowGuidance(g => !g)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${showGuidance ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt(showGuidance ? 'On' : 'Off')}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Guidance vs actual — quarterly revenue (BSD M)')} insight={{ insight: 'Actual quarterly revenue has beaten the high end of guidance in three of the last four periods, establishing a positive surprise pattern.', action: 'Narrow FY guidance ranges to rebuild conservatism and reset the basis for further upside surprises in H2.', impact: 'Credible guidance conservatism reduces the earnings-surprise risk premium and supports lower short interest from hedge fund desks.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={GUIDANCE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" domain={[125, 145]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {showGuidance && <>
                    <Area type="monotone" dataKey="guideHigh" stroke={NAVY} fill={BLUE}  fillOpacity={0.08} name={tt('Guidance high')} />
                    <Area type="monotone" dataKey="guideLow"  stroke={NAVY} fill="#fff"  fillOpacity={1}    name={tt('Guidance low')}  />
                  </>}
                  <Line type="monotone" dataKey="actual" stroke={GREEN} strokeWidth={2.5} dot name={tt('Actual')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Four straight quarters landing in the top half of guidance — the credibility that supports a re-rating.')}
            </div>
          </Panel>

          {/* Guidance table */}
          <Panel title={tt('FY2026 guidance snapshot')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Metric')}</th>
                    <th className="text-right">{tt('Low')}</th>
                    <th className="text-right">{tt('High')}</th>
                    <th className="text-right">{tt('H1 run-rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { m: 'Revenue (BSD M)',       lo: GUIDANCE_FY.revenueLow,  hi: GUIDANCE_FY.revenueHigh, run: ((KPI.revenueQtrM + 138.6) * 2).toFixed(0) },
                    { m: 'EBITDA (BSD M)',        lo: GUIDANCE_FY.ebitdaLow,   hi: GUIDANCE_FY.ebitdaHigh,  run: ((KPI.ebitdaM * 3 + 53.5) * 2).toFixed(0) },
                    { m: 'FCF (BSD M)',           lo: GUIDANCE_FY.fcfLow,      hi: GUIDANCE_FY.fcfHigh,     run: '43' },
                    { m: 'CapEx (BSD M)',         lo: 160,                      hi: GUIDANCE_FY.capexMax,    run: '91' },
                    { m: 'Dividend / share',   lo: 0.58,                     hi: 0.64,                   run: '0.31 interim' },
                  ].map((r, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{tt(r.m)}</td>
                      <td className="text-right text-vfes-dark/65">{r.lo}</td>
                      <td className="text-right font-bold">{r.hi}</td>
                      <td className="text-right text-emerald-600 font-bold">{r.run}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
              {tt('H1 run-rate implies mid-to-upper end of guidance; upgrade risk for Q3 guidance.')}
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/portal/pricing-simulator" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Pricing simulator')}
          </Link>
          <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Full financials')}
          </Link>
        </div>
      </>)}

      {/* ═══════ ESG & CREDIT ═══════ */}
      {tab === 'esg' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MSCI ESG')}          value="AA"                    delta={tt('Leaders class · upgraded FY25')}   trend="up"   icon={Award}      accent />
          <KpiCard label={tt('CDP Climate')}        value="A-"                    delta={tt('Leadership · ↑ from B+')}          trend="up"   icon={Leaf as any} />
          <KpiCard label={tt('Credit rating')}      value={KPI.creditRating}      delta={tt('S&P Stable · Moody\'s Baa2')}      trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Renewable electricity')} value={`${KPI.renewablePct}%`} delta={tt('target 100% by 2028')}        trend="up"   icon={Globe} />
        </div>

        {/* ESG sub-tab toggle */}
        <div className="flex gap-2 mb-4">
          {(['ratings', 'pillars'] as const).map(t => (
            <button key={t} onClick={() => setEsgTab(t)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${esgTab === t ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:border-vfes-red/40'}`}>
              {tt(t === 'ratings' ? 'ESG ratings' : 'ESG pillars')}
            </button>
          ))}
        </div>

        {esgTab === 'ratings' && (<>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('ESG ratings — agency breakdown')}>
              <div className="space-y-3">
                {ESG_RATINGS.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                    <div className="w-28 font-bold text-sm">{r.agency}</div>
                    <div className="text-2xl font-extrabold text-vfes-dark">{r.rating}</div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">{r.cat}</div>
                      <div className="text-[10px] text-emerald-600 font-bold">{r.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
                {tt('Last updated: Jun 2026 · Next MSCI review: Q4 2026')}
              </div>
            </Panel>

            {/* Debt ladder */}
            <Panel title={tt('Debt maturity ladder (BSD M)')} insight={{ insight: 'Debt concentration in the 2027–2028 window represents BSD 380M of refinancing need within 24 months at current spread levels.', action: 'Initiate early refinancing of the 2027 tranche in Q4 via a 5-year bond to lock in the current Baa2 spread before any rate uptick.', impact: 'Pre-emptive refinancing eliminates rollover risk premium, preserving the Baa2 rating and reducing annual interest cost by ~BSD 6M.' }}>
              <div className="flex gap-2 mb-3">
                {(['ladder', 'pie'] as const).map(v => (
                  <button key={v} onClick={() => setDebtView(v)}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition ${debtView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
                    {tt(v === 'ladder' ? 'Bar chart' : 'Pie chart')}
                  </button>
                ))}
              </div>
              {debtView === 'ladder' ? (
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart data={DEBT_LADDER}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="y" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="M" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                      <Bar dataKey="amt" fill={NAVY} radius={[4, 4, 0, 0]} name={tt('BSD M')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={DEBT_LADDER} dataKey="amt" nameKey="y" innerRadius={40} outerRadius={78} paddingAngle={2}>
                        {DEBT_LADDER.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, PURPLE, AMBER, GREEN, SLATE][i % 6]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('Total debt ')} <span className="font-bold">BSD {totalDebt}M</span> · {tt('weighted avg maturity 4.2 yr · avg cost 4.8%')}
              </div>
            </Panel>
          </div>

          {/* Covenants table */}
          <Panel title={tt('Financial covenants — headroom')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Covenant')}</th>
                    <th className="text-right">{tt('Target')}</th>
                    <th className="text-right">{tt('Actual')}</th>
                    <th className="text-right">{tt('Headroom')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COVENANTS.map((c, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{tt(c.c)}</td>
                      <td className="text-right text-vfes-dark/65">{c.target}</td>
                      <td className="text-right font-bold text-vfes-dark">{c.actual}</td>
                      <td className="text-right font-bold text-emerald-600">{c.headroom}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
              {tt('All 5 covenants passing with comfortable headroom as of Q2-26.')}
            </div>
          </Panel>
        </>)}

        {esgTab === 'pillars' && (<>
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {[
              { pillar: 'Environmental', items: [
                { kpi: 'Scope 1+2 emissions reduction', current: '-22%', target: '-50%', status: 'on-track' },
                { kpi: 'Renewable electricity', current: `${KPI.renewablePct}%`, target: '100%', status: 'on-track' },
                { kpi: 'E-waste recycled', current: '88%', target: '95%', status: 'on-track' },
                { kpi: 'Energy cost / Gbps', current: 'BSD 34', target: 'BSD 30', status: 'on-track' },
              ], color: GREEN },
              { pillar: 'Social', items: [
                { kpi: 'Employee engagement', current: '78%', target: '85%', status: 'on-track' },
                { kpi: 'Women in leadership', current: '34%', target: '40%', status: 'at-risk' },
                { kpi: 'Digital inclusion programme', current: '120K', target: '200K customers', status: 'on-track' },
                { kpi: 'Lost time injury rate', current: '0.42', target: '<0.50', status: 'on-track' },
              ], color: BLUE },
              { pillar: 'Governance', items: [
                { kpi: 'Board independence', current: '71%', target: '≥66%', status: 'on-track' },
                { kpi: 'Audit committee meetings', current: '8 / yr', target: '≥6', status: 'on-track' },
                { kpi: 'Data incidents (P1)', current: '0', target: '0', status: 'on-track' },
                { kpi: 'Anti-bribery training', current: '100%', target: '100%', status: 'on-track' },
              ], color: PURPLE },
            ].map((s, i) => (
              <Panel key={i} title={tt(s.pillar)}>
                <div className="space-y-2.5">
                  {s.items.map((it, j) => (
                    <div key={j} className="border-b border-black/5 pb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-xs">{tt(it.kpi)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${it.status === 'on-track' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(it.status)}</span>
                      </div>
                      <div className="text-[10px] text-vfes-dark/65">
                        {tt('Current')}: <span className="font-bold" style={{ color: s.color }}>{it.current}</span>
                        {' '} → {tt('target')}: {it.target}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        </>)}

        <div className="flex items-center gap-4 mt-2">
          <Link to="/portal/regulatory" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Regulatory detail')}
          </Link>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Trust Center')}
          </Link>
        </div>
      </>)}

      {/* ═══════ IR CALENDAR ═══════ */}
      {tab === 'calendar' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Next earnings call')}   value="29 Jul"   delta={tt('Q2 2026 · pre-market')}    trend="up"   icon={Calendar}  accent />
          <KpiCard label={tt('Capital Markets Day')}  value="10 Nov"   delta={tt('Freeport · in-person')}   trend="up"   icon={Building2} />
          <KpiCard label={tt('Annual dividend')}      value="BSD 0.62"    delta={tt('per share · FY26e')}        trend="up"   icon={DollarSign} />
          <KpiCard label={tt('AGM date')}             value="25 Mar 27" delta={tt('Abaco')}               trend="flat" icon={Award} />
        </div>

        {/* Full calendar */}
        <Panel title={tt('IR event calendar — upcoming 12 months')}>
          <div className="space-y-2">
            {EARNINGS_CALENDAR.map((e, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition">
                <div className="w-28 shrink-0">
                  <div className="font-bold text-sm">{e.date.split(' ')[0]}</div>
                  <div className="text-[10px] text-vfes-dark/55">{e.date.split(' ').slice(1).join(' ')}</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{tt(e.event)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/45">{tt(e.type)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(e.status)}`}>{tt(e.status)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-vfes-dark/30 shrink-0 mt-1" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
            {tt('All dates subject to regulatory confirmation · embargo applies 48 hr pre-release')}
          </div>
        </Panel>

        {/* Quarterly cadence overview */}
        <div className="mt-5">
          <Panel title={tt('Investor engagement cadence — FY2026')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Quarter')}</th>
                    <th>{tt('Key event')}</th>
                    <th>{tt('Audience')}</th>
                    <th className="text-right">{tt('Meetings est.')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { q: 'Q2-26', ev: 'Earnings call + roadshow London/Edinburgh', aud: 'Buyside / Sellside', meetings: 28, status: 'Upcoming' },
                    { q: 'Q3-26', ev: 'Capital Markets Day — Freeport',           aud: 'Institutional / Press', meetings: 80, status: 'Scheduled' },
                    { q: 'Q4-26', ev: 'Q3 earnings + Paris roadshow',              aud: 'Buyside',              meetings: 20, status: 'Scheduled' },
                    { q: 'Q1-27', ev: 'FY26 preliminary results',                  aud: 'All investors',        meetings: 35, status: 'Scheduled' },
                  ].map((r, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-bold">{r.q}</td>
                      <td className="font-semibold text-xs">{tt(r.ev)}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(r.aud)}</td>
                      <td className="text-right font-bold">{r.meetings}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CAPITAL ALLOCATION ═══════ */}
      {tab === 'capalloc' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FY26e CapEx')}           value="BSD 180M"    delta={tt('≤22% of revenue')}           trend="flat" icon={Briefcase}  accent />
          <KpiCard label={tt('WACC')}                   value="5.72%"    delta={tt('10yr Bono 3.40% + risk')}    trend="flat" icon={DollarSign} />
          <KpiCard label={tt('Dividend yield FY26e')}   value="3.5%"     delta={tt('BSD 0.62/share target')}         trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Total shareholder yield')}value="5.2%"     delta={tt('dividend + buyback')}        trend="up"   icon={Award} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('CapEx allocation by area — FY23-FY26e (BSD M)')} insight={{ insight: '5G and fibre infrastructure absorb 61% of total CapEx, consistent with the capital-light enterprise strategy stated in FY24.', action: 'Frame CapEx intensity reduction to 16.5% of revenue in investor presentations to improve FCF yield comparisons versus European peers.', impact: 'Lower CapEx intensity narrative can narrow the EV/FCF discount to Deutsche Telekom by 0.5–0.8 turns over two reporting cycles.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CAPALLOC}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="y" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="network"        name={tt('Network')}       fill={BLUE}   stackId="a" />
                  <Bar yAxisId="l" dataKey="it"             name={tt('IT / Data')}      fill={NAVY}   stackId="a" />
                  <Bar yAxisId="l" dataKey="commercial"     name={tt('Commercial')}     fill={PURPLE} stackId="a" />
                  <Bar yAxisId="l" dataKey="sustainability" name={tt('Sustainability')} fill={GREEN}  stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Network absorbs 57% of CapEx. Sustainability growing +125% over 3 years (solar network + EV fleet) in line with Net Zero 2030.')}
            </div>
          </Panel>

          <Panel title={tt('Capital return yield — dividend yield + buyback yield (%)')} insight={{ insight: 'Total capital return yield of 5.8% in FY26e is the highest in the Bahamian telco peer group and 2.1pp above the sector average.', action: 'Publish a multi-year capital return framework committing to at least 5% combined yield through FY28 to attract income-mandate investors.', impact: 'A formalised yield floor expands the eligible investor universe to pension and insurance mandates, supporting a lower cost of equity.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={RETURNS_POLICY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="y" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 6]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="dividendYield" name={tt('Dividend yield')} fill={NAVY}  stackId="a" />
                  <Bar dataKey="buybackYield"  name={tt('Buyback yield')}  fill={BLUE}  stackId="a" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="totalReturn" name={tt('Total yield')} stroke={AMBER} strokeWidth={2.5} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Total shareholder yield rises to 5.2% in FY26e — above the sector average (4.1%). Sustainable at FCF TTM BSD ')}{ KPI.fcfTtmM }M.
            </div>
          </Panel>
        </div>

        <Panel title={tt('NPV and IRR of investment programmes — WACC 5.72%')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                    <th className="py-2">{tt('Programme')}</th>
                  <th className="text-right">{tt('WACC')}</th>
                  <th className="text-right">{tt('IRR')}</th>
                  <th className="text-right">{tt('NPV (BSD M)')}</th>
                  <th className="text-right">{tt('Payback (yr)')}</th>
                  <th>{tt('Decision')}</th>
                </tr>
              </thead>
              <tbody>
                {NPV_PROGRAMS.map((p, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(p.program)}</td>
                    <td className="text-right text-vfes-dark/65">{p.wacc}%</td>
                    <td className={`text-right font-bold ${p.irr >= p.wacc + 5 ? 'text-emerald-600' : p.irr >= p.wacc ? 'text-amber-600' : 'text-red-600'}`}>{p.irr}%</td>
                    <td className="text-right font-bold text-emerald-600">BSD {p.npvM}M</td>
                    <td className="text-right">{p.payback}yr</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        p.status === 'Go' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{tt(p.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
            {tt('All “Go” projects exceed WACC by ≥4 pp. B2B SD-WAN and Solar under review due to payback >6 years.')}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('WACC components — breakdown')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Component')}</th>
                    <th className="text-right">{tt('Value %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {WACC_COMPONENTS.map((w, i) => (
                    <tr key={i} className={`border-t border-black/5 ${w.type === 'total' ? 'font-bold bg-blue-50/40' : ''}`}>
                      <td className="py-2">{tt(w.component)}</td>
                      <td className={`text-right font-bold ${w.type === 'shield' ? 'text-emerald-600' : 'text-vfes-dark'}`}>
                        {w.value > 0 ? `${w.value}%` : `${w.value}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Finance / P&L')}
          </Link>
          <Link to="/portal/capital-treasury" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Capital & Treasury')}
          </Link>
          <Link to="/portal/strategy" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Strategy & OKRs')}
          </Link>
          <Link to="/portal/cfo" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('CFO dashboard')}
          </Link>
        </div>
      </>)}

      {/* ═══════ IR COCKPIT ═══════ */}
      {tab === 'cockpit' && (<>
        <DomainGrid title={tt('Domain navigation — IR-linked pages')} links={IR_DOMAIN_LINKS_FIXED} />
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <PriorityList title={tt('IR team priorities — Q3 2026')} items={IR_PRIORITIES} />
          <WatchList    title={tt('IR watch list')}                 items={IR_WATCH} />
        </div>
        <div className="mt-5">
          <AgendaList title={tt('IR event calendar — next 6 events')} items={IR_AGENDA} />
        </div>
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <Panel title={tt('Key IR metrics snapshot')}>
            <div className="space-y-3 text-sm">
              {[
                { k: '5-yr TSR',           v: `+${KPI.tsr5yrPct}%`,             color: 'text-emerald-600' },
                { k: 'Analyst consensus',  v: `${buys}/${totalAnalysts} Buy`,    color: 'text-emerald-600' },
                { k: 'Price target',       v: 'BSD 29.40',                           color: 'text-emerald-600' },
                { k: 'Net debt / EBITDA',  v: `${KPI.netDebtEbitdaX}×`,          color: '' },
                { k: 'MSCI ESG rating',    v: 'AA',                              color: 'text-emerald-600' },
                { k: 'Credit rating',      v: KPI.creditRating,                  color: '' },
                { k: 'FCF TTM',            v: `BSD ${KPI.fcfTtmM}M`,               color: 'text-emerald-600' },
                { k: 'EBITDA margin',      v: `${KPI.ebitdaMarginPct}%`,         color: 'text-emerald-600' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-vfes-dark/65">{tt(r.k)}</span>
                  <span className={`font-bold ${r.color}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={tt('Quick links')}>
            <div className="space-y-2 text-sm">
              {[
                { to: 'finance',          label: 'Full P&L and CapEx detail' },
                { to: 'capital-treasury', label: 'Capital & Treasury' },
                { to: 'regulatory',       label: 'Regulatory landscape' },
                { to: 'strategy',         label: 'Strategy & OKRs' },
                { to: 'cfo',              label: 'CFO dashboard' },
              ].map((l, i) => (
                <Link key={i} to={`/portal/${l.to}`} className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30">
                  <span className="font-semibold">{tt(l.label)}</span>
                  <ArrowRight className="w-4 h-4 text-vfes-dark/30" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
