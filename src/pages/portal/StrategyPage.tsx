import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import type { DomainLink, Priority, WatchItem } from '../../components/ExecCockpit'
import {
  Target, Flag, TrendingUp, CheckCircle2, Circle, Sparkles, Calendar, Network, Users,
  Wallet, Leaf, ShieldCheck, Cpu, Building2, AlertTriangle, ArrowRight, Compass,
  Wrench, Rocket, ChevronRight, GraduationCap, Activity, Globe, Smartphone, Radio,
  Award, Trophy, DollarSign, Briefcase, Brain, Layers,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, Cell,
} from 'recharts'
import KPI from './_kpi_facts'

// ─── palette ───────────────────────────────────────────────────────────────
const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981'
const AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

// ─── vision ────────────────────────────────────────────────────────────────
const VISION = "The Bahamas's best-loved connectivity provider — fastest, fairest, most trusted by 2030."

// ─── pillars ───────────────────────────────────────────────────────────────
const pillars = [
  { id: 'NETWORK',    name: 'Network Excellence',    icon: Network,    color: 'bg-vfes-red',    hex: BLUE },
  { id: 'MOBILE',     name: 'Mobile Leadership',     icon: Smartphone, color: 'bg-vfes-red',    hex: NAVY },
  { id: 'CUSTOMER',   name: 'Customer Experience',   icon: Users,      color: 'bg-amber-500',   hex: AMBER },
  { id: 'COMMERCIAL', name: 'Commercial Growth',     icon: Wallet,     color: 'bg-blue-500',    hex: PURPLE },
  { id: 'SUSTAIN',    name: 'Sustainability & Trust', icon: Leaf,       color: 'bg-emerald-500', hex: GREEN },
]

// ─── OKR type ──────────────────────────────────────────────────────────────
type OKR = {
  id: string
  pillar: string
  priority: 'P0' | 'P1' | 'P2'
  objective: string
  owner: string
  ownerInitials: string
  confidence: number
  progress: number
  dueDate: string
  lastUpdate: string
  weeklyDelta: number
  rag: 'green' | 'amber' | 'red'
  krs: { kr: string; baseline: string; current: string; target: string; pct: number; trend: number[] }[]
  initiatives: { name: string; pct: number; budget: number; spent: number; status: string; owner: string }[]
  blockers: string[]
  dependencies: string[]
}

