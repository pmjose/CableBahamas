import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { Database, Workflow, Brain, Activity, ShieldCheck, Cloud, GitBranch, Zap, Box, Search, Eye, Bot, FileCode, Layers, Server, Globe2, Smartphone, Sparkles, Cpu, HardDrive, Lock, BarChart2 } from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, Cell,
} from 'recharts'
import tt from '../../i18n/tt'
import { MOBILE_ARCHITECTURE } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const lanes: { name: string; sub: string; color: string; nodes: { n: string; meta: string; icon: any }[] }[] = [
  { name: 'Sources', sub: '38 source systems · 6 regions', color: 'from-slate-100 to-slate-50 border-slate-300', nodes: [
    { n: 'Amdocs CRM',          meta: 'Oracle 19c · 24 tbl · CDC',     icon: Database },
    { n: 'Cisco BSS / Billing', meta: 'PostgreSQL · 18 tbl · CDC',     icon: Database },
    { n: 'CMTS / DOCSIS telemetry', meta: 'Kafka · 4.2M ev/min',       icon: Activity },
    { n: 'OSS / Optical (NMS)', meta: 'Kafka · 1.8M ev/min',           icon: Activity },
    { n: 'NetSuite GL',         meta: 'REST · hourly · 22 tbl',        icon: Cloud },
    { n: 'Salesforce B2B',      meta: 'Bulk API · 30 min · 14 tbl',    icon: Cloud },
    { n: 'Workday HR',          meta: 'RaaS · daily · 9 tbl',          icon: Cloud },
    { n: 'Adobe Analytics',     meta: 'Data feeds · S3 hourly',        icon: Cloud },
  ]},
  { name: 'Ingestion', sub: 'Snowpipe Streaming · Openflow · Connectors', color: 'from-sky-100 to-sky-50 border-sky-300', nodes: [
    { n: 'Snowpipe Streaming',  meta: '12 channels · p99 8.4s',        icon: Zap },
    { n: 'Openflow CDC (Oracle)', meta: '4 connectors · 24 tbl',       icon: GitBranch },
    { n: 'Openflow CDC (Postgres)', meta: '2 connectors · 18 tbl',     icon: GitBranch },
    { n: 'Snowflake Connector for Kafka', meta: '6 topics · 6.0M ev/min', icon: Zap },
    { n: 'External Stages (S3)',meta: '14 stages · auto-refresh',      icon: Box },
    { n: 'Kafka — Confluent',   meta: '12 topics · 3.6 GB/d',          icon: Activity },
  ]},
  { name: 'Storage — RAW', sub: 'CBL_RAW · landing zone', color: 'from-zinc-100 to-zinc-50 border-zinc-300', nodes: [
    { n: 'CBL_RAW.CRM',        meta: '24 tbl · 412 GB',                icon: Layers },
    { n: 'CBL_RAW.BILLING',    meta: '18 tbl · 1.2 TB',                icon: Layers },
    { n: 'CBL_RAW.NETWORK',    meta: '8 tbl · 4.6 TB · cluster on TS', icon: Layers },
    { n: 'CBL_RAW.WEB',        meta: '6 tbl · 280 GB',                 icon: Layers },
    { n: 'CBL_RAW.HR',         meta: '9 tbl · 28 GB',                  icon: Layers },
  ]},
  { name: 'Transform — CORE', sub: 'dbt · Dynamic Tables · Streams & Tasks', color: 'from-violet-100 to-violet-50 border-violet-300', nodes: [
    { n: 'dbt project: cbl_core', meta: '184 models · 96% docs · CI', icon: FileCode },
    { n: 'Dynamic Tables (CORE)',  meta: '42 DTs · TARGET_LAG 5–15m',  icon: Workflow },
    { n: 'Streams & Tasks',        meta: '18 streams · 22 tasks',      icon: Workflow },
    { n: 'Snowpark Python jobs',   meta: '12 procs · daily 04:00 UTC', icon: FileCode },
    { n: 'Snowflake Notebooks',    meta: '8 notebooks · ML + ad-hoc analysis', icon: FileCode },
    { n: 'Iceberg tables (Delta)', meta: '4 tbl · S3 catalog · external read', icon: Box },
  ]},
  { name: 'Serve — MARTS', sub: 'CBL_ANALYTICS · 360s · BI', color: 'from-amber-100 to-amber-50 border-amber-300', nodes: [
    { n: 'CUSTOMER_360',  meta: '1.04M rows · refresh 03:00 UTC',      icon: Layers },
    { n: 'PRODUCT_360',   meta: '14.2K rows · refresh 03:00 UTC',      icon: Layers },
    { n: 'B2B_360',       meta: '3.8K rows · refresh 03:30 UTC',       icon: Layers },
    { n: 'PEOPLE_360',    meta: '1.84K rows · refresh 05:00 UTC',      icon: Layers },
    { n: 'EXEC_360',      meta: '12 tbl · refresh 06:00 UTC',          icon: Layers },
    { n: 'RISK_360 / REG_ESG_360', meta: '8 + 6 tbl · 04:30 UTC',      icon: Layers },
  ]},
  { name: 'Intelligence', sub: 'Cortex · Snowpark ML · Agents', color: 'from-rose-100 to-rose-50 border-rose-300', nodes: [
    { n: 'Cortex Search Services', meta: '6 services · 24 indexed corpora', icon: Search },
    { n: 'Cortex Analyst (Semantic Views)', meta: '8 views · 156 metrics', icon: Eye },
    { n: 'Snowpark ML Registry',   meta: '14 models · 4 in prod · MLOps CI', icon: Brain },
    { n: 'Cortex Agents',          meta: '9 agents · SI tile enabled', icon: Bot },
    { n: 'Cortex AISQL functions', meta: 'AI_COMPLETE · CLASSIFY · EXTRACT · in-pipeline', icon: Sparkles },
    { n: 'Document AI',            meta: '3 pipelines · invoice + contract', icon: Brain },
  ]},
  { name: 'Consume', sub: 'Apps · BI · Streamlit · Reverse-ETL', color: 'from-emerald-100 to-emerald-50 border-emerald-300', nodes: [
    { n: 'Streamlit-in-Snowflake', meta: '12 apps · this portal',      icon: Server },
    { n: 'Power BI Premium',       meta: '8 workspaces · DirectQuery', icon: Server },
    { n: 'Tableau Cloud',          meta: '4 workbooks · live',         icon: Server },
    { n: 'Snowflake Intelligence', meta: 'CEO + CDO + Sales tiles',    icon: Bot },
    { n: 'Reverse-ETL (Hightouch)',meta: '12 syncs · CRM + Marketing', icon: Cloud },
    { n: 'Snowflake Marketplace',  meta: '6 listings consumed · 1 scenario', icon: Globe2 },
  ]},
]

// platformKpis moved to inline KpiCard array in render

type TabId = 'overview' | 'ingestion' | 'storage' | 'transform' | 'serving' | 'intelligence' | 'integrations' | 'security'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',      label: 'Overview',          icon: Eye },
  { id: 'ingestion',     label: 'Ingestion',          icon: Cloud },
  { id: 'storage',       label: 'Storage / Iceberg',  icon: HardDrive },
  { id: 'transform',     label: 'Transform',          icon: Workflow },
  { id: 'serving',       label: 'Serving / Marts',    icon: Layers },
  { id: 'intelligence',  label: 'Intelligence / AI',  icon: Brain },
  { id: 'integrations',  label: 'Integrations',       icon: Globe2 },
  { id: 'security',      label: 'Security / Horizon', icon: Lock },
]

