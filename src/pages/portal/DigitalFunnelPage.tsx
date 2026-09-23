import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Activity, Sparkles, AlertTriangle, MessageCircle, Bell, TrendingUp, Target,
  Zap, Smartphone, Monitor, Tag, FlaskConical, Trophy, MapPin, ShieldCheck,
  GitBranch, DollarSign, Send, ArrowUpRight, Globe, ShoppingCart, Users, BarChart2,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import { DIGITAL_FUNNEL_BY_LANE } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ---------------------------- Demo data ---------------------------- //

type ProductKey = '500Mb' | '1Gb' | '2Gb' | 'REVConnect' | 'Mega' | 'Mobile' | 'B2B'
const products: { code: ProductKey; name: string; arpu: number; contractMo: number }[] = [
  { code: '500Mb', name: '500 Mb Fibre',          arpu: 49,  contractMo: 18 },
  { code: '1Gb',   name: '1 Gb Fibre',            arpu: 65,  contractMo: 18 },
  { code: '2Gb',   name: '2 Gb Fibre',            arpu: 79,  contractMo: 24 },
  { code: 'REVConnect',  name: 'REVConnect — BB + Mobile',    arpu: 84,  contractMo: 24 },
  { code: 'Mega',  name: 'Mega — BB + TV + Mob.', arpu: 112, contractMo: 24 },
  { code: 'Mobile',name: 'Mobile only',           arpu: 28,  contractMo: 12 },
  { code: 'B2B',   name: 'B2B SoHo',              arpu: 92,  contractMo: 24 },
]

// Multi-product, device-split funnel — sessions per stage by device (per-product hourly demo)
const funnelByProduct: Record<ProductKey, { stage: string; mobile: number; desktop: number }[]> = {
  '500Mb': [
    { stage: 'Awareness',     mobile: 162000, desktop: 86000 },
    { stage: 'Consideration', mobile:  58400, desktop: 38000 },
    { stage: 'Configurator',  mobile:  21800, desktop: 16400 },
    { stage: 'Cart',          mobile:   7200, desktop:  7600 },
    { stage: 'Checkout',      mobile:   2640, desktop:  3600 },
    { stage: 'Confirmation',  mobile:   1080, desktop:  2040 },
  ],
  '1Gb': [
    { stage: 'Awareness',     mobile:  92000, desktop: 64000 },
    { stage: 'Consideration', mobile:  34800, desktop: 26200 },
    { stage: 'Configurator',  mobile:  12200, desktop: 11800 },
    { stage: 'Cart',          mobile:   4400, desktop:  5800 },
    { stage: 'Checkout',      mobile:   1820, desktop:  3120 },
    { stage: 'Confirmation',  mobile:    820, desktop:  1980 },
  ],
  '2Gb': [
    { stage: 'Awareness',     mobile:  38000, desktop: 32000 },
    { stage: 'Consideration', mobile:  14200, desktop: 14800 },
    { stage: 'Configurator',  mobile:   5800, desktop:  7200 },
    { stage: 'Cart',          mobile:   1980, desktop:  3240 },
    { stage: 'Checkout',      mobile:    820, desktop:  1980 },
    { stage: 'Confirmation',  mobile:    420, desktop:  1320 },
  ],
  'REVConnect': [
    { stage: 'Awareness',     mobile: 124000, desktop: 56000 },
    { stage: 'Consideration', mobile:  48400, desktop: 24200 },
    { stage: 'Configurator',  mobile:  18200, desktop: 11400 },
    { stage: 'Cart',          mobile:   6800, desktop:  5800 },
    { stage: 'Checkout',      mobile:   2400, desktop:  3200 },
    { stage: 'Confirmation',  mobile:    980, desktop:  1820 },
  ],
  'Mega': [
    { stage: 'Awareness',     mobile:  68000, desktop: 42000 },
    { stage: 'Consideration', mobile:  22400, desktop: 17600 },
    { stage: 'Configurator',  mobile:   7800, desktop:  8600 },
    { stage: 'Cart',          mobile:   2600, desktop:  3800 },
    { stage: 'Checkout',      mobile:    980, desktop:  2200 },
    { stage: 'Confirmation',  mobile:    420, desktop:  1380 },
  ],
  'Mobile': [
    { stage: 'Awareness',     mobile: 198000, desktop: 28000 },
    { stage: 'Consideration', mobile:  78400, desktop: 12200 },
    { stage: 'Configurator',  mobile:  29800, desktop:  5400 },
    { stage: 'Cart',          mobile:  11800, desktop:  2400 },
    { stage: 'Checkout',      mobile:   5400, desktop:  1240 },
    { stage: 'Confirmation',  mobile:   2820, desktop:    760 },
  ],
  'B2B': [
    { stage: 'Awareness',     mobile:   8400, desktop: 24000 },
    { stage: 'Consideration', mobile:   2800, desktop:  9800 },
    { stage: 'Configurator',  mobile:    980, desktop:  4400 },
    { stage: 'Cart',          mobile:    340, desktop:  1980 },
    { stage: 'Checkout',      mobile:    140, desktop:  1180 },
    { stage: 'Confirmation',  mobile:     60, desktop:    640 },
  ],
}

const dropReasons = [
  { r: 'Price concern (vs. BTC/Benchmark B)',          n: 38, color: 'bg-red-500' },
  { r: 'Serviceability check failed',           n: 24, color: 'bg-amber-500' },
  { r: 'Credit check fear',                     n: 14, color: 'bg-orange-500' },
  { r: 'Installation wait time',                n: 11, color: 'bg-yellow-500' },
  { r: 'Contract length concern',               n:  8, color: 'bg-slate-500' },
  { r: 'Other / unclear',                       n:  5, color: 'bg-slate-300' },
]

// Form-field analytics
const formFields = [
  { field: 'Postcode lookup',       dropPct: 18, time: '14s', issue: 'API timeout 4% of sessions' },
  { field: 'Address confirm',    dropPct: 11, time: '22s', issue: 'Mobile UI label cut-off' },
  { field: 'Personal details',   dropPct:  8, time: '46s', issue: 'National register number field unclear' },
  { field: 'Direct debit IBAN',  dropPct: 14, time: '38s', issue: 'No "pay by card" alt' },
  { field: 'T&Cs acceptance',    dropPct:  3, time:  '8s', issue: '' },
]

// Trend with anomaly
const trend = Array.from({ length: 24 }, (_, i) => ({
  h: `${i.toString().padStart(2, '0')}:00`,
  rate: +(1.6 + Math.sin(i / 4) * 0.4 + (i === 14 ? -0.74 : 0) + (i === 15 ? -0.42 : 0)).toFixed(2),
  baseline: +(1.62 + Math.sin(i / 4) * 0.18).toFixed(2),
}))

// Channel ROAS — ALL the money fields
type ChannelRow = { c: string; sessions: number; spend: number; conv: number; orders: number; cac: number; assistConv: number }
const channels: ChannelRow[] = [
  { c: 'Organic Search', sessions: 84200, spend:     0, conv: 1.84, orders: 1549, cac:    0, assistConv: 28 },
  { c: 'Paid Search',    sessions: 62100, spend: 18400, conv: 2.12, orders: 1316, cac: 13.98, assistConv: 22 },
  { c: 'Paid Social',    sessions: 38400, spend: 14200, conv: 0.94, orders:  361, cac: 39.34, assistConv: 14 },
  { c: 'Display / YouTube', sessions: 28200, spend: 9800, conv: 0.42, orders: 118, cac: 83.05, assistConv: 38 },
  { c: 'Direct',         sessions: 41200, spend:     0, conv: 2.64, orders: 1088, cac:    0, assistConv: 19 },
  { c: 'Email / CRM',    sessions: 12800, spend:   620, conv: 4.22, orders:  540, cac:  1.15, assistConv: 12 },
  { c: 'Affiliate',      sessions:  9300, spend:  4800, conv: 1.18, orders:  110, cac: 43.64, assistConv:  6 },
  { c: 'TikTok',         sessions: 11200, spend:  3200, conv: 0.62, orders:   69, cac: 46.38, assistConv: 24 },
]

