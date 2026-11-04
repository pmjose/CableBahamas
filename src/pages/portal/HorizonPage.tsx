import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  ShieldCheck, Tag, Eye, FileText, Smartphone,
  Activity, TrendingUp, AlertTriangle, CheckCircle2,
  Database, Network, Gauge, Search, RefreshCw, Lock,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, Cell, PieChart, Pie, ComposedChart, ReferenceLine,
} from 'recharts'
import { MOBILE_HORIZON } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const POLICIES = [
  { type: 'Masking',     name: 'mask_email_v2',         applied_to: 14,  scope: 'PII · email',      action: 'partial mask user@***'          },
  { type: 'Masking',     name: 'mask_phone_v2',         applied_to: 12,  scope: 'PII · phone',      action: 'last-4 digits'                  },
  { type: 'Masking',     name: 'mask_iban',             applied_to: 4,   scope: 'PCI',              action: 'tokenize via FPE'               },
  { type: 'Masking',     name: 'mask_msisdn',           applied_to: 8,   scope: 'PII · subscriber', action: 'hash sha-256'                   },
  { type: 'Masking',     name: 'mask_salary',           applied_to: 2,   scope: 'HR sensitive',     action: 'NULL except PEOPLE_HR_BP'       },
  { type: 'Row access',  name: 'rls_region_eu',         applied_to: 6,   scope: 'US vs ROW',        action: 'region IN (USER.region_grant)'  },
  { type: 'Row access',  name: 'rls_b2b_account_owner', applied_to: 3,   scope: 'B2B sales rep',   action: 'owner_id = current_user_email'  },
  { type: 'Row access',  name: 'rls_hr_country',        applied_to: 2,   scope: 'HR by country',    action: 'country_code IN entitlements'   },
  { type: 'Tag-based',   name: 'auto_mask_pii',         applied_to: 248, scope: 'tag:PII',          action: 'all PII columns auto-masked'    },
  { type: 'Aggregation', name: 'agg_min_k_50',          applied_to: 4,   scope: 'public stats',     action: 'min group size 50'              },
]

const TAGS = [
  { name: 'PII',               applied: 248, owner: 'CDO',    steward: "Anna Knowles" },
  { name: 'PCI',               applied: 22,  owner: 'CDO',    steward: "Anna Knowles" },
  { name: 'CONFIDENTIAL',      applied: 412, owner: 'CDO',    steward: "Anna Knowles" },
  { name: 'COST_CENTRE',       applied: 612, owner: 'Finance', steward: 'Thomas Knowles' },
  { name: 'BUSINESS_CRITICAL', applied: 38,  owner: 'CTO',    steward: 'Pieter Knowles'      },
  { name: 'DPA_SUBJECT',      applied: 248, owner: 'DPO',    steward: 'Ann Rolle'    },
  { name: 'CYBER_SCOPE',        applied: 24,  owner: 'CISO',   steward: 'Lars Bethel'       },
  { name: 'DATA_PRODUCT_OWNER',applied: 14,  owner: 'CDO',    steward: "Anna Knowles" },
]

const CLASSIFY = [
  { col: 'CUSTOMER_360.EMAIL',              category: 'PII / IDENTIFIER',       conf: 0.99, system: 'auto · SYSTEM$CLASSIFY' },
  { col: 'CUSTOMER_360.PHONE',              category: 'PII / QUASI_IDENTIFIER', conf: 0.98, system: 'auto · SYSTEM$CLASSIFY' },
  { col: 'CUSTOMER_360.MSISDN',             category: 'PII / IDENTIFIER',       conf: 0.96, system: 'auto + steward'         },
  { col: 'CUSTOMER_360.IBAN',               category: 'PCI',                    conf: 0.99, system: 'custom regex'           },
  { col: 'PEOPLE_360.SALARY',               category: 'HR_SENSITIVE',           conf: 0.99, system: 'manual'                 },
  { col: 'CHURN_LIST_DAILY.CHURN_RISK_30D', category: 'BUSINESS_DERIVED',       conf: 0.95, system: 'auto + steward'         },
  { col: 'NETWORK_EVENTS.CELL_ID',          category: 'INFRASTRUCTURE',         conf: 0.88, system: 'auto · SYSTEM$CLASSIFY' },
  { col: 'MOBILE_LOCATION_LOGS.LAT_LNG',   category: 'PII / LOCATION',         conf: 0.97, system: 'custom regex + steward' },
]

