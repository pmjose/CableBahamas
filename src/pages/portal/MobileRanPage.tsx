import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Smartphone, Activity, Map as MapIcon, Gauge, Volume2, Trophy, Calendar,
  Cpu, Brain, ChevronRight, Radio, Leaf, Zap, Signal, Layers, TrendingUp,
  AlertTriangle, Globe, ShieldCheck,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AgentAction from '../../components/AgentAction'
import CartoMap from '../../components/CartoMap'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Line, LineChart, Pie, PieChart, Cell, Legend,
  ComposedChart, ReferenceLine,
} from 'recharts'
import {
  MOBILE_KPIS, SPECTRUM, TRAFFIC_BY_TECH, MNO_BENCHMARK, TOP_CELLS,
  VOICE_QUALITY, VENDOR_MIX, COVERAGE_BY_REGION, MOBILE_ROADMAP,
} from './_mobile_data'

// ── RAN analytics datasets ───────────────────────────────────────────────────
const PRB_UTIL = [
  { hour: '00', prb5g: 42, prb4g: 28 }, { hour: '04', prb5g: 34, prb4g: 22 },
  { hour: '08', prb5g: 58, prb4g: 44 }, { hour: '12', prb5g: 72, prb4g: 56 },
  { hour: '16', prb5g: 68, prb4g: 52 }, { hour: '18', prb5g: 82, prb4g: 64 },
  { hour: '20', prb5g: 76, prb4g: 58 }, { hour: '22', prb5g: 56, prb4g: 42 },
]
const HANDOVER_SUCCESS = [
  { region: 'Nassau',    intra5g: 98.8, inter: 97.4, x2: 99.1 },
  { region: 'Freeport',      intra5g: 98.6, inter: 97.2, x2: 98.9 },
  { region: 'Abaco',     intra5g: 98.1, inter: 96.8, x2: 98.4 },
  { region: 'Eleuthera',     intra5g: 97.9, inter: 96.4, x2: 98.1 },
  { region: 'Bimini',   intra5g: 98.4, inter: 97.0, x2: 98.7 },
]
const SITE_HEALTH = [
  { region: 'Nassau',         total: 3840, healthy: 3798, degraded: 38, critical: 4 },
  { region: 'Grand Bahama',   total: 2940, healthy: 2902, degraded: 34, critical: 4 },
  { region: 'Out Islands',        total: 2580, healthy: 2528, degraded: 46, critical: 6 },
  { region: 'Abaco',   total: 1840, healthy: 1818, degraded: 18, critical: 4 },
  { region: 'Eleuthera', total: 1020, healthy: 1012, degraded:  7, critical: 1 },
  { region: 'Exuma',         total:  980, healthy:  968, degraded: 10, critical: 2 },
  { region: 'New Providence-Capital',total:  640, healthy:  628, degraded: 10, critical: 2 },
]
const ENERGY_MONTHLY = [
  { m: 'Jun', kwh: 0.122, target: 0.100, gwh: 31.4, renewPct: 62 },
  { m: 'Jul', kwh: 0.118, target: 0.100, gwh: 30.8, renewPct: 64 },
  { m: 'Aug', kwh: 0.115, target: 0.100, gwh: 30.2, renewPct: 66 },
  { m: 'Sep', kwh: 0.111, target: 0.100, gwh: 29.6, renewPct: 68 },
  { m: 'Oct', kwh: 0.106, target: 0.100, gwh: 28.8, renewPct: 71 },
  { m: 'Nov', kwh: 0.101, target: 0.100, gwh: 28.2, renewPct: 74 },
]
const TECH_SPLIT_SITES = [
  { tech: '5G SA only',   sites: 4820, color: '#FF4438' },
  { tech: '5G NSA + 4G',  sites: 8640, color: '#11567F' },
  { tech: '4G only',      sites: 7240, color: '#94a3b8' },
  { tech: '2G/3G legacy', sites: 1484, color: '#F59E0B' },
]
const RRC_TREND = [
  { m: 'Jun', rrc: 98.82, drop: 0.52 }, { m: 'Jul', rrc: 98.94, drop: 0.50 },
  { m: 'Aug', rrc: 99.01, drop: 0.48 }, { m: 'Sep', rrc: 99.08, drop: 0.46 },
  { m: 'Oct', rrc: 99.12, drop: 0.44 }, { m: 'Nov', rrc: 99.18, drop: 0.42 },
]
const ENERGY_BY_VENDOR = [
  { vendor: 'Ericsson', gwh: 11.4, sites: 8400 },
  { vendor: 'Nokia',    gwh:  8.2, sites: 6200 },
  { vendor: 'Huawei',   gwh:  6.8, sites: 4880 },
  { vendor: 'Samsung',  gwh:  1.8, sites: 2660 },
]
const QUALITY_SCORECARD = [
  { kpi: 'Drop-call rate',         vfes: '0.42%',  target: '0.40%', rag: 'Amber' },
  { kpi: 'RRC Setup Success',      vfes: '99.18%', target: '99.00%', rag: 'Green' },
  { kpi: 'Mean Opinion Score',     vfes: '4.12',   target: '4.10',  rag: 'Green' },
  { kpi: 'VoLTE Setup Success',    vfes: '99.62%', target: '99.50%', rag: 'Green' },
  { kpi: 'Intra-5G Handover',      vfes: '98.8%',  target: '98.5%', rag: 'Green' },
  { kpi: '4G↔5G Inter-freq HO',   vfes: '97.2%',  target: '97.0%', rag: 'Green' },
  { kpi: 'Post-Dial Delay',        vfes: '328 ms', target: '350 ms', rag: 'Green' },
  { kpi: 'E-UTRAN CSSR',          vfes: '99.41%', target: '99.20%', rag: 'Green' },
]
const ESG_MILESTONES = [
  { milestone: 'Net Zero road-map scenario',         year: '2023', status: 'Done' },
  { milestone: '60% renewable energy procurement',    year: '2024', status: 'Done' },
  { milestone: '0.10 kWh/GB energy intensity target', year: '2026', status: 'On track' },
  { milestone: '80% renewable energy procurement',    year: '2027', status: 'Planned' },
  { milestone: 'All new sites solar-hybrid',          year: '2028', status: 'Planned' },
  { milestone: 'Net Zero Scope 1 & 2 emissions',      year: '2030', status: 'Target' },
]

