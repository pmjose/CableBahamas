import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Eye, Smartphone,
  Lock, Key, Activity, TrendingUp, RefreshCw, Bell, Database,
  Network, Users, Gauge, Search,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, Cell, PieChart, Pie, ComposedChart, ReferenceLine,
} from 'recharts'
import { MOBILE_TRUST } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const SCANNERS = [
  { id: 'CIS_BENCHMARK',             cat: 'CIS',                 status: 'enabled',  findings: 4, last: '02:00 UTC' },
  { id: 'NETWORK_POLICIES_ATTACHED', cat: 'Security Essentials', status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'MFA_ENROLLMENT',            cat: 'Security Essentials', status: 'enabled',  findings: 1, last: '02:00 UTC' },
  { id: 'PASSWORD_NEVER_ROTATED',    cat: 'Security Essentials', status: 'enabled',  findings: 1, last: '02:00 UTC' },
  { id: 'ACCOUNTADMIN_USAGE',        cat: 'Security Essentials', status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'STALE_USERS',               cat: 'Security Essentials', status: 'enabled',  findings: 6, last: '02:00 UTC' },
  { id: 'OAUTH_INTEGRATIONS_REVIEW', cat: 'Security Essentials', status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'PUBLIC_ROLE_GRANTS',        cat: 'Security Essentials', status: 'enabled',  findings: 4, last: '02:00 UTC' },
  { id: 'SHARED_TO_NON_CBL',         cat: 'Threat Intelligence', status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'IMPOSSIBLE_TRAVEL',         cat: 'Threat Intelligence', status: 'enabled',  findings: 0, last: '14:00 UTC' },
  { id: 'BRUTE_FORCE_LOGIN',         cat: 'Threat Intelligence', status: 'enabled',  findings: 0, last: '14:00 UTC' },
  { id: 'BULK_DOWNLOAD_DETECTOR',    cat: 'Threat Intelligence', status: 'enabled',  findings: 1, last: '14:00 UTC' },
  { id: 'CORTEX_GUARDRAILS',         cat: 'AI Safety',           status: 'enabled',  findings: 7, last: 'live' },
  { id: 'EXFIL_DETECTOR',            cat: 'Threat Intelligence', status: 'enabled',  findings: 0, last: '14:00 UTC' },
  { id: 'CMK_ROTATION',              cat: 'CIS',                 status: 'enabled',  findings: 0, last: 'weekly' },
  { id: 'PERIODIC_REKEYING',         cat: 'Security Essentials', status: 'enabled',  findings: 0, last: '14d' },
  { id: 'PRIVILEGED_ROLE_HYGIENE',   cat: 'CIS',                 status: 'enabled',  findings: 1, last: '02:00 UTC' },
  { id: 'IDLE_SESSION_TIMEOUT',      cat: 'CIS',                 status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'NETWORK_POLICY_NO_ALL',     cat: 'CIS',                 status: 'enabled',  findings: 0, last: '02:00 UTC' },
  { id: 'CLIENT_DRIVER_VERSION',     cat: 'CIS',                 status: 'enabled',  findings: 2, last: '02:00 UTC' },
  { id: 'TRACE_LEVEL_ON_PROD',       cat: 'CIS',                 status: 'disabled', findings: 0, last: '—' },
  { id: 'EVENT_TABLE_ATTACHED',      cat: 'Security Essentials', status: 'enabled',  findings: 0, last: '02:00 UTC' },
]

const TOP_FINDINGS = [
  { sev: 'H', f: 'Cortex Guard: 4 jailbreak attempts last 24h on COMPLIANCE_AGENT', target: 'externe@example.com', action: 'auto-blocked + alerted #sec-ai' },
  { sev: 'H', f: 'BI_POWERBI_SVC password not rotated 387 days',                    target: 'BI_POWERBI_SVC',       action: 'open ticket SEC-2042 · migrate to key-pair' },
  { sev: 'M', f: '6 stale users with no login > 90d',                               target: 'OFFBOARD_QUEUE',       action: 'auto-disable Wed 02:00 UTC' },
  { sev: 'M', f: '4 grants to PUBLIC role on USAGE',                                target: 'CBL_RAW.* schemas',    action: 'review with SecAdmin' },
  { sev: 'M', f: '3 users hold ACCOUNTADMIN',                                       target: 'PJOSE, FVANDENBERGHE, RWILLEMS', action: 'reduce to 1 + 1 break-glass' },
  { sev: 'L', f: 'Bulk download spike: leen.jacobs · 2.4 GB / 8 min',              target: 'DATA_SCIENCE',         action: 'auto-cleared (training job)' },
  { sev: 'L', f: 'Snowflake driver < 3.10 detected',                                target: 'legacy ETL host',      action: 'upgrade scheduled' },
  { sev: 'L', f: 'CIS-2.3: idle session timeout not enforced on 3 integrations',   target: 'REPORTING_SVC',        action: 'apply session policy patch' },
]

const SEV_BUCKETS = [
  { s: 'High',   c: 2,  color: '#dc2626' },
  { s: 'Medium', c: 8,  color: '#f59e0b' },
  { s: 'Low',    c: 16, color: '#0ea5e9' },
]

