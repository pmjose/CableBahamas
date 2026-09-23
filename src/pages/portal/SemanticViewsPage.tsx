import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Eye, CheckCircle2, Smartphone, Database, Activity, TrendingUp, Users,
  Layers, Bell, GitBranch, Clock, ShieldCheck, AlertTriangle, Brain,
} from 'lucide-react'
import { MOBILE_SEMANTIC_VIEWS } from './_mobile_data'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine, Cell, PieChart, Pie, ComposedChart,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const VIEWS = [
  { name: 'CUSTOMER_360_SV', fqn: 'CBL_ANALYTICS.SEMANTIC.CUSTOMER_360_SV', tables: 6, dim: 38, fact: 12, metric: 24, vqr: 86, cov: 94, steward: "Anna Knowles",  calls_day: 3840, accuracy: 96, state: 'certified' },
  { name: 'PRODUCT_360_SV',  fqn: 'CBL_ANALYTICS.SEMANTIC.PRODUCT_360_SV',  tables: 4, dim: 22, fact: 8,  metric: 18, vqr: 42, cov: 90, steward: 'Niels Bodart',     calls_day: 1420, accuracy: 94, state: 'certified' },
  { name: 'B2B_360_SV',      fqn: 'CBL_ANALYTICS.SEMANTIC.B2B_360_SV',      tables: 5, dim: 24, fact: 10, metric: 20, vqr: 38, cov: 88, steward: 'B2B Sales Ops',   calls_day: 980,  accuracy: 92, state: 'certified' },
  { name: 'PEOPLE_360_SV',   fqn: 'CBL_ANALYTICS.SEMANTIC.PEOPLE_360_SV',   tables: 3, dim: 18, fact: 6,  metric: 14, vqr: 24, cov: 92, steward: 'People Ops',      calls_day: 420,  accuracy: 95, state: 'certified' },
  { name: 'EXEC_360_SV',     fqn: 'CBL_ANALYTICS.SEMANTIC.EXEC_360_SV',     tables: 8, dim: 28, fact: 12, metric: 32, vqr: 64, cov: 96, steward: 'CFO office',       calls_day: 2100, accuracy: 97, state: 'certified' },
  { name: 'RISK_360_SV',     fqn: 'CBL_ANALYTICS.SEMANTIC.RISK_360_SV',     tables: 4, dim: 16, fact: 8,  metric: 14, vqr: 18, cov: 90, steward: 'CRO office',       calls_day: 640,  accuracy: 93, state: 'certified' },
  { name: 'PROCURE_360_SV',  fqn: 'CBL_ANALYTICS.SEMANTIC.PROCURE_360_SV',  tables: 4, dim: 14, fact: 6,  metric: 12, vqr: 12, cov: 78, steward: 'Procurement',      calls_day: 280,  accuracy: 88, state: 'pilot'     },
  { name: 'NETWORK_KPI_SV',  fqn: 'CBL_ANALYTICS.SEMANTIC.NETWORK_KPI_SV',  tables: 6, dim: 24, fact: 10, metric: 22, vqr: 28, cov: 88, steward: 'Network ops',      calls_day: 1260, accuracy: 91, state: 'certified' },
]

const METRICS_C360 = [
  { n: 'subscriber_count',  expr: 'COUNT(DISTINCT customer_id)',                    tables: 'CUSTOMER_360',              type: 'fact' },
  { n: 'arpu_monthly',      expr: 'AVG(arpu_m)',                                    tables: 'FACT_BILLING',              type: 'fact' },
  { n: 'churn_rate_30d',    expr: 'AVG(CASE WHEN churn_30d THEN 1 ELSE 0 END)',     tables: 'CUSTOMER_360 + CHURN_DAILY', type: 'fact' },
  { n: 'clv_36m_avg',       expr: 'AVG(clv_36m)',                                   tables: 'CLV_SEGMENT_FACT',          type: 'fact' },
  { n: 'gross_adds',        expr: 'COUNT(*) WHERE activated',                       tables: 'FACT_ACTIVATIONS',          type: 'fact' },
  { n: 'net_adds',          expr: 'gross_adds − churn_count',                       tables: 'derived',                   type: 'derived' },
  { n: 'nps',               expr: 'AI_AGG(nps_response)',                           tables: 'FACT_NPS',                  type: 'ai' },
  { n: 'ftth_penetration',  expr: 'ftth_subs / total_subs',                         tables: 'CUSTOMER_360',              type: 'derived' },
  { n: 'churn_risk_avg',    expr: 'AVG(churn_risk_30d)',                             tables: 'CUSTOMER_360',              type: 'fact' },
  { n: 'bundle_mix_ftth',   expr: 'COUNT(*) WHERE bundle = "FTTH" / total',         tables: 'CUSTOMER_360',              type: 'derived' },
  { n: 'data_usage_avg_gb', expr: 'AVG(data_usage_gb)',                             tables: 'FACT_USAGE',                type: 'fact' },
  { n: 'contract_renewal',  expr: 'SUM(CASE WHEN renewed_30d THEN 1 ELSE 0 END)',   tables: 'FACT_CONTRACTS',            type: 'fact' },
]