// ─── OKR data ──────────────────────────────────────────────────────────────
const okrs: OKR[] = [
  {
    id: 'NET1', pillar: 'NETWORK', priority: 'P0',
    objective: "Become The Bahamas's #1 gigabit network",
    owner: 'CTO · Jonas Adderley', ownerInitials: 'JW',
    confidence: 0.78, progress: 78, dueDate: '31 Dec 2026', lastUpdate: '2 days ago', weeklyDelta: +2, rag: 'green',
    krs: [
      { kr: 'Reach 2.1M premises passed', baseline: '1.42M', current: '1.74M', target: '2.10M', pct: 87, trend: [42,48,54,61,68,75,82,87] },
      { kr: 'Achieve 70% gigabit availability', baseline: '38%', current: '64%', target: '70%', pct: 91, trend: [55,60,65,70,78,84,88,91] },
      { kr: 'Network NPS > +45', baseline: '+24', current: '+38', target: '+45', pct: 84, trend: [60,65,70,74,78,80,82,84] },
    ],
    initiatives: [
      { name: 'Abaco West XGS-PON build', pct: 78, budget: 24, spent: 18.7, status: 'on-track', owner: 'Femke Bethel'   },
      { name: 'Nassau Docklands 10G upgrade', pct: 92, budget: 8, spent: 7.4, status: 'on-track', owner: 'Lars Rolle'  },
      { name: 'Freeport suburban cable→fibre', pct: 54, budget: 36, spent: 19.4, status: 'on-track', owner: 'Emma Willems'  },
      { name: 'Eleuthera FTTH Phase 2', pct: 28, budget: 12, spent: 3.4, status: 'at-risk', owner: 'Wout Knowles'  },
    ],
    blockers: ['Civils contractor delay in Freeport (2 weeks)', 'Planning permits delay — Nassau North'],
    dependencies: ['Cisco optical hardware delivery (Q3)', 'Abaco planning approvals'],
  },
  {
    id: 'NET2', pillar: 'NETWORK', priority: 'P1',
    objective: 'Best-in-class network reliability',
    owner: 'COO · Sofie Knowles', ownerInitials: 'SJ',
    confidence: 0.82, progress: 84, dueDate: '31 Dec 2026', lastUpdate: '1 day ago', weeklyDelta: +1, rag: 'green',
    krs: [
      { kr: 'Network availability > 99.95%', baseline: '99.84%', current: '99.94%', target: '99.95%', pct: 92, trend: [78,80,82,85,87,89,90,92] },
      { kr: 'P1 incidents < 12/year', baseline: '22', current: '8 YTD', target: '12', pct: 100, trend: [45,55,65,75,85,92,96,100] },
      { kr: 'MTTR for P1 < 90 min', baseline: '186 min', current: '124 min', target: '90 min', pct: 64, trend: [20,30,38,45,52,58,62,64] },
    ],
    initiatives: [
      { name: 'Automated failover (DOCSIS)', pct: 88, budget: 4.2, spent: 3.7, status: 'on-track', owner: 'Daan Bain'    },
      { name: 'AIOps platform rollout', pct: 42, budget: 6.8, spent: 2.9, status: 'on-track', owner: 'Sofie Knowles' },
    ],
    blockers: [],
    dependencies: ['ServiceNow ITSM upgrade'],
  },
  {
    id: 'CUS1', pillar: 'CUSTOMER', priority: 'P0',
    objective: 'Industry-leading customer experience',
    owner: 'CCO · Thomas Rolle', ownerInitials: 'TP',
    confidence: 0.71, progress: 71, dueDate: '31 Dec 2026', lastUpdate: '3 days ago', weeklyDelta: -1, rag: 'amber',
    krs: [
      { kr: 'CSAT > 90', baseline: '78', current: '87', target: '90', pct: 96, trend: [70,74,78,82,84,86,87,87] },
      { kr: 'First call resolution > 80%', baseline: '64%', current: '74%', target: '80%', pct: 92, trend: [60,64,68,71,73,73,74,74] },
      { kr: 'Reduce URCA complaints 20%', baseline: '184', current: '162', target: '147', pct: 60, trend: [10,20,28,36,44,50,56,60] },
    ],
    initiatives: [
      { name: 'Agent assist (Cortex AI)', pct: 64, budget: 2.8, spent: 1.8, status: 'on-track', owner: 'Anke Vermeulen'  },
      { name: 'WhatsApp Business deployment', pct: 92, budget: 1.2, spent: 1.1, status: 'on-track', owner: 'Jonas Adderley'  },
      { name: 'Self-service portal redesign', pct: 38, budget: 3.6, spent: 1.4, status: 'at-risk', owner: 'Britt Rolle'  },
    ],
    blockers: ['Self-service backlog — frontend resourcing'],
    dependencies: ['PEGA upgrade Q3'],
  },
  {
    id: 'CUS2', pillar: 'CUSTOMER', priority: 'P1',
    objective: 'Reduce churn 25% through ML-driven retention',
    owner: 'VP CVM · Lore Willems', ownerInitials: 'LW',
    confidence: 0.74, progress: 68, dueDate: '31 Dec 2026', lastUpdate: '6 hours ago', weeklyDelta: +3, rag: 'green',
    krs: [
      { kr: 'Annual churn < 1.20%', baseline: '1.84%', current: '1.42%', target: '1.20%', pct: 66, trend: [10,18,28,38,48,56,62,66] },
      { kr: 'Retention offer accept rate > 35%', baseline: '22%', current: '31%', target: '35%', pct: 86, trend: [42,50,58,66,72,78,82,86] },
      { kr: 'BSD 2.1M revenue saved by retention models', baseline: 'BSD 0', current: 'BSD 1.4M', target: 'BSD 2.1M', pct: 67, trend: [8,18,28,38,48,58,64,67] },
    ],
    initiatives: [
      { name: 'Churn ML model v2 (Snowpark)', pct: 78, budget: 0.8, spent: 0.6, status: 'on-track', owner: 'Wout Ferguson'   },
      { name: 'Win-back automation', pct: 52, budget: 1.6, spent: 0.8, status: 'on-track', owner: 'Sofie Knowles' },
    ],
    blockers: [],
    dependencies: ['Bundle Propensity model (UC2) — done'],
  },
  {
    id: 'COM1', pillar: 'COMMERCIAL', priority: 'P0',
    objective: 'Grow B2B & wholesale revenue 30%',
    owner: 'CRO · Thomas Rolle', ownerInitials: 'TP',
    confidence: 0.62, progress: 62, dueDate: '31 Dec 2026', lastUpdate: '4 days ago', weeklyDelta: 0, rag: 'amber',
    krs: [
      { kr: 'Sign 50 new enterprise logos', baseline: '0', current: '32', target: '50', pct: 64, trend: [12,16,20,24,28,30,31,32] },
      { kr: 'Wholesale revenue BSD 120M', baseline: 'BSD 78M YTD', current: 'BSD 78M', target: 'BSD 120M', pct: 65, trend: [20,28,38,46,54,62,68,65] },
      { kr: 'B2B churn < 4%', baseline: '5.2%', current: '4.6%', target: '<4%', pct: 55, trend: [20,28,36,44,50,54,56,55] },
    ],
    initiatives: [
      { name: 'Dedicated SD-WAN product launch', pct: 68, budget: 4.8, spent: 3.1, status: 'on-track', owner: 'Anke Knowles'  },
      { name: 'Public sector framework bid', pct: 42, budget: 0.4, spent: 0.2, status: 'on-track', owner: 'Lucas Bethel'      },
      { name: 'Wholesale partner programme', pct: 38, budget: 2.2, spent: 0.9, status: 'at-risk', owner: 'Daan Rolle'    },
    ],
    blockers: ['Two enterprise deals slipped to Q4', 'Public-sector procurement delays'],
    dependencies: ['Cerillion billing platform B2B tenancy'],
  },
  {
    id: 'COM2', pillar: 'COMMERCIAL', priority: 'P1',
    objective: 'Cost-out BSD 15M operating expense',
    owner: 'CFO · Emma Bain', ownerInitials: 'EC',
    confidence: 0.58, progress: 56, dueDate: '31 Dec 2026', lastUpdate: '1 week ago', weeklyDelta: 0, rag: 'amber',
    krs: [
      { kr: 'BSD 15M run-rate savings', baseline: 'BSD 0', current: 'BSD 8.4M', target: 'BSD 15M', pct: 56, trend: [5,12,22,32,38,44,50,56] },
      { kr: 'Reduce IT contractor spend 30%', baseline: 'BSD 18M', current: 'BSD 14.2M', target: 'BSD 12.6M', pct: 70, trend: [20,32,44,52,58,64,68,70] },
      { kr: 'Energy cost / Gbps -20%', baseline: 'BSD 38', current: 'BSD 34', target: 'BSD 30', pct: 50, trend: [8,16,24,30,36,42,46,50] },
    ],
    initiatives: [
      { name: 'Snowflake migration (Power BI exit)', pct: 72, budget: 0.8, spent: 0.5, status: 'on-track', owner: 'Lars Jose' },
      { name: 'Network energy efficiency (Nokia)', pct: 48, budget: 2.4, spent: 1.0, status: 'on-track', owner: 'Diarmuid Hayes' },
    ],
    blockers: ['Contractor TUPE legal review'],
    dependencies: [],
  },
  {
    id: 'SUS1', pillar: 'SUSTAIN', priority: 'P1',
    objective: 'Net Zero by 2030 (Cable Bahamas Group commitment)',
    owner: 'CSO · Marie Rolle', ownerInitials: 'MP',
    confidence: 0.55, progress: 45, dueDate: '31 Dec 2030', lastUpdate: '2 weeks ago', weeklyDelta: 0, rag: 'amber',
    krs: [
      { kr: 'Reduce Scope 1+2 emissions 50%', baseline: '100%', current: '78% (-22%)', target: '50% (-50%)', pct: 44, trend: [4,8,14,20,26,32,38,44] },
      { kr: '100% renewable electricity', baseline: '42%', current: '78%', target: '100%', pct: 78, trend: [42,50,58,64,70,74,76,78] },
      { kr: 'Recycle 95% of e-waste', baseline: '64%', current: '88%', target: '95%', pct: 93, trend: [64,72,78,82,85,87,88,88] },
    ],
    initiatives: [
      { name: 'Solar array — Freeport data centre', pct: 64, budget: 8.2, spent: 5.2, status: 'on-track', owner: 'Femke Adderley'  },
      { name: 'CPE take-back programme', pct: 88, budget: 1.4, spent: 1.2, status: 'on-track', owner: 'Sofie Knowles' },
    ],
    blockers: ['Grid renewable PPA pricing renegotiation'],
    dependencies: ['Cable Bahamas Group reporting framework'],
  },
  {
    id: 'MOB1', pillar: 'MOBILE', priority: 'P0',
    objective: 'Hit 95% 5G population coverage by Q4 2026',
    owner: 'CTO Mobile · Jonas Adderley', ownerInitials: 'JW',
    confidence: 0.81, progress: 76, dueDate: '31 Dec 2026', lastUpdate: '1 day ago', weeklyDelta: +1, rag: 'green',
    krs: [
      { kr: '5G pop-coverage 95% (DSS + SA)', baseline: '78%', current: '89.4%', target: '95%', pct: 91, trend: [78,81,83,85,86,87,88,89] },
      { kr: '22.5K cell-sites active (Island Towers (demo)-shared incl.)', baseline: '20.1K', current: '22.18K', target: '22.5K', pct: 87, trend: [82,84,86,87,88,89,90,91] },
      { kr: 'Median 5G DL throughput ≥ 180 Mbps', baseline: '120', current: '145', target: '180', pct: 81, trend: [60,64,68,72,75,78,80,81] },
    ],
    initiatives: [
      { name: '5G SA rollout — Nassau + Freeport core', pct: 88, budget: 96, spent: 72.8, status: 'on-track', owner: 'Femke Bethel'   },
      { name: 'mmWave hotspot — airports & venues', pct: 34, budget: 22, spent: 6.8, status: 'on-track', owner: 'Wout Rolle'  },
      { name: 'Refarming 2100 → 5G NR-FDD (rural)', pct: 62, budget: 18, spent: 10.4, status: 'on-track', owner: 'Lars Knowles' },
      { name: 'Island Towers (demo) tower-share — 5,940 sites', pct: 71, budget: 85, spent: 58.2, status: 'on-track', owner: 'Emma Willems'  },
    ],
    blockers: ['28 sites delayed by regional planning permits'],
    dependencies: ['Ericsson AIR 6488 RU delivery (Q3)', 'Nokia AirScale BBU shipments'],
  },
  {
    id: 'MOB2', pillar: 'MOBILE', priority: 'P0',
    objective: 'Lead The Bahamas on Mobile NPS — beat BTC & Benchmark A',
    owner: 'CCO · Britt Bethel', ownerInitials: 'BM',
    confidence: 0.74, progress: 68, dueDate: '31 Dec 2026', lastUpdate: '3 days ago', weeklyDelta: +2, rag: 'amber',
    krs: [
      { kr: 'Mobile NPS ≥ +42 (lead by 5+ pts)', baseline: '+30', current: '+38', target: '+42', pct: 90, trend: [70,74,78,82,85,87,89,90] },
      { kr: 'Voice MOS ≥ 4.30 (LTE + VoNR)', baseline: '4.05', current: '4.21', target: '4.30', pct: 87, trend: [70,74,78,82,84,85,86,87] },
      { kr: 'MNP net port-in balance ≥ +20K / quarter', baseline: '+4K', current: '+12.4K', target: '+20K', pct: 62, trend: [25,35,42,48,54,58,60,62] },
    ],
    initiatives: [
      { name: 'VoNR / 5G voice GA — top-50 cities', pct: 58, budget: 16, spent: 9.4, status: 'on-track', owner: 'Lars Rolle'  },
      { name: 'Smart capacity — top 1% congested cells', pct: 72, budget: 24, spent: 17.2, status: 'on-track', owner: 'Femke Bethel'   },
      { name: 'Family-plan switcher campaign', pct: 41, budget: 8, spent: 3.4, status: 'at-risk', owner: 'Britt Bethel'    },
    ],
    blockers: ['Benchmark B aggressive pricing on family bundles'],
    dependencies: ['Cortex Search live for retention agents'],
  },
  {
    id: 'MOB3', pillar: 'MOBILE', priority: 'P1',
    objective: 'Open RAN GA in 2 regions by Q2 2027',
    owner: 'CTO Mobile · Jonas Adderley', ownerInitials: 'JW',
    confidence: 0.62, progress: 38, dueDate: '30 Jun 2027', lastUpdate: '5 days ago', weeklyDelta: 0, rag: 'amber',
    krs: [
      { kr: 'O-RAN sites in production ≥ 1,200', baseline: '0', current: '420', target: '1200', pct: 35, trend: [0,5,10,18,24,28,32,35] },
      { kr: '2 regions GA (Abaco + Grand Bahama)', baseline: '0', current: '1', target: '2', pct: 50, trend: [0,0,0,25,25,50,50,50] },
      { kr: 'Vendor diversity ≥ 3 (RU/DU/CU split)', baseline: '1', current: '3', target: '3', pct: 100, trend: [33,33,67,67,100,100,100,100] },
    ],
    initiatives: [
      { name: 'Open RAN pilot · 420 sites', pct: 78, budget: 36, spent: 28.4, status: 'on-track', owner: 'Wout Rolle'  },
      { name: 'Freeport+Bimini build · planning', pct: 12, budget: 28, spent: 3.2, status: 'at-risk', owner: 'Emma Willems'  },
      { name: 'SMO + RIC integration (rApp/xApp)', pct: 44, budget: 14, spent: 6.4, status: 'on-track', owner: 'Femke Bethel'   },
    ],
    blockers: ['Vendor interop testing slipping (Mavenir↔Fujitsu)', 'O-RAN SC certification timeline'],
    dependencies: ['EU TRG funding tranche 2', 'Group Open RAN Centre of Excellence'],
  },
]

