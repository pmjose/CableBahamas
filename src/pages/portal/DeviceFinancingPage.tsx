import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Smartphone, RefreshCw, Shield, TrendingDown, Brain, ChevronRight,
  Layers, Boxes, CreditCard, Package, Activity, ShieldCheck, Zap,
  DollarSign, Bell, TrendingUp,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, Scatter, ScatterChart, ZAxis,
  AreaChart, Area, ComposedChart, PieChart, Pie, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981'
const AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8', RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── EIP Aging ───────────────────────────────────────────────────────────────
const EIP_AGING = [
  { bucket: 'Current', amt: 84.0, color: GREEN },
  { bucket: '1-30 d',  amt:  9.2, color: BLUE  },
  { bucket: '31-60 d', amt:  4.1, color: AMBER },
  { bucket: '60+ d',   amt:  3.4, color: RED   },
]

const SUBSIDY = [
  { m: 'Jan', subsidy: 4.2, recovered: 3.1 },
  { m: 'Feb', subsidy: 3.8, recovered: 2.9 },
  { m: 'Mar', subsidy: 4.6, recovered: 3.4 },
  { m: 'Apr', subsidy: 5.1, recovered: 4.0 },
  { m: 'May', subsidy: 4.4, recovered: 3.6 },
  { m: 'Jun', subsidy: 4.0, recovered: 3.5 },
]

const TRADE_IN = [
  { model: 'iPhone 14 Pro', taken: 1840, residual: 420, resale: 510, status: 'profit' },
  { model: 'iPhone 13',     taken: 2210, residual: 280, resale: 320, status: 'profit' },
  { model: 'Galaxy S23',    taken: 1120, residual: 240, resale: 250, status: 'flat'   },
  { model: 'Pixel 7',       taken:  640, residual: 180, resale: 160, status: 'loss'   },
  { model: 'Galaxy A54',    taken:  980, residual: 120, resale: 130, status: 'flat'   },
]

const INSURANCE = [
  { metric: 'Insurance attach rate', value: '34%',   note: '+6 pp YoY'           },
  { metric: 'Monthly premium',       value: 'BSD 7.99', note: 'avg per device'       },
  { metric: 'Claims ratio',          value: '52%',   note: 'healthy underwriting' },
  { metric: 'Insurance margin',      value: 'BSD 2.4M', note: 'annualised'           },
]

const DEVICE_MARGIN = [
  { model: 'iPhone 15',     margin: 58, attach: 41, units: 8200, tier: 'flagship' },
  { model: 'iPhone 15 Pro', margin: 92, attach: 48, units: 6100, tier: 'flagship' },
  { model: 'Galaxy S24',    margin: 64, attach: 38, units: 4900, tier: 'flagship' },
  { model: 'Pixel 8',       margin: 36, attach: 29, units: 1800, tier: 'mid'      },
  { model: 'Galaxy A55',    margin: 22, attach: 21, units: 7400, tier: 'mid'      },
  { model: 'Redmi Note 13', margin: 14, attach: 16, units: 9200, tier: 'value'    },
]

const PAYBACK = [
  { plan: 'Unlimited 5G+ · 24mo', subsidy: 180, paybackMo:  9, contractMo: 24, status: 'ok'    },
  { plan: '150GB · 24mo',         subsidy: 120, paybackMo: 11, contractMo: 24, status: 'ok'    },
  { plan: '60GB · 24mo',          subsidy:  90, paybackMo: 14, contractMo: 24, status: 'watch' },
  { plan: '25GB · 12mo',          subsidy:  60, paybackMo: 13, contractMo: 12, status: 'risk'  },
]

const ATTACH = [
  { stage: 'Device sales',       n: 38400 },
  { stage: 'On EIP financing',   n: 26100 },
  { stage: 'Insurance attached', n: 13000 },
  { stage: 'Trade-in taken',     n:  6800 },
]

// ─── EIP book monthly trend ──────────────────────────────────────────────────
const EIP_BOOK_TREND = [
  { m: 'Jan', book: 88.4,  defaultPct: 2.8, writeoff: 0.8 },
  { m: 'Feb', book: 90.2,  defaultPct: 2.6, writeoff: 0.7 },
  { m: 'Mar', book: 93.8,  defaultPct: 2.5, writeoff: 0.7 },
  { m: 'Apr', book: 96.2,  defaultPct: 2.4, writeoff: 0.6 },
  { m: 'May', book: 98.8,  defaultPct: 2.2, writeoff: 0.6 },
  { m: 'Jun', book: 100.7, defaultPct: 2.1, writeoff: 0.5 },
]

// ─── Residual value depreciation ────────────────────────────────────────────
const RESIDUAL_TREND = [
  { m: 'Jan', flagship: 48, mid: 28, value: 12 },
  { m: 'Feb', flagship: 46, mid: 27, value: 11 },
  { m: 'Mar', flagship: 44, mid: 26, value: 11 },
  { m: 'Apr', flagship: 43, mid: 25, value: 10 },
  { m: 'May', flagship: 42, mid: 24, value: 10 },
  { m: 'Jun', flagship: 40, mid: 23, value:  9 },
]

