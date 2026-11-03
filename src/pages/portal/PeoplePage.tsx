// =============================================================================
// People & Talent cockpit — CPO grade
// 10 tabs · Executive-style pill nav · Workforce · Hiring · Attrition · Pay
// Performance · Skills · Engagement · D&I · Wellbeing & ER · Employee 360
// =============================================================================
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import KPI from './_kpi_facts'
import {
  Users, Heart, Award, Target, AlertTriangle, TrendingUp, TrendingDown, Activity,
  Briefcase, GraduationCap, Smile, Globe, ShieldCheck, Clock, MessageSquare,
  ChevronRight, Star, AlertOctagon, Cpu, Wallet, BadgeCheck, UserCheck, UserX,
  Building2, Map as MapIcon, Scale, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { MOBILE_PEOPLE } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const TEAL = '#0d9488'
const GREY = '#94a3b8'

const ratingColor: Record<string, string> = {
  Top: 'bg-emerald-100 text-emerald-700',
  Strong: 'bg-blue-100 text-blue-700',
  Solid: 'bg-zinc-100 text-zinc-700',
  Below: 'bg-amber-100 text-amber-700',
  PIP: 'bg-red-100 text-red-700',
  Low: 'bg-emerald-50 text-emerald-700',
  Med: 'bg-amber-50 text-amber-700',
  High: 'bg-red-50 text-red-700',
}

const tabs = [
  { id: 'overview',    label: 'Overview',          icon: Activity },
  { id: 'workforce',   label: 'Workforce',         icon: Users },
  { id: 'hiring',      label: 'Hiring Funnel',     icon: Briefcase },
  { id: 'attrition',   label: 'Attrition & Risk',  icon: UserX },
  { id: 'pay',         label: 'Pay & Equity',      icon: Wallet },
  { id: 'perf',        label: 'Perf & Succession', icon: Award },
  { id: 'skills',      label: 'Skills & Learning', icon: GraduationCap },
  { id: 'engage',      label: 'Engagement & D&I',  icon: Smile },
  { id: 'wellbeing',   label: 'Wellbeing & ER',    icon: Heart },
  { id: 'emp360',      label: 'Employee 360',      icon: UserCheck },
] as const
type TabId = typeof tabs[number]['id']

// =============================================================================
// DATA
// =============================================================================
const totals = { hc: 1840, contractors: 280, fte: 1812, plan: 1900, openReqs: 84, vacancyCostK: 4280 }

const orgFunctions = [
  { fn: 'Network & Ops',     hc: 520, plan: 540, attrTTM: 0.082, eNPS:  18, gpgPct: -2.4, women: 0.18 },
  { fn: 'IT & Data',         hc: 280, plan: 310, attrTTM: 0.142, eNPS:  22, gpgPct: -3.2, women: 0.32 },
  { fn: 'Customer Care',     hc: 360, plan: 360, attrTTM: 0.182, eNPS:  -4, gpgPct: -1.4, women: 0.62 },
  { fn: 'Field Ops',         hc: 220, plan: 240, attrTTM: 0.124, eNPS:  12, gpgPct: -4.6, women: 0.08 },
  { fn: 'Commercial / Sales',hc: 180, plan: 190, attrTTM: 0.166, eNPS:   8, gpgPct: -8.2, women: 0.42 },
  { fn: 'Marketing',         hc:  80, plan:  85, attrTTM: 0.124, eNPS:  28, gpgPct: -2.0, women: 0.58 },
  { fn: 'Finance & Strategy',hc: 110, plan: 110, attrTTM: 0.092, eNPS:  24, gpgPct: -3.4, women: 0.48 },
  { fn: 'Legal / Reg / HR',  hc:  60, plan:  62, attrTTM: 0.082, eNPS:  32, gpgPct:  1.2, women: 0.66 },
  { fn: 'Product / Tech',    hc:  30, plan:  35, attrTTM: 0.124, eNPS:  18, gpgPct: -1.8, women: 0.34 },
]

const hcBridge = [
  { name: 'Open FY25', v: 1812, kind: 'open' },
  { name: 'Hires',     v:  286, kind: 'in' },
  { name: 'Internal moves +', v: 64, kind: 'in' },
  { name: 'Voluntary leavers', v: -204, kind: 'out' },
  { name: 'Involuntary',       v: -38,  kind: 'out' },
  { name: 'Retirements',       v: -28,  kind: 'out' },
  { name: 'M&A in',            v:  48,  kind: 'in' },
  { name: 'Close FY26',        v: 1940, kind: 'close' },
]
// Build cumulative for waterfall
const hcWaterfall = (() => {
  const data: any[] = []
  let run = 0
  hcBridge.forEach((b, i) => {
    if (b.kind === 'open') { data.push({ name: b.name, base: 0, val: b.v, total: b.v, kind: 'open' }); run = b.v }
    else if (b.kind === 'close') { data.push({ name: b.name, base: 0, val: b.v, total: b.v, kind: 'close' }) }
    else if (b.v >= 0) { data.push({ name: b.name, base: run, val: b.v, total: run + b.v, kind: 'in' }); run += b.v }
    else { data.push({ name: b.name, base: run + b.v, val: -b.v, total: run + b.v, kind: 'out' }); run += b.v }
  })
  return data
})()

const span = [
  { layer: 'CEO',     n:    1, ratio: '—' },
  { layer: 'ExCo',    n:    9, ratio: '1:9' },
  { layer: 'L-1',     n:   42, ratio: '1:5' },
  { layer: 'L-2',     n:  186, ratio: '1:4.4' },
  { layer: 'L-3',     n:  360, ratio: '1:5.2' },
  { layer: 'IC',      n: 1242, ratio: '1:3.5' },
]

// HIRING FUNNEL
const hiring = {
  reqsOpen: 84, ttfDays: 48, offerAccept: 0.86, dayOne90Quit: 0.04, costPerHireK: 6.4,
  pipelineApplied: 28400, screened: 8400, interview1: 2400, finalRound: 720, offer: 320, accept: 276,
}
const hiringFunnel = [
  { stage: 'Applied',   n: hiring.pipelineApplied },
  { stage: 'Screened',  n: hiring.screened },
  { stage: 'Interview', n: hiring.interview1 },
  { stage: 'Final',     n: hiring.finalRound },
  { stage: 'Offer',     n: hiring.offer },
  { stage: 'Accept',    n: hiring.accept },
]
const hiringSource = [
  { src: 'LinkedIn',  n: 124 }, { src: 'Referral', n: 86 }, { src: 'Agency', n: 42 },
  { src: 'Career site', n: 64 }, { src: 'University', n: 28 }, { src: 'Boomerang', n: 12 },
  { src: 'Internal',  n: 64 },
]
const adverseImpact = [
  { stage: 'Applied',   m: 0.62, f: 0.38 },
  { stage: 'Screened',  m: 0.64, f: 0.36 },
  { stage: 'Interview', m: 0.66, f: 0.34 },
  { stage: 'Final',     m: 0.68, f: 0.32 },
  { stage: 'Offer',     m: 0.62, f: 0.38 },
  { stage: 'Accept',    m: 0.62, f: 0.38 },
]

// ATTRITION
const attrTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'][i],
  total: 12.4 + Math.sin(i / 1.6) * 1.4 + i * 0.04,
  regrettable: 7.8 + Math.sin(i / 1.6) * 1.2 + i * 0.04,
  involuntary: 2.2 + Math.cos(i / 2) * 0.4,
}))
const tenureCohorts = [
  { tenure: '< 6m',     active: 286, leftPct: 0.064 },
  { tenure: '6-12m',    active: 322, leftPct: 0.142 },
  { tenure: '1-2y',     active: 380, leftPct: 0.182 },
  { tenure: '2-5y',     active: 480, leftPct: 0.124 },
  { tenure: '5-10y',    active: 224, leftPct: 0.062 },
  { tenure: '10y+',     active: 148, leftPct: 0.038 },
]
const flightRisk = [
  { driver: 'Pay below market',    weight: 0.28 },
  { driver: 'Manager (low MEI)',   weight: 0.22 },
  { driver: 'No growth path',      weight: 0.18 },
  { driver: 'Commute > 60min',     weight: 0.10 },
  { driver: 'Engagement < 6',      weight: 0.12 },
  { driver: 'Recent role change',  weight: 0.06 },
  { driver: 'High performer + offer mkt', weight: 0.04 },
]
const flightRiskSummary = { high: 184, medium: 426, low: 1230 }
const managerOutliers = [
  { mgr: 'M. O\'Brien · Care',          attr12m: 0.42, eNPS: -22, span: 18, action: 'PIP triggered' },
  { mgr: 'L. Bain · Field Ops',         attr12m: 0.34, eNPS: -10, span: 22, action: 'Coaching' },
  { mgr: 'W. Knowles · Sales',          attr12m: 0.32, eNPS:   4, span: 14, action: 'Watch' },
  { mgr: 'J. Rolle · IT Ops',          attr12m: 0.28, eNPS:  -6, span: 12, action: 'Watch' },
  { mgr: 'T. Adderley · Care',            attr12m: 0.26, eNPS:   8, span: 18, action: 'OK' },
]