// ─── market context ────────────────────────────────────────────────────────
const marketContext = [
  { type: 'Competitor', text: 'BTC announces 5G expansion to 90% pop coverage by Q4 2026 — pressure on mobile pricing', impact: 'high', date: '2 days ago' },
  { type: 'Competitor', text: 'Benchmark B drops 1 Gb to BSD 30/mo for 18 months in fibre areas — direct hit on M250/500', impact: 'high', date: '1 week ago' },
  { type: 'Regulatory', text: 'URCA consultation on automatic compensation for outages — could increase OpEx BSD 4M/yr', impact: 'medium', date: '4 days ago' },
  { type: 'Macro', text: 'ECB rate hold at 3.25% — refinancing CapEx broadly stable', impact: 'low', date: '1 week ago' },
  { type: 'Tech', text: 'Cisco announces XGS-PON 50G card — 12-month roadmap impact', impact: 'medium', date: '2 weeks ago' },
]

// ─── portfolio ─────────────────────────────────────────────────────────────
const portfolio = [
  { name: '5 Gb Fibre',      growth: 62,  share: 4,  type: 'star' },
  { name: '1 Gb Broadband',  growth: 18,  share: 28, type: 'star' },
  { name: '500 Mb Broadband', growth: 4,  share: 42, type: 'cash-cow' },
  { name: 'REVTV',    growth: 14,  share: 24, type: 'star' },
  { name: 'aliv Mobile', growth: 28, share: 12, type: 'question' },
  { name: 'B2B / Wholesale', growth: 12,  share: 8,  type: 'question' },
  { name: 'Home Phone',      growth: -8,  share: 14, type: 'dog' },
]

// ─── market share trend ────────────────────────────────────────────────────
const MARKET_SHARE_TREND = [
  { q: 'Q1-25', fixed: 28.4, mobile: 14.2, broadband: 31.6 },
  { q: 'Q2-25', fixed: 29.1, mobile: 14.8, broadband: 32.2 },
  { q: 'Q3-25', fixed: 29.8, mobile: 15.4, broadband: 32.8 },
  { q: 'Q4-25', fixed: 30.4, mobile: 16.1, broadband: 33.4 },
  { q: 'Q1-26', fixed: 31.2, mobile: 16.8, broadband: 34.1 },
  { q: 'Q2-26', fixed: 31.8, mobile: 17.2, broadband: 34.6 },
]

// ─── portfolio bar data ────────────────────────────────────────────────────
const PORTFOLIO_CHART = portfolio.map(p => ({ name: p.name, growth: p.growth, share: p.share }))

// ─── scenario data (base quarterly forward revenues BSD M) ───────────────────
const SCENARIO_BASE = [
  { q: 'Q3-26', base: 137.2, sensitivity: 2.1 },
  { q: 'Q4-26', base: 139.6, sensitivity: 2.6 },
  { q: 'Q1-27', base: 142.4, sensitivity: 2.9 },
  { q: 'Q2-27', base: 144.8, sensitivity: 3.2 },
]

// ─── transformation programs ──────────────────────────────────────────────
const TRANSFORM_PROGRAMS = [
  { name: 'Snowflake Data Platform', pillar: 'IT',         budget: 8.2,  spent: 5.9,  value: 12.4, pct: 72, status: 'on-track', owner: 'CIO',  due: 'Q4-26' },
  { name: '5G Open RAN Rollout',     pillar: 'NETWORK',    budget: 221,  spent: 142,  value: 380,  pct: 64, status: 'on-track', owner: 'CTO',  due: 'Q2-27' },
  { name: 'AI-Driven CVM Programme', pillar: 'CUSTOMER',   budget: 6.4,  spent: 4.2,  value: 18.6, pct: 66, status: 'on-track', owner: 'CCO',  due: 'Q3-26' },
  { name: 'B2B SD-WAN & Cloud',      pillar: 'COMMERCIAL', budget: 14.8, spent: 7.4,  value: 32.4, pct: 50, status: 'at-risk',  owner: 'CRO',  due: 'Q4-26' },
  { name: 'Net Zero 2030 Accelerator', pillar: 'SUSTAIN',  budget: 22.4, spent: 9.8,  value: 14.2, pct: 44, status: 'at-risk',  owner: 'CSO',  due: 'Q4-30' },
  { name: 'DOCSIS 4.0 / XGS-PON',   pillar: 'NETWORK',    budget: 48,   spent: 22,   value: 64,   pct: 46, status: 'on-track', owner: 'CTO',  due: 'Q2-27' },
]

// ─── roadmap milestones ────────────────────────────────────────────────────
const ROADMAP_MILESTONES = [
  { initiative: '5G SA Core (ANT + GNT)', q1: 'GA', q2: 'Scale', q3: 'Nationwide', q4: 'Complete', owner: 'CTO', pillar: 'MOBILE' },
  { initiative: 'XGS-PON full overlay (3.8M PP)', q1: 'Planning', q2: 'Phase 1 build', q3: 'Phase 2 build', q4: '2.1M PP done', owner: 'COO', pillar: 'NETWORK' },
  { initiative: 'Snowflake Data Platform', q1: 'Migration 60%', q2: 'BI cutover', q3: 'Semantic layer', q4: 'AI go-live', owner: 'CIO', pillar: 'IT' },
  { initiative: 'Converged Bundle (REVConnect+)', q1: 'Pilot 50K', q2: '200K subs', q3: '400K subs', q4: '700K subs', owner: 'CMO', pillar: 'COMMERCIAL' },
  { initiative: 'B2B SD-WAN Product', q1: 'Design', q2: 'Beta launch', q3: 'GA', q4: '50 enterprise logos', owner: 'CRO', pillar: 'COMMERCIAL' },
  { initiative: 'Solar + EV fleet', q1: 'Sites awarded', q2: 'Install', q3: '78% renewable', q4: '85% target', owner: 'CSO', pillar: 'SUSTAIN' },
]

// ─── transform chart data ──────────────────────────────────────────────────
const TRANSFORM_CHART = TRANSFORM_PROGRAMS.map(p => ({
  name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
  budget: p.budget,
  spent: p.spent,
  value: p.value,
}))

// ─── cockpit data ──────────────────────────────────────────────────────────
const STRATEGY_DOMAIN_LINKS: DomainLink[] = [
  { to: 'executive',       label: 'Executive Scorecard', metric: 'Group KPI overview',       icon: Trophy },
  { to: 'war-room',        label: 'War Room',             metric: 'Real-time incidents',       icon: AlertTriangle },
  { to: 'finance',         label: 'Finance',              metric: 'P&L · CapEx · FCF',          icon: Wallet },
  { to: 'people',          label: 'People',               metric: 'OKR owners · headcount',    icon: Users },
  { to: 'cto',             label: 'Network & Tech',       metric: '5G · fibre build plan',     icon: Network },
  { to: 'cco',             label: 'Customer Office',      metric: 'NPS · churn · CX',          icon: Users },
  { to: 'capital-treasury', label: 'Capital & Treasury', metric: 'CapEx envelope · debt',      icon: Briefcase },
  { to: 'risk',            label: 'Risk Register',        metric: 'Strategic risk watch',      icon: ShieldCheck },
  { to: 'ma-simulator',    label: 'M&A Simulator',        metric: 'Deal & portfolio modelling', icon: Activity },
]

