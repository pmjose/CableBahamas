import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Store, Users, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, Brain,
  BadgePercent, Target, Award, MapPin, Building2,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, Scatter, ScatterChart, ZAxis,
  LineChart, Line, AreaChart, Area, ComposedChart,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'

// ─── Channel mix ──────────────────────────────────────────────────────────────
const CHANNEL_MIX = [
  { name: 'Owned retail',        value: 22, color: NAVY },
  { name: 'Franchise dealers',   value: 31, color: BLUE },
  { name: 'Independent dealers', value: 18, color: '#75CDF0' },
  { name: 'Digital / D2C',       value: 21, color: GREEN },
  { name: 'Telesales',           value:  8, color: AMBER },
]

const MIX_TREND = [
  { m: 'Jan', owned: 24, franchise: 29, independent: 20, digital: 19, tele: 8 },
  { m: 'Feb', owned: 23, franchise: 30, independent: 19, digital: 20, tele: 8 },
  { m: 'Mar', owned: 23, franchise: 30, independent: 19, digital: 20, tele: 8 },
  { m: 'Apr', owned: 22, franchise: 31, independent: 18, digital: 21, tele: 8 },
  { m: 'May', owned: 22, franchise: 31, independent: 18, digital: 21, tele: 8 },
  { m: 'Jun', owned: 22, franchise: 31, independent: 18, digital: 21, tele: 8 },
]

// ─── Dealer network ───────────────────────────────────────────────────────────
const DEALERS = [
  { dealer: 'Atlantis Resort Group', adds: 4200, quality: 92, commK: 168, status: 'gold',   region: 'Nassau',  ninety: 4.2 },
  { dealer: 'NoordConnect',          adds: 3100, quality: 88, commK: 121, status: 'gold',   region: 'Freeport',    ninety: 5.1 },
  { dealer: 'MediaMobile Stores',     adds: 2600, quality: 74, commK: 104, status: 'silver', region: 'Abaco',   ninety: 7.4 },
  { dealer: 'ZuidPhone Retail',       adds: 1800, quality: 61, commK:  78, status: 'watch',  region: 'Eleuthera',   ninety: 9.2 },
  { dealer: 'CitySIM Kiosks',        adds: 1450, quality: 48, commK:  64, status: 'watch',  region: 'Nassau',  ninety: 11.6 },
  { dealer: 'BeComm',             adds: 1200, quality: 83, commK:  52, status: 'silver', region: 'Bimini', ninety: 5.8 },
  { dealer: 'EilandConnect',           adds:  980, quality: 77, commK:  44, status: 'silver', region: 'Andros', ninety: 6.2 },
  { dealer: 'MesComm Retail',        adds:  760, quality: 69, commK:  38, status: 'silver', region: 'Exuma',  ninety: 8.1 },
]

// ─── Channel economics ────────────────────────────────────────────────────────
const ECONOMICS = [
  { ch: 'Owned retail',        cac: 78,  churn90: 4.2 },
  { ch: 'Franchise dealers',   cac: 62,  churn90: 6.1 },
  { ch: 'Independent dealers', cac: 54,  churn90: 9.8 },
  { ch: 'Digital / D2C',       cac: 31,  churn90: 5.4 },
  { ch: 'Telesales',           cac: 44,  churn90: 11.2 },
]

// ─── Commission structure ─────────────────────────────────────────────────────
const COMM_TIERS = [
  { tier: 'Gold (quality ≥85)',  rateGross: 42, rateQual: 52, minQual: 85, dealers: 2 },
  { tier: 'Silver (qual 70–84)', rateGross: 38, rateQual: 45, minQual: 70, dealers: 4 },
  { tier: 'Watch (qual <70)',    rateGross: 28, rateQual:  0, minQual:  0, dealers: 2 },
]

const COMM_TREND = [
  { m: 'Jan', total: 524, qualBonus: 88 },
  { m: 'Feb', total: 538, qualBonus: 94 },
  { m: 'Mar', total: 551, qualBonus: 98 },
  { m: 'Apr', total: 563, qualBonus: 102 },
  { m: 'May', total: 574, qualBonus: 108 },
  { m: 'Jun', total: 587, qualBonus: 114 },
]

