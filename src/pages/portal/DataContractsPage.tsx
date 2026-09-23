import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3756)
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  FileText, GitBranch, AlertTriangle, CheckCircle2, Smartphone,
  Shield, Clock, Database, Users, Bell, Activity, TrendingUp, Eye, Layers,
} from 'lucide-react'
import { MOBILE_CONTRACTS } from './_mobile_data'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine, ComposedChart, Cell, PieChart, Pie,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const CONTRACTS = [
  { c: 'CUSTOMER_360_CONTRACT_v3',     producer: 'Customer DE', consumer: '14 teams',   sla: '03:30 UTC', schema_v: 'v3.4', last_break: 'none',          state: 'active', sla_met: 99.8, consumers_count: 14, criticality: 'critical' },
  { c: 'CHURN_LIST_DAILY_CONTRACT_v2', producer: 'ML platform', consumer: 'CRM, BI, App', sla: '07:00 UTC', schema_v: 'v2.1', last_break: '142 days ago', state: 'active', sla_met: 99.4, consumers_count: 8,  criticality: 'high' },
  { c: 'B2B_360_CONTRACT_v2',          producer: 'B2B DE',      consumer: '8 teams',    sla: '04:00 UTC', schema_v: 'v2.0', last_break: 'none',          state: 'active', sla_met: 99.9, consumers_count: 8,  criticality: 'high' },
  { c: 'NETWORK_KPI_CONTRACT_v4',      producer: 'Network DE',  consumer: 'NOC, ML',    sla: 'live · 5m', schema_v: 'v4.0', last_break: 'none',          state: 'active', sla_met: 99.6, consumers_count: 4,  criticality: 'critical' },
  { c: 'PEOPLE_360_CONTRACT_v1',       producer: 'People DE',   consumer: '4 teams',    sla: '05:00 UTC', schema_v: 'v1.2', last_break: 'none',          state: 'active', sla_met: 99.9, consumers_count: 4,  criticality: 'medium' },
  { c: 'EXEC_360_CONTRACT_v2',         producer: 'Finance DE',  consumer: 'CFO, CEO',   sla: '06:00 UTC', schema_v: 'v2.0', last_break: '14 days ago',   state: 'active', sla_met: 98.1, consumers_count: 6,  criticality: 'critical' },
  { c: 'PRODUCT_360_CONTRACT_v2',      producer: 'Product DE',  consumer: '6 teams',    sla: '03:30 UTC', schema_v: 'v2.0', last_break: 'none',          state: 'active', sla_met: 99.7, consumers_count: 6,  criticality: 'high' },
  { c: 'CMTS_EVENTS_CONTRACT_v6',      producer: 'Network Eng', consumer: 'Network DE', sla: 'live',      schema_v: 'v6.2', last_break: '3 days ago',    state: 'active', sla_met: 97.4, consumers_count: 2,  criticality: 'medium' },
]

const BREAKS_EXTENDED = [
  { d: '2025-05-21', contract: 'EXEC_360_CONTRACT_v2',         change: 'column TOTAL_REV → REVENUE_TOTAL', producer: 'Finance DE',  impact: '4 BI dashboards',       resolution: 'view shim deployed · backfilled v3 in dev', impactScore: 80, breaking: true  },
  { d: '2025-05-19', contract: 'CMTS_EVENTS_CONTRACT_v6',      change: 'enum value SET_TOP added',          producer: 'Network Eng', impact: 'AI_CLASSIFY model',      resolution: 'retraining triggered',                      impactScore: 40, breaking: false },
  { d: '2025-05-14', contract: 'NETWORK_KPI_CONTRACT_v4',      change: 'freshness SLA miss · +12 min',      producer: 'Network DE',  impact: 'NOC dashboards delayed', resolution: 'pipeline optimised',                         impactScore: 60, breaking: false },
  { d: '2024-12-30', contract: 'CHURN_LIST_DAILY_CONTRACT_v2', change: 'column types changed',              producer: 'ML platform', impact: '2 CRM syncs',            resolution: 'fixed · contract bumped v2.1',               impactScore: 35, breaking: true  },
  { d: '2024-11-08', contract: 'B2B_360_CONTRACT_v2',          change: 'row_count drop −22% vs T-1',        producer: 'B2B DE',      impact: 'B2B forecasting model',  resolution: 'upstream pipeline bug fixed',                impactScore: 55, breaking: false },
]

const SLA_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  met: parseFloat((99.2 + scenarioRandom() * 0.7 - (i % 7 === 0 ? 0.8 : 0)).toFixed(2)),
  target: 99.5,
}))

const BREACH_TREND_MONTHLY = [
  { m: 'Jan', breaches: 4, resolved: 4, open: 0 },
  { m: 'Feb', breaches: 2, resolved: 2, open: 0 },
  { m: 'Mar', breaches: 5, resolved: 4, open: 1 },
  { m: 'Apr', breaches: 3, resolved: 3, open: 0 },
  { m: 'May', breaches: 3, resolved: 2, open: 1 },
  { m: 'Jun', breaches: 1, resolved: 0, open: 1 },
]

const SLA_BAR = CONTRACTS.map(c => ({ contract: c.c.replace('_CONTRACT_v', ' v'), sla_met: c.sla_met, target: 99.5 }))

