import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Workflow, CheckCircle2, AlertTriangle, Clock, Brain, Truck, Package, Radio,
  TrendingUp, TrendingDown, Activity, Bell, Wrench, Zap,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, FunnelChart, Funnel, LabelList, LineChart, Line,
  AreaChart, Area, ComposedChart, ReferenceLine, PieChart, Pie,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8', PURPLE = '#7C3AED'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

// ─── Order-to-activate funnel (last 30 days) ─────────────────────────────────
const FUNNEL = [
  { stage: 'Orders received',     value: 41200, fill: NAVY   },
  { stage: 'Credit & validation', value: 39100, fill: '#1f6f9c' },
  { stage: 'Provisioning started',value: 37600, fill: BLUE   },
  { stage: 'Activated',           value: 33800, fill: '#57c4ec' },
  { stage: 'First-bill verified', value: 32400, fill: GREEN  },
]

// ─── Fallout by reason ────────────────────────────────────────────────────────
const FALLOUT = [
  { reason: 'Address / GIS mismatch',  count: 1840, autofix: 62 },
  { reason: 'Port-in (MNP) delay',     count: 1320, autofix: 48 },
  { reason: 'No engineer slot',        count: 980,  autofix: 30 },
  { reason: 'Stock / device backorder',count: 760,  autofix: 22 },
  { reason: 'Credit hold',             count: 540,  autofix: 71 },
  { reason: 'CPE / ONT fault',         count: 420,  autofix: 18 },
]

// ─── Cycle time by product & week ────────────────────────────────────────────
const CYCLE = [
  { wk:'W1', fixed:6.8, mobile:1.2, conv:7.4 },
  { wk:'W2', fixed:6.4, mobile:1.1, conv:7.0 },
  { wk:'W3', fixed:5.9, mobile:1.0, conv:6.6 },
  { wk:'W4', fixed:5.2, mobile:0.9, conv:6.1 },
]

// ─── FTTH provisioning by region ─────────────────────────────────────────────
const FTTH_REGIONS = [
  { region: 'Nassau',    orders: 6840, activated: 6200, fallout: 640, cycleD: 5.2 },
  { region: 'Freeport', orders: 5120, activated: 4680, fallout: 440, cycleD: 5.6 },
  { region: 'Abaco',  orders: 3240, activated: 2960, fallout: 280, cycleD: 6.1 },
  { region: 'Eleuthera',   orders: 2840, activated: 2580, fallout: 260, cycleD: 6.4 },
  { region: 'Abaco',   orders: 2140, activated: 1920, fallout: 220, cycleD: 7.2 },
  { region: 'Bimini',    orders: 1640, activated: 1480, fallout: 160, cycleD: 6.8 },
]

// ─── Mobile provisioning (SIM / eSIM / MNP) ──────────────────────────────────
const MOBILE_PROV = [
  { wk: 'W1', sim: 4800, esim: 1200, mnp: 840  },
  { wk: 'W2', sim: 4600, esim: 1380, mnp: 920  },
  { wk: 'W3', sim: 4400, esim: 1520, mnp: 880  },
  { wk: 'W4', sim: 4200, esim: 1680, mnp: 960  },
]

// ─── Partner / wholesale orders ──────────────────────────────────────────────
const PARTNER_ORDERS = [
  { partner: 'Scarlet',    orders: 2840, fallout: 180, sla: 'Green', cycleH: 6.2 },
  { partner: 'Rival ISP B The Bahamas',   orders: 2140, fallout: 210, sla: 'Amber', cycleH: 8.8 },
  { partner: 'EDPnet',orders: 1620, fallout: 120, sla: 'Green', cycleH: 5.8 },
  { partner: 'Telecable',    orders: 980,  fallout: 88,  sla: 'Green', cycleH: 6.4 },
  { partner: 'BT The Bahamas',    orders: 640,  fallout: 94,  sla: 'Red',   cycleH: 12.1 },
]

// ─── Activation success trend ─────────────────────────────────────────────────
const ACT_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  rate: 78 + i * 1.1 + (i >= 8 ? 0.4 : 0),
  target: 85,
}))

