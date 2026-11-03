import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Server, Smartphone, Cpu, Activity, Gauge,
  Bell, GitBranch, Database, Package, Monitor, Zap, AlertTriangle, Clock,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import { MOBILE_APPS } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const STREAMLIT = [
  { app: 'CableBahamas Portal',           env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 412, sessions_30d: 4180, runtime: 'SiS · Python 3.11', steward: 'Pieter Knowles' },
  { app: 'CLV Explorer',                env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 84,  sessions_30d: 612,  runtime: 'SiS',                steward: 'Emma Rolle' },
  { app: 'Pricing Simulator',           env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 38,  sessions_30d: 248,  runtime: 'SiS',                steward: 'Pricing DS' },
  { app: 'Bundle Profitability',        env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 26,  sessions_30d: 184,  runtime: 'SiS',                steward: 'Niels Bodart' },
  { app: 'Network NOC console',         env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 64,  sessions_30d: 1820, runtime: 'SiS',                steward: 'Lars Willems' },
  { app: 'CEO briefing surface',        env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 18,  sessions_30d: 96,   runtime: 'SiS',                steward: 'CFO office' },
  { app: 'Field-ops dispatch',          env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 142, sessions_30d: 3140, runtime: 'SiS',                steward: 'Field ops' },
  { app: 'Compliance Q&A',              env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 22,  sessions_30d: 184,  runtime: 'SiS',                steward: 'CRO office' },
  { app: 'Procurement insights',        env: 'STAGE',   wh: 'WH_PORTAL_XS', users_30d: 6,   sessions_30d: 24,   runtime: 'SiS',                steward: 'Procurement' },
  { app: 'B2B deal closer co-pilot',    env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 38,  sessions_30d: 412,  runtime: 'SiS',                steward: 'B2B Sales Ops' },
  { app: 'War-room dashboard',          env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 12,  sessions_30d: 48,   runtime: 'SiS',                steward: 'Pieter Knowles' },
  { app: 'People HR-BP cockpit',        env: 'PROD',    wh: 'WH_PORTAL_XS', users_30d: 14,  sessions_30d: 96,   runtime: 'SiS',                steward: 'People Ops' },
]

const NATIVE_APPS = [
  { app: 'CBL_NETWORK_INTEL_APP',  publisher: 'Cable Bahamas',                  consumers: 14, version: 'v1.4.2', spend_mtd: 'BSD 840', state: 'live'      },
  { app: 'TOMORROW_IO_FORECAST_APP', publisher: 'Tomorrow.io',           consumers: 1,  version: 'v3.1.0', spend_mtd: 'BSD 3.2K', state: 'installed' },
  { app: 'OPENAI_BENCHMARK_APP',    publisher: 'Snowflake AI Research', consumers: 1,  version: 'v0.4.0', spend_mtd: 'BSD 18',   state: 'installed' },
]

const SPCS = [
  { svc: 'agent_runtime_a',     pool: 'CP_GPU_S',  replicas: 2, image: 'cablebahamas/agent-runtime:1.4.2', endpoints: 'cortex-agent · websocket', state: 'running' },
  { svc: 'rag_indexer',         pool: 'CP_CPU_M',  replicas: 1, image: 'cablebahamas/rag-indexer:0.9.1',   endpoints: 'jobs',                     state: 'running' },
  { svc: 'doc_parser_arctic',   pool: 'CP_GPU_M',  replicas: 1, image: 'cablebahamas/doc-parser:2.1.0',    endpoints: 'rest-api',                 state: 'running' },
  { svc: 'streamlit_extras',    pool: 'CP_CPU_S',  replicas: 1, image: 'cablebahamas/streamlit-x:0.6.0',   endpoints: 'http',                     state: 'running' },
]

const NOTEBOOKS = [
  { nb: 'churn_xgb_v3_train.ipynb',     owner: 'Emma Rolle',  schedule: 'monthly · 1st 02:00 UTC', last_run: '2025-10-01', state: 'success' },
  { nb: 'clv_lgbm_train.ipynb',          owner: 'Emma Rolle',  schedule: 'monthly · 1st 03:00 UTC', last_run: '2025-10-01', state: 'success' },
  { nb: 'eda_customer_360.ipynb',        owner: 'Lars Willems',  schedule: 'on-demand',                 last_run: '2025-10-22', state: 'success' },
  { nb: 'fraud_eval.ipynb',              owner: 'Lars Willems',  schedule: 'weekly · Mon 06:00 UTC',    last_run: '2025-10-19', state: 'success' },
  { nb: 'doc_extract_finetune.ipynb',    owner: 'Pieter Knowles',    schedule: 'monthly',                    last_run: '2025-09-30', state: 'success' },
]

const COMPUTE_POOLS = [
  { pool: 'CP_GPU_S',  type: 'GPU_NV_S',   nodes: 2, gpu_per: 1, cpu_per: 4,  mem_gb: 32,  cost_hr: 'BSD 2.40', status: 'active', services: 1 },
  { pool: 'CP_GPU_M',  type: 'GPU_NV_M',   nodes: 2, gpu_per: 4, cpu_per: 16, mem_gb: 128, cost_hr: 'BSD 9.60', status: 'active', services: 2 },
  { pool: 'CP_CPU_S',  type: 'CPU_X64_S',  nodes: 2, gpu_per: 0, cpu_per: 4,  mem_gb: 16,  cost_hr: 'BSD 0.60', status: 'active', services: 2 },
  { pool: 'CP_CPU_M',  type: 'CPU_X64_M',  nodes: 3, gpu_per: 0, cpu_per: 8,  mem_gb: 32,  cost_hr: 'BSD 1.20', status: 'active', services: 1 },
  { pool: 'CP_CPU_XS', type: 'CPU_X64_XS', nodes: 1, gpu_per: 0, cpu_per: 2,  mem_gb: 8,   cost_hr: 'BSD 0.30', status: 'idle',   services: 0 },
]