const VERSION_HISTORY = [
  { contract: 'CUSTOMER_360_CONTRACT_v3',     from_v: 'v3.3', to_v: 'v3.4', date: '2025-04-12', type: 'minor', change: 'added CLV_SEGMENT column',              breaking: false, migration: 'backfill complete' },
  { contract: 'CUSTOMER_360_CONTRACT_v3',     from_v: 'v3.2', to_v: 'v3.3', date: '2025-01-08', type: 'minor', change: 'FTTH_FLAG boolean added',               breaking: false, migration: 'default FALSE' },
  { contract: 'EXEC_360_CONTRACT_v2',         from_v: 'v1.x', to_v: 'v2.0', date: '2024-11-01', type: 'major', change: 'rename TOTAL_REV → REVENUE_TOTAL',      breaking: true,  migration: 'view shim + 90d deprecation' },
  { contract: 'CHURN_LIST_DAILY_CONTRACT_v2', from_v: 'v2.0', to_v: 'v2.1', date: '2024-12-30', type: 'patch', change: 'type fix CHURN_SCORE FLOAT→NUMBER(5,4)', breaking: false, migration: 'auto-cast applied' },
  { contract: 'NETWORK_KPI_CONTRACT_v4',      from_v: 'v3.x', to_v: 'v4.0', date: '2024-09-15', type: 'major', change: 'added RAN_REGION + 14 new cols',         breaking: true,  migration: '90d overlap window' },
  { contract: 'CMTS_EVENTS_CONTRACT_v6',      from_v: 'v6.1', to_v: 'v6.2', date: '2025-05-10', type: 'minor', change: 'enum SET_TOP added to DEVICE_TYPE',      breaking: false, migration: 'consumers notified' },
  { contract: 'PRODUCT_360_CONTRACT_v2',      from_v: 'v1.x', to_v: 'v2.0', date: '2025-02-20', type: 'major', change: 'product_id type VARCHAR→UUID',            breaking: true,  migration: 'cast function provided' },
  { contract: 'B2B_360_CONTRACT_v2',          from_v: 'v1.4', to_v: 'v2.0', date: '2024-08-01', type: 'major', change: 'B2B_SEGMENT new dimension table',         breaking: false, migration: 'additive change' },
]

const ENFORCEMENT_POLICIES = [
  { id: 'EP-001', name: 'Breaking change notification',    trigger: 'schema major bump',       action: 'notify all consumers · 90d deprecation window', state: 'active', contracts: 8 },
  { id: 'EP-002', name: 'SLA breach auto-alert',           trigger: 'freshness > SLA + 30 min', action: 'PagerDuty P2 · Slack #data-oncall',             state: 'active', contracts: 8 },
  { id: 'EP-003', name: 'Row count anomaly detection',     trigger: 'Δ vs T-1 > ±15%',         action: 'PagerDuty P3 · hold consumer pipelines',        state: 'active', contracts: 6 },
  { id: 'EP-004', name: 'Schema drift CI check',           trigger: 'dbt manifest diff',        action: 'block merge if contract columns removed',       state: 'active', contracts: 8 },
  { id: 'EP-005', name: 'Consumer onboarding gate',        trigger: 'new consumer request',     action: 'require contract signature + steward approval', state: 'active', contracts: 8 },
  { id: 'EP-006', name: 'Deprecation countdown alerts',    trigger: '30/14/7d before EOL',      action: 'email + Slack to all registered consumers',     state: 'active', contracts: 3 },
  { id: 'EP-007', name: 'PII column access control',       trigger: 'contract with pii: true',  action: 'force masking policy attachment in Horizon',    state: 'active', contracts: 4 },
  { id: 'EP-008', name: 'Autonomous contract test runner', trigger: 'every 15 min (DMF)',       action: 'run quality suite · open INC on failure',       state: 'draft',  contracts: 5 },
]

const PRODUCER_HEALTH = [
  { team: 'Customer DE', domain: 'CRM', contracts: 1, sla_avg: 99.8, breaks_90d: 0, coverage: '100%', lag_p95: 2,  status: 'green' },
  { team: 'ML platform',  domain: 'AI',  contracts: 1, sla_avg: 99.4, breaks_90d: 1, coverage: '97%',  lag_p95: 6,  status: 'amber' },
  { team: 'B2B DE',       domain: 'B2B', contracts: 1, sla_avg: 99.9, breaks_90d: 1, coverage: '100%', lag_p95: 3,  status: 'green' },
  { team: 'Network DE',   domain: 'Net', contracts: 1, sla_avg: 99.6, breaks_90d: 1, coverage: '98%',  lag_p95: 4,  status: 'amber' },
  { team: 'People DE',    domain: 'HR',  contracts: 1, sla_avg: 99.9, breaks_90d: 0, coverage: '100%', lag_p95: 5,  status: 'green' },
  { team: 'Finance DE',   domain: 'Fin', contracts: 1, sla_avg: 98.1, breaks_90d: 1, coverage: '96%',  lag_p95: 8,  status: 'red'   },
  { team: 'Product DE',   domain: 'Prd', contracts: 1, sla_avg: 99.7, breaks_90d: 0, coverage: '99%',  lag_p95: 2,  status: 'green' },
  { team: 'Network Eng',  domain: 'Net', contracts: 1, sla_avg: 97.4, breaks_90d: 1, coverage: '93%',  lag_p95: 18, status: 'red'   },
]

