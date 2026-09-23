import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3556)
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine,
  BarChart, Bar, AreaChart, Area, CartesianGrid, Legend, Cell, ComposedChart, PieChart, Pie,
} from 'recharts'
import tt from '../../i18n/tt'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Smartphone,
  Database, Activity, TrendingUp, Eye, Layers, Bell, Users, GitBranch,
} from 'lucide-react'
import { MOBILE_DMF } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const KPIS = [
  { l: 'Quality score',     v: '94.2', sub: 'weighted avg · 1,284 objects', tone: 'emerald' },
  { l: 'DMF coverage',      v: '78%',  sub: '1,002 / 1,284 objects',         tone: 'emerald' },
  { l: 'Active incidents',  v: '4',    sub: '1 P2 · 3 P3',                   tone: 'amber' },
  { l: 'Tests passing',     v: '99.4%',sub: '8,612 of 8,664 today',          tone: 'emerald' },
  { l: 'Stale > SLA',       v: '3',    sub: 'C360 +14 min · CHURN +6 min · CLV +2h', tone: 'amber' },
  { l: 'Schema drift 7d',   v: '6',    sub: 'all auto-handled',              tone: 'emerald' },
]

const RUNS = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  pass: parseFloat((99 - (i % 5 === 0 ? 1.5 : 0) - scenarioRandom() * 0.4).toFixed(2)),
  fail: parseFloat((i % 5 === 0 ? 1.5 + scenarioRandom() * 0.4 : scenarioRandom() * 0.4).toFixed(2)),
}))

const DOMAIN = [
  { d: 'Customer 360',  s: 96.2, t: 1284, f: 6,  cov: 88 },
  { d: 'Product 360',   s: 95.4, t: 612,  f: 4,  cov: 82 },
  { d: 'B2B 360',       s: 92.1, t: 408,  f: 12, cov: 76 },
  { d: 'Network',       s: 89.6, t: 894,  f: 18, cov: 71 },
  { d: 'People 360',    s: 98.7, t: 312,  f: 1,  cov: 94 },
  { d: 'Risk / ESG',    s: 97.4, t: 246,  f: 2,  cov: 90 },
  { d: 'Finance',       s: 99.1, t: 412,  f: 0,  cov: 96 },
]

const INCIDENTS = [
  { id: 'INC-2031', sev: 'P2', table: 'CORE.FACT_NETWORK_KPI',      rule: 'freshness < 30 min',           started: '14:08', owner: 'Network DE',  status: 'investigating', age: 42 },
  { id: 'INC-2030', sev: 'P3', table: 'ANALYTICS.CHURN_LIST_DAILY', rule: 'row_count > 80% of yesterday', started: '06:42', owner: 'ML platform', status: 'mitigated',     age: 8  },
  { id: 'INC-2029', sev: 'P3', table: 'CORE.STG_BILLING',           rule: 'unique(invoice_id)',           started: '03:14', owner: 'Billing DE',  status: 'investigating', age: 4  },
  { id: 'INC-2028', sev: 'P3', table: 'CORE.STG_TICKETS',           rule: 'accepted_values(channel)',     started: '02:55', owner: 'CX DE',       status: 'investigating', age: 12 },
]

const RULES = [
  { c: 'NULL_COUNT',      n: 'not_null(EMAIL)',                  t: 'CORE.STG_CUSTOMERS',  v: 1240, lim: 0,    s: 'fail', domain: 'Customer 360' },
  { c: 'UNIQUE_COUNT',    n: 'unique(INVOICE_ID)',               t: 'CORE.STG_BILLING',    v: 12,   lim: 0,    s: 'fail', domain: 'Finance'      },
  { c: 'FRESHNESS',       n: 'freshness < 30 min',               t: 'FACT_NETWORK_KPI',    v: 38,   lim: 30,   s: 'fail', domain: 'Network'      },
  { c: 'ROW_COUNT',       n: 'rowcount Δ vs T-1d > -10%',        t: 'CHURN_LIST_DAILY',    v: -16,  lim: -10,  s: 'fail', domain: 'Customer 360' },
  { c: 'ACCEPTED_VALUES', n: 'accepted_values(CHANNEL)',         t: 'STG_TICKETS',         v: 8,    lim: 0,    s: 'fail', domain: 'CX'           },
  { c: 'REFERENTIAL',     n: 'fk(CUSTOMER_ID → DIM_CUSTOMER)',   t: 'FACT_BILLING',        v: 0,    lim: 0,    s: 'pass', domain: 'Finance'      },
  { c: 'DUPLICATE_COUNT', n: 'unique(MSISDN)',                   t: 'DIM_CUSTOMER',        v: 0,    lim: 0,    s: 'pass', domain: 'Customer 360' },
  { c: 'CUSTOM_SQL',      n: 'arpu_total ≈ Σ(line_arpu) ±0.1%', t: 'FACT_BILLING',        v: 0.04, lim: 0.10, s: 'pass', domain: 'Finance'      },
  { c: 'NULL_COUNT',      n: 'not_null(MSISDN)',                 t: 'DIM_CUSTOMER',        v: 0,    lim: 0,    s: 'pass', domain: 'Customer 360' },
  { c: 'ROW_COUNT',       n: 'rowcount Δ B2B_360 > -5%',        t: 'B2B_360',             v: 0.2,  lim: 5,    s: 'pass', domain: 'B2B 360'      },
  { c: 'FRESHNESS',       n: 'freshness CUSTOMER_360 < 30 min', t: 'CUSTOMER_360',        v: 14,   lim: 30,   s: 'pass', domain: 'Customer 360' },
  { c: 'CUSTOM_SQL',      n: 'churn_score in [0,1]',            t: 'CHURN_LIST_DAILY',    v: 0,    lim: 0,    s: 'pass', domain: 'Customer 360' },
]

