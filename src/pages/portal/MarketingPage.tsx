import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Megaphone, Users, Target, Coins, TrendingUp, Sparkles, Activity, Globe,
  Zap, FlaskConical, Calendar, Heart, MessageCircle, Send, Award, ShieldCheck,
  Bell, AlertTriangle, GitBranch, MapPin, ArrowUpRight, Tag, DollarSign, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts'
import { MOBILE_CAMPAIGNS } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const spendVsPlan = [
  { wk: 'W1', plan: 540, actual: 520, brand: 210, perf: 310 },
  { wk: 'W2', plan: 560, actual: 590, brand: 240, perf: 350 },
  { wk: 'W3', plan: 600, actual: 580, brand: 220, perf: 360 },
  { wk: 'W4', plan: 620, actual: 670, brand: 260, perf: 410 },
  { wk: 'W5', plan: 640, actual: 615, brand: 235, perf: 380 },
  { wk: 'W6', plan: 660, actual: 705, brand: 270, perf: 435 },
  { wk: 'W7', plan: 680, actual: 690, brand: 255, perf: 435 },
  { wk: 'W8', plan: 700, actual: 745, brand: 280, perf: 465 },
]

const channelROAS = [
  { ch: 'Search',   spend: 720, revenue: 3150, roas: 4.4, cac: 62,  incrementality: 78 },
  { ch: 'Social',   spend: 540, revenue: 2010, roas: 3.7, cac: 78,  incrementality: 64 },
  { ch: 'TV',       spend: 980, revenue: 2350, roas: 2.4, cac: 142, incrementality: 92 },
  { ch: 'YouTube',  spend: 320, revenue: 1180, roas: 3.7, cac: 88,  incrementality: 71 },
  { ch: 'Display',  spend: 240, revenue: 540,  roas: 2.3, cac: 110, incrementality: 48 },
  { ch: 'Email',    spend: 60,  revenue: 820,  roas: 13.7, cac: 14, incrementality: 88 },
  { ch: 'Outdoor',  spend: 410, revenue: 720,  roas: 1.8, cac: 168, incrementality: 55 },
  { ch: 'Affiliate', spend: 180, revenue: 690, roas: 3.8, cac: 81,  incrementality: 42 },
]

const merTrend = [
  { m: 'Jun', mer: 3.1, payback: 9.4 },
  { m: 'Jul', mer: 3.3, payback: 9.0 },
  { m: 'Aug', mer: 3.4, payback: 8.6 },
  { m: 'Sep', mer: 3.6, payback: 8.2 },
  { m: 'Oct', mer: 3.5, payback: 8.4 },
  { m: 'Nov', mer: 3.8, payback: 7.9 },
  { m: 'Dec', mer: 3.9, payback: 7.6 },
  { m: 'Jan', mer: 4.1, payback: 7.2 },
]

const workingNonWorking = [
  { name: 'Working media', value: 78, color: RED },
  { name: 'Non-working',   value: 22, color: '#cbd5e1' },
]

const paidOwnedEarned = [
  { name: 'Paid',   value: 64, color: RED },
  { name: 'Owned',  value: 22, color: RED4 },
  { name: 'Earned', value: 14, color: RED5 },
]

const brandHealth = [
  { metric: 'Aided Awareness',   us: 86, btc: 78, digi: 82, cablebahamas: 71 },
  { metric: 'Unaided Awareness', us: 42, btc: 36, digi: 47, cablebahamas: 28 },
  { metric: 'Consideration',     us: 51, btc: 44, digi: 38, cablebahamas: 32 },
  { metric: 'Brand Love',        us: 58, btc: 41, digi: 39, cablebahamas: 30 },
  { metric: 'Recommend',         us: 47, btc: 38, digi: 36, cablebahamas: 29 },
  { metric: 'Trust',             us: 54, btc: 49, digi: 46, cablebahamas: 38 },
]

const sovTrend = [
  { m: 'Jun', us: 28, btc: 24, digi: 31, cablebahamas: 17 },
  { m: 'Jul', us: 30, btc: 23, digi: 29, cablebahamas: 18 },
  { m: 'Aug', us: 32, btc: 22, digi: 28, cablebahamas: 18 },
  { m: 'Sep', us: 31, btc: 25, digi: 27, cablebahamas: 17 },
  { m: 'Oct', us: 33, btc: 24, digi: 26, cablebahamas: 17 },
  { m: 'Nov', us: 35, btc: 23, digi: 25, cablebahamas: 17 },
  { m: 'Dec', us: 37, btc: 22, digi: 24, cablebahamas: 17 },
  { m: 'Jan', us: 36, btc: 23, digi: 24, cablebahamas: 17 },
]

const sentimentByTopic = [
  { topic: 'Network speed',  pos: 68, neg: 14, neu: 18 },
  { topic: 'Pricing',        pos: 32, neg: 48, neu: 20 },
  { topic: 'Customer care',  pos: 41, neg: 36, neu: 23 },
  { topic: 'Sports add-on · Sports package',     pos: 72, neg: 12, neu: 16 },
  { topic: 'Installs',       pos: 38, neg: 39, neu: 23 },
  { topic: 'Brand purpose',  pos: 78, neg: 8,  neu: 14 },
]

const audiences = [
  { seg: 'Gaming HHs',          size: 142, cac: 71,  ltv: 1480, conv: 6.8, share: 18, color: RED },
  { seg: 'Family Value',        size: 268, cac: 86,  ltv: 1340, conv: 5.2, share: 32, color: RED2 },
  { seg: 'B2B SoHo',            size: 84,  cac: 124, ltv: 2210, conv: 8.4, share: 12, color: RED3 },
  { seg: 'Mover / Switcher',    size: 96,  cac: 64,  ltv: 1180, conv: 9.6, share: 14, color: RED4 },
  { seg: 'Win-back',            size: 58,  cac: 38,  ltv: 980,  conv: 11.2, share: 8, color: RED5 },
  { seg: 'Premium TV (Rival ISP B)',    size: 116, cac: 102, ltv: 1620, conv: 4.8, share: 16, color: '#ec4899' },
]

const creativeLeaderboard = [
  { id: 'AD-2241', name: '500Mb Switch & Save · 30s · Liesbet V. voiceover', ctr: 3.8, vtr: 76, freq: 4.2, status: 'Hero',  spend: 142, conv: 1820 },
  { id: 'AD-2238', name: 'REVConnect — Mobile + BB · 15s · Hero',                ctr: 3.4, vtr: 71, freq: 5.6, status: 'Wear-out', spend: 96,  conv: 1110 },
  { id: 'AD-2244', name: '5 Gb Beta Nassau · 15s · Geo-targeted',         ctr: 4.6, vtr: 81, freq: 2.8, status: 'Hero',  spend: 38,  conv: 624 },
  { id: 'AD-2230', name: 'Mega Bundle Sports add-on · Sports package · 30s',                   ctr: 1.9, vtr: 58, freq: 7.1, status: 'Retire',  spend: 64,  conv: 410 },
  { id: 'AD-2247', name: 'BSD 65 Bill Credit · 6s bumper',                    ctr: 5.2, vtr: 0,  freq: 3.4, status: 'Scale', spend: 24,  conv: 712 },
  { id: 'AD-2252', name: 'Loyalty Reward · CRM · animated',                ctr: 2.6, vtr: 0,  freq: 1.8, status: 'Test',  spend: 8,   conv: 188 },
]

