// ── B2bAppPage.tsx
// B2B self-serve portal: adoption, feature usage, orders, tickets, NPS, SSO/API
import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Boxes, Globe2, TrendingUp, Brain, ChevronRight, Download,
  ShoppingCart, Ticket, Star, Key, Activity, BarChart2,
  Users, DollarSign, AlertTriangle, CheckCircle, Clock, Zap,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, Area, AreaChart, Pie, PieChart,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'

// ── data ──────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { product: 'Footprint & Coverage Segments', consumers: 18, revM: 2.4, status: 'live',  category: 'network' },
  { product: 'Mobility & Presence Insights',  consumers: 12, revM: 3.1, status: 'live',  category: 'mobility' },
  { product: 'B2B Network SLA Feed',          consumers:  9, revM: 1.2, status: 'live',  category: 'network' },
  { product: 'IoT Asset Telemetry',           consumers:  6, revM: 0.9, status: 'beta',  category: 'iot' },
  { product: 'Audience Propensity App',       consumers:  4, revM: 0.6, status: 'beta',  category: 'audience' },
]

const ADOPTION = [
  { m: 'Jan', installs: 24, revM: 4.2, dau: 180 }, { m: 'Feb', installs: 28, revM: 4.8, dau: 212 },
  { m: 'Mar', installs: 33, revM: 5.4, dau: 248 }, { m: 'Apr', installs: 39, revM: 6.1, dau: 294 },
  { m: 'May', installs: 44, revM: 7.0, dau: 332 }, { m: 'Jun', installs: 49, revM: 8.2, dau: 372 },
]

const VERSIONS = [
  { ver: 'v3.2.0', date: '2026-06-01', note: 'Added presence insights · row-access policies',    consumers: 49 },
  { ver: 'v3.1.0', date: '2026-04-12', note: 'SLA feed GA · usage-based metering',                consumers: 41 },
  { ver: 'v3.0.0', date: '2026-02-20', note: 'Native App repackage · auto-fulfilment',            consumers: 33 },
  { ver: 'v2.8.0', date: '2025-12-01', note: 'Multi-region support · SAML SSO',                  consumers: 24 },
  { ver: 'v2.6.0', date: '2025-09-14', note: 'First public release · coverage data only',         consumers: 14 },
]

const ORDERS = [
  { id: 'ORD-4421', company: 'Colruyt Group',       product: 'Footprint & Coverage', value: 84000, status: 'live',    via: 'self-serve' },
  { id: 'ORD-4398', company: 'Island Manufacturing (demo)',           product: 'Mobility Insights',    value: 96000, status: 'live',    via: 'self-serve' },
  { id: 'ORD-4376', company: 'Family Islands Logistics',   product: 'IoT Asset Telemetry',  value: 42000, status: 'provisioning', via: 'self-serve' },
  { id: 'ORD-4351', company: 'Rolle Construction (demo)', product: 'SLA Feed',          value: 48000, status: 'live',    via: 'assisted' },
  { id: 'ORD-4340', company: 'Freeport Coffee Roasters', product: 'Audience Propensity', value: 36000, status: 'trial',   via: 'self-serve' },
  { id: 'ORD-4318', company: 'Nassau Tech Hub',      product: 'Footprint & Coverage', value: 72000, status: 'live',    via: 'api' },
]

const TICKETS = [
  { m: 'Jan', opened: 42, deflected: 28, resolved: 38, sla: 94 },
  { m: 'Feb', opened: 38, deflected: 30, resolved: 35, sla: 95 },
  { m: 'Mar', opened: 44, deflected: 34, resolved: 40, sla: 93 },
  { m: 'Apr', opened: 31, deflected: 26, resolved: 29, sla: 97 },
  { m: 'May', opened: 27, deflected: 22, resolved: 25, sla: 98 },
  { m: 'Jun', opened: 22, deflected: 19, resolved: 21, sla: 99 },
]

const NPS_BY_FEATURE = [
  { feature: 'Coverage data',     nps: 62, responses: 184 },
  { feature: 'Mobility insights', nps: 71, responses: 142 },
  { feature: 'SLA feed',          nps: 58, responses:  94 },
  { feature: 'IoT telemetry',     nps: 68, responses:  62 },
  { feature: 'Self-serve portal', nps: 74, responses: 298 },
  { feature: 'API experience',    nps: 66, responses: 186 },
]

const NPS_TREND = [
  { m: 'Jan', nps: 58 }, { m: 'Feb', nps: 60 }, { m: 'Mar', nps: 62 },
  { m: 'Apr', nps: 65 }, { m: 'May', nps: 68 }, { m: 'Jun', nps: 71 },
]

const API_USAGE = [
  { endpoint: '/coverage',    calls: 842000, p99ms: 124, errors: 0.12 },
  { endpoint: '/mobility',    calls: 614000, p99ms: 186, errors: 0.18 },
  { endpoint: '/sla-feed',    calls: 284000, p99ms:  98, errors: 0.08 },
  { endpoint: '/iot',         calls: 142000, p99ms: 212, errors: 0.22 },
  { endpoint: '/audience',    calls:  86000, p99ms: 164, errors: 0.15 },
]

