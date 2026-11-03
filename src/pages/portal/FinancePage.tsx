import { FINANCE, FINANCE_TREND, round } from '../../data/scenario'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import tt from '../../i18n/tt'
import KPI from './_kpi_facts'
import KpiCard from '../../components/KpiCard'
import {
  Wallet, TrendingUp, PieChart as PieIcon, Coins, Activity, DollarSign,
  Send, Brain, Sparkles, AlertTriangle, ShieldCheck, Bell, Calendar,
  GitBranch, Target, ArrowUpRight, Briefcase, Award, FlaskConical, Users,
  Trophy, Globe, Server, Heart, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts'
import { REVENUE_BY_LANE } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const headline = {
    mrr: FINANCE.monthlyRevenueM, mrrDelta: 1.01,
    arpu: 47.4, arpuDelta: 0.8, gm: 60, gmDelta: 0.4,
    ebitda: FINANCE.monthlyEbitdaM, ebitdaDelta: 1.01,
    fcf: 1.2, fcfDelta: 1.01, netDebt: FINANCE.netDebtM, leverage: KPI.netDebtEbitdaX,
    cashBalance: FINANCE.cashM, dso: 32, dpo: 64, dio: 14, ccc: -18,
    capexYTD: 10, capexPlan: 24, daysToClose: 6.2, closeAuto: 78,
  }

// P&L
const pnl = [
    ['Revenue',12],['COGS',-4.8],['Gross profit',7.2],['Sales & Marketing',-1.8],
    ['G&A',-0.9],['EBITDA',4.5],['D&A',-1.5],['EBIT',3],['Interest expense',-0.6],['Tax',-0.3],['Net income',2.1],
  ].map(([line, actual]) => ({line: String(line), actual: Number(actual), plan: round(Number(actual)*1.02), py: round(Number(actual)*0.95)}))

const revStacked = FINANCE_TREND.map(row=>({m:row.m,BB:round(row.revenue*5/12),TV:0,Mob:round(row.revenue*4/12),Bun:round(row.revenue*3/12)}))

const ebitdaWalk = [
    {k:'EBITDA PY',v:4.275,color:'#94a3b8'},
    {k:'Net operating improvement',v:0.225,color:'#10b981'},
    {k:'EBITDA CY',v:4.5,color:'#FF4438'},
  ]

const arpuTier = [
  { tier: '250 Mb',  arpu: 32, share: 18, churn: 4.2 },
  { tier: '500 Mb',  arpu: 42, share: 28, churn: 3.6 },
  { tier: '1 Gb',    arpu: 54, share: 22, churn: 2.4 },
  { tier: '2 Gb',    arpu: 64, share: 8,  churn: 1.8 },
  { tier: '5 Gb β',  arpu: 78, share: 1,  churn: 1.2 },
  { tier: 'B2B Fibre', arpu: 124, share: 6, churn: 1.4 },
  { tier: 'REVConnect',    arpu: 84,  share: 17, churn: 1.6 },
]

// Cash flow
const cashflowMonthly = FINANCE_TREND

const cash13wk = Array.from({length:13},(_,index)=>({wk: `W${index+1}`,inflow:3,outflow:2.7,balance:round(FINANCE.cashM+(index+1)*0.3)}))

const arAging = [
  { bucket: 'Current',     amt: 14.2, color: '#10b981' },
  { bucket: '1-30 days',   amt: 3.8,  color: '#f59e0b' },
  { bucket: '31-60 days',  amt: 1.2,  color: '#fb923c' },
  { bucket: '61-90 days',  amt: 0.6,  color: '#ef4444' },
  { bucket: '90+ days',    amt: 0.3,  color: '#7f1d1d' },
]

const topOverdueAR = [
  { acc: 'BTC Wholesale (interconnect)', amt: 412, dso: 88,  status: 'Disputed', owner: 'Treasury' },
  { acc: 'Island Bank (demo) Group',                     amt: 184, dso: 64,  status: 'In dunning', owner: 'B2B Coll.' },
  { acc: 'Island Logistics (demo) Group',                      amt: 142, dso: 78,  status: 'Manual review', owner: 'B2B Coll.' },
  { acc: 'Nassau Bus',                    amt: 96,  dso: 54,  status: 'Promise to pay', owner: 'B2B Coll.' },
  { acc: 'Island Air (demo) Holdings',              amt: 84,  dso: 42,  status: 'Promise to pay', owner: 'B2B Coll.' },
]

const apTopSuppliers = [
  { sup: 'Cable Bahamas Group · intercompany', spendQ: 12.4, dpo: 30, risk: 'Low' },
  { sup: 'Rival ISP C The Bahamas (MVNO)',          spendQ: 4.2,  dpo: 45, risk: 'Low' },
  { sup: 'Cisco Systems',                  spendQ: 3.8,  dpo: 60, risk: 'Low' },
  { sup: 'Nokia Solutions',                spendQ: 2.6,  dpo: 60, risk: 'Low' },
  { sup: 'Rival ISP B · content',                  spendQ: 2.1,  dpo: 30, risk: 'Medium' },
  { sup: 'Snowflake (cloud)',              spendQ: 0.9,  dpo: 30, risk: 'Low' },
  { sup: 'Civils · KN Networks',          spendQ: 1.4,  dpo: 45, risk: 'Medium' },
]

// CapEx
const capexByCat = [
  { cat: 'Footprint build (FTTH)',  v: 62, color: RED },
  { cat: 'DOCSIS 3.1 / 4.0',         v: 28, color: RED2 },
  { cat: 'Backbone / 400G',          v: 18, color: RED3 },
  { cat: 'CPE / Wi-Fi',              v: 22, color: RED4 },
  { cat: 'Mobile / Open RAN',        v: 14, color: RED5 },
  { cat: 'IT / OSS / Snowflake',     v: 8,  color: '#94a3b8' },
  { cat: 'Real estate · refurb',     v: 4,  color: '#0ea5e9' },
  { cat: 'Sustainability / EV',      v: 6,  color: '#10b981' },
]

const capexProgrammes = [
  { p: 'Abaco West XGS-PON',     capex: 18.4, npv: 24.6, irr: 22, payback: '3.4 yr', rag: 'Green' },
  { p: 'Freeport Suburban Build',      capex: 28.6, npv: 31.2, irr: 18, payback: '4.2 yr', rag: 'Amber' },
  { p: '400G Backbone refresh',    capex: 38,   npv: 14.8, irr: 14, payback: '5.1 yr', rag: 'Green' },
  { p: 'XGS-PON full overlay',     capex: 124,  npv: 96.4, irr: 16, payback: '6.4 yr', rag: 'Amber' },
  { p: 'DOCSIS 4.0 trial',         capex: 4.8,  npv: 3.2,  irr: 24, payback: '2.8 yr', rag: 'Green' },
  { p: 'EV fleet transition',      capex: 12,   npv: 6.4,  irr: 12, payback: '5.4 yr', rag: 'Amber' },
]

const capexBuildVsMaintain = [
  { name: 'Build',       value: 64, color: RED },
  { name: 'Maintenance', value: 36, color: RED4 },
]

// Balance sheet & treasury
const debtLadder = [
  { y: '2026', amt: 24, type: 'Term loan A' },
  { y: '2027', amt: 84, type: 'Notes 4.5%' },
  { y: '2028', amt: 64, type: 'Notes 5.1%' },
  { y: '2029', amt: 96, type: 'Notes 5.4%' },
  { y: '2030', amt: 32, type: 'Term loan B' },
  { y: '2031+', amt: 20, type: 'Revolver' },
]

const covenants = [
  { c: 'Net Debt / EBITDA',     target: '≤ 4.5×', actual: '2.6×', headroom: '1.9×',  status: 'Pass' },
  { c: 'Interest cover',         target: '≥ 3.0×', actual: '4.4×', headroom: '1.4×',  status: 'Pass' },
  { c: 'Liquidity (cash + RCF)', target: '≥ BSD 50M', actual: 'BSD 146M', headroom: 'BSD 96M', status: 'Pass' },
  { c: 'Capex / Revenue',         target: '≤ 22%',  actual: '20.4%', headroom: '1.6 pp', status: 'Pass' },
  { c: 'Bad debt %',              target: '≤ 1.5%', actual: '1.2%',  headroom: '0.3 pp', status: 'Pass' },
]

const fxIrHedges = [
      { instr: 'IRS · floating → fixed',     notional: 84, expiry: 'Dec 28', mtm: 1.8,  status: 'Active' },
  { instr: 'Energy hedge · electricity', notional: 4.2, expiry: 'Dec 26', mtm: 0.2,  status: 'Active' },
]

// Forecast & FP&A
const ebitdaForecast = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  commit: 17.6 + i * 0.4,
  best:   17.6 + i * 0.6,
  low:    17.6 + i * 0.2,
  plan:   17.0 + i * 0.5,
}))

