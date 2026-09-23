import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Brain, Sparkles, AlertTriangle, TrendingUp, Zap, Activity, Target,
  ArrowUpRight, Bell, ShieldCheck, Users, Phone, Globe, MessageCircle,
  Heart, ThumbsUp, ThumbsDown, Send, Calendar, GitBranch, DollarSign,
  Trophy, FlaskConical, Award, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine, ScatterChart, Scatter, RadialBarChart, RadialBar,
} from 'recharts'
import { MOBILE_INSIGHTS } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── data ─────────
const headline = {
  realisedQTD: 4.8,        // BSD M from AI this Q
  realisedTarget: 6.2,     // BSD M Q target
  arrUplift: 12.4,         // BSD M annualised
  churnSaved: 18_400,      // customers
  fraudBlocked: 1.4,       // BSD M
  aiTouchedRevenue: 38,    // %
  roi: 9.2,                // ×
  paybackMo: 1.4,
  decisionsPerWeek: 412_000,
  decisionsTrend: 18,      // %
}

const realisedTrend = [
  { m: 'Jan', baseline: 0.8, ai: 1.2 },
  { m: 'Feb', baseline: 0.9, ai: 1.6 },
  { m: 'Mar', baseline: 0.9, ai: 1.9 },
  { m: 'Apr', baseline: 1.0, ai: 2.4 },
  { m: 'May', baseline: 1.0, ai: 2.8 },
  { m: 'Jun', baseline: 1.1, ai: 3.4 },
  { m: 'Jul', baseline: 1.1, ai: 4.1 },
  { m: 'Aug', baseline: 1.2, ai: 4.8 },
]

const aiPortfolio = [
  { area: 'Retention',   realised: 1.84, color: RED },
  { area: 'Cross-sell',  realised: 1.12, color: RED2 },
  { area: 'Upsell',      realised: 0.94, color: RED3 },
  { area: 'Acquisition', realised: 0.62, color: RED4 },
  { area: 'Fraud',       realised: 0.18, color: RED5 },
  { area: 'Service',     realised: 0.10, color: '#94a3b8' },
]

const winsLosses = [
  { wk: 'W1', wins: 12, losses: 2 },
  { wk: 'W2', wins: 14, losses: 3 },
  { wk: 'W3', wins: 16, losses: 2 },
  { wk: 'W4', wins: 18, losses: 4 },
  { wk: 'W5', wins: 21, losses: 3 },
  { wk: 'W6', wins: 24, losses: 2 },
  { wk: 'W7', wins: 26, losses: 5 },
  { wk: 'W8', wins: 29, losses: 3 },
]

const weeklyReadout = [
  { headline: 'AI-driven save desk recovered BSD 1.84M ARR', detail: '4,820 high-LTV churners contacted with personalised offers · 38% save rate (vs 22% control)', tag: 'Win' },
  { headline: 'REVConnect cross-sell to Freeport BB-only HHs delivered +BSD 240K MRR', detail: '14.2% propensity model identified 18.4K eligible HHs · campaign ran W6–W8', tag: 'Win' },
  { headline: 'Speed-upgrade campaign in Abaco under-performed by 28%', detail: 'Promo design (BSD 10 BC) too shallow for income segment · re-priced at BSD 15 BC for next wave', tag: 'Learning' },
  { headline: 'Fraud model blocked 1,420 high-risk applications', detail: 'BSD 1.4M in losses avoided · false-positive rate held at 4.2%', tag: 'Win' },
  { headline: 'Network anomaly model caught Freeport outage 47 min early', detail: 'Save desk inbound spike avoided · est. BSD 92K complaint cost averted', tag: 'Win' },
]

// Right-now insights & recommendations
const insights = [
  { id: 'INS-441', title: 'Save 4,820 high-LTV customers at risk this week', impact: 2.10, conf: 92, ttl: '5 days', area: 'Retention', owner: 'Save Desk', detail: 'Cortex churn model V3.7 · contact via outbound + Braze · personalised offer mix' },
  { id: 'INS-438', title: 'Cross-sell REVConnect to 18.4K Freeport BB-only HHs',         impact: 1.40, conf: 88, ttl: '14 days', area: 'Cross-sell', owner: 'Marketing', detail: '14.2% propensity · estimated 2,612 takers · margin-positive at BSD 84/mo' },
  { id: 'INS-435', title: 'Upgrade 12,400 households from 250→1 Gb',           impact: 0.94, conf: 84, ttl: '21 days', area: 'Upsell', owner: 'CRM', detail: 'Speed-upgrade likelihood model · BSD 15 BC · estimated 1,860 conversions' },
  { id: 'INS-433', title: 'Win-back 18,200 lapsed customers (≤90 days out)',    impact: 0.84, conf: 81, ttl: '30 days', area: 'Win-back', owner: 'Marketing', detail: 'Win-back model · 36% expected save rate · BSD 15 BC depth' },
  { id: 'INS-431', title: 'Re-allocate BSD 100K from Display → Search brand defence', impact: 0.32, conf: 78, ttl: '7 days', area: 'Marketing', owner: 'Media', detail: 'MMM model · Benchmark A The Bahamas bidding our brand terms · expected +184 net adds in 30d' },
  { id: 'INS-430', title: 'Refer 86 mid-market accounts at expansion-ready stage', impact: 1.20, conf: 74, ttl: '30 days', area: 'B2B', owner: 'Sales', detail: 'Account-expansion model · avg BSD 14K TCV uplift · 12% close prob' },
]

// Right-now anomalies (business-flavoured)
const anomalies = [
  { sev: 'High',   when: '14:00', what: 'Freeport churn signal +14% WoW · Benchmark A The Bahamas Fibre BSD 40 promo correlation', loss: 'BSD 1.2M ARR risk' },
  { sev: 'Medium', when: '11:20', what: 'Search CPC +18% on "fastest broadband bahamas" — Benchmark A The Bahamas bidding our brand', loss: 'BSD 4.2K / day waste' },
  { sev: 'Low',    when: '08:45', what: 'B2B SoHo Hosted Voice attach rate down 4 pp', loss: 'monitor' },
  { sev: 'High',   when: 'Yest',   what: 'High-LTV at-risk pool grew by 412 customers (engagement model)',         loss: 'BSD 84K MRR exposure' },
]