const SESSION_TREND = [
  { m: 'Jun', sis: 3840, native: 320, spcs: 180 },
  { m: 'Jul', sis: 3920, native: 380, spcs: 210 },
  { m: 'Aug', sis: 4120, native: 420, spcs: 248 },
  { m: 'Sep', sis: 4380, native: 480, spcs: 284 },
  { m: 'Oct', sis: 4620, native: 520, spcs: 312 },
  { m: 'Nov', sis: 4840, native: 580, spcs: 348 },
]

const CREDIT_TREND = [
  { m: 'Jun', gpu: 2200, sis: 120, native: 42 },
  { m: 'Jul', gpu: 2380, sis: 128, native: 46 },
  { m: 'Aug', gpu: 2540, sis: 138, native: 51 },
  { m: 'Sep', gpu: 2680, sis: 146, native: 54 },
  { m: 'Oct', gpu: 2760, sis: 152, native: 58 },
  { m: 'Nov', gpu: 2840, sis: 160, native: 62 },
]

const SPCS_CPU_TREND = [
  { h: '00', agent: 28, rag: 42, doc: 38, extras: 14 },
  { h: '04', agent: 22, rag: 36, doc: 30, extras: 10 },
  { h: '08', agent: 48, rag: 58, doc: 52, extras: 18 },
  { h: '12', agent: 62, rag: 72, doc: 64, extras: 22 },
  { h: '16', agent: 58, rag: 68, doc: 60, extras: 20 },
  { h: '18', agent: 72, rag: 82, doc: 76, extras: 28 },
  { h: '20', agent: 54, rag: 62, doc: 58, extras: 18 },
  { h: '22', agent: 38, rag: 48, doc: 44, extras: 14 },
]

const CONTAINER_HEALTH = [
  { svc: 'agent_runtime_a',  restarts_24h: 0, oom_events: 0, p99_ms: 142, p50_ms: 38,  errors_hr: 0,  status: 'healthy'  },
  { svc: 'rag_indexer',       restarts_24h: 0, oom_events: 0, p99_ms: 384, p50_ms: 112, errors_hr: 2,  status: 'healthy'  },
  { svc: 'doc_parser_arctic', restarts_24h: 1, oom_events: 1, p99_ms: 628, p50_ms: 184, errors_hr: 12, status: 'degraded' },
  { svc: 'streamlit_extras',  restarts_24h: 0, oom_events: 0, p99_ms: 84,  p50_ms: 22,  errors_hr: 0,  status: 'healthy'  },
]

const APP_REVENUE = [
  { app: 'B2B deal closer',      revenue_mtd: 142000, saves_mtd: 28400, nr_deals: 38  },
  { app: 'Pricing Simulator',    revenue_mtd: 84000,  saves_mtd: 16800, nr_deals: 14  },
  { app: 'Bundle Profitability', revenue_mtd: 62000,  saves_mtd: 12400, nr_deals: 22  },
  { app: 'CLV Explorer',         revenue_mtd: 48000,  saves_mtd: 9600,  nr_deals: 84  },
  { app: 'Field-ops dispatch',   revenue_mtd: 38000,  saves_mtd: 7600,  nr_deals: 142 },
]

const REVENUE_TREND = [
  { m: 'Jun', ai: 182, ops: 94,  analytics: 68 },
  { m: 'Jul', ai: 196, ops: 102, analytics: 72 },
  { m: 'Aug', ai: 214, ops: 112, analytics: 78 },
  { m: 'Sep', ai: 228, ops: 124, analytics: 84 },
  { m: 'Oct', ai: 248, ops: 136, analytics: 92 },
  { m: 'Nov', ai: 264, ops: 148, analytics: 98 },
]

const CONSUMER_ORGS = [
  { org: 'CBL_NETWORK_OPS',       apps: 4, users: 248, spend_mtd: 'BSD 1,840', primary: 'Network NOC console',    tier: 'ENTERPRISE' },
  { org: 'CBL_FIELD_OPS',         apps: 2, users: 142, spend_mtd: 'BSD 1,220', primary: 'Field-ops dispatch',      tier: 'ENTERPRISE' },
  { org: 'CBL_COMMERCIAL',        apps: 3, users: 84,  spend_mtd: 'BSD 840',   primary: 'CLV Explorer',            tier: 'BUSINESS'   },
  { org: 'CBL_FINANCE',           apps: 2, users: 38,  spend_mtd: 'BSD 460',   primary: 'Bundle Profitability',    tier: 'BUSINESS'   },
  { org: 'CBL_B2B_SALES',         apps: 1, users: 38,  spend_mtd: 'BSD 380',   primary: 'B2B deal closer co-pilot',tier: 'BUSINESS'   },
  { org: 'PARTNER_FLUVIUS_BE',   apps: 1, users: 12,  spend_mtd: 'BSD 180',   primary: 'CBL_NETWORK_INTEL_APP',   tier: 'EXTERNAL'   },
]

const CONSUMER_TREND = [
  { m: 'Jun', internal: 680, external: 8  },
  { m: 'Jul', internal: 720, external: 10 },
  { m: 'Aug', internal: 762, external: 11 },
  { m: 'Sep', internal: 810, external: 12 },
  { m: 'Oct', internal: 858, external: 12 },
  { m: 'Nov', internal: 892, external: 14 },
]