const VQRS = [
  { q: 'top 10 churn-risk customers in Freeport last week',        sql: "SELECT * FROM CUSTOMER_360 WHERE region='Freeport' AND churn_risk_30d>0.6 ORDER BY churn_risk_30d DESC LIMIT 10", accuracy: 'verified', calls: 284 },
  { q: 'arpu by bundle and region',                            sql: 'SELECT bundle, region, AVG(arpu_m) … GROUP BY 1,2',                                                           accuracy: 'verified', calls: 196 },
  { q: 'net adds last 12 months by month',                     sql: "SELECT DATE_TRUNC('month', date), gross_adds − churn_count …",                                                accuracy: 'verified', calls: 142 },
  { q: 'compare ftth vs hfc churn',                            sql: 'SELECT access_tech, AVG(churn_30d) FROM CUSTOMER_360 GROUP BY 1',                                             accuracy: 'verified', calls: 118 },
  { q: 'lapsed contracts due in next 90 days',                 sql: 'SELECT customer_id … WHERE contract_end BETWEEN CURRENT_DATE AND CURRENT_DATE+90',                            accuracy: 'verified', calls: 88  },
  { q: 'top revenue segments by CLV tier',                     sql: 'SELECT clv_tier, SUM(arpu_m*12) FROM CUSTOMER_360 GROUP BY 1 ORDER BY 2 DESC',                                accuracy: 'verified', calls: 74  },
  { q: 'NPS score by region last 30 days',                     sql: 'SELECT region, AI_AGG(nps_response) FROM FACT_NPS WHERE … GROUP BY 1',                                        accuracy: 'verified', calls: 62  },
]

const DIMENSIONS_C360 = [
  { name: 'customer_id',      type: 'VARCHAR(64)',  table: 'CUSTOMER_360',  pk: true,  pii: false },
  { name: 'segment',          type: 'VARCHAR',      table: 'CUSTOMER_360',  pk: false, pii: false },
  { name: 'region',           type: 'VARCHAR',      table: 'CUSTOMER_360',  pk: false, pii: false },
  { name: 'bundle',           type: 'VARCHAR',      table: 'CUSTOMER_360',  pk: false, pii: false },
  { name: 'access_tech',      type: 'VARCHAR',      table: 'CUSTOMER_360',  pk: false, pii: false },
  { name: 'contract_type',    type: 'VARCHAR',      table: 'DIM_CONTRACT',  pk: false, pii: false },
  { name: 'email',            type: 'VARCHAR(255)', table: 'CUSTOMER_360',  pk: false, pii: true  },
  { name: 'clv_tier',         type: 'VARCHAR',      table: 'CLV_SEGMENT',   pk: false, pii: false },
]

