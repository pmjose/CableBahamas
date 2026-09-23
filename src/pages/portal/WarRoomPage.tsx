import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import {
  Siren, AlertTriangle, Zap, Users, ShieldAlert, Phone, ChevronRight, BookOpen, MapPin,
  Megaphone, FileText, Twitter, Activity, RefreshCw, Bell, Volume2, VolumeX, Briefcase,
  TrendingUp, TrendingDown, ArrowRight, Network, MessageSquareText, CheckCircle2,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart, AreaChart, Area, Legend, ComposedChart } from 'recharts'
import CartoMap from '../../components/CartoMap'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────

type Severity = 'P1' | 'P2' | 'P3'
type IncidentStatus = 'Active' | 'Mitigated' | 'Investigating' | 'Resolved' | 'Monitoring'

type Incident = {
  id: string
  title: string
  severity: Severity
  status: IncidentStatus
  region: string[]
  domain: 'Network' | 'Customer' | 'Commercial' | 'Security' | 'Product'
  detectedAt: string  // ISO string
  slaMinutes: number
  commander: string
  bridgeAttendees: string[]
  customersImpacted: number
  productsAffected: string[]
  revenuePerMin: number
  rootCause: string
  runbookUrl: string
  vendorEscalation?: string
  nextStep: string
  publicStatusPage: 'visible' | 'hidden'
}

// detectedAt is computed relative to "now" so timers tick
function minsAgo(m: number) {
  return new Date(Date.now() - m * 60000).toISOString()
}

const incidents: Incident[] = [
  {
    id: 'INC-2048',
    title: 'Fibre cut — Nassau North backbone (A12 civils strike)',
    severity: 'P1',
    status: 'Active',
    region: ['Nassau North', 'Central', 'Eastern'],
    domain: 'Network',
    detectedAt: minsAgo(32),
    slaMinutes: 90,
    commander: 'Emma Knowles (NetOps Duty)',
    bridgeAttendees: ['NetOps', 'Field Ops', 'Care Comms', 'Legal', 'CEO Office'],
    customersImpacted: 12400,
    productsAffected: ['Broadband', 'TV', 'Mobile (data backup)'],
    revenuePerMin: 1840,
    rootCause: 'Civils contractor severed 96-fibre Nassau trunk at A12-J5',
    runbookUrl: 'RUNBOOK-NET-FIBRE-CUT-001',
    vendorEscalation: 'Cisco TAC SR-3849421 · Nokia escalation L4',
    nextStep: 'Splicing crew on-site, ETA 1h 38m to first restore',
    publicStatusPage: 'visible',
  },
  {
    id: 'INC-2030',
    title: 'Billing payment gateway timeout (Worldpay)',
    severity: 'P1',
    status: 'Mitigated',
    region: ['National'],
    domain: 'Commercial',
    detectedAt: minsAgo(72),
    slaMinutes: 90,
    commander: 'Lars Jose (IT Duty)',
    bridgeAttendees: ['IT', 'Finance', 'Worldpay', 'Care'],
    customersImpacted: 0,
    productsAffected: ['Online payments', 'MyREV app'],
    revenuePerMin: 92,
    rootCause: 'Worldpay regional outage in EU-West-1',
    runbookUrl: 'RUNBOOK-PAY-OUTAGE-002',
    vendorEscalation: 'Worldpay status: investigating',
    nextStep: 'Failover to backup processor active — payments queuing',
    publicStatusPage: 'visible',
  },
  {
    id: 'INC-2029',
    title: 'Surge in cancellation requests — Eleuthera',
    severity: 'P2',
    status: 'Investigating',
    region: ['Eleuthera'],
    domain: 'Customer',
    detectedAt: minsAgo(124),
    slaMinutes: 360,
    commander: 'Sofie Bain (CCO)',
    bridgeAttendees: ['CVM', 'Marketing', 'Pricing'],
    customersImpacted: 380,
    productsAffected: ['Broadband'],
    revenuePerMin: 0,
    rootCause: 'Suspected reaction to Benchmark B BSD 30 launch announcement',
    runbookUrl: 'RUNBOOK-CHURN-SURGE-001',
    nextStep: 'Retention save offer auto-deployed via PEGA',
    publicStatusPage: 'hidden',
  },
  {
    id: 'INC-2028',
    title: 'DDoS mitigation active — Freeport POP',
    severity: 'P2',
    status: 'Mitigated',
    region: ['Freeport', 'Downtown'],
    domain: 'Security',
    detectedAt: minsAgo(18),
    slaMinutes: 360,
    commander: 'Diarmuid Hayes (SecOps Duty)',
    bridgeAttendees: ['SecOps', 'NetOps', 'Akamai'],
    customersImpacted: 0,
    productsAffected: ['Latency on Freeport POP +14ms'],
    revenuePerMin: 0,
    rootCause: '120 Gbps UDP flood — botnet origin Eastern Europe',
    runbookUrl: 'RUNBOOK-SEC-DDOS-001',
    vendorEscalation: 'Akamai Prolexic engaged',
    nextStep: 'Scrubbing in place; monitoring for second wave',
    publicStatusPage: 'hidden',
  },
  {
    id: 'INC-2027',
    title: 'REVTV Box EPG sync delay',
    severity: 'P3',
    status: 'Monitoring',
    region: ['National'],
    domain: 'Product',
    detectedAt: minsAgo(227),
    slaMinutes: 1440,
    commander: 'Camille Knowles (Product Duty)',
    bridgeAttendees: ['Product', 'NOC'],
    customersImpacted: 4800,
    productsAffected: ['REVTV'],
    revenuePerMin: 0,
    rootCause: 'Benchmark B EPG feed lag — vendor-side',
    runbookUrl: 'RUNBOOK-TV-EPG-001',
    vendorEscalation: 'Benchmark B engineering ticket Benchmark B-INC-118842',
    nextStep: 'Rolling restart of EPG cache nodes',
    publicStatusPage: 'visible',
  },
  // ── Mobile / RAN incidents (Cable Bahamas is a top-3 MNO — 13.6M mobile subs) ──
  {
    id: 'INC-2071',
    title: '[MOBILE] 5G SA core signaling spike — Nassau City Centre',
    severity: 'P1',
    status: 'Active',
    region: ['Nassau'],
    domain: 'Network',
    detectedAt: minsAgo(34),
    slaMinutes: 60,
    commander: 'Mobile NOC · Jonas Adderley',
    bridgeAttendees: ['Mobile NOC', 'Ericsson TAC', 'Core Voice'],
    customersImpacted: 86000,
    productsAffected: ['Mobile voice', '5G data', 'VoNR'],
    revenuePerMin: 1280,
    rootCause: 'AMF overload after software push — registration storm 12.4× baseline',
    runbookUrl: 'RUNBOOK-5G-AMF-007',
    vendorEscalation: 'Ericsson TAC ER-118291 · severity 1',
    nextStep: 'Roll back AMF v3.4.1 → v3.3.7 across cluster',
    publicStatusPage: 'visible',
  },
  {
    id: 'INC-2032',
    title: '[MOBILE] Cell-site outage cluster — rural Out Islands (28 sites)',
    severity: 'P2',
    status: 'Mitigated',
    region: ['Out Islands'],
    domain: 'Network',
    detectedAt: minsAgo(112),
    slaMinutes: 240,
    commander: 'Field Ops — Lars Boyle',
    bridgeAttendees: ['Field Ops', 'Island utility (demo) liaison', 'Mobile NOC'],
    customersImpacted: 18400,
    productsAffected: ['Mobile voice', '4G data'],
    revenuePerMin: 220,
    rootCause: 'Island utility (demo) MV grid trip — 28 macro sites on battery (avg 2h autonomy)',
    runbookUrl: 'RUNBOOK-RAN-POWER-014',
    vendorEscalation: 'Fluvius NOC ticket END-2026-44182',
    nextStep: 'Generators dispatched (ETA 35 min) · Island Towers (demo) shared sites prioritised',
    publicStatusPage: 'visible',
  },
  {
    id: 'INC-2033',
    title: '[MOBILE] Voice quality degradation — Freeport ring',
    severity: 'P3',
    status: 'Investigating',
    region: ['Freeport'],
    domain: 'Network',
    detectedAt: minsAgo(186),
    slaMinutes: 480,
    commander: 'Mobile NOC · Sofie Bethel',
    bridgeAttendees: ['Mobile NOC', 'Nokia AirScale TAC'],
    customersImpacted: 6200,
    productsAffected: ['VoLTE', 'VoNR'],
    revenuePerMin: 40,
    rootCause: 'IMS jitter buffer mis-tune after BBU pool rebalance — MOS dropped 4.21 → 3.84',
    runbookUrl: 'RUNBOOK-IMS-JITTER-002',
    nextStep: 'Re-tune jitter buffer to 60ms · monitor MOS trend',
    publicStatusPage: 'hidden',
  },
]

