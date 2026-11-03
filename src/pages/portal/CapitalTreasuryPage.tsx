import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import KPI from './_kpi_facts'
import {
  Landmark, TrendingUp, Scale, PiggyBank, Percent, Globe, Shield,
  AlertTriangle, Activity, RefreshCw, Zap, CreditCard,
  DollarSign, Bell, Lock, Target, BarChart2,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── Existing data (preserved) ───────────────────────────────────────────────
const DEBT_LADDER = [
  { year: '2026', amt:  8, coupon: 5.25, type: 'bond' },
  { year: '2027', amt: 14, coupon: 5.75, type: 'loan' },
  { year: '2028', amt: 22, coupon: 5.9,  type: 'bond' },
  { year: '2029', amt: 30, coupon: 6.0,  type: 'loan' },
  { year: '2030', amt: 70, coupon: 6.25, type: 'bond' },
  { year: '2031+', amt: 42, coupon: 6.5, type: 'bond' },
]

const LEVERAGE_TREND = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26'][i],
  leverage: +(3.47 - i * 0.06).toFixed(2),
  covenant: 3.5,
}))

const CAPITAL_USES = [
  { name: 'Network capex',   value: 42, color: NAVY   },
  { name: 'Dividend',        value: 24, color: BLUE   },
  { name: 'Debt reduction',  value: 18, color: GREEN  },
  { name: 'Spectrum / M&A',  value: 11, color: AMBER  },
  { name: 'Buyback',         value:  5, color: SLATE  },
]

const WACC_DATA = [
  { comp: 'Cost of equity',       val: 12.5 },
  { comp: 'Cost of debt (net)',    val: 6.1 },
  { comp: 'WACC (blended)',        val: 9.6 },
]

// ─── Cash pool ────────────────────────────────────────────────────────────────
const CASH_POOL = [
  { entity: 'Cable Bahamas (demo treasury)',      currency: 'BSD', balance: 14, pool: 'header',   type: 'Header account' },
  { entity: 'Group holding (demo entity)',    currency: 'BSD', balance:  3, pool: 'notional', type: 'Notional'        },
  { entity: 'Fixed services (demo entity)',                  currency: 'BSD', balance:  2, pool: 'notional', type: 'Notional'        },
  { entity: 'Business services (demo entity)',         currency: 'BSD', balance:  2, pool: 'notional', type: 'Notional'        },
  { entity: 'aliv mobile (demo entity)',             currency: 'USD', balance:  1, pool: 'physical', type: 'Physical'        },
  { entity: 'Fibre programme (demo entity)',                     currency: 'USD', balance:  1, pool: 'physical', type: 'Physical'        },
  { entity: 'Island media (demo entity)',                currency: 'BSD', balance:  1, pool: 'physical', type: 'Physical'        },
]

const CASH_FORECAST = [
  { m: 'Jan', actual: 22.5 as number | null, forecast: 22.8 },
  { m: 'Feb', actual: 21.8 as number | null, forecast: 22.0 },
  { m: 'Mar', actual: 23.4 as number | null, forecast: 23.2 },
  { m: 'Apr', actual: 22.9 as number | null, forecast: 23.3 },
  { m: 'May', actual: 23.6 as number | null, forecast: 23.9 },
  { m: 'Jun', actual: 24.0 as number | null, forecast: 24.0 },
  { m: 'Jul', actual: null,                  forecast: 24.6 },
  { m: 'Aug', actual: null,                  forecast: 25.8 },
  { m: 'Sep', actual: null,                  forecast: 25.1 },
]

const LIQUIDITY_WATERFALL = [
  { item: 'Opening cash',       value:    24, type: 'pos' },
  { item: 'Operating FCF TTM',  value:    12, type: 'pos' },
  { item: 'URCA licence fee Q3', value:    -3, type: 'neg' },
  { item: 'Dividend payment',   value:    -6, type: 'neg' },
  { item: '2026 bond maturity', value:    -8, type: 'neg' },
  { item: 'Available RCF',      value:    35, type: 'rcf' },
  { item: 'Planned bond Q3-26', value:    50, type: 'pos' },
]

// ─── FX hedging book ──────────────────────────────────────────────────────────
const FX_BOOK = [
  { pair: 'BSD/USD', notional: 18.0, hedgedRate: 1.000,  marketRate: 1.000,  mtm:  0.00, maturity: 'Peg',   type: 'Fixed peg' },
  { pair: 'USD/GBP', notional:  1.2, hedgedRate: 0.791,  marketRate: 0.797,  mtm:  0.02, maturity: 'Q3-26', type: 'Forward' },
  { pair: 'USD/CAD', notional:  0.8, hedgedRate: 1.362,  marketRate: 1.371,  mtm:  0.01, maturity: 'Q4-26', type: 'Forward' },
]

const FX_PNL_TREND = [
  { m: 'Jan', hedged: 0.04, unhedged: -0.12 },
  { m: 'Feb', hedged: 0.03, unhedged: -0.08 },
  { m: 'Mar', hedged: 0.05, unhedged:  0.14 },
  { m: 'Apr', hedged: 0.07, unhedged: -0.06 },
  { m: 'May', hedged: 0.06, unhedged:  0.18 },
  { m: 'Jun', hedged: 0.08, unhedged: -0.14 },
]

