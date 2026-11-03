import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Cpu, Activity, Phone, GitBranch, Brain, ChevronRight,
  Layers, Zap, ShieldCheck, Globe, Signal, Gauge, AlertTriangle,
  TrendingUp, Radio,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentAction from '../../components/AgentAction'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Bar, BarChart, Cell,
  AreaChart, Area, ComposedChart, ReferenceLine, PieChart, Pie,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'
const RED    = '#EF4444'

const NFS = [
  { nf: 'AMF',  desc: 'Access & Mobility',     success: 99.94, p95: 14, cpu: 58, mem: 62, instances: 8,  sla: 99.97, status: 'healthy' },
  { nf: 'SMF',  desc: 'Session Management',     success: 99.91, p95: 22, cpu: 64, mem: 58, instances: 8,  sla: 99.97, status: 'healthy' },
  { nf: 'UPF',  desc: 'User Plane',             success: 99.97, p95: 6,  cpu: 71, mem: 74, instances: 16, sla: 99.94, status: 'watch'   },
  { nf: 'AUSF', desc: 'Authentication',         success: 99.98, p95: 9,  cpu: 41, mem: 44, instances: 4,  sla: 99.99, status: 'healthy' },
  { nf: 'UDM',  desc: 'Unified Data Mgmt',      success: 99.96, p95: 11, cpu: 52, mem: 48, instances: 4,  sla: 99.98, status: 'healthy' },
  { nf: 'PCF',  desc: 'Policy Control',         success: 99.89, p95: 28, cpu: 47, mem: 52, instances: 4,  sla: 99.98, status: 'watch'   },
  { nf: 'NRF',  desc: 'NF Repository',          success: 99.99, p95: 4,  cpu: 33, mem: 36, instances: 2,  sla: 99.99, status: 'healthy' },
  { nf: 'NSSF', desc: 'Network Slice Selection', success: 99.99, p95: 3,  cpu: 18, mem: 24, instances: 2,  sla: 99.99, status: 'healthy' },
]

const REG_TREND = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  amf:   99.9 + 0.08 * Math.sin(i / 3) - (i === 14 ? 0.4 : 0),
  voice: 99.7 + 0.12 * Math.sin(i / 4 + 1) - (i === 14 ? 0.6 : 0),
}))

const VOICE = [
  { tech: 'VoLTE',       setup: 99.6, adoption: 88 },
  { tech: 'VoNR',        setup: 98.9, adoption: 34 },
  { tech: 'VoWiFi',      setup: 99.2, adoption: 41 },
  { tech: 'CSFB (legacy)', setup: 97.1, adoption: 6 },
]

const MIGRATION = [
  { phase: 'EPC (4G core)',                    pct: 100, note: 'Legacy — sunset 2028'          },
  { phase: 'NSA (5G non-standalone)',           pct: 100, note: 'On EPC anchor'                 },
  { phase: 'SA (5G standalone) core',          pct: 72,  note: 'Cloud-native, slicing-ready'   },
  { phase: 'EPC → 5GC subscriber cutover',     pct: 58,  note: 'UDM convergence'               },
  { phase: 'IMS-on-5GC (VoNR)',                pct: 34,  note: 'Ramping'                        },
]

// ─── 5G Core capacity & slicing data ─────────────────────────────────────────
const CORE_LATENCY = [
  { h: '00', amf: 2.1, smf: 1.8, upf: 3.2 }, { h: '04', amf: 1.9, smf: 1.6, upf: 2.8 },
  { h: '08', amf: 2.4, smf: 2.1, upf: 3.8 }, { h: '12', amf: 2.8, smf: 2.4, upf: 4.2 },
  { h: '16', amf: 3.2, smf: 2.8, upf: 5.1 }, { h: '18', amf: 3.8, smf: 3.4, upf: 6.2 },
  { h: '20', amf: 3.4, smf: 3.0, upf: 5.6 }, { h: '22', amf: 2.6, smf: 2.2, upf: 4.1 },
]

const SLICE_HEALTH = [
  { slice: 'eMBB — consumer',    sst: 1, subs: '13.2M', dlPeak: '3.84 Tbps', lat: '12 ms',  util: 78, status: 'Healthy' },
  { slice: 'URLLC — B2B/IoT',   sst: 2, subs: '380K',  dlPeak: '0.18 Tbps', lat: '2 ms',   util: 42, status: 'Healthy' },
  { slice: 'MIoT — devices',    sst: 3, subs: '1.2M',  dlPeak: '0.08 Tbps', lat: '50 ms',  util: 28, status: 'Healthy' },
  { slice: 'B2B Enterprise',    sst: 4, subs: '48K',   dlPeak: '0.24 Tbps', lat: '5 ms',   util: 64, status: 'Healthy' },
]

const SLICE_UTIL = [
  { name: 'eMBB',  util: 78, headroom: 22, color: BLUE   },
  { name: 'URLLC', util: 42, headroom: 58, color: GREEN  },
  { name: 'MIoT',  util: 28, headroom: 72, color: AMBER  },
  { name: 'B2B',   util: 64, headroom: 36, color: PURPLE },
]