// Segment cuts
const segments = [
  { seg: 'New customers',         conv: 1.18, vol: 124000, color: '#3b82f6' },
  { seg: 'Winback (lapsed 12mo)', conv: 2.84, vol:  18400, color: '#10b981' },
  { seg: 'In-footprint FTTH',     conv: 2.42, vol:  98000, color: '#10b981' },
  { seg: 'In-footprint HFC',      conv: 1.62, vol:  68000, color: '#3b82f6' },
  { seg: 'Out-of-footprint',      conv: 0.04, vol:  42000, color: '#dc2626' },
  { seg: 'Nassau',                conv: 1.86, vol: 102000, color: '#3b82f6' },
  { seg: 'Freeport / Abaco',         conv: 1.42, vol:  48000, color: '#3b82f6' },
  { seg: 'Rural',                 conv: 0.62, vol:  62000, color: '#f59e0b' },
]

// A/B experiments
const experiments = [
  { name: 'Postcode autocomplete v2',   status: 'WINNING',  lift: '+18.4%', sig: '99%', ends: 'Tomorrow', owner: 'T. Bethel' },
  { name: 'Sticky checkout CTA mobile',status: 'WINNING',  lift: '+8.2%',  sig: '96%', ends: '3 days',   owner: 'L. Knowles' },
  { name: 'BSD 10 voucher Cart prompt',   status: 'INCONCL.', lift: '+1.1%',  sig: '62%', ends: '7 days',   owner: 'S. Adderley' },
  { name: 'Two-column checkout',       status: 'LOSING',   lift: '-4.8%',  sig: '94%', ends: 'Stopped',  owner: 'T. Bethel' },
  { name: 'Trust badges checkout',     status: 'RUNNING',  lift: '+2.4%',  sig: '78%', ends: '5 days',   owner: 'E. Rolle' },
]

// Promo tracker
const promos = [
  { code: 'SUMMER25',     uses:  2840, blend: 25, margin: -8.2, day90Churn: 18, color: '#dc2626' },
  { code: 'NEWCUST10',    uses:  6420, blend: 10, margin:  4.4, day90Churn: 12, color: '#10b981' },
  { code: 'WINBACK20',    uses:   980, blend: 20, margin: -2.1, day90Churn:  9, color: '#f59e0b' },
  { code: 'NOPROMO',      uses:  4180, blend:  0, margin:  9.8, day90Churn:  6, color: '#10b981' },
  { code: 'MEGADEAL',     uses:  1240, blend: 30, margin:-12.4, day90Churn: 22, color: '#dc2626' },
]

// Competitive benchmark
const competitive = [
  { brand: 'Cable Bahamas',   speed500: 49, speed1G: 65, speed2G: 79, contract: 18, install: 'BSD 0', score: 0.78 },
  { brand: 'BTC',    speed500: 45, speed1G: 60, speed2G: 75, contract: 24, install: 'BSD 99', score: 0.74 },
  { brand: 'Benchmark B',    speed500: 39, speed1G: 55, speed2G: 69, contract: 12, install: 'BSD 0', score: 0.82 },
  { brand: 'Benchmark B',        speed500: 50, speed1G: 70, speed2G: '—', contract: 18, install: 'BSD 49', score: 0.68 },
  { brand: 'Benchmark A',      speed500: 47, speed1G: 62, speed2G: 78, contract: 18, install: 'BSD 0', score: 0.72 },
]

// Serviceability fails by region — with FTTH unlock quarter
const servicefails = [
  { region: 'Nassau North',  fails: 1240, ftthEta: 'Live',     pct: 4 },
  { region: 'Nassau South',  fails:  860, ftthEta: 'Live',     pct: 3 },
  { region: 'Freeport',          fails: 2480, ftthEta: 'Q3 26',    pct: 14 },
  { region: 'Abaco',         fails: 1840, ftthEta: 'Q4 26',    pct: 18 },
  { region: 'Eleuthera',         fails: 1120, ftthEta: 'Q3 26',    pct: 16 },
  { region: 'Exuma',        fails:  640, ftthEta: 'Live',     pct: 8 },
  { region: 'Rural Exuma',  fails: 4280, ftthEta: '2027+',    pct: 42 },
  { region: 'Rural Out Islands', fails: 3640, ftthEta: '2027+',    pct: 38 },
]

// Post-order funnel — Order → Activation → Day-90
const postOrder = [
  { stage: 'Order placed',          n: 3120, color: '#1e293b' },
  { stage: 'Survey passed',         n: 2890, color: '#475569' },
  { stage: 'Engineer scheduled',    n: 2680, color: '#64748b' },
  { stage: 'Install complete',      n: 2412, color: '#94a3b8' },
  { stage: 'Active (Day 30)',       n: 2284, color: '#10b981' },
  { stage: 'Retained (Day 90)',     n: 2152, color: '#10b981' },
]

// Pacing
const pacingSeries = Array.from({ length: 24 }, (_, i) => ({
  d: `${i+1}`,
  actual: 88 + i * 4.2 + (i > 18 ? -8 : 0),
  target: 90 + i * 5.0,
}))

// Chat save funnel
const chatSave = [
  { step: 'Chat triggered (intent)', n: 1840, color: '#1e293b' },
  { step: 'Engaged (responded)',     n:  920, color: '#475569' },
  { step: 'Issue resolved',          n:  340, color: '#64748b' },
  { step: 'Cart re-opened',          n:  240, color: '#94a3b8' },
  { step: 'Order placed',            n:  142, color: '#10b981' },
  { step: 'Active 90d (paying)',     n:  118, color: '#10b981' },
]

// Action queue — what should marketing do NOW
const actionQueue = [
  { type: 'Fix',         priority: 'P0', title: 'Postcode lookup API timeouts',         impact: 'BSD 84K MRR/Q', why: '4% of mobile sessions losing 18% drop · API call avg 14s', play: 'Cache postcode results, retry on 502', owner: 'Eng / Web', cta: 'Open ticket' },
  { type: 'Pause',       priority: 'P1', title: 'TikTok prospecting campaign',          impact: 'BSD 3.2K saved', why: 'CAC BSD 46 vs BSD 14 paid search · 0.62% conv', play: 'Pause until creative refresh', owner: 'Performance', cta: 'Pause now' },
  { type: 'Match',       priority: 'P0', title: 'Benchmark B 12-mo BSD 39 deal',                  impact: 'BSD 420K LTV/Q', why: 'Lost 38% of 500Mb price-sensitive prospects', play: 'Launch 12-mo BSD 42 + BSD 0 install', owner: 'Pricing', cta: 'Brief approval' },
  { type: 'Retarget',    priority: 'P1', title: '4,820 high-CLV cart abandoners',       impact: 'BSD 220K MRR/Q', why: 'CLV propensity > 0.7 · last 7d', play: 'Send personalised email + SMS reminder', owner: 'CRM', cta: 'Push to Marketing Cloud' },
  { type: 'Defer',       priority: 'P2', title: 'Abaco / Freeport SEM spend',              impact: 'BSD 8K saved/wk', why: '14-18% serviceability fail · FTTH not until Q3-Q4 26', play: 'Reduce bids until coverage live', owner: 'Performance', cta: 'Adjust bids' },
  { type: 'Promote',     priority: 'P1', title: 'Postcode autocomplete v2 rollout',      impact: '+18.4% conv', why: '99% sig · winning experiment', play: 'Roll to 100% of traffic', owner: 'Web', cta: 'Promote variant' },
  { type: 'Stop',        priority: 'P0', title: 'MEGADEAL promo code',                  impact: 'BSD 280K margin', why: '−12.4BSD  margin/cust · 22% Day-90 churn', play: 'Retire code, replace with NEWCUST10', owner: 'CRM', cta: 'Retire code' },
]