const SSO_ADOPTION = [
  { type: 'SAML SSO',        value: 62 },
  { type: 'OAuth2 / API key', value: 28 },
  { type: 'Username/password', value: 10 },
]

const FEATURE_USAGE = [
  { m: 'Jan', coverage: 420, mobility: 280, sla: 96, iot: 42 },
  { m: 'Feb', coverage: 480, mobility: 312, sla: 108, iot: 48 },
  { m: 'Mar', coverage: 544, mobility: 360, sla: 124, iot: 58 },
  { m: 'Apr', coverage: 612, mobility: 412, sla: 138, iot: 68 },
  { m: 'May', coverage: 684, mobility: 468, sla: 152, iot: 82 },
  { m: 'Jun', coverage: 762, mobility: 524, sla: 168, iot: 96 },
]

const TICKET_TYPES = [
  { type: 'Access/permissions', pct: 34 },
  { type: 'Data quality query',  pct: 28 },
  { type: 'API error',           pct: 22 },
  { type: 'Billing/invoicing',   pct: 16 },
]

const ML_CHURN_RISK = [
  { company: 'Family Islands Logistics',   risk: 0.68, feature: tt('IoT Telemetry'), action: 'QBR' },
  { company: 'Freeport Coffee Roasters', risk: 0.52, feature: tt('Audience Propensity'), action: 'Success call' },
  { company: 'Rolle Construction (demo)', risk: 0.31, feature: tt('SLA Feed'), action: 'Watch' },
]

const ML_UPSELL = [
  { product: 'IoT Asset Telemetry',    current: 6,  predicted: 9 },
  { product: 'Audience Propensity',    current: 4,  predicted: 8 },
  { product: 'Mobility Insights',      current: 12, predicted: 16 },
  { product: 'Footprint & Coverage',   current: 18, predicted: 20 },
  { product: 'B2B Network SLA Feed',   current: 9,  predicted: 12 },
]

// ── tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'products' | 'adoption' | 'orders' | 'tickets' | 'nps' | 'sso-api' | 'feature-usage' | 'versions'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'products',      label: 'Data Products',   icon: Boxes },
  { id: 'adoption',      label: 'Adoption',         icon: TrendingUp },
  { id: 'orders',        label: 'Orders',           icon: ShoppingCart },
  { id: 'tickets',       label: 'Tickets',          icon: Ticket },
  { id: 'nps',           label: 'NPS',              icon: Star },
  { id: 'sso-api',       label: 'SSO & API',        icon: Key },
  { id: 'feature-usage', label: 'Feature Usage',    icon: Activity },
  { id: 'versions',      label: 'Versions',         icon: Download },
]