const SIGNALLING_TREND = [
  { m: 'Jun', amfTPS: 12400, smfTPS: 11800, peak: 14200 },
  { m: 'Jul', amfTPS: 12800, smfTPS: 12200, peak: 14600 },
  { m: 'Aug', amfTPS: 13200, smfTPS: 12600, peak: 15200 },
  { m: 'Sep', amfTPS: 13600, smfTPS: 13000, peak: 15800 },
  { m: 'Oct', amfTPS: 14000, smfTPS: 13400, peak: 16200 },
  { m: 'Nov', amfTPS: 14200, smfTPS: 13800, peak: 16800 },
]

const CAPACITY_HEADROOM = [
  { nf: 'AMF',  current: 14200, capacity: 22000, headroom: 35 },
  { nf: 'SMF',  current: 13800, capacity: 20000, headroom: 31 },
  { nf: 'UPF',  current: 3840,  capacity: 5500,  headroom: 30 },
  { nf: 'PCF',  current: 8400,  capacity: 18000, headroom: 53 },
]

const INCIDENT_LOG = [
  { ts: '2026-11-14 14:02', nf: 'UPF', region: 'BRU', severity: 'P2', duration: '4 min',  impact: '14K sessions',  rca: 'Memory pressure — autoscale triggered' },
  { ts: '2026-10-28 08:22', nf: 'AMF', region: 'GNT', severity: 'P3', duration: '2 min',  impact: '800 regs',      rca: 'Transport link flap — BGP reconverge'  },
  { ts: '2026-10-12 21:45', nf: 'PCF', region: 'NAT', severity: 'P3', duration: '6 min',  impact: '2K policy miss', rca: 'Config push rollback delay'             },
  { ts: '2026-09-30 10:12', nf: 'SMF', region: 'BRU', severity: 'P3', duration: '3 min',  impact: '1K sessions',   rca: 'DB failover — secondary activated'      },
]

const CORE_ROADMAP = [
  { initiative: '5G SA nationwide rollout',     horizon: 'H2-2026', invest: 'BSD 84M', benefit: '5G latency SLA + enterprise slicing', status: 'Active',   pct: 72 },
  { initiative: 'UPF scale-out (summer peak)',  horizon: 'Q1-2027', invest: 'BSD 2.4M', benefit: 'Prevents P2 during roaming surge',   status: 'Active',   pct: 80 },
  { initiative: 'EPC sunset (2G/3G core)',      horizon: 'Q2-2029', invest: 'BSD 18M', benefit: 'OpEx −BSD 1.8M/yr · simplify core',     status: 'Planning', pct: 18 },
  { initiative: 'Cloud-native NF migration',    horizon: 'H1-2027', invest: 'BSD 48M', benefit: 'OpEx −24% · energy −18%',             status: 'Active',   pct: 44 },
  { initiative: 'VoNR rollout (IMS-on-5GC)',    horizon: 'Q2-2027', invest: 'BSD 12M', benefit: 'HD voice · VoNR adoption to 60%',    status: 'Active',   pct: 34 },
  { initiative: 'Open RAN CU/DU cloud-native',  horizon: 'H1-2028', invest: 'BSD 32M', benefit: 'Vendor diversity + OpEx −18%',        status: 'Planning', pct: 12 },
]

type TabId = 'health' | 'registration' | 'voice' | 'migration' | 'slicing' | 'capacity' | 'incidents' | 'roadmap'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'health',       label: 'NF Health',      icon: Cpu       },
  { id: 'registration', label: 'Registration',   icon: Activity  },
  { id: 'voice',        label: 'Voice',          icon: Phone     },
  { id: 'migration',    label: 'Migration',      icon: GitBranch },
  { id: 'slicing',      label: '5G Slicing',     icon: Layers    },
  { id: 'capacity',     label: 'Capacity',       icon: Gauge     },
  { id: 'incidents',    label: 'Incidents',      icon: AlertTriangle },
  { id: 'roadmap',      label: 'Roadmap',        icon: Signal    },
]

