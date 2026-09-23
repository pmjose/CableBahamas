import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Radio, Calendar, Gauge, TrendingUp, Brain, ChevronRight, Layers,
  Globe, ShieldCheck, AlertTriangle, Zap, Activity, Signal, Cpu,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentAction from '../../components/AgentAction'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, RadialBar, RadialBarChart, Line, LineChart, Area, AreaChart,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const LIGHT = '#75CDF0'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'

// ─── Spectrum holdings by band ───────────────────────────────────────────────
const BANDS = [
  { band: '700 MHz',  mhz: 20,  type: 'FDD', use: '5G SA · coverage',  mhzPop: 99.4, expiry: '2038', color: NAVY,  util: 91 },
  { band: '800 MHz',  mhz: 20,  type: 'FDD', use: '4G · coverage',      mhzPop: 99.1, expiry: '2031', color: NAVY,  util: 88 },
  { band: '900 MHz',  mhz: 20,  type: 'FDD', use: '4G · GSM refarm',    mhzPop: 98.6, expiry: '2031', color: SLATE, util: 64 },
  { band: '1800 MHz', mhz: 40,  type: 'FDD', use: '4G · capacity',      mhzPop: 96.2, expiry: '2030', color: BLUE,  util: 76 },
  { band: '2100 MHz', mhz: 40,  type: 'FDD', use: '5G NSA · capacity',  mhzPop: 92.8, expiry: '2030', color: BLUE,  util: 68 },
  { band: '2600 MHz', mhz: 40,  type: 'FDD', use: '4G · urban',         mhzPop: 78.4, expiry: '2030', color: LIGHT, util: 61 },
  { band: '3.5 GHz',  mhz: 110, type: 'TDD', use: '5G SA · mid-band',   mhzPop: 84.0, expiry: '2038', color: BLUE,  util: 57 },
  { band: '26 GHz',   mhz: 400, type: 'TDD', use: '5G mmWave · FWA',    mhzPop: 12.0, expiry: '2039', color: LIGHT, util: 22 },
]

const REFARM = [
  { band: '900 MHz',  pct: 64, note: 'GSM → LTE/NR refarm' },
  { band: '1800 MHz', pct: 81, note: '2G shutdown complete' },
  { band: '2100 MHz', pct: 92, note: '3G off · NR DSS active' },
  { band: '2600 MHz', pct: 38, note: 'TDD/FDD rebalance' },
]

const VALUATION = [
  { band: '700 MHz',  eurMhzPop: 0.62 },
  { band: '800 MHz',  eurMhzPop: 0.48 },
  { band: '3.5 GHz',  eurMhzPop: 0.11 },
  { band: '26 GHz',   eurMhzPop: 0.01 },
]

const EXPIRY_TIMELINE = [
  { year: '2030', bands: '1800 · 2100 · 2600', risk: 'High',   mhz: 120, renewEst: 'BSD 680M–BSD 940M' },
  { year: '2031', bands: '800 · 900',           risk: 'Medium', mhz: 40,  renewEst: 'BSD 140M–BSD 220M' },
  { year: '2038', bands: '700 · 3.5 GHz',       risk: 'Low',    mhz: 130, renewEst: 'BSD 280M–BSD 420M' },
  { year: '2039', bands: '26 GHz',              risk: 'Low',    mhz: 400, renewEst: 'BSD 40M–BSD 80M'   },
]

// ─── Utilisation trend data ───────────────────────────────────────────────────
const UTIL_TREND = [
  { m: 'Jan', b700: 88, b1800: 72, b3500: 48, b26ghz: 18 },
  { m: 'Feb', b700: 89, b1800: 73, b3500: 50, b26ghz: 19 },
  { m: 'Mar', b700: 90, b1800: 74, b3500: 52, b26ghz: 20 },
  { m: 'Apr', b700: 91, b1800: 75, b3500: 54, b26ghz: 21 },
  { m: 'May', b700: 91, b1800: 76, b3500: 56, b26ghz: 21 },
  { m: 'Jun', b700: 91, b1800: 76, b3500: 57, b26ghz: 22 },
]

const UTIL_HOUR = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  b700: Math.round(82 + 14 * Math.sin((i - 3) / 3.8) + (i >= 18 && i <= 22 ? 9 : 0)),
  b3500: Math.round(48 + 22 * Math.sin((i - 3) / 3.5) + (i >= 18 && i <= 22 ? 15 : 0)),
}))

// ─── Regulatory & auction data ────────────────────────────────────────────────
const EU_HARMONISATION = [
  { band: '700 MHz',  standard: 'APT700 FDD',   status: 'Harmonised', note: 'EC Decision 2016/687' },
  { band: '800 MHz',  standard: '800 FDD',       status: 'Harmonised', note: 'EC Decision 2010/267' },
  { band: '1800 MHz', standard: '1800 FDD',      status: 'Harmonised', note: 'EC Decision 2009/766' },
  { band: '2100 MHz', standard: 'IMT-2000',      status: 'Harmonised', note: 'CEPT ECC/DEC/(06)01' },
  { band: '2600 MHz', standard: '2.6 GHz',       status: 'Harmonised', note: 'EC Decision 2008/411' },
  { band: '3.5 GHz',  standard: '3.4–3.8 GHz',  status: 'Harmonised', note: 'EC Decision 2019/235' },
  { band: '26 GHz',   standard: '24.25–27.5 GHz', status: 'Harmonised', note: 'EC Decision 2019/784' },
]