const IR_SENSITIVITY = [
  { shock: '−200bps', delta: -0.4 },
  { shock: '−100bps', delta: -0.2 },
  { shock: 'Base',    delta:    0 },
  { shock: '+100bps', delta:  0.2 },
  { shock: '+200bps', delta:  0.4 },
  { shock: '+300bps', delta:  0.6 },
]

// ─── Covenants ────────────────────────────────────────────────────────────────
const COVENANTS = [
  { covenant: 'Net debt / EBITDA',          limit: '≤ 3.5×', actual: '3.17×', headroom: '0.33×', status: 'Pass' },
  { covenant: 'Interest cover (EBITDA/int)', limit: '≥ 3.0×', actual: '4.6×',  headroom: '1.6×',  status: 'Pass' },
  { covenant: 'Fixed charge cover',          limit: '≥ 1.5×', actual: '2.4×',  headroom: '0.9×',  status: 'Pass' },
  { covenant: 'Equity ratio',                limit: '≥ 25%',  actual: '38%',   headroom: '13pp',  status: 'Pass' },
  { covenant: 'Liquidity coverage (12m)',     limit: '≥ 1.5×', actual: '7.4×',  headroom: '5.9×',  status: 'Pass' },
  { covenant: 'Capex / revenue',             limit: '≤ 25%',  actual: '17%',   headroom: '8pp',   status: 'Pass' },
]

const COVENANT_TREND = [
  { q: 'Q1-25', leverage: 3.47, icr: 4.1, ceiling: 3.5 },
  { q: 'Q2-25', leverage: 3.41, icr: 4.2, ceiling: 3.5 },
  { q: 'Q3-25', leverage: 3.35, icr: 4.3, ceiling: 3.5 },
  { q: 'Q4-25', leverage: 3.29, icr: 4.4, ceiling: 3.5 },
  { q: 'Q1-26', leverage: 3.23, icr: 4.5, ceiling: 3.5 },
  { q: 'Q2-26', leverage: 3.17, icr: 4.6, ceiling: 3.5 },
]

// ─── Funding plan ─────────────────────────────────────────────────────────────
const FUNDING_PLAN = [
  { instrument: 'BISX-listed green bond 7yr', amount:   50, purpose: 'Pre-finance 2030 bond wall',      timing: 'Q3-26', status: 'Planned'  },
  { instrument: 'Bank term loan 5yr — CIBC FirstCaribbean (demo)', amount: 15, purpose: 'URCA spectrum fees / capex',                timing: 'Q4-26', status: 'Mandated' },
  { instrument: 'RCF renewal BSD 35M (3+2) — RBC (demo)', amount: 35, purpose: 'Liquidity backstop renewal',      timing: 'Q1-27', status: 'Planning' },
  { instrument: 'Private-placement bond 10yr', amount:   25, purpose: 'Residual 2030 need / extend tenor',  timing: 'H2-27', status: 'Planning' },
]

const DEBT_PROFILE_TARGET = [
  { year: '2026',  actual:  8, target:  8 },
  { year: '2027',  actual: 14, target: 14 },
  { year: '2028',  actual: 22, target: 20 },
  { year: '2029',  actual: 30, target: 28 },
  { year: '2030',  actual: 70, target: 50 },
  { year: '2031+', actual: 42, target: 66 },
]

// ─── Rating agencies ──────────────────────────────────────────────────────────
const RATING_AGENCIES = [
  { agency: "S&P",    rating: 'BB',   outlook: 'Stable',   date: 'Mar 2026', keyMetric: 'Net debt/EBITDA 3.17×', triggerUp: 'Net debt/EBITDA < 2.75× sustained', triggerDown: 'Net debt/EBITDA > 3.75×'   },
  { agency: 'Moodys', rating: 'Ba2',  outlook: 'Stable',   date: 'Feb 2026', keyMetric: 'FCF / debt 6.6%',       triggerUp: 'FCF / debt > 9% sustained',          triggerDown: 'FCF / debt < 4%'           },
  { agency: 'Fitch',  rating: 'BB',   outlook: 'Stable',   date: 'Jan 2026', keyMetric: 'EBITDA margin 37.5%',   triggerUp: 'Upgrade if leverage < 2.75×',        triggerDown: 'Downgrade if leverage > 3.75×' },
]

const RATING_PEER = [
  { co: 'Cable Bahamas',   leverage: 3.17, icr: 4.6, color: BLUE   },
  { co: 'BTC',  leverage: 2.60, icr: 5.2, color: NAVY   },
  { co: 'LLA (C&W)', leverage: 3.90, icr: 3.1, color: AMBER  },
  { co: 'Rival ISP A',      leverage: 2.10, icr: 6.0, color: GREEN  },
  { co: 'Digicel (demo)', leverage: 3.60, icr: 3.4, color: PURPLE },
]