// ─── Store performance ────────────────────────────────────────────────────────
const STORES = [
  { store: 'Nassau Bay Street',    region: 'Nassau',  type: 'Owned',       adds: 620, arpu: 28.4, nps: 52, conv: 18.2 },
  { store: 'Freeport Veldstraat',       region: 'Freeport',    type: 'Owned',       adds: 540, arpu: 27.8, nps: 49, conv: 17.4 },
  { store: 'Abaco Centre',       region: 'Abaco',   type: 'Franchise',   adds: 480, arpu: 26.2, nps: 44, conv: 15.8 },
  { store: 'Eleuthera Riverside',    region: 'Eleuthera',   type: 'Franchise',   adds: 410, arpu: 25.6, nps: 42, conv: 14.9 },
  { store: 'Nassau Wijnegem',      region: 'Nassau',  type: 'Owned',       adds: 390, arpu: 27.1, nps: 47, conv: 16.6 },
  { store: 'Bimini North',   region: 'Bimini', type: 'Franchise',   adds: 320, arpu: 26.8, nps: 45, conv: 15.2 },
  { store: 'Exuma Harbour',     region: 'Exuma',  type: 'Independent', adds: 280, arpu: 24.2, nps: 38, conv: 13.4 },
  { store: 'Long Island Centrum',      region: 'Long Island',    type: 'Independent', adds: 240, arpu: 23.8, nps: 36, conv: 12.8 },
  { store: 'Abaco Aqua',         region: 'Abaco',   type: 'Franchise',   adds: 210, arpu: 25.1, nps: 40, conv: 14.2 },
  { store: 'Andros K in Andros', region: 'Andros', type: 'Independent', adds: 190, arpu: 23.4, nps: 35, conv: 12.2 },
]

const STORE_TREND = [
  { m: 'Jan', owned: 1420, franchise: 980, independent: 620 },
  { m: 'Feb', owned: 1460, franchise: 1010, independent: 630 },
  { m: 'Mar', owned: 1490, franchise: 1040, independent: 640 },
  { m: 'Apr', owned: 1520, franchise: 1060, independent: 650 },
  { m: 'May', owned: 1550, franchise: 1090, independent: 660 },
  { m: 'Jun', owned: 1580, franchise: 1110, independent: 660 },
]

// ─── Geographic data ─────────────────────────────────────────────────────────
const GEO_DATA = [
  { region: 'Nassau',  adds: 8240, dealers: 142, stores: 48, share: 31.2 },
  { region: 'Freeport',    adds: 5640, dealers:  98, stores: 32, share: 21.4 },
  { region: 'Abaco',   adds: 3280, dealers:  62, stores: 22, share: 12.4 },
  { region: 'Eleuthera',   adds: 2840, dealers:  54, stores: 18, share: 10.8 },
  { region: 'Bimini', adds: 1980, dealers:  38, stores: 14, share:  7.5 },
  { region: 'Long Island',    adds: 1440, dealers:  28, stores: 10, share:  5.5 },
  { region: 'Exuma',  adds: 1260, dealers:  24, stores:  8, share:  4.8 },
  { region: 'Andros', adds: 1240, dealers:  22, stores:  8, share:  4.7 },
  { region: 'Other',    adds:  680, dealers: 772, stores: 40, share:  2.6 },
]

// ─── Forecast ────────────────────────────────────────────────────────────────
const FULL_FORECAST = [
  { m: 'Jan', actual: 39.2, base: 39.0, optimistic: 42.0, conservative: 37.0 },
  { m: 'Feb', actual: 40.1, base: 39.8, optimistic: 42.8, conservative: 37.6 },
  { m: 'Mar', actual: 40.8, base: 40.4, optimistic: 43.6, conservative: 38.2 },
  { m: 'Apr', actual: 41.6, base: 41.0, optimistic: 44.4, conservative: 38.8 },
  { m: 'May', actual: 42.4, base: 41.8, optimistic: 45.2, conservative: 39.4 },
  { m: 'Jun', actual: 43.1, base: 42.6, optimistic: 46.0, conservative: 40.0 },
  { m: 'Jul', actual: null, base: 43.2, optimistic: 45.8, conservative: 40.6 },
  { m: 'Aug', actual: null, base: 44.1, optimistic: 47.2, conservative: 41.4 },
  { m: 'Sep', actual: null, base: 45.6, optimistic: 49.1, conservative: 42.2 },
  { m: 'Oct', actual: null, base: 46.8, optimistic: 50.4, conservative: 43.1 },
  { m: 'Nov', actual: null, base: 47.4, optimistic: 51.2, conservative: 43.6 },
  { m: 'Dec', actual: null, base: 48.0, optimistic: 52.0, conservative: 44.0 },
]

const statusColor = (s: string) =>
  s === 'gold' ? 'bg-amber-50 text-amber-700' : s === 'silver' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-700'

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

type TabId = 'mix' | 'dealers' | 'economics' | 'scorecard' | 'commissions' | 'stores' | 'geo' | 'forecast'
const TABS: { id: TabId; label: string }[] = [
  { id: 'mix',         label: 'Channel Mix'        },
  { id: 'dealers',     label: 'Dealer Performance' },
  { id: 'economics',   label: 'Channel Economics'  },
  { id: 'scorecard',   label: 'KPI Scorecard'      },
  { id: 'commissions', label: 'Commissions'        },
  { id: 'stores',      label: 'Store Performance'  },
  { id: 'geo',         label: 'Geographic View'    },
  { id: 'forecast',    label: 'Forecast'           },
]

