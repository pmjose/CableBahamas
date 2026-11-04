// CIO — BSS / OSS landscape, integrations and end-to-end flows.
// Scale anchored to scenario.ts: 74.4K fixed accounts, 180.5K aliv lines, BSD 12M/mo billed.
import { useState } from 'react'
import tt from '../../i18n/tt'
import { Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import { Layers, Activity, AlertTriangle, CheckCircle2, Workflow, Receipt, Clock, ShieldCheck } from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ComposedChart, Line, Area,
} from 'recharts'

const NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', RED = '#EF4444', CORAL = '#FF4438', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const pill = (s: string) =>
  s === 'Healthy' || s === 'Supported' || s === 'Green' || s === 'Done'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Watch' || s === 'Amber' || s === 'Extended' || s === 'In flight'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

// ─── Application inventory ───────────────────────────────────────────────────
export const BSS_APPS = [
  { domain: 'CRM — consumer',        app: 'Amdocs CRM',                     vendor: 'Amdocs',     ver: '10.2 SP4',       latest: '12.1', hosting: 'On-prem · Oracle 19c',     eos: 'Dec 2027', sup: 'Extended',  status: 'Healthy', avail: 99.91, crit: 'Tier 1', owner: 'CX Platforms',      users: 410 },
  { domain: 'CRM — B2B / sales',     app: 'Salesforce Sales Cloud + CPQ',   vendor: 'Salesforce', ver: 'Winter ’27',     latest: 'Winter ’27', hosting: 'SaaS',                eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.98, crit: 'Tier 2', owner: 'B2B Systems',       users: 85 },
  { domain: 'Convergent billing',    app: 'Cerillion Enterprise BSS',       vendor: 'Cerillion',  ver: '19.4 (monolith)', latest: '24.2',  hosting: 'On-prem · Nassau DC',      eos: 'Jun 2028', sup: 'Supported', status: 'Watch',   avail: 99.86, crit: 'Tier 1', owner: 'Billing',           users: 120 },
  { domain: 'Product catalogue',     app: 'Cerillion Catalogue',            vendor: 'Cerillion',  ver: '19.4',           latest: '24.2',  hosting: 'On-prem · Nassau DC',      eos: 'Jun 2028', sup: 'Supported', status: 'Healthy', avail: 99.95, crit: 'Tier 1', owner: 'Billing',           users: 18 },
  { domain: 'Online charging (OCS)', app: 'Ericsson Charging System',       vendor: 'Ericsson',   ver: 'CCS 21.2',       latest: '23.4',  hosting: 'On-prem · Nassau + Freeport', eos: 'Mar 2027', sup: 'Extended', status: 'Watch', avail: 99.99, crit: 'Tier 1', owner: 'aliv Core',         users: 0 },
  { domain: 'Mediation',             app: 'Cerillion Mediation',            vendor: 'Cerillion',  ver: '19.4',           latest: '24.2',  hosting: 'On-prem · Nassau DC',      eos: 'Jun 2028', sup: 'Supported', status: 'Healthy', avail: 99.97, crit: 'Tier 1', owner: 'Billing',           users: 0 },
  { domain: 'Order orchestration',   app: 'Cerillion Order Management',     vendor: 'Cerillion',  ver: '19.4',           latest: '24.2',  hosting: 'On-prem · Nassau DC',      eos: 'Jun 2028', sup: 'Supported', status: 'Watch',   avail: 99.90, crit: 'Tier 1', owner: 'Billing',           users: 95 },
  { domain: 'DOCSIS provisioning',   app: 'Incognito BCC / DHCP',           vendor: 'Incognito',  ver: '7.3',            latest: '8.1',   hosting: 'On-prem · Nassau DC',      eos: 'Sep 2026', sup: 'Out of support', status: 'Watch', avail: 99.96, crit: 'Tier 1', owner: 'Fixed Access',  users: 0 },
  { domain: 'Workforce / field',     app: 'FieldForce WFM',                 vendor: 'FieldForce', ver: '5.8',            latest: '6.0',   hosting: 'SaaS',                     eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.93, crit: 'Tier 2', owner: 'Field Ops',         users: 160 },
  { domain: 'ITSM / CMDB / inventory', app: 'ServiceNow ITSM + CMDB',       vendor: 'ServiceNow', ver: 'Washington',     latest: 'Yokohama', hosting: 'SaaS',                  eos: 'Mar 2027', sup: 'Supported', status: 'Watch',   avail: 99.97, crit: 'Tier 2', owner: 'IT Ops',            users: 640 },
  { domain: 'Contact centre',        app: 'Genesys Cloud CX',               vendor: 'Genesys',    ver: 'Cloud (current)', latest: 'Cloud', hosting: 'SaaS',                    eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.99, crit: 'Tier 1', owner: 'CX Platforms',      users: 230 },
  { domain: 'Self-care digital',     app: 'MyREV web + aliv app',           vendor: 'In-house',   ver: '4.12 / 3.8',     latest: '—',     hosting: 'Azure (East US 2)',        eos: '—',        sup: 'Supported', status: 'Healthy', avail: 99.94, crit: 'Tier 1', owner: 'Digital',           users: 0 },
  { domain: 'Payments',              app: 'Worldpay gateway + Sand Dollar', vendor: 'Worldpay / CBOB', ver: 'API v6 / SD 2.1', latest: '—', hosting: 'SaaS',                     eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.98, crit: 'Tier 1', owner: 'Finance Systems',   users: 0 },
  { domain: 'Marketing automation',  app: 'Braze',                          vendor: 'Braze',      ver: 'Cloud',          latest: 'Cloud', hosting: 'SaaS',                     eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.99, crit: 'Tier 3', owner: 'Marketing Tech',    users: 22 },
  { domain: 'ERP / GL',              app: 'NetSuite',                       vendor: 'Oracle',     ver: '2026.2',         latest: '2026.2', hosting: 'SaaS',                    eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.97, crit: 'Tier 2', owner: 'Finance Systems',   users: 70 },
  { domain: 'HR / payroll',          app: 'Workday HCM',                    vendor: 'Workday',    ver: '2026R2',         latest: '2026R2', hosting: 'SaaS',                    eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.99, crit: 'Tier 3', owner: 'People Systems',    users: 1050 },
  { domain: 'Integration bus',       app: 'Confluent Kafka + Azure APIM',   vendor: 'Confluent / Microsoft', ver: 'CP 7.6 / APIM v2', latest: 'CP 7.9', hosting: 'Hybrid',       eos: 'Jul 2027', sup: 'Supported', status: 'Healthy', avail: 99.98, crit: 'Tier 1', owner: 'Integration',       users: 0 },
  { domain: 'Identity',              app: 'Microsoft Entra ID',             vendor: 'Microsoft',  ver: 'Cloud',          latest: 'Cloud', hosting: 'SaaS',                     eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.99, crit: 'Tier 1', owner: 'Security',          users: 1050 },
  { domain: 'Data & AI platform',    app: 'Snowflake AI Data Cloud',        vendor: 'Snowflake',  ver: 'Current',        latest: 'Current', hosting: 'SaaS (AWS)',             eos: 'Evergreen', sup: 'Supported', status: 'Healthy', avail: 99.99, crit: 'Tier 1', owner: 'Data Platform',     users: 820 },
]

