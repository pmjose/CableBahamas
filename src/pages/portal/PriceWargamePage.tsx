import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Swords, TrendingDown, TrendingUp, Brain, ChevronRight, Target,
  BarChart2, AlertTriangle, Activity, Zap,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine,
  PieChart, Pie, ScatterChart, Scatter, ZAxis,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'

const COMPETITORS = ['BTC', 'Rival ISP A', 'Rival ISP B', 'Rival ISP C']
type Response = 'hold' | 'match' | 'beat'

function simulate(competitor: string, cut: number, response: Response) {
  const base = { adds: 41.2, churnK: 38.0, arpu: 25 }
  const aggression = competitor === 'Rival ISP B' ? 1.4 : competitor === 'Rival ISP C' ? 1.2 : 1.0
  const threat = (cut / 5) * aggression
  let addsDelta = -threat * 3.1
  let churnDelta = threat * 2.4
  let arpuDelta = 0
  if (response === 'match') { addsDelta = -threat * 0.8; churnDelta = threat * 0.7; arpuDelta = -(cut * 0.6) }
  if (response === 'beat')  { addsDelta = threat * 1.6; churnDelta = -threat * 0.4; arpuDelta = -(cut * 1.1) }
  const adds = base.adds + addsDelta
  const churnK = base.churnK + churnDelta
  const netK = adds - churnK
  const marginPct = 0.42
  const acqValue = netK * 1000 * (base.arpu + arpuDelta) * 12 * marginPct / 1e6
  const baseErosion = (arpuDelta) * 14_660_000 * 12 * marginPct / 1e6
  const ebitda = acqValue + baseErosion
  return { adds, churnK, netK, arpuDelta, ebitda }
}

const RESPONSES: { id: Response; label: string; desc: string }[] = [
  { id: 'hold',  label: 'Hold',  desc: 'No price change — defend on value/network' },
  { id: 'match', label: 'Match', desc: 'Match the competitor cut on like-for-like tiers' },
  { id: 'beat',  label: 'Beat',  desc: 'Undercut to defend share aggressively' },
]

// ─── Price elasticity by tier ─────────────────────────────────────────────────────
const ELASTICITY = [
  { tier: '1Gb fibre',   acq: -1.5, churn: 0.65 },
  { tier: '600Mb',       acq: -1.8, churn: 0.80 },
  { tier: 'Unlimited 5G',acq: -1.3, churn: 0.50 },
  { tier: 'Convergent',  acq: -1.4, churn: 0.60 },
  { tier: 'SME bundle',  acq: -0.9, churn: 0.40 },
]

// ─── Game tree payoffs ──────────────────────────────────────────────────────────
const GAME_TREE = [
  { node: 'BTC cut / Hold',   ebitda: -1.8, share: -0.4, arpu:  0.0 },
  { node: 'BTC cut / Match',  ebitda: -4.2, share:  0.2, arpu: -3.0 },
  { node: 'BTC cut / Beat',   ebitda: -7.1, share:  1.4, arpu: -5.5 },
  { node: 'Rival ISP B cut / Hold',       ebitda: -5.4, share: -1.8, arpu:  0.0 },
  { node: 'Rival ISP B cut / Match',      ebitda: -3.1, share:  0.6, arpu: -3.5 },
  { node: 'Rival ISP B cut / Beat',       ebitda: -8.9, share:  2.1, arpu: -6.2 },
]

// ─── Share / margin outcome matrix ───────────────────────────────────────────────
const MATRIX_DATA = [
  { cut: 'BSD 2',  hold: -0.8, match: -1.2, beat: -2.1 },
  { cut: 'BSD 5',  hold: -1.8, match: -2.4, beat: -4.2 },
  { cut: 'BSD 8',  hold: -3.2, match: -3.8, beat: -6.1 },
  { cut: 'BSD 10', hold: -4.8, match: -5.2, beat: -8.4 },
  { cut: 'BSD 15', hold: -7.4, match: -7.8, beat: -12.1 },
]

// ─── Historical competitor price moves ───────────────────────────────────────────
const PRICE_HISTORY = [
  { mo: 'Jun', btc: 36.2, orange: 34.8, voo: 24.1, digi: 16.4, cablebahamas: 38.5 },
  { mo: 'Jul', btc: 36.2, orange: 34.8, voo: 24.1, digi: 16.2, cablebahamas: 38.5 },
  { mo: 'Aug', btc: 35.8, orange: 34.2, voo: 23.8, digi: 15.9, cablebahamas: 38.0 },
  { mo: 'Sep', btc: 35.4, orange: 33.8, voo: 23.8, digi: 15.6, cablebahamas: 38.0 },
  { mo: 'Oct', btc: 35.4, orange: 33.8, voo: 23.4, digi: 15.4, cablebahamas: 37.8 },
  { mo: 'Nov', btc: 34.8, orange: 33.4, voo: 22.9, digi: 14.8, cablebahamas: 37.5 },
]

// ─── Market share trend ─────────────────────────────────────────────────────────
const SHARE_TREND = [
  { mo: 'Jun', cablebahamas: 28.2, btc: 26.4, orange: 22.1, voo: 14.8, digi: 8.5 },
  { mo: 'Jul', cablebahamas: 28.1, btc: 26.3, orange: 22.0, voo: 14.9, digi: 8.7 },
  { mo: 'Aug', cablebahamas: 28.0, btc: 26.1, orange: 21.9, voo: 14.8, digi: 9.2 },
  { mo: 'Sep', cablebahamas: 27.9, btc: 25.9, orange: 21.8, voo: 14.9, digi: 9.5 },
  { mo: 'Oct', cablebahamas: 27.8, btc: 25.8, orange: 21.6, voo: 15.0, digi: 9.8 },
  { mo: 'Nov', cablebahamas: 27.6, btc: 25.6, orange: 21.5, voo: 15.1, digi: 10.2 },
]