const CALL_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29-i}`,
  calls: Math.round(7800 + Math.sin(i / 3) * 900 + i * 14),
  vqr_hits: Math.round(5200 + Math.sin(i / 3.5) * 600 + i * 10),
}))

const ACCURACY_TREND = [
  { m: 'Jan', acc: 91.2, vqr: 72 }, { m: 'Feb', acc: 92.4, vqr: 74 },
  { m: 'Mar', acc: 93.1, vqr: 78 }, { m: 'Apr', acc: 93.8, vqr: 82 },
  { m: 'May', acc: 94.3, vqr: 86 }, { m: 'Jun', acc: 94.6, vqr: 90 },
]

const VIEW_CALLS_BAR = VIEWS.map(v => ({ name: v.name.replace('_SV','').replace('_360','360'), calls: v.calls_day, accuracy: v.accuracy }))

const VIEW_COVERAGE_PIE = [
  { name: 'Certified',  value: 7, color: GREEN  },
  { name: 'Pilot',      value: 1, color: AMBER  },
]

const METRIC_TYPE_PIE = [
  { name: 'Fact',    value: 9,  color: BLUE   },
  { name: 'Derived', value: 3,  color: PURPLE },
  { name: 'AI',      value: 1,  color: GREEN  },
]

const VQR_CALLS_BAR = VQRS.map(v => ({ q: v.q.slice(0, 28), calls: v.calls }))

type TabId = 'overview' | 'registry' | 'metrics' | 'dimensions' | 'vqr' | 'accuracy' | 'usage' | 'governance'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',          icon: Activity    },
  { id: 'registry',    label: 'View registry',     icon: Database    },
  { id: 'metrics',     label: 'Metrics',           icon: TrendingUp  },
  { id: 'dimensions',  label: 'Dimensions',        icon: Layers      },
  { id: 'vqr',         label: 'Verified queries',  icon: CheckCircle2 },
  { id: 'accuracy',    label: 'Accuracy',          icon: ShieldCheck },
  { id: 'usage',       label: 'Usage & calls',     icon: Eye         },
  { id: 'governance',  label: 'Governance',        icon: GitBranch   },
]

export default function SemanticViewsPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [selected, setSelected] = useState('CUSTOMER_360_SV')
  const [metricTypeFilter, setMetricTypeFilter] = useState<string>('all')
  const [vqrViewFilter, setVqrViewFilter] = useState<string>('CUSTOMER_360_SV')
  const [sortCol, setSortCol] = useState<'calls_day' | 'accuracy' | 'vqr'>('calls_day')
  const [accuracyWindow, setAccuracyWindow] = useState<3 | 6>(6)
  const [dimFilter, setDimFilter] = useState<'all' | 'pii' | 'pk'>('all')

  const selectedView = useMemo(() => VIEWS.find(v => v.name === selected) ?? VIEWS[0], [selected])

  const sortedViews = useMemo(
    () => [...VIEWS].sort((a, b) => b[sortCol] - a[sortCol]),
    [sortCol],
  )

  const filteredMetrics = useMemo(
    () => metricTypeFilter === 'all' ? METRICS_C360 : METRICS_C360.filter(m => m.type === metricTypeFilter),
    [metricTypeFilter],
  )

  const filteredDimensions = useMemo(
    () => {
      if (dimFilter === 'pii') return DIMENSIONS_C360.filter(d => d.pii)
      if (dimFilter === 'pk')  return DIMENSIONS_C360.filter(d => d.pk)
      return DIMENSIONS_C360
    },
    [dimFilter],
  )

  const accuracySlice = useMemo(
    () => ACCURACY_TREND.slice(ACCURACY_TREND.length - accuracyWindow),
    [accuracyWindow],
  )

  const vqrFiltered = useMemo(
    () => vqrViewFilter === 'all' ? VQRS : VQRS,
    [vqrViewFilter],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Cortex Analyst · semantic views')}
        subtitle={tt('text-to-SQL · 8 views · 156 metrics · 312 verified queries · stewarded')}
        actions={
          <Link to="/portal/data-quality" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {tt('Data Quality')}
          </Link>
        }
      />

      {/* ── ML / AI section ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Semantic layer intelligence"
        models={[
          { name: 'VQR Accuracy Judge',      metric: 'F1 0.96',   sub: '312 VQRs · LLM eval suite' },
          { name: 'Query Intent Classifier', metric: 'acc 0.94',  sub: 'routes NL to correct view'  },
          { name: 'Metric Coverage Model',   metric: 'recall 0.92', sub: 'suggests missing metrics' },
        ]}
        agentLabel={tt('Run Semantic Audit')}
        agentRunningLabel={tt('Auditing semantic models…')}
        agentSteps={[
          tt('Loaded 8 semantic views · 156 metrics · 312 VQRs'),
          tt('Ran accuracy evaluation suite on all VQRs against golden dataset'),
          tt('Identified 14 metrics with no VQR coverage — candidate for seeding'),
          tt('Flagged PROCURE_360_SV coverage at 78% — below 85% target'),
        ]}
        agentBlurb={tt('Snowflake Cortex Analyst runs the semantic layer. An LLM judge evaluates every VQR monthly against a golden SQL dataset so accuracy claims are always backed by automated evidence.')}
        decision={{
          title: tt('Seed 14 missing VQRs in PROCURE_360_SV and promote to certified'),
          detail: tt('PROCURE_360_SV is the only pilot-status view. Its 78% coverage score and 12 VQRs are both below the certification threshold (85% / 20 VQRs). Seeding with the top 14 candidate questions would close the gap and unlock procurement self-serve analytics for 4 teams.'),
          impact: tt('unblocks procurement analytics · 4 teams · estimated 80 hours/month saved'),
          risk: tt('Steward (Procurement) must review and certify the seeded VQRs before promotion'),
          linkTo: '/portal/semantic-views',
          linkLabel: tt('Open Semantic Views →'),
        }}
        chart={{
          kind: 'line',
          title: tt('Cortex Analyst accuracy trend · avg across all certified views (%)'),
          xKey: 'm',
          unit: '%',
          data: ACCURACY_TREND,
          series: [
            { key: 'acc', name: tt('Accuracy %'),  color: GREEN },
            { key: 'vqr', name: tt('VQRs (count)'), color: BLUE, dashed: true },
          ],
          note: tt('Accuracy improving as VQR corpus grows. Target 96% by Q4.'),
        }}
        registryNote={tt('Trained on VQR golden dataset. Served from Model Registry. Accuracy judged by Snowflake Cortex AI Complete via GPT-4o evaluation.')}
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

      <div className="mt-1 text-[10px] text-vfes-dark/35 uppercase tracking-widest">{tt('Semantic views governed via tln-semantic-models GitHub repo · CI validates YAML schema on PR · accuracy suite runs nightly via Snowflake Task')}</div>

      {/* ══════════════ OVERVIEW ═════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Semantic views')}    value="8"    delta={tt('7 certified · 1 pilot')}   trend="up"   icon={Database}    accent />
          <KpiCard label={tt('Metrics')}           value="156"  delta="+12 QoQ"                       trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Verified queries')}  value="312"  delta="+48 QoQ"                       trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Avg accuracy 30d')}  value="94%"  delta={tt('target 96% Q4')}           trend="up"   icon={ShieldCheck} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('API calls / day')}  value="8.2K" delta="+18% MoM"                       trend="up"   icon={Activity}    />
          <KpiCard label={tt('Dimensions')}       value="184"  delta={tt('across 8 views')}           trend="flat" icon={Layers}      />
          <KpiCard label={tt('AI metrics (AGG)')} value="12"   delta={tt('AI_AGG powered')}           trend="up"   icon={Brain}       />
          <KpiCard label={tt('Uncovered metrics')} value="14"  delta={tt('no VQR · PROCURE_360')}     trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-8">
            <Panel title={tt('Daily API call volume · 30 days')}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={CALL_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="calls"    name={tt('Total calls')} stroke={BLUE}   fill={BLUE}   fillOpacity={0.2} />
                  <Area type="monotone" dataKey="vqr_hits" name={tt('VQR hits')}    stroke={GREEN}  fill={GREEN}  fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-4 space-y-4">
            <Panel title={tt('View certification status')}>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={VIEW_COVERAGE_PIE} dataKey="value" innerRadius={30} outerRadius={50} paddingAngle={3}>
                    {VIEW_COVERAGE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
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
            <Panel title={tt('Calls per day by view')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={VIEW_CALLS_BAR} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="calls" name={tt('Calls/day')} fill={BLUE} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('Accuracy trend · 6 months (%)')}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ACCURACY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis domain={[88, 98]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={96} stroke={AMBER} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="acc" name={tt('Accuracy %')} stroke={GREEN} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Eye className="w-3 h-3" />
          {tt('source: CBL_ANALYTICS.SEMANTIC.* · CORTEX_ANALYST_REQUESTS · evaluation suite')} ·
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Cortex Analyst · how it works')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '1', action: tt('Natural language input'), detail: tt('User types question in plain English or Bahamian in any Snowflake app or agent') },
                { step: '2', action: tt('Intent classification'),  detail: tt('Query Intent Classifier routes to the correct semantic view based on topic') },
                { step: '3', action: tt('VQR lookup'),             detail: tt('Cortex Analyst checks verified queries first — returns pre-validated SQL for known questions') },
                { step: '4', action: tt('SQL generation'),         detail: tt('For novel questions, LLM generates SQL using the semantic model (dims + metrics + relationships)') },
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

        <div className="mt-4">
          <Panel title={tt('Semantic view summary table')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('View')}</th>
                  <th className="text-right">{tt('Metrics')}</th>
                  <th className="text-right">{tt('VQRs')}</th>
                  <th className="text-right">{tt('Coverage %')}</th>
                  <th className="text-right">{tt('Calls/day')}</th>
                  <th className="text-left">{tt('State')}</th>
                </tr>
              </thead>
              <tbody>
                {VIEWS.map((v) => (
                  <tr key={v.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{v.name}</td>
                    <td className="text-right font-mono">{v.metric}</td>
                    <td className="text-right font-mono">{v.vqr}</td>
                    <td className={`text-right font-bold font-mono ${v.cov >= 90 ? 'text-emerald-600' : v.cov >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{v.cov}%</td>
                    <td className="text-right font-mono">{v.calls_day.toLocaleString()}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.state === 'certified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(v.state)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ VIEW REGISTRY ════════════════════════════════════════ */}
      {tab === 'registry' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['calls_day', 'accuracy', 'vqr'] as const).map(k => (
            <button key={k} onClick={() => setSortCol(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sortCol === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(k === 'calls_day' ? 'Calls/day' : k === 'accuracy' ? 'Accuracy' : 'VQRs')}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Semantic views')}   value="8"    delta={tt('7 certified')}              trend="flat" icon={Database}    accent />
          <KpiCard label={tt('Total tables')}     value="40"   delta={tt('unique · across all views')} trend="flat" icon={Layers}      />
          <KpiCard label={tt('Stewards')}         value="8"    delta={tt('one per view')}             trend="flat" icon={Users}       />
          <KpiCard label={tt('FQN prefix')}       value="CBL_ANALYTICS.SEMANTIC" delta={tt('all views')} trend="flat" icon={Database} />
        </div>

        <Panel title={tt('Semantic view registry · all views')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('View')}</th>
                <th className="text-left">{tt('FQN')}</th>
                <th className="text-right">{tt('Tables')}</th>
                <th className="text-right">{tt('Dims')}</th>
                <th className="text-right">{tt('Metrics')}</th>
                <th className="text-right">{tt('VQRs')}</th>
                <th className="text-right">{tt('Coverage %')}</th>
                <th className="text-right">{tt('Calls/d')}</th>
                <th className="text-right">{tt('Accuracy')}</th>
                <th className="text-left">{tt('State')}</th>
                <th className="text-left">{tt('Steward')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedViews.map((v) => (
                <tr key={v.name} className={`border-b border-black/5 cursor-pointer hover:bg-[#fafbfc] ${selected === v.name ? 'bg-vfes-red/5' : ''}`}
                  onClick={() => setSelected(v.name)}>
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{tt(v.name)}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{v.fqn}</td>
                  <td className="text-right font-mono">{v.tables}</td>
                  <td className="text-right font-mono">{v.dim}</td>
                  <td className="text-right font-mono">{v.metric}</td>
                  <td className="text-right font-mono">{v.vqr}</td>
                  <td className={`text-right font-bold font-mono ${v.cov >= 90 ? 'text-emerald-600' : v.cov >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{v.cov}%</td>
                  <td className="text-right font-mono">{v.calls_day.toLocaleString()}</td>
                  <td className={`text-right font-bold font-mono ${v.accuracy >= 93 ? 'text-emerald-600' : v.accuracy >= 88 ? 'text-amber-600' : 'text-red-600'}`}>{v.accuracy}%</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.state === 'certified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(v.state)}</span>
                  </td>
                  <td className="text-[10px]">{v.steward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Mobile / RAN semantic views')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('6 views · 5 certified')}</span>}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('View')}</th><th>{tt('Tables')}</th><th>{tt('Dimensions')}</th>
                  <th>{tt('Metrics')}</th><th>{tt('Owner')}</th><th>{tt('Certified')}</th><th>{tt('Consumers')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_SEMANTIC_VIEWS.map((v) => (
                  <tr key={v.name} className="border-t border-black/5">
                    <td className="py-2 font-mono text-xs font-semibold">{v.name}</td>
                    <td className="font-mono text-xs">{v.tables}</td>
                    <td className="font-mono text-xs">{v.dimensions}</td>
                    <td className="font-mono text-xs">{v.metrics}</td>
                    <td className="text-[11px] text-vfes-dark/65">{tt(v.owner)}</td>
                    <td>{v.certified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{tt('pilot')}</span>}</td>
                    <td className="font-mono text-xs">{v.consumers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('V_MOBILE_CUSTOMER_360 has 124 consumers — most-used mobile semantic view. V_OPEN_RAN_KPIS still pilot — to be certified once Open RAN moves to GA.')}</div>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
          <Link to="/portal/data-products" className="text-vfes-dark hover:underline">{tt('Data products →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('View coverage vs accuracy scatter')}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={VIEWS.map(v => ({ name: v.name.replace('_360_SV','360').replace('_SV',''), coverage: v.cov, accuracy: v.accuracy, calls: v.calls_day }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="l" domain={[70, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="coverage"  name={tt('Coverage %')} fill={BLUE} radius={[3,3,0,0]}>
                  {VIEWS.map((v, i) => <Cell key={i} fill={v.cov >= 90 ? GREEN : v.cov >= 80 ? BLUE : AMBER} />)}
                </Bar>
                <Line yAxisId="l" type="monotone" dataKey="accuracy" name={tt('Accuracy %')} stroke={PURPLE} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Registry governance links')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: '/portal/data-quality',   label: tt('Data Quality'),    desc: tt('DMF coverage on semantic view tables')         },
                { to: '/portal/data-contracts', label: tt('Data Contracts'),  desc: tt('Contract per view — SLA + schema versioning')   },
                { to: '/portal/catalog',        label: tt('Catalog'),         desc: tt('Views indexed with metrics + dimensions')       },
                { to: '/portal/lineage',        label: tt('Lineage'),         desc: tt('Source-to-semantic-view lineage graph')         },
                { to: '/portal/horizon',        label: tt('Horizon'),         desc: tt('PII masking + governance at query time')        },
                { to: '/portal/rbac',           label: tt('RBAC'),            desc: tt('Consumer access gated by role per view')        },
                { to: '/portal/agents',         label: tt('Agents'),          desc: tt('Cortex Agents powered by these views')          },
                { to: '/portal/ai-insights',    label: tt('AI Insights'),     desc: tt('AI_AGG metrics · Cortex AI Complete')           },
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

      {/* ══════════════ METRICS ══════════════════════════════════════════════ */}
      {tab === 'metrics' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Type:')}</span>
          {['all', 'fact', 'derived', 'ai'].map(t => (
            <button key={t} onClick={() => setMetricTypeFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${metricTypeFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(t)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total metrics')}    value="156"  delta="+12 QoQ"                      trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Fact metrics')}     value="108"  delta={tt('count / avg / sum based')} trend="flat" icon={Layers}      />
          <KpiCard label={tt('Derived metrics')}  value="36"   delta={tt('computed from facts')}     trend="up"   icon={Activity}    />
          <KpiCard label={tt('AI metrics')}       value="12"   delta={tt('AI_AGG powered')}          trend="up"   icon={Brain}       />
        </div>

        <Panel title={`${tt('Metrics')} · ${selectedView.name}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-vfes-dark/55">{tt('View:')}</span>
            {VIEWS.map(v => (
              <button key={v.name} onClick={() => setSelected(v.name)}
                className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${selected === v.name ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {v.name.replace('_SV','').replace('_360','360')}
              </button>
            ))}
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Metric')}</th>
                <th className="text-left">{tt('Expression')}</th>
                <th className="text-left">{tt('Tables')}</th>
                <th className="text-left">{tt('Type')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((m) => (
                <tr key={m.n} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold">{m.n}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{m.expr}</td>
                  <td className="text-[10px]">{m.tables}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${m.type === 'ai' ? 'bg-purple-100 text-purple-700' : m.type === 'derived' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{tt(m.type)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Metric type distribution')}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={METRIC_TYPE_PIE} dataKey="value" innerRadius={35} outerRadius={60} paddingAngle={3}>
                  {METRIC_TYPE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Metric counts by view · overview')}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={VIEWS.map(v => ({ name: v.name.replace('_360_SV','360').replace('_SV',''), metric: v.metric, fact: v.fact, dim: v.dim }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="metric" name={tt('Metrics')} fill={BLUE} stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="fact"   name={tt('Facts')}   fill={GREEN} stackId="a" />
                <Bar dataKey="dim"    name={tt('Dims')}    fill={AMBER}  stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/ml-registry" className="text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('AI metric highlight · AI_AGG powered by Cortex AI')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('AI_AGG(nps_response)')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Cortex AI Complete aggregates free-text NPS responses into a numeric NPS score. No manual coding — the model reads every response.')}</div>
                <Link to="/portal/ai-insights" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('AI Insights →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('AI_SENTIMENT(support_notes)')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('Sentiment score derived from CX support ticket notes. Powers churn_risk_sentiment dimension in CUSTOMER_360_SV.')}</div>
                <Link to="/portal/cortex-search" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Cortex Search →')}</Link>
              </div>
              <div className="p-3 border border-black/5 rounded-lg">
                <div className="font-semibold mb-1">{tt('AI_SUMMARIZE_AGG(contract_notes)')}</div>
                <div className="text-[11px] text-vfes-dark/65">{tt('B2B_360_SV uses AI_SUMMARIZE_AGG to produce a monthly contract health narrative from raw account notes.')}</div>
                <Link to="/portal/agents" className="text-[10px] text-vfes-dark font-bold mt-1 block">{tt('Agents →')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ DIMENSIONS ══════════════════════════════════════════ */}
      {tab === 'dimensions' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'pii', 'pk'] as const).map(f => (
            <button key={f} onClick={() => setDimFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${dimFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f === 'all' ? 'All' : f === 'pii' ? 'PII only' : 'PK only')}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total dimensions')} value="184"  delta={tt('across 8 views')}          trend="flat" icon={Layers}      accent />
          <KpiCard label={tt('PII dimensions')}   value="6"    delta={tt('all masked via Horizon')}  trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Primary keys')}     value="8"    delta={tt('one per view')}            trend="flat" icon={Database}    />
          <KpiCard label={tt('Join-able PKs')}    value="8"    delta={tt('cross-view joins enabled')} trend="up"  icon={GitBranch}   />
        </div>

        <Panel title={`${tt('Dimensions')} · ${selectedView.name}`}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Dimension')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-left">{tt('Table')}</th>
                <th className="text-left">{tt('PK')}</th>
                <th className="text-left">{tt('PII')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDimensions.map((d) => (
                <tr key={d.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono font-semibold">{d.name}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{d.type}</td>
                  <td className="text-[10px]">{d.table}</td>
                  <td>{d.pk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="text-[10px] text-vfes-dark/30">—</span>}</td>
                  <td>{d.pii ? <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-100 text-red-700">{tt('pii')}</span> : <span className="text-[10px] text-vfes-dark/30">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Dimension counts by view')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={VIEWS.map(v => ({ name: v.name.replace('_360_SV','360').replace('_SV',''), dim: v.dim }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="dim" name={tt('Dimensions')} radius={[3,3,0,0]}>
                  {VIEWS.map((v, i) => <Cell key={i} fill={v.dim >= 30 ? BLUE : v.dim >= 20 ? NAVY : SLATE} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Cross-view join capability · shared dimensions')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Shared dimension')}</th>
                  <th className="text-left">{tt('Views using it')}</th>
                  <th className="text-left">{tt('Join type')}</th>
                  <th className="text-left">{tt('Notes')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dim: 'customer_id',   views: 'C360, CHURN, EXEC, RISK', join: 'INNER', note: 'Primary key · unique in DIM_CUSTOMER' },
                  { dim: 'region',        views: 'C360, PRODUCT, B2B, EXEC', join: 'INNER', note: 'Normalised via DIM_REGION' },
                  { dim: 'bundle',        views: 'C360, PRODUCT, EXEC',      join: 'LEFT',  note: 'nullable · inactive subs = NULL' },
                  { dim: 'clv_tier',      views: 'C360, EXEC, RISK',         join: 'LEFT',  note: 'CLV_SEGMENT_FACT · monthly refresh' },
                  { dim: 'access_tech',   views: 'C360, NETWORK',            join: 'INNER', note: 'FTTH / HFC / Mobile enum' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono font-semibold text-[10px]">{r.dim}</td>
                    <td className="text-[11px]">{r.views}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.join === 'INNER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{r.join}</span></td>
                    <td className="text-[10px] text-vfes-dark/65">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Dimension area · coverage by view')}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={VIEWS.map(v => ({ name: v.name.replace('_360_SV','360').replace('_SV',''), dim: v.dim, fact: v.fact }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="dim"  name={tt('Dimensions')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                <Area type="monotone" dataKey="fact" name={tt('Facts')}      stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-2 text-[10px] text-vfes-dark/35 uppercase tracking-widest">
          {tt('All PII dimensions masked via Snowflake Horizon masking policies · consumers see masked values unless UNMASKED role granted · steward approval required')}
        </div>
      </>)}
      {tab === 'vqr' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {['all', ...VIEWS.map(v => v.name.replace('_360_SV','360').replace('_SV',''))].slice(0,6).map((v, i) => (
            <button key={v} onClick={() => setVqrViewFilter(i === 0 ? 'all' : v)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${vqrViewFilter === (i === 0 ? 'all' : v) ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(v)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Verified queries')}  value="312"   delta="+48 QoQ"                    trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('Avg accuracy')}      value="94%"   delta={tt('target 96% Q4')}        trend="up"   icon={ShieldCheck}  />
          <KpiCard label={tt('Most-called VQR')}   value="284/d" delta={tt('churn risk top 10')}    trend="up"   icon={Activity}     />
          <KpiCard label={tt('VQR hit rate')}      value="63%"   delta={tt('of total API calls')}   trend="up"   icon={TrendingUp}   />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-6">
            <Panel title={tt('Verified queries (VQRs) · Customer 360')}>
              <div className="space-y-2">
                {vqrFiltered.map((v, i) => (
                  <div key={i} className="border border-black/5 rounded p-2 hover:bg-[#fafbfc]">
                    <div className="text-[12px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> "{v.q}"
                      <span className="ml-auto text-[10px] text-vfes-dark/50 font-mono">{v.calls}/d</span>
                    </div>
                    <div className="bg-[#0f172a] text-emerald-200 font-mono text-[10px] rounded p-2 mt-1.5 leading-relaxed">{v.sql}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="col-span-6">
            <Panel title={tt('VQR calls per day')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={VQR_CALLS_BAR} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="q" tick={{ fontSize: 8 }} width={180} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="calls" name={tt('Calls/day')} fill={GREEN} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <Panel title={tt('VQR coverage by view')}>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={VIEWS.map(v => ({ name: v.name.replace('_360_SV','360').replace('_SV',''), vqr: v.vqr }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={TS} />
                      <ReferenceLine y={20} stroke={AMBER} strokeDasharray="3 3" />
                      <Bar dataKey="vqr" name={tt('VQRs')} fill={BLUE} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-4">
          <Panel title={tt('Top-10 VQRs by call volume · all views')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Question')}</th>
                  <th className="text-left">{tt('Status')}</th>
                  <th className="text-right">{tt('Calls/day')}</th>
                </tr>
              </thead>
              <tbody>
                {VQRS.map((v, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 text-[11px]">"{v.q}"</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(v.accuracy)}</span></td>
                    <td className="text-right font-mono font-bold">{v.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/caio" className="text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/agents" className="text-vfes-dark hover:underline">{tt('Agents →')}</Link>
        </div>
      </>)}

      {/* ══════════════ ACCURACY ══════════════════════════════════════════════ */}
      {tab === 'accuracy' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Window:')}</span>
          {([3, 6] as const).map(w => (
            <button key={w} onClick={() => setAccuracyWindow(w)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${accuracyWindow === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(`${w} months`)}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg accuracy 30d')} value="94%"    delta={tt('target 96% Q4')}         trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Best view')}        value="EXEC_360" delta="97% accuracy"              trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Weakest view')}     value="PROCURE" delta={tt('88% · 12 VQRs only')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('YTD improvement')}  value="+3.4 pp" delta="91.2% → 94.6%"             trend="up"   icon={TrendingUp}   />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-7">
            <Panel title={tt('Accuracy trend · selected window')}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={accuracySlice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" domain={[88, 98]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="acc" name={tt('Accuracy %')} stroke={GREEN} strokeWidth={2.4} dot />
                  <Bar  yAxisId="r" dataKey="vqr" name={tt('VQRs')} fill={BLUE} opacity={0.4} />
                  <ReferenceLine yAxisId="l" y={96} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed amber = 96% Q4 target. More VQRs correlate strongly with higher accuracy.')}</div>
            </Panel>
          </div>
          <div className="col-span-5">
            <Panel title={tt('Accuracy by view')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={VIEW_CALLS_BAR} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine x={93} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="accuracy" name={tt('Accuracy %')} radius={[0,3,3,0]}>
                    {VIEW_CALLS_BAR.map((v, i) => <Cell key={i} fill={v.accuracy >= 95 ? GREEN : v.accuracy >= 90 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>

        <div className="mt-4">
          <Panel title={tt('Accuracy area trend · VQR growth vs accuracy correlation')}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={ACCURACY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" domain={[88, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area yAxisId="l" type="monotone" dataKey="acc" name={tt('Accuracy %')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                <Area yAxisId="r" type="monotone" dataKey="vqr" name={tt('VQRs')}       stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/caio" className="text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <Link to="/portal/ml-registry" className="text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
        </div>
      </>)}

      {/* ══════════════ USAGE & CALLS ════════════════════════════════════════ */}
      {tab === 'usage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('API calls / day')}   value="8.2K"  delta="+18% MoM"                   trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('VQR hit rate')}      value="63%"   delta={tt('of total calls')}        trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Unique callers')}    value="284"   delta="+1 242 QoQ"                     trend="up"   icon={Users}       />
          <KpiCard label={tt('Avg latency')}       value="1.8s"  delta="-0.4s QoQ"                  trend="up"   icon={Clock}       />
        </div>

        <Panel title={tt('Daily call volume · 30 days')}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CALL_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="calls"    name={tt('Total calls')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
              <Area type="monotone" dataKey="vqr_hits" name={tt('VQR hits')}   stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Calls per view · leaderboard')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={VIEW_CALLS_BAR} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="calls" name={tt('Calls/day')} fill={BLUE} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Usage line trend · calls vs VQR hits · 30 days')}>
            <ResponsiveContainer width="100%" height={180}>                        
              <LineChart data={CALL_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="calls"    name={tt('Total calls')} stroke={BLUE}  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vqr_hits" name={tt('VQR hits')}   stroke={GREEN} strokeWidth={2} dot={false} />
                <ReferenceLine y={8200} stroke={AMBER} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/cost" className="text-vfes-dark hover:underline">{tt('Cost →')}</Link>
          <Link to="/portal/caio" className="text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/agents" className="text-vfes-dark hover:underline">{tt('Agents →')}</Link>
          <Link to="/portal/cortex-search" className="text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
        </div>
      </>)}

      {/* ══════════════ GOVERNANCE ════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Certified views')}   value="7/8"   delta={tt('PROCURE_360 pilot')}      trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('Stewards assigned')} value="8/8"   delta={tt('all views stewarded')}   trend="up"   icon={Users}        />
          <KpiCard label={tt('PII columns')}       value="6"     delta={tt('all masked via Horizon')} trend="up"   icon={ShieldCheck}  />
          <KpiCard label={tt('Data contracts')}    value="8"     delta={tt('contract per view')}      trend="flat" icon={GitBranch}    />
        </div>

        <Panel title={tt('View stewardship register')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('View')}</th>
                <th className="text-left">{tt('Steward')}</th>
                <th className="text-right">{tt('Coverage %')}</th>
                <th className="text-right">{tt('VQRs')}</th>
                <th className="text-right">{tt('Accuracy')}</th>
                <th className="text-left">{tt('State')}</th>
                <th className="text-left">{tt('Contract')}</th>
              </tr>
            </thead>
            <tbody>
              {VIEWS.map((v) => (
                <tr key={v.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-[10px] font-semibold">{v.name}</td>
                  <td className="text-[11px]">{v.steward}</td>
                  <td className={`text-right font-bold font-mono ${v.cov >= 90 ? 'text-emerald-600' : v.cov >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{v.cov}%</td>
                  <td className="text-right font-mono">{v.vqr}</td>
                  <td className={`text-right font-bold font-mono ${v.accuracy >= 93 ? 'text-emerald-600' : v.accuracy >= 88 ? 'text-amber-600' : 'text-red-600'}`}>{v.accuracy}%</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.state === 'certified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(v.state)}</span>
                  </td>
                  <td className="text-[10px] text-vfes-dark/65">{v.name.replace('_SV','_CONTRACT_v1')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Governance · Snowflake integrations')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              {[
                { to: '/portal/data-quality',   label: tt('Data Quality'),   desc: tt('DMF freshness warns Cortex Analyst on stale views') },
                { to: '/portal/data-contracts', label: tt('Data Contracts'), desc: tt('Each semantic view backed by a producer contract')   },
                { to: '/portal/horizon',        label: tt('Horizon'),        desc: tt('PII masking enforced at semantic layer query time')  },
                { to: '/portal/rbac',           label: tt('RBAC'),           desc: tt('Consumer access gated by role per semantic view')   },
                { to: '/portal/lineage',        label: tt('Lineage'),        desc: tt('Full lineage from source tables → semantic view')   },
                { to: '/portal/catalog',        label: tt('Catalog'),        desc: tt('Semantic views indexed in catalog with metrics')     },
                { to: '/portal/agents',         label: tt('Agents'),         desc: tt('Cortex Agents use semantic views for NL queries')    },
                { to: '/portal/ai-insights',    label: tt('AI Insights'),    desc: tt('AI_AGG metrics powered by Cortex AI')               },
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

        <div className="mt-4 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/cdo" className="text-vfes-dark hover:underline">{tt('CDO →')}</Link>
          <Link to="/portal/caio" className="text-vfes-dark hover:underline">{tt('CAIO →')}</Link>
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <Link to="/portal/rbac" className="text-vfes-dark hover:underline">{tt('RBAC →')}</Link>
        </div>

        <div className="mt-4">
          <Panel title={tt('Certification criteria · semantic view promotion checklist')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Criterion')}</th>
                  <th className="text-right">{tt('Threshold')}</th>
                  <th className="text-left">{tt('PROCURE_360 status')}</th>
                  <th className="text-left">{tt('Other views')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { criterion: tt('Coverage %'),       threshold: '≥85%', proc: '78% ⚠️', others: tt('All ≥88%') },
                  { criterion: tt('VQR count'),        threshold: '≥20',   proc: '12 ⚠️',  others: tt('All ≥18') },
                  { criterion: tt('Accuracy 30d'),     threshold: '≥90%',   proc: '88% ⚠️', others: tt('All ≥91%') },
                  { criterion: tt('Steward assigned'), threshold: tt('Yes'), proc: '✅',       others: '✅'           },
                  { criterion: tt('DMF freshness'),    threshold: tt('Pass'),proc: '✅',       others: '✅'           },
                  { criterion: tt('PII masking'),      threshold: tt('Yes'), proc: '✅',       others: '✅'           },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-black/5">
                    <td className="py-1.5 font-semibold text-[11px]">{r.criterion}</td>
                    <td className="text-right font-mono text-[10px]">{r.threshold}</td>
                    <td className="text-[11px]">{r.proc}</td>
                    <td className="text-[11px] text-emerald-700">{r.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="mt-2 text-[10px] text-vfes-dark/35 uppercase tracking-widest">
          {tt('Semantic views governed via tln-semantic-models repo · CI/CD pipeline validates YAML schema on every PR · accuracy suite runs nightly via Snowflake Task')}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-vfes-dark/50 uppercase tracking-widest font-bold">
          <Link to="/portal/data-quality" className="text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark hover:underline">{tt('Contracts →')}</Link>
          <Link to="/portal/lineage" className="text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
          <Link to="/portal/catalog" className="text-vfes-dark hover:underline">{tt('Catalog →')}</Link>
          <Link to="/portal/horizon" className="text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </>)}

      <div className="mt-6 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Eye className="w-3 h-3" /> {tt('source: CBL_ANALYTICS.SEMANTIC.* · CORTEX_ANALYST_REQUESTS · evaluation suite')}
      </div>

      <div className="mt-2">
        <Panel title={tt('Semantic views programme · milestones')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { milestone: tt('8 views certified'),     target: 'Q4-2025', status: 'watch',    detail: tt('PROCURE_360 at 78% coverage — 7/8 certified') },
              { milestone: tt('VQR count 400+'),        target: 'Q1-2026', status: 'on-track', detail: tt('Current 312 · +48 QoQ') },
              { milestone: tt('Accuracy 96%'),          target: 'Q4-2025', status: 'on-track', detail: tt('Current 94.6% · +3.4 YTD') },
              { milestone: tt('AI metrics 20+'),        target: 'Q2-2026', status: 'on-track', detail: tt('Current 12 · plan adds 8 more') },
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
    </div>
  )
}
