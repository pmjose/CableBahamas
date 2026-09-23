import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Server, Network, Gauge, AlertTriangle,
  Activity, TrendingUp, Zap, MapPin,
  ShieldCheck, Bell, Layers, Cable,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Pie, PieChart, Cell, Legend, LineChart, Line, AreaChart, Area,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const OLT_REGIONS = [
  { region: 'Nassau',    olts: 142, ports: 91200,  util: 73, tech: 'XGS-PON', passed: 412_000, take: 41, xgsPct: 38 },
  { region: 'Freeport', olts: 118, ports: 75500,  util: 68, tech: 'XGS-PON', passed: 142_000, take: 38, xgsPct: 22 },
  { region: 'Abaco',  olts:  64, ports: 41000,  util: 61, tech: 'GPON',    passed:  84_000, take: 34, xgsPct: 41 },
  { region: 'Eleuthera',   olts:  58, ports: 37100,  util: 57, tech: 'GPON',    passed:  72_000, take: 32, xgsPct: 18 },
  { region: 'Bimini',    olts:  41, ports: 26200,  util: 64, tech: 'XGS-PON', passed:  28_000, take: 28, xgsPct: 12 },
  { region: 'Other',     olts: 214, ports: 136800, util: 52, tech: 'mixed',   passed: 982_000, take: 36, xgsPct: 28 },
]

const PON_MIX = [
  { name: 'XGS-PON (10G)', value: 58, color: BLUE },
  { name: 'GPON (2.5G)',   value: 38, color: NAVY },
  { name: 'P2P fibre',     value:  4, color: SLATE },
]

const SPLIT_RATIOS = [
  { ratio: '1:32',  share: 46, note: 'Standard residential' },
  { ratio: '1:64',  share: 34, note: 'Dense urban' },
  { ratio: '1:16',  share: 14, note: 'Premium / business' },
  { ratio: '1:128', share:  6, note: 'XGS-PON high-density' },
]

const OVERBUILD = [
  { area: 'Nassau Zurenborg',       ourPass: 184_000, altFiber: 3, status: 'high-overbuild' },
  { area: 'Freeport Patershol',  ourPass: 142_000, altFiber: 4, status: 'high-overbuild' },
  { area: 'Abaco South',     ourPass:  68_000, altFiber: 2, status: 'medium'         },
  { area: 'Rural Out Islands',      ourPass:  41_000, altFiber: 0, status: 'monopoly'       },
  { area: 'Bimini North',     ourPass:  52_000, altFiber: 2, status: 'medium'         },
]

const TAKE_TREND = [
  { m: 'Jan', overall: 33, xgs: 24, gpon: 9 }, { m: 'Feb', overall: 34, xgs: 26, gpon: 8 },
  { m: 'Mar', overall: 35, xgs: 28, gpon: 7 }, { m: 'Apr', overall: 36, xgs: 30, gpon: 6 },
  { m: 'May', overall: 37, xgs: 34, gpon: 3 }, { m: 'Jun', overall: 38, xgs: 38, gpon: 0 },
]

const BUILD_PROGRESS = [
  { q: 'Q3-24', passed: 1_380_000, target: 1_450_000 }, { q: 'Q4-24', passed: 1_480_000, target: 1_600_000 },
  { q: 'Q1-25', passed: 1_560_000, target: 1_750_000 }, { q: 'Q2-25', passed: 1_640_000, target: 1_900_000 },
  { q: 'Q3-25', passed: 1_690_000, target: 2_000_000 }, { q: 'Q4-25', passed: 1_720_000, target: 2_100_000 },
  { q: 'Q1-26', passed: 1_730_000, target: 2_100_000 }, { q: 'Q2-26', passed: 1_740_000, target: 2_100_000 },
]

const ONT_HEALTH = [
  { cat: 'Firmware compliant', pct: 96.4, color: GREEN  },
  { cat: 'Pending OTA update', pct:  3.1, color: AMBER  },
  { cat: 'Non-reachable',      pct:  0.5, color: '#ef4444' },
]

const ONT_ALARMS = [
  { type: 'DyingGasp',          count: 182, trend: 'stable',  sev: 'Med'  },
  { type: 'LOS (Loss of Signal)', count:  64, trend: 'rising',  sev: 'High' },
  { type: 'FEC errors',          count:  38, trend: 'falling', sev: 'Low'  },
  { type: 'Optical Rx low',      count:  28, trend: 'stable',  sev: 'Low'  },
  { type: 'Firmware mismatch',   count: 318, trend: 'falling', sev: 'Med'  },
]