const CIS_CONTROLS = [
  { id: 'CIS-1.1', section: 'Access Control',  desc: 'Privileged role hygiene — ≤2 ACCOUNTADMIN',    status: 'fail', score: 72,  detail: '3 ACCOUNTADMIN users — target ≤2'         },
  { id: 'CIS-1.2', section: 'Access Control',  desc: 'MFA enrollment ≥98%',                          status: 'pass', score: 99,  detail: '99.4% enrolled; 0.6% svc accounts exempt' },
  { id: 'CIS-1.3', section: 'Access Control',  desc: 'SSO / SAML federated identity',                status: 'pass', score: 100, detail: 'Entra ID enforced for all human users'      },
  { id: 'CIS-2.1', section: 'Network',         desc: 'Network policy on all non-svc users',          status: 'pass', score: 96,  detail: '4 legacy service accounts still without'   },
  { id: 'CIS-2.2', section: 'Network',         desc: 'No 0.0.0.0/0 in any active policy',            status: 'pass', score: 100, detail: 'All scoped to named CIDR ranges'            },
  { id: 'CIS-2.3', section: 'Network',         desc: 'Idle session timeout ≤60 min',                 status: 'fail', score: 68,  detail: '3 integrations missing session policy'     },
  { id: 'CIS-3.1', section: 'Data Protection', desc: 'CMK / Tri-Secret Secure active',               status: 'pass', score: 100, detail: 'Tri-Secret via Thales HSM — active'         },
  { id: 'CIS-3.2', section: 'Data Protection', desc: 'Periodic re-keying enabled (≤30d)',            status: 'pass', score: 100, detail: 'Re-keying every 14d — active'              },
  { id: 'CIS-3.3', section: 'Data Protection', desc: 'Masking policies on all PII columns',          status: 'pass', score: 97,  detail: '248 / 248 PII columns masked'             },
  { id: 'CIS-4.1', section: 'Monitoring',      desc: 'Event table attached to account',              status: 'pass', score: 100, detail: 'CBL_GOV.TELEMETRY.EVENTS active'           },
  { id: 'CIS-4.2', section: 'Monitoring',      desc: 'Trust Center scanner coverage ≥90%',           status: 'pass', score: 95,  detail: '21 / 22 scanners enabled'                 },
  { id: 'CIS-5.1', section: 'Sharing',         desc: 'Outbound shares only to approved accounts',    status: 'pass', score: 100, detail: 'SHARED_TO_NON_CBL scanner: 0 findings'     },
]

const NETWORK_POLICIES = [
  { name: 'NP_MECHELEN_HQ',    type: 'IP allow-list',     ips: 24, attached_to: 'ANALYSTS, EXEC_VIEWER',  modified: '2025-09-01' },
  { name: 'NP_VPN_BAHAMAS',        type: 'IP allow-list',     ips: 8,  attached_to: 'DATA_SCIENCE, DBT_PROD', modified: '2025-08-14' },
  { name: 'NP_POWERBI_SVC',      type: 'IP allow-list',     ips: 4,  attached_to: 'BI_POWERBI_SVC',         modified: '2025-07-01' },
  { name: 'NP_COMPLIANCE_TEAM',  type: 'IP allow-list',     ips: 6,  attached_to: 'COMPLIANCE_RO',          modified: '2025-09-12' },
  { name: 'NP_SAML_BYPASS',      type: 'SAML bypass block', ips: 0,  attached_to: 'ACCOUNTADMIN',           modified: '2025-06-01' },
  { name: 'NP_SNOWPARK_COMPUTE', type: 'Snowpark-only',     ips: 12, attached_to: 'DATA_PLATFORM',          modified: '2025-10-01' },
]

const MFA_TRENDS = [
  { m: 'Jan', enrolled: 96.8, active30d: 88.2 }, { m: 'Feb', enrolled: 97.4, active30d: 89.1 },
  { m: 'Mar', enrolled: 98.0, active30d: 90.2 }, { m: 'Apr', enrolled: 98.8, active30d: 91.0 },
  { m: 'May', enrolled: 99.1, active30d: 91.8 }, { m: 'Jun', enrolled: 99.4, active30d: 92.3 },
]

const POSTURE_HISTORY = [
  { m: 'Jan', score: 88, target: 90 }, { m: 'Feb', score: 89, target: 90 },
  { m: 'Mar', score: 90, target: 90 }, { m: 'Apr', score: 91, target: 90 },
  { m: 'May', score: 92, target: 90 }, { m: 'Jun', score: 94, target: 90 },
]

const FINDINGS_TREND = [
  { m: 'Jan', high: 5, medium: 14, low: 28 }, { m: 'Feb', high: 4, medium: 12, low: 24 },
  { m: 'Mar', high: 4, medium: 11, low: 22 }, { m: 'Apr', high: 3, medium: 10, low: 20 },
  { m: 'May', high: 3, medium: 9,  low: 18 }, { m: 'Jun', high: 2, medium: 8,  low: 16 },
]

