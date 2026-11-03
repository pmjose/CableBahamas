import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3366)
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Siren, Clock, Wrench, Brain, ChevronRight, CheckCircle2,
  AlertTriangle, Bell, ShieldCheck, TrendingUp, TrendingDown, Zap, Radio, Network,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import NET_FACTS from './_network_facts'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, PieChart, Pie, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

// ─── Alarm → ticket → field → resolution thread ──────────────────────────────
const THREAD = [
  { stage: 'Alarm raised',    t: '08:14:02', detail: 'eNodeB GNT-PAT-007 — cell down (VSWR)', owner: 'NOC auto', icon: Siren,         done: true },
  { stage: 'Correlated',      t: '08:14:09', detail: 'Cortex linked 14 alarms → 1 root cause · 4,820 subs impacted', owner: 'Cortex', icon: Brain,         done: true },
  { stage: 'Ticket created',  t: '08:14:12', detail: 'P1 TT-44821 auto-opened · B2B accounts notified', owner: 'ITSM',     icon: AlertTriangle, done: true },
  { stage: 'Field dispatched',t: '08:21:40', detail: 'Nearest RF-certified tech routed · ETA 34 min', owner: 'FieldOps',   icon: Wrench,        done: true },
  { stage: 'Mitigated',       t: '08:58:11', detail: 'Antenna feeder replaced · cell restored', owner: 'Tech-218',        icon: CheckCircle2,  done: true },
  { stage: 'Resolved & closed',t:'09:12:03', detail: 'KPIs nominal 15 min · PIR scheduled', owner: 'NOC',                 icon: CheckCircle2,  done: true },
]

const CIM_BY_SERVICE = [
  { svc: 'Mobile data',     cim: 8420, creditK: 62, color: NAVY },
  { svc: 'Fixed broadband', cim: 5180, creditK: 41, color: BLUE },
  { svc: 'B2B / wholesale', cim: 3120, creditK: 31, color: AMBER },
  { svc: 'Voice / VoLTE',   cim: 1700, creditK: 8,  color: SLATE },
]

const MTTR_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i],
  mttr: 52 - i * 1.3 + (i === 4 ? 8 : 0),
  mtta: 7.2 - i * 0.26,
}))

const OPEN_TICKETS = [
  { id: 'TT-44892', sev: 'P1', svc: 'Mobile',  region: 'Freeport', age: '12m',     sla: 'on-track', cim: 1840 },
  { id: 'TT-44885', sev: 'P2', svc: 'Fixed',   region: 'Nassau',    age: '48m',     sla: 'at-risk',  cim: 620  },
  { id: 'TT-44871', sev: 'P2', svc: 'B2B',     region: 'Abaco',  age: '1h 52m',  sla: 'breached', cim: 410  },
  { id: 'TT-44860', sev: 'P3', svc: 'Voice',   region: 'Eleuthera',   age: '3h 10m',  sla: 'on-track', cim: 90   },
  { id: 'TT-44840', sev: 'P3', svc: 'B2B',     region: 'Bimini',    age: '5h 20m',  sla: 'on-track', cim: 55   },
  { id: 'TT-44811', sev: 'P2', svc: 'Mobile',  region: 'Luxembourg',  age: '6h',      sla: 'at-risk',  cim: 310  },
]

// ─── Fault / alarm correlation ──────────────────────────────────────────────
const ALARM_CATEGORIES = [
  { cat: 'RAN cell down',      count: 142, correlated: 86, color: NAVY  },
  { cat: 'Transport link',     count: 64,  correlated: 72, color: BLUE  },
  { cat: 'Core NF degraded',   count: 38,  correlated: 91, color: GREEN },
  { cat: 'Power/AC fault',     count: 29,  correlated: 58, color: AMBER },
  { cat: 'Optical loss (PON)', count: 22,  correlated: 64, color: SLATE },
]

const ALARM_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  p1: i === 26 ? 1 : 0,
  p2: i === 28 || i === 29 ? 1 : i % 8 === 0 ? 1 : 0,
  p3: (i % 3 === 0 ? 1 : 0) + (i % 5 === 0 ? 1 : 0),
  total: 12 + Math.round(Math.sin(i / 4) * 4 + 2),
}))

