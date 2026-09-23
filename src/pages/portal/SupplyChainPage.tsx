import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Package, Truck, RotateCcw, AlertTriangle, Boxes, Leaf, Globe,
  Activity, ShieldCheck, TrendingUp, DollarSign, Percent, Bell,
  BarChart2, Zap, Clock,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── Existing data (preserved) ───────────────────────────────────────────────
const INVENTORY = [
  { sku: 'Flagship handsets', units: 18400,  cover: 3.2,  status: 'low'  },
  { sku: 'Mid-range handsets', units: 52600,  cover: 6.8,  status: 'ok'   },
  { sku: 'Entry handsets',     units: 71200,  cover: 9.4,  status: 'over' },
  { sku: 'Routers / CPE',      units: 34800,  cover: 5.1,  status: 'ok'   },
  { sku: 'SIM / eSIM kits',    units: 240000, cover: 7.2,  status: 'ok'   },
  { sku: 'Accessories',        units: 96000,  cover: 11.6, status: 'over' },
]

const DISTRIBUTION = [
  { ch: 'Owned retail',         allocated: 31, sellThrough: 78 },
  { ch: 'Franchise dealers',    allocated: 38, sellThrough: 71 },
  { ch: 'Independent dealers',  allocated: 18, sellThrough: 54 },
  { ch: 'Digital / D2C',        allocated: 13, sellThrough: 88 },
]

const LOGISTICS = [
  { m: 'Jan', inbound: 84,  outbound: 78,  returns: 9  },
  { m: 'Feb', inbound: 88,  outbound: 82,  returns: 10 },
  { m: 'Mar', inbound: 92,  outbound: 90,  returns: 11 },
  { m: 'Apr', inbound: 96,  outbound: 94,  returns: 12 },
  { m: 'May', inbound: 101, outbound: 98,  returns: 12 },
  { m: 'Jun', inbound: 108, outbound: 104, returns: 13 },
]

const REVERSE = [
  { name: 'Resold (refurb)', value: 44, color: GREEN  },
  { name: 'Trade-in pool',   value: 28, color: BLUE   },
  { name: 'Warranty repair', value: 18, color: SLATE  },
  { name: 'Recycle / WEEE',  value: 10, color: NAVY   },
]

// ─── Supplier lead times ──────────────────────────────────────────────────────
const SUPPLIERS = [
  { supplier: 'Samsung Electronics', category: 'Flagship handsets', leadWeeks: 4.2, onTime: 94, risk: 'Low',  spend: 142, country: 'Korea',   esgScore: 82 },
  { supplier: 'Xiaomi Corp',          category: 'Mid-range + entry', leadWeeks: 5.8, onTime: 88, risk: 'Med',  spend: 98,  country: 'China',   esgScore: 71 },
  { supplier: 'Apple Inc',            category: 'iPhone flagship',   leadWeeks: 3.6, onTime: 96, risk: 'Low',  spend: 218, country: 'Global',  esgScore: 88 },
  { supplier: 'Nokia Networks',       category: 'CPE / routers',     leadWeeks: 8.4, onTime: 79, risk: 'High', spend: 56,  country: 'Finland', esgScore: 91 },
  { supplier: 'Ericsson',             category: 'Network CPE',        leadWeeks: 9.2, onTime: 76, risk: 'High', spend: 38,  country: 'Sweden',  esgScore: 89 },
  { supplier: 'DJI',                  category: 'IoT devices',        leadWeeks: 6.4, onTime: 82, risk: 'Med',  spend: 22,  country: 'China',   esgScore: 65 },
]

const LEAD_TIME_TREND = [
  { m: 'Jan', flagship: 4.8, midrange: 6.2, cpe: 9.8 },
  { m: 'Feb', flagship: 4.6, midrange: 6.0, cpe: 9.4 },
  { m: 'Mar', flagship: 4.4, midrange: 5.8, cpe: 9.2 },
  { m: 'Apr', flagship: 4.3, midrange: 5.8, cpe: 8.8 },
  { m: 'May', flagship: 4.2, midrange: 5.8, cpe: 8.5 },
  { m: 'Jun', flagship: 4.2, midrange: 5.8, cpe: 8.4 },
]

// ─── Demand-supply balance ────────────────────────────────────────────────────
const DEMAND_SUPPLY = [
  { m: 'Jan', demand: 76, supply: 84,  gap:  8 },
  { m: 'Feb', demand: 80, supply: 88,  gap:  8 },
  { m: 'Mar', demand: 92, supply: 92,  gap:  0 },
  { m: 'Apr', demand: 98, supply: 96,  gap: -2 },
  { m: 'May', demand: 105, supply: 101, gap: -4 },
  { m: 'Jun', demand: 112, supply: 108, gap: -4 },
  { m: 'Jul', demand: 118, supply: 112, gap: -6 },
  { m: 'Aug', demand: 122, supply: 116, gap: -6 },
]

const STOCK_OUT_RISK = [
  { sku: 'Flagship handsets', prob: 78, impactM: 4.2,  action: 'Air-freight expedite — ordered' },
  { sku: 'Mid-range handsets', prob: 22, impactM: 1.8,  action: 'Sea freight on-order — on time'  },
  { sku: 'Routers / CPE',      prob: 38, impactM: 2.4,  action: 'Nokia lead-time escalation'       },
  { sku: 'SIM / eSIM kits',    prob:  8, impactM: 0.4,  action: 'Monitor — 7-week cover OK'        },
]