const FCF_TREND = [
  { fy: 'FY22',  fcf:   8, ebitda: 44, capex: 26 },
  { fy: 'FY23',  fcf:   9, ebitda: 46, capex: 25 },
  { fy: 'FY24',  fcf:  10, ebitda: 48, capex: 24 },
  { fy: 'FY25',  fcf:  11, ebitda: 50, capex: 24 },
  { fy: 'FY26e', fcf:  12, ebitda: 52, capex: 24 },
]

const SPREAD_HISTORY = [
  { m: 'Jan-25', spread: 395 }, { m: 'Apr-25', spread: 380 },
  { m: 'Jul-25', spread: 372 }, { m: 'Oct-25', spread: 360 },
  { m: 'Jan-26', spread: 365 }, { m: 'Apr-26', spread: 358 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'liquidity' | 'debt-maturity' | 'fx-hedging' | 'cash-pooling' | 'covenants' | 'funding-plan' | 'rating-agency'

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',       label: 'Overview',      icon: Activity   },
  { id: 'liquidity',      label: 'Liquidity',      icon: PiggyBank  },
  { id: 'debt-maturity',  label: 'Debt Maturity',  icon: Landmark   },
  { id: 'fx-hedging',     label: 'FX & Rates',     icon: Globe      },
  { id: 'cash-pooling',   label: 'Cash Pooling',   icon: RefreshCw  },
  { id: 'covenants',      label: 'Covenants',      icon: Shield     },
  { id: 'funding-plan',   label: 'Funding Plan',   icon: Zap        },
  { id: 'rating-agency',  label: 'Rating Agency',  icon: CreditCard },
]

export default function CapitalTreasuryPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [irShockBps, setIrShockBps] = useState<number>(0)
  const [fxFilter, setFxFilter] = useState<string>('All')
  const [newIssuanceAmt, setNewIssuanceAmt] = useState<number>(50)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [hedgeRatioPct, setHedgeRatioPct] = useState<number>(75)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const totalDebt = useMemo(
    () => DEBT_LADDER.reduce((s, d) => s + d.amt, 0),
    [],
  )

  const filteredFxBook = useMemo(
    () => fxFilter === 'All' ? FX_BOOK : FX_BOOK.filter(f => f.pair === fxFilter),
    [fxFilter],
  )

  const irCostDelta = useMemo(
    () => Math.round((irShockBps / 100) * 44 * 0.45 * 10) / 10,
    [irShockBps],
  )

  const fundingNeed2030 = useMemo(
    () => Math.max(0, 70 - newIssuanceAmt),
    [newIssuanceAmt],
  )

  const hedgedFxPnl = useMemo(
    () => FX_PNL_TREND.map(row => ({
      ...row,
      effective: +(row.hedged * (hedgeRatioPct / 100) + row.unhedged * (1 - hedgeRatioPct / 100)).toFixed(2),
    })),
    [hedgeRatioPct],
  )

  const poolTotal = useMemo(
    () => CASH_POOL.reduce((s, e) => s + e.balance, 0),
    [],
  )

  const fxPairs = useMemo(() => ['All', ...FX_BOOK.map(f => f.pair)], [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Capital Allocation & Treasury')}
        subtitle={tt('Liquidity · debt maturity · FX hedging · cash pooling · covenants · funding · rating')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              {KPI.netDebtEbitdaX}× {tt('net debt/EBITDA')}
            </span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">
              {KPI.creditRating}
            </span>
            {liveTime && (
              <span className="text-vfes-dark/45 text-[10px] font-mono">{liveTime}</span>
            )}
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Treasury intelligence"
        models={[
          { name: 'Cash Flow Predictor',    metric: 'RMSE BSD 0.4M',    sub: '30-day rolling cash forecast'     },
          { name: 'FX Impact Model',         metric: 'R² 0.88',      sub: 'FX sensitivity on EBITDA margin'  },
          { name: 'Covenant Early-Warning',  metric: 'precision 0.94', sub: 'leverage headroom alert system' },
        ]}
        agentLabel="Run Treasury Optimiser"
        agentRunningLabel="Modelling…"
        agentSteps={[
          'Forecast 12-week cash flows from billing + supply chain feeds',
          'Modelled FX impact on Q3 EBITDA — BSD/USD peg holds; residual GBP/CAD supplier exposure only',
          'Checked all 6 covenants — all green; 2030 maturity wall flagged',
          'Proposed Q3 BISX-listed green-bond issuance to pre-finance the 2030 wall',
        ]}
        agentBlurb="One treasury data model — cash, FX, debt, covenants — means the AI sees the full exposure picture before recommending any financing action."
        decision={{
          title: 'Pre-finance the 2030 maturity wall with a BISX-listed green bond in Q3-26',
          detail: 'The 2030 bond wall (BSD 70M) coincides with the URCA spectrum licence renewal. Pre-financing BSD 50M with a Q3 BISX-listed green bond while local pension and insurance demand is strong locks in an all-in cost near Bahamas Prime + 200bps, avoids a double-draw in 2030 and supports the stable BB rating.',
          impact: 'locks in cost · avoids 2030 double-draw · supports stable BB rating',
          risk: 'rate window — spreads have tightened only 7bps since Jan; act before local institutional allocations are committed',
          linkTo: '/portal/investor-relations',
          linkLabel: 'Open Investor Relations',
        }}
        chart={{
          kind: 'line',
          title: 'Net debt / EBITDA trend — 8 quarters vs covenant (×)',
          xKey: 'q',
          unit: '×',
          data: LEVERAGE_TREND,
          series: [
            { key: 'leverage', name: 'Net debt/EBITDA', color: BLUE              },
            { key: 'covenant', name: 'Covenant ceiling', color: RED, dashed: true },
          ],
          note: 'Leverage improving −0.24× YoY (3.41× → 3.17×) — on track for < 3.0× by FY2027.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('2030 maturity wall BSD 70M · BSD/USD at 1:1 peg (no FX risk) · residual GBP/CAD forwards MTM +BSD 0.03M · Fitch: BB Stable')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('BISX-listed green bond Q3-26 mandate in progress — local investor roadshow booked. CIBC FirstCaribbean term loan BSD 15M (demo) approved by treasury committee.')}
              </div>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline shrink-0">
              {tt('Dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net debt / EBITDA')} value={`${KPI.netDebtEbitdaX}×`} delta={tt('covenant 3.5× · headroom 0.33×')} trend="up" icon={Scale} accent />
          <KpiCard label={tt('Total gross debt')} value={`BSD ${totalDebt}M`} delta={tt('avg coupon 6.1%')} trend="flat" icon={Landmark} />
          <KpiCard label={tt('WACC')} value="9.6%" delta={tt('capex hurdle rate')} trend="flat" icon={Percent} />
          <KpiCard label={tt('Total liquidity')} value="BSD 59M" delta={tt('7.4× 12m maturities')} trend="up" icon={PiggyBank} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FCF (TTM)')} value={`BSD ${KPI.fcfTtmM}M`} delta={tt('+9% YoY · 6.6% FCF/debt')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Credit rating')} value="BB" delta={tt("S&P Stable · Fitch Stable")} trend="up" icon={CreditCard} />
          <KpiCard label={tt('FX book MTM')} value="+BSD 0.03M" delta={tt('net across 2 hedged pairs')} trend="up" icon={Globe} />
          <KpiCard label={tt('Cash pool total')} value={`BSD ${poolTotal}M`} delta={tt('7 entities · BSD / USD')} trend="flat" icon={RefreshCw} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Leverage vs covenant — 6 quarters')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={COVENANT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[2, 4]} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v.toFixed(2)}×`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="leverage" name={tt('Leverage')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="ceiling" name={tt('Covenant')} stroke={RED} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('FCF & EBITDA trend (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={FCF_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="fy" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[0, 60]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[0, 20]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="ebitda" name={tt('EBITDA BSD M')} fill={BLUE} opacity={0.65} />
                  <Line yAxisId="r" type="monotone" dataKey="fcf" name={tt('FCF BSD M')} stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#222128] mb-1">{tt('Finance')}</div>
            <div className="text-sm text-vfes-dark/70 mb-3">{tt('Group P&L, EBITDA, FCF and segment financials.')}</div>
            <Link to="/portal/finance" className="text-xs font-bold text-[#222128] hover:underline">{tt('Open Finance →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">{tt('M&A Simulator')}</div>
            <div className="text-sm text-vfes-dark/70 mb-3">{tt('TowerCo carve-out leverage & EPS impact model.')}</div>
            <Link to="/portal/ma-simulator" className="text-xs font-bold text-[#10B981] hover:underline">{tt('Open M&A Simulator →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] mb-1">{tt('Investor Relations')}</div>
            <div className="text-sm text-vfes-dark/70 mb-3">{tt('Debt capital markets calendar and analyst consensus.')}</div>
            <Link to="/portal/investor-relations" className="text-xs font-bold text-[#7C3AED] hover:underline">{tt('Open IR →')}</Link>
          </div>
        </div>
        <div className="mt-6">
          <Panel title={tt('Key treasury metrics — at a glance')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Metric')}</th>
                    <th className="text-right">{tt('Q2-26')}</th>
                    <th className="text-right">{tt('Q2-25')}</th>
                    <th className="text-right">{tt('YoY change')}</th>
                    <th>{tt('Direction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'Net debt / EBITDA',    cur: '3.17×', prev: '3.41×', chg: '−0.24×',    dir: 'up'   },
                    { metric: 'Total liquidity (BSD M)',  cur: '59',  prev: '54',  chg: '+BSD 5M',   dir: 'up'   },
                    { metric: 'Interest cover (×)',     cur: '4.6×',  prev: '4.4×',  chg: '+0.2×',     dir: 'up'   },
                    { metric: 'WACC (%)',               cur: '9.6%',  prev: '9.9%',  chg: '−30bps',    dir: 'up'   },
                    { metric: 'FCF TTM (BSD M)',           cur: 'BSD 12M',  prev: 'BSD 11M',  chg: '+BSD 1M',      dir: 'up'   },
                    { metric: 'Avg debt maturity (yr)', cur: '5.4yr', prev: '5.9yr', chg: '−0.5yr',    dir: 'down' },
                    { metric: 'Avg coupon (%)',          cur: '6.1%',  prev: '5.8%',  chg: '+30bps',    dir: 'down' },
                  ].map(row => (
                    <tr key={row.metric} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(row.metric)}</td>
                      <td className="text-right font-bold font-mono text-xs">{row.cur}</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/55">{row.prev}</td>
                      <td className={`text-right font-bold text-xs ${row.dir === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>{row.chg}</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${row.dir === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{tt(row.dir === 'up' ? 'Improving' : 'Watch')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-vfes-dark/50 mt-4">
          <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO Dashboard →')}</Link>
          <span>·</span>
          <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
          <span>·</span>
          <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
          <span>·</span>
          <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}

      {/* ══════════════ LIQUIDITY ═════════════════════════════════════════════ */}
      {tab === 'liquidity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cash & equivalents')} value="BSD 24M" delta={tt('+BSD 1M QoQ')} trend="up" icon={DollarSign} accent />
          <KpiCard label={tt('Undrawn RCF')} value="BSD 35M" delta={tt('expires Q1-27 · renewal planning')} trend="flat" icon={Lock} />
          <KpiCard label={tt('Total liquidity')} value="BSD 59M" delta={tt('7.4× 12-month maturities')} trend="up" icon={PiggyBank} />
          <KpiCard label={tt('12m maturities')} value="BSD 8M" delta={tt('2026 bond only')} trend="flat" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cash forecast — actual vs ML model (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={CASH_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[15, 30]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="forecast" name={tt('ML forecast')} stroke={BLUE} fill={BLUE} fillOpacity={0.15} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="actual" name={tt('Actual cash')} stroke={GREEN} fill={GREEN} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Forecast RMSE BSD 12M — Sep dip expected on spectrum payment; covered by RCF.')}</div>
          </Panel>

          <Panel title={tt('12-month liquidity waterfall (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={LIQUIDITY_WATERFALL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="item" tick={{ fontSize: 9 }} width={165} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="value" name={tt('BSD M')} radius={[0, 4, 4, 0]}>
                    {LIQUIDITY_WATERFALL.map((w, i) => (
                      <Cell key={i} fill={w.type === 'neg' ? RED : w.type === 'rcf' ? PURPLE : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('WACC composition (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={WACC_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="comp" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 12]} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="val" name={tt('Rate %')} radius={[4, 4, 0, 0]}>
                    {WACC_DATA.map((_, i) => <Cell key={i} fill={i === 2 ? GREEN : NAVY} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('WACC 9.6% is the capex hurdle — all network investments must clear this bar.')}</div>
          </Panel>

          <Panel title={tt('Capital uses — FCF allocation (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={CAPITAL_USES} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d: any) => `${d.value}%`}>
                    {CAPITAL_USES.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          <span>·</span>
          <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
        </div>
      </>)}

      {/* ══════════════ DEBT MATURITY ═════════════════════════════════════════ */}
      {tab === 'debt-maturity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total gross debt')} value={`BSD ${totalDebt}M`} delta={tt('6 tranches · avg 5.4yr')} trend="flat" icon={Landmark} accent />
          <KpiCard label={tt('Avg coupon')} value="6.1%" delta={tt('blended all-in')} trend="flat" icon={Percent} />
          <KpiCard label={tt('2030 maturity wall')} value="BSD 70M" delta={tt('largest single tranche')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Pre-financing status')} value="In progress" delta={tt('Q3-26 BISX bond mandate')} trend="up" icon={Target} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Debt maturity ladder (BSD M) — by year')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DEBT_LADDER}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number, _n: any, p: any) => [`BSD ${v}M · coupon ${p.payload.coupon}% · ${p.payload.type}`, tt('Maturity')]} />
                  <Bar dataKey="amt" name={tt('Amount BSD M')} radius={[6, 6, 0, 0]}>
                    {DEBT_LADDER.map((d, i) => <Cell key={i} fill={d.amt >= 60 ? AMBER : NAVY} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = BSD 50M threshold — triggers pre-financing review. 2030 wall is the priority.')}</div>
          </Panel>

          <Panel title={tt('Actual vs target maturity profile post-issuance (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DEBT_PROFILE_TARGET}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" name={tt('Current')} fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name={tt('Target profile')} fill={GREEN} opacity={0.75} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Debt maturity register — all tranches')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Maturity year')}</th>
                  <th className="text-right">{tt('Amount')}</th>
                  <th className="text-right">{tt('Coupon')}</th>
                  <th>{tt('Instrument')}</th>
                  <th>{tt('Treasury action')}</th>
                </tr>
              </thead>
              <tbody>
                {DEBT_LADDER.map(d => (
                  <tr key={d.year} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-bold font-mono">{d.year}</td>
                    <td className={`text-right font-bold ${d.amt >= 60 ? 'text-amber-600' : 'text-vfes-dark'}`}>BSD {d.amt}M</td>
                    <td className="text-right font-mono text-sm">{d.coupon}%</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${d.type === 'bond' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{tt(d.type)}</span></td>
                    <td className="text-xs text-vfes-dark/65">{d.amt >= 60 ? tt('Pre-finance recommended') : d.year === '2026' ? tt('Q3-26 BISX bond in progress') : tt('Monitor — no action')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
            <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
            <span>·</span>
            <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          </div>
        </Panel>

        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#11567F]/10 to-transparent border border-[#11567F]/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#11567F] mb-1">{tt('Treasury alert')}</div>
          <div className="text-sm text-vfes-dark/75">{tt('2030 wall (BSD 70M bond) coincides with the next URCA spectrum renewal cycle. Pre-financing BSD 50M with the Q3-26 BISX-listed green bond removes most of the refinancing risk and locks in current spreads (358bps over US Treasuries). Act before local institutional allocations close in August.')}</div>
          <div className="mt-2 flex items-center gap-3">
            <Link to="/portal/finance" className="text-xs font-bold text-[#11567F] hover:underline">{tt('Finance overview →')}</Link>
            <Link to="/portal/ma-simulator" className="text-xs font-bold text-[#11567F] hover:underline">{tt('M&A Simulator →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ FX & RATES ════════════════════════════════════════════ */}
      {tab === 'fx-hedging' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FX exposure hedged')} value={`${hedgeRatioPct}%`} delta={tt('3 currency pairs')} trend="up" icon={Globe} accent />
          <KpiCard label={tt('Total FX notional')} value="BSD 20.0M" delta={tt('across all pairs')} trend="flat" icon={DollarSign} />
          <KpiCard label={tt('Book MTM net')} value="+BSD 0.03M" delta={tt('net P&L across pairs')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Floating debt')} value="BSD 44M" delta={tt('Bahamas Prime + spread')} trend="flat" icon={BarChart2} />
        </div>

        <Panel title={tt('Hedge ratio & IR shock model')}>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('Hedge ratio')}</span>
                  <span className="font-mono font-bold">{hedgeRatioPct}%</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={hedgeRatioPct}
                  onChange={e => setHedgeRatioPct(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('IR shock (bps)')}</span>
                  <span className="font-mono font-bold">{irShockBps > 0 ? '+' : ''}{irShockBps}bps</span>
                </div>
                <input type="range" min={-200} max={300} step={25} value={irShockBps}
                  onChange={e => setIrShockBps(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div className="flex flex-wrap gap-2">
                {fxPairs.map(p => (
                  <button key={p} onClick={() => setFxFilter(p)}
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${fxFilter === p ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="rounded-lg bg-[#f6f7fb] p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-vfes-dark/65">{tt('IR cost delta (annual)')}</span>
                  <span className={`font-bold ${irCostDelta > 0 ? 'text-red-600' : irCostDelta < 0 ? 'text-emerald-600' : 'text-vfes-dark'}`}>
                    {irCostDelta === 0 ? 'BSD 0M' : `${irCostDelta > 0 ? '+' : ''}BSD ${irCostDelta}M`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vfes-dark/65">{tt('Net hedged FX MTM')}</span>
                  <span className="font-bold text-emerald-600">+BSD {(0.03 * hedgeRatioPct / 100).toFixed(2)}M</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('FX hedged vs unhedged P&L (BSD M)')}</div>
              <div className="h-52">
                <ResponsiveContainer>
                  <LineChart data={hedgedFxPnl}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="hedged" name={tt('Hedged')} stroke={GREEN} strokeWidth={2} dot />
                    <Line type="monotone" dataKey="unhedged" name={tt('Unhedged')} stroke={RED} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="effective" name={tt('Effective')} stroke={BLUE} strokeWidth={2} dot={false} />
                    <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('IR sensitivity — annual interest cost delta (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={IR_SENSITIVITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="shock" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`BSD ${v}M`, tt('Cost delta')]} />
                  <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Bar dataKey="delta" name={tt('Delta BSD M')} radius={[4, 4, 0, 0]}>
                    {IR_SENSITIVITY.map((r, i) => <Cell key={i} fill={r.delta > 0 ? AMBER : r.delta < 0 ? GREEN : SLATE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('FX hedging book — active positions')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Pair')}</th>
                    <th className="text-right">{tt('Notional')}</th>
                    <th className="text-right">{tt('MTM BSD M')}</th>
                    <th>{tt('Type')}</th>
                    <th>{tt('Maturity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFxBook.map(f => (
                    <tr key={f.pair} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-bold font-mono">{f.pair}</td>
                      <td className="text-right font-mono text-xs">BSD {f.notional}M</td>
                      <td className={`text-right font-bold ${f.mtm >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{f.mtm >= 0 ? '+' : ''}BSD {f.mtm}M</td>
                      <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-700">{tt(f.type)}</span></td>
                      <td className="text-xs font-mono">{f.maturity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/revenue-assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CASH POOLING ══════════════════════════════════════════ */}
      {tab === 'cash-pooling' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Pool total (BSD equiv)')} value={`BSD ${poolTotal}M`} delta={tt('7 entities · BSD / USD')} trend="flat" icon={RefreshCw} accent />
          <KpiCard label={tt('Header account')} value="BSD 14M" delta={tt('Cable Bahamas Ltd — Nassau, The Bahamas')} trend="up" icon={PiggyBank} />
          <KpiCard label={tt('Notional pool members')} value="3" delta={tt('Holding · Fixed · Business — BSD')} trend="flat" icon={Globe} />
          <KpiCard label={tt('Physical pool members')} value="4" delta={tt('aliv · Fibre · Media — BSD/USD')} trend="flat" icon={DollarSign} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cash pool entity balances (BSD M equiv)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CASH_POOL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="entity" tick={{ fontSize: 9 }} width={165} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="balance" name={tt('Balance BSD M')} radius={[0, 4, 4, 0]}>
                    {CASH_POOL.map((e, i) => <Cell key={i} fill={e.pool === 'header' ? BLUE : e.pool === 'notional' ? GREEN : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cash pool structure — entities & types')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Entity')}</th>
                    <th>{tt('CCY')}</th>
                    <th className="text-right">{tt('Balance BSD M')}</th>
                    <th>{tt('Pool type')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CASH_POOL.map(e => (
                    <tr key={e.entity} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{e.entity}</td>
                      <td className="font-mono text-xs">{e.currency}</td>
                      <td className="text-right font-bold">BSD {e.balance}M</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${e.pool === 'header' ? 'bg-blue-100 text-blue-700' : e.pool === 'notional' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tt(e.type)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Notional pooling offsets BSD balances without physical movement. Physical pools sweep USD supplier-payment accounts weekly.')}</div>
          </Panel>
        </div>
        <div className="mt-4 rounded-xl bg-[#f6f7fb] border border-black/5 p-4 text-sm text-vfes-dark/70">
          <div className="font-semibold text-vfes-dark mb-1">{tt('Cash pool efficiency note')}</div>
          <div>{tt('Notional pooling avoids physical fund movements between BSD entities, reducing transfer costs. The header account in Nassau earns a positive spread on overnight deposits. Physical USD pools (at the 1:1 peg) sweep excess each Monday — no FX carry.')}</div>
          <div className="mt-2 text-xs text-vfes-dark/50">{tt('Intercompany funding rate: Bahamas Prime +80bps | Pool balance review: quarterly | Bank: RBC Royal Bank / CIBC FirstCaribbean tri-party')}</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-vfes-dark/50 mt-3">
          <Link to="/portal/supply-chain" className="font-semibold text-vfes-dark hover:underline">{tt('Supply Chain →')}</Link>
          <span>·</span>
          <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
          <span>·</span>
          <Link to="/portal/device-financing" className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing →')}</Link>
        </div>
      </>)}

      {/* ══════════════ COVENANTS ═════════════════════════════════════════════ */}
      {tab === 'covenants' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Covenants passing')} value="6 / 6" delta={tt('all green · no breach risk')} trend="up" icon={Shield} accent />
          <KpiCard label={tt('Tightest headroom')} value="0.33×" delta={tt('leverage vs 3.5× ceiling')} trend="up" icon={AlertTriangle} />
          <KpiCard label={tt('Interest cover')} value="4.6×" delta={tt('vs 3.0× floor · +1.6× buffer')} trend="up" icon={Scale} />
          <KpiCard label={tt('Next test date')} value="Q3-26" delta={tt('semi-annual covenant test')} trend="flat" icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Covenant scorecard — all financial tests')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Covenant')}</th>
                    <th className="text-right">{tt('Limit')}</th>
                    <th className="text-right">{tt('Actual')}</th>
                    <th className="text-right">{tt('Headroom')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COVENANTS.map(c => (
                    <tr key={c.covenant} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(c.covenant)}</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/65">{c.limit}</td>
                      <td className="text-right font-bold text-xs">{c.actual}</td>
                      <td className="text-right font-bold text-emerald-600 text-xs">{c.headroom}</td>
                      <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-emerald-100 text-emerald-700">{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
              <span>·</span>
              <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Leverage & ICR trend — covenant headroom')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={COVENANT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[2, 4]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[6, 10]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="leverage" name={tt('Leverage ×')} fill={BLUE} opacity={0.8} />
                  <Line yAxisId="l" type="monotone" dataKey="ceiling" name={tt('Covenant ×')} stroke={RED} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="icr" name={tt('ICR × (RHS)')} stroke={GREEN} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Bond spread — 10yr (bps over US Treasuries)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={SPREAD_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="bps" domain={[330, 420]} />
                <Tooltip contentStyle={TS} formatter={(v: number) => `${v}bps`} />
                <Area type="monotone" dataKey="spread" name={tt('IG spread (bps)')} stroke={NAVY} fill={NAVY} fillOpacity={0.2} />
                <ReferenceLine y={375} stroke={AMBER} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Spread tightened 7bps in last 2 quarters — favourable window for Q3 BISX green bond issuance.')}</div>
        </Panel>
        <div className="mt-3 text-[10px] text-vfes-dark/40">{tt('Last rating review: Apr 2026 · Next covenant test: Sep 2026 · BB Stable · BISX-listed')}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <span>·</span>
          <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO →')}</Link>
          <span>·</span>
          <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
        </div>
      </>)}

      {/* ══════════════ FUNDING PLAN ══════════════════════════════════════════ */}
      {tab === 'funding-plan' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Planned issuances')} value="4" delta={tt('Q3-26 through H2-27')} trend="flat" icon={Zap} accent />
          <KpiCard label={tt('Mandate in hand')} value="BSD 15M" delta={tt('CIBC FirstCaribbean term loan Q4-26 (demo)')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Q3 BISX bond target')} value={`BSD ${newIssuanceAmt}M`} delta={tt('adjust with slider below')} trend="flat" icon={DollarSign} />
          <KpiCard label={tt('Residual 2030 need')} value={fundingNeed2030 === 0 ? tt('Fully covered') : `BSD ${fundingNeed2030}M`} delta={fundingNeed2030 === 0 ? tt('Pre-financed ✓') : tt('Still to fund')} trend={fundingNeed2030 === 0 ? 'up' : 'down'} icon={AlertTriangle} />
        </div>

        <Panel title={tt('Q3 BISX green bond issuance sizing (BSD M)')}>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('New issuance amount')}</span>
                  <span className="font-mono font-bold">BSD {newIssuanceAmt}M</span>
                </div>
                <input type="range" min={20} max={80} step={5} value={newIssuanceAmt}
                  onChange={e => setNewIssuanceAmt(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div className="rounded-lg bg-[#f6f7fb] p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-vfes-dark/65">{tt('2030 wall (BSD 70M) covered')}</span>
                  <span className={`font-bold ${fundingNeed2030 === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fundingNeed2030 === 0 ? tt('Yes — fully pre-financed') : `BSD ${fundingNeed2030}M ${tt('still needed')}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vfes-dark/65">{tt('Leverage impact')}</span>
                  <span className="font-bold text-emerald-600">{tt('Neutral — refinancing')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vfes-dark/65">{tt('Green / ESG label eligible')}</span>
                  <span className="font-bold text-emerald-600">{tt('Yes — network capex use of proceeds')}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Target vs actual maturity profile (BSD M)')}</div>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={DEBT_PROFILE_TARGET}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="actual" name={tt('Current')} fill={NAVY} opacity={0.8} />
                    <Bar dataKey="target" name={tt('Target')} fill={GREEN} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Funding pipeline — all upcoming issuances')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Instrument')}</th>
                    <th className="text-right">{tt('Amount')}</th>
                    <th>{tt('Purpose')}</th>
                    <th>{tt('Timing')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNDING_PLAN.map(f => (
                    <tr key={f.instrument} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{f.instrument}</td>
                      <td className="text-right font-bold text-xs">BSD {f.amount}M</td>
                      <td className="text-xs text-vfes-dark/65">{tt(f.purpose)}</td>
                      <td className="font-mono text-xs">{f.timing}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${f.status === 'Mandated' ? 'bg-emerald-100 text-emerald-700' : f.status === 'Planned' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tt(f.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
              <span>·</span>
              <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ RATING AGENCY ═════════════════════════════════════════ */}
      {tab === 'rating-agency' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt("S&P")} value="BB" delta={tt('Outlook: Stable')} trend="flat" icon={CreditCard} accent />
          <KpiCard label={tt("Moody's")} value="Ba2" delta={tt('Outlook: Stable')} trend="flat" icon={CreditCard} />
          <KpiCard label={tt("Fitch")} value="BB" delta={tt('Outlook: Stable')} trend="flat" icon={CreditCard} />
          <KpiCard label={tt('Bond spread (10yr)')} value="358bps" delta={tt('vs US Treasuries')} trend="flat" icon={Percent} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Agency scorecard — ratings, outlook & triggers')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Agency')}</th>
                    <th>{tt('Rating')}</th>
                    <th>{tt('Outlook')}</th>
                    <th>{tt('Key metric')}</th>
                    <th>{tt('Upgrade trigger')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RATING_AGENCIES.map(r => (
                    <tr key={r.agency} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-bold text-xs">{r.agency}</td>
                      <td className="font-extrabold text-[#11567F]">{r.rating}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${r.outlook === 'Positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{tt(r.outlook)}</span></td>
                      <td className="text-xs">{r.keyMetric}</td>
                      <td className="text-xs text-vfes-dark/65">{r.triggerUp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
              <span>·</span>
              <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO Dashboard →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Peer leverage comparison — net debt / EBITDA (×)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={RATING_PEER} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 4]} />
                  <YAxis type="category" dataKey="co" tick={{ fontSize: 10 }} width={82} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v.toFixed(2)}×`} />
                  <Bar dataKey="leverage" name={tt('Leverage ×')} radius={[0, 4, 4, 0]}>
                    {RATING_PEER.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                  <ReferenceLine x={3.5} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Peer ICR — interest cover ratio (×)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={RATING_PEER}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="co" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="×" domain={[0, 12]} />
                <Tooltip contentStyle={TS} formatter={(v: number) => `${v.toFixed(1)}×`} />
                <Bar dataKey="icr" name={tt('ICR ×')} radius={[4, 4, 0, 0]}>
                  {RATING_PEER.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
                <ReferenceLine y={3} stroke={RED} strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 3.0× covenant floor — all peers above. Cable Bahamas ICR 4.6× sits mid-pack.')}</div>
        </Panel>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <span>·</span>
          <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
        </div>
      </>)}
    </div>
  )
}
