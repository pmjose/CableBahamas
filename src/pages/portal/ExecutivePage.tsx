import { FINANCE_TREND } from '../../data/scenario'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import KPI from './_kpi_facts'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import {
  Users, Wallet, AlertTriangle, Smile, TrendingUp, TrendingDown, Activity, Target, Siren,
  Sparkles, Leaf, ShieldCheck, Mail, ArrowRight, Network, Building2, Award, RefreshCw, Globe, FileDown,
  Banknote, Briefcase, BarChart3, Trophy, Zap, MessageSquare, Crown, Calendar, Newspaper, Smartphone, Radio, MapPin,
} from 'lucide-react'
import { MOBILE_KPIS, MNO_BENCHMARK } from './_mobile_data'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import AgentAction from '../../components/AgentAction'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, ReferenceLine, ScatterChart, Scatter, ZAxis } from 'recharts'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const PERIODS = ['MTD', 'QTD', 'YTD', 'TTM'] as const
type Period = typeof PERIODS[number]

const revenue = FINANCE_TREND

const netAdds = [
    { product: 'Broadband', gross: 1118, churn: 818, net: 300, color: '#FF4438' },
    { product: 'Mobile', gross: 2500, churn: 1900, net: 600, color: '#B50808' },
  ]

const marketShare = [
  { name: 'BTC', share: 34, color: '#6366f1' },
  { name: 'Cable Bahamas',  share: 28, color: '#FF4438' },
  { name: 'Benchmark B',     share: 14, color: '#f59e0b' },
  { name: 'Benchmark A',   share: 12, color: '#f97316' },
  { name: 'Benchmark C',      share: 8,  color: '#ef4444' },
  { name: 'Other',    share: 4,  color: '#94a3b8' },
]

const competitorIndex = [
  { sku: '500 Mb', vmie: 70, BTC: 65, orange: 75, voo: 72, position: '+BSD 5 vs BTC' },
  { sku: '1 Gb', vmie: 80, BTC: 75, orange: 89, voo: 79, position: '+BSD 5 vs BTC' },
  { sku: '2 Gb', vmie: 90, BTC: 89, orange: 99, voo: 95, position: 'on par' },
  { sku: '5 Gb', vmie: 100, BTC: 0, orange: 119, voo: 0, position: 'unique' },
]

const okrs = [
  { o: 'Become The Bahamas\'s #1 gigabit network', p: 78, status: 'green' },
  { o: 'Grow B2B & wholesale revenue 30%', p: 62, status: 'amber' },
  { o: 'Industry-leading customer experience', p: 71, status: 'green' },
  { o: 'Net Zero by 2030', p: 45, status: 'amber' },
]

const inbox = [
  { p: 'P1', t: 'Approve BSD 18M Benchmark B content renewal — board pack ready', due: '2d', icon: AlertTriangle, color: 'red', to: '/portal/procurement' },
  { p: 'P1', t: 'Q3 pricing review — BSD 5 increase on M250 (margin +BSD 2.8M)', due: '5d', icon: TrendingUp, color: 'red', to: '/portal/pricing-simulator' },
  { p: 'P2', t: 'URCA quarterly filing — sign-off required', due: '1w', icon: ShieldCheck, color: 'amber', to: '/portal/regulatory' },
  { p: 'P2', t: 'Approve REVConnect+ launch (Q1 2027)', due: '2w', icon: Sparkles, color: 'amber', to: '/portal/product' },
  { p: 'P3', t: 'CFO succession plan — interview shortlist', due: '3w', icon: Users, color: 'blue', to: '/portal/people' },
]

const risks = [
  { r: 'Cyber attack on core network', impact: 'High', likely: 'Med', score: 16 },
  { r: 'Sports add-on · Sports package renewal break-down', impact: 'High', likely: 'Low', score: 12 },
  { r: 'Regulatory fine (URCA QoS)', impact: 'Med', likely: 'Low', score: 9 },
  { r: 'Cisco vendor concentration', impact: 'Med', likely: 'Med', score: 12 },
  { r: 'Talent attrition (engineering)', impact: 'Med', likely: 'High', score: 15 },
]

const anomalies = [
  { sev: 'high', text: 'Churn in Freeport is +28% vs. 30-day baseline — flagged by Cortex Anomaly Detection', link: '/portal/customer-360' },
  { sev: 'medium', text: '500 Mb digital funnel conversion -32% in last hour (alert active)', link: '/portal/digital-funnel' },
]

const tabs = [
  { id: 'snapshot',   label: 'Snapshot',        icon: Activity },
  { id: 'geo',        label: 'Geo & Network',    icon: MapPin },
  { id: 'market',     label: 'Market',          icon: Globe },
  { id: 'strategy',   label: 'Strategy & Risk', icon: ShieldCheck },
  { id: 'value',      label: 'Value Creation',  icon: Banknote },
  { id: 'investor',   label: 'Investor & Board',icon: Briefcase },
  { id: 'compete',    label: 'Competitive',     icon: Trophy },
  { id: 'innovate',   label: 'Growth & M&A',    icon: Zap },
  { id: 'capital',    label: 'Capital & Cash',  icon: BarChart3 },
  { id: 'stake',      label: 'Stakeholders',    icon: Crown },
  { id: 'briefing',   label: 'CEO Briefing',    icon: Calendar },
] as const
type TabId = typeof tabs[number]['id']

// =============================================================================
// CEO-grade data (no overlap with snapshot/market/strategy tabs above)
// =============================================================================
const RED = '#FF4438'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const GREY = '#94a3b8'

// VALUE CREATION
const tsr = [
  { y: '2021', vmie: 100, BTC: 100, three: 100, bt: 100, peer: 100 },
  { y: '2022', vmie: 108, BTC: 102, three:  96, bt:  92, peer: 99 },
  { y: '2023', vmie: 124, BTC: 108, three: 102, bt:  88, peer: 105 },
  { y: '2024', vmie: 138, BTC: 116, three: 108, bt:  86, peer: 112 },
  { y: '2025', vmie: 156, BTC: 124, three: 112, bt:  92, peer: 121 },
  { y: '2026', vmie: 172, BTC: 132, three: 118, bt:  96, peer: 128 },
]
const evBridge = [
  { name: 'EV FY25',           v: 4200, kind: 'open' },
  { name: 'Revenue Δ',         v:  280, kind: 'in' },
  { name: 'Margin Δ',          v:  140, kind: 'in' },
  { name: 'Multiple Δ',        v:  -80, kind: 'out' },
  { name: 'M&A',               v:  220, kind: 'in' },
  { name: 'Buyback / div',     v: -120, kind: 'out' },
  { name: 'EV FY26',           v: 4640, kind: 'close' },
]
const evWaterfall = (() => {
  const data: any[] = []; let run = 0
  evBridge.forEach((b) => {
    if (b.kind === 'open') { data.push({ name: b.name, base: 0, val: b.v, kind: b.kind }); run = b.v }
    else if (b.kind === 'close') { data.push({ name: b.name, base: 0, val: b.v, kind: b.kind }) }
    else if (b.v >= 0) { data.push({ name: b.name, base: run, val: b.v, kind: 'in' }); run += b.v }
    else { data.push({ name: b.name, base: run + b.v, val: -b.v, kind: 'out' }); run += b.v }
  })
  return data
})()
const capAlloc = [
  { k: 'Network capex',  v: 320, color: RED },
  { k: 'IT / Digital',   v:  86, color: '#FF2D2D' },
  { k: 'M&A',            v:  64, color: AMBER },
  { k: 'Dividend',       v:  84, color: GREEN },
  { k: 'Buyback',        v:  42, color: BLUE },
  { k: 'Spectrum / Reg', v:  28, color: PURPLE },
]
const multiples = [
  { co: 'Cable Bahamas',    evEbitda: 6.8, evFcf: 12.4, peScore: 14.2 },
  { co: 'BTC',     evEbitda: 7.2, evFcf: 13.6, peScore: 15.8 },
  { co: 'KPN',     evEbitda: 5.4, evFcf: 10.8, peScore: 11.6 },
  { co: 'KPN',          evEbitda: 7.8, evFcf: 14.2, peScore: 16.4 },
  { co: 'Telia',        evEbitda: 6.4, evFcf: 11.8, peScore: 13.4 },
  { co: 'Benchmark C',         evEbitda: 5.8, evFcf: 11.2, peScore: 12.2 },
  { co: 'DT',           evEbitda: 6.6, evFcf: 12.6, peScore: 14.0 },
  { co: 'Swisscom',      evEbitda: 6.0, evFcf: 11.4, peScore: 12.8 },
  { co: 'Iliad',        evEbitda: 7.4, evFcf: 13.8, peScore: 15.4 },
]
const roic = { vmie: 0.124, wacc: 0.082, spread: 0.042 }

// INVESTOR & BOARD
const guidanceAccuracy = [
  { q: 'Q1-24', rev:  1.2, ebitda:  0.8, fcf: -2.4 },
  { q: 'Q2-24', rev:  0.4, ebitda:  1.4, fcf:  0.8 },
  { q: 'Q3-24', rev: -0.8, ebitda: -0.6, fcf:  1.2 },
  { q: 'Q4-24', rev:  0.2, ebitda:  0.4, fcf: -0.4 },
  { q: 'Q1-25', rev:  1.6, ebitda:  1.2, fcf:  2.2 },
  { q: 'Q2-25', rev:  0.8, ebitda:  0.6, fcf:  0.4 },
  { q: 'Q3-25', rev: -1.2, ebitda: -0.8, fcf: -1.4 },
  { q: 'Q4-25', rev:  0.4, ebitda:  0.2, fcf:  0.6 },
]
const consensus = { rev: 184.2, our: 182.4, eps: 0.86, ourEps: 0.84, callDays: 18 }
const analysts = { buy: 8, hold: 4, sell: 1, target: 28.40, current: 26.20 }
const shareholders = [
  { name: 'Cable Bahamas Group',     pct: 0.41, kind: 'Strategic' },
  { name: 'BlackRock',          pct: 0.06, kind: 'Index' },
  { name: 'Vanguard',           pct: 0.05, kind: 'Index' },
  { name: 'Norges (Norway SWF)', pct: 0.03, kind: 'Sovereign' },
  { name: 'Capital Group',      pct: 0.025, kind: 'Active' },
  { name: 'Fidelity',           pct: 0.022, kind: 'Active' },
  { name: 'Free float',         pct: 0.40, kind: 'Other' },
]
const credit = [
  { agency: "Moody's", rating: 'Baa2', outlook: 'Stable', headroom: '1.4x' },
  { agency: 'S&P',     rating: 'BBB',  outlook: 'Stable', headroom: '1.4x' },
  { agency: 'Fitch',   rating: 'BBB',  outlook: 'Positive', headroom: '1.6x' },
]
const boardCommitments = [
  { topic: '5G-SA national rollout',  due: 'Q4-26', status: 'On-track', rag: 'green' },
  { topic: 'B2B revenue BSD 100M run-rate', due: 'Q2-27', status: 'Behind 4%', rag: 'amber' },
  { topic: 'NPS +45 by Q4',            due: 'Q4-26', status: 'Stretch · current +38', rag: 'amber' },
  { topic: 'Net Zero Scope 1+2 -50%', due: '2030',  status: 'Off-glide', rag: 'red' },
  { topic: 'CFO succession ready-now', due: 'Q3-26', status: 'Shortlist of 3', rag: 'green' },
]

// COMPETITIVE
const shareEvo = [
  { q: 'Q1-25', vmie: 26, BTC: 36, three: 14, sky: 9, other: 15 },
  { q: 'Q2-25', vmie: 27, BTC: 35, three: 14, sky: 9, other: 15 },
  { q: 'Q3-25', vmie: 27, BTC: 35, three: 14, sky: 9, other: 15 },
  { q: 'Q4-25', vmie: 28, BTC: 34, three: 14, sky: 9, other: 15 },
  { q: 'Q1-26', vmie: 28, BTC: 34, three: 14, sky: 8, other: 16 },
  { q: 'Q2-26', vmie: 29, BTC: 33, three: 14, sky: 8, other: 16 },
]
const winRate = [
  { vs: 'BTC',  enterprise: 0.48, smb: 0.42, consumer: 0.36 },
  { vs: 'Benchmark B',      enterprise: 0.62, smb: 0.58, consumer: 0.46 },
  { vs: 'Benchmark A',    enterprise: 0.72, smb: 0.66, consumer: 0.41 },
  { vs: 'Benchmark C',       enterprise: 0.54, smb: 0.48, consumer: 0.00 },
  { vs: 'Pure Mobile', enterprise: 0.46, smb: 0.42, consumer: 0.38 },
]
const brand = [
  { metric: 'Awareness',     vmie: 92, peer: 88 },
  { metric: 'Consideration', vmie: 56, peer: 52 },
  { metric: 'Preference',    vmie: 32, peer: 28 },
  { metric: 'Trust',         vmie: 64, peer: 58 },
  { metric: 'Recommendation',vmie: 48, peer: 44 },
  { metric: 'Innovation',    vmie: 62, peer: 48 },
]
const npsGap = [
          { co: 'Cable Bahamas',  nps:  38 },
  { co: 'BTC', nps:  18 },
  { co: 'Benchmark B',     nps:  32 },
  { co: 'Benchmark A',   nps:  12 },
  { co: 'Benchmark C',      nps:  22 },
  { co: 'Colt',    nps:   8 },
]

// GROWTH & M&A
const innovIndex = [
  { product: 'B2B Cloud Connect',  age: 1, revM:  6.4 },
  { product: 'IoT / M2M',          age: 2, revM: 12.4 },
  { product: 'Smart Home (sec)',   age: 1, revM:  3.2 },
  { product: 'REVConnect+ FWA',          age: 2, revM:  4.8 },
  { product: 'Wholesale dark-fibre', age: 3, revM: 18.2 },
  { product: 'Streaming bundle',   age: 2, revM:  8.4 },
  { product: 'Mobile pre-paid',    age: 3, revM:  6.8 },
  { product: 'Edge / Co-lo',       age: 1, revM:  2.8 },
]
const mnaPipeline = [
  { stage: 'Sourced',  n: 18, valueM: 420 },
  { stage: 'Screened', n: 12, valueM: 280 },
  { stage: 'NDA / DD', n:  5, valueM: 140 },
  { stage: 'IOI / LOI',n:  3, valueM:  84 },
  { stage: 'SPA',      n:  1, valueM:  42 },
]
const partnerships = [
  { partner: 'AWS',          jointArrM: 18.4, kind: 'Cloud / B2B', health: 'Green' },
  { partner: 'Microsoft',    jointArrM: 12.8, kind: 'O365 reseller', health: 'Green' },
  { partner: 'BTC Sports add-on',  jointArrM: 28.6, kind: 'Content',     health: 'Amber' },
  { partner: 'Google',       jointArrM:  6.2, kind: 'AI / agents', health: 'Green' },
  { partner: 'Snowflake',    jointArrM:  2.4, kind: 'Data / analytics', health: 'Green' },
  { partner: 'Cisco',        jointArrM:  4.8, kind: 'NaaS',        health: 'Amber' },
]
const innovStats = { newRevPct: 0.184, patentsTtm: 22, ventureInvestmentsM: 14, labProjects: 38 }

