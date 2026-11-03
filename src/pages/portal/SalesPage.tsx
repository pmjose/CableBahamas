import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import {
  TrendingUp, Trophy, Target, Coins, Activity, Sparkles, Users, Phone,
  Briefcase, Building2, Calendar, GitBranch, Bell, AlertTriangle, MapPin,
  Zap, ArrowUpRight, ShieldCheck, Send, FlaskConical, Megaphone, Award,
  Clock, ShoppingCart, DollarSign, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, ScatterChart, Scatter, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { SALES_BY_LANE, CUSTOMER_MIX_BY_LANE } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const headline = {
  bookingsMTD: 8.42,         // BSD M
  bookingsQTD: 22.6,         // BSD M
  quotaQ: 28.0,              // BSD M
  attainPct: 81,
  forecastQ: 27.2,           // BSD M commit + best
  gapToPlan: -0.8,           // BSD M
  pipelineCov: 3.4,          // x quota
  newConnectsMTD: 4820,
  winRate: 32.4,
  avgDeal: 1840,
  cycleDays: 21,
  arpuNew: 64,
}

const forecastWaterfall = [
  { k: 'Closed Won',    v: 12.8, color: '#10b981' },
  { k: 'Commit',         v: 6.4,  color: RED },
  { k: 'Best Case',     v: 4.2,  color: RED2 },
  { k: 'Pipeline',      v: 3.8,  color: RED4 },
  { k: 'Risk / Slip',    v: -1.4, color: '#ef4444' },
]

const quotaByWk = [
  { wk: 'W1', plan: 1.8, actual: 1.6, commit: 1.7 },
  { wk: 'W2', plan: 2.0, actual: 2.1, commit: 2.0 },
  { wk: 'W3', plan: 2.2, actual: 2.0, commit: 2.1 },
  { wk: 'W4', plan: 2.4, actual: 2.5, commit: 2.4 },
  { wk: 'W5', plan: 2.4, actual: 2.3, commit: 2.4 },
  { wk: 'W6', plan: 2.6, actual: 2.4, commit: 2.5 },
  { wk: 'W7', plan: 2.6, actual: null, commit: 2.5 },
  { wk: 'W8', plan: 2.6, actual: null, commit: 2.6 },
  { wk: 'W9', plan: 2.8, actual: null, commit: 2.7 },
  { wk: 'W10', plan: 2.8, actual: null, commit: 2.7 },
  { wk: 'W11', plan: 2.8, actual: null, commit: 2.6 },
  { wk: 'W12', plan: 3.0, actual: null, commit: 2.7 },
]

const stages = [
  { stage: 'Lead',         count: 4820, value: 8.6,  conv: 100, days: 0 },
  { stage: 'Qualified',    count: 2988, value: 6.4,  conv: 62,  days: 3 },
  { stage: 'Proposal',     count: 1639, value: 4.8,  conv: 34,  days: 9 },
  { stage: 'Negotiation',  count: 868,  value: 3.1,  conv: 18,  days: 14 },
  { stage: 'Closed Won',   count: 433,  value: 1.6,  conv: 9,   days: 21 },
]

const stageVelocity = [
  { stage: 'Lead → Qualified',     days: 3,  target: 4 },
  { stage: 'Qualified → Proposal', days: 6,  target: 5 },
  { stage: 'Proposal → Negotiation', days: 5, target: 6 },
  { stage: 'Negotiation → Won',    days: 7,  target: 6 },
]

const pipelineFlow = [
  { wk: 'W1', created: 4.2, won: 1.6, lost: 0.7, slipped: 0.4 },
  { wk: 'W2', created: 4.6, won: 2.1, lost: 0.9, slipped: 0.3 },
  { wk: 'W3', created: 4.4, won: 2.0, lost: 0.6, slipped: 0.5 },
  { wk: 'W4', created: 5.0, won: 2.5, lost: 1.0, slipped: 0.2 },
  { wk: 'W5', created: 4.8, won: 2.3, lost: 0.8, slipped: 0.4 },
  { wk: 'W6', created: 5.2, won: 2.4, lost: 0.9, slipped: 0.3 },
]

const winLossReasons = [
  { r: 'Price',                  won: 18, lost: 38 },
  { r: 'Speed / Network',        won: 32, lost: 14 },
  { r: 'Bundle (Sports add-on · Sports package)',    won: 24, lost: 8 },
  { r: 'Mobile add-on (REVConnect)',   won: 14, lost: 6 },
  { r: 'Customer service',       won: 6,  lost: 18 },
  { r: 'Install timeline',       won: 4,  lost: 12 },
  { r: 'Other',                  won: 2,  lost: 4 },
]

const competitiveLosses = [
  { c: 'BTC',       deals: 142, share: 38, depth: 12 },
  { c: 'Rival ISP B',       deals: 98,  share: 26, depth: 18 },
  { c: 'Rival ISP C',  deals: 71,  share: 19, depth: 8 },
  { c: 'Rival ISP B',  deals: 44,  share: 12, depth: 14 },
  { c: 'Other',     deals: 18,  share: 5,  depth: 6 },
]

const dealsAtRisk = [
  { id: 'OPP-8421', acc: 'Knowles Pharma · 24 sites',     stage: 'Negotiation', value: 124, age: 31, owner: 'A. Bethel',     risk: 'High',    reason: 'No activity 12d · single-thread' },
  { id: 'OPP-8410', acc: 'Freeport Tech Hub',                stage: 'Proposal',    value: 86,  age: 22, owner: 'D. Knowles',    risk: 'High',    reason: 'BTC matched price' },
  { id: 'OPP-8398', acc: 'Abaco Med Group · 12 sites',  stage: 'Negotiation', value: 142, age: 28, owner: 'N. Knowles',    risk: 'Medium',  reason: 'Champion changed role' },
  { id: 'OPP-8421', acc: 'Eleuthera Council · framework', stage: 'Qualified',   value: 312, age: 41, owner: 'E. O\'Brien',  risk: 'High',    reason: 'Tender deferred 60d' },
  { id: 'OPP-8367', acc: 'Exuma Logistics',          stage: 'Proposal',    value: 64,  age: 18, owner: 'C. Knowles',    risk: 'Medium',  reason: 'Discount asked +14%' },
  { id: 'OPP-8358', acc: 'Bimini Co-op',                  stage: 'Negotiation', value: 48,  age: 24, owner: 'P. Willems',   risk: 'Low',     reason: 'Awaiting legal sign-off' },
]

const segments = [
  { name: 'Consumer',          bookings: 12.4, deals: 4120, avg: 84,    margin: 64, color: RED },
  { name: 'B2B SoHo',          bookings: 4.2,  deals: 380,  avg: 1180,  margin: 58, color: RED2 },
  { name: 'Mid-market',        bookings: 3.8,  deals: 64,   avg: 6240,  margin: 51, color: RED3 },
  { name: 'Enterprise',        bookings: 1.6,  deals: 18,   avg: 9420,  margin: 46, color: RED4 },
  { name: 'Public sector',     bookings: 0.6,  deals: 4,    avg: 18000, margin: 42, color: RED5 },
]

const productMix = [
  { name: 'BB only',         value: 28, color: RED },
  { name: 'BB + TV',         value: 18, color: RED2 },
  { name: 'REVConnect (BB+Mobile)', value: 22, color: RED3 },
  { name: 'Mega bundle',     value: 14, color: RED4 },
  { name: 'Mobile only',     value: 10, color: RED5 },
  { name: 'B2B Fibre',       value: 6,  color: '#ec4899' },
  { name: 'Hosted Voice',    value: 2,  color: '#94a3b8' },
]

const channelMix = [
  { ch: 'DTC web',           gross: 1980, share: 41, conv: 6.4, cpga: 84 },
  { ch: 'Switcher port-in',  gross: 1110, share: 23, conv: 9.8, cpga: 48 },
  { ch: 'Retail',            gross: 580,  share: 12, conv: 12.4, cpga: 92 },
  { ch: 'Telesales',         gross: 470,  share: 10, conv: 14.6, cpga: 64 },
  { ch: 'Doorstep',          gross: 340,  share: 7,  conv: 18.2, cpga: 112 },
  { ch: 'Partner',           gross: 290,  share: 6,  conv: 11.2, cpga: 96 },
]

const newVsExisting = [
  { k: 'New logo',  value: 58, color: RED },
  { k: 'Upsell',    value: 26, color: RED3 },
  { k: 'Renewal',   value: 16, color: RED5 },
]

const regions = [
  { r: 'Nassau',     deals: 1820, bookings: 8.4, growth: 8,  pen: 64 },
  { r: 'Freeport',       deals: 920,  bookings: 4.1, growth: 5,  pen: 48 },
  { r: 'Abaco',     deals: 540,  bookings: 2.4, growth: 12, pen: 41 },
  { r: 'Eleuthera',   deals: 420,  bookings: 1.9, growth: 3,  pen: 38 },
  { r: 'Exuma',  deals: 320,  bookings: 1.4, growth: 9,  pen: 36 },
  { r: 'Bimini',      deals: 240,  bookings: 1.0, growth: 15, pen: 32 },
  { r: 'Andros',   deals: 220,  bookings: 0.9, growth: 4,  pen: 34 },
  { r: 'San Salvador', deals: 198,  bookings: 0.8, growth: 6,  pen: 31 },
  { r: 'Long Island', deals: 380,  bookings: 1.7, growth: 11, pen: 42 },
]

const topAccounts = [
  { acc: 'Island Bank (demo) Group',              tier: 'Strategic', tcv: 4.8, services: 92, expansion: 1.2, owner: 'A. Bethel' },
  { acc: 'Island Logistics (demo) Group',               tier: 'Public',    tcv: 3.6, services: 84, expansion: 0.8, owner: 'N. Knowles' },
  { acc: 'Commonwealth Bank (demo)',        tier: 'Strategic', tcv: 3.2, services: 68, expansion: 1.4, owner: 'A. Bethel' },
  { acc: 'Island Air (demo) Holdings',       tier: 'Strategic', tcv: 2.4, services: 42, expansion: 1.8, owner: 'D. Knowles' },
  { acc: 'Barco',          tier: 'Strategic', tcv: 2.1, services: 18, expansion: 0.4, owner: 'D. Knowles' },
  { acc: 'Nassau Bus',             tier: 'Public',    tcv: 1.4, services: 24, expansion: 0.6, owner: 'A. Bethel' },
  { acc: 'University of Eleuthera', tier: 'Public',    tcv: 1.2, services: 38, expansion: 0.4, owner: 'E. O\'Brien' },
  { acc: 'Long Island Group',               tier: 'Mid-mkt',   tcv: 0.9, services: 22, expansion: 0.7, owner: 'C. Knowles' },
]

const reps = [
  { name: 'Sofie Bethel',     region: 'Nassau',    deals: 142, revenue: 286, attain: 102, winRate: 38, asp: 2014, cycle: 18, activity: 92, ramp: 'On-quota' },
  { name: 'Daan Knowles',  region: 'Freeport',      deals: 118, revenue: 232, attain: 94,  winRate: 34, asp: 1966, cycle: 22, activity: 88, ramp: 'On-quota' },
  { name: 'Emma Knowles',    region: 'Abaco',    deals: 96,  revenue: 189, attain: 86,  winRate: 32, asp: 1968, cycle: 24, activity: 81, ramp: 'On-quota' },
  { name: 'Jonas O\'Brien',  region: 'Eleuthera',  deals: 84,  revenue: 162, attain: 78,  winRate: 29, asp: 1928, cycle: 26, activity: 76, ramp: 'Coaching' },
  { name: 'Karolien Knowles',  region: 'Exuma', deals: 71,  revenue: 138, attain: 71,  winRate: 28, asp: 1944, cycle: 27, activity: 72, ramp: 'Coaching' },
  { name: 'Lars Willems', region: 'Bimini',     deals: 58,  revenue: 112, attain: 64,  winRate: 26, asp: 1931, cycle: 31, activity: 68, ramp: 'Ramp · M3' },
  { name: 'Camille Bain',    region: 'Long Island',   deals: 48,  revenue: 92,  attain: 58,  winRate: 24, asp: 1916, cycle: 33, activity: 64, ramp: 'Ramp · M2' },
  { name: 'Stijn Bain',   region: 'San Salvador', deals: 32,  revenue: 61,  attain: 42,  winRate: 21, asp: 1906, cycle: 38, activity: 58, ramp: 'Ramp · M1' },
]

const repActivity = [
  { name: 'Sofie',    calls: 142, demos: 38, props: 22, followups: 86 },
  { name: 'Daan',  calls: 128, demos: 32, props: 19, followups: 74 },
  { name: 'Emma',    calls: 116, demos: 28, props: 17, followups: 68 },
  { name: 'Jonas',     calls: 92,  demos: 22, props: 14, followups: 54 },
  { name: 'Karolien',  calls: 84,  demos: 19, props: 12, followups: 48 },
  { name: 'Lars',  calls: 68,  demos: 14, props: 9,  followups: 38 },
  { name: 'Camille',    calls: 58,  demos: 11, props: 7,  followups: 32 },
  { name: 'Stijn',     calls: 44,  demos: 8,  props: 5,  followups: 24 },
]

const orderToCash = [
  { stage: 'Order',         count: 4820, conv: 100, days: 0 },
  { stage: 'Credit / KYC',  count: 4640, conv: 96,  days: 1 },
  { stage: 'Scheduled',     count: 4380, conv: 91,  days: 3 },
  { stage: 'Engineer dispatched', count: 4180, conv: 87, days: 7 },
  { stage: 'Installed',     count: 3960, conv: 82,  days: 10 },
  { stage: 'Active 30d',    count: 3812, conv: 79,  days: 40 },
  { stage: 'Active 90d',    count: 3680, conv: 76,  days: 100 },
]

const churn30d = [
  { wk: 'W1', rate: 4.6 },
  { wk: 'W2', rate: 4.4 },
  { wk: 'W3', rate: 4.1 },
  { wk: 'W4', rate: 3.8 },
  { wk: 'W5', rate: 3.6 },
  { wk: 'W6', rate: 3.4 },
]

const cancellationReasons = [
  { r: 'Cooling-off (14d)',     n: 142 },
  { r: 'Failed install',         n: 86 },
  { r: 'Wrong product sold',    n: 64 },
  { r: 'Credit / KYC fail',     n: 48 },
  { r: 'Buyer remorse',         n: 32 },
  { r: 'BTC / Rival ISP B counter',     n: 28 },
]

const renewalCalendar = [
  { mo: 'Jun', count: 4820, tcv: 8.4, atRisk: 380 },
  { mo: 'Jul', count: 5210, tcv: 9.2, atRisk: 420 },
  { mo: 'Aug', count: 5640, tcv: 10.1, atRisk: 510 },
  { mo: 'Sep', count: 4980, tcv: 8.8, atRisk: 460 },
  { mo: 'Oct', count: 5320, tcv: 9.4, atRisk: 480 },
  { mo: 'Nov', count: 4760, tcv: 8.4, atRisk: 410 },
]

const crossSell = [
  { audience: 'BB-only HHs eligible for Mobile (REVConnect)', size: 142_000, propensity: 14.2, incMRR: 184 },
  { audience: 'BB+TV HHs eligible for Sports add-on · Sports package',       size: 86_000,  propensity: 8.6,  incMRR: 92 },
  { audience: 'Mobile-only eligible for BB',             size: 38_000,  propensity: 6.4,  incMRR: 64 },
  { audience: '250 Mb HHs eligible for 500/1Gb upgrade', size: 124_000, propensity: 11.8, incMRR: 142 },
  { audience: 'B2B SoHo eligible for Hosted Voice',      size: 4_800,   propensity: 18.4, incMRR: 38 },
]

const compliance = [
  { metric: 'Mis-sold flag rate',         value: 0.6, suffix: '%', good: true,  delta: '-0.2 pp QoQ' },
  { metric: 'Complaints per 1K sales',    value: 8.4, suffix: '',  good: true,  delta: '-1.2 vs LM' },
  { metric: 'Cooling-off cancellations',  value: 142, suffix: '',  good: false, delta: '+8 vs LM' },
  { metric: 'DPA / consent capture',      value: 99.2, suffix: '%', good: true, delta: 'SLA 99%' },
  { metric: 'URCA complaints (open)',   value: 3,   suffix: '',  good: false, delta: '1 new this wk' },
]

const anomalies = [
  { sev: 'High',   when: '14:00', what: 'Freeport pipeline create −38% WoW · only 3 reps active', loss: 'forecast risk BSD 1.2M' },
  { sev: 'Medium', when: '11:20', what: 'Long Island win-rate −6 pp on REVConnect — competitor pricing pressure', loss: 'est. BSD 240K' },
  { sev: 'Low',    when: '08:45', what: 'Avg cycle on Mid-market deals +4 days', loss: 'monitor' },
]

const nbaPerRep = [
  { rep: 'Sofie Bethel',     action: 'Push OPP-8421 (Knowles Pharma) — multi-thread w/ COO',    impact: 'BSD 124K · close prob 62%→78%' },
  { rep: 'Daan Knowles',  action: 'Match BTC on OPP-8410 — BSD 15 BC + 6mo Sports add-on · Sports package',         impact: 'BSD 86K  · save deal' },
  { rep: 'Emma Knowles',    action: 'Re-qualify champion change on OPP-8398',                  impact: 'BSD 142K · re-engage' },
  { rep: 'Jonas O\'Brien',  action: 'Coaching: cycle time 26d (target 21) · live deal review', impact: 'attain +14 pp' },
  { rep: 'Lars Willems', action: 'Activity gap — call 8 cold leads from Cortex segment',   impact: '+4 SQLs / wk' },
]

const cortexPrompts = [
  { q: 'What\'s pulling Q forecast down?',                       sql: 'SELECT * FROM SALES_FORECAST_RISK WHERE q = CURRENT_QUARTER' },
  { q: 'Generate close plan for OPP-8421 (Knowles Pharma)',         sql: 'CALL gen_close_plan(opp_id=>\'OPP-8421\')' },
  { q: 'Reps below quota with low activity — coaching list',      sql: 'SELECT rep, attain, activity_idx FROM REP_SCORECARD WHERE attain < 80 AND activity_idx < 75' },
  { q: 'Cross-sell: BB-only HHs with high REVConnect propensity',       sql: 'SELECT * FROM CROSS_SELL_RADAR WHERE product = \'VOLT\' AND propensity > 0.15' },
  { q: 'Top 10 deals at risk this week (single-thread, no activity)', sql: 'SELECT * FROM DEALS_AT_RISK ORDER BY risk_score DESC LIMIT 10' },
  { q: 'Forecast Q-end landing if win-rate holds 32%',            sql: 'SELECT * FROM FORECAST_LANDING(win_rate=>0.32)' },
]

const SEG_KEYS = ['All', 'Consumer', 'B2B SoHo', 'Mid-market', 'Enterprise', 'Public sector'] as const
type SegFilter = typeof SEG_KEYS[number]
type SegKey = Exclude<SegFilter, 'All'>

const regionGeo: { r: string; lat: number; lng: number; segs: Record<SegKey, number> }[] = [
  { r: 'Nassau',      lat: 25.0443, lng: -77.3504, segs: { Consumer: 5.20, 'B2B SoHo': 1.60, 'Mid-market': 1.00, Enterprise: 0.40, 'Public sector': 0.20 } },
  { r: 'Freeport',        lat: 26.5333, lng: -78.7, segs: { Consumer: 2.40, 'B2B SoHo': 0.90, 'Mid-market': 0.50, Enterprise: 0.20, 'Public sector': 0.10 } },
  { r: 'Abaco',       lat: 26.5412, lng: -77.0636, segs: { Consumer: 1.40, 'B2B SoHo': 0.50, 'Mid-market': 0.30, Enterprise: 0.12, 'Public sector': 0.08 } },
  { r: 'Eleuthera',       lat: 25.1962, lng: -76.2431, segs: { Consumer: 1.10, 'B2B SoHo': 0.40, 'Mid-market': 0.24, Enterprise: 0.10, 'Public sector': 0.06 } },
  { r: 'Exuma',      lat: 23.5, lng: -75.7667, segs: { Consumer: 0.80, 'B2B SoHo': 0.30, 'Mid-market': 0.18, Enterprise: 0.08, 'Public sector': 0.04 } },
  { r: 'Bimini',     lat: 25.727, lng: -79.2972, segs: { Consumer: 0.60, 'B2B SoHo': 0.20, 'Mid-market': 0.12, Enterprise: 0.05, 'Public sector': 0.03 } },
  { r: 'Andros',     lat: 24.7064, lng: -77.7902, segs: { Consumer: 0.55, 'B2B SoHo': 0.18, 'Mid-market': 0.10, Enterprise: 0.04, 'Public sector': 0.03 } },
  { r: 'San Salvador', lat: 24.036, lng: -74.494, segs: { Consumer: 0.50, 'B2B SoHo': 0.16, 'Mid-market': 0.08, Enterprise: 0.04, 'Public sector': 0.02 } },
  { r: 'Long Island',        lat: 23.25, lng: -75.1, segs: { Consumer: 1.00, 'B2B SoHo': 0.40, 'Mid-market': 0.20, Enterprise: 0.08, 'Public sector': 0.02 } },
  { r: 'Inagua',         lat: 20.95, lng: -73.6731, segs: { Consumer: 0.42, 'B2B SoHo': 0.14, 'Mid-market': 0.06, Enterprise: 0.02, 'Public sector': 0.02 } },
  { r: 'Cat Island',         lat: 24.315, lng: -75.453, segs: { Consumer: 0.38, 'B2B SoHo': 0.12, 'Mid-market': 0.05, Enterprise: 0.02, 'Public sector': 0.02 } },
  { r: 'Rum Cay',        lat: 23.685, lng: -74.868, segs: { Consumer: 0.32, 'B2B SoHo': 0.10, 'Mid-market': 0.04, Enterprise: 0.02, 'Public sector': 0.02 } },
]

// ───────── forecast & coverage data ─────────
const forecastScenarios = [
  { scenario: 'Base',   q: 27.2, grow: 3.1,  prob: 72 },
  { scenario: 'Upside', q: 29.4, grow: 5.0,  prob: 28 },
  { scenario: 'Risk',   q: 24.8, grow: -1.1, prob: 18 },
]

const coverageTrend = [
  { wk: 'W-8', cov: 2.4 }, { wk: 'W-7', cov: 2.6 }, { wk: 'W-6', cov: 2.8 },
  { wk: 'W-5', cov: 3.0 }, { wk: 'W-4', cov: 3.1 }, { wk: 'W-3', cov: 3.2 },
  { wk: 'W-2', cov: 3.4 }, { wk: 'W-1', cov: 3.4 },
]

const aiLiftBySegment = [
  { seg: 'Consumer',   base: 12.4, aiLift: 1.8 },
  { seg: 'B2B SoHo',   base: 4.2,  aiLift: 0.6 },
  { seg: 'Mid-market', base: 3.8,  aiLift: 0.5 },
  { seg: 'Enterprise', base: 1.6,  aiLift: 0.3 },
  { seg: 'Public',     base: 0.6,  aiLift: 0.1 },
]

const coverageZones = [
  { zone: 'In-quota (≥3×)',       deals: 248, value: 9.2, winRate: 38 },
  { zone: 'Under-covered (2–3×)', deals: 148, value: 5.4, winRate: 32 },
  { zone: 'At-risk (<2×)',          deals: 42,  value: 1.8, winRate: 24 },
]

const forecastAccuracy: { wk: string; forecast: number; actual: number | null }[] = [
  { wk: 'W-6', forecast: 25.8, actual: 26.1 },
  { wk: 'W-5', forecast: 26.2, actual: 25.8 },
  { wk: 'W-4', forecast: 26.8, actual: 27.2 },
  { wk: 'W-3', forecast: 27.0, actual: 26.9 },
  { wk: 'W-2', forecast: 27.1, actual: null },
  { wk: 'W-1', forecast: 27.2, actual: null },
]

// ───────── win/loss extended data ─────────
const winLossByQuarter = [
  { q: 'Q1 24', won: 184, lost: 312, rate: 37.1 },
  { q: 'Q2 24', won: 196, lost: 326, rate: 37.5 },
  { q: 'Q3 24', won: 208, lost: 332, rate: 38.5 },
  { q: 'Q4 24', won: 224, lost: 352, rate: 38.9 },
  { q: 'Q1 25', won: 218, lost: 348, rate: 38.5 },
  { q: 'Q2 25', won: 230, lost: 356, rate: 39.2 },
]

const lostByCompetitor = [
  { competitor: 'BTC', price: 62, network: 18, bundle: 12, service: 8 },
  { competitor: 'Rival ISP B',     price: 54, network: 22, bundle: 8,  service: 16 },
  { competitor: 'Rival ISP C',    price: 48, network: 28, bundle: 14, service: 10 },
  { competitor: 'Rival ISP B', price: 58, network: 20, bundle: 12, service: 10 },
]

const dealSizeWinRate = [
  { range: '<BSD 500',    wr: 42, deals: 1820 },
  { range: 'BSD 500–1K',  wr: 38, deals: 1240 },
  { range: 'BSD 1K–2K',   wr: 34, deals: 680 },
  { range: 'BSD 2K–5K',   wr: 28, deals: 320 },
  { range: 'BSD 5K–10K',  wr: 22, deals: 148 },
  { range: '>BSD 10K',    wr: 16, deals: 42 },
]

const winLossByProduct = [
  { product: 'BB only',           won: 580, lost: 820, wr: 41 },
  { product: 'REVConnect (BB+Mobile)',  won: 442, lost: 610, wr: 42 },
  { product: 'BB + TV',           won: 298, lost: 480, wr: 38 },
  { product: 'Mega bundle',       won: 180, lost: 380, wr: 32 },
  { product: 'Mobile only',       won: 124, lost: 290, wr: 30 },
  { product: 'B2B Fibre',         won: 62,  lost: 124, wr: 33 },
]

// ───────── tabs ─────────
type TabId = 'performance' | 'pipeline' | 'mix' | 'reps' | 'orders' | 'ai' | 'forecast' | 'winloss'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'performance', label: 'Performance',          icon: Activity },
  { id: 'pipeline',    label: 'Pipeline',             icon: GitBranch },
  { id: 'mix',         label: 'Mix & Channels',       icon: Briefcase },
  { id: 'reps',        label: 'Reps & Coaching',      icon: Trophy },
  { id: 'orders',      label: 'Orders & Lifecycle',   icon: ShoppingCart },
  { id: 'ai',          label: 'AI Actions',           icon: Sparkles },
  { id: 'forecast',    label: 'Forecast & Coverage',  icon: TrendingUp },
  { id: 'winloss',     label: 'Win / Loss',           icon: Target },
]

