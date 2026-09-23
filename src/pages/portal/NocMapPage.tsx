import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentAction from '../../components/AgentAction'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import tt from '../../i18n/tt'
import {
  Activity, Server, Siren, ShieldCheck, Clock, Globe2, ChevronRight, Sparkles,
  AlertTriangle, Bell, Users, Radio, Calendar, Zap, TrendingUp,
  Network, Gauge, Timer, Phone,
} from 'lucide-react'
import NET_FACTS from './_network_facts'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

type Status = 'Operational' | 'Degraded' | 'Outage'

type Region = {
  name: string
  lat: number
  lng: number
  sites: number
  trafficGbps: number
  uptime: number
  status: Status
  note: string
}

// National operations centre view — region rollups grounded in NET_FACTS
// (total active sites reconcile to NET_FACTS.activeSites).
const REGIONS: Region[] = [
  { name: 'Nassau',       lat: 25.0443, lng:  -77.3504, sites: 100, trafficGbps: 62, uptime: 99.98, status: 'Operational', note: 'All core & RAN nominal.' },
  { name: 'Freeport',         lat: 26.5333, lng:  -78.7, sites: 35, trafficGbps: 51, uptime: 99.41, status: 'Outage',      note: 'INC-2031 — metro transport ring degraded; reroute active.' },
  { name: 'Abaco',        lat: 26.5412, lng:  -77.0636, sites: 20, trafficGbps: 27, uptime: 99.82, status: 'Degraded',    note: 'Planned maintenance on Abaco hub; capacity reduced.' },
  { name: 'Eleuthera',        lat: 25.1962, lng:  -76.2431, sites: 12, trafficGbps: 30, uptime: 99.97, status: 'Operational', note: 'Network healthy. Churn watch flagged by commercial.' },
  { name: 'Andros',      lat: 24.7064, lng:  -77.7902, sites: 10, trafficGbps: 17, uptime: 99.95, status: 'Operational', note: 'Summer traffic within headroom.' },
  { name: 'Exuma',       lat: 23.5, lng:  -75.7667, sites: 10,  trafficGbps: 10.5, uptime: 99.96, status: 'Operational', note: 'Nominal.' },
  { name: 'Bimini',      lat: 25.727, lng:  -79.2972, sites: 5, trafficGbps: 13, uptime: 99.94, status: 'Operational', note: 'Nominal.' },
  { name: 'Long Island',         lat: 23.25, lng:  -75.1, sites: 5, trafficGbps: 9.8,  uptime: 99.93, status: 'Operational', note: 'Nominal.' },
  { name: 'New Providence',      lat: 25.06, lng:  -77.345, sites: 13,  trafficGbps: 8.2,  uptime: 99.90, status: 'Operational', note: 'Core link nominal.' },
  { name: 'Inagua',          lat: 20.95, lng:  -73.6731, sites: 3,  trafficGbps: 11, uptime: 99.88, status: 'Operational', note: 'Nominal.' },
  { name: 'Rural', lat: 24.5, lng: -75.5,   sites: 7, trafficGbps: 14.5, uptime: 99.92, status: 'Operational', note: 'Distributed rural macro & street cabinets.' },
]

// ─── Alarm feed ──────────────────────────────────────────────────────────────
type AlarmSev = 'Critical' | 'Major' | 'Minor' | 'Warning'
const ALARMS: { id: string; region: string; domain: string; sev: AlarmSev; desc: string; ts: string; ack: boolean }[] = [
  { id: 'ALM-0412', region: 'Freeport',    domain: 'Transport', sev: 'Critical', desc: 'Metro transport ring span fault — automatic reroute active', ts: '08:14', ack: false },
  { id: 'ALM-0411', region: 'Abaco',   domain: 'RAN',       sev: 'Major',    desc: 'Abaco hub capacity reduced — planned maintenance window', ts: '07:30', ack: true  },
  { id: 'ALM-0410', region: 'Nassau',  domain: 'Core',      sev: 'Minor',    desc: 'UPF pod restart on node mdr-upf-07 — recovered automatically', ts: '06:55', ack: true  },
  { id: 'ALM-0409', region: 'Eleuthera',   domain: 'RAN',       sev: 'Warning',  desc: 'Cell utilisation above 80% threshold — peak season demand', ts: '06:22', ack: false },
  { id: 'ALM-0408', region: 'Inagua',     domain: 'Transport', sev: 'Minor',    desc: 'Submarine cable latency +2 ms deviation — within tolerance', ts: '05:48', ack: true  },
  { id: 'ALM-0407', region: 'Bimini', domain: 'Core',      sev: 'Warning',  desc: 'AMF CPU spike 78% — auto-scaled, resolved in 4 min', ts: '04:10', ack: true  },
  { id: 'ALM-0406', region: 'Nassau',  domain: 'Transport', sev: 'Major',    desc: 'Local peering peering utilisation 84% — near threshold for 400G upgrade', ts: '03:30', ack: false },
  { id: 'ALM-0405', region: 'Long Island',    domain: 'RAN',       sev: 'Warning',  desc: '14 sites on generator power — grid outage in rural Cat Island', ts: '02:15', ack: false },
  { id: 'ALM-0404', region: 'Exuma',  domain: 'RAN',       sev: 'Minor',    desc: 'Sector azimuth drift detected on ZGZ-045 — self-healing triggered', ts: '01:42', ack: true  },
  { id: 'ALM-0403', region: 'New Providence', domain: 'Core',      sev: 'Warning',  desc: 'DNS resolver latency 28 ms (+5 ms) — investigating', ts: '00:58', ack: false },
  { id: 'ALM-0402', region: 'Freeport',    domain: 'RAN',       sev: 'Critical', desc: '62 cells dark in Freeport metro — correlated to INC-2031 transport fault', ts: '08:14', ack: false },
  { id: 'ALM-0401', region: 'Andros', domain: 'Transport', sev: 'Minor',    desc: 'Optical power degradation on MEC-GNT-02 span — monitoring', ts: 'Yest 22:30', ack: true  },
]