// ─── Device catalog ──────────────────────────────────────────────────────────
const DEVICE_CATALOG = [
  { sku: 'APL-15-128',   name: 'iPhone 15 128 GB',      tier: 'flagship', rrp: 979,  eip24: 40.8, eip12:  81.6, stock: 1240, attachPct: 41, marginE: 58 },
  { sku: 'APL-15P-256',  name: 'iPhone 15 Pro 256 GB',  tier: 'flagship', rrp: 1199, eip24: 49.9, eip12:  99.9, stock:  840, attachPct: 48, marginE: 92 },
  { sku: 'SAM-S24-256',  name: 'Galaxy S24 256 GB',     tier: 'flagship', rrp: 899,  eip24: 37.5, eip12:  75.0, stock:  980, attachPct: 38, marginE: 64 },
  { sku: 'SAM-A55-128',  name: 'Galaxy A55 128 GB',     tier: 'mid',      rrp: 449,  eip24: 18.7, eip12:  37.4, stock: 3240, attachPct: 21, marginE: 22 },
  { sku: 'GOG-PIX8-128', name: 'Pixel 8 128 GB',        tier: 'mid',      rrp: 599,  eip24: 24.9, eip12:  49.9, stock:  620, attachPct: 29, marginE: 36 },
  { sku: 'XIA-RED-128',  name: 'Redmi Note 13 128 GB',  tier: 'value',    rrp: 229,  eip24:  9.5, eip12:  19.0, stock: 4820, attachPct: 16, marginE: 14 },
  { sku: 'APL-15-256',   name: 'iPhone 15 256 GB',      tier: 'flagship', rrp: 1099, eip24: 45.8, eip12:  91.6, stock:  680, attachPct: 44, marginE: 68 },
  { sku: 'SAM-A35-128',  name: 'Galaxy A35 128 GB',     tier: 'mid',      rrp: 349,  eip24: 14.5, eip12:  29.1, stock: 2840, attachPct: 18, marginE: 18 },
]

// ─── Inventory aging ─────────────────────────────────────────────────────────
const INVENTORY_AGING = [
  { bucket: '0-30 d',   units: 8420, pct: 62, color: GREEN      },
  { bucket: '31-60 d',  units: 2840, pct: 21, color: BLUE       },
  { bucket: '61-90 d',  units: 1240, pct:  9, color: AMBER      },
  { bucket: '91-120 d', units:  620, pct:  5, color: '#f97316'  },
  { bucket: '120+ d',   units:  420, pct:  3, color: RED        },
]

// ─── Credit risk ─────────────────────────────────────────────────────────────
const CREDIT_SCORE_DIST = [
  { bucket: '750-850 (Prime)',      pct: 28, eipBook: 28.1, defaultRate: 0.6, color: GREEN     },
  { bucket: '700-749 (Near-prime)', pct: 32, eipBook: 32.2, defaultRate: 1.1, color: BLUE      },
  { bucket: '650-699 (Sub A)',      pct: 24, eipBook: 24.2, defaultRate: 2.4, color: AMBER     },
  { bucket: '600-649 (Sub B)',      pct: 11, eipBook: 11.1, defaultRate: 4.8, color: '#f97316' },
  { bucket: '<600 (Deep sub)',      pct:  5, eipBook:  5.1, defaultRate: 9.2, color: RED       },
]

const DELINQUENCY_TREND = [
  { m: 'Jan', dq30: 4.2, dq60: 2.1, dq90: 1.4 },
  { m: 'Feb', dq30: 4.0, dq60: 2.0, dq90: 1.3 },
  { m: 'Mar', dq30: 3.8, dq60: 1.9, dq90: 1.2 },
  { m: 'Apr', dq30: 3.6, dq60: 1.8, dq90: 1.1 },
  { m: 'May', dq30: 3.4, dq60: 1.7, dq90: 1.1 },
  { m: 'Jun', dq30: 3.2, dq60: 1.6, dq90: 1.0 },
]

const CREDIT_DECISIONS = [
  { month: 'Jan', approved:  9820, conditional: 1240, declined: 940 },
  { month: 'Feb', approved: 10200, conditional: 1180, declined: 860 },
  { month: 'Mar', approved: 11400, conditional: 1320, declined: 780 },
  { month: 'Apr', approved: 12100, conditional: 1100, declined: 720 },
  { month: 'May', approved: 11800, conditional:  980, declined: 680 },
  { month: 'Jun', approved: 12800, conditional: 1040, declined: 640 },
]

// ─── Insurance trend ─────────────────────────────────────────────────────────
const INSURANCE_TREND = [
  { m: 'Jan', attach: 28, claimsPct: 54, premiumE: 7.20 },
  { m: 'Feb', attach: 29, claimsPct: 53, premiumE: 7.40 },
  { m: 'Mar', attach: 30, claimsPct: 52, premiumE: 7.60 },
  { m: 'Apr', attach: 31, claimsPct: 51, premiumE: 7.80 },
  { m: 'May', attach: 33, claimsPct: 52, premiumE: 7.90 },
  { m: 'Jun', attach: 34, claimsPct: 52, premiumE: 7.99 },
]

// ─── Attach by channel ───────────────────────────────────────────────────────
const ATTACH_BY_CHANNEL = [
  { channel: 'Store',     financing: 78, insurance: 42, tradein: 28 },
  { channel: 'Web',       financing: 62, insurance: 28, tradein: 18 },
  { channel: 'App',       financing: 68, insurance: 34, tradein: 22 },
  { channel: 'Telesales', financing: 72, insurance: 38, tradein: 24 },
  { channel: 'Dealer',    financing: 54, insurance: 22, tradein: 14 },
]

// ─── Attach rate trend ───────────────────────────────────────────────────────
const ATTACH_TREND = [
  { m: 'Jan', financing: 62, insurance: 28, tradein: 14 },
  { m: 'Feb', financing: 63, insurance: 29, tradein: 15 },
  { m: 'Mar', financing: 65, insurance: 30, tradein: 16 },
  { m: 'Apr', financing: 66, insurance: 31, tradein: 17 },
  { m: 'May', financing: 67, insurance: 33, tradein: 17 },
  { m: 'Jun', financing: 68, insurance: 34, tradein: 18 },
]