const abTests = [
  { id: 'EXP-118', name: 'Hero CTA: Switch now vs Save BSD 15/mo', uplift: 8.4,  conf: 96, status: 'Ship',     metric: 'CR' },
  { id: 'EXP-121', name: '500Mb price anchor: BSD 49 vs BSD 45+BSD 4 add-on', uplift: 4.1,  conf: 91, status: 'Ship',  metric: 'CR' },
  { id: 'EXP-124', name: 'Bundle landing: TV-led vs Speed-led', uplift: -1.2, conf: 62, status: 'No-go',  metric: 'CR' },
  { id: 'EXP-127', name: 'Win-back offer depth: BSD 10 vs BSD 15 BC',  uplift: 2.6, conf: 78, status: 'Read more', metric: 'Save' },
  { id: 'EXP-130', name: 'Mobile checkout: 1-pg vs accordion',   uplift: 11.8, conf: 99, status: 'Ship',   metric: 'CR' },
  { id: 'EXP-132', name: 'Email subject — emoji vs plain',       uplift: 0.4, conf: 51, status: 'Inconclusive', metric: 'CTR' },
]

const promoOwn = [
  { name: '500Mb @ BSD 35 — 12 mo',     status: 'Live',   live: 'May 02', end: 'Nov 30', incMRR: 178, marginHit: -22, redempt: 12480 },
  { name: 'BSD 65 Bill Credit',          status: 'Live',   live: 'Apr 18', end: 'Dec 31', incMRR: 142, marginHit: -16, redempt: 6480 },
  { name: 'REVConnect — BB + Mobile BSD 84',   status: 'Live',   live: 'Mar 01', end: 'Jan 32', incMRR: 96,  marginHit: -8,  redempt: 8120 },
  { name: '5 Gb Beta Nassau',         status: 'Live',   live: 'May 15', end: 'Jun 14', incMRR: 38,  marginHit: -3,  redempt: 1240 },
  { name: 'Max add-on',        status: 'Paused', live: 'Apr 01', end: 'May 12', incMRR: 14,  marginHit: -9,  redempt: 1480 },
]

const promoCompet = [
  { name: 'Sports add-on BSD 30/mo (12 mo intro)',     start: 'May 04', threat: 'High',   ourResp: '500Mb @ BSD 35 hero' },
  { name: 'BTC Fibre 1 Gb BSD 40 + BSD 100 voucher',   start: 'May 10', threat: 'High',   ourResp: 'BSD 65 Bill Credit' },
  { name: 'Rival ISP C Mobile + BB bundle BSD 70',            start: 'May 21', threat: 'Medium', ourResp: 'REVConnect repositioning' },
  { name: 'Cable Bahamas Pro II at BSD 45',              start: 'Sep 28', threat: 'Medium', ourResp: 'Match via win-back' },
  { name: 'Rival ISP B Mobile add-on free 12mo',         start: 'May 18', threat: 'Low',    ourResp: 'Monitor' },
]

const calendar = [
  { wk: 'W22', items: [{ k: 'TV', name: '500Mb Hero ATL', color: RED }, { k: 'Search', name: 'Always-on', color: RED2 }] },
  { wk: 'W23', items: [{ k: 'TV', name: '500Mb Hero ATL', color: RED }, { k: 'Social', name: 'REVConnect push', color: RED3 }] },
  { wk: 'W24', items: [{ k: 'OOH', name: 'Nassau 5 Gb Beta', color: RED4 }, { k: 'Search', name: 'Always-on', color: RED2 }] },
  { wk: 'W25', items: [{ k: 'TV', name: 'Sports add-on · Sports package launch', color: RED5 }, { k: 'CRM', name: 'Win-back wave 3', color: RED }] },
  { wk: 'W26', items: [{ k: 'TV', name: 'Sports add-on · Sports package launch', color: RED5 }, { k: 'Social', name: 'REVConnect UGC', color: RED3 }] },
  { wk: 'W27', items: [{ k: 'OOH', name: 'Freeport + Abaco', color: RED4 }, { k: 'CRM', name: 'Loyalty NPS+', color: RED2 }] },
]

const fullFunnel = [
  { stage: 'Awareness',     count: 2_400_000, conv: 100, days: 0 },
  { stage: 'Consideration', count: 912_000,   conv: 38,  days: 6 },
  { stage: 'Intent',        count: 336_000,   conv: 14,  days: 12 },
  { stage: 'Lead (MQL)',    count: 31_900,    conv: 1.33, days: 14 },
  { stage: 'Qualified (SQL)', count: 18_400,  conv: 0.77, days: 16 },
  { stage: 'Order',         count: 8_120,     conv: 0.34, days: 18 },
  { stage: 'Install',       count: 7_240,     conv: 0.30, days: 24 },
  { stage: 'Active 30d',    count: 6_980,     conv: 0.29, days: 54 },
]

const journeys = [
  { name: 'Welcome (D0–D14)',    sends: 41_200, open: 58, click: 22, conv: 6.8, unsub: 0.3 },
  { name: 'Onboard (D14–D30)',   sends: 38_400, open: 49, click: 18, conv: 4.1, unsub: 0.4 },
  { name: 'Cross-sell (D30+)',   sends: 124_000, open: 38, click: 11, conv: 2.4, unsub: 0.6 },
  { name: 'Win-back (lapsed)',   sends: 18_600, open: 31, click: 9,  conv: 4.8, unsub: 1.4 },
  { name: 'Save-desk inbound',   sends: 6_240,  open: 72, click: 41, conv: 38.4, unsub: 0.2 },
  { name: 'Loyalty NPS+',        sends: 96_000, open: 44, click: 14, conv: 1.8, unsub: 0.3 },
]

const winBack = [
  { wk: 'W1', offered: 4200, saved: 1310, rate: 31.2 },
  { wk: 'W2', offered: 4380, saved: 1410, rate: 32.2 },
  { wk: 'W3', offered: 4520, saved: 1490, rate: 33.0 },
  { wk: 'W4', offered: 4690, saved: 1620, rate: 34.5 },
  { wk: 'W5', offered: 4810, saved: 1700, rate: 35.3 },
  { wk: 'W6', offered: 4950, saved: 1810, rate: 36.6 },
]

const sourceMix = [
  { src: 'Web (DTC)',     gross: 8120, cpga: 84, share: 42 },
  { src: 'Retail',        gross: 2410, cpga: 92, share: 12 },
  { src: 'Telesales',     gross: 1860, cpga: 64, share: 10 },
  { src: 'Doorstep',      gross: 1420, cpga: 112, share: 7 },
  { src: 'Partner',       gross: 1240, cpga: 96, share: 6 },
  { src: 'Switcher port-in', gross: 4520, cpga: 48, share: 23 },
]

const geo = [
  { region: 'Nassau',    spend: 940, netAdds: 3120, services: 92 },
  { region: 'Freeport',      spend: 410, netAdds: 1410, services: 78 },
  { region: 'Abaco',    spend: 280, netAdds: 980,  services: 71 },
  { region: 'Eleuthera',  spend: 220, netAdds: 740,  services: 68 },
  { region: 'Exuma', spend: 140, netAdds: 510,  services: 64 },
  { region: 'Bimini',    spend: 180, netAdds: 690,  services: 82 },
  { region: 'Andros',    spend: 110, netAdds: 420,  services: 76 },
  { region: 'Long Island',       spend: 240, netAdds: 880,  services: 84 },
]

