import { FINANCE, FINANCE_TREND, round } from '../../data/scenario'
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import tt from '../../i18n/tt'
import KPI from './_kpi_facts'
import {
  Wallet, Landmark, ShieldCheck, Receipt, Briefcase, ShoppingCart, Package, TrendingUp,
  Percent, Coins, Banknote, Target, AlertTriangle, Award, ArrowUpRight, DollarSign,
  Calendar, Activity, GitBranch, Bell, Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

// ─── palette ────────────────────────────────────────────────────────────────
const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const GREY   = '#94a3b8'
const DARK   = '#0B0B0F'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── derived constants ───────────────────────────────────────────────────────
// Quarterly EBITDA (136.8 × 38.6% = 52.8 M)
const EBITDA_Q = +(KPI.revenueQtrM * KPI.ebitdaMarginPct / 100).toFixed(1)

// ─── P&L data (reconciled quarterly, Q4 2026) ───────────────────────────────
const quarterlyPnl = [['Revenue',12],['COGS',-4.8],['Gross profit',7.2],['Sales & Marketing',-1.8],['G&A',-0.9],['EBITDA',4.5],['D&A',-1.5],['EBIT',3],['Interest expense',-0.6],['Tax',-0.3],['Net income',2.1]].map(([line,value])=>({line:String(line),actual:round(Number(value)*KPI.revenueQtrM/12),plan:round(Number(value)*KPI.revenueQtrM/12*1.02),py:round(Number(value)*KPI.revenueQtrM/12*0.95)}))

const revTrend = Array.from({length:4},(_,index)=>({q:['Jun–Aug','Sep–Nov','Dec–Feb','Mar–May'][index],actual:round(FINANCE_TREND.slice(index*3,index*3+3).reduce((sum,row)=>sum+row.revenue,0)),plan:round(FINANCE_TREND.slice(index*3,index*3+3).reduce((sum,row)=>sum+row.plan,0))}))

const ebitdaWalk = [{k:'Prior scenario',v:round(EBITDA_Q*0.95),color:GREY},{k:'Net improvement',v:round(EBITDA_Q*0.05),color:GREEN},{k:'Current scenario',v:EBITDA_Q,color:BLUE}]

const arpuByTier = [
  { tier: '250 Mb',    arpu: 32,  share: 18, churn: 4.2, margin: 34 },
  { tier: '500 Mb',    arpu: 42,  share: 28, churn: 3.6, margin: 40 },
  { tier: '1 Gb',      arpu: 54,  share: 22, churn: 2.4, margin: 44 },
  { tier: '2 Gb',      arpu: 64,  share: 8,  churn: 1.8, margin: 48 },
  { tier: 'B2B Fibre', arpu: 124, share: 6,  churn: 1.4, margin: 52 },
  { tier: 'REVConnect',      arpu: 84,  share: 17, churn: 1.6, margin: 46 },
]

// ─── cash flow data ──────────────────────────────────────────────────────────
// FCF TTM (Q1-26 + Q2-26 + Q3-26 + Q4-26) = 20.2+21.4+21.0+21.4 = 84.0 = KPI.fcfTtmM ✓
const cashflowQtly = Array.from({length:4},(_,index)=>{const rows=FINANCE_TREND.slice(index*3,index*3+3);return {q:['Jun–Aug','Sep–Nov','Dec–Feb','Mar–May'][index],ocf:round(rows.reduce((sum,row)=>sum+row.ocf,0)),capex:round(rows.reduce((sum,row)=>sum+row.capex,0)),fcf:round(rows.reduce((sum,row)=>sum+row.fcf,0))}})

const cash13wk = Array.from({length:13},(_,index)=>({wk:`W${index+1}`,inflow:3,outflow:2.7,balance:round(FINANCE.cashM+(index+1)*0.3)}))

const arAgingData = [
  { bucket: 'Current',    amt: 42.6, color: GREEN      },
  { bucket: '1-30 days',  amt:  9.2, color: AMBER      },
  { bucket: '31-60 days', amt:  3.2, color: '#fb923c'  },
  { bucket: '61-90 days', amt:  1.6, color: '#ef4444'  },
  { bucket: '90+ days',   amt:  1.2, color: '#7f1d1d'  },
]

const topOverdueAR = [
  { acc: 'BTC Wholesale (interconnect)',  amt: 1240, dso: 88, status: 'Disputed'   },
  { acc: 'Island Bank (demo) Group',                    amt:  684, dso: 64, status: 'In dunning' },
  { acc: 'Island Logistics (demo) Group Healthcare',                amt:  542, dso: 78, status: 'Review'     },
  { acc: 'Nassau City Council',                amt:  386, dso: 54, status: 'Promise'    },
  { acc: 'Island Air (demo) Holdings',                   amt:  284, dso: 42, status: 'Promise'    },
]

// ─── CapEx data ──────────────────────────────────────────────────────────────
// Sum: 44+24+18+12+8+6+3+3 = 118 = capexYTD ✓
const capexByCat = [
  { cat: 'FTTH footprint build', v: 44, color: BLUE   },
  { cat: 'DOCSIS 3.1 / 4.0',    v: 24, color: NAVY   },
  { cat: 'CPE / Wi-Fi 7',        v: 18, color: GREEN  },
  { cat: 'Backbone 400G',        v: 12, color: AMBER  },
  { cat: 'Mobile / Open RAN',    v:  8, color: PURPLE },
  { cat: 'IT / OSS / BSS',       v:  6, color: GREY   },
  { cat: 'Real estate',          v:  3, color: '#0ea5e9' },
  { cat: 'Sustainability',       v:  3, color: '#059669' },
]

const buildVsMaintain = [
  { name: 'Build',       value: 68, color: BLUE },
  { name: 'Maintenance', value: 32, color: GREY },
]

const capexProgrammes = [
  { p: 'Abaco West XGS-PON',     budget:  18.4, spent:  12.8, npv:  24.6, irr: 22, payback: '3.4 yr', rag: 'Green' },
  { p: 'Freeport Suburban FTTH',   budget:  28.6, spent:  18.4, npv:  31.2, irr: 18, payback: '4.2 yr', rag: 'Amber' },
  { p: '400G Backbone refresh',     budget:  38.0, spent:  22.6, npv:  14.8, irr: 14, payback: '5.1 yr', rag: 'Green' },
  { p: 'XGS-PON full overlay',      budget: 124.0, spent:  38.4, npv:  96.4, irr: 16, payback: '6.4 yr', rag: 'Amber' },
  { p: 'DOCSIS 4.0 trial (Rum Cay)', budget:   4.8, spent:   4.2, npv:   3.2, irr: 24, payback: '2.8 yr', rag: 'Green' },
  { p: 'EV fleet transition',       budget:  12.0, spent:   4.2, npv:   6.4, irr: 12, payback: '5.4 yr', rag: 'Amber' },
]

// ─── Balance sheet ───────────────────────────────────────────────────────────
// Sum: 24+84+64+96+32+20 = 320 = net debt ✓
const debtLadder = [
  { y: '2026',  amt:  24, type: 'Term loan A'  },
  { y: '2027',  amt:  84, type: 'Notes 4.5%'   },
  { y: '2028',  amt:  64, type: 'Notes 5.1%'   },
  { y: '2029',  amt:  96, type: 'Notes 5.4%'   },
  { y: '2030',  amt:  32, type: 'Term loan B'  },
  { y: '2031+', amt:  20, type: 'Revolver'     },
]

const covenants = [
  { c: 'Net Debt / EBITDA',        target: '≤ 4.0×', actual: `${KPI.netDebtEbitdaX}×`, headroom: '0.9×',    status: 'Pass' },
  { c: 'Interest cover',            target: '≥ 3.0×', actual: '4.4×',               headroom: '1.4×',    status: 'Pass' },
  { c: 'Liquidity (cash + RCF)',    target: '≥ BSD 50M', actual: 'BSD 146M',              headroom: 'BSD 96M',    status: 'Pass' },
  { c: 'CapEx / Revenue',           target: '≤ 22%',  actual: '20.4%',              headroom: '1.6 pp',  status: 'Pass' },
  { c: 'Bad debt / Revenue',        target: '≤ 1.5%', actual: '1.2%',               headroom: '0.3 pp',  status: 'Pass' },
]

const fxHedges = [
      { instr: 'IRS · floating → fixed (BSD 84M notes)',     notional:  84, expiry: 'May 29', mtm:  1.8, status: 'Active' },
  { instr: 'Fuel surcharge hedge · grid electricity (BPL)', notional: 4.2, expiry: 'May 27', mtm:  0.2, status: 'Active' },
]

// ─── Forecast & scenarios ────────────────────────────────────────────────────
const ebitdaScenarios = Array.from({ length: 8 }, (_, i) => ({
  q:    `Q${(i % 4) + 1}-${i < 4 ? '26' : '27'}`,
  bull: +(EBITDA_Q + i * 1.6 + 0.4).toFixed(1),
  base: +(EBITDA_Q + i * 0.9).toFixed(1),
  bear: +(EBITDA_Q + i * 0.3 - (i > 3 ? 0.6 : 0)).toFixed(1),
  plan: +(53.2 + i * 0.7).toFixed(1),
}))

const sensitivities = [
  { driver: 'ARPU ±5%',        upside: 13.7, downside: -13.7 },
  { driver: 'Net adds ±10%',   upside:  5.4, downside:  -5.4 },
  { driver: 'Churn ±50 bp',    upside:  3.8, downside:  -3.8 },
  { driver: 'Energy ±15%',     upside:  1.2, downside:  -1.8 },
  { driver: 'Hurricane outage ±1 event', upside:  0.6, downside:  -2.8 },
  { driver: 'Bad debt ±50 bp', upside:  0.7, downside:  -0.7 },
]

const riskRegister = [
  { r: 'BTC Fibre BSD 40/mo promo persistence',   impact: 'BSD 5.6M ARR',      prob: 'High',   sev: 'High',   mit: 'Targeted price-match for at-risk base only' },
  { r: 'Rival ISP B content cost inflation FY27',          impact: 'BSD 8.4M GP',       prob: 'Medium', sev: 'High',   mit: 'Re-negotiate before H1 2027' },
  { r: 'US rate normalisation · 2027 refinancing', impact: '+BSD 1.2M interest', prob: 'Low',   sev: 'Medium', mit: '80% fixed via IRS hedges; monitoring' },
  { r: 'B2B AR concentration (top 5 = 38%)',        impact: 'BSD 3.3M bad debt', prob: 'Low',    sev: 'High',   mit: 'Credit insurance in place; dunning escalated' },
  { r: 'Hurricane season · restoration + revenue credits', impact: 'BSD 6.5M EBITDA', prob: 'Medium', sev: 'High', mit: 'Parametric cover + catastrophe reserve; pre-staged spares' },
  { r: 'URCA wholesale price intervention',         impact: 'TBD',            prob: 'Low',    sev: 'High',   mit: 'Active regulatory engagement programme' },
  { r: 'Energy price spike beyond hedge',           impact: 'BSD 2.6M OpEx',     prob: 'Medium', sev: 'Medium', mit: 'Hedged 80% · extending cover to FY27 H1' },
]

// ─── Cost-out programme ───────────────────────────────────────────────────────
// target sum: 15.0M ✓   ytd sum: 6.2M ✓
const costOutInitiatives = [
  { initiative: 'Network OpEx automation (AIOps)',        target: 3.2, ytd: 1.4, status: 'on-track', owner: 'Technology'  },
  { initiative: 'Procurement consolidation (top-20)',     target: 2.8, ytd: 1.8, status: 'on-track', owner: 'Procurement' },
  { initiative: 'Property rationalisation (22 sites)',    target: 2.4, ytd: 0.6, status: 'at-risk',  owner: 'Real Estate' },
  { initiative: 'Field operations route optimisation',    target: 1.8, ytd: 1.2, status: 'on-track', owner: 'Field Ops'   },
  { initiative: 'Power & energy efficiency programme',    target: 1.6, ytd: 0.8, status: 'on-track', owner: 'Network'     },
  { initiative: 'IT licence rationalisation',            target: 1.4, ytd: 0.4, status: 'behind',   owner: 'CTO office'  },
  { initiative: 'Shared service centre · back-office',   target: 1.8, ytd: 0.0, status: 'behind',   owner: 'HR / Finance'},
]

const costOutTracker: { q: string; run: number | null; cum: number | null; planCum: number }[] = [
  { q: 'Q3-25', run:  0,   cum:  0.0, planCum:  0.0 },
  { q: 'Q4-25', run:  0.4, cum:  0.4, planCum:  0.8 },
  { q: 'Q1-26', run:  1.2, cum:  1.6, planCum:  1.8 },
  { q: 'Q2-26', run:  1.8, cum:  3.4, planCum:  3.2 },
  { q: 'Q3-26', run:  1.4, cum:  4.8, planCum:  4.6 },
  { q: 'Q4-26', run:  1.4, cum:  6.2, planCum:  6.0 },
  { q: 'Q1-27', run: null, cum: null, planCum:  8.4 },
  { q: 'Q2-27', run: null, cum: null, planCum: 11.2 },
  { q: 'Q3-27', run: null, cum: null, planCum: 13.2 },
  { q: 'Q4-27', run: null, cum: null, planCum: 15.0 },
]

const opexBreakdown = [
  { cat: 'Network & IT',       q2_25: 18.4, q2_26: 17.2 },
  { cat: 'S&M',                q2_25: 16.4, q2_26: 16.4 },
  { cat: 'Field & Logistics',  q2_25: 12.8, q2_26: 11.6 },
  { cat: 'G&A',                q2_25:  8.6, q2_26:  8.2 },
  { cat: 'Call Centre',        q2_25:  6.2, q2_26:  5.8 },
  { cat: 'Property',           q2_25:  4.4, q2_26:  3.8 },
]

// ─── tabs ────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'pnl' | 'cash' | 'capex' | 'bal' | 'fcst' | 'costout'
type Scenario = 'base' | 'bull' | 'bear'

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview',          icon: Activity    },
  { id: 'pnl',      label: 'P&L',              icon: TrendingUp  },
  { id: 'cash',     label: 'Cash & Liquidity',  icon: Wallet      },
  { id: 'capex',    label: 'CapEx',             icon: Briefcase   },
  { id: 'bal',      label: 'Balance Sheet',     icon: Landmark    },
  { id: 'fcst',     label: 'Forecast & Risk',   icon: Target      },
  { id: 'costout',  label: 'Cost-Out',          icon: Percent     },
]