// ── Ingestion trend ─────────────────────────────────────────────────────────
const ingestionTrend = Array.from({ length: 14 }, (_, i) => ({
  d: `D-${13 - i}`,
  streaming: 6000 + Math.round(Math.sin(i / 2) * 1200),
  cdc: 12 + Math.round(Math.cos(i / 3) * 4),
  s3: 620 + Math.round(Math.sin(i / 4) * 80),
}))

// ── Storage growth ──────────────────────────────────────────────────────────
const storageGrowth = [
  { m: 'Jun', raw: 5.1, core: 1.4, analytics: 0.6 },
  { m: 'Jul', raw: 5.4, core: 1.5, analytics: 0.6 },
  { m: 'Aug', raw: 5.8, core: 1.6, analytics: 0.7 },
  { m: 'Sep', raw: 6.1, core: 1.7, analytics: 0.7 },
  { m: 'Oct', raw: 6.6, core: 1.8, analytics: 0.8 },
  { m: 'Nov', raw: 7.0, core: 2.0, analytics: 0.8 },
]

// ── Transform pipeline latency ──────────────────────────────────────────────
const transformLatency = [
  { job: 'DT FACT_INTERACTIONS',  p50: 18,  p95: 38,  slo: 300 },
  { job: 'DT FACT_BILLING',       p50: 8,   p95: 12,  slo: 900 },
  { job: 'DT CUSTOMER_360',       p50: 82,  p95: 138, slo: 3600 },
  { job: 'TASK_BUILD_C360',       p50: 168, p95: 212, slo: 600 },
  { job: 'dbt CI main',           p50: 842, p95: 960, slo: 1800 },
]

// ── Serving query performance ───────────────────────────────────────────────
const queryPerf = Array.from({ length: 7 }, (_, i) => ({
  d: `D-${6 - i}`,
  bi: 1800 + Math.round(Math.sin(i) * 400),
  cortex: 1200 + Math.round(Math.cos(i / 2) * 300),
  adhoc: 8400 + Math.round(Math.sin(i / 1.5) * 2000),
}))

// ── Cortex calls trend ──────────────────────────────────────────────────────
const cortexCallsTrend = [
  { m: 'Jun', analyst: 280, search: 120, agents: 40 },
  { m: 'Jul', analyst: 320, search: 160, agents: 60 },
  { m: 'Aug', analyst: 380, search: 210, agents: 90 },
  { m: 'Sep', analyst: 440, search: 280, agents: 130 },
  { m: 'Oct', analyst: 510, search: 360, agents: 180 },
  { m: 'Nov', analyst: 590, search: 440, agents: 240 },
]

// ── Marketplace / integration share ────────────────────────────────────────
const integrationTypes = [
  { type: 'Openflow CDC',       count: 6,  status: 'Active' },
  { type: 'Snowpipe Streaming', count: 12, status: 'Active' },
  { type: 'S3 Snowpipe',        count: 8,  status: 'Active' },
  { type: 'REST connectors',    count: 4,  status: 'Active' },
  { type: 'Marketplace inbound',count: 6,  status: 'Active' },
  { type: 'Reverse-ETL (Hightouch)', count: 12, status: 'Active' },
  { type: 'Direct share outbound',   count: 2,  status: 'Active' },
]

// ── Credit by warehouse ─────────────────────────────────────────────────────
const creditByWh = [
  { wh: 'WH_INGEST_XL',    credits: 412 },
  { wh: 'WH_TRANSFORM_L',  credits: 286 },
  { wh: 'WH_BI_M',         credits: 198 },
  { wh: 'WH_CORTEX_L',     credits: 142 },
  { wh: 'WH_ML_GPU_M',     credits: 96 },
  { wh: 'WH_AD_HOC_S',     credits: 64 },
  { wh: 'WH_PORTAL_XS',    credits: 22 },
]

// ── Iceberg tables ──────────────────────────────────────────────────────────
const icebergTables = [
  { name: 'NETWORK_EVENTS_ICEBERG',   catalog: 'S3 / Glue',    size: '1.2 TB',  rows: '8.4B',  freq: 'streaming', status: 'Active' },
  { name: 'BILLING_ARCHIVE_ICEBERG',  catalog: 'S3 / Glue',    size: '0.8 TB',  rows: '2.1B',  freq: 'daily',     status: 'Active' },
  { name: 'TELEMETRY_DELTA_ICEBERG',  catalog: 'Unity (ADLS)', size: '2.4 TB',  rows: '18.6B', freq: 'streaming', status: 'Active' },
  { name: 'CRM_EXTERNAL_ICEBERG',     catalog: 'Polaris REST',  size: '0.2 TB',  rows: '140M',  freq: 'hourly',    status: 'Active' },
]

// ── Security posture trend ──────────────────────────────────────────────────
const securityTrend = [
  { m: 'Jun', score: 74, violations: 8 },
  { m: 'Jul', score: 76, violations: 6 },
  { m: 'Aug', score: 79, violations: 5 },
  { m: 'Sep', score: 82, violations: 4 },
  { m: 'Oct', score: 85, violations: 2 },
  { m: 'Nov', score: 88, violations: 1 },
]

function Icon({ Cmp, color }: { Cmp: any; color: string }) {
  return <div className={`w-7 h-7 rounded-md grid place-items-center ${color} shrink-0`}><Cmp className="w-3.5 h-3.5" /></div>
}

