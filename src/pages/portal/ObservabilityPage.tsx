import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { Activity, AlertTriangle, CheckCircle2, Smartphone, Database, Clock, Server, Zap } from 'lucide-react'
import { MOBILE_OBSERVABILITY } from './_mobile_data'

const BLUE = '#FF4438', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8'

const TABS = ['Pipeline', 'Tasks', 'Queries', 'Warehouses', 'Freshness', 'Telemetry', 'Alerts', 'Errors'] as const
type Tab = typeof TABS[number]

const LOGS = [
  { ts: '14:08:42.108', sev: 'ERR',  src: 'CHURN_AGENT',          msg: 'tool_call timeout: shap_explain · 12.4s > 10s', tags: 'agent · llm' },
  { ts: '14:08:24.940', sev: 'INFO', src: 'CUSTOMER_360_SV',       msg: 'AI_QUERY answered in 2.81s · 12 metrics retrieved · cache_hit=false', tags: 'analyst' },
  { ts: '14:07:18.612', sev: 'WARN', src: 'TASK_BUILD_CUSTOMER_360', msg: 'late by 14m vs schedule, upstream STG_BILLING degraded', tags: 'task' },
  { ts: '14:06:02.214', sev: 'INFO', src: 'PIPE_INGEST_CMTS',      msg: '24,812 rows ingested in 8.2s', tags: 'snowpipe' },
  { ts: '14:05:48.018', sev: 'INFO', src: 'CORTEX_SEARCH:KB_NETWORK_RUNBOOKS', msg: 'preview latency p95 312ms · 1,420 calls/h', tags: 'search' },
  { ts: '14:05:12.842', sev: 'WARN', src: 'CORTEX_GUARD',          msg: 'jailbreak attempt blocked · agent=COMPLIANCE · user=externe@example.com', tags: 'guard' },
  { ts: '14:04:30.140', sev: 'ERR',  src: 'UDF: shap_explain',     msg: 'OOM on warehouse WH_CORTEX_L · increase to LARGE', tags: 'udf' },
  { ts: '14:03:08.402', sev: 'INFO', src: 'STREAMLIT cbl_portal',  msg: 'session start · user=ceo@example.com · role=EXEC_VIEWER', tags: 'sis' },
  { ts: '14:02:54.118', sev: 'INFO', src: 'DT FACT_NETWORK_KPI',    msg: 'incremental refresh complete · 4,820 rows · 1.4s', tags: 'dt' },
  { ts: '14:01:28.910', sev: 'INFO', src: 'DOC_AI INVOICE_PIPELINE', msg: 'extracted 28 fields from 14 PDFs · avg conf 0.94', tags: 'doc-ai' },
]

const TRACES = [
  { id: 'tr_88f12a', root: 'CHURN_AGENT.run',          dur_ms: 6240, spans: 14, status: 'ok',   user: 'leen.jacobs' },
  { id: 'tr_88f0e1', root: 'CEO_BRIEFING_AGENT.run',    dur_ms: 4180, spans: 11, status: 'ok',   user: 'ceo@example.com' },
  { id: 'tr_88f0c4', root: 'WAR_ROOM_TRIAGE.run',       dur_ms: 9120, spans: 22, status: 'ok',   user: 'cto@example.com' },
  { id: 'tr_88f0a8', root: 'PRICING_AGENT.run',         dur_ms: 5640, spans: 13, status: 'err',  user: 'pricing.ops' },
  { id: 'tr_88f08c', root: 'B2B_DEAL_AGENT.run',        dur_ms: 7012, spans: 18, status: 'ok',   user: 'b2b.sales' },
  { id: 'tr_88f070', root: 'COMPLIANCE_AGENT.run',      dur_ms: 3414, spans: 9,  status: 'block',user: 'externe@example.com' },
  { id: 'tr_88f054', root: 'NETWORK_OPS_AGENT.run',     dur_ms: 4640, spans: 12, status: 'ok',   user: 'noc.ops' },
]

const LATENCY = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  p50: 1.2 + Math.sin(i / 4) * 0.3,
  p95: 3.4 + Math.sin(i / 5) * 0.6,
  p99: 6.1 + Math.cos(i / 4) * 1.1,
}))

const ERRORS_BY_TYPE = [
  { t: 'tool_timeout',   c: 18 },
  { t: 'OOM',            c: 6 },
  { t: 'sql_compile',    c: 12 },
  { t: 'guardrail_block',c: 4 },
  { t: 'token_limit',    c: 3 },
  { t: 'auth',           c: 2 },
]

const PIPELINE_RUNS_TREND = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  success: 55 + Math.round(Math.abs(Math.sin(i / 4)) * 8),
  failed:  Math.round(Math.abs(Math.sin(i / 7)) * 2),
  skipped: Math.round(Math.abs(Math.sin(i / 11)) * 1),
}))

const PIPELINE_STATUS = [
  { name: 'PIPE_INGEST_CMTS',   type: 'Snowpipe', status: 'OK',   rows_24h: 612480,  latency_s: 8.2,  lag_s: 0   },
  { name: 'PIPE_INGEST_BSS',    type: 'Snowpipe', status: 'OK',   rows_24h: 284320,  latency_s: 6.8,  lag_s: 0   },
  { name: 'STREAM_CDRS',        type: 'Kafka',    status: 'WARN', rows_24h: 1842400, latency_s: 1.2,  lag_s: 48  },
  { name: 'PIPE_INVOICE_PDFS',  type: 'Doc AI',   status: 'OK',   rows_24h: 2840,    latency_s: 14.2, lag_s: 0   },
  { name: 'PIPE_CRM_SF',        type: 'Openflow', status: 'OK',   rows_24h: 42800,   latency_s: 22.1, lag_s: 0   },
  { name: 'PIPE_RAN_TELEMETRY', type: 'Snowpipe', status: 'WARN', rows_24h: 9284000, latency_s: 4.1,  lag_s: 128 },
  { name: 'PIPE_IPTV_EVENTS',   type: 'Snowpipe', status: 'OK',   rows_24h: 4284000, latency_s: 3.8,  lag_s: 0   },
]

