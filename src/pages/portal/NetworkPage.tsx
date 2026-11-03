import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3179)
import { useMemo, useState } from 'react'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import NET from './_network_facts'
import KpiCard from '../../components/KpiCard'
import { RAN_BUILDS } from './_mobile_data'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import {
  Network, Cable, Server, Cpu, Wifi, Activity, TrendingUp, Sparkles,
  Zap, Globe, ShieldCheck, AlertTriangle, MapPin, Send, GitBranch,
  Calendar, Brain, Award, Bell, Truck, Package, Leaf, Building2,
  ArrowUpRight, Radio, Target, Trophy, CheckCircle2, Smartphone,
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
  premisesPassed: 1.74,        // M
  premisesTarget: 2.10,        // M EOY
  takeRate: 38,                // %
  gigAvail: 64,                // %
  peakTbps: 1.42,
  capexYTD: 118,               // BSD M
  capexPlan: 174,              // BSD M
  cphp: 312,                   // BSD  per home passed
  cphc: 540,                   // BSD  per home connected
  ftthShare: 28,               // %
  rpkiCoverage: 94,            // %
  v6Adoption: 41,              // %
}

const trafficNational = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  gbps: 600 + Math.round(Math.sin(i / 3) * 350 + (i > 18 || i < 2 ? 200 : 0)),
  cdn: 380 + Math.round(Math.sin(i / 3) * 220 + (i > 18 || i < 2 ? 140 : 0)),
  transit: 110 + Math.round(Math.sin(i / 3) * 60 + (i > 18 || i < 2 ? 40 : 0)),
}))

const buildVelocity = [
  { wk: 'W1', plan: 4200, actual: 4080 },
  { wk: 'W2', plan: 4400, actual: 4520 },
  { wk: 'W3', plan: 4400, actual: 4380 },
  { wk: 'W4', plan: 4600, actual: 4720 },
  { wk: 'W5', plan: 4600, actual: 4540 },
  { wk: 'W6', plan: 4800, actual: 4920 },
  { wk: 'W7', plan: 4800, actual: 5020 },
  { wk: 'W8', plan: 5000, actual: 5140 },
]

const programmes = [
  { p: 'Abaco West XGS-PON',           r: 'Abaco',   hh: 24_000, pct: 78, gl: 'Q1 2027', rag: 'Green',  capex: 18.4 },
  { p: 'Nassau Docklands 10G overlay',  r: 'Nassau',  hh: 8_000,  pct: 92, gl: 'Q4 2026', rag: 'Green',  capex: 9.2 },
  { p: 'Freeport Suburban Build',           r: 'Freeport',    hh: 36_000, pct: 54, gl: 'Q2 2027', rag: 'Amber',  capex: 28.6 },
  { p: 'Eleuthera FTTH Phase 2',            r: 'Eleuthera',   hh: 12_000, pct: 28, gl: 'Q3 2027', rag: 'Amber',  capex: 14.2 },
  { p: 'DOCSIS 4.0 trial · Central',     r: 'Nassau',  hh: 1_200,  pct: 64, gl: 'Q1 2027', rag: 'Green',  capex: 4.8 },
  { p: 'Long Island Fibre overlay',            r: 'Long Island',    hh: 18_000, pct: 18, gl: 'Q4 2027', rag: 'Red',    capex: 12.4 },
  { p: 'Mid-split rollout',            r: 'National',   hh: 380_000, pct: 42, gl: 'Q2 2028', rag: 'Amber', capex: 22.6 },
]

const buildPipeline = [
  { stage: 'Permits granted', count: 124_000 },
  { stage: 'Design',          count: 96_000 },
  { stage: 'Civils',          count: 48_000 },
  { stage: 'Cable / splice',  count: 32_000 },
  { stage: 'Make-ready',      count: 18_000 },
  { stage: 'RFS handover',    count: 9_400 },
]

const footprintRegions = [
  { r: 'Nassau',      lat: 25.0443, lng: -77.3504, passed: 61102, take: 41, ftthShare: 32, gigShare: 71 },
  { r: 'Freeport',        lat: 26.5333, lng: -78.7, passed: 21059, take: 38, ftthShare: 22, gigShare: 64 },
  { r: 'Abaco',       lat: 26.5412, lng: -77.0636, passed: 12458,  take: 34, ftthShare: 41, gigShare: 78 },
  { r: 'Eleuthera',       lat: 25.1962, lng: -76.2431, passed: 10678,  take: 32, ftthShare: 18, gigShare: 58 },
  { r: 'Exuma',      lat: 23.5, lng: -75.7667, passed: 7119,  take: 31, ftthShare: 12, gigShare: 52 },
  { r: 'Bimini',     lat: 25.727, lng: -79.2972, passed: 4153,  take: 28, ftthShare: 8,  gigShare: 46 },
  { r: 'Andros',     lat: 24.7064, lng: -77.7902, passed: 3559,  take: 30, ftthShare: 14, gigShare: 50 },
  { r: 'San Salvador', lat: 24.036, lng: -74.494, passed: 3263,  take: 26, ftthShare: 10, gigShare: 44 },
  { r: 'Long Island',        lat: 23.25, lng: -75.1, passed: 9492,  take: 36, ftthShare: 18, gigShare: 60 },
  { r: 'Inagua',         lat: 20.95, lng: -73.6731, passed: 2669,  take: 32, ftthShare: 14, gigShare: 54 },
  { r: 'Mayaguana',     lat: 22.379, lng: -73.014, passed: 2373,  take: 30, ftthShare: 12, gigShare: 52 },
  { r: 'Nicholls Town',       lat: 25.145, lng: -78.002, passed: 2075,  take: 29, ftthShare: 16, gigShare: 56 },
]

// Capacity
const capacityHierarchy = [
  { tier: 'Headends',         count: 4,   util: 64, headroom: 36 },
  { tier: 'Hub sites',        count: 18,  util: 58, headroom: 42 },
  { tier: 'CMTS chassis',     count: 78,  util: 72, headroom: 28 },
  { tier: 'OLTs (XGS-PON/GPON)', count: 142, util: 48, headroom: 52 },
  { tier: 'Optical nodes',    count: 8_420, util: 78, headroom: 22 },
  { tier: 'Aggregation rtrs', count: 64,  util: 56, headroom: 44 },
  { tier: 'Backbone P routers', count: 18, util: 62, headroom: 38 },
]

const docsisMix = [
  { name: 'D3.0',         value: 8,  color: '#94a3b8' },
  { name: 'D3.1 mid-split', value: 38, color: RED4 },
  { name: 'D3.1 high-split', value: 28, color: RED2 },
  { name: 'D3.1 ESD',     value: 22, color: RED },
  { name: 'D4.0 trial',   value: 4,  color: RED5 },
]

const ftthMix = [
  { name: 'GPON 2.5/1.25', value: 64, color: RED4 },
  { name: 'XGS-PON 10/10', value: 32, color: RED },
  { name: '25G PON pilot', value: 4,  color: RED5 },
]

const subsPerPort = [
  { tier: 'Optical nodes',  current: 248, target: 200 },
  { tier: 'CMTS DS',        current: 412, target: 350 },
  { tier: 'CMTS US',        current: 142, target: 128 },
  { tier: 'GPON ports',     current: 28,  target: 32 },
  { tier: 'XGS-PON ports',  current: 18,  target: 32 },
]