const CONSUMER_DEPS = [
  { consumer: 'PowerBI Exec Dashboard', contract: 'EXEC_360_CONTRACT_v2',         type: 'BI',  criticality: 'critical', team: 'BI Platform',   notif: 'yes', last_access: 'today'  },
  { consumer: 'CHURN_AGENT (Cortex)',   contract: 'CUSTOMER_360_CONTRACT_v3',      type: 'AI',  criticality: 'critical', team: 'AI Platform',   notif: 'yes', last_access: 'today'  },
  { consumer: 'Salesforce Rev-ETL',     contract: 'CUSTOMER_360_CONTRACT_v3',      type: 'ETL', criticality: 'high',     team: 'RevOps',        notif: 'yes', last_access: 'today'  },
  { consumer: 'B2B Forecasting Model',  contract: 'B2B_360_CONTRACT_v2',           type: 'ML',  criticality: 'high',     team: 'B2B Analytics', notif: 'yes', last_access: 'today'  },
  { consumer: 'NOC Dashboard',          contract: 'NETWORK_KPI_CONTRACT_v4',       type: 'BI',  criticality: 'critical', team: 'NOC',           notif: 'yes', last_access: 'today'  },
  { consumer: 'CRM Churn Score Sync',   contract: 'CHURN_LIST_DAILY_CONTRACT_v2',  type: 'ETL', criticality: 'high',     team: 'CRM Ops',       notif: 'yes', last_access: 'today'  },
  { consumer: 'AI_CLASSIFY (Network)',  contract: 'CMTS_EVENTS_CONTRACT_v6',       type: 'AI',  criticality: 'medium',   team: 'AI Platform',   notif: 'no',  last_access: '2d ago' },
  { consumer: 'Procurement BI',         contract: 'PRODUCT_360_CONTRACT_v2',       type: 'BI',  criticality: 'medium',   team: 'Procurement',   notif: 'yes', last_access: '3d ago' },
  { consumer: 'HR Attrition Model',     contract: 'PEOPLE_360_CONTRACT_v1',        type: 'ML',  criticality: 'low',      team: 'People Ops',    notif: 'yes', last_access: 'today'  },
  { consumer: 'CFO Live Summary Agent', contract: 'EXEC_360_CONTRACT_v2',          type: 'AI',  criticality: 'critical', team: 'CFO office',    notif: 'yes', last_access: 'today'  },
]

const PRODUCER_LAG_CHART = PRODUCER_HEALTH.map(p => ({ team: p.team.replace(' DE', '').replace(' Eng', ''), lag: p.lag_p95, sla: 10 }))

const CONTRACT_STATUS_PIE = [
  { name: 'Critical', value: 3, color: '#ef4444' },
  { name: 'High',     value: 3, color: AMBER },
  { name: 'Medium',   value: 2, color: BLUE },
]

const CONSUMER_TYPE_PIE = [
  { name: 'BI / Dashboard', value: 3, color: BLUE   },
  { name: 'AI / Agent',     value: 3, color: PURPLE  },
  { name: 'ETL / Sync',     value: 2, color: GREEN   },
  { name: 'ML Model',       value: 2, color: AMBER   },
]

const VERSION_TYPE_CHART = [
  { c: 'C360',    major: 0, minor: 2, patch: 1 },
  { c: 'EXEC360', major: 1, minor: 0, patch: 0 },
  { c: 'CHURN',   major: 0, minor: 0, patch: 1 },
  { c: 'NETW',    major: 1, minor: 0, patch: 0 },
  { c: 'CMTS',    major: 0, minor: 1, patch: 0 },
  { c: 'PROD360', major: 1, minor: 0, patch: 0 },
  { c: 'B2B360',  major: 1, minor: 1, patch: 0 },
]

const SAMPLE_CONTRACT = `# customer_360_contract.yaml
contract: CUSTOMER_360_CONTRACT
version: v3.4
producer:
  team: Customer DE
  steward: anna.janssens@example.com
producer_object: CBL_ANALYTICS.CUSTOMER.CUSTOMER_360
consumers:
  - PowerBI · Exec dashboard
  - CHURN_AGENT
  - Reverse-ETL → Salesforce
sla:
  freshness: '03:30 UTC daily'
  availability: 99.9%
  retention: 730d
schema:
  - name: CUSTOMER_ID    type: VARCHAR(64)  required: true  pii: false
  - name: EMAIL          type: VARCHAR(255) required: true  pii: true  masking: mask_email_v2
  - name: CHURN_RISK_30D type: NUMBER(5,4)  required: true  pii: false
  - name: CLV_36M        type: NUMBER(10,2) required: true  pii: false
  ... (10 more)
quality_rules:
  - not_null(CUSTOMER_ID, EMAIL, CHURN_RISK_30D)
  - unique(CUSTOMER_ID)
  - row_count_delta_vs_yesterday > -10%
  - freshness < 30 min after SLA
versioning:
  breaking: SemVer major
  deprecation_window: 90 days
  notification: '#data-platform + email all consumers'`

type TabId = 'overview' | 'registry' | 'sla' | 'violations' | 'versioning' | 'enforcement' | 'producers' | 'consumers'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',          icon: Activity    },
  { id: 'registry',    label: 'Contract registry', icon: Database    },
  { id: 'sla',         label: 'SLA adherence',     icon: Clock       },
  { id: 'violations',  label: 'Violations',         icon: AlertTriangle },
  { id: 'versioning',  label: 'Versioning',         icon: GitBranch   },
  { id: 'enforcement', label: 'Enforcement',        icon: Shield      },
  { id: 'producers',   label: 'Producers',          icon: Layers      },
  { id: 'consumers',   label: 'Consumers',          icon: Users       },
]