const sevColor = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const tierPill = (t: string) => t === 'Strategic' ? 'bg-vfes-red text-vfes-dark' : t === 'Public' ? 'bg-violet-600 text-vfes-dark' : 'bg-amber-500 text-vfes-dark'
const rampPill = (r: string) => r.startsWith('On') ? 'bg-emerald-100 text-emerald-700' : r === 'Coaching' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'

export default function SalesPage() {
  const [tab, setTab] = useState<TabId>('performance')
  const [segFilter, setSegFilter] = useState<SegFilter>('All')

  const geoFiltered = useMemo(() => {
    const rows = regionGeo.map((g) => {
      const value = segFilter === 'All'
        ? Object.values(g.segs).reduce((s, v) => s + v, 0)
        : g.segs[segFilter as SegKey]
      return { ...g, value }
    })
    const sorted = [...rows].sort((a, b) => b.value - a.value)
    const top3 = new Set(sorted.slice(0, 3).map(r => r.r))
    const bot3 = new Set(sorted.slice(-3).map(r => r.r))
    const max = Math.max(...rows.map(r => r.value), 0.01)
    return { rows, sorted, top3, bot3, max }
  }, [segFilter])

  const salesMarkers: MapMarker[] = useMemo(() => geoFiltered.rows.map((g) => {
    const isTop = geoFiltered.top3.has(g.r)
    const isBot = geoFiltered.bot3.has(g.r)
    const color = isTop ? '#10b981' : isBot ? '#ef4444' : '#FF4438'
    const radius = 6 + (g.value / geoFiltered.max) * 22
    return {
      name: g.r,
      lat: g.lat,
      lng: g.lng,
      radius,
      color,
      pulse: isTop,
      tooltip: `${g.r} · BSD ${g.value.toFixed(2)}M ${segFilter === 'All' ? 'total' : segFilter}`,
    }
  }), [geoFiltered, segFilter])

  const totalBookings = useMemo(() => segments.reduce((s, x) => s + x.bookings, 0), [])
  const totalLost = winLossReasons.reduce((s, x) => s + x.lost, 0)
  const totalWon = winLossReasons.reduce((s, x) => s + x.won, 0)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Sales')}
        subtitle={tt('Forecast · pipeline · territory · reps · order-to-cash · Cortex AI')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · CRM sync 5 min
            </span>
          </div>
        }
      />

      <a href="#/portal/mnp" className="flex items-center gap-2 mb-6 text-xs font-bold text-vfes-dark bg-vfes-red/5 border border-vfes-red/20 rounded-lg px-3 py-2 w-fit hover:bg-vfes-red/10">
        {tt('Win-back & port-in opportunities → open MNP Flow & Save Desk')} →
      </a>

      <AgentDecision
        title={tt('Triage pipeline by win-probability × value')}
        label="Run Pipeline Triage"
        runningLabel="Triaging…"
        steps={[
          'Scored open pipeline by win-probability',
          'Ranked by expected value (prob × deal size)',
          'Flagged stalled high-value deals for intervention',
          'Pushed prioritised list to reps & managers',
        ]}
        hint={tt('Reps work expected-value order — highest-yield deals first.')}
        result={{
          headline: 'Focus reps on high-value, stalling deals this week',
          stats: [
            { label: 'Bookings QTD', value: `BSD ${headline.bookingsQTD.toFixed(1)}M` },
            { label: 'Win rate', value: `${headline.winRate}%` },
            { label: 'Pipeline coverage', value: `${headline.pipelineCov}×` },
            { label: 'Gap to plan', value: `BSD ${headline.gapToPlan.toFixed(1)}M` },
          ],
          findings: [
            'A cluster of high-value deals has slipped past expected stage-velocity.',
            'Targeted manager intervention on these protects the quarter\'s forecast.',
          ],
          note: 'Don\'t neglect mid-funnel volume.',
        }}
        impact="+forecast attainment · faster cycle"
        risk="don't neglect mid-funnel volume"
        linkTo="#/portal/base-management"
        linkLabel="Open Base Management"
      />

      {/* live alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Forecast risk · Q ending in 18 days')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Commit + best case <span className="font-bold">{tt('BSD 27.2M')}</span> vs quota <span className="font-bold">{tt('BSD 28.0M')}</span> ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('gap −BSD 0.8M')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('3 high-risk deals · BSD 580K')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('recommend pull-in playbook')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open AI Actions →')}</button>
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

      {/* ── related cockpits ── */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <span className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold self-center mr-1">{tt('Related')}:</span>
        <Link to="/portal/marketing" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Marketing')}</Link>
        <Link to="/portal/digital-funnel" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Digital Funnel')}</Link>
        <Link to="/portal/churn-retention" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Churn & Retention')}</Link>
        <Link to="/portal/channel-dealers" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Channels & Dealers')}</Link>
        <Link to="/portal/customer-360" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Customer 360')}</Link>
        <Link to="/portal/b2b" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('B2B')}</Link>
        <Link to="/portal/company-360" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Company 360')}</Link>
        <Link to="/portal/pricing-simulator" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Pricing Simulator')}</Link>
        <Link to="/portal/bundle-profitability" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Bundle Profitability')}</Link>
        <Link to="/portal/promotions" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Promotions')}</Link>
        <Link to="/portal/ai-insights" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('AI Insights')}</Link>
        <Link to="/portal/base-management" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Base Management')}</Link>
      </div>

      {/* ═══════ PERFORMANCE ═══════ */}
      {tab === 'performance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Bookings QTD')}     value={`BSD ${headline.bookingsQTD.toFixed(1)}M`} delta={`vs BSD ${headline.quotaQ}M quota`} trend="up" icon={DollarSign} accent />
          <KpiCard label={tt('Attainment')}        value={`${headline.attainPct}%`}                delta={`forecast BSD ${headline.forecastQ}M`}      trend="down" icon={Target} />
          <KpiCard label={tt('Pipeline coverage')} value={`${headline.pipelineCov}×`}              delta="target ≥3×"     trend="up"   icon={GitBranch} />
          <KpiCard label={tt('Gap to plan')}        value={`BSD ${headline.gapToPlan.toFixed(1)}M`}    delta="3 deals can close gap" trend="down" icon={AlertTriangle} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('New connections')}   value={headline.newConnectsMTD.toLocaleString()} delta="+11.2% MoM" trend="up"   icon={Users} />
          <KpiCard label={tt('Win rate')}          value={`${headline.winRate}%`}                  delta="+1.8 pp"    trend="up"   icon={Trophy} />
          <KpiCard label={tt('Avg deal size')}     value={`BSD ${headline.avgDeal.toLocaleString()}`} delta="+BSD 60"       trend="up"   icon={Coins} />
          <KpiCard label={tt('Avg cycle')}         value={`${headline.cycleDays} d`}               delta="-2 d vs LM" trend="up"   icon={Clock} />
        </div>

        {/* Sales split by lane — Fixed-only · Mobile-only · Convergent */}
        <Panel title={tt('Orders by lane — Fixed · Mobile · Convergent')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Mobile leads volume · Convergent leads value')}</span>}>
          <div className="grid md:grid-cols-3 gap-4">
            {SALES_BY_LANE.map((l) => {
              const mix = CUSTOMER_MIX_BY_LANE.find((m) => m.lane === l.lane)
              return (
                <div key={l.lane} className="rounded-lg border border-black/5 p-4 bg-[#fafbfc]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: l.color }}>{tt(l.lane)}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold">{l.orders.toFixed(1)}K</span>
                    <span className="text-xs text-vfes-dark/55">{tt('orders')}</span>
                  </div>
                  <div className="text-[11px] text-vfes-dark/55 mb-3">BSD {l.revenue.toFixed(1)}M {tt('revenue')} · {l.margin}% {tt('margin')}</div>
                  {mix && (
                    <div className="text-[11px] flex justify-between text-vfes-dark/65">
                      <span>{tt('Base')}: {(mix.count / 1e6).toFixed(2)}M</span>
                      <span>ARPU BSD {mix.arpu.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Mobile-only orders dominate volume (62% of weekly orders) but Convergent contributes 45% of revenue at the highest margin — incentivise sales reps on Convergent attach over standalone mobile.')}</div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Forecast vs Quota · 12 wk')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={quotaByWk}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'BSD M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="actual" name={tt('Actual')} fill={RED} />
                    <Line type="monotone" dataKey="commit" name={tt('Commit forecast')} stroke={RED3} strokeWidth={2} dot />
                    <Line type="monotone" dataKey="plan" name={tt('Plan')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Forecast Waterfall')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={forecastWaterfall} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="k" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v" name={tt('BSD M')}>
                    {forecastWaterfall.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">Total Q forecast <span className="font-bold text-vfes-dark">{tt('BSD 27.2M')}</span>{tt('· risk-adj −BSD 1.4M')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Bookings by Segment')}>
            <div className="space-y-2">
              {segments.map((s) => (
                <div key={tt(s.name)} className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                  <div className="w-28 font-semibold">{tt(s.name)}</div>
                  <div className="flex-1 h-6 bg-black/5 rounded">
                    <div className="h-full rounded flex items-center justify-end pr-2 text-[10px] text-white font-bold" style={{ width: `${(s.bookings / totalBookings) * 100}%`, background: s.color }}>
                      BSD {s.bookings.toFixed(1)}M
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs">{s.deals.toLocaleString()} deals</div>
                  <div className="w-14 text-right text-[10px] text-vfes-dark/55">{s.margin}% GM</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Bookings by Region · Penetration')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={regions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="r" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="bookings" name={tt('Bookings (BSD M)')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="pen" name={tt('Penetration %')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ PIPELINE ═══════ */}
      {tab === 'pipeline' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Pipeline value')}  value="BSD 38.4M" delta="+BSD 2.1M"     trend="up"   icon={Coins} accent />
          <KpiCard label={tt('Coverage ratio')}  value="3.4×"   delta="target ≥3×" trend="up"   icon={Target} />
          <KpiCard label={tt('Stage velocity')}  value="21 d"   delta="-2 d vs LM" trend="up"   icon={Zap} />
          <KpiCard label={tt('Slipped this wk')} value="BSD 0.6M"  delta="14 deals"   trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Pipeline by Stage · Count · BSD ')}>
          <div className="space-y-3">
            {stages.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-4 text-sm">
                <div className="w-32 font-semibold">{s.stage}</div>
                <div className="flex-1 h-9 bg-[#f3f4f7] rounded-lg overflow-hidden border border-black/5">
                  <div className="h-full bg-gradient-to-r from-vfes-red-dark via-vfes-red to-vfes-red-light flex items-center justify-end pr-3 text-xs font-bold text-vfes-dark" style={{ width: `${s.conv}%`, opacity: 1 - i * 0.08 }}>
                    {s.count.toLocaleString()} · BSD {s.value.toFixed(1)}M
                  </div>
                </div>
                <div className="w-12 text-right text-xs text-vfes-dark/65">{s.conv}%</div>
                <div className="w-14 text-right text-[10px] text-vfes-dark/55">{s.days}d avg</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <Panel title={tt('Stage Velocity (days)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={stageVelocity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="days" name={tt('Actual')} fill={RED} />
                  <Bar dataKey="target" name={tt('Target')} fill={RED4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Pipeline Create vs Burn')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={pipelineFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="created" name={tt('Created')} fill={RED4} />
                    <Bar dataKey="won" name={tt('Won')} stackId="b" fill="#10b981" />
                    <Bar dataKey="lost" name={tt('Lost')} stackId="b" fill="#ef4444" />
                    <Bar dataKey="slipped" name={tt('Slipped')} stackId="b" fill="#f59e0b" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Win / Loss Reasons')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={winLossReasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="r" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="won" name={tt('Won %')} fill="#10b981" />
                  <Bar dataKey="lost" name={tt('Lost %')} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">Net win-loss balance: won {totalWon} / lost {totalLost} · biggest loss driver <span className="font-bold text-red-600">{tt('Price')}</span></div>
          </Panel>

          <Panel title={tt('Competitive Losses · By Competitor')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Competitor')}</th>
                    <th className="text-right">{tt('Deals lost')}</th>
                    <th className="text-right">{tt('Share of losses')}</th>
                    <th className="text-right">{tt('Avg discount they offered')}</th>
                  </tr>
                </thead>
                <tbody>
                  {competitiveLosses.map((c) => (
                    <tr key={c.c} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{c.c}</td>
                      <td className="text-right font-bold">{c.deals}</td>
                      <td className="text-right">{c.share}%</td>
                      <td className="text-right text-vfes-dark font-bold">−{c.depth}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Deals at Risk · Top 6')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Opp')}</th>
                  <th>{tt('Account')}</th>
                  <th>{tt('Stage')}</th>
                  <th className="text-right">{tt('Value')}</th>
                  <th className="text-right">{tt('Age')}</th>
                  <th>{tt('Owner')}</th>
                  <th>{tt('Risk')}</th>
                  <th>{tt('Reason')}</th>
                </tr>
              </thead>
              <tbody>
                {dealsAtRisk.map((d, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-[10px] text-vfes-dark/65">{d.id}</td>
                    <td className="font-semibold text-xs">{d.acc}</td>
                    <td className="text-xs">{d.stage}</td>
                    <td className="text-right font-bold">BSD {d.value}K</td>
                    <td className={`text-right text-xs ${d.age > 28 ? 'text-red-600 font-bold' : ''}`}>{d.age}d</td>
                    <td className="text-xs">{tt(d.owner)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(d.risk)}`}>{d.risk}</span></td>
                    <td className="text-xs text-vfes-dark/65">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ MIX & CHANNELS ═══════ */}
      {tab === 'mix' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('ASP (avg deal)')}   value={`BSD ${headline.avgDeal.toLocaleString()}`} delta="+BSD 60"        trend="up"   icon={Coins} accent />
          <KpiCard label={tt('ARPU on new')}      value={`BSD ${headline.arpuNew}`}                  delta="+BSD 3 vs LM"    trend="up"   icon={DollarSign} />
          <KpiCard label={tt('Bundle attach')}    value="64%"                                     delta="+4 pp QoQ"    trend="up"   icon={Sparkles} />
          <KpiCard label={tt('Switcher share')}   value="23%"                                     delta="+2 pp"        trend="up"   icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Product Mix')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={productMix} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {productMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('New vs Existing')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={newVsExisting} dataKey="value" nameKey="k" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {newVsExisting.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-vfes-dark/55 mt-1">Net new logo <span className="text-vfes-dark font-bold">58%</span></div>
          </Panel>

          <Panel title={tt('Channel Performance')}>
            <div className="space-y-2">
              {channelMix.map((c) => (
                <div key={c.ch} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="w-24 font-semibold text-xs">{c.ch}</div>
                  <div className="flex-1 h-5 bg-black/5 rounded">
                    <div className="h-full bg-vfes-red rounded" style={{ width: `${c.share * 2}%` }} />
                  </div>
                  <div className="w-14 text-right text-xs"><span className="font-bold">{c.gross.toLocaleString()}</span></div>
                  <div className="w-14 text-right text-[10px] text-vfes-dark/55">BSD {c.cpga} CPGA</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Top Strategic Accounts · B2B')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Account')}</th>
                  <th>{tt('Tier')}</th>
                  <th className="text-right">{tt('TCV')}</th>
                  <th className="text-right">{tt('Services')}</th>
                  <th className="text-right">{tt('Expansion pipeline')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((a) => (
                  <tr key={a.acc} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{a.acc}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${tierPill(a.tier)}`}>{a.tier}</span></td>
                    <td className="text-right font-bold">BSD {a.tcv}M</td>
                    <td className="text-right">{a.services}</td>
                    <td className="text-right text-vfes-dark font-bold">BSD {a.expansion}M</td>
                    <td className="text-xs text-vfes-dark/65">{tt(a.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel
            title={tt('Sales Geography · Carto')}
            action={
              <div className="flex flex-wrap gap-1">
                {SEG_KEYS.map((s) => (
                  <button key={s} onClick={() => setSegFilter(s)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${segFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                    {s}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CartoMap markers={salesMarkers} basemap="voyager" height={460} center={[24.7, -76.5]} zoom={6} />
                <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{tt('Top 3 (pulsing)')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-vfes-red" />{tt('Mid')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{tt('Bottom 3')}</span>
                  <span className="ml-auto">Bubble size = revenue · filter: <span className="font-bold text-vfes-dark">{segFilter}</span></span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">{tt('Top performers')}</div>
                  {geoFiltered.sorted.slice(0, 3).map((g, i) => (
                    <div key={g.r} className="flex items-center gap-2 py-1.5 border-b border-black/5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white grid place-items-center text-[10px] font-black">{i + 1}</div>
                      <div className="flex-1 font-semibold">{g.r}</div>
                      <div className="font-bold text-emerald-600">BSD {g.value.toFixed(2)}M</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-red-600 font-bold mb-1">{tt('Underperforming')}</div>
                  {geoFiltered.sorted.slice(-3).reverse().map((g, i) => (
                    <div key={g.r} className="flex items-center gap-2 py-1.5 border-b border-black/5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white grid place-items-center text-[10px] font-black">{i + 1}</div>
                      <div className="flex-1 font-semibold">{g.r}</div>
                      <div className="font-bold text-red-600">BSD {g.value.toFixed(2)}M</div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-1">Total · {segFilter}</div>
                  <div className="text-2xl font-extrabold text-vfes-dark">BSD {geoFiltered.rows.reduce((s, r) => s + r.value, 0).toFixed(2)}M</div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">across {geoFiltered.rows.length} regions</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Cross-sell Radar · Eligible Audience × Propensity')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Audience')}</th>
                    <th className="text-right">{tt('Size')}</th>
                    <th className="text-right">{tt('Propensity')}</th>
                    <th className="text-right">{tt('Inc MRR if 100% activated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {crossSell.map((c) => (
                    <tr key={c.audience} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{c.audience}</td>
                      <td className="text-right">{c.size.toLocaleString()}</td>
                      <td className="text-right font-bold text-vfes-dark">{c.propensity}%</td>
                      <td className="text-right font-bold text-emerald-600">BSD {c.incMRR}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ REPS & COACHING ═══════ */}
      {tab === 'reps' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Reps at quota')}     value="3 / 8"   delta="38%"            trend="down" icon={Trophy} accent />
          <KpiCard label={tt('Avg attainment')}    value="74%"     delta="+4 pp QoQ"      trend="up"   icon={Target} />
          <KpiCard label={tt('Avg activity idx')}  value="75"      delta="2 reps <70"     trend="flat" icon={Phone} />
          <KpiCard label={tt('Avg ramp (M1→M6)')}  value="4.2 mo"  delta="-0.4 mo"        trend="up"   icon={Award} />
        </div>

        <Panel title={tt('Rep Scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Rep')}</th>
                  <th>{tt('Region')}</th>
                  <th className="text-right">{tt('Deals')}</th>
                  <th className="text-right">{tt('Revenue')}</th>
                  <th className="text-right">{tt('Attainment')}</th>
                  <th className="text-right">{tt('Win rate')}</th>
                  <th className="text-right">{tt('ASP')}</th>
                  <th className="text-right">{tt('Cycle')}</th>
                  <th className="text-right">{tt('Activity')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((r, i) => (
                  <tr key={tt(r.name)} className="border-t border-black/5">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-black ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-black/5 text-vfes-dark/60'}`}>{i + 1}</div>
                        <span className="font-semibold">{tt(r.name)}</span>
                      </div>
                    </td>
                    <td className="text-xs text-vfes-dark/65">{r.region}</td>
                    <td className="text-right">{r.deals}</td>
                    <td className="text-right font-bold">BSD {r.revenue}K</td>
                    <td className={`text-right font-bold ${r.attain >= 100 ? 'text-emerald-600' : r.attain >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{r.attain}%</td>
                    <td className="text-right">{r.winRate}%</td>
                    <td className="text-right">BSD {r.asp.toLocaleString()}</td>
                    <td className="text-right text-xs">{r.cycle}d</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-black/5 rounded">
                          <div className="h-full bg-vfes-red rounded" style={{ width: `${r.activity}%` }} />
                        </div>
                        <span className="text-[10px]">{r.activity}</span>
                      </div>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${rampPill(r.ramp)}`}>{r.ramp}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mb-6 mt-6">
          <Panel title={tt('Activity · Leading Indicators')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={repActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="calls" stackId="a" name={tt('Calls')} fill={RED4} />
                  <Bar dataKey="demos" stackId="a" name={tt('Demos')} fill={RED2} />
                  <Bar dataKey="props" stackId="a" name={tt('Proposals')} fill={RED} />
                  <Bar dataKey="followups" stackId="a" name={tt('Follow-ups')} fill={RED5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Coaching Queue · Auto-flagged')}>
            <div className="space-y-2">
              {reps.filter(r => r.attain < 80).map((r) => (
                <div key={tt(r.name)} className="border border-black/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{tt(r.name)} · <span className="font-normal text-xs text-vfes-dark/65">{r.region}</span></div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${rampPill(r.ramp)}`}>{r.ramp}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-vfes-dark/65">
                    <span>Attain <span className="font-bold text-red-600">{r.attain}%</span></span>
                    <span>Cycle <span className="font-bold">{r.cycle}d</span></span>
                    <span>Activity <span className="font-bold">{r.activity}</span></span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-vfes-dark font-semibold">{tt('→ live deal review · cycle-time playbook')}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Comp & SPIF Run-rate · This Quarter')}>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Base salary')}</div>
              <div className="text-2xl font-extrabold mt-1">{tt('BSD 420K')}</div>
              <div className="text-xs text-vfes-dark/55 mt-1">{tt('8 reps · paid')}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Commission accrual')}</div>
              <div className="text-2xl font-extrabold mt-1 text-vfes-dark">{tt('BSD 286K')}</div>
              <div className="text-xs text-emerald-600 mt-1">{tt('+8% vs plan')}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('SPIF this Q')}</div>
              <div className="text-2xl font-extrabold mt-1">{tt('BSD 48K')}</div>
              <div className="text-xs text-vfes-dark/55 mt-1">{tt('REVConnect push · BSD 1K/sale')}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Cost of sales / BSD 1 booking')}</div>
              <div className="text-2xl font-extrabold mt-1">BSD 0.034</div>
              <div className="text-xs text-emerald-600 mt-1">{tt('target ≤BSD 0.04')}</div>
            </div>
          </div>
        </Panel>
      </>)}

      {/* ═══════ ORDERS & LIFECYCLE ═══════ */}
      {tab === 'orders' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Order → Install')}      value="82%"   delta="+2 pp"        trend="up"   icon={Activity} accent />
          <KpiCard label={tt('Avg time to activate')} value="10 d"  delta="-1 d vs LM"   trend="up"   icon={Calendar} />
          <KpiCard label={tt('30-day churn')}          value="3.4%"  delta="-1.2 pp QoQ"  trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('Cancellations (cool-off)')} value="142" delta="+8 vs LM"   trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Order → Cash Funnel')}>
          <div className="space-y-2">
            {orderToCash.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-3 text-sm">
                <div className="w-44 font-semibold">{f.stage}</div>
                <div className="flex-1 h-9 bg-[#f3f4f7] rounded-lg overflow-hidden border border-black/5">
                  <div className="h-full bg-gradient-to-r from-vfes-red-dark via-vfes-red to-vfes-red-light flex items-center justify-end pr-3 text-xs font-bold text-vfes-dark" style={{ width: `${f.conv}%`, opacity: 1 - i * 0.07 }}>
                    {f.count.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 text-right text-xs text-vfes-dark/65">{f.conv}%</div>
                <div className="w-14 text-right text-[10px] text-vfes-dark/55">{f.days}d</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Biggest leak: <span className="text-vfes-dark font-bold">{tt('Engineer dispatched → Installed (5%)')}</span></div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <Panel title={tt('30-day Churn Trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={churn30d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="rate" stroke={RED} fill={RED} fillOpacity={0.3} />
                  <ReferenceLine y={4} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Target', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Cancellation Reasons · This Month')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={cancellationReasons} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="r" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="n" fill={RED} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Renewal Calendar · Next 6 Mo')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={renewalCalendar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="count" name={tt('Contracts ending')} fill={RED4} />
                  <Bar yAxisId="l" dataKey="atRisk" name={tt('At risk')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="tcv" name={tt('TCV (BSD M)')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Compliance & Sales Quality')}>
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
      </>)}

      {/* ═══════ AI ACTIONS ═══════ */}
      {tab === 'ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live anomalies')}       value="3"     delta="1 high-sev"    trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('NBA recommended')}      value="5"     delta="for 5 reps"    trend="up"   icon={Sparkles} />
          <KpiCard label={tt('Forecast lift if approved')} value="+BSD 640K" delta="this Q"  trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('Cortex queries this wk')} value="318" delta="+18% vs LW"    trend="up"   icon={Send} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Anomaly Queue · Cortex AI')}>
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm border-b border-black/5 pb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor(a.sev)} shrink-0`}>{a.sev}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-xs">{a.what}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5">{a.when} · est. impact <span className="font-bold text-vfes-dark">{a.loss}</span></div>
                  </div>
                  <button className="text-[10px] font-bold text-vfes-dark hover:underline shrink-0">{tt('Open →')}</button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Next Best Action · Per Rep')}>
            <div className="space-y-2">
              {nbaPerRep.map((n, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm">{n.rep}</div>
                    <button className="text-[10px] font-bold text-vfes-dark bg-vfes-red px-2 py-1 rounded hover:bg-vfes-red-dark">{tt('Send to rep')}</button>
                  </div>
                  <div className="text-xs">{tt(n.action)}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">{n.impact}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · Sales Prompts')}>
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
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('SALES_360')}</span></div>
            </Panel>
          </div>
          <Panel title={tt('Model Card · Forecast & Deal Risk')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Forecast model')}</span><span className="font-mono text-xs">{tt('SALES_FCST_V2_8')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Last refresh')}</span><span className="font-bold">{tt('06:00 UTC')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('MAPE (Q-end)')}</span><span className="font-bold text-emerald-600">4.8%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Deal-risk AUC')}</span><span className="font-bold">0.84</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('NBA model')}</span><span className="font-mono text-xs">{tt('NEXT_BEST_ACTION')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('Sales Ops')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Governance')}</span><span className="font-bold text-emerald-600">{tt('Approved')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Snowflake ML Registry · Cortex Agent enabled')}</div>
          </Panel>
        </div>

        <MlInsightSection
          heading="Sales forecast"
          models={[
            { name: 'Deal risk model',  metric: '0.84 AUC',     sub: 'Predicts deal slip 7 days ahead' },
            { name: 'Forecast model',   metric: '4.8% MAPE',    sub: 'Q-end revenue projection' },
            { name: 'Win-probability',  metric: '82% accuracy', sub: 'Score at each stage gate' },
          ]}
          agentLabel="Run Forecast Triage"
          agentSteps={[
            'Scored all open deals for slip risk',
            'Ranked by expected value × close probability',
            'Pushed top 5 interventions to reps',
            'Updated Q-end forecast range',
          ]}
          agentBlurb="Forecast agent uses Cortex ML Registry models refreshed at 06:00 UTC."
          decision={{
            title: 'Protect 3 high-value deals to close the BSD 0.8M gap',
            detail: 'Multi-threaded engagement on OPP-8421, OPP-8410, OPP-8398 closes gap with 68% probability.',
            impact: '+BSD 0.8M vs base case',
            risk: 'champion change on OPP-8398 — re-qualify first',
            linkTo: '/portal/ai-insights',
            linkLabel: 'Open AI Insights',
          }}
          chart={{
            kind: 'bar',
            title: 'Q Forecast by Scenario',
            data: forecastScenarios,
            xKey: 'scenario',
            series: [{ key: 'q', name: 'Q Forecast (BSD M)', color: '#FF4438' }],
            note: 'Base case: BSD 27.2M · Upside with deal recovery: BSD 29.4M',
          }}
        />
      </>)}

      {/* ═══════ FORECAST & COVERAGE ═══════ */}
      {tab === 'forecast' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Q Forecast (commit)')} value="BSD 27.2M" delta="vs BSD 28.0M quota" trend="down" icon={TrendingUp} accent />
          <KpiCard label={tt('Pipeline coverage')}   value="3.4×"   delta="+0.2× vs LW"    trend="up"   icon={GitBranch} />
          <KpiCard label={tt('Forecast accuracy')}   value="96.8%"  delta="vs 95% target"  trend="up"   icon={Target} />
          <KpiCard label={tt('AI lift (vs manual)')} value="+BSD 3.3M" delta="vs base case"   trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Forecast Accuracy · Weekly Tracking')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={forecastAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'BSD M', angle: -90, position: 'insideLeft', fontSize: 11 }} domain={[24, 30]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="forecast" name={tt('Forecast')} stroke={RED} strokeWidth={2} dot />
                    <Line type="monotone" dataKey="actual" name={tt('Actual')} stroke="#10b981" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Pipeline Coverage Trend · 8 wk')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={coverageTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="×" domain={[2, 4]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="cov" name={tt('Coverage')} stroke={RED} fill={RED} fillOpacity={0.3} />
                  <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: '3× target', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AI Lift by Segment vs Base Forecast')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={aiLiftBySegment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="seg" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="base" name={tt('Base (BSD M)')} fill={RED4} stackId="a" />
                  <Bar dataKey="aiLift" name={tt('AI Lift (BSD M)')} fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Pipeline Coverage Zones')}>
            <div className="space-y-4 mt-2">
              {coverageZones.map((z) => (
                <div key={z.zone} className="border border-black/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">{tt(z.zone)}</div>
                    <div className="text-xs text-vfes-dark/55">{z.deals} {tt('deals')}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div><span className="text-vfes-dark/55 text-xs">{tt('Value')}</span> <span className="font-bold">BSD {z.value}M</span></div>
                    <div><span className="text-vfes-dark/55 text-xs">{tt('Win rate')}</span> <span className={`font-bold ${z.winRate >= 35 ? 'text-emerald-600' : z.winRate >= 28 ? 'text-amber-600' : 'text-red-600'}`}>{z.winRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Forecast Scenarios · Q-End')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Scenario')}</th>
                  <th className="text-right">{tt('Q Forecast')}</th>
                  <th className="text-right">{tt('Growth %')}</th>
                  <th className="text-right">{tt('Probability')}</th>
                  <th>{tt('vs Quota')}</th>
                </tr>
              </thead>
              <tbody>
                {forecastScenarios.map((s) => (
                  <tr key={s.scenario} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{tt(s.scenario)}</td>
                    <td className={`text-right font-bold ${s.q >= 28 ? 'text-emerald-600' : 'text-red-600'}`}>BSD {s.q.toFixed(1)}M</td>
                    <td className={`text-right ${s.grow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{s.grow > 0 ? '+' : ''}{s.grow}%</td>
                    <td className="text-right">{s.prob}%</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${s.q >= 28 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.q >= 28 ? tt('On plan') : `−BSD ${(28 - s.q).toFixed(1)}M`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Powered by Cortex Analyst · model SALES_FCST_V2_8')}</div>
        </Panel>
      </>)}

      {/* ═══════ WIN / LOSS ═══════ */}
      {tab === 'winloss' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Win rate QTD')}        value="39.2%"  delta="+1.7 pp YoY"  trend="up"   icon={Trophy} accent />
          <KpiCard label={tt('Lost to price')}        value="38%"    delta="−2 pp QoQ"    trend="up"   icon={Coins} />
          <KpiCard label={tt('Avg lost deal size')}   value="BSD 1.2K"  delta="+BSD 80 vs LQ"  trend="down" icon={Target} />
          <KpiCard label={tt('Competitive losses')}   value="373"    delta="+12 this wk" trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Win Rate Trend · 6 Quarters')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={winLossByQuarter}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[35, 42]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="won" name={tt('Won')} fill="#10b981" stackId="a" />
                  <Bar yAxisId="l" dataKey="lost" name={tt('Lost')} fill={RED4} stackId="a" />
                  <Line yAxisId="r" type="monotone" dataKey="rate" name={tt('Win rate %')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Loss Reasons by Competitor')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={lostByCompetitor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="competitor" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="price"   name={tt('Price')}   fill={RED}  stackId="a" />
                  <Bar dataKey="network" name={tt('Network')} fill={RED2} stackId="a" />
                  <Bar dataKey="bundle"  name={tt('Bundle')}  fill={RED3} stackId="a" />
                  <Bar dataKey="service" name={tt('Service')} fill={RED4} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Win Rate by Deal Size')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={dealSizeWinRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 50]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="wr" name={tt('Win rate %')} fill={RED}>
                    {dealSizeWinRate.map((_, i) => <Cell key={i} fill={i < 2 ? '#10b981' : i < 4 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Win / Loss by Product')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Product')}</th>
                    <th className="text-right">{tt('Won')}</th>
                    <th className="text-right">{tt('Lost')}</th>
                    <th className="text-right">{tt('Win rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {winLossByProduct.map((p) => (
                    <tr key={p.product} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{tt(p.product)}</td>
                      <td className="text-right text-emerald-600 font-bold">{p.won}</td>
                      <td className="text-right text-red-600">{p.lost}</td>
                      <td className={`text-right font-bold ${p.wr >= 40 ? 'text-emerald-600' : p.wr >= 32 ? 'text-amber-600' : 'text-red-600'}`}>{p.wr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
