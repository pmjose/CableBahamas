import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { MOBILE_DATA_PRODUCTS } from './_mobile_data'
import {
  Sparkles, Users, Smartphone, ShieldCheck, TrendingUp, Activity,
  FileCheck, AlertTriangle, Layers, DollarSign, Star, Clock, Gauge,
  Database, CheckCircle, GitBranch, BarChart2,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const PRODUCTS = [
  { name: 'Customer 360',    domain: 'Customer',     owner: 'CDO',     steward: "Emma Rolle",      sla: '03:30 UTC',   consumers: 24, tier: 'Gold',     slo: '99.9%', cost_mtd: 'BSD 4,820', value: 'BSD 18M annual revenue uplift',          certified: true,  health: 'healthy' },
  { name: 'Product 360',     domain: 'Product',      owner: 'CPO',     steward: 'Niels Bodart',       sla: '03:30 UTC',   consumers: 14, tier: 'Gold',     slo: '99.5%', cost_mtd: 'BSD 2,140', value: 'BSD 6.4M annual margin',                 certified: true,  health: 'healthy' },
  { name: 'B2B 360',         domain: 'B2B',          owner: 'CCO B2B', steward: 'B2B Sales Ops',    sla: '04:00 UTC',   consumers: 18, tier: 'Gold',     slo: '99.5%', cost_mtd: 'BSD 1,840', value: 'BSD 40.2M B2B pipeline',                 certified: true,  health: 'healthy' },
  { name: 'People 360',      domain: 'People',       owner: 'CHRO',    steward: 'People Ops',        sla: '05:00 UTC',   consumers: 8,  tier: 'Silver',   slo: '99%',   cost_mtd: 'BSD 420',   value: 'attrition -1.2pp · BSD 420K saved',      certified: true,  health: 'healthy' },
  { name: 'Risk / ESG 360',  domain: 'Risk',         owner: 'CRO',     steward: 'Risk Ops',          sla: '04:30 UTC',   consumers: 12, tier: 'Silver',   slo: '99%',   cost_mtd: 'BSD 640',   value: 'compliance · BSD 0 fines YTD',           certified: false, health: 'watch'   },
  { name: 'Executive 360',   domain: 'Executive',    owner: 'CFO',     steward: 'CFO Office',        sla: '06:00 UTC',   consumers: 6,  tier: 'Platinum', slo: '99.9%', cost_mtd: 'BSD 840',   value: 'board pack speed · -3 days close',    certified: true,  health: 'healthy' },
  { name: 'Network KPI',     domain: 'Network',      owner: 'CTO',     steward: 'Network ops',       sla: 'live · 5 min',consumers: 22, tier: 'Gold',     slo: '99.5%', cost_mtd: 'BSD 3,140', value: 'MTTR -42% · BSD 1.2M outage avoidance', certified: true,  health: 'healthy' },
  { name: 'Finance Ledger',  domain: 'Finance',      owner: 'CFO',     steward: 'Thomas Knowles',       sla: '07:00 UTC',   consumers: 12, tier: 'Gold',     slo: '99.9%', cost_mtd: 'BSD 1,240', value: 'audit-ready close',                   certified: true,  health: 'healthy' },
  { name: 'Procurement 360', domain: 'Procurement',  owner: 'COO',     steward: 'Procurement',       sla: '06:00 UTC',   consumers: 4,  tier: 'Silver',   slo: '99%',   cost_mtd: 'BSD 220',   value: 'tail-spend savings BSD 840K',            certified: false, health: 'watch'   },
]

const TIER_COLORS: Record<string, string> = {
  Platinum: 'bg-violet-100 text-violet-700 border-violet-300',
  Gold:     'bg-amber-100 text-amber-700 border-amber-300',
  Silver:   'bg-zinc-100 text-zinc-700 border-zinc-300',
}

const ROADMAP = [
  { p: 'CX 360',                state: 'design',    eta: 'Q1-2026', owner: 'CX',        invest: 'BSD 840K',  consumers_est: 12 },
  { p: 'Marketing Attribution', state: 'build',     eta: 'Q1-2026', owner: 'Marketing', invest: 'BSD 1.2M',  consumers_est: 8  },
  { p: 'Field-ops 360',         state: 'pilot',     eta: 'Q1-2026', owner: 'Field ops', invest: 'BSD 620K',  consumers_est: 6  },
  { p: 'Wholesale Settlement',  state: 'design',    eta: 'Q2-2026', owner: 'B2B',       invest: 'BSD 480K',  consumers_est: 4  },
  { p: 'Sustainability 360',    state: 'discovery', eta: 'Q3-2026', owner: 'CRO',       invest: 'BSD 380K',  consumers_est: 8  },
]

const HEALTH_TREND = [
  { m: 'Jun', slo: 99.6, freshness: 99.8, incidents: 1 },
  { m: 'Jul', slo: 99.7, freshness: 99.9, incidents: 0 },
  { m: 'Aug', slo: 99.4, freshness: 99.7, incidents: 2 },
  { m: 'Sep', slo: 99.8, freshness: 99.9, incidents: 0 },
  { m: 'Oct', slo: 99.3, freshness: 99.6, incidents: 3 },
  { m: 'Nov', slo: 99.4, freshness: 99.8, incidents: 1 },
]

const COST_TREND = [
  { m: 'Jun', compute: 8400,  storage: 2100, ingestion: 1200, total: 11700 },
  { m: 'Jul', compute: 8800,  storage: 2200, ingestion: 1240, total: 12240 },
  { m: 'Aug', compute: 9200,  storage: 2300, ingestion: 1280, total: 12780 },
  { m: 'Sep', compute: 9600,  storage: 2350, ingestion: 1300, total: 13250 },
  { m: 'Oct', compute: 10100, storage: 2400, ingestion: 1320, total: 13820 },
  { m: 'Nov', compute: 10400, storage: 2450, ingestion: 1340, total: 14190 },
]

const DOMAIN_CONSUMERS = [
  { domain: 'Customer',    consumers: 24, products: 1, cost: 4820 },
  { domain: 'Network',     consumers: 22, products: 1, cost: 3140 },
  { domain: 'B2B',         consumers: 18, products: 1, cost: 1840 },
  { domain: 'Product',     consumers: 14, products: 1, cost: 2140 },
  { domain: 'Finance',     consumers: 12, products: 1, cost: 1240 },
  { domain: 'Risk',        consumers: 12, products: 1, cost: 640  },
  { domain: 'People',      consumers: 8,  products: 1, cost: 420  },
  { domain: 'Procurement', consumers: 4,  products: 1, cost: 220  },
]

const CONTRACTS = [
  { product: 'Customer 360',   consumer: 'CDO Analytics',   sla: '99.9%', freshness: '<4h',    signed: '2024-06-15', status: 'active',  breakClause: 'CDO → CDO team'    },
  { product: 'Customer 360',   consumer: 'CX Team',          sla: '99.9%', freshness: '<4h',    signed: '2024-07-20', status: 'active',  breakClause: 'CDO → CX'          },
  { product: 'Network KPI',    consumer: 'NOC Operations',   sla: '99.5%', freshness: '<10 min',signed: '2024-08-01', status: 'active',  breakClause: 'CTO → NOC'         },
  { product: 'Finance Ledger', consumer: 'CFO Reporting',    sla: '99.9%', freshness: '<8h',    signed: '2024-09-10', status: 'active',  breakClause: 'CFO → CFO team'    },
  { product: 'B2B 360',        consumer: 'B2B Sales',        sla: '99.5%', freshness: '<6h',    signed: '2024-10-15', status: 'active',  breakClause: 'CCO → B2B Sales'   },
  { product: 'Risk / ESG 360', consumer: 'Compliance',       sla: '99%',   freshness: '<24h',   signed: '2024-11-01', status: 'pending', breakClause: 'CRO → Compliance'  },
]

const CONSUMERS_LIST = [
  { role: 'CDO_ANALYTICS',     team: 'CDO',       products: 3, queries_7d: 482, last_access: '12 min ago' },
  { role: 'BI_POWERBI_SVC',    team: 'IT/BI',     products: 4, queries_7d: 396, last_access: '8 min ago'  },
  { role: 'SC_AGENT_CHURN',    team: 'AI/Agents', products: 2, queries_7d: 312, last_access: '4 min ago'  },
  { role: 'DATA_SCIENCE',      team: 'CDO',       products: 5, queries_7d: 214, last_access: '42 min ago' },
  { role: 'NOC_OPERATIONS',    team: 'Network',   products: 1, queries_7d: 188, last_access: '2 min ago'  },
  { role: 'EXEC_VIEWER',       team: 'Executive', products: 2, queries_7d: 18,  last_access: '2h ago'     },
  { role: 'FINANCE_REPORTING', team: 'Finance',   products: 2, queries_7d: 84,  last_access: '22 min ago' },
  { role: 'B2B_SALES_OPS',     team: 'B2B',       products: 1, queries_7d: 124, last_access: '18 min ago' },
]

const CONSUMER_GROWTH = [
  { m: 'Jun', consumers: 88,  queries: 12400 },
  { m: 'Jul', consumers: 96,  queries: 13800 },
  { m: 'Aug', consumers: 102, queries: 14200 },
  { m: 'Sep', consumers: 108, queries: 15600 },
  { m: 'Oct', consumers: 114, queries: 17200 },
  { m: 'Nov', consumers: 120, queries: 18400 },
]

const INVEST_ALLOC = [
  { name: 'Customer', value: 32, color: BLUE   },
  { name: 'Network',  value: 21, color: NAVY   },
  { name: 'B2B',      value: 12, color: PURPLE },
  { name: 'Finance',  value: 8,  color: AMBER  },
  { name: 'Other',    value: 27, color: SLATE  },
]

const ADOPTION_SCORE = [
  { domain: 'Customer',    score: 92, potential: 8  },
  { domain: 'Network',     score: 88, potential: 12 },
  { domain: 'B2B',         score: 84, potential: 16 },
  { domain: 'Finance',     score: 78, potential: 22 },
  { domain: 'People',      score: 72, potential: 28 },
  { domain: 'Risk',        score: 68, potential: 32 },
  { domain: 'Procurement', score: 54, potential: 46 },
]

type TabId = 'overview' | 'catalog' | 'health' | 'contracts' | 'consumers' | 'costs' | 'certification' | 'roadmap'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',      label: 'Overview',      icon: Gauge      },
  { id: 'catalog',       label: 'Catalog',        icon: Database   },
  { id: 'health',        label: 'Health & SLOs',  icon: Activity   },
  { id: 'contracts',     label: 'Contracts',      icon: FileCheck  },
  { id: 'consumers',     label: 'Consumers',      icon: Users      },
  { id: 'costs',         label: 'Cost to Serve',  icon: DollarSign },
  { id: 'certification', label: 'Certification',  icon: Star       },
  { id: 'roadmap',       label: 'Roadmap',         icon: GitBranch  },
]

