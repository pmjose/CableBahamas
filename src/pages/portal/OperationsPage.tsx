import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3493)
import { useMemo, useState } from 'react'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import { MOBILE_INCIDENTS, UPTIME_BY_LANE } from './_mobile_data'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Activity, Ticket, Clock, Wrench, AlertTriangle, Bell, Sparkles, Zap,
  Globe, Wifi, Phone, ShieldCheck, MapPin, Server, Send, GitBranch,
  TrendingUp, Truck, Package, Leaf, Calendar, Brain, Award, Users,
  CheckCircle2, Siren, ArrowUpRight, Smartphone, Radio,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, ScatterChart, Scatter, RadialBarChart, RadialBar,
} from 'recharts'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const headline = {
  uptime: 99.94,
  affectedNow: 4820,
  cim: 142,             // customer impacting minutes today
  openTickets: 1284,
  ticketDelta: -6.2,
  mttr: '3h 42m',
  mttrDelta: -24,
  techsActive: 186,
  ftfRate: 84,
  truckRolls: 412,
  p99Latency: 24,
  speedCompliance: 96.4,
}

const incidents = [
  { id: 'INC-2048', region: 'Nassau North',  type: 'Fibre cut',         severity: 'P1', status: 'Active',        eta: '2h 10m', hh: 1840, lat: 25.0443, lng: -77.3504 },
  { id: 'INC-2029', region: 'Freeport City',     type: 'Power · headend',    severity: 'P2', status: 'Mitigated',     eta: '45m',    hh: 920,  lat: 26.5333, lng: -78.7 },
  { id: 'INC-2027', region: 'Abaco',         type: 'CMTS degradation',  severity: 'P3', status: 'Investigating', eta: '4h',     hh: 410,  lat: 26.5412, lng: -77.0636 },
  { id: 'INC-2025', region: 'Eleuthera',         type: 'DNS',               severity: 'P2', status: 'Resolved',      eta: '—',      hh: 0,    lat: 25.1962, lng: -76.2431 },
  { id: 'INC-2022', region: 'Exuma',        type: 'Wi-Fi pods · firmware', severity: 'P4', status: 'Monitoring', eta: '12h',    hh: 240,  lat: 23.5, lng: -75.7667 },
  { id: 'INC-2018', region: 'Long Island',          type: 'OLT · GPON port',   severity: 'P3', status: 'Investigating', eta: '6h',     hh: 320,  lat: 23.25, lng: -75.1 },
  { id: 'INC-2015', region: 'Bimini',       type: 'BGP peering · Rival ISP A', severity: 'P2', status: 'Mitigated',    eta: '30m',    hh: 410,  lat: 25.727, lng: -79.2972 },
]

const sevColor: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-amber-100 text-amber-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-blue-100 text-blue-700',
}
const sevColorHex: Record<string, string> = {
  P1: '#ef4444', P2: '#f59e0b', P3: '#eab308', P4: '#3b82f6',
}
const statusColor = (s: string) => s === 'Active' || s === 'Investigating' ? 'bg-red-50 text-red-700' : s === 'Mitigated' || s === 'Monitoring' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

const ticketTrend = Array.from({ length: 30 }, (_, i) => ({
  d: `${i + 1}`,
  count: 80 + Math.round(Math.sin(i / 3) * 18 + scenarioRandom() * 22),
  resolved: 78 + Math.round(Math.sin(i / 3) * 16 + scenarioRandom() * 18),
}))

const regions = [
  { r: 'Nassau',      lat: 25.0443, lng: -77.3504, health: 99.2, util: 78, p99: 22, spcomp: 96.4, hh: 184_000 },
  { r: 'Freeport',        lat: 26.5333, lng: -78.7, health: 98.7, util: 82, p99: 28, spcomp: 95.2, hh: 84_000 },
  { r: 'Abaco',       lat: 26.5412, lng: -77.0636, health: 97.4, util: 88, p99: 36, spcomp: 92.1, hh: 48_000 },
  { r: 'Eleuthera',       lat: 25.1962, lng: -76.2431, health: 99.0, util: 71, p99: 21, spcomp: 96.8, hh: 42_000 },
  { r: 'Exuma',      lat: 23.5, lng: -75.7667, health: 99.6, util: 64, p99: 19, spcomp: 97.1, hh: 32_000 },
  { r: 'Bimini',     lat: 25.727, lng: -79.2972, health: 98.1, util: 76, p99: 26, spcomp: 94.6, hh: 18_000 },
  { r: 'Andros',     lat: 24.7064, lng: -77.7902, health: 99.4, util: 62, p99: 20, spcomp: 96.7, hh: 16_000 },
  { r: 'San Salvador', lat: 24.036, lng: -74.494, health: 96.8, util: 84, p99: 38, spcomp: 91.4, hh: 14_000 },
  { r: 'Long Island',        lat: 23.25, lng: -75.1, health: 99.1, util: 73, p99: 22, spcomp: 96.0, hh: 38_000 },
  { r: 'Inagua',         lat: 20.95, lng: -73.6731, health: 98.4, util: 79, p99: 25, spcomp: 95.1, hh: 12_000 },
  { r: 'Cat Island',         lat: 24.315, lng: -75.453, health: 98.9, util: 68, p99: 23, spcomp: 95.8, hh: 11_000 },
  { r: 'Rum Cay',         lat: 23.685, lng: -74.868, health: 98.6, util: 71, p99: 24, spcomp: 95.4, hh: 9_000 },
]

// Performance — by access type
const accessKpis = {
  HFC:  { hh: 380_000, p50: 8,  p99: 28, jitter: 4.2, loss: 0.04, util: 76, throughput: 92, sla: 96.4 },
  FTTH: { hh: 142_000, p50: 4,  p99: 14, jitter: 1.8, loss: 0.01, util: 58, throughput: 99, sla: 99.2 },
  Mobile: { hh: 98_000, p50: 18, p99: 64, jitter: 12.4, loss: 0.18, util: 82, throughput: 84, sla: 92.1 },
}

const latencyTrend = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  hfc: 22 + Math.sin(i / 4) * 6 + scenarioRandom() * 3,
  ftth: 14 + Math.sin(i / 4) * 2 + scenarioRandom() * 1.5,
  mobile: 60 + Math.sin(i / 4) * 14 + scenarioRandom() * 8,
}))

const speedTiers = [
  { tier: '250 Mb',  sold: 248, delivered: 244, compliance: 98.4 },
  { tier: '500 Mb',  sold: 492, delivered: 478, compliance: 97.2 },
  { tier: '1 Gb',    sold: 980, delivered: 920, compliance: 93.9 },
  { tier: '2 Gb',    sold: 1900, delivered: 1740, compliance: 91.6 },
  { tier: '5 Gb β',  sold: 4800, delivered: 4280, compliance: 89.2 },
]