// ─── Margin by channel ───────────────────────────────────────────────────────
const MARGIN_BY_CHANNEL = [
  { channel: 'Store',     marginE: 62, units: 12400 },
  { channel: 'Web',       marginE: 44, units:  9800 },
  { channel: 'App',       marginE: 50, units:  7200 },
  { channel: 'Telesales', marginE: 38, units:  4100 },
  { channel: 'Dealer',    marginE: 28, units:  4900 },
]

// ─── Buy-back programme ──────────────────────────────────────────────────────
const BUYBACK_TRACKER = [
  { partner: 'Back Market',   units: 2480, avgPrice: 248, grade: 'A/B', margin: +18, time: '14d' },
  { partner: 'Swappie',       units: 1120, avgPrice: 212, grade: 'A',   margin: +24, time:  '9d' },
  { partner: 'Cable Bahamas refurb', units: 840, avgPrice: 268, grade: 'A+', margin: +32, time: '21d' },
  { partner: 'Recycling (eco)', units: 380, avgPrice:  42, grade: 'C/D', margin:  -6, time:  '5d' },
]

// ─── Tabs ────────────────────────────────────────────────────────────────────
type TabId = 'financing' | 'margin' | 'payback' | 'attach' | 'tradein' | 'insurance' | 'inventory' | 'credit'

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'financing', label: 'EIP Book',       icon: Smartphone  },
  { id: 'margin',    label: 'Device Margin',   icon: Layers      },
  { id: 'payback',   label: 'Subsidy Payback', icon: TrendingDown },
  { id: 'attach',    label: 'Attach Funnel',   icon: Boxes       },
  { id: 'tradein',   label: 'Trade-in',        icon: RefreshCw   },
  { id: 'insurance', label: 'Insurance',       icon: Shield      },
  { id: 'inventory', label: 'Inventory',       icon: Package     },
  { id: 'credit',    label: 'Credit Risk',     icon: CreditCard  },
]

