import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Box, Cloud, Server, Database, Layers, Activity, Gauge,
  Bell, GitBranch, Zap, AlertTriangle, RefreshCw, HardDrive,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import { MOBILE_ICEBERG } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const CATALOGS = [
  { name: 'CBL_GLUE_CAT',          provider: 'AWS Glue · IRC',                volumes: 1, tables: 12,  refresh: '5 min',     mode: 'read-only' },
  { name: 'CBL_POLARIS_CAT',       provider: 'Snowflake Polaris · OpenCatalog',volumes: 2, tables: 28,  refresh: 'on-change', mode: 'read-write' },
  { name: 'CBL_DATABRICKS_UC',     provider: 'Databricks Unity · IRC',         volumes: 1, tables: 6,   refresh: '15 min',    mode: 'read-only' },
  { name: 'CBL_FABRIC_ONELAKE',    provider: 'Microsoft Fabric · OneLake',     volumes: 1, tables: 4,   refresh: '15 min',    mode: 'read-only' },
]

const VOLUMES = [
  { name: 'EXT_VOL_S3_CBL',       cloud: 'AWS S3',                bucket: 's3://cbl-iceberg-us-east-1/',     region: 'us-east-1',  encryption: 'SSE-KMS', writes: true  },
  { name: 'EXT_VOL_S3_PARTNER',    cloud: 'AWS S3',                bucket: 's3://cbl-shared-us-east-1/',      region: 'us-east-1',  encryption: 'SSE-KMS', writes: false },
  { name: 'EXT_VOL_AZURE_FABRIC',  cloud: 'Azure ADLS',            bucket: 'abfss://cbl@onelake.…',           region: 'eastus2', encryption: 'CMK',     writes: false },
  { name: 'EXT_VOL_GCS_BACKUP',    cloud: 'GCS',                   bucket: 'gs://cbl-backup-us/',             region: 'us-east1',encryption:'CSEK',     writes: false },
]

const ICEBERG_TABLES = [
  { fqn: 'CBL_RAW.EXT.CMTS_EVENTS_ICE',       catalog: 'CBL_POLARIS_CAT',  format: 'Parquet · Iceberg v2', size: '4.6 TB', rows: '12.4 B', last_compact: '02:00', writes: 'Snowflake-managed' },
  { fqn: 'CBL_RAW.EXT.NETSUITE_GL_ICE',        catalog: 'CBL_GLUE_CAT',     format: 'Parquet',              size: '142 GB', rows: '184 M',  last_compact: '02:00', writes: 'external (Glue)' },
  { fqn: 'CBL_AI.EXT.MODEL_FEATURES_ICE',      catalog: 'CBL_POLARIS_CAT',  format: 'Parquet · Iceberg v2', size: '612 GB', rows: '1.04 B', last_compact: '02:00', writes: 'Snowflake-managed' },
  { fqn: 'CBL_RAW.EXT.DATABRICKS_USAGE_ICE',   catalog: 'CBL_DATABRICKS_UC',format: 'Delta',                size: '38 GB',  rows: '420 M',  last_compact: 'external', writes: 'external (Databricks)' },
  { fqn: 'CBL_RAW.EXT.FABRIC_FINANCE_ICE',     catalog: 'CBL_FABRIC_ONELAKE', format: 'Delta',              size: '24 GB',  rows: '92 M',   last_compact: 'external', writes: 'external (Fabric)' },
  { fqn: 'CBL_GOV.EXT.AUDIT_LOG_ICE',          catalog: 'CBL_POLARIS_CAT',  format: 'Parquet · Iceberg v2', size: '12 GB',  rows: '142 M',  last_compact: '02:00', writes: 'Snowflake-managed' },
]

const CLD = [
  { db: 'EXT_DATABRICKS',   linked_to: 'CBL_DATABRICKS_UC', tables: 18, auto_refresh: '15 min', auto_discovered: 6 },
  { db: 'EXT_FABRIC',       linked_to: 'CBL_FABRIC_ONELAKE',tables: 4,  auto_refresh: '15 min', auto_discovered: 0 },
]

const PARTITION_STATS = [
  { table: 'CMTS_EVENTS_ICE',     partitions: 8640, pruned_pct: 94, skew_pct: 4,  files: 128400, avg_file_mb: 38  },
  { table: 'NETSUITE_GL_ICE',     partitions: 1460, pruned_pct: 88, skew_pct: 8,  files: 24800,  avg_file_mb: 6   },
  { table: 'MODEL_FEATURES_ICE',  partitions: 3650, pruned_pct: 76, skew_pct: 12, files: 62400,  avg_file_mb: 10  },
  { table: 'DATABRICKS_USAGE_ICE',partitions: 720,  pruned_pct: 82, skew_pct: 6,  files: 8400,   avg_file_mb: 5   },
  { table: 'FABRIC_FINANCE_ICE',  partitions: 365,  pruned_pct: 90, skew_pct: 3,  files: 2200,   avg_file_mb: 11  },
  { table: 'AUDIT_LOG_ICE',       partitions: 730,  pruned_pct: 98, skew_pct: 2,  files: 4800,   avg_file_mb: 3   },
]

const QUERY_PERF = [
  { m: 'Jun', avg_s: 4.2, p99_s: 18.4, pruning_gain: 72 },
  { m: 'Jul', avg_s: 3.9, p99_s: 16.8, pruning_gain: 74 },
  { m: 'Aug', avg_s: 3.6, p99_s: 15.2, pruning_gain: 77 },
  { m: 'Sep', avg_s: 3.4, p99_s: 14.0, pruning_gain: 80 },
  { m: 'Oct', avg_s: 3.1, p99_s: 12.6, pruning_gain: 83 },
  { m: 'Nov', avg_s: 2.8, p99_s: 11.4, pruning_gain: 86 },
]