// PAY & EQUITY
const payGap = { meanGenderPct: -8.2, medianGenderPct: -6.4, lowQuartileWomen: 0.58, highQuartileWomen: 0.22, ethnicityMean: -3.8 }
const payGapByFunc = orgFunctions.map((f) => ({ fn: f.fn, gpg: f.gpgPct }))
const compaDist = [
  { band: '<0.85', n:  64, label: 'Below' },
  { band: '0.85-0.95', n: 184 },
  { band: '0.95-1.05', n: 982 },
  { band: '1.05-1.15', n: 422 },
  { band: '>1.15', n:  188, label: 'Above' },
]
const livingWage = { underN: 0, complianceTarget: 1.0, supplyChainCov: 0.78 }

// PERF & SUCCESSION
const ratings = [
  { r: 'Top (5)',     pct: 0.10, color: GREEN },
  { r: 'Strong (4)',  pct: 0.28, color: BLUE },
  { r: 'Solid (3)',   pct: 0.52, color: GREY },
  { r: 'Below (2)',   pct: 0.08, color: AMBER },
  { r: 'PIP (1)',     pct: 0.02, color: RED },
]
const nineBox = [
  { perf: 1, pot: 1, n:  18 }, { perf: 1, pot: 2, n:  24 }, { perf: 1, pot: 3, n:   8 },
  { perf: 2, pot: 1, n:  62 }, { perf: 2, pot: 2, n: 482 }, { perf: 2, pot: 3, n: 124 },
  { perf: 3, pot: 1, n:  42 }, { perf: 3, pot: 2, n: 286 }, { perf: 3, pot: 3, n: 184 },
]
const succession = [
  { role: 'CEO',                ready: 0, dev: 2, gap: false },
  { role: 'CFO',                ready: 1, dev: 2, gap: false },
  { role: 'CTO',                ready: 1, dev: 1, gap: false },
  { role: 'CISO',               ready: 0, dev: 1, gap: true  },
  { role: 'CCO (Customer)',     ready: 1, dev: 2, gap: false },
  { role: 'CRO',                ready: 0, dev: 1, gap: true  },
  { role: 'COO',                ready: 1, dev: 1, gap: false },
  { role: 'CHRO',               ready: 1, dev: 2, gap: false },
  { role: 'Head of 5G-SA',      ready: 0, dev: 1, gap: true  },
  { role: 'Head of B2B',        ready: 1, dev: 2, gap: false },
  { role: 'Head of TV',         ready: 1, dev: 1, gap: false },
  { role: 'DPO',                ready: 0, dev: 1, gap: true  },
]
const pip = { active: 38, recovered12m: 14, exited12m: 18, openOver90: 4 }

// SKILLS
const skillHeat = [
  { skill: 'Cloud (AWS/Azure)', current: 0.78, required: 0.92 },
  { skill: 'Kubernetes / SRE',  current: 0.52, required: 0.80 },
  { skill: 'Data engineering',  current: 0.66, required: 0.86 },
  { skill: 'AI / ML',           current: 0.34, required: 0.74 },
  { skill: '5G-SA / O-RAN',     current: 0.42, required: 0.70 },
  { skill: 'Cybersecurity',     current: 0.62, required: 0.86 },
  { skill: 'Product mgmt',      current: 0.58, required: 0.70 },
  { skill: 'NetOps automation', current: 0.46, required: 0.78 },
  { skill: 'GenAI / Cortex',    current: 0.22, required: 0.62 },
  { skill: 'Customer analytics',current: 0.58, required: 0.78 },
]
const learning = { hoursPerFTE: 32.4, completionPct: 0.84, costPerLearnerK: 1.2, externalCertsTTM: 286, aiFluencyPct: 0.38 }
const reskilling = [
  { from: 'Care L1 (voice)', to: 'Care L2 (digital + AI assist)', n: 84, ttFinishM: 4 },
  { from: 'Field copper',     to: 'Field FTTH',                    n: 124, ttFinishM: 6 },
  { from: 'IT generalist',    to: 'SRE / Platform',                n: 38, ttFinishM: 9 },
  { from: 'Data analyst',     to: 'Data eng / Snowpark',           n: 22, ttFinishM: 6 },
  { from: 'Marketing',        to: 'Growth + AI',                   n: 18, ttFinishM: 4 },
]

// ENGAGEMENT & D&I
const engagement = { eNPS: 14, response: 0.76, lastSurvey: '2026-04-22', mei: 78, inclusion: 72, belonging: 74 }
const eNPSTrend = Array.from({ length: 6 }, (_, i) => ({
  q: ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26'][i],
  eNPS: [4, 6, 9, 12, 13, 14][i],
  benchmark: 18,
}))
const sentimentTopics = [
  { topic: 'Pay & reward',         vol: 1240, sent: -0.18 },
  { topic: 'Manager support',      vol:  984, sent:  0.12 },
  { topic: 'Career growth',        vol:  840, sent: -0.08 },
  { topic: 'Hybrid / RTO',         vol:  720, sent: -0.32 },
  { topic: 'Tools & tech',         vol:  580, sent: -0.04 },
  { topic: 'Recognition',          vol:  480, sent:  0.18 },
  { topic: 'Wellbeing',            vol:  420, sent:  0.22 },
  { topic: 'Leadership comms',     vol:  380, sent:  0.06 },
]
const diversity = [
  { dim: 'Women overall',         pct: 0.36, target: 0.40, benchmark: 0.39 },
  { dim: 'Women in leadership',   pct: 0.32, target: 0.40, benchmark: 0.34 },
  { dim: 'Women in Network/IT',   pct: 0.21, target: 0.30, benchmark: 0.24 },
  { dim: 'Ethnic minority (self-ID)',pct: 0.14, target: 0.18, benchmark: 0.16 },
  { dim: 'Disability disclosed',  pct: 0.052, target: 0.08, benchmark: 0.06 },
  { dim: 'LGBTQ+ self-ID',        pct: 0.062, target: 0.07, benchmark: 0.06 },
  { dim: 'Under-30',              pct: 0.28, target: 0.32, benchmark: 0.30 },
  { dim: 'Over-50',               pct: 0.22, target: 0.20, benchmark: 0.21 },
]
const ergs = [
  { erg: 'Women in Tech',     members: 286, events12m: 18 },
  { erg: 'Pride',             members: 142, events12m: 14 },
  { erg: 'Cultures @ Cable Bahamas',members: 184, events12m: 12 },
  { erg: 'Disability network',members:  84, events12m:  8 },
  { erg: 'Parents & carers',  members: 240, events12m: 10 },
  { erg: 'Veterans',          members:  42, events12m:  6 },
]