export default function PlatformArchitecturePage() {
  const [tab, setTab] = useState<TabId>(() => (localStorage.getItem('arch-tab') as TabId) || 'overview')
  const [creditSort, setCreditSort] = useState<'credits' | 'wh'>('credits')
  const [latencyMetric, setLatencyMetric] = useState<'p50' | 'p95'>('p95')
  const [storageDb, setStorageDb] = useState<'all' | 'raw' | 'core' | 'analytics'>('all')
  const [icebergFilter, setIcebergFilter] = useState<'all' | 'streaming' | 'daily'>('all')
  const [liveTime, setLiveTime] = useState('')
  const [alertDismissed, setAlertDismissed] = useState(false)

  useEffect(() => { localStorage.setItem('arch-tab', tab) }, [tab])
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedCredits = useMemo(
    () => [...creditByWh].sort((a, b) => creditSort === 'credits' ? b.credits - a.credits : a.wh.localeCompare(b.wh)),
    [creditSort],
  )
  const filteredLatency = useMemo(
    () => latencyMetric === 'p50'
      ? transformLatency.map(r => ({ ...r, val: r.p50 }))
      : transformLatency.map(r => ({ ...r, val: r.p95 })),
    [latencyMetric],
  )
  const filteredIceberg = useMemo(
    () => icebergFilter === 'all' ? icebergTables : icebergTables.filter(t => t.freq === icebergFilter),
    [icebergFilter],
  )
  const storageFiltered = useMemo(
    () => storageDb === 'all' ? storageGrowth : storageGrowth.map(r => ({ m: r.m, [storageDb]: r[storageDb as keyof typeof r] })),
    [storageDb],
  )

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={tt('Data Platform Architecture')}
        subtitle={tt('Cable Bahamas Snowflake-native estate · multi-cluster warehouse · accountadmin-managed')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{tt('HEALTHY · ')}{liveTime}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 font-mono">{tt('Cable Bahamas-DATA_PROD · us-east-1')}</span>
            <Link to="/portal/data-engineering" className="bg-vfes-red text-vfes-dark text-xs font-bold px-3 py-1.5 rounded-lg">{tt('Data Engineering →')}</Link>
          </div>
        }
      />

      {/* MlInsightSection */}
      <MlInsightSection
        heading="Platform intelligence"
        models={[
          { name: 'Query Optimizer', metric: '-18% credits', sub: 'warehouse-level plan analysis' },
          { name: 'Drift Detector',  metric: 'recall 0.93',  sub: 'schema + data drift early warning' },
          { name: 'Cost Forecaster', metric: 'MAPE 3.8%',    sub: '30-day credit projection' },
        ]}
        agentLabel={tt('Run Platform Analyst')}
        agentRunningLabel={tt('Analysing…')}
        agentSteps={[
          tt('Scanned 108 pipeline refresh histories'),
          tt('Ranked cost-optimization opportunities'),
          tt('Cross-referenced storage growth vs query patterns'),
          tt('Generated right-sizing recommendations'),
        ]}
        agentBlurb={tt('One Snowflake estate means the same ML layer that scores churn can also inspect warehouse spend and pipeline lag — no context switching.')}
        decision={{
          title: tt('Right-size WH_ML_GPU_M and cluster FACT_INTERACTIONS'),
          detail: tt('The GPU warehouse is idle 28% of the time outside training windows; shifting to auto-suspend after 30s saves ~BSD 340/wk. Clustering FACT_INTERACTIONS on INTERACTION_DATE reduces p95 prune ratio from 0.18 to an estimated 0.06, cutting BI query times 40%.'),
          impact: tt('~BSD 28K / year savings · 40% BI speed-up'),
          risk: tt('Cluster build requires 4-hr maintenance window'),
          linkTo: '/portal/cost',
          linkLabel: tt('Open Cost Intelligence'),
        }}
        chart={{
          kind: 'line',
          title: tt('Credit consumption trend — 14 days by warehouse'),
          xKey: 'd',
          data: Array.from({ length: 14 }, (_, i) => ({
            d: `D-${13 - i}`,
            ingest: 380 + Math.round(Math.sin(i / 2) * 60),
            transform: 280 + Math.round(Math.cos(i / 3) * 40),
            bi: 184 + Math.round(Math.sin(i / 4) * 30),
          })),
          series: [
            { key: 'ingest',    name: tt('WH_INGEST_XL'),    color: BLUE },
            { key: 'transform', name: tt('WH_TRANSFORM_L'),  color: NAVY },
            { key: 'bi',        name: tt('WH_BI_M'),         color: GREEN },
          ],
          note: tt('Spikes on D-4 and D-11 correlate with ML training jobs — auto-suspend opportunity.'),
        }}
      />

      {/* Alert banner */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">{tt('FACT_NETWORK_KPI DT refresh p95 = 1m 24s · WH_ML_GPU_M idle 28%')}</div>
              <div className="text-xs text-amber-800 mt-1">{tt('Pipeline approaching SLO limit. Credit optimisation review recommended.')}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/observability" className="text-xs font-bold text-amber-900 hover:underline">{tt('Observability →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Platform KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label={tt('Storage')}                value="7.4 TB"    delta={tt('+0.3 TB / week')}           trend="flat" icon={HardDrive} />
        <KpiCard label={tt('Credits / day')}          value="1,840"     delta={tt('-6% MoM after right-sizing')}trend="up"  icon={BarChart2} accent />
        <KpiCard label={tt('Pipelines')}              value="108"       delta={tt('96 healthy · 12 SLO risk')}  trend="flat" icon={Workflow} />
        <KpiCard label={tt('ML models')}              value="14"        delta={tt('4 prod · 6 staging')}        trend="up"  icon={Brain} />
        <KpiCard label={tt('Cortex calls MTD')}       value="4.6M"      delta={tt('p95 1.2s · 99.7% success')} trend="up"  icon={Sparkles} />
        <KpiCard label={tt('Data freshness')}         value="7 min"     delta={tt('CORE p95 lag 12m · OK')}     trend="up"  icon={Activity} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow shadow-vfes-red/20' : 'text-vfes-dark/65 hover:bg-black/5'}`}>
            <t.icon className="w-4 h-4" />{tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="rounded-xl bg-white border border-black/5 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Reference architecture — left → right data flow')}</h3>
            <span className="text-xs text-vfes-dark/55">{tt('click any node to drill into the catalog')}</span>
          </div>
          <div className="grid grid-cols-7 gap-2 min-w-[1100px] overflow-x-auto">
            {lanes.map((lane) => (
              <div key={lane.name} className={`rounded-xl border bg-gradient-to-b ${lane.color} p-3`}>
                <div className="text-[11px] uppercase tracking-widest font-extrabold text-vfes-dark/80">{tt(lane.name)}</div>
                <div className="text-[10px] text-vfes-dark/55 mb-3">{lane.sub}</div>
                <div className="space-y-1.5">
                  {lane.nodes.map((n, i) => (
                    <div key={i} className="rounded-md bg-white border border-black/10 p-2 hover:shadow-sm cursor-pointer transition">
                      <div className="flex items-center gap-2">
                        <Icon Cmp={n.icon} color="bg-vfes-dark/5 text-vfes-dark" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold truncate">{n.n}</div>
                          <div className="text-[10px] text-vfes-dark/55 truncate font-mono">{n.meta}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl bg-white border border-black/5 p-5 lg:col-span-2">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Compute footprint — warehouses')}</h3>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-2">{tt('Warehouse')}</th><th>{tt('Size')}</th><th>{tt('Auto-scale')}</th><th>{tt('Workload')}</th><th>{tt('Credits 7d')}</th><th>{tt('Status')}</th></tr>
              </thead>
              <tbody>
                {[
                  { n: 'WH_INGEST_XL',   s: 'X-Large', a: '2-6 cluster', w: 'Snowpipe + dbt + DT refresh',  c: 412, st: 'Active' },
                  { n: 'WH_TRANSFORM_L', s: 'Large',   a: '1-3 cluster', w: 'dbt run · Snowpark',           c: 286, st: 'Active' },
                  { n: 'WH_BI_M',        s: 'Medium',  a: '1-4 cluster', w: 'Power BI + Tableau live',      c: 198, st: 'Active' },
                  { n: 'WH_CORTEX_L',    s: 'Large',   a: '1-2 cluster', w: 'Cortex Analyst + Search',      c: 142, st: 'Active' },
                  { n: 'WH_ML_GPU_M',    s: 'GPU M',   a: '1-2 cluster', w: 'Snowpark ML training',         c: 96,  st: 'Idle'   },
                  { n: 'WH_AD_HOC_S',    s: 'Small',   a: '1-2 cluster', w: 'Analyst exploration',          c: 64,  st: 'Active' },
                  { n: 'WH_PORTAL_XS',   s: 'X-Small', a: '1 cluster',   w: 'Streamlit-in-Snowflake',       c: 22,  st: 'Active' },
                ].map((w) => (
                  <tr key={w.n} className="border-t border-black/5">
                    <td className="py-2 font-mono text-[12px]">{w.n}</td>
                    <td className="text-[12px]">{w.s}</td>
                    <td className="text-[12px] text-vfes-dark/70">{w.a}</td>
                    <td className="text-[12px] text-vfes-dark/70">{w.w}</td>
                    <td className="font-bold">{w.c}</td>
                    <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.st === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{tt(w.st)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-white border border-black/5 p-5">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Governance — Horizon')}</h3>
            <div className="space-y-2 text-sm">
              <Row k={tt('Policies — masking')}     v="14 active"               icon={ShieldCheck} />
              <Row k={tt('Policies — row access')}  v="6 active"                icon={ShieldCheck} />
              <Row k={tt('Tags applied')}            v="248 across 92 tables"    icon={Box} />
              <Row k={tt('Classified columns')}      v="91% of PII candidates"   icon={Eye} />
              <Row k={tt('Object contacts')}         v="100% prod tables"        icon={ShieldCheck} />
              <Row k={tt('Trust Center scanners')}   v="22 enabled · all green"  icon={ShieldCheck} />
              <Row k={tt('Network policy')}          v="CBL_CORP_VPN + EU_BUSINESS" icon={ShieldCheck} />
              <Row k={tt('MFA / SSO')}               v="100% / Okta SAML"        icon={ShieldCheck} />
              <Row k={tt('Periodic rekeying')}       v="Enabled · last 14d ago"  icon={ShieldCheck} />
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
              <Link to="/portal/data-quality" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
              <Link to="/portal/data-contracts" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Credits by warehouse — 7 days')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={sortedCredits} layout="vertical">
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="wh" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="credits" name={tt('Credits')} radius={[0, 4, 4, 0]}>
                    {sortedCredits.map((r, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE, '#94a3b8'][i % 7]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-widest">
              <span className="font-bold text-vfes-dark/55">{tt('Sort:')}</span>
              {(['credits', 'wh'] as const).map(k => (
                <button key={k} onClick={() => setCreditSort(k)} className={`px-2 py-0.5 rounded font-bold ${creditSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(k)}</button>
              ))}
            </div>
            <Link to="/portal/cost" className="mt-2 text-xs font-bold text-vfes-dark hover:underline block">{tt('Full Cost Intelligence →')}</Link>
          </Panel>

          <Panel title={tt('Mobile / RAN data flow')}>
            <div className="grid md:grid-cols-3 gap-3">
              {MOBILE_ARCHITECTURE.map((s, i) => (
                <div key={s.stage} className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1.5">{i + 1}. {tt(s.stage)}</div>
                  <div className="text-xs font-semibold mb-1">{tt(s.description)}</div>
                  <div className="text-[10px] text-vfes-dark/55">{s.tech}</div>
                </div>
              ))}
            </div>
            <Link to="/portal/data-engineering" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Data Engineering →')}</Link>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-4 border-t border-black/5">
          {tt('Cable Bahamas-DATA_PROD · us-east-1 · enterprise edition · 7.4 TB storage · 4,200 daily query volume · refreshed 02:00 UTC')}
        </div>
      </>)}

      {/* ══ INGESTION ═════════════════════════════════════════════════════════ */}
      {tab === 'ingestion' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Records / day')}   value="8.4 B"       delta={tt('Snowpipe streaming + Kafka')}   trend="up"   icon={Zap} accent />
          <KpiCard label={tt('Bytes / day')}      value="684 GB"      delta={tt('compressed')}                   trend="flat" icon={HardDrive} />
          <KpiCard label={tt('Active channels')} value="12"          delta={tt('0 paused')}                    trend="flat" icon={Cloud} />
          <KpiCard label={tt('Ingest p99 lag')}  value="8.4 sec"     delta={tt('streaming target ≤30s')}        trend="up"   icon={Activity} />
        </div>

        <Panel title={tt('Ingestion throughput trend — 14 days')}>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={ingestionTrend}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="streaming" name={tt('Kafka streaming (K/min)')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                <Area type="monotone" dataKey="s3"        name={tt('S3 Snowpipe (K/min)')}     stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                <Area type="monotone" dataKey="cdc"       name={tt('Openflow CDC (K/min)')}    stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6 rounded-xl bg-white border border-black/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Connectors & channels — status')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
              <tr><th className="px-5 py-2.5">{tt('Source')}</th><th>{tt('Type')}</th><th>{tt('Target')}</th><th>{tt('Records/5m')}</th><th>{tt('Lag p95')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { src: 'amdocs.crm.customers',    ty: 'Openflow CDC',         tgt: 'CBL_RAW.CRM.CUSTOMERS_RAW',      r: '1,840',   lag: '12s',  st: 'ok' },
                { src: 'cisco.bss.invoices',       ty: 'Openflow CDC',         tgt: 'CBL_RAW.BILLING.INVOICES_RAW',   r: '2,212',   lag: '18s',  st: 'ok' },
                { src: 'kafka.cmts.telemetry',     ty: 'Snowpipe Streaming',   tgt: 'CBL_RAW.NETWORK.CMTS_TELEMETRY', r: '4.2M',    lag: '6s',   st: 'ok' },
                { src: 'kafka.oss.alarms',         ty: 'Snowpipe Streaming',   tgt: 'CBL_RAW.NETWORK.OSS_ALARMS',     r: '1.8M',    lag: '8s',   st: 'ok' },
                { src: 'adobe.analytics.pageviews',ty: 'S3 Snowpipe',          tgt: 'CBL_RAW.WEB.PAGEVIEWS_RAW',      r: '684K',    lag: '4m',   st: 'ok' },
                { src: 'salesforce.b2b',           ty: 'REST connector',       tgt: 'CBL_RAW.CRM.SF_B2B_RAW',         r: '12',      lag: '28m',  st: 'warn' },
                { src: 'netsuite.gl',              ty: 'REST API job',         tgt: 'CBL_RAW.FIN.GL_RAW',             r: '184',     lag: '54m',  st: 'ok' },
                { src: 'tomorrow.io.weather',      ty: 'Marketplace share',    tgt: 'CBL_SHARES.INBOUND.WEATHER',     r: '— (share)',lag: '—',   st: 'ok' },
              ].map((r) => (
                <tr key={r.src} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="px-5 py-2 font-mono text-[12px] font-semibold">{r.src}</td>
                  <td className="text-[12px]">{tt(r.ty)}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/65">{r.tgt}</td>
                  <td className="font-mono text-[12px] font-bold">{r.r}</td>
                  <td className="font-mono text-[11px]">{r.lag}</td>
                  <td><span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${r.st === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.st}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-3">
          <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
          <Link to="/portal/observability"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/lineage"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>
      </>)}

      {/* ══ STORAGE / ICEBERG ═════════════════════════════════════════════════ */}
      {tab === 'storage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Total storage')}    value="7.4 TB"    delta={tt('+0.3 TB/week')}          trend="flat" icon={HardDrive} accent />
          <KpiCard label={tt('CBL_RAW')}          value="5.2 TB"    delta={tt('landing zone')}           trend="flat" icon={Database} />
          <KpiCard label={tt('CBL_CORE')}         value="1.4 TB"    delta={tt('conformed models')}       trend="up"   icon={Layers} />
          <KpiCard label={tt('Iceberg tables')}   value="4 active"  delta={tt('S3 + ADLS + Polaris')}    trend="up"   icon={Box} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Storage growth — 6 months (TB)')}>
            <div className="flex gap-2 mb-3">
              {(['all', 'raw', 'core', 'analytics'] as const).map(k => (
                <button key={k} onClick={() => setStorageDb(k)} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${storageDb === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(k)}</button>
              ))}
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={storageFiltered}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" TB" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {storageDb === 'all' || storageDb === 'raw'       ? <Area type="monotone" dataKey="raw"       name={tt('RAW')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} /> : null}
                  {storageDb === 'all' || storageDb === 'core'      ? <Area type="monotone" dataKey="core"      name={tt('CORE')}      stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} /> : null}
                  {storageDb === 'all' || storageDb === 'analytics' ? <Area type="monotone" dataKey="analytics" name={tt('ANALYTICS')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} /> : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Iceberg / external tables')}>
            <div className="flex gap-2 mb-3">
              {(['all', 'streaming', 'daily'] as const).map(k => (
                <button key={k} onClick={() => setIcebergFilter(k)} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${icebergFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(k)}</button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-1.5">{tt('Table')}</th><th>{tt('Catalog')}</th><th>{tt('Size')}</th><th>{tt('Rows')}</th><th>{tt('Freq')}</th><th>{tt('Status')}</th></tr>
              </thead>
              <tbody>
                {filteredIceberg.map((t) => (
                  <tr key={t.name} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-bold">{t.name}</td>
                    <td className="text-[11px] text-vfes-dark/65">{t.catalog}</td>
                    <td className="font-mono text-[11px]">{t.size}</td>
                    <td className="font-mono text-[11px]">{t.rows}</td>
                    <td className="text-[11px]">{tt(t.freq)}</td>
                    <td><span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{tt(t.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/portal/iceberg" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Open Iceberg Catalog →')}</Link>
          </Panel>
        </div>

        <Panel title={tt('Database / schema inventory')}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-1.5">{tt('Database')}</th><th>{tt('Schema')}</th><th>{tt('Tables')}</th><th>{tt('Size')}</th><th>{tt('Last modified')}</th><th>{tt('Owner')}</th></tr>
            </thead>
            <tbody>
              {[
                { db: 'CBL_RAW',       sc: 'CRM',       t: 24,  size: '412 GB', mod: '2 sec ago',  own: 'INGEST_ROLE' },
                { db: 'CBL_RAW',       sc: 'BILLING',   t: 18,  size: '1.2 TB', mod: '12 sec ago', own: 'INGEST_ROLE' },
                { db: 'CBL_RAW',       sc: 'NETWORK',   t: 8,   size: '4.6 TB', mod: '1 sec ago',  own: 'INGEST_ROLE' },
                { db: 'CBL_CORE',      sc: 'CONFORMED', t: 42,  size: '0.9 TB', mod: '2 min ago',  own: 'TRANSFORM_ROLE' },
                { db: 'CBL_ANALYTICS', sc: 'CUSTOMER',  t: 18,  size: '280 GB', mod: '24 min ago', own: 'ANALYTICS_ROLE' },
                { db: 'CBL_ANALYTICS', sc: 'PRODUCT',   t: 8,   size: '48 GB',  mod: '8 min ago',  own: 'ANALYTICS_ROLE' },
                { db: 'CBL_ANALYTICS', sc: 'B2B',       t: 12,  size: '84 GB',  mod: '6 min ago',  own: 'ANALYTICS_ROLE' },
                { db: 'CBL_ML',        sc: 'FEATURES',  t: 24,  size: '112 GB', mod: '04:00 UTC',  own: 'ML_ROLE' },
              ].map((r) => (
                <tr key={`${r.db}.${r.sc}`} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="py-2 font-mono text-[12px] font-bold">{r.db}</td>
                  <td className="font-mono text-[11px]">{r.sc}</td>
                  <td className="font-bold">{r.t}</td>
                  <td className="font-mono text-[11px]">{r.size}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/55">{r.mod}</td>
                  <td className="text-[11px] text-vfes-dark/65">{r.own}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/portal/catalog" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Open Data Catalog →')}</Link>
        </Panel>
      </>)}

      {/* ══ TRANSFORM ═════════════════════════════════════════════════════════ */}
      {tab === 'transform' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Dynamic tables')}  value="42"        delta={tt('38/42 within SLO')}       trend="up"   icon={Workflow} accent />
          <KpiCard label={tt('dbt models')}      value="184"       delta={tt('96% test coverage')}      trend="up"   icon={FileCode} />
          <KpiCard label={tt('Snowpark jobs')}   value="12"        delta={tt('daily 04:00 UTC')}        trend="flat" icon={Cpu} />
          <KpiCard label={tt('Avg refresh')}     value="3m 42s"    delta={tt('p95 last 7d')}            trend="up"   icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Transform pipeline latency')}>
            <div className="flex gap-2 mb-3">
              {(['p50', 'p95'] as const).map(k => (
                <button key={k} onClick={() => setLatencyMetric(k)} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${latencyMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(k)}</button>
              ))}
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={filteredLatency} layout="vertical">
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="s" />
                  <YAxis type="category" dataKey="job" tick={{ fontSize: 9 }} width={160} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="val" name={tt(latencyMetric)} radius={[0, 4, 4, 0]}>
                    {filteredLatency.map((r, i) => <Cell key={i} fill={r.val > r.slo * 0.9 ? AMBER : r.val > r.slo ? '#ef4444' : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('dbt model layers')}>
            <div className="space-y-3 text-sm">
              {[
                { l: 'staging  (stg_*)',    c: 12, desc: tt('Raw → typed, deduped, renamed') },
                { l: 'intermediate (int_*)',c: 96, desc: tt('Business logic & joins') },
                { l: 'marts.dim_*',          c: 18, desc: tt('Conformed dimensions (SCD-2)') },
                { l: 'marts.fact_*',         c: 24, desc: tt('Conformed facts') },
                { l: 'marts.<domain>_360',   c: 22, desc: tt('360 wide tables for serving') },
                { l: 'snapshots',            c: 12, desc: tt('Type-2 snapshots (90d retention)') },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-xs"><span className="font-mono font-bold">{r.l}</span><span className="font-mono text-vfes-dark/55">{r.c}</span></div>
                  <div className="h-1.5 bg-[#f3f4f7] rounded"><div className="h-1.5 bg-vfes-red rounded" style={{ width: `${(r.c / 96) * 100}%` }} /></div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>
            <Link to="/portal/lineage" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Data Lineage →')}</Link>
          </Panel>
        </div>

        <Panel title={tt('Snowpark jobs — schedule & health')}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-1.5">{tt('Job')}</th><th>{tt('Schedule')}</th><th>{tt('Language')}</th><th>{tt('Avg dur')}</th><th>{tt('Last run')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { j: 'sp_build_customer_features', sc: 'CRON 0 4 * * *', lang: 'Python', dur: '4m 12s', last: '04:14 UTC', s: 'ok' },
                { j: 'sp_fraud_scoring',           sc: 'every 15 min',   lang: 'Python', dur: '1m 08s', last: '4 min ago',  s: 'ok' },
                { j: 'sp_churn_batch_score',       sc: 'CRON 0 3 * * *', lang: 'Python', dur: '6m 44s', last: '03:08 UTC', s: 'ok' },
                { j: 'sp_revenue_assurance',       sc: 'CRON 0 6 * * *', lang: 'Python', dur: '2m 24s', last: '06:04 UTC', s: 'ok' },
                { j: 'sp_network_kpi_daily',       sc: 'CRON 30 4 * * *',lang: 'Python', dur: '3m 18s', last: '04:32 UTC', s: 'warn' },
                { j: 'sp_build_product_360',       sc: 'CRON 0 3 * * *', lang: 'SQL',    dur: '1m 02s', last: '03:04 UTC', s: 'ok' },
              ].map((r) => (
                <tr key={r.j} className="border-t border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-bold">{r.j}</td>
                  <td className="font-mono text-[11px]">{r.sc}</td>
                  <td className="text-[11px]">{r.lang}</td>
                  <td className="font-mono text-[11px]">{r.dur}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/55">{r.last}</td>
                  <td><span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${r.s === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.s)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/portal/data-engineering" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Data Engineering →')}</Link>
        </Panel>
      </>)}

      {/* ══ SERVING / MARTS ═══════════════════════════════════════════════════ */}
      {tab === 'serving' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Mart tables')}      value="76"        delta={tt('6 domain marts')}          trend="flat" icon={Layers} accent />
          <KpiCard label={tt('Queries / day')}    value="4,200"     delta={tt('p95 2.4s')}                trend="up"   icon={Activity} />
          <KpiCard label={tt('BI workspaces')}    value="12"        delta={tt('Power BI + Tableau')}       trend="flat" icon={BarChart2} />
          <KpiCard label={tt('Semantic views')}   value="8"         delta={tt('156 metrics defined')}     trend="up"   icon={Eye} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Query performance — BI vs Cortex vs Ad-hoc (p95 ms)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={queryPerf}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="bi"     name={tt('BI queries')}     stroke={BLUE}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cortex" name={tt('Cortex Analyst')} stroke={PURPLE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="adhoc"  name={tt('Ad-hoc')}         stroke={AMBER} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Mart table directory')} action={<Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark">{tt('Catalog →')}</Link>}>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-1.5">{tt('Mart table')}</th><th>{tt('Rows')}</th><th>{tt('Refresh')}</th><th>{tt('Consumers')}</th></tr>
              </thead>
              <tbody>
                {[
                  { t: 'CUSTOMER_360',  r: '1.04M',  ref: '03:00 UTC',  c: 'BI · Agent · App' },
                  { t: 'PRODUCT_360',   r: '14.2K',  ref: '03:00 UTC',  c: 'BI · SI' },
                  { t: 'B2B_360',       r: '3.8K',   ref: '03:30 UTC',  c: 'B2B Portal' },
                  { t: 'PEOPLE_360',    r: '1.84K',  ref: '05:00 UTC',  c: 'HR Portal' },
                  { t: 'EXEC_360',      r: '12 views',ref: '06:00 UTC', c: 'SI · Streamlit' },
                  { t: 'RISK_360',      r: '4.2K',   ref: '04:30 UTC',  c: 'Risk dashboard' },
                ].map((r) => (
                  <tr key={r.t} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-bold">{r.t}</td>
                    <td className="font-mono text-[11px]">{r.r}</td>
                    <td className="font-mono text-[11px] text-vfes-dark/55">{r.ref}</td>
                    <td className="text-[11px] text-vfes-dark/65">{r.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/portal/semantic-views" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
          <Link to="/portal/data-products"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
          <Link to="/portal/catalog"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
        </div>
      </>)}

      {/* ══ INTELLIGENCE / AI ═════════════════════════════════════════════════ */}
      {tab === 'intelligence' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Cortex calls MTD')} value="4.6M"    delta={tt('p95 1.2s')}                  trend="up"   icon={Sparkles} accent />
          <KpiCard label={tt('Agents active')}    value="9"       delta={tt('SI tile enabled')}            trend="up"   icon={Bot} />
          <KpiCard label={tt('ML models prod')}   value="4"       delta={tt('14 total in registry')}       trend="flat" icon={Brain} />
          <KpiCard label={tt('Search corpora')}   value="24"      delta={tt('6 search services')}          trend="up"   icon={Search} />
        </div>

        <Panel title={tt('Cortex calls trend — monthly (K)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={cortexCallsTrend}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="K" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="analyst" name={tt('Cortex Analyst')} stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} />
                <Area type="monotone" dataKey="search"  name={tt('Cortex Search')}  stroke={GREEN}  fill={GREEN}  fillOpacity={0.15} />
                <Area type="monotone" dataKey="agents"  name={tt('Agents')}         stroke={PURPLE} fill={PURPLE} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('ML model registry')}>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-1.5">{tt('Model')}</th><th>{tt('Stage')}</th><th>{tt('Metric')}</th><th>{tt('Served via')}</th></tr>
              </thead>
              <tbody>
                {[
                  { m: 'ChurnPredictor v3.2',   s: 'prod',    kpi: 'AUC 0.91',    sv: 'Snowpark UDTF' },
                  { m: 'FraudScorer v1.8',       s: 'prod',    kpi: 'F1 0.88',     sv: 'Streaming UDTF' },
                  { m: 'BundlePropensity v2.1',  s: 'prod',    kpi: 'NDCG 0.84',   sv: 'Task daily' },
                  { m: 'ARPUForecaster v1.4',    s: 'prod',    kpi: 'MAPE 4.1%',   sv: 'Task daily' },
                  { m: 'NetworkAnomaly v2.0',    s: 'staging', kpi: 'recall 0.90', sv: 'Pending' },
                  { m: 'CapacityForecast v1.1',  s: 'staging', kpi: 'MAPE 4.6%',   sv: 'Pending' },
                ].map((r) => (
                  <tr key={r.m} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-bold">{r.m}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.s === 'prod' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.s)}</span></td>
                    <td className="font-mono text-[11px]">{r.kpi}</td>
                    <td className="text-[11px] text-vfes-dark/65">{r.sv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/portal/ai-insights" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('AI Insights →')}</Link>
          </Panel>

          <Panel title={tt('Cortex agents directory')}>
            <div className="space-y-2">
              {[
                { name: 'Customer 360 Agent',      tool: 'Cortex Search + Analyst', status: 'Active' },
                { name: 'Network NOC Agent',        tool: 'Cortex Search + AISQL',   status: 'Active' },
                { name: 'Billing Assist Agent',     tool: 'Analyst + Documents',     status: 'Active' },
                { name: 'CTO Planner Agent',        tool: 'Analyst + ML registry',   status: 'Active' },
                { name: 'Risk Compliance Agent',    tool: 'Search + AISQL',          status: 'Active' },
                { name: 'HR Workforce Agent',       tool: 'Analyst',                 status: 'Active' },
                { name: 'Procurement Agent',        tool: 'Search + Documents',      status: 'Active' },
                { name: 'Sustainability ESG Agent', tool: 'Analyst + Search',        status: 'Staging' },
                { name: 'Revenue Assurance Agent',  tool: 'AISQL + Analyst',         status: 'Staging' },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between text-xs border-b border-black/5 py-1.5">
                  <div className="font-semibold">{tt(a.name)}</div>
                  <div className="text-vfes-dark/55">{a.tool}</div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(a.status)}</span>
                </div>
              ))}
            </div>
            <Link to="/portal/agents" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Cortex Agents →')}</Link>
          </Panel>
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          <Link to="/portal/caio"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/semantic-views" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('ML model performance — prod models')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { model: 'ChurnPredictor',    auc: 0.91, f1: 0.88 },
                  { model: 'FraudScorer',        auc: 0.89, f1: 0.88 },
                  { model: 'BundlePropensity',   auc: 0.86, f1: 0.82 },
                  { model: 'ARPUForecaster',     auc: 0.94, f1: 0.91 },
                ]}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="model" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0.7, 1.0]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="auc" name={tt('AUC')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="f1"  name={tt('F1')}  fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Data freshness SLA — marts')}>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-1.5">{tt('Table')}</th><th>{tt('SLO lag')}</th><th>{tt('Actual')}</th><th>{tt('Status')}</th></tr>
              </thead>
              <tbody>
                {[
                  { t: 'FACT_INTERACTIONS',  slo: '5 min',  actual: '2 min',  s: 'ok' },
                  { t: 'FACT_BILLING',        slo: '15 min', actual: '6 min',  s: 'ok' },
                  { t: 'FACT_NETWORK_KPI',    slo: '5 min',  actual: '4.5 min',s: 'warn' },
                  { t: 'CUSTOMER_360',        slo: '60 min', actual: '22 min', s: 'ok' },
                  { t: 'PRODUCT_360',         slo: '60 min', actual: '11 min', s: 'ok' },
                  { t: 'EXEC_360',            slo: '1 day',  actual: '1.1h',   s: 'ok' },
                  { t: 'RISK_360',            slo: '1 day',  actual: '1.0h',   s: 'ok' },
                  { t: 'CHURN_LIST_DAILY',    slo: '1 day',  actual: '4.4h',   s: 'ok' },
                ].map((r) => (
                  <tr key={r.t} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-bold">{r.t}</td>
                    <td className="font-mono text-[11px] text-vfes-dark/55">{r.slo}</td>
                    <td className="font-mono text-[11px] font-semibold">{r.actual}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.s === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.s)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/portal/observability" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Observability →')}</Link>
          </Panel>
        </div>
      </>)}

      {/* ══ INTEGRATIONS ══════════════════════════════════════════════════════ */}
      {tab === 'integrations' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Total integrations')} value="50"     delta={tt('all healthy')}             trend="up"   icon={Globe2} accent />
          <KpiCard label={tt('Inbound shares')}     value="6"      delta={tt('Marketplace listings')}   trend="flat" icon={Cloud} />
          <KpiCard label={tt('Reverse-ETL syncs')}  value="12"     delta={tt('Hightouch · CRM + Mktg')} trend="up"   icon={GitBranch} />
          <KpiCard label={tt('BI workspaces')}      value="12"     delta={tt('Power BI + Tableau')}      trend="flat" icon={BarChart2} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Integration inventory')}>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <tr><th className="py-1.5">{tt('Type')}</th><th>{tt('Count')}</th><th>{tt('Status')}</th></tr>
              </thead>
              <tbody>
                {integrationTypes.map((r) => (
                  <tr key={r.type} className="border-t border-black/5">
                    <td className="py-1.5 font-semibold text-[12px]">{tt(r.type)}</td>
                    <td className="font-bold">{r.count}</td>
                    <td><span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={tt('Consumption apps — directory')}>
            <div className="space-y-2">
              {[
                { app: 'Streamlit-in-Snowflake portal',     t: 'SiS',           st: 'Active' },
                { app: 'Power BI Premium — 8 workspaces',   t: 'BI DirectQuery', st: 'Active' },
                { app: 'Tableau Cloud — 4 workbooks',       t: 'BI live',        st: 'Active' },
                { app: 'Snowflake Intelligence SI tiles',    t: 'SI',             st: 'Active' },
                { app: 'Reverse-ETL Hightouch — CRM',       t: 'Reverse-ETL',    st: 'Active' },
                { app: 'Snowflake Marketplace listing',      t: 'Data Share',     st: 'Active' },
              ].map((a) => (
                <div key={a.app} className="flex items-center justify-between text-xs border-b border-black/5 py-1.5">
                  <div className="font-semibold">{tt(a.app)}</div>
                  <div className="text-vfes-dark/55">{a.t}</div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{tt(a.st)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/portal/apps"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Apps →')}</Link>
          <Link to="/portal/environments"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Environments →')}</Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Integration count by type')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={integrationTypes}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Count')} radius={[4, 4, 0, 0]}>
                    {integrationTypes.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE, '#94a3b8'][i % 7]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cortex Analyst calls — monthly trend (K)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={cortexCallsTrend}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="analyst" name={tt('Analyst')} stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} />
                  <Area type="monotone" dataKey="agents"  name={tt('Agents')}  stroke={PURPLE} fill={PURPLE} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ SECURITY / HORIZON ════════════════════════════════════════════════ */}
      {tab === 'security' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={tt('Security score')}   value="88 / 100" delta={tt('+14 pts YTD')}             trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Masking policies')} value="14"       delta={tt('active')}                  trend="flat" icon={Lock} />
          <KpiCard label={tt('PII classified')}   value="91%"      delta={tt('of candidates')}           trend="up"   icon={Eye} />
          <KpiCard label={tt('Trust Center')}     value="22 / 22"  delta={tt('scanners green')}          trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Security posture trend — monthly')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={securityTrend}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[60, 100]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="score"      name={tt('Security score')} stroke={GREEN} strokeWidth={2.4} dot />
                  <Line yAxisId="r" type="monotone" dataKey="violations" name={tt('Violations')}     stroke={AMBER} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Horizon governance summary')}>
            <div className="space-y-2 text-sm">
              <Row k={tt('Masking policies')}          v="14 active"              icon={ShieldCheck} />
              <Row k={tt('Row access policies')}       v="6 active"               icon={ShieldCheck} />
              <Row k={tt('Tags applied')}              v="248 across 92 tables"   icon={Box} />
              <Row k={tt('Classified columns')}        v="91% PII candidates"     icon={Eye} />
              <Row k={tt('Object contacts')}           v="100% prod tables"       icon={ShieldCheck} />
              <Row k={tt('Trust Center scanners')}     v="22 enabled · all green" icon={ShieldCheck} />
              <Row k={tt('Network policy')}            v="CBL_CORP_VPN + Bahamas"      icon={Lock} />
              <Row k={tt('MFA / SSO')}                 v="100% / Okta SAML"       icon={ShieldCheck} />
              <Row k={tt('Periodic rekeying')}         v="Enabled"                icon={Lock} />
            </div>
            <div className="mt-3 flex gap-3 flex-wrap">
              <Link to="/portal/horizon"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
              <Link to="/portal/data-quality"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
              <Link to="/portal/data-contracts" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Snowflake platform tech stack — full reference')}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-1.5">{tt('Layer')}</th><th>{tt('Capability')}</th><th>{tt('Product')}</th><th>{tt('Cable Bahamas usage')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { layer: 'Ingestion',    cap: 'Streaming ingest',           prod: 'Snowpipe Streaming',      usage: '12 channels · 6M ev/min',        s: 'Active' },
                { layer: 'Ingestion',    cap: 'CDC replication',             prod: 'Openflow CDC',            usage: '6 connectors · Oracle + PG',     s: 'Active' },
                { layer: 'Storage',      cap: 'Managed tables',              prod: 'Native Snowflake tables', usage: '7.4 TB · 38 databases',          s: 'Active' },
                { layer: 'Storage',      cap: 'Open table format',           prod: 'Iceberg tables',          usage: '4 tables · S3 + ADLS + Polaris', s: 'Active' },
                { layer: 'Transform',    cap: 'Declarative pipelines',       prod: 'Dynamic Tables',          usage: '42 DTs · 5–60min lag',           s: 'Active' },
                { layer: 'Transform',    cap: 'Python transformation',       prod: 'Snowpark Python',         usage: '12 procedures',                  s: 'Active' },
                { layer: 'Transform',    cap: 'SQL transformation',          prod: 'dbt on Snowflake',        usage: '184 dbt models · CI enabled',    s: 'Active' },
                { layer: 'Intelligence', cap: 'Natural language analytics',  prod: 'Cortex Analyst',          usage: '8 semantic views · 156 metrics', s: 'Active' },
                { layer: 'Intelligence', cap: 'Enterprise search',           prod: 'Cortex Search',           usage: '6 services · 24 corpora',        s: 'Active' },
                { layer: 'Intelligence', cap: 'ML model management',         prod: 'ML Model Registry',       usage: '14 models · 4 prod',             s: 'Active' },
                { layer: 'Intelligence', cap: 'Agentic AI',                  prod: 'Cortex Agents',           usage: '9 agents · SI tile',             s: 'Active' },
                { layer: 'Governance',   cap: 'Data masking',                prod: 'Dynamic Data Masking',    usage: '14 policies',                    s: 'Active' },
                { layer: 'Governance',   cap: 'Row-level security',          prod: 'Row Access Policies',     usage: '6 policies',                     s: 'Active' },
                { layer: 'Governance',   cap: 'Data classification',         prod: 'Horizon classification',  usage: '91% PII classified',             s: 'Active' },
                { layer: 'Governance',   cap: 'Security posture',            prod: 'Trust Center',            usage: '22 scanners · all green',        s: 'Active' },
                { layer: 'Governance',   cap: 'Lineage',                     prod: 'Object lineage',          usage: 'All prod objects tracked',       s: 'Active' },
                { layer: 'Governance',   cap: 'Data contracts',              prod: 'Data Contracts',          usage: '18 scenario contracts',         s: 'Active' },
                { layer: 'Serving',      cap: 'BI integration',              prod: 'Partner Connect (BI)',    usage: 'Power BI + Tableau',             s: 'Active' },
                { layer: 'Serving',      cap: 'App platform',                prod: 'Streamlit-in-Snowflake',  usage: '12 apps live',                   s: 'Active' },
              ].map((r, i) => (
                <tr key={i} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="py-1.5 text-[11px] font-bold text-vfes-dark/70">{tt(r.layer)}</td>
                  <td className="text-[11px]">{tt(r.cap)}</td>
                  <td className="font-mono text-[11px] font-semibold">{r.prod}</td>
                  <td className="text-[11px] text-vfes-dark/65">{r.usage}</td>
                  <td><span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{tt(r.s)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-3 flex-wrap text-[10px]">
            <Link to="/portal/catalog"      className="font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
            <Link to="/portal/lineage"      className="font-bold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
            <Link to="/portal/observability" className="font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* Platform scalability summary — always visible */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Platform scalability — architecture highlights')}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-1.5">{tt('Dimension')}</th><th>{tt('Metric')}</th><th>{tt('Notes')}</th></tr>
            </thead>
            <tbody>
              {[
                { d: 'Peak ingest throughput', m: '6.0 M ev/min',  n: 'Snowpipe Streaming channels auto-scale' },
                { d: 'Concurrent queries',     m: '1,200 peak',    n: 'Multi-cluster auto-scale across 7 WHs' },
                { d: 'Storage scalability',    m: 'Unlimited TB',  n: 'Separation of compute and storage' },
                { d: 'Dynamic Table lag SLO',  m: '5–60 min',      n: 'Incremental refresh, auto-propagated' },
                { d: 'Iceberg interop',         m: '4 open tables', n: 'S3 / ADLS / Polaris REST catalogs' },
                { d: 'BI concurrency',         m: '8 workspaces',  n: 'DirectQuery + LiveConnect · WH_BI_M' },
                { d: 'ML inference p95',       m: '1.1 sec',       n: 'Snowpark UDTF served inline in SQL' },
                { d: 'Cortex p95 latency',     m: '1.2 sec',       n: 'Analyst + Search + Agents combined' },
                { d: 'Fail-over',              m: 'Auto',          n: 'Multi-cluster · instant resume · Business Critical' },
              ].map((r) => (
                <tr key={r.d} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="py-1.5 font-semibold text-[12px]">{tt(r.d)}</td>
                  <td className="font-mono font-bold text-[12px]">{r.m}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(r.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-3 flex-wrap">
            <Link to="/portal/architecture"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Architecture →')}</Link>
            <Link to="/portal/cost"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Cost →')}</Link>
            <Link to="/portal/cdo"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          </div>
        </Panel>

        <Panel title={tt('Quick-links — related pages')}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/portal/data-engineering', label: 'Data Engineering',  desc: 'Pipelines · Jobs · Health' },
              { to: '/portal/catalog',           label: 'Data Catalog',      desc: 'Tables · Lineage · Tags' },
              { to: '/portal/semantic-views',    label: 'Semantic Views',    desc: 'Metrics · NL analytics' },
              { to: '/portal/data-products',     label: 'Data Products',     desc: 'Shareable data packages' },
              { to: '/portal/data-contracts',    label: 'Data Contracts',    desc: 'SLAs · Schema contracts' },
              { to: '/portal/observability',     label: 'Observability',     desc: 'Freshness · Anomalies' },
              { to: '/portal/horizon',           label: 'Horizon',           desc: 'Governance posture' },
              { to: '/portal/cost',              label: 'Cost Intelligence', desc: 'Credits · Spend · Budget' },
              { to: '/portal/iceberg',           label: 'Iceberg Tables',    desc: 'External table catalog' },
              { to: '/portal/agents',            label: 'Cortex Agents',     desc: 'AI agent directory' },
            ].map((l) => (
              <Link key={l.to} to={l.to}
                className="rounded-lg border border-black/5 bg-[#fafbfc] p-3 hover:border-vfes-red/30 hover:bg-vfes-red/5 transition block">
                <div className="text-xs font-bold">{tt(l.label)}</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(l.desc)}</div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-4 border-t border-black/5 mt-4">
        {tt('Cable Bahamas-DATA_PROD · us-east-1 · enterprise edition · 7.4 TB storage · 4,200 daily query volume · refreshed 02:00 UTC')}
      </div>
    </div>
  )
}

function Row({ k, v, icon: Icn }: { k: string; v: string; icon: any }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icn className="w-3.5 h-3.5 text-vfes-dark/50" />
      <span className="text-vfes-dark/70 flex-1">{k}</span>
      <span className="font-bold text-[13px]">{v}</span>
    </div>
  )
}
