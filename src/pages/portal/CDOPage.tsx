import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import {
  Database, ShieldCheck, GitBranch, BadgeCheck, Boxes, FileCheck, Layers, Search,
  Gauge, Lock, Activity, Bell, Eye, HardDrive, Server, AlertTriangle, TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const stP = (s: string) =>
  s === 'Healthy' || s === 'Pass' || s === 'Active' || s === 'Approved' || s === 'Passed'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Watch' || s === 'Degraded' || s === 'Warning' || s === 'Review'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

const ragC = (r: 'Green' | 'Amber' | 'Red') =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

// ── Catalog ──────────────────────────────────────────────────────────────────
const catalogDomains = [
  { domain: 'Customer & CRM',    tables: 248, views: 82, streams: 12, owned: 248, dmf: 246, pii: 68, quality: 98.2, storageTb: 14.2 },
  { domain: 'Network & OSS',     tables: 214, views: 68, streams: 18, owned: 214, dmf: 210, pii:  4, quality: 96.8, storageTb: 24.8 },
  { domain: 'Billing & Finance', tables: 188, views: 62, streams:  8, owned: 188, dmf: 185, pii: 42, quality: 98.8, storageTb: 12.4 },
  { domain: 'Marketing & CVM',   tables: 142, views: 44, streams:  6, owned: 142, dmf: 136, pii: 22, quality: 95.4, storageTb:  8.6 },
  { domain: 'Product & Catalog', tables:  98, views: 32, streams:  4, owned:  98, dmf:  94, pii:  0, quality: 96.1, storageTb:  4.2 },
  { domain: 'B2B & Enterprise',  tables:  84, views: 28, streams:  4, owned:  84, dmf:  82, pii:  8, quality: 97.6, storageTb:  5.8 },
  { domain: 'HR & People',       tables:  72, views: 22, streams:  2, owned:  72, dmf:  68, pii: 58, quality: 94.8, storageTb:  2.4 },
  { domain: 'Regulatory & Risk', tables:  75, views: 18, streams:  2, owned:  75, dmf:  72, pii: 12, quality: 97.1, storageTb:  3.6 },
]
const totalTables = catalogDomains.reduce((s, d) => s + d.tables, 0)

const catalogGrowth = [
  { m: 'Jun', tables: 1042, views: 312, streams: 48 },
  { m: 'Jul', tables: 1058, views: 318, streams: 52 },
  { m: 'Aug', tables: 1072, views: 326, streams: 56 },
  { m: 'Sep', tables: 1088, views: 334, streams: 60 },
  { m: 'Oct', tables: 1108, views: 348, streams: 64 },
  { m: 'Nov', tables: 1121, views: 356, streams: 68 },
]

const tagCoverage = catalogDomains.map(d => ({
  domain: d.domain.split(' ')[0],
  tagged: Math.round((d.owned / d.tables) * 100),
  dmf: Math.round((d.dmf / d.tables) * 100),
}))

const recentAssets = [
  { name: 'CHURN_FEATURES_V3',      domain: 'Marketing & CVM',  type: 'Table',  owner: 'ML Platform',   size: '4.2 GB',  contract: 'Watch',   added: '2h ago' },
  { name: 'NETWORK_KPI_DAILY',       domain: 'Network & OSS',    type: 'Table',  owner: 'Network Eng',   size: '1.8 GB',  contract: 'Active',  added: '4h ago' },
  { name: 'B2B_PIPELINE_LEADS',      domain: 'B2B & Enterprise', type: 'Table',  owner: 'B2B Team',      size: '0.4 GB',  contract: 'Review',  added: '1d ago' },
  { name: 'BILLING_EVENTS_RAW',      domain: 'Billing & Finance',type: 'Table',  owner: 'Billing Eng',   size: '18.4 GB', contract: 'Active',  added: '1d ago' },
  { name: 'RAN_CELL_TELEMETRY',      domain: 'Network & OSS',    type: 'Stream', owner: 'RAN Ops',       size: '38.2 GB', contract: 'Active',  added: '2d ago' },
  { name: 'CLV_SCORES_Q2',           domain: 'Marketing & CVM',  type: 'Table',  owner: 'ML Platform',   size: '3.4 GB',  contract: 'Active',  added: '2d ago' },
  { name: 'FRAUD_SIGNALS_RT',        domain: 'Regulatory & Risk',type: 'Stream', owner: 'Fraud Ops',     size: '0.8 GB',  contract: 'Active',  added: '3d ago' },
  { name: 'PROCUREMENT_ORDERS',      domain: 'B2B & Enterprise', type: 'Table',  owner: 'Procurement',   size: '1.2 GB',  contract: 'Review',  added: '4d ago' },
  { name: 'VOC_RESPONSES_RAW',       domain: 'Customer & CRM',   type: 'Table',  owner: 'CX Analytics',  size: '2.1 GB',  contract: 'Review',  added: '4d ago' },
  { name: 'REVENUE_BY_LANE',         domain: 'Billing & Finance',type: 'View',   owner: 'Finance Eng',   size: '—',       contract: 'Active',  added: '5d ago' },
  { name: 'NBA_FEATURES_DAILY',      domain: 'Marketing & CVM',  type: 'Table',  owner: 'ML Platform',   size: '6.8 GB',  contract: 'Active',  added: '5d ago' },
  { name: 'SPECTRUM_HOLDINGS',       domain: 'Regulatory & Risk',type: 'Table',  owner: 'Spectrum',      size: '0.1 GB',  contract: 'Active',  added: '7d ago' },
]

// ── Lineage ───────────────────────────────────────────────────────────────────
const lineageHotspots = [
  { asset: 'CUSTOMER_MASTER',      downstream: 142, domains: 6, criticalPaths: 18, depth: 6, status: 'Healthy' },
  { asset: 'BILLING_EVENTS_RAW',   downstream:  98, domains: 4, criticalPaths: 14, depth: 5, status: 'Healthy' },
  { asset: 'CHURN_FEATURES',       downstream:  48, domains: 3, criticalPaths:  8, depth: 4, status: 'Watch'   },
  { asset: 'NETWORK_KPIS_DAILY',   downstream:  84, domains: 5, criticalPaths: 12, depth: 4, status: 'Healthy' },
  { asset: 'CAMPAIGN_ATTRIBUTION', downstream:  38, domains: 3, criticalPaths:  6, depth: 3, status: 'Watch'   },
  { asset: 'REGULATORY_REPORTS',   downstream:  24, domains: 2, criticalPaths:  4, depth: 3, status: 'Healthy' },
  { asset: 'CLV_SCORES',           downstream:  42, domains: 4, criticalPaths:  7, depth: 5, status: 'Healthy' },
  { asset: 'NBA_FEATURES_DAILY',   downstream:  36, domains: 3, criticalPaths:  5, depth: 4, status: 'Healthy' },
]

const lineageDepth = [
  { level: 'Raw',     count: 312, color: SLATE },
  { level: 'Curated', count: 428, color: NAVY  },
  { level: 'Serving', count: 248, color: BLUE  },
  { level: 'Reports', count: 133, color: GREEN },
]

const lineageTrend = [
  { m: 'Jun', edges: 4200, traced: 3780 }, { m: 'Jul', edges: 4400, traced: 4015 },
  { m: 'Aug', edges: 4620, traced: 4250 }, { m: 'Sep', edges: 4840, traced: 4520 },
  { m: 'Oct', edges: 5060, traced: 4784 }, { m: 'Nov', edges: 5240, traced: 5030 },
]

// ── Data Quality ──────────────────────────────────────────────────────────────
const qualityScores = [
  { domain: 'Billing & Finance', score: 98.8, dmfCoverage: 98.4, incidents:  1, sla: 'Pass',  tier: 1 },
  { domain: 'Customer & CRM',    score: 98.2, dmfCoverage: 99.2, incidents:  2, sla: 'Pass',  tier: 1 },
  { domain: 'B2B & Enterprise',  score: 97.6, dmfCoverage: 97.6, incidents:  1, sla: 'Pass',  tier: 1 },
  { domain: 'Regulatory & Risk', score: 97.1, dmfCoverage: 96.0, incidents:  2, sla: 'Pass',  tier: 1 },
  { domain: 'Network & OSS',     score: 96.8, dmfCoverage: 98.1, incidents:  3, sla: 'Pass',  tier: 2 },
  { domain: 'Product & Catalog', score: 96.1, dmfCoverage: 95.9, incidents:  2, sla: 'Pass',  tier: 2 },
  { domain: 'Marketing & CVM',   score: 95.4, dmfCoverage: 95.8, incidents:  5, sla: 'Watch', tier: 2 },
  { domain: 'HR & People',       score: 94.8, dmfCoverage: 94.4, incidents:  4, sla: 'Watch', tier: 3 },
]

const qualityTrend = [
  { m: 'Jun', score: 95.2, dmf: 91.4 }, { m: 'Jul', score: 95.8, dmf: 92.8 },
  { m: 'Aug', score: 96.2, dmf: 93.6 }, { m: 'Sep', score: 96.8, dmf: 95.0 },
  { m: 'Oct', score: 97.0, dmf: 96.2 }, { m: 'Nov', score: 97.2, dmf: 97.1 },
]

const freshnessSla = [
  { m: 'Jun', met: 98.2, target: 99.0 }, { m: 'Jul', met: 98.6, target: 99.0 },
  { m: 'Aug', met: 98.9, target: 99.0 }, { m: 'Sep', met: 99.0, target: 99.0 },
  { m: 'Oct', met: 99.1, target: 99.0 }, { m: 'Nov', met: 99.1, target: 99.0 },
]

// ── Governance ────────────────────────────────────────────────────────────────
const policyRegistry = [
  { policy: 'PII Masking — MSISDN',           type: 'Masking',     tables:  48, owner: 'Data Governance', status: 'Active' },
  { policy: 'PII Masking — Email/Name',        type: 'Masking',     tables:  62, owner: 'Data Governance', status: 'Active' },
  { policy: 'Row-level — Billing cost centre', type: 'Row Access',  tables:  18, owner: 'Finance',         status: 'Active' },
  { policy: 'Row-level — Network region',      type: 'Row Access',  tables:  24, owner: 'Network',         status: 'Active' },
  { policy: 'Aggregation — HR metrics',        type: 'Aggregation', tables:  12, owner: 'HR',              status: 'Active' },
  { policy: 'Projection — CRM restrict',       type: 'Projection',  tables:   8, owner: 'CRM',             status: 'Review' },
  { policy: 'Tag — DPA Article-6 consent',    type: 'Tag',         tables: 134, owner: 'Legal',           status: 'Active' },
  { policy: 'Tag — URCA Regulatory data',      type: 'Tag',         tables:  75, owner: 'Regulatory',      status: 'Active' },
]

const governanceCovTrend = [
  { q: 'Q1-26', actual: 71, target: 80 }, { q: 'Q2-26', actual: 83, target: 86 },
  { q: 'Q3-26', actual: 90, target: 92 }, { q: 'Q4-26', actual: 94, target: 95 },
]

const rbacRoles = [
  { role: 'DATA_ENGINEER_RL',     grantees:  48, objects:  284, piiAccess: false, elevated: false },
  { role: 'ANALYST_RL',           grantees: 142, objects:  124, piiAccess: false, elevated: false },
  { role: 'DATA_SCIENTIST_RL',    grantees:  36, objects:  198, piiAccess: false, elevated: false },
  { role: 'GOVERNANCE_RL',        grantees:  12, objects:   48, piiAccess: true,  elevated: true  },
  { role: 'FINANCE_ANALYST_RL',   grantees:  28, objects:   88, piiAccess: false, elevated: false },
  { role: 'SYSADMIN',             grantees:   6, objects: 1121, piiAccess: true,  elevated: true  },
  { role: 'DASHBOARD_SHARING_RL', grantees:   8, objects:   64, piiAccess: false, elevated: false },
]

// ── Data Products ─────────────────────────────────────────────────────────────
const dataProducts = [
  { name: 'Customer-360 Gold',       domain: 'Customer',  subs: 18, sla: '99.5%', freshness: '4h',  contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Churn Score Dataset',     domain: 'CVM',       subs: 12, sla: '99.0%', freshness: '6h',  contract: 'Watch',  status: 'Watch',   tier: 1 },
  { name: 'Billing Aggregates',      domain: 'Finance',   subs: 24, sla: '99.8%', freshness: '1h',  contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Network KPI Summary',     domain: 'Network',   subs: 16, sla: '98.5%', freshness: '15m', contract: 'Active', status: 'Healthy', tier: 2 },
  { name: 'Campaign Attribution',    domain: 'Marketing', subs:  8, sla: '97.0%', freshness: '24h', contract: 'Review', status: 'Watch',   tier: 2 },
  { name: 'B2B Account 360',         domain: 'B2B',       subs: 14, sla: '99.2%', freshness: '8h',  contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Regulatory Snapshot',     domain: 'Risk',      subs:  6, sla: '99.9%', freshness: '24h', contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Revenue Analytics Hub',   domain: 'Finance',   subs: 22, sla: '99.8%', freshness: '2h',  contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Fraud Signals',           domain: 'Risk',      subs:  7, sla: '99.5%', freshness: '30m', contract: 'Active', status: 'Healthy', tier: 1 },
  { name: 'Product Usage Rollup',    domain: 'Product',   subs: 10, sla: '98.0%', freshness: '12h', contract: 'Active', status: 'Healthy', tier: 2 },
  { name: 'NPS Drivers',             domain: 'CX',        subs:  9, sla: '97.5%', freshness: '24h', contract: 'Active', status: 'Healthy', tier: 2 },
  { name: 'Network Forecast Inputs', domain: 'Network',   subs:  5, sla: '96.0%', freshness: '6h',  contract: 'Active', status: 'Healthy', tier: 3 },
]

const productSlaTrend = [
  { m: 'Jun', healthy: 38, watch: 3, breached: 1 }, { m: 'Jul', healthy: 39, watch: 3, breached: 0 },
  { m: 'Aug', healthy: 40, watch: 2, breached: 0 }, { m: 'Sep', healthy: 40, watch: 2, breached: 0 },
  { m: 'Oct', healthy: 41, watch: 2, breached: 0 }, { m: 'Nov', healthy: 40, watch: 2, breached: 0 },
]

// ── Observability ─────────────────────────────────────────────────────────────
const pipelineHealth = [
  { h: '00', ingestion: 99.8, transform: 99.6, serving: 99.9 },
  { h: '04', ingestion: 99.9, transform: 99.8, serving: 99.9 },
  { h: '08', ingestion: 99.4, transform: 98.8, serving: 99.8 },
  { h: '12', ingestion: 99.2, transform: 99.0, serving: 99.6 },
  { h: '16', ingestion: 99.7, transform: 99.3, serving: 99.8 },
  { h: '20', ingestion: 99.8, transform: 99.7, serving: 99.9 },
  { h: '22', ingestion: 99.9, transform: 99.8, serving: 99.9 },
]

const activePipelines = [
  { name: 'BILLING_RAW → BILLING_EVENTS',    type: 'Snowpipe Streaming', freshness: '<5min',  lastRun: '2m',  sla: 99.8, status: 'Healthy' },
  { name: 'RAN_TELEMETRY → CELL_KPI_HOURLY', type: 'Dynamic Table',      freshness: '<1h',    lastRun: '12m', sla: 99.4, status: 'Healthy' },
  { name: 'CRM_EXTRACT → CX_360',            type: 'Task',               freshness: '<2h',    lastRun: '1h',  sla: 98.8, status: 'Healthy' },
  { name: 'CHURN_FEATURES_COMPUTE',          type: 'ML Pipeline',        freshness: '<4h',    lastRun: '3h',  sla: 96.8, status: 'Watch'   },
  { name: 'FINANCE_ACTUALS_ETL',             type: 'Task',               freshness: 'daily',  lastRun: '6h',  sla: 99.6, status: 'Healthy' },
  { name: 'FRAUD_RT_STREAM',                 type: 'Snowpipe',           freshness: '<1min',  lastRun: '10s', sla: 99.9, status: 'Healthy' },
  { name: 'NBA_FEATURES_REFRESH',            type: 'Dynamic Table',      freshness: '<1h',    lastRun: '22m', sla: 97.8, status: 'Healthy' },
  { name: 'NETWORK_KPI_DAILY',               type: 'Stored Proc',        freshness: 'daily',  lastRun: '2h',  sla: 98.8, status: 'Healthy' },
]

// ── Cost / Storage ────────────────────────────────────────────────────────────
const storageBreakdown = [
  { name: 'Network & OSS',      tb: 24.8, color: NAVY   },
  { name: 'Customer & CRM',     tb: 14.2, color: BLUE   },
  { name: 'Billing & Finance',  tb: 12.4, color: GREEN  },
  { name: 'Marketing & CVM',    tb:  8.6, color: AMBER  },
  { name: 'Product & Catalog',  tb:  4.2, color: PURPLE },
  { name: 'Other',               tb:  5.8, color: SLATE  },
]

const costTrend = [
  { m: 'Jun', storage: 18.2, compute: 34.6 }, { m: 'Jul', storage: 18.6, compute: 36.2 },
  { m: 'Aug', storage: 19.0, compute: 35.8 }, { m: 'Sep', storage: 19.4, compute: 37.4 },
  { m: 'Oct', storage: 20.1, compute: 36.8 }, { m: 'Nov', storage: 20.8, compute: 38.2 },
]

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'catalog' | 'lineage' | 'quality' | 'governance' | 'products' | 'observability' | 'cost'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',      label: 'Overview',       icon: Gauge      },
  { id: 'catalog',       label: 'Data Catalog',   icon: Database   },
  { id: 'lineage',       label: 'Lineage',         icon: GitBranch  },
  { id: 'quality',       label: 'Data Quality',   icon: BadgeCheck },
  { id: 'governance',    label: 'Governance',     icon: ShieldCheck},
  { id: 'products',      label: 'Data Products',  icon: Boxes      },
  { id: 'observability', label: 'Observability',  icon: Eye        },
  { id: 'cost',          label: 'Cost & Storage', icon: HardDrive  },
]

export default function CDOPage() {
  const [tab, setTab]                   = useState<TabId>('overview')
  const [catalogDomain, setCatalogDomain] = useState<string>('All')
  const [qualitySort, setQualitySort]   = useState<'score' | 'domain'>('score')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]         = useState<string>('')
  const [policyType, setPolicyType]     = useState<string>('All')
  const [productStatus, setProductStatus] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredCatalog = useMemo(
    () => catalogDomain === 'All' ? catalogDomains : catalogDomains.filter(d => d.domain === catalogDomain),
    [catalogDomain],
  )

  const sortedQuality = useMemo(
    () => [...qualityScores].sort((a, b) => qualitySort === 'score' ? b.score - a.score : a.domain.localeCompare(b.domain)),
    [qualitySort],
  )

  const filteredPolicies = useMemo(
    () => policyType === 'All' ? policyRegistry : policyRegistry.filter(p => p.type === policyType),
    [policyType],
  )

  const filteredProducts = useMemo(
    () => productStatus === 'All' ? dataProducts : dataProducts.filter(p => p.status === productStatus),
    [productStatus],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Data Officer')}
        subtitle={tt('Office of the CDO · Pieter Knowles · FY2026 Q2 · one governed platform, every team on the same number')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{totalTables.toLocaleString()}{tt(' tables · ')}{liveTime}
            </span>
            <Link to="/portal/horizon" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {tt('Open Horizon Governance')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Data intelligence"
        models={[
          { name: 'Schema-drift Detector',        metric: '0 breaking',    sub: 'contract-aware change alerts'  },
          { name: 'Freshness & Anomaly Monitor',  metric: '99.1% SLA',     sub: 'DMF-backed quality signals'    },
          { name: 'PII Auto-classifier',          metric: '100% coverage', sub: 'auto-tag + masking policy'     },
        ]}
        agentLabel="Run Data Trust Review"
        agentRunningLabel="Profiling…"
        agentSteps={[
          'Scanned 1,121 tables for freshness & schema drift',
          'Reconciled data contracts vs live producers',
          'Re-classified new columns and applied masking policies',
          'Scored every Tier-1 data product against its SLA',
        ]}
        agentBlurb="Governance, lineage and quality run on one platform — so a number a board member sees can be traced to source, owner and policy in a single click."
        decision={{
          title: 'Quarantine the CHURN_FEATURES product until its contract is fixed',
          detail: 'A producer pushed a breaking schema change to CHURN_FEATURES; 3 downstream consumers (Churn model, NBA engine, CX dashboard) are now reading a renamed column. Quarantining the product and routing the producer to the contract recovers trust before the next model run.',
          impact: 'protects 3 Tier-1 consumers · prevents silent model drift',
          risk: 'churn scoring pauses ~2h while the contract is restored',
          linkTo: '#/portal/data-contracts',
          linkLabel: 'Open Data Contracts',
        }}
        chart={{
          kind: 'line',
          title: 'Governance coverage — actual vs target (% of assets)',
          xKey: 'q',
          unit: '%',
          data: [
            { q: 'Q1-26', actual: 71, target: 80 },
            { q: 'Q2-26', actual: 83, target: 86 },
            { q: 'Q3-26', actual: 90, target: 92 },
            { q: 'Q4-26', actual: 94, target: 95 },
          ],
          series: [
            { key: 'actual', name: 'Actual', color: BLUE },
            { key: 'target', name: 'Target', color: NAVY, dashed: true },
          ],
          note: 'Coverage = assets with an owner, classification and an attached quality monitor.',
        }}
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('CHURN_FEATURES contract breach · 3 Tier-1 consumers affected · Marketing & HR DMF below 97%')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Producer pushed a breaking schema change without version bump. NBA engine and CX dashboard reading stale column reference.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/data-contracts" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Contracts →')}
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

      {/* ══════════════ OVERVIEW ════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Governed data products')} value="42"    delta="+7 this quarter"     trend="up"   icon={Boxes}      accent />
          <KpiCard label={tt('Governance coverage')}    value="94%"   delta="target 95%"           trend="up"   icon={ShieldCheck}       />
          <KpiCard label={tt('Data quality score')}     value="97.2%" delta="+1.4 pp QoQ"          trend="up"   icon={Gauge}             />
          <KpiCard label={tt('Freshness SLA met')}      value="99.1%" delta="DMF-monitored"        trend="up"   icon={FileCheck}         />
          <KpiCard label={tt('PII columns classified')} value="100%"  delta="auto-tagged"           trend="flat" icon={Lock}              />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CDO domain')}
            links={[
              { to: 'catalog',        label: 'Data Catalog',      metric: tt('1,121 objects · search & discovery'), icon: Search      },
              { to: 'lineage',        label: 'Lineage',            metric: tt('Column-level · source to dashboard'), icon: GitBranch   },
              { to: 'data-quality',   label: 'Data Quality',      metric: tt('DMF coverage · 97.2% score'),          icon: Gauge       },
              { to: 'data-products',  label: 'Data Products',     metric: tt('42 live · SLA & ownership'),           icon: Boxes       },
              { to: 'data-contracts', label: 'Data Contracts',    metric: tt('Producer ↔ consumer guarantees'),      icon: FileCheck   },
              { to: 'semantic-views', label: 'Semantic Views',    metric: tt('Governed metrics for Cortex Analyst'), icon: Layers      },
              { to: 'horizon',        label: 'Horizon Governance', metric: tt('Tags · policies · access history'),   icon: ShieldCheck },
              { to: 'rbac',           label: 'RBAC Explorer',     metric: tt('Roles · grants · least privilege'),    icon: Lock        },
              { to: 'observability',  label: 'Observability',     metric: tt('Pipelines · freshness · cost'),        icon: BadgeCheck  },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('CDO priorities — FY2026')}
              items={[
                { name: 'Power BI → Snowflake migration (single source of truth)', owner: tt('Data Platform · Pieter Knowles'), pct: 72, status: 'on-track' },
                { name: 'Horizon governance rollout — 100% Tier-1 coverage',       owner: tt('Data Governance'),             pct: 88, status: 'on-track' },
                { name: 'Data contracts on all Tier-1 products',                    owner: tt('Data Platform'),               pct: 61, status: 'at-risk'  },
                { name: 'Semantic layer coverage for Cortex Analyst',               owner: tt('Analytics Engineering'),       pct: 54, status: 'on-track' },
                { name: 'Decommission legacy data lake',                             owner: tt('Data Platform'),               pct: 33, status: 'behind'  },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CDO desk')}
            items={[
              { text: tt('CHURN_FEATURES contract breach — 3 consumers affected'), level: 'high'   },
              { text: tt('2 new PII columns in BILLING_RAW — auto-masked'),         level: 'medium' },
              { text: tt('Freshness SLA on NETWORK_KPIS slipped overnight'),        level: 'medium' },
              { text: tt('Storage +7% MoM — time-travel retention under review'),   level: 'low'    },
            ]}
          />
        </div>

        <div className="mb-6">
          <AgendaList
            title={tt('CDO cadence')}
            items={[
              { what: tt('Data Governance Council'),     when: tt('Thu 27 Jun') },
              { what: tt('Architecture Review Board'),   when: tt('Tue 2 Jul')  },
              { what: tt('Data product owner sync'),     when: tt('Wed 10 Jul') },
              { what: tt('Quarterly data trust report'), when: tt('Fri 26 Jul') },
            ]}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-2">{tt('Catalog health')}</div>
            <div className="text-2xl font-extrabold text-blue-700">{totalTables.toLocaleString()}</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('tables · 356 views · 68 streams in the enterprise catalog')}</div>
            <Link to="/portal/catalog" className="text-xs font-bold text-blue-600 hover:underline mt-2 block">{tt('Open Data Catalog →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-2">{tt('Lineage coverage')}</div>
            <div className="text-2xl font-extrabold text-emerald-700">5,240</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('lineage edges · 96% column-level traced · 62 critical paths')}</div>
            <Link to="/portal/lineage" className="text-xs font-bold text-emerald-600 hover:underline mt-2 block">{tt('Open Lineage →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-purple-600 mb-2">{tt('Data sharing')}</div>
            <div className="text-2xl font-extrabold text-purple-700">18</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('governed shares · Iceberg open format · Marketplace-ready')}</div>
            <Link to="/portal/sharing" className="text-xs font-bold text-purple-600 hover:underline mt-2 block">{tt('Open Data Sharing →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ DATA CATALOG ════════════════════════════════════════════ */}
      {tab === 'catalog' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total tables')}    value="1,121" delta="+79 YTD"             trend="up"   icon={Database}   accent />
          <KpiCard label={tt('Total assets')}    value="1,545" delta="incl. views & streams" trend="up"  icon={Layers}            />
          <KpiCard label={tt('With ownership')}  value="100%"  delta="all 8 domains"        trend="flat" icon={BadgeCheck}        />
          <KpiCard label={tt('Iceberg tables')}  value="128"   delta="+22 this quarter"     trend="up"   icon={Server}            />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Domain:')}</span>
          {['All', ...catalogDomains.map(d => d.domain)].map(d => (
            <button key={d} onClick={() => setCatalogDomain(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${catalogDomain === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {d === 'All' ? tt('All') : d.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Asset Growth — tables · views · streams (6 months)')} insight={{ insight: 'Stream and table counts are accelerating ahead of views, showing raw ingest outpacing governed semantic layer growth.', action: 'Prioritise view and semantic model registration to convert raw assets into consumption-ready governed objects this quarter.', impact: 'Closing the view-to-table gap raises catalog quality score and reduces direct raw-table access by analysts.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={catalogGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="tables"  name={tt('Tables')}  stackId="1" stroke={BLUE}  fill={BLUE}  fillOpacity={0.35} />
                  <Area type="monotone" dataKey="views"   name={tt('Views')}   stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.35} />
                  <Area type="monotone" dataKey="streams" name={tt('Streams')} stackId="1" stroke={AMBER} fill={AMBER} fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Tag & DMF Coverage by Domain (%)')} insight={{ insight: 'Three domains are below the 95% tagging SLA floor, creating unmonitored PII exposure and blind spots in masking policy coverage.', action: 'Run auto-classification on under-tagged domains and assign dedicated stewards to clear the backlog within two sprints.', impact: 'Reaching 95% coverage across all domains removes the last blocker for their inclusion in certified Tier-1 data products.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={tagCoverage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[88, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tagged" name={tt('Tagging %')}      fill={BLUE}  radius={[3, 3, 0, 0]} />
                  <Bar dataKey="dmf"    name={tt('DMF coverage %')} fill={GREEN} radius={[3, 3, 0, 0]} />
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber = 95% minimum SLA for Tier-1 domains')}</div>
          </Panel>
        </div>

        <Panel title={tt('Catalog Domain Scorecard — 8 domains')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Domain')}</th>
                  <th className="text-right">{tt('Tables')}</th>
                  <th className="text-right">{tt('Views')}</th>
                  <th className="text-right">{tt('Streams')}</th>
                  <th className="text-right">{tt('DMF %')}</th>
                  <th className="text-right">{tt('PII cols')}</th>
                  <th className="text-right">{tt('Quality %')}</th>
                  <th className="text-right">{tt('Storage TB')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map(d => (
                  <tr key={d.domain} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{d.domain}</td>
                    <td className="text-right font-mono">{d.tables}</td>
                    <td className="text-right font-mono text-vfes-dark/65">{d.views}</td>
                    <td className="text-right font-mono text-vfes-dark/65">{d.streams}</td>
                    <td className={`text-right font-bold ${Math.round(d.dmf / d.tables * 100) >= 97 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Math.round(d.dmf / d.tables * 100)}%
                    </td>
                    <td className="text-right text-vfes-dark/65">{d.pii}</td>
                    <td className={`text-right font-bold ${d.quality >= 97 ? 'text-emerald-600' : d.quality >= 95 ? 'text-amber-600' : 'text-red-600'}`}>{d.quality}%</td>
                    <td className="text-right font-mono text-xs">{d.storageTb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Catalog →')}</Link>
            <Link to="/portal/iceberg" className="text-xs font-bold text-vfes-dark hover:underline">{tt('View Iceberg Tables →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Recently Added Assets — last 7 days')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Asset')}</th>
                    <th>{tt('Domain')}</th>
                    <th>{tt('Type')}</th>
                    <th>{tt('Owner')}</th>
                    <th className="text-right">{tt('Size')}</th>
                    <th>{tt('Contract')}</th>
                    <th>{tt('Added')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map(r => (
                    <tr key={r.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs font-bold">{r.name}</td>
                      <td className="text-xs text-vfes-dark/65">{r.domain}</td>
                      <td className="text-xs">{r.type}</td>
                      <td className="text-xs">{r.owner}</td>
                      <td className="text-right font-mono text-xs">{r.size}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(r.contract)}`}>{tt(r.contract)}</span></td>
                      <td className="text-xs text-vfes-dark/55">{r.added}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ LINEAGE ══════════════════════════════════════════════════ */}
      {tab === 'lineage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Lineage edges')}       value="5,240"  delta="+240 this month" trend="up"   icon={GitBranch}    accent />
          <KpiCard label={tt('Column-level traced')} value="96%"    delta="+4 pp QoQ"       trend="up"   icon={Layers}             />
          <KpiCard label={tt('Critical paths')}      value="62"     delta="Tier-1 assets"    trend="flat" icon={AlertTriangle}      />
          <KpiCard label={tt('Stale edges')}         value="12"     delta="< 48h lag"        trend="down" icon={Activity}           />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Lineage Medallion — assets by layer')} insight={{ insight: 'The serving layer holds less than 15% of total assets, meaning most governed data has not reached a consumer-ready state.', action: 'Promote the top 200 curated tables to serving-layer views and register them as certified data products in the catalog this quarter.', impact: 'Deeper serving-layer coverage directly lifts self-service adoption rates and reduces ad-hoc raw data extraction requests.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={lineageDepth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Assets')} radius={[4, 4, 0, 0]}>
                    {lineageDepth.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Raw → Curated → Serving → Reports — 4-tier medallion, total 1,121 tables')}</div>
          </Panel>

          <Panel title={tt('Total Lineage Edges vs Traced — 6 months')} insight={{ insight: 'The gap between total and traced lineage edges is widening monthly, leaving a growing share of data flows opaque to impact analysis.', action: 'Mandate lineage annotation for all new pipeline deployments and run a back-fill programme on currently untraced edges.', impact: 'Full lineage traceability cuts mean time to root-cause data incidents and enables confident schema change governance.' }}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={lineageTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  dataKey="edges"  name={tt('Total edges')}  fill={SLATE} fillOpacity={0.5} />
                    <Line type="monotone" dataKey="traced" name={tt('Traced edges')} stroke={BLUE} strokeWidth={2.4} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('High Fan-Out Assets — top lineage hotspots')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Asset')}</th>
                  <th className="text-right">{tt('Downstream')}</th>
                  <th className="text-right">{tt('Domains')}</th>
                  <th className="text-right">{tt('Critical paths')}</th>
                  <th className="text-right">{tt('Max depth')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {lineageHotspots.map(l => (
                  <tr key={l.asset} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-bold font-mono text-xs">{l.asset}</td>
                    <td className="text-right font-bold">{l.downstream}</td>
                    <td className="text-right">{l.domains}</td>
                    <td className={`text-right font-bold ${l.criticalPaths >= 14 ? 'text-amber-600' : 'text-emerald-600'}`}>{l.criticalPaths}</td>
                    <td className="text-right font-mono text-xs">{l.depth} hops</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(l.status)}`}>{tt(l.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/lineage" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Full Lineage Explorer →')}</Link>
            <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('CHURN_FEATURES breach propagates to NBA engine & CX dashboard — quarantine recommended')}</span>
          </div>
        </Panel>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-[#FF4438]/8 to-transparent border border-[#FF4438]/20 p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-[#222128] mb-3">{tt('Lineage highlights')}</div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-vfes-dark/70">
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Deepest chain')}</div>
              {tt('BILLING_RAW → BILLING_EVENTS → REVENUE_DAILY → FINANCE_ACTUALS → BOARD_PACK (5 hops)')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Widest fan-out')}</div>
              {tt('CUSTOMER_MASTER drives 142 downstream consumers across 6 domains and 18 critical paths')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Critical path risk')}</div>
              {tt('CHURN_FEATURES breach propagates to NBA engine & CX dashboard — quarantine recommended')}
            </div>
          </div>
        </div>
      </>)}

      {/* ══════════════ DATA QUALITY ════════════════════════════════════════════ */}
      {tab === 'quality' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Overall quality score')} value="97.2%"  delta="+1.4 pp QoQ"        trend="up"   icon={Gauge}         accent />
          <KpiCard label={tt('DMF coverage')}           value="97.1%"  delta="+5.7 pp YTD"        trend="up"   icon={BadgeCheck}          />
          <KpiCard label={tt('Active DMF checks')}      value="4,284"  delta="across 8 domains"    trend="up"   icon={Activity}            />
          <KpiCard label={tt('Quality incidents (7d)')} value="20"     delta="-8 vs prior week"     trend="up"   icon={AlertTriangle}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['score', 'domain'] as const).map(k => (
            <button key={k} onClick={() => setQualitySort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${qualitySort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'score' ? tt('Score ↓') : tt('Domain A–Z')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Quality Score & DMF Coverage Trend — 6 months (%)')} insight={{ insight: 'Both quality score and DMF coverage remain just below the 97% board KPI floor despite steady month-on-month improvement.', action: 'Add DMF checks to the three domains currently without coverage to push composite quality score above the amber threshold.', impact: 'Crossing the 97% floor qualifies these datasets for board reporting and removes the manual certification review step.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={qualityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[89, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="score" name={tt('Quality score %')} stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="dmf"   name={tt('DMF coverage %')} stroke={GREEN} strokeWidth={2}   dot={false} strokeDasharray="4 4" />
                  <ReferenceLine y={97} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber = 97% floor for board-level KPIs')}</div>
          </Panel>

          <Panel title={tt('Freshness SLA Met — 6-month trend (%)')} insight={{ insight: 'Freshness SLA attainment has drifted below 99% in two of the last three months, correlating with volume increases in the CRM domain.', action: 'Review ingestion schedules for the CRM and billing domains and negotiate revised freshness windows with pipeline owners.', impact: 'Restoring sustained attainment above 99% is a prerequisite for the customer-facing data product tier planned for Q3.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={freshnessSla}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[97, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="met"    name={tt('SLA met %')}  stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Line type="monotone" dataKey="target" name={tt('Target 99%')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Domain Quality Scorecard — 8 domains')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Domain')}</th>
                  <th className="text-right">{tt('Tier')}</th>
                  <th className="text-right">{tt('Quality %')}</th>
                  <th className="text-right">{tt('DMF cov %')}</th>
                  <th className="text-right">{tt('Incidents')}</th>
                  <th>{tt('SLA')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuality.map(q => (
                  <tr key={q.domain} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{q.domain}</td>
                    <td className="text-right font-mono text-xs text-vfes-dark/60">{q.tier}</td>
                    <td className={`text-right font-bold ${q.score >= 97 ? 'text-emerald-600' : q.score >= 95 ? 'text-amber-600' : 'text-red-600'}`}>{q.score}%</td>
                    <td className={`text-right font-bold ${q.dmfCoverage >= 97 ? 'text-emerald-600' : 'text-amber-600'}`}>{q.dmfCoverage}%</td>
                    <td className={`text-right ${q.incidents >= 4 ? 'text-amber-600 font-bold' : 'text-vfes-dark/65'}`}>{q.incidents}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(q.sla)}`}>{tt(q.sla)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/data-quality" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Quality →')}</Link>
            <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Marketing & HR below 97% — DMF remediation in progress')}</span>
          </div>
        </Panel>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { label: tt('Freshness checks'),    count: 1284, pass: 1272, color: BLUE   },
            { label: tt('NULL / completeness'),  count:  982, pass:  968, color: GREEN  },
            { label: tt('Range / ref integrity'),count:  842, pass:  824, color: AMBER  },
            { label: tt('Schema drift checks'),  count:  428, pass:  428, color: PURPLE },
            { label: tt('Duplicate detection'),  count:  486, pass:  478, color: NAVY   },
            { label: tt('Custom SQL checks'),    count:  262, pass:  256, color: SLATE  },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-white border border-black/5 p-4">
              <div className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: c.color }}>{c.label}</div>
              <div className="text-xl font-extrabold text-vfes-dark">{c.pass.toLocaleString()}</div>
              <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('passing of ')}{c.count.toLocaleString()} · {Math.round(c.pass / c.count * 100)}%</div>
              <div className="mt-2 h-1.5 rounded-full bg-black/5">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.round(c.pass / c.count * 100)}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════ GOVERNANCE ══════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Governance coverage')}  value="94%"  delta="target 95%"       trend="up"   icon={ShieldCheck}   accent />
          <KpiCard label={tt('Active policies')}       value="8"    delta="across 4 types"    trend="flat" icon={FileCheck}          />
          <KpiCard label={tt('PII columns masked')}   value="214"  delta="auto-masked via tag" trend="flat" icon={Lock}             />
          <KpiCard label={tt('Policy breaches (7d)')} value="2"    delta="vs 5 prior week"    trend="up"   icon={AlertTriangle}      />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Policy type:')}</span>
          {['All', 'Masking', 'Row Access', 'Aggregation', 'Projection', 'Tag'].map(type => (
            <button key={type} onClick={() => setPolicyType(type)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${policyType === type ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(type)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Governance Coverage Trend — Q1-2026 → Q4-2026')} insight={{ insight: 'Coverage gained 18 points over three quarters but actual progress has decelerated below the target trajectory since Q3-2026.', action: 'Focus the next governance sprint on assigning owners to the 200 classified but unowned assets dragging the average down.', impact: 'Reaching the 95% EOY target unlocks the internal data marketplace certification programme and satisfies the regulatory audit requirement.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={governanceCovTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" name={tt('Actual %')} stroke={BLUE} strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="target" name={tt('Target %')} stroke={NAVY} strokeWidth={2}   dot={false} strokeDasharray="4 4" />
                  <ReferenceLine y={95} stroke={GREEN} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Green = 95% EOY target. Coverage = owner + classification + quality monitor.')}</div>
          </Panel>

          <Panel title={tt('Policy Registry — 8 active Horizon policies')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Policy')}</th>
                    <th>{tt('Type')}</th>
                    <th className="text-right">{tt('Tables')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map(p => (
                    <tr key={p.policy} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{p.policy}</td>
                      <td>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">{tt(p.type)}</span>
                      </td>
                      <td className="text-right font-mono">{p.tables}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(p.status)}`}>{tt(p.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Horizon Governance →')}</Link>
              <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open RBAC Explorer →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('RBAC Roles — active role inventory')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Role')}</th>
                  <th className="text-right">{tt('Grantees')}</th>
                  <th className="text-right">{tt('Objects')}</th>
                  <th>{tt('PII access')}</th>
                  <th>{tt('Elevated')}</th>
                </tr>
              </thead>
              <tbody>
                {rbacRoles.map(r => (
                  <tr key={r.role} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono text-xs">{r.role}</td>
                    <td className="text-right font-bold">{r.grantees}</td>
                    <td className="text-right font-bold">{r.objects.toLocaleString()}</td>
                    <td>
                      {r.piiAccess
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{tt('Yes')}</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 text-vfes-dark/55">{tt('No')}</span>}
                    </td>
                    <td>
                      {r.elevated
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">{tt('Flag')}</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('OK')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Full RBAC analysis & least-privilege report →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ DATA PRODUCTS ════════════════════════════════════════════ */}
      {tab === 'products' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Governed data products')} value="42"  delta="+7 this quarter"    trend="up"   icon={Boxes}         accent />
          <KpiCard label={tt('Active consumers')}        value="189" delta="across 42 products" trend="up"   icon={Server}              />
          <KpiCard label={tt('Contract breaches (7d)')} value="1"   delta="CHURN_FEATURES"     trend="down" icon={AlertTriangle}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Status:')}</span>
          {['All', 'Healthy', 'Watch'].map(s => (
            <button key={s} onClick={() => setProductStatus(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${productStatus === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <Panel title={tt('Product SLA — Healthy / Watch / Breached (6 months)')} insight={{ insight: 'Breached product SLAs rose month-on-month through Q2-2026, with the watch cohort now representing over 25% of the portfolio.', action: 'Escalate the five longest-breached products to domain leads and require remediation plans with defined timelines within one week.', impact: 'Eliminating breached products restores consumer confidence in the data marketplace and protects the Q3 adoption target.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={productSlaTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="healthy"  name={tt('Healthy')}  stackId="a" fill={GREEN}    />
                  <Bar dataKey="watch"    name={tt('Watch')}    stackId="a" fill={AMBER}    />
                  <Bar dataKey="breached" name={tt('Breached')} stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Data Product Registry — 12 products')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Product')}</th>
                  <th>{tt('Domain')}</th>
                  <th className="text-right">{tt('Consumers')}</th>
                  <th className="text-right">{tt('SLA')}</th>
                  <th>{tt('Freshness')}</th>
                  <th>{tt('Contract')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-semibold text-xs">{p.name}</td>
                    <td className="text-xs text-vfes-dark/65">{p.domain}</td>
                    <td className="text-right font-mono">{p.subs}</td>
                    <td className="text-right font-bold text-xs">{p.sla}</td>
                    <td className="text-xs font-mono">{p.freshness}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(p.contract)}`}>{tt(p.contract)}</span></td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(p.status)}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/data-products" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Products →')}</Link>
            <Link to="/portal/data-contracts" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Data Contracts →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ OBSERVABILITY ════════════════════════════════════════════ */}
      {tab === 'observability' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Pipeline SLA')}       value="99.8%"  delta="all 3 layers"     trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Freshness SLA met')}  value="99.1%"  delta="above 99% target" trend="up"   icon={FileCheck}         />
          <KpiCard label={tt('Active pipelines')}   value="8"      delta="+ 38 tasks/sprocs" trend="up"   icon={GitBranch}         />
          <KpiCard label={tt('Failed tasks (24h)')} value="3"      delta="-5 vs 7d average"  trend="up"   icon={AlertTriangle}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Layer Availability — ingestion · transform · serving (24h %)')} insight={{ insight: 'The daily 08:00 transform dip pulls availability below the 99% SLA floor consistently, driven by a peak batch scheduling conflict.', action: 'Stagger the morning batch window by 90 minutes and apply an auto-scaling rule to the transform layer to absorb the load spike.', impact: 'Eliminating the daily availability breach removes the leading cause of consumer-reported data delay tickets.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={pipelineHealth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[98, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ingestion" name={tt('Ingestion')} stroke={BLUE}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="transform" name={tt('Transform')} stroke={AMBER} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="serving"   name={tt('Serving')}   stroke={GREEN} strokeWidth={2} dot={false} />
                  <ReferenceLine y={99} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 99% SLA floor. 08:00 dip driven by batch transform peak load.')}</div>
          </Panel>

          <Panel title={tt('Freshness SLA Met — 6-month trend (%)')} insight={{ insight: 'Pipeline freshness attainment is stable above 98% but the margin to the 99% target narrows each month as pipeline count grows.', action: 'Introduce adaptive scheduling for the five highest-volume pipelines to absorb load spikes without breaching the freshness window.', impact: 'Reaching sustained 99% attainment satisfies the freshness clause in the enterprise data contract framework due for renewal in Q4.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={freshnessSla}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[97, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="met"    name={tt('SLA met %')}  stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Line type="monotone" dataKey="target" name={tt('Target 99%')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Active Pipelines & Tasks — live status')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Pipeline')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Freshness SLA')}</th>
                  <th>{tt('Last run')}</th>
                  <th className="text-right">{tt('SLA %')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {activePipelines.map(p => (
                  <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold">{p.name}</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">{tt(p.type)}</span></td>
                    <td className="text-xs font-mono">{p.freshness}</td>
                    <td className="text-xs text-vfes-dark/55">{p.lastRun} ago</td>
                    <td className={`text-right font-bold text-xs ${p.sla >= 99 ? 'text-emerald-600' : p.sla >= 97 ? 'text-amber-600' : 'text-red-600'}`}>{p.sla}%</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(p.status)}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Observability →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ COST & STORAGE ════════════════════════════════════════════ */}
      {tab === 'cost' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total storage')}         value="78 TB"  delta="+7% MoM"      trend="down" icon={HardDrive}  accent />
          <KpiCard label={tt('Monthly compute ($K)')}  value="$38.2K" delta="+4.1% MoM"    trend="flat" icon={Server}          />
          <KpiCard label={tt('Storage cost ($K)')}     value="$20.8K" delta="+3.3% MoM"    trend="down" icon={TrendingUp}      />
          <KpiCard label={tt('Time-travel TB')}        value="14.2"   delta="under review"  trend="flat" icon={Activity}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Storage Breakdown by Domain (TB)')} insight={{ insight: 'Two domains hold over half of total storage, suggesting disproportionate retention and absence of lifecycle policy enforcement.', action: 'Apply storage lifecycle archival policies to the two largest domains, expiring data beyond the agreed retention window immediately.', impact: 'Active lifecycle enforcement is projected to cut storage spend by 20% and satisfies data minimisation obligations under the privacy programme.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={storageBreakdown} dataKey="tb" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {storageBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v} TB`, '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Monthly Spend — storage vs compute ($K)')} insight={{ insight: 'Compute costs are growing at twice the rate of storage costs, indicating query-heavy patterns driven by repeated analytical scans.', action: 'Identify the top 20 compute-intensive repeated queries and materialise their results as cached data products to eliminate redundant scans.', impact: 'Shifting repeated workloads to pre-materialised products can reduce monthly compute spend by an estimated 15-20%.' }}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={costTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="storage" name={tt('Storage $K')} stackId="a" fill={BLUE} />
                    <Bar dataKey="compute" name={tt('Compute $K')} stackId="a" fill={NAVY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-[#11567F]/8 to-transparent border border-[#11567F]/20 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-[#11567F] mb-1">{tt('Cost Intelligence')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Warehouse credits, time-travel waste, storage lifecycle policies and per-team chargeback in the full Cost platform.')}
            </div>
          </div>
          <Link to="/portal/cost" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <HardDrive className="w-4 h-4" />{tt('Open Cost Intelligence →')}
          </Link>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Top storage consumers')}</div>
            {[
              { name: 'RAN_CELL_TELEMETRY',   tb: 24.2 }, { name: 'BILLING_EVENTS_RAW', tb: 18.4 },
              { name: 'CUSTOMER_MASTER',       tb: 10.8 }, { name: 'NETWORK_KPI_HISTORY', tb:  8.6 },
              { name: 'CAMPAIGN_HISTORY',      tb:  6.2 }, { name: 'FRAUD_LOG_ARCHIVE',   tb:  3.8 },
            ].map(t => (
              <div key={t.name} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                <span className="font-mono text-xs">{t.name}</span>
                <span className="font-bold text-xs text-vfes-dark">{t.tb} TB</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Storage optimisation opportunities')}</div>
            {[
              { rec: 'Set 30-day time-travel on RAW tables', saving: '$2.4K/mo'  },
              { rec: 'Convert BILLING_EVENTS_RAW to Iceberg', saving: '$1.8K/mo' },
              { rec: 'Add lifecycle expiry — CAMPAIGN_HISTORY', saving: '$0.9K/mo' },
              { rec: 'Move fraud logs to COLD storage tier',  saving: '$0.6K/mo'  },
            ].map(r => (
              <div key={r.rec} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                <span className="text-xs text-vfes-dark/75">{tt(r.rec)}</span>
                <span className="font-bold text-xs text-emerald-600">{r.saving}</span>
              </div>
            ))}
            <div className="mt-2 text-[10px] text-vfes-dark/40">
              <Link to="/portal/iceberg" className="font-bold text-vfes-dark hover:underline">{tt('Explore Iceberg migration →')}</Link>
            </div>
          </div>
        </div>
      </>)}
    </div>
  )
}