// ─── SLA / SLO ───────────────────────────────────────────────────────────────
const SLO_SERVICES = [
  { service: 'Mobile data (eMBB)',    target: 99.95, actual: 99.97, burn: 8,  status: 'Green' },
  { service: 'Fixed broadband FTTH',  target: 99.90, actual: 99.91, burn: 22, status: 'Amber' },
  { service: 'VoLTE voice',           target: 99.98, actual: 99.98, burn: 3,  status: 'Green' },
  { service: 'B2B MPLS VPN',          target: 99.99, actual: 99.97, burn: 68, status: 'Red'   },
  { service: '5G URLLC slice',        target: 99.999,actual: 99.999,burn: 2,  status: 'Green' },
  { service: 'IoT MIoT platform',     target: 99.50, actual: 99.72, burn: 4,  status: 'Green' },
]

const SLO_BURN_TREND = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i+1}`,
  mobile: 6 + Math.round(scenarioRandom() * 4),
  fixed:  18 + Math.round(scenarioRandom() * 8),
  b2b:    52 + Math.round(scenarioRandom() * 20),
}))

// ─── Proactive assurance ─────────────────────────────────────────────────────
const PROACTIVE_ACTIONS = [
  { id: 'PA-0421', type: 'Predictive',  target: 'GNT-RAN-Cluster-14', risk: 'High',  action: 'Pre-emptive carrier swap before 08:00 peak', status: 'Actioned', saving: 42 },
  { id: 'PA-0418', type: 'Congestion',  target: 'ANT-5G-Zuid',         risk: 'High',  action: 'Traffic steering to adjacent sectors',       status: 'Actioned', saving: 18 },
  { id: 'PA-0415', type: 'PON optical', target: 'BRG-OLT-07',         risk: 'Med',   action: 'Pre-degradation ONT swap scheduled',        status: 'Pending',  saving: 12 },
  { id: 'PA-0410', type: 'Core NF',    target: 'UPF-cluster-B',       risk: 'Med',   action: 'Scale-out UPF instance before Wednesday',   status: 'Pending',  saving: 8  },
  { id: 'PA-0408', type: 'Transport',  target: 'Local peering-peering',      risk: 'Low',   action: 'QoS re-mark under CDN spike',                status: 'Resolved', saving: 5  },
]

const PROACTIVE_TREND = [
  { m: 'Jun', prevented: 4,  reactive: 12 }, { m: 'Jul', prevented: 6,  reactive: 10 },
  { m: 'Aug', prevented: 8,  reactive: 9  }, { m: 'Sep', prevented: 10, reactive: 8  },
  { m: 'Oct', prevented: 12, reactive: 7  }, { m: 'Nov', prevented: 14, reactive: 6  },
]

// ─── Customer impact breakdown ────────────────────────────────────────────────
const CIM_REGION = [
  { region: 'Nassau',      cim: 4200, subs: 3420, color: NAVY  },
  { region: 'Freeport',   cim: 3180, subs: 2810, color: BLUE  },
  { region: 'Abaco',    cim: 1840, subs: 1640, color: GREEN },
  { region: 'Eleuthera',     cim: 1320, subs: 1180, color: AMBER },
  { region: 'Abaco',     cim: 980,  subs: 870,  color: SLATE },
  { region: 'Luxembourg',    cim: 820,  subs: 740,  color: '#7C3AED' },
]

// ─── Problem management ──────────────────────────────────────────────────────
const KNOWN_PROBLEMS = [
  { id: 'PRB-0098', title: 'Local peering peering intermittent micro-congestion', sev: 'P2', cim: 1840, workaround: 'Traffic pre-shift to AMS-IX', rootCause: 'port scheduler firmware bug', eta: '2026-12-18' },
  { id: 'PRB-0092', title: 'UPF session affinity drop under geo-redundancy failover', sev: 'P2', cim: 1230, workaround: 'Forced UPF primary-only mode', rootCause: 'SMF N4 race condition',   eta: '2027-01-01' },
  { id: 'PRB-0085', title: 'Freeport PON ONT serial-number collision on MDU sites', sev: 'P3', cim: 640,  workaround: 'Manual re-provision on collision', rootCause: 'BSS provisioning API bug', eta: '2026-12-25' },
  { id: 'PRB-0077', title: 'VoLTE MOS degradation on 2100 MHz under load',          sev: 'P3', cim: 480,  workaround: 'CSFB fallback on trigger',         rootCause: 'eRAB QCI misconfiguration', eta: '2027-01-15' },
]

// ─── Tab definition ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'thread' | 'alarms' | 'sla' | 'slo' | 'tickets' | 'proactive' | 'problems'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',  label: 'Overview',          icon: Activity      },
  { id: 'thread',    label: 'Incident Thread',   icon: Siren         },
  { id: 'alarms',    label: 'Fault / Alarms',    icon: Bell          },
  { id: 'sla',       label: 'SLA / CIM',         icon: Clock         },
  { id: 'slo',       label: 'SLO Burn',          icon: ShieldCheck   },
  { id: 'tickets',   label: 'Open Tickets',      icon: AlertTriangle },
  { id: 'proactive', label: 'Proactive',         icon: Zap           },
  { id: 'problems',  label: 'Problem Mgmt',      icon: Wrench        },
]

const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const sevC = (s: string) =>
  s === 'P1' ? 'bg-red-100 text-red-700' : s === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
const slaC = (s: string) =>
  s === 'on-track' ? 'bg-emerald-100 text-emerald-700' : s === 'at-risk' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

export default function AssurancePage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [ticketSev, setTicketSev] = useState<string>('All')
  const [sloBurnSort, setSloBurnSort] = useState<'burn' | 'actual'>('burn')
  const [alarmCat, setAlarmCat] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')
  const [proactiveFilter, setProactiveFilter] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredTickets = useMemo(
    () => ticketSev === 'All' ? OPEN_TICKETS : OPEN_TICKETS.filter(t => t.sev === ticketSev),
    [ticketSev],
  )

  const sortedSLO = useMemo(
    () => [...SLO_SERVICES].sort((a, b) => sloBurnSort === 'burn' ? b.burn - a.burn : a.actual - b.actual),
    [sloBurnSort],
  )

  const filteredAlarms = useMemo(
    () => alarmCat === 'All' ? ALARM_CATEGORIES : ALARM_CATEGORIES.filter(a => a.cat === alarmCat),
    [alarmCat],
  )

  const filteredProactive = useMemo(
    () => proactiveFilter === 'All' ? PROACTIVE_ACTIONS : PROACTIVE_ACTIONS.filter(p => p.status === proactiveFilter),
    [proactiveFilter],
  )

  const totalCIM = CIM_BY_SERVICE.reduce((s, c) => s + c.cim, 0)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Service Assurance & NOC')}
        subtitle={tt('Alarm → ticket → field → resolution · MTTA/MTTR · SLA/SLO · customer-impacting minutes · proactive assurance')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">MTTR {NET_FACTS.mttrMin}m</span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">MTTA {NET_FACTS.mttaMin}m</span>
          </div>
        }
      />

      {/* ── ML Intelligence ───────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Assurance intelligence"
        models={[
          { name: 'Alarm Correlator',       metric: 'precision 97.2%', sub: '14→1 root-cause in 7 sec'     },
          { name: 'MTTR Predictor',          metric: 'MAE 4.1 min',     sub: 'time-to-fix for open tickets'  },
          { name: 'Proactive Fault Detector',metric: 'recall 0.91',     sub: 'pre-failure detection 2h ahead'},
        ]}
        agentLabel="Run Assurance Agent"
        agentRunningLabel="Correlating…"
        agentSteps={[
          'Correlated 14 RAN alarms → single root cause (VSWR) in 7 seconds',
          'Auto-opened P1 ticket TT-44821, notified 6 impacted B2B accounts',
          'Dispatched nearest RF-certified tech with 34-min ETA',
          'Monitored resolution and scheduled post-incident review',
        ]}
        agentBlurb="One unified alarm stream — RAN, core, transport, access — lets a single model collapse noise into root causes, so NOC engineers spend time fixing, not searching."
        decision={{
          title: 'Make AI alarm-correlation the default for all P1/P2 incidents',
          detail: 'The correlator collapsed 14 alarms to one root cause in 7 seconds on the Freeport incident. Rolling this to all severe incidents at scale compounds the 22% MTTA gain network-wide.',
          impact: '-18% customer-impacting minutes · BSD 142K SLA credit saved MTD',
          risk: 'false-correlate rate 0.6% — keep human gate on P1',
          linkTo: '#/portal/war-room',
          linkLabel: 'Open War Room',
        }}
        chart={{
          kind: 'line',
          title: 'MTTR & MTTA trend — 12 months (minutes)',
          xKey: 'm',
          unit: 'm',
          data: MTTR_TREND,
          series: [
            { key: 'mttr', name: 'MTTR', color: NAVY },
            { key: 'mtta', name: 'MTTA', color: BLUE },
          ],
          note: 'Jan spike = storm cluster; trend consistently down as auto-correlation matures.',
        }}
      />

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('TT-44871 breached B2B SLA (Abaco) · 4 P1/P2 open · UPF scale-out pending · Local peering micro-congestion')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('B2B credit exposure BSD 142K MTD — PRB-0092 workaround active. 14 proactive actions prevented ~97K CIM this month.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/war-room" className="text-xs font-bold text-amber-900 hover:underline">{tt('War Room →')}</Link>
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
          <KpiCard label={tt('MTTA')}                           value={`${NET_FACTS.mttaMin} min`}                    delta={tt('-22% YoY · AI correlation')}    trend="up"   icon={Clock}         accent />
          <KpiCard label={tt('MTTR')}                           value={`${NET_FACTS.mttrMin} min`}                    delta={tt('-12 min YoY')}                  trend="up"   icon={Wrench}              />
          <KpiCard label={tt('Customer-impacting min (mo)')}    value={totalCIM.toLocaleString('en-BS')}              delta={tt('-18% with auto-dispatch')}      trend="up"   icon={Activity}            />
          <KpiCard label={tt('SLA-credit exposure')}            value={`BSD ${NET_FACTS.slaCreditExposureK}K`}           delta={tt('B2B contractual MTD')}          trend="down" icon={AlertTriangle}        />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open P1/P2 tickets')}             value="4"                                             delta={tt('1 SLA breached')}               trend="down" icon={Siren}               />
          <KpiCard label={tt('Proactive actions (mo)')}         value="14"                                            delta={tt('97K CIM prevented')}            trend="up"   icon={Zap}                 />
          <KpiCard label={tt('Alarm-to-ticket correlation')}    value="97.2%"                                         delta={tt('AI-driven')}                    trend="up"   icon={Brain}               />
          <KpiCard label={tt('SLO at-risk services')}           value="2"                                             delta={tt('Fixed broadband · B2B MPLS')}   trend="down" icon={ShieldCheck}          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('MTTA / MTTR — 12 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={MTTR_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="m" />
                    <Tooltip contentStyle={TS} formatter={(v: number) => [`${v.toFixed(1)} min`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="mttr" stroke={NAVY} strokeWidth={2.5} name={tt('MTTR')} dot />
                    <Line type="monotone" dataKey="mtta" stroke={BLUE} strokeWidth={2.5} name={tt('MTTA')} dot={false} />
                    <ReferenceLine y={40} stroke={AMBER} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">{tt('Dashed line = 40 min MTTR target for FY2026')}</div>
            </Panel>
          </div>
          <Panel title={tt('CIM by service (min / month)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={CIM_BY_SERVICE} dataKey="cim" nameKey="svc" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {CIM_BY_SERVICE.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString('en-BS') + ' min', '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Proactive vs reactive incidents — monthly trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={PROACTIVE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="prevented" name={tt('Proactive (prevented)')} fill={GREEN}  radius={[4,4,0,0]} stackId="a" />
                  <Bar dataKey="reactive"  name={tt('Reactive')}              fill={NAVY}   radius={[4,4,0,0]} stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Customer-impacting minutes by region')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CIM_REGION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cim" name={tt('CIM')} radius={[0,4,4,0]}>
                    {CIM_REGION.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/noc-map" className="text-xs font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
              <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network Health →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Alarm frequency — 30 days')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ALARM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p3" name="P3" stackId="a" fill={BLUE}      />
                  <Bar dataKey="p2" name="P2" stackId="a" fill={AMBER}     />
                  <Bar dataKey="p1" name="P1" stackId="a" fill="#dc2626"   />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('SLO burn rate — weekly by service (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={SLO_BURN_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="b2b"    name={tt('B2B MPLS')}  stroke="#dc2626" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="fixed"  name={tt('Fixed BB')}  stroke={AMBER}   strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="mobile" name={tt('Mobile')}    stroke={BLUE}    strokeWidth={2}   dot={false} />
                  <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2 uppercase tracking-widest">
              {tt('Dashed red = 50% burn threshold — B2B MPLS at 68% (critical)')}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Change-related incidents — last 8 weeks')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { wk:'W1', change_rel:2, non_change:4 }, { wk:'W2', change_rel:1, non_change:5 },
                  { wk:'W3', change_rel:3, non_change:3 }, { wk:'W4', change_rel:1, non_change:4 },
                  { wk:'W5', change_rel:0, non_change:3 }, { wk:'W6', change_rel:2, non_change:2 },
                  { wk:'W7', change_rel:1, non_change:3 }, { wk:'W8', change_rel:1, non_change:2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="change_rel"  name={tt('Change-related')} fill={AMBER} radius={[2,2,0,0]} stackId="a" />
                  <Bar dataKey="non_change"  name={tt('Non-change')}     fill={BLUE}  radius={[2,2,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <Link to="/portal/incidents"   className="text-vfes-dark hover:underline">{tt('All Incidents →')}</Link>
              <Link to="/portal/coo"         className="text-vfes-dark hover:underline">{tt('COO Dashboard →')}</Link>
              <Link to="/portal/cto"         className="text-vfes-dark hover:underline">{tt('CTO Dashboard →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between mt-6">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Assurance navigation')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Full NOC operations, on-call, war-room escalation and AI-powered fault-to-fix in one view.')}
            </div>
          </div>
          <Link to="/portal/noc-map" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <Activity className="w-4 h-4" />{tt('Open NOC Map →')}
          </Link>
        </div>
      </>)}

      {/* ═══════════════ INCIDENT THREAD ══════════════════════════════════ */}
      {tab === 'thread' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTA (live)')}          value={`${NET_FACTS.mttaMin} min`} delta={tt('-22% YoY')}                trend="up"   icon={Clock}        accent />
          <KpiCard label={tt('MTTR (live)')}           value={`${NET_FACTS.mttrMin} min`} delta={tt('-12 min YoY')}             trend="up"   icon={Wrench}             />
          <KpiCard label={tt('Alarm-to-root-cause')}  value="7 sec"                       delta={tt('AI correlation')}          trend="up"   icon={Brain}              />
          <KpiCard label={tt('False-correlate rate')}  value="0.6%"                        delta={tt('human gate on P1')}        trend="up"   icon={ShieldCheck}        />
        </div>

        <Panel title={tt('Live incident — stitched alarm → resolution thread')}>
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-black/10" />
            {THREAD.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="relative mb-4">
                  <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center">
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-sm">{tt(s.stage)}</span>
                    <span className="font-mono text-[11px] text-vfes-dark/50">{s.t}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{s.owner}</span>
                  </div>
                  <div className="text-xs text-vfes-dark/70 mt-0.5">{tt(s.detail)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('End-to-end MTTR 58 min — AI correlation cut triage from 22 min to 7 sec.')} <ChevronRight className="w-3 h-3" />
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Alarm frequency — 30 days')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={ALARM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p3" name="P3" stackId="a" fill={BLUE}  />
                  <Bar dataKey="p2" name="P2" stackId="a" fill={AMBER} />
                  <Bar dataKey="p1" name="P1" stackId="a" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('MTTR trend — 12 months (min)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={MTTR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="m" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="m" domain={[0, 10]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="mttr" name={tt('MTTR')} fill={NAVY}  radius={[4,4,0,0]} />
                  <Line yAxisId="r" type="monotone" dataKey="mtta" name={tt('MTTA')} stroke={BLUE} strokeWidth={2} dot={false} />
                  <ReferenceLine yAxisId="l" y={40} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <Link to="/portal/war-room"  className="text-vfes-dark hover:underline">{tt('Open War Room →')}</Link>
          <Link to="/portal/incidents" className="text-vfes-dark hover:underline">{tt('Incidents Dashboard →')}</Link>
          <Link to="/portal/noc-map"   className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('MTTD vs MTTR — on-call team comparison')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { team: 'RAN ops',       mttd: 8,  mttr: 48 },
                  { team: 'Core ops',      mttd: 5,  mttr: 38 },
                  { team: 'Transport ops', mttd: 12, mttr: 62 },
                  { team: 'PON / fixed',   mttd: 15, mttr: 72 },
                  { team: 'NOC bridge',    mttd: 3,  mttr: 28 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mttd" name={tt('MTTD (min)')} fill={BLUE}  radius={[4,4,0,0]} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} fill={NAVY}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/field-ops"   className="text-vfes-dark hover:underline">{tt('Field Operations →')}</Link>
              <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ FAULT / ALARMS ════════════════════════════════════ */}
      {tab === 'alarms' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open alarms')}            value="295"    delta={tt('5 categories')}               trend="down" icon={Bell}         accent />
          <KpiCard label={tt('Correlation rate')}       value="97.2%"  delta={tt('AI-driven reduction')}        trend="up"   icon={Brain}              />
          <KpiCard label={tt('Auto-tickets opened')}    value="41"     delta={tt('of 295 alarms')}              trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Noise suppressed')}       value="254"    delta={tt('not escalated to NOC')}       trend="up"   icon={TrendingDown}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {['All', ...ALARM_CATEGORIES.map(a => a.cat)].map(c => (
            <button key={c} onClick={() => setAlarmCat(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${alarmCat === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Alarm volume by category — correlated vs raw')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredAlarms}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cat" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count"      name={tt('Raw alarms')}    fill={SLATE} radius={[2,2,0,0]} />
                  <Bar dataKey="correlated" name={tt('Correlated %')}  fill={GREEN} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Alarm trend — 30 days')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={ALARM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="total" name={tt('Total alarms')} stroke={NAVY} fill={NAVY} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="p1"    name="P1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Alarm category breakdown')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Category')}</th>
                  <th className="text-right">{tt('Raw count')}</th>
                  <th className="text-right">{tt('Correlation rate')}</th>
                  <th className="text-right">{tt('Noise suppressed')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlarms.map(a => (
                  <tr key={a.cat} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(a.cat)}</td>
                    <td className="text-right font-mono">{a.count}</td>
                    <td className={`text-right font-bold ${a.correlated >= 80 ? 'text-emerald-600' : a.correlated >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{a.correlated}%</td>
                    <td className="text-right text-vfes-dark/55">{Math.round(a.count * (1 - a.correlated / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/network"    className="text-vfes-dark hover:underline">{tt('Network Health →')}</Link>
            <Link to="/portal/core-5g"    className="text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <Link to="/portal/mobile-ran" className="text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          </div>
      <div className="mt-4 flex gap-4 text-xs font-semibold">
            <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            <Link to="/portal/contact-center"   className="text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
            <Link to="/portal/customer-360"     className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            <Link to="/portal/fraud"            className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            <Link to="/portal/coo"              className="text-vfes-dark hover:underline">{tt('COO →')}</Link>
            <Link to="/portal/ai-insights"      className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════════════ SLA / CIM ═════════════════════════════════════════ */}
      {tab === 'sla' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total CIM (month)')}       value={totalCIM.toLocaleString('en-BS')} delta={tt('-18% with auto-dispatch')} trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Mobile CIM')}              value="8,420"                            delta={tt('largest service')}         trend="down" icon={Radio}              />
          <KpiCard label={tt('B2B credit exposure')}     value={`BSD ${NET_FACTS.slaCreditExposureK}K`} delta={tt('MTD — 2 SLAs breached')}  trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Fixed broadband CIM')}     value="5,180"                            delta="-6% vs prior month"            trend="up"   icon={Network}            />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Customer-impacting minutes by service')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CIM_BY_SERVICE} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="svc" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={TS} formatter={(v: number, _n: any, p: any) => [`${v.toLocaleString('en-BS')} min · BSD ${p.payload.creditK}K credit`, tt('CIM')]} />
                  <Bar dataKey="cim" radius={[0,4,4,0]}>
                    {CIM_BY_SERVICE.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('B2B credit exposure is disproportionate to its CIM — protect enterprise SLAs first.')}</div>
          </Panel>
            <Panel title={tt('SLA credit exposure by service (BSD K)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={CIM_BY_SERVICE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="svc" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="K" />
                    <Tooltip contentStyle={TS} formatter={(v: number) => [`BSD ${v}K`, tt('Credit exposure')]} />
                    <Bar dataKey="creditK" name={tt('Credit BSD K')} radius={[4,4,0,0]}>
                      {CIM_BY_SERVICE.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('SLA service breakdown — full scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Service')}</th>
                      <th className="text-right">{tt('CIM (min)')}</th>
                      <th className="text-right">{tt('Credit (BSD K)')}</th>
                      <th>{tt('Priority')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CIM_BY_SERVICE.map(c => (
                      <tr key={c.svc} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold">{tt(c.svc)}</td>
                        <td className="text-right font-mono">{c.cim.toLocaleString('en-BS')}</td>
                        <td className={`text-right font-bold ${c.creditK >= 40 ? 'text-red-600' : c.creditK >= 20 ? 'text-amber-600' : 'text-emerald-600'}`}>BSD {c.creditK}K</td>
                        <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.creditK >= 40 ? 'bg-red-100 text-red-700' : c.creditK >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.creditK >= 40 ? tt('Critical') : c.creditK >= 20 ? tt('Watch') : tt('OK')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-4 text-xs font-semibold">
                <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
                <Link to="/portal/contact-center"   className="text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
                <Link to="/portal/customer-360"     className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
              </div>
            </Panel>
          <Panel title={tt('MTTA / MTTR — 12 months')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={MTTR_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v.toFixed(1)} min`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mttr" stroke={NAVY} strokeWidth={2.5} name={tt('MTTR')} />
                  <Line type="monotone" dataKey="mtta" stroke={BLUE} strokeWidth={2.5} name={tt('MTTA')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('CIM by region')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={CIM_REGION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cim"  name={tt('CIM (min)')}      fill={NAVY} radius={[4,4,0,0]} />
                <Bar dataKey="subs" name={tt('Impacted subs')}  fill={BLUE} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/noc-map"    className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            <Link to="/portal/operations" className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/customer-360" className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════════════ SLO BURN ═════════════════════════════════════════ */}
      {tab === 'slo' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Services monitored')}   value="6"      delta={tt('SLO windows active')}   trend="flat" icon={ShieldCheck}  accent />
          <KpiCard label={tt('SLO breached')}         value="1"      delta={tt('B2B MPLS VPN')}         trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('At-risk services')}     value="2"      delta={tt('burn rate > 20%')}      trend="down" icon={TrendingDown}       />
          <KpiCard label={tt('Healthy services')}     value="3"      delta={tt('green · low burn')}     trend="up"   icon={CheckCircle2}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['burn', 'actual'] as const).map(k => (
            <button key={k} onClick={() => setSloBurnSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sloBurnSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'burn' ? tt('SLO burn rate') : tt('Actual availability')}
            </button>
          ))}
        </div>

        <Panel title={tt('SLO status — all services')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Service')}</th>
                  <th className="text-right">{tt('Target %')}</th>
                  <th className="text-right">{tt('Actual %')}</th>
                  <th className="text-right">{tt('Burn rate %')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedSLO.map(s => (
                  <tr key={s.service} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(s.service)}</td>
                    <td className="text-right font-mono text-xs">{s.target}%</td>
                    <td className={`text-right font-bold ${s.actual >= s.target ? 'text-emerald-600' : 'text-red-600'}`}>{s.actual}%</td>
                    <td className={`text-right font-bold ${s.burn >= 50 ? 'text-red-600' : s.burn >= 20 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.burn}%</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragC(s.status)}`}>{tt(s.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('B2B MPLS VPN 68% budget burned — escalation active. PRB-0092 workaround holding.')}</div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Weekly SLO burn rate by service (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={SLO_BURN_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="b2b"    name={tt('B2B MPLS')}  stroke="#dc2626" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="fixed"  name={tt('Fixed BB')}  stroke={AMBER}   strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="mobile" name={tt('Mobile')}    stroke={BLUE}    strokeWidth={2}   dot={false} />
                  <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"  className="text-vfes-dark hover:underline">{tt('Assurance Overview →')}</Link>
              <Link to="/portal/operations" className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ OPEN TICKETS ══════════════════════════════════════ */}
      {tab === 'tickets' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open tickets')}      value="6"    delta={tt('1 P1 · 3 P2 · 2 P3')}    trend="down" icon={Siren}        accent />
          <KpiCard label={tt('SLA breached')}      value="1"    delta="TT-44871 B2B Abaco"         trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('SLA at-risk')}       value="2"    delta="TT-44885 · TT-44811"           trend="down" icon={Clock}              />
          <KpiCard label={tt('On-track')}          value="3"    delta={tt('within SLA window')}       trend="up"   icon={CheckCircle2}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter severity:')}</span>
          {['All', 'P1', 'P2', 'P3'].map(s => (
            <button key={s} onClick={() => setTicketSev(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${ticketSev === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {s}
            </button>
          ))}
        </div>

        <Panel title={tt('Open trouble tickets — SLA & impact')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Ticket')}</th>
                  <th className="px-3 py-2">{tt('Severity')}</th>
                  <th className="px-3 py-2">{tt('Service')}</th>
                  <th className="px-3 py-2">{tt('Region')}</th>
                  <th className="px-3 py-2 text-right">{tt('Age')}</th>
                  <th className="px-3 py-2 text-right">{tt('Impacted subs')}</th>
                  <th className="px-3 py-2">{tt('SLA')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs">{t.id}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevC(t.sev)}`}>{t.sev}</span></td>
                    <td className="px-3 py-2">{t.svc}</td>
                    <td className="px-3 py-2">{t.region}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.age}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.cim.toLocaleString('en-BS')}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${slaC(t.sla)}`}>{tt(t.sla)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('TT-44871 breached B2B SLA — escalate now to cap credit exposure.')} <ChevronRight className="w-3 h-3" />
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('CIM by impacted service (open tickets)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CIM_BY_SERVICE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="svc" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cim" name={tt('CIM (min)')} radius={[4,4,0,0]}>
                    {CIM_BY_SERVICE.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/field-ops"    className="text-vfes-dark hover:underline">{tt('Field Operations →')}</Link>
              <Link to="/portal/contact-center" className="text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
            </div>
          </Panel>
          <Panel title={tt('Ticket age distribution — open')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { bucket: '< 30m', count: 2 },
                  { bucket: '30m–2h', count: 2 },
                  { bucket: '2h–6h', count: 1 },
                  { bucket: '> 6h',  count: 1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Tickets')} fill={NAVY} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ PROACTIVE ASSURANCE ══════════════════════════════ */}
      {tab === 'proactive' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Proactive actions (MTD)')}  value="14"     delta={tt('97K CIM prevented')}    trend="up"   icon={Zap}         accent />
          <KpiCard label={tt('Actioned')}                 value="9"      delta={tt('of 14')}                trend="up"   icon={CheckCircle2}      />
          <KpiCard label={tt('Pending')}                  value="3"      delta={tt('field dispatch / core')} trend="flat" icon={Clock}             />
          <KpiCard label={tt('Avg prevention saving')}    value="12K"    delta={tt('CIM per action')}        trend="up"   icon={TrendingUp}        />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'Actioned', 'Pending', 'Resolved'].map(s => (
            <button key={s} onClick={() => setProactiveFilter(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${proactiveFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>

        <Panel title={tt('Proactive assurance actions')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Target')}</th>
                  <th>{tt('Risk')}</th>
                  <th>{tt('Action')}</th>
                  <th className="text-right">{tt('CIM saved')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProactive.map(p => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{p.id}</td>
                    <td className="text-xs">{tt(p.type)}</td>
                    <td className="font-mono text-xs">{p.target}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(p.risk === 'High' ? 'Red' : p.risk === 'Med' ? 'Amber' : 'Green')}`}>{tt(p.risk)}</span></td>
                    <td className="text-xs max-w-[240px] text-vfes-dark/70">{tt(p.action)}</td>
                    <td className="text-right font-bold text-emerald-600">{(p.saving * 1000).toLocaleString('en-BS')}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.status === 'Actioned' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{tt(p.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Proactive vs reactive — 6 months')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={PROACTIVE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="prevented" name={tt('Proactive')} stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="reactive"  name={tt('Reactive')}  stroke={NAVY}  fill={NAVY}  fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/ai-insights"  className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
              <Link to="/portal/network"      className="text-vfes-dark hover:underline">{tt('Network Health →')}</Link>
              <Link to="/portal/capacity-capex" className="text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            </div>
          </Panel>
          <Panel title={tt('CIM savings by proactive type')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={PROACTIVE_ACTIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="saving" name={tt('CIM × 1000 saved')} fill={GREEN} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ PROBLEM MANAGEMENT ══════════════════════════════ */}
      {tab === 'problems' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Known problems')}       value="4"       delta={tt('1 P2 breached workaround')} trend="down" icon={Wrench}       accent />
          <KpiCard label={tt('Root causes found')}    value="4/4"     delta={tt('all under remediation')}    trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Carrying CIM')}         value="4,190"   delta={tt('across 4 problems')}        trend="down" icon={Activity}           />
          <KpiCard label={tt('Avg days to fix')}      value="34 d"    delta={tt('estimate across board')}    trend="flat" icon={Clock}              />
        </div>

        <Panel title={tt('Known problem register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Problem ID')}</th>
                  <th>{tt('Sev')}</th>
                  <th>{tt('Title')}</th>
                  <th className="text-right">{tt('CIM')}</th>
                  <th>{tt('Workaround')}</th>
                  <th>{tt('Root cause')}</th>
                  <th>{tt('Fix ETA')}</th>
                </tr>
              </thead>
              <tbody>
                {KNOWN_PROBLEMS.map(p => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{p.id}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${sevC(p.sev)}`}>{p.sev}</span></td>
                    <td className="text-xs font-semibold max-w-[220px]">{tt(p.title)}</td>
                    <td className="text-right font-mono text-xs">{p.cim.toLocaleString('en-BS')}</td>
                    <td className="text-xs text-vfes-dark/65 max-w-[180px]">{tt(p.workaround)}</td>
                    <td className="text-xs text-vfes-dark/65 max-w-[180px]">{tt(p.rootCause)}</td>
                    <td className="font-mono text-xs">{p.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/incidents"  className="text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
            <Link to="/portal/operations" className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/core-5g"    className="text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <Link to="/portal/network"    className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Problem CIM by category')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={KNOWN_PROBLEMS} dataKey="cim" nameKey="id" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {KNOWN_PROBLEMS.map((_, i) => <Cell key={i} fill={[NAVY, BLUE, AMBER, GREEN][i % 4]} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString('en-BS') + ' min', '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Days to fix estimate by problem')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={KNOWN_PROBLEMS.map(p => ({ id: p.id, days: Math.round((new Date(p.eta).getTime() - Date.now()) / 86_400_000) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="days" name={tt('Days to ETA')} fill={AMBER} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ─── source attribution ──────────────────────────────────────────── */}
      <div className="mt-8 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Activity className="w-3 h-3" /> {tt('Source: NOC alarm stream · ITSM ServiceNow · FieldForce WFM · SLO registry · Snowflake Cortex AI')}
      </div>
    </div>
  )
}