// ─── NOC queue ───────────────────────────────────────────────────────────────
const NOC_QUEUE: { id: string; region: string; prio: string; title: string; owner: string; eta: string; sla: string }[] = [
  { id: 'INC-2031', region: 'Freeport',    prio: 'P1', title: 'Metro transport ring span fault — field crew dispatched',       owner: 'M. Ferguson',   eta: '11:30', sla: '04:00' },
  { id: 'INC-2030', region: 'Abaco',   prio: 'P2', title: 'Abaco hub capacity reduced — maintenance underway',            owner: 'J. Pinder',  eta: '14:00', sla: '08:00' },
  { id: 'INC-2029', region: 'Nassau',  prio: 'P3', title: 'Local peering peering at 84% — capacity augmentation RFC raised',        owner: 'A. Rolle',   eta: 'Q3',    sla: '48:00' },
  { id: 'INC-2028', region: 'Long Island',    prio: 'P2', title: '14 sites on generator — grid restoration pending Island utility (demo)',         owner: 'P. Adderley', eta: '16:00', sla: '08:00' },
  { id: 'INC-2027', region: 'Eleuthera',   prio: 'P3', title: 'High cell utilisation — capacity headroom review scheduled',    owner: 'L. Morales', eta: 'Q3',    sla: '72:00' },
  { id: 'INC-2026', region: 'New Providence', prio: 'P3', title: 'DNS resolver latency elevated — investigating CDN routing',     owner: 'R. Santana', eta: 'TBD',   sla: '48:00' },
  { id: 'INC-2025', region: 'Nassau',  prio: 'P3', title: 'Optical span MEC-GNT-02 power degradation — monitor/patch Q3', owner: 'C. Willems',  eta: 'Q3',    sla: '72:00' },
]

// ─── MTTR data ───────────────────────────────────────────────────────────────
const MTTR_TREND: { m: string; p1: number; p2: number; p3: number; target: number }[] = [
  { m: 'Jan', p1: 3.8, p2: 6.4, p3: 18.2, target: 4 },
  { m: 'Feb', p1: 3.5, p2: 6.1, p3: 17.8, target: 4 },
  { m: 'Mar', p1: 3.2, p2: 5.9, p3: 17.1, target: 4 },
  { m: 'Apr', p1: 2.9, p2: 5.6, p3: 16.4, target: 4 },
  { m: 'May', p1: 2.7, p2: 5.4, p3: 15.8, target: 4 },
  { m: 'Jun', p1: 2.5, p2: 5.1, p3: 15.2, target: 4 },
]
const MTTR_BY_DOMAIN: { domain: string; mttr: number; incidents: number; color: string }[] = [
  { domain: 'Transport', mttr: 3.8, incidents: 12, color: BLUE   },
  { domain: 'RAN',       mttr: 1.6, incidents: 34, color: GREEN  },
  { domain: 'Core 5G',   mttr: 0.9, incidents:  8, color: NAVY   },
  { domain: 'Fixed/PON', mttr: 2.4, incidents: 18, color: AMBER  },
  { domain: 'Power',     mttr: 4.2, incidents:  6, color: PURPLE },
  { domain: 'OSS/BSS',   mttr: 1.2, incidents: 22, color: SLATE  },
]

// ─── On-call rota ────────────────────────────────────────────────────────────
const ONCALL: { name: string; role: string; region: string; shift: string; phone: string; escalation: string }[] = [
  { name: 'Mathias Ferguson',  role: 'NOC Engineer L2',  region: 'Freeport',    shift: '08:00–20:00', phone: '+1 242 93 112 0001', escalation: 'Transport SRE' },
  { name: 'Ann Rolle',     role: 'NOC Engineer L1',  region: 'Nassau',  shift: '08:00–20:00', phone: '+1 242 91 112 0002', escalation: 'Core 5G SRE'   },
  { name: 'Jonas Pinder', role: 'Field Technician', region: 'Abaco',   shift: '07:00–19:00', phone: '+1 242 96 112 0003', escalation: 'RAN Ops'        },
  { name: 'Laura Bain', role: 'NOC Engineer L1',  region: 'Eleuthera',   shift: '08:00–20:00', phone: '+1 242 95 112 0004', escalation: 'Transport SRE'  },
  { name: 'Lars Adderley', role: 'Field Technician', region: 'Long Island',    shift: '06:00–18:00', phone: '+1 242 98 112 0005', escalation: 'Power SRE'      },
  { name: 'Rosa Desmet',  role: 'NOC Engineer L2',  region: 'New Providence', shift: '08:00–20:00', phone: '+1 242 97 112 0006', escalation: 'Core 5G SRE'   },
  { name: 'Karel Willems', role: 'Transport SRE',    region: 'Nassau',  shift: '00:00–24:00', phone: '+1 242 91 112 0007', escalation: 'CTO duty'       },
  { name: 'Nele De Vos',  role: 'NOC Engineer L1',  region: 'Bimini', shift: '08:00–20:00', phone: '+1 242 94 112 0008', escalation: 'RAN Ops'        },
  { name: 'David Pieters',  role: 'NOC Night Ops',    region: 'Nassau',  shift: '20:00–08:00', phone: '+1 242 91 112 0009', escalation: 'Core 5G SRE'   },
  { name: 'Isabel Bethel',   role: 'Duty Manager',     region: 'National', shift: '08:00–20:00', phone: '+1 242 91 112 0010', escalation: 'CTO'           },
]

