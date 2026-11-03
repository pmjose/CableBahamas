import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  ShieldCheck, Users, Key, Eye, Lock, Smartphone,
  Activity, TrendingUp, AlertTriangle, CheckCircle2,
  Database, Network, Gauge, Search, RefreshCw,
  Bell,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, Cell, PieChart, Pie, ComposedChart, ReferenceLine,
} from 'recharts'
import { MOBILE_RBAC_ROLES } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const ROLES = [
  { name: 'ACCOUNTADMIN',     parent: '—',              users: 3,    grants: 'all',                    tag: 'priv'   },
  { name: 'SECURITYADMIN',    parent: '—',              users: 2,    grants: 'all roles',              tag: 'priv'   },
  { name: 'SYSADMIN',         parent: '—',              users: 4,    grants: 'all DBs',                tag: 'priv'   },
  { name: 'DATA_PLATFORM',    parent: 'SYSADMIN',       users: 8,    grants: 'CORE/RAW/MARTS',         tag: 'svc'    },
  { name: 'DBT_PROD',         parent: 'DATA_PLATFORM',  users: 1,    grants: 'CORE.* USAGE+CRUD',      tag: 'svc'    },
  { name: 'ANALYST_CUSTOMER', parent: 'DATA_PLATFORM',  users: 24,   grants: 'ANALYTICS.CUSTOMER.*',   tag: 'human'  },
  { name: 'ANALYST_NETWORK',  parent: 'DATA_PLATFORM',  users: 14,   grants: 'ANALYTICS.NETWORK.*',    tag: 'human'  },
  { name: 'ANALYST_FINANCE',  parent: 'DATA_PLATFORM',  users: 11,   grants: 'ANALYTICS.FINANCE.*',    tag: 'human'  },
  { name: 'BI_POWERBI_SVC',   parent: 'ANALYST_CUSTOMER', users: 1,  grants: 'C360 read-only',         tag: 'svc'    },
  { name: 'SC_AGENT_CHURN',   parent: 'ANALYST_CUSTOMER', users: 1,  grants: 'CHURN_AGENT only',       tag: 'svc'    },
  { name: 'EXEC_VIEWER',      parent: 'PUBLIC',         users: 18,   grants: 'EXEC_360_SV (RLS)',       tag: 'human'  },
  { name: 'DATA_SCIENCE',     parent: 'DATA_PLATFORM',  users: 8,    grants: 'CORE+ML registry',       tag: 'human'  },
  { name: 'PEOPLE_HR_BP',     parent: 'PUBLIC',         users: 12,   grants: 'PEOPLE_360 (RLS region)', tag: 'human' },
  { name: 'COMPLIANCE_RO',    parent: 'PUBLIC',         users: 6,    grants: 'RISK_360 + access_history', tag: 'human'},
  { name: 'PUBLIC',           parent: '—',              users: 1840, grants: 'minimal',                tag: 'system' },
]

const TAG_COLORS: Record<string, string> = {
  priv:   'bg-rose-100 text-rose-700 border-rose-300',
  svc:    'bg-sky-100 text-sky-700 border-sky-300',
  human:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  system: 'bg-slate-100 text-slate-600 border-slate-300',
}