// ─── Architecture diagram ────────────────────────────────────────────────────
const LAYERS: { name: string; color: string; boxes: string[] }[] = [
  { name: 'Channels',          color: '#FDE7E5', boxes: ['MyREV web', 'aliv app', 'Retail stores (14)', 'Genesys contact centre', 'B2B account mgrs', 'Dealers / top-up'] },
  { name: 'Engagement',        color: '#E0F2FE', boxes: ['Amdocs CRM', 'Salesforce B2B + CPQ', 'Braze', 'Cortex Agents (AI)'] },
  { name: 'Integration',       color: '#EDE9FE', boxes: ['Azure APIM (112 APIs)', 'Confluent Kafka (64 topics)', 'Batch SFTP (9 feeds)'] },
  { name: 'Core BSS',          color: '#FEF3C7', boxes: ['Cerillion catalogue', 'Cerillion order mgmt', 'Cerillion billing', 'Ericsson OCS', 'Cerillion mediation', 'Worldpay · Sand Dollar'] },
  { name: 'OSS & ops',         color: '#DCFCE7', boxes: ['Incognito DOCSIS', 'Ericsson / Nokia RAN EMS', 'ServiceNow CMDB', 'FieldForce WFM', 'NOC alarms'] },
  { name: 'Corporate',         color: '#F1F5F9', boxes: ['NetSuite GL', 'Workday HCM', 'Entra ID'] },
  { name: 'Data & AI',         color: '#E0E7FF', boxes: ['Snowflake (CDC + Snowpipe Streaming)', 'Semantic views', 'Cortex ML / Agents', 'Clean rooms'] },
]

