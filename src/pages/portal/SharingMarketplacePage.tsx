import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Globe2, ArrowDownCircle, ArrowUpCircle, Smartphone,
  TrendingUp, DollarSign, Users, ShieldCheck, Database, Zap, Activity, AlertTriangle, Lock,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, Cell, ComposedChart, ReferenceLine,
} from 'recharts'
import { MOBILE_SHARES } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── Static data ─────────────────────────────────────────────────────────────
const OUTBOUND = [
  { name: 'CBL_NETWORK_INTEL_LISTING', typeKey: 'paid',   type: 'Marketplace · paid', consumers: 14,  regions: 'US/Canada', mrr: 42000, mrrFmt: 'BSD 42K', sla: '99.9%',      status: 'live'  },
  { name: 'CBL_AGGREGATED_FOOTFALL',   typeKey: 'paid',   type: 'Marketplace · paid', consumers: 8,   regions: 'US-East',    mrr: 18000, mrrFmt: 'BSD 18K', sla: '99.5%',      status: 'live'  },
  { name: 'CBL_PRIVATE_ISLAND_BANK',     typeKey: 'direct', type: 'Direct share · 1:1', consumers: 1,   regions: 'BE',    mrr: 0,     mrrFmt: '—',    sla: 'best-effort', status: 'live'  },
  { name: 'CBL_OPEN_DATA_ESG',         typeKey: 'free',   type: 'Marketplace · free', consumers: 184, regions: 'global',mrr: 0,     mrrFmt: '—',    sla: 'best-effort', status: 'live'  },
  { name: 'CBL_DEMOGRAPHIC_LISTING',   typeKey: 'paid',   type: 'Marketplace · paid', consumers: 0,   regions: 'US/Canada', mrr: 0,     mrrFmt: '—',    sla: 'pending',     status: 'draft' },
]

const INBOUND = [
  { name: 'BAHAMAS_NSI_DATA',    provider: 'Marketplace · Bahamas NSI',  tables: 14, size: '8.2 GB',  cost: 'free',      auto_refresh: 'monthly',   use: 'demographics, ESG',  region: 'US-East'     },
  { name: 'URCA_PRICE_INTEL',    provider: 'Marketplace · URCA',         tables: 6,  size: '480 MB',  cost: 'BSD 2K/mo',    auto_refresh: 'weekly',    use: 'price benchmark',    region: 'US-East'     },
  { name: 'OECD_TELECOM_BENCH',  provider: 'Marketplace · OECD',         tables: 22, size: '4.1 GB',  cost: 'free',      auto_refresh: 'quarterly', use: 'Caribbean benchmark',       region: 'Global' },
  { name: 'ISLAND_BANK_FRAMEWORK', provider: 'Direct share · Island Bank (demo)',   tables: 4,  size: '120 MB',  cost: '—',         auto_refresh: 'on-change', use: 'framework deal',     region: 'US-East'     },
  { name: 'WEATHER_FORECAST_EU', provider: 'Marketplace · Tomorrow.io',  tables: 8,  size: '2.4 GB',  cost: 'BSD 3.2K/mo',  auto_refresh: 'hourly',    use: 'field-ops, network', region: 'US-East'     },
  { name: 'OPEN_FIBER_REGISTRY', provider: 'Marketplace · BTC OD',  tables: 2,  size: '180 MB',  cost: 'free',      auto_refresh: 'monthly',   use: 'coverage planning',  region: 'US-East'     },
]

const CLEAN_ROOMS = [
  { name: 'ISLAND_BANK_x_CBL_PROPENSITY', partner: 'Island Bank (demo)',    use: 'joint propensity model', state: 'analysis-running', shared_kpis: 'overlap, lift, CLV'        },
  { name: 'Benchmark B_x_CBL_BUNDLE',          partner: 'Rival ISP B The Bahamas',  use: 'bundle attribution',     state: 'live',             shared_kpis: 'attribution lift'           },
  { name: 'MOBILE_VIKINGS_x_CBL',         partner: 'Mobile Vikings', use: 'audience overlap',       state: 'awaiting-approve', shared_kpis: 'overlap %, segment volumes' },
]