const SPLITTER_UTIL = [
  { node: 'ANT-CTR-SP01', ratio: '1:64', filled: 61, capacity: 64, loc: 'Nassau Zurenborg'   },
  { node: 'ANT-CTR-SP02', ratio: '1:64', filled: 58, capacity: 64, loc: 'Nassau Zurenborg'   },
  { node: 'GNT-PAT-SP01', ratio: '1:64', filled: 62, capacity: 64, loc: 'Freeport Patershol' },
  { node: 'BRG-SGL-SP01', ratio: '1:32', filled: 29, capacity: 32, loc: 'Abaco South' },
  { node: 'ANT-ZUI-SP01', ratio: '1:32', filled: 28, capacity: 32, loc: 'Nassau Zuid'  },
  { node: 'LVN-KLO-SP01', ratio: '1:32', filled: 24, capacity: 32, loc: 'Eleuthera Kessel-Lo'  },
]

const COPPER_DECOM = [
  { exchange: 'ANT-BER', copperLines: 8420, ftthPassed: 100, ftthTake: 68, targetDecom: 'Q3-26', status: 'On-track' },
  { exchange: 'GNT-LED',     copperLines: 6240, ftthPassed: 100, ftthTake: 62, targetDecom: 'Q4-26', status: 'On-track' },
  { exchange: 'BRG-ASB',    copperLines: 4810, ftthPassed:  88, ftthTake: 54, targetDecom: 'Q1-27', status: 'At-risk'  },
  { exchange: 'LVN-EAST',       copperLines: 3920, ftthPassed:  74, ftthTake: 42, targetDecom: 'Q2-27', status: 'At-risk'  },
  { exchange: 'MEC-NEK',    copperLines: 2840, ftthPassed:  96, ftthTake: 58, targetDecom: 'Q3-26', status: 'On-track' },
]

const COPPER_TREND = [
  { m: 'Jan', lines: 284_000 }, { m: 'Feb', lines: 271_000 }, { m: 'Mar', lines: 258_000 },
  { m: 'Apr', lines: 244_000 }, { m: 'May', lines: 231_000 }, { m: 'Jun', lines: 218_000 },
]

const CHURN_BY_REGION = [
  { region: 'Nassau',    churn: 1.8, nps: 42 }, { region: 'Freeport', churn: 2.1, nps: 40 },
  { region: 'Abaco',  churn: 2.4, nps: 37 }, { region: 'Eleuthera',   churn: 2.6, nps: 35 },
  { region: 'Bimini',    churn: 1.6, nps: 44 },
]

const CAPEX_PLAN = [
  { type: 'XGS-PON deployment',    q1: 18, q2: 22, q3: 28, q4: 24 },
  { type: 'GPON upgrade',          q1:  8, q2:  6, q3:  4, q4:  3 },
  { type: 'Copper decommission',   q1:  3, q2:  4, q3:  5, q4:  5 },
  { type: 'ONT fleet refresh',     q1:  2, q2:  2, q3:  3, q4:  2 },
]

type TabId = 'overview' | 'inventory' | 'topology' | 'ont' | 'build' | 'copper' | 'churn' | 'capex'
const TABS: { id: TabId; label: string; icon: typeof Server }[] = [
  { id: 'overview',   label: 'Overview',        icon: Gauge        },
  { id: 'inventory',  label: 'OLT Inventory',   icon: Server       },
  { id: 'topology',   label: 'PON Topology',    icon: Network      },
  { id: 'ont',        label: 'ONT Health',      icon: Activity     },
  { id: 'build',      label: 'Build Progress',  icon: TrendingUp   },
  { id: 'copper',     label: 'Copper Decom',    icon: Cable        },
  { id: 'churn',      label: 'Churn & NPS',     icon: ShieldCheck  },
  { id: 'capex',      label: 'CapEx Plan',      icon: Layers       },
]