// CAPITAL & CASH
const debtMaturity = [
  { y: '2026', amt: 120 },
  { y: '2027', amt: 180 },
  { y: '2028', amt: 320 },
  { y: '2029', amt:  80 },
  { y: '2030', amt: 240 },
  { y: '2031', amt:  60 },
  { y: '2032', amt: 160 },
]
const cashStats = {
  cash: 184, undrawnRcf: 250, leverage: 2.6, covenantMax: 3.5, headroomPct: 0.26,
  capexPct: 0.18, peerCapexPct: 0.16, pensionLiabM: 84, taxEffective: 0.124, fxOpenM: 28,
}
const fxExposure = [
  { ccy: 'USD', netM:  -42, hedgePct: 0.78 },
  { ccy: 'GBP', netM:   28, hedgePct: 0.82 },
  { ccy: 'SEK', netM:   -8, hedgePct: 0.42 },
  { ccy: 'JPY', netM:  -12, hedgePct: 0.66 },
]
const macro = [
  { i: 'BE GDP',          v: '+1.1%', delta: '↑' },
  { i: 'BE consumer conf.', v: '-8',   delta: '↓' },
  { i: 'CPI',              v: '+2.1%', delta: '↓' },
  { i: 'ECB rate',         v: '2.75%', delta: '↓' },
  { i: 'BSD/USD',          v: '1.082',  delta: '→' },
  { i: 'BSD/GBP',          v: '0.842',  delta: '↓' },
  { i: 'Brent (USD/bbl)',  v: '78.2',   delta: '↑' },
  { i: 'Wholesale power BSD /MWh', v: '94', delta: '→' },
]

// STAKEHOLDERS
const stakeholders = [
  { group: 'Customers',   health: 78, trend: 'up',   risk: 'Outage in Freeport·high churn' },
  { group: 'Employees',   health: 72, trend: 'up',   risk: 'Pay & RTO sentiment' },
  { group: 'Investors',   health: 80, trend: 'up',   risk: 'Margin guidance miss Q3' },
  { group: 'Regulators',  health: 70, trend: 'flat', risk: 'URCA M4 finding' },
  { group: 'Government',  health: 76, trend: 'up',   risk: 'Gigabit The Bahamas rollout scrutiny' },
  { group: 'Community',   health: 74, trend: 'flat', risk: 'Mast siting protests' },
  { group: 'Suppliers',   health: 68, trend: 'down', risk: 'Cisco price re-open' },
  { group: 'Media',       health: 72, trend: 'up',   risk: 'Brand sentiment Freeport outage' },
]
const reputationVoice = [
  { week: 'W-7', positive: 62, neutral: 28, negative: 10 },
  { week: 'W-6', positive: 58, neutral: 32, negative: 10 },
  { week: 'W-5', positive: 60, neutral: 28, negative: 12 },
  { week: 'W-4', positive: 56, neutral: 28, negative: 16 },
  { week: 'W-3', positive: 48, neutral: 30, negative: 22 },
  { week: 'W-2', positive: 52, neutral: 32, negative: 16 },
  { week: 'W-1', positive: 64, neutral: 26, negative: 10 },
  { week: 'Now', positive: 68, neutral: 24, negative:  8 },
]
const govEngagement = [
  { who: 'Minister Comms', last: '2026-05-08', topic: 'Gigabit The Bahamas rollout', tone: 'Constructive' },
  { who: 'URCA Chair',  last: '2026-04-22', topic: 'M4 review', tone: 'Tense' },
  { who: 'VLAIO',   last: '2026-05-12', topic: 'B2B FDI',  tone: 'Warm' },
  { who: 'EU DG-CONNECT', last: '2026-03-18', topic: 'Gigabit Act', tone: 'Constructive' },
  { who: 'Dept Finance',  last: '2026-04-04', topic: 'Pre-budget', tone: 'Warm' },
]

// CEO BRIEFING
const ceoFeed = [
  { t: '07:14', icon: TrendingUp, color: 'green', what: 'Pipeline crossed BSD 40M for first time (+BSD 2M overnight)' },
  { t: '06:42', icon: AlertTriangle, color: 'red', what: 'P1 outage in Freeport (ETA restore 09:30) — comms drafted' },
  { t: '06:08', icon: Newspaper, color: 'blue', what: 'De Tijd: "Cable Bahamas leads gigabit race" — share-of-voice +18% wk' },
  { t: '05:34', icon: Trophy, color: 'green', what: 'Won Island Bank (demo) framework — BSD 4.2M ARR · displaces BTC' },
  { t: '04:12', icon: ShieldCheck, color: 'amber', what: 'URCA M4 questionnaire received · 14d response' },
  { t: '02:58', icon: Briefcase, color: 'blue', what: 'Cable Bahamas Group confirmed roadshow attendance · 28 May' },
]
const decisionLog = [
  { id: 'CEO-D-042', topic: 'Approve BSD 18M Benchmark B content renewal',  owner: 'CEO',  status: 'Awaiting CEO sign-off', due: '2d' },
  { id: 'CEO-D-041', topic: 'M250 BSD 5 price increase',            owner: 'CFO',  status: 'Awaiting CEO sign-off', due: '5d' },
  { id: 'CEO-D-040', topic: 'CFO successor selection',           owner: 'CHRO', status: 'Interview shortlist',    due: '3w' },
  { id: 'CEO-D-039', topic: 'REVConnect+ Q1 2027 launch GA',           owner: 'CMO',  status: 'Investment paper ready', due: '2w' },
  { id: 'CEO-D-038', topic: 'Diversify Cisco — RFP authorisation',owner: 'CPO', status: 'Vendor list approved',   due: '1w' },
  { id: 'CEO-D-037', topic: 'NIS2 attestation board sign-off',   owner: 'CISO', status: 'Final review',           due: '1w' },
]
const weekNarrative = [
  'Pipeline +BSD 2M and Island Bank (demo) framework win mean B2B Q is recoverable; expect +1.4% to plan if Benchmark B renewal closes.',
  'Freeport outage is contained but second incident in 6 weeks — order CTO retro by Friday, brief board chair pre-meeting.',
  'URCA M4 questionnaire is the single biggest risk this quarter; response strategy on Tuesday with Reg Affairs.',
  'Sentiment up 18% on share-of-voice — tee up gigabit-leadership op-ed in IT for Monday.',
  'Net-Zero remains red — request capex re-prioritisation from CFO for the September board pack.',
]

