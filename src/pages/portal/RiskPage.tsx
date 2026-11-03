// =============================================================================
// Risk & Security cockpit — CISO grade
// 10 tabs · Executive-style pill nav · SOC · IAM · Vulns · Fraud · Network/Cloud
// Apps & APIs · Resilience · Risk Register · Incident 360 drill-down
// =============================================================================
import { useState, useEffect, useMemo } from 'react'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import {
  ShieldCheck, AlertOctagon, Bug, Lock, Activity, Award, Users, Cpu, Cloud,
  AlertTriangle, CheckCircle, Clock, Target, Heart, Globe, Server, Zap, Eye,
  MessageSquare, ChevronRight, Database, Key, FileWarning, Radio, Smartphone,
  TrendingUp, TrendingDown, Layers, Network as NetIcon, Crosshair,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { MOBILE_RISKS } from './_mobile_data'
import { Link } from 'react-router-dom'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const TEAL = '#0d9488'
const GREY = '#94a3b8'

const sevColor: Record<string, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
  Info: 'bg-zinc-100 text-zinc-700',
  Pass: 'bg-emerald-50 text-emerald-700',
  Watch: 'bg-amber-50 text-amber-700',
  Open: 'bg-red-50 text-red-700',
  Closed: 'bg-emerald-50 text-emerald-700',
  Contained: 'bg-blue-50 text-blue-700',
  Eradicated: 'bg-emerald-50 text-emerald-700',
  Recovering: 'bg-amber-50 text-amber-700',
}

const tabs = [
  { id: 'overview',   label: 'Overview',         icon: Activity },
  { id: 'soc',        label: 'SOC & Threats',    icon: Eye },
  { id: 'iam',        label: 'Identity & Access', icon: Key },
  { id: 'vulns',      label: 'Vulnerabilities',  icon: Bug },
  { id: 'fraud',      label: 'Fraud',            icon: Lock },
  { id: 'netcloud',   label: 'Network & Cloud',  icon: NetIcon },
  { id: 'apps',       label: 'Apps & APIs',      icon: Smartphone },
  { id: 'resilience', label: 'Resilience',       icon: ShieldCheck },
  { id: 'register',   label: 'Risk Register',    icon: AlertOctagon },
  { id: 'inc360',     label: 'Incident 360',     icon: Crosshair },
] as const
type TabId = typeof tabs[number]['id']

// =============================================================================
// DATA
// =============================================================================
const socFunnel = [
  { stage: 'Events',     n: 18400000 },
  { stage: 'Correlated', n: 124000 },
  { stage: 'Alerts',     n: 4280 },
  { stage: 'Cases',      n: 184 },
  { stage: 'Incidents',  n: 12 },
]

const socMetrics = { mttd: 14, mtta: 8, mttr: 162, fpr: 0.18, t1Util: 0.78, t2Util: 0.66, t3Util: 0.42, ruleBacklog: 38 }

const events = [
  { t: '14:32', sev: 'High',     desc: 'DDoS mitigation activated — Nassau POP (220 Gbps L3+L4)', src: 'Arbor / CDN edge', mitre: 'T1498', status: 'Contained' },
  { t: '12:08', sev: 'Critical', desc: 'Suspected SIM-swap attempt blocked · 4 accounts',       src: 'Fraud engine',     mitre: 'T1556', status: 'Eradicated' },
  { t: '11:42', sev: 'High',     desc: 'BGP route-leak from peer · RPKI invalid filter held',   src: 'BGP monitor',      mitre: 'T1583.005', status: 'Closed' },
  { t: '10:18', sev: 'Medium',   desc: 'Anomalous SS7 location-tracking probes (3 sources)',     src: 'Signalling FW',   mitre: 'T1430', status: 'Investigating' },
  { t: '09:44', sev: 'Medium',   desc: 'Brute-force on customer portal · 1.2K attempts blocked', src: 'WAF',              mitre: 'T1110', status: 'Closed' },
  { t: '08:21', sev: 'Low',      desc: 'Anomalous admin login from new IP — verified',           src: 'IAM UEBA',         mitre: 'T1078', status: 'Closed' },
  { t: '06:55', sev: 'High',     desc: 'Phishing campaign targeting employees · 38 clicks',     src: 'Email gateway',    mitre: 'T1566', status: 'Contained' },
  { t: '05:14', sev: 'Critical', desc: 'IRSF voice-fraud spike — Sierra Leone block triggered',  src: 'Voice fraud',      mitre: 'T1657', status: 'Closed' },
]

// MITRE ATT&CK heat-map (telco-relevant subset)
const mitreCoverage = [
  { tactic: 'Reconnaissance',  rules: 18, gaps: 4,  hits7d: 142 },
  { tactic: 'Initial Access',  rules: 32, gaps: 6,  hits7d: 86 },
  { tactic: 'Execution',       rules: 22, gaps: 8,  hits7d: 18 },
  { tactic: 'Persistence',     rules: 28, gaps: 4,  hits7d: 12 },
  { tactic: 'Priv Escalation', rules: 24, gaps: 6,  hits7d: 8 },
  { tactic: 'Defence Evasion', rules: 38, gaps: 12, hits7d: 24 },
  { tactic: 'Credential Acc.', rules: 32, gaps: 4,  hits7d: 64 },
  { tactic: 'Discovery',       rules: 18, gaps: 8,  hits7d: 38 },
  { tactic: 'Lateral Move.',   rules: 22, gaps: 6,  hits7d: 14 },
  { tactic: 'Collection',      rules: 14, gaps: 8,  hits7d: 6 },
  { tactic: 'C2',              rules: 28, gaps: 4,  hits7d: 22 },
  { tactic: 'Exfiltration',    rules: 20, gaps: 6,  hits7d: 12 },
  { tactic: 'Impact',          rules: 24, gaps: 4,  hits7d: 8 },
]

// Threat campaigns (TI feed)
const campaigns = [
  { actor: 'Volt Typhoon (China)',      target: 'Telco / critical infra', activity: 'Active scanning · BGP probes',     iocsHit: 12, sev: 'High'    },
  { actor: 'Sandworm (Russia)',         target: 'Telco signalling',    activity: 'GTP probing observed (no entry)',  iocsHit:  4, sev: 'Medium'  },
  { actor: 'FIN-7',                     target: 'Carrier billing/POS',    activity: 'Spear-phish to 12 finance users',  iocsHit: 18, sev: 'High'    },
  { actor: 'Storm-1567 (cyber-crim)',   target: 'Caribbean SMB telecoms',        activity: 'IRSF / Wangiri ramp',              iocsHit: 28, sev: 'Medium'  },
  { actor: 'Andariel',                  target: 'Cloud APIs',             activity: 'Cred-stuffing on admin portals',   iocsHit:  8, sev: 'Medium'  },
]

// IAM
const iamStats = {
  users: 1840, contractors: 280, privileged: 64, serviceAccts: 412,
  mfaEmp: 1.0, mfaContractor: 0.94, mfaPrivileged: 1.0, mfaCustomer: 0.78,
  pamVaulted: 62, pamCoverage: 0.97, jitElev: 142,
  stale90d: 18, leaversPending: 4, sodViolations: 6,
  signinRiskHigh: 12, signinRiskMed: 84, signinBlocked: 142,
  serviceAcctsRotated30d: 0.86, secretsInCode: 4,
}

const accountInventory = [
  { kind: 'Employees',           n: 1840, mfa: '100%',   risk: 'Low' },
  { kind: 'Contractors',         n:  280, mfa: '94%',    risk: 'Medium' },
  { kind: 'Privileged admins',   n:   64, mfa: '100% + PAM', risk: 'Low' },
  { kind: 'Service accounts',    n:  412, mfa: 'N/A',    risk: 'Medium' },
  { kind: 'Customer (B2C)',      n: 1040000, mfa: '78%',  risk: 'Medium' },
  { kind: 'B2B portal users',    n: 12400, mfa: '92%',    risk: 'Low' },
]

