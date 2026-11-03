import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(2732)
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightLeft, TrendingUp, TrendingDown, Target, Brain, ChevronRight,
  Users, Activity, Zap, ShieldCheck, GitBranch, Phone, Layers,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const RED = '#EF4444'

// 30-day port flow (deterministic)
const DAILY_FLOW = Array.from({ length: 30 }, (_, i) => {
  const inn = 420 + Math.round(80 * Math.sin(i / 3)) + (i % 7 === 5 ? 90 : 0)
  const out = 380 + Math.round(70 * Math.sin(i / 4 + 1)) + (i % 7 === 6 ? 70 : 0)
  return { d: `D${i + 1}`, portIn: inn, portOut: out, net: inn - out }
})

const NET_BY_CARRIER = [
  { carrier: 'BTC',  gained: 5240, lost: 3980, net: 1260 },
  { carrier: 'Rival ISP A',    gained: 4120, lost: 4360, net: -240 },
  { carrier: 'Rival ISP B',  gained: 3880, lost: 2940, net: 940 },
  { carrier: 'Rival ISP C',       gained: 2210, lost: 5120, net: -2910 },
  { carrier: 'Rival ISP C',       gained: 1640, lost: 1180, net: 460 },
]

const LOSS_REASONS = [
  { reason: 'Price / cheaper competitor', pct: 38, color: RED },
  { reason: 'Network quality complaint',  pct: 14, color: NAVY },
  { reason: 'Bill shock / billing error',  pct: 12, color: BLUE },
  { reason: 'Care dissatisfaction',        pct: 11, color: '#64748B' },
  { reason: 'Moved / no coverage',         pct: 9,  color: '#94A3B8' },
  { reason: 'Device / handset deal',       pct: 8,  color: BLUE },
  { reason: 'Other',                       pct: 8,  color: '#CBD5E1' },
]

const SAVE_OFFERS = [
  { offer: '20% loyalty discount · 12mo', accepted: 62, cost: 9.4, churnSaved: 1.8, roi: 4.2 },
  { offer: 'Free 5G upgrade + 50GB',      accepted: 48, cost: 6.0, churnSaved: 1.2, roi: 3.6 },
  { offer: 'Bundle 2nd line at -50%',     accepted: 41, cost: 12.5, churnSaved: 2.1, roi: 2.8 },
  { offer: 'BSD 50 retention credit',        accepted: 55, cost: 50.0, churnSaved: 1.0, roi: 1.4 },
  { offer: 'Device trade-in boost',       accepted: 33, cost: 80.0, churnSaved: 0.8, roi: 0.9 },
]

const AT_RISK = [
  { id: 'SUB-44182', tenure: '6.2 yr', arpu: 58, risk: 91, trigger: 'Competitor SMS · contract end 4d', offer: '20% loyalty · 12mo' },
  { id: 'SUB-71043', tenure: '2.1 yr', arpu: 42, risk: 84, trigger: 'Bill +BSD 14 MoM · 2 care calls',      offer: 'Bill review + credit' },
  { id: 'SUB-08820', tenure: '4.8 yr', arpu: 71, risk: 79, trigger: 'Roaming overage · NPS detractor',   offer: 'Roaming pass + 50GB' },
  { id: 'SUB-90551', tenure: '1.4 yr', arpu: 35, risk: 76, trigger: 'Speedtest app · cell congestion',   offer: 'Free 5G upgrade' },
  { id: 'SUB-33271', tenure: '8.0 yr', arpu: 64, risk: 72, trigger: 'MNP quote requested online',         offer: 'Bundle 2nd line -50%' },
]

const WEEKLY_TREND = Array.from({ length: 12 }, (_, i) => ({
  w: `S${i + 1}`,
  portIn:  2800 + Math.round(Math.sin(i / 2) * 480 + (i % 4 === 0 ? 220 : 0)),
  portOut: 2520 + Math.round(Math.cos(i / 2.5) * 360 + (i % 4 === 1 ? 180 : 0)),
}))

const MONTHLY_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'][i],
  portIn:  12400 + i * 320 + Math.round(Math.sin(i / 2) * 840),
  portOut: 11200 + i * 80  + Math.round(Math.cos(i / 2.5) * 640),
}))

const PORT_FUNNEL = [
  { stage: 'Inbound PAC requests',   n: 13800 },
  { stage: 'Validated by MNPBU',     n: 13420 },
  { stage: 'Accepted by donor',      n: 12960 },
  { stage: 'Port executed',          n: 12820 },
  { stage: 'Active on network',      n: 12640 },
]

const SAVE_FUNNEL = [
  { stage: 'Port-outs detected',        n: 14200 },
  { stage: 'Save desk eligible',        n: 11840 },
  { stage: 'Contacted',                 n:  8920 },
  { stage: 'Offer presented',           n:  7240 },
  { stage: 'Offer accepted',            n:  3692 },
  { stage: 'Port-out cancelled',        n:  3512 },
]

const WIN_BACK_TREND = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26','Q1-27','Q2-27'][i],
  contacted:   68000 + i * 2400,
  responded:   18400 + i * 820,
  reactivated:  9600 + i * 480,
}))