const COMPLIANCE_ITEMS = [
  { obligation: 'Coverage rollout (700 MHz)',  deadline: 'Q4-2026', progress: 94,  status: 'On track' },
  { obligation: '5G SA deployment obligation', deadline: 'Q2-2027', progress: 72,  status: 'On track' },
  { obligation: 'Rural coverage 90% pop',      deadline: 'Q4-2027', progress: 68,  status: 'At risk'  },
  { obligation: 'URCA spectrum audit',          deadline: 'Q3-2026', progress: 80,  status: 'On track' },
  { obligation: 'EMF compliance reporting',     deadline: 'Annual',  progress: 100, status: 'Done'     },
  { obligation: '26 GHz 5G deployment plan',    deadline: 'Q1-2027', progress: 42,  status: 'Planned'  },
]

const AUCTION_HISTORY = [
  { year: '2011', bands: '800/900/1800/2100/2600 MHz', spend: 'BSD 1.17B', MHz: 310 },
  { year: '2016', bands: '700 MHz (20 MHz)',           spend: 'BSD 0.41B', MHz: 20  },
  { year: '2018', bands: '3.5 GHz (110 MHz)',          spend: 'BSD 0.61B', MHz: 110 },
  { year: '2022', bands: '26 GHz (400 MHz)',           spend: 'BSD 0.18B', MHz: 400 },
]

// ─── Spectrum roadmap ─────────────────────────────────────────────────────────
const SPECTRUM_ROADMAP = [
  { initiative: '3.5 GHz 5G SA dense-urban rollout',       horizon: 'Q3-2026', invest: 'BSD 22M',          status: 'Active',   pct: 68 },
  { initiative: '700 MHz 5G SA re-farm (coverage)',         horizon: 'Q4-2026', invest: 'BSD 14M',          status: 'Active',   pct: 54 },
  { initiative: '2030 renewal reserve (120 MHz)',           horizon: 'Q2-2026', invest: 'BSD 780M reserve', status: 'Planning', pct: 28 },
  { initiative: '26 GHz FWA monetisation pilot',            horizon: 'H2-2026', invest: 'BSD 8M',           status: 'Planning', pct: 18 },
  { initiative: '900 MHz full GSM shutdown',                horizon: 'Q2-2027', invest: 'BSD 6M',           status: 'Active',   pct: 42 },
  { initiative: '1800 MHz DSS 5G NR activation (national)', horizon: 'H1-2027', invest: 'BSD 18M',          status: 'Planned',  pct: 12 },
]

const MNO_SPECTRUM_COMPARE = [
  { mno: 'Cable Bahamas', sub1ghz: 60, mid: 190, mmwave: 400 },
  { mno: 'BTC',  sub1ghz: 50, mid: 180, mmwave: 200 },
  { mno: 'Benchmark A',    sub1ghz: 40, mid: 150, mmwave: 200 },
  { mno: 'Benchmark B',  sub1ghz: 30, mid: 100, mmwave: 0   },
]

type TabId = 'holdings' | 'refarm' | 'lifecycle' | 'value' | 'utilisation' | 'regulatory' | 'auctions' | 'roadmap'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'holdings',   label: 'Holdings',    icon: Radio      },
  { id: 'utilisation',label: 'Utilisation', icon: Gauge      },
  { id: 'refarm',     label: 'Refarming',   icon: Layers     },
  { id: 'lifecycle',  label: 'Lifecycle',   icon: Calendar   },
  { id: 'value',      label: 'Valuation',   icon: TrendingUp },
  { id: 'auctions',   label: 'Auctions',    icon: Activity   },
  { id: 'regulatory', label: 'Regulatory',  icon: ShieldCheck},
  { id: 'roadmap',    label: 'Roadmap',     icon: Signal     },
]