export default function B2bAppPage() {
  const { i18n } = useTranslation()

  // ── hooks (≥10) ────────────────────────────────────────────────────────────
  const [tab, setTab]                         = useState<TabId>('products')
  const [categoryFilter, setCategoryFilter]   = useState<string>('all')
  const [npsThreshold, setNpsThreshold]       = useState<number>(60)
  const [productSort, setProductSort]         = useState<'revenue' | 'consumers'>('revenue')
  const [orderFilter, setOrderFilter]         = useState<string>('all')
  const [showSso, setShowSso]                 = useState<boolean>(true)
  const chartRef = useRef<HTMLDivElement>(null)

  const totalRev        = PRODUCTS.reduce((s, p) => s + p.revM, 0)
  const totalConsumers  = PRODUCTS.reduce((s, p) => s + p.consumers, 0)

  // interactive useMemo — recalculates when user changes filter/sort
  const sortedProducts = useMemo(
    () => [...PRODUCTS]
      .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
      .sort((a, b) => productSort === 'revenue' ? b.revM - a.revM : b.consumers - a.consumers),
    [categoryFilter, productSort],
  )

  const filteredOrders = useMemo(
    () => orderFilter === 'all' ? ORDERS : ORDERS.filter(o => o.via === orderFilter),
    [orderFilter],
  )

  const belowNps = useMemo(
    () => NPS_BY_FEATURE.filter(f => f.nps < npsThreshold),
    [npsThreshold],
  )

  const avgNps = useMemo(
    () => Math.round(NPS_BY_FEATURE.reduce((s, f) => s + f.nps * f.responses, 0) /
      NPS_BY_FEATURE.reduce((s, f) => s + f.responses, 0)), [],
  )

  const totalApiCalls = useMemo(
    () => API_USAGE.reduce((s, e) => s + e.calls, 0), [],
  )

  const totalTicketDeflected = useMemo(
    () => TICKETS.reduce((s, m) => s + m.deflected, 0), [],
  )

  const statusColor = useCallback((s: string) =>
    s === 'live' ? 'bg-emerald-50 text-emerald-700'
      : s === 'beta' ? 'bg-amber-50 text-amber-700'
      : s === 'trial' ? 'bg-blue-50 text-blue-700'
      : s === 'provisioning' ? 'bg-purple-50 text-purple-700'
      : 'bg-slate-100 text-slate-600', [])

  const viaColor = (v: string) =>
    v === 'self-serve' ? 'bg-emerald-50 text-emerald-700' : v === 'api' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('B2B Self-Serve Portal')}
        subtitle={tt('Portal adoption · data products · orders via app · tickets deflected · NPS · SSO & API usage')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">BSD {totalRev.toFixed(1)}M {tt('ARR')}</span>}
      />

      {/* ── ML Insight ── */}
      <MlInsightSection
        heading={tt('B2B portal intelligence')}
        models={[
          { name: tt('Consumer churn predictor'), metric: '88%',    sub: tt('AUC · 60-day horizon') },
          { name: tt('Upsell propensity model'),   metric: '+4.2',  sub: tt('avg predicted new consumers') },
          { name: tt('Auto-ticket classifier'),    metric: '94%',   sub: tt('deflection accuracy') },
        ]}
        agentLabel={tt('Run B2B Intelligence Agent')}
        agentRunningLabel={tt('Scoring consumers…')}
        agentSteps={[
          tt('Scored all consumers on churn risk, engagement and usage depth'),
          tt('Identified upsell opportunities per data product'),
          tt('Classified open tickets for auto-deflection candidates'),
          tt('Drafted account-specific success playbooks'),
        ]}
        agentBlurb={tt('ML models trained on anonymised portal event logs. Churn model features: DAU trend, ticket volume, feature breadth, billing timeliness.')}
        decision={{
          title:    tt('Initiate success calls for Family Islands Logistics & Freeport Coffee Roasters; push IoT GA'),
          detail:   tt('Family Islands Logistics (IoT telemetry, 68% churn risk) and Freeport Coffee Roasters (audience propensity, 52%) need proactive engagement. IoT going GA would accelerate Family Islands renewal.'),
          impact:   tt('+BSD 0.5M ARR if two at-risk accounts renew and upgrade'),
          risk:     tt('early IoT GA may surface data quality issues — ensure QA'),
          linkTo:   '/portal/sales',
          linkLabel: tt('Open Sales pipeline'),
        }}
        chart={{
          kind:  'bar',
          title: tt('ML-predicted consumer count by product (current vs forecast)'),
          data:  ML_UPSELL,
          xKey:  'product',
          series: [
            { key: 'current',   name: tt('Current consumers'),   color: BLUE },
            { key: 'predicted', name: tt('Predicted consumers'), color: GREEN },
          ],
          note: tt('IoT and Audience Propensity show largest upside — prioritise for GTM push.'),
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

      {/* ═══════════════════════════  PRODUCTS  ══════════════════════════════ */}
      {tab === 'products' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Data products')}          value="5"                              delta={tt('3 live · 2 beta')} trend="up"   icon={Boxes}      accent />
            <KpiCard label={tt('Enterprise consumers')}   value={totalConsumers}                  delta={tt('+8 this quarter')} trend="up"   icon={Globe2} />
            <KpiCard label={tt('Data-product ARR')}       value={`BSD ${totalRev.toFixed(1)}M`}     delta={tt('+62% YoY')}       trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Avg revenue / consumer')} value={`BSD ${(totalRev * 1000 / totalConsumers).toFixed(0)}K`} delta={tt('expanding')} trend="up" icon={DollarSign} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Products in GA')}          value="3"      delta={tt('2 beta → GA pipeline')}    trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Beta products')}           value="2"      delta={tt('IoT & Audience')}          trend="flat" icon={Clock} />
            <KpiCard label={tt('Highest ARPU product')}    value="BSD 258K"  delta={tt('Mobility Insights')}       trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('New consumers this Q')}    value="8"      delta={tt('+6 self-serve')}           trend="up"   icon={Users} />
          </div>

          {/* interactive product filter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Category:')}</span>
            {['all', 'network', 'mobility', 'iot', 'audience'].map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${categoryFilter === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(c)}
              </button>
            ))}
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest ml-4">{tt('Sort by:')}</span>
            {(['revenue', 'consumers'] as const).map(s => (
              <button key={s} onClick={() => setProductSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${productSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(s === 'revenue' ? 'Revenue' : 'Consumers')}
              </button>
            ))}
          </div>

          <Panel title={tt('Packaged data products')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Data product')}</th>
                    <th className="px-3 py-2">{tt('Category')}</th>
                    <th className="px-3 py-2 text-right">{tt('Consumers')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARR (BSD M)')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARPU BSD K')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map(p => (
                    <tr key={p.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(p.product)}</td>
                      <td className="px-3 py-2 text-xs capitalize">{tt(p.category)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.consumers}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.revM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {((p.revM * 1000) / p.consumers).toFixed(0)}K</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Mobility Insights is the ARR leader — package as a Native App with usage-based metering to scale.')} <ChevronRight className="w-3 h-3" />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/product"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Product catalogue')}</Link>
              <Link to="/portal/finance"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance P&L')}</Link>
              <Link to="/portal/sales"       className="text-vfes-dark font-semibold hover:underline">{tt('→ Sales pipeline')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Data product revenue — ARR by product (BSD M)')}>
            <div className="h-64" ref={chartRef}>
              <ResponsiveContainer>
                <BarChart data={sortedProducts}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="product" stroke="#999" fontSize={9} angle={-15} textAnchor="end" height={44} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`BSD ${v}M · ${p.payload.consumers} consumers`, tt('Product')]} />
                  <Bar dataKey="revM" radius={[6, 6, 0, 0]}>
                    {sortedProducts.map((p, i) => <Cell key={i} fill={p.status === 'live' ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <AgentDecision
            title={tt('B2B Product Expansion Advisor')}
            label={tt('Run Product Expansion Advisor')}
            runningLabel={tt('Scoring…')}
            steps={[
              tt('Scored all products on consumer growth, ARPU and market demand'),
              tt('Identified upsell opportunities per existing consumer'),
              tt('Drafted beta-to-GA roadmap for IoT and Audience Propensity'),
              tt('Modelled revenue uplift under various consumer growth scenarios'),
            ]}
            result={{
              headline: tt('Accelerate IoT GA; launch usage-based Mobility tier'),
              stats: [
                { label: tt('Current ARR'),         value: `BSD ${totalRev.toFixed(1)}M` },
                { label: tt('Enterprise consumers'), value: String(totalConsumers) },
                { label: tt('Products in beta'),     value: '2' },
                { label: tt('Forecasted ARR (12M)'), value: 'BSD 11.4M' },
              ],
              findings: [
                tt('IoT GA + expanded coverage would convert 3 prospects currently in trial.'),
                tt('Usage-based metering for Mobility could unlock 2 new Tier-1 enterprise deals.'),
              ],
              note: tt('+BSD 3.2M ARR if both beta products GA and usage model adopted'),
            }}
            impact={tt('+BSD 3.2M ARR if roadmap executed in H2 2026')}
            risk={tt('IoT early GA may surface data quality issues — ensure QA')}
            linkTo="/portal/pricing-simulator"
            linkLabel={tt('Open Pricing simulator')}
          />
        </>
      )}

      {/* ═══════════════════════════  ADOPTION  ══════════════════════════════ */}
      {tab === 'adoption' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Cumulative installs')}   value="49"     delta={tt('+8 this quarter')}  trend="up" icon={Download}    accent />
            <KpiCard label={tt('ARR (Jun 2026)')}        value="BSD 8.2M"  delta={tt('+96% YoY')}        trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Daily active users')}    value="372"    delta={tt('+40% QoQ')}         trend="up" icon={Users} />
            <KpiCard label={tt('Time-to-onboard')}       value="<15min" delta={tt('auto-fulfilment')}  trend="up" icon={Zap} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Monthly actives (MAU)')} value="2,840"  delta={tt('+18% QoQ')}         trend="up"   icon={Activity} />
            <KpiCard label={tt('Session duration')}      value="8.4min" delta={tt('+1.2min QoQ')}      trend="up"   icon={Clock} />
            <KpiCard label={tt('Feature adoption rate')} value="3.6"    delta={tt('avg features/user')} trend="up"   icon={Boxes} />
            <KpiCard label={tt('Churn rate')}            value="2.1%"   delta={tt('–0.4 pp QoQ')}      trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('Consumer installs & revenue ramp')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={ADOPTION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="installs" stroke={NAVY}  strokeWidth={2.5} name={tt('Cumulative installs')} />
                  <Line yAxisId="r" type="monotone" dataKey="revM"     stroke={GREEN} strokeWidth={2.5} name={tt('ARR (BSD M)')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Native App auto-fulfilment cut onboarding from weeks to minutes — installs up 2× since February.')}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/marketing" className="text-vfes-dark font-semibold hover:underline">{tt('→ Marketing campaigns')}</Link>
              <Link to="/portal/sales"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Sales pipeline')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Daily active users — adoption cohort')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={ADOPTION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [v, tt('DAU')]} />
                  <Area type="monotone" dataKey="dau" stroke={PURPLE} fill={PURPLE} fillOpacity={0.25} name={tt('Daily active users')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('DAU growing proportionally to installs — engagement is healthy at >7 sessions/user/month.')}
            </div>
          </Panel>

          <Panel title={tt('Adoption cohort comparison — installs × ARR')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ADOPTION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="installs" fill={BLUE}  radius={[6, 6, 0, 0]} name={tt('Cumulative installs')} />
                  <Line yAxisId="r" type="monotone" dataKey="revM" stroke={GREEN} strokeWidth={2.5} name={tt('ARR BSD M')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/sales"       className="text-vfes-dark font-semibold hover:underline">{tt('→ Sales pipeline')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark font-semibold hover:underline">{tt('→ AI adoption model')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  ORDERS  ════════════════════════════════ */}
      {tab === 'orders' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Orders via app (YTD)')} value="49"      delta={tt('of 49 consumers')}    trend="up"   icon={ShoppingCart} accent />
            <KpiCard label={tt('Self-serve orders')}    value="38"      delta={tt('78% of total')}       trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('API-initiated orders')} value="7"       delta={tt('14%')}               trend="up"   icon={Zap} />
            <KpiCard label={tt('Assisted orders')}      value="4"       delta={tt('8% — declining')}    trend="down" icon={Users} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Avg order value')}      value="BSD 63K"    delta={tt('ARR per order')}     trend="up"   icon={DollarSign} />
            <KpiCard label={tt('Largest order')}        value="BSD 96K"    delta={tt('Island Manufacturing (demo)')}     trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Provisioning time')}    value="<15min"  delta={tt('auto-fulfilment')}   trend="up"   icon={Clock} />
            <KpiCard label={tt('Order success rate')}   value="97.2%"   delta={tt('+1.4 pp QoQ')}      trend="up"   icon={CheckCircle} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Via:')}</span>
            {['all', 'self-serve', 'api', 'assisted'].map(f => (
              <button key={f} onClick={() => setOrderFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${orderFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>

          <Panel title={tt('Recent orders — B2B portal')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Order ID')}</th>
                    <th className="px-3 py-2">{tt('Company')}</th>
                    <th className="px-3 py-2">{tt('Product')}</th>
                    <th className="px-3 py-2 text-right">{tt('Value BSD ')}</th>
                    <th className="px-3 py-2">{tt('Via')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                      <td className="px-3 py-2 font-semibold">{o.company}</td>
                      <td className="px-3 py-2 text-xs">{tt(o.product)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {o.value.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${viaColor(o.via)}`}>{tt(o.via)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(o.status)}`}>{tt(o.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & invoicing')}</Link>
              <Link to="/portal/customer-360"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Orders by channel — quarterly (YTD)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { q: 'Q4 25', selfServe: 14, api: 2, assisted: 6 },
                  { q: 'Q1 26', selfServe: 21, api: 4, assisted: 5 },
                  { q: 'Q2 26', selfServe: 38, api: 7, assisted: 4 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="selfServe" stackId="a" fill={BLUE}   radius={[0, 0, 0, 0]} name={tt('Self-serve')} />
                  <Bar dataKey="api"       stackId="a" fill={PURPLE} radius={[0, 0, 0, 0]} name={tt('API')} />
                  <Bar dataKey="assisted"  stackId="a" fill={SLATE}  radius={[6, 6, 0, 0]} name={tt('Assisted')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Self-serve share growing from 61% to 78% — portal automation displacing manual order-taking.')}
            </div>
          </Panel>

          <Panel title={tt('ML at-risk accounts — churn watch')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Company')}</th>
                    <th className="px-3 py-2">{tt('Product')}</th>
                    <th className="px-3 py-2 text-right">{tt('Churn risk')}</th>
                    <th className="px-3 py-2">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ML_CHURN_RISK.map(r => (
                    <tr key={r.company} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.company}</td>
                      <td className="px-3 py-2 text-xs">{r.feature}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-mono font-bold text-xs ${r.risk > 0.6 ? 'text-red-600' : r.risk > 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {(r.risk * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{tt(r.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Family Islands Logistics at 68% churn risk — schedule QBR before contract renewal in Q3.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  TICKETS  ═══════════════════════════════ */}
      {tab === 'tickets' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Tickets deflected (YTD)')} value={String(totalTicketDeflected)} delta={tt('bot + knowledge base')} trend="up"   icon={Ticket}      accent />
            <KpiCard label={tt('Deflection rate (Jun)')}   value="86%"                           delta={tt('+12 pp YoY')}          trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('SLA compliance (Jun)')}    value="99%"                           delta={tt('target 98%')}          trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Avg resolution time')}     value="4.2h"                          delta={tt('–1.8h QoQ')}           trend="up"   icon={Clock} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Open tickets')} value="7"      delta={tt('all within SLA')}      trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('P1 tickets')}   value="0"      delta={tt('no critical issues')}   trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Auto-resolved')} value="51%"   delta={tt('ML classifier')}       trend="up"   icon={Zap} />
            <KpiCard label={tt('CSAT score')}   value="4.6/5"  delta={tt('+0.2 QoQ')}            trend="up"   icon={Star} />
          </div>

          <Panel title={tt('Ticket volume — opened vs deflected (monthly)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={TICKETS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="opened"    fill={AMBER} radius={[6, 6, 0, 0]} name={tt('Opened')} />
                  <Bar dataKey="deflected" fill={GREEN} radius={[6, 6, 0, 0]} name={tt('Deflected')} />
                  <Bar dataKey="resolved"  fill={BLUE}  radius={[6, 6, 0, 0]} name={tt('Resolved')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Ticket volume trending down as portal self-service improves — target zero-touch resolution for 90%+ by Q4 2026.')}
            </div>
          </Panel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('Median resolution time')} value="3.8h"   delta={tt('within SLA')}         trend="up"   icon={Clock} />
            <KpiCard label={tt('First-contact resolution')} value="72%"  delta={tt('+8 pp YoY')}          trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Tickets via chat bot')}    value="51%"   delta={tt('auto-classified')}     trend="up"   icon={Zap} />
            <KpiCard label={tt('Ticket cost per unit')}    value="BSD 38"   delta={tt('–BSD 12 vs manual')}      trend="up"   icon={DollarSign} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Ticket category breakdown (YTD)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={TICKET_TYPES} cx="50%" cy="50%" outerRadius={85} dataKey="pct" nameKey="type"
                      label={({ type, pct }: any) => `${type} ${pct}%`}>
                      {TICKET_TYPES.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, AMBER, PURPLE][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Share')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('SLA compliance — monthly (%)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={TICKETS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[90, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('SLA compliance')]} />
                    <Line type="monotone" dataKey="sla" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <Link to="/portal/ai-insights"  className="text-vfes-dark font-semibold hover:underline">{tt('→ AI ticket classifier')}</Link>
                <Link to="/portal/network"      className="text-vfes-dark font-semibold hover:underline">{tt('→ Network status')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ═══════════════════════════  NPS  ═══════════════════════════════════ */}
      {tab === 'nps' && (
        <>
          <div className="flex items-center gap-4 mb-4 bg-white rounded-xl border border-black/5 p-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('NPS alert threshold:')}</span>
            <input type="range" min={40} max={80} value={npsThreshold}
              onChange={e => setNpsThreshold(+e.target.value)} className="w-40 accent-vfes-red" />
            <span className="font-bold text-vfes-dark text-sm">{npsThreshold}</span>
            <span className="text-xs text-vfes-dark/55">{belowNps.length} {tt('features below threshold')}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Overall NPS')}          value={String(avgNps)} delta={tt('+13 YoY')}          trend="up"   icon={Star}       accent />
            <KpiCard label={tt('Promoters')}             value="58%"            delta={tt('NPS ≥ 9')}          trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Detractors')}            value="12%"            delta={tt('NPS ≤ 6')}          trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Survey responses (YTD)')} value="966"           delta={tt('all features')}     trend="up"   icon={Users} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Top feature NPS')}      value="74"  delta={tt('self-serve portal')}   trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Lowest feature NPS')}   value="58"  delta={tt('SLA feed')}            trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('Below threshold')}      value={String(belowNps.length)} delta={`NPS < ${npsThreshold}`} trend="flat" icon={BarChart2} />
            <KpiCard label={tt('NPS trend (6M)')}       value="+13" delta={tt('vs 6M ago')}           trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('NPS by feature — score & survey volume')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={NPS_BY_FEATURE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="feature" stroke="#999" fontSize={10} angle={-15} textAnchor="end" height={44} />
                  <YAxis stroke="#999" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} NPS · ${p.payload.responses} responses`, tt('Feature')]} />
                  <Bar dataKey="nps" radius={[6, 6, 0, 0]}>
                    {NPS_BY_FEATURE.map((f, i) => <Cell key={i} fill={f.nps >= npsThreshold ? GREEN : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('NPS overall trend — monthly')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={NPS_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[50, 80]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [v, tt('NPS score')]} />
                  <Line type="monotone" dataKey="nps" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/customer-360" className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
              <Link to="/portal/marketing"    className="text-vfes-dark font-semibold hover:underline">{tt('→ CX marketing')}</Link>
            </div>
          </Panel>

          <Panel title={tt('NPS detailed breakdown by feature')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Feature')}</th>
                    <th className="px-3 py-2 text-right">{tt('NPS score')}</th>
                    <th className="px-3 py-2 text-right">{tt('Responses')}</th>
                    <th className="px-3 py-2">{tt('Alert')}</th>
                  </tr>
                </thead>
                <tbody>
                  {NPS_BY_FEATURE.map(f => (
                    <tr key={f.feature} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(f.feature)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold"
                        style={{ color: f.nps >= npsThreshold ? GREEN : AMBER }}>{f.nps}</td>
                      <td className="px-3 py-2 text-right font-mono">{f.responses}</td>
                      <td className="px-3 py-2">
                        {f.nps < npsThreshold && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">{tt('below threshold')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  SSO & API  ═════════════════════════════ */}
      {tab === 'sso-api' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('API calls (Jun 2026)')} value={`${(totalApiCalls / 1e6).toFixed(1)}M`} delta={tt('+28% MoM')} trend="up"   icon={Key}        accent />
            <KpiCard label={tt('SAML SSO adoption')}   value="62%"                                     delta={tt('of consumers')} trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('API p99 latency')}     value="186ms"                                   delta={tt('mobility endpoint')} trend="flat" icon={Zap} />
            <KpiCard label={tt('API error rate')}      value="0.15%"                                   delta={tt('avg all endpoints')} trend="up" icon={Activity} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active API keys')}     value="142"   delta={tt('across 49 consumers')} trend="up"   icon={Key} />
            <KpiCard label={tt('OAuth2 consumers')}    value="14"    delta={tt('29% of total')}         trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Password-only users')} value="5"     delta={tt('migration in progress')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('API SLA uptime')}      value="99.97%" delta={tt('Jun 2026')}           trend="up"   icon={TrendingUp} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Show:')}</span>
            <button onClick={() => setShowSso(true)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${showSso ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
              {tt('SSO methods')}
            </button>
            <button onClick={() => setShowSso(false)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${!showSso ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
              {tt('API endpoints')}
            </button>
          </div>

          {showSso ? (
            <Panel title={tt('SSO authentication method mix')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={SSO_ADOPTION} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="type"
                      label={({ type, percent }: any) => `${type} ${(percent * 100).toFixed(0)}%`}>
                      {SSO_ADOPTION.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, SLATE][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Share')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('SAML SSO is the dominant auth method — target 80% by end of 2026 with assisted migration for password-only users.')}
              </div>
            </Panel>
          ) : (
            <Panel title={tt('API usage by endpoint — monthly calls')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={API_USAGE} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={v => `${(v / 1e3).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="endpoint" stroke="#999" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ fontSize: 12 }}
                      formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} calls · p99 ${p.payload.p99ms}ms`, tt('Endpoint')]} />
                    <Bar dataKey="calls" radius={[0, 6, 6, 0]} fill={BLUE} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          <Panel title={tt('API endpoint detail — performance & errors')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Endpoint')}</th>
                    <th className="px-3 py-2 text-right">{tt('Monthly calls')}</th>
                    <th className="px-3 py-2 text-right">{tt('p99 latency')}</th>
                    <th className="px-3 py-2 text-right">{tt('Error rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {API_USAGE.map(e => (
                    <tr key={e.endpoint} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono font-semibold">{e.endpoint}</td>
                      <td className="px-3 py-2 text-right font-mono">{e.calls.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{e.p99ms}ms</td>
                      <td className={`px-3 py-2 text-right font-mono ${e.errors > 0.2 ? 'text-amber-600 font-bold' : ''}`}>{e.errors.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/network"    className="text-vfes-dark font-semibold hover:underline">{tt('→ Network & API infrastructure')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark font-semibold hover:underline">{tt('→ AI anomaly detection')}</Link>
            </div>
          </Panel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('Webhooks configured')}    value="28"    delta={tt('event-driven')}        trend="up"   icon={Zap} />
            <KpiCard label={tt('SDK languages')}          value="4"     delta={tt('Python, JS, Java, Go')} trend="flat" icon={Key} />
            <KpiCard label={tt('API version')}            value="v2.4"  delta={tt('stable')}              trend="flat" icon={Download} />
            <KpiCard label={tt('API key rotation cycle')} value="90d"   delta={tt('policy enforced')}     trend="flat" icon={Clock} />
          </div>

          <Panel title={tt('API call volume trend — monthly (K calls)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={[
                  { m: 'Jan', calls: 1240 }, { m: 'Feb', calls: 1480 }, { m: 'Mar', calls: 1820 },
                  { m: 'Apr', calls: 2140 }, { m: 'May', calls: 2480 }, { m: 'Jun', calls: (totalApiCalls / 1000).toFixed(0) as any },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="K" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}K calls`, tt('API volume')]} />
                  <Line type="monotone" dataKey="calls" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('API traffic growing 28% MoM as enterprise consumers embed data products into their own applications and workflows.')}
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  FEATURE USAGE  ═════════════════════════ */}
      {tab === 'feature-usage' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Top feature (Jun)')}    value="Coverage"   delta={tt('762 MAU sessions')} trend="up"   icon={Activity}   accent />
            <KpiCard label={tt('Fastest-growing')}      value="IoT"        delta={tt('+29% MoM')}        trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Avg features/user')}    value="3.6"        delta={tt('+0.4 QoQ')}        trend="up"   icon={Boxes} />
            <KpiCard label={tt('Feature drop-off rate')} value="8.4%"      delta={tt('–2.1 pp QoQ')}     trend="up"   icon={CheckCircle} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Coverage sessions')}    value="762"  delta={tt('Jun 2026')}           trend="up"   icon={Boxes} />
            <KpiCard label={tt('Mobility sessions')}    value="524"  delta={tt('Jun 2026')}           trend="up"   icon={Activity} />
            <KpiCard label={tt('SLA feed sessions')}    value="168"  delta={tt('Jun 2026')}           trend="up"   icon={BarChart2} />
            <KpiCard label={tt('IoT sessions')}         value="96"   delta={tt('+24% QoQ')}           trend="up"   icon={Zap} />
          </div>

          <Panel title={tt('Monthly feature usage — sessions by product')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={FEATURE_USAGE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="coverage" stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.7} name={tt('Coverage')} />
                  <Area type="monotone" dataKey="mobility" stackId="1" stroke={NAVY}   fill={NAVY}   fillOpacity={0.7} name={tt('Mobility')} />
                  <Area type="monotone" dataKey="sla"      stackId="1" stroke={GREEN}  fill={GREEN}  fillOpacity={0.7} name={tt('SLA feed')} />
                  <Area type="monotone" dataKey="iot"      stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.7} name={tt('IoT')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('All features growing in usage. IoT shows strongest growth rate (+29% MoM) ahead of GA launch.')}
            </div>
          </Panel>

          <Panel title={tt('Feature adoption & engagement detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Feature')}</th>
                    <th className="px-3 py-2 text-right">{tt('Jun sessions')}</th>
                    <th className="px-3 py-2 text-right">{tt('MoM growth')}</th>
                    <th className="px-3 py-2 text-right">{tt('Adoption %')}</th>
                    <th className="px-3 py-2 text-right">{tt('NPS')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: tt('Footprint & Coverage'), sessions: 762, mom: '+11.4%', adoption: 88, nps: 62 },
                    { feature: tt('Mobility & Presence'),  sessions: 524, mom: '+11.5%', adoption: 76, nps: 71 },
                    { feature: tt('B2B SLA Feed'),         sessions: 168, mom: '+10.5%', adoption: 68, nps: 58 },
                    { feature: tt('IoT Asset Telemetry'),  sessions:  96, mom: '+17.1%', adoption: 42, nps: 68 },
                  ].map(r => (
                    <tr key={r.feature} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.feature}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.sessions}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">{r.mom}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.adoption}%</td>
                      <td className="px-3 py-2 text-right font-mono">{r.nps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/product"   className="text-vfes-dark font-semibold hover:underline">{tt('→ Product roadmap')}</Link>
              <Link to="/portal/marketing" className="text-vfes-dark font-semibold hover:underline">{tt('→ Feature marketing')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Feature usage session growth — Jun 2026 totals')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Month')}</th>
                    <th className="px-3 py-2 text-right">{tt('Coverage')}</th>
                    <th className="px-3 py-2 text-right">{tt('Mobility')}</th>
                    <th className="px-3 py-2 text-right">{tt('SLA Feed')}</th>
                    <th className="px-3 py-2 text-right">{tt('IoT')}</th>
                    <th className="px-3 py-2 text-right">{tt('Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_USAGE.map(r => (
                    <tr key={r.m} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.m}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.coverage}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.mobility}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.sla}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.iot}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{r.coverage + r.mobility + r.sla + r.iot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  VERSIONS  ══════════════════════════════ */}
      {tab === 'versions' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Current version')}     value="v3.2.0" delta={tt('Jun 2026')}           trend="up"   icon={Download}    accent />
            <KpiCard label={tt('Consumers on latest')} value="49"     delta={tt('all upgraded')}        trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Release cadence')}     value="6–8wk"  delta={tt('regular')}            trend="flat" icon={Clock} />
            <KpiCard label={tt('Versions in support')} value="3"      delta={tt('v3.0+ supported')}    trend="flat" icon={Download} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Breaking changes (YTD)')} value="0"   delta={tt('backwards compat')}    trend="up"   icon={CheckCircle} />
            <KpiCard label={tt('Features shipped (YTD)')} value="18"  delta={tt('across 3 releases')}  trend="up"   icon={Boxes} />
            <KpiCard label={tt('Bug fixes (YTD)')}        value="42"  delta={tt('P1–P3 resolved')}     trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Consumer upgrade lag')}   value="<7d" delta={tt('auto-release dir.')}  trend="up"   icon={Zap} />
          </div>

          <Panel title={tt('Native App version history')}>
            <div className="space-y-3">
              {VERSIONS.map(v => (
                <div key={v.ver} className="flex items-start gap-4 border-b border-black/5 pb-3">
                  <span className="font-mono font-bold text-vfes-dark text-sm shrink-0">{v.ver}</span>
                  <div className="flex-1">
                    <div className="text-sm">{tt(v.note)}</div>
                    <div className="text-[11px] text-vfes-dark/55 mt-0.5">{v.date} · {v.consumers} {tt('consumers on this version')}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Versioned releases with release directives let consumers upgrade on their own schedule.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('Consumer distribution by version')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={VERSIONS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="ver" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [v, tt('Consumers')]} />
                  <Bar dataKey="consumers" fill={BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('All 49 consumers have upgraded to v3.2.0 — release directive successfully applied within 7 days of release.')}
            </div>
          </Panel>

          <Panel title={tt('Version upgrade adoption — detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Version')}</th>
                    <th className="px-3 py-2">{tt('Release date')}</th>
                    <th className="px-3 py-2">{tt('Key changes')}</th>
                    <th className="px-3 py-2 text-right">{tt('Consumers')}</th>
                    <th className="px-3 py-2 text-right">{tt('Adoption %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {VERSIONS.map(v => (
                    <tr key={v.ver} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono font-bold text-vfes-dark">{v.ver}</td>
                      <td className="px-3 py-2 font-mono text-xs">{v.date}</td>
                      <td className="px-3 py-2 text-xs">{tt(v.note)}</td>
                      <td className="px-3 py-2 text-right font-mono">{v.consumers}</td>
                      <td className="px-3 py-2 text-right font-mono">{((v.consumers / 49) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/mvno-wholesale" className="text-vfes-dark font-semibold hover:underline">{tt('→ MVNO & Wholesale')}</Link>
              <Link to="/portal/company-360"   className="text-vfes-dark font-semibold hover:underline">{tt('→ Company 360')}</Link>
              <Link to="/portal/digital-app"   className="text-vfes-dark font-semibold hover:underline">{tt('→ Digital app')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ── cross-portfolio navigation ── */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-black/5 shadow-sm">
        <div className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest mb-3">{tt('Related modules')}</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/portal/roaming"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Roaming P&L')}</Link>
          <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & charging')}</Link>
          <Link to="/portal/finance"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance & P&L')}</Link>
          <Link to="/portal/product"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Product catalogue')}</Link>
          <Link to="/portal/customer-360"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
          <Link to="/portal/ai-insights"      className="text-vfes-dark font-semibold hover:underline">{tt('→ AI Insights')}</Link>
          <Link to="/portal/mvno-wholesale"   className="text-vfes-dark font-semibold hover:underline">{tt('→ MVNO & Wholesale')}</Link>
          <Link to="/portal/digital-app"      className="text-vfes-dark font-semibold hover:underline">{tt('→ Digital app')}</Link>
          <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('→ Pricing simulator')}</Link>
          <Link to="/portal/marketing"        className="text-vfes-dark font-semibold hover:underline">{tt('→ Marketing')}</Link>
          <Link to="/portal/network"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Network & infrastructure')}</Link>
          <Link to="/portal/sales"            className="text-vfes-dark font-semibold hover:underline">{tt('→ Sales pipeline')}</Link>
        </div>
      </div>

      <AskTheData />
    </div>
  )
}
