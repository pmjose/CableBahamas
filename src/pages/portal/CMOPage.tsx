// =============================================================================
// CMO Executive Cockpit — Chief Marketing Officer · Britt Bethel
// 7 tabs · Brand/Campaigns · Digital Funnel · Promotions · Loyalty/Consent
//          · VoC · App Engagement · Overview
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import CUST from './_customer_facts'
import {
  Megaphone, Filter, Gift, HeartPulse, AppWindow, MessageSquareText, Smartphone,
  Target, Sparkles, Users, Percent, TrendingUp, Star, ArrowUpRight, Bell,
  BarChart2, Globe, CheckCircle,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const C1 = '#FF4438', C2 = '#11567F', C3 = '#10B981', C4 = '#F59E0B', C5 = '#7C3AED', C6 = '#94a3b8'

// ─── Brand & Campaigns ────────────────────────────────────────────────────────
const CH_KEYS_CMO = ['All', 'Search', 'Social', 'Display', 'CRM', 'Affiliates', 'TV/OOH'] as const
type CampaignChFilter = typeof CH_KEYS_CMO[number]

const campaignChannels = [
  { ch: 'Search',    spend: 1840, contrib: 420, roas: 4.8, cpa: 64,  imprs: 12400000, color: C1 },
  { ch: 'Social',    spend: 1240, contrib: 280, roas: 3.6, cpa: 88,  imprs: 28400000, color: C2 },
  { ch: 'Display',   spend: 980,  contrib: 140, roas: 2.4, cpa: 124, imprs: 48000000, color: C3 },
  { ch: 'CRM',       spend: 420,  contrib: 360, roas: 7.2, cpa: 28,  imprs: 4800000,  color: C4 },
  { ch: 'Affiliates',spend: 380,  contrib: 110, roas: 3.2, cpa: 96,  imprs: 2400000,  color: C5 },
  { ch: 'TV/OOH',    spend: 2800, contrib: 240, roas: 1.8, cpa: 184, imprs: 64000000, color: C6 },
]

const brandTracker = [
  { mo: 'Jan', awareness: 72, consideration: 41, preference: 28, nps: 36 },
  { mo: 'Feb', awareness: 73, consideration: 42, preference: 29, nps: 37 },
  { mo: 'Mar', awareness: 73, consideration: 43, preference: 30, nps: 37 },
  { mo: 'Apr', awareness: 74, consideration: 44, preference: 31, nps: 38 },
  { mo: 'May', awareness: 74, consideration: 44, preference: 31, nps: 38 },
  { mo: 'Jun', awareness: 75, consideration: 45, preference: 32, nps: 38 },
]

const activeCampaigns = [
  { name: 'Summer REVConnect 2025',            budget: 2400, spent: 1680, imprs: 48000000, leads: 128000, cpl: 13.1, status: 'Live'  },
  { name: 'Convergent Family',            budget: 1800, spent: 1260, imprs: 32400000, leads: 84000,  cpl: 15.0, status: 'Live'  },
  { name: 'Rural fibre reactivation',     budget: 840,  spent: 720,  imprs: 14400000, leads: 38000,  cpl: 18.9, status: 'Live'  },
  { name: 'B2B SD-WAN awareness',         budget: 620,  spent: 248,  imprs: 8400000,  leads: 12400,  cpl: 20.0, status: 'Active'},
  { name: 'Sports add-on Pro promo',        budget: 1200, spent: 0,    imprs: 0,         leads: 0,      cpl: 0,    status: 'Draft' },
]

// ─── Digital Funnel ───────────────────────────────────────────────────────────
const FUNNEL_PRODS = ['All', 'M500 BB', 'REVConnect', 'Mega', 'Mobile'] as const
type FunnelProd = typeof FUNNEL_PRODS[number]

type FunnelRow = { stage: string; sessions: number; pct: number; dropReason: string }
const funnelData: Record<Exclude<FunnelProd, 'All'>, FunnelRow[]> = {
  'M500 BB': [
    { stage: 'Landing',       sessions: 184000, pct: 100, dropReason: '' },
    { stage: 'Product',       sessions: 112000, pct: 61,  dropReason: 'Price vs Benchmark B' },
    { stage: 'Compare',       sessions: 72000,  pct: 39,  dropReason: 'Speed specs confusing' },
    { stage: 'Customise',     sessions: 42000,  pct: 23,  dropReason: 'No coverage checker' },
    { stage: 'Checkout',      sessions: 28000,  pct: 15,  dropReason: 'Payment friction' },
    { stage: 'Confirmation',  sessions: 18400,  pct: 10,  dropReason: '' },
  ],
  REVConnect: [
    { stage: 'Landing',       sessions: 142000, pct: 100, dropReason: '' },
    { stage: 'Product',       sessions: 98000,  pct: 69,  dropReason: '' },
    { stage: 'Compare',       sessions: 68000,  pct: 48,  dropReason: 'Relative price' },
    { stage: 'Customise',     sessions: 40000,  pct: 28,  dropReason: 'TV options confusing' },
    { stage: 'Checkout',      sessions: 24000,  pct: 17,  dropReason: '' },
    { stage: 'Confirmation',  sessions: 16800,  pct: 12,  dropReason: '' },
  ],
  Mega: [
    { stage: 'Landing',       sessions: 86000,  pct: 100, dropReason: '' },
    { stage: 'Product',       sessions: 64000,  pct: 74,  dropReason: '' },
    { stage: 'Compare',       sessions: 44000,  pct: 51,  dropReason: '' },
    { stage: 'Customise',     sessions: 28000,  pct: 33,  dropReason: 'High price' },
    { stage: 'Checkout',      sessions: 18000,  pct: 21,  dropReason: '' },
    { stage: 'Confirmation',  sessions: 12400,  pct: 14,  dropReason: '' },
  ],
  Mobile: [
    { stage: 'Landing',       sessions: 284000, pct: 100, dropReason: '' },
    { stage: 'Product',       sessions: 198000, pct: 70,  dropReason: '' },
    { stage: 'Compare',       sessions: 128000, pct: 45,  dropReason: 'Benchmark B price' },
    { stage: 'Customise',     sessions: 84000,  pct: 30,  dropReason: '' },
    { stage: 'Checkout',      sessions: 56000,  pct: 20,  dropReason: 'Checkout step 2 error' },
    { stage: 'Confirmation',  sessions: 41200,  pct: 15,  dropReason: '' },
  ],
}

const funnelTrend = [
  { mo: 'Jan', visits: 580000, leads: 48000, orders: 22400, cr: 3.86 },
  { mo: 'Feb', visits: 596000, leads: 50400, orders: 23200, cr: 3.89 },
  { mo: 'Mar', visits: 612000, leads: 52800, orders: 24400, cr: 3.99 },
  { mo: 'Apr', visits: 628000, leads: 54000, orders: 25200, cr: 4.01 },
  { mo: 'May', visits: 641000, leads: 55200, orders: 26000, cr: 4.06 },
  { mo: 'Jun', visits: 658000, leads: 56800, orders: 26400, cr: 4.01 },
]

// ─── Promotions ───────────────────────────────────────────────────────────────
const promos = [
  { name: 'Discount 50% 3 months',     product: 'M500 BB',    reach: 84000,  resp: 12400, respPct: 14.8, marginImpact: -0.84, revUplift: 1.24, roi: 1.48 },
  { name: 'REVConnect free month 1',          product: 'REVConnect',        reach: 62000,  resp: 8400,  respPct: 13.5, marginImpact: -0.42, revUplift: 1.68, roi: 4.00 },
  { name: 'Sports add-on Sports package free',  product: 'Mega bundle',reach: 48000,  resp: 6800,  respPct: 14.2, marginImpact: -0.28, revUplift: 0.96, roi: 3.43 },
  { name: 'Port-in BSD 60 cashback',       product: 'Mobile',     reach: 124000, resp: 18400, respPct: 14.8, marginImpact: -1.10, revUplift: 2.48, roi: 2.25 },
  { name: 'B2B trial 90 days SD-WAN',   product: 'B2B',         reach: 6400,   resp: 420,   respPct: 6.6,  marginImpact: -0.18, revUplift: 0.84, roi: 4.67 },
]

const promoMarginTrend = [
  { mo: 'Jan', discountBudget: 2.4, revUplift: 3.8, roi: 1.58 },
  { mo: 'Feb', discountBudget: 2.6, revUplift: 4.1, roi: 1.58 },
  { mo: 'Mar', discountBudget: 2.8, revUplift: 4.6, roi: 1.64 },
  { mo: 'Apr', discountBudget: 2.6, revUplift: 4.2, roi: 1.62 },
  { mo: 'May', discountBudget: 2.8, revUplift: 4.8, roi: 1.71 },
  { mo: 'Jun', discountBudget: 3.0, revUplift: 5.2, roi: 1.73 },
]

// ─── Loyalty & Consent ────────────────────────────────────────────────────────
const loyaltyTrend = [
  { mo: 'Jan', members: 2800000, activeRedeemers: 420000, pointsLiabM: 16.8, redemptionPct: 28 },
  { mo: 'Feb', members: 2840000, activeRedeemers: 436000, pointsLiabM: 17.2, redemptionPct: 30 },
  { mo: 'Mar', members: 2880000, activeRedeemers: 452000, pointsLiabM: 17.6, redemptionPct: 32 },
  { mo: 'Apr', members: 2900000, activeRedeemers: 464000, pointsLiabM: 17.8, redemptionPct: 33 },
  { mo: 'May', members: 2920000, activeRedeemers: 480000, pointsLiabM: 18.2, redemptionPct: 34 },
  { mo: 'Jun', members: 2940000, activeRedeemers: 498000, pointsLiabM: 18.6, redemptionPct: 34 },
]

const consentChannels = [
  { ch: 'Email',        reachable: 71, consentRate: 68, optOutMo: 1840 },
  { ch: 'SMS',          reachable: 84, consentRate: 82, optOutMo: 980  },
  { ch: 'Push',         reachable: 58, consentRate: 54, optOutMo: 2400 },
  { ch: 'Phone call',   reachable: 46, consentRate: 40, optOutMo: 420  },
  { ch: 'WhatsApp Biz', reachable: 38, consentRate: 36, optOutMo: 180  },
]

const loyaltyTiers = [
  { tier: 'Bronze',   members: 1_480_000, churnDelta: -0.4, arpuDelta: 0.8, color: C6 },
  { tier: 'Silver',   members: 980_000,   churnDelta: -1.2, arpuDelta: 2.4, color: C4 },
  { tier: 'Gold',     members: 380_000,   churnDelta: -2.4, arpuDelta: 4.8, color: C2 },
  { tier: 'Platinum', members: 100_000,   churnDelta: -3.8, arpuDelta: 8.2, color: C1 },
]

// ─── Voice of Customer ────────────────────────────────────────────────────────
const npsTrend = [
  { mo: 'Q1 24', b2c: 34, b2b: 42, nps: 36 },
  { mo: 'Q2 24', b2c: 35, b2b: 43, nps: 37 },
  { mo: 'Q3 24', b2c: 36, b2b: 44, nps: 37 },
  { mo: 'Q4 24', b2c: 37, b2b: 45, nps: 38 },
  { mo: 'Q1 25', b2c: 37, b2b: 46, nps: 38 },
  { mo: 'Q2 25', b2c: 38, b2b: 47, nps: 38 },
]

const vocThemes = [
  { theme: 'Speed / coverage',       mentions: 8420, sentiment: 72, trend: 'up'   },
  { theme: 'Pricing / billing',       mentions: 6840, sentiment: 38, trend: 'down' },
  { theme: 'MyREV app',          mentions: 4280, sentiment: 64, trend: 'up'   },
  { theme: 'Customer service',        mentions: 3960, sentiment: 54, trend: 'flat' },
  { theme: 'Installation / faults',   mentions: 3240, sentiment: 48, trend: 'flat' },
  { theme: 'Sports add-on / REVConnect',       mentions: 2840, sentiment: 82, trend: 'up'   },
  { theme: 'SIM swap / security',     mentions: 480,  sentiment: 28, trend: 'down' },
]

const csatJourney = [
  { journey: 'Web purchase',           csat: 4.2, target: 4.5, vol: 26400 },
  { journey: 'Service activation',     csat: 4.0, target: 4.3, vol: 24200 },
  { journey: 'Billing',                csat: 3.8, target: 4.2, vol: 18400 },
  { journey: 'Technical support',      csat: 3.6, target: 4.0, vol: 12800 },
  { journey: 'Inbound porting',        csat: 4.4, target: 4.5, vol: 4820  },
  { journey: 'Churn / retention',      csat: 3.2, target: 3.8, vol: 2840  },
]

// ─── Brand competitor benchmarks ─────────────────────────────────────────────
const brandBenchmark = [
  { op: 'Cable Bahamas', awareness: 75, consider: 45, prefer: 32, nps: 38, color: C1 },
  { op: 'BTC',   awareness: 86, consider: 52, prefer: 38, nps: 34, color: C4 },
  { op: 'Benchmark B',  awareness: 68, consider: 38, prefer: 24, nps: 28, color: C6 },
  { op: 'Benchmark B',       awareness: 54, consider: 28, prefer: 16, nps: 22, color: C5 },
  { op: 'Benchmark C',      awareness: 61, consider: 33, prefer: 20, nps: 26, color: C3 },
]

const consentTrend = [
  { mo: 'Jan', email: 64, sms: 80, push: 52, whatsapp: 28 },
  { mo: 'Feb', email: 65, sms: 81, push: 53, whatsapp: 30 },
  { mo: 'Mar', email: 67, sms: 82, push: 54, whatsapp: 32 },
  { mo: 'Apr', email: 68, sms: 83, push: 55, whatsapp: 34 },
  { mo: 'May', email: 70, sms: 83, push: 57, whatsapp: 36 },
  { mo: 'Jun', email: 71, sms: 84, push: 58, whatsapp: 38 },
]

// ─── Attribution & MMM ───────────────────────────────────────────────────────────────
const mmmContrib = [
  { ch: 'Search',    contrib: 420, baseline: 180, incremental: 240, roi: 4.8 },
  { ch: 'Social',    contrib: 280, baseline: 120, incremental: 160, roi: 3.6 },
  { ch: 'Display',   contrib: 140, baseline: 90,  incremental: 50,  roi: 2.4 },
  { ch: 'CRM',       contrib: 360, baseline: 80,  incremental: 280, roi: 7.2 },
  { ch: 'Affiliates',contrib: 110, baseline: 60,  incremental: 50,  roi: 3.2 },
  { ch: 'TV/OOH',    contrib: 240, baseline: 180, incremental: 60,  roi: 1.8 },
]
const attributionTrend = [
  { mo: 'Jan', firstTouch: 38, lastTouch: 44, datadriven: 18 },
  { mo: 'Feb', firstTouch: 37, lastTouch: 43, datadriven: 20 },
  { mo: 'Mar', firstTouch: 36, lastTouch: 42, datadriven: 22 },
  { mo: 'Apr', firstTouch: 35, lastTouch: 41, datadriven: 24 },
  { mo: 'May', firstTouch: 34, lastTouch: 40, datadriven: 26 },
  { mo: 'Jun', firstTouch: 33, lastTouch: 38, datadriven: 29 },
]
const mmmROASbyMonth = [
  { mo: 'Jan', roas: 3.8, spend: 6.2 },
  { mo: 'Feb', roas: 3.9, spend: 6.6 },
  { mo: 'Mar', roas: 4.0, spend: 7.1 },
  { mo: 'Apr', roas: 4.1, spend: 6.8 },
  { mo: 'May', roas: 4.2, spend: 7.4 },
  { mo: 'Jun', roas: 4.2, spend: 7.7 },
]
const mmmBudgetAlloc = [
  { ch: 'Search',    current: 24.8, recommended: 28.4, color: C1 },
  { ch: 'CRM',        current: 5.7,  recommended: 9.2,  color: C4 },
  { ch: 'Social',     current: 16.8, recommended: 14.2, color: C2 },
  { ch: 'Display',    current: 13.3, recommended: 10.6, color: C3 },
  { ch: 'TV/OOH',     current: 37.8, recommended: 32.0, color: C6 },
  { ch: 'Affiliates', current: 5.1,  recommended: 5.6,  color: C5 },
]

// ─── App Engagement ───────────────────────────────────────────────────────────
const appEngagement = [
  { mo: 'Jan', mau: 4200000, dau: 840000, dauMau: 20.0, sessions: 18400000, crashRate: 0.42 },
  { mo: 'Feb', mau: 4280000, dau: 864000, dauMau: 20.2, sessions: 18800000, crashRate: 0.40 },
  { mo: 'Mar', mau: 4360000, dau: 892000, dauMau: 20.5, sessions: 19400000, crashRate: 0.38 },
  { mo: 'Apr', mau: 4420000, dau: 912000, dauMau: 20.6, sessions: 19800000, crashRate: 0.36 },
  { mo: 'May', mau: 4480000, dau: 936000, dauMau: 20.9, sessions: 20400000, crashRate: 0.34 },
  { mo: 'Jun', mau: 4540000, dau: 964000, dauMau: 21.2, sessions: 21000000, crashRate: 0.32 },
]

const appFeatures = [
  { feature: 'Invoice enquiry',       adoption: 0.82, nps: 42, selfServe: 0.94 },
  { feature: 'Data management',        adoption: 0.74, nps: 38, selfServe: 0.88 },
  { feature: 'Chat/bot support',       adoption: 0.58, nps: 34, selfServe: 0.72 },
  { feature: 'Tariff change',          adoption: 0.42, nps: 36, selfServe: 0.82 },
  { feature: 'TV & content',           adoption: 0.38, nps: 48, selfServe: 0.92 },
  { feature: 'Loyalty points',         adoption: 0.28, nps: 52, selfServe: 0.96 },
  { feature: 'Family spend control',   adoption: 0.22, nps: 44, selfServe: 0.88 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'brand' | 'funnel' | 'promos' | 'loyalty' | 'voc' | 'app' | 'mmm'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview'           },
  { id: 'brand',    label: 'Brand / Campaigns'  },
  { id: 'funnel',   label: 'Digital Funnel'      },
  { id: 'promos',   label: 'Promotions'          },
  { id: 'loyalty',  label: 'Loyalty / Consent'   },
  { id: 'voc',      label: 'VoC'                 },
  { id: 'app',      label: 'App Engagement'      },
  { id: 'mmm',      label: 'Attribution & MMM'   },
]

const statusColor = (s: string) =>
  s === 'Live' ? 'bg-emerald-100 text-emerald-700' : s === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'

// =============================================================================
export default function CMOPage() {
  const [tab, setTab] = useState<TabId>('overview')
  useEffect(() => { try { localStorage.setItem('cmo-tab', tab) } catch { /* ignore */ } }, [tab])

  const [funnelProd, setFunnelProd] = useState<FunnelProd>('All')
  const [chFilter, setChFilter]     = useState<CampaignChFilter>('All')

  const activeFunnel = useMemo(() => {
    const prod = funnelProd === 'All' ? 'REVConnect' : funnelProd
    return funnelData[prod as Exclude<FunnelProd, 'All'>]
  }, [funnelProd])

  const filteredChannels = useMemo(
    () => chFilter === 'All' ? campaignChannels : campaignChannels.filter(c => c.ch === chFilter),
    [chFilter],
  )

  const mktTotals = useMemo(() => ({
    totalSpend:  campaignChannels.reduce((s, c) => s + c.spend, 0),
    totalContrib: campaignChannels.reduce((s, c) => s + c.contrib, 0),
    blendedRoas: +(campaignChannels.reduce((s, c) => s + c.contrib, 0) / campaignChannels.reduce((s, c) => s + c.spend, 0) * 1000).toFixed(2),
    totalImpressions: campaignChannels.reduce((s, c) => s + c.imprs, 0),
  }), [])

  const loyaltyStats = useMemo(() => ({
    totalMembers: loyaltyTrend[loyaltyTrend.length - 1].members,
    redemptionPct: loyaltyTrend[loyaltyTrend.length - 1].redemptionPct,
    pointsLiabM: loyaltyTrend[loyaltyTrend.length - 1].pointsLiabM,
  }), [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Marketing Officer')}
        subtitle={tt('Office of the CMO · Britt Bethel · brand, demand & loyalty · FY2026')}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/portal/marketing" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> {tt('Open Marketing')}
            </Link>
            <Link to="/portal/digital-funnel" className="border border-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-vfes-red/5">
              <Filter className="w-4 h-4" /> {tt('Digital Funnel')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Marketing intelligence"
        models={[
          { name: 'Marketing-mix Model',           metric: 'ROAS 4.2×',  sub: 'spend → contribution'             },
          { name: 'Funnel-conversion Predictor',   metric: 'AUC 0.87',   sub: 'early warning of abandonment'   },
          { name: 'Loyalty Churn-uplift Model',    metric: 'lift 2.4×',  sub: 'reward targeting'                },
        ]}
        agentLabel="Run Campaign Planner" agentRunningLabel="Attributing…"
        agentSteps={[
          'Conversions attributed across paid, owned and earned',
          'Funnel stage with most conversion leakage identified',
          'Spend reallocated to highest-ROAS channels',
          'Creative + offer for the next flight drafted',
        ]}
        agentBlurb="The marketing-mix and funnel signals are scored on the same customer model as retention — the CMO and CCO optimise against a single truth, not two dashboards."
        decision={{
          title: 'Fix M500 funnel drop and move BSD 180K to search',
          detail: 'Conversion in the M500 digital funnel fell 32% in the last hour — checkout defect detected. Fixing it and reallocating BSD 180K from display to high-intent search recovers the flight ROAS target.',
          impact: '+BSD 640K attributable revenue · ROAS 4.2×',
          risk: 'hero creative fatigue — refresh in 2 weeks',
          linkTo: '#/portal/digital-funnel', linkLabel: 'Open Digital Funnel',
        }}
        chart={{
          kind: 'bar', title: 'Marketing contribution by channel (BSD k)', xKey: 'ch', unit: 'k',
          data: campaignChannels,
          series: [{ key: 'contrib', name: 'Contribution', color: C1 }],
          note: 'Search and CRM lead on ROAS — reallocation targets.',
        }}
      />

      {/* ── Tab nav ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ════════════════════════ OVERVIEW ════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('NPS')}                  value={`+${CUST.nps}`}                            delta="+4 quarterly"       trend="up"   icon={HeartPulse}      accent />
          <KpiCard label={tt('ROAS blend')}           value="4.2×"                                      delta="target 3.5×"        trend="up"   icon={Percent}         />
          <KpiCard label={tt('Gross adds (month)')}   value={`${(CUST.grossAddsMo / 1000).toFixed(1)}K`}delta="+6% monthly"         trend="up"   icon={Users}           />
          <KpiCard label={tt('Loyalty members')}      value={`${(loyaltyStats.totalMembers / 1_000_000).toFixed(2)}M`} delta={`${loyaltyStats.redemptionPct}% redemption`} trend="up" icon={Gift} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Reachable email')}     value={`${CUST.contactable.email}%`}              delta="consented base"     trend="flat" icon={MessageSquareText}/>
          <KpiCard label={tt('App MAU')}              value="4.54M"                                     delta="+8% YoY"             trend="up"   icon={AppWindow}       />
          <KpiCard label={tt('Digital funnel conv.')} value="4.01%"                                     delta="+0.15 pp monthly"    trend="up"   icon={Filter}          />
          <KpiCard label={tt('Marketing spend MoM')}  value={`BSD ${(mktTotals.totalSpend / 1000).toFixed(1)}M`} delta="within budget"  trend="flat" icon={BarChart2} />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CMO domain')}
            links={[
              { to: 'marketing',        label: 'Marketing',              metric: tt('Campaigns · MMM · brand health'),    icon: Megaphone        },
              { to: 'digital-funnel',   label: 'Digital Funnel',         metric: tt('Acquisition funnel · conversion'),  icon: Filter           },
              { to: 'promotions',       label: 'Promotions & Discounts', metric: tt('Offer performance · margin'),       icon: Sparkles         },
              { to: 'loyalty-consent',  label: 'Loyalty & Consent',      metric: `${(CUST.loyaltyMembers / 1_000_000).toFixed(2)}M ${tt('members')}`, icon: Gift },
              { to: 'voc',              label: 'Voice of Customer',      metric: tt('Sentiment · topics (Cortex)'),     icon: MessageSquareText },
              { to: 'digital-app',      label: 'Digital App Engagement', metric: tt('MAU · feature adoption'),          icon: AppWindow        },
              { to: 'experience',       label: 'Customer Experience',    metric: tt('CSAT · journey friction'),         icon: HeartPulse       },
              { to: 'churn-retention',  label: 'Churn & Retention',      metric: `${CUST.churnRatePct}% ${tt('churn')}`, icon: Target           },
              { to: 'product',          label: 'Product & Content',      metric: tt('Proposition · price tiers'),       icon: Smartphone       },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Marketing priorities — FY2026')}
              items={[
                { name: 'Lead The Bahamas on Mobile NPS',        owner: tt('CCO · B. Bethel'),     pct: 68, status: 'at-risk'  },
                { name: 'Brand consideration +5 pts',         owner: tt('Brand'),             pct: 72, status: 'on-track' },
                { name: 'Family switcher campaign',           owner: tt('Acquisition'),       pct: 41, status: 'at-risk'  },
                { name: 'Loyalty programme relaunch',         owner: tt('CRM'),               pct: 58, status: 'on-track' },
                { name: 'WhatsApp Business deployment',       owner: tt('Digital'),           pct: 92, status: 'on-track' },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CMO desk')}
            items={[
              { text: tt('M500 funnel conversion -32% last hour — defect detected'),     level: 'high'   },
              { text: tt('Benchmark B family pricing pressuring switcher campaign'),             level: 'high'   },
              { text: tt('Hero creative fatigue — refresh in 2 weeks'),                   level: 'medium' },
              { text: tt('Consented reachability rising after preference centre relaunch'), level: 'low'    },
            ]}
          />
        </div>

        <AgendaList
          title={tt('CMO cadence')}
          items={[
            { what: tt('Weekly growth & funnel review'), when: tt('Tue 10:00')   },
            { what: tt('Brand tracker readout'),           when: tt('Mon 7 Jul')  },
            { what: tt('Campaign flight planning'),        when: tt('Thu 17 Jul') },
            { what: tt('Loyalty relaunch go-live'),        when: tt('Mon 1 Sep')  },
          ]}
        />

        <div className="mt-6">
          <Panel title={tt('Key metrics trend — last 6 months')} insight={{ insight: 'The conversion rate improves 0.15 pp per month and digital leads are growing +18% year-on-year.', action: 'Increase investment in digital acquisition channels to accelerate progress toward the conversion target.', impact: 'Each +0.1 pp of conversion on 658K monthly visits generates 658 additional orders per month.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={funnelTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="leads"  name={tt('Digital leads')} fill={C2} />
                  <Bar yAxisId="l" dataKey="orders" name={tt('Web orders')}    fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="cr" name={tt('Conversion %')} stroke={C3} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Digital leads growing +18% YoY. Conversion rate improving 0.15 pp monthly, driven by mobile checkout improvement and coverage step friction reduction.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ BRAND & CAMPAIGNS ═══════════════════════════ */}
      {tab === 'brand' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Spontaneous awareness')} value="75%"  delta="+3 pp QoQ"          trend="up"   icon={Star}           accent />
          <KpiCard label={tt('Consideration')}          value="45%"  delta="+4 pp QoQ"          trend="up"   icon={CheckCircle}    />
          <KpiCard label={tt('Blended ROAS')}           value={`${(mktTotals.totalContrib / mktTotals.totalSpend * 1000).toFixed(1)}×`} delta="target 3.5×" trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Impressions (month)')}    value={`${(mktTotals.totalImpressions / 1_000_000).toFixed(0)}M`} delta="all channels" trend="up" icon={Globe} />
        </div>

        <Panel
          title={tt('Marketing channel performance')}
          insight={{ insight: 'CRM and Search deliver ROAS above 4x while TV/OOH concentrates the largest spend with lower efficiency.', action: 'Reallocate 15% of the TV/OOH budget to CRM and Search ahead of the next flight planning cycle.', impact: 'The reallocation projects +0.3x in blended ROAS, equivalent to approximately BSD 200K of additional contribution per month.' }}
          action={
            <div className="flex flex-wrap gap-1">
              {CH_KEYS_CMO.map(k => (
                <button key={k} onClick={() => setChFilter(k)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${chFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={filteredChannels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="ch" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="kBSD " />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="×" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="spend"   name={tt('Spend (kBSD )')}        fill={C6} />
                <Bar yAxisId="l" dataKey="contrib" name={tt('Contribution (kBSD )')} fill={C1} />
                <Line yAxisId="r" type="monotone" dataKey="roas" name={tt('ROAS ×')} stroke={C3} strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Brand tracker — awareness, consideration, preference and NPS')} insight={{ insight: 'Awareness grows +3 pp QoQ and NPS exceeds 40, though consideration shows a slowdown over the past two months.', action: 'Strengthen consideration messaging in mid-funnel digital campaigns targeting audiences already aware of the brand.', impact: 'Closing a 2 pp consideration gap could increase qualified leads by an estimated +4%.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={brandTracker}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="awareness"     name={tt('Awareness %')}     stroke={C1} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="consideration" name={tt('Consideration %')} stroke={C2} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="preference"    name={tt('Preference %')}   stroke={C3} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="nps"           name={tt('NPS')}            stroke={C4} strokeWidth={2} dot strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Active campaigns — flight control')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Campaign')}</th>
                    <th className="text-right">{tt('Budget')}</th>
                    <th className="text-right">{tt('Spent')}</th>
                    <th className="text-right">{tt('Impressions')}</th>
                    <th className="text-right">{tt('Leads')}</th>
                    <th className="text-right">{tt('CPL')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.map((c, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold text-xs">{c.name}</td>
                      <td className="text-right">BSD {c.budget}K</td>
                      <td className="text-right font-bold">BSD {c.spent}K</td>
                      <td className="text-right text-xs">{c.imprs > 0 ? `${(c.imprs / 1_000_000).toFixed(1)}M` : '—'}</td>
                      <td className="text-right">{c.leads > 0 ? c.leads.toLocaleString() : '—'}</td>
                      <td className="text-right">{c.cpl > 0 ? `BSD ${c.cpl}` : '—'}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/marketing" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full marketing cockpit →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Brand health benchmark — awareness · consideration · preference · NPS')} insight={{ insight: 'Cable Bahamas leads in NPS and preference but BTC holds an 11 pp advantage in spontaneous brand awareness.', action: 'Launch a broad-reach brand awareness campaign to attack the spontaneous awareness gap versus BTC.', impact: 'Gaining +5 pp of awareness would amplify top-of-funnel lead volume by an estimated +8%.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={brandBenchmark}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="op" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="awareness" name={tt('Awareness %')}    fill={C1} />
                  <Bar dataKey="consider"  name={tt('Consideration %')} fill={C2} />
                  <Bar dataKey="prefer"    name={tt('Preference %')}   fill={C3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Cable Bahamas leads on NPS and preference but BTC holds 11 pp advantage in awareness — gap closing quarter by quarter (+3 pp awareness QoQ).')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Full brand health benchmark — comparison table')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Operator')}</th>
                    <th className="text-right">{tt('Awareness %')}</th>
                    <th className="text-right">{tt('Consideration %')}</th>
                    <th className="text-right">{tt('Preference %')}</th>
                    <th className="text-right">{tt('NPS')}</th>
                  </tr>
                </thead>
                <tbody>
                  {brandBenchmark.map((b) => (
                    <tr key={b.op} className={`border-t border-black/5 ${b.op === 'Cable Bahamas' ? 'bg-vfes-red/5 font-bold' : ''}`}>
                      <td className="py-2.5 font-semibold">{b.op}</td>
                      <td className="text-right">{b.awareness}%</td>
                      <td className="text-right">{b.consider}%</td>
                      <td className="text-right">{b.prefer}%</td>
                      <td className={`text-right font-bold ${b.nps >= 36 ? 'text-emerald-600' : 'text-vfes-dark/65'}`}>+{b.nps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ DIGITAL FUNNEL ══════════════════════════════ */}
      {tab === 'funnel' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Website visits (month)')} value="658K"  delta="+4.1% monthly"    trend="up"   icon={Globe}    accent />
          <KpiCard label={tt('Conversion rate')}          value="4.01%" delta="+0.15 pp"         trend="up"   icon={Percent}  />
          <KpiCard label={tt('Digital leads')}            value="56.8K" delta="+9.2% monthly"    trend="up"   icon={Bell}     />
          <KpiCard label={tt('Digital orders')}           value="26.4K" delta="+7.7% monthly"    trend="up"   icon={ArrowUpRight}/>
        </div>

        <Panel
          title={tt('Conversion funnel by product')}
          action={
            <div className="flex flex-wrap gap-1">
              {FUNNEL_PRODS.map(k => (
                <button key={k} onClick={() => setFunnelProd(k)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${funnelProd === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-2">
            {activeFunnel.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-4 text-sm">
                <div className="w-28 font-semibold text-xs">{tt(s.stage)}</div>
                <div className="flex-1 h-9 bg-[#f3f4f7] rounded-lg overflow-hidden border border-black/5">
                  <div className="h-full bg-gradient-to-r from-vfes-red-dark via-vfes-red to-vfes-red-light flex items-center justify-end pr-3 text-xs font-bold text-vfes-dark"
                    style={{ width: `${s.pct}%`, opacity: 1 - i * 0.1 }}>
                    {s.sessions.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 text-right text-xs text-vfes-dark/65">{s.pct}%</div>
                <div className="w-36 text-[10px] text-red-600">{s.dropReason}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Digital funnel trend — 6 months')} insight={{ insight: 'The digital conversion rate reaches 4.01% with orders growing at twice the rate of visits over the past 6 months.', action: 'Invest in mobile checkout optimization and friction reduction at the coverage step to sustain the trend.', impact: 'Maintaining the 0.15 pp monthly improvement on current traffic would generate over 1,000 additional orders per month by semester close.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={funnelTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="l" type="monotone" dataKey="visits" name={tt('Visits')}  stroke={C6} fill={C6} fillOpacity={0.15} />
                  <Bar yAxisId="l" dataKey="leads"  name={tt('Leads')}  fill={C2} />
                  <Bar yAxisId="l" dataKey="orders" name={tt('Orders')} fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="cr" name={tt('CR %')} stroke={C3} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/digital-funnel" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Deep-dive digital funnel →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ PROMOTIONS ══════════════════════════════════ */}
      {tab === 'promos' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Promo budget (month)')}     value="BSD 3.0M"  delta="+7% monthly"        trend="up"   icon={Sparkles}     accent />
          <KpiCard label={tt('Blended promo ROI')}          value="1.73×"  delta="+0.15 vs Jan"       trend="up"   icon={TrendingUp}   />
          <KpiCard label={tt('Revenue uplift')}             value="BSD 5.2M"  delta="+BSD 0.4M monthly"     trend="up"   icon={ArrowUpRight} />
          <KpiCard label={tt('Avg response rate')}          value="12.8%"  delta="target 10%"          trend="up"   icon={Percent}      />
        </div>

        <Panel title={tt('Active promotions performance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Promotion')}</th>
                  <th>{tt('Product')}</th>
                  <th className="text-right">{tt('Reach')}</th>
                  <th className="text-right">{tt('Responses')}</th>
                  <th className="text-right">{tt('Resp. %')}</th>
                  <th className="text-right">{tt('Margin impact (BSD M)')}</th>
                  <th className="text-right">{tt('Rev uplift (BSD M)')}</th>
                  <th className="text-right">{tt('ROI')}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{p.name}</td>
                    <td className="text-xs text-vfes-dark/65">{p.product}</td>
                    <td className="text-right">{p.reach.toLocaleString()}</td>
                    <td className="text-right font-bold">{p.resp.toLocaleString()}</td>
                    <td className="text-right text-emerald-600 font-bold">{p.respPct}%</td>
                    <td className="text-right text-red-600 font-bold">{p.marginImpact}</td>
                    <td className="text-right text-emerald-600 font-bold">{p.revUplift}</td>
                    <td className={`text-right font-bold ${p.roi >= 3 ? 'text-emerald-600' : p.roi >= 1.5 ? 'text-amber-600' : 'text-red-600'}`}>{p.roi}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('ROI vs discount budget trend (BSD M)')} insight={{ insight: 'Blended promotional ROI reaches 1.73x with revenue uplift exceeding the discount budget in every month of the period.', action: 'Concentrate promotions on higher price-elastic segments and remove discounts for customers who convert without incentives.', impact: 'Optimizing the promotional mix could raise blended ROI to 2.0x, freeing up to BSD 0.8M for reinvestment in brand.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={promoMarginTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="×" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="discountBudget" name={tt('Discount budget (BSD M)')} fill={C4} />
                  <Bar yAxisId="l" dataKey="revUplift"      name={tt('Revenue uplift (BSD M)')} fill={C3} />
                  <Line yAxisId="r" type="monotone" dataKey="roi" name={tt('ROI ×')} stroke={C1} strokeWidth={2} dot />
                  <ReferenceLine yAxisId="r" y={1} stroke={C6} strokeDasharray="3 3" label={{ value: 'Break-even', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px]">
              <Link to="/portal/promotions" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full promotions & discounts analysis →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ LOYALTY & CONSENT ═══════════════════════════ */}
      {tab === 'loyalty' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Loyalty members')}          value={`${(loyaltyStats.totalMembers / 1_000_000).toFixed(2)}M`} delta="+4.3% YoY"         trend="up"   icon={Gift}    accent />
          <KpiCard label={tt('Redemption rate')}            value={`${loyaltyStats.redemptionPct}%`}                         delta="+6 pp YoY"          trend="up"   icon={Percent} />
          <KpiCard label={tt('Points liability')}          value={`BSD ${loyaltyStats.pointsLiabM}M`}                         delta="well provisioned"   trend="flat" icon={Sparkles}/>
          <KpiCard label={tt('Consented email')}           value={`${CUST.contactable.email}%`}                             delta="rising post-relaunch" trend="up"   icon={MessageSquareText}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Loyalty programme trend — 6 months')} insight={{ insight: 'Active redeemers are growing at twice the rate of the overall member base, signaling genuine improvement in program engagement.', action: 'Launch an activation campaign targeting non-redeeming members ahead of the program relaunch in September.', impact: 'Converting 10% of passive members into redeemers reduces projected churn by 0.8 pp and lifts ARPU by +BSD 4 on average.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={loyaltyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="members"          name={tt('Total members')}       stroke={C1} fill={C1} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="activeRedeemers"  name={tt('Active redeemers')}   stroke={C3} fill={C3} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Loyalty tier impact on churn and ARPU')}>
            <div className="space-y-3">
              {loyaltyTiers.map((lt) => (
                <div key={lt.tier} className="flex items-center gap-3 p-3 rounded-lg border border-black/5 bg-[#fafbfc]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: lt.color }} />
                  <div className="flex-1">
                    <div className="font-bold text-sm">{tt(lt.tier)}</div>
                    <div className="text-[10px] text-vfes-dark/55">{lt.members.toLocaleString()} {tt('members')}</div>
                  </div>
                  <div className="text-xs text-right">
                    <div className="font-bold text-emerald-600">Churn {lt.churnDelta} pp</div>
                    <div className="font-bold text-vfes-dark">ARPU +BSD {lt.arpuDelta}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Reachability and consent by channel')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Channel')}</th>
                  <th className="text-right">{tt('Reachable %')}</th>
                  <th className="text-right">{tt('Consent rate %')}</th>
                  <th className="text-right">{tt('Opt-outs/month')}</th>
                </tr>
              </thead>
              <tbody>
                {consentChannels.map((c) => (
                  <tr key={c.ch} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{c.ch}</td>
                    <td className="text-right font-bold">{c.reachable}%</td>
                    <td className={`text-right font-bold ${c.consentRate >= 70 ? 'text-emerald-600' : c.consentRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{c.consentRate}%</td>
                    <td className="text-right text-vfes-dark/65">{c.optOutMo.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/loyalty-consent" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Loyalty & consent management →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Consent trend by channel — 6 months')} insight={{ insight: 'WhatsApp Business adds +10 pp of consent in 6 months and leads consented-reach growth compared to email, SMS, and push.', action: 'Scale the WhatsApp consent-capture strategy across the full customer base, prioritizing high-value segments.', impact: 'Each +1% of WhatsApp consent adds approximately 40K customers to the high open-rate personalized communications universe.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={consentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[20, 90]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="email"    name={tt('Email %')}        stroke={C1} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="sms"      name={tt('SMS %')}          stroke={C2} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="push"     name={tt('Push %')}         stroke={C3} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="whatsapp" name={tt('WhatsApp Biz %')} stroke={C4} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('WhatsApp Business growing fastest (+10 pp in 6 months). Preference centre relaunch explains the sustained increase in email and push.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ VoC ══════════════════════════════════════════ */}
      {tab === 'voc' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('NPS B2C')}              value={`+${CUST.nps}`}  delta="+4 pts QoQ"       trend="up"   icon={HeartPulse}      accent />
          <KpiCard label={tt('NPS B2B')}              value="+47"             delta="+5 pts QoQ"       trend="up"   icon={Star}            />
          <KpiCard label={tt('CSAT installation')}     value="4.0/5"           delta="target 4.3"       trend="flat" icon={CheckCircle}     />
          <KpiCard label={tt('Mentions analysed')} value="30.1K"           delta="Cortex AI"        trend="up"   icon={MessageSquareText}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tendencia NPS — B2C vs B2B')} insight={{ insight: 'B2B NPS reaches +47, outpacing B2C by 11 points, with both segments above the 40 target for the second consecutive quarter.', action: 'Replicate B2B experience levers — first-contact resolution and dedicated account management — in the high-value B2C segment.', impact: 'Raising B2C NPS by 3 points could reduce base-segment churn by 0.5 pp, equivalent to retaining approximately 20K contracts per year.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={npsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[30, 50]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="b2c" name={tt('NPS B2C')} stroke={C1} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="b2b" name={tt('NPS B2B')} stroke={C3} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="nps" name={tt('Global NPS')} stroke={C4} strokeWidth={2} dot strokeDasharray="4 4" />
                  <ReferenceLine y={40} stroke={C6} strokeDasharray="3 3" label={{ value: tt('Target'), fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('VoC topics — mentions and sentiment (Cortex NLP)')} insight={{ insight: 'Network speed leads in positive sentiment while pricing accumulates the highest volume of negative mentions per the Cortex NLP analysis.', action: 'Amplify the network leadership message in brand awareness campaigns to capitalize on the reputation capital built in that attribute.', impact: 'Making network speed a primary brand asset could increase preference by 2-3 pp in the next quarterly Brand Tracker.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={vocThemes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="theme" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mentions" name={tt('Mentions')} fill={C1} />
                  <Bar dataKey="sentiment" name={tt('Sentiment %')} fill={C3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('CSAT by customer journey')}>
          <div className="space-y-3">
            {csatJourney.map((j) => (
              <div key={j.journey} className="flex items-center gap-4 text-sm">
                <div className="w-44 font-semibold text-xs">{tt(j.journey)}</div>
                <div className="flex-1 h-5 bg-black/5 rounded overflow-hidden">
                  <div className={`h-full ${j.csat >= j.target ? 'bg-emerald-500' : j.csat >= j.target - 0.4 ? 'bg-amber-500' : 'bg-red-500'} rounded`}
                    style={{ width: `${(j.csat / 5) * 100}%` }} />
                </div>
                <div className={`w-12 text-right font-bold text-xs ${j.csat >= j.target ? 'text-emerald-600' : j.csat >= j.target - 0.4 ? 'text-amber-600' : 'text-red-600'}`}>{j.csat}</div>
                <div className="w-14 text-right text-[10px] text-vfes-dark/55">target {j.target}</div>
                <div className="w-14 text-right text-[10px] text-vfes-dark/55">{j.vol.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/voc" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Voice of Customer completo →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('CSAT by journey — progress bars vs target')} insight={{ insight: 'Churn and retention (3.2/5) and technical support (3.6/5) are the journeys with the largest negative gap against the 4.3 target.', action: 'Prioritize improving the digital retention flow and resolution time in technical support as H2 CX initiatives.', impact: 'Closing the CSAT gap in churn and retention to 4.0 could reduce voluntary churn by an estimated 0.7 pp annually.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={csatJourney} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[2.5, 5]} />
                  <YAxis type="category" dataKey="journey" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="csat"   name={tt('CSAT actual')}  fill={C1} />
                  <Bar dataKey="target" name={tt('CSAT target')} fill={C6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Churn/retention (3.2) and technical support (3.6) have the largest gap vs target. Both have an improvement roadmap in H2 2025.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ════════════════════════ ATTRIBUTION & MMM ══════════════════════════ */}
      {tab === 'mmm' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MMM blended ROAS')}          value="4.2×"  delta={tt('target 3.5×')}               trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Managed budget')}            value="BSD 7.7M" delta={tt('+24% vs Jan')}                trend="up"   icon={BarChart2}   />
          <KpiCard label={tt('Incremental contribution')} value="BSD 840K" delta={tt('vs spend-free baseline')}     trend="up"   icon={Percent}     />
          <KpiCard label={tt('Data-driven model %')}      value="29%"   delta={tt('+11 pp in 6 months')}           trend="up"   icon={Sparkles}    />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MMM contribution by channel — baseline vs incremental (kBSD )')} insight={{ insight: 'CRM and Search generate the highest relative incremental contribution while TV/OOH delivers the largest absolute volume with lower incremental ROI.', action: 'Execute the BSD 270K reallocation from TV/OOH and Display toward CRM and Search following the MMM model recommendation.', impact: 'The reallocation projects +0.3x in blended ROAS and approximately BSD 840K of additional incremental contribution in the quarter.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={mmmContrib}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="ch" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="k" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseline"    name={tt('Baseline')}    fill={C6} stackId="a" />
                  <Bar dataKey="incremental" name={tt('Incremental')} fill={C1} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('CRM and Search generate the highest relative incremental. TV/OOH has the highest absolute contribution but lowest incremental ROI.')}
            </div>
          </Panel>

          <Panel title={tt('MMM ROAS and monthly budget trend')} insight={{ insight: 'MMM ROAS rises from 3.8x in January to 4.2x in June as the budget grows in parallel, indicating efficiency above the 3.5x target.', action: 'Approve the H2 marketing budget increase while maintaining the allocation criteria favoring high-efficiency channels.', impact: 'Sustaining ROAS above 4.0x with an expanded budget would generate over BSD 1M of additional incremental contribution in the second half.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={mmmROASbyMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="×" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="spend" name={tt('Total spend (BSD M)')} fill={C6} />
                  <Line yAxisId="r" type="monotone" dataKey="roas" name={tt('ROAS ×')} stroke={C3} strokeWidth={2.5} dot />
                  <ReferenceLine yAxisId="r" y={3.5} stroke={C4} strokeDasharray="4 4" label={{ value: tt('Target 3.5×'), fontSize: 10, fill: C4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('ROAS improves 0.4× over 6 months. Budget grows but efficiency too — reallocation toward CRM and Search explains the improvement.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Budget allocation — actual vs MMM recommended (%)')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Channel')}</th>
                  <th className="text-right">{tt('Actual %')}</th>
                  <th className="text-right">{tt('Recommended %')}</th>
                  <th className="text-right">{tt('Delta pp')}</th>
                  <th className="text-right">{tt('Incremental ROAS')}</th>
                </tr>
              </thead>
              <tbody>
                {mmmBudgetAlloc.map((r, i) => {
                  const delta = r.recommended - r.current
                  const mmmRow = mmmContrib.find(m => m.ch === r.ch)
                  return (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                        {r.ch}
                      </td>
                      <td className="text-right">{r.current}%</td>
                      <td className="text-right font-bold">{r.recommended}%</td>
                      <td className={`text-right font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-vfes-dark/60'}`}>
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </td>
                      <td className="text-right font-bold">{mmmRow?.roi ?? '—'}×</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
            {tt('Recommended reallocation: +BSD 270K from TV/OOH and Display to CRM and Search. Estimated impact: +0.3× blended ROAS.')}
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Attribution model evolution — % share of conversions')} insight={{ insight: 'Data-driven attribution now accounts for 29% of modeled conversions, up from 18% in January, reducing the bias of the last-touch model.', action: 'Migrate campaign optimization to the data-driven model as the single source of truth in the next investment planning cycle.', impact: 'Rebalancing allocation based on data-driven attribution could improve CRM and retargeting display ROI by an estimated 15%.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={attributionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="firstTouch" name={tt('First touch')}  stroke={C6} fill={C6} fillOpacity={0.3} stackId="a" />
                  <Area type="monotone" dataKey="lastTouch"  name={tt('Last touch')}   stroke={C4} fill={C4} fillOpacity={0.3} stackId="a" />
                  <Area type="monotone" dataKey="datadriven" name={tt('Data-driven')}  stroke={C3} fill={C3} fillOpacity={0.4} stackId="a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] text-vfes-dark/55">
              {tt('Data-driven attribution grows from 18% to 29% in 6 months. Reduces the last-touch bias that undervalues CRM and retargeting display.')}
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Marketing cockpit')}
          </Link>
          <Link to="/portal/digital-funnel" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Digital funnel')}
          </Link>
          <Link to="/portal/cco" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('CCO cockpit')}
          </Link>
          <Link to="/portal/finance" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {tt('Financials')}
          </Link>
        </div>
      </>)}

      {/* ════════════════════════ APP ENGAGEMENT ══════════════════════════════ */}
      {tab === 'app' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MAU')}            value="4.54M"  delta="+8% YoY"            trend="up"   icon={AppWindow}   accent />
          <KpiCard label={tt('DAU/MAU')}        value="21.2%"  delta="+1.2 pp monthly"    trend="up"   icon={Percent}     />
          <KpiCard label={tt('Sessions/month')} value="21M"    delta="+14% YoY"           trend="up"   icon={Star}        />
          <KpiCard label={tt('Crash rate')}     value="0.32%"  delta="-0.1 pp monthly"    trend="up"   icon={CheckCircle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MAU, DAU & sessions trend — 6 months')} insight={{ insight: 'MAU reaches 4.54M with a DAU/MAU ratio of 21.2%, both at all-time highs and growing above the annual plan target.', action: 'Activate personalized push notifications on loyalty points to increase daily usage frequency and lift the DAU/MAU ratio to the 25% target.', impact: 'Each one-percentage-point improvement in DAU/MAU adds approximately 45K daily sessions, amplifying the reach of in-app offers and communications.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={appEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="l" type="monotone" dataKey="mau" name={tt('MAU')}       stroke={C1} fill={C1} fillOpacity={0.2} />
                  <Area yAxisId="l" type="monotone" dataKey="dau" name={tt('DAU')}       stroke={C2} fill={C2} fillOpacity={0.15}/>
                  <Line yAxisId="r" type="monotone" dataKey="dauMau" name={tt('DAU/MAU %')} stroke={C4} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('App feature adoption and NPS by functionality')}>
            <div className="space-y-2">
              {appFeatures.map((f) => (
                <div key={f.feature} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2">
                  <div className="flex-1 font-semibold text-xs">{tt(f.feature)}</div>
                  <div className="w-20 h-3 bg-black/5 rounded overflow-hidden">
                    <div className={`h-full ${f.adoption >= 0.7 ? 'bg-emerald-500' : f.adoption >= 0.4 ? 'bg-amber-500' : 'bg-vfes-red'} rounded`}
                      style={{ width: `${f.adoption * 100}%` }} />
                  </div>
                  <div className="w-10 text-right text-xs">{(f.adoption * 100).toFixed(0)}%</div>
                  <div className="w-14 text-right text-[10px] text-vfes-dark/55">NPS {f.nps}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={tt('App store performance y self-serve rate')}>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            {[
              { label: tt('Rating iOS'), value: '4.6 ★', positive: true },
              { label: tt('Rating Android'), value: '4.4 ★', positive: true },
              { label: tt('Self-serve rate'), value: '88%', positive: true },
              { label: tt('NPS in-app'), value: '+44', positive: true },
            ].map((m) => (
              <div key={m.label} className="p-4 rounded-lg bg-zinc-50 border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{m.label}</div>
                <div className={`text-2xl font-extrabold mt-1 ${m.positive ? 'text-emerald-600' : 'text-vfes-dark'}`}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px]">
            <Link to="/portal/digital-app" className="text-vfes-dark font-bold uppercase tracking-widest hover:underline">{tt('Full app engagement analytics →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Crash rate and monthly sessions — trend')} insight={{ insight: 'The crash rate drops from 0.42% to 0.32% while sessions grow +14% year-on-year, reflecting simultaneous technical improvement and engagement growth.', action: 'Set a 0.20% crash rate target for Q4 and align the mobile engineering roadmap to the user experience goal.', impact: 'Reducing the crash rate to 0.20% could improve app store ratings by 0.2 stars, increasing organic download conversion by an estimated 3%.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={appEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mo" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="sessions" name={tt('Sessions/month')} fill={C1} />
                  <Line yAxisId="r" type="monotone" dataKey="crashRate" name={tt('Crash rate %')} stroke="#ef4444" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Crash rate down 0.10 pp since Jan (0.42% → 0.32%) — continuous improvement by mobile engineering team. Sessions grow +14% YoY, driven by the loyalty points feature launched in Q1.')}</div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