const STATUS_COLORS: Record<string, string> = {
  fail: 'bg-rose-100 text-rose-700 border-rose-300',
  pass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
}

const DMF_POLICIES = [
  { name: 'SNOWFLAKE.CORE.NULL_COUNT',    att: 342, domains: 'all',      cadence: '15 min', state: 'active' },
  { name: 'SNOWFLAKE.CORE.UNIQUE_COUNT',  att: 188, domains: 'billing',  cadence: '15 min', state: 'active' },
  { name: 'SNOWFLAKE.CORE.FRESHNESS',     att: 124, domains: 'all',      cadence: 'live',   state: 'active' },
  { name: 'SNOWFLAKE.CORE.ROW_COUNT',     att: 212, domains: 'all',      cadence: '1 hr',   state: 'active' },
  { name: 'SNOWFLAKE.CORE.DUPLICATE_COUNT', att: 94, domains: 'billing', cadence: '1 hr',   state: 'active' },
  { name: 'CUSTOM.ARPU_RECONCILE',        att: 6,   domains: 'finance',  cadence: 'daily',  state: 'active' },
  { name: 'CUSTOM.CHURN_DRIFT_PSI',       att: 2,   domains: 'ml',       cadence: '6 hr',   state: 'active' },
  { name: 'CUSTOM.B2B_REV_RECONCILE',     att: 4,   domains: 'b2b',      cadence: 'daily',  state: 'draft'  },
]

const SLA_FRESHNESS = [
  { t: 'CUSTOMER_360',     sla: '03:30 UTC', actual: '03:24', ok: true,  delta: '-6m'  },
  { t: 'PRODUCT_360',      sla: '03:30 UTC', actual: '03:18', ok: true,  delta: '-12m' },
  { t: 'B2B_360',          sla: '04:00 UTC', actual: '03:51', ok: true,  delta: '-9m'  },
  { t: 'CHURN_LIST_DAILY', sla: '07:00 UTC', actual: '06:42', ok: true,  delta: '-18m' },
  { t: 'FACT_NETWORK_KPI', sla: '+30 min',   actual: '+38 min', ok: false, delta: '+8m' },
  { t: 'CLV_36M_FACT',     sla: '05:00 UTC', actual: '07:02', ok: false, delta: '+122m'},
]