const DEPLOYMENT_LOG = [
  { ts: '2025-11-22 14:32', app: 'CableBahamas Portal',      version: 'v2.8.1 → v2.8.2', env: 'PROD',  by: 'Pieter Knowles',    result: 'success', duration: '4m 12s'  },
  { ts: '2025-11-21 09:18', app: 'agent_runtime_a',      version: 'v1.4.1 → v1.4.2', env: 'PROD',  by: 'CI/CD',         result: 'success', duration: '7m 48s'  },
  { ts: '2025-11-20 22:04', app: 'doc_parser_arctic',    version: 'v2.0.8 → v2.1.0', env: 'PROD',  by: 'CI/CD',         result: 'warning', duration: '9m 02s'  },
  { ts: '2025-11-19 16:44', app: 'CLV Explorer',         version: 'v1.2.3 → v1.3.0', env: 'PROD',  by: 'Emma Rolle',  result: 'success', duration: '2m 58s'  },
  { ts: '2025-11-18 11:20', app: 'Procurement insights', version: 'v0.9.0 → v0.9.1', env: 'STAGE', by: 'Procurement',   result: 'success', duration: '2m 10s'  },
  { ts: '2025-11-17 08:55', app: 'rag_indexer',          version: 'v0.8.4 → v0.9.1', env: 'PROD',  by: 'CI/CD',         result: 'success', duration: '11m 24s' },
  { ts: '2025-11-16 15:12', app: 'Field-ops dispatch',   version: 'v3.1.2 → v3.2.0', env: 'PROD',  by: 'Field Ops',     result: 'success', duration: '3m 32s'  },
  { ts: '2025-11-15 19:38', app: 'B2B deal closer',      version: 'v2.4.1 → v2.5.0', env: 'PROD',  by: 'B2B Sales Ops', result: 'success', duration: '3m 08s'  },
]

const DEPLOY_TREND = [
  { m: 'Jun', success: 28, warnings: 3, failures: 1 },
  { m: 'Jul', success: 32, warnings: 2, failures: 0 },
  { m: 'Aug', success: 36, warnings: 4, failures: 2 },
  { m: 'Sep', success: 38, warnings: 2, failures: 0 },
  { m: 'Oct', success: 42, warnings: 3, failures: 1 },
  { m: 'Nov', success: 44, warnings: 2, failures: 0 },
]

const VERSION_HISTORY = [
  { app: 'CableBahamas Portal',    current: 'v2.8.2', patches_30d: 3, breaking_changes: 0, consumers: 412 },
  { app: 'agent_runtime_a',    current: 'v1.4.2', patches_30d: 2, breaking_changes: 0, consumers: 28  },
  { app: 'CLV Explorer',       current: 'v1.3.0', patches_30d: 2, breaking_changes: 1, consumers: 84  },
  { app: 'Field-ops dispatch', current: 'v3.2.0', patches_30d: 1, breaking_changes: 0, consumers: 142 },
  { app: 'B2B deal closer',    current: 'v2.5.0', patches_30d: 1, breaking_changes: 1, consumers: 38  },
  { app: 'rag_indexer',        current: 'v0.9.1', patches_30d: 2, breaking_changes: 0, consumers: 12  },
]

const COST_BREAKDOWN = [
  { cat: 'SPCS GPU compute',   mtd: 2840, mom_pct: 8 },
  { cat: 'SPCS CPU compute',   mtd: 1120, mom_pct: 4 },
  { cat: 'WH_PORTAL_XS',      mtd: 680,  mom_pct: 2 },
  { cat: 'Native app licences',mtd: 180,  mom_pct: 0 },
]

const COST_TREND = [
  { m: 'Jun', gpu: 2200, cpu: 940,  wh: 620, lic: 180 },
  { m: 'Jul', gpu: 2380, cpu: 980,  wh: 640, lic: 180 },
  { m: 'Aug', gpu: 2540, cpu: 1020, wh: 652, lic: 180 },
  { m: 'Sep', gpu: 2680, cpu: 1060, wh: 664, lic: 180 },
  { m: 'Oct', gpu: 2760, cpu: 1094, wh: 672, lic: 180 },
  { m: 'Nov', gpu: 2840, cpu: 1120, wh: 680, lic: 180 },
]

type TabId = 'overview' | 'streamlit' | 'spcs' | 'native' | 'notebooks' | 'deployments' | 'consumers' | 'costs'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',       icon: Gauge      },
  { id: 'streamlit',   label: 'Streamlit',      icon: Monitor    },
  { id: 'spcs',        label: 'SPCS',           icon: Cpu        },
  { id: 'native',      label: 'Native Apps',    icon: Package    },
  { id: 'notebooks',   label: 'Notebooks',      icon: Database   },
  { id: 'deployments', label: 'Deployments',    icon: GitBranch  },
  { id: 'consumers',   label: 'Consumers',      icon: Smartphone },
  { id: 'costs',       label: 'Cost & Credits', icon: Zap        },
]