const ragColor  = (r: string) => r === 'Green' || r === 'Pass'     ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const statusColor = (s: string) => s === 'on-track' ? 'bg-emerald-100 text-emerald-700' : s === 'at-risk' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const sevColor  = (s: string) => s === 'High'   ? 'bg-red-100 text-red-700'     : s === 'Medium' ? 'bg-amber-100 text-amber-700'   : 'bg-emerald-100 text-emerald-700'

// ─── component ───────────────────────────────────────────────────────────────
export default function CFOPage() {
  const [tab, setTab]             = useState<TabId>('overview')
  const [scenario, setScenario]   = useState<Scenario>('base')
  const [showCostDetail, setShowCostDetail] = useState(false)

  const totalDebt       = useMemo(() => debtLadder.reduce((s, d) => s + d.amt, 0), [])
  const scenarioMult    = useMemo(() => scenario === 'bull' ? 1.04 : scenario === 'bear' ? 0.96 : 1.0, [scenario])
  const scenarioKpis    = useMemo(() => ({
    ebitdaFY:   +(EBITDA_Q * 4 * scenarioMult).toFixed(0),
    revGrowth:  scenario === 'bull' ? '+7.2%' : scenario === 'bear' ? '+3.8%' : '+5.6%',
    fcf:        +(KPI.fcfTtmM * scenarioMult).toFixed(0),
    leverage:   scenario === 'bull' ? '2.3×' : scenario === 'bear' ? '2.8×' : `${KPI.netDebtEbitdaX}×`,
  }), [scenario, scenarioMult])
  const costOutYtd      = useMemo(() => +costOutInitiatives.reduce((s, c) => s + c.ytd, 0).toFixed(1), [])
  const riskHighCount   = useMemo(() => riskRegister.filter(r => r.sev === 'High').length, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [tab])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Financial Officer')}
        subtitle={tt('Office of the CFO · Camille Vermeulen · FY2026 Q2 · last board pack 17 Nov 2026')}
        actions={
          <Link to="/portal/finance" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <Wallet className="w-4 h-4" /> {tt('Open Finance Detail')}
          </Link>
        }
      />

      {/* alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Q2 revenue BSD 1.7M under plan · collections push initiated · EBITDA on track at 38.6% margin')}</div>
            <div className="text-xs text-amber-800 mt-1">
              {tt('Direct-debit failures +6% this month · bad-debt provision under review ·')}
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('DSO 42 days')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('leverage 2.6×')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('FCF BSD 84M TTM')}</span>
            </div>
          </div>
          <Link to="/portal/debt-collections" className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Collections →')}</Link>
        </div>
      </div>

      {/* tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit flex-wrap">
        {TABS.map((t) => {
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

      {/* ═══════ OVERVIEW ═══════ */}
      {tab === 'overview' && (<>
        <MlInsightSection
          heading="Finance intelligence"
          models={[
            { name: 'Cash-flow Forecaster',       metric: 'MAPE 2.1%',    sub: '13-week direct cash' },
            { name: 'Collections Risk Model',     metric: 'AUC 0.91',     sub: 'DSO + bad-debt early warning' },
            { name: 'Revenue-leakage Detector',   metric: 'BSD 3.4M found',  sub: 'usage vs billing reconciliation' },
          ]}
          agentLabel={tt('Run CFO Close Review')} agentRunningLabel={tt('Reconciling…')}
          agentSteps={[
            tt('Reconciled month-end actuals vs plan across all lanes'),
            tt('Forecast 13-week cash and covenant headroom'),
            tt('Scored receivables for collections risk'),
            tt('Flagged revenue leakage vs the rating book'),
          ]}
          agentBlurb={tt('One governed P&L means the board, the auditor and the regulator all read the same number — close moves from weeks to a same-day, explainable view.')}
          decision={{
            title: tt('Accelerate BSD 4.1M of collections before quarter-end'),
            detail: tt('The collections-risk model ranks 1,840 accounts whose direct-debit failure probability jumped this week. Prioritising the top decile recovers ~BSD 4.1M of receivables and protects the DSO target before the quarter closes.'),
            impact: tt('protects FCF · DSO −2.4 days'),
            risk:   tt('requires Collections team capacity — route the top decile only'),
            linkTo: '#/portal/debt-collections', linkLabel: tt('Open Bad Debt & Collections'),
          }}
          chart={{
            kind: 'line', title: tt('Revenue — actual vs plan (BSD M / quarter)'), xKey: 'q', unit: 'M',
            data: revTrend,
            series: [
              { key: 'actual', name: tt('Actual'), color: BLUE },
              { key: 'plan',   name: tt('Plan'),   color: NAVY, dashed: true },
            ],
            note: tt('Revenue tracking just under plan — the collections push closes the gap.'),
          }}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <KpiCard label={tt('Revenue (Q2)')}         value={`BSD ${KPI.revenueQtrM}M`}  delta="+5.7% YoY"              trend="up"   icon={TrendingUp} accent />
          <KpiCard label={tt('EBITDA (Q2)')}           value={`BSD ${EBITDA_Q}M`}         delta={`${KPI.ebitdaMarginPct}% margin`} trend="up" icon={Coins} />
          <KpiCard label={tt('EBITDA margin')}         value={`${KPI.ebitdaMarginPct}%`} delta="+1.0 pp YoY"           trend="up"   icon={Percent} />
          <KpiCard label={tt('FCF (TTM)')}             value={`BSD ${KPI.fcfTtmM}M`}      delta="+11% YoY"               trend="up"   icon={Banknote} />
          <KpiCard label={tt('Net Debt / EBITDA')}     value={`${KPI.netDebtEbitdaX}×`} delta="covenant ≤ 4.0×"      trend="up"   icon={Landmark} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Credit rating')}         value={KPI.creditRating}         delta="affirmed Sep 2026"      trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('CapEx intensity')}        value="20.4%"                   delta="vs 22% ceiling"         trend="up"   icon={Briefcase} />
          <KpiCard label={tt('DSO')}                   value="42 days"                  delta="target ≤ 40"            trend="down" icon={Calendar} />
          <KpiCard label={tt('Cost-out YTD')}          value={`BSD ${costOutYtd}M`}        delta="of BSD 15M target"         trend="up"   icon={Award} />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CFO domain')}
            links={[
              { to: 'finance',          label: tt('Finance'),                metric: tt('P&L · EBITDA bridge · plan vs actual'),    icon: Wallet    },
              { to: 'capital-treasury', label: tt('Capital & Treasury'),     metric: tt('Liquidity · debt maturity · FX hedges'),   icon: Landmark  },
              { to: 'revenue-assurance',label: tt('Revenue Assurance'),      metric: tt('BSD 3.4M leakage recovered YTD'),             icon: ShieldCheck},
              { to: 'debt-collections', label: tt('Bad Debt & Collections'), metric: tt('DSO 42 days · provision 2.1%'),            icon: Wallet    },
              { to: 'billing-charging', label: tt('Billing & Charging'),     metric: tt('Convergent billing · 1.06M invoices/mo'),  icon: Receipt   },
              { to: 'ma-simulator',     label: tt('M&A Simulator'),          metric: tt('Accretion / dilution scenarios'),          icon: Briefcase },
              { to: 'procurement',      label: tt('Procurement'),            metric: tt('BSD 212M addressable spend'),                 icon: ShoppingCart},
              { to: 'supply-chain',     label: tt('Supply Chain & Logistics'),metric: tt('CPE stock · lead times'),                 icon: Package   },
              { to: 'cost',             label: tt('Cost Intelligence'),      metric: tt('Snowflake credits · per-team chargeback'), icon: Percent   },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('CFO priorities — FY2026')}
              items={[
                { name: tt('Cost-out BSD 15M run-rate'),                         owner: tt('Finance Transformation · M. Vermeulen'), pct: 41,  status: 'at-risk'  },
                { name: tt('Power BI → Snowflake migration (licence exit)'),  owner: tt('Data Platform · Pieter Knowles'),           pct: 72,  status: 'on-track' },
                { name: tt('Revenue assurance — close billing gaps'),         owner: tt('Revenue Assurance'),                    pct: 81,  status: 'on-track' },
                { name: tt('Refinance 2027 bond maturity'),                   owner: tt('Treasury'),                             pct: 38,  status: 'on-track' },
                { name: tt('B2B billing tenancy (Cerillion)'),                owner: tt('Billing'),                              pct: 44,  status: 'behind'   },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CFO desk')}
            items={[
              { text: tt('Q2 revenue BSD 1.7M under plan — collections push covers it'),       level: 'high'   },
              { text: tt('Direct-debit failures +6% — bad-debt provision under review'),     level: 'high'   },
              { text: tt('CBOB discount rate hold at 4.00% — refinancing assumptions stable'),         level: 'low'    },
              { text: tt('CapEx phasing: BSD 18M of fibre build slipping Q2 → Q3'),            level: 'medium' },
            ]}
          />
        </div>

        <div className="mt-6">
          <AgendaList
            title={tt('CFO cadence')}
            items={[
              { what: tt('Month-end close sign-off'),      when: tt('Fri 28 Jun') },
              { what: tt('Audit Committee'),               when: tt('Tue 9 Jul')  },
              { what: tt('H1 results — analyst call'),     when: tt('Wed 24 Jul') },
              { what: tt('FY27 budget kick-off'),          when: tt('Mon 2 Sep')  },
            ]}
          />
        </div>
      </>)}

      {/* ═══════ P&L ═══════ */}
      {tab === 'pnl' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Revenue (Q4-26)')}   value={`BSD ${KPI.revenueQtrM}M`} delta="+5.7% YoY · −1.2% vs plan" trend="down" icon={TrendingUp} accent />
          <KpiCard label={tt('EBITDA margin')}     value={`${KPI.ebitdaMarginPct}%`} delta="+1.0 pp YoY"             trend="up"   icon={Percent}    />
          <KpiCard label={tt('Gross margin')}      value="58.2%"                   delta="+0.4 pp YoY"               trend="up"   icon={Coins}      />
          <KpiCard label={tt('Net income (Q2)')}   value="BSD 12.1M"                  delta="+33% YoY"                  trend="up"   icon={DollarSign} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EBITDA (Q2)')}       value={`BSD ${EBITDA_Q}M`}         delta="−BSD 0.4M vs plan"            trend="down" icon={Activity}    />
          <KpiCard label={tt('OpEx run-rate')}     value="BSD 26.8M / qtr"            delta="−BSD 1.0M vs plan"            trend="up"   icon={ArrowUpRight}/>
          <KpiCard label={tt('EBIT')}              value="BSD 22.2M"                  delta="+15.6% YoY"                trend="up"   icon={Target}      />
          <KpiCard label={tt('Bad debt %')}         value="1.2%"                   delta="vs 1.5% policy limit"      trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Revenue trend · Actual vs Plan (BSD M / quarter)')} insight={{ insight: 'Revenue reached BSD 143M in Q4-26, tracking 2% above the annual plan line for the third consecutive quarter.', action: 'Lock in the Q3 plan uplift to reflect sustained over-performance and release the contingency reserve.', impact: 'Reforecast could unlock BSD 4–6M of discretionary opex headroom without breaching leverage covenants.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={revTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" domain={[115, 145]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="actual" name={tt('Actual')} stroke={BLUE}       fill={BLUE}       fillOpacity={0.25} strokeWidth={2.5} />
                    <Area type="monotone" dataKey="plan"   name={tt('Plan')}   stroke={NAVY}       fill={NAVY}       fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('Q4-26 BSD 136.8M · under plan by BSD 1.7M · +5.7% YoY. Collections push and H2 price action expected to close the full-year gap.')}</div>
            </Panel>
          </div>
          <Panel title={tt('EBITDA Walk · Q4-25 → Q4-26 (BSD M)')} insight={{ insight: 'EBITDA grew BSD 8.2M year-on-year, with cost-out savings contributing BSD 3.8M and revenue mix improvement adding BSD 5.1M, partly offset by higher energy costs.', action: 'Accelerate the two at-risk cost-out initiatives to protect the full-year BSD 15M savings target.', impact: 'Closing the BSD 1.2M gap on delayed initiatives would lift EBITDA margin by approximately 20 basis points.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ebitdaWalk} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="k" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v" name={tt('BSD M')}>
                    {ebitdaWalk.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Income Statement · Q4 2026 vs Plan vs PY (BSD M)')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Line')}</th>
                  <th className="text-right">{tt('Actual')}</th>
                  <th className="text-right">{tt('Plan')}</th>
                  <th className="text-right">{tt('Var BSD ')}</th>
                  <th className="text-right">{tt('Var %')}</th>
                  <th className="text-right">{tt('PY')}</th>
                  <th className="text-right">{tt('YoY %')}</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyPnl.map((p) => {
                  const varAbs = +(p.actual - p.plan).toFixed(1)
                  const varPct = +((varAbs / Math.abs(p.plan)) * 100).toFixed(1)
                  const yoyPct = +(((p.actual - p.py) / Math.abs(p.py)) * 100).toFixed(1)
                  const isHead = ['Revenue','Gross profit','EBITDA','EBIT','Net income'].includes(p.line)
                  const fav = (p.actual >= p.plan) === (p.actual >= 0)
                  return (
                    <tr key={p.line} className={`border-t border-black/5 ${isHead ? 'bg-vfes-red/5' : ''}`}>
                      <td className={`py-2.5 ${isHead ? 'font-extrabold' : 'pl-3 text-vfes-dark/75'}`}>{p.line}</td>
                      <td className={`text-right ${isHead ? 'font-extrabold' : ''}`}>{p.actual.toFixed(1)}</td>
                      <td className="text-right text-vfes-dark/60">{p.plan.toFixed(1)}</td>
                      <td className={`text-right font-bold ${fav ? 'text-emerald-600' : 'text-red-600'}`}>{varAbs > 0 ? '+' : ''}{varAbs}</td>
                      <td className={`text-right text-xs ${fav ? 'text-emerald-600' : 'text-red-600'}`}>{varPct > 0 ? '+' : ''}{varPct}%</td>
                      <td className="text-right text-xs text-vfes-dark/60">{p.py.toFixed(1)}</td>
                      <td className={`text-right text-xs font-semibold ${(p.actual - p.py >= 0) === (p.actual >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>{yoyPct > 0 ? '+' : ''}{yoyPct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-vfes-dark/50">
            <Sparkles className="w-3 h-3 text-vfes-dark" />
            <span>{tt('Auto-variance commentary drafted by Cortex AI · reviewed by FP&A before board pack ·')}</span>
            <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Open Finance detail →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('ARPU & Subscriber Mix · By Tier')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Tier')}</th>
                    <th className="text-right">{tt('ARPU')}</th>
                    <th className="text-right">{tt('Base share')}</th>
                    <th className="text-right">{tt('Churn')}</th>
                    <th className="text-right">{tt('EBITDA margin')}</th>
                    <th>{tt('Relative ARPU')}</th>
                  </tr>
                </thead>
                <tbody>
                  {arpuByTier.map((a) => (
                    <tr key={a.tier} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{a.tier}</td>
                      <td className="text-right font-bold">BSD {a.arpu}</td>
                      <td className="text-right">{a.share}%</td>
                      <td className={`text-right ${a.churn > 3 ? 'text-red-600' : a.churn > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{a.churn}%</td>
                      <td className="text-right">{a.margin}%</td>
                      <td>
                        <div className="w-32 h-1.5 bg-black/5 rounded">
                          <div className="h-full bg-vfes-red rounded" style={{ width: `${(a.arpu / 124) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CASH & LIQUIDITY ═══════ */}
      {tab === 'cash' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FCF (TTM)')}      value={`BSD ${KPI.fcfTtmM}M`} delta="+11% YoY"            trend="up"   icon={DollarSign} accent />
          <KpiCard label={tt('Cash balance')}   value="BSD 84M"                delta="+BSD 62M RCF available" trend="up"   icon={Wallet}     />
          <KpiCard label={tt('DSO')}            value="42 days"             delta="target ≤ 40"          trend="down" icon={Calendar}   />
          <KpiCard label={tt('CCC')}            value="−19 days"            delta="healthy · negative"   trend="up"   icon={ArrowUpRight}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('OCF · CapEx · FCF · Quarterly (BSD M)')} insight={{ insight: 'FCF turned positive in Q2-26 and has held above BSD 18M per quarter, while CapEx intensity remains below the 22% ceiling at 20.4%.', action: 'Maintain the current CapEx discipline and redirect the BSD 6M intensity buffer toward accelerated debt amortisation.', impact: 'Additional BSD 6M debt repayment reduces interest expense by roughly BSD 0.3M annually and tightens leverage by 0.05×.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={cashflowQtly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ocf"   name={tt('OCF')}   fill={GREEN} />
                    <Bar dataKey="capex" name={tt('CapEx')} fill={BLUE}  />
                    <Line type="monotone" dataKey="fcf" name={tt('FCF')} stroke={DARK} strokeWidth={2.5} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('FCF TTM BSD 84M (Q1-26+Q2-26+Q3-26+Q4-26). Strong OCF growth absorbing rising CapEx. 2027 bond re-fi on track.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Working Capital · Days')}>
            <div className="space-y-4 mt-4">
              {[
                { label: tt('DSO · Receivables'), days: 42, max: 80, color: 'bg-amber-500'   },
                { label: tt('DPO · Payables'),    days: 61, max: 80, color: 'bg-emerald-500' },
                { label: tt('DIO · Inventory'),   days: 18, max: 80, color: 'bg-blue-400'    },
              ].map((w) => (
                <div key={w.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{w.label}</span>
                    <span className="font-bold">{w.days} d</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded">
                    <div className={`h-full ${w.color} rounded`} style={{ width: `${(w.days / w.max) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-black/5">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{tt('Cash conversion cycle')}</span>
                  <span className="font-extrabold text-emerald-600">−19 d</span>
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('Customers pay before suppliers — structurally positive cash generation.')}</div>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('13-Week Rolling Cash Forecast (BSD M)')} insight={{ insight: 'The 13-week cash position stays above the BSD 60M operating floor throughout the forecast window, with a projected low of BSD 71M in week 9.', action: 'Initiate the BSD 30M RCF drawdown no later than week 6 to maintain a comfortable buffer ahead of the week-9 trough.', impact: 'Pre-emptive drawdown eliminates refinancing risk and avoids costly short-notice borrowing at a premium to the facility rate.' }}>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={cash13wk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar   yAxisId="l" dataKey="inflow"  name={tt('Inflow BSD M')}        fill={GREEN} />
                <Bar   yAxisId="l" dataKey="outflow" name={tt('Outflow BSD M')}       fill={BLUE}  />
                <Line  yAxisId="r" type="monotone" dataKey="balance" name={tt('Cash balance BSD M')} stroke={DARK} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('Forecast built by Cortex Cash-flow Model (MAPE 2.1%). Minimum balance BSD 82M in W6 — well above the BSD 50M covenant floor.')}</div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mb-6 mt-6">
          <Panel title={tt('AR Aging · BSD 57.8M total receivables')} insight={{ insight: 'Receivables overdue beyond 60 days represent BSD 14.2M (25% of the total), up from BSD 11M in the prior quarter.', action: 'Escalate the top five B2B accounts in dunning to executive sponsorship and instruct legal to issue formal demand letters within five business days.', impact: 'Recovery of 70% of the 60+ day balance would reduce DSO by approximately 3 days and release BSD 10M of working capital.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={arAgingData} dataKey="amt" nameKey="bucket" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {arAgingData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('73.7% current is healthy. 90+ days (BSD 1.2M) targeted by collections model top-decile run.')}</div>
          </Panel>

          <Panel title={tt('Top Overdue B2B AR (BSD K)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Account')}</th>
                    <th className="text-right">{tt('BSD K')}</th>
                    <th className="text-right">{tt('DSO')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topOverdueAR.map((a) => (
                    <tr key={a.acc} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{a.acc}</td>
                      <td className="text-right font-bold">BSD {a.amt.toLocaleString()}</td>
                      <td className={`text-right ${a.dso > 60 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>{a.dso} d</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${a.status === 'Disputed' ? 'bg-red-100 text-red-700' : a.status === 'In dunning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(a.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Open full collections queue →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CAPEX ═══════ */}
      {tab === 'capex' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CapEx YTD')}           value="BSD 118M"    delta="68% of BSD 174M plan"        trend="flat" icon={Briefcase} accent />
          <KpiCard label={tt('CapEx intensity')}      value="20.4%"    delta="ceiling 22% · well inside" trend="up"   icon={Percent}  />
          <KpiCard label={tt('Active programmes')}    value={`${capexProgrammes.length}`} delta="3 Green · 3 Amber" trend="up" icon={GitBranch}/>
          <KpiCard label={tt('Avg programme IRR')}    value="17.7%"    delta="WACC 8.4% · +9.3 pp"      trend="up"   icon={TrendingUp}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('CapEx YTD by Category (BSD M)')} insight={{ insight: 'Network modernisation accounts for BSD 62M of the BSD 118M YTD spend, tracking ahead of plan by 8%, while IT transformation is 12% behind at BSD 21M.', action: 'Convene a programme steering review to reallocate BSD 5M of the network over-run into IT transformation to rebalance delivery risk.', impact: 'Rebalancing prevents a year-end IT write-off risk estimated at BSD 8M NPV and keeps total CapEx intensity within the 22% ceiling.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={capexByCat} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                    <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={155} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="v" name={tt('BSD M')}>
                      {capexByCat.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('FTTH (37%) and DOCSIS (20%) dominate — consistent with the growth-capex thesis. Open RAN trial spend BSD 8M on plan.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Build vs Maintenance split')} insight={{ insight: 'Build CapEx represents 68% of total spend, above the 60% strategic target, driven by accelerated 5G rollout in Q3-26.', action: 'Review maintenance deferral backlog before the Q3 budget lock to avoid concentration of catch-up spend in H2.', impact: 'Deferring maintenance above the 40% floor introduces an estimated BSD 3–5M incremental network reliability risk in the following fiscal year.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={buildVsMaintain} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {buildVsMaintain.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-vfes-dark/55 uppercase tracking-widest mt-2">{tt('Build-heavy · growth phase')}</div>
            <div className="mt-3 text-[11px] text-vfes-dark/55">{tt('68% growth capex aligns with the fibre and 5G investment thesis. Maintenance intensity expected to normalise to 40% post-build.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Programme Portfolio · NPV / IRR / Payback')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Programme')}</th>
                  <th className="text-right">{tt('Budget')}</th>
                  <th className="text-right">{tt('Spent YTD')}</th>
                  <th className="text-right">{tt('NPV')}</th>
                  <th className="text-right">{tt('IRR')}</th>
                  <th>{tt('Payback')}</th>
                  <th>{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {capexProgrammes.map((p) => (
                  <tr key={p.p} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{p.p}</td>
                    <td className="text-right font-bold">BSD {p.budget}M</td>
                    <td className="text-right text-vfes-dark/70">BSD {p.spent}M</td>
                    <td className="text-right text-emerald-600 font-bold">BSD {p.npv}M</td>
                    <td className={`text-right font-bold ${p.irr >= 18 ? 'text-emerald-600' : p.irr >= 12 ? 'text-amber-600' : 'text-red-600'}`}>{p.irr}%</td>
                    <td className="text-xs">{p.payback}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(p.rag)}`}>{tt(p.rag)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <span>{tt('Approved-not-spent: BSD 42M · slippage tracker open ·')}</span>
            <Link to="/portal/capacity-capex" className="font-semibold text-vfes-dark hover:underline">{tt('Open Capacity & CapEx detail →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ BALANCE SHEET ═══════ */}
      {tab === 'bal' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net debt')}             value="BSD 320M"                delta={`${KPI.netDebtEbitdaX}× leverage`}  trend="flat" icon={Wallet}    accent />
          <KpiCard label={tt('Liquidity')}             value="BSD 146M"               delta="BSD 84M cash + BSD 62M RCF"               trend="up"   icon={ShieldCheck}/>
          <KpiCard label={tt('Avg cost of debt')}     value="4.8%"                 delta="−30 bps vs prior refi"              trend="up"   icon={ArrowUpRight}/>
          <KpiCard label={tt('Covenants passing')}    value={`${covenants.length} / ${covenants.length}`} delta="all in green" trend="up"  icon={Award}     />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Debt Maturity Ladder (BSD M)')} insight={{ insight: 'A BSD 120M term loan matures in 2027, representing 38% of gross debt, creating a material refinancing cliff two years out.', action: 'Engage the relationship banks in Q1-27 to pre-place a 5-year replacement facility before credit spreads widen into the election cycle.', impact: 'Early refinancing at the current 4.8% average cost locks in approximately BSD 3M annual interest saving versus a stressed 2027 market rate.' }}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={debtLadder}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="y" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                    <Bar dataKey="amt" name={tt('Debt BSD M')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('Total debt')} <span className="font-bold text-vfes-dark">BSD {totalDebt}M</span> · {tt('weighted avg maturity 4.2 yr · 2027 Notes (BSD 84M) — re-fi mandate active')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('Covenant Headroom')}>
            <div className="space-y-2.5 mt-1">
              {covenants.map((c) => (
                <div key={c.c} className="border-b border-black/5 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-xs">{c.c}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(c.status)}`}>{tt(c.status)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-vfes-dark/60">
                    <span>{tt('target')} {c.target}</span>
                    <span>·</span>
                    <span>{tt('actual')} <span className="font-bold text-vfes-dark">{c.actual}</span></span>
                    <span className="ml-auto">{tt('hroom')} <span className="font-bold text-emerald-600">{c.headroom}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('FX & Interest-rate Hedges · MtM (BSD M)')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Instrument')}</th>
                  <th className="text-right">{tt('Notional')}</th>
                  <th>{tt('Expiry')}</th>
                  <th className="text-right">{tt('MtM')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {fxHedges.map((h) => (
                  <tr key={h.instr} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{h.instr}</td>
                    <td className="text-right font-bold">BSD {h.notional}M</td>
                    <td className="text-xs">{h.expiry}</td>
                    <td className={`text-right font-bold ${h.mtm >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{h.mtm > 0 ? '+' : ''}BSD {h.mtm}M</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(h.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Open Capital & Treasury detail →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ FORECAST & RISK ═══════ */}
      {tab === 'fcst' && (<>
        {/* scenario toggle */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-black/5">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest mr-2">{tt('Scenario')}</span>
          {(['base', 'bull', 'bear'] as Scenario[]).map((s) => (
            <button key={s} onClick={() => setScenario(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${scenario === s ? (s === 'bull' ? 'bg-emerald-500 text-vfes-dark' : s === 'bear' ? 'bg-red-500 text-vfes-dark' : 'bg-vfes-red text-vfes-dark') : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
              {s === 'base' ? tt('Base') : s === 'bull' ? tt('Upside') : tt('Downside')}
            </button>
          ))}
          <span className="text-xs text-vfes-dark/55 ml-2">
            {scenario === 'bull' ? tt('ARPU +5%, churn steady, net adds +10%') : scenario === 'bear' ? tt('ARPU −3%, churn +50 bp, macro headwinds') : tt('Current trend · plan-aligned growth')}
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EBITDA FY (scenario)')} value={`BSD ${scenarioKpis.ebitdaFY}M`}  delta={scenarioKpis.revGrowth + ' rev growth'} trend={scenario === 'bear' ? 'down' : 'up'} icon={Target}        accent />
          <KpiCard label={tt('FCF FY (scenario)')}    value={`BSD ${scenarioKpis.fcf}M`}       delta="TTM basis"                              trend={scenario === 'bear' ? 'down' : 'up'} icon={DollarSign}    />
          <KpiCard label={tt('Leverage (scenario)')}  value={scenarioKpis.leverage}          delta="Net Debt / EBITDA"                      trend={scenario === 'bear' ? 'down' : 'up'} icon={Landmark}      />
          <KpiCard label={tt('Risk register')}         value={`${riskRegister.length} items`} delta={`${riskHighCount} high-severity`}       trend="down"                                icon={AlertTriangle}  />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('EBITDA Scenarios · 8 Quarter Outlook (BSD M)')} insight={{ insight: 'The bear scenario shows EBITDA falling to BSD 38M by Q2-28, breaching the 2.5× interest coverage covenant threshold in that quarter.', action: 'Stress-test the liquidity reserve against the bear path and prepare a covenant waiver request template for lender use if macro conditions deteriorate.', impact: 'Proactive lender engagement avoids a technical default event that would trigger 150 bps margin step-up on all floating debt.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={ebitdaScenarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="bull" name={tt('Upside')}   stroke={GREEN} fill={GREEN} fillOpacity={scenario === 'bull' ? 0.25 : 0.06} strokeWidth={scenario === 'bull' ? 2.5 : 1} />
                    <Area type="monotone" dataKey="base" name={tt('Base')}    stroke={BLUE}  fill={BLUE}  fillOpacity={scenario === 'base' ? 0.25 : 0.06} strokeWidth={scenario === 'base' ? 2.5 : 1} />
                    <Area type="monotone" dataKey="bear" name={tt('Downside')} stroke={GREY}  fill={GREY}  fillOpacity={scenario === 'bear' ? 0.25 : 0.06} strokeWidth={scenario === 'bear' ? 2.5 : 1} />
                    <Line type="monotone" dataKey="plan" name={tt('Plan')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('EBITDA Sensitivity · Annual (BSD M)')} insight={{ insight: 'A 1% ARPU decline has the largest single-variable impact at −BSD 5.8M EBITDA, exceeding churn sensitivity (−BSD 4.1M) and energy cost sensitivity (−BSD 2.3M).', action: 'Prioritise ARPU defence measures — contract renewals and upsell campaigns — over pure volume growth in the Q3 commercial plan.', impact: 'Protecting ARPU by 0.5% is equivalent in EBITDA terms to winning approximately 40,000 net new subscribers at current margins.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sensitivities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="driver" tick={{ fontSize: 9 }} width={115} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine x={0} stroke={DARK} />
                  <Bar dataKey="upside"   name={tt('Upside')}   fill={GREEN} />
                  <Bar dataKey="downside" name={tt('Downside')} fill={BLUE}  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Financial Risk Register')}>
          <div className="space-y-2">
            {riskRegister.map((r, i) => (
              <div key={i} className="border border-black/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(r.sev)}`}>{tt(r.sev)}</span>
                  <span className="text-[10px] text-vfes-dark/55">{tt('prob')} {tt(r.prob)}</span>
                  <span className="text-[10px] font-bold text-vfes-dark ml-auto">{r.impact}</span>
                </div>
                <div className="font-semibold text-xs">{r.r}</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('Mitigation')}: {r.mit}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/risk" className="font-semibold text-vfes-dark hover:underline">{tt('Open Risk Registry →')}</Link>
            <span>·</span>
            <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ COST-OUT ═══════ */}
      {tab === 'costout' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Savings YTD')}          value={`BSD ${costOutYtd}M`}   delta="of BSD 15M FY target"          trend="down" icon={Percent}    accent />
          <KpiCard label={tt('Run-rate achieved')}    value="BSD 3.8M / qtr"         delta="vs BSD 3.75M target rate"      trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Initiatives on-track')} value="4 / 7"               delta="2 behind · 1 at-risk"       trend="down" icon={GitBranch}  />
          <KpiCard label={tt('Opex saving Q2 YoY')}  value="BSD 3.8M"               delta="vs Q4-25 · all lines down"  trend="up"   icon={ArrowUpRight}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cost-Out Savings Tracker · Actual vs Plan (BSD M cumulative)')} insight={{ insight: 'Cumulative savings reached BSD 7.1M against a BSD 8.4M H1 plan, leaving a BSD 1.3M gap that is widening quarter-on-quarter.', action: 'Require programme owners to submit recovery plans by 15 July and freeze discretionary project spend until the gap is closed to within BSD 0.5M.', impact: 'Closing the gap fully by Q3 preserves the BSD 15M full-year target and avoids a BSD 1.3M drag on reported EBITDA at year-end.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={costOutTracker}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  dataKey="run"     name={tt('Quarterly saving BSD M')} fill={BLUE}  />
                    <Line type="monotone" dataKey="cum"     name={tt('Actual cumulative')} stroke={GREEN} strokeWidth={2.5} dot />
                    <Line type="monotone" dataKey="planCum" name={tt('Plan cumulative')}   stroke={GREY}  strokeWidth={2}   strokeDasharray="4 4" dot={false} />
                    <ReferenceLine y={15} stroke={DARK} strokeDasharray="6 3" label={{ value: 'BSD 15M target', position: 'right', fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('BSD 6.2M secured by Q4-26. Property rationalisation and shared-service centre are the main at-risk items. Procurement savings ahead of plan offset delays.')}</div>
            </Panel>
          </div>

          <Panel title={tt('OpEx Q4-25 vs Q4-26 (BSD M)')} insight={{ insight: 'Total OpEx fell BSD 3.8M year-on-year to BSD 96.2M, led by a BSD 2.1M reduction in network operations costs and BSD 1.4M lower customer acquisition spend.', action: 'Hold network operations savings in the baseline and redeploy the customer acquisition saving into digital channel investment to sustain acquisition efficiency.', impact: 'Sustaining the BSD 2.1M network operations run-rate saving improves full-year EBITDA margin by approximately 35 basis points.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={opexBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={115} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q2_25" name={tt('Q4-25')} fill={GREY}  />
                  <Bar dataKey="q2_26" name={tt('Q4-26')} fill={BLUE}  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Cost-Out Initiatives · Progress')}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-vfes-dark/55">{tt('FY2026 target: BSD 15.0M run-rate annual savings')}</div>
            <button onClick={() => setShowCostDetail(!showCostDetail)}
              className="text-xs font-bold text-vfes-dark hover:underline">
              {showCostDetail ? tt('Hide detail') : tt('Show owner breakdown')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Initiative')}</th>
                  <th className="text-right">{tt('Target BSD M')}</th>
                  <th className="text-right">{tt('YTD BSD M')}</th>
                  <th className="text-right">{tt('Delivery %')}</th>
                  {showCostDetail && <th>{tt('Owner')}</th>}
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {costOutInitiatives.map((c) => (
                  <tr key={c.initiative} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs max-w-xs truncate">{c.initiative}</td>
                    <td className="text-right font-bold">BSD {c.target.toFixed(1)}</td>
                    <td className="text-right">BSD {c.ytd.toFixed(1)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-black/5 rounded">
                          <div className={`h-full rounded ${c.status === 'on-track' ? 'bg-emerald-500' : c.status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${(c.ytd / c.target) * 100}%` }} />
                        </div>
                        <span className="text-xs">{c.target > 0 ? Math.round((c.ytd / c.target) * 100) : 0}%</span>
                      </div>
                    </td>
                    {showCostDetail && <td className="text-xs text-vfes-dark/65">{c.owner}</td>}
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(c.status)}`}>{tt(c.status)}</span></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-vfes-dark/20 font-bold">
                  <td className="py-2">{tt('Total')}</td>
                  <td className="text-right">BSD 15.0</td>
                  <td className="text-right text-emerald-600">BSD {costOutYtd.toFixed(1)}</td>
                  <td className="text-right">{Math.round((costOutYtd / 15) * 100)}%</td>
                  {showCostDetail && <td></td>}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Open Procurement →')}</Link>
            <span>·</span>
            <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Open Cost Intelligence →')}</Link>
          </div>
        </Panel>
      </>)}
    </div>
  )
}