const QUALITY_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i+1}`,
  score: parseFloat((91 + i * 0.28 + (i === 5 ? -1.2 : 0)).toFixed(2)),
  cov: Math.min(78, 62 + i * 1.4),
}))

const INCIDENT_TREND = [
  { m: 'Jan', p1: 0, p2: 1, p3: 3, resolved: 4 },
  { m: 'Feb', p1: 0, p2: 0, p3: 2, resolved: 2 },
  { m: 'Mar', p1: 1, p2: 1, p3: 4, resolved: 5 },
  { m: 'Apr', p1: 0, p2: 0, p3: 3, resolved: 3 },
  { m: 'May', p1: 0, p2: 1, p3: 3, resolved: 3 },
  { m: 'Jun', p1: 0, p2: 1, p3: 3, resolved: 1 },
]

const DOMAIN_COVERAGE = DOMAIN.map(d => ({ domain: d.d.slice(0,10), coverage: d.cov, score: d.s, failures: d.f }))

const RULE_CATEGORY_PIE = [
  { name: 'NULL_COUNT',   value: 342, color: BLUE   },
  { name: 'ROW_COUNT',    value: 212, color: NAVY   },
  { name: 'UNIQUE_COUNT', value: 188, color: GREEN  },
  { name: 'FRESHNESS',    value: 124, color: AMBER  },
  { name: 'CUSTOM',       value: 12,  color: PURPLE },
]

type TabId = 'overview' | 'dmf' | 'coverage' | 'incidents' | 'rules' | 'freshness' | 'trends' | 'mobile'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',  label: 'Overview',       icon: Activity    },
  { id: 'dmf',       label: 'DMF policies',   icon: Database    },
  { id: 'coverage',  label: 'Coverage',       icon: ShieldCheck },
  { id: 'incidents', label: 'Incidents',      icon: AlertTriangle },
  { id: 'rules',     label: 'Rule library',   icon: Layers      },
  { id: 'freshness', label: 'Freshness SLA',  icon: Clock       },
  { id: 'trends',    label: 'Trends',         icon: TrendingUp  },
  { id: 'mobile',    label: 'Mobile DMFs',    icon: Smartphone  },
]

export default function DataQualityPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [ruleStatusFilter, setRuleStatusFilter] = useState<'all' | 'fail' | 'pass'>('all')
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all')
  const [incidentSev, setIncidentSev] = useState<string>('all')
  const [dmfState, setDmfState] = useState<string>('all')
  const [qualityWindow, setQualityWindow] = useState<6 | 9 | 12>(12)

  const filteredRules = useMemo(
    () => RULES.filter(r =>
      (ruleStatusFilter === 'all' || r.s === ruleStatusFilter) &&
      (ruleCategoryFilter === 'all' || r.c === ruleCategoryFilter) &&
      (domainFilter === 'all' || r.domain === domainFilter)
    ),
    [ruleStatusFilter, ruleCategoryFilter, domainFilter],
  )

  const filteredIncidents = useMemo(
    () => incidentSev === 'all' ? INCIDENTS : INCIDENTS.filter(i => i.sev === incidentSev),
    [incidentSev],
  )

  const filteredDmf = useMemo(
    () => dmfState === 'all' ? DMF_POLICIES : DMF_POLICIES.filter(d => d.state === dmfState),
    [dmfState],
  )

  const qualityTrendSlice = useMemo(
    () => QUALITY_TREND.slice(QUALITY_TREND.length - qualityWindow),
    [qualityWindow],
  )

  const domainData = useMemo(
    () => domainFilter === 'all' ? DOMAIN : DOMAIN.filter(d => d.d === domainFilter),
    [domainFilter],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Data quality · DMF cockpit')}
        subtitle={tt('Snowflake DMFs · dbt tests · freshness · drift · all 360s · refreshed every 15 min')}
        actions={
          <Link to="/portal/data-contracts" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> {tt('Data Contracts')}
          </Link>
        }
      />

      {/* ── ML / AI section ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Data quality intelligence"
        models={[
          { name: 'Anomaly Detector',        metric: 'recall 0.91',  sub: 'DMF-triggered · all domains' },
          { name: 'Freshness Predictor',     metric: 'MAPE 3.8%',   sub: 'pipeline delay forecast 24h' },
          { name: 'Schema Drift Classifier', metric: 'F1 0.93',     sub: 'breaking vs additive changes' },
        ]}
        agentLabel={tt('Run Quality Sweep')}
        agentRunningLabel={tt('Running DMF sweep…')}
        agentSteps={[
          tt('Queried SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS for all 1,284 objects'),
          tt('Detected 5 failing rules across 4 objects · ranked by downstream impact'),
          tt('Freshness predictor projects 2 more SLA breaches in next 6 hours'),
          tt('Incident INC-2031 is highest priority — FACT_NETWORK_KPI upstream stall'),
        ]}
        agentBlurb={tt('DMF results stream into Snowflake Cortex AI and the anomaly model scores each result against a rolling baseline. Everything from freshness lag to null-rate spike is covered in one sweep.')}
        decision={{
          title: tt('Escalate INC-2031 to P1 — Network KPI staleness now 42 min over SLA'),
          detail: tt('FACT_NETWORK_KPI has been stale 42 minutes past the 30-minute SLA. NOC dashboards and the AIOps model are both reading from it. Downstream impact widens every 15-minute refresh cycle. Escalation to P1 is warranted.'),
          impact: tt('NOC dashboard delayed · AIOps false-negative risk · SLA breach on NETWORK_KPI_CONTRACT_v4'),
          risk: tt('Pipeline root cause not yet confirmed — could be upstream CMTS collection lag'),
          linkTo: '/portal/observability',
          linkLabel: tt('Open Observability →'),
        }}
        chart={{
          kind: 'line',
          title: tt('Quality score trend · all domains · 12 months'),
          xKey: 'm',
          unit: '',
          data: QUALITY_TREND,
          series: [
            { key: 'score', name: tt('Quality score'), color: GREEN },
            { key: 'cov',   name: tt('DMF coverage %'), color: BLUE, dashed: true },
          ],
          note: tt('Quality score recovering after M6 incident (B2B upstream outage). DMF coverage on plan toward 85% target.'),
        }}
        registryNote={tt('Models trained on SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS. Features from Feature Store. Served from Model Registry.')}
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
          <KpiCard label={tt('Quality score')}    value="94.2"  delta={tt('weighted avg · 1,284 objects')} trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('DMF coverage')}     value="78%"   delta={tt('1,002 / 1,284 objects')}       trend="up"   icon={Database}    />
          <KpiCard label={tt('Active incidents')} value="4"     delta={tt('1 P2 · 3 P3')}                 trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Tests passing')}    value="99.4%" delta={tt('8,612 of 8,664 today')}        trend="up"   icon={CheckCircle2} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Stale > SLA')}      value="3"     delta="C360 · CHURN · CLV"               trend="down" icon={Clock}        />
          <KpiCard label={tt('Schema drift 7d')}  value="6"     delta={tt('all auto-handled')}           trend="up"   icon={TrendingUp}   />
          <KpiCard label={tt('DMF policies')}     value="8"     delta={tt('7 active · 1 draft')}         trend="flat" icon={Layers}       />
          <KpiCard label={tt('Domains monitored')} value="7"    delta={tt('all 360s + network + finance')} trend="flat" icon={Activity}   />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-8">
            <Panel title={tt('Test pass rate · 30 days (%)')}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={RUNS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} domain={[97, 100]} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={99} stroke={GREEN} strokeDasharray="3 3" label={{ value: 'SLO 99%', fontSize: 9, fill: GREEN }} />
                  <Line type="monotone" dataKey="pass" name={tt('Pass %')} stroke={BLUE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-4">
            <Panel title={tt('Quality by domain')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DOMAIN} layout="vertical" margin={{ left: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} domain={[80, 100]} />
                  <YAxis dataKey="d" type="category" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="s" name={tt('Score')} radius={[0,3,3,0]}>
                    {DOMAIN.map((d, i) => <Cell key={i} fill={d.s >= 97 ? GREEN : d.s >= 93 ? BLUE : d.s >= 90 ? AMBER : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-6">
            <Panel title={tt('Incident trend · 6 months')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={INCIDENT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p2" name={tt('P2')} fill={AMBER} stackId="a" />
                  <Bar dataKey="p3" name={tt('P3')} fill={BLUE}  stackId="a" radius={[3,3,0,0]} />
                  <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Rule category distribution')}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={RULE_CATEGORY_PIE} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {RULE_CATEGORY_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <ShieldCheck className="w-3 h-3" />
          {tt('source: SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS · DMF · dbt run_results · 15 min refresh')} ·
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/semantic-views" className="text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Governance quick links · data quality integrations')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: '/portal/data-contracts',  label: tt('Data Contracts'),   desc: tt('SLA breaches tied to DMF results')        },
                { to: '/portal/semantic-views',  label: tt('Semantic Views'),    desc: tt('Quality gates on Cortex Analyst models')  },
                { to: '/portal/lineage',         label: tt('Lineage'),           desc: tt('Upstream root-cause tracing')            },
                { to: '/portal/catalog',         label: tt('Catalog'),           desc: tt('Quality badges on objects')              },
                { to: '/portal/horizon',         label: tt('Horizon'),           desc: tt('Policy-level quality enforcement')       },
                { to: '/portal/observability',   label: tt('Observability'),     desc: tt('Pipeline health + SLA monitoring')       },
                { to: '/portal/ml-registry',     label: tt('ML Registry'),       desc: tt('Model quality gates from DMF signals')   },
                { to: '/portal/ai-insights',     label: tt('AI Insights'),       desc: tt('Cortex AI quality anomaly detection')    },
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
      </>)}

      {/* ══════════════ DMF POLICIES ═════════════════════════════════════════ */}
      {tab === 'dmf' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('State:')}</span>
          {(['all', 'active', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setDmfState(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${dmfState === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('DMF policies')}       value="8"     delta={tt('7 active · 1 draft')}     trend="flat" icon={Database}    accent />
          <KpiCard label={tt('Total attachments')}  value="1,002" delta={tt('across 1,284 objects')}   trend="up"   icon={Layers}      />
          <KpiCard label={tt('Custom DMFs')}        value="3"     delta={tt('ARPU · Churn drift · B2B')} trend="up"  icon={Activity}    />
          <KpiCard label={tt('Live (real-time)')}   value="124"   delta={tt('FRESHNESS attachments')}   trend="up"   icon={Clock}       />
        </div>

        <Panel title={tt('DMF policy catalogue')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('DMF name')}</th>
                <th className="text-right">{tt('Attachments')}</th>
                <th className="text-left">{tt('Domains')}</th>
                <th className="text-left">{tt('Cadence')}</th>
                <th className="text-left">{tt('State')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDmf.map((d) => (
                <tr key={d.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{d.name}</td>
                  <td className="text-right font-mono">{d.att}</td>
                  <td className="text-[11px] text-vfes-dark/65">{d.domains}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{d.cadence}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.state === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(d.state)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('DMF attachments by policy')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DMF_POLICIES.map(d => ({ name: d.name.split('.').pop() ?? d.name, att: d.att }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="att" name={tt('Attachments')} fill={BLUE} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('How DMFs integrate with Snowflake governance')}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Data metric functions (DMF)')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('CREATE DATA METRIC FUNCTION in SNOWFLAKE.CORE namespace. Attached to tables via ALTER TABLE … ADD DATA METRIC FUNCTION. Results stream to SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS.')}</div>
                <Link to="/portal/horizon" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Horizon governance →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Alerts on DMF failures')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Snowflake ALERT objects poll the results view every 5 min. Any FAIL state fires PagerDuty via notification integration. P2+ opens an INC automatically.')}</div>
                <Link to="/portal/observability" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Observability →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('dbt test + DMF dual coverage')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('dbt tests cover compile-time checks; DMFs provide continuous runtime monitoring. Two-layer defence gives both CI gating and production alerting.')}</div>
                <Link to="/portal/data-engineering" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Data Engineering →')}</Link>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Schema drift register · 7 days')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Object')}</th>
                  <th className="text-left">{tt('Change')}</th>
                  <th className="text-left">{tt('Detected')}</th>
                  <th className="text-left">{tt('Resolution')}</th>
                  <th className="text-left">{tt('Impact')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { obj: 'STG_CUSTOMERS',    chg: 'NEW col: FTTH_FLAG BOOLEAN',           det: '2025-05-24 03:14', res: 'auto-backfill default FALSE',     imp: 'none'     },
                  { obj: 'STG_BILLING',      chg: 'NEW col: PAYMENT_METHOD_V2 VARCHAR',   det: '2025-05-23 01:42', res: 'dbt schema test passed',           imp: 'none'     },
                  { obj: 'FACT_NETWORK_KPI', chg: 'col rename: CELL_ID → CELL_UUID',      det: '2025-05-22 14:08', res: 'view alias deployed',              imp: 'NOC watch' },
                  { obj: 'DIM_PRODUCT',      chg: 'col type: PRICE NUMBER → FLOAT',       det: '2025-05-21 08:00', res: 'downstream cast verified',         imp: 'none'     },
                  { obj: 'STG_TICKETS',      chg: 'NEW enum: CHANNEL = WHATSAPP_BUSINESS',det: '2025-05-20 11:33', res: 'ACCEPTED_VALUES test updated',     imp: 'minor'    },
                  { obj: 'CHURN_LIST_DAILY', chg: 'col dropped: CHURN_REASON_LEGACY',     det: '2025-05-19 06:42', res: 'contract v2.1 bump · view shim',    imp: 'contract' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{r.obj}</td>
                    <td className="text-[11px]">{r.chg}</td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{r.det}</td>
                    <td className="text-[10px] text-emerald-700">{r.res}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.imp === 'none' ? 'bg-emerald-100 text-emerald-700' : r.imp === 'contract' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{tt(r.imp)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
        </div>
      </>)}

      {/* ══════════════ COVERAGE ══════════════════════════════════════════════ */}
      {tab === 'coverage' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Domain:')}</span>
          {['all', ...DOMAIN.map(d => d.d)].map(d => (
            <button key={d} onClick={() => setDomainFilter(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${domainFilter === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(d === 'all' ? 'all' : d.slice(0, 8))}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('DMF coverage overall')} value="78%"  delta={tt('target 85% EOY')}      trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Best domain')}           value="Finance" delta="99.1% quality score"  trend="up"   icon={Activity}    />
          <KpiCard label={tt('Weakest domain')}        value="Network" delta={tt('89.6% · 18 failures')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Uncovered objects')}     value="282"  delta={tt('282 tables without DMF')} trend="down" icon={Database}   />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-7">
            <Panel title={tt('Quality score · domain breakdown')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={domainData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[80, 100]} unit="%" />
                  <YAxis dataKey="d" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine x={95} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="s" name={tt('Quality score')} radius={[0,4,4,0]}>
                    {domainData.map((d, i) => <Cell key={i} fill={d.s >= 97 ? GREEN : d.s >= 93 ? BLUE : d.s >= 90 ? AMBER : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-5">
            <Panel title={tt('DMF coverage % by domain')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DOMAIN_COVERAGE} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <YAxis dataKey="domain" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine x={85} stroke={GREEN} strokeDasharray="3 3" />
                  <Bar dataKey="coverage" name={tt('Coverage %')} fill={NAVY} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Domain quality scorecard')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Domain')}</th>
                <th className="text-right">{tt('Objects')}</th>
                <th className="text-right">{tt('Quality score')}</th>
                <th className="text-right">{tt('Active failures')}</th>
                <th className="text-right">{tt('DMF coverage %')}</th>
              </tr>
            </thead>
            <tbody>
              {domainData.map((d) => (
                <tr key={d.d} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-semibold">{tt(d.d)}</td>
                  <td className="text-right font-mono">{d.t.toLocaleString()}</td>
                  <td className={`text-right font-bold font-mono ${d.s >= 97 ? 'text-emerald-600' : d.s >= 93 ? 'text-blue-600' : d.s >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{d.s}</td>
                  <td className={`text-right font-bold font-mono ${d.f === 0 ? 'text-emerald-600' : d.f < 5 ? 'text-amber-600' : 'text-red-600'}`}>{d.f}</td>
                  <td className={`text-right font-mono ${d.cov >= 85 ? 'text-emerald-600' : d.cov >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{d.cov}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Coverage vs quality score scatter · by domain')}>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={DOMAIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="l" domain={[80, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" domain={[60, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="s" name={tt('Quality score')} fill={BLUE} radius={[3,3,0,0]}>
                  {DOMAIN.map((d, i) => <Cell key={i} fill={d.s >= 97 ? GREEN : d.s >= 93 ? BLUE : d.s >= 90 ? AMBER : '#ef4444'} />)}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="cov" name={tt('DMF coverage %')} stroke={PURPLE} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}

      {/* ══════════════ INCIDENTS ═════════════════════════════════════════════ */}
      {tab === 'incidents' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Severity:')}</span>
          {(['all', 'P2', 'P3'] as const).map(s => (
            <button key={s} onClick={() => setIncidentSev(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${incidentSev === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active incidents')}  value="4"    delta={tt('1 P2 · 3 P3')}           trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Oldest incident')}   value="42m"  delta="INC-2031 · Network KPI"      trend="down" icon={Clock}         />
          <KpiCard label={tt('MTTR 30d')}          value="2.4h" delta="-0.6h QoQ"                   trend="up"   icon={TrendingUp}    />
          <KpiCard label={tt('Incidents 30d')}     value="14"   delta="+2 vs prior 30d"             trend="down" icon={Bell}          />
        </div>

        <Panel title={tt('Active incidents')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('ID')}</th>
                <th className="text-left">{tt('Sev')}</th>
                <th className="text-left">{tt('Object')}</th>
                <th className="text-left">{tt('Rule violated')}</th>
                <th className="text-left">{tt('Started')}</th>
                <th className="text-right">{tt('Age (min)')}</th>
                <th className="text-left">{tt('Owner')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((i) => (
                <tr key={i.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-2 font-mono text-vfes-dark font-bold">{i.id}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${i.sev === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{i.sev}</span>
                  </td>
                  <td className="font-mono text-[11px]">{i.table}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/70">{i.rule}</td>
                  <td className="font-mono text-[11px]">{i.started}</td>
                  <td className={`text-right font-bold font-mono ${i.age > 30 ? 'text-red-600' : i.age > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{i.age}</td>
                  <td className="text-[11px]">{tt(i.owner)}</td>
                  <td>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">{tt(i.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Incident volume trend · 6 months')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INCIDENT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="p2" name={tt('P2')} fill={AMBER} stackId="a" />
                <Bar dataKey="p3" name={tt('P3')} fill={BLUE}  stackId="a" radius={[3,3,0,0]} />
                <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Incident · response workflow')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '1', action: tt('DMF fires'), detail: tt('Result = FAIL written to SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS') },
                { step: '2', action: tt('Alert fires'), detail: tt('Snowflake ALERT polls every 5 min · triggers notification integration') },
                { step: '3', action: tt('INC opened'), detail: tt('PagerDuty P2/P3 raised · Slack #data-oncall · INC logged in registry') },
                { step: '4', action: tt('Resolved'), detail: tt('Root cause fixed · DMF passes · INC closed · MTTR logged') },
              ].map(s => (
                <div key={s.step} className="p-3 border border-black/5 rounded-xl bg-[#fafbfc]">
                  <div className="text-[10px] font-extrabold text-vfes-dark mb-1">{tt('Step')} {s.step}</div>
                  <div className="font-semibold text-[12px] mb-1">{s.action}</div>
                  <div className="text-[11px] text-vfes-dark/65">{s.detail}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>
      </>)}

      {/* ══════════════ RULE LIBRARY ══════════════════════════════════════════ */}
      {tab === 'rules' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Status:')}</span>
          {(['all', 'fail', 'pass'] as const).map(s => (
            <button key={s} onClick={() => setRuleStatusFilter(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${ruleStatusFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
          <span className="ml-3 text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {['all', 'NULL_COUNT', 'UNIQUE_COUNT', 'FRESHNESS', 'ROW_COUNT', 'CUSTOM_SQL'].map(c => (
            <button key={c} onClick={() => setRuleCategoryFilter(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${ruleCategoryFilter === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(c)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Rules total')}      value="8,664" delta={tt('across all domains')}   trend="flat" icon={Layers}    accent />
          <KpiCard label={tt('Rules failing')}    value="52"    delta={tt('0.6% of total')}        trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Rule categories')}  value="8"     delta={tt('incl. 3 custom DMFs')}  trend="flat" icon={Database}  />
          <KpiCard label={tt('Auto-resolved')}    value="44"    delta={tt('last 30d schema drift')} trend="up"  icon={CheckCircle2} />
        </div>

        <Panel title={tt('Rule library · last run results')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Category')}</th>
                <th className="text-left">{tt('Rule')}</th>
                <th className="text-left">{tt('Object')}</th>
                <th className="text-left">{tt('Domain')}</th>
                <th className="text-right">{tt('Value')}</th>
                <th className="text-right">{tt('Limit')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((r, i) => (
                <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-[10px] text-vfes-dark/70">{r.c}</td>
                  <td className="font-mono text-[11px]">{r.n}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/70">{tt(r.t)}</td>
                  <td className="text-[10px] text-vfes-dark/65">{r.domain}</td>
                  <td className="text-right font-mono">{r.v}</td>
                  <td className="text-right font-mono text-vfes-dark/50">{r.lim}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${STATUS_COLORS[r.s]}`}>{r.s}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Rule failure rate by category')}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RULE_CATEGORY_PIE.map(r => ({ name: r.name, attachments: r.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="attachments" name={tt('Attachments')} radius={[3,3,0,0]}>
                  {RULE_CATEGORY_PIE.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Rule failure area trend · 30d (fail counts)')}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={RUNS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Area type="monotone" dataKey="fail" name={tt('Fail count')} stroke={AMBER} fill={AMBER} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Freshness · related Snowflake features')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('SNOWFLAKE.CORE.FRESHNESS DMF')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Built-in DMF measuring time since last DML write. Attached to all core 360 tables. Results in SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS every 5 min.')}</div>
                <Link to="/portal/catalog" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Catalog →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Dynamic Table target lag')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Dynamic Tables with TARGET_LAG drive freshness guarantees for the 360 layer. When the actual lag exceeds the target, DMF FRESHNESS fires an incident.')}</div>
                <Link to="/portal/data-engineering" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Data Engineering →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Cortex Analyst freshness warning')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt("When a semantic view's base table is stale, Cortex Analyst appends a freshness warning to every query result so analysts know the data currency.")}</div>
                <Link to="/portal/semantic-views" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Semantic Views →')}</Link>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Incident · response workflow steps')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '1', action: tt('DMF fires'), detail: tt('Result = FAIL written to DATA_QUALITY_MONITORING_RESULTS') },
                { step: '2', action: tt('Alert fires'), detail: tt('Snowflake ALERT polls every 5 min · triggers notification integration') },
                { step: '3', action: tt('INC opened'),  detail: tt('PagerDuty P2/P3 · Slack #data-oncall · INC logged in registry') },
                { step: '4', action: tt('Resolved'),    detail: tt('Root cause fixed · DMF passes · INC closed · MTTR logged') },
              ].map(s => (
                <div key={s.step} className="p-3 border border-black/5 rounded-xl bg-[#fafbfc]">
                  <div className="text-[10px] font-extrabold text-vfes-dark mb-1">{tt('Step')} {s.step}</div>
                  <div className="font-semibold text-[12px] mb-1">{s.action}</div>
                  <div className="text-[11px] text-vfes-dark/65">{s.detail}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ FRESHNESS SLA ═════════════════════════════════════════ */}
      {tab === 'freshness' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Objects meeting SLA')} value="4/6"  delta={tt('core 360s on-time')}     trend="up"   icon={Clock}        accent />
          <KpiCard label={tt('Worst miss')}           value="+122m" delta="CLV_36M_FACT · overnight"  trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Avg advance (SLA ok)')} value="-11m" delta={tt('on-time deliveries')}   trend="up"   icon={TrendingUp}    />
          <KpiCard label={tt('SLA breaches 30d')}     value="8"   delta={tt('5 auto-remediated')}     trend="down" icon={Bell}          />
        </div>

        <Panel title={tt('SLA freshness status · all core objects')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Object')}</th>
                <th className="text-left">{tt('SLA')}</th>
                <th className="text-left">{tt('Actual')}</th>
                <th className="text-right">{tt('Delta')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {SLA_FRESHNESS.map((s) => (
                <tr key={s.t} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold text-[11px]">{tt(s.t)}</td>
                  <td className="text-[11px] text-vfes-dark/65">{s.sla}</td>
                  <td className="font-mono text-[11px]">{s.actual}</td>
                  <td className={`text-right font-bold font-mono text-[11px] ${s.ok ? 'text-emerald-600' : 'text-red-600'}`}>{s.delta}</td>
                  <td className="flex items-center gap-1.5 py-1.5">
                    {s.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${s.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{tt(s.ok ? 'on-time' : 'breach')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Test pass rate · 30 days · detailed')}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={RUNS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} domain={[97, 100]} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="pass" name={tt('Pass %')} stroke={GREEN} strokeWidth={2} dot={false} />
                <Bar  yAxisId="r" dataKey="fail" name={tt('Fail count')} fill={AMBER} />
                <ReferenceLine yAxisId="l" y={99} stroke={SLATE} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>
      </>)}

      {/* ══════════════ TRENDS ════════════════════════════════════════════════ */}
      {tab === 'trends' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Window:')}</span>
          {([6, 9, 12] as const).map(w => (
            <button key={w} onClick={() => setQualityWindow(w)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${qualityWindow === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(`${w} months`)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Quality score trend')} value="+3.2 pts" delta={tt('YTD improvement')}      trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('DMF coverage growth')} value="+16 pp"  delta={tt('62% → 78% YTD')}        trend="up"   icon={Database}    />
          <KpiCard label={tt('Incident MTTR trend')} value="-38%"    delta={tt('3.8h → 2.4h YTD')}     trend="up"   icon={Clock}       />
          <KpiCard label={tt('Schema drifts handled')} value="44"    delta={tt('100% auto-resolved 30d')} trend="up"  icon={CheckCircle2} />
        </div>

        <Panel title={tt('Quality score & DMF coverage trend · selected window')}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={qualityTrendSlice}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="l" domain={[88, 100]} tick={{ fontSize: 10 }} unit="" />
              <YAxis yAxisId="r" orientation="right" domain={[55, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="l" type="monotone" dataKey="score" name={tt('Quality score')} stroke={GREEN} strokeWidth={2.4} dot />
              <Line yAxisId="r" type="monotone" dataKey="cov"   name={tt('DMF coverage %')} stroke={BLUE} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              <ReferenceLine yAxisId="l" y={95} stroke={AMBER} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed amber = 95 quality target · M6 dip from B2B upstream outage')}</div>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-6">
            <Panel title={tt('Incident volume area · 6 months')}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={INCIDENT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="p2"       name={tt('P2')}      stroke={AMBER}  fill={AMBER}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="p3"       name={tt('P3')}      stroke={BLUE}   fill={BLUE}   fillOpacity={0.2} />
                  <Area type="monotone" dataKey="resolved" name={tt('Resolved')} stroke={GREEN} fill={GREEN}  fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Pass rate trend · 30 days')}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={RUNS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis domain={[97, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={99} stroke={GREEN} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="pass" name={tt('Pass %')} stroke={BLUE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="mt-4">
          <Panel title={tt('Incident MTTR area · monthly resolution performance')}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={INCIDENT_TREND.map((m, i) => ({ ...m, mttr: [3.8, 3.2, 4.1, 2.9, 2.6, 2.4][i] }))}>              
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} unit="h" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="mttr" name={tt('MTTR (h)')} stroke={NAVY} fill={NAVY} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/cost" className="text-vfes-dark hover:underline">{tt('Cost →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}

      {/* ══════════════ MOBILE DMFs ══════════════════════════════════════════ */}
      {tab === 'mobile' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Mobile DMFs')}      value="8"     delta={tt('all active')}               trend="flat" icon={Smartphone}   accent />
          <KpiCard label={tt('Avg pass rate')}    value="99.7%" delta={tt('above 99.4% floor')}        trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Closest to threshold')} value="2" delta="mnp_porttime · iot_event_drop" trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Mobile objects')}  value="42"    delta={tt('covered by ≥1 DMF')}         trend="up"   icon={Database}     />
        </div>

        <Panel title={tt('Mobile / RAN DMFs')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('8 mobile DMFs · 99.7% avg pass')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('DMF')}</th><th>{tt('Target')}</th><th>{tt('Check')}</th>
                <th>{tt('Threshold')}</th><th>{tt('Measured')}</th><th>{tt('Pass %')}</th><th>{tt('Owner')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_DMF.map((d) => (
                <tr key={d.dmf} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{d.dmf}</td>
                  <td className="font-mono text-xs text-vfes-dark/65">{d.target}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(d.check)}</td>
                  <td className="font-mono text-xs">{d.threshold}</td>
                  <td className="font-mono text-xs">{d.measured}</td>
                  <td className={`font-mono text-xs font-bold ${d.passing >= 99.5 ? 'text-emerald-600' : d.passing >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{d.passing.toFixed(1)}%</td>
                  <td className="text-[11px]">{tt(d.owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('All 8 mobile DMFs ≥ 99.4% pass rate. mnp_porttime_sla and iot_event_drop are the closest to threshold — under monitoring.')}</div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Mobile DMF pass rates')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOBILE_DMF.map(d => ({ name: d.dmf.slice(0, 16), rate: d.passing }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[98, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <ReferenceLine y={99.4} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'floor 99.4%', fontSize: 9, fill: AMBER }} />
                <Bar dataKey="rate" name={tt('Pass %')} radius={[3,3,0,0]}>
                  {MOBILE_DMF.map((d, i) => <Cell key={i} fill={d.passing >= 99.5 ? GREEN : d.passing >= 99 ? BLUE : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Mobile DMF governance · Snowflake integration')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Network KPI quality contract link')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Mobile DMFs are attached to the same objects covered by NETWORK_KPI_CONTRACT_v4. Any DMF failure automatically triggers contract breach assessment.')}</div>
                <Link to="/portal/data-contracts" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Data contracts →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('AI model quality gates')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('ML models in the Model Registry subscribe to DMF pass signals. A DMF fail on training data automatically suspends model refresh and opens a quality gate.')}</div>
                <Link to="/portal/ml-registry" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('ML Registry →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Cortex Analyst semantic view protection')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Semantic views on mobile data are flagged stale if DMF freshness fails. Cortex Analyst returns a quality warning to users when this happens.')}</div>
                <Link to="/portal/semantic-views" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Semantic Views →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('Horizon data quality classification')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Horizon auto-tags objects with DATA_QUALITY_STATUS based on DMF results — consumers can filter the catalog by quality tier.')}</div>
                <Link to="/portal/horizon" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Horizon →')}</Link>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <Link to="/portal/caio" className="text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/ml-registry" className="text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
        </div>
      </>)}

      <div className="mt-6 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <ShieldCheck className="w-3 h-3" /> {tt('source: SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS · DMF · dbt run_results · refreshed every 15 min')}
      </div>

      <div className="mt-2">
        <Panel title={tt('Quality programme · key milestones')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { milestone: tt('DMF coverage 85%'), target: 'Q4-2025', status: 'on-track', detail: tt('Current 78% · +16 pp YTD') },
              { milestone: tt('Quality score 97'),  target: 'Q1-2026', status: 'on-track', detail: tt('Current 94.2 · +3.2 YTD') },
              { milestone: tt('Zero P2 incidents'), target: 'Q2-2026', status: 'watch',    detail: tt('INC-2031 P2 open now') },
              { milestone: tt('100% contract SLA'), target: 'Q3-2026', status: 'on-track', detail: tt('8/8 contracts · 6/8 above SLO') },
            ].map(m => (
              <div key={m.milestone} className="p-3 border border-black/5 rounded-xl">
                <div className="text-[11px] font-bold mb-0.5">{m.milestone}</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('Target')} {m.target}</div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${m.status === 'on-track' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(m.status)}</span>
                <div className="text-[10px] text-vfes-dark/45 mt-0.5">{m.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-2 rounded-xl bg-gradient-to-br from-vfes-red/5 to-transparent border border-vfes-red/10 p-3 flex items-center justify-between">
        <div className="text-[11px] text-vfes-dark/65">{tt('Full quality programme roadmap · stewardship assignments · domain owners · all managed in CDO governance portal.')}</div>
        <Link to="/portal/cdo" className="text-[10px] font-bold text-vfes-dark hover:underline shrink-0 ml-4">{tt('CDO dashboard →')}</Link>
      </div>

      <div className="mt-2 text-[10px] text-vfes-dark/35 uppercase tracking-widest">
        {tt('Quality status refreshes every 15 min from SNOWFLAKE.DATA_QUALITY_MONITORING_RESULTS · DMF attachments managed via ALTER TABLE SQL or Snowflake Horizon UI · incident workflow integrated with PagerDuty and Slack #data-oncall')}
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
        <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
        <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
        <Link to="/portal/semantic-views" className="text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
        <Link to="/portal/observability" className="text-vfes-dark hover:underline">{tt('Observability →')}</Link>
        <Link to="/portal/cdo" className="text-vfes-dark hover:underline">{tt('CDO →')}</Link>
        <Link to="/portal/ml-registry" className="text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
      </div>
    </div>
  )
}
