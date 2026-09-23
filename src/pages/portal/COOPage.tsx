import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import tt from '../../i18n/tt'
import KPI from './_kpi_facts'
import NET from './_network_facts'
import {
  Activity, Globe2, Network, HardHat, Workflow, ClipboardList, Gauge, Siren,
  Clock, ShieldCheck, Wrench, TrendingUp, TrendingDown, Bell, Target,
  AlertTriangle, CheckCircle, Zap, Users,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

// ─── palette ────────────────────────────────────────────────────────────────
const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const GREY   = '#94a3b8'
const RED_SV = '#EF4444'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── service-health data ─────────────────────────────────────────────────────
const slaByService = [
  { service: 'Broadband (residential)', sla: 99.95, actual: 99.94, cim: 21,  mttr: 84, rag: 'Amber'  },
  { service: 'Business Fibre (B2B)',    sla: 99.99, actual: 99.97, cim: 8,   mttr: 62, rag: 'Amber'  },
  { service: 'Mobile voice',           sla: 99.90, actual: 99.94, cim: 12,  mttr: 48, rag: 'Green'  },
  { service: 'Mobile data (LTE/5G)',    sla: 99.85, actual: 99.91, cim: 14,  mttr: 52, rag: 'Green'  },
  { service: 'DOCSIS TV',              sla: 99.90, actual: 99.88, cim: 18,  mttr: 96, rag: 'Red'    },
  { service: 'B2B MPLS / SD-WAN',      sla: 99.99, actual: 99.96, cim: 6,   mttr: 38, rag: 'Amber'  },
]

const npsTrend = [
  { q: 'Q3-24', nps: 32 },
  { q: 'Q4-24', nps: 34 },
  { q: 'Q1-25', nps: 35 },
  { q: 'Q2-25', nps: 36 },
  { q: 'Q3-25', nps: 36 },
  { q: 'Q4-25', nps: 37 },
  { q: 'Q1-26', nps: 38 },
  { q: 'Q2-26', nps: KPI.nps },
]

const csatTrend = [
  { q: 'Q3-24', csat: 74.2 },
  { q: 'Q4-24', csat: 75.8 },
  { q: 'Q1-25', csat: 76.4 },
  { q: 'Q2-25', csat: 77.2 },
  { q: 'Q3-25', csat: 77.6 },
  { q: 'Q4-25', csat: 78.4 },
  { q: 'Q1-26', nps: 79.2 },
  { q: 'Q2-26', csat: 79.8 },
]

// ─── network-ops data ────────────────────────────────────────────────────────
const cimByRegion = [
  { region: 'Freeport', cim: 38, target: 20 },
  { region: 'Nassau',    cim: 21, target: 20 },
  { region: 'Abaco',  cim: 14, target: 15 },
  { region: 'Eleuthera',   cim: 11, target: 15 },
  { region: 'Bimini',    cim:  7, target: 15 },
  { region: 'Long Island',  cim:  5, target: 15 },
]

const alarmVolumes = [
  { day: 'Mon', p1: 2,  p2:  8, p3: 24 },
  { day: 'Tue', p1: 1,  p2:  6, p3: 18 },
  { day: 'Wed', p1: 3,  p2:  9, p3: 28 },
  { day: 'Thu', p1: 2,  p2:  7, p3: 22 },
  { day: 'Fri', p1: 2,  p2: 11, p3: 32 },
  { day: 'Sat', p1: 1,  p2:  5, p3: 14 },
  { day: 'Sun', p1: 1,  p2:  4, p3: 12 },
]

const uptimeTrend = [
  { w: 'W1', bb: 99.96, mobile: 99.94, core: 99.99 },
  { w: 'W2', bb: 99.95, mobile: 99.93, core: 99.99 },
  { w: 'W3', bb: 99.94, mobile: 99.92, core: 99.98 },
  { w: 'W4', bb: 99.95, mobile: 99.94, core: 99.99 },
  { w: 'W5', bb: 99.97, mobile: 99.95, core: 99.99 },
  { w: 'W6', bb: 99.93, mobile: 99.91, core: 99.97 },  // INC-2031 week
  { w: 'W7', bb: 99.95, mobile: 99.93, core: 99.99 },
  { w: 'W8', bb: 99.96, mobile: 99.94, core: 99.99 },
]

// ─── field & provisioning data ────────────────────────────────────────────────
const ftfTrend = [
  { m: 'Nov', ftf: 79.2, target: 85 },
  { m: 'Dec', ftf: 80.4, target: 85 },
  { m: 'Jan', ftf: 81.8, target: 85 },
  { m: 'Feb', ftf: 82.6, target: 85 },
  { m: 'Mar', ftf: 83.4, target: 85 },
  { m: 'Apr', ftf: 84.2, target: 85 },
  { m: 'May', ftf: 84.8, target: 85 },
  { m: 'Jun', ftf: 85.2, target: 85 },
]

const jobsByType = [
  { type: 'New install (BB)',  completed: 1842, pending: 284, ftf: 88.4, cycleDay: 4.2 },
  { type: 'New install (Mob)', completed:  642, pending:  86, ftf: 94.2, cycleDay: 1.4 },
  { type: 'Repair (BB)',       completed: 2164, pending: 421, ftf: 81.6, cycleDay: 2.8 },
  { type: 'Repair (Mob)',      completed:  844, pending: 148, ftf: 86.4, cycleDay: 1.8 },
  { type: 'Upgrade (speed)',   completed:  982, pending: 162, ftf: 91.2, cycleDay: 3.6 },
  { type: 'CPE replacement',   completed: 3284, pending: 484, ftf: 78.4, cycleDay: 2.2 },
]

const orderFallout = [
  { m: 'Jan', residential: 4.8, b2b: 7.2, target: 4.0 },
  { m: 'Feb', residential: 4.6, b2b: 6.8, target: 4.0 },
  { m: 'Mar', residential: 4.4, b2b: 6.4, target: 4.0 },
  { m: 'Apr', residential: 4.2, b2b: 6.2, target: 4.0 },
  { m: 'May', residential: 4.0, b2b: 5.8, target: 4.0 },
  { m: 'Jun', residential: 3.8, b2b: 5.4, target: 4.0 },
]

// ─── capacity data ───────────────────────────────────────────────────────────
const capacityNodes = [
  { node: 'Core · Freeport',  util: 84, threshold: 85, color: AMBER  },
  { node: 'Core · Nassau',     util: 78, threshold: 85, color: GREEN  },
  { node: 'DOCSIS · Rural Out Islands',  util: 91, threshold: 85, color: RED_SV },  // above threshold
  { node: 'DOCSIS · North',    util: 76, threshold: 85, color: GREEN  },
  { node: 'FTTH · South Ring', util: 62, threshold: 85, color: GREEN  },
  { node: 'Mobile · 700 MHz',  util: 88, threshold: 85, color: RED_SV },  // above threshold
  { node: 'Transport · 400G',  util: 72, threshold: 85, color: GREEN  },
  { node: 'OLT · Nassau West', util: 68, threshold: 85, color: GREEN  },
]

const headroomQtly = [
  { q: 'Q3-24', core: 28, docsis: 18, mobile: 24 },
  { q: 'Q4-24', core: 26, docsis: 16, mobile: 22 },
  { q: 'Q1-25', core: 25, docsis: 14, mobile: 20 },
  { q: 'Q2-25', core: 23, docsis: 12, mobile: 18 },
  { q: 'Q3-25', core: 21, docsis: 10, mobile: 16 },
  { q: 'Q4-25', core: 20, docsis:  9, mobile: 14 },
  { q: 'Q1-26', core: 18, docsis:  8, mobile: 12 },
  { q: 'Q2-26', core: 16, docsis:  9, mobile: 12 },
]

// ─── incident / SLA data ──────────────────────────────────────────────────────
const incidentTrend = [
  { m: 'Jan', p1: 4, p2: 12, p3: 38 },
  { m: 'Feb', p1: 3, p2: 10, p3: 32 },
  { m: 'Mar', p1: 5, p2: 14, p3: 42 },
  { m: 'Apr', p1: 3, p2: 11, p3: 36 },
  { m: 'May', p1: 2, p2:  9, p3: 28 },
  { m: 'Jun', p1: 2, p2:  8, p3: 24 },
]

const slaCreditExposure = [
  { service: 'B2B Fibre',         exposure: 142, prob: 'High',   credits: 'BSD 86K',  rag: 'Red'   },
  { service: 'Broadband',         exposure:  82, prob: 'Medium', credits: 'BSD 24K',  rag: 'Amber' },
  { service: 'DOCSIS TV',         exposure:  64, prob: 'Medium', credits: 'BSD 18K',  rag: 'Amber' },
  { service: 'Mobile',            exposure:  36, prob: 'Low',    credits: 'BSD 12K',  rag: 'Green' },
]

const pirLog = [
  { inc: 'INC-2031', date: '28 Jun 26', service: 'Transport ring · Freeport', impact: '38K CIM', mttr: 184, root: 'Degraded WDM transponder', pir: 'Pending'  },
  { inc: 'INC-2018', date: '14 Jun 26', service: '5G Core AMF · national',     impact: '12K CIM', mttr:  92, root: 'AMF SW bug · vendor patch', pir: 'Complete' },
  { inc: 'INC-1994', date: '22 May 26', service: 'DOCSIS · Rural Out Islands',           impact: '8K CIM',  mttr: 124, root: 'CMTS fan failure · overtemp', pir: 'Complete' },
  { inc: 'INC-1976', date: '8 May 26',  service: 'Broadband · Nassau North',   impact: '6K CIM',  mttr:  68, root: 'Fibre cut · contractor dig',  pir: 'Complete' },
  { inc: 'INC-1958', date: '21 Apr 26', service: 'Mobile · 700 MHz Freeport',        impact: '4K CIM',  mttr:  44, root: 'Backhaul congestion · peak',  pir: 'Complete' },
]

// ─── productivity data ────────────────────────────────────────────────────────
const automationRates = [
  { area: 'Alarm triage & correlation',  rate: 86, target: 90, delta: +4  },
  { area: 'Change mgmt (standard)',      rate: 72, target: 80, delta: +8  },
  { area: 'Incident auto-routing',       rate: 78, target: 85, delta: +7  },
  { area: 'Performance threshold alerts',rate: 94, target: 95, delta: +1  },
  { area: 'Field dispatch optimisation', rate: 62, target: 75, delta: +13 },
  { area: 'SLA breach prediction',       rate: 68, target: 80, delta: +12 },
  { area: 'RFO / post-incident draft',   rate: 44, target: 70, delta: +26 },
]

const teamUtil = [
  { team: 'NOC · Central',      headcount:  48, util: 88, rag: 'Green' },
  { team: 'Field Freeport',    headcount: 124, util: 94, rag: 'Amber' },
  { team: 'Field Nassau',       headcount: 108, util: 86, rag: 'Green' },
  { team: 'Field Rural Out Islands',      headcount:  84, util: 96, rag: 'Red'   },
  { team: 'Order Mgmt',         headcount:  36, util: 82, rag: 'Green' },
  { team: 'Service Assurance',  headcount:  28, util: 78, rag: 'Green' },
]

const changeSuccessRate = [
  { m: 'Jan', success: 94.2, failed: 5.8 },
  { m: 'Feb', success: 94.8, failed: 5.2 },
  { m: 'Mar', success: 95.4, failed: 4.6 },
  { m: 'Apr', success: 95.8, failed: 4.2 },
  { m: 'May', success: 96.2, failed: 3.8 },
  { m: 'Jun', success: 96.6, failed: 3.4 },
]

// ─── vendor & SLA data ─────────────────────────────────────────────────────
const vendorContracts = [
  { vendor: 'Ericsson',   domain: 'RAN / 5G SA',      value: 'BSD 42M', renewal: 'Q4-27', slaUptime: 99.95, actual: 99.94, nps: 72, rag: 'Amber' },
  { vendor: 'Nokia',      domain: 'Transport / IP',   value: 'BSD 28M', renewal: 'Q2-27', slaUptime: 99.99, actual: 99.99, nps: 68, rag: 'Green' },
  { vendor: 'Cisco',      domain: 'DOCSIS / CMTS',    value: 'BSD 18M', renewal: 'Q1-26', slaUptime: 99.90, actual: 99.87, nps: 54, rag: 'Red'   },
  { vendor: 'Huawei',     domain: 'RAN legacy',       value: 'BSD 12M', renewal: 'Q3-27', slaUptime: 99.90, actual: 99.92, nps: 60, rag: 'Green' },
  { vendor: 'Cerillion',  domain: 'BSS / Billing',    value: 'BSD 8M',  renewal: 'Q2-28', slaUptime: 99.95, actual: 99.94, nps: 62, rag: 'Amber' },
  { vendor: 'ServiceNow', domain: 'ITSM / Platform',  value: 'BSD 4M',  renewal: 'Q4-27', slaUptime: 99.99, actual: 99.99, nps: 76, rag: 'Green' },
]

const vendorNpsTrend = [
  { m: 'Jan', ericsson: 74, nokia: 70, cisco: 58, cerillion: 64 },
  { m: 'Feb', ericsson: 74, nokia: 71, cisco: 56, cerillion: 62 },
  { m: 'Mar', ericsson: 75, nokia: 72, cisco: 55, cerillion: 64 },
  { m: 'Apr', ericsson: 75, nokia: 70, cisco: 56, cerillion: 66 },
  { m: 'May', ericsson: 76, nokia: 71, cisco: 55, cerillion: 64 },
  { m: 'Jun', ericsson: 72, nokia: 68, cisco: 54, cerillion: 62 },
]

const vendorCreditPenalty = [
  { vendor: 'Cisco',      penalty: 84, cap: 200, pct: 42 },
  { vendor: 'Ericsson',   penalty: 24, cap: 180, pct: 13 },
  { vendor: 'Cerillion',  penalty: 12, cap:  60, pct: 20 },
  { vendor: 'Nokia',      penalty:  0, cap: 120, pct:  0 },
  { vendor: 'ServiceNow', penalty:  0, cap:  40, pct:  0 },
]

// ─── tabs ────────────────────────────────────────────────────────────────────
// 8 tabs: overview · service health · network ops · field/prov · capacity · incidents · productivity · vendors
type COOTabId = 'overview' | 'svchealth' | 'netops' | 'fieldprov' | 'capacity' | 'incidents' | 'productivity' | 'vendors'

const COO_TABS: { id: COOTabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',     label: 'Overview',             icon: Activity    },
  { id: 'svchealth',    label: 'Service Health',       icon: ShieldCheck },
  { id: 'netops',       label: 'Network Ops',          icon: Network     },
  { id: 'fieldprov',    label: 'Field & Provisioning', icon: HardHat     },
  { id: 'capacity',     label: 'Capacity',             icon: Gauge       },
  { id: 'incidents',    label: 'Incidents / SLA',      icon: Siren       },
  { id: 'productivity', label: 'Productivity',         icon: TrendingUp  },
  { id: 'vendors',      label: 'Vendors & SLAs',    icon: ClipboardList },
]

const ragColor    = (r: string) => r === 'Green' || r === 'Pass'  ? 'bg-emerald-100 text-emerald-700' : r === 'Amber'  ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const probColor   = (p: string) => p === 'High'                    ? 'bg-red-100 text-red-700'         : p === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'

// ─── component ───────────────────────────────────────────────────────────────
export default function COOPage() {
  const [tab, setTab]                         = useState<COOTabId>('overview')
  const [showAutomationGap, setShowAutomationGap] = useState(false)

  const totalCim         = useMemo(() => cimByRegion.reduce((s, r) => s + r.cim, 0), [])
  const nodesAtRisk      = useMemo(() => capacityNodes.filter(n => n.util >= n.threshold).length, [])
  const automationAvg    = useMemo(() => Math.round(automationRates.reduce((s, a) => s + a.rate, 0) / automationRates.length), [])
  const pirPending       = useMemo(() => pirLog.filter(p => p.pir === 'Pending').length, [])
  const teamOverUtil     = useMemo(() => teamUtil.filter(t => t.util > 92).length, [])
  const capacityHeadroom = useMemo(() => Math.round(capacityNodes.reduce((s, n) => s + (100 - n.util), 0) / capacityNodes.length), [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [tab])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Operating Officer')}
        subtitle={tt('Office of the COO · Sofie Knowles · live operational view · refreshed 4 min ago')}
        actions={
          <Link to="/portal/war-room" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
            <Siren className="w-4 h-4" /> {tt('Open War Room')}
          </Link>
        }
      />

      {/* live incident banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-900 text-sm">{tt('INC-2031 ACTIVE · Freeport transport ring degraded · crew dispatched · SLA credit exposure BSD 142K')}</div>
            <div className="text-xs text-red-800 mt-1">
              {tt('412 alarms correlated to single WDM transponder failure ·')}
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('38K CIM this month')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('ETA restore 14:45')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('P1 SLA window closes 16:00')}</span>
            </div>
          </div>
          <Link to="/portal/noc-map" className="text-xs font-bold text-red-900 hover:underline shrink-0">{tt('NOC Map →')}</Link>
        </div>
      </div>

      {/* tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit flex-wrap">
        {COO_TABS.map((t) => {
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

      {/* ═══════ OVERVIEW ═══════ */}
      {tab === 'overview' && (<>
        <MlInsightSection
          heading="Incident intelligence"
          models={[
            { name: 'Incident Triage Classifier', metric: 'F1 0.93',    sub: 'auto-routes P1/P2/P3' },
            { name: 'MTTR Predictor',             metric: 'MAE 11 min', sub: 'time-to-restore estimate' },
            { name: 'Field-dispatch Optimiser',   metric: '−18% miles', sub: 'route + skills match' },
          ]}
          agentLabel={tt('Run Ops Briefing')} agentRunningLabel={tt('Triaging…')}
          agentSteps={[
            tt('Correlated alarms across NOC, RAN and transport'),
            tt('Predicted MTTR and customer-impacting minutes'),
            tt('Matched the highest-priority job to nearest skilled crew'),
            tt('Drafted the customer + regulator comms'),
          ]}
          agentBlurb={tt('Alarm correlation across one platform collapses the noise — operators see the single root cause, not 400 downstream symptoms.')}
          decision={{
            title: tt('Dispatch crew to INC-2031 (Freeport transport ring)'),
            detail: tt('The triage model links 412 alarms to a single degraded transport segment. Dispatching the Freeport crew now restores the ring before the SLA window breaches and prevents ~38K customer-impacting minutes.'),
            impact: tt('avoids SLA credits ~BSD 142K · CIM −38K'),
            risk:   tt('second crew on standby — weather window closes 14:00'),
            linkTo: '#/portal/noc-map', linkLabel: tt('Open National NOC Map'),
          }}
          chart={{
            kind: 'bar', title: tt('Customer-impacting minutes by region (this month, k)'), xKey: 'region', unit: 'k',
            data: cimByRegion,
            series: [{ key: 'cim', name: tt('CIM (k)'), color: '#EF4444' }],
            colorBy: { key: 'cim', high: 30, mid: 12 },
            note: tt('Freeport dominates — driven by INC-2031 on the metro transport ring.'),
          }}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <KpiCard label={tt('Uptime (30d)')}         value={`${NET.coreUptimePct}%`}          delta="SLA 99.95% met"    trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Open P1 incidents')}    value="2"                                 delta="−1 vs yesterday"   trend="up"   icon={Siren}       />
          <KpiCard label={tt('MTTA')}                 value={`${NET.mttaMin} min`}              delta="target ≤ 5 min"    trend="up"   icon={Clock}       />
          <KpiCard label={tt('MTTR (P1)')}            value={`${NET.mttrMin} min`}              delta="−12 min QoQ"       trend="up"   icon={Wrench}      />
          <KpiCard label={tt('SLA credit exposure')}  value={`BSD ${NET.slaCreditExposureK}K`}     delta="this month"        trend="down" icon={ShieldCheck} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('NPS')}                  value={String(KPI.nps)}                  delta="+2 vs Q2-25"       trend="up"   icon={Target}      />
          <KpiCard label={tt('CIM this month')}       value={`${totalCim}K`}                   delta="target ≤ 80K"      trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('First-time fix')}       value="85.2%"                             delta="just hit target"   trend="up"   icon={CheckCircle} />
          <KpiCard label={tt('Capacity at-risk')}     value={`${nodesAtRisk} nodes`}            delta="above 85% threshold" trend="down" icon={Gauge}     />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('COO domain')}
            links={[
              { to: 'operations',       label: tt('Operations'),              metric: tt('Live incident + change view'),      icon: Activity    },
              { to: 'noc-map',          label: tt('National NOC Map'),        metric: tt('Real-time national topology'),      icon: Globe2      },
              { to: 'assurance',        label: tt('Service Assurance'),       metric: tt('SLA · CIM · MTTR by service'),     icon: Activity    },
              { to: 'network',          label: tt('Network & Engineering'),   metric: `${(NET.activeSites / 1000).toFixed(1)}K ${tt('active sites')}`, icon: Network },
              { to: 'order-provisioning',label: tt('Order & Provisioning'),   metric: tt('Fallout · cycle-time · jeopardy'), icon: Workflow    },
              { to: 'field-ops',        label: tt('Field Operations'),        metric: tt('Crews · jobs · first-time-fix'),   icon: HardHat     },
              { to: 'inventory',        label: tt('Network Inventory & Assets'), metric: tt('Asset register · spares'),      icon: ClipboardList},
              { to: 'capacity-capex',   label: tt('Capacity & CapEx'),        metric: tt('Headroom · build pipeline'),       icon: Gauge       },
              { to: 'incidents',        label: tt('Incidents'),               metric: tt('P1/P2 log · post-incident reviews'), icon: Siren     },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Operational priorities')}
              items={[
                { name: tt('MTTR for P1 < 90 min'),               owner: tt('Network Ops · D. Hayes'),  pct: 64, status: 'at-risk'  },
                { name: tt('AIOps platform rollout (alarm correlation)'), owner: tt('Service Assurance'), pct: 42, status: 'on-track' },
                { name: tt('First-time-fix > 85%'),               owner: tt('Field Operations'),         pct: 78, status: 'on-track' },
                { name: tt('Order fallout < 4%'),                  owner: tt('Provisioning'),             pct: 71, status: 'on-track' },
                { name: tt('Automated failover (DOCSIS)'),         owner: tt('Network Ops'),              pct: 88, status: 'on-track' },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the COO desk')}
            items={[
              { text: tt('INC-2031 Freeport transport ring degraded — crew en route'),  level: 'high'   },
              { text: tt('5G Core AMF p95 latency above target — engineering paged'),       level: 'medium' },
              { text: tt('28 build sites on hold due to planning permit delays'), level: 'medium' },
              { text: tt('Field crew capacity tight in Rural Out Islands through Q3'),               level: 'low'    },
            ]}
          />
        </div>

        <div className="mt-6">
          <AgendaList
            title={tt('COO cadence')}
            items={[
              { what: tt('Daily operations stand-up'),         when: tt('08:30 daily')  },
              { what: tt('Weekly service-assurance review'),   when: tt('Mon 16:00')    },
              { what: tt('Post-incident review — INC-2031'),   when: tt('Thu 4 Jul')    },
              { what: tt('Capex phasing review'),              when: tt('Tue 15 Jul')   },
            ]}
          />
        </div>
      </>)}

      {/* ═══════ SERVICE HEALTH ═══════ */}
      {tab === 'svchealth' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('NPS Q2-26')}            value={String(KPI.nps)}   delta="+2 pts vs Q2-25"   trend="up"   icon={Target}       accent />
          <KpiCard label={tt('CSAT (residential)')}   value="79.8%"             delta="+0.6 pp QoQ"        trend="up"   icon={CheckCircle}  />
          <KpiCard label={tt('SLA compliance avg')}   value="99.92%"            delta="4 of 6 services ✓" trend="up"   icon={ShieldCheck}  />
          <KpiCard label={tt('CIM (month)')}          value={`${totalCim}K`}    delta="target ≤ 80K"       trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTR (avg all services)')}  value="62 min"   delta="target ≤ 60 min"        trend="down" icon={Clock}         />
          <KpiCard label={tt('SLA credit exposure')}      value="BSD 140K"    delta="B2B Fibre dominant"      trend="down" icon={AlertTriangle}  />
          <KpiCard label={tt('Proactive alerts (30d)')}   value="1,284"    delta="+18% vs prior month"     trend="up"   icon={Bell}           />
          <KpiCard label={tt('CSAT (overall)')}           value="79.8%"    delta="+0.6 pp QoQ"             trend="up"   icon={CheckCircle}    />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('NPS & CSAT Trend · Quarterly')} insight={{ insight: 'NPS has reached an all-time high of 38 in Q2 2026, with CSAT improving to 79.8% driven by first-time-fix gains.', action: 'Protect the service delivery improvements driving FTF gains to sustain the NPS trajectory into H2.', impact: 'Continued NPS growth reduces churn risk and lowers cost-to-serve through fewer repeat-contact volumes.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={npsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[28, 44]} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[70, 85]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="nps"  name={tt('NPS')}  stroke={BLUE}  strokeWidth={2.5} dot />
                    <Line yAxisId="r" type="monotone" dataKey="csat" name={tt('CSAT %')} stroke={GREEN} strokeWidth={2} dot strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('NPS at all-time high of 38. CSAT 79.8% improving steadily driven by first-time-fix gains and INC improvements in H2-25.')}</div>
            </Panel>
          </div>

          <Panel title={tt('CIM by Region · This Month (k)')} insight={{ insight: 'Freeport CIM is above target this month, entirely attributable to the INC-2031 transport outage; all other regions are on or below target.', action: 'Accelerate INC-2031 resolution and deploy additional field crew to clear the Freeport CIM backlog within the week.', impact: 'Resolving INC-2031 will bring Freeport back within target and prevent SLA credit exposure from escalating.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={cimByRegion} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="k" />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="cim" name={tt('CIM (k)')} radius={[0, 4, 4, 0]}>
                    {cimByRegion.map((d, i) => (
                      <Cell key={i} fill={d.cim > d.target ? RED_SV : d.cim === d.target ? AMBER : GREEN} />
                    ))}
                  </Bar>
                  <ReferenceLine x={20} stroke={AMBER} strokeDasharray="4 4" label={{ value: tt('target'), position: 'top', fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Freeport above target due to INC-2031. All other regions at or under target.')}</div>
          </Panel>
        </div>

        <Panel title={tt('SLA Performance by Service · Q2 2026')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Service')}</th>
                  <th className="text-right">{tt('SLA target')}</th>
                  <th className="text-right">{tt('Actual')}</th>
                  <th className="text-right">{tt('CIM (k)')}</th>
                  <th className="text-right">{tt('MTTR (min)')}</th>
                  <th>{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {slaByService.map((s) => (
                  <tr key={s.service} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{s.service}</td>
                    <td className="text-right text-xs text-vfes-dark/65">{s.sla}%</td>
                    <td className={`text-right font-bold ${s.actual >= s.sla ? 'text-emerald-600' : 'text-red-600'}`}>{s.actual}%</td>
                    <td className={`text-right ${s.cim > 20 ? 'text-red-600 font-bold' : s.cim > 12 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.cim}</td>
                    <td className="text-right text-xs">{s.mttr}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(s.rag)}`}>{tt(s.rag)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <span>{tt('DOCSIS TV in red — picture degradation events driving CIM. Engineering paged ·')}</span>
            <Link to="/portal/assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Open Service Assurance →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ NETWORK OPS ═══════ */}
      {tab === 'netops' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Core uptime (30d)')}    value={`${NET.coreUptimePct}%`} delta="SLA 99.95% met"       trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Open P1 alarms')}       value="2"                         delta="INC-2031 + AMF tail"  trend="down" icon={Siren}       />
          <KpiCard label={tt('Alarm correlation')}     value="89%"                      delta="target 90% — close"   trend="up"   icon={Zap}         />
          <KpiCard label={tt('Mean alarm → ticket')}  value="4.2 min"                  delta="target ≤ 5 min ✓"    trend="up"   icon={Clock}       />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Network Uptime by Domain · Last 8 Weeks (%)')} insight={{ insight: 'A W6 Core dip to 99.97% caused by INC-2031 is recovering; broadband and mobile are tracking above the 99.95% SLA line in W7-W8.', action: 'Confirm INC-2031 post-incident review is completed and transport ring redundancy paths are validated before Q3 peak.', impact: 'Verified redundancy prevents a repeat outage and protects the uptime SLA credit-free position going into peak season.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={uptimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="w" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[99.88, 100]} tickFormatter={(v: number) => v.toFixed(2)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="bb"     name={tt('Broadband')} stroke={BLUE}   strokeWidth={2} dot />
                    <Line type="monotone" dataKey="mobile" name={tt('Mobile')}    stroke={GREEN}  strokeWidth={2} dot />
                    <Line type="monotone" dataKey="core"   name={tt('Core')}      stroke={NAVY}   strokeWidth={2} dot />
                    <ReferenceLine y={99.95} stroke={AMBER} strokeDasharray="4 3" label={{ value: tt('SLA 99.95%'), position: 'right', fontSize: 9 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('W6 dip driven by INC-2031 transport outage. Core briefly dropped to 99.97% — recovered same session. All services recovering W7–W8.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Alarm Volume · Last 7 Days')} insight={{ insight: 'AIOps correlation is suppressing 89% of alarms from ticketing, keeping P1 and P2 volume manageable despite Friday maintenance-window peaks.', action: 'Review the remaining 11% of uncorrelated alarms to identify rule extensions that would further reduce manual NOC triage.', impact: 'Expanding AIOps correlation coverage by 5pp could free approximately 250 NOC analyst hours per month.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={alarmVolumes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="p1" name={tt('P1')} stackId="a" fill={RED_SV}  />
                  <Bar dataKey="p2" name={tt('P2')} stackId="a" fill={AMBER}   />
                  <Bar dataKey="p3" name={tt('P3')} stackId="a" fill={BLUE}    />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Friday peak normal — scheduled maintenance windows lift P3 volume. AIOps correlation suppresses 89% from ticketing.')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Top Active Alarms · NOC view')}>
            <div className="space-y-2">
              {[
                { id: 'ALM-8821', sev: 'P1', what: tt('Freeport transport ring WDM transponder failure'), node: 'TRS-GNT-04', age: '2h 14m' },
                { id: 'ALM-8814', sev: 'P2', what: tt('5G Core AMF latency p95 > 18 ms threshold'), node: 'AMF-ANT-02', age: '4h 02m' },
                { id: 'ALM-8802', sev: 'P2', what: tt('DOCSIS · Rural Out Islands CMTS utilisation 91% — approaching threshold'), node: 'CMTS-BRG-01', age: '18h 30m' },
                { id: 'ALM-8799', sev: 'P3', what: tt('Mobile 700 MHz Freeport — RSRP degradation 4 cells'), node: 'RAN-GNT-MES', age: '1d 06h' },
                { id: 'ALM-8781', sev: 'P3', what: tt('OLT Nassau West optical power margin < 3 dB on 12 PON'), node: 'OLT-ANT-W3', age: '2d 14h' },
              ].map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm border-b border-black/5 pb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${a.sev === 'P1' ? 'bg-red-100 text-red-700' : a.sev === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(a.sev)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{a.what}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5 font-mono">{a.node} · {tt('age')} {a.age}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/noc-map" className="font-semibold text-vfes-dark hover:underline">{tt('Open NOC map →')}</Link>
              <span className="mx-2">·</span>
              <Link to="/portal/operations" className="font-semibold text-vfes-dark hover:underline">{tt('Operations console →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Change Success Rate (%) · Last 6 Months')} insight={{ insight: 'Change success rate reached 96.6% in June, above the 95% target for the first time, after rollout of automated pre-change validation.', action: 'Mandate automated pre-change validation for all CAB-approved changes to lock in this performance gain permanently.', impact: 'Sustaining 96.6% change success reduces unplanned outage risk and the associated SLA credit and MTTR costs.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={changeSuccessRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[90, 100]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="success" name={tt('Success %')} fill={GREEN} stackId="a" />
                  <Bar dataKey="failed"  name={tt('Failed %')}  fill={RED_SV} stackId="a" />
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="4 3" label={{ value: tt('target'), position: 'right', fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('Change success rate improved to 96.6% in June — above the 95% target for the first time. Automated pre-change validation credited.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Network Energy · Efficiency & Sustainability')}>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: tt('Renewable energy'),    value: `${NET.renewablePct}%`,       color: 'text-emerald-600', note: tt('target 85% by Q3') },
              { label: tt('kWh / GB delivered'),  value: String(NET.kwhPerGb),          color: 'text-blue-600',    note: tt('−8% YoY efficiency') },
              { label: tt('GWh / month network'), value: String(NET.networkGwhMonth),   color: 'text-vfes-dark',   note: tt('total network load') },
              { label: tt('Carbon intensity'),    value: '38 gCO₂/GB',                  color: 'text-amber-600',   note: tt('−22% vs baseline · SBTi') },
            ].map((e, i) => (
              <div key={i} className="rounded-lg border border-black/5 bg-[#fafbfc] p-4 text-center">
                <div className={`text-2xl font-extrabold ${e.color}`}>{e.value}</div>
                <div className="text-xs font-semibold mt-1">{e.label}</div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{e.note}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('79% renewable sourced via PPA + grid certificates. Solar PPA expansion (Freeport, Bimini) targets 85% by Q3. EV fleet transition reduces Scope 1 emissions by ~22%.')}</div>
        </Panel>
      </>)}

      {/* ═══════ FIELD & PROVISIONING ═══════ */}
      {tab === 'fieldprov' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('First-time fix')}       value="85.2%"  delta="just hit 85% target ✓" trend="up"   icon={CheckCircle}  accent />
          <KpiCard label={tt('Jobs open')}             value="1,585"  delta="−12% WoW"               trend="up"   icon={HardHat}      />
          <KpiCard label={tt('Order fallout (BB)')}   value="3.8%"   delta="below 4% target ✓"      trend="up"   icon={Workflow}     />
          <KpiCard label={tt('Avg cycle time (BB)')}  value="2.8 d"  delta="target ≤ 3 d ✓"         trend="up"   icon={Clock}        />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('First-Time Fix Rate · 8-Month Trend (%)')} insight={{ insight: 'First-time fix rate crossed the 85% target in June for the first time in 8 months, driven by AI-dispatch skill matching and pre-visit AIOps diagnostics.', action: 'Scale AI-dispatch to all field regions, prioritising Abaco where crew utilisation is highest and re-dispatch costs are elevated.', impact: 'Each percentage point of FTF improvement eliminates approximately 80 truck rolls per month, reducing fuel and labour cost-to-serve.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={ftfTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[76, 88]} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="ftf"    name={tt('FTF %')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.25} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="target" name={tt('Target')}   stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('FTF crossed the 85% target in June for the first time. AI-dispatch matching right skills to job type and AIOps diagnostics pre-visit credited.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Order Fallout Rate (%) · 6 Months')} insight={{ insight: 'Residential order fallout has fallen to 3.8%, below the 4% target, while B2B remains elevated at 5.4% due to the ongoing Cerillion BSS migration.', action: 'Convene a Cerillion integration task force to address B2B fallout root causes before the Jul 19 go/no-go gate review.', impact: 'Reducing B2B fallout to target would recover approximately 1.4% of provisioning throughput and reduce rework cost on enterprise orders.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={orderFallout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[3, 8]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="residential" name={tt('Residential')} stroke={BLUE}   strokeWidth={2} dot />
                  <Line type="monotone" dataKey="b2b"         name={tt('B2B')}         stroke={PURPLE} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="target"      name={tt('Target')}      stroke={GREEN}  strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Residential hit 3.8% — below 4% target. B2B still elevated (5.4%) — Cerillion migration causing transient fallout.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Job Backlog by Type · Completed vs Open')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Job type')}</th>
                  <th className="text-right">{tt('Completed MTD')}</th>
                  <th className="text-right">{tt('Open queue')}</th>
                  <th className="text-right">{tt('FTF %')}</th>
                  <th className="text-right">{tt('Avg cycle (d)')}</th>
                  <th>{tt('FTF trend')}</th>
                </tr>
              </thead>
              <tbody>
                {jobsByType.map((j) => (
                  <tr key={j.type} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{j.type}</td>
                    <td className="text-right font-bold">{j.completed.toLocaleString()}</td>
                    <td className={`text-right ${j.pending > 400 ? 'text-amber-600 font-bold' : 'text-vfes-dark'}`}>{j.pending}</td>
                    <td className={`text-right font-bold ${j.ftf >= 85 ? 'text-emerald-600' : j.ftf >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{j.ftf}%</td>
                    <td className="text-right text-xs">{j.cycleDay}</td>
                    <td>
                      <div className="w-24 h-1.5 bg-black/5 rounded">
                        <div className={`h-full rounded ${j.ftf >= 85 ? 'bg-emerald-500' : j.ftf >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${(j.ftf / 100) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/field-ops" className="font-semibold text-vfes-dark hover:underline">{tt('Open Field Ops →')}</Link>
            <span>·</span>
            <Link to="/portal/order-provisioning" className="font-semibold text-vfes-dark hover:underline">{tt('Open Order & Provisioning →')}</Link>
          </div>
        </Panel>

        <Panel title={tt('Field Crew Availability · This Week')}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { region: 'Freeport', available: 18, busy: 106, util: 86, rag: 'Green' },
              { region: 'Nassau',    available: 22, busy:  86, util: 80, rag: 'Green' },
              { region: 'Abaco',  available:  4, busy:  80, util: 95, rag: 'Red'   },
              { region: 'Eleuthera',   available: 14, busy:  48, util: 77, rag: 'Green' },
            ].map((r) => (
              <div key={r.region} className={`rounded-lg border p-4 ${r.util >= 92 ? 'border-red-200 bg-red-50' : r.util >= 85 ? 'border-amber-200 bg-amber-50' : 'border-black/5 bg-[#fafbfc]'}`}>
                <div className="font-bold text-sm">{tt(r.region)}</div>
                <div className={`text-2xl font-extrabold mt-1 ${r.util >= 92 ? 'text-red-600' : r.util >= 85 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.util}%</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{r.available} {tt('available')} · {r.busy} {tt('deployed')}</div>
                <span className={`mt-1.5 inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${ragColor(r.rag)}`}>{tt(r.rag)}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('Abaco Rural Out Islands at 95% — overtime approved · 8 extra contract crews arranged for Q3 peak. Freeport tracking up; daily monitoring in place to avoid breach.')}</div>
        </Panel>
      </>)}

      {/* ═══════ CAPACITY ═══════ */}
      {tab === 'capacity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Nodes at-risk (>85%)')} value={`${nodesAtRisk} / ${capacityNodes.length}`} delta="DOCSIS Rural Out Islands + 700MHz" trend="down" icon={Gauge}   accent />
          <KpiCard label={tt('Avg headroom')}          value={`${capacityHeadroom}%`} delta="median across all nodes"  trend="up"   icon={Activity}   />
          <KpiCard label={tt('DOCSIS Rural Out Islands util')}  value="91%"                     delta="above 85% threshold"       trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Mobile 700 MHz util')} value="88%"                     delta="above 85% · upgrade Q3"    trend="down" icon={Network}     />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Network Node Utilisation · Key Sites (%)')} insight={{ insight: 'DOCSIS Rural Out Islands at 91% and Mobile 700 MHz at 88% are both above the 85% alert threshold, making them the two highest-risk nodes in the fleet.', action: 'Confirm Cisco CMTS delivery date for Rural Out Islands and validate the Mobile 700 MHz carrier aggregation works order is scheduled before August.', impact: 'Deploying capacity upgrades before Q3 peak prevents congestion-driven CIM events and avoids unplanned SLA credit exposure.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={capacityNodes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="node" tick={{ fontSize: 9 }} width={130} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                    <Bar dataKey="util" name={tt('Utilisation %')} radius={[0, 4, 4, 0]}>
                      {capacityNodes.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                    <ReferenceLine x={85} stroke={RED_SV} strokeDasharray="4 3" label={{ value: tt('85% threshold'), position: 'top', fontSize: 9 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('DOCSIS Rural Out Islands and Mobile 700 MHz are above the 85% alert threshold. CapEx programme for Rural Out Islands CMTS upgrade approved Q3.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Headroom Trend · Last 8 Quarters (%)')} insight={{ insight: 'DOCSIS headroom has declined to 9% over 8 quarters and is approaching the 15% minimum threshold, with core and mobile headroom also compressing.', action: 'Bring forward the Q4 capacity investment decision for DOCSIS and request a 12-month headroom forecast from the capacity planning team.', impact: 'Acting one quarter early on headroom avoids emergency unplanned CapEx, which typically carries a 20-30% cost premium over planned spend.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={headroomQtly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="core"   name={tt('Core')}   stroke={NAVY}   fill={NAVY}   fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="docsis" name={tt('DOCSIS')} stroke={AMBER}  fill={AMBER}  fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="mobile" name={tt('Mobile')} stroke={PURPLE} fill={PURPLE} fillOpacity={0.15} strokeWidth={2} />
                  <ReferenceLine y={15} stroke={RED_SV} strokeDasharray="4 3" label={{ value: tt('min headroom'), position: 'right', fontSize: 9 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('DOCSIS headroom at 9% — approaching 15% threshold. Core and mobile trends need Q3 investment to avoid capacity constrain.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Capacity Actions & Build Pipeline')}>
          <div className="space-y-2">
            {[
              { node: 'DOCSIS Rural Out Islands — CMTS upgrade', action: tt('Approved Q3 CapEx BSD 4.8M · order placed with Cisco'), rag: 'Amber', eta: tt('Sep 2026') },
              { node: 'Mobile 700 MHz — capacity pooling', action: tt('Carrier aggregation + Open RAN on 3 cells planned'), rag: 'Amber', eta: tt('Aug 2026') },
              { node: 'Core Freeport — ROADM expansion', action: tt('400G wavelength provisioned · 16% headroom post-work'), rag: 'Green', eta: tt('Jul 2026') },
              { node: 'OLT Nassau West — PON splitter add', action: tt('Works scheduled week of 7 Jul — low complexity'), rag: 'Green', eta: tt('Jul 2026') },
              { node: 'FTTH South Ring — OLT pre-provision', action: tt('10G XGS-PON line cards ordered · fibre footprint build ahead'), rag: 'Green', eta: tt('Oct 2026') },
            ].map((a, i) => (
              <div key={i} className="border border-black/5 rounded-lg p-3 flex items-start gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 mt-0.5 ${ragColor(a.rag)}`}>{tt(a.rag)}</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs">{a.node}</div>
                  <div className="text-[11px] text-vfes-dark/55 mt-0.5">{a.action}</div>
                </div>
                <div className="text-[10px] text-vfes-dark/50 shrink-0">{a.eta}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/capacity-capex" className="font-semibold text-vfes-dark hover:underline">{tt('Open Capacity & CapEx detail →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ INCIDENTS / SLA ═══════ */}
      {tab === 'incidents' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open P1')}               value="2"                          delta="INC-2031 (transport) + AMF"  trend="down" icon={Siren}       accent />
          <KpiCard label={tt('Open P2')}               value="8"                          delta="−3 vs last week"             trend="up"   icon={AlertTriangle}/>
          <KpiCard label={tt('SLA credit exposure')}   value={`BSD ${NET.slaCreditExposureK}K`} delta="this month"              trend="down" icon={ShieldCheck}  />
          <KpiCard label={tt('PIRs pending')}          value={String(pirPending)}          delta="INC-2031 (due 4 Jul)"       trend="flat" icon={ClipboardList}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Incident Volume by Severity · 6 Months')} insight={{ insight: 'P1 incidents have fallen 50% and P2 by 33% since January, reflecting the combined effect of AIOps alarm correlation and change-freeze discipline.', action: 'Continue the change-freeze cadence and invest in AIOps coverage for uncorrelated alarm types to drive P1 incidents toward zero in H2.', impact: 'Sustaining the P1 downward trend reduces SLA credit exposure and frees NOC capacity equivalent to approximately 2 analyst positions.' }}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={incidentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="p3" name={tt('P3')} stackId="a" stroke={BLUE}   fill={BLUE}   fillOpacity={0.5} />
                    <Area type="monotone" dataKey="p2" name={tt('P2')} stackId="a" stroke={AMBER}  fill={AMBER}  fillOpacity={0.7} />
                    <Area type="monotone" dataKey="p1" name={tt('P1')} stackId="a" stroke={RED_SV} fill={RED_SV} fillOpacity={0.9} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('Incident count declining trend H1 2026 — P3 down 37%, P2 down 33%, P1 down 50% vs Jan. AIOps alarm correlation and change-freeze discipline credited.')}</div>
            </Panel>
          </div>

          <Panel title={tt('SLA Credit Exposure by Service')}>
            <div className="space-y-2 mt-2">
              {slaCreditExposure.map((s) => (
                <div key={s.service} className="border-b border-black/5 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-xs">{tt(s.service)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(s.rag)}`}>{tt(s.rag)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-vfes-dark/60">
                    <span>{tt('exposure')} <span className="font-bold">{s.exposure}K CIM</span></span>
                    <span>·</span>
                    <span>{tt('prob')} <span className={`font-bold ${probColor(s.prob).includes('red') ? 'text-red-600' : probColor(s.prob).includes('amber') ? 'text-amber-600' : 'text-emerald-600'}`}>{s.prob}</span></span>
                    <span className="ml-auto font-bold text-vfes-dark">{s.credits}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-xs font-bold flex justify-between">
                <span>{tt('Total exposure')}</span>
                <span className="text-red-600">BSD {slaCreditExposure.reduce((s, e) => s + parseInt(e.credits.replace(/[^0-9]/g, '')), 0)}K</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/war-room" className="font-semibold text-vfes-dark hover:underline">{tt('Escalate to War Room →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Post-Incident Review (PIR) Log · Last 5 Incidents')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Inc')}</th>
                  <th>{tt('Date')}</th>
                  <th>{tt('Service / scope')}</th>
                  <th className="text-right">{tt('Impact')}</th>
                  <th className="text-right">{tt('MTTR (min)')}</th>
                  <th>{tt('Root cause')}</th>
                  <th>{tt('PIR')}</th>
                </tr>
              </thead>
              <tbody>
                {pirLog.map((p) => (
                  <tr key={p.inc} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{p.inc}</td>
                    <td className="text-xs text-vfes-dark/65">{p.date}</td>
                    <td className="font-semibold text-xs">{p.service}</td>
                    <td className={`text-right text-xs font-bold ${parseInt(p.impact) > 20 ? 'text-red-600' : 'text-amber-600'}`}>{p.impact}</td>
                    <td className={`text-right text-xs ${p.mttr > 120 ? 'text-red-600 font-bold' : p.mttr > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.mttr}</td>
                    <td className="text-[11px] text-vfes-dark/65 max-w-xs">{p.root}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.pir === 'Complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tt(p.pir)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/incidents" className="font-semibold text-vfes-dark hover:underline">{tt('Open full incident log →')}</Link>
            <span>·</span>
            <Link to="/portal/assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Service Assurance →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ PRODUCTIVITY ═══════ */}
      {tab === 'productivity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Automation avg')}        value={`${automationAvg}%`}      delta={`target ~86% · +${automationAvg - 72}pp vs prev year`} trend="up" icon={Zap}       accent />
          <KpiCard label={tt('Teams over-utilised')}  value={`${teamOverUtil} / ${teamUtil.length}`} delta="Rural Out Islands + Freeport" trend="down" icon={Users}      />
          <KpiCard label={tt('Change success rate')}  value="96.6%"                    delta="above 95% target ✓"    trend="up"   icon={CheckCircle}  />
          <KpiCard label={tt('AIOps CIM saving')}     value="~BSD 2.4M / yr"              delta="vs manual alarm handling" trend="up" icon={TrendingUp}    />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Automation Rate by Area (%) vs Target')} insight={{ insight: 'RFO auto-drafting at 44% and field dispatch at 62% are the two areas furthest below the 80% target, earmarked as H2 AI programme priorities.', action: 'Allocate H2 AI development capacity to close the RFO and dispatch automation gaps, targeting 70% and 78% respectively by year-end.', impact: 'Closing both gaps to target is estimated to deliver an additional 0.8M euros in operational savings on top of the current 2.4M AIOps run rate.' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-vfes-dark/55">{tt('AIOps · field dispatch · change automation rates')}</div>
                <button onClick={() => setShowAutomationGap(!showAutomationGap)}
                  className="text-xs font-bold text-vfes-dark hover:underline">
                  {showAutomationGap ? tt('Hide gap') : tt('Show gap to target')}
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={automationRates} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="area" tick={{ fontSize: 9 }} width={165} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="rate"   name={tt('Current %')} fill={BLUE} radius={[0, 4, 4, 0]} />
                    {showAutomationGap && <Bar dataKey="target" name={tt('Target %')} fill={GREY} fillOpacity={0.4} radius={[0, 4, 4, 0]} />}
                    <ReferenceLine x={80} stroke={AMBER} strokeDasharray="4 3" label={{ value: '80%', position: 'top', fontSize: 9 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-3">{tt('RFO auto-drafting (44%) and field dispatch (62%) have the largest gaps to target — H2 AI programme focuses here.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Team Utilisation · Current')}>
            <div className="space-y-2.5 mt-2">
              {teamUtil.map((t) => (
                <div key={t.team} className="border-b border-black/5 pb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold">{t.team}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-vfes-dark/55">{t.headcount} FTE</span>
                      <span className={`ml-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${ragColor(t.rag)}`}>{tt(t.rag)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded">
                    <div className={`h-full rounded ${t.util >= 92 ? 'bg-red-500' : t.util >= 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${t.util}%` }} />
                  </div>
                  <div className="text-[10px] text-right text-vfes-dark/55 mt-0.5">{t.util}%</div>
                </div>
              ))}
            </div>
            {teamOverUtil > 0 && (
              <div className="mt-3 text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2">
                {tt('Field Rural Out Islands at 96% — overtime risk. Hiring plan to add 12 FTE approved for Q3.')}
              </div>
            )}
          </Panel>
        </div>

        <Panel title={tt('Automation ROI & AIOps Savings · FY2026 Estimate')}>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: tt('Alarm noise suppression'),    saving: 'BSD 1.4M/yr', detail: tt('89% alarm correlation reduces NOC analyst hours by ~4,800/yr'), icon: Zap          },
              { label: tt('Field dispatch optimisation'),saving: 'BSD 0.6M/yr', detail: tt('−18% miles driven · fuel + time saving across 324 field engineers'), icon: HardHat  },
              { label: tt('MTTR prediction accuracy'),   saving: 'BSD 0.4M/yr', detail: tt('Right crew + parts on first visit avoids re-dispatch cost'),        icon: Wrench    },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="rounded-xl border border-black/5 bg-[#fafbfc] p-4 border-l-4 border-l-vfes-red">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-vfes-dark" />
                    <span className="font-bold text-sm">{s.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-vfes-dark">{s.saving}</div>
                  <div className="text-[11px] text-vfes-dark/55 mt-1">{s.detail}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-vfes-dark/50">
            <TrendingDown className="w-3 h-3 text-emerald-600" />
            <span>{tt('Total AIOps value realised: ~BSD 2.4M / yr · target BSD 4.2M by FY27 ·')}</span>
            <Link to="/portal/operations" className="font-semibold text-vfes-dark hover:underline">{tt('Open Operations →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ═══════ VENDORS & SLAs ═══════ */}
      {tab === 'vendors' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Contracts active')}     value="6"      delta={tt('BSD 112M TCV')}              trend="flat" icon={ClipboardList}  accent />
          <KpiCard label={tt('SLA breaches (30d)')}   value="3"      delta={tt('Cisco CMTS dominant')}    trend="down" icon={AlertTriangle}  />
          <KpiCard label={tt('Credit exposure')}       value="BSD 120K"  delta={tt('Cisco + Ericsson')}       trend="down" icon={ShieldCheck}    />
          <KpiCard label={tt('Renewals in 12mo')}      value="2"      delta={tt('Cisco Q1-26 critical')}   trend="flat" icon={Target}         />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('On-time deliveries')}    value="94%"    delta={tt('vs 95% SLA target')}      trend="up"   icon={CheckCircle}   />
          <KpiCard label={tt('Penalised invoices')}    value="3"      delta={tt('credit notes pending')}   trend="flat" icon={Activity}       />
          <KpiCard label={tt('Supplier score avg')}    value="3.8 / 5.0" delta={tt('annual review')}      trend="flat" icon={Gauge}          />
        </div>

        <Panel title={tt('Vendor contracts — SLA scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Vendor')}</th>
                  <th>{tt('Domain')}</th>
                  <th>{tt('Value')}</th>
                  <th>{tt('Renewal')}</th>
                  <th className="text-right">{tt('SLA target')}</th>
                  <th className="text-right">{tt('Actual')}</th>
                  <th className="text-right">{tt('NPS')}</th>
                  <th>{tt('RAG')}</th>
                </tr>
              </thead>
              <tbody>
                {vendorContracts.map((v) => (
                  <tr key={v.vendor} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold text-xs">{v.vendor}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(v.domain)}</td>
                    <td className="font-bold text-xs">{v.value}</td>
                    <td className="text-xs font-mono">{v.renewal}</td>
                    <td className="text-right text-xs text-vfes-dark/65">{v.slaUptime}%</td>
                    <td className={`text-right font-bold text-xs ${v.actual >= v.slaUptime ? 'text-emerald-600' : 'text-red-600'}`}>{v.actual}%</td>
                    <td className={`text-right font-bold text-xs ${v.nps >= 70 ? 'text-emerald-600' : v.nps >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{v.nps}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragColor(v.rag)}`}>{tt(v.rag)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Open Procurement →')}</Link>
            <span>·</span>
            <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Contract financials →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Vendor NPS score trend — 6 months')} insight={{ insight: 'Cisco NPS has fallen to 54, the only vendor below the 65 threshold, while Ericsson, Nokia and Cerillion all remain above it.', action: 'Use the Jul 10 QBR to formally invoke the remediation clause and tie measurable NPS milestones to the Q4 contract renewal negotiation.', impact: 'Linking renewal terms to NPS improvement creates commercial pressure on Cisco to invest in delivery quality ahead of the Q4 renewal.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={vendorNpsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[50, 80]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ericsson"  name="Ericsson"  stroke={BLUE}   strokeWidth={2} dot />
                  <Line type="monotone" dataKey="nokia"     name="Nokia"     stroke={NAVY}   strokeWidth={2} dot />
                  <Line type="monotone" dataKey="cisco"     name="Cisco"     stroke={RED_SV} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="cerillion" name="Cerillion" stroke={AMBER}  strokeWidth={2} dot />
                  <ReferenceLine y={65} stroke={GREY} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Cisco NPS 54 — below 65 threshold. Escalation to Cisco account director on 10 Jul QBR.')}</div>
          </Panel>

          <Panel title={tt('SLA credit penalty exposure — accruals (BSD K)')} insight={{ insight: 'Cisco has accrued the largest vendor penalty exposure at 84K euros, with a remediation plan requested ahead of the Q4 renewal negotiation.', action: 'Issue the formal SLA remedy letter by Jul 10 and set penalty reduction milestones as a condition for contract renewal at current rates.', impact: 'Securing a credible remediation plan before Q4 renewal protects against further accrual and strengthens the rate negotiation position.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={vendorCreditPenalty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="K" />
                  <YAxis type="category" dataKey="vendor" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `BSD ${v}K`} />
                  <Bar dataKey="penalty" name={tt('Accrued penalty BSD K')} radius={[0, 4, 4, 0]}>
                    {vendorCreditPenalty.map((d, i) => (
                      <Cell key={i} fill={d.pct >= 30 ? RED_SV : d.pct >= 10 ? AMBER : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Cisco at BSD 84K accrued — remediation plan requested. Renewal negotiation starts Q4-25.')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Vendor risk & strategic actions')}>
            <div className="space-y-3">
              {[
                { vendor: 'Cisco',      action: tt('Invoke SLA remedy clause — formal letter issued 28 Jun'), risk: 'High',   due: 'Jul 10' },
                { vendor: 'Ericsson',   action: tt('5G SA augmentation order — pending board sign-off'),       risk: 'Medium', due: 'Jun 28' },
                { vendor: 'Cerillion',  action: tt('BSS migration go/no-go gate review'),                      risk: 'Medium', due: 'Jul 19' },
                { vendor: 'Nokia',      action: tt('400G ROADM expansion — works confirmed Jul 2026'),         risk: 'Low',    due: 'Jul 14' },
                { vendor: 'ServiceNow', action: tt('ITSM upgrade change-freeze window scheduled'),              risk: 'Low',    due: 'Aug 4'  },
              ].map((a, i) => (
                <div key={i} className="border border-black/5 rounded-lg p-3 flex items-start gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 mt-0.5 ${probColor(a.risk)}`}>{tt(a.risk)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-xs">{a.vendor}</div>
                    <div className="text-[11px] text-vfes-dark/55 mt-0.5">{a.action}</div>
                  </div>
                  <div className="text-[10px] text-vfes-dark/50 shrink-0">{a.due}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/risk" className="font-semibold text-vfes-dark hover:underline">{tt('Risk register →')}</Link>
              <span>·</span>
              <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
              <span>·</span>
              <Link to="/portal/operations" className="font-semibold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