const DMF_MONITORS = [
  { table: 'CUSTOMER_360',      dmf: 'freshness_check',    result: 'pass', last_run: '2026-11-29 02:00', detail: 'lag 18 min — target < 30 min'    },
  { table: 'CUSTOMER_360',      dmf: 'null_rate_email',    result: 'pass', last_run: '2026-11-29 02:00', detail: '0.02% null — threshold 1%'        },
  { table: 'CHURN_LIST_DAILY',  dmf: 'freshness_check',    result: 'pass', last_run: '2026-11-29 01:00', detail: 'lag 0 min — daily job on schedule' },
  { table: 'CHURN_LIST_DAILY',  dmf: 'row_count_check',    result: 'pass', last_run: '2026-11-29 01:00', detail: '14.2M rows — expected ≥12M'        },
  { table: 'PEOPLE_360',        dmf: 'freshness_check',    result: 'warn', last_run: '2026-11-28 00:00', detail: 'lag 26h — threshold 24h'           },
  { table: 'NETWORK_EVENTS',    dmf: 'schema_check',       result: 'pass', last_run: '2026-11-29 05:00', detail: '48 columns match expected schema'  },
  { table: 'RISK_360',          dmf: 'uniqueness_check',   result: 'pass', last_run: '2026-11-29 02:00', detail: 'CUSTOMER_ID: 0 duplicates'         },
  { table: 'EXEC_360_SV',       dmf: 'freshness_check',    result: 'fail', last_run: '2026-11-28 20:00', detail: 'lag 28h — SLA breach · alerting'   },
]

const LINEAGE_COVERAGE = [
  { domain: 'Customer',    tables: 28,  covered: 28,  pct: 100 },
  { domain: 'Finance',     tables: 42,  covered: 40,  pct: 95  },
  { domain: 'Network',     tables: 84,  covered: 72,  pct: 86  },
  { domain: 'HR',          tables: 12,  covered: 12,  pct: 100 },
  { domain: 'AI / ML',     tables: 18,  covered: 14,  pct: 78  },
  { domain: 'Risk',        tables: 22,  covered: 20,  pct: 91  },
  { domain: 'Mobile',      tables: 36,  covered: 28,  pct: 78  },
]

const COMPLIANCE_CONTROLS = [
  { id: 'DPA-1',  framework: 'DPA',     control: 'Data minimisation',                 status: 'pass', score: 94, evidence: 'Column-level masking + RLS enforced' },
  { id: 'DPA-2',  framework: 'DPA',     control: 'Right to be forgotten automation',  status: 'pass', score: 88, evidence: 'Purge proc + Snowflake TTL'          },
  { id: 'DPA-3',  framework: 'DPA',     control: 'Data classification & labelling',   status: 'pass', score: 91, evidence: 'SYSTEM$CLASSIFY + steward review'    },
  { id: 'URCA cyber-1',  framework: 'URCA cyber',     control: 'Data breach notification < 72h',    status: 'pass', score: 100, evidence: 'Automated alert chain active'       },
  { id: 'URCA cyber-2',  framework: 'URCA cyber',     control: 'Supplier risk management',          status: 'warn', score: 72,  evidence: 'Partial — 3rd-party review ongoing'  },
  { id: 'PCI-1',   framework: 'PCI-DSS',  control: 'Cardholder data encryption (FPE)', status: 'pass', score: 100, evidence: 'mask_iban FPE tokenization active'   },
  { id: 'URCA-1',  framework: 'URCA',     control: 'Retention limits for call records', status: 'pass', score: 96,  evidence: 'Storage lifecycle policy active'     },
  { id: 'ODPC-1',   framework: 'ODPC',      control: 'Consent management lineage',        status: 'warn', score: 68,  evidence: 'Lineage gap in consent pipeline'     },
]

const TAG_TREND = [
  { m: 'Jun', pii: 218, pci: 18, confidential: 380, dpa: 218 },
  { m: 'Jul', pii: 224, pci: 19, confidential: 390, dpa: 224 },
  { m: 'Aug', pii: 230, pci: 20, confidential: 396, dpa: 230 },
  { m: 'Sep', pii: 238, pci: 21, confidential: 402, dpa: 238 },
  { m: 'Oct', pii: 242, pci: 21, confidential: 408, dpa: 242 },
  { m: 'Nov', pii: 248, pci: 22, confidential: 412, dpa: 248 },
]

const MATURITY_SCORES = [
  { l: 'Governance maturity',      s: 86, target: 80 },
  { l: 'Observability maturity',   s: 78, target: 75 },
  { l: 'Data quality maturity',    s: 91, target: 90 },
  { l: 'Security posture',         s: 94, target: 90 },
  { l: 'Classification coverage',  s: 91, target: 88 },
]