// WELLBEING & ER
const wellbeing = {
  sicknessPct: 3.4, mentalHealthCases: 84, eapUtilisationPct: 0.18,
  ltir: 0.42, trir: 1.84, vehicleAccidents: 24, nearMiss: 86,
  grievances: 38, et: 6, settlementsK: 124, disciplinaries: 42, suspensions: 4,
  unionDensityCWU: 0.62, unionDensityConnect: 0.18, unionDensitySIPTU: 0.24,
  caExpiryNext: '2027-03-31', actionRiskScore: 0.18,
}
const safetyByFunc = [
  { fn: 'Field Ops',   ltir: 1.42, trir: 6.20, lostDays12m: 124 },
  { fn: 'Network & Ops', ltir: 0.62, trir: 2.40, lostDays12m: 48 },
  { fn: 'Customer Care', ltir: 0.18, trir: 0.84, lostDays12m: 22 },
  { fn: 'Office (corp)',  ltir: 0.04, trir: 0.18, lostDays12m: 6 },
]
const policyTraining = [
  { policy: 'DPA refresh',           done: 0.96 },
  { policy: 'Information security',   done: 0.94 },
  { policy: 'Code of conduct',        done: 0.98 },
  { policy: 'Anti-bribery',           done: 0.92 },
  { policy: 'Modern slavery',         done: 0.86 },
  { policy: 'AI use policy',          done: 0.74 },
  { policy: 'Right-to-disconnect',    done: 0.88 },
]

// EMPLOYEES (drill catalog)
type Emp = {
  id: string; name: string; title: string; fn: string; loc: string; mgr: string; tenureY: number;
  comp: number; compRatio: number; perf: 'Top' | 'Strong' | 'Solid' | 'Below' | 'PIP'; potential: 'High' | 'Med' | 'Low';
  riskScore: number; engagement: number; promoEligible: boolean; gpgFlag: boolean;
}
const employees: Emp[] = [
  { id: 'EMP-1042', name: 'Emma Rolle',      title: 'Lead SRE',           fn: 'IT & Data',     loc: 'Nassau',  mgr: 'C. Willems',    tenureY: 4.2, comp: 96000,  compRatio: 1.04, perf: 'Top',    potential: 'High', riskScore: 0.82, engagement: 8, promoEligible: true,  gpgFlag: false },
  { id: 'EMP-2188', name: 'Thomas Bethel',       title: 'Network architect',  fn: 'Network & Ops', loc: 'Freeport',    mgr: 'P. Knowles',   tenureY: 11.4, comp: 118000, compRatio: 1.12, perf: 'Top',    potential: 'High', riskScore: 0.32, engagement: 9, promoEligible: false, gpgFlag: false },
  { id: 'EMP-3322', name: 'Sofie Adderley',     title: 'Care L2',            fn: 'Customer Care', loc: 'Eleuthera',   mgr: 'M. O\'Brien', tenureY: 1.8, comp: 38000,  compRatio: 0.92, perf: 'Solid',  potential: 'Med',  riskScore: 0.74, engagement: 5, promoEligible: false, gpgFlag: true  },
  { id: 'EMP-4051', name: 'Daan Vermeulen',    title: 'Field engineer',     fn: 'Field Ops',     loc: 'Abaco',   mgr: 'D. Bain',      tenureY: 6.4, comp: 52000,  compRatio: 1.00, perf: 'Strong', potential: 'Med',  riskScore: 0.46, engagement: 7, promoEligible: true,  gpgFlag: false },
  { id: 'EMP-5519', name: 'Lore Ferguson',      title: 'Head of B2B sales',  fn: 'Commercial',    loc: 'Nassau',  mgr: 'F. Willems',    tenureY: 8.2, comp: 162000, compRatio: 1.08, perf: 'Top',    potential: 'High', riskScore: 0.28, engagement: 9, promoEligible: false, gpgFlag: false },
  { id: 'EMP-6602', name: 'Jonas Knowles',    title: 'Data engineer',      fn: 'IT & Data',     loc: 'Nassau',  mgr: 'C. Willems',    tenureY: 2.4, comp: 72000,  compRatio: 0.98, perf: 'Strong', potential: 'High', riskScore: 0.68, engagement: 6, promoEligible: true,  gpgFlag: false },
  { id: 'EMP-7740', name: 'Anke Adderley',      title: 'Marketing manager',  fn: 'Marketing',     loc: 'Nassau',  mgr: 'R. Rolle',    tenureY: 3.8, comp: 64000,  compRatio: 0.94, perf: 'Strong', potential: 'Med',  riskScore: 0.42, engagement: 7, promoEligible: false, gpgFlag: true  },
  { id: 'EMP-8801', name: 'Britt Bain',       title: 'CISO L-2',           fn: 'Risk',          loc: 'Nassau',  mgr: 'CISO',          tenureY: 5.6, comp: 142000, compRatio: 1.06, perf: 'Top',    potential: 'High', riskScore: 0.18, engagement: 9, promoEligible: false, gpgFlag: false },
]

