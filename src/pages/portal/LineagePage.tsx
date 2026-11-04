import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { MOBILE_LINEAGE } from './_mobile_data'
import {
  GitBranch, ArrowRight, Database, Layers, Brain, Eye, AlertTriangle,
  Search, Smartphone, ShieldCheck, Activity, TrendingUp, Clock, BarChart2,
  Zap, GitMerge, Network, FileCheck,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

type Node = { id: string; label: string; type: 'src' | 'raw' | 'core' | 'mart' | 'sv' | 'agent' | 'app'; meta: string }

const NODES: Node[] = [
  { id: 'CRM',      label: 'Amdocs CRM',                type: 'src',   meta: 'Oracle 19c · 24 tbl'    },
  { id: 'BILL',     label: 'Cerillion BSS / Billing',        type: 'src',   meta: 'PostgreSQL · 18 tbl'    },
  { id: 'NMS',      label: 'CMTS / NMS telemetry',       type: 'src',   meta: 'Kafka · 4.2M ev/min'   },
  { id: 'WD',       label: 'Workday HR',                 type: 'src',   meta: 'RaaS · daily'           },
  { id: 'RAW.CRM',  label: 'CBL_RAW.CRM',               type: 'raw',   meta: '24 tbl · 412 GB'        },
  { id: 'RAW.MEC',  label: 'CBL_RAW.BILLING',           type: 'raw',   meta: '18 tbl · 1.2 TB'        },
  { id: 'RAW.NET',  label: 'CBL_RAW.NETWORK',           type: 'raw',   meta: '8 tbl · 4.6 TB'         },
  { id: 'RAW.HR',   label: 'CBL_RAW.HR',                type: 'raw',   meta: '9 tbl · 28 GB'          },
  { id: 'STG.CUST', label: 'CORE.STG_CUSTOMERS',         type: 'core',  meta: 'dbt staging'            },
  { id: 'STG.SUB',  label: 'CORE.STG_SUBSCRIPTIONS',     type: 'core',  meta: 'dbt staging'            },
  { id: 'INT.ARPU', label: 'CORE.INT_ARPU_MONTHLY',      type: 'core',  meta: 'dbt intermediate'       },
  { id: 'DIM.CUST', label: 'CORE.DIM_CUSTOMER',          type: 'core',  meta: 'SCD2 · 1.04M rows'     },
  { id: 'FCT.BILL', label: 'CORE.FACT_BILLING',          type: 'core',  meta: 'partitioned monthly'    },
  { id: 'C360',     label: 'ANALYTICS.CUSTOMER_360',     type: 'mart',  meta: '1.04M rows · 03:00 UTC' },
  { id: 'CHURN',    label: 'ANALYTICS.CHURN_LIST_DAILY', type: 'mart',  meta: 'ML scored daily'        },
  { id: 'CLV',      label: 'ANALYTICS.CLV_SEGMENT_FACT', type: 'mart',  meta: '36-mo CLV'              },
  { id: 'C360_SV',  label: 'CUSTOMER_360_SV',            type: 'sv',    meta: '38 dim · 24 metrics'    },
  { id: 'CHURN_AG', label: 'CHURN_AGENT',                type: 'agent', meta: 'Cortex Agent'           },
  { id: 'PORTAL',   label: 'CableBahamas Portal',           type: 'app',   meta: 'this app'               },
  { id: 'POWERBI',  label: 'Power BI · Exec dashboard',  type: 'app',   meta: '4.6K viewers/wk'        },
]

const EDGES: [string, string][] = [
  ['CRM','RAW.CRM'], ['BILL','RAW.MEC'], ['NMS','RAW.NET'], ['WD','RAW.HR'],
  ['RAW.CRM','STG.CUST'], ['RAW.MEC','STG.SUB'], ['STG.SUB','INT.ARPU'], ['STG.CUST','DIM.CUST'],
  ['INT.ARPU','FCT.BILL'], ['DIM.CUST','C360'], ['FCT.BILL','C360'], ['C360','CHURN'], ['C360','CLV'],
  ['C360','C360_SV'], ['C360_SV','CHURN_AG'], ['C360_SV','PORTAL'], ['C360','POWERBI'], ['CHURN','CHURN_AG'],
]

const TYPE_COLORS: Record<Node['type'], string> = {
  src:   'bg-slate-100 text-slate-700 border-slate-300',
  raw:   'bg-zinc-100 text-zinc-700 border-zinc-300',
  core:  'bg-violet-100 text-violet-700 border-violet-300',
  mart:  'bg-amber-100 text-amber-700 border-amber-300',
  sv:    'bg-rose-100 text-rose-700 border-rose-300',
  agent: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300',
  app:   'bg-emerald-100 text-emerald-700 border-emerald-300',
}

const COLUMN_LINEAGE = [
  { col: 'CHURN_RISK_30D',       upstream: ['DIM_CUSTOMER.TENURE_M','FACT_BILLING.LATE_PAYMENTS_12M','FACT_NETWORK.OUTAGE_HOURS_30D','MODEL: churn_xgb_v3.predict'],          policies: 'mask=none · pii=no'     },
  { col: 'CLV_36M',              upstream: ['DIM_CUSTOMER.PLAN_PRICE','FACT_BILLING.ARPU_TTM','FACT_USAGE.USAGE_TREND','MODEL: clv_lgbm_v2.predict'],                        policies: 'mask=none · pii=no'     },
  { col: 'EMAIL',                upstream: ['STG_CUSTOMERS.EMAIL ← RAW.CRM.CUSTOMERS.EMAIL'],                                                                                 policies: 'mask=mask_email_v2 · pii=yes' },
  { col: 'BUNDLE_PROPENSITY_TV', upstream: ['DIM_CUSTOMER.CURRENT_BUNDLE','FACT_USAGE.TV_HOURS_90D','MODEL: bundle_lgbm_v1.predict'],                                        policies: 'mask=none · pii=no'     },
  { col: 'ARPU_BLENDED',         upstream: ['FACT_BILLING.REVENUE_MOBILE','FACT_BILLING.REVENUE_FIXED','FACT_BILLING.REVENUE_TV'],                                           policies: 'mask=none · pii=no'     },
  { col: 'NPS_LATEST',           upstream: ['RAW.CRM.SURVEY_RESPONSES.NPS_SCORE ← STG_SURVEYS.NPS'],                                                                         policies: 'mask=none · pii=no'     },
  { col: 'LIFECYCLE_STAGE',      upstream: ['CORE.INT_LIFECYCLE.STAGE ← FACT_BILLING.ACTIVE_MONTHS','FACT_INTERACTIONS.CONTACT_HISTORY'],                                    policies: 'mask=none · pii=no'     },
]

const IMPACT = [
  { obj: 'CUSTOMER_360_SV',   type: 'Semantic View',     downstream: 14, severity: 'high'   },
  { obj: 'CHURN_AGENT',       type: 'Cortex Agent',      downstream: 6,  severity: 'high'   },
  { obj: 'Exec dashboard',    type: 'Power BI',          downstream: 1,  severity: 'medium' },
  { obj: 'CHURN_LIST_DAILY',  type: 'Reverse-ETL → CRM', downstream: 1,  severity: 'high'   },
  { obj: 'CableBahamas Portal',  type: 'Streamlit / app',   downstream: 1,  severity: 'medium' },
  { obj: 'CLV_EXPLORER',      type: 'Streamlit-in-Snow', downstream: 1,  severity: 'low'    },
]

const COVERAGE_TREND = [
  { m: 'Jun', coverage: 72, edges: 34200, objects: 1180 },
  { m: 'Jul', coverage: 74, edges: 35100, objects: 1200 },
  { m: 'Aug', coverage: 76, edges: 35800, objects: 1220 },
  { m: 'Sep', coverage: 77, edges: 36400, objects: 1244 },
  { m: 'Oct', coverage: 79, edges: 37200, objects: 1264 },
  { m: 'Nov', coverage: 81, edges: 38412, objects: 1284 },
]

const FRESHNESS_DATA = [
  { layer: 'Sources',   pct: 100, lag: '<2 min'  },
  { layer: 'Raw',       pct: 100, lag: '<5 min'  },
  { layer: 'Core',      pct: 98,  lag: '5-15 min'},
  { layer: 'Marts',     pct: 96,  lag: '15-60 min'},
  { layer: 'Semantic',  pct: 94,  lag: '<10 min' },
  { layer: 'Agents',    pct: 92,  lag: 'on-demand'},
]

const ACCESS_HIST = [
  { role: 'ANALYST_CUSTOMER', user: 'pieter.claes',   queries: 482, last: '12 min ago' },
  { role: 'BI_POWERBI_SVC',   user: 'pbi_service',   queries: 396, last: '8 min ago'  },
  { role: 'SC_AGENT_CHURN',   user: 'sc_agent',      queries: 312, last: '4 min ago'  },
  { role: 'DATA_SCIENCE',     user: 'sofie.peeters', queries: 214, last: '42 min ago' },
  { role: 'EXEC_VIEWER',      user: 'ceo@example.com', queries: 18, last: '2h ago'     },
  { role: 'DBT_PROD',         user: 'dbt_runner',    queries: 12,  last: '03:05 UTC'  },
]

const STALE_OBJS = [
  { obj: 'CHURN_LIST_DAILY',      db: 'CBL_ANALYTICS', last: '29h ago',  owner: 'CDO', reason: tt('Task scheduler delay')  },
  { obj: 'B2B_PIPELINE_FACT',     db: 'CBL_ANALYTICS', last: '31h ago',  owner: 'B2B', reason: tt('Upstream BSS outage')    },
  { obj: 'WEATHER_DAILY',         db: 'CBL_SHARES',    last: '26h ago',  owner: 'SRE', reason: tt('Marketplace refresh lag') },
]

const EDGE_TYPES = [
  { name: 'dbt transform',   count: 842,  color: PURPLE },
  { name: 'Dynamic Table',   count: 624,  color: BLUE   },
  { name: 'Snowpipe / task', count: 384,  color: NAVY   },
  { name: 'ML model feed',   count: 128,  color: AMBER  },
  { name: 'Agent tool',      count: 96,   color: GREEN  },
  { name: 'BI query',        count: 64,   color: SLATE  },
]

const LINEAGE_SOURCES = [
  { source: 'OBJECT_DEPENDENCIES',  edges: 22400, share: 58, color: BLUE   },
  { source: 'ACCESS_HISTORY',        edges: 9800,  share: 26, color: NAVY   },
  { source: 'dbt manifest.json',     edges: 4212,  share: 11, color: PURPLE },
  { source: 'GET_LINEAGE API',       edges: 2000,  share: 5,  color: GREEN  },
]

const CROSS_DOMAIN = [
  { from: 'BILLING',  to: 'CUSTOMER', joins: 42, risk: 'low',    desc: tt('CUSTOMER_ID join — fully governed') },
  { from: 'NETWORK',  to: 'CUSTOMER', joins: 24, risk: 'low',    desc: tt('ACCOUNT_ID bridged via CONFORMED') },
  { from: 'CRM',      to: 'BILLING',  joins: 18, risk: 'medium', desc: tt('Direct join — policy parity needed') },
  { from: 'HR',       to: 'CUSTOMER', joins: 8,  risk: 'high',   desc: tt('Employee/customer overlap — RLS required') },
  { from: 'BILLING',  to: 'RISK',     joins: 6,  risk: 'low',    desc: tt('Payment failures feed risk model') },
  { from: 'NETWORK',  to: 'BILLING',  joins: 4,  risk: 'low',    desc: tt('Network incidents → billing credits') },
]

type TabId = 'overview' | 'dag' | 'column' | 'impact' | 'freshness' | 'coverage' | 'sources' | 'cross-domain'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',     label: 'Overview',          icon: Activity    },
  { id: 'dag',          label: 'DAG Explorer',       icon: GitBranch   },
  { id: 'column',       label: 'Column Lineage',     icon: Database    },
  { id: 'impact',       label: 'Impact / Blast',     icon: AlertTriangle },
  { id: 'freshness',    label: 'Freshness',          icon: Clock       },
  { id: 'coverage',     label: 'Coverage',           icon: BarChart2   },
  { id: 'sources',      label: 'Lineage Sources',    icon: GitMerge    },
  { id: 'cross-domain', label: 'Cross-domain',       icon: Network     },
]

