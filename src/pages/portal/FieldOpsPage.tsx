import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3223)
import { useMemo, useState } from 'react'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import { MOBILE_DISPATCH_TODAY, MOBILE_INVENTORY } from './_mobile_data'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import {
  HardHat, Truck, Boxes, Calendar, CheckCircle2, Activity, TrendingUp,
  Sparkles, Zap, Globe, ShieldCheck, AlertTriangle, MapPin, Send, Brain,
  Award, Bell, Users, Phone, Heart, Wrench, GitBranch, Leaf, Package,
  Trophy, ArrowUpRight, Target, FlaskConical, Clock, Smartphone, Radio,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const headline = {
  techsActive: 186,
  techsHC: 240,
  contractorPct: 28,
  jobsToday: 942,
  jobsDelta: 8,
  rft: 91,
  rftDelta: 1.4,
  csat: 4.6,
  csatNPS: 52,
  truckRollsAvoided: 312,
  costPerJob: 142,
  costDelta: -8,
  evPct: 41,
  co2PerJob: 8.4,
  warehouseFill: 84,
  utilisation: 78,
}

const appointmentStatus = [
  { l: 'Completed',          n: 642, c: '#10b981' },
  { l: 'In progress',        n: 178, c: RED },
  { l: 'Scheduled',          n: 96,  c: '#f59e0b' },
  { l: 'Missed',             n: 14,  c: '#ef4444' },
  { l: 'Customer reschedule', n: 12,  c: '#94a3b8' },
]

const regions = [
  { r: 'Nassau',   lat: 25.0443, lng:  -77.3504, queued: 86, dispatched: 142, completed: 124, slaRisk: 8, ftf: 92, csat: 4.7 },
  { r: 'Freeport',     lat: 26.5333, lng:  -78.7, queued: 48, dispatched: 78,  completed: 64,  slaRisk: 4, ftf: 88, csat: 4.5 },
  { r: 'Abaco',    lat: 26.5412, lng:  -77.0636, queued: 32, dispatched: 56,  completed: 48,  slaRisk: 3, ftf: 86, csat: 4.4 },
  { r: 'Eleuthera',    lat: 25.1962, lng:  -76.2431, queued: 24, dispatched: 42,  completed: 38,  slaRisk: 2, ftf: 90, csat: 4.6 },
  { r: 'Exuma',   lat: 23.5, lng:  -75.7667, queued: 18, dispatched: 32,  completed: 28,  slaRisk: 2, ftf: 84, csat: 4.4 },
  { r: 'Bimini',  lat: 25.727, lng:  -79.2972, queued: 14, dispatched: 22,  completed: 18,  slaRisk: 2, ftf: 81, csat: 4.3 },
  { r: 'Long Island',  lat: 23.25, lng:  -75.1, queued: 22, dispatched: 36,  completed: 32,  slaRisk: 3, ftf: 87, csat: 4.5 },
  { r: 'Inagua',      lat: 20.95, lng:  -73.6731, queued: 12, dispatched: 18,  completed: 14,  slaRisk: 1, ftf: 88, csat: 4.6 },
  { r: 'New Providence',  lat: 25.06, lng:  -77.345, queued: 10, dispatched: 14,  completed: 12,  slaRisk: 1, ftf: 86, csat: 4.5 },
]

// Build live-job markers (jittered around regions)
const liveJobs: { id: string; lat: number; lng: number; type: string; eta: string; status: string; tech: string }[] = []
const jobTypes = ['Install', 'Repair', 'Survey', 'B2B SD-WAN', 'Pod swap', '5G FWA']
const statuses = ['Active', 'En-route', 'Completed', 'At-risk']
regions.forEach((r) => {
  const total = r.dispatched
  for (let i = 0; i < Math.min(total, 14); i++) {
    liveJobs.push({
      id: `JOB-${r.r.slice(0,3).toUpperCase()}-${1000 + i}`,
      lat: r.lat + (scenarioRandom() - 0.5) * 0.18,
      lng: r.lng + (scenarioRandom() - 0.5) * 0.22,
      type: jobTypes[Math.floor(scenarioRandom() * jobTypes.length)],
      eta: `${Math.floor(scenarioRandom() * 3) + 1}h ${Math.floor(scenarioRandom() * 60)}m`,
      status: statuses[Math.floor(scenarioRandom() * statuses.length)],
      tech: r.r,
    })
  }
})

// Schedule & demand
const demandForecast = Array.from({ length: 28 }, (_, i) => ({
  d: `D${i + 1}`,
  forecast: 880 + Math.round(Math.sin(i / 4) * 80 + scenarioRandom() * 40),
  capacity: 960,
  booked: 880 + Math.round(Math.sin(i / 4) * 80 + scenarioRandom() * 40) - Math.round(scenarioRandom() * 80),
}))

const slotAvailability = [
  { region: 'Nassau',     t1: 12, t2: 8, t3: 24, t4: 38 },
  { region: 'Freeport',       t1: 18, t2: 14, t3: 28, t4: 42 },
  { region: 'Abaco',     t1: 8,  t2: 6,  t3: 14, t4: 22 },
  { region: 'Eleuthera',   t1: 14, t2: 10, t3: 18, t4: 28 },
  { region: 'Exuma',  t1: 12, t2: 8,  t3: 16, t4: 24 },
  { region: 'Long Island', t1: 14, t2: 12, t3: 20, t4: 32 },
]

const backlog = [
  { age: '< 24h',   count: 412, value: 'Healthy' },
  { age: '24–48h',  count: 184, value: 'OK' },
  { age: '48–72h',  count: 96,  value: 'Watch' },
  { age: '> 72h',   count: 38,  value: 'Risk' },
  { age: 'SLA breach', count: 12, value: 'Breach' },
]

const jobMix = [
  { name: 'Install · BB',           value: 32, color: RED },
  { name: 'Repair · BB',             value: 24, color: RED2 },
  { name: 'Pod swap / WiFi',         value: 14, color: RED3 },
  { name: 'Install · B2B fibre',     value: 8,  color: RED4 },
  { name: '5G FWA install',          value: 6,  color: RED5 },
  { name: 'Survey',                  value: 6,  color: '#94a3b8' },
  { name: 'Kit collection / return', value: 5,  color: '#10b981' },
  { name: 'Repair · B2B',             value: 5,  color: '#0ea5e9' },
]

// Workforce
const skillMatrix = [
  { skill: 'HFC repair',         techs: 142, cert: 96 },
  { skill: 'FTTH / XGS-PON',    techs: 84,  cert: 88 },
  { skill: 'WiFi / pods',        techs: 186, cert: 94 },
  { skill: 'B2B SD-WAN',         techs: 32,  cert: 84 },
  { skill: 'Hosted voice',       techs: 24,  cert: 78 },
  { skill: '5G FWA',             techs: 48,  cert: 71 },
  { skill: 'Working at heights', techs: 96,  cert: 99 },
  { skill: 'MDU work',           techs: 42,  cert: 86 },
]

const techLeague = [
  { name: 'Luc De Vos',     region: 'Nassau',    jobs: 42, rft: 96, csat: 4.9, repeat: 1.8, hours: 38, status: 'Star' },
  { name: 'Sofie Willems',  region: 'Freeport',      jobs: 38, rft: 94, csat: 4.8, repeat: 2.4, hours: 36, status: 'Star' },
  { name: 'Ruben Knowles',   region: 'Abaco',    jobs: 36, rft: 91, csat: 4.6, repeat: 3.6, hours: 38, status: 'Strong' },
  { name: 'Anke Knowles',     region: 'Eleuthera',  jobs: 34, rft: 92, csat: 4.7, repeat: 2.8, hours: 36, status: 'Strong' },
  { name: 'Kobe Bain',   region: 'Long Island',   jobs: 32, rft: 89, csat: 4.5, repeat: 4.2, hours: 36, status: 'Coaching' },
  { name: 'Rosa O\'Neill',region: 'Exuma', jobs: 28, rft: 88, csat: 4.4, repeat: 4.6, hours: 34, status: 'Coaching' },
  { name: 'Pieter Smet',    region: 'Bimini',     jobs: 26, rft: 85, csat: 4.3, repeat: 5.2, hours: 34, status: 'Coaching' },
  { name: 'Brian Adderley',    region: 'Inagua',  jobs: 24, rft: 82, csat: 4.2, repeat: 6.8, hours: 32, status: 'Ramp · M2' },
]

const utilisationTrend = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i + 1}`,
  productive: 68 + Math.round(Math.sin(i / 2) * 4 + scenarioRandom() * 3),
  drive: 18 + Math.round(Math.cos(i / 2) * 2),
  idle: 10 + Math.round(scenarioRandom() * 3),
}))

const subContractors = [
  { c: 'KN Networks',      jobs: 240, rft: 86, csat: 4.4, complaints: 4, status: 'Active' },
  { c: 'Island Electrical (demo)',   jobs: 180, rft: 84, csat: 4.3, complaints: 6, status: 'Active' },
  { c: 'Entegro Build',    jobs: 142, rft: 88, csat: 4.5, complaints: 2, status: 'Active' },
  { c: 'Connect Civils',   jobs: 96,  rft: 78, csat: 4.0, complaints: 12, status: 'Watch' },
  { c: 'Cofely The Bahamas',        jobs: 84,  rft: 91, csat: 4.6, complaints: 1, status: 'Active' },
]

// Quality & customer
const rftByJobType = [
  { type: 'Install · BB',     rft: 92, target: 90 },
  { type: 'Install · B2B',    rft: 86, target: 92 },
  { type: 'Repair · BB',      rft: 88, target: 90 },
  { type: 'Pod swap',         rft: 96, target: 95 },
  { type: '5G FWA',           rft: 78, target: 85 },
  { type: 'B2B SD-WAN',       rft: 81, target: 88 },
]

const repeatCallReasons = [
  { r: 'Same fault returns 7d',   n: 84 },
  { r: 'New fault same line',     n: 62 },
  { r: 'Customer mis-config',     n: 48 },
  { r: 'Outside-plant intermittent', n: 36 },
  { r: 'CPE firmware bug',         n: 24 },
  { r: 'Wi-Fi placement',          n: 18 },
]

const csatTrend = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i + 1}`,
  csat: 4.4 + Math.sin(i / 2) * 0.1 + scenarioRandom() * 0.06,
  nps: 48 + Math.round(Math.sin(i / 2) * 4 + scenarioRandom() * 2),
}))