// ─── Competitive intelligence register ───────────────────────────────────────────
const COMP_INTEL = [
  { competitor: 'BTC',  move: 'BSD -2 on 1Gb fibre',         probability: 40, timeframe: 'Q1-27', threat: 'Med', tier: 'Premium' },
  { competitor: 'Rival ISP A',    move: 'BSD -3 on unlimited 5G',       probability: 28, timeframe: 'Q1-27', threat: 'Med', tier: 'Premium' },
  { competitor: 'Rival ISP B',  move: 'BSD -5 on entry mobile',      probability: 62, timeframe: 'Jul-26', threat: 'High', tier: 'Value'   },
  { competitor: 'Rival ISP B',      move: 'BSD -4 on SIM-only entry',     probability: 74, timeframe: 'Jul-26', threat: 'High', tier: 'Low-cost' },
  { competitor: 'Rival ISP B',  move: 'BSD -2 convergent bundle',    probability: 35, timeframe: 'Q2-27', threat: 'Low',  tier: 'Value'   },
  { competitor: 'Rival ISP B',      move: 'New convergent launch',     probability: 22, timeframe: 'Q2-27', threat: 'Med',  tier: 'Low-cost' },
]

// ─── Tier sensitivity ─────────────────────────────────────────────────────────────
const TIER_SENS = [
  { tier: '1Gb fibre',    price: 32.0, premium: 14.0, custK: 580, churnPct: 5.2 },
  { tier: '600Mb',        price: 24.0, premium:  6.0, custK: 840, churnPct: 7.8 },
  { tier: 'Unlimited 5G', price: 28.0, premium: 10.0, custK: 420, churnPct: 4.8 },
  { tier: 'Convergent',   price: 64.0, premium: 18.0, custK: 310, churnPct: 3.4 },
  { tier: 'SME bundle',   price: 88.0, premium: 24.0, custK: 128, churnPct: 2.8 },
]

type TabId = 'simulator' | 'elasticity' | 'gametree' | 'matrix' | 'history' | 'share' | 'intel' | 'tiers'
const TABS: { id: TabId; label: string }[] = [
  { id: 'simulator',  label: 'War-game Simulator' },
  { id: 'elasticity', label: 'Price Elasticity'   },
  { id: 'gametree',   label: 'Game Tree'          },
  { id: 'matrix',     label: 'Payoff Matrix'      },
  { id: 'history',    label: 'Price History'      },
  { id: 'share',      label: 'Market Share'       },
  { id: 'intel',      label: 'Competitor Intel'   },
  { id: 'tiers',      label: 'Tier Sensitivity'   },
]

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