export default function SpectrumPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('holdings')
  const [bandSort, setBandSort] = useState<'util' | 'mhz'>('util')
  const [complianceFilter, setComplianceFilter] = useState<string>('All')
  const [utilThreshold, setUtilThreshold] = useState<number>(60)
  const [auctionView, setAuctionView] = useState<'spend' | 'mhz'>('spend')
  const [showExpiryOnly, setShowExpiryOnly] = useState(false)

  const subGhz = ['700 MHz', '800 MHz', '900 MHz'].reduce((s, name) => s + (BANDS.find(b => b.band === name)?.mhz ?? 0), 0)
  const midBand = BANDS.find(b => b.band === '3.5 GHz')?.mhz ?? 0
  const mmwave = BANDS.find(b => b.band === '26 GHz')?.mhz ?? 0
  const licensedSub6 = BANDS.filter(b => b.band !== '26 GHz').reduce((s, b) => s + b.mhz, 0)

  const sortedBands = useMemo(
    () => [...BANDS].sort((a, b) => bandSort === 'util' ? b.util - a.util : b.mhz - a.mhz),
    [bandSort],
  )

  const filteredCompliance = useMemo(
    () => complianceFilter === 'All' ? COMPLIANCE_ITEMS : COMPLIANCE_ITEMS.filter(c => c.status === complianceFilter),
    [complianceFilter],
  )

  const highUtilBands = useMemo(
    () => BANDS.filter(b => b.util >= utilThreshold),
    [utilThreshold],
  )

  const expiryBands = useMemo(
    () => showExpiryOnly ? EXPIRY_TIMELINE.filter(e => e.risk === 'High') : EXPIRY_TIMELINE,
    [showExpiryOnly],
  )

  const auctionChartData = useMemo(
    () => AUCTION_HISTORY.map(a => ({ ...a, val: auctionView === 'spend' ? parseFloat(a.spend.replace('BSD ', '').replace('B', '')) : a.MHz })),
    [auctionView],
  )

  const riskColor = (r: string) =>
    r === 'High' ? 'bg-red-50 text-red-700' : r === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

  const stP = (s: string) =>
    s === 'Done' || s === 'Harmonised' ? 'bg-emerald-100 text-emerald-700' :
    s === 'On track' ? 'bg-emerald-100 text-emerald-700' :
    s === 'At risk'  ? 'bg-red-100 text-red-700' :
    s === 'Active'   ? 'bg-blue-100 text-blue-700' :
    'bg-amber-100 text-amber-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Spectrum Portfolio')}
        subtitle={tt('Licensed bands · MHz-pop coverage · refarming · expiry & valuation')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">{licensedSub6} MHz {tt('sub-6 GHz')}</span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">{tt('8 bands')}</span>
          </div>
        }
      />

      {/* ── ML Insight ──────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Spectrum intelligence"
        models={[
          { name: 'Band Utilisation Forecaster', metric: 'MAPE 5.2%', sub: '90d ahead per band per hour' },
          { name: 'Renewal Price Estimator',      metric: 'R² 0.86',   sub: 'EU comparable auction pricing' },
          { name: 'Refarming Optimiser',          metric: 'NPV +BSD 48M', sub: 'optimal legacy-off schedule' },
        ]}
        agentLabel="Run Spectrum Optimiser"
        agentRunningLabel="Optimising…"
        agentSteps={[
          'Scored 700 MHz for 5G SA re-farm eligibility across all sites',
          'Modelled 2030 auction renewal costs vs EU comparable auctions',
          'Sized treasury reserve to cover 120 MHz capacity-spectrum renewal',
          'Ranked refarming sequence by incremental throughput per BSD M spent',
        ]}
        agentBlurb="Snowflake ML models correlate band utilisation, device penetration and population density to produce a defensible renewal reserve and refarming priority list."
        decision={{
          title: 'Reserve BSD 780M for the 2030 capacity-spectrum renewal now',
          detail: '120 MHz of capacity spectrum (1800/2100/2600) expires in 2030. Comparable EU auctions imply BSD 680M–BSD 940M cost. Pre-funding the reserve eliminates the auction-cliff risk and signals continuity to bond markets.',
          impact: 'avoids BSD 0.6–0.9B auction-cliff exposure',
          risk: 'treasury opportunity cost ~4% per annum on reserve',
          linkTo: '#/portal/capacity-capex',
          linkLabel: 'Open Capacity & Capex',
        }}
        chart={{
          kind: 'line',
          title: 'Band utilisation trend — 6 months (%)',
          xKey: 'm',
          unit: '%',
          data: UTIL_TREND,
          series: [
            { key: 'b700',   name: '700 MHz',  color: NAVY  },
            { key: 'b1800',  name: '1800 MHz', color: BLUE  },
            { key: 'b3500',  name: '3.5 GHz',  color: AMBER },
            { key: 'b26ghz', name: '26 GHz',   color: SLATE },
          ],
          note: '700 MHz approaching 90% — triggers re-farming review threshold.',
        }}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
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

      {/* ════ HOLDINGS ════════════════════════════════════════════════════════ */}
      {tab === 'holdings' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Licensed sub-6 GHz')} value={`${licensedSub6} MHz`} delta={tt('+110 MHz vs 2023 (3.5 GHz)')} trend="up" icon={Radio} accent />
            <KpiCard label={tt('Sub-1 GHz (coverage)')} value={`${subGhz} MHz`} delta={tt('700/800/900 — rural reach')} trend="flat" icon={Gauge} />
            <KpiCard label={tt('Mid-band 3.5 GHz')} value={`${midBand} MHz`} delta={tt('5G SA capacity layer')} trend="up" icon={Layers} />
            <KpiCard label={tt('mmWave 26 GHz')} value={`${mmwave} MHz`} delta={tt('FWA / dense urban')} trend="flat" icon={Radio} />
          </div>

          {/* Sort control */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
            {(['util', 'mhz'] as const).map(k => (
              <button key={k} onClick={() => setBandSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  bandSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {k === 'util' ? tt('Utilisation') : tt('MHz')}
              </button>
            ))}
          </div>

          <Panel title={tt('Spectrum holdings by band (MHz)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sortedBands}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="band" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} label={{ value: 'MHz', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} MHz · ${p.payload.type} · ${p.payload.use}`, tt('Band')]} />
                  <Bar dataKey="mhz" radius={[6, 6, 0, 0]}>
                    {sortedBands.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Band detail — coverage & licence terms')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Band')}</th>
                    <th className="px-3 py-2">{tt('Duplex')}</th>
                    <th className="px-3 py-2">{tt('Primary use')}</th>
                    <th className="px-3 py-2 text-right">{tt('MHz held')}</th>
                    <th className="px-3 py-2 text-right">{tt('MHz-pop %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Util %')}</th>
                    <th className="px-3 py-2">{tt('Licence expiry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBands.map(b => (
                    <tr key={b.band} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{b.band}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{b.type}</span></td>
                      <td className="px-3 py-2">{tt(b.use)}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.mhz}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.mhzPop.toFixed(1)}%</td>
                      <td className={`px-3 py-2 text-right font-bold ${b.util >= 85 ? 'text-red-600' : b.util >= 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{b.util}%</td>
                      <td className="px-3 py-2 font-mono text-xs">{b.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Cortex AI: 700 MHz + 3.5 GHz pairing covers 99% population with 5G SA — defensible coverage-plus-capacity moat.')} <ChevronRight className="w-3 h-3" />
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link to="/portal/mobile-ran"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
              <Link to="/portal/core-5g"       className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            </div>
          </Panel>

          {/* MNO Spectrum Comparison */}
          <div className="mt-4">
            <Panel title={tt('MNO spectrum comparison — MHz by category')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={MNO_SPECTRUM_COMPARE}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="mno" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit=" MHz" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sub1ghz" fill={NAVY}   name={tt('Sub-1 GHz')} radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="mid"     fill={BLUE}   name={tt('Mid-band')}  stackId="a" />
                    <Bar dataKey="mmwave"  fill={LIGHT}  name={tt('mmWave')} radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Cable Bahamas leads on mmWave 26 GHz (400 MHz) and sub-1 GHz depth — structural coverage advantage.')}</div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ UTILISATION ═════════════════════════════════════════════════════ */}
      {tab === 'utilisation' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('700 MHz utilisation')} value="91%" delta={tt('approaching refarm threshold')} trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('3.5 GHz utilisation')} value="57%" delta={tt('5G SA ramping')} trend="up" icon={Signal} />
            <KpiCard label={tt('26 GHz utilisation')}  value="22%" delta={tt('FWA monetisation upside')} trend="up" icon={Zap} />
            <KpiCard label={tt('1800 MHz utilisation')} value="76%" delta={tt('stable')} trend="flat" icon={Activity} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Band utilisation trend — 6 months (%)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={UTIL_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[10, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="b700"   stroke={NAVY}  strokeWidth={2.4} name={tt('700 MHz')} />
                    <Line type="monotone" dataKey="b1800"  stroke={BLUE}  strokeWidth={2.0} name={tt('1800 MHz')} />
                    <Line type="monotone" dataKey="b3500"  stroke={AMBER} strokeWidth={2.0} name={tt('3.5 GHz')} />
                    <Line type="monotone" dataKey="b26ghz" stroke={SLATE} strokeWidth={1.6} strokeDasharray="4 4" name={tt('26 GHz')} />
                    <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 85% — triggers re-farming or augmentation review')}</div>
            </Panel>

            <Panel title={tt('Hourly utilisation profile — 700 MHz vs 3.5 GHz (%)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={UTIL_HOUR}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="#999" fontSize={9} interval={3} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[20, 110]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="b700"  stroke={NAVY}  fill={NAVY}  fillOpacity={0.2} name={tt('700 MHz')} />
                    <Area type="monotone" dataKey="b3500" stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('3.5 GHz')} />
                    <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Utilisation scorecard by band')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Band')}</th>
                    <th className="px-3 py-2">{tt('Primary use')}</th>
                    <th className="px-3 py-2 text-right">{tt('Utilisation %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Headroom %')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...BANDS].sort((a,b) => b.util - a.util).map(b => {
                    const headroom = 100 - b.util
                    const action = b.util >= 85 ? 'Re-farm / augment' : b.util >= 70 ? 'Monitor closely' : 'Headroom OK'
                    return (
                      <tr key={b.band} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{b.band}</td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(b.use)}</td>
                        <td className={`px-3 py-2 text-right font-bold ${b.util >= 85 ? 'text-red-600' : b.util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{b.util}%</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">{headroom}%</td>
                        <td className="px-3 py-2 text-xs">{tt(action)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/ran-energy"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ════ REFARMING ═══════════════════════════════════════════════════════ */}
      {tab === 'refarm' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('2G sites remaining')}   value="1,484"  delta={tt('target: 0 by 2027')} trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('3G sites (2100 MHz)')}   value="8%"     delta={tt('92% already off')} trend="up"   icon={Zap} />
            <KpiCard label={tt('900 MHz GSM refarmed')}  value="64%"    delta={tt('target 100% by Q2-27')} trend="up" icon={Radio} />
            <KpiCard label={tt('Refarm NPV opportunity')} value="+BSD 48M" delta={tt('throughput uplift')} trend="up"  icon={TrendingUp} />
          </div>

          <Panel title={tt('Refarming progress — legacy → 4G/5G')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={REFARM} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="band" stroke="#999" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% · ${p.payload.note}`, tt('Refarmed')]} />
                  <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill={BLUE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('2G shutdown targeted for 2027; 3G already off across 92% of the 2100 MHz grid.')}</div>
          </Panel>

          <div className="mt-4 grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Refarm milestone plan')}>
              <div className="space-y-3 py-2">
                {[
                  { phase: '900 MHz: GSM → NR DSS Phase 1',  pct: 64, eta: 'Q2-2026' },
                  { phase: '900 MHz: GSM → NR DSS Phase 2',  pct: 18, eta: 'Q4-2026' },
                  { phase: '900 MHz: Full GSM shutdown',      pct:  6, eta: 'Q2-2027' },
                  { phase: '2600 MHz: TDD/FDD rebalance',     pct: 38, eta: 'Q3-2026' },
                  { phase: '1800 MHz: DSS 5G NR national',   pct: 12, eta: 'H1-2027' },
                ].map(m => (
                  <div key={m.phase}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-semibold">{tt(m.phase)}</span>
                      <span className="text-xs text-vfes-dark/55 font-mono">{m.eta}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded bg-black/5 overflow-hidden">
                        <div className="h-full rounded bg-vfes-red" style={{ width: `${m.pct}%` }} />
                      </div>
                      <span className="font-mono text-xs">{m.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <Link to="/portal/network"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
                <Link to="/portal/cto"       className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Band utilisation: before vs after refarm (projected %)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={[
                    { band: '900 MHz',  before: 64, after: 38 },
                    { band: '1800 MHz', before: 76, after: 62 },
                    { band: '2100 MHz', before: 68, after: 52 },
                    { band: '2600 MHz', before: 61, after: 48 },
                  ]}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="band" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="before" fill={AMBER} name={tt('Before refarm %')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after"  fill={GREEN} name={tt('After refarm %')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ LIFECYCLE ═══════════════════════════════════════════════════════ */}
      {tab === 'lifecycle' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('MHz expiring 2030')} value="120 MHz" delta={tt('1800/2100/2600 — High risk')} trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('Renewal est. 2030')} value="~BSD 810M"  delta={tt('based on EU comparables')} trend="flat" icon={Gauge} />
            <KpiCard label={tt('MHz expiring 2031')} value="40 MHz"  delta={tt('800/900 MHz')} trend="flat" icon={Radio} />
            <KpiCard label={tt('Longest licence')}   value="2039"    delta={tt('26 GHz mmWave')} trend="flat" icon={Calendar} />
          </div>

          <Panel title={tt('Licence expiry timeline & renewal risk')}
            action={<AgentAction label="Reserve renewal capital" runningLabel="Modelling…"
              steps={[
                'Projected 2030 auction reserve price from comparable EU bands',
                'Sized renewal reserve for 120 MHz capacity spectrum',
                'Flagged to Finance — CapEx plan & treasury hold created',
              ]} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Year')}</th>
                    <th className="px-3 py-2">{tt('Bands expiring')}</th>
                    <th className="px-3 py-2 text-right">{tt('MHz at risk')}</th>
                    <th className="px-3 py-2">{tt('Renewal risk')}</th>
                    <th className="px-3 py-2 text-right">{tt('Renewal estimate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPIRY_TIMELINE.map(e => (
                    <tr key={e.year} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono font-bold">{e.year}</td>
                      <td className="px-3 py-2">{e.bands}</td>
                      <td className="px-3 py-2 text-right font-mono">{e.mhz}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(e.risk)}`}>{tt(e.risk)}</span></td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{e.renewEst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('120 MHz of capacity spectrum expires in 2030 — start renewal reserve now to avoid auction-cliff exposure.')}
            </div>
          </Panel>

          <div className="mt-4">
            <AgentDecision
              title={tt('Spectrum renewal recommendation')}
              label="Reserve renewal capital"
              runningLabel="Modelling…"
              steps={[
                'Projected 2030 auction reserve price from comparable EU bands',
                'Sized renewal reserve for 120 MHz capacity spectrum',
                'Flagged to Finance — CapEx plan & treasury hold created',
              ]}
              result={{
                headline: 'Pre-fund the 2030 capacity-spectrum renewal',
                stats: [
                  { label: 'Licensed sub-6 GHz', value: `${licensedSub6} MHz` },
                  { label: 'Sub-1 GHz (coverage)', value: `${subGhz} MHz` },
                  { label: 'Mid-band 3.5 GHz', value: `${midBand} MHz` },
                  { label: 'MHz expiring 2030', value: '120' },
                ],
                findings: [
                  '120 MHz across 1800/2100/2600 expires in 2030.',
                  'Securing a treasury reserve now de-risks the auction cliff.',
                  'Protects the 5G capacity layer and avoids bond-market uncertainty.',
                ],
                note: 'Treasury opportunity cost is the key trade-off.',
              }}
              impact="avoids ~BSD 0.6–0.9B auction-cliff exposure"
              risk="treasury opportunity cost"
              linkTo="#/portal/capacity-capex"
              linkLabel="Open Capacity & Capex"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/portal/network"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <Link to="/portal/cio"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('CIO page →')}</Link>
          </div>
        </>
      )}

      {/* ════ VALUATION ═══════════════════════════════════════════════════════ */}
      {tab === 'value' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Sub-1 GHz BSD /MHz-pop')} value="BSD 0.55"  delta={tt('700+800 weighted avg')} trend="flat" icon={Globe} accent />
            <KpiCard label={tt('3.5 GHz BSD /MHz-pop')}   value="BSD 0.11"  delta={tt('market comparable')} trend="flat" icon={Signal} />
            <KpiCard label={tt('Total portfolio value')} value="~BSD 2.8B" delta={tt('sub-6 GHz book est.')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('mmWave utilised')}       value="22%"    delta={tt('FWA upside potential')} trend="up" icon={Zap} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Spectrum valuation — BSD /MHz-pop')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={VALUATION}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="band" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} label={{ value: 'BSD /MHz-pop', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}`, tt('Value')]} />
                    <Bar dataKey="eurMhzPop" radius={[6, 6, 0, 0]} fill={NAVY} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Sub-1 GHz carries the premium — scarce, coverage-grade, and EU-harmonised.')}</div>
            </Panel>
            <Panel title={tt('Portfolio book value — utilisation by tier')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="30%" outerRadius="100%" data={[
                    { name: 'Sub-1 GHz', v: 86, fill: NAVY },
                    { name: 'Mid-band',  v: 64, fill: BLUE },
                    { name: 'mmWave',    v: 22, fill: LIGHT },
                  ]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="v" />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}% utilised`, '']} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {tt('mmWave only 22% utilised — FWA monetisation upside in dense urban footprints.')}
              </div>
            </Panel>
          </div>
          <div className="mt-3 flex gap-3">
            <Link to="/portal/slicing"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing →')}</Link>
            <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </>
      )}

      {/* ════ AUCTIONS ════════════════════════════════════════════════════════ */}
      {tab === 'auctions' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total auction spend')} value="BSD 2.37B" delta={tt('since 2011')} trend="flat" icon={Globe} accent />
            <KpiCard label={tt('Largest single auction')} value="BSD 1.17B" delta={tt('2011 multi-band')} trend="flat" icon={TrendingUp} />
            <KpiCard label={tt('Total MHz acquired')} value="840 MHz" delta={tt('sub-6 GHz + mmWave')} trend="up" icon={Radio} />
            <KpiCard label={tt('Next renewal window')} value="2030" delta={tt('120 MHz capacity block')} trend="flat" icon={Calendar} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Auction history — spend by year (BSD B)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={AUCTION_HISTORY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} label={{ value: 'BSD B', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="MHz" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('MHz acquired')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Auction spend vs MHz acquired')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Year')}</th>
                      <th className="px-3 py-2">{tt('Bands')}</th>
                      <th className="px-3 py-2 text-right">{tt('MHz')}</th>
                      <th className="px-3 py-2 text-right">{tt('Spend')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUCTION_HISTORY.map(a => (
                      <tr key={a.year} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-mono font-bold">{a.year}</td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/70">{a.bands}</td>
                        <td className="px-3 py-2 text-right font-mono">{a.MHz}</td>
                        <td className="px-3 py-2 text-right font-bold text-vfes-dark">{a.spend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-3">
                <Link to="/portal/cto"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
                <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ REGULATORY ══════════════════════════════════════════════════════ */}
      {tab === 'regulatory' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('EU harmonised bands')} value="7 / 7"  delta={tt('all bands harmonised')} trend="up" icon={ShieldCheck} accent />
            <KpiCard label={tt('Coverage obligations')} value="94%"    delta={tt('700 MHz · Q4-2026 deadline')} trend="up" icon={Globe} />
            <KpiCard label={tt('Rural 90% pop target')} value="68%"    delta={tt('at risk — Q4-2027')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('EMF compliance')}        value="100%"   delta={tt('annual audit passed')} trend="up" icon={Activity} />
          </div>

          {/* Compliance filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter status:')}</span>
            {['All', 'On track', 'At risk', 'Done', 'Planned'].map(s => (
              <button key={s} onClick={() => setComplianceFilter(s)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  complianceFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {tt(s)}
              </button>
            ))}
          </div>

          <Panel title={tt('Licence obligations & compliance tracker')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Obligation')}</th>
                    <th className="px-3 py-2">{tt('Deadline')}</th>
                    <th className="px-3 py-2">{tt('Progress')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompliance.map(c => (
                    <tr key={c.obligation} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(c.obligation)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{c.deadline}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded bg-black/5 overflow-hidden">
                            <div className="h-full rounded bg-vfes-red" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="font-mono text-xs">{c.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stP(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('EU harmonisation status by band')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Band')}</th>
                      <th className="px-3 py-2">{tt('Standard')}</th>
                      <th className="px-3 py-2">{tt('Status')}</th>
                      <th className="px-3 py-2">{tt('EC/CEPT Decision')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EU_HARMONISATION.map(e => (
                      <tr key={e.band} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{e.band}</td>
                        <td className="px-3 py-2 font-mono text-xs">{e.standard}</td>
                        <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stP(e.status)}`}>{tt(e.status)}</span></td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/65">{e.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-3">
                <Link to="/portal/assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
                <Link to="/portal/fraud"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud & Compliance →')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ ROADMAP ═════════════════════════════════════════════════════════ */}
      {tab === 'roadmap' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active initiatives')}   value="3"    delta={tt('of 6 in execution')} trend="up"   icon={Signal} accent />
            <KpiCard label={tt('Total programme spend')} value="BSD 68M" delta={tt('FY2026 spectrum opex+capex')} trend="flat" icon={Gauge} />
            <KpiCard label={tt('Renewal reserve needed')} value="BSD 780M" delta={tt('2030 auction cliff')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('26 GHz FWA revenue')}   value="BSD 4.2M" delta={tt('pilot H2-2026')} trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('Spectrum programme roadmap — FY2026–2027')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Initiative')}</th>
                    <th className="px-3 py-2">{tt('Horizon')}</th>
                    <th className="px-3 py-2 text-right">{tt('Investment')}</th>
                    <th className="px-3 py-2">{tt('Progress')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SPECTRUM_ROADMAP.map(r => (
                    <tr key={r.initiative} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(r.initiative)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.horizon}</td>
                      <td className="px-3 py-2 text-right font-bold text-xs">{r.invest}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded bg-black/5 overflow-hidden">
                            <div className="h-full rounded bg-vfes-red" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="font-mono text-xs">{r.pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stP(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/cto"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO roadmap →')}</Link>
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
              <Link to="/portal/mobile-ran"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Spectrum roadmap progress by initiative (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={SPECTRUM_ROADMAP} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="initiative" stroke="#999" fontSize={9} width={240}
                      tickFormatter={(v: string) => v.length > 34 ? v.slice(0, 34) + '…' : v} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Progress')]} />
                    <Bar dataKey="pct" name={tt('Progress %')} radius={[0, 4, 4, 0]}>
                      {SPECTRUM_ROADMAP.map((r, i) => <Cell key={i} fill={r.status === 'Active' ? BLUE : r.status === 'Planning' ? AMBER : SLATE} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/55">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: BLUE }} /> {tt('Active')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: AMBER }} /> {tt('Planning')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SLATE }} /> {tt('Planned')}</span>
              </div>
            </Panel>
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Spectrum strategy')}</div>
              <div className="text-sm text-vfes-dark/80">
                {tt('The 26 GHz mmWave block is only 22% utilised — FWA pilots in Q3-2026 target residential broadband density in Nassau and Freeport, with BSD 4.2M revenue expected in H2.')}
              </div>
            </div>
            <Link to="/portal/network" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0 ml-4">
              <Globe className="w-4 h-4" />{tt('Open Network →')}
            </Link>
          </div>
        </>
      )}

      {/* ── Footer quick-nav ─────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Related dashboards')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/portal/mobile-ran"    className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Mobile RAN')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('5G/4G coverage · PRB utilisation')}</div>
          </Link>
          <Link to="/portal/core-5g"       className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('5G Core Health')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('AMF · SMF · UPF · slices')}</div>
          </Link>
          <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Capacity & Capex')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Augmentation · headroom · budget')}</div>
          </Link>
          <Link to="/portal/cto"           className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('CTO Dashboard')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Network strategy · roadmap')}</div>
          </Link>
          <Link to="/portal/ran-energy"    className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('RAN Energy & ESG')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('kWh/GB · renewable · Net Zero')}</div>
          </Link>
          <Link to="/portal/slicing"       className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('5G Slicing & MEC')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('eMBB · URLLC · enterprise slices')}</div>
          </Link>
          <Link to="/portal/coverage"      className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Coverage')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('5G/4G coverage deep-dive')}</div>
          </Link>
          <Link to="/portal/ai-insights"   className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('AI Insights')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Cortex AI · ML models')}</div>
          </Link>
        </div>
      </div>

      {/* ── Spectrum summary KPIs ─────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={tt('Total licensed MHz (sub-6)')} value={`${licensedSub6} MHz`} delta={tt('8 bands')} trend="flat" icon={Radio} />
        <KpiCard label={tt('Total licensed MHz (mmWave)')} value={`${mmwave} MHz`} delta={tt('26 GHz hotspot')} trend="flat" icon={Signal} />
        <KpiCard label={tt('Spectrum spend to date')} value="BSD 2.37B" delta={tt('since 2011 auctions')} trend="flat" icon={TrendingUp} />
        <KpiCard label={tt('Renewal cliff year')} value="2030" delta={tt('120 MHz at risk')} trend="down" icon={AlertTriangle} />
      </div>

      {/* ── Spectrum scorecard table ──────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Spectrum KPI scorecard — portfolio summary')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('KPI')}</th>
                  <th className="px-3 py-2 text-right">{tt('Current')}</th>
                  <th className="px-3 py-2 text-right">{tt('Target')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kpi: '700 MHz Utilisation',         cur: '91%', tgt: '<92%',      rag: 'Amber' },
                  { kpi: '3.5 GHz 5G SA rollout',       cur: '84%', tgt: '100% Q4',   rag: 'Green' },
                  { kpi: '1800 MHz Refarming (DSS)',     cur: '81%', tgt: '100% H1-27', rag: 'Green' },
                  { kpi: '2100 MHz 3G Shutdown',         cur: '92%', tgt: '100% Q4',   rag: 'Green' },
                  { kpi: '900 MHz GSM Refarm',           cur: '64%', tgt: '100% Q2-27', rag: 'Amber' },
                  { kpi: '26 GHz FWA Utilisation',       cur: '22%', tgt: '40% H2-27', rag: 'Amber' },
                  { kpi: '700 MHz Coverage Obligation',  cur: '94%', tgt: '100% Q4-26', rag: 'Green' },
                  { kpi: 'Rural 90% Coverage',           cur: '68%', tgt: '100% Q4-27', rag: 'Amber' },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{r.cur}</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.tgt}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.rag === 'Green' ? 'bg-emerald-100 text-emerald-700' : r.rag === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(r.rag)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3">
            <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <Link to="/portal/fraud"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory & Compliance →')}</Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('AI-native spectrum optimisation')}</div>
          <div className="text-sm text-vfes-dark/80">{tt('Snowflake Cortex fuses band utilisation telemetry, EU auction comparables, and device penetration data to produce a continuous renewal reserve recommendation and refarming priority ranked by NPV per MHz.')}</div>
        </div>
        <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0 ml-4">
          <Brain className="w-4 h-4" />{tt('AI Insights →')}
        </Link>
      </div>

      <div className="mt-4 text-[11px] text-vfes-dark/40 border-t border-black/5 pt-3">
        {tt('Source: URCA · EC spectrum decisions · Cable Bahamas spectrum register · Snowflake Cortex AI scoring. All utilisation metrics are 30-day rolling averages from the RAN analytics lake.')}
      </div>

      {/* ── Utilisation comparison chart (global overview) ─────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Current utilisation across all bands (%)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={BANDS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="band" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="util" name={tt('Utilisation %')} radius={[4, 4, 0, 0]}>
                  {BANDS.map((b, i) => <Cell key={i} fill={b.util >= 85 ? '#ef4444' : b.util >= 65 ? AMBER : BLUE} />)}
                </Bar>
                <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red threshold = 85% — triggers re-farming or augmentation review. 700 MHz most heavily loaded.')}</div>
        </Panel>
      </div>

      {/* ── Licence expiry bar chart ─────────────────────────────────────── */}
      <div className="mt-4">
        <Panel title={tt('MHz expiring by year — licence renewal schedule')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={EXPIRY_TIMELINE}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit=" MHz" />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} MHz`, tt('Expiring')]} />
                <Bar dataKey="mhz" name={tt('MHz expiring')} radius={[4, 4, 0, 0]}>
                  {EXPIRY_TIMELINE.map((e, i) => <Cell key={i} fill={e.risk === 'High' ? '#ef4444' : e.risk === 'Medium' ? AMBER : BLUE} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('2030 is the critical renewal year (120 MHz). Red = High risk, Amber = Medium, Blue = Low.')}</div>
          <div className="mt-2 flex gap-3">
            <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            <Link to="/portal/cto"            className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Refarm progress mini-chart ────────────────────────────────────── */}
      <div className="mt-4">
        <Panel title={tt('Refarming progress — legacy to 4G/5G (%)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={REFARM} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="band" stroke="#999" fontSize={11} width={80} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% · ${p.payload.note}`, tt('Refarmed')]} />
                <Bar dataKey="pct" name={tt('Refarmed %')} fill={BLUE} radius={[0, 4, 4, 0]} />
                <ReferenceLine x={100} stroke={GREEN} strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('2100 MHz 3G shutdown at 92% — 2G on 900 MHz still in progress targeting Q2-2027.')}</div>
        </Panel>
      </div>

      {/* ── MNO spectrum position comparison chart ───────────────────────── */}
      <div className="mt-4">
        <Panel title={tt('MNO spectrum position — total MHz by category')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={MNO_SPECTRUM_COMPARE}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="mno" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit=" MHz" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sub1ghz" fill={NAVY}  name={tt('Sub-1 GHz')} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="mid"     fill={BLUE}  name={tt('Mid-band')}  stackId="a" />
                <Bar dataKey="mmwave"  fill={LIGHT} name={tt('mmWave')} radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Cable Bahamas leads on mmWave (400 MHz) and sub-1 GHz depth vs all Bahamian MNOs.')}</div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/portal/mobile-ran"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
            <Link to="/portal/core-5g"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Core Health →')}</Link>
            <Link to="/portal/slicing"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing →')}</Link>
            <Link to="/portal/ran-energy"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('RAN Energy & ESG →')}</Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 text-[11px] text-vfes-dark/40 border-t border-black/5 pt-3">
        {tt('Spectrum data: URCA licence register · Cable Bahamas regulatory tracker · Snowflake Cortex AI. EU harmonisation status per EC/CEPT decisions.')}
        {' '}{tt('Valuation estimates based on comparable EU auctions. Renewal estimates are indicative — final amounts subject to URCA auction process.')}
        {' '}{tt('MHz-pop coverage values based on Statbel 2025 population data. All utilisation metrics 30-day rolling averages. Refreshed daily.')}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <Link to="/portal/inventory"   className="font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
        <Link to="/portal/operations"  className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
        <Link to="/portal/assurance"   className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
        <Link to="/portal/noc-map"     className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
        <Link to="/portal/mobile-ran"  className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
        <Link to="/portal/core-5g"     className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
      </div>

      <AskTheData />
    </div>
  )
}