const GRANTS = [
  { obj: 'CBL_ANALYTICS.CUSTOMER.CUSTOMER_360',  priv: 'SELECT',        to: 'ANALYST_CUSTOMER', via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-09-14' },
  { obj: 'CBL_ANALYTICS.CUSTOMER.CUSTOMER_360',  priv: 'SELECT',        to: 'BI_POWERBI_SVC',   via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-09-14' },
  { obj: 'CBL_AI.AGENTS.CHURN_AGENT',            priv: 'USAGE',         to: 'SC_AGENT_CHURN',   via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-10-08' },
  { obj: 'CBL_GOV.POLICIES.MASK_EMAIL_V2',       priv: 'APPLY',         to: 'DATA_PLATFORM',    via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-08-01' },
  { obj: 'CBL_RAW.NETWORK.CMTS_EVENTS',          priv: 'SELECT',        to: 'ANALYST_NETWORK',  via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-07-22' },
  { obj: 'CBL_ANALYTICS.PEOPLE.PEOPLE_360',      priv: 'SELECT (RLS)',  to: 'PEOPLE_HR_BP',     via: 'row_access_policy', granted_by: 'SECURITYADMIN', granted_on: '2025-06-04' },
  { obj: 'CBL_CORE.ML.MODEL_REGISTRY',           priv: 'USAGE',         to: 'DATA_SCIENCE',     via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-11-01' },
  { obj: 'CBL_ANALYTICS.RISK.RISK_360',          priv: 'SELECT',        to: 'COMPLIANCE_RO',    via: 'role',              granted_by: 'SECURITYADMIN', granted_on: '2025-05-10' },
]

const FINDINGS = [
  { sev: 'H', f: '3 users have ACCOUNTADMIN — should be 1',         rec: 'Reduce to 1 + 1 break-glass per Snowflake CIS'     },
  { sev: 'H', f: 'BI_POWERBI_SVC password rotated > 365d ago',      rec: 'Rotate or migrate to key-pair / OAuth'              },
  { sev: 'M', f: '8 roles with no grants in 90d',                    rec: 'DROP role candidates: LEGACY_ETL, OLD_ANALYST_x …'  },
  { sev: 'M', f: 'DATA_PLATFORM has SELECT on RAW.HR.*',             rec: 'Remove — HR data should be People-only'             },
  { sev: 'L', f: 'PUBLIC role has USAGE on 4 schemas',              rec: 'Audit if intentional'                               },
  { sev: 'L', f: 'EXEC_VIEWER inherits 3 unused schema grants',      rec: 'Review via EXPLAIN_PRIVILEGES'                     },
]

const MASKING_POLICIES = [
  { name: 'mask_email_v2',     type: 'Masking',     applied: 14, scope: 'PII · email',      action: 'partial mask user@***',    roles_exempt: 'COMPLIANCE_RO' },
  { name: 'mask_phone_v2',     type: 'Masking',     applied: 12, scope: 'PII · phone',      action: 'last-4 digits',             roles_exempt: 'PEOPLE_HR_BP'  },
  { name: 'mask_iban',         type: 'Masking',     applied: 4,  scope: 'PCI',              action: 'tokenize via FPE',          roles_exempt: 'COMPLIANCE_RO' },
  { name: 'mask_msisdn',       type: 'Masking',     applied: 8,  scope: 'PII · subscriber', action: 'hash sha-256',              roles_exempt: 'MOBILE_FRAUD_ANALYST' },
  { name: 'mask_salary',       type: 'Masking',     applied: 2,  scope: 'HR sensitive',     action: 'NULL except PEOPLE_HR_BP', roles_exempt: 'PEOPLE_HR_BP'  },
  { name: 'rls_region_eu',     type: 'Row Access',  applied: 6,  scope: 'US vs ROW',        action: 'region IN (USER.region_grant)', roles_exempt: 'ACCOUNTADMIN' },
  { name: 'rls_b2b_owner',     type: 'Row Access',  applied: 3,  scope: 'B2B sales rep',    action: 'owner_id = current_user_email', roles_exempt: 'SECURITYADMIN' },
  { name: 'auto_mask_pii',     type: 'Tag-based',   applied: 248, scope: 'tag:PII',         action: 'all PII columns auto-masked', roles_exempt: 'COMPLIANCE_RO' },
]

const ACCESS_REVIEWS = [
  { role: 'ACCOUNTADMIN',    last_review: '2026-05-01', next_review: '2026-08-01', status: 'Due soon',     reviewer: 'CISO',         finding: '3 holders — remediation in progress' },
  { role: 'SECURITYADMIN',   last_review: '2026-06-01', next_review: '2026-09-01', status: 'Current',      reviewer: 'CISO',         finding: 'Clean' },
  { role: 'ANALYST_CUSTOMER',last_review: '2026-06-15', next_review: '2026-09-15', status: 'Current',      reviewer: 'CDO',          finding: '24 members — 2 inactive' },
  { role: 'DATA_SCIENCE',    last_review: '2026-04-01', next_review: '2026-07-01', status: 'Overdue',      reviewer: 'Data Eng Lead', finding: 'leen.jacobs bulk download flagged' },
  { role: 'PEOPLE_HR_BP',    last_review: '2026-06-01', next_review: '2026-09-01', status: 'Current',      reviewer: 'CHRO',         finding: 'Clean' },
  { role: 'BI_POWERBI_SVC',  last_review: '2025-09-01', next_review: '2026-03-01', status: 'Overdue',      reviewer: 'SecAdmin',     finding: 'Password 387d — SEC-2042' },
  { role: 'COMPLIANCE_RO',   last_review: '2026-05-15', next_review: '2026-08-15', status: 'Due soon',     reviewer: 'DPO',          finding: 'Clean' },
]

const RECOMMENDATIONS = [
  { role: 'ACCOUNTADMIN',     action: 'Remove 2 of 3 holders',         impact: 'CIS-1.1 pass',     effort: 'Med',  priority: 'H' },
  { role: 'BI_POWERBI_SVC',   action: 'Migrate to key-pair auth',      impact: 'SEC-2042 close',   effort: 'Low',  priority: 'H' },
  { role: 'DATA_PLATFORM',    action: 'Revoke SELECT on RAW.HR.*',     impact: 'least-privilege',  effort: 'Low',  priority: 'M' },
  { role: 'LEGACY_ETL',       action: 'DROP role (0 grants 90d)',      impact: 'hygiene',          effort: 'Low',  priority: 'M' },
  { role: 'OLD_ANALYST_X',    action: 'DROP role (0 grants 90d)',      impact: 'hygiene',          effort: 'Low',  priority: 'M' },
  { role: 'EXEC_VIEWER',      action: 'Remove 3 unused schema grants', impact: 'least-privilege',  effort: 'Low',  priority: 'L' },
  { role: 'PUBLIC',           action: 'Audit 4 USAGE grants on schemas', impact: 'exposure review', effort: 'Low', priority: 'L' },
]

const ROLE_USAGE_TREND = [
  { m: 'Jan', human: 142, svc: 18, privileged: 6 },
  { m: 'Feb', human: 148, svc: 19, privileged: 6 },
  { m: 'Mar', human: 152, svc: 20, privileged: 6 },
  { m: 'Apr', human: 156, svc: 21, privileged: 6 },
  { m: 'May', human: 138, svc: 22, privileged: 5 },
  { m: 'Jun', human: 140, svc: 24, privileged: 5 },
]

const GRANT_AGE_DIST = [
  { bucket: '0–30d',  count: 12, color: GREEN  },
  { bucket: '31–90d', count: 28, color: BLUE   },
  { bucket: '91–180d',count: 48, color: AMBER  },
  { bucket: '>180d',  count: 54, color: '#dc2626' },
]

const PRIV_BY_TYPE = [
  { priv: 'SELECT',       count: 284, color: BLUE   },
  { priv: 'USAGE',        count: 148, color: NAVY   },
  { priv: 'APPLY POLICY', count: 12,  color: PURPLE },
  { priv: 'WRITE',        count: 24,  color: AMBER  },
  { priv: 'MONITOR',      count: 36,  color: GREEN  },
  { priv: 'OWNERSHIP',    count: 8,   color: SLATE  },
]

type TabId = 'overview' | 'roles' | 'grants' | 'privileges' | 'access-reviews' | 'recommendations' | 'masking' | 'audit'
const TABS: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'overview',        label: 'Overview',          icon: Gauge        },
  { id: 'roles',           label: 'Roles',              icon: Users        },
  { id: 'grants',          label: 'Grants',             icon: Key          },
  { id: 'privileges',      label: 'Privileges',         icon: Lock         },
  { id: 'access-reviews',  label: 'Access Reviews',     icon: CheckCircle2 },
  { id: 'recommendations', label: 'Recommendations',    icon: TrendingUp   },
  { id: 'masking',         label: 'Masking Policies',   icon: Eye          },
  { id: 'audit',           label: 'Audit Log',          icon: Activity     },
]

export default function RBACExplorerPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [selected, setSelected] = useState('ANALYST_CUSTOMER')
  const [tagFilter, setTagFilter] = useState<string>('All')
  const [privSearch, setPrivSearch] = useState('')
  const [reviewFilter, setReviewFilter] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredRoles = useMemo(
    () => tagFilter === 'All' ? ROLES : ROLES.filter(r => r.tag === tagFilter),
    [tagFilter],
  )

  const roleGrants = useMemo(
    () => GRANTS.filter(g => g.to === selected),
    [selected],
  )

  const filteredReviews = useMemo(
    () => reviewFilter === 'All' ? ACCESS_REVIEWS : ACCESS_REVIEWS.filter(r => r.status === reviewFilter),
    [reviewFilter],
  )

  const filteredGrants = useMemo(
    () => privSearch
      ? GRANTS.filter(g => g.obj.toLowerCase().includes(privSearch.toLowerCase()) || g.to.toLowerCase().includes(privSearch.toLowerCase()))
      : GRANTS,
    [privSearch],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('RBAC explorer')}
        subtitle={tt('Role hierarchy · grants · who-can-see · key-pair / SSO / MFA · ACCOUNT_USAGE.GRANTS_TO_ROLES')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · 142 roles · ')}{liveTime}
            </span>
            <Link
              to="/portal/trust-center"
              className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> {tt('Trust Center')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="RBAC intelligence"
        models={[
          { name: 'Role Recommender',       metric: 'recall 98%',    sub: 'least-privilege role suggestions'    },
          { name: 'Privilege Gap Detector',  metric: 'precision 96%', sub: 'over-provisioned role detection'    },
          { name: 'Least-Privilege Scorer',  metric: 'accuracy 94%',  sub: 'role usage vs grant coverage ratio' },
        ]}
        agentLabel="Run RBAC Audit"
        agentRunningLabel="Auditing…"
        agentSteps={[
          'Queried ACCOUNT_USAGE.GRANTS_TO_ROLES and GRANTS_TO_USERS',
          'Identified roles with zero query activity in 90 days',
          'Calculated privilege-gap score for each human role',
          'Generated least-privilege recommendations for SecAdmin',
        ]}
        agentBlurb="Snowflake ACCOUNT_USAGE views give complete grant lineage — the ML model surfaces which roles have privileges they never use, enabling safe cleanup."
        decision={{
          title: 'Drop 8 unused roles and tighten DATA_PLATFORM RAW.HR access',
          detail: 'Eight roles have had zero QUERY_HISTORY usage for 90+ days. Dropping them removes 142 orphan grants. Additionally, DATA_PLATFORM has SELECT on RAW.HR.* — a privilege never exercised by the role, but a compliance gap per CIS-1.2.',
          impact: 'removes 142 orphan grants · closes CIS-1.2 gap',
          risk: 'Confirm LEGACY_ETL is not used by any scheduled tasks before drop',
          linkTo: '#/portal/trust-center',
          linkLabel: 'Open Trust Center',
        }}
        chart={{
          kind: 'bar',
          title: 'Grant age distribution — days since granted',
          xKey: 'bucket',
          data: GRANT_AGE_DIST,
          series: [{ key: 'count', name: 'Grant count', color: BLUE }],
          note: 'Grants >180d (red bars) are candidates for review or revocation.',
          colorBy: { key: 'count', high: 50, mid: 30 },
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('2 HIGH findings: ACCOUNTADMIN × 3 users · BI_POWERBI_SVC password 387d · DATA_SCIENCE review overdue')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('8 roles with zero usage in 90d are DROP candidates. Access review backlog: 2 overdue, 2 due soon.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/ciso" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('CISO →')}
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
          <KpiCard label={tt('Roles (total)')}       value="142"    delta={tt('8 DROP candidates')}   trend="flat" icon={Users}      accent />
          <KpiCard label={tt('Users')}                value="1,840"  delta={tt('24 service accounts')} trend="up"   icon={Activity}  />
          <KpiCard label={tt('MFA enrolled')}         value="99.4%"  delta="+0.3 pp MoM"              trend="up"   icon={ShieldCheck}/>
          <KpiCard label={tt('SSO via Entra ID')}     value="100%"   delta={tt('all human users')}    trend="up"   icon={Lock}      />
          <KpiCard label={tt('Key-pair auth (svc)')}  value="22 / 24" delta={tt('2 pending')}         trend="up"   icon={Key}       />
          <KpiCard label={tt('High findings')}         value="2"      delta={tt('CIS gaps')}           trend="down" icon={AlertTriangle}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Active users by role type — trend (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ROLE_USAGE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="human"      name={tt('Human')}      stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.35} />
                  <Area type="monotone" dataKey="svc"        name={tt('Service')}    stackId="1" stroke={GREEN}  fill={GREEN}  fillOpacity={0.35} />
                  <Area type="monotone" dataKey="privileged" name={tt('Privileged')} stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Privileges by type — grant distribution')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PRIV_BY_TYPE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="priv" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Grants')} radius={[4, 4, 0, 0]}>
                    {PRIV_BY_TYPE.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Role type distribution')}>
          <div className="h-48 mb-4">
            <ResponsiveContainer>
              <BarChart
                data={[
                  { type: tt('Human'),      count: 64,  color: GREEN  },
                  { type: tt('Service'),    count: 24,  color: BLUE   },
                  { type: tt('Privileged'), count: 9,   color: AMBER  },
                  { type: tt('System'),     count: 1,   color: SLATE  },
                  { type: tt('Legacy/DROP'), count: 44, color: '#dc2626' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="count" name={tt('Roles')} radius={[4, 4, 0, 0]}>
                  {[GREEN, BLUE, AMBER, SLATE, '#dc2626'].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Governance quick links')}>
            <div className="space-y-2 text-sm">
              <Link
                to="/portal/horizon"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
              >
                <Database className="w-4 h-4 text-vfes-dark" />{tt('Horizon Governance')}
              </Link>
              <Link
                to="/portal/trust-center"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-vfes-dark" />{tt('Trust Center')}
              </Link>
              <Link
                to="/portal/data-quality"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-vfes-dark" />{tt('Data Quality')}
              </Link>
              <Link
                to="/portal/catalog"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
              >
                <Eye className="w-4 h-4 text-vfes-dark" />{tt('Data Catalog')}
              </Link>
              <Link
                to="/portal/ciso"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
              >
                <Lock className="w-4 h-4 text-vfes-dark" />{tt('CISO Dashboard')}
              </Link>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Top findings · least-privilege gaps')}>
              <div className="space-y-2">
                {FINDINGS.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 border border-black/5 rounded p-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${f.sev === 'H' ? 'bg-rose-100 text-rose-700' : f.sev === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {f.sev}
                    </span>
                    <div>
                      <div className="text-[12px] font-semibold">{f.f}</div>
                      <div className="text-[10px] text-vfes-dark/60 mt-0.5">→ {f.rec}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Grant reduction impact — hygiene actions completed YTD')}>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { l: tt('Orphan grants removed'),  v: '142', note: tt('stale > 180d') },
              { l: tt('Roles dropped'),           v: '6',   note: tt('zero usage 90d') },
              { l: tt('Policy exemptions cleaned'), v: '18', note: tt('over-grant') },
              { l: tt('Access reviews closed'),   v: '9',   note: tt('quarterly cycle') },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-xl border border-black/5 p-3 text-center">
                <div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{s.l}</div>
                <div className="text-2xl font-extrabold text-vfes-dark mt-1">{s.v}</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{s.note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </>)}

      {/* ══ ROLES ═════════════════════════════════════════════════════════════ */}
      {tab === 'roles' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total roles')}      value="142"   delta={tt('8 DROP candidates')}   trend="flat" icon={Users}    accent />
          <KpiCard label={tt('Human roles')}       value="9"     delta={tt('active members')}      trend="flat" icon={Activity} />
          <KpiCard label={tt('Service roles')}     value="4"     delta={tt('key-pair / OAuth')}    trend="up"   icon={Key}     />
          <KpiCard label={tt('Privileged roles')}  value="3"     delta={tt('CIS review required')} trend="down" icon={Lock}    />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by type:')}</span>
          {['All', 'priv', 'svc', 'human', 'system'].map(t => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${tagFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Mobile-domain RBAC */}
        <Panel
          title={tt('Mobile / RAN roles')}
          action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />{tt('252 mobile-team users')}
            </span>
          }
        >
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Role')}</th>
                <th>{tt('Members')}</th>
                <th>{tt('Parent')}</th>
                <th>{tt('Data access')}</th>
                <th>{tt('Warehouse')}</th>
                <th>{tt('PII')}</th>
                <th>{tt('Last review')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_RBAC_ROLES.map((r) => (
                <tr key={r.role} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-bold text-vfes-dark">{r.role}</td>
                  <td className="font-mono text-xs">{r.members}</td>
                  <td className="font-mono text-xs text-vfes-dark/65">{r.parent}</td>
                  <td className="text-[11px] text-vfes-dark/65">{r.dataAccess}</td>
                  <td className="font-mono text-xs">{r.warehouseAccess}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.pii.startsWith('No') || r.pii.startsWith('Aggregate') ? 'bg-emerald-50 text-emerald-700' : r.pii === 'Masked' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {tt(r.pii)}
                    </span>
                  </td>
                  <td className="text-[11px] text-vfes-dark/65">{r.lastReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">
            {tt('MOBILE_FRAUD_ANALYST is the only role with unmasked PII access — justified for SIM-swap investigation, reviewed every 2 days.')}
          </div>
        </Panel>

        <div className="grid grid-cols-12 gap-4 mt-6">
          <div className="col-span-5 space-y-4">
            <Panel title={tt('Role hierarchy — interactive')}>
              <div className="space-y-1">
                {filteredRoles.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setSelected(r.name)}
                    className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 transition border ${selected === r.name ? 'bg-vfes-red/5 border-vfes-red ring-1 ring-vfes-red' : 'border-transparent hover:bg-black/5'}`}
                  >
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${TAG_COLORS[r.tag]}`}>
                      {tt(r.tag)}
                    </span>
                    <span className="font-mono text-[11px] font-semibold">{r.name}</span>
                    <span className="text-[10px] text-vfes-dark/50 ml-auto">{r.users} · ↑ {r.parent}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="col-span-7 space-y-4">
            <Panel title={`${tt('Grants TO')} ${selected}`}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Object')}</th>
                    <th className="text-left">{tt('Privilege')}</th>
                    <th className="text-left">{tt('Via')}</th>
                    <th className="text-left">{tt('By')}</th>
                    <th className="text-left">{tt('On')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(roleGrants.length > 0 ? roleGrants : GRANTS.slice(0, 4)).map((g, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-[11px]">{g.obj}</td>
                      <td className="font-mono text-[10px] font-bold text-vfes-dark">{g.priv}</td>
                      <td className="text-[10px]">{g.via}</td>
                      <td className="font-mono text-[11px] text-vfes-dark/70">{g.granted_by}</td>
                      <td className="font-mono text-[10px] text-vfes-dark/60">{g.granted_on}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3">
                <Link to="/portal/lineage" className="text-xs font-bold text-vfes-dark hover:underline">
                  {tt('View data lineage for this role →')}
                </Link>
              </div>
            </Panel>

            <Panel title={tt('Who can see CUSTOMER_360 (effective access)')}>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {['ACCOUNTADMIN','SECURITYADMIN','SYSADMIN','DATA_PLATFORM','ANALYST_CUSTOMER','BI_POWERBI_SVC','DATA_SCIENCE','EXEC_VIEWER','DBT_PROD'].map((r) => (
                  <div key={r} className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" /> {r}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Link to="/portal/semantic-views" className="text-xs font-bold text-vfes-dark hover:underline">
                  {tt('Open Semantic Views →')}
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ GRANTS ════════════════════════════════════════════════════════════ */}
      {tab === 'grants' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total grants')}    value="512"  delta={tt('142 stale >180d')}   trend="down" icon={Key}         accent />
          <KpiCard label={tt('SELECT grants')}   value="284"  delta={tt('largest privilege')} trend="flat" icon={Database}   />
          <KpiCard label={tt('Policy APPLYs')}   value="12"   delta={tt('masking + RLS')}     trend="up"   icon={Lock}       />
          <KpiCard label={tt('WRITE grants')}    value="24"   delta={tt('svc accounts only')} trend="flat" icon={Activity}   />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Search:')}</span>
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-vfes-dark/40" />
            <input
              value={privSearch}
              onChange={e => setPrivSearch(e.target.value)}
              placeholder={tt('object or role…')}
              className="text-xs bg-transparent outline-none w-44"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Grant registry — ACCOUNT_USAGE.GRANTS_TO_ROLES')}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Object')}</th>
                    <th className="text-left">{tt('Privilege')}</th>
                    <th className="text-left">{tt('To role')}</th>
                    <th className="text-left">{tt('Via')}</th>
                    <th className="text-left">{tt('Granted by')}</th>
                    <th className="text-left">{tt('Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrants.map((g, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-[10px]">{g.obj}</td>
                      <td className="font-mono text-[10px] font-bold text-vfes-dark">{g.priv}</td>
                      <td className="font-mono text-[11px]">{g.to}</td>
                      <td className="text-[10px] text-vfes-dark/60">{g.via}</td>
                      <td className="font-mono text-[11px] text-vfes-dark/70">{g.granted_by}</td>
                      <td className="font-mono text-[10px] text-vfes-dark/60">{g.granted_on}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-3 text-[10px]">
                <Link to="/portal/risk" className="font-bold text-vfes-dark hover:underline">{tt('Risk Register →')}</Link>
                <span className="text-vfes-dark/40">·</span>
                <Link to="/portal/horizon" className="font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title={tt('Grant age distribution')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={GRANT_AGE_DIST}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="count" name={tt('Grants')} radius={[4, 4, 0, 0]}>
                      {GRANT_AGE_DIST.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Bar>
                    <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Privileges by type')}>
              <div className="h-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={PRIV_BY_TYPE} dataKey="count" nameKey="priv" innerRadius={30} outerRadius={55} paddingAngle={2}>
                      {PRIV_BY_TYPE.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ PRIVILEGES ════════════════════════════════════════════════════════ */}
      {tab === 'privileges' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total privilege grants')} value="512"  delta={tt('across 142 roles')}  trend="flat" icon={Lock}    accent />
          <KpiCard label={tt('Unused 90d grants')}       value="84"   delta={tt('DROP candidates')}   trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Policy APPLY grants')}     value="12"   delta={tt('masking enforced')}  trend="up"   icon={Eye}    />
          <KpiCard label={tt('Cross-schema grants')}     value="18"   delta={tt('under review')}      trend="down" icon={Network}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Privilege distribution by type')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PRIV_BY_TYPE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="priv" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Grant count')} radius={[4, 4, 0, 0]}>
                    {PRIV_BY_TYPE.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Grant age vs usage — cleanup candidates')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={GRANT_AGE_DIST} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="bucket" tick={{ fontSize: 10 }} width={64} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Grants')} radius={[0, 4, 4, 0]}>
                    {GRANT_AGE_DIST.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                  <ReferenceLine x={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Privilege analysis tooling')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Use EXPLAIN_PRIVILEGES and SYSTEM$ANALYZE_ROLE_ACCESS to trace effective grants for any user across all role hierarchies.')}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <Link
              to="/portal/horizon"
              className="bg-vfes-red text-vfes-dark text-xs font-bold px-3 py-2 rounded-lg hover:bg-vfes-red-dark"
            >
              {tt('Horizon →')}
            </Link>
          </div>
        </div>
      </>)}

      {/* ══ ACCESS REVIEWS ════════════════════════════════════════════════════ */}
      {tab === 'access-reviews' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Reviews total')}   value="7"   delta={tt('periodic schedule')}   trend="flat" icon={CheckCircle2} accent />
          <KpiCard label={tt('Current')}          value="3"   delta={tt('on schedule')}          trend="up"   icon={Activity}   />
          <KpiCard label={tt('Due soon')}          value="2"   delta={tt('within 30d')}           trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Overdue')}           value="2"   delta={tt('action required')}      trend="down" icon={Bell}       />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'Current', 'Due soon', 'Overdue'].map(s => (
            <button
              key={s}
              onClick={() => setReviewFilter(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${reviewFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {tt(s)}
            </button>
          ))}
        </div>

        <Panel title={tt('Access review schedule')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Role')}</th>
                <th className="text-left">{tt('Last review')}</th>
                <th className="text-left">{tt('Next due')}</th>
                <th className="text-left">{tt('Reviewer')}</th>
                <th className="text-left">{tt('Finding')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r) => (
                <tr key={r.role} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-bold">{r.role}</td>
                  <td className="font-mono text-[10px]">{r.last_review}</td>
                  <td className="font-mono text-[10px]">{r.next_review}</td>
                  <td className="text-[11px] text-vfes-dark/70">{r.reviewer}</td>
                  <td className="text-[10px] text-vfes-dark/60">{tt(r.finding)}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.status === 'Current' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(r.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/regulatory" className="font-bold text-vfes-dark hover:underline">{tt('Regulatory Compliance →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/cdo" className="font-bold text-vfes-dark hover:underline">{tt('CDO Dashboard →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Access review status breakdown')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { status: tt('Current'),   count: 3, color: GREEN },
                    { status: tt('Due soon'),   count: 2, color: AMBER },
                    { status: tt('Overdue'),    count: 2, color: '#dc2626' },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Reviews')} radius={[4, 4, 0, 0]}>
                    {[GREEN, AMBER, '#dc2626'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ RECOMMENDATIONS ══════════════════════════════════════════════════ */}
      {tab === 'recommendations' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open recs')}         value="7"   delta={tt('from ML audit')}     trend="down" icon={TrendingUp}   accent />
          <KpiCard label={tt('High priority')}      value="2"   delta={tt('quick wins')}        trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Low effort')}          value="5"   delta={tt('of 7 recs')}         trend="up"   icon={RefreshCw}  />
          <KpiCard label={tt('Grants removed (YTD)')} value="142" delta={tt('role hygiene')}   trend="up"   icon={Activity}   />
        </div>

        <Panel title={tt('Least-privilege recommendations — SYSTEM$SUGGEST_ROLE_GRANTS')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Priority')}</th>
                <th className="text-left">{tt('Role')}</th>
                <th className="text-left">{tt('Recommended action')}</th>
                <th className="text-left">{tt('Impact')}</th>
                <th className="text-left">{tt('Effort')}</th>
              </tr>
            </thead>
            <tbody>
              {RECOMMENDATIONS.map((r, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.priority === 'H' ? 'bg-rose-100 text-rose-700' : r.priority === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] font-semibold">{r.role}</td>
                  <td className="text-[11px] pr-2">{tt(r.action)}</td>
                  <td className="text-[10px] text-vfes-dark/60">{tt(r.impact)}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.effort === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(r.effort)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/trust-center" className="font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/risk" className="font-bold text-vfes-dark hover:underline">{tt('Risk Register →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Recommendations by priority')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { p: tt('High'),   count: 2, color: '#dc2626' },
                    { p: tt('Medium'), count: 3, color: AMBER     },
                    { p: tt('Low'),    count: 2, color: BLUE      },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="p" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Recs')} radius={[4, 4, 0, 0]}>
                    {['#dc2626', AMBER, BLUE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Grant reduction trend — hygiene progress')}>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart
                  data={[
                    { m: 'Jan', grants: 680 }, { m: 'Feb', grants: 658 }, { m: 'Mar', grants: 640 },
                    { m: 'Apr', grants: 610 }, { m: 'May', grants: 570 }, { m: 'Jun', grants: 512 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="grants" name={tt('Total grants')} stroke={BLUE} strokeWidth={2.4} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ MASKING POLICIES ═════════════════════════════════════════════════ */}
      {tab === 'masking' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Masking policies')}    value="14"   delta={tt('5 types')}             trend="flat" icon={Eye}     accent />
          <KpiCard label={tt('Columns masked')}       value="248"  delta={tt('PII + PCI + HR')}      trend="up"   icon={Lock}   />
          <KpiCard label={tt('Row-access policies')}  value="6"    delta={tt('Bahamas · B2B · HR')}       trend="flat" icon={Network}/>
          <KpiCard label={tt('Tag-based auto-mask')}  value="248"  delta={tt('tag:PII trigger')}     trend="up"   icon={ShieldCheck}/>
        </div>

        <Panel title={tt('Masking & row-access policy registry')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Type')}</th>
                <th className="text-left">{tt('Name')}</th>
                <th className="text-right">{tt('Applied to')}</th>
                <th className="text-left">{tt('Scope')}</th>
                <th className="text-left">{tt('Action')}</th>
                <th className="text-left">{tt('Exempt roles')}</th>
              </tr>
            </thead>
            <tbody>
              {MASKING_POLICIES.map((p) => (
                <tr key={p.name} className="border-b border-black/5">
                  <td className="py-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.type === 'Masking' ? 'bg-rose-100 text-rose-700' : p.type === 'Row Access' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                      {tt(p.type)}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] font-semibold">{p.name}</td>
                  <td className="text-right font-mono">{p.applied}</td>
                  <td className="text-[11px] text-vfes-dark/70">{p.scope}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{tt(p.action)}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/55">{p.roles_exempt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/horizon" className="font-bold text-vfes-dark hover:underline">{tt('Horizon Governance →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/data-quality" className="font-bold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Policy coverage by type')}>
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

          <Panel title={tt('Columns masked by domain')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { domain: 'PII',    count: 248, color: '#dc2626' },
                    { domain: 'PCI',    count: 22,  color: AMBER     },
                    { domain: 'HR',     count: 12,  color: PURPLE    },
                    { domain: 'Mobile', count: 36,  color: BLUE      },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Columns')} radius={[0, 4, 4, 0]}>
                    {['#dc2626', AMBER, PURPLE, BLUE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ AUDIT LOG ═════════════════════════════════════════════════════════ */}
      {tab === 'audit' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Grant changes (7d)')}  value="14"  delta={tt('by SECURITYADMIN')}   trend="flat" icon={Activity}   accent />
          <KpiCard label={tt('Role created (7d)')}   value="1"   delta={tt('MOBILE_FRAUD_v2')}    trend="up"   icon={Users}     />
          <KpiCard label={tt('Policy changes (7d)')} value="3"   delta={tt('masking updates')}    trend="flat" icon={Eye}       />
          <KpiCard label={tt('Failed auth (24h)')}   value="6"   delta={tt('all auto-locked')}    trend="up"   icon={Lock}      />
        </div>

        <Panel title={tt('Role & grant audit trail — last 7 days')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Timestamp')}</th>
                <th className="text-left">{tt('Actor')}</th>
                <th className="text-left">{tt('Event')}</th>
                <th className="text-left">{tt('Object')}</th>
                <th className="text-left">{tt('Detail')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ts: '2026-06-29 09:05', actor: 'SECURITYADMIN', event: 'GRANT', obj: 'CBL_AI.AGENTS.COMPLIANCE_AGENT', detail: 'USAGE TO SC_AGENT_COMPLIANCE' },
                { ts: '2026-06-28 22:14', actor: 'SYSADMIN',      event: 'CREATE ROLE', obj: 'MOBILE_FRAUD_ANALYST_V2',  detail: 'parent: DATA_PLATFORM' },
                { ts: '2026-06-28 18:02', actor: 'SECURITYADMIN', event: 'REVOKE',  obj: 'CBL_RAW.HR.*',                detail: 'SELECT FROM DATA_PLATFORM' },
                { ts: '2026-06-27 14:30', actor: 'SECURITYADMIN', event: 'GRANT',   obj: 'CBL_GOV.POLICIES.MASK_IBAN',  detail: 'APPLY TO DATA_PLATFORM' },
                { ts: '2026-06-26 11:00', actor: 'ACCOUNTADMIN',  event: 'POLICY',  obj: 'NP_SNOWPARK_COMPUTE',         detail: 'Altered IP allow-list (+2 CIDRs)' },
                { ts: '2026-06-25 09:48', actor: 'SECURITYADMIN', event: 'REVOKE',  obj: 'EXEC_VIEWER',                 detail: 'Removed 3 stale schema USAGE grants' },
                { ts: '2026-06-24 16:12', actor: 'ACCOUNTADMIN',  event: 'POLICY',  obj: 'NP_COMPLIANCE_TEAM',               detail: 'Added 2 new CIDR ranges for DPO team' },
                { ts: '2026-06-23 08:55', actor: 'SECURITYADMIN', event: 'GRANT',   obj: 'CBL_ANALYTICS.RISK.RISK_360',     detail: 'SELECT TO COMPLIANCE_RO' },
                { ts: '2026-06-22 14:01', actor: 'SYSADMIN',      event: 'REVOKE',  obj: 'OLD_ANALYST_X',                   detail: 'DROP ROLE candidate — 0 grants 91d' },
              ].map((e, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[10px]">{e.ts}</td>
                  <td className="font-mono text-[11px] font-semibold text-vfes-dark">{e.actor}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${e.event.startsWith('REVOKE') ? 'bg-rose-100 text-rose-700' : e.event.startsWith('GRANT') ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {e.event}
                    </span>
                  </td>
                  <td className="font-mono text-[10px]">{e.obj}</td>
                  <td className="text-[10px] text-vfes-dark/60">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/observability" className="font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/agents" className="font-bold text-vfes-dark hover:underline">{tt('Cortex Agents →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Audit event frequency — last 30 days')}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart
                  data={[
                    { d: 'W-4', grants: 8, revokes: 2, policy: 1 },
                    { d: 'W-3', grants: 6, revokes: 4, policy: 2 },
                    { d: 'W-2', grants: 10, revokes: 3, policy: 1 },
                    { d: 'W-1', grants: 7, revokes: 5, policy: 2 },
                    { d: 'W0',  grants: 4, revokes: 6, policy: 3 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="grants"  name={tt('Grants')}  stroke={BLUE}   fill={BLUE}   fillOpacity={0.3} />
                  <Area type="monotone" dataKey="revokes" name={tt('Revokes')} stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="policy"  name={tt('Policy')}  stroke={PURPLE} fill={PURPLE} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      <div className="mt-4 rounded-xl bg-gradient-to-br from-navy/5 to-transparent border border-black/5 p-4">
        <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/50 mb-2">{tt('Service account security posture')}</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { l: tt('Total svc accounts'),   v: '24', c: 'text-vfes-dark' },
            { l: tt('Key-pair authenticated'), v: '22', c: 'text-emerald-600' },
            { l: tt('OAuth 2.0 flows'),       v: '6',  c: 'text-blue-600'    },
            { l: tt('Password-only (risk)'),  v: '2',  c: 'text-rose-600'    },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-vfes-dark/50">{s.l}</div>
              <div className={`text-xl font-extrabold mt-0.5 ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-xs">
          <Link to="/portal/ciso" className="font-bold text-vfes-dark hover:underline">{tt('CISO Dashboard →')}</Link>
          <Link to="/portal/trust-center" className="font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-6">
        <Key className="w-3 h-3" />
        {tt('source: ACCOUNT_USAGE.GRANTS_TO_ROLES + GRANTS_TO_USERS + USERS · refreshed every 60 min')}
      </div>
    </div>
  )
}