const CARRIER_DETAIL = [
  { carrier: 'BTC',   gained: 5240, lost: 3980, net: 1260,  shareGained: 42, shareLost: 31 },
  { carrier: 'Rival ISP A',     gained: 4120, lost: 4360, net: -240,  shareGained: 33, shareLost: 34 },
  { carrier: 'Rival ISP B',   gained: 3880, lost: 2940, net: 940,   shareGained: 31, shareLost: 23 },
  { carrier: 'Rival ISP C',        gained: 2210, lost: 5120, net: -2910, shareGained: 18, shareLost: 40 },
  { carrier: 'Rival ISP C',         gained: 1640, lost: 1180, net: 460,   shareGained: 13, shareLost:  9 },
]

// ─── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'portflow' | 'competitors' | 'reasons' | 'savedesk' | 'winback' | 'funnel' | 'analytics' | 'agent'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'portflow',    label: 'Port Flow',           icon: ArrowRightLeft },
  { id: 'competitors', label: 'Competitors',          icon: Activity },
  { id: 'reasons',     label: 'Churn Reasons',        icon: TrendingDown },
  { id: 'savedesk',    label: 'Save Desk',            icon: Target },
  { id: 'winback',     label: 'Win-back MNP',         icon: Users },
  { id: 'funnel',      label: 'MNP Funnel',           icon: Layers },
  { id: 'analytics',   label: 'Analytics',            icon: GitBranch },
  { id: 'agent',       label: 'AI Agent',             icon: Brain },
]

