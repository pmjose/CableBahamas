// =============================================================================
// B2B / Wholesale cockpit — senior-MD grade
// 9 tabs · global filters · ARR waterfall · pipeline coverage · wholesale infra
// renewal cliff · SLA · unit econ · Account 360 drill-down
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import tt from '../../i18n/tt'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import KpiCard from '../../components/KpiCard'
import {
  Building2, Briefcase, Network, Coins, Gauge, Layers, TrendingUp, TrendingDown,
  Users, Shield, AlertTriangle, CheckCircle, Clock, Award, Calendar, Heart, Activity,
  FileText, Globe, Cpu, Zap, BarChart3, Target, Flag, Wifi, Cable, Server, Cloud,
  PackageSearch, ChevronRight, MessageSquare, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie,
} from 'recharts'
import MlInsightSection from '../../components/MlInsightSection'
import { B2B_MOBILE } from './_mobile_data'
import {
  accounts, arrWaterfall, bookingsRev, pipelineDetail, forecast, winLoss, renewalCliff,
  slaSeries, installBacklog, interconnect, transitSeries, ixPresence, fibreInventory,
  subseaCapacity, dcInventory, serviceLines, smbCohorts, smbBySector, salesReps,
  healthBuckets, unitEcon, arAging, tenders, priceIndex, regulatory, buildAccountDetails,
  type Account, type Segment,
} from './_b2b_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const GREY = '#94a3b8'

const statusColor: Record<string, string> = {
  Healthy: 'bg-emerald-50 text-emerald-700',
  Watch:   'bg-amber-50 text-amber-700',
  Renewal: 'bg-blue-50 text-blue-700',
  'At Risk': 'bg-red-50 text-red-700',
  Churned: 'bg-zinc-200 text-zinc-700',
}

type SubTab = 'overview' | 'enterprise' | 'smb' | 'wholesale' | 'pipeline' | 'renewals' | 'service' | 'margin' | 'account360'
const subTabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',          icon: Gauge },
  { id: 'enterprise',  label: 'Enterprise',        icon: Building2 },
  { id: 'smb',         label: 'SMB',               icon: Briefcase },
  { id: 'wholesale',   label: 'Wholesale',         icon: Network },
  { id: 'pipeline',    label: 'Pipeline & Forecast', icon: Target },
  { id: 'renewals',    label: 'Renewals & Health', icon: Heart },
  { id: 'service',     label: 'Service & SLA',     icon: Shield },
  { id: 'margin',      label: 'Margin & Econ',     icon: Coins },
  { id: 'account360',  label: 'Account 360',       icon: PackageSearch },
]

type Filters = {
  segment: 'all' | Segment
  region: 'all' | Account['region']
  status: 'all' | Account['status']
}
const defaultFilters: Filters = { segment: 'all', region: 'all', status: 'all' }

