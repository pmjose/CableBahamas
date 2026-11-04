import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import { BssLandscapeTab, IntegrationsTab, FlowsRoadmapTab } from './_cio_bss'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import {
  Layers, Server, Activity, Wallet, Workflow, GitBranch, AppWindow, Box,
  Cloud, Cpu, Gauge, ShieldCheck, Database, Zap, TrendingUp, Bell,
  AlertTriangle, CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, Cell,
  PieChart, Pie, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const stP = (s: string) =>
  s === 'Healthy' || s === 'Live' || s === 'passing' || s === 'Pass' || s === 'active' || s === 'on-track'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Watch' || s === 'Degraded' || s === 'at-risk' || s === 'shadow' || s === 'warning'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

// ─── Architecture ─────────────────────────────────────────────────────────────
const platformStack = [
  { layer: 'Sources',     tech: 'Cell telemetry · CRM · BSS · URCA CDC · IoT/M2M · ERPs', latency: 'Streaming / CDC', records: '22B+ rows/day' },
  { layer: 'Ingest',      tech: 'Snowpipe Streaming · Openflow CDC · Kafka Connect',       latency: 'Continuous',      records: '12 TB/day'     },
  { layer: 'Lakehouse',   tech: 'Iceberg (Polaris + AWS Glue) · 312 TB managed',           latency: 'Real-time',       records: '412 TB total'  },
  { layer: 'Transform',   tech: 'Dynamic Tables · Snowpark Python · dbt · 3-min lag',      latency: '3–60 min',        records: '84 DTs active' },
  { layer: 'Serve',       tech: 'Cortex Analyst · Cortex Search · ML Registry · SiS apps', latency: '<200 ms query',   records: '42 SVs · 28 models' },
  { layer: 'Govern',      tech: 'Horizon · Trust Center · DMFs · RBAC · Data Contracts',   latency: 'Continuous',      records: '284 policies'  },
]

// ─── Environments ─────────────────────────────────────────────────────────────
const environments = [
  { name: 'PROD',        tier: 'prod',    wh: 'PROD_WH_LARGE',  credMo: 18.4, owner: 'Platform',        freshness: 'Live',         locked: true,  policy: 'Change-control + CAB approval',     health: 'Healthy' },
  { name: 'STAGING',     tier: 'staging', wh: 'STAGING_WH',     credMo:  4.2, owner: 'Platform',        freshness: 'Daily clone',  locked: true,  policy: 'Auto-promote on green pipeline',    health: 'Healthy' },
  { name: 'QA',          tier: 'qa',      wh: 'QA_WH',          credMo:  2.6, owner: 'Quality',         freshness: 'Daily clone',  locked: false, policy: 'Smoke tests + data tests required', health: 'Healthy' },
  { name: 'DEV_SHARED',  tier: 'dev',     wh: 'DEV_WH',         credMo:  3.8, owner: 'Platform',        freshness: 'Weekly clone', locked: false, policy: 'Free experiment · TTL 7 days',      health: 'Healthy' },
  { name: 'ML_TRAINING', tier: 'ml',      wh: 'DS_WH_XL',       credMo:  8.6, owner: 'Data Science',    freshness: 'Snapshot',     locked: false, policy: 'GPU compute pools · notebook-first', health: 'Healthy' },
  { name: 'SANDBOX_BIG', tier: 'sandbox', wh: 'SANDBOX_WH',     credMo:  1.4, owner: 'Open Innovation', freshness: 'On-demand',    locked: false, policy: 'TTL 14 days · no PII',              health: 'Watch'   },
  { name: 'DR_STANDBY',  tier: 'dr',      wh: 'DR_WH',          credMo:  0.8, owner: 'Platform',        freshness: 'Continuous',   locked: true,  policy: 'Failover within 15 min RTO',        health: 'Healthy' },
]

const deployFreq = [
  { wk: 'W1', deploys: 12, rollbacks: 0, p1s: 0 },
  { wk: 'W2', deploys: 18, rollbacks: 1, p1s: 0 },
  { wk: 'W3', deploys: 14, rollbacks: 0, p1s: 1 },
  { wk: 'W4', deploys: 22, rollbacks: 0, p1s: 0 },
  { wk: 'W5', deploys: 16, rollbacks: 0, p1s: 0 },
  { wk: 'W6', deploys: 28, rollbacks: 1, p1s: 0 },
  { wk: 'W7', deploys: 24, rollbacks: 0, p1s: 0 },
  { wk: 'W8', deploys: 32, rollbacks: 0, p1s: 0 },
]

// ─── Observability ────────────────────────────────────────────────────────────
const slos = [
  { svc: 'Residential broadband platform', slo: 99.95, actual: 99.94, budget: 12.4, status: 'Burning' },
  { svc: 'B2B fibre orchestration',         slo: 99.99, actual: 99.97, budget: 64.2, status: 'Healthy' },
  { svc: 'OSS / BSS core services',         slo: 99.90, actual: 99.93, budget: 82.1, status: 'Healthy' },
  { svc: 'Data platform (Snowflake)',        slo: 99.95, actual: 99.98, budget: 98.4, status: 'Healthy' },
  { svc: 'Cortex Agents infra',             slo: 99.90, actual: 99.92, budget: 88.0, status: 'Healthy' },
  { svc: 'Hosted Voice SBC',                slo: 99.95, actual: 99.96, budget: 84.1, status: 'Healthy' },
]

const errorBudget = [
  { m: 'Jun', burn: 24, budget: 100 }, { m: 'Jul', burn: 18, budget: 100 },
  { m: 'Aug', burn: 12, budget: 100 }, { m: 'Sep', burn: 8,  budget: 100 },
  { m: 'Oct', burn: 14, budget: 100 }, { m: 'Nov', burn: 12.4, budget: 100 },
]

const incidentTrend = [
  { m: 'Jun', p1: 2, p2: 8,  p3: 24, mttr: 42 },
  { m: 'Jul', p1: 1, p2: 6,  p3: 20, mttr: 38 },
  { m: 'Aug', p1: 2, p2: 7,  p3: 18, mttr: 36 },
  { m: 'Sep', p1: 0, p2: 5,  p3: 14, mttr: 32 },
  { m: 'Oct', p1: 1, p2: 6,  p3: 16, mttr: 34 },
  { m: 'Nov', p1: 0, p2: 4,  p3: 12, mttr: 28 },
]

// ─── Data Engineering ─────────────────────────────────────────────────────────
const pipelines = [
  { name: 'pipe_ran_telemetry',    type: 'Snowpipe Streaming', source: 'Kafka (Ericsson ENM + Nokia)', lag: '12 s',   rows: '12.4B/day', cred: 1.84, status: 'Healthy' },
  { name: 'pipe_iot_m2m_streams',  type: 'Snowpipe Streaming', source: 'Kafka (IoT Hub)',              lag: '18 s',   rows: '4.2B/day',  cred: 0.62, status: 'Watch'   },
  { name: 'pipe_mnp_cdc',          type: 'Openflow CDC',       source: 'PostgreSQL (URCA gateway)',    lag: '8 min',  rows: '180K/day',  cred: 0.18, status: 'Healthy' },
  { name: 'pipe_bss_cdc',          type: 'Openflow CDC',       source: 'BSS (Oracle)',                 lag: '4 min',  rows: '1.2M/day',  cred: 0.42, status: 'Healthy' },
  { name: 'dt_cell_site_telemetry',type: 'Dynamic Table',      source: 'RAW_RAN_TELEMETRY',            lag: '2.4 min',rows: '12.4B/day', cred: 0.84, status: 'Healthy' },
  { name: 'dt_mobile_subs_daily',  type: 'Dynamic Table',      source: 'BSS + CRM',                    lag: '52 min', rows: '13.6M/day', cred: 0.24, status: 'Healthy' },
  { name: 'dt_revenue_lane',       type: 'Dynamic Table',      source: 'Finance ledger + BSS',         lag: '24 h',   rows: '88M',       cred: 0.18, status: 'Healthy' },
]

const lagTrend = [
  { h: '00', ranLag: 10, bssLag: 3,  dtLag: 2.1 },
  { h: '04', ranLag: 8,  bssLag: 2,  dtLag: 1.8 },
  { h: '08', ranLag: 14, bssLag: 5,  dtLag: 2.8 },
  { h: '12', ranLag: 18, bssLag: 6,  dtLag: 3.2 },
  { h: '16', ranLag: 22, bssLag: 8,  dtLag: 3.8 },
  { h: '18', ranLag: 28, bssLag: 10, dtLag: 4.6 },
  { h: '20', ranLag: 20, bssLag: 7,  dtLag: 3.4 },
  { h: '22', ranLag: 12, bssLag: 4,  dtLag: 2.4 },
]

// ─── Apps / SPCS ──────────────────────────────────────────────────────────────
const appsRunning = [
  { name: 'mobile-noc-cockpit',       framework: 'Streamlit-in-Snowflake', users: 240,  tier: 'XS',     credMo: 0.18, owner: 'Mobile NOC',  status: 'Live'  },
  { name: 'executive-war-room',       framework: 'Streamlit-in-Snowflake', users: 42,   tier: 'S',      credMo: 0.22, owner: 'CxO office',  status: 'Live'  },
  { name: 'mnp-winback-app',          framework: 'SPCS (CPU_M)',           users: 128,  tier: 'CPU_M',  credMo: 0.42, owner: 'Commercial',  status: 'Live'  },
  { name: 'data-governance-portal',   framework: 'Streamlit-in-Snowflake', users: 64,   tier: 'S',      credMo: 0.16, owner: 'Data Gov',    status: 'Live'  },
  { name: 'b2b-native-app',           framework: 'Native App Package',     users: 220,  tier: 'M',      credMo: 0.84, owner: 'B2B',         status: 'Live'  },
  { name: 'open-ran-vendor-interop',  framework: 'SPCS (GPU_NV_S)',        users: 8,    tier: 'GPU_NV_S',credMo: 0.84, owner: 'Open RAN',   status: 'Watch' },
  { name: 'cortex-search-portal',     framework: 'Streamlit-in-Snowflake', users: 186,  tier: 'XS',     credMo: 0.12, owner: 'Analytics',   status: 'Live'  },
  { name: 'FinOps-dashboard',         framework: 'Streamlit-in-Snowflake', users: 96,   tier: 'XS',     credMo: 0.10, owner: 'Platform',    status: 'Live'  },
]

const appCreditsByFramework = [
  { fw: 'SiS',         cred: 0.78, color: BLUE   },
  { fw: 'SPCS CPU',    cred: 0.42, color: NAVY   },
  { fw: 'SPCS GPU',    cred: 0.84, color: PURPLE },
  { fw: 'Native App',  cred: 0.84, color: AMBER  },
]

// ─── Cost / FinOps ────────────────────────────────────────────────────────────
const creditsByTeam = [
  { team: 'RAN Engineering',    credK: 1.84, color: BLUE   },
  { team: 'Data Science',       credK: 1.60, color: NAVY   },
  { team: 'Mobile Analytics',   credK: 1.24, color: GREEN  },
  { team: 'Commercial',         credK: 0.84, color: AMBER  },
  { team: 'Finance & Billing',  credK: 0.62, color: PURPLE },
  { team: 'Platform / DevOps',  credK: 0.48, color: SLATE  },
  { team: 'Security / Fraud',   credK: 0.36, color: '#ef4444' },
]

const creditsTrend = [
  { m: 'Jun', actual: 9.8,  budget: 10.2, optimised: 9.8  },
  { m: 'Jul', actual: 10.4, budget: 10.2, optimised: 8.6  },
  { m: 'Aug', actual: 11.1, budget: 10.5, optimised: 8.9  },
  { m: 'Sep', actual: 10.7, budget: 10.5, optimised: 8.4  },
  { m: 'Oct', actual: 9.6,  budget: 10.8, optimised: 7.8  },
  { m: 'Nov', actual: 8.4,  budget: 10.8, optimised: 7.2  },
]

const warehouseSpend = [
  { wh: 'PROD_WH_LARGE',  credMo: 18.4, team: 'Platform',      tier: 'prod'    },
  { wh: 'DS_WH_XL',       credMo:  8.6, team: 'Data Science',  tier: 'ml'      },
  { wh: 'STAGING_WH',     credMo:  4.2, team: 'Platform',      tier: 'staging' },
  { wh: 'QA_WH',          credMo:  2.6, team: 'Quality',       tier: 'qa'      },
  { wh: 'DEV_WH',         credMo:  3.8, team: 'Platform',      tier: 'dev'     },
  { wh: 'AGENT_WH',       credMo:  2.4, team: 'AI Platform',   tier: 'prod'    },
  { wh: 'SANDBOX_WH',     credMo:  1.4, team: 'Open Innovation',tier: 'sandbox'},
  { wh: 'DR_WH',          credMo:  0.8, team: 'Platform',      tier: 'dr'      },
]

// ─── Security & Identity data ─────────────────────────────────────────────────
const iamPlatform = [
  { group: 'Admins (ACCOUNTADMIN)',   n: 4,    mfa: '100%', pam: true,  lastReview: '2026-11-01', risk: 'Low'    },
  { group: 'Data Platform owners',    n: 12,   mfa: '100%', pam: true,  lastReview: '2026-11-15', risk: 'Low'    },
  { group: 'Data Engineers',          n: 38,   mfa: '100%', pam: false, lastReview: '2026-11-01', risk: 'Low'    },
  { group: 'Data Analysts',           n: 124,  mfa: '98%',  pam: false, lastReview: '2026-10-15', risk: 'Medium' },
  { group: 'Service accounts (API)',  n: 84,   mfa: 'N/A',  pam: true,  lastReview: '2026-09-01', risk: 'Medium' },
  { group: 'External / contractors',  n: 28,   mfa: '94%',  pam: false, lastReview: '2026-08-01', risk: 'High'   },
]

const rbacHeatmap = [
  { role: 'SYSADMIN',       tables: 4200, views: 680, schemas: 42, sensitive: 18 },
  { role: 'TRANSFORMER',    tables:  820, views: 240, schemas: 12, sensitive:  8 },
  { role: 'ANALYST_READ',   tables:  380, views: 480, schemas:  8, sensitive:  2 },
  { role: 'DS_FULL',        tables:  640, views: 180, schemas: 18, sensitive: 12 },
  { role: 'APP_SERVICE_RW', tables:  128, views:  64, schemas:  6, sensitive:  4 },
]

const mfaEnrolTrend = [
  { m: 'Jun', enrolled: 78, target: 100 }, { m: 'Jul', enrolled: 82, target: 100 },
  { m: 'Aug', enrolled: 86, target: 100 }, { m: 'Sep', enrolled: 91, target: 100 },
  { m: 'Oct', enrolled: 96, target: 100 }, { m: 'Nov', enrolled: 98, target: 100 },
]

const policyBreaches = [
  { policy: 'PII access outside office hours',     violations: 4,  trend: -2, status: 'Investigating' },
  { policy: 'Query > 10K rows sensitive table',    violations: 12, trend: +4, status: 'Alerting'     },
  { policy: 'Service account used interactively',  violations: 2,  trend:  0, status: 'Investigating' },
  { policy: 'Password-only login (no MFA)',         violations: 6,  trend: -8, status: 'Resolved'     },
  { policy: 'Stale account > 60 days active',       violations: 3,  trend: -1, status: 'Resolved'     },
]

const networkAclTrend = [
  { m: 'Jun', allowed: 12400, blocked: 840, new: 28 },
  { m: 'Jul', allowed: 12800, blocked: 680, new: 22 },
  { m: 'Aug', allowed: 13200, blocked: 920, new: 34 },
  { m: 'Sep', allowed: 13600, blocked: 740, new: 18 },
  { m: 'Oct', allowed: 14100, blocked: 680, new: 14 },
  { m: 'Nov', allowed: 14600, blocked: 620, new: 12 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'bss' | 'integrations' | 'flows' | 'architecture' | 'environments' | 'observability' | 'data-eng' | 'apps' | 'cost' | 'secid'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',      label: 'Overview',          icon: Gauge      },
  { id: 'bss',           label: 'BSS / OSS Landscape', icon: Server   },
  { id: 'integrations',  label: 'Integrations',      icon: Zap        },
  { id: 'flows',         label: 'Flows & Roadmap',   icon: Workflow   },
  { id: 'architecture',  label: 'Data Platform',     icon: Layers     },
  { id: 'environments',  label: 'Environments',      icon: GitBranch  },
  { id: 'observability', label: 'Observability',     icon: Activity   },
  { id: 'data-eng',      label: 'Data Engineering',  icon: Workflow   },
  { id: 'apps',          label: 'Apps & SPCS',        icon: AppWindow  },
  { id: 'cost',          label: 'Cost / FinOps',      icon: Wallet     },
  { id: 'secid',         label: 'Security & Identity', icon: ShieldCheck },
]

export default function CIOPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [envTier, setEnvTier] = useState<string>('all')
  const [costView, setCostView] = useState<'credits' | 'spend'>('credits')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLastRefresh(fmt())
    const id = setInterval(() => setLastRefresh(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const filteredEnvs = useMemo(
    () => envTier === 'all' ? environments : environments.filter(e => e.tier === envTier),
    [envTier],
  )

  const costSummary = useMemo(() => {
    const total = warehouseSpend.reduce((s, w) => s + w.credMo, 0)
    const topTeams = [...warehouseSpend].sort((a, b) => b.credMo - a.credMo).slice(0, 3)
    return { total: total.toFixed(1), topTeams }
  }, [])

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={tt('Chief Information Officer')}
        subtitle={tt('Office of the CIO · Emma Bain · platform, IT & cloud · FY2026')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">
              {tt('Refreshed')} {lastRefresh}
            </span>
            <Link to="/portal/cost" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Wallet className="w-4 h-4" /> {tt('Open Cost Intelligence')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Platform intelligence"
        models={[
          { name: 'Cost-anomaly Detector',      metric: 'recall 0.92', sub: 'credit spend spikes'       },
          { name: 'Workload-forecast Model',     metric: 'MAPE 5.3%',   sub: 'warehouse autosizing'      },
          { name: 'Query-optimisation Advisor',  metric: '−21% credits', sub: 'pruning + clustering hints' },
        ]}
        agentLabel="Run Platform Review"
        agentRunningLabel="Profiling…"
        agentSteps={[
          'Scanned warehouse spend for anomalies vs baseline',
          'Forecast next-30-day workload and right-sized compute',
          'Ranked the costliest queries by optimisation upside',
          'Drafted the chargeback report by team',
        ]}
        agentBlurb="Consolidating Power BI extracts and siloed marts onto one platform retires duplicate infrastructure — the migration is the cost-out, not just a re-platform."
        decision={{
          title: 'Right-size 3 warehouses and retire the legacy BI tier',
          detail: 'The workload model shows three warehouses over-provisioned outside business hours, and the Power BI extract tier is now redundant after the Snowflake migration. Right-sizing plus decommissioning lands ~BSD 1.4M of annualised run-rate savings.',
          impact: '−BSD 1.4M run-rate · −21% credits',
          risk: 'confirm no overnight batch dependency before downsizing',
          linkTo: '#/portal/cost',
          linkLabel: 'Open Cost Intelligence',
        }}
        chart={{
          kind: 'line',
          title: 'Platform credits — actual vs optimised (k/day)',
          xKey: 'd',
          unit: 'k',
          data: [
            { d: 'Mon', actual: 9.8, optimised: 9.8 }, { d: 'Tue', actual: 10.4, optimised: 8.6 },
            { d: 'Wed', actual: 11.1, optimised: 8.9 }, { d: 'Thu', actual: 10.7, optimised: 8.4 },
            { d: 'Fri', actual: 9.6, optimised: 7.8 }, { d: 'Sat', actual: 6.2, optimised: 4.1 }, { d: 'Sun', actual: 5.8, optimised: 3.6 },
          ],
          series: [
            { key: 'actual',    name: 'Actual',    color: NAVY           },
            { key: 'optimised', name: 'Optimised', color: BLUE, dashed: true },
          ],
          note: 'Weekend over-provisioning is the largest single savings lever.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Weekend warehouses over-provisioned 38% · Legacy BI tier still consuming 1.4K credits/mo · IoT stream backpressure (watch)')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Right-sizing approved — waiting for batch-dependency audit. SANDBOX_BIG approaching 14-day TTL.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/cost" className="text-xs font-bold text-amber-900 hover:underline">{tt('Open FinOps →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Platform uptime')}    value="99.98%"  delta={tt('last 90 days')}          trend="up"   icon={Activity}   accent />
          <KpiCard label={tt('Monthly credits')}    value="284K"    delta="-9% MoM"                      trend="up"   icon={Cpu}        />
          <KpiCard label={tt('Cloud run-rate')}     value="BSD 3.1M"   delta="-BSD 1.4M plan"                  trend="up"   icon={Cloud}      />
          <KpiCard label={tt('Environments')}       value="14"      delta={tt('dev · test · prod')}      trend="flat" icon={Server}     />
          <KpiCard label={tt('SLO attainment')}     value="98.6%"   delta={tt('error budget healthy')}   trend="up"   icon={Gauge}      />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CIO domain')}
            links={[
              { to: 'architecture',    label: 'Architecture',       metric: tt('Reference platform topology'),     icon: Layers    },
              { to: 'environments',    label: 'Environments',        metric: tt('Dev/test/prod · promotion'),       icon: GitBranch },
              { to: 'observability',   label: 'Observability',       metric: tt('Logs · traces · SLOs'),            icon: Activity  },
              { to: 'cost',            label: 'Cost Intelligence',   metric: tt('Credits · chargeback · budgets'),  icon: Wallet    },
              { to: 'data-engineering',label: 'Data Engineering',    metric: tt('Pipelines · dynamic tables'),      icon: Workflow  },
              { to: 'apps',            label: 'Apps & SPCS',         metric: tt('Containerised services'),          icon: Server    },
              { to: 'iceberg',         label: 'Iceberg & External',  metric: tt('Open tables · external volumes'),  icon: Box       },
              { to: 'b2b-app',         label: 'B2B Native App',      metric: tt('Packaged data product'),           icon: AppWindow },
              { to: 'incidents',       label: 'Incidents',           metric: tt('Platform incident log'),           icon: ShieldCheck },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('IT & platform priorities — FY2026')}
              items={[
                { name: 'Power BI → Snowflake migration',    owner: tt('Data Platform · Pieter Knowles'),  pct: 72, status: 'on-track' },
                { name: 'FinOps — chargeback to every team', owner: tt('Platform Engineering'),        pct: 64, status: 'on-track' },
                { name: 'Reduce IT contractor spend 30%',    owner: tt('IT Operations'),               pct: 70, status: 'on-track' },
                { name: 'Zero-downtime deploy pipeline',     owner: tt('DevOps'),                      pct: 58, status: 'on-track' },
                { name: 'Legacy mart decommission',          owner: tt('Data Platform'),               pct: 41, status: 'at-risk'  },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CIO desk')}
            items={[
              { text: tt('Weekend warehouse over-provisioning — right-size pending'),       level: 'high'   },
              { text: tt('Contractor TUPE legal review blocking cost-out'),                 level: 'medium' },
              { text: tt('ServiceNow ITSM upgrade scheduled — change freeze window'),       level: 'medium' },
              { text: tt('SLO error budget healthy across all tier-1 services'),            level: 'low'    },
            ]}
          />
        </div>

        <div className="mt-6">
          <AgendaList
            title={tt('CIO cadence')}
            items={[
              { what: tt('Weekly platform & FinOps review'), when: tt('Tue 14:00')  },
              { what: tt('Architecture review board'),       when: tt('Thu 10:00')  },
              { what: tt('Cloud cost steering'),             when: tt('Mon 8 Jul')  },
              { what: tt('Migration go/no-go'),              when: tt('Fri 19 Jul') },
            ]}
          />
        </div>
      </>)}

      {/* ══════════════ ARCHITECTURE ══════════════════════════════════════════ */}
      {tab === 'bss' && <BssLandscapeTab />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'flows' && <FlowsRoadmapTab />}

      {tab === 'architecture' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Data platform layers')}  value="6"      delta={tt('end-to-end')}             trend="flat" icon={Layers}    accent />
          <KpiCard label={tt('Active dynamic tables')} value="84"     delta="+12 QoQ"                       trend="up"   icon={Workflow}  />
          <KpiCard label={tt('Semantic views')}        value="42"     delta={tt('certified')}               trend="up"   icon={Database}  />
          <KpiCard label={tt('Data contracts active')} value="68"     delta="0 breaches this week"          trend="up"   icon={CheckCircle2} />
        </div>

        <Panel title={tt('Platform Architecture — End-to-End Stack')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Layer')}</th>
                  <th>{tt('Technology')}</th>
                  <th>{tt('Latency / Freshness')}</th>
                  <th className="text-right">{tt('Scale')}</th>
                </tr>
              </thead>
              <tbody>
                {platformStack.map((s, i) => (
                  <tr key={s.layer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-3 font-bold text-xs flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-vfes-red/10 text-vfes-dark text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      {s.layer}
                    </td>
                    <td className="text-xs text-vfes-dark/70">{s.tech}</td>
                    <td className="text-xs font-mono text-emerald-700">{s.latency}</td>
                    <td className="text-right text-xs font-bold">{s.records}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Link to="/portal/architecture" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open full Architecture diagram →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <Panel title={tt('Iceberg Footprint')}>
            <div className="space-y-3 text-sm">
              {[
                { label: tt('Total managed Iceberg'),  value: '312 TB', sub: '+18% YoY' },
                { label: tt('Polaris catalog tables'), value: '84',     sub: '4 external catalogs' },
                { label: tt('AWS Glue tables'),        value: '42',     sub: 'S3 + Athena readers' },
                { label: tt('Azure ADLS tables'),      value: '18',     sub: 'Databricks reader' },
                { label: tt('External volumes'),       value: '6',      sub: 'S3 + ADLS + GCS' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-vfes-dark/70 text-xs">{r.label}</span>
                  <div className="text-right">
                    <div className="font-bold">{r.value}</div>
                    <div className="text-[10px] text-vfes-dark/45">{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link to="/portal/iceberg" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Iceberg & External →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('ML Registry Summary')}>
            <div className="space-y-3 text-sm">
              {[
                { label: tt('Models in production'), value: '28',    sub: '6 domains' },
                { label: tt('Models in shadow'),      value: '6',     sub: 'A/B evaluation' },
                { label: tt('Avg drift PSI'),          value: '0.04', sub: 'below 0.10 threshold' },
                { label: tt('Daily inferences'),       value: '4.2M', sub: '+12% MoM' },
                { label: tt('Feature store views'),    value: '18',   sub: '384 features active' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-vfes-dark/70 text-xs">{r.label}</span>
                  <div className="text-right">
                    <div className="font-bold">{r.value}</div>
                    <div className="text-[10px] text-vfes-dark/45">{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link to="/portal/ml-registry" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open ML Registry →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Cortex AI Platform')}>
            <div className="space-y-3 text-sm">
              {[
                { label: tt('Cortex Agents active'), value: '18',   sub: '6 domains' },
                { label: tt('Cortex Search indexes'), value: '12',   sub: '42K docs total' },
                { label: tt('Semantic views'),         value: '42',   sub: '22 certified' },
                { label: tt('Agent invocations/wk'),   value: '284K', sub: '+18% vs last week' },
                { label: tt('AI spend / month'),       value: 'BSD 82K', sub: '2.6% of total credits' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-vfes-dark/70 text-xs">{r.label}</span>
                  <div className="text-right">
                    <div className="font-bold">{r.value}</div>
                    <div className="text-[10px] text-vfes-dark/45">{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link to="/portal/agents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cortex Agents →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Data Volume by Domain — daily ingestion (TB/day)')} insight={{ insight: 'RAN Telemetry leads domain ingestion at 12.4 TB/day, making it the single largest load on platform infrastructure.', action: 'Prioritise Iceberg tiering and storage lifecycle policies for the RAN telemetry domain to move cold data off the hot compute layer.', impact: 'Tiering the highest-volume domain is projected to cut platform storage costs by 20–30% within one billing cycle.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart layout="vertical" data={[
                  { domain: tt('RAN Telemetry'),     tb: 12.4, color: BLUE   },
                  { domain: tt('IoT / M2M'),         tb:  4.2, color: NAVY   },
                  { domain: tt('BSS / CRM'),         tb:  1.8, color: GREEN  },
                  { domain: tt('Mobile Location'),   tb:  6.8, color: AMBER  },
                  { domain: tt('Finance / Billing'), tb:  0.9, color: PURPLE },
                  { domain: tt('OSS / Inventory'),   tb:  0.4, color: SLATE  },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" TB" />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="tb" name={tt('TB/day')} radius={[0, 4, 4, 0]}>
                    {[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('26.5 TB/day across 6 domains — all via Snowpipe Streaming or Openflow CDC')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ ENVIRONMENTS ══════════════════════════════════════════ */}
      {tab === 'environments' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total environments')} value="14"       delta={tt('7 platform-managed')}      trend="flat" icon={Server}   accent />
          <KpiCard label={tt('PROD uptime')}         value="99.98%"  delta={tt('last 30 days')}            trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Deploys this week')}   value="32"      delta="0 rollbacks"                    trend="up"   icon={GitBranch} />
          <KpiCard label={tt('Non-prod credits')}    value="21.4K"   delta={tt('24% of total spend')}      trend="flat" icon={Cpu}      />
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter tier:')}</span>
          {['all', 'prod', 'staging', 'qa', 'dev', 'ml', 'sandbox', 'dr'].map(t => (
            <button key={t} onClick={() => setEnvTier(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${envTier === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {t}
            </button>
          ))}
        </div>

        <Panel title={tt('Environment Register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Name')}</th>
                  <th>{tt('Warehouse')}</th>
                  <th className="text-right">{tt('Credits/mo')}</th>
                  <th>{tt('Owner')}</th>
                  <th>{tt('Freshness')}</th>
                  <th>{tt('Policy')}</th>
                  <th>{tt('Health')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnvs.map(e => (
                  <tr key={e.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-bold font-mono text-xs">{e.name}</td>
                    <td className="text-xs font-mono text-vfes-dark/65">{e.wh}</td>
                    <td className="text-right font-bold">{e.credMo}K</td>
                    <td className="text-xs">{e.owner}</td>
                    <td className="text-xs font-mono text-emerald-700">{e.freshness}</td>
                    <td className="text-xs text-vfes-dark/55 max-w-[180px] truncate">{e.policy}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(e.health)}`}>{tt(e.health)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/environments" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Environments →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Deployment Frequency — weekly (deploys + rollbacks)')} insight={{ insight: 'Rollback spikes recur on weeks with multi-service coordinated releases, indicating brittle coupling between deployment units.', action: 'Enforce feature-flag gating for coupled services so release cadence decouples from deployment risk.', impact: 'Cutting rollback frequency by 50% would return approximately four engineering days per sprint to feature delivery.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={deployFreq}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="deploys"   name={tt('Deploys')}   fill={BLUE}  />
                  <Bar yAxisId="l" dataKey="rollbacks" name={tt('Rollbacks')} fill={AMBER} />
                  <Line yAxisId="r" type="monotone" dataKey="p1s" name={tt('P1 incidents')} stroke="#ef4444" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Credits by Environment Tier')} insight={{ insight: 'Dev and staging tiers represent a disproportionate share of credit consumption relative to their workload value.', action: 'Enforce auto-suspend and auto-resume policies on all non-production warehouses to eliminate idle compute spend.', impact: 'Right-sizing non-production compute is projected to recover 15–25% of total monthly platform credits.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: tt('Prod'),     value: 18.4, color: BLUE   },
                      { name: tt('ML / DS'),  value:  8.6, color: NAVY   },
                      { name: tt('Staging'),  value:  4.2, color: GREEN  },
                      { name: tt('Dev'),      value:  3.8, color: AMBER  },
                      { name: tt('QA'),       value:  2.6, color: PURPLE },
                      { name: tt('Other'),    value:  2.6, color: SLATE  },
                    ]}
                    dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}
                  >
                    {[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ OBSERVABILITY ═════════════════════════════════════════ */}
      {tab === 'observability' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SLOs healthy')}        value={`${slos.filter(s => s.status === 'Healthy').length} / ${slos.length}`} delta={tt('1 burning')}          trend="flat" icon={ShieldCheck} accent />
          <KpiCard label={tt('P1 this month')}       value="0"                                                                       delta={tt('prev month: 1')}     trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('MTTR (P2)')}            value="28 min"                                                                  delta="-14 min YoY"             trend="up"   icon={Zap}           />
          <KpiCard label={tt('Error budget (min)')}  value="12.4%"                                                                   delta={tt('residential SLO')}    trend="down" icon={Activity}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SLOs — Error Budget Burn')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Service')}</th>
                    <th className="text-right">{tt('SLO')}</th>
                    <th className="text-right">{tt('Actual')}</th>
                    <th className="text-right">{tt('Budget left')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {slos.map(s => (
                    <tr key={s.svc} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{s.svc}</td>
                      <td className="text-right">{s.slo}%</td>
                      <td className={`text-right font-bold ${s.actual >= s.slo ? 'text-emerald-600' : 'text-red-600'}`}>{s.actual}%</td>
                      <td className={`text-right font-bold ${s.budget < 30 ? 'text-red-600' : s.budget < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.budget.toFixed(1)}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${s.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Observability →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Incident Trend — P1/P2/P3 + MTTR (months)')} insight={{ insight: 'P2 incident frequency has risen over three consecutive months while mean time to resolve has plateaued above the 45-minute target.', action: 'Invest in automated runbooks and on-call tooling to systematically drive MTTR below the service-level threshold.', impact: 'Halving P2 MTTR improves availability SLA compliance and reduces engineering escalation overhead by an estimated 30%.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={incidentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="p1" name="P1" stackId="a" fill="#ef4444" />
                  <Bar yAxisId="l" dataKey="p2" name="P2" stackId="a" fill={AMBER}   />
                  <Bar yAxisId="l" dataKey="p3" name="P3" stackId="a" fill={BLUE}    />
                  <Line yAxisId="r" type="monotone" dataKey="mttr" name={tt('MTTR')} stroke={NAVY} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Residential SLO — Error Budget Burn Rate (% of 30-day window remaining)')} insight={{ insight: 'Error budget consumption is accelerating in the final third of the rolling window, signalling risk of full exhaustion before the next reset.', action: 'Freeze non-critical feature deployments until the budget recovers above 50% to protect the residential SLO.', impact: 'Preventing an SLO breach avoids contractual service credits and protects the residential customer NPS score.' }}>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={errorBudget}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="burn" name={tt('Budget burned %')} stroke={AMBER} fill={AMBER} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 20% threshold — trigger freeze on feature deploys for residential path')}</div>
        </Panel>
      </>)}

      {/* ══════════════ DATA ENGINEERING ══════════════════════════════════════ */}
      {tab === 'data-eng' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active pipelines')}    value={`${pipelines.length}`}  delta={tt('2 watch items')}            trend="flat" icon={Workflow}  accent />
          <KpiCard label={tt('Daily rows ingested')} value="22B+"                   delta="+14% YoY"                        trend="up"   icon={Database}  />
          <KpiCard label={tt('Dynamic tables')}      value="84"                     delta={tt('avg lag 3.2 min')}           trend="up"   icon={TrendingUp}/>
          <KpiCard label={tt('Pipeline credits/mo')} value="4.5K"                  delta={tt('of 284K total')}             trend="flat" icon={Cpu}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Pipeline Lag — 24h (seconds / minutes)')} insight={{ insight: 'Pipeline lag exhibits recurring spikes during peak ingestion windows that breach the 5-minute operational threshold.', action: 'Configure resource monitor task triggers to scale the ingestion warehouse tier automatically during known peak windows.', impact: 'Eliminating lag spikes reduces downstream data-freshness SLA breaches and the manual incident response they generate.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={lagTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ranLag"  name={tt('RAN Streaming (s)')} stroke={BLUE}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="bssLag"  name={tt('BSS CDC (min)')}     stroke={AMBER} strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="dtLag"   name={tt('DT lag (min)')}       stroke={GREEN} strokeWidth={2}   dot={false} />
                  <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red threshold = 20 — triggers PagerDuty alert')}</div>
          </Panel>

          <Panel title={tt('Pipeline Health Register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Pipeline')}</th>
                    <th>{tt('Type')}</th>
                    <th className="text-right">{tt('Lag')}</th>
                    <th className="text-right">{tt('Credits/mo')}</th>
                    <th>{tt('Health')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map(p => (
                    <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono font-bold text-xs">{p.name}</td>
                      <td className="text-xs text-vfes-dark/65">{p.type}</td>
                      <td className="text-right font-mono text-xs">{p.lag}</td>
                      <td className="text-right font-bold">{p.cred}K</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(p.status)}`}>{tt(p.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Engineering →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ APPS & SPCS ═══════════════════════════════════════════ */}
      {tab === 'apps' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Running apps')}      value={`${appsRunning.length}`}  delta={tt('7 live · 1 watch')}          trend="flat" icon={AppWindow} accent />
          <KpiCard label={tt('Active users')}       value="984"                       delta="+18% QoQ"                        trend="up"   icon={Activity}  />
          <KpiCard label={tt('SPCS services')}      value="3"                         delta={tt('CPU + GPU pools')}           trend="up"   icon={Cloud}     />
          <KpiCard label={tt('App credits/mo')}     value="2.88K"                     delta={tt('1% of total spend')}        trend="flat" icon={Cpu}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Apps — Credits by Framework')} insight={{ insight: 'Streamlit applications account for a disproportionate share of app-tier credits relative to their active user count.', action: 'Audit high-spend Streamlit apps and migrate compute-heavy queries to pre-materialised views or dynamic tables.', impact: 'Optimising app-layer query patterns is estimated to reduce application-tier credits by up to 40% without user-facing impact.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={appCreditsByFramework}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="fw" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cred" name={tt('Credits K/mo')} radius={[4, 4, 0, 0]}>
                    {appCreditsByFramework.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Deployed Apps & Services')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('App')}</th>
                    <th className="text-right">{tt('Users')}</th>
                    <th className="text-right">{tt('Cred/mo')}</th>
                    <th>{tt('Owner')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appsRunning.map(a => (
                    <tr key={a.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-bold">{a.name}</td>
                      <td className="text-right">{a.users}</td>
                      <td className="text-right font-bold">{a.credMo}K</td>
                      <td className="text-xs text-vfes-dark/65">{a.owner}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(a.status)}`}>{tt(a.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/apps" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Apps & SPCS →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('App Active Users — weekly trend')} insight={{ insight: 'Platform active users have grown from 720 to over 820 in four weeks, confirming strong adoption of self-serve analytics.', action: 'Align IT service desk capacity and onboarding resources to the accelerating user growth trajectory before it strains support SLAs.', impact: 'Proactive capacity planning protects the productivity gains from self-serve adoption and keeps helpdesk queue times within target.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={[
                  { wk: 'W1', users: 720 }, { wk: 'W2', users: 780 }, { wk: 'W3', users: 820 },
                  { wk: 'W4', users: 860 }, { wk: 'W5', users: 898 }, { wk: 'W6', users: 940 },
                  { wk: 'W7', users: 968 }, { wk: 'W8', users: 984 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="users" name={tt('Active users')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('+18% QoQ user growth across all Snowflake apps — mobile-noc-cockpit is the busiest at 240 MAU')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ COST / FINOPS ══════════════════════════════════════════ */}
      {tab === 'cost' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total credits/mo')}    value={`${costSummary.total}K`} delta="-9% MoM"                       trend="up"   icon={Cpu}       accent />
          <KpiCard label={tt('Cloud run-rate')}       value="BSD 3.1M"                   delta="-BSD 1.4M optimised plan"         trend="up"   icon={Cloud}     />
          <KpiCard label={tt('Largest team')}         value={costSummary.topTeams[0]?.team ?? '—'} delta={`${costSummary.topTeams[0]?.credMo ?? 0}K/mo`} trend="flat" icon={Database} />
          <KpiCard label={tt('Weekend over-prov')}    value="38%"                     delta={tt('right-size pending')}      trend="down" icon={AlertTriangle} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['credits', 'spend'] as const).map(k => (
            <button key={k} onClick={() => setCostView(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${costView === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'credits' ? tt('By team') : tt('Trend')}
            </button>
          ))}
        </div>

        {costView === 'credits' && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Credits by Team — this month (K)')} insight={{ insight: 'A small number of teams account for a disproportionately large share of platform credits this month, with the top two teams consuming over 60% of the total.', action: 'Assign team-level budget alerts and chargeback codes to surface spend accountability directly to department heads.', impact: 'Chargeback visibility typically reduces unattributed platform spend by 20–35% within a single quarter.' }}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={creditsByTeam} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="K" />
                    <YAxis type="category" dataKey="team" tick={{ fontSize: 9 }} width={150} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="credK" name={tt('Credits K')} radius={[0, 4, 4, 0]}>
                      {creditsByTeam.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Warehouse Spend — Top warehouses (K credits/mo)')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Warehouse')}</th>
                      <th>{tt('Team')}</th>
                      <th className="text-right">{tt('Credits/mo')}</th>
                      <th>{tt('Tier')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseSpend.map(w => (
                      <tr key={w.wh} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-mono font-bold text-xs">{w.wh}</td>
                        <td className="text-xs text-vfes-dark/65">{w.team}</td>
                        <td className="text-right font-bold">{w.credMo}K</td>
                        <td>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragC(w.tier === 'prod' || w.tier === 'dr' ? 'Amber' : 'Green')}`}>
                            {tt(w.tier)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Link to="/portal/cost" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cost Intelligence →')}</Link>
              </div>
            </Panel>
          </div>
        )}

        {costView === 'spend' && (
          <div className="grid lg:grid-cols-1 gap-6 mb-6">
            <Panel title={tt('Monthly Credits — Actual vs Budget vs Optimised (K)')} insight={{ insight: 'Actual credit consumption has been tracking above budget for recent months while the optimised forecast shows a widening savings gap.', action: 'Implement the top three AI-advisor savings recommendations to close the gap between actual and optimised spend.', impact: 'Closing the optimisation gap would recover an estimated 18% of monthly platform credits back within budget.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={creditsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="K" />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="actual"    name={tt('Actual')}    stroke={NAVY}  strokeWidth={2.4} dot />
                    <Line type="monotone" dataKey="budget"    name={tt('Budget')}    stroke={AMBER} strokeWidth={1.8} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="optimised" name={tt('Optimised')} stroke={GREEN} strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">
                {tt('Right-sizing 3 warehouses + retiring legacy BI tier = estimated −BSD 1.4M annualised')}
              </div>
            </Panel>
          </div>
        )}
        <div className="mt-6">
          <Panel title={tt('Savings Opportunities — identified by AI advisor')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Opportunity')}</th>
                    <th>{tt('Owner')}</th>
                    <th className="text-right">{tt('Saving / yr')}</th>
                    <th>{tt('Effort')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { opp: tt('Right-size 3 weekend warehouses'),      owner: tt('Platform'),   saving: 'BSD 480K', effort: tt('Low'),    status: tt('Approved') },
                    { opp: tt('Retire legacy BI extract tier'),         owner: tt('Data Platform'), saving: 'BSD 920K', effort: tt('Med'), status: tt('In flight') },
                    { opp: tt('Consolidate 4 dev sandboxes → 1'),       owner: tt('DevOps'),     saving: 'BSD 120K', effort: tt('Low'),    status: tt('Planning') },
                    { opp: tt('Enable auto-suspend on DS_WH_XL'),       owner: tt('Data Science'),saving: 'BSD 180K', effort: tt('Low'),   status: tt('Approved') },
                    { opp: tt('Move cold Iceberg to cheap S3 tier'),    owner: tt('Data Eng'),   saving: 'BSD 260K', effort: tt('High'),   status: tt('Planning') },
                    { opp: tt('Cluster CELL_SITE_TELEMETRY on date'),   owner: tt('RAN eng.'),   saving: 'BSD 140K', effort: tt('Med'),    status: tt('In flight') },
                  ].map(r => (
                    <tr key={r.opp} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{r.opp}</td>
                      <td className="text-xs text-vfes-dark/65">{r.owner}</td>
                      <td className="text-right font-bold text-emerald-600">{r.saving}</td>
                      <td className="text-xs">{r.effort}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${r.status === tt('Approved') || r.status === tt('In flight') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-vfes-dark/40">{tt('Total identified savings: BSD 2.1M/yr · BSD 1.4M already in motion')}</span>
              <Link to="/portal/cost" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cost Intelligence →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ SECURITY & IDENTITY ═══════════════════════ */}
      {tab === 'secid' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('MFA enrolment')}       value="98%"     delta={tt('+20 pp since Jan')}       trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('Policy violations')}   value="27"      delta={tt('4 open investigations')}  trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Stale accounts')}      value="3"       delta={tt('60+ days inactive')}      trend="up"   icon={Database}     />
          <KpiCard label={tt('PAM coverage')}        value="100%"    delta={tt('admins + svc accounts')}  trend="up"   icon={Zap}           />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Network policy rules')} value="14.6K"  delta={tt('620 blocked this month')} trend="up"   icon={Activity}     />
          <KpiCard label={tt('Trust Center score')}   value="A−"     delta={tt('5 open findings')}        trend="flat" icon={CheckCircle2}  />
          <KpiCard label={tt('Zero-trust coverage')} value="64%"    delta={tt('target 85% EOY')}          trend="up"   icon={Gauge}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('IAM platform inventory — roles & access')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('User group')}</th>
                    <th className="text-right">{tt('Count')}</th>
                    <th>{tt('MFA')}</th>
                    <th>{tt('PAM')}</th>
                    <th>{tt('Last review')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {iamPlatform.map((g) => (
                    <tr key={g.group} className="border-t border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{g.group}</td>
                      <td className="text-right font-bold">{g.n}</td>
                      <td className={`font-bold text-xs ${g.mfa === '100%' ? 'text-emerald-600' : g.mfa === 'N/A' ? 'text-zinc-400' : 'text-amber-600'}`}>{g.mfa}</td>
                      <td>{g.pam ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('Yes')}</span> : <span className="text-[10px] text-zinc-400">—</span>}</td>
                      <td className="text-xs text-vfes-dark/55 font-mono">{g.lastReview}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${g.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : g.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(g.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/rbac" className="font-semibold text-vfes-dark hover:underline">{tt('RBAC Explorer →')}</Link>
              <span>·</span>
              <Link to="/portal/trust-center" className="font-semibold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('MFA enrolment trend — platform users (%)')} insight={{ insight: 'MFA enrolment has grown steadily but a portion of platform users remain unenrolled, leaving an open identity risk surface.', action: 'Set an authentication policy deadline to enforce MFA for all remaining users before the next compliance review cycle.', impact: 'Full MFA coverage eliminates the most common credential-based attack vector and satisfies ISO 27001 access control requirements.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={mfaEnrolTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[70, 105]} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="enrolled" name={tt('Enrolled %')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} strokeWidth={2} />
                  <Line type="monotone" dataKey="target"   name={tt('Target')}     stroke={GREEN} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('MFA jumped from 78% to 98% in H2 2026 following the mandatory enrolment campaign. Target 100% by Q3.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Security policy violations — last 30 days')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Policy')}</th>
                  <th className="text-right">{tt('Violations')}</th>
                  <th className="text-right">{tt('Trend')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {policyBreaches.map((p) => (
                  <tr key={p.policy} className="border-t border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(p.policy)}</td>
                    <td className={`text-right font-bold ${p.violations >= 10 ? 'text-red-600' : p.violations >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.violations}</td>
                    <td className={`text-right text-xs ${p.trend < 0 ? 'text-emerald-600' : p.trend > 0 ? 'text-red-600' : 'text-zinc-400'}`}>{p.trend > 0 ? `+${p.trend}` : p.trend}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Alerting' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/risk" className="font-semibold text-vfes-dark hover:underline">{tt('Risk & Security →')}</Link>
            <span>·</span>
            <Link to="/portal/observability" className="font-semibold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
            <span>·</span>
            <Link to="/portal/incidents" className="font-semibold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Network policy connections — allowed vs blocked (monthly)')} insight={{ insight: 'Blocked connection attempts show a rising monthly trend, indicating increased external reconnaissance or misconfigured client tooling.', action: 'Review blocked IP ranges against known SaaS integration endpoints and tighten the IP allowlist for Snowflake access.', impact: 'Proactive network policy hardening reduces the platform attack surface and shortens incident response time for any future breach attempt.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={networkAclTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="allowed" name={tt('Allowed')} fill={GREEN} stackId="a" />
                  <Bar yAxisId="l" dataKey="blocked" name={tt('Blocked')} fill={'#ef4444'} stackId="a" />
                  <Line yAxisId="r" type="monotone" dataKey="new" name={tt('New rules')} stroke={AMBER} strokeWidth={2} dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('620 connections blocked in Jun — primarily external IPs hitting private API endpoints. Network policy tightened Q2 with IP allowlisting on all prod access.')}</div>
          </Panel>

          <Panel title={tt('RBAC role access heatmap — objects per role')}>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Role')}</th>
                    <th className="text-right">{tt('Tables')}</th>
                    <th className="text-right">{tt('Views')}</th>
                    <th className="text-right">{tt('Schemas')}</th>
                    <th className="text-right">{tt('Sensitive')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rbacHeatmap.map((r) => (
                    <tr key={r.role} className="border-t border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono font-bold text-xs">{r.role}</td>
                      <td className="text-right">{r.tables.toLocaleString()}</td>
                      <td className="text-right">{r.views}</td>
                      <td className="text-right">{r.schemas}</td>
                      <td className={`text-right font-bold ${r.sensitive >= 12 ? 'text-red-600' : r.sensitive >= 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.sensitive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/rbac" className="font-semibold text-vfes-dark hover:underline">{tt('Full RBAC Explorer →')}</Link>
              <span>·</span>
              <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