const ACCESS_LOG = [
  { user: 'pjose',          role: 'ACCOUNTADMIN',     table: 'SNOWFLAKE.HORIZON.TAG_REFERENCES',    action: 'SELECT', rows: 1840,  ts: '2026-11-29 09:14' },
  { user: 'ana.castillo',   role: 'COMPLIANCE_RO',    table: 'SNOWFLAKE.HORIZON.POLICY_REFERENCES', action: 'SELECT', rows: 148,   ts: '2026-11-29 08:40' },
  { user: 'anna.vanpeeters',   role: 'CDO',              table: 'DATA_CLASSIFICATION_LATEST',           action: 'SELECT', rows: 4420,  ts: '2026-11-28 17:22' },
  { user: 'thomas.janssens',  role: 'ANALYST_FINANCE',  table: 'CBL_CORE.FINANCE.GL_FACT',             action: 'SELECT', rows: 82400, ts: '2026-11-28 16:05' },
  { user: 'dbt_prod_svc',   role: 'DBT_PROD',         table: 'CBL_CORE.CUSTOMER.C360_STAGING',       action: 'WRITE',  rows: 2400000, ts: '2026-11-29 01:12' },
  { user: 'luis.garcia',    role: 'ANALYST_NETWORK',  table: 'CBL_RAW.NETWORK.CMTS_EVENTS',          action: 'SELECT', rows: 2800000, ts: '2026-11-29 07:28' },
]

type TabId = 'overview' | 'tags' | 'classification' | 'policies' | 'quality' | 'access-history' | 'lineage' | 'compliance'
const TABS: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'overview',       label: 'Overview',          icon: Gauge        },
  { id: 'tags',           label: 'Tags',               icon: Tag          },
  { id: 'classification', label: 'Classification',     icon: Search       },
  { id: 'policies',       label: 'Policies',           icon: Lock         },
  { id: 'quality',        label: 'Data Quality',       icon: CheckCircle2 },
  { id: 'access-history', label: 'Access History',     icon: Eye          },
  { id: 'lineage',        label: 'Lineage',            icon: Network      },
  { id: 'compliance',     label: 'Compliance',         icon: ShieldCheck  },
]