const decisions = [
  { sev: 'urgent', text: 'Approve BSD 50K make-good package for Nassau North customers (12.4K impact)', for: 'COO', age: 8, link: '/portal/operations' },
  { sev: 'urgent', text: 'Authorise public press statement re: A12 civils strike', for: 'CEO/CMO', age: 14, link: '/portal/regulatory' },
  { sev: 'review', text: 'URCA notification for >10K customer outage required within 2h', for: 'Legal', age: 22, link: '/portal/regulatory' },
  { sev: 'review', text: 'Eleuthera retention budget uplift BSD 20K — Benchmark B defensive', for: 'CCO', age: 38, link: '/portal/customer-360' },
]

const trend30d = [
  { d: 'W-4', P1: 2, P2: 5, P3: 8 },
  { d: 'W-3', P1: 1, P2: 4, P3: 9 },
  { d: 'W-2', P1: 3, P2: 6, P3: 7 },
  { d: 'W-1', P1: 2, P2: 7, P3: 11 },
  { d: 'W0', P1: 2, P2: 4, P3: 6 },
]

const ircHistory = [
  { d: 'Mon', n: 14 }, { d: 'Tue', n: 18 }, { d: 'Wed', n: 12 },
  { d: 'Thu', n: 22 }, { d: 'Fri', n: 16 }, { d: 'Sat', n: 8 }, { d: 'Sun', n: 6 },
]

const recentResolved = [
  { id: 'INC-2026', title: 'Mobile signaling spike Nassau Central', sev: 'P2', resolvedAgo: '14m', mttr: '1h 22m', pir: 'pending' },
  { id: 'INC-2025', title: 'CMTS reboot loop Freeport-12', sev: 'P3', resolvedAgo: '2h 04m', mttr: '3h 18m', pir: 'open' },
  { id: 'INC-2024', title: 'Mi Cable Bahamas login errors', sev: 'P2', resolvedAgo: '4h 12m', mttr: '2h 02m', pir: 'pending' },
]

const topProblems = [
  { c: 'Civils-related fibre cuts', n: 14, trend: '+27% vs prior 30d', region: 'Freeport, Nassau' },
  { c: 'CMTS firmware failures', n: 9, trend: '-12%', region: 'National' },
  { c: 'Worldpay EU-West outages', n: 4, trend: '+100% (new)', region: 'National' },
]

// ── extra data for new tabs ──
const timelineEvents = [
  { t: '14:02', type: 'Alert', actor: 'NOC', msg: 'INC-2048 raised — fibre cut A12, Nassau North' },
  { t: '14:04', type: 'Bridge', actor: 'Emma Knowles', msg: 'P1 bridge opened · 12 attendees joining' },
  { t: '14:07', type: 'AI', actor: 'Cortex', msg: 'Blast-radius: 12,400 customers · BSD 1,840/min burn predicted' },
  { t: '14:09', type: 'Comms', actor: 'Care', msg: 'SMS batch queued: 12,400 affected subscribers' },
  { t: '14:12', type: 'Field', actor: 'Field Ops', msg: 'Splicing crew dispatched — ETA 1h 45m' },
  { t: '14:18', type: 'Vendor', actor: 'Cisco TAC', msg: 'SR-3849421 opened · escalated to L4' },
  { t: '14:22', type: 'Legal', actor: 'Legal', msg: 'URCA notification filed (>10K customer outage requirement met)' },
  { t: '14:28', type: 'Exec', actor: 'CEO Office', msg: 'Make-good BSD 50K package under CEO review' },
  { t: '14:35', type: 'AI', actor: 'Cortex', msg: 'MTTR updated: 1h 22m remaining to first restore (P50)' },
  { t: '14:42', type: 'Bridge', actor: 'Emma Knowles', msg: 'Update: splicing crew on-site, backhaul route confirmed' },
]

const impactByRegion = [
  { region: 'Nassau North', customers: 6200, revPerMin: 920, subs: 'Broadband, TV' },
  { region: 'Central',       customers: 3800, revPerMin: 560, subs: 'Broadband' },
  { region: 'Eastern',        customers: 2400, revPerMin: 360, subs: 'Broadband, Mobile' },
]

const revenueAtRiskTrend = [
  { t: '14:00', burn: 1840 }, { t: '14:05', burn: 1840 }, { t: '14:10', burn: 1840 },
  { t: '14:15', burn: 1820 }, { t: '14:20', burn: 1800 }, { t: '14:25', burn: 1780 },
  { t: '14:30', burn: 1760 }, { t: '14:35', burn: 1740 }, { t: '14:40', burn: 1720 },
]

const customerImpactTrend = [
  { t: '14:00', impacted: 12400 }, { t: '14:10', impacted: 12380 }, { t: '14:20', impacted: 12360 },
  { t: '14:30', impacted: 12340 }, { t: '14:40', impacted: 12400 },
]

const runbookSteps = [
  { step: 1, title: 'Confirm fibre cut location & affected route', status: 'done', owner: 'NetOps', notes: 'A12-J5 confirmed — 96-fibre Nassau trunk' },
  { step: 2, title: 'Open P1 bridge & assign incident commander', status: 'done', owner: 'NOC', notes: 'Emma Knowles (NetOps Duty) · bridge ID 4921' },
  { step: 3, title: 'Dispatch splicing crew to site', status: 'done', owner: 'Field Ops', notes: 'Crew on-site 14:42 · ETA restore 1h 38m' },
  { step: 4, title: 'Activate customer comms (SMS + status page)', status: 'done', owner: 'Care Comms', notes: 'SMS sent 12.4K · status page live' },
  { step: 5, title: 'File URCA notification', status: 'done', owner: 'Legal', notes: 'Filed 14:22 — meets ≤2h requirement' },
  { step: 6, title: 'Escalate to Cisco TAC & Nokia L4', status: 'done', owner: 'Vendor Mgmt', notes: 'Cisco SR-3849421 · Nokia escalation L4' },
  { step: 7, title: 'First fibre restore — ring node A', status: 'active', owner: 'Field Ops', notes: 'ETA ~1h' },
  { step: 8, title: 'Traffic re-route validation', status: 'pending', owner: 'NetOps', notes: 'Automated test suite' },
  { step: 9, title: 'Full restore & monitoring window (30 min)', status: 'pending', owner: 'NOC', notes: 'All-green before bridge close' },
  { step: 10, title: 'Post-incident review schedule', status: 'pending', owner: 'Emma Knowles', notes: 'T+24h' },
]