// Vulnerabilities
const vulnsBySev = [
  { sev: 'Critical (KEV exploited)', open: 2,  mttrDays: 3,  sla: 3 },
  { sev: 'Critical',                  open: 6,  mttrDays: 4,  sla: 7 },
  { sev: 'High',                      open: 38, mttrDays: 14, sla: 30 },
  { sev: 'Medium',                    open: 142, mttrDays: 42, sla: 60 },
  { sev: 'Low',                       open: 384, mttrDays: 78, sla: 90 },
]

const vulnTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i],
  opened: 64 + Math.round(Math.sin(i / 1.4) * 22),
  closed: 58 + Math.round(Math.cos(i / 1.6) * 18),
  backlog: 480 + Math.round(Math.sin(i / 2.2) * 60) + i * 4,
}))

const patchSla = [
  { tier: 'P1 (KEV / Critical)', sla: 0.98, target: 1.00 },
  { tier: 'P2 (High)',           sla: 0.92, target: 0.95 },
  { tier: 'P3 (Medium)',         sla: 0.86, target: 0.90 },
  { tier: 'P4 (Low)',            sla: 0.72, target: 0.80 },
]

const assetCoverage = [
  { layer: 'Endpoints (EDR)',         covered: 0.98 },
  { layer: 'Servers (EDR)',           covered: 0.96 },
  { layer: 'Containers (CWPP)',       covered: 0.74 },
  { layer: 'Network OS',              covered: 0.84 },
  { layer: 'Cloud workloads (CSPM)',  covered: 0.92 },
  { layer: 'OT / SCADA / DC BMS',     covered: 0.62 },
  { layer: 'Mobile (MDM)',            covered: 0.94 },
]

// Fraud
const fraudPnl = [
  { type: 'Application / identity',  attempts: 2840, blocked: 2780, lossK: 48, recoveredK: 6,  channel: 'Web/App' },
  { type: 'SIM-swap',                attempts:  142, blocked:  136, lossK: 12, recoveredK: 0,  channel: 'Retail/Care' },
  { type: 'IRSF (Intl share fraud)', attempts:  840, blocked:  820, lossK: 28, recoveredK: 4,  channel: 'Voice' },
  { type: 'Wangiri',                 attempts: 4400, blocked: 4380, lossK:  4, recoveredK: 0,  channel: 'Voice' },
  { type: 'CLI spoofing / robocall', attempts: 18400,blocked: 18280,lossK:  8, recoveredK: 0,  channel: 'Voice' },
  { type: 'SMS pumping',             attempts: 12400,blocked: 12200,lossK: 38, recoveredK: 0,  channel: 'Messaging' },
  { type: 'Smishing',                attempts: 6400, blocked: 6280, lossK: 12, recoveredK: 0,  channel: 'Messaging' },
  { type: 'Friendly chargebacks',    attempts:  840, blocked:    0, lossK: 36, recoveredK: 14, channel: 'Web/App' },
  { type: 'Service abuse',           attempts:  560, blocked:  520, lossK: 18, recoveredK: 4,  channel: 'Web/App' },
  { type: 'Dealer-commission fraud', attempts:   38, blocked:   34, lossK: 22, recoveredK: 12, channel: 'Partner' },
  { type: 'Port-out fraud',          attempts:   86, blocked:   82, lossK:  6, recoveredK: 0,  channel: 'Mobile' },
  { type: 'Streaming credential share', attempts: 12400, blocked: 0, lossK: 84, recoveredK: 0, channel: 'TV' },
]

// Network & cloud
const ddos = {
  attacks30d: 142, biggestGbps: 380, blackholeMin: 12, cleanPipeMin: 286,
  l3pct: 0.62, l4pct: 0.22, l7pct: 0.16,
}
const bgpRpki = { rpkiCovered: 0.94, originLeaks30d: 4, pathLeaks30d: 1, blocked: 5, peers: 142, asPaths: 38400 }
const signalling = { ss7Probes: 124, diameterProbes: 86, gtpProbes: 38, smsOTPIntercepts: 0, locationProbes: 142 }
const cspmFindings = [
  { kind: 'Public S3 / blob',      n:  4, sev: 'High' },
  { kind: 'IAM over-privileged',    n: 14, sev: 'Medium' },
  { kind: 'Untagged resource',      n: 86, sev: 'Low' },
  { kind: 'Open security group',    n:  6, sev: 'High' },
  { kind: 'Unencrypted volume',     n:  2, sev: 'Medium' },
  { kind: 'Logging disabled',       n:  4, sev: 'Medium' },
]
const fwHygiene = { rules: 4280, anyAny: 6, orphan: 84, oldest: 2018, lastReview: '2026-09-12' }
const cnSeg = [
  { zone: 'Customer prod ↔ Corp',   policy: 'Deny',   hits7d: 142 },
  { zone: 'Corp ↔ Lab',             policy: 'Deny',   hits7d:  38 },
  { zone: 'OT ↔ Corp',              policy: 'Deny+',  hits7d:   6 },
  { zone: 'PCI ↔ Non-PCI',          policy: 'Deny',   hits7d:  18 },
  { zone: 'B2B vendor ↔ Crown jewels', policy: 'Deny+JIT', hits7d:   2 },
]

// Apps & APIs
const appInventory = { web: 142, mobile: 6, apis: 380, public: 84, internal: 296, mtls: 0.62 }
const owaspStatus = [
  { item: 'A01 Broken Access',       cov: 0.92 },
  { item: 'A02 Crypto failures',     cov: 0.96 },
  { item: 'A03 Injection',           cov: 0.94 },
  { item: 'A04 Insecure design',     cov: 0.78 },
  { item: 'A05 Misconfig',           cov: 0.86 },
  { item: 'A06 Vulnerable comp.',    cov: 0.84 },
  { item: 'A07 ID/Auth failures',    cov: 0.94 },
  { item: 'A08 Software/Data integ.',cov: 0.72 },
  { item: 'A09 Logging/Monitoring',  cov: 0.92 },
  { item: 'A10 SSRF',                cov: 0.88 },
]
const apiAlerts = { bola: 12, bfla: 4, rateLimits: 142, exposedSecrets: 2, invalidJwt: 38 }
const devSecOps = { sastCov: 0.96, dastCov: 0.74, scaCov: 0.98, secretScanCov: 0.94, prSecReview: 0.82, sbomCov: 0.62 }
const bugBounty = { reports30d: 84, paid: 28, criticalAccepted: 1, payoutK: 14 }