const CAT_FINDINGS = [
  { cat: 'CIS',          findings: 7,  color: NAVY   },
  { cat: 'Sec Ess.',     findings: 12, color: BLUE   },
  { cat: 'Threat Intel', findings: 1,  color: AMBER  },
  { cat: 'AI Safety',    findings: 7,  color: PURPLE },
]

const DATA_PROT = [
  { domain: 'PII (email / phone / MSISDN)', tables: 248, masked: 248, rls: 6, encrypted: '100%', classified: 100, status: 'Protected'   },
  { domain: 'PCI (IBAN / card)',             tables: 22,  masked: 22,  rls: 2, encrypted: '100%', classified: 100, status: 'Protected'   },
  { domain: 'HR / Salary',                   tables: 12,  masked: 12,  rls: 4, encrypted: '100%', classified: 100, status: 'Protected'   },
  { domain: 'Network telemetry',             tables: 84,  masked: 0,   rls: 0, encrypted: '100%', classified: 68,  status: 'Partial'     },
  { domain: 'B2B contracts',                 tables: 36,  masked: 28,  rls: 3, encrypted: '100%', classified: 92,  status: 'Protected'   },
  { domain: 'AI model outputs',              tables: 18,  masked: 14,  rls: 2, encrypted: '100%', classified: 78,  status: 'In Progress' },
]

const ACCESS_HIST = [
  { user: 'pjose',           role: 'ACCOUNTADMIN',     obj: 'ACCOUNT_USAGE.LOGIN_HISTORY',     action: 'SELECT', rows: 14200,    ts: '2026-06-29 09:14', risk: 'Normal' },
  { user: 'leen.jacobs',     role: 'DATA_SCIENCE',      obj: 'CBL_AI.FEATURES.CHURN_FEAT',     action: 'SELECT', rows: 4200000,  ts: '2026-06-29 08:22', risk: 'Watch'  },
  { user: 'marcos.perez',    role: 'ANALYST_FINANCE',   obj: 'CBL_ANALYTICS.FINANCE.GL_FACT',  action: 'SELECT', rows: 82400,    ts: '2026-06-28 17:05', risk: 'Normal' },
  { user: 'bi_powerbi_svc',  role: 'BI_POWERBI_SVC',    obj: 'CBL_ANALYTICS.CUSTOMER.C360',    action: 'SELECT', rows: 340000,   ts: '2026-06-28 23:00', risk: 'Normal' },
  { user: 'ana.castillo',    role: 'COMPLIANCE_RO',     obj: 'SNOWFLAKE.ACCOUNT_USAGE.*',       action: 'SELECT', rows: 28000,    ts: '2026-06-28 11:40', risk: 'Normal' },
  { user: 'dbt_prod_svc',    role: 'DBT_PROD',          obj: 'CBL_CORE.CUSTOMER.*',             action: 'WRITE',  rows: 1240000,  ts: '2026-06-29 01:14', risk: 'Normal' },
  { user: 'luis.garcia',     role: 'ANALYST_NETWORK',   obj: 'CBL_RAW.NETWORK.CMTS_EVENTS',    action: 'SELECT', rows: 2800000,  ts: '2026-06-29 07:30', risk: 'Normal' },
  { user: 'externe_analyst', role: 'EXEC_VIEWER',       obj: 'CBL_ANALYTICS.EXEC.EXEC_360_SV', action: 'SELECT', rows: 1200,     ts: '2026-06-28 14:00', risk: 'Watch'  },
]

const REMEDIATION_TRACK = [
  { ticket: 'SEC-2042', finding: 'BI_POWERBI_SVC key rotation (387 days)',     owner: 'SecAdmin',   due: '2026-07-15', status: 'In Progress',  effort: 'Low', sev: 'H' },
  { ticket: 'SEC-2038', finding: '3 users with ACCOUNTADMIN — reduce to 1+1',  owner: 'CISO',       due: '2026-07-31', status: 'In Progress',  effort: 'Med', sev: 'H' },
  { ticket: 'SEC-2035', finding: '6 stale users — auto-disable job',           owner: 'IAM Team',   due: '2026-07-03', status: 'Scheduled',    effort: 'Low', sev: 'M' },
  { ticket: 'SEC-2031', finding: '4 PUBLIC role USAGE grants audit',            owner: 'SecAdmin',   due: '2026-07-10', status: 'Under Review', effort: 'Low', sev: 'M' },
  { ticket: 'SEC-2029', finding: 'Idle session timeout on 3 integrations',     owner: 'Platform',   due: '2026-07-20', status: 'Planned',      effort: 'Low', sev: 'M' },
  { ticket: 'SEC-2024', finding: 'Cortex Guard jailbreak policy v2',           owner: 'AI Safety',  due: '2026-07-05', status: 'Done',         effort: 'Med', sev: 'H' },
  { ticket: 'SEC-2018', finding: 'Driver version enforcement policy',           owner: 'Platform',   due: '2026-06-30', status: 'Done',         effort: 'Low', sev: 'L' },
]

const REMTAG_C: Record<string, string> = {
  'Done':         'bg-emerald-100 text-emerald-700',
  'In Progress':  'bg-blue-100 text-blue-700',
  'Scheduled':    'bg-sky-100 text-sky-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'Planned':      'bg-slate-100 text-slate-600',
}