const etaAccuracy = [
  { band: '08–10', promised: 142, onTime: 132, late: 8, missed: 2 },
  { band: '10–12', promised: 168, onTime: 158, late: 8, missed: 2 },
  { band: '12–14', promised: 152, onTime: 140, late: 10, missed: 2 },
  { band: '14–16', promised: 184, onTime: 168, late: 12, missed: 4 },
  { band: '16–18', promised: 178, onTime: 158, late: 16, missed: 4 },
  { band: '18–20', promised: 118, onTime: 102, late: 12, missed: 4 },
]

const complaintReasons = [
  { r: 'Tech ran late',          n: 28 },
  { r: 'Job not fixed first time', n: 24 },
  { r: 'Engineer rushed',         n: 14 },
  { r: 'Mess left behind',        n: 10 },
  { r: 'Wrong kit installed',     n: 8 },
  { r: 'Re-schedule short notice', n: 6 },
]

// Inventory & Fleet
const vanStock = [
  { sku: 'Wi-Fi 6 Pro',          target: 4, avg: 3.6, stockoutPct: 4 },
  { sku: 'Wi-Fi pods (Tri)', target: 6, avg: 5.4, stockoutPct: 6 },
  { sku: 'Hub 4',            target: 2, avg: 1.4, stockoutPct: 18 },
  { sku: 'GPON ONT',         target: 2, avg: 1.8, stockoutPct: 8 },
  { sku: 'DOCSIS 3.1 modem', target: 3, avg: 2.4, stockoutPct: 12 },
  { sku: 'Splice kit',       target: 1, avg: 0.8, stockoutPct: 20 },
]