// ─── Order backlog by queue ───────────────────────────────────────────────────
const BACKLOG = [
  { queue: 'Pending validation',  count: 1840, p1: 42, ageH: 4.2 },
  { queue: 'Engineer scheduling', count: 1240, p1: 28, ageH: 8.8 },
  { queue: 'Device awaited',      count: 820,  p1: 14, ageH: 18.4 },
  { queue: 'Network feasibility', count: 480,  p1: 8,  ageH: 12.1 },
  { queue: 'Credit review',       count: 380,  p1: 6,  ageH: 6.6 },
]

// ─── Jeopardy ageing buckets ──────────────────────────────────────────────────
const JEOPARDY_AGE = [
  { bucket: '< 24h',  count: 2180 }, { bucket: '1–3 d',  count: 1640 },
  { bucket: '3–7 d',  count: 980  }, { bucket: '7–14 d', count: 420  },
  { bucket: '> 14 d', count: 140  },
]

// ─── Tab definition ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'funnel' | 'fallout' | 'ftth' | 'mobile' | 'partners' | 'backlog' | 'activation'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',   label: 'Overview',          icon: Activity   },
  { id: 'funnel',     label: 'Order Funnel',       icon: Workflow   },
  { id: 'fallout',    label: 'Fallout / Jeopardy', icon: AlertTriangle },
  { id: 'ftth',       label: 'FTTH Provisioning',  icon: Wrench     },
  { id: 'mobile',     label: 'Mobile Provisioning',icon: Radio      },
  { id: 'partners',   label: 'Partner Orders',     icon: Package    },
  { id: 'backlog',    label: 'Backlog',            icon: Clock      },
  { id: 'activation', label: 'Activation Success', icon: CheckCircle2 },
]

const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

