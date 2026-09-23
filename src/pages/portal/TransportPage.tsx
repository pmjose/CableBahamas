import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Cable, Network, Globe, Activity,
  Gauge, ShieldCheck, TrendingUp, Bell, Zap, AlertTriangle,
  Layers, MapPin, Brain,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, PieChart, Pie,
  ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const CORE_LINKS = [
  { link: 'Nassau ↔ Freeport',    cap: '8.0 Tbps', util: 71, capGbps: 8000, type: 'DWDM',      protected: true  },
  { link: 'Nassau ↔ Eleuthera',      cap: '4.0 Tbps', util: 58, capGbps: 4000, type: 'DWDM',      protected: true  },
  { link: 'Freeport ↔ Abaco',  cap: '3.2 Tbps', util: 64, capGbps: 3200, type: 'DWDM',      protected: true  },
  { link: 'Nassau ↔ Bimini',       cap: '2.4 Tbps', util: 82, capGbps: 2400, type: 'DWDM',      protected: true  },
  { link: 'Nassau ↔ Amsterdam',       cap: '1.6 Tbps', util: 49, capGbps: 1600, type: 'DWDM',      protected: false },
  { link: 'Freeport ↔ Paris', cap: '2.0 Tbps', util: 77, capGbps: 2000, type: 'Submarine', protected: true  },
]

const PEERING = [
  { asn: 'Google (AS15169)',  gbps: 1840, type: 'PNI',     cost: 0    },
  { asn: 'Netflix (AS2906)',  gbps: 1420, type: 'PNI',     cost: 0    },
  { asn: 'Meta (AS32934)',    gbps:  980, type: 'PNI',     cost: 0    },
  { asn: 'Amazon (AS16509)',  gbps:  740, type: 'IXP',     cost: 0    },
  { asn: 'Akamai (AS20940)',  gbps:  620, type: 'PNI',     cost: 0    },
  { asn: 'Transit (Cogent)',  gbps:  410, type: 'Transit', cost: 0.32 },
  { asn: 'Transit (Telia)',   gbps:  380, type: 'Transit', cost: 0.38 },
]

const TRANSIT_TREND = [
  { m: 'Jan', usd: 0.52 }, { m: 'Feb', usd: 0.49 }, { m: 'Mar', usd: 0.46 },
  { m: 'Apr', usd: 0.43 }, { m: 'May', usd: 0.40 }, { m: 'Jun', usd: 0.38 },
  { m: 'Jul', usd: 0.36 }, { m: 'Aug', usd: 0.35 },
]

const LATENCY_MATRIX = [
  { route: 'Nassau → Freeport',  rtt:  12.4, jitter: 0.8, loss: 0.01, sla:  15, status: 'Green' },
  { route: 'Nassau → Abaco',   rtt:   8.2, jitter: 0.6, loss: 0.00, sla:  10, status: 'Green' },
  { route: 'Nassau → Bimini',     rtt:   9.8, jitter: 0.7, loss: 0.01, sla:  12, status: 'Green' },
  { route: 'Freeport → Eleuthera', rtt:  18.6, jitter: 1.1, loss: 0.02, sla:  20, status: 'Green' },
  { route: 'Nassau → London',     rtt:  28.4, jitter: 1.4, loss: 0.01, sla:  35, status: 'Green' },
  { route: 'Nassau → Frankfurt',  rtt:  32.1, jitter: 1.6, loss: 0.02, sla:  40, status: 'Green' },
  { route: 'Nassau → São Paulo',  rtt: 178.0, jitter: 4.2, loss: 0.05, sla: 200, status: 'Green' },
]

const LATENCY_24H = [
  { h: '00', mad_bcn: 11.8, mad_bil:  9.2, mad_lon: 27.6 },
  { h: '04', mad_bcn: 11.4, mad_bil:  8.8, mad_lon: 27.2 },
  { h: '08', mad_bcn: 12.2, mad_bil:  9.4, mad_lon: 28.0 },
  { h: '12', mad_bcn: 13.1, mad_bil: 10.2, mad_lon: 29.4 },
  { h: '16', mad_bcn: 13.8, mad_bil: 10.8, mad_lon: 30.2 },
  { h: '18', mad_bcn: 14.2, mad_bil: 11.2, mad_lon: 31.0 },
  { h: '20', mad_bcn: 13.6, mad_bil: 10.6, mad_lon: 30.4 },
  { h: '22', mad_bcn: 12.8, mad_bil: 10.0, mad_lon: 29.2 },
]