// ─── Procurement linkage ─────────────────────────────────────────────────────
const OPEN_POS = [
  { po: 'PO-24892', supplier: 'Samsung',    sku: 'Galaxy S26 Ultra',   qty: 8000,  value: 8.2,  eta: 'Jul 28', status: 'Confirmed'  },
  { po: 'PO-24891', supplier: 'Apple',      sku: 'iPhone 17 Pro',      qty: 4000,  value: 6.8,  eta: 'Jul 15', status: 'Confirmed'  },
  { po: 'PO-24893', supplier: 'Xiaomi',     sku: 'Redmi Note 14 Pro',  qty: 12000, value: 5.4,  eta: 'Aug 10', status: 'At risk'    },
  { po: 'PO-24895', supplier: 'Nokia',      sku: 'Wi-Fi 7 CPE',        qty: 6000,  value: 3.6,  eta: 'Sep 2',  status: 'Delayed'   },
  { po: 'PO-24896', supplier: 'Ericsson',   sku: '5G FWA router',      qty: 2000,  value: 2.8,  eta: 'Sep 15', status: 'Planned'   },
]

const SPEND_BY_CATEGORY = [
  { cat: 'Flagship handsets',   spend: 360, color: BLUE   },
  { cat: 'Mid / entry phones',  spend: 196, color: NAVY   },
  { cat: 'Network CPE',         spend:  94, color: GREEN  },
  { cat: 'SIM / eSIM',          spend:  38, color: AMBER  },
  { cat: 'IoT devices',         spend:  42, color: PURPLE },
  { cat: 'Accessories',         spend:  48, color: SLATE  },
]

// ─── ESG suppliers ────────────────────────────────────────────────────────────
const ESG_METRICS = [
  { supplier: 'Apple',        carbon: 12, water: 8,  humanRights: 94, diversity: 88, renewables: 100, certified: 'ISO14001 · RBA' },
  { supplier: 'Samsung',      carbon: 18, water: 14, humanRights: 82, diversity: 76, renewables: 78,  certified: 'ISO14001'       },
  { supplier: 'Nokia',        carbon: 8,  water: 6,  humanRights: 91, diversity: 84, renewables: 92,  certified: 'ISO14001 · EcoVadis Platinum' },
  { supplier: 'Ericsson',     carbon: 9,  water: 7,  humanRights: 89, diversity: 80, renewables: 89,  certified: 'ISO14001 · EcoVadis Gold'     },
  { supplier: 'Xiaomi',       carbon: 22, water: 18, humanRights: 71, diversity: 64, renewables: 62,  certified: 'ISO14001'       },
  { supplier: 'DJI',          carbon: 28, water: 24, humanRights: 65, diversity: 58, renewables: 45,  certified: 'None filed'     },
]

const ESG_TREND = [
  { m: 'Jan-25', avgScore: 72 }, { m: 'Apr-25', avgScore: 74 },
  { m: 'Jul-25', avgScore: 76 }, { m: 'Oct-25', avgScore: 77 },
  { m: 'Jan-26', avgScore: 78 }, { m: 'Apr-26', avgScore: 80 },
]

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusColor = (s: string) =>
  s === 'low' ? 'bg-red-50 text-red-700' : s === 'over' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'inventory' | 'suppliers' | 'demand-supply' | 'procurement' | 'logistics' | 'esg-suppliers' | 'stockouts'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',      label: 'Overview',         icon: BarChart2  },
  { id: 'inventory',     label: 'Inventory',        icon: Boxes      },
  { id: 'suppliers',     label: 'Supplier Lead Times', icon: Clock   },
  { id: 'demand-supply', label: 'Demand vs Supply', icon: Activity   },
  { id: 'procurement',   label: 'Procurement',      icon: DollarSign },
  { id: 'logistics',     label: 'Logistics',        icon: Truck      },
  { id: 'esg-suppliers', label: 'ESG Suppliers',    icon: Leaf       },
  { id: 'stockouts',     label: 'Stock-out Risk',   icon: AlertTriangle },
]