const DATA_PRODUCTS = [
  { product: 'Network Intelligence Suite',    category: 'Network',      consumers: 22,  mrr: 'BSD 42K', status: 'live'  },
  { product: 'Footfall & Location Analytics', category: 'Location',     consumers: 8,   mrr: 'BSD 18K', status: 'live'  },
  { product: 'ESG & Open Data',               category: 'ESG',          consumers: 184, mrr: '—',    status: 'live'  },
  { product: 'Demographic Insights',          category: 'Demographics', consumers: 0,   mrr: '—',    status: 'draft' },
  { product: 'B2B Network APIs',              category: 'B2B',          consumers: 5,   mrr: 'BSD 28K', status: 'live'  },
  { product: 'IoT Telemetry Streams',         category: 'IoT',          consumers: 3,   mrr: 'BSD 12K', status: 'beta'  },
]

const READER_ACCOUNTS = [
  { account: 'MediaCo-Viewer',   created: '2024-06', tables: 4, refreshes: 180, cost: 'BSD 1.2K/mo', status: 'active' },
  { account: 'RetailPartner-RO', created: '2024-08', tables: 2, refreshes: 90,  cost: 'BSD 0.8K/mo', status: 'active' },
  { account: 'Regulator-URCA',   created: '2024-04', tables: 8, refreshes: 12,  cost: '—',         status: 'active' },
]

const ICEBERG_SHARES = [
  { table: 'CBL_NETWORK_TOPOLOGY_ICB',   consumers: 3,  size: '42 GB',  refresh: 'daily',   status: 'live' },
  { table: 'CBL_FOOTFALL_AGGREGATE_ICB', consumers: 2,  size: '18 GB',  refresh: 'hourly',  status: 'live' },
  { table: 'CBL_OPEN_COVERAGE_ICB',      consumers: 7,  size: '8.4 GB', refresh: 'weekly',  status: 'live' },
  { table: 'CBL_ESG_REPORTING_ICB',      consumers: 12, size: '3.2 GB', refresh: 'monthly', status: 'live' },
]

const GOVERNANCE_CHECKS = [
  { check: 'PII scan — all outbound listings',    result: 'Pass',  last: '2026-11-28', owner: 'CDO Office' },
  { check: 'Secure share encryption audit',        result: 'Pass',  last: '2026-11-20', owner: 'Security'   },
  { check: 'Marketplace T&C compliance',           result: 'Pass',  last: '2026-10-31', owner: 'Legal'      },
  { check: 'Data residency (Bahamas / US-East)',             result: 'Pass',  last: '2026-11-01', owner: 'DPO'        },
  { check: 'Consumer access review (semi-annual)', result: 'Pass',  last: '2026-09-30', owner: 'Data Gov'   },
  { check: 'Reader account activity audit',        result: 'Watch', last: '2026-11-15', owner: 'Ops'        },
]

const MRR_TREND = [
  { m: 'Jun', mrr: 42, target: 50 }, { m: 'Jul', mrr: 46, target: 52 },
  { m: 'Aug', mrr: 50, target: 54 }, { m: 'Sep', mrr: 54, target: 56 },
  { m: 'Oct', mrr: 57, target: 58 }, { m: 'Nov', mrr: 60, target: 60 },
]

const CONSUMER_GROWTH = [
  { m: 'Jun', total: 162, paid: 21 }, { m: 'Jul', total: 171, paid: 20 },
  { m: 'Aug', total: 182, paid: 20 }, { m: 'Sep', total: 191, paid: 21 },
  { m: 'Oct', total: 200, paid: 22 }, { m: 'Nov', total: 207, paid: 23 },
]

const SHARE_VOL_TREND = [
  { m: 'Jun', out: 5, inb: 4 }, { m: 'Jul', out: 5, inb: 5 },
  { m: 'Aug', out: 5, inb: 5 }, { m: 'Sep', out: 5, inb: 6 },
  { m: 'Oct', out: 5, inb: 6 }, { m: 'Nov', out: 5, inb: 6 },
]

const REVENUE_BY_TYPE = [
  { type: 'Marketplace paid', rev: 720 }, { type: 'Direct share', rev: 180 },
  { type: 'B2B licensing',    rev: 340 }, { type: 'API monetization', rev: 120 },
]

const INBOUND_COST_TREND = [
  { m: 'Jun', cost: 4.2 }, { m: 'Jul', cost: 4.8 }, { m: 'Aug', cost: 4.9 },
  { m: 'Sep', cost: 5.0 }, { m: 'Oct', cost: 5.1 }, { m: 'Nov', cost: 5.2 },
]

const CONSUMER_REGIONS = [
  { region: 'The Bahamas',      n: 84 }, { region: 'UK',      n: 42 },
  { region: 'France',      n: 28 }, { region: 'Germany', n: 21 },
  { region: 'Netherlands', n: 18 }, { region: 'Global',  n: 14 },
]