const MPLS_TUNNELS = [
  { te: 'TE-ANT-GNT-01', path: 'Nassau → Freeport',    bw: '400G', util: 68, rsvp: true,  cos: 'Gold'   },
  { te: 'TE-ANT-GNT-02', path: 'Nassau → Freeport',    bw: '400G', util: 52, rsvp: true,  cos: 'Silver' },
  { te: 'TE-ANT-LVN-01', path: 'Nassau → Eleuthera',      bw: '200G', util: 61, rsvp: true,  cos: 'Gold'   },
  { te: 'TE-ANT-MEC-01', path: 'Nassau → Bimini',       bw: '200G', util: 84, rsvp: true,  cos: 'Gold'   },
  { te: 'TE-GNT-BRG-01', path: 'Freeport → Abaco',  bw: '100G', util: 58, rsvp: false, cos: 'Bronze' },
  { te: 'TE-ANT-AMS-01', path: 'Nassau → Amsterdam',       bw: '100G', util: 44, rsvp: false, cos: 'Bronze' },
  { te: 'TE-GNT-PAR-01', path: 'Freeport → Paris', bw: '100G', util: 72, rsvp: true,  cos: 'Silver' },
]

const MPLS_TRAFFIC = [
  { m: 'Jan', gold: 2840, silver: 1420, bronze: 680 }, { m: 'Feb', gold: 2920, silver: 1460, bronze: 710 },
  { m: 'Mar', gold: 3040, silver: 1520, bronze: 740 }, { m: 'Apr', gold: 3180, silver: 1590, bronze: 760 },
  { m: 'May', gold: 3260, silver: 1640, bronze: 790 }, { m: 'Jun', gold: 3380, silver: 1680, bronze: 820 },
]

const CAPACITY_FORECAST = [
  { q: 'Q3-25', util: 68, headroom: 32, threshold: 85 },
  { q: 'Q4-25', util: 71, headroom: 29, threshold: 85 },
  { q: 'Q1-26', util: 74, headroom: 26, threshold: 85 },
  { q: 'Q2-26', util: 78, headroom: 22, threshold: 85 },
  { q: 'Q3-26', util: 82, headroom: 18, threshold: 85 },
  { q: 'Q4-26', util: 87, headroom: 13, threshold: 85 },
]

const RESILIENCE_SRLG = [
  { srlg: 'SRLG-ANT-CORE-1',  links: 2, b2bCircuits: 12, protected: true,  riskLevel: 'Low'  },
  { srlg: 'SRLG-ANT-PEERING', links: 2, b2bCircuits:  8, protected: false, riskLevel: 'High' },
  { srlg: 'SRLG-GNT-PORT',    links: 3, b2bCircuits: 18, protected: true,  riskLevel: 'Low'  },
  { srlg: 'SRLG-LVN-SOUTH',   links: 2, b2bCircuits:  4, protected: false, riskLevel: 'Med'  },
  { srlg: 'SRLG-MEC-NORTH',   links: 2, b2bCircuits:  6, protected: true,  riskLevel: 'Low'  },
]

const RESILIENCE_AVAIL = [
  { m: 'Jan', avail: 99.994, mttr: 38 }, { m: 'Feb', avail: 99.996, mttr: 32 },
  { m: 'Mar', avail: 99.998, mttr: 28 }, { m: 'Apr', avail: 99.994, mttr: 41 },
  { m: 'May', avail: 99.997, mttr: 24 }, { m: 'Jun', avail: 99.998, mttr: 22 },
]

const NOC_EVENTS = [
  { id: 'EVT-001', link: 'Nassau↔Bimini',      severity: 'High', type: 'Utilisation threshold', status: 'Active'   },
  { id: 'EVT-002', link: 'Local peering peering',     severity: 'Med',  type: 'BGP session flap',      status: 'Resolved' },
  { id: 'EVT-003', link: 'Bcn↔Paris',       severity: 'Low',  type: 'FEC errors rising',     status: 'Watching' },
  { id: 'EVT-004', link: 'Nassau↔Amsterdam',       severity: 'High', type: 'No path protection',    status: 'Planning' },
  { id: 'EVT-005', link: 'DE-CIX Frankfurt peering', severity: 'Low',  type: 'Prefix count drift',    status: 'Resolved' },
]

const NOC_ALARMS_7D = [
  { d: 'Mon', p1: 1, p2: 4, p3: 12 }, { d: 'Tue', p1: 0, p2: 3, p3: 9  },
  { d: 'Wed', p1: 2, p2: 5, p3: 14 }, { d: 'Thu', p1: 1, p2: 4, p3: 11 },
  { d: 'Fri', p1: 0, p2: 2, p3: 8  }, { d: 'Sat', p1: 0, p2: 1, p3: 6  },
  { d: 'Sun', p1: 0, p2: 2, p3: 7  },
]

const TRAFFIC_DAILY = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  total: 2200 + Math.round(Math.sin(i / 3.5) * 800 + (i >= 19 || i <= 2 ? 600 : 0)),
  cdn:   1400 + Math.round(Math.sin(i / 3.5) * 480 + (i >= 19 || i <= 2 ? 380 : 0)),
  trans:  480 + Math.round(Math.sin(i / 3.5) * 120),
}))