const STRATEGY_PRIORITIES: Priority[] = [
  { name: '5G SA commercial launch (Nassau + Freeport)',  owner: 'CTO · Jonas Adderley',   pct: 88, status: 'on-track' },
  { name: 'XGS-PON 2.1M premises milestone',           owner: 'COO · Sofie Knowles',  pct: 78, status: 'on-track' },
  { name: 'B2B SD-WAN product to GA',                  owner: 'CRO · Thomas Rolle', pct: 50, status: 'at-risk' },
  { name: 'Churn ML v2 — live in retention flows',   owner: 'VP CVM · Lore Willems', pct: 78, status: 'on-track' },
  { name: 'Net Zero 2030 — PPA renegotiation',        owner: 'CSO · Marie Rolle',   pct: 44, status: 'at-risk' },
  { name: 'Snowflake BI cutover (Power BI exit)',       owner: 'CIO · Lars Jose',      pct: 72, status: 'on-track' },
]

const STRATEGY_WATCH: WatchItem[] = [
  { text: 'Benchmark B BSD 30/Gb promo — could accelerate churn in 500Mb tier',             level: 'high' },
  { text: 'URCA compensation consultation — OpEx exposure up to BSD 4M/yr',               level: 'high' },
  { text: 'Out Islands 5G permit delays — 28 sites, ~6 wk slippage risk',                level: 'medium' },
  { text: 'B2B SD-WAN: two enterprise deals slipped to Q4 — pipeline risk',            level: 'medium' },
  { text: 'Cisco XGS-PON 50G card: evaluate upgrade path vs current roadmap',          level: 'low' },
]

const STRATEGY_AGENDA = [
  { when: 'Mon 21 May',   what: 'ELT OKR review · Q2 attainment + H2 outlook' },
  { when: 'Tue 17 Jun',   what: 'Board strategy & CapEx governance' },
  { when: 'Mon 7 Jul',    what: 'Mid-year OKR reset workshop · EOIY reforecast' },
  { when: 'Q3 2026',      what: 'Competitor response playbook — BTC 5G launch' },
  { when: 'Q4 2026',      what: 'FY27 strategy refresh & OKR-setting' },
  { when: '31 Dec 2026',  what: 'Year-end OKR attainment close · board pack' },
]

// ─── helper components ─────────────────────────────────────────────────────
function ProgressBar({ pct, color = 'bg-vfes-red' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#f3f4f7] rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  return (
    <div className="w-20 h-6">
      <ResponsiveContainer>
        <LineChart data={data.map((v, i) => ({ i, v }))}>
          <Line type="monotone" dataKey="v" stroke={BLUE} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ConfidenceDot({ value }: { value: number }) {
  const color = value >= 0.7 ? 'bg-emerald-500' : value >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-vfes-dark/60">conf {value.toFixed(2)}</span>
    </div>
  )
}

// ─── Competitor Benchmark data ────────────────────────────────────────────────
const COMPETITOR_KPI = [
  { metric: 'EBITDA margin %',   tln: KPI.ebitdaMarginPct, btc: 36.2, voo: 34.8, orange: 35.4, digi: 22.1 },
  { metric: 'Churn rate %',       tln: KPI.churnRatePct,    btc: 1.22, voo: 1.68, orange: 1.44, digi: 2.10 },
  { metric: 'NPS score',          tln: KPI.nps,             btc: 34,   voo: 28,   orange: 29,   digi: 22   },
  { metric: '5G coverage %',      tln: 89.4,                btc: 88.0, voo: 84.0, orange: 80.0, digi: 62.0 },
  { metric: 'Revenue growth YoY', tln: 4.2,                 btc: 2.8,  voo: 6.4,  orange: 1.9,  digi: 18.4 },
]
const COMPETITOR_SPIDER = [
  { axis: 'Network', tln: 88, btc: 86, digi: 78 },
  { axis: 'CX/NPS',  tln: 82, btc: 74, digi: 64 },
  { axis: 'Price',   tln: 62, btc: 58, digi: 84 },
  { axis: 'B2B',     tln: 72, btc: 80, digi: 60 },
  { axis: 'Digital', tln: 78, btc: 72, digi: 68 },
  { axis: 'ESG',     tln: 86, btc: 78, digi: 58 },
]
const COMPETITOR_MARKET_SHARE = [
  { q: 'Q1-25', tln: 28.4, btc: 38.2, voo: 18.4, orange: 12.2, digi: 2.8 },
  { q: 'Q2-25', tln: 29.1, btc: 37.8, voo: 18.6, orange: 12.0, digi: 2.5 },
  { q: 'Q3-25', tln: 29.8, btc: 37.4, voo: 18.8, orange: 11.6, digi: 2.4 },
  { q: 'Q4-25', tln: 30.4, btc: 37.0, voo: 19.0, orange: 11.2, digi: 2.4 },
  { q: 'Q1-26', tln: 31.2, btc: 36.6, voo: 19.2, orange: 10.8, digi: 2.2 },
  { q: 'Q2-26', tln: 31.8, btc: 36.2, voo: 19.4, orange: 10.4, digi: 2.2 },
]
const COMPETITOR_INVESTMENTS = [
  { co: 'Cable Bahamas',       capexPct: 20.4, ranBudgetM: 221, networkScore: 88 },
  { co: 'BTC',  capexPct: 22.1, ranBudgetM: 280, networkScore: 86 },
  { co: 'Benchmark B', capexPct: 18.2, ranBudgetM: 160, networkScore: 78 },
  { co: 'Benchmark A The Bahamas', capexPct: 17.8, ranBudgetM: 140, networkScore: 80 },
  { co: 'Benchmark B',      capexPct: 12.4, ranBudgetM: 42,  networkScore: 62 },
]

// ─── tabs ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'okrs',       label: 'OKRs',                 icon: Target  },
  { id: 'roadmap',    label: 'Roadmap',               icon: Rocket  },
  { id: 'market',     label: 'Market & Portfolio',    icon: Globe   },
  { id: 'scenario',   label: 'Scenario Planning',     icon: Activity },
  { id: 'transform',  label: 'Transformation',        icon: Layers  },
  { id: 'cockpit',    label: 'Exec Cockpit',          icon: Cpu     },
  { id: 'competitor', label: 'Competitor Benchmark',  icon: Trophy  },
] as const
type TabId = typeof TABS[number]['id']

const ragColor = (r: string) =>
  r === 'green' || r === 'on-track' ? 'bg-emerald-100 text-emerald-700' :
  r === 'amber' || r === 'at-risk'  ? 'bg-amber-100 text-amber-700' :
  'bg-red-100 text-red-700'