// Resilience / 3rd-party / data
const resilience = [
  { svc: 'Mobile core',          rtoH: 1,  rpoH: 0.25, lastFail: '2026-08-22', drillResult: 'Pass' },
  { svc: 'Customer portal',      rtoH: 4,  rpoH: 1,    lastFail: '2026-09-08', drillResult: 'Pass' },
  { svc: 'Billing (BSS)',        rtoH: 6,  rpoH: 1,    lastFail: '2026-07-18', drillResult: 'Watch' },
  { svc: 'OSS / NMS',            rtoH: 4,  rpoH: 0.5,  lastFail: '2026-08-04', drillResult: 'Pass' },
  { svc: 'Hurricane DR · Nassau→Freeport headend failover', rtoH: 8, rpoH: 1, lastFail: '2026-10-28', drillResult: 'Pass' },
  { svc: 'TV head-end',          rtoH: 2,  rpoH: 0.5,  lastFail: '2026-10-12', drillResult: 'Pass' },
  { svc: 'Lawful intercept',     rtoH: 0.25,rpoH: 0,    lastFail: '2026-07-22', drillResult: 'Pass' },
  { svc: '911/919 routing',      rtoH: 0.1, rpoH: 0,    lastFail: '2026-09-30', drillResult: 'Pass' },
]
const thirdParty = [
  { vendor: 'AWS',           access: 'Crown jewels', rating: 'A', lastAttest: '2026-08-08', findings: 0 },
  { vendor: 'Cisco',         access: 'Network OS',   rating: 'A', lastAttest: '2026-07-22', findings: 2 },
  { vendor: 'Salesforce',    access: 'CRM data',     rating: 'A', lastAttest: '2026-09-04', findings: 0 },
  { vendor: 'Nokia/Ericsson', access: 'Platform/content', rating: 'A', lastAttest: '2026-06-18', findings: 1 },
  { vendor: 'Island Field Services (demo)',      access: 'Field WO',     rating: 'C', lastAttest: '2026-09-22', findings: 4 },
  { vendor: 'Tail (412)',    access: 'Mixed',        rating: 'C', lastAttest: 'Pending',     findings: 38 },
]
const dataSec = {
  classified: 0.86, restrictedStores: 24, dlpEvents: 142, falsePos: 0.62, exfilBlocked: 4,
  tokenisationCov: 0.74, kmsRotation30d: 0.96, atRest: 0.99, inTransit: 0.98,
}

// Risk register
const riskRegister = [
  { id: 'ER-01', name: 'Ransomware on BSS billing',           cat: 'Cyber', inh: 9, res: 6, owner: 'CISO',    appetite: 4, kci: 'Backup tested', trend: 'flat' },
  { id: 'ER-02', name: 'Major fibre cut (Nassau metro)',      cat: 'Ops',   inh: 8, res: 5, owner: 'CTO',     appetite: 4, kci: 'Diverse routes', trend: 'down' },
  { id: 'ER-03', name: 'URCA M4 margin-squeeze finding',    cat: 'Reg',   inh: 7, res: 4, owner: 'Reg Affairs', appetite: 5, kci: 'Internal model', trend: 'flat' },
  { id: 'ER-04', name: 'Cloud single-region (us-east-1)',     cat: 'Tech',  inh: 7, res: 5, owner: 'CIO',     appetite: 4, kci: 'Multi-AZ live', trend: 'down' },
  { id: 'ER-05', name: 'Vendor concentration · Cisco/Nokia', cat: '3rd-party', inh: 7, res: 6, owner: 'CPO', appetite: 5, kci: 'Dual-source plan', trend: 'flat' },
  { id: 'ER-06', name: 'Insider data exfil',                  cat: 'Cyber', inh: 8, res: 4, owner: 'CISO',    appetite: 3, kci: 'UEBA + DLP', trend: 'down' },
  { id: 'ER-07', name: 'IRSF / SMS-pumping fraud surge',      cat: 'Fraud', inh: 6, res: 4, owner: 'CISO',    appetite: 4, kci: 'Real-time block', trend: 'flat' },
  { id: 'ER-08', name: 'Talent retention (engineering)',      cat: 'People',inh: 6, res: 5, owner: 'CHRO',    appetite: 5, kci: 'Attrition < 12%', trend: 'up' },
  { id: 'ER-09', name: 'Hurricane / storm surge (headends, aerial plant)', cat: 'Climate', inh: 9, res: 6, owner: 'COO', appetite: 4, kci: 'Undergrounding + generators', trend: 'down' },
  { id: 'ER-10', name: 'AI policy non-conformity (Agent Assist)', cat: 'Reg',  inh: 6, res: 4, owner: 'CISO',    appetite: 4, kci: 'HITL gates',   trend: 'down' },
  { id: 'ER-11', name: 'BGP / RPKI failure → traffic loss',   cat: 'Cyber', inh: 7, res: 4, owner: 'CISO',    appetite: 3, kci: 'RPKI 94%',    trend: 'down' },
  { id: 'ER-12', name: 'DPA class-action exposure',          cat: 'Reg',   inh: 7, res: 5, owner: 'DPO',     appetite: 4, kci: 'Breaches < 5', trend: 'flat' },
]

// Maturity (NIST CSF + CIS 18)
const maturity = [
  { domain: 'Identify',  score: 4.2 }, { domain: 'Protect',   score: 4.0 },
  { domain: 'Detect',    score: 4.4 }, { domain: 'Respond',   score: 3.8 },
  { domain: 'Recover',   score: 3.6 }, { domain: 'Govern',    score: 4.2 },
]
const cisCoverage = [
  { ctrl: 'CIS 1 Inventory',         score: 0.92 },
  { ctrl: 'CIS 2 Software',          score: 0.86 },
  { ctrl: 'CIS 3 Data',              score: 0.82 },
  { ctrl: 'CIS 4 Secure Config',     score: 0.88 },
  { ctrl: 'CIS 5 Account Mgmt',      score: 0.94 },
  { ctrl: 'CIS 6 Access Mgmt',       score: 0.90 },
  { ctrl: 'CIS 7 Vuln Mgmt',         score: 0.84 },
  { ctrl: 'CIS 8 Audit Log',         score: 0.92 },
  { ctrl: 'CIS 13 Network Mon.',     score: 0.88 },
  { ctrl: 'CIS 17 Incident Resp.',   score: 0.86 },
  { ctrl: 'CIS 18 Pen Test',         score: 0.78 },
]