// Opportunities (segments)
const opportunities = [
  { name: 'High-value at-risk',  size: 4820,   propensity: 38, mrr: 428,  ltv: 1.84, action: 'Retention offer · BSD 15 BC + 6mo Sports add-on · Sports package', channel: 'Save desk + Braze' },
  { name: 'Upsell to gigabit',   size: 38400,  propensity: 14, mrr: 576,  ltv: 0.94, action: 'Speed upgrade · BSD 15 BC', channel: 'CRM email + outbound' },
  { name: 'Mobile cross-sell (REVConnect)', size: 92100, propensity: 9, mrr: 1840, ltv: 2.40, action: 'Bundle offer · BB+Mobile BSD 84', channel: 'Web + retail + CRM' },
  { name: 'Win-back lapsed (≤90d)', size: 18200, propensity: 36, mrr: 364, ltv: 0.84, action: 'Returner promo', channel: 'Outbound + email' },
  { name: 'B2B SoHo Hosted Voice', size: 4800,  propensity: 18, mrr: 38,  ltv: 0.42, action: 'Voice add-on bundle', channel: 'Sales rep + email' },
  { name: 'TV add-on (Sports add-on · Sports package)', size: 86000, propensity: 8.6, mrr: 92, ltv: 0.32, action: 'Sport pack 6mo intro', channel: 'CRM + web' },
]

// Risks (business)
const risks = [
  { name: 'Churn pipeline · 30-day risk',    metric: '8,420 HHs', impact: 'BSD 1.84M ARR', sev: 'High',   trend: '+12% WoW', action: 'Activate INS-441' },
  { name: 'Contract-end cliff · next 60d',    metric: '11.4K contracts', impact: 'BSD 2.10M ARR', sev: 'High', trend: 'Calendar', action: 'Pre-emptive renewal offers' },
  { name: 'Fraud watch · application',         metric: '142 high-risk', impact: 'BSD 124K loss avoided', sev: 'Medium', trend: '+2% WoW', action: 'Block + manual review' },
  { name: 'Network-driven churn risk',         metric: '4 hotspots',   impact: 'BSD 640K ARR', sev: 'Medium', trend: 'Freeport+Abaco', action: 'Save desk pre-empt outbound' },
  { name: 'Competitor pressure (Benchmark A The Bahamas Fibre BSD 40)', metric: 'High-LTV exposure', impact: 'BSD 1.40M ARR', sev: 'High', trend: '+18% lost deals', action: 'Match offer for at-risk only' },
  { name: 'B2B late-quarter slip',              metric: '3 deals · BSD 580K', impact: 'BSD 580K Q', sev: 'Medium', trend: 'Negotiation > 21d', action: 'Multi-thread + exec sponsor' },
]

const forecast90d = [
  { d: 'Wk 1',  base: 7.2, opt: 8.4, low: 6.1 },
  { d: 'Wk 2',  base: 7.4, opt: 8.7, low: 6.2 },
  { d: 'Wk 3',  base: 7.6, opt: 9.0, low: 6.3 },
  { d: 'Wk 4',  base: 7.8, opt: 9.3, low: 6.4 },
  { d: 'Wk 5',  base: 8.0, opt: 9.6, low: 6.5 },
  { d: 'Wk 6',  base: 8.2, opt: 9.8, low: 6.6 },
  { d: 'Wk 7',  base: 8.4, opt: 10.1, low: 6.8 },
  { d: 'Wk 8',  base: 8.6, opt: 10.4, low: 6.9 },
  { d: 'Wk 9',  base: 8.8, opt: 10.6, low: 7.0 },
  { d: 'Wk 10', base: 9.0, opt: 10.9, low: 7.1 },
  { d: 'Wk 11', base: 9.2, opt: 11.2, low: 7.2 },
  { d: 'Wk 12', base: 9.4, opt: 11.5, low: 7.3 },
]

// Customer voice / sentiment (AI on unstructured)
const voiceTopics = [
  { topic: 'Network speed',    pos: 68, neg: 14, mentions: 4820, dEbitda: '+BSD 84K',  trend: 'up' },
  { topic: 'Pricing / value',  pos: 32, neg: 48, mentions: 6240, dEbitda: '-BSD 142K', trend: 'down' },
  { topic: 'Customer care',    pos: 41, neg: 36, mentions: 3120, dEbitda: '-BSD 38K',  trend: 'flat' },
  { topic: 'Sports add-on · Sports package',       pos: 72, neg: 12, mentions: 1840, dEbitda: '+BSD 92K',  trend: 'up' },
  { topic: 'Install / engineer', pos: 38, neg: 39, mentions: 2210, dEbitda: '-BSD 48K', trend: 'down' },
  { topic: 'Brand purpose',    pos: 78, neg: 8,  mentions: 612,   dEbitda: '+BSD 18K',  trend: 'up' },
]

const emergingThemes = [
  { theme: '"5 Gb beta" enthusiasm in Nassau', mentions: 412, dWk: '+62%', sentiment: '+0.84', tag: 'opportunity' },
  { theme: 'Benchmark A The Bahamas Fibre BSD 40 price compare',       mentions: 1480, dWk: '+38%', sentiment: '-0.42', tag: 'risk' },
  { theme: 'REVConnect Mobile dropouts in rural',      mentions: 184, dWk: '+24%', sentiment: '-0.66', tag: 'risk' },
  { theme: 'Sports add-on · Sports package goal-line tech praise',   mentions: 96,   dWk: '+18%', sentiment: '+0.78', tag: 'opportunity' },
]

// Wins back-tested (predicted vs realised)
const backtest = [
  { campaign: 'High-LTV Save Desk W1-W4',          predicted: 1.6, realised: 1.84, mape: 13.0, status: 'Beat' },
  { campaign: 'REVConnect Cross-sell · Freeport',             predicted: 1.2, realised: 1.12, mape: 6.7, status: 'Hit' },
  { campaign: '500 Mb Switch & Save · National',     predicted: 0.96, realised: 0.94, mape: 2.1, status: 'Hit' },
  { campaign: 'Win-back lapsed (≤90d)',              predicted: 0.84, realised: 0.62, mape: 26.2, status: 'Miss' },
  { campaign: 'Speed-upgrade · Abaco',              predicted: 0.42, realised: 0.30, mape: 28.6, status: 'Miss' },
  { campaign: 'Fraud block · Application',           predicted: 1.20, realised: 1.40, mape: 14.3, status: 'Beat' },
]

// What-if scenarios (lever cards)
const scenarios = [
  {
    name: 'Run BSD 15 BC win-back to lapsed (≤90d)',
    levers: ['Offer depth: BSD 15 BC', 'Audience: 18,200 lapsed', 'Channel: outbound + email', 'Suppression: contacted < 30d'],
    upside: '+BSD 840K ARR · 36% save rate', downside: '-BSD 220K margin · risk 14%', confidence: 81,
  },
  {
    name: 'Hold Sports add-on · Sports package promo 4 more weeks',
    levers: ['Promo: 6 mo intro BSD 5', 'Audience: BB+TV 86K HHs', 'Margin hit: -8 pp', 'Net adds forecast: +1,420'],
    upside: '+BSD 640K MRR', downside: '-BSD 92K margin', confidence: 78,
  },
  {
    name: 'Re-allocate BSD 100K to highest-incrementality channel',
    levers: ['Source: Display + late-night TV', 'To: Search brand-defence + YouTube 6s', 'Horizon: 30 days'],
    upside: '+BSD 420K MRR · +352 net adds', downside: '-12% reach (brand)', confidence: 86,
  },
  {
    name: 'Match Benchmark A The Bahamas BSD 40 offer for at-risk only',
    levers: ['Audience: 4,820 high-LTV at-risk', 'Depth: BSD 5 / mo for 6 mo', 'Trigger: churn risk > 30%'],
    upside: '+BSD 1.04M ARR (saves)', downside: '-BSD 340K margin · perception risk', confidence: 74,
  },
]