const TASK_RUNS = [
  { name: 'TASK_BUILD_CUSTOMER_360', schedule: 'every 30m', status: 'WARN', last: '14:07:18',         dur_s: 84,  lag_m: 14, owner: 'data-eng' },
  { name: 'TASK_CHURN_SCORE_DAILY',  schedule: '01:00 UTC', status: 'OK',   last: '2025-05-22 01:00', dur_s: 242, lag_m: 0,  owner: 'ml-team' },
  { name: 'TASK_BILLING_RECONCILE',  schedule: '00:30 UTC', status: 'OK',   last: '2025-05-22 00:30', dur_s: 184, lag_m: 0,  owner: 'finance' },
  { name: 'TASK_NETWORK_KPI_ROLL',   schedule: 'every 15m', status: 'OK',   last: '14:00:00',         dur_s: 18,  lag_m: 0,  owner: 'noc' },
  { name: 'TASK_AGENT_LOG_ARCHIVE',  schedule: 'every 1h',  status: 'OK',   last: '14:00:00',         dur_s: 12,  lag_m: 0,  owner: 'platform' },
  { name: 'TASK_COMPLIANCE_SCAN',    schedule: '04:00 UTC', status: 'OK',   last: '2025-05-22 04:00', dur_s: 94,  lag_m: 0,  owner: 'governance' },
]

const DT_RUNS = [
  { dt: 'FACT_NETWORK_KPI',    lag: 'target 5m',  last: '14:02:54',         rows: '4,820',  dur_ms: 1400,   mode: 'incremental', status: 'OK' },
  { dt: 'FACT_CUSTOMER_360',   lag: 'target 15m', last: '13:58:40',         rows: '14,280', dur_ms: 8400,   mode: 'incremental', status: 'WARN' },
  { dt: 'AGG_CHURN_RISK',      lag: 'target 24h', last: '2025-05-22 01:04', rows: '1.04M',  dur_ms: 184000, mode: 'full',        status: 'OK' },
  { dt: 'DIM_CUSTOMER_ENRICH', lag: 'target 30m', last: '13:42:00',         rows: '18.4M',  dur_ms: 24000,  mode: 'incremental', status: 'LATE' },
  { dt: 'FACT_BILLING_EVENTS', lag: 'target 15m', last: '14:05:00',         rows: '28,400', dur_ms: 12000,  mode: 'incremental', status: 'OK' },
]

const TASK_LATENCY_TREND = Array.from({ length: 7 }, (_, i) => ({
  d: `D-${6 - i}`,
  avg:      68  + Math.round(Math.abs(Math.sin(i / 2)) * 12),
  p95:      182 + Math.round(Math.abs(Math.sin(i / 3)) * 24),
  failures: [0, 1, 0, 2, 1, 0, 1][i],
}))

const QUERY_PERF = [
  { id: 'q01ab9', user: 'pbi_service',  wh: 'WH_BI_M',        sec: 480,  scanned_gb: 12.4, spill: 0,    cache: 'none' },
  { id: 'q01ac1', user: 'sc_agent',     wh: 'WH_CORTEX_L',    sec: 312,  scanned_gb: 0.1,  spill: 0,    cache: 'result' },
  { id: 'q01ad4', user: 'pieter.claes',  wh: 'WH_AD_HOC_S',    sec: 252,  scanned_gb: 28.8, spill: 2.1,  cache: 'none' },
  { id: 'q01ae8', user: 'dbt_runner',   wh: 'WH_TRANSFORM_L', sec: 642,  scanned_gb: 48.2, spill: 8.4,  cache: 'none' },
  { id: 'q01ag6', user: 'leen.jacobs',  wh: 'WH_ML_GPU_M',    sec: 1840, scanned_gb: 82.4, spill: 14.2, cache: 'none' },
  { id: 'q01ah0', user: 'pbi_service',  wh: 'WH_BI_M',        sec: 168,  scanned_gb: 4.2,  spill: 0,    cache: 'metadata' },
]

const QUERY_DIST = [
  { bucket: '0-1s',   count: 8420 }, { bucket: '1-5s',   count: 2840 },
  { bucket: '5-15s',  count: 642  }, { bucket: '15-60s', count: 184  },
  { bucket: '1-5m',   count: 42   }, { bucket: '>5m',    count: 8    },
]

const WH_LOAD = [
  { wh: 'WH_BI_M',        size: 'M',   load: 72, queue: 4, credits_24h: 18.4, status: 'OK' },
  { wh: 'WH_TRANSFORM_L', size: 'L',   load: 58, queue: 0, credits_24h: 24.2, status: 'OK' },
  { wh: 'WH_CORTEX_L',    size: 'L',   load: 38, queue: 2, credits_24h: 14.8, status: 'WARN' },
  { wh: 'WH_ML_GPU_M',    size: 'GPU', load: 84, queue: 1, credits_24h: 8.4,  status: 'OK' },
  { wh: 'WH_AD_HOC_S',    size: 'S',   load: 8,  queue: 0, credits_24h: 1.2,  status: 'IDLE' },
  { wh: 'WH_INGEST_S',    size: 'S',   load: 42, queue: 0, credits_24h: 6.8,  status: 'OK' },
  { wh: 'WH_PORTAL_XS',   size: 'XS',  load: 12, queue: 0, credits_24h: 0.8,  status: 'IDLE' },
]