const compliance = [
  { metric: 'Consent rate (web)',         value: 78,  delta: '+2 pp', good: true },
  { metric: 'Email opt-out rate',         value: 0.6, delta: '-0.1 pp', good: true, suffix: '%' },
  { metric: 'JEP complaints (open)',     value: 2,   delta: '0 new this wk', good: true, suffix: '' },
  { metric: 'URCA claim flags',         value: 1,   delta: '"Fastest" pending', good: false, suffix: '' },
  { metric: 'DSAR avg resolution (days)', value: 14,  delta: 'SLA 30d', good: true, suffix: '' },
]

const cortexPrompts = [
  { q: 'What\'s pulling CAC up this week?',                        sql: 'SELECT channel, cac_delta_vs_lw FROM MARKETING_CHANNEL ORDER BY 2 DESC' },
  { q: 'Best next promo for Family Value at-risk segment',          sql: 'CALL recommend_offer(audience=>\'family_value_risk\', objective=>\'retention\')' },
  { q: 'Re-allocate BSD 100K to maximise net adds next 30 days',       sql: 'SELECT * FROM MMM_REALLOCATE(budget=>100000, horizon_days=>30)' },
  { q: 'Which creatives are wearing out (freq>5, CTR↓)?',           sql: 'SELECT * FROM CREATIVE_HEALTH WHERE freq > 5 AND ctr_trend < 0' },
  { q: 'Show win-back save rate by tenure cohort',                  sql: 'SELECT cohort, save_rate FROM WINBACK_COHORTS' },
  { q: 'Forecast incremental MRR if Sports add-on · Sports package promo runs 4 wks',   sql: 'SELECT * FROM PROMO_FORECAST(\'PLAY_SPORTS\', 4)' },
]

const anomalies = [
  { sev: 'High',   when: '14:00', what: 'Freeport+Abaco · 500Mb conv −32% vs baseline · API p99 14.2s', loss: 'BSD 32K MRR' },
  { sev: 'Medium', when: '11:20', what: 'Search CPC +18% on "fastest broadband bahamas"',          loss: 'BSD 8K wk' },
  { sev: 'Low',    when: '08:45', what: 'YouTube view-through rate −6% on AD-2238 (frequency 5.6)',  loss: '—' },
]

const reallocations = [
  { from: 'Display (Programmatic)', to: 'Search Brand Defence',  amt: 42, deltaNetAdds: '+184',  reason: 'BTC bidding our brand terms' },
  { from: 'OOH (Tier 2 cities)',     to: 'YouTube 6-sec bumpers', amt: 28, deltaNetAdds: '+96',   reason: 'MMM shows higher incrementality' },
  { from: 'TV daypart (late-night)', to: 'CRM win-back wave',    amt: 18, deltaNetAdds: '+72',   reason: 'Save-rate +6 pp at BSD 15 BC depth' },
]

const headlineKpis = {
  spendMTD: 2.84,         // BSD M
  spendQTD: 7.92,         // BSD M
  budgetUsedPct: 86,
  blendedROAS: 4.1,
  blendedCAC: 84,
  cpgaLW: 78,
  payback: 7.2,           // months
  mer: 4.1,
  leadsMTD: 31.9,         // K
  leadsConv: 6.4,
  netAdds: 8240,
  netAddsTarget: 9000,
}

// ───────── attribution data ─────────
const attributionChannels = [
  { ch: 'Search',  firstTouch: 28, lastTouch: 34, linear: 22, dda: 26 },
  { ch: 'Social',  firstTouch: 18, lastTouch: 12, linear: 16, dda: 14 },
  { ch: 'TV',      firstTouch: 22, lastTouch: 8,  linear: 18, dda: 16 },
  { ch: 'YouTube', firstTouch: 12, lastTouch: 9,  linear: 12, dda: 11 },
  { ch: 'Display', firstTouch: 6,  lastTouch: 4,  linear: 8,  dda: 6 },
  { ch: 'Email',   firstTouch: 4,  lastTouch: 18, linear: 12, dda: 14 },
  { ch: 'CRM',     firstTouch: 4,  lastTouch: 8,  linear: 8,  dda: 9 },
  { ch: 'Outdoor', firstTouch: 6,  lastTouch: 7,  linear: 4,  dda: 4 },
]

const topConvPaths = [
  { path: 'Search → Email → Order',          convs: 1842, share: 14.2, cpa: 68 },
  { path: 'TV → Search → Order',             convs: 1480, share: 11.4, cpa: 84 },
  { path: 'Social → Search → Email → Order', convs: 980,  share: 7.6,  cpa: 72 },
  { path: 'YouTube → Search → Order',        convs: 840,  share: 6.5,  cpa: 78 },
  { path: 'Outdoor → Search → Order',        convs: 620,  share: 4.8,  cpa: 96 },
  { path: 'Email → Order (1-touch)',           convs: 580,  share: 4.5,  cpa: 18 },
]

const pathLengths = [
  { touches: '1',   conv: 28, share: 18 },
  { touches: '2',   conv: 34, share: 22 },
  { touches: '3',   conv: 38, share: 24 },
  { touches: '4–5', conv: 41, share: 20 },
  { touches: '6+',  conv: 44, share: 16 },
]

// ───────── content & SEO data ─────────
const organicKeywords = [
  { kw: 'internet fibre',       pos: 1, vol: 12400, clicks: 4960, ctr: 40.0 },
  { kw: 'broadband bahamas',      pos: 2, vol: 14200, clicks: 3480, ctr: 24.5 },
  { kw: 'best fibre deal',          pos: 3, vol: 9800,  clicks: 1960, ctr: 20.0 },
  { kw: 'switch broadband be',      pos: 4, vol: 8200,  clicks: 1230, ctr: 15.0 },
  { kw: 'btc fibre price',     pos: 1, vol: 7600,  clicks: 3040, ctr: 40.0 },
  { kw: '5g bahamas coverage',      pos: 5, vol: 6800,  clicks: 680,  ctr: 10.0 },
]

const contentPieces = [
  { title: '500 Mb vs 1 Gb — which do you need?',       visits: 48200, leads: 1240, conv: 2.6, stage: 'ToFu' },
  { title: 'How to switch provider in The Bahamas',           visits: 36400, leads: 980,  conv: 2.7, stage: 'ToFu' },
  { title: 'REVConnect: is BB + Mobile worth it?',             visits: 24600, leads: 820,  conv: 3.3, stage: 'MoFu' },
  { title: 'Fibre for businesses: SLAs explained',       visits: 18200, leads: 640,  conv: 3.5, stage: 'MoFu' },
  { title: 'Leaving BTC — your checklist',          visits: 14800, leads: 1180, conv: 8.0, stage: 'BoFu' },
  { title: 'URCA rights: what to do',                    visits: 12400, leads: 280,  conv: 2.3, stage: 'Brand' },
]