const REM_TREND = [
  { m: 'Jan', open: 28, resolved: 8  }, { m: 'Feb', open: 24, resolved: 10 },
  { m: 'Mar', open: 20, resolved: 9  }, { m: 'Apr', open: 17, resolved: 8  },
  { m: 'May', open: 14, resolved: 9  }, { m: 'Jun', open: 10, resolved: 12 },
]

const MATURITY_SCORES = [
  { l: 'Security posture',     s: 94, target: 90 },
  { l: 'CIS benchmark',        s: 83, target: 90 },
  { l: 'MFA coverage',         s: 99, target: 98 },
  { l: 'Data protection',      s: 91, target: 88 },
  { l: 'Threat monitoring',    s: 96, target: 92 },
]

type TabId = 'overview' | 'scanners' | 'findings' | 'cis' | 'data-protection' | 'mfa-network' | 'access-history' | 'remediation'
const TABS: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'overview',        label: 'Overview',        icon: Gauge        },
  { id: 'scanners',        label: 'Scanners',         icon: ShieldCheck  },
  { id: 'findings',        label: 'Findings',         icon: AlertTriangle},
  { id: 'cis',             label: 'CIS Benchmarks',   icon: CheckCircle2 },
  { id: 'data-protection', label: 'Data Protection',  icon: Lock         },
  { id: 'mfa-network',     label: 'MFA & Network',    icon: Network      },
  { id: 'access-history',  label: 'Access History',   icon: Eye          },
  { id: 'remediation',     label: 'Remediation',      icon: Activity     },
]