export default function MnpPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('portflow')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [carrierSort, setCarrierSort] = useState<'net' | 'gained' | 'lost'>('net')
  const [weekRange, setWeekRange] = useState(8)
  const [liveOffset, setLiveOffset] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setLiveOffset(v => v + Math.round((scenarioRandom() - 0.4) * 3)), 6000)
    return () => clearInterval(id)
  }, [])

  const totalIn  = useMemo(() => DAILY_FLOW.reduce((s, d) => s + d.portIn,  0), [])
  const totalOut = useMemo(() => DAILY_FLOW.reduce((s, d) => s + d.portOut, 0), [])
  const net = useMemo(() => totalIn - totalOut + liveOffset, [totalIn, totalOut, liveOffset])

  const sortedCarriers = useMemo(
    () => [...CARRIER_DETAIL].sort((a, b) => b[carrierSort] - a[carrierSort]),
    [carrierSort],
  )

  const weeklySlice = useMemo(() => WEEKLY_TREND.slice(-weekRange), [weekRange])

  const runSave = () => {
    setRunning(true); setStep(0)
    const s = [1, 2, 3, 4]
    s.forEach((v, i) => setTimeout(() => setStep(v), (i + 1) * 900))
    setTimeout(() => setRunning(false), 4000)
  }

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('MNP Flow & Save Desk')}
        subtitle={tt('Number portability · port-in/out flow · competitor win-loss · AI save offers')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold ${net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {net >= 0 ? '+' : ''}{net.toLocaleString('en-BS')} {tt('net 30d')}
            </span>
          </div>
        }
      />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <KpiCard label={tt('Port-in (30d)')} value={totalIn.toLocaleString('en-BS')} delta={tt('+6.2% MoM')} trend="up" icon={TrendingUp} accent />
        <KpiCard label={tt('Port-out (30d)')} value={totalOut.toLocaleString('en-BS')} delta={tt('-2.1% MoM')} trend="up" icon={TrendingDown} />
        <KpiCard label={tt('Net 30d')} value={`${net >= 0 ? '+' : ''}${net.toLocaleString('en-BS')}`} delta={tt('positive 4 consecutive months')} trend="up" icon={ArrowRightLeft} />
        <KpiCard label={tt('Save-desk acceptance')} value="51%" delta={tt('+4 pp vs target')} trend="up" icon={Target} />
        <KpiCard label={tt('Avg offer ROI')} value="3.6×" delta={tt('loyalty discount leads')} trend="up" icon={Zap} />
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label={tt('Win rate vs BTC')} value="+1,260" delta={tt('best competitor')} trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Loss vs Rival ISP B')} value="−2,910" delta={tt('price-defence urgent')} trend="down" icon={TrendingDown} />
        <KpiCard label={tt('Save desk contacted')} value="8,920" delta={tt('63% of eligible')} trend="up" icon={Phone} />
        <KpiCard label={tt('Avg ARPU saved')} value="BSD 56" delta={tt('+8 vs portfolio avg')} trend="up" icon={ShieldCheck} />
        <KpiCard label={tt('MNP window time')} value="24h" delta={tt('PAC expires in 24h')} trend="flat" icon={Activity} />
      </div>

      {/* ML Insight Section */}
      <MlInsightSection
        heading="MNP & save-desk intelligence"
        models={[
          { name: 'Port-out Risk Predictor', metric: 'AUC 0.91', sub: 'predicted 14 days before PAC request' },
          { name: 'Save-Offer Selector', metric: '+3.6× ROI', sub: 'optimal offer by CLV and elasticity' },
          { name: 'Win-back Propensity', metric: 'AUC 0.86', sub: 'lapsed 12-month segment' },
        ]}
        agentLabel="Run Save-Desk Optimiser"
        agentRunningLabel="Scoring…"
        agentSteps={[
          'Scored port-out requests by value & save-probability',
          'Matched cheapest offer that retains the line above CLV floor',
          'Routed high-value cases to senior save agents',
          'Tracked accepted saves & margin given away',
        ]}
        agentBlurb="The MNP window lasts 24 hours — the agent triages before the number leaves, assigning the optimal CLV-sized offer to avoid over-discounting."
        decision={{
          title: 'Pre-empt port-out with targeted, margin-aware save offers',
          detail: 'Most port-outs are price-driven and concentrated on two competitor destinations. Activating a CLV-sized save offer at the PAC request moment maximises retention rate without eroding average ARPU.',
          impact: 'save rate +8 pp · ARPU protected · lower acquisition cost',
          risk: 'do not over-discount low-CLV lines — cap by segment',
          linkTo: '#/portal/churn-retention',
          linkLabel: 'Open Churn & Retention',
        }}
        chart={{
          kind: 'line',
          title: 'Daily port-in vs port-out — 30 days',
          xKey: 'd',
          data: DAILY_FLOW.slice(0, 20),
          series: [
            { key: 'portIn',  name: 'Port-in',  color: '#10B981' },
            { key: 'portOut', name: 'Port-out', color: '#EF4444' },
          ],
          note: 'Port-in consistently above port-out — positive balance 4 consecutive months.',
        }}
      />

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
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

      {/* ══ PORT FLOW ══════════════════════════════════════════════════════════ */}
      {tab === 'portflow' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Daily port flow — 30 days')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={DAILY_FLOW}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="d" stroke="#999" fontSize={10} interval={4} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="portIn"  stroke="#10B981" strokeWidth={2.5} dot={false} name={tt('Port-in')} />
                    <Line type="monotone" dataKey="portOut" stroke="#EF4444" strokeWidth={2.5} dot={false} name={tt('Port-out')} />
                    <Line type="monotone" dataKey="net"     stroke="#222128" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name={tt('Net')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Saturdays show a port-out spike (+70) — adjust save desk availability at weekends.')}</div>
            </Panel>

            <Panel title={tt('Net balance — monthly trend (12 months)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={MONTHLY_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="portIn"  fill="#10B981" opacity={0.7} name={tt('Port-in')} />
                    <Bar dataKey="portOut" fill="#EF4444" opacity={0.7} name={tt('Port-out')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <Link to="/portal/base-management" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Base Management')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Churn & Retention')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/marketing" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Marketing Campaigns')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4">
            <Panel title={tt('Executive summary — MNP operational scorecard')}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: tt('Port-in cumul. YTD'), value: '142.4K', delta: tt('+8.2% vs PY'), color: '#10B981' },
                  { label: tt('Port-out cumul. YTD'), value: '128.6K', delta: tt('-3.4% vs PY'), color: '#EF4444' },
                  { label: tt('Avg PAC time'), value: '3h 40min', delta: tt('vs SLA 4h'), color: '#FF4438' },
                  { label: tt('Save desk NPS'), value: '+42', delta: tt('+6 points QoQ'), color: '#11567F' },
                ].map(k => (
                  <div key={k.label} className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 mb-1">{k.label}</div>
                    <div className="text-xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5">{k.delta}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap gap-3 text-xs">
                <span className="text-vfes-dark/45">{tt('Source:')}</span>
                <span className="font-mono text-vfes-dark/65">CBL_ANALYTICS.MNP.PORTABILITY_V3</span>
                <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline ml-auto">{tt('AI Insights →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Portability KPIs — weekly breakdown')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Week')}</th>
                      <th className="text-right">{tt('Port-in')}</th>
                      <th className="text-right">{tt('Port-out')}</th>
                      <th className="text-right">{tt('Net')}</th>
                      <th className="text-right">{tt('Save rate')}</th>
                      <th>{tt('Balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKLY_TREND.map((w, i) => {
                      const neto = w.portIn - w.portOut
                      const save = (21 + i * 0.4).toFixed(1)
                      return (
                        <tr key={w.w} className="border-b border-black/5 hover:bg-[#fafbfc]">
                          <td className="py-2.5 font-semibold text-xs">{w.w}</td>
                          <td className="text-right font-mono text-emerald-600">{w.portIn.toLocaleString('en-BS')}</td>
                          <td className="text-right font-mono text-red-600">{w.portOut.toLocaleString('en-BS')}</td>
                          <td className={`text-right font-bold ${neto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{neto >= 0 ? '+' : ''}{neto}</td>
                          <td className="text-right font-mono">{save}%</td>
                          <td><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${neto >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{neto >= 0 ? tt('Positive') : tt('Negative')}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ══ COMPETITORS ════════════════════════════════════════════════════════ */}
      {tab === 'competitors' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
            {(['net', 'gained', 'lost'] as const).map(k => (
              <button key={k} onClick={() => setCarrierSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${carrierSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'net' ? tt('By net') : k === 'gained' ? tt('By gained') : tt('By lost')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Net gain / loss by competitor')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={NET_BY_CARRIER} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} />
                    <YAxis type="category" dataKey="carrier" stroke="#999" fontSize={11} width={70} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="net" radius={[0, 4, 4, 0]}>
                      {NET_BY_CARRIER.map((c, i) => <Cell key={i} fill={c.net >= 0 ? '#10B981' : '#EF4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('Winner vs BTC & Rival ISP B; Rival ISP B low-cost drain -2,910 — price-defence segment urgent.')}
              </div>
            </Panel>

            <Panel title={tt('Competitor scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Carrier')}</th>
                      <th className="text-right">{tt('Gained')}</th>
                      <th className="text-right">{tt('Lost')}</th>
                      <th className="text-right">{tt('Net')}</th>
                      <th>{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCarriers.map(c => (
                      <tr key={c.carrier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold">{c.carrier}</td>
                        <td className="text-right font-mono text-emerald-600">{c.gained.toLocaleString('en-BS')}</td>
                        <td className="text-right font-mono text-red-600">{c.lost.toLocaleString('en-BS')}</td>
                        <td className={`text-right font-bold ${c.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {c.net >= 0 ? '+' : ''}{c.net.toLocaleString('en-BS')}
                        </td>
                        <td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {c.net >= 0 ? tt('Winning') : tt('Losing')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Competitive strategy — actions by carrier')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Competitor')}</th>
                      <th className="text-right">{tt('Net 30d')}</th>
                      <th>{tt('Weakness detected')}</th>
                      <th>{tt('Response lever')}</th>
                      <th>{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { carrier: 'Rival ISP B',     net: -2910, weakness: 'Price only — no 5G network or TV',           lever: 'Convergent Bundle + 5G upgrade',       status: 'Urgent' },
                      { carrier: 'Rival ISP A',   net:  -240, weakness: 'Family plan leakage — 2-line plan',        lever: '2nd line -50% · mid-size families',       status: 'Active' },
                      { carrier: 'Rival ISP C', net:   940, weakness: 'Poor rural coverage',                 lever: 'Leverage coverage + win-back',            status: 'Winning' },
                      { carrier: 'BTC', net:  1260, weakness: 'Premium price without clear differentiation',lever: 'Quality positioning + loyalty',          status: 'Winning' },
                      { carrier: 'Rival ISP C',      net:   460, weakness: 'Limited portfolio — no TV / IoT',          lever: 'Bundle + Smart Home cross-sell',          status: 'Winning' },
                    ].map(c => (
                      <tr key={c.carrier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold">{c.carrier}</td>
                        <td className={`text-right font-bold ${c.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{c.net >= 0 ? '+' : ''}{c.net.toLocaleString('en-BS')}</td>
                        <td className="text-xs text-vfes-dark/65 max-w-[200px]">{tt(c.weakness)}</td>
                        <td className="text-xs text-vfes-dark/80">{tt(c.lever)}</td>
                        <td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            c.status === 'Urgent' ? 'bg-red-50 text-red-700' :
                            c.status === 'Active'  ? 'bg-blue-50 text-blue-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>{tt(c.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <Link to="/portal/sales" className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
                <Link to="/portal/promotions" className="font-bold text-vfes-dark hover:underline">{tt('Promotions →')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ══ REASONS ════════════════════════════════════════════════════════════ */}
      {tab === 'reasons' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title={tt('Port-out reasons — call mining (Cortex AI)')}>
            <div className="space-y-2.5">
              {LOSS_REASONS.map(r => (
                <div key={r.reason} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span>{tt(r.reason)}</span>
                    <span className="font-mono text-xs">{r.pct}%</span>
                  </div>
                  <div className="h-2 rounded bg-black/5 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${r.pct * 2.4}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Source: AI_CLASSIFY on 18,400 retention calls · last 30 days.')}</div>
          </Panel>

          <Panel title={tt('Reason distribution by destination carrier')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { carrier: 'Rival ISP B',    price: 62, network: 8,  bill: 9,  care: 14, other: 7 },
                  { carrier: 'Rival ISP A',  price: 38, network: 18, bill: 14, care: 20, other: 10 },
                  { carrier: 'Rival ISP C',     price: 44, network: 12, bill: 10, care: 22, other: 12 },
                  { carrier: 'BTC',price: 28, network: 20, bill: 16, care: 24, other: 12 },
                ]} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="carrier" stroke="#999" fontSize={11} width={65} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="price"   fill="#EF4444" stackId="a" name={tt('Price')} />
                  <Bar dataKey="network" fill="#FF4438" stackId="a" name={tt('Network')} />
                  <Bar dataKey="bill"    fill="#11567F" stackId="a" name={tt('Bill')} />
                  <Bar dataKey="care"    fill="#F59E0B" stackId="a" name={tt('Care')} />
                  <Bar dataKey="other"   fill="#94a3b8" stackId="a" name={tt('Other')} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <Link to="/portal/voc" className="font-bold text-vfes-dark hover:underline">{tt('VOC →')}</Link>
              <Link to="/portal/experience" className="font-bold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ══ SAVE DESK ══════════════════════════════════════════════════════════ */}
      {tab === 'savedesk' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Save offer effectiveness')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-2 py-2">{tt('Offer')}</th>
                      <th className="px-2 py-2 text-right">{tt('Accept %')}</th>
                      <th className="px-2 py-2 text-right">{tt('Cost BSD ')}</th>
                      <th className="px-2 py-2 text-right">{tt('ROI')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAVE_OFFERS.map(o => (
                      <tr key={o.offer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-2 py-2">{tt(o.offer)}</td>
                        <td className="px-2 py-2 text-right font-mono">{o.accepted}%</td>
                        <td className="px-2 py-2 text-right font-mono">BSD {o.cost.toFixed(1)}</td>
                        <td className={`px-2 py-2 text-right font-mono font-bold ${o.roi >= 2 ? 'text-emerald-600' : o.roi >= 1 ? 'text-amber-600' : 'text-red-600'}`}>{o.roi.toFixed(1)}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('Loyalty discount beats BSD 50 credit on ROI 3× — redirect budget.')}
              </div>
            </Panel>

            <Panel title={tt('Save offer ROI — comparison')}>              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={SAVE_OFFERS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="offer" stroke="#999" fontSize={8} interval={0} angle={-25} textAnchor="end" height={56} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v}×`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}×`, 'ROI']} />
                    <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                      {SAVE_OFFERS.map((o, i) => <Cell key={i} fill={o.roi >= 3 ? '#10B981' : o.roi >= 2 ? '#FF4438' : '#F59E0B'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Save desk funnel — 30 days')}>
              <div className="space-y-2.5 mt-2">
                {SAVE_FUNNEL.map((s, i) => (
                  <div key={s.stage} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">{tt(s.stage)}</span>
                      <span className="font-mono text-xs">{s.n.toLocaleString('en-BS')}</span>
                    </div>
                    <div className="h-2 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(s.n / SAVE_FUNNEL[0].n) * 100}%`, background: i === SAVE_FUNNEL.length - 1 ? '#10B981' : '#11567F' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Save desk rate: 24.7% of eligible port-outs cancelled — target 30% EOY.')}</div>
            </Panel>
          </div>

          {running && (
            <div className="mb-3 text-xs space-y-1">
              <div className={step >= 1 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 1 ? '✓' : '○'} {tt('1. Scored 5 high-risk lines with churn model')}</div>
              <div className={step >= 2 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 2 ? '✓' : '○'} {tt('2. Next-best offer assigned by ROI and elasticity')}</div>
              <div className={step >= 3 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>{step >= 3 ? '✓' : '○'} {tt('3. Outbound queue sent to retention desk')}</div>
            </div>
          )}

          <Panel
            title={tt('At-risk subscribers — next-best save offer')}
            action={
              <button onClick={runSave} disabled={running}
                className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1">
                <Brain className="w-3 h-3" /> {running ? tt('Running agent…') : tt('Run Save Agent')}
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Subscriber')}</th>
                    <th className="px-3 py-2">{tt('Tenure')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARPU')}</th>
                    <th className="px-3 py-2 text-right">{tt('Churn risk')}</th>
                    <th className="px-3 py-2">{tt('Trigger')}</th>
                    <th className="px-3 py-2">{tt('Recommended offer')}</th>
                  </tr>
                </thead>
                <tbody>
                  {AT_RISK.map(r => (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                      <td className="px-3 py-2">{r.tenure}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {r.arpu}</td>
                      <td className="px-3 py-2 text-right"><span className={`font-bold ${r.risk >= 85 ? 'text-red-600' : r.risk >= 75 ? 'text-amber-600' : 'text-vfes-dark/70'}`}>{r.risk}%</span></td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(r.trigger)}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-vfes-red/10 text-vfes-dark">{tt(r.offer)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <Link to="/portal/contact-center" className="font-bold text-vfes-dark hover:underline">{tt('Contact Center →')}</Link>
              <Link to="/portal/clv" className="font-bold text-vfes-dark hover:underline">{tt('CLV Model →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ══ WIN-BACK ═══════════════════════════════════════════════════════════ */}
      {tab === 'winback' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Win-back trend — contacted / responded / reactivated')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={WIN_BACK_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v)/1000).toFixed(1)}K`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="contacted"   stroke="#222128" strokeWidth={2} name={tt('Contacted')} />
                    <Line type="monotone" dataKey="responded"   stroke="#F59E0B" strokeWidth={2} name={tt('Responded')} />
                    <Line type="monotone" dataKey="reactivated" stroke="#10B981" strokeWidth={2.5} name={tt('Reactivated')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Win-back funnel — inactive → reactivated')}>
              <div className="space-y-2.5 mt-2">
                {[
                  { stage: 'Inactive 12 months',         n: 124000 },
                  { stage: 'Win-back campaign target',   n:  68000 },
                  { stage: 'Responded',                  n:  18400 },
                  { stage: 'Reactivated',                n:   9600 },
                ].map((s, i, arr) => (
                  <div key={s.stage} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span>{tt(s.stage)}</span>
                      <span className="font-mono text-xs">{s.n.toLocaleString('en-BS')}</span>
                    </div>
                    <div className="h-2 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(s.n / arr[0].n) * 100}%`, background: i === arr.length - 1 ? '#10B981' : '#11567F' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('7.7% of lapsed reactivate — target 12m cohort before number recycling.')}
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Reactivation channel — cost vs success rate')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Channel')}</th>
                      <th className="text-right">{tt('Success rate %')}</th>
                      <th className="text-right">{tt('Cost/contact BSD ')}</th>
                      <th className="text-right">{tt('Reactivated/month')}</th>
                      <th className="text-right">{tt('ROI')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ch: 'Outbound call',  rate: 14.2, cost: 12,  vol: 9600, roi: 4.8 },
                      { ch: 'SMS / RCS',      rate:  6.8, cost:  2,  vol: 6400, roi: 8.2 },
                      { ch: 'App push',       rate:  8.4, cost:  0,  vol: 4800, roi: 11.4 },
                      { ch: 'Email nurture',  rate:  3.1, cost:  1,  vol: 3200, roi: 3.6 },
                      { ch: 'Retail store',   rate: 18.6, cost: 28,  vol: 1800, roi: 2.1 },
                      { ch: 'Door-to-door',   rate: 21.2, cost: 84,  vol:  600, roi: 1.4 },
                    ].map(c => (
                      <tr key={c.ch} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold text-xs">{tt(c.ch)}</td>
                        <td className="text-right font-bold text-emerald-600">{c.rate}%</td>
                        <td className="text-right font-mono">BSD {c.cost}</td>
                        <td className="text-right font-mono">{c.vol.toLocaleString('en-BS')}</td>
                        <td className={`text-right font-bold ${c.roi >= 4 ? 'text-emerald-600' : c.roi >= 2 ? 'text-blue-600' : 'text-amber-600'}`}>{c.roi.toFixed(1)}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <Link to="/portal/base-management" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Base Management')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/loyalty-consent" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Loyalty & Consent')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      {/* ══ FUNNEL MNP ═════════════════════════════════════════════════════════ */}
      {tab === 'funnel' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Inbound portability funnel — PAC to network activation')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORT_FUNNEL} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="stage" stroke="#999" fontSize={10} width={185} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v)/1000).toFixed(1)}K`]} />
                    <Bar dataKey="n" fill="#FF4438" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Success rate: 91.6% — avg time 3h 40min from PAC to confirmed activation.')}</div>
            </Panel>

            <Panel title={tt('MNP funnel detail')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Stage')}</th>
                      <th className="text-right">{tt('Volume')}</th>
                      <th className="text-right">{tt('Drop %')}</th>
                      <th>{tt('Cause')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PORT_FUNNEL.map((s, i, arr) => {
                      const prev = i > 0 ? arr[i - 1].n : s.n
                      const drop = ((prev - s.n) / prev * 100).toFixed(1)
                      const cause = ['—', 'ID validation error', 'Outstanding debt', 'Contract < 30d', '—'][i]
                      return (
                        <tr key={s.stage} className="border-b border-black/5 hover:bg-[#fafbfc]">
                          <td className="py-2.5 font-semibold text-xs">{tt(s.stage)}</td>
                          <td className="text-right font-mono">{s.n.toLocaleString('en-BS')}</td>
                          <td className={`text-right font-bold ${i === 0 ? 'text-vfes-dark/40' : 'text-red-500'}`}>{i === 0 ? '—' : `−${drop}%`}</td>
                          <td className="text-xs text-vfes-dark/55">{tt(cause)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
                <Link to="/portal/contact-center" className="font-bold text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Daily save desk performance — 4 weeks')}>
              <div className="h-52">
                <ResponsiveContainer>
                  <ComposedChart data={Array.from({ length: 28 }, (_, i) => ({
                    d: `D${i+1}`,
                    eligible: 480 + Math.round(Math.sin(i / 3) * 120),
                    contacted: 340 + Math.round(Math.sin(i / 3.5) * 80),
                    saved: 84 + Math.round(Math.sin(i / 4) * 22 + (i % 7 === 5 ? -30 : 0)),
                  }))}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="d" stroke="#999" fontSize={9} interval={6} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="eligible"  fill="#94a3b8" opacity={0.5} name={tt('Eligible')} />
                    <Bar dataKey="contacted" fill="#FF4438" opacity={0.7}   name={tt('Contacted')} />
                    <Bar dataKey="saved"     fill="#10B981"                 name={tt('Saved')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Weekend shows a drop in contacts — opportunity to extend save desk coverage.')}</div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <Link to="/portal/contact-center" className="font-bold text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
            <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
          </div>
        </>
      )}

      {/* ══ ANALYTICS ══════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Weekly window:')}</span>
            {[4, 8, 12].map(w => (
              <button key={w} onClick={() => setWeekRange(w)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${weekRange === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {w}w
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Weekly port-in / port-out — cumulative area')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={weeklySlice}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="w" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(1)}K`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v)/1000).toFixed(1)}K`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="portIn"  stroke="#10B981" fill="#10B981" fillOpacity={0.2} name={tt('Port-in')} />
                    <Area type="monotone" dataKey="portOut" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} name={tt('Port-out')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Monthly net balance — 12-month trend')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={MONTHLY_TREND.map(m => ({ ...m, net: m.portIn - m.portOut }))}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="#999" />
                    <Area type="monotone" dataKey="net" stroke="#222128" fill="#FF4438" fillOpacity={0.2} name={tt('Monthly net')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Monthly net positive since Jan — sustained upward trend.')}</div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Monthly portability KPIs — 12 months')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Month')}</th>
                      <th className="text-right">{tt('Port-in')}</th>
                      <th className="text-right">{tt('Port-out')}</th>
                      <th className="text-right">{tt('Net')}</th>
                      <th className="text-right">{tt('Save rate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_TREND.map((m, i) => {
                      const neto = m.portIn - m.portOut
                      const saveRate = (22 + i * 0.3).toFixed(1)
                      return (
                        <tr key={m.m} className="border-b border-black/5 hover:bg-[#fafbfc]">
                          <td className="py-2.5 font-semibold text-xs">{tt(m.m)}</td>
                          <td className="text-right font-mono text-emerald-600">{m.portIn.toLocaleString('en-BS')}</td>
                          <td className="text-right font-mono text-red-600">{m.portOut.toLocaleString('en-BS')}</td>
                          <td className={`text-right font-bold ${neto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{neto >= 0 ? '+' : ''}{neto.toLocaleString('en-BS')}</td>
                          <td className="text-right font-mono">{saveRate}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
                {tt('Source:')} <span className="font-mono">CBL_ANALYTICS.MNP.MONTHLY_STATS</span>
              </div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('AI Insights')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/executive" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Executive Dashboard')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/customer-360" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Customer 360')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      {/* ══ AGENT ══════════════════════════════════════════════════════════════ */}
      {tab === 'agent' && (
        <>
          <AgentDecision
            title="Save-desk agent"
            label="Run Save-Desk Optimiser" runningLabel="Scoring…"
            steps={[
              'Scored port-out requests by value & save-probability',
              'Matched cheapest offer that retains the line',
              'Routed high-value cases to senior save agents',
              'Tracked accepted saves & margin given away',
            ]}
            hint="A port-out request is a 24-hour window — the agent triages it before the number leaves."
            result={{
              headline: 'Pre-empt port-out with targeted, margin-aware save offers',
              stats: [
                { label: 'Save-desk acceptance', value: '51%' },
                { label: 'Net adds (30d)', value: '+1,419' },
                { label: 'Port-out trend', value: '-2.1% MoM' },
                { label: 'Offer basis', value: 'CLV-sized' },
              ],
              findings: [
                'Most port-outs are price-driven and concentrated on two competitor destinations.',
                'Activate the save offer at the PAC request moment, sized to CLV.',
                'Route high-CLV at-risk lines to senior agents; low-value with standard offers.',
              ],
              note: 'Single eligible offer per request — cap discount by segment to protect ARPU.',
            }}
            impact="higher save rate · ARPU protected · lower acquisition cost"
            risk="do not over-discount low-CLV lines — cap by segment"
            linkTo="#/portal/churn-retention" linkLabel="Open Churn & Retention"
          />

          <Panel title={tt('Snowflake Intelligence — suggested questions')}>
            <div className="space-y-2 text-sm">
              {[
                'Which 5K subscribers with the highest CLV have filed a PAC request in the last 7 days?',
                'Which save offer has the highest ROI for the at-risk Rival ISP B-destination segment?',
                'Compare save desk rate on weekends vs weekdays — is there a significant difference?',
                'How many inactive 12-month customers have active marketing consent and ARPU > BSD 30?',
                'Analyse whether churn reasons vary by region — group by Bahamian province.',
                'What is the total retention cost if we scale the loyalty offer to 100% of eligible customers?',
              ].map(q => (
                <button key={q} className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                  <Brain className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                  <span className="flex-1">{q}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
              Powered by Cortex Analyst · Semantic View: <span className="font-mono">MNP_PORTABILITY</span>
            </div>
          </Panel>

          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Churn & Retention')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('B2B Dashboard')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/fraud" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Fraud')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Priority 1 — Rival ISP B')}</div>
          <div className="text-sm">{tt('Launch price-defence segment vs Rival ISP B: convergent bundle with 12-month limited price offer. Target: 380K at risk.')}</div>
          <div className="mt-2 flex gap-2">
            <Link to="/portal/pricing-simulator" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Pricing →')}</Link>
            <Link to="/portal/bundle-propensity" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Propensity →')}</Link>
          </div>
        </div>
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 mb-2">{tt('Priority 2 — Save desk')}</div>
          <div className="text-sm">{tt('Increase save rate from 24.7% to 30% by activating save offer at the PAC moment (not after). Reduce reaction time to < 2h.')}</div>
          <div className="mt-2 flex gap-2">
            <Link to="/portal/contact-center" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
            <Link to="/portal/ai-insights" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </div>
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-2">{tt('Priority 3 — Win-back')}</div>
          <div className="text-sm">{tt('Reactivate 124K 12-month inactive customers with omni-channel journey (App push + high-value outbound call) before number recycling.')}</div>
          <div className="mt-2 flex gap-2">
            <Link to="/portal/marketing" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            <Link to="/portal/digital-app" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Digital App →')}</Link>
          </div>
        </div>
      </div>

      <div className="mt-6 p-5 rounded-xl border border-black/5 bg-gradient-to-br from-[#fafbfc] to-white">
        <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('MNP scorecard — action summary')}</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={tt('Net MNP cumul. 2026')} value="+6,840" delta={tt('+28% vs 2025')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Save desk win rate')} value="24.7%" delta={tt('target 30% EOY')} trend="up" icon={Target} />
          <KpiCard label={tt('Avg port-in ARPU')} value="BSD 46.2" delta={tt('+BSD 4 vs portfolio')} trend="up" icon={Activity} />
          <KpiCard label={tt('Avg PAC time')} value="3h 40m" delta={tt('vs SLA 4h')} trend="up" icon={ShieldCheck} />
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Rival ISP B Plan')}</div>
            <div className="text-vfes-dark/65">{tt('Price-defence segment: convergent + 5G upgrade for 380K at risk. Deployment Q3.')}</div>
            <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold mt-1 block hover:underline">{tt('Pricing Simulator →')}</Link>
          </div>
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Save desk 30%')}</div>
            <div className="text-vfes-dark/65">{tt('Enable real-time intervention on PAC — AI agent assigns offer in < 2h from request.')}</div>
            <Link to="/portal/contact-center" className="text-vfes-dark font-semibold mt-1 block hover:underline">{tt('Contact Centre →')}</Link>
          </div>
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Win-back 124K')}</div>
            <div className="text-vfes-dark/65">{tt('Omni-channel journey (App + outbound) for lapsed 12m before recycling. Target 15K reactivations/month.')}</div>
            <Link to="/portal/digital-app" className="text-vfes-dark font-semibold mt-1 block hover:underline">{tt('Digital App →')}</Link>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-black/5 bg-[#fafbfc]">
        <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/40 mb-2">{tt('Fuente de datos \u00b7 update diaria')}</div>
        <div className="grid md:grid-cols-4 gap-3 text-[11px] text-vfes-dark/55">
          <div><span className="font-mono font-bold">CBL_ANALYTICS.MNP.PORTABILITY_V3</span> — {tt('daily port-in/out flows')}</div>
          <div><span className="font-mono font-bold">CBL_ANALYTICS.MNP.SAVE_DESK</span> — {tt('save desk efficiency')}</div>
          <div><span className="font-mono font-bold">CBL_ANALYTICS.CHURN.CLV_V2</span> — {tt('CLV and at-risk segmentation')}</div>
          <div><span className="font-mono font-bold">CBL_ANALYTICS.MNP.COMPETITOR_INTEL</span> — {tt('win/loss analysis by carrier')}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
          <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          <Link to="/portal/voc" className="font-bold text-vfes-dark hover:underline">{tt('VOC →')}</Link>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-5 gap-3">
        {[
          { region: 'Nassau',    portIn: 3842, portOut: 3210, delta: 632,   trend: 'up'   as const },
          { region: 'Freeport',     portIn: 2940, portOut: 2680, delta: 260,   trend: 'up'   as const },
          { region: 'New Providence',   portIn: 2180, portOut: 2320, delta: -140,  trend: 'down' as const },
          { region: 'Abaco',  portIn: 1640, portOut: 1480, delta: 160,   trend: 'up'   as const },
          { region: 'Other',     portIn: 2198, portOut: 1810, delta: 388,   trend: 'up'   as const },
        ].map(r => (
          <div key={r.region} className="rounded-xl border border-black/5 bg-[#fafbfc] p-3">
            <div className="text-xs font-bold text-vfes-dark mb-1">{tt(r.region)}</div>
            <div className={`text-xl font-extrabold ${r.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {r.delta >= 0 ? '+' : ''}{r.delta.toLocaleString('en-BS')}
            </div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">
              {tt('In:')} {r.portIn.toLocaleString('en-BS')} · {tt('Out:')} {r.portOut.toLocaleString('en-BS')}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] text-vfes-dark/35 uppercase tracking-widest border-t border-black/5 pt-3">
        {tt('Regional balance updated daily \u00b7 Source: MNPBU (operator) \u00b7 Data with D-1 lag')} \u00b7
        <Link to="/portal/experience" className="font-bold text-vfes-dark hover:underline ml-1">{tt('Experiencia \u2192')}</Link>
        <Link to="/portal/sales" className="font-bold text-vfes-dark hover:underline ml-2">{tt('Ventas \u2192')}</Link>
        <Link to="/portal/product" className="font-bold text-vfes-dark hover:underline ml-2">{tt('Producto \u2192')}</Link>
        <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline ml-2">{tt('B2B \u2192')}</Link>
        <Link to="/portal/finance" className="font-bold text-vfes-dark hover:underline ml-2">{tt('Finanzas \u2192')}</Link>
        <Link to="/portal/loyalty-consent" className="font-bold text-vfes-dark hover:underline ml-2">{tt('Fidelizaci\u00f3n \u2192')}</Link>
      </div>

      {/* MNP page uses Snowflake Cortex AI for call classification, CLV scoring, and save-desk offer selection. */}
      {/* Semantic view: CBL_ANALYTICS.MNP.PORTABILITY_V3 — refreshed daily via Snowflake task chain. */}
      {/* For methodology see: portal/ai-insights */}
      <AskTheData />
    </div>
  )
}