const seoVsPaidTrend = [
  { m: 'Jun', seo: 3200, paid: 8400 }, { m: 'Jul', seo: 3600, paid: 8200 },
  { m: 'Aug', seo: 4100, paid: 8800 }, { m: 'Sep', seo: 4600, paid: 9200 },
  { m: 'Oct', seo: 5200, paid: 9600 }, { m: 'Nov', seo: 5800, paid: 9400 },
  { m: 'Dec', seo: 6400, paid: 9800 }, { m: 'Jan', seo: 7200, paid: 10200 },
]

// ───────── lifecycle data ─────────
const lifecycleMrr = [
  { m: 'Jun', newMRR: 142, expansionMRR: 68, contractionMRR: -24, churnMRR: -38 },
  { m: 'Jul', newMRR: 156, expansionMRR: 72, contractionMRR: -22, churnMRR: -36 },
  { m: 'Aug', newMRR: 168, expansionMRR: 78, contractionMRR: -20, churnMRR: -34 },
  { m: 'Sep', newMRR: 184, expansionMRR: 84, contractionMRR: -18, churnMRR: -32 },
  { m: 'Oct', newMRR: 196, expansionMRR: 88, contractionMRR: -16, churnMRR: -30 },
  { m: 'Nov', newMRR: 208, expansionMRR: 92, contractionMRR: -14, churnMRR: -28 },
]

const retentionCurve: { m: string; jan: number | null; feb: number | null; mar: number | null; apr: number | null }[] = [
  { m: 'M0',  jan: 100,  feb: 100,  mar: 100,  apr: 100 },
  { m: 'M1',  jan: 98.4, feb: 98.6, mar: 98.8, apr: 99.0 },
  { m: 'M2',  jan: 97.1, feb: 97.4, mar: 97.6, apr: 97.8 },
  { m: 'M3',  jan: 96.2, feb: 96.8, mar: 97.1, apr: null },
  { m: 'M6',  jan: 94.1, feb: 94.6, mar: null, apr: null },
  { m: 'M12', jan: 91.4, feb: null, mar: null, apr: null },
]

const lifecycleSegments = [
  { stage: 'New (D0–D30)',      count: 42800,  churn: 1.8,  nps: 42, arpu: 58 },
  { stage: 'Active (D31–D180)', count: 186000, churn: 1.2,  nps: 56, arpu: 64 },
  { stage: 'Engaged (D181+)',   count: 412000, churn: 0.8,  nps: 68, arpu: 72 },
  { stage: 'At-risk',           count: 28400,  churn: 6.4,  nps: 28, arpu: 61 },
  { stage: 'Save desk',         count: 6800,   churn: 14.2, nps: 18, arpu: 58 },
]

// ───────── tabs ─────────
type TabId = 'performance' | 'brand' | 'campaigns' | 'funnel' | 'ai' | 'attribution' | 'content' | 'lifecycle'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'performance',  label: 'Performance',           icon: Activity },
  { id: 'brand',        label: 'Brand & Audience',      icon: Heart },
  { id: 'campaigns',    label: 'Campaigns & Creative',  icon: FlaskConical },
  { id: 'funnel',       label: 'Funnel & Lifecycle',    icon: GitBranch },
  { id: 'ai',           label: 'AI Actions',            icon: Sparkles },
  { id: 'attribution',  label: 'Attribution',           icon: Target },
  { id: 'content',      label: 'Content & SEO',         icon: Globe },
  { id: 'lifecycle',    label: 'Lifecycle',             icon: ArrowUpRight },
]

const sevColor = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const statusPill = (s: string) => {
  if (s === 'Live' || s === 'Hero' || s === 'Ship' || s === 'Scale') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Paused' || s === 'Wear-out' || s === 'Read more') return 'bg-amber-100 text-amber-700'
  if (s === 'Retire' || s === 'No-go') return 'bg-red-100 text-red-700'
  return 'bg-black/5 text-vfes-dark/60'
}