const REFRESH_HISTORY = [
  { ts: '2025-11-22 02:04', catalog: 'CBL_POLARIS_CAT',    table: 'CMTS_EVENTS_ICE',   duration: '2m 18s', snapshots: 48, status: 'success' },
  { ts: '2025-11-22 02:01', catalog: 'CBL_POLARIS_CAT',    table: 'MODEL_FEATURES_ICE',duration: '1m 44s', snapshots: 24, status: 'success' },
  { ts: '2025-11-22 02:00', catalog: 'CBL_POLARIS_CAT',    table: 'AUDIT_LOG_ICE',     duration: '0m 52s', snapshots: 12, status: 'success' },
  { ts: '2025-11-21 06:00', catalog: 'CBL_GLUE_CAT',       table: 'NETSUITE_GL_ICE',   duration: '4m 22s', snapshots: 6,  status: 'success' },
  { ts: '2025-11-21 05:45', catalog: 'CBL_DATABRICKS_UC',  table: 'DATABRICKS_USAGE_ICE', duration: '2m 08s', snapshots: 18, status: 'success' },
  { ts: '2025-11-20 14:12', catalog: 'CBL_FABRIC_ONELAKE', table: 'FABRIC_FINANCE_ICE',duration: '1m 30s', snapshots: 4,  status: 'success' },
  { ts: '2025-11-20 08:00', catalog: 'CBL_GLUE_CAT',       table: 'NETSUITE_GL_ICE',   duration: '8m 44s', snapshots: 0,  status: 'timeout' },
]

const REFRESH_LAG_TREND = [
  { m: 'Jun', polaris: 4.2, glue: 11.8, databricks: 14.2, fabric: 16.8 },
  { m: 'Jul', polaris: 4.0, glue: 11.4, databricks: 13.8, fabric: 16.2 },
  { m: 'Aug', polaris: 3.8, glue: 10.8, databricks: 13.2, fabric: 15.6 },
  { m: 'Sep', polaris: 3.6, glue: 10.2, databricks: 12.8, fabric: 15.0 },
  { m: 'Oct', polaris: 3.4, glue: 9.8,  databricks: 12.4, fabric: 14.4 },
  { m: 'Nov', polaris: 3.2, glue: 9.4,  databricks: 12.0, fabric: 14.0 },
]

const STORAGE_GROWTH = [
  { m: 'Jun', cmts: 3.2, features: 0.48, gl: 0.12, other: 0.18 },
  { m: 'Jul', cmts: 3.5, features: 0.50, gl: 0.12, other: 0.20 },
  { m: 'Aug', cmts: 3.8, features: 0.53, gl: 0.13, other: 0.22 },
  { m: 'Sep', cmts: 4.0, features: 0.56, gl: 0.13, other: 0.24 },
  { m: 'Oct', cmts: 4.3, features: 0.58, gl: 0.14, other: 0.26 },
  { m: 'Nov', cmts: 4.6, features: 0.61, gl: 0.14, other: 0.28 },
]

const COMPACTION_JOBS = [
  { table: 'CMTS_EVENTS_ICE',      last_run: '2025-11-22 02:00', duration: '18m 42s', files_before: 142400, files_after: 128400, savings_pct: 9.8  },
  { table: 'MODEL_FEATURES_ICE',   last_run: '2025-11-22 02:00', duration: '6m 14s',  files_before: 72800,  files_after: 62400,  savings_pct: 14.3 },
  { table: 'NETSUITE_GL_ICE',      last_run: '2025-11-22 02:00', duration: '2m 08s',  files_before: 26400,  files_after: 24800,  savings_pct: 6.1  },
  { table: 'AUDIT_LOG_ICE',        last_run: '2025-11-22 02:00', duration: '1m 22s',  files_before: 5200,   files_after: 4800,   savings_pct: 7.7  },
]

const EXTERNAL_TABLE_FRESHNESS = [
  { table: 'NETSUITE_GL_ICE',     last_refresh: '2025-11-22 06:00', lag_min: 9,   scan_tb: 0.14, rows_delta: '1.2M',  status: 'fresh'  },
  { table: 'DATABRICKS_USAGE_ICE',last_refresh: '2025-11-22 05:45', lag_min: 12,  scan_tb: 0.04, rows_delta: '420K',  status: 'fresh'  },
  { table: 'FABRIC_FINANCE_ICE',  last_refresh: '2025-11-21 22:00', lag_min: 480, scan_tb: 0.02, rows_delta: '92K',   status: 'stale'  },
  { table: 'AUDIT_LOG_ICE',       last_refresh: '2025-11-22 02:00', lag_min: 0,   scan_tb: 0.01, rows_delta: '142K',  status: 'fresh'  },
]

const COST_TREND_ICE = [
  { m: 'Jun', scan: 420,  compact: 84,  refresh: 48 },
  { m: 'Jul', scan: 448,  compact: 88,  refresh: 52 },
  { m: 'Aug', scan: 464,  compact: 92,  refresh: 54 },
  { m: 'Sep', scan: 480,  compact: 94,  refresh: 56 },
  { m: 'Oct', scan: 496,  compact: 98,  refresh: 58 },
  { m: 'Nov', scan: 512,  compact: 102, refresh: 60 },
]