function ArchitectureDiagram() {
  const W = 1100, rowH = 62, gap = 14, labelW = 110, top = 10
  const H = top + LAYERS.length * (rowH + gap)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={tt('BSS / OSS reference architecture')}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
        </marker>
      </defs>
      {LAYERS.map((L, i) => {
        const y = top + i * (rowH + gap)
        const avail = W - labelW - 20
        const bw = (avail - (L.boxes.length - 1) * 10) / L.boxes.length
        return (
          <g key={L.name}>
            <rect x={0} y={y} width={W} height={rowH} rx={10} fill={L.color} opacity={0.55} />
            <text x={12} y={y + rowH / 2 + 4} fontSize={12} fontWeight={800} fill="#0f172a">{tt(L.name)}</text>
            {L.boxes.map((b, j) => {
              const x = labelW + j * (bw + 10)
              return (
                <g key={b}>
                  <rect x={x} y={y + 10} width={bw} height={rowH - 20} rx={7} fill="#fff" stroke="#cbd5e1" />
                  <text x={x + bw / 2} y={y + rowH / 2 + 4} fontSize={11} textAnchor="middle" fill="#1e293b">{tt(b)}</text>
                </g>
              )
            })}
            {i < LAYERS.length - 1 && (
              <line x1={W / 2 + 60} y1={y + rowH} x2={W / 2 + 60} y2={y + rowH + gap} stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arr)" markerStart="url(#arr)" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Integrations ────────────────────────────────────────────────────────────
export const INTEGRATIONS = [
  { from: 'Amdocs CRM',        to: 'Cerillion order mgmt', pattern: 'REST via APIM',     vol: '3.4K/day',   p95: '420 ms', err: 0.4, status: 'Healthy' },
  { from: 'Salesforce CPQ',    to: 'Cerillion (B2B tenancy)', pattern: 'REST via APIM',  vol: '140/day',    p95: '1.9 s',  err: 2.8, status: 'Watch' },
  { from: 'Cerillion order mgmt', to: 'Incognito DOCSIS',  pattern: 'SOAP (legacy)',     vol: '1.1K/day',   p95: '3.2 s',  err: 1.6, status: 'Watch' },
  { from: 'Cerillion order mgmt', to: 'Ericsson OCS',      pattern: 'Diameter / REST',   vol: '2.6K/day',   p95: '260 ms', err: 0.2, status: 'Healthy' },
  { from: 'Cerillion order mgmt', to: 'FieldForce WFM',    pattern: 'Kafka event',       vol: '420/day',    p95: '1.1 s',  err: 0.3, status: 'Healthy' },
  { from: 'Ericsson OCS',      to: 'Cerillion mediation', pattern: 'CDR file (5 min)',   vol: '38M CDR/day', p95: '6 min', err: 0.01, status: 'Healthy' },
  { from: 'Cerillion billing', to: 'NetSuite GL',          pattern: 'Batch journal',     vol: 'daily',      p95: '22 min', err: 0.0, status: 'Healthy' },
  { from: 'Worldpay / Sand Dollar', to: 'Cerillion billing', pattern: 'Webhook + recon file', vol: '5.8K/day', p95: '1.4 s', err: 0.6, status: 'Healthy' },
  { from: 'Genesys Cloud',     to: 'Amdocs CRM',           pattern: 'CTI screen-pop',    vol: '700/day',    p95: '380 ms', err: 0.1, status: 'Healthy' },
  { from: 'NOC alarms',        to: 'ServiceNow ITSM',      pattern: 'Kafka → REST',      vol: '9.2K/day',   p95: '2.4 s',  err: 0.5, status: 'Healthy' },
  { from: 'Amdocs CRM (Oracle)', to: 'Snowflake',          pattern: 'CDC (Openflow)',    vol: '1.9M rows/day', p95: '90 s', err: 0.0, status: 'Healthy' },
  { from: 'Kafka (network)',   to: 'Snowflake',            pattern: 'Snowpipe Streaming', vol: '410M ev/day', p95: '12 s',  err: 0.0, status: 'Healthy' },
  { from: 'Snowflake',         to: 'Braze',                pattern: 'Reverse ETL',       vol: '60K/day',    p95: '15 min', err: 0.2, status: 'Healthy' },
  { from: 'Snowflake (Cortex)', to: 'Amdocs CRM',          pattern: 'Next-best-action API', vol: '1.2K/day', p95: '640 ms', err: 0.3, status: 'Healthy' },
]

const apiTrend = [
  { w: 'W36', calls: 4.6, err: 0.7 }, { w: 'W37', calls: 4.8, err: 0.6 }, { w: 'W38', calls: 5.1, err: 0.9 },
  { w: 'W39', calls: 5.0, err: 1.4 }, { w: 'W40', calls: 5.3, err: 0.8 }, { w: 'W41', calls: 5.6, err: 0.6 },
  { w: 'W42', calls: 5.4, err: 0.5 }, { w: 'W43', calls: 5.9, err: 0.6 }, { w: 'W44', calls: 6.1, err: 0.5 },
]

// ─── Flows ───────────────────────────────────────────────────────────────────
type Step = { s: string; sys: string; sla: string; actual: string; ok: boolean }
const FLOWS: Record<string, { label: string; kpi: string; steps: Step[] }> = {
  o2a: {
    label: 'Order-to-Activate (fixed)', kpi: '≈3,200 orders/mo · 91.8% right-first-time · fallout 3.6% residential / 5.4% B2B',
    steps: [
      { s: 'Capture & qualify', sys: 'MyREV / CRM', sla: '5 min',  actual: '4 min',  ok: true },
      { s: 'Credit & ID check', sys: 'CRM → bureau', sla: '1 min', actual: '40 s',   ok: true },
      { s: 'Decompose order',   sys: 'Cerillion OM', sla: '2 min', actual: '1.5 min', ok: true },
      { s: 'Schedule install',  sys: 'FieldForce',   sla: '48 h',  actual: '41 h',   ok: true },
      { s: 'Provision modem',   sys: 'Incognito',    sla: '15 min', actual: '27 min', ok: false },
      { s: 'Activate & bill',   sys: 'Cerillion billing', sla: '1 h', actual: '35 min', ok: true },
    ],
  },
  o2c: {
    label: 'Order-to-Cash', kpi: 'BSD 12.0M billed/mo · DSO 42 days · AR BSD 16.8M',
    steps: [
      { s: 'Rate usage',        sys: 'Mediation + OCS', sla: '15 min', actual: '6 min', ok: true },
      { s: 'Bill run',          sys: 'Cerillion billing', sla: '6 h',  actual: '4.6 h', ok: true },
      { s: 'Invoice & e-bill',  sys: 'Cerillion → Braze', sla: '24 h', actual: '9 h',   ok: true },
      { s: 'Collect payment',   sys: 'Worldpay · Sand Dollar · banks', sla: '30 days', actual: '42 days', ok: false },
      { s: 'Dunning',           sys: 'Cerillion collections', sla: 'D+15', actual: 'D+15', ok: true },
      { s: 'Post to GL',        sys: 'NetSuite',      sla: 'D+1',   actual: 'D+1',   ok: true },
    ],
  },
  t2r: {
    label: 'Trouble-to-Resolve', kpi: '≈21.4K contacts/mo · FCR 74% · truck-roll 11%',
    steps: [
      { s: 'Detect / contact',  sys: 'NOC · Genesys',  sla: '—',      actual: '—',      ok: true },
      { s: 'Diagnose',          sys: 'CRM + modem telemetry', sla: '6 min', actual: '7.5 min', ok: false },
      { s: 'Ticket',            sys: 'ServiceNow',     sla: '2 min',  actual: '1 min',  ok: true },
      { s: 'Dispatch',          sys: 'FieldForce',     sla: '24 h',   actual: '19 h',   ok: true },
      { s: 'Fix & close',       sys: 'Field app → ServiceNow', sla: '48 h', actual: '38 h', ok: true },
      { s: 'Credit (if SLA)',   sys: 'Cerillion billing', sla: 'next bill', actual: 'next bill', ok: true },
    ],
  },
  topup: {
    label: 'aliv prepaid top-up', kpi: '≈142K prepaid lines · 1.1M top-ups/mo · 99.99% OCS availability',
    steps: [
      { s: 'Top-up request',  sys: 'aliv app · dealers · USSD', sla: '—',    actual: '—',     ok: true },
      { s: 'Payment auth',    sys: 'Worldpay / Sand Dollar', sla: '3 s',    actual: '1.4 s', ok: true },
      { s: 'Credit balance',  sys: 'Ericsson OCS',   sla: '1 s',    actual: '0.3 s', ok: true },
      { s: 'Notify',          sys: 'SMSC',           sla: '5 s',    actual: '2 s',   ok: true },
      { s: 'Reconcile',       sys: 'Mediation → NetSuite', sla: 'D+1', actual: 'D+1', ok: true },
    ],
  },
}

const billRuns = [
  { m: 'May', hrs: 5.4, accts: 73.6, exc: 0.42 }, { m: 'Jun', hrs: 5.1, accts: 73.8, exc: 0.38 },
  { m: 'Jul', hrs: 5.0, accts: 73.9, exc: 0.35 }, { m: 'Aug', hrs: 4.9, accts: 74.0, exc: 0.31 },
  { m: 'Sep', hrs: 5.6, accts: 74.2, exc: 0.48 }, { m: 'Oct', hrs: 4.6, accts: 74.4, exc: 0.27 },
]

// ─── Roadmap ────────────────────────────────────────────────────────────────
const QUARTERS = ['Q4-26', 'Q1-27', 'Q2-27', 'Q3-27', 'Q4-27', 'Q1-28', 'Q2-28']
const ROADMAP = [
  { item: 'Cerillion B2B tenancy cutover',                start: 0, len: 2, status: 'In flight', note: 'go/no-go gate Nov 18' },
  { item: 'Incognito BCC 7.3 → 8.1 (out of support)',     start: 0, len: 1, status: 'At risk',   note: 'vendor extension to Jan 27' },
  { item: 'Ericsson CCS 21.2 → 23.4 (5G SA charging)',   start: 1, len: 2, status: 'In flight', note: 'EoS Mar 2027' },
  { item: 'ServiceNow Washington → Yokohama',             start: 1, len: 1, status: 'In flight', note: 'change-freeze window' },
  { item: 'Amdocs CRM 10.2 → retire (CRM consolidation)', start: 2, len: 4, status: 'Planned',   note: 'RFP: Salesforce vs Amdocs 12' },
  { item: 'Cerillion 19.4 → 24 microservices',            start: 3, len: 4, status: 'Planned',   note: 'H1-28 · removes monolith' },
  { item: 'TM Forum Open API exposure (TMF620/622/629)',  start: 1, len: 3, status: 'Planned',   note: 'partner & MVNO onboarding' },
]

const contracts = [
  { vendor: 'Cerillion',  scope: 'Billing / OM / mediation', annual: 'BSD 1.9M', renew: 'Jun 2027', note: 'bundle with v24 upgrade' },
  { vendor: 'Amdocs',     scope: 'Consumer CRM support',     annual: 'BSD 1.2M', renew: 'Dec 2026', note: 'extended support +18% uplift' },
  { vendor: 'Ericsson',   scope: 'OCS + core support',       annual: 'BSD 1.6M', renew: 'Mar 2027', note: 'tie to 5G SA upgrade' },
  { vendor: 'Salesforce', scope: 'Sales Cloud + CPQ (85)',   annual: 'BSD 0.4M', renew: 'Feb 2027', note: 'true-up 12 seats' },
  { vendor: 'ServiceNow', scope: 'ITSM + CMDB',              annual: 'BSD 0.5M', renew: 'Sep 2027', note: '—' },
  { vendor: 'Genesys',    scope: 'Cloud CX (230 agents)',    annual: 'BSD 0.7M', renew: 'Apr 2027', note: 'add AI summarisation' },
  { vendor: 'Snowflake',  scope: 'Data & AI platform',       annual: 'BSD 1.1M', renew: 'Jan 2027', note: 'capacity commit' },
]

const debt = [
  { area: 'Cerillion OM', score: 72 }, { area: 'Incognito', score: 81 }, { area: 'Amdocs CRM', score: 68 },
  { area: 'Ericsson OCS', score: 55 }, { area: 'SOAP adapters', score: 64 }, { area: 'MyREV', score: 28 },
  { area: 'Salesforce', score: 18 }, { area: 'Snowflake', score: 9 },
]

// ═══════════════════════════════════════════════════════════════════════════
export function BssLandscapeTab() {
  const [filter, setFilter] = useState<'all' | 'Tier 1' | 'risk'>('all')
  const apps = BSS_APPS.filter(a => filter === 'all' ? true : filter === 'Tier 1' ? a.crit === 'Tier 1' : a.status !== 'Healthy' || a.sup !== 'Supported')
  const healthy = BSS_APPS.filter(a => a.status === 'Healthy').length
  const behind = BSS_APPS.filter(a => a.latest !== '—' && a.latest !== a.ver && !['Cloud', 'Current'].includes(a.ver)).length
  return (<>
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KpiCard label={tt('BSS/OSS applications')} value={String(BSS_APPS.length)} delta={`${healthy} ${tt('healthy')} · ${BSS_APPS.length - healthy} ${tt('watch')}`} trend="flat" icon={Layers} accent />
      <KpiCard label={tt('Tier-1 availability (90d)')} value="99.93%" delta={tt('target 99.9%')} trend="up" icon={Activity} />
      <KpiCard label={tt('Versions behind latest')} value={String(behind)} delta={tt('2 on extended support')} trend="down" icon={Clock} />
      <KpiCard label={tt('Out of vendor support')} value="1" delta={tt('Incognito BCC 7.3')} trend="down" icon={AlertTriangle} />
      <KpiCard label={tt('BSS run-cost / yr')} value="BSD 7.4M" delta={tt('≈ BSD 2.40 per sub / mo')} trend="flat" icon={Receipt} />
    </div>

    <Panel title={tt('BSS / OSS reference architecture — Cable Bahamas group (REV + aliv)')}>
      <ArchitectureDiagram />
      <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Primary DC Nassau (Perpall Tract) · DR Freeport · SaaS tier in Azure East US 2 / AWS us-east-1 · all integration through APIM + Kafka, no new point-to-point.')}</div>
    </Panel>

    <div className="mt-6">
      <Panel title={tt('Application inventory — versions, support & status')}>
        <div className="flex gap-1 mb-3">
          {(['all', 'Tier 1', 'risk'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${filter === f ? 'bg-vfes-dark text-white' : 'bg-black/5 text-vfes-dark/70'}`}>
              {f === 'all' ? tt('All') : f === 'risk' ? tt('Lifecycle risk') : tt('Tier 1 only')}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">
              {['Domain', 'Application', 'Version', 'Latest', 'Hosting', 'End of support', 'Support', 'Avail. 90d', 'Tier', 'Owner', 'Status'].map(h => <th key={h} className="py-2 pr-3 font-bold">{tt(h)}</th>)}
            </tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.app + a.domain} className="border-b border-black/5">
                  <td className="py-2 pr-3 text-vfes-dark/70">{tt(a.domain)}</td>
                  <td className="py-2 pr-3 font-bold">{a.app}</td>
                  <td className="py-2 pr-3 font-mono">{a.ver}</td>
                  <td className="py-2 pr-3 font-mono text-vfes-dark/55">{a.latest}</td>
                  <td className="py-2 pr-3">{tt(a.hosting)}</td>
                  <td className="py-2 pr-3">{a.eos}</td>
                  <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(a.sup)}`}>{tt(a.sup)}</span></td>
                  <td className="py-2 pr-3 font-mono">{a.avail.toFixed(2)}%</td>
                  <td className="py-2 pr-3">{a.crit}</td>
                  <td className="py-2 pr-3 text-vfes-dark/70">{tt(a.owner)}</td>
                  <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(a.status)}`}>{tt(a.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>

    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Panel title={tt('Technical-debt score by system (0 = clean, 100 = critical)')} insight={{ insight: 'Debt is concentrated in the provisioning and order chain — Incognito and Cerillion OM — exactly where order fallout originates.', action: 'Sequence the Incognito upgrade before the Cerillion 24 programme so provisioning is stable when order management is replatformed.', impact: 'Fixing provisioning first is expected to cut residential order fallout from 3.6% to under 2.5%.' }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={debt} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={100} />
            <Tooltip contentStyle={TS} />
            <Bar dataKey="score" name={tt('Debt score')} fill={CORAL} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={tt('Hosting mix & run-cost')}>
        <div className="space-y-3 text-xs">
          {[
            { k: 'On-prem (Nassau DC, DR Freeport)', v: 8, cost: 'BSD 4.6M', pct: 62 },
            { k: 'SaaS', v: 10, cost: 'BSD 2.2M', pct: 30 },
            { k: 'Public cloud (Azure / AWS)', v: 1, cost: 'BSD 0.6M', pct: 8 },
          ].map(r => (
            <div key={r.k}>
              <div className="flex justify-between mb-1"><span className="font-bold">{tt(r.k)} · {r.v} {tt('apps')}</span><span>{r.cost} · {r.pct}%</span></div>
              <div className="h-2 bg-black/5 rounded"><div className="h-2 rounded" style={{ width: `${r.pct}%`, background: NAVY }} /></div>
            </div>
          ))}
          <div className="pt-2 text-vfes-dark/60">{tt('On-prem Tier-1 stack carries hurricane risk: DR failover to Freeport last tested Jun 2026 (RTO 3h 40m vs 4h target, RPO 9 min).')}</div>
        </div>
      </Panel>
    </div>
  </>)
}

export function IntegrationsTab() {
  return (<>
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KpiCard label={tt('Managed APIs')} value="112" delta={tt('Azure APIM · 6.1M calls/wk')} trend="up" icon={Workflow} accent />
      <KpiCard label={tt('Kafka topics')} value="64" delta={tt('410M events/day')} trend="up" icon={Activity} />
      <KpiCard label={tt('Interface error rate')} value="0.5%" delta={tt('target < 1%')} trend="up" icon={CheckCircle2} />
      <KpiCard label={tt('Point-to-point remaining')} value="11" delta={tt('from 38 in 2024')} trend="up" icon={Layers} />
      <KpiCard label={tt('TMF Open API coverage')} value="4 / 12" delta={tt('TMF620 · 622 · 629 · 641')} trend="flat" icon={ShieldCheck} />
    </div>
    <Panel title={tt('Integration matrix — key interfaces')}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">
            {['Source', 'Target', 'Pattern', 'Volume', 'p95 latency', 'Error %', 'Status'].map(h => <th key={h} className="py-2 pr-3 font-bold">{tt(h)}</th>)}
          </tr></thead>
          <tbody>
            {INTEGRATIONS.map(i => (
              <tr key={i.from + i.to} className="border-b border-black/5">
                <td className="py-2 pr-3 font-bold">{i.from}</td>
                <td className="py-2 pr-3">→ {i.to}</td>
                <td className="py-2 pr-3 text-vfes-dark/70">{tt(i.pattern)}</td>
                <td className="py-2 pr-3 font-mono">{i.vol}</td>
                <td className="py-2 pr-3 font-mono">{i.p95}</td>
                <td className={`py-2 pr-3 font-mono ${i.err >= 1 ? 'text-red-600 font-bold' : ''}`}>{i.err.toFixed(2)}</td>
                <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(i.status)}`}>{tt(i.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Panel title={tt('API gateway — weekly calls (M) & error rate (%)')} insight={{ insight: 'W39 error spike traces to the Cerillion B2B tenancy rehearsal — the SOAP provisioning adapter timed out under parallel load.', action: 'Wrap the Incognito SOAP adapter behind an async Kafka queue with retries before the Nov 18 cutover.', impact: 'Removes the main source of B2B order fallout (5.4%) during migration.' }}>
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={apiTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="w" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area yAxisId="l" dataKey="calls" name={tt('Calls (M)')} fill="#dbeafe" stroke={NAVY} />
            <Line yAxisId="r" dataKey="err" name={tt('Error %')} stroke={RED} strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={tt('Integration principles & guardrails')}>
        <ul className="text-xs space-y-2">
          {[
            ['Green', 'All new integrations via APIM or Kafka — no new point-to-point since Jan 2025'],
            ['Green', 'CDC into Snowflake for every system of record (Amdocs, Cerillion, NetSuite, ServiceNow)'],
            ['Amber', '3 SOAP adapters remain (Incognito, legacy dealer portal, bank lockbox)'],
            ['Amber', 'TMF Open APIs: 4 of 12 target APIs exposed — needed for MVNO/partner onboarding'],
            ['Green', 'PII tokenised at the gateway; Data Protection Act consent flags travel with every event'],
            ['Red',   'Bank lockbox file (RBC / CIBC Caribbean) still manual SFTP — no automated reconciliation alerting'],
          ].map(([r, t]) => (
            <li key={t} className="flex gap-2"><span className={`px-1.5 py-0.5 h-fit rounded text-[10px] font-bold ${pill(r)}`}>{tt(r)}</span><span>{tt(t)}</span></li>
          ))}
        </ul>
      </Panel>
    </div>
  </>)
}

export function FlowsRoadmapTab() {
  const [flow, setFlow] = useState<keyof typeof FLOWS>('o2a')
  const f = FLOWS[flow]
  return (<>
    <Panel title={tt('End-to-end process flows — systems, SLAs & actuals')}>
      <div className="flex flex-wrap gap-1 mb-4">
        {(Object.keys(FLOWS) as (keyof typeof FLOWS)[]).map(k => (
          <button key={k} onClick={() => setFlow(k)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${flow === k ? 'bg-vfes-dark text-white' : 'bg-black/5 text-vfes-dark/70'}`}>{tt(FLOWS[k].label)}</button>
        ))}
      </div>
      <div className="text-xs text-vfes-dark/70 mb-3">{tt(f.kpi)}</div>
      <div className="flex flex-wrap items-stretch gap-2">
        {f.steps.map((s, i) => (
          <div key={s.s} className="flex items-center gap-2">
            <div className={`rounded-lg border p-3 w-40 ${s.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="text-[10px] font-bold text-vfes-dark/50">{tt('Step')} {i + 1}</div>
              <div className="text-xs font-bold">{tt(s.s)}</div>
              <div className="text-[11px] text-vfes-dark/60 mb-1">{tt(s.sys)}</div>
              <div className="text-[11px]">{tt('SLA')} <b>{s.sla}</b> · {tt('actual')} <b className={s.ok ? 'text-emerald-700' : 'text-amber-700'}>{s.actual}</b></div>
            </div>
            {i < f.steps.length - 1 && <span className="text-vfes-dark/40">→</span>}
          </div>
        ))}
      </div>
    </Panel>

    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Panel title={tt('Monthly bill run — duration (h) & exceptions (%)')} insight={{ insight: 'September’s run overran to 5.6h with 0.48% exceptions — post-Hurricane rebate credits were applied manually.', action: 'Productise disaster-credit as a catalogue rule in Cerillion so rebates run inside the bill cycle.', impact: 'Keeps bill run under 5h and avoids ~350 manual adjustments after every storm.' }}>
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={billRuns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="hrs" name={tt('Duration (h)')} fill={NAVY} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" dataKey="exc" name={tt('Exceptions %')} stroke={AMBER} strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="text-[11px] text-vfes-dark/55">{tt('Fixed accounts billed: 74.4K in October · aliv postpaid billed on 4 cycles.')}</div>
      </Panel>
      <Panel title={tt('Vendor contracts & renewals')}>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">
            {['Vendor', 'Scope', 'Annual', 'Renewal', 'Lever'].map(h => <th key={h} className="py-1.5 pr-2 font-bold">{tt(h)}</th>)}
          </tr></thead>
          <tbody>{contracts.map(c => (
            <tr key={c.vendor} className="border-b border-black/5">
              <td className="py-1.5 pr-2 font-bold">{c.vendor}</td><td className="py-1.5 pr-2">{tt(c.scope)}</td>
              <td className="py-1.5 pr-2 font-mono">{c.annual}</td><td className="py-1.5 pr-2">{c.renew}</td>
              <td className="py-1.5 pr-2 text-vfes-dark/60">{tt(c.note)}</td>
            </tr>))}
          </tbody>
        </table></div>
      </Panel>
    </div>

    <div className="mt-6">
      <Panel title={tt('BSS modernisation roadmap')}>
        <div className="grid text-[11px]" style={{ gridTemplateColumns: `280px repeat(${QUARTERS.length}, 1fr)` }}>
          <div />
          {QUARTERS.map(q => <div key={q} className="font-bold text-vfes-dark/55 text-center pb-2">{q}</div>)}
          {ROADMAP.map(r => (
            <div key={r.item} className="contents">
              <div className="py-1.5 pr-2 font-bold">{tt(r.item)}</div>
              {QUARTERS.map((q, i) => {
                const on = i >= r.start && i < r.start + r.len
                const color = r.status === 'At risk' ? RED : r.status === 'In flight' ? AMBER : SLATE
                return <div key={q} className="py-1.5 px-0.5">{on && <div className="h-4 rounded" style={{ background: color }} title={tt(r.note)} />}</div>
              })}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-vfes-dark/60">
          <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: AMBER }} />{tt('In flight')}</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: RED }} />{tt('At risk')}</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: SLATE }} />{tt('Planned')}</span>
          <span className="ml-auto" style={{ color: GREEN }}>{tt('Programme capex FY27: BSD 3.8M of BSD 24M group capex')}</span>
        </div>
      </Panel>
    </div>
  </>)
}