export default function Core5GPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('health')
  const [nfFilter, setNfFilter] = useState<string>('All')
  const [sliceView, setSliceView] = useState<'util' | 'headroom'>('util')
  const [liveTime, setLiveTime] = useState<string>('')
  const [migrationSort, setMigrationSort] = useState<'pct' | 'alpha'>('pct')
  const [incidentSeverity, setIncidentSeverity] = useState<string>('All')
  const [capacityNf, setCapacityNf] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredNFs = useMemo(
    () => nfFilter === 'All' ? NFS : NFS.filter(n => n.status === nfFilter),
    [nfFilter],
  )

  const sortedMigration = useMemo(
    () => migrationSort === 'pct' ? [...MIGRATION].sort((a, b) => b.pct - a.pct) : [...MIGRATION].sort((a, b) => a.phase.localeCompare(b.phase)),
    [migrationSort],
  )

  const filteredIncidents = useMemo(
    () => incidentSeverity === 'All' ? INCIDENT_LOG : INCIDENT_LOG.filter(i => i.severity === incidentSeverity),
    [incidentSeverity],
  )

  const filteredCapacityNFs = useMemo(
    () => capacityNf === 'All' ? CAPACITY_HEADROOM : CAPACITY_HEADROOM.filter(n => n.nf === capacityNf),
    [capacityNf],
  )

  const sliceData = useMemo(
    () => SLICE_UTIL.map(s => ({
      ...s,
      bar: sliceView === 'util' ? s.util : s.headroom,
      label: sliceView === 'util' ? tt('Utilisation %') : tt('Headroom %'),
    })),
    [sliceView],
  )

  const statusColor = (s: string) =>
    s === 'healthy' || s === 'Healthy' ? 'bg-emerald-50 text-emerald-700' :
    s === 'watch'   || s === 'Watch'   ? 'bg-amber-50 text-amber-700' :
    'bg-red-50 text-red-700'

  const stP = (s: string) =>
    s === 'Active' ? 'bg-blue-100 text-blue-700' :
    s === 'Planning' ? 'bg-amber-100 text-amber-700' :
    s === 'Planned' ? 'bg-slate-100 text-slate-700' :
    'bg-emerald-100 text-emerald-700'

  const sevColor = (s: string) =>
    s === 'P1' ? 'bg-red-100 text-red-700 font-bold' :
    s === 'P2' ? 'bg-amber-100 text-amber-700 font-bold' :
    'bg-blue-100 text-blue-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('5G Core (SA/NSA) Health')}
        subtitle={tt('Network functions · registration success · VoLTE/VoNR · slices · EPC→5GC migration')}
        actions={
          <div className="flex items-center gap-2">
            {liveTime && (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {tt('Core healthy · ')}{liveTime}
              </span>
            )}
          </div>
        }
      />

      {/* ── ML Insight ──────────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="5G Core intelligence"
        models={[
          { name: 'UPF Load Forecaster',     metric: 'MAPE 4.2%', sub: 'UPF user-plane demand 48h ahead' },
          { name: 'Core Anomaly Detector',   metric: 'F1 0.92',   sub: 'NF error-spike early-warning' },
          { name: 'Slice Capacity Planner',  metric: 'AUC 0.89',  sub: 'slice utilisation overflow prediction' },
        ]}
        agentLabel="Pre-scale UPF"
        agentRunningLabel="Scaling…"
        agentSteps={[
          'Read summer roaming forecast (inbound +3× Jul/Aug)',
          'Projected UPF user-plane load → 88% at peak',
          'Provisioned +2 UPF instances in ANT & GNT regions',
          'Validated no SLA risk — autoscale policy updated',
        ]}
        agentBlurb="The Snowflake telemetry lake feeds real-time UPF CPU, signalling counters, and slice utilisation into the load model — enabling revenue-aware pre-scaling rather than reactive capacity response."
        decision={{
          title: 'Pre-scale UPF before the summer roaming surge',
          detail: 'UPF is at 71% CPU. Inbound roaming traffic peaks 3× in Jul/Aug. Adding 2 instances in ANT and GNT avoids user-plane congestion for both roamers and home subscribers, protecting SLA and NPS.',
          impact: 'protects 99.96% core uptime through peak',
          risk: 'adds ~6% core compute cost for 2 months',
          linkTo: '#/portal/core-5g',
          linkLabel: 'Open 5G Core Health',
        }}
        chart={{
          kind: 'area',
          title: 'UPF signalling TPS trend — 6 months',
          xKey: 'm',
          data: SIGNALLING_TREND,
          series: [
            { key: 'amfTPS',  name: 'AMF TPS',  color: BLUE  },
            { key: 'smfTPS',  name: 'SMF TPS',  color: NAVY  },
            { key: 'peak',    name: 'Peak TPS',  color: AMBER, dashed: true },
          ],
          note: 'Peak signalling trending 16K TPS in Jun — order UPF scale-out by Q2 close.',
        }}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === t.id ? 'text-vfes-dark border-vfes-red' : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ════ NF HEALTH ═══════════════════════════════════════════════════════ */}
      {tab === 'health' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('5G SA core uptime')}    value="99.96%"  delta={tt('3 nines + on control plane')} trend="up"   icon={Cpu}         accent />
            <KpiCard label={tt('Registration success')} value="99.94%"  delta={tt('AMF — last 24h')}             trend="up"   icon={Activity}    />
            <KpiCard label={tt('UPF p95 latency')}      value="6 ms"    delta={tt('user-plane SLA: 10 ms')}      trend="flat" icon={Zap}         />
            <KpiCard label={tt('Peak NF CPU')}          value="71%"     delta={tt('UPF — scale headroom OK')}    trend="flat" icon={Gauge}       />
          </div>

          {/* NF status filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter status:')}</span>
            {['All', 'healthy', 'watch'].map(f => (
              <button key={f} onClick={() => setNfFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  nfFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {tt(f === 'All' ? 'All' : f === 'healthy' ? 'Healthy' : 'Watch')}
              </button>
            ))}
          </div>

          <Panel title={tt('Network function status')}
            action={<AgentAction label="Pre-scale UPF" runningLabel="Scaling…"
              steps={[
                'Read summer roaming forecast (inbound +3× Jul/Aug)',
                'Projected UPF user-plane load → 88% at peak',
                'Provisioned +2 UPF instances in ANT & GNT regions',
                'Validated no SLA risk — autoscale policy updated',
              ]} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('NF')}</th>
                    <th className="px-3 py-2">{tt('Function')}</th>
                    <th className="px-3 py-2 text-right">{tt('Instances')}</th>
                    <th className="px-3 py-2 text-right">{tt('Success %')}</th>
                    <th className="px-3 py-2 text-right">{tt('p95 (ms)')}</th>
                    <th className="px-3 py-2 text-right">{tt('CPU %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Mem %')}</th>
                    <th className="px-3 py-2 text-right">{tt('SLA')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNFs.map(n => (
                    <tr key={n.nf} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono font-bold">{n.nf}</td>
                      <td className="px-3 py-2 text-vfes-dark/70">{tt(n.desc)}</td>
                      <td className="px-3 py-2 text-right font-mono">{n.instances}</td>
                      <td className="px-3 py-2 text-right font-mono">{n.success.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right font-mono">{n.p95}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={n.cpu > 70 ? 'text-amber-600 font-bold' : 'font-mono'}>{n.cpu}%</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={n.mem > 70 ? 'text-amber-600 font-bold' : 'font-mono'}>{n.mem}%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{n.sla}%</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(n.status)}`}>{tt(n.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('UPF at 71% CPU during peak — pre-scale before summer roaming surge.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Core NF latency — 24h profile (ms)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={CORE_LATENCY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit=" ms" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="amf" name="AMF" stroke={BLUE}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="smf" name="SMF" stroke={NAVY}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="upf" name="UPF" stroke={AMBER} strokeWidth={2} dot={false} />
                    <ReferenceLine y={5} stroke={RED} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 5 ms SLA ceiling')}</div>
            </Panel>
          </div>

          <AgentDecision
            title={tt('Pre-scale UPF')}
            label="Pre-scale UPF"
            runningLabel="Scaling…"
            steps={[
              'Read summer roaming forecast (inbound +3× Jul/Aug)',
              'Projected UPF user-plane load → 88% at peak',
              'Provisioned +2 UPF instances in ANT & GNT regions',
              'Validated no SLA risk — autoscale policy updated',
            ]}
            result={{
              headline: 'Pre-scale UPF capacity ahead of the summer roaming surge',
              stats: [
                { label: '5G SA core uptime', value: '99.96%' },
                { label: 'Registration success', value: '99.94%' },
                { label: 'UPF p95 latency', value: '6 ms' },
                { label: 'Peak NF CPU', value: '71%' },
              ],
              findings: [
                'Roaming P&L forecasts a 3× inbound traffic peak in Jul/Aug.',
                'UPF is already at 71% CPU; scaling now avoids user-plane congestion for both roamers and home subscribers.',
              ],
              note: 'Adds ~6% core compute cost for 2 months.',
            }}
            impact="protects 99.96% core uptime through peak"
            risk="adds ~6% core compute cost for 2 months"
            linkTo="#/portal/core-5g"
            linkLabel="Open 5G Core Health"
          />

          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/portal/slicing"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing & MEC →')}</Link>
            <Link to="/portal/operations"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/cto"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
          </div>

          {/* Extra NF summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiCard label={tt('AMF instances active')} value="8"    delta={tt('autoscale max: 12')} trend="flat" icon={Cpu} />
            <KpiCard label={tt('SMF instances active')} value="8"    delta={tt('autoscale max: 12')} trend="flat" icon={Cpu} />
            <KpiCard label={tt('UPF instances active')} value="16"   delta={tt('autoscale max: 24')} trend="flat" icon={Zap} />
            <KpiCard label={tt('NRF availability')}     value="99.99%" delta={tt('service registry')} trend="up" icon={ShieldCheck} />
          </div>

          <div className="mt-4">
            <Panel title={tt('NF CPU & memory heatmap — current snapshot')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={NFS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="nf" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cpu" name={tt('CPU %')} radius={[4, 4, 0, 0]}>
                      {NFS.map((n, i) => <Cell key={i} fill={n.cpu >= 70 ? AMBER : BLUE} />)}
                    </Bar>
                    <Bar dataKey="mem" name={tt('Mem %')} radius={[4, 4, 0, 0]}>
                      {NFS.map((n, i) => <Cell key={i} fill={n.mem >= 70 ? '#ef4444' : GREEN} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Amber = CPU ≥70%  ·  Red = Mem ≥70%  ·  SLA is protected but UPF pre-scale is recommended.')}</div>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link to="/portal/inventory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
                <Link to="/portal/network"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ REGISTRATION ════════════════════════════════════════════════════ */}
      {tab === 'registration' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('AMF registration success')} value="99.94%" delta={tt('last 24h')} trend="up" icon={Activity} accent />
            <KpiCard label={tt('Voice setup success')}       value="99.62%" delta={tt('VoLTE')} trend="up" icon={Phone} />
            <KpiCard label={tt('UE attach success rate')}    value="99.89%" delta={tt('all technologies')} trend="up" icon={Signal} />
            <KpiCard label={tt('14:00 Nassau dip')}          value="−0.4 pp" delta={tt('auto-ticketed NOC')} trend="down" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Registration & voice success — 24h')}>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={REG_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="h" stroke="#999" fontSize={10} interval={3} />
                  <YAxis stroke="#999" fontSize={11} domain={[98.8, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="amf"   stroke={BLUE}  strokeWidth={2.5} dot={false} name={tt('AMF registration')} />
                  <Line type="monotone" dataKey="voice" stroke={GREEN} strokeWidth={2.5} dot={false} name={tt('Voice setup')} />
                  <ReferenceLine x="14:00" stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('14:00 dip correlates with Freeport transport-link flap — auto-ticketed to NOC.')}
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Signalling TPS trend — 6 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={SIGNALLING_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="amfTPS"  stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('AMF TPS')} />
                    <Area type="monotone" dataKey="smfTPS"  stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} name={tt('SMF TPS')} />
                    <Area type="monotone" dataKey="peak"    stroke={AMBER} fill={AMBER} fillOpacity={0.1} name={tt('Peak TPS')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex gap-3">
            <Link to="/portal/noc-map"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            <Link to="/portal/assurance" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label={tt('Total UE registrations / day')} value="48.2M"    delta={tt('+6% YoY')} trend="up"   icon={Activity} />
            <KpiCard label={tt('5G SA registrations / day')}    value="22.4M"    delta={tt('+38% YoY')} trend="up"  icon={Signal} />
            <KpiCard label={tt('Roaming registrations / day')}  value="840K"     delta={tt('summer +3×')} trend="flat" icon={Globe} />
            <KpiCard label={tt('Rejected registrations %')}     value="0.06%"    delta={tt('SLA: <0.10%')} trend="up" icon={ShieldCheck} />
          </div>

          <div className="mt-4">
            <Panel title={tt('Registration KPI scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('KPI')}</th>
                      <th className="px-3 py-2 text-right">{tt('Current')}</th>
                      <th className="px-3 py-2 text-right">{tt('SLA target')}</th>
                      <th className="px-3 py-2">{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { kpi: 'AMF Registration Success',  current: '99.94%', target: '99.90%', ok: true },
                      { kpi: 'Initial Attach Success',    current: '99.89%', target: '99.80%', ok: true },
                      { kpi: 'Tracking Area Update SR',   current: '99.97%', target: '99.90%', ok: true },
                      { kpi: 'Service Request Success',   current: '99.91%', target: '99.85%', ok: true },
                      { kpi: 'PDU Session Establishment', current: '99.86%', target: '99.80%', ok: true },
                      { kpi: 'Registration Reject Rate',  current: '0.06%',  target: '<0.10%', ok: true },
                    ].map(r => (
                      <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold text-xs">{tt(r.kpi)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{r.current}</td>
                        <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.target}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('Pass')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ════ VOICE ═══════════════════════════════════════════════════════════ */}
      {tab === 'voice' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('VoLTE setup success')} value="99.62%" delta={tt('+0.12 pp QoQ')} trend="up" icon={Phone}   accent />
            <KpiCard label={tt('VoNR adoption')}        value="34%"    delta={tt('IMS-on-5GC ramping')} trend="up" icon={Signal} />
            <KpiCard label={tt('VoWiFi adoption')}      value="41%"    delta={tt('WLAN offload')} trend="up" icon={Zap} />
            <KpiCard label={tt('CSFB (legacy)')}        value="6%"     delta={tt('target 0% by 2027')} trend="down" icon={AlertTriangle} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Voice technology — setup success & adoption')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={VOICE}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="tech" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="setup"    fill={NAVY} name={tt('Setup success %')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="adoption" fill={BLUE} name={tt('Adoption %')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('VoNR adoption at 34% and climbing as IMS-on-5GC rolls out; CSFB nearly retired.')}</div>
            </Panel>

            <Panel title={tt('Voice technology scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Technology')}</th>
                      <th className="px-3 py-2 text-right">{tt('Setup success %')}</th>
                      <th className="px-3 py-2 text-right">{tt('Adoption %')}</th>
                      <th className="px-3 py-2">{tt('Trend')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VOICE.map(v => (
                      <tr key={v.tech} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{v.tech}</td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${v.setup >= 99.5 ? 'text-emerald-600' : v.setup >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{v.setup}%</td>
                        <td className="px-3 py-2 text-right font-mono">{v.adoption}%</td>
                        <td className="px-3 py-2 text-xs">
                          {v.tech === 'CSFB (legacy)'
                            ? <span className="text-red-600 font-bold">{tt('Retiring')}</span>
                            : <span className="text-emerald-600 font-bold">{tt('Growing')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-3">
                <Link to="/portal/mobile-ran"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
                <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Voice strategy')}</div>
              <div className="text-sm text-vfes-dark/80">
                {tt('VoNR is the 5G HD-voice cornerstone. Reaching 60% adoption by Q2-2027 requires IMS-on-5GC rollout to 80% of 5G SA cells. VoWiFi offload absorbs indoor-coverage gaps while rollout continues.')}</div>
            </div>
            <Link to="/portal/slicing" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0 ml-4">
              <Layers className="w-4 h-4" />{tt('Open Slicing →')}</Link>
          </div>
        </>
      )}

      {/* ════ MIGRATION ═══════════════════════════════════════════════════════ */}
      {tab === 'migration' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('5G SA core progress')}         value="72%"  delta={tt('cloud-native, slicing-ready')} trend="up"   icon={GitBranch} accent />
            <KpiCard label={tt('Subscriber cutover to 5GC')}   value="58%"  delta={tt('UDM convergence in progress')} trend="up"   icon={Signal} />
            <KpiCard label={tt('VoNR (IMS-on-5GC) progress')}  value="34%"  delta={tt('critical path to HD voice')} trend="up"   icon={Phone} />
            <KpiCard label={tt('EPC sunset target')}           value="2028" delta={tt('OpEx −BSD 1.8M/yr on sunset')} trend="flat" icon={Cpu} />
          </div>

          <Panel title={tt('EPC → 5G Core migration progress')}>
            <div className="space-y-3">
              {MIGRATION.map(m => (
                <div key={m.phase} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{tt(m.phase)}</span>
                    <span className="font-mono text-xs">{m.pct}%</span>
                  </div>
                  <div className="h-2 rounded bg-black/5 overflow-hidden">
                    <div className="h-full rounded bg-vfes-red" style={{ width: `${m.pct}%` }} />
                  </div>
                  <div className="text-[11px] text-vfes-dark/55 mt-0.5">{tt(m.note)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('SA core at 72% — subscriber cutover is the critical path to slicing & VoNR monetisation.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Migration milestones — progress by phase')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={MIGRATION} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="phase" stroke="#999" fontSize={9} width={200}
                      tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + '…' : v} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Progress')]} />
                    <Bar dataKey="pct" name={tt('Progress %')} radius={[0, 4, 4, 0]}>
                      {MIGRATION.map((m, i) => <Cell key={i} fill={m.pct === 100 ? GREEN : m.pct >= 60 ? BLUE : AMBER} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/portal/network"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
            <Link to="/portal/slicing"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing →')}</Link>
          </div>
        </>
      )}

      {/* ════ 5G SLICING ══════════════════════════════════════════════════════ */}
      {tab === 'slicing' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active slices')}       value="4"          delta={tt('eMBB · URLLC · MIoT · B2B')} trend="flat" icon={Layers} accent />
            <KpiCard label={tt('eMBB peak DL')}        value="3.84 Tbps"  delta={tt('+18% YoY')} trend="up"   icon={Zap} />
            <KpiCard label={tt('URLLC latency')}       value="2 ms"       delta={tt('sub-5 ms SLA met')} trend="up"   icon={Signal} />
            <KpiCard label={tt('B2B enterprise subs')} value="48K"        delta={tt('+12K YoY')} trend="up"   icon={Globe} />
          </div>

          {/* Slice view toggle */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
            {(['util', 'headroom'] as const).map(v => (
              <button key={v} onClick={() => setSliceView(v)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                  sliceView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
                }`}>
                {v === 'util' ? tt('Utilisation') : tt('Headroom')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Slice capacity — utilisation vs headroom')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sliceData} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke="#999" fontSize={11} width={60} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="util"     name={tt('In use %')}   stackId="a" radius={[0, 0, 0, 0]}>
                      {SLICE_UTIL.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                    <Bar dataKey="headroom" name={tt('Headroom %')} stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Slice distribution — DL peak capacity')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'eMBB', value: 3840, fill: BLUE },
                        { name: 'B2B',  value: 240,  fill: PURPLE },
                        { name: 'URLLC', value: 180, fill: GREEN },
                        { name: 'MIoT',  value: 80,  fill: AMBER },
                      ]}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={(d: any) => `${d.name}`}>
                      {[BLUE, PURPLE, GREEN, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} Gbps`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('5G network slice health scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Slice')}</th>
                    <th className="px-3 py-2 text-right">{tt('SST')}</th>
                    <th className="px-3 py-2 text-right">{tt('Subs')}</th>
                    <th className="px-3 py-2 text-right">{tt('DL peak')}</th>
                    <th className="px-3 py-2 text-right">{tt('Latency')}</th>
                    <th className="px-3 py-2 text-right">{tt('Util %')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SLICE_HEALTH.map(s => (
                    <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{s.slice}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.sst}</td>
                      <td className="px-3 py-2 text-right">{s.subs}</td>
                      <td className="px-3 py-2 text-right font-bold">{s.dlPeak}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700">{s.lat}</td>
                      <td className="px-3 py-2 text-right">{s.util}%</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/slicing"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open 5G Slicing & MEC →')}</Link>
              <Link to="/portal/cto"       className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ════ CAPACITY ════════════════════════════════════════════════════════ */}
      {tab === 'capacity' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('UPF throughput peak')} value="3.84 Tbps" delta={tt('+18% YoY')} trend="up"   icon={Zap} accent />
            <KpiCard label={tt('AMF TPS current')}     value="14.2K/s"   delta={tt('headroom 35%')} trend="up"   icon={Activity} />
            <KpiCard label={tt('SMF TPS current')}     value="13.8K/s"   delta={tt('headroom 31%')} trend="up"   icon={Cpu} />
            <KpiCard label={tt('Core sessions active')} value="14.2M"    delta={tt('+8% YoY')} trend="up"   icon={Globe} />
          </div>

          <Panel title={tt('NF capacity headroom — current sessions vs capacity')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={CAPACITY_HEADROOM}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="nf" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current"  fill={BLUE}  name={tt('Current (TPS/Gbps)')} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="capacity" fill={SLATE} name={tt('Capacity ceiling')} radius={[4, 4, 0, 0]} fillOpacity={0.4} />
                  <Line type="monotone" dataKey="headroom" name={tt('Headroom %')} stroke={GREEN} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Signalling TPS trend — 6 months')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={SIGNALLING_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="amfTPS" stroke={BLUE}  strokeWidth={2.4} name={tt('AMF TPS')} dot />
                    <Line type="monotone" dataKey="smfTPS" stroke={NAVY}  strokeWidth={2.0} name={tt('SMF TPS')} dot />
                    <Line type="monotone" dataKey="peak"   stroke={AMBER} strokeWidth={1.6} strokeDasharray="4 4" name={tt('Peak TPS')} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex gap-3">
            <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            <Link to="/portal/ran-energy"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
          </div>
        </>
      )}

      {/* ════ INCIDENTS ═══════════════════════════════════════════════════════ */}
      {tab === 'incidents' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('P1 incidents MTD')}    value="0"    delta={tt('no critical core events')} trend="up"   icon={ShieldCheck} accent />
            <KpiCard label={tt('P2 incidents MTD')}    value="1"    delta={tt('UPF memory spike — 4 min')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('P3 incidents MTD')}    value="3"    delta={tt('auto-resolved')} trend="flat" icon={Activity} />
            <KpiCard label={tt('MTTD avg (minutes)')}  value="2.4"  delta={tt('−40% vs Q2-2026')} trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('5G core incident log — last 90 days')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Timestamp')}</th>
                    <th className="px-3 py-2">{tt('NF')}</th>
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2">{tt('Severity')}</th>
                    <th className="px-3 py-2">{tt('Duration')}</th>
                    <th className="px-3 py-2">{tt('Impact')}</th>
                    <th className="px-3 py-2">{tt('RCA')}</th>
                  </tr>
                </thead>
                <tbody>
                  {INCIDENT_LOG.map(inc => (
                    <tr key={inc.ts} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{inc.ts}</td>
                      <td className="px-3 py-2 font-mono font-bold">{inc.nf}</td>
                      <td className="px-3 py-2 font-mono text-xs">{inc.region}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${sevColor(inc.severity)}`}>{inc.severity}</span></td>
                      <td className="px-3 py-2 font-mono text-xs">{inc.duration}</td>
                      <td className="px-3 py-2 text-xs text-amber-700">{inc.impact}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(inc.rca)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-3">
              <Link to="/portal/operations" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <Link to="/portal/noc-map"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
              <Link to="/portal/assurance"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ════ ROADMAP ═════════════════════════════════════════════════════════ */}
      {tab === 'roadmap' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active initiatives')}    value="4"     delta={tt('of 6 programmes')} trend="up"   icon={Signal} accent />
            <KpiCard label={tt('Cloud-native NF progress')} value="44%" delta={tt('OpEx −24% target')} trend="up" icon={Cpu} />
            <KpiCard label={tt('VoNR rollout progress')} value="34%"   delta={tt('target 60% by Q2-27')} trend="up" icon={Phone} />
            <KpiCard label={tt('EPC sunset budget')}     value="BSD 18M"  delta={tt('Q2-2029 target')} trend="flat" icon={TrendingUp} />
          </div>

          <Panel title={tt('5G Core programme roadmap — FY2026–2027')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Initiative')}</th>
                    <th className="px-3 py-2">{tt('Horizon')}</th>
                    <th className="px-3 py-2 text-right">{tt('Investment')}</th>
                    <th className="px-3 py-2">{tt('Business benefit')}</th>
                    <th className="px-3 py-2">{tt('Progress')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CORE_ROADMAP.map(r => (
                    <tr key={r.initiative} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(r.initiative)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.horizon}</td>
                      <td className="px-3 py-2 text-right font-bold text-xs">{r.invest}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/65">{r.benefit}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded bg-black/5 overflow-hidden">
                            <div className="h-full rounded bg-vfes-red" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="font-mono text-xs">{r.pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stP(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Roadmap progress by initiative (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={CORE_ROADMAP} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="initiative" stroke="#999" fontSize={9} width={200}
                      tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + '…' : v} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Progress')]} />
                    <Bar dataKey="pct" name={tt('Progress %')} radius={[0, 4, 4, 0]}>
                      {CORE_ROADMAP.map((r, i) => <Cell key={i} fill={r.status === 'Active' ? BLUE : r.status === 'Planning' ? AMBER : SLATE} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/portal/cto"           className="text-xs font-bold text-vfes-dark hover:underline">{tt('CTO Roadmap →')}</Link>
            <Link to="/portal/slicing"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Slicing & MEC →')}</Link>
            <Link to="/portal/capacity-capex" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
            <Link to="/portal/mobile-ran"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          </div>
        </>
      )}

      <div className="mt-4 text-[11px] text-vfes-dark/40 border-t border-black/5 pt-3">
        {tt('Source: 5G SA core telemetry · RAN analytics lake · Snowflake Cortex AI scoring · ETSI NFV/MANO KPIs.')}
        {' '}{tt('All metrics 30-day rolling averages unless noted. NF health checks run every 30 s.')}
      </div>

      <AskTheData />

      {/* ── Footer quick-nav ─────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark/55 mb-3">{tt('Related dashboards')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/portal/mobile-ran"    className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Mobile RAN')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('5G/4G coverage · PRB · handover')}</div>
          </Link>
          <Link to="/portal/slicing"       className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('5G Slicing & MEC')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('eMBB · URLLC · MIoT · B2B')}</div>
          </Link>
          <Link to="/portal/capacity-capex" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Capacity & Capex')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Headroom · build pipeline')}</div>
          </Link>
          <Link to="/portal/operations"    className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Operations')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('NOC · incident management')}</div>
          </Link>
          <Link to="/portal/assurance"     className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Assurance')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Quality · SLA compliance')}</div>
          </Link>
          <Link to="/portal/spectrum"      className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('Spectrum Portfolio')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Band holdings · utilisation')}</div>
          </Link>
          <Link to="/portal/noc-map"       className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('NOC Map')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Live site alarms & status')}</div>
          </Link>
          <Link to="/portal/cto"           className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition">
            <div className="font-bold text-sm text-vfes-dark">{tt('CTO Dashboard')}</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Tech roadmap · network strategy')}</div>
          </Link>
        </div>
      </div>

      {/* ── 5G Core summary KPIs ─────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={tt('Total NF instances')} value="50"       delta={tt('AMF+SMF+UPF+PCF+UDM+NRF+NSSF')} trend="flat" icon={Cpu} />
        <KpiCard label={tt('Core DC locations')}  value="3"        delta={tt('ANT · GNT · VAL')} trend="flat" icon={Globe} />
        <KpiCard label={tt('5G SA subscribers')}  value="10.2M"    delta={tt('+2.8M YoY')} trend="up" icon={Signal} />
        <KpiCard label={tt('Core energy kWh/M')}  value="4.2 GWh"  delta={tt('-8% YoY cloud migration')} trend="up" icon={Zap} />
      </div>

      {/* ── 5G Core scorecard table ───────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('5G Core KPI scorecard — national summary')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('KPI')}</th>
                  <th className="px-3 py-2 text-right">{tt('Current')}</th>
                  <th className="px-3 py-2 text-right">{tt('SLA target')}</th>
                  <th className="px-3 py-2 text-right">{tt('YoY')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kpi: '5G SA Core Uptime',          cur: '99.96%', tgt: '99.95%', yoy: '+0.02 pp', ok: true },
                  { kpi: 'AMF Registration Success',   cur: '99.94%', tgt: '99.90%', yoy: '+0.04 pp', ok: true },
                  { kpi: 'UPF p95 Latency',            cur: '6 ms',   tgt: '10 ms',  yoy: 'stable',   ok: true },
                  { kpi: 'Voice Setup Success (VoLTE)', cur: '99.62%', tgt: '99.50%', yoy: '+0.12 pp', ok: true },
                  { kpi: 'Peak NF CPU (UPF)',           cur: '71%',    tgt: '<80%',   yoy: '+8 pp',    ok: true },
                  { kpi: 'eMBB Slice Utilisation',      cur: '78%',    tgt: '<85%',   yoy: '+6 pp',    ok: true },
                  { kpi: 'URLLC Latency SLA',           cur: '2 ms',   tgt: '<5 ms',  yoy: 'stable',   ok: true },
                  { kpi: 'Core Sessions (peak)',        cur: '14.2M',  tgt: '20M cap', yoy: '+8%',      ok: true },
                ].map(r => (
                  <tr key={r.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(r.kpi)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{r.cur}</td>
                    <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.tgt}</td>
                    <td className="px-3 py-2 text-right text-xs">{r.yoy}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('Pass')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-3">
            <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            <Link to="/portal/fraud"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud & Compliance →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Global NF resource heatmap ───────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('NF resource utilisation — CPU & memory across all functions')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={NFS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="nf" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cpu" name={tt('CPU %')} radius={[4, 4, 0, 0]}>
                  {NFS.map((n, i) => <Cell key={i} fill={n.cpu >= 70 ? AMBER : BLUE} />)}
                </Bar>
                <Bar dataKey="mem" name={tt('Mem %')} radius={[4, 4, 0, 0]}>
                  {NFS.map((n, i) => <Cell key={i} fill={n.mem >= 70 ? RED : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Amber = CPU ≥70%. Red = Mem ≥70%. UPF is the only pressured NF — pre-scale recommended before summer peak.')}</div>
        </Panel>
      </div>

      {/* ── Core latency daily profile ────────────────────────────────────── */}
      <div className="mt-4">
        <Panel title={tt('Core NF latency — AMF / SMF / UPF 24h profile (ms)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={CORE_LATENCY}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="h" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit=" ms" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="amf" name="AMF" stroke={BLUE}  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="smf" name="SMF" stroke={NAVY}  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="upf" name="UPF" stroke={AMBER} strokeWidth={2} dot={false} />
                <ReferenceLine y={5} stroke={RED} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red = 5 ms SLA ceiling. UPF peaks at 6.2 ms at 18:00 — within SLA but headroom narrowing.')}</div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/portal/operations" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/noc-map"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            <Link to="/portal/inventory"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 text-[11px] text-vfes-dark/40 border-t border-black/5 pt-3">
        {tt('5G Core metrics: SBA NF telemetry · AMF OAM · NSSF · Snowflake Cortex AI · ETSI TS 28.554. Slice data from PCF/NSSF APIs. All metrics 30-day rolling averages. Refresh every 30 s.')}
        {' '}{tt('SLA targets per 3GPP TS 28.554. UPF SLA: 99.94% uptime · p95 < 10 ms. AMF SLA: 99.97% uptime. Incident log from NOC ticketing. NF autoscaling via NSMF/VNFM.')}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <Link to="/portal/fraud"      className="font-bold text-vfes-dark hover:underline">{tt('Fraud & Compliance →')}</Link>
        <Link to="/portal/inventory"  className="font-bold text-vfes-dark hover:underline">{tt('Site Inventory →')}</Link>
        <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
      </div>

      <AskTheData />
    </div>
  )
}