const augQueue = [
  { site: 'Abaco · CMTS-04',      action: 'Node split (4-way)',    capexK: 96, daysLeft: 28,  unlock: '+820 subs', status: 'Approved' },
  { site: 'San Salvador · OLT-01', action: 'OLT shelf expansion',   capexK: 142, daysLeft: 42, unlock: '+1.4K subs', status: 'Approved' },
  { site: 'Freeport · CMTS-12',      action: 'Channel bonding (D3.1)', capexK: 38, daysLeft: 56, unlock: '+560 subs', status: 'Planning' },
  { site: 'Nassau N · CMTS-22',  action: 'Node augment',           capexK: 78, daysLeft: 71, unlock: '+1.1K subs', status: 'Planning' },
  { site: 'Bimini · OLT-02',      action: 'OLT shelf',              capexK: 124, daysLeft: 88, unlock: '+820 subs', status: 'Forecast' },
  { site: 'Inagua · CMTS-08',  action: 'Channel bonding',        capexK: 24, daysLeft: 102, unlock: '+320 subs', status: 'Forecast' },
]

const exhaustForecast = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  hfc: 76 + i * 1.6,
  ftth: 48 + i * 0.9,
  bb: 62 + i * 1.2,
}))

// Backbone & Peering
const pops = [
  { p: 'Nassau Central',    lat: 25.0443,  lng: -77.3504, role: 'Core',     util: 64, status: 'Healthy' },
  { p: 'Nassau Eastern',     lat: 25.0443, lng: -77.3504, role: 'Core',     util: 58, status: 'Healthy' },
  { p: 'Freeport Downtown',     lat: 26.5333,  lng: -78.7, role: 'Regional', util: 71, status: 'Healthy' },
  { p: 'Abaco Central',  lat: 26.5412,  lng: -77.0636, role: 'Regional', util: 78, status: 'Watch' },
  { p: 'Eleuthera Central',    lat: 25.1962,  lng: -76.2431, role: 'Regional', util: 62, status: 'Healthy' },
  { p: 'Long Island',              lat: 23.25,  lng: -75.1, role: 'Regional', util: 56, status: 'Healthy' },
  { p: 'Local peering Nassau',       lat: 25.0443,  lng: -77.3504, role: 'Peering',  util: 84, status: 'Hot' },
  { p: 'Miami transit (scenario)', lat: 25.762, lng: -80.192, role: 'Peering', util: 72, status: 'Healthy' },
  { p: 'Fort Lauderdale transit (scenario)', lat: 26.122, lng: -80.137, role: 'Peering', util: 64, status: 'Healthy' },
  { p: 'West Palm Beach transit (scenario)', lat: 26.715, lng: -80.054, role: 'Peering', util: 38, status: 'Healthy' },
]

const peeringTable = [
  { p: 'Local peering (Nassau IX)',   tput: 420, role: 'Peering',  cost: 0,    rpki: 100, top: 'Akamai · Google · Meta' },
  { p: 'DE-CIX Frankfurt',         tput: 180, role: 'Peering',  cost: 0,    rpki: 100, top: 'Cloudflare · Microsoft · AWS' },
  { p: 'AMS-IX Amsterdam',    tput: 110, role: 'Peering',  cost: 0,    rpki: 98,  top: 'Akamai · Steam · OVH' },
  { p: 'DE-CIX Frankfurt',    tput: 38,  role: 'Peering',  cost: 0,    rpki: 100, top: 'US CDN · gaming' },
  { p: 'Lumen Transit',       tput: 60,  role: 'Transit',  cost: 84,   rpki: 96,  top: 'Long-tail · IPv6' },
  { p: 'Cogent Transit',      tput: 40,  role: 'Transit',  cost: 48,   rpki: 88,  top: 'Long-tail · v4' },
  { p: 'Arelion Transit',     tput: 24,  role: 'Transit',  cost: 32,   rpki: 100, top: 'Backup · DDoS-clean' },
]

const cdnFills = [
  { cdn: 'Netflix Open Connect', tbps: 0.62, hit: 96, cacheTb: 4_800 },
  { cdn: 'Google GGC',            tbps: 0.42, hit: 94, cacheTb: 3_200 },
  { cdn: 'Akamai AANP',           tbps: 0.18, hit: 88, cacheTb: 1_600 },
  { cdn: 'Meta FNA',              tbps: 0.16, hit: 92, cacheTb: 1_400 },
  { cdn: 'Cloudflare',            tbps: 0.12, hit: 84, cacheTb: 800 },
  { cdn: 'Twitch / Amazon',       tbps: 0.06, hit: 76, cacheTb: 400 },
]

const trafficSplit = [
  { name: 'Off-net peering', value: 64, color: RED },
  { name: 'On-net CDN cache', value: 28, color: '#10b981' },
  { name: 'Transit',          value: 8, color: RED4 },
]

const linkUtilTop = [
  { link: 'Nassau CW ↔ Eastern (4×400G)',        util: 78, headroom: 22 },
  { link: 'Nassau CW ↔ Freeport Downtown (2×400G)', util: 72, headroom: 28 },
  { link: 'Nassau ↔ Local peering (8×100G)',               util: 84, headroom: 16 },
  { link: 'Nassau ↔ LINX (2×100G submarine)',      util: 71, headroom: 29 },
  { link: 'Freeport ↔ Eleuthera (2×100G)',               util: 56, headroom: 44 },
  { link: 'Abaco ↔ Nicholls Town (2×100G)',              util: 64, headroom: 36 },
  { link: 'Long Island ↔ Nassau (2×100G)',              util: 58, headroom: 42 },
]

// CPE & WiFi
const cpeFleet = [
  { model: 'Wi-Fi 6 Pro',   share: 38, fwLatest: 86, repeatCalls: 4.2 },
  { model: 'Hub 4',    share: 28, fwLatest: 92, repeatCalls: 5.6 },
  { model: 'Hub 3',    share: 18, fwLatest: 78, repeatCalls: 8.4 },
  { model: 'WiFi pods (Tri)',  share: 64, fwLatest: 81, repeatCalls: 3.8 },
  { model: 'GPON ONT', share: 22, fwLatest: 96, repeatCalls: 2.1 },
  { model: 'XGS-PON ONT', share: 8, fwLatest: 98, repeatCalls: 1.4 },
]

const wifiBands = [
  { band: '2.4 GHz',   util: 78, interference: 64, mesh: 2.8 },
  { band: '5 GHz',     util: 62, interference: 38, mesh: 2.2 },
  { band: '6 GHz',     util: 28, interference: 8,  mesh: 1.4 },
]

const inHomeFault = [
  { cause: 'Hub firmware',          n: 38, fix: 'OTA push' },
  { cause: 'Channel interference',  n: 24, fix: 'Auto re-channel' },
  { cause: 'Mesh placement',        n: 18, fix: 'Tech visit / kit' },
  { cause: 'Cabling / splitter',    n: 12, fix: 'Tech truck roll' },
  { cause: 'Outside plant',         n: 8,  fix: 'Field engineer' },
]

// Reliability & Security
const slos = [
  { svc: 'Residential broadband', slo: 99.95, actual: 99.94, budget: 12.4, status: 'Burning' },
  { svc: 'B2B fibre',             slo: 99.99, actual: 99.97, budget: 64.2, status: 'Healthy' },
  { svc: 'Mobile (MVNO)',         slo: 99.90, actual: 99.88, budget: 22.8, status: 'Burning' },
  { svc: 'Hosted Voice',          slo: 99.95, actual: 99.96, budget: 84.1, status: 'Healthy' },
  { svc: 'IPTV / Stream',         slo: 99.90, actual: 99.92, budget: 92.4, status: 'Healthy' },
]