const REVENUE_FORECAST = [
  { m: 'Jun', mrr: 42, fcast: null }, { m: 'Jul', mrr: 46, fcast: null },
  { m: 'Aug', mrr: 50, fcast: null }, { m: 'Sep', mrr: 54, fcast: null },
  { m: 'Oct', mrr: 57, fcast: null }, { m: 'Nov', mrr: 60, fcast: 60  },
  { m: 'Dec', mrr: null, fcast: 64 }, { m: 'Jan', mrr: null, fcast: 68 },
  { m: 'Feb', mrr: null, fcast: 72 }, { m: 'Mar', mrr: null, fcast: 76 },
  { m: 'Apr', mrr: null, fcast: 80 }, { m: 'May', mrr: null, fcast: 85 },
]

const MARKETPLACE_DL = [
  { listing: 'NETWORK_INTEL', q1: 142, q2: 168 },
  { listing: 'FOOTFALL',      q1: 88,  q2: 102  },
  { listing: 'ESG',           q1: 421, q2: 480  },
  { listing: 'DEMOGRAPHIC',   q1: 0,   q2: 12   },
  { listing: 'B2B_APIS',      q1: 58,  q2: 72   },
]

const LISTING_PERF = [
  { listing: 'NETWORK_INTEL', views: 840, trials: 62, converts: 14, cvr: 22.6 },
  { listing: 'FOOTFALL',      views: 540, trials: 28, converts: 8,  cvr: 28.6 },
  { listing: 'ESG',           views: 2100,trials: 310,converts: 184,cvr: 59.4 },
  { listing: 'DEMOGRAPHIC',   views: 180, trials: 4,  converts: 0,  cvr: 0    },
  { listing: 'B2B_APIS',      views: 420, trials: 18, converts: 5,  cvr: 27.8 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'outbound' | 'inbound' | 'marketplace' | 'consumers' | 'monetization' | 'governance' | 'iceberg'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',     label: 'Overview'     },
  { id: 'outbound',     label: 'Outbound'     },
  { id: 'inbound',      label: 'Inbound'      },
  { id: 'marketplace',  label: 'Marketplace'  },
  { id: 'consumers',    label: 'Consumers'    },
  { id: 'monetization', label: 'Monetization' },
  { id: 'governance',   label: 'Governance'   },
  { id: 'iceberg',      label: 'Iceberg'      },
]

export default function SharingMarketplacePage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('overview')
  const [listingFilter, setListingFilter] = useState<string>('All')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [consumerSort, setConsumerSort] = useState<'consumers' | 'mrr'>('consumers')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const [govFilter, setGovFilter] = useState<'all' | 'pass' | 'watch'>('all')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredOutbound = useMemo(
    () => listingFilter === 'All' ? OUTBOUND : OUTBOUND.filter(o => o.typeKey === listingFilter),
    [listingFilter],
  )

  const filteredInbound = useMemo(
    () => regionFilter === 'All' ? INBOUND : INBOUND.filter(i => i.region === regionFilter),
    [regionFilter],
  )

  const sortedProducts = useMemo(
    () => [...DATA_PRODUCTS].sort((a, b) =>
      consumerSort === 'consumers' ? b.consumers - a.consumers : a.product.localeCompare(b.product),
    ),
    [consumerSort],
  )

  const filteredGov = useMemo(
    () => govFilter === 'all'
      ? GOVERNANCE_CHECKS
      : GOVERNANCE_CHECKS.filter(g => g.result.toLowerCase() === govFilter),
    [govFilter],
  )

  const totalMRRk = useMemo(() => Math.round(OUTBOUND.reduce((s, o) => s + o.mrr, 0) / 1000), [])

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Sharing & Marketplace')}
        subtitle={tt('outbound listings · inbound shares · Marketplace data products · consumers · monetization · secure shares')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/data-products" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Database className="w-4 h-4" /> {tt('Data Products')}
            </Link>
          </div>
        }
      />

      <MlInsightSection
        heading="Sharing intelligence"
        models={[
          { name: 'Monetization Predictor', metric: '+BSD 120K/yr', sub: 'incremental listing revenue' },
          { name: 'Consumer Churn Model',   metric: 'AUC 0.88',  sub: 'marketplace subscriber risk'  },
          { name: 'Listing Recommender',    metric: 'prec 0.82', sub: 'next-best data product'        },
        ]}
        agentLabel={tt('Run Sharing Agent')}
        agentRunningLabel={tt('Optimising…')}
        agentSteps={[
          tt('Scanned 5 outbound listings for consumer demand signal'),
          tt('Ranked CBL_DEMOGRAPHIC_LISTING as highest incremental revenue opportunity'),
          tt('Modelled consumer churn risk — 2 at-risk subscribers identified'),
          tt('Recommended 3 new data products based on inbound usage patterns'),
        ]}
        agentBlurb={tt('One sharing layer — listings, direct shares, clean rooms — lets a single model see the full monetization picture and identify the next-best data product.')}
        decision={{
          title: tt('Launch CBL_DEMOGRAPHIC_LISTING to unlock BSD 120K incremental MRR'),
          detail: tt('The monetization model identifies CBL_DEMOGRAPHIC_LISTING as the highest-value unscenario asset. 22 prospective consumers already query similar ESG data; the demographic product fills a gap in the US telco marketplace and commands a premium price point.'),
          impact: tt('BSD 120K incremental MRR · 22 new marketplace consumers'),
          risk: tt('DPO sign-off needed — aggregation thresholds must be confirmed before publish'),
          linkTo: '/portal/data-products',
          linkLabel: tt('Open Data Products'),
        }}
        chart={{
          kind: 'line',
          title: tt('Marketplace MRR trend — actual vs target (BSD K)'),
          xKey: 'm',
          unit: 'BSD K',
          data: MRR_TREND,
          series: [
            { key: 'mrr',    name: 'Actual MRR', color: BLUE               },
            { key: 'target', name: 'Target',     color: GREEN, dashed: true },
          ],
          note: tt('On track for BSD 60K MRR — demographic listing is the next BSD 120K opportunity.'),
        }}
      />

      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('CBL_DEMOGRAPHIC_LISTING in draft — DPO approval outstanding · MOBILE_VIKINGS_x_CBL clean room awaiting partner sign-off')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('MediaCo-Viewer reader account activity below threshold — review recommended.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/catalog" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Catalog →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <KpiCard label={tt('Outbound listings')} value="5"              delta={tt('+1 draft pending')}   trend="up"   icon={ArrowUpCircle} accent />
        <KpiCard label={tt('Marketplace MRR')}   value={`BSD ${totalMRRk}K`} delta="+BSD 4K MoM"             trend="up"   icon={DollarSign}   />
        <KpiCard label={tt('Total consumers')}   value="207"             delta="+7 MoM"                  trend="up"   icon={Users}        />
        <KpiCard label={tt('Inbound shares')}    value="6"              delta={tt('BSD 5.2K/mo cost')}     trend="flat" icon={ArrowDownCircle} />
        <KpiCard label={tt('Data products')}     value="12"             delta={tt('6 live · 1 beta')}   trend="up"   icon={Database}     />
        <KpiCard label={tt('Iceberg tables')}    value="18"             delta={tt('shared externally')} trend="up"   icon={Zap}          />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Revenue YTD')}     value="BSD 720K" delta="+38% YoY"                     trend="up"   icon={TrendingUp}  accent />
        <KpiCard label={tt('Reader accounts')} value="3"     delta={tt('active viewer accounts')} trend="flat" icon={ShieldCheck} />
        <KpiCard label={tt('Secure shares')}   value="4"     delta={tt('end-to-end encrypted')}   trend="up"   icon={Activity}   />
        <KpiCard label={tt('Freshness SLA')}   value="99.7%" delta="+0.1 pp QoQ"                  trend="up"   icon={Globe2}     />
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Marketplace MRR — actual vs target (BSD K)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={MRR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mrr"    name={tt('Actual MRR')} stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="target" name={tt('Target')}     stroke={GREEN} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <Link to="/portal/sharing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Sharing Overview →')}</Link>
              <span className="text-[10px] text-vfes-dark/40">{tt('On target for BSD 85K MRR by December')}</span>
            </div>
          </Panel>

          <Panel title={tt('Consumer growth — total & paid (MoM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONSUMER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total" name={tt('Total consumers')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid"  name={tt('Paid consumers')}  fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/data-products" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Products →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Revenue by share type (BSD K YTD)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={REVENUE_BY_TYPE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="BSD K" />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rev" name={tt('Revenue BSD K')} radius={[0, 4, 4, 0]}>
                    {REVENUE_BY_TYPE.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <Link to="/portal/b2b" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open B2B →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Share volume — outbound vs inbound')}>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={SHARE_VOL_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="out" name={tt('Outbound')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.25} />
                  <Area type="monotone" dataKey="inb" name={tt('Inbound')}  stroke={GREEN} fill={GREEN} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Catalog →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Data products — quick summary')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Product')}</th>
                    <th className="text-right">{tt('Consumers')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_PRODUCTS.map(d => (
                    <tr key={d.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-1.5 text-xs font-semibold">{tt(d.product)}</td>
                      <td className="text-right font-mono text-xs">{d.consumers}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === 'live' ? 'bg-emerald-100 text-emerald-700' : d.status === 'beta' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tt(d.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/data-contracts" className="font-semibold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
              <span>·</span>
              <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Clean rooms in flight — cross-partner collaboration')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Clean room')}</th>
                  <th>{tt('Partner')}</th>
                  <th>{tt('Use case')}</th>
                  <th>{tt('State')}</th>
                  <th>{tt('Shared KPIs')}</th>
                </tr>
              </thead>
              <tbody>
                {CLEAN_ROOMS.map(c => (
                  <tr key={c.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono text-xs font-semibold">{c.name}</td>
                    <td className="text-xs">{c.partner}</td>
                    <td className="text-xs text-vfes-dark/70">{tt(c.use)}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.state === 'live' ? 'bg-emerald-100 text-emerald-700' : c.state === 'analysis-running' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(c.state)}
                      </span>
                    </td>
                    <td className="text-xs text-vfes-dark/70">{c.shared_kpis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/clean-rooms" className="font-semibold text-vfes-dark hover:underline">{tt('Open Clean Rooms →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ OUTBOUND ══════════════════════════════════════════════ */}
      {tab === 'outbound' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live listings')}    value="4"      delta={tt('1 draft pending')}   trend="up"   icon={ArrowUpCircle} accent />
          <KpiCard label={tt('Total MRR')}         value="BSD 60K"   delta="+BSD 4K MoM"               trend="up"   icon={DollarSign}   />
          <KpiCard label={tt('Total consumers')}   value="207"    delta="+7 MoM"                  trend="up"   icon={Users}        />
          <KpiCard label={tt('Secure shares')}     value="4"      delta={tt('E2E encrypted')}     trend="flat" icon={Lock}         />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'paid', 'free', 'direct'].map(f => (
            <button key={f} onClick={() => setListingFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${listingFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('Outbound listings & shares we publish')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Listing')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('Consumers')}</th>
                  <th>{tt('Regions')}</th>
                  <th className="text-right">{tt('MRR')}</th>
                  <th>{tt('SLA')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutbound.map(o => (
                  <tr key={o.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-semibold flex items-center gap-1.5">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {o.name}
                    </td>
                    <td className="text-xs">{o.type}</td>
                    <td className="text-right font-mono">{o.consumers}</td>
                    <td className="text-xs">{o.regions}</td>
                    <td className="text-right font-mono text-xs">{o.mrrFmt}</td>
                    <td className="text-[11px] text-vfes-dark/60">{o.sla}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${o.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/data-products" className="font-semibold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/data-contracts" className="font-semibold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Marketplace downloads Q1 vs Q2 by listing')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={MARKETPLACE_DL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="listing" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="q1" name={tt('Q1 downloads')} fill={SLATE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="q2" name={tt('Q2 downloads')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Listing performance — views → trials → converts')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Listing')}</th>
                    <th className="text-right">{tt('Views')}</th>
                    <th className="text-right">{tt('Trials')}</th>
                    <th className="text-right">{tt('Converts')}</th>
                    <th className="text-right">{tt('CVR %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {LISTING_PERF.map(l => (
                    <tr key={l.listing} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs font-semibold">{l.listing}</td>
                      <td className="text-right font-mono">{l.views}</td>
                      <td className="text-right font-mono">{l.trials}</td>
                      <td className="text-right font-mono">{l.converts}</td>
                      <td className={`text-right font-bold ${l.cvr >= 25 ? 'text-emerald-600' : l.cvr >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{l.cvr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Catalog →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Reader accounts — viewer-only access control')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Account')}</th>
                    <th>{tt('Created')}</th>
                    <th className="text-right">{tt('Tables')}</th>
                    <th className="text-right">{tt('Refreshes/mo')}</th>
                    <th>{tt('Cost')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {READER_ACCOUNTS.map(r => (
                    <tr key={r.account} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-semibold">{r.account}</td>
                      <td className="text-xs text-vfes-dark/70">{r.created}</td>
                      <td className="text-right font-mono">{r.tables}</td>
                      <td className="text-right font-mono">{r.refreshes}</td>
                      <td className="text-xs font-mono">{r.cost}</td>
                      <td>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          {tt(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/sharing" className="font-semibold text-vfes-dark hover:underline">{tt('Sharing Overview →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ INBOUND ═══════════════════════════════════════════════ */}
      {tab === 'inbound' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Inbound shares')}     value="6"          delta={tt('4 Marketplace · 2 direct')} trend="flat" icon={ArrowDownCircle} accent />
          <KpiCard label={tt('Total tables')}        value="56"         delta="+4 QoQ"                          trend="up"   icon={Database}        />
          <KpiCard label={tt('Monthly cost')}        value="BSD 5.2K"      delta="+BSD 0.2K MoM"                      trend="down" icon={DollarSign}      />
          <KpiCard label={tt('Freshness SLA')}       value="99.8%"      delta={tt('all auto-refresh active')}   trend="up"   icon={Activity}        />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', 'US', 'Global'].map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${regionFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <Panel title={tt('Inbound — Marketplace & direct shares we consume')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Database')}</th>
                  <th>{tt('Provider')}</th>
                  <th className="text-right">{tt('Tables')}</th>
                  <th className="text-right">{tt('Size')}</th>
                  <th>{tt('Cost')}</th>
                  <th>{tt('Refresh')}</th>
                  <th>{tt('Use')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInbound.map(i => (
                  <tr key={i.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-semibold flex items-center gap-1.5">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-violet-500 shrink-0" /> {i.name}
                    </td>
                    <td className="text-xs">{i.provider}</td>
                    <td className="text-right font-mono">{i.tables}</td>
                    <td className="text-right font-mono text-xs">{i.size}</td>
                    <td className="font-mono text-xs">{i.cost}</td>
                    <td className="text-[11px] text-vfes-dark/60">{i.auto_refresh}</td>
                    <td className="text-xs text-vfes-dark/70">{i.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/catalog" className="font-semibold text-vfes-dark hover:underline">{tt('Open Catalog →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/iceberg" className="font-semibold text-vfes-dark hover:underline">{tt('Iceberg →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Inbound cost trend (BSD K/month)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={INBOUND_COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="cost" name={tt('Cost BSD K')} stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} />
                  <ReferenceLine y={6} stroke={AMBER} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed line = BSD 6K monthly budget threshold')}</div>
          </Panel>

          <Panel title={tt('Mobile & RAN data shares — Island Towers (demo) · MVNOs · IoT')}>
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Share')}</th>
                    <th>{tt('Dir')}</th>
                    <th>{tt('Records')}</th>
                    <th>{tt('Refresh')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOBILE_SHARES.map(s => (
                    <tr key={s.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-1.5 font-mono text-xs font-semibold">{s.name}</td>
                      <td>
                        <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded inline-flex items-center gap-1 ${s.direction === 'Outbound' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {s.direction === 'Outbound' ? <ArrowUpCircle className="w-2.5 h-2.5" /> : <ArrowDownCircle className="w-2.5 h-2.5" />}{tt(s.direction)}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{s.records}</td>
                      <td className="font-mono text-[10px] text-vfes-dark/65">{tt(s.refresh)}</td>
                      <td>
                        <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${s.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {tt(s.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/company-360" className="font-semibold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ MARKETPLACE ═══════════════════════════════════════════ */}
      {tab === 'marketplace' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Listings scenario')} value="5"      delta={tt('4 live · 1 draft')}       trend="up"   icon={Globe2}       accent />
          <KpiCard label={tt('Marketplace MRR')}    value="BSD 60K"   delta="+38% YoY"                     trend="up"   icon={DollarSign}  />
          <KpiCard label={tt('Free listings DL')}   value="184"    delta={tt('ESG open data')}           trend="up"   icon={ArrowDownCircle} />
          <KpiCard label={tt('Trial → paid CVR')}   value="26.4%"  delta="+2.1 pp QoQ"                  trend="up"   icon={TrendingUp}  />
        </div>

        <Panel title={tt('Data products catalogue — all data products')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Product')}</th>
                  <th>{tt('Category')}</th>
                  <th className="text-right">{tt('Consumers')}</th>
                  <th className="text-right">{tt('MRR')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map(d => (
                  <tr key={d.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(d.product)}</td>
                    <td className="text-xs">{tt(d.category)}</td>
                    <td className="text-right font-mono">{d.consumers}</td>
                    <td className="text-right font-mono text-xs">{d.mrr}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.status === 'live' ? 'bg-emerald-100 text-emerald-700' : d.status === 'beta' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(d.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/data-products" className="font-semibold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/apps" className="font-semibold text-vfes-dark hover:underline">{tt('Apps →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Consumer regions — where our data consumers are')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONSUMER_REGIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="n" name={tt('Consumers')} radius={[4, 4, 0, 0]}>
                    {CONSUMER_REGIONS.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE][i % 6]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Marketing →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Revenue forecast — MRR actual & 6-month projection (BSD K)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={REVENUE_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="mrr"   name={tt('Actual MRR')}    fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="fcast" name={tt('Forecast')} stroke={GREEN} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Forecast projects BSD 85K MRR by Dec — demographic listing launch is the key swing factor')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CONSUMERS ═════════════════════════════════════════════ */}
      {tab === 'consumers' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total consumers')}  value="207"   delta="+7 MoM"                    trend="up"   icon={Users}       accent />
          <KpiCard label={tt('Paid consumers')}   value="23"    delta="+1 MoM"                    trend="up"   icon={DollarSign} />
          <KpiCard label={tt('Free / open data')} value="184"   delta={tt('ESG listing')}         trend="up"   icon={Globe2}     />
          <KpiCard label={tt('Churn risk')}        value="2"     delta={tt('model-flagged')}       trend="down" icon={AlertTriangle} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['consumers', 'mrr'] as const).map(k => (
            <button key={k} onClick={() => setConsumerSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${consumerSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'consumers' ? tt('Consumers') : tt('Name')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Consumer growth by listing (MoM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={CONSUMER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="total" name={tt('Total')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="paid"  name={tt('Paid')}  stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Product consumer snapshot')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Product')}</th>
                    <th className="text-right">{tt('Consumers')}</th>
                    <th className="text-right">{tt('MRR')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map(d => (
                    <tr key={d.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 text-xs font-semibold">{tt(d.product)}</td>
                      <td className="text-right font-mono">{d.consumers}</td>
                      <td className="text-right font-mono text-xs">{d.mrr}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === 'live' ? 'bg-emerald-100 text-emerald-700' : d.status === 'beta' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tt(d.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/caio" className="font-semibold text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/cdo" className="font-semibold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Consumer region distribution — by Snowflake account geography')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={CONSUMER_REGIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="n" name={tt('Consumers')} radius={[4, 4, 0, 0]}>
                  {CONSUMER_REGIONS.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE][i % 6]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/marketing" className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/company-360" className="font-semibold text-vfes-dark hover:underline">{tt('Company 360 →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ MONETIZATION ══════════════════════════════════════════ */}
      {tab === 'monetization' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MRR')}              value="BSD 60K"  delta="+38% YoY"                       trend="up"   icon={DollarSign}  accent />
          <KpiCard label={tt('ARR run-rate')}     value="BSD 720K" delta={tt('B2B + Marketplace')}        trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Forecast Dec MRR')} value="BSD 85K"  delta={tt('+BSD 25K vs current')}        trend="up"   icon={Activity}   />
          <KpiCard label={tt('Revenue leakage')}  value="0"     delta={tt('all shares metered')}      trend="flat" icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MRR actual vs target trend (BSD K)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={MRR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mrr"    name={tt('Actual')} stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={GREEN} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/cost" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cost →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Revenue by share type — breakdown (BSD K YTD)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={REVENUE_BY_TYPE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="BSD K" />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rev" name={tt('Revenue BSD K')} radius={[0, 4, 4, 0]}>
                    {REVENUE_BY_TYPE.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-3 text-[10px]">
              <Link to="/portal/b2b" className="font-semibold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Revenue forecast — 12-month projection (BSD K MRR)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={REVENUE_FORECAST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar  dataKey="mrr"   name={tt('Actual MRR')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="fcast" name={tt('Forecast')} stroke={GREEN} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <ReferenceLine x="Jun" stroke={SLATE} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Forecast assumes CBL_DEMOGRAPHIC_LISTING launch by August. Vertical line = today.')}</div>
        </Panel>
      </>)}

      {/* ══════════════ GOVERNANCE ════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Governance checks')}  value="6/6"   delta={tt('5 pass · 1 watch')}    trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('PII egress')}          value="0"     delta={tt('all shares aggregate')} trend="flat" icon={Lock}       />
          <KpiCard label={tt('DPA residency')}      value="Pass"  delta={tt('all data in approved regions')}    trend="up"   icon={Globe2}     />
          <KpiCard label={tt('DPO sign-offs')}       value="4/5"   delta={tt('1 pending — demo listing')} trend="down" icon={Users} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'pass', 'watch'] as const).map(f => (
            <button key={f} onClick={() => setGovFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${govFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('Data governance checks — sharing policy compliance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Check')}</th>
                  <th>{tt('Result')}</th>
                  <th>{tt('Last run')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredGov.map(g => (
                  <tr key={g.check} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(g.check)}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${g.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(g.result)}
                      </span>
                    </td>
                    <td className="text-xs font-mono text-vfes-dark/70">{g.last}</td>
                    <td className="text-xs text-vfes-dark/70">{tt(g.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/data-contracts" className="font-semibold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cdo" className="font-semibold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Secure share encryption — status')}>
            <div className="p-4 space-y-3">
              {[
                { label: tt('CBL_NETWORK_INTEL_LISTING'), enc: 'TLS 1.3 · AES-256', status: 'Pass' },
                { label: tt('CBL_AGGREGATED_FOOTFALL'),   enc: 'TLS 1.3 · AES-256', status: 'Pass' },
                { label: tt('CBL_PRIVATE_ISLAND_BANK'),     enc: 'Tri-Secret Secure',  status: 'Pass' },
                { label: tt('CBL_OPEN_DATA_ESG'),         enc: 'TLS 1.3',            status: 'Pass' },
              ].map(e => (
                <div key={e.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-mono font-semibold">{e.label}</span>
                  <span className="text-xs text-vfes-dark/60">{e.enc}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(e.status)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[10px]">
              <Link to="/portal/catalog" className="font-semibold text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Inbound cost vs governance budget (BSD K/mo)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={INBOUND_COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD K" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="cost" name={tt('Inbound cost')} stroke={NAVY} fill={NAVY} fillOpacity={0.2} />
                  <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" label={{ value: tt('Budget'), position: 'right', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ ICEBERG ═══════════════════════════════════════════════ */}
      {tab === 'iceberg' && (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Iceberg shares')}    value="4"       delta={tt('via external volume')}   trend="up"   icon={Database}    accent />
          <KpiCard label={tt('Total shared size')} value="71.6 GB" delta="+12 GB QoQ"                  trend="up"   icon={Zap}        />
          <KpiCard label={tt('External consumers')}value="24"      delta="+4 QoQ"                      trend="up"   icon={Users}      />
          <KpiCard label={tt('Freshness SLA')}     value="99.9%"   delta={tt('all tables refreshing')} trend="up"   icon={Activity}   />
        </div>

        <Panel title={tt('Iceberg tables shared via Snowflake open catalog')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Table')}</th>
                  <th className="text-right">{tt('Consumers')}</th>
                  <th className="text-right">{tt('Size')}</th>
                  <th>{tt('Refresh')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {ICEBERG_SHARES.map(i => (
                  <tr key={i.table} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-semibold">{i.table}</td>
                    <td className="text-right font-mono">{i.consumers}</td>
                    <td className="text-right font-mono text-xs">{i.size}</td>
                    <td className="text-xs text-vfes-dark/70">{i.refresh}</td>
                    <td>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(i.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-[10px]">
            <Link to="/portal/iceberg" className="font-semibold text-vfes-dark hover:underline">{tt('Open Iceberg →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/catalog" className="font-semibold text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/data-products" className="font-semibold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Iceberg share consumer growth')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={CONSUMER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="total" name={tt('Consumers')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Iceberg vs classic share — downloads QoQ')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SHARE_VOL_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="out" name={tt('Classic share')} fill={SLATE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inb" name={tt('Iceberg table')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Horizon →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-[#222128] mb-1">{tt('Snowflake Iceberg — open sharing')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Share Iceberg tables to any cloud storage consumer without data movement. Snowflake manages the Iceberg catalog, consumers query with their own engine.')}
            </div>
          </div>
          <Link to="/portal/iceberg" className="bg-[#FF4438] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#11567F] flex items-center gap-2 shrink-0">
            <Database className="w-4 h-4" />{tt('Open Iceberg →')}
          </Link>
        </div>
      </>)}
    </div>
  )
}