export default function ExecutivePage() {
  const [period, setPeriod] = useState<Period>('YTD')
  const [tab, setTab] = useState<TabId>('snapshot')

  // Period scaling — figures build up from canonical monthly run-rates so the
  // displayed value matches its label (e.g. QTD reconciles to KPI.revenueQtrM).
  // Latest reported month is May → YTD covers 5 months (Jan–May).
  const fmtM = (v: number) => `BSD ${(v).toFixed(1)}M`
  // Period figures build from canonical monthly run-rates; memoised on period.
  const { m, revenuePeriod, ebitdaPeriod, fcfPeriod, ebitdaMarginPct, planRevenuePeriod, planEbitdaPeriod } = useMemo(() => {
    const periodMonths: Record<Period, number> = { MTD: 1, QTD: 2, YTD: 5, TTM: 12 }
    const mm = periodMonths[period]
    const rows = FINANCE_TREND.slice(-mm)
    const rev = rows.reduce((sum, row) => sum + row.revenue, 0)
    const eb = rows.reduce((sum, row) => sum + row.ebitda, 0)
    return {
      m: mm, revenuePeriod: rev, ebitdaPeriod: eb, fcfPeriod: rows.reduce((sum, row) => sum + row.fcf, 0),
      ebitdaMarginPct: eb / rev * 100,
      planRevenuePeriod: rev * 1.026, planEbitdaPeriod: eb * 1.012,
    }
  }, [period])
  const { subsTotal, netAddsAdj, headcountAdds } = useMemo(() => ({
    subsTotal: KPI.fixedSubs / 1_000_000,
    netAddsAdj: period === 'MTD' ? 0.3 : period === 'QTD' ? 0.6 : period === 'YTD' ? 1.5 : 3.6,
    headcountAdds: period === 'MTD' ? 6 : period === 'QTD' ? 14 : period === 'YTD' ? 38 : 56,
  }), [period])
  const subsBase = KPI.fixedSubs / 1_000_000 // canonical fixed-sub base (1.06M)

  const totalNet = netAdds.reduce((s, x) => s + x.net, 0)
  const totalGross = netAdds.reduce((s, x) => s + x.gross, 0)
  const totalChurn = netAdds.reduce((s, x) => s + x.churn, 0)

  return (
    <div className="p-8 board-pack">
      <PageHeader
        title={tt('CEO Dashboard')}
        subtitle={`Synthetic baseline at 31 May 2026 · ${period} · QTD covers April–May`}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-[#f3f4f7] rounded-lg p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${period === p ? 'bg-white shadow text-vfes-dark' : 'text-vfes-dark/55 hover:text-vfes-dark'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-lg hover:bg-black/5" title={tt('Refresh')}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold px-3 py-2 rounded-lg text-xs"
              title={tt('Export board pack as PDF (print)')}
            >
              <FileDown className="w-4 h-4" /> {tt('Export board pack')}
            </button>
          </div>
        }
      />

      <MlInsightSection
        heading="Executive intelligence"
        hideModels
        models={[
          { name: 'Revenue forecast', metric: 'BSD 46.8M', sub: 'projected quarter-end' },
          { name: 'Early-warning', metric: '2 flags', sub: 'KPIs outside normal range' },
          { name: 'Board narrative', metric: 'Auto-drafted', sub: 'variance commentary ready' },
        ]}
        agentLabel="Run Exec Briefing" agentRunningLabel="Analysing…"
        agentSteps={[
          'Scanned the scorecard for KPI anomalies (Cortex)',
          'Forecast quarter-end revenue & EBITDA vs plan',
          'Drafted the board narrative & variance commentary',
          'Flagged the items needing exec decision',
        ]}
        agentBlurb="Anomaly, forecast and narrative from one governed source — the board sees the same numbers as the regulator."
        decision={{
          title: 'Act on the two flagged KPI anomalies before the board',
          detail: 'The detector flagged a churn uptick and a Freeport opex anomaly that fall outside normal variance. Brief both with root cause and the corrective action already underway, rather than being asked cold.',
          impact: 'pre-empts board questions · faster corrective action',
          risk: 'anomaly ≠ cause — pair each flag with a root-cause check',
          linkTo: '#/portal/war-room', linkLabel: 'Open War Room',
        }}
        chart={{
          kind: 'line', title: 'Revenue — actual vs ML forecast (BSD M)', xKey: 'm', unit: 'M',
          data: [
            { m: 'Jan', actual: 44.2, forecast: 44.0 }, { m: 'Feb', actual: 44.8, forecast: 44.6 },
            { m: 'Mar', actual: 45.1, forecast: 45.0 }, { m: 'Apr', actual: 45.4, forecast: 45.3 },
            { m: 'May', actual: 45.6, forecast: 45.5 }, { m: 'Jun', actual: null, forecast: 45.9 },
            { m: 'Jul', actual: null, forecast: 46.3 }, { m: 'Aug', actual: null, forecast: 46.8 },
          ],
          series: [{ key: 'actual', name: 'Actual', color: '#FF4438' }, { key: 'forecast', name: 'ML forecast', color: '#11567F', dashed: true }],
          note: 'Forecaster projects BSD 46.8M by August — on track to the top half of guidance.',
        }}
      />

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {tabs.map((t) => {
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

      {tab === 'snapshot' && (<>
      {/* Anomaly banner */}
      {anomalies.length > 0 && (
        <div className="mb-6 space-y-2">
          {anomalies.map((a, i) => (
            <Link
              key={i}
              to={a.link}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                a.sev === 'high' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              } hover:shadow-sm transition`}
            >
              <Sparkles className={`w-4 h-4 ${a.sev === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
              <span className="flex-1 text-sm font-semibold">{tt(a.text)}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      )}

      {/* Balanced scorecard — 5 quadrants (Customer · Financial · Network · Mobile · People) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Customer */}
        <Link to="/portal/customer-360" className="group rounded-xl bg-gradient-to-br from-vfes-red to-vfes-red-dark text-vfes-dark p-5 shadow-lg shadow-vfes-red/20 hover:shadow-2xl hover:-translate-y-0.5 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-white/85 font-bold">{tt('Customer')}</div>
            <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-sm">{tt('Subscribers')}</span><span className="font-bold">{subsTotal.toFixed(2)}M <span className="text-xs text-emerald-200">+{((subsTotal / subsBase - 1) * 100).toFixed(1)}%</span></span></div>
            <div className="flex justify-between"><span className="text-sm">Net adds ({period})</span><span className="font-bold">+{netAddsAdj.toFixed(1)}K</span></div>
            <div className="flex justify-between"><span className="text-sm">{tt('Churn')}</span><span className="font-bold">1.42% <span className="text-xs text-emerald-200">{tt('-0.18 pp')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm">{tt('NPS')}</span><span className="font-bold">+38 <span className="text-xs text-emerald-200">+4</span></span></div>
          </div>
        </Link>
        {/* Financial */}
        <Link to="/portal/finance" className="group rounded-xl bg-white border border-black/5 shadow-sm p-5 hover:border-vfes-red/30 hover:shadow-md hover:-translate-y-0.5 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold flex items-center gap-1.5"><Wallet className="w-3 h-3" />{tt('Financial')}</div>
            <ArrowRight className="w-3.5 h-3.5 text-vfes-dark/40 group-hover:translate-x-0.5 group-hover:text-vfes-dark transition" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">Revenue ({period})</span><span className="font-bold">{fmtM(revenuePeriod)} <span className="text-xs text-red-600">{tt('-2.6% vs plan')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('EBITDA')}</span><span className="font-bold">{fmtM(ebitdaPeriod)} <span className="text-xs text-red-600">{tt('-1.2% vs plan')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('EBITDA margin')}</span><span className="font-bold">{ebitdaMarginPct.toFixed(1)}% <span className="text-xs text-emerald-600">{tt('+0.4 pp')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">FCF ({period})</span><span className="font-bold">{fmtM(fcfPeriod)} <span className="text-xs text-emerald-600">+8.2%</span></span></div>
          </div>
        </Link>
        {/* Network */}
        <Link to="/portal/network" className="group rounded-xl bg-white border border-black/5 shadow-sm p-5 hover:border-vfes-red/30 hover:shadow-md hover:-translate-y-0.5 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold flex items-center gap-1.5"><Network className="w-3 h-3" />{tt('Network')}</div>
            <ArrowRight className="w-3.5 h-3.5 text-vfes-dark/40 group-hover:translate-x-0.5 group-hover:text-vfes-dark transition" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Premises Passed')}</span><span className="font-bold">1.74M <span className="text-xs text-emerald-600">{tt('+18K Q')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Take-rate')}</span><span className="font-bold">62.4%</span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Uptime (30d)')}</span><span className="font-bold">99.94% <span className="text-xs text-emerald-600">{tt('SLA met')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('P1 incidents (7d)')}</span><span className="font-bold text-red-600">{tt('2 active')}</span></div>
          </div>
        </Link>
        {/* Mobile (Cable Bahamas is mobile-first) */}
        <Link to="/portal/mobile-ran" className="group rounded-xl bg-white border border-black/5 shadow-sm p-5 hover:border-vfes-red/30 hover:shadow-md hover:-translate-y-0.5 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold flex items-center gap-1.5"><Smartphone className="w-3 h-3" />{tt('Mobile')}</div>
            <ArrowRight className="w-3.5 h-3.5 text-vfes-dark/40 group-hover:translate-x-0.5 group-hover:text-vfes-dark transition" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Mobile subscribers')}</span><span className="font-bold">2.84M <span className="text-xs text-emerald-600">+2.1%</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('5G coverage')}</span><span className="font-bold">{MOBILE_KPIS.cov5gPop}% <span className="text-xs text-emerald-600">+3.4 pp</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Mobile ARPU')}</span><span className="font-bold">BSD 17.80 <span className="text-xs text-emerald-600">+1.2%</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('MNP balance')}</span><span className="font-bold">+12.4K <span className="text-xs text-emerald-600">{tt('net port-in')}</span></span></div>
          </div>
        </Link>
        {/* People */}
        <Link to="/portal/people" className="group rounded-xl bg-white border border-black/5 shadow-sm p-5 hover:border-vfes-red/30 hover:shadow-md hover:-translate-y-0.5 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold flex items-center gap-1.5"><Users className="w-3 h-3" />{tt('People')}</div>
            <ArrowRight className="w-3.5 h-3.5 text-vfes-dark/40 group-hover:translate-x-0.5 group-hover:text-vfes-dark transition" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Headcount')}</span><span className="font-bold">1,840 <span className="text-xs text-emerald-600">+{headcountAdds} {period}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Attrition (12m)')}</span><span className="font-bold">{KPI.attritionRegrettablePct}% <span className="text-xs text-emerald-600">{tt('-1.2 pp')}</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('eNPS')}</span><span className="font-bold">+42 <span className="text-xs text-emerald-600">+6</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-vfes-dark/65">{tt('Open critical roles')}</span><span className="font-bold">14</span></div>
          </div>
        </Link>
      </div>

      {/* Revenue & EBITDA vs plan */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Revenue & EBITDA vs. Plan (BSD M)')} insight={{ insight: 'Revenue runs ~BSD 0.3M ahead of plan while EBITDA margin holds near 38% — the growth is profitable, not bought.', action: 'Hold the line on promo spend and reinvest the beat into FTTH backhaul rather than discounts.', impact: 'Protects ~1.2pp of margin and keeps full-year guidance in the top half.' }} action={<Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4438" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#FF4438" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#222128" strokeWidth={2.5} fill="url(#rev)" name={tt('Revenue')} />
                  <Line type="monotone" dataKey="plan" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name={tt('Plan')} />
                  <Line type="monotone" dataKey="ebitda" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name={tt('EBITDA')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Plan vs. Actual — Top KPIs')} action={<Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Finance →')}</Link>}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
              <tr><th className="py-2">{tt('Metric')}</th><th>{tt('Actual')}</th><th>{tt('Plan')}</th><th>Δ</th></tr>
            </thead>
            <tbody>
              {[
                { m: 'Revenue', a: fmtM(revenuePeriod), p: fmtM(planRevenuePeriod), d: '-2.6%', good: false },
                { m: 'EBITDA', a: fmtM(ebitdaPeriod), p: fmtM(planEbitdaPeriod), d: '-1.2%', good: false },
                { m: 'Subs', a: `${subsTotal.toFixed(2)}M`, p: '1.03M', d: '+1.0%', good: true },
                { m: 'Churn', a: '1.42%', p: '1.50%', d: '-0.08 pp', good: true },
                { m: 'CAC', a: 'BSD 84', p: 'BSD 90', d: '-BSD 6', good: true },
                { m: 'NPS', a: '+38', p: '+35', d: '+3', good: true },
              ].map((r) => (
                <tr key={r.m} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{r.m}</td>
                  <td>{r.a}</td>
                  <td className="text-vfes-dark/55">{r.p}</td>
                  <td className={r.good ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{tt(r.d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Rich snapshot visuals — added so the first page lands with impact */}
      <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: 'Share price',      v: 'BSD 26.20', d: '+1.8%', up: true },
          { l: 'NPS today',        v: '+38',    d: '+4 wk',  up: true },
          { l: '7d active users',  v: '842K',   d: '+2.1%', up: true },
          { l: 'P1 incidents',     v: '2',      d: 'Freeport outage', up: false },
          { l: 'Pipeline',         v: 'BSD 40.2M', d: '+BSD 2M',   up: true },
          { l: 'Press sentiment',  v: '+68',    d: '+18 wk', up: true },
        ].map((k) => (
          <div key={k.l} className="bg-white rounded-xl p-3 border border-black/5 shadow-sm">
            <div className="text-[9px] uppercase tracking-widest text-vfes-dark/55 font-bold">{k.l}</div>
            <div className="text-xl font-extrabold mt-0.5">{k.v}</div>
            <div className={`text-[10px] font-bold ${k.up ? 'text-emerald-600' : 'text-vfes-dark'}`}>{k.up ? '▲' : '▼'} {tt(k.d)}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Share price · 30 days (BSD )')} insight={{ insight: 'Shares are up ~4% over 30 days, outpacing the BEL20 telco peers.', action: 'Use the window to brief two key institutional holders ahead of results.', impact: 'Tighter analyst dispersion lowers post-earnings share volatility.' }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={Array.from({ length: 30 }, (_, i) => ({ d: i + 1, p: 24.2 + Math.sin(i / 3.4) * 0.6 + i * 0.06 + (i > 22 ? 0.4 : 0) }))}>
              <defs><linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF4438" stopOpacity={0.4} /><stop offset="100%" stopColor="#FF4438" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${Number(v).toFixed(2)}`} />
              <Area dataKey="p" stroke="#222128" strokeWidth={2.5} fill="url(#sp)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-xs mt-2"><span className="text-vfes-dark/55">{tt('Open BSD 25.80')}</span><span className="font-bold text-emerald-600">BSD 26.20 (+1.8%)</span><span className="text-vfes-dark/55">{tt('Hi BSD 26.40')}</span></div>
        </Panel>

        <Panel title={tt('EBITDA bridge YTD (BSD M)')} insight={{ insight: 'Volume and ARPU add ~BSD 2.1M while energy and bad debt remove ~BSD 0.9M of it.', action: 'Push the energy-hedge renewal the CFO flagged before Q3 rates reset.', impact: 'Locks roughly BSD 0.6M of EBITDA otherwise exposed to spot power.' }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={(() => {
              const items = [
                { name: 'Open',    v: 84, kind: 'open' },
                { name: 'Vol',     v: 12, kind: 'in' },
                { name: 'Price',   v:  6, kind: 'in' },
                { name: 'Mix',     v: -3, kind: 'out' },
                { name: 'Opex',    v: -7, kind: 'out' },
                { name: 'AI gain', v:  4, kind: 'in' },
                { name: 'Close',   v: 96, kind: 'close' },
              ]
              const out: any[] = []; let run = 0
              items.forEach((b) => {
                if (b.kind === 'open') { out.push({ ...b, base: 0, val: b.v }); run = b.v }
                else if (b.kind === 'close') { out.push({ ...b, base: 0, val: b.v }) }
                else if (b.v >= 0) { out.push({ ...b, base: run, val: b.v }); run += b.v }
                else { out.push({ ...b, base: run + b.v, val: -b.v }); run += b.v }
              })
              return out
            })()}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="base" stackId="a" fill="transparent" />
              <Bar dataKey="val" stackId="a" radius={[4, 4, 0, 0]}>
                {[ '#1f2937', GREEN, GREEN, RED, RED, GREEN, '#1f2937'].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={tt('Customer flow (this week)')}>
          <div className="space-y-2 mt-2">
            {[
              { l: 'New gross adds',    v:  8420, color: GREEN, w: 1.0 },
              { l: 'Reactivations',     v:  1240, color: BLUE,  w: 0.32 },
              { l: 'Upgrades (in)',     v:  2840, color: AMBER, w: 0.55 },
              { l: 'Downgrades (out)',  v: -1180, color: '#fb923c', w: 0.28 },
              { l: 'Voluntary churn',   v: -3680, color: RED,   w: 0.62 },
              { l: 'Involuntary churn', v:  -420, color: '#7f1d1d', w: 0.18 },
            ].map((r) => (
              <div key={r.l} className="flex items-center gap-2">
                <div className="w-32 text-xs text-vfes-dark/65 truncate">{r.l}</div>
                <div className="flex-1 h-5 bg-[#f3f4f7] rounded overflow-hidden">
                  <div className="h-full" style={{ background: r.color, width: `${r.w * 100}%` }} />
                </div>
                <div className={`w-16 text-right font-bold text-xs ${r.v < 0 ? 'text-vfes-dark' : 'text-emerald-600'}`}>{r.v > 0 ? '+' : ''}{r.v.toLocaleString()}</div>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-2 border-t border-black/5"><span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Net this week')}</span><span className="font-extrabold text-emerald-600 text-lg">+7,220</span></div>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Network traffic — last 24h (Tbps · regional split)')} insight={{ insight: 'Nassau and Freeport carry ~58% of peak Tbps and the evening peak is steepening.', action: 'Pull forward the metro capacity upgrades in those two regions.', impact: 'Avoids congestion-driven NPS dips in the highest-revenue metros.' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={Array.from({ length: 24 }, (_, i) => ({
                h: `${String(i).padStart(2, '0')}:00`,
                Nassau:  1.2 + Math.sin((i - 6) / 4) * 0.6 + (i > 18 ? 0.6 : 0),
                Freeport:    0.6 + Math.sin((i - 6) / 4) * 0.3 + (i > 18 ? 0.3 : 0),
                Abaco:  0.4 + Math.sin((i - 6) / 4) * 0.2 + (i > 18 ? 0.2 : 0),
                Eleuthera: 0.3 + Math.sin((i - 6) / 4) * 0.15 + (i > 18 ? 0.15 : 0),
              }))}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${Number(v).toFixed(2)} Tbps`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Nassau"   stackId="1" stroke={RED}    fill={RED} fillOpacity={0.7} />
                <Area type="monotone" dataKey="Freeport"     stackId="1" stroke={AMBER}  fill={AMBER} fillOpacity={0.7} />
                <Area type="monotone" dataKey="Abaco"   stackId="1" stroke={BLUE}   fill={BLUE} fillOpacity={0.7} />
                <Area type="monotone" dataKey="Eleuthera" stackId="1" stroke={GREEN}  fill={GREEN} fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="text-vfes-dark/55">Peak <b className="text-vfes-dark">{tt('3.84 Tbps')}</b>{tt('at 21:00 ·')}</span>
              <span className="text-vfes-dark/55">Capacity headroom <b className="text-emerald-600">42%</b> ·</span>
              <span className="text-vfes-dark/55">Freeport dip 06:42 (P1 outage) <b className="text-vfes-dark">{tt('restored 09:30')}</b></span>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Regional pulse')}>
          <div className="space-y-2.5">
            {[
              { r: 'Nassau',    nps: 42, churn: 1.18, adds: 2840 },
              { r: 'Freeport',      nps: 28, churn: 1.82, adds:  840 },
              { r: 'Abaco',    nps: 38, churn: 1.42, adds:  620 },
              { r: 'Eleuthera',  nps: 36, churn: 1.34, adds:  480 },
              { r: 'Exuma', nps: 34, churn: 1.46, adds:  320 },
              { r: 'Rural',     nps: 30, churn: 1.74, adds:  920 },
            ].map((r) => (
              <div key={r.r} className="flex items-center gap-2">
                <div className="w-20 text-xs font-semibold">{r.r}</div>
                <span className={`w-9 text-center text-[10px] font-bold rounded px-1 py-0.5 ${r.nps >= 40 ? 'bg-emerald-100 text-emerald-700' : r.nps >= 35 ? 'bg-blue-100 text-blue-700' : r.nps >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>+{r.nps}</span>
                <span className={`w-12 text-right text-[10px] font-mono ${r.churn > 1.6 ? 'text-vfes-dark font-bold' : 'text-vfes-dark/65'}`}>{r.churn.toFixed(2)}%</span>
                <div className="flex-1 h-2 bg-[#f3f4f7] rounded overflow-hidden"><div className="h-full bg-vfes-red" style={{ width: `${(r.adds / 3000) * 100}%` }} /></div>
                <span className="w-10 text-right text-xs font-bold text-vfes-dark">+{(r.adds / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-3">{tt('NPS · churn % · net-adds week · Freeport flagged red')}</div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('OKR pulse')}>
          <div className="space-y-2.5">
            {okrs.map((o) => (
              <div key={o.o}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${o.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{o.o}</span>
                  <span className="font-bold">{o.p}%</span>
                </div>
                <div className="h-1.5 bg-[#f3f4f7] rounded-full overflow-hidden"><div className={`h-full ${o.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${o.p}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={tt('Funnel today (digital · live)')} insight={{ insight: 'Digital conversion stalls at checkout, where ~31% of intent drops off.', action: 'Greenlight the one-click eSIM checkout the CMO has staged.', impact: 'A 5pp recovery is ~BSD 0.4M incremental monthly digital revenue.' }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { s: 'Visit',    n: 18400 },
              { s: 'Configure',n:  6200 },
              { s: 'Cart',     n:  2840 },
              { s: 'Checkout', n:  1240 },
              { s: 'Order',    n:   862 },
            ]} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid stroke="#eee" horizontal={false} />
              <XAxis type="number" scale="log" domain={[1, 'auto']} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="s" tick={{ fontSize: 11 }} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => Number(v).toLocaleString()} />
              <Bar dataKey="n" radius={[0, 4, 4, 0]}>
                {[GREY, BLUE, AMBER, '#fb923c', RED].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/55 text-center mt-1">{tt('visit→order 4.7% · benchmark 3.8%')}</div>
        </Panel>
        <Panel title="Cortex AI — today's insights" action={<Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI →')}</Link>}>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2 p-2 rounded bg-vfes-red/5"><Sparkles className="w-4 h-4 text-vfes-dark mt-0.5 shrink-0" /><span>{tt('Freeport churn anomaly · -28% spike — recommend retention campaign (BSD 86K opportunity)')}</span></li>
            <li className="flex items-start gap-2 p-2 rounded bg-amber-50"><Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /><span>{tt('Funnel conversion drop on M500 SKU last hour — page-load p95 above SLO')}</span></li>
            <li className="flex items-start gap-2 p-2 rounded bg-emerald-50"><Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /><span>{tt('Bundle propensity model surfaced 4,218 high-intent customers · BSD 380K MRR upside')}</span></li>
            <li className="flex items-start gap-2 p-2 rounded bg-blue-50"><Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /><span>{tt('Island Bank (demo) framework win triggered B2B forecast revision · +BSD 4.2M ARR booked overnight')}</span></li>
          </ul>
        </Panel>
      </div>

      </>)}

      {tab === 'market' && (<>
      <PeriodBanner period={period} m={m} />
      {/* Net adds + Market share + Competitor pricing */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Net Subscriber Adds (QTD)')} action={<Link to="/portal/sales" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Sales →')}</Link>}>
          <div className="text-3xl font-extrabold mb-1">+{(totalNet / 1000).toFixed(1)}K</div>
          <div className="text-xs text-vfes-dark/55 mb-4">Gross {(totalGross / 1000).toFixed(1)}K · Churn {(totalChurn / 1000).toFixed(1)}K</div>
          <div className="space-y-2">
            {netAdds.map((p) => (
              <div key={p.product} className="flex items-center gap-3">
                <div className="w-20 text-sm">{p.product}</div>
                <div className="flex-1 h-7 bg-[#f3f4f7] rounded-lg overflow-hidden flex">
                  <div className="h-full" style={{ background: p.color, width: `${(p.net / 2200) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-bold text-vfes-dark">+{p.net}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Market Share — The Bahamas (May 2026)')} insight={{ insight: 'Cable Bahamas holds #2 share at ~23%, about two points behind the leader.', action: 'Concentrate FTTH overbuild where the share gap is closing fastest.', impact: 'Each share point is ~BSD 11M of annualised access revenue.' }} action={<Link to="/portal/coverage" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Coverage →')}</Link>}>
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={marketShare} dataKey="share" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {marketShare.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs mt-2">
            {marketShare.map((c) => (
              <div key={tt(c.name)} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded" style={{ background: c.color }} />
                <span className={c.name === 'Cable Bahamas' ? 'font-bold' : ''}>{tt(c.name)}</span>
                <span className="ml-auto">{c.share}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Competitor Pricing — BSD /mo SVR')} action={<Link to="/portal/pricing-simulator" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Pricing →')}</Link>}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
              <tr><th className="py-2">{tt('SKU')}</th><th>{tt('Cable Bahamas')}</th><th>{tt('BTC')}</th><th>{tt('Benchmark A')}</th><th>{tt('Position')}</th></tr>
            </thead>
            <tbody>
              {competitorIndex.map((c) => (
                <tr key={c.sku} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{c.sku}</td>
                  <td className="text-vfes-dark font-bold">BSD {c.vmie}</td>
                  <td>{c.BTC ? `BSD ${c.BTC}` : '—'}</td>
                  <td>{c.orange ? `BSD ${c.orange}` : '—'}</td>
                  <td className="text-xs text-vfes-dark/60">{c.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Market share trend + Switching flow */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
        <Panel title={tt('Market Share Trend — The Bahamas (last 6 quarters)')} insight={{ insight: 'Share has risen ~1.8pp over six quarters — the momentum is intact.', action: 'Sustain the convergence bundle that is driving the gain.', impact: 'On trajectory to share leadership within roughly eight quarters.' }}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={[
                { q: 'Q4-24', "Cable Bahamas": 26.4, BTC: 35.8, "Benchmark B": 13.1, "Benchmark A": 12.6, Other: 12.1 },
                { q: 'Q1-25', "Cable Bahamas": 26.8, BTC: 35.2, "Benchmark B": 13.0, "Benchmark A": 12.6, Other: 12.4 },
                { q: 'Q2-25', "Cable Bahamas": 27.2, BTC: 34.9, "Benchmark B": 12.8, "Benchmark A": 12.5, Other: 12.6 },
                { q: 'Q3-25', "Cable Bahamas": 27.6, BTC: 34.5, "Benchmark B": 12.7, "Benchmark A": 12.4, Other: 12.8 },
                { q: 'Q4-25', "Cable Bahamas": 27.8, BTC: 34.2, "Benchmark B": 12.6, "Benchmark A": 12.3, Other: 13.1 },
                { q: 'Q1-26', "Cable Bahamas": 28.0, BTC: 34.0, "Benchmark B": 12.5, "Benchmark A": 12.0, Other: 13.5 },
              ]}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[10, 40]} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Cable Bahamas" stroke="#222128" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="BTC" stroke="#3B82F6" strokeWidth={2} name={tt('BTC')} />
                <Line type="monotone" dataKey="Benchmark B" stroke="#0F172A" strokeWidth={2} name={tt('Benchmark B')} />
                <Line type="monotone" dataKey="Benchmark A" stroke="#EAB308" strokeWidth={2} name={tt('Benchmark A')} />
                <Line type="monotone" dataKey="Other" stroke="#94A3B8" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Cable Bahamas has gained <b>{tt('+1.6 pp')}</b> in 5 quarters; BTC down −1.8 pp; Benchmark B/altnets gaining +1.4 pp
          </div>
        </Panel>
        </div>

        <Panel title={tt('Switching Flow (last 30d)')}>
          <div className="text-xs text-vfes-dark/55 mb-3">{tt('Net porting in − out by source/destination')}</div>
          <div className="space-y-2.5">
            {[
              { from: 'BTC',    gained: 1840, lost: 720, color: '#3B82F6' },
              { from: 'Benchmark B',        gained: 920,  lost: 480, color: '#0F172A' },
              { from: 'Benchmark A',      gained: 880,  lost: 560, color: '#EAB308' },
              { from: 'Benchmark C',         gained: 410,  lost: 690, color: '#10B981' },
              { from: 'Pure Mobile', gained: 280, lost: 320, color: '#94A3B8' },
            ].map((s) => {
              const net = s.gained - s.lost
              return (
                <div key={s.from}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded" style={{ background: s.color }} /> {s.from}
                    </span>
                    <span className={`font-bold ${net >= 0 ? 'text-emerald-600' : 'text-vfes-dark'}`}>
                      {net >= 0 ? '+' : ''}{net}
                    </span>
                  </div>
                  <div className="h-3 bg-[#f3f4f7] rounded flex overflow-hidden">
                    <div className="bg-emerald-500" style={{ width: `${(s.gained / 2200) * 100}%` }} />
                    <div className="bg-vfes-red ml-px" style={{ width: `${(s.lost / 2200) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-vfes-dark/55 mt-0.5">
                    <span>+{s.gained} in</span><span>−{s.lost} out</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex justify-between text-xs">
            <span className="text-vfes-dark/60">{tt('Net 30d')}</span>
            <span className="font-extrabold text-emerald-600">{tt('+2,460 ports')}</span>
          </div>
        </Panel>
      </div>

      {/* ARPU benchmark + Brand health + Footprint */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('ARPU Benchmark (BSD /mo, blended)')} insight={{ insight: 'Blended ARPU of ~BSD 31 trails the premium peer by ~BSD 3 despite higher NPS.', action: 'Trial value-based pricing on the converged base, not the whole book.', impact: 'A BSD 1 ARPU lift is ~BSD 13M of annual revenue at current subscribers.' }}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { co: 'Cable Bahamas',  fixed: 56.20, mobile: 22.40 },
                { co: 'BTC', fixed: 51.80, mobile: 19.60 },
                { co: 'Benchmark B',     fixed: 54.10, mobile: 0     },
                { co: 'Benchmark A',   fixed: 49.90, mobile: 21.10 },
                { co: 'Benchmark C',      fixed: 47.20, mobile: 0     },
              ]} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="BSD " />
                <YAxis dataKey="co" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fixed" stackId="a" fill="#FF4438" name={tt('Fixed')} />
                <Bar dataKey="mobile" stackId="a" fill="#1F2937" name={tt('Mobile')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-2">
            Cable Bahamas blended BSD 78.6 — <b className="text-emerald-600">+BSD 7.2</b> vs market avg, premium positioning intact
          </div>
        </Panel>

        <Panel title={tt('Brand Health Tracker (Kantar, May)')}>
          <table className="w-full text-xs">
            <thead className="text-vfes-dark/55 uppercase text-[10px] tracking-widest">
              <tr><th className="text-left py-2">{tt('Metric')}</th><th>{tt('Cable Bahamas')}</th><th>{tt('BTC')}</th><th>{tt('Benchmark B')}</th><th>{tt('Benchmark A')}</th></tr>
            </thead>
            <tbody>
              {[
                { m: 'Aware',       v: 96, e: 98, s: 94, vo: 96, hi: false },
                { m: 'Consider',    v: 48, e: 52, s: 38, vo: 36, hi: false },
                { m: 'Prefer',      v: 31, e: 28, s: 18, vo: 16, hi: true },
                { m: 'Trust',       v: 64, e: 58, s: 60, vo: 55, hi: true },
                { m: 'NPS (cust)',  v: 38, e: 12, s: 22, vo: 8,  hi: true },
                { m: 'Reco rate',   v: 71, e: 54, s: 62, vo: 48, hi: true },
              ].map((r) => (
                <tr key={r.m} className="border-t border-black/5">
                  <td className="py-1.5 font-semibold">{r.m}</td>
                  <td className={`text-center font-bold ${r.hi ? 'text-vfes-dark' : ''}`}>{r.v}</td>
                  <td className="text-center text-vfes-dark/70">{r.e}</td>
                  <td className="text-center text-vfes-dark/70">{r.s}</td>
                  <td className="text-center text-vfes-dark/70">{r.vo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">{tt('n=1,800 · age 18-65 · weighted')}</div>
        </Panel>

        <Panel title={tt('Footprint — Homes Passed (M)')} insight={{ insight: 'Homes passed crossed 12M but the pace is slowing as easy metros are done.', action: 'Shift the build mix toward co-investment for the next 2M harder passes.', impact: 'Keeps coverage growth without inflating standalone capex.' }}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { co: 'Cable Bahamas',        hfc: 1.04, ftth: 0.42, total: 1.04 },
                { co: 'BTC',        hfc: 0,    ftth: 1.92, total: 1.92 },
                { co: 'Benchmark B',            hfc: 0,    ftth: 0.78, total: 0.78 },
                { co: 'NBI',             hfc: 0,    ftth: 0.56, total: 0.56 },
                { co: 'Benchmark A (MVNO)',   hfc: 0,    ftth: 0,    total: 0 },
              ]}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="co" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hfc" stackId="a" fill="#FF4438" name={tt('HFC')} />
                <Bar dataKey="ftth" stackId="a" fill="#10B981" name={tt('FTTH')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-2">
            <b>{tt('FTTH overbuild risk:')}</b> 78% of Cable Bahamas HFC is now ≥1 alt fiber within 200m
          </div>
        </Panel>
      </div>

      {/* Promo intensity + County strength + Share of voice */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
        <Panel title={tt('Promo Intensity Index (12 weeks)')} insight={{ insight: 'Market promo intensity is at a 12-week high — the discount war is heating up.', action: 'Compete on bundle value and speed, not headline price.', impact: 'Defends ARPU while still matching competitor gross adds.' }}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={[
                { wk: 'W1',  "Cable Bahamas": 24, market: 28 }, { wk: 'W2',  "Cable Bahamas": 26, market: 30 },
                { wk: 'W3',  "Cable Bahamas": 28, market: 32 }, { wk: 'W4',  "Cable Bahamas": 32, market: 36 },
                { wk: 'W5',  "Cable Bahamas": 38, market: 40 }, { wk: 'W6',  "Cable Bahamas": 44, market: 48 },
                { wk: 'W7',  "Cable Bahamas": 42, market: 52 }, { wk: 'W8',  "Cable Bahamas": 40, market: 56 },
                { wk: 'W9',  "Cable Bahamas": 38, market: 58 }, { wk: 'W10', "Cable Bahamas": 36, market: 60 },
                { wk: 'W11', "Cable Bahamas": 34, market: 62 }, { wk: 'W12', "Cable Bahamas": 32, market: 66 },
              ]}>
                <defs>
                  <linearGradient id="mkt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="vmieG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4438" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF4438" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" idx" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="market" stroke="#94A3B8" fill="url(#mkt)" name={tt('Market avg')} />
                <Area type="monotone" dataKey="Cable Bahamas" stroke="#222128" strokeWidth={2} fill="url(#vmieG)" name={tt('Cable Bahamas')} />
                <ReferenceLine y={50} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: 'price-war zone', fontSize: 10, fill: '#B45309' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-2">
            Market promo intensity at <b>66</b> (price-war zone); Cable Bahamas at 32 — holding margin discipline
          </div>
        </Panel>
        </div>

        <Panel title={tt('Share of Voice — May')} insight={{ insight: 'Cable Bahamas share of voice lags the leader by ~9 points this month.', action: 'Reallocate unspent brand budget into the convergence campaign.', impact: 'Closing the SoV gap has historically preceded a ~0.5pp share gain.' }}>
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[
                { name: 'Cable Bahamas',  v: 32, color: '#FF4438' },
                  { name: 'BTC', v: 28, color: '#3B82F6' },
                  { name: 'Benchmark B',     v: 16, color: '#0F172A' },
                  { name: 'Benchmark A',   v: 18, color: '#EAB308' },
                  { name: 'Others',   v: 6,  color: '#94A3B8' },
                ]} dataKey="v" innerRadius={32} outerRadius={62} paddingAngle={2}>
                  {['#FF4438','#3B82F6','#0F172A','#EAB308','#94A3B8'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] space-y-1 mt-1">
            <div className="flex justify-between"><span>{tt('Spend (May)')}</span><b>{tt('BSD 2.1M')}</b></div>
            <div className="flex justify-between"><span>{tt('vs market index')}</span><b className="text-emerald-600">114</b></div>
            <div className="flex justify-between"><span>{tt('Top channel')}</span><b>{tt('Connected TV 38%')}</b></div>
            <div className="flex justify-between"><span>{tt('Earned/owned ratio')}</span><b>{tt('1.8x')}</b></div>
          </div>
        </Panel>
      </div>

      {/* County strength + Win rate by channel */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('County Strength — Cable Bahamas share %')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-2">{tt('Strongholds')}</div>
              <div className="space-y-1.5">
                {[
                  { c: 'Nassau',   v: 38.2, d: '+0.6' },
                  { c: 'Freeport',     v: 34.1, d: '+0.2' },
                  { c: 'Abaco',   v: 31.8, d: '+0.9' },
                  { c: 'Eleuthera', v: 29.6, d: '+0.4' },
                  { c: 'Exuma',v: 27.2, d: '+0.1' },
                ].map((r) => (
                  <div key={r.c} className="flex items-center gap-2 text-xs">
                    <span className="w-20">{r.c}</span>
                    <div className="flex-1 h-2 bg-[#f3f4f7] rounded">
                      <div className="h-2 bg-emerald-500 rounded" style={{ width: `${r.v * 2}%` }} />
                    </div>
                    <span className="w-10 text-right font-bold">{r.v}%</span>
                    <span className="w-10 text-right text-emerald-600 text-[10px]">{tt(r.d)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold mb-2">{tt('Underweight')}</div>
              <div className="space-y-1.5">
                {[
                  { c: 'Andros',            v: 11.2, d: '-0.4' },
                  { c: 'San Salvador',        v: 12.8, d: '-0.2' },
                  { c: 'Cat Island',               v: 14.1, d: '-0.1' },
                  { c: 'Bimini',            v: 15.6, d: '+0.0' },
                  { c: 'Rum Cay',               v: 16.8, d: '-0.3' },
                ].map((r) => (
                  <div key={r.c} className="flex items-center gap-2 text-xs">
                    <span className="w-20">{r.c}</span>
                    <div className="flex-1 h-2 bg-[#f3f4f7] rounded">
                      <div className="h-2 bg-vfes-red rounded" style={{ width: `${r.v * 2}%` }} />
                    </div>
                    <span className="w-10 text-right font-bold">{r.v}%</span>
                    <span className="w-10 text-right text-vfes-dark text-[10px]">{tt(r.d)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-3 pt-3 border-t border-black/5">
            <b>{tt('Action:')}</b> Andros &amp; San Salvador footprint expansion proposal in CapEx review (Jul-26)
          </div>
        </Panel>

        <Panel title={tt('Win Rate by Acquisition Channel')} insight={{ insight: 'Direct digital wins at roughly twice the rate of telesales but takes less volume.', action: 'Move telesales incentives toward digital-assisted journeys.', impact: 'Lifts the blended win rate and cuts cost-per-add.' }}>
          <div className="h-56">
            <ResponsiveContainer>
              <ComposedChart data={[
                { ch: 'D2D field',    rate: 38, vol: 4200 },
                { ch: 'Telesales',    rate: 22, vol: 6800 },
                { ch: 'Web direct',   rate: 14, vol: 18400 },
                { ch: 'Comparison',   rate: 9,  vol: 22000 },
                { ch: 'Retail store', rate: 31, vol: 2100 },
                { ch: 'Referral',     rate: 44, vol: 1600 },
                { ch: 'Affiliate',    rate: 11, vol: 9200 },
              ]}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="ch" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="r" dataKey="vol" fill="#94A3B8" name={tt('Leads')} />
                <Line yAxisId="l" type="monotone" dataKey="rate" stroke="#222128" strokeWidth={3} dot={{ r: 4 }} name={tt('Win %')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark/60 mt-2">
            Referral converts <b>{tt('3.1x')}</b> higher than comparison sites — referral booster live in NPS journey
          </div>
        </Panel>
      </div>

      {/* Churn drivers vs market + Bundle penetration + Regulatory market events */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Churn Reasons — Cable Bahamas vs Market')} insight={{ insight: 'Price churn sits below the market average, but service-driven churn is above it.', action: 'Fund the field-service SLA fix over another retention discount.', impact: 'Service-led saves are stickier and margin-neutral.' }}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { r: 'Price',    "Cable Bahamas": 28, market: 36 },
                { r: 'Speed',    "Cable Bahamas": 14, market: 18 },
                { r: 'Service',  "Cable Bahamas": 12, market: 15 },
                { r: 'Outage',   "Cable Bahamas": 18, market: 9  },
                { r: 'Move home',"Cable Bahamas": 16, market: 14 },
                { r: 'Other',    "Cable Bahamas": 12, market: 8  },
              ]} layout="vertical">
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="r" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Cable Bahamas" fill="#FF4438" />
                <Bar dataKey="market" fill="#94A3B8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-vfes-dark mt-2">
            <b>{tt('Outage')}</b> is +9pp vs market — Freeport quality programme priority
          </div>
        </Panel>

        <Panel title={tt('Bundle Penetration (% subs)')}>
          <div className="space-y-3 mt-1">
            {[
              { b: 'Triple play (BB+TV+Mob)', vmie: 42, mkt: 28, color: '#FF4438' },
              { b: 'Dual (BB+TV)',            vmie: 24, mkt: 22, color: '#3B82F6' },
              { b: 'Dual (BB+Mob)',           vmie: 18, mkt: 16, color: '#10B981' },
              { b: 'BB only',                 vmie: 12, mkt: 28, color: '#94A3B8' },
              { b: 'Mobile only',             vmie:  4, mkt:  6, color: '#EAB308' },
            ].map((r) => (
              <div key={r.b}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">{r.b}</span>
                  <span><b className="text-vfes-dark">{r.vmie}%</b> <span className="text-vfes-dark/50">vs {r.mkt}%</span></span>
                </div>
                <div className="h-2.5 bg-[#f3f4f7] rounded relative">
                  <div className="h-2.5 rounded" style={{ background: r.color, width: `${r.vmie * 2}%` }} />
                  <div className="absolute top-0 h-2.5 w-px bg-vfes-dark/40" style={{ left: `${r.mkt * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-vfes-dark/60 mt-3 pt-3 border-t border-black/5">
            Triple-play <b>{tt('+14pp')}</b> vs market = key margin & retention moat
          </div>
        </Panel>

        <Panel title={tt('Regulatory & Market Events')}>
          <div className="space-y-2.5 text-xs">
            {[
              { d: 'Jun 12', t: 'URCA M4 spectrum auction — 3.6 GHz lot', tag: 'spectrum', color: 'bg-blue-100 text-blue-700' },
              { d: 'Jun 24', t: 'EU Roaming Reg renewal vote (impact: -BSD 3.2M ARPU)', tag: 'regulation', color: 'bg-amber-100 text-amber-700' },
              { d: 'Jul 01', t: 'BTC Q2 results — guidance call 09:00 CET', tag: 'competitor', color: 'bg-zinc-100 text-zinc-700' },
              { d: 'Jul 15', t: 'Sports add-on The Bahamas launch (OTT-only, BSD 25/mo)', tag: 'launch', color: 'bg-purple-100 text-purple-700' },
              { d: 'Aug 02', t: 'CCPC bundling probe deadline', tag: 'compliance', color: 'bg-rose-100 text-rose-700' },
              { d: 'Aug 20', t: 'NBI 250k milestone passed — overbuild trigger', tag: 'footprint', color: 'bg-emerald-100 text-emerald-700' },
            ].map((e, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <div className="text-[10px] font-mono w-12 text-vfes-dark/55 mt-0.5">{tt(e.d)}</div>
                <div className="flex-1">
                  <div className="text-[13px]">{tt(e.t)}</div>
                  <span className={`inline-block mt-1 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${e.color}`}>{tt(e.tag)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Cortex AI market signals strip */}
      <div className="grid lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', t: 'Premium tilt opportunity', d: 'The Bahamas willingness-to-pay +4% YoY (Kantar). Price-up to BSD 82 SVR estimated +BSD 1.4M ARR / -0.05 pp churn.' },
          { icon: TrendingUp, color: 'text-amber-600 bg-amber-50', t: 'Sports add-on wedge', d: 'Benchmark C launches OTT-only BSD 25/mo Jul-15. Pre-emptive Bundle Lock retention offer modelled at BSD 0.6M defence cost.' },
          { icon: Zap, color: 'text-vfes-dark bg-vfes-red/10', t: 'Andros whitespace', d: '11.2% share, 58k unpassed homes. Joint-build with NBI proposed — IRR 14.2%, payback 5.8y.' },
          { icon: Activity, color: 'text-blue-600 bg-blue-50', t: 'Promo discipline holding', d: 'Market intensity 66 vs Cable Bahamas 32. Hold-the-line scenario protects BSD 4.8M EBITDA Q3 vs match-pricing.' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-black/5 p-4">
            <div className={`w-8 h-8 rounded-lg grid place-items-center ${s.color} mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm mb-1">{tt(s.t)}</div>
            <div className="text-xs text-vfes-dark/60 leading-relaxed">{tt(s.d)}</div>
          </div>
        ))}
      </div>

      </>)}

      {tab === 'strategy' && (<>
      <PeriodBanner period={period} m={m} />
      {/* OKRs + Pipeline + AI impact */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Strategic OKRs (FY2026)')} action={<Link to="/portal/strategy" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Strategy →')}</Link>}>
          <div className="space-y-3">
            {okrs.map((o) => (
              <Link to="/portal/strategy" key={o.o} className="block group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${o.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {o.o}
                  </span>
                  <span className="font-bold">{o.p}%</span>
                </div>
                <div className="h-1.5 bg-[#f3f4f7] rounded-full overflow-hidden">
                  <div className={`h-full ${o.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'} group-hover:opacity-80 transition`} style={{ width: `${o.p}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Sales Pipeline & B2B')} action={<Link to="/portal/sales" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Sales →')}</Link>}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-xs text-vfes-dark/55">{tt('Pipeline')}</div>
              <div className="text-2xl font-extrabold text-vfes-dark">{tt('BSD 38.4M')}</div>
              <div className="text-xs text-emerald-600 font-bold">{tt('+BSD 2.1M MoM')}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="text-xs text-vfes-dark/55">{tt('B2B Revenue YTD')}</div>
              <div className="text-2xl font-extrabold text-vfes-dark">{tt('BSD 78M')}</div>
              <div className="text-xs text-emerald-600 font-bold">{tt('+12.4% YoY')}</div>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Win rate')}</span><span className="font-semibold">32.4%</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('New connections (Q)')}</span><span className="font-semibold">4,820</span></div>
            <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Coverage ratio')}</span><span className="font-semibold">2.4×</span></div>
          </div>
        </Panel>

        <Panel title={tt('AI Portfolio Impact')} action={<Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI →')}</Link>}>
          <div className="text-3xl font-extrabold mb-1">{tt('BSD 3.2M')}</div>
          <div className="text-xs text-vfes-dark/55 mb-4">{tt('predicted revenue lift · next 90 days')}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{tt('Retention models')}</span><span className="font-bold text-emerald-600">{tt('+BSD 2.1M')}</span></div>
            <div className="flex justify-between"><span>{tt('Bundle propensity')}</span><span className="font-bold text-emerald-600">{tt('+BSD 820K')}</span></div>
            <div className="flex justify-between"><span>{tt('Pricing optimisation')}</span><span className="font-bold text-emerald-600">{tt('+BSD 280K')}</span></div>
            <div className="pt-2 mt-2 border-t border-black/5 flex justify-between"><span className="text-vfes-dark/55 text-xs">{tt('Models in production')}</span><span className="font-bold">14</span></div>
          </div>
        </Panel>
      </div>

      {/* CEO inbox + Strategic risks + ESG */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title={tt('CEO Inbox — decisions this week')} action={<Mail className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-2">
            {inbox.map((i, idx) => {
              const Icon = i.icon
              return (
                <Link to={i.to} key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition cursor-pointer group">
                  <span className={`text-[10px] font-black px-2 py-1 rounded shrink-0 ${
                    i.color === 'red' ? 'bg-red-100 text-red-700' : i.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>{i.p}</span>
                  <Icon className="w-4 h-4 text-vfes-dark/55 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{tt(i.t)}</div>
                    <div className="text-xs text-vfes-dark/55 mt-0.5">due in {i.due}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-vfes-dark/30 group-hover:text-vfes-dark group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                </Link>
              )
            })}
          </div>
        </Panel>

        <Panel title={tt('Top Strategic Risks')} action={<Link to="/portal/risk" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Risk →')}</Link>}>
          <div className="space-y-2">
            {risks.map((r) => (
              <Link to="/portal/risk" key={r.r} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition group">
                <div className={`w-9 h-9 rounded grid place-items-center text-xs font-black text-white ${
                  r.score >= 15 ? 'bg-red-500' : r.score >= 10 ? 'bg-amber-500' : 'bg-yellow-400 text-vfes-dark'
                }`}>{r.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{r.r}</div>
                  <div className="text-[10px] text-vfes-dark/55">{r.impact} impact · {r.likely} likelihood</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-vfes-dark/30 group-hover:text-vfes-dark transition" />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Net Zero Glide Path')} insight={{ insight: 'Emissions are on the 2030 glide path, but Scope 3 is the swing factor.', action: 'Tie the next handset-supplier renewal to a Scope 3 reduction clause.', impact: 'Keeps the net-zero commitment investor-grade and audit-ready.' }} action={<Link to="/portal/regulatory" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-emerald-600" />{tt('Open ESG →')}</Link>}>
          <div className="text-3xl font-extrabold mb-1">-22%</div>
          <div className="text-xs text-vfes-dark/55 mb-4">{tt('scope 1+2 emissions vs. 2020 baseline · target -50% by 2030')}</div>
          <div className="h-32">
            <ResponsiveContainer>
              <LineChart data={[
                { y: '2020', actual: 100, target: 100 },
                { y: '2022', actual: 92, target: 92 },
                { y: '2024', actual: 84, target: 84 },
                { y: '2026', actual: 78, target: 76 },
                { y: '2028', actual: null, target: 64 },
                { y: '2030', actual: null, target: 50 },
              ]}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="y" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name={tt('Target')} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981' }} name={tt('Actual')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            <div>
              <div className="font-bold text-emerald-600">78%</div>
              <div className="text-vfes-dark/55">{tt('Renewable')}</div>
            </div>
            <div>
              <div className="font-bold text-emerald-600">88%</div>
              <div className="text-vfes-dark/55">{tt('E-waste')}</div>
            </div>
            <div>
              <div className="font-bold text-amber-600">{tt('behind')}</div>
              <div className="text-vfes-dark/55">{tt('Glide path')}</div>
            </div>
          </div>
        </Panel>
      </div>
      </>)}

      {tab === 'geo' && <GeoTab period={period} m={m} />}
      {tab === 'value' && <ValueTab period={period} m={m} />}
      {tab === 'investor' && <InvestorTab period={period} m={m} />}
      {tab === 'compete' && <CompeteTab period={period} m={m} />}
      {tab === 'innovate' && <InnovateTab period={period} m={m} />}
      {tab === 'capital' && <CapitalTab period={period} m={m} />}
      {tab === 'stake' && <StakeTab period={period} m={m} />}
      {tab === 'briefing' && <BriefingTab period={period} m={m} />}

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML guidance-tracker · sentiment NLP on press · semantic view EXEC_360 · model ceo-cockpit v1.0 · refreshed daily 06:00 UTC
      </div>
    </div>
  )
}

type TabProps = { period: string; m: number }

// ============================================================================= GEO & NETWORK
type GeoCity = {
  city: string; lat: number; lng: number
  subsK: number      // subscribers (thousands)
  arpu: number       // monthly ARPU (BSD )
  quality: number    // composite network-quality score 0-100
  dlMbps: number     // median download
  uptime: number     // 30d %
  churn: number      // monthly %
  nps: number
}

// High-revenue metros with their network-quality composite. Numbers are tuned
// so revenue tracks network quality — the story the map is meant to tell.
const GEO_CITIES: GeoCity[] = [
  { city: 'Nassau',      lat: 25.0443, lng: -77.3504,  subsK: 11.191, arpu: 31.5, quality: 94, dlMbps: 410, uptime: 99.98, churn: 1.1, nps: 41 },
  { city: 'Freeport',        lat: 26.5333, lng: -78.7,  subsK: 8.664, arpu: 29.8, quality: 86, dlMbps: 360, uptime: 99.41, churn: 1.5, nps: 32 },
  { city: 'Abaco',       lat: 26.5412, lng: -77.0636,  subsK: 4.512, arpu: 28.5, quality: 90, dlMbps: 350, uptime: 99.82, churn: 1.3, nps: 35 },
  { city: 'Eleuthera',       lat: 25.1962, lng: -76.2431,  subsK: 4.26, arpu: 27.9, quality: 92, dlMbps: 345, uptime: 99.97, churn: 1.4, nps: 31 },
  { city: 'Bimini',     lat: 25.727, lng: -79.2972,  subsK: 2.31,  arpu: 28.8, quality: 93, dlMbps: 372, uptime: 99.94, churn: 1.0, nps: 39 },
  { city: 'Andros',     lat: 24.7064, lng: -77.7902,  subsK: 2.96,  arpu: 27.2, quality: 91, dlMbps: 330, uptime: 99.95, churn: 1.4, nps: 34 },
  { city: 'Exuma',      lat: 23.5, lng: -75.7667,  subsK: 2.022,  arpu: 26.4, quality: 89, dlMbps: 320, uptime: 99.96, churn: 1.3, nps: 36 },
  { city: 'Long Island',        lat: 23.25, lng: -75.1,  subsK: 1.877,  arpu: 26.0, quality: 88, dlMbps: 315, uptime: 99.93, churn: 1.4, nps: 33 },
  { city: 'Inagua',         lat: 20.95, lng: -73.6731,  subsK: 1.48,  arpu: 25.6, quality: 86, dlMbps: 300, uptime: 99.90, churn: 1.6, nps: 28 },
  { city: 'San Salvador', lat: 24.036, lng: -74.494,  subsK: 2.022,  arpu: 24.8, quality: 83, dlMbps: 285, uptime: 99.88, churn: 1.9, nps: 25 },
  { city: 'New Providence',     lat: 25.06, lng: -77.345,  subsK: 2.491,  arpu: 26.6, quality: 89, dlMbps: 322, uptime: 99.93, churn: 1.3, nps: 34 },
  { city: 'Cat Island',         lat: 24.315, lng: -75.453,  subsK: 2.238,  arpu: 26.2, quality: 88, dlMbps: 318, uptime: 99.92, churn: 1.4, nps: 33 },
  { city: 'Rum Cay',        lat: 23.685, lng: -74.868,  subsK: 1.552,  arpu: 27.0, quality: 90, dlMbps: 330, uptime: 99.95, churn: 1.2, nps: 36 },
  { city: 'Mayaguana',     lat: 22.379, lng: -73.014,  subsK: 1.48,  arpu: 26.1, quality: 88, dlMbps: 315, uptime: 99.91, churn: 1.4, nps: 33 },
  { city: 'West End',    lat: 26.686, lng: -78.977,  subsK: 1.3,  arpu: 26.4, quality: 89, dlMbps: 320, uptime: 99.93, churn: 1.3, nps: 35 },
  { city: 'Paradise Island',   lat: 25.083, lng: -77.32,  subsK: 1.444,  arpu: 25.8, quality: 87, dlMbps: 308, uptime: 99.90, churn: 1.5, nps: 31 },
  { city: 'Crooked Island',    lat: 22.757, lng: -74.215,  subsK: 1.083,  arpu: 27.6, quality: 92, dlMbps: 345, uptime: 99.96, churn: 1.1, nps: 38 },
  { city: 'Acklins',         lat: 22.433, lng: -73.97,  subsK: 1.047,  arpu: 26.9, quality: 90, dlMbps: 330, uptime: 99.94, churn: 1.2, nps: 36 },
  { city: 'Harbour Island',    lat: 25.5, lng: -76.637,  subsK: 1.119,  arpu: 27.2, quality: 91, dlMbps: 338, uptime: 99.95, churn: 1.2, nps: 37 },
  { city: 'Spanish Wells',          lat: 25.547, lng: -76.764,  subsK: 1.372,  arpu: 25.4, quality: 86, dlMbps: 300, uptime: 99.89, churn: 1.6, nps: 29 },
  { city: 'Great Harbour Cay',        lat: 25.75, lng: -77.85,  subsK: 1.733,  arpu: 24.9, quality: 84, dlMbps: 288, uptime: 99.88, churn: 1.8, nps: 26 },
  { city: 'Ragged Island',     lat: 22.383, lng: -75.833,  subsK: 1.011,  arpu: 28.2, quality: 93, dlMbps: 360, uptime: 99.96, churn: 1.0, nps: 40 },
  { city: 'Green Turtle Cay',     lat: 26.774, lng: -77.33,  subsK: 1.083,  arpu: 26.5, quality: 89, dlMbps: 322, uptime: 99.93, churn: 1.3, nps: 35 },
  { city: 'Hope Town',        lat: 26.539, lng: -76.959,  subsK: 0.939,  arpu: 25.3, quality: 86, dlMbps: 300, uptime: 99.89, churn: 1.6, nps: 30 },
  { city: 'Treasure Cay',     lat: 26.676, lng: -77.276,  subsK: 0.975,  arpu: 25.7, quality: 87, dlMbps: 305, uptime: 99.90, churn: 1.5, nps: 31 },
  { city: 'Rock Sound',    lat: 24.9, lng: -76.177,  subsK: 0.902,  arpu: 26.8, quality: 90, dlMbps: 332, uptime: 99.95, churn: 1.2, nps: 35 },
  { city: 'Tarpum Bay',        lat: 24.967, lng: -76.167,  subsK: 0.722,  arpu: 26.7, quality: 90, dlMbps: 330, uptime: 99.95, churn: 1.2, nps: 36 },
  { city: 'Deadmans Cay',        lat: 23.178, lng: -75.093,  subsK: 0.794,  arpu: 24.7, quality: 84, dlMbps: 285, uptime: 99.87, churn: 1.8, nps: 26 },
  { city: 'Clarence Town',        lat: 23.1, lng: -74.983,  subsK: 0.866,  arpu: 26.0, quality: 88, dlMbps: 315, uptime: 99.92, churn: 1.4, nps: 33 },
  { city: 'Fresh Creek',     lat: 24.727, lng: -77.79,  subsK: 0.758,  arpu: 25.9, quality: 88, dlMbps: 312, uptime: 99.91, churn: 1.4, nps: 33 },
  { city: 'Nicholls Town',       lat: 25.145, lng: -78.002,  subsK: 0.83,  arpu: 25.6, quality: 87, dlMbps: 305, uptime: 99.90, churn: 1.5, nps: 32 },
  { city: 'Mangrove Cay',      lat: 24.298, lng: -77.68,  subsK: 0.722,  arpu: 26.6, quality: 90, dlMbps: 328, uptime: 99.94, churn: 1.2, nps: 36 },
  { city: 'Congo Town',       lat: 24.159, lng: -77.59,  subsK: 0.794,  arpu: 26.3, quality: 89, dlMbps: 320, uptime: 99.93, churn: 1.3, nps: 35 },
  { city: 'Duncan Town',      lat: 22.19, lng: -75.725,  subsK: 0.722,  arpu: 24.8, quality: 84, dlMbps: 288, uptime: 99.88, churn: 1.7, nps: 27 },
  { city: 'Matthew Town',  lat: 20.95, lng: -73.673,  subsK: 0.686,  arpu: 25.5, quality: 87, dlMbps: 304, uptime: 99.90, churn: 1.5, nps: 31 },
  { city: 'Port Nelson',     lat: 23.649, lng: -74.841,  subsK: 0.83,  arpu: 25.1, quality: 85, dlMbps: 296, uptime: 99.88, churn: 1.6, nps: 29 },
  { city: 'Arthur Town',       lat: 24.629, lng: -75.673,  subsK: 0.65,  arpu: 26.9, quality: 90, dlMbps: 333, uptime: 99.95, churn: 1.2, nps: 37 },
  { city: 'Cockburn Town',        lat: 24.051, lng: -74.532,  subsK: 0.541,  arpu: 25.2, quality: 86, dlMbps: 300, uptime: 99.89, churn: 1.5, nps: 30 },
  { city: 'Dunmore Town',     lat: 25.5, lng: -76.637,  subsK: 0.722,  arpu: 25.8, quality: 88, dlMbps: 310, uptime: 99.91, churn: 1.4, nps: 32 },
  { city: 'Alice Town',         lat: 25.727, lng: -79.297,  subsK: 0.83,  arpu: 25.8, quality: 88, dlMbps: 310, uptime: 99.91, churn: 1.4, nps: 32 },
  { city: 'Marsh Harbour',        lat: 26.541, lng: -77.064,  subsK: 0.866,  arpu: 25.4, quality: 86, dlMbps: 300, uptime: 99.89, churn: 1.6, nps: 30 },
]

const cityRevM = (c: GeoCity) => (c.subsK * c.arpu * 12) / 1000 // annualised BSD M
const qColor = (q: number) => (q >= 92 ? GREEN : q >= 87 ? AMBER : RED)
const qBand = (q: number) => (q >= 92 ? 'Excellent' : q >= 87 ? 'Good' : 'At risk')
const qChip = (q: number) => (q >= 92 ? 'bg-emerald-50 text-emerald-700' : q >= 87 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')

function pearson(xs: number[], ys: number[]) {
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; num += a * b; dx += a * a; dy += b * b }
  return num / Math.sqrt(dx * dy)
}

function GeoTab({ period, m }: TabProps) {
  const ranked = [...GEO_CITIES].sort((a, b) => cityRevM(b) - cityRevM(a))
  const totalRevM = Math.round(GEO_CITIES.reduce((s, c) => s + cityRevM(c), 0) * m)
  const avgQuality = (GEO_CITIES.reduce((s, c) => s + c.quality, 0) / GEO_CITIES.length).toFixed(0)
  const atRiskRevM = Math.round(GEO_CITIES.filter((c) => c.quality < 87).reduce((s, c) => s + cityRevM(c), 0) * m)
  const r = pearson(GEO_CITIES.map((c) => c.quality), GEO_CITIES.map((c) => c.arpu))

  const maxRev = Math.max(...GEO_CITIES.map(cityRevM))
  const markers: MapMarker[] = GEO_CITIES.map((c) => ({
    name: c.city,
    lat: c.lat,
    lng: c.lng,
    radius: 8 + (cityRevM(c) / maxRev) * 26,
    color: qColor(c.quality),
    pulse: c.quality < 85,
    tooltip: `${c.city} · BSD ${cityRevM(c).toFixed(0)}M · quality ${c.quality} · ARPU BSD ${c.arpu}`,
  }))

  const scatter = GEO_CITIES.map((c) => ({ x: c.quality, y: c.arpu, z: c.subsK, city: c.city }))

  const insight = {
    headline: `Revenue tracks network quality — correlation r = ${r.toFixed(2)}`,
    stats: [
      { label: 'Mapped revenue', value: `BSD ${totalRevM}M` },
      { label: 'Avg network quality', value: `${avgQuality}/100` },
      { label: 'Quality↔ARPU r', value: r.toFixed(2) },
      { label: 'Revenue at risk', value: `BSD ${atRiskRevM}M` },
    ],
    findings: [
      `Strong positive correlation (r = ${r.toFixed(2)}): every ~+5 quality points maps to roughly +BSD 1.5 ARPU and lower churn.`,
      'Freeport is the clearest at-risk concentration — second-largest revenue base but quality dragged to 86 by INC-2031 transport degradation. Restoring the ring protects high-value ARPU.',
      'Las Palmas & Palma sit lowest on quality (83 / 86) and lowest on ARPU and NPS — capex here has the steepest revenue-defence payback.',
      'Nassau, Bimini and Eleuthera show the model in reverse: top-quartile quality underwrites the highest ARPU and the lowest churn.',
    ],
    note: 'Recommended: prioritise the Freeport ring fix and Inagua/San Salvador RAN upgrade — together they cover the bulk of quality-exposed revenue.',
  }

  return (
    <>
      <PeriodBanner period={period} m={m} />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={`Revenue mapped ${period}`} value={`BSD ${totalRevM}M`} delta={`${GEO_CITIES.length} metros`} trend="up" icon={MapPin} accent />
        <KpiCard label={tt('Avg network quality')} value={`${avgQuality}/100`} delta="site-weighted composite" trend="flat" icon={Radio} />
        <KpiCard label={tt('Revenue ↔ quality (r)')} value={r.toFixed(2)} delta="strong positive" trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Revenue at quality risk')} value={`BSD ${atRiskRevM}M`} delta="quality < 87" trend="down" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel
            title={tt('Revenue & network quality by metro')}
            action={
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="text-vfes-dark/50">{tt('bubble = revenue')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN }} /> {tt('Excellent')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: AMBER }} /> {tt('Good')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} /> {tt('At risk')}</span>
              </div>
            }
          >
            <CartoMap markers={markers} height={440} basemap="voyager" zoom={6} />
            <div className="mt-2 text-[11px] text-vfes-dark/45">
              {tt('Bubble size = annualised revenue · colour = network-quality composite. Pulsing metros carry revenue exposed to quality issues.')}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={tt('ARPU vs network quality')} insight={{ insight: 'Metros with higher network-quality scores carry materially higher ARPU.', action: 'Sequence capex to the metros where the quality-ARPU link is steepest.', impact: 'Maximises revenue return per capex euro deployed.' }}>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 12, bottom: 18, left: -8 }}>
                <CartesianGrid stroke="#eee" />
                <XAxis type="number" dataKey="x" name={tt('Quality')} domain={[80, 96]} tick={{ fontSize: 11 }} label={{ value: tt('Network quality'), position: 'insideBottom', offset: -8, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name={tt('ARPU')} domain={[24, 33]} tick={{ fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[60, 600]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [v, n]} labelFormatter={() => ''} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatter}>
                  {scatter.map((s, i) => <Cell key={i} fill={qColor(s.x)} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="text-[11px] text-vfes-dark/50 text-center">{tt('Each bubble = a metro · size = subscribers')} · r = {r.toFixed(2)}</div>
          </Panel>

          <Panel title={tt('Geo insight (Cortex)')}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2">
              <Sparkles className="w-3 h-3" /> {tt('Correlate revenue with network quality')}
            </div>
            <AgentAction
              label="Explain revenue vs network quality"
              runningLabel="Correlating signals…"
              steps={[
                'Joined metro revenue, ARPU & churn with RAN/transport quality',
                'Computed revenue-weighted quality correlation',
                'Flagged metros with revenue exposed to quality risk',
                'Drafted capex prioritisation',
              ]}
              result={insight}
            />
          </Panel>
        </div>
      </div>

      <Panel title={tt('Metro league table — revenue vs quality')} action={<span className="text-[11px] font-semibold text-vfes-dark/45">{tt('Top 15 of')} {GEO_CITIES.length} {tt('metros')}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-vfes-dark/45 border-b border-black/5">
                <th className="py-2 pr-4 font-bold">{tt('Metro')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('Revenue (BSD M)')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('Subs (K)')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('ARPU (BSD )')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('Median DL')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('Churn')}</th>
                <th className="py-2 px-4 font-bold text-right">{tt('NPS')}</th>
                <th className="py-2 pl-4 font-bold">{tt('Network quality')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 15).map((c) => (
                <tr key={c.city} className="border-b border-black/5 last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-vfes-dark">{tt(c.city)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold">{Math.round(cityRevM(c) * m).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{c.subsK.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{c.arpu.toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{c.dlMbps} Mbps</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{c.churn.toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">+{c.nps}</td>
                  <td className="py-2.5 pl-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded ${qChip(c.quality)}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: qColor(c.quality) }} /> {c.quality} · {tt(qBand(c.quality))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

function PeriodBanner({ period, m }: TabProps) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vfes-red/10 text-vfes-dark text-xs font-bold">
      Showing: {period} · multiplier ×{m.toFixed(2)}
    </div>
  )
}

// ============================================================================= VALUE
function ValueTab({ period, m }: TabProps) {
  const capDeployed = Math.round(capAlloc.reduce((s, x) => s + x.v, 0) * m)
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('TSR (5-yr · indexed)')} value="172" delta="peer 128" trend="up" icon={TrendingUp} accent />
        <KpiCard label={tt('EV / EBITDA')} value={`${multiples[0].evEbitda}x`} delta="peer median 6.6x" trend="up" icon={Banknote} />
        <KpiCard label={tt('ROIC – WACC')} value={`+${(roic.spread * 100).toFixed(1)} pp`} delta={`ROIC ${(roic.vmie * 100).toFixed(1)}%`} trend="up" icon={Target} />
        <KpiCard label={`Capital deployed ${period}`} value={`BSD ${capDeployed}M`} delta="see split" trend="flat" icon={Wallet} />
      </div>

      <Panel title={tt('Total Shareholder Return — Cable Bahamas vs peer set (indexed 100 = 2021)')} insight={{ insight: 'Total shareholder return leads the peer set since 2021 indexing.', action: 'Anchor the equity story on sustained TSR, not a single-year EPS print.', impact: 'Supports a re-rating toward the premium-peer multiple.' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tsr}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="y" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="vfes"  stroke={RED}    strokeWidth={3} dot={{ r: 4 }} name={tt('Cable Bahamas')} />
            <Line dataKey="peer"  stroke={GREY}   strokeWidth={2} strokeDasharray="4 4" name={tt('Peer median')} />
            <Line dataKey="BTC"   stroke="#0098D8" strokeWidth={2} name={tt('BTC')} />
            <Line dataKey="three" stroke={AMBER}  strokeWidth={2} name={tt('Benchmark C')} />
            <Line dataKey="bt"    stroke={PURPLE} strokeWidth={2} name={tt('KPN')} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('Equity-value bridge FY25 → FY26 (BSD M)')} insight={{ insight: 'EBITDA growth drives the bridge; net-debt reduction adds the remainder.', action: 'Keep deleveraging on plan before considering buybacks.', impact: 'A lower leverage multiple unlocks the next valuation tier.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evWaterfall}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="base" stackId="a" fill="transparent" />
              <Bar dataKey="val" stackId="a" radius={[4, 4, 0, 0]}>
                {evWaterfall.map((b, i) => <Cell key={i} fill={b.kind === 'open' || b.kind === 'close' ? '#1f2937' : b.kind === 'in' ? GREEN : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Capital allocation YTD (BSD M)')} insight={{ insight: 'Capex remains the largest use of capital at ~62% of allocation.', action: 'Hold the fibre/mobile split and resist ad-hoc reallocation requests.', impact: 'Disciplined allocation protects the dividend cover ratio.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={capAlloc} dataKey="v" nameKey="k" outerRadius={90} label={(d: any) => `${d.k}: BSD ${d.v}M`}>
                {capAlloc.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Trading multiples vs peers')} insight={{ insight: 'Cable Bahamas trades at roughly a 1.5x EV/EBITDA discount to the peer median.', action: 'Use results to close the narrative gap on fibre monetisation.', impact: 'Re-rating to the median is roughly BSD 0.9B of equity value.' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={multiples}>
            <CartesianGrid stroke="#eee" vertical={false} />
            <XAxis dataKey="co" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="evEbitda" fill={RED}   name={tt('EV/EBITDA')} />
            <Bar dataKey="evFcf"    fill={BLUE}  name={tt('EV/FCF')} />
            <Bar dataKey="peScore"  fill={GREEN} name={tt('P/E')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  )
}

// ============================================================================= INVESTOR
function InvestorTab({ period, m }: TabProps) {
  const consRev = Math.round(consensus.rev * m)
  const ourRev = Math.round(consensus.our * m)
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Next earnings call')} value={`${consensus.callDays}d`} delta="rehearsal Mon" trend="flat" icon={Calendar} accent />
        <KpiCard label={`Consensus revenue (${period})`} value={`BSD ${consRev}M`} delta={`our BSD ${ourRev}M`} trend="down" icon={Banknote} />
        <KpiCard label={tt('Analyst rating')} value={`${analysts.buy}B / ${analysts.hold}H / ${analysts.sell}S`} delta={`target BSD ${analysts.target}`} trend="up" icon={Award} />
        <KpiCard label={tt('Credit headroom')} value="1.4x" delta="covenant 3.5x · current 2.6x" trend="up" icon={ShieldCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Guidance accuracy — actual vs guidance (% miss/beat, last 8Q)')} insight={{ insight: 'The last eight quarters landed within ~1% of guidance — credibility is high.', action: 'Maintain the conservative guide-and-beat cadence into FY26.', impact: 'Predictability sustains the lower cost of equity.' }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={guidanceAccuracy}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="q" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#1f2937" />
              <Bar dataKey="rev"    fill={RED}   name={tt('Revenue')} />
              <Bar dataKey="ebitda" fill={BLUE}  name={tt('EBITDA')} />
              <Line dataKey="fcf"   stroke={GREEN} strokeWidth={2} name={tt('FCF')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Top shareholders')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Holder')}</th><th>{tt('Class')}</th><th className="text-right">%</th></tr>
            </thead>
            <tbody>
              {shareholders.map((s) => (
                <tr key={tt(s.name)} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(s.name)}</td>
                  <td className="text-xs text-vfes-dark/60">{s.kind}</td>
                  <td className="text-right font-bold">{(s.pct * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/55 mt-3">{tt('Activist watchlist: 0 active · BlackRock voted with mgmt at AGM')}</div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Credit ratings')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Agency')}</th><th>{tt('Rating')}</th><th>{tt('Outlook')}</th><th>{tt('Cov. headroom')}</th></tr>
            </thead>
            <tbody>
              {credit.map((c) => (
                <tr key={c.agency} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{c.agency}</td>
                  <td className="font-mono font-bold">{c.rating}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${c.outlook === 'Positive' ? 'bg-emerald-50 text-emerald-700' : c.outlook === 'Negative' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{c.outlook}</span></td>
                  <td>{c.headroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Board commitments — last meeting')}>
          <div className="space-y-2 text-sm">
            {boardCommitments.map((b) => (
              <div key={b.topic} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${b.rag === 'green' ? 'bg-emerald-500' : b.rag === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="font-semibold flex-1">{b.topic}</span>
                <span className="text-xs text-vfes-dark/55">{b.due}</span>
                <span className="text-xs font-bold">{tt(b.status)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

// ============================================================================= COMPETITIVE
function CompeteTab({ period, m }: TabProps) {
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Share of growth')} value="42%" delta="Cable Bahamas / total net-adds" trend="up" icon={Trophy} accent />
        <KpiCard label={tt('NPS gap to #2')} value="+6" delta="Benchmark B next at +32" trend="up" icon={Smile} />
        <KpiCard label={tt('Win rate B2B')} value="56%" delta="vs all rivals" trend="up" icon={Target} />
        <KpiCard label={tt('Brand consideration')} value="56" delta="peer 52" trend="up" icon={Award} />
      </div>

      {/* Mobile MNO benchmark — Cable Bahamas vs BTC / Benchmark A / Benchmark B */}
      <Panel title={tt('Mobile · MNO benchmark — Cable Bahamas vs BTC · Benchmark A · Benchmark B')} insight={{ insight: 'Mobile scores lead BTC on latency but trail on rural coverage.', action: 'Prioritise rural RAN sites in the next mobile capex wave.', impact: 'Closes the one gap competitors use against us in tenders.' }} action={<Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Open Mobile RAN →')}</Link>}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={MNO_BENCHMARK} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="metric" tick={{ fontSize: 11 }} width={150} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="vfes" fill={RED} name={tt('Cable Bahamas')} radius={[0, 4, 4, 0]} />
            <Bar dataKey="btc" fill="#0070C0" name={tt('BTC')} radius={[0, 4, 4, 0]} />
            <Bar dataKey="orange" fill="#FF7900" name={tt('Benchmark A')} radius={[0, 4, 4, 0]} />
            <Bar dataKey="digi" fill="#FFD500" name={tt('Benchmark B')} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={tt('Market-share evolution by quarter (%)')} insight={{ insight: 'Quarterly share gains are consistent and broad-based across regions.', action: 'Document the playbook from the top regions for national rollout.', impact: 'Scales a proven motion rather than experimenting market-wide.' }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={shareEvo}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="q" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="vfes"  stackId="1" fill={RED}     stroke={RED}     name={tt('Cable Bahamas')} />
            <Area dataKey="BTC"   stackId="1" fill="#0098D8" stroke="#0098D8" name={tt('BTC')} />
            <Area dataKey="three" stackId="1" fill={AMBER}   stroke={AMBER}   name={tt('Benchmark C')} />
            <Area dataKey="sky"   stackId="1" fill="#001580" stroke="#001580" name={tt('Benchmark B')} />
            <Area dataKey="other" stackId="1" fill={GREY}    stroke={GREY}    name={tt('Other')} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('Win-rate vs each competitor (by segment)')} insight={{ insight: 'We win B2B convergence but lose the value-mobile segment to Benchmark B.', action: 'Defend value-mobile with a fighter brand, not core-brand discounts.', impact: 'Protects core ARPU while stemming the value-segment loss.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winRate}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="vs" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(Number(v) * 100).toFixed(0)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="enterprise" fill={RED}   name={tt('Enterprise')} />
              <Bar dataKey="smb"        fill={BLUE}  name={tt('SMB')} />
              <Bar dataKey="consumer"   fill={GREEN} name={tt('Consumer')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Brand health — Cable Bahamas vs peer median')} insight={{ insight: 'Brand consideration leads peers, but trust trails after recent outages.', action: 'Make the reliability investment visible in next-quarter comms.', impact: 'Rebuilding trust lifts consideration-to-switch conversion.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brand} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid stroke="#eee" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="metric" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="vfes" fill={RED} name={tt('Cable Bahamas')} />
              <Bar dataKey="peer" fill={GREY} name={tt('Peer median')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('NPS league table')} insight={{ insight: 'Cable Bahamas holds the top NPS in two of four segments.', action: 'Replicate the winning service model into the two lagging segments.', impact: 'Higher NPS correlates with ~20% lower churn in our base.' }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={npsGap.sort((a, b) => b.nps - a.nps)}>
            <CartesianGrid stroke="#eee" vertical={false} />
            <XAxis dataKey="co" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="nps" radius={[4, 4, 0, 0]}>
              {npsGap.map((d, i) => <Cell key={i} fill={d.co === 'Cable Bahamas' ? RED : GREY} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  )
}

// ============================================================================= INNOVATE
function InnovateTab({ period, m }: TabProps) {
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Innovation index')} value={`${(innovStats.newRevPct * 100).toFixed(0)}%`} delta="rev from <3yr products" trend="up" icon={Sparkles} accent />
        <KpiCard label={tt('M&A pipeline')} value={`BSD ${Math.round(mnaPipeline.reduce((s, x) => s + x.valueM, 0) * m)}M`} delta={`${mnaPipeline.reduce((s, x) => s + x.n, 0)} targets`} trend="up" icon={Briefcase} />
        <KpiCard label={tt('Patents (TTM)')} value={`${innovStats.patentsTtm}`} delta={`${innovStats.labProjects} lab projects`} trend="up" icon={Award} />
        <KpiCard label={`Joint partnership ARR (${period})`} value={`BSD ${(partnerships.reduce((s, p) => s + p.jointArrM, 0) * m).toFixed(1)}M`} delta="6 strategic partners" trend="up" icon={Network} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Innovation revenue by product (age yrs)')} insight={{ insight: 'Products under three years old now contribute ~18% of revenue.', action: 'Protect the innovation budget in the next planning cycle.', impact: 'Sustains the growth mix that supports the premium multiple.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid stroke="#eee" />
              <XAxis type="number" dataKey="age" name={tt('Age (yrs)')} domain={[0, 4]} tick={{ fontSize: 11 }} label={{ value: 'Age (yrs) →', fontSize: 10, position: 'bottom' }} />
              <YAxis type="number" dataKey="revM" name={tt('Revenue (BSD M)')} tick={{ fontSize: 11 }} label={{ value: 'BSD M ARR', fontSize: 10, angle: -90, position: 'left' }} />
              <ZAxis range={[100, 240]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any, p: any) => [`${p.payload.product}: BSD ${p.payload.revM}M`, '']} />
              <Scatter data={innovIndex}>
                {innovIndex.map((d, i) => <Cell key={i} fill={d.age <= 1 ? RED : d.age <= 2 ? AMBER : BLUE} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('M&A pipeline funnel')} insight={{ insight: 'The pipeline is healthy but concentrated in two sizeable targets.', action: 'Advance diligence on the smaller bolt-on to de-risk the funnel.', impact: 'Keeps inorganic optionality without over-exposure to one deal.' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mnaPipeline}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="n" fill={RED} name={tt('Targets')} />
              <Line yAxisId="r" dataKey="valueM" stroke="#1f2937" strokeWidth={2} name={tt('BSD M value')} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Strategic partnerships scoreboard')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Partner')}</th><th>{tt('Type')}</th><th>{tt('Joint ARR')}</th><th>{tt('Health')}</th></tr>
          </thead>
          <tbody>
            {partnerships.map((p) => (
              <tr key={p.partner} className="border-t border-black/5">
                <td className="py-2 font-semibold">{p.partner}</td>
                <td className="text-xs text-vfes-dark/60">{p.kind}</td>
                <td className="font-bold">BSD {p.jointArrM.toFixed(1)}M</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.health === 'Green' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.health}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ============================================================================= CAPITAL
function CapitalTab({ period, m }: TabProps) {
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Cash + RCF')} value={`BSD ${cashStats.cash + cashStats.undrawnRcf}M`} delta={`cash BSD ${cashStats.cash}M`} trend="up" icon={Wallet} accent />
        <KpiCard label={tt('Net leverage')} value={`${cashStats.leverage}x`} delta={`covenant ${cashStats.covenantMax}x`} trend="up" icon={Banknote} />
        <KpiCard label={tt('Capex intensity')} value={`${(cashStats.capexPct * 100).toFixed(0)}%`} delta={`peers ${(cashStats.peerCapexPct * 100).toFixed(0)}%`} trend="flat" icon={BarChart3} />
        <KpiCard label={tt('Effective tax rate')} value={`${(cashStats.taxEffective * 100).toFixed(1)}%`} delta="ES illustrative 25%" trend="flat" icon={ShieldCheck} />
      </div>

      {/* CapEx ring-fence — Fixed vs Mobile lanes */}
      <Panel title={tt('CapEx ring-fence — Fixed vs Mobile lanes')} insight={{ insight: 'The mobile-led capex lane is fully committed while fixed has slack.', action: 'Reallocate the fixed slack to the rural mobile sites flagged above.', impact: 'Improves capex efficiency without raising the total envelope.' }} action={<span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('MOBILE-LED')}</span>}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[
            { lane: tt('FTTH build'),       capex: 240, type: 'fixed' },
            { lane: tt('DOCSIS 4.0'),       capex:  64, type: 'fixed' },
            { lane: tt('Backbone & peering'), capex: 48, type: 'fixed' },
            { lane: tt('5G SA RAN'),         capex: 280, type: 'mobile' },
            { lane: tt('Open RAN pilot'),    capex:  64, type: 'mobile' },
            { lane: tt('mmWave / FWA trial'),capex:  22, type: 'mobile' },
            { lane: tt('Island Towers (demo) tower share'), capex:  85, type: 'mobile' },
            { lane: tt('Network Slicing'),   capex:  38, type: 'mobile' },
            { lane: tt('IT & platform'),     capex:  92, type: 'fixed' },
          ]}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <XAxis dataKey="lane" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: 'BSD M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="capex" radius={[6, 6, 0, 0]}>
              {[
                { type: 'fixed' }, { type: 'fixed' }, { type: 'fixed' },
                { type: 'mobile' }, { type: 'mobile' }, { type: 'mobile' }, { type: 'mobile' }, { type: 'mobile' },
                { type: 'fixed' },
              ].map((d, i) => <Cell key={i} fill={d.type === 'mobile' ? RED : '#3B82F6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-vfes-red" />{tt('Mobile / RAN lanes')} <b className="text-vfes-dark">BSD 489M</b></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{tt('Fixed lanes')} <b className="text-vfes-dark">BSD 444M</b></span>
          <span className="ml-auto">{tt('Mobile/RAN now leads CapEx allocation — first time since FTTH build began')}</span>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Debt maturity wall (BSD M)')} insight={{ insight: 'No major maturity falls due until 2028 — the near-term wall is manageable.', action: 'Pre-refinance opportunistically while credit spreads are tight.', impact: 'Locks low coupons and removes refinancing risk from the story.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={debtMaturity}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="y" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                {debtMaturity.map((d, i) => <Cell key={i} fill={d.amt > 250 ? RED : d.amt > 150 ? AMBER : GREEN} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/55 text-center mt-1">{tt('2028 wall BSD 320M — refinancing window opens Q3-27')}</div>
        </Panel>
        <Panel title={tt('FX exposure (BSD M net · hedge %)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Ccy')}</th><th>{tt('Net BSD M')}</th><th>{tt('Hedge %')}</th></tr>
            </thead>
            <tbody>
              {fxExposure.map((f) => (
                <tr key={f.ccy} className="border-t border-black/5">
                  <td className="py-2 font-mono font-semibold">{f.ccy}</td>
                  <td className={f.netM < 0 ? 'text-vfes-dark font-bold' : 'text-emerald-600 font-bold'}>{f.netM > 0 ? '+' : ''}{f.netM}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded"><div className="h-full bg-vfes-red rounded" style={{ width: `${f.hedgePct * 100}%` }} /></div>
                      <span className="text-xs font-bold w-10 text-right">{(f.hedgePct * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Macro context overlay')}>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          {macro.map((m) => (
            <div key={m.i} className="p-2.5 rounded-lg bg-zinc-50 border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{m.i}</div>
              <div className="text-lg font-extrabold mt-0.5">{m.v} <span className={`text-xs ${m.delta === '↑' ? 'text-emerald-600' : m.delta === '↓' ? 'text-vfes-dark' : 'text-vfes-dark/40'}`}>{m.delta}</span></div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ============================================================================= STAKEHOLDERS
function StakeTab({ period, m }: TabProps) {
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Stakeholder index')} value="74" delta="8 groups · trending up" trend="up" icon={Crown} accent />
        <KpiCard label={tt('Press sentiment')} value="+68" delta="+18 wk · share-of-voice" trend="up" icon={Newspaper} />
        <KpiCard label={`Govt engagement (${period})`} value={`${Math.max(1, Math.round(14 * m))} mtgs`} delta="last 90d" trend="flat" icon={Building2} />
        <KpiCard label={tt('Community projects')} value={`${Math.max(1, Math.round(22 * m))}`} delta="active" trend="up" icon={Leaf} />
      </div>

      <Panel title={tt('Stakeholder health · 8 groups')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Group')}</th><th>{tt('Health')}</th><th>{tt('Trend')}</th><th>{tt('Top risk')}</th></tr>
          </thead>
          <tbody>
            {stakeholders.map((s) => (
              <tr key={s.group} className="border-t border-black/5">
                <td className="py-2 font-semibold">{s.group}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-zinc-100 rounded"><div className={`h-full rounded ${s.health >= 75 ? 'bg-emerald-500' : s.health >= 65 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${s.health}%` }} /></div>
                    <span className="text-xs font-bold w-8 text-right">{s.health}</span>
                  </div>
                </td>
                <td>{s.trend === 'up' ? <span className="text-emerald-600 font-bold">▲</span> : s.trend === 'down' ? <span className="text-vfes-dark font-bold">▼</span> : <span className="text-vfes-dark/40">—</span>}</td>
                <td className="text-xs text-vfes-dark/65">{s.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 mb-6">
        <Panel title={tt('Press / share-of-voice (8 weeks)')} insight={{ insight: 'Earned-media tone improved after the fibre-milestone announcement.', action: 'Sequence the next proof point to sustain positive momentum.', impact: 'Positive earned media lowers paid-acquisition pressure.' }}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={reputationVoice}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area dataKey="positive" stackId="1" fill={GREEN} stroke={GREEN} name={tt('Positive')} />
              <Area dataKey="neutral"  stackId="1" fill={GREY}  stroke={GREY}  name={tt('Neutral')} />
              <Area dataKey="negative" stackId="1" fill={RED}   stroke={RED}   name={tt('Negative')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Government / regulator engagement log')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Counterparty')}</th><th>{tt('Last')}</th><th>{tt('Topic')}</th><th>{tt('Tone')}</th></tr>
            </thead>
            <tbody>
              {govEngagement.map((g) => (
                <tr key={g.who} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{g.who}</td>
                  <td className="text-xs">{g.last}</td>
                  <td className="text-xs text-vfes-dark/65">{g.topic}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${g.tone === 'Warm' ? 'bg-emerald-50 text-emerald-700' : g.tone === 'Tense' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{g.tone}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}

// ============================================================================= BRIEFING
function BriefingTab({ period, m }: TabProps) {
  return (
    <>
      <PeriodBanner period={period} m={m} />
      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">CEO {period} briefing · auto-generated by Cortex Agent</div>
        <div className="text-2xl font-extrabold mt-1">What needs your attention this {period === 'MTD' ? 'month' : period === 'QTD' ? 'quarter' : period === 'YTD' ? 'year' : 'rolling year'}</div>
        <ul className="mt-4 space-y-2 text-sm">
          {weekNarrative.map((n, i) => (
            <li key={i} className="flex items-start gap-3"><Sparkles className="w-4 h-4 text-vfes-dark mt-1 shrink-0" /><span>{n}</span></li>
          ))}
        </ul>
      </div>

      {/* Mobile lens — Cable Bahamas is a top-3 MNO */}
      <Panel title={tt('Mobile lens · today')} action={<Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Open Mobile RAN →')}</Link>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark flex items-center gap-1.5 mb-1"><Smartphone className="w-3 h-3" />{tt('Mobile subscribers')}</div>
            <div className="text-2xl font-extrabold">2.84M</div>
            <div className="text-[10px] text-emerald-600">+2.1% YoY · {tt('top-3 MNO')}</div>
          </div>
          <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark flex items-center gap-1.5 mb-1"><Radio className="w-3 h-3" />{tt('5G coverage')}</div>
            <div className="text-2xl font-extrabold">89.4%</div>
            <div className="text-[10px] text-emerald-600">+3.4 pp · {tt('on-track to 95% by Q4 2026')}</div>
          </div>
          <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark flex items-center gap-1.5 mb-1"><BarChart3 className="w-3 h-3" />{tt('Mobile NPS')}</div>
            <div className="text-2xl font-extrabold">+38</div>
            <div className="text-[10px] text-emerald-600">{tt('BTC +1 242 · Benchmark A +31 · Benchmark B +22')}</div>
          </div>
          <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark flex items-center gap-1.5 mb-1"><ShieldCheck className="w-3 h-3" />{tt('Open RAN posture')}</div>
            <div className="text-2xl font-extrabold">28%</div>
            <div className="text-[10px] text-amber-600">{tt('Out Islands pilot · GA target Q2 2027')}</div>
          </div>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Live feed since last login')}>
          <div className="space-y-2">
            {ceoFeed.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-black/5">
                  <span className="text-xs text-vfes-dark/55 font-mono w-12 shrink-0 mt-0.5">{tt(f.t)}</span>
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${f.color === 'red' ? 'text-vfes-dark' : f.color === 'amber' ? 'text-amber-600' : f.color === 'green' ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <span className="text-sm">{f.what}</span>
                </div>
              )
            })}
          </div>
        </Panel>
        <Panel title={tt('Decision log — open items')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Decision')}</th><th>{tt('Status')}</th><th>{tt('Due')}</th></tr>
            </thead>
            <tbody>
              {decisionLog.map((d) => (
                <tr key={d.id} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{d.id}</td>
                  <td className="font-semibold text-xs">{d.topic}</td>
                  <td className="text-xs text-vfes-dark/65">{tt(d.status)}</td>
                  <td className="text-xs font-bold">{d.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Snowflake Intelligence — try a question')}>
        <div className="flex flex-wrap gap-2">
          {[
            'Brief me on what changed since last Tuesday.',
            'Draft my board talking points for next meeting.',
            'Where am I behind on OKRs and why?',
            'Compare our Q vs each peer on the 5 metrics that matter.',
            'Forecast Q3 guidance accuracy based on current run-rate.',
          ].map((p, i) => (
            <div key={i} className="inline-flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-vfes-red/10">
              <MessageSquare className="w-3.5 h-3.5" /> {p}
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