const PEERING_MONTHLY = [
  { m: 'Jan', pni: 4820, ixp: 1240, transit: 980 }, { m: 'Feb', pni: 5040, ixp: 1320, transit: 880 },
  { m: 'Mar', pni: 5280, ixp: 1380, transit: 820 }, { m: 'Apr', pni: 5420, ixp: 1460, transit: 760 },
  { m: 'May', pni: 5680, ixp: 1520, transit: 710 }, { m: 'Jun', pni: 5920, ixp: 1580, transit: 670 },
]

const DWDM_CHANNELS = [
  { node: 'Nassau ROADMs',    channels: 48, lit: 38, avail: 10, gen: 'G-OTN-II' },
  { node: 'Freeport ROADMs', channels: 40, lit: 32, avail:  8, gen: 'G-OTN-II' },
  { node: 'Abaco ILA',     channels: 32, lit: 24, avail:  8, gen: 'G-OTN-I'  },
  { node: 'Eleuthera ROADM',    channels: 24, lit: 18, avail:  6, gen: 'G-OTN-I'  },
  { node: 'Bimini ROADM',     channels: 24, lit: 20, avail:  4, gen: 'G-OTN-II' },
]

type TabId = 'backbone' | 'peering' | 'transit' | 'latency' | 'resilience' | 'mpls' | 'capacity' | 'noc'
const TABS: { id: TabId; label: string; icon: typeof Cable }[] = [
  { id: 'backbone',   label: 'DWDM Backbone', icon: Cable       },
  { id: 'peering',    label: 'Peering & IXP', icon: Globe       },
  { id: 'transit',    label: 'Transit Cost',  icon: Activity    },
  { id: 'latency',    label: 'Latency',       icon: Gauge       },
  { id: 'resilience', label: 'Resilience',    icon: ShieldCheck },
  { id: 'mpls',       label: 'IP/MPLS TE',   icon: Network     },
  { id: 'capacity',   label: 'Capacity',      icon: TrendingUp  },
  { id: 'noc',        label: 'NOC Events',    icon: Bell        },
]