// ──────────────────────────────────────────────────────────────────────────
export default function StrategyPage() {
  // ── hooks (8) ──────────────────────────────────────────────────────────
  const [tab, setTab]                           = useState<TabId>('okrs')
  const [pillarFilter, setPillarFilter]         = useState<string>('ALL')
  const [scenarioBias, setScenarioBias]         = useState<number>(0)       // -3 to +3
  const [transformFilter, setTransformFilter]   = useState<'all' | 'on-track' | 'at-risk'>('all')
  const [expandedOkr, setExpandedOkr]           = useState<string | null>(null)

  const filtered = useMemo(
    () => pillarFilter === 'ALL' ? okrs : okrs.filter(o => o.pillar === pillarFilter),
    [pillarFilter],
  )

  const scenarioChartData = useMemo(
    () => SCENARIO_BASE.map(d => ({
      q: d.q,
      base: d.base,
      bull: +(d.base + Math.abs(scenarioBias) * d.sensitivity * (scenarioBias >= 0 ? 1 : 0)).toFixed(1),
      bear: +(d.base - Math.abs(scenarioBias) * d.sensitivity * (scenarioBias <= 0 ? 1 : 0)).toFixed(1),
      adj:  +(d.base + scenarioBias * d.sensitivity).toFixed(1),
    })),
    [scenarioBias],
  )

  const transformFiltered = useMemo(
    () => transformFilter === 'all' ? TRANSFORM_PROGRAMS : TRANSFORM_PROGRAMS.filter(p => p.status === transformFilter),
    [transformFilter],
  )

  // derived metrics
  const avgProgress    = Math.round(okrs.reduce((s, o) => s + o.progress, 0) / okrs.length)
  const avgConfidence  = (okrs.reduce((s, o) => s + o.confidence, 0) / okrs.length).toFixed(2)
  const totalKRs       = okrs.flatMap(o => o.krs).length
  const onTrackKRs     = okrs.flatMap(o => o.krs).filter(k => k.pct >= 80).length
  const atRisk         = okrs.filter(o => o.rag === 'amber' || o.rag === 'red').length
  const totalBudget    = okrs.flatMap(o => o.initiatives).reduce((s, i) => s + i.budget, 0)
  const totalSpent     = okrs.flatMap(o => o.initiatives).reduce((s, i) => s + i.spent, 0)
  const fyDay = 142; const daysRemaining = 365 - fyDay; const fyQuarter = Math.ceil(fyDay / 91)

  const pillarProgressData = pillars.map(p => {
    const pos = okrs.filter(o => o.pillar === p.id)
    const avg = pos.length ? Math.round(pos.reduce((s, o) => s + o.progress, 0) / pos.length) : 0
    return { pillar: p.name.split(' ')[0], progress: avg, target: 100, color: p.hex }
  })

  const transformTotalValue  = TRANSFORM_PROGRAMS.reduce((s, p) => s + p.value, 0)
  const transformTotalBudget = TRANSFORM_PROGRAMS.reduce((s, p) => s + p.budget, 0)
  const scenarioFY27Adj      = scenarioChartData.reduce((s, d) => s + d.adj, 0).toFixed(0)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Strategy & OKRs')}
        subtitle={`FY2026 · Q${fyQuarter} of 4 · ${daysRemaining} ${tt('days remaining')} · ${tt('last reviewed Mon 14 May 2026')}`}
        actions={
          <Link to="/portal/war-room"
            className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {tt('Open War Room')}
          </Link>
        }
      />

      {/* Strategy health banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <Brain className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-blue-900 text-sm">
              {tt('Strategy health: ')} {avgProgress}% {tt('avg OKR progress · ')}
              {onTrackKRs}/{totalKRs} {tt('KRs on-track · ')}
              {atRisk} {tt('OKRs amber/red')}
            </div>
            <div className="text-xs text-blue-800 mt-1 flex flex-wrap gap-3">
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">
                {tt('Strategic budget: ')} BSD {totalSpent.toFixed(1)}M / BSD {totalBudget.toFixed(1)}M
              </span>
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">NPS {KPI.nps}</span>
              <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded">
                {tt('Churn ')} {KPI.churnRatePct}%
              </span>
              <Link to="/portal/executive" className="font-bold text-blue-900 hover:underline">
                {tt('Executive view →')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MlInsightSection
        heading="Strategy intelligence"
        models={[
          { name: 'OKR-attainment Forecaster', metric: 'MAPE 7%',      sub: 'year-end attainment' },
          { name: 'Scenario Simulator',         metric: 'Monte Carlo',  sub: 'plan sensitivity' },
          { name: 'Initiative-ROI Ranker',      metric: 'NPV-ranked',   sub: 'portfolio prioritisation' },
        ]}
        agentLabel={tt('Run Strategy Planner')}
        agentRunningLabel={tt('Simulating…')}
        agentSteps={[
          tt('Forecast year-end attainment per OKR'),
          tt('Simulated scenarios on the key assumptions'),
          tt('Ranked initiatives by risk-adjusted ROI'),
          tt('Flagged the OKRs trending to miss'),
        ]}
        agentBlurb={tt('Attainment forecasting turns OKRs from a quarterly status into a forward-looking, steerable plan.')}
        decision={{
          title: tt('Reallocate to the two OKRs forecast to miss'),
          detail: tt('The forecaster projects the 5G-monetisation and churn-reduction OKRs to land below target on current pace. Shift resource from the over-performing OKRs to close the gap now, while there is still runway.'),
          impact: tt('lifts year-end attainment · protects the strategic narrative'),
          risk: tt('forecasts assume current pace — revisit after each sprint'),
          linkTo: '#/portal/executive', linkLabel: tt('Open Executive'),
        }}
        chart={{
          kind: 'bar', title: tt('OKR attainment — forecast vs target (%)'), xKey: 'okr', unit: '%',
          data: [
            { okr: '5G monetisation', forecast: 72, target: 100 },
            { okr: 'Churn ↓',         forecast: 81, target: 100 },
            { okr: 'NPS +',           forecast: 96, target: 100 },
            { okr: 'FCF',             forecast: 104, target: 100 },
            { okr: 'ESG',             forecast: 92, target: 100 },
          ],
          series: [
            { key: 'forecast', name: 'Forecast', color: BLUE },
            { key: 'target',   name: 'Target',   color: NAVY },
          ],
          note: tt('5G monetisation and churn OKRs are forecast to miss — the reallocation targets.'),
        }}
      />

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => {
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

      {/* ═══════ OKRs ═══════ */}
      {tab === 'okrs' && (<>
        {/* Vision banner */}
        <div className="rounded-2xl bg-gradient-to-br from-vfes-dark via-black to-vfes-dark text-white p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
               style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #FF4438 0px, transparent 30%)' }} />
          <div className="relative flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-white/15 grid place-items-center shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.4em] text-white/70 font-bold mb-1">{tt('Our Vision · 2030')}</div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight">{VISION}</h2>
            </div>
          </div>
        </div>

        {/* Strategic pillars */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {pillars.map(p => {
            const Icon = p.icon
            const pillarOkrs = okrs.filter(o => o.pillar === p.id)
            const avg = Math.round(pillarOkrs.reduce((s, o) => s + o.progress, 0) / Math.max(pillarOkrs.length, 1))
            return (
              <button key={p.id} onClick={() => setPillarFilter(pillarFilter === p.id ? 'ALL' : p.id)}
                className={`text-left rounded-xl p-5 border transition ${pillarFilter === p.id ? 'border-vfes-red shadow-lg shadow-vfes-red/15' : 'border-black/5 hover:border-vfes-red/30'} bg-white`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${p.color} text-white grid place-items-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{pillarOkrs.length} OKR{pillarOkrs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Pillar')}</div>
                <div className="font-extrabold mb-3">{tt(p.name)}</div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-vfes-dark/55">{tt('Avg progress')}</span>
                  <span className="font-bold">{avg}%</span>
                </div>
                <ProgressBar pct={avg} />
              </button>
            )
          })}
        </div>

        {/* KPIs row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Active OKRs')}     value={okrs.length.toString()} delta={`${tt('across')} ${pillars.length} ${tt('pillars')}`}          trend="up"   icon={Target}      accent />
          <KpiCard label={tt('Avg Progress')}    value={`${avgProgress}%`}       delta="+8 pts QoQ"                                                     trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Avg Confidence')}  value={avgConfidence}           delta={tt('0.7+ healthy')}                                              trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('On-track KRs')}    value={`${onTrackKRs}/${totalKRs}`} delta={`${Math.round((onTrackKRs / totalKRs) * 100)}%`}            trend="up"   icon={Award} />
          <KpiCard label={tt('At Risk OKRs')}    value={atRisk.toString()}       delta={tt('amber or red')}                                              trend="down" icon={Flag} />
        </div>

        {/* Pillar progress bar chart */}
        <Panel title={tt('OKR progress by pillar — avg % complete')} insight={{ insight: 'Network and Customer pillars lead above 75% completion while Commercial and Sustainability lag, creating an H2 execution gap across the OKR portfolio.', action: 'Rebalance H2 headcount and discretionary budget from overperforming pillars to close the Commercial and Sustainability shortfall before the Q4 gate review.', impact: 'Balanced pillar completion protects the FY2026 OKR attainment rate and signals disciplined strategic execution to the board.' }} action={
          <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 px-2 py-1 rounded">{tt('FY2026')}</span>
        }>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={pillarProgressData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="pillar" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                <ReferenceLine y={75} stroke={GREEN} strokeDasharray="4 4" label={{ value: tt('Target 75%'), fontSize: 10, fill: GREEN }} />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} name={tt('Progress')}>
                  {pillarProgressData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-vfes-dark/55 mt-2">
            {tt('Network and Customer pillars lead; Commercial and Sustainability require resource rebalancing in H2.')}
          </div>
        </Panel>

        {/* OKR cards */}
        <div className="space-y-5 mt-5 mb-6">
          {filtered.map(o => {
            const pillar = pillars.find(p => p.id === o.pillar)!
            const PIcon = pillar.icon
            const initBudget = o.initiatives.reduce((s, i) => s + i.budget, 0)
            const initSpent  = o.initiatives.reduce((s, i) => s + i.spent, 0)
            const isExpanded = expandedOkr === o.id
            return (
              <Panel key={o.id}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${pillar.color} text-white grid place-items-center shrink-0`}>
                      <PIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${o.priority === 'P0' ? 'bg-red-100 text-red-700' : o.priority === 'P1' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{o.priority}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{tt(pillar.name)}</span>
                        <span className="text-[10px] text-vfes-dark/40">·</span>
                        <span className="text-[10px] text-vfes-dark/55">due {o.dueDate}</span>
                        <span className="text-[10px] text-vfes-dark/40">·</span>
                        <span className="text-[10px] text-vfes-dark/55">{tt('updated')} {o.lastUpdate}</span>
                      </div>
                      <h3 className="text-lg font-black leading-tight">{o.objective}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-vfes-red text-vfes-dark text-[10px] font-bold grid place-items-center">{o.ownerInitials}</div>
                          <span className="text-vfes-dark/65">{o.owner}</span>
                        </div>
                        <ConfidenceDot value={o.confidence} />
                        <span className={`text-xs font-bold ${o.weeklyDelta > 0 ? 'text-emerald-600' : o.weeklyDelta < 0 ? 'text-red-600' : 'text-vfes-dark/50'}`}>
                          {o.weeklyDelta > 0 ? `▲ +${o.weeklyDelta}` : o.weeklyDelta < 0 ? `▼ ${o.weeklyDelta}` : '— flat'} {tt('this week')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold">{o.progress}%</div>
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${o.rag === 'green' ? 'text-emerald-600' : o.rag === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>{o.rag}</div>
                    <button className="text-[10px] text-vfes-dark/40 hover:text-vfes-dark mt-1"
                      onClick={() => setExpandedOkr(isExpanded ? null : o.id)}>
                      {isExpanded ? tt('collapse') : tt('expand')} <ChevronRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>

                <div className="h-2 bg-[#f3f4f7] rounded-full overflow-hidden mb-4">
                  <div className={`h-full ${o.rag === 'green' ? 'bg-emerald-500' : o.rag === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${o.progress}%` }} />
                </div>

                {/* KRs */}
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                  {o.krs.map((k, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                      {k.pct >= 80 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Circle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{k.kr}</div>
                        <div className="text-[10px] text-vfes-dark/55 mt-0.5">
                          {k.baseline} → <span className="font-bold text-vfes-dark">{k.current}</span> / {k.target}
                        </div>
                      </div>
                      <Sparkline data={k.trend} />
                      <div className="text-xs font-bold w-10 text-right">{k.pct}%</div>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="grid md:grid-cols-2 gap-5 pt-4 border-t border-black/5">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3" /> {tt('Initiatives')} — {o.initiatives.length} {tt('active')} · BSD {initSpent.toFixed(1)}M / BSD {initBudget.toFixed(1)}M
                      </div>
                      <div className="space-y-2">
                        {o.initiatives.map(init => (
                          <div key={init.name} className="flex items-center gap-3 text-sm">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{tt(init.name)}</div>
                              <div className="text-[10px] text-vfes-dark/55">BSD {init.spent.toFixed(1)}M / BSD {init.budget.toFixed(1)}M · {init.owner}</div>
                            </div>
                            <div className="w-20"><ProgressBar pct={init.pct} color={init.status === 'at-risk' ? 'bg-amber-500' : 'bg-vfes-red'} /></div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(init.status)}`}>{tt(init.status)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      {o.blockers.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] uppercase tracking-widest text-red-700 font-bold mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> {tt('Blockers')} ({o.blockers.length})
                          </div>
                          <ul className="space-y-1 text-sm">
                            {o.blockers.map(b => (
                              <li key={b} className="text-vfes-dark/75 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {o.dependencies.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2 flex items-center gap-1.5">
                            <ChevronRight className="w-3 h-3" /> {tt('Dependencies')}
                          </div>
                          <ul className="space-y-1 text-sm">
                            {o.dependencies.map(d => (
                              <li key={d} className="text-vfes-dark/65 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-vfes-dark/30 mt-2 shrink-0" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
            )
          })}
        </div>
      </>)}

      {/* ═══════ ROADMAP ═══════ */}
      {tab === 'roadmap' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Initiatives active')} value="34"                          delta={tt('across 5 pillars')}          trend="up"  icon={Rocket}    accent />
          <KpiCard label={tt('Total budget')}        value={`BSD ${totalBudget.toFixed(0)}M`} delta={tt('FY2026 envelope')}         trend="flat" icon={Wallet} />
          <KpiCard label={tt('Burn rate')}           value={`${Math.round((totalSpent / totalBudget) * 100)}%`} delta={tt('YTD of plan')} trend="up" icon={Activity} />
          <KpiCard label={tt('At-risk milestones')}  value="6"                           delta={tt('need H2 replan')}            trend="down" icon={Flag} />
        </div>

        {/* Roadmap milestones table */}
        <Panel title={tt('Strategic initiative milestones — FY2026 quarterly view')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2 pr-4">{tt('Initiative')}</th>
                  <th className="pr-3">{tt('Q3-26')}</th>
                  <th className="pr-3">{tt('Q4-26')}</th>
                  <th className="pr-3">{tt('Q1-27')}</th>
                  <th className="pr-3">{tt('Q2-27')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {ROADMAP_MILESTONES.map(r => (
                  <tr key={r.initiative} className="border-t border-black/5">
                    <td className="py-2.5 pr-4 font-semibold">{r.initiative}</td>
                    <td className="pr-3 text-xs text-vfes-dark/75 bg-blue-50/40 rounded px-1">{tt(r.q1)}</td>
                    <td className="pr-3 text-xs text-vfes-dark/75 bg-amber-50/40 rounded px-1">{tt(r.q2)}</td>
                    <td className="pr-3 text-xs text-vfes-dark/75 bg-emerald-50/40 rounded px-1">{tt(r.q3)}</td>
                    <td className="pr-3 text-xs text-vfes-dark/75 bg-purple-50/40 rounded px-1">{tt(r.q4)}</td>
                    <td className="text-xs font-semibold text-vfes-dark">{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
            {tt('Q1 = Oct-Dec 2026 · Q2 = Jan-Mar 2027 · All milestones gate-reviewed at ELT')}
          </div>
        </Panel>

        {/* Budget bar chart */}
        <div className="mt-5">
          <Panel title={tt('Initiative budget vs spend — FY2026 (BSD M)')} insight={{ insight: 'Capital deployment is pacing at roughly 60% of FY2026 budget through H1, indicating capacity constraints or scope delays that risk under-deploying committed strategic capital.', action: 'Commission a rapid scope-to-resource fit review for any initiative below 50% spend ratio and redirect undeployed capital to the highest-NPV programmes before H2 commitment.', impact: 'Accelerating deployment on value-generating initiatives improves FY2026 NPV realisation and prevents end-of-year capital reallocation that dilutes strategic intent.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={TRANSFORM_CHART} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={160} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" name={tt('Budget')} fill={SLATE} radius={[0, 6, 6, 0]} />
                  <Bar dataKey="spent"  name={tt('Spent YTD')} fill={BLUE} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Link to="/portal/cto" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> {tt('Network detail')}
              </Link>
              <Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> {tt('RAN detail')}
              </Link>
              <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> {tt('Finance / CapEx')}
              </Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ MARKET & PORTFOLIO ═══════ */}
      {tab === 'market' && (<>
        {/* Market share area chart */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Market share trend — fixed · mobile · broadband (%)')} insight={{ insight: 'Cable Bahamas has gained 3.4 percentage points of combined market share over six quarters while BTC surrenders ground, confirming a durable structural shift in competitive positioning.', action: 'Accelerate the convergent bundle strategy to lock in the switching momentum and make share gains sticky before BTC launches its next large-scale retention campaign.', impact: 'Each sustained percentage point of share translates to approximately BSD 12M of incremental annualised revenue, directly improving the FY27 revenue growth key result.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={MARKET_SHARE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[10, 40]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="broadband" name={tt('Broadband')} stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} />
                  <Area type="monotone" dataKey="fixed"     name={tt('Fixed')}     stroke={NAVY}   fill={NAVY}   fillOpacity={0.10} />
                  <Area type="monotone" dataKey="mobile"    name={tt('Mobile')}    stroke={AMBER}  fill={AMBER}  fillOpacity={0.10} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('All three segments gaining share. Broadband (+3.0 pp) leads — driven by the FTTH build programme.')}
            </div>
          </Panel>

          {/* Portfolio bar chart */}
          <Panel title={tt('Product portfolio — growth rate vs market share (%)')} insight={{ insight: '5G mobile and 5 Gb fibre are simultaneously high-growth and gaining share, confirming star status, while Home Phone is in secular decline and dragging portfolio growth.', action: 'Increase CapEx allocation to star products, define a harvest or exit strategy for Home Phone, and evaluate the question-mark tier for swing potential in FY27 planning.', impact: 'Concentrating capital on star products improves portfolio growth rate and EBITDA margin, supporting the enterprise value and shareholder return objectives.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PORTFOLIO_CHART}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="growth" name={tt('Growth %')} radius={[4, 4, 0, 0]}>
                    {PORTFOLIO_CHART.map((d, i) => (
                      <Cell key={i} fill={d.growth > 0 ? GREEN : '#ef4444'} />
                    ))}
                  </Bar>
                  <Bar dataKey="share" name={tt('Market share %')} fill={NAVY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('5 Gb Fibre and aliv Mobile are the stars. Home Phone is in secular decline — investment under review.')}
            </div>
          </Panel>
        </div>

        {/* BCG portfolio view */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Product portfolio (BCG view) — May 2026')}>
            <div className="text-xs text-vfes-dark/55 mb-3">{tt('Growth × Market share')}</div>
            <div className="space-y-2">
              {portfolio.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{tt(p.name)}</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('growth')} {p.growth > 0 ? '+' : ''}{p.growth}% · {tt('share')} {p.share}%</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${p.type === 'star' ? 'bg-yellow-100 text-yellow-800' : p.type === 'cash-cow' ? 'bg-emerald-50 text-emerald-700' : p.type === 'question' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.type}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Market context */}
          <Panel title={tt('Market context — last 14 days')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
            <div className="space-y-2">
              {marketContext.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${m.impact === 'high' ? 'bg-red-100 text-red-700' : m.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(m.type)}</span>
                    <span className="text-[10px] text-vfes-dark/50 ml-auto">{m.date}</span>
                  </div>
                  <div className="text-sm">{tt(m.text)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
              {tt('Sourced from competitor scrapes (Kafka) + Cortex AI summarisation')}
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Churn & Retention detail')}
          </Link>
          <Link to="/portal/pricing-simulator" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Pricing simulator')}
          </Link>
        </div>
      </>)}

      {/* ═══════ SCENARIO PLANNING ═══════ */}
      {tab === 'scenario' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Base FY27 revenue')}   value="BSD 564M"   delta={tt('4-quarter sum')}     trend="up"   icon={TrendingUp} accent />
          <KpiCard label={tt('Adj FY27 revenue')}    value={`BSD ${scenarioFY27Adj}M`} delta={tt('scenario-adjusted')} trend={scenarioBias >= 0 ? 'up' : 'down'} icon={Activity} />
          <KpiCard label={tt('Sensitivity range')}   value="±BSD 32M"   delta={tt('at max slider')}     trend="flat" icon={Flag} />
          <KpiCard label={tt('Scenario confidence')} value="Med-High" delta={tt('Monte Carlo p75')} trend="flat" icon={ShieldCheck} />
        </div>

        {/* Scenario slider */}
        <Panel title={tt('Scenario planning — revenue sensitivity by assumption bias')} insight={{ insight: 'The bull-to-bear revenue spread reaches BSD 32M, with ARPU pricing and URCA regulatory risk as the two largest single levers in the FY27 sensitivity model.', action: 'Commit to H2 pricing decisions only after locking in the URCA regulatory stance, and build a contingency cost lever of at least BSD 15M to protect EBITDA under the bear case.', impact: 'Scenario-gated decision-making reduces the probability of a mid-year reforecast, protecting investor guidance credibility and the operating leverage key result in FY27.' }}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-vfes-dark">{tt('Assumption bias')}</label>
              <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${scenarioBias > 0 ? 'bg-emerald-100 text-emerald-700' : scenarioBias < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                {scenarioBias > 0 ? `+${scenarioBias} (bull)` : scenarioBias < 0 ? `${scenarioBias} (bear)` : tt('0 (base)')}
              </span>
            </div>
            <input
              type="range" min="-3" max="3" step="1"
              value={scenarioBias}
              onChange={e => setScenarioBias(Number(e.target.value))}
              className="w-full accent-vfes-red h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-vfes-dark/45 mt-1">
              <span>{tt('Bear (-3)')}</span>
              <span>{tt('Base (0)')}</span>
              <span>{tt('Bull (+3)')}</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={scenarioChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" domain={[125, 160]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="bull" name={tt('Bull case')}  stroke={GREEN}  fill={GREEN}  fillOpacity={0.10} />
                <Area type="monotone" dataKey="base" name={tt('Base case')}  stroke={BLUE}   fill={BLUE}   fillOpacity={0.20} />
                <Area type="monotone" dataKey="bear" name={tt('Bear case')}  stroke={AMBER}  fill={AMBER}  fillOpacity={0.10} />
                <Line  type="monotone" dataKey="adj"  name={tt('Adjusted')}   stroke={NAVY}   strokeWidth={2.5} strokeDasharray="4 4" dot />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-[11px] text-vfes-dark/55">
            {tt('Sensitivity drivers: ARPU ±5%, net-adds ±10%, churn ±50 bps, competitor pricing, URCA intervention. Use slider to stress-test the plan before H2 commitment.')}
          </div>
        </Panel>

        {/* Sensitivity summary */}
        <div className="mt-5">
          <Panel title={tt('Key assumption sensitivities — FY27 revenue impact (BSD M)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Driver')}</th>
                    <th className="text-right">{tt('Upside')}</th>
                    <th className="text-right">{tt('Downside')}</th>
                    <th>{tt('Key assumption')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { driver: 'ARPU ±5%',           up: '+BSD 22M',  dn: '-BSD 22M',  key: 'No competitor price war in fibre tiers' },
                    { driver: 'Net-adds ±10%',       up: '+BSD 8M',   dn: '-BSD 8M',   key: 'Benchmark B promotion fades in H2' },
                    { driver: 'Churn ±50 bps',       up: '+BSD 6M',   dn: '-BSD 6M',   key: 'ML retention model sustains accept rate' },
                    { driver: 'URCA intervention',   up: '—',      dn: '-BSD 14M',  key: 'Pricing cap on regulated wholesale' },
                    { driver: 'Energy cost ±15%',    up: '+BSD 2M',   dn: '-BSD 3M',   key: '80% hedged; remaining spot exposure' },
                    { driver: 'B2B revenue ±20%',    up: '+BSD 10M',  dn: '-BSD 10M',  key: 'Enterprise deal slippage risk in Q4' },
                  ].map((r, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{r.driver}</td>
                      <td className="text-right font-bold text-emerald-600">{r.up}</td>
                      <td className="text-right font-bold text-red-600">{r.dn}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(r.key)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ TRANSFORMATION ═══════ */}
      {tab === 'transform' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Transform value')}    value={`BSD ${transformTotalValue.toFixed(0)}M`} delta={tt('NPV across 6 programmes')} trend="up"   icon={Rocket} accent />
          <KpiCard label={tt('Transform budget')}   value={`BSD ${transformTotalBudget.toFixed(0)}M`} delta={tt('FY26+FY27 spend')}       trend="flat" icon={Wallet} />
          <KpiCard label={tt('On-track programmes')} value={`${TRANSFORM_PROGRAMS.filter(p => p.status === 'on-track').length}/${TRANSFORM_PROGRAMS.length}`} delta={tt('vs plan')} trend="up" icon={CheckCircle2} />
          <KpiCard label={tt('At-risk programmes')} value={`${TRANSFORM_PROGRAMS.filter(p => p.status === 'at-risk').length}`} delta={tt('need replan')} trend="down" icon={AlertTriangle} />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'on-track', 'at-risk'] as const).map(f => (
            <button key={f} onClick={() => setTransformFilter(f)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${transformFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:border-vfes-red/40'}`}>
              {tt(f === 'all' ? 'All' : f)}
            </button>
          ))}
        </div>

        {/* Transform program table */}
        <Panel title={tt('Transformation programme portfolio — budget · value · progress')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Programme')}</th>
                  <th>{tt('Pillar')}</th>
                  <th className="text-right">{tt('Budget')}</th>
                  <th className="text-right">{tt('Spent')}</th>
                  <th className="text-right">{tt('Value (NPV)')}</th>
                  <th>{tt('Progress')}</th>
                  <th>{tt('RAG')}</th>
                  <th>{tt('Owner')}</th>
                  <th>{tt('Due')}</th>
                </tr>
              </thead>
              <tbody>
                {transformFiltered.map((p, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{tt(p.name)}</td>
                    <td className="text-xs text-vfes-dark/65">{p.pillar}</td>
                    <td className="text-right font-bold">BSD {p.budget >= 100 ? p.budget : p.budget.toFixed(1)}M</td>
                    <td className="text-right">BSD {p.spent >= 100 ? p.spent : p.spent.toFixed(1)}M</td>
                    <td className="text-right font-bold text-emerald-600">BSD {p.value >= 100 ? p.value : p.value.toFixed(1)}M</td>
                    <td className="w-28">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#f3f4f7] rounded"><div className={`h-full ${p.status === 'on-track' ? 'bg-vfes-red' : 'bg-amber-500'} rounded`} style={{ width: `${p.pct}%` }} /></div>
                        <span className="text-xs font-bold">{p.pct}%</span>
                      </div>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(p.status)}`}>{tt(p.status)}</span></td>
                    <td className="text-xs font-semibold text-vfes-dark">{p.owner}</td>
                    <td className="text-xs">{p.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Value delivery chart */}
        <div className="mt-5">
          <Panel title={tt('Programme value delivery — budget vs NPV (BSD M)')} insight={{ insight: 'Open RAN and DOCSIS 4.0 deliver the highest NPV multiples per euro of programme budget, while Net Zero generates long-dated returns that are strategically non-negotiable.', action: 'Protect Open RAN and DOCSIS 4.0 from H2 budget compression and ring-fence Net Zero funding as a binding ESG commitment in the capital allocation framework.', impact: 'Maintaining investment discipline in high-multiple programmes drives BSD 120M of NPV realisation and anchors the transformation value key result at the portfolio level.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={TRANSFORM_CHART}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" name={tt('Budget')} fill={SLATE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent"  name={tt('Spent')}  fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="value" name={tt('Value (NPV)')} stroke={GREEN} strokeWidth={2.5} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-vfes-dark/55">
              {tt('Open RAN and DOCSIS 4.0 generate the highest NPV multiples. Net Zero return is long-dated but strategically critical.')}
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Link to="/portal/people" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('People & capability')}
          </Link>
          <Link to="/portal/cost" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Cost intelligence')}
          </Link>
        </div>
      </>)}

      {/* ═══════ COMPETITOR BENCHMARK ═══════ */}
      {tab === 'competitor' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Market share')}      value="31.8%"              delta={tt('+3.4 pp vs Q1-25')}           trend="up"   icon={Globe}       accent />
          <KpiCard label={tt('NPS lead vs peers')} value="+4 pts"             delta={tt('vs BTC +32')}            trend="up"   icon={Award} />
          <KpiCard label={tt('EBITDA premium')}    value="+2.0 pp"            delta={tt('vs sector avg 36.6%')}        trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Churn advantage')}   value="-0.26 pp"           delta={tt('vs BTC 1.22%')}          trend="up"   icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Market share trend — fixed · mobile · broadband (%)')} insight={{ insight: 'Cable Bahamas has gained 3.4 percentage points of broadband share over six consecutive quarters, establishing a durable lead in a segment historically dominated by BTC.', action: 'Invest in broadband upsell campaigns targeting Benchmark B customers in the 1 Gb tier to convert price-sensitive switchers into higher-ARPU convergent customers.', impact: 'Sustained broadband share leadership anchors the convergent bundle value proposition and supports the customer lifetime value key result underpinning the CX transformation OKR.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={COMPETITOR_MARKET_SHARE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 45]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="tln"      name="Cable Bahamas"       stroke={BLUE}   fill={BLUE}   fillOpacity={0.3} />
                  <Area type="monotone" dataKey="btc" name="BTC"  stroke={NAVY}   fill={NAVY}   fillOpacity={0.15} />
                  <Area type="monotone" dataKey="digi" name="Benchmark B" stroke={AMBER}  fill={AMBER}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="orange"   name="Benchmark A"    stroke={PURPLE} fill={PURPLE} fillOpacity={0.10} />
                  <Area type="monotone" dataKey="digi"     name="Benchmark B"      stroke={SLATE}  fill={SLATE}  fillOpacity={0.10} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('Cable Bahamas gaining +3.4 pp in 6 quarters. BTC losing -2.0 pp. Benchmark B growing 1.0 pp driven by aggressive fibre pricing.')}
            </div>
          </Panel>

          <Panel title={tt('Competitive KPI benchmark — 5 operators')} insight={{ insight: 'Cable Bahamas leads on four of five benchmark dimensions — Network, CX, ESG and EBITDA — but trails Benchmark B on price perception and lags BTC on B2B revenue positioning.', action: 'Launch a targeted B2B enterprise campaign to close the positioning gap versus BTC and develop a value-narrative campaign to counter Benchmark B price pressure without margin dilution.', impact: 'Closing the B2B positioning gap unlocks an estimated BSD 10M of enterprise revenue upside and repositions Cable Bahamas as the premium full-service operator in the FY27 market narrative.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={COMPETITOR_SPIDER}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="axis" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tln"      name="Cable Bahamas"       fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="btc" name="BTC"  fill={NAVY}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="digi" name="Benchmark B" fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('Cable Bahamas leads in Network, CX and ESG. Benchmark B leads on price. Gap to close: B2B positioning vs BTC enterprise.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Comparative KPI by operator — full table')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Metric')}</th>
                  <th className="text-right">{tt('Cable Bahamas')}</th>
                  <th className="text-right">{tt('BTC')}</th>
                  <th className="text-right">{tt('Benchmark B')}</th>
                  <th className="text-right">{tt('Benchmark A The Bahamas')}</th>
                  <th className="text-right">{tt('Benchmark B')}</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_KPI.map((r, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(r.metric)}</td>
                    <td className="text-right font-bold text-emerald-600">{r.tln}</td>
                    <td className="text-right">{r.btc}</td>
                    <td className="text-right">{r.digi}</td>
                    <td className="text-right">{r.orange}</td>
                    <td className="text-right">{r.digi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
            {tt('Cable Bahamas leads on 4 of 5 metrics. Only exception: revenue growth YoY where Benchmark B (+18%) and Benchmark A (+6.4%) grow faster from a smaller base.')}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Network investment intensity — CapEx % and RAN budget')} insight={{ insight: 'Cable Bahamas achieves superior 5G coverage per euro of RAN CapEx versus BTC, which spends BSD 280M on RAN but converts less efficiently to coverage and quality outcomes.', action: 'Use the capital efficiency advantage as a binding constraint in the next CapEx planning cycle, prioritising software-defined optimisation over hardware spend to maintain the lead at lower cost.', impact: 'Sustaining network CapEx efficiency improves free cash flow conversion and strengthens the investment case for Open RAN, directly supporting the infrastructure transformation OKR.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={COMPETITOR_INVESTMENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="co" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[10, 25]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="r" dataKey="ranBudgetM" name={tt('RAN budget (BSD M)')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="capexPct" name={tt('CapEx % revenue')} stroke={AMBER} strokeWidth={2.5} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              {tt('BTC invests more in RAN (BSD 280M) but Cable Bahamas has the highest network efficiency: best 5G coverage per euro of CapEx.')}
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/portal/war-room" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('War Room')}
          </Link>
          <Link to="/portal/cco" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('CCO cockpit')}
          </Link>
          <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Churn & Retention')}
          </Link>
          <Link to="/portal/investor-relations" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Investor Relations')}
          </Link>
          <Link to="/portal/pricing-simulator" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> {tt('Pricing simulator')}
          </Link>
        </div>
      </>)}

      {/* ═══════ EXEC COCKPIT ═══════ */}
      {tab === 'cockpit' && (<>
        <DomainGrid title={tt('Domain navigation — strategy-linked pages')} links={STRATEGY_DOMAIN_LINKS} />
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <PriorityList title={tt('Top strategic priorities — H2 2026')} items={STRATEGY_PRIORITIES} />
          <WatchList    title={tt('Strategy watch list')}                items={STRATEGY_WATCH} />
        </div>
        <div className="mt-5">
          <AgendaList title={tt('Strategic cadence — upcoming events')} items={STRATEGY_AGENDA} />
        </div>
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <Panel title={tt('Strategic budget summary')}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-vfes-dark/65">{tt('Total allocated')}</span>
                <span className="font-bold">BSD {totalBudget.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-vfes-dark/65">{tt('Spent YTD')}</span>
                <span className="font-bold text-vfes-dark">BSD {totalSpent.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-vfes-dark/65">{tt('Burn rate')}</span>
                <span className="font-bold">{Math.round((totalSpent / totalBudget) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vfes-dark/65">{tt('Remaining')}</span>
                <span className="font-bold text-emerald-600">BSD {(totalBudget - totalSpent).toFixed(1)}M</span>
              </div>
              <div className="pt-1">
                <ProgressBar pct={(totalSpent / totalBudget) * 100} />
              </div>
            </div>
          </Panel>
          <Panel title={tt('Quick links')}>
            <div className="space-y-2 text-sm">
              <Link to="/portal/executive" className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30">
                <span className="font-semibold">{tt('Executive scorecard')}</span>
                <ArrowRight className="w-4 h-4 text-vfes-dark/30" />
              </Link>
              <Link to="/portal/war-room" className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30">
                <span className="font-semibold">{tt('War Room · live incidents')}</span>
                <ArrowRight className="w-4 h-4 text-vfes-dark/30" />
              </Link>
              <Link to="/portal/investor-relations" className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30">
                <span className="font-semibold">{tt('Investor Relations')}</span>
                <ArrowRight className="w-4 h-4 text-vfes-dark/30" />
              </Link>
              <Link to="/portal/risk" className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30">
                <span className="font-semibold">{tt('Risk register')}</span>
                <ArrowRight className="w-4 h-4 text-vfes-dark/30" />
              </Link>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