// Incidents (drill-down catalog)
type Incident = {
  id: string; title: string; sev: 'Critical' | 'High' | 'Medium' | 'Low'; status: 'Open' | 'Contained' | 'Eradicated' | 'Recovering' | 'Closed'; opened: string;
  detection: string; mitre: string[]; assets: string[]; ioCs: string[]; comms: string;
  rca: string; lessons: string;
  timeline: { t: string; event: string }[];
  killChain: { phase: string; status: 'Hit' | 'Miss' }[]
}
const incidents: Incident[] = [
  {
    id: 'INC-2026-0033', title: '3rd-party SQLi → BSS billing', sev: 'Critical', status: 'Closed', opened: '2026-10-04 02:18',
    detection: 'WAF anomaly + DB query pattern', mitre: ['T1190', 'T1059', 'T1505'], assets: ['BSS-billing-prod', 'API-gateway-eu1'],
    ioCs: ['185.220.x.x', 'sql-payload-hash-abc', 'web-shell-attempt'], comms: 'CEO / Board / ODPC briefed within 4h',
    rca: 'Vendor portal lacked parameterised query', lessons: 'Mandate SAST gate for all 3rd-party portals',
    timeline: [
      { t: '02:18', event: 'WAF anomaly score spike' },
      { t: '02:22', event: 'Auto-block triggered · src IP blackholed' },
      { t: '02:34', event: 'L1 escalated to L3 · BSS team paged' },
      { t: '02:48', event: 'Vendor portal taken offline' },
      { t: '04:12', event: 'No exfiltration confirmed (DLP egress logs)' },
      { t: '07:00', event: 'ODPC notified within 72h window' },
      { t: '14:30', event: 'Patch deployed · service restored' },
      { t: '+ 7d',  event: 'Lessons-learned posted · vendor PCAP shared' },
    ],
    killChain: [
      { phase: 'Recon',         status: 'Hit'  },
      { phase: 'Weaponisation', status: 'Miss' },
      { phase: 'Delivery',      status: 'Hit'  },
      { phase: 'Exploitation',  status: 'Hit'  },
      { phase: 'Installation',  status: 'Miss' },
      { phase: 'C2',            status: 'Miss' },
      { phase: 'Actions',       status: 'Miss' },
    ],
  },
  {
    id: 'INC-2026-0029', title: 'IPTV CDN poisoning attempt', sev: 'High', status: 'Recovering', opened: '2026-10-18 09:42',
    detection: 'CDN edge integrity hash mismatch', mitre: ['T1070', 'T1565'], assets: ['cdn-edge-freeport', 'iptv-origin-1'],
    ioCs: ['proxy-spoof-pattern', 'tampered-manifest'], comms: 'Internal only — no customer impact',
    rca: 'Investigation ongoing — tracking caching origin', lessons: 'Pending',
    timeline: [
      { t: '09:42', event: 'Hash mismatch alert' },
      { t: '09:48', event: 'Origin failover triggered' },
      { t: '10:12', event: 'Edge cache invalidated' },
      { t: '11:00', event: 'TI feed correlation in progress' },
    ],
    killChain: [
      { phase: 'Recon',         status: 'Hit'  },
      { phase: 'Weaponisation', status: 'Hit'  },
      { phase: 'Delivery',      status: 'Hit'  },
      { phase: 'Exploitation',  status: 'Miss' },
      { phase: 'Installation',  status: 'Miss' },
      { phase: 'C2',            status: 'Miss' },
      { phase: 'Actions',       status: 'Miss' },
    ],
  },
  {
    id: 'INC-2026-0021', title: 'Auth outage (OSS portal)', sev: 'Low', status: 'Closed', opened: '2026-09-22 14:08',
    detection: 'Synthetic monitor', mitre: ['T1496'], assets: ['oss-portal-prod', 'idp-eu1'],
    ioCs: [], comms: 'Internal only', rca: 'IdP cert rotation script bug', lessons: 'Add staging soak for cert rotations',
    timeline: [
      { t: '14:08', event: 'Synthetic 401 alert' },
      { t: '14:14', event: 'IdP rolled back' },
      { t: '14:22', event: 'Service restored' },
      { t: '+ 1d',  event: 'Postmortem complete' },
    ],
    killChain: [],
  },
  {
    id: 'INC-2026-0014', title: 'Mobile-core signalling storm', sev: 'Medium', status: 'Closed', opened: '2026-09-12 22:14',
    detection: 'Diameter rate-limit', mitre: ['T1499', 'T1430'], assets: ['mme-bs-prod-2', 'diameter-fw'],
    ioCs: ['anom-imsi-pattern', 'flood-source-set'], comms: 'URCA & customers (38min impact)',
    rca: 'Misconfigured roaming partner triggered loop', lessons: 'Add Diameter rate-cap per peer',
    timeline: [
      { t: '22:14', event: 'Diameter rate alarm' },
      { t: '22:18', event: 'Partner peer paused' },
      { t: '22:42', event: 'Service stabilised' },
      { t: '22:52', event: 'Partner re-enabled with cap' },
      { t: '+ 4h',  event: 'URCA 24h incident notification filed' },
    ],
    killChain: [
      { phase: 'Recon',         status: 'Miss' },
      { phase: 'Weaponisation', status: 'Miss' },
      { phase: 'Delivery',      status: 'Hit'  },
      { phase: 'Exploitation',  status: 'Hit'  },
      { phase: 'Installation',  status: 'Miss' },
      { phase: 'C2',            status: 'Miss' },
      { phase: 'Actions',       status: 'Hit'  },
    ],
  },
]