const WRITE_PERF = [
  { m: 'Jun', rows_per_sec: 28400, mb_per_sec: 84, commit_lag_ms: 420 },
  { m: 'Jul', rows_per_sec: 30200, mb_per_sec: 88, commit_lag_ms: 408 },
  { m: 'Aug', rows_per_sec: 32800, mb_per_sec: 94, commit_lag_ms: 394 },
  { m: 'Sep', rows_per_sec: 34400, mb_per_sec: 98, commit_lag_ms: 380 },
  { m: 'Oct', rows_per_sec: 36200, mb_per_sec: 104, commit_lag_ms: 368 },
  { m: 'Nov', rows_per_sec: 38400, mb_per_sec: 112, commit_lag_ms: 354 },
]

type TabId = 'overview' | 'catalogs' | 'volumes' | 'tables' | 'partitions' | 'freshness' | 'performance' | 'lakehouse'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',         icon: Gauge      },
  { id: 'catalogs',    label: 'Catalog Int.',      icon: Database   },
  { id: 'volumes',     label: 'Ext. Volumes',      icon: HardDrive  },
  { id: 'tables',      label: 'Iceberg Tables',    icon: Layers     },
  { id: 'partitions',  label: 'Partitions',        icon: Server     },
  { id: 'freshness',   label: 'Freshness',         icon: RefreshCw  },
  { id: 'performance', label: 'Query Perf',        icon: Activity   },
  { id: 'lakehouse',   label: 'Lakehouse',         icon: Cloud      },
]

