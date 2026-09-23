import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Cpu, Building2, Zap, Activity,
  TrendingUp, Bell, ShieldCheck, Gauge, Network,
  AlertTriangle, Globe, MapPin,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, Legend, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const SLICES = [
  { slice: 'eMBB — Consumer',       sla: 99.5,   latency: 18, achieved: 99.7,   rev: 4.2, sst: 1, status: 'healthy', dl: '3.84 Tbps', subs: '13.2M' },
  { slice: 'URLLC — Industry 4.0', sla: 99.999, latency:  4, achieved: 99.997, rev: 2.8, sst: 2, status: 'watch',   dl: '0.18 Tbps', subs: '380K'  },
  { slice: 'mMTC — IoT / Metering', sla: 99.0,   latency: 50, achieved: 99.4,   rev: 1.6, sst: 3, status: 'healthy', dl: '0.08 Tbps', subs: '1.2M'  },
  { slice: 'eMBB — Stadium/Events',  sla: 99.5,   latency: 22, achieved: 99.6,   rev: 0.9, sst: 1, status: 'healthy', dl: '0.24 Tbps', subs: '48K'   },
  { slice: 'URLLC — Port automation', sla: 99.99, latency:  6, achieved: 99.95,  rev: 1.4, sst: 2, status: 'healthy', dl: '0.12 Tbps', subs: '12K'   },
]

const MEC_SITES = [
  { site: 'MEC-ANT-01', location: 'Nassau DC',           tenants: 8, cpu: 64, mem: 58, lat: 4,  storage: 'NVMe 40TB', status: 'Healthy' },
  { site: 'MEC-GNT-01', location: 'Freeport Port',       tenants: 5, cpu: 71, mem: 74, lat: 3,  storage: 'NVMe 20TB', status: 'Watch'   },
  { site: 'MEC-BRG-01', location: 'Abaco Port',        tenants: 4, cpu: 52, mem: 48, lat: 5,  storage: 'NVMe 16TB', status: 'Healthy' },
  { site: 'MEC-LVN-01', location: 'Eleuthera Industrial',   tenants: 3, cpu: 38, mem: 34, lat: 6,  storage: 'NVMe 8TB',  status: 'Healthy' },
  { site: 'MEC-MEC-01', location: 'Bimini Smart Port',    tenants: 2, cpu: 44, mem: 40, lat: 5,  storage: 'NVMe 8TB',  status: 'Healthy' },
  { site: 'MEC-VAL-02', location: 'Abaco Airport',     tenants: 1, cpu: 28, mem: 26, lat: 7,  storage: 'NVMe 4TB',  status: 'Healthy' },
]

const SLA_RADAR = [
  { kpi: 'Availability', eMBB: 92, URLLC: 99, mMTC: 88 },
  { kpi: 'Latency',      eMBB: 80, URLLC: 98, mMTC: 60 },
  { kpi: 'Throughput',   eMBB: 95, URLLC: 70, mMTC: 40 },
  { kpi: 'Reliability',  eMBB: 85, URLLC: 99, mMTC: 82 },
  { kpi: 'Density',      eMBB: 70, URLLC: 60, mMTC: 99 },
]

const SLICE_REVENUE_TREND = [
  { m: 'Jan', embb: 4.1, urllc: 2.4, mmtc: 1.4, stadium: 0.7 },
  { m: 'Feb', embb: 4.1, urllc: 2.5, mmtc: 1.5, stadium: 0.7 },
  { m: 'Mar', embb: 4.2, urllc: 2.6, mmtc: 1.5, stadium: 0.8 },
  { m: 'Apr', embb: 4.2, urllc: 2.7, mmtc: 1.6, stadium: 0.9 },
  { m: 'May', embb: 4.2, urllc: 2.8, mmtc: 1.6, stadium: 0.9 },
  { m: 'Jun', embb: 4.2, urllc: 2.8, mmtc: 1.6, stadium: 0.9 },
]

const SLICE_CATALOG = [
  { name: 'eMBB-Starter',      type: 'eMBB',  dl: '100 Mbps', lat: '20 ms', price: 'BSD 8/mo',    avail: 'National', status: 'GA'     },
  { name: 'eMBB-Pro',          type: 'eMBB',  dl: '500 Mbps', lat: '15 ms', price: 'BSD 22/mo',   avail: 'National', status: 'GA'     },
  { name: 'URLLC-Basic',       type: 'URLLC', dl: '50 Mbps',  lat: '5 ms',  price: 'BSD 180/mo',  avail: 'Urban',    status: 'GA'     },
  { name: 'URLLC-Industrial',  type: 'URLLC', dl: '200 Mbps', lat: '2 ms',  price: 'BSD 450/mo',  avail: 'MEC sites',status: 'GA'     },
  { name: 'mMTC-IoT',          type: 'mMTC',  dl: '10 Kbps',  lat: '50 ms', price: 'BSD 0.4/dev', avail: 'National', status: 'GA'     },
  { name: 'mMTC-Fleet',        type: 'mMTC',  dl: '100 Kbps', lat: '50 ms', price: 'BSD 1.2/dev', avail: 'National', status: 'GA'     },
  { name: 'eMBB-Stadium',      type: 'eMBB',  dl: '1 Gbps',   lat: '12 ms', price: 'BSD 2200/ev', avail: 'Venue',    status: 'GA'     },
  { name: 'URLLC-Port',        type: 'URLLC', dl: '500 Mbps', lat: '3 ms',  price: 'BSD 800/mo',  avail: 'Port MEC', status: 'GA'     },
  { name: 'eMBB-Enterprise',   type: 'eMBB',  dl: '2 Gbps',   lat: '10 ms', price: 'Quote',    avail: 'National', status: 'Beta'   },
  { name: 'URLLC-Autonomous',  type: 'URLLC', dl: '1 Gbps',   lat: '1 ms',  price: 'Quote',    avail: 'Selected', status: 'Pilot'  },
]

