// ── RoamingPage.tsx
// Roaming P&L: outbound/inbound revenue, IOT margins, steering, settlement, forecast
// Domain: international roaming, bundled regulation, wholesale IOT agreements
import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Globe2, Plane, TrendingUp, Brain, ChevronRight,
  ArrowLeftRight, Route, Users, FileText, BarChart2,
  DollarSign, AlertTriangle, Clock, CheckCircle, Activity, Shield,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend, Cell, Line, LineChart, Pie, PieChart,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const LIGHT  = '#75CDF0'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'

// ── data ──────────────────────────────────────────────────────────────────────
const MONTHLY = [
  { m: 'Jun', outRev: 4.2, inRev: 3.1, iot: 1.8 }, { m: 'Jul', outRev: 3.8, inRev: 2.9, iot: 1.7 },
  { m: 'Aug', outRev: 4.6, inRev: 3.4, iot: 1.9 }, { m: 'Sep', outRev: 5.1, inRev: 3.8, iot: 2.0 },
  { m: 'Oct', outRev: 6.4, inRev: 4.6, iot: 2.4 }, { m: 'Nov', outRev: 8.9, inRev: 6.2, iot: 3.1 },
  { m: 'Dec', outRev: 11.2, inRev: 7.8, iot: 3.8 }, { m: 'Jan', outRev: 12.6, inRev: 8.4, iot: 4.0 },
]

const TOP_DEST = [
  { country: 'Spain',       out: 19.2, margin: 33, type: 'RoW' },
  { country: 'France',      out: 16.1, margin: 30, type: 'RoW' },
  { country: 'Netherlands', out: 12.4, margin: 31, type: 'RoW' },
  { country: 'Turkey',      out: 10.8, margin: 16, type: 'RoW' },
  { country: 'Morocco',     out:  9.4, margin: 15, type: 'RoW' },
  { country: 'Italy',       out:  8.6, margin: 34, type: 'RoW' },
  { country: 'Germany',     out:  7.9, margin: 31, type: 'RoW' },
  { country: 'UK',          out:  6.8, margin: 24, type: 'RoW' },
]

const IOT_PARTNERS = [
  { partner: 'Rival ISP A FR',    inMargin: 0.0042, outMargin: 0.0038, status: 'renegotiate', vol: 124 },
  { partner: 'TIM IT',       inMargin: 0.0051, outMargin: 0.0044, status: 'live', vol: 98 },
  { partner: 'Deutsche Tel', inMargin: 0.0048, outMargin: 0.0041, status: 'live', vol: 86 },
  { partner: 'Britcom UK',   inMargin: 0.0036, outMargin: 0.0033, status: 'renegotiate', vol: 72 },
  { partner: 'AT&T US',      inMargin: 0.0029, outMargin: 0.0026, status: 'capped', vol: 54 },
]

const STEER = [
  { country: 'France',  current: 62, target: 80, partner: 'Rival ISP A FR' },
  { country: 'Italy',   current: 74, target: 78, partner: 'TIM IT' },
  { country: 'Germany', current: 55, target: 75, partner: 'Deutsche Tel' },
  { country: 'UK',      current: 48, target: 35, partner: 'Britcom UK' },
  { country: 'USA',     current: 70, target: 60, partner: 'AT&T US' },
]

const TRAVELERS = [
  { seg: 'Leisure (US)',   subs: 1840000, arpu:  6.2, share: 54 },
  { seg: 'Business (US)',  subs:  420000, arpu: 18.4, share: 22 },
  { seg: 'Leisure (RoW)', subs:  310000, arpu: 22.1, share: 14 },
  { seg: 'Business (RoW)', subs:  96000, arpu: 41.8, share: 10 },
]

const DEALS = [
  { partner: 'Rival ISP A FR',    type: 'Discount agreement', expiry: 'Q1 2027', status: 'renegotiate', valueM: 4.8 },
  { partner: 'TIM IT',       type: 'Balanced (in=out)',  expiry: 'Q3 2027', status: 'live',        valueM: 3.2 },
  { partner: 'Deutsche Tel', type: 'Volume commitment',  expiry: 'Q2 2027', status: 'live',        valueM: 2.9 },
  { partner: 'Britcom UK',   type: 'Legacy IOT',         expiry: 'expired',  status: 'renegotiate', valueM: 2.1 },
  { partner: 'AT&T US',      type: 'Capped premium',     expiry: 'Q4 2027', status: 'capped',      valueM: 1.6 },
]

const INBOUND_SOURCES = [
  { country: 'France',      inboundM: 8.4, visitors: 312000, arpu: 26.9 },
  { country: 'Germany',     inboundM: 7.1, visitors: 248000, arpu: 28.6 },
  { country: 'UK',          inboundM: 6.8, visitors: 220000, arpu: 30.9 },
  { country: 'Netherlands', inboundM: 6.2, visitors: 218000, arpu: 28.4 },
  { country: 'Italy',       inboundM: 5.4, visitors: 196000, arpu: 27.6 },
  { country: 'USA',         inboundM: 3.6, visitors:  82000, arpu: 43.9 },
]

