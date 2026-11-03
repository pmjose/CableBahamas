// =============================================================================
// Regulatory & ESG cockpit — CCO + CSO grade
// 10 tabs · Executive-style pill nav · URCA / DPA / cyber / AI governance
// Sustainability report / Climate / Nature / Social / Governance / Cases / Regulation 360
// =============================================================================
import { useState, useEffect, useMemo } from 'react'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import {
  Scale, Leaf, FileText, ShieldCheck, Activity, Award, Globe, Cpu, Cloud,
  AlertTriangle, CheckCircle, Clock, Target, Heart, Users, BarChart3, Calendar,
  MessageSquare, ChevronRight, FlaskConical, Radio, Zap, Database, Shield, Gavel,
  Lock, FileWarning, TreePine, Droplet, HeartHandshake, UserCheck, Building2, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { MOBILE_REGULATORY, MOBILE_ESG } from './_mobile_data'
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
const PIE = [RED, RED2, AMBER, BLUE, PURPLE, TEAL, GREEN, GREY, '#0ea5e9', '#f97316']

const sevColor: Record<string, string> = {
  Pass: 'bg-emerald-50 text-emerald-700', Watch: 'bg-amber-50 text-amber-700', Fail: 'bg-red-50 text-red-700',
  Low: 'bg-emerald-50 text-emerald-700', Medium: 'bg-amber-50 text-amber-700', High: 'bg-red-50 text-red-700', Critical: 'bg-red-100 text-red-800',
  Compliant: 'bg-emerald-50 text-emerald-700', 'On track': 'bg-blue-50 text-blue-700', 'At risk': 'bg-amber-50 text-amber-700', 'Non-compliant': 'bg-red-50 text-red-700',
}

const tabs = [
  { id: 'overview',  label: 'Overview',         icon: Activity },
  { id: 'comreg',    label: 'URCA & Telecom', icon: Radio },
  { id: 'privacy',   label: 'Privacy (DPA)',   icon: Lock },
  { id: 'cyber',     label: 'Cyber & URCA',     icon: Shield },
  { id: 'ai',        label: 'AI Governance',    icon: Cpu },
  { id: 'climate',   label: 'ESG · Climate',    icon: Leaf },
  { id: 'nature',    label: 'ESG · Nature & Social', icon: TreePine },
  { id: 'sustainability',      label: 'Sustainability & Ratings',   icon: FileText },
  { id: 'cases',     label: 'Cases & Audits',   icon: Gavel },
  { id: 'reg360',    label: 'Regulation 360',   icon: Award },
] as const
type TabId = typeof tabs[number]['id']

// =============================================================================
// DATA (synthetic, realistic for Cable Bahamas)
// =============================================================================
const comregQos = [
  { kpi: 'Complaints / 1,000 customers',         value: 1.84,  target: 2.0,  unit: '', dir: 'lower', status: 'Pass' },
  { kpi: 'Resolution within 10 working days',    value: 92,    target: 90,   unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: 'Service appointments kept',            value: 94,    target: 90,   unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: 'Provisioning time (days)',             value: 6.2,   target: 8,    unit: 'd', dir: 'lower', status: 'Pass' },
  { kpi: 'Repair time — fault clear (hours)',    value: 28,    target: 24,   unit: 'h', dir: 'lower', status: 'Watch' },
  { kpi: 'Mean answering time — operator (s)',   value: 22,    target: 30,   unit: 's', dir: 'lower', status: 'Pass' },
  { kpi: 'Faults reported / 100 lines',          value: 4.6,   target: 6,    unit: '', dir: 'lower', status: 'Pass' },
  { kpi: 'First-call resolution',                value: 78,    target: 75,   unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: 'Billing complaints / 1,000 bills',     value: 0.42,  target: 1.0,  unit: '', dir: 'lower', status: 'Pass' },
  { kpi: 'Switching code (number-transfer) success',        value: 96,    target: 95,   unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: 'Number portability SLA',               value: 99.4,  target: 99,   unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: '911/919 routing accuracy',             value: 99.98, target: 99.95, unit: '%', dir: 'higher', status: 'Pass' },
  { kpi: 'Mobile coverage (population %)',       value: 98.2,  target: 99,   unit: '%', dir: 'higher', status: 'Watch' },
  { kpi: 'NGA broadband coverage (premises %)',  value: 84,    target: 90,   unit: '%', dir: 'higher', status: 'Watch' },
  { kpi: 'Vulnerable-customer code adherence',   value: 100,   target: 100,  unit: '%', dir: 'higher', status: 'Pass' },
]

const smpMarkets = [
  { market: 'M1 (WLR-equiv Voice)',     status: 'Compliant',  risk: 'Low',    nextMilestone: '2026-09 review', evidence: 'EoI report Q2' },
  { market: 'M3a (FTTC wholesale)',     status: 'Compliant',  risk: 'Low',    nextMilestone: '2026-12 EoI test', evidence: 'KPI dashboard live' },
  { market: 'M3b (FTTH wholesale)',     status: 'On track',   risk: 'Medium', nextMilestone: '2026-08 margin-squeeze', evidence: 'Internal model' },
  { market: 'M4 (Leased lines)',        status: 'At risk',    risk: 'High',   nextMilestone: 'URCA case 26-04', evidence: 'Submission filed' },
  { market: 'USO claim',                status: 'On track',   risk: 'Medium', nextMilestone: '2026-10 decision',  evidence: 'BSD 8.2M claim' },
]

const spectrum = [
  { band: '700 MHz',     mhz: 60, expiry: '2037-04', annualFee: 4.2, coverage: '95% pop', use: 0.78 },
  { band: '800 MHz',     mhz: 60, expiry: '2030-12', annualFee: 3.8, coverage: '99% pop', use: 0.92 },
  { band: '900 MHz',     mhz: 70, expiry: '2030-12', annualFee: 2.6, coverage: '99% pop', use: 0.88 },
  { band: '1800 MHz',    mhz: 70, expiry: '2030-12', annualFee: 2.4, coverage: '90% pop', use: 0.84 },
  { band: '2.1 GHz',     mhz: 60, expiry: '2030-12', annualFee: 2.2, coverage: '85% pop', use: 0.74 },
  { band: '2.6 GHz',     mhz: 110, expiry: '2030-12', annualFee: 1.8, coverage: '70% pop', use: 0.62 },
  { band: '3.6 GHz (5G)', mhz: 100, expiry: '2032-12', annualFee: 5.4, coverage: '74% pop', use: 0.56 },
  { band: '26 GHz (mmWave)', mhz: 800, expiry: '2034-06', annualFee: 1.2, coverage: 'Urban hotspots', use: 0.18 },
]

const euTelcoStack = [
  { reg: 'Communications Act 2009', status: 'Compliant',    nextDeadline: '2026-06 audit', owner: 'Reg Affairs', evidence: 'Contract summaries live' },
  { reg: 'Roam-Like-At-Home (Reg 2022/612)', status: 'Compliant',   nextDeadline: 'Ongoing',       owner: 'Reg Affairs', evidence: 'Roaming policy' },
  { reg: 'Open Internet (Reg 2015/2120)',    status: 'Compliant',   nextDeadline: '2026-12 BEREC report', owner: 'Reg Affairs', evidence: 'Annual transparency' },
  { reg: 'eIDAS 2.0 (digital identity)',     status: 'On track',    nextDeadline: '2027-05 wallet ready', owner: 'Identity team', evidence: 'POC live' },
  { reg: 'Data Act (IoT/CPE data sharing)',  status: 'On track',    nextDeadline: '2025-09 in force',     owner: 'Data team',     evidence: 'API roadmap' },
  { reg: 'CER Directive (critical infra)',   status: 'On track',    nextDeadline: '2026-10 register',     owner: 'Resilience',    evidence: 'Asset list submitted' },
  { reg: 'CRA (Cyber Resilience Act CPE)',   status: 'At risk',     nextDeadline: '2027-12 in force',     owner: 'Product',       evidence: 'Gap assessment Q3' },
  { reg: 'DSA (Digital Services Act)',       status: 'Compliant',   nextDeadline: 'Annual',                owner: 'Legal',         evidence: 'Trust & safety report' },
]

const dsarPipeline = [
  { stage: 'Received', count: 142, agedAvg: 0 },
  { stage: 'Triaged',  count: 86,  agedAvg: 2 },
  { stage: 'In progress', count: 64, agedAvg: 8 },
  { stage: 'Awaiting customer', count: 18, agedAvg: 14 },
  { stage: 'Closed (last 30d)', count: 132, agedAvg: 12 },
]

const dpcRights = [
  { right: 'Access (Art. 15)',       n: 142, sla: 30, breached: 2 },
  { right: 'Erasure (Art. 17)',      n:  86, sla: 30, breached: 0 },
  { right: 'Rectification (Art. 16)',n:  64, sla: 30, breached: 1 },
  { right: 'Portability (Art. 20)',  n:  18, sla: 30, breached: 0 },
  { right: 'Restriction (Art. 18)',  n:  12, sla: 30, breached: 0 },
  { right: 'Objection (Art. 21)',    n:  44, sla: 30, breached: 0 },
]

const breachRegister = [
  { id: 'BR-26-001', date: '2026-04-12', sev: 'Low', records: 142,  type: 'Misdirected email', dpc72h: true,  status: 'Closed' },
  { id: 'BR-26-002', date: '2026-04-22', sev: 'Medium', records: 4200, type: 'Vendor processor leak', dpc72h: true, status: 'Investigating' },
  { id: 'BR-26-003', date: '2026-05-04', sev: 'Low', records: 28,   type: 'Internal mis-routing', dpc72h: false, status: 'Closed' },
  { id: 'BR-26-004', date: '2026-05-18', sev: 'Low', records: 6,    type: 'Loss of device', dpc72h: false, status: 'Closed' },
]

const dpiaPipeline = [
  { dpia: 'AI Agent Assist (Customer Care)', risk: 'High', stage: 'Mitigations agreed',  owner: 'Emma Rolle' },
  { dpia: 'Churn-risk model (Snowpark ML)',  risk: 'Medium', stage: 'Review',             owner: 'Sofie Bain' },
  { dpia: 'Fibre install drone imaging',     risk: 'Medium', stage: 'Draft',              owner: 'Lars Adderley' },
  { dpia: 'Smart-home IoT ingestion',        risk: 'High', stage: 'Mitigations agreed',  owner: 'Britt Vermeulen' },
  { dpia: 'Cookie consent re-platforming',   risk: 'Low',  stage: 'Approved',            owner: 'Emma Rolle' },
  { dpia: 'Programmatic ad re-targeting',    risk: 'Medium', stage: 'Draft',             owner: 'Femke Ferguson' },
]

const transferPosture = [
  { country: 'United States',    mechanism: 'Cross-border transfer clauses', tia: 'Done', volume: 'High',   review: '2026-12' },
  { country: 'United Kingdom',   mechanism: 'Adequacy',          tia: 'N/A',  volume: 'High',   review: '2027-06' },
  { country: 'India',            mechanism: 'SCCs + supplementary', tia: 'Done', volume: 'Medium', review: '2026-10' },
  { country: 'Switzerland',      mechanism: 'Adequacy',          tia: 'N/A',  volume: 'Low',    review: '2027-06' },
  { country: 'Israel',           mechanism: 'Adequacy',          tia: 'N/A',  volume: 'Low',    review: '2027-06' },
]

const cookieConsent = [
  { type: 'All accepted',     pct: 0.62 },
  { type: 'Necessary only',   pct: 0.24 },
  { type: 'Custom',           pct: 0.10 },
  { type: 'No interaction',   pct: 0.04 },
]

const nis2Incidents = [
  { id: 'INC-26-014', sev: 'Medium', service: 'Mobile core',  reportable: true,  clock24h: 'Met',     clock72h: 'Met',     status: 'Closed',  detail: 'Signalling-storm — partial degradation 38min' },
  { id: 'INC-26-021', sev: 'Low',    service: 'OSS portal',   reportable: false, clock24h: '—',       clock72h: '—',       status: 'Closed',  detail: 'Auth outage 14min — internal only' },
  { id: 'INC-26-029', sev: 'High',   service: 'IPTV CDN',     reportable: true,  clock24h: 'Met',     clock72h: 'Pending', status: 'Open',    detail: 'CDN poisoning attempt blocked — investigation' },
  { id: 'INC-26-033', sev: 'Critical', service: 'BSS billing', reportable: true,  clock24h: 'Met',     clock72h: 'Met',     status: 'Lessons-learned', detail: '3rd-party SQLi — patched, no exfil' },
]

const cyberPosture = {
  pentest: { last: '2026-03-18', critOpen: 0, highOpen: 4, mediumOpen: 22, vendor: 'KPMG' },
  vuln: { p1Backlog: 2, p2Backlog: 18, p3Backlog: 142, mttrP1Days: 4 },
  phish: { simRate: 0.082, trainComplete: 0.94, repeatOffenders: 38 },
  secScore: 786, // /1000
  bcDrill: '2026-02-18',
  isoCert: { iso27001: '2027-04', iso22301: '2026-11', soc2: '2026-09' },
}

const aiSystems = [
  { name: 'Churn-risk score',         risk: 'Limited',     useCase: 'Retention targeting',    status: 'Live',     drift: 'Low',    bias: 'Pass',  card: true,  oversight: 'Human-in-loop' },
  { name: 'Bundle propensity',        risk: 'Limited',     useCase: 'Marketing offers',       status: 'Live',     drift: 'Low',    bias: 'Pass',  card: true,  oversight: 'Human-in-loop' },
  { name: 'Agent assist (LLM)',       risk: 'High',        useCase: 'Customer care',          status: 'Pilot',    drift: 'Medium', bias: 'Watch', card: true,  oversight: 'Always-on review' },
  { name: 'Network anomaly detection',risk: 'Minimal',     useCase: 'Ops alerting',           status: 'Live',     drift: 'Low',    bias: 'N/A',   card: true,  oversight: 'Engineer review' },
  { name: 'Fraud scoring',            risk: 'High',        useCase: 'Account opening',        status: 'Live',     drift: 'Low',    bias: 'Pass',  card: true,  oversight: 'Human-in-loop' },
  { name: 'Field-engineer route opt', risk: 'Limited',     useCase: 'Workforce mgmt',         status: 'Live',     drift: 'Low',    bias: 'N/A',   card: true,  oversight: 'Manager review' },
  { name: 'CV claim image triage',    risk: 'Limited',     useCase: 'Damage assessment',      status: 'Pilot',    drift: 'Medium', bias: 'Watch', card: false, oversight: 'Human-in-loop' },
  { name: 'Recommender (TV/streaming)',risk: 'Minimal',    useCase: 'Content discovery',      status: 'Live',     drift: 'Medium', bias: 'Pass',  card: true,  oversight: 'Periodic review' },
]

// Climate
const ghgInventory = [
  { scope: 'Scope 1',          ktCo2e: 4.2,  yoy: -0.18, target2030: 1.4 },
  { scope: 'Scope 2 (location)',ktCo2e: 38.4, yoy: -0.12, target2030: 0 },
  { scope: 'Scope 2 (market)', ktCo2e: 8.6,  yoy: -0.42, target2030: 0 },
  { scope: 'Scope 3',          ktCo2e: 218.6,yoy: -0.06, target2030: 110.0 },
]
const scope3Cats = [
  { cat: 'Cat 1 — Purchased goods',   v: 84.4 },
  { cat: 'Cat 2 — Capital goods',     v: 38.2 },
  { cat: 'Cat 3 — Fuel & energy',     v: 12.8 },
  { cat: 'Cat 4 — Upstream transport',v:  8.6 },
  { cat: 'Cat 5 — Waste',             v:  2.4 },
  { cat: 'Cat 6 — Business travel',   v:  3.2 },
  { cat: 'Cat 7 — Commuting',         v:  6.8 },
  { cat: 'Cat 11 — Use of products',  v: 56.4 },
  { cat: 'Cat 12 — End-of-life',      v:  3.6 },
  { cat: 'Other (8/9/10/13/14/15)',  v:  2.2 },
]
const energyMix = [
  { src: 'PPA wind (Freeport)',     pct: 0.42 },
  { src: 'PPA solar (Exuma)', pct: 0.18 },
  { src: 'REGOs',               pct: 0.18 },
  { src: 'Grid (residual)',      pct: 0.20 },
  { src: 'On-site solar',        pct: 0.02 },
]
const decarbPath = Array.from({ length: 8 }, (_, i) => ({
  year: 2023 + i,
  actual: i <= 2 ? Math.round(56 - i * 6) : null,
  trajectory: Math.round(56 - i * 7),
  target: Math.round(56 - i * 8),
}))
const physRisk = [
  { hazard: 'Fluvial flood',  exposed: 8,  mitigated: 5,  capex: 2.4, scenarioBau: 14, scenario15c: 9 },
  { hazard: 'Coastal flood',  exposed: 4,  mitigated: 2,  capex: 1.8, scenarioBau: 8,  scenario15c: 5 },
  { hazard: 'Storm wind',     exposed: 22, mitigated: 18, capex: 0.8, scenarioBau: 28, scenario15c: 24 },
  { hazard: 'Heat (DC PUE)',  exposed: 3,  mitigated: 1,  capex: 4.2, scenarioBau: 6,  scenario15c: 4 },
  { hazard: 'Wildfire (rural)',exposed: 2, mitigated: 1,  capex: 0.4, scenarioBau: 4,  scenario15c: 3 },
]
const tcfdScenarios = [
  { scenario: '1.5°C orderly',  capexImpact: -8.4,  opexImpact: -3.2, revImpact: +2.4, npv: -2.4 },
  { scenario: '2°C delayed',    capexImpact: -14.2, opexImpact: -2.4, revImpact: +1.2, npv: -8.4 },
  { scenario: '3°C hothouse',   capexImpact: -22.6, opexImpact: +6.4, revImpact: -2.8, npv: -22.4 },
  { scenario: '4°C inaction',   capexImpact: -38.4, opexImpact: +14.2, revImpact: -8.6, npv: -42.8 },
]

// Nature
const circular = [
  { metric: 'CPE refurbished & redeployed', value: 0.62, target: 0.80 },
  { metric: 'E-waste recycled (tonnes)',     valueRaw: 142, targetRaw: 160, ratio: 0.89 },
  { metric: 'Recycled content in CPE',       value: 0.32, target: 0.50 },
  { metric: 'Repair-rate field swaps',       value: 0.74, target: 0.85 },
  { metric: 'Packaging plastic-free',        value: 0.86, target: 1.00 },
]
const water = [
  { site: 'Bimini DC1', m3: 18400, stress: 'Low' },
  { site: 'Bimini DC2', m3: 14200, stress: 'Low' },
  { site: 'Freeport DC',     m3:  3200, stress: 'Low' },
  { site: 'HQ',           m3:  1200, stress: 'Low' },
  { site: 'Long Island DC',     m3:   840, stress: 'Low' },
]
const nature = [
  { issue: 'Mast in SAC (Special Area of Conservation)', count: 12, mitigated: 10, status: 'On track' },
  { issue: 'Bird-strike risk towers',                    count: 38, mitigated: 32, status: 'On track' },
  { issue: 'Duct route through SPA',                     count:  6, mitigated:  4, status: 'Watch' },
  { issue: 'Riparian crossings',                         count: 14, mitigated: 12, status: 'On track' },
]
const social = {
  ownWorkforce: { headcount: 1840, attrition: 0.094, ltir: 0.42, accidents: 6, trainingHrs: 32 },
  payGap: { genderHourly: 0.082, genderBonus: 0.124, ethnic: 0.038 },
  diversity: { femaleLeadership: 0.42, target: 0.50, femaleAll: 0.38 },
  digitalInclusion: { householdsReached: 18400, broadbandTariff: 'Active', schools: 142 },
  vendorAudits: { audits: 86, findings: 12, criticalOpen: 1 },
}
const governance = {
  boardDiv: { female: 0.45, indep: 0.70, expertise: ['Telecom','Cyber','ESG','Finance','Tech','Public'] },
  antiCorr: { trainComplete: 0.97, giftsRegister: 142, whistleblower: 4 },
  lobbying: { spend: 0.18, donations: 0 }, // BSD m
  tax: { etr: 0.16, cbcRReady: true, taxStrategyPublished: true },
}

// Sustainability report / ratings
const csrdProgress = [
  { standard: 'ISSB 2 (General)', datapoints: 84,  done: 84,  assured: 80 },
  { standard: 'ISSB E1 (Climate)', datapoints: 220, done: 198, assured: 168 },
  { standard: 'ISSB E2 (Pollution)',datapoints: 32, done: 28,  assured: 22 },
  { standard: 'ISSB E3 (Water)',   datapoints: 38, done: 32,  assured: 28 },
  { standard: 'ISSB E4 (Bio)',     datapoints: 64, done: 42,  assured: 30 },
  { standard: 'ISSB E5 (Circular)',datapoints: 56, done: 46,  assured: 36 },
  { standard: 'ISSB S1 (Workforce)',datapoints: 142, done: 132, assured: 112 },
  { standard: 'ISSB S2 (Value chain)',datapoints: 64, done: 38, assured: 22 },
  { standard: 'ISSB S3 (Communities)',datapoints: 28, done: 22, assured: 12 },
  { standard: 'ISSB S4 (Consumers)',datapoints: 84, done: 72,  assured: 56 },
  { standard: 'ISSB G1 (Conduct)', datapoints: 42, done: 38,  assured: 32 },
]

const ratings = [
  { agency: 'CDP Climate',      score: 'A-',   peer: 'B',   trend: 'up' },
  { agency: 'CDP Water',        score: 'B',    peer: 'B',   trend: 'flat' },
  { agency: 'MSCI',             score: 'AA',   peer: 'A',   trend: 'up' },
  { agency: 'Sustainalytics',   score: '12.4', peer: '18.2', trend: 'up' },
  { agency: 'FTSE4Good',        score: 'IN',   peer: 'IN',  trend: 'flat' },
  { agency: 'DJSI',             score: '74',   peer: '62',  trend: 'up' },
  { agency: 'EcoVadis',         score: '78',   peer: '64',  trend: 'up' },
  { agency: 'ISS ESG',          score: 'B',    peer: 'C',   trend: 'flat' },
]

const taxonomy = {
  capex: { eligible: 0.74, aligned: 0.62 },
  opex:  { eligible: 0.62, aligned: 0.48 },
  rev:   { eligible: 0.86, aligned: 0.78 },
}

const doubleMateriality = [
  { topic: 'Climate change',           imp: 9, fin: 8, both: true },
  { topic: 'Cybersecurity & data',     imp: 8, fin: 9, both: true },
  { topic: 'Customer privacy',         imp: 9, fin: 7, both: true },
  { topic: 'Network resilience',       imp: 7, fin: 9, both: true },
  { topic: 'Workforce wellbeing',      imp: 7, fin: 6, both: false },
  { topic: 'Digital inclusion',        imp: 8, fin: 4, both: false },
  { topic: 'Circular economy',         imp: 6, fin: 5, both: false },
  { topic: 'Biodiversity (towers)',    imp: 5, fin: 3, both: false },
  { topic: 'AI ethics',                imp: 7, fin: 8, both: true },
  { topic: 'Tax transparency',         imp: 5, fin: 6, both: false },
  { topic: 'Anti-corruption',          imp: 6, fin: 7, both: true },
  { topic: 'Vendor labour rights',     imp: 7, fin: 5, both: false },
]

// Cases & audits
const openCases = [
  { id: 'CR-26-04', body: 'URCA', title: 'Margin-squeeze test M4 leased lines', sev: 'High',   filed: '2026-03-12', target: '2026-09-30', owner: 'Reg Affairs' },
  { id: 'ODPC-26-12',body: 'ODPC',    title: 'Cookie consent dark-pattern review',   sev: 'Medium', filed: '2026-04-02', target: '2026-08-15', owner: 'DPO' },
  { id: 'CR-26-09', body: 'URCA', title: 'Switching code number-transfer complaint volume', sev: 'Low',    filed: '2026-05-10', target: '2026-07-31', owner: 'Reg Affairs' },
  { id: 'CCPC-26-02',body: 'URCA',  title: 'Bundle-pricing transparency review',   sev: 'Medium', filed: '2026-02-18', target: '2026-09-15', owner: 'Legal' },
  { id: 'URCA-C-26-01',body: 'URCA',  title: 'URCA cyber attestation evidence pack',       sev: 'Medium', filed: '2026-04-22', target: '2026-10-31', owner: 'CISO' },
  { id: 'FSPO-26-03',body: 'Ombudsman',  title: 'B2B billing dispute (SMB)',            sev: 'Low',    filed: '2026-05-22', target: '2026-08-22', owner: 'Legal' },
]
const finesPaid = [
  { date: '2025-09-12', body: 'URCA', amt: 0.018, reason: 'Late QoS submission' },
  { date: '2025-11-04', body: 'ODPC',    amt: 0.085, reason: 'DSAR SLA breach (cohort)' },
  { date: '2026-02-22', body: 'JEP',   amt: 0.012, reason: 'Misleading speed claim' },
  { date: '2026-04-08', body: 'URCA',    amt: 0.024, reason: 'Auto-renewal disclosure' },
]
const audits = [
  { audit: 'ISO 27001 surveillance',   auditor: 'BSI',     date: '2026-09-14', status: 'Scheduled', findingsOpen: 2 },
  { audit: 'PCI DSS 4.0 ROC',          auditor: 'Verizon', date: '2026-10-22', status: 'In flight', findingsOpen: 6 },
  { audit: 'Sustainability limited assurance',   auditor: 'PwC',     date: '2026-12-01', status: 'In flight', findingsOpen: 18 },
  { audit: 'SOC 2 Type II',            auditor: 'EY',      date: '2026-09-08', status: 'In flight', findingsOpen: 4 },
  { audit: 'DPA external review',     auditor: 'Higgs & Johnson', date: '2026-11-12', status: 'Scheduled', findingsOpen: 0 },
  { audit: 'URCA cyber readiness',           auditor: 'Deloitte',date: '2026-08-20', status: 'In flight', findingsOpen: 8 },
]

// Reporting calendar
const calendar = [
  { name: 'Annual Report (FY26)',          due: '2026-09-30', owner: 'IR',     status: 'On track' },
  { name: 'Sustainability/Sustainability report Report',    due: '2026-09-30', owner: 'CSO',    status: 'On track' },
  { name: 'TCFD disclosures',              due: '2026-09-30', owner: 'CSO',    status: 'On track' },
  { name: 'CDP Climate response',          due: '2026-07-31', owner: 'CSO',    status: 'In flight' },
  { name: 'Gender Pay Gap (The Bahamas)',      due: '2026-12-23', owner: 'CHRO',   status: 'On track' },
  { name: 'Modern Slavery statement',      due: '2027-03-31', owner: 'Legal',  status: 'Tracking' },
  { name: 'Tax Transparency Report',       due: '2026-12-15', owner: 'CFO',    status: 'On track' },
  { name: 'URCA QoS submission',         due: '2026-07-31', owner: 'RegA',   status: 'On track' },
  { name: 'URCA cyber register update',          due: '2026-10-31', owner: 'CISO',   status: 'In flight' },
  { name: 'Climate-resilience capex share',         due: '2026-09-30', owner: 'CFO',    status: 'In flight' },
]

// Regulation 360 catalog
const regCatalog = [
  { code: 'URCA cyber',  name: 'URCA Cybersecurity Guidelines',        body: 'URCA',   inForce: '2024-10', status: 'On track', owner: 'CISO' },
  { code: 'Sustainability report',  name: 'ISSB / BISX',                    body: 'ISSB',inForce: '2025-01', status: 'On track', owner: 'CSO' },
  { code: 'DPA',  name: 'Data Protection Act 2003',           body: 'ODPC',   inForce: '2003-04', status: 'Compliant', owner: 'DPO' },
  { code: 'AIACT', name: 'AI governance policy',                      body: 'Board',     inForce: '2026-08', status: 'On track', owner: 'AI Governance' },
  { code: 'CBOB IT risk',  name: 'CBOB IT risk guidelines (bank customers)',     body: 'CBOB',     inForce: '2025-01', status: 'On track', owner: 'CISO' },
  { code: 'Comms Act 2009',  name: 'Communications Act 2009', body: 'URCA', inForce: '2022-06', status: 'Compliant', owner: 'Reg Affairs' },
  { code: 'CPE',   name: 'URCA type approval (CPE)',       body: 'URCA',   inForce: '2027-12', status: 'At risk',  owner: 'Product' },
  { code: 'NEMA',  name: 'Critical infrastructure & hurricane resilience', body: 'NEMA',   inForce: '2026-10', status: 'On track', owner: 'Resilience' },
  { code: 'TAX',   name: 'Climate resilience',                    body: 'BISX',     inForce: '2022-01', status: 'On track', owner: 'CFO' },
  { code: 'ETA',   name:'Electronic Communications & Transactions Act', body: 'Govt',     inForce: '2025-09', status: 'On track', owner: 'Data team' },
]

const regControls: Record<string, { control: string; status: 'Pass' | 'Watch' | 'Fail'; evidence: string; owner: string }[]> = {
  'URCA cyber': [
    { control: 'Risk-management framework',       status: 'Pass',  evidence: 'ISMS 2026.1 approved', owner: 'CISO' },
    { control: 'Incident reporting <24h / <72h',  status: 'Pass',  evidence: '4/4 met YTD',        owner: 'SOC' },
    { control: 'Supply-chain security',           status: 'Watch', evidence: '38 vendors pending', owner: 'Procure' },
    { control: 'Vulnerability handling',          status: 'Pass',  evidence: 'P1 MTTR 4d',         owner: 'CISO' },
    { control: 'BCM & crisis management',         status: 'Pass',  evidence: 'Drill 2026-02',      owner: 'Resilience' },
    { control: 'Encryption & access control',     status: 'Pass',  evidence: 'Audit 2026-03',      owner: 'CISO' },
    { control: 'Training & awareness',            status: 'Pass',  evidence: '94% complete',       owner: 'CISO' },
    { control: 'Board reporting',                 status: 'Pass',  evidence: 'Quarterly',          owner: 'CISO' },
  ],
  'Sustainability report': [
    { control: 'Double-materiality assessment',   status: 'Pass',  evidence: 'Approved 2025-12',   owner: 'CSO' },
    { control: 'ISSB E1 datapoints (220)',        status: 'Watch', evidence: '198/220 collected',  owner: 'CSO' },
    { control: 'Limited assurance (PwC)',         status: 'Watch', evidence: '18 findings open',   owner: 'CSO' },
    { control: 'Climate-resilience capex share',           status: 'Pass',  evidence: '62% capex aligned',  owner: 'CFO' },
    { control: 'Climate transition plan',         status: 'Pass',  evidence: 'SBTi validated',     owner: 'CSO' },
    { control: 'Value-chain S2 data',             status: 'Watch', evidence: '38/64 datapoints',   owner: 'CSO' },
    { control: 'Digital tagging (XBRL)',          status: 'Pass',  evidence: 'Test pack ready',    owner: 'CSO' },
  ],
  DPA: [
    { control: 'RoPA up-to-date',                 status: 'Pass',  evidence: '2026-Q2 refresh',    owner: 'DPO' },
    { control: 'DPIA pipeline',                   status: 'Pass',  evidence: '6 in flight',        owner: 'DPO' },
    { control: 'DSAR SLA <30 days',               status: 'Watch', evidence: '3 breaches YTD',     owner: 'DPO' },
    { control: 'Breach reporting <72h',           status: 'Pass',  evidence: '4/4 met',            owner: 'DPO' },
    { control: 'International transfers',         status: 'Pass',  evidence: 'Transfer clauses',       owner: 'Legal' },
    { control: 'Cookie/consent compliance',       status: 'Watch', evidence: 'ODPC review open',    owner: 'Marketing' },
  ],
  AIACT: [
    { control: 'AI inventory & risk classification', status: 'Pass', evidence: '8 systems classified', owner: 'AI Gov' },
    { control: 'Prohibited-use screening',           status: 'Pass', evidence: 'No prohibited uses',  owner: 'AI Gov' },
    { control: 'High-risk system conformity',        status: 'Watch',evidence: 'Agent-Assist in scope',owner: 'AI Gov' },
    { control: 'Transparency obligations',           status: 'Pass', evidence: 'Bot disclosure live', owner: 'Product' },
    { control: 'Data governance & quality',          status: 'Pass', evidence: 'Snowflake lineage',   owner: 'Data team' },
    { control: 'Human oversight gates',              status: 'Pass', evidence: 'HITL on 4 systems',  owner: 'Product' },
    { control: 'Post-market monitoring',             status: 'Pass', evidence: 'Drift monitors',     owner: 'Data team' },
  ],
  'CBOB IT risk': [
    { control: 'ICT risk-management framework',   status: 'Pass',  evidence: 'Approved Q1',        owner: 'CISO' },
    { control: 'TPP register (B2B finance)',      status: 'Pass',  evidence: '12 customers',       owner: 'CISO' },
    { control: 'Incident classification',         status: 'Pass',  evidence: 'Aligned with URCA cyber guidelines',  owner: 'SOC' },
    { control: 'Resilience testing (TLPT)',       status: 'Watch', evidence: 'Q4 scheduled',       owner: 'CISO' },
    { control: 'ICT 3rd-party register',          status: 'Pass',  evidence: 'Procurement feed',   owner: 'Procure' },
  ],
  'Comms Act 2009': [
    { control: 'Pre-contract summaries',          status: 'Pass',  evidence: 'Live',               owner: 'Reg' },
    { control: 'Switching transparency',          status: 'Pass',  evidence: 'number-transfer 96%',           owner: 'Reg' },
    { control: 'Vulnerable customer code',        status: 'Pass',  evidence: '100% adherence',     owner: 'CCO' },
    { control: '911/919 routing',                 status: 'Pass',  evidence: '99.98%',             owner: 'Network' },
  ],
  CRA: [
    { control: 'CPE security-by-default',         status: 'Watch', evidence: 'Roadmap Q3',         owner: 'Product' },
    { control: 'Vulnerability disclosure (CVD)',  status: 'Watch', evidence: 'Policy drafted',     owner: 'CISO' },
    { control: 'SBOM for shipped firmware',       status: 'Watch', evidence: 'Pilot',              owner: 'Product' },
  ],
  CER: [
    { control: 'Critical-entity registration',    status: 'Pass',  evidence: 'Submitted Q2',       owner: 'Resilience' },
    { control: 'Resilience plan',                 status: 'Pass',  evidence: 'Board approved',     owner: 'Resilience' },
  ],
  TAX: [
    { control: 'Eligible activities mapped',      status: 'Pass',  evidence: 'CapEx 74%',          owner: 'CFO' },
    { control: 'DNSH check',                      status: 'Pass',  evidence: 'Documented',         owner: 'CFO' },
    { control: 'Minimum safeguards',              status: 'Pass',  evidence: 'Validated',          owner: 'CFO' },
  ],
  DATAACT: [
    { control: 'IoT data-sharing API',            status: 'Watch', evidence: 'Roadmap Q4',         owner: 'Data team' },
    { control: 'Customer notice',                 status: 'Watch', evidence: 'Drafting',           owner: 'Legal' },
  ],
}

// =============================================================================
export default function RegulatoryPage() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    try { const raw = localStorage.getItem('reg-tab') as TabId; if (raw) return raw } catch { /* ignore */ }
    return 'overview'
  })
  useEffect(() => { try { localStorage.setItem('reg-tab', tab) } catch { /* ignore */ } }, [tab])
  const [selectedReg, setSelectedReg] = useState<string>(() => {
    if (typeof window === 'undefined') return 'URCA cyber'
    try { const raw = localStorage.getItem('reg-selected'); if (raw) return raw } catch { /* ignore */ }
    return 'URCA cyber'
  })
  useEffect(() => { try { localStorage.setItem('reg-selected', selectedReg) } catch { /* ignore */ } }, [selectedReg])
  const drillInto = (code: string) => { setSelectedReg(code); setTab('reg360') }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Regulatory & ESG')}
        subtitle={tt('URCA · ODPC · CBOB · NEMA · BISX · 10 regulations live · CCO + CSO cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('CCO + CSO')}</div>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
        <span className="text-vfes-dark/55 uppercase tracking-widest text-[10px] mr-1">{tt('Related cockpits')}:</span>
        <Link to="/portal/risk" className="px-3 py-1.5 rounded-full bg-[#FF4438]/10 text-[#222128] hover:bg-[#FF4438]/20">{tt('Risk & Security')}</Link>
        <Link to="/portal/trust-center" className="px-3 py-1.5 rounded-full bg-[#11567F]/10 text-[#11567F] hover:bg-[#11567F]/20">{tt('Trust Center')}</Link>
        <Link to="/portal/ciso" className="px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20">{tt('CISO')}</Link>
        <Link to="/portal/horizon" className="px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20">{tt('Horizon')}</Link>
        <Link to="/portal/urca-pack" className="px-3 py-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20">{tt('URCA Pack')}</Link>
        <Link to="/portal/rbac" className="px-3 py-1.5 rounded-full bg-[#94a3b8]/10 text-[#94a3b8] hover:bg-[#94a3b8]/20">{tt('RBAC')}</Link>
        <Link to="/portal/incidents" className="px-3 py-1.5 rounded-full bg-[#FF4438]/10 text-[#222128] hover:bg-[#FF4438]/20">{tt('Incidents')}</Link>
        <Link to="/portal/observability" className="px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20">{tt('Observability')}</Link>
        <Link to="/portal/data-contracts" className="px-3 py-1.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20">{tt('Data Contracts')}</Link>
        <Link to="/portal/finance" className="px-3 py-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20">{tt('Finance')}</Link>
        <Link to="/portal/war-room" className="px-3 py-1.5 rounded-full bg-[#94a3b8]/10 text-[#94a3b8] hover:bg-[#94a3b8]/20">{tt('War Room')}</Link>
        <Link to="/portal/ai-insights" className="px-3 py-1.5 rounded-full bg-[#11567F]/10 text-[#11567F] hover:bg-[#11567F]/20">{tt('AI Insights')}</Link>
      </div>

      <MlInsightSection
        heading="Compliance intelligence"
        models={[
          { name: 'Obligation-breach Predictor', metric: 'AUC 0.87', sub: 'coverage/QoS breach risk' },
          { name: 'DSAR-SLA Predictor', metric: 'recall 0.84', sub: 'request-SLA risk' },
          { name: 'ESG-target Forecaster', metric: 'MAPE 5%', sub: 'Scope 1+2 trajectory' },
        ]}
        agentLabel="Run Compliance Radar" agentRunningLabel="Scoring…"
        agentSteps={[
          'Predicted obligation-breach risk by municipality',
          'Forecast DSAR requests trending to breach SLA',
          'Tracked ESG targets vs trajectory',
          'Drafted filings & flagged items for legal',
        ]}
        agentBlurb="Predicting a breach weeks out turns compliance from a fire-drill at filing into planned, evidenced action."
        decision={{
          title: 'Close the predicted coverage breach & clear the DSAR backlog',
          detail: 'The model predicts a coverage-obligation breach in a cluster of rural municipalities and a DSAR SLA breach if the backlog is not cleared this week. Sequence both ahead of the filing.',
          impact: 'avoids regulatory finding & DSAR penalty',
          risk: 'build & DSAR lead-times — start the at-risk items first',
          linkTo: '#/portal/urca-pack', linkLabel: 'Open URCA Pack',
        }}
        chart={{
          kind: 'bar', title: 'Predicted obligation-breach risk by area (%)', xKey: 'area', unit: '%',
          data: [
            { area: 'Rural coverage', risk: 72 }, { area: 'QoS attestation', risk: 28 },
            { area: 'DSAR SLA', risk: 64 }, { area: '911/919 routing', risk: 11 }, { area: 'ESG Scope 1+2', risk: 34 },
          ],
          series: [{ key: 'risk', name: 'Breach risk', color: '#FF4438' }],
          colorBy: { key: 'risk', high: 60, mid: 30 },
          note: 'Rural coverage and DSAR SLA carry the highest predicted breach risk — act before the filing window.',
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

      {tab === 'overview' && <OverviewTab drillInto={drillInto} />}
      {tab === 'comreg'   && <UrcaTab />}
      {tab === 'privacy'  && <PrivacyTab />}
      {tab === 'cyber'    && <CyberTab />}
      {tab === 'ai'       && <AITab />}
      {tab === 'climate'  && <ClimateTab />}
      {tab === 'nature'   && <NatureSocialTab />}
      {tab === 'sustainability'     && <SustainabilityTab />}
      {tab === 'cases'    && <CasesTab />}
      {tab === 'reg360'   && <Reg360Tab code={selectedReg} setCode={setSelectedReg} />}

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML compliance-risk model · semantic view REG_ESG_360 · model reg-cockpit v1.0 · refreshed daily 04:00 UTC
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- OVERVIEW
function OverviewTab({ drillInto }: { drillInto: (c: string) => void }) {
  const csrdDone = csrdProgress.reduce((s, x) => s + x.done, 0)
  const csrdTotal = csrdProgress.reduce((s, x) => s + x.datapoints, 0)
  const totalGhg = ghgInventory.reduce((s, x) => s + x.ktCo2e, 0)
  const totalFines = finesPaid.reduce((s, x) => s + x.amt, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('URCA compliance')} value="13/15 KPIs Pass" delta="2 watch" trend="up" icon={Scale} accent />
        <KpiCard label={tt('DPA open DSARs')} value={`${dsarPipeline[0].count + dsarPipeline[1].count + dsarPipeline[2].count}`} delta="all in SLA" trend="up" icon={Lock} />
        <KpiCard label={tt('URCA cyber incidents (TTM)')} value={`${nis2Incidents.length}`} delta={`${nis2Incidents.filter((i) => i.reportable).length} reportable`} trend="flat" icon={Shield} />
        <KpiCard label={tt('AI systems registered')} value={`${aiSystems.length}`} delta={`${aiSystems.filter((a) => a.risk === 'High').length} high-risk`} trend="flat" icon={Cpu} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('GHG total (Scope 1/2/3)')} value={`${totalGhg.toFixed(0)} ktCO₂e`} delta="-12% YoY" trend="up" icon={Leaf} accent />
        <KpiCard label={tt('Sustainability datapoints')} value={`${csrdDone}/${csrdTotal}`} delta={`${((csrdDone / csrdTotal) * 100).toFixed(0)}% collected`} trend="up" icon={FileText} />
        <KpiCard label={tt('Open cases')} value={`${openCases.length}`} delta={`${openCases.filter((c) => c.sev === 'High').length} high`} trend="flat" icon={Gavel} />
        <KpiCard label={tt('Fines paid YTD')} value={`BSD ${(totalFines * 1000).toFixed(0)}K`} delta={`${finesPaid.length} matters`} trend="down" icon={FileWarning} />
      </div>

      {/* Mobile / spectrum / Open RAN regulatory */}
      <Panel title={tt('Mobile · spectrum · 5G · Open RAN — active obligations')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('URCA · ODPC · CBOB · NEMA')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Body')}</th><th>{tt('Topic')}</th><th>{tt('Due')}</th><th>{tt('Status')}</th><th>{tt('Risk')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_REGULATORY.map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs text-vfes-dark/65">{r.id}</td>
                <td className="text-xs font-semibold">{r.body}</td>
                <td className="text-xs">{tt(r.topic)}<div className="text-[10px] text-vfes-dark/55">{tt(r.impact)}</div></td>
                <td className="text-xs font-mono">{r.dueDate}</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.status === 'compliant' || r.status === 'on-track' ? 'bg-emerald-50 text-emerald-700' : r.status === 'in-flight' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.status)}</span>
                </td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${r.risk === 'Low' ? 'bg-emerald-50 text-emerald-700' : r.risk === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{tt(r.risk)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('700 MHz indoor coverage in Rural Out Islands is the only High-risk obligation — 38 sites behind plan. high-risk vendor policy Huawei share already at 12% (cap is 20%).')}</div>
      </Panel>

      {/* ESG · RAN energy efficiency */}
      <Panel title={tt('ESG · RAN energy efficiency')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 rounded px-2 py-1 flex items-center gap-1"><Leaf className="w-3 h-3" />{tt('Cable Bahamas Spirit · net-zero 2040')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Metric')}</th><th>{tt('Current')}</th><th>{tt('Target')}</th><th>{tt('YoY trend')}</th><th>{tt('YTD progress')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_ESG.map((m) => (
              <tr key={m.metric} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(m.metric)}</td>
                <td className="font-mono text-xs font-bold">{m.value}</td>
                <td className="font-mono text-xs text-vfes-dark/65">{m.target}</td>
                <td className={`font-bold text-xs ${(m.metric.includes('intensity') || m.metric.includes('emissions')) ? (m.trend < 0 ? 'text-emerald-600' : 'text-red-600') : (m.trend > 0 ? 'text-emerald-600' : 'text-red-600')}`}>{m.trend > 0 ? '+' : ''}{m.trend.toFixed(1)}%</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-100 rounded"><div className="h-full bg-emerald-500 rounded" style={{ width: `${m.ytdProgress}%` }} /></div>
                    <span className="text-xs font-bold w-10 text-right">{m.ytdProgress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('RAN energy intensity −8.4% YoY — sleep-mode 4G/5G drives savings. Island Towers (demo) tower-share at 91% of 160-site target. Scope-2 mobile emissions tracking to 2027 net-zero RAN target.')}</div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Active regulations · status')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Code')}</th><th>{tt('Regulation')}</th><th>{tt('Body')}</th><th>{tt('Status')}</th><th>{tt('Owner')}</th></tr>
            </thead>
            <tbody>
              {regCatalog.map((r) => (
                <tr key={r.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(r.code)}>
                  <td className="py-2 font-mono text-xs font-bold">{r.code}</td>
                  <td className="font-semibold">{tt(r.name)} <ChevronRight className="inline w-3 h-3 text-vfes-dark/30" /></td>
                  <td className="text-vfes-dark/60 text-xs">{tt(r.body)}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[r.status]}`}>{tt(r.status)}</span></td>
                  <td className="text-xs text-vfes-dark/60">{tt(r.owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Reporting calendar')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Report')}</th><th>{tt('Due')}</th><th>{tt('Owner')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {calendar.map((c) => (
                <tr key={tt(c.name)} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(c.name)}</td>
                  <td className="text-xs">{c.due}</td>
                  <td className="text-xs text-vfes-dark/60">{tt(c.owner)}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[c.status]}`}>{tt(c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Double-materiality matrix (impact × financial)')}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={doubleMateriality.sort((a, b) => (b.imp + b.fin) - (a.imp + a.fin))}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="topic" tick={{ fontSize: 10 }} angle={-12} textAnchor="end" height={60} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="imp" fill={GREEN} name={tt('Impact materiality')} />
            <Bar dataKey="fin" fill={RED} name={tt('Financial materiality')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SiPrompts prompts={[
        'Show all Sustainability datapoints not yet assured by PwC.',
        'List URCA KPIs trending toward red.',
        'Forecast Scope-2 emissions if remaining DCs go renewable in Q4.',
        'Which regulations have notice deadlines in next 90 days?',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- URCA
function UrcaTab() {
  const passes = comregQos.filter((q) => q.status === 'Pass').length
  const totalSpectrumMhz = spectrum.reduce((s, x) => s + x.mhz, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('QoS KPIs passing')} value={`${passes}/${comregQos.length}`} delta="13 pass · 2 watch" trend="up" icon={CheckCircle} accent />
        <KpiCard label={tt('SMP markets')} value={`${smpMarkets.length}`} delta={`${smpMarkets.filter((s) => s.status === 'At risk').length} at risk`} trend="flat" icon={Scale} />
        <KpiCard label={tt('Spectrum held')} value={`${totalSpectrumMhz} MHz`} delta="8 bands" trend="flat" icon={Radio} />
        <KpiCard label={tt('Spectrum fees / yr')} value={`BSD ${spectrum.reduce((s, x) => s + x.annualFee, 0).toFixed(1)}M`} delta="paid Jul 2026" trend="flat" icon={FileWarning} />
      </div>

      <Panel title={tt('URCA QoS scorecard (15 KPIs)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Metric')}</th><th>{tt('Value')}</th><th>{tt('Target')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {comregQos.map((q) => (
              <tr key={q.kpi} className="border-t border-black/5">
                <td className="py-2">{q.kpi}</td>
                <td className="font-bold">{q.value}{q.unit}</td>
                <td className="text-vfes-dark/55">{q.dir === 'higher' ? '≥' : '<'} {q.target}{q.unit}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[q.status]}`}>{tt(q.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('SMP markets (M1/M3a/M3b/M4 + USO)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Market')}</th><th>{tt('Status')}</th><th>{tt('Risk')}</th><th>{tt('Next milestone')}</th></tr>
            </thead>
            <tbody>
              {smpMarkets.map((m) => (
                <tr key={m.market} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{m.market}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[m.status]}`}>{tt(m.status)}</span></td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[m.risk]}`}>{m.risk}</span></td>
                  <td className="text-xs text-vfes-dark/60">{m.nextMilestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('URCA regulatory stack')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Regulation')}</th><th>{tt('Status')}</th><th>{tt('Next deadline')}</th></tr>
            </thead>
            <tbody>
              {euTelcoStack.map((r) => (
                <tr key={r.reg} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{r.reg}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[r.status]}`}>{tt(r.status)}</span></td>
                  <td className="text-xs text-vfes-dark/60">{r.nextDeadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Spectrum portfolio')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Band')}</th><th>{tt('MHz')}</th><th>{tt('Expiry')}</th><th>{tt('Annual fee BSD M')}</th><th>{tt('Coverage')}</th><th>{tt('Utilisation')}</th></tr>
          </thead>
          <tbody>
            {spectrum.map((s) => (
              <tr key={s.band} className="border-t border-black/5">
                <td className="py-2 font-semibold">{s.band}</td>
                <td>{s.mhz}</td>
                <td className={s.expiry < '2027' ? 'text-vfes-dark font-bold' : ''}>{s.expiry}</td>
                <td>BSD {s.annualFee}M</td>
                <td className="text-xs text-vfes-dark/60">{s.coverage}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded"><div className="h-full bg-vfes-red rounded" style={{ width: `${s.use * 100}%` }} /></div>
                    <span className="text-xs font-bold w-10 text-right">{(s.use * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- PRIVACY
function PrivacyTab() {
  const totalRights = dpcRights.reduce((s, x) => s + x.n, 0)
  const breaches = breachRegister.length
  const reportableBreaches = breachRegister.filter((b) => b.dpc72h).length
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('DSAR open')} value={`${dsarPipeline[0].count + dsarPipeline[1].count + dsarPipeline[2].count + dsarPipeline[3].count}`} delta="all in 30d SLA" trend="up" icon={Lock} accent />
        <KpiCard label={tt('Rights requests YTD')} value={`${totalRights}`} delta={`${dpcRights.reduce((s, x) => s + x.breached, 0)} SLA breaches`} trend="flat" icon={UserCheck} />
        <KpiCard label={tt('Breaches YTD')} value={`${breaches}`} delta={`${reportableBreaches} reportable`} trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('DPIAs in flight')} value={`${dpiaPipeline.length}`} delta={`${dpiaPipeline.filter((d) => d.risk === 'High').length} high risk`} trend="flat" icon={FileText} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('DSAR pipeline (by stage)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dsarPipeline}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {dsarPipeline.map((_, i) => <Cell key={i} fill={[BLUE, AMBER, RED, PURPLE, GREEN][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Rights requests (Art. 15-21)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Right')}</th><th>{tt('Count')}</th><th>{tt('SLA breaches')}</th></tr>
            </thead>
            <tbody>
              {dpcRights.map((r) => (
                <tr key={r.right} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{r.right}</td>
                  <td>{r.n}</td>
                  <td className={r.breached > 0 ? 'text-vfes-dark font-bold' : 'text-emerald-600'}>{r.breached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Breach register (ODPC 72h clock)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Date')}</th><th>{tt('Sev')}</th><th>{tt('Records')}</th><th>{tt('72h')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {breachRegister.map((b) => (
                <tr key={b.id} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{b.id}</td>
                  <td className="text-xs">{b.date}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[b.sev]}`}>{b.sev}</span></td>
                  <td>{b.records.toLocaleString()}</td>
                  <td>{b.dpc72h ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : '—'}</td>
                  <td className="text-xs">{tt(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('DPIA pipeline')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('DPIA')}</th><th>{tt('Risk')}</th><th>{tt('Stage')}</th><th>{tt('Owner')}</th></tr>
            </thead>
            <tbody>
              {dpiaPipeline.map((d) => (
                <tr key={d.dpia} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{d.dpia}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[d.risk]}`}>{d.risk}</span></td>
                  <td className="text-xs">{d.stage}</td>
                  <td className="text-xs text-vfes-dark/60">{tt(d.owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('International transfers')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Country')}</th><th>{tt('Mechanism')}</th><th>{tt('TIA')}</th><th>{tt('Volume')}</th><th>{tt('Review')}</th></tr>
            </thead>
            <tbody>
              {transferPosture.map((t) => (
                <tr key={t.country} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{t.country}</td>
                  <td className="text-xs">{t.mechanism}</td>
                  <td>{t.tia}</td>
                  <td className="text-xs">{t.volume}</td>
                  <td className="text-xs text-vfes-dark/60">{t.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Cookie consent — last 30 days')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={cookieConsent} dataKey="pct" nameKey="type" outerRadius={90} label={(d: any) => `${(d.pct * 100).toFixed(0)}%`}>
                {cookieConsent.map((_, i) => <Cell key={i} fill={[GREEN, BLUE, AMBER, RED][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- CYBER
function CyberTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Security score (BitSight)')} value={`${cyberPosture.secScore}`} delta="+24 YoY" trend="up" icon={Shield} accent />
        <KpiCard label={tt('P1 vulns open')} value={`${cyberPosture.vuln.p1Backlog}`} delta={`MTTR ${cyberPosture.vuln.mttrP1Days}d`} trend="up" icon={AlertTriangle} />
        <KpiCard label={tt('Phishing click rate')} value={`${(cyberPosture.phish.simRate * 100).toFixed(1)}%`} delta={`${(cyberPosture.phish.trainComplete * 100).toFixed(0)}% trained`} trend="up" icon={UserCheck} />
        <KpiCard label={tt('ISO 27001 expiry')} value={cyberPosture.isoCert.iso27001} delta="surveillance Q3" trend="flat" icon={CheckCircle} />
      </div>

      <Panel title={tt('URCA cyber incident register (24h/72h reporting)')} >
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Sev')}</th><th>{tt('Service')}</th><th>{tt('Reportable')}</th><th>{tt('24h')}</th><th>{tt('72h')}</th><th>{tt('Status')}</th><th>{tt('Detail')}</th></tr>
          </thead>
          <tbody>
            {nis2Incidents.map((i) => (
              <tr key={i.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs">{i.id}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[i.sev]}`}>{i.sev}</span></td>
                <td>{i.service}</td>
                <td>{i.reportable ? <span className="text-vfes-dark font-bold text-xs">{tt('YES')}</span> : '—'}</td>
                <td className={i.clock24h === 'Met' ? 'text-emerald-600 font-bold text-xs' : 'text-vfes-dark/40 text-xs'}>{i.clock24h}</td>
                <td className={i.clock72h === 'Met' ? 'text-emerald-600 font-bold text-xs' : i.clock72h === 'Pending' ? 'text-amber-600 font-bold text-xs' : 'text-vfes-dark/40 text-xs'}>{i.clock72h}</td>
                <td className="text-xs">{tt(i.status)}</td>
                <td className="text-xs text-vfes-dark/60">{i.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6 mt-6 mb-6">
        <Panel title={tt('Pen-test (last KPMG)')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Last test')}</span><span className="font-bold">{cyberPosture.pentest.last}</span></div>
            <div className="flex justify-between"><span>{tt('Critical open')}</span><span className={cyberPosture.pentest.critOpen === 0 ? 'text-emerald-600 font-bold' : 'text-vfes-dark font-bold'}>{cyberPosture.pentest.critOpen}</span></div>
            <div className="flex justify-between"><span>{tt('High open')}</span><span className="font-bold text-amber-600">{cyberPosture.pentest.highOpen}</span></div>
            <div className="flex justify-between"><span>{tt('Medium open')}</span><span className="font-bold">{cyberPosture.pentest.mediumOpen}</span></div>
          </div>
        </Panel>
        <Panel title={tt('Vulnerability backlog')}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { sev: 'P1', n: cyberPosture.vuln.p1Backlog },
              { sev: 'P2', n: cyberPosture.vuln.p2Backlog },
              { sev: 'P3', n: cyberPosture.vuln.p3Backlog },
            ]}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="sev" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {[RED, AMBER, BLUE].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Certs & drills')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('ISO 27001')}</span><span className="font-bold">{cyberPosture.isoCert.iso27001}</span></div>
            <div className="flex justify-between"><span>{tt('ISO 22301 BCM')}</span><span className="font-bold">{cyberPosture.isoCert.iso22301}</span></div>
            <div className="flex justify-between"><span>{tt('SOC 2 Type II')}</span><span className="font-bold">{cyberPosture.isoCert.soc2}</span></div>
            <div className="flex justify-between"><span>{tt('Last BCM drill')}</span><span className="font-bold">{cyberPosture.bcDrill}</span></div>
            <div className="flex justify-between"><span>{tt('Repeat phish offenders')}</span><span className="font-bold text-amber-600">{cyberPosture.phish.repeatOffenders}</span></div>
          </div>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- AI
function AITab() {
  const highRisk = aiSystems.filter((a) => a.risk === 'High').length
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('AI systems registered')} value={`${aiSystems.length}`} delta={`${aiSystems.filter((a) => a.status === 'Live').length} live`} trend="up" icon={Cpu} accent />
        <KpiCard label={tt('High-risk (AI policy)')} value={`${highRisk}`} delta="conformity in flight" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('Model cards')} value={`${aiSystems.filter((a) => a.card).length}/${aiSystems.length}`} delta="scenario" trend="up" icon={FileText} />
        <KpiCard label={tt('Bias tests passing')} value={`${aiSystems.filter((a) => a.bias === 'Pass').length}/${aiSystems.length}`} delta="quarterly review" trend="up" icon={CheckCircle} />
      </div>

      <Panel title={tt('AI system inventory · risk classification (AI governance policy)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('System')}</th><th>{tt('AI policy risk')}</th><th>{tt('Use case')}</th><th>{tt('Status')}</th><th>{tt('Drift')}</th><th>{tt('Bias')}</th><th>{tt('Card')}</th><th>{tt('Oversight')}</th></tr>
          </thead>
          <tbody>
            {aiSystems.map((a) => (
              <tr key={tt(a.name)} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(a.name)}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${a.risk === 'High' ? 'bg-red-50 text-red-700' : a.risk === 'Limited' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{a.risk}</span></td>
                <td className="text-vfes-dark/60 text-xs">{a.useCase}</td>
                <td className="text-xs">{tt(a.status)}</td>
                <td className={a.drift === 'Low' ? 'text-emerald-600 text-xs' : a.drift === 'Medium' ? 'text-amber-600 text-xs' : 'text-vfes-dark text-xs'}>{a.drift}</td>
                <td className={a.bias === 'Pass' ? 'text-emerald-600 text-xs' : a.bias === 'Watch' ? 'text-amber-600 text-xs' : 'text-vfes-dark/60 text-xs'}>{a.bias}</td>
                <td>{a.card ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}</td>
                <td className="text-xs">{a.oversight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- CLIMATE
function ClimateTab() {
  const totalGhg = ghgInventory.reduce((s, x) => s + x.ktCo2e, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('GHG total')} value={`${totalGhg.toFixed(0)} kt`} delta="-12% YoY" trend="up" icon={Leaf} accent />
        <KpiCard label={tt('Renewable elec.')} value="78%" delta="100% by 2027" trend="up" icon={Zap} />
        <KpiCard label={tt('SBTi status')} value="Validated" delta="1.5°C aligned" trend="up" icon={CheckCircle} />
        <KpiCard label={tt('Climate-resilience capex')} value={`${(taxonomy.capex.aligned * 100).toFixed(0)}%`} delta="aligned" trend="up" icon={Target} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('GHG inventory by scope (ktCO₂e)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ghgInventory}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="scope" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ktCo2e" fill={RED} name={tt('Current')} />
              <Bar dataKey="target2030" fill={GREEN} name={tt('2030 target')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Scope-3 by category (ktCO₂e · 15 categories)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scope3Cats} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="cat" type="category" tick={{ fontSize: 9 }} width={170} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="v" fill={GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Decarbonisation pathway (kt · SBTi-aligned)')}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={decarbPath}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="actual" stroke={RED} strokeWidth={3} dot={{ r: 5 }} name={tt('Actual')} connectNulls={false} />
              <Line dataKey="trajectory" stroke={BLUE} strokeWidth={2} strokeDasharray="5 5" name={tt('Trajectory')} />
              <Line dataKey="target" stroke={GREEN} strokeWidth={2} strokeDasharray="3 3" name={tt('SBTi target')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Energy mix (Scope 2 market-based)')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={energyMix} dataKey="pct" nameKey="src" outerRadius={90} label={(d: any) => `${(d.pct * 100).toFixed(0)}%`}>
                {energyMix.map((_, i) => <Cell key={i} fill={[GREEN, AMBER, BLUE, GREY, TEAL][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Physical-risk register (sites exposed)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Hazard')}</th><th>{tt('Exposed')}</th><th>{tt('Mitigated')}</th><th>{tt('Capex BSD M')}</th><th>{tt('BAU sites')}</th><th>{tt('1.5°C sites')}</th></tr>
            </thead>
            <tbody>
              {physRisk.map((r) => (
                <tr key={r.hazard} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{r.hazard}</td>
                  <td>{r.exposed}</td>
                  <td className="text-emerald-600 font-bold">{r.mitigated}</td>
                  <td>BSD {r.capex}M</td>
                  <td className="text-vfes-dark">{r.scenarioBau}</td>
                  <td className="text-amber-600">{r.scenario15c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('TCFD scenario impact (BSD M NPV vs base)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tcfdScenarios}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="scenario" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#1f2937" />
              <Bar dataKey="capexImpact" fill={RED} name={tt('Capex')} />
              <Bar dataKey="opexImpact" fill={AMBER} name={tt('Opex')} />
              <Bar dataKey="revImpact" fill={GREEN} name={tt('Revenue')} />
              <Bar dataKey="npv" fill={BLUE} name={tt('NPV')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- NATURE & SOCIAL
function NatureSocialTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('CPE refurbished')} value={`${(circular[0].value! * 100).toFixed(0)}%`} delta="target 80%" trend="up" icon={TreePine} accent />
        <KpiCard label={tt('Water (m³)')} value={`${(water.reduce((s, x) => s + x.m3, 0) / 1000).toFixed(1)}K`} delta="all low-stress" trend="flat" icon={Droplet} />
        <KpiCard label={tt('Gender pay gap')} value={`${(social.payGap.genderHourly * 100).toFixed(1)}%`} delta="-1.4 pt YoY" trend="up" icon={Users} />
        <KpiCard label={tt('Female leadership')} value={`${(social.diversity.femaleLeadership * 100).toFixed(0)}%`} delta="target 50%" trend="up" icon={Heart} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Circular economy progress')}>
          <div className="space-y-3">
            {circular.map((c, i) => {
              const pct = c.value !== undefined ? c.value : c.ratio
              const targetTxt = c.target !== undefined ? `${(c.target * 100).toFixed(0)}%` : `${c.targetRaw}t`
              const valueTxt = c.value !== undefined ? `${(c.value * 100).toFixed(0)}%` : `${c.valueRaw}t`
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{c.metric}</span>
                    <span><span className="font-bold">{valueTxt}</span> <span className="text-vfes-dark/40">/ {targetTxt}</span></span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full ${pct! >= 0.8 ? 'bg-emerald-500' : pct! >= 0.5 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${pct! * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
        <Panel title={tt('Nature impact register')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Issue')}</th><th>{tt('Total')}</th><th>{tt('Mitigated')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {nature.map((n) => (
                <tr key={n.issue} className="border-t border-black/5">
                  <td className="py-2 text-xs">{n.issue}</td>
                  <td>{n.count}</td>
                  <td className="text-emerald-600 font-bold">{n.mitigated}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[n.status]}`}>{tt(n.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Own workforce')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Headcount')}</span><span className="font-bold">{social.ownWorkforce.headcount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{tt('Attrition')}</span><span className="font-bold">{(social.ownWorkforce.attrition * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>{tt('LTIR')}</span><span className="font-bold">{social.ownWorkforce.ltir.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>{tt('Accidents YTD')}</span><span className="font-bold">{social.ownWorkforce.accidents}</span></div>
            <div className="flex justify-between"><span>{tt('Training (avg hrs)')}</span><span className="font-bold">{social.ownWorkforce.trainingHrs}</span></div>
          </div>
        </Panel>
        <Panel title={tt('Pay gap & diversity')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Gender hourly gap')}</span><span className="font-bold">{(social.payGap.genderHourly * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>{tt('Gender bonus gap')}</span><span className="font-bold">{(social.payGap.genderBonus * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>{tt('Ethnic pay gap')}</span><span className="font-bold">{(social.payGap.ethnic * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>{tt('Female (all)')}</span><span className="font-bold">{(social.diversity.femaleAll * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>{tt('Female leadership')}</span><span className="font-bold">{(social.diversity.femaleLeadership * 100).toFixed(0)}%</span></div>
          </div>
        </Panel>
        <Panel title={tt('Communities & inclusion')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Households reached')}</span><span className="font-bold">{social.digitalInclusion.householdsReached.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{tt('Affordable tariff')}</span><span className="font-bold">{social.digitalInclusion.broadbandTariff}</span></div>
            <div className="flex justify-between"><span>{tt('Schools partnered')}</span><span className="font-bold">{social.digitalInclusion.schools}</span></div>
            <div className="flex justify-between"><span>{tt('Vendor audits')}</span><span className="font-bold">{social.vendorAudits.audits}</span></div>
            <div className="flex justify-between"><span>{tt('Findings (crit. open)')}</span><span className="font-bold text-vfes-dark">{social.vendorAudits.criticalOpen}</span></div>
          </div>
        </Panel>
      </div>

      <Panel title={tt('Governance (G1)')}>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Board')}</div>
            <div className="flex justify-between"><span>{tt('Female')}</span><span className="font-bold">{(governance.boardDiv.female * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>{tt('Independent')}</span><span className="font-bold">{(governance.boardDiv.indep * 100).toFixed(0)}%</span></div>
            <div className="text-[10px] text-vfes-dark/55 mt-1">Expertise: {governance.boardDiv.expertise.join(', ')}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Anti-corruption')}</div>
            <div className="flex justify-between"><span>{tt('Training complete')}</span><span className="font-bold">{(governance.antiCorr.trainComplete * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>{tt('Gifts register')}</span><span className="font-bold">{governance.antiCorr.giftsRegister}</span></div>
            <div className="flex justify-between"><span>{tt('Whistleblower cases')}</span><span className="font-bold">{governance.antiCorr.whistleblower}</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Tax & lobbying')}</div>
            <div className="flex justify-between"><span>{tt('ETR')}</span><span className="font-bold">{(governance.tax.etr * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>{tt('CbC ready')}</span><span className="font-bold">{governance.tax.cbcRReady ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span>{tt('Lobbying BSD M')}</span><span className="font-bold">BSD {governance.lobbying.spend}M</span></div>
            <div className="flex justify-between"><span>{tt('Political donations')}</span><span className="font-bold text-emerald-600">BSD 0</span></div>
          </div>
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- Sustainability report
function SustainabilityTab() {
  const totalDp = csrdProgress.reduce((s, x) => s + x.datapoints, 0)
  const totalDone = csrdProgress.reduce((s, x) => s + x.done, 0)
  const totalAssured = csrdProgress.reduce((s, x) => s + x.assured, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('ISSB datapoints')} value={`${totalDp}`} delta="11 standards" trend="flat" icon={FileText} accent />
        <KpiCard label={tt('Collected')} value={`${((totalDone / totalDp) * 100).toFixed(0)}%`} delta={`${totalDone}/${totalDp}`} trend="up" icon={CheckCircle} />
        <KpiCard label={tt('Assured (PwC)')} value={`${((totalAssured / totalDp) * 100).toFixed(0)}%`} delta="limited assurance" trend="up" icon={Award} />
        <KpiCard label={tt('Taxonomy capex aligned')} value={`${(taxonomy.capex.aligned * 100).toFixed(0)}%`} delta={`eligible ${(taxonomy.capex.eligible * 100).toFixed(0)}%`} trend="up" icon={Target} />
      </div>

      <Panel title={tt('ISSB standards · datapoints / collected / assured')}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={csrdProgress}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="standard" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="datapoints" fill={GREY} name={tt('Datapoints')} />
            <Bar dataKey="done" fill={BLUE} name={tt('Collected')} />
            <Bar dataKey="assured" fill={GREEN} name={tt('Assured')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('Climate-resilience capex share')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              { axis: 'CapEx', eligible: taxonomy.capex.eligible * 100, aligned: taxonomy.capex.aligned * 100 },
              { axis: 'OpEx',  eligible: taxonomy.opex.eligible * 100,  aligned: taxonomy.opex.aligned * 100 },
              { axis: 'Revenue', eligible: taxonomy.rev.eligible * 100, aligned: taxonomy.rev.aligned * 100 },
            ]}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="axis" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(v as number).toFixed(0)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="eligible" fill={GREY} name={tt('Eligible')} />
              <Bar dataKey="aligned" fill={GREEN} name={tt('Aligned')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('ESG ratings · Cable Bahamas vs peer')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Agency')}</th><th>{tt('Score')}</th><th>{tt('Peer')}</th><th>{tt('Trend')}</th></tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.agency} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{r.agency}</td>
                  <td className="font-bold">{r.score}</td>
                  <td className="text-vfes-dark/55">{r.peer}</td>
                  <td>{r.trend === 'up' ? <span className="text-emerald-600 font-bold">▲</span> : r.trend === 'down' ? <span className="text-vfes-dark font-bold">▼</span> : <span className="text-vfes-dark/40">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- CASES
function CasesTab() {
  const totalFines = finesPaid.reduce((s, x) => s + x.amt, 0)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Open cases')} value={`${openCases.length}`} delta={`${openCases.filter((c) => c.sev === 'High').length} high`} trend="flat" icon={Gavel} accent />
        <KpiCard label={tt('Fines paid YTD')} value={`BSD ${(totalFines * 1000).toFixed(0)}K`} delta={`${finesPaid.length} matters`} trend="down" icon={FileWarning} />
        <KpiCard label={tt('Audits in flight')} value={`${audits.filter((a) => a.status === 'In flight').length}`} delta="6 audits live" trend="flat" icon={CheckCircle} />
        <KpiCard label={tt('Audit findings open')} value={`${audits.reduce((s, a) => s + a.findingsOpen, 0)}`} delta="all owners assigned" trend="flat" icon={AlertTriangle} />
      </div>

      <Panel title={tt('Open cases (regulators & ombudsmen)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Body')}</th><th>{tt('Title')}</th><th>{tt('Severity')}</th><th>{tt('Filed')}</th><th>{tt('Target')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {openCases.map((c) => (
              <tr key={c.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs">{c.id}</td>
                <td className="font-semibold">{tt(c.body)}</td>
                <td className="text-xs">{tt(c.title)}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[c.sev]}`}>{c.sev}</span></td>
                <td className="text-xs">{c.filed}</td>
                <td className="text-xs text-vfes-dark/60">{c.target}</td>
                <td className="text-xs">{tt(c.owner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('Fines & enforcement (last 12 mo)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Date')}</th><th>{tt('Body')}</th><th>{tt('BSD K')}</th><th>{tt('Reason')}</th></tr>
            </thead>
            <tbody>
              {finesPaid.map((f, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 text-xs">{f.date}</td>
                  <td className="font-semibold">{tt(f.body)}</td>
                  <td className="font-bold">BSD {(f.amt * 1000).toFixed(0)}K</td>
                  <td className="text-xs text-vfes-dark/60">{f.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Audits (in-flight & scheduled)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Audit')}</th><th>{tt('Auditor')}</th><th>{tt('Date')}</th><th>{tt('Findings')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.audit} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{a.audit}</td>
                  <td className="text-xs">{a.auditor}</td>
                  <td className="text-xs">{a.date}</td>
                  <td className={a.findingsOpen > 5 ? 'text-vfes-dark font-bold' : a.findingsOpen > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{a.findingsOpen}</td>
                  <td className="text-xs">{tt(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- REG 360
function Reg360Tab({ code, setCode }: { code: string; setCode: (c: string) => void }) {
  const reg = regCatalog.find((r) => r.code === code) ?? regCatalog[0]
  const controls = regControls[reg.code] ?? []
  const passing = controls.filter((c) => c.status === 'Pass').length
  return (
    <>
      <div className="bg-vfes-red/5 border-l-4 border-vfes-red rounded-r-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-vfes-dark/70">
        <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Regulation drill-down')}</span>
        <label className="flex items-center gap-1.5">Pick regulation
          <select value={code} onChange={(e) => setCode(e.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
            {regCatalog.map((r) => <option key={r.code} value={r.code}>{r.code} · {tt(r.name)}</option>)}
          </select>
        </label>
        <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('Click any regulation row in Overview to drill in')}</span>
      </div>

      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">{tt(reg.body)} · in force {reg.inForce}</div>
            <div className="text-3xl font-extrabold mt-1">{reg.code} · {tt(reg.name)}</div>
            <div className="text-sm text-white/70 mt-1">Owner: {tt(reg.owner)} · {controls.length} controls · {passing} passing</div>
          </div>
          <div className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest ${reg.status === 'Compliant' ? 'bg-emerald-500' : reg.status === 'On track' ? 'bg-blue-500' : 'bg-amber-500'}`}>{tt(reg.status)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Controls')} value={`${controls.length}`} delta="defined" trend="flat" icon={CheckCircle} accent />
        <KpiCard label={tt('Passing')} value={`${passing}`} delta={`${((passing / Math.max(1, controls.length)) * 100).toFixed(0)}%`} trend="up" icon={Award} />
        <KpiCard label={tt('Watch')} value={`${controls.filter((c) => c.status === 'Watch').length}`} delta="action items" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('Fail')} value={`${controls.filter((c) => c.status === 'Fail').length}`} delta="escalations" trend="flat" icon={FileWarning} />
      </div>

      <Panel title={tt('Control register')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Control')}</th><th>{tt('Status')}</th><th>{tt('Evidence')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {controls.map((c, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-2 font-semibold">{c.control}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[c.status]}`}>{tt(c.status)}</span></td>
                <td className="text-vfes-dark/70 text-xs">{c.evidence}</td>
                <td className="text-xs text-vfes-dark/60">{tt(c.owner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-6">
        <SiPrompts prompts={[
          `Show all open ${reg.code} control gaps and their owners.`,
          `Forecast ${reg.code} compliance at end of FY using current burn-down.`,
          `List evidence packs assured for ${reg.code} this quarter.`,
        ]} />
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- helpers
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