const sensitivities = [
  { driver: 'ARPU ±5%',           upside: 4.4, downside: -4.4 },
  { driver: 'Net adds ±10%',      upside: 1.6, downside: -1.6 },
  { driver: 'Bad debt ±50 bps',   upside: 0.3, downside: -0.3 },
  { driver: 'Energy price ±15%',  upside: 0.4, downside: -0.6 },
  { driver: 'Hurricane outage ±1 event', upside: 0.2, downside: -2.8 },
  { driver: 'Churn ±50 bps',      upside: 1.2, downside: -1.2 },
]

const forecastAccuracy = [
  { q: 'Q1', forecast: 17.8, actual: 18.0, var: 1.1 },
  { q: 'Q2', forecast: 18.2, actual: 18.4, var: 1.1 },
  { q: 'Q3', forecast: 18.4, actual: 18.6, var: 1.1 },
  { q: 'Q4', forecast: 18.6, actual: 18.6, var: 0.0 },
]

const riskRegister = [
  { r: 'BTC Fibre BSD 40 promo persistence',         impact: 'BSD 1.4M ARR', prob: 'High',   sev: 'High',   mit: 'Match for at-risk only' },
  { r: 'Rival ISP B content cost inflation FY27',          impact: 'BSD 2.1M GP',  prob: 'Medium', sev: 'High',   mit: 'Re-negotiate Q3' },
  { r: 'Hurricane season · restoration cost', impact: 'BSD 1.6M OpEx', prob: 'Medium', sev: 'High', mit: 'Catastrophe reserve' },
  { r: 'Casa CMTS EoS · migration delay',          impact: 'BSD 4.8M CapEx', prob: 'Low',  sev: 'Medium', mit: 'Cisco staged' },
  { r: 'B2B AR concentration (top 5 = 38%)',       impact: 'BSD 820K bad debt', prob: 'Low', sev: 'High',  mit: 'Credit insurance' },
  { r: 'Energy price spike',                       impact: 'BSD 640K OpEx', prob: 'Medium', sev: 'Medium', mit: 'Hedged 80% / yr' },
  { r: 'URCA pricing intervention',              impact: 'TBD',         prob: 'Low',  sev: 'High',   mit: 'Engagement plan' },
]

// AI / Cortex
const anomalies = [
  { sev: 'High',   when: '14:00', what: 'Network OpEx Freeport +8% MoM · unbudgeted contractor invoices', delta: 'BSD 142K' },
  { sev: 'Medium', when: '11:20', what: 'Promo dilution +4 pp on 500Mb tier vs forecast',             delta: 'BSD 84K MRR' },
  { sev: 'Medium', when: '08:45', what: 'Bad debt expectation +12 bps · 3 large B2B accounts at risk', delta: 'BSD 96K' },
  { sev: 'Low',    when: 'Yest',  what: 'Snowflake spend +18% MoM · model retraining workload',       delta: 'BSD 8K' },
]