const drReadiness = [
  { svc: 'Core BNG',           rto: '< 15 min', rpo: '0',     lastTest: '12 Apr', result: 'Pass' },
  { svc: 'OSS / BSS',          rto: '< 1h',     rpo: '< 5m',  lastTest: '02 May', result: 'Pass' },
  { svc: 'Peering routers',    rto: '< 5 min',  rpo: '0',     lastTest: '21 Mar', result: 'Pass · partial' },
  { svc: 'Hosted Voice SBC',   rto: '< 30 min', rpo: '< 1m',  lastTest: '15 Feb', result: 'Pass' },
  { svc: 'Customer DB',        rto: '< 2h',     rpo: '< 10m', lastTest: '08 Jan', result: 'Re-test due' },
]

const ddosTrend = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  attacks: 12 + Math.round(Math.sin(i / 2) * 8 + scenarioRandom() * 6),
  mitigated: 12 + Math.round(Math.sin(i / 2) * 8 + scenarioRandom() * 6) - (scenarioRandom() > 0.8 ? 1 : 0),
  peakGbps: 84 + Math.round(Math.sin(i / 2) * 32 + scenarioRandom() * 24),
}))

const securityKpis = [
  { metric: 'RPKI ROV coverage',         value: 94, suffix: '%', good: true,  delta: '+6 pp YoY' },
  { metric: 'MANRS compliance',          value: 'Yes', suffix: '', good: true, delta: 'Passed audit' as string | number },
  { metric: 'DDoS scrubbing headroom',   value: 1.2, suffix: ' Tbps', good: true, delta: 'vs peak 0.42 Tbps' },
  { metric: 'BGP hijack alerts (open)',  value: 0,  suffix: '',  good: true,  delta: 'last 30 d' },
  { metric: 'Lawful intercept SLA',      value: 100, suffix: '%', good: true,  delta: 'URCA' },
  { metric: 'URCA cyber controls passing',     value: 96, suffix: '%', good: true,  delta: '4 minor open' },
]

// Roadmap
const roadmap = [
  { prog: 'DOCSIS 4.0 (FDX)',    rag: 'Green',  pct: 22, eta: 'Q2 2028', capex: 48, owner: 'Access' },
  { prog: 'XGS-PON full overlay', rag: 'Amber',  pct: 38, eta: 'Q4 2028', capex: 124, owner: 'Access' },
  { prog: '400G backbone refresh', rag: 'Green', pct: 64, eta: 'Q2 2027', capex: 38, owner: 'Backbone' },
  { prog: 'IPv6 dual-stack 100%',  rag: 'Amber', pct: 41, eta: 'Q4 2027', capex: 6,  owner: 'IP eng' },
  { prog: 'RPKI-only routing',     rag: 'Green', pct: 94, eta: 'Q1 2027', capex: 1,  owner: 'IP eng' },
  { prog: 'Wi-Fi 7 CPE',           rag: 'Amber', pct: 12, eta: 'Q3 2027', capex: 22, owner: 'CPE' },
  { prog: 'Open RAN trial',        rag: 'Red',   pct: 8,  eta: 'Q2 2028', capex: 14, owner: 'Mobile' },
  { prog: '25G PON pilot',         rag: 'Green', pct: 28, eta: 'Q1 2027', capex: 8,  owner: 'Access' },
]

const capexBreakdown = [
  { area: 'Footprint build (FTTH)',   v: 62, color: RED },
  { area: 'DOCSIS 3.1 / 4.0',         v: 28, color: RED2 },
  { area: 'Backbone / 400G',          v: 18, color: RED3 },
  { area: 'CPE / Wi-Fi',              v: 22, color: RED4 },
  { area: 'Mobile + Open RAN',        v: 14, color: RED5 },
  { area: 'Tooling / OSS',            v: 8,  color: '#94a3b8' },
  { area: 'Sustainability',           v: 6,  color: '#10b981' },
]

const vendorLifecycle = [
  { v: 'Cisco cBR-8 (CMTS)',         eos: 'Q2 2028', plan: 'Move to virtualised CMTS',    risk: 'Medium' },
  { v: 'Nokia 7750 SR',              eos: '—',       plan: 'Generation refresh planned',  risk: 'Low' },
  { v: 'Adtran SDX 6320 (OLT)',      eos: '—',       plan: 'Steady-state',                 risk: 'Low' },
  { v: 'CommScope ARRIS Hub 4',      eos: 'Q4 2026', plan: 'Migrate to Wi-Fi 6 Pro',           risk: 'Medium' },
  { v: 'Casa Systems CMTS (legacy)', eos: 'Q1 2026', plan: 'Decommission Q3',             risk: 'High' },
]

const cortexPrompts = [
  { q: 'Where should we build next quarter to maximise net-add NPV?',     sql: 'SELECT * FROM BUILD_NPV_RANKING WHERE quarter = NEXT_QUARTER LIMIT 20' },
  { q: 'Cheapest way to add 200 Gbps headroom in Nassau',                  sql: 'CALL plan_capacity_unlock(region=>\'NASSAU\', target_gbps=>200)' },
  { q: 'Forecast traffic on Local peering next 12 months',                          sql: 'SELECT * FROM IX_TRAFFIC_FORECAST WHERE ix = \'Local peering\'' },
  { q: 'Suggest channel-bonding sequence for Freeport CMTS-12',                sql: 'CALL plan_d31_bonding(cmts=>\'CMTS-12\', region=>\'freeport\')' },
  { q: 'List CPE models with worst repeat-call rate this month',           sql: 'SELECT cpe_model, repeat_call_rate FROM CPE_HEALTH ORDER BY 2 DESC LIMIT 5' },
  { q: 'Which build clusters can convert to FTTH cheapest?',               sql: 'SELECT * FROM FTTH_OVERLAY_NPV WHERE roi_months < 36' },
]

// ───────── energy / sustainability data ─────────
const energyByRegion = [
  { region: 'Nassau',    kwhM: 4.8, renewPct: 62, pue: 1.42, co2t: 3_840 },
  { region: 'Freeport', kwhM: 2.1, renewPct: 74, pue: 1.38, co2t: 1_480 },
  { region: 'Abaco',  kwhM: 1.4, renewPct: 68, pue: 1.45, co2t: 1_050 },
  { region: 'Eleuthera',   kwhM: 1.1, renewPct: 71, pue: 1.41, co2t: 810 },
  { region: 'Bimini',    kwhM: 0.7, renewPct: 58, pue: 1.49, co2t: 620 },
  { region: 'Long Island',  kwhM: 0.6, renewPct: 81, pue: 1.36, co2t: 310 },
]
const energyTrend = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  kwh: 10_800 - i * 120 + Math.round(Math.sin(i / 2) * 200),
  renew: 58 + Math.round(i * 1.8 + Math.sin(i / 3) * 3),
  co2: 8_640 - i * 210,
}))
const sustainInitiatives = [
  { prog: 'RAN sleep-mode scheduling',  saving: '14% kWh',  status: 'Live',        capex: 0.4, co2: -1_240 },
  { prog: 'Solar PV at 12 headends',    saving: '22% site', status: 'In build',    capex: 8.2, co2: -2_800 },
  { prog: 'Free-air cooling (DC)',       saving: '18% PUE',  status: 'Approved',    capex: 3.6, co2: -960 },
  { prog: '100% green tariff contract', saving: '—',        status: 'Negotiating', capex: 0,   co2: -18_000 },
  { prog: 'Legacy CMTS decommission',   saving: '8% kWh',   status: 'Q1 2026',     capex: 0,   co2: -640 },
  { prog: 'LED lighting · all sites',   saving: '3% kWh',   status: 'Complete',    capex: 1.2, co2: -240 },
]