const cortexPromptsBiz = [
  { q: 'What is our biggest revenue risk this quarter?',                action: 'Run' },
  { q: 'Where should I put the next BSD 100K to maximise net adds?',        action: 'Run' },
  { q: 'Which customers should the save desk call today?',               action: 'Run' },
  { q: 'Forecast Q-end if we hold the current promo mix',                action: 'Run' },
  { q: 'What\'s the biggest cross-sell opportunity in B2B SoHo?',         action: 'Run' },
  { q: 'Show me the 10 highest-LTV at-risk customers right now',         action: 'Run' },
  { q: 'How much MRR did AI save us last week?',                          action: 'Run' },
  { q: 'Which competitor move is hurting us most this month?',           action: 'Run' },
]

// ─────────── extra data ───────────
const npsWeekly = [
  { wk: 'W1', nps: 32, detractors: 22, promoters: 54 },
  { wk: 'W2', nps: 34, detractors: 21, promoters: 55 },
  { wk: 'W3', nps: 33, detractors: 22, promoters: 55 },
  { wk: 'W4', nps: 36, detractors: 20, promoters: 56 },
  { wk: 'W5', nps: 38, detractors: 19, promoters: 57 },
  { wk: 'W6', nps: 41, detractors: 18, promoters: 59 },
  { wk: 'W7', nps: 39, detractors: 20, promoters: 59 },
  { wk: 'W8', nps: 44, detractors: 17, promoters: 61 },
]
const csat12m = [
  { m: 'Jan', csat: 74 }, { m: 'Feb', csat: 76 }, { m: 'Mar', csat: 75 },
  { m: 'Apr', csat: 77 }, { m: 'May', csat: 79 }, { m: 'Jun', csat: 78 },
  { m: 'Jul', csat: 80 }, { m: 'Aug', csat: 82 },
]
const voiceChannelMix = [
  { channel: 'Calls', vol: 42400, aiResolved: 61 },
  { channel: 'Chat', vol: 28100, aiResolved: 74 },
  { channel: 'Social', vol: 12800, aiResolved: 42 },
  { channel: 'Email', vol: 9400, aiResolved: 38 },
  { channel: 'App', vol: 18200, aiResolved: 68 },
]
const topCxComplaints = [
  { complaint: 'Speed below advertised', vol: 3840, dWk: '+12%', estCost: 'BSD 82K' },
  { complaint: 'Engineer no-show', vol: 2210, dWk: '-4%', estCost: 'BSD 48K' },
  { complaint: 'Billing error', vol: 1920, dWk: '+8%', estCost: 'BSD 28K' },
  { complaint: 'Long hold time', vol: 1640, dWk: '-11%', estCost: 'BSD 22K' },
  { complaint: 'TV EPG glitch', vol: 880, dWk: '+21%', estCost: 'BSD 14K' },
]
const modelRegistry = [
  { name: 'Churn Propensity V3.7', area: 'Retention', auc: 0.924, precision: 0.81, recall: 0.76, f1: 0.785, drift: 0.02, lastRetrain: '2025-08-01', status: 'Healthy' },
  { name: 'Cross-sell Propensity V2.1', area: 'Sales', auc: 0.881, precision: 0.74, recall: 0.68, f1: 0.709, drift: 0.04, lastRetrain: '2025-07-15', status: 'Healthy' },
  { name: 'Fraud Detection V4.2', area: 'Risk', auc: 0.962, precision: 0.94, recall: 0.88, f1: 0.909, drift: 0.01, lastRetrain: '2025-07-28', status: 'Healthy' },
  { name: 'ARPU Forecast V1.8', area: 'Finance', auc: 0, precision: 0, recall: 0, f1: 0, drift: 0.08, lastRetrain: '2025-06-10', status: 'Drift Alert' },
  { name: 'Upsell Likelihood V2.3', area: 'Sales', auc: 0.856, precision: 0.71, recall: 0.64, f1: 0.673, drift: 0.03, lastRetrain: '2025-08-05', status: 'Healthy' },
  { name: 'Network Anomaly V3.1', area: 'Ops', auc: 0.948, precision: 0.91, recall: 0.84, f1: 0.874, drift: 0.02, lastRetrain: '2025-07-20', status: 'Healthy' },
]
const modelDriftTrend = [
  { d: 'Wk-6', churn: 0.018, fraud: 0.009, upsell: 0.024 },
  { d: 'Wk-5', churn: 0.020, fraud: 0.010, upsell: 0.026 },
  { d: 'Wk-4', churn: 0.019, fraud: 0.011, upsell: 0.029 },
  { d: 'Wk-3', churn: 0.021, fraud: 0.010, upsell: 0.028 },
  { d: 'Wk-2', churn: 0.022, fraud: 0.012, upsell: 0.031 },
  { d: 'Wk-1', churn: 0.020, fraud: 0.011, upsell: 0.030 },
]
const inferenceVolume = [
  { d: 'Mon', calls: 68400 }, { d: 'Tue', calls: 72100 }, { d: 'Wed', calls: 80400 },
  { d: 'Thu', calls: 74200 }, { d: 'Fri', calls: 69800 }, { d: 'Sat', calls: 42100 }, { d: 'Sun', calls: 34600 },
]
const networkAnomalies = [
  { ts: '14:02', site: 'Nassau-NOC-04', signal: 'RAN load +38% vs hourly baseline', severity: 'High', prediction: 'Cell congestion in 22 min', action: 'Load balance to adjacent cells' },
  { ts: '13:48', site: 'Freeport-CMTS-12', signal: 'Downstream SNR drop 3.2 dB', severity: 'Medium', prediction: 'Service degradation ~640 subs', action: 'Schedule maintenance window' },
  { ts: '13:21', site: 'Abaco-BB-07', signal: 'Fibre reflectance anomaly +14%', severity: 'Medium', prediction: 'Partial fibre fault within 72h', action: 'Dispatch pre-emptive field visit' },
  { ts: '12:55', site: 'Eleuthera-POP-02', signal: 'IP core jitter spike 18ms', severity: 'Low', prediction: 'Monitor only', action: 'Auto-ticket raised' },
]
const predMaintenanceSavings = [
  { month: 'Apr', reactive: 48, predictive: 12 },
  { month: 'May', reactive: 42, predictive: 10 },
  { month: 'Jun', reactive: 38, predictive: 9 },
  { month: 'Jul', reactive: 44, predictive: 11 },
  { month: 'Aug', reactive: 36, predictive: 8 },
]
const networkKpis = [
  { kpi: 'AI-predicted outages caught early', value: '84%', trend: '+6 pp QoQ' },
  { kpi: 'Mean time to detection', value: '4.2 min', trend: '-1.8 min vs manual' },
  { kpi: 'False-positive rate', value: '3.8%', trend: '-0.6 pp' },
  { kpi: 'Field dispatch savings', value: 'BSD 840K', trend: 'this quarter' },
]