const SETTLEMENT_Q2 = [
  { partner: 'Rival ISP A FR',    outPayM: 3.8, inRecM: 4.1, netM: 0.3, status: 'settled' },
  { partner: 'TIM IT',       outPayM: 2.9, inRecM: 2.7, netM: -0.2, status: 'settled' },
  { partner: 'Deutsche Tel', outPayM: 2.4, inRecM: 2.6, netM: 0.2, status: 'settled' },
  { partner: 'Britcom UK',   outPayM: 1.8, inRecM: 1.4, netM: -0.4, status: 'dispute' },
  { partner: 'AT&T US',      outPayM: 1.2, inRecM: 0.9, netM: -0.3, status: 'pending' },
]

const INBOUND_TREND = [
  { m: 'Jun', total: 3.1 }, { m: 'Jul', total: 2.9 }, { m: 'Aug', total: 3.4 },
  { m: 'Sep', total: 3.8 }, { m: 'Oct', total: 4.6 }, { m: 'Nov', total: 6.2 },
  { m: 'Dec', total: 7.8 }, { m: 'Jan', total: 8.4 },
]

const FORECAST = [
  { q: 'Q1 2026', actual: 38.4, forecast: null },
  { q: 'Q2 2026', actual: 41.2, forecast: null },
  { q: 'Q3 2026', actual: 18.3, forecast: null },
  { q: 'Q4 2026', actual: 39.6, forecast: null },
  { q: 'Q1 2027', actual: null, forecast: 52.8 },
  { q: 'Q2 2027', actual: null, forecast: 44.1 },
]

const IOT_TREND = [
  { m: 'Jun', us: 1.2, row: 0.6 }, { m: 'Jul', us: 1.1, row: 0.6 },
  { m: 'Aug', us: 1.3, row: 0.6 }, { m: 'Sep', us: 1.4, row: 0.6 },
  { m: 'Oct', us: 1.7, row: 0.7 }, { m: 'Nov', us: 2.1, row: 1.0 },
  { m: 'Dec', us: 2.6, row: 1.2 }, { m: 'Jan', us: 2.8, row: 1.2 },
]

const ML_IOT_PRED = [
  { partner: 'Rival ISP A FR',    current: 0.0038, optimal: 0.0044 },
  { partner: 'TIM IT',       current: 0.0044, optimal: 0.0044 },
  { partner: 'Deutsche Tel', current: 0.0041, optimal: 0.0046 },
  { partner: 'Britcom UK',   current: 0.0033, optimal: 0.0040 },
  { partner: 'AT&T US',      current: 0.0026, optimal: 0.0032 },
]

const EU_ROW_MIX = [
  { name: 'US/Canada bundled', value: 71 },
  { name: 'Rest-of-World',       value: 29 },
]

// ── tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'destinations' | 'iot' | 'steering' | 'partners' | 'inbound' | 'settlement' | 'forecast'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',    label: 'Overview',     icon: Globe2 },
  { id: 'destinations', label: 'Destinations', icon: Plane },
  { id: 'iot',         label: 'IOT Margins',  icon: ArrowLeftRight },
  { id: 'steering',    label: 'Steering',     icon: Route },
  { id: 'partners',    label: 'Partners',     icon: Users },
  { id: 'inbound',     label: 'Inbound',      icon: Activity },
  { id: 'settlement',  label: 'Settlement',   icon: FileText },
  { id: 'forecast',    label: 'Forecast',     icon: TrendingUp },
]