export default function ChannelDealersPage() {
  const { i18n } = useTranslation()

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const [tab, setTab]                             = useState<TabId>('mix')
  const [dealerSort, setDealerSort]               = useState<'adds' | 'quality' | 'commK'>('adds')
  const [storeFilter, setStoreFilter]             = useState<'All' | 'Owned' | 'Franchise' | 'Independent'>('All')
  const [commView, setCommView]                   = useState<'tier' | 'dealer'>('tier')
  const [geoMetric, setGeoMetric]                 = useState<'adds' | 'share'>('adds')
  const [forecastScenario, setForecastScenario]   = useState<'base' | 'optimistic' | 'conservative'>('base')
  const [alertDismissed, setAlertDismissed]       = useState(false)
  const [liveTime, setLiveTime]                   = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedDealers = useMemo(
    () => [...DEALERS].sort((a, b) => b[dealerSort] - a[dealerSort]),
    [dealerSort],
  )

  const filteredStores = useMemo(
    () => storeFilter === 'All' ? STORES : STORES.filter(s => s.type === storeFilter),
    [storeFilter],
  )

  const geoChartData = useMemo(
    () => GEO_DATA.map(g => ({ ...g, metricVal: geoMetric === 'adds' ? g.adds : g.share })),
    [geoMetric],
  )

  const forecastChartData = useMemo(
    () => FULL_FORECAST.map(d => ({
      ...d,
      scenarioVal: forecastScenario === 'base' ? d.base
        : forecastScenario === 'optimistic' ? d.optimistic
        : d.conservative,
    })),
    [forecastScenario],
  )

  const totalAdds  = DEALERS.reduce((s, d) => s + d.adds,  0)
  const totalComm  = DEALERS.reduce((s, d) => s + d.commK, 0)
  const indirectShare = CHANNEL_MIX.filter(c => /dealer/i.test(c.name)).reduce((s, c) => s + c.value, 0)
  const watch      = DEALERS.filter(d => d.status === 'watch').length

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Channel & Dealers')}
        subtitle={tt('Indirect sales · dealer network · store performance · commissions · geographic distribution')}
        actions={
          <div className="flex items-center gap-2">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{indirectShare}% {tt('indirect')}</span>
            {liveTime && <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">{liveTime}</span>}
          </div>
        }
      />

      {/* ── ML Insight Section ─────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Channel intelligence"
        models={[
          { name: 'Dealer Quality Scorer',   metric: 'AUC 0.88',  sub: 'adds × quality × 90-day churn' },
          { name: 'Store Demand Forecaster', metric: 'MAPE 5.2%', sub: '90-day store gross adds' },
          { name: 'Commission Optimiser',    metric: '+8% ROI',   sub: 'quality-weighted allocation' },
        ]}
        agentLabel={tt('Run Channel Optimiser')}
        agentRunningLabel={tt('Scoring…')}
        agentSteps={[
          tt('Scored all 1,240 dealers on adds × quality × 90-day churn weighted index'),
          tt('Flagged sub-quality dealers (score < 65) driving above-threshold early churn'),
          tt('Re-weighted commission budget toward quality-adjusted gross adds'),
          tt('Drafted dealer scorecards and coaching action plans for watch-tier dealers'),
        ]}
        agentBlurb={tt('Indirect channels scale volume efficiently — but unmanaged dealers import churn. Paying for quality rather than just gross adds lowers the blended payback period significantly.')}
        decision={{
          title: tt('Shift commission to quality adds; put CitySIM & SurPhone on a quality plan'),
          detail: tt('CitySIM (quality 48, 11.6% 90-day churn) and SurPhone (quality 61, 9.2% churn) are volume leaders dragging base quality. Cap volume allocation and redirect to quality-weighted incentives.'),
          impact: tt('lower blended CAC payback · less imported churn · +BSD 0.3M margin/yr'),
          risk: tt('dealers may push volume to competitors — protect gold-tier relationships proactively'),
          linkTo: '#/portal/churn-retention',
          linkLabel: tt('Open Churn & Retention'),
        }}
        chart={{
          kind: 'bar',
          title: tt('CAC by channel (BSD )'),
          xKey: 'ch',
          unit: 'BSD ',
          data: ECONOMICS,
          series: [{ key: 'cac', name: tt('CAC BSD '), color: BLUE }],
          note: tt('Digital/D2C has the best CAC economics at BSD 31 — the channel to grow aggressively.'),
        }}
      />

      {/* ── Alert banner ───────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('CitySIM Kiosks: quality 48, 11.6% 90-day churn · SurPhone: 9.2% churn above 7% threshold')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Both dealers on watch-tier. Commission cap in effect until quality plan accepted and maintained for 3 months.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/churn-retention" className="text-xs font-bold text-amber-900 hover:underline">{tt('Churn →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Active dealers')}          value="1,240"                              delta={tt('6 key accounts')}         trend="flat" icon={Store}        accent />
        <KpiCard label={tt('Dealer gross adds (mo)')}  value={totalAdds.toLocaleString('en-BS')} delta={tt('+5.1% MoM')}             trend="up"   icon={Users}              />
        <KpiCard label={tt('Commission spend (mo)')}   value={`BSD ${totalComm}K`}                  delta={tt('on tracked accounts')}    trend="flat" icon={BadgePercent}        />
        <KpiCard label={tt('Dealers on watch')}        value={`${watch}`}                         delta={tt('quality below target')}   trend="down" icon={AlertTriangle}       />
      </div>

      {/* ── Tab nav ────────────────────────────────────────────────────────── */}
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

      {/* ══ MIX ════════════════════════════════════════════════════════════ */}
      {tab === 'mix' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Digital / D2C share')}    value="21%"  delta={tt('+2 pp YoY — fastest growing')} trend="up"   icon={TrendingUp}   accent />
          <KpiCard label={tt('Franchise share')}         value="31%"  delta={tt('largest indirect route')}       trend="flat" icon={Store}               />
          <KpiCard label={tt('Telesales share')}         value="8%"   delta={tt('highest 90d churn channel')}    trend="down" icon={TrendingDown}        />
          <KpiCard label={tt('Digital CAC advantage')}   value="BSD 47" delta={tt('owned BSD 78 vs digital BSD 31')}    trend="up"   icon={Target}             />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Gross adds by route to market (%)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={CHANNEL_MIX} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {CHANNEL_MIX.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Indirect (franchise + independent) is 49% of gross adds — the largest single route to market.')}</div>
          </Panel>

          <Panel title={tt('Channel mix trend — 6 months (%)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={MIX_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="owned"       name={tt('Owned retail')}    stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="franchise"   name={tt('Franchise')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="independent" name={tt('Independent')}     stroke={SLATE} fill={SLATE} fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="digital"     name={tt('Digital / D2C')}   stroke={GREEN} fill={GREEN} fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="tele"        name={tt('Telesales')}        stroke={AMBER} fill={AMBER} fillOpacity={0.15} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Explore related pages')}</div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link to="/portal/sales"           className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Sales')}</Link>
            <Link to="/portal/promotions"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Promotions')}</Link>
            <Link to="/portal/digital-funnel"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Digital Funnel')}</Link>
            <Link to="/portal/marketing"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Marketing')}</Link>
            <Link to="/portal/device-financing" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Device Financing')}</Link>
          </div>
        </div>
      </>)}

      {/* ══ DEALERS ════════════════════════════════════════════════════════ */}
      {tab === 'dealers' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Gold tier')}         value="2"  delta={tt('quality ≥ 85')}                trend="up"   icon={Award}        accent />
          <KpiCard label={tt('Silver tier')}        value="4"  delta={tt('quality 70–84')}              trend="flat" icon={Award}              />
          <KpiCard label={tt('Watch tier')}         value={`${watch}`} delta={tt('plans issued')}       trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Avg quality score')}  value="74" delta={tt('target ≥ 80 by Q4')}          trend="up"   icon={Target}             />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['adds', 'quality', 'commK'] as const).map(k => (
            <button key={k} onClick={() => setDealerSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                dealerSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'adds' ? tt('Gross adds') : k === 'quality' ? tt('Quality') : tt('Commission')}
            </button>
          ))}
        </div>

        <Panel title={tt('Dealer performance — adds × quality (bubble = commission BSD K)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="adds" name={tt('Gross adds')} stroke="#999" fontSize={11}
                  label={{ value: tt('Gross adds / mo'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis type="number" dataKey="quality" name={tt('Quality')} stroke="#999" fontSize={11} domain={[40, 100]}
                  label={{ value: tt('Quality score'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis type="number" dataKey="commK" range={[80, 400]} />
                <Tooltip contentStyle={TS} formatter={(v: any, n: any) => [v, tt(n)]} />
                <Scatter data={DEALERS}>
                  {DEALERS.map((d, i) => <Cell key={i} fill={d.status === 'gold' ? GREEN : d.status === 'silver' ? BLUE : RED} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" />{tt('CitySIM Kiosks: high adds, low quality (48) — a churn factory; cap volume or remediate.')}
            <ChevronRight className="w-3 h-3" />
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Dealer scorecard — sorted by selected metric')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Dealer')}</th>
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('Gross adds')}</th>
                    <th className="px-3 py-2 text-right">{tt('Quality')}</th>
                    <th className="px-3 py-2 text-right">{tt('90d churn %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Commission BSD K')}</th>
                    <th className="px-3 py-2">{tt('Tier')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDealers.map(d => (
                    <tr key={d.dealer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{d.dealer}</td>
                      <td className="px-3 py-2 text-vfes-dark/60 text-xs">{d.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.adds.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-bold">
                        <span className={d.quality < 65 ? 'text-red-600' : d.quality < 80 ? 'text-amber-600' : 'text-emerald-600'}>{d.quality}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={d.ninety > 10 ? 'text-red-600 font-bold' : d.ninety > 7 ? 'text-amber-600' : 'text-emerald-600'}>{d.ninety}%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.commK}K</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(d.status)}`}>{tt(d.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline">{tt('Open Churn & Retention →')}</Link>
              <Link to="/portal/customer-360"    className="font-bold text-vfes-dark hover:underline">{tt('Open Customer 360 →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ ECONOMICS ══════════════════════════════════════════════════════ */}
      {tab === 'economics' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Lowest CAC channel')}  value="BSD 31"   delta={tt('Digital / D2C')}              trend="up"   icon={TrendingUp}   accent />
          <KpiCard label={tt('Highest CAC channel')} value="BSD 78"   delta={tt('Owned retail')}               trend="flat" icon={Store}              />
          <KpiCard label={tt('Highest 90d churn')}   value="11.2%" delta={tt('Telesales — restructure')}   trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Blended CAC')}          value="BSD 52"   delta={tt('−BSD 4 vs prior year')}           trend="up"   icon={Target}             />
        </div>

        <Panel title={tt('Channel economics — CAC (BSD ) vs 90-day churn (%)')}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={ECONOMICS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="ch" stroke="#999" fontSize={10} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="BSD " />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="cac"     fill={BLUE} radius={[6, 6, 0, 0]} name={tt('CAC BSD ')} />
                <Bar yAxisId="r" dataKey="churn90" radius={[6, 6, 0, 0]}             name={tt('90-day churn %')}>
                  {ECONOMICS.map((e, i) => <Cell key={i} fill={e.churn90 >= 9 ? RED : e.churn90 >= 6 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">
            {tt('Digital/D2C has the lowest CAC (BSD 31) and low 90-day churn (5.4%) — the channel to grow. Telesales has both the worst unit economics and the highest churn.')}
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-black/5 bg-white p-4 lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Economics insight')}</div>
            <p className="text-sm text-vfes-dark/75 mb-2">
              {tt('Telesales has the highest 90-day churn (11.2%) and a moderate CAC (BSD 44) — structural underperformance. The channel should pivot toward inbound rather than outbound dialling.')}
            </p>
            <p className="text-sm text-vfes-dark/75">
              {tt('Independent dealers combine low CAC with high churn — they attract price-sensitive customers with limited brand loyalty. Aligning their incentive structure to 90-day retention should improve quality.')}
            </p>
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('See also')}</div>
            <div className="flex flex-col gap-2 text-xs font-semibold">
              <Link to="/portal/pricing-simulator"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Pricing Simulator')}</Link>
              <Link to="/portal/bundle-profitability" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Bundle Profitability')}</Link>
              <Link to="/portal/finance"             className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Finance')}</Link>
              <Link to="/portal/b2b"                 className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('B2B')}</Link>
            </div>
          </div>
        </div>
      </>)}

      {/* ══ SCORECARD ══════════════════════════════════════════════════════ */}
      {tab === 'scorecard' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Gold tier dealers')}  value="2"  delta={tt('quality ≥ 85, volume leaders')} trend="up"   icon={Award}        accent />
          <KpiCard label={tt('Silver tier dealers')} value="4"  delta={tt('quality 70–84')}              trend="flat" icon={Award}              />
          <KpiCard label={tt('Watch tier dealers')}  value="2"  delta={tt('quality plans in progress')}  trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Avg quality score')}   value="74" delta={tt('target ≥ 80 by Q4-26')}       trend="up"   icon={Target}             />
        </div>

        <Panel title={tt('Dealer quality score — horizontal bar scorecard')}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={sortedDealers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="dealer" width={180} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="quality" name={tt('Quality score')} radius={[0, 4, 4, 0]}>
                  {sortedDealers.map((d, i) => <Cell key={i} fill={d.quality < 65 ? RED : d.quality < 80 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Red < 65 = watch · Amber 65–79 = silver · Green ≥ 80 = gold tier')}</div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Full dealer scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Dealer')}</th>
                    <th className="px-3 py-2 text-right">{tt('Gross adds')}</th>
                    <th className="px-3 py-2 text-right">{tt('Quality')}</th>
                    <th className="px-3 py-2 text-right">{tt('90d churn %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Commission BSD K')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDealers.map(d => (
                    <tr key={d.dealer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{d.dealer}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.adds.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-bold ${
                          d.quality < 65 ? 'text-red-600' : d.quality < 80 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{d.quality}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={d.ninety > 10 ? 'text-red-600 font-bold' : d.ninety > 7 ? 'text-amber-600' : 'text-emerald-600'}>{d.ninety}%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.commK}K</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(d.status)}`}>{tt(d.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ COMMISSIONS ════════════════════════════════════════════════════ */}
      {tab === 'commissions' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total commission spend')} value={`BSD ${totalComm}K`}                        delta={tt('current month')}             trend="flat" icon={BadgePercent} accent />
          <KpiCard label={tt('Quality bonus pool')}      value="BSD 114K"                                  delta={tt('+BSD 26K vs January')}           trend="up"   icon={Award}              />
          <KpiCard label={tt('Avg commission / add')}    value={`BSD ${Math.round(totalComm * 1000 / totalAdds)}`} delta={tt('per gross add')}      trend="flat" icon={Target}             />
          <KpiCard label={tt('Quality cap savings')}     value="BSD 42K"                                  delta={tt('from watch-tier controls')}  trend="up"   icon={TrendingUp}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['tier', 'dealer'] as const).map(k => (
            <button key={k} onClick={() => setCommView(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                commView === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'tier' ? tt('By tier') : tt('By dealer')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Commission spend trend — total vs quality bonus (BSD K/mo)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={COMM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="total"     name={tt('Total commission BSD K')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="qualBonus" name={tt('Quality bonus BSD K')}  stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Quality bonus growing as gold-tier dealers lift adds — the incentive structure is working.')}</div>
          </Panel>

          <Panel title={tt('Commission by dealer — current month (BSD K)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={DEALERS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="K" />
                  <YAxis type="category" dataKey="dealer" width={170} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="commK" name={tt('Commission BSD K')} radius={[0, 4, 4, 0]}>
                    {DEALERS.map((d, i) => <Cell key={i} fill={d.status === 'gold' ? GREEN : d.status === 'silver' ? BLUE : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {commView === 'tier' ? (
          <Panel title={tt('Commission tier structure')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Tier')}</th>
                    <th className="px-3 py-2 text-right">{tt('Gross rate BSD /add')}</th>
                    <th className="px-3 py-2 text-right">{tt('Quality bonus BSD /add')}</th>
                    <th className="px-3 py-2 text-right">{tt('Min quality score')}</th>
                    <th className="px-3 py-2 text-right">{tt('Dealers')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMM_TIERS.map(t => (
                    <tr key={t.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(t.tier)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {t.rateGross}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.rateQual > 0 ? `BSD ${t.rateQual}` : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.minQual > 0 ? t.minQual : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.dealers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <Panel title={tt('Commission detail by dealer')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Dealer')}</th>
                    <th className="px-3 py-2 text-right">{tt('Gross adds')}</th>
                    <th className="px-3 py-2 text-right">{tt('Quality')}</th>
                    <th className="px-3 py-2 text-right">{tt('Rate BSD /add')}</th>
                    <th className="px-3 py-2 text-right">{tt('Total BSD K')}</th>
                    <th className="px-3 py-2">{tt('Tier')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEALERS.map(d => {
                    const rate = d.status === 'gold' ? 42 : d.status === 'silver' ? 38 : 28
                    return (
                      <tr key={d.dealer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold text-xs">{d.dealer}</td>
                        <td className="px-3 py-2 text-right font-mono">{d.adds.toLocaleString('en-BS')}</td>
                        <td className="px-3 py-2 text-right font-mono">{d.quality}</td>
                        <td className="px-3 py-2 text-right font-mono">BSD {rate}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">BSD {d.commK}K</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(d.status)}`}>{tt(d.status)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </>)}

      {/* ══ STORES ═════════════════════════════════════════════════════════ */}
      {tab === 'stores' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active stores')}   value="200"   delta={tt('owned + franchise + indep')} trend="flat" icon={Store}     accent />
          <KpiCard label={tt('Best NPS store')}  value="52"    delta={tt('Nassau Bay Street')}           trend="up"   icon={Award}         />
          <KpiCard label={tt('Best conversion')} value="18.2%" delta={tt('Nassau Bay Street')}           trend="up"   icon={Target}        />
          <KpiCard label={tt('Avg store ARPU')}  value="BSD 26.2" delta={tt('+BSD 0.8 YoY')}               trend="up"   icon={TrendingUp}    />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Store type:')}</span>
          {(['All', 'Owned', 'Franchise', 'Independent'] as const).map(t => (
            <button key={t} onClick={() => setStoreFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                storeFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(t)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Store gross adds trend — by type')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={STORE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="owned"       name={tt('Owned')}       stroke={NAVY}  fill={NAVY}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="franchise"   name={tt('Franchise')}   stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="independent" name={tt('Independent')} stroke={SLATE} fill={SLATE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Store NPS vs conversion rate (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredStores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="store" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="nps"  name={tt('NPS')}          fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conv" name={tt('Conversion %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Store performance scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Store')}</th>
                  <th className="px-3 py-2">{tt('Region')}</th>
                  <th className="px-3 py-2">{tt('Type')}</th>
                  <th className="px-3 py-2 text-right">{tt('Gross adds')}</th>
                  <th className="px-3 py-2 text-right">{tt('ARPU BSD ')}</th>
                  <th className="px-3 py-2 text-right">{tt('NPS')}</th>
                  <th className="px-3 py-2 text-right">{tt('Conv %')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map(s => (
                  <tr key={s.store} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{s.store}</td>
                    <td className="px-3 py-2 text-vfes-dark/60 text-xs">{s.region}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        s.type === 'Owned' ? 'bg-blue-50 text-blue-700'
                        : s.type === 'Franchise' ? 'bg-purple-50 text-purple-700'
                        : 'bg-slate-50 text-slate-600'
                      }`}>{tt(s.type)}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{s.adds}</td>
                    <td className="px-3 py-2 text-right font-mono">BSD {s.arpu}</td>
                    <td className="px-3 py-2 text-right font-bold">
                      <span className={s.nps >= 48 ? 'text-emerald-600' : s.nps >= 40 ? 'text-amber-600' : 'text-red-600'}>{s.nps}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{s.conv}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/sales" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Sales →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ GEO ════════════════════════════════════════════════════════════ */}
      {tab === 'geo' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Regions covered')}  value="9"     delta={tt('national footprint')}        trend="flat" icon={MapPin}    accent />
          <KpiCard label={tt('Top region adds')}   value="8,240" delta={tt('Nassau — 31.2% share')}    trend="up"   icon={TrendingUp}      />
          <KpiCard label={tt('Total dealers')}     value="1,240" delta={tt('across all regions')}        trend="flat" icon={Store}          />
          <KpiCard label={tt('Total stores')}      value="200"   delta={tt('owned + franchise + indep')} trend="flat" icon={Building2}       />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Metric:')}</span>
          {(['adds', 'share'] as const).map(k => (
            <button key={k} onClick={() => setGeoMetric(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                geoMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'adds' ? tt('Gross adds') : tt('Market share %')}
            </button>
          ))}
        </div>

        <Panel title={tt('Regional gross adds / market share')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={geoChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit={geoMetric === 'share' ? '%' : ''} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="metricVal" name={geoMetric === 'adds' ? tt('Gross adds') : tt('Market share %')} radius={[4, 4, 0, 0]}>
                  {geoChartData.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE, '#75CDF0', RED, BLUE][i % 9]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Regional breakdown — dealers, stores, adds, market share')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('Dealers')}</th>
                    <th className="px-3 py-2 text-right">{tt('Stores')}</th>
                    <th className="px-3 py-2 text-right">{tt('Gross adds')}</th>
                    <th className="px-3 py-2 text-right">{tt('Market share %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {GEO_DATA.map(g => (
                    <tr key={g.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{g.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{g.dealers}</td>
                      <td className="px-3 py-2 text-right font-mono">{g.stores}</td>
                      <td className="px-3 py-2 text-right font-mono">{g.adds.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-bold">
                        <span className={g.share >= 20 ? 'text-emerald-600' : g.share >= 10 ? 'text-amber-600' : 'text-vfes-dark/60'}>{g.share}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/b2b"           className="font-bold text-vfes-dark hover:underline">{tt('Open B2B →')}</Link>
              <Link to="/portal/mvno-wholesale" className="font-bold text-vfes-dark hover:underline">{tt('Open MVNO & Wholesale →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ FORECAST ═══════════════════════════════════════════════════════ */}
      {tab === 'forecast' && (<>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Base forecast adds')}   value="48.0K" delta={tt('December target')}    trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Optimistic upside')}    value="52.0K" delta={tt('+8.3% vs base')}      trend="up"   icon={Award}            />
          <KpiCard label={tt('Conservative floor')}   value="44.0K" delta={tt('−8.3% vs base')}      trend="down" icon={TrendingDown}     />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Highlight scenario:')}</span>
          {(['base', 'optimistic', 'conservative'] as const).map(k => (
            <button key={k} onClick={() => setForecastScenario(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                forecastScenario === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'base' ? tt('Base') : k === 'optimistic' ? tt('Optimistic') : tt('Conservative')}
            </button>
          ))}
        </div>

        <Panel title={tt('Dealer gross adds forecast — actual vs scenario (K/mo)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="K" domain={[36, 54]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar  dataKey="actual"       name={tt('Actual')}             fill={NAVY}  radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="scenarioVal" name={tt('Selected scenario')} stroke={RED}   strokeWidth={2.6} dot={false} />
                <Line type="monotone" dataKey="base"         name={tt('Base')}             stroke={BLUE}  strokeWidth={1.6} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="optimistic"   name={tt('Optimistic')}       stroke={GREEN} strokeWidth={1.2} strokeDasharray="2 4" dot={false} />
                <Line type="monotone" dataKey="conservative" name={tt('Conservative')}     stroke={AMBER} strokeWidth={1.2} strokeDasharray="2 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('Actual adds are tracking above base — digital channel growth is the swing factor in the optimistic scenario.')}
          </div>
        </Panel>

        <div className="mt-6 rounded-xl border border-black/5 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Deep dive')}</div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link to="/portal/ai-insights"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
            <Link to="/portal/company-360"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Company 360')}</Link>
            <Link to="/portal/product"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Product')}</Link>
            <Link to="/portal/price-wargame" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Price War-game')}</Link>
          </div>
        </div>
      </>)}

      {/* ── Channel health summary (always visible) ─────────────────────────── */}
      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Channel health — headline metrics')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ECONOMICS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="ch" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="BSD " />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="cac"     name={tt('CAC BSD ')}           fill={NAVY}  radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="churn90" name={tt('90-day churn %')}  fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div>
          <Panel title={tt('Quick links')}>
            <div className="flex flex-col gap-2 text-sm font-semibold py-2">
              <Link to="/portal/sales"             className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Sales overview')}</Link>
              <Link to="/portal/b2b"               className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('B2B sales')}</Link>
              <Link to="/portal/promotions"        className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Promotions')}</Link>
              <Link to="/portal/churn-retention"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Churn & Retention')}</Link>
              <Link to="/portal/customer-360"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Customer 360')}</Link>
              <Link to="/portal/device-financing"  className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Device Financing')}</Link>
              <Link to="/portal/digital-funnel"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Digital Funnel')}</Link>
              <Link to="/portal/marketing"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Marketing')}</Link>
              <Link to="/portal/price-wargame"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Price War-game')}</Link>
              <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Pricing Simulator')}</Link>
              <Link to="/portal/ai-insights"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
              <Link to="/portal/finance"           className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Finance')}</Link>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Dealer quality distribution chart ──────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Dealer quality distribution — adds by tier')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={DEALERS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="dealer" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="adds" name={tt('Gross adds / mo')} radius={[4, 4, 0, 0]}>
                  {DEALERS.map((d, i) => <Cell key={i} fill={d.status === 'gold' ? GREEN : d.status === 'silver' ? BLUE : RED} />)}
                </Bar>
                <Bar dataKey="quality" name={tt('Quality score')} radius={[4, 4, 0, 0]} fill={AMBER} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('Green = gold tier · Blue = silver · Red = watch. Quality must trend up before commission caps are lifted.')}
          </div>
        </Panel>
      </div>

      {/* ── Commission vs quality scatter ──────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Commission efficiency — BSD K per quality point by dealer')}>
          <div className="h-52">
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="quality" name={tt('Quality score')} stroke="#999" fontSize={11}
                  label={{ value: tt('Quality score'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis type="number" dataKey="commK" name={tt('Commission BSD K')} stroke="#999" fontSize={11}
                  label={{ value: tt('Comm BSD K'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis type="number" dataKey="adds" range={[60, 300]} />
                <Tooltip contentStyle={TS} formatter={(v: any, n: any) => [v, tt(n)]} />
                <Scatter data={DEALERS}>
                  {DEALERS.map((d, i) => <Cell key={i} fill={d.status === 'gold' ? GREEN : d.status === 'silver' ? BLUE : RED} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('Dealers in the top-right (high quality, lower commission per quality point) are the most efficient spend. Watch-tier dealers should receive reduced allocation until quality improves.')}
          </div>
        </Panel>
      </div>

      {/* ── Geographic adds line trend ──────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Regional gross adds — top 4 regions monthly trend')}>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={STORE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="owned"       name={tt('Owned retail')}   stroke={NAVY}  strokeWidth={2.4} dot />
                <Line type="monotone" dataKey="franchise"   name={tt('Franchise')}       stroke={BLUE}  strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="independent" name={tt('Independent')}     stroke={SLATE} strokeWidth={1.6} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Governance & compliance summary ─────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Dealer governance — compliance snapshot')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Control')}</th>
                  <th className="px-3 py-2">{tt('Description')}</th>
                  <th className="px-3 py-2 text-right">{tt('Dealers affected')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="px-3 py-2 font-semibold">{tt('Quality floor')}</td>
                  <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt('Commission cap when quality score < 65 for 2+ months')}</td>
                  <td className="px-3 py-2 text-right font-mono">2</td>
                  <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">{tt('Active')}</span></td>
                </tr>
                <tr className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="px-3 py-2 font-semibold">{tt('Churn threshold')}</td>
                  <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt('Review triggered when 90-day churn exceeds 10%')}</td>
                  <td className="px-3 py-2 text-right font-mono">2</td>
                  <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">{tt('Breached')}</span></td>
                </tr>
                <tr className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="px-3 py-2 font-semibold">{tt('Contract compliance')}</td>
                  <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt('Annual dealer contract review and renewal sign-off')}</td>
                  <td className="px-3 py-2 text-right font-mono">1,238</td>
                  <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{tt('Compliant')}</span></td>
                </tr>
                <tr className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="px-3 py-2 font-semibold">{tt('Brand standards')}</td>
                  <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt('Store branding, uniform, and materials audit')}</td>
                  <td className="px-3 py-2 text-right font-mono">12</td>
                  <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">{tt('Review')}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/mvno-wholesale"   className="font-bold text-vfes-dark hover:underline">{tt('MVNO & Wholesale →')}</Link>
            <Link to="/portal/bundle-profitability" className="font-bold text-vfes-dark hover:underline">{tt('Bundle Profitability →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Action summary ─────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Channel & Dealer intelligence')}</div>
          <div className="text-sm text-vfes-dark/80 mb-1">
            {tt('Run the Channel Optimiser agent to get an updated dealer quality ranking, commission reallocation recommendation and coaching action list for the watch-tier dealers.')}
          </div>
          <div className="text-xs text-vfes-dark/55">
            {tt('Recommended cadence: monthly channel review \u00b7 quarterly dealer QBR \u00b7 annual commission structure review.')}
          </div>
          <div className="text-[10px] text-vfes-dark/40 mt-1">{tt('Data refreshed daily from CRM and commission system \u00b7 dealer scores updated nightly.')}</div>
        </div>
        <Link
          to="/portal/ai-insights"
          className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0"
        >
          <Brain className="w-4 h-4" />{tt('Open AI Insights →')}
        </Link>
      </div>

      <AskTheData />
    </div>
  )
}