export default function LineagePage() {
  const [tab, setTab]           = useState<TabId>('overview')
  const [selected, setSelected] = useState('C360')
  const [colSearch, setColSearch]   = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [liveTime, setLiveTime]     = useState('')
  const [layerFilter, setLayerFilter] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const node = NODES.find((n) => n.id === selected)!

  const filteredCols = useMemo(
    () => colSearch === '' ? COLUMN_LINEAGE : COLUMN_LINEAGE.filter(c => c.col.toLowerCase().includes(colSearch.toLowerCase())),
    [colSearch],
  )

  const filteredCross = useMemo(
    () => riskFilter === 'all' ? CROSS_DOMAIN : CROSS_DOMAIN.filter(c => c.risk === riskFilter),
    [riskFilter],
  )

  const filteredFreshness = useMemo(
    () => layerFilter === 'All' ? FRESHNESS_DATA : FRESHNESS_DATA.filter(f => f.layer === layerFilter),
    [layerFilter],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Lineage & Impact')}
        subtitle={tt('Column-level lineage · blast-radius · powered by ACCESS_HISTORY + dbt manifest + GET_LINEAGE')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/catalog" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Database className="w-4 h-4" /> {tt('Catalog')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Lineage intelligence"
        models={[
          { name: 'Blast-radius Predictor', metric: 'AUC 0.96', sub: 'downstream impact severity'   },
          { name: 'Stale-data Detector',    metric: 'recall 0.92', sub: 'freshness anomaly detection' },
          { name: 'Schema Drift Model',     metric: 'F1 0.89', sub: 'breaking-change early-warning'  },
        ]}
        agentLabel="Run Lineage Analyst"
        agentRunningLabel="Tracing…"
        agentSteps={[
          'Traversed all 38,412 lineage edges from OBJECT_DEPENDENCIES + ACCESS_HISTORY',
          'Identified 3 stale objects with downstream SLA impact',
          'Scored blast-radius for top 20 core tables',
          'Generated safe-change checklist for CUSTOMER_360 schema migration',
        ]}
        agentBlurb="Snowflake-native lineage from OBJECT_DEPENDENCIES means every edge is captured without external tooling — column-level paths from raw Kafka events to AI agent context windows."
        decision={{
          title: 'Pre-notify 23 consumers before any CUSTOMER_360 schema change',
          detail: 'CUSTOMER_360 feeds 14 downstream Semantic View consumers, 6 agent tool calls, and 2 BI dashboards. Any breaking column change without prior notification carries a blast-radius of 23 active roles in the last 7 days — disruption risk is high.',
          impact: 'protects 23 consumers · avoids SLA breach cascade',
          risk: 'Steward Emma Rolle must approve schema PRs before merge',
          linkTo: '#/portal/lineage',
          linkLabel: 'Open Lineage & Impact',
        }}
        chart={{
          kind: 'line',
          title: 'Lineage coverage trend — % of objects with tracked lineage',
          xKey: 'm',
          data: COVERAGE_TREND,
          series: [{ key: 'coverage', name: 'Coverage %', color: BLUE }],
          note: 'Coverage grew from 72% in January to 81% in June. Target 90% by Q4 via GET_LINEAGE API expansion.',
        }}
      />

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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Tracked objects')}    value="1,284"   delta="+42 MoM"              trend="up"   icon={Database}   accent />
          <KpiCard label={tt('Column-level edges')} value="38,412"  delta="+1,210 MoM"           trend="up"   icon={GitBranch}  />
          <KpiCard label={tt('Cross-domain joins')} value="142"     delta={tt('6 domains')}      trend="flat" icon={Network}    />
          <KpiCard label={tt('Stale > 24h')}        value="3"       delta={tt('alert active')}   trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Lineage coverage')}   value="81%"     delta="+9 pp YTD"            trend="up"   icon={BarChart2}  />
          <KpiCard label={tt('Source systems')}     value="4"       delta={tt('CRM · BSS · Kafka · Workday')} trend="flat" icon={Zap} />
          <KpiCard label={tt('GET_LINEAGE edges')}  value="2,000"   delta={tt('API-sourced')}     trend="up"   icon={GitMerge}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Lineage edge growth — 6 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={COVERAGE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="edges"   name={tt('Edges')}   stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="objects" name={tt('Objects')} stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Edge type distribution')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={EDGE_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Edges')} radius={[4, 4, 0, 0]}>
                    {EDGE_TYPES.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Stale objects — freshness > 24h')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Object')}</th>
                    <th className="text-left">{tt('Database')}</th>
                    <th className="text-left">{tt('Last refresh')}</th>
                    <th className="text-left">{tt('Owner')}</th>
                    <th className="text-left">{tt('Reason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {STALE_OBJS.map((s) => (
                    <tr key={s.obj} className="border-b border-black/5">
                      <td className="py-1.5 font-mono font-semibold text-amber-700">{s.obj}</td>
                      <td className="font-mono text-[10px]">{s.db}</td>
                      <td className="font-mono text-[10px] text-amber-600">{s.last}</td>
                      <td className="text-[11px]">{s.owner}</td>
                      <td className="text-[11px] text-vfes-dark/65">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>

          <Panel title={tt('Quick navigation')}>
            <div className="space-y-2">
              <Link to="/portal/catalog" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc]">
                <span className="text-sm font-semibold">{tt('Data Catalog')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/data-quality" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc]">
                <span className="text-sm font-semibold">{tt('Data Quality')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/semantic-views" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc]">
                <span className="text-sm font-semibold">{tt('Semantic Views')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/data-products" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc]">
                <span className="text-sm font-semibold">{tt('Data Products')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
              <Link to="/portal/observability" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fafbfc]">
                <span className="text-sm font-semibold">{tt('Observability')}</span>
                <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
              </Link>
            </div>
          </Panel>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">
              {tt('23 active consumers in last 7 days — notify before any CUSTOMER_360 breaking change')}
            </div>
            <div className="text-xs text-amber-800 mt-1">
              {tt('Notify #data-platform + steward Emma Rolle. Run blast-radius check before schema PRs merge.')}
            </div>
          </div>
          <Link to="/portal/data-contracts" className="text-xs font-bold text-amber-900 hover:underline shrink-0">
            {tt('View contracts →')}
          </Link>
        </div>
      </>)}

      {/* ══════════════ DAG EXPLORER ══════════════════════════════════════════ */}
      {tab === 'dag' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('DAG nodes')}      value="20"     delta={tt('7 layers')}         trend="flat" icon={GitBranch}  accent />
          <KpiCard label={tt('DAG edges')}       value="18"     delta={tt('direct paths')}     trend="flat" icon={ArrowRight} />
          <KpiCard label={tt('Longest path')}    value="7 hops" delta={tt('CRM → Portal')}     trend="flat" icon={Layers}    />
          <KpiCard label={tt('Source systems')}  value="4"      delta={tt('all healthy')}      trend="up"   icon={Database}  />
        </div>

        <Panel title={tt('DAG · select a node')}>
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 overflow-x-auto">
            <div className="flex gap-3 min-w-[1200px]">
              {(['src','raw','core','mart','sv','agent','app'] as Node['type'][]).map((t) => {
                const lane = NODES.filter((n) => n.type === t)
                const labels: Record<string, string> = { src:'SOURCES', raw:'RAW', core:'CORE (dbt)', mart:'MARTS', sv:'SEMANTIC', agent:'AGENTS', app:'APPS' }
                return (
                  <div key={t} className="flex-1 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">{labels[t]}</div>
                    {lane.map((n) => (
                      <button key={n.id} onClick={() => setSelected(n.id)}
                        className={`w-full text-left rounded-lg border px-2 py-2 text-[11px] transition ${TYPE_COLORS[n.type]} ${selected === n.id ? 'ring-2 ring-vfes-red shadow-md' : 'hover:shadow'}`}>
                        <div className="font-mono font-semibold truncate">{tt(n.label)}</div>
                        <div className="text-[9px] opacity-70 truncate">{n.meta}</div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Panel title={`${tt('Upstream of')} ${tt(node.label)}`}>
            <div className="space-y-2 text-[12px] font-mono">
              {EDGES.filter(([_, t]) => t === selected).map(([s], i) => {
                const from = NODES.find((n) => n.id === s)!
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border ${TYPE_COLORS[from.type]}`}>{tt(from.label)}</span>
                    <ArrowRight className="w-3 h-3 text-vfes-dark/40" />
                    <span className="text-vfes-dark/60 text-[10px]">{from.meta}</span>
                  </div>
                )
              })}
              {EDGES.filter(([_, t]) => t === selected).length === 0 && <div className="text-[11px] text-vfes-dark/50">{tt('— no upstream (root source)')}</div>}
            </div>
          </Panel>

          <Panel title={`${tt('Downstream of')} ${tt(node.label)}`}>
            <div className="space-y-2 text-[12px] font-mono">
              {EDGES.filter(([s]) => s === selected).map(([_, t], i) => {
                const to = NODES.find((n) => n.id === t)!
                return (
                  <div key={i} className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-vfes-dark/40" />
                    <span className={`px-2 py-0.5 rounded border ${TYPE_COLORS[to.type]}`}>{tt(to.label)}</span>
                    <span className="text-vfes-dark/60 text-[10px]">{to.meta}</span>
                  </div>
                )
              })}
              {EDGES.filter(([s]) => s === selected).length === 0 && <div className="text-[11px] text-vfes-dark/50">{tt('— terminal')}</div>}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ COLUMN LINEAGE ════════════════════════════════════════ */}
      {tab === 'column' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Tracked columns')}    value="1,842"  delta={tt('across all marts')}  trend="up"   icon={Database}  accent />
          <KpiCard label={tt('PII columns')}         value="12"     delta={tt('masked by policy')}  trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('ML-sourced columns')}  value="28"     delta={tt('model predictions')} trend="up"   icon={Brain}     />
          <KpiCard label={tt('Column edges total')}  value="38,412" delta={tt('incl. model feeds')} trend="up"   icon={GitBranch} />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-vfes-dark/40" />
          <input value={colSearch} onChange={e => setColSearch(e.target.value)}
            placeholder={tt('Search column name…')}
            className="bg-white border border-black/10 rounded-lg px-3 py-1.5 text-sm w-64" />
        </div>

        <Panel title={tt('Column-level lineage · CUSTOMER_360')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Column')}</th>
                <th className="text-left">{tt('Upstream sources / models')}</th>
                <th className="text-left">{tt('Policy / PII')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCols.map((r) => (
                <tr key={r.col} className="border-b border-black/5 align-top hover:bg-[#fafbfc]">
                  <td className="py-2 font-mono font-semibold">{r.col}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/70 space-y-0.5">
                    {r.upstream.map((u, i) => <div key={i}>↳ {u}</div>)}
                  </td>
                  <td className="font-mono text-[10px] text-vfes-dark/60">{r.policies}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/data-governance" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Data Governance →')}
            </Link>
            <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">
              {tt('Horizon Catalog →')}
            </Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Column type distribution — CUSTOMER_360')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: tt('Business metrics'),  value: 28 },
                    { name: tt('ML predictions'),    value: 28 },
                    { name: tt('PII masked'),        value: 12 },
                    { name: tt('Identifiers / keys'),value: 8  },
                    { name: tt('Dates / timestamps'),value: 6  },
                    { name: tt('Categorical'),       value: 60 },
                  ]} dataKey="value" innerRadius={35} outerRadius={68} paddingAngle={2}>
                    {[BLUE, AMBER, '#ef4444', PURPLE, GREEN, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Access history — CUSTOMER_360 (7d)')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Role')}</th>
                  <th className="text-left">{tt('User')}</th>
                  <th className="text-right">{tt('Queries')}</th>
                  <th className="text-left">{tt('Last')}</th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_HIST.map((a) => (
                  <tr key={a.user} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-xs">{a.role}</td>
                    <td className="font-mono text-xs text-vfes-dark/70">{a.user}</td>
                    <td className="text-right font-mono">{a.queries}</td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{a.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ IMPACT / BLAST ════════════════════════════════════════ */}
      {tab === 'impact' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('High-severity objects')} value="3"   delta={tt('of 6 impacted')}    trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Active consumers 7d')}   value="23"  delta={tt('all roles')}        trend="up"   icon={Activity}    />
          <KpiCard label={tt('Downstream SLA at risk')} value="2"  delta={tt('Gold-tier products')} trend="down" icon={ShieldCheck} />
          <KpiCard label={tt('Blast score')}            value="84"  delta={tt('/ 100 — high')}    trend="down" icon={TrendingUp}   />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 space-y-4">
            <Panel title={tt('Blast-radius — if you change CUSTOMER_360 today')}>
              <div className="space-y-2">
                {IMPACT.map((i) => (
                  <div key={i.obj} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0">
                    <div>
                      <div className="font-mono font-semibold text-[12px]">{i.obj}</div>
                      <div className="text-[10px] text-vfes-dark/50">{tt(i.type)} · {i.downstream} {tt('downstream')}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                      i.severity === 'high' ? 'bg-rose-100 text-rose-700' : i.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{tt(i.severity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-vfes-dark/60 bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{tt('23 active consumers in last 7 days. Notify')} <span className="font-mono">#data-platform</span>{tt(' + steward Emma Rolle before any breaking change.')}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Link to="/portal/data-contracts" className="text-xs font-bold text-vfes-dark hover:underline">{tt('View contracts →')}</Link>
                <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">{tt('RBAC →')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Blast-radius severity distribution')}>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={[
                    { sev: tt('High'),   count: 3, color: '#ef4444' },
                    { sev: tt('Medium'), count: 2, color: AMBER },
                    { sev: tt('Low'),    count: 1, color: GREEN },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="sev" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="count" name={tt('Objects')} radius={[4, 4, 0, 0]}>
                      {[0,1,2].map(i => <Cell key={i} fill={['#ef4444', AMBER, GREEN][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="col-span-5 space-y-4">
            <Panel title={tt('Recent consumers (ACCESS_HISTORY · 7d)')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Role')}</th>
                    <th className="text-left">{tt('User')}</th>
                    <th className="text-right">{tt('Queries')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ACCESS_HIST.map((a) => (
                    <tr key={a.user} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-xs">{a.role}</td>
                      <td className="font-mono text-vfes-dark/70 text-xs">{a.user}</td>
                      <td className="text-right font-mono">{a.queries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title={tt('Downstream query volume by type')}>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={[
                      { name: tt('BI dashboards'), value: 396 },
                      { name: tt('Analysts'),       value: 696 },
                      { name: tt('AI agents'),      value: 312 },
                      { name: tt('ML pipelines'),   value: 214 },
                    ]} dataKey="value" innerRadius={32} outerRadius={60} paddingAngle={2}>
                      {[BLUE, NAVY, PURPLE, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══════════════ FRESHNESS ═════════════════════════════════════════════ */}
      {tab === 'freshness' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Layer:')}</span>
          {['All', ...FRESHNESS_DATA.map(f => f.layer)].map(l => (
            <button key={l} onClick={() => setLayerFilter(l)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${layerFilter === l ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(l)}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('All layers fresh')}     value="81%"  delta={tt('of objects')}        trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Stale > 24h')}           value="3"    delta={tt('active alerts')}     trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Fastest layer')}         value="<2 min" delta={tt('Sources · Kafka')} trend="flat" icon={Zap}         />
          <KpiCard label={tt('DMF freshness checks')} value="9"    delta={tt('attached')}           trend="up"   icon={FileCheck}   />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Freshness coverage % by layer')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredFreshness}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="layer" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[85, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="pct" name={tt('Fresh %')} radius={[4, 4, 0, 0]}>
                    {filteredFreshness.map((f, i) => <Cell key={i} fill={f.pct >= 98 ? GREEN : f.pct >= 95 ? AMBER : '#ef4444'} />)}
                  </Bar>
                  <ReferenceLine y={99} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Freshness SLA by layer')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Layer')}</th>
                  <th className="text-right">{tt('Objects fresh %')}</th>
                  <th className="text-left">{tt('Target lag')}</th>
                </tr>
              </thead>
              <tbody>
                {FRESHNESS_DATA.map((f) => (
                  <tr key={f.layer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-semibold">{tt(f.layer)}</td>
                    <td className={`text-right font-mono font-bold ${f.pct >= 98 ? 'text-emerald-600' : f.pct >= 95 ? 'text-amber-600' : 'text-red-600'}`}>{f.pct}%</td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{f.lag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Observability →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Freshness trend — coverage % (6 months)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={COVERAGE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[70, 85]} />
                <Tooltip contentStyle={TS} />
                <Line type="monotone" dataKey="coverage" name={tt('Coverage %')} stroke={BLUE} strokeWidth={2.4} dot />
                <ReferenceLine y={80} stroke={AMBER} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ COVERAGE ══════════════════════════════════════════════ */}
      {tab === 'coverage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Lineage coverage')}  value="81%"  delta="+9 pp YTD"              trend="up" icon={BarChart2}  accent />
          <KpiCard label={tt('Objects tracked')}   value="1,284" delta={tt('of 1,584 total')} trend="up" icon={Database}  />
          <KpiCard label={tt('Column coverage')}   value="74%"  delta="+4 pp MoM"              trend="up" icon={Eye}       />
          <KpiCard label={tt('Q4 target')}          value="90%"  delta={tt('+9 pp to target')} trend="flat" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Coverage growth — objects & edges (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={COVERAGE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="objects"  name={tt('Objects')}    fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="coverage" name={tt('Coverage %')} stroke={AMBER} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Lineage source breakdown — edges by origin')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={LINEAGE_SOURCES} dataKey="edges" innerRadius={40} outerRadius={72} paddingAngle={2}
                    label={({ source, share }: { source: string; share: number }) => `${source.split(' ')[0]} ${share}%`} labelLine={false}>
                    {LINEAGE_SOURCES.map((l, i) => <Cell key={i} fill={l.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Coverage by layer — object & column counts')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Layer')}</th>
                <th className="text-right">{tt('Objects with lineage')}</th>
                <th className="text-right">{tt('Total objects')}</th>
                <th className="text-right">{tt('Coverage %')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { layer: tt('Raw'),     with: 96,  total: 96,  pct: 100 },
                { layer: tt('Core'),    with: 180, total: 184, pct: 98  },
                { layer: tt('Marts'),   with: 86,  total: 92,  pct: 93  },
                { layer: tt('Semantic'),with: 7,   total: 7,   pct: 100 },
                { layer: tt('AI'),      with: 20,  total: 28,  pct: 71  },
                { layer: tt('Gov'),     with: 36,  total: 42,  pct: 86  },
              ].map(r => (
                <tr key={r.layer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-semibold">{r.layer}</td>
                  <td className="text-right font-mono">{r.with}</td>
                  <td className="text-right font-mono text-vfes-dark/55">{r.total}</td>
                  <td className={`text-right font-bold font-mono ${r.pct >= 95 ? 'text-emerald-600' : r.pct >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </>)}

      {/* ══════════════ LINEAGE SOURCES ═══════════════════════════════════════ */}
      {tab === 'sources' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total edges')}         value="38,412" delta={tt('+1,210 MoM')} trend="up"   icon={GitMerge}   accent />
          <KpiCard label={tt('OBJECT_DEPENDENCIES')} value="22,400" delta="58%"              trend="up"   icon={Database}   />
          <KpiCard label={tt('ACCESS_HISTORY')}      value="9,800"  delta="26%"              trend="up"   icon={Activity}   />
          <KpiCard label={tt('dbt manifest')}         value="4,212"  delta="11%"              trend="flat" icon={GitBranch}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Edge origin — count by source')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={LINEAGE_SOURCES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="source" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="edges" name={tt('Edges')} radius={[4, 4, 0, 0]}>
                    {LINEAGE_SOURCES.map((l, i) => <Cell key={i} fill={l.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Share of lineage edges by source (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={LINEAGE_SOURCES} dataKey="share" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {LINEAGE_SOURCES.map((l, i) => <Cell key={i} fill={l.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Lineage sources — detail register')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Source')}</th>
                <th className="text-right">{tt('Edges')}</th>
                <th className="text-right">{tt('Share %')}</th>
                <th className="text-left">{tt('Refresh')}</th>
                <th className="text-left">{tt('Notes')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { source: 'SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES', edges: 22400, share: 58, refresh: tt('continuous'), notes: tt('Most comprehensive — captures all Snowflake objects') },
                { source: 'SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY',      edges: 9800,  share: 26, refresh: tt('2h lag'),     notes: tt('Query-level access — fills column-level gaps')  },
                { source: 'dbt manifest.json',                            edges: 4212,  share: 11, refresh: tt('per deploy'), notes: tt('dbt model/source dependencies — most precise')   },
                { source: 'GET_LINEAGE API',                               edges: 2000,  share: 5,  refresh: tt('on-demand'),  notes: tt('Snowflake native REST lineage API — expanding')  },
              ].map(r => (
                <tr key={r.source} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-[10px] font-semibold">{r.source}</td>
                  <td className="text-right font-mono">{r.edges.toLocaleString()}</td>
                  <td className="text-right font-mono">{r.share}%</td>
                  <td className="font-mono text-[10px]">{r.refresh}</td>
                  <td className="text-[11px] text-vfes-dark/65">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
            <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CROSS-DOMAIN ══════════════════════════════════════════ */}
      {tab === 'cross-domain' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Risk:')}</span>
          {(['all', 'high', 'medium', 'low'] as const).map(r => (
            <button key={r} onClick={() => setRiskFilter(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${riskFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(r)}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cross-domain joins')}  value="142"   delta={tt('6 domain pairs')}   trend="flat" icon={Network}    accent />
          <KpiCard label={tt('High-risk joins')}      value="1"     delta={tt('HR↔Customer')}      trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Policy-governed joins')} value="138" delta={tt('97% covered')}       trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Ungoverned joins')}     value="4"     delta={tt('under review')}     trend="down" icon={Eye}        />
        </div>

        <Panel title={tt('Cross-domain join register')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('From')}</th>
                <th className="text-left">{tt('To')}</th>
                <th className="text-right">{tt('Joins')}</th>
                <th className="text-left">{tt('Risk')}</th>
                <th className="text-left">{tt('Description')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCross.map((c) => (
                <tr key={`${c.from}-${c.to}`} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold text-xs">{c.from}</td>
                  <td className="font-mono font-semibold text-xs">{c.to}</td>
                  <td className="text-right font-mono">{c.joins}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.risk === 'high' ? 'bg-rose-100 text-rose-700' : c.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {tt(c.risk)}
                    </span>
                  </td>
                  <td className="text-[11px] text-vfes-dark/65">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon governance →')}</Link>
            <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">{tt('RBAC →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Cross-domain joins by domain pair')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CROSS_DOMAIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="from" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="joins" name={tt('Joins')} radius={[4, 4, 0, 0]}>
                    {CROSS_DOMAIN.map((c, i) => <Cell key={i} fill={c.risk === 'high' ? '#ef4444' : c.risk === 'medium' ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Mobile / RAN lineage — selected flows')} action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />{tt('8 mobile flows')}
            </span>}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('Upstream')}</th>
                  <th></th>
                  <th>{tt('Downstream')}</th>
                  <th>{tt('Criticality')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_LINEAGE.slice(0, 5).map((l, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-xs font-semibold">{l.upstream}</td>
                    <td className="text-vfes-dark/40"><ArrowRight className="w-3.5 h-3.5" /></td>
                    <td className="font-mono text-xs">{l.downstream}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${l.criticality === 'Critical' ? 'bg-red-50 text-red-700' : l.criticality === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {tt(l.criticality)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ── Mobile / RAN lineage (always visible) ──────────────────────────── */}
      <Panel title={tt('Mobile / RAN lineage — selected flows')} action={
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
          <Smartphone className="w-3 h-3" />{tt('8 mobile flows')}
        </span>}>
        <table className="w-full text-[12px]">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr>
              <th className="py-1.5">{tt('Upstream')}</th>
              <th></th>
              <th>{tt('Downstream')}</th>
              <th>{tt('Transform')}</th>
              <th>{tt('Criticality')}</th>
            </tr>
          </thead>
          <tbody>
            {MOBILE_LINEAGE.map((l, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs font-semibold">{l.upstream}</td>
                <td className="text-vfes-dark/40"><ArrowRight className="w-3.5 h-3.5" /></td>
                <td className="font-mono text-xs font-semibold">{l.downstream}</td>
                <td className="text-[11px] text-vfes-dark/65">{tt(l.transform)}</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${l.criticality === 'Critical' ? 'bg-red-50 text-red-700' : l.criticality === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                    {tt(l.criticality)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">
          {tt('Critical path: SIM_SWAP_REQUESTS → sim_swap_fraud_iforest. High-criticality flows feed Cell-site Health Score and MNP Win-back Agent — any break triggers PagerDuty.')}
        </div>
      </Panel>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Source-to-mart path — CUSTOMER_360 summary')}>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={[
                { hop: tt('CRM → RAW'),        latency: 2   },
                { hop: tt('RAW → STG'),         latency: 3   },
                { hop: tt('STG → CONFORMED'),   latency: 5   },
                { hop: tt('CONFORMED → MART'),  latency: 15  },
                { hop: tt('MART → SV'),         latency: 2   },
                { hop: tt('SV → AGENT'),        latency: 0.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hop" tick={{ fontSize: 7 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" min" />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="latency" name={tt('Lag (min)')} fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-vfes-dark/55 mt-2">
            {tt('Total end-to-end lag: ~27 min from CRM event to Cortex Agent context. Target: <20 min via Dynamic Table lag reduction.')}
          </div>
        </Panel>

        <Panel title={tt('End-to-end pipeline: CRM event → AI agent')}>
          <div className="space-y-2 text-[11px]">
            {[
              { step: '1', from: 'Amdocs CRM',          to: 'CBL_RAW.CRM',           lag: '<2 min',  via: 'Snowpipe'          },
              { step: '2', from: 'CBL_RAW.CRM',          to: 'CORE.STG_CUSTOMERS',    lag: '<1 min',  via: 'Dynamic Table'     },
              { step: '3', from: 'CORE.STG_CUSTOMERS',   to: 'CORE.DIM_CUSTOMER',     lag: '5 min',   via: 'Dynamic Table SCD2'},
              { step: '4', from: 'CORE.DIM_CUSTOMER',    to: 'ANALYTICS.CUSTOMER_360',lag: '15 min',  via: 'dbt + DT mart'     },
              { step: '5', from: 'ANALYTICS.CUSTOMER_360', to: 'CUSTOMER_360_SV',     lag: '<1 min',  via: 'Semantic View'     },
              { step: '6', from: 'CUSTOMER_360_SV',      to: 'CHURN_AGENT (Cortex)',  lag: 'on-demand', via: 'Cortex Analyst'  },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2 bg-[#fafbfc] rounded p-2">
                <span className="w-5 h-5 rounded-full bg-vfes-red text-vfes-dark flex items-center justify-center text-[9px] font-bold shrink-0">{s.step}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] font-semibold truncate">{s.from}</span>
                  <ArrowRight className="w-2.5 h-2.5 inline mx-1 text-vfes-dark/40" />
                  <span className="font-mono text-[10px] font-semibold">{s.to}</span>
                </div>
                <span className="font-mono text-[10px] text-vfes-dark/55 shrink-0">{s.lag}</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded shrink-0">{s.via}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-6 mt-6 border-t border-black/5 flex items-center gap-2">
        <GitBranch className="w-3 h-3" />
        {tt('source: SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES + ACCESS_HISTORY + dbt manifest.json · refreshed 02:00 UTC')}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-vfes-dark/40">
        <Link to="/portal/catalog"       className="hover:text-vfes-dark">{tt('Catalog')}</Link>
        <span>·</span>
        <Link to="/portal/data-quality"  className="hover:text-vfes-dark">{tt('Data Quality')}</Link>
        <span>·</span>
        <Link to="/portal/semantic-views" className="hover:text-vfes-dark">{tt('Semantic Views')}</Link>
        <span>·</span>
        <Link to="/portal/horizon"        className="hover:text-vfes-dark">{tt('Horizon')}</Link>
      </div>
    </div>
  )
}