const vendors = [
  { vendor: 'Cisco TAC', ticket: 'SR-3849421', severity: 'S1', status: 'Active', lastUpdate: '14:18', sla: '2h', contact: 'Cisco NOC EU' },
  { vendor: 'Nokia', ticket: 'Nokia-INC-88421', severity: 'L4', status: 'Active', lastUpdate: '14:21', sla: '4h', contact: 'Nokia IMS TAC' },
  { vendor: 'Worldpay', ticket: 'WP-EU-WEST-2026', severity: 'P1', status: 'Monitoring', lastUpdate: '13:55', sla: '1h', contact: 'Worldpay Incident' },
  { vendor: 'Akamai Prolexic', ticket: 'AK-PROL-2841', severity: 'High', status: 'Mitigated', lastUpdate: '14:01', sla: '1h', contact: 'Prolexic 24/7' },
  { vendor: 'Island utility (demo) NOC', ticket: 'END-2026-44182', severity: 'P2', status: 'Active', lastUpdate: '14:12', sla: '3h', contact: 'Island utility (demo) Grid Ops' },
  { vendor: 'Ericsson TAC', ticket: 'ER-118291', severity: 'S1', status: 'Active', lastUpdate: '14:31', sla: '2h', contact: 'Ericsson 5G Core' },
  { vendor: 'Benchmark C EPG', ticket: 'Benchmark B-INC-118842', severity: 'P3', status: 'Investigating', lastUpdate: '12:40', sla: '6h', contact: 'Benchmark C Content Eng' },
]

const slaBreachRisk = [
  { inc: 'INC-2048', remaining: 58, sla: 90, pct: 64, domain: 'Network', risk: 'Medium' },
  { inc: 'INC-2071', remaining: 26, sla: 60, pct: 43, domain: 'Mobile', risk: 'High' },
  { inc: 'INC-2030', remaining: 18, sla: 90, pct: 80, domain: 'Commercial', risk: 'High' },
  { inc: 'INC-2029', remaining: 236, sla: 360, pct: 34, domain: 'Customer', risk: 'Low' },
  { inc: 'INC-2028', remaining: 342, sla: 360, pct: 5, domain: 'Security', risk: 'Low' },
]

const pirList = [
  { id: 'INC-2026', title: 'Mobile signaling spike Nassau Central', closed: '2026-08-08', mttr: '1h 22m', findings: 4, owner: 'Jonas Adderley', status: 'In Review' },
  { id: 'INC-2025', title: 'CMTS reboot loop Freeport-12', closed: '2026-08-08', mttr: '3h 18m', findings: 6, owner: 'NetOps', status: 'Open' },
  { id: 'INC-2024', title: 'Mi Cable Bahamas login errors', closed: '2026-08-07', mttr: '2h 02m', findings: 3, owner: 'IT', status: 'Approved' },
  { id: 'INC-2019', title: 'Eleuthera 4G coverage gap (RRH swap)', closed: '2026-08-04', mttr: '4h 44m', findings: 5, owner: 'Field Ops South', status: 'Approved' },
]

const mttrByDomain = [
  { domain: 'Network', p1: 98, p2: 192, p3: 502 },
  { domain: 'Mobile', p1: 78, p2: 148, p3: 388 },
  { domain: 'Security', p1: 62, p2: 110, p3: 240 },
  { domain: 'Commercial', p1: 120, p2: 200, p3: 520 },
  { domain: 'Customer', p1: 0, p2: 218, p3: 440 },
  { domain: 'Product', p1: 0, p2: 280, p3: 580 },
]

const slaComplianceTrend = [
  { wk: 'W-6', p1: 72, p2: 88, p3: 94 },
  { wk: 'W-5', p1: 75, p2: 90, p3: 95 },
  { wk: 'W-4', p1: 68, p2: 87, p3: 93 },
  { wk: 'W-3', p1: 80, p2: 92, p3: 96 },
  { wk: 'W-2', p1: 84, p2: 91, p3: 95 },
  { wk: 'W-1', p1: 88, p2: 94, p3: 97 },
]

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function elapsedString(detectedAt: string, now: number) {
  const ms = now - new Date(detectedAt).getTime()
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function slaCountdown(detectedAt: string, slaMinutes: number, now: number) {
  const elapsedMin = (now - new Date(detectedAt).getTime()) / 60000
  const remaining = slaMinutes - elapsedMin
  const breached = remaining < 0
  const m = Math.floor(Math.abs(remaining))
  const s = Math.floor((Math.abs(remaining) - m) * 60)
  return { breached, label: breached ? `breached ${m}m` : `${m}m ${s.toString().padStart(2, '0')}s left`, remaining }
}

const sevColor: Record<Severity, string> = {
  P1: 'bg-red-600 text-white',
  P2: 'bg-amber-500 text-white',
  P3: 'bg-yellow-300 text-vfes-dark',
}

const statusColor: Record<IncidentStatus, string> = {
  Active: 'bg-red-100 text-red-700',
  Mitigated: 'bg-amber-100 text-amber-700',
  Investigating: 'bg-blue-100 text-blue-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Monitoring: 'bg-slate-100 text-slate-600',
}

// Real Bahamian region coordinates for Carto map
const bahamasRegions: { name: string; lat: number; lng: number }[] = [
  { name: 'Nassau',  lat: 25.0443, lng: -77.3504 },
  { name: 'Freeport',    lat: 26.5333, lng: -78.7 },
  { name: 'Abaco',   lat: 26.5412, lng: -77.0636 },
  { name: 'Eleuthera',   lat: 25.1962, lng: -76.2431 },
  { name: 'Exuma',  lat: 23.5, lng: -75.7667 },
  { name: 'Bimini', lat: 25.727, lng: -79.2972 },
  { name: 'Andros', lat: 24.7064, lng: -77.7902 },
  { name: 'San Salvador', lat: 24.036, lng: -74.494 },
  { name: 'Long Island',    lat: 23.25, lng: -75.1 },
]

// ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'live',         label: 'Live',         icon: Siren },
  { id: 'timeline',     label: 'Timeline',     icon: Activity },
  { id: 'impact',       label: 'Impact',       icon: Zap },
  { id: 'comms',        label: 'Comms',        icon: Megaphone },
  { id: 'runbook',      label: 'Runbook',      icon: BookOpen },
  { id: 'dependencies', label: 'Dependencies', icon: Network },
  { id: 'sla-mttr',     label: 'SLA / MTTR',   icon: TrendingUp },
  { id: 'post-mortem',  label: 'Post-mortem',  icon: CheckCircle2 },
] as const
type TabId = typeof TABS[number]['id'] | 'trends' | 'resolved'