export default function TransportPage() {
  const [tab, setTab] = useState<TabId>('backbone')
  const [linkFilter, setLinkFilter] = useState<'All' | 'DWDM' | 'Submarine'>('All')
  const [peeringSort, setPeeringSort] = useState<'gbps' | 'cost'>('gbps')
  const [latencyCity, setLatencyCity] = useState<string>('All')
  const [mplsCos, setMplsCos] = useState<'All' | 'Gold' | 'Silver' | 'Bronze'>('All')
  const [liveTime, setLiveTime] = useState('')
  const [alertDismissed, setAlertDismissed] = useState(false)

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredLinks = useMemo(
    () => linkFilter === 'All' ? CORE_LINKS : CORE_LINKS.filter(l => l.type === linkFilter),
    [linkFilter],
  )

  const sortedPeering = useMemo(
    () => [...PEERING].sort((a, b) => peeringSort === 'gbps' ? b.gbps - a.gbps : b.cost - a.cost),
    [peeringSort],
  )

  const filteredMpls = useMemo(
    () => mplsCos === 'All' ? MPLS_TUNNELS : MPLS_TUNNELS.filter(t => t.cos === mplsCos),
    [mplsCos],
  )

  const filteredLatency = useMemo(
    () => latencyCity === 'All' ? LATENCY_MATRIX : LATENCY_MATRIX.filter(r => r.route.includes(latencyCity)),
    [latencyCity],
  )

  const avgUtil = useMemo(
    () => filteredLinks.length ? Math.round(filteredLinks.reduce((s, l) => s + l.util, 0) / filteredLinks.length) : 0,
    [filteredLinks],
  )

  const totalCapTbps = useMemo(
    () => (CORE_LINKS.reduce((s, l) => s + l.capGbps, 0) / 1000).toFixed(1),
    [],
  )

  const ragC = (r: string) =>
    r === 'Green' || r === 'Low' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' || r === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const sevC = (s: string) =>
    s === 'Low' ? 'bg-blue-100 text-blue-700' : s === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const stC = (s: string) =>
    s === 'Active' ? 'bg-red-100 text-red-700' : s === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : s === 'Watching' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
  const cosC = (c: string) =>
    c === 'Gold' ? 'bg-amber-100 text-amber-700' : c === 'Silver' ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700'

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Transport & IP Backbone')}
        subtitle={tt('DWDM core · IP/MPLS TE · peering & IXP · transit cost · latency · resilience')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{totalCapTbps}{tt(' Tbps · ')}{liveTime}
            </span>
            <Link to="/portal/noc-map" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {tt('NOC Map')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ─────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Transport intelligence"
        models={[
          { name: 'Backbone Capacity Forecaster',  metric: 'MAPE 3.8%',  sub: 'link-level demand 180d' },
          { name: 'Latency Anomaly Detector',       metric: 'recall 0.93', sub: 'RTT degradation early-warning' },
          { name: 'Peering Optimiser',              metric: '−12% cost',  sub: 'transit→PNI migration scorer' },
        ]}
        agentLabel={tt('Run Transport Planner')}
        agentRunningLabel={tt('Modelling…')}
        agentSteps={[
          'Forecast link utilisation on the top 3 congested routes',
          'Simulated SRLG failure on Nassau↔Bimini — 4 unprotected circuits found',
          'Ranked peering expansion candidates by traffic-to-cost ratio',
          'Drafted 400G lambda augment order for Q3 board approval',
        ]}
        agentBlurb={tt('Single telemetry plane across DWDM, IP/MPLS and peering — the capacity model sees the full path, so augmentation decisions are cost-aware, not silo-driven.')}
        decision={{
          title: tt('Augment Nassau↔Bimini and expand Local peering peering to 12×100G'),
          detail: tt('The backbone model forecasts Nassau↔Bimini crossing 85% in Q3 at current growth. Adding a 400G lambda removes the SRLG exposure. Expanding Local peering to 12×100G saves an additional BSD 0.8M/yr in Cogent transit.'),
          impact: tt('eliminates 4-circuit SRLG · saves BSD 0.8M/yr transit'),
          risk: tt('Lambda lead-time 14 weeks — order by end of June'),
          linkTo: '#/portal/transport',
          linkLabel: tt('Open Transport →'),
        }}
        chart={{
          kind: 'area',
          title: tt('National backbone utilisation — quarterly forecast (%)'),
          xKey: 'q',
          unit: '%',
          data: CAPACITY_FORECAST,
          series: [{ key: 'util', name: tt('Avg utilisation'), color: BLUE }],
          note: tt('Q4-26 forecast crosses 85% threshold without augmentation — order window is now.'),
        }}
      />

      {/* Alert banner */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Nassau↔Bimini 82% · Local peering peering 84% · Amsterdam ring unprotected')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Active EVT-001 · lambda augment order pending board approval · 4 B2B circuits at SRLG risk')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Capacity & Capex →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab nav — pill style */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ══ BACKBONE ══════════════════════════════════════════════════════════ */}
      {tab === 'backbone' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total core capacity')} value={`${totalCapTbps} Tbps`}  delta={tt('DWDM + submarine')}       trend="flat" icon={Cable}        accent />
          <KpiCard label={tt('Peak link util')}        value="82%"                     delta={tt('Nassau↔Bimini — watch')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Protected links')}       value="5 / 6"                   delta={tt('Amsterdam single-path')}    trend="flat" icon={ShieldCheck}   />
          <KpiCard label={tt('Avg util (filter)')}     value={`${avgUtil}%`}           delta={tt('filtered set')}         trend="flat" icon={Gauge}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['All', 'DWDM', 'Submarine'] as const).map(f => (
            <button key={f} onClick={() => setLinkFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                linkFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Core link utilisation (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredLinks} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="link" tick={{ fontSize: 9 }} width={155} />
                  <Tooltip contentStyle={TS} formatter={(v: any, _n: any, p: any) => [`${v}% of ${p.payload.cap} · ${p.payload.type}`, tt('Utilisation')]} />
                  <Bar dataKey="util" radius={[0, 4, 4, 0]}>
                    {filteredLinks.map((l, i) => <Cell key={i} fill={l.util >= 80 ? '#ef4444' : l.util >= 65 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine x={85} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">{tt('Red ≥80% · Amber ≥65% · dashed = 85% threshold')}</div>
          </Panel>

          <Panel title={tt('24h national traffic profile (Gbps)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={TRAFFIC_DAILY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cdn"   name={tt('CDN on-net')} stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.35} />
                  <Area type="monotone" dataKey="trans" name={tt('Transit')}    stackId="1" stroke={AMBER} fill={AMBER} fillOpacity={0.35} />
                  <Area type="monotone" dataKey="total" name={tt('Total')}      stroke={BLUE}  fill={BLUE}  fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('DWDM optical nodes — channel inventory')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Node')}</th>
                  <th className="text-right">{tt('Total channels')}</th>
                  <th className="text-right">{tt('Lit')}</th>
                  <th className="text-right">{tt('Available')}</th>
                  <th className="text-right">{tt('Util %')}</th>
                  <th>{tt('Generation')}</th>
                </tr>
              </thead>
              <tbody>
                {DWDM_CHANNELS.map(n => (
                  <tr key={n.node} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{n.node}</td>
                    <td className="text-right font-mono">{n.channels}</td>
                    <td className="text-right font-mono">{n.lit}</td>
                    <td className={`text-right font-bold ${n.avail <= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>{n.avail}</td>
                    <td className={`text-right font-bold ${Math.round(n.lit / n.channels * 100) >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {Math.round(n.lit / n.channels * 100)}%
                    </td>
                    <td className="text-xs text-vfes-dark/65 font-mono">{n.gen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ PEERING ═══════════════════════════════════════════════════════════ */}
      {tab === 'peering' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Settlement-free ratio')} value="78%"       delta={tt('via PNI + IXP')}           trend="up"   icon={Globe}      accent />
          <KpiCard label={tt('PNI capacity')}           value="5.86 Tbps" delta={tt('Google · Netflix · Meta')} trend="up"   icon={Zap}        />
          <KpiCard label={tt('Local peering IX traffic')}     value="740 Gbps"  delta="+22% YoY"                     trend="up"   icon={Activity}   />
          <KpiCard label={tt('Annual transit saving')} value="BSD 4.1M/yr"  delta={tt('vs. full transit')}        trend="up"   icon={TrendingUp} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['gbps', 'cost'] as const).map(k => (
            <button key={k} onClick={() => setPeeringSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                peeringSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'gbps' ? tt('Traffic') : tt('Cost')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Peering traffic trend — monthly (Gbps)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={PEERING_MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="pni"     name={tt('PNI (free)')}   stackId="1" stroke={BLUE}  fill={BLUE}  fillOpacity={0.35} />
                  <Area type="monotone" dataKey="ixp"     name={tt('IXP')}          stackId="1" stroke={NAVY}  fill={NAVY}  fillOpacity={0.35} />
                  <Area type="monotone" dataKey="transit" name={tt('Paid transit')} stackId="1" stroke={AMBER} fill={AMBER} fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Peering partners — traffic & settlement')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Network (ASN)')}</th>
                    <th>{tt('Type')}</th>
                    <th className="text-right">{tt('Gbps')}</th>
                    <th className="text-right">{tt('$/Mbps')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPeering.map(p => (
                    <tr key={p.asn} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{p.asn}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          p.type === 'Transit' ? 'bg-amber-100 text-amber-700' : p.type === 'PNI' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{tt(p.type)}</span>
                      </td>
                      <td className="text-right font-mono">{p.gbps.toLocaleString('en-BS')}</td>
                      <td className="text-right font-mono">{p.cost > 0 ? `$${p.cost.toFixed(2)}` : tt('free')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B & Enterprise →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Peering share — PNI vs IXP vs Transit')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: tt('PNI'), value: 4860 },
                      { name: tt('IXP'), value: 1360 },
                      { name: tt('Transit'), value: 790 },
                    ]}
                    dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {[BLUE, NAVY, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-3 text-sm">
              <div className="text-xs uppercase font-bold tracking-widest text-vfes-dark/55 mb-2">{tt('Highlights')}</div>
              <p className="text-vfes-dark/75 text-xs">{tt('78% off-net traffic via settlement-free PNI/IXP — saves BSD 4.1M/yr vs full transit.')}</p>
              <p className="text-vfes-dark/75 text-xs">{tt('Netflix PNI handles 1.42 Tbps — largest CDN bilateral; Local peering at 84% needs 4×100G expansion.')}</p>
              <p className="text-vfes-dark/75 text-xs">{tt('Google AS15169 PNI is the largest bilateral at 1.84 Tbps and zero settlement cost.')}</p>
              <Link to="/portal/network" className="mt-2 text-xs font-bold text-vfes-dark hover:underline">{tt('Network topology →')}</Link>
            </div>
          </div>
        </Panel>
      </>)}

      {/* ══ TRANSIT ═══════════════════════════════════════════════════════════ */}
      {tab === 'transit' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Transit unit cost')}  value="$0.35/Mbps" delta={tt('target $0.30 Q4')}      trend="up"   icon={Activity}  accent />
          <KpiCard label={tt('Transit volume')}      value="790 Gbps"   delta="−23% YoY"                   trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Cogent share')}        value="52%"        delta={tt('rebalance pending')}    trend="flat" icon={Globe}      />
          <KpiCard label={tt('Annual transit spend')} value="BSD 3.2M/yr" delta={tt('vs BSD 5.8M FY24')}        trend="up"   icon={Zap}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('IP transit unit cost — $/Mbps monthly trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={TRANSIT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.30, 0.55]} tick={{ fontSize: 11 }} unit=" $" />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`$${v}/Mbps`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="usd" name={tt('$/Mbps')} fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="usd" stroke={BLUE} strokeWidth={2} dot={{ r: 3 }} name={tt('Trend')} />
                  <ReferenceLine y={0.30} stroke={GREEN} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Green dashed = $0.30 FY target · −33% YTD driven by peering migration')}</div>
          </Panel>

          <Panel title={tt('Peering traffic trend — PNI vs IXP vs Transit (Gbps)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={PEERING_MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pni"     name={tt('PNI (free)')}    stroke={BLUE}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="ixp"     name={tt('IXP')}           stroke={NAVY}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="transit" name={tt('Paid transit')}  stroke={AMBER} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-1">{tt('B2B Transit Interconnect')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Enterprise IP transit portfolio · interconnect SLAs · dedicated capacity — in the B2B dashboard.')}</div>
          </div>
          <Link to="/portal/b2b" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open B2B →')}
          </Link>
        </div>
      </>)}

      {/* ══ LATENCY ═══════════════════════════════════════════════════════════ */}
      {tab === 'latency' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Best RTT ANT↔GNT')}  value="12.4 ms" delta={tt('SLA 15 ms')}         trend="up"   icon={Gauge}      accent />
          <KpiCard label={tt('Worst domestic RTT')} value="18.6 ms" delta={tt('GNT→LVN / SLA 20')} trend="flat" icon={Activity}         />
          <KpiCard label={tt('Intl to London')}     value="28.4 ms" delta={tt('SLA 35 ms')}        trend="up"   icon={Globe}             />
          <KpiCard label={tt('SLA breaches (30d)')} value="0"       delta={tt('all routes clean')} trend="up"   icon={ShieldCheck}       />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('City filter:')}</span>
          {['All', 'Nassau', 'Freeport', 'London', 'Frankfurt'].map(r => (
            <button key={r} onClick={() => setLatencyCity(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                latencyCity === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Intraday RTT — Nassau routes (ms)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={LATENCY_24H}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 9 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} unit=" ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="mad_bcn" name={tt('ANT↔GNT')} stroke={BLUE}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mad_bil" name={tt('ANT↔MEC')} stroke={GREEN} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mad_lon" name={tt('ANT↔LON')} stroke={AMBER} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Latency scorecard — RTT / jitter / loss vs SLA')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Route')}</th>
                    <th className="text-right">{tt('RTT (ms)')}</th>
                    <th className="text-right">{tt('SLA (ms)')}</th>
                    <th className="text-right">{tt('Jitter')}</th>
                    <th className="text-right">{tt('Loss %')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLatency.map(r => (
                    <tr key={r.route} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{r.route}</td>
                      <td className={`text-right font-bold font-mono ${
                        r.rtt > r.sla * 0.9 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{r.rtt}</td>
                      <td className="text-right font-mono text-vfes-dark/55">{r.sla}</td>
                      <td className="text-right font-mono text-xs">{r.jitter}</td>
                      <td className={`text-right font-mono text-xs ${r.loss >= 0.05 ? 'text-red-600' : 'text-emerald-600'}`}>{r.loss}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragC(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/noc-map" className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Latency bar — RTT by route (ms)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={LATENCY_MATRIX}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="route" tick={{ fontSize: 9 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} unit=" ms" />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="rtt" name={tt('RTT (ms)')} radius={[4, 4, 0, 0]}>
                  {LATENCY_MATRIX.map((r, i) => <Cell key={i} fill={r.rtt > r.sla * 0.9 ? AMBER : BLUE} />)}
                </Bar>
                <Bar dataKey="sla" name={tt('SLA (ms)')} fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ══ RESILIENCE ════════════════════════════════════════════════════════ */}
      {tab === 'resilience' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Network availability')}   value="99.998%"  delta={tt('30d rolling')}              trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('MTTR')}                    value="22 min"   delta="−38% YoY"                       trend="up"   icon={Gauge}              />
          <KpiCard label={tt('Protected SRLGs')}         value="3 / 5"    delta={tt('2 exposed — review')}        trend="flat" icon={AlertTriangle}       />
          <KpiCard label={tt('Dual-path B2B circuits')} value="84%"      delta={tt('16% at SRLG risk')}          trend="down" icon={Network}             />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Network availability & MTTR — 6 months')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={RESILIENCE_AVAIL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" domain={[99.99, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 50]} tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="r" dataKey="mttr" name={tt('MTTR (min)')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="avail" name={tt('Availability %')} stroke={BLUE} strokeWidth={2.4} dot />
                  <ReferenceLine yAxisId="l" y={99.999} stroke={GREEN} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Green dashed = 99.999% five-nines SLA target')}</div>
          </Panel>

          <Panel title={tt('SRLG register — shared-risk link groups')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('SRLG ID')}</th>
                    <th className="text-right">{tt('Links')}</th>
                    <th className="text-right">{tt('B2B circuits')}</th>
                    <th>{tt('Protected')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RESILIENCE_SRLG.map(s => (
                    <tr key={s.srlg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-semibold">{s.srlg}</td>
                      <td className="text-right font-mono">{s.links}</td>
                      <td className="text-right font-bold">{s.b2bCircuits}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          s.protected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{s.protected ? tt('Yes') : tt('No')}</span>
                      </td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${ragC(s.riskLevel)}`}>{tt(s.riskLevel)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-1">{tt('Resilience review')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('SRLG remediation plan: protect ANT-PEERING ring and LVN-SOUTH — capex BSD 2.4M, eliminates 12 unprotected B2B circuits.')}</div>
          </div>
          <Link to="/portal/capacity-capex" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open Capacity & Capex →')}
          </Link>
        </div>
      </>)}

      {/* ══ IP/MPLS TE ════════════════════════════════════════════════════════ */}
      {tab === 'mpls' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('TE tunnels active')}    value="7"      delta={tt('RSVP-TE + SR-MPLS')}    trend="flat" icon={Network}      accent />
          <KpiCard label={tt('Gold CoS util')}         value="72%"    delta={tt('target <80%')}           trend="up"   icon={Gauge}             />
          <KpiCard label={tt('Traffic engineering')}  value="SR-MPLS" delta={tt('full national')}        trend="flat" icon={Layers}            />
          <KpiCard label={tt('ANT↔MEC TE tunnel')}   value="84%"    delta={tt('above augment threshold')} trend="down" icon={AlertTriangle}   />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('CoS class:')}</span>
          {(['All', 'Gold', 'Silver', 'Bronze'] as const).map(c => (
            <button key={c} onClick={() => setMplsCos(c)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                mplsCos === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(c)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('TE tunnel utilisation (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredMpls} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="te" tick={{ fontSize: 9 }} width={115} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="util" radius={[0, 4, 4, 0]}>
                    {filteredMpls.map((t, i) => <Cell key={i} fill={t.util >= 80 ? '#ef4444' : t.util >= 65 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('MPLS traffic by CoS class — monthly (Gbps)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={MPLS_TRAFFIC}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gold"   name={tt('Gold EF')}   stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.4} />
                  <Area type="monotone" dataKey="silver" name={tt('Silver AF')} stackId="1" stroke={SLATE}  fill={SLATE}  fillOpacity={0.4} />
                  <Area type="monotone" dataKey="bronze" name={tt('Bronze BE')} stackId="1" stroke={GREEN}  fill={GREEN}  fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('TE tunnel register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Tunnel ID')}</th>
                  <th>{tt('Path')}</th>
                  <th className="text-right">{tt('Bandwidth')}</th>
                  <th className="text-right">{tt('Util %')}</th>
                  <th>{tt('Signalling')}</th>
                  <th>{tt('CoS')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMpls.map(t => (
                  <tr key={t.te} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold">{t.te}</td>
                    <td className="text-xs text-vfes-dark/65">{t.path}</td>
                    <td className="text-right font-mono text-xs">{t.bw}</td>
                    <td className={`text-right font-bold ${
                      t.util >= 80 ? 'text-red-600' : t.util >= 65 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{t.util}%</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        t.rsvp ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>{t.rsvp ? 'RSVP-TE' : 'SR-MPLS'}</span>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${cosC(t.cos)}`}>{tt(t.cos)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/inventory" className="font-bold text-vfes-dark hover:underline">{tt('Inventory →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ CAPACITY ══════════════════════════════════════════════════════════ */}
      {tab === 'capacity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Q4-26 forecast util')} value="87%"      delta={tt('above 85% threshold')}   trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Current avg util')}     value="68%"      delta={tt('all backbone links')}   trend="flat" icon={Gauge}               />
          <KpiCard label={tt('Headroom today')}       value="32%"      delta={tt('Q4-26 only 13%')}       trend="down" icon={TrendingUp}           />
          <KpiCard label={tt('400G lambda order')}    value={tt('Pending')} delta={tt('board approval Q2')} trend="flat" icon={Zap}             />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Backbone utilisation forecast — avg %, with threshold')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={CAPACITY_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[55, 95]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="util" name={tt('Utilisation')} radius={[4, 4, 0, 0]}>
                    {CAPACITY_FORECAST.map((d, i) => <Cell key={i} fill={d.util >= 85 ? '#ef4444' : d.util >= 75 ? AMBER : BLUE} />)}
                  </Bar>
                  <Line type="monotone" dataKey="threshold" name={tt('Threshold 85%')} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Without augmentation, backbone avg crosses 85% threshold in Q4-2026.')}</div>
          </Panel>

          <Panel title={tt('DWDM channel headroom by node')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DWDM_CHANNELS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="node" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="lit"   name={tt('Lit channels')} stackId="b" fill={BLUE}  radius={[0, 0, 0, 0]} />
                  <Bar dataKey="avail" name={tt('Available')}    stackId="b" radius={[4, 4, 0, 0]}>
                    {DWDM_CHANNELS.map((d, i) => <Cell key={i} fill={d.avail <= 4 ? AMBER : '#e5e7eb'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Capacity & CapEx')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Full augmentation queue, NPV model, 400G lambda order workflow and board approval deck.')}</div>
          </div>
          <Link to="/portal/capacity-capex" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open Capacity & CapEx →')}
          </Link>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <Link to="/portal/mobile-ran" className="rounded-xl border border-black/5 bg-white p-4 hover:shadow-md transition">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Mobile RAN')}</div>
            <div className="text-sm font-semibold text-vfes-dark">{tt('RAN capacity & cell utilisation')}</div>
          </Link>
          <Link to="/portal/core-5g" className="rounded-xl border border-black/5 bg-white p-4 hover:shadow-md transition">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('5G Core')}</div>
            <div className="text-sm font-semibold text-vfes-dark">{tt('UPF throughput & session capacity')}</div>
          </Link>
          <Link to="/portal/spectrum" className="rounded-xl border border-black/5 bg-white p-4 hover:shadow-md transition">
            <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Spectrum')}</div>
            <div className="text-sm font-semibold text-vfes-dark">{tt('Band utilisation & re-farming')}</div>
          </Link>
        </div>
      </>)}

      {/* ══ NOC ═══════════════════════════════════════════════════════════════ */}
      {tab === 'noc' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active P1 events')}  value="1"    delta={tt('EVT-001 active')}          trend="down" icon={Bell}          accent />
          <KpiCard label={tt('P1 alarms (7d)')}    value="4"    delta="−2 vs prev week"               trend="up"   icon={AlertTriangle}       />
          <KpiCard label={tt('MTTR')}              value="22 min" delta={tt('target 30 min')}         trend="up"   icon={Gauge}               />
          <KpiCard label={tt('Auto-resolved')}     value="68%" delta={tt('by AIOps correlation')}    trend="up"   icon={Brain}               />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('NOC alarm volume — 7-day trend by priority')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={NOC_ALARMS_7D}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p1" name={tt('P1 Critical')} stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="p2" name={tt('P2 Major')}    stackId="a" fill={AMBER}   radius={[0, 0, 0, 0]} />
                  <Bar dataKey="p3" name={tt('P3 Minor')}    stackId="a" fill={SLATE}   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Active & recent NOC events')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('ID')}</th>
                    <th>{tt('Link')}</th>
                    <th>{tt('Event type')}</th>
                    <th>{tt('Sev')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {NOC_EVENTS.map(e => (
                    <tr key={e.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-bold">{e.id}</td>
                      <td className="text-xs font-semibold">{e.link}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(e.type)}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevC(e.severity)}`}>{tt(e.severity)}</span></td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stC(e.status)}`}>{tt(e.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/noc-map" className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/coverage" className="font-bold text-vfes-dark hover:underline">{tt('Coverage →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-1">{tt('Live NOC Map')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Real-time network event map · AIOps correlation · RCA playbooks · on-call roster.')}</div>
          </div>
          <Link to="/portal/noc-map" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open NOC Map →')}
          </Link>
        </div>
      </>)}

      {/* ── Always-visible quick links section ──────────────────────────────── */}
      <div className="mt-10 border-t border-black/5 pt-6">
        <div className="text-xs uppercase font-bold tracking-widest text-vfes-dark/45 mb-1">{tt('Transport domain — related pages')}</div>
        <p className="text-xs text-vfes-dark/55 mb-4">{tt('Cable Bahamas transport covers the national IP/MPLS & DWDM backbone, international peering at Local peering & LINX, and the transit cost optimisation programme.')}</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link to="/portal/network" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Network')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Core engineering & topology')}</div>
          </Link>
          <Link to="/portal/core-5g" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('5G Core')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('UPF / SMF / AMF health')}</div>
          </Link>
          <Link to="/portal/mobile-ran" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Mobile RAN')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Site & radio access')}</div>
          </Link>
          <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Capacity')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Headroom & build queue')}</div>
          </Link>
          <Link to="/portal/noc-map" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('NOC Map')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Live event map')}</div>
          </Link>
          <Link to="/portal/b2b" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('B2B')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Enterprise circuits & SLAs')}</div>
          </Link>
          <Link to="/portal/ran-energy" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('RAN Energy')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Energy & ESG metrics')}</div>
          </Link>
          <Link to="/portal/cto" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('CTO')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('CTO dashboard')}</div>
          </Link>
        </div>

        {/* Backbone KPI mini summary */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <KpiCard label={tt('Domestic routes clean')} value="7 / 7"    delta={tt('all within SLA')}        trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Total installed Tbps')}  value={`${totalCapTbps} Tbps`} delta={tt('DWDM + submarine')} trend="flat" icon={Cable}      />
          <KpiCard label={tt('Peering ratio')}          value="78%"       delta={tt('settlement-free')}       trend="up"   icon={Globe}       />
        </div>

        {/* Backbone health summary table */}
        <div className="mt-6">
          <Panel title={tt('Backbone health summary — all links')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Link')}</th>
                    <th>{tt('Type')}</th>
                    <th className="text-right">{tt('Capacity')}</th>
                    <th className="text-right">{tt('Util %')}</th>
                    <th className="text-right">{tt('Headroom')}</th>
                    <th>{tt('Protected')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CORE_LINKS.map(l => (
                    <tr key={l.link} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{l.link}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          l.type === 'Submarine' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>{tt(l.type)}</span>
                      </td>
                      <td className="text-right font-mono text-xs">{l.cap}</td>
                      <td className={`text-right font-bold ${l.util >= 80 ? 'text-red-600' : l.util >= 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{l.util}%</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/65">{100 - l.util}%</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          l.protected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{l.protected ? tt('Yes') : tt('No')}</span>
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          l.util >= 80 || !l.protected ? 'bg-red-100 text-red-700' : l.util >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{l.util >= 80 || !l.protected ? tt('High') : l.util >= 65 ? tt('Med') : tt('Low')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/transport" className="font-bold text-vfes-dark hover:underline">{tt('Transport full view →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/inventory" className="font-bold text-vfes-dark hover:underline">{tt('Inventory →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