// ───────── tabs ─────────
type TabId = 'foot' | 'cap' | 'mob' | 'back' | 'cpe' | 'rel' | 'road' | 'enrg'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'foot', label: 'Footprint & Build',       icon: Building2 },
  { id: 'cap',  label: 'Capacity',                icon: TrendingUp },
  { id: 'mob',  label: 'Mobile',                  icon: Smartphone },
  { id: 'back', label: 'Backbone & Peering',      icon: Globe },
  { id: 'cpe',  label: 'CPE & Wi-Fi',             icon: Wifi },
  { id: 'rel',  label: 'Reliability & Security',  icon: ShieldCheck },
  { id: 'road', label: 'Roadmap & AI',            icon: Brain },
  { id: 'enrg', label: 'Energy & Sustainability', icon: Leaf },
]

const ragColor = (r: string) => r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const sevColor = (s: string) => s === 'Hot' || s === 'Burning' || s === 'High' ? 'bg-red-100 text-red-700' : s === 'Watch' || s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const stPill = (s: string) => s === 'Approved' || s === 'Pass' || s === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : s === 'Planning' || s === 'Pass · partial' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
const FOOT_KEYS = ['passed', 'take', 'ftthShare', 'gigShare'] as const
const FOOT_LABELS: Record<typeof FOOT_KEYS[number], string> = { passed: 'Passed', take: 'Take rate', ftthShare: 'FTTH %', gigShare: 'Gig avail %' }