export default function SupplyChainPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [covThreshold, setCovThreshold] = useState<number>(4)
  const [supplierFilter, setSupplierFilter] = useState<string>('All')
  const [esgSortKey, setEsgSortKey] = useState<'carbon' | 'renewables' | 'humanRights'>('carbon')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const totalUnits = useMemo(
    () => INVENTORY.reduce((s, i) => s + i.units, 0),
    [],
  )

  const low = useMemo(
    () => INVENTORY.filter(i => i.status === 'low').length,
    [],
  )

  const over = useMemo(
    () => INVENTORY.filter(i => i.status === 'over').length,
    [],
  )

  const belowThreshold = useMemo(
    () => INVENTORY.filter(i => i.cover < covThreshold),
    [covThreshold],
  )

  const filteredSuppliers = useMemo(
    () => supplierFilter === 'All' ? SUPPLIERS : SUPPLIERS.filter(s => s.risk === supplierFilter),
    [supplierFilter],
  )

  const sortedEsg = useMemo(
    () => [...ESG_METRICS].sort((a, b) =>
      esgSortKey === 'carbon' ? a[esgSortKey] - b[esgSortKey] : b[esgSortKey] - a[esgSortKey]
    ),
    [esgSortKey],
  )

  const returnsRate = useMemo(
    () => +((LOGISTICS[LOGISTICS.length - 1].returns / LOGISTICS[LOGISTICS.length - 1].outbound) * 100).toFixed(1),
    [],
  )

  const totalSpend = useMemo(
    () => SPEND_BY_CATEGORY.reduce((s, c) => s + c.spend, 0),
    [],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Supply Chain & Device Logistics')}
        subtitle={tt('CPE/handset inventory · supplier lead times · logistics · stock-outs · demand-supply · ESG')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">{(totalUnits / 1000).toFixed(0)}K {tt('units on hand')}</span>
            {liveTime && <span className="text-vfes-dark/40 font-mono text-[10px]">{liveTime}</span>}
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Supply chain intelligence"
        models={[
          { name: 'Demand Forecaster',   metric: 'MAPE 8.2%',  sub: 'SKU × channel × week'          },
          { name: 'Lead-time Predictor', metric: 'R² 0.84',    sub: 'supplier delivery risk'         },
          { name: 'Stock-out Classifier', metric: 'recall 0.91', sub: '30-day stockout probability' },
        ]}
        agentLabel="Run Supply Optimiser"
        agentRunningLabel="Balancing…"
        agentSteps={[
          'Forecast demand by SKU × channel × week (Cortex)',
          'Flagged stockout risk (flagship <4wk) and overstock (entry, accessories)',
          'Drafted inter-store rebalancing transfers & expedite POs',
          'Routed slow-movers to D2C promo and trade-in pool',
        ]}
        agentBlurb="One demand-signal model — sales, channel, NPS, promos — feeds procurement and logistics so the agent sees the full path from factory floor to customer."
        decision={{
          title: 'Expedite flagship restock; rebalance entry/accessory overstock to D2C',
          detail: 'Flagship handsets are under 4 weeks cover — a lost-sale risk with the Q3 promo wave inbound. Entry handsets and accessories sit above 9 weeks — capital locked in slow-moving stock. Air-freight the top-selling flagship SKUs and route entry + accessories to D2C and trade-in.',
          impact: 'protects BSD 4.2M high-margin sales · frees BSD 2.1M working capital',
          risk: 'air-freight expedite costs margin — cap to top 3 SKUs by ASP',
          linkTo: '/portal/device-financing',
          linkLabel: 'Open Device Financing',
        }}
        chart={{
          kind: 'bar',
          title: 'Inventory weeks of cover by SKU (threshold = 4 weeks)',
          xKey: 'sku',
          unit: ' wks',
          data: INVENTORY,
          series: [{ key: 'cover', name: 'Weeks of cover', color: NAVY }],
          colorBy: { key: 'cover', high: 9, mid: 4 },
          note: 'Red = overstock (>9wk) · Amber = watch (4–9wk) · Green = stockout risk (<4wk — reversed)',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 text-sm">{tt('Flagship handsets: 3.2 weeks cover · Nokia CPE delayed 3 weeks (lead-time 8.4wk) · Demand-supply gap widening in Q3')}</div>
              <div className="text-xs text-red-800 mt-1">{tt('Air-freight PO-24892 (Samsung S26) expedited — ETA Jul 28. Nokia escalation in progress via procurement.')}</div>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-red-600 hover:underline shrink-0">{tt('Dismiss')}</button>
          </div>
        </div>
      )}

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
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

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Units on hand')} value={`${(totalUnits / 1000).toFixed(0)}K`} delta={tt('6 SKU classes')} trend="flat" icon={Boxes} accent />
          <KpiCard label={tt('Stockouts at risk')} value={`${low}`} delta={tt('< 4 weeks cover')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Overstock SKUs')} value={`${over}`} delta={tt('> 9 weeks cover')} trend="down" icon={Package} />
          <KpiCard label={tt('Returns rate')} value={`${returnsRate}%`} delta={tt('of outbound')} trend="flat" icon={RotateCcw} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Supplier spend TTM')} value={`BSD ${totalSpend}M`} delta={tt('6 categories')} trend="flat" icon={DollarSign} />
          <KpiCard label={tt('Avg supplier ESG')} value="80/100" delta={tt('+8 pts YoY')} trend="up" icon={Leaf} />
          <KpiCard label={tt('High-risk suppliers')} value="2" delta={tt('Nokia · Ericsson — lead-time')} trend="down" icon={ShieldCheck} />
          <KpiCard label={tt('Open POs')} value={`${OPEN_POS.length}`} delta={tt('1 delayed · 1 at risk')} trend="down" icon={Package} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Demand vs supply — inbound/outbound trend (K units)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={DEMAND_SUPPLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="K" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="K" domain={[-10, 15]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="demand" name={tt('Demand')} fill={BLUE} opacity={0.75} />
                  <Bar yAxisId="l" dataKey="supply" name={tt('Supply')} fill={GREEN} opacity={0.75} />
                  <Line yAxisId="r" type="monotone" dataKey="gap" name={tt('Gap K')} stroke={AMBER} strokeWidth={2} dot />
                  <ReferenceLine yAxisId="r" y={0} stroke={RED} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Gap turns negative Apr-26 — demand outstrips supply, driven by flagship shortfall.')}</div>
          </Panel>

          <Panel title={tt('Spend by device category (BSD M TTM)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SPEND_BY_CATEGORY} dataKey="spend" nameKey="cat" cx="50%" cy="50%" outerRadius={85} label={(d: any) => `${d.cat.split(' ')[0]} BSD ${d.spend}M`} labelLine={false}>
                    {SPEND_BY_CATEGORY.map((c) => <Cell key={c.cat} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v}M`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#222128] mb-1">{tt('Procurement')}</div>
            <div className="text-sm text-vfes-dark/70 mb-2">{tt('Open POs, vendor management and spend analytics.')}</div>
            <Link to="/portal/procurement" className="text-xs font-bold text-[#222128] hover:underline">{tt('Open Procurement →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">{tt('Device Financing')}</div>
            <div className="text-sm text-vfes-dark/70 mb-2">{tt('Device trade-in, refurb pipeline and financing plans.')}</div>
            <Link to="/portal/device-financing" className="text-xs font-bold text-[#10B981] hover:underline">{tt('Open Device Financing →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] mb-1">{tt('AI Insights')}</div>
            <div className="text-sm text-vfes-dark/70 mb-2">{tt('Supply chain anomaly detection and forecasting models.')}</div>
            <Link to="/portal/ai-insights" className="text-xs font-bold text-[#7C3AED] hover:underline">{tt('Open AI Insights →')}</Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
          <span>·</span>
          <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <span>·</span>
          <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          <span>·</span>
          <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Supply chain KPI summary — Q2-26 vs Q2-25')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('KPI')}</th>
                    <th className="text-right">{tt('Q2-26')}</th>
                    <th className="text-right">{tt('Q2-25')}</th>
                    <th className="text-right">{tt('YoY')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { kpi: 'Avg weeks of cover (all SKUs)', q2: '7.2wk',  prev: '6.8wk',  yoy: '+0.4wk', st: 'Watch'  },
                    { kpi: 'Flagship cover',                 q2: '3.2wk',  prev: '5.4wk',  yoy: '−2.2wk', st: 'Red'    },
                    { kpi: 'Returns rate',                   q2: '12.5%',  prev: '11.2%',  yoy: '+1.3pp', st: 'Watch'  },
                    { kpi: 'Refurb resale rate',             q2: '44%',    prev: '40%',    yoy: '+4pp',   st: 'Green'  },
                    { kpi: 'On-time delivery (all suppliers)', q2: '86%', prev: '84%',    yoy: '+2pp',   st: 'Green'  },
                    { kpi: 'D2C sell-through rate',          q2: '88%',    prev: '82%',    yoy: '+6pp',   st: 'Green'  },
                    { kpi: 'Device procurement spend (BSD M)',  q2: 'BSD 130M',  prev: 'BSD 118M',  yoy: '+10%',   st: 'Watch'  },
                  ].map(row => (
                    <tr key={row.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(row.kpi)}</td>
                      <td className="text-right font-bold font-mono text-xs">{row.q2}</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/55">{row.prev}</td>
                      <td className={`text-right font-bold text-xs ${row.st === 'Green' ? 'text-emerald-600' : row.st === 'Red' ? 'text-red-600' : 'text-amber-600'}`}>{row.yoy}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${row.st === 'Green' ? 'bg-emerald-100 text-emerald-700' : row.st === 'Red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{tt(row.st)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'inventory' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total units')} value={`${(totalUnits / 1000).toFixed(0)}K`} delta={tt('all classes')} trend="flat" icon={Boxes} accent />
          <KpiCard label={tt('Stockout risk SKUs')} value={`${low}`} delta={tt('< 4 weeks cover')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Overstock SKUs')} value={`${over}`} delta={tt('> 9 weeks cover')} trend="down" icon={Package} />
          <KpiCard label={tt('Below threshold')} value={`${belowThreshold.length}`} delta={`< ${covThreshold}wk cover`} trend={belowThreshold.length > 0 ? 'down' : 'up'} icon={AlertTriangle} />
        </div>

        <Panel title={tt('Cover threshold filter')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{tt('Alert threshold — weeks of cover')}</span>
                <span className="font-mono font-bold">{covThreshold} {tt('weeks')}</span>
              </div>
              <input type="range" min={2} max={12} step={1} value={covThreshold} onChange={e => setCovThreshold(+e.target.value)} className="w-full accent-vfes-red" />
              {belowThreshold.length > 0 && (
                <div className="mt-2 text-xs text-red-700 font-semibold">{belowThreshold.map(s => s.sku).join(', ')} {tt('are below the threshold')}</div>
              )}
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={INVENTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="sku" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" wk" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cover" name={tt('Weeks of cover')} radius={[4, 4, 0, 0]}>
                    {INVENTORY.map((s, i) => <Cell key={i} fill={s.cover >= 9 ? AMBER : s.cover < covThreshold ? RED : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={covThreshold} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Inventory by SKU class — units & weeks of cover')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('SKU class')}</th>
                    <th className="text-right">{tt('Units on hand')}</th>
                    <th className="text-right">{tt('Weeks of cover')}</th>
                    <th>{tt('Status')}</th>
                    <th>{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {INVENTORY.map((i) => (
                    <tr key={i.sku} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(i.sku)}</td>
                      <td className="text-right font-mono text-xs">{i.units.toLocaleString('en-BS')}</td>
                      <td className={`text-right font-bold text-xs ${i.cover < 4 ? 'text-red-600' : i.cover > 9 ? 'text-amber-600' : 'text-emerald-600'}`}>{i.cover.toFixed(1)}</td>
                      <td><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(i.status)}`}>{tt(i.status)}</span></td>
                      <td className="text-xs text-vfes-dark/65">{i.status === 'low' ? tt('Expedite reorder PO') : i.status === 'over' ? tt('Route to D2C promo / trade-in') : tt('Monitor — on target')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
              <span>·</span>
              <Link to="/portal/device-financing" className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Inventory velocity — stock turn & days on hand (DOH)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('SKU class')}</th>
                    <th className="text-right">{tt('Units')}</th>
                    <th className="text-right">{tt('Weekly velocity')}</th>
                    <th className="text-right">{tt('DOH')}</th>
                    <th className="text-right">{tt('Inventory value BSD M')}</th>
                    <th>{tt('Working capital status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sku: 'Flagship',    units: 18400,  vel: 5760,  doh: 22,  val: 18.4, wc: 'Low — expedite funded' },
                    { sku: 'Mid-range',   units: 52600,  vel: 7750,  doh: 48,  val: 26.3, wc: 'On target'             },
                    { sku: 'Entry',       units: 71200,  vel: 7590,  doh: 66,  val: 21.4, wc: 'Over — promote/D2C'    },
                    { sku: 'CPE/router',  units: 34800,  vel: 6820,  doh: 36,  val: 13.9, wc: 'On target'             },
                    { sku: 'SIM/eSIM',    units: 240000, vel: 33330, doh: 50,  val:  7.2, wc: 'On target'             },
                    { sku: 'Accessories', units: 96000,  vel: 8280,  doh: 81,  val:  9.6, wc: 'Over — work off stock' },
                  ].map(row => (
                    <tr key={row.sku} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(row.sku)}</td>
                      <td className="text-right font-mono text-xs">{row.units.toLocaleString('en-BS')}</td>
                      <td className="text-right font-mono text-xs">{row.vel.toLocaleString('en-BS')}/wk</td>
                      <td className={`text-right font-bold text-xs ${row.doh <= 30 ? 'text-red-600' : row.doh >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{row.doh}</td>
                      <td className="text-right font-bold font-mono text-xs">BSD {row.val}M</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.wc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'suppliers' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Suppliers tracked')} value={`${SUPPLIERS.length}`} delta={tt('6 primary vendors')} trend="flat" icon={Globe} accent />
          <KpiCard label={tt('High lead-time risk')} value="2" delta={tt('Nokia 8.4wk · Ericsson 9.2wk')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Avg on-time delivery')} value="86%" delta={tt('all suppliers')} trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Lead-time trend')} value="Improving" delta={tt('flagship −13% YTD')} trend="up" icon={TrendingUp} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter by risk:')}</span>
          {['All', 'Low', 'Med', 'High'].map(r => (
            <button key={r} onClick={() => setSupplierFilter(r)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${supplierFilter === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Supplier lead-time trend — flagship, mid-range, CPE (weeks)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={LEAD_TIME_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" wk" domain={[3, 12]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="flagship" name={tt('Flagship')} stroke={BLUE}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="midrange" name={tt('Mid-range')} stroke={NAVY} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cpe"      name={tt('CPE/router')} stroke={AMBER} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={8} stroke={RED} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 8-week watch threshold. CPE lead-times are the critical exposure into Q3.')}</div>
          </Panel>

          <Panel title={tt('Supplier scorecard — on-time delivery & ESG')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Supplier')}</th>
                    <th className="text-right">{tt('Lead wk')}</th>
                    <th className="text-right">{tt('On-time %')}</th>
                    <th className="text-right">{tt('Spend BSD M')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(s => (
                    <tr key={s.supplier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{s.supplier}</td>
                      <td className={`text-right font-bold text-xs ${s.leadWeeks > 8 ? 'text-red-600' : s.leadWeeks > 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.leadWeeks.toFixed(1)}</td>
                      <td className={`text-right font-bold text-xs ${s.onTime >= 90 ? 'text-emerald-600' : s.onTime >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{s.onTime}%</td>
                      <td className="text-right font-mono text-xs">BSD {s.spend}M</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${s.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : s.risk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(s.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/procurement" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Procurement →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Supplier lead-time benchmarking — on-time delivery vs lead-time scatter')}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={filteredSuppliers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="supplier" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[0, 12]} unit=" wk" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="l" dataKey="leadWeeks" name={tt('Lead-time (wk)')} fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="onTime" name={tt('On-time %')} stroke={GREEN} strokeWidth={2} dot />
                  <ReferenceLine yAxisId="l" y={8} stroke={RED} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 8-week threshold. Nokia and Ericsson above it — dual-source CPE strategy under review.')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Supplier full register — spend, risk, country, ESG')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Supplier')}</th>
                    <th>{tt('Category')}</th>
                    <th className="text-right">{tt('Spend BSD M')}</th>
                    <th>{tt('Country')}</th>
                    <th className="text-right">{tt('ESG score')}</th>
                    <th>{tt('Risk level')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SUPPLIERS.map(s => (
                    <tr key={s.supplier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{s.supplier}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(s.category)}</td>
                      <td className="text-right font-bold font-mono text-xs">BSD {s.spend}M</td>
                      <td className="text-xs">{s.country}</td>
                      <td className={`text-right font-bold text-xs ${s.esgScore >= 85 ? 'text-emerald-600' : s.esgScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{s.esgScore}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${s.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : s.risk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(s.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'demand-supply' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Jun demand')} value="112K" delta={tt('units/month')} trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Jun supply')} value="108K" delta={tt('−4K shortfall')} trend="down" icon={Boxes} />
          <KpiCard label={tt('Q3 demand CAGR')} value="+9%"  delta={tt('vs Q3-25')} trend="up" icon={Activity} />
          <KpiCard label={tt('Stockout impact BSD M')} value="BSD 4.2M" delta={tt('flagship only')} trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Demand vs supply gap — monthly (K units)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={DEMAND_SUPPLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="supply" name={tt('Supply')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="demand" name={tt('Demand')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Demand exceeds supply from Apr-26 — expedite flagship to close the gap before Aug promo wave.')}</div>
          </Panel>

          <Panel title={tt('Stock-out risk by SKU — 30-day probability')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={STOCK_OUT_RISK} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="sku" tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="prob" name={tt('Stockout probability %')} radius={[0, 4, 4, 0]}>
                    {STOCK_OUT_RISK.map((s, i) => <Cell key={i} fill={s.prob >= 60 ? RED : s.prob >= 30 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine x={60} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
          <span>·</span>
          <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Supply-demand risk register — critical supply chain risks')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Risk')}</th>
                    <th>{tt('Category')}</th>
                    <th className="text-right">{tt('Likelihood')}</th>
                    <th className="text-right">{tt('Revenue impact')}</th>
                    <th>{tt('Mitigation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { risk: 'Flagship stockout before Aug promo',  cat: 'Inventory',   like: 'High', imp: 'BSD 4.2M',  mit: 'Air-freight PO-24892 — in progress'      },
                    { risk: 'Nokia CPE 3wk delay (lead 8.4wk)',    cat: 'Supplier',    like: 'High', imp: 'BSD 2.4M',  mit: 'Ericsson buffer stock release'            },
                    { risk: 'D2C sell-through drop in Aug heat',   cat: 'Demand',      like: 'Med',  imp: 'BSD 1.8M',  mit: 'Promo price adjustment + email campaign'  },
                    { risk: 'Xiaomi logistics (China holidays)',    cat: 'Logistics',   like: 'Med',  imp: 'BSD 1.0M',  mit: 'Pre-position 3-week buffer stock'         },
                    { risk: 'WEEE compliance gap (DJI)',            cat: 'Regulatory',  like: 'Low',  imp: 'BSD 0.5M',  mit: 'DJI audit scheduled Sep-26'               },
                  ].map(row => (
                    <tr key={row.risk} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(row.risk)}</td>
                      <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700">{tt(row.cat)}</span></td>
                      <td className={`text-right text-xs font-bold ${row.like === 'High' ? 'text-red-600' : row.like === 'Med' ? 'text-amber-600' : 'text-emerald-600'}`}>{tt(row.like)}</td>
                      <td className="text-right font-bold text-xs text-red-600">{row.imp}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.mit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'procurement' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open POs')} value={`${OPEN_POS.length}`} delta={tt('in flight')} trend="flat" icon={Package} accent />
          <KpiCard label={tt('Confirmed POs')} value="2" delta={tt('Samsung + Apple')} trend="up" icon={ShieldCheck} />
          <KpiCard label={tt('At-risk / delayed')} value="2" delta={tt('Xiaomi + Nokia')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('TTM device spend')} value={`BSD ${totalSpend}M`} delta={tt('6 categories')} trend="flat" icon={DollarSign} />
        </div>

        <Panel title={tt('Open purchase orders — status tracker')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('PO number')}</th>
                  <th>{tt('Supplier')}</th>
                  <th>{tt('SKU')}</th>
                  <th className="text-right">{tt('Qty')}</th>
                  <th className="text-right">{tt('Value BSD M')}</th>
                  <th>{tt('ETA')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {OPEN_POS.map(po => (
                  <tr key={po.po} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs">{po.po}</td>
                    <td className="font-semibold text-xs">{po.supplier}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(po.sku)}</td>
                    <td className="text-right font-mono text-xs">{po.qty.toLocaleString('en-BS')}</td>
                    <td className="text-right font-bold text-xs">BSD {po.value}M</td>
                    <td className="font-mono text-xs">{po.eta}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${po.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : po.status === 'At risk' ? 'bg-amber-100 text-amber-700' : po.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{tt(po.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
            <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement hub →')}</Link>
            <span>·</span>
            <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Spend by device category — TTM (BSD M)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={SPEND_BY_CATEGORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cat" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v}M`} />
                  <Bar dataKey="spend" name={tt('Spend BSD M')} radius={[4, 4, 0, 0]}>
                    {SPEND_BY_CATEGORY.map((c) => <Cell key={c.cat} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Monthly procurement spend trend (BSD M)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={[
                  { m: 'Jan', flagship: 28, mid: 15, cpe: 7  },
                  { m: 'Feb', flagship: 30, mid: 16, cpe: 7  },
                  { m: 'Mar', flagship: 32, mid: 17, cpe: 8  },
                  { m: 'Apr', flagship: 34, mid: 16, cpe: 8  },
                  { m: 'May', flagship: 38, mid: 17, cpe: 8  },
                  { m: 'Jun', flagship: 42, mid: 18, cpe: 9  },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="flagship" name={tt('Flagship BSD M')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} stackId="p" />
                  <Area type="monotone" dataKey="mid"      name={tt('Mid/entry BSD M')} stroke={NAVY} fill={NAVY}  fillOpacity={0.2} stackId="p" />
                  <Area type="monotone" dataKey="cpe"      name={tt('CPE BSD M')}       stroke={GREEN} fill={GREEN} fillOpacity={0.2} stackId="p" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Flagship spend accelerating in Jun on air-freight expedite. Full-year run-rate trending BSD 780M vs BSD 754M budget.')}</div>
          </Panel>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <span>·</span>
          <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
        </div>
      </>)}

      {/* */}
      {tab === 'logistics' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Jun outbound')} value="104K" delta={tt('units shipped')} trend="up" icon={Truck} accent />
          <KpiCard label={tt('Jun inbound')} value="108K" delta={tt('units received')} trend="up" icon={Boxes} />
          <KpiCard label={tt('Returns rate')} value={`${returnsRate}%`} delta={tt('of outbound')} trend="flat" icon={RotateCcw} />
          <KpiCard label={tt('Refurb resale %')} value="44%" delta={tt('of all returns')} trend="up" icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Logistics flow — inbound, outbound & returns (K units)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={LOGISTICS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}K`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="inbound"  stroke={NAVY} fill={NAVY} fillOpacity={0.15} name={tt('Inbound')} />
                  <Area type="monotone" dataKey="outbound" stroke={BLUE} fill={BLUE} fillOpacity={0.2}  name={tt('Outbound')} />
                  <Area type="monotone" dataKey="returns"  stroke={AMBER} fill={AMBER} fillOpacity={0.25} name={tt('Returns')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Reverse logistics — returns disposition (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={REVERSE} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {REVERSE.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('72% of returns resold or trade-in — circular economy lifts margin and ESG (WEEE compliance).')}</div>
          </Panel>
        </div>

        <Panel title={tt('Channel distribution — stock allocation vs sell-through (%)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={DISTRIBUTION}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="ch" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated"   fill={NAVY}  radius={[4, 4, 0, 0]} name={tt('Allocated %')} />
                <Bar dataKey="sellThrough" radius={[4, 4, 0, 0]} name={tt('Sell-through %')}>
                  {DISTRIBUTION.map((d, i) => <Cell key={i} fill={d.sellThrough >= 75 ? GREEN : d.sellThrough >= 60 ? BLUE : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Independent dealers hold 18% of stock but sell through only 54% — rebalance to D2C (88%).')}</div>
        </Panel>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/device-financing" className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing →')}</Link>
          <span>·</span>
          <Link to="/portal/debt-collections" className="font-semibold text-vfes-dark hover:underline">{tt('Debt Collections →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Returns handling & disposition register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Disposition path')}</th>
                    <th className="text-right">{tt('Jun returns K')}</th>
                    <th className="text-right">{tt('Share %')}</th>
                    <th className="text-right">{tt('Avg recovery BSD ')}</th>
                    <th>{tt('Channel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { path: 'Resold (refurb)',      returns: 5.7,  share: 44, recovery: 82,  ch: 'Refurb store + D2C'   },
                    { path: 'Trade-in pool',         returns: 3.6,  share: 28, recovery: 65,  ch: 'New device upgrade'   },
                    { path: 'Warranty repair',        returns: 2.3,  share: 18, recovery: 0,   ch: 'Authorised repair centres' },
                    { path: 'Recycle / WEEE',         returns: 1.3,  share: 10, recovery: 12,  ch: 'WEEE partner (Recupel)' },
                  ].map(row => (
                    <tr key={row.path} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(row.path)}</td>
                      <td className="text-right font-mono text-xs">{row.returns}K</td>
                      <td className="text-right font-bold text-xs">{row.share}%</td>
                      <td className={`text-right font-bold text-xs ${row.recovery >= 60 ? 'text-emerald-600' : row.recovery >= 10 ? 'text-amber-600' : 'text-vfes-dark/40'}`}>{row.recovery > 0 ? `BSD ${row.recovery}` : '—'}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.ch)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('72% recovery rate on returns (refurb + trade-in) generates BSD 1.1M/month net of processing cost — circular economy contribution.')}</div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'esg-suppliers' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg ESG score')} value="80/100" delta={tt('+8 pts YoY')} trend="up" icon={Leaf} accent />
          <KpiCard label={tt('100% renewable suppliers')} value="1" delta={tt('Apple — 100% RE')} trend="up" icon={Zap} />
          <KpiCard label={tt('Below 70 ESG threshold')} value="2" delta={tt('DJI · Xiaomi — action needed')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Certified (ISO / EcoVadis)')} value="4" delta={tt('of 6 primary suppliers')} trend="up" icon={ShieldCheck} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['carbon', 'renewables', 'humanRights'] as const).map(k => (
            <button key={k} onClick={() => setEsgSortKey(k)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${esgSortKey === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'carbon' ? tt('Carbon') : k === 'renewables' ? tt('Renewables') : tt('Human rights')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('ESG supplier scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Supplier')}</th>
                    <th className="text-right">{tt('Carbon')}</th>
                    <th className="text-right">{tt('Renewables %')}</th>
                    <th className="text-right">{tt('Human rights')}</th>
                    <th>{tt('Certified')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEsg.map(s => (
                    <tr key={s.supplier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{s.supplier}</td>
                      <td className={`text-right font-bold text-xs ${s.carbon <= 10 ? 'text-emerald-600' : s.carbon <= 20 ? 'text-amber-600' : 'text-red-600'}`}>{s.carbon}</td>
                      <td className={`text-right font-bold text-xs ${s.renewables >= 80 ? 'text-emerald-600' : s.renewables >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{s.renewables}%</td>
                      <td className={`text-right font-bold text-xs ${s.humanRights >= 85 ? 'text-emerald-600' : s.humanRights >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{s.humanRights}</td>
                      <td className="text-xs text-vfes-dark/65">{s.certified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
              <span>·</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Avg ESG supplier score trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={ESG_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[65, 90]} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="avgScore" name={tt('Avg ESG score')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                  <ReferenceLine y={70} stroke={RED} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 70-point mandatory threshold for continued listing. DJI (65) and Xiaomi (71) are being reviewed.')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ STOCK-OUT RISK ════════════════════════════════════════ */}
      {tab === 'stockouts' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('High stockout risk')} value="1" delta={tt('flagship — 78% probability')} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Revenue at risk')} value="BSD 4.2M" delta={tt('30 days')} trend="down" icon={DollarSign} />
          <KpiCard label={tt('Expedite PO raised')} value="Yes" delta={tt('PO-24892 — Samsung expedite')} trend="up" icon={Package} />
          <KpiCard label={tt('ETA flagship restock')} value="Jul 28" delta={tt('air-freight Samsung')} trend="flat" icon={Clock} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Stock-out risk — 30-day probability by SKU (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={STOCK_OUT_RISK} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="sku" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="prob" name={tt('Probability %')} radius={[0, 4, 4, 0]}>
                    {STOCK_OUT_RISK.map((s, i) => <Cell key={i} fill={s.prob >= 60 ? RED : s.prob >= 30 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine x={60} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Stock-out impact vs action — summary')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('SKU')}</th>
                    <th className="text-right">{tt('Probability')}</th>
                    <th className="text-right">{tt('Impact BSD M')}</th>
                    <th>{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {STOCK_OUT_RISK.map(s => (
                    <tr key={s.sku} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(s.sku)}</td>
                      <td className={`text-right font-bold text-xs ${s.prob >= 60 ? 'text-red-600' : s.prob >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.prob}%</td>
                      <td className="text-right font-bold text-xs text-red-600">BSD {s.impactM}M</td>
                      <td className="text-xs text-vfes-dark/65">{tt(s.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
              <span>·</span>
              <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
              <span>·</span>
              <Link to="/portal/device-financing" className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Cumulative demand vs cover — 8-month outlook (K units)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <ComposedChart data={DEMAND_SUPPLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="K" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="K" domain={[-10, 10]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area yAxisId="l" type="monotone" dataKey="supply" name={tt('Supply')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
                <Area yAxisId="l" type="monotone" dataKey="demand" name={tt('Demand')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                <Bar yAxisId="r" dataKey="gap" name={tt('Gap K')}>
                  {DEMAND_SUPPLY.map((d, i) => <Cell key={i} fill={d.gap < 0 ? RED : GREEN} />)}
                </Bar>
                <ReferenceLine yAxisId="r" y={0} stroke={SLATE} strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red bars = supply deficit. Jul–Aug worst case — promo demand spike meets Nokia CPE delay.')}</div>
        </Panel>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
          <span>·</span>
          <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO Dashboard →')}</Link>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#EF4444]/10 to-transparent border border-[#EF4444]/20 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">{tt('Critical action required')}</div>
          <div className="text-sm text-vfes-dark/75">{tt('Flagship handsets — 3.2 weeks cover with 8-week demand spike inbound. Air-freight PO-24892 (Samsung S26 Ultra) confirmed for Jul 28 arrival. Nokia CPE escalation in progress — interim Ericsson buffer stock released. Review in COO weekly ops meeting Jul 3.')}</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-vfes-dark/65">
            <div><span className="font-bold text-red-600">{tt('At close:')}</span> {tt('Flagship 3.2wk · Nokia 8.4wk lead')}</div>
            <div><span className="font-bold text-amber-600">{tt('In progress:')}</span> {tt('Air-freight expedite — BSD 0.3M cost')}</div>
            <div><span className="font-bold text-emerald-600">{tt('ETA restored:')}</span> {tt('Jul 28 · 6wk cover achieved')}</div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Link to="/portal/procurement" className="text-xs font-bold text-red-600 hover:underline">{tt('Open Procurement →')}</Link>
            <Link to="/portal/network" className="text-xs font-bold text-red-600 hover:underline">{tt('Network →')}</Link>
          </div>
        </div>
      </>)}
    </div>
  )
}