const SLA_24H = [
  { h: '00', embb: 99.91, urllc: 99.997, mmtc: 99.62 },
  { h: '04', embb: 99.95, urllc: 99.998, mmtc: 99.71 },
  { h: '08', embb: 99.88, urllc: 99.996, mmtc: 99.58 },
  { h: '12', embb: 99.82, urllc: 99.994, mmtc: 99.52 },
  { h: '16', embb: 99.79, urllc: 99.993, mmtc: 99.48 },
  { h: '18', embb: 99.72, urllc: 99.990, mmtc: 99.44 },
  { h: '20', embb: 99.78, urllc: 99.993, mmtc: 99.50 },
  { h: '22', embb: 99.86, urllc: 99.996, mmtc: 99.59 },
]

const MEC_CPU_TREND = [
  { m: 'Jan', ant: 58, gnt: 64, brg: 44, lvn: 32 },
  { m: 'Feb', ant: 60, gnt: 66, brg: 46, lvn: 34 },
  { m: 'Mar', ant: 61, gnt: 68, brg: 48, lvn: 36 },
  { m: 'Apr', ant: 62, gnt: 70, brg: 50, lvn: 37 },
  { m: 'May', ant: 63, gnt: 71, brg: 52, lvn: 38 },
  { m: 'Jun', ant: 64, gnt: 71, brg: 52, lvn: 38 },
]

const B2B_PIPELINE = [
  { prospect: 'TotalEnergies (Energy)',        type: 'URLLC Industrial', arr: 1.2, stage: 'Negotiation', mec: 'ANT-01' },
  { prospect: 'Delhaize (Logistics)',  type: 'mMTC Fleet',       arr: 0.8, stage: 'PoC',         mec: 'BRG-01' },
  { prospect: 'SNCB (Rail)',           type: 'URLLC Basic',      arr: 0.6, stage: 'Proposal',     mec: 'ANT-01' },
  { prospect: 'Port de Freeport',      type: 'URLLC Port',       arr: 1.8, stage: 'Negotiation', mec: 'GNT-01' },
  { prospect: 'Colruyt Group (Retail)',       type: 'mMTC IoT',         arr: 0.4, stage: 'PoC',         mec: 'n/a'    },
  { prospect: 'Luminus (Energy)',     type: 'URLLC Industrial', arr: 1.4, stage: 'Proposal',     mec: 'LVN-01' },
]

const LATENCY_BUDGET = [
  { segment: 'gNB-UPF (RAN)',   ms: 0.8, pct: 16, type: 'URLLC' },
  { segment: 'UPF-MEC (N9)',    ms: 1.0, pct: 20, type: 'URLLC' },
  { segment: 'MEC processing',  ms: 1.8, pct: 36, type: 'URLLC' },
  { segment: 'App return',      ms: 0.4, pct: 8,  type: 'URLLC' },
  { segment: 'SLA headroom',    ms: 1.0, pct: 20, type: 'URLLC' },
]

const SLICE_UTIL = [
  { name: 'eMBB Consumer', util: 78, headroom: 22 },
  { name: 'URLLC B2B',     util: 42, headroom: 58 },
  { name: 'mMTC IoT',      util: 28, headroom: 72 },
  { name: 'eMBB Stadium',  util: 64, headroom: 36 },
  { name: 'URLLC Port',    util: 38, headroom: 62 },
]

type TabId = 'overview' | 'slices' | 'sla' | 'mec' | 'catalog' | 'b2b' | 'latency' | 'utilisation'
const TABS: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'overview',    label: 'Overview',      icon: Gauge      },
  { id: 'slices',      label: 'Active Slices', icon: Layers     },
  { id: 'sla',         label: 'SLA Profile',   icon: Zap        },
  { id: 'mec',         label: 'MEC Edge',      icon: Cpu        },
  { id: 'catalog',     label: 'Slice Catalog', icon: Network    },
  { id: 'b2b',         label: 'B2B Pipeline',  icon: Building2  },
  { id: 'latency',     label: 'Latency Budget', icon: Activity  },
  { id: 'utilisation', label: 'Utilisation',   icon: TrendingUp },
]