const cortexPrompts = [
  { q: 'Why is gross margin down 30 bps in Freeport this month?',           sql: 'CALL diagnose_gm(region=>\'freeport\', month=>CURRENT_MONTH)' },
  { q: 'Forecast cash position 13 weeks',                                sql: 'SELECT * FROM CASH_FORECAST_13W' },
  { q: 'Show top 10 GL anomalies last 30 days',                           sql: 'SELECT * FROM GL_ANOMALIES ORDER BY z_score DESC LIMIT 10' },
  { q: 'Which AR accounts will likely default in 60 days?',               sql: 'SELECT * FROM AR_DEFAULT_RISK WHERE prob > 0.4' },
  { q: 'Auto-draft monthly MD&A summary',                                 sql: 'CALL gen_mdna(month=>CURRENT_MONTH)' },
  { q: 'Compare CapEx burn rate vs plan by programme',                    sql: 'SELECT programme, burn_rate FROM CAPEX_BURN ORDER BY variance DESC' },
]

// ───────── tabs ─────────
type TabId = 'pnl' | 'cash' | 'capex' | 'bal' | 'fcst' | 'ai' | 'wc' | 'tax'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'pnl',   label: 'P&L',                     icon: TrendingUp },
  { id: 'cash',  label: 'Cash & Working Capital',  icon: Wallet },
  { id: 'capex', label: 'CapEx & Projects',        icon: Briefcase },
  { id: 'bal',   label: 'Balance Sheet & Treasury', icon: ShieldCheck },
  { id: 'fcst',  label: 'Forecast & Risk',         icon: Target },
  { id: 'ai',    label: 'AI Finance',              icon: Brain },
  { id: 'wc',   label: 'Working Capital',          icon: ArrowUpRight },
  { id: 'tax',  label: 'Tax & Treasury',           icon: Coins },
]

const ragColor = (r: string) => r === 'Green' || r === 'Pass' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' || r === 'Promise to pay' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const sevColor = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'