type TabId = 'overview' | 'coverage' | 'capacity' | 'quality' | 'compete' | 'roadmap' | 'sites' | 'energy'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',  label: 'Overview',       icon: Activity },
  { id: 'coverage',  label: 'Coverage',       icon: MapIcon },
  { id: 'capacity',  label: 'Capacity',       icon: Gauge },
  { id: 'quality',   label: 'Quality',        icon: Volume2 },
  { id: 'compete',   label: 'Competitive',    icon: Trophy },
  { id: 'roadmap',   label: 'Roadmap',        icon: Calendar },
  { id: 'sites',     label: 'Site Inventory', icon: Radio },
  { id: 'energy',    label: 'Energy & ESG',   icon: Leaf },
]

const BLUE      = '#FF4438'
const NAVY      = '#11567F'
const GREEN     = '#10B981'
const AMBER     = '#F59E0B'
const SLATE     = '#94a3b8'
const RED_LIGHT = '#FF8585'

export default function MobileRanPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('overview')
  const [ranVendorFilter, setRanVendorFilter] = useState<string>('All')
  const [energyView, setEnergyView] = useState<'intensity' | 'total'>('intensity')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')
  const [qualityMetric, setQualityMetric] = useState<'drop' | 'mos' | 'rrc'>('drop')
  const [siteSort, setSiteSort] = useState<'healthy' | 'critical'>('critical')
  const k = MOBILE_KPIS

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredSites = useMemo(
    () => regionFilter === 'All' ? SITE_HEALTH : SITE_HEALTH.filter(s => s.region === regionFilter),
    [regionFilter],
  )

  const filteredByVendor = useMemo(
    () => ranVendorFilter === 'All' ? TOP_CELLS : TOP_CELLS.filter(c => c.vendor === ranVendorFilter),
    [ranVendorFilter],
  )

  const sortedSites = useMemo(
    () => [...filteredSites].sort((a, b) => siteSort === 'critical' ? b.critical - a.critical : b.healthy - a.healthy),
    [filteredSites, siteSort],
  )

  const energyData = useMemo(
    () => energyView === 'intensity' ? ENERGY_MONTHLY.map(d => ({ ...d, val: d.kwh })) : ENERGY_MONTHLY.map(d => ({ ...d, val: d.gwh })),
    [energyView],
  )

  const ragColor = (rag: string) =>
    rag === 'Green' ? 'bg-emerald-50 text-emerald-700' :
    rag === 'Amber' ? 'bg-amber-50 text-amber-700' :
    'bg-red-50 text-red-700'

  const stP = (s: string) =>
    s === 'Done' || s === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
    s === 'On track' || s === 'Planned' ? 'bg-amber-100 text-amber-700' :
    'bg-blue-100 text-blue-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Mobile RAN')}
        subtitle={tt('5G/4G coverage · PRB utilisation · RRC success · handover · energy')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            {liveTime && (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {tt('Live · ')}{liveTime}
              </span>
            )}
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">{tt('Use case')} 7</span>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="RAN intelligence"
        models={[
          { name: 'PRB Utilisation Forecaster', metric: 'MAPE 4.8%', sub: 'cell-level 72h demand forecast' },
          { name: 'Handover Failure Predictor',  metric: 'F1 0.88',   sub: 'X2/Xn handover anomaly detection' },
          { name: 'RRC Drop Classifier',         metric: 'AUC 0.91',  sub: 'root-cause tagging per drop event' },
        ]}
        agentLabel="Run RAN Capacity Planner"
        agentRunningLabel="Planning…"
        agentSteps={[
          'Identified congested cells (>60% PRB utilisation)',
          'Modelled carrier-add / sector-split / spectrum refarm options',
          'Ranked actions by traffic impact × cost × coverage risk',
          'Queued change request — no coverage regression detected',
        ]}
        agentBlurb="A unified telemetry lake across RAN, core and spectrum lets the capacity model see the full path from PRB to subscriber experience — revenue-aware planning instead of per-domain silos."
        decision={{
          title: 'Add carrier on 3 Nassau urban cells before summer peak',
          detail: 'PRB utilisation on Nassau-Central, Ring Road and Bimini cells exceeded 60% for 18 out of last 30 days. Carrier add on 3.5 GHz relieves congestion and avoids ~BSD 0.8M summer churn.',
          impact: 'throughput +28% · churn risk ‒0.8MBSD ',
          risk: 'Ericsson RU lead-time 8 weeks — order by Q2 close',
          linkTo: '#/portal/capacity-capex',
          linkLabel: 'Open Capacity & Capex',
        }}
        chart={{
          kind: 'area',
          title: 'PRB utilisation — 24h profile (%) 5G vs 4G',
          xKey: 'hour',
          unit: '%',
          data: PRB_UTIL,
          series: [
            { key: 'prb5g', name: '5G PRB util %', color: BLUE },
            { key: 'prb4g', name: '4G PRB util %', color: SLATE },
          ],
          note: '18:00 peak is driven by Nassau / Freeport dense-urban traffic. Red threshold = 75%.',
        }}
      />

      {/* ── Alert ───────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('3 Nassau urban cells >75% PRB utilisation · UPF CPU 71% (watch)')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Carrier-add order to Ericsson in progress. RRC drop rate improving +0.06 pp QoQ. Rural permits delayed 28 sites.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Capacity →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
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

      {/* ════ OVERVIEW ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('5G population coverage')} value={`${k.cov5gPop}%`} delta={tt('+3.4 pp YoY')} trend="up" icon={Smartphone} accent />
            <KpiCard label={tt('4G population coverage')} value={`${k.cov4gPop}%`} delta={tt('best-in-class')} trend="flat" icon={Activity} />
            <KpiCard label={tt('Active cell sites')} value={k.activeSites.toLocaleString('en-BS')} delta={`${k.ownedSites.toLocaleString('en-BS')} ${tt('owned')}`} trend="flat" icon={MapIcon} />
            <KpiCard label={tt('Avg DL throughput')} value={`${k.avgDLMbps} Mbps`} delta={tt('+12% YoY')} trend="up" icon={Gauge} />
            <KpiCard label={tt('Drop-call rate')} value={`${k.dropCallPct}%`} delta={tt('-0.20 pp YoY')} trend="up" icon={Volume2} />
            <KpiCard label={tt('VoLTE adoption')} value={`${k.voltePct}%`} delta={tt('+2.1 pp QoQ')} trend="up" icon={Volume2} />
            <KpiCard label={tt('VoNR adoption')} value={`${k.vonrPct}%`} delta={tt('5G voice ramping')} trend="up" icon={Volume2} />
            <KpiCard label={tt('Mean opinion score')} value={k.mos.toFixed(2)} delta={tt('industry-leading')} trend="up" icon={Trophy} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Traffic by technology — last 90 days (TB/day)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={TRAFFIC_BY_TECH}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="t4g"    stackId="1" stroke={SLATE}    fill={SLATE}    name={tt('4G')} />
                    <Area type="monotone" dataKey="t5gNSA" stackId="1" stroke={RED_LIGHT} fill={RED_LIGHT} name={tt('5G NSA')} />
                    <Area type="monotone" dataKey="t5gSA"  stackId="1" stroke={BLUE}     fill={BLUE}     name={tt('5G SA')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Vendor mix — RAN nodes')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={VENDOR_MIX} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d: any) => `${d.name} ${d.value}%`}>
                      {VENDOR_MIX.map((v) => <Cell key={v.name} fill={v.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Spectrum holdings')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={SPECTRUM}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="band" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} label={{ value: 'MHz', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} MHz · ${p.payload.type} · ${p.payload.primary}`, tt('Spectrum')]} />
                    <Bar dataKey="mhz" radius={[6, 6, 0, 0]}>
                      {SPECTRUM.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('PRB utilisation — 24h (5G vs 4G %)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={PRB_UTIL}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="hour" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[20, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="prb5g" stroke={BLUE}  strokeWidth={2.4} name={tt('5G PRB %')} dot={false} />
                    <Line type="monotone" dataKey="prb4g" stroke={SLATE} strokeWidth={1.8} name={tt('4G PRB %')} dot={false} strokeDasharray="4 4" />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 75% congestion threshold')}</div>
            </Panel>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Link to="/portal/spectrum" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition flex items-center gap-2 text-sm font-semibold">
              <Radio className="w-4 h-4 text-vfes-dark" /> {tt('Spectrum Portfolio')}
            </Link>
            <Link to="/portal/core-5g" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition flex items-center gap-2 text-sm font-semibold">
              <Cpu className="w-4 h-4 text-vfes-dark" /> {tt('5G Core Health')}
            </Link>
            <Link to="/portal/ran-energy" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition flex items-center gap-2 text-sm font-semibold">
              <Leaf className="w-4 h-4 text-vfes-dark" /> {tt('RAN Energy & ESG')}
            </Link>
            <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition flex items-center gap-2 text-sm font-semibold">
              <Gauge className="w-4 h-4 text-vfes-dark" /> {tt('Capacity & Capex')}
            </Link>
          </div>

          {/* RRC trend + energy quickview */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('RRC setup success & drop-call trend — 6 months')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <ComposedChart data={RRC_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} domain={[98.5, 99.5]} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[0.3, 0.65]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="rrc"  stroke={BLUE}  strokeWidth={2.5} name={tt('RRC Success %')} />
                    <Bar  yAxisId="r"               dataKey="drop" fill={AMBER}  name={tt('Drop %')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Renewable energy adoption — 6 months (%)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={ENERGY_MONTHLY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[55, 80]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="renewPct" stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('Renewable %')} />
                    <ReferenceLine y={80} stroke={AMBER} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber line = 80% FY2027 renewable target')}</div>
            </Panel>
          </div>

          {/* 4G/5G mix quickview */}
          <Panel title={tt('4G/5G technology split — active sites')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={TECH_SPLIT_SITES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="tech" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sites" name={tt('Sites')} radius={[4, 4, 0, 0]}>
                    {TECH_SPLIT_SITES.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-3">
              <Link to="/portal/inventory"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
              <Link to="/portal/operations" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>

          <AgentDecision
            title="RAN Capacity Planner"
            label="Run Capacity Planner"
            runningLabel="Planning…"
            steps={[
              'Identified congested cells (>60% PRB utilisation)',
              'Modelled carrier add / sector split / spectrum refarm',
              'Selected lowest-cost capacity action per cell',
              'Queued change request — no coverage regression',
            ]}
            result={{
              headline: 'Add capacity to the top congested cells before the summer peak',
              stats: [
                { label: '5G pop coverage', value: `${k.cov5gPop}%` },
                { label: 'Active cell sites', value: k.activeSites.toLocaleString('en-BS') },
                { label: 'Avg DL throughput', value: `${k.avgDLMbps} Mbps` },
                { label: 'Drop-call rate', value: `${k.dropCallPct}%` },
              ],
              findings: [
                'A handful of urban cells exceed 60% PRB utilisation.',
                'Carrier-add or sector-split removes the congestion hot-spots that drive throughput complaints.',
              ],
              note: '-throughput complaints · protects 5G NPS',
            }}
            impact="-throughput complaints · protects 5G NPS"
            risk="capex per site — sequence by traffic & revenue"
            linkTo="#/portal/spectrum"
            linkLabel="Open Spectrum Portfolio"
          />
        </>
      )}

      {/* ════ COVERAGE ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'coverage' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('5G population coverage')} value={`${k.cov5gPop}%`} icon={Smartphone} accent />
            <KpiCard label={tt('4G population coverage')} value={`${k.cov4gPop}%`} icon={Activity} />
            <KpiCard label={tt('Total subscribers')} value={(k.totalSubscribers / 1_000_000).toFixed(1) + 'M'} icon={Smartphone} />
            <KpiCard label={tt('Monthly mobile data')} value={`${k.monthlyDataPB} PB`} icon={Cpu} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <Panel title={tt('National cell-site map · top traffic cells')}>
                <CartoMap
                  height={420}
                  center={[24.7, -76.5]}
                  zoom={8}
                  markers={TOP_CELLS.map(c => ({
                    name: c.id,
                    lat: c.lat,
                    lng: c.lng,
                    radius: 6 + c.trafficTBd / 2,
                    color: c.tech.startsWith('5G') ? BLUE : SLATE,
                    pulse: c.tech === '5G SA',
                    tooltip: `${c.id}<br/>${c.city}<br/>${c.tech} · ${c.vendor}<br/>${c.trafficTBd} TB/day`,
                  }))}
                />
              </Panel>
            </div>
            <Panel title={tt('Coverage by region')}>
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {COVERAGE_BY_REGION.map((r) => (
                  <div key={r.region} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{r.region}</span>
                      <span className="text-xs text-vfes-dark/55">{r.sites.toLocaleString('en-BS')} {tt('sites')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-vfes-dark/55 w-10">5G</span>
                      <div className="flex-1 h-1.5 rounded bg-black/5 overflow-hidden">
                        <div className="h-full rounded bg-vfes-red" style={{ width: `${r.cov5g}%` }} />
                      </div>
                      <span className="font-mono w-10 text-right">{r.cov5g}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-vfes-dark/55 w-10">4G</span>
                      <div className="flex-1 h-1.5 rounded bg-black/5 overflow-hidden">
                        <div className="h-full rounded bg-blue-400" style={{ width: `${r.cov4g}%` }} />
                      </div>
                      <span className="font-mono w-10 text-right">{r.cov4g}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/portal/noc-map" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open NOC Map →')}</Link>
            <Link to="/portal/coverage" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Coverage deep-dive →')}</Link>
            <Link to="/portal/inventory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
          </div>
        </>
      )}

      {/* ════ CAPACITY ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'capacity' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Peak PRB utilisation (5G)')} value="82%" delta={tt('18:00 Nassau hot-cells')} trend="down" icon={Gauge} accent />
            <KpiCard label={tt('Cells >60% PRB 30d avg')}    value="112"  delta={tt('2% of fleet')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Sector-split planned Q3')}    value="28"   delta={tt('Nassau + Freeport')} trend="up" icon={Radio} />
            <KpiCard label={tt('5G carrier adds in progress')} value="14"  delta={tt('3.5 GHz mid-band')} trend="up" icon={Signal} />
          </div>

          {/* Vendor filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter vendor:')}</span>
            {['All', 'Ericsson', 'Nokia', 'Huawei', 'Samsung'].map(v => (
              <button key={v} onClick={() => setRanVendorFilter(v)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  ranVendorFilter === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {v}
              </button>
            ))}
          </div>

          <Panel title={tt('Top traffic cells')}
            action={<AgentAction label="Rebalance carriers" runningLabel="Rebalancing…"
              steps={[
                'Identified congested cells (>60% PRB utilisation)',
                'Modelled carrier add / sector split / spectrum refarm',
                'Selected lowest-cost capacity action per cell',
                'Queued change request — no coverage regression',
              ]} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Cell ID')}</th>
                    <th className="px-3 py-2">{tt('City')}</th>
                    <th className="px-3 py-2">{tt('Tech')}</th>
                    <th className="px-3 py-2">{tt('Vendor')}</th>
                    <th className="px-3 py-2 text-right">{tt('Traffic (TB/day)')}</th>
                    <th className="px-3 py-2 text-right">{tt('Congestion %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Uptime %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByVendor.map(c => (
                    <tr key={c.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                      <td className="px-3 py-2">{c.city}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.tech.startsWith('5G') ? 'bg-vfes-red/10 text-vfes-dark' : 'bg-slate-100 text-slate-700'}`}>{c.tech}</span></td>
                      <td className="px-3 py-2">{c.vendor}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.trafficTBd}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={c.congestionPct > 60 ? 'text-red-600 font-bold' : c.congestionPct > 40 ? 'text-amber-600' : 'text-emerald-600'}>{c.congestionPct}%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{c.uptime.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Capacity & Capex →')}</Link>
              <Link to="/portal/operations"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Operations →')}</Link>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Handover success rates by region (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={HANDOVER_SUCCESS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="region" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} domain={[96, 100]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="intra5g" fill={BLUE}  name={tt('Intra-5G HO %')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inter"   fill={AMBER} name={tt('Inter-freq HO %')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="x2"      fill={GREEN} name={tt('X2/Xn HO %')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Inter-frequency 4G↔5G handover success is the critical UX metric for 5G uptake.')}</div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ QUALITY ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'quality' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Drop-call rate')} value={`${k.dropCallPct}%`} delta={tt('-0.20 pp YoY')} trend="up" icon={Volume2} accent />
            <KpiCard label={tt('Mean opinion score')} value={k.mos.toFixed(2)} icon={Trophy} />
            <KpiCard label={tt('Post-dial delay')} value={`${k.postDialDelayMs} ms`} icon={Activity} />
            <KpiCard label={tt('VoLTE adoption')} value={`${k.voltePct}%`} icon={Volume2} />
          </div>

          {/* Metric filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Show metric:')}</span>
            {(['drop', 'mos', 'rrc'] as const).map(m => (
              <button key={m} onClick={() => setQualityMetric(m)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  qualityMetric === m ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {m === 'drop' ? tt('Drop %') : m === 'mos' ? tt('MOS') : tt('RRC')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Voice quality — last 12 months')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={VOICE_QUALITY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[3.8, 4.4]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="dropPct" stroke={BLUE}  strokeWidth={2.5} name={tt('Drop-call %')} />
                    <Line yAxisId="r" type="monotone" dataKey="mos"     stroke={GREEN} strokeWidth={2.5} name={tt('MOS')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('RRC Setup Success & Drop-call trend — 6 months')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={RRC_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} domain={[98.5, 99.5]} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[0.3, 0.65]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="rrc"  stroke={BLUE}  strokeWidth={2.5} name={tt('RRC Success %')} />
                    <Bar  yAxisId="r"               dataKey="drop" fill={AMBER} name={tt('Drop %')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Quality KPI scorecard — vs targets')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('KPI')}</th>
                    <th className="px-3 py-2 text-right">{tt('Cable Bahamas')}</th>
                    <th className="px-3 py-2 text-right">{tt('Target')}</th>
                    <th className="px-3 py-2">{tt('RAG')}</th>
                  </tr>
                </thead>
                <tbody>
                  {QUALITY_SCORECARD.map(q => (
                    <tr key={q.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(q.kpi)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{q.vfes}</td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{q.target}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ragColor(q.rag)}`}>{tt(q.rag)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Assurance →')}</Link>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ════ COMPETITIVE ══════════════════════════════════════════════════════════════════ */}
      {tab === 'compete' && (
        <>
          <Panel title={tt('MNO competitive benchmark — Q4 2026')}>
            <div className="h-96">
              <ResponsiveContainer>
                <BarChart data={MNO_BENCHMARK} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="metric" stroke="#999" fontSize={11} width={150} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="vfes"     fill={BLUE}    name={tt('Cable Bahamas')} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="btc" fill="#0070C0" name={tt('BTC')} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="orange"   fill="#FF7900" name={tt('Rival ISP A')} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="digi" fill="#FFD500" name={tt('Rival ISP B')} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Source: nPerf · Speedtest · URCA · Cable Bahamas benchmarking lab · Q4 2026')}</div>
          </Panel>
          <div className="mt-3 flex gap-3">
            <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            <Link to="/portal/cto"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO page →')}</Link>
          </div>
        </>
      )}

      {/* ════ ROADMAP ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'roadmap' && (
        <Panel title={tt('Mobile programmes — RAG · CapEx · ETA')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Programme')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Progress')}</th>
                  <th className="px-3 py-2">{tt('ETA')}</th>
                  <th className="px-3 py-2 text-right">{tt('CapEx (BSD M)')}</th>
                  <th className="px-3 py-2">{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_ROADMAP.map(p => (
                  <tr key={p.prog} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(p.prog)}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ragColor(p.rag)}`}>{tt(p.rag)}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded bg-black/5 overflow-hidden">
                          <div className="h-full bg-vfes-red rounded" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="font-mono text-xs">{p.pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p.eta}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.capex}</td>
                    <td className="px-3 py-2">{tt(p.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Cortex AI: 5G SA + Network Slicing maximise B2B ARR.')} <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-2 flex gap-3">
            <Link to="/portal/slicing"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing →')}</Link>
            <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            <Link to="/portal/cto"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
          </div>
        </Panel>
      )}

      {/* ════ SITE INVENTORY ══════════════════════════════════════════════════════════════ */}
      {tab === 'sites' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total active sites')} value={k.activeSites.toLocaleString('en-BS')} delta={tt('+842 YoY')} trend="up" icon={Radio} accent />
            <KpiCard label={tt('Owned towers')}        value={k.ownedSites.toLocaleString('en-BS')}  delta={tt('freehold asset')} trend="flat" icon={Globe} />
            <KpiCard label={tt('Island Towers (demo) shared sites')}  value={k.sharedSites.toLocaleString('en-BS')} delta={tt('opex/capex efficient')} trend="flat" icon={Layers} />
            <KpiCard label={tt('Degraded / Critical')} value="156 / 28" delta={tt('0.8% fleet at risk')} trend="down" icon={AlertTriangle} />
          </div>

          {/* Region filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
            {['All', ...SITE_HEALTH.map(s => s.region)].map(r => (
              <button key={r} onClick={() => setRegionFilter(r)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  regionFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {r}
              </button>
            ))}
            <span className="ml-2 text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort:')}</span>
            {(['critical', 'healthy'] as const).map(s => (
              <button key={s} onClick={() => setSiteSort(s)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  siteSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {s === 'critical' ? tt('Critical first') : tt('Healthy first')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Site health by region')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={sortedSites}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="region" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="healthy"  fill={GREEN} name={tt('Healthy')}  radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="degraded" fill={AMBER} name={tt('Degraded')} stackId="a" />
                    <Bar dataKey="critical" fill="#ef4444" name={tt('Critical')} radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('4G/5G technology split (sites)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={TECH_SPLIT_SITES} dataKey="sites" nameKey="tech" cx="50%" cy="50%" outerRadius={90}
                      label={(d: any) => `${d.tech.split(' ')[0]} ${((d.sites / TECH_SPLIT_SITES.reduce((a, b) => a + b.sites, 0)) * 100).toFixed(0)}%`}>
                      {TECH_SPLIT_SITES.map((t, i) => <Cell key={i} fill={t.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Site health scorecard by region')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('Total sites')}</th>
                    <th className="px-3 py-2 text-right">{tt('Healthy')}</th>
                    <th className="px-3 py-2 text-right">{tt('Degraded')}</th>
                    <th className="px-3 py-2 text-right">{tt('Critical')}</th>
                    <th className="px-3 py-2 text-right">{tt('Health %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSites.map(s => {
                    const healthPct = ((s.healthy / s.total) * 100).toFixed(1)
                    return (
                      <tr key={s.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{s.region}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.total.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-bold">{s.healthy.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-amber-600">{s.degraded}</td>
                        <td className="px-3 py-2 text-right text-red-600 font-bold">{s.critical}</td>
                        <td className={`px-3 py-2 text-right font-bold ${
                          parseFloat(healthPct) >= 99.0 ? 'text-emerald-600' :
                          parseFloat(healthPct) >= 98.5 ? 'text-amber-600' : 'text-red-600'
                        }`}>{healthPct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/inventory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Site Inventory →')}</Link>
              <Link to="/portal/noc-map"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open NOC Map →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ════ ENERGY & ESG ══════════════════════════════════════════════════════════════ */}
      {tab === 'energy' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Energy intensity')} value="0.101 kWh/GB" delta={tt('-18% YoY on track')} trend="up" icon={Leaf} accent />
            <KpiCard label={tt('Renewable energy %')} value="74%" delta={tt('+12 pp YoY')} trend="up" icon={Zap} />
            <KpiCard label={tt('Network GWh / month')} value="28.2" delta={tt('-10% vs 2024')} trend="up" icon={Activity} />
            <KpiCard label={tt('Net Zero target')} value="2030" delta={tt('Scope 1 & 2')} trend="flat" icon={Globe} />
          </div>

          {/* Energy view toggle */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
            {(['intensity', 'total'] as const).map(v => (
              <button key={v} onClick={() => setEnergyView(v)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  energyView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {v === 'intensity' ? tt('kWh/GB intensity') : tt('Total GWh')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={energyView === 'intensity' ? tt('Energy intensity trend — kWh/GB vs target') : tt('Total RAN energy consumption — GWh/month')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={energyData}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="val" name={energyView === 'intensity' ? tt('Actual kWh/GB') : tt('Total GWh')} fill={BLUE} radius={[4, 4, 0, 0]} />
                    {energyView === 'intensity' && (
                      <Line type="monotone" dataKey="target" stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} name={tt('Target 0.10 kWh/GB')} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Energy by vendor — GWh/month')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={ENERGY_BY_VENDOR}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="vendor" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit=" GWh" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="gwh" name={tt('GWh/month')} fill={NAVY} radius={[4, 4, 0, 0]}>
                      {ENERGY_BY_VENDOR.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, AMBER, GREEN][i % 4]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Ericsson highest — sleep-mode firmware upgrade targeted H1-2027.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Renewable energy adoption trend (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={ENERGY_MONTHLY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[55, 80]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="renewPct" stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('Renewable %')} />
                  <ReferenceLine y={80} stroke={AMBER} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber line = 80% FY2027 renewable target')}</div>
          </Panel>

          <Panel title={tt('ESG milestones — Net Zero 2030')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Milestone')}</th>
                    <th className="px-3 py-2">{tt('Year')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ESG_MILESTONES.map(m => (
                    <tr key={m.milestone} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(m.milestone)}</td>
                      <td className="px-3 py-2 font-mono">{m.year}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stP(m.status)}`}>{tt(m.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/ran-energy" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open RAN Energy & ESG →')}</Link>
              <Link to="/portal/cto"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO roadmap →')}</Link>
            </div>
          </Panel>
        </>
      )}

      <AskTheData />

      {/* ── Footer quick-nav ─────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Related dashboards')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/portal/spectrum"     className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Spectrum Portfolio')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('700/800/1800/2100/3.5 GHz holdings')}</div>
          </Link>
          <Link to="/portal/core-5g"      className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('5G Core Health')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('AMF · SMF · UPF · slices')}</div>
          </Link>
          <Link to="/portal/ran-energy"   className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('RAN Energy & ESG')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('kWh/GB · renewable · Net Zero')}</div>
          </Link>
          <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Capacity & Capex')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('PRB headroom · augmentation queue')}</div>
          </Link>
          <Link to="/portal/coverage"     className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Coverage')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('5G/4G coverage deep-dive')}</div>
          </Link>
          <Link to="/portal/noc-map"      className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('NOC Map')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Live site status & alarms')}</div>
          </Link>
          <Link to="/portal/slicing"      className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('5G Slicing & MEC')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('eMBB · URLLC · B2B enterprise')}</div>
          </Link>
          <Link to="/portal/assurance"    className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Assurance')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Network quality · SLA compliance')}</div>
          </Link>
        </div>
      </div>

      {/* ── Summary KPIs row ─────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={tt('Total subscribers')}    value={(MOBILE_KPIS.totalSubscribers / 1_000_000).toFixed(1) + 'M'} delta={tt('+1.2M YoY')} trend="up"   icon={Smartphone} />
        <KpiCard label={tt('Monthly mobile data')}  value={`${MOBILE_KPIS.monthlyDataPB} PB`}           delta={tt('+22% YoY')}  trend="up"   icon={Activity} />
        <KpiCard label={tt('5G-capable devices')}   value="64%"   delta={tt('of active devices')} trend="up"   icon={Signal} />
        <KpiCard label={tt('Avg revenue per user')} value="BSD 18.4" delta={tt('+BSD 1.2 YoY')} trend="up"   icon={TrendingUp} />
      </div>

      {/* ── RAN scorecard table ───────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('RAN KPI scorecard — national summary')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('KPI')}</th>
                  <th className="px-3 py-2 text-right">{tt('Current')}</th>
                  <th className="px-3 py-2 text-right">{tt('Target')}</th>
                  <th className="px-3 py-2 text-right">{tt('YoY')}</th>
                  <th className="px-3 py-2">{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kpi: '5G Population Coverage',  cur: `${MOBILE_KPIS.cov5gPop}%`,           tgt: '90%',      yoy: '+3.4 pp', rag: 'Green' },
                  { kpi: '4G Population Coverage',  cur: `${MOBILE_KPIS.cov4gPop}%`,           tgt: '99%',      yoy: 'stable',  rag: 'Green' },
                  { kpi: 'Drop-call Rate',           cur: `${MOBILE_KPIS.dropCallPct}%`,        tgt: '0.40%',    yoy: '-0.20 pp', rag: 'Amber' },
                  { kpi: 'Avg DL Throughput',        cur: `${MOBILE_KPIS.avgDLMbps} Mbps`,      tgt: '180 Mbps', yoy: '+12%',    rag: 'Green' },
                  { kpi: 'Mean Opinion Score',       cur: MOBILE_KPIS.mos.toFixed(2),           tgt: '4.10',     yoy: '+0.04',   rag: 'Green' },
                  { kpi: 'VoLTE Adoption',           cur: `${MOBILE_KPIS.voltePct}%`,           tgt: '90%',      yoy: '+2.1 pp', rag: 'Green' },
                  { kpi: 'VoNR Adoption',            cur: `${MOBILE_KPIS.vonrPct}%`,            tgt: '60%',      yoy: 'n/a',     rag: 'Amber' },
                  { kpi: 'Peak PRB Utilisation (5G)',cur: '82%',                                tgt: '<75%',     yoy: '+4 pp',   rag: 'Amber' },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{r.cur}</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.tgt}</td>
                    <td className="px-3 py-2 text-right text-xs">{r.yoy}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.rag === 'Green' ? 'bg-emerald-100 text-emerald-700' : r.rag === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(r.rag)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-vfes-dark/40">{tt('Source: RAN analytics lake · nPerf · URCA · Snowflake Cortex AI scoring. All metrics 30-day rolling averages.')}</div>
        </Panel>
      </div>

      <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('AI-native RAN planning')}</div>
          <div className="text-sm text-vfes-dark/80">{tt('Snowflake Cortex unifies RAN telemetry, spectrum holdings, and energy data into a single model — enabling cell-level capacity planning, handover anomaly detection, and ESG-aware network optimisation.')}</div>
        </div>
        <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0 ml-4">
          <Brain className="w-4 h-4" />{tt('AI Insights →')}
        </Link>
      </div>
    </div>
  )
}