export default function NetworkPage() {
  const [tab, setTab] = useState<TabId>('foot')
  const [footMetric, setFootMetric] = useState<typeof FOOT_KEYS[number]>('passed')

  const footprintMarkers: MapMarker[] = useMemo(() => footprintRegions.map((r) => {
    const v = r[footMetric]
    let color = RED
    if (footMetric === 'passed') {
      color = v >= 100_000 ? '#10b981' : v >= 30_000 ? RED : RED4
    } else if (footMetric === 'take') {
      color = v >= 35 ? '#10b981' : v >= 30 ? '#f59e0b' : '#ef4444'
    } else if (footMetric === 'ftthShare') {
      color = v >= 25 ? '#10b981' : v >= 15 ? '#f59e0b' : '#ef4444'
    } else {
      color = v >= 60 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444'
    }
    const radius = footMetric === 'passed' ? 6 + Math.log10(Math.max(v, 1000)) * 4 : 6 + (v / 100) * 18
    return {
      name: r.r,
      lat: r.lat,
      lng: r.lng,
      radius,
      color,
      tooltip: `${r.r} · ${footMetric === 'passed' ? `${(v/1000).toFixed(0)}K HHs` : `${v}%`}`,
    }
  }), [footMetric])

  const popMarkers: MapMarker[] = useMemo(() => pops.map((p) => ({
    name: p.p,
    lat: p.lat,
    lng: p.lng,
    radius: p.role === 'Peering' ? 14 : p.role === 'Core' ? 12 : 10,
    color: p.status === 'Hot' ? '#ef4444' : p.status === 'Watch' ? '#f59e0b' : p.role === 'Peering' ? RED5 : RED,
    pulse: p.status === 'Hot',
    tooltip: `${p.p} · ${tt(p.role)} · util ${p.util}%`,
  })), [])

  const capacityMarkers: MapMarker[] = useMemo(() => augQueue.map((a, i) => {
    const reg = footprintRegions.find(r => a.site.toLowerCase().includes(r.r.toLowerCase().split(' ')[0])) || footprintRegions[i % footprintRegions.length]
    const days = a.daysLeft
    const color = days < 40 ? '#ef4444' : days < 70 ? '#f59e0b' : RED4
    return {
      name: a.site,
      lat: reg.lat + (scenarioRandom() - 0.5) * 0.1,
      lng: reg.lng + (scenarioRandom() - 0.5) * 0.1,
      radius: 8 + (100 / Math.max(days, 10)) * 1.6,
      color,
      pulse: days < 40,
      tooltip: `${a.site} · ${tt(a.action)} · ${days}d`,
    }
  }), [])

  const totalPeering = peeringTable.filter(p => p.role === 'Peering').reduce((s, p) => s + p.tput, 0)
  const totalTransit = peeringTable.filter(p => p.role === 'Transit').reduce((s, p) => s + p.tput, 0)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Network & Engineering')}
        subtitle={tt('Footprint · capacity · backbone · CPE · reliability · roadmap')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · 0.42 Tbps peak today
            </span>
          </div>
        }
      />

      <AgentDecision
        title="Capacity → CapEx — augmentation NPV"
        label="Rank augmentation by NPV"
        runningLabel="Modelling…"
        steps={[
          'Pulled 12-month exhaustion forecast per node',
          'Computed NPV / IRR per augmentation (revenue at risk vs capex)',
          'Ranked sites — funded top-decile, deferred negative-NPV',
          'Pushed approved list to CapEx committee',
        ]}
        hint="Turns the exhaustion forecast into a funded, ranked augmentation plan."
        result={{
          headline: 'Fund the top-decile augmentations; defer negative-NPV nodes',
          stats: [
            { label: 'Premises passed', value: `${headline.premisesPassed}M` },
            { label: 'Peak traffic', value: `${headline.peakTbps} Tbps` },
            { label: 'CapEx YTD', value: `BSD ${headline.capexYTD}M` },
            { label: 'Take rate', value: `${headline.takeRate}%` },
          ],
          findings: [
            'Several nodes hit exhaustion within 12 months.',
            'Prioritising by NPV (revenue-at-risk vs capex) funds the high-return sites first and defers low-value spend.',
          ],
          note: '+IRR on capex · protects at-risk revenue',
        }}
        impact="+IRR on capex · protects at-risk revenue"
        risk="deferred nodes need monitoring for SLA breach"
        linkTo="#/portal/assurance"
        linkLabel="Open Service Assurance"
      />

      {/* live alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Capacity watch · Local peering peering 84% · Abaco POP 78%')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Forecast exhaustion <span className="font-bold">{tt('28 days')}</span> on Abaco CMTS-04 · augment approved BSD 96K ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('unlocks +820 subs')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('RPKI 94%')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('v6 41%')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open Capacity →')}</button>
        </div>
      </div>

      {/* Related cockpits — static portal links (not in a map) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/portal/network"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Network')}</Link>
        <Link to="/portal/mobile-ran"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Mobile RAN')}</Link>
        <Link to="/portal/core-5g"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Core 5G')}</Link>
        <Link to="/portal/transport"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Transport')}</Link>
        <Link to="/portal/spectrum"       className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Spectrum')}</Link>
        <Link to="/portal/fixed-access"   className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Fixed Access')}</Link>
        <Link to="/portal/ran-energy"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('RAN Energy')}</Link>
        <Link to="/portal/capacity-capex" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Capacity & CapEx')}</Link>
        <Link to="/portal/inventory"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Inventory')}</Link>
        <Link to="/portal/coverage"       className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Coverage')}</Link>
        <Link to="/portal/assurance"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Assurance')}</Link>
        <Link to="/portal/noc-map"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('NOC Map')}</Link>
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

      {/* ═══════ FOOTPRINT & BUILD ═══════ */}
      {tab === 'foot' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Premises passed')}  value={`${headline.premisesPassed}M`}        delta={`vs ${headline.premisesTarget}M EOY`} trend="up"   icon={Building2} accent />
          <KpiCard label={tt('Take rate')}        value={`${headline.takeRate}%`}              delta="+2 pp QoQ"     trend="up" icon={Target} />
          <KpiCard label={tt('Gigabit available')} value={`${headline.gigAvail}%`}             delta="+3 pp"          trend="up" icon={Wifi} />
          <KpiCard label={tt('FTTH share')}       value={`${headline.ftthShare}%`}              delta="+4 pp YoY"     trend="up" icon={Cable} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CapEx YTD')}        value={`BSD ${headline.capexYTD}M`}              delta={`${Math.round(headline.capexYTD/headline.capexPlan*100)}% of plan`} trend="flat" icon={Server} />
          <KpiCard label={tt('CPHP')}             value={`BSD ${headline.cphp}`}                   delta="-BSD 18 vs LY"     trend="up" icon={ArrowUpRight} />
          <KpiCard label={tt('CPHC')}             value={`BSD ${headline.cphc}`}                   delta="payback 26 mo"  trend="up" icon={Award} />
          <KpiCard label={tt('HHs in build')}     value="124K"                                  delta="+18K vs LM"     trend="up" icon={Truck} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel
              title={tt('Footprint Map · Carto')}
              action={
                <div className="flex gap-1">
                  {FOOT_KEYS.map((k) => (
                    <button key={k} onClick={() => setFootMetric(k)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${footMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>{FOOT_LABELS[k]}</button>
                  ))}
                </div>
              }
            >
              <CartoMap markers={footprintMarkers} basemap="voyager" height={420} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Bubble size scales with metric · color = tier (good / watch / behind)')}</div>
            </Panel>
          </div>

          <Panel title={tt('Build Pipeline · This Quarter')}>
            <div className="space-y-2">
              {buildPipeline.map((s, i) => (
                <div key={s.stage} className="flex items-center gap-3 text-sm">
                  <div className="w-32 font-semibold text-xs">{s.stage}</div>
                  <div className="flex-1 h-7 bg-black/5 rounded">
                    <div className="h-full bg-gradient-to-r from-vfes-red-dark to-vfes-red rounded flex items-center justify-end pr-2 text-[10px] text-vfes-dark font-bold" style={{ width: `${(s.count / buildPipeline[0].count) * 100}%`, opacity: 1 - i * 0.08 }}>
                      {s.count.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('RFS handover this Q · 9.4K HHs')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Build Velocity · HHs / week (plan vs actual)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={buildVelocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" name={tt('Actual HHs')} fill={RED} />
                  <Line type="monotone" dataKey="plan" name={tt('Plan')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('CapEx Breakdown · YTD')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={capexBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v">
                    {capexBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Build Programmes · RAG')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Programme')}</th>
                  <th>{tt('Region')}</th>
                  <th className="text-right">{tt('HHs')}</th>
                  <th className="text-right">{tt('Progress')}</th>
                  <th>{tt('Go-live')}</th>
                  <th className="text-right">{tt('CapEx')}</th>
                  <th>{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((p) => (
                  <tr key={p.p} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{p.p}</td>
                    <td className="text-xs text-vfes-dark/65">{p.r}</td>
                    <td className="text-right">{p.hh.toLocaleString()}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-black/5 rounded">
                          <div className="h-full bg-vfes-red rounded" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold">{p.pct}%</span>
                      </div>
                    </td>
                    <td className="text-xs">{p.gl}</td>
                    <td className="text-right font-bold">BSD {p.capex}M</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(p.rag)}`}>{p.rag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* RAN Builds — mobile site builds, refarm, Island Towers (demo) share */}
        <Panel title={tt('Mobile RAN Builds — this quarter')} action={<span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('MOBILE')}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Region')}</th>
                  <th className="px-3 py-2 text-right">{tt('New 5G sites')}</th>
                  <th className="px-3 py-2 text-right">{tt('Refarmed sites')}</th>
                  <th className="px-3 py-2 text-right">{tt('Island Towers (demo) shared')}</th>
                  <th className="px-3 py-2 text-right">{tt('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {RAN_BUILDS.map(r => (
                  <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{r.region}</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark">{r.new5gSites}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.refarmed}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.totemShared}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{r.new5gSites + r.refarmed + r.totemShared}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}
      {tab === 'cap' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg utilisation')}  value="64%" delta="+3 pp QoQ"        trend="down" icon={Activity} accent />
          <KpiCard label={tt('Augments queued')}   value={`${augQueue.length}`} delta="2 approved" trend="up"   icon={GitBranch} />
          <KpiCard label={tt('Worst exhaustion')}  value="28 d"                  delta="Abaco"     trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('5G peak Tbps')}      value="0.42 Tbps"             delta={tt('+18% YoY')} trend="up" icon={Smartphone} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cell congestion · top 1%')}    value="78%"     delta={tt('Nassau · Freeport peak')} trend="down" icon={Smartphone} />
          <KpiCard label={tt('5G TDD avg load')}              value="62%"     delta={tt('3500 MHz band')}    trend="flat" icon={Radio} />
          <KpiCard label={tt('4G FDD avg load')}              value="48%"     delta={tt('1800/2600 band')}    trend="up"   icon={Radio} />
          <KpiCard label={tt('DOCSIS 4.0 trial')}             value="1.2K HHs" delta="Andros"                trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Network Hierarchy · Headroom')}>
              <div className="space-y-2">
                {capacityHierarchy.map((c) => (
                  <div key={c.tier} className="flex items-center gap-3 text-sm">
                    <div className="w-44 font-semibold">{c.tier}</div>
                    <div className="w-12 text-right text-xs text-vfes-dark/65">×{c.count.toLocaleString()}</div>
                    <div className="flex-1 h-7 bg-black/5 rounded overflow-hidden flex">
                      <div className="h-full bg-vfes-red flex items-center pl-2 text-[10px] text-vfes-dark font-bold" style={{ width: `${c.util}%` }}>{c.util}%</div>
                      <div className="h-full bg-emerald-200 flex items-center justify-end pr-2 text-[10px] text-emerald-900 font-bold" style={{ width: `${c.headroom}%` }}>{c.headroom}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-vfes-dark/55">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-vfes-red rounded-sm" />{tt('In use')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-200 rounded-sm" />{tt('Headroom')}</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Capacity Hotspot Map')}>
            <CartoMap markers={capacityMarkers} basemap="positron" height={300} center={[24.7, -76.5]} zoom={6} />
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Pulsing = exhaustion &lt; 40 days')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('DOCSIS Mix · Footprint')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={docsisMix} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {docsisMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('FTTH Mix · Footprint')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={ftthMix} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {ftthMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Subs / Port vs Target')}>
            <div className="space-y-2">
              {subsPerPort.map((s) => (
                <div key={s.tier} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-xs">{s.tier}</span>
                    <span className={`font-bold ${s.current > s.target ? 'text-red-600' : 'text-emerald-600'}`}>{s.current} / {s.target}</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded mt-1">
                    <div className={`h-full rounded ${s.current > s.target ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((s.current / s.target) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Exhaustion Forecast · 12 Mo')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={exhaustForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hfc" name={tt('HFC nodes')} stroke={RED} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="ftth" name={tt('FTTH OLTs')} stroke="#10b981" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="bb" name={tt('Backbone')} stroke={DARK} strokeWidth={2} dot />
                  <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Augmentation Queue · CapEx Unlock')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Site')}</th>
                    <th>{tt('Action')}</th>
                    <th className="text-right">{tt('CapEx')}</th>
                    <th className="text-right">{tt('Days')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {augQueue.map((a) => (
                    <tr key={a.site} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{a.site}</td>
                      <td className="text-xs">{tt(a.action)}</td>
                      <td className="text-right font-bold">BSD {a.capexK}K</td>
                      <td className={`text-right ${a.daysLeft < 40 ? 'text-red-600 font-bold' : a.daysLeft < 70 ? 'text-amber-600' : ''}`}>{a.daysLeft}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stPill(a.status)}`}>{tt(a.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ MOBILE (snapshot — full page at /portal/mobile-ran) ═══════ */}
      {tab === 'mob' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('5G population coverage')} value={`${NET.cov5gPop}%`} delta={tt('+3.4 pp YoY')} trend="up" icon={Smartphone} accent />
          <KpiCard label={tt('4G population coverage')} value={`${NET.cov4gPop}%`} delta={tt('best-in-class')} trend="flat" icon={Activity} />
          <KpiCard label={tt('Active cell sites')} value={NET.activeSites.toLocaleString('en-BS')} delta={`${(NET.ownedSites/1000).toFixed(1)}K ${tt('owned')} · ${(NET.sharedSites/1000).toFixed(1)}K ${tt('shared Island Towers (demo)')}`} trend="flat" icon={Radio} />
          <KpiCard label={tt('Avg DL throughput')} value="145 Mbps" delta={tt('+12% YoY')} trend="up" icon={TrendingUp} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Coverage by region (5G %)')}>
            <div className="space-y-2 text-sm">
              {[
                { r: 'Nassau', v: 96 }, { r: 'Freeport', v: 94 }, { r: 'Abaco', v: 88 },
                { r: 'Eleuthera', v: 91 }, { r: 'Exuma', v: 92 }, { r: 'Bimini', v: 82 },
              ].map(x => (
                <div key={x.r} className="flex items-center gap-2">
                  <span className="w-32 text-vfes-dark/70">{x.r}</span>
                  <div className="flex-1 h-1.5 rounded bg-black/5 overflow-hidden">
                    <div className="h-full rounded bg-vfes-red" style={{ width: `${x.v}%` }} />
                  </div>
                  <span className="font-mono w-12 text-right">{x.v}%</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={tt('MNO benchmark — Cable Bahamas vs competitors')}>
            <div className="space-y-2 text-sm">
              {[
                { m: tt('DL Throughput (Mbps)'), v: 145, c: 121 },
                { m: tt('5G Coverage (%)'), v: 89, c: 76 },
                { m: tt('MOS'), v: 4.21, c: 4.05 },
                { m: tt('Drop-call (%)'), v: 0.42, c: 0.62, lowerBetter: true },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-44 text-vfes-dark/70">{x.m}</span>
                  <span className="font-mono text-vfes-dark font-bold w-16 text-right">{x.v}</span>
                  <span className="text-xs text-vfes-dark/40 w-20 text-right">{tt('vs avg')} {x.c}</span>
                  <span className="text-emerald-600 text-xs font-bold">{(x.lowerBetter ? x.c > x.v : x.v > x.c) ? '✓ ' + tt('leading') : '—'}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Mobile RAN')}</div>
            <div className="text-sm">{tt('Spectrum, top cells, voice quality, vendor mix, mobile programmes — full operator-grade view.')}</div>
          </div>
          <Link to="/portal/mobile-ran" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2">
            {tt('Open Mobile RAN →')}
          </Link>
        </div>
      </>)}

      {/* ═══════ BACKBONE & PEERING ═══════ */}
      {tab === 'back' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Peak traffic')}      value={`${headline.peakTbps} Tbps`}      delta="+8% YoY"            trend="up"   icon={Cable} accent />
          <KpiCard label={tt('Peering capacity')}  value={`${(totalPeering/1000).toFixed(2)} Tbps`} delta={`${peeringTable.filter(p=>p.role==='Peering').length} IXPs`} trend="up" icon={Globe} />
          <KpiCard label={tt('Transit capacity')}  value={`${totalTransit} Gbps`}            delta={`${peeringTable.filter(p=>p.role==='Transit').length} carriers`} trend="flat" icon={Send} />
          <KpiCard label={tt('Off-net cost / Mbps')} value="BSD 0.18"                          delta="-12% YoY"           trend="up"   icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('POP & Peering Map · Carto (Bahamas + Florida)')}>
              <CartoMap markers={popMarkers} basemap="voyager" height={420} center={[24.7, -76.5]} zoom={5} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />{tt('Core')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />{tt('Regional')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED5 }} />{tt('Peering (IXP)')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{tt('Watch')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('Hot')}</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('National Traffic · 24h')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={trafficNational}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="h" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cdn" name={tt('CDN cache')} stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="gbps" name={tt('Total')} stackId="2" stroke={RED} fill={RED} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="transit" name={tt('Transit')} stackId="3" stroke={RED4} fill={RED4} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Peering & Transit · Scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="py-2">{tt('Provider')}</th>
                      <th>{tt('Role')}</th>
                      <th className="text-right">{tt('Throughput')}</th>
                      <th className="text-right">{tt('Cost / mo')}</th>
                      <th className="text-right">{tt('RPKI')}</th>
                      <th>{tt('Top traffic')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peeringTable.map((p) => (
                      <tr key={p.p} className="border-t border-black/5">
                        <td className="py-2.5 font-semibold">{p.p}</td>
                        <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.role === 'Peering' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(p.role)}</span></td>
                        <td className="text-right font-bold">{p.tput} Gbps</td>
                        <td className="text-right">{p.cost > 0 ? `BSD ${p.cost}K` : '—'}</td>
                        <td className={`text-right text-xs ${p.rpki >= 95 ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>{p.rpki}%</td>
                        <td className="text-xs text-vfes-dark/65">{p.top}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Traffic Split')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={trafficSplit} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {trafficSplit.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-vfes-dark/55 mt-1">CDN on-net <span className="font-bold text-emerald-600">28%</span>{tt('· saves est. BSD 1.4M/yr transit')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('CDN Cache Fills · On-net')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('CDN')}</th>
                    <th className="text-right">{tt('Tbps served')}</th>
                    <th className="text-right">{tt('Hit ratio')}</th>
                    <th className="text-right">{tt('Cache TB')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cdnFills.map((c) => (
                    <tr key={c.cdn} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{c.cdn}</td>
                      <td className="text-right font-bold">{c.tbps}</td>
                      <td className={`text-right ${c.hit >= 92 ? 'text-emerald-600 font-bold' : ''}`}>{c.hit}%</td>
                      <td className="text-right text-xs">{c.cacheTb.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Top Backbone Links · Utilisation')}>
            <div className="space-y-2">
              {linkUtilTop.map((l) => (
                <div key={l.link} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-xs">{l.link}</span>
                    <span className={`font-bold ${l.util >= 80 ? 'text-red-600' : l.util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{l.util}%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded mt-1">
                    <div className={`h-full rounded ${l.util >= 80 ? 'bg-red-500' : l.util >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${l.util}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Nassau ↔ Local peering flagged for capacity expansion (4×100G → 8×100G)')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CPE & WI-FI ═══════ */}
      {tab === 'cpe' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('CPE devices in fleet')}  value="1.6M"  delta="+24K vs LM"      trend="up"   icon={Wifi} accent />
          <KpiCard label={tt('On latest firmware')}     value="84%"   delta="+6 pp QoQ"       trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Wi-Fi 6E adoption')}      value="38%"   delta="Wi-Fi 6 Pro rollout"  trend="up"   icon={Sparkles} />
          <KpiCard label={tt('In-home repeat-call')}    value="4.2%"  delta="-1.4 pp QoQ"     trend="up"   icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('CPE Fleet · Health')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Model')}</th>
                    <th className="text-right">{tt('Share')}</th>
                    <th className="text-right">{tt('Latest FW')}</th>
                    <th className="text-right">{tt('Repeat-call')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cpeFleet.map((c) => (
                    <tr key={c.model} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{c.model}</td>
                      <td className="text-right">{c.share}%</td>
                      <td className={`text-right font-bold ${c.fwLatest >= 90 ? 'text-emerald-600' : c.fwLatest >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{c.fwLatest}%</td>
                      <td className={`text-right ${c.repeatCalls > 5 ? 'text-amber-600 font-bold' : ''}`}>{c.repeatCalls}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Wi-Fi Bands · Channel Health')}>
            <div className="space-y-3">
              {wifiBands.map((b) => (
                <div key={b.band}>
                  <div className="flex items-center justify-between text-sm font-semibold mb-1">
                    <span>{b.band}</span>
                    <span className="text-xs text-vfes-dark/55">util {b.util}% · interference {b.interference} · mesh hops {b.mesh}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-3 bg-black/5 rounded">
                      <div className="h-full bg-vfes-red rounded" style={{ width: `${b.util}%` }} />
                    </div>
                    <div className="flex-1 h-3 bg-black/5 rounded">
                      <div className={`h-full rounded ${b.interference > 50 ? 'bg-red-500' : b.interference > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${b.interference}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-vfes-red rounded-sm" />{tt('Util')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-sm" />{tt('Interference')}</span>
            </div>
          </Panel>
        </div>

        <Panel title={tt('In-Home Fault Root Cause · This Month')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={inHomeFault} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="cause" tick={{ fontSize: 11 }} width={150} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" fill={RED} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('62% of in-home faults fixable via OTA push (firmware + auto re-channel) — zero truck roll')}</div>
        </Panel>
      </>)}

      {/* ═══════ RELIABILITY & SECURITY ═══════ */}
      {tab === 'rel' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SLOs healthy')}        value={`${slos.filter(s=>s.status==='Healthy').length} / ${slos.length}`} delta="2 burning"          trend="down" icon={ShieldCheck} accent />
          <KpiCard label={tt('DR readiness')}         value="4 / 5"   delta="1 re-test due"    trend="flat" icon={Calendar} />
          <KpiCard label={tt('DDoS scrubbing capacity')} value="800 Gbps" delta="vs peak 0.42"  trend="up"   icon={Zap} />
          <KpiCard label={tt('RPKI ROV coverage')}     value={`${headline.rpkiCoverage}%`} delta="MANRS audit passed" trend="up" icon={Globe} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('SLOs · Error Budget Burn')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Service')}</th>
                    <th className="text-right">{tt('SLO')}</th>
                    <th className="text-right">{tt('Actual')}</th>
                    <th className="text-right">{tt('Budget left')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {slos.map((s) => (
                    <tr key={s.svc} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{s.svc}</td>
                      <td className="text-right">{s.slo}%</td>
                      <td className={`text-right font-bold ${s.actual >= s.slo ? 'text-emerald-600' : 'text-red-600'}`}>{s.actual}%</td>
                      <td className={`text-right ${s.budget < 30 ? 'text-red-600 font-bold' : s.budget < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.budget.toFixed(1)}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('DR Readiness · Last Test')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Service')}</th>
                    <th>{tt('RTO')}</th>
                    <th>{tt('RPO')}</th>
                    <th>{tt('Last test')}</th>
                    <th>{tt('Result')}</th>
                  </tr>
                </thead>
                <tbody>
                  {drReadiness.map((d) => (
                    <tr key={d.svc} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{d.svc}</td>
                      <td className="text-xs">{d.rto}</td>
                      <td className="text-xs">{d.rpo}</td>
                      <td className="text-xs text-vfes-dark/65">{d.lastTest}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stPill(d.result)}`}>{d.result}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('DDoS Trend · Attacks vs Mitigated · Peak Gbps')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={ddosTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" Gbps" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="l" dataKey="attacks" name={tt('Attacks')} fill={RED4} />
                    <Bar yAxisId="l" dataKey="mitigated" name={tt('Mitigated')} fill={RED} />
                    <Line yAxisId="r" type="monotone" dataKey="peakGbps" name={tt('Peak Gbps')} stroke={DARK} strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Security Posture')}>
            <div className="space-y-2">
              {securityKpis.map((s) => (
                <div key={s.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${s.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold text-xs">{s.metric}</div>
                  <div className="font-bold">{s.value}{s.suffix}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('URCA cyber guidelines · lawful intercept')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ ROADMAP & AI ═══════ */}
      {tab === 'road' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active programmes')}  value={`${roadmap.length}`} delta="3 Green · 4 Amber · 1 Red" trend="up"   icon={GitBranch} accent />
          <KpiCard label={tt('CapEx unlock pending')} value="BSD 261M"             delta="multi-year"   trend="up"   icon={Server} />
          <KpiCard label={tt('EOL devices')}          value="3 platforms"        delta="1 critical"   trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Cortex queries / wk')}  value="284"                delta="+18% vs LW"   trend="up"   icon={Brain} />
        </div>

        <Panel title={tt('Engineering Roadmap · Programmes')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Programme')}</th>
                  <th>{tt('Owner')}</th>
                  <th className="text-right">{tt('Progress')}</th>
                  <th>{tt('ETA')}</th>
                  <th className="text-right">{tt('CapEx')}</th>
                  <th>{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {roadmap.map((r) => (
                  <tr key={r.prog} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{r.prog}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(r.owner)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-black/5 rounded">
                          <div className="h-full bg-vfes-red rounded" style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold">{r.pct}%</span>
                      </div>
                    </td>
                    <td className="text-xs">{r.eta}</td>
                    <td className="text-right font-bold">BSD {r.capex}M</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragColor(r.rag)}`}>{r.rag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mb-6 mt-6">
          <Panel title={tt('Vendor Lifecycle · EOS / EOL')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Vendor / Platform')}</th>
                    <th>{tt('EOS / EOL')}</th>
                    <th>{tt('Plan')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorLifecycle.map((v) => (
                    <tr key={v.v} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{v.v}</td>
                      <td className="text-xs">{v.eos}</td>
                      <td className="text-xs text-vfes-dark/65">{v.plan}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(v.risk)}`}>{v.risk}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Model Card · Capacity Forecast & Build NPV')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Capacity model')}</span><span className="font-mono text-xs">{tt('CAP_FCST_V3_1')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Build NPV model')}</span><span className="font-mono text-xs">{tt('BUILD_NPV_V2_4')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Last refresh')}</span><span className="font-bold">{tt('02:00 UTC')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Capacity MAPE')}</span><span className="font-bold text-emerald-600">5.4%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('NPV back-test R²')}</span><span className="font-bold">0.88</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('Network Analytics')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Governance')}</span><span className="font-bold text-emerald-600">{tt('Approved')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Snowflake ML Registry · Cortex Agent enabled · Event Table linked')}</div>
          </Panel>
        </div>

        <Panel title={tt('Cortex Analyst · Network Eng Prompts')}>
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
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('NETWORK_ENG_360')}</span>{tt('· Cortex Search: runbooks + design docs')}</div>
        </Panel>
      </>)}

      {/* ═══════ ENERGY & SUSTAINABILITY ═══════ */}
      {tab === 'enrg' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Energy · total kWh/mo')}   value="10.8M kWh" delta="-13% YoY"              trend="up"   icon={Leaf} accent />
          <KpiCard label={tt('Renewables mix')}           value="67%"       delta="+22 pp vs baseline"    trend="up"   icon={Zap} />
          <KpiCard label={tt('Avg PUE · national')}       value="1.42"      delta="-0.06 vs LY"           trend="up"   icon={Activity} />
          <KpiCard label={tt('Scope 2 CO₂ · tCO₂e/mo')}  value="8.1K t"    delta="-31% YoY"              trend="up"   icon={Globe} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SBTi pathway')}             value="1.5°C"     delta={tt('on track Q1 2027')} trend="up"  icon={ShieldCheck} />
          <KpiCard label={tt('Sleep-mode cells active')}  value="840"       delta={tt('+360 this month')}  trend="up"  icon={Sparkles} />
          <KpiCard label={tt('Solar PV installed')}       value="2.4 MWp"   delta={tt('12 headend sites')} trend="up"  icon={Zap} />
          <KpiCard label={tt('Energy cost · BSD M/mo')}      value="BSD 3.2M"     delta="-BSD 0.8M YoY"            trend="up"  icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Energy Consumption & Renewables Trend · 12 Mo')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={energyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="K" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="l" type="monotone" dataKey="kwh" name={tt('kWh (000s)')} stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  <Line yAxisId="r" type="monotone" dataKey="renew" name={tt('Renewables %')} stroke="#10B981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('kWh down 13% YoY · renewables mix up 22 pp · SBTi 1.5°C on track')}</div>
          </Panel>

          <Panel title={tt('Energy by Region · kWh / PUE / Renewables')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Region')}</th>
                    <th className="text-right">{tt('MWh/mo')}</th>
                    <th className="text-right">{tt('Renew %')}</th>
                    <th className="text-right">{tt('PUE')}</th>
                    <th className="text-right">{tt('CO₂ t/mo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {energyByRegion.map((e) => (
                    <tr key={e.region} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{e.region}</td>
                      <td className="text-right font-mono">{(e.kwhM * 1000).toLocaleString()}</td>
                      <td className={`text-right font-bold ${e.renewPct >= 70 ? 'text-emerald-600' : e.renewPct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{e.renewPct}%</td>
                      <td className={`text-right ${e.pue <= 1.40 ? 'text-emerald-600 font-bold' : e.pue <= 1.45 ? 'text-amber-600' : 'text-red-600'}`}>{e.pue}</td>
                      <td className="text-right text-vfes-dark/65">{e.co2t.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Sustainability Programme Tracker')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Initiative')}</th>
                  <th>{tt('Saving')}</th>
                  <th>{tt('Status')}</th>
                  <th className="text-right">{tt('CapEx BSD M')}</th>
                  <th className="text-right">{tt('CO₂ t/yr')}</th>
                </tr>
              </thead>
              <tbody>
                {sustainInitiatives.map((s) => (
                  <tr key={s.prog} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{tt(s.prog)}</td>
                    <td className="text-xs text-emerald-700 font-bold">{tt(s.saving)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${s.status === 'Live' || s.status === 'Complete' ? 'bg-emerald-100 text-emerald-700' : s.status === 'In build' || s.status === 'Approved' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(s.status)}</span></td>
                    <td className="text-right">{s.capex > 0 ? `BSD ${s.capex}M` : '—'}</td>
                    <td className={`text-right font-bold ${s.co2 < 0 ? 'text-emerald-600' : ''}`}>{s.co2 < 0 ? s.co2.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-black/5">
            <Link to="/portal/ran-energy"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-vfes-red/10 text-vfes-dark hover:bg-vfes-red/20">{tt('RAN Energy deep-dive →')}</Link>
            <Link to="/portal/operations"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('Operations')}</Link>
            <Link to="/portal/capacity-capex" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('Capacity & CapEx')}</Link>
            <Link to="/portal/cto"            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('CTO cockpit')}</Link>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('SBTi 1.5°C · Scope 1 + 2 · Annual report ready · ESG pipeline via Snowflake')}</div>
        </Panel>

        <div className="mt-6">
          <MlInsightSection
            heading={tt('Energy intelligence')}
            models={[
              { name: tt('Sleep-mode Scheduler'), metric: '−14% kWh',         sub: tt('RAN load-aware off-peak') },
              { name: tt('PUE Forecaster'),        metric: 'MAPE 3.8%',        sub: tt('cooling optimisation') },
              { name: tt('Carbon Accounting'),     metric: tt('Scope 2 live'), sub: tt('Snowflake ESG pipeline') },
            ]}
            agentLabel={tt('Run Energy Optimiser')}
            agentRunningLabel={tt('Optimising…')}
            agentSteps={[
              tt('Pulled 30-day RAN load profile per cell'),
              tt('Scheduled sleep-windows against SLA floor'),
              tt('Modelled PV yield vs site demand curves'),
              tt('Estimated CO₂ saving vs SBTi 1.5°C path'),
            ]}
            agentBlurb={tt('Combining RAN telemetry with energy metering in one Snowflake lake lets the model trade off coverage SLA against kWh at cell granularity.')}
            decision={{
              title: tt('Activate sleep-mode on 1 200 low-traffic cells — saves 14% kWh'),
              detail: tt('900 cells qualify immediately; 300 need a firmware push first. No SLA breach risk at the modelled sleep windows.'),
              impact: tt('BSD 840K/yr energy saving · −2 400 tCO₂e · on track for SBTi 1.5°C'),
              risk: tt('300 cells need firmware update before sleep-mode can activate'),
              linkTo: '/portal/ran-energy',
              linkLabel: tt('Open RAN Energy →'),
            }}
            chart={{
              kind: 'area' as const,
              title: tt('Energy consumption trend'),
              data: energyTrend,
              xKey: 'm',
              series: [
                { key: 'kwh',   name: tt('kWh (000s)'),    color: '#F59E0B' },
                { key: 'renew', name: tt('Renewables %'),  color: '#10B981', dashed: true },
              ],
              note: tt('kWh down 13% YoY · renewables mix up 22 pp'),
            }}
            registryNote={tt('ENERGY_OPT_V2 · Snowflake ML Registry · SBTi-aligned')}
          />
        </div>
      </>)}
    </div>
  )
}