// =============================================================================
export default function RiskPage() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    try { const raw = localStorage.getItem('risk-tab') as TabId; if (raw) return raw } catch { /* ignore */ }
    return 'overview'
  })
  useEffect(() => { try { localStorage.setItem('risk-tab', tab) } catch { /* ignore */ } }, [tab])
  const [selectedInc, setSelectedInc] = useState<string>(() => {
    if (typeof window === 'undefined') return incidents[0].id
    try { const raw = localStorage.getItem('risk-inc'); if (raw) return raw } catch { /* ignore */ }
    return incidents[0].id
  })
  useEffect(() => { try { localStorage.setItem('risk-inc', selectedInc) } catch { /* ignore */ } }, [selectedInc])
  const drillInto = (id: string) => { setSelectedInc(id); setTab('inc360') }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Risk & Security')}
        subtitle={tt('SOC · IAM · Vulns · Fraud · Network · Apps · Resilience · ERM · CISO cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('CISO Cockpit')}</div>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
        <span className="text-vfes-dark/55 uppercase tracking-widest text-[10px] mr-1">{tt('Related cockpits')}:</span>
        <Link to="/portal/trust-center" className="px-3 py-1.5 rounded-full bg-[#FF4438]/10 text-[#222128] hover:bg-[#FF4438]/20">{tt('Trust Center')}</Link>
        <Link to="/portal/fraud" className="px-3 py-1.5 rounded-full bg-[#11567F]/10 text-[#11567F] hover:bg-[#11567F]/20">{tt('Fraud')}</Link>
        <Link to="/portal/incidents" className="px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20">{tt('Incidents')}</Link>
        <Link to="/portal/observability" className="px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20">{tt('Observability')}</Link>
        <Link to="/portal/rbac" className="px-3 py-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20">{tt('RBAC')}</Link>
        <Link to="/portal/horizon" className="px-3 py-1.5 rounded-full bg-[#94a3b8]/10 text-[#94a3b8] hover:bg-[#94a3b8]/20">{tt('Horizon')}</Link>
        <Link to="/portal/regulatory" className="px-3 py-1.5 rounded-full bg-[#FF4438]/10 text-[#222128] hover:bg-[#FF4438]/20">{tt('Regulatory')}</Link>
        <Link to="/portal/urca-pack" className="px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20">{tt('URCA Pack')}</Link>
        <Link to="/portal/ciso" className="px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20">{tt('CISO')}</Link>
        <Link to="/portal/war-room" className="px-3 py-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20">{tt('War Room')}</Link>
        <Link to="/portal/data-contracts" className="px-3 py-1.5 rounded-full bg-[#94a3b8]/10 text-[#94a3b8] hover:bg-[#94a3b8]/20">{tt('Data Contracts')}</Link>
        <Link to="/portal/ai-insights" className="px-3 py-1.5 rounded-full bg-[#11567F]/10 text-[#11567F] hover:bg-[#11567F]/20">{tt('AI Insights')}</Link>
      </div>

      <MlInsightSection
        heading="Risk intelligence"
        models={[
          { name: 'Enterprise Risk Scorer', metric: 'calibrated', sub: 'residual-risk ranking' },
          { name: 'Emerging-risk Anomaly', metric: 'recall 0.85', sub: 'signal detection (news + telemetry)' },
          { name: 'Control-gap Predictor', metric: 'AUC 0.83', sub: 'control-failure likelihood' },
        ]}
        agentLabel="Run Risk Radar" agentRunningLabel="Scoring…"
        agentSteps={[
          'Scored the risk register on likelihood × impact',
          'Detected emerging-risk signals (anomaly)',
          'Mapped control gaps to top residual risks',
          'Drafted mitigations & owners for review',
        ]}
        agentBlurb="Scoring plus anomaly detection moves risk from a static register to a live, ranked radar."
        decision={{
          title: 'Prioritise the top-3 residual risks with the weakest controls',
          detail: 'The scorer and control-gap model agree on three risks where high residual exposure meets a failing control — the worst combination. Fund those mitigations first.',
          impact: 'reduces residual exposure where it matters most',
          risk: 'model surfaces, humans own the risk decision',
          linkTo: '#/portal/trust-center', linkLabel: 'Open Trust Center',
        }}
        chart={{
          kind: 'bar', title: 'Residual risk score by category (higher = worse)', xKey: 'cat',
          data: [
            { cat: 'Cyber / data', risk: 78 }, { cat: 'Regulatory', risk: 54 },
            { cat: 'Supply / vendor', risk: 61 }, { cat: 'Financial', risk: 38 }, { cat: 'Operational', risk: 47 },
          ],
          series: [{ key: 'risk', name: 'Residual risk', color: '#FF4438' }],
          colorBy: { key: 'risk', high: 65, mid: 45 },
          note: 'Cyber/data and supply/vendor carry the highest residual risk — the funding priority for controls.',
        }}
      />

      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {tab === 'overview'   && <OverviewTab drillInto={drillInto} />}
      {tab === 'soc'        && <SocTab drillInto={drillInto} />}
      {tab === 'iam'        && <IamTab />}
      {tab === 'vulns'      && <VulnsTab />}
      {tab === 'fraud'      && <FraudTab />}
      {tab === 'netcloud'   && <NetCloudTab />}
      {tab === 'apps'       && <AppsTab />}
      {tab === 'resilience' && <ResilienceTab />}
      {tab === 'register'   && <RegisterTab />}
      {tab === 'inc360'     && <Inc360Tab id={selectedInc} setId={setSelectedInc} />}

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML SOC alert-prioritisation · UEBA insider-risk · semantic view RISK_360 · model risk-cockpit v1.0 · refreshed daily 04:30 UTC
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- OVERVIEW
function OverviewTab({ drillInto }: { drillInto: (id: string) => void }) {
  const openInc = incidents.filter((i) => i.status !== 'Closed').length
  const kevOpen = vulnsBySev[0].open
  const fraudLoss = fraudPnl.reduce((s, x) => s + x.lossK, 0)
  const top10risk = riskRegister.filter((r) => r.res >= 5).length

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Open incidents')} value={`${openInc}`} delta={`${incidents.length} TTM`} trend="flat" icon={AlertOctagon} accent />
        <KpiCard label={tt('MTTD / MTTR')} value={`${socMetrics.mttd}m / ${socMetrics.mttr}m`} delta="MTTA 8m" trend="up" icon={Clock} />
        <KpiCard label={tt('KEV CVEs open')} value={`${kevOpen}`} delta="all in SLA" trend="up" icon={Bug} />
        <KpiCard label={tt('Fraud loss YTD')} value={`BSD ${fraudLoss}K`} delta="-22% YoY" trend="up" icon={Lock} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('MFA privileged')} value="100%" delta="64 admins · PAM-vaulted 97%" trend="up" icon={Key} />
        <KpiCard label={tt('EDR coverage')} value="98%" delta="endpoints + servers" trend="up" icon={ShieldCheck} />
        <KpiCard label={tt('DDoS attacks (30d)')} value={`${ddos.attacks30d}`} delta={`peak ${ddos.biggestGbps} Gbps`} trend="flat" icon={Zap} />
        <KpiCard label={tt('Top-10 risks > appetite')} value={`${top10risk}`} delta="board view" trend="flat" icon={AlertTriangle} />
      </div>

      {/* Mobile / RAN-specific risks */}
      <Panel title={tt('Mobile / RAN risks — fraud · cyber · supplier · regulatory')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('8 mobile-specific risks tracked')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Risk')}</th><th>{tt('Category')}</th><th>{tt('Likelihood')}</th><th>{tt('Impact')}</th><th>{tt('Residual')}</th><th>{tt('Owner')}</th><th>{tt('Trend')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_RISKS.map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs text-vfes-dark/65">{r.id}</td>
                <td className="text-xs font-semibold">{tt(r.risk)}<div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(r.mitigation)}</div></td>
                <td className="text-xs text-vfes-dark/65">{tt(r.category)}</td>
                <td className={`text-xs font-bold ${r.likelihood === 'High' ? 'text-red-600' : r.likelihood === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{tt(r.likelihood)}</td>
                <td className={`text-xs font-bold ${r.impact === 'Critical' || r.impact === 'High' ? 'text-red-600' : r.impact === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{tt(r.impact)}</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.residual === 'Low' ? 'bg-emerald-50 text-emerald-700' : r.residual === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{tt(r.residual)}</span>
                </td>
                <td className="text-xs">{tt(r.owner)}</td>
                <td className={`text-xs font-bold ${r.trend === 'down' ? 'text-emerald-600' : r.trend === 'up' ? 'text-red-600' : 'text-vfes-dark/65'}`}>{r.trend === 'down' ? '↓' : r.trend === 'up' ? '↑' : '→'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('SIM-swap fraud trending down (eKYC + 24h delay). RAN vendor concentration declining as Open RAN diversifies. Power-grid + mmWave permits remain Medium residual.')}</div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('SOC funnel · 24h')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={socFunnel}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis scale="log" domain={[1, 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => Number(v).toLocaleString()} />
                <Bar dataKey="n" fill={RED} radius={[4, 4, 0, 0]}>
                  {socFunnel.map((_, i) => <Cell key={i} fill={[GREY, BLUE, AMBER, RED2, RED][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-vfes-dark/55 text-center mt-1">log scale · {socFunnel[0].n.toLocaleString()} events → {socFunnel[4].n} incidents</div>
          </Panel>
        </div>
        <Panel title={tt('NIST CSF maturity (1-5)')}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={maturity}>
              <PolarGrid stroke="#eef0f3" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
              <Radar dataKey="score" stroke={RED} fill={RED} fillOpacity={0.4} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Recent SOC events')} >
        <div className="space-y-2">
          {events.slice(0, 6).map((e) => (
            <div key={e.t + e.desc} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <span className="text-xs text-vfes-dark/55 font-mono w-12 shrink-0 mt-0.5">{tt(e.t)}</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${sevColor[e.sev]}`}>{e.sev}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{tt(e.desc)}</div>
                <div className="text-xs text-vfes-dark/55">{e.src} · {e.mitre}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${sevColor[e.status]}`}>{tt(e.status)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6">
        <SiPrompts prompts={[
          'Show all open incidents and their kill-chain coverage.',
          'Forecast vulnerability backlog at current patch rate.',
          'Top 5 fraud rings by device fingerprint and TTPs.',
          'Which Crown-jewel datastores had abnormal access in last 24h?',
        ]} />
      </div>

      <Panel title={tt('Open incidents — click to drill in')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Title')}</th><th>{tt('Sev')}</th><th>{tt('Status')}</th><th>{tt('Opened')}</th></tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.id} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(i.id)}>
                <td className="py-2 font-mono text-xs">{i.id}</td>
                <td className="font-semibold">{tt(i.title)} <ChevronRight className="inline w-3 h-3 text-vfes-dark/30" /></td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[i.sev]}`}>{i.sev}</span></td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[i.status]}`}>{tt(i.status)}</span></td>
                <td className="text-xs text-vfes-dark/60">{i.opened}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- SOC
function SocTab({ drillInto }: { drillInto: (id: string) => void }) {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('MTTD')} value={`${socMetrics.mttd}m`} delta="-3m YoY" trend="up" icon={Eye} accent />
        <KpiCard label={tt('MTTA')} value={`${socMetrics.mtta}m`} delta="-2m YoY" trend="up" icon={Clock} />
        <KpiCard label={tt('MTTR')} value={`${socMetrics.mttr}m`} delta="-22m YoY" trend="up" icon={Target} />
        <KpiCard label={tt('False-positive rate')} value={`${(socMetrics.fpr * 100).toFixed(0)}%`} delta="rules backlog 38" trend="up" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Live event stream')}>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.t + e.desc} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                <span className="text-xs text-vfes-dark/55 font-mono w-12 shrink-0 mt-0.5">{tt(e.t)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${sevColor[e.sev]}`}>{e.sev}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs">{tt(e.desc)}</div>
                  <div className="text-[10px] text-vfes-dark/55">{e.src} · MITRE {e.mitre}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={tt('Active threat campaigns (TI)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Actor')}</th><th>{tt('Activity')}</th><th>{tt('IoC hits')}</th><th>{tt('Sev')}</th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.actor} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{c.actor}</td>
                  <td className="text-vfes-dark/60 text-xs">{c.activity}</td>
                  <td>{c.iocsHit}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[c.sev]}`}>{c.sev}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('MITRE ATT&CK coverage (rules · gaps · 7d hits)')}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={mitreCoverage}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="tactic" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={60} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="rules" fill={GREEN} name={tt('Rules deployed')} />
            <Bar yAxisId="l" dataKey="gaps" fill={RED} name={tt('Coverage gaps')} />
            <Line yAxisId="r" dataKey="hits7d" stroke="#1f2937" strokeWidth={2} name={tt('7d hits')} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <div className="mt-6">
        <SiPrompts prompts={[
          'List MITRE tactics with > 6 coverage gaps.',
          'Show alerts associated with Volt Typhoon IoCs in last 7 days.',
          'Forecast SOC analyst capacity vs alert volume next quarter.',
        ]} />
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- IAM
function IamTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('MFA — privileged')} value="100%" delta={`${iamStats.privileged} admins`} trend="up" icon={Key} accent />
        <KpiCard label={tt('MFA — customer')} value={`${(iamStats.mfaCustomer * 100).toFixed(0)}%`} delta="campaign in flight" trend="up" icon={Users} />
        <KpiCard label={tt('PAM coverage')} value={`${(iamStats.pamCoverage * 100).toFixed(0)}%`} delta={`${iamStats.pamVaulted} vaulted`} trend="up" icon={Lock} />
        <KpiCard label={tt('Stale > 90d')} value={`${iamStats.stale90d}`} delta={`${iamStats.leaversPending} leavers pending`} trend="down" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Account inventory')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Class')}</th><th>{tt('Count')}</th><th>{tt('MFA')}</th><th>{tt('Risk')}</th></tr>
            </thead>
            <tbody>
              {accountInventory.map((a) => (
                <tr key={a.kind} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{a.kind}</td>
                  <td>{a.n.toLocaleString()}</td>
                  <td className="font-bold">{a.mfa}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[a.risk]}`}>{a.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Sign-in risk · last 30d')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { kind: 'High risk',     n: iamStats.signinRiskHigh },
              { kind: 'Medium risk',   n: iamStats.signinRiskMed },
              { kind: 'Blocked',       n: iamStats.signinBlocked },
            ]}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="kind" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {[RED, AMBER, GREEN].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('IAM hygiene KPIs')}>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <Mini label={tt('Service-account rotation 30d')} value={`${(iamStats.serviceAcctsRotated30d * 100).toFixed(0)}%`} positive />
          <Mini label={tt('Secrets in code (open)')} value={`${iamStats.secretsInCode}`} negative={iamStats.secretsInCode > 0} />
          <Mini label={tt('JIT elevations 30d')} value={`${iamStats.jitElev}`} />
          <Mini label={tt('SoD violations')} value={`${iamStats.sodViolations}`} negative={iamStats.sodViolations > 0} />
          <Mini label={tt('Stale > 90d')} value={`${iamStats.stale90d}`} negative={iamStats.stale90d > 0} />
          <Mini label={tt('Leavers pending de-prov')} value={`${iamStats.leaversPending}`} negative={iamStats.leaversPending > 0} />
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- VULNS
function VulnsTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('KEV exploited open')} value={`${vulnsBySev[0].open}`} delta={`MTTR ${vulnsBySev[0].mttrDays}d`} trend="up" icon={AlertOctagon} accent />
        <KpiCard label={tt('Critical+High open')} value={`${vulnsBySev[0].open + vulnsBySev[1].open + vulnsBySev[2].open}`} delta="-12% MoM" trend="up" icon={Bug} />
        <KpiCard label={tt('Patch SLA P1')} value={`${(patchSla[0].sla * 100).toFixed(0)}%`} delta={`target ${(patchSla[0].target * 100).toFixed(0)}%`} trend="up" icon={Target} />
        <KpiCard label={tt('EDR coverage')} value="98%" delta="endpoints + servers" trend="up" icon={ShieldCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Vuln backlog by severity')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vulnsBySev}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="sev" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="open" radius={[4, 4, 0, 0]}>
                {vulnsBySev.map((_, i) => <Cell key={i} fill={['#7f1d1d', RED, AMBER, BLUE, GREY][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Vuln burn-down (12mo)')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={vulnTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="opened" fill={RED} name={tt('Opened')} />
              <Bar yAxisId="l" dataKey="closed" fill={GREEN} name={tt('Closed')} />
              <Line yAxisId="r" dataKey="backlog" stroke="#1f2937" strokeWidth={2} name={tt('Backlog')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Patch SLA by tier')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Tier')}</th><th>{tt('SLA achieved')}</th><th>{tt('Target')}</th></tr>
            </thead>
            <tbody>
              {patchSla.map((p) => (
                <tr key={p.tier} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{p.tier}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded"><div className={`h-full rounded ${p.sla >= p.target ? 'bg-emerald-500' : p.sla >= p.target * 0.9 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${p.sla * 100}%` }} /></div>
                      <span className="text-xs font-bold w-12 text-right">{(p.sla * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-vfes-dark/55 text-xs">{(p.target * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Asset coverage (where are we blind?)')}>
          {assetCoverage.map((a) => (
            <div key={a.layer} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{a.layer}</span>
                <span className="font-bold">{(a.covered * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${a.covered >= 0.95 ? 'bg-emerald-500' : a.covered >= 0.8 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${a.covered * 100}%` }} /></div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- FRAUD
function FraudTab() {
  const totalAttempts = fraudPnl.reduce((s, x) => s + x.attempts, 0)
  const totalBlocked = fraudPnl.reduce((s, x) => s + x.blocked, 0)
  const totalLoss = fraudPnl.reduce((s, x) => s + x.lossK, 0)
  const totalRec = fraudPnl.reduce((s, x) => s + x.recoveredK, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Attempts (TTM)')} value={`${(totalAttempts / 1000).toFixed(0)}K`} delta="all channels" trend="flat" icon={Lock} accent />
        <KpiCard label={tt('Block rate')} value={`${((totalBlocked / totalAttempts) * 100).toFixed(1)}%`} delta="real-time engine" trend="up" icon={ShieldCheck} />
        <KpiCard label={tt('Net loss YTD')} value={`BSD ${totalLoss}K`} delta={`recovered BSD ${totalRec}K`} trend="up" icon={FileWarning} />
        <KpiCard label={tt('Top type')} value="Streaming share" delta="BSD 84K · TV" trend="down" icon={AlertTriangle} />
      </div>

      <Panel title={tt('Fraud P&L by type')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Type')}</th><th>{tt('Channel')}</th><th>{tt('Attempts')}</th><th>{tt('Blocked')}</th><th>{tt('Block %')}</th><th>{tt('Loss BSD K')}</th><th>{tt('Recovered BSD K')}</th></tr>
          </thead>
          <tbody>
            {fraudPnl.sort((a, b) => b.lossK - a.lossK).map((f) => (
              <tr key={f.type} className="border-t border-black/5">
                <td className="py-2 font-semibold">{f.type}</td>
                <td className="text-vfes-dark/60 text-xs">{f.channel}</td>
                <td>{f.attempts.toLocaleString()}</td>
                <td className="text-emerald-600 font-bold">{f.blocked.toLocaleString()}</td>
                <td>{f.attempts === 0 ? '—' : `${((f.blocked / f.attempts) * 100).toFixed(0)}%`}</td>
                <td className="text-vfes-dark font-bold">BSD {f.lossK}K</td>
                <td className="text-emerald-600">BSD {f.recoveredK}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- NETWORK & CLOUD
function NetCloudTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('DDoS attacks (30d)')} value={`${ddos.attacks30d}`} delta={`peak ${ddos.biggestGbps}G`} trend="flat" icon={Zap} accent />
        <KpiCard label={tt('RPKI coverage')} value={`${(bgpRpki.rpkiCovered * 100).toFixed(0)}%`} delta={`${bgpRpki.blocked} leaks blocked`} trend="up" icon={Globe} />
        <KpiCard label={tt('Signalling probes')} value={`${signalling.ss7Probes + signalling.diameterProbes + signalling.gtpProbes}`} delta={`${signalling.smsOTPIntercepts} OTP intercepts`} trend="flat" icon={Radio} />
        <KpiCard label={tt('CSPM findings (high)')} value={`${cspmFindings.filter((f) => f.sev === 'High').reduce((s, x) => s + x.n, 0)}`} delta={`${cspmFindings.length} types`} trend="down" icon={Cloud} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('DDoS attack mix')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[
                { k: 'L3 volumetric', v: ddos.l3pct },
                { k: 'L4 protocol',   v: ddos.l4pct },
                { k: 'L7 application',v: ddos.l7pct },
              ]} dataKey="v" nameKey="k" outerRadius={90} label={(d: any) => `${(d.v * 100).toFixed(0)}%`}>
                {[RED, AMBER, BLUE].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Signalling-attack telemetry (30d)')}>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('SS7 probes')}</td><td className="text-right font-bold">{signalling.ss7Probes}</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('Diameter probes')}</td><td className="text-right font-bold">{signalling.diameterProbes}</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('GTP probes')}</td><td className="text-right font-bold">{signalling.gtpProbes}</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('SMS OTP intercept attempts')}</td><td className="text-right font-bold text-emerald-600">{signalling.smsOTPIntercepts}</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('Location-tracking probes')}</td><td className="text-right font-bold">{signalling.locationProbes}</td></tr>
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Cloud security posture (CSPM)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Finding')}</th><th>{tt('Count')}</th><th>{tt('Sev')}</th></tr>
            </thead>
            <tbody>
              {cspmFindings.map((f) => (
                <tr key={f.kind} className="border-t border-black/5">
                  <td className="py-2">{f.kind}</td>
                  <td className="font-bold">{f.n}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[f.sev]}`}>{f.sev}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Network segmentation enforcement')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Zone boundary')}</th><th>{tt('Policy')}</th><th>{tt('Hits 7d')}</th></tr>
            </thead>
            <tbody>
              {cnSeg.map((s) => (
                <tr key={s.zone} className="border-t border-black/5">
                  <td className="py-2 text-xs">{s.zone}</td>
                  <td className="text-xs"><span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">{s.policy}</span></td>
                  <td>{s.hits7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Firewall hygiene')}>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <Mini label={tt('Rules total')} value={`${fwHygiene.rules.toLocaleString()}`} />
          <Mini label={tt('Any-any rules')} value={`${fwHygiene.anyAny}`} negative={fwHygiene.anyAny > 0} />
          <Mini label={tt('Orphan rules')} value={`${fwHygiene.orphan}`} negative={fwHygiene.orphan > 50} />
          <Mini label={tt('Last review')} value={fwHygiene.lastReview} />
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- APPS & APIs
function AppsTab() {
  const owaspWeak = owaspStatus.filter((o) => o.cov < 0.85).length
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Apps & APIs')} value={`${appInventory.web + appInventory.mobile + appInventory.apis}`} delta={`${appInventory.public} public`} trend="flat" icon={Smartphone} accent />
        <KpiCard label={tt('OWASP weak (<85%)')} value={`${owaspWeak}`} delta="of 10" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('API alerts (30d)')} value={`${apiAlerts.bola + apiAlerts.bfla + apiAlerts.invalidJwt}`} delta="BOLA/BFLA/JWT" trend="down" icon={Bug} />
        <KpiCard label={tt('Bug bounty paid')} value={`BSD ${bugBounty.payoutK}K`} delta={`${bugBounty.reports30d} reports`} trend="up" icon={Award} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('OWASP Top-10 mitigation')}>
          {owaspStatus.map((o) => (
            <div key={o.item} className="mb-2.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-xs">{o.item}</span>
                <span className="font-bold text-xs">{(o.cov * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${o.cov >= 0.9 ? 'bg-emerald-500' : o.cov >= 0.8 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${o.cov * 100}%` }} /></div>
            </div>
          ))}
        </Panel>
        <Panel title={tt('DevSecOps coverage')}>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['SAST coverage', devSecOps.sastCov],
                ['DAST coverage', devSecOps.dastCov],
                ['SCA coverage', devSecOps.scaCov],
                ['Secret-scan coverage', devSecOps.secretScanCov],
                ['PR security review', devSecOps.prSecReview],
                ['SBOM coverage (CRA-ready)', devSecOps.sbomCov],
              ].map(([label, val]) => (
                <tr key={label as string} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold w-1/2">{label}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded"><div className={`h-full rounded ${(val as number) >= 0.9 ? 'bg-emerald-500' : (val as number) >= 0.7 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${(val as number) * 100}%` }} /></div>
                      <span className="text-xs font-bold w-10 text-right">{((val as number) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('API security (last 30d)')}>
        <div className="grid md:grid-cols-5 gap-3 text-sm">
          <Mini label={tt('BOLA detections')} value={`${apiAlerts.bola}`} negative={apiAlerts.bola > 0} />
          <Mini label={tt('BFLA detections')} value={`${apiAlerts.bfla}`} negative={apiAlerts.bfla > 0} />
          <Mini label={tt('Rate-limit hits')} value={`${apiAlerts.rateLimits}`} />
          <Mini label={tt('Invalid JWTs')} value={`${apiAlerts.invalidJwt}`} />
          <Mini label={tt('Exposed secrets')} value={`${apiAlerts.exposedSecrets}`} negative={apiAlerts.exposedSecrets > 0} />
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- RESILIENCE
function ResilienceTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Critical services')} value={`${resilience.length}`} delta={`${resilience.filter((r) => r.drillResult === 'Pass').length} drills passed`} trend="up" icon={ShieldCheck} accent />
        <KpiCard label={tt('Data classified')} value={`${(dataSec.classified * 100).toFixed(0)}%`} delta={`${dataSec.restrictedStores} restricted stores`} trend="up" icon={Database} />
        <KpiCard label={tt('DLP exfil blocked')} value={`${dataSec.exfilBlocked}`} delta={`${dataSec.dlpEvents} events 30d`} trend="up" icon={Lock} />
        <KpiCard label={tt('3rd-parties C+')} value={`${thirdParty.filter((t) => t.rating === 'C').length}`} delta="vendor cyber" trend="down" icon={AlertTriangle} />
      </div>

      <Panel title={tt('Critical-service RTO/RPO actuals')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Service')}</th><th>{tt('RTO (h)')}</th><th>{tt('RPO (h)')}</th><th>{tt('Last failover')}</th><th>{tt('Drill result')}</th></tr>
          </thead>
          <tbody>
            {resilience.map((r) => (
              <tr key={r.svc} className="border-t border-black/5">
                <td className="py-2 font-semibold">{r.svc}</td>
                <td>{r.rtoH}h</td>
                <td>{r.rpoH}h</td>
                <td className="text-xs text-vfes-dark/60">{r.lastFail}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[r.drillResult]}`}>{r.drillResult}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('3rd-party access to crown jewels')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Access')}</th><th>{tt('Rating')}</th><th>{tt('Last attest.')}</th><th>{tt('Findings')}</th></tr>
            </thead>
            <tbody>
              {thirdParty.map((t) => (
                <tr key={t.vendor} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{t.vendor}</td>
                  <td className="text-xs">{t.access}</td>
                  <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.rating === 'A' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{t.rating}</span></td>
                  <td className="text-xs">{t.lastAttest}</td>
                  <td className={t.findings > 5 ? 'text-vfes-dark font-bold' : ''}>{t.findings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Data security posture')}>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Data classified', dataSec.classified],
                ['Tokenisation coverage', dataSec.tokenisationCov],
                ['KMS rotation 30d', dataSec.kmsRotation30d],
                ['At-rest encryption', dataSec.atRest],
                ['In-transit encryption', dataSec.inTransit],
              ].map(([label, val]) => (
                <tr key={label as string} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold w-1/2">{label}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded"><div className={`h-full rounded ${(val as number) >= 0.95 ? 'bg-emerald-500' : (val as number) >= 0.8 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${(val as number) * 100}%` }} /></div>
                      <span className="text-xs font-bold w-10 text-right">{((val as number) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('CIS 18 control coverage')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cisCoverage} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid stroke="#eef0f3" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
            <YAxis dataKey="ctrl" type="category" tick={{ fontSize: 10 }} width={150} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
            <Bar dataKey="score" fill={RED} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- RISK REGISTER
function RegisterTab() {
  const data = riskRegister.map((r) => ({ ...r, x: r.res, y: 11 - r.inh, name: r.id }))
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Risks tracked')} value={`${riskRegister.length}`} delta="enterprise-wide" trend="flat" icon={AlertOctagon} accent />
        <KpiCard label={tt('Above appetite')} value={`${riskRegister.filter((r) => r.res > r.appetite).length}`} delta="action required" trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('Trending down')} value={`${riskRegister.filter((r) => r.trend === 'down').length}`} delta="mitigations working" trend="up" icon={TrendingDown} />
        <KpiCard label={tt('Trending up')} value={`${riskRegister.filter((r) => r.trend === 'up').length}`} delta="watch" trend="down" icon={TrendingUp} />
      </div>

      <Panel title={tt('Risk register · inherent vs residual (5×5 heat)')}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid stroke="#eef0f3" />
            <XAxis type="number" dataKey="res" name={tt('Residual')} domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: 'Residual →', fontSize: 10, position: 'bottom', offset: -4 }} />
            <YAxis type="number" dataKey="inh" name={tt('Inherent')} domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: 'Inherent →', fontSize: 10, angle: -90, position: 'left' }} />
            <ZAxis range={[120, 240]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any, p: any) => [`${p.payload.id}: ${p.payload.name}`, '']} />
            <ReferenceLine x={5} stroke="#1f2937" strokeDasharray="3 3" />
            <ReferenceLine y={5} stroke="#1f2937" strokeDasharray="3 3" />
            <Scatter data={data}>
              {data.map((d, i) => <Cell key={i} fill={d.res > d.appetite ? RED : d.res === d.appetite ? AMBER : GREEN} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={tt('Top enterprise risks')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Risk')}</th><th>{tt('Cat')}</th><th>{tt('Inh')}</th><th>{tt('Res')}</th><th>{tt('Appetite')}</th><th>{tt('KCI')}</th><th>{tt('Trend')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {riskRegister.sort((a, b) => b.res - a.res).map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs">{r.id}</td>
                <td className="font-semibold">{tt(r.name)}</td>
                <td className="text-vfes-dark/60 text-xs">{r.cat}</td>
                <td>{r.inh}</td>
                <td className={r.res > r.appetite ? 'text-vfes-dark font-bold' : r.res === r.appetite ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{r.res}</td>
                <td className="text-vfes-dark/55">{r.appetite}</td>
                <td className="text-xs">{r.kci}</td>
                <td>{r.trend === 'down' ? <span className="text-emerald-600 font-bold">▼</span> : r.trend === 'up' ? <span className="text-vfes-dark font-bold">▲</span> : <span className="text-vfes-dark/40">—</span>}</td>
                <td className="text-xs">{tt(r.owner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- INC 360
function Inc360Tab({ id, setId }: { id: string; setId: (id: string) => void }) {
  const inc = useMemo(() => incidents.find((i) => i.id === id) ?? incidents[0], [id])
  const phaseColor = (s: 'Hit' | 'Miss') => s === 'Hit' ? RED : GREEN
  return (
    <>
      <div className="bg-vfes-red/5 border-l-4 border-vfes-red rounded-r-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-vfes-dark/70">
        <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Incident drill-down')}</span>
        <label className="flex items-center gap-1.5">Pick incident
          <select value={id} onChange={(e) => setId(e.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
            {incidents.map((i) => <option key={i.id} value={i.id}>{i.id} · {tt(i.title)}</option>)}
          </select>
        </label>
        <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('Click any incident row to drill in')}</span>
      </div>

      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">{inc.id} · opened {inc.opened}</div>
            <div className="text-3xl font-extrabold mt-1">{tt(inc.title)}</div>
            <div className="text-sm text-white/70 mt-1">Detection: {inc.detection} · MITRE: {inc.mitre.join(', ')}</div>
          </div>
          <div className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest ${inc.sev === 'Critical' ? 'bg-red-600' : inc.sev === 'High' ? 'bg-vfes-red' : inc.sev === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}>{inc.sev} · {tt(inc.status)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Status')} value={tt(inc.status)} delta="case-managed" trend="flat" icon={Activity} accent />
        <KpiCard label={tt('Severity')} value={inc.sev} delta={inc.mitre.join(', ')} trend="flat" icon={AlertOctagon} />
        <KpiCard label={tt('Assets touched')} value={`${inc.assets.length}`} delta="see below" trend="flat" icon={Server} />
        <KpiCard label={tt('IoCs collected')} value={`${inc.ioCs.length}`} delta="TI feed" trend="flat" icon={Crosshair} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Timeline')}>
          <div className="space-y-2">
            {inc.timeline.map((t, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                <span className="font-mono text-xs text-vfes-dark/55 w-12 shrink-0">{tt(t.t)}</span>
                <span className="text-sm">{t.event}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={tt('Cyber kill-chain coverage')}>
          {inc.killChain.length === 0 ? (
            <div className="text-sm text-vfes-dark/55">{tt('Not applicable for this incident.')}</div>
          ) : (
            <div className="space-y-2">
              {inc.killChain.map((k, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-semibold flex-1">{k.phase}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded`} style={{ background: phaseColor(k.status) + '22', color: phaseColor(k.status) }}>{tt(k.status)}</span>
                </div>
              ))}
              <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Hits show where the adversary succeeded · misses show where defences held.')}</div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Assets touched')}>
          <ul className="space-y-1 text-sm">
            {inc.assets.map((a) => <li key={a} className="font-mono text-xs">{a}</li>)}
          </ul>
        </Panel>
        <Panel title={tt('IoCs')}>
          <ul className="space-y-1 text-sm">
            {inc.ioCs.length === 0 ? <li className="text-vfes-dark/55">{tt('None recorded.')}</li> : inc.ioCs.map((c) => <li key={c} className="font-mono text-xs">{c}</li>)}
          </ul>
        </Panel>
        <Panel title={tt('Comms log')}>
          <div className="text-sm">{inc.comms}</div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Root-cause analysis')}>
          <div className="text-sm">{inc.rca}</div>
        </Panel>
        <Panel title={tt('Lessons learned')}>
          <div className="text-sm">{inc.lessons}</div>
        </Panel>
      </div>

      <SiPrompts prompts={[
        `Show all incidents with same MITRE TTPs as ${inc.id}.`,
        `Forecast similar attack volume next 30 days.`,
        `List assets sharing exposure profile with ${inc.assets[0] ?? 'asset'}.`,
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- helpers
function Mini({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5">
      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{label}</div>
      <div className={`text-lg font-extrabold mt-0.5 ${positive ? 'text-emerald-600' : negative ? 'text-vfes-dark' : ''}`}>{value}</div>
    </div>
  )
}
function SiPrompts({ prompts }: { prompts: string[] }) {
  return (
    <Panel title={tt('Snowflake Intelligence — try a question')}>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <div key={i} className="inline-flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-vfes-red/10">
            <MessageSquare className="w-3.5 h-3.5" /> {p}
          </div>
        ))}
      </div>
    </Panel>
  )
}