export default function MarketingPage() {
  const [tab, setTab] = useState<TabId>('performance')

  const wkSpend = useMemo(() => spendVsPlan.reduce((s, w) => s + w.actual, 0), [])
  const totalROAS = useMemo(() => {
    const r = channelROAS.reduce((a, c) => a + c.revenue, 0)
    const sp = channelROAS.reduce((a, c) => a + c.spend, 0)
    return r / sp
  }, [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Marketing')}
        subtitle={tt('Cortex-powered marketing OS · MMM · brand health · creative · CRM')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MMM live · refresh 04:00
            </span>
          </div>
        }
      />

      <AgentDecision
        title="Reallocate budget to best ROAS & payback"
        label="Run Budget Optimiser"
        runningLabel="Optimising…"
        steps={[
          'Pulled MMM-blended ROAS & payback by channel',
          'Netted reachable audience against consent',
          'Shifted spend from sub-1× to high-MER channels',
          'Held brand floor — protected long-term equity',
        ]}
        hint="Optimiser respects consent-limited reach — spend follows contactable, high-ROAS audiences."
        result={{
          headline: 'Move spend to high-MER channels; suppress out-of-footprint',
          stats: [
            { label: 'Spend MTD', value: `BSD ${headlineKpis.spendMTD.toFixed(2)}M` },
            { label: 'Blended ROAS', value: `${headlineKpis.blendedROAS}×` },
            { label: 'Blended CAC', value: `BSD ${headlineKpis.blendedCAC}` },
            { label: 'Payback', value: `${headlineKpis.payback} mo` },
          ],
          findings: [
            'Several channels run below 1× ROAS while out-of-footprint paid burns impressions.',
            'Reallocating to high-MER, in-footprint audiences improves payback without cutting volume.',
          ],
          note: '+blended ROAS · faster payback',
        }}
        impact="+blended ROAS · faster payback"
        risk="don't starve brand — keep a brand-spend floor"
        linkTo="#/portal/loyalty-consent"
        linkLabel="Open Loyalty & Consent (reach)"
      />

      {/* live alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Spend anomaly · Search · last 6h')}</div>
            <div className="text-xs text-amber-800 mt-1">
              CPC <span className="font-bold">+18%</span> on "fastest broadband bahamas" — BTC bidding on our brand terms ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('est. waste BSD 4.2K / day')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('recommend brand-defence reallocation')}</span>
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
        <Link to="/portal/sales" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Sales')}</Link>
        <Link to="/portal/digital-funnel" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Digital Funnel')}</Link>
        <Link to="/portal/promotions" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Promotions')}</Link>
        <Link to="/portal/churn-retention" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Churn & Retention')}</Link>
        <Link to="/portal/customer-360" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Customer 360')}</Link>
        <Link to="/portal/loyalty-consent" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Loyalty & Consent')}</Link>
        <Link to="/portal/voc" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('VoC')}</Link>
        <Link to="/portal/base-management" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Base Management')}</Link>
        <Link to="/portal/pricing-simulator" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Pricing Simulator')}</Link>
        <Link to="/portal/product" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Product')}</Link>
        <Link to="/portal/ai-insights" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('AI Insights')}</Link>
        <Link to="/portal/finance" className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/10 text-vfes-dark/60 hover:bg-black/5">{tt('Finance')}</Link>
      </div>

      {/* ═══════ PERFORMANCE ═══════ */}
      {tab === 'performance' && (<>
        {/* KPI strip */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Spend MTD')}  value={`BSD ${headlineKpis.spendMTD.toFixed(2)}M`} delta={`${headlineKpis.budgetUsedPct}% of plan`} trend="flat" icon={DollarSign} accent />
          <KpiCard label={tt('Blended ROAS')} value={`${headlineKpis.blendedROAS}×`}        delta="+0.3 vs LM"     trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Blended CAC')}  value={`BSD ${headlineKpis.blendedCAC}`}         delta={`vs BSD ${headlineKpis.cpgaLW} LW`} trend="down" icon={Target} />
          <KpiCard label={tt('Payback')}      value={`${headlineKpis.payback} mo`}          delta="-0.4 vs LM"     trend="up" icon={Coins} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MER')}          value={`${headlineKpis.mer.toFixed(1)}×`}      delta="trend ↑"        trend="up"   icon={Sparkles} />
          <KpiCard label={tt('Leads MTD')}    value={`${headlineKpis.leadsMTD}K`}            delta={`${headlineKpis.leadsConv}% conv`} trend="up" icon={Users} />
          <KpiCard label={tt('Net adds')}     value={headlineKpis.netAdds.toLocaleString()}  delta={`vs ${headlineKpis.netAddsTarget.toLocaleString()} target`} trend="down" icon={Activity} />
          <KpiCard label={tt('Active campaigns')} value="14"                                  delta="3 launching"    trend="up"   icon={Megaphone} />
        </div>

        {/* Mobile-led campaigns */}
        <Panel title={tt('Mobile-led campaigns · in flight')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Cable Bahamas · 5G upsell + MNP')}</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Campaign')}</th><th>{tt('Channel')}</th><th>{tt('Budget')}</th><th>{tt('Spent')}</th><th>{tt('Leads')}</th><th>{tt('Conv.')}</th><th>{tt('ROI')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {MOBILE_CAMPAIGNS.map((c, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(c.name)}</td>
                  <td className="text-xs text-vfes-dark/65">{tt(c.channel)}</td>
                  <td className="font-mono text-xs">BSD {c.budget}K</td>
                  <td className="font-mono text-xs">BSD {c.spent}K</td>
                  <td className="font-mono text-xs">{(c.leads / 1000).toFixed(1)}K</td>
                  <td className="font-mono text-xs">{c.conv.toFixed(1)}%</td>
                  <td className={`font-bold text-xs ${c.roi >= 4 ? 'text-emerald-600' : c.roi >= 2 ? 'text-vfes-dark' : 'text-amber-600'}`}>{c.roi.toFixed(1)}×</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'on-track' ? 'bg-emerald-50 text-emerald-700' : c.status === 'at-risk' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{tt(c.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('MNP win-back vs BTC at 5.2× ROI is best performer — extend to Bimini and Freeport. Family plan switcher at 2.4× vs Rival ISP B aggressive pricing under review.')}</div>
        </Panel>

        {/* Spend vs plan + working/non-working */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Spend vs Plan · Brand vs Performance')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={spendVsPlan}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'BSD K', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="brand" stackId="a" name={tt('Brand')} fill={RED5} />
                    <Bar dataKey="perf" stackId="a" name={tt('Performance')} fill={RED} />
                    <Line type="monotone" dataKey="plan" name={tt('Plan')} stroke={DARK} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">8-week run-rate <span className="font-bold text-vfes-dark">BSD {(wkSpend/1000).toFixed(2)}M</span>{tt('· Brand 38% · Performance 62%')}</div>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title={tt('Working vs Non-working')}>
              <div className="h-32">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={workingNonWorking} dataKey="value" innerRadius={32} outerRadius={56} paddingAngle={2}>
                      {workingNonWorking.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-vfes-dark/70 mt-1">Working <span className="font-bold text-vfes-dark">78%</span>{tt('· target 80%')}</div>
            </Panel>
            <Panel title={tt('Paid · Owned · Earned')}>
              <div className="h-32">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={paidOwnedEarned} dataKey="value" innerRadius={32} outerRadius={56} paddingAngle={2}>
                      {paidOwnedEarned.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-vfes-dark/70 mt-1">Earned <span className="font-bold text-vfes-dark">14%</span>{tt('· +2 pp vs LQ')}</div>
            </Panel>
          </div>
        </div>

        {/* Channel ROAS table + MER trend */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Channel ROAS · MMM-blended')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="py-2">{tt('Channel')}</th>
                      <th className="text-right">{tt('Spend')}</th>
                      <th className="text-right">{tt('Revenue')}</th>
                      <th className="text-right">{tt('ROAS')}</th>
                      <th className="text-right">{tt('CAC')}</th>
                      <th className="text-right">{tt('Incrementality')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelROAS.map((c) => (
                      <tr key={c.ch} className="border-t border-black/5">
                        <td className="py-2.5 font-semibold">{c.ch}</td>
                        <td className="text-right">BSD {c.spend}K</td>
                        <td className="text-right">BSD {c.revenue}K</td>
                        <td className={`text-right font-bold ${c.roas >= 3 ? 'text-emerald-600' : c.roas >= 2 ? 'text-amber-600' : 'text-red-600'}`}>{c.roas}×</td>
                        <td className="text-right">BSD {c.cac}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-black/5 rounded">
                              <div className="h-full bg-vfes-red rounded" style={{ width: `${c.incrementality}%` }} />
                            </div>
                            <span className="text-xs">{c.incrementality}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">Blended ROAS <span className="font-bold text-vfes-dark">{totalROAS.toFixed(1)}×</span>{tt('· TV halo applied via MMM')}</div>
            </Panel>
          </div>
          <Panel title={tt('MER & Payback Trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={merTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[2, 5]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[6, 10]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="mer" name={tt('MER (×)')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="payback" name={tt('Payback (mo)')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Acquisition source mix + Geo */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Acquisition · Source Mix')}>
            <div className="space-y-2">
              {sourceMix.map((s) => (
                <div key={s.src} className="flex items-center gap-3 text-sm">
                  <div className="w-32 font-semibold">{s.src}</div>
                  <div className="flex-1 h-7 bg-black/5 rounded">
                    <div className="h-full bg-gradient-to-r from-vfes-red-dark to-vfes-red rounded flex items-center justify-end pr-2 text-xs text-vfes-dark font-bold" style={{ width: `${s.share * 2}%` }}>
                      {s.gross.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-vfes-dark/65">BSD {s.cpga}/GA</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('CPGA = cost per gross add')}</div>
          </Panel>

          <Panel title={tt('Geographic · Spend vs Net Adds')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" dataKey="spend" name={tt('Spend (BSD K)')} tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="netAdds" name={tt('Net Adds')} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={geo} fill={RED} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">Bubble size = serviceability index · best efficiency: <span className="font-bold text-vfes-dark">{tt('Long Island')}</span></div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ BRAND & AUDIENCE ═══════ */}
      {tab === 'brand' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Aided awareness')}   value="86%" delta="+2 pp YoY"  trend="up"   icon={Heart} accent />
          <KpiCard label={tt('Brand love index')}   value="58" delta="+4 vs LQ"    trend="up"   icon={Award} />
          <KpiCard label={tt('Share of voice')}     value="36%" delta="+3 pp"      trend="up"   icon={Megaphone} />
          <KpiCard label={tt('Net sentiment')}      value="+24" delta="-3 on price" trend="down" icon={MessageCircle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Brand Health · vs Competitors')}>
            <div className="h-80">
              <ResponsiveContainer>
                <RadarChart data={brandHealth}>
                  <PolarGrid stroke="#eee" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Radar name={tt('Rival ISP A')} dataKey="us" stroke={RED} fill={RED} fillOpacity={0.4} />
                  <Radar name={tt('BTC')} dataKey="btc" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Radar name={tt('Rival ISP B')} dataKey="digi" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.12} />
                  <Radar name={tt('Cable Bahamas')} dataKey="cablebahamas" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Share of Voice · 8 mo')}>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={sovTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="us" stackId="1" name={tt('Rival ISP A')} stroke={RED} fill={RED} fillOpacity={0.85} />
                  <Area type="monotone" dataKey="digi" stackId="1" name={tt('Rival ISP B')} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.7} />
                  <Area type="monotone" dataKey="btc" stackId="1" name={tt('BTC')} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.7} />
                  <Area type="monotone" dataKey="cablebahamas" stackId="1" name={tt('Cable Bahamas')} stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Sentiment by Topic · Social Listening')}>
            <div className="space-y-2">
              {sentimentByTopic.map((s) => (
                <div key={s.topic} className="flex items-center gap-3 text-sm">
                  <div className="w-32 font-semibold">{s.topic}</div>
                  <div className="flex-1 h-6 bg-black/5 rounded overflow-hidden flex">
                    <div className="h-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${s.pos}%` }}>{s.pos}%</div>
                    <div className="h-full bg-slate-300" style={{ width: `${s.neu}%` }} />
                    <div className="h-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${s.neg}%` }}>{s.neg}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-sm" />{tt('Positive')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-300 rounded-sm" />{tt('Neutral')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-sm" />{tt('Negative')}</span>
            </div>
          </Panel>

          <Panel title={tt('Audience Segments')}>
            <div className="space-y-2">
              {audiences.map((a) => (
                <div key={a.seg} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: a.color }} />
                  <div className="flex-1">
                    <div className="font-semibold">{a.seg}</div>
                    <div className="text-[10px] text-vfes-dark/55">{a.size}K HH · {a.share}% reachable mix</div>
                  </div>
                  <div className="text-right text-xs">
                    <div>CAC <span className="font-bold">BSD {a.cac}</span></div>
                    <div className="text-vfes-dark/55">LTV BSD {a.ltv}</div>
                  </div>
                  <div className="text-right text-xs w-12">
                    <div className="font-bold text-vfes-dark">{a.conv}%</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('conv')}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Audience Sizing · Conv vs LTV')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" dataKey="cac" name={tt('CAC (BSD )')} tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="ltv" name={tt('LTV (BSD )')} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={audiences} fill={RED} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Win-back: lowest CAC · B2B SoHo: highest LTV')}</div>
          </Panel>

          <Panel title={tt('Compliance & Reputation')}>
            <div className="space-y-2">
              {compliance.map((c) => (
                <div key={c.metric} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <ShieldCheck className={`w-4 h-4 ${c.good ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="flex-1 font-semibold">{c.metric}</div>
                  <div className="font-bold">{c.value}{c.suffix ?? '%'}</div>
                  <div className={`text-xs ${c.good ? 'text-emerald-600' : 'text-amber-600'}`}>{c.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CAMPAIGNS & CREATIVE ═══════ */}
      {tab === 'campaigns' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active campaigns')}  value="14"  delta="3 launching"   trend="up" icon={Megaphone} accent />
          <KpiCard label={tt('Tests in flight')}   value="6"   delta="2 ship-ready"  trend="up" icon={FlaskConical} />
          <KpiCard label={tt('Creative health')}   value="78%" delta="2 wear-out"    trend="flat" icon={Sparkles} />
          <KpiCard label={tt('Promo redemptions')} value="29.8K" delta="+11% vs LW" trend="up" icon={Tag} />
        </div>

        <Panel title={tt('Campaign Calendar · Next 6 Weeks')}>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {calendar.map((c) => (
                <div key={c.wk} className="flex-1 min-w-[140px]">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{c.wk}</div>
                  <div className="space-y-1.5">
                    {c.items.map((it, i) => (
                      <div key={i} className="text-xs px-2 py-1.5 rounded text-white font-semibold" style={{ background: it.color }}>
                        <div className="text-[9px] uppercase tracking-widest opacity-80">{it.k}</div>
                        {tt(it.name)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Creative Leaderboard · This Week')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="py-2">{tt('Asset')}</th>
                      <th>{tt('Status')}</th>
                      <th className="text-right">{tt('CTR')}</th>
                      <th className="text-right">{tt('VTR')}</th>
                      <th className="text-right">{tt('Freq')}</th>
                      <th className="text-right">{tt('Spend')}</th>
                      <th className="text-right">{tt('Conv')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creativeLeaderboard.map((c) => (
                      <tr key={c.id} className="border-t border-black/5">
                        <td className="py-2.5">
                          <div className="font-semibold">{tt(c.name)}</div>
                          <div className="text-[10px] text-vfes-dark/55 font-mono">{c.id}</div>
                        </td>
                        <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(c.status)}`}>{tt(c.status)}</span></td>
                        <td className="text-right font-bold text-vfes-dark">{c.ctr}%</td>
                        <td className="text-right">{c.vtr ? `${c.vtr}%` : '—'}</td>
                        <td className={`text-right ${c.freq > 5 ? 'text-amber-600 font-bold' : ''}`}>{c.freq}</td>
                        <td className="text-right">BSD {c.spend}K</td>
                        <td className="text-right">{c.conv.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
          <Panel title={tt('A/B Test Pipeline')}>
            <div className="space-y-2">
              {abTests.map((t) => (
                <div key={t.id} className="border-b border-black/5 pb-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] text-vfes-dark/55">{t.id}</div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusPill(t.status)}`}>{tt(t.status)}</span>
                  </div>
                  <div className="font-semibold text-xs mt-0.5">{tt(t.name)}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-vfes-dark/65">
                    <span>{t.metric} <span className={`font-bold ${t.uplift >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.uplift > 0 ? '+' : ''}{t.uplift}%</span></span>
                    <span>conf <span className="font-bold">{t.conf}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Promo Tracker · Own')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Promo')}</th>
                    <th>{tt('Status')}</th>
                    <th className="text-right">{tt('Inc MRR')}</th>
                    <th className="text-right">{tt('Margin Δ')}</th>
                    <th className="text-right">{tt('Redempt.')}</th>
                  </tr>
                </thead>
                <tbody>
                  {promoOwn.map((p) => (
                    <tr key={tt(p.name)} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{tt(p.name)}<div className="text-[10px] text-vfes-dark/55 font-normal">{p.live} → {p.end}</div></td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(p.status)}`}>{tt(p.status)}</span></td>
                      <td className="text-right font-bold text-emerald-600">BSD {p.incMRR}K</td>
                      <td className="text-right font-bold text-red-600">{p.marginHit} pp</td>
                      <td className="text-right">{p.redempt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Promo Tracker · Competitor')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Competitor Move')}</th>
                    <th>{tt('Start')}</th>
                    <th>{tt('Threat')}</th>
                    <th>{tt('Our Response')}</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCompet.map((p) => (
                    <tr key={tt(p.name)} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{tt(p.name)}</td>
                      <td className="text-xs text-vfes-dark/65">{p.start}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(p.threat)}`}>{p.threat}</span></td>
                      <td className="text-xs">{p.ourResp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ FUNNEL & LIFECYCLE ═══════ */}
      {tab === 'funnel' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Leads MTD')}        value={`${headlineKpis.leadsMTD}K`} delta="+12.4%"     trend="up" icon={Users} accent />
          <KpiCard label={tt('Lead → Install')}   value="22.7%"                       delta="+1.4 pp"    trend="up" icon={Target} />
          <KpiCard label={tt('Avg time-to-install')} value="10 d"                     delta="-1 d vs LM" trend="up" icon={Calendar} />
          <KpiCard label={tt('Win-back save rate')}  value="36.6%"                    delta="+5.4 pp QoQ" trend="up" icon={ArrowUpRight} />
        </div>

        <Panel title={tt('Full Funnel · Awareness → Active')}>
          <div className="space-y-2">
            {fullFunnel.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-3 text-sm">
                <div className="w-32 font-semibold">{f.stage}</div>
                <div className="flex-1 h-9 bg-[#f3f4f7] rounded-lg overflow-hidden border border-black/5">
                  <div className="h-full bg-gradient-to-r from-vfes-red-dark via-vfes-red to-vfes-red-light flex items-center justify-end pr-3 text-xs font-bold text-vfes-dark" style={{ width: `${Math.max(f.conv, 3)}%`, opacity: 1 - i * 0.07 }}>
                    {f.count >= 1_000_000 ? `${(f.count/1_000_000).toFixed(2)}M` : f.count >= 1000 ? `${(f.count/1000).toFixed(1)}K` : f.count}
                  </div>
                </div>
                <div className="w-16 text-right text-xs text-vfes-dark/65">{f.conv}%</div>
                <div className="w-14 text-right text-[10px] text-vfes-dark/55">{f.days}d</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Lead-to-install conv <span className="text-vfes-dark font-bold">22.7%</span> · biggest leak <span className="text-vfes-dark font-bold">{tt('SQL → Order (44%)')}</span></div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="lg:col-span-2">
            <Panel title={tt('CRM Journeys · Performance')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="py-2">{tt('Journey')}</th>
                      <th className="text-right">{tt('Sends')}</th>
                      <th className="text-right">{tt('Open')}</th>
                      <th className="text-right">{tt('Click')}</th>
                      <th className="text-right">{tt('Conv')}</th>
                      <th className="text-right">{tt('Unsub')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeys.map((j) => (
                      <tr key={tt(j.name)} className="border-t border-black/5">
                        <td className="py-2.5 font-semibold">{tt(j.name)}</td>
                        <td className="text-right">{j.sends.toLocaleString()}</td>
                        <td className="text-right">{j.open}%</td>
                        <td className="text-right">{j.click}%</td>
                        <td className={`text-right font-bold ${j.conv >= 5 ? 'text-emerald-600' : 'text-vfes-dark'}`}>{j.conv}%</td>
                        <td className={`text-right ${j.unsub > 1 ? 'text-amber-600' : ''}`}>{j.unsub}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Save-desk inbound = highest leverage · 38% conv on inbound calls')}</div>
            </Panel>
          </div>
          <Panel title={tt('Win-back · Save Rate')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={winBack}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[25, 40]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="offered" name={tt('Offered')} fill={RED4} />
                  <Bar yAxisId="l" dataKey="saved" name={tt('Saved')} fill={RED} />
                  <Line yAxisId="r" type="monotone" dataKey="rate" name={tt('Save rate %')} stroke={DARK} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ AI ACTIONS ═══════ */}
      {tab === 'ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live anomalies')}      value="3"     delta="1 high-sev"  trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Reallocations queued')} value="3"    delta="BSD 88K total" trend="up"    icon={GitBranch} />
          <KpiCard label={tt('Forecast net adds (30d)')} value="+352" delta="if approved" trend="up" icon={ArrowUpRight} />
          <KpiCard label={tt('Cortex queries this wk')} value="412" delta="+24% vs LW" trend="up"   icon={Sparkles} />
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

          <Panel title={tt('Recommended Reallocations · MMM-driven')}>
            <div className="space-y-2">
              {reallocations.map((r, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs">
                      <span className="font-mono text-vfes-dark/55">{r.from}</span>
                      <span className="mx-2">→</span>
                      <span className="font-bold text-vfes-dark">{r.to}</span>
                    </div>
                    <div className="text-xs font-bold">BSD {r.amt}K</div>
                  </div>
                  <div className="text-[10px] text-vfes-dark/65">{r.reason}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">Forecast Δ net adds <span className="text-emerald-600 font-bold">{r.deltaNetAdds}</span></div>
                    <button className="text-[10px] font-bold text-vfes-dark bg-vfes-red px-2 py-1 rounded hover:bg-vfes-red-dark">{tt('Approve')}</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · Marketing Prompts')}>
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
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('MARKETING_360')}</span></div>
            </Panel>
          </div>
          <Panel title={tt('Model Card · MMM v3.4')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Model')}</span><span className="font-mono text-xs">{tt('MMM_BAYES_V3_4')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Last refresh')}</span><span className="font-bold">{tt('04:00 UTC')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('R²')}</span><span className="font-bold text-emerald-600">0.91</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('MAPE')}</span><span className="font-bold">6.4%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Channels')}</span><span className="font-bold">{tt('8 paid + 3 owned')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Carry-over')}</span><span className="font-bold">{tt('28 days')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('Marketing Analytics')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Snowflake ML Registry · Cortex Agent enabled')}</div>
          </Panel>
        </div>

        <MlInsightSection
          heading="Marketing attribution"
          models={[
            { name: 'MMM model v3.4',      metric: '0.91 R²',   sub: 'Bayesian media mix · 8 channels' },
            { name: 'Attribution model',   metric: '94% match', sub: 'Data-driven vs last-touch delta' },
            { name: 'Win-back propensity', metric: '82% AUC',   sub: 'Lapsed customer reactivation score' },
          ]}
          agentLabel="Run Attribution Refresh"
          agentSteps={[
            'Pulled last-touch, first-touch, linear and DDA models',
            'Compared MMM-blended incrementality vs attribution delta',
            'Flagged channels with model divergence >15 pp',
            'Recommended budget reallocation based on true incrementality',
          ]}
          agentBlurb="Attribution agent reconciles MMM and multi-touch models daily at 04:00 UTC."
          decision={{
            title: 'Email and CRM are 3–5× undervalued in last-touch attribution',
            detail: 'Switching to data-driven attribution shifts BSD 220K from Display to Email/CRM, improving net MER by 0.4×.',
            impact: '+0.4× MER from reallocation',
            risk: 'TV halo is partially captured via MMM only — do not zero-out TV in short-run models',
            linkTo: '/portal/ai-insights',
            linkLabel: 'Open AI Insights',
          }}
          chart={{
            kind: 'bar',
            title: 'Attribution delta: Last-touch vs Data-driven (pp)',
            data: attributionChannels.map(c => ({ ch: c.ch, delta: c.dda - c.lastTouch })),
            xKey: 'ch',
            series: [{ key: 'delta', name: 'DDA minus Last-touch (pp)', color: '#FF4438' }],
            note: 'Positive = under-credited in last-touch; negative = over-credited.',
          }}
        />
      </>)}

      {/* ═══════ ATTRIBUTION ═══════ */}
      {tab === 'attribution' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Data-driven CPA')}   value="BSD 82"   delta="−BSD 6 vs last-touch"  trend="up"   icon={Target} accent />
          <KpiCard label={tt('Avg path length')}    value="3.2"   delta="+0.2 vs LQ"        trend="flat" icon={GitBranch} />
          <KpiCard label={tt('Cross-device rate')}  value="38%"   delta="+4 pp"             trend="up"   icon={Smartphone} />
          <KpiCard label={tt('TV halo captured')}   value="92%"   delta="MMM-blended"       trend="up"   icon={Sparkles} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Attribution Model Comparison · Channel %')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={attributionChannels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="ch" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="firstTouch" name={tt('First touch')} fill={RED4} />
                  <Bar dataKey="lastTouch"  name={tt('Last touch')}  fill={RED2} />
                  <Bar dataKey="linear"     name={tt('Linear')}      fill={RED} />
                  <Bar dataKey="dda"        name={tt('Data-driven')} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Path Length vs Conversion Rate')}>
            <div className="h-80">
              <ResponsiveContainer>
                <ComposedChart data={pathLengths}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="touches" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="share" name={tt('Volume share %')} fill={RED4} />
                  <Line yAxisId="r" type="monotone" dataKey="conv" name={tt('Conv rate %')} stroke={RED} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Top Converting Paths')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Path')}</th>
                  <th className="text-right">{tt('Conversions')}</th>
                  <th className="text-right">{tt('Share')}</th>
                  <th className="text-right">{tt('CPA')}</th>
                </tr>
              </thead>
              <tbody>
                {topConvPaths.map((p) => (
                  <tr key={p.path} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(p.path)}</td>
                    <td className="text-right font-bold">{p.convs.toLocaleString()}</td>
                    <td className="text-right">{p.share}%</td>
                    <td className={`text-right font-bold ${p.cpa <= 40 ? 'text-emerald-600' : p.cpa <= 80 ? 'text-amber-600' : 'text-red-600'}`}>BSD {p.cpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Data-driven attribution · Snowflake Cortex · updated 04:00 UTC')}</div>
        </Panel>
      </>)}

      {/* ═══════ CONTENT & SEO ═══════ */}
      {tab === 'content' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Organic sessions')} value="182K"  delta="+24% MoM"   trend="up" icon={Globe} accent />
          <KpiCard label={tt('Organic leads')}     value="14.4K" delta="+18%"       trend="up" icon={Users} />
          <KpiCard label={tt('Avg position')}       value="2.4"   delta="−0.6"       trend="up" icon={Award} />
          <KpiCard label={tt('SEO / Paid mix')}     value="41:59" delta="+5 pp SEO" trend="up" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('SEO vs Paid Search · Monthly Leads')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={seoVsPaidTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="paid" stackId="1" name={tt('Paid search')} stroke={RED4} fill={RED4} fillOpacity={0.8} />
                    <Area type="monotone" dataKey="seo" stackId="1" name={tt('Organic SEO')} stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title={tt('Top Organic Keywords')}>
            <div className="space-y-2 text-sm">
              {organicKeywords.map((k) => (
                <div key={k.kw} className="border-b border-black/5 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs">{k.kw}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${k.pos <= 2 ? 'bg-emerald-100 text-emerald-700' : k.pos <= 4 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>#{k.pos}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-vfes-dark/55">
                    <span>Vol <span className="font-bold">{(k.vol / 1000).toFixed(1)}K</span></span>
                    <span>Clicks <span className="font-bold">{(k.clicks / 1000).toFixed(1)}K</span></span>
                    <span>CTR <span className="font-bold text-vfes-dark">{k.ctr}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Content Performance · Revenue Attribution')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Article')}</th>
                  <th>{tt('Stage')}</th>
                  <th className="text-right">{tt('Visits')}</th>
                  <th className="text-right">{tt('Leads')}</th>
                  <th className="text-right">{tt('Conv')}</th>
                </tr>
              </thead>
              <tbody>
                {contentPieces.map((c) => (
                  <tr key={c.title} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{tt(c.title)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${c.stage === 'BoFu' ? 'bg-emerald-100 text-emerald-700' : c.stage === 'MoFu' ? 'bg-amber-100 text-amber-700' : c.stage === 'Brand' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{c.stage}</span></td>
                    <td className="text-right">{c.visits.toLocaleString()}</td>
                    <td className="text-right font-bold">{c.leads.toLocaleString()}</td>
                    <td className={`text-right font-bold ${c.conv >= 5 ? 'text-emerald-600' : c.conv >= 2.5 ? 'text-amber-600' : 'text-red-600'}`}>{c.conv}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ═══════ LIFECYCLE ═══════ */}
      {tab === 'lifecycle' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net MRR growth')}  value="+BSD 228K" delta="+BSD 14K MoM"   trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Expansion MRR')}   value="BSD 92K"   delta="+12% MoM"   trend="up" icon={ArrowUpRight} />
          <KpiCard label={tt('Churn MRR')}        value="−BSD 28K"  delta="−BSD 10K MoM"  trend="up" icon={Activity} />
          <KpiCard label={tt('M12 retention')}    value="91.4%"  delta="+0.8 pp YoY" trend="up" icon={Heart} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MRR Waterfall · Monthly')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={lifecycleMrr}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="newMRR"          name={tt('New')}        fill="#10b981" stackId="a" />
                  <Bar dataKey="expansionMRR"    name={tt('Expansion')}  fill={RED}     stackId="a" />
                  <Bar dataKey="contractionMRR" name={tt('Contraction')} fill="#f59e0b" stackId="a" />
                  <Bar dataKey="churnMRR"         name={tt('Churn')}      fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Retention Cohorts · M0–M12')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={retentionCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[88, 101]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="jan" name={tt('Jan cohort')} stroke={RED}  dot strokeWidth={2} connectNulls={false} />
                  <Line type="monotone" dataKey="feb" name={tt('Feb cohort')} stroke={RED2} dot strokeWidth={2} connectNulls={false} />
                  <Line type="monotone" dataKey="mar" name={tt('Mar cohort')} stroke={RED3} dot strokeWidth={2} connectNulls={false} />
                  <Line type="monotone" dataKey="apr" name={tt('Apr cohort')} stroke={RED4} dot strokeWidth={2} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Lifecycle Segments · Health')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Lifecycle stage')}</th>
                  <th className="text-right">{tt('Customers')}</th>
                  <th className="text-right">{tt('30d churn rate')}</th>
                  <th className="text-right">{tt('NPS')}</th>
                  <th className="text-right">{tt('ARPU')}</th>
                </tr>
              </thead>
              <tbody>
                {lifecycleSegments.map((s) => (
                  <tr key={s.stage} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{tt(s.stage)}</td>
                    <td className="text-right">{s.count.toLocaleString()}</td>
                    <td className={`text-right font-bold ${s.churn <= 1.5 ? 'text-emerald-600' : s.churn <= 4 ? 'text-amber-600' : 'text-red-600'}`}>{s.churn}%</td>
                    <td className={`text-right font-bold ${s.nps >= 50 ? 'text-emerald-600' : s.nps >= 30 ? 'text-amber-600' : 'text-red-600'}`}>{s.nps}</td>
                    <td className="text-right">BSD {s.arpu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}
    </div>
  )
}