export default function DataContractsPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [filterCrit, setFilterCrit] = useState<string>('all')
  const [sortCol, setSortCol] = useState<'sla_met' | 'consumers_count'>('sla_met')
  const [versionFilter, setVersionFilter] = useState<'all' | 'major' | 'minor' | 'patch'>('all')
  const [producerDomain, setProducerDomain] = useState<string>('all')
  const [consumerTypeFilter, setConsumerTypeFilter] = useState<string>('all')
  const [slaWindow, setSlaWindow] = useState<7 | 14 | 30>(30)

  const sortedContracts = useMemo(
    () => [...CONTRACTS].sort((a, b) => b[sortCol] - a[sortCol]),
    [sortCol],
  )

  const filteredContracts = useMemo(
    () => filterCrit === 'all' ? sortedContracts : sortedContracts.filter(c => c.criticality === filterCrit),
    [filterCrit, sortedContracts],
  )

  const breachRateFiltered = useMemo(
    () => BREAKS_EXTENDED.filter(b => filterCrit === 'all' || CONTRACTS.find(c => c.c === b.contract)?.criticality === filterCrit),
    [filterCrit],
  )

  const filteredVersionHistory = useMemo(
    () => versionFilter === 'all' ? VERSION_HISTORY : VERSION_HISTORY.filter(v => v.type === versionFilter),
    [versionFilter],
  )

  const filteredProducers = useMemo(
    () => producerDomain === 'all' ? PRODUCER_HEALTH : PRODUCER_HEALTH.filter(p => p.status === producerDomain),
    [producerDomain],
  )

  const filteredConsumers = useMemo(
    () => consumerTypeFilter === 'all' ? CONSUMER_DEPS : CONSUMER_DEPS.filter(c => c.type === consumerTypeFilter),
    [consumerTypeFilter],
  )

  const slaTrendSlice = useMemo(
    () => SLA_TREND.slice(SLA_TREND.length - slaWindow),
    [slaWindow],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Data contracts')}
        subtitle={tt('Producer ↔ consumer contracts · schema versioning · breaking-change governance')}
        actions={
          <Link to="/portal/data-quality" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <Shield className="w-4 h-4" /> {tt('Data Quality')}
          </Link>
        }
      />

      {/* ── ML / AI section ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Contract intelligence"
        models={[
          { name: 'SLA Breach Predictor',     metric: 'AUC 0.94', sub: '24h advance warning · 8 contracts' },
          { name: 'Schema Drift Detector',    metric: 'F1 0.92',  sub: 'breaking vs non-breaking classifier' },
          { name: 'Consumer Impact Ranker',   metric: 'NDCG 0.88',sub: 'downstream blast-radius scoring' },
        ]}
        agentLabel={tt('Run Contract Compliance Scan')}
        agentRunningLabel={tt('Scanning contracts…')}
        agentSteps={[
          tt('Loaded contract registry · 8 active contracts · 142 consumers'),
          tt('Checked schema diffs against dbt manifest snapshot'),
          tt('Scored SLA breach probability for next 7 days per contract'),
          tt('Ranked consumer impact by dependency depth × criticality'),
        ]}
        agentBlurb={tt('Snowflake lineage + contract YAML gives the AI full producer↔consumer graph so breach predictions factor in downstream blast radius.')}
        decision={{
          title: tt('Pre-emptively bump CMTS_EVENTS_CONTRACT to v7.0 with a 90d deprecation'),
          detail: tt('Schema drift model detects the CMTS events enum expanding again in network Eng dev branch. Getting ahead with a versioned contract protects the AI_CLASSIFY consumer from silent failures.'),
          impact: tt('prevents AI model silent failure · zero unplanned consumer downtime'),
          risk: tt('Network Eng dev branch must freeze enum before GA'),
          linkTo: '/portal/data-contracts',
          linkLabel: tt('Open contract diff →'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Contract SLA adherence · last 30 days (%)'),
          xKey: 'contract',
          unit: '%',
          data: SLA_BAR.map(s => ({ contract: s.contract.slice(0, 12), sla_met: s.sla_met })),
          series: [{ key: 'sla_met', name: tt('SLA met %'), color: BLUE }],
          colorBy: { key: 'sla_met', high: 99.5, mid: 98.0 },
          note: tt('Anything below 99.5% triggers a P3 PagerDuty alert.'),
        }}
        registryNote={tt('Models trained on contract registry + Snowflake lineage graph. Served from ML Registry. Features from Feature Store.')}
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

      {/* ══════════════ OVERVIEW ═════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active contracts')}       value="8"     delta={tt('all systems')}          trend="up"   icon={FileText}     accent />
          <KpiCard label={tt('Active consumers')}       value="142"   delta="+8 QoQ"                    trend="up"   icon={Users}        />
          <KpiCard label={tt('SLA met 30d (avg)')}      value="99.1%" delta={tt('target 99.5%')}        trend="up"   icon={Clock}        />
          <KpiCard label={tt('Breaks 90d')}             value="5"     delta={tt('2 breaking changes')}  trend="down" icon={AlertTriangle} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg deprecation window')} value="90 d"  delta={tt('SemVer major only')}   trend="flat" icon={Bell}         />
          <KpiCard label={tt('Schema versions tracked')} value="34"   delta="+6 QoQ"                    trend="up"   icon={GitBranch}    />
          <KpiCard label={tt('Enforcement policies')}   value="8"     delta={tt('7 active')}            trend="up"   icon={Shield}       />
          <KpiCard label={tt('PII columns protected')}  value="24"    delta={tt('masking enforced')}    trend="up"   icon={Eye}          />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-8">
            <Panel title={tt('SLA adherence trend · 30 days (%)')}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={slaTrendSlice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={Math.ceil(slaWindow / 7)} />
                  <YAxis domain={[97, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={99.5} stroke={GREEN} strokeDasharray="3 3" label={{ value: 'SLO 99.5%', fontSize: 9, fill: GREEN }} />
                  <Line type="monotone" dataKey="met"    name={tt('SLA met %')} stroke={BLUE}  strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-4 space-y-4">
            <Panel title={tt('Criticality breakdown')}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={CONTRACT_STATUS_PIE} dataKey="value" innerRadius={35} outerRadius={58} paddingAngle={3}>
                    {CONTRACT_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-6">
            <Panel title={tt('Breach frequency · monthly (all contracts)')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={BREACH_TREND_MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="breaches" name={tt('Breaches')}  fill={AMBER}     radius={[3,3,0,0]} />
                  <Bar dataKey="resolved" name={tt('Resolved')}  fill={GREEN}     radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Consumer mix by type')}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={CONSUMER_TYPE_PIE} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {CONSUMER_TYPE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <FileText className="w-3 h-3" />
          {tt('source: tln-data-contracts repo · contract registry · schema diff via dbt manifest')} ·
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
        </div>
        <div className="mt-2 text-[10px] text-vfes-dark/35 uppercase tracking-widest">
          {tt('Contract registry synced from tln-data-contracts GitHub repo via Snowflake Git integration · refreshed on every PR merge · schema diffs via dbt manifest comparison')}
        </div>

        <div className="mt-4">
          <Panel title={tt('Related Snowflake governance pages')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: '/portal/data-quality',   label: tt('Data Quality'),    desc: tt('DMF coverage · freshness · incidents')          },
                { to: '/portal/semantic-views',  label: tt('Semantic Views'),   desc: tt('Cortex Analyst · metrics · VQRs')               },
                { to: '/portal/lineage',         label: tt('Lineage'),          desc: tt('Upstream / downstream impact graph')            },
                { to: '/portal/catalog',         label: tt('Catalog'),          desc: tt('Object browser · column search · tags')         },
                { to: '/portal/horizon',         label: tt('Horizon'),          desc: tt('Governance policies · PII masking · access')    },
                { to: '/portal/rbac',            label: tt('RBAC'),             desc: tt('Role hierarchy · consumer gating')              },
                { to: '/portal/observability',   label: tt('Observability'),    desc: tt('Pipeline health · SLA monitoring')              },
                { to: '/portal/data-engineering',label: tt('Data Engineering'), desc: tt('dbt · pipelines · medallion architecture')     },
              ].map(l => (
                <Link key={l.to} to={l.to}
                  className="p-3 border border-black/5 rounded-xl hover:border-vfes-red/30 hover:bg-vfes-red/5 transition group">
                  <div className="text-[11px] font-bold text-vfes-dark group-hover:text-vfes-dark">{l.label}</div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">{l.desc}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-2 rounded-xl bg-gradient-to-br from-vfes-red/5 to-transparent border border-vfes-red/10 p-3 flex items-center justify-between">
          <div className="text-[11px] text-vfes-dark/65">{tt('New contract requests · steward approval workflow · managed in tln-data-contracts repo.')}</div>
          <Link to="/portal/cdo" className="text-[10px] font-bold text-vfes-dark hover:underline shrink-0 ml-4">{tt('CDO dashboard →')}</Link>
        </div>
      </>)}

      {/* ══════════════ REGISTRY ═════════════════════════════════════════════ */}
      {tab === 'registry' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Criticality:')}</span>
          {['all', 'critical', 'high', 'medium'].map(c => (
            <button key={c} onClick={() => setFilterCrit(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${filterCrit === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(c)}
            </button>
          ))}
          <span className="ml-4 text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['sla_met', 'consumers_count'] as const).map(k => (
            <button key={k} onClick={() => setSortCol(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sortCol === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'sla_met' ? tt('SLA met') : tt('Consumers')}
            </button>
          ))}
        </div>

        <Panel title={tt('Active contracts · contract registry')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Contract')}</th>
                <th className="text-left">{tt('Producer')}</th>
                <th className="text-left">{tt('Consumers')}</th>
                <th className="text-left">{tt('SLA')}</th>
                <th className="text-left">{tt('Schema v')}</th>
                <th className="text-right">{tt('SLA met %')}</th>
                <th className="text-left">{tt('Last break')}</th>
                <th className="text-left">{tt('Criticality')}</th>
                <th className="text-left">{tt('State')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.c} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{c.c}</td>
                  <td className="text-[11px]">{c.producer}</td>
                  <td className="text-[11px]">{c.consumer}</td>
                  <td className="font-mono text-[10px]">{c.sla}</td>
                  <td className="font-mono text-[10px]">{c.schema_v}</td>
                  <td className={`text-right font-bold font-mono text-[11px] ${c.sla_met >= 99.5 ? 'text-emerald-600' : c.sla_met >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{c.sla_met}%</td>
                  <td className={`text-[10px] ${c.last_break === 'none' ? 'text-emerald-600' : 'text-amber-600'}`}>{c.last_break}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.criticality === 'critical' ? 'bg-red-100 text-red-700' : c.criticality === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(c.criticality)}</span>
                  </td>
                  <td><span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{tt(c.state)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Mobile / RAN contracts')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('7 mobile contracts · 6 active')}</span>}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('ID')}</th><th>{tt('Producer')}</th><th>{tt('Consumer')}</th>
                  <th>{tt('Dataset')}</th><th>{tt('SLA')}</th><th>{tt('Breaches (30d)')}</th><th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_CONTRACTS.map((c) => (
                  <tr key={c.id} className="border-t border-black/5">
                    <td className="py-2 font-mono text-xs">{c.id}</td>
                    <td className="text-[11px]">{tt(c.producer)}</td>
                    <td className="text-[11px]">{tt(c.consumer)}</td>
                    <td className="font-mono text-xs">{c.dataset}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(c.sla)}</td>
                    <td className={`font-mono text-xs font-bold ${c.breaches30d === 0 ? 'text-emerald-600' : c.breaches30d <= 1 ? 'text-amber-600' : 'text-red-600'}`}>{c.breaches30d}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(c.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('CTR-MOB-006 (SIM_SWAP_REQUESTS) under review — 2 breaches in 30d due to surge after Benchmark B port-out wave.')}</div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
          <Link to="/portal/data-products" className="text-vfes-dark hover:underline">{tt('Data products →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Contract SLA vs consumer count · scatter view')}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={CONTRACTS.map(c => ({ name: c.c.slice(0,12), sla: c.sla_met, consumers: c.consumers_count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="l" domain={[96, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="sla" name={tt('SLA met %')} fill={BLUE} radius={[3,3,0,0]}>
                  {CONTRACTS.map((c, i) => <Cell key={i} fill={c.sla_met >= 99.5 ? GREEN : c.sla_met >= 98 ? AMBER : '#ef4444'} />)}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="consumers" name={tt('Consumers')} stroke={PURPLE} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Bars = SLA met % (left axis) · Line = consumer count (right axis). EXEC_360 has most consumers and is below SLO — highest risk.')}</div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Breach cumulative trend · 6 months (area)')}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={BREACH_TREND_MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="breaches" name={tt('Breaches')} stroke={AMBER} fill={AMBER} fillOpacity={0.25} />
                <Area type="monotone" dataKey="resolved" name={tt('Resolved')} stroke={GREEN} fill={GREEN} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ SLA ADHERENCE ════════════════════════════════════════ */}
      {tab === 'sla' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SLA met 30d (avg)')}    value="99.1%"  delta={tt('target 99.5%')}     trend="up"   icon={Clock}        accent />
          <KpiCard label={tt('Contracts above SLO')}  value="6 / 8" delta={tt('C360 · B2B · Net · People · Product · Churn')} trend="up" icon={CheckCircle2} />
          <KpiCard label={tt('Max SLA miss')}          value="+8 min" delta="CMTS_EVENTS · 3d ago"   trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('P95 producer lag')}      value="8 min"  delta="Finance DE · 4 contracts" trend="down" icon={TrendingUp}  />
        </div>

        <Panel title={tt('SLA adherence by contract (%) · 30-day average')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SLA_BAR} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[96, 100]} unit="%" />
              <YAxis type="category" dataKey="contract" tick={{ fontSize: 9 }} width={220} />
              <Tooltip contentStyle={TS} />
              <ReferenceLine x={99.5} stroke={GREEN} strokeDasharray="3 3" />
              <Bar dataKey="sla_met" name={tt('SLA met %')} radius={[0,4,4,0]}>
                {SLA_BAR.map((s, i) => <Cell key={i} fill={s.sla_met >= 99.5 ? GREEN : s.sla_met >= 98 ? AMBER : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/45 mt-2 uppercase tracking-widest">{tt('Green threshold = 99.5% · EXEC_360 and CMTS_EVENTS below target')}</div>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-8">
            <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Window:')}</span>
          {([7, 14, 30] as const).map(w => (
            <button key={w} onClick={() => setSlaWindow(w)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${slaWindow === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(`${w}d`)}
            </button>
          ))}
        </div>

        <Panel title={tt('SLA adherence trend · selected window (%)')}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={SLA_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis domain={[97, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={99.5} stroke={GREEN} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="met" name={tt('SLA met %')} stroke={BLUE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-4">
            <Panel title={tt('Producer P95 lag (min)')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={PRODUCER_LAG_CHART}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={10} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="lag" name={tt('P95 lag min')} radius={[3,3,0,0]}>
                    {PRODUCER_LAG_CHART.map((p, i) => <Cell key={i} fill={p.lag >= 10 ? '#ef4444' : p.lag >= 6 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('SLA freshness detail by contract')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Contract')}</th>
                  <th className="text-left">{tt('SLA window')}</th>
                  <th className="text-right">{tt('SLA met %')}</th>
                  <th className="text-right">{tt('P95 lag')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {CONTRACTS.map((c) => (
                  <tr key={c.c} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{c.c.replace('_CONTRACT_v', ' v')}</td>
                    <td className="text-[11px] text-vfes-dark/65">{c.sla}</td>
                    <td className={`text-right font-bold font-mono ${c.sla_met >= 99.5 ? 'text-emerald-600' : c.sla_met >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{c.sla_met}%</td>
                    <td className="text-right font-mono text-[11px]">{PRODUCER_HEALTH.find(p => p.team === c.producer)?.lag_p95 ?? '—'} min</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.sla_met >= 99.5 ? 'bg-emerald-100 text-emerald-700' : c.sla_met >= 98 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {tt(c.sla_met >= 99.5 ? 'met' : c.sla_met >= 98 ? 'watch' : 'breach')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ VIOLATIONS ══════════════════════════════════════════ */}
      {tab === 'violations' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Breaks 90d')}           value="5"     delta={tt('2 breaking schema changes')} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Avg resolution time')}  value="4.2h"  delta="-1.8h QoQ"                       trend="up"   icon={Clock}         />
          <KpiCard label={tt('Breaking changes')}     value="2"     delta="EXEC_360 · PROD_360"             trend="down" icon={GitBranch}     />
          <KpiCard label={tt('Consumers impacted')}   value="12"    delta="90-day total"                    trend="down" icon={Users}         />
        </div>

        <Panel title={tt('Breach log · all contracts (90 days)')}>
          <div className="space-y-3">
            {breachRateFiltered.map((b, i) => (
              <div key={i} className={`border rounded p-3 ${b.breaking ? 'border-red-200 bg-red-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${b.breaking ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(b.breaking ? 'breaking' : 'non-breaking')}
                    </span>
                    <span className="font-mono text-[11px] font-bold">{b.contract}</span>
                  </div>
                  <span className="text-[10px] text-vfes-dark/55">{b.d} · {b.producer}</span>
                </div>
                <div className="text-[12px] font-semibold">{tt('change')} · {b.change}</div>
                <div className="text-[11px]">{tt('impact')} · <span className="text-vfes-dark/70">{b.impact}</span></div>
                <div className="text-[10px] text-emerald-700 mt-0.5">→ {b.resolution}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <Panel title={tt('Breach frequency · monthly')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={BREACH_TREND_MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="breaches" name={tt('Breaches')} fill={AMBER} radius={[3,3,0,0]} />
                  <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Impact score by breach')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={BREAKS_EXTENDED.map(b => ({ c: b.contract.slice(0, 12), s: b.impactScore }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="c" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="s" name={tt('Impact score')} radius={[3,3,0,0]}>
                    {BREAKS_EXTENDED.map((b, i) => <Cell key={i} fill={b.impactScore >= 70 ? '#ef4444' : b.impactScore >= 40 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Impact summary · consumers affected per breach')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Date')}</th>
                  <th className="text-left">{tt('Contract')}</th>
                  <th className="text-left">{tt('Change type')}</th>
                  <th className="text-left">{tt('Consumer impact')}</th>
                  <th className="text-right">{tt('Impact score')}</th>
                  <th className="text-left">{tt('Breaking')}</th>
                </tr>
              </thead>
              <tbody>
                {BREAKS_EXTENDED.map((b, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-[10px]">{b.d}</td>
                    <td className="font-mono text-[10px] font-semibold">{b.contract.slice(0, 18)}</td>
                    <td className="text-[11px] text-vfes-dark/65">{b.change}</td>
                    <td className="text-[11px]">{b.impact}</td>
                    <td className={`text-right font-bold font-mono ${b.impactScore >= 70 ? 'text-red-600' : b.impactScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{b.impactScore}</td>
                    <td>
                      {b.breaking ? <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-100 text-red-700">{tt('yes')}</span>
                                  : <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{tt('no')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Breach impact score trend · 6 months (area)')}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={BREACH_TREND_MONTHLY.map((m, i) => ({ ...m, avgScore: [80,40,60,35,55,70][i] ?? 50 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="avgScore" name={tt('Avg impact score')} stroke={AMBER} fill={AMBER} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ VERSIONING ══════════════════════════════════════════ */}
      {tab === 'versioning' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Type:')}</span>
          {(['all', 'major', 'minor', 'patch'] as const).map(t => (
            <button key={t} onClick={() => setVersionFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${versionFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(t)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Schema versions tracked')} value="34"    delta="+6 QoQ"                       trend="up"   icon={GitBranch} accent />
          <KpiCard label={tt('Major (breaking) bumps')}  value="5"     delta={tt('90d · all with 90d window')} trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('Deprecation in progress')} value="2"     delta="EXEC_360 v1.x · PROD_360 v1.x"  trend="flat" icon={Clock}     />
          <KpiCard label={tt('Avg migration time')}      value="18 d"  delta={tt('to full consumer cutover')}  trend="up"   icon={Activity}  />
        </div>

        <Panel title={tt('Version history · all contracts')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Contract')}</th>
                <th className="text-left">{tt('From')}</th>
                <th className="text-left">{tt('To')}</th>
                <th className="text-left">{tt('Date')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-left">{tt('Change')}</th>
                <th className="text-left">{tt('Breaking')}</th>
                <th className="text-left">{tt('Migration path')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredVersionHistory.map((v, i) => (
                <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-[10px] font-semibold">{v.contract.replace('_CONTRACT_v', ' v')}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/55">{v.from_v}</td>
                  <td className="font-mono text-[10px] font-bold">{v.to_v}</td>
                  <td className="text-[10px] text-vfes-dark/65">{v.date}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.type === 'major' ? 'bg-red-100 text-red-700' : v.type === 'minor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(v.type)}</span>
                  </td>
                  <td className="text-[11px] text-vfes-dark/70">{v.change}</td>
                  <td>
                    {v.breaking ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </td>
                  <td className="text-[10px] text-emerald-700">{v.migration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Version type mix per contract')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={VERSION_TYPE_CHART}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="c" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="major" name={tt('Major')} fill="#ef4444" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="minor" name={tt('Minor')} fill={AMBER}   stackId="a" />
                <Bar dataKey="patch" name={tt('Patch')} fill={GREEN}   stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Sample contract YAML · CUSTOMER_360_CONTRACT v3.4')}>
            <pre className="bg-[#0f172a] text-emerald-200 font-mono text-[10px] rounded p-3 leading-relaxed overflow-x-auto whitespace-pre">{SAMPLE_CONTRACT}</pre>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-engineering" className="text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
        </div>
      </>)}

      {/* ══════════════ ENFORCEMENT ══════════════════════════════════════════ */}
      {tab === 'enforcement' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Enforcement policies')}  value="8"    delta={tt('7 active · 1 draft')}     trend="flat" icon={Shield}     accent />
          <KpiCard label={tt('Contracts covered')}     value="8/8"  delta={tt('100% coverage')}          trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Auto-blocks triggered')} value="3"    delta={tt('90d · all resolved')}     trend="flat" icon={Bell}       />
          <KpiCard label={tt('Consumer onboard gates')} value="14"  delta={tt('signed contracts 90d')}   trend="up"   icon={Users}      />
        </div>

        <Panel title={tt('Enforcement policies · contract governance')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('ID')}</th>
                <th className="text-left">{tt('Policy')}</th>
                <th className="text-left">{tt('Trigger')}</th>
                <th className="text-left">{tt('Action')}</th>
                <th className="text-right">{tt('Contracts')}</th>
                <th className="text-left">{tt('State')}</th>
              </tr>
            </thead>
            <tbody>
              {ENFORCEMENT_POLICIES.map((p) => (
                <tr key={p.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-[10px] font-bold">{p.id}</td>
                  <td className="text-[11px] font-semibold">{tt(p.name)}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{p.trigger}</td>
                  <td className="text-[10px] text-vfes-dark/70">{p.action}</td>
                  <td className="text-right font-mono">{p.contracts}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.state === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(p.state)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <Panel title={tt('Policy coverage by contract count')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ENFORCEMENT_POLICIES.map(p => ({ policy: p.id, contracts: p.contracts }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="policy" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="contracts" name={tt('Contracts')} fill={BLUE} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Governance · Horizon links')}>
              <div className="space-y-3 mt-1 text-[12px]">
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('PII masking enforcement')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('EP-007 auto-attaches masking policies for all contract columns marked pii:true via Snowflake Horizon.')}</div>
                  <Link to="/portal/horizon" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open Horizon →')}</Link>
                </div>
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('RBAC consumer gating')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('EP-005 routes new consumer access requests through RBAC approval — steward must sign off.')}</div>
                  <Link to="/portal/rbac" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open RBAC →')}</Link>
                </div>
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('Cost chargeback per consumer')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('Query cost per registered consumer tracked in COST_USAGE_ATTRIBUTION table — reported monthly.')}</div>
                  <Link to="/portal/cost" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open Cost →')}</Link>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <Link to="/portal/rbac" className="text-vfes-dark hover:underline">{tt('RBAC →')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/cost" className="text-vfes-dark hover:underline">{tt('Cost →')}</Link>
        </div>
      </>)}

      {/* ══════════════ PRODUCERS ════════════════════════════════════════════ */}
      {tab === 'producers' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by status:')}</span>
          {(['all', 'green', 'amber', 'red'] as const).map(s => (
            <button key={s} onClick={() => setProducerDomain(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${producerDomain === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Producer teams')}       value="8"    delta={tt('all publishing contracts')}  trend="flat" icon={Layers}     accent />
          <KpiCard label={tt('Green status')}         value="5/8"  delta={tt('SLA ≥99.5% · 0 breaks')}   trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Amber / red teams')}    value="3"    delta="Finance DE · Network Eng · ML"  trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Highest lag (P95)')}    value="18 min" delta="Network Eng · CMTS_EVENTS"   trend="down" icon={Clock}       />
        </div>

        <Panel title={tt('Producer team health scorecard')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Team')}</th>
                <th className="text-left">{tt('Domain')}</th>
                <th className="text-right">{tt('Contracts')}</th>
                <th className="text-right">{tt('SLA avg %')}</th>
                <th className="text-right">{tt('Breaks 90d')}</th>
                <th className="text-right">{tt('Coverage')}</th>
                <th className="text-right">{tt('P95 lag (min)')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducers.map((p) => (
                <tr key={p.team} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-semibold">{tt(p.team)}</td>
                  <td className="text-[10px] text-vfes-dark/65">{p.domain}</td>
                  <td className="text-right font-mono">{p.contracts}</td>
                  <td className={`text-right font-bold font-mono ${p.sla_avg >= 99.5 ? 'text-emerald-600' : p.sla_avg >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{p.sla_avg}%</td>
                  <td className={`text-right font-bold font-mono ${p.breaks_90d === 0 ? 'text-emerald-600' : p.breaks_90d <= 1 ? 'text-amber-600' : 'text-red-600'}`}>{p.breaks_90d}</td>
                  <td className="text-right font-mono text-emerald-600">{p.coverage}</td>
                  <td className={`text-right font-mono ${p.lag_p95 >= 10 ? 'text-red-600 font-bold' : p.lag_p95 >= 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.lag_p95}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === 'green' ? 'bg-emerald-100 text-emerald-700' : p.status === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(p.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Producer P95 lag vs SLA (min)')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PRODUCER_LAG_CHART}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="team" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine y={10} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLA 10m', fontSize: 9, fill: AMBER }} />
                <Bar dataKey="lag" name={tt('P95 lag min')} radius={[3,3,0,0]}>
                  {PRODUCER_LAG_CHART.map((p, i) => <Cell key={i} fill={p.lag >= 10 ? '#ef4444' : p.lag >= 6 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-engineering" className="text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
          <Link to="/portal/cdo" className="text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
        </div>
      </>)}

      {/* ══════════════ CONSUMERS ════════════════════════════════════════════ */}
      {tab === 'consumers' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by type:')}</span>
          {(['all', 'BI', 'AI', 'ML', 'ETL'] as const).map(t => (
            <button key={t} onClick={() => setConsumerTypeFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${consumerTypeFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(t)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Registered consumers')} value="142"  delta="+8 QoQ"                      trend="up"   icon={Users}       accent />
          <KpiCard label={tt('Critical consumers')}   value="4"    delta="PowerBI · CHURN · NOC · CFO"  trend="flat" icon={Bell}        />
          <KpiCard label={tt('AI / Agent consumers')} value="3"    delta="CHURN_AGENT · AI_CLASSIFY · CFO_AGENT" trend="up" icon={TrendingUp} />
          <KpiCard label={tt('No notification set')}  value="1"    delta="AI_CLASSIFY · fix required"  trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Consumer dependency map · tracked consumers')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Consumer')}</th>
                <th className="text-left">{tt('Contract')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-left">{tt('Criticality')}</th>
                <th className="text-left">{tt('Team')}</th>
                <th className="text-left">{tt('Notif')}</th>
                <th className="text-left">{tt('Last access')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsumers.map((dep, i) => (
                <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-semibold text-[11px]">{tt(dep.consumer)}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{dep.contract.replace('_CONTRACT_v', ' v')}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${dep.type === 'AI' ? 'bg-purple-100 text-purple-700' : dep.type === 'ML' ? 'bg-blue-100 text-blue-700' : dep.type === 'BI' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>{dep.type}</span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${dep.criticality === 'critical' ? 'bg-red-100 text-red-700' : dep.criticality === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{tt(dep.criticality)}</span>
                  </td>
                  <td className="text-[11px]">{dep.team}</td>
                  <td>
                    {dep.notif === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </td>
                  <td className="text-[10px] text-vfes-dark/60">{dep.last_access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <Panel title={tt('Consumer type distribution')}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={CONSUMER_TYPE_PIE} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {CONSUMER_TYPE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Deep links — AI consumers')}>
              <div className="space-y-3 mt-1 text-[12px]">
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('CHURN_AGENT (Cortex Agents)')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('Cortex Agent consuming CUSTOMER_360_CONTRACT_v3. Runs every 4h.')}</div>
                  <Link to="/portal/agents" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open Agents →')}</Link>
                </div>
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('Cortex Search on Customer 360')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('CORTEX_SEARCH index on CUSTOMER_360 used by CFO Agent for natural-language queries.')}</div>
                  <Link to="/portal/cortex-search" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open Cortex Search →')}</Link>
                </div>
                <div className="p-3 border border-black/5 rounded-lg">
                  <div className="font-semibold mb-1">{tt('ML Registry — churn + CLV models')}</div>
                  <div className="text-[11px] text-vfes-dark/65">{tt('3 models in ML Registry consuming the contract. Feature Store snapshots on freshness trigger.')}</div>
                  <Link to="/portal/ml-registry" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Open ML Registry →')}</Link>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/agents" className="text-vfes-dark hover:underline">{tt('Agents →')}</Link>
          <Link to="/portal/cortex-search" className="text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
          <Link to="/portal/ml-registry" className="text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}
    </div>
  )
}