// ---------------------------- Helpers ---------------------------- //

const fmtK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toString()

// ─── Cohort retention ─────────────────────────────────────────────────────────────
const COHORT_RETENTION = [
  { cohort: 'Jan-26', m0: 100, m1: 84, m2: 79, m3: 74, m4: 71, m5: 69 },
  { cohort: 'Feb-26', m0: 100, m1: 86, m2: 80, m3: 76, m4: 73, m5: null },
  { cohort: 'Mar-26', m0: 100, m1: 85, m2: 79, m3: 75, m4: null, m5: null },
  { cohort: 'Apr-26', m0: 100, m1: 83, m2: 77, m3: null, m4: null, m5: null },
  { cohort: 'May-26', m0: 100, m1: 82, m2: null, m3: null, m4: null, m5: null },
  { cohort: 'Jun-26', m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
]

const COHORT_LTV = [
  { mo:  0, ltv:    0 }, { mo:  1, ltv:   65 }, { mo:  3, ltv:  184 },
  { mo:  6, ltv:  342 }, { mo: 12, ltv:  628 }, { mo: 18, ltv:  892 }, { mo: 24, ltv: 1124 },
]

const AB_TREND = [
  { d: '1',  control: 1.58, variant: 1.62 }, { d: '3',  control: 1.60, variant: 1.72 },
  { d: '5',  control: 1.57, variant: 1.78 }, { d: '7',  control: 1.61, variant: 1.84 },
  { d: '9',  control: 1.59, variant: 1.88 }, { d: '11', control: 1.62, variant: 1.92 },
  { d: '13', control: 1.60, variant: 1.96 }, { d: '15', control: 1.58, variant: 1.98 },
]

const ATTRIBUTION_COMPARE = [
  { channel: 'Organic Search', last: 1549, dataDriven: 1640, mmm: 1820 },
  { channel: 'Paid Search',    last: 1316, dataDriven: 1120, mmm:  980 },
  { channel: 'Paid Social',    last:  361, dataDriven:  480, mmm:  420 },
  { channel: 'Display',        last:  118, dataDriven:  280, mmm:  380 },
  { channel: 'Direct',         last: 1088, dataDriven:  980, mmm:  820 },
  { channel: 'Email / CRM',    last:  540, dataDriven:  620, mmm:  580 },
  { channel: 'Affiliate',      last:  110, dataDriven:  140, mmm:  120 },
  { channel: 'TikTok',         last:   69, dataDriven:  140, mmm:  180 },
]

const CHANNEL_EFFICIENCY = [
  { m: 'Jan', email: 4.2, paid: 2.8, organic: 9.4, social: 1.4 },
  { m: 'Feb', email: 4.4, paid: 2.9, organic: 9.6, social: 1.5 },
  { m: 'Mar', email: 4.6, paid: 3.0, organic: 9.8, social: 1.4 },
  { m: 'Apr', email: 4.8, paid: 2.7, organic: 10.2, social: 1.6 },
  { m: 'May', email: 5.0, paid: 2.6, organic: 10.4, social: 1.5 },
  { m: 'Jun', email: 5.2, paid: 2.5, organic: 10.6, social: 1.3 },
]

// ---------------------------- Page ---------------------------- //

type TabId = 'overview' | 'forms' | 'audiences' | 'activation' | 'actions' | 'ab-tests' | 'cohort' | 'attribution'

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',       icon: Activity    },
  { id: 'forms',       label: 'Form & Channels', icon: GitBranch  },
  { id: 'audiences',   label: 'Audiences',      icon: Globe       },
  { id: 'activation',  label: 'Activation',     icon: Zap         },
  { id: 'actions',     label: 'Actions',        icon: Target      },
  { id: 'ab-tests',    label: 'A/B Tests',      icon: FlaskConical },
  { id: 'cohort',      label: 'Cohort',         icon: Users       },
  { id: 'attribution', label: 'Attribution',    icon: BarChart2   },
]