// =============================================================================
export default function PeoplePage() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    try { const raw = localStorage.getItem('people-tab') as TabId; if (raw) return raw } catch { /* ignore */ }
    return 'overview'
  })
  useEffect(() => { try { localStorage.setItem('people-tab', tab) } catch { /* ignore */ } }, [tab])
  const [selectedEmp, setSelectedEmp] = useState<string>(() => {
    if (typeof window === 'undefined') return employees[0].id
    try { const raw = localStorage.getItem('people-emp'); if (raw) return raw } catch { /* ignore */ }
    return employees[0].id
  })
  useEffect(() => { try { localStorage.setItem('people-emp', selectedEmp) } catch { /* ignore */ } }, [selectedEmp])
  const drillInto = (id: string) => { setSelectedEmp(id); setTab('emp360') }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('People & Talent')}
        subtitle={tt('Workforce · Hiring · Attrition · Pay equity · Succession · Skills · Engagement · CPO cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('CPO Cockpit')}</div>}
      />

      <MlInsightSection
        heading="Workforce intelligence"
        models={[
          { name: 'Attrition / Flight-risk', metric: 'AUC 0.88', sub: 'voluntary-exit prediction' },
          { name: 'Hiring-demand Forecast', metric: 'MAPE 6%', sub: 'headcount planning' },
          { name: 'Skills-gap Recommender', metric: 'top-k', sub: 'upskilling suggestions' },
        ]}
        agentLabel="Run Workforce Planner" agentRunningLabel="Scoring…"
        agentSteps={[
          'Scored employees on flight risk (engagement + market signals)',
          'Forecast hiring demand by function & quarter',
          'Recommended retention & upskilling actions',
          'Drafted the people plan for leadership',
        ]}
        agentBlurb="Flight-risk plus hiring forecast turns HR from reactive backfilling into proactive talent planning."
        decision={{
          title: 'Retain at-risk talent in critical engineering & data roles',
          detail: 'The model flags elevated flight risk concentrated in 5G/data engineering — the hardest roles to backfill. Prioritise retention (comp review, growth path) there over broad measures.',
          impact: 'protects scarce skills · avoids costly backfill & delay',
          risk: 'use risk scores for support, never adverse action',
          linkTo: '#/portal/network', linkLabel: 'Open Network & Engineering',
        }}
        chart={{
          kind: 'bar', title: 'Flight-risk index by function (higher = more at risk)', xKey: 'fn',
          data: [
            { fn: '5G / Data Eng', risk: 38 }, { fn: 'Field Ops', risk: 22 },
            { fn: 'Sales', risk: 26 }, { fn: 'Care', risk: 31 }, { fn: 'Corporate', risk: 14 },
          ],
          series: [{ key: 'risk', name: 'Flight-risk index', color: '#FF4438' }],
          colorBy: { key: 'risk', high: 32, mid: 24 },
          note: '5G/Data Engineering carries the highest flight risk and the longest backfill time — the retention priority.',
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

      {tab === 'overview'  && <OverviewTab drillInto={drillInto} />}
      {tab === 'workforce' && <WorkforceTab />}
      {tab === 'hiring'    && <HiringTab />}
      {tab === 'attrition' && <AttritionTab />}
      {tab === 'pay'       && <PayTab />}
      {tab === 'perf'      && <PerfTab />}
      {tab === 'skills'    && <SkillsTab />}
      {tab === 'engage'    && <EngageTab />}
      {tab === 'wellbeing' && <WellbeingTab />}
      {tab === 'emp360'    && <Emp360Tab id={selectedEmp} setId={setSelectedEmp} />}

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML flight-risk · sentiment NLP on free-text · semantic view PEOPLE_360 · model people-cockpit v1.0 · refreshed daily 05:00 UTC
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- OVERVIEW
function OverviewTab({ drillInto }: { drillInto: (id: string) => void }) {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Headcount')} value={`${totals.hc.toLocaleString()}`} delta={`+${totals.contractors} contractors`} trend="up" icon={Users} accent />
        <KpiCard label={tt('Open reqs')} value={`${totals.openReqs}`} delta={`vacancy BSD ${(totals.vacancyCostK/1000).toFixed(1)}M`} trend="flat" icon={Briefcase} />
        <KpiCard label={tt('Regrettable attrition')} value={`${KPI.attritionRegrettablePct}%`} delta="-1.2pp YoY" trend="up" icon={UserX} />
        <KpiCard label={tt('eNPS')} value={`+${engagement.eNPS}`} delta={`bench +18`} trend="flat" icon={Smile} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Gender pay gap')} value={`${payGap.meanGenderPct.toFixed(1)}%`} delta="median -6.4%" trend="down" icon={Scale} />
        <KpiCard label={tt('High flight-risk')} value={`${flightRiskSummary.high}`} delta="ML-scored · top 10%" trend="down" icon={AlertOctagon} />
        <KpiCard label={tt('Skill gap (critical)')} value="6 of 10" delta="cloud · AI · 5G · sec" trend="flat" icon={Cpu} />
        <KpiCard label={tt('Successor coverage')} value={`${succession.filter((s) => !s.gap).length}/${succession.length}`} delta={`${succession.filter((s) => s.gap).length} gaps`} trend="flat" icon={Star} />
      </div>

      {/* Related cockpits — cross-page drill-through */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
        <span className="font-bold uppercase tracking-widest text-vfes-dark/45 mr-1">{tt('Related cockpits')}</span>
        <Link to="/portal/executive" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('CEO Dashboard')} <span aria-hidden>→</span></Link>
        <Link to="/portal/contact-center" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('Contact Centre')} <span aria-hidden>→</span></Link>
        <Link to="/portal/field-ops" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('Field Operations')} <span aria-hidden>→</span></Link>
        <Link to="/portal/risk" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('People Risk')} <span aria-hidden>→</span></Link>
        <Link to="/portal/regulatory" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('Pay Equity & ESG')} <span aria-hidden>→</span></Link>
        <Link to="/portal/ai-insights" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('AI Insights')} <span aria-hidden>→</span></Link>
        <Link to="/portal/operations" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('Operations')} <span aria-hidden>→</span></Link>
        <Link to="/portal/strategy" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 hover:bg-vfes-red/10 text-vfes-dark/70 hover:text-vfes-dark font-semibold transition-colors">{tt('Strategy & OKRs')} <span aria-hidden>→</span></Link>
      </div>

      {/* Mobile / RAN engineering function */}
      <Panel title={tt('Mobile / RAN engineering — headcount · attrition · eNPS')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('364 staff · 25 open roles')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Team')}</th><th>{tt('Headcount')}</th><th>{tt('Avg tenure')}</th><th>{tt('Attrition (12m)')}</th><th>{tt('Open roles')}</th><th>{tt('eNPS')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_PEOPLE.map((t) => (
              <tr key={t.team} className="border-t border-black/5">
                <td className="py-2 font-semibold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />{tt(t.team)}</td>
                <td className="font-mono text-xs font-bold">{t.headcount}</td>
                <td className="font-mono text-xs">{t.avgTenure.toFixed(1)} y</td>
                <td className={`font-mono text-xs font-bold ${t.attrition12m >= 11 ? 'text-red-600' : t.attrition12m >= 8 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.attrition12m.toFixed(1)}%</td>
                <td className={`font-mono text-xs ${t.openRoles >= 5 ? 'text-amber-700 font-bold' : 'text-vfes-dark'}`}>{t.openRoles}</td>
                <td className={`font-mono text-xs font-bold ${t.eNps >= 45 ? 'text-emerald-600' : t.eNps >= 35 ? 'text-vfes-dark' : 'text-amber-600'}`}>+{t.eNps}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-vfes-dark/20 font-bold">
              <td className="py-2">{tt('Total mobile / RAN function')}</td>
              <td className="font-mono text-xs">{MOBILE_PEOPLE.reduce((s, t) => s + t.headcount, 0)}</td>
              <td className="font-mono text-xs">{(MOBILE_PEOPLE.reduce((s, t) => s + t.avgTenure * t.headcount, 0) / MOBILE_PEOPLE.reduce((s, t) => s + t.headcount, 0)).toFixed(1)} y</td>
              <td className="font-mono text-xs">{(MOBILE_PEOPLE.reduce((s, t) => s + t.attrition12m * t.headcount, 0) / MOBILE_PEOPLE.reduce((s, t) => s + t.headcount, 0)).toFixed(1)}%</td>
              <td className="font-mono text-xs">{MOBILE_PEOPLE.reduce((s, t) => s + t.openRoles, 0)}</td>
              <td className="font-mono text-xs">+{Math.round(MOBILE_PEOPLE.reduce((s, t) => s + t.eNps * t.headcount, 0) / MOBILE_PEOPLE.reduce((s, t) => s + t.headcount, 0))}</td>
            </tr>
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Open RAN team is the youngest (2.4y avg tenure) with highest attrition (12.8%) — retention plan in flight. Mobile field operations is largest at-risk team — 11.2% attrition vs 9.4% engineering average.')}</div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Headcount bridge · FY25 → FY26')} insight={{ insight: 'Net headcount growth of 142 versus plan masks a 28% increase in unplanned exits in Network and Field Ops.', action: 'Freeze discretionary backfills outside critical-path roles and redirect budget to retention bonuses in the two over-attriting functions.', impact: 'Closing the 214-head gap by Q3 reduces contractor overspend by an estimated BSD 3.1M and restores delivery capacity on the 5G rollout.' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hcWaterfall}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any, p: any) => [p.payload.kind === 'open' || p.payload.kind === 'close' ? p.payload.val : (p.payload.kind === 'in' ? '+' : '−') + p.payload.val, p.payload.name]} />
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="val" stackId="a" radius={[4, 4, 0, 0]}>
                  {hcWaterfall.map((b, i) => <Cell key={i} fill={b.kind === 'open' || b.kind === 'close' ? '#1f2937' : b.kind === 'in' ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Engagement (eNPS) · trend')} insight={{ insight: 'Company eNPS has declined 11 points over three consecutive quarters, with the steepest drops in mid-level technical roles.', action: 'Commission a targeted pulse survey in the bottom-quartile functions and mandate manager action-planning within 30 days of results.', impact: 'Every 5-point eNPS improvement correlates historically with a 1.2% reduction in voluntary attrition, protecting roughly BSD 1.8M in replacement costs.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={eNPSTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="q" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="eNPS" stroke={RED} strokeWidth={3} dot={{ r: 4 }} />
              <Line dataKey="benchmark" stroke={GREY} strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Function heat map')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Function')}</th><th>{tt('HC')}</th><th>{tt('Plan')}</th><th>{tt('Attr 12m')}</th><th>{tt('eNPS')}</th><th>{tt('GPG')}</th><th>{tt('Women')}</th></tr>
            </thead>
            <tbody>
              {orgFunctions.map((f) => (
                <tr key={f.fn} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{f.fn}</td>
                  <td>{f.hc}</td>
                  <td className={f.hc < f.plan ? 'text-vfes-dark font-bold' : ''}>{f.plan}</td>
                  <td className={f.attrTTM > 0.15 ? 'text-vfes-dark font-bold' : f.attrTTM > 0.10 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>{(f.attrTTM * 100).toFixed(1)}%</td>
                  <td className={f.eNPS < 0 ? 'text-vfes-dark font-bold' : ''}>{f.eNPS > 0 ? '+' : ''}{f.eNPS}</td>
                  <td className={f.gpgPct < -5 ? 'text-vfes-dark font-bold' : ''}>{f.gpgPct.toFixed(1)}%</td>
                  <td>{(f.women * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Span of control & layers')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Layer')}</th><th>{tt('Count')}</th><th>{tt('Span ratio')}</th></tr>
            </thead>
            <tbody>
              {span.map((s) => (
                <tr key={s.layer} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{s.layer}</td>
                  <td>{s.n.toLocaleString()}</td>
                  <td className="font-mono">{s.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/55 mt-3">{tt('Target: collapse to 5 layers · IC span 1:6 by FY27')}</div>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Top 5 managers driving regrettable attrition.',
        'Where is the gender pay gap widening QoQ?',
        'Which roles have single-point-of-failure successors?',
        'Forecast headcount cost vs plan at current hiring run-rate.',
      ]} />

      <Panel title={tt('At-risk talent — click to drill in')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Name')}</th><th>{tt('Role')}</th><th>{tt('Function')}</th><th>{tt('Perf')}</th><th>{tt('Risk')}</th></tr>
          </thead>
          <tbody>
            {employees.filter((e) => e.riskScore > 0.5).sort((a, b) => b.riskScore - a.riskScore).map((e) => (
              <tr key={e.id} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(e.id)}>
                <td className="py-2 font-mono text-xs">{e.id}</td>
                <td className="font-semibold">{tt(e.name)} <ChevronRight className="inline w-3 h-3 text-vfes-dark/30" /></td>
                <td className="text-xs">{tt(e.title)}</td>
                <td className="text-xs text-vfes-dark/60">{e.fn}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ratingColor[e.perf]}`}>{e.perf}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-zinc-100 rounded"><div className="h-full bg-vfes-red rounded" style={{ width: `${e.riskScore * 100}%` }} /></div>
                    <span className="text-xs font-bold">{(e.riskScore * 100).toFixed(0)}%</span>
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

// ----------------------------------------------------------------------------- WORKFORCE
function WorkforceTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('HC vs plan')} value={`${totals.hc} / ${totals.plan}`} delta={`${totals.plan - totals.hc} vacancies`} trend="flat" icon={Users} accent />
        <KpiCard label={tt('Build/buy/borrow')} value="73% / 14% / 13%" delta="perm / contract / outsourced" trend="flat" icon={Briefcase} />
        <KpiCard label={tt('Layers')} value="6" delta="target 5 by FY27" trend="flat" icon={Building2} />
        <KpiCard label={tt('Avg span')} value="1:4.6" delta="target 1:6" trend="up" icon={MapIcon} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('HC vs plan by function')} insight={{ insight: 'Network Engineering and Customer Operations are together 67 heads below plan, while Corporate Functions are 12% over-staffed against budget.', action: 'Redeploy 15 surplus Corporate Functions roles through an internal mobility sprint before opening external requisitions in under-plan functions.', impact: 'Internal redeployment saves approximately BSD 900K in agency fees and reduces time-to-productivity for redeployed staff by 40% versus external hires.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orgFunctions} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="fn" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hc" fill={RED} name={tt('HC')} />
              <Bar dataKey="plan" fill={GREY} name={tt('Plan')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Layers & span (org pyramid)')} insight={{ insight: 'The organisation still operates at 6 layers with an average span of 1:4.6, well short of the FY27 target of 5 layers and 1:6 span.', action: 'Identify the 18 manager roles with spans of 3 or fewer direct reports and initiate consolidation as part of the next org design review.', impact: 'Reaching the 1:6 span target removes an estimated 22 management layers, saving BSD 4.2M annually and accelerating decision speed.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={span} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="layer" type="category" tick={{ fontSize: 11 }} width={60} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill={RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Critical-role bus-factor')}>
        <div className="grid md:grid-cols-3 gap-3">
          {succession.map((s) => (
            <div key={tt(s.role)} className={`p-3 rounded-lg border ${s.gap ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55">{tt(s.role)}</div>
              <div className="text-sm mt-1"><span className="font-bold">{s.ready}</span> ready · <span className="font-bold">{s.dev}</span>{tt('dev')}</div>
              {s.gap && <div className="text-[10px] text-vfes-dark font-bold mt-1 uppercase tracking-widest">{tt('⚠ Bus-factor risk')}</div>}
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- HIRING
function HiringTab() {
  const conv = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Open reqs')} value={`${hiring.reqsOpen}`} delta="across 9 fns" trend="flat" icon={Briefcase} accent />
        <KpiCard label={tt('Time-to-fill')} value={`${hiring.ttfDays}d`} delta="target 45d" trend="down" icon={Clock} />
        <KpiCard label={tt('Offer-accept')} value={`${(hiring.offerAccept * 100).toFixed(0)}%`} delta="bench 84%" trend="up" icon={BadgeCheck} />
        <KpiCard label={tt('90-day quit')} value={`${(hiring.dayOne90Quit * 100).toFixed(1)}%`} delta="cost-per-hire BSD 6.4K" trend="up" icon={UserX} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Hiring funnel')} insight={{ insight: 'The funnel is dropping 38% of candidates between first interview and offer, a rate 14 points above industry benchmark for technical roles.', action: 'Conduct a debrief audit on declined offers this quarter to identify whether the drop-off is driven by compensation, process speed, or role positioning.', impact: 'Halving the interview-to-offer attrition rate would generate an additional 41 hires per quarter without increasing sourcing spend.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hiringFunnel}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis scale="log" domain={[1, 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => Number(v).toLocaleString()} />
              <Bar dataKey="n" fill={RED} radius={[4, 4, 0, 0]}>
                {hiringFunnel.map((_, i) => <Cell key={i} fill={[GREY, BLUE, AMBER, '#fb923c', RED2, RED][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/55 text-center mt-1">log scale · {hiring.pipelineApplied.toLocaleString()} applied → {hiring.accept} hired ({conv(hiring.accept, hiring.pipelineApplied)})</div>
        </Panel>
        <Panel title={tt('Source of hire (TTM)')} insight={{ insight: 'Employee referrals account for only 11% of hires despite producing the lowest 90-day quit rate and fastest ramp time of any channel.', action: 'Relaunch the referral incentive scheme with a doubled bonus for critical technical roles and a tiered payout linked to 90-day retention.', impact: 'Shifting referral share from 11% to 25% of hires would save an estimated BSD 520K annually in agency fees based on current cost-per-hire differentials.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={hiringSource} dataKey="n" nameKey="src" outerRadius={90} label={(d: any) => `${d.src}: ${d.n}`}>
                {[RED, GREEN, AMBER, BLUE, PURPLE, TEAL, '#fb923c'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Adverse-impact ratio (gender mix at each funnel stage)')} insight={{ insight: 'Female candidate representation drops from 39% at application to 22% at offer stage, indicating bias risk in the interview evaluation process.', action: 'Mandate structured scoring rubrics and gender-balanced interview panels for all roles in functions where the adverse-impact ratio falls below 0.8.', impact: 'Closing the funnel gap would increase female engineering hires by an estimated 28 per year, improving diversity representation toward the 30% board target.' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={adverseImpact}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="m" stackId="a" fill={BLUE} name={tt('Male')} />
            <Bar dataKey="f" stackId="a" fill={RED} name={tt('Female')} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Target: 4/5ths rule across all stages · current minor drop at Final round')}</div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- ATTRITION
function AttritionTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Total attrition (12m)')} value={`${KPI.attritionTotalPct}%`} delta="bench 14.0%" trend="up" icon={UserX} accent />
        <KpiCard label={tt('Regrettable')} value={`${KPI.attritionRegrettablePct}%`} delta="of total" trend="flat" icon={AlertTriangle} />
        <KpiCard label={tt('High flight-risk')} value={`${flightRiskSummary.high}`} delta={`med ${flightRiskSummary.medium} · low ${flightRiskSummary.low}`} trend="down" icon={AlertOctagon} />
        <KpiCard label={tt('0-12m new-hire churn')} value="14.2%" delta="vs 8% target" trend="down" icon={Clock} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Attrition trend (12mo, %)')} insight={{ insight: 'Regrettable attrition has risen to 14.2%, with the top-performer cohort leaving at nearly twice the rate of the broader workforce.', action: 'Fast-track retention conversations and spot-award eligibility reviews for all employees rated Exceeds in the last calibration cycle.', impact: 'Reducing regrettable attrition by 3 percentage points saves an estimated BSD 6.4M in replacement costs and preserves critical institutional knowledge.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={attrTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area dataKey="total"       fill="#ef444422" stroke={RED} name={tt('Total')} />
              <Line dataKey="regrettable" stroke={AMBER} strokeWidth={2} name={tt('Regrettable')} />
              <Line dataKey="involuntary" stroke={GREY} strokeWidth={2} name={tt('Involuntary')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Tenure cohort survival')} insight={{ insight: 'The 12 to 24-month tenure band shows a 31% departure rate, indicating that the post-onboarding engagement window is not being captured effectively.', action: 'Introduce a structured 18-month career conversation programme pairing employees with senior mentors and a visible internal mobility offer.', impact: 'Improving 12-24 month survival by 10 percentage points would retain approximately 85 additional employees per year at a combined replacement-cost saving of BSD 2.2M.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={tenureCohorts}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="tenure" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="active" fill={GREY} name={tt('Active')} />
              <Line yAxisId="r" dataKey="leftPct" stroke={RED} strokeWidth={3} name={tt('Left %')} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Flight-risk model · top drivers')} insight={{ insight: 'Absence of a promotion in the last 18 months is the single strongest predictor of departure, outweighing compensation gap and manager score combined.', action: 'Run a career-velocity audit this month to surface employees overdue for a grade review and present a cohort to the senior leadership team for acceleration.', impact: 'Acting on the top 20% of the model output has historically reduced predicted departures by 35%, saving an estimated BSD 3.8M per cycle.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={flightRisk} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" domain={[0, 0.3]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
              <YAxis dataKey="driver" type="category" tick={{ fontSize: 10 }} width={170} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
              <Bar dataKey="weight" fill={RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/55 text-center mt-1">{tt('Snowpark ML · gradient-boosted survival model')}</div>
        </Panel>
        <Panel title={tt('Manager outliers — high attrition')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Manager')}</th><th>{tt('Attr')}</th><th>{tt('eNPS')}</th><th>{tt('Span')}</th><th>{tt('Action')}</th></tr>
            </thead>
            <tbody>
              {managerOutliers.map((m) => (
                <tr key={m.mgr} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{m.mgr}</td>
                  <td className="text-vfes-dark font-bold">{(m.attr12m * 100).toFixed(0)}%</td>
                  <td className={m.eNPS < 0 ? 'text-vfes-dark font-bold' : ''}>{m.eNPS > 0 ? '+' : ''}{m.eNPS}</td>
                  <td>{m.span}</td>
                  <td className="text-xs">{tt(m.action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- PAY
function PayTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Mean GPG')} value={`${payGap.meanGenderPct.toFixed(1)}%`} delta="Bahamian GPG Act 2021" trend="up" icon={Scale} accent />
        <KpiCard label={tt('Median GPG')} value={`${payGap.medianGenderPct.toFixed(1)}%`} delta="bench -8.4%" trend="up" icon={Scale} />
        <KpiCard label={tt('Ethnicity gap (mean)')} value={`${payGap.ethnicityMean.toFixed(1)}%`} delta="voluntary disclosure" trend="flat" icon={Globe} />
        <KpiCard label={tt('Living-wage non-compl.')} value={`${livingWage.underN}`} delta="own workforce 100%" trend="up" icon={ShieldCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Gender pay gap by function')} insight={{ insight: 'Network Engineering shows a mean gender pay gap of 11.4%, the widest in the business and above the internal pay-equity review threshold.', action: 'Commission a pay equity audit for Network Engineering this quarter and prepare a remediation plan ahead of the June 2026 reporting deadline.', impact: 'Closing the gap in Network Engineering addresses the highest legal exposure and positions the company as compliant before the directive deadline, avoiding potential regulatory fines.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payGapByFunc} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="fn" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <ReferenceLine x={0} stroke="#1f2937" />
              <Bar dataKey="gpg" radius={[0, 4, 4, 0]}>
                {payGapByFunc.map((d, i) => <Cell key={i} fill={d.gpg < -5 ? RED : d.gpg < 0 ? AMBER : GREEN} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Compa-ratio distribution')} insight={{ insight: '18% of the workforce sits below 85% compa-ratio, concentrated in customer-facing roles where external market rates have risen faster than internal bands.', action: 'Adjust the salary bands for the three lowest compa-ratio job families in the next remuneration committee cycle and prioritise them in the mid-year review budget.', impact: 'Bringing below-band employees to at least 90% compa-ratio is projected to reduce attrition in those roles by 6 percentage points and close the living-wage compliance gap.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compaDist}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="band" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {compaDist.map((d, i) => <Cell key={i} fill={d.band === '<0.85' ? RED : d.band === '>1.15' ? AMBER : GREEN} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Employment Act pay-equity review · readiness')}>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <Mini label={tt('Job-architecture mapped')} value="86%" />
          <Mini label={tt('Pay-band publication')} value="Pilot" />
          <Mini label={tt('Joint pay-assessment')} value="Drafted" />
          <Mini label={tt('Reporting cadence')} value="Annual" />
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- PERF
function PerfTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Top + Strong')} value={`${((ratings[0].pct + ratings[1].pct) * 100).toFixed(0)}%`} delta="of workforce" trend="up" icon={Award} accent />
        <KpiCard label={tt('PIPs active')} value={`${pip.active}`} delta={`${pip.openOver90} > 90d`} trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('Successor coverage')} value={`${succession.filter((s) => !s.gap).length}/${succession.length}`} delta="ExCo + critical" trend="flat" icon={Star} />
        <KpiCard label={tt('Internal mobility')} value="18.4%" delta="of total moves" trend="up" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Calibrated rating distribution')} insight={{ insight: 'The rating distribution shows a pronounced central tendency bias with 71% of employees receiving the mid-band rating, limiting differentiation for reward and development.', action: 'Brief all calibration facilitators on forced-distribution guidelines before the next review cycle and introduce a secondary review for managers with fewer than 5% top ratings.', impact: 'Improving rating differentiation enables more targeted variable-pay allocation and strengthens the link between performance and reward, reducing perceived pay inequity.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ratings}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="r" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(1)}%`} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {ratings.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('9-box (perf × potential)')}>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[3, 2, 1].map((pot) => [1, 2, 3].map((perf) => {
              const cell = nineBox.find((c) => c.perf === perf && c.pot === pot)
              const high = (perf === 3 && pot === 3) || (perf === 3 && pot === 2) || (perf === 2 && pot === 3)
              const low = (perf === 1 && pot === 1)
              return (
                <div key={`${perf}-${pot}`} className={`p-3 rounded text-xs font-bold ${high ? 'bg-emerald-100 text-emerald-700' : low ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>
                  <div className="text-2xl">{cell?.n}</div>
                  <div className="text-[10px] uppercase tracking-widest">P{perf}·Pot{pot}</div>
                </div>
              )
            }))}
          </div>
          <div className="flex justify-between text-[10px] text-vfes-dark/55 uppercase tracking-widest mt-2"><span>{tt('← Performance')}</span><span>{tt('Potential ↑')}</span></div>
        </Panel>
      </div>

      <Panel title={tt('Succession coverage — top roles')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Role')}</th><th>{tt('Ready-now')}</th><th>{tt('1-2y dev')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {succession.map((s) => (
              <tr key={tt(s.role)} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(s.role)}</td>
                <td className="font-bold">{s.ready}</td>
                <td>{s.dev}</td>
                <td>{s.gap ? <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-red-100 text-red-700">{tt('⚠ Gap')}</span> : <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('Covered')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- SKILLS
function SkillsTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Hours / FTE')} value={`${learning.hoursPerFTE}`} delta={`completion ${(learning.completionPct * 100).toFixed(0)}%`} trend="up" icon={GraduationCap} accent />
        <KpiCard label={tt('External certs (TTM)')} value={`${learning.externalCertsTTM}`} delta="cloud · sec · agile" trend="up" icon={Award} />
        <KpiCard label={tt('AI fluency')} value={`${(learning.aiFluencyPct * 100).toFixed(0)}%`} delta="target 80% by Q4" trend="up" icon={Cpu} />
        <KpiCard label={tt('Reskilling pipeline')} value={`${reskilling.reduce((s, r) => s + r.n, 0)}`} delta="across 5 paths" trend="up" icon={TrendingUp} />
      </div>

      <Panel title={tt('Skill heat map · current vs required')} insight={{ insight: 'Cloud-native architecture and AI/ML proficiency show the largest gaps, with current capability at 38% and 29% of required levels respectively across engineering functions.', action: 'Prioritise these two skill domains in the next learning budget cycle and set a Q4 milestone of 60% proficiency through a combination of reskilling paths and targeted external hiring.', impact: 'Closing the cloud and AI skill gap reduces dependency on costly external contractors, projected to save BSD 2.7M annually once internal capability reaches the required threshold.' }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={skillHeat} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid stroke="#eef0f3" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
            <YAxis dataKey="skill" type="category" tick={{ fontSize: 10 }} width={140} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="current"  fill={RED}   name={tt('Current')} />
            <Bar dataKey="required" fill={GREEN} name={tt('Required')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="mt-6">
        <Panel title={tt('Reskilling pipeline (active paths)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('From')}</th><th>{tt('To')}</th><th>N</th><th>{tt('Time-to-finish')}</th></tr>
            </thead>
            <tbody>
              {reskilling.map((r) => (
                <tr key={r.from} className="border-t border-black/5">
                  <td className="py-2 text-xs">{r.from}</td>
                  <td className="font-semibold">→ {r.to}</td>
                  <td className="font-bold">{r.n}</td>
                  <td>{r.ttFinishM}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- ENGAGE & D&I
function EngageTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('eNPS')} value={`+${engagement.eNPS}`} delta={`response ${(engagement.response * 100).toFixed(0)}%`} trend="flat" icon={Smile} accent />
        <KpiCard label={tt('Manager Effectiveness')} value={`${engagement.mei}`} delta="bench 76" trend="up" icon={Star} />
        <KpiCard label={tt('Inclusion index')} value={`${engagement.inclusion}`} delta="bench 70" trend="up" icon={Heart} />
        <KpiCard label={tt('Belonging')} value={`${engagement.belonging}`} delta="all groups" trend="up" icon={Users} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Sentiment topics (Cortex NLP on free-text)')} insight={{ insight: 'Free-text survey responses most frequently surface themes of workload overload and lack of career clarity, appearing in 42% and 38% of comments respectively.', action: 'Incorporate workload sustainability metrics into the next manager effectiveness review and require each function head to present a career-path framework by end of quarter.', impact: 'Addressing the top two sentiment themes is associated with a 9-point eNPS improvement in comparable cohorts, reducing voluntary attrition risk across the affected population.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis type="number" dataKey="vol" name={tt('Volume')} tick={{ fontSize: 11 }} label={{ value: 'Comment volume →', fontSize: 10, position: 'bottom', offset: -4 }} />
              <YAxis type="number" dataKey="sent" name={tt('Sentiment')} domain={[-0.4, 0.4]} tick={{ fontSize: 11 }} label={{ value: 'Sentiment', fontSize: 10, angle: -90, position: 'left' }} />
              <ZAxis range={[100, 200]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any, p: any) => [p.payload.topic, `${(p.payload.sent * 100).toFixed(0)}%`]} />
              <ReferenceLine y={0} stroke="#1f2937" />
              <Scatter data={sentimentTopics}>
                {sentimentTopics.map((d, i) => <Cell key={i} fill={d.sent < -0.1 ? RED : d.sent > 0.1 ? GREEN : AMBER} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Diversity representation')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Dimension')}</th><th>{tt('Now')}</th><th>{tt('Target')}</th><th>{tt('Bench')}</th></tr>
            </thead>
            <tbody>
              {diversity.map((d) => (
                <tr key={d.dim} className="border-t border-black/5">
                  <td className="py-2 text-xs">{d.dim}</td>
                  <td className={d.pct < d.target * 0.85 ? 'text-vfes-dark font-bold' : 'font-bold'}>{(d.pct * 100).toFixed(1)}%</td>
                  <td className="text-vfes-dark/55">{(d.target * 100).toFixed(0)}%</td>
                  <td className="text-vfes-dark/55">{(d.benchmark * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('ERG participation')}>
        <div className="grid md:grid-cols-3 gap-3">
          {ergs.map((e) => (
            <div key={e.erg} className="p-3 rounded-lg bg-zinc-50 border border-black/5">
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55">{e.erg}</div>
              <div className="text-2xl font-extrabold mt-1">{e.members} <span className="text-xs font-normal text-vfes-dark/55">{tt('members')}</span></div>
              <div className="text-[10px] text-vfes-dark/55">{e.events12m} events / 12m</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- WELLBEING & ER
function WellbeingTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Sickness')} value={`${wellbeing.sicknessPct}%`} delta="bench 3.6%" trend="up" icon={Heart} accent />
        <KpiCard label={tt('LTIR (field)')} value={`${wellbeing.ltir}`} delta="per 200K hrs" trend="up" icon={ShieldCheck} />
        <KpiCard label={tt('Grievances open')} value={`${wellbeing.grievances}`} delta={`${wellbeing.et} ET cases`} trend="down" icon={AlertOctagon} />
        <KpiCard label={tt('Union density')} value={`${(wellbeing.unionDensityCWU * 100).toFixed(0)}%`} delta="CWU primary" trend="flat" icon={Users} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Safety by function (per 200K hrs)')} insight={{ insight: 'Field Operations has an LTIR of 4.2, more than double the company average and above the telecommunications industry benchmark of 2.8 per 200K hours.', action: 'Commission an immediate safety walk-through audit in Field Operations and suspend non-essential lone-working activities pending implementation of enhanced buddy protocols.', impact: 'Bringing Field Operations LTIR to the industry benchmark reduces lost-day costs and insurance premium exposure, with a projected annual saving of BSD 380K.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={safetyByFunc}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="fn" tick={{ fontSize: 10 }} angle={-12} textAnchor="end" height={60} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="ltir" fill={RED} name={tt('LTIR')} />
              <Bar yAxisId="l" dataKey="trir" fill={AMBER} name={tt('TRIR')} />
              <Line yAxisId="r" dataKey="lostDays12m" stroke="#1f2937" strokeWidth={2} name={tt('Lost days')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('ER caseload')}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Mini label={tt('Mental-health cases')} value={`${wellbeing.mentalHealthCases}`} />
            <Mini label={tt('EAP utilisation')} value={`${(wellbeing.eapUtilisationPct * 100).toFixed(0)}%`} positive />
            <Mini label={tt('Vehicle accidents')} value={`${wellbeing.vehicleAccidents}`} />
            <Mini label={tt('Near-miss reports')} value={`${wellbeing.nearMiss}`} />
            <Mini label={tt('ET / WRC cases')} value={`${wellbeing.et}`} negative={wellbeing.et > 0} />
            <Mini label={tt('Settlements')} value={`BSD ${wellbeing.settlementsK}K`} />
            <Mini label={tt('Disciplinaries')} value={`${wellbeing.disciplinaries}`} />
            <Mini label={tt('Suspensions')} value={`${wellbeing.suspensions}`} negative={wellbeing.suspensions > 0} />
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Industrial relations posture')}>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('CWU density')}</td><td className="text-right font-bold">{(wellbeing.unionDensityCWU * 100).toFixed(0)}%</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('Connect (Tech)')}</td><td className="text-right font-bold">{(wellbeing.unionDensityConnect * 100).toFixed(0)}%</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('SIPTU')}</td><td className="text-right font-bold">{(wellbeing.unionDensitySIPTU * 100).toFixed(0)}%</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('Next CA expiry')}</td><td className="text-right font-bold">{wellbeing.caExpiryNext}</td></tr>
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('Action-risk score')}</td><td className={`text-right font-bold ${wellbeing.actionRiskScore < 0.3 ? 'text-emerald-600' : wellbeing.actionRiskScore < 0.5 ? 'text-amber-600' : 'text-vfes-dark'}`}>{(wellbeing.actionRiskScore * 100).toFixed(0)}%</td></tr>
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Mandatory training completion')}>
          {policyTraining.map((p) => (
            <div key={p.policy} className="mb-2.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-xs">{p.policy}</span>
                <span className="font-bold text-xs">{(p.done * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${p.done >= 0.95 ? 'bg-emerald-500' : p.done >= 0.85 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${p.done * 100}%` }} /></div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- EMPLOYEE 360
function Emp360Tab({ id, setId }: { id: string; setId: (id: string) => void }) {
  const e = useMemo(() => employees.find((x) => x.id === id) ?? employees[0], [id])
  return (
    <>
      <div className="bg-vfes-red/5 border-l-4 border-vfes-red rounded-r-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-vfes-dark/70">
        <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Employee drill-down')}</span>
        <label className="flex items-center gap-1.5">Pick employee
          <select value={id} onChange={(ev) => setId(ev.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
            {employees.map((x) => <option key={x.id} value={x.id}>{x.id} · {tt(x.name)}</option>)}
          </select>
        </label>
        <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('PII tokenised · access logged')}</span>
      </div>

      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">{e.id} · {e.fn} · {e.loc}</div>
            <div className="text-3xl font-extrabold mt-1">{tt(e.name)}</div>
            <div className="text-sm text-white/70 mt-1">{tt(e.title)} · Manager: {e.mgr} · Tenure {e.tenureY.toFixed(1)}y</div>
          </div>
          <div className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest ${e.riskScore > 0.6 ? 'bg-red-600' : e.riskScore > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}>Flight risk · {(e.riskScore * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Performance')} value={e.perf} delta={`Pot: ${e.potential}`} trend="flat" icon={Award} accent />
        <KpiCard label={tt('Comp / compa')} value={`BSD ${(e.comp / 1000).toFixed(0)}K`} delta={`compa ${e.compRatio.toFixed(2)}`} trend="flat" icon={Wallet} />
        <KpiCard label={tt('Engagement')} value={`${e.engagement}/10`} delta="from pulse Apr" trend="flat" icon={Smile} />
        <KpiCard label={tt('Promo eligible')} value={e.promoEligible ? 'Yes' : 'No'} delta={e.gpgFlag ? 'GPG flag' : 'OK'} trend="flat" icon={BadgeCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Career timeline (synthetic)')}>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3 p-2 rounded bg-[#fafbfc] border border-black/5"><span className="text-xs text-vfes-dark/55 font-mono w-16 shrink-0">{tt('2022-Q1')}</span><span>Joined as {e.title.split(' ').slice(-2).join(' ')}</span></div>
            <div className="flex gap-3 p-2 rounded bg-[#fafbfc] border border-black/5"><span className="text-xs text-vfes-dark/55 font-mono w-16 shrink-0">{tt('2023-Q3')}</span><span>{tt('Promotion · band L4')}</span></div>
            <div className="flex gap-3 p-2 rounded bg-[#fafbfc] border border-black/5"><span className="text-xs text-vfes-dark/55 font-mono w-16 shrink-0">{tt('2024-Q4')}</span><span>{tt('Off-cycle increase 6%')}</span></div>
            <div className="flex gap-3 p-2 rounded bg-[#fafbfc] border border-black/5"><span className="text-xs text-vfes-dark/55 font-mono w-16 shrink-0">{tt('2025-Q2')}</span><span>{tt('Cross-function rotation (3m)')}</span></div>
            <div className="flex gap-3 p-2 rounded bg-[#fafbfc] border border-black/5"><span className="text-xs text-vfes-dark/55 font-mono w-16 shrink-0">{tt('2026-Q1')}</span><span>Performance: <b>{e.perf}</b></span></div>
          </div>
        </Panel>
        <Panel title={tt('Learning & certs')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 rounded bg-[#fafbfc] border border-black/5"><span>{tt('Hours TTM')}</span><b>42</b></div>
            <div className="flex justify-between p-2 rounded bg-[#fafbfc] border border-black/5"><span>{tt('Mandatory completion')}</span><b className="text-emerald-600">100%</b></div>
            <div className="flex justify-between p-2 rounded bg-[#fafbfc] border border-black/5"><span>{tt('External cert TTM')}</span><b>{tt('AWS SA Pro')}</b></div>
            <div className="flex justify-between p-2 rounded bg-[#fafbfc] border border-black/5"><span>{tt('IDP status')}</span><b>{tt('On track')}</b></div>
            <div className="flex justify-between p-2 rounded bg-[#fafbfc] border border-black/5"><span>{tt('AI fluency')}</span><b>{tt('Yes (Cortex 101)')}</b></div>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Flight-risk drivers (this employee)')}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Pay vs market')}</span><b className={e.compRatio < 0.95 ? 'text-vfes-dark' : 'text-emerald-600'}>{e.compRatio < 0.95 ? 'Below' : 'In-range'}</b></div>
            <div className="flex justify-between"><span>{tt('Manager (MEI)')}</span><b>{e.mgr === 'M. O\'Brien' ? 'Watch' : 'Healthy'}</b></div>
            <div className="flex justify-between"><span>{tt('Time in role')}</span><b>{e.tenureY > 3 ? 'Stretched' : 'Normal'}</b></div>
            <div className="flex justify-between"><span>{tt('Engagement')}</span><b className={e.engagement < 6 ? 'text-vfes-dark' : 'text-emerald-600'}>{e.engagement}/10</b></div>
            <div className="flex justify-between"><span>{tt('External market signals')}</span><b>{e.riskScore > 0.7 ? 'Strong' : 'None'}</b></div>
          </div>
        </Panel>
        <Panel title={tt('Recommended actions (Cortex Agent)')}>
          <ul className="space-y-2 text-sm">
            {e.compRatio < 0.95 && <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-vfes-dark mt-0.5 shrink-0" />{tt('Off-cycle adjustment to 1.00 compa-ratio')}</li>}
            {e.engagement < 6 && <li className="flex items-start gap-2"><Smile className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />{tt('Schedule stay-interview with skip-level')}</li>}
            {e.promoEligible && <li className="flex items-start gap-2"><Star className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />{tt('Add to next promo calibration')}</li>}
            {e.gpgFlag && <li className="flex items-start gap-2"><Scale className="w-4 h-4 text-vfes-dark mt-0.5 shrink-0" />{tt('Pay-equity audit flag — review band')}</li>}
            <li className="flex items-start gap-2"><GraduationCap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /> Match to {e.fn === 'IT & Data' ? 'GenAI / Cortex' : '5G-SA'} reskill cohort</li>
          </ul>
        </Panel>
      </div>

      <SiPrompts prompts={[
        `Show peers with similar profile and higher comp.`,
        `Forecast retention probability for ${tt(e.name)} next 12 months.`,
        `Suggest internal roles matching ${tt(e.name)}'s skill graph.`,
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