export default function FixedAccessPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [overbuildSort, setOverbuildSort] = useState<'pass' | 'alt'>('pass')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const totalOlts  = OLT_REGIONS.reduce((s, r) => s + r.olts, 0)
  const totalPorts = OLT_REGIONS.reduce((s, r) => s + r.ports, 0)
  const totalPassed = OLT_REGIONS.reduce((s, r) => s + r.passed, 0)

  const filteredOlts = useMemo(
    () => regionFilter === 'All' ? OLT_REGIONS : OLT_REGIONS.filter(r => r.region === regionFilter),
    [regionFilter],
  )

  const sortedOverbuild = useMemo(
    () => [...OVERBUILD].sort((a, b) => overbuildSort === 'pass' ? b.ourPass - a.ourPass : b.altFiber - a.altFiber),
    [overbuildSort],
  )

  const avgTake = useMemo(
    () => Math.round(OLT_REGIONS.reduce((s, r) => s + r.take, 0) / OLT_REGIONS.length),
    [],
  )

  const portUtilAvg = useMemo(
    () => Math.round(filteredOlts.reduce((s, r) => s + r.util, 0) / (filteredOlts.length || 1)),
    [filteredOlts],
  )

  const statusColor = (s: string) =>
    s === 'monopoly' ? 'bg-emerald-100 text-emerald-700' : s === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const stP = (s: string) =>
    s === 'On-track' ? 'bg-emerald-100 text-emerald-700' : s === 'At-risk' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const sevC = (s: string) =>
    s === 'Low' ? 'bg-blue-100 text-blue-700' : s === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const trendC = (s: string) =>
    s === 'falling' ? 'text-emerald-600' : s === 'rising' ? 'text-red-600' : 'text-amber-600'

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Fixed Access — FTTH / PON')}
        subtitle={tt('GPON · XGS-PON coverage · ONT health · homes passed · take-up · copper decommission')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{(totalPassed / 1e6).toFixed(2)}{tt('M passed · ')}{liveTime}
            </span>
            <Link to="/portal/coverage" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {tt('Coverage Map')}
            </Link>
          </div>
        }
      />

      {/* ML Insight */}
      <MlInsightSection
        heading="Fixed access intelligence"
        models={[
          { name: 'Take-up Propensity Model',  metric: 'AUC 0.82', sub: 'address-level take probability' },
          { name: 'ONT Fault Predictor',       metric: 'recall 0.88', sub: 'DyingGasp & LOS early warning' },
          { name: 'Copper-decom Sequencer',    metric: 'ROI +31%', sub: 'exchange-level cost/benefit' },
        ]}
        agentLabel={tt('Run Fixed Access Planner')}
        agentRunningLabel={tt('Modelling…')}
        agentSteps={[
          'Ranked addresses by take-up propensity using 18-month behavioural data',
          'Mapped FTTH readiness vs copper retirement schedule by exchange',
          'Sized ONT fleet OTA backlog — prioritised LOS and DyingGasp cohorts',
          'Drafted XGS-PON civil-works priority queue for Q3 board',
        ]}
        agentBlurb={tt('Unifying take-up, ONT telemetry, and copper-switch data in one telemetry lake means the sequencing model can optimise decommission cost, capex, and churn risk simultaneously.')}
        decision={{
          title: tt('Accelerate XGS-PON build in Bimini — lowest overbuild, highest take headroom'),
          detail: tt('Propensity model scores Bimini 28% current take vs 44% addressable. Only 2 overbuilders vs 3–4 in Nassau/Freeport. Civil-works backlog is smallest — Q3 completion feasible with current contractor capacity.'),
          impact: tt('+BSD 1.4M ARR · de-risks copper decom schedule Q3-26'),
          risk: tt('ONT procurement lead-time 10 weeks'),
          linkTo: '#/portal/fixed-access',
          linkLabel: tt('Open Fixed Access →'),
        }}
        chart={{
          kind: 'area',
          title: tt('Overall & XGS-PON take-up trend (%)'),
          xKey: 'm',
          unit: '%',
          data: TAKE_TREND,
          series: [
            { key: 'overall', name: tt('Overall take rate'), color: BLUE  },
            { key: 'xgs',     name: tt('XGS-PON share'),    color: GREEN },
          ],
          note: tt('XGS-PON share accelerating — crossing overall take rate by end of Q3.'),
        }}
      />

      {/* Alert banner */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Nassau OLTs at 73% · Abaco GPON copper decom at-risk · 318 ONTs with firmware mismatch')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('LOS alarm count rising in Nassau Zurenborg — splitter inspection required. GNT-Eixample 4 overbuilders.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/fixed-access" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Fixed Access →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pill tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ══ OVERVIEW ═══════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Homes passed')}       value={`${(totalPassed / 1e6).toFixed(2)}M`} delta={tt('vs 2.10M EOY')}       trend="up"   icon={Server}    accent />
          <KpiCard label={tt('Active OLTs')}         value={totalOlts.toLocaleString()}           delta={tt('+38 XGS-PON YTD')}   trend="up"   icon={Network}         />
          <KpiCard label={tt('Total PON ports')}     value={`${(totalPorts / 1e6).toFixed(2)}M`} delta={tt('63% utilised')}       trend="flat" icon={Gauge}           />
          <KpiCard label={tt('Avg take rate')}       value={`${avgTake}%`}                        delta="+2 pp QoQ"               trend="up"   icon={TrendingUp}      />
          <KpiCard label={tt('XGS-PON share')}       value="58%"                                  delta="+14 pp YoY"              trend="up"   icon={Zap}             />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Build progress — quarterly homes passed vs target')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={BUILD_PROGRESS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="passed" name={tt('Homes passed')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Take-up trend — overall vs XGS-PON (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={TAKE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="overall" name={tt('Overall take')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="xgs"     name={tt('XGS-PON')}      stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="gpon"    name={tt('GPON')}          stroke={SLATE} fill={SLATE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Regional OLT & take rate scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th>{tt('Technology')}</th>
                  <th className="text-right">{tt('OLTs')}</th>
                  <th className="text-right">{tt('Homes passed')}</th>
                  <th className="text-right">{tt('Take %')}</th>
                  <th className="text-right">{tt('XGS %')}</th>
                  <th className="text-right">{tt('Port util %')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOlts.map(r => (
                  <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{r.region}</td>
                    <td><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{r.tech}</span></td>
                    <td className="text-right font-mono">{r.olts}</td>
                    <td className="text-right font-mono text-xs">{r.passed.toLocaleString('en-BS')}</td>
                    <td className={`text-right font-bold ${r.take >= 38 ? 'text-emerald-600' : r.take >= 32 ? 'text-amber-600' : 'text-red-600'}`}>{r.take}%</td>
                    <td className="text-right">{r.xgsPct}%</td>
                    <td className={`text-right font-bold ${r.util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.util}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
          </div>
        </Panel>

        {/* Overview KPI extras */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <KpiCard label={tt('Highest take rate')} value="41%" delta={tt('Abaco — XGS-PON')}     trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Lowest take rate')}  value="28%" delta={tt('Bimini — build focus')}   trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('Avg port util')}      value="63%" delta={tt('across all regions')}    trend="flat" icon={Gauge}         />
        </div>

        <div className="mt-6">
          <Panel title={tt('FTTH overbuild snapshot — homes passed vs alt-fibre competitors')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={OVERBUILD}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="area" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), '']} />
                  <Bar dataKey="ourPass" name={tt('Homes passed')} radius={[4, 4, 0, 0]}>
                    {OVERBUILD.map((o, i) => <Cell key={i} fill={o.altFiber >= 3 ? '#ef4444' : o.altFiber >= 1 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Red = 3+ competing operators · Amber = 1-2 · Green = monopoly zone')}</div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/coverage" className="font-bold text-vfes-dark hover:underline">{tt('Coverage Map →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/inventory" className="font-bold text-vfes-dark hover:underline">{tt('Full Inventory →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ OLT INVENTORY ═══════════════════════════════════════════════════════ */}
      {tab === 'inventory' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active OLTs')}           value={totalOlts.toLocaleString()} delta={tt('+38 XGS-PON YTD')}  trend="up"   icon={Server}        accent />
          <KpiCard label={tt('Total PON ports')}        value={`${(totalPorts/1e6).toFixed(2)}M`} delta={tt('63% utilised')} trend="flat" icon={Network}       />
          <KpiCard label={tt('XGS-PON share')}          value="58%"                          delta={tt('+14 pp YoY')}        trend="up"   icon={Gauge}          />
          <KpiCard label={tt('ONT firmware compliant')} value="96.4%"                         delta={tt('3.6% pending OTA')} trend="up"   icon={AlertTriangle}  />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', ...OLT_REGIONS.map(r => r.region)].map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                regionFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('OLT port utilisation by region (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredOlts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="util" name={tt('Port util %')} radius={[4, 4, 0, 0]}>
                    {filteredOlts.map((r, i) => <Cell key={i} fill={r.util >= 70 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine y={70} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('OLT count by region')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredOlts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="olts" name={tt('OLTs')} fill={NAVY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('OLT & port utilisation detail')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th>{tt('Technology')}</th>
                  <th className="text-right">{tt('OLTs')}</th>
                  <th className="text-right">{tt('Ports')}</th>
                  <th className="text-right">{tt('Util %')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOlts.map(r => (
                  <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{r.region}</td>
                    <td><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{r.tech}</span></td>
                    <td className="text-right font-mono">{r.olts}</td>
                    <td className="text-right font-mono">{r.ports.toLocaleString('en-BS')}</td>
                    <td className="text-right"><span className={r.util >= 70 ? 'text-amber-600 font-bold' : 'font-mono'}>{r.util}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/inventory" className="font-bold text-vfes-dark hover:underline">{tt('Full Inventory →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/fixed-access" className="font-bold text-vfes-dark hover:underline">{tt('Fixed Access →')}</Link>
          </div>
        </Panel>

        {/* OLT ports & tech breakdown */}
        <Panel title={tt('OLT port capacity & take rate by region — full detail')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={filteredOlts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="r" dataKey="ports" name={tt('Total ports')} fill={SLATE} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="util" name={tt('Util %')} stroke={AMBER} strokeWidth={2.4} dot />
                  <ReferenceLine yAxisId="l" y={70} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Region')}</th>
                    <th className="text-right">{tt('Ports')}</th>
                    <th className="text-right">{tt('Util')}</th>
                    <th className="text-right">{tt('Take %')}</th>
                    <th className="text-right">{tt('XGS %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOlts.map(r => (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-1.5 font-semibold">{r.region}</td>
                      <td className="text-right font-mono">{r.ports.toLocaleString('en-BS')}</td>
                      <td className={`text-right font-bold ${r.util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.util}%</td>
                      <td className={`text-right font-bold ${r.take >= 38 ? 'text-emerald-600' : r.take >= 32 ? 'text-amber-600' : 'text-red-600'}`}>{r.take}%</td>
                      <td className="text-right">{r.xgsPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex gap-3 text-xs">
                <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
                <span className="text-vfes-dark/40">·</span>
                <Link to="/portal/slicing" className="font-bold text-vfes-dark hover:underline">{tt('5G Slicing →')}</Link>
              </div>
            </div>
          </div>
        </Panel>
      </>)}

      {/* ══ TOPOLOGY ═════════════════════════════════════════════════════════════ */}
      {tab === 'topology' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('XGS-PON share')}      value="58%"  delta="+14 pp YoY"                   trend="up"   icon={Zap}       accent />
          <KpiCard label={tt('GPON share')}           value="38%"  delta={tt('decom pipeline active')}   trend="down" icon={Server}         />
          <KpiCard label={tt('Most common split')}   value="1:64" delta={tt('34% of infrastructure')}  trend="flat" icon={Network}        />
          <KpiCard label={tt('P2P fibre share')}      value="4%"   delta={tt('business estate')}         trend="flat" icon={Cable}          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('PON technology mix (% ports)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={PON_MIX} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} label={(d: { name: string; value: number }) => `${d.value}%`}>
                    {PON_MIX.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Splitter ratio distribution')}>
            <div className="space-y-3 mt-2">
              {SPLIT_RATIOS.map(s => (
                <div key={s.ratio} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold">{s.ratio}</span>
                    <span className="text-xs text-vfes-dark/55">{tt(s.note)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded bg-vfes-red" style={{ width: `${s.share * 2}%` }} />
                    </div>
                    <span className="font-mono text-xs w-10 text-right">{s.share}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-vfes-dark/55">{tt('Higher split ratios improve port economics but reduce per-subscriber bandwidth headroom at high utilisation.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Splitter node utilisation — top sites')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SPLITTER_UTIL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="node" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="filled"   name={tt('Filled')}   stackId="s" fill={BLUE}   radius={[0, 0, 0, 0]} />
                  <Bar dataKey="capacity" name={tt('Capacity')} stackId="s" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Node')}</th>
                    <th>{tt('Ratio')}</th>
                    <th className="text-right">{tt('Filled')}</th>
                    <th className="text-right">{tt('Capacity')}</th>
                    <th className="text-right">{tt('Util %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SPLITTER_UTIL.map(s => (
                    <tr key={s.node} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs font-semibold">{s.node}</td>
                      <td className="font-mono text-xs">{s.ratio}</td>
                      <td className="text-right font-mono">{s.filled}</td>
                      <td className="text-right font-mono">{s.capacity}</td>
                      <td className={`text-right font-bold ${
                        Math.round(s.filled / s.capacity * 100) >= 90 ? 'text-red-600' :
                        Math.round(s.filled / s.capacity * 100) >= 75 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{Math.round(s.filled / s.capacity * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </>)}

      {/* ══ ONT HEALTH ═══════════════════════════════════════════════════════════ */}
      {tab === 'ont' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Firmware compliant')} value="96.4%" delta={tt('3.6% pending OTA')}        trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('LOS alarms active')}  value="64"    delta={tt('rising — inspect cable')} trend="down" icon={AlertTriangle}       />
          <KpiCard label={tt('DyingGasp events')}   value="182"   delta={tt('stable 30d')}               trend="flat" icon={Activity}            />
          <KpiCard label={tt('OTA pending')}         value="318"   delta={tt('firmware mismatch')}       trend="flat" icon={Bell}               />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('ONT fleet health breakdown')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={ONT_HEALTH} dataKey="pct" innerRadius={45} outerRadius={75} paddingAngle={2}
                    label={(d: { cat: string; pct: number }) => `${d.pct}%`} labelLine={false}>
                    {ONT_HEALTH.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('ONT alarm register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Alarm type')}</th>
                    <th className="text-right">{tt('Count')}</th>
                    <th>{tt('Trend')}</th>
                    <th>{tt('Severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ONT_ALARMS.map(a => (
                    <tr key={a.type} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(a.type)}</td>
                      <td className="text-right font-mono font-bold">{a.count}</td>
                      <td className={`text-xs font-bold ${trendC(a.trend)}`}>{tt(a.trend)}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevC(a.sev)}`}>{tt(a.sev)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/noc-map" className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ BUILD PROGRESS ═══════════════════════════════════════════════════════ */}
      {tab === 'build' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Homes passed')}      value={`${(totalPassed/1e6).toFixed(2)}M`} delta={tt('vs 2.10M EOY target')} trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('YTD build pace')}    value="+18K/mo"   delta={tt('on track to EOY')}            trend="up"   icon={Activity}       />
          <KpiCard label={tt('Build completion')}  value="83%"        delta={tt('of 2.10M target')}           trend="up"   icon={Gauge}          />
          <KpiCard label={tt('FTTH overbuild')}    value="2 areas"   delta={tt('defend strategy active')}    trend="flat" icon={MapPin}          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Quarterly build — homes passed vs target')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={BUILD_PROGRESS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="passed" name={tt('Homes passed')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Build target')} stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={2_100_000} stroke={GREEN} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Green = 2.10M EOY full-build target. Pace needs +22K/mo to close the gap.')}</div>
          </Panel>

          <Panel title={tt('FTTH overbuild — homes passed vs competing fibre')}>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
                {(['pass', 'alt'] as const).map(k => (
                  <button key={k} onClick={() => setOverbuildSort(k)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                      overbuildSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                    }`}>
                    {k === 'pass' ? tt('Homes passed') : tt('Competitors')}
                  </button>
                ))}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Area')}</th>
                    <th className="text-right">{tt('Homes passed')}</th>
                    <th className="text-right">{tt('Alt fibre')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOverbuild.map(o => (
                    <tr key={o.area} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{o.area}</td>
                      <td className="text-right font-mono">{o.ourPass.toLocaleString('en-BS')}</td>
                      <td className="text-right font-mono">{o.altFiber}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(o.status)}`}>{tt(o.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Regional build completion */}
        <Panel title={tt('Regional build completion — homes passed vs target')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Passed')}</th>
                  <th className="text-right">{tt('Target')}</th>
                  <th className="text-right">{tt('Completion %')}</th>
                  <th className="text-right">{tt('Take %')}</th>
                  <th>{tt('Technology')}</th>
                </tr>
              </thead>
              <tbody>
                {OLT_REGIONS.filter(r => r.region !== 'Other').map(r => {
                  const target = Math.round(r.passed / 0.83)
                  const pct = Math.round(r.passed / target * 100)
                  return (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{r.region}</td>
                      <td className="text-right font-mono text-xs">{r.passed.toLocaleString('en-BS')}</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/55">{target.toLocaleString('en-BS')}</td>
                      <td className={`text-right font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</td>
                      <td className={`text-right font-bold ${r.take >= 38 ? 'text-emerald-600' : 'text-amber-600'}`}>{r.take}%</td>
                      <td><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{r.tech}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/coverage" className="font-bold text-vfes-dark hover:underline">{tt('Coverage Map →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ COPPER DECOM ════════════════════════════════════════════════════════ */}
      {tab === 'copper' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active copper lines')}  value="218K"    delta="−23% YTD"                trend="up"   icon={Cable}       accent />
          <KpiCard label={tt('Exchanges on-track')}   value="3 / 5"   delta={tt('2 at-risk')}          trend="flat" icon={ShieldCheck}       />
          <KpiCard label={tt('Decom target')}         value="Dec-27"   delta={tt('5 exchanges')}       trend="flat" icon={Gauge}             />
          <KpiCard label={tt('OPEX saving on decom')} value="BSD 1.8M/yr" delta={tt('per 100K lines')}    trend="up"   icon={TrendingUp}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Copper line decommission trend (lines active)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={COPPER_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), tt('copper lines')]} />
                  <Area type="monotone" dataKey="lines" name={tt('Active copper lines')} stroke={AMBER} fill={AMBER} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Declining at −23% YTD as FTTH take-up accelerates across exchanges.')}</div>
          </Panel>

          <Panel title={tt('Copper decom register by exchange')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Exchange')}</th>
                    <th className="text-right">{tt('Copper lines')}</th>
                    <th className="text-right">{tt('FTTH pass %')}</th>
                    <th className="text-right">{tt('Take %')}</th>
                    <th>{tt('Decom target')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COPPER_DECOM.map(c => (
                    <tr key={c.exchange} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-semibold">{c.exchange}</td>
                      <td className="text-right font-mono">{c.copperLines.toLocaleString()}</td>
                      <td className={`text-right font-bold ${c.ftthPassed >= 95 ? 'text-emerald-600' : c.ftthPassed >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{c.ftthPassed}%</td>
                      <td className={`text-right font-bold ${c.ftthTake >= 60 ? 'text-emerald-600' : c.ftthTake >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{c.ftthTake}%</td>
                      <td className="text-xs font-mono">{c.targetDecom}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ CHURN & NPS ═══════════════════════════════════════════════════════════ */}
      {tab === 'churn' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg churn rate')}    value="2.1%"  delta="−0.3 pp YoY"          trend="up"   icon={Activity}   accent />
          <KpiCard label={tt('Bimini NPS')}         value="44"    delta={tt('best region')}      trend="up"   icon={ShieldCheck}      />
          <KpiCard label={tt('Eleuthera churn')}      value="2.6%"  delta={tt('highest — overbuild')} trend="down" icon={AlertTriangle}  />
          <KpiCard label={tt('Nassau NPS')}         value="42"    delta="+4 pts YoY"             trend="up"   icon={TrendingUp}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Churn rate by region (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CHURN_BY_REGION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 3.5]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="churn" name={tt('Churn %')} radius={[4, 4, 0, 0]}>
                    {CHURN_BY_REGION.map((r, i) => <Cell key={i} fill={r.churn >= 2.4 ? '#ef4444' : r.churn >= 2.0 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={2.0} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('NPS by region')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CHURN_BY_REGION} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[0, 55]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="nps" name={tt('NPS')} fill={NAVY} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={40} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-1">{tt('B2B & Residential insights')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Full churn cohort analysis, NPS driver model, and retention campaign performance are in the B2B and AI Insights dashboards.')}</div>
          </div>
          <Link to="/portal/b2b" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open B2B →')}
          </Link>
        </div>

        <Panel title={tt('Churn & NPS region scorecard')} action={undefined}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Take %')}</th>
                  <th className="text-right">{tt('Churn %')}</th>
                  <th className="text-right">{tt('NPS')}</th>
                  <th>{tt('Strategy')}</th>
                </tr>
              </thead>
              <tbody>
                {CHURN_BY_REGION.map(r => {
                  const take = OLT_REGIONS.find(o => o.region === r.region)?.take ?? 36
                  return (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{r.region}</td>
                      <td className={`text-right font-bold ${take >= 38 ? 'text-emerald-600' : 'text-amber-600'}`}>{take}%</td>
                      <td className={`text-right font-bold ${r.churn >= 2.4 ? 'text-red-600' : r.churn >= 2.0 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.churn}%</td>
                      <td className={`text-right font-bold ${r.nps >= 42 ? 'text-emerald-600' : 'text-amber-600'}`}>{r.nps}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          r.churn >= 2.4 ? 'bg-red-100 text-red-700' : r.churn >= 2.0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{r.churn >= 2.4 ? tt('Defend') : r.churn >= 2.0 ? tt('Watch') : tt('Grow')}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ CAPEX PLAN ════════════════════════════════════════════════════════════ */}
      {tab === 'capex' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Fixed access CapEx FY26')} value="BSD 120M" delta={tt('board approved')}    trend="flat" icon={TrendingUp}  accent />
          <KpiCard label={tt('XGS-PON deployment')}       value="BSD 92M"  delta={tt('77% of envelope')}  trend="up"   icon={Zap}              />
          <KpiCard label={tt('Copper decom budget')}       value="BSD 17M"  delta={tt('5 exchanges')}      trend="flat" icon={Cable}            />
          <KpiCard label={tt('ONT fleet refresh')}         value="BSD 9M"   delta={tt('Q3 delivery')}      trend="flat" icon={Activity}         />
        </div>

        <Panel title={tt('CapEx allocation by quarter (BSD M) — FY2026')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={CAPEX_PLAN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" BSD M" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="q1" name={tt('Q1')} stackId="q" fill={BLUE}   radius={[0, 0, 0, 0]} />
                <Bar dataKey="q2" name={tt('Q2')} stackId="q" fill={NAVY}   radius={[0, 0, 0, 0]} />
                <Bar dataKey="q3" name={tt('Q3')} stackId="q" fill={GREEN}  radius={[0, 0, 0, 0]} />
                <Bar dataKey="q4" name={tt('Q4')} stackId="q" fill={PURPLE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cto" className="font-bold text-vfes-dark hover:underline">{tt('CTO Dashboard →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>

        <Panel title={tt('CapEx programme detail — FY2026')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Programme')}</th>
                  <th className="text-right">{tt('Q1 BSD M')}</th>
                  <th className="text-right">{tt('Q2 BSD M')}</th>
                  <th className="text-right">{tt('Q3 BSD M')}</th>
                  <th className="text-right">{tt('Q4 BSD M')}</th>
                  <th className="text-right">{tt('Total BSD M')}</th>
                </tr>
              </thead>
              <tbody>
                {CAPEX_PLAN.map(c => (
                  <tr key={c.type} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(c.type)}</td>
                    <td className="text-right font-mono">{c.q1}</td>
                    <td className="text-right font-mono">{c.q2}</td>
                    <td className="text-right font-mono">{c.q3}</td>
                    <td className="text-right font-mono">{c.q4}</td>
                    <td className="text-right font-bold text-vfes-dark">{c.q1 + c.q2 + c.q3 + c.q4}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-vfes-dark/10">
                  <td className="py-2 font-bold text-xs">{tt('Total')}</td>
                  {[1,2,3,4].map(q => (
                    <td key={q} className="text-right font-bold">
                      {CAPEX_PLAN.reduce((s, c) => s + (q===1?c.q1:q===2?c.q2:q===3?c.q3:c.q4), 0)}
                    </td>
                  ))}
                  <td className="text-right font-bold text-vfes-dark">
                    {CAPEX_PLAN.reduce((s, c) => s + c.q1 + c.q2 + c.q3 + c.q4, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* Always-visible footer */}
      <div className="mt-10 border-t border-black/5 pt-6">
        <div className="text-xs uppercase font-bold tracking-widest text-vfes-dark/45 mb-1">{tt('Fixed access — related pages')}</div>
        <p className="text-xs text-vfes-dark/55 mb-4">
          {tt('Cable Bahamas fixed access covers the FTTH/PON national footprint, OLT fleet, ONT health monitoring, copper decommission programme, and XGS-PON upgrade roadmap.')}
          {' '}{tt('All data refreshes every 15 minutes from the OSS telemetry pipeline.')}
          {' '}{tt('Source: Cable Bahamas OSS u00b7 Snowflake Data Platform.')}
        </p>        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/portal/network" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Network')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Core engineering')}</div>
          </Link>
          <Link to="/portal/coverage" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Coverage')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('FTTH coverage map')}</div>
          </Link>
          <Link to="/portal/inventory" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Inventory')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('ONT & OLT inventory')}</div>
          </Link>
          <Link to="/portal/b2b" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('B2B')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Enterprise fibre')}</div>
          </Link>
          <Link to="/portal/transport" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Transport')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Backbone & DWDM')}</div>
          </Link>
          <Link to="/portal/assurance" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Assurance')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Service quality')}</div>
          </Link>
          <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Capacity')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('CapEx & headroom')}</div>
          </Link>
          <Link to="/portal/cto" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('CTO')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Executive dashboard')}</div>
          </Link>
        </div>

        {/* ONT alarm quick table always visible */}
        <div className="mt-6">
          {/* Summary of alarm states across all regions — refreshes with OSS feed */}
          <Panel title={tt('ONT & network alarm summary — all regions')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Alarm type')}</th>
                    <th className="text-right">{tt('Active')}</th>
                    <th>{tt('Trend')}</th>
                    <th>{tt('Severity')}</th>
                    <th>{tt('Owner')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ONT_ALARMS.map(a => (
                    <tr key={a.type} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(a.type)}</td>
                      <td className="text-right font-mono font-bold">{a.count}</td>
                      <td className={`text-xs font-bold ${trendC(a.trend)}`}>{tt(a.trend)}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevC(a.sev)}`}>{tt(a.sev)}</span></td>
                      <td className="text-xs text-vfes-dark/55">{tt('Fixed Access NOC')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/noc-map" className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ran-energy" className="font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