// ───────── tabs ─────────
type TabId = 'impact' | 'now' | 'opps' | 'risks' | 'ask' | 'voice' | 'model' | 'net-ai'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'impact',  label: 'Impact',           icon: Trophy },
  { id: 'now',     label: 'Right-Now',        icon: Zap },
  { id: 'opps',    label: 'Opportunities',    icon: Sparkles },
  { id: 'risks',   label: 'Risks & Forecast', icon: AlertTriangle },
  { id: 'ask',     label: 'Ask AI',           icon: Brain },
  { id: 'voice',   label: 'Customer Voice',   icon: MessageCircle },
  { id: 'model',   label: 'Model Perf',       icon: FlaskConical },
  { id: 'net-ai',  label: 'Network AI',       icon: Activity },
]

const sevColor = (s: string) => s === 'High' ? 'bg-red-100 text-red-700' : s === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const tagColor = (t: string) => t === 'Win' ? 'bg-emerald-100 text-emerald-700' : t === 'Learning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
const statusColor = (s: string) => s === 'Beat' ? 'text-emerald-600' : s === 'Hit' ? 'text-vfes-dark/80' : 'text-red-600'
const themeTagColor = (t: string) => t === 'opportunity' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'

export default function AIInsightsPage() {
  const [tab, setTab] = useState<TabId>('impact')
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [budget, setBudget] = useState(100)
  const [offer, setOffer] = useState(15)
  const [voiceFilter, setVoiceFilter] = useState<string>('all')
  const [modelMetric, setModelMetric] = useState<'auc' | 'precision' | 'recall'>('auc')
  const [netAiFilter, setNetAiFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all')
  const topRef = useRef<HTMLDivElement>(null)
  const prevTab = useRef<TabId>(tab)
  useEffect(() => { if (prevTab.current !== tab) { prevTab.current = tab } }, [tab])
  const filteredNetAnomalies = useCallback(
    () => netAiFilter === 'all' ? networkAnomalies : networkAnomalies.filter((a) => a.severity === netAiFilter),
    [netAiFilter]
  )
  const activeModelCount = useMemo(() => modelRegistry.filter((m) => m.status === 'Healthy').length, [])

  const totalQueuedImpact = useMemo(() => insights.reduce((s, i) => s + i.impact, 0), [])
  const aiVsBaseline = useMemo(() => realisedTrend.reduce((s, r) => s + (r.ai - r.baseline), 0), [])

  const sim = useMemo(() => {
    // simple lever simulator for scenario card
    const pickedConf = scenarios[scenarioIdx].confidence / 100
    const upside = (offer / 15) * (budget / 100) * 0.84 * pickedConf
    const margin = (offer / 15) * (budget / 100) * 0.22
    const net = upside - margin
    return { upside, margin, net }
  }, [scenarioIdx, budget, offer])

  return (
    <div className="p-8" ref={topRef}>
      <PageHeader
        title={tt('AI Insights')}
        subtitle={tt('Business-grade insights · what AI is telling us to do, and how much money is involved')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cortex live · 412K decisions / wk
            </span>
          </div>
        }
      />

      <MlInsightSection
        heading={tt('AI Portfolio intelligence')}
        models={[
          { name: 'Churn Propensity V3.7', metric: 'AUC 0.924', sub: '18,400 customers saved this Q' },
          { name: 'Cross-sell Propensity V2.1', metric: 'AUC 0.881', sub: 'Freeport BB → REVConnect conversion' },
          { name: 'Fraud Detection V4.2', metric: 'AUC 0.962', sub: 'BSD 1.4M losses avoided · FP rate 4.2%' },
        ]}
        agentLabel={tt('Run Portfolio Agent')}
        agentRunningLabel={tt('Analysing portfolio…')}
        agentSteps={[
          tt('Ranked BSD M impact across all 6 AI use-cases'),
          tt('Identified top 3 levers to close BSD 0.6M Q-end gap'),
          tt('Proposed activation sequence with confidence scores'),
          tt('Routed approvals to Save Desk, Marketing & Finance'),
        ]}
        agentBlurb={tt('The agent scans the whole AI portfolio in real time and recommends the highest-impact lever to pull next — so you always know where to put the budget.')}
        decision={{
          title: tt('Activate INS-441 — Save 4,820 high-LTV customers before the 5-day window closes'),
          detail: tt('Churn model V3.7 scores 92% confidence. Running the save-desk outbound now recovers an estimated BSD 2.1M ARR at a margin-positive cost of BSD 340K.'),
          impact: tt('BSD 2.1M ARR recovered · 4,820 customers retained'),
          risk: tt('38% save rate assumed · historical range 30–45%'),
          linkTo: '#/portal/churn-retention',
          linkLabel: tt('Open Churn & Retention'),
        }}
        chart={{
          kind: 'bar',
          title: tt('AI portfolio · BSD  realised QTD by area'),
          xKey: 'area',
          unit: 'M',
          data: aiPortfolio.map((a) => ({ area: a.area, realised: a.realised })),
          series: [{ key: 'realised', name: tt('BSD M realised'), color: '#FF4438' }],
          note: tt('Retention leads the portfolio — double the next area'),
        }}
      />

      {/* live alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('BSD 1.2M ARR at risk this week · Freeport churn signal +14% WoW')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Benchmark A The Bahamas Fibre BSD 40 promo correlation · 4,820 high-LTV customers · save-desk window 5 days
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('recommend INS-441')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('expected save rate 38%')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Approve →')}</button>
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

      {/* ═══════ IMPACT ═══════ */}
      {tab === 'impact' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('BSD  realised QTD')}   value={`BSD ${headline.realisedQTD.toFixed(1)}M`} delta={`${Math.round(headline.realisedQTD/headline.realisedTarget*100)}% of BSD ${headline.realisedTarget}M target`} trend="up" icon={DollarSign} accent />
          <KpiCard label={tt('ARR uplift')}        value={`BSD ${headline.arrUplift}M`}             delta="annualised"    trend="up" icon={TrendingUp} />
          <KpiCard label={tt('AI ROI')}            value={`${headline.roi}×`}                    delta={`payback ${headline.paybackMo} mo`} trend="up" icon={Sparkles} />
          <KpiCard label={tt('AI-touched revenue')} value={`${headline.aiTouchedRevenue}%`}      delta="+6 pp QoQ"     trend="up" icon={Target} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Customers saved')}   value={headline.churnSaved.toLocaleString()}  delta="this Q"        trend="up" icon={Heart} />
          <KpiCard label={tt('Fraud avoided')}     value={`BSD ${headline.fraudBlocked}M`}           delta="this Q"        trend="up" icon={ShieldCheck} />
          <KpiCard label={tt('AI decisions / wk')} value={`${(headline.decisionsPerWeek/1000).toFixed(0)}K`} delta={`+${headline.decisionsTrend}% vs LW`} trend="up" icon={Brain} />
          <KpiCard label={tt('Top portfolio area')} value="Retention"                            delta="BSD 1.84M realised" trend="up" icon={Award} />
        </div>

        {/* Mobile-themed insights */}
        <Panel title={tt('Mobile-led insights')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Cortex · aliv Mobile')}</span>}>
          <div className="grid md:grid-cols-3 gap-4">
            {MOBILE_INSIGHTS.map((ins, i) => (
              <div key={i} className="rounded-lg border border-black/5 p-4 bg-[#fafbfc]">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-vfes-dark" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{tt(ins.agent)}</span>
                </div>
                <div className="font-semibold text-sm mb-1.5">{tt(ins.title)}</div>
                <div className="text-xs text-vfes-dark/65 mb-3">{tt(ins.detail)}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600">{ins.impact}</span>
                  <span className="text-vfes-dark/55">{tt('confidence')} {(ins.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('BSD  Realised · AI vs Baseline (no-AI counterfactual)')} insight={{ insight: 'The AI program has generated a widening cumulative uplift above the no-AI counterfactual across all eight months tracked.', action: 'Prioritize the top two portfolio areas for Q3 budget increase to sustain the compounding lift trajectory.', impact: 'Maintaining current acceleration rate projects an additional BSD 3M above the no-AI baseline by year-end.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={realisedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="baseline" name={tt('Baseline (no AI)')} stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="ai" name={tt('With AI')} stroke={RED} fill={RED} fillOpacity={0.45} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">Net AI uplift YTD <span className="font-bold text-vfes-dark">BSD {aiVsBaseline.toFixed(1)}M</span>{tt('· 8-month cumulative')}</div>
            </Panel>
          </div>
          <Panel title={tt('AI Portfolio · BSD  Realised by Area')} insight={{ insight: 'Retention leads the portfolio with returns more than double the next-best use-case area, revealing an uneven contribution mix.', action: 'Replicate the winning model architecture from Retention into the two lowest-contributing areas this quarter.', impact: 'Closing the contribution gap in two lagging areas could unlock an estimated BSD 1.2M in incremental realised value.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={aiPortfolio} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="realised" name={tt('BSD M')}>
                    {aiPortfolio.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Wins vs Losses · per Week')} insight={{ insight: 'Win rate has improved for three consecutive weeks with wins now outpacing losses at a 2:1 ratio across all active campaigns.', action: 'Run root-cause analysis on the remaining loss cases to feed the retraining queue with the highest-signal failures.', impact: 'Reducing the weekly loss count by 30% through targeted retraining is projected to recover BSD 180K per month.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={winsLosses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="wins" name={tt('Wins')} fill="#10b981" />
                  <Bar dataKey="losses" name={tt('Losses')} fill="#ef4444" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Weekly Readout · AI-driven Outcomes')}>
              <div className="space-y-2">
                {weeklyReadout.map((w, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-black/5 pb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${tagColor(w.tag)} shrink-0 mt-0.5`}>{tt(w.tag)}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{w.headline}</div>
                      <div className="text-[11px] text-vfes-dark/60 mt-0.5">{w.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Back-test · Predicted vs Realised')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Campaign')}</th>
                  <th className="text-right">{tt('Predicted')}</th>
                  <th className="text-right">{tt('Realised')}</th>
                  <th className="text-right">Δ</th>
                  <th className="text-right">{tt('MAPE')}</th>
                  <th>{tt('Outcome')}</th>
                </tr>
              </thead>
              <tbody>
                {backtest.map((b) => (
                  <tr key={b.campaign} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{b.campaign}</td>
                    <td className="text-right">BSD {b.predicted.toFixed(2)}M</td>
                    <td className="text-right font-bold">BSD {b.realised.toFixed(2)}M</td>
                    <td className={`text-right font-bold ${b.realised >= b.predicted ? 'text-emerald-600' : 'text-red-600'}`}>{((b.realised - b.predicted) / b.predicted * 100).toFixed(0)}%</td>
                    <td className="text-right text-xs text-vfes-dark/65">{b.mape}%</td>
                    <td><span className={`text-xs font-bold ${statusColor(b.status)}`}>{tt(b.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('2 beats · 2 hits · 2 misses · learnings shipped to retraining queue')}</div>
        </Panel>
      </>)}

      {/* ═══════ RIGHT-NOW ═══════ */}
      {tab === 'now' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Insights queued')}      value={`${insights.length}`} delta={`BSD ${totalQueuedImpact.toFixed(1)}M total`} trend="up" icon={Sparkles} accent />
          <KpiCard label={tt('Live anomalies')}       value={`${anomalies.length}`} delta={`${anomalies.filter(a => a.sev === 'High').length} high-sev`} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Time-to-act window')}   value="≤30 d"                 delta="3 expire this wk"     trend="flat" icon={Calendar} />
          <KpiCard label={tt('Confidence avg')}       value="83%"                   delta="2 below 75%"          trend="up" icon={Target} />
        </div>

        <Panel title={tt('Recommendations Queue · Approve · Defer · Decline')}>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.id} className="border border-black/5 rounded-lg p-4 hover:bg-black/[0.01]">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Impact')}</div>
                    <div className="text-lg font-extrabold text-vfes-dark">BSD {i.impact.toFixed(1)}M</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark bg-vfes-red/10 px-2 py-0.5 rounded">{i.area}</span>
                      <span className="font-mono text-[10px] text-vfes-dark/45">{i.id}</span>
                      <span className="text-[10px] text-vfes-dark/55">conf <span className="font-bold">{i.conf}%</span></span>
                      <span className="text-[10px] text-vfes-dark/55">window <span className="font-bold">{i.ttl}</span></span>
                      <span className="text-[10px] text-vfes-dark/55">owner <span className="font-bold">{tt(i.owner)}</span></span>
                    </div>
                    <div className="font-bold text-sm">{tt(i.title)}</div>
                    <div className="text-[11px] text-vfes-dark/60 mt-0.5">{i.detail}</div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1">
                    <button className="text-[11px] font-bold text-vfes-dark bg-vfes-red px-3 py-1 rounded hover:bg-vfes-red-dark">{tt('Approve')}</button>
                    <button className="text-[11px] font-bold text-vfes-dark/65 bg-black/5 px-3 py-1 rounded hover:bg-black/10">{tt('Defer')}</button>
                    <button className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100">{tt('Decline')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Live Anomalies · Business Impact')}>
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
        </div>
      </>)}

      {/* ═══════ OPPORTUNITIES ═══════ */}
      {tab === 'opps' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Eligible audience')}  value="244K"   delta="across 6 segments" trend="up" icon={Users} accent />
          <KpiCard label={tt('Total MRR potential')} value="BSD 3.34M" delta="if 100% activated" trend="up" icon={DollarSign} />
          <KpiCard label={tt('Top segment LTV')}     value="BSD 2.4M"  delta="Mobile cross-sell" trend="up" icon={Trophy} />
          <KpiCard label={tt('Avg propensity')}     value="14%"    delta="weighted by size"  trend="up" icon={Sparkles} />
        </div>

        <Panel title={tt('Customer Voice · Top Topics This Week (AI on calls + chat + social)')}>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              {voiceTopics.map((v) => (
                <div key={v.topic} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="w-32 font-semibold">{v.topic}</div>
                  <div className="flex-1 h-6 bg-black/5 rounded overflow-hidden flex">
                    <div className="h-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${v.pos}%` }}>{v.pos}%</div>
                    <div className="h-full bg-slate-300" style={{ width: `${100 - v.pos - v.neg}%` }} />
                    <div className="h-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${v.neg}%` }}>{v.neg}%</div>
                  </div>
                  <div className="w-16 text-right text-[10px] text-vfes-dark/65">{v.mentions.toLocaleString()}</div>
                  <div className={`w-14 text-right text-xs font-bold ${v.dEbitda.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{v.dEbitda}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Emerging Themes (last 7 days)')}</div>
              <div className="space-y-2">
                {emergingThemes.map((t, i) => (
                  <div key={i} className="border border-black/5 rounded-lg p-2.5">
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${themeTagColor(t.tag)} shrink-0`}>{tt(t.tag)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{t.theme}</div>
                        <div className="text-[10px] text-vfes-dark/55 mt-0.5">{t.mentions} mentions · {t.dWk} WoW · sentiment <span className="font-bold">{t.sentiment}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Segments Ready to Activate')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Segment')}</th>
                    <th className="text-right">{tt('Audience')}</th>
                    <th className="text-right">{tt('Propensity')}</th>
                    <th className="text-right">{tt('Potential MRR')}</th>
                    <th className="text-right">{tt('Lifetime BSD ')}</th>
                    <th>{tt('Suggested action')}</th>
                    <th>{tt('Channel')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={tt(o.name)} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{tt(o.name)}</td>
                      <td className="text-right">{o.size.toLocaleString()}</td>
                      <td className="text-right font-bold text-vfes-dark">{o.propensity}%</td>
                      <td className="text-right">BSD {o.mrr}K</td>
                      <td className="text-right font-bold">BSD {o.ltv.toFixed(2)}M</td>
                      <td className="text-xs">{tt(o.action)}</td>
                      <td className="text-xs text-vfes-dark/65">{o.channel}</td>
                      <td className="text-right">
                        <button className="text-[11px] font-bold text-vfes-dark bg-vfes-red px-2.5 py-1 rounded hover:bg-vfes-red-dark">{tt('Activate')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ RISKS & FORECAST ═══════ */}
      {tab === 'risks' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('ARR at risk · 30d')}  value="BSD 4.6M"   delta={`${risks.filter(r => r.sev === 'High').length} high-sev`} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Contract-end cliff · 60d')} value="11.4K HHs" delta="BSD 2.10M" trend="down" icon={Calendar} />
          <KpiCard label={tt('Q-end forecast')}      value="BSD 8.4M"   delta="vs BSD 9.0M plan"  trend="down" icon={Target} />
          <KpiCard label={tt('AI levers to close gap')} value="3"     delta="BSD 640K combined" trend="up"   icon={Sparkles} />
        </div>

        <Panel title={tt('Top Risks · with AI-recommended Action')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Risk')}</th>
                  <th>{tt('Severity')}</th>
                  <th className="text-right">{tt('Metric')}</th>
                  <th className="text-right">{tt('BSD  Impact')}</th>
                  <th>{tt('Trend')}</th>
                  <th>{tt('Recommended action')}</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={tt(r.name)} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{tt(r.name)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${sevColor(r.sev)}`}>{r.sev}</span></td>
                    <td className="text-right text-xs">{r.metric}</td>
                    <td className="text-right font-bold text-vfes-dark">{r.impact}</td>
                    <td className="text-xs text-vfes-dark/65">{r.trend}</td>
                    <td className="text-xs">{tt(r.action)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('90-day Forecast · with AI Levers (Optimistic / Base / Low)')} insight={{ insight: 'The optimistic scenario requires all three AI levers active; the two already deployed are tracking above plan for the first six weeks.', action: 'Approve the pending retention lever deployment this week to shift the base trajectory toward the optimistic band.', impact: 'Full lever activation by mid-quarter closes the BSD 640K gap between the base and optimistic forecast lines.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={forecast90d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="opt" name={tt('Optimistic (all levers)')} stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="base" name={tt('Base')} stroke={RED} fill={RED} fillOpacity={0.25} />
                  <Area type="monotone" dataKey="low" name={tt('Low (no AI levers)')} stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                  <ReferenceLine y={9.0} stroke={DARK} strokeDasharray="4 4" label={{ value: 'Plan target', fontSize: 10, position: 'right' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">Gap to plan ≈ <span className="font-bold text-vfes-dark">{tt('BSD 0.6M')}</span>{tt('· 3 AI levers can fully close the gap (see Right-Now)')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ ASK AI ═══════ */}
      {tab === 'ask' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cortex queries / wk')}    value="2,140" delta="+24% vs LW"   trend="up" icon={Send} accent />
          <KpiCard label={tt('What-if simulations')}    value="186"   delta="this month"   trend="up" icon={FlaskConical} />
          <KpiCard label={tt('Auto-routed actions')}     value="38"    delta="to teams"     trend="up" icon={GitBranch} />
          <KpiCard label={tt('Avg time to answer')}      value="3.4 s" delta="-0.6 s vs LM" trend="up" icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('What-If Simulator')}>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Scenario')}</div>
                <div className="flex flex-wrap gap-1">
                  {scenarios.map((s, i) => (
                    <button key={i} onClick={() => setScenarioIdx(i)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded ${scenarioIdx === i ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark hover:bg-black/10'}`}>
                      {s.name.split(' ').slice(0, 4).join(' ')}…
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-black/5 rounded-lg p-3 bg-[#fafbfc]">
                <div className="font-bold text-sm mb-2">{scenarios[scenarioIdx].name}</div>
                <div className="space-y-1">
                  {scenarios[scenarioIdx].levers.map((l, i) => (
                    <div key={i} className="text-[11px] text-vfes-dark/70 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-vfes-red shrink-0" />{l}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-1">
                  <span>{tt('Budget BSD K')}</span><span className="text-vfes-dark font-mono">BSD {budget}K</span>
                </div>
                <input type="range" min="20" max="500" step="10" value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-1">
                  <span>{tt('Offer depth BSD ')}</span><span className="text-vfes-dark font-mono">BSD {offer}</span>
                </div>
                <input type="range" min="5" max="40" step="1" value={offer} onChange={(e) => setOffer(+e.target.value)} className="w-full accent-vfes-red" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Upside')}</div>
                  <div className="text-lg font-extrabold text-emerald-600">BSD {sim.upside.toFixed(2)}M</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Margin hit')}</div>
                  <div className="text-lg font-extrabold text-red-600">BSD {sim.margin.toFixed(2)}M</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Net')}</div>
                  <div className="text-lg font-extrabold text-vfes-dark">BSD {sim.net.toFixed(2)}M</div>
                </div>
              </div>
              <div className="text-[10px] text-vfes-dark/45 uppercase tracking-widest text-center">Confidence {scenarios[scenarioIdx].confidence}% · upside {scenarios[scenarioIdx].upside} · downside {scenarios[scenarioIdx].downside}</div>
            </div>
          </Panel>

          <Panel title={tt('Cortex Analyst · Plain-English Prompts')}>
            <div className="space-y-2">
              {cortexPromptsBiz.map((p, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3 hover:bg-black/[0.02] cursor-pointer flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-vfes-dark shrink-0" />
                  <div className="flex-1 font-semibold text-sm">{p.q}</div>
                  <button className="text-[10px] font-bold text-vfes-dark bg-vfes-red px-2.5 py-1 rounded hover:bg-vfes-red-dark shrink-0">{tt(p.action)}</button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('AI_INSIGHTS_360')}</span>{tt('· plain-English routing to Marketing / Sales / Save Desk')}</div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ CUSTOMER VOICE ═══════ */}
      {tab === 'voice' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('NPS (8-wk avg)')} value="44" delta="+12 pp vs prior period" trend="up" icon={ThumbsUp} accent />
          <KpiCard label={tt('CSAT')} value="82%" delta="+8 pp YTD" trend="up" icon={Heart} />
          <KpiCard label={tt('Complaints / wk')} value="10.1K" delta="-4% WoW" trend="up" icon={MessageCircle} />
          <KpiCard label={tt('AI-resolved contacts')} value="61%" delta="+9 pp YoY" trend="up" icon={Brain} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('NPS Weekly Trend')} insight={{ insight: 'NPS has risen 12 points over the comparison period, with the steepest gains coinciding with AI-assisted call resolution rollout.', action: 'Scale the AI call-handling model to the two contact centre sites not yet covered to sustain the upward trend.', impact: 'Full site coverage is forecast to add 4-6 NPS points and reduce churn risk among high-value subscribers.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={npsWeekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="nps" name={tt('NPS')} stroke="#222128" strokeWidth={2.5} dot={{ fill: '#FF4438' }} />
                  <Line type="monotone" dataKey="promoters" name={tt('Promoters %')} stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                  <Line type="monotone" dataKey="detractors" name={tt('Detractors %')} stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('CSAT — 12-month trend')} insight={{ insight: 'CSAT has risen 8 points year-to-date with the steepest gains in Q2 corresponding directly to AI chat deployment.', action: 'Extend AI chat automation to the billing and technical support queues that still record the lowest satisfaction scores.', impact: 'Each 1-point CSAT gain is correlated with a 0.4% reduction in voluntary churn across the affected subscriber segment.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={csat12m}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[60, 90]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="csat" name={tt('CSAT %')} stroke="#222128" fill="#FF4438" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Contact Volume & AI Resolution by Channel')} insight={{ insight: 'AI autonomously resolves over 40% of digital contacts but the voice channel resolution rate remains below 15% — a clear capability gap.', action: 'Deploy the next-generation voice AI model to close the resolution gap in the telephony channel before Q3 peak season.', impact: 'Raising voice AI resolution to 35% eliminates approximately 12K manual agent interactions and BSD 290K in handling cost per month.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={voiceChannelMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="vol" name={tt('Volume')} fill="#FF4438" radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="aiResolved" name={tt('AI resolved %')} fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Top CX Complaints · AI cost estimate')}>
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Complaint')}</th>
                  <th className="text-right">{tt('Vol')}</th>
                  <th className="text-right">{tt('Trend')}</th>
                  <th className="text-right">{tt('Est. cost')}</th>
                </tr>
              </thead>
              <tbody>
                {topCxComplaints.map((c) => (
                  <tr key={c.complaint} className="border-t border-black/5">
                    <td className="py-2 font-semibold">{c.complaint}</td>
                    <td className="text-right">{c.vol.toLocaleString()}</td>
                    <td className={`text-right text-xs font-bold ${c.dWk.startsWith('+') ? 'text-red-600' : 'text-emerald-600'}`}>{c.dWk}</td>
                    <td className="text-right font-bold text-vfes-dark">{c.estCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            {(['all', 'opportunity', 'risk'] as const).map((f) => (
              <button key={f} onClick={() => setVoiceFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${voiceFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
                {tt(f === 'all' ? 'All themes' : f === 'opportunity' ? 'Opportunities' : 'Risks')}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {emergingThemes.filter((t) => voiceFilter === 'all' || t.tag === voiceFilter).map((t, i) => (
              <div key={i} className="border border-black/5 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${themeTagColor(t.tag)} shrink-0`}>{tt(t.tag)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{t.theme}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5">{t.mentions} {tt('mentions')} · {t.dWk} WoW · {tt('sentiment')} <span className="font-bold">{t.sentiment}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* ═══════ MODEL PERFORMANCE ═══════ */}
      {tab === 'model' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Models in production')} value={`${activeModelCount}`} delta="2 in staging" trend="up" icon={FlaskConical} accent />
          <KpiCard label={tt('Avg AUC')} value="0.914" delta="+0.012 vs last retrain" trend="up" icon={Target} />
          <KpiCard label={tt('Drift alerts')} value="1" delta="ARPU Forecast" trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Inference / wk')} value="441K" delta="+18% WoW" trend="up" icon={Zap} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          {(['auc', 'precision', 'recall'] as const).map((m) => (
            <button key={m} onClick={() => setModelMetric(m)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${modelMetric === m ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <Panel title={tt('Model Registry · Production Models')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Model')}</th>
                  <th>{tt('Area')}</th>
                  <th className={`text-right ${modelMetric === 'auc' ? 'text-vfes-dark' : ''}`}>{tt('AUC')}</th>
                  <th className={`text-right ${modelMetric === 'precision' ? 'text-vfes-dark' : ''}`}>{tt('Precision')}</th>
                  <th className={`text-right ${modelMetric === 'recall' ? 'text-vfes-dark' : ''}`}>{tt('Recall')}</th>
                  <th className="text-right">{tt('F1')}</th>
                  <th className="text-right">{tt('Drift')}</th>
                  <th>{tt('Last retrain')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {modelRegistry.map((m) => (
                  <tr key={m.name} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{m.name}</td>
                    <td className="text-xs text-vfes-dark/65">{m.area}</td>
                    <td className="text-right text-xs">{m.auc ? m.auc.toFixed(3) : '—'}</td>
                    <td className="text-right text-xs">{m.precision ? m.precision.toFixed(2) : '—'}</td>
                    <td className="text-right text-xs">{m.recall ? m.recall.toFixed(2) : '—'}</td>
                    <td className="text-right text-xs font-bold">{m.f1 ? m.f1.toFixed(3) : '—'}</td>
                    <td className={`text-right text-xs font-bold ${m.drift > 0.05 ? 'text-red-600' : 'text-emerald-600'}`}>{m.drift.toFixed(2)}</td>
                    <td className="text-xs text-vfes-dark/55">{m.lastRetrain}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${m.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Feature Drift Trend (top 3 models)')} insight={{ insight: 'The ARPU Forecast model is approaching the 0.05 drift alert threshold while Churn and Fraud models remain stable.', action: 'Trigger an expedited retraining cycle for the ARPU Forecast model using the most recent 90 days of actuals.', impact: 'Preventing a drift breach keeps forecast MAPE below 4% and avoids systematic mis-pricing in retention offers.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={modelDriftTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="churn" name={tt('Churn')} stroke="#222128" strokeWidth={2} dot={{ fill: '#FF4438' }} />
                  <Line type="monotone" dataKey="fraud" name={tt('Fraud')} stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                  <Line type="monotone" dataKey="upsell" name={tt('Upsell')} stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Daily Inference Volume')} insight={{ insight: 'Inference volume has grown 18% week-over-week, signalling rapid expansion of real-time decisioning across the sales and retention funnel.', action: 'Review Cortex warehouse compute allocation to ensure inference latency stays below the 200ms SLA at current growth pace.', impact: 'Maintaining sub-200ms latency at peak volume is linked to a 6-point lift in digital offer acceptance rate.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={inferenceVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="calls" name={tt('Inference calls')} fill="#7C3AED" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-6">
          <Panel title={tt('Model Accuracy Comparison · AUC bar')} insight={{ insight: 'All production models exceed AUC 0.85 and the Churn model leads at 0.94, confirming a high-quality production portfolio.', action: 'Promote the two staging models that have cleared AUC 0.87 in validation to expand real-time personalization coverage.', impact: 'Adding two models to production is estimated to bring an additional 180K customers into scored real-time decisioning.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={modelRegistry.filter((m) => m.auc > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0.8, 1.0]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="auc" name={tt('AUC')} fill="#FF4438" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ NETWORK AI ═══════ */}
      {tab === 'net-ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Anomalies detected')} value="4" delta="last 3h" trend="down" icon={Activity} accent />
          <KpiCard label={tt('AI-caught outages')} value="84%" delta="+6 pp QoQ" trend="up" icon={ShieldCheck} />
          <KpiCard label={tt('Mean time to detect')} value="4.2 min" delta="-1.8 min vs manual" trend="up" icon={Zap} />
          <KpiCard label={tt('Field savings QTD')} value="BSD 840K" delta="predictive dispatch" trend="up" icon={DollarSign} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'High', 'Medium', 'Low'] as const).map((f) => (
            <button key={f} onClick={() => setNetAiFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${netAiFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {tt(f === 'all' ? 'All' : f)}
            </button>
          ))}
        </div>
        <Panel title={tt('Live Network Anomaly Feed (AI-detected)')}>
          <div className="space-y-3">
            {filteredNetAnomalies().map((a, i) => (
              <div key={i} className="border border-black/5 rounded-lg p-3 bg-[#fafbfc]">
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shrink-0 ${
                    a.severity === 'High' ? 'bg-red-100 text-red-700' :
                    a.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{a.severity}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-vfes-dark/55 mb-0.5">{a.ts} · {a.site}</div>
                    <div className="font-semibold text-sm mb-0.5">{a.signal}</div>
                    <div className="text-xs text-vfes-dark/65"><span className="font-semibold">{tt('Prediction:')}</span> {a.prediction}</div>
                    <div className="text-xs text-vfes-dark/65"><span className="font-semibold">{tt('Action:')}</span> {a.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Reactive vs Predictive Outages (monthly)')} insight={{ insight: 'Predictive outage detection has reduced reactive incidents by 38% over four months as the anomaly model coverage has expanded.', action: 'Extend the anomaly detection model to the 12 edge-network sites currently excluded from predictive coverage.', impact: 'Full site coverage is projected to prevent 2-3 reactive outages per month and save an estimated BSD 420K in SLA penalties.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={predMaintenanceSavings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="reactive" name={tt('Reactive')} fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="predictive" name={tt('Predictive catches')} fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Network AI KPIs')}>
            <div className="space-y-3">
              {networkKpis.map((k, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div>
                    <div className="font-semibold text-sm">{k.kpi}</div>
                    <div className="text-xs text-vfes-dark/55 mt-0.5">{k.trend}</div>
                  </div>
                  <div className="text-xl font-extrabold text-vfes-dark">{k.value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="mt-6">
          <Panel title={tt('Network anomaly score trend')} insight={{ insight: 'The anomaly score spiked sharply in the afternoon window, reaching 62 and signalling potential congestion on a core network node.', action: 'Dispatch a network engineering review of the flagged node before the evening peak traffic period to prevent escalation.', impact: 'Early AI-flagged intervention at this stage has historically reduced mean-time-to-restore by over 60% and avoided full outages.' }}>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={[
                  { h: '08:00', score: 12 }, { h: '09:00', score: 18 }, { h: '10:00', score: 14 },
                  { h: '11:00', score: 22 }, { h: '12:00', score: 31 }, { h: '13:00', score: 48 },
                  { h: '14:00', score: 62 }, { h: '14:30', score: 57 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" name={tt('Anomaly score')} stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ─── Related cockpits ─── */}
      <div className="mt-8 pt-6 border-t border-black/5">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-3">{tt('Related cockpits')}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/churn-retention" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Churn & Retention')}</Link>
          <Link to="/portal/network" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Network')}</Link>
          <Link to="/portal/fraud" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Fraud')}</Link>
          <Link to="/portal/customer-360" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Customer 360')}</Link>
          <Link to="/portal/sales" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Sales')}</Link>
          <Link to="/portal/operations" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Operations')}</Link>
          <Link to="/portal/agents" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Agents')}</Link>
          <Link to="/portal/ml-registry" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('ML Registry')}</Link>
          <Link to="/portal/pricing-simulator" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Pricing Simulator')}</Link>
          <Link to="/portal/war-room" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/5 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('War Room')}</Link>
        </div>
      </div>
    </div>
  )
}