export default function DeviceFinancingPage() {
  const [tab, setTab] = useState<TabId>('financing')
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'flagship' | 'mid' | 'value'>('all')
  const [creditTier, setCreditTier] = useState<'all' | 'prime' | 'near' | 'sub'>('all')
  const [invSort, setInvSort] = useState<'stock' | 'turnover' | 'margin'>('stock')
  const [chartPeriod, setChartPeriod] = useState<'1m' | '3m' | '6m'>('6m')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [highlightSku, setHighlightSku] = useState<string | null>(null)

  const totalEip = EIP_AGING.reduce((s, a) => s + a.amt, 0)
  const maxAttach = ATTACH[0].n

  const filteredCatalog = useMemo(
    () => deviceFilter === 'all' ? DEVICE_CATALOG : DEVICE_CATALOG.filter(d => d.tier === deviceFilter),
    [deviceFilter],
  )

  const sortedInventory = useMemo(
    () => [...DEVICE_CATALOG].sort((a, b) =>
      invSort === 'stock' ? b.stock - a.stock :
      invSort === 'margin' ? b.marginE - a.marginE :
      b.attachPct - a.attachPct),
    [invSort],
  )

  const creditMetrics = useMemo(() => {
    const filtered = creditTier === 'all' ? CREDIT_SCORE_DIST :
      creditTier === 'prime' ? CREDIT_SCORE_DIST.filter(c => c.bucket.includes('750')) :
      creditTier === 'near'  ? CREDIT_SCORE_DIST.filter(c => c.bucket.includes('700')) :
      CREDIT_SCORE_DIST.filter(c => !c.bucket.includes('750') && !c.bucket.includes('700'))
    const totalBook = filtered.reduce((s, c) => s + c.eipBook, 0)
    const wtdDefault = filtered.reduce((s, c) => s + c.eipBook * c.defaultRate, 0) / Math.max(totalBook, 0.01)
    return { totalBook, wtdDefault, filtered }
  }, [creditTier])

  const residualData = useMemo(
    () => chartPeriod === '1m' ? RESIDUAL_TREND.slice(-1) :
          chartPeriod === '3m' ? RESIDUAL_TREND.slice(-3) :
          RESIDUAL_TREND,
    [chartPeriod],
  )

  const attachEfficiency = useMemo(
    () => ATTACH_BY_CHANNEL.map(c => ({ ...c, total: c.financing + c.insurance + c.tradein })),
    [],
  )

  const inventoryAtRisk = useMemo(
    () => INVENTORY_AGING.filter(i => i.bucket.startsWith('91') || i.bucket.startsWith('120')).reduce((s, i) => s + i.units, 0),
    [],
  )

  const inventoryPieData = useMemo(() => [
    { name: tt('Flagship'), value: DEVICE_CATALOG.filter(d => d.tier === 'flagship').reduce((s, d) => s + d.stock, 0), fill: NAVY  },
    { name: tt('Mid'),      value: DEVICE_CATALOG.filter(d => d.tier === 'mid').reduce((s, d) => s + d.stock, 0),      fill: BLUE  },
    { name: tt('Value'),    value: DEVICE_CATALOG.filter(d => d.tier === 'value').reduce((s, d) => s + d.stock, 0),    fill: SLATE },
  ], [])

  useEffect(() => { /* live data hook placeholder */ }, [])

  const statusColor = (s: string) =>
    s === 'profit' || s === 'ok' ? 'text-emerald-600' : s === 'flat' || s === 'watch' ? 'text-amber-600' : 'text-red-600'
  const pillColor = (s: string) =>
    s === 'ok' ? 'bg-emerald-50 text-emerald-700' : s === 'watch' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Device & Trade-in Book')}
        subtitle={tt('EIP receivables · device margin · subsidy payback · attach · trade-in · insurance · inventory · credit risk')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">BSD {totalEip.toFixed(0)}M {tt('EIP book')}</span>}
      />


      {/* \u2500\u2500 ML Intelligence \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <MlInsightSection
        heading="Device financing intelligence"
        models={[
          { name: 'Residual Value Model',   metric: 'MAE \u20ac8',       sub: '36-month depreciation curve'         },
          { name: 'Credit Risk Scorer',     metric: 'AUC 0.88',     sub: 'default probability at origination'  },
          { name: 'Attach-rate Propensity', metric: 'precision 0.79', sub: 'insurance & accessory NBO'          },
        ]}
        agentLabel="Run Financing Optimiser"
        agentRunningLabel="Modelling\u2026"
        agentSteps={[
          'Scored residual values across 8 active SKUs',
          'Identified Pixel 7 as over-credited by \u20ac20 on average',
          'Ranked credit risk concentration by score band',
          'Generated attach-rate uplift playbook for store channel',
        ]}
        agentBlurb="One data lake \u2014 EIP ledger, device resale, credit bureau \u2014 feeds all three models so residual pricing, credit decisions and attach promotions stay consistent."
        decision={{
          title: 'Recalibrate residual values and push insurance attach in store',
          detail: 'The residual value model projects Pixel 7 trade-in credits are \u20ac20 over-market. Store insurance attach is 10 pp above web \u2014 scaling store-style prompts to app and web is the fastest attach uplift.',
          impact: '+\u20ac0.8M margin \u00b7 attach rate to 40%',
          risk: 'Residual change may slow Pixel 7 trade-in volume temporarily',
          linkTo: '#/portal/device-financing',
          linkLabel: 'Open Device Financing',
        }}
        chart={{
          kind: 'line',
          title: 'EIP book trend \u2014 monthly balance (\u20acM) vs default rate (%)',
          xKey: 'm',
          unit: 'M',
          data: EIP_BOOK_TREND,
          series: [
            { key: 'book',       name: 'EIP book \u20acM',   color: BLUE               },
            { key: 'defaultPct', name: 'Default rate %', color: AMBER, dashed: true },
          ],
          note: 'Book growing steadily while default rate declines \u2014 portfolio quality improving.',
        }}
      />

      {/* \u2500\u2500 Alert banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">{tt('Pixel 7 over-credited \u00b7 1,040 units >90d stock \u00b7 Sub-prime DQ30 elevated at 4.2%')}</div>
              <div className="text-xs text-amber-800 mt-1">{tt('Recalibrate residual matrix \u00b7 accelerate aged inventory markdowns \u00b7 review sub-prime credit policies')}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/pricing-simulator" className="text-xs font-bold text-amber-900 hover:underline">{tt('Pricing Simulator \u2192')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* \u2500\u2500 KPI row 1 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('EIP receivables')}   value={`\u20ac${totalEip.toFixed(0)}M`} delta={tt('installment book')}    trend="flat" icon={Smartphone}  accent />
        <KpiCard label={tt('Avg device margin')} value="\u20ac48"                         delta={tt('blended per unit')}     trend="up"   icon={Layers}     />
        <KpiCard label={tt('Financing attach')}  value="68%"                         delta={tt('of device sales')}      trend="up"   icon={Boxes}      />
        <KpiCard label={tt('EIP default rate')}  value="2.1%"                        delta={tt('-0.4 pp YoY')}          trend="up"   icon={TrendingDown} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard label={tt('Insurance attach')}  value="34%"                         delta={tt('+6 pp YoY')}            trend="up"   icon={Shield}     />
        <KpiCard label={tt('Trade-in units Q')}  value="6.8K"                        delta={tt('of 38.4K sales')}       trend="flat" icon={RefreshCw}  />
        <KpiCard label={tt('Aged inventory')}    value={`${inventoryAtRisk.toLocaleString()} units`} delta={tt('>90d mark-down risk')} trend="down" icon={Package} />
        <KpiCard label={tt('Subsidy exposure')}  value="\u20ac2.4M"                       delta={tt('outstanding subsidy')}  trend="flat" icon={CreditCard} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Credit approvals')}  value="92%"                         delta={tt('of applications')}      trend="up"   icon={ShieldCheck} />
        <KpiCard label={tt('Device revenue Q')}  value="\u20ac142M"                       delta="+8% QoQ"                   trend="up"   icon={DollarSign}  />
        <KpiCard label={tt('Residual accuracy')} value="MAE \u20ac8"                      delta={tt('36-mo horizon')}        trend="up"   icon={Activity}    />
        <KpiCard label={tt('Attach efficiency')} value="1.22\u00d7"                       delta={tt('insur+tradein/sale')}   trend="up"   icon={Zap}         />
      </div>

      {/* \u2500\u2500 Pill tab nav (8 tabs) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 FINANCING \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'financing' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('EIP receivables aging (\u20acM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={EIP_AGING}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`\u20ac${v}M`, '']} />
                  <Bar dataKey="amt" radius={[6, 6, 0, 0]}>
                    {EIP_AGING.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Handset subsidy vs recovery (\u20acM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={SUBSIDY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`\u20ac${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="subsidy"   stroke={NAVY}  strokeWidth={2.5} name={tt('Subsidy')}   />
                  <Line type="monotone" dataKey="recovered" stroke={GREEN} strokeWidth={2.5} name={tt('Recovered')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('EIP book \u2014 monthly balance vs default rate')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={EIP_BOOK_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="M" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="book"       name={tt('EIP book \u20acM')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="defaultPct" name={tt('Default %')} stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" dot />
                  <ReferenceLine yAxisId="r" y={3} stroke={RED} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red dashed = 3% default threshold')}</div>
          </Panel>

          <Panel title={tt('Residual value \u2014 depreciation by tier (\u20ac)')}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Period:')}</span>
              {(['1m', '3m', '6m'] as const).map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${chartPeriod === p ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={residualData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="\u20ac" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="flagship" name={tt('Flagship')} stroke={NAVY}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="mid"      name={tt('Mid-tier')} stroke={BLUE}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="value"    name={tt('Value')}    stroke={SLATE} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex gap-3 text-xs">
          <Link to="/portal/finance"           className="font-bold text-vfes-dark hover:underline">{tt('Finance \u2192')}</Link>
          <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator \u2192')}</Link>
          <Link to="/portal/sales"             className="font-bold text-vfes-dark hover:underline">{tt('Sales \u2192')}</Link>
        </div>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 MARGIN \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'margin' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Tier:')}</span>
          {(['all', 'flagship', 'mid', 'value'] as const).map(f => (
            <button key={f} onClick={() => setDeviceFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${deviceFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {f === 'all' ? tt('All') : tt(f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Device margin \u00d7 attach by model (bubble = units)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ScatterChart margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="margin" name={tt('Margin')} unit="\u20ac" stroke="#999" fontSize={11} label={{ value: tt('Sell margin \u20ac'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis type="number" dataKey="attach" name={tt('Attach')} unit="%" stroke="#999" fontSize={11} label={{ value: tt('Attach %'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="units" range={[80, 600]} />
                  <Tooltip contentStyle={TS} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={DEVICE_MARGIN}>
                    {DEVICE_MARGIN.map((d, i) => <Cell key={i} fill={d.tier === 'flagship' ? NAVY : d.tier === 'mid' ? BLUE : SLATE} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Device margin by sales channel (\u20ac avg)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={MARGIN_BY_CHANNEL}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="channel" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="\u20ac" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="marginE" name={tt('Avg margin \u20ac')} radius={[6, 6, 0, 0]}>
                    {MARGIN_BY_CHANNEL.map((c, i) => <Cell key={i} fill={c.marginE >= 50 ? NAVY : c.marginE >= 35 ? BLUE : SLATE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Device catalog \u2014 EIP rates, margin & stock')}>
          <div className="text-[10px] text-vfes-dark/55 mb-2">{filteredCatalog.length} {tt('models shown \u2014 click row to highlight')}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Model')}</th>
                  <th>{tt('Tier')}</th>
                  <th className="text-right">{tt('RRP')}</th>
                  <th className="text-right">{tt('EIP 24mo')}</th>
                  <th className="text-right">{tt('EIP 12mo')}</th>
                  <th className="text-right">{tt('Margin \u20ac')}</th>
                  <th className="text-right">{tt('Attach %')}</th>
                  <th className="text-right">{tt('Stock')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map(d => (
                  <tr key={d.sku} onClick={() => setHighlightSku(highlightSku === d.sku ? null : d.sku)}
                    className={`border-b border-black/5 cursor-pointer ${highlightSku === d.sku ? 'bg-vfes-red/5' : 'hover:bg-[#fafbfc]'}`}>
                    <td className="py-2.5 font-semibold text-xs">{d.name}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${d.tier === 'flagship' ? 'bg-blue-100 text-blue-700' : d.tier === 'mid' ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-600'}`}>{tt(d.tier)}</span></td>
                    <td className="text-right font-mono text-xs">\u20ac{d.rrp}</td>
                    <td className="text-right font-mono text-xs">\u20ac{d.eip24}/mo</td>
                    <td className="text-right font-mono text-xs">\u20ac{d.eip12}/mo</td>
                    <td className={`text-right font-bold ${d.marginE >= 60 ? 'text-emerald-600' : d.marginE >= 30 ? 'text-amber-600' : 'text-vfes-dark/65'}`}>\u20ac{d.marginE}</td>
                    <td className={`text-right font-bold ${d.attachPct >= 35 ? 'text-emerald-600' : d.attachPct >= 20 ? 'text-amber-600' : 'text-vfes-dark/65'}`}>{d.attachPct}%</td>
                    <td className="text-right font-mono text-xs">{d.stock.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/product"         className="font-bold text-vfes-dark hover:underline">{tt('Product \u2192')}</Link>
            <Link to="/portal/channel-dealers" className="font-bold text-vfes-dark hover:underline">{tt('Channel & Dealers \u2192')}</Link>
          </div>
        </Panel>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PAYBACK \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'payback' && (
        <Panel title={tt('Subsidy payback vs contract length')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Plan')}</th>
                  <th className="px-3 py-2 text-right">{tt('Subsidy \u20ac')}</th>
                  <th className="px-3 py-2 text-right">{tt('Payback (mo)')}</th>
                  <th className="px-3 py-2 text-right">{tt('Contract (mo)')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {PAYBACK.map(p => (
                  <tr key={p.plan} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2">{tt(p.plan)}</td>
                    <td className="px-3 py-2 text-right font-mono">\u20ac{p.subsidy}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.paybackMo}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.contractMo}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pillColor(p.status)}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3 text-xs">
            <Link to="/portal/promotions"           className="font-bold text-vfes-dark hover:underline">{tt('Promotions \u2192')}</Link>
            <Link to="/portal/bundle-profitability" className="font-bold text-vfes-dark hover:underline">{tt('Bundle Profitability \u2192')}</Link>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('25GB \u00b7 12mo subsidy pays back at month 13 \u2014 past contract end. Cap subsidy on short contracts.')} <ChevronRight className="w-3 h-3" />
          </div>
        </Panel>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 ATTACH \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'attach' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Attach funnel \u2014 device \u2192 financing \u2192 insurance \u2192 trade-in')}>
            <div className="space-y-2.5 mt-2">
              {ATTACH.map((s, i) => (
                <div key={s.stage} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span>{tt(s.stage)}</span>
                    <span className="font-mono text-xs">{s.n.toLocaleString('en-BS')} \u00b7 {((s.n / maxAttach) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded bg-black/5 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(s.n / maxAttach) * 100}%`, background: i === 0 ? NAVY : i === ATTACH.length - 1 ? GREEN : BLUE }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Insurance attaches on only 34% \u2014 app-based prompts at point-of-sale are the upside.')}
            </div>
          </Panel>

          <Panel title={tt('Attach rate by sales channel (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={attachEfficiency}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="channel" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="financing" name={tt('Financing')} fill={BLUE}  radius={[2, 2, 0, 0]} />
                  <Bar dataKey="insurance" name={tt('Insurance')} fill={GREEN} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tradein"   name={tt('Trade-in')}  fill={AMBER} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Attach rate trend \u2014 6 months (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={ATTACH_TREND}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="financing" name={tt('Financing %')} stroke={BLUE}  strokeWidth={2.5} dot />
                <Line type="monotone" dataKey="insurance" name={tt('Insurance %')} stroke={GREEN} strokeWidth={2}   dot />
                <Line type="monotone" dataKey="tradein"   name={tt('Trade-in %')}  stroke={AMBER} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <div className="flex gap-3 text-xs mt-4">
          <Link to="/portal/marketing"      className="font-bold text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
          <Link to="/portal/digital-funnel" className="font-bold text-vfes-dark hover:underline">{tt('Digital Funnel \u2192')}</Link>
        </div>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TRADE-IN \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'tradein' && (<>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Trade-in residuals vs resale value')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Model')}</th>
                    <th className="px-3 py-2 text-right">{tt('Units taken')}</th>
                    <th className="px-3 py-2 text-right">{tt('Residual credit \u20ac')}</th>
                    <th className="px-3 py-2 text-right">{tt('Resale \u20ac')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TRADE_IN.map(t => {
                    const margin = t.resale - t.residual
                    return (
                      <tr key={t.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{t.model}</td>
                        <td className="px-3 py-2 text-right font-mono">{t.taken.toLocaleString('en-BS')}</td>
                        <td className="px-3 py-2 text-right font-mono">\u20ac{t.residual}</td>
                        <td className="px-3 py-2 text-right font-mono">\u20ac{t.resale}</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${statusColor(t.status)}`}>{margin >= 0 ? '+' : ''}\u20ac{margin}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Pixel 7 residual over-credited vs resale \u2014 recalibrate trade-in matrix to stop margin leak.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('Residual value depreciation by tier')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={RESIDUAL_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="\u20ac" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="flagship" name={tt('Flagship')} stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="mid"      name={tt('Mid')}      stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="value"    name={tt('Value')}    stroke={SLATE} fill={SLATE} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Buy-back & refurbishment channel performance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Partner')}</th>
                  <th className="text-right">{tt('Units')}</th>
                  <th className="text-right">{tt('Avg price \u20ac')}</th>
                  <th>{tt('Grade')}</th>
                  <th className="text-right">{tt('Net margin \u20ac')}</th>
                  <th className="text-right">{tt('Avg turn')}</th>
                </tr>
              </thead>
              <tbody>
                {BUYBACK_TRACKER.map(b => (
                  <tr key={b.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{b.partner}</td>
                    <td className="text-right font-mono">{b.units.toLocaleString()}</td>
                    <td className="text-right font-mono">\u20ac{b.avgPrice}</td>
                    <td><span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{b.grade}</span></td>
                    <td className={`text-right font-bold ${b.margin > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{b.margin > 0 ? '+' : ''}\u20ac{b.margin}</td>
                    <td className="text-right font-mono text-xs">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="flex gap-3 text-xs mt-4">
          <Link to="/portal/supply-chain" className="font-bold text-vfes-dark hover:underline">{tt('Supply Chain \u2192')}</Link>
          <Link to="/portal/operations"   className="font-bold text-vfes-dark hover:underline">{tt('Operations \u2192')}</Link>
        </div>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 INSURANCE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'insurance' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {INSURANCE.map(i => (
            <Panel key={i.metric} title={tt(i.metric)}>
              <div className="text-3xl font-extrabold text-vfes-dark">{i.value}</div>
              <div className="text-xs text-vfes-dark/55 mt-2">{tt(i.note)}</div>
            </Panel>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Insurance attach rate & average premium (monthly)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={INSURANCE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="%" domain={[20, 45]} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="\u20ac" domain={[6, 9]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="attach"   name={tt('Attach %')}       fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="premiumE" name={tt('Avg premium \u20ac')} stroke={BLUE} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Claims ratio vs attach rate trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={INSURANCE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="attach"    name={tt('Attach %')} stroke={GREEN} strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="claimsPct" name={tt('Claims %')} stroke={AMBER} strokeWidth={2}   strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={55} stroke={RED} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 55% claims ceiling \u2014 above that underwriting margin turns negative')}</div>
          </Panel>
        </div>

        <Panel title={tt('Insurance economics')}>
          <div className="text-sm text-vfes-dark/70">{tt('Device insurance at 34% attach with a 52% claims ratio yields \u20ac2.4M annual margin. Cross-sell at point-of-sale and in the MyREV app drives attach; AI fraud-screening on claims keeps the loss ratio healthy.')}</div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('Lift attach to 40% via app-based prompts \u2014 +\u20ac0.5M margin with no underwriting change.')}
          </div>
        </Panel>
        <div className="flex gap-3 text-xs mt-4">
          <Link to="/portal/customer-360"    className="font-bold text-vfes-dark hover:underline">{tt('Customer 360 \u2192')}</Link>
          <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
          <Link to="/portal/ai-insights"     className="font-bold text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
        </div>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 INVENTORY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'inventory' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Sort by:')}</span>
          {(['stock', 'margin', 'turnover'] as const).map(s => (
            <button key={s} onClick={() => setInvSort(s)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${invSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {s === 'stock' ? tt('Stock') : s === 'margin' ? tt('Margin') : tt('Attach')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Inventory aging \u2014 units by age bucket')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={INVENTORY_AGING}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="units" name={tt('Units')} radius={[6, 6, 0, 0]}>
                    {INVENTORY_AGING.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('1,040 units >90d at risk of markdown \u2014 accelerate clearance')}</div>
          </Panel>

          <Panel title={tt('Inventory mix \u2014 units by device tier')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={inventoryPieData} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {inventoryPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Device catalog \u2014 stock levels & reorder status')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('SKU')}</th>
                  <th>{tt('Model')}</th>
                  <th>{tt('Tier')}</th>
                  <th className="text-right">{tt('Stock')}</th>
                  <th className="text-right">{tt('Margin \u20ac')}</th>
                  <th className="text-right">{tt('Attach %')}</th>
                  <th>{tt('Reorder')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventory.map(d => (
                  <tr key={d.sku} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs">{d.sku}</td>
                    <td className="font-semibold text-xs">{d.name}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${d.tier === 'flagship' ? 'bg-blue-100 text-blue-700' : d.tier === 'mid' ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-600'}`}>{tt(d.tier)}</span></td>
                    <td className={`text-right font-bold ${d.stock < 700 ? 'text-red-600' : d.stock < 1500 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.stock.toLocaleString()}</td>
                    <td className="text-right font-mono">\u20ac{d.marginE}</td>
                    <td className="text-right font-mono">{d.attachPct}%</td>
                    <td>
                      {d.stock < 700
                        ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase">{tt('Urgent')}</span>
                        : d.stock < 1500
                        ? <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">{tt('Watch')}</span>
                        : <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">{tt('OK')}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/supply-chain" className="font-bold text-vfes-dark hover:underline">{tt('Supply Chain \u2192')}</Link>
            <Link to="/portal/operations"   className="font-bold text-vfes-dark hover:underline">{tt('Operations \u2192')}</Link>
          </div>
        </Panel>
      </>)}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 CREDIT RISK \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {tab === 'credit' && (<>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-vfes-dark/55 uppercase tracking-widest">{tt('Score band:')}</span>
          {(['all', 'prime', 'near', 'sub'] as const).map(t => (
            <button key={t} onClick={() => setCreditTier(t)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${creditTier === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
              {t === 'all' ? tt('All') : t === 'prime' ? tt('Prime') : t === 'near' ? tt('Near-prime') : tt('Sub-prime')}
            </button>
          ))}
          <span className="ml-2 text-xs text-vfes-dark/55">
            {tt('Book')} \u20ac{creditMetrics.totalBook.toFixed(1)}M \u00b7 {tt('Wtd. default')} {creditMetrics.wtdDefault.toFixed(2)}%
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Credit portfolio \u2014 EIP book share by score band')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={creditMetrics.filtered}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="pct" name={tt('Book share %')} radius={[6, 6, 0, 0]}>
                    {creditMetrics.filtered.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Delinquency trend \u2014 DQ30 / DQ60 / DQ90 (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={DELINQUENCY_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 6]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="dq30" name={tt('DQ30')} stroke={AMBER}     strokeWidth={2} dot />
                  <Line type="monotone" dataKey="dq60" name={tt('DQ60')} stroke={'#f97316'} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="dq90" name={tt('DQ90')} stroke={RED}       strokeWidth={2} dot />
                  <ReferenceLine y={3.5} stroke={RED} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red threshold = 3.5% DQ30 triggers underwriting review')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Credit decisions \u2014 monthly volume (approved / conditional / declined)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CREDIT_DECISIONS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="approved"    name={tt('Approved')}    stackId="a" fill={GREEN}     radius={[0, 0, 0, 0]} />
                  <Bar dataKey="conditional" name={tt('Conditional')} stackId="a" fill={AMBER}     radius={[0, 0, 0, 0]} />
                  <Bar dataKey="declined"    name={tt('Declined')}    stackId="a" fill={RED}       radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Credit risk scorecard \u2014 default rate by band')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Score band')}</th>
                    <th className="text-right">{tt('Book %')}</th>
                    <th className="text-right">{tt('EIP \u20acM')}</th>
                    <th className="text-right">{tt('Default %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {creditMetrics.filtered.map(c => (
                    <tr key={c.bucket} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{c.bucket}</td>
                      <td className="text-right font-mono">{c.pct}%</td>
                      <td className="text-right font-mono">\u20ac{c.eipBook.toFixed(1)}M</td>
                      <td className={`text-right font-bold ${c.defaultRate >= 5 ? 'text-red-600' : c.defaultRate >= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.defaultRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <Link to="/portal/finance"     className="font-bold text-vfes-dark hover:underline">{tt('Finance \u2192')}</Link>
              <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* \u2500\u2500 Cross-domain navigator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Pricing & Revenue')}</div>
          <div className="space-y-1.5 text-xs">
            <div><Link to="/portal/pricing-simulator" className="font-semibold text-vfes-dark hover:underline">{tt('Pricing Simulator')}</Link> — {tt('EIP rate & subsidy modelling')}</div>
            <div><Link to="/portal/promotions"        className="font-semibold text-vfes-dark hover:underline">{tt('Promotions')}</Link> — {tt('promo codes & discount tracker')}</div>
            <div><Link to="/portal/bundle-profitability" className="font-semibold text-vfes-dark hover:underline">{tt('Bundle Profitability')}</Link> — {tt('convergent ARPU analysis')}</div>
            <div><Link to="/portal/finance"           className="font-semibold text-vfes-dark hover:underline">{tt('Finance')}</Link> — {tt('P&L, capex & EIP write-offs')}</div>
          </div>
        </div>
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Sales & Channels')}</div>
          <div className="space-y-1.5 text-xs">
            <div><Link to="/portal/sales"             className="font-semibold text-vfes-dark hover:underline">{tt('Sales')}</Link> — {tt('sales funnel & dealer performance')}</div>
            <div><Link to="/portal/channel-dealers"   className="font-semibold text-vfes-dark hover:underline">{tt('Channel & Dealers')}</Link> — {tt('dealer EIP & attach scorecard')}</div>
            <div><Link to="/portal/digital-funnel"    className="font-semibold text-vfes-dark hover:underline">{tt('Digital Funnel')}</Link> — {tt('web & app conversion rates')}</div>
            <div><Link to="/portal/marketing"         className="font-semibold text-vfes-dark hover:underline">{tt('Marketing')}</Link> — {tt('CAC, ROAS & campaign analytics')}</div>
          </div>
        </div>
        <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-4">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Customer & Risk')}</div>
          <div className="space-y-1.5 text-xs">
            <div><Link to="/portal/customer-360"      className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360')}</Link> — {tt('EIP, insurance & device history')}</div>
            <div><Link to="/portal/churn-retention"   className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention')}</Link> — {tt('EIP completion & churn linkage')}</div>
            <div><Link to="/portal/ai-insights"       className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights')}</Link> — {tt('credit scoring & propensity')}</div>
            <div><Link to="/portal/supply-chain"      className="font-semibold text-vfes-dark hover:underline">{tt('Supply Chain')}</Link> — {tt('device pipeline & stock health')}</div>
          </div>
        </div>
      </div>

      <Panel title={tt('KPI summary \u2014 device financing at a glance')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Total EIP book')}      value={`\u20ac${totalEip.toFixed(0)}M`}     delta={tt('Jun 2026')}            trend="up"   icon={Smartphone} accent />
          <KpiCard label={tt('Avg attach items')}    value="2.1"                            delta={tt('insur + tradein / sale')} trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Buy-back units Q')}    value="4.8K"                           delta={tt('via 4 channels')}         trend="up"   icon={RefreshCw}   />
          <KpiCard label={tt('EIP write-off rate')}  value="0.6%"                           delta={tt('-0.2 pp YoY')}            trend="up"   icon={ShieldCheck} />
        </div>
      </Panel>

      {/* \u2500\u2500 Instalment plan comparison table \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <Panel title={tt('EIP book by tariff tier \u2014 Jun 2026 snapshot')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                <th className="py-2">{tt('Tariff tier')}</th>
                <th className="text-right">{tt('Active EIPs')}</th>
                <th className="text-right">{tt('Book \u20acM')}</th>
                <th className="text-right">{tt('Avg instalment \u20ac/mo')}</th>
                <th className="text-right">{tt('Avg remaining mo')}</th>
                <th className="text-right">{tt('Default rate %')}</th>
                <th>{tt('RAG')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'Unlimited 5G+', eips: 12840, bookM: 38.5, avgInst: 45.8, avgRemMo: 16, def: 1.2 },
                { tier: '150 GB',        eips:  9820, bookM: 26.2, avgInst: 38.4, avgRemMo: 14, def: 1.8 },
                { tier: '60 GB',         eips:  7640, bookM: 18.4, avgInst: 32.1, avgRemMo: 11, def: 2.4 },
                { tier: '25 GB',         eips:  4820, bookM: 10.2, avgInst: 26.8, avgRemMo:  8, def: 4.2 },
                { tier: 'Pay As You Go', eips:  2180, bookM:  7.4, avgInst: 22.0, avgRemMo:  6, def: 6.8 },
              ].map(r => (
                <tr key={r.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-2.5 font-semibold text-xs">{tt(r.tier)}</td>
                  <td className="text-right font-mono">{r.eips.toLocaleString()}</td>
                  <td className="text-right font-mono">\u20ac{r.bookM}M</td>
                  <td className="text-right font-mono">\u20ac{r.avgInst}</td>
                  <td className="text-right font-mono">{r.avgRemMo}</td>
                  <td className={`text-right font-bold ${r.def >= 5 ? 'text-red-600' : r.def >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.def}%</td>
                  <td><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${r.def >= 5 ? 'bg-red-100 text-red-700' : r.def >= 2.5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.def >= 5 ? 'Red' : r.def >= 2.5 ? 'Amber' : 'Green'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-vfes-dark/55">{tt('PAYG tier default elevated \u2014 tighten credit gate or exclude from EIP eligibility for sub-600 score band.')}</div>
      </Panel>

      {/* \u2500\u2500 Quick links footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/8 to-transparent border border-vfes-red/15 p-4">
        <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Related dashboards')}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link to="/portal/device-financing"    className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing overview')}</Link>
          <Link to="/portal/product"             className="font-semibold text-vfes-dark/60 hover:text-vfes-dark hover:underline">{tt('Product')}</Link>
          <Link to="/portal/operations"          className="font-semibold text-vfes-dark/60 hover:text-vfes-dark hover:underline">{tt('Operations')}</Link>
          <Link to="/portal/channel-dealers"     className="font-semibold text-vfes-dark/60 hover:text-vfes-dark hover:underline">{tt('Channel & Dealers')}</Link>
          <Link to="/portal/ai-insights"         className="font-semibold text-vfes-dark/60 hover:text-vfes-dark hover:underline">{tt('AI Insights')}</Link>
          <Link to="/portal/customer-360"        className="font-semibold text-vfes-dark/60 hover:text-vfes-dark hover:underline">{tt('Customer 360')}</Link>
        </div>
        <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">
          {tt('Data sources: EIP_LEDGER \u22c8 DEVICE_SALES \u22c8 INSURANCE_CLAIMS \u22c8 CREDIT_BUREAU_SCORES \u00b7 Snowflake ML Model Registry')}
        </div>
        <div className="text-[10px] text-vfes-dark/35 mt-1">{tt('Semantic view: CBL_ANALYTICS.DEVICE.DEVICE_FINANCING_VIEW \u00b7 refreshed every 4h')}</div>
      </div>
    </div>
  )
}
