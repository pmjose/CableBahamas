// =============================================================================
// CISO Executive Cockpit — Chief Information Security Officer · Lars Rolle
// 7 tabs · Overview · Threats/SOC · Vulnerabilities · Fraud/Signaling
//          · IAM/RBAC · Compliance/Trust · Incidents
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import {
  ShieldCheck, ShieldAlert, Key, Eye, Scale, Lock, Bug, FileWarning,
  Fingerprint, Activity, AlertTriangle, AlertOctagon, Clock, Globe,
  Zap, Database, CheckCircle, Radio,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const C1 = '#FF4438', C2 = '#11567F', C3 = '#10B981', C4 = '#F59E0B', C5 = '#7C3AED', C6 = '#94a3b8'
const RED = '#EF4444'

const sevColor = (s: string) =>
  s === 'Critical' ? 'bg-red-600 text-white'
  : s === 'High' ? 'bg-red-100 text-red-700'
  : s === 'Medium' ? 'bg-amber-100 text-amber-700'
  : s === 'Low' ? 'bg-blue-100 text-blue-700'
  : s === 'Open' ? 'bg-red-50 text-red-700'
  : s === 'Closed' ? 'bg-emerald-50 text-emerald-700'
  : s === 'Contained' ? 'bg-blue-50 text-blue-700'
  : 'bg-zinc-100 text-zinc-700'

// ─── Threats / SOC ────────────────────────────────────────────────────────────

const socKpis = { mttd: 14, mtta: 8, mttr: 162, fpr: 18, alerts30d: 4280, cases30d: 184, incidents30d: 12 }

const socFunnel = [
  { stage: 'Events',      n: 18_400_000 },
  { stage: 'Correlated',  n: 124_000    },
  { stage: 'Alerts',      n: 4_280      },
  { stage: 'Cases',       n: 184        },
  { stage: 'Incidents',   n: 12         },
]

const threatEvents = [
  { t: '14:32', sev: 'High',     desc: 'DDoS mitigation activated — POP Freeport (220 Gbps L3+L4)',    mitre: 'T1498', status: 'Contained'   },
  { t: '12:08', sev: 'Critical', desc: 'Suspicious SIM-swap blocked · 4 accounts',                    mitre: 'T1556', status: 'Closed'      },
  { t: '11:42', sev: 'High',     desc: 'BGP route-leak from peer · invalid RPKI filter active',        mitre: 'T1583', status: 'Closed'      },
  { t: '10:18', sev: 'Medium',   desc: 'Anomalous SS7 location probes (3 sources)',                   mitre: 'T1430', status: 'Investigating'},
  { t: '09:44', sev: 'Medium',   desc: 'Brute-force customer portal · 1.2K attempts blocked',         mitre: 'T1110', status: 'Closed'      },
  { t: '08:21', sev: 'Low',      desc: 'Admin login from new IP — verified',                          mitre: 'T1078', status: 'Closed'      },
  { t: '06:55', sev: 'High',     desc: 'Employee phishing campaign · 38 clicks',                      mitre: 'T1566', status: 'Contained'   },
  { t: '05:14', sev: 'Critical', desc: 'IRSF voice-fraud spike — Sierra Leone block activated',        mitre: 'T1657', status: 'Closed'      },
]

const mitreCoverage = [
  { tactic: 'Reconnaissance',  rules: 18, gaps: 4,  hits7d: 142 },
  { tactic: 'Initial Access',  rules: 32, gaps: 6,  hits7d: 86  },
  { tactic: 'Execution',       rules: 22, gaps: 8,  hits7d: 18  },
  { tactic: 'Persistence',     rules: 28, gaps: 4,  hits7d: 12  },
  { tactic: 'Priv Escal.',     rules: 24, gaps: 6,  hits7d: 8   },
  { tactic: 'Defence Evasion', rules: 38, gaps: 12, hits7d: 24  },
  { tactic: 'Credential',      rules: 32, gaps: 4,  hits7d: 64  },
  { tactic: 'Lateral Mov.',    rules: 22, gaps: 6,  hits7d: 14  },
  { tactic: 'C2',              rules: 28, gaps: 4,  hits7d: 22  },
]

const threatActors = [
  { actor: 'Volt Typhoon (China)',    target: 'Telco / critical infra', activity: 'Active scanning · BGP probes',          iocsHit: 12, sev: 'High'   },
  { actor: 'Sandworm (Russia)',       target: 'Telco signalling',   activity: 'GTP probing observed (no entry)',       iocsHit:  4, sev: 'Medium' },
  { actor: 'FIN-7',                   target: 'Billing/POS carrier',   activity: 'Spear-phish to 12 finance users',      iocsHit: 18, sev: 'High'   },
  { actor: 'Storm-1567',              target: 'SMB telco US',          activity: 'IRSF / Wangiri ramp',                 iocsHit: 28, sev: 'Medium' },
]

// ─── Vulnerabilities ──────────────────────────────────────────────────────────
const SEV_KEYS = ['All', 'Critical', 'High', 'Medium', 'Low'] as const
type VulnSevFilter = typeof SEV_KEYS[number]

const vulnsBySev = [
  { sev: 'Critical (KEV)',  open: 2,   mttr: 3,  sla: 3,  pctInSla: 100 },
  { sev: 'Critical',        open: 6,   mttr: 4,  sla: 7,  pctInSla: 100 },
  { sev: 'High',            open: 38,  mttr: 14, sla: 30, pctInSla: 92  },
  { sev: 'Medium',          open: 142, mttr: 42, sla: 60, pctInSla: 86  },
  { sev: 'Low',             open: 384, mttr: 78, sla: 90, pctInSla: 72  },
]

const vulnTrend = [
  { mo: 'Jan', opened: 64, closed: 58, backlog: 480 },
  { mo: 'Feb', opened: 72, closed: 62, backlog: 490 },
  { mo: 'Mar', opened: 58, closed: 68, backlog: 480 },
  { mo: 'Apr', opened: 66, closed: 72, backlog: 474 },
  { mo: 'May', opened: 60, closed: 74, backlog: 460 },
  { mo: 'Jun', opened: 54, closed: 68, backlog: 446 },
]

const assetCoverage = [
  { layer: 'Endpoints (EDR)',       covered: 0.98 },
  { layer: 'Servers (EDR)',         covered: 0.96 },
  { layer: 'Containers (CWPP)',     covered: 0.74 },
  { layer: 'Network OS',            covered: 0.84 },
  { layer: 'Cloud (CSPM)',          covered: 0.92 },
  { layer: 'OT / SCADA',           covered: 0.62 },
]

// ─── Fraud / Signaling ────────────────────────────────────────────────────────

const fraudSummary = [
  { type: 'SIM-swap',             attempts: 142,    blocked: 136,   lossK: 12,  channel: 'Retail/Care'  },
  { type: 'IRSF voice fraud',     attempts: 840,    blocked: 820,   lossK: 28,  channel: 'Voice'        },
  { type: 'Wangiri',              attempts: 4_400,  blocked: 4_380, lossK: 4,   channel: 'Voice'        },
  { type: 'SMS pumping',          attempts: 12_400, blocked: 12_200,lossK: 38,  channel: 'Messaging'    },
  { type: 'Smishing',             attempts: 6_400,  blocked: 6_280, lossK: 12,  channel: 'Messaging'    },
  { type: 'Identity / app fraud', attempts: 2_840,  blocked: 2_780, lossK: 48,  channel: 'Web/App'      },
  { type: 'Fraudulent porting',   attempts: 86,     blocked: 82,    lossK: 6,   channel: 'Mobile'       },
  { type: 'Dealer commission',      attempts: 38,     blocked: 34,    lossK: 22,  channel: 'Partner'      },
]

const ddosTrend = [
  { mo: 'Jan', attacks: 28, peakGbps: 240, mitigatedMin: 420 },
  { mo: 'Feb', attacks: 22, peakGbps: 180, mitigatedMin: 340 },
  { mo: 'Mar', attacks: 32, peakGbps: 380, mitigatedMin: 580 },
  { mo: 'Apr', attacks: 24, peakGbps: 210, mitigatedMin: 380 },
  { mo: 'May', attacks: 18, peakGbps: 160, mitigatedMin: 290 },
  { mo: 'Jun', attacks: 18, peakGbps: 220, mitigatedMin: 286 },
]

const mfaCoverage = [
  { group: 'Employees',    mfa: 100, target: 100 },
  { group: 'Contractors',  mfa: 94,  target: 100 },
  { group: 'Customers',    mfa: 78,  target: 85  },
  { group: 'B2B portal',  mfa: 92,  target: 95  },
]

const signallingProbes = [
  { protocol: 'SS7',      probes: 124, blocked: 120, intercepts: 0 },
  { protocol: 'Diameter', probes: 86,  blocked: 84,  intercepts: 0 },
  { protocol: 'GTP',      probes: 38,  blocked: 36,  intercepts: 0 },
  { protocol: 'SMS OTP',  probes: 12,  blocked: 12,  intercepts: 0 },
]

const fraudTrend = [
  { mo: 'Jan', simSwap: 18, irsf: 42, smsPump: 58, lossK: 184 },
  { mo: 'Feb', simSwap: 16, irsf: 38, smsPump: 52, lossK: 168 },
  { mo: 'Mar', simSwap: 14, irsf: 34, smsPump: 48, lossK: 154 },
  { mo: 'Apr', simSwap: 12, irsf: 30, smsPump: 44, lossK: 140 },
  { mo: 'May', simSwap: 10, irsf: 28, smsPump: 40, lossK: 128 },
  { mo: 'Jun', simSwap: 8,  irsf: 24, smsPump: 36, lossK: 114 },
]

// ─── IAM / RBAC ───────────────────────────────────────────────────────────────
const iamStats = {
  employees: 1840, contractors: 280, privileged: 64, serviceAccts: 412,
  mfaPrivileged: 100, mfaEmployee: 100, mfaContractor: 94, mfaCustomer: 78,
  pamCoverage: 97, jitElevations: 142, stale90d: 18, leaversPending: 4,
  sodViolations: 6, secretsInCode: 4,
}

const accountInventory = [
  { kind: 'Employees',           n: 1840,       mfa: '100%',       risk: 'Low'    },
  { kind: 'Contractors',          n: 280,        mfa: '94%',        risk: 'Medium' },
  { kind: 'Privileged admins',    n: 64,         mfa: '100% + PAM', risk: 'Low'    },
  { kind: 'Service accounts',     n: 412,        mfa: 'N/A',        risk: 'Medium' },
  { kind: 'B2C Customers',        n: 1_040_000,  mfa: '78%',        risk: 'Medium' },
  { kind: 'Portal B2B',           n: 12_400,     mfa: '92%',        risk: 'Low'    },
]

const rbacTrend = [
  { mo: 'Jan', stale: 28, violations: 12, jitElev: 98,  reviewsPending: 142 },
  { mo: 'Feb', stale: 24, violations: 10, jitElev: 108, reviewsPending: 124 },
  { mo: 'Mar', stale: 22, violations: 8,  jitElev: 118, reviewsPending: 110 },
  { mo: 'Apr', stale: 20, violations: 7,  jitElev: 128, reviewsPending: 96  },
  { mo: 'May', stale: 18, violations: 6,  jitElev: 138, reviewsPending: 84  },
  { mo: 'Jun', stale: 18, violations: 6,  jitElev: 142, reviewsPending: 72  },
]

// ─── Compliance / Trust ───────────────────────────────────────────────────────

const complianceItems = [
  { framework: 'URCA cyber',        status: 'On-track',  score: 82, gap: 18, dueDate: '2025-10-17', owner: 'GRC' },
  { framework: 'DPA',        status: 'Compliant', score: 96, gap: 4,  dueDate: 'Ongoing',    owner: 'DPO' },
  { framework: 'AI policy',      status: 'At-risk',   score: 64, gap: 36, dueDate: '2026-08-01', owner: 'CISO'},
  { framework: 'PCI-DSS 4.0', status: 'Compliant', score: 98, gap: 2,  dueDate: '2026-03-31', owner: 'GRC' },
  { framework: 'URCA (AAEE)', status: 'On-track',  score: 88, gap: 12, dueDate: '2025-12-31', owner: 'Reg' },
  { framework: 'CCB Cyber Fundamentals', status: 'Compliant', score: 94, gap: 6, dueDate: '2026-01-15', owner: 'GRC'},
]

const nistMaturity = [
  { domain: 'Identify',  score: 4.2 },
  { domain: 'Protect',   score: 4.0 },
  { domain: 'Detect',    score: 4.4 },
  { domain: 'Respond',   score: 3.8 },
  { domain: 'Recover',   score: 3.6 },
  { domain: 'Govern',    score: 4.2 },
]

const dataSec = {
  classified: 86, tokenisationCov: 74, kmsRotation: 96, atRest: 99, inTransit: 98, dlpEvents30d: 142,
}

// ─── Incidents ────────────────────────────────────────────────────────────────

const INC_KEYS = ['All', 'Critical', 'High', 'Medium', 'Low'] as const
type IncSevFilter = typeof INC_KEYS[number]

const incidentLog = [
  { id: 'INC-2026-0033', title: 'Third-party SQLi → BSS billing',   sev: 'Critical', status: 'Closed',    opened: '2026-05-04', mttr: 720,  mitre: 'T1190,T1059' },
  { id: 'INC-2026-0029', title: 'IPTV CDN poisoning',                sev: 'High',     status: 'Contained', opened: '2026-05-18', mttr: null, mitre: 'T1070,T1565' },
  { id: 'INC-2026-0021', title: 'OSS portal auth outage',            sev: 'Low',      status: 'Closed',    opened: '2026-04-22', mttr: 14,   mitre: 'T1496'       },
  { id: 'INC-2026-0014', title: 'Mobile core signalling storm',       sev: 'Medium',   status: 'Closed',    opened: '2026-04-12', mttr: 38,   mitre: 'T1499,T1430' },
  { id: 'INC-2026-0008', title: 'Mass employee phishing (FIN-7)',     sev: 'High',     status: 'Closed',    opened: '2026-03-28', mttr: 128,  mitre: 'T1566'       },
  { id: 'INC-2026-0003', title: 'DDoS 380 Gbps — POP Nassau',       sev: 'High',    status: 'Closed',    opened: '2026-03-08', mttr: 22,   mitre: 'T1498'       },
]

const incidentTrend = [
  { mo: 'Jan', critical: 1, high: 3, medium: 4, low: 2 },
  { mo: 'Feb', critical: 0, high: 2, medium: 3, low: 3 },
  { mo: 'Mar', critical: 1, high: 3, medium: 5, low: 2 },
  { mo: 'Apr', critical: 0, high: 2, medium: 4, low: 4 },
  { mo: 'May', critical: 1, high: 2, medium: 3, low: 2 },
  { mo: 'Jun', critical: 0, high: 2, medium: 2, low: 1 },
]

// ─── Board & Cyber Risk Quantification data ───────────────────────────────────
// FAIR risk model: Loss Event Frequency × Loss Magnitude
const fairRisks = [
  { risk: 'Mass data breach (PII ≥1M records)',       lef: 0.08, minLoss: 2.4,   maxLoss: 18.0,  annualExp: 1.64, category: 'Data'     },
  { risk: 'Ransomware on BSS/OSS',                    lef: 0.12, minLoss: 4.0,   maxLoss: 28.0,  annualExp: 3.84, category: 'Ops'      },
  { risk: 'Sustained DDoS (≥48h core unavailable)',   lef: 0.06, minLoss: 8.0,   maxLoss: 42.0,  annualExp: 3.00, category: 'Network'  },
  { risk: 'SIM-swap account-takeover wave',            lef: 0.22, minLoss: 0.4,   maxLoss:  4.0,  annualExp: 0.93, category: 'Fraud'    },
  { risk: 'Insider data exfiltration',                 lef: 0.18, minLoss: 0.8,   maxLoss:  6.0,  annualExp: 1.24, category: 'Insider'  },
  { risk: 'Supply-chain compromise (Ericsson SW)',     lef: 0.04, minLoss: 6.0,   maxLoss: 38.0,  annualExp: 1.76, category: 'Supply'   },
  { risk: 'SS7 intercept / lawful intercept audit',    lef: 0.10, minLoss: 0.4,   maxLoss:  3.0,  annualExp: 0.37, category: 'Signaling'},
  { risk: 'DPA enforcement action',                   lef: 0.15, minLoss: 1.2,   maxLoss: 12.0,  annualExp: 1.98, category: 'Compliance'},
]

const boardMetrics = [
  { m: 'Jan', cyberRisk: 14.2, residual: 10.8, budget: 8.4 },
  { m: 'Feb', cyberRisk: 13.8, residual: 10.2, budget: 8.4 },
  { m: 'Mar', cyberRisk: 13.4, residual:  9.8, budget: 8.4 },
  { m: 'Apr', cyberRisk: 13.0, residual:  9.4, budget: 8.4 },
  { m: 'May', cyberRisk: 12.6, residual:  9.0, budget: 8.4 },
  { m: 'Jun', cyberRisk: 12.2, residual:  8.6, budget: 8.4 },
]

const cyberInsuranceCoverage = [
  { layer: 'First-party breach response',      limit: 5.0,  premium: 0.42, deductible: 0.25, used: 0.0 },
  { layer: 'Business interruption',            limit: 20.0, premium: 0.84, deductible: 1.0,  used: 0.0 },
  { layer: 'Third-party liability',             limit: 10.0, premium: 0.36, deductible: 0.5,  used: 0.0 },
  { layer: 'Regulatory fines (URCA enforcement)',  limit: 8.0,  premium: 0.28, deductible: 0.5,  used: 0.0 },
]

const riskHeatmapData = [
  { category: 'Data',       likelihood: 4, impact: 5 },
  { category: 'Ops',        likelihood: 5, impact: 4 },
  { category: 'Network',    likelihood: 3, impact: 5 },
  { category: 'Fraud',      likelihood: 5, impact: 2 },
  { category: 'Insider',    likelihood: 4, impact: 3 },
  { category: 'Supply',     likelihood: 2, impact: 5 },
  { category: 'Signaling',  likelihood: 3, impact: 2 },
  { category: 'Compliance', likelihood: 4, impact: 4 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'threats' | 'vulns' | 'fraud' | 'iam' | 'compliance' | 'incidents' | 'boardrisk'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',    label: 'Overview'             },
  { id: 'threats',     label: 'Threats / SOC'        },
  { id: 'vulns',       label: 'Vulnerabilities'      },
  { id: 'fraud',       label: 'Fraud / Signaling'    },
  { id: 'iam',         label: 'IAM / RBAC'           },
  { id: 'compliance',  label: 'Compliance / Trust'   },
  { id: 'incidents',   label: 'Incidents'            },
  { id: 'boardrisk',   label: 'Board & Cyber Risk'   },
]

const compStatusColor = (s: string) =>
  s === 'Compliant' ? 'bg-emerald-100 text-emerald-700'
  : s === 'On-track' ? 'bg-blue-100 text-blue-700'
  : 'bg-amber-100 text-amber-700'

// =============================================================================
export default function CISOPage() {
  const [tab, setTab]               = useState<TabId>('overview')
  useEffect(() => { try { localStorage.setItem('ciso-tab', tab) } catch { /* ignore */ } }, [tab])

  const [vulnFilter, setVulnFilter] = useState<VulnSevFilter>('All')
  const [incFilter,  setIncFilter]  = useState<IncSevFilter>('All')

  const filteredVulns = useMemo(
    () => vulnFilter === 'All' ? vulnsBySev : vulnsBySev.filter(v => v.sev.startsWith(vulnFilter)),
    [vulnFilter],
  )
  const filteredIncs = useMemo(
    () => incFilter === 'All' ? incidentLog : incidentLog.filter(i => i.sev === incFilter),
    [incFilter],
  )
  const fraudTotals = useMemo(() => ({
    totalAttempts: fraudSummary.reduce((s, f) => s + f.attempts, 0),
    totalBlocked:  fraudSummary.reduce((s, f) => s + f.blocked, 0),
    totalLossK:    fraudSummary.reduce((s, f) => s + f.lossK, 0),
    blockRate:     (fraudSummary.reduce((s, f) => s + f.blocked, 0) / fraudSummary.reduce((s, f) => s + f.attempts, 0) * 100).toFixed(1),
  }), [])

  const overviewStats = useMemo(() => ({
    openIncidents:   incidentLog.filter(i => i.status !== 'Closed').length,
    totalVulns:      vulnsBySev.reduce((s, v) => s + v.open, 0),
    complianceScore: Math.round(complianceItems.reduce((s, c) => s + c.score, 0) / complianceItems.length),
  }), [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Information Security Officer')}
        subtitle={tt('Office of the CISO · Lars Rolle · security, fraud & trust · live posture')}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/portal/trust-center" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {tt('Open Trust Center')}
            </Link>
            <Link to="/portal/risk" className="border border-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-vfes-red/5">
              <AlertOctagon className="w-4 h-4" /> {tt('Risk & Security')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Risk intelligence"
        models={[
          { name: 'SIM-swap Fraud Detector',    metric: 'recall 0.94', sub: 'real-time scoring'              },
          { name: 'Signalling-anomaly Model',   metric: 'AUC 0.92',   sub: 'SS7/Diameter abuse'              },
          { name: 'Access-anomaly Detector',    metric: 'recall 0.89', sub: 'privilege misuse (UEBA)'         },
        ]}
        agentLabel="Run Security Briefing" agentRunningLabel="Correlating…"
        agentSteps={[
          'Correlated authentication, network and fraud signals',
          'Open vulnerabilities scored vs active exploitation',
          'Anomalous privileged access patterns detected',
          'Containment and notification plan drafted',
        ]}
        agentBlurb="Row-access policies and access history live alongside the data — the CISO audits who-saw-what across all domains from a single governed control plane, without stitched logs."
        decision={{
          title: 'Block 2 high-risk SIM-swap requests, enforce step-up auth',
          detail: 'The fraud model has flagged two SIM-swap requests with high account-takeover probability — matching device, geo and velocity signals. Automatic hold and step-up verification prevents account takeover while legitimate users self-manage.',
          impact: 'prevents ~BSD 90K fraud loss · protects 2 accounts',
          risk: 'low false-positive cost — genuine users pass step-up self-service',
          linkTo: '#/portal/fraud', linkLabel: 'Open Fraud & Signaling',
        }}
        chart={{
          kind: 'bar', title: 'Open findings by severity', xKey: 'sev', unit: '',
          data: [
            { sev: 'Critical', n: 2 }, { sev: 'High', n: 9 }, { sev: 'Medium', n: 31 }, { sev: 'Low', n: 64 },
          ],
          series: [{ key: 'n', name: 'Findings', color: RED }],
          colorBy: { key: 'n', high: 8, mid: 3 },
          note: 'Both critical findings (KEV CVEs) are within the SLA remediation window.',
        }}
      />

      {/* ── Tab nav ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ════════════════════════ OVERVIEW ════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Security posture')}     value="A−"   delta={`Trust Center · ${overviewStats.complianceScore}% avg`} trend="up"   icon={ShieldCheck}   accent />
          <KpiCard label={tt('Critical findings')}    value="2"    delta="within SLA"            trend="up"   icon={ShieldAlert}   />
          <KpiCard label={tt('Open KEV CVEs')}        value="2"    delta="in remediation"        trend="flat" icon={Bug}           />
          <KpiCard label={tt('Fraud blocked (month)')} value="BSD 312K" delta="+18% detection"     trend="up"   icon={Fingerprint}   />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MFA coverage')}         value="98.4%"  delta="privileged 100%"    trend="up"   icon={Lock}          />
          <KpiCard label={tt('MTTD / MTTR')}         value={`${socKpis.mttd}m / ${socKpis.mttr}m`} delta="MTTA 8m" trend="up" icon={Clock} />
          <KpiCard label={tt('Incidents (30d)')}     value={`${socKpis.incidents30d}`} delta="3 active"      trend="flat" icon={Activity}      />
          <KpiCard label={tt('NIST CSF avg')}        value="4.0 / 5.0" delta="target 4.5"       trend="up"   icon={CheckCircle}  />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CISO domain')}
            links={[
              { to: 'risk',          label: 'Risk & Security',    metric: tt('Risk register · threat posture'),            icon: ShieldCheck  },
              { to: 'fraud',         label: 'Fraud & Signaling',  metric: tt('SIM-swap · SS7 · revenue fraud'),            icon: ShieldAlert  },
              { to: 'trust-center',  label: 'Trust Center',       metric: tt('Findings · scanners · posture'),             icon: ShieldCheck  },
              { to: 'rbac',          label: 'RBAC Explorer',      metric: tt('Roles · grants · least privilege'),          icon: Key          },
              { to: 'horizon',       label: 'Horizon',            metric: tt('Access history · lineage governance'),       icon: Eye          },
              { to: 'data-contracts',label: 'Data Contracts',     metric: tt('PII handling · obligations'),                icon: FileWarning  },
              { to: 'regulatory',    label: 'Regulatory & ESG',   metric: tt('DPA · URCA cyber · URCA'),                       icon: Scale        },
              { to: 'observability', label: 'Observability',      metric: tt('Audit logs · alerts'),                      icon: Activity     },
              { to: 'incidents',     label: 'Incidents',          metric: tt('Security incident log'),                    icon: ShieldAlert  },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Security priorities — FY2026')}
              items={[
                { name: 'URCA cyber compliance programme',              owner: tt('GRC · L. Rolle'),      pct: 66, status: 'on-track' },
                { name: 'Zero Trust Network Access rollout',      owner: tt('Security Engineering'), pct: 54, status: 'on-track' },
                { name: 'Row-access policy coverage 100%',        owner: tt('Data Governance'),       pct: 82, status: 'on-track' },
                { name: 'SIM-swap fraud controls v2',             owner: tt('Fraud'),                 pct: 88, status: 'on-track' },
                { name: 'Privileged access review automation',    owner: tt('IAM'),                   pct: 47, status: 'at-risk'  },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CISO desk')}
            items={[
              { text: tt('2 high-risk SIM-swap attempts — blocked automatically'),              level: 'high'   },
              { text: tt('2 open known-exploited CVEs (KEV) — within remediation SLA'),          level: 'high'   },
              { text: tt('URCA consultation on outage compensation — compliance impact'),         level: 'medium' },
              { text: tt('Privileged access review backlog — automation in progress'),           level: 'medium' },
            ]}
          />
        </div>

        <AgendaList
          title={tt('CISO cadence')}
          items={[
            { what: tt('Daily threat stand-up'),             when: tt('09:00 daily')   },
            { what: tt('Security & risk committee'),           when: tt('Wed 9 Jul')     },
            { what: tt('URCA cyber readiness review'),               when: tt('Tue 15 Jul')    },
            { what: tt('Board risk update'),                   when: tt('Tue 22 Jul')    },
          ]}
        />
      </>)}

      {/* ════════════════════════ THREATS / SOC ═══════════════════════════════ */}
      {tab === 'threats' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTD')}              value={`${socKpis.mttd}m`}            delta="-3m YoY"              trend="up"   icon={Eye}          accent />
          <KpiCard label={tt('MTTA')}              value={`${socKpis.mtta}m`}            delta="-2m YoY"              trend="up"   icon={Clock}        />
          <KpiCard label={tt('MTTR')}              value={`${socKpis.mttr}m`}            delta="-22m YoY"             trend="up"   icon={Activity}     />
          <KpiCard label={tt('False positive rate')} value={`${socKpis.fpr}%`}           delta="rule backlog: 38"     trend="up"   icon={AlertTriangle}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Embudo SOC — 24 horas')} insight={{ insight: 'The SOC funnel spans 5 orders of magnitude from raw events to 12 confirmed daily incidents, with a false-positive rate above 99.9%.', action: 'Review the 20 correlation rules with the highest false-positive ratio to reduce SIEM alert noise and free analyst triage capacity.', impact: 'Cutting noise by 30% recovers analyst capacity equal to 1 FTE and lowers mean time to detect real threats.' }}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={socFunnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis scale="log" domain={[1, 'auto']} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => v.toLocaleString()} />
                    <Bar dataKey="n" name={tt('Volume')} radius={[4,4,0,0]}>
                      {socFunnel.map((_, i) => <Cell key={i} fill={[C6, C2, C4, RED, '#B50808'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/55 text-center mt-1">{tt('Log scale · ')} {socFunnel[0].n.toLocaleString()} {tt('events → ')} {socFunnel[4].n} {tt('incidents')}</div>
            </Panel>
          </div>

          <Panel title={tt('NIST CSF Maturity (1-5)')} insight={{ insight: 'The NIST CSF profile shows Recover and Respond as the lowest-scoring domains, both with a visible gap against the 4.5 target.', action: 'Prioritize investment in response and recovery capabilities through tabletop exercises and incident-response playbook updates.', impact: 'Raising Recover and Respond to 4.0 will reduce estimated MTTR by 35% and strengthen the audited posture against URCA cyber and ENS.' }}>
            <div className="h-264">
              <ResponsiveContainer width="100%" height={256}>
                <RadarChart data={nistMaturity}>
                  <PolarGrid stroke="#eef0f3" />
                  <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="score" stroke={C1} fill={C1} fillOpacity={0.35} />
                  <Tooltip contentStyle={TS} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('MITRE ATT&CK coverage — rules vs gaps vs hits 7d')} insight={{ insight: 'Exfiltration and Impact have the largest coverage gaps while 7-day hits are concentrated in Initial Access and Execution.', action: 'Deploy additional SIEM rules to close the Exfiltration and Impact gaps and correlate them with DLP alerts for end-to-end detection.', impact: 'Closing these coverage gaps increases detection probability before data exfiltration and reduces attacker dwell time in the network.' }}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={mitreCoverage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="tactic" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={60} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="rules" name={tt('Deployed rules')} fill={C3} />
                <Bar yAxisId="l" dataKey="gaps"  name={tt('Coverage gaps')}  fill={RED}  />
                <Line yAxisId="r" dataKey="hits7d" stroke="#1f2937" strokeWidth={2} name={tt('Hits 7d')} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Event stream — today')}>
            <div className="space-y-2">
              {threatEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                  <span className="text-xs text-vfes-dark/55 font-mono w-12 shrink-0">{e.t}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${sevColor(e.sev)}`}>{e.sev}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs">{tt(e.desc)}</div>
                    <div className="text-[10px] text-vfes-dark/55">MITRE {e.mitre}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${sevColor(e.status)}`}>{tt(e.status)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Active threat actors (TI feed)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-1.5">{tt('Actor')}</th>
                    <th>{tt('Activity')}</th>
                    <th>{tt('IoC hits')}</th>
                    <th>{tt('Sev')}</th>
                  </tr>
                </thead>
                <tbody>
                  {threatActors.map((a) => (
                    <tr key={a.actor} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{a.actor}</td>
                      <td className="text-vfes-dark/60 text-xs">{a.activity}</td>
                      <td>{a.iocsHit}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(a.sev)}`}>{a.sev}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/risk" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full security cockpit →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('DDoS attack trend — 6 months (attacks, peak Gbps, mitigation time)')} insight={{ insight: '142 DDoS attacks were recorded over 30 days with a 380 Gbps peak in March, and monthly volume has been trending upward since January.', action: 'Renegotiate the clean-pipe contract to raise mitigation capacity above 500 Gbps ahead of the expected Q3 peak.', impact: 'Increasing mitigation capacity ensures the 99.95% availability SLA and avoids regulatory penalties for critical service interruption.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={ddosTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="G" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="attacks"      name={tt('Attacks')}           fill={C2} />
                  <Bar yAxisId="l" dataKey="mitigatedMin" name={tt('Mitigated min')}      fill={C3} />
                  <Line yAxisId="r" type="monotone" dataKey="peakGbps" name={tt('Peak Gbps')} stroke={RED} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('142 DDoS attacks in 30d, 380 Gbps peak in Mar. Automatic mitigation (clean pipe + blackhole) absorbs 100% in under 5 minutes on average.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ VULNERABILITIES ═════════════════════════════ */}
      {tab === 'vulns' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open exploited KEVs')} value={`${vulnsBySev[0].open}`} delta={`MTTR ${vulnsBySev[0].mttr}d`} trend="up"  icon={AlertOctagon} accent />
          <KpiCard label={tt('Open Critical+High')}  value={`${vulnsBySev[0].open + vulnsBySev[1].open + vulnsBySev[2].open}`} delta="-12% monthly" trend="up" icon={Bug} />
          <KpiCard label={tt('P1 patch SLA')}          value={`${vulnsBySev[0].pctInSla}%`} delta="target 100%"                trend="up"   icon={CheckCircle}  />
          <KpiCard label={tt('Total backlog')}          value="572"                           delta="reducing"                    trend="up"   icon={Database}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel
            title={tt('Open vulnerabilities by severity')}
            action={
              <div className="flex gap-1">
                {SEV_KEYS.map(k => (
                  <button key={k} onClick={() => setVulnFilter(k)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${vulnFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                    {k}
                  </button>
                ))}
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Severity')}</th>
                    <th className="text-right">{tt('Open')}</th>
                    <th className="text-right">{tt('MTTR (d)')}</th>
                    <th className="text-right">{tt('SLA (d)')}</th>
                    <th className="text-right">{tt('In SLA %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVulns.map((v) => (
                    <tr key={v.sev} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{v.sev}</td>
                      <td className="text-right font-bold">{v.open}</td>
                      <td className="text-right">{v.mttr}d</td>
                      <td className="text-right text-vfes-dark/55">{v.sla}d</td>
                      <td className={`text-right font-bold ${v.pctInSla >= 95 ? 'text-emerald-600' : v.pctInSla >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{v.pctInSla}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Vulnerability burn-down — 6 months')} insight={{ insight: 'The backlog holds at 572 despite monthly closures exceeding openings since April, and remediation velocity remains insufficient for actively exploited KEVs.', action: 'Increase KEV patching cadence to weekly cycles and assign a dedicated team to cut the backlog by 40% before Q3.', impact: 'Reducing the KEV backlog eliminates the largest active exploitable surface and raises P1 SLA compliance from the current 92% to the 100% target.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={vulnTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="opened" name={tt('Opened')} fill={RED}  />
                  <Bar yAxisId="l" dataKey="closed" name={tt('Closed')}  fill={C3}   />
                  <Line yAxisId="r" dataKey="backlog" name={tt('Backlog')} stroke="#1f2937" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Asset coverage — where are the blind spots?')}>
          <div className="space-y-3">
            {assetCoverage.map((a) => (
              <div key={a.layer} className="flex items-center gap-3 text-sm">
                <div className="w-44 font-semibold text-xs">{a.layer}</div>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${a.covered >= 0.95 ? 'bg-emerald-500' : a.covered >= 0.8 ? 'bg-amber-500' : 'bg-vfes-red'} rounded-full`}
                    style={{ width: `${a.covered * 100}%` }} />
                </div>
                <div className="w-12 text-right font-bold text-xs">{(a.covered * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/55">{tt('OT/SCADA (62%) and containers (74%) are the most critical gaps — CWPP and OT security roadmap in H2 2025.')}</div>
        </Panel>
      </>)}

      {/* ════════════════════════ FRAUD / SIGNALING ═══════════════════════════ */}
      {tab === 'fraud' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Attempts (30d)')}   value={`${(fraudTotals.totalAttempts / 1000).toFixed(0)}K`} delta="all channels"      trend="flat" icon={Lock}         accent />
          <KpiCard label={tt('Block rate')}        value={`${fraudTotals.blockRate}%`}                         delta="real-time engine"  trend="up"   icon={ShieldCheck}  />
          <KpiCard label={tt('Net loss (month)')}  value={`BSD ${fraudTotals.totalLossK}K`}                       delta="-22% YoY"          trend="up"   icon={FileWarning}  />
          <KpiCard label={tt('Top type')}          value="SMS pumping"                                          delta="BSD 38K · messaging"  trend="down" icon={Radio}        />
        </div>

        <Panel title={tt('Fraud P&L by type — this month')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Fraud type')}</th>
                  <th>{tt('Channel')}</th>
                  <th className="text-right">{tt('Attempts')}</th>
                  <th className="text-right">{tt('Blocked')}</th>
                  <th className="text-right">{tt('Block %')}</th>
                  <th className="text-right">{tt('Loss BSD K')}</th>
                </tr>
              </thead>
              <tbody>
                {fraudSummary.sort((a, b) => b.lossK - a.lossK).map((f) => (
                  <tr key={f.type} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(f.type)}</td>
                    <td className="text-vfes-dark/60 text-xs">{f.channel}</td>
                    <td className="text-right">{f.attempts.toLocaleString()}</td>
                    <td className="text-right text-emerald-600 font-bold">{f.blocked.toLocaleString()}</td>
                    <td className="text-right">{((f.blocked / f.attempts) * 100).toFixed(0)}%</td>
                    <td className="text-right text-vfes-dark font-bold">BSD {f.lossK}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Fraud trend — attempts by type (30d rolling)')} insight={{ insight: 'SMS pumping shows the steepest upward trend over the past 3 months while IRSF and SIM-swap remain stable but carry the highest per-incident loss.', action: 'Deploy SMS pumping-specific detection controls on messaging APIs with automatic blocking on anomalous traffic patterns.', impact: 'Cutting SMS pumping by 50% would prevent approximately BSD 19K in monthly losses and reduce regulatory exposure from telecom fraud.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={fraudTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="smsPump"  name={tt('SMS pumping')} stroke={C1} fill={C1} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="irsf"     name={tt('IRSF voice')} stroke={C4} fill={C4} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="simSwap"  name={tt('SIM-swap')}   stroke={RED} fill={RED} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Signalling telemetry (30d)')} insight={{ insight: 'SS7 probes account for the highest telemetry volume with a block rate below 80%, and GTP and Diameter show signs of active enumeration.', action: 'Review and harden SS7 firewall rules to raise the block rate to 95% and enable cross-protocol correlation to detect combined attacks.', impact: 'Raising SS7 blocking to 95% closes the primary subscriber-location vector and reduces the risk of IRSF fraud and customer identity theft.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={signallingProbes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="protocol" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="probes"  name={tt('Probes')}  fill={C4} />
                  <Bar dataKey="blocked" name={tt('Blocked')} fill={C3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/fraud" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full Fraud & Signaling →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ IAM / RBAC ══════════════════════════════════ */}
      {tab === 'iam' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MFA — privileged')}    value="100%"                          delta={`${iamStats.privileged} admins`} trend="up"   icon={Key}          accent />
          <KpiCard label={tt('MFA — customer')}      value={`${iamStats.mfaCustomer}%`}    delta="campaign active"                 trend="up"   icon={Fingerprint}  />
          <KpiCard label={tt('PAM coverage')}        value={`${iamStats.pamCoverage}%`}    delta="97 accounts vaulted"            trend="up"   icon={Lock}         />
          <KpiCard label={tt('Stale accounts >90d')} value={`${iamStats.stale90d}`}        delta={`${iamStats.leaversPending} pending leavers`}   trend="down" icon={AlertTriangle}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Account inventory')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-1.5">{tt('Group')}</th>
                    <th className="text-right">{tt('Count')}</th>
                    <th>{tt('MFA')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {accountInventory.map((a) => (
                    <tr key={a.kind} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{tt(a.kind)}</td>
                      <td className="text-right">{a.n.toLocaleString()}</td>
                      <td className="font-bold text-xs">{a.mfa}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(a.risk)}`}>{tt(a.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('IAM hygiene trend — 6 months')} insight={{ insight: 'Stale accounts dropped from 47 to 22 over 6 months, but SoD violations remain above 30 and pending access reviews have recently increased.', action: 'Complete the overdue access review cycle to bring SoD violations below 10 and activate automatic revocation of inactive accounts after 60 days.', impact: 'Clearing active SoD violations and reducing the review backlog improves SOX and ISO 27001 compliance and reduces exposure to unauthorized access.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={rbacTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="stale"          name={tt('Stale accounts')}        stroke={RED}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="violations"     name={tt('SoD violations')}         stroke={C4}   strokeWidth={2} dot />
                  <Line type="monotone" dataKey="reviewsPending" name={tt('Pending reviews')}        stroke={C2}   strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/rbac" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('RBAC Explorer →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('MFA coverage by group — actual vs target')} insight={{ insight: 'Contractors reach 94% MFA coverage while B2C customers are at only 78%, and both groups remain below their respective targets of 100% and 85%.', action: 'Enforce mandatory MFA enrollment for B2C customers before August and apply access-block policy for contractors without MFA starting in July.', impact: 'Achieving the MFA target across both groups will eliminate the main credential-stuffing vector and reduce account-compromise risk by 60%.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={mfaCoverage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mfa"    name={tt('MFA actual %')}  fill={C1} />
                  <Bar dataKey="target" name={tt('Target %')}       fill={C6} />
                  <ReferenceLine y={100} stroke={C3} strokeDasharray="3 3" label={{ value: '100%', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Contractor (94%) and B2C customer (78%) MFA coverage are the priority gaps. Customer enrolment campaign started in Jun — target 85% in Q3.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ COMPLIANCE / TRUST ══════════════════════════ */}
      {tab === 'compliance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Frameworks monitored')} value={`${complianceItems.length}`} delta="active"              trend="flat" icon={Scale}        accent />
          <KpiCard label={tt('Fully compliant')}        value={`${complianceItems.filter(c => c.status === 'Compliant').length}`} delta="of 6" trend="up" icon={CheckCircle}  />
          <KpiCard label={tt('Data classified')}        value={`${dataSec.classified}%`}     delta="target 100%"         trend="up"   icon={Database}     />
          <KpiCard label={tt('NIST avg')}               value="4.0 / 5.0"                    delta="target 4.5"          trend="up"   icon={ShieldCheck}  />
        </div>

        <Panel title={tt('Compliance status by framework')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Framework')}</th>
                  <th>{tt('Status')}</th>
                  <th className="text-right">{tt('Score')}</th>
                  <th className="text-right">{tt('Gap %')}</th>
                  <th>{tt('Deadline')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {complianceItems.map((c) => (
                  <tr key={c.framework} className="border-t border-black/5">
                    <td className="py-2.5 font-bold">{c.framework}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${compStatusColor(c.status)}`}>{tt(c.status)}</span></td>
                    <td className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20 h-2 bg-zinc-100 rounded overflow-hidden">
                          <div className={`h-full ${c.score >= 90 ? 'bg-emerald-500' : c.score >= 75 ? 'bg-amber-500' : 'bg-vfes-red'} rounded`} style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="font-bold text-xs w-8">{c.score}%</span>
                      </div>
                    </td>
                    <td className={`text-right font-bold text-xs ${c.gap > 20 ? 'text-red-600' : c.gap > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.gap}%</td>
                    <td className="text-xs text-vfes-dark/65">{c.dueDate}</td>
                    <td className="text-xs">{c.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Data security posture')}>
            <div className="space-y-3">
              {[
                { label: tt('Data classified'),       val: dataSec.classified },
                { label: tt('Tokenisation coverage'),  val: dataSec.tokenisationCov },
                { label: tt('KMS rotation 30d'),        val: dataSec.kmsRotation },
                { label: tt('Encrypted at rest'),       val: dataSec.atRest },
                { label: tt('Encrypted in transit'),    val: dataSec.inTransit },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3 text-sm">
                  <div className="flex-1 font-semibold text-xs">{m.label}</div>
                  <div className="w-32 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full ${m.val >= 95 ? 'bg-emerald-500' : m.val >= 80 ? 'bg-amber-500' : 'bg-vfes-red'} rounded-full`} style={{ width: `${m.val}%` }} />
                  </div>
                  <div className="w-10 text-right font-bold text-xs">{m.val}%</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/horizon" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Horizon · Access history & lineage →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('NIST CSF maturity — radar')} insight={{ insight: 'Recover (3.6) and Respond (3.8) score below 4.0 while Protect and Identify already exceed the target, revealing a clear gap in reactive capabilities.', action: 'Run two annual tabletop exercises focused on recovery and update the incident response playbook with lessons from the most recent incidents.', impact: 'Raising Recover and Respond to 4.5 will push the overall NIST score above the board threshold and strengthen the audited posture against URCA cyber and ENS.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <RadarChart data={nistMaturity}>
                  <PolarGrid stroke="#eef0f3" />
                  <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="score" stroke={C1} fill={C1} fillOpacity={0.35} />
                  <Tooltip contentStyle={TS} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Recover (3.6) and Respond (3.8) have the largest gap. Improvement plan underway with tabletop exercises and response playbook enhancements.')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Data contracts and sensitive data governance')}>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              {[
                { label: tt('Classified PII stores'),    value: `${dataSec.classified}%`,     positive: dataSec.classified >= 90 },
                { label: tt('DLP events (30d)'),          value: `${dataSec.dlpEvents30d}`,    positive: false },
                { label: tt('Encrypted in transit'),      value: `${dataSec.inTransit}%`,      positive: true  },
                { label: tt('Active data contracts'),     value: '48',                         positive: true  },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-lg bg-zinc-50 border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{m.label}</div>
                  <div className={`text-2xl font-extrabold mt-1 ${m.positive ? 'text-emerald-600' : 'text-amber-600'}`}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/data-contracts" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Data Contracts — obligaciones PII →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ INCIDENTS ═══════════════════════════════════ */}
      {tab === 'incidents' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active incidents')}    value={`${incidentLog.filter(i => i.status !== 'Closed').length}`} delta="of 6 TTM"           trend="flat" icon={AlertOctagon} accent />
          <KpiCard label={tt('Avg MTTR')}              value="88m"                                                         delta="-22m YoY"          trend="up"   icon={Clock}        />
          <KpiCard label={tt('Critical in 30d')}      value="1"                                                           delta="resolved"          trend="up"   icon={Zap}          />
          <KpiCard label={tt('URCA cyber notifications')}   value="2"                                                           delta="within legal window" trend="up"   icon={Globe}        />
        </div>

        <Panel
          title={tt('Incident log')}
          action={
            <div className="flex gap-1">
              {INC_KEYS.map(k => (
                <button key={k} onClick={() => setIncFilter(k)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${incFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Title')}</th>
                  <th>{tt('Sev')}</th>
                  <th>{tt('Status')}</th>
                  <th>{tt('Opened')}</th>
                  <th className="text-right">{tt('MTTR (min)')}</th>
                  <th>{tt('MITRE')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncs.map((i) => (
                  <tr key={i.id} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-[10px] text-vfes-dark/65">{i.id}</td>
                    <td className="font-semibold text-xs">{tt(i.title)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(i.sev)}`}>{i.sev}</span></td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(i.status)}`}>{tt(i.status)}</span></td>
                    <td className="text-xs text-vfes-dark/60">{i.opened}</td>
                    <td className="text-right text-xs">{i.mttr != null ? `${i.mttr}m` : '—'}</td>
                    <td className="font-mono text-[10px] text-vfes-dark/55">{i.mitre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/incidents" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full incident log →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Incident trend — 6 months by severity')} insight={{ insight: 'Monthly incident total fell from 10 in January to 5 in June, with criticals and highs below 20% of the total due to improved SOC prioritization.', action: 'Drive mean MTTR below 60 minutes by activating automated playbooks for the 5 most frequent incident types identified in historical data.', impact: 'Sustaining the downward trend will reduce URCA cyber notifications and lower estimated operational impact by an additional 25% in the second half.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={incidentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="critical" name={tt('Critical')} stroke="#7f1d1d" fill="#7f1d1d" fillOpacity={0.35} stackId="1" />
                  <Area type="monotone" dataKey="high"     name={tt('High')}     stroke={RED}     fill={RED}     fillOpacity={0.25} stackId="1" />
                  <Area type="monotone" dataKey="medium"   name={tt('Medium')}   stroke={C4}      fill={C4}      fillOpacity={0.2}  stackId="1" />
                  <Area type="monotone" dataKey="low"      name={tt('Low')}      stroke={C3}      fill={C3}      fillOpacity={0.15} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Downward trend: monthly incident total falls from 10 (Jan) to 5 (Jun) — driven by improved SOC prioritisation model and reduced detection time.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ BOARD & CYBER RISK QUANTIFICATION ═══════════ */}
      {tab === 'boardrisk' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Total cyber ALE')}        value="BSD 12.2M"  delta={tt('−14% vs Jan estimate')}   trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('Residual risk')}           value="BSD 8.6M"   delta={tt('after controls')}          trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('Cyber insurance cover')}  value="BSD 43M"    delta={tt('4 layers')}                trend="flat" icon={Lock}          />
          <KpiCard label={tt('Top risk category')}      value="Ops"     delta={tt('ransomware ALE BSD 3.8M')}   trend="down" icon={Activity}      />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Risks quantified')}       value="8"       delta={tt('FAIR model')}              trend="flat" icon={Database}      />
          <KpiCard label={tt('Controls budget')}        value="BSD 8.4M/yr" delta={tt('vs BSD 12.2M ALE')}         trend="up"   icon={CheckCircle}   />
          <KpiCard label={tt('Board reporting cycle')}  value={tt('Quarterly')} delta={tt('next 22 Jul')} trend="flat" icon={Globe}         />
        </div>

        <Panel title={tt('FAIR model — annualised expected loss by scenario (BSD M)')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Scenario')}</th>
                  <th>{tt('Category')}</th>
                  <th className="text-right">{tt('LEF /yr')}</th>
                  <th className="text-right">{tt('Min loss BSD M')}</th>
                  <th className="text-right">{tt('Max loss BSD M')}</th>
                  <th className="text-right">{tt('ALE BSD M')}</th>
                </tr>
              </thead>
              <tbody>
                {[...fairRisks].sort((a, b) => b.annualExp - a.annualExp).map((r) => (
                  <tr key={r.risk} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(r.risk)}</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">{r.category}</span></td>
                    <td className="text-right text-xs font-mono">{r.lef.toFixed(2)}</td>
                    <td className="text-right text-xs">BSD {r.minLoss}M</td>
                    <td className="text-right text-xs">BSD {r.maxLoss}M</td>
                    <td className={`text-right font-bold text-xs ${r.annualExp >= 3 ? 'text-red-600' : r.annualExp >= 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>BSD {r.annualExp.toFixed(2)}M</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black/10 font-bold">
                  <td className="py-2.5 text-xs" colSpan={5}>{tt('Portfolio total ALE')}</td>
                  <td className="text-right text-red-600">BSD {fairRisks.reduce((s, r) => s + r.annualExp, 0).toFixed(2)}M</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/risk" className="font-semibold text-vfes-dark hover:underline">{tt('Full risk register →')}</Link>
            <span>·</span>
            <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory & ESG →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Cyber risk trend — gross vs residual ALE (BSD M/yr)')} insight={{ insight: 'Gross ALE has dropped BSD 2M since January driven by anti-ransomware controls, and residual ALE of BSD 8.6M is already below the annual security budget.', action: 'Maintain investment in anti-ransomware controls and redirect ALE savings to the next highest-exposure FAIR scenario — operations at BSD 3.8M ALE.', impact: 'Reducing residual ALE below BSD 7M will improve the cyber insurance coverage-to-risk ratio and could lower the annual premium at the Q4 renewal.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={boardMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v}M`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cyberRisk" name={tt('Gross ALE BSD M')}    stroke={RED}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="residual"  name={tt('Residual ALE BSD M')} stroke={C4}   strokeWidth={2}   dot />
                  <Line type="monotone" dataKey="budget"    name={tt('Budget BSD M')}       stroke={C3}   strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Gross ALE down BSD 2M since January driven by anti-ransomware controls investment. Residual ALE already below security budget — positive ROI.')}</div>
          </Panel>

          <Panel title={tt('Risk heatmap — likelihood vs impact (1-5)')} insight={{ insight: 'Ransomware and PII data loss have the highest probability-times-impact score in the heatmap; operations shows high likelihood but only moderate impact.', action: 'Focus next quarter control budget on the two highest-score scenarios to reduce their probability by at least one point.', impact: 'Lowering ransomware probability by one point will reduce gross ALE by more than BSD 1.5M per year under the current FAIR model.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={riskHeatmapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="likelihood" name={tt('Likelihood')} fill={C1} />
                  <Bar dataKey="impact"     name={tt('Impact')}      fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Cyber insurance tower — coverage layers')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Coverage layer')}</th>
                    <th className="text-right">{tt('Limit BSD M')}</th>
                    <th className="text-right">{tt('Premium BSD M/yr')}</th>
                    <th className="text-right">{tt('Deductible BSD M')}</th>
                    <th className="text-right">{tt('Used YTD')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cyberInsuranceCoverage.map((c) => (
                    <tr key={c.layer} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{tt(c.layer)}</td>
                      <td className="text-right font-bold">BSD {c.limit}M</td>
                      <td className="text-right">BSD {c.premium}M</td>
                      <td className="text-right text-vfes-dark/60">BSD {c.deductible}M</td>
                      <td className="text-right text-emerald-600 font-bold">{c.used === 0 ? tt('None') : `BSD ${c.used}M`}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black/10 font-bold">
                    <td className="py-2.5 text-xs">{tt('Total')}</td>
                    <td className="text-right">BSD {cyberInsuranceCoverage.reduce((s, c) => s + c.limit, 0)}M</td>
                    <td className="text-right">BSD {cyberInsuranceCoverage.reduce((s, c) => s + c.premium, 0).toFixed(2)}M</td>
                    <td /><td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/incidents" className="font-semibold text-vfes-dark hover:underline">{tt('Incidentes →')}</Link>
              <span>·</span>
              <Link to="/portal/trust-center" className="font-semibold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
              <span>·</span>
              <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