// Capacity
const capacityForecast = [
  { wk: 'W1',  util: 78, hot: 4 },
  { wk: 'W2',  util: 79, hot: 4 },
  { wk: 'W3',  util: 81, hot: 5 },
  { wk: 'W4',  util: 82, hot: 6 },
  { wk: 'W5',  util: 84, hot: 7 },
  { wk: 'W6',  util: 86, hot: 8 },
  { wk: 'W7',  util: 88, hot: 10 },
  { wk: 'W8',  util: 91, hot: 12 },
  { wk: 'W9',  util: 93, hot: 14 },
  { wk: 'W10', util: 95, hot: 18 },
  { wk: 'W11', util: 96, hot: 22 },
  { wk: 'W12', util: 98, hot: 28 },
]

const capacityHotspots = [
  { region: 'Abaco · CMTS-04',          util: 92, daysLeft: 28,  fix: 'Node split',      status: 'Scheduled' },
  { region: 'San Salvador · OLT-Wex-01', util: 88, daysLeft: 42,  fix: 'OLT expansion',   status: 'Approved' },
  { region: 'Freeport · CMTS-12',       util: 86, daysLeft: 56,  fix: 'Channel bonding',     status: 'Planning' },
  { region: 'Nassau North · CMTS-22', util: 84, daysLeft: 71, fix: 'Node augment',        status: 'Planning' },
  { region: 'Bimini · OLT-Sli-02',   util: 81, daysLeft: 88,  fix: 'OLT shelf',            status: 'Forecast' },
  { region: 'Inagua · CMTS-08',   util: 79, daysLeft: 102, fix: 'Channel bonding',     status: 'Forecast' },
]

// Reliability
const mttrBySeverity = [
  { sev: 'P1', mttr: 1.2, mttd: 0.4, mttv: 0.8, target: 1.0 },
  { sev: 'P2', mttr: 3.7, mttd: 1.4, mttv: 2.3, target: 4.0 },
  { sev: 'P3', mttr: 6.2, mttd: 3.1, mttv: 3.1, target: 8.0 },
  { sev: 'P4', mttr: 18.4, mttd: 6.8, mttv: 11.6, target: 24.0 },
]

const recurringFaults = [
  { id: 'CHRN-014', region: 'Abaco · Assebroek',        type: 'CMTS upstream noise', occurrences: 8, lastDays: 14, root: 'Loose connector at amp', fix: 'Hardline replacement scheduled' },
  { id: 'CHRN-022', region: 'Freeport · East',         type: 'WiFi pod drop',         occurrences: 6, lastDays: 21, root: 'Channel interference 5GHz',   fix: 'Firmware 2.4.18 staged' },
  { id: 'CHRN-018', region: 'Nassau · Merksem',          type: 'Speed degradation',    occurrences: 5, lastDays: 18, root: 'Node oversubscription',        fix: 'Node split W22' },
  { id: 'CHRN-024', region: 'San Salvador · town centre', type: 'Periodic outage',      occurrences: 4, lastDays: 12, root: 'Power flap (utility)',          fix: 'UPS upgrade requested' },
]

const rootCausePareto = [
  { c: 'Fibre cut · third-party',  n: 28 },
  { c: 'Power · utility',           n: 22 },
  { c: 'CMTS / OLT software',       n: 18 },
  { c: 'Customer kit (Hub/pods)',   n: 14 },
  { c: 'BGP / peering',              n: 8 },
  { c: 'DNS',                       n: 6 },
  { c: 'Change-induced',            n: 4 },
]

// Field
const techJobs = [
  { region: 'Nassau',     queued: 86, dispatched: 142, slaRisk: 12, ftf: 88 },
  { region: 'Freeport',       queued: 48, dispatched: 78,  slaRisk: 6,  ftf: 84 },
  { region: 'Abaco',     queued: 32, dispatched: 56,  slaRisk: 4,  ftf: 81 },
  { region: 'Eleuthera',   queued: 24, dispatched: 42,  slaRisk: 3,  ftf: 86 },
  { region: 'Exuma',  queued: 18, dispatched: 32,  slaRisk: 2,  ftf: 82 },
  { region: 'Bimini',      queued: 14, dispatched: 22,  slaRisk: 2,  ftf: 79 },
  { region: 'Long Island', queued: 22, dispatched: 36,  slaRisk: 3,  ftf: 84 },
]

const techLeague = [
  { name: 'Luc De Vos',     region: 'Nassau',    jobs: 42, ftf: 96, repeat: 2, hours: 38 },
  { name: 'Sofie Willems',  region: 'Freeport',      jobs: 38, ftf: 94, repeat: 3, hours: 36 },
  { name: 'Ruben Knowles',   region: 'Abaco',    jobs: 36, ftf: 91, repeat: 4, hours: 38 },
  { name: 'Anke Knowles',     region: 'Eleuthera',  jobs: 34, ftf: 92, repeat: 3, hours: 36 },
  { name: 'Kobe Bain',   region: 'Long Island',   jobs: 32, ftf: 89, repeat: 4, hours: 36 },
  { name: 'Rosa O\'Neill',region: 'Exuma', jobs: 28, ftf: 88, repeat: 4, hours: 34 },
  { name: 'Pieter Smet',    region: 'Bimini',     jobs: 26, ftf: 85, repeat: 5, hours: 34 },
]

const truckRollCost = [
  { wk: 'W1', count: 412, cost: 86, avoided: 124 },
  { wk: 'W2', count: 398, cost: 82, avoided: 138 },
  { wk: 'W3', count: 384, cost: 79, avoided: 152 },
  { wk: 'W4', count: 372, cost: 76, avoided: 162 },
  { wk: 'W5', count: 364, cost: 74, avoided: 174 },
  { wk: 'W6', count: 352, cost: 72, avoided: 188 },
]

const partsInventory = [
  { sku: 'Wi-Fi 6 Pro',          stock: 1840, reorder: 600, lead: 14, status: 'OK' },
  { sku: 'WiFi Pods Tri',   stock: 2410, reorder: 800, lead: 21, status: 'OK' },
  { sku: 'GPON ONT',        stock: 480,  reorder: 600, lead: 28, status: 'Low' },
  { sku: 'DOCSIS 3.1 modem', stock: 920, reorder: 400, lead: 18, status: 'OK' },
  { sku: 'Fibre splice kit', stock: 142, reorder: 200, lead: 7,  status: 'Low' },
  { sku: 'Coax F-connectors', stock: 38_400, reorder: 8000, lead: 4, status: 'OK' },
]

// Vendor
const vendorScorecard = [
  { v: 'Ciena (DWDM)',  sla: 99.2, breach: 1, p1: 2, mttr: '2h 10m' },
  { v: 'Cisco (CMTS)',          sla: 99.6, breach: 0, p1: 0, mttr: '3h 24m' },
  { v: 'Nokia (OLT/ONT)',       sla: 99.4, breach: 1, p1: 1, mttr: '4h 12m' },
  { v: 'Adtran (FTTH)',         sla: 99.5, breach: 0, p1: 0, mttr: '3h 48m' },
  { v: 'NTT (Backbone)',        sla: 99.9, breach: 0, p1: 1, mttr: '1h 18m' },
  { v: 'CommScope (Hub/Pods)',  sla: 98.8, breach: 2, p1: 0, mttr: '6h 20m' },
]