export default function B2BPage() {
  const [sub, setSub] = useState<SubTab>('overview')
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window === 'undefined') return defaultFilters
    try { const raw = localStorage.getItem('b2b-cockpit-filters'); if (raw) return { ...defaultFilters, ...JSON.parse(raw) } } catch { /* ignore */ }
    return defaultFilters
  })
  useEffect(() => { try { localStorage.setItem('b2b-cockpit-filters', JSON.stringify(filters)) } catch { /* ignore */ } }, [filters])
  const setF = (p: Partial<Filters>) => setFilters((s) => ({ ...s, ...p }))

  const [selectedAcc, setSelectedAcc] = useState<string>(() => {
    if (typeof window === 'undefined') return 'BOI'
    const m = window.location.hash.match(/[?&]acc=([A-Z0-9_]+)/)
    if (m) return m[1]
    try { const raw = localStorage.getItem('b2b-cockpit-acc'); if (raw) return raw } catch { /* ignore */ }
    return 'BOI'
  })
  useEffect(() => { try { localStorage.setItem('b2b-cockpit-acc', selectedAcc) } catch { /* ignore */ } }, [selectedAcc])
  const drillInto = (code: string) => { setSelectedAcc(code); setSub('account360') }
  const [search360, setSearch360] = useState('')

  const filtered = useMemo(() => accounts.filter((a) =>
    (filters.segment === 'all' || a.segment === filters.segment) &&
    (filters.region === 'all' || a.region === filters.region) &&
    (filters.status === 'all' || a.status === filters.status)
  ), [filters])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('B2B / Wholesale')}
        subtitle={tt('26 named accounts · BSD 23.4M ARR · 5 segments · live MD cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('MD Cockpit')}</div>}
      />

      <AgentDecision
        title="Account growth & churn-risk agent"
        label="Run Account Optimiser" runningLabel="Scoring…"
        steps={[
          'Scored named accounts on expansion & churn risk',
          'Matched upsell (5G slice, SD-WAN, M2M) by fit',
          'Flagged renewal-risk logos for exec engagement',
          'Routed plays to account teams with owners',
        ]}
        hint="Expansion + retention in one pass — net revenue retention is the B2B scoreboard."
        result={{
          headline: 'Protect top-10 ARR logos; push Private-5G & SD-WAN upsell',
          stats: [
            { label: 'ARR', value: 'BSD 84.0M' },
            { label: 'Net Revenue Retention', value: '106%' },
            { label: 'Gross Revenue Retention', value: '92%' },
            { label: 'Logo Churn (TTM)', value: '6 logos' },
          ],
          findings: [
            'ARR is concentrated in the top-10 accounts and renewal risk there is the biggest exposure.',
            'Pair exec sponsorship on at-risk logos with Private-5G / SD-WAN expansion plays for net growth.',
            'Route upsell plays to account teams with owners — one pass for expansion + retention.',
          ],
          note: 'Concentration risk means one logo loss dents the quarter — protect first, expand second.',
        }}
        impact="defends concentrated ARR + expansion pipeline"
        risk="concentration — one logo loss dents the quarter"
        linkTo="#/portal/mvno-wholesale" linkLabel="Open MVNO & Wholesale"
      />

      {/* ── Related cockpits ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mr-1">{tt('Related cockpits')}</span>
        <Link to="/portal/company-360"        className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Building2 className="w-3 h-3" />{tt('Company 360')}</Link>
        <Link to="/portal/sales"              className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><TrendingUp className="w-3 h-3" />{tt('Sales')}</Link>
        <Link to="/portal/pricing-simulator"  className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Coins className="w-3 h-3" />{tt('Pricing Simulator')}</Link>
        <Link to="/portal/product"            className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Layers className="w-3 h-3" />{tt('Product')}</Link>
        <Link to="/portal/bundle-profitability" className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><BarChart3 className="w-3 h-3" />{tt('Bundle Profitability')}</Link>
        <Link to="/portal/mvno-wholesale"     className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Network className="w-3 h-3" />{tt('MVNO & Wholesale')}</Link>
        <Link to="/portal/roaming"            className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Globe className="w-3 h-3" />{tt('Roaming')}</Link>
        <Link to="/portal/customer-360"       className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Users className="w-3 h-3" />{tt('Customer 360')}</Link>
        <Link to="/portal/churn-retention"    className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Heart className="w-3 h-3" />{tt('Churn & Retention')}</Link>
        <Link to="/portal/finance"            className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><FileText className="w-3 h-3" />{tt('Finance')}</Link>
        <Link to="/portal/ai-insights"        className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Cpu className="w-3 h-3" />{tt('AI Insights')}</Link>
        <Link to="/portal/network"            className="inline-flex items-center gap-1 bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark px-3 py-1 rounded text-xs font-semibold"><Wifi className="w-3 h-3" />{tt('Network')}</Link>
      </div>

      <MlInsightSection
        heading={tt('B2B & Wholesale intelligence')}
        models={[
          { name: tt('Account churn-risk v3.2'),    metric: 'AUC 0.91', sub: 'XGBoost · 120 features · weekly'      },
          { name: tt('Expansion propensity scorer'), metric: 'AUC 0.87', sub: 'LightGBM · product-fit signals'       },
          { name: tt('WAULT renewal predictor'),     metric: 'MAPE 6%',  sub: 'LSTM · contract + ARR cohort signals' },
        ]}
        agentLabel={tt('Run B2B Intelligence Agent')}
        agentRunningLabel={tt('Scoring accounts…')}
        agentSteps={[
          tt('Scored 26 named accounts on churn + expansion signals'),
          tt('Ranked plays by segment fit and whitespace opportunity'),
          tt('Flagged renewal-cliff logos for exec engagement'),
          tt('Generated account-level action plans for AE desktop'),
        ]}
        agentBlurb={tt('Fuses ARR, NPS, WAULT, SLA and product signals into one prioritised action list per account.')}
        decision={{
          title: tt('Protect top-10 ARR logos · push Private 5G & SD-WAN upsell'),
          detail: tt('ARR is concentrated in the top-10 accounts. Pair exec sponsorship on at-risk logos with whitespace expansion plays for net growth.'),
          impact: tt('+BSD 1.2M ARR if top-3 whitespace plays convert in H2'),
          risk: tt('Concentration risk — one logo loss dents the quarter'),
          linkTo: '#/portal/company-360',
          linkLabel: tt('Open Company 360'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Account health distribution (26 named accounts)'),
          data: healthBuckets.map((b) => ({ band: b.band, count: b.count })),
          xKey: 'band',
          series: [{ key: 'count', name: tt('Accounts'), color: '#FF4438' }],
          colorBy: { key: 'count', high: 8, mid: 4 },
          note: tt('Health < 50 triggers Cortex renewal-save playbook automatically.'),
        }}
      />

      {/* Global filters */}
      <Panel>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Segment')}</div>
            <select value={filters.segment} onChange={(e) => setF({ segment: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All segments')}</option>
              <option>{tt('Enterprise')}</option><option>{tt('Mid-Market')}</option><option>{tt('SMB')}</option>
              <option>{tt('Wholesale-Carrier')}</option><option>{tt('Wholesale-Infra')}</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Region')}</div>
            <select value={filters.region} onChange={(e) => setF({ region: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All The Bahamas')}</option>
              <option>{tt('Nassau')}</option><option>{tt('Freeport')}</option><option>{tt('Abaco')}</option><option>{tt('Eleuthera')}</option><option>{tt('Long Island')}</option><option>{tt('National')}</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Status')}</div>
            <select value={tt(filters.status)} onChange={(e) => setF({ status: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All statuses')}</option>
              <option>{tt('Healthy')}</option><option>{tt('Watch')}</option><option>{tt('Renewal')}</option><option>{tt('At Risk')}</option><option>{tt('Churned')}</option>
            </select>
          </div>
        </div>
      </Panel>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 my-6">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition ${sub === id ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Knob strip */}
      <div className="bg-vfes-red/5 border-l-4 border-vfes-red rounded-r-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-vfes-dark/70">
        {sub === 'account360' && (
          <>
            <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Account drill-down')}</span>
            <label className="flex items-center gap-1.5">Pick account
              <select value={selectedAcc} onChange={(e) => setSelectedAcc(e.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
                {(['Enterprise', 'Mid-Market', 'Wholesale-Carrier', 'Wholesale-Infra'] as Segment[]).map((seg) => (
                  <optgroup key={seg} label={seg}>
                    {accounts.filter((a) => a.segment === seg).map((a) => (
                      <option key={a.code} value={a.code}>{tt(a.name)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <Link to={`/portal/company-360?a=${selectedAcc}`} className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-vfes-dark hover:underline">
              {tt('Open in Company 360')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
        {sub !== 'account360' && (
          <>
            <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Active scope')}</span>
            <span>{filtered.length} accounts · BSD {(filtered.reduce((a, b) => a + b.arr, 0) / 1000).toFixed(0)}K ARR</span>
            <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('Filters auto-saved · click any account to drill in')}</span>
          </>
        )}
      </div>

      {sub === 'overview'    && <OverviewTab filtered={filtered} drillInto={drillInto} />}
      {sub === 'enterprise'  && <EnterpriseTab filtered={filtered} drillInto={drillInto} />}
      {sub === 'smb'         && <SmbTab />}
      {sub === 'wholesale'   && <WholesaleTab filtered={filtered} drillInto={drillInto} />}
      {sub === 'pipeline'    && <PipelineTab />}
      {sub === 'renewals'    && <RenewalsTab filtered={filtered} drillInto={drillInto} />}
      {sub === 'service'     && <ServiceTab />}
      {sub === 'margin'      && <MarginTab />}
      {sub === 'account360'  && <Account360Tab code={selectedAcc} />}

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML renewal-risk model · 26 named accounts · semantic view B2B_360 · model b2b-cockpit v1.2 · refreshed daily 03:30 UTC
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- OVERVIEW
function OverviewTab({ filtered, drillInto }: { filtered: Account[]; drillInto: (c: string) => void }) {
  const totalARR = filtered.reduce((a, b) => a + b.arr, 0)
  const enterpriseARR = accounts.filter((a) => a.segment === 'Enterprise').reduce((s, a) => s + a.arr, 0)
  const wholesaleARR = accounts.filter((a) => a.segment.startsWith('Wholesale')).reduce((s, a) => s + a.arr, 0)
  const top10 = [...accounts].sort((a, b) => b.arr - a.arr).slice(0, 10)
  const top10Share = top10.reduce((s, a) => s + a.arr, 0) / accounts.reduce((s, a) => s + a.arr, 0)
  const segmentMix = ['Enterprise', 'Mid-Market', 'SMB', 'Wholesale-Carrier', 'Wholesale-Infra'].map((seg) => ({
    name: seg,
    value: accounts.filter((a) => a.segment === seg).reduce((s, a) => s + a.arr, 0),
  }))
  const segmentColors = [RED, RED2, AMBER, BLUE, PURPLE]

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('ARR')} value="BSD 84.0M" delta="+18.0% YoY" trend="up" icon={Coins} accent />
        <KpiCard label={tt('Net Revenue Retention')} value="106%" delta="+4 pts" trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Gross Revenue Retention')} value="92%" delta="-1 pt" trend="down" icon={Heart} />
        <KpiCard label={tt('Logo Churn (TTM)')} value="6 logos" delta="BSD 0.6M ARR" trend="down" icon={TrendingDown} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Top-10 concentration')} value={`${(top10Share * 100).toFixed(0)}%`} delta="of ARR" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('Enterprise ARR')} value={`BSD ${(enterpriseARR / 1_000_000).toFixed(1)}M`} delta="58% of book" trend="up" icon={Building2} />
        <KpiCard label={tt('Wholesale ARR')} value={`BSD ${(wholesaleARR / 1_000_000).toFixed(1)}M`} delta="32% of book" trend="up" icon={Network} />
        <KpiCard label={tt('WAULT')} value="22 mo" delta="weighted-avg" trend="flat" icon={Calendar} />
      </div>

      {/* Mobile B2B — M2M / IoT / MVNO / Private 5G */}
      <Panel title={tt('Mobile B2B — M2M / IoT · enterprise pools · MVNO · Private 5G')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Mobile B2B = +12.6% YoY')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Segment')}</th><th>{tt('Lines')}</th><th>{tt('Avg MRR / line')}</th><th>{tt('Monthly revenue')}</th><th>{tt('YoY growth')}</th><th>{tt('Accounts')}</th></tr>
          </thead>
          <tbody>
            {B2B_MOBILE.map((s) => (
              <tr key={s.segment} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(s.segment)}</td>
                <td className="font-mono text-xs">{(s.lines / 1e6).toFixed(2)}M</td>
                <td className="font-mono text-xs">BSD {s.mrr.toFixed(2)}</td>
                <td className="font-mono text-xs font-bold">BSD {s.monthlyRev.toFixed(2)}M</td>
                <td className={`font-bold text-xs ${s.growth >= 10 ? 'text-emerald-600' : s.growth >= 4 ? 'text-vfes-dark' : 'text-amber-600'}`}>+{s.growth.toFixed(1)}%</td>
                <td className="font-mono text-xs">{s.accounts.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Private 5G networks (84% YoY) and M2M / IoT (22.8% YoY) drive Mobile B2B growth. MVNO wholesale (fictional partners.) is mature but defensive against Rival ISP B ARPU compression in consumer.')}</div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('ARR waterfall · last FY')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={arrWaterfall} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {arrWaterfall.map((d, i) => (
                  <Cell key={i} fill={d.kind === 'pos' ? GREEN : d.kind === 'neg' ? RED : '#1f2937'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Segment mix (ARR BSD K)')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={segmentMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={100}>
                {segmentMix.map((_, i) => <Cell key={i} fill={segmentColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${(Number(v) / 1000).toFixed(1)}K`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Bookings vs revenue (BSD K) · last 6 quarters')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={bookingsRev}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="bookings" fill={RED} radius={[4, 4, 0, 0]} />
              <Line dataKey="revenue" stroke="#1f2937" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Top-10 ARR concentration')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Account')}</th><th>{tt('Segment')}</th><th>{tt('ARR')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {top10.map((a) => (
                <tr key={a.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(a.code)}>
                  <td className="py-2 font-semibold">{tt(a.name)}</td>
                  <td className="text-vfes-dark/60 text-xs">{a.segment}</td>
                  <td>BSD {(a.arr / 1000).toFixed(0)}K</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor[a.status]}`}>{tt(a.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Competitive price index (100 = market)')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={priceIndex}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="svc" tick={{ fontSize: 11 }} />
            <YAxis domain={[80, 115]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={100} stroke="#1f2937" strokeDasharray="3 3" />
            <Bar dataKey="cablebahamas" fill={RED} name={tt('Cable Bahamas')} />
            <Bar dataKey="btc" fill="#0a8754" name={tt('BTC')} />
            <Bar dataKey="orange" fill="#FF4438" name={tt('Rival ISP A')} />
            <Bar dataKey="bt" fill={BLUE} name={tt('BT The Bahamas')} />
            <Bar dataKey="adamo" fill={PURPLE} name={tt('EDPnet')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SiPrompts prompts={[
        'Which top-10 accounts are at renewal risk this quarter?',
        'Show ARR delta YoY by segment with new-logo vs expansion split.',
        'Forecast Q3 bookings using current pipeline coverage.',
        'Compare Cable Bahamas price index vs BTC for DIA 10G across last 4 quarters.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- ENTERPRISE
function EnterpriseTab({ filtered, drillInto }: { filtered: Account[]; drillInto: (c: string) => void }) {
  const ent = filtered.filter((a) => a.segment === 'Enterprise' || a.segment === 'Mid-Market')
  const verticalMix = Array.from(new Set(ent.map((a) => a.vertical))).map((v) => ({
    vertical: v,
    arr: ent.filter((a) => a.vertical === v).reduce((s, a) => s + a.arr, 0) / 1000,
    nps: Math.round(ent.filter((a) => a.vertical === v).reduce((s, a) => s + a.nps, 0) / Math.max(1, ent.filter((a) => a.vertical === v).length)),
    count: ent.filter((a) => a.vertical === v).length,
  })).sort((a, b) => b.arr - a.arr)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Enterprise logos')} value={`${ent.filter((a) => a.segment === 'Enterprise').length}`} delta="+12 net" trend="up" icon={Building2} accent />
        <KpiCard label={tt('Mid-Market logos')} value={`${ent.filter((a) => a.segment === 'Mid-Market').length}`} delta="+24 net" trend="up" icon={Briefcase} />
        <KpiCard label={tt('Avg MRR / Enterprise')} value="BSD 108K" delta="+6% YoY" trend="up" icon={Coins} />
        <KpiCard label={tt('Enterprise NPS')} value="38" delta="+3 pts" trend="up" icon={Heart} />
      </div>

      <Panel title={tt('Top accounts (filtered)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Account')}</th><th>{tt('Vertical')}</th><th>{tt('Region')}</th><th>{tt('MRR')}</th><th>{tt('Sites')}</th><th>{tt('Circuits')}</th><th>{tt('WAULT')}</th><th>{tt('Health')}</th><th>{tt('NPS')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {ent.sort((a, b) => b.mrr - a.mrr).map((a) => (
              <tr key={a.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(a.code)}>
                <td className="py-2.5 font-semibold">{tt(a.name)} <ChevronRight className="inline w-3 h-3 text-vfes-dark/30" /></td>
                <td className="text-vfes-dark/60">{a.vertical}</td>
                <td className="text-vfes-dark/60">{a.region}</td>
                <td className="font-semibold">BSD {(a.mrr / 1000).toFixed(0)}K</td>
                <td>{a.sites}</td>
                <td>{a.circuits}</td>
                <td className={a.wault < 6 ? 'text-vfes-dark font-bold' : ''}>{a.wault}m</td>
                <td><span className={a.health >= 70 ? 'text-emerald-600 font-bold' : a.health >= 50 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{a.health}</span></td>
                <td className={a.nps >= 30 ? 'text-emerald-600' : a.nps >= 0 ? 'text-amber-600' : 'text-vfes-dark'}>{a.nps}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor[a.status]}`}>{tt(a.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Vertical mix (ARR BSD K)')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={verticalMix} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="vertical" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Bar dataKey="arr" fill={RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('NPS by vertical')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={verticalMix}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="vertical" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke="#1f2937" strokeDasharray="3 3" />
              <Bar dataKey="nps" radius={[4, 4, 0, 0]}>
                {verticalMix.map((d, i) => (
                  <Cell key={i} fill={d.nps >= 30 ? GREEN : d.nps >= 0 ? AMBER : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Show all enterprise accounts with NPS < 0 and exec sponsor missing.',
        'Which verticals grew ARR fastest in last 12 months?',
        'List mid-market accounts ready for enterprise upsell.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- SMB
function SmbTab() {
  const totalSmb = smbBySector.reduce((s, x) => s + x.count, 0)
  const wAvgArpu = smbBySector.reduce((s, x) => s + x.arpu * x.count, 0) / totalSmb
  const wAvgChurn = smbBySector.reduce((s, x) => s + x.churn * x.count, 0) / totalSmb

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('SMB customers')} value={`${(totalSmb / 1000).toFixed(1)}K`} delta="+820 net" trend="up" icon={Briefcase} accent />
        <KpiCard label={tt('SMB ARPU (blended)')} value={`BSD ${wAvgArpu.toFixed(0)}`} delta="+BSD 8 YoY" trend="up" icon={Coins} />
        <KpiCard label={tt('SMB monthly churn')} value={`${(wAvgChurn * 100).toFixed(2)}%`} delta="-0.3 pt" trend="up" icon={Heart} />
        <KpiCard label={tt('Inside-sales attainment')} value="104%" delta="384 deals MTD" trend="up" icon={Target} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Cohort retention curves (% surviving)')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={[
              { m: 'M0', ...Object.fromEntries(smbCohorts.map((c) => [c.cohort, c.m0])) },
              { m: 'M6', ...Object.fromEntries(smbCohorts.map((c) => [c.cohort, c.m6 || null])) },
              { m: 'M12', ...Object.fromEntries(smbCohorts.map((c) => [c.cohort, c.m12 || null])) },
              { m: 'M18', ...Object.fromEntries(smbCohorts.map((c) => [c.cohort, c.m18 || null])) },
              { m: 'M24', ...Object.fromEntries(smbCohorts.map((c) => [c.cohort, c.m24 || null])) },
            ]}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {smbCohorts.map((c, i) => (
                <Line key={c.cohort} dataKey={c.cohort} stroke={[RED, RED2, AMBER, BLUE, GREEN][i]} strokeWidth={2} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('By sector — count, ARPU, churn')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Sector')}</th><th>{tt('Customers')}</th><th>{tt('ARPU')}</th><th>{tt('Monthly churn')}</th></tr>
            </thead>
            <tbody>
              {smbBySector.map((s) => (
                <tr key={s.sector} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{s.sector}</td>
                  <td>{s.count.toLocaleString()}</td>
                  <td>BSD {s.arpu}</td>
                  <td className={s.churn > 0.02 ? 'text-vfes-dark font-bold' : 'text-emerald-600'}>{(s.churn * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Which SMB cohort has the strongest 24-mo retention?',
        'Show top 50 SMB accounts trending toward churn.',
        'Compare SMB ARPU by sector vs enterprise per-site MRR.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- WHOLESALE
function WholesaleTab({ filtered, drillInto }: { filtered: Account[]; drillInto: (c: string) => void }) {
  const carriers = filtered.filter((a) => a.segment === 'Wholesale-Carrier')
  const infra = filtered.filter((a) => a.segment === 'Wholesale-Infra')
  const totalLitKm = fibreInventory.reduce((s, x) => s + x.lit, 0)
  const totalDarkKm = fibreInventory.reduce((s, x) => s + x.dark, 0)
  const totalKw = dcInventory.reduce((s, x) => s + x.kwSold, 0)
  const interconnectNet = interconnect.reduce((s, x) => s + x.net, 0)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Wholesale ARR')} value="BSD 26.7M" delta="+11% YoY" trend="up" icon={Network} accent />
        <KpiCard label={tt('Carrier customers')} value={`${carriers.length}`} delta="4 active" trend="flat" icon={Cable} />
        <KpiCard label={tt('Cloud / DC partners')} value={`${infra.length}`} delta="5 hyperscalers" trend="up" icon={Cloud} />
        <KpiCard label={tt('Net interconnect / mo')} value={`+BSD ${interconnectNet}K`} delta="settlement" trend="up" icon={Coins} />
      </div>

      <Panel title={tt('Carrier customers — interconnect & circuits')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Carrier')}</th><th>{tt('MRR')}</th><th>{tt('Circuits')}</th><th>{tt('WAULT')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {carriers.map((a) => (
              <tr key={a.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(a.code)}>
                <td className="py-2.5 font-semibold">{tt(a.name)}</td>
                <td>BSD {(a.mrr / 1000).toFixed(0)}K</td>
                <td>{a.circuits.toLocaleString()}</td>
                <td className={a.wault < 6 ? 'text-vfes-dark font-bold' : ''}>{a.wault}m</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor[a.status]}`}>{tt(a.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Voice interconnect — net settlement (BSD K/mo)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={interconnect}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="peer" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => n === 'net' ? `BSD ${v}K` : v} />
              <ReferenceLine y={0} stroke="#1f2937" />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {interconnect.map((d, i) => <Cell key={i} fill={d.net >= 0 ? GREEN : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('IP transit & peering capacity (Gbps · 12mo)')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={transitSeries}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 1.5]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="l" dataKey="peeringGbps" fill={BLUE} fillOpacity={0.3} stroke={BLUE} name={tt('Peering Gbps')} />
              <Area yAxisId="l" dataKey="transitGbps" fill={RED} fillOpacity={0.3} stroke={RED} name={tt('Transit Gbps')} />
              <Line yAxisId="r" dataKey="cost" stroke="#1f2937" strokeWidth={2} name={tt('BSD /Mbps')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('IX presence')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('IX')}</th><th>{tt('Ports')}</th><th>{tt('Util')}</th></tr>
            </thead>
            <tbody>
              {ixPresence.map((x) => (
                <tr key={x.ix} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{x.ix}</td>
                  <td>{x.ports} × {x.capacityG / x.ports}G</td>
                  <td><div className="flex items-center gap-1.5"><div className="flex-1 h-1.5 bg-zinc-100 rounded"><div className="h-full bg-vfes-red rounded" style={{ width: `${x.util * 100}%` }} /></div>{(x.util * 100).toFixed(0)}%</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={`Dark fibre inventory · ${totalLitKm + totalDarkKm}km`}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Region')}</th><th>{tt('Lit')}</th><th>{tt('Dark')}</th><th>{tt('Util')}</th></tr>
            </thead>
            <tbody>
              {fibreInventory.map((f) => (
                <tr key={f.region} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{f.region}</td>
                  <td>{f.lit}km</td>
                  <td>{f.dark}km</td>
                  <td>{(f.util * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={`DC / Colo · ${totalKw.toLocaleString()}kW sold`}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Site')}</th><th>{tt('Sold')}</th><th>{tt('Built')}</th><th>{tt('PUE')}</th></tr>
            </thead>
            <tbody>
              {dcInventory.map((d) => (
                <tr key={d.dc} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{d.dc}</td>
                  <td>{d.kwSold.toLocaleString()}kW</td>
                  <td>{d.kwBuilt.toLocaleString()}kW</td>
                  <td>{d.pue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Subsea / backhaul capacity (Tbps)')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={subseaCapacity} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid stroke="#eef0f3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="cable" type="category" tick={{ fontSize: 11 }} width={150} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v} Tbps`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="capacityTbps" fill={GREY} name={tt('Capacity')} />
            <Bar dataKey="soldTbps" fill={RED} name={tt('Sold')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={tt('Regulatory & URCA status')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Item')}</th><th>{tt('Status')}</th><th>{tt('Risk')}</th><th>{tt('Next milestone')}</th></tr>
          </thead>
          <tbody>
            {regulatory.map((r) => (
              <tr key={r.item} className="border-t border-black/5">
                <td className="py-2 font-semibold">{r.item}</td>
                <td>{tt(r.status)}</td>
                <td className={r.risk === 'High' ? 'text-vfes-dark font-bold' : r.risk === 'Medium' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{r.risk}</td>
                <td className="text-vfes-dark/60">{r.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <SiPrompts prompts={[
        'Which carrier interconnect routes are net-negative this quarter?',
        'Show dark-fibre routes with utilisation > 80% — capacity warning.',
        'Compare Tbps sold vs capacity across all subsea cables.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- PIPELINE
function PipelineTab() {
  const [showAllReps, setShowAllReps] = useState(false)
  const totalOpen = pipelineDetail.reduce((s, x) => s + x.open, 0)
  const totalWeighted = pipelineDetail.reduce((s, x) => s + x.weighted, 0)
  const coverage = totalOpen / forecast.target
  const winLossTotal = winLoss.reduce((s, x) => ({ won: s.won + x.won, lost: s.lost + x.lost }), { won: 0, lost: 0 })
  const winRate = winLossTotal.won / (winLossTotal.won + winLossTotal.lost)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Open pipeline')} value={`BSD ${totalOpen.toFixed(1)}M`} delta={`${coverage.toFixed(1)}× coverage`} trend="up" icon={Target} accent />
        <KpiCard label={tt('Weighted pipeline')} value={`BSD ${totalWeighted.toFixed(1)}M`} delta="prob-adj" trend="up" icon={Gauge} />
        <KpiCard label={tt('Q forecast (commit)')} value={`BSD ${forecast.commit}M`} delta={`vs BSD ${forecast.target}M target`} trend={forecast.commit >= forecast.target * 0.9 ? 'up' : 'down'} icon={Flag} />
        <KpiCard label={tt('Win rate (24mo)')} value={`${(winRate * 100).toFixed(0)}%`} delta={`${winLossTotal.won}W / ${winLossTotal.lost}L`} trend="up" icon={CheckCircle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Pipeline by stage (BSD M)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineDetail}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="open" fill={GREY} name={tt('Open')} />
              <Bar dataKey="weighted" fill={RED} name={tt('Weighted')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Forecast (BSD M) — commit · best · pipe vs target')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[{ k: 'Last Q', v: forecast.last }, { k: 'Commit', v: forecast.commit }, { k: 'Best case', v: forecast.bestCase }, { k: 'Pipe', v: forecast.pipe }, { k: 'Target', v: forecast.target }]}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="k" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}M`} />
              <ReferenceLine y={forecast.target} stroke={RED} strokeDasharray="3 3" label={{ value: 'Target', fontSize: 10, fill: RED }} />
              <Bar dataKey="v" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Win/Loss vs competitors (last 24 months)')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={winLoss} stackOffset="expand">
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="vs" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="won" stackId="a" fill={GREEN} name={tt('Won')} />
            <Bar dataKey="lost" stackId="a" fill={RED} name={tt('Lost')} />
            <Bar dataKey="neutral" stackId="a" fill={GREY} name={tt('No-decision')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={tt('Sales rep attainment & pipe coverage')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Rep')}</th><th>{tt('Segment')}</th><th>{tt('Quota (BSD K)')}</th><th>{tt('Attainment')}</th><th>{tt('Pipe (BSD M)')}</th><th>{tt('Open deals')}</th></tr>
          </thead>
          <tbody>
            {salesReps.filter((_, i) => showAllReps || i < 6).map((r) => (
              <tr key={r.rep} className="border-t border-black/5">
                <td className="py-2 font-semibold">{r.rep}</td>
                <td className="text-vfes-dark/60">{r.segment}</td>
                <td>BSD {r.quota}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-100 rounded">
                      <div className={`h-full rounded ${r.attain >= 1 ? 'bg-emerald-500' : r.attain >= 0.85 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${Math.min(120, r.attain * 100)}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${r.attain >= 1 ? 'text-emerald-600' : r.attain >= 0.85 ? 'text-amber-600' : 'text-vfes-dark'}`}>{(r.attain * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>BSD {r.pipe}M</td>
                <td>{r.deals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title={tt('Public-sector tenders & frameworks')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Tender')}</th><th>{tt('Closes')}</th><th>{tt('Value (BSD M)')}</th><th>{tt('Status')}</th><th>{tt('Win prob')}</th></tr>
          </thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={tt(t.name)} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(t.name)}</td>
                <td className="text-vfes-dark/60">{t.close}</td>
                <td>BSD {t.value}M</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${t.status === 'Bidding' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>{tt(t.status)}</span></td>
                <td className={t.win >= 0.5 ? 'text-emerald-600 font-bold' : t.win >= 0.3 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{(t.win * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <SiPrompts prompts={[
        'Show pipeline coverage by segment vs Q3 target.',
        'Which reps are at risk of missing quota this quarter?',
        'List all deals stuck in Negotiation > 30 days.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- RENEWALS
function RenewalsTab({ filtered, drillInto }: { filtered: Account[]; drillInto: (c: string) => void }) {
  const next6 = renewalCliff.slice(0, 6).reduce((s, x) => s + x.arr, 0)
  const next12 = renewalCliff.slice(0, 12).reduce((s, x) => s + x.arr, 0)
  const atRisk = filtered.filter((a) => a.status === 'At Risk' || a.status === 'Watch' || (a.wault > 0 && a.wault < 6)).sort((a, b) => a.wault - b.wault)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('ARR up next 6mo')} value={`BSD ${(next6 / 1000).toFixed(1)}M`} delta={`${renewalCliff.slice(0, 6).reduce((s, x) => s + x.count, 0)} contracts`} trend="flat" icon={Calendar} accent />
        <KpiCard label={tt('ARR up next 12mo')} value={`BSD ${(next12 / 1000).toFixed(1)}M`} delta="renewal cliff" trend="flat" icon={Clock} />
        <KpiCard label={tt('Auto-renew %')} value="62%" delta="auto-uplift" trend="up" icon={CheckCircle} />
        <KpiCard label={tt('Save rate (TTM)')} value="78%" delta="+4 pts" trend="up" icon={Heart} />
      </div>

      <Panel title={tt('Renewal cliff — next 24 months (BSD K ARR)')}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={renewalCliff}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'months ahead', fontSize: 10, position: 'bottom', offset: -4 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="arr" fill={RED} name={tt('ARR BSD K')} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" dataKey="count" stroke="#1f2937" strokeWidth={2} name={tt('# contracts')} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Health-score distribution')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={healthBuckets}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {healthBuckets.map((b, i) => <Cell key={i} fill={[GREEN, GREEN, AMBER, RED, '#7f1d1d'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('At-risk accounts (ranked by WAULT)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Account')}</th><th>{tt('MRR')}</th><th>{tt('WAULT')}</th><th>{tt('Health')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {atRisk.map((a) => (
                <tr key={a.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(a.code)}>
                  <td className="py-2 font-semibold">{tt(a.name)}</td>
                  <td>BSD {(a.mrr / 1000).toFixed(0)}K</td>
                  <td className={a.wault < 6 ? 'text-vfes-dark font-bold' : ''}>{a.wault}m</td>
                  <td className={a.health >= 70 ? 'text-emerald-600 font-bold' : a.health >= 50 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{a.health}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor[a.status]}`}>{tt(a.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'List renewals in next 90 days with health < 70.',
        'Forecast renewal save-rate using churn-risk model.',
        'Show accounts where WAULT decreased > 3 months QoQ.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- SERVICE
function ServiceTab() {
  const slaAvg = slaSeries.reduce((s, x) => s + x.uptimeEnt, 0) / slaSeries.length
  const totalCredits = slaSeries.reduce((s, x) => s + x.creditsK, 0)
  const totalP1 = slaSeries.reduce((s, x) => s + x.p1, 0)
  const installLive = installBacklog.find((b) => b.status === 'Live')?.count ?? 0
  const installInFlight = installBacklog.filter((b) => b.status !== 'Live').reduce((s, x) => s + x.count, 0)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Enterprise SLA (TTM)')} value={`${slaAvg.toFixed(3)}%`} delta="vs 99.95 target" trend={slaAvg >= 99.95 ? 'up' : 'down'} icon={Shield} accent />
        <KpiCard label={tt('P1 incidents (TTM)')} value={`${totalP1}`} delta="-12% YoY" trend="up" icon={AlertTriangle} />
        <KpiCard label={tt('Service credits paid')} value={`BSD ${totalCredits}K`} delta="TTM" trend="down" icon={Coins} />
        <KpiCard label={tt('Install backlog')} value={`${installInFlight}`} delta={`${installLive} live`} trend="flat" icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Uptime & MTTR (12mo)')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={slaSeries}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" domain={[99.85, 100]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="l" y={99.95} stroke={RED} strokeDasharray="3 3" />
              <Line yAxisId="l" dataKey="uptimeEnt" stroke={RED} strokeWidth={2} name={tt('Enterprise SLA')} />
              <Line yAxisId="l" dataKey="uptimeWhsl" stroke={BLUE} strokeWidth={2} name={tt('Wholesale SLA')} />
              <Bar yAxisId="r" dataKey="mttrMin" fill={GREY} name={tt('MTTR (min)')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('P1 count & service credits paid (BSD K)')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={slaSeries}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="p1" fill={RED} name={tt('P1 incidents')} />
              <Line yAxisId="r" dataKey="creditsK" stroke="#1f2937" strokeWidth={2} name={tt('Credits BSD K')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Install pipeline by status (aged days)')}>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={installBacklog.filter((b) => b.status !== 'Live')}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="count" fill={RED} name={tt('Orders')} />
            <Line yAxisId="r" dataKey="agedDays" stroke="#1f2937" strokeWidth={2} name={tt('Avg aged (days)')} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <SiPrompts prompts={[
        'Which accounts had multiple P1s in last 90 days?',
        'List install orders aged > 60 days by status.',
        'Forecast service credits next quarter at current trend.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- MARGIN
function MarginTab() {
  const [serviceSort, setServiceSort] = useState<'rev' | 'gm'>('rev')
  const totalAR = arAging.reduce((s, x) => s + x.amt, 0)
  const aged60 = arAging[3].amt + arAging[4].amt
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Blended Gross Margin')} value="58%" delta="+2 pts YoY" trend="up" icon={Coins} accent />
        <KpiCard label={tt('LTV / CAC (Enterprise)')} value="10.0×" delta="14mo payback" trend="up" icon={Target} />
        <KpiCard label={tt('DSO (B2B)')} value="42d" delta="-3d QoQ" trend="up" icon={Clock} />
        <KpiCard label={tt('Capex / gross-add')} value="BSD 2.4K" delta="success-based" trend="flat" icon={Cpu} />
      </div>

      <Panel title={tt('Service-line economics')} action={<button onClick={() => setServiceSort(v => v === 'rev' ? 'gm' : 'rev')} className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 hover:text-vfes-dark px-2 py-1 rounded border border-black/10">{tt('Sort by')} {serviceSort === 'rev' ? tt('Revenue') : tt('Margin')}</button>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Service line')}</th><th>{tt('Revenue (BSD K)')}</th><th>{tt('Growth')}</th><th>{tt('Gross margin')}</th><th>{tt('Attach')}</th></tr>
          </thead>
          <tbody>
            {serviceLines.sort((a, b) => serviceSort === 'gm' ? b.gm - a.gm : b.rev - a.rev).map((s) => (
              <tr key={s.svc} className="border-t border-black/5">
                <td className="py-2 font-semibold">{s.svc}</td>
                <td>BSD {s.rev.toLocaleString()}</td>
                <td className="text-emerald-600 font-bold">+{(s.growth * 100).toFixed(0)}%</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-100 rounded"><div className="h-full bg-emerald-500 rounded" style={{ width: `${s.gm * 100}%` }} /></div>
                    <span className="text-xs font-bold">{(s.gm * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>{s.attach > 0 ? `${(s.attach * 100).toFixed(0)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Unit economics by segment')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={unitEcon}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="segment" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="cac" fill={RED} name={tt('CAC BSD ')} />
              <Bar yAxisId="l" dataKey="ltv" fill={GREEN} name={tt('LTV BSD ')} />
              <Line yAxisId="r" dataKey="payback" stroke="#1f2937" strokeWidth={2} name={tt('Payback (mo)')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={`AR aging · BSD ${totalAR}K total · BSD ${aged60}K aged 60+`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={arAging}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                {arAging.map((d, i) => <Cell key={i} fill={i < 2 ? GREEN : i === 2 ? AMBER : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Show top accounts by aged AR > 60 days.',
        'Compare LTV/CAC by vertical.',
        'Forecast gross margin if SD-WAN attach reaches 50%.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- ACCOUNT 360
function Account360Tab({ code }: { code: string }) {
  const det = useMemo(() => buildAccountDetails(code), [code])
  const a = det.account
  const totalPipe = det.pipeline.reduce((s, p) => s + p.value, 0)
  const totalTickets = det.tickets.reduce((s, t) => s + t.p1 + t.p2 + t.p3, 0)
  const slaAvg = det.slaHistory.reduce((s, x) => s + x.uptime, 0) / det.slaHistory.length
  const totalAR = det.ar.reduce((s, x) => s + x.amt, 0)
  const expansionTcv = det.expansionPlay.reduce((s, p) => s + p.tcv, 0)

  const flagSeverityColor: Record<string, string> = { info: 'bg-blue-50 text-blue-700 border-blue-200', warn: 'bg-amber-50 text-amber-700 border-amber-200', crit: 'bg-red-50 text-red-700 border-red-200' }
  const sentColor: Record<string, string> = { Champion: 'bg-emerald-50 text-emerald-700', Supporter: 'bg-blue-50 text-blue-700', Neutral: 'bg-zinc-100 text-zinc-700', Detractor: 'bg-red-50 text-red-700' }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">{a.segment} · {a.vertical} · {a.region}</div>
            <div className="text-3xl font-extrabold mt-1">{tt(a.name)}</div>
            <div className="text-sm text-white/70 mt-1">Owner: {a.ownerAE} · Exec sponsor: {a.exec} · Contract end {a.contractEnd}</div>
          </div>
          <div className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest ${a.status === 'Healthy' ? 'bg-emerald-500' : a.status === 'Watch' ? 'bg-amber-500' : a.status === 'Renewal' ? 'bg-blue-500' : 'bg-vfes-red'}`}>{tt(a.status)}</div>
        </div>
      </div>

      {/* KPI hero */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('ARR')} value={`BSD ${(a.arr / 1000).toFixed(0)}K`} delta={`BSD ${(a.mrr / 1000).toFixed(0)}K MRR`} trend="up" icon={Coins} accent />
        <KpiCard label={tt('Sites / circuits')} value={`${a.sites} / ${a.circuits}`} delta={`${det.sites.length} regions`} trend="flat" icon={Globe} />
        <KpiCard label={tt('Health')} value={`${a.health}`} delta={`NPS ${a.nps}`} trend={a.health >= 70 ? 'up' : 'down'} icon={Heart} />
        <KpiCard label={tt('WAULT')} value={`${a.wault}m`} delta={`pipe BSD ${(totalPipe / 1000).toFixed(0)}K`} trend={a.wault >= 12 ? 'up' : 'down'} icon={Calendar} />
      </div>

      {/* Risk flags */}
      {det.flags.length > 0 && (
        <Panel title={`Risk flags (${det.flags.length})`}>
          <div className="grid md:grid-cols-2 gap-2">
            {det.flags.map((f, i) => (
              <div key={i} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${flagSeverityColor[f.severity]}`}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold">{f.kind} · {f.severity}</span>
                  <div>{tt(f.text)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('ARR trend (24mo, BSD K)')}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={det.arrTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Area dataKey="arr" stroke={RED} fill={RED} fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Service mix (MRR BSD )')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={det.serviceMix} dataKey="mrr" nameKey="svc" innerRadius={40} outerRadius={90}>
                {det.serviceMix.map((_, i) => <Cell key={i} fill={[RED, RED2, AMBER, BLUE, GREEN, PURPLE, GREY, '#0ea5e9'][i % 8]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${(Number(v) / 1000).toFixed(1)}K`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Sites by region')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Region')}</th><th>{tt('Sites')}</th><th>{tt('Circuits')}</th></tr>
            </thead>
            <tbody>
              {det.sites.map((s) => (
                <tr key={s.region} className="border-t border-black/5"><td className="py-2 font-semibold">{s.region}</td><td>{s.count}</td><td>{s.circuits}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Active contracts')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Service')}</th><th>{tt('End')}</th><th>{tt('MRR')}</th><th>{tt('Auto')}</th></tr>
            </thead>
            <tbody>
              {det.contracts.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{c.id}</td>
                  <td>{c.svc}</td>
                  <td>{c.end}</td>
                  <td>BSD {(c.mrr / 1000).toFixed(0)}K</td>
                  <td>{c.auto ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Open opportunities')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Opp')}</th><th>{tt('Stage')}</th><th>{tt('BSD K')}</th><th>{tt('Close')}</th></tr>
            </thead>
            <tbody>
              {det.pipeline.map((p, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{p.opp}</td>
                  <td className="text-xs">{p.stage}</td>
                  <td>BSD {(p.value / 1000).toFixed(0)}K</td>
                  <td className="text-xs">{p.close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`Tickets (12mo · ${totalTickets} total)`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={det.tickets} stackOffset="sign">
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="p1" stackId="a" fill={RED} name={tt('P1')} />
              <Bar dataKey="p2" stackId="a" fill={AMBER} name={tt('P2')} />
              <Bar dataKey="p3" stackId="a" fill={GREY} name={tt('P3')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={`SLA history · avg ${slaAvg.toFixed(3)}%`}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={det.slaHistory}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="l" domain={[99.85, 100]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="l" y={99.95} stroke={RED} strokeDasharray="3 3" />
              <Line yAxisId="l" dataKey="uptime" stroke={RED} strokeWidth={2} name={tt('Uptime %')} />
              <Bar yAxisId="r" dataKey="credits" fill={GREY} name={tt('Credits BSD ')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('NPS trend')}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={det.npsTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="q" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke="#1f2937" strokeDasharray="3 3" />
              <Line dataKey="nps" stroke={RED} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Exec relationship map')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Role')}</th><th>{tt('Sentiment')}</th></tr>
            </thead>
            <tbody>
              {det.contacts.map((c, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(c.role)}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sentColor[c.sentiment]}`}>{c.sentiment}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('QBRs (last 4)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Date')}</th><th>{tt('Sponsor')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {det.qbrs.map((q, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 text-xs">{q.date}</td>
                  <td className="text-xs">{q.sponsor}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${q.status === 'Held' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{tt(q.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`AR aging · BSD ${totalAR}K`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={det.ar}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                {det.ar.map((d, i) => <Cell key={i} fill={i < 2 ? GREEN : i === 2 ? AMBER : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={`Expansion playbook · BSD ${(expansionTcv / 1000).toFixed(0)}K addressable`}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Play')}</th><th>{tt('Rationale')}</th><th>{tt('TCV BSD K')}</th><th>{tt('Prob')}</th></tr>
            </thead>
            <tbody>
              {det.expansionPlay.map((p, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{p.play}</td>
                  <td className="text-vfes-dark/60 text-xs">{p.rationale}</td>
                  <td>BSD {(p.tcv / 1000).toFixed(0)}K</td>
                  <td className={p.prob >= 0.6 ? 'text-emerald-600 font-bold' : p.prob >= 0.4 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{(p.prob * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        `Show ${tt(a.name)}'s last 12 P1 incidents and root cause.`,
        `What is the renewal save plan for ${tt(a.name)}?`,
        `List expansion plays > 50% probability for ${tt(a.name)}.`,
        `Compare ${tt(a.name)}'s SLA performance vs vertical median.`,
        `Who at ${tt(a.name)} should the exec sponsor meet next quarter?`,
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- SI prompts strip
function SiPrompts({ prompts }: { prompts: string[] }) {
  return (
    <Panel title={tt('Snowflake Intelligence — try a question')}>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <div key={i} className="inline-flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-vfes-red/10">
            <MessageSquare className="w-3.5 h-3.5" /> {p}
          </div>
        ))}
      </div>
    </Panel>
  )
}