const warehouseStock = [
  { sku: 'Wi-Fi 6 Pro Wi-Fi 6E Router', stock: 1240, demand: 'High', restock: '3 days', status: 'OK' },
  { sku: 'REVTV Box',       stock: 820,  demand: 'Medium', restock: '7 days', status: 'OK' },
  { sku: 'Wi-Fi 6 Pod',             stock: 2480, demand: 'High', restock: '5 days', status: 'OK' },
  { sku: 'DOCSIS 3.1 Modem',       stock: 380,  demand: 'Low', restock: '14 days', status: 'Low' },
  { sku: 'Cable splitter kit',      stock: 12_000, demand: 'Low', restock: '30 days', status: 'OK' },
  { sku: 'GPON ONT',                stock: 480,  demand: 'High', restock: '21 days', status: 'Low' },
  { sku: 'Splice kit',              stock: 142,  demand: 'High', restock: '7 days',  status: 'Critical' },
]

const fleet = {
  vehicles: 240,
  ev: 98,
  iceBudget: 'BSD 48K / mo',
  evBudget: 'BSD 18K / mo',
  vor: 8,                   // vehicles off-road
  km: 184_000,              // km this week
  fuelCost: 64,             // BSD K this week
  co2: 8.4,
  acc: 2,
}

const fuelTrend = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i + 1}`,
  ice: 84 - i * 2.4,
  ev: 8 + i * 1.2,
  co2: 12 - i * 0.6,
}))

const safety = [
  { metric: 'LTI rate (per 1M hrs)',  value: 1.2, delta: '-0.4 QoQ', good: true,  suffix: '' },
  { metric: 'Near misses reported',    value: 84,  delta: '+12 vs LM', good: true,  suffix: '' },
  { metric: 'PPE compliance',          value: 98,  delta: '+1 pp QoQ', good: true,  suffix: '%' },
  { metric: 'Lone-worker check-ins',   value: 99.6, delta: 'SLA 99%',  good: true,  suffix: '%' },
  { metric: 'RIDDOR-reportable',       value: 0,   delta: 'this Q',    good: true,  suffix: '' },
  { metric: 'Toolbox talks done',       value: 92,  delta: '8 overdue',  good: true,  suffix: '%' },
]

// AI
const aiAnomalies = [
  { sev: 'High',   when: '14:00', what: 'Freeport demand forecast up +24% Sat-Sun · capacity gap of 18 jobs', action: 'Pull contractor crew from Eleuthera + add 2 OT shifts' },
  { sev: 'Medium', when: '11:20', what: 'Abaco repeat-call rate +1.8 pp WoW on 5 GHz pod swaps', action: 'Push firmware 2.4.18 + targeted retraining for 4 techs' },
  { sev: 'Medium', when: '08:45', what: 'Van stock-out risk: Splice kit < 1.0 avg across 28 vans',     action: 'Prioritise replenishment from Nassau warehouse' },
  { sev: 'Low',    when: 'Yest',  what: 'Long Island ETA accuracy down 4 pp (driver behaviour pattern)',  action: 'Coaching session + review traffic patterns' },
]

const predictiveDemand = [
  { region: 'Nassau',     d1: 138, d7: 920, d28: 3680, drift: '+8%', conf: 92 },
  { region: 'Freeport',       d1: 84,  d7: 620, d28: 2480, drift: '+12%', conf: 88 },
  { region: 'Abaco',     d1: 56,  d7: 420, d28: 1640, drift: '+18%', conf: 84 },
  { region: 'Eleuthera',   d1: 42,  d7: 320, d28: 1280, drift: '+4%',  conf: 91 },
  { region: 'Exuma',  d1: 32,  d7: 240, d28: 960,  drift: '+2%',  conf: 89 },
  { region: 'Long Island', d1: 36,  d7: 280, d28: 1120, drift: '+11%', conf: 86 },
]

const cortexPrompts = [
  { q: 'Why is RFT down in Freeport this week?',                              sql: 'CALL diagnose_rft(region=>\'freeport\', period=>\'WEEK\')' },
  { q: 'Forecast demand for Saturday by region',                          sql: 'SELECT region, jobs_forecast FROM DEMAND_FORECAST WHERE day = NEXT_SATURDAY' },
  { q: 'Which techs need coaching based on RFT + CSAT?',                  sql: 'SELECT * FROM TECH_COACHING_QUEUE ORDER BY priority DESC' },
  { q: 'Find vans with stock-out risk this week',                          sql: 'SELECT * FROM VAN_STOCK_RISK WHERE risk_score > 0.6' },
  { q: 'What\'s the cheapest way to clear the SLA-breach backlog?',       sql: 'CALL recommend_capacity_unlock(target=>\'SLA_BREACH\')' },
  { q: 'Show truck rolls avoidable via Cortex remote diagnosis',            sql: 'SELECT * FROM AVOIDABLE_TRUCK_ROLLS WHERE confidence > 0.8' },
]

// Safety & HSE data
const hseKpis = [
  { metric: 'LTI rate (per 1M hrs)',      value: 1.2,  delta: '-0.4 QoQ',  good: true,  suffix: '' },
  { metric: 'Near misses reported',        value: 84,   delta: '+12 vs LM', good: true,  suffix: '' },
  { metric: 'PPE compliance',              value: 98,   delta: '+1 pp QoQ', good: true,  suffix: '%' },
  { metric: 'Lone-worker check-ins',       value: 99.6, delta: 'SLA 99%',   good: true,  suffix: '%' },
  { metric: 'RIDDOR-reportable incidents', value: 0,    delta: 'this Q',    good: true,  suffix: '' },
  { metric: 'Toolbox talks completed',     value: 92,   delta: '8 overdue', good: true,  suffix: '%' },
]

const incidentTypeTrend = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i + 1}`,
  nearMiss: 8 + Math.round(scenarioRandom() * 4),
  firstAid: 2 + Math.round(scenarioRandom() * 2),
  lti: Math.round(scenarioRandom()),
}))

const hazardsByType = [
  { type: 'Working at heights',  count: 14, mitigated: 13 },
  { type: 'Lone-worker',         count: 18, mitigated: 18 },
  { type: 'Manual handling',     count: 9,  mitigated: 9 },
  { type: 'Vehicle / road',      count: 12, mitigated: 11 },
  { type: 'Electrical hazard',   count: 6,  mitigated: 6 },
  { type: 'Asbestos proximity',  count: 4,  mitigated: 4 },
]