export default function IcebergPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [refreshFilter, setRefreshFilter] = useState<'all' | 'success' | 'timeout'>('all')
  const [compactView, setCompactView] = useState<'jobs' | 'trend'>('jobs')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'CBL_POLARIS_CAT' | 'CBL_GLUE_CAT' | 'CBL_DATABRICKS_UC' | 'CBL_FABRIC_ONELAKE'>('all')
  const [partSort, setPartSort] = useState<'pruned' | 'skew'>('pruned')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredRefresh = useMemo(
    () => refreshFilter === 'all' ? REFRESH_HISTORY : REFRESH_HISTORY.filter(r => r.status === refreshFilter),
    [refreshFilter],
  )

  const filteredTables = useMemo(
    () => catalogFilter === 'all' ? ICEBERG_TABLES : ICEBERG_TABLES.filter(t => t.catalog === catalogFilter),
    [catalogFilter],
  )

  const sortedPartitions = useMemo(
    () => [...PARTITION_STATS].sort((a, b) => partSort === 'pruned' ? b.pruned_pct - a.pruned_pct : b.skew_pct - a.skew_pct),
    [partSort],
  )

  const totalStorageTb = useMemo(
    () => STORAGE_GROWTH[STORAGE_GROWTH.length - 1],
    [],
  )

  const avgQueryS = useMemo(
    () => QUERY_PERF[QUERY_PERF.length - 1].avg_s,
    [],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Iceberg & external')}
        subtitle={tt('catalog integrations · external volumes · catalog-linked databases · open table format')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/data-engineering" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> {tt('Data Engineering')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ───────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Lakehouse intelligence"
        models={[
          { name: 'Partition Pruning Advisor', metric: '86% scan reduction', sub: 'Iceberg v2 partition evolution' },
          { name: 'Compaction Scheduler',      metric: '-14% file count',   sub: 'ML-driven merge window'         },
          { name: 'Refresh Lag Predictor',     metric: 'MAPE 5.8%',         sub: 'catalog sync forecasting'       },
        ]}
        agentLabel={tt('Run Iceberg Analyst')}
        agentRunningLabel={tt('Scanning…')}
        agentSteps={[
          tt('Scanned partition statistics across 6 Iceberg tables'),
          tt('Identified FABRIC_FINANCE_ICE stale for 8h — Fabric connectivity timeout'),
          tt('Correlated compaction schedule with query performance improvement'),
          tt('Flagged NETSUITE_GL_ICE small-file problem after Glue timeout'),
        ]}
        agentBlurb={tt('One Snowflake Iceberg layer over S3, Azure, and GCS — catalog integrations feed Polaris, Glue, Databricks, and Fabric into a single query engine.')}
        decision={{
          title: tt('Enable FABRIC_FINANCE_ICE auto-reconnect + daily compaction on NETSUITE_GL_ICE'),
          detail: tt('FABRIC_FINANCE_ICE has been stale 8h due to a Fabric connectivity timeout. NETSUITE_GL_ICE accumulated 26,400 files after the Glue timeout prevented compaction — query p99 is elevated at 44s.'),
          impact: tt('-8h freshness lag on Finance data · query p99 -40% after compaction'),
          risk: tt('Fabric OAuth token rotation — coordinate with Azure team before re-enabling auto-refresh'),
          linkTo: '/portal/data-engineering',
          linkLabel: tt('Open Data Engineering'),
        }}
        chart={{
          kind: 'area',
          title: tt('Iceberg storage growth by table (TB)'),
          xKey: 'm',
          data: STORAGE_GROWTH,
          series: [
            { key: 'cmts',     name: tt('CMTS_EVENTS_ICE'),    color: BLUE   },
            { key: 'features', name: tt('MODEL_FEATURES_ICE'), color: NAVY   },
            { key: 'gl',       name: tt('NETSUITE_GL_ICE'),    color: GREEN  },
            { key: 'other',    name: tt('other'),               color: SLATE  },
          ],
          note: tt('CMTS events growing 0.3 TB/month — on track for 6 TB by year-end.'),
        }}
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('FABRIC_FINANCE_ICE stale 8h · NETSUITE_GL_ICE Glue timeout · 26,400 small files accumulating')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Freshness SLA breach on Finance data. Check Freshness tab for auto-refresh status and Data Engineering for pipeline health.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/data-engineering" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Data Eng. →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav ──────────────────────────────────────────────────────────── */}
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

      {/* ════ OVERVIEW ════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Iceberg tables')}       value="6"      delta={tt('across 4 catalogs')}  trend="flat" icon={Layers}    accent />
          <KpiCard label={tt('External volumes')}     value="4"      delta={tt('S3 · ADLS · GCS')}    trend="flat" icon={HardDrive}       />
          <KpiCard label={tt('Catalog integrations')} value="4"      delta={tt('Polaris · Glue · UC')} trend="flat" icon={Database}       />
          <KpiCard label={tt('Total storage')}        value="5.6 TB" delta={tt('+0.3 TB/month')}      trend="down" icon={Cloud}          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg query time')}     value={`${avgQueryS}s`} delta={tt('-33% YTD')}          trend="up"   icon={Activity}   />
          <KpiCard label={tt('Auto-discovered')}    value="6"               delta={tt('in 24h')}             trend="up"   icon={RefreshCw}  />
          <KpiCard label={tt('Stale tables')}       value="1"               delta={tt('FABRIC_FINANCE_ICE')} trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Scan credits MTD')}   value="512 cr"          delta={tt('+3% MoM')}            trend="flat" icon={Zap}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Iceberg storage growth by table (TB)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={STORAGE_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" TB" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cmts"     name={tt('CMTS_EVENTS_ICE')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="features" name={tt('MODEL_FEATURES_ICE')} stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="gl"       name={tt('NETSUITE_GL_ICE')}    stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="other"    name={tt('other tables')}        stroke={SLATE} fill={SLATE} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Query performance trend — avg + p99 (s)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={QUERY_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" s" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avg_s"  name={tt('Avg (s)')}  stroke={BLUE}  strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="p99_s"  name={tt('p99 (s)')}  stroke={AMBER} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Catalog refresh lag trend (minutes per catalog)')}>
              <div className="h-52">
                <ResponsiveContainer>
                  <LineChart data={REFRESH_LAG_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" min" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="polaris"    name={tt('Polaris')}    stroke={BLUE}   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="glue"       name={tt('Glue')}       stroke={GREEN}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="databricks" name={tt('Databricks')} stroke={AMBER}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fabric"     name={tt('Fabric')}     stroke={PURPLE} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Quick links · platform')}>
            <div className="space-y-1 text-[12px]">
              <Link to="/portal/data-engineering" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><GitBranch    className="w-3.5 h-3.5" /> {tt('Data Engineering')}</Link>
              <Link to="/portal/catalog"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Database     className="w-3.5 h-3.5" /> {tt('Data Catalog')}</Link>
              <Link to="/portal/horizon"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: GREEN  }}><Layers       className="w-3.5 h-3.5" /> {tt('Horizon Governance')}</Link>
              <Link to="/portal/observability"    className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: AMBER  }}><Activity     className="w-3.5 h-3.5" /> {tt('Observability')}</Link>
              <Link to="/portal/cost"             className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: PURPLE }}><Zap          className="w-3.5 h-3.5" /> {tt('Cost & Credits')}</Link>
              <Link to="/portal/sharing"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: SLATE  }}><Server       className="w-3.5 h-3.5" /> {tt('Sharing & Listing')}</Link>
              <Link to="/portal/clean-rooms"      className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><Database     className="w-3.5 h-3.5" /> {tt('Clean Rooms')}</Link>
              <Link to="/portal/data-products"    className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Layers       className="w-3.5 h-3.5" /> {tt('Data Products')}</Link>
              <Link to="/portal/apps"             className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: GREEN  }}><Server       className="w-3.5 h-3.5" /> {tt('Apps Catalog')}</Link>
              <Link to="/portal/ai-insights"      className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: AMBER  }}><Activity     className="w-3.5 h-3.5" /> {tt('AI Insights')}</Link>
              <Link to="/portal/environments"     className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: PURPLE }}><GitBranch    className="w-3.5 h-3.5" /> {tt('Environments')}</Link>
              <Link to="/portal/agents"           className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: SLATE  }}><Server       className="w-3.5 h-3.5" /> {tt('Cortex Agents')}</Link>
            </div>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
          <Box className="w-3 h-3" /> {tt('source: SHOW CATALOG INTEGRATIONS · SHOW EXTERNAL VOLUMES · SHOW ICEBERG TABLES · SHOW DATABASES (linked)')}
        </div>
        <div className="text-xs text-vfes-dark/40 mt-1">{tt('Storage total June:')} {(totalStorageTb.cmts + totalStorageTb.features + totalStorageTb.gl + totalStorageTb.other).toFixed(2)} TB</div>
      </>)}

      {/* ════ OVERVIEW ════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Monthly Iceberg scan credits by operation')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={COST_TREND_ICE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="scan"    name={tt('Scan')}       fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compact" name={tt('Compaction')} fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refresh" name={tt('Refresh')}    fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Recent compaction jobs')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Table')}</th>
                <th className="text-right">{tt('Duration')}</th>
                <th className="text-right">{tt('Files reduced')}</th>
                <th className="text-right">{tt('Savings %')}</th>
              </tr></thead>
              <tbody>
                {COMPACTION_JOBS.map((j) => (
                  <tr key={j.table} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{j.table}</td>
                    <td className="text-right font-mono text-[10px]">{j.duration}</td>
                    <td className="text-right font-mono">{(j.files_before - j.files_after).toLocaleString()}</td>
                    <td className="text-right font-mono font-bold text-emerald-600">{j.savings_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('All compactions ran at 02:00 UTC. Next window: tomorrow 02:00 UTC.')}</div>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-4">
          <Box className="w-3 h-3" /> {tt('source: SHOW CATALOG INTEGRATIONS · SHOW EXTERNAL VOLUMES · SHOW ICEBERG TABLES · SHOW DATABASES (linked)')}
        </div>
        <div className="text-xs text-vfes-dark/40 mt-1">{tt('Avg query time this month:')} {avgQueryS}s</div>
      </>)}

      {/* ════ CATALOG INTEGRATIONS ════════════════════════════════════════════ */}
      {tab === 'catalogs' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Catalog integrations')} value="4"       delta={tt('3 read-only · 1 read-write')} trend="flat" icon={Database}  accent />
          <KpiCard label={tt('Total tables')}          value="50"      delta={tt('6 Iceberg managed')}         trend="up"   icon={Layers}         />
          <KpiCard label={tt('External volumes')}      value="4"       delta={tt('2 writable')}                trend="flat" icon={HardDrive}       />
          <KpiCard label={tt('Auto-discovered 24h')}   value="6"       delta={tt('EXT_DATABRICKS')}            trend="up"   icon={RefreshCw}       />
        </div>

        <Panel title={tt('Catalog integrations')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Catalog')}</th><th className="text-left">{tt('Provider')}</th>
              <th className="text-right">{tt('Volumes')}</th><th className="text-right">{tt('Tables')}</th>
              <th className="text-left">{tt('Refresh')}</th><th className="text-left">{tt('Mode')}</th>
            </tr></thead>
            <tbody>
              {CATALOGS.map((c) => (
                <tr key={c.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{c.name}</td>
                  <td>{c.provider}</td>
                  <td className="text-right font-mono">{c.volumes}</td>
                  <td className="text-right font-mono">{c.tables}</td>
                  <td className="text-[10px]">{c.refresh}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.mode==='read-write'?'bg-emerald-100 text-emerald-700':'bg-zinc-100 text-zinc-700'}`}>{c.mode}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Catalog refresh lag trend (min)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={REFRESH_LAG_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="polaris"    name={tt('Polaris')}    stroke={BLUE}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="glue"       name={tt('Glue')}       stroke={GREEN}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="databricks" name={tt('Databricks')} stroke={AMBER}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fabric"     name={tt('Fabric')}     stroke={PURPLE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Catalog-linked databases (CLD)')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Database')}</th><th className="text-left">{tt('Linked to')}</th>
                <th className="text-right">{tt('Tables')}</th><th className="text-left">{tt('Auto-refresh')}</th><th className="text-right">{tt('Auto-discovered')}</th>
              </tr></thead>
              <tbody>
                {CLD.map((c) => (
                  <tr key={c.db} className="border-b border-black/5">
                    <td className="py-1.5 font-mono font-semibold">{c.db}</td>
                    <td className="font-mono text-[10px]">{c.linked_to}</td>
                    <td className="text-right font-mono">{c.tables}</td>
                    <td className="text-[10px]">{c.auto_refresh}</td>
                    <td className="text-right font-mono">{c.auto_discovered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/data-engineering" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Data Engineering →')}</Link>
          <Link to="/portal/catalog"          className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Data Catalog →')}</Link>
        </div>
      </>)}

      {/* overview extra — second conditional block with compaction charts shown on overview tab */}
      {tab === 'overview' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Iceberg freshness SLA — current snapshot')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Table')}</th>
                <th className="text-right">{tt('Lag (min)')}</th>
                <th className="text-right">{tt('Rows delta')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr></thead>
              <tbody>
                {EXTERNAL_TABLE_FRESHNESS.map((t) => (
                  <tr key={t.table} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{t.table}</td>
                    <td className={`text-right font-mono font-bold ${t.lag_min > 60 ? 'text-red-600' : t.lag_min > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.lag_min}</td>
                    <td className="text-right font-mono">{t.rows_delta}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${t.status==='fresh'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={tt('Iceberg scan credits (6-month trend)')}>
            <div className="h-44">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND_ICE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="scan"    name={tt('Scan')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="compact" name={tt('Compaction')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ EXTERNAL VOLUMES ════════════════════════════════════════════════ */}
      {tab === 'volumes' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('External volumes')}   value="4"      delta={tt('S3 + ADLS + GCS')} trend="flat" icon={HardDrive} accent />
          <KpiCard label={tt('Writable volumes')}   value="1"      delta={tt('EXT_VOL_S3_CBL')}  trend="flat" icon={Cloud}          />
          <KpiCard label={tt('Total capacity')}     value="5.6 TB" delta={tt('across volumes')}  trend="down" icon={Server}         />
          <KpiCard label={tt('Encryption types')}   value="3"      delta={tt('SSE-KMS · CMK · CSEK')} trend="flat" icon={Zap}      />
        </div>

        <Panel title={tt('External volumes')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Volume')}</th><th className="text-left">{tt('Cloud')}</th>
              <th className="text-left">{tt('Location')}</th><th className="text-left">{tt('Region')}</th>
              <th className="text-left">{tt('Encryption')}</th><th className="text-left">{tt('Writes')}</th>
            </tr></thead>
            <tbody>
              {VOLUMES.map((v) => (
                <tr key={v.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{v.name}</td>
                  <td className="flex items-center gap-1.5"><Cloud className="w-3 h-3 text-sky-600" /> {v.cloud}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{v.bucket}</td>
                  <td className="text-[11px]">{v.region}</td>
                  <td className="text-[10px]">{v.encryption}</td>
                  <td>{v.writes ? <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{tt('enabled')}</span> : <span className="text-[10px] text-vfes-dark/40">{tt('read-only')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Storage growth by table (TB)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={STORAGE_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" TB" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cmts"     name={tt('CMTS_EVENTS_ICE')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="features" name={tt('MODEL_FEATURES_ICE')} stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="gl"       name={tt('NETSUITE_GL_ICE')}    stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/horizon" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Horizon Governance →')}</Link>
          <Link to="/portal/cost"    className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Cost & Credits →')}</Link>
        </div>
      </>)}

      {/* ════ ICEBERG TABLES ══════════════════════════════════════════════════ */}
      {tab === 'tables' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Iceberg tables')} value="6"       delta={tt('5 Parquet · 1 Delta')}   trend="flat" icon={Layers}   accent />
          <KpiCard label={tt('Total rows')}     value="14.3 B"  delta={tt('+0.8 B/day')}            trend="down" icon={Database}       />
          <KpiCard label={tt('Total storage')}  value="5.4 TB"  delta={tt('+0.3 TB/month')}         trend="down" icon={HardDrive}       />
          <KpiCard label={tt('Polaris tables')} value="3"       delta={tt('Snowflake-managed writes')} trend="flat" icon={Cloud}      />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Catalog:')}</span>
          {(['all', 'CBL_POLARIS_CAT', 'CBL_GLUE_CAT', 'CBL_DATABRICKS_UC', 'CBL_FABRIC_ONELAKE'] as const).map(c => (
            <button key={c} onClick={() => setCatalogFilter(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${catalogFilter === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {c === 'all' ? tt('all') : c.replace('CBL_', '')}
            </button>
          ))}
          <span className="text-[10px] text-vfes-dark/40 ml-2">{filteredTables.length} {tt('tables')}</span>
        </div>

        <Panel title={tt('Iceberg tables')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Table')}</th><th className="text-left">{tt('Catalog')}</th>
              <th className="text-left">{tt('Format')}</th><th className="text-right">{tt('Size')}</th><th className="text-right">{tt('Rows')}</th>
              <th className="text-left">{tt('Last compact')}</th><th className="text-left">{tt('Writes')}</th>
            </tr></thead>
            <tbody>
              {filteredTables.map((t) => (
                <tr key={t.fqn} className="border-b border-black/5">
                  <td className="py-1.5 font-mono">{t.fqn}</td>
                  <td className="font-mono text-[10px]">{t.catalog}</td>
                  <td className="text-[10px]">{t.format}</td>
                  <td className="text-right font-mono">{t.size}</td>
                  <td className="text-right font-mono">{t.rows}</td>
                  <td className="text-[10px]">{t.last_compact}</td>
                  <td className="text-[10px]">{t.writes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Write throughput trend (rows/sec · MB/sec)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={WRITE_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="rows_per_sec" name={tt('rows/sec')} stroke={BLUE}  strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="mb_per_sec"   name={tt('MB/sec')}   stroke={GREEN} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/catalog" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Open Data Catalog →')}</Link>
          <Link to="/portal/horizon" className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Horizon Governance →')}</Link>
        </div>
      </>)}

      {/* ════ PARTITIONS ══════════════════════════════════════════════════════ */}
      {tab === 'partitions' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg scan reduction')} value="86%"    delta={tt('vs full table scan')} trend="up"   icon={Server}    accent />
          <KpiCard label={tt('Total partitions')}   value="15,565" delta={tt('across 6 tables')}   trend="flat" icon={Layers}         />
          <KpiCard label={tt('Avg file size')}      value="12 MB"  delta={tt('target 32-128 MB')}  trend="flat" icon={HardDrive}      />
          <KpiCard label={tt('High-skew tables')}   value="1"      delta={tt('MODEL_FEATURES_ICE')} trend="down" icon={AlertTriangle} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['pruned', 'skew'] as const).map(s => (
            <button key={s} onClick={() => setPartSort(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${partSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {s === 'pruned' ? tt('pruning %') : tt('skew %')}
            </button>
          ))}
        </div>

        <Panel title={tt('Partition statistics')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Table')}</th>
              <th className="text-right">{tt('Partitions')}</th>
              <th className="text-right">{tt('Pruning %')}</th>
              <th className="text-right">{tt('Skew %')}</th>
              <th className="text-right">{tt('Files')}</th>
              <th className="text-right">{tt('Avg file (MB)')}</th>
            </tr></thead>
            <tbody>
              {sortedPartitions.map((p) => (
                <tr key={p.table} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{p.table}</td>
                  <td className="text-right font-mono">{p.partitions.toLocaleString()}</td>
                  <td className={`text-right font-mono font-bold ${p.pruned_pct >= 90 ? 'text-emerald-600' : p.pruned_pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{p.pruned_pct}%</td>
                  <td className={`text-right font-mono ${p.skew_pct >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.skew_pct}%</td>
                  <td className="text-right font-mono">{p.files.toLocaleString()}</td>
                  <td className="text-right font-mono">{p.avg_file_mb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Compaction jobs')}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
              {(['jobs', 'trend'] as const).map(v => (
                <button key={v} onClick={() => setCompactView(v)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${compactView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {tt(v)}
                </button>
              ))}
            </div>
            {compactView === 'jobs' && (
              <table className="w-full text-[11px]">
                <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Table')}</th>
                  <th className="text-left">{tt('Last run')}</th>
                  <th className="text-right">{tt('Duration')}</th>
                  <th className="text-right">{tt('Files before')}</th>
                  <th className="text-right">{tt('Files after')}</th>
                  <th className="text-right">{tt('Savings %')}</th>
                </tr></thead>
                <tbody>
                  {COMPACTION_JOBS.map((j) => (
                    <tr key={j.table} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-[10px] font-semibold">{j.table}</td>
                      <td className="font-mono text-[10px]">{j.last_run}</td>
                      <td className="text-right font-mono text-[10px]">{j.duration}</td>
                      <td className="text-right font-mono">{j.files_before.toLocaleString()}</td>
                      <td className="text-right font-mono">{j.files_after.toLocaleString()}</td>
                      <td className="text-right font-mono font-bold text-emerald-600">{j.savings_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {compactView === 'trend' && (
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={QUERY_PERF}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="pruning_gain" name={tt('Pruning gain %')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/data-engineering" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Data Engineering →')}</Link>
          <Link to="/portal/catalog"          className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Data Catalog →')}</Link>
        </div>
      </>)}

      {/* ════ FRESHNESS ═══════════════════════════════════════════════════════ */}
      {tab === 'freshness' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Fresh tables')}   value="3"    delta={tt('1 stale')}           trend="down" icon={RefreshCw}      accent />
          <KpiCard label={tt('Avg lag min')}    value="9 min" delta={tt('Polaris: 3.2 min')}  trend="up"   icon={Activity}           />
          <KpiCard label={tt('Stale > 4h')}     value="1"    delta={tt('FABRIC_FINANCE_ICE')} trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Refresh jobs 7d')}value="42"   delta={tt('1 timeout')}          trend="flat" icon={Database}           />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'success', 'timeout'] as const).map(f => (
            <button key={f} onClick={() => setRefreshFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${refreshFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
          <span className="text-[10px] text-vfes-dark/40 ml-2">{filteredRefresh.length} {tt('events')}</span>
        </div>

        <Panel title={tt('External table freshness status')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Table')}</th>
              <th className="text-left">{tt('Last refresh')}</th>
              <th className="text-right">{tt('Lag (min)')}</th>
              <th className="text-right">{tt('Scan (TB)')}</th>
              <th className="text-right">{tt('Rows delta')}</th>
              <th className="text-left">{tt('Status')}</th>
            </tr></thead>
            <tbody>
              {EXTERNAL_TABLE_FRESHNESS.map((t) => (
                <tr key={t.table} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{t.table}</td>
                  <td className="font-mono text-[10px]">{t.last_refresh}</td>
                  <td className={`text-right font-mono font-bold ${t.lag_min > 60 ? 'text-red-600' : t.lag_min > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.lag_min}</td>
                  <td className="text-right font-mono">{t.scan_tb}</td>
                  <td className="text-right font-mono">{t.rows_delta}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${t.status==='fresh'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Refresh history log')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Timestamp')}</th>
                <th className="text-left">{tt('Catalog')}</th>
                <th className="text-left">{tt('Table')}</th>
                <th className="text-right">{tt('Duration')}</th>
                <th className="text-right">{tt('Snapshots')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr></thead>
              <tbody>
                {filteredRefresh.map((r) => (
                  <tr key={r.ts + r.table} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px]">{r.ts}</td>
                    <td className="font-mono text-[10px]">{r.catalog.replace('CBL_', '')}</td>
                    <td className="font-mono text-[10px] font-semibold">{r.table}</td>
                    <td className="text-right font-mono text-[10px]">{r.duration}</td>
                    <td className="text-right font-mono">{r.snapshots}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.status==='success'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/observability" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Observability →')}</Link>
          <Link to="/portal/data-engineering" className="font-semibold hover:underline"   style={{ color: NAVY }}>{tt('Data Engineering →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Catalog refresh lag trend — all catalogs (min)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={REFRESH_LAG_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="polaris"    name={tt('Polaris')}    stroke={BLUE}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="glue"       name={tt('Glue')}       stroke={GREEN}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="databricks" name={tt('Databricks')} stroke={AMBER}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fabric"     name={tt('Fabric')}     stroke={PURPLE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-vfes-dark/55 mt-2">
              {tt('Polaris lag improving: 4.2 → 3.2 min. Fabric elevated — OAuth reconnect required.')}
            </div>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-4">
          <RefreshCw className="w-3 h-3" /> {tt('source: SHOW ICEBERG TABLES · INFORMATION_SCHEMA.ICEBERG_TABLE_REFRESH_HISTORY')}
        </div>
      </>)}

      {/* ════ QUERY PERFORMANCE ═══════════════════════════════════════════════ */}
      {tab === 'performance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg query (s)')} value={`${avgQueryS}s`} delta={tt('-33% YTD')}        trend="up"   icon={Activity} accent />
          <KpiCard label={tt('Avg pruning %')} value="86%"             delta={tt('+14 pp YTD')}      trend="up"   icon={Server}         />
          <KpiCard label={tt('p99 query (s)')} value="11.4s"           delta={tt('-38% YTD')}        trend="up"   icon={Gauge}          />
          <KpiCard label={tt('Scan credits MTD')} value="512 cr"       delta={tt('BSD 2,150 MTD')}      trend="flat" icon={Zap}            />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Query avg + p99 latency trend (seconds)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={QUERY_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" s" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avg_s" name={tt('Avg (s)')} stroke={BLUE}  strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="p99_s" name={tt('p99 (s)')} stroke={AMBER} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Partition pruning effectiveness (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={QUERY_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="pruning_gain" name={tt('Pruning gain %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Write throughput + commit lag trend')}>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={WRITE_PERF}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="rows_per_sec"   name={tt('rows/sec')}      stroke={BLUE}  strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="commit_lag_ms"  name={tt('commit lag ms')} stroke={AMBER} strokeWidth={2}   dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Iceberg scan cost trend (credits)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND_ICE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="scan"    name={tt('Scan')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="compact" name={tt('Compaction')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="refresh" name={tt('Refresh')}    stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/cost"          className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Cost & Credits →')}</Link>
          <Link to="/portal/observability" className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Observability →')}</Link>
        </div>
      </>)}

      {/* ════ LAKEHOUSE ═══════════════════════════════════════════════════════ */}
      {tab === 'lakehouse' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Mobile / RAN tables')} value="8"      delta={tt('312 TB · 26B rows/day')} trend="flat" icon={Cloud}     accent />
          <KpiCard label={tt('Largest table')}        value="184 TB" delta={tt('RAW_RAN_TELEMETRY')}     trend="flat" icon={Layers}         />
          <KpiCard label={tt('External readers')}     value="3"      delta={tt('Databricks · Spark')}    trend="flat" icon={Database}       />
          <KpiCard label={tt('Open RAN tables')}      value="2"      delta={tt('Polaris catalog')}       trend="flat" icon={Server}         />
        </div>

        <Panel title={tt('Mobile / RAN data lake (Iceberg)')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Cloud className="w-3 h-3" />{tt('312 TB · 26B rows/day')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Table')}</th><th>{tt('Catalog')}</th><th>{tt('Storage')}</th><th>{tt('Rows')}</th><th>{tt('Partition by')}</th><th>{tt('External reader')}</th></tr>
            </thead>
            <tbody>
              {MOBILE_ICEBERG.map((t) => (
                <tr key={t.table} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{t.table}</td>
                  <td className="text-[11px] text-vfes-dark/65">{t.catalog}</td>
                  <td className="font-mono text-xs">{t.storage}</td>
                  <td className="font-mono text-xs">{t.rows}</td>
                  <td className="font-mono text-xs">{t.partitionBy}</td>
                  <td className="text-[11px] text-vfes-dark/65">{t.externalReader}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('RAW_RAN_TELEMETRY is the largest mobile lakehouse table at 184 TB / 12.4B rows per day. Open RAN test results live in Polaris and read by Databricks for vendor interop analytics.')}</div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Iceberg scan cost by operation (credits)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND_ICE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="scan"    name={tt('Scan')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="compact" name={tt('Compaction')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="refresh" name={tt('Refresh')}    stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Catalog-linked databases (CLD)')}>
            <table className="w-full text-[12px] mt-2">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Database')}</th><th className="text-left">{tt('Linked to')}</th>
                <th className="text-right">{tt('Tables')}</th><th className="text-left">{tt('Auto-refresh')}</th><th className="text-right">{tt('Discovered (24h)')}</th>
              </tr></thead>
              <tbody>
                {CLD.map((c) => (
                  <tr key={c.db} className="border-b border-black/5">
                    <td className="py-1.5 font-mono font-semibold">{c.db}</td>
                    <td className="font-mono text-[10px]">{c.linked_to}</td>
                    <td className="text-right font-mono">{c.tables}</td>
                    <td className="text-[10px]">{c.auto_refresh}</td>
                    <td className="text-right font-mono">{c.auto_discovered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-2 text-[12px]">
              <Link to="/portal/sharing"     className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><Server   className="w-3.5 h-3.5" /> {tt('Sharing & Listing')}</Link>
              <Link to="/portal/clean-rooms" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Database className="w-3.5 h-3.5" /> {tt('Data Clean Rooms')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Mobile / RAN Iceberg partition pruning (%)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={PARTITION_STATS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="table" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="pruned_pct" name={tt('Pruning %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="skew_pct"   name={tt('Skew %')}    fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Iceberg write throughput trend (rows/s · MB/s)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={WRITE_PERF}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="rows_per_sec" name={tt('rows/sec')} stroke={BLUE} fill={BLUE} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="mb_per_sec"   name={tt('MB/sec')}   stroke={NAVY} fill={NAVY} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('All Iceberg partition statistics — summary')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Table')}</th>
                <th className="text-right">{tt('Partitions')}</th>
                <th className="text-right">{tt('Pruning %')}</th>
                <th className="text-right">{tt('Skew %')}</th>
                <th className="text-right">{tt('Files')}</th>
                <th className="text-right">{tt('Avg file MB')}</th>
              </tr></thead>
              <tbody>
                {PARTITION_STATS.map((p) => (
                  <tr key={p.table} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{p.table}</td>
                    <td className="text-right font-mono">{p.partitions.toLocaleString()}</td>
                    <td className={`text-right font-mono font-bold ${p.pruned_pct >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{p.pruned_pct}%</td>
                    <td className={`text-right font-mono ${p.skew_pct >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.skew_pct}%</td>
                    <td className="text-right font-mono">{p.files.toLocaleString()}</td>
                    <td className="text-right font-mono">{p.avg_file_mb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55 flex flex-wrap gap-4">
          <Link to="/portal/cost"             className="font-semibold hover:underline" style={{ color: BLUE   }}>{tt('Cost & Credits →')}</Link>
          <Link to="/portal/observability"    className="font-semibold hover:underline" style={{ color: NAVY   }}>{tt('Observability →')}</Link>
          <Link to="/portal/data-engineering" className="font-semibold hover:underline" style={{ color: GREEN  }}>{tt('Data Engineering →')}</Link>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-4">
          <Box className="w-3 h-3" /> {tt('source: SHOW CATALOG INTEGRATIONS · SHOW EXTERNAL VOLUMES · SHOW ICEBERG TABLES · SHOW DATABASES (linked)')}
        </div>
      </>)}

      {/* (no more tabs below) */}
    </div>
  )
}