export default function DigitalFunnelPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [product, setProduct] = useState<ProductKey>('500Mb')
  const [device, setDevice] = useState<'all' | 'mobile' | 'desktop'>('all')
  const [attribution, setAttribution] = useState<'last' | 'data' | 'mmm'>('last')
  const [abFilter, setAbFilter] = useState<'all' | 'winning' | 'running'>('all')
  const [attrModel, setAttrModel] = useState<'last' | 'dataDriven' | 'mmm'>('last')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sel = products.find((p) => p.code === product)!

  const funnel = useMemo(() => {
    return funnelByProduct[product].map((s) => ({
      stage: s.stage,
      n: device === 'all' ? s.mobile + s.desktop : device === 'mobile' ? s.mobile : s.desktop,
      mobile: s.mobile,
      desktop: s.desktop,
    }))
  }, [product, device])

  const top = funnel[0].n
  const conversions = funnel[funnel.length - 1].n
  const convRate = (conversions / top) * 100
  const incMRR = (conversions * sel.arpu) / 1000 // BSD K MRR
  const incRevQ = (conversions * sel.arpu * 3) / 1_000_000 // BSD M for the quarter

  // Channel KPIs (apply attribution model multipliers — demo only)
  const cohortMetrics = useMemo(() => {
    const withM3 = COHORT_RETENTION.filter(c => c.m3 !== null)
    const avgM3 = withM3.reduce((s, c) => s + (c.m3 ?? 0), 0) / Math.max(withM3.length, 1)
    return { avgM3: avgM3.toFixed(1) }
  }, [])

  const filteredExperiments = useMemo(
    () => abFilter === 'all' ? experiments :
          abFilter === 'winning' ? experiments.filter(e => e.status === 'WINNING') :
          experiments.filter(e => e.status === 'RUNNING'),
    [abFilter],
  )

  const attrData = useMemo(
    () => ATTRIBUTION_COMPARE.map(c => ({ ...c, selected: c[attrModel as 'last' | 'dataDriven' | 'mmm'] })),
    [attrModel],
  )

  const channelView = useMemo(() => {
    const mult = attribution === 'last' ? 1 : attribution === 'data' ? 0.78 : 0.62
    const upMult = attribution === 'last' ? 0 : attribution === 'data' ? 0.22 : 0.38
    return channels.map((c) => {
      const adjOrders = Math.round(c.orders * mult + c.assistConv * upMult * 10)
      const revenue = adjOrders * sel.arpu
      const cac = c.spend > 0 && adjOrders > 0 ? c.spend / adjOrders : 0
      const ltv = sel.arpu * 32 // 32-mo demo CLV
      const roas = c.spend > 0 ? revenue / c.spend : 0
      return { ...c, adjOrders, revenue, cac, ltv, roas }
    })
  }, [attribution, sel.arpu])

  const totalSpend = channels.reduce((s, c) => s + c.spend, 0)
  const totalOrders = channels.reduce((s, c) => s + c.orders, 0)
  const blendedCAC = totalSpend / totalOrders
  const ltvCAC = (sel.arpu * 32) / blendedCAC

  // Pacing
  const dayIdx = pacingSeries.length - 1
  const actualToDate = pacingSeries[dayIdx].actual
  const targetToDate = pacingSeries[dayIdx].target
  const pacingPct = (actualToDate / targetToDate) * 100

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Digital Funnel')}
        subtitle={tt('cablebahamas.com clickstream · Snowpipe Streaming · Cortex AI drop-off classification')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" /> Live · 18s lag · Snowpipe Streaming
            </span>
            <span className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Use Case 5
            </span>
          </div>
        }
      />

      <MlInsightSection
        heading="Digital funnel intelligence"
        models={[
          { name: 'Drop-off Classifier',       metric: 'recall 0.91', sub: 'LLM classification of abandonment'   },
          { name: 'Conv. Anomaly Detector',    metric: 'AUC 0.87',    sub: 'real-time 18s lag detection'          },
          { name: 'Retarget Propensity Score', metric: 'AUC 0.86',    sub: 'XGBoost · cart abandonment'           },
        ]}
        agentLabel="Run Funnel-Fix Agent"
        agentRunningLabel="Diagnosing…"
        agentSteps={[
          'Classified drop-off reasons from clickstream',
          'Located mobile-checkout as the largest leak',
          'Generated form-simplification & prefill variant',
          'Queued A/B test with projected uplift',
        ]}
        agentBlurb="18-second Snowpipe Streaming lag means the model sees the conversion anomaly before the marketer’s dashboard refreshes — enabling real-time retargeting of high-CLV cart abandoners."
        decision={{
          title: 'Prioritise the mobile-checkout fix — it is the costliest drop',
          detail: 'Mobile checkout drops at ~2.4× the desktop rate. A simplified, prefilled flow recovers the highest-value abandoners before paid spend is wasted.',
          impact: '+conversion on mobile · lower CAC waste',
          risk: 'validate via A/B before full rollout',
          linkTo: '#/portal/digital-funnel',
          linkLabel: 'Open Digital Funnel',
        }}
        chart={{
          kind: 'line',
          title: 'Conversion rate anomaly — actual vs baseline (last 24h)',
          xKey: 'h',
          unit: '%',
          data: trend,
          series: [
            { key: 'rate',     name: 'Actual conv %', color: '#FF4438'           },
            { key: 'baseline', name: 'Baseline',      color: '#94a3b8', dashed: true },
          ],
          note: 'Anomaly at 14:00–15:00 — Postcode API timeout attributed by Cortex.',
        }}
      />

      {/* Global filters — affect data across all tabs */}
      <div className="bg-white rounded-xl border border-black/5 p-4 mb-6">
        <div className="grid lg:grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Product')}</div>
            <div className="flex flex-wrap gap-1.5">
              {products.map((p) => (
                <button key={p.code} onClick={() => setProduct(p.code)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded ${product === p.code ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark hover:bg-black/10'}`}>
                  {tt(p.name)} · BSD {p.arpu}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Device')}</div>
            <div className="flex gap-1.5">
              {(['all','mobile','desktop'] as const).map((d) => (
                <button key={d} onClick={() => setDevice(d)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 ${device === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
                  {d === 'mobile' ? <Smartphone className="w-3 h-3" /> : d === 'desktop' ? <Monitor className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Attribution model')}</div>
            <div className="flex gap-1.5">
              {([
                { k: 'last', l: 'Last-click' },
                { k: 'data', l: 'Data-driven' },
                { k: 'mmm',  l: 'MMM-blended' },
              ] as const).map((a) => (
                <button key={a.k} onClick={() => setAttribution(a.k)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded ${attribution === a.k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
                  {a.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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

      {tab === 'overview' && (<>
      {/* Live alert with auto-drilldown */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Conversion anomaly · 500 Mb · 14:00–15:00')}</div>
            <div className="text-xs text-amber-800 mt-1">
              <span className="font-bold">−32%</span> vs baseline · auto-attributed by Cortex to:
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('mobile · Postcode lookup · Freeport+Abaco')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('API p99 14.2s')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('est. loss BSD 32K MRR')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open runbook →')}</button>
        </div>
      </div>

      {/* Row 1 — Headline KPIs (revenue, not rates) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('Sessions today')}      value={fmtK(top)}                   delta="+8.2% vs LW"            trend="up"   icon={Activity} accent />
        <KpiCard label={tt('Inc. MRR today')}      value={`BSD ${(incMRR).toFixed(0)}K`}  delta={`BSD ${incRevQ.toFixed(2)}M / Q`}    trend="up"   icon={DollarSign} />
        <KpiCard label={tt('Blended CAC')}          value={`BSD ${blendedCAC.toFixed(0)}`} delta={`Paid BSD ${(totalSpend/channels.filter(c=>c.spend>0).reduce((s,c)=>s+c.orders,0)).toFixed(0)}`}            trend="flat" icon={Target} />
        <KpiCard label={tt('LTV : CAC')}            value={`${ltvCAC.toFixed(1)}×`}     delta={ltvCAC > 3 ? 'Healthy >3×' : 'Watch'} trend={ltvCAC > 3 ? 'up' : 'down'} icon={Trophy} />
      </div>

      {/* Row 2 — Efficiency KPIs + pacing */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Conv. rate')}           value={`${convRate.toFixed(2)}%`}   delta="vs 1.62% baseline"                     trend={convRate >= 1.6 ? 'up' : 'down'} icon={TrendingUp} />
        <KpiCard label={tt('Blended ROAS')}         value={`${(channelView.reduce((s,c)=>s+c.revenue,0)/Math.max(totalSpend,1)).toFixed(1)}×`} delta={`Attribution: ${attribution}`} trend="up" icon={Sparkles} />
        <KpiCard label={tt('Cart abandonment')}     value="58%"                         delta="+4 pp vs LW"                            trend="down" icon={ShoppingCart} />
        <KpiCard label={tt('Pacing vs plan')}       value={`${pacingPct.toFixed(0)}%`}  delta={`BSD ${(actualToDate-targetToDate).toFixed(0)}K behind`} trend={pacingPct >= 100 ? 'up' : 'down'} icon={Zap} />
      </div>

      {/* Funnel split — Fixed-only · Mobile-only · Convergent */}
      <Panel title={tt('Funnel split — Fixed-only · Mobile-only · Convergent')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Mobile = top of funnel')}</span>}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={DIGITAL_FUNNEL_BY_LANE}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="fixed"      stackId="a" fill="#3B82F6" name={tt('Fixed-only')}  radius={[0,0,0,0]} />
            <Bar dataKey="mobile"     stackId="a" fill="#FF4438" name={tt('Mobile-only')} radius={[0,0,0,0]} />
            <Bar dataKey="convergent" stackId="a" fill="#7C3AED" name={tt('Convergent')}  radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-[11px] text-vfes-dark/65 mt-2">{tt('Mobile journeys dominate top of funnel (52% of visits) but Convergent journeys deliver 2.4× the activation value — push Mobile-only carts toward Convergent in cart-abandonment recovery.')}</div>
      </Panel>

      {/* Overview live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard label={tt('Live sessions')}     value={fmtK(top)}              delta={liveTime ? `Live · ${liveTime}` : ''} trend="up"   icon={Activity} accent />
        <KpiCard label={tt('Orders today')}      value={fmtK(totalOrders)}      delta={`BSD ${incRevQ.toFixed(2)}M / Q`}           trend="up"   icon={DollarSign} />
        <KpiCard label={tt('CAC blended')}       value={`BSD ${blendedCAC.toFixed(0)}`} delta={`${attribution} model`}             trend="flat" icon={Target} />
        <KpiCard label={tt('Pacing vs plan')}    value={`${pacingPct.toFixed(0)}%`} delta={pacingPct >= 100 ? 'on plan' : 'behind'} trend={pacingPct >= 100 ? 'up' : 'down'} icon={Zap} />
      </div>
      <div className="flex gap-3 text-xs mt-4">
        <Link to="/portal/digital-funnel"  className="font-bold text-vfes-dark hover:underline">{tt('Digital Funnel overview →')}</Link>
        <Link to="/portal/marketing"       className="font-bold text-vfes-dark/60 hover:underline">{tt('Marketing →')}</Link>
        <Link to="/portal/sales"           className="font-bold text-vfes-dark/60 hover:underline">{tt('Sales →')}</Link>
        <Link to="/portal/customer-360"    className="font-bold text-vfes-dark/60 hover:underline">{tt('Customer 360 →')}</Link>
      </div>

      </>)}

      {tab === 'forms' && (<>
      {/* Row 4 — Funnel (mobile/desktop split) + Drop reasons + form-field */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={`Funnel · ${tt(sel.name)} · ${device === 'all' ? 'Mobile + Desktop' : device}`} action={<span className="text-[10px] font-mono text-vfes-dark/45">Inc. revenue per Q · BSD {incRevQ.toFixed(2)}M</span>}>
            <div className="space-y-2">
              {funnel.map((s, i) => {
                const w = (s.n / top) * 100
                const drop = i > 0 ? (1 - s.n / funnel[i-1].n) * 100 : 0
                const mPct = device === 'all' && s.n > 0 ? (s.mobile / (s.mobile + s.desktop)) * 100 : 0
                return (
                  <div key={s.stage} className="grid grid-cols-[120px,1fr,140px] items-center gap-3 text-xs">
                    <span className="font-semibold text-vfes-dark/75">{s.stage}</span>
                    <div className="relative h-9 bg-black/[0.03] rounded">
                      <div className="absolute inset-y-0 left-0 rounded transition-all bg-gradient-to-r from-vfes-red-dark via-vfes-red to-vfes-red-light flex items-center px-3 text-vfes-dark font-bold"
                        style={{ width: `${Math.max(w, 3)}%` }}>
                        {fmtK(s.n)}
                      </div>
                      {device === 'all' && (
                        <div className="absolute inset-y-0 left-0 border-r-2 border-white/40" style={{ width: `${(w * mPct / 100)}%` }} />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{((s.n / top) * 100).toFixed(1)}%</div>
                      {i > 0 && <div className="text-[10px] text-red-600 font-mono">−{drop.toFixed(0)}%</div>}
                    </div>
                  </div>
                )
              })}
            </div>
            {device === 'all' && (
              <div className="flex gap-3 text-[10px] uppercase tracking-widest text-vfes-dark/55 mt-3 pt-3 border-t border-black/5">
                <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Mobile (light bar)')}</span>
                <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{tt('Desktop')}</span>
                <span className="ml-auto">Mobile checkout drops <span className="font-bold text-red-600">{tt('−2.4× harder')}</span></span>
              </div>
            )}
          </Panel>
        </div>

        <Panel title={tt('Drop-off Reasons (Cortex AI)')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
          <div className="text-[10px] text-vfes-dark/55 mb-3 uppercase tracking-widest">{tt('From PEGA chat transcripts')}</div>
          {dropReasons.map((r) => (
            <div key={r.r} className="py-2 border-b border-black/5 last:border-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-vfes-dark/75 truncate pr-2">{r.r}</span>
                <span className="font-bold">{r.n}%</span>
              </div>
              <div className="h-1.5 bg-[#f3f4f7] rounded-full overflow-hidden">
                <div className={`h-full ${r.color}`} style={{ width: `${r.n * 2}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('SNOWFLAKE.CORTEX.COMPLETE · llama3.1-70b')}</div>
        </Panel>
      </div>

      {/* Row 5 — Form-field analytics */}
      <div className="mb-6">
        <Panel title={tt('Form-field analytics — checkout breakdown')} action={<span className="text-[10px] font-mono text-vfes-dark/45">{tt('% sessions abandoning at field')}</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-2">{tt('Field')}</th><th>{tt('Drop %')}</th><th>{tt('Avg time')}</th><th>{tt('Issue')}</th><th /></tr>
            </thead>
            <tbody>
              {formFields.map((f) => (
                <tr key={f.field} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold">{f.field}</td>
                  <td className={`font-bold ${f.dropPct > 12 ? 'text-red-600' : f.dropPct > 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{f.dropPct}%</td>
                  <td className="font-mono text-xs">{f.time}</td>
                  <td className="text-xs text-vfes-dark/65">{f.issue || <span className="text-emerald-600">—</span>}</td>
                  <td className="text-right">
                    {f.issue && <button className="text-[11px] font-semibold text-vfes-dark hover:underline">{tt('Open ticket →')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Row 6 — Channel ROAS table */}
      <div className="mb-6">
        <Panel title={`Channel performance · attribution: ${attribution === 'last' ? 'Last-click' : attribution === 'data' ? 'Data-driven (Snowflake ML)' : 'MMM-blended'}`}
          action={<span className="text-[10px] font-mono text-vfes-dark/45">Σ spend BSD {(totalSpend/1000).toFixed(1)}K · LTV BSD {sel.arpu * 32}</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
              <tr>
                <th className="py-2">{tt('Channel')}</th>
                <th>{tt('Sessions')}</th>
                <th>{tt('Spend')}</th>
                <th>{tt('Orders')}</th>
                <th>{tt('CAC')}</th>
                <th>{tt('ROAS')}</th>
                <th>{tt('LTV : CAC')}</th>
                <th>{tt('Conv %')}</th>
                <th>{tt('Assists')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {channelView.map((c) => {
                const ratio = c.cac > 0 ? c.ltv / c.cac : 99
                return (
                  <tr key={c.c} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5 font-semibold">{c.c}</td>
                    <td>{(c.sessions/1000).toFixed(0)}K</td>
                    <td className="font-mono">{c.spend > 0 ? `BSD ${(c.spend/1000).toFixed(1)}K` : '—'}</td>
                    <td className="font-mono">{c.adjOrders.toLocaleString()}</td>
                    <td className={`font-mono font-bold ${c.cac > 50 ? 'text-red-600' : c.cac > 20 ? 'text-amber-600' : c.cac > 0 ? 'text-emerald-600' : 'text-vfes-dark/45'}`}>{c.cac > 0 ? `BSD ${c.cac.toFixed(0)}` : 'organic'}</td>
                    <td className={`font-mono font-bold ${c.roas > 3 ? 'text-emerald-600' : c.roas > 1 ? 'text-amber-600' : c.roas > 0 ? 'text-red-600' : 'text-vfes-dark/45'}`}>{c.roas > 0 ? `${c.roas.toFixed(1)}×` : '—'}</td>
                    <td className={`font-mono font-bold ${ratio > 3 ? 'text-emerald-600' : ratio > 1 ? 'text-amber-600' : 'text-red-600'}`}>{ratio < 99 ? `${ratio.toFixed(1)}×` : '∞'}</td>
                    <td>{c.conv}%</td>
                    <td className="font-mono text-xs text-vfes-dark/55">+{c.assistConv}%</td>
                    <td className="text-right">
                      {c.cac > 50 ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{tt('Pause')}</span>
                      ) : c.roas > 4 ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{tt('Scale')}</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tt('Hold')}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      </div>

      </>)}

      {tab === 'audiences' && (<>
      {/* Row 7 — Trend & Pacing */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`Conv. rate · last 24h · ${tt(sel.name)}`} action={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="h" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={10} domain={[0, 3]} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={1.62} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'baseline 1.62%', fontSize: 10, fill: '#94a3b8' }} />
                <Line type="monotone" dataKey="baseline" stroke="#cbd5e1" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="rate" stroke="#222128" strokeWidth={2.5} dot={{ fill: '#FF4438', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Forecast & Pacing — Q to date')} action={<Target className="w-4 h-4 text-vfes-dark" />}>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={pacingSeries}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={10} tickFormatter={(v) => `BSD ${v}K`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#222128" strokeWidth={2.5} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Actual')}</div><div className="font-bold">BSD {actualToDate.toFixed(0)}K</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Target')}</div><div className="font-bold">BSD {targetToDate.toFixed(0)}K</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Forecast EOM')}</div><div className={`font-bold ${pacingPct >= 100 ? 'text-emerald-700' : 'text-red-600'}`}>{tt('BSD 1.42M')}</div></div>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">
            Need <span className="font-bold text-vfes-dark">{tt('+0.18pp conv')}</span> to land plan · Cortex forecast: <span className="font-bold">{tt('96% prob.')}</span> with retargeting play
          </div>
        </Panel>
      </div>

      {/* Row 8 — Segments + Promo tracker */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Segment cuts — conversion rate by audience')}>
          <div className="space-y-2">
            {segments.map((s) => {
              const max = 3
              const w = (s.conv / max) * 100
              return (
                <div key={s.seg} className="grid grid-cols-[160px,1fr,80px] items-center gap-3 text-xs">
                  <span className="font-semibold text-vfes-dark/75 truncate">{s.seg}</span>
                  <div className="h-5 bg-black/[0.03] rounded">
                    <div className="h-full rounded" style={{ width: `${Math.min(w, 100)}%`, background: s.color }} />
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono">{s.conv.toFixed(2)}%</span>
                    <span className="text-[10px] text-vfes-dark/45 ml-1">{(s.vol/1000).toFixed(0)}K</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-vfes-dark/55">
            <span className="font-bold text-red-600">{tt('Out-of-footprint')}</span> burns 42K sessions / day at 0.04% — <span className="font-semibold text-vfes-dark">{tt('geo-suppress in paid')}</span>
          </div>
        </Panel>

        <Panel title={tt('Promo & discount tracker')} action={<Tag className="w-4 h-4 text-vfes-dark/40" />}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-2">{tt('Code')}</th><th>{tt('Uses')}</th><th>{tt('Discount')}</th><th>{tt('Margin/cust')}</th><th>{tt('Day-90 churn')}</th></tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.code} className="border-t border-black/5">
                  <td className="py-2 font-mono font-bold">{p.code}</td>
                  <td className="font-mono">{p.uses.toLocaleString()}</td>
                  <td className="font-mono">−{p.blend}%</td>
                  <td className={`font-bold ${p.margin > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{p.margin > 0 ? '+' : ''}BSD {p.margin.toFixed(1)}</td>
                  <td className={`font-bold ${p.day90Churn > 15 ? 'text-red-600' : p.day90Churn > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.day90Churn}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-vfes-dark/55">
            <span className="text-red-600 font-bold">{tt('MEGADEAL')}</span> drives 22% Day-90 churn — discount-trained customers churn at month 13. <span className="text-vfes-dark font-semibold">{tt('Retire.')}</span>
          </div>
        </Panel>
      </div>

      {/* Row 9 — Experiments + Competitive */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('A/B experiment register')} action={<FlaskConical className="w-4 h-4 text-vfes-dark/40" />}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-2">{tt('Experiment')}</th><th>{tt('Status')}</th><th>{tt('Lift')}</th><th>{tt('Sig')}</th><th>{tt('Ends')}</th></tr>
            </thead>
            <tbody>
              {experiments.map((e) => (
                <tr key={tt(e.name)} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(e.name)}<div className="text-[10px] text-vfes-dark/45">{tt(e.owner)}</div></td>
                  <td>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      e.status === 'WINNING' ? 'bg-emerald-50 text-emerald-700' :
                      e.status === 'LOSING' ? 'bg-red-50 text-red-700' :
                      e.status === 'INCONCL.' ? 'bg-slate-100 text-slate-600' :
                      'bg-blue-50 text-blue-700'
                    }`}>{tt(e.status)}</span>
                  </td>
                  <td className={`font-mono font-bold ${e.lift.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{e.lift}</td>
                  <td className="font-mono text-xs">{e.sig}</td>
                  <td className="text-xs text-vfes-dark/65">{e.ends}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Competitive benchmark — Bahamian ISP grid')} action={<Trophy className="w-4 h-4 text-vfes-dark/40" />}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-2">{tt('Brand')}</th><th>{tt('500 Mb')}</th><th>{tt('1 Gb')}</th><th>{tt('2 Gb')}</th><th>{tt('Term')}</th><th>{tt('Install')}</th></tr>
            </thead>
            <tbody>
              {competitive.map((c) => (
                <tr key={c.brand} className={`border-t border-black/5 ${c.brand === 'Cable Bahamas' ? 'bg-vfes-red/5' : ''}`}>
                  <td className="py-2 font-semibold">{c.brand}</td>
                  <td className="font-mono">BSD {c.speed500}</td>
                  <td className="font-mono">BSD {c.speed1G}</td>
                  <td className="font-mono">{typeof c.speed2G === 'number' ? `BSD ${c.speed2G}` : '—'}</td>
                  <td className="font-mono text-xs">{c.contract}mo</td>
                  <td className="font-mono text-xs">{c.install}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-vfes-dark/55">
            <span className="text-red-600 font-bold">{tt('Benchmark B BSD 39 / 12-mo')}</span> is undercutting our 500 Mb · <span className="text-vfes-dark font-semibold">{tt('Pricing brief in queue')}</span>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'activation' && (<>
      {/* Row 10 — Serviceability + Order→Activation funnel */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Serviceability fails by region — Cortex tied to FTTH unlock')} action={<MapPin className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="space-y-1.5">
            {servicefails.map((r) => {
              const max = 4500
              const w = (r.fails / max) * 100
              const live = r.ftthEta === 'Live'
              return (
                <div key={r.region} className="grid grid-cols-[140px,1fr,90px,80px] items-center gap-2 text-xs">
                  <span className="font-semibold text-vfes-dark/75 truncate">{r.region}</span>
                  <div className="relative h-5 bg-black/[0.03] rounded">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${w}%`, background: live ? '#10b981' : r.pct > 25 ? '#dc2626' : '#f59e0b' }} />
                  </div>
                  <span className="font-mono text-[11px] text-right">{r.fails.toLocaleString()}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-right ${live ? 'text-emerald-700' : 'text-vfes-dark/55'}`}>{r.ftthEta}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex justify-between items-center text-[11px]">
            <span className="text-vfes-dark/55">{tt('8.0K paid sessions / day landing on un-serviceable postcodes')}</span>
            <a className="font-bold text-vfes-dark flex items-center gap-1 hover:underline" href="#/portal/coverage-map">Coverage Map <ArrowUpRight className="w-3 h-3" /></a>
          </div>
        </Panel>

        <Panel title={tt('Post-order → Day 90 — the second half of the funnel')} action={<ShieldCheck className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="space-y-1.5">
            {postOrder.map((s, i) => {
              const w = (s.n / postOrder[0].n) * 100
              const drop = i > 0 ? (1 - s.n / postOrder[i-1].n) * 100 : 0
              return (
                <div key={s.stage} className="grid grid-cols-[150px,1fr,90px] items-center gap-2 text-xs">
                  <span className="font-semibold text-vfes-dark/75 truncate">{s.stage}</span>
                  <div className="relative h-5 bg-black/[0.03] rounded">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${w}%`, background: s.color }} />
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold">{s.n.toLocaleString()}</span>
                    {i > 0 && <span className="text-[10px] text-red-600 font-mono ml-1">−{drop.toFixed(0)}%</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2 text-[11px]">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Order→Active')}</div><div className="font-bold text-emerald-700">73.2%</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Day-90 retained')}</div><div className="font-bold text-amber-600">68.9%</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Install no-show')}</div><div className="font-bold">8.4%</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">Buyer's remorse 30d</div><div className="font-bold text-red-600">5.6%</div></div>
          </div>
        </Panel>
      </div>

      {/* Row 11 — Chat save funnel */}
      <div className="mb-6">
        <Panel title={tt('Chat-save loop — what those 142 saves are really worth')} action={<MessageCircle className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-1.5">
              {chatSave.map((s, i) => {
                const w = (s.n / chatSave[0].n) * 100
                const drop = i > 0 ? (1 - s.n / chatSave[i-1].n) * 100 : 0
                return (
                  <div key={s.step} className="grid grid-cols-[180px,1fr,100px] items-center gap-2 text-xs">
                    <span className="font-semibold text-vfes-dark/75 truncate">{s.step}</span>
                    <div className="relative h-5 bg-black/[0.03] rounded">
                      <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${w}%`, background: s.color }} />
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold">{s.n.toLocaleString()}</span>
                      {i > 0 && <span className="text-[10px] text-red-600 font-mono ml-1">−{drop.toFixed(0)}%</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Cost per save')}</div>
                <div className="text-lg font-extrabold text-vfes-dark">BSD 18</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('Agent + tooling (blended)')}</div>
              </div>
              <div className="p-2.5 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Save → 90d retained')}</div>
                <div className="text-lg font-extrabold text-emerald-700">83%</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('vs 91% non-save baseline')}</div>
              </div>
              <div className="p-2.5 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Bot vs agent')}</div>
                <div className="text-lg font-extrabold">62 / 38</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('Bot deflects · agent saves more')}</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      </>)}

      {tab === 'actions' && (<>
      {/* Row 12 — Action queue */}
      <div className="mb-6">
        <Panel title={tt('Action Queue — what should marketing do NOW')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
              <tr><th className="py-2">{tt('Type')}</th><th>P</th><th>{tt('Action')}</th><th>{tt('Impact')}</th><th>{tt('Why · play')}</th><th>{tt('Owner')}</th><th /></tr>
            </thead>
            <tbody>
              {actionQueue.map((a) => (
                <tr key={tt(a.title)} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="py-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      a.type === 'Fix' ? 'bg-red-50 text-red-700' :
                      a.type === 'Pause' || a.type === 'Stop' ? 'bg-amber-50 text-amber-700' :
                      a.type === 'Promote' || a.type === 'Match' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>{a.type}</span>
                  </td>
                  <td><span className={`text-[10px] font-mono font-bold ${a.priority === 'P0' ? 'text-red-600' : a.priority === 'P1' ? 'text-amber-600' : 'text-vfes-dark/55'}`}>{a.priority}</span></td>
                  <td className="font-semibold">{tt(a.title)}</td>
                  <td className="font-bold text-emerald-700 text-xs">{a.impact}</td>
                  <td className="text-xs text-vfes-dark/70 max-w-[300px]">{a.why}<div className="text-[10px] text-vfes-dark/45 mt-0.5">→ {a.play}</div></td>
                  <td className="text-xs">{tt(a.owner)}</td>
                  <td className="text-right">
                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded bg-vfes-red text-vfes-dark hover:bg-vfes-red/90 flex items-center gap-1 ml-auto">
                      <Send className="w-3 h-3" /> {a.cta}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Row 13 — Model card + Cortex prompts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Model card — funnel_classifier_v4 + retarget_propensity_v2')} action={<GitBranch className="w-4 h-4 text-vfes-dark/40" />}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Drop-off LLM')}</div><div className="font-semibold">{tt('Cortex Complete · llama3.1-70b')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Anomaly detection')}</div><div className="font-semibold">{tt('Snowflake ML AD · 7d window')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Attribution')}</div><div className="font-semibold">{tt('Markov / Shapley · daily refresh')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Retarget propensity')}</div><div className="font-semibold">{tt('XGBoost · AUC 0.86')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('MMM')}</div><div className="font-semibold">{tt('Robyn weekly · saturation curves')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Streaming lag')}</div><div className="font-semibold text-emerald-700">{tt('18s p95 (Snowpipe Streaming)')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Owner')}</div><div className="font-semibold">{tt('Digital Analytics · T. Bethel')}</div></div>
            <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('GDPR basis')}</div><div className="font-semibold">{tt('Cookie consent · DPIA-2024-WEB-04')}</div></div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
            <span className="font-mono text-vfes-dark/55">{tt('CBL_ANALYTICS.WEB.CLICKSTREAM ⨝ ML_OUTPUTS.RETARGET')}</span>
            <a className="text-vfes-dark font-semibold flex items-center gap-1 hover:underline" href="#">Open lineage <ArrowUpRight className="w-3 h-3" /></a>
          </div>
        </Panel>

        <Panel title={tt('Snowflake Intelligence — Ask the data')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
          <div className="space-y-2 text-sm">
            {[
              'Which paid campaigns have CAC > LTV / 3 over the last 7 days? Pause candidates.',
              'How much MRR are we losing to the Postcode lookup timeout per hour?',
              'Compare 500 Mb vs 1 Gb funnel by mobile / desktop · where is the biggest leak?',
              'List 5,000 cart-abandoners in Nassau with retarget propensity > 0.7 from last 7 days.',
              'If we match Benchmark B\'s BSD 39 12-mo deal on 500 Mb, what is the LTV impact net of cannibalisation?',
              'Forecast EOM revenue at current pace and recommend top 3 levers to land plan.',
            ].map((q) => (
              <button key={q} className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                <span className="flex-1">{q}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('DIGITAL_FUNNEL')}</span></div>
        </Panel>
      </div>

      {/* Cross-links */}
      <div className="flex gap-3 text-xs mt-4">
        <Link to="/portal/promotions"       className="font-bold text-vfes-dark hover:underline">{tt('Promotions →')}</Link>
        <Link to="/portal/churn-retention"  className="font-bold text-vfes-dark/60 hover:underline">{tt('Churn & Retention →')}</Link>
        <Link to="/portal/operations"       className="font-bold text-vfes-dark/60 hover:underline">{tt('Operations →')}</Link>
      </div>
      </>)}

      {/* ══════════════ A/B TESTS ═══════════════════════════════════════════════ */}
      {tab === 'ab-tests' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active tests')}       value="3"       delta={tt('2 winning')}         trend="up"   icon={FlaskConical} accent />
          <KpiCard label={tt('Avg test duration')}  value="9d"      delta={tt('p < 0.05 target')}   trend="flat" icon={Activity}     />
          <KpiCard label={tt('Lift (best test)')}   value="+18.4%"  delta={tt('Postal autocomplete')} trend="up" icon={TrendingUp}   />
          <KpiCard label={tt('Tests stopped early')} value="1"      delta={tt('LOSING')}             trend="down" icon={AlertTriangle} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Filter:')}</span>
          {(['all', 'winning', 'running'] as const).map(f => (
            <button key={f} onClick={() => setAbFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${abFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {f === 'all' ? tt('All') : f === 'winning' ? tt('Winning') : tt('Running')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Postcode autocomplete v2 — conversion trend (days)')}
            action={<span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase">{tt('Winning · 99% sig')}</span>}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={AB_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="#999" fontSize={11} label={{ value: tt('Day of test'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[1.4, 2.2]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="control" name={tt('Control')} stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="variant" name={tt('Variant')} stroke="#10B981" strokeWidth={2.5} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Variant has separated cleanly — ready to promote to 100% traffic')}</div>
          </Panel>

          <Panel title={tt('A/B experiment register')} action={<FlaskConical className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Experiment')}</th><th>{tt('Status')}</th><th>{tt('Lift')}</th><th>{tt('Sig')}</th><th>{tt('Ends')}</th></tr>
                </thead>
                <tbody>
                  {filteredExperiments.map((e) => (
                    <tr key={tt(e.name)} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{tt(e.name)}<div className="text-[10px] text-vfes-dark/45">{tt(e.owner)}</div></td>
                      <td><span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        e.status === 'WINNING' ? 'bg-emerald-50 text-emerald-700' :
                        e.status === 'LOSING' ? 'bg-red-50 text-red-700' :
                        e.status === 'INCONCL.' ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-50 text-blue-700'
                      }`}>{tt(e.status)}</span></td>
                      <td className={`font-mono font-bold ${e.lift.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{e.lift}</td>
                      <td className="font-mono text-xs">{e.sig}</td>
                      <td className="text-xs text-vfes-dark/65">{e.ends}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <Link to="/portal/digital-funnel" className="font-bold text-vfes-dark hover:underline">{tt('Digital Funnel →')}</Link>
              <Link to="/portal/marketing"      className="font-bold text-vfes-dark/60 hover:underline">{tt('Marketing →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ COHORT ════════════════════════════════════════════════════ */}
      {tab === 'cohort' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg M3 retention')} value={`${cohortMetrics.avgM3}%`} delta={tt('of Day-0 subscribers')} trend="up"   icon={Users}      accent />
          <KpiCard label={tt('Day-90 retained')}  value="68.9%"                      delta={tt('from order placed')}    trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Avg LTV 24mo')}      value="BSD 1,124"                      delta={tt('blended · all cohorts')} trend="up"   icon={DollarSign} />
          <KpiCard label={tt('Churn month 13')}    value="8.4%"                       delta={tt('discount churn risk')}  trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cohort retention — % of Day-0 cohort remaining')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={COHORT_RETENTION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[60, 105]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="m0" name={tt('Month 0')} stroke="#1e293b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="m1" name={tt('Month 1')} stroke="#222128" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="m3" name={tt('Month 3')} stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="m5" name={tt('Month 5')} stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cumulative LTV curve — avg subscriber (BSD )')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={COHORT_LTV}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="mo" stroke="#999" fontSize={11} label={{ value: tt('Month'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis stroke="#999" fontSize={11} unit="BSD " />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="ltv" name={tt('Cumulative LTV BSD ')} stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Cohort scorecard — retention by month')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Cohort')}</th>
                  <th className="text-right">{tt('M0')}</th>
                  <th className="text-right">{tt('M1')}</th>
                  <th className="text-right">{tt('M2')}</th>
                  <th className="text-right">{tt('M3')}</th>
                  <th className="text-right">{tt('M4')}</th>
                  <th className="text-right">{tt('M5')}</th>
                </tr>
              </thead>
              <tbody>
                {COHORT_RETENTION.map(c => (
                  <tr key={c.cohort} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{c.cohort}</td>
                    {[c.m0, c.m1, c.m2, c.m3, c.m4, c.m5].map((v, i) => (
                      <td key={i} className={`text-right font-mono ${
                        v === null ? 'text-vfes-dark/25' :
                        v >= 80 ? 'text-emerald-600 font-bold' :
                        v >= 70 ? 'text-amber-600' : 'text-red-600'
                      }`}>{v !== null ? `${v}%` : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/churn-retention"  className="font-bold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/customer-360"     className="font-bold text-vfes-dark/60 hover:underline">{tt('Customer 360 →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ ATTRIBUTION ═══════════════════════════════════════════════ */}
      {tab === 'attribution' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Last-click orders')}  value="5,151"   delta={tt('vs 5,320 data-driven')} trend="flat" icon={BarChart2}  accent />
          <KpiCard label={tt('Display assist conv')} value="+280"    delta={tt('hidden in last-click')} trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('TikTok re-evaluated')} value="+111"    delta={tt('MMM-blended vs last')}  trend="up"   icon={Sparkles}    />
          <KpiCard label={tt('Over-invested paid')}  value="-BSD 2.1K"  delta={tt('Paid Search vs data')} trend="down" icon={AlertTriangle} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Model:')}</span>
          {([['last', 'Last-click'], ['dataDriven', 'Data-driven'], ['mmm', 'MMM-blended']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setAttrModel(k)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${attrModel === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Attribution model comparison — orders by channel')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ATTRIBUTION_COMPARE} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="channel" stroke="#999" fontSize={9} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="last"       name={tt('Last-click')}   fill="#94a3b8"   radius={[0, 4, 4, 0]} />
                  <Bar dataKey="dataDriven" name={tt('Data-driven')}  fill="#FF4438"   radius={[0, 4, 4, 0]} />
                  <Bar dataKey="mmm"        name={tt('MMM-blended')}  fill="#7C3AED"   radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Channel efficiency ROAS trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={CHANNEL_EFFICIENCY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="×" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="email"   name={tt('Email')}   stroke="#10B981" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="paid"    name={tt('Paid')}    stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="organic" name={tt('Organic')} stroke="#222128" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="social"  name={tt('Social')}  stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Attribution shift — last-click vs selected model')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Channel')}</th>
                  <th className="text-right">{tt('Last-click')}</th>
                  <th className="text-right">{tt('Selected model')}</th>
                  <th className="text-right">{tt('Delta')}</th>
                  <th>{tt('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {attrData.map(c => {
                  const delta = c.selected - c.last
                  return (
                    <tr key={c.channel} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{c.channel}</td>
                      <td className="text-right font-mono">{c.last.toLocaleString()}</td>
                      <td className="text-right font-mono font-bold">{c.selected.toLocaleString()}</td>
                      <td className={`text-right font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-vfes-dark/55'}`}>{delta > 0 ? '+' : ''}{delta}</td>
                      <td>{delta < -100 ? <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase">{tt('Review budget')}</span> : delta > 100 ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase">{tt('Scale')}</span> : null}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/marketing"       className="font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            <Link to="/portal/ai-insights"     className="font-bold text-vfes-dark/60 hover:underline">{tt('AI Insights →')}</Link>
            <Link to="/portal/promotions"      className="font-bold text-vfes-dark/60 hover:underline">{tt('Promotions →')}</Link>
          </div>
        </Panel>
      </>)}
    </div>
  )
}