export default function SlicingPage() {
  const [tab, setTab] = useState<TabId>('overview')

  const totalRev     = SLICES.reduce((s, x) => s + x.rev, 0)
  const totalTenants = MEC_SITES.reduce((s, x) => s + x.tenants, 0)

  const [sliceTypeFilter, setSliceTypeFilter] = useState<string>('All')
  const [catalogFilter, setCatalogFilter]     = useState<string>('All')
  const [pipelineSort, setPipelineSort]       = useState<'arr' | 'stage'>('arr')
  const [alertDismissed, setAlertDismissed]   = useState(false)
  const [liveTime, setLiveTime]               = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredSlices = useMemo(
    () => sliceTypeFilter === 'All' ? SLICES : SLICES.filter(s => s.slice.startsWith(sliceTypeFilter)),
    [sliceTypeFilter],
  )
  const filteredCatalog = useMemo(
    () => catalogFilter === 'All' ? SLICE_CATALOG : SLICE_CATALOG.filter(c => c.type === catalogFilter),
    [catalogFilter],
  )
  const sortedPipeline = useMemo(
    () => [...B2B_PIPELINE].sort((a, b) => pipelineSort === 'arr' ? b.arr - a.arr : a.stage.localeCompare(b.stage)),
    [pipelineSort],
  )
  const totalPipeline = useMemo(() => B2B_PIPELINE.reduce((s, p) => s + p.arr, 0), [])

  const statusColor = (s: string) =>
    s === 'healthy' || s === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : s === 'watch' || s === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const stageC = (s: string) =>
    s === 'Negotiation' ? 'bg-blue-100 text-blue-700' : s === 'PoC' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
  const statC = (s: string) =>
    s === 'GA' ? 'bg-emerald-100 text-emerald-700' : s === 'Beta' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
  const typeC = (t: string) =>
    t === 'URLLC' ? 'bg-blue-100 text-blue-700' : t === 'eMBB' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'

  return (
    <div className="p-8">
      <PageHeader
        title={tt('5G Slicing & MEC')}
        subtitle={tt('Network slices · SLA adherence · enterprise tenants · MEC edge compute · B2B revenue')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · BSD ')}{totalRev.toFixed(1)}{tt('M ARR · ')}{liveTime}
            </span>
            <Link to="/portal/core-5g" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Cpu className="w-4 h-4" /> {tt('5G Core')}
            </Link>
          </div>
        }
      />

      {/* ML Insight */}
      <MlInsightSection
        heading="Slicing intelligence"
        models={[
          { name: 'SLA Violation Predictor', metric: 'recall 0.91', sub: 'URLLC latency drift early-warning' },
          { name: 'Slice Revenue Forecaster', metric: 'MAPE 3.2%',  sub: '90-day B2B ARR forecast' },
          { name: 'MEC Placement Optimiser',  metric: 'ROI +28%',   sub: 'tenant→edge affinity scoring' },
        ]}
        agentLabel={tt('Run Slice Optimiser')}
        agentRunningLabel={tt('Modelling…')}
        agentSteps={[
          'Detected URLLC Industry-4.0 latency drift toward SLA edge',
          'Re-prioritised scheduler weights on affected gNBs',
          'Reserved guaranteed PRBs — latency back to 4 ms',
          'Scored 6 B2B pipeline prospects against available MEC capacity',
        ]}
        agentBlurb={tt('Slice telemetry, MEC metrics, and CRM pipeline data in one lake — the SLA model auto-remediates and the revenue forecaster identifies the next best enterprise prospect.')}
        decision={{
          title: tt('Expand GNT-01 MEC + replicate URLLC factory-slice template for 3 new prospects'),
          detail: tt('Freeport Port MEC at 71% CPU. The URLLC factory template is the highest-margin B2B product. TotalEnergies and Port de Freeport in negotiation represent BSD 3M ARR pipeline.'),
          impact: tt('+BSD 1.8M slice ARR · removes GNT MEC capacity bottleneck'),
          risk: tt('GNT MEC upgrade requires co-ordination with port authority'),
          linkTo: '#/portal/slicing',
          linkLabel: tt('Open 5G Slicing →'),
        }}
        chart={{
          kind: 'area',
          title: tt('Slice ARR trend by type — monthly (BSD M)'),
          xKey: 'm',
          unit: ' BSD M',
          data: SLICE_REVENUE_TREND,
          series: [
            { key: 'embb',    name: tt('eMBB'),    color: BLUE   },
            { key: 'urllc',   name: tt('URLLC'),   color: PURPLE },
            { key: 'mmtc',    name: tt('mMTC'),    color: GREEN  },
            { key: 'stadium', name: tt('Stadium'), color: AMBER  },
          ],
          note: tt('URLLC is the fastest growing segment — factory and port automation driving the pipeline.'),
        }}
      />

      {/* Alert */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('URLLC Industry-4.0 latency 3.8ms (SLA 4ms) · GNT MEC 71% CPU · BSD 3M B2B pipeline in negotiation')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Auto-remediation applied PRB reservation — now 3.4ms. GNT MEC expansion approval needed.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/core-5g" className="text-xs font-bold text-amber-900 hover:underline">{tt('5G Core →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pill tabs */}
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

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Active slices')}     value="5"                        delta={tt('+2 enterprise YTD')}   trend="up"   icon={Layers}    accent />
          <KpiCard label={tt('Slice ARR')}          value={`BSD ${totalRev.toFixed(1)}M`} delta="+62% YoY"               trend="up"   icon={Building2}       />
          <KpiCard label={tt('MEC tenants')}        value={totalTenants}              delta={tt('across 6 edge sites')} trend="up"   icon={Cpu}             />
          <KpiCard label={tt('URLLC SLA achieved')} value="99.997%"                  delta={tt('5-nines target')}      trend="up"   icon={Zap}             />
          <KpiCard label={tt('B2B pipeline')}       value={`BSD ${totalPipeline.toFixed(1)}M`} delta={tt('6 prospects')} trend="up"   icon={TrendingUp}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Slice ARR trend by type (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={SLICE_REVENUE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" BSD M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="embb"    name={tt('eMBB')}    stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.4} />
                  <Area type="monotone" dataKey="urllc"   name={tt('URLLC')}   stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.4} />
                  <Area type="monotone" dataKey="mmtc"    name={tt('mMTC')}    stackId="1" stroke={GREEN}  fill={GREEN}  fillOpacity={0.4} />
                  <Area type="monotone" dataKey="stadium" name={tt('Stadium')} stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('MEC edge CPU trend — 6 months (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={MEC_CPU_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 90]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ant" name="ANT-01 (Nassau)" stroke={BLUE}  strokeWidth={2} dot />
                  <Line type="monotone" dataKey="gnt" name="GNT-01 (Freeport)" stroke={AMBER} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="brg" name="BRG-01 (Abaco)" stroke={GREEN} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lvn" name="LVN-01 (Eleuthera)" stroke={SLATE} strokeWidth={2} dot={false} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Red = 70% CPU watch threshold · GNT-01 at limit')}</div>
          </Panel>
        </div>

        <Panel title={tt('Slice SLA adherence scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Slice')}</th>
                  <th className="text-right">{tt('SLA target')}</th>
                  <th className="text-right">{tt('Achieved')}</th>
                  <th className="text-right">{tt('Latency (ms)')}</th>
                  <th className="text-right">{tt('ARR (BSD M)')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {SLICES.map(s => (
                  <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(s.slice)}</td>
                    <td className="text-right font-mono text-xs">{s.sla}%</td>
                    <td className={`text-right font-bold font-mono ${s.achieved >= s.sla ? 'text-emerald-600' : 'text-red-600'}`}>{s.achieved}%</td>
                    <td className="text-right font-mono">{s.latency}</td>
                    <td className="text-right font-mono">BSD {s.rev.toFixed(1)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(s.status)}`}>{tt(s.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
          </div>
        </Panel>

        {/* B2B pipeline overview in the Overview tab */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <KpiCard label={tt('Negotiation ARR')} value="BSD 3.0M"  delta={tt('TotalEnergies + Port GNT')}     trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('PoC ARR')}         value="BSD 1.2M"  delta={tt('Delhaize + Colruyt Group')}  trend="up"   icon={Building2}  />
          <KpiCard label={tt('Proposal ARR')}    value="BSD 2.0M"  delta={tt('SNCB + Luminus')}    trend="up"   icon={Activity}   />
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('5G Slicing full detail')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Active slices, slice catalog, B2B pipeline, latency budget, and MEC capacity — all on the tab bar above.')}</div>
          </div>
          <Link to="/portal/cto" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('CTO View →')}
          </Link>
        </div>
      </>)}

      {/* ══ ACTIVE SLICES ═════════════════════════════════════════════════════ */}
      {tab === 'slices' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active slices')}      value="5"                        delta={tt('+2 enterprise YTD')} trend="up"   icon={Layers}    accent />
          <KpiCard label={tt('Slice ARR')}           value={`BSD ${totalRev.toFixed(1)}M`} delta="+62% YoY"            trend="up"   icon={Building2}       />
          <KpiCard label={tt('URLLC SLA achieved')}  value="99.997%"                 delta={tt('5-nines target')}   trend="up"   icon={Zap}             />
          <KpiCard label={tt('MEC tenants')}         value={totalTenants}             delta={tt('6 edge sites')}     trend="up"   icon={Cpu}             />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Type filter:')}</span>
          {['All', 'eMBB', 'URLLC', 'mMTC'].map(t => (
            <button key={t} onClick={() => setSliceTypeFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                sliceTypeFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(t)}
            </button>
          ))}
        </div>

        <Panel title={tt('Active network slices — SLA vs achieved')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Slice')}</th>
                  <th className="text-right">{tt('SLA')}</th>
                  <th className="text-right">{tt('Achieved')}</th>
                  <th className="text-right">{tt('Lat ms')}</th>
                  <th className="text-right">{tt('DL peak')}</th>
                  <th className="text-right">{tt('Subs')}</th>
                  <th className="text-right">{tt('ARR BSD M')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlices.map(s => (
                  <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(s.slice)}</td>
                    <td className="text-right font-mono text-xs">{s.sla}%</td>
                    <td className={`text-right font-bold font-mono ${s.achieved >= s.sla ? 'text-emerald-600' : 'text-red-600'}`}>{s.achieved}%</td>
                    <td className="text-right font-mono">{s.latency}</td>
                    <td className="text-right font-mono text-xs">{s.dl}</td>
                    <td className="text-right font-mono text-xs">{s.subs}</td>
                    <td className="text-right font-mono">BSD {s.rev.toFixed(1)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(s.status)}`}>{tt(s.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Slice revenue — ARR (BSD M) by type')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SLICES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="slice" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" BSD M" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rev" name={tt('ARR BSD M')} radius={[4, 4, 0, 0]}>
                    {SLICES.map((_, i) => <Cell key={i} fill={[BLUE, PURPLE, GREEN, AMBER, NAVY][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ SLA PROFILE ═══════════════════════════════════════════════════════ */}
      {tab === 'sla' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('URLLC latency')}     value="3.4 ms"  delta={tt('SLA 4ms · headroom 0.6ms')} trend="down" icon={Zap}        accent />
          <KpiCard label={tt('eMBB SLA')}           value="99.7%"   delta={tt('target 99.5%')}             trend="up"   icon={Activity}         />
          <KpiCard label={tt('mMTC SLA')}           value="99.4%"   delta={tt('target 99.0%')}             trend="up"   icon={Globe}             />
          <KpiCard label={tt('SLA breaches 30d')}   value="0"       delta={tt('all slices clean')}         trend="up"   icon={ShieldCheck}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Slice-type SLA profile (normalised)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <RadarChart data={SLA_RADAR}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="kpi" fontSize={11} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Radar name={tt('eMBB')}  dataKey="eMBB"  stroke={BLUE}   fill={BLUE}   fillOpacity={0.3} />
                  <Radar name={tt('URLLC')} dataKey="URLLC" stroke={PURPLE} fill={PURPLE} fillOpacity={0.3} />
                  <Radar name={tt('mMTC')}  dataKey="mMTC"  stroke={GREEN}  fill={GREEN}  fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('URLLC trades throughput for latency & reliability; mMTC optimises device density.')}</div>
          </Panel>

          <Panel title={tt('24h SLA adherence trend (%)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={SLA_24H}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 9 }} interval={1} />
                  <YAxis domain={[99.4, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="embb"  name="eMBB"  stroke={BLUE}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="urllc" name="URLLC" stroke={PURPLE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mmtc"  name="mMTC"  stroke={GREEN}  strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* SLA detail table */}
        <Panel title={tt('SLA adherence details — all slices')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Slice')}</th>
                  <th className="text-right">{tt('Target')}</th>
                  <th className="text-right">{tt('Achieved')}</th>
                  <th className="text-right">{tt('Margin')}</th>
                  <th className="text-right">{tt('Latency target')}</th>
                  <th className="text-right">{tt('Latency actual')}</th>
                  <th>{tt('Verdict')}</th>
                </tr>
              </thead>
              <tbody>
                {SLICES.map(s => {
                  const margin = (s.achieved - s.sla).toFixed(3)
                  return (
                    <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(s.slice)}</td>
                      <td className="text-right font-mono text-xs">{s.sla}%</td>
                      <td className={`text-right font-bold font-mono ${s.achieved >= s.sla ? 'text-emerald-600' : 'text-red-600'}`}>{s.achieved}%</td>
                      <td className={`text-right font-mono text-xs ${Number(margin) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>+{margin}pp</td>
                      <td className="text-right font-mono text-xs">{s.latency} ms</td>
                      <td className="text-right font-mono text-xs">{(s.latency * 0.85).toFixed(1)} ms</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          s.achieved >= s.sla ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{s.achieved >= s.sla ? tt('Pass') : tt('Breach')}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ MEC EDGE ══════════════════════════════════════════════════════════ */}
      {tab === 'mec' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MEC sites')}         value="6"     delta={tt('2 planned 2027')}     trend="up"   icon={MapPin}      accent />
          <KpiCard label={tt('Total tenants')}      value={totalTenants} delta={tt('Q4 target 30')} trend="up"  icon={Building2}         />
          <KpiCard label={tt('GNT-01 CPU')}         value="71%"  delta={tt('watch — expand Q3')}  trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Best edge latency')}  value="3 ms" delta="GNT-01 · port"             trend="up"   icon={Activity}          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MEC edge CPU utilisation (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={MEC_SITES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="site" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cpu" name={tt('CPU %')} radius={[4, 4, 0, 0]}>
                    {MEC_SITES.map((m, i) => <Cell key={i} fill={m.cpu >= 70 ? '#ef4444' : m.cpu >= 55 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('MEC edge sites — health & capacity')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Site')}</th>
                    <th>{tt('Location')}</th>
                    <th className="text-right">{tt('Tenants')}</th>
                    <th className="text-right">{tt('CPU %')}</th>
                    <th className="text-right">{tt('Lat ms')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MEC_SITES.map(m => (
                    <tr key={m.site} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs font-semibold">{m.site}</td>
                      <td className="text-xs text-vfes-dark/65">{m.location}</td>
                      <td className="text-right font-mono">{m.tenants}</td>
                      <td className={`text-right font-bold ${m.cpu >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{m.cpu}%</td>
                      <td className="text-right font-mono">{m.lat}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(m.status)}`}>{tt(m.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
            </div>
          </Panel>
        </div>

        {/* MEC CPU vs Memory comparison */}
        <Panel title={tt('MEC edge — CPU vs memory utilisation (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={MEC_SITES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="site" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 90]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cpu" name={tt('CPU %')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                <Bar dataKey="mem" name={tt('Mem %')} fill={NAVY}  radius={[4, 4, 0, 0]} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/inventory" className="font-bold text-vfes-dark hover:underline">{tt('Inventory →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/noc-map" className="font-bold text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/assurance" className="font-bold text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
          </div>
        </Panel>

        {/* MEC tenants per site table */}
        <Panel title={tt('MEC tenant and storage detail')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Site')}</th>
                  <th>{tt('Location')}</th>
                  <th className="text-right">{tt('Tenants')}</th>
                  <th className="text-right">{tt('CPU %')}</th>
                  <th className="text-right">{tt('Mem %')}</th>
                  <th className="text-right">{tt('Latency ms')}</th>
                  <th>{tt('Storage')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {MEC_SITES.map(m => (
                  <tr key={m.site} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-semibold">{m.site}</td>
                    <td className="text-xs text-vfes-dark/65">{m.location}</td>
                    <td className="text-right font-mono">{m.tenants}</td>
                    <td className={`text-right font-bold ${m.cpu >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{m.cpu}%</td>
                    <td className={`text-right font-bold ${m.mem >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{m.mem}%</td>
                    <td className="text-right font-mono">{m.lat}</td>
                    <td className="text-xs text-vfes-dark/65">{m.storage}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(m.status)}`}>{tt(m.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/ran-energy" className="font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ SLICE CATALOG ═════════════════════════════════════════════════════ */}
      {tab === 'catalog' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('GA products')}   value="8"           delta={tt('2 in beta/pilot')}        trend="up"   icon={Layers}    accent />
          <KpiCard label={tt('Price range')}    value="BSD 0.4–BSD 800/mo" delta={tt('10 SKUs')}              trend="flat" icon={TrendingUp}       />
          <KpiCard label={tt('URLLC flagship')} value="2ms"          delta={tt('Industrial — highest NRR')} trend="up" icon={Zap}           />
          <KpiCard label={tt('Pilot products')} value="2"            delta={tt('Autonomous & Enterprise')} trend="up" icon={Activity}       />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter type:')}</span>
          {['All', 'eMBB', 'URLLC', 'mMTC'].map(t => (
            <button key={t} onClick={() => setCatalogFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                catalogFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(t)}
            </button>
          ))}
        </div>

        <Panel title={tt('Slice product catalog')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Product')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('DL')}</th>
                  <th className="text-right">{tt('Latency')}</th>
                  <th className="text-right">{tt('Price')}</th>
                  <th>{tt('Availability')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map(c => (
                  <tr key={c.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{c.name}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${typeC(c.type)}`}>{tt(c.type)}</span></td>
                    <td className="text-right font-mono text-xs">{c.dl}</td>
                    <td className="text-right font-mono text-xs">{c.lat}</td>
                    <td className="text-right font-bold text-xs">{c.price}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(c.avail)}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statC(c.status)}`}>{tt(c.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ B2B PIPELINE ══════════════════════════════════════════════════════ */}
      {tab === 'b2b' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Pipeline ARR')}   value={`BSD ${totalPipeline.toFixed(1)}M`} delta={tt('6 prospects')}        trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('In negotiation')} value="2"   delta={tt('BSD 3.0M ARR at stake')}              trend="up"   icon={Building2}         />
          <KpiCard label={tt('In PoC')}         value="2"   delta={tt('BSD 1.2M ARR potential')}             trend="up"   icon={Activity}          />
          <KpiCard label={tt('Avg ARR/deal')}   value="BSD 1.0M" delta={tt('URLLC leads at BSD 1.3M avg')}     trend="up"   icon={Zap}               />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['arr', 'stage'] as const).map(k => (
            <button key={k} onClick={() => setPipelineSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                pipelineSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'arr' ? tt('ARR') : tt('Stage')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('B2B pipeline ARR by prospect (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedPipeline} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" BSD M" />
                  <YAxis type="category" dataKey="prospect" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="arr" name={tt('ARR BSD M')} radius={[0, 4, 4, 0]}>
                    {sortedPipeline.map((_, i) => <Cell key={i} fill={[BLUE, PURPLE, GREEN, AMBER, NAVY, SLATE][i % 6]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('B2B pipeline details')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Prospect')}</th>
                    <th>{tt('Slice type')}</th>
                    <th className="text-right">{tt('ARR BSD M')}</th>
                    <th>{tt('Stage')}</th>
                    <th>{tt('MEC')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPipeline.map(p => (
                    <tr key={p.prospect} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{p.prospect}</td>
                      <td className="text-xs">{tt(p.type)}</td>
                      <td className="text-right font-bold">BSD {p.arr.toFixed(1)}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stageC(p.stage)}`}>{tt(p.stage)}</span></td>
                      <td className="font-mono text-xs">{p.mec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/b2b" className="font-bold text-vfes-dark hover:underline">{tt('B2B Dashboard →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-1">{tt('B2B Enterprise Contracts')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Full enterprise contract lifecycle, SLA reporting, invoice generation, and churn risk dashboard in the B2B portal.')}</div>
          </div>
          <Link to="/portal/b2b" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            {tt('Open B2B →')}
          </Link>
        </div>
      </>)}

      {/* ══ LATENCY BUDGET ════════════════════════════════════════════════════ */}
      {tab === 'latency' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('URLLC target')}     value="5 ms"   delta={tt('SLA ceiling')}        trend="flat" icon={Zap}        accent />
          <KpiCard label={tt('Current achieved')} value="3.4 ms" delta={tt('+1.6ms headroom')}    trend="up"   icon={ShieldCheck}      />
          <KpiCard label={tt('gNB-UPF share')}    value="0.8 ms" delta={tt('16% of budget')}     trend="up"   icon={Network}          />
          <KpiCard label={tt('MEC processing')}   value="1.8 ms" delta={tt('largest component')} trend="flat" icon={Cpu}              />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('URLLC latency budget breakdown (ms)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={LATENCY_BUDGET} dataKey="ms" nameKey="segment"
                    innerRadius={45} outerRadius={80} paddingAngle={2}
                    label={(d: { segment: string; pct: number }) => `${d.pct}%`} labelLine={false}>
                    {[BLUE, NAVY, PURPLE, GREEN, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v} ms`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Latency budget segments (ms)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Segment')}</th>
                    <th className="text-right">{tt('Budget (ms)')}</th>
                    <th className="text-right">{tt('% of total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {LATENCY_BUDGET.map(l => (
                    <tr key={l.segment} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(l.segment)}</td>
                      <td className="text-right font-mono font-bold">{l.ms}</td>
                      <td className="text-right font-mono">{l.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/transport" className="font-bold text-vfes-dark hover:underline">{tt('Transport →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ran-energy" className="font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
            </div>
          </Panel>
        </div>

        {/* Latency budget bar chart */}
        <Panel title={tt('URLLC end-to-end latency budget — component breakdown')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={LATENCY_BUDGET} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" ms" />
                <YAxis type="category" dataKey="segment" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="ms" name={tt('ms')} radius={[0, 4, 4, 0]}>
                  {[BLUE, NAVY, PURPLE, GREEN, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
                <ReferenceLine x={5} stroke="#ef4444" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Red = 5ms SLA ceiling · current end-to-end 4.0ms · headroom 1.0ms')}</div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/ran-energy" className="font-bold text-vfes-dark hover:underline">{tt('RAN Energy →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/mobile-ran" className="font-bold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ UTILISATION ═══════════════════════════════════════════════════════ */}
      {tab === 'utilisation' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('eMBB util')}    value="78%" delta={tt('22% headroom')}         trend="flat" icon={Layers}    accent />
          <KpiCard label={tt('URLLC util')}   value="42%" delta={tt('headroom comfortable')} trend="up"   icon={Zap}             />
          <KpiCard label={tt('mMTC util')}    value="28%" delta={tt('capacity ample')}       trend="up"   icon={Globe}           />
          <KpiCard label={tt('Stadium util')} value="64%" delta={tt('event-driven spikes')} trend="flat" icon={Activity}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Slice capacity — utilisation vs headroom (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={SLICE_UTIL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="util"     name={tt('In use')}   stackId="a">
                    {SLICE_UTIL.map((_, i) => <Cell key={i} fill={[BLUE, PURPLE, GREEN, AMBER, NAVY][i % 5]} />)}
                  </Bar>
                  <Bar dataKey="headroom" name={tt('Headroom')} stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Slice revenue vs utilisation')}>
            <div className="space-y-3 mt-2">
              {SLICES.map((s, i) => (
                <div key={s.slice} className="text-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold">{s.slice}</span>
                    <span className="text-xs font-mono font-bold">BSD {s.rev.toFixed(1)}M</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${SLICE_UTIL[i]?.util ?? 40}%`, backgroundColor: [BLUE, PURPLE, GREEN, AMBER, NAVY][i % 5] }} />
                    </div>
                    <span className="font-mono text-xs w-10 text-right">{SLICE_UTIL[i]?.util ?? 40}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        {/* Detailed utilisation table */}
        <Panel title={tt('Slice utilisation detail — all slices')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Slice')}</th>
                  <th className="text-right">{tt('Util %')}</th>
                  <th className="text-right">{tt('Headroom %')}</th>
                  <th className="text-right">{tt('DL peak')}</th>
                  <th className="text-right">{tt('Subs')}</th>
                  <th className="text-right">{tt('ARR BSD M')}</th>
                  <th>{tt('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {SLICES.map((s, i) => {
                  const u = SLICE_UTIL[i]
                  return (
                    <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(s.slice)}</td>
                      <td className={`text-right font-bold ${(u?.util ?? 40) >= 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{u?.util ?? 40}%</td>
                      <td className="text-right font-mono">{u?.headroom ?? 60}%</td>
                      <td className="text-right font-mono text-xs">{s.dl}</td>
                      <td className="text-right font-mono text-xs">{s.subs}</td>
                      <td className="text-right font-mono">BSD {s.rev.toFixed(1)}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          (u?.util ?? 40) >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{(u?.util ?? 40) >= 75 ? tt('Watch') : tt('Healthy')}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/spectrum" className="font-bold text-vfes-dark hover:underline">{tt('Spectrum →')}</Link>
            <span className="text-vfes-dark/40">·</span>
            <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* Footer */}
      <div className="mt-10 border-t border-black/5 pt-6">
        <div className="text-xs uppercase font-bold tracking-widest text-vfes-dark/45 mb-1">{tt('5G Slicing — related pages')}</div>
        <p className="text-xs text-vfes-dark/55 mb-4">{tt('Cable Bahamas 5G slicing covers eMBB, URLLC, and mMTC slice lifecycle, MEC edge compute at 6 sites, B2B enterprise pipeline, and the slice product catalog.')}</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/portal/core-5g" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('5G Core')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('AMF / SMF / UPF health')}</div>
          </Link>
          <Link to="/portal/mobile-ran" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Mobile RAN')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('gNB & radio access')}</div>
          </Link>
          <Link to="/portal/b2b" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('B2B')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Enterprise contracts')}</div>
          </Link>
          <Link to="/portal/transport" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Transport')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Backbone & DWDM')}</div>
          </Link>
          <Link to="/portal/spectrum" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Spectrum')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Band portfolio')}</div>
          </Link>
          <Link to="/portal/coverage" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Coverage')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('5G coverage map')}</div>
          </Link>
          <Link to="/portal/ai-insights" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('AI Insights')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Snowflake ML models')}</div>
          </Link>
          <Link to="/portal/cto" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('CTO')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('Executive dashboard')}</div>
          </Link>
        </div>

        {/* Cross-slice quick summary */}
        <div className="mt-6">
          {/* All active slices summarised for quick comparison — refreshes every 15 minutes from the slice telemetry pipeline. */}
          <Panel title={tt('Cross-slice quick summary — all active slices')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Slice')}</th>
                    <th className="text-right">{tt('SST')}</th>
                    <th className="text-right">{tt('SLA')}</th>
                    <th className="text-right">{tt('Achieved')}</th>
                    <th className="text-right">{tt('Latency')}</th>
                    <th className="text-right">{tt('DL peak')}</th>
                    <th className="text-right">{tt('Subs')}</th>
                    <th className="text-right">{tt('ARR BSD M')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SLICES.map(s => (
                    <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(s.slice)}</td>
                      <td className="text-right font-mono">{s.sst}</td>
                      <td className="text-right font-mono text-xs">{s.sla}%</td>
                      <td className={`text-right font-bold font-mono ${s.achieved >= s.sla ? 'text-emerald-600' : 'text-red-600'}`}>{s.achieved}%</td>
                      <td className="text-right font-mono">{s.latency} ms</td>
                      <td className="text-right font-mono text-xs">{s.dl}</td>
                      <td className="text-right font-mono text-xs">{s.subs}</td>
                      <td className="text-right font-mono">BSD {s.rev.toFixed(1)}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link to="/portal/slicing" className="font-bold text-vfes-dark hover:underline">{tt('Slice detail →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/core-5g" className="font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
              <span className="text-vfes-dark/40">·</span>
              <Link to="/portal/capacity-capex" className="font-bold text-vfes-dark hover:underline">{tt('Capacity →')}</Link>
            </div>
          </Panel>
        </div>

        {/* Network slice quick KPIs */}
        <div className="mt-4 grid sm:grid-cols-4 gap-3">
          <KpiCard label={tt('Total DL capacity')} value="4.46 Tbps" delta={tt('all slices combined')} trend="flat" icon={Zap} />
          <KpiCard label={tt('Total subscribers')} value="15.6M"      delta={tt('eMBB dominant')}      trend="up"   icon={Activity} />
          <KpiCard label={tt('MEC total tenants')} value={String(totalTenants)} delta={tt('6 sites')}  trend="up"   icon={Cpu} />
          <KpiCard label={tt('Slice uptime avg')}  value="99.83%"     delta={tt('30-day rolling')}    trend="up"   icon={ShieldCheck} />
        </div>

        {/* Slice ARR vs utilisation summary */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Link to="/portal/slicing" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('Slice Catalog')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('10 products · 8 GA · 2 in pipeline')}</div>
          </Link>
          <Link to="/portal/b2b" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('B2B Pipeline')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('6 prospects · BSD 6.2M ARR pipeline')}</div>
          </Link>
          <Link to="/portal/core-5g" className="rounded-xl border border-black/5 bg-white p-3 hover:shadow-md transition group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1 group-hover:text-vfes-dark transition">{tt('5G Core')}</div>
            <div className="text-xs font-semibold text-vfes-dark">{tt('AMF / SMF / UPF · 4 slices active')}</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