// Scheduling AI data
const aiSchedulingKpis = [
  { label: 'AI-assigned jobs today',   value: '784',   delta: '83% of total',   icon: Brain,    trend: 'up' as const },
  { label: 'Route optimisation lift',  value: '+11%',  delta: 'km / job ↓ 3.2', icon: TrendingUp, trend: 'up' as const },
  { label: 'Same-day realloc. events', value: '38',    delta: 'vs 64 manual',   icon: Calendar, trend: 'up' as const },
  { label: 'AI demand accuracy (MAPE)',value: '7.2%',  delta: 'target < 10%',   icon: Target,   trend: 'up' as const },
]

const schedulingGain = [
  { wk: 'W1', manual: 148, ai: 164, saved: 12 },
  { wk: 'W2', manual: 146, ai: 166, saved: 14 },
  { wk: 'W3', manual: 144, ai: 168, saved: 16 },
  { wk: 'W4', manual: 142, ai: 172, saved: 18 },
  { wk: 'W5', manual: 140, ai: 174, saved: 20 },
  { wk: 'W6', manual: 138, ai: 176, saved: 22 },
]

const travelTimeReduction = [
  { region: 'Nassau',     before: 48, after: 38, saving: 10 },
  { region: 'Freeport',  before: 52, after: 41, saving: 11 },
  { region: 'Abaco',   before: 44, after: 35, saving: 9 },
  { region: 'Eleuthera',    before: 46, after: 37, saving: 9 },
  { region: 'Exuma',   before: 40, after: 33, saving: 7 },
  { region: 'Long Island',before: 42, after: 34, saving: 8 },
]

// ───────── tabs ─────────
type TabId = 'today' | 'sched' | 'work' | 'qual' | 'inv' | 'ai' | 'safety' | 'scheduling'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'today', label: 'Today',                 icon: Activity },
  { id: 'sched', label: 'Schedule & Demand',     icon: Calendar },
  { id: 'work',  label: 'Workforce',             icon: HardHat },
  { id: 'qual',  label: 'Quality & Customer',    icon: Heart },
  { id: 'inv',   label: 'Inventory & Fleet',     icon: Truck },
  { id: 'ai',         label: 'AI Field Ops',      icon: Brain },
  { id: 'safety',     label: 'Safety & HSE',       icon: ShieldCheck },
  { id: 'scheduling', label: 'Scheduling AI',      icon: Target },
]

const sevColor = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const stockStatus = (s: string) => s === 'OK' ? 'bg-emerald-100 text-emerald-700' : s === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const techStatusPill = (s: string) => s === 'Star' ? 'bg-yellow-200 text-yellow-900' : s === 'Strong' ? 'bg-emerald-100 text-emerald-700' : s === 'Coaching' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
const subStatus = (s: string) => s === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
const backlogColor = (s: string) => s === 'Healthy' || s === 'OK' ? 'bg-emerald-100 text-emerald-700' : s === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const liveStatusColor: Record<string, string> = { 'Active': RED, 'En-route': RED4, 'Completed': '#10b981', 'At-risk': '#ef4444' }

const REGION_KEYS = ['All', ...regions.map(r => r.r)] as const
type RegionFilter = typeof REGION_KEYS[number]