// Energy / sustainability
const energyKpis = {
  kwhPerGb: 0.018,
  kwhDelta: -8,        // % vs LY
  pue: 1.42,
  netZeroProgress: 38,  // %
  diesel: 14,           // hours this month
}

const energyTrend = [
  { m: 'Jan', kwh: 1.84 },
  { m: 'Feb', kwh: 1.78 },
  { m: 'Mar', kwh: 1.74 },
  { m: 'Apr', kwh: 1.69 },
  { m: 'May', kwh: 1.64 },
  { m: 'Jun', kwh: 1.62 },
  { m: 'Jul', kwh: 1.58 },
  { m: 'Aug', kwh: 1.54 },
]

// Compliance
const compliance = [
  { metric: 'URCA outage reports filed',  value: 2,    delta: '0 breaches', good: true,  suffix: '' },
  { metric: '112 service availability', value: 100,  delta: 'illustrative',    good: true,  suffix: '%' },
  { metric: 'URCA cyber controls passing',         value: 96,   delta: '4 minor open', good: true,  suffix: '%' },
  { metric: 'DPA breaches in incidents',    value: 0,    delta: 'this Q',      good: true,  suffix: '' },
  { metric: 'SLA credits owed (BSD )',          value: 18.2, delta: '-BSD 4.2K vs LM', good: true,  suffix: 'K' },
]

// AI Ops
const aiAnomalies = [
  { sev: 'High',   when: '14:00', what: 'Freeport CMTS-12 upstream SNR ↓ 4 dB · pre-failure pattern',   action: 'Pre-emptive truck roll · BSD 4K ·  saves est. 920 HHs from outage' },
  { sev: 'High',   when: '13:20', what: 'Nassau North fibre splice loss creeping +0.3 dB / 6 mo',   action: 'Schedule splice replacement · 1 day work' },
  { sev: 'Medium', when: '11:45', what: 'WiFi pod firmware 2.4.16 → drop rate +18% in Freeport',         action: 'Stage 2.4.18 to 2.4K HHs · already passed canary' },
  { sev: 'Medium', when: '08:30', what: 'Abaco OLT shelf temp creeping (+3 °C in 14 d)',           action: 'HVAC inspection · prevent thermal shutdown' },
  { sev: 'Low',    when: 'Yest',  what: 'Wi-Fi 6 Pro reboot loop pattern in 184 HHs · firmware bug',     action: 'Push targeted fix · zero truck roll' },
]

const predictiveFailures = [
  { equip: 'CMTS-12 (Freeport)',     prob: 84, etafail: '7 d',  impact: '920 HHs',  action: 'Pre-emptive replace' },
  { equip: 'OLT-Wex-01 (San Salvador)', prob: 78, etafail: '12 d', impact: '320 HHs',  action: 'Card swap' },
  { equip: 'Headend UPS · Freeport',  prob: 71, etafail: '18 d', impact: '4,800 HHs', action: 'Battery replacement' },
  { equip: 'CMTS-22 (Nassau N)',  prob: 64, etafail: '24 d', impact: '1,840 HHs', action: 'Node split' },
  { equip: 'OLT-Sli-02 (Bimini)',  prob: 58, etafail: '32 d', impact: '410 HHs',  action: 'Firmware upgrade' },
]

const cortexPrompts = [
  { q: 'What is the most repeat-fault home in Freeport right now?',                 sql: 'SELECT * FROM HOME_FAULT_HISTORY WHERE region = \'freeport\' ORDER BY repeat_count DESC LIMIT 10' },
  { q: 'Forecast Abaco capacity exhaustion at current growth',                  sql: 'SELECT * FROM CAPACITY_FORECAST WHERE region = \'abaco\'' },
  { q: 'Why is p99 latency up in Nassau North?',                                  sql: 'CALL diagnose_latency(region=>\'NASSAU_N\', metric=>\'P99\')' },
  { q: 'Which incidents this month had a customer-impacting time > 1 hour?',     sql: 'SELECT * FROM INCIDENTS WHERE cim_minutes > 60 AND month = CURRENT_MONTH' },
  { q: 'Show me the runbook for fibre cut · Nassau',                              sql: 'SELECT * FROM CORTEX_SEARCH(\'runbooks\', \'fibre cut Nassau\')' },
  { q: 'Top 5 chronic problem clusters by churn risk',                            sql: 'SELECT * FROM CHRONIC_CLUSTERS ORDER BY churn_risk_score DESC LIMIT 5' },
]

const vendorSlaTrend = [
  { m: 'Jan', voo: 99.0, cisco: 99.4, nokia: 99.1, nttz: 99.8 },
  { m: 'Feb', voo: 99.2, cisco: 99.5, nokia: 99.2, nttz: 99.9 },
  { m: 'Mar', voo: 98.8, cisco: 99.3, nokia: 99.0, nttz: 99.8 },
  { m: 'Apr', voo: 99.1, cisco: 99.6, nokia: 99.4, nttz: 99.9 },
  { m: 'May', voo: 99.3, cisco: 99.6, nokia: 99.3, nttz: 99.9 },
  { m: 'Jun', voo: 99.2, cisco: 99.5, nokia: 99.4, nttz: 99.9 },
  { m: 'Jul', voo: 99.4, cisco: 99.7, nokia: 99.5, nttz: 100  },
  { m: 'Aug', voo: 99.2, cisco: 99.6, nokia: 99.4, nttz: 99.9 },
]

// ───────── tabs ─────────
type TabId = 'live' | 'perf' | 'capacity' | 'field' | 'reliab' | 'ai' | 'energy' | 'vendor'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'live',     label: 'Live',                  icon: Siren },
  { id: 'perf',     label: 'Performance',           icon: Activity },
  { id: 'capacity', label: 'Capacity',              icon: TrendingUp },
  { id: 'field',    label: 'Field & Truck Rolls',   icon: Truck },
  { id: 'reliab',   label: 'Reliability & Quality', icon: ShieldCheck },
  { id: 'ai',       label: 'AI Ops',                icon: Brain },
  { id: 'energy',   label: 'Energy & Sustainability', icon: Leaf },
  { id: 'vendor',   label: 'Vendor SLAs',            icon: ShieldCheck },
]

const partsStatusColor = (s: string) => s === 'OK' ? 'bg-emerald-100 text-emerald-700' : s === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const sevColorMap = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const stPill = (s: string) => s === 'Approved' || s === 'Scheduled' ? 'bg-emerald-100 text-emerald-700' : s === 'Planning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'

const ACCESS_KEYS = ['All', 'HFC', 'FTTH', 'Mobile'] as const
type AccessFilter = typeof ACCESS_KEYS[number]