// ─── Capacity data ───────────────────────────────────────────────────────────
const CAPACITY_REGIONS: { region: string; util: number; headroom: number; sites: number; congested: number }[] = [
  { region: 'Nassau',  util: 78, headroom: 22, sites: 4820, congested: 48 },
  { region: 'Freeport',    util: 74, headroom: 26, sites: 3960, congested: 32 },
  { region: 'Abaco',   util: 69, headroom: 31, sites: 2310, congested: 18 },
  { region: 'Eleuthera',   util: 66, headroom: 34, sites: 2680, congested: 14 },
  { region: 'Bimini', util: 61, headroom: 39, sites: 1120, congested:  8 },
  { region: 'Inagua',     util: 58, headroom: 42, sites:  940, congested:  6 },
]
const CAPACITY_TREND: { h: string; util: number; threshold: number }[] = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  util: Math.round(52 + Math.sin((i - 8) / 3.5) * 18 + (i >= 18 || i <= 2 ? 10 : 0)),
  threshold: 85,
}))
const DOMAIN_TRAFFIC: { domain: string; gbps: number; color: string }[] = [
  { domain: 'Mobile 5G',  gbps: 8240, color: BLUE   },
  { domain: 'Mobile 4G',  gbps: 4120, color: NAVY   },
  { domain: 'Fixed/PON',  gbps: 3800, color: GREEN  },
  { domain: 'Enterprise', gbps: 1840, color: AMBER  },
  { domain: 'IoT/M2M',    gbps:  400, color: PURPLE },
]

// ─── Events timeline ─────────────────────────────────────────────────────────
const EVENTS: { id: string; ts: string; type: string; region: string; desc: string; impact: string }[] = [
  { id: 'EVT-0142', ts: '08:14',      type: 'Outage',      region: 'Freeport',  desc: 'INC-2031 transport ring fault raised — auto-reroute active',    impact: 'High'   },
  { id: 'EVT-0141', ts: '07:30',      type: 'Maintenance', region: 'Abaco', desc: 'Planned maintenance window opened on Abaco hub',               impact: 'Medium' },
  { id: 'EVT-0140', ts: '06:55',      type: 'Auto-heal',   region: 'Nassau',   desc: 'UPF pod restart — recovered in 42 s',                            impact: 'Low'    },
  { id: 'EVT-0139', ts: '05:48',      type: 'Degradation', region: 'Inagua',    desc: 'Submarine cable latency drift +2 ms — within SLA',               impact: 'Low'    },
  { id: 'EVT-0138', ts: '04:10',      type: 'Auto-heal',   region: 'Bimini',   desc: 'AMF CPU spike auto-scaled — resolved in 4 min',                  impact: 'Low'    },
  { id: 'EVT-0137', ts: '02:15',      type: 'External',    region: 'Long Island',    desc: 'Grid outage Cat Island — 14 sites on generator',                    impact: 'Medium' },
  { id: 'EVT-0136', ts: '00:30',      type: 'Change',      region: 'Nassau',   desc: 'Backbone 400G card swap Nassau Core-02 — completed OK',          impact: 'None'   },
  { id: 'EVT-0135', ts: 'Yest 23:10', type: 'Change',      region: 'Eleuthera',  desc: 'Core software patch applied to AMF cluster — successful',        impact: 'None'   },
  { id: 'EVT-0134', ts: 'Yest 22:30', type: 'Degradation', region: 'Andros',   desc: 'Optical span power degradation — monitoring',                    impact: 'Low'    },
  { id: 'EVT-0133', ts: 'Yest 20:00', type: 'Change',      region: 'Freeport',desc: 'OLT firmware upgrade batch 3/5 complete',                        impact: 'None'   },
  { id: 'EVT-0132', ts: 'Yest 18:45', type: 'Auto-heal',   region: 'Nassau',   desc: 'BGP session flap AS3352 — restored in 18 s',                     impact: 'Low'    },
  { id: 'EVT-0131', ts: 'Yest 15:20', type: 'Change',      region: 'National', desc: 'DNS TTL reduction deployed — no issues',                         impact: 'None'   },
]

// ─── Regional health ─────────────────────────────────────────────────────────
const REGIONAL_HEALTH: { region: string; score: number; uptime: number; mttr: number; nps: number; trend: 'up' | 'down' | 'flat' }[] = [
  { region: 'Nassau',    score: 96, uptime: 99.98, mttr: 1.8, nps: 42, trend: 'up'   },
  { region: 'Freeport', score: 71, uptime: 99.41, mttr: 3.8, nps: 38, trend: 'down' },
  { region: 'Abaco',  score: 84, uptime: 99.82, mttr: 2.2, nps: 41, trend: 'flat' },
  { region: 'Eleuthera',   score: 92, uptime: 99.97, mttr: 1.4, nps: 37, trend: 'up'   },
  { region: 'Bimini',    score: 94, uptime: 99.94, mttr: 1.6, nps: 39, trend: 'up'   },
  { region: 'Inagua',      score: 88, uptime: 99.88, mttr: 2.8, nps: 33, trend: 'flat' },
]

// ─── Alarm trend ─────────────────────────────────────────────────────────────
const ALARM_TREND: { h: string; critical: number; major: number; minor: number; warning: number }[] = [
  { h: '00:00', critical: 0, major: 1, minor: 3, warning: 4 },
  { h: '02:00', critical: 0, major: 2, minor: 4, warning: 5 },
  { h: '04:00', critical: 1, major: 2, minor: 3, warning: 4 },
  { h: '06:00', critical: 1, major: 3, minor: 5, warning: 7 },
  { h: '08:00', critical: 2, major: 4, minor: 6, warning: 8 },
  { h: '10:00', critical: 2, major: 3, minor: 5, warning: 6 },
  { h: '12:00', critical: 1, major: 3, minor: 4, warning: 6 },
  { h: '14:00', critical: 1, major: 2, minor: 4, warning: 5 },
  { h: '16:00', critical: 1, major: 2, minor: 3, warning: 4 },
  { h: '18:00', critical: 1, major: 2, minor: 3, warning: 5 },
  { h: '20:00', critical: 0, major: 1, minor: 3, warning: 4 },
  { h: '22:00', critical: 0, major: 1, minor: 2, warning: 3 },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'map' | 'queue' | 'alarms' | 'regions' | 'mttr' | 'oncall' | 'capacity' | 'events'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'map',      label: 'Live Map',  icon: Globe2  },
  { id: 'queue',    label: 'NOC Queue', icon: Siren   },
  { id: 'alarms',   label: 'Alarms',    icon: Bell    },
  { id: 'regions',  label: 'Regions',   icon: Network },
  { id: 'mttr',     label: 'MTTR',      icon: Timer   },
  { id: 'oncall',   label: 'On-call',   icon: Phone   },
  { id: 'capacity', label: 'Capacity',  icon: Gauge   },
  { id: 'events',   label: 'Events',    icon: Calendar},
]
const SEV_CHIP: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  Major:    'bg-orange-100 text-orange-700',
  Minor:    'bg-amber-100 text-amber-700',
  Warning:  'bg-blue-100 text-blue-700',
}