// Network → CX closed-loop demo (self-contained)
function ClosedLoopPanel() {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const STEPS = [
    'Correlated P1 RAN outage → 18,400 impacted subscribers (cell-join)',
    'Scored CX risk → 2,310 detractors / high-value lines',
    'Issued BSD 5 goodwill credit + proactive SMS apology',
    'Suppressed outbound campaigns in affected cells',
  ]
  const run = () => {
    setRunning(true); setStep(0)
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 800))
    setTimeout(() => setRunning(false), STEPS.length * 800 + 600)
  }
  return (
    <Panel
      title={tt('Network → CX closed-loop (Cortex Agent)')}
      action={
        <button onClick={run} disabled={running}
          className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1">
          <Zap className="w-3 h-3" /> {running ? tt('Running agent…') : tt('Run Closed-Loop Agent')}
        </button>
      }
    >
      <div className="grid md:grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className={`rounded-lg p-3 border text-xs transition ${
            step >= i + 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#fafbfc] border-black/5 text-vfes-dark/50'
          }`}>
            <div className="flex items-center gap-1 font-bold mb-1">
              {step >= i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
              {tt('Step')} {i + 1}
            </div>
            {tt(s)}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
        <ArrowRight className="w-3 h-3" /> {tt('One agent spans RAN telemetry, churn model, billing credit & campaign suppression — fully governed in Snowflake.')}
      </div>
    </Panel>
  )
}

export default function WarRoomPage() {
  const [now, setNow] = useState(Date.now())
  const [audio, setAudio] = useState(false)
  const [tab, setTab] = useState<TabId>('live')
  const [runbookInc, setRunbookInc] = useState<string>('INC-2048')
  const [depFilter, setDepFilter] = useState<string>('all')
  const pirRef = useRef<HTMLDivElement>(null)
  const filteredVendors = useCallback(
    () => depFilter === 'all' ? vendors : vendors.filter((v) => v.status === depFilter),
    [depFilter]
  )
  const totalBurnRate = useMemo(() => incidents.reduce((s, i) => s + i.revenuePerMin, 0), [])
  const highVendorCount = useMemo(() => vendors.filter((v) => v.status === 'Active').length, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const p1 = incidents.filter((i) => i.severity === 'P1')
  const p2 = incidents.filter((i) => i.severity === 'P2')
  const p3 = incidents.filter((i) => i.severity === 'P3')
  const totalCustomers = incidents.reduce((s, i) => s + i.customersImpacted, 0)
  const totalRevPerMin = incidents.reduce((s, i) => s + i.revenuePerMin, 0)
  const activeBridges = incidents.filter((i) => i.status === 'Active' || i.status === 'Mitigated').length

  // Affected regions for map
  const affected = new Set(incidents.flatMap((i) => i.region))

  return (
    <div className={`p-8 ${p1.some((i) => i.status === 'Active') ? 'bg-red-50/30' : ''}`}>
      <PageHeader
        title={tt('War Room')}
        subtitle={`Cross-domain critical incidents · auto-refresh every 1s · last updated ${new Date(now).toLocaleTimeString('en-BS')}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudio(!audio)}
              className={`p-2 rounded-lg ${audio ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/55 hover:bg-black/10'}`}
              title={audio ? 'Audio alerts on' : 'Audio alerts muted'}
            >
              {audio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button className="p-2 rounded-lg bg-black/5 hover:bg-black/10" title={tt('Refresh')}><RefreshCw className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-bold border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              {p1.filter((i) => i.status === 'Active').length} P1 Active · {p2.filter((i) => i.status !== 'Resolved').length} P2 Active
            </div>
          </div>
        }
      />

      <MlInsightSection
        heading="Incident intelligence"
        models={[
          { name: 'Incident Correlator', metric: 'RCA 0.86', sub: 'alarm → root-cause clustering' },
          { name: 'MTTR Predictor', metric: 'MAE 9 min', sub: 'resolution-time estimate' },
          { name: 'Blast-radius Estimator', metric: 'AUC 0.89', sub: 'customer-impact projection' },
        ]}
        agentLabel="Run Incident Copilot" agentRunningLabel="Correlating…"
        agentSteps={[
          'Correlated alarms across RAN, transport & core (Cortex)',
          'Predicted MTTR & customer blast-radius per incident',
          'Ranked P1s by predicted impact, not raw count',
          'Drafted the customer & exec comms',
        ]}
        agentBlurb="Correlation collapses an alarm storm into one root cause; the predictions tell you which incident to work first."
        decision={{
          title: 'Work the P1 with the largest predicted blast-radius first',
          detail: 'Two P1s are open; the model predicts one will impact 6× more customers and breach SLA in 40 minutes. Pull the bridge there first and pre-stage the corrective change.',
          impact: 'lower customer-impacting minutes · fewer SLA credits',
          risk: 'prediction guides triage — keep human command of the bridge',
          linkTo: '#/portal/assurance', linkLabel: 'Open Service Assurance',
        }}
        chart={{
          kind: 'bar', title: 'Open incidents — predicted customer impact (K)', xKey: 'inc', unit: 'K',
          data: [
            { inc: 'INC-2048', impact: 182 }, { inc: 'INC-2044', impact: 31 },
            { inc: 'INC-2050', impact: 12 }, { inc: 'INC-2052', impact: 6 },
          ],
          series: [{ key: 'impact', name: 'Predicted impact (K)', color: '#FF4438' }],
          colorBy: { key: 'impact', high: 100, mid: 25 },
          note: 'INC-2048 dominates predicted impact — the model routes it to the front of the queue.',
        }}
      />

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {tab === 'live' && (<>
      {/* Network → CX closed-loop agent */}
      <div className="mb-6">
        <ClosedLoopPanel />
      </div>
      {/* Top metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label={tt('P1 Active')} value={p1.filter((i) => i.status === 'Active').length.toString()} delta={`${p1.length} P1 total`} trend="down" icon={Siren} accent />
        <KpiCard label={tt('P2 / P3')} value={`${p2.length} / ${p3.length}`} delta="multi-domain" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('Customers Impacted')} value={`${(totalCustomers / 1000).toFixed(1)}K`} delta={`${((totalCustomers / 1040000) * 100).toFixed(2)}% of base`} trend="down" icon={Users} />
        <KpiCard label={tt('Revenue Burn')} value={`BSD ${totalRevPerMin}/min`} delta={`BSD ${Math.round(totalRevPerMin * 60).toLocaleString()}/h`} trend="down" icon={Zap} />
        <KpiCard label={tt('Active Bridges')} value={activeBridges.toString()} delta="join via Teams" trend="flat" icon={ShieldAlert} />
      </div>

      {/* Live incident bridge */}
      <Panel title={tt('Live Incident Bridge')} action={<span className="text-xs text-vfes-dark/55">{tt('Sorted by severity · oldest first')}</span>}>
        <div className="space-y-3">
          {[...incidents].sort((a, b) => {
            const order = { P1: 0, P2: 1, P3: 2 } as const
            if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity]
            return new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
          }).map((i) => {
            const elapsed = elapsedString(i.detectedAt, now)
            const sla = slaCountdown(i.detectedAt, i.slaMinutes, now)
            const totalElapsedMin = (now - new Date(i.detectedAt).getTime()) / 60000
            const slaPct = Math.min((totalElapsedMin / i.slaMinutes) * 100, 100)
            return (
              <div key={i.id} className={`rounded-xl border p-4 ${
                i.severity === 'P1' && i.status === 'Active' ? 'bg-red-50 border-red-300' : 'bg-[#fafbfc] border-black/5'
              }`}>
                {/* Header row */}
                <div className="flex items-start gap-3 flex-wrap mb-3">
                  <div className={`text-xs font-black px-3 py-2 rounded ${sevColor[i.severity]}`}>{i.severity}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base">{tt(i.title)}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor[i.status]}`}>{tt(i.status)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 bg-black/5 px-2 py-0.5 rounded">{i.domain}</span>
                    </div>
                    <div className="text-xs text-vfes-dark/65">
                      {i.id} · {i.region.join(', ')} · cmd <span className="font-bold">{i.commander}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-vfes-dark text-base">{elapsed}</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('elapsed')}</div>
                  </div>
                </div>

                {/* SLA bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold w-12">{tt('SLA')}</div>
                  <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className={`h-full ${sla.breached ? 'bg-red-600' : slaPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${slaPct}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${sla.breached ? 'text-red-600' : slaPct > 80 ? 'text-amber-700' : 'text-emerald-700'}`}>{tt(sla.label)}</span>
                </div>

                {/* Blast radius + commander grid */}
                <div className="grid md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div className="p-2.5 rounded bg-white border border-black/5">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">{tt('Blast radius')}</div>
                    <div><span className="font-bold">{i.customersImpacted.toLocaleString()}</span>{tt('customers')}</div>
                    <div className="text-xs text-vfes-dark/65">{i.productsAffected.join(' · ')}</div>
                    {i.revenuePerMin > 0 && <div className="text-xs text-red-600 font-bold mt-1">BSD {i.revenuePerMin}/min revenue at risk</div>}
                  </div>
                  <div className="p-2.5 rounded bg-white border border-black/5">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">Bridge ({i.bridgeAttendees.length})</div>
                    <div className="text-xs text-vfes-dark/75">{i.bridgeAttendees.join(' · ')}</div>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-black/5">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">{tt('Next step')}</div>
                    <div className="text-xs">{i.nextStep}</div>
                    {i.vendorEscalation && <div className="text-[10px] text-vfes-dark/55 mt-1">{i.vendorEscalation}</div>}
                  </div>
                </div>

                {/* Root cause */}
                <div className="text-xs text-vfes-dark/65 mb-3">
                  <span className="font-semibold text-vfes-dark/85">{tt('Root cause:')}</span> {i.rootCause}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Join bridge
                  </button>
                  <button className="bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> {i.runbookUrl}
                  </button>
                  <button className="bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Escalate L4
                  </button>
                  {i.publicStatusPage === 'visible' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                      <Activity className="w-3 h-3" /> on public status page
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Decisions + Map + Comms */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <Panel title={tt('Exec Decision Queue')} action={<Briefcase className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-2">
            {decisions.map((d, i) => (
              <Link to={d.link} key={i} className="block p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition group">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                    d.sev === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{d.sev}</span>
                  <span className="text-[10px] text-vfes-dark/55">for {d.for} · waiting {d.age}m</span>
                  <ArrowRight className="w-3 h-3 text-vfes-dark/30 group-hover:text-vfes-dark ml-auto" />
                </div>
                <div className="text-sm font-semibold">{tt(d.text)}</div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Affected Regions')}>
          <CartoMap
            height={320}
            basemap="positron"
            center={[24.7, -76.5]}
            zoom={8}
            markers={bahamasRegions.map((r) => {
              const isAffected = [...affected].some((a) => a.toLowerCase().includes(r.name.toLowerCase()))
              return {
                name: r.name,
                lat: r.lat,
                lng: r.lng,
                radius: isAffected ? 9 : 5,
                color: isAffected ? '#FF4438' : '#cbd5e1',
                pulse: isAffected,
                tooltip: isAffected ? `${tt(r.name)} — active incident` : r.name,
              }
            })}
          />
          <div className="text-xs text-vfes-dark/55 mt-2 text-center">{affected.size} region{affected.size !== 1 ? 's' : ''} affected · pulsing = active P1/P2</div>
        </Panel>

        <Panel title={tt('Comms & Reputation')}>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center justify-between p-2 rounded bg-[#fafbfc] border border-black/5">
              <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-emerald-600" />{tt('Public status page')}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{tt('Live')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#fafbfc] border border-black/5">
              <span className="flex items-center gap-2"><Twitter className="w-3.5 h-3.5 text-blue-600" />{tt('X / Twitter')}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-1 rounded">{tt('Pending draft')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#fafbfc] border border-black/5">
              <span className="flex items-center gap-2"><MessageSquareText className="w-3.5 h-3.5 text-emerald-600" />{tt('SMS to base')}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{tt('Sent · 12.4K')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#fafbfc] border border-black/5">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-emerald-600" />{tt('URCA notification')}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{tt('Filed 14:42')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#fafbfc] border border-black/5">
              <span className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5 text-vfes-dark/40" />{tt('Press statement')}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 bg-black/5 px-2 py-1 rounded">{tt('CEO approval pending')}</span>
            </div>
          </div>

          <div className="border-t border-black/5 pt-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Sentiment (last 1h · Cortex AI)')}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-red-50 rounded p-2"><div className="font-bold text-red-700">142</div><div className="text-[10px] text-vfes-dark/55">{tt('negative mentions')}</div></div>
              <div className="bg-amber-50 rounded p-2"><div className="font-bold text-amber-700">38</div><div className="text-[10px] text-vfes-dark/55">{tt('neutral')}</div></div>
              <div className="bg-emerald-50 rounded p-2"><div className="font-bold text-emerald-700">8</div><div className="text-[10px] text-vfes-dark/55">{tt('positive')}</div></div>
            </div>
            <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Press: VRT News mention 13:48 · De Standaard 14:02')}</div>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'trends' && (<>
      {/* MTTR + Incident trend + IRC + Top problems + Resolved */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title={tt('MTTR — last 7 days')} insight={{ insight: 'MTTR improved 22 minutes week-over-week to 2h 14m but remains above the 2-hour SLA threshold.', action: 'Escalate any incident exceeding the 90-minute containment checkpoint to Tier 3 vendor bridge immediately.', impact: 'Sustained reduction closes the SLA gap and reduces URCA regulatory reporting exposure.' }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-3xl font-extrabold">{tt('2h 14m')}</div>
              <div className="text-xs text-emerald-600 font-semibold">{tt('-22m vs prior 7d')}</div>
              <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('P1 target &lt; 90 min · P2 &lt; 6h · P3 &lt; 24h')}</div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span>{tt('P1 MTTR')}</span><span className="font-bold text-amber-600">{tt('1h 38m')}</span></div>
              <div className="flex justify-between"><span>{tt('P2 MTTR')}</span><span className="font-bold text-emerald-600">{tt('3h 12m')}</span></div>
              <div className="flex justify-between"><span>{tt('P3 MTTR')}</span><span className="font-bold text-emerald-600">{tt('8h 22m')}</span></div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={ircHistory}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" fill="#FF4438" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Incident Trend (last 4 weeks)')} insight={{ insight: 'Incident volume has trended upward for three of the last four weeks with an acceleration peak this week.', action: 'Open a Major Problem record targeting the network domain failures driving the rising trend.', impact: 'Root-cause elimination reduces incoming incident load and cumulative revenue burn across the portfolio.' }}>
          <div className="h-40">
            <ResponsiveContainer>
              <LineChart data={trend30d}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="P1" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626' }} />
                <Line type="monotone" dataKey="P2" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="P3" stroke="#94a3b8" strokeWidth={2} dot={{ fill: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 text-xs justify-center mt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-600" />{tt('P1')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500" />{tt('P2')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400" />{tt('P3')}</span>
          </div>
          <div className="text-xs text-vfes-dark/55 mt-2 text-center">{tt('This week tracking 35% below 90-day avg — improving')}</div>
        </Panel>

        <Panel title={tt('Open Incidents by Domain')}>
          <div className="space-y-2">
            {[
              { d: 'Network', n: 8, icon: Network, color: 'bg-vfes-red' },
              { d: 'Customer', n: 5, icon: Users, color: 'bg-amber-500' },
              { d: 'Commercial', n: 3, icon: Briefcase, color: 'bg-blue-500' },
              { d: 'Security', n: 2, icon: ShieldAlert, color: 'bg-red-700' },
              { d: 'Product', n: 1, icon: Activity, color: 'bg-slate-500' },
            ].map((x) => {
              const Icon = x.icon
              return (
                <div key={tt(x.d)} className="flex items-center gap-3 py-1.5">
                  <Icon className="w-4 h-4 text-vfes-dark/55" />
                  <span className="text-sm flex-1">{tt(x.d)}</span>
                  <div className="w-24 h-2 bg-[#f3f4f7] rounded-full overflow-hidden">
                    <div className={`h-full ${x.color}`} style={{ width: `${(x.n / 10) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold w-6 text-right">{x.n}</span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'timeline' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Events logged')} value={`${timelineEvents.length}`} delta={tt('last 45 min')} trend="flat" icon={Activity} accent />
          <KpiCard label={tt('Bridge open')} value={tt('45 min')} delta={tt('P1 · INC-2048')} trend="down" icon={Siren} />
          <KpiCard label={tt('Attendees')} value="12" delta={tt('5 teams')} trend="flat" icon={Users} />
          <KpiCard label={tt('Revenue burned')} value={`BSD ${(1840 * 45).toLocaleString()}`} delta={tt('at BSD 1,840/min')} trend="down" icon={Zap} />
        </div>
        <Panel title={tt('Incident Timeline · INC-2048 · Nassau Fibre Cut')} action={<span className="text-xs text-vfes-dark/55">{tt('Auto-refreshing')}</span>}>
          <div className="space-y-2">
            {timelineEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-black/5 pb-2">
                <div className="font-mono text-xs text-vfes-dark/55 w-12 shrink-0">{e.t}</div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${
                  e.type === 'AI' ? 'bg-blue-100 text-blue-700' :
                  e.type === 'Field' ? 'bg-amber-100 text-amber-700' :
                  e.type === 'Vendor' ? 'bg-purple-100 text-purple-700' :
                  e.type === 'Legal' ? 'bg-red-100 text-red-700' :
                  e.type === 'Exec' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                }`}>{e.type}</span>
                <div className="flex-1">
                  <span className="font-semibold text-xs text-vfes-dark/65 mr-2">{e.actor}</span>
                  <span className="text-xs">{tt(e.msg)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Revenue burn rate over time')} insight={{ insight: 'Revenue burn for INC-2048 has accelerated continuously since fault detection at a rate of BSD 1,840 per minute.', action: 'Authorize overtime vendor dispatch and bridge escalation to achieve partial restoration within 30 minutes.', impact: 'Each 10 minutes of accelerated restoration cuts total financial exposure by approximately BSD 18,400.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={revenueAtRiskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="burn" name={tt('BSD /min burn')} stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Customers impacted over time')} insight={{ insight: 'Customer impact for INC-2048 has grown without plateau since fault onset and is not yet contained.', action: 'Invoke the blast-radius containment protocol and reroute provisioning through the alternate Nassau node now.', impact: 'Halting impact growth limits churn risk and caps the volume of URCA regulatory complaints filed.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={customerImpactTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="impacted" name={tt('Customers impacted')} stroke="#222128" strokeWidth={2} dot={{ fill: '#FF4438' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'impact' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total customers impacted')} value={`${incidents.reduce((s, i) => s + i.customersImpacted, 0).toLocaleString()}`} delta={tt('across all incidents')} trend="down" icon={Users} accent />
          <KpiCard label={tt('Revenue burn rate')} value={`BSD ${totalBurnRate.toLocaleString()}/min`} delta={`BSD ${Math.round(totalBurnRate * 60).toLocaleString()}/h`} trend="down" icon={Zap} />
          <KpiCard label={tt('Active vendors engaged')} value={`${highVendorCount}`} delta={tt('with SLA clock running')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Regions affected')} value="5" delta={tt('Nassau · Freeport · Out Islands')} trend="flat" icon={MapPin} />
        </div>
        <Panel title={tt('Blast Radius by Region · INC-2048')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Customers')}</th>
                  <th className="text-right">{tt('Rev/min')}</th>
                  <th>{tt('Products affected')}</th>
                </tr>
              </thead>
              <tbody>
                {impactByRegion.map((r) => (
                  <tr key={r.region} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{r.region}</td>
                    <td className="text-right">{r.customers.toLocaleString()}</td>
                    <td className="text-right font-bold text-red-600">BSD {r.revPerMin}</td>
                    <td className="text-xs text-vfes-dark/65">{r.subs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Revenue burn · all P1/P2 incidents')} insight={{ insight: 'INC-2048 accounts for over 70% of total P1/P2 revenue burn, dwarfing every other active incident.', action: 'Redirect all available network engineering capacity from P2 tickets to INC-2048 as the sole priority now.', impact: 'Resolving INC-2048 alone eliminates the majority of combined revenue drain across the incident portfolio.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={incidents.filter((i) => i.severity !== 'P3' && i.revenuePerMin > 0)
                  .map((i) => ({ id: i.id, burn: i.revenuePerMin }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="burn" name={tt('BSD /min')} fill="#dc2626" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Customer impact by severity')} insight={{ insight: 'P1 incidents carry a disproportionate customer impact relative to their ticket count compared to P2.', action: 'Direct account managers to contact all enterprise customers under a P1 SLA breach within the next 15 minutes.', impact: 'Proactive outreach reduces formal complaint submissions and protects net promoter score during the outage.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { sev: 'P1', customers: incidents.filter((i) => i.severity === 'P1').reduce((s, i) => s + i.customersImpacted, 0) },
                  { sev: 'P2', customers: incidents.filter((i) => i.severity === 'P2').reduce((s, i) => s + i.customersImpacted, 0) },
                  { sev: 'P3', customers: incidents.filter((i) => i.severity === 'P3').reduce((s, i) => s + i.customersImpacted, 0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="sev" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="customers" name={tt('Customers')} fill="#F59E0B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'comms' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SMS sent')} value="12.4K" delta={tt('INC-2048 affected subs')} trend="up" icon={Phone} accent />
          <KpiCard label={tt('Status page views')} value="3.8K" delta={tt('last 30 min')} trend="up" icon={Activity} />
          <KpiCard label={tt('Social mentions')} value="142" delta={tt('mostly negative')} trend="down" icon={Twitter} />
          <KpiCard label={tt('Media mentions')} value="2" delta={tt('Newstalk · TVE')} trend="flat" icon={Megaphone} />
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Comms tracker')}>
              <div className="space-y-2">
                {[
                  { channel: tt('SMS · INC-2048 affected subs'), status: 'sent', detail: tt('12,400 sent at 14:09 · auto-triggered by blast-radius model') },
                  { channel: tt('Public status page'), status: 'live', detail: tt('INC-2048 · INC-2030 · INC-2027 scenario') },
                  { channel: tt('URCA notification'), status: 'done', detail: tt('Filed 14:22 · legal obligation met') },
                  { channel: tt('Press statement'), status: 'pending', detail: tt('Draft ready · awaiting CEO approval') },
                  { channel: tt('X / Twitter'), status: 'pending', detail: tt('Draft in review · Social team + Legal') },
                  { channel: tt('Internal exec brief'), status: 'done', detail: tt('Sent to CEO, COO, CFO at 14:15') },
                  { channel: tt('Wholesaler notifications'), status: 'in-progress', detail: tt('3 MVNO customers notified') },
                  { channel: tt('Retail store briefing'), status: 'in-progress', detail: tt('Retail ops script distributed') },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                    <div>
                      <div className="font-semibold text-sm">{c.channel}</div>
                      <div className="text-[10px] text-vfes-dark/55 mt-0.5">{c.detail}</div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shrink-0 ml-4 ${
                      c.status === 'sent' || c.status === 'done' || c.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel title={tt('Social sentiment (last 1h · Cortex AI)')} insight={{ insight: 'Negative social mentions outnumber positive 18-to-1 with 142 posts recorded in the last hour alone.', action: 'Release the approved X/Twitter holding statement now and set a 15-minute deadline for CEO press approval.', impact: 'A timely public response suppresses negative mention velocity before the story enters broadcast news cycles.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  { label: tt('Negative'), count: 142, fill: '#ef4444' },
                  { label: tt('Neutral'), count: 38, fill: '#f59e0b' },
                  { label: tt('Positive'), count: 8, fill: '#10b981' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name={tt('Mentions')} fill="#FF4438" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {[
                    { source: 'VRT News online', content: '"Cable Bahamas network down in Nassau..."', ts: '13:48', sent: 'neg' },
                { source: 'De Standaard', content: '"Fibre outage affects thousands..."', ts: '14:02', sent: 'neg' },
                { source: '@user_Nassau', content: '"No internet all morning, disappointing"', ts: '14:11', sent: 'neg' },
              ].map((m, i) => (
                <div key={i} className="text-[11px] p-2 rounded bg-[#fafbfc] border border-black/5">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-bold">{m.source}</span>
                    <span className="text-vfes-dark/45">{m.ts}</span>
                  </div>
                  <div className="text-vfes-dark/65 italic">{m.content}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'runbook' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Steps completed')} value={`${runbookSteps.filter((s) => s.status === 'done').length}/${runbookSteps.length}`} delta={tt('INC-2048')} trend="up" icon={BookOpen} accent />
          <KpiCard label={tt('Active step')} value="7" delta={tt('First restore')} trend="flat" icon={ChevronRight} />
          <KpiCard label={tt('Steps pending')} value={`${runbookSteps.filter((s) => s.status === 'pending').length}`} delta={tt('not yet started')} trend="flat" icon={FileText} />
          <KpiCard label={tt('Est. time to complete')} value={tt('~2h 10m')} delta={tt('all steps')} trend="flat" icon={Bell} />
        </div>
        <div className="flex gap-2 mb-4">
          {incidents.slice(0, 4).map((inc) => (
            <button key={inc.id} onClick={() => setRunbookInc(inc.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${runbookInc === inc.id ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {inc.id}
            </button>
          ))}
        </div>
        <Panel title={`${tt('Runbook')}: RUNBOOK-NET-FIBRE-CUT-001 · ${runbookInc}`}>
          <div className="space-y-2">
            {runbookSteps.map((s) => (
              <div key={s.step} className={`flex items-start gap-4 p-3 rounded-lg border ${
                s.status === 'done' ? 'bg-emerald-50 border-emerald-200' :
                s.status === 'active' ? 'bg-amber-50 border-amber-300' :
                'bg-[#fafbfc] border-black/5 opacity-60'
              }`}>
                <div className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  s.status === 'done' ? 'bg-emerald-500 text-white' :
                  s.status === 'active' ? 'bg-amber-500 text-white' :
                  'bg-black/10 text-vfes-dark/45'
                }`}>{s.step}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{tt(s.title)}</div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('Owner:')} {s.owner} · {s.notes}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shrink-0 ${
                  s.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                  s.status === 'active' ? 'bg-amber-100 text-amber-700' :
                  'bg-black/5 text-vfes-dark/45'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
        </Panel>
      </>)}

      {tab === 'dependencies' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Vendor tickets open')} value={`${vendors.length}`} delta={tt('across 7 suppliers')} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Active SLA clocks')} value={`${vendors.filter((v) => v.status === 'Active').length}`} delta={tt('requiring updates')} trend="down" icon={Zap} />
          <KpiCard label={tt('Mitigated')} value={`${vendors.filter((v) => v.status === 'Mitigated').length}`} delta={tt('under watch')} trend="up" icon={ShieldAlert} />
          <KpiCard label={tt('Monitoring')} value={`${vendors.filter((v) => v.status === 'Monitoring').length}`} delta={tt('stable')} trend="flat" icon={Activity} />
        </div>
        <div className="flex gap-2 mb-4">
          {(['all', 'Active', 'Mitigated', 'Monitoring', 'Investigating'] as const).map((f) => (
            <button key={f} onClick={() => setDepFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${depFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {f === 'all' ? tt('All') : tt(f)}
            </button>
          ))}
        </div>
        <Panel title={tt('Vendor · Third-party Dependency Tracker')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Vendor')}</th>
                  <th>{tt('Ticket')}</th>
                  <th>{tt('Sev')}</th>
                  <th>{tt('Status')}</th>
                  <th>{tt('Last update')}</th>
                  <th>{tt('SLA')}</th>
                  <th>{tt('Contact')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors().map((v) => (
                  <tr key={v.vendor} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{v.vendor}</td>
                    <td className="font-mono text-xs text-vfes-dark/65">{v.ticket}</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-700 px-2 py-0.5 rounded">{v.severity}</span></td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      v.status === 'Active' ? 'bg-red-100 text-red-700' :
                      v.status === 'Mitigated' ? 'bg-amber-100 text-amber-700' :
                      v.status === 'Monitoring' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{v.status}</span></td>
                    <td className="text-xs text-vfes-dark/55">{v.lastUpdate}</td>
                    <td className="text-xs">{v.sla}</td>
                    <td className="text-xs text-vfes-dark/65">{v.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="mt-6">
          <Panel title={tt('Vendor response time (open tickets · estimated)')} insight={{ insight: 'Several vendors have estimated SLA windows above 4 hours for active P1 tickets on the restoration critical path.', action: 'Place escalation calls to all vendors with SLA exposure above 2 hours and invoke contractual P1 breach clauses.', impact: 'Accelerating vendor response compresses the external dependency delay that is blocking INC-2048 restoration.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={vendors.map((v) => ({ vendor: v.vendor.split(' ')[0], sla: parseInt(v.sla) || 2 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="vendor" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sla" name={tt('SLA hours')} fill="#7C3AED" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'sla-mttr' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('P1 SLA compliance')} value="88%" delta={tt('+8 pp vs prior 4wk')} trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Avg P1 MTTR')} value={tt('1h 38m')} delta={tt('target: 90 min')} trend="up" icon={Activity} />
          <KpiCard label={tt('Avg P2 MTTR')} value={tt('3h 12m')} delta={tt('target: 6h')} trend="up" icon={Activity} />
          <KpiCard label={tt('SLA breaches (30d)')} value="4" delta={tt('-3 vs prior 30d')} trend="up" icon={Bell} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SLA Compliance Trend (6 weeks)')} insight={{ insight: 'SLA compliance has declined for three consecutive weeks and sits at the lowest point in the 6-week window.', action: 'Brief the URCA regulatory liaison on the downward trend and prepare a remediation commitment letter for Monday.', impact: 'Documented remediation intent reduces the risk of formal investigation and penalty proceedings by the regulator.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={slaComplianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="p1" name={tt('P1 %')} stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626' }} />
                  <Line type="monotone" dataKey="p2" name={tt('P2 %')} stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="p3" name={tt('P3 %')} stroke="#94a3b8" strokeWidth={2} dot={{ fill: '#94a3b8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('MTTR by Domain (minutes)')} insight={{ insight: 'Network domain MTTR is materially higher than all other domains, signalling a systemic resolution bottleneck.', action: 'Launch an immediate capacity and tooling review for the Network operations team to identify the resolution blockers.', impact: 'Closing the Network MTTR gap would cut overall mean resolution time by an estimated 40 minutes per incident.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={mttrByDomain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p1" name={tt('P1 MTTR (min)')} fill="#dc2626" radius={[4,4,0,0]} />
                  <Bar dataKey="p2" name={tt('P2 MTTR (min)')} fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="p3" name={tt('P3 MTTR (min)')} fill="#94a3b8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('SLA Breach Risk · Open Incidents')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Incident')}</th>
                  <th>{tt('Domain')}</th>
                  <th className="text-right">{tt('SLA (min)')}</th>
                  <th className="text-right">{tt('Remaining')}</th>
                  <th className="text-right">{tt('Progress')}</th>
                  <th>{tt('Risk')}</th>
                </tr>
              </thead>
              <tbody>
                {slaBreachRisk.map((s) => (
                  <tr key={s.inc} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{s.inc}</td>
                    <td className="text-xs text-vfes-dark/65">{s.domain}</td>
                    <td className="text-right">{s.sla}</td>
                    <td className={`text-right font-bold ${s.remaining < 30 ? 'text-red-600' : s.remaining < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.remaining}m</td>
                    <td className="text-right">
                      <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden inline-block align-middle">
                        <div className={`h-full ${s.pct > 80 ? 'bg-red-500' : s.pct > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      s.risk === 'High' ? 'bg-red-100 text-red-700' :
                      s.risk === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{s.risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {tab === 'post-mortem' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" ref={pirRef}>
          <KpiCard label={tt('PIRs open')} value={`${pirList.filter((p) => p.status !== 'Approved').length}`} delta={tt('awaiting sign-off')} trend="down" icon={FileText} accent />
          <KpiCard label={tt('Avg MTTR (PIR pool)')} value={tt('2h 36m')} delta={tt('vs 3h 05m target')} trend="up" icon={Activity} />
          <KpiCard label={tt('Findings raised')} value={`${pirList.reduce((s, p) => s + p.findings, 0)}`} delta={tt('total this week')} trend="flat" icon={Bell} />
          <KpiCard label={tt('PIRs approved')} value={`${pirList.filter((p) => p.status === 'Approved').length}`} delta={tt('this week')} trend="up" icon={CheckCircle2} />
        </div>
        <Panel title={tt('Post-Incident Reviews')} action={<span className="text-xs text-vfes-dark/55">{tt('PIR must be completed within 72h of resolution')}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Incident')}</th>
                  <th>{tt('Closed')}</th>
                  <th>{tt('MTTR')}</th>
                  <th className="text-right">{tt('Findings')}</th>
                  <th>{tt('Owner')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {pirList.map((p) => (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="py-2.5">
                      <div className="font-semibold">{tt(p.title)}</div>
                      <div className="text-[10px] text-vfes-dark/55">{p.id}</div>
                    </td>
                    <td className="text-xs text-vfes-dark/65">{p.closed}</td>
                    <td className="font-semibold">{p.mttr}</td>
                    <td className="text-right font-bold">{p.findings}</td>
                    <td className="text-xs text-vfes-dark/65">{p.owner}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      p.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'Open' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('MTTR by incident · this week')} insight={{ insight: 'At least one incident this week has a resolution time more than double the 2-hour target MTTR.', action: 'Assign a senior engineer today to review the PIR for the slowest-resolved incident and identify the delay root cause.', impact: 'Applying findings from the slowest resolutions improves the floor MTTR and strengthens PIR-to-action closure rate.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={pirList.map((p) => ({ id: p.id, mttr: parseInt(p.mttr) || 120 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} fill="#FF4438" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Findings per PIR')} insight={{ insight: 'Multiple PIRs have generated four or more findings, indicating repeated systemic failures across incident reviews.', action: 'Convene a cross-domain findings triage session this week to assign owners to the highest-frequency problem patterns.', impact: 'Addressing clustered findings reduces recurring incident probability and demonstrates operational maturity to the regulator.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={pirList.map((p) => ({ id: p.id, findings: p.findings }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="findings" name={tt('Findings')} fill="#F59E0B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'resolved' && (<>
      {/* Recently resolved + Top problems */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Recently Resolved (today)')} action={<span className="text-xs text-vfes-dark/55">{tt('PIR = post-incident review')}</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
              <tr><th className="py-2">{tt('Incident')}</th><th>{tt('Sev')}</th><th>{tt('Resolved')}</th><th>{tt('MTTR')}</th><th>{tt('PIR')}</th></tr>
            </thead>
            <tbody>
              {recentResolved.map((r) => (
                <tr key={r.id} className="border-t border-black/5">
                  <td className="py-2.5">
                    <div className="font-semibold">{tt(r.title)}</div>
                    <div className="text-[10px] text-vfes-dark/55">{r.id}</div>
                  </td>
                  <td><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColor[r.sev as Severity]}`}>{r.sev}</span></td>
                  <td className="text-vfes-dark/65">{r.resolvedAgo}</td>
                  <td className="font-semibold">{r.mttr}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      r.pir === 'open' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>{r.pir}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Top Problems (last 30 days)')} action={<TrendingUp className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-3">
            {topProblems.map((p) => (
              <div key={p.c} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-semibold text-sm">{p.c}</div>
                  <div className={`text-xs font-bold ${p.trend.startsWith('+') ? 'text-red-600' : 'text-emerald-600'}`}>{p.trend}</div>
                </div>
                <div className="text-xs text-vfes-dark/55 mt-1">{p.n} incidents · {p.region}</div>
              </div>
            ))}
            <Link to="/portal/network" className="block text-xs font-bold text-vfes-dark hover:underline">
              ITIL Problem Mgmt →
            </Link>
          </div>
        </Panel>
      </div>
      </>)}

      {/* ─── Related cockpits ─── */}
      <div className="mt-8 pt-6 border-t border-black/5">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-3">{tt('Related cockpits')}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/incidents" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Incidents')}</Link>
          <Link to="/portal/operations" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Operations')}</Link>
          <Link to="/portal/network" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Network')}</Link>
          <Link to="/portal/fraud" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Fraud')}</Link>
          <Link to="/portal/customer-360" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Customer 360')}</Link>
          <Link to="/portal/noc-map" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('NOC Map')}</Link>
          <Link to="/portal/risk" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Risk')}</Link>
          <Link to="/portal/field-ops" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Field Ops')}</Link>
          <Link to="/portal/core-5g" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Core 5G')}</Link>
          <Link to="/portal/billing-charging" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Billing & Charging')}</Link>
        </div>
      </div>
    </div>
  )
}