export default function OperationsPage() {
  const [tab, setTab] = useState<TabId>('live')
  const [access, setAccess] = useState<AccessFilter>('All')
  const [healthMetric, setHealthMetric] = useState<'health' | 'util' | 'p99' | 'spcomp'>('health')

  const incidentMarkers: MapMarker[] = useMemo(() => incidents
    .filter(i => i.status !== 'Resolved')
    .map((i) => ({
      name: i.id,
      lat: i.lat,
      lng: i.lng,
      radius: 8 + Math.log10(Math.max(i.hh, 10)) * 4,
      color: sevColorHex[i.severity],
      pulse: i.severity === 'P1' || i.severity === 'P2',
      tooltip: `${i.severity} · ${i.region} · ${i.type} · ${i.hh.toLocaleString()} HHs · ETA ${i.eta}`,
    })), [])

  const regionMarkers: MapMarker[] = useMemo(() => regions.map((r) => {
    let value: number, color: string, label: string
    if (healthMetric === 'health') {
      value = r.health
      color = r.health >= 99 ? '#10b981' : r.health >= 98 ? '#f59e0b' : '#ef4444'
      label = `${r.r} · ${r.health}% uptime`
    } else if (healthMetric === 'util') {
      value = r.util
      color = r.util < 75 ? '#10b981' : r.util < 85 ? '#f59e0b' : '#ef4444'
      label = `${r.r} · util ${r.util}%`
    } else if (healthMetric === 'p99') {
      value = r.p99
      color = r.p99 < 25 ? '#10b981' : r.p99 < 32 ? '#f59e0b' : '#ef4444'
      label = `${r.r} · p99 ${r.p99} ms`
    } else {
      value = r.spcomp
      color = r.spcomp >= 96 ? '#10b981' : r.spcomp >= 93 ? '#f59e0b' : '#ef4444'
      label = `${r.r} · speed comp ${r.spcomp}%`
    }
    return {
      name: r.r,
      lat: r.lat,
      lng: r.lng,
      radius: 8 + Math.log10(r.hh) * 2.4,
      color,
      tooltip: label,
    }
  }), [healthMetric])

  const techMarkers: MapMarker[] = useMemo(() => techJobs.map((t) => {
    const reg = regions.find(r => r.r === t.region) || regions[0]
    return {
      name: t.region,
      lat: reg.lat,
      lng: reg.lng,
      radius: 8 + Math.log10(t.dispatched) * 4,
      color: t.slaRisk > 8 ? '#ef4444' : t.slaRisk > 4 ? '#f59e0b' : '#10b981',
      tooltip: `${t.region} · ${t.dispatched} dispatched · ${t.queued} queued · ${t.slaRisk} SLA-risk`,
    }
  }), [])

  const accessFiltered = useMemo(() => {
    if (access === 'All') return Object.values(accessKpis).reduce(
      (a, c) => ({ hh: a.hh + c.hh, p50: a.p50 + c.p50, p99: a.p99 + c.p99, jitter: a.jitter + c.jitter, loss: a.loss + c.loss, util: a.util + c.util, throughput: a.throughput + c.throughput, sla: a.sla + c.sla }),
      { hh: 0, p50: 0, p99: 0, jitter: 0, loss: 0, util: 0, throughput: 0, sla: 0 }
    )
    return accessKpis[access as keyof typeof accessKpis]
  }, [access])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Operations')}
        subtitle={tt('Network · incidents · field ops · reliability · AI Ops')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems · refresh 30 s
            </span>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <a href="#/portal/assurance" className="flex items-center gap-2 text-xs font-bold text-vfes-dark bg-vfes-red/5 border border-vfes-red/20 rounded-lg px-3 py-2 w-fit hover:bg-vfes-red/10">
            {tt('Full alarm → ticket → field → resolution thread → open Service Assurance')} →
          </a>
        </div>
      </div>
      <AgentDecision
        title="Field dispatch agent"
        label="Run Dispatch Optimiser" runningLabel="Optimising…"
        steps={[
          'Scored incident density & SLA-risk by cluster',
          'Modelled MTTR impact of crew pre-positioning',
          'Checked backfill cover for thinned regions',
          'Produced the crew-move recommendation',
        ]}
        hint="The agent scores incident density and SLA-risk by cluster and recommends where to position crews."
        result={{
          headline: 'Shift two crews to the Freeport cluster for the next 6 hours',
          stats: [
            { label: 'Projected MTTR', value: '-9 min' },
            { label: 'Credit exposure avoided', value: 'BSD 31K' },
            { label: 'Active P1/P2', value: '3' },
          ],
          findings: [
            'Incident density and SLA-risk are concentrated in Freeport.',
            'Pre-positioning crews cuts MTTR on the next likely P1 and protects B2B SLAs.',
          ],
          note: 'This thins Abaco cover — backfill with a sub-contractor for the window.',
        }}
        impact="-9 min projected MTTR · BSD 31K credit exposure avoided"
        risk="thins Abaco cover — backfill with sub-contractor"
        linkTo="#/portal/field-ops" linkLabel="Open Field Operations"
      />

      {/* live alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-900 text-sm">{tt('P1 OPEN · Nassau North fibre cut · INC-2048')}</div>
            <div className="text-xs text-red-800 mt-1">
              <span className="font-bold">{tt('1,840 HHs')}</span> impacted · ETA 2h 10m · auto-comms sent (SMS + status page) ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('CIM 142 min')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('Save desk pre-warmed')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('Bridge: ops-major-1')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-red-900 hover:underline shrink-0">{tt('Open bridge →')}</button>
        </div>
      </div>

      {/* tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {/* ═══════ LIVE ═══════ */}
      {tab === 'live' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Network uptime')}     value={`${headline.uptime}%`}                  delta="SLA met"          trend="up"   icon={Activity} accent />
          <KpiCard label={tt('Customers affected')} value={headline.affectedNow.toLocaleString()}   delta="3 active P1/P2"   trend="down" icon={Users} />
          <KpiCard label={tt('CIM today')}          value={`${headline.cim} min`}                  delta="URCA threshold 60min"   trend="down" icon={Clock} />
          <KpiCard label={tt('Open tickets')}       value={headline.openTickets.toLocaleString()}    delta={`${headline.ticketDelta}% WoW`} trend="up"   icon={Ticket} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTR')}               value={headline.mttr}                          delta={`${headline.mttrDelta}m vs LW`} trend="up" icon={Zap} />
          <KpiCard label={tt('Field techs active')} value={`${headline.techsActive}`}              delta="+12"             trend="up"   icon={Wrench} />
          <KpiCard label={tt('First-time fix')}     value={`${headline.ftfRate}%`}                 delta="+2 pp QoQ"        trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Speed compliance')}   value={`${headline.speedCompliance}%`}         delta="vs sold tier"     trend="up"   icon={Award} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Live Incident Map · Carto')}>
              <CartoMap markers={incidentMarkers} basemap="voyager" height={420} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('P1')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{tt('P2')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />{tt('P3')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{tt('P4')}</span>
                <span className="ml-auto">{tt('Bubble size = HHs impacted · pulsing = active P1/P2')}</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Live Incidents')}>
            <div className="space-y-2">
              {incidents.map((i) => (
                <div key={i.id} className="border border-black/5 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${sevColor[i.severity]}`}>{i.severity}</span>
                    <span className="font-mono text-[10px] text-vfes-dark/55">{i.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(i.status)} ml-auto`}>{tt(i.status)}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{tt('FIXED')}</span>
                  </div>
                  <div className="font-semibold text-sm">{tt(i.type)}</div>
                  <div className="flex items-center justify-between text-[10px] text-vfes-dark/60 mt-0.5">
                    <span>{i.region} · {i.hh.toLocaleString()} HHs</span>
                    <span>ETA {i.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Mobile incidents — RAN, drop-call, VoLTE/VoNR */}
        <Panel title={tt('Mobile Incidents · RAN · Voice')} action={<span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('MOBILE')}</span>}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOBILE_INCIDENTS.map((i) => (
              <div key={i.id} className="border border-black/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${i.severity === 'P1' ? 'bg-red-50 text-red-700' : i.severity === 'P2' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'}`}>{i.severity}</span>
                  <span className="font-mono text-[10px] text-vfes-dark/55">{i.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700 ml-auto">{tt(i.status)}</span>
                </div>
                <div className="font-semibold text-sm flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-vfes-dark" />{tt(i.type)}</div>
                <div className="flex items-center justify-between text-[10px] text-vfes-dark/60 mt-1">
                  <span className="font-mono">{i.cell} · {i.region}</span>
                  <span>{i.affectedSubs.toLocaleString('en-BS')} {tt('subs')} · {i.startedMin}m {tt('ago')}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Ticket Volume vs Resolution · last 30 days')}>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={ticketTrend}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="count" name={tt('Created')} stroke={RED} fill={RED} fillOpacity={0.25} />
                <Line type="monotone" dataKey="resolved" name={tt('Resolved')} stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ═══════ PERFORMANCE ═══════ */}
      {tab === 'perf' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('p99 latency')}      value={`${'p99' in accessFiltered ? accessFiltered.p99 : 0} ms`} delta={access}    trend="flat" icon={Zap} accent />
          <KpiCard label={tt('Jitter')}           value={`${'jitter' in accessFiltered ? accessFiltered.jitter.toFixed(1) : 0} ms`}    delta="target ≤5ms" trend="up"   icon={Activity} />
          <KpiCard label={tt('Packet loss')}      value={`${'loss' in accessFiltered ? accessFiltered.loss.toFixed(2) : 0}%`}          delta="target ≤0.1%" trend="up"   icon={Wifi} />
          <KpiCard label={tt('Speed compliance')} value={`${'sla' in accessFiltered ? accessFiltered.sla.toFixed(1) : 0}%`}            delta="vs sold tier"  trend="up"   icon={Award} />
        </div>

        {/* Service-uptime split by lane: Fixed / Mobile / Wholesale */}
        <Panel title={tt('Service Uptime by Lane · Fixed · Mobile · Wholesale')}>
          <div className="grid md:grid-cols-5 gap-3">
            {UPTIME_BY_LANE.map((l) => (
              <div key={l.lane} className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1 flex items-center gap-1.5">
                  {l.lane.startsWith('Mobile') ? <Smartphone className="w-3 h-3 text-vfes-dark" /> : <Wifi className="w-3 h-3 text-blue-500" />}
                  {tt(l.lane)}
                </div>
                <div className="text-2xl font-extrabold">{l.actual}%</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('SLO')} {l.slo}% · {tt('MTTR')} {l.mttr}m</div>
                <div className="mt-2 h-1.5 rounded bg-black/5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(l.actual / 100) * 100}%`, background: l.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title={tt('Latency · 24-hour Trend')}
          action={
            <div className="flex gap-1">
              {ACCESS_KEYS.map((a) => (
                <button key={a} onClick={() => setAccess(a)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${access === a ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>{a}</button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={latencyTrend}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {(access === 'All' || access === 'HFC')    && <Line type="monotone" dataKey="hfc"    name={tt('HFC')}    stroke={RED}    strokeWidth={2} dot={false} />}
                {(access === 'All' || access === 'FTTH')   && <Line type="monotone" dataKey="ftth"   name={tt('FTTH')}   stroke="#10b981" strokeWidth={2} dot={false} />}
                {(access === 'All' || access === 'Mobile') && <Line type="monotone" dataKey="mobile" name={tt('Mobile')} stroke={RED4}   strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="lg:col-span-2">
            <Panel
              title={tt('Network Health Map · Carto')}
              action={
                <div className="flex gap-1">
                  {([['health', 'Uptime'], ['util', 'Util'], ['p99', 'p99'], ['spcomp', 'Speed Compl.']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setHealthMetric(k)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${healthMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>{l}</button>
                  ))}
                </div>
              }
            >
              <CartoMap markers={regionMarkers} basemap="positron" height={380} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{tt('Healthy')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{tt('Watch')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('At-risk')}</span>
                <span className="ml-auto">Bubble size = HH count · metric: <span className="font-bold text-vfes-dark">{healthMetric}</span></span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Speed Tier Compliance')}>
            <div className="space-y-3">
              {speedTiers.map((t) => (
                <div key={t.tier} className="text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{t.tier}</div>
                    <div className={`font-bold ${t.compliance >= 96 ? 'text-emerald-600' : t.compliance >= 92 ? 'text-amber-600' : 'text-red-600'}`}>{t.compliance}%</div>
                  </div>
                  <div className="text-[10px] text-vfes-dark/55 mb-1">delivered {t.delivered} / sold {t.sold} Mbps</div>
                  <div className="h-1.5 bg-black/5 rounded">
                    <div className={`h-full rounded ${t.compliance >= 96 ? 'bg-emerald-500' : t.compliance >= 92 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${t.compliance}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Performance · By Access Type')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Access')}</th>
                  <th className="text-right">{tt('HHs')}</th>
                  <th className="text-right">{tt('p50 latency')}</th>
                  <th className="text-right">{tt('p99 latency')}</th>
                  <th className="text-right">{tt('Jitter')}</th>
                  <th className="text-right">{tt('Loss')}</th>
                  <th className="text-right">{tt('Throughput vs sold')}</th>
                  <th className="text-right">{tt('SLA met')}</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(accessKpis) as [string, typeof accessKpis.HFC][]).map(([k, v]) => (
                  <tr key={k} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{k}</td>
                    <td className="text-right">{v.hh.toLocaleString()}</td>
                    <td className="text-right">{v.p50} ms</td>
                    <td className={`text-right font-bold ${v.p99 <= 25 ? 'text-emerald-600' : v.p99 <= 40 ? 'text-amber-600' : 'text-red-600'}`}>{v.p99} ms</td>
                    <td className="text-right">{v.jitter.toFixed(1)} ms</td>
                    <td className="text-right">{v.loss}%</td>
                    <td className="text-right">{v.throughput}%</td>
                    <td className="text-right font-bold">{v.sla}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ CAPACITY ═══════ */}
      {tab === 'capacity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg utilisation')}  value="78%" delta="+3 pp QoQ"        trend="down" icon={Activity} accent />
          <KpiCard label={tt('Hotspots')}          value="6"   delta="3 critical"      trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Days to exhaustion (worst)')} value="28 d" delta="Abaco · CMTS-04" trend="down" icon={Clock} />
          <KpiCard label={tt('Augmentations queued')} value="4" delta="2 approved"     trend="up"   icon={GitBranch} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Capacity Forecast · 12 wk')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={capacityForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area yAxisId="l" type="monotone" dataKey="util" name={tt('Avg utilisation %')} stroke={RED} fill={RED} fillOpacity={0.25} />
                    <Bar yAxisId="r" dataKey="hot" name={tt('Hotspot count')} fill={RED4} />
                    <ReferenceLine yAxisId="l" y={85} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Watch', fontSize: 10 }} />
                    <ReferenceLine yAxisId="l" y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Hotspot Map')}>
            <CartoMap markers={regionMarkers} basemap="positron" height={300} center={[24.7, -76.5]} zoom={6} />
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Color = utilisation tier · San Salvador & Abaco hottest')}</div>
          </Panel>
        </div>

        <Panel title={tt('Augmentation Queue')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Hotspot')}</th>
                  <th className="text-right">{tt('Util')}</th>
                  <th className="text-right">{tt('Days left')}</th>
                  <th>{tt('Recommended fix')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {capacityHotspots.map((h) => (
                  <tr key={h.region} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{h.region}</td>
                    <td className={`text-right font-bold ${h.util >= 90 ? 'text-red-600' : h.util >= 85 ? 'text-amber-600' : 'text-vfes-dark/80'}`}>{h.util}%</td>
                    <td className={`text-right text-xs ${h.daysLeft < 30 ? 'text-red-600 font-bold' : ''}`}>{h.daysLeft} d</td>
                    <td className="text-xs">{h.fix}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stPill(h.status)}`}>{tt(h.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ FIELD & TRUCK ROLLS ═══════ */}
      {tab === 'field' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Techs active')}        value={`${headline.techsActive}`}              delta="+12"            trend="up"   icon={Wrench} accent />
          <KpiCard label={tt('Truck rolls today')}   value={`${headline.truckRolls}`}              delta="-12% vs LW"     trend="up"   icon={Truck} />
          <KpiCard label={tt('First-time fix')}      value={`${headline.ftfRate}%`}                 delta="+2 pp QoQ"      trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Truck rolls avoided')} value="188" delta="via Cortex auto-diag"        trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Field Dispatch Map · Carto')}>
              <CartoMap markers={techMarkers} basemap="voyager" height={360} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{tt('Healthy')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{tt('SLA-watch')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('SLA-risk')}</span>
                <span className="ml-auto">{tt('Bubble size = jobs dispatched')}</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Region Dispatch')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr><th className="py-2">{tt('Region')}</th><th className="text-right">Q</th><th className="text-right">{tt('Disp')}</th><th className="text-right">{tt('SLA risk')}</th><th className="text-right">{tt('FTF')}</th></tr>
                </thead>
                <tbody>
                  {techJobs.map((t) => (
                    <tr key={t.region} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{t.region}</td>
                      <td className="text-right">{t.queued}</td>
                      <td className="text-right font-bold">{t.dispatched}</td>
                      <td className={`text-right ${t.slaRisk > 8 ? 'text-red-600 font-bold' : t.slaRisk > 4 ? 'text-amber-600' : ''}`}>{t.slaRisk}</td>
                      <td className="text-right">{t.ftf}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Tech League · This Week')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="py-2">{tt('Tech')}</th>
                      <th>{tt('Region')}</th>
                      <th className="text-right">{tt('Jobs')}</th>
                      <th className="text-right">{tt('FTF')}</th>
                      <th className="text-right">{tt('Repeat-call')}</th>
                      <th className="text-right">{tt('Hours')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techLeague.map((t, i) => (
                      <tr key={tt(t.name)} className="border-t border-black/5">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-black ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-black/5 text-vfes-dark/60'}`}>{i + 1}</div>
                            <span className="font-semibold">{tt(t.name)}</span>
                          </div>
                        </td>
                        <td className="text-xs text-vfes-dark/65">{t.region}</td>
                        <td className="text-right font-bold">{t.jobs}</td>
                        <td className={`text-right font-bold ${t.ftf >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{t.ftf}%</td>
                        <td className={`text-right ${t.repeat > 4 ? 'text-amber-600 font-bold' : ''}`}>{t.repeat}</td>
                        <td className="text-right text-xs">{t.hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Truck Rolls · Cost & Savings')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={truckRollCost}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="count" name={tt('Rolls')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="avoided" name={tt('Avoided (Cortex)')} stroke="#10b981" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Spare Parts Inventory')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('SKU')}</th>
                  <th className="text-right">{tt('Stock')}</th>
                  <th className="text-right">{tt('Reorder pt')}</th>
                  <th className="text-right">{tt('Lead time')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {partsInventory.map((p) => (
                  <tr key={p.sku} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{p.sku}</td>
                    <td className="text-right">{p.stock.toLocaleString()}</td>
                    <td className="text-right text-xs text-vfes-dark/65">{p.reorder.toLocaleString()}</td>
                    <td className="text-right text-xs">{p.lead} d</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${partsStatusColor(p.status)}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ RELIABILITY & QUALITY ═══════ */}
      {tab === 'reliab' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTR overall')}      value={headline.mttr}    delta="-24m vs LW"     trend="up"   icon={Zap} accent />
          <KpiCard label={tt('MTBF overall')}      value="412 h"            delta="+24h vs LM"      trend="up"   icon={Activity} />
          <KpiCard label={tt('Chronic faults')}     value="4 clusters"       delta="2 fix-scheduled" trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('SLA credits owed')}   value="BSD 18.2K"           delta="-BSD 4.2K vs LM"   trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MTTR · MTTD · MTTV by Severity')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={mttrBySeverity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="sev" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="h" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mttd" name={tt('Detect')} stackId="a" fill={RED4} />
                  <Bar dataKey="mttv" name={tt('Resolve')} stackId="a" fill={RED} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={DARK} strokeDasharray="4 4" dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Root Cause Pareto · This Month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={rootCausePareto} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="c" tick={{ fontSize: 10 }} width={170} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="n" fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Chronic / Recurring Faults')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('Occurrences')}</th>
                  <th className="text-right">{tt('Last (d)')}</th>
                  <th>{tt('Root cause')}</th>
                  <th>{tt('Fix plan')}</th>
                </tr>
              </thead>
              <tbody>
                {recurringFaults.map((f) => (
                  <tr key={f.id} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-[10px] text-vfes-dark/65">{f.id}</td>
                    <td className="text-xs">{f.region}</td>
                    <td className="text-xs font-semibold">{f.type}</td>
                    <td className="text-right font-bold text-vfes-dark">{f.occurrences}</td>
                    <td className="text-right text-xs">{f.lastDays}</td>
                    <td className="text-xs text-vfes-dark/65">{f.root}</td>
                    <td className="text-xs">{f.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mb-6 mt-6">
          <Panel title={tt('Vendor Scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Vendor')}</th>
                    <th className="text-right">{tt('SLA')}</th>
                    <th className="text-right">{tt('Breach')}</th>
                    <th className="text-right">{tt('P1 incidents')}</th>
                    <th className="text-right">{tt('MTTR')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorScorecard.map((v) => (
                    <tr key={v.v} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{v.v}</td>
                      <td className={`text-right font-bold ${v.sla >= 99.5 ? 'text-emerald-600' : 'text-amber-600'}`}>{v.sla}%</td>
                      <td className={`text-right ${v.breach > 0 ? 'text-amber-600' : ''}`}>{v.breach}</td>
                      <td className="text-right">{v.p1}</td>
                      <td className="text-right text-xs">{v.mttr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Compliance & Regulatory')}>
            <div className="space-y-2">
              {compliance.map((c) => (
                <div key={c.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${c.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold">{c.metric}</div>
                  <div className="font-bold">{c.value}{c.suffix}</div>
                  <div className={`text-xs ${c.good ? 'text-emerald-600' : 'text-amber-600'}`}>{c.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Energy & Sustainability · Net Zero progress')}>
          <div className="grid md:grid-cols-4 gap-4 mb-3">
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('kWh / Gb delivered')}</div>
              <div className="text-2xl font-extrabold mt-1">{energyKpis.kwhPerGb}</div>
              <div className="text-xs text-emerald-600 mt-1">{energyKpis.kwhDelta}% vs LY</div>
            </div>
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Headend PUE')}</div>
              <div className="text-2xl font-extrabold mt-1">{energyKpis.pue}</div>
              <div className="text-xs text-vfes-dark/55 mt-1">{tt('target ≤1.4')}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Net-zero progress')}</div>
              <div className="text-2xl font-extrabold mt-1 text-vfes-dark">{energyKpis.netZeroProgress}%</div>
              <div className="text-xs text-vfes-dark/55 mt-1">{tt('on track 2030')}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Diesel run-time')}</div>
              <div className="text-2xl font-extrabold mt-1">{energyKpis.diesel}h</div>
              <div className="text-xs text-vfes-dark/55 mt-1">{tt('this month')}</div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={energyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="kwh" name={tt('MWh / day · headend')} stroke={RED} fill={RED} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ═══════ AI OPS ═══════ */}
      {tab === 'ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live anomalies')}          value={`${aiAnomalies.length}`}     delta={`${aiAnomalies.filter(a=>a.sev==='High').length} high-sev`} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Predictive failures (7-30d)')} value={`${predictiveFailures.length}`} delta="prevention queued" trend="up" icon={Sparkles} />
          <KpiCard label={tt('Auto-classified incidents')}   value="92%"   delta="root-cause LLM"  trend="up"   icon={Brain} />
          <KpiCard label={tt('Truck rolls avoided · YTD')}   value="2,140" delta="BSD 428K saved"      trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Anomaly Queue · Cortex AI')}>
            <div className="space-y-2">
              {aiAnomalies.map((a, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColorMap(a.sev)} shrink-0`}>{a.sev}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-xs">{a.what}</div>
                      <div className="text-[10px] text-vfes-dark/55 mt-0.5">{a.when} · <span className="text-vfes-dark font-bold">{tt(a.action)}</span></div>
                    </div>
                    <button className="text-[10px] font-bold text-vfes-dark bg-vfes-red px-2 py-1 rounded hover:bg-vfes-red-dark shrink-0">{tt('Act')}</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Predictive Failure · Equipment')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Equipment')}</th>
                    <th className="text-right">{tt('Prob')}</th>
                    <th className="text-right">{tt('ETA fail')}</th>
                    <th className="text-right">{tt('Impact')}</th>
                    <th>{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {predictiveFailures.map((p) => (
                    <tr key={p.equip} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{p.equip}</td>
                      <td className={`text-right font-bold ${p.prob >= 75 ? 'text-red-600' : p.prob >= 60 ? 'text-amber-600' : 'text-vfes-dark/80'}`}>{p.prob}%</td>
                      <td className="text-right text-xs">{p.etafail}</td>
                      <td className="text-right text-xs">{p.impact}</td>
                      <td className="text-xs text-vfes-dark font-semibold">{tt(p.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · NetOps Prompts')}>
              <div className="space-y-2">
                {cortexPrompts.map((p, i) => (
                  <div key={i} className="border border-black/5 rounded-lg p-3 hover:bg-black/[0.02] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.q}</div>
                        <code className="text-[10px] text-vfes-dark/55 font-mono mt-1 block">{p.sql}</code>
                      </div>
                      <Send className="w-3.5 h-3.5 text-vfes-dark/30 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('NETWORK_360')}</span>{tt('· Cortex Search: runbooks + past incidents')}</div>
            </Panel>
          </div>
          <Panel title={tt('Model Card · Predictive Net Ops')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Model')}</span><span className="font-mono text-xs">{tt('NETOPS_PRED_V4_2')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Last refresh')}</span><span className="font-bold">{tt('02:00 UTC')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('AUC · failure')}</span><span className="font-bold text-emerald-600">0.92</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Lead time avg')}</span><span className="font-bold">{tt('14 d')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('FP rate')}</span><span className="font-bold">4.2%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('NetOps Analytics')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Governance')}</span><span className="font-bold text-emerald-600">{tt('Approved')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Snowflake ML Registry · Cortex Agent enabled · Event Table linked')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ ENERGY & SUSTAINABILITY ═══════ */}
      {tab === 'energy' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('kWh / Gb delivered')}   value={`${energyKpis.kwhPerGb}`}         delta={`${energyKpis.kwhDelta}% vs LY`} trend="up"   icon={Leaf} accent />
          <KpiCard label={tt('Headend PUE')}           value={`${energyKpis.pue}`}              delta={tt('target ≤1.4')}               trend="flat" icon={Zap} />
          <KpiCard label={tt('Net-zero progress')}     value={`${energyKpis.netZeroProgress}%`} delta={tt('on track 2030')}             trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Diesel run-time')}       value={`${energyKpis.diesel}h`}          delta={tt('this month')}                trend="flat" icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Energy Consumption · MWh / day Trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={energyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="kwh" name={tt('MWh / day')} stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Compliance & Regulatory')}>
            <div className="space-y-2">
              {compliance.map((c) => (
                <div key={c.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${c.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold">{c.metric}</div>
                  <div className="font-bold">{c.value}{c.suffix}</div>
                  <div className={`text-xs ${c.good ? 'text-emerald-600' : 'text-amber-600'}`}>{c.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Site Energy Breakdown · By Region')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('MWh / mo')}</th>
                  <th className="text-right">{tt('Renewables %')}</th>
                  <th className="text-right">{tt('PUE')}</th>
                  <th className="text-right">{tt('CO₂ t / mo')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {regions.slice(0, 8).map((r, i) => {
                  const mwh = Math.round(r.hh / 1000 * 0.012 * 1000) / 1000
                  const renew = 30 + i * 4
                  const pue = (1.38 + i * 0.01).toFixed(2)
                  const co2 = (mwh * (1 - renew / 100) * 0.233).toFixed(1)
                  const ok = renew >= 42
                  return (
                    <tr key={r.r} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{r.r}</td>
                      <td className="text-right">{mwh}</td>
                      <td className={`text-right font-bold ${renew >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>{renew}%</td>
                      <td className={`text-right ${Number(pue) > 1.44 ? 'text-amber-600' : ''}`}>{pue}</td>
                      <td className="text-right text-xs">{co2}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ok ? tt('On track') : tt('Review')}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <MlInsightSection
            heading={tt('Energy & sustainability intelligence')}
            models={[
              { name: tt('PUE Forecaster'),        metric: 'MAPE 3.8%',        sub: tt('cooling optimisation') },
              { name: tt('Renewable Scheduler'),   metric: '−14% kWh',         sub: tt('load-aware off-peak') },
              { name: tt('Carbon Accounting'),     metric: tt('Scope 2 live'), sub: tt('Snowflake ESG pipeline') },
            ]}
            agentLabel={tt('Run Energy Optimiser')}
            agentRunningLabel={tt('Optimising…')}
            agentSteps={[
              tt('Pulled 30-day headend load profiles'),
              tt('Scheduled sleep-windows vs SLA floor'),
              tt('Mapped renewable availability per region'),
              tt('Estimated CO₂ saving vs SBTi 1.5°C path'),
            ]}
            agentBlurb={tt('Combining network telemetry with energy metering in Snowflake lets the model trade off SLA against kWh at site granularity.')}
            decision={{
              title: tt('Shift 3 headend sites to 100% renewables — saves BSD 420K / yr'),
              detail: tt('Nassau, Freeport and Abaco qualify by load profile. No SLA risk at modelled switch windows.'),
              impact: tt('BSD 420K / yr saving · −1 800 tCO₂e · SBTi 1.5°C on track'),
              risk: tt('Renewable contracts require a 12-month commitment'),
              linkTo: '/portal/cto',
              linkLabel: tt('Open CTO dashboard →'),
            }}
            chart={{
              kind: 'area' as const,
              title: tt('Energy consumption trend'),
              data: energyTrend,
              xKey: 'm',
              series: [
                { key: 'kwh', name: tt('MWh / day'), color: '#10B981' },
              ],
              note: tt('kWh down 8% YoY · renewables mix up 14 pp'),
            }}
            registryNote={tt('ENERGY_OPT_V2 · Snowflake ML Registry · SBTi-aligned')}
          />
        </div>
      </>)}

      {/* ═══════ VENDOR SLAS ═══════ */}
      {tab === 'vendor' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg vendor SLA attainment')} value="99.3%"  delta="+0.1 pp QoQ"  trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('SLA breaches · QTD')}        value="4"      delta="-2 vs LQ"     trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('P1 incidents · vendors')}    value="4"      delta="-1 vs LQ"     trend="up"   icon={Zap} />
          <KpiCard label={tt('Credits claimed · QTD')}     value="BSD 18.2K" delta="-BSD 4.2K vs LQ" trend="up"   icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Vendor SLA Attainment Trend · 8 mo')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={vendorSlaTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[97, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="voo" name={tt('Rival ISP C')}  stroke={RED}      strokeWidth={2} dot />
                  <Line type="monotone" dataKey="cisco" name={tt('Cisco')}  stroke="#10b981" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="nokia" name={tt('Nokia')}  stroke="#f59e0b" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="nttz"  name={tt('NTT')}    stroke="#7c3aed" strokeWidth={2} dot />
                  <ReferenceLine y={99.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'SLO', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Vendor Scorecard · QTD')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Vendor')}</th>
                    <th className="text-right">{tt('SLA')}</th>
                    <th className="text-right">{tt('Breach')}</th>
                    <th className="text-right">{tt('P1 inc.')}</th>
                    <th className="text-right">{tt('MTTR')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorScorecard.map((v) => (
                    <tr key={v.v} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{v.v}</td>
                      <td className={`text-right font-bold ${v.sla >= 99.5 ? 'text-emerald-600' : v.sla >= 99 ? 'text-amber-600' : 'text-red-600'}`}>{v.sla}%</td>
                      <td className={`text-right ${v.breach > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>{v.breach}</td>
                      <td className="text-right">{v.p1}</td>
                      <td className="text-right text-xs">{v.mttr}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${v.sla >= 99.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{v.sla >= 99.5 ? tt('Green') : tt('Watch')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('SLA Penalty Tracker · Open Credit Claims')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Vendor')}</th>
                  <th>{tt('Incident')}</th>
                  <th className="text-right">{tt('Duration')}</th>
                  <th className="text-right">{tt('HHs')}</th>
                  <th className="text-right">{tt('Credit (BSD )')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { v: 'Nokia (OLT/ONT)',  inc: 'INC-2018 · OLT GPON',   dur: '6h 12m',  hh: 320, credit: 4800, status: 'Submitted' },
                  { v: 'CommScope (Hub)', inc: 'INC-2022 · Wi-Fi pods', dur: '12h 00m', hh: 240, credit: 7200, status: 'Approved' },
                  { v: 'Cisco (CMTS)',    inc: 'INC-1998 · CMTS sw',    dur: '2h 48m',  hh: 920, credit: 6200, status: 'Under review' },
                ].map((p) => (
                  <tr key={p.inc} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{p.v}</td>
                    <td className="text-xs font-mono text-vfes-dark/65">{p.inc}</td>
                    <td className="text-right text-xs">{p.dur}</td>
                    <td className="text-right">{p.hh.toLocaleString()}</td>
                    <td className="text-right font-bold text-vfes-dark">BSD {p.credit.toLocaleString()}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ RELATED COCKPITS ═══════ */}
      <div className="mt-10 pt-6 border-t border-black/5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/40 mb-3">{tt('Related cockpits')}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/network"           className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Network')}</Link>
          <Link to="/portal/mobile-ran"        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Mobile RAN')}</Link>
          <Link to="/portal/core-5g"           className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Core 5G')}</Link>
          <Link to="/portal/noc-map"           className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('NOC Map')}</Link>
          <Link to="/portal/assurance"         className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Assurance')}</Link>
          <Link to="/portal/incidents"         className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Incidents')}</Link>
          <Link to="/portal/field-ops"         className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Field Ops')}</Link>
          <Link to="/portal/capacity-capex"    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Capacity CapEx')}</Link>
          <Link to="/portal/ai-insights"       className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
          <Link to="/portal/war-room"          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('War Room')}</Link>
          <Link to="/portal/cto"               className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('CTO Dashboard')}</Link>
        </div>
      </div>
    </div>
  )
}