export default function DataProductsPage() {
  const [tab, setTab]                         = useState<TabId>('overview')
  const [domainFilter, setDomainFilter]       = useState<string>('All')
  const [tierFilter, setTierFilter]           = useState<string>('All')
  const [sortKey, setSortKey]                 = useState<'consumers' | 'cost' | 'name'>('consumers')
  const [alertDismissed, setAlertDismissed]   = useState(false)
  const [liveTime, setLiveTime]               = useState('')
  const [certFilter, setCertFilter]           = useState<'all' | 'certified' | 'pilot'>('all')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const filteredProducts = useMemo(
    () => PRODUCTS.filter(p =>
      (domainFilter === 'All' || p.domain === domainFilter) &&
      (tierFilter   === 'All' || p.tier   === tierFilter)
    ),
    [domainFilter, tierFilter],
  )

  const sortedProducts = useMemo(
    () => [...filteredProducts].sort((a, b) =>
      sortKey === 'consumers' ? b.consumers - a.consumers :
      sortKey === 'cost'      ? parseInt(b.cost_mtd.replace(/\D/g, '')) - parseInt(a.cost_mtd.replace(/\D/g, '')) :
      a.name.localeCompare(b.name)
    ),
    [filteredProducts, sortKey],
  )

  const certFilteredProducts = useMemo(
    () => PRODUCTS.filter(p =>
      certFilter === 'all' ? true : certFilter === 'certified' ? p.certified : !p.certified
    ),
    [certFilter],
  )

  const totalConsumers = PRODUCTS.reduce((s, p) => s + p.consumers, 0)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Data Products')}
        subtitle={tt('Treat data as a product · owners · SLOs · consumers · cost-to-serve · business value')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/data-contracts" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> {tt('Contracts')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Data product intelligence"
        models={[
          { name: 'Product Health Model', metric: 'F1 0.94',   sub: 'SLO breach prediction 7d ahead'    },
          { name: 'Adoption Predictor',   metric: '+18 users',  sub: 'consumer growth 30d forecast'       },
          { name: 'Cost Optimiser',       metric: '-12% spend', sub: 'Snowflake compute right-sizing'    },
        ]}
        agentLabel="Run Data Product Analyst"
        agentRunningLabel="Analysing…"
        agentSteps={[
          'Scanning all 9 products for SLO drift and freshness gaps',
          'Identifying high-value consumer segments and adoption blockers',
          'Modelling compute cost vs query volume across domains',
          'Drafting certification candidates and data contract updates',
        ]}
        agentBlurb="One Snowflake-native data product layer means every SLO, consumer query, and cost token lives in the same lake — the model sees health, demand, and cost simultaneously."
        decision={{
          title: 'Certify Risk/ESG 360 and Procurement 360 — unblock 16 consumers',
          detail: 'Two uncertified products are blocking 16 consumer onboardings. Fast-track certification by attaching data contracts and wiring DMF freshness checks. Once certified these unlock BSD 2.1M of identified analytics value across CRO and COO domains.',
          impact: 'unblocks 16 consumers · BSD 2.1M analytics value',
          risk: 'Steward sign-off needed — CRO and COO offices',
          linkTo: '#/portal/data-products',
          linkLabel: 'Open Data Products',
        }}
        chart={{
          kind: 'area',
          title: 'Consumer growth trend — cumulative consumers (6 months)',
          xKey: 'm',
          data: CONSUMER_GROWTH,
          series: [{ key: 'consumers', name: 'Consumers', color: BLUE }],
          note: 'Consumer base grew from 88 in January to 120 in June — 36% YTD. Target 140 by Q4.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Risk/ESG 360 and Procurement 360 not yet certified · 3 SLO breaches in Oct')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Certification unblocks 16 consumers. May incidents were caused by upstream CMTS feed latency — mitigation now applied.')}
              </div>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
              {tt('Dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Live products')}      value="9"                    delta={tt('+2 YTD')}             trend="up"   icon={Sparkles}   accent />
          <KpiCard label={tt('Total consumers')}     value={String(totalConsumers)} delta="+18 YTD"               trend="up"   icon={Users}       />
          <KpiCard label={tt('Avg SLO met 30d')}     value="99.4%"                delta={tt('vs 99.5% target')}   trend="down" icon={ShieldCheck} />
          <KpiCard label={tt('Total cost MTD')}       value="BSD 15.3K"               delta="+4.2% MoM"              trend="down" icon={Layers}      />
          <KpiCard label={tt('Value tracked')}        value="BSD 72M / yr"            delta={tt('across 8 domains')}  trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Certified products')}   value="7 / 9"                delta={tt('2 pending cert')}   trend="up"   icon={Star}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Consumer distribution by domain')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={DOMAIN_CONSUMERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="consumers" name={tt('Consumers')} fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Monthly cost trend by component (BSD )')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="compute"   name={tt('Compute')}   stackId="1" stroke={BLUE}  fill={BLUE}  fillOpacity={0.7} />
                  <Area type="monotone" dataKey="storage"   name={tt('Storage')}   stackId="1" stroke={NAVY}  fill={NAVY}  fillOpacity={0.7} />
                  <Area type="monotone" dataKey="ingestion" name={tt('Ingestion')} stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Quick navigation')}>
            <div className="space-y-2">
              <Link to="/portal/data-quality" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc] group">
                <span className="text-sm font-semibold">{tt('Data Quality')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/lineage" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc] group">
                <span className="text-sm font-semibold">{tt('Lineage & Impact')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/semantic-views" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc] group">
                <span className="text-sm font-semibold">{tt('Semantic Views')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/catalog" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc] group">
                <span className="text-sm font-semibold">{tt('Data Catalog')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/observability" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc] group">
                <span className="text-sm font-semibold">{tt('Observability')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Cost vs consumers — by domain')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <ComposedChart data={DOMAIN_CONSUMERS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="domain" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="BSD " />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar   yAxisId="l" dataKey="consumers" name={tt('Consumers')}     fill={BLUE}  radius={[4, 4, 0, 0]} />
                    <Line  yAxisId="r" type="monotone" dataKey="cost" name={tt('Cost MTD (BSD )')} stroke={AMBER} strokeWidth={2.4} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4 mt-2 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-[#222128] mb-1">{tt('Snowflake Data Product Marketplace')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('9 live products · 120 consumers · BSD 72M tracked value · governed by Horizon · certified via DMF + data contracts.')}
            </div>
          </div>
          <Link to="/portal/horizon" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4" />{tt('Open Governance →')}
          </Link>
        </div>
      </>)}

      {/* ══════════════ CATALOG ══════════════════════════════════════════════ */}
      {tab === 'catalog' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Domain:')}</span>
          {['All', 'Customer', 'Network', 'B2B', 'Finance', 'People', 'Risk'].map(d => (
            <button key={d} onClick={() => setDomainFilter(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${domainFilter === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {d}
            </button>
          ))}
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 ml-4">{tt('Tier:')}</span>
          {['All', 'Platinum', 'Gold', 'Silver'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${tierFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {t}
            </button>
          ))}
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 ml-4">{tt('Sort:')}</span>
          {(['consumers', 'cost', 'name'] as const).map(k => (
            <button key={k} onClick={() => setSortKey(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sortKey === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(k)}
            </button>
          ))}
        </div>

        <Panel title={`${tt('Catalog of data products')} — ${sortedProducts.length} ${tt('results')}`}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Product')}</th>
                <th className="text-left">{tt('Domain')}</th>
                <th className="text-left">{tt('Owner')}</th>
                <th className="text-left">{tt('Steward')}</th>
                <th className="text-left">{tt('SLA')}</th>
                <th className="text-right">{tt('Consumers')}</th>
                <th className="text-left">{tt('Tier')}</th>
                <th className="text-left">{tt('SLO')}</th>
                <th className="text-left">{tt('Cost MTD')}</th>
                <th className="text-left">{tt('Cert')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => (
                <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-vfes-dark" /> {tt(p.name)}
                  </td>
                  <td className="text-[11px]">{p.domain}</td>
                  <td className="text-[11px]">{tt(p.owner)}</td>
                  <td className="text-[11px]">{p.steward}</td>
                  <td className="font-mono text-[10px]">{p.sla}</td>
                  <td className="text-right font-mono">{p.consumers}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${TIER_COLORS[p.tier]}`}>
                      {p.tier}
                    </span>
                  </td>
                  <td className="font-mono text-[10px]">{p.slo}</td>
                  <td className="font-mono text-[10px]">{p.cost_mtd}</td>
                  <td>
                    {p.certified
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Mobile / RAN data products')} action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />{tt('7 mobile data products')}
            </span>}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('Data product')}</th>
                  <th>{tt('Owner')}</th>
                  <th>{tt('Consumers')}</th>
                  <th>{tt('Freshness')}</th>
                  <th>{tt('SLO')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_DATA_PRODUCTS.map((p) => (
                  <tr key={p.name} className="border-t border-black/5">
                    <td className="py-2 font-semibold text-xs">
                      {tt(p.name)}
                      <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(p.description)}</div>
                    </td>
                    <td className="text-[11px]">{tt(p.owner)}</td>
                    <td className="font-mono text-xs">{p.consumers}</td>
                    <td className="font-mono text-xs">{tt(p.freshness)}</td>
                    <td className="font-mono text-xs font-bold">{p.slo}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {tt(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-vfes-dark/65 mt-3">
              {tt('Mobile Customer 360 has 124 consumers — most-used mobile data product. MNP Win-back Signal is the lowest-latency at 15 min freshness with 99.9% SLO.')}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ HEALTH & SLOs ═════════════════════════════════════════ */}
      {tab === 'health' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SLO compliance 30d')} value="99.4%"  delta={tt('vs 99.5% target')} trend="down" icon={ShieldCheck}  accent />
          <KpiCard label={tt('Incidents MTD')}       value="1"      delta={tt('vs 3 last month')}  trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('Freshness met')}        value="99.8%"  delta="+0.2 pp MoM"            trend="up"   icon={Clock}        />
          <KpiCard label={tt('Products healthy')}     value="7 / 9"  delta={tt('2 in watch')}       trend="down" icon={Activity}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SLO compliance trend — 6 months (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={HEALTH_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[98.5, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="slo"       name={tt('SLO')}       stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="freshness" name={tt('Freshness')} stroke={GREEN} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={99.5} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Incidents per month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={HEALTH_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="incidents" name={tt('Incidents')} fill={AMBER} radius={[4, 4, 0, 0]}>
                    {HEALTH_TREND.map((_, i) => <Cell key={i} fill={HEALTH_TREND[i].incidents >= 3 ? '#ef4444' : HEALTH_TREND[i].incidents >= 1 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Product health scorecard')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Product')}</th>
                <th className="text-left">{tt('SLO target')}</th>
                <th className="text-left">{tt('SLO met 30d')}</th>
                <th className="text-left">{tt('Last refresh')}</th>
                <th className="text-right">{tt('Incidents 30d')}</th>
                <th className="text-left">{tt('Health')}</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold">{tt(p.name)}</td>
                  <td className="font-mono text-[10px]">{p.slo}</td>
                  <td className="font-mono text-[10px] text-emerald-700">
                    {parseFloat(p.slo) >= 99.9 ? '100%' : parseFloat(p.slo) >= 99.5 ? '99.6%' : '99.1%'}
                  </td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{p.sla}</td>
                  <td className="text-right font-mono text-[10px]">{p.health === 'watch' ? '2' : '0'}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.health === 'healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {tt(p.health)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/data-quality" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Open Data Quality →')}
            </Link>
            <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Open Observability →')}
            </Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CONTRACTS ══════════════════════════════════════════════ */}
      {tab === 'contracts' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active contracts')}  value="5"      delta={tt('+2 YTD')}          trend="up"   icon={FileCheck}   accent />
          <KpiCard label={tt('Pending sign-off')}  value="1"      delta={tt('Risk/ESG 360')}    trend="down" icon={Clock}       />
          <KpiCard label={tt('SLA breaches 30d')}  value="0"      delta={tt('clean month')}     trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Avg SLA target')}    value="99.6%"  delta={tt('weighted avg')}    trend="up"   icon={Activity}    />
        </div>

        <Panel title={tt('Data contracts register')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Product')}</th>
                <th className="text-left">{tt('Consumer')}</th>
                <th className="text-left">{tt('SLA')}</th>
                <th className="text-left">{tt('Freshness')}</th>
                <th className="text-left">{tt('Signed')}</th>
                <th className="text-left">{tt('Break clause')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c) => (
                <tr key={`${c.product}-${c.consumer}`} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold text-xs">{c.product}</td>
                  <td className="text-[11px]">{c.consumer}</td>
                  <td className="font-mono text-[10px]">{c.sla}</td>
                  <td className="font-mono text-[10px]">{c.freshness}</td>
                  <td className="font-mono text-[10px]">{c.signed}</td>
                  <td className="text-[10px] text-vfes-dark/65">{c.breakClause}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {tt(c.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/data-contracts" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Full Contracts registry →')}
            </Link>
            <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Access & RBAC →')}
            </Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('SLA met % by product — 30d')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PRODUCTS.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[98, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey={() => 99.4} name={tt('SLA met %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={99.5} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('SLA target distribution across contracts')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: '99.9%', value: 3 },
                    { name: '99.5%', value: 2 },
                    { name: '99%',   value: 1 },
                  ]} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}
                    label={({ name, value }: { name: string; value: number }) => `${name} (${value})`} labelLine={false}>
                    {[BLUE, GREEN, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CONSUMERS ══════════════════════════════════════════════ */}
      {tab === 'consumers' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total consumers')}  value={String(totalConsumers)} delta="+18 YTD"               trend="up"   icon={Users}      accent />
          <KpiCard label={tt('Active last 7d')}    value="118"                    delta={tt('98% of total')}    trend="up"   icon={Activity}   />
          <KpiCard label={tt('Consumer teams')}    value="8"                      delta={tt('6 domains')}       trend="flat" icon={Layers}     />
          <KpiCard label={tt('Queries 7d')}         value="1,618"                  delta="+12% WoW"              trend="up"   icon={BarChart2}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Consumer growth — cumulative (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={CONSUMER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="consumers" name={tt('Consumers')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Top consumer teams by query volume (7d)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONSUMERS_LIST.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="role" tick={{ fontSize: 8 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="queries_7d" name={tt('Queries 7d')} fill={NAVY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Consumer register — last 7 days')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Role')}</th>
                <th className="text-left">{tt('Team')}</th>
                <th className="text-right">{tt('Products')}</th>
                <th className="text-right">{tt('Queries 7d')}</th>
                <th className="text-left">{tt('Last access')}</th>
              </tr>
            </thead>
            <tbody>
              {CONSUMERS_LIST.map((c) => (
                <tr key={c.role} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-xs font-semibold">{c.role}</td>
                  <td className="text-[11px]">{c.team}</td>
                  <td className="text-right font-mono">{c.products}</td>
                  <td className="text-right font-mono">{c.queries_7d}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{c.last_access}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Manage access & RBAC →')}
            </Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ COST TO SERVE ══════════════════════════════════════════ */}
      {tab === 'costs' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total cost MTD')}      value="BSD 15.3K"     delta="+4.2% MoM"             trend="down" icon={DollarSign}  accent />
          <KpiCard label={tt('Compute share')}        value="68%"        delta={tt('of total spend')}  trend="flat" icon={Gauge}       />
          <KpiCard label={tt('Cost per consumer')}    value="BSD 127/mo"    delta="-3% MoM"               trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Highest-cost product')} value="C360 BSD 4.8K" delta={tt('24 consumers')}   trend="flat" icon={Activity}    />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Monthly cost trend — stacked by component (BSD )')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD " />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="compute"   name={tt('Compute')}   stackId="1" stroke={BLUE}  fill={BLUE}  fillOpacity={0.7} />
                  <Area type="monotone" dataKey="storage"   name={tt('Storage')}   stackId="1" stroke={NAVY}  fill={NAVY}  fillOpacity={0.7} />
                  <Area type="monotone" dataKey="ingestion" name={tt('Ingestion')} stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cost MTD per domain (BSD )')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={DOMAIN_CONSUMERS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="BSD " />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cost" name={tt('Cost MTD (BSD )')} radius={[0, 4, 4, 0]}>
                    {DOMAIN_CONSUMERS.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, PURPLE, AMBER, GREEN, SLATE, '#f43f5e', '#06b6d4'][i % 8]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Panel title={tt('Cost allocation by domain (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={INVEST_ALLOC} dataKey="value" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {INVEST_ALLOC.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Cost management links')}</div>
            <Link to="/portal/cost" className="flex items-center justify-between p-3 rounded-lg border border-black/5 hover:bg-[#fafbfc] group">
              <span className="text-sm font-semibold">{tt('Snowflake Cost & Credits')}</span>
              <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
            </Link>
            <Link to="/portal/environments" className="flex items-center justify-between p-3 rounded-lg border border-black/5 hover:bg-[#fafbfc] group">
              <span className="text-sm font-semibold">{tt('Environments & Warehouses')}</span>
              <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
            </Link>
            <Link to="/portal/data-engineering" className="flex items-center justify-between p-3 rounded-lg border border-black/5 hover:bg-[#fafbfc] group">
              <span className="text-sm font-semibold">{tt('Data Engineering')}</span>
              <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <Panel title={tt('Cost per consumer — by product (BSD  MTD / consumer)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={PRODUCTS.map(p => ({
                  name: p.name.replace(' 360','').replace(' Ledger',''),
                  cpc: Math.round(parseInt(p.cost_mtd.replace(/[BSD ,]/g,'')) / p.consumers),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="BSD " />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v}`} />
                  <Bar dataKey="cpc" name={tt('BSD  / consumer')} fill={PURPLE} radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={150} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('Dashed line = BSD 150 target cost-per-consumer. Procurement 360 is highest at BSD 55/consumer (small audience); Network KPI best value at BSD 143/consumer.')}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CERTIFICATION ══════════════════════════════════════════ */}
      {tab === 'certification' && (<>
        <div className="flex gap-2 mb-4">
          {(['all', 'certified', 'pilot'] as const).map(f => (
            <button key={f} onClick={() => setCertFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${certFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Certified products')}  value="7"  delta={tt('of 9 live products')} trend="up"   icon={CheckCircle}  accent />
          <KpiCard label={tt('Pending certification')} value="2"  delta={tt('Risk + Procurement')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('DMF checks attached')}  value="7"  delta={tt('freshness enforced')} trend="up"   icon={ShieldCheck}  />
          <KpiCard label={tt('Contracts signed')}     value="5"  delta={tt('1 pending')}           trend="up"   icon={FileCheck}    />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Certification status breakdown')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: tt('Certified'),       value: PRODUCTS.filter(p => p.certified).length  },
                    { name: tt('Pilot / pending'), value: PRODUCTS.filter(p => !p.certified).length },
                  ]} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`} labelLine={false}>
                    {[GREEN, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Adoption score by domain (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={ADOPTION_SCORE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="score"     name={tt('Adopted')}    stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="potential" name={tt('Untapped')}   stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={`${tt('Certification register')} — ${certFilteredProducts.length} ${tt('products')}`}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Product')}</th>
                <th className="text-left">{tt('Tier')}</th>
                <th className="text-left">{tt('Steward')}</th>
                <th className="text-left">{tt('SLO')}</th>
                <th className="text-left">{tt('Certified')}</th>
                <th className="text-left">{tt('Notes')}</th>
              </tr>
            </thead>
            <tbody>
              {certFilteredProducts.map((p) => (
                <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold">{tt(p.name)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${TIER_COLORS[p.tier]}`}>
                      {p.tier}
                    </span>
                  </td>
                  <td className="text-[11px]">{p.steward}</td>
                  <td className="font-mono text-[10px]">{p.slo}</td>
                  <td>
                    {p.certified
                      ? <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tt('certified')}</span>
                      : <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{tt('pending')}</span>
                    }
                  </td>
                  <td className="text-[10px] text-vfes-dark/55">
                    {p.certified ? tt('DMF freshness + data contract attached') : tt('Steward sign-off pending')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Open Horizon governance →')}
            </Link>
            <Link to="/portal/cdo" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('CDO dashboard →')}
            </Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ ROADMAP ════════════════════════════════════════════════ */}
      {tab === 'roadmap' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('In build / pilot')} value="3"      delta={tt('of 5 in roadmap')} trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Total investment')} value="BSD 3.5M"  delta={tt('FY2025 budget')}   trend="flat" icon={DollarSign}  />
          <KpiCard label={tt('Est. consumers')}   value="38"     delta={tt('when all live')}    trend="up"   icon={Users}       />
        </div>

        <Panel title={tt('Product roadmap')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Product')}</th>
                <th className="text-left">{tt('State')}</th>
                <th className="text-left">{tt('ETA')}</th>
                <th className="text-left">{tt('Owner')}</th>
                <th className="text-right">{tt('Investment')}</th>
                <th className="text-right">{tt('Consumers est.')}</th>
              </tr>
            </thead>
            <tbody>
              {ROADMAP.map((r) => (
                <tr key={r.p} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold">{r.p}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.state === 'pilot' ? 'bg-amber-100 text-amber-700' : r.state === 'build' ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-700'}`}>
                      {r.state}
                    </span>
                  </td>
                  <td className="font-mono">{r.eta}</td>
                  <td>{tt(r.owner)}</td>
                  <td className="text-right font-mono text-[10px]">{r.invest}</td>
                  <td className="text-right font-mono">{r.consumers_est}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Estimated consumers by roadmap product')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ROADMAP}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="p" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="consumers_est" name={tt('Est. consumers')} fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Roadmap state distribution')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: tt('Design'),    value: 2 },
                    { name: tt('Build'),     value: 1 },
                    { name: tt('Pilot'),     value: 1 },
                    { name: tt('Discovery'), value: 1 },
                  ]} dataKey="value" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {[SLATE, BLUE, AMBER, PURPLE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50">
          <Link to="/portal/agents" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Agents →')}</Link>
          <span>·</span>
          <Link to="/portal/cortex-search" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
          <span>·</span>
          <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Value tracking — business value by live product (BSD  annual)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: tt('Customer 360'),    value: 18000000 },
                  { name: tt('B2B 360'),          value: 40200000 },
                  { name: tt('Network KPI'),      value: 1200000  },
                  { name: tt('Product 360'),      value: 6400000  },
                  { name: tt('Finance Ledger'),   value: 4000000  },
                  { name: tt('People 360'),        value: 420000   },
                  { name: tt('Procurement 360'),   value: 840000   },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `BSD ${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${(v / 1e6).toFixed(1)}M`} />
                  <Bar dataKey="value" name={tt('Annual value (BSD )')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('B2B 360 has the highest business value at BSD 40.2M pipeline. Value is tracked in OKR system and confirmed by domain CFO offices each quarter.')}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Snowflake data product architecture — layers')}>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              {[
                { layer: tt('Sources'), desc: tt('Amdocs · BSS · Kafka · Workday'), color: 'bg-zinc-100 border-zinc-300' },
                { layer: tt('Raw'),     desc: tt('CBL_RAW · 5 schemas · append-only'), color: 'bg-slate-100 border-slate-300' },
                { layer: tt('Core'),    desc: tt('CBL_CORE · dbt · Dynamic Tables'), color: 'bg-violet-100 border-violet-300' },
                { layer: tt('Marts'),   desc: tt('CBL_ANALYTICS · 9 products · SLOs'), color: 'bg-amber-100 border-amber-300' },
                { layer: tt('Serving'), desc: tt('Semantic Views · Agents · BI'), color: 'bg-emerald-100 border-emerald-300' },
              ].map((l) => (
                <div key={l.layer} className={`rounded-lg border p-3 ${l.color}`}>
                  <div className="font-bold text-xs mb-1">{l.layer}</div>
                  <div className="text-[9px] leading-tight">{l.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
              <span>·</span>
              <Link to="/portal/caio" className="font-semibold text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
              <span>·</span>
              <Link to="/portal/semantic-views" className="font-semibold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-6 mt-6 border-t border-black/5 flex items-center gap-2">
        <Users className="w-3 h-3" />
        {tt('Products tagged via OBJECT_CONTACTS + DATA_PRODUCT_OWNER tag · value tracked in OKR system · Snowflake Horizon governance')}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-vfes-dark/40">
        <Link to="/portal/catalog"          className="hover:text-vfes-dark">{tt('Catalog')}</Link>
        <span>·</span>
        <Link to="/portal/lineage"          className="hover:text-vfes-dark">{tt('Lineage')}</Link>
        <span>·</span>
        <Link to="/portal/data-quality"     className="hover:text-vfes-dark">{tt('Data Quality')}</Link>
        <span>·</span>
        <Link to="/portal/semantic-views"   className="hover:text-vfes-dark">{tt('Semantic Views')}</Link>
        <span>·</span>
        <Link to="/portal/horizon"          className="hover:text-vfes-dark">{tt('Horizon')}</Link>
        <span>·</span>
        <Link to="/portal/observability"    className="hover:text-vfes-dark">{tt('Observability')}</Link>
      </div>
    </div>
  )
}