const WH_LOAD_TREND = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  BI_M:        40 + Math.round(Math.sin((i - 9) / 4) * 28 + 28),
  TRANSFORM_L: 30 + Math.round(Math.sin((i - 2) / 5) * 24 + 24),
  CORTEX_L:    20 + Math.round(Math.sin(i / 6) * 14 + 14),
}))

const WH_CREDITS_DAILY = Array.from({ length: 7 }, (_, i) => ({
  d: `D-${6 - i}`,
  BI_M:        16 + Math.round(Math.sin(i / 2) * 2),
  TRANSFORM_L: 22 + Math.round(Math.sin(i / 3) * 3),
  CORTEX_L:    12 + Math.round(Math.sin(i / 4) * 2),
  ML_GPU_M:    8  + Math.round(Math.abs(Math.sin(i)) * 4),
}))

const FRESHNESS = [
  { table: 'CUSTOMER_360',      sla_m: 15,   lag_m: 22,  status: 'LATE', owner: 'data-eng', last_refresh: '13:46' },
  { table: 'FACT_NETWORK_KPI',  sla_m: 5,    lag_m: 5,   status: 'OK',   owner: 'noc',      last_refresh: '14:03' },
  { table: 'AGG_CHURN_RISK',    sla_m: 1440, lag_m: 480, status: 'OK',   owner: 'ml-team',  last_refresh: '01:04' },
  { table: 'DIM_CUSTOMER',      sla_m: 30,   lag_m: 46,  status: 'LATE', owner: 'data-eng', last_refresh: '13:22' },
  { table: 'FACT_BILLING',      sla_m: 15,   lag_m: 8,   status: 'OK',   owner: 'finance',  last_refresh: '14:00' },
  { table: 'B2B_360',           sla_m: 60,   lag_m: 18,  status: 'OK',   owner: 'b2b-ops',  last_refresh: '13:50' },
  { table: 'RAW_RAN_TELEMETRY', sla_m: 2,    lag_m: 3,   status: 'LATE', owner: 'noc',      last_refresh: '14:05' },
]

const FRESHNESS_TREND = Array.from({ length: 7 }, (_, i) => ({
  d: `D-${6 - i}`,
  ok:       18 + [2, 0, 1, -1, 3, 1, 0][i],
  late:      2 + [0, 1, 2, 3, 1, 2, 1][i],
  critical:  [0, 0, 1, 1, 0, 0, 0][i],
}))

const ALERTS = [
  { id: 'ALT-0042', sev: 'H', name: 'CUSTOMER_360_SLA_BREACH', msg: 'Lag 22m > SLA 15m · upstream STG_BILLING delayed', fired: '13:58', owner: 'data-eng', status: 'open' },
  { id: 'ALT-0041', sev: 'M', name: 'WH_AD_HOC_S_IDLE_6D',    msg: 'Warehouse idle 6 days · recommend suspend',         fired: '12:00', owner: 'platform', status: 'open' },
  { id: 'ALT-0040', sev: 'M', name: 'CORTEX_AGENT_OOM_UDF',   msg: 'shap_explain OOM × 6 · WH_CORTEX_L · upsize',       fired: '14:04', owner: 'ml-team',  status: 'open' },
  { id: 'ALT-0039', sev: 'M', name: 'CDR_STREAM_LAG',         msg: 'STREAM_CDRS lag 128K msgs · consumer behind',        fired: '14:01', owner: 'noc',      status: 'open' },
  { id: 'ALT-0038', sev: 'L', name: 'TASK_CHURN_SCORE_SLOW',  msg: 'Duration 242s vs 7d avg 148s · trending up',         fired: '01:04', owner: 'ml-team',  status: 'ack' },
  { id: 'ALT-0037', sev: 'L', name: 'WH_CORTEX_L_QUEUE',      msg: 'Queue depth 2 for 8min · consider scale-out',        fired: '14:02', owner: 'platform', status: 'ack' },
]