export default function FieldOpsPage() {
  const [tab, setTab] = useState<TabId>('today')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('All')

  const liveJobMarkers: MapMarker[] = useMemo(() => liveJobs
    .filter(j => regionFilter === 'All' || j.tech === regionFilter)
    .map((j) => ({
      name: j.id,
      lat: j.lat,
      lng: j.lng,
      radius: j.status === 'At-risk' ? 9 : 7,
      color: liveStatusColor[j.status],
      pulse: j.status === 'At-risk' || j.status === 'Active',
      tooltip: `${j.id} · ${j.type} · ${tt(j.status)} · ETA ${j.eta}`,
    })), [regionFilter])

  const demandMarkers: MapMarker[] = useMemo(() => regions.map((r) => {
    const utilPct = (r.dispatched / (r.dispatched + r.queued)) * 100
    const color = r.slaRisk > 6 ? '#ef4444' : r.slaRisk > 3 ? '#f59e0b' : '#10b981'
    return {
      name: r.r,
      lat: r.lat,
      lng: r.lng,
      radius: 8 + Math.log10(r.dispatched + r.queued) * 4,
      color,
      tooltip: `${r.r} · ${r.queued + r.dispatched} jobs · SLA risk ${r.slaRisk}`,
    }
  }), [])

  const totalLive = liveJobs.length
  const totalCompleted = appointmentStatus.find(a => a.l === 'Completed')!.n

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Field Operations')}
        subtitle={tt('Workforce · scheduling · live jobs · inventory · fleet · AI ops')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · WFM sync 60 s
            </span>
          </div>
        }
      />

      <AgentDecision
        title={tt('Dispatch optimisation — AI assignment')}
        label="Optimise Dispatch"
        runningLabel="Optimising…"
        steps={[
          'Scored open jobs by SLA risk, skill match & travel time',
          'Re-sequenced 38 jobs across 12 crews (min total ETA)',
          'Pulled 2 sub-contractor slots for the Freeport gap',
          'Pushed optimised route to WFM — 94% SLA attainment',
        ]}
        hint={tt('Optimiser balances first-time-fix, SLA risk and drive-time in one pass.')}
        result={{
          headline: 'Pre-book 2 sub-contractor crews for the Freeport weekend spike',
          stats: [
            { label: 'Techs active', value: '186' },
            { label: 'Jobs today', value: '942' },
            { label: 'Right-first-time', value: '91%' },
            { label: 'Truck rolls avoided', value: '312' },
          ],
          findings: [
            'Forecast demand exceeds own-crew capacity by 18 jobs Sat-Sun.',
            'Sub-contractor backfill protects install SLAs and weekend NPS.',
          ],
          note: 'Sub-contractor first-time-fix 6 pp lower — QA sample.',
        }}
        impact="+18 jobs covered · SLA attainment 94%"
        risk="sub-contractor first-time-fix 6 pp lower — QA sample"
        linkTo="#/portal/assurance"
        linkLabel="Open Service Assurance"
      />

      {/* live alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Freeport demand spike forecast Sat-Sun · capacity gap 18 jobs')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Cortex demand model · <span className="font-bold">+24%</span> vs trend ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('recommend pull KN crew from Eleuthera + 2 OT shifts')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('net +24 slots')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open AI →')}</button>
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

      {/* ═══════ TODAY ═══════ */}
      {tab === 'today' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Techs active')}      value={`${headline.techsActive}`}            delta={`of ${headline.techsHC}`}          trend="up"   icon={HardHat} accent />
          <KpiCard label={tt('Jobs today')}        value={headline.jobsToday.toLocaleString()}   delta={`+${headline.jobsDelta}% MoM`}     trend="up"   icon={Calendar} />
          <KpiCard label={tt('Right-first-time')}  value={`${headline.rft}%`}                    delta={`+${headline.rftDelta} pp`}        trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Truck rolls avoided')} value={`${headline.truckRollsAvoided}`}     delta="via Cortex diag"                  trend="up"   icon={Truck} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CSAT')}              value={`${headline.csat}/5`}                  delta={`NPS ${headline.csatNPS}`}        trend="up"   icon={Heart} />
          <KpiCard label={tt('Cost / job')}        value={`BSD ${headline.costPerJob}`}             delta={`${headline.costDelta}% vs LM`}   trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('EV fleet')}          value={`${headline.evPct}%`}                   delta="net-zero on track"                trend="up"   icon={Leaf} />
          <KpiCard label={tt('Warehouse fill')}    value={`${headline.warehouseFill}%`}           delta="3 SKUs low"                       trend="flat" icon={Boxes} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel
              title={tt('Live Job Map · Carto')}
              action={
                <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
                  className="text-xs font-bold bg-black/5 text-vfes-dark/70 px-2 py-1 rounded">
                  {REGION_KEYS.map(r => <option key={r}>{r}</option>)}
                </select>
              }
            >
              <CartoMap markers={liveJobMarkers} basemap="voyager" height={420} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />{tt('Active')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED4 }} />{tt('En-route')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{tt('Completed')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('At-risk (pulsing)')}</span>
                <span className="ml-auto">{liveJobMarkers.length} jobs of {totalLive} live</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Appointment Status · Today')}>
            <div className="space-y-2">
              {appointmentStatus.map((s) => (
                <div key={s.l} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.c }} />
                  <span className="flex-1">{s.l}</span>
                  <span className="font-bold">{s.n}</span>
                  <span className="text-[10px] text-vfes-dark/55 w-12 text-right">{Math.round((s.n / headline.jobsToday) * 100)}%</span>
                </div>
              ))}
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 mt-2">Completion {Math.round((totalCompleted / headline.jobsToday) * 100)}% · target 70%</div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Region Dispatch · Live')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Queued')}</th>
                  <th className="text-right">{tt('Dispatched')}</th>
                  <th className="text-right">{tt('Completed')}</th>
                  <th className="text-right">{tt('SLA risk')}</th>
                  <th className="text-right">{tt('RFT')}</th>
                  <th className="text-right">{tt('CSAT')}</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.r} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{r.r}</td>
                    <td className="text-right">{r.queued}</td>
                    <td className="text-right font-bold">{r.dispatched}</td>
                    <td className="text-right text-emerald-600">{r.completed}</td>
                    <td className={`text-right ${r.slaRisk > 6 ? 'text-red-600 font-bold' : r.slaRisk > 3 ? 'text-amber-600' : ''}`}>{r.slaRisk}</td>
                    <td className="text-right">{r.ftf}%</td>
                    <td className="text-right font-bold text-vfes-dark">{r.csat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ SCHEDULE & DEMAND ═══════ */}
      {tab === 'sched' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Forecast / day · 7d avg')} value="924" delta="+6% vs prev wk" trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Capacity / day')}          value="960" delta="36 jobs slack"   trend="flat" icon={Activity} />
          <KpiCard label={tt('Same-day availability')}   value="68%" delta="-4 pp"           trend="down" icon={Clock} />
          <KpiCard label={tt('SLA breach (open)')}       value="12"  delta="-4 vs LW"        trend="up"   icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('28-day Demand Forecast · vs Capacity')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="d" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="forecast" name={tt('Forecast')} stroke={RED} fill={RED} fillOpacity={0.25} />
                    <Bar dataKey="booked" name={tt('Booked')} fill={RED4} />
                    <Line type="monotone" dataKey="capacity" name={tt('Capacity')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Capacity vs Demand · Map')}>
            <CartoMap markers={demandMarkers} basemap="positron" height={300} center={[24.7, -76.5]} zoom={6} />
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Color = SLA risk · bubble = total jobs')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Slot Availability · Next 7 Days · Per Region')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Region')}</th>
                    <th className="text-right">{tt('Tomorrow')}</th>
                    <th className="text-right">+2</th>
                    <th className="text-right">+3</th>
                    <th className="text-right">+5</th>
                  </tr>
                </thead>
                <tbody>
                  {slotAvailability.map((s) => (
                    <tr key={s.region} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{s.region}</td>
                      <td className={`text-right font-bold ${s.t1 < 10 ? 'text-red-600' : s.t1 < 14 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.t1}</td>
                      <td className="text-right">{s.t2}</td>
                      <td className="text-right">{s.t3}</td>
                      <td className="text-right">{s.t4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Backlog · By Age')}>
            <div className="space-y-2">
              {backlog.map((b) => (
                <div key={b.age} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="w-28 font-semibold">{b.age}</div>
                  <div className="flex-1 h-6 bg-black/5 rounded">
                    <div className="h-full bg-vfes-red rounded flex items-center justify-end pr-2 text-[10px] text-vfes-dark font-bold" style={{ width: `${(b.count / backlog[0].count) * 100}%` }}>{b.count}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${backlogColor(b.value)}`}>{b.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Job Mix · This Week')}>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={jobMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {jobMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-2 content-start">
              {jobMix.map((j) => (
                <div key={tt(j.name)} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm" style={{ background: j.color }} />
                  <span className="flex-1">{tt(j.name)}</span>
                  <span className="font-bold">{j.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Mobile dispatch today */}
        <Panel title={tt('Mobile Dispatch · Today')} action={<span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('MOBILE')}</span>}>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MOBILE_DISPATCH_TODAY.map(d => (
              <div key={d.type} className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">
                  {d.crew === 'Tower' ? <Radio className="w-3 h-3 text-vfes-dark" /> : <Smartphone className="w-3 h-3 text-vfes-dark" />}
                  {tt(d.crew)} · {tt(d.type)}
                </div>
                <div className="text-2xl font-extrabold">{d.count}</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(d.eta)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </>)}

      {/* ═══════ WORKFORCE ═══════ */}
      {tab === 'work' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Headcount')}        value={`${headline.techsHC}`} delta={`${headline.techsActive} active · ${headline.contractorPct}% contractor`} trend="up" icon={Users} accent />
          <KpiCard label={tt('Utilisation')}      value={`${headline.utilisation}%`} delta="+2 pp QoQ"     trend="up"   icon={Activity} />
          <KpiCard label={tt('Avg ramp (M1→M6)')} value="4.2 mo"  delta="-0.6 mo vs LY"   trend="up"   icon={Award} />
          <KpiCard label={tt('Coaching queue')}   value="3 reps"  delta="auto-flagged"     trend="flat" icon={Wrench} />
        </div>

        <Panel title={tt('Tech League · This Week')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Tech')}</th>
                  <th>{tt('Region')}</th>
                  <th className="text-right">{tt('Jobs')}</th>
                  <th className="text-right">{tt('RFT')}</th>
                  <th className="text-right">{tt('CSAT')}</th>
                  <th className="text-right">{tt('Repeat-call')}</th>
                  <th className="text-right">{tt('Hours')}</th>
                  <th>{tt('Status')}</th>
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
                    <td className={`text-right font-bold ${t.rft >= 92 ? 'text-emerald-600' : t.rft >= 88 ? 'text-amber-600' : 'text-red-600'}`}>{t.rft}%</td>
                    <td className="text-right">{t.csat}</td>
                    <td className={`text-right ${t.repeat > 4 ? 'text-amber-600 font-bold' : ''}`}>{t.repeat}%</td>
                    <td className="text-right text-xs">{t.hours}h</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${techStatusPill(t.status)}`}>{tt(t.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <Panel title={tt('Skill Matrix · Cert %')}>
            <div className="space-y-2">
              {skillMatrix.map((s) => (
                <div key={s.skill} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-xs">{s.skill}</span>
                    <span className="text-xs text-vfes-dark/65">{s.techs} techs · <span className={`font-bold ${s.cert >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{s.cert}%</span></span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded mt-1">
                    <div className={`h-full rounded ${s.cert >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${s.cert}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Utilisation Trend · 8 wk')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={utilisationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="productive" name={tt('Productive')} stackId="a" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="drive" name={tt('Drive')} stackId="a" stroke={RED4} fill={RED4} fillOpacity={0.5} />
                    <Area type="monotone" dataKey="idle" name={tt('Idle')} stackId="a" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Sub-contractor Scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Crew')}</th>
                  <th className="text-right">{tt('Jobs')}</th>
                  <th className="text-right">{tt('RFT')}</th>
                  <th className="text-right">{tt('CSAT')}</th>
                  <th className="text-right">{tt('Complaints')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {subContractors.map((s) => (
                  <tr key={s.c} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{s.c}</td>
                    <td className="text-right">{s.jobs}</td>
                    <td className={`text-right font-bold ${s.rft >= 88 ? 'text-emerald-600' : s.rft >= 82 ? 'text-amber-600' : 'text-red-600'}`}>{s.rft}%</td>
                    <td className="text-right">{s.csat}</td>
                    <td className={`text-right ${s.complaints > 8 ? 'text-red-600 font-bold' : ''}`}>{s.complaints}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${subStatus(s.status)}`}>{tt(s.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ QUALITY & CUSTOMER ═══════ */}
      {tab === 'qual' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('RFT')}               value={`${headline.rft}%`}  delta={`+${headline.rftDelta} pp`} trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('CSAT')}               value={`${headline.csat}/5`} delta="+0.1 vs LM"               trend="up"   icon={Heart} />
          <KpiCard label={tt('ETA accuracy')}       value="92%"                  delta="+2 pp"                    trend="up"   icon={Clock} />
          <KpiCard label={tt('Repeat-call (30d)')}  value="4.2%"                 delta="-1.4 pp QoQ"              trend="up"   icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('RFT by Job Type · vs Target')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={rftByJobType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rft" name={tt('Actual')} fill={RED} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={DARK} strokeDasharray="4 4" dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('CSAT & NPS Trend · 8 wk')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={csatTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[4.0, 5.0]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[40, 60]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="csat" name={tt('CSAT')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="nps" name={tt('NPS')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Repeat-call Reasons · 30d')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={repeatCallReasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="r" tick={{ fontSize: 10 }} width={170} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="n" fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Complaint Reasons · This Month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={complaintReasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="r" tick={{ fontSize: 10 }} width={170} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="n" fill={RED2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('ETA Accuracy · By Appointment Window')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Window')}</th>
                  <th className="text-right">{tt('Promised')}</th>
                  <th className="text-right">{tt('On time')}</th>
                  <th className="text-right">{tt('Late')}</th>
                  <th className="text-right">{tt('Missed')}</th>
                  <th className="text-right">{tt('Accuracy')}</th>
                </tr>
              </thead>
              <tbody>
                {etaAccuracy.map((e) => (
                  <tr key={e.band} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{e.band}</td>
                    <td className="text-right">{e.promised}</td>
                    <td className="text-right text-emerald-600 font-bold">{e.onTime}</td>
                    <td className="text-right text-amber-600">{e.late}</td>
                    <td className="text-right text-red-600">{e.missed}</td>
                    <td className={`text-right font-bold ${e.onTime / e.promised >= 0.92 ? 'text-emerald-600' : 'text-amber-600'}`}>{((e.onTime / e.promised) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ INVENTORY & FLEET ═══════ */}
      {tab === 'inv' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Vehicles')}      value={`${fleet.vehicles}`} delta={`${fleet.vor} VOR`}    trend="flat" icon={Truck} accent />
          <KpiCard label={tt('EV fleet')}      value={`${fleet.ev}`}        delta={`${headline.evPct}% of fleet`} trend="up"   icon={Leaf} />
          <KpiCard label={tt('Fuel cost / wk')} value={`BSD ${fleet.fuelCost}K`} delta="-BSD 8K vs LW"            trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('CO₂ / job')}      value={`${fleet.co2} kg`}    delta="-12% YoY"              trend="up"   icon={Leaf} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Van Stock · Avg per van vs target')}>
            <div className="space-y-2">
              {vanStock.map((v) => (
                <div key={v.sku} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-xs">{v.sku}</span>
                    <span className="text-xs">avg <span className={`font-bold ${v.avg >= v.target * 0.9 ? 'text-emerald-600' : 'text-amber-600'}`}>{v.avg.toFixed(1)}</span> / target {v.target}</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded mt-1">
                    <div className={`h-full rounded ${v.stockoutPct < 8 ? 'bg-emerald-500' : v.stockoutPct < 15 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(v.avg / v.target) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">stock-out rate <span className={v.stockoutPct >= 15 ? 'text-red-600 font-bold' : ''}>{v.stockoutPct}%</span></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Warehouse Inventory')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Item')}</th>
                    <th className="text-right">{tt('Stock')}</th>
                    <th>{tt('Demand')}</th>
                    <th className="text-right">{tt('Restock')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseStock.map((s) => (
                    <tr key={s.sku} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{s.sku}</td>
                      <td className="text-right">{s.stock.toLocaleString()}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${s.demand === 'High' ? 'bg-red-50 text-red-700' : s.demand === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{s.demand}</span></td>
                      <td className="text-right text-xs">{s.restock}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stockStatus(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Fuel & CO₂ Trend · ICE → EV transition')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={fuelTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="ice" name={tt('ICE BSD K')} stackId="a" fill={RED4} />
                  <Bar yAxisId="l" dataKey="ev"  name={tt('EV BSD K')}  stackId="a" fill="#10b981" />
                  <Line yAxisId="r" type="monotone" dataKey="co2" name={tt('kg CO₂ / job')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Health & Safety')}>
            <div className="space-y-2">
              {safety.map((s) => (
                <div key={s.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${s.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold text-xs">{s.metric}</div>
                  <div className="font-bold">{s.value}{s.suffix}</div>
                  <div className={`text-xs ${s.good ? 'text-emerald-600' : 'text-amber-600'}`}>{s.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Mobile spare-parts inventory */}
        <Panel title={tt('Mobile RAN Spare Parts · Inventory')} action={<span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('MOBILE')}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('SKU')}</th>
                  <th className="px-3 py-2">{tt('Type')}</th>
                  <th className="px-3 py-2">{tt('Vendor')}</th>
                  <th className="px-3 py-2 text-right">{tt('Qty')}</th>
                  <th className="px-3 py-2 text-right">{tt('EoS')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_INVENTORY.map(p => (
                  <tr key={p.sku} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                    <td className="px-3 py-2">{tt(p.type)}</td>
                    <td className="px-3 py-2">{p.vendor}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.qty.toLocaleString('en-BS')}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.eos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ AI FIELD OPS ═══════ */}
      {tab === 'ai' && (<>
        <div className="mt-6">
          <MlInsightSection
            heading={tt('Field operations intelligence')}
            models={[
              { name: tt('Demand Forecast V3'),  metric: 'MAPE 7.2%',  sub: tt('28-day demand model') },
              { name: tt('Routing Optimiser'),   metric: '+11% lift',  sub: tt('km / job reduction') },
              { name: tt('RFT Predictor'),       metric: 'AUC 0.86',   sub: tt('first-time-fix model') },
            ]}
            agentLabel={tt('Run Field AI Optimiser')}
            agentRunningLabel={tt('Optimising…')}
            agentSteps={[
              tt('Scored open jobs by SLA risk & skill match'),
              tt('Re-sequenced 38 jobs across 12 crews'),
              tt('Pulled sub-contractor slots for Freeport gap'),
              tt('Pushed optimised route to WFM — 94% SLA attainment'),
            ]}
            agentBlurb={tt('Combining WFM telemetry, demand forecasts and parts availability in Snowflake lets the model optimise across cost, SLA and carbon simultaneously.')}
            decision={{
              title: tt('Pre-book 2 sub-contractor crews for the Freeport weekend spike'),
              detail: tt('Forecast demand exceeds own-crew capacity by 18 jobs Sat-Sun. Sub-contractor backfill protects install SLAs and weekend NPS.'),
              impact: tt('+18 jobs covered · SLA attainment 94% · NPS +3 pp'),
              risk: tt('Sub-contractor first-time-fix 6 pp lower — QA sample required'),
              linkTo: '/portal/assurance',
              linkLabel: tt('Open Assurance →'),
            }}
            chart={{
              kind: 'line' as const,
              title: tt('Demand forecast vs capacity'),
              data: demandForecast.slice(0, 14),
              xKey: 'd',
              series: [
                { key: 'forecast', name: tt('Forecast'), color: RED },
                { key: 'capacity', name: tt('Capacity'), color: DARK, dashed: true },
              ],
              note: tt('AI demand model · MAPE 7.2%'),
            }}
            registryNote={tt('FIELD_DEMAND_V3 · ROUTE_OPT_V2 · RFT_PRED_V1 · Snowflake ML Registry')}
          />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live anomalies')}          value={`${aiAnomalies.length}`} delta={`${aiAnomalies.filter(a=>a.sev==='High').length} high-sev`} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Truck rolls avoided · YTD')} value="2,420"  delta="BSD 428K saved"      trend="up"   icon={Truck} />
          <KpiCard label={tt('Routing efficiency lift')}  value="+11%"   delta="km/job ↓ 3.2"      trend="up"   icon={Sparkles} />
          <KpiCard label={tt('Cortex queries / wk')}      value="186"    delta="+24% vs LW"        trend="up"   icon={Brain} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Anomaly Queue · Cortex AI')}>
            <div className="space-y-2">
              {aiAnomalies.map((a, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(a.sev)} shrink-0`}>{a.sev}</span>
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

          <Panel title={tt('Predictive Demand · Cortex Forecast')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Region')}</th>
                    <th className="text-right">{tt('D+1')}</th>
                    <th className="text-right">{tt('D+7')}</th>
                    <th className="text-right">{tt('D+28')}</th>
                    <th className="text-right">{tt('Drift')}</th>
                    <th className="text-right">{tt('Conf')}</th>
                  </tr>
                </thead>
                <tbody>
                  {predictiveDemand.map((p) => (
                    <tr key={p.region} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{p.region}</td>
                      <td className="text-right">{p.d1}</td>
                      <td className="text-right">{p.d7}</td>
                      <td className="text-right font-bold">{p.d28.toLocaleString()}</td>
                      <td className={`text-right font-bold ${p.drift.startsWith('+') ? 'text-vfes-dark' : 'text-emerald-600'}`}>{p.drift}</td>
                      <td className="text-right text-xs">{p.conf}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · Field Ops Prompts')}>
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
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('FIELD_OPS_360')}</span>{tt('· Cortex Search: runbooks + install guides')}</div>
            </Panel>
          </div>
          <Panel title={tt('Model Card · Field Ops AI')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Demand model')}</span><span className="font-mono text-xs">{tt('FIELD_DEMAND_V3_2')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Routing model')}</span><span className="font-mono text-xs">{tt('ROUTE_OPT_V2_1')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('RFT predictor')}</span><span className="font-mono text-xs">{tt('RFT_PRED_V1_8')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Last refresh')}</span><span className="font-bold">{tt('02:00 UTC')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Demand MAPE')}</span><span className="font-bold text-emerald-600">7.2%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('RFT predictor AUC')}</span><span className="font-bold">0.86</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('Field Analytics')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Snowflake ML Registry · Cortex Agent enabled')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ SAFETY & HSE ═══════ */}
      {tab === 'safety' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('LTI rate')}              value="1.2"  delta="-0.4 QoQ"  trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Near misses')}           value="84"   delta="+12 vs LM" trend="up"   icon={AlertTriangle} />
          <KpiCard label={tt('PPE compliance')}        value="98%"  delta="+1 pp QoQ" trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Lone-worker SLA')}       value="99.6%" delta="SLA 99%"  trend="up"   icon={Users} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('HSE Incident Trend · 8 wk')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={incidentTypeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="nearMiss" name={tt('Near miss')}  stackId="a" fill={RED} />
                  <Bar dataKey="firstAid" name={tt('First aid')}  stackId="a" fill={RED4} />
                  <Bar dataKey="lti"      name={tt('LTI')}        stackId="a" fill={RED2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('HSE KPI Scorecard')}>
            <div className="space-y-2">
              {hseKpis.map((s) => (
                <div key={s.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${s.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold text-xs">{s.metric}</div>
                  <div className="font-bold">{s.value}{s.suffix}</div>
                  <div className={`text-xs ${s.good ? 'text-emerald-600' : 'text-amber-600'}`}>{s.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Hazard Register · Open Items')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Hazard type')}</th>
                  <th className="text-right">{tt('Reported')}</th>
                  <th className="text-right">{tt('Mitigated')}</th>
                  <th className="text-right">{tt('Open')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {hazardsByType.map((h) => (
                  <tr key={h.type} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{h.type}</td>
                    <td className="text-right">{h.count}</td>
                    <td className="text-right text-emerald-600">{h.mitigated}</td>
                    <td className={`text-right font-bold ${h.count - h.mitigated > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{h.count - h.mitigated}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${h.count === h.mitigated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{h.count === h.mitigated ? tt('Clear') : tt('Open')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ SCHEDULING AI ═══════ */}
      {tab === 'scheduling' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {aiSchedulingKpis.map((k) => (
            <KpiCard key={k.label} label={tt(k.label)} value={k.value} delta={k.delta} trend={k.trend} icon={k.icon} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AI vs Manual Scheduling · Jobs Completed / day')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={schedulingGain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="manual" name={tt('Manual')} fill="#94a3b8" />
                  <Bar yAxisId="l" dataKey="ai"     name={tt('AI')}     fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="saved" name={tt('Saved (truck rolls)')} stroke="#10b981" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Avg Travel Time Reduction · Per Region (min)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={travelTimeReduction}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="before" name={tt('Before AI')} fill="#94a3b8" />
                  <Bar dataKey="after"  name={tt('After AI')}  fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Reallocation Events · This Week · AI-driven')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Time')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Reason')}</th>
                  <th className="text-right">{tt('Jobs moved')}</th>
                  <th>{tt('SLA outcome')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: '09:14', r: 'Freeport', reason: 'Demand spike +24%',      moved: 8, sla: 'Protected' },
                  { t: '11:02', r: 'Abaco',  reason: 'Tech vehicle breakdown', moved: 3, sla: 'Protected' },
                  { t: '13:30', r: 'Nassau',    reason: 'Sub-contractor arrived', moved: 12, sla: 'Improved' },
                  { t: '15:48', r: 'Eleuthera',   reason: 'Traffic re-route AI',    moved: 4, sla: 'Protected' },
                  { t: '16:20', r: 'Exuma',  reason: 'SLA-breach risk alert',  moved: 2, sla: 'Protected' },
                ].map((e) => (
                  <tr key={e.t + e.r} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-xs">{e.t}</td>
                    <td className="font-semibold text-xs">{e.r}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(e.reason)}</td>
                    <td className="text-right font-bold">{e.moved}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${e.sla === 'Improved' ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-100 text-emerald-700'}`}>{tt(e.sla)}</span></td>
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
          <Link to="/portal/operations"       className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Operations')}</Link>
          <Link to="/portal/network"          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Network')}</Link>
          <Link to="/portal/assurance"        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Assurance')}</Link>
          <Link to="/portal/order-provisioning" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Order & Provisioning')}</Link>
          <Link to="/portal/incidents"        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Incidents')}</Link>
          <Link to="/portal/coverage"         className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Coverage')}</Link>
          <Link to="/portal/inventory"        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Inventory')}</Link>
          <Link to="/portal/supply-chain"     className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Supply Chain')}</Link>
          <Link to="/portal/contact-center"   className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('Contact Centre')}</Link>
          <Link to="/portal/ai-insights"      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
          <Link to="/portal/coo"              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:border-vfes-red/40 text-vfes-dark/70 hover:text-vfes-dark transition">{tt('COO Dashboard')}</Link>
        </div>
      </div>
    </div>
  )
}