export default function FinancePage() {
  const [tab, setTab] = useState<TabId>('pnl')

  const totalDebt = useMemo(() => debtLadder.reduce((s, d) => s + d.amt, 0), [])
  const wAvgMaturityYrs = useMemo(() => {
    const w = debtLadder.reduce((s, d, i) => s + d.amt * (i + 1), 0)
    return totalDebt ? (w / totalDebt).toFixed(1) : '0'
  }, [totalDebt])
  const nearTermDebt = useMemo(() => debtLadder.slice(0, 2).reduce((s, d) => s + d.amt, 0), [])
  const debtPeak = useMemo(() => debtLadder.reduce((m, d) => Math.max(m, d.amt), 0), [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Finance')}
        subtitle={tt('P&L · cash · CapEx · balance sheet · forecast · AI close · May 2026')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Close day {headline.daysToClose} · {headline.closeAuto}% automated
            </span>
          </div>
        }
      />

      <MlInsightSection
        heading={tt('Finance AI — GL anomaly & cash intelligence')}
        models={[
          { name: tt('GL Anomaly Detector'), metric: 'precision 0.91', sub: tt('journal & variance') },
          { name: tt('Cash Forecast (13W)'), metric: 'MAPE 2.1%', sub: tt('weekly rolling') },
          { name: tt('AR Default Risk'), metric: 'AUC 0.88', sub: tt('B2B credit risk') },
        ]}
        agentLabel={tt('Run Finance Radar')} agentRunningLabel={tt('Scanning…')}
        agentSteps={[
          tt('Scanned GL journals for off-plan variances'),
          tt('Updated 13-week cash forecast with actuals'),
          tt('Scored B2B AR book for default probability'),
          tt('Auto-drafted variance commentary for MD&A'),
        ]}
        agentBlurb={tt('Cortex AI detects P&L anomalies, forecasts cash, and flags AR risk — close is faster and surprises are fewer.')}
        decision={{
          title: tt('Address Network OpEx variance before close'),
          detail: tt('Cortex flagged BSD 142K unbudgeted contractor spend in Freeport. Investigate, provision or reclassify before Day 7 close.'),
          impact: tt('protects close timeline and EBITDA accuracy'),
          risk: tt('misclassified spend inflates OpEx vs plan'),
          linkTo: '#/portal/cost', linkLabel: tt('Open Cost Intelligence'),
        }}
        chart={{
          kind: 'bar', title: tt('GL anomaly score by cost centre (top 8)'), xKey: 'cc', unit: 'BSD K',
          data: [
            { cc: 'Freeport Network', spend: 142 }, { cc: 'Content Rights', spend: 84 },
            { cc: 'IT Infrastructure', spend: 63 }, { cc: 'HR Freeport', spend: 41 },
            { cc: 'Abaco Network', spend: 38 }, { cc: 'Nassau Backbone', spend: 27 },
            { cc: 'Facilities', spend: 19 }, { cc: 'Marketing', spend: 14 },
          ],
          series: [{ key: 'spend', name: tt('Anomaly BSD K'), color: '#FF4438' }],
          colorBy: { key: 'spend', high: 100, mid: 50 },
          note: tt('Freeport Network is the largest GL anomaly — unbudgeted contractor invoices.'),
        }}
      />

      <AgentDecision
        title={tt('Working-capital & cash optimiser')}
        label="Run Cash Optimiser"
        runningLabel="Modelling…"
        steps={[
          'Refreshed 13-week rolling cash forecast',
          'Optimised DSO / DPO within policy & supplier terms',
          'Flagged early-pay discounts worth taking',
          'Released trapped working capital to treasury',
        ]}
        hint={tt('Forecast + working-capital levers in one pass — cash is the CFO’s real-time KPI.')}
        result={{
          headline: 'Defend the EBITDA-vs-plan gap with opex & working-capital levers',
          stats: [
            { label: 'MRR', value: 'BSD 49.3M' },
            { label: 'EBITDA', value: 'BSD 18.6M' },
            { label: 'FCF (mo)', value: 'BSD 6.4M' },
            { label: 'Leverage', value: '2.6×' },
          ],
          findings: [
            'Revenue and EBITDA sit modestly below plan.',
            'Tightening DSO, capturing early-pay discounts and holding discretionary opex closes the gap.',
            'No need to touch commercial investment.',
          ],
          note: "Don't cut growth capex to make a quarter.",
        }}
        impact="closes the -1.2% EBITDA-vs-plan gap"
        risk="don't cut growth capex to make a quarter"
        linkTo="#/portal/cost"
        linkLabel="Open Cost Intelligence"
      />

      {/* alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('EBITDA on track · BSD 18.6M (+BSD 0.8M vs plan) · close day 6.2 vs target 5.0')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Cortex anomaly · Network OpEx Freeport +8% MoM · investigate before close ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('BSD 142K unbudgeted contractor')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('leverage 2.6×')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('FCF BSD 6.4M')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open AI →')}</button>
        </div>
      </div>

      {/* tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {/* ═══════ P&L ═══════ */}
      {tab === 'pnl' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('MRR')}          value={`BSD ${headline.mrr}M`}      delta={`+${headline.mrrDelta}% MoM`}     trend="up" icon={Wallet} accent />
          <KpiCard label={tt('ARPU')}         value={`BSD ${headline.arpu}`}      delta={`+BSD ${headline.arpuDelta}`}        trend="up" icon={Coins} />
          <KpiCard label={tt('Gross margin')} value={`${headline.gm}%`}        delta={`+${headline.gmDelta} pp`}        trend="up" icon={TrendingUp} />
          <KpiCard label={tt('EBITDA')}       value={`BSD ${headline.ebitda}M`}   delta={`+${headline.ebitdaDelta}%`}      trend="up" icon={PieIcon} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net income')}     value="BSD 5.1M"   delta="+BSD 0.3M vs plan" trend="up" icon={DollarSign} />
          <KpiCard label={tt('EBITDA margin')}  value="37.7%"   delta="+0.6 pp QoQ"     trend="up" icon={Target} />
          <KpiCard label={tt('OpEx run-rate')}  value="BSD 11.6M / mo" delta="-2% vs plan" trend="up" icon={Activity} />
          <KpiCard label={tt('Bad debt %')}      value="1.2%"   delta="vs 1.5% target"  trend="up" icon={ShieldCheck} />
        </div>

        {/* Revenue & EBITDA split by lane (Fixed vs Mobile vs Convergent) */}
        <Panel title={tt('Revenue & EBITDA by lane — Fixed · Mobile · Convergent')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Mobile + Convergent = 56% of revenue')}</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Lane')}</th><th>{tt('Revenue (BSD M)')}</th><th>{tt('EBITDA (BSD M)')}</th><th>{tt('Margin')}</th><th>{tt('YoY growth')}</th></tr>
            </thead>
            <tbody>
              {REVENUE_BY_LANE.map((l) => (
                <tr key={l.lane} className="border-t border-black/5">
                  <td className="py-2 font-semibold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />{tt(l.lane)}</td>
                  <td className="font-mono text-xs">{l.revenue.toFixed(1)}</td>
                  <td className="font-mono text-xs">{l.ebitda.toFixed(1)}</td>
                  <td className="font-mono text-xs">{l.margin.toFixed(1)}%</td>
                  <td className={`font-bold text-xs ${l.growth >= 5 ? 'text-emerald-600' : l.growth >= 0 ? 'text-vfes-dark' : 'text-red-600'}`}>{l.growth > 0 ? '+' : ''}{l.growth.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="border-t-2 border-vfes-dark/20 font-bold">
                <td className="py-2">{tt('Total')}</td>
                <td className="font-mono text-xs">{REVENUE_BY_LANE.reduce((s,l)=>s+l.revenue,0).toFixed(1)}</td>
                <td className="font-mono text-xs">{REVENUE_BY_LANE.reduce((s,l)=>s+l.ebitda,0).toFixed(1)}</td>
                <td className="font-mono text-xs">{(REVENUE_BY_LANE.reduce((s,l)=>s+l.ebitda,0) / REVENUE_BY_LANE.reduce((s,l)=>s+l.revenue,0) * 100).toFixed(1)}%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Convergent (+18.4%) and Mobile B2B (+12.6%) lead growth. HFC (−2.8%) is the only contracting lane. Mobile + Convergent now contribute 56% of total revenue.')}</div>
        </Panel>

        <Panel title={tt('Income Statement · Plan vs Actual vs PY (BSD M)')}>
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
                {pnl.map((p) => {
                  const varAbs = p.actual - p.plan
                  const varPct = (varAbs / Math.abs(p.plan)) * 100
                  const yoyPct = ((p.actual - p.py) / Math.abs(p.py)) * 100
                  const isHeadline = ['Revenue', 'Gross profit', 'EBITDA', 'EBIT', 'Net income'].includes(p.line)
                  return (
                    <tr key={p.line} className={`border-t border-black/5 ${isHeadline ? 'bg-vfes-red/5' : ''}`}>
                      <td className={`py-2.5 ${isHeadline ? 'font-extrabold' : 'pl-3 text-vfes-dark/75'}`}>{p.line}</td>
                      <td className={`text-right ${p.actual >= 0 ? 'text-vfes-dark' : 'text-vfes-dark/65'} ${isHeadline ? 'font-extrabold' : ''}`}>{p.actual.toFixed(1)}</td>
                      <td className="text-right text-vfes-dark/65">{p.plan.toFixed(1)}</td>
                      <td className={`text-right font-bold ${(p.actual >= p.plan) === (p.actual >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>{varAbs > 0 ? '+' : ''}{varAbs.toFixed(1)}</td>
                      <td className={`text-right text-xs ${(p.actual >= p.plan) === (p.actual >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>{varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%</td>
                      <td className="text-right text-xs text-vfes-dark/65">{p.py.toFixed(1)}</td>
                      <td className={`text-right text-xs ${(p.actual >= p.py) === (p.actual >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>{yoyPct > 0 ? '+' : ''}{yoyPct.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Revenue by Product · 12 mo (BSD M)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={revStacked}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#fef2f2' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="BB" stackId="a" name={tt('Broadband')} fill={RED} />
                    <Bar dataKey="TV" stackId="a" name={tt('TV')} fill={RED2} />
                    <Bar dataKey="Mob" stackId="a" name={tt('Mobile')} fill={RED3} />
                    <Bar dataKey="Bun" stackId="a" name={tt('Bundle premium')} fill={RED4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('EBITDA Walk · YoY (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ebitdaWalk} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="k" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v">
                    {ebitdaWalk.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('ARPU & Subscriber Mix · By Tier')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Tier')}</th>
                  <th className="text-right">{tt('ARPU')}</th>
                  <th className="text-right">{tt('Share')}</th>
                  <th className="text-right">{tt('Churn')}</th>
                  <th>{tt('Trend')}</th>
                </tr>
              </thead>
              <tbody>
                {arpuTier.map((a) => (
                  <tr key={a.tier} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{a.tier}</td>
                    <td className="text-right font-bold">BSD {a.arpu}</td>
                    <td className="text-right">{a.share}%</td>
                    <td className={`text-right ${a.churn > 3 ? 'text-red-600' : a.churn > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{a.churn}%</td>
                    <td className="text-xs">
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
      </>)}

      {/* ═══════ CASH & WORKING CAPITAL ═══════ */}
      {tab === 'cash' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FCF (mo)')}     value={`BSD ${headline.fcf}M`} delta={`+${headline.fcfDelta}% YoY`} trend="up"  icon={DollarSign} accent />
          <KpiCard label={tt('Cash balance')} value={`BSD ${headline.cashBalance}M`} delta="+BSD 146M w/ RCF"        trend="up"  icon={Wallet} />
          <KpiCard label={tt('DSO')}          value={`${headline.dso} d`}        delta="target ≤35"           trend="up"  icon={Calendar} />
          <KpiCard label={tt('CCC')}          value={`${headline.ccc} d`}        delta="negative · healthy"    trend="up"  icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('OCF · CapEx · FCF · 12 mo')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={cashflowMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ocf" name={tt('OCF')} fill="#10b981" />
                    <Bar dataKey="capex" name={tt('CapEx')} fill={RED} />
                    <Line type="monotone" dataKey="fcf" name={tt('FCF')} stroke={DARK} strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Working Capital · Days')}>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{tt('DSO · Receivables')}</span><span className="font-bold">{headline.dso} d</span></div>
                <div className="h-2 bg-black/5 rounded"><div className="h-full bg-vfes-red rounded" style={{ width: `${(headline.dso / 90) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{tt('DPO · Payables')}</span><span className="font-bold">{headline.dpo} d</span></div>
                <div className="h-2 bg-black/5 rounded"><div className="h-full bg-emerald-500 rounded" style={{ width: `${(headline.dpo / 90) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{tt('DIO · Inventory')}</span><span className="font-bold">{headline.dio} d</span></div>
                <div className="h-2 bg-black/5 rounded"><div className="h-full bg-amber-500 rounded" style={{ width: `${(headline.dio / 90) * 100}%` }} /></div>
              </div>
              <div className="pt-3 border-t border-black/5">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{tt('Cash conversion cycle')}</span>
                  <span className="font-extrabold text-emerald-600">{headline.ccc} d</span>
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('Negative CCC = customers pay before suppliers')}</div>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('13-Week Rolling Cash Forecast')}>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={cash13wk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="inflow" name={tt('Inflow BSD M')} fill="#10b981" />
                <Bar yAxisId="l" dataKey="outflow" name={tt('Outflow BSD M')} fill={RED} />
                <Line yAxisId="r" type="monotone" dataKey="balance" name={tt('Cash balance BSD M')} stroke={DARK} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mb-6 mt-6">
          <Panel title={tt('AR Aging (BSD M)')}>
            <div className="space-y-3">
              {arAging.map((a) => (
                <div key={a.bucket} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-vfes-dark/70 font-semibold">{a.bucket}</div>
                  <div className="flex-1 h-8 bg-[#f3f4f7] rounded-lg overflow-hidden border border-black/5">
                    <div className="h-full" style={{ width: `${(a.amt / 14.2) * 100}%`, background: a.color }} />
                  </div>
                  <div className="w-20 text-right font-semibold">BSD {a.amt}M</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Top Overdue B2B AR')}>
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
                      <td className="py-2.5 font-semibold text-xs">{a.acc}</td>
                      <td className="text-right font-bold">BSD {a.amt}K</td>
                      <td className={`text-right ${a.dso > 60 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>{a.dso} d</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(a.status)}`}>{tt(a.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Top Suppliers · AP')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Supplier')}</th>
                  <th className="text-right">{tt('Q spend')}</th>
                  <th className="text-right">{tt('DPO')}</th>
                  <th>{tt('Risk')}</th>
                </tr>
              </thead>
              <tbody>
                {apTopSuppliers.map((s) => (
                  <tr key={s.sup} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{s.sup}</td>
                    <td className="text-right font-bold">BSD {s.spendQ}M</td>
                    <td className="text-right">{s.dpo} d</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(s.risk)}`}>{s.risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ CAPEX & PROJECTS ═══════ */}
      {tab === 'capex' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CapEx YTD')}        value={`BSD ${headline.capexYTD}M`}  delta={`${Math.round(headline.capexYTD/headline.capexPlan*100)}% of plan`} trend="flat" icon={Briefcase} accent />
          <KpiCard label={tt('CapEx intensity')}  value="20.4%"                     delta="of revenue · target ≤22%" trend="up" icon={Target} />
          <KpiCard label={tt('Programmes active')} value={`${capexProgrammes.length}`} delta="3 Green · 3 Amber"   trend="up" icon={GitBranch} />
          <KpiCard label={tt('Avg IRR')}          value="17.7%"                     delta="WACC 8.4%"               trend="up" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('CapEx by Category · YTD (BSD M)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={capexByCat} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                    <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="v">
                      {capexByCat.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Build vs Maintenance')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={capexBuildVsMaintain} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {capexBuildVsMaintain.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Build-heavy · growth phase')}</div>
          </Panel>
        </div>

        <Panel title={tt('Programme Portfolio · NPV / IRR / Payback')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Programme')}</th>
                  <th className="text-right">{tt('CapEx')}</th>
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
                    <td className="text-right font-bold">BSD {p.capex}M</td>
                    <td className="text-right text-emerald-600 font-bold">BSD {p.npv}M</td>
                    <td className={`text-right font-bold ${p.irr >= 18 ? 'text-emerald-600' : p.irr >= 12 ? 'text-amber-600' : 'text-red-600'}`}>{p.irr}%</td>
                    <td className="text-xs">{p.payback}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(p.rag)}`}>{p.rag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">Approved-not-spent: <span className="font-bold">{tt('BSD 42M')}</span>{tt('· slippage tracker open')}</div>
        </Panel>
      </>)}

      {/* ═══════ BALANCE SHEET & TREASURY ═══════ */}
      {tab === 'bal' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net debt')}     value={`BSD ${headline.netDebt}M`} delta={`${headline.leverage}× leverage`} trend="flat" icon={Wallet} accent />
          <KpiCard label={tt('Liquidity')}    value="BSD 146M"                    delta="cash + BSD 62M RCF"                   trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Avg cost of debt')} value="4.8%"                  delta="-30 bps refi"                      trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('Covenants passing')} value={`${covenants.filter(c => c.status==='Pass').length} / ${covenants.length}`} delta="all green" trend="up" icon={Award} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Debt Maturity Ladder (BSD M)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={debtLadder}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="y" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="amt" fill={RED} name={tt('BSD M')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">Total debt <span className="font-bold text-vfes-dark">BSD {totalDebt}M</span>{tt('· weighted maturity 4.2 yr')}</div>
            </Panel>
          </div>

          <Panel title={tt('Covenants · Headroom')}>
            <div className="space-y-2">
              {covenants.map((c) => (
                <div key={c.c} className="border-b border-black/5 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-xs">{c.c}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(c.status)}`}>{tt(c.status)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-vfes-dark/65">
                    <span>target {c.target}</span>
                    <span>·</span>
                    <span>actual <span className="font-bold text-vfes-dark">{c.actual}</span></span>
                    <span className="ml-auto">headroom <span className="font-bold text-emerald-600">{c.headroom}</span></span>
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
                {fxIrHedges.map((h) => (
                  <tr key={h.instr} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{h.instr}</td>
                    <td className="text-right font-bold">BSD {h.notional}M</td>
                    <td className="text-xs">{h.expiry}</td>
                    <td className={`text-right font-bold ${h.mtm >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{h.mtm > 0 ? '+' : ''}BSD {h.mtm}M</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-emerald-100 text-emerald-700">{tt(h.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ FORECAST & RISK ═══════ */}
      {tab === 'fcst' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EBITDA forecast Q4')} value="BSD 21.4M" delta="+BSD 0.4M vs plan" trend="up" icon={Target} accent />
          <KpiCard label={tt('Forecast accuracy')}  value="98.9%"  delta="last 4 Q · MAPE 1.1%" trend="up" icon={Award} />
          <KpiCard label={tt('Risk register')}       value={`${riskRegister.length}`} delta={`${riskRegister.filter(r => r.sev === 'High').length} high-sev`} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('ARPU sensitivity')}    value="±BSD 4.4M" delta="EBITDA per ±5% ARPU" trend="flat" icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('EBITDA Forecast · 12 mo (Optimistic / Commit / Low)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={ebitdaForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="best" name={tt('Best case')} stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="commit" name={tt('Commit')} stroke={RED} fill={RED} fillOpacity={0.25} />
                    <Area type="monotone" dataKey="low" name={tt('Low')} stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="plan" name={tt('Plan')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Forecast Accuracy · Last 4 Q')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">Q</th>
                    <th className="text-right">{tt('Forecast')}</th>
                    <th className="text-right">{tt('Actual')}</th>
                    <th className="text-right">{tt('MAPE')}</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastAccuracy.map((f) => (
                    <tr key={f.q} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{f.q}</td>
                      <td className="text-right">BSD {f.forecast}M</td>
                      <td className="text-right font-bold">BSD {f.actual}M</td>
                      <td className={`text-right ${f.var <= 1 ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>{f.var}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Avg MAPE 0.8% · best-in-class')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Sensitivity · EBITDA (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sensitivities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="driver" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine x={0} stroke={DARK} />
                  <Bar dataKey="upside" name={tt('Upside')} fill="#10b981" />
                  <Bar dataKey="downside" name={tt('Downside')} fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Risk Register')}>
            <div className="space-y-2">
              {riskRegister.map((r, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(r.sev)}`}>{r.sev}</span>
                    <span className="text-[10px] text-vfes-dark/55">prob {r.prob}</span>
                    <span className="text-[10px] font-bold text-vfes-dark ml-auto">{r.impact}</span>
                  </div>
                  <div className="font-semibold text-xs">{r.r}</div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">Mitigation: {r.mit}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ AI FINANCE ═══════ */}
      {tab === 'ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Days to close')}          value={`${headline.daysToClose}`} delta={`target 5.0 · ${headline.closeAuto}% auto`} trend="up" icon={Calendar} accent />
          <KpiCard label={tt('GL anomalies (30d)')}      value="84"       delta="auto-flagged"             trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Forecast cash MAPE')}      value="2.1%"     delta="13-week"                  trend="up"   icon={Target} />
          <KpiCard label={tt('MD&A auto-drafted')}        value="92%"      delta="reviewed by FP&A"         trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Anomaly Queue · Cortex AI')}>
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm border-b border-black/5 pb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(a.sev)} shrink-0`}>{a.sev}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-xs">{a.what}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5">{a.when} · est. impact <span className="font-bold text-vfes-dark">{a.delta}</span></div>
                  </div>
                  <button className="text-[10px] font-bold text-vfes-dark hover:underline shrink-0">{tt('Investigate →')}</button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Continuous Close · Workflow')}>
            <div className="space-y-2">
              {[
                { step: 'GL imports & subledger reconciliations', auto: 100, status: 'Pass' },
                { step: 'Bank reconciliation',                     auto: 96,  status: 'Pass' },
                { step: 'Accruals · auto-suggested',                auto: 84,  status: 'Pass' },
                { step: 'Intercompany matching',                    auto: 72,  status: 'Watch' },
                { step: 'Tax provisioning',                        auto: 58,  status: 'Pass' },
                { step: 'Variance analysis · MD&A draft',          auto: 92,  status: 'Pass' },
                { step: 'Board pack assembly',                      auto: 64,  status: 'Pass' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="flex-1 text-xs">{s.step}</div>
                  <div className="w-24 h-1.5 bg-black/5 rounded">
                    <div className={`h-full rounded ${s.auto >= 80 ? 'bg-emerald-500' : s.auto >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.auto}%` }} />
                  </div>
                  <div className="w-10 text-right text-xs font-bold">{s.auto}%</div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(s.status)}`}>{tt(s.status)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · Finance Prompts')}>
              <div className="space-y-2">
                {cortexPrompts.map((p, i) => (
                  <div key={i} className="border border-black/5 rounded-lg p-3 hover:bg-black/[0.02] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.q}</div>
                        <code className="text-[10px] text-vfes-dark/55 font-mono mt-1 block">{p.sql}</code>
                      </div>
                      <Send className="w-3.5 h-3.5 text-vfes-dark/30 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('FINANCE_360')}</span>{tt('· GL-grounded')}</div>
            </Panel>
          </div>

          <Panel title={tt('Model Card · Finance AI')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('GL anomaly model')}</span><span className="font-mono text-xs">{tt('FIN_GL_ANOM_V2_4')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Cash forecast')}</span><span className="font-mono text-xs">{tt('CASH_FCST_13W')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('AR default risk')}</span><span className="font-mono text-xs">{tt('AR_DEFAULT_V1_8')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('MD&A drafter')}</span><span className="font-mono text-xs">{tt('MDNA_LLM_V1_2')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Audit retention')}</span><span className="font-bold">{tt('7 years')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('SOX-equivalent')}</span><span className="font-bold text-emerald-600">{tt('Approved')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('All AI outputs human-reviewed before close')}</div>
          </Panel>
        </div>
      </>)}
      {tab === 'wc'  && <WorkingCapitalTab />}
      {tab === 'tax' && <TaxTreasuryTab />}

      {/* ── Related cockpits ── */}
      <Panel title={tt('Related cockpits')}>
        <p className="text-xs text-vfes-dark/55 mb-3">{tt('Jump to related financial and operational cockpits.')}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/portal/capital-treasury" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><ArrowUpRight className="w-3.5 h-3.5" />{tt('Capital & Treasury')}</Link>
          <Link to="/portal/revenue-assurance" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><TrendingUp className="w-3.5 h-3.5" />{tt('Revenue Assurance')}</Link>
          <Link to="/portal/debt-collections" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Coins className="w-3.5 h-3.5" />{tt('Debt Collections')}</Link>
          <Link to="/portal/billing-charging" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Wallet className="w-3.5 h-3.5" />{tt('Billing & Charging')}</Link>
          <Link to="/portal/procurement" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Briefcase className="w-3.5 h-3.5" />{tt('Procurement')}</Link>
          <Link to="/portal/cost" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Activity className="w-3.5 h-3.5" />{tt('Cost Intelligence')}</Link>
          <Link to="/portal/cfo" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Trophy className="w-3.5 h-3.5" />{tt('CFO Dashboard')}</Link>
          <Link to="/portal/investor-relations" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Globe className="w-3.5 h-3.5" />{tt('Investor Relations')}</Link>
          <Link to="/portal/b2b" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Users className="w-3.5 h-3.5" />{tt('B2B')}</Link>
          <Link to="/portal/regulatory" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><ShieldCheck className="w-3.5 h-3.5" />{tt('Regulatory')}</Link>
          <Link to="/portal/ai-insights" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Brain className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
        </div>
      </Panel>

    </div>
  )
}

// ═══════ WORKING CAPITAL ═══════
function WorkingCapitalTab() {
  const wcData = [
    { m: 'Jun', dso: 38, dpo: 58, ccc: -20 },
    { m: 'Jul', dso: 36, dpo: 60, ccc: -24 },
    { m: 'Aug', dso: 35, dpo: 62, ccc: -27 },
    { m: 'Sep', dso: 34, dpo: 63, ccc: -29 },
    { m: 'Oct', dso: 33, dpo: 64, ccc: -31 },
    { m: 'Nov', dso: 33, dpo: 64, ccc: -31 },
    { m: 'Dec', dso: 32, dpo: 64, ccc: -32 },
    { m: 'Jan', dso: 32, dpo: 65, ccc: -33 },
    { m: 'Feb', dso: 32, dpo: 65, ccc: -33 },
    { m: 'Mar', dso: 31, dpo: 66, ccc: -35 },
    { m: 'Apr', dso: 31, dpo: 66, ccc: -35 },
    { m: 'May', dso: 32, dpo: 64, ccc: -32 },
  ]
  const wcLevers = [
    { lever: tt('E-invoicing adoption'),          impact: 'BSD 2.4M', status: 'Active' },
    { lever: tt('Dynamic discounting'),           impact: 'BSD 1.1M', status: 'Active' },
    { lever: tt('Supply chain finance (SCF)'),    impact: 'BSD 3.2M', status: 'Pilot' },
    { lever: tt('DPO extension · tail vendors'), impact: 'BSD 0.8M', status: 'In progress' },
    { lever: tt('AR factoring (B2B)'),            impact: 'BSD 1.6M', status: 'Review' },
  ]
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('DSO')}  value="32 d"  delta={tt('target ≤35')}         trend="up"   icon={Calendar} accent />
        <KpiCard label={tt('DPO')}  value="64 d"  delta={tt('target ≥60')}         trend="up"   icon={Coins} />
        <KpiCard label={tt('DIO')}  value="14 d"  delta={tt('best-in-class')}      trend="up"   icon={Activity} />
        <KpiCard label={tt('CCC')}  value="-32 d" delta={tt('negative · healthy')} trend="up"   icon={ArrowUpRight} />
      </div>
      <Panel title={tt('Working-capital KPI trend (12 mo)')}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={wcData}>
            <CartesianGrid stroke="#eef0f3" />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="dso" stroke={RED} strokeWidth={2} name={tt('DSO (days)')} dot={{ r: 2 }} />
            <Line dataKey="dpo" stroke="#10b981" strokeWidth={2} name={tt('DPO (days)')} dot={{ r: 2 }} />
            <Line dataKey="ccc" stroke="#f59e0b" strokeWidth={2} name={tt('CCC (days)')} strokeDasharray="4 2" dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={tt('Working-capital improvement levers')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Lever')}</th><th>{tt('Cash impact')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {wcLevers.map((l) => (
              <tr key={l.lever} className="border-t border-black/5">
                <td className="py-2.5 font-semibold">{l.lever}</td>
                <td className="font-bold text-emerald-600">{l.impact}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${l.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : l.status === 'Pilot' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ═══════ TAX & TREASURY ═══════
function TaxTreasuryTab() {
  const taxSchedule = [
    { item: tt('Corporate income tax (CIT)'),      amount: 4.8, due: 'Jul 2026',  status: 'Filed' },
    { item: tt('VAT monthly settlement'),           amount: 2.1, due: 'Monthly',   status: 'Current' },
    { item: tt('Transfer pricing documentation'),   amount: 0,   due: 'Oct 2026',  status: 'In progress' },
    { item: tt('Country-by-country report'),        amount: 0,   due: 'Dec 2026',  status: 'Planned' },
    { item: tt('BEIR Pillar Two (15% GloBE)'),      amount: 1.2, due: 'Mar 2027',  status: 'Assessment' },
  ]
  const liquidityFacilities = [
    { fac: tt('Revolving credit facility'), limit: 62, drawn: 0,  expiry: 'Dec 2028', cost: '3M BSDIBOR + 1.6%' },
    { fac: tt('Bilateral term loan A'),     limit: 24, drawn: 24, expiry: 'Jun 2026', cost: '3M BSDIBOR + 1.8%' },
    { fac: tt('Bilateral term loan B'),     limit: 32, drawn: 32, expiry: 'Mar 2030', cost: 'Fixed 4.2%' },
    { fac: tt('Commercial paper'),          limit: 20, drawn: 0,  expiry: 'Rolling',  cost: '3M T-bill + 0.4%' },
  ]
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('ETR (effective tax rate)')} value="19.2%"  delta={tt('vs 21% illustrative')} trend="up"   icon={ShieldCheck} accent />
        <KpiCard label={tt('Tax provisions')}           value="BSD 4.8M"  delta={tt('CIT accrual')}      trend="flat" icon={Coins} />
        <KpiCard label={tt('Transfer pricing risk')}    value={tt('Low')} delta={tt('documented')}   trend="up"   icon={Globe} />
        <KpiCard label={tt('Pillar Two exposure')}      value="BSD 1.2M"  delta={tt('GloBE assessment')} trend="flat" icon={AlertTriangle} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Tax calendar & obligations')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Obligation')}</th><th>{tt('BSD M')}</th><th>{tt('Due')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {taxSchedule.map((t) => (
                <tr key={t.item} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold text-xs">{t.item}</td>
                  <td className="font-bold">{t.amount > 0 ? `BSD ${t.amount}M` : '—'}</td>
                  <td className="text-xs text-vfes-dark/60">{t.due}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${t.status === 'Filed' || t.status === 'Current' ? 'bg-emerald-50 text-emerald-700' : t.status === 'In progress' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-700'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Liquidity facilities')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Facility')}</th><th>{tt('Limit BSD M')}</th><th>{tt('Drawn BSD M')}</th><th>{tt('Expiry')}</th><th>{tt('Cost')}</th></tr>
            </thead>
            <tbody>
              {liquidityFacilities.map((f) => (
                <tr key={f.fac} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold text-xs">{f.fac}</td>
                  <td className="font-bold">BSD {f.limit}M</td>
                  <td className={f.drawn > 0 ? 'font-bold text-amber-600' : 'text-emerald-600'}>BSD {f.drawn}M</td>
                  <td className="text-xs text-vfes-dark/60">{f.expiry}</td>
                  <td className="text-xs text-vfes-dark/55">{f.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Panel title={tt('Treasury hedging position — MtM summary')}>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: tt('IRS notional (floating→fixed)'), value: 'BSD 84M', sub: tt('Dec 2028 · MtM +BSD 1.8M') },
            { label: tt('Content licences paid in USD'),       value: 'BSD 12M', sub: tt('1:1 peg · no FX hedge required') },
            { label: tt('Energy hedge · electricity'),   value: 'BSD 4.2M', sub: tt('Dec 2026 · MtM +BSD 0.2M') },
          ].map((h) => (
            <div key={h.label} className="p-3 rounded-lg bg-zinc-50 border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{h.label}</div>
              <div className="text-xl font-extrabold mt-1 text-vfes-dark">{h.value}</div>
              <div className="text-xs text-vfes-dark/55 mt-0.5">{h.sub}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