export default function PriceWargamePage() {
  const { i18n } = useTranslation()

  // ─── Hooks ───────────────────────────────────────────────────────────────
  const [tab, setTab]           = useState<TabId>('simulator')
  const [competitor, setCompetitor] = useState('BTC')
  const [cut, setCut]           = useState(5)
  const [response, setResponse] = useState<Response>('hold')
  const [tierFilter, setTierFilter] = useState<'All' | '1Gb fibre' | '600Mb' | 'Unlimited 5G' | 'Convergent'>('All')
  const [intelFilter, setIntelFilter] = useState<'All' | 'High' | 'Med' | 'Low'>('All')
  const [shareMetric, setShareMetric] = useState<'value' | 'revenue'>('value')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const result = simulate(competitor, cut, response)
  const allScenarios = RESPONSES.map(r => ({
    name: tt(r.label),
    ebitda: +simulate(competitor, cut, r.id).ebitda.toFixed(1),
  }))
  const bestResponse = allScenarios.reduce((a, b) => (b.ebitda > a.ebitda ? b : a))

  const filteredIntel = useMemo(
    () => intelFilter === 'All' ? COMP_INTEL : COMP_INTEL.filter(c => c.threat === intelFilter),
    [intelFilter],
  )

  const filteredElasticity = useMemo(
    () => tierFilter === 'All' ? ELASTICITY : ELASTICITY.filter(e => e.tier === tierFilter),
    [tierFilter],
  )

  const shareScenarios = useMemo(
    () => RESPONSES.map(r => ({
      name: tt(r.label),
      netK: +simulate(competitor, cut, r.id).netK.toFixed(1),
      ebitda: +simulate(competitor, cut, r.id).ebitda.toFixed(1),
      arpu: +simulate(competitor, cut, r.id).arpuDelta.toFixed(1),
    })),
    [competitor, cut],
  )

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Competitive Price-Response War-game')}
        subtitle={tt('Competitor price moves · elasticity scenarios · response simulator · share/margin outcomes · game-tree')}
        actions={
          <div className="flex items-center gap-2">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{tt('Scenario model')}</span>
            {liveTime && <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">{liveTime}</span>}
          </div>
        }
      />

      {/* ── ML Insight Section ─────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Price intelligence"
        models={[
          { name: 'Price Elasticity Model',  metric: 'R² 0.84', sub: 'acquisition & churn elasticity by tier' },
          { name: 'War-game EBITDA Sim',     metric: '±2.1% err', sub: 'scenario EBITDA vs actual outcomes' },
          { name: 'Share Shift Predictor',   metric: 'AUC 0.81', sub: '4-week forward share movement' },
        ]}
        agentLabel={tt('Run War-game')}
        agentRunningLabel={tt('Simulating…')}
        agentSteps={[
          tt('Simulated all competitor moves across tiers and cut amounts'),
          tt('Modelled net adds, ARPU erosion and EBITDA for each response strategy'),
          tt('Separated low-cost threats (Rival ISP B/Rival ISP B) from premium-tier threats'),
          tt('Selected the EBITDA-optimal response for the current parameter set'),
        ]}
        agentBlurb={tt('Price wars destroy industry ARPU. The war-game surfaces the response that protects the most EBITDA — which is not always the most aggressive counter-move.')}
        decision={{
          title:   tt('Respond on value for BTC/Rival ISP A; match entry tier only for Rival ISP B/Rival ISP B'),
          detail:  tt('For premium competitor moves, holding and defending on network/convergent quality protects base ARPU. Matching a BTC BSD 5 cut erodes BSD 73M/yr EBITDA on the base. Only Rival ISP B/Rival ISP B entry-tier moves warrant a targeted match on the elastic 600Mb tier.'),
          impact:  tt('protects base ARPU vs reflexive price war · +BSD 40M vs match strategy'),
          risk:    tt('share loss if a low-cost move is left unanswered on the entry tier'),
          linkTo:  '#/portal/pricing-simulator',
          linkLabel: tt('Open Pricing Simulator'),
        }}
        chart={{
          kind: 'bar',
          title: tt('EBITDA impact by response (BSD M/yr) — current scenario'),
          xKey: 'name',
          unit: 'M',
          data: allScenarios,
          series: [{ key: 'ebitda', name: tt('EBITDA BSD M/yr'), color: BLUE }],
          colorBy: { key: 'ebitda', high: -3.0, mid: -0.5 },
          note: tt('Negative EBITDA = cost of the response. Best strategy minimises the negative impact.'),
        }}
      />

      {/* ── Alert ─────────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Rival ISP B price move probability 74% by Jul-26 · Rival ISP B entry-tier move 62% · combined share erosion risk')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Recommended response: pre-emptive value reinforcement on 600Mb tier. Do not match headline price — respond on quality and convergent stickiness.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/pricing-simulator" className="text-xs font-bold text-amber-900 hover:underline">{tt('Simulator →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Net adds / mo (scenario)')}  value={`${result.netK >= 0 ? '+' : ''}${result.netK.toFixed(1)}K`}  delta={tt('vs +3.2K baseline')} trend={result.netK >= 3.2 ? 'up' : 'down'} icon={result.netK >= 3.2 ? TrendingUp : TrendingDown} accent />
        <KpiCard label={tt('ARPU impact')}                value={`BSD ${result.arpuDelta.toFixed(1)}`}                               delta={tt('per sub / mo')}     trend={result.arpuDelta >= 0 ? 'flat' : 'down'}  icon={TrendingDown} />
        <KpiCard label={tt('EBITDA impact / yr')}         value={`BSD ${result.ebitda.toFixed(1)}M`}                                delta={tt('net of base erosion')} trend={result.ebitda >= 0 ? 'up' : 'down'}  icon={Swords}       />
        <KpiCard label={tt('EBITDA-optimal move')}        value={bestResponse.name}                                              delta={tt('highest EBITDA')}   trend="up"                                  icon={Brain}        />
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
            }`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══ SIMULATOR ════════════════════════════════════════════════════════ */}
      {tab === 'simulator' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Gross adds (scenario)')} value={`${result.adds.toFixed(1)}K`}  delta={tt('vs 41.2K base')}     trend={result.adds >= 41.2 ? 'up' : 'down'} icon={TrendingUp}  accent />
          <KpiCard label={tt('Churn (scenario)')}      value={`${result.churnK.toFixed(1)}K`} delta={tt('vs 38.0K base')}    trend={result.churnK <= 38.0 ? 'up' : 'down'} icon={TrendingDown} />
          <KpiCard label={tt('ARPU erosion')}           value={`BSD ${result.arpuDelta.toFixed(1)}`} delta={tt('per sub / mo')} trend={result.arpuDelta >= 0 ? 'flat' : 'down'} icon={Zap} />
          <KpiCard label={tt('Recommended response')}  value={bestResponse.name}              delta={`BSD ${bestResponse.ebitda}M/yr`} trend="up"                        icon={Target}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('War-game controls')}>
            <div className="space-y-5 mt-2">
              <div>
                <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Competitor making the move')}</div>
                <div className="flex flex-wrap gap-2">
                  {COMPETITORS.map(c => (
                    <button key={c} onClick={() => setCompetitor(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                        competitor === c ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'bg-white text-vfes-dark/70 border-black/10 hover:bg-black/5'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('Their price cut')}</span>
                  <span className="font-mono font-bold">BSD {cut}</span>
                </div>
                <input type="range" min={2} max={15} step={1} value={cut} onChange={e => setCut(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Our response')}</div>
                <div className="space-y-2">
                  {RESPONSES.map(r => (
                    <button key={r.id} onClick={() => setResponse(r.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        response === r.id ? 'bg-vfes-red/5 border-vfes-red/40' : 'bg-white border-black/10 hover:bg-black/5'
                      }`}>
                      <div className="text-sm font-semibold">{tt(r.label)}</div>
                      <div className="text-[11px] text-vfes-dark/55">{tt(r.desc)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title={tt('EBITDA impact by response (BSD M/yr)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={allScenarios}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`BSD ${v}M`, tt('EBITDA')]} />
                  <Bar dataKey="ebitda" radius={[6, 6, 0, 0]}>
                    {allScenarios.map((s, i) => <Cell key={i} fill={s.ebitda >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Best modelled response')}: <span className="font-bold">{bestResponse.name}</span> (BSD {bestResponse.ebitda}M/yr)
              <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {shareScenarios.map(s => (
            <div key={s.name} className="rounded-xl border border-black/5 bg-white p-4">
              <div className="text-xs uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Response')}: <span className="font-bold text-vfes-dark">{s.name}</span></div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-extrabold" style={{ color: s.netK >= 3.2 ? GREEN : RED }}>{s.netK >= 0 ? '+' : ''}{s.netK}K</div>
                  <div className="text-[10px] text-vfes-dark/55">{tt('Net adds')}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold" style={{ color: s.ebitda >= 0 ? GREEN : RED }}>BSD {s.ebitda}M</div>
                  <div className="text-[10px] text-vfes-dark/55">{tt('EBITDA/yr')}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold" style={{ color: s.arpu >= 0 ? GREEN : RED }}>BSD {s.arpu}</div>
                  <div className="text-[10px] text-vfes-dark/55">{tt('ARPU Δ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/pricing-simulator"   className="font-bold text-vfes-dark hover:underline">{tt('Open Pricing Simulator →')}</Link>
          <Link to="/portal/promotions"          className="font-bold text-vfes-dark hover:underline">{tt('Promotions →')}</Link>
          <Link to="/portal/bundle-profitability" className="font-bold text-vfes-dark hover:underline">{tt('Bundle Profitability →')}</Link>
        </div>
      </>)}

      {/* ══ ELASTICITY ═══════════════════════════════════════════════════════ */}
      {tab === 'elasticity' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Most elastic tier')}   value="600Mb"       delta={tt('acq -1.8 per BSD 1 cut')}    trend="down" icon={TrendingDown} accent />
          <KpiCard label={tt('Least elastic tier')}  value="SME bundle"  delta={tt('acq -0.9 per BSD 1 cut')}    trend="up"   icon={TrendingUp}       />
          <KpiCard label={tt('Best churn elasticity')} value="Convergent" delta={tt('sticky — 0.6 churn el.')} trend="up"   icon={Activity}         />
          <KpiCard label={tt('Highest churn risk')}   value="600Mb"       delta={tt('0.8 churn elasticity')}    trend="down" icon={AlertTriangle}     />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Tier:')}</span>
          {(['All', '1Gb fibre', '600Mb', 'Unlimited 5G', 'Convergent'] as const).map(k => (
            <button key={k} onClick={() => setTierFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                tierFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>{tt(k)}</button>
          ))}
        </div>

        <Panel title={tt('Price elasticity by tier — acquisition vs churn')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={filteredElasticity}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="tier" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="acq"   fill={NAVY} name={tt('Acquisition elasticity')} radius={[3, 3, 0, 0]} />
                <Bar dataKey="churn" fill={BLUE} name={tt('Churn elasticity')}       radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('600Mb is the most price-sensitive tier — defend it first if a competitor targets entry fibre.')}</div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Tier sensitivity — price premium vs customer base size vs churn')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Tier')}</th>
                    <th className="px-3 py-2 text-right">{tt('Price BSD /mo')}</th>
                    <th className="px-3 py-2 text-right">{tt('Premium vs Rival ISP B BSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Customers (K)')}</th>
                    <th className="px-3 py-2 text-right">{tt('Churn %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Acq elas')}</th>
                    <th className="px-3 py-2 text-right">{tt('Churn elas')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_SENS.map((t, idx) => (
                    <tr key={t.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(t.tier)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {t.price}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {t.premium}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.custK}K</td>
                      <td className={`px-3 py-2 text-right font-bold ${
                        t.churnPct >= 7 ? 'text-red-600' : t.churnPct >= 5 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{t.churnPct}%</td>
                      <td className="px-3 py-2 text-right font-mono">{ELASTICITY[idx]?.acq ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{ELASTICITY[idx]?.churn ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Open Pricing Simulator →')}</Link>
              <Link to="/portal/product"           className="font-bold text-vfes-dark hover:underline">{tt('Open Product →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ GAME TREE ══════════════════════════════════════════════════════════ */}
      {tab === 'gametree' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('BTC / Hold')}   value="-BSD 1.8M" delta={tt('EBITDA impact/yr')}    trend="down" icon={Swords}      accent />
          <KpiCard label={tt('Rival ISP B / Hold')}        value="-BSD 5.4M" delta={tt('highest hold cost')}   trend="down" icon={AlertTriangle}     />
          <KpiCard label={tt('Best BTC resp')} value="Hold"    delta={tt('least bad at -BSD 1.8M')} trend="up"   icon={Target}          />
          <KpiCard label={tt('Best Rival ISP B response')} value="Match"   delta={tt('entry tier only')}    trend="up"   icon={Target}          />
        </div>

        <Panel title={tt('Game-tree payoffs — EBITDA impact (BSD M/yr) by competitor move and response')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={GAME_TREE}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="node" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#999" fontSize={11} unit="M" />
                <Tooltip contentStyle={TS} formatter={(v: any) => [`BSD ${v}M`, 'EBITDA']} />
                <Bar dataKey="ebitda" name={tt('EBITDA BSD M/yr')} radius={[4, 4, 0, 0]}>
                  {GAME_TREE.map((g, i) => <Cell key={i} fill={g.ebitda >= -2 ? AMBER : g.ebitda >= -4 ? RED : '#7f1d1d'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Darkest red = most destructive response. Beating Rival ISP B on price is the worst outcome at -BSD 8.9M/yr.')}</div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Game tree payoff table — full nodes')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Node')}</th>
                    <th className="px-3 py-2 text-right">{tt('EBITDA BSD M/yr')}</th>
                    <th className="px-3 py-2 text-right">{tt('Share Δpp')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARPU ΔBSD ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {GAME_TREE.map(g => (
                    <tr key={g.node} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(g.node)}</td>
                      <td className={`px-3 py-2 text-right font-bold ${
                        g.ebitda >= -2 ? 'text-amber-600' : 'text-red-600'
                      }`}>BSD {g.ebitda}M</td>
                      <td className={`px-3 py-2 text-right font-mono ${
                        g.share >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>{g.share >= 0 ? '+' : ''}{g.share}pp</td>
                      <td className={`px-3 py-2 text-right font-mono ${
                        g.arpu >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>BSD {g.arpu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ MATRIX ════════════════════════════════════════════════════════════ */}
      {tab === 'matrix' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Smallest loss')}  value="-BSD 0.8M"  delta={tt('BSD 2 cut / hold')}          trend="up"   icon={TrendingUp}    accent />
          <KpiCard label={tt('Largest loss')}   value="-BSD 12.1M" delta={tt('BSD 15 cut / beat')}         trend="down" icon={TrendingDown}       />
          <KpiCard label={tt('Break-even cut')} value="Never"   delta={tt('all strategies negative')} trend="flat" icon={AlertTriangle}    />
          <KpiCard label={tt('Hold dominates')} value="Yes"     delta={tt('for all cut sizes vs BTC')} trend="up" icon={Target}        />
        </div>

        <Panel title={tt('Payoff matrix — EBITDA impact by cut size and our response (BSD M/yr)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={MATRIX_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="cut" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="hold"  name={tt('Hold')}  stroke={GREEN} strokeWidth={2.4} dot />
                <Line type="monotone" dataKey="match" name={tt('Match')} stroke={AMBER} strokeWidth={2}   dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="beat"  name={tt('Beat')}  stroke={RED}   strokeWidth={2}   dot={false} strokeDasharray="2 4" />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('Hold consistently outperforms match/beat for premium competitors. For low-cost (Rival ISP B), match on entry tier only when cut ≥ BSD 5.')}
          </div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Open Pricing Simulator →')}</Link>
          <Link to="/portal/finance"           className="font-bold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        </div>
      </>)}

      {/* ══ HISTORY ═══════════════════════════════════════════════════════════ */}
      {tab === 'history' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cable Bahamas ARPU')} value="BSD 37.5" delta={tt('Nov 2026')}           trend="flat" icon={Activity}  accent />
          <KpiCard label={tt('BTC gap')}   value="BSD 2.7"  delta={tt('shrinking')}           trend="down" icon={TrendingDown}   />
          <KpiCard label={tt('Rival ISP B gap')}       value="BSD 22.7" delta={tt('stable low-cost')}     trend="flat" icon={TrendingUp}    />
          <KpiCard label={tt('Price premium')}  value="+10%"  delta={tt('vs market avg')}        trend="flat" icon={Target}        />
        </div>

        <Panel title={tt('Competitor average ARPU trend — Jan–Nov 2026 (BSD /mo)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="BSD " domain={[14, 42]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cablebahamas" name="Cable Bahamas"  stroke={RED}    strokeWidth={2.8} dot />
                <Line type="monotone" dataKey="btc"  name="BTC"   stroke={BLUE}   strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="orange"    name="Rival ISP A"     stroke={AMBER}  strokeWidth={1.8} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="digi"  name="Rival ISP B"  stroke={PURPLE} strokeWidth={1.6} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="voo"       name="Rival ISP C"        stroke={SLATE}  strokeWidth={1.4} dot={false} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Cable Bahamas premium is narrowing vs BTC — watch for signal-pricing ahead of the Sept campaign season.')}</div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/sales"   className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
          <Link to="/portal/b2b"     className="font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
          <Link to="/portal/finance" className="font-bold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        </div>
      </>)}

      {/* ══ SHARE ════════════════════════════════════════════════════════════ */}
      {tab === 'share' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cable Bahamas share')}  value="27.6%" delta={tt('Nov 2026')}              trend="down" icon={BarChart2}  accent />
          <KpiCard label={tt('Rival ISP B gaining')}      value="+1.7pp" delta={tt('YTD — watch')}         trend="down" icon={AlertTriangle}   />
          <KpiCard label={tt('BTC share')}    value="25.6%" delta={tt('largest single rival')} trend="flat" icon={Activity}       />
          <KpiCard label={tt('Share at risk')}     value="0.8pp" delta={tt('if Rival ISP B moves unansw.')} trend="down" icon={TrendingDown}   />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Metric:')}</span>
          {(['value', 'revenue'] as const).map(k => (
            <button key={k} onClick={() => setShareMetric(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                shareMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'value' ? tt('Volume share') : tt('Revenue share')}
            </button>
          ))}
        </div>

        <Panel title={tt('Market share trend — all operators (Jan–Nov 2026 %)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={SHARE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cablebahamas" name="Cable Bahamas"  stroke={RED}    fill={RED}    fillOpacity={0.25} strokeWidth={2.8} />
                <Area type="monotone" dataKey="btc"  name="BTC"   stroke={BLUE}   fill={BLUE}   fillOpacity={0.1}  strokeWidth={2} />
                <Area type="monotone" dataKey="orange"    name="Rival ISP A"     stroke={AMBER}  fill={AMBER}  fillOpacity={0.1}  strokeWidth={1.6} />
                <Area type="monotone" dataKey="digi"  name="Rival ISP B"  stroke={PURPLE} fill={PURPLE} fillOpacity={0.1}  strokeWidth={1.4} />
                <Area type="monotone" dataKey="voo"       name="Rival ISP C"        stroke={SLATE}  fill={SLATE}  fillOpacity={0.1}  strokeWidth={1.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Cable Bahamas trending down 0.6pp YTD as Rival ISP B gains entry-tier customers. Hold strategy needed.')}</div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
          <Link to="/portal/customer-360"    className="font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <Link to="/portal/company-360"     className="font-bold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
        </div>
      </>)}

      {/* ══ INTEL ════════════════════════════════════════════════════════════ */}
      {tab === 'intel' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('High-threat moves')}  value="2"   delta={tt('Rival ISP B + Rival ISP B entry')}   trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Medium-threat moves')} value="3"  delta={tt('BTC + Rival ISP A tiers')} trend="flat" icon={Activity}          />
          <KpiCard label={tt('Highest probability')} value="74%" delta={tt('Rival ISP B SIM-only cut')}     trend="down" icon={TrendingDown}      />
          <KpiCard label={tt('Next expected move')}  value="Jul" delta={tt('Rival ISP B / Rival ISP B')}       trend="flat" icon={Brain}             />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Threat level:')}</span>
          {(['All', 'High', 'Med', 'Low'] as const).map(k => (
            <button key={k} onClick={() => setIntelFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                intelFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>{tt(k)}</button>
          ))}
        </div>

        <Panel title={tt('Competitive intelligence register — anticipated price moves')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Competitor')}</th>
                  <th className="px-3 py-2">{tt('Anticipated move')}</th>
                  <th className="px-3 py-2">{tt('Tier')}</th>
                  <th className="px-3 py-2 text-right">{tt('Probability %')}</th>
                  <th className="px-3 py-2">{tt('Timeframe')}</th>
                  <th className="px-3 py-2">{tt('Threat')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIntel.map((c, idx) => (
                  <tr key={idx} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{c.competitor}</td>
                    <td className="px-3 py-2 text-xs">{tt(c.move)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/60">{tt(c.tier)}</td>
                    <td className="px-3 py-2 text-right font-bold">
                      <span className={c.probability >= 60 ? 'text-red-600' : c.probability >= 35 ? 'text-amber-600' : 'text-vfes-dark/60'}>{c.probability}%</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.timeframe}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.threat === 'High' ? 'bg-red-50 text-red-700'
                          : c.threat === 'Med' ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>{tt(c.threat)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/sales"       className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
            <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ TIERS ════════════════════════════════════════════════════════════ */}
      {tab === 'tiers' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Highest margin tier')}  value="Convergent" delta={tt('BSD 64/mo · 3.4% churn')}   trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Largest tier by subs')} value="600Mb"      delta={tt('840K subs')}              trend="flat" icon={BarChart2}        />
          <KpiCard label={tt('Most elastic tier')}    value="600Mb"      delta={tt('highest price sensitivity')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Stickiest tier')}       value="SME bundle" delta={tt('2.8% churn')}              trend="up"   icon={Zap}            />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Customer base by tier (K subs)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={TIER_SENS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="custK" name={tt('Customers K')} radius={[4, 4, 0, 0]}>
                    {TIER_SENS.map((_, i) => <Cell key={i} fill={[NAVY, BLUE, GREEN, AMBER, PURPLE][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Price premium vs Rival ISP B by tier (BSD /mo)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={TIER_SENS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD " />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="premium" name={tt('Premium vs Rival ISP B BSD ')} radius={[4, 4, 0, 0]}>
                    {TIER_SENS.map((_, i) => <Cell key={i} fill={[GREEN, AMBER, BLUE, NAVY, PURPLE][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Tier sensitivity full table')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Tier')}</th>
                  <th className="px-3 py-2 text-right">{tt('Price BSD /mo')}</th>
                  <th className="px-3 py-2 text-right">{tt('Rival ISP B premium BSD ')}</th>
                  <th className="px-3 py-2 text-right">{tt('Subs (K)')}</th>
                  <th className="px-3 py-2 text-right">{tt('Churn %')}</th>
                </tr>
              </thead>
              <tbody>
                {TIER_SENS.map(t => (
                  <tr key={t.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(t.tier)}</td>
                    <td className="px-3 py-2 text-right font-mono">BSD {t.price}</td>
                    <td className="px-3 py-2 text-right font-bold">BSD {t.premium}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.custK}K</td>
                    <td className={`px-3 py-2 text-right font-bold ${
                      t.churnPct >= 7 ? 'text-red-600' : t.churnPct >= 5 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{t.churnPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/product"           className="font-bold text-vfes-dark hover:underline">{tt('Product →')}</Link>
            <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator →')}</Link>
            <Link to="/portal/channel-dealers"   className="font-bold text-vfes-dark hover:underline">{tt('Channel & Dealers →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ── Always-visible footer ─────────────────────────────────────────────── */}
      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Market share trend — quick view')}>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={SHARE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[8, 32]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cablebahamas" name="Cable Bahamas" stroke={RED}   strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="btc"  name="BTC"  stroke={BLUE}  strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="digi"      name="Rival ISP B"      stroke={SLATE} strokeWidth={1.4} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div>
          <Panel title={tt('Quick links')}>
            <div className="flex flex-col gap-2 text-xs font-semibold py-1">
              <Link to="/portal/pricing-simulator"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Pricing Simulator')}</Link>
              <Link to="/portal/promotions"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Promotions')}</Link>
              <Link to="/portal/sales"              className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Sales')}</Link>
              <Link to="/portal/churn-retention"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Churn & Retention')}</Link>
              <Link to="/portal/b2b"                className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('B2B')}</Link>
              <Link to="/portal/bundle-profitability" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Bundle Profitability')}</Link>
              <Link to="/portal/mvno-wholesale"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('MVNO & Wholesale')}</Link>
              <Link to="/portal/finance"            className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Finance')}</Link>
              <Link to="/portal/product"            className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Product')}</Link>
              <Link to="/portal/ai-insights"        className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('AI Insights')}</Link>
              <Link to="/portal/company-360"        className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Company 360')}</Link>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Payoff matrix table ─────────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Payoff matrix — EBITDA impact (BSD M/yr) by cut size and response strategy')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Competitor cut')}</th>
                  <th className="px-3 py-2 text-right">{tt('Hold')}</th>
                  <th className="px-3 py-2 text-right">{tt('Match')}</th>
                  <th className="px-3 py-2 text-right">{tt('Beat')}</th>
                  <th className="px-3 py-2">{tt('Best response')}</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_DATA.map(m => {
                  const best = Math.max(m.hold, m.match, m.beat)
                  const bestStr = best === m.hold ? tt('Hold') : best === m.match ? tt('Match') : tt('Beat')
                  return (
                    <tr key={m.cut} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-bold font-mono">{m.cut}</td>
                      <td className={`px-3 py-2 text-right font-mono ${m.hold >= -2 ? 'text-amber-600' : 'text-red-600'}`}>BSD {m.hold}M</td>
                      <td className={`px-3 py-2 text-right font-mono ${m.match >= -2 ? 'text-amber-600' : 'text-red-600'}`}>BSD {m.match}M</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">BSD {m.beat}M</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{bestStr}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Hold dominates for premium competitor moves. Match entry-only for Rival ISP B ≥ BSD 5. Never beat — base ARPU erosion is too large.')}</div>
        </Panel>
      </div>

      {/* ── Competitor intel table ──────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Competitive intelligence — all anticipated price moves')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Competitor')}</th>
                  <th className="px-3 py-2">{tt('Move')}</th>
                  <th className="px-3 py-2">{tt('Tier')}</th>
                  <th className="px-3 py-2 text-right">{tt('Prob %')}</th>
                  <th className="px-3 py-2">{tt('Timeframe')}</th>
                  <th className="px-3 py-2">{tt('Threat')}</th>
                </tr>
              </thead>
              <tbody>
                {COMP_INTEL.map((c, idx) => (
                  <tr key={idx} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{c.competitor}</td>
                    <td className="px-3 py-2 text-xs">{tt(c.move)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/60">{tt(c.tier)}</td>
                    <td className="px-3 py-2 text-right font-bold">
                      <span className={c.probability >= 60 ? 'text-red-600' : c.probability >= 35 ? 'text-amber-600' : 'text-vfes-dark/60'}>{c.probability}%</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.timeframe}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.threat === 'High' ? 'bg-red-50 text-red-700'
                          : c.threat === 'Med' ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>{tt(c.threat)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Elasticity + price history charts ──────────────────────────────── */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Price elasticity — acquisition & churn by tier')}>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={ELASTICITY}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="tier" stroke="#999" fontSize={9} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="acq"   fill={NAVY} name={tt('Acq elasticity')}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="churn" fill={BLUE} name={tt('Churn elasticity')} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Competitor ARPU trend — Jan–Nov 2026 (BSD /mo)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="BSD " domain={[14, 42]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="cablebahamas" name="Cable Bahamas" stroke={RED}   strokeWidth={2.4} dot />
                <Line type="monotone" dataKey="btc"  name="BTC"  stroke={BLUE}  strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="digi"      name="Rival ISP B"      stroke={SLATE} strokeWidth={1.4} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── EBITDA scenario bar ─────────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('All response scenarios — EBITDA comparison (current controls)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={allScenarios}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="M" />
                <Tooltip contentStyle={TS} formatter={(v: any) => [`BSD ${v}M`, tt('EBITDA impact/yr')]} />
                <Bar dataKey="ebitda" name={tt('EBITDA BSD M/yr')} radius={[6, 6, 0, 0]}>
                  {allScenarios.map((s, i) => <Cell key={i} fill={s.ebitda >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Adjust controls in the Simulator tab to explore any competitor + cut + response combination.')}</div>
        </Panel>
      </div>

      {/* ── Market share area chart ─────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Market share trend — Cable Bahamas vs peers (Jan–Nov 2026 %)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={SHARE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[8, 32]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cablebahamas" name="Cable Bahamas" stroke={RED}   fill={RED}   fillOpacity={0.2}  strokeWidth={2.4} />
                <Area type="monotone" dataKey="btc"  name="BTC"  stroke={BLUE}  fill={BLUE}  fillOpacity={0.1}  strokeWidth={1.8} />
                <Area type="monotone" dataKey="digi"      name="Rival ISP B"      stroke={SLATE} fill={SLATE} fillOpacity={0.1}  strokeWidth={1.2} />
                <Area type="monotone" dataKey="voo"       name="Rival ISP C"       stroke={PURPLE} fill={PURPLE} fillOpacity={0.1} strokeWidth={1.0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Rival ISP B gaining 1.7pp YTD. Entry-tier defence required. Cable Bahamas premium brand still commands 2.7pp ARPU premium over BTC.')}</div>
        </Panel>
      </div>

      {/* ── Related links ───────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Related pages')}</div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/portal/pricing-simulator"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Pricing Simulator')}</Link>
          <Link to="/portal/promotions"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Promotions')}</Link>
          <Link to="/portal/bundle-profitability" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Bundle Profitability')}</Link>
          <Link to="/portal/sales"              className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Sales')}</Link>
          <Link to="/portal/churn-retention"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Churn & Retention')}</Link>
          <Link to="/portal/b2b"               className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('B2B')}</Link>
          <Link to="/portal/finance"            className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Finance')}</Link>
          <Link to="/portal/product"            className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Product')}</Link>
          <Link to="/portal/channel-dealers"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Channel & Dealers')}</Link>
          <Link to="/portal/mvno-wholesale"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('MVNO & Wholesale')}</Link>
          <Link to="/portal/ai-insights"        className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
          <Link to="/portal/company-360"        className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Company 360')}</Link>
        </div>
      </div>

      {/* ── Action CTA ───────────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Price war-game intelligence')}</div>
          <div className="text-sm text-vfes-dark/80 mb-1">
            {tt('Rival ISP B / Rival ISP B entry-tier move expected Jul-26. Recommended response: defend 600Mb on quality messaging, match only if cut ≥ BSD 5 and limited to entry tier. Do not match premium tiers.')}
          </div>
          <div className="text-xs text-vfes-dark/55">{tt('Review cadence: weekly competitor monitor · monthly war-game refresh · pre-campaign scenario run.')}</div>
        </div>
        <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
          <Brain className="w-4 h-4" />{tt('Open AI Insights →')}
        </Link>
      </div>

      {/* ── Tier sensitivity scatter ────────────────────────────────────────── */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Tier sensitivity — premium vs churn rate (bubble = customers K)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="premium" name={tt('Premium vs Rival ISP B BSD ')} stroke="#999" fontSize={11}
                  label={{ value: tt('Premium vs Rival ISP B BSD '), position: 'insideBottom', offset: -4, fontSize: 10 }} />
                <YAxis type="number" dataKey="churnPct" name={tt('Churn %')} stroke="#999" fontSize={11}
                  label={{ value: tt('Churn %'), angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ZAxis type="number" dataKey="custK" range={[60, 300]} />
                <Tooltip contentStyle={TS} formatter={(v: any, n: any) => [v, tt(n)]} />
                <Scatter data={TIER_SENS}>
                  {TIER_SENS.map((_, i) => <Cell key={i} fill={[NAVY, BLUE, GREEN, AMBER, PURPLE][i % 5]} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('600Mb: high premium, high churn — most vulnerable. Convergent: high premium, low churn — most defensible.')}</div>
        </Panel>

        <Panel title={tt('Game tree — full payoff table')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Node')}</th>
                  <th className="px-3 py-2 text-right">{tt('EBITDA BSD M')}</th>
                  <th className="px-3 py-2 text-right">{tt('Share Δpp')}</th>
                  <th className="px-3 py-2 text-right">{tt('ARPU ΔBSD ')}</th>
                </tr>
              </thead>
              <tbody>
                {GAME_TREE.map(g => (
                  <tr key={g.node} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(g.node)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${ g.ebitda >= -2 ? 'text-amber-600' : 'text-red-600' }`}>BSD {g.ebitda}M</td>
                    <td className={`px-3 py-2 text-right font-mono ${ g.share >= 0 ? 'text-emerald-600' : 'text-red-600' }`}>{g.share >= 0 ? '+' : ''}{g.share}pp</td>
                    <td className={`px-3 py-2 text-right font-mono ${ g.arpu >= 0 ? 'text-emerald-600' : 'text-red-600' }`}>BSD {g.arpu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator →')}</Link>
            <Link to="/portal/customer-360"      className="font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Share × ARPU matrix ─────────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Share gain vs ARPU erosion — response scenarios')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={shareScenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="K" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="BSD " />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="netK"  name={tt('Net adds K')} fill={NAVY} radius={[4, 4, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="arpu" name={tt('ARPU ΔBSD ')} stroke={RED} strokeWidth={2.4} dot />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Beating on price gains short-term adds but destroys ARPU on the existing base — net NPV negative in all scenarios.')}</div>
        </Panel>
      </div>

      {/* ── Tier sensitivity full table ─────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Tier sensitivity — price, premium and churn register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Tier')}</th>
                  <th className="px-3 py-2 text-right">{tt('Price BSD /mo')}</th>
                  <th className="px-3 py-2 text-right">{tt('Rival ISP B premium BSD ')}</th>
                  <th className="px-3 py-2 text-right">{tt('Subs K')}</th>
                  <th className="px-3 py-2 text-right">{tt('Churn %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Acq elas')}</th>
                  <th className="px-3 py-2 text-right">{tt('Churn elas')}</th>
                </tr>
              </thead>
              <tbody>
                {TIER_SENS.map((t, idx) => (
                  <tr key={t.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(t.tier)}</td>
                    <td className="px-3 py-2 text-right font-mono">BSD {t.price}</td>
                    <td className="px-3 py-2 text-right font-bold">BSD {t.premium}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.custK}K</td>
                    <td className={`px-3 py-2 text-right font-bold ${t.churnPct >= 7 ? 'text-red-600' : t.churnPct >= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.churnPct}%</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark/60">{ELASTICITY[idx]?.acq ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark/60">{ELASTICITY[idx]?.churn ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <AskTheData />
    </div>
  )
}