export default function OrderProvisioningPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [ftthRegion, setFtthRegion] = useState<string>('All')
  const [backlogSort, setBacklogSort] = useState<'count' | 'ageH'>('count')
  const [mobileView, setMobileView] = useState<'trend' | 'mix'>('trend')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')
  const [falloutFilter, setFalloutFilter] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const received = FUNNEL[0].value
  const activated = FUNNEL[3].value
  const fallout = FALLOUT.reduce((s, f) => s + f.count, 0)
  const completion = ((activated / received) * 100).toFixed(1)

  const filteredFtth = useMemo(
    () => ftthRegion === 'All' ? FTTH_REGIONS : FTTH_REGIONS.filter(r => r.region === ftthRegion),
    [ftthRegion],
  )

  const sortedBacklog = useMemo(
    () => [...BACKLOG].sort((a, b) => backlogSort === 'count' ? b.count - a.count : b.ageH - a.ageH),
    [backlogSort],
  )

  const filteredFallout = useMemo(
    () => falloutFilter === 'All' ? FALLOUT
      : falloutFilter === 'Auto-fixable' ? FALLOUT.filter(f => f.autofix >= 50)
      : FALLOUT.filter(f => f.autofix < 50),
    [falloutFilter],
  )

  const mobileMix = useMemo(() => [
    { name: 'Physical SIM', value: MOBILE_PROV[3].sim,  color: NAVY   },
    { name: 'eSIM',         value: MOBILE_PROV[3].esim, color: BLUE   },
    { name: 'MNP port-in',  value: MOBILE_PROV[3].mnp,  color: GREEN  },
  ], [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Order & Provisioning')}
        subtitle={tt('Order-to-activate funnel · fallout / jeopardy · cycle time · FTTH · mobile · partner orders · backlog')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{completion}% {tt('completion')}</span>
          </div>
        }
      />

      {/* ── ML Intelligence ───────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Order provisioning intelligence"
        models={[
          { name: 'Fallout Classifier',   metric: 'precision 94.8%', sub: 'auto-route to fix squad'   },
          { name: 'Cycle Time Predictor', metric: 'MAE 0.4 d',       sub: 'per-order ETA at T+1h'      },
          { name: 'Jeopardy Detector',    metric: 'recall 0.89',     sub: '48h lead on escalation'    },
        ]}
        agentLabel="Run Fallout Resolver"
        agentRunningLabel="Triaging…"
        agentSteps={[
          'Classified 5,860 open jeopardy orders by root cause using Cortex AI',
          'Auto-fixed 2,380 address/GIS and credit-hold cases',
          'Re-booked 320 engineer slots from same-day cancellations',
          'Escalated 760 device backorders to supply chain for expedite',
        ]}
        agentBlurb="Every order stuck in fallout delays revenue recognition and hurts NPS at the worst moment — onboarding. One ML-powered classifier routes each case to the right fix automatically."
        decision={{
          title: 'Auto-resolve address & credit fallout; fix the engineer-slot bottleneck',
          detail: 'Address/GIS (62%) and credit-hold (71%) cases are highly auto-fixable. The biggest non-auto bottleneck is engineer availability — opening weekend slots and prioritising convergent installs recovers ~1.3 days of cycle time.',
          impact: 'faster activation · revenue pulled forward · NPS +4 pp at onboarding',
          risk: 'auto-fix needs a human-in-the-loop check on credit holds',
          linkTo: '#/portal/field-ops',
          linkLabel: 'Open Field Operations',
        }}
        chart={{
          kind: 'line',
          title: 'Activation success rate — 12 months (%)',
          xKey: 'm',
          unit: '%',
          data: ACT_TREND,
          series: [
            { key: 'rate',   name: 'Activation rate', color: BLUE  },
            { key: 'target', name: 'Target 85%',       color: GREEN, dashed: true },
          ],
          note: 'Rate improving steadily — fallout automation is the primary driver.',
        }}
      />

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('5,360 orders in fallout · BT The Bahamas partner SLA breached · engineer slot shortage in Abaco · 140 orders > 14 days aged')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Fallout resolver agent can auto-fix ~2,380 cases. Convergent cycle time down 1.3 days since W1 — but engineer scheduling is the next constraint.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/field-ops" className="text-xs font-bold text-amber-900 hover:underline">{tt('Field Ops →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
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

      {/* ═══════════════ OVERVIEW ══════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Orders (30d)')}              value={received.toLocaleString('en-BS')} delta={tt('fixed · mobile · conv')}     trend="up"   icon={Workflow}     accent />
          <KpiCard label={tt('Activated')}                 value={activated.toLocaleString('en-BS')}delta={`${completion}% ${tt('of orders')}`}  trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('In jeopardy / fallout')}     value={fallout.toLocaleString('en-BS')}  delta={tt('open work items')}             trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Avg cycle (convergent)')}    value="6.1 d"                            delta={tt('-1.3d vs W1')}                 trend="up"   icon={Clock}              />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FTTH activations (30d)')}    value="19,420"    delta={tt('5 regions')}                   trend="up"   icon={Wrench}             />
          <KpiCard label={tt('Mobile activations (30d)')}  value="6,840"     delta={tt('SIM + eSIM + MNP')}            trend="up"   icon={Radio}              />
          <KpiCard label={tt('Partner orders (30d)')}      value="8,220"     delta={tt('5 partners')}                  trend="up"   icon={Package}            />
          <KpiCard label={tt('Auto-fix rate (fallout)')}   value="42%"       delta={tt('+8pp vs M-1 · agent-driven')}  trend="up"   icon={Brain}              />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Order-to-activate funnel (30d)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <FunnelChart>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString('en-BS'), tt('Orders')]} />
                  <Funnel dataKey="value" data={FUNNEL} isAnimationActive>
                    <LabelList position="right" fill="#333" stroke="none" dataKey="stage" fontSize={12} />
                    <LabelList position="left"  fill="#666" stroke="none" dataKey="value" fontSize={11} formatter={(v: number) => v.toLocaleString('en-BS')} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Biggest drop is provisioning → activated (−10%) — driven by fallout; resolver agent targets it.')}
            </div>
          </Panel>
          <Panel title={tt('Order-to-activate cycle time (days)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={CYCLE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v} d`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="conv"   stroke={NAVY}  strokeWidth={2.4} name={tt('Convergent')} dot />
                  <Line type="monotone" dataKey="fixed"  stroke={BLUE}  strokeWidth={2}   name={tt('Fixed')}      dot={false} />
                  <Line type="monotone" dataKey="mobile" stroke={GREEN} strokeWidth={2}   name={tt('Mobile')}     dot={false} />
                  <ReferenceLine y={5} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">{tt('Dashed = 5-day target for fixed / convergent')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Activation success rate — 12 months (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={ACT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[74, 92]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="rate"   name={tt('Activation rate')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="target" name={tt('Target 85%')}      stroke={GREEN} fill="none"  strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Jeopardy ageing — open orders by bucket')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={JEOPARDY_AGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Orders')} radius={[4,4,0,0]}>
                    {JEOPARDY_AGE.map((b, i) => <Cell key={i} fill={i >= 3 ? '#dc2626' : i >= 2 ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Quick links')}</div>
            <div className="flex gap-4 flex-wrap text-xs font-semibold text-vfes-dark/70">
              <Link to="/portal/field-ops"        className="hover:text-vfes-dark">{tt('Field Operations →')}</Link>
              <Link to="/portal/operations"       className="hover:text-vfes-dark">{tt('Operations →')}</Link>
              <Link to="/portal/network"          className="hover:text-vfes-dark">{tt('Network Health →')}</Link>
              <Link to="/portal/coverage"         className="hover:text-vfes-dark">{tt('Coverage →')}</Link>
              <Link to="/portal/contact-center"   className="hover:text-vfes-dark">{tt('Contact Centre →')}</Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Panel title={tt('FTTH provisioning — regional overview')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={FTTH_REGIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders"    name={tt('Orders')}    fill={NAVY}  radius={[2,2,0,0]} />
                  <Bar dataKey="activated" name={tt('Activated')} fill={GREEN} radius={[2,2,0,0]} />
                  <Bar dataKey="fallout"   name={tt('Fallout')}   fill={AMBER} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/coverage"        className="text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
              <Link to="/portal/capacity-capex"  className="text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
              <Link to="/portal/assurance"       className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Mobile provisioning trend — SIM / eSIM / MNP')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={MOBILE_PROV}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sim"  name={tt('SIM')}  fill={NAVY}  stackId="a" />
                  <Bar dataKey="esim" name={tt('eSIM')} fill={BLUE}  stackId="a" />
                  <Bar dataKey="mnp"  name={tt('MNP')}  fill={GREEN} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/mobile-ran"  className="text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
              <Link to="/portal/customer-360" className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>
          <Panel title={tt('Partner SLA scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Partner')}</th>
                    <th className="text-right">{tt('Orders')}</th>
                    <th className="text-right">{tt('Cycle (h)')}</th>
                    <th>{tt('SLA')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PARTNER_ORDERS.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{p.partner}</td>
                      <td className="text-right font-mono text-xs">{p.orders.toLocaleString('en-BS')}</td>
                      <td className={`text-right font-bold text-xs ${p.cycleH > 9 ? 'text-red-600' : p.cycleH > 7 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.cycleH}h</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(p.sla)}`}>{tt(p.sla)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              <Link to="/portal/fraud"            className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Order backlog by queue — volume & priority')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={BACKLOG}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="queue" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name={tt('Total orders')} fill={NAVY}  radius={[2,2,0,0]} />
                  <Bar dataKey="p1"    name={tt('P1 priority')}  fill={AMBER} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/incidents"   className="text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <Link to="/portal/coo"         className="text-vfes-dark hover:underline">{tt('COO →')}</Link>
              <Link to="/portal/cto"         className="text-vfes-dark hover:underline">{tt('CTO →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ ORDER FUNNEL ══════════════════════════════════════ */}
      {tab === 'funnel' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Orders received')}     value="41,200" delta={tt('fixed · mobile · conv')}   trend="up"   icon={Workflow}     accent />
          <KpiCard label={tt('Activated')}           value="33,800" delta={`${completion}%`}              trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Provisioning drop')}   value="−10%"   delta={tt('provisiong → activated')}  trend="down" icon={TrendingDown}       />
          <KpiCard label={tt('First-bill verified')} value="32,400" delta="97.0% of activated"            trend="up"   icon={TrendingUp}         />
        </div>

        <Panel title={tt('Order-to-activate funnel — last 30 days')}>
          <div className="h-80">
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString('en-BS'), tt('Orders')]} />
                <Funnel dataKey="value" data={FUNNEL} isAnimationActive>
                  <LabelList position="right" fill="#333" stroke="none" dataKey="stage" fontSize={12} />
                  <LabelList position="left"  fill="#666" stroke="none" dataKey="value" fontSize={11} formatter={(v: number) => v.toLocaleString('en-BS')} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('Biggest drop is provisioning → activated (−10%) — driven by fallout; resolver agent targets it.')}
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Cycle time trend — all products (days)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={CYCLE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="conv"   stroke={NAVY}  strokeWidth={2.4} name={tt('Convergent')} dot />
                  <Line type="monotone" dataKey="fixed"  stroke={BLUE}  strokeWidth={2}   name={tt('Fixed')}      dot={false} />
                  <Line type="monotone" dataKey="mobile" stroke={GREEN} strokeWidth={2}   name={tt('Mobile')}     dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55 flex items-center gap-1">
              <Truck className="w-3 h-3" /> {tt('Convergent installs down 1.3 days in a month as fallout automation ramps.')}
            </div>
          </Panel>
          <Panel title={tt('Activation success rate — 12 months (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ACT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[74, 92]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="rate"   name={tt('Activation rate')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="target" name={tt('Target 85%')}      stroke={GREEN} fill="none"  strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <Link to="/portal/field-ops"  className="text-vfes-dark hover:underline">{tt('Field Operations →')}</Link>
          <Link to="/portal/operations" className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
          <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('FTTH provisioning cycle time by region (days)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={FTTH_REGIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" domain={[0, 9]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cycleD" name={tt('Cycle (days)')} radius={[4,4,0,0]}>
                    {FTTH_REGIONS.map((r, i) => <Cell key={i} fill={r.cycleD > 6.5 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={5} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2 uppercase tracking-widest">{tt('Dashed green = 5-day target for FTTH activation')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Partner order volume vs cycle time comparison')}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={PARTNER_ORDERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="h" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="orders"  name={tt('Orders')}    fill={NAVY}  radius={[4,4,0,0]} />
                  <Line yAxisId="r" type="monotone" dataKey="cycleH" name={tt('Cycle (h)')} stroke={AMBER} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/coverage"  className="text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
              <Link to="/portal/network"   className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
              <Link to="/portal/coo"       className="text-vfes-dark hover:underline">{tt('COO Dashboard →')}</Link>
              <Link to="/portal/cto"       className="text-vfes-dark hover:underline">{tt('CTO Dashboard →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ FALLOUT / JEOPARDY ═══════════════════════════════ */}
      {tab === 'fallout' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total in fallout')}      value={fallout.toLocaleString('en-BS')} delta={tt('all reasons')}            trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Auto-fixable cases')}    value="2,380"                          delta={tt('42% of fallout')}          trend="up"   icon={Zap}                />
          <KpiCard label={tt('Needs field action')}    value="1,400"                delta={tt('slots · stock · CPE')}     trend="down" icon={Wrench}             />
          <KpiCard label={tt('Avg auto-fix rate')}     value="42%"                            delta={tt('+8pp vs M-1')}             trend="up"   icon={TrendingUp}         />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'Auto-fixable', 'Field action'].map(f => (
            <button key={f} onClick={() => setFalloutFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${falloutFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('Fallout / jeopardy by reason — volume & auto-fix rate')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={filteredFallout} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 9 }} width={160} />
                <Tooltip contentStyle={TS} formatter={(v: number, _n: any, p: any) => [`${v.toLocaleString('en-BS')} cases · ${p.payload.autofix}% auto-fixable`, tt('Reason')]} />
                <Bar dataKey="count" radius={[0,6,6,0]}>
                  {filteredFallout.map((f, i) => <Cell key={i} fill={f.autofix >= 60 ? GREEN : f.autofix >= 40 ? BLUE : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('Green = highly auto-fixable (address, credit). Amber = needs field/supply action (slots, stock, CPE).')}</div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Jeopardy ageing distribution')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={JEOPARDY_AGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Orders')} radius={[4,4,0,0]}>
                    {JEOPARDY_AGE.map((b, i) => <Cell key={i} fill={i >= 3 ? '#dc2626' : i >= 2 ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Auto-fix rate by reason (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={FALLOUT}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="reason" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="autofix" name={tt('Auto-fix %')} radius={[4,4,0,0]}>
                    {FALLOUT.map((f, i) => <Cell key={i} fill={f.autofix >= 60 ? GREEN : f.autofix >= 40 ? BLUE : AMBER} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/field-ops"   className="text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
              <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ FTTH PROVISIONING ════════════════════════════════ */}
      {tab === 'ftth' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('FTTH orders (30d)')}     value="24,820" delta={tt('6 regions')}             trend="up"   icon={Wrench}      accent />
          <KpiCard label={tt('FTTH activated')}        value="19,820" delta="79.9% completion"            trend="up"   icon={CheckCircle2}      />
          <KpiCard label={tt('Avg cycle FTTH')}        value="5.9 d"  delta={tt('-0.9d vs W1')}           trend="up"   icon={Clock}             />
          <KpiCard label={tt('FTTH fallout')}          value="2,000"  delta="8.1% fallout rate"           trend="down" icon={AlertTriangle}     />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', ...FTTH_REGIONS.map(r => r.region)].map(r => (
            <button key={r} onClick={() => setFtthRegion(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${ftthRegion === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <Panel title={tt('FTTH provisioning — regional scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Orders')}</th>
                  <th className="text-right">{tt('Activated')}</th>
                  <th className="text-right">{tt('Fallout')}</th>
                  <th className="text-right">{tt('Fallout %')}</th>
                  <th className="text-right">{tt('Cycle (days)')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFtth.map(r => (
                  <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{r.region}</td>
                    <td className="text-right font-mono">{r.orders.toLocaleString('en-BS')}</td>
                    <td className="text-right font-bold text-emerald-600">{r.activated.toLocaleString('en-BS')}</td>
                    <td className="text-right font-mono text-red-600">{r.fallout.toLocaleString('en-BS')}</td>
                    <td className={`text-right font-bold ${(r.fallout/r.orders) > 0.1 ? 'text-red-600' : (r.fallout/r.orders) > 0.08 ? 'text-amber-600' : 'text-emerald-600'}`}>{((r.fallout/r.orders)*100).toFixed(1)}%</td>
                    <td className={`text-right font-bold ${r.cycleD > 6.5 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.cycleD}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/field-ops"  className="text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
            <Link to="/portal/coverage"   className="text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
            <Link to="/portal/network"    className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('FTTH orders vs activated by region')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredFtth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders"    name={tt('Orders')}    fill={NAVY}  radius={[4,4,0,0]} />
                  <Bar dataKey="activated" name={tt('Activated')} fill={GREEN} radius={[4,4,0,0]} />
                  <Bar dataKey="fallout"   name={tt('Fallout')}   fill={AMBER} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-6">
          <Panel title={tt('FTTH orders vs activated by region')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredFtth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders"    name={tt('Orders')}    fill={NAVY}  radius={[4,4,0,0]} />
                  <Bar dataKey="activated" name={tt('Activated')} fill={GREEN} radius={[4,4,0,0]} />
                  <Bar dataKey="fallout"   name={tt('Fallout')}   fill={AMBER} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Abaco cycle time exceeds target — engineer scheduling bottleneck; slot optimisation in progress.')}</div>
          </Panel>
        </div>
      </>)}
      {tab === 'mobile' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Mobile activations (30d)')} value="6,840"  delta={tt('SIM + eSIM + MNP')}    trend="up"   icon={Radio}       accent />
          <KpiCard label={tt('eSIM share')}               value="24.6%"  delta={tt('+6pp YoY')}            trend="up"   icon={Zap}               />
          <KpiCard label={tt('MNP port-in (30d)')}        value="3,600"  delta={tt('avg 0.9d')}            trend="up"   icon={TrendingUp}        />
          <KpiCard label={tt('Mobile fallout rate')}      value="3.2%"   delta={tt('MNP delay dominant')}  trend="up"   icon={CheckCircle2}      />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['trend', 'mix'] as const).map(v => (
            <button key={v} onClick={() => setMobileView(v)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${mobileView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {v === 'trend' ? tt('Weekly trend') : tt('Mix breakdown')}
            </button>
          ))}
        </div>

        {mobileView === 'trend' ? (
          <Panel title={tt('Mobile provisioning trend — SIM / eSIM / MNP (weekly)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={MOBILE_PROV}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sim"  name={tt('Physical SIM')} fill={NAVY}  stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="esim" name={tt('eSIM')}         fill={BLUE}  stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="mnp"  name={tt('MNP port-in')}  fill={GREEN} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ) : (
          <Panel title={tt('Mobile activation mix — latest week')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={mobileMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {mobileMix.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString('en-BS'), '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <Link to="/portal/mobile-ran"    className="text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          <Link to="/portal/coverage"      className="text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
          <Link to="/portal/customer-360"  className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Mobile fallout by reason — auto-fix potential')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={FALLOUT.slice(0, 3)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count"   name={tt('Volume')}    fill={NAVY}  radius={[0,4,4,0]} />
                  <Bar dataKey="autofix" name={tt('Auto-fix %')} fill={GREEN} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"  className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/incidents"  className="text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ PARTNER ORDERS ════════════════════════════════════ */}
      {tab === 'partners' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Partner orders (30d)')} value="8,220"  delta={tt('5 partners')}            trend="up"   icon={Package}     accent />
          <KpiCard label={tt('SLA green')}            value="3/5"    delta={tt('partners on-track')}     trend="up"   icon={CheckCircle2}      />
          <KpiCard label={tt('SLA breached')}         value="1"      delta="BT The Bahamas — 12.1h avg cycle" trend="down" icon={AlertTriangle}     />
          <KpiCard label={tt('Avg partner fallout')}  value="610"    delta="7.4% overall"                trend="down" icon={TrendingDown}      />
        </div>

        <Panel title={tt('Partner / wholesale order scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Partner')}</th>
                  <th className="text-right">{tt('Orders (30d)')}</th>
                  <th className="text-right">{tt('Fallout')}</th>
                  <th className="text-right">{tt('Fallout %')}</th>
                  <th className="text-right">{tt('Avg cycle (h)')}</th>
                  <th>{tt('SLA')}</th>
                </tr>
              </thead>
              <tbody>
                {PARTNER_ORDERS.map(p => (
                  <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{p.partner}</td>
                    <td className="text-right font-mono">{p.orders.toLocaleString('en-BS')}</td>
                    <td className="text-right font-mono text-amber-600">{p.fallout}</td>
                    <td className={`text-right font-bold ${(p.fallout/p.orders) > 0.1 ? 'text-red-600' : 'text-amber-600'}`}>{((p.fallout/p.orders)*100).toFixed(1)}%</td>
                    <td className={`text-right font-bold ${p.cycleH > 9 ? 'text-red-600' : p.cycleH > 7 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.cycleH}h</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(p.sla)}`}>{tt(p.sla)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/operations"       className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Partner cycle time vs fallout rate')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={PARTNER_ORDERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="h" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="r" dataKey="fallout"  name={tt('Fallout count')} fill={AMBER} radius={[4,4,0,0]} />
                  <Line yAxisId="l" type="monotone" dataKey="cycleH"  name={tt('Cycle (h)')} stroke={NAVY} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-6">
          <Panel title={tt('Partner order cycle time vs fallout rate')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={PARTNER_ORDERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="partner" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="h" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="r" dataKey="fallout" name={tt('Fallout count')} fill={AMBER} radius={[4,4,0,0]} />
                  <Line yAxisId="l" type="monotone" dataKey="cycleH" name={tt('Cycle (h)')} stroke={NAVY} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/operations"       className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
      {tab === 'backlog' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total backlog')}          value="4,760" delta={tt('5 queues')}              trend="down" icon={Clock}        accent />
          <KpiCard label={tt('Oldest bucket')}          value="18.4h" delta={tt('device awaited')}        trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('P1 orders in backlog')}   value="98"    delta={tt('expedite required')}     trend="down" icon={TrendingDown}       />
          <KpiCard label={tt('Avg queue age')}          value="9.8h"  delta={tt('across all queues')}     trend="flat" icon={Activity}           />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['count', 'ageH'] as const).map(k => (
            <button key={k} onClick={() => setBacklogSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${backlogSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'count' ? tt('Volume') : tt('Oldest')}
            </button>
          ))}
        </div>

        <Panel title={tt('Order backlog by queue')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Queue')}</th>
                  <th className="text-right">{tt('Count')}</th>
                  <th className="text-right">{tt('P1 orders')}</th>
                  <th className="text-right">{tt('Avg age (h)')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedBacklog.map(q => (
                  <tr key={q.queue} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(q.queue)}</td>
                    <td className="text-right font-mono">{q.count.toLocaleString('en-BS')}</td>
                    <td className={`text-right font-bold ${q.p1 > 20 ? 'text-red-600' : q.p1 > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{q.p1}</td>
                    <td className={`text-right font-bold ${q.ageH > 12 ? 'text-red-600' : q.ageH > 7 ? 'text-amber-600' : 'text-emerald-600'}`}>{q.ageH}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/field-ops"   className="text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/noc-map"     className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Backlog volume by queue')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedBacklog}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="queue" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name={tt('Orders')} fill={NAVY}  radius={[4,4,0,0]} />
                  <Bar dataKey="p1"    name={tt('P1')}     fill={AMBER} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Jeopardy ageing — open orders by time bucket')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={JEOPARDY_AGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Orders')} radius={[4,4,0,0]}>
                    {JEOPARDY_AGE.map((b, i) => <Cell key={i} fill={i >= 3 ? '#dc2626' : i >= 2 ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/incidents"   className="text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
              <Link to="/portal/noc-map"     className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ ACTIVATION SUCCESS ═══════════════════════════════ */}
      {tab === 'activation' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Activation rate (30d)')}  value={`${completion}%`} delta={tt('+2.4pp vs M-1')}         trend="up"   icon={CheckCircle2} accent />
          <KpiCard label={tt('Activated (30d)')}        value="33,800"           delta={tt('of 41,200 orders')}       trend="up"   icon={TrendingUp}         />
          <KpiCard label={tt('First-bill verified')}    value="32,400"           delta="97.0% of activated"           trend="up"   icon={Activity}           />
          <KpiCard label={tt('Target rate')}            value="85%"              delta={tt('FY2026 goal')}            trend="flat" icon={Zap}                />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Activation success rate — 12 months (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={ACT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[74, 92]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="rate"   name={tt('Activation rate')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="target" name={tt('Target 85%')}      stroke={GREEN} fill="none"  strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">{tt('On track for Q4 85% target — automation key driver')}</div>
          </Panel>
          <Panel title={tt('Jeopardy ageing — orders by age bucket')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={JEOPARDY_AGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Orders')} radius={[4,4,0,0]}>
                    {JEOPARDY_AGE.map((b, i) => <Cell key={i} fill={i >= 3 ? '#dc2626' : i >= 2 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine y={500} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          <Link to="/portal/contact-center"   className="text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
          <Link to="/portal/customer-360"     className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <Link to="/portal/ai-insights"      className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <Link to="/portal/coo"              className="text-vfes-dark hover:underline">{tt('COO Dashboard →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Activation success — funnel summary')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Stage')}</th>
                    <th className="text-right">{tt('Count')}</th>
                    <th className="text-right">{tt('Conversion')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNNEL.map((f, i) => (
                    <tr key={f.stage} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(f.stage)}</td>
                      <td className="text-right font-mono">{f.value.toLocaleString('en-BS')}</td>
                      <td className="text-right font-bold text-emerald-600">{i === 0 ? '100%' : `${((f.value / FUNNEL[0].value) * 100).toFixed(1)}%`}</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${i === 3 || i === 4 ? 'bg-emerald-100 text-emerald-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{i >= 3 ? tt('Good') : i === 2 ? tt('Watch') : tt('Processing')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
              <Link to="/portal/noc-map"     className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ─── source attribution ──────────────────────────────────────────── */}
      <div className="mt-8 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Activity className="w-3 h-3" /> {tt('Source: OSS/BSS order management · FieldForce WFM · partner APIs · Snowflake Cortex AI')}
      </div>

      {/* ─── navigation footer ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-vfes-dark/60 border-t border-black/5 pt-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/40">{tt('See also:')}</span>
        <Link to="/portal/assurance"       className="hover:text-vfes-dark">{tt('Assurance →')}</Link>
        <Link to="/portal/field-ops"       className="hover:text-vfes-dark">{tt('Field Ops →')}</Link>
        <Link to="/portal/incidents"       className="hover:text-vfes-dark">{tt('Incidents →')}</Link>
        <Link to="/portal/contact-center"  className="hover:text-vfes-dark">{tt('Contact Centre →')}</Link>
        <Link to="/portal/billing-charging" className="hover:text-vfes-dark">{tt('Billing & Charging →')}</Link>
        <Link to="/portal/coverage"        className="hover:text-vfes-dark">{tt('Coverage →')}</Link>
        <Link to="/portal/coo"             className="hover:text-vfes-dark">{tt('COO →')}</Link>
      </div>
    </div>
  )
}