const ALERT_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D-${13 - i}`,
  H: [0,0,1,0,0,1,0,0,0,1,0,0,0,1][i],
  M: [2,3,2,4,3,2,3,2,4,2,3,3,2,2][i],
  L: [3,4,5,3,4,3,4,5,3,4,3,4,4,3][i],
}))

const ERROR_RATE_TREND = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  rate: parseFloat((0.3 + Math.abs(Math.sin(i / 5)) * 0.3 + (i === 8 ? 0.4 : i === 14 ? 0.5 : 0)).toFixed(2)),
}))

const SEV_COLORS: Record<string, string> = {
  ERR: 'bg-rose-100 text-rose-700',
  WARN: 'bg-amber-100 text-amber-700',
  INFO: 'bg-sky-100 text-sky-700',
}

export default function ObservabilityPage() {
  const [tab, setTab] = useState<Tab>('Pipeline')
  const [pipelineStatus, setPipelineStatus] = useState<'all' | 'ok' | 'warn'>('all')
  const [taskProject, setTaskProject] = useState('all')
  const [queryMinSec, setQueryMinSec] = useState(0)
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | 'ok' | 'late'>('all')
  const [alertSev, setAlertSev] = useState<'all' | 'H' | 'M' | 'L'>('all')

  const filteredPipelines = useMemo(() =>
    pipelineStatus === 'all'
      ? PIPELINE_STATUS
      : PIPELINE_STATUS.filter(p => p.status.toLowerCase() === pipelineStatus)
  , [pipelineStatus])

  const filteredTasks = useMemo(() =>
    taskProject === 'all' ? TASK_RUNS : TASK_RUNS.filter(t => t.owner === taskProject)
  , [taskProject])

  const filteredQueries = useMemo(() =>
    queryMinSec === 0 ? QUERY_PERF : QUERY_PERF.filter(q => q.sec >= queryMinSec)
  , [queryMinSec])

  const filteredAlerts = useMemo(() =>
    alertSev === 'all' ? ALERTS : ALERTS.filter(a => a.sev === alertSev)
  , [alertSev])

  const freshnessSummary = useMemo(() => ({
    ok:   FRESHNESS.filter(f => f.status === 'OK').length,
    late: FRESHNESS.filter(f => f.status === 'LATE').length,
  }), [])

  const pipelineLagPct = useMemo(() => {
    const lagging = PIPELINE_STATUS.filter(p => p.lag_s > 0).length
    return ((lagging / PIPELINE_STATUS.length) * 100).toFixed(0)
  }, [])

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title={tt('Observability · Pipeline health')}
        subtitle={tt('pipeline health · task/DT runs · freshness SLAs · query performance · warehouse load · event telemetry · alerts · error rates')}
      />

      {/* KPI row 1 */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label={tt('Events / hour')}
          value="142K"
          delta={tt('+4.2% vs 7d avg')}
          trend="up"
          icon={Activity}
        />
        <KpiCard
          label={tt('Error rate 24h')}
          value="0.42%"
          delta={tt('-0.08pp vs 7d')}
          trend="up"
          icon={AlertTriangle}
        />
        <KpiCard
          label={tt('p95 agent latency')}
          value="3.4s"
          delta={tt('SLA 5s · on track')}
          trend="up"
          icon={Zap}
        />
        <KpiCard
          label={tt('p95 query latency')}
          value="1.6s"
          delta={tt('-0.2s vs 7d')}
          trend="up"
          icon={Server}
        />
        <KpiCard
          label={tt('Open alerts')}
          value="4"
          delta={tt('1H · 2M · 1L')}
          accent
          icon={AlertTriangle}
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label={tt('Pipeline runs 24h')}
          value="1,482"
          delta={tt('99.6% success')}
          trend="up"
          icon={Database}
        />
        <KpiCard
          label={tt('DT refreshes 24h')}
          value="84"
          delta={tt('4 late vs SLA')}
          trend="down"
          icon={Clock}
        />
        <KpiCard
          label={tt('Stale tables')}
          value="3"
          delta={tt('SLA breach active')}
          accent
        />
        <KpiCard
          label={tt('Guard hits 24h')}
          value="7"
          delta={tt('+2 vs 7d')}
          trend="down"
        />
        <KpiCard
          label={tt('WH avg load')}
          value="68%"
          delta={tt('+3pp vs 7d')}
          trend="down"
          icon={Server}
        />
      </div>

      {/* Health summary banner */}
      <Panel title={tt('Platform health summary · Cable Bahamas Snowflake · live')}>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">{tt('Pipelines healthy')}</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">5 / 7</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{tt('2 WARN · lag > threshold')}</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{tt('SLA compliance today')}</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">71%</div>
            <div className="text-[10px] text-amber-600 mt-0.5">{tt('3 tables breached SLA window')}</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-sky-700 font-bold">{tt('Warehouses active')}</div>
            <div className="text-2xl font-extrabold text-sky-700 mt-1">5 / 7</div>
            <div className="text-[10px] text-sky-600 mt-0.5">{tt('2 idle · recommend suspend')}</div>
          </div>
          <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">{tt('Event table rows today')}</div>
            <div className="text-2xl font-extrabold text-violet-700 mt-1">3.4M</div>
            <div className="text-[10px] text-violet-600 mt-0.5">{tt('28 logger sources · OTel compatible')}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3 text-[11px] border-t border-black/5 pt-3">
          <span className="text-vfes-dark/50">{tt('Quick links:')}</span>
          <Link to="/portal/data-products"  className="text-vfes-dark font-semibold hover:underline">{tt('Data products')}</Link>
          <Link to="/portal/horizon"        className="text-vfes-dark font-semibold hover:underline">{tt('Horizon security')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark font-semibold hover:underline">{tt('Data contracts')}</Link>
          <Link to="/portal/rbac"           className="text-vfes-dark font-semibold hover:underline">{tt('RBAC')}</Link>
        </div>
      </Panel>

      {/* ML Insight */}
      <MlInsightSection
        heading="Pipeline anomaly detection"
        models={[
          { name: 'ANOMALY_DETECT_V2',  metric: '98.4%', sub: 'precision · 90d training window'           },
          { name: 'FRESHNESS_FORECAST', metric: '±2.1m', sub: 'lag prediction · 15-min horizon'           },
          { name: 'WH_OVERLOAD_SCORE',  metric: '0.84',  sub: 'AUC-ROC · gradient-boost · 8 WH features' },
        ]}
        agentLabel="Run pipeline health scan"
        agentSteps={[
          'Query ACCOUNT_USAGE.PIPE_USAGE_HISTORY last 24h',
          'Score each pipeline via ANOMALY_DETECT_V2',
          'Identify freshness breaches via FRESHNESS_FORECAST',
          'Rank WH risks with WH_OVERLOAD_SCORE',
          'Generate pre-emptive action plan with cost estimate',
        ]}
        agentBlurb="Cortex Analyst + Snowflake ML models detect pipeline anomalies, predict SLA breaches 15 min ahead, and recommend pre-emptive scaling actions sourced from ACCOUNT_USAGE."
        decision={{
          title:     'TASK_BUILD_CUSTOMER_360 SLA breach · proactive scaling recommended',
          detail:    'Upstream STG_BILLING accumulated 14m lag. FRESHNESS_FORECAST predicts CUSTOMER_360 will breach 15m SLA within 8 minutes. Scale WH_TRANSFORM_L to XL for 30 min.',
          impact:    'Avoids cascade to 3 downstream dashboards + 2 Cortex agents',
          risk:      'XL size adds ~BSD 12 for 30min window',
          linkTo:    '/portal/cost',
          linkLabel: 'View cost impact',
        }}
        chart={{
          kind:   'area',
          title:  'Pipeline anomaly score · 24h rolling',
          data:   Array.from({ length: 24 }, (_, i) => ({
            h:         `${i}:00`,
            score:     parseFloat((0.15 + Math.abs(Math.sin(i / 5)) * 0.4 + (i >= 13 && i <= 15 ? 0.3 : 0)).toFixed(2)),
            threshold: 0.6,
          })),
          xKey: 'h',
          series: [
            { key: 'score',     name: 'Anomaly score',   color: AMBER },
            { key: 'threshold', name: 'Alert threshold', color: '#dc2626', dashed: true },
          ],
          note: 'Score > 0.6 triggers proactive alert. Spike at 13:00 corresponds to STG_BILLING degradation.',
        }}
      />

      {/* 8-pill tab bar */}
      <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
              tab === t ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/60 hover:bg-black/5'
            }`}
          >
            {tt(t)}
          </button>
        ))}
      </div>

      {/* ─── Tab: Pipeline ─────────────────────────────────── */}
      {tab === 'Pipeline' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'ok', 'warn'] as const).map(v => (
            <button
              key={v}
              onClick={() => setPipelineStatus(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pipelineStatus === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-vfes-dark/50">
            {tt('Lagging pipelines:')} <span className="font-bold text-amber-600">{pipelineLagPct}%</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Ingestion pipeline status')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Pipeline')}</th>
                  <th className="text-left">{tt('Type')}</th>
                  <th className="text-right">{tt('Rows 24h')}</th>
                  <th className="text-right">{tt('Lag s')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPipelines.map((p) => (
                  <tr key={p.name} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-semibold">{p.name}</td>
                    <td className="text-[11px] text-vfes-dark/65">{tt(p.type)}</td>
                    <td className="text-right font-mono">{p.rows_24h.toLocaleString()}</td>
                    <td className={`text-right font-mono font-bold ${p.lag_s > 0 ? 'text-amber-600' : ''}`}>{p.lag_s}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${p.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tt('Pipeline run trend · 24h success / failed / skipped')}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={PIPELINE_RUNS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="success" stackId="a" stroke={GREEN}    fill={GREEN}    fillOpacity={0.3} name={tt('Success')} />
                <Area type="monotone" dataKey="failed"  stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name={tt('Failed')}  />
                <Area type="monotone" dataKey="skipped" stackId="a" stroke={SLATE}    fill={SLATE}    fillOpacity={0.3} name={tt('Skipped')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/lineage"           className="text-vfes-dark font-semibold hover:underline">{tt('Lineage')}</Link>
          <Link to="/portal/data-quality"      className="text-vfes-dark font-semibold hover:underline">{tt('Data quality')}</Link>
          <Link to="/portal/incidents"         className="text-vfes-dark font-semibold hover:underline">{tt('Incidents')}</Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Snowpipe throughput today')}</div>
            <div className="font-mono font-bold text-lg">16.1M {tt('rows')}</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('4 active pipes · 3 healthy · 1 warn')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Openflow CDC runs today')}</div>
            <div className="font-mono font-bold text-lg">42.8K {tt('rows')}</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('Salesforce CRM · latency 22s avg')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Doc AI extractions today')}</div>
            <div className="font-mono font-bold text-lg">2,840</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('INVOICE_PIPELINE · avg conf 0.94')}</div>
          </div>
        </div>
      </>)}

      {/* ─── Tab: Tasks ─────────────────────────────────────── */}
      {tab === 'Tasks' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Owner:')}</span>
          {['all', 'data-eng', 'ml-team', 'noc', 'finance'].map(v => (
            <button
              key={v}
              onClick={() => setTaskProject(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${taskProject === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Scheduled task runs')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Task')}</th>
                  <th className="text-left">{tt('Schedule')}</th>
                  <th className="text-right">{tt('Dur s')}</th>
                  <th className="text-right">{tt('Lag m')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.name} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-semibold">{t.name}</td>
                    <td className="font-mono text-[10px]">{t.schedule}</td>
                    <td className="text-right font-mono">{t.dur_s}</td>
                    <td className={`text-right font-mono font-bold ${t.lag_m > 0 ? 'text-amber-600' : ''}`}>{t.lag_m}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${t.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(t.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tt('Task duration trend · 7d avg / p95')}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TASK_LATENCY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avg" stroke={GREEN} strokeWidth={2} name={tt('Avg s')}  dot={false} />
                <Line type="monotone" dataKey="p95" stroke={AMBER} strokeWidth={2} name={tt('p95 s')} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Dynamic table refresh status')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Dynamic table')}</th>
                <th className="text-left">{tt('Target lag')}</th>
                <th className="text-left">{tt('Last refresh')}</th>
                <th className="text-right">{tt('Rows')}</th>
                <th className="text-right">{tt('Dur ms')}</th>
                <th className="text-left">{tt('Mode')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {DT_RUNS.map((d) => (
                <tr key={d.dt} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{d.dt}</td>
                  <td className="font-mono text-[11px]">{d.lag}</td>
                  <td className="font-mono text-[11px]">{d.last}</td>
                  <td className="text-right font-mono">{d.rows}</td>
                  <td className="text-right font-mono">{d.dur_ms.toLocaleString()}</td>
                  <td className="text-[11px]">{tt(d.mode)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${d.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : d.status === 'LATE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(d.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Task failures · 7d')}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={TASK_LATENCY_TREND}>
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="failures" fill="#dc2626" name={tt('Failures')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="flex items-center gap-4 mt-1 text-[11px]">
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering pipelines')}</Link>
          <Link to="/portal/catalog"           className="text-vfes-dark font-semibold hover:underline">{tt('Browse catalog')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Queries ───────────────────────────────────── */}
      {tab === 'Queries' && (<>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-[11px] text-vfes-dark/55">{tt('Min duration (s):')}</span>
          {[0, 60, 300, 600].map(v => (
            <button
              key={v}
              onClick={() => setQueryMinSec(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${queryMinSec === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {v === 0 ? tt('All') : `>${v}s`}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-vfes-dark/50">
            {tt('Showing')} {filteredQueries.length} / {QUERY_PERF.length} {tt('queries')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Query duration distribution · all queries')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={QUERY_DIST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BLUE} name={tt('Queries')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Spill vs scan GB · filtered queries')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredQueries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="id" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="scanned_gb" fill={BLUE}    name={tt('Scanned GB')} />
                <Bar dataKey="spill"      fill="#dc2626" name={tt('Spill GB')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Top queries · filtered · cache / spill breakdown')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Query ID')}</th>
                <th className="text-left">{tt('User')}</th>
                <th className="text-left">{tt('Warehouse')}</th>
                <th className="text-right">{tt('Sec')}</th>
                <th className="text-right">{tt('Scanned GB')}</th>
                <th className="text-right">{tt('Spill GB')}</th>
                <th className="text-left">{tt('Cache')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((q) => (
                <tr key={q.id} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark text-[11px]">{q.id}</td>
                  <td className="font-mono text-[11px]">{q.user}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/70">{q.wh}</td>
                  <td className={`text-right font-mono font-bold ${q.sec > 300 ? 'text-amber-600' : ''}`}>{q.sec}</td>
                  <td className="text-right font-mono">{q.scanned_gb.toFixed(1)}</td>
                  <td className={`text-right font-mono ${q.spill > 0 ? 'text-rose-600 font-bold' : ''}`}>{q.spill.toFixed(1)}</td>
                  <td>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${q.cache === 'result' ? 'bg-emerald-100 text-emerald-700' : q.cache === 'none' ? 'bg-zinc-100 text-zinc-500' : 'bg-sky-100 text-sky-700'}`}>
                      {tt(q.cache)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">{tt('Spill to local/remote storage indicates insufficient warehouse memory for the query workload.')}</div>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cost"         className="text-vfes-dark font-semibold hover:underline">{tt('Cost intelligence')}</Link>
          <Link to="/portal/architecture" className="text-vfes-dark font-semibold hover:underline">{tt('Architecture overview')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Warehouses ────────────────────────────────── */}
      {tab === 'Warehouses' && (<>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Warehouse load · current snapshot')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Warehouse')}</th>
                  <th className="text-left">{tt('Size')}</th>
                  <th className="text-right">{tt('Load %')}</th>
                  <th className="text-right">{tt('Queue')}</th>
                  <th className="text-right">{tt('Credits 24h')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {WH_LOAD.map((w) => (
                  <tr key={w.wh} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-semibold">{w.wh}</td>
                    <td className="font-mono text-[11px]">{w.size}</td>
                    <td className="text-right font-mono font-bold">
                      <span className={w.load > 80 ? 'text-rose-600' : w.load < 20 ? 'text-zinc-400' : ''}>
                        {w.load}%
                      </span>
                    </td>
                    <td className={`text-right font-mono ${w.queue > 0 ? 'text-amber-600 font-bold' : ''}`}>{w.queue}</td>
                    <td className="text-right font-mono">{w.credits_24h}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${w.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : w.status === 'IDLE' ? 'bg-zinc-100 text-zinc-500' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(w.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tt('Warehouse load trend · 24h')}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={WH_LOAD_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="BI_M"        stroke={BLUE}  strokeWidth={2} dot={false} name={tt('WH_BI_M')} />
                <Line type="monotone" dataKey="TRANSFORM_L" stroke={GREEN} strokeWidth={2} dot={false} name={tt('WH_TRANSFORM_L')} />
                <Line type="monotone" dataKey="CORTEX_L"    stroke={AMBER} strokeWidth={2} dot={false} name={tt('WH_CORTEX_L')} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Credits consumed · 7d · stacked by warehouse')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WH_CREDITS_DAILY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="BI_M"        stackId="a" fill={BLUE}    name={tt('WH_BI_M')} />
              <Bar dataKey="TRANSFORM_L" stackId="a" fill={GREEN}   name={tt('WH_TRANSFORM_L')} />
              <Bar dataKey="CORTEX_L"    stackId="a" fill={AMBER}   name={tt('WH_CORTEX_L')} />
              <Bar dataKey="ML_GPU_M"    stackId="a" fill="#7C3AED" name={tt('WH_ML_GPU_M')} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/50 mt-2">{tt('WH_AD_HOC_S and WH_PORTAL_XS are idle and consuming IDLE_MINIMUM credits only — recommend suspend.')}</div>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cost"         className="text-vfes-dark font-semibold hover:underline">{tt('Cost intelligence · credit details')}</Link>
          <Link to="/portal/architecture" className="text-vfes-dark font-semibold hover:underline">{tt('Architecture overview')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Freshness ─────────────────────────────────── */}
      {tab === 'Freshness' && (<>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'ok', 'late'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFreshnessFilter(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${freshnessFilter === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v.toUpperCase())}
            </button>
          ))}
          <span className="ml-4 text-[11px]">
            <span className="text-emerald-600 font-bold">{freshnessSummary.ok} {tt('on-time')}</span>
            {' · '}
            <span className="text-rose-600 font-bold">{freshnessSummary.late} {tt('late')}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Freshness SLA status · all tracked tables')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Table')}</th>
                  <th className="text-right">{tt('SLA min')}</th>
                  <th className="text-right">{tt('Lag min')}</th>
                  <th className="text-left">{tt('Status')}</th>
                  <th className="text-left">{tt('Owner')}</th>
                  <th className="text-left">{tt('Last refresh')}</th>
                </tr>
              </thead>
              <tbody>
                {FRESHNESS
                  .filter(f => freshnessFilter === 'all' || f.status.toLowerCase() === freshnessFilter)
                  .map((f) => (
                  <tr key={f.table} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-semibold">{f.table}</td>
                    <td className="text-right font-mono">{f.sla_m}</td>
                    <td className={`text-right font-mono font-bold ${f.lag_m > f.sla_m ? 'text-rose-600' : ''}`}>{f.lag_m}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${f.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {tt(f.status)}
                      </span>
                    </td>
                    <td className="text-[11px]">{tt(f.owner)}</td>
                    <td className="font-mono text-[10px] text-vfes-dark/55">{f.last_refresh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tt('Freshness SLA compliance · 7d on-time / late / critical')}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={FRESHNESS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ok"       stackId="a" stroke={GREEN}   fill={GREEN}   fillOpacity={0.3} name={tt('On-time')}  />
                <Area type="monotone" dataKey="late"     stackId="a" stroke={AMBER}   fill={AMBER}   fillOpacity={0.4} name={tt('Late')}     />
                <Area type="monotone" dataKey="critical" stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name={tt('Critical')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-contracts" className="text-vfes-dark font-semibold hover:underline">{tt('Data contracts · SLA definitions')}</Link>
          <Link to="/portal/data-quality"   className="text-vfes-dark font-semibold hover:underline">{tt('Data quality dashboard')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Telemetry ─────────────────────────────────── */}
      {tab === 'Telemetry' && (<>
        <Panel
          title={tt('Mobile / RAN observability')}
          action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              {tt('8 signals · 2 on Watch')}
            </span>
          }
        >
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Workload')}</th>
                <th>{tt('Metric')}</th>
                <th>{tt('Target')}</th>
                <th>{tt('Current')}</th>
                <th>{tt('Status')}</th>
                <th>{tt('Trend')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_OBSERVABILITY.map((o) => (
                <tr key={o.workload + o.metric} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{o.workload}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(o.metric)}</td>
                  <td className="font-mono text-xs">{o.target}</td>
                  <td className="font-mono text-xs font-bold">{o.current}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${o.status === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {tt(o.status)}
                    </span>
                  </td>
                  <td className={`text-xs font-bold ${o.trend === 'down' ? 'text-emerald-600' : o.trend === 'up' ? 'text-red-600' : 'text-vfes-dark/65'}`}>
                    {o.trend === 'down' ? '↓' : o.trend === 'up' ? '↑' : '→'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">
            {tt('V_RAN_TELEMETRY query p95 + IoT stream backpressure on Watch — clustering key + scaling actions queued.')}
          </div>
        </Panel>

        <Panel title={tt('CBL_GOV.OBSERVABILITY.EVENTS · live tail (last 10 events)')}>
          <div className="font-mono text-[11px] space-y-1">
            {LOGS.map((l, i) => (
              <div key={i} className="flex gap-2 items-start border-b border-black/5 pb-1">
                <span className="text-vfes-dark/50 w-24 shrink-0">{l.ts}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold w-12 text-center ${SEV_COLORS[l.sev]}`}>{l.sev}</span>
                <span className="font-semibold w-56 truncate">{l.src}</span>
                <span className="flex-1">{l.msg}</span>
                <span className="text-vfes-dark/40 text-[10px]">{l.tags}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Agent / query latency · 24h · p50 / p95 / p99')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={LATENCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'sec', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="p50" stroke={GREEN}   strokeWidth={2} dot={false} name={tt('p50')} />
              <Line type="monotone" dataKey="p95" stroke={AMBER}   strokeWidth={2} dot={false} name={tt('p95')} />
              <Line type="monotone" dataKey="p99" stroke="#dc2626" strokeWidth={2} dot={false} name={tt('p99')} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/agents"         className="text-vfes-dark font-semibold hover:underline">{tt('Cortex agents')}</Link>
          <Link to="/portal/ai-insights"    className="text-vfes-dark font-semibold hover:underline">{tt('AI insights')}</Link>
          <Link to="/portal/semantic-views" className="text-vfes-dark font-semibold hover:underline">{tt('Semantic views')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Alerts ────────────────────────────────────── */}
      {tab === 'Alerts' && (<>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-vfes-dark/55">{tt('Severity:')}</span>
          {(['all', 'H', 'M', 'L'] as const).map(v => (
            <button
              key={v}
              onClick={() => setAlertSev(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${alertSev === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
          <span className="ml-4 text-[10px] text-vfes-dark/50">
            {tt('Showing')} {filteredAlerts.length} / {ALERTS.length} {tt('alerts')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Active alerts · filtered by severity')}>
            <div className="space-y-2">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-3 ${a.sev === 'H' ? 'border-rose-200 bg-rose-50/40' : a.sev === 'M' ? 'border-amber-200 bg-amber-50/40' : 'border-zinc-200 bg-zinc-50/40'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold">{a.name}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${a.sev === 'H' ? 'bg-rose-100 text-rose-700' : a.sev === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {a.sev}
                    </span>
                  </div>
                  <div className="text-[11px] text-vfes-dark/70">{a.msg}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-vfes-dark/50">{tt('fired')} {a.fired} · {tt('owner:')} {a.owner}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${a.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {tt(a.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={tt('Alert trend · 14d · H / M / L severity')}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ALERT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="H" stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} name={tt('High')}   />
                <Area type="monotone" dataKey="M" stackId="a" stroke={AMBER}   fill={AMBER}   fillOpacity={0.4} name={tt('Medium')} />
                <Area type="monotone" dataKey="L" stackId="a" stroke={SLATE}   fill={SLATE}   fillOpacity={0.3} name={tt('Low')}    />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/incidents"    className="text-vfes-dark font-semibold hover:underline">{tt('Incident management')}</Link>
          <Link to="/portal/horizon"      className="text-vfes-dark font-semibold hover:underline">{tt('Horizon security')}</Link>
          <Link to="/portal/data-quality" className="text-vfes-dark font-semibold hover:underline">{tt('Data quality checks')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Errors ────────────────────────────────────── */}
      {tab === 'Errors' && (<>
        <Panel title={tt('Error rate trend · 24h')}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={ERROR_RATE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#dc2626" strokeWidth={2} name={tt('Error %')} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Cortex Agent traces · last 30 min')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Trace ID')}</th>
                <th className="text-left">{tt('Root span')}</th>
                <th className="text-right">{tt('Duration')}</th>
                <th className="text-right">{tt('Spans')}</th>
                <th className="text-left">{tt('Status')}</th>
                <th className="text-left">{tt('User')}</th>
              </tr>
            </thead>
            <tbody>
              {TRACES.map((t) => (
                <tr key={t.id} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark">{t.id}</td>
                  <td className="font-mono">{t.root}</td>
                  <td className="text-right font-mono">{t.dur_ms} ms</td>
                  <td className="text-right font-mono">{t.spans}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${t.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : t.status === 'err' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(t.status)}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]">{t.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Errors by type · 24h')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ERRORS_BY_TYPE} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="t" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="c" fill="#dc2626" name={tt('Count')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Top error fingerprints · agent + SQL + guardrail')}>
            <div className="space-y-2 text-[12px]">
              {[
                { f: 'tool_call timeout: shap_explain',           c: 18, last: '14:08' },
                { f: 'OOM on WH_CORTEX_L when explain_tree',      c: 6,  last: '14:04' },
                { f: 'sql_compile: column EMAAIL does not exist',  c: 12, last: '13:42' },
                { f: 'cortex_guard: jailbreak prompt blocked',     c: 4,  last: '14:05' },
                { f: 'token_limit: 8192 exceeded',                 c: 3,  last: '13:18' },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <div>
                    <div className="font-mono text-[11px]">{e.f}</div>
                    <div className="text-[9px] text-vfes-dark/50">{tt('last seen')} {e.last}</div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-rose-600">×{e.c}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/agents" className="text-vfes-dark font-semibold hover:underline">{tt('Cortex agents status')}</Link>
          <Link to="/portal/cdo"    className="text-vfes-dark font-semibold hover:underline">{tt('CDO dashboard')}</Link>
          <Link to="/portal/rbac"   className="text-vfes-dark font-semibold hover:underline">{tt('RBAC · access control')}</Link>
        </div>
      </>)}

      {/* ─── Navigation tiles ───────────────────────────────── */}
      <div className="border-t border-black/5 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold mb-3">
          {tt('Related Snowflake surfaces')}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <Link to="/portal/catalog" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Catalog')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Browse all objects')}</div>
          </Link>
          <Link to="/portal/lineage" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Lineage')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Upstream / downstream')}</div>
          </Link>
          <Link to="/portal/data-quality" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Data quality')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('DMF checks · health')}</div>
          </Link>
          <Link to="/portal/data-contracts" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Data contracts')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('SLA · owners · schema')}</div>
          </Link>
          <Link to="/portal/cost" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Cost intelligence')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Credits · budgets')}</div>
          </Link>
          <Link to="/portal/environments" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold text-vfes-dark">{tt('Environments')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('DEV → STAGE → PROD')}</div>
          </Link>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Event table CBL_GOV.OBSERVABILITY.EVENTS stores structured telemetry from agents, pipelines, warehouses, and Cortex services. Retention: 30 days active + 7 days time-travel. Schema: TIMESTAMP, SEVERITY, SOURCE, MESSAGE, TRACE_ID, SPAN_ID, TAGS, USER_NAME, ROLE, WAREHOUSE.')}
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Activity className="w-3 h-3" />
        {tt('source: CBL_GOV.OBSERVABILITY.EVENTS (event table) · 28 logger sources · OpenTelemetry compatible')}
      </div>
    </div>
  )
}