export default function RoamingPage() {
  const { i18n } = useTranslation()

  // ── hooks (≥10) ────────────────────────────────────────────────────────────
  const [tab, setTab]                       = useState<TabId>('overview')
  const [partnerFilter, setPartnerFilter]   = useState<string>('all')
  const [regionFilter, setRegionFilter]     = useState<'all' | 'US' | 'RoW'>('all')
  const [iotThreshold, setIotThreshold]     = useState<number>(0.004)
  const [destSort, setDestSort]             = useState<'rev' | 'margin'>('rev')
  const [showEuOnly, setShowEuOnly]         = useState<boolean>(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const totalOut = MONTHLY.reduce((s, m) => s + m.outRev, 0)
  const totalIn  = MONTHLY.reduce((s, m) => s + m.inRev,  0)

  // interactive useMemo — recomputes when user changes filter/sort
  const filteredDest = useMemo(() => {
    const src = regionFilter === 'all' ? TOP_DEST : TOP_DEST.filter(d => d.type === regionFilter)
    return [...src].sort((a, b) => destSort === 'rev' ? b.out - a.out : b.margin - a.margin)
  }, [regionFilter, destSort])

  const belowIotThreshold = useMemo(
    () => IOT_PARTNERS.filter(p => p.outMargin < iotThreshold),
    [iotThreshold],
  )

  const filteredPartners = useMemo(
    () => partnerFilter === 'all' ? IOT_PARTNERS : IOT_PARTNERS.filter(p => p.status === partnerFilter),
    [partnerFilter],
  )

  const totalSettlement = useMemo(
    () => SETTLEMENT_Q2.reduce((s, p) => s + p.netM, 0), [],
  )

  const forecastTotal = useMemo(
    () => FORECAST.filter(f => f.forecast !== null).reduce((s, f) => s + (f.forecast ?? 0), 0), [],
  )

  const statusColor = useCallback((s: string) =>
    s === 'live' ? 'bg-emerald-50 text-emerald-700'
      : s === 'renegotiate' ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-700', [])

  const settlColor = (s: string) =>
    s === 'settled' ? 'bg-emerald-50 text-emerald-700' : s === 'dispute' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Roaming P&L')}
        subtitle={tt('Outbound vs inbound · IOT margins · US/Canada bundled vs RoW · top destinations · wholesale settlement')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">BSD {(totalOut + totalIn).toFixed(0)}M {tt('YTD')}</span>}
      />

      {/* ── ML Insight ── */}
      <MlInsightSection
        heading={tt('Roaming revenue intelligence')}
        models={[
          { name: tt('IOT rate optimiser'),        metric: 'BSD 1.4M',  sub: tt('annualised margin recovery') },
          { name: tt('Seasonal demand forecaster'), metric: '94%',   sub: tt('forecast accuracy (MAE)') },
          { name: tt('Steering quality guard'),     metric: '0.3%',  sub: tt('QoS breach risk') },
        ]}
        agentLabel={tt('Run Roaming Intelligence Agent')}
        agentRunningLabel={tt('Routing analysis…')}
        agentSteps={[
          tt('Read live IOT rate cards & quality KPIs per partner'),
          tt('Compared current steering share vs optimal target'),
          tt('Re-weighted PLMN preference to lowest-cost qualifying partner'),
          tt('Pushed steering profile to HLR/HSS & flagged deal gaps'),
        ]}
        agentBlurb={tt('Routing and IOT models run in Snowflake ML. Seasonal demand forecaster trained on 4 years of CDR data. Quality guardrail model prevents SLA breaches.')}
        decision={{
          title:    tt('Re-steer France & Germany; renegotiate Britcom UK & Rival ISP A FR'),
          detail:   tt('France steered at 62% vs 80% optimal — shifting share captures discount tiers and recovers BSD 0.8M. Britcom UK on expired legacy IOT — renegotiate or de-prefer.'),
          impact:   tt('~BSD 1.4M annualised IOT margin recovery'),
          risk:     tt('over-steering can breach quality SLAs — keep guardrails'),
          linkTo:   '/portal/mvno-wholesale',
          linkLabel: tt('Open MVNO & Wholesale'),
        }}
        chart={{
          kind:  'bar',
          title: tt('Current vs optimal IOT out-margin by partner (BSD /MB)'),
          data:  ML_IOT_PRED,
          xKey:  'partner',
          series: [
            { key: 'current', name: tt('Current BSD /MB'),  color: BLUE },
            { key: 'optimal', name: tt('Optimal BSD /MB'),  color: GREEN },
          ],
          note: tt('Gap between current and optimal represents recoverable IOT margin. Britcom UK and AT&T show largest opportunity.'),
        }}
      />

      {/* ── pill tabs (8) ── */}
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

      {/* ═══════════════════════════  OVERVIEW  ══════════════════════════════ */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Outbound revenue YTD')} value={`BSD ${totalOut.toFixed(1)}M`} delta={tt('+18% summer peak')} trend="up"   icon={Plane}      accent />
            <KpiCard label={tt('Inbound revenue YTD')}  value={`BSD ${totalIn.toFixed(1)}M`}  delta={tt('inbound visitors')} trend="up"   icon={Globe2} />
            <KpiCard label={tt('Blended IOT margin')}   value="28%"                         delta={tt('+1.4 pp vs plan')} trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('US/Canada bundled share')}   value="71%"                         delta={tt('bundled glide-path')} trend="flat" icon={Globe2} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active IOT partners')}  value="5"      delta={tt('2 renegotiation')}   trend="flat" icon={ArrowLeftRight} />
            <KpiCard label={tt('Expired deals')}        value="1"      delta={tt('Britcom UK')}         trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Total travelers (YTD)')} value="2.67M" delta={tt('outbound base')}      trend="up"   icon={Users} />
            <KpiCard label={tt('Peak month revenue')}   value="BSD 21M"   delta={tt('Aug — July/Aug 3×')} trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('Roaming revenue — monthly (BSD M)')}>
            <div className="h-72" ref={chartRef}>
              <ResponsiveContainer>
                <AreaChart data={MONTHLY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="outRev" stackId="1" stroke={NAVY}  fill={NAVY}  name={tt('Outbound')} />
                  <Area type="monotone" dataKey="inRev"  stackId="1" stroke={BLUE}  fill={BLUE}  name={tt('Inbound')} />
                  <Area type="monotone" dataKey="iot"    stackId="1" stroke={LIGHT} fill={LIGHT} name={tt('IOT wholesale')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Summer travel drives 3× July/Aug uplift — pre-buy IOT capacity for next season now.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('US/Canada bundled vs Rest-of-World mix')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={EU_ROW_MIX} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      <Cell fill={BLUE} />
                      <Cell fill={NAVY} />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Share')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('US/Canada bundle share at 71% — margin pressure from regulated glide-path offset by RoW premium.')}
              </div>
            </Panel>

            <Panel title={tt('IOT wholesale revenue — US vs RoW (BSD M)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={IOT_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`BSD ${v}M`, tt(n)]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="us"  stackId="1" stroke={BLUE} fill={BLUE} name={tt('US/Canada bundled')} />
                    <Area type="monotone" dataKey="row" stackId="1" stroke={NAVY} fill={NAVY} name={tt('Rest-of-World')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <Link to="/portal/mvno-wholesale" className="text-vfes-dark font-semibold hover:underline">{tt('→ MVNO & Wholesale')}</Link>
            <Link to="/portal/finance"        className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance P&L')}</Link>
            <Link to="/portal/network"        className="text-vfes-dark font-semibold hover:underline">{tt('→ Network capacity')}</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <KpiCard label={tt('Best outbound month')}    value="Aug BSD 21M"  delta={tt('Jul+Aug peak')}       trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Inbound/outbound ratio')} value="0.62×"     delta={tt('stable YTD')}         trend="flat" icon={ArrowLeftRight} />
            <KpiCard label={tt('IOT revenue (YTD)')}      value="BSD 18.5M"    delta={tt('+19% YoY')}           trend="up"   icon={Globe2} />
            <KpiCard label={tt('Total roaming revenue')}  value={`BSD ${(totalOut+totalIn).toFixed(0)}M`} delta={tt('YTD combined')} trend="up" icon={DollarSign} />
          </div>
        </>
      )}

      {/* ═══════════════════════════  DESTINATIONS  ══════════════════════════ */}
      {tab === 'destinations' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Top destination revenue')} value="BSD 19.2M"  delta={tt('Spain')}          trend="up"   icon={Plane}      accent />
            <KpiCard label={tt('US destinations')}         value="5"        delta={tt('of top 8')}      trend="flat" icon={Globe2} />
            <KpiCard label={tt('Highest margin dest.')}    value="Italy 34%"  delta={tt('US/Canada bundled')} trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Lowest margin dest.')}     value="Morocco 15%" delta={tt('low-cost RoW')} trend="down" icon={AlertTriangle} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Region:')}</span>
            {(['all', 'US', 'RoW'] as const).map(r => (
              <button key={r} onClick={() => setRegionFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${regionFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(r)}
              </button>
            ))}
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest ml-4">{tt('Sort by:')}</span>
            {(['rev', 'margin'] as const).map(s => (
              <button key={s} onClick={() => setDestSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${destSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(s === 'rev' ? 'Revenue' : 'Margin')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total destinations')} value="8"       delta={tt('5 US · 3 RoW')}       trend="flat" icon={Globe2} />
            <KpiCard label={tt('US/Canada bundle countries')}  value="5"       delta={tt('regulated tariff')}   trend="flat" icon={Globe2} />
            <KpiCard label={tt('RoW destinations')}   value="3"       delta={tt('premium margin')}     trend="up"   icon={Plane} />
            <KpiCard label={tt('Avg out-margin')}     value="24.5%"   delta={tt('blended all dest.')}  trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('Top outbound destinations — revenue (BSD M) & margin')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={filteredDest}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="country" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, _n: any, p: any) => [`BSD ${v}M · ${p.payload.margin}% margin · ${p.payload.type}`, tt('Destination')]} />
                  <Bar dataKey="out" radius={[6, 6, 0, 0]}>
                    {filteredDest.map((d, i) => <Cell key={i} fill={d.type === 'US' ? BLUE : NAVY} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Blue = US/Canada bundled · Navy = Rest-of-World (premium margin, higher IOT cost).')}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('→ Pricing simulator')}</Link>
              <Link to="/portal/sales"             className="text-vfes-dark font-semibold hover:underline">{tt('→ Travel pass sales')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Destination margin & revenue table')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Country')}</th>
                    <th className="px-3 py-2">{tt('Type')}</th>
                    <th className="px-3 py-2 text-right">{tt('Revenue BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Est. subs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_DEST.map(d => (
                    <tr key={d.country} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{d.country}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.type === 'US' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{d.type}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.out.toFixed(1)}M</td>
                      <td className="px-3 py-2 text-right font-mono" style={{ color: d.margin >= 25 ? GREEN : AMBER }}>{d.margin}%</td>
                      <td className="px-3 py-2 text-right font-mono">{Math.round(d.out * 1e6 / 28).toLocaleString('en-BS')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  IOT MARGINS  ═══════════════════════════ */}
      {tab === 'iot' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Partners with IOT')}    value="5"      delta={tt('live + renegotiate')} trend="flat" icon={ArrowLeftRight} accent />
            <KpiCard label={tt('Below IOT threshold')}  value={String(belowIotThreshold.length)} delta={`<BSD ${iotThreshold.toFixed(4)}/MB`} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Total IOT volume')}     value="434 TB"  delta={tt('YTD outbound')}      trend="up"   icon={Activity} />
            <KpiCard label={tt('Renegotiation target')} value="2"       delta={tt('Rival ISP A FR, Britcom')} trend="flat" icon={Clock} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Avg out-margin (all)')}   value="BSD 0.0036" delta={tt('blended')}          trend="flat" icon={TrendingUp} />
            <KpiCard label={tt('Best out-margin')}        value="TIM IT"  delta={tt('BSD 0.0044/MB')}       trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('IOT renegotiation ROI')}  value="18×"    delta={tt('cost vs benefit')}   trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('IOT data growth YoY')}    value="+22%"   delta={tt('demand rising')}     trend="up"   icon={Activity} />
          </div>

          <div className="flex items-center gap-4 mb-4 bg-white rounded-xl border border-black/5 p-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('IOT alert threshold (BSD /MB):')}</span>
            <input type="range" min={0.002} max={0.006} step={0.0001} value={iotThreshold}
              onChange={e => setIotThreshold(+e.target.value)} className="w-40 accent-vfes-red" />
            <span className="font-bold text-vfes-dark text-sm">BSD {iotThreshold.toFixed(4)}</span>
            <span className="text-xs text-vfes-dark/55">{belowIotThreshold.length} {tt('partners flagged')}</span>
          </div>

          <Panel title={tt('Inter-Operator Tariff (IOT) margins by partner')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('In BSD /MB')}</th>
                    <th className="px-3 py-2 text-right">{tt('Out BSD /MB')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume (TB)')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.inMargin.toFixed(4)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${p.outMargin < iotThreshold ? 'text-red-600 font-bold' : ''}`}>BSD {p.outMargin.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.vol}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Rival ISP A FR & Britcom UK flagged for renegotiation — 196 TB at sub-target margin.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('IOT margin comparison — current vs target (BSD /MB × 10,000)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={ML_IOT_PRED}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} tickFormatter={v => (v * 10000).toFixed(0)} />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, n: any) => [`BSD ${Number(v).toFixed(4)}/MB`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current" fill={BLUE}  radius={[6, 6, 0, 0]} name={tt('Current')} />
                  <Bar dataKey="optimal" fill={GREEN} radius={[6, 6, 0, 0]} name={tt('Optimal target')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & settlement')}</Link>
              <Link to="/portal/ai-insights"      className="text-vfes-dark font-semibold hover:underline">{tt('→ AI rate optimiser')}</Link>
            </div>
          </Panel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('Total IOT margin gap')}   value="BSD 1.4M"   delta={tt('vs optimal rates')}  trend="down" icon={TrendingUp} />
            <KpiCard label={tt('Rival ISP A FR gap')}          value="BSD 0.8M"   delta={tt('largest gap')}       trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Britcom UK gap')}         value="BSD 0.5M"   delta={tt('expired deal')}      trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('IOT data volume (Aug)')}  value="74 TB"   delta={tt('peak month')}        trend="up"   icon={Activity} />
          </div>
        </>
      )}

      {/* ═══════════════════════════  STEERING  ══════════════════════════════ */}
      {tab === 'steering' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Steering gap France')}   value="18 pp"  delta={tt('62% vs 80% target')}  trend="down" icon={Route}         accent />
            <KpiCard label={tt('Steering gap Germany')}  value="20 pp"  delta={tt('55% vs 75% target')}  trend="down" icon={Route} />
            <KpiCard label={tt('UK over-steered')}       value="13 pp"  delta={tt('48% vs 35% target')}  trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Annualised recovery')}   value="BSD 1.4M"  delta={tt('all corrections')}    trend="up"   icon={TrendingUp} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Quality guardrails active')} value="5"    delta={tt('per partner')}       trend="flat" icon={Shield} />
            <KpiCard label={tt('Min quality threshold')}     value="98%"  delta={tt('call setup rate')}   trend="flat" icon={CheckCircle} />
            <KpiCard label={tt('Steering push latency')}     value="<1h"  delta={tt('HLR/HSS update')}    trend="up"   icon={Clock} />
            <KpiCard label={tt('SoR optimization cycles')}   value="4/yr" delta={tt('quarterly review')}  trend="flat" icon={Activity} />
          </div>
          <AgentDecision
            title={tt('Traffic steering agent — least-cost / best-quality routing')}
            label={tt('Run Steering Optimiser')}
            runningLabel={tt('Routing…')}
            steps={[
              tt('Read live IOT rate cards & quality KPIs per partner'),
              tt('Compared current steering share vs optimal target'),
              tt('Re-weighted PLMN preference to lowest-cost qualifying partner'),
              tt('Pushed steering profile to HLR/HSS & flagged deal gaps'),
            ]}
            hint={tt('Steering of roaming (SoR) moves traffic to the cheapest partner that still meets quality — every point of share shifts margin.')}
            result={{
              headline: tt('Re-steer France & Germany to preferred partners; renegotiate Britcom UK'),
              stats: [
                { label: tt('Outbound revenue YTD'), value: `BSD ${totalOut.toFixed(1)}M` },
                { label: tt('Blended IOT margin'),   value: '28%' },
                { label: tt('US/Canada bundled share'),   value: '71%' },
                { label: tt('Annualised recovery'),  value: 'BSD 1.4M' },
              ],
              findings: [
                tt('France and Germany are under-steered to our discounted partners (62% vs 80%, 55% vs 75%).'),
                tt('Shifting share captures discount tiers.'),
                tt('Britcom UK runs on an expired legacy IOT — renegotiate or de-prefer.'),
              ],
              note: tt('Over-steering can breach quality SLAs — keep guardrails.'),
            }}
            impact={tt('~BSD 1.4M annualised IOT margin recovery')}
            risk={tt('over-steering can breach quality SLAs — keep guardrails')}
            linkTo="/portal/mvno-wholesale"
            linkLabel={tt('Open MVNO & Wholesale')}
          />

          <Panel title={tt('Outbound steering share — current vs target (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={STEER}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="country" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, _n: any, p: any) => [`${v}% · ${p.payload.partner}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current" fill={BLUE} radius={[6, 6, 0, 0]} name={tt('Current share')} />
                  <Bar dataKey="target"  fill={NAVY} radius={[6, 6, 0, 0]} name={tt('Target share')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Gaps between current and target are recoverable margin via steering re-weighting.')}
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Traveler segments — outbound base')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={TRAVELERS} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} />
                    <YAxis type="category" dataKey="seg" stroke="#999" fontSize={10} width={110} />
                    <Tooltip contentStyle={{ fontSize: 12 }}
                      formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} subs · BSD ${p.payload.arpu} ARPU`, tt('Segment')]} />
                    <Bar dataKey="subs" radius={[0, 6, 6, 0]}>
                      {TRAVELERS.map((_, i) => <Cell key={i} fill={i < 2 ? BLUE : NAVY} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('Business & RoW travelers are 32% of base but carry 3–6× the ARPU — target them with travel passes.')}
              </div>
            </Panel>

            <Panel title={tt('Wholesale deal tracker')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Partner')}</th>
                      <th className="px-3 py-2">{tt('Deal type')}</th>
                      <th className="px-3 py-2">{tt('Expiry')}</th>
                      <th className="px-3 py-2 text-right">{tt('Value BSD M')}</th>
                      <th className="px-3 py-2">{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEALS.map(d => (
                      <tr key={d.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{d.partner}</td>
                        <td className="px-3 py-2">{tt(d.type)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{d.expiry}</td>
                        <td className="px-3 py-2 text-right font-mono">BSD {d.valueM.toFixed(1)}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(d.status)}`}>{tt(d.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('Britcom UK deal expired — BSD 2.1M at risk on legacy rates.')} <ChevronRight className="w-3 h-3" />
              </div>
            </Panel>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <Link to="/portal/network"    className="text-vfes-dark font-semibold hover:underline">{tt('→ Network HLR/HSS')}</Link>
            <Link to="/portal/ai-insights" className="text-vfes-dark font-semibold hover:underline">{tt('→ AI steering model')}</Link>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
            <strong>{tt('Steering advisory')}</strong> — {tt('Re-weight France PLMN list: move Rival ISP A FR from position 3 to position 1. Estimated monthly margin impact: +BSD 68K.')}
          </div>
        </>
      )}

      {/* ═══════════════════════════  PARTNERS  ══════════════════════════════ */}
      {tab === 'partners' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active IOT partners')} value="5"      delta={tt('global operators')} trend="flat" icon={Users}         accent />
            <KpiCard label={tt('Renegotiation open')}  value="2"      delta={tt('Rival ISP A FR, Britcom')} trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('Balanced agreements')} value="1"      delta={tt('TIM IT in=out')}   trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Avg deal value')}      value="BSD 2.9M"  delta={tt('annual')}          trend="flat" icon={DollarSign} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Highest-volume partner')} value="Rival ISP A FR" delta={tt('124 TB/qtr')}   trend="up"   icon={Activity} />
            <KpiCard label={tt('Partners expiring H1 27')} value="2"        delta={tt('Rival ISP A FR, DT')} trend="flat" icon={Clock} />
            <KpiCard label={tt('Total deal portfolio')}    value="BSD 14.6M"   delta={tt('annual value')}  trend="up"   icon={DollarSign} />
            <KpiCard label={tt('Last renegotiation')}      value="TIM IT"   delta={tt('Q3 2026')}       trend="flat" icon={FileText} />
          </div>

          <Panel title={tt('Partner directory — IOT agreements')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2">{tt('Deal type')}</th>
                    <th className="px-3 py-2">{tt('Expiry')}</th>
                    <th className="px-3 py-2 text-right">{tt('In BSD /MB')}</th>
                    <th className="px-3 py-2 text-right">{tt('Out BSD /MB')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume TB')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {IOT_PARTNERS.map((p, i) => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2 text-xs">{tt(DEALS[i]?.type ?? '')}</td>
                      <td className="px-3 py-2 font-mono text-xs">{DEALS[i]?.expiry ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.inMargin.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.outMargin.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.vol}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Partner IOT volume — quarterly comparison (TB)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={IOT_PARTNERS.map(p => ({
                  partner: p.partner.split(' ')[0],
                  q1: Math.round(p.vol * 0.88),
                  q2: p.vol,
                }))}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" TB" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="q1" fill={SLATE} radius={[6, 6, 0, 0]} name={tt('Q3 2026')} />
                  <Bar dataKey="q2" fill={BLUE}  radius={[6, 6, 0, 0]} name={tt('Q4 2026')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & settlement')}</Link>
              <Link to="/portal/company-360"      className="text-vfes-dark font-semibold hover:underline">{tt('→ Company 360')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Partner deal timeline — expiry watch')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2">{tt('Deal type')}</th>
                    <th className="px-3 py-2">{tt('Expiry')}</th>
                    <th className="px-3 py-2 text-right">{tt('Value BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume TB')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEALS.map((d, i) => (
                    <tr key={d.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{d.partner}</td>
                      <td className="px-3 py-2 text-xs">{tt(d.type)}</td>
                      <td className={`px-3 py-2 font-mono text-xs ${d.expiry === 'expired' ? 'text-red-600 font-bold' : ''}`}>{d.expiry}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {d.valueM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">{IOT_PARTNERS[i]?.vol ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(d.status)}`}>{tt(d.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('2 deals expiring in 2026 H2 — Rival ISP A FR (Q3) and Deutsche Tel (Q4). Initiate renegotiation now.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  INBOUND  ═══════════════════════════════ */}
      {tab === 'inbound' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Inbound revenue YTD')}  value={`BSD ${totalIn.toFixed(1)}M`} delta={tt('+14% YoY')}   trend="up" icon={Globe2}      accent />
            <KpiCard label={tt('Inbound visitors')}     value="1.24M"                      delta={tt('unique devices')} trend="up" icon={Users} />
            <KpiCard label={tt('Avg inbound ARPU')}     value="BSD 29.1"                      delta={tt('per visitor')} trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Top source country')}   value="France"                     delta={tt('BSD 8.4M YTD')}  trend="up" icon={Plane} />
          </div>

          <Panel title={tt('Inbound revenue — monthly trend (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={INBOUND_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, tt('Inbound revenue')]} />
                  <Line type="monotone" dataKey="total" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Inbound revenue by source — bar chart (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={INBOUND_SOURCES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="country" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, tt('Inbound revenue')]} />
                  <Bar dataKey="inboundM" fill={BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('US, Canada and UK are the top 3 inbound sources — correlate with US outbound steering share.')}
            </div>
            <div className="mt-2 text-xs text-vfes-dark/40">
              {tt('Inbound revenue recognised on an accruals basis against IOT inbound tariff cards per partner agreement.')}
            </div>
          </Panel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('US inbound visitors')} value="1.16M"  delta={tt('93% of total')}      trend="up"   icon={Globe2} />
            <KpiCard label={tt('RoW inbound visitors')} value="82K"   delta={tt('USA dominant')}      trend="up"   icon={Plane} />
            <KpiCard label={tt('Highest ARPU source')} value="USA BSD 44" delta={tt('premium tariff')}  trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Inbound growth YoY')}  value="+14%"   delta={tt('all sources')}       trend="up"   icon={Activity} />
          </div>

          <Panel title={tt('Top inbound source countries — detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Country')}</th>
                    <th className="px-3 py-2 text-right">{tt('Revenue BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Visitors')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARPU BSD ')}</th>
                    <th className="px-3 py-2 text-right">{tt('Rev share %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {INBOUND_SOURCES.map(s => (
                    <tr key={s.country} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{s.country}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {s.inboundM.toFixed(1)}M</td>
                      <td className="px-3 py-2 text-right font-mono">{s.visitors.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {s.arpu.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">{((s.inboundM / totalIn) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/customer-360" className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
              <Link to="/portal/digital-app"  className="text-vfes-dark font-semibold hover:underline">{tt('→ Digital app')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  SETTLEMENT  ════════════════════════════ */}
      {tab === 'settlement' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Net Q2 settlement')}    value={`${totalSettlement >= 0 ? 'BSD ' : '–BSD '}${Math.abs(totalSettlement).toFixed(1)}M`} delta={totalSettlement >= 0 ? tt('net receivable') : tt('net payable')} trend={totalSettlement >= 0 ? 'up' : 'down'} icon={DollarSign} accent />
            <KpiCard label={tt('Settled on time')}      value="3/5"     delta={tt('2 outstanding')}    trend="flat" icon={CheckCircle} />
            <KpiCard label={tt('Disputed amount')}      value="BSD 0.4M"   delta={tt('Britcom UK')}       trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Q2 cycle close')}       value="Jul 15"  delta={tt('target date')}      trend="flat" icon={Clock} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Largest inflow')}       value="BSD 4.1M"   delta={tt('from Rival ISP A FR')}   trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Largest outflow')}      value="BSD 3.8M"   delta={tt('to Rival ISP A FR')}     trend="flat" icon={DollarSign} />
            <KpiCard label={tt('Pending reconciliation')} value="1"     delta={tt('AT&T US')}           trend="flat" icon={Clock} />
            <KpiCard label={tt('YTD net position')}     value="BSD 0.8M"   delta={tt('net receivable')}   trend="up"   icon={CheckCircle} />
          </div>

          <Panel title={tt('Q4 2026 wholesale settlement by partner')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Outbound payable BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Inbound receivable BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Net BSD M')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SETTLEMENT_Q2.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.outPayM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.inRecM.toFixed(1)}</td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${p.netM >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {p.netM >= 0 ? '+' : ''}BSD {p.netM.toFixed(1)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${settlColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Net settlement per partner — Q4 2026 (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SETTLEMENT_Q2}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={10} tickFormatter={v => v.split(' ')[0]} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`BSD ${v}M`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="outPayM" fill={AMBER} radius={[6, 6, 0, 0]} name={tt('Outbound payable')} />
                  <Bar dataKey="inRecM"  fill={GREEN} radius={[6, 6, 0, 0]} name={tt('Inbound receivable')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & charging')}</Link>
              <Link to="/portal/finance"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance P&L')}</Link>
            </div>
          </Panel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('On-time settlement rate')} value="60%"   delta={tt('3 of 5 partners')}    trend="flat" icon={CheckCircle} />
            <KpiCard label={tt('Dispute resolution ETA')} value="Aug 1"  delta={tt('Britcom UK')}         trend="flat" icon={Clock} />
            <KpiCard label={tt('Settlement accuracy')}    value="99.4%"  delta={tt('vs invoice')}         trend="up"   icon={BarChart2} />
            <KpiCard label={tt('Next cycle opens')}       value="Oct 1"  delta={tt('Q1 2027')}            trend="flat" icon={FileText} />
          </div>

          <Panel title={tt('Settlement history — net position per quarter (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { q: 'Q1 26', net: 0.6 }, { q: 'Q2 26', net: 0.4 },
                  { q: 'Q3 26', net: 0.3 }, { q: 'Q4 26', net: totalSettlement },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${Number(v).toFixed(1)}M`, tt('Net position')]} />
                  <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                    {[0.6, 0.4, 0.3, totalSettlement].map((v, i) => <Cell key={i} fill={v >= 0 ? GREEN : '#EF4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Net receivable position maintained across recent quarters — Britcom UK dispute is an anomaly.')}
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  FORECAST  ══════════════════════════════ */}
      {tab === 'forecast' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('H1 2027 forecast total')} value={`BSD ${forecastTotal.toFixed(1)}M`} delta={tt('+8% vs H1 2026')} trend="up"   icon={TrendingUp}  accent />
            <KpiCard label={tt('Q1 2027 forecast')}        value="BSD 52.8M"  delta={tt('peak summer')}    trend="up"   icon={Plane} />
            <KpiCard label={tt('Q2 2027 forecast')}        value="BSD 44.1M"  delta={tt('off-season')}     trend="flat" icon={TrendingUp} />
            <KpiCard label={tt('Forecast confidence')}     value="94%"     delta={tt('model accuracy')} trend="up"   icon={BarChart2} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('IOT rate upside')}         value="+BSD 1.8M"  delta={tt('if renegotiated early')} trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('bundled cut downside')}       value="–BSD 2.4M"  delta={tt('if rates drop 10%')}    trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Summer disruption risk')}  value="–BSD 4.1M"  delta={tt('travel delay scenario')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('YoY growth assumption')}   value="+8%"     delta={tt('base scenario')}        trend="up"   icon={Activity} />
          </div>

          <Panel title={tt('Quarterly roaming revenue — actual vs forecast (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={FORECAST}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [v != null ? `BSD ${v}M` : tt('n/a'), tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual"   fill={NAVY}  radius={[6, 6, 0, 0]} name={tt('Actual')} />
                  <Bar dataKey="forecast" fill={LIGHT} radius={[6, 6, 0, 0]} name={tt('Forecast')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Seasonal forecaster trained on 4 years of CDR data — Q3 summer peak expected at BSD 52.8M.')} <ChevronRight className="w-3 h-3" />
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">
              {tt('Model inputs: historical CDR seasonality, flight booking indices, consumer confidence data, IOT rate card assumptions.')}
            </div>
          </Panel>

          <Panel title={tt('Forecast assumptions & scenario levers')}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-vfes-dark/70 mb-2 text-xs uppercase tracking-widest">{tt('Base scenario')}</div>
                <ul className="space-y-1 text-xs text-vfes-dark/60">
                  <li>• {tt('Summer travel +8% vs 2025')}</li>
                  <li>• {tt('IOT rate renegotiation +BSD 0.8M')}</li>
                  <li>• {tt('Steering re-optimisation +BSD 0.6M')}</li>
                  <li>• {tt('RoW premium pricing maintained')}</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-vfes-dark/70 mb-2 text-xs uppercase tracking-widest">{tt('Risk scenarios')}</div>
                <ul className="space-y-1 text-xs text-vfes-dark/60">
                  <li>• {tt('US/Canada bundle cut: –BSD 2.4M if rates drop 10%')}</li>
                  <li>• {tt('Summer disruption: –BSD 4.1M (travel delay)')}</li>
                  <li>• {tt('Partner exit: –BSD 2.1M Britcom UK')}</li>
                  <li>• {tt('Upside: +BSD 1.8M if IOT renegotiated early')}</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('→ Pricing simulator')}</Link>
              <Link to="/portal/marketing"         className="text-vfes-dark font-semibold hover:underline">{tt('→ Travel marketing')}</Link>
              <Link to="/portal/ai-insights"       className="text-vfes-dark font-semibold hover:underline">{tt('→ AI forecast model')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Scenario comparison — H1 2027 revenue (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { scenario: tt('Bear case'),   rev: 79.2 },
                  { scenario: tt('Base case'),   rev: 96.9 },
                  { scenario: tt('Bull case'),   rev: 110.4 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, tt('H2 forecast')]} />
                  <Bar dataKey="rev" radius={[6, 6, 0, 0]}>
                    <Cell fill={AMBER} />
                    <Cell fill={BLUE} />
                    <Cell fill={GREEN} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Base case: IOT renegotiation lands in Q3. Bull case adds early renegotiation uplift + steering gains.')}
            </div>
          </Panel>

          <Panel title={tt('Scenario driver table')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Driver')}</th>
                    <th className="px-3 py-2 text-right">{tt('Bear BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Base BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Bull BSD M')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { driver: tt('Outbound summer travel'),  bear: 44.1, base: 52.8, bull: 58.2 },
                    { driver: tt('IOT rate optimisation'),   bear:  0.0, base:  0.8, bull:  1.8 },
                    { driver: tt('Steering gains'),          bear:  0.0, base:  0.6, bull:  1.0 },
                    { driver: tt('Inbound visitors'),        bear: 12.4, base: 15.6, bull: 17.8 },
                    { driver: tt('Off-season Q4'),           bear: 22.7, base: 27.1, bull: 31.6 },
                  ].map(row => (
                    <tr key={row.driver} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{row.driver}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">BSD {row.bear.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {row.base.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">BSD {row.bull.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ── cross-portfolio navigation ── */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-black/5 shadow-sm">
        <div className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest mb-3">{tt('Related modules')}</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/portal/mvno-wholesale" className="text-vfes-dark font-semibold hover:underline">{tt('→ MVNO & Wholesale')}</Link>
          <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & charging')}</Link>
          <Link to="/portal/finance"         className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance & P&L')}</Link>
          <Link to="/portal/network"         className="text-vfes-dark font-semibold hover:underline">{tt('→ Network')}</Link>
          <Link to="/portal/product"         className="text-vfes-dark font-semibold hover:underline">{tt('→ Product catalogue')}</Link>
          <Link to="/portal/customer-360"    className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
          <Link to="/portal/company-360"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Company 360')}</Link>
        </div>
      </div>
    </div>
  )
}