export default function AppsCatalogPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [deployFilter, setDeployFilter] = useState<'all' | 'success' | 'warning' | 'failure'>('all')
  const [costView, setCostView] = useState<'trend' | 'breakdown'>('trend')
  const [appSearch, setAppSearch] = useState('')
  const [spcsRange, setSpcsRange] = useState<'1d' | '7d' | '30d'>('1d')
  const [consumerTier, setConsumerTier] = useState<'all' | 'ENTERPRISE' | 'BUSINESS' | 'EXTERNAL'>('all')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredDeployments = useMemo(
    () => deployFilter === 'all' ? DEPLOYMENT_LOG : DEPLOYMENT_LOG.filter(d => d.result === deployFilter),
    [deployFilter],
  )

  const filteredApps = useMemo(
    () => appSearch.trim() === '' ? STREAMLIT : STREAMLIT.filter(a => a.app.toLowerCase().includes(appSearch.toLowerCase())),
    [appSearch],
  )

  const filteredConsumers = useMemo(
    () => consumerTier === 'all' ? CONSUMER_ORGS : CONSUMER_ORGS.filter(c => c.tier === consumerTier),
    [consumerTier],
  )

  const totalMonthlyRevenue = useMemo(
    () => APP_REVENUE.reduce((s, a) => s + a.revenue_mtd, 0),
    [],
  )

  const totalCreditsGpu = useMemo(
    () => CREDIT_TREND.reduce((s, m) => s + m.gpu, 0),
    [],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Apps · Streamlit · Native · SPCS · Notebooks')}
        subtitle={tt('What\'s running where · usage · spend · ownership')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/agents" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Cpu className="w-4 h-4" /> {tt('Open Agents')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ───────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Apps intelligence"
        models={[
          { name: 'App Usage Predictor',   metric: 'MAPE 6.2%', sub: '30d session forecasting'  },
          { name: 'Cost Anomaly Detector', metric: 'recall 0.92', sub: 'SPCS spend spikes'       },
          { name: 'Container Health Model',metric: 'F1 0.88',   sub: 'OOM & crash prediction'   },
        ]}
        agentLabel={tt('Run Apps Analyst')}
        agentRunningLabel={tt('Analysing…')}
        agentSteps={[
          tt('Fetched session and credit metrics across all apps'),
          tt('Identified SPCS GPU utilisation anomaly on doc_parser_arctic'),
          tt('Correlated usage growth with warehouse cost trend'),
          tt('Generated right-sizing recommendations for compute pools'),
        ]}
        agentBlurb={tt('All app usage, SPCS metrics, and cost signals flow into a single Snowflake model — making cross-surface optimisation possible.')}
        decision={{
          title: tt('Right-size CP_GPU_M and migrate doc_parser to CP_GPU_S'),
          detail: tt('doc_parser_arctic has caused 1 OOM and 1 restart in 24h running on CP_GPU_M. Profiling shows peak GPU usage of 62% — it fits on CP_GPU_S with 4x lower cost per GPU-hour.'),
          impact: tt('-BSD 4,200/month SPCS compute · zero OOM risk'),
          risk: tt('Validate batch throughput on S tier before promoting to PROD'),
          linkTo: '/portal/cost',
          linkLabel: tt('Open Cost detail'),
        }}
        chart={{
          kind: 'area',
          title: tt('Monthly sessions by surface (SiS / Native / SPCS)'),
          xKey: 'm',
          data: SESSION_TREND,
          series: [
            { key: 'sis',    name: tt('Streamlit-in-Snowflake'), color: BLUE  },
            { key: 'native', name: tt('Native Apps'),             color: NAVY  },
            { key: 'spcs',   name: tt('SPCS services'),           color: GREEN },
          ],
          note: tt('SiS sessions +26% YTD, driven by NOC console and field dispatch.'),
        }}
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('doc_parser_arctic: 1 OOM + 1 restart in 24h · CP_GPU_M at 78% avg · SPCS spend up 8% MoM')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Right-size recommendation ready. Review SPCS health tab or open Cost & Credits for full breakdown.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/observability" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Observability →')}
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
          <KpiCard label={tt('Streamlit apps')}  value="12"     delta={tt('+2 this quarter')} trend="up"   icon={Monitor}    accent />
          <KpiCard label={tt('SPCS services')}   value="4"      delta={tt('all running')}     trend="up"   icon={Cpu}        />
          <KpiCard label={tt('Total users 30d')} value="892"    delta={tt('+12% MoM')}        trend="up"   icon={Smartphone} />
          <KpiCard label={tt('Apps spend MTD')}  value="BSD 4,820" delta={tt('+8% MoM')}         trend="down" icon={Zap}        />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Native apps')}         value="3"    delta={tt('1 installed')}    trend="flat" icon={Package}   />
          <KpiCard label={tt('Workspace notebooks')}  value="38"   delta={tt('5 scheduled')}   trend="up"   icon={Database}  />
          <KpiCard label={tt('Deployments 30d')}      value="44"   delta={tt('0 failures')}     trend="up"   icon={GitBranch} />
          <KpiCard label={tt('Compute pools active')} value="4"    delta={tt('1 idle')}         trend="flat" icon={Server}    />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Monthly sessions by surface')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={SESSION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sis"    name={tt('SiS sessions')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="native" name={tt('Native apps')}  stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="spcs"   name={tt('SPCS calls')}   stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Monthly credits consumed by surface')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={CREDIT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gpu"    name={tt('SPCS GPU')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="sis"    name={tt('SiS WH')}   stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="native" name={tt('Native')}   stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Top apps by revenue influence (MTD)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={APP_REVENUE} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="BSD " />
                    <YAxis dataKey="app" type="category" tick={{ fontSize: 10 }} width={128} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v.toLocaleString()}`} />
                    <Bar dataKey="revenue_mtd" name={tt('Revenue MTD')} fill={BLUE} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-vfes-dark/55 mt-2">{tt('Total revenue influence MTD:')} <span className="font-bold" style={{ color: BLUE }}>BSD {totalMonthlyRevenue.toLocaleString()}</span></div>
            </Panel>
          </div>
          <Panel title={tt('Quick links · platform')}>
            <div className="space-y-1 text-[12px]">
              <Link to="/portal/agents"           className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><Cpu           className="w-3.5 h-3.5" /> {tt('Cortex Agents')}</Link>
              <Link to="/portal/ai-insights"      className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Activity       className="w-3.5 h-3.5" /> {tt('AI Insights')}</Link>
              <Link to="/portal/observability"    className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: GREEN  }}><Gauge          className="w-3.5 h-3.5" /> {tt('Observability')}</Link>
              <Link to="/portal/cost"             className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: AMBER  }}><Zap            className="w-3.5 h-3.5" /> {tt('Cost & Credits')}</Link>
              <Link to="/portal/data-products"    className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: PURPLE }}><Package        className="w-3.5 h-3.5" /> {tt('Data Products')}</Link>
              <Link to="/portal/sharing"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: SLATE  }}><Server         className="w-3.5 h-3.5" /> {tt('Sharing & Listing')}</Link>
              <Link to="/portal/environments"     className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><GitBranch      className="w-3.5 h-3.5" /> {tt('Environments')}</Link>
              <Link to="/portal/catalog"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Database       className="w-3.5 h-3.5" /> {tt('Data Catalog')}</Link>
              <Link to="/portal/data-engineering" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: GREEN  }}><Monitor        className="w-3.5 h-3.5" /> {tt('Data Engineering')}</Link>
              <Link to="/portal/horizon"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: AMBER  }}><AlertTriangle   className="w-3.5 h-3.5" /> {tt('Horizon Governance')}</Link>
              <Link to="/portal/clean-rooms"      className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: PURPLE }}><Database       className="w-3.5 h-3.5" /> {tt('Clean Rooms')}</Link>
              <Link to="/portal/iceberg"          className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: SLATE  }}><Server         className="w-3.5 h-3.5" /> {tt('Iceberg & External')}</Link>
            </div>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
          <Server className="w-3 h-3" /> {tt('source: SHOW STREAMLITS · SHOW SERVICES · SHOW APPLICATIONS · SHOW NOTEBOOKS')}
        </div>
        <div className="text-xs text-vfes-dark/40 mt-1">{tt('GPU credits total 6-month:')} {totalCreditsGpu.toLocaleString()} cr</div>
      </>)}

      {/* ════ STREAMLIT ═══════════════════════════════════════════════════════ */}
      {tab === 'streamlit' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total SiS apps')}   value="12"      delta={tt('all on WH_PORTAL_XS')} trend="flat" icon={Monitor}   accent />
          <KpiCard label={tt('Active users 30d')} value="892"     delta={tt('+12% MoM')}            trend="up"   icon={Smartphone}       />
          <KpiCard label={tt('Sessions 30d')}     value="11,214"  delta={tt('+26% YTD')}            trend="up"   icon={Activity}         />
          <KpiCard label={tt('WH credits MTD')}   value="160 cr"  delta={tt('BSD 680 MTD spend')}      trend="down" icon={Zap}              />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Search:')}</span>
          <input
            type="text"
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            placeholder={tt('Filter apps…')}
            className="text-xs border border-black/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-400 w-52"
          />
          <span className="text-[10px] text-vfes-dark/40">{filteredApps.length} {tt('apps')}</span>
        </div>

        <Panel title={tt('Streamlit-in-Snowflake apps')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('App')}</th><th className="text-left">{tt('Env')}</th><th className="text-left">{tt('WH')}</th>
              <th className="text-right">{tt('Users 30d')}</th><th className="text-right">{tt('Sessions 30d')}</th>
              <th className="text-left">{tt('Runtime')}</th><th className="text-left">{tt('Steward')}</th>
            </tr></thead>
            <tbody>
              {filteredApps.map((a) => (
                <tr key={a.app} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{a.app}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${a.env==='PROD'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{a.env}</span></td>
                  <td className="font-mono text-[10px]">{a.wh}</td>
                  <td className="text-right font-mono">{a.users_30d}</td>
                  <td className="text-right font-mono">{a.sessions_30d}</td>
                  <td className="text-[11px]">{a.runtime}</td>
                  <td className="text-[11px]">{a.steward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
          <Panel title={tt('Revenue influence by app (MTD)')}>
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={APP_REVENUE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="BSD " />
                  <YAxis dataKey="app" type="category" tick={{ fontSize: 10 }} width={128} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue_mtd" name={tt('Revenue MTD')}    fill={BLUE}  radius={[0, 4, 4, 0]} />
                  <Bar dataKey="saves_mtd"   name={tt('Cost saves MTD')} fill={GREEN} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('SiS session trend (6-month)')}>
            <div className="h-60">
              <ResponsiveContainer>
                <AreaChart data={SESSION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="sis" name={tt('SiS sessions')} stroke={BLUE} fill={BLUE} fillOpacity={0.18} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Revenue attribution — top 5 apps')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('App')}</th>
              <th className="text-right">{tt('Revenue MTD')}</th>
              <th className="text-right">{tt('Cost saves MTD')}</th>
              <th className="text-right">{tt('Deals / actions')}</th>
            </tr></thead>
            <tbody>
              {APP_REVENUE.map((r) => (
                <tr key={r.app} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{r.app}</td>
                  <td className="text-right font-mono text-emerald-700 font-bold">BSD {r.revenue_mtd.toLocaleString()}</td>
                  <td className="text-right font-mono">BSD {r.saves_mtd.toLocaleString()}</td>
                  <td className="text-right font-mono">{r.nr_deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Mobile / RAN apps')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('6 apps · 5 live · 1 pilot')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('App')}</th><th>{tt('Framework')}</th><th>{tt('Users')}</th><th>{tt('Tier')}</th><th>{tt('Credits / mo')}</th><th>{tt('Owner')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {MOBILE_APPS.map((a) => (
                <tr key={a.name} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{a.name}</td>
                  <td className="text-[11px] text-vfes-dark/65">{a.framework}</td>
                  <td className="font-mono text-xs">{a.users}</td>
                  <td className="font-mono text-xs"><span className="px-1.5 py-0.5 rounded bg-black/5 font-bold">{a.tier}</span></td>
                  <td className="font-mono text-xs">{a.monthlyCreditsK.toFixed(2)}K</td>
                  <td className="text-[11px]">{tt(a.owner)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${a.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(a.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('mobile-noc-cockpit (Streamlit) used daily by 240 NOC engineers. open-ran-vendor-interop is GPU-backed pilot — biggest spend on a per-user basis.')}</div>
        </Panel>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/iceberg"    className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>  {tt('View Iceberg data sources →')}</Link>
          <Link to="/portal/clean-rooms" className="font-semibold hover:underline"     style={{ color: NAVY }}>  {tt('Data Clean Rooms →')}</Link>
        </div>
      </>)}

      {/* ════ SPCS ════════════════════════════════════════════════════════════ */}
      {tab === 'spcs' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Running services')} value="4"      delta={tt('1 degraded container')} trend="down" icon={Cpu}      accent />
          <KpiCard label={tt('Compute pools')}    value="5"      delta={tt('4 active · 1 idle')}    trend="flat" icon={Server}   />
          <KpiCard label={tt('GPU nodes active')} value="4"      delta={tt('CP_GPU_S + CP_GPU_M')}  trend="flat" icon={Zap}      />
          <KpiCard label={tt('SPCS spend MTD')}   value="BSD 3,960" delta={tt('+8% MoM')}              trend="down" icon={Activity} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Time range:')}</span>
          {(['1d', '7d', '30d'] as const).map(r => (
            <button key={r} onClick={() => setSpcsRange(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${spcsRange === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
          <span className="text-[10px] text-vfes-dark/40">{tt('Selected:')} {spcsRange}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SPCS service CPU utilisation — intraday (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={SPCS_CPU_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="agent"  name={tt('agent_runtime_a')}  stroke={BLUE}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rag"    name={tt('rag_indexer')}       stroke={NAVY}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="doc"    name={tt('doc_parser_arctic')} stroke={AMBER}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="extras" name={tt('streamlit_extras')}  stroke={GREEN}  strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Container p99 vs p50 latency (ms)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONTAINER_HEALTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="svc" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p99_ms" name={tt('p99 ms')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="p50_ms" name={tt('p50 ms')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('SPCS services — runtime detail')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Service')}</th><th className="text-left">{tt('Pool')}</th><th className="text-right">{tt('Replicas')}</th>
              <th className="text-left">{tt('Image')}</th><th className="text-left">{tt('Endpoints')}</th><th className="text-left">{tt('State')}</th>
            </tr></thead>
            <tbody>
              {SPCS.map((s) => (
                <tr key={s.svc} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{s.svc}</td>
                  <td className="font-mono text-[10px]">{s.pool}</td>
                  <td className="text-right font-mono">{s.replicas}</td>
                  <td className="font-mono text-[10px]">{s.image}</td>
                  <td className="text-[10px]">{s.endpoints}</td>
                  <td><span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{s.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Container health — 24h window')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Service')}</th>
                <th className="text-right">{tt('Restarts')}</th><th className="text-right">{tt('OOM events')}</th>
                <th className="text-right">{tt('p99 ms')}</th><th className="text-right">{tt('p50 ms')}</th>
                <th className="text-right">{tt('Errors/hr')}</th><th className="text-left">{tt('Status')}</th>
              </tr></thead>
              <tbody>
                {CONTAINER_HEALTH.map((c) => (
                  <tr key={c.svc} className="border-b border-black/5">
                    <td className="py-1.5 font-mono font-semibold">{c.svc}</td>
                    <td className="text-right font-mono">{c.restarts_24h}</td>
                    <td className="text-right font-mono">{c.oom_events}</td>
                    <td className="text-right font-mono">{c.p99_ms}</td>
                    <td className="text-right font-mono">{c.p50_ms}</td>
                    <td className="text-right font-mono">{c.errors_hr}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Compute pools — resource inventory')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Pool')}</th><th className="text-left">{tt('Type')}</th>
                <th className="text-right">{tt('Nodes')}</th><th className="text-right">{tt('GPU')}</th>
                <th className="text-right">{tt('CPU cores')}</th><th className="text-right">{tt('Mem (GB)')}</th>
                <th className="text-right">{tt('Cost/hr')}</th><th className="text-right">{tt('Services')}</th><th className="text-left">{tt('Status')}</th>
              </tr></thead>
              <tbody>
                {COMPUTE_POOLS.map((p) => (
                  <tr key={p.pool} className="border-b border-black/5">
                    <td className="py-1.5 font-mono font-semibold">{p.pool}</td>
                    <td className="font-mono text-[10px]">{p.type}</td>
                    <td className="text-right font-mono">{p.nodes}</td>
                    <td className="text-right font-mono">{p.gpu_per}</td>
                    <td className="text-right font-mono">{p.cpu_per}</td>
                    <td className="text-right font-mono">{p.mem_gb}</td>
                    <td className="text-right font-mono">{p.cost_hr}</td>
                    <td className="text-right font-mono">{p.services}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status==='active'?'bg-emerald-100 text-emerald-700':'bg-zinc-100 text-zinc-500'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/observability" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Open Observability →')}</Link>
          <Link to="/portal/cost"          className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Open Cost & Credits →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('SPCS monthly GPU + CPU compute spend (BSD )')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" BSD " />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gpu" name={tt('GPU compute')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="cpu" name={tt('CPU compute')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-vfes-dark/55 mt-2">
              {tt('doc_parser_arctic right-sizing would save ~BSD 4,200/month. Current CP_GPU_M node cost: BSD 9.60/hr · 2 nodes.')}
            </div>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/40 font-bold uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-3 h-3" /> {tt('source: SHOW SERVICES · SHOW COMPUTE POOLS · ACCOUNT_USAGE.METERING_DAILY_HISTORY')}
        </div>
      </>)}

      {/* ════ NATIVE APPS ═════════════════════════════════════════════════════ */}
      {tab === 'native' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Apps installed')}  value="3"      delta={tt('3 providers')}       trend="flat" icon={Package}   accent />
          <KpiCard label={tt('Total consumers')} value="16"     delta={tt('+2 this month')}     trend="up"   icon={Smartphone}       />
          <KpiCard label={tt('Spend MTD')}       value="BSD 4,058" delta={tt('TOMORROW.IO #1')}    trend="down" icon={Zap}              />
          <KpiCard label={tt('Avg version age')} value="18 d"   delta={tt('1 upgrade pending')} trend="flat" icon={Clock}            />
        </div>

        <Panel title={tt('Native apps installed')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('App')}</th><th className="text-left">{tt('Publisher')}</th>
              <th className="text-right">{tt('Consumers')}</th><th className="text-left">{tt('Version')}</th>
              <th className="text-right">{tt('Spend MTD')}</th><th className="text-left">{tt('State')}</th>
            </tr></thead>
            <tbody>
              {NATIVE_APPS.map((a) => (
                <tr key={a.app} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{a.app}</td>
                  <td className="text-[11px]">{a.publisher}</td>
                  <td className="text-right font-mono">{a.consumers}</td>
                  <td className="font-mono text-[10px]">{a.version}</td>
                  <td className="text-right font-mono font-bold">{a.spend_mtd}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${a.state==='live'?'bg-emerald-100 text-emerald-700':'bg-sky-100 text-sky-700'}`}>{a.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Native app revenue influence trend (kBSD )')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={REVENUE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" kBSD " />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="ai"        name={tt('AI-native')}  stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="ops"       name={tt('Operations')} stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="analytics" name={tt('Analytics')}  stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Platform links')}>
            <div className="space-y-2 text-[12px] mt-2">
              <div className="text-xs text-vfes-dark/55 font-semibold uppercase tracking-widest mb-2">{tt('Sharing & Marketplace')}</div>
              <Link to="/portal/sharing"       className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: BLUE   }}><Package  className="w-3.5 h-3.5" /> {tt('Sharing & Listing hub')}</Link>
              <Link to="/portal/clean-rooms"   className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: NAVY   }}><Database className="w-3.5 h-3.5" /> {tt('Data Clean Rooms')}</Link>
              <Link to="/portal/data-products" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: GREEN  }}><Monitor  className="w-3.5 h-3.5" /> {tt('Data Products')}</Link>
              <Link to="/portal/iceberg"       className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 font-semibold" style={{ color: AMBER  }}><Server   className="w-3.5 h-3.5" /> {tt('Iceberg & External')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ NOTEBOOKS ═══════════════════════════════════════════════════════ */}
      {tab === 'notebooks' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total notebooks')} value="38"    delta={tt('5 scheduled')}    trend="flat" icon={Database} accent />
          <KpiCard label={tt('Success rate')}     value="98.6%" delta={tt('last 30 runs')}  trend="up"   icon={Activity}       />
          <KpiCard label={tt('Avg runtime')}      value="14 min" delta={tt('median p50')}   trend="flat" icon={Clock}          />
          <KpiCard label={tt('Compute spend')}    value="BSD 142"  delta={tt('on SPCS GPU')}   trend="flat" icon={Zap}            />
        </div>

        <Panel title={tt('Workspace notebooks (.ipynb · scheduled)')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Notebook')}</th><th className="text-left">{tt('Owner')}</th>
              <th className="text-left">{tt('Schedule')}</th><th className="text-left">{tt('Last run')}</th><th className="text-left">{tt('State')}</th>
            </tr></thead>
            <tbody>
              {NOTEBOOKS.map((n) => (
                <tr key={n.nb} className="border-b border-black/5">
                  <td className="py-1.5 font-mono">{n.nb}</td>
                  <td className="text-[11px]">{tt(n.owner)}</td>
                  <td className="text-[10px]">{n.schedule}</td>
                  <td className="font-mono text-[10px]">{n.last_run}</td>
                  <td><span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{n.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Notebook credit consumption trend')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={CREDIT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" cr" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="sis" name={tt('WH credits (notebooks + SiS)')} fill={PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Links · data & AI platform')}>
            <div className="grid grid-cols-2 gap-3 text-[12px] mt-1">
              <Link to="/portal/ai-insights"      className="flex items-center gap-2 p-3 rounded-xl border border-black/5 hover:bg-black/5 font-semibold" style={{ color: BLUE  }}><Activity  className="w-4 h-4" /> {tt('AI Insights')}</Link>
              <Link to="/portal/data-engineering" className="flex items-center gap-2 p-3 rounded-xl border border-black/5 hover:bg-black/5 font-semibold" style={{ color: NAVY  }}><Server    className="w-4 h-4" /> {tt('Data Engineering')}</Link>
              <Link to="/portal/agents"           className="flex items-center gap-2 p-3 rounded-xl border border-black/5 hover:bg-black/5 font-semibold" style={{ color: GREEN }}><Cpu       className="w-4 h-4" /> {tt('Cortex Agents')}</Link>
              <Link to="/portal/catalog"          className="flex items-center gap-2 p-3 rounded-xl border border-black/5 hover:bg-black/5 font-semibold" style={{ color: AMBER }}><Database  className="w-4 h-4" /> {tt('Data Catalog')}</Link>
            </div>
          </Panel>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-4">
          <Database className="w-3 h-3" /> {tt('source: SHOW NOTEBOOKS · ACCOUNT_USAGE.QUERY_HISTORY')}
        </div>
      </>)}

      {/* ════ DEPLOYMENTS ═════════════════════════════════════════════════════ */}
      {tab === 'deployments' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Deploys 30d')}    value="44"     delta={tt('0 failures')}       trend="up"   icon={GitBranch} accent />
          <KpiCard label={tt('Success rate')}   value="100%"   delta={tt('May: 97.6%')}       trend="up"   icon={Activity}        />
          <KpiCard label={tt('Avg deploy time')}value="4m 58s" delta={tt('-32s QoQ')}         trend="up"   icon={Clock}           />
          <KpiCard label={tt('Active versions')}value="18"     delta={tt('6 apps tracked')}   trend="flat" icon={Package}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'success', 'warning', 'failure'] as const).map(f => (
            <button key={f} onClick={() => setDeployFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${deployFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
          <span className="text-[10px] text-vfes-dark/40 ml-2">{filteredDeployments.length} {tt('events')}</span>
        </div>

        <Panel title={tt('Deployment log')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Timestamp')}</th>
              <th className="text-left">{tt('App / Service')}</th>
              <th className="text-left">{tt('Version change')}</th>
              <th className="text-left">{tt('Env')}</th>
              <th className="text-left">{tt('By')}</th>
              <th className="text-right">{tt('Duration')}</th>
              <th className="text-left">{tt('Result')}</th>
            </tr></thead>
            <tbody>
              {filteredDeployments.map((d) => (
                <tr key={d.ts} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[10px]">{d.ts}</td>
                  <td className="font-mono text-[10px] font-semibold">{d.app}</td>
                  <td className="font-mono text-[10px]">{d.version}</td>
                  <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${d.env==='PROD'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{d.env}</span></td>
                  <td className="text-[11px]">{d.by}</td>
                  <td className="text-right font-mono text-[10px]">{d.duration}</td>
                  <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${d.result==='success'?'bg-emerald-100 text-emerald-700':d.result==='warning'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{d.result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Deployment success trend (6-month)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={DEPLOY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="success"  name={tt('Success')}  fill={GREEN}    radius={[4, 4, 0, 0]} />
                  <Bar dataKey="warnings" name={tt('Warnings')} fill={AMBER}    radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failures" name={tt('Failures')} fill="#EF4444"  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Version history — active apps')}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('App')}</th>
                <th className="text-left">{tt('Current version')}</th>
                <th className="text-right">{tt('Patches 30d')}</th>
                <th className="text-right">{tt('Breaking')}</th>
                <th className="text-right">{tt('Consumers')}</th>
              </tr></thead>
              <tbody>
                {VERSION_HISTORY.map((v) => (
                  <tr key={v.app} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{v.app}</td>
                    <td className="font-mono text-[10px]">{v.current}</td>
                    <td className="text-right font-mono">{v.patches_30d}</td>
                    <td className={`text-right font-mono font-bold ${v.breaking_changes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{v.breaking_changes}</td>
                    <td className="text-right font-mono">{v.consumers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/environments" className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Open Environments →')}</Link>
          <Link to="/portal/observability" className="font-semibold hover:underline"     style={{ color: NAVY }}>{tt('Open Observability →')}</Link>
        </div>
      </>)}

      {/* ════ CONSUMERS ═══════════════════════════════════════════════════════ */}
      {tab === 'consumers' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Consumer orgs')}   value="6"    delta={tt('1 external')}    trend="flat" icon={Smartphone} accent />
          <KpiCard label={tt('Total users 30d')} value="892"  delta={tt('+12% MoM')}     trend="up"   icon={Activity}         />
          <KpiCard label={tt('Ext consumers')}   value="14"   delta={tt('partner orgs')} trend="up"   icon={Package}          />
          <KpiCard label={tt('Avg apps/org')}    value="2.2"  delta={tt('enterprise 3.2')} trend="flat" icon={Monitor}        />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Tier:')}</span>
          {(['all', 'ENTERPRISE', 'BUSINESS', 'EXTERNAL'] as const).map(t => (
            <button key={t} onClick={() => setConsumerTier(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${consumerTier === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(t)}
            </button>
          ))}
          <span className="text-[10px] text-vfes-dark/40 ml-2">{filteredConsumers.length} {tt('orgs')}</span>
        </div>

        <Panel title={tt('Consumer organisations')}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
              <th className="text-left py-2">{tt('Org')}</th>
              <th className="text-right">{tt('Apps')}</th>
              <th className="text-right">{tt('Users')}</th>
              <th className="text-right">{tt('Spend MTD')}</th>
              <th className="text-left">{tt('Primary app')}</th>
              <th className="text-left">{tt('Tier')}</th>
            </tr></thead>
            <tbody>
              {filteredConsumers.map((c) => (
                <tr key={c.org} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{c.org}</td>
                  <td className="text-right font-mono">{c.apps}</td>
                  <td className="text-right font-mono">{c.users}</td>
                  <td className="text-right font-mono font-bold">{c.spend_mtd}</td>
                  <td className="text-[11px]">{c.primary}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.tier==='ENTERPRISE'?'bg-sky-100 text-sky-700':c.tier==='EXTERNAL'?'bg-purple-100 text-purple-700':'bg-zinc-100 text-zinc-600'}`}>{c.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Consumer growth — internal vs external users')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={CONSUMER_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="internal" name={tt('Internal users')} stroke={BLUE}   strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="external" name={tt('External users')} stroke={PURPLE} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/sharing"    className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Sharing & Listing hub →')}</Link>
          <Link to="/portal/horizon"    className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Horizon Governance →')}</Link>
        </div>
      </>)}

      {/* ════ COST & CREDITS ══════════════════════════════════════════════════ */}
      {tab === 'costs' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total spend MTD')}  value="BSD 4,820" delta={tt('+8% MoM')}      trend="down" icon={Zap}      accent />
          <KpiCard label={tt('SPCS GPU MTD')}     value="BSD 2,840" delta={tt('59% of total')} trend="down" icon={Cpu}            />
          <KpiCard label={tt('WH credits MTD')}   value="160 cr" delta={tt('BSD 680 MTD')}     trend="flat" icon={Server}         />
          <KpiCard label={tt('Forecast EOMonth')} value="BSD 5,020" delta={tt('+4% vs plan')}  trend="down" icon={Activity}       />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['trend', 'breakdown'] as const).map(v => (
            <button key={v} onClick={() => setCostView(v)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${costView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(v)}
            </button>
          ))}
        </div>

        {costView === 'trend' && (
          <Panel title={tt('Spend trend by surface (6-month · BSD )')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" BSD " />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gpu" name={tt('SPCS GPU')}  stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="cpu" name={tt('SPCS CPU')}  stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="wh"  name={tt('WH (SiS)')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="lic" name={tt('Licences')}  stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}

        {costView === 'breakdown' && (
          <Panel title={tt('MTD cost breakdown by category')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={COST_BREAKDOWN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" BSD " />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="mtd" name={tt('MTD BSD ')} fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-[11px] mt-4">
              <thead><tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Category')}</th>
                <th className="text-right">{tt('MTD (BSD )')}</th>
                <th className="text-right">{tt('MoM %')}</th>
              </tr></thead>
              <tbody>
                {COST_BREAKDOWN.map((c) => (
                  <tr key={c.cat} className="border-b border-black/5">
                    <td className="py-1.5">{c.cat}</td>
                    <td className="text-right font-mono font-bold">BSD {c.mtd.toLocaleString()}</td>
                    <td className={`text-right font-mono ${c.mom_pct > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.mom_pct > 0 ? '+' : ''}{c.mom_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        <div className="mt-4 text-xs text-vfes-dark/55">
          <Link to="/portal/cost"          className="font-semibold hover:underline mr-4" style={{ color: BLUE }}>{tt('Open full Cost & Credits →')}</Link>
          <Link to="/portal/observability" className="font-semibold hover:underline"      style={{ color: NAVY }}>{tt('Open Observability →')}</Link>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-6">
          <Zap className="w-3 h-3" /> {tt('source: ACCOUNT_USAGE.METERING_DAILY_HISTORY · SPCS billing · WH credit usage')}
        </div>
      </>)}
    </div>
  )
}