export default function HorizonPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [tagSearch, setTagSearch] = useState('')
  const [classFilter, setClassFilter] = useState<string>('All')
  const [policyType, setPolicyType] = useState<string>('All')
  const [dmfFilter, setDmfFilter] = useState<string>('All')
  const [compFramework, setCompFramework] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredTags = useMemo(
    () => tagSearch ? TAGS.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())) : TAGS,
    [tagSearch],
  )

  const filteredClassify = useMemo(
    () => classFilter === 'All' ? CLASSIFY : CLASSIFY.filter(c => c.category.startsWith(classFilter)),
    [classFilter],
  )

  const filteredPolicies = useMemo(
    () => policyType === 'All' ? POLICIES : POLICIES.filter(p => p.type === policyType),
    [policyType],
  )

  const filteredDmf = useMemo(
    () => dmfFilter === 'All' ? DMF_MONITORS : DMF_MONITORS.filter(d => d.result === dmfFilter),
    [dmfFilter],
  )

  const filteredCompliance = useMemo(
    () => compFramework === 'All' ? COMPLIANCE_CONTROLS : COMPLIANCE_CONTROLS.filter(c => c.framework === compFramework),
    [compFramework],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Horizon · governance')}
        subtitle={tt('masking · RLS · tags · classification · DMF · lineage · contacts — Snowflake-native')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · 91% classified · ')}{liveTime}
            </span>
            <Link
              to="/portal/cdo"
              className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> {tt('CDO Dashboard')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Governance intelligence"
        models={[
          { name: 'PII Detector',            metric: 'F1 0.97',    sub: 'column-level PII classification'      },
          { name: 'DMF Anomaly Scorer',       metric: 'accuracy 93%', sub: 'data quality drift detection'      },
          { name: 'Lineage Gap Predictor',    metric: 'recall 0.89', sub: 'missing lineage edge detection'     },
        ]}
        agentLabel="Run Governance Audit"
        agentRunningLabel="Auditing…"
        agentSteps={[
          'Scanned all tables for unclassified or mis-classified columns',
          'Identified 128 network telemetry columns lacking PII classification',
          'Checked DMF coverage — EXEC_360_SV has freshness SLA breach',
          'Generated governance report with lineage gap recommendations',
        ]}
        agentBlurb="Snowflake Horizon gives a single control plane for all governance — classification, masking, RLS, tags, and lineage without moving data to an external catalog."
        decision={{
          title: 'Classify 128 network telemetry columns and fix EXEC_360_SV freshness',
          detail: 'Network telemetry domain has 68% classification coverage — the lowest of all domains. The 128 unclassified columns may contain infrastructure-related PII (cell_id, location). Additionally, EXEC_360_SV has a 28h freshness lag exceeding its 24h SLA — the daily job failed silently.',
          impact: 'classification coverage → 95% · EXEC_360_SV SLA breach resolved',
          risk: 'Some telemetry columns may require legal review before PII tagging',
          linkTo: '#/portal/data-quality',
          linkLabel: 'Open Data Quality',
        }}
        chart={{
          kind: 'line',
          title: 'Tag attachment trend — PII · PCI · DPA (6 months)',
          xKey: 'm',
          data: TAG_TREND,
          series: [
            { key: 'pii',  name: 'PII',  color: '#dc2626'        },
            { key: 'pci',  name: 'PCI',  color: AMBER            },
            { key: 'dpa', name: 'DPA', color: PURPLE, dashed: true },
          ],
          note: 'PII and DPA counts stay in sync — all PII columns tagged as DPA subjects.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('EXEC_360_SV freshness SLA breach · 128 unclassified telemetry columns · ODPC consent lineage gap')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('PEOPLE_360 freshness > 24h threshold. Lineage coverage in AI/ML and mobile domains below 80%.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/data-quality" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Data Quality →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
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
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}
            >
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Masking policies')}    value="14"     delta={tt('5 types')}                trend="flat" icon={Lock}       accent />
          <KpiCard label={tt('Row-access policies')} value="6"      delta={tt('Bahamas · B2B · HR')}          trend="flat" icon={Eye}        />
          <KpiCard label={tt('Active tags')}          value="8"      delta={tt('1,612 attachments')}      trend="up"   icon={Tag}        />
          <KpiCard label={tt('Classified columns')}  value="91%"    delta="+3 pp MoM"                    trend="up"   icon={CheckCircle2}/>
          <KpiCard label={tt('Object contacts')}     value="100%"   delta={tt('steward assigned')}       trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('DMF monitors')}         value="8"      delta={tt('1 SLA breach')}           trend="down" icon={Activity}   />
          <KpiCard label={tt('Tag attachments')}      value="1,612"  delta="+248 MoM"                     trend="up"   icon={Tag}        />
          <KpiCard label={tt('Compliance score')}     value="91%"    delta={tt('DPA · URCA cyber · PCI')}      trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Lineage coverage')}     value="88%"    delta="+4 pp MoM"                    trend="up"   icon={Network}    />
          <KpiCard label={tt('Data product owners')}  value="14"     delta={tt('active stewards')}         trend="flat" icon={FileText}   />
          <KpiCard label={tt('Auto-classification rate')} value="84%" delta={tt('SYSTEM$CLASSIFY')}     trend="up"   icon={RefreshCw}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tag attachment trend — last 6 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={TAG_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pii"         name="PII"         stroke="#dc2626" strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="confidential" name={tt('Confidential')} stroke={NAVY}  strokeWidth={1.8} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="dpa"        name="DPA"        stroke={PURPLE} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Governance maturity scores')}>
            <div className="space-y-3">
              {MATURITY_SCORES.map((m) => (
                <div key={m.l}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold">{tt(m.l)}</span>
                    <span className="font-mono">{m.s} / 100 · target {m.target}</span>
                  </div>
                  <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.s >= m.target ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${m.s}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Lineage coverage by domain (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={LINEAGE_COVERAGE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="pct" name={tt('Covered %')} radius={[0, 4, 4, 0]}>
                    {LINEAGE_COVERAGE.map((d, i) => <Cell key={i} fill={d.pct >= 90 ? GREEN : d.pct >= 80 ? AMBER : '#dc2626'} />)}
                  </Bar>
                  <ReferenceLine x={90} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Governance quick links')}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Link
                  to="/portal/data-quality"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 text-vfes-dark" />{tt('Data Quality')}
                </Link>
                <Link
                  to="/portal/lineage"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Network className="w-4 h-4 text-vfes-dark" />{tt('Data Lineage')}
                </Link>
                <Link
                  to="/portal/catalog"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Database className="w-4 h-4 text-vfes-dark" />{tt('Data Catalog')}
                </Link>
                <Link
                  to="/portal/regulatory"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <FileText className="w-4 h-4 text-vfes-dark" />{tt('Regulatory')}
                </Link>
                <Link
                  to="/portal/rbac"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Lock className="w-4 h-4 text-vfes-dark" />{tt('RBAC Explorer')}
                </Link>
                <Link
                  to="/portal/trust-center"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <ShieldCheck className="w-4 h-4 text-vfes-dark" />{tt('Trust Center')}
                </Link>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Mobile / RAN data classification')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('IMSI · MSISDN · Location')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Object')}</th>
                <th>{tt('Type')}</th>
                <th>{tt('Sensitivity')}</th>
                <th>{tt('Tags')}</th>
                <th>{tt('Masked cols')}</th>
                <th>{tt('RAP')}</th>
                <th>{tt('Lineage')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_HORIZON.map((o) => (
                <tr key={o.object} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{o.object}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(o.type)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${o.sensitivity === 'Critical' ? 'bg-red-50 text-red-700' : o.sensitivity === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {tt(o.sensitivity)}
                    </span>
                  </td>
                  <td className="text-[11px] text-vfes-dark/65">{o.tags}</td>
                  <td className="font-mono text-xs">{o.maskedColumns}</td>
                  <td className="font-mono text-xs">{o.rowAccessPolicy === 'Yes' ? '✓' : '—'}</td>
                  <td className="font-mono text-xs">{o.lineageDownstream}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">
            {tt('SIM_SWAP_REQUESTS is the only Critical-sensitivity object — 11 masked columns, RAP enforced. MOBILE_LOCATION_LOGS Iceberg has 14 downstream consumers under DPA location retention policy.')}
          </div>
        </Panel>
      </>)}

      {/* ══ TAGS ══════════════════════════════════════════════════════════════ */}
      {tab === 'tags' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active tags')}        value="8"      delta={tt('5 new YTD')}             trend="up"   icon={Tag}     accent />
          <KpiCard label={tt('Tag attachments')}    value="1,612"  delta="+248 MoM"                    trend="up"   icon={Activity}/>
          <KpiCard label={tt('PII tagged columns')} value="248"    delta={tt('100% classified')}       trend="flat" icon={Lock}    />
          <KpiCard label={tt('DPA subjects')}      value="248"    delta={tt('matches PII count')}     trend="flat" icon={Eye}     />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Search tag:')}</span>
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-vfes-dark/40" />
            <input
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              placeholder={tt('tag name…')}
              className="text-xs bg-transparent outline-none w-36"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tag library — SNOWFLAKE.HORIZON.TAG_REFERENCES')}>
            <div className="space-y-2.5 text-[12px]">
              {filteredTags.map((t) => (
                <div key={t.name} className="flex items-center justify-between border-b border-black/5 pb-2">
                  <div>
                    <div className="font-mono font-semibold flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-vfes-dark" /> {t.name}
                    </div>
                    <div className="text-[10px] text-vfes-dark/55">
                      {tt('owner')} {tt(t.owner)} · {tt('steward')} {t.steward}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold">{t.applied}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link to="/portal/catalog" className="text-xs font-bold text-vfes-dark hover:underline">
                {tt('Open Data Catalog →')}
              </Link>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title={tt('Tag attachment count by tag')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={TAGS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={136} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="applied" name={tt('Attachments')} radius={[0, 4, 4, 0]}>
                      {TAGS.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, PURPLE, GREEN, AMBER, '#dc2626', SLATE, '#0EA5A4'][i % 8]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Tag trend — PII + DPA aligned')}>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={TAG_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="pii"  name="PII"  stroke="#dc2626" fill="#dc2626" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="dpa" name="DPA" stroke={PURPLE}  fill={PURPLE}  fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ CLASSIFICATION ════════════════════════════════════════════════════ */}
      {tab === 'classification' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Classified columns')}  value="91%"   delta="+3 pp MoM"               trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('PII columns')}          value="248"   delta={tt('all masked')}         trend="up"   icon={Lock}        />
          <KpiCard label={tt('Auto-classified')}      value="84%"   delta={tt('SYSTEM$CLASSIFY')}    trend="up"   icon={Activity}    />
          <KpiCard label={tt('Steward overrides')}    value="14"    delta={tt('manual corrections')} trend="flat" icon={Eye}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {['All', 'PII', 'PCI', 'HR', 'BUSINESS'].map(c => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${classFilter === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Auto-classification — DATA_CLASSIFICATION_LATEST')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Column')}</th>
                  <th className="text-left">{tt('Category')}</th>
                  <th className="text-right">{tt('Confidence')}</th>
                  <th className="text-left">{tt('Source')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClassify.map((c) => (
                  <tr key={c.col} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px]">{c.col}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.category.startsWith('PII') ? 'bg-rose-100 text-rose-700' : c.category === 'PCI' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                        {tt(c.category)}
                      </span>
                    </td>
                    <td className="text-right font-mono">{c.conf}</td>
                    <td className="text-[10px] text-vfes-dark/60">{c.system}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              <Link to="/portal/data-quality" className="text-xs font-bold text-vfes-dark hover:underline">
                {tt('Data Quality →')}
              </Link>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title={tt('Classification coverage by domain (%)')}>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { d: 'Customer',  pct: 100, color: GREEN  },
                      { d: 'Finance',   pct: 95,  color: BLUE   },
                      { d: 'HR',        pct: 100, color: GREEN  },
                      { d: 'Network',   pct: 68,  color: AMBER  },
                      { d: 'Mobile',    pct: 78,  color: AMBER  },
                      { d: 'AI/ML',     pct: 78,  color: AMBER  },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="d" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="pct" name={tt('Classified %')} radius={[0, 4, 4, 0]}>
                      {[GREEN, BLUE, GREEN, AMBER, AMBER, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                    <ReferenceLine x={90} stroke={GREEN} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Mobile / RAN data classification')} action={<span className="text-[10px] font-bold text-vfes-dark bg-vfes-red/10 rounded px-1.5 py-0.5"><Smartphone className="w-3 h-3 inline" /> {tt('IMSI · MSISDN')}</span>}>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                    <tr>
                      <th className="py-1.5">{tt('Object')}</th>
                      <th>{tt('Sensitivity')}</th>
                      <th>{tt('Masked cols')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOBILE_HORIZON.map((o) => (
                      <tr key={o.object} className="border-t border-black/5">
                        <td className="py-1.5 font-mono text-xs font-semibold">{o.object}</td>
                        <td>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${o.sensitivity === 'Critical' ? 'bg-red-50 text-red-700' : o.sensitivity === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                            {tt(o.sensitivity)}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{o.maskedColumns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ POLICIES ══════════════════════════════════════════════════════════ */}
      {tab === 'policies' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Masking policies')}    value="14"  delta={tt('5 object types')}      trend="flat" icon={Lock}   accent />
          <KpiCard label={tt('Row-access policies')} value="6"   delta={tt('Bahamas · B2B · HR')}       trend="flat" icon={Eye}   />
          <KpiCard label={tt('Tag-based policies')}  value="2"   delta={tt('auto enforcement')}    trend="up"   icon={Tag}   />
          <KpiCard label={tt('Aggregation policies')} value="1"  delta={tt('public stats min-k')} trend="flat" icon={Activity}/>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Type:')}</span>
          {['All', 'Masking', 'Row access', 'Tag-based', 'Aggregation'].map(t => (
            <button
              key={t}
              onClick={() => setPolicyType(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${policyType === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {tt(t)}
            </button>
          ))}
        </div>

        <Panel title={tt('Policy registry — SNOWFLAKE.HORIZON.POLICY_REFERENCES')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Type')}</th>
                <th className="text-left">{tt('Name')}</th>
                <th className="text-right">{tt('Applied')}</th>
                <th className="text-left">{tt('Scope')}</th>
                <th className="text-left">{tt('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((p) => (
                <tr key={p.name} className="border-b border-black/5">
                  <td className="py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                      {p.type}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] font-semibold">{p.name}</td>
                  <td className="text-right font-mono">{p.applied_to}</td>
                  <td className="text-[11px]">{p.scope}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{tt(p.action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/rbac" className="font-bold text-vfes-dark hover:underline">{tt('RBAC Explorer →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/trust-center" className="font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Policy application coverage')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { type: 'Masking',     count: 14, color: '#dc2626' },
                    { type: 'Row Access',  count: 6,  color: PURPLE    },
                    { type: 'Tag-based',   count: 2,  color: BLUE      },
                    { type: 'Aggregation', count: 1,  color: GREEN     },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Policies')} radius={[4, 4, 0, 0]}>
                    {['#dc2626', PURPLE, BLUE, GREEN].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Columns protected by policy type')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: tt('Direct masking'),   value: 248 },
                      { name: tt('Tag-based masking'), value: 248 },
                      { name: tt('Row access (RLS)'),  value: 84  },
                      { name: tt('Aggregation'),        value: 12  },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    <Cell fill="#dc2626" />
                    <Cell fill={BLUE} />
                    <Cell fill={PURPLE} />
                    <Cell fill={GREEN} />
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ DATA QUALITY ══════════════════════════════════════════════════════ */}
      {tab === 'quality' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('DMF monitors')}       value="8"   delta={tt('7 pass · 1 fail')}     trend="down" icon={CheckCircle2} accent />
          <KpiCard label={tt('Freshness SLA met')}  value="6/8" delta={tt('EXEC_360_SV fail')}    trend="down" icon={Activity}    />
          <KpiCard label={tt('Null rate checks')}   value="100%"  delta={tt('all pass')}           trend="up"   icon={Database}   />
          <KpiCard label={tt('Row count checks')}   value="100%"  delta={tt('all pass')}           trend="up"   icon={TrendingUp} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'pass', 'warn', 'fail'].map(f => (
            <button
              key={f}
              onClick={() => setDmfFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${dmfFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('Data Metric Functions — monitor registry')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Table')}</th>
                <th className="text-left">{tt('DMF')}</th>
                <th className="text-left">{tt('Result')}</th>
                <th className="text-left">{tt('Last run')}</th>
                <th className="text-left">{tt('Detail')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDmf.map((d, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{d.table}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{d.dmf}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.result === 'pass' ? 'bg-emerald-100 text-emerald-700' : d.result === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {tt(d.result)}
                    </span>
                  </td>
                  <td className="font-mono text-[10px]">{d.last_run}</td>
                  <td className="text-[10px] text-vfes-dark/60">{tt(d.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/data-quality" className="font-bold text-vfes-dark hover:underline">{tt('Open Data Quality →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/observability" className="font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('DMF result distribution')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[{ r: tt('Pass'), c: 6 }, { r: tt('Warn'), c: 1 }, { r: tt('Fail'), c: 1 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="r" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="c" name={tt('Monitors')} radius={[4, 4, 0, 0]}>
                    {[GREEN, AMBER, '#dc2626'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Quality maturity score — domain breakdown')}>
            <div className="h-48">
              <ResponsiveContainer>
                <ComposedChart
                  data={[
                    { d: 'Customer',  score: 96, target: 90 },
                    { d: 'Finance',   score: 91, target: 90 },
                    { d: 'Network',   score: 82, target: 90 },
                    { d: 'Mobile',    score: 78, target: 85 },
                    { d: 'AI/ML',     score: 74, target: 85 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="score" name={tt('Score')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={90} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ ACCESS HISTORY ════════════════════════════════════════════════════ */}
      {tab === 'access-history' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Policy accesses (24h)')} value="4.2K" delta="+12% WoW"             trend="up"   icon={Eye}      accent />
          <KpiCard label={tt('Unique users (24h)')}    value="284"  delta={tt('accessing governed data')} trend="flat" icon={Activity}/>
          <KpiCard label={tt('Masking bypasses')}       value="0"    delta={tt('all masked')}       trend="up"   icon={Lock}    />
          <KpiCard label={tt('RLS rows filtered')}      value="84K"  delta={tt('per 24h window')}   trend="up"   icon={Database}/>
        </div>

        <Panel title={tt('Governance access log — ACCOUNT_USAGE (last 24h)')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('User')}</th>
                <th className="text-left">{tt('Role')}</th>
                <th className="text-left">{tt('Table / view')}</th>
                <th className="text-left">{tt('Action')}</th>
                <th className="text-right">{tt('Rows')}</th>
                <th className="text-left">{tt('Timestamp')}</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_LOG.map((h, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{h.user}</td>
                  <td className="text-[10px] text-vfes-dark/70">{h.role}</td>
                  <td className="font-mono text-[10px]">{h.table}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${h.action === 'WRITE' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                      {h.action}
                    </span>
                  </td>
                  <td className="text-right font-mono text-[10px]">{h.rows.toLocaleString()}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/60">{h.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/trust-center" className="font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/lineage" className="font-bold text-vfes-dark hover:underline">{tt('Data Lineage →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Row access volume by user — governed objects (24h)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={ACCESS_LOG} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="user" tick={{ fontSize: 10 }} width={112} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rows" name={tt('Rows')} radius={[0, 4, 4, 0]} fill={BLUE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ LINEAGE ═══════════════════════════════════════════════════════════ */}
      {tab === 'lineage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Tables with lineage')} value="214/242"  delta={tt('88% coverage')}         trend="up"   icon={Network}  accent />
          <KpiCard label={tt('Lineage gaps')}          value="28"       delta={tt('AI/ML · Mobile')}       trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Downstream consumers')} value="1,840"    delta={tt('across domains')}       trend="up"   icon={Activity} />
          <KpiCard label={tt('Column-level lineage')} value="68%"      delta="+8 pp YTD"                  trend="up"   icon={Eye}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Lineage coverage by domain (% tables)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={LINEAGE_COVERAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="pct"     name={tt('Covered %')}  fill={BLUE}  radius={[4, 4, 0, 0]}>
                    {LINEAGE_COVERAGE.map((d, i) => <Cell key={i} fill={d.pct >= 90 ? GREEN : d.pct >= 80 ? AMBER : '#dc2626'} />)}
                  </Bar>
                  <ReferenceLine y={90} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Lineage table scorecard')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Domain')}</th>
                  <th className="text-right">{tt('Tables')}</th>
                  <th className="text-right">{tt('Covered')}</th>
                  <th className="text-right">{tt('Coverage %')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {LINEAGE_COVERAGE.map((d) => (
                  <tr key={d.domain} className="border-b border-black/5">
                    <td className="py-1.5 font-semibold">{tt(d.domain)}</td>
                    <td className="text-right font-mono">{d.tables}</td>
                    <td className="text-right font-mono">{d.covered}</td>
                    <td className={`text-right font-bold ${d.pct >= 90 ? 'text-emerald-600' : d.pct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {d.pct}%
                    </td>
                    <td>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.pct >= 90 ? 'bg-emerald-100 text-emerald-700' : d.pct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {d.pct >= 90 ? tt('Full') : d.pct >= 80 ? tt('Partial') : tt('Gap')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-3 text-[10px]">
              <Link to="/portal/lineage" className="font-bold text-vfes-dark hover:underline">{tt('Open Lineage →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/data-contracts" className="font-bold text-vfes-dark hover:underline">{tt('Data Contracts →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ COMPLIANCE ════════════════════════════════════════════════════════ */}
      {tab === 'compliance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Controls assessed')} value="8"    delta={tt('5 frameworks')}       trend="flat" icon={ShieldCheck} accent />
          <KpiCard label={tt('Pass')}               value="6"    delta={tt('75% pass rate')}      trend="up"   icon={CheckCircle2}/>
          <KpiCard label={tt('Warning')}             value="2"    delta={tt('partial compliance')} trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('DPA score')}          value="91"   delta={tt('/ 100')}              trend="up"   icon={Eye}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Framework:')}</span>
          {['All', 'DPA', 'URCA cyber', 'PCI-DSS', 'URCA', 'ODPC'].map(f => (
            <button
              key={f}
              onClick={() => setCompFramework(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${compFramework === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Compliance control scorecard — Snowflake Horizon')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('ID')}</th>
                  <th className="text-left">{tt('Framework')}</th>
                  <th className="text-left">{tt('Control')}</th>
                  <th className="text-right">{tt('Score')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompliance.map((c) => (
                  <tr key={c.id} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-bold">{c.id}</td>
                    <td>
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                        {c.framework}
                      </span>
                    </td>
                    <td className="text-[11px] pr-2">{tt(c.control)}</td>
                    <td className={`text-right font-mono font-bold ${c.score >= 90 ? 'text-emerald-600' : c.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {c.score}
                    </td>
                    <td>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tt(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-3 text-[10px]">
              <Link to="/portal/regulatory" className="font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/risk" className="font-bold text-vfes-dark hover:underline">{tt('Risk Register →')}</Link>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title={tt('Compliance score by control')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={filteredCompliance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="id" tick={{ fontSize: 9 }} width={54} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="score" name={tt('Score')} radius={[0, 4, 4, 0]}>
                      {filteredCompliance.map((c, i) => <Cell key={i} fill={c.score >= 90 ? GREEN : c.score >= 70 ? AMBER : '#dc2626'} />)}
                    </Bar>
                    <ReferenceLine x={90} stroke={GREEN} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Compliance action items')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">
                {tt('URCA cyber-2 supplier risk and DPA-1 consent lineage are the two open gaps. Target Q3 close.')}
              </div>
              <div className="flex gap-3 text-xs">
                <Link to="/portal/regulatory" className="font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
                <Link to="/portal/agents" className="font-bold text-vfes-dark hover:underline">{tt('Compliance Agent →')}</Link>
              </div>
            </div>
          </div>
        </div>
      </>)}

      <div className="mt-4 rounded-xl border border-black/5 bg-white p-4">
        <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/50 mb-3">{tt('Governance programme summary — FY2026')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { l: tt('Policies active'),         v: '23',   c: 'text-emerald-600' },
            { l: tt('Classification profiles'),  v: '4',    c: 'text-blue-600'    },
            { l: tt('Object contacts assigned'), v: '100%', c: 'text-emerald-600' },
            { l: tt('Lineage edges tracked'),    v: '4,812', c: 'text-vfes-dark'  },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[9px] uppercase tracking-widest text-vfes-dark/50">{s.l}</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link to="/portal/cdo" className="font-bold text-vfes-dark hover:underline">{tt('CDO Dashboard →')}</Link>
          <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <Link to="/portal/semantic-views" className="font-bold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-6">
        <Eye className="w-3 h-3" />
        {tt('source: SNOWFLAKE.HORIZON.* · POLICY_REFERENCES · TAG_REFERENCES · DATA_CLASSIFICATION_LATEST · OBJECT_CONTACTS')}
      </div>
    </div>
  )
}