const STATUS_COLOR: Record<Status, string> = { Operational: GREEN, Degraded: AMBER, Outage: RED }
const STATUS_CHIP: Record<Status, string> = {
  Operational: 'bg-emerald-50 text-emerald-700',
  Degraded: 'bg-amber-50 text-amber-700',
  Outage: 'bg-red-50 text-red-700',
}

export default function NocMapPage() {
  // ─── hooks ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabId>('map')
  const [sel, setSel] = useState<string | null>(null)
  const [alarmSev, setAlarmSev] = useState<string>('All')
  const [queueSort, setQueueSort] = useState<'prio' | 'eta'>('prio')
  const [mttrDomain, setMttrDomain] = useState<string>('All')
  const [oncallRegion, setOncallRegion] = useState<string>('All')
  const [capacityRegion, setCapacityRegion] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')
  const triageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 1_000)
    return () => clearInterval(id)
  }, [])

  const totals = useMemo(() => {
    const sites = REGIONS.reduce((s, r) => s + r.sites, 0)
    const traffic = REGIONS.reduce((s, r) => s + r.trafficGbps, 0)
    const outages = REGIONS.filter((r) => r.status === 'Outage').length
    const degraded = REGIONS.filter((r) => r.status === 'Degraded').length
    const weightedUptime = REGIONS.reduce((s, r) => s + r.uptime * r.sites, 0) / sites
    return { sites, traffic, outages, degraded, weightedUptime }
  }, [])

  const markers: MapMarker[] = useMemo(
    () => REGIONS.filter((r) => r.name !== 'Rural').map((r) => ({
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      radius: 7 + Math.sqrt(r.sites) / 12,
      color: STATUS_COLOR[r.status],
      pulse: r.status !== 'Operational',
      tooltip: `${r.name} · ${r.sites.toLocaleString()} sites · ${r.uptime}%`,
    })),
    [],
  )

  const incidents = useMemo(() => REGIONS.filter((r) => r.status !== 'Operational'), [])

  const filteredAlarms = useMemo(
    () => alarmSev === 'All' ? ALARMS : ALARMS.filter(a => a.sev === alarmSev),
    [alarmSev],
  )

  const sortedQueue = useMemo(
    () => [...NOC_QUEUE].sort((a, b) => queueSort === 'prio' ? a.prio.localeCompare(b.prio) : a.eta.localeCompare(b.eta)),
    [queueSort],
  )

  const filteredMttr = useMemo(
    () => mttrDomain === 'All' ? MTTR_BY_DOMAIN : MTTR_BY_DOMAIN.filter(d => d.domain === mttrDomain),
    [mttrDomain],
  )

  const filteredOncall = useMemo(
    () => oncallRegion === 'All' ? ONCALL : ONCALL.filter(o => o.region === oncallRegion || o.region === 'National'),
    [oncallRegion],
  )

  const filteredCapacity = useMemo(
    () => capacityRegion === 'All' ? CAPACITY_REGIONS : CAPACITY_REGIONS.filter(c => c.region === capacityRegion),
    [capacityRegion],
  )

  const scrollToTriage = useCallback(() => {
    triageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const triageResult = {
    headline: tt('Triage complete — 1 outage, 1 degraded region'),
    stats: [
      { label: tt('Sites affected'), value: '~120' },
      { label: tt('Customers impacted'), value: '~38K' },
      { label: tt('CIM accruing'), value: `${NET_FACTS.cimMonth.toLocaleString()} min` },
      { label: tt('SLA credit risk'), value: `BSD ${NET_FACTS.slaCreditExposureK}K` },
    ],
    findings: [
      tt('INC-2031 (Freeport): transport ring fault isolated to one span — automatic reroute holding 99.4% availability while the field crew is dispatched.'),
      tt('Abaco degraded by a planned Abaco hub maintenance window; capacity reduced but no customer outage. No action required.'),
      tt('No correlated 5G Core or billing-platform alarms — fault is contained to regional transport.'),
      `${tt('National weighted uptime')} ${totals.weightedUptime.toFixed(2)}% ${tt('remains above the')} ${NET_FACTS.coreUptimePct}% ${tt('core SLA target.')}`,
    ],
    note: tt('Recommended next action: confirm field dispatch ETA on INC-2031 and pre-stage SLA-credit comms for the 3 affected enterprise accounts.'),
  }

  return (
    <div className="p-8 max-w-[1500px] mx-auto">
      <PageHeader
        title={tt('National NOC Map')}
        subtitle={tt('Live network-operations view across The Bahamas — site health, regional traffic and active incidents')}
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live')} · {liveTime}
            </span>
            <Link to="/portal/incidents" className="inline-flex items-center gap-1 text-sm font-semibold text-vfes-dark hover:underline">
              {tt('Open Incidents')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      {/* ── ML Insight Section ───────────────────────────────────────────────── */}
      <MlInsightSection
        heading="NOC intelligence"
        models={[
          { name: 'Fault Predictor',   metric: 'recall 0.92', sub: '72h failure early-warning'  },
          { name: 'Alarm Correlator',  metric: 'F1 0.89',     sub: 'noise reduction −68%'         },
          { name: 'MTTR Estimator',    metric: 'MAPE 6.2%',   sub: 'incident resolution forecast' },
        ]}
        agentLabel={tt('Run NOC Triage')}
        agentRunningLabel={tt('Correlating alarms…')}
        agentSteps={[
          tt('Pulled fault, performance & SLA telemetry by region'),
          tt('Correlated transport, RAN, core & billing alarms'),
          tt('Scored customer & SLA-credit impact'),
          tt('Drafted prioritised response plan'),
        ]}
        agentBlurb={tt('A single telemetry lake lets one model see transport, RAN, and core simultaneously — so fault correlation is end-to-end instead of siloed per domain.')}
        decision={{
          title: tt('Dispatch field crew to INC-2031 and raise Local peering upgrade RFC'),
          detail: tt('The Fault Predictor gave INC-2031 a 94% fault confidence 38 minutes before the span failed — validating the model. Local peering peering at 84% is the next highest risk, with 400G upgrade RFC already drafted.'),
          impact: tt('protects 38K customers · limits SLA-credit exposure to BSD 12K'),
          risk: tt('Ericsson RU lead-times may delay Local peering parallel — monitor daily'),
          linkTo: '#/portal/incidents',
          linkLabel: tt('Open Incidents'),
        }}
        chart={{
          kind: 'area',
          title: tt('Alarm volume — last 12 hours (count by severity)'),
          xKey: 'h',
          unit: '',
          data: ALARM_TREND,
          series: [
            { key: 'critical', name: tt('Critical'), color: RED   },
            { key: 'major',    name: tt('Major'),    color: AMBER },
            { key: 'minor',    name: tt('Minor'),    color: BLUE  },
            { key: 'warning',  name: tt('Warning'),  color: SLATE },
          ],
          note: tt('Peak alarm volume at 08:00 correlates with INC-2031 transport fault.'),
        }}
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 text-sm">
                {tt('P1 active — INC-2031 Freeport transport ring · 62 cells dark · 38K customers impacted')}
              </div>
              <div className="text-xs text-red-800 mt-1">
                {tt('Field crew dispatched — ETA 11:30. Abaco degraded (planned maintenance). All other regions nominal.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/incidents" className="text-xs font-bold text-red-900 hover:underline">
                {tt('Open INC-2031 →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-red-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav ──────────────────────────────────────────────────────────── */}
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

      {/* ══════════════ LIVE MAP ══════════════════════════════════════════════ */}
      {tab === 'map' && (<>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Active sites')} value={totals.sites.toLocaleString()} icon={Server} delta={`${NET_FACTS.activeSites.toLocaleString()} ${tt('on record')}`} trend="flat" />
          <KpiCard label={tt('National uptime 30d')} value={`${totals.weightedUptime.toFixed(2)}%`} icon={Activity} delta={tt('site-weighted')} trend="up" />
          <KpiCard label={tt('Network traffic')} value={`${(totals.traffic / 1000).toFixed(1)} Tbps`} icon={Globe2} delta={tt('peak load')} trend="up" />
          <KpiCard label={tt('Active outages')} value={totals.outages} icon={Siren} delta={totals.outages ? tt('P1 in progress') : tt('all clear')} trend={totals.outages ? 'down' : 'up'} accent={totals.outages > 0} />
          <KpiCard label={tt('Degraded regions')} value={totals.degraded} icon={ShieldCheck} delta={tt('maintenance / reduced')} trend="flat" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel
              title={tt('Regional site health')}
              action={
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN }} /> {tt('Operational')}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: AMBER }} /> {tt('Degraded')}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} /> {tt('Outage')}</span>
                </div>
              }
            >
              <CartoMap markers={markers} height={420} basemap="positron" zoom={6} />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title={tt('Active incidents')}>
              {incidents.length === 0 ? (
                <div className="text-sm text-vfes-dark/55">{tt('No active incidents. All regions operational.')}</div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((r) => (
                    <a key={r.name} href="#/portal/incidents" className="block rounded-xl border border-black/5 p-3 hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-vfes-dark">{tt(r.name)}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${STATUS_CHIP[r.status]}`}>{tt(r.status)}</span>
                      </div>
                      <div className="text-xs text-vfes-dark/60 leading-snug">{tt(r.note)}</div>
                      <div className="mt-1.5 text-[11px] text-vfes-dark/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {tt('uptime')} {r.uptime}% · {r.sites.toLocaleString()} {tt('sites')}
                      </div>
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('All incidents →')}</Link>
              </div>
            </Panel>

            <div ref={triageRef}>
              <Panel title={tt('Auto-triage (Cortex)')}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2">
                  <Sparkles className="w-3 h-3" /> {tt('Correlate alarms & recommend action')}
                </div>
                <AgentAction
                  label={tt('Run NOC triage')}
                  runningLabel={tt('Correlating alarms…')}
                  steps={[
                    tt('Pulled fault, performance & SLA telemetry by region'),
                    tt('Correlated transport, RAN, core & billing alarms'),
                    tt('Scored customer & SLA-credit impact'),
                    tt('Drafted prioritised response plan'),
                  ]}
                  result={triageResult}
                />
              </Panel>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Panel title={tt('All regions')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-vfes-dark/45 border-b border-black/5">
                    <th className="py-2 pr-4 font-bold">{tt('Region')}</th>
                    <th className="py-2 px-4 font-bold">{tt('Status')}</th>
                    <th className="py-2 px-4 font-bold text-right">{tt('Sites')}</th>
                    <th className="py-2 px-4 font-bold text-right">{tt('Traffic (Gbps)')}</th>
                    <th className="py-2 px-4 font-bold text-right">{tt('Uptime 30d')}</th>
                    <th className="py-2 pl-4 font-bold">{tt('Notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {REGIONS.map((r) => (
                    <tr key={r.name} onMouseEnter={() => setSel(r.name)} onMouseLeave={() => setSel(null)}
                      className={`border-b border-black/5 last:border-0 transition ${sel === r.name ? 'bg-vfes-red/[0.04]' : ''}`}>
                      <td className="py-2.5 pr-4 font-semibold text-vfes-dark">{tt(r.name)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded ${STATUS_CHIP[r.status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[r.status] }} /> {tt(r.status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{r.sites.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{r.trafficGbps.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{r.uptime}%</td>
                      <td className="py-2.5 pl-4 text-vfes-dark/60 text-xs">{tt(r.note)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Link to="/portal/operations" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <Link to="/portal/war-room" className="text-xs font-bold text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <button onClick={scrollToTriage} className="text-xs font-bold text-blue-600 hover:underline">{tt('↑ Triage panel')}</button>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ NOC QUEUE ═════════════════════════════════════════════ */}
      {tab === 'queue' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open incidents')} value={NOC_QUEUE.length} icon={Siren} delta={tt('1 P1 · 2 P2 · 4 P3')} trend="down" accent />
          <KpiCard label={tt('P1 MTTR target')} value="4h" icon={Timer} delta={tt('SLA ceiling')} trend="flat" />
          <KpiCard label={tt('Avg age open')} value="3.2h" icon={Clock} delta={tt('vs 4.1h last week')} trend="up" />
          <KpiCard label={tt('SLA credit exposure')} value={`BSD ${NET_FACTS.slaCreditExposureK}K`} icon={AlertTriangle} delta={tt('INC-2031 accruing')} trend="down" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort:')}</span>
          {(['prio', 'eta'] as const).map(k => (
            <button key={k} onClick={() => setQueueSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${queueSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'prio' ? tt('Priority') : tt('ETA')}
            </button>
          ))}
        </div>

        <Panel title={tt('NOC incident queue')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Priority')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Title')}</th>
                  <th>{tt('Owner')}</th>
                  <th className="text-right">{tt('ETA')}</th>
                  <th className="text-right">{tt('SLA')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedQueue.map(q => (
                  <tr key={q.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{q.id}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${q.prio === 'P1' ? 'bg-red-100 text-red-700' : q.prio === 'P2' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                        {q.prio}
                      </span>
                    </td>
                    <td className="text-xs text-vfes-dark/65">{q.region}</td>
                    <td className="text-xs font-semibold max-w-xs">{q.title}</td>
                    <td className="text-xs text-vfes-dark/65">{q.owner}</td>
                    <td className="text-right font-mono text-xs">{q.eta}</td>
                    <td className="text-right font-mono text-xs text-vfes-dark/55">{q.sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Incidents →')}</Link>
            <Link to="/portal/field-ops" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
            <Link to="/portal/assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Queue volume — last 7 days')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { d: tt('Mon'), open: 4, closed: 6 }, { d: tt('Tue'), open: 3, closed: 5 },
                  { d: tt('Wed'), open: 5, closed: 4 }, { d: tt('Thu'), open: 6, closed: 7 },
                  { d: tt('Fri'), open: 4, closed: 5 }, { d: tt('Sat'), open: 3, closed: 3 },
                  { d: tt('Sun'), open: 7, closed: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="open"   name={tt('Opened')} fill={RED}   radius={[3,3,0,0]} />
                  <Bar dataKey="closed" name={tt('Closed')} fill={GREEN} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Incident age distribution (hours)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { bucket: '<1h', count: 2 }, { bucket: '1–2h', count: 1 },
                  { bucket: '2–4h', count: 1 }, { bucket: '4–8h', count: 2 },
                  { bucket: '>8h', count: 1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Incidents')} radius={[4,4,0,0]}>
                    {[BLUE, GREEN, AMBER, AMBER, RED].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ ALARMS ════════════════════════════════════════════════ */}
      {tab === 'alarms' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active alarms')} value={ALARMS.length} icon={Bell} delta={tt('last 24h')} trend="flat" accent />
          <KpiCard label={tt('Critical')} value={ALARMS.filter(a => a.sev === 'Critical').length} icon={AlertTriangle} delta={tt('requires immediate action')} trend="down" />
          <KpiCard label={tt('Major')} value={ALARMS.filter(a => a.sev === 'Major').length} icon={Siren} delta={tt('within SLA')} trend="flat" />
          <KpiCard label={tt('Unacknowledged')} value={ALARMS.filter(a => !a.ack).length} icon={Bell} delta={tt('pending review')} trend="flat" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Severity:')}</span>
          {(['All', 'Critical', 'Major', 'Minor', 'Warning'] as const).map(s => (
            <button key={s} onClick={() => setAlarmSev(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${alarmSev === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Alarm volume — 12h trend by severity')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={ALARM_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="critical" name={tt('Critical')} stroke={RED}   fill={RED}   fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="major"    name={tt('Major')}    stroke={AMBER} fill={AMBER} fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="minor"    name={tt('Minor')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} stackId="1" />
                  <Area type="monotone" dataKey="warning"  name={tt('Warning')}  stroke={SLATE} fill={SLATE} fillOpacity={0.15} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Alarm distribution by domain')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: tt('Transport'), value: 4, color: BLUE   },
                    { name: tt('RAN'),       value: 4, color: GREEN  },
                    { name: tt('Core 5G'),   value: 2, color: NAVY   },
                    { name: tt('Power'),     value: 1, color: AMBER  },
                    { name: tt('OSS'),       value: 1, color: PURPLE },
                  ]} dataKey="value" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {[BLUE, GREEN, NAVY, AMBER, PURPLE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Active alarm feed')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Severity')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Domain')}</th>
                  <th>{tt('Description')}</th>
                  <th className="text-right">{tt('Time')}</th>
                  <th>{tt('ACK')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlarms.map(a => (
                  <tr key={a.id} className={`border-b border-black/5 hover:bg-[#fafbfc] ${a.sev === 'Critical' ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2.5 font-mono text-xs font-bold">{a.id}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${SEV_CHIP[a.sev]}`}>{tt(a.sev)}</span></td>
                    <td className="text-xs text-vfes-dark/65">{a.region}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(a.domain)}</td>
                    <td className="text-xs font-medium max-w-xs">{tt(a.desc)}</td>
                    <td className="text-right font-mono text-xs text-vfes-dark/55">{a.ts}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.ack ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {a.ack ? tt('ACK') : tt('NEW')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ REGIONS ═══════════════════════════════════════════════ */}
      {tab === 'regions' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Regions monitored')} value={REGIONS.length} icon={Network} delta={tt('11 regions + rural')} trend="flat" />
          <KpiCard label={tt('Best health score')} value="Nassau · 96" icon={ShieldCheck} delta={tt('99.98% uptime')} trend="up" accent />
          <KpiCard label={tt('Lowest NPS region')} value="Inagua · 33" icon={TrendingUp} delta={tt('network monitoring')} trend="down" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Regional health scores')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={REGIONAL_HEALTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine y={90} stroke={AMBER} strokeDasharray="3 3" />
                  <Bar dataKey="score" name={tt('Health score')} radius={[4,4,0,0]}>
                    {REGIONAL_HEALTH.map((r, i) => <Cell key={i} fill={r.score >= 90 ? GREEN : r.score >= 80 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed line = 90 minimum target. Freeport affected by INC-2031.')}</div>
          </Panel>

          <Panel title={tt('NPS by region')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={REGIONAL_HEALTH} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[28, 48]} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="nps" name="NPS" radius={[0,4,4,0]}>
                    {REGIONAL_HEALTH.map((r, i) => <Cell key={i} fill={r.nps >= 40 ? GREEN : r.nps >= 36 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Regional scorecard — health, uptime, MTTR, NPS')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Region')}</th>
                  <th className="text-right">{tt('Health')}</th>
                  <th className="text-right">{tt('Uptime')}</th>
                  <th className="text-right">{tt('MTTR (h)')}</th>
                  <th className="text-right">{tt('NPS')}</th>
                  <th>{tt('Trend')}</th>
                </tr>
              </thead>
              <tbody>
                {REGIONAL_HEALTH.map(r => (
                  <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{r.region}</td>
                    <td className={`text-right font-bold ${r.score >= 90 ? 'text-emerald-600' : r.score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{r.score}</td>
                    <td className="text-right font-mono">{r.uptime}%</td>
                    <td className={`text-right font-mono ${r.mttr >= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.mttr}h</td>
                    <td className="text-right font-bold">{r.nps}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : r.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {tt(r.trend)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/coverage" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
            <Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
            <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ MTTR ══════════════════════════════════════════════════ */}
      {tab === 'mttr' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('P1 MTTR (June)')} value="2.5h" icon={Timer} delta={tt('target 4h · on track')} trend="up" accent />
          <KpiCard label={tt('P2 MTTR (June)')} value="5.1h" icon={Clock} delta={tt('target 8h')} trend="up" />
          <KpiCard label={tt('Total incidents YTD')} value="487" icon={Siren} delta={tt('−12% YoY')} trend="up" />
          <KpiCard label={tt('Auto-resolved')} value="38%" icon={Zap} delta={tt('AIOps auto-heal')} trend="up" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Domain:')}</span>
          {['All', ...MTTR_BY_DOMAIN.map(d => d.domain)].map(d => (
            <button key={d} onClick={() => setMttrDomain(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${mttrDomain === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(d)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MTTR trend — P1/P2/P3 (hours)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={MTTR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="h" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="p1" name={tt('P1 MTTR')} stroke={RED}   strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="p2" name={tt('P2 MTTR')} stroke={AMBER} strokeWidth={2}   dot />
                  <Line type="monotone" dataKey="p3" name={tt('P3 MTTR')} stroke={SLATE} strokeWidth={1.8} dot={false} />
                  <ReferenceLine y={4} stroke={RED} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red dashed line = P1 4h SLA target')}</div>
          </Panel>

          <Panel title={tt('MTTR by domain — current month')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredMttr} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="h" domain={[0, 6]} />
                  <YAxis type="category" dataKey="domain" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip contentStyle={TS} />
                  <ReferenceLine x={4} stroke={RED} strokeDasharray="3 3" />
                  <Bar dataKey="mttr" name={tt('MTTR (h)')} radius={[0,4,4,0]}>
                    {filteredMttr.map((d, i) => <Cell key={i} fill={d.mttr >= 4 ? RED : d.mttr >= 2.5 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('MTTR detail by domain')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Domain')}</th>
                  <th className="text-right">{tt('MTTR (h)')}</th>
                  <th className="text-right">{tt('Incidents MTD')}</th>
                  <th>{tt('SLA status')}</th>
                </tr>
              </thead>
              <tbody>
                {MTTR_BY_DOMAIN.map(d => (
                  <tr key={d.domain} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(d.domain)}</td>
                    <td className={`text-right font-bold font-mono ${d.mttr >= 4 ? 'text-red-600' : d.mttr >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.mttr}h</td>
                    <td className="text-right font-mono">{d.incidents}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${d.mttr < 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {d.mttr < 4 ? tt('In SLA') : tt('Breach')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
            <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ ON-CALL ═══════════════════════════════════════════════ */}
      {tab === 'oncall' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('On-call engineers')} value={ONCALL.length} icon={Users} delta={tt('active shift')} trend="flat" accent />
          <KpiCard label={tt('Duty manager')} value="Isabel Bethel" icon={ShieldCheck} delta={tt('national coverage')} trend="flat" />
          <KpiCard label={tt('Active P1 owner')} value="M. Ferguson" icon={Phone} delta={tt('INC-2031 lead')} trend="flat" />
          <KpiCard label={tt('Night ops shift')} value="D. Molina" icon={Clock} delta="20:00–08:00" trend="flat" />
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', 'Nassau', 'Freeport', 'Abaco', 'Eleuthera', 'Long Island', 'Bimini', 'New Providence'].map(r => (
            <button key={r} onClick={() => setOncallRegion(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${oncallRegion === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <Panel title={tt('On-call rota — active shift')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Name')}</th>
                  <th>{tt('Role')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Shift')}</th>
                  <th>{tt('Phone')}</th>
                  <th>{tt('Escalation')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOncall.map(o => (
                  <tr key={o.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{o.name}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(o.role)}</td>
                    <td className="text-xs">{o.region}</td>
                    <td className="font-mono text-xs">{o.shift}</td>
                    <td className="font-mono text-xs text-vfes-dark/65">{o.phone}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(o.escalation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/operations" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/field-ops" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Coverage by region — shift allocation')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { region: 'Nassau',  engineers: 3 },
                  { region: 'Freeport',    engineers: 1 },
                  { region: 'Abaco',   engineers: 1 },
                  { region: 'Eleuthera',   engineers: 1 },
                  { region: 'Long Island',    engineers: 1 },
                  { region: 'Bimini', engineers: 1 },
                  { region: 'New Providence', engineers: 1 },
                  { region: 'National', engineers: 1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="engineers" name={tt('Engineers')} fill={BLUE} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Escalation path — NOC chain of command')}>
            <div className="space-y-3 text-sm">
              {[
                { level: 'L1 NOC',      role: tt('First response · acknowledge · basic triage'),          color: GREEN  },
                { level: 'L2 NOC',      role: tt('Deep triage · escalation decision · SLA owner'),        color: BLUE   },
                { level: 'Domain SRE',  role: tt('Transport / Core / RAN specialist resolution'),         color: AMBER  },
                { level: 'Duty Mgr',    role: tt('Major incident declaration · exec comms'),              color: PURPLE },
                { level: 'CTO',         role: tt('P1 extended / regulatory / media impact'),              color: RED    },
              ].map(e => (
                <div key={e.level} className="flex items-start gap-3 rounded-lg border border-black/5 p-2.5">
                  <div className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-widest" style={{ color: e.color }}>{e.level}</div>
                  <div className="text-xs text-vfes-dark/70">{e.role}</div>
                </div>
              ))}
              <div className="mt-2">
                <Link to="/portal/war-room" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open War Room →')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CAPACITY ══════════════════════════════════════════════ */}
      {tab === 'capacity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Network utilisation')} value="72%" icon={Gauge} delta={tt('national avg')} trend="flat" accent />
          <KpiCard label={tt('Peak today')} value="84%" icon={TrendingUp} delta={tt('19:00–21:00 slot')} trend="down" />
          <KpiCard label={tt('Congested cells')} value="142" icon={AlertTriangle} delta={tt('2% of fleet — Q3 risk')} trend="down" />
          <KpiCard label={tt('Total traffic')} value={`${(totals.traffic / 1000).toFixed(1)} Tbps`} icon={Zap} delta={tt('peak load')} trend="up" />
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', ...CAPACITY_REGIONS.map(c => c.region)].map(r => (
            <button key={r} onClick={() => setCapacityRegion(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${capacityRegion === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Network utilisation — 24h profile (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={CAPACITY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[30, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="util" name={tt('Utilisation %')} stroke={BLUE} fill={BLUE} fillOpacity={0.25} />
                  <ReferenceLine y={85} stroke={RED} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red dashed = 85% congestion threshold')}</div>
          </Panel>

          <Panel title={tt('Traffic breakdown by domain (Gbps)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={DOMAIN_TRAFFIC} dataKey="gbps" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {DOMAIN_TRAFFIC.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v.toLocaleString()} Gbps`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Capacity by region — utilisation vs congested sites')}>
          <div className="h-56">
            <ResponsiveContainer>
              <ComposedChart data={filteredCapacity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[50, 90]} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="util" name={tt('Utilisation %')} fill={BLUE} radius={[4,4,0,0]} />
                <Line yAxisId="r" type="monotone" dataKey="congested" name={tt('Congested sites')} stroke={RED} strokeWidth={2.4} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
            <Link to="/portal/core-5g" className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ EVENTS ════════════════════════════════════════════════ */}
      {tab === 'events' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Events today')} value={EVENTS.filter(e => !e.ts.startsWith('Yest')).length} icon={Calendar} delta={tt('last 24h')} trend="flat" accent />
          <KpiCard label={tt('Outage events')} value={EVENTS.filter(e => e.type === 'Outage').length} icon={Siren} delta={tt('INC-2031 active')} trend="down" />
          <KpiCard label={tt('Auto-heal events')} value={EVENTS.filter(e => e.type === 'Auto-heal').length} icon={Zap} delta={tt('AIOps resolution')} trend="up" />
          <KpiCard label={tt('Planned changes')} value={EVENTS.filter(e => e.type === 'Change' || e.type === 'Maintenance').length} icon={Radio} delta={tt('zero unplanned change')} trend="flat" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Event type distribution')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: tt('Outage'),      value: 1, color: RED    },
                    { name: tt('Degradation'), value: 2, color: AMBER  },
                    { name: tt('Auto-heal'),   value: 3, color: GREEN  },
                    { name: tt('Change'),      value: 4, color: BLUE   },
                    { name: tt('Maintenance'), value: 1, color: PURPLE },
                    { name: tt('External'),    value: 1, color: SLATE  },
                  ]} dataKey="value" innerRadius={30} outerRadius={65} paddingAngle={2}>
                    {[RED, AMBER, GREEN, BLUE, PURPLE, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Event impact distribution')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { impact: tt('High'),   count: EVENTS.filter(e => e.impact === 'High').length   },
                  { impact: tt('Medium'), count: EVENTS.filter(e => e.impact === 'Medium').length },
                  { impact: tt('Low'),    count: EVENTS.filter(e => e.impact === 'Low').length    },
                  { impact: tt('None'),   count: EVENTS.filter(e => e.impact === 'None').length   },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="impact" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Events')} radius={[4,4,0,0]}>
                    {[RED, AMBER, BLUE, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Network events timeline')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th className="text-right">{tt('Time')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Region')}</th>
                  <th>{tt('Description')}</th>
                  <th>{tt('Impact')}</th>
                </tr>
              </thead>
              <tbody>
                {EVENTS.map(e => (
                  <tr key={e.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold">{e.id}</td>
                    <td className="text-right font-mono text-xs text-vfes-dark/55">{e.ts}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        e.type === 'Outage'      ? 'bg-red-100 text-red-700' :
                        e.type === 'Degradation' ? 'bg-amber-100 text-amber-700' :
                        e.type === 'Auto-heal'   ? 'bg-emerald-100 text-emerald-700' :
                        e.type === 'External'    ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{tt(e.type)}</span>
                    </td>
                    <td className="text-xs text-vfes-dark/65">{e.region}</td>
                    <td className="text-xs font-medium max-w-xs">{tt(e.desc)}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ragC(e.impact === 'High' ? 'Red' : e.impact === 'Medium' ? 'Amber' : 'Green')}`}>
                        {tt(e.impact)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link to="/portal/order-provisioning" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Order & Provisioning →')}</Link>
            <Link to="/portal/cto" className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
          </div>
        </Panel>
      </>)}
    </div>
  )
}