export default function TrustCenterPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [sevFilter, setSevFilter] = useState<string>('All')
  const [scannerCat, setScannerCat] = useState<string>('All')
  const [cisSection, setCisSection] = useState<string>('All')
  const [searchUser, setSearchUser] = useState('')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredFindings = useMemo(
    () => sevFilter === 'All' ? TOP_FINDINGS : TOP_FINDINGS.filter(f => f.sev === sevFilter),
    [sevFilter],
  )
  const filteredScanners = useMemo(
    () => scannerCat === 'All' ? SCANNERS : SCANNERS.filter(s => s.cat === scannerCat),
    [scannerCat],
  )
  const filteredCis = useMemo(
    () => cisSection === 'All' ? CIS_CONTROLS : CIS_CONTROLS.filter(c => c.section === cisSection),
    [cisSection],
  )
  const filteredAccessHist = useMemo(
    () => searchUser ? ACCESS_HIST.filter(h => h.user.toLowerCase().includes(searchUser.toLowerCase())) : ACCESS_HIST,
    [searchUser],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Trust Center · security posture')}
        subtitle={tt('22 scanners · CIS · Security Essentials · Threat Intelligence · AI safety · refreshed daily')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · score 94 · ')}{liveTime}
            </span>
            <Link
              to="/portal/ciso"
              className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> {tt('CISO Dashboard')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Security intelligence"
        models={[
          { name: 'Threat Scorer',    metric: 'AUC 0.94',    sub: 'login anomaly · impossible travel' },
          { name: 'Exfil Detector',   metric: 'precision 97%', sub: 'bulk download patterns'         },
          { name: 'Cortex Guard LLM', metric: 'block 99.2%', sub: 'jailbreak · prompt injection'    },
        ]}
        agentLabel="Run Security Sweep"
        agentRunningLabel="Scanning…"
        agentSteps={[
          'Queried SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY last 24h',
          'Flagged anomalous access patterns vs 90-day baseline',
          'Correlated GRANT_TO_ROLES for privilege escalation signals',
          'Drafted remediation priority queue for SecAdmin',
        ]}
        agentBlurb="Snowflake Trust Center scanners + Cortex ML models surface threats inside the same data platform — no SIEM export needed."
        decision={{
          title: 'Reduce ACCOUNTADMIN to 1+1 break-glass this sprint',
          detail: 'Three users currently hold ACCOUNTADMIN. CIS-1.1 requires ≤2. Reducing to 1 operational + 1 break-glass closes the highest-priority CIS gap and removes lateral-movement risk if any account is compromised.',
          impact: 'CIS score +6 pts · posture score → 96',
          risk: 'Coordinate with Pieter Knowles (current break-glass holder)',
          linkTo: '#/portal/rbac',
          linkLabel: 'Open RBAC Explorer',
        }}
        chart={{
          kind: 'line',
          title: 'Security posture score — 6-month trend',
          xKey: 'm',
          data: POSTURE_HISTORY,
          series: [
            { key: 'score',  name: 'Posture score', color: GREEN              },
            { key: 'target', name: 'Target',          color: SLATE, dashed: true },
          ],
          note: 'Crossed the 90 threshold in March — target 96 by Q4-2026.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-900 text-sm">
                {tt('2 HIGH findings open · 3 users hold ACCOUNTADMIN · 7 Cortex Guard blocks in 24h')}
              </div>
              <div className="text-xs text-rose-800 mt-1">
                {tt('BI_POWERBI_SVC password 387 days old — SEC-2042 pending. Reduce ACCOUNTADMIN per CIS-1.1.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/risk" className="text-xs font-bold text-rose-900 hover:underline">
                {tt('Risk register →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-rose-600 hover:underline">
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
          <KpiCard label={tt('Posture score')}         value="94 / 100"  delta="+6 pts YTD"               trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('Scanners active')}        value="21 / 22"   delta={tt('1 disabled')}          trend="flat" icon={Activity}     />
          <KpiCard label={tt('Findings open')}          value="26"         delta="-12 vs last month"         trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('High severity')}           value="2"          delta={tt('SEC-2038, SEC-2042')}  trend="down" icon={Bell}          />
          <KpiCard label={tt('Auto-remediated (7d)')}   value="142"        delta="+38 vs prior week"         trend="up"   icon={RefreshCw}    />
          <KpiCard label={tt('CIS pass rate')}           value="83%"        delta={tt('10 of 12 pass')}       trend="up"   icon={CheckCircle2} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Posture score trend — actual vs target (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={POSTURE_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[84, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="score"  name={tt('Score')}  fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={90} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
              {tt('Amber = 90 minimum threshold · target 96 by Q4-2026')}
            </div>
          </Panel>

          <Panel title={tt('Findings trend — by severity (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={FINDINGS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="high"   name={tt('High')}   stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="medium" name={tt('Medium')} stackId="1" stroke={AMBER}   fill={AMBER}   fillOpacity={0.5} />
                  <Area type="monotone" dataKey="low"    name={tt('Low')}    stackId="1" stroke={BLUE}    fill={BLUE}    fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Findings by scanner category')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CAT_FINDINGS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="findings" name={tt('Findings')} radius={[4, 4, 0, 0]}>
                    {CAT_FINDINGS.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Security & governance quick links')}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Link
                  to="/portal/rbac"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Key className="w-4 h-4 text-vfes-dark" />{tt('RBAC Explorer')}
                </Link>
                <Link
                  to="/portal/horizon"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Database className="w-4 h-4 text-vfes-dark" />{tt('Horizon Governance')}
                </Link>
                <Link
                  to="/portal/data-quality"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 text-vfes-dark" />{tt('Data Quality')}
                </Link>
                <Link
                  to="/portal/regulatory"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Eye className="w-4 h-4 text-vfes-dark" />{tt('Regulatory')}
                </Link>
                <Link
                  to="/portal/lineage"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Network className="w-4 h-4 text-vfes-dark" />{tt('Data Lineage')}
                </Link>
                <Link
                  to="/portal/agents"
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/5 hover:bg-black/5 font-semibold"
                >
                  <Activity className="w-4 h-4 text-vfes-dark" />{tt('Cortex Agents')}
                </Link>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Security maturity scores')}>
          <div className="grid md:grid-cols-2 gap-6">
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
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={MATURITY_SCORES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="l" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="s" name={tt('Score')} radius={[0, 4, 4, 0]}>
                    {MATURITY_SCORES.map((m, i) => <Cell key={i} fill={m.s >= m.target ? GREEN : AMBER} />)}
                  </Bar>
                  <ReferenceLine x={90} stroke={BLUE} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
      </>)}

      {/* ══ SCANNERS ══════════════════════════════════════════════════════════ */}
      {tab === 'scanners' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total scanners')}  value="22"    delta={tt('21 on · 1 off')}      trend="flat" icon={ShieldCheck}  accent />
          <KpiCard label={tt('CIS scanners')}     value="7"     delta={tt('all enabled')}         trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Threat Intel')}     value="5"     delta={tt('hourly refresh')}      trend="up"   icon={AlertTriangle}/>
          <KpiCard label={tt('AI Safety')}         value="1"     delta={tt('Cortex Guard · live')} trend="up"   icon={Activity}    />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {['All', 'CIS', 'Security Essentials', 'Threat Intelligence', 'AI Safety'].map(c => (
            <button
              key={c}
              onClick={() => setScannerCat(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${scannerCat === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Scanner registry')}>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredScanners.map((s) => (
                <div
                  key={s.id}
                  className={`border rounded p-2 text-[11px] flex items-center justify-between ${s.findings > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-black/5 bg-white'}`}
                >
                  <div>
                    <div className="font-mono font-semibold">{s.id}</div>
                    <div className="text-[9px] text-vfes-dark/50 uppercase tracking-widest">{s.cat} · {s.last}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.findings > 0
                      ? <span className="text-amber-600 font-bold">{s.findings}</span>
                      : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${s.status === 'enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'}`}>
                      {s.status === 'enabled' ? 'on' : 'off'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title={tt('Findings by scanner category')}>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={CAT_FINDINGS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="findings" name={tt('Findings')} radius={[4, 4, 0, 0]}>
                      {CAT_FINDINGS.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Scanner coverage by category (%)')}>
              <div className="space-y-3">
                {[
                  { l: 'CIS Benchmarks',      s: 85,  target: 90  },
                  { l: 'Security Essentials',  s: 92,  target: 95  },
                  { l: 'Threat Intelligence',  s: 100, target: 100 },
                  { l: 'AI Safety',            s: 100, target: 100 },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold">{tt(m.l)}</span>
                      <span className="font-mono">{m.s}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div className={`h-full ${m.s >= m.target ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${m.s}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">
                  {tt('Open Observability →')}
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ FINDINGS ═══════════════════════════════════════════════════════════ */}
      {tab === 'findings' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open findings')}   value="26"  delta="-12 MoM"           trend="up"   icon={AlertTriangle} accent />
          <KpiCard label={tt('High severity')}    value="2"   delta={tt('action needed')} trend="down" icon={Bell}         />
          <KpiCard label={tt('Medium severity')}  value="8"   delta="-4 MoM"             trend="up"   icon={Activity}     />
          <KpiCard label={tt('Low severity')}      value="16"  delta="-8 MoM"             trend="up"   icon={CheckCircle2} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Severity:')}</span>
          {['All', 'H', 'M', 'L'].map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sevFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {s === 'All' ? tt('All') : s === 'H' ? tt('High') : s === 'M' ? tt('Medium') : tt('Low')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Active findings — Trust Center')}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Sev')}</th>
                    <th className="text-left">{tt('Finding')}</th>
                    <th className="text-left">{tt('Target')}</th>
                    <th className="text-left">{tt('Remediation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFindings.map((f, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${f.sev === 'H' ? 'bg-rose-100 text-rose-700' : f.sev === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {f.sev}
                        </span>
                      </td>
                      <td className="text-[11px] font-semibold pr-2">{f.f}</td>
                      <td className="font-mono text-[10px] text-vfes-dark/70">{f.target}</td>
                      <td className="text-[10px] text-vfes-dark/55">→ {tt(f.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-3 text-[10px]">
                <Link to="/portal/risk" className="font-bold text-vfes-dark hover:underline">{tt('Risk Register →')}</Link>
                <span className="text-vfes-dark/40">·</span>
                <Link to="/portal/ciso" className="font-bold text-vfes-dark hover:underline">{tt('CISO Dashboard →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title={tt('Severity distribution')}>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={SEV_BUCKETS} dataKey="c" nameKey="s" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {SEV_BUCKETS.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Remediation velocity (6 months)')}>
              <div className="h-44">
                <ResponsiveContainer>
                  <BarChart data={REM_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="open"     name={tt('Open')}     fill={AMBER} />
                    <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ══ CIS BENCHMARKS ═══════════════════════════════════════════════════ */}
      {tab === 'cis' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CIS pass rate')}    value="83%"    delta={tt('10 of 12 controls')} trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('Access Control')}    value="2 / 3"  delta={tt('CIS-1.1 fail')}      trend="down" icon={Key}         />
          <KpiCard label={tt('Network controls')}  value="2 / 3"  delta={tt('CIS-2.3 fail')}      trend="down" icon={Network}     />
          <KpiCard label={tt('Data Protection')}   value="2 / 2"  delta={tt('all pass')}           trend="up"   icon={Lock}        />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Section:')}</span>
          {['All', 'Access Control', 'Network', 'Data Protection', 'Monitoring', 'Sharing'].map(s => (
            <button
              key={s}
              onClick={() => setCisSection(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${cisSection === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}
            >
              {tt(s)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('CIS Snowflake benchmark — control scorecard')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('ID')}</th>
                  <th className="text-left">{tt('Section')}</th>
                  <th className="text-left">{tt('Description')}</th>
                  <th className="text-right">{tt('Score')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCis.map((c) => (
                  <tr key={c.id} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-bold">{c.id}</td>
                    <td className="text-[10px] text-vfes-dark/60">{tt(c.section)}</td>
                    <td className="text-[11px] pr-2">{tt(c.desc)}</td>
                    <td className={`text-right font-mono font-bold ${c.score >= 90 ? 'text-emerald-600' : c.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {c.score}
                    </td>
                    <td>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {tt(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="space-y-4">
            <Panel title={tt('CIS control scores — horizontal bar')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={filteredCis} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="id" tick={{ fontSize: 9 }} width={58} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="score" name={tt('Score')} radius={[0, 4, 4, 0]}>
                      {filteredCis.map((c, i) => <Cell key={i} fill={c.score >= 90 ? GREEN : c.score >= 70 ? AMBER : '#dc2626'} />)}
                    </Bar>
                    <ReferenceLine x={90} stroke={GREEN} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('CIS remediation guidance')}</div>
              <div className="text-sm text-vfes-dark/80 mb-3">
                {tt('Fix CIS-1.1 and CIS-2.3 this sprint → 95% pass rate, posture score 96.')}
              </div>
              <div className="flex gap-3 text-xs">
                <Link to="/portal/rbac" className="font-bold text-vfes-dark hover:underline">{tt('RBAC Explorer →')}</Link>
                <Link to="/portal/regulatory" className="font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
              </div>
            </div>
          </div>
        </div>
      </>)}

      {/* ══ DATA PROTECTION ══════════════════════════════════════════════════ */}
      {tab === 'data-protection' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Domains protected')}  value="5 / 6"   delta={tt('AI outputs in progress')} trend="up"   icon={Lock}     accent />
          <KpiCard label={tt('PII columns masked')}  value="248/248" delta={tt('0 gap')}                  trend="flat" icon={Database} />
          <KpiCard label={tt('CMK / TSS active')}    value={tt('Yes')} delta={tt('Tri-Secret Secure')}     trend="up"   icon={Key}     />
          <KpiCard label={tt('Re-keying cadence')}   value="14d"     delta={tt('last run 3d ago')}         trend="up"   icon={RefreshCw}/>
        </div>

        <Panel title={tt('Data protection coverage by domain')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Domain')}</th>
                <th className="text-right">{tt('Tables')}</th>
                <th className="text-right">{tt('Masked')}</th>
                <th className="text-right">{tt('RLS')}</th>
                <th className="text-right">{tt('Encrypted')}</th>
                <th className="text-right">{tt('Classified %')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {DATA_PROT.map((d) => (
                <tr key={d.domain} className="border-b border-black/5">
                  <td className="py-2 font-semibold text-[11px]">{tt(d.domain)}</td>
                  <td className="text-right font-mono">{d.tables}</td>
                  <td className={`text-right font-mono ${d.masked < d.tables ? 'text-amber-600' : 'text-emerald-600'}`}>{d.masked}</td>
                  <td className="text-right font-mono">{d.rls}</td>
                  <td className="text-right text-emerald-600 font-bold">{d.encrypted}</td>
                  <td className={`text-right font-bold ${d.classified >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.classified}%</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.status === 'Protected' ? 'bg-emerald-100 text-emerald-700' : d.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {tt(d.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/horizon" className="font-bold text-vfes-dark hover:underline">{tt('Horizon Governance →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/catalog" className="font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Classification coverage by domain (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={DATA_PROT} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 8 }} width={142} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="classified" name={tt('Classified %')} radius={[0, 4, 4, 0]}>
                    {DATA_PROT.map((d, i) => <Cell key={i} fill={d.classified >= 90 ? GREEN : AMBER} />)}
                  </Bar>
                  <ReferenceLine x={90} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Masking & table coverage')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={DATA_PROT}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 8 }} angle={-18} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tables" name={tt('Total')}  fill={SLATE} />
                  <Bar dataKey="masked" name={tt('Masked')} fill={BLUE}  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ MFA & NETWORK ════════════════════════════════════════════════════ */}
      {tab === 'mfa-network' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MFA enrolled')}        value="99.4%"   delta="+0.3 pp MoM"            trend="up"   icon={Users}      accent />
          <KpiCard label={tt('SSO via Entra ID')}     value="100%"    delta={tt('all human users')}   trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Network policies')}     value="6"       delta={tt('all roles covered')} trend="flat" icon={Network}    />
          <KpiCard label={tt('Key-pair auth (svc)')}  value="22 / 24" delta={tt('2 pending')}         trend="up"   icon={Key}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MFA enrollment trend — 6 months (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={MFA_TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[95, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="enrolled"  name={tt('Enrolled')}   stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="active30d" name={tt('Active 30d')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={98} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">
              {tt('Amber = 98% SLA · 0.6% exempt svc accounts (key-pair)')}
            </div>
          </Panel>

          <Panel title={tt('Network policies — active registry')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Policy')}</th>
                  <th className="text-left">{tt('Type')}</th>
                  <th className="text-right">{tt('IPs')}</th>
                  <th className="text-left">{tt('Attached to')}</th>
                  <th className="text-left">{tt('Modified')}</th>
                </tr>
              </thead>
              <tbody>
                {NETWORK_POLICIES.map((p) => (
                  <tr key={p.name} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px] font-semibold">{p.name}</td>
                    <td className="text-[10px] text-vfes-dark/60">{tt(p.type)}</td>
                    <td className="text-right font-mono">{p.ips}</td>
                    <td className="text-[10px] text-vfes-dark/70">{p.attached_to}</td>
                    <td className="font-mono text-[10px]">{p.modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">
                {tt('Fraud & Threat Intelligence →')}
              </Link>
            </div>
          </Panel>
        </div>

        <Panel
          title={tt('Mobile / RAN compliance posture')}
          action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />{tt('GSMA · URCA · DPA')}
            </span>
          }
        >
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Control')}</th>
                <th>{tt('Framework')}</th>
                <th>{tt('Status')}</th>
                <th>{tt('Last assessed')}</th>
                <th>{tt('Evidence')}</th>
                <th>{tt('Owner')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_TRUST.map((c) => (
                <tr key={c.control} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(c.control)}</td>
                  <td className="text-[11px] font-mono text-vfes-dark/65">{c.framework}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'compliant' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {tt(c.status)}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{c.lastAssessed}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(c.evidence)}</td>
                  <td className="text-[11px]">{tt(c.owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">
            {tt('5 of 7 mobile controls compliant. URCA incident reporting + O-RAN security profile closing Q3 2026.')}
          </div>
        </Panel>
      </>)}

      {/* ══ ACCESS HISTORY ════════════════════════════════════════════════════ */}
      {tab === 'access-history' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Queries (24h)')}       value="142K"  delta="+8% WoW"              trend="up"   icon={Database}      accent />
          <KpiCard label={tt('Unique users (24h)')}  value="284"   delta={tt('of 1,840 total')}  trend="flat" icon={Users}         />
          <KpiCard label={tt('Watch events')}         value="2"     delta={tt('under review')}    trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Failed logins (24h)')} value="6"     delta={tt('all auto-locked')}  trend="up"   icon={Lock}         />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter user:')}</span>
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-vfes-dark/40" />
            <input
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              placeholder={tt('search username…')}
              className="text-xs bg-transparent outline-none w-40"
            />
          </div>
        </div>

        <Panel title={tt('Recent access — ACCOUNT_USAGE.QUERY_HISTORY (last 24h)')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('User')}</th>
                <th className="text-left">{tt('Role')}</th>
                <th className="text-left">{tt('Object')}</th>
                <th className="text-left">{tt('Action')}</th>
                <th className="text-right">{tt('Rows')}</th>
                <th className="text-left">{tt('Timestamp')}</th>
                <th className="text-left">{tt('Risk')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessHist.map((h, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{h.user}</td>
                  <td className="text-[10px] text-vfes-dark/70">{h.role}</td>
                  <td className="font-mono text-[10px]">{h.obj}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${h.action === 'WRITE' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                      {h.action}
                    </span>
                  </td>
                  <td className="text-right font-mono text-[10px]">{h.rows.toLocaleString()}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/60">{h.ts}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${h.risk === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {tt(h.risk)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/lineage" className="font-bold text-vfes-dark hover:underline">{tt('Data Lineage →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/observability" className="font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Row access volume by user — top 8 (24h)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ACCESS_HIST} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="user" tick={{ fontSize: 10 }} width={106} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rows" name={tt('Rows accessed')} radius={[0, 4, 4, 0]}>
                    {ACCESS_HIST.map((h, i) => <Cell key={i} fill={h.risk === 'Watch' ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ REMEDIATION ══════════════════════════════════════════════════════ */}
      {tab === 'remediation' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open tickets')}        value="5"    delta={tt('of 7 total')}          trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('In progress')}          value="2"    delta={tt('SEC-2042 · SEC-2038')} trend="flat" icon={Activity}     />
          <KpiCard label={tt('Resolved this month')}  value="2"    delta={tt('+8 YTD total')}        trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Avg days to close')}    value="12d"  delta="-4d vs Q1"                  trend="up"   icon={TrendingUp}  />
        </div>

        <Panel title={tt('Remediation tracking — active findings')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Ticket')}</th>
                <th className="text-left">{tt('Sev')}</th>
                <th className="text-left">{tt('Finding')}</th>
                <th className="text-left">{tt('Owner')}</th>
                <th className="text-left">{tt('Due date')}</th>
                <th className="text-left">{tt('Effort')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {REMEDIATION_TRACK.map((r) => (
                <tr key={r.ticket} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[10px] font-bold text-vfes-dark">{r.ticket}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.sev === 'H' ? 'bg-rose-100 text-rose-700' : r.sev === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {r.sev}
                    </span>
                  </td>
                  <td className="text-[11px] font-semibold pr-2">{tt(r.finding)}</td>
                  <td className="text-[10px] text-vfes-dark/70">{r.owner}</td>
                  <td className="font-mono text-[10px]">{r.due}</td>
                  <td className="text-[10px] text-vfes-dark/60">{tt(r.effort)}</td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${REMTAG_C[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {tt(r.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3 text-[10px]">
            <Link to="/portal/risk" className="font-bold text-vfes-dark hover:underline">{tt('Risk Register →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/ciso" className="font-bold text-vfes-dark hover:underline">{tt('CISO Dashboard →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Remediation velocity — open vs resolved (6 months)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={REM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="open"     name={tt('Open')}     fill={AMBER} />
                  <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} />
                  <Line
                    type="monotone"
                    dataKey="open"
                    name={tt('Open trend')}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Open findings by effort level')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: tt('Low'),  value: 4 },
                      { name: tt('Med'),  value: 2 },
                      { name: tt('High'), value: 1 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    <Cell fill={GREEN} />
                    <Cell fill={AMBER} />
                    <Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Security operations')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Route high-severity items to CISO war-room. Check risk register for cross-domain impact.')}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 ml-4">
            <Link
              to="/portal/ciso"
              className="bg-vfes-red text-vfes-dark text-xs font-bold px-3 py-2 rounded-lg hover:bg-vfes-red-dark text-center"
            >
              {tt('CISO War Room →')}
            </Link>
            <Link
              to="/portal/risk"
              className="border border-vfes-red text-vfes-dark text-xs font-bold px-3 py-2 rounded-lg hover:bg-vfes-red/5 text-center"
            >
              {tt('Risk Register →')}
            </Link>
          </div>
        </div>
      </>)}

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2 mt-6">
        <ShieldCheck className="w-3 h-3" />
        {tt('source: SNOWFLAKE.TRUST_CENTER.* · CIS_BENCHMARK · CORTEX_GUARD · refreshed daily + threat-intel hourly')}
      </div>
    </div>
  )
}
