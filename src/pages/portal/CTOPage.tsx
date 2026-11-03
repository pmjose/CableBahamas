import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import NET from './_network_facts'
import { ISLANDS } from '../../data/islands'
import { MOBILE_KPIS, MNO_BENCHMARK, VOICE_QUALITY } from './_mobile_data'
import {
  Cpu, Smartphone, Radio, Cable, Server, Layers, Gauge, Network,
  Zap, Signal, Leaf, Activity, TrendingUp, Globe, ShieldCheck,
  AlertTriangle, Bell, GitBranch,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const stP = (s: string) =>
  s === 'Healthy' || s === 'Pass' || s === 'Active' || s === 'Approved'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Watch' || s === 'Degraded' || s === 'Planning' || s === 'Investigating'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

// ─── RAN & Mobile data ───────────────────────────────────────────────────────
// Built from the shared island split so sites sum to the 220-site network.
const RAN_EXTRA: Record<string, { dl5g: number; dl4g: number; nps: number; drop: number }> = {
  'New Providence': { dl5g: 168, dl4g: 42, nps: 42, drop: 0.28 }, 'Grand Bahama': { dl5g: 154, dl4g: 38, nps: 40, drop: 0.32 },
  Abaco: { dl5g: 140, dl4g: 36, nps: 37, drop: 0.48 }, Eleuthera: { dl5g: 138, dl4g: 36, nps: 38, drop: 0.44 },
  Exuma: { dl5g: 128, dl4g: 34, nps: 35, drop: 0.54 }, Andros: { dl5g: 118, dl4g: 32, nps: 33, drop: 0.60 },
  'Other Family Islands': { dl5g: 112, dl4g: 30, nps: 34, drop: 0.62 },
}
const ranRegions = ISLANDS.map(i => ({ region: i.island, cov5g: i.cov5g, sites: i.sites, ...RAN_EXTRA[i.island] }))

const ranVendorMix = [
  { name: 'Ericsson',  value: 38, color: BLUE },
  { name: 'Nokia',     value: 28, color: NAVY },
  { name: 'Huawei',    value: 22, color: AMBER },
  { name: 'Samsung',   value: 12, color: PURPLE },
]

const throughputTrend = [
  { m: 'Jun', dl5g: 148, dl4g: 40, ul5g: 42 },
  { m: 'Jul', dl5g: 152, dl4g: 39, ul5g: 44 },
  { m: 'Aug', dl5g: 156, dl4g: 38, ul5g: 46 },
  { m: 'Sep', dl5g: 160, dl4g: 37, ul5g: 47 },
  { m: 'Oct', dl5g: 164, dl4g: 36, ul5g: 48 },
  { m: 'Nov', dl5g: 168, dl4g: 35, ul5g: 50 },
]

// ─── 5G Core ─────────────────────────────────────────────────────────────────
const coreNodes = [
  { nf: 'AMF', instances: 8,  cpu: 48, mem: 62, sessions: '186K', sla: 99.97, status: 'Healthy' },
  { nf: 'SMF', instances: 8,  cpu: 52, mem: 58, sessions: '13.8M', sla: 99.97, status: 'Healthy' },
  { nf: 'UPF', instances: 16, cpu: 68, mem: 71, sessions: '13.8M', sla: 99.94, status: 'Watch'   },
  { nf: 'PCF', instances: 4,  cpu: 34, mem: 44, sessions: '—',     sla: 99.98, status: 'Healthy' },
  { nf: 'UDM', instances: 4,  cpu: 28, mem: 38, sessions: '—',     sla: 99.99, status: 'Healthy' },
  { nf: 'NSSF',instances: 2,  cpu: 18, mem: 24, sessions: '—',     sla: 99.99, status: 'Healthy' },
]

const sliceHealth = [
  { slice: 'eMBB — consumer', sst: 1, subs: '168K',  dlPeak: '0.42 Tbps', lat: '12 ms', util: 78, status: 'Healthy' },
  { slice: 'URLLC — B2B/IoT', sst: 2, subs: '4.2K',  dlPeak: '0.02 Tbps', lat: '2 ms',  util: 42, status: 'Healthy' },
  { slice: 'MIoT — devices',  sst: 3, subs: '12K',   dlPeak: '0.01 Tbps', lat: '50 ms', util: 28, status: 'Healthy' },
  { slice: 'B2B Enterprise',  sst: 4, subs: '0.6K',  dlPeak: '0.03 Tbps', lat: '5 ms',  util: 64, status: 'Healthy' },
]

const coreLatency = [
  { h: '00', amf: 2.1, smf: 1.8, upf: 3.2 }, { h: '04', amf: 1.9, smf: 1.6, upf: 2.8 },
  { h: '08', amf: 2.4, smf: 2.1, upf: 3.8 }, { h: '12', amf: 2.8, smf: 2.4, upf: 4.2 },
  { h: '16', amf: 3.2, smf: 2.8, upf: 5.1 }, { h: '18', amf: 3.8, smf: 3.4, upf: 6.2 },
  { h: '20', amf: 3.4, smf: 3.0, upf: 5.6 }, { h: '22', amf: 2.6, smf: 2.2, upf: 4.1 },
]

const sliceUtil = [
  { name: 'eMBB', util: 78, headroom: 22, color: BLUE },
  { name: 'URLLC', util: 42, headroom: 58, color: GREEN },
  { name: 'MIoT', util: 28, headroom: 72, color: AMBER },
  { name: 'B2B', util: 64, headroom: 36, color: PURPLE },
]

// ─── Transport / Backbone ────────────────────────────────────────────────────
const backboneLinks = [
  { link: 'Nassau Core ↔ Freeport (4×400G)', util: 72, cap: 1600, type: 'Backbone' },
  { link: 'Nassau Core ↔ Abaco (2×400G)',  util: 64, cap: 800,  type: 'Backbone' },
  { link: 'Nassau ↔ Local peering (8×100G)',        util: 84, cap: 800,  type: 'Peering'  },
  { link: 'Nassau ↔ DE-CIX Frankfurt (2×100G)',    util: 68, cap: 200,  type: 'Intl'     },
  { link: 'Freeport ↔ Eleuthera (2×100G)',     util: 56, cap: 200,  type: 'Backbone' },
  { link: 'Abaco ↔ Eleuthera (2×100G)',      util: 48, cap: 200,  type: 'Backbone' },
  { link: 'Nassau ↔ AMS-IX (1×100G)',         util: 62, cap: 100,  type: 'Peering'  },
]

const trafficDaily = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  total: 2200 + Math.round(Math.sin(i / 3.5) * 800 + (i >= 19 || i <= 2 ? 600 : 0)),
  cdn: 1400 + Math.round(Math.sin(i / 3.5) * 480 + (i >= 19 || i <= 2 ? 380 : 0)),
}))

// ─── Spectrum ────────────────────────────────────────────────────────────────
const spectrumBands = [
  { band: '700 MHz',  mhz: 20,  tech: '4G/5G NSA', util: 92, coverage: 'national', type: 'Sub-1GHz', expiry: '2034' },
  { band: '800 MHz',  mhz: 20,  tech: '4G',         util: 88, coverage: 'national', type: 'Sub-1GHz', expiry: '2030' },
  { band: '1800 MHz', mhz: 40,  tech: '4G/5G DSS',  util: 74, coverage: 'urban',    type: 'Mid-band', expiry: '2032' },
  { band: '2100 MHz', mhz: 60,  tech: '4G',         util: 68, coverage: 'urban',    type: 'Mid-band', expiry: '2031' },
  { band: '2600 MHz', mhz: 40,  tech: '4G TDD',     util: 62, coverage: 'urban',    type: 'Mid-band', expiry: '2033' },
  { band: '3500 MHz', mhz: 100, tech: '5G NR SA',   util: 58, coverage: 'urban',    type: 'Mid-band', expiry: '2036' },
  { band: '26 GHz',   mhz: 400, tech: '5G mmWave',  util: 22, coverage: 'hotspot',  type: 'mmWave',   expiry: '2036' },
]

// ─── Fixed Access (PON) ──────────────────────────────────────────────────────
// Derived from the canonical island split (src/data/islands.ts).
const PON_XGS: Record<string, number> = {
  'New Providence': 38, 'Grand Bahama': 22, 'Abaco': 41, 'Eleuthera': 18, 'Exuma': 15, 'Andros': 12, 'Other Family Islands': 10,
}
const ponBuild = ISLANDS.map(i => ({
  region: i.island, passed: i.homesPassed, target: Math.round(i.homesPassed * 1.07 / 500) * 500,
  take: Math.round(i.fixedSubs / i.homesPassed * 100), xgsPct: PON_XGS[i.island], olts: Math.max(2, Math.round(i.homesPassed / 1200)),
}))

const ponTrend = [
  { m: 'Jun', take: 33, xgs: 24 }, { m: 'Jul', take: 34, xgs: 26 },
  { m: 'Aug', take: 35, xgs: 28 }, { m: 'Sep', take: 36, xgs: 30 },
  { m: 'Oct', take: 37, xgs: 34 }, { m: 'Nov', take: 38, xgs: 38 },
]

// ─── Capacity & Energy ───────────────────────────────────────────────────────
const congestionForecast = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  cells: Math.round(64 + i * 6.8),
  threshold: 85,
}))

const energyTrend = [
  { m: 'Jun', kwh: 0.118, target: 0.100 }, { m: 'Jul', kwh: 0.114, target: 0.100 },
  { m: 'Aug', kwh: 0.112, target: 0.100 }, { m: 'Sep', kwh: 0.108, target: 0.100 },
  { m: 'Oct', kwh: 0.104, target: 0.100 }, { m: 'Nov', kwh: NET.kwhPerGb, target: 0.100 },
]

const energyByTech = [
  { tech: '5G SA sites',  gwh: 8.4,  color: BLUE  },
  { tech: '5G NSA sites', gwh: 12.6, color: NAVY  },
  { tech: '4G only',      gwh: 8.2,  color: AMBER },
  { tech: 'Core & DCs',   gwh: 4.2,  color: GREEN },
]

const capacityHotspots = [
  { site: 'Nassau-Zuid 5G',     cells: 8,  util: 91, risk: 'High', eta: 18  },
  { site: 'Freeport-Centre 5G',    cells: 6,  util: 88, risk: 'High', eta: 24  },
  { site: 'Abaco-Port 5G',     cells: 4,  util: 84, risk: 'Med',  eta: 42  },
  { site: 'Nassau-Airport',    cells: 12, util: 82, risk: 'Med',  eta: 56  },
  { site: 'Eleuthera-Centre',      cells: 3,  util: 78, risk: 'Low',  eta: 72  },
]

// ─── Roadmap & Tech Debt data ─────────────────────────────────────────────────
const roadmapInitiatives = [
  { initiative: '5G SA nationwide rollout',          horizon: 'H2-26',  invest: 'BSD 5.8M',  benefit: '5G latency SLA + enterprise slicing',  status: 'Active',    techDebt: 0  },
  { initiative: 'Open RAN GA (2 regions)',            horizon: 'H1-27',  invest: 'BSD 1.4M',  benefit: 'vendor diversity + opex −18%',         status: 'At-risk',   techDebt: 2  },
  { initiative: 'XGS-PON build 150K premises',       horizon: 'H2-26',  invest: 'BSD 13M' , benefit: 'take-rate +8 pp · churn −15%',         status: 'Active',    techDebt: 0  },
  { initiative: 'Network cloud migration (vRAN)',     horizon: 'H1-27',  invest: 'BSD 1.6M',  benefit: 'opex −24% · energy −18%',              status: 'Planning',  techDebt: 3  },
  { initiative: 'AI-native NOC (AIOps v2)',           horizon: 'H2-26',  invest: 'BSD 0.6M',  benefit: 'MTTD −40% · false-positive −50%',      status: 'Active',    techDebt: 1  },
  { initiative: '400G transport upgrade',             horizon: 'Q1-27',  invest: 'BSD 2.4M',  benefit: 'headroom + resilience',                status: 'Active',    techDebt: 0  },
  { initiative: 'Network digital twin',               horizon: 'H1-27',  invest: 'BSD 0.3M',   benefit: 'planning accuracy +30%',               status: 'Planning',  techDebt: 1  },
]

const techDebtRegister = [
  { domain: 'RAN OSS (Ericsson ENM)',  severity: 'High',   age: 36, remMoM: 'BSD 0.5M/yr',  effort: 'Large', plan: 'Migrate to cloud-native SON by Q4-27'        },
  { domain: '2G/3G legacy core',       severity: 'High',   age: 48, remMoM: 'BSD 0.45M/yr',  effort: 'Large', plan: '2G/3G sunset programme — target Dec-27'       },
  { domain: 'DOCSIS 3.0 nodes',        severity: 'High',   age: 24, remMoM: 'BSD 0.3M/yr',  effort: 'Med',   plan: 'DOCSIS 3.1 upgrade — Rural Out Islands done Q3'          },
  { domain: 'Monolithic BSS',          severity: 'Medium', age: 60, remMoM: 'BSD 0.25M/yr',  effort: 'Large', plan: 'Cerillion microservices migration — H1-28'     },
  { domain: 'IPv4-only MPLS nodes',    severity: 'Medium', age: 18, remMoM: 'BSD 0.1M/yr',  effort: 'Med',   plan: 'SRv6 rollout with Nokia upgrade Q2-27'          },
  { domain: 'IPTV CDN legacy SW',      severity: 'Low',    age: 12, remMoM: 'BSD 0.05M/yr',  effort: 'Small', plan: 'CDN vendor refresh RFP in Q1-27'                },
]

const techDebtTrend = [
  { q: 'Q3-24', debtScore: 48, resolved: 4,  newItems: 2 },
  { q: 'Q4-24', debtScore: 46, resolved: 5,  newItems: 3 },
  { q: 'Q3-25', debtScore: 44, resolved: 6,  newItems: 2 },
  { q: 'Q4-25', debtScore: 42, resolved: 5,  newItems: 1 },
  { q: 'Q1-26', debtScore: 40, resolved: 7,  newItems: 2 },
  { q: 'Q2-26', debtScore: 38, resolved: 6,  newItems: 2 },
  { q: 'Q3-26', debtScore: 36, resolved: 8,  newItems: 1 },
  { q: 'Q4-26', debtScore: 34, resolved: 7,  newItems: 1 },
]

const investAlloc = [
  { cat: 'Fixed/PON',    pct: 54, color: NAVY   },
  { cat: '5G / RAN',     pct: 24, color: BLUE   },
  { cat: 'Transport',    pct: 10, color: GREEN  },
  { cat: 'IT/Platform',  pct:  7, color: AMBER  },
  { cat: 'Tech debt',    pct:  5, color: PURPLE },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'ran' | 'core5g' | 'transport' | 'spectrum' | 'fixed' | 'capacity' | 'roadmap'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',  label: 'Overview',          icon: Gauge     },
  { id: 'ran',       label: 'RAN & Mobile',       icon: Smartphone },
  { id: 'core5g',    label: '5G Core',            icon: Cpu       },
  { id: 'transport', label: 'Transport/Backbone', icon: Cable     },
  { id: 'spectrum',  label: 'Spectrum',           icon: Radio     },
  { id: 'fixed',     label: 'Fixed Access',       icon: Server    },
  { id: 'capacity',  label: 'Capacity/Energy',    icon: Leaf      },
  { id: 'roadmap',   label: 'Roadmap & Tech Debt', icon: GitBranch },
]

export default function CTOPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [ranRegion, setRanRegion] = useState<string>('All')
  const [specSort, setSpecSort] = useState<'util' | 'mhz'>('util')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredRan = useMemo(
    () => ranRegion === 'All' ? ranRegions : ranRegions.filter(r => r.region === ranRegion),
    [ranRegion],
  )

  const sortedSpectrum = useMemo(
    () => [...spectrumBands].sort((a, b) => specSort === 'util' ? b.util - a.util : b.mhz - a.mhz),
    [specSort],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief Technology Officer')}
        subtitle={tt('Office of the CTO · Jonas Adderley · network & technology roadmap · FY2026')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · 0.42 Tbps · ')}{liveTime}
            </span>
            <Link to="/portal/architecture" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Layers className="w-4 h-4" /> {tt('Open Architecture')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Network intelligence"
        models={[
          { name: 'Capacity Forecaster', metric: 'MAPE 4.6%', sub: 'cell-level demand 90d' },
          { name: 'Energy-optimisation Model', metric: '−14% kWh', sub: 'sleep-mode scheduling' },
          { name: 'Anomaly Detector (RAN)', metric: 'recall 0.90', sub: 'degradation early-warning' },
        ]}
        agentLabel="Run Network Planner"
        agentRunningLabel="Modelling…"
        agentSteps={[
          'Forecast demand on the top 1% congested cells',
          'Ranked sites by capacity-gap × revenue exposure',
          'Optimised energy schedule against the SLA floor',
          'Drafted the Q3 capex augmentation list',
        ]}
        agentBlurb="One telemetry lake — RAN, transport, core — lets a single model see the whole path, so capacity planning is revenue-aware instead of siloed."
        decision={{
          title: 'Augment the 142 cells forecast to congest in Q3',
          detail: 'The capacity model projects 142 cells crossing the congestion threshold within 90 days, concentrated in Nassau and Freeport hotspots. Pulling their augmentation forward protects 5G throughput leadership ahead of the summer peak.',
          impact: 'protects 5G NPS · avoids ~BSD 2.1M churn exposure',
          risk: 'Ericsson RU lead-times — order by Q2 close',
          linkTo: '#/portal/capacity-capex',
          linkLabel: 'Open Capacity & Capex',
        }}
        chart={{
          kind: 'area',
          title: '5G population coverage — trajectory to 95% (%)',
          xKey: 'm',
          unit: '%',
          data: [
            { m: 'Jun', cov: 84 }, { m: 'Jul', cov: 85 }, { m: 'Aug', cov: 86.5 },
            { m: 'Sep', cov: 87.8 }, { m: 'Oct', cov: MOBILE_KPIS.cov5gPop }, { m: 'Nov', cov: 90.6 },
          ],
          series: [{ key: 'cov', name: '5G pop coverage', color: BLUE }],
          note: 'On the curve to the 95% Q4 target — Out Islands permits are the swing factor.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('142 cells forecast to congest in Q3 · UPF utilisation 68% (watch) · Local peering peering 84%')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Nassau Zuid and Freeport Patershol critical — augmentation order to Ericsson pending board sign-off. Open RAN interop slipping.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/capacity-capex" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Capacity →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('5G pop coverage')}   value={`${MOBILE_KPIS.cov5gPop}%`}        delta="+3.4 pp YTD"          trend="up"   icon={Signal}  accent />
          <KpiCard label={tt('Active sites')}       value={`${(NET.activeSites/1000).toFixed(1)}K`} delta={`${NET.sharedSites.toLocaleString()} ${tt('shared')}`} trend="flat" icon={Radio} />
          <KpiCard label={tt('Core capacity')}      value={`${NET.coreCapacityTbps} Tbps`}    delta={tt('peak 0.42 Tbps')} trend="up"   icon={Cable}   />
          <KpiCard label={tt('Core uptime')}        value={`${NET.coreUptimePct}%`}            delta={tt('30-day SLA')}     trend="up"   icon={Activity} />
          <KpiCard label={tt('Renewable energy')}   value={`${NET.renewablePct}%`}             delta={tt('Net Zero 2030')}  trend="up"   icon={Leaf}    />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CTO domain')}
            links={[
              { to: 'network',      label: 'Network & Engineering', metric: tt('Core · transport · access health'), icon: Network   },
              { to: 'mobile-ran',   label: 'Mobile RAN',            metric: `${MOBILE_KPIS.cov5gPop}% ${tt('5G · throughput · MOS')}`, icon: Smartphone },
              { to: 'core-5g',      label: '5G Core Health',        metric: tt('AMF/SMF/UPF · slices'),             icon: Cpu       },
              { to: 'transport',    label: 'Transport & Backbone',   metric: `${NET.coreCapacityTbps} Tbps ${tt('core')}`, icon: Cable },
              { to: 'spectrum',     label: 'Spectrum Portfolio',     metric: tt('690 MHz sub-6 + mmWave'),           icon: Radio     },
              { to: 'fixed-access', label: 'Fixed Access (PON)',     metric: tt('XGS-PON build · 140K passed'),    icon: Server    },
              { to: 'slicing',      label: '5G Slicing & MEC',       metric: tt('Enterprise slices · edge'),         icon: Layers    },
              { to: 'ran-energy',   label: 'RAN Energy & ESG',       metric: `${NET.kwhPerGb} kWh/GB`,              icon: Leaf      },
              { to: 'capacity-capex', label: 'Capacity & Capex',    metric: tt('Headroom · build pipeline'),         icon: Gauge     },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Technology roadmap — FY2026')}
              items={[
                { name: '95% 5G pop coverage (DSS + SA)',      owner: tt('CTO Mobile · J. Adderley'), pct: 76, status: 'on-track' },
                { name: '5G SA rollout — Nassau + Freeport',  owner: tt('Core Engineering'),         pct: 88, status: 'on-track' },
                { name: 'Open RAN GA in 2 regions',            owner: tt('RAN Engineering'),          pct: 38, status: 'at-risk'  },
                { name: 'XGS-PON build — 150K premises',       owner: tt('Fixed Access'),             pct: 78, status: 'on-track' },
                { name: 'Network energy efficiency −20%',       owner: tt('Energy & ESG'),             pct: 48, status: 'on-track' },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CTO desk')}
            items={[
              { text: tt('142 cells forecast to congest in Q3 — augmentation order pending'),   level: 'high'   },
              { text: tt('Open RAN vendor interop slipping (Mavenir ↔ Fujitsu)'),               level: 'medium' },
              { text: tt('28 5G sites delayed by planning permits'),                            level: 'medium' },
              { text: tt('Cisco XGS-PON 50G card — 12-month roadmap impact'),                  level: 'low'    },
            ]}
          />
        </div>

        <div className="mt-6">
          <AgendaList
            title={tt('CTO cadence')}
            items={[
              { what: tt('Weekly network design authority'), when: tt('Wed 10:00') },
              { what: tt('Vendor QBR — Ericsson'),           when: tt('Thu 11 Jul') },
              { what: tt('Open RAN steering committee'),     when: tt('Tue 16 Jul') },
              { what: tt('Capex augmentation sign-off'),     when: tt('Fri 28 Jun') },
            ]}
          />
        </div>
      </>)}

      {/* ══════════════ RAN & MOBILE ══════════════════════════════════════════ */}
      {tab === 'ran' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('5G pop coverage')}   value={`${MOBILE_KPIS.cov5gPop}%`}       delta="+3.4 pp YoY"      trend="up"   icon={Signal}     accent />
          <KpiCard label={tt('Median 5G DL')}      value={`${MOBILE_KPIS.avgDLMbps} Mbps`}  delta={tt('+13% YoY')}   trend="up"   icon={Zap}        />
          <KpiCard label={tt('Active sites')}       value={NET.activeSites.toLocaleString()}  delta={tt('220 total')} trend="flat" icon={Radio}     />
          <KpiCard label={tt('Drop-call rate')}     value={`${MOBILE_KPIS.dropCallPct}%`}    delta="-0.08 pp QoQ"     trend="up"   icon={Activity}   />
        </div>

        {/* Region filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Region:')}</span>
          {['All', ...ranRegions.map(r => r.region)].map(r => (
            <button key={r} onClick={() => setRanRegion(r)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${ranRegion === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('5G Coverage & DL Throughput by Region')} insight={{ insight: 'South and Central regions show under 60% 5G coverage while North exceeds 85%, creating a split-tier national network.', action: 'Fast-track 600 MHz NR deployment in the two lagging regions to reach 80% national 5G coverage this FY.', impact: 'Closing the coverage gap enables B2B enterprise rollout in underserved regions, unlocking an estimated BSD 18M in incremental ARR.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredRan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cov5g"  name={tt('5G cov %')}  fill={BLUE} />
                  <Bar dataKey="dl5g"   name={tt('5G DL Mbps')} fill={NAVY} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Median Throughput Trend — 5G vs 4G (Mbps)')} insight={{ insight: '5G median DL throughput has crossed the 180 Mbps FY2026 target line but month-on-month uplift is decelerating.', action: 'Activate n41+n78 carrier aggregation on the top 300 SA sites to sustain throughput trajectory and offload 4G congestion.', impact: 'Dual-band CA adds an estimated 40 Mbps median gain and defers capex on additional spectrum licences.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={throughputTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="dl5g"  name={tt('5G DL')}  stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="dl4g"  name={tt('4G DL')}  stroke={SLATE} strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="ul5g"  name={tt('5G UL')}  stroke={GREEN} strokeWidth={1.6} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={180} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2 uppercase tracking-widest">
              {tt('Dashed line = 180 Mbps FY2026 target')}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('RAN Vendor Mix (sites %)')} insight={{ insight: 'A single vendor holds over 55% of RAN sites, concentrating supply-chain and software-update risk in one supplier.', action: 'Accelerate the open RAN pilot to achieve at least 20% vRAN share across new-build sites within 18 months.', impact: 'Multi-vendor open RAN reduces hardware unit cost by 15–20% and eliminates single-supplier lock-in across the access layer.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={ranVendorMix} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {ranVendorMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('RAN Region Scorecard')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Region')}</th>
                      <th className="text-right">{tt('5G cov %')}</th>
                      <th className="text-right">{tt('DL 5G')}</th>
                      <th className="text-right">{tt('Sites')}</th>
                      <th className="text-right">{tt('NPS')}</th>
                      <th className="text-right">{tt('Drop %')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRan.map(r => (
                      <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold">{r.region}</td>
                        <td className={`text-right font-bold ${r.cov5g >= 90 ? 'text-emerald-600' : r.cov5g >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{r.cov5g}%</td>
                        <td className="text-right font-mono">{r.dl5g} Mbps</td>
                        <td className="text-right font-mono">{r.sites.toLocaleString()}</td>
                        <td className="text-right font-bold">{r.nps}</td>
                        <td className={`text-right ${r.drop > 0.50 ? 'text-red-600 font-bold' : r.drop > 0.38 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.drop}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Mobile RAN →')}</Link>
                <span className="text-[10px] text-vfes-dark/40">{tt('Andros & Family Islands below 90% — permit acceleration in progress')}</span>
              </div>
            </Panel>
          </div>
        </div>

        {/* MNO Benchmark */}
        <Panel title={tt('MNO Benchmark — Cable Bahamas vs competitors')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Metric')}</th>
                  <th className="text-right text-vfes-dark">{tt('Cable Bahamas')}</th>
                  <th className="text-right">{tt('BTC')}</th>
                  <th className="text-right">{tt('Rival ISP A')}</th>
                  <th className="text-right">{tt('Rival ISP B')}</th>
                  <th>{tt('Position')}</th>
                </tr>
              </thead>
              <tbody>
                {MNO_BENCHMARK.map(b => {
                  const best = b.metric.includes('Drop') || b.metric.includes('drop')
                    ? Math.min(b.vfes, b.btc, b.orange, b.digi)
                    : Math.max(b.vfes, b.btc, b.orange, b.digi)
                  const leading = b.vfes === best
                  return (
                    <tr key={b.metric} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{b.metric}</td>
                      <td className={`text-right font-bold ${leading ? 'text-emerald-600' : 'text-vfes-dark'}`}>{b.vfes}</td>
                      <td className="text-right text-vfes-dark/65">{b.btc}</td>
                      <td className="text-right text-vfes-dark/65">{b.orange}</td>
                      <td className="text-right text-vfes-dark/65">{b.digi}</td>
                      <td>
                        {leading
                          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('#1')}</span>
                          : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{tt('Watch')}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Voice quality trend */}
        <div className="mt-6">
          <Panel title={tt('Voice Quality Trend — MOS & Drop-call (12 months)')} insight={{ insight: 'MOS has held above 4.1 for six consecutive months while drop-call rate has declined from 0.6% to below 0.4%.', action: 'Extend VoNR to the 50 highest-congestion sites to protect MOS scores as 4G voice traffic migrates to NR.', impact: 'VoNR rollout at high-traffic sites is projected to cut drop-call events by 35% and reduce CS-fallback load on the core.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={VOICE_QUALITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" domain={[3.9, 4.4]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0.3, 0.7]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="mos"      name={tt('MOS')}        stroke={BLUE}  strokeWidth={2} dot />
                  <Bar  yAxisId="r"                  dataKey="dropPct"  name={tt('Drop-call %')} fill={AMBER} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ 5G CORE ═══════════════════════════════════════════════ */}
      {tab === 'core5g' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Core uptime')}          value={`${NET.coreUptimePct}%`} delta={tt('30-day SLA')}                 trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Active sessions')}       value="186K"                   delta="+8% YoY"                          trend="up"   icon={Activity} />
          <KpiCard label={tt('5G slices active')}      value="4"                        delta={tt('eMBB · URLLC · MIoT · B2B')} trend="flat" icon={Layers} />
          <KpiCard label={tt('UPF peak throughput')}   value="0.42 Tbps"               delta="+18% YoY"                         trend="up"   icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Network Function Health — AMF / SMF / UPF / PCF / UDM')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('NF')}</th>
                    <th className="text-right">{tt('Instances')}</th>
                    <th className="text-right">{tt('CPU %')}</th>
                    <th className="text-right">{tt('Mem %')}</th>
                    <th className="text-right">{tt('SLA')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {coreNodes.map(n => (
                    <tr key={n.nf} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-bold font-mono">{n.nf}</td>
                      <td className="text-right">{n.instances}</td>
                      <td className={`text-right font-bold ${n.cpu >= 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{n.cpu}%</td>
                      <td className={`text-right font-bold ${n.mem >= 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{n.mem}%</td>
                      <td className="text-right font-mono text-xs">{n.sla}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(n.status)}`}>{tt(n.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Core NF Latency — 24h (ms)')} insight={{ insight: 'UPF inter-DC latency spikes above 8 ms during the 20:00–23:00 prime-time window, approaching the URLLC 10 ms SLA ceiling.', action: 'Deploy a second UPF edge instance at the Nassau West site to absorb the evening surge with local user-plane breakout.', impact: 'Edge UPF reduces average latency by 3–4 ms and provides N+1 redundancy required for the URLLC slice SLA.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={coreLatency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="amf" name="AMF" stroke={BLUE}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="smf" name="SMF" stroke={NAVY}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="upf" name="UPF" stroke={AMBER} strokeWidth={2} dot={false} />
                  <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 5 ms SLA ceiling')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('5G Network Slice Health')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Slice')}</th>
                    <th className="text-right">{tt('SST')}</th>
                    <th className="text-right">{tt('Subs')}</th>
                    <th className="text-right">{tt('DL peak')}</th>
                    <th className="text-right">{tt('Latency')}</th>
                    <th className="text-right">{tt('Util %')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sliceHealth.map(s => (
                    <tr key={s.slice} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{s.slice}</td>
                      <td className="text-right font-mono">{s.sst}</td>
                      <td className="text-right">{s.subs}</td>
                      <td className="text-right font-bold">{s.dlPeak}</td>
                      <td className="text-right font-mono text-emerald-700">{s.lat}</td>
                      <td className="text-right">{s.util}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${stP(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <Link to="/portal/slicing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open 5G Slicing & MEC →')}</Link>
              <Link to="/portal/core-5g" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Full Core Health →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Slice Capacity — Utilisation vs Headroom')} insight={{ insight: 'The eMBB slice is at 78% utilisation with only 22% headroom remaining ahead of peak summer demand.', action: 'Pre-provision an additional 20% eMBB capacity block now and configure an auto-scale trigger at 85% to avoid manual intervention.', impact: 'Proactive headroom provisioning guarantees eMBB SLA compliance through peak season and avoids reactive emergency capex.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sliceUtil} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="util"     name={tt('In use')}    stackId="a" radius={[0, 0, 0, 0]}>
                    {sliceUtil.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Bar>
                  <Bar dataKey="headroom" name={tt('Headroom')}  stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ TRANSPORT / BACKBONE ══════════════════════════════════ */}
      {tab === 'transport' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Core capacity')}        value={`${NET.coreCapacityTbps} Tbps`} delta={tt('total installed')}   trend="up"   icon={Cable}       accent />
          <KpiCard label={tt('Peak traffic')}          value="0.42 Tbps"                       delta="+18% YoY"               trend="up"   icon={TrendingUp}  />
          <KpiCard label={tt('Local peering utilisation')}   value="84%"                             delta={tt('watch — threshold')} trend="down" icon={Globe}       />
          <KpiCard label={tt('RPKI ROV coverage')}     value="94%"                             delta="+6 pp YoY"               trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('National Traffic Profile — 24h (Gbps)')} insight={{ insight: 'CDN on-net traffic accounts for over 60% of the 22:00 peak load, confirming strong content-caching efficiency across the backbone.', action: 'Expand CDN cache capacity at the three highest-traffic PoPs to push the on-net ratio above 70% before Q4 peak.', impact: 'Each 5% gain in on-net CDN ratio reduces Local peering transit spend by an estimated BSD 0.9M annually.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={trafficDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="h" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gbps" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cdn"   name={tt('CDN on-net')} stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.4} />
                  <Area type="monotone" dataKey="total" name={tt('Total')}       stackId="2" stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Backbone Link Utilisation (%)')} insight={{ insight: 'The Nassau–Freeport segment is at 84% utilisation, above the 80% watch threshold and the most constrained inter-city link.', action: 'Activate the pre-provisioned 100G lambda on the Nassau–Freeport dark-fibre pair within the next 30 days.', impact: 'Lighting the standby lambda restores 42% headroom at under 10% of the cost of provisioning a new route.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={backboneLinks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="link" tick={{ fontSize: 9 }} width={210} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="util" name={tt('Utilisation')} radius={[0, 4, 4, 0]}>
                    {backboneLinks.map((l, i) => <Cell key={i} fill={l.util >= 80 ? '#ef4444' : l.util >= 70 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Backbone Links — Full Scorecard')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Link')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('Capacity')}</th>
                  <th className="text-right">{tt('Util %')}</th>
                  <th className="text-right">{tt('Headroom')}</th>
                </tr>
              </thead>
              <tbody>
                {backboneLinks.map(l => (
                  <tr key={l.link} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{l.link}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${l.type === 'Peering' ? 'bg-purple-100 text-purple-700' : l.type === 'Intl' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {tt(l.type)}
                      </span>
                    </td>
                    <td className="text-right font-mono">{l.cap} Gbps</td>
                    <td className={`text-right font-bold ${l.util >= 80 ? 'text-red-600' : l.util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{l.util}%</td>
                    <td className="text-right text-emerald-600 font-bold">{100 - l.util}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/transport" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Transport & Backbone →')}</Link>
            <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Nassau↔Local peering flagged for 4×100G expansion')}</span>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ SPECTRUM ══════════════════════════════════════════════ */}
      {tab === 'spectrum' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Sub-6 GHz licensed')}  value="290 MHz" delta={tt('across 6 bands')}        trend="flat" icon={Radio}  accent />
          <KpiCard label={tt('mmWave licensed')}      value="400 MHz" delta={tt('26 GHz · hotspot')}      trend="up"   icon={Signal} />
          <KpiCard label={tt('3500 MHz 5G NR SA')}    value="100 MHz" delta={tt('SA rollout Nassau+Freeport')} trend="up"   icon={Cpu}   />
          <KpiCard label={tt('700 MHz utilisation')}  value="92%"     delta={tt('national coverage anchor')} trend="flat" icon={Globe} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['util', 'mhz'] as const).map(k => (
            <button key={k} onClick={() => setSpecSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${specSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'util' ? tt('Utilisation') : tt('MHz')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Spectrum Utilisation by Band (%)')} insight={{ insight: 'The 2100 MHz band is at 91% utilisation, breaching the 85% re-farming threshold and actively throttling 4G mid-band capacity.', action: 'Initiate WCDMA-to-NR re-farming of 10 MHz at 2100 MHz to reclaim contiguous mid-band capacity for 5G.', impact: 'Re-farming eliminates legacy UMTS opex of approximately BSD 2M per year and adds 10 MHz of NR capacity at zero spectrum cost.' }}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sortedSpectrum}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="band" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="util" name={tt('Utilisation %')} radius={[4, 4, 0, 0]}>
                    {sortedSpectrum.map((b, i) => <Cell key={i} fill={b.util >= 85 ? '#ef4444' : b.util >= 65 ? AMBER : BLUE} />)}
                  </Bar>
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red threshold = 85% — triggers re-farming or augmentation review')}</div>
          </Panel>

          <Panel title={tt('Spectrum Portfolio — Holdings & Expiry')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Band')}</th>
                    <th className="text-right">{tt('MHz')}</th>
                    <th>{tt('Technology')}</th>
                    <th className="text-right">{tt('Util %')}</th>
                    <th>{tt('Coverage')}</th>
                    <th className="text-right">{tt('Expiry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {spectrumBands.map(b => (
                    <tr key={b.band} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-bold font-mono">{b.band}</td>
                      <td className="text-right font-bold">{b.mhz}</td>
                      <td className="text-xs text-vfes-dark/65">{b.tech}</td>
                      <td className={`text-right font-bold ${b.util >= 85 ? 'text-red-600' : b.util >= 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{b.util}%</td>
                      <td className="text-xs">{tt(b.coverage)}</td>
                      <td className="text-right text-xs font-mono">{b.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/spectrum" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Spectrum Portfolio →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ FIXED ACCESS ══════════════════════════════════════════ */}
      {tab === 'fixed' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Premises passed')}   value="140K"     delta={tt('vs 150K EOY target')} trend="up"   icon={Server}    accent />
          <KpiCard label={tt('Fixed subscribers')} value="74.4K"    delta="+0.6K QoQ"                  trend="up"   icon={Activity}  />
          <KpiCard label={tt('Take rate')}          value="53%"      delta="+2 pp QoQ"                  trend="up"   icon={TrendingUp}/>
          <KpiCard label={tt('XGS-PON share')}      value="28%"      delta="+4 pp YoY"                  trend="up"   icon={Zap}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Take Rate Trend — GPON vs XGS-PON (%)')} insight={{ insight: 'XGS-PON share has grown from 18% to 28% year-on-year, signalling accelerating subscriber preference for multi-gigabit tiers.', action: 'Set XGS-PON as the default provisioning technology for all new home-pass activations from Q3 onwards.', impact: 'Universal XGS-PON provisioning reduces future upgrade visit costs by 30% and future-proofs the access layer to 10 Gbps.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ponTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="take" name={tt('Overall take rate')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="xgs"  name={tt('XGS-PON share')}    stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Fixed Access Build — Regional Progress')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Region')}</th>
                    <th className="text-right">{tt('Passed')}</th>
                    <th className="text-right">{tt('Target')}</th>
                    <th className="text-right">{tt('Take %')}</th>
                    <th className="text-right">{tt('XGS %')}</th>
                    <th className="text-right">{tt('OLTs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ponBuild.map(r => (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{r.region}</td>
                      <td className="text-right font-mono text-xs">{r.passed.toLocaleString()}</td>
                      <td className="text-right font-mono text-xs text-vfes-dark/55">{r.target.toLocaleString()}</td>
                      <td className={`text-right font-bold ${r.take >= 38 ? 'text-emerald-600' : r.take >= 32 ? 'text-amber-600' : 'text-red-600'}`}>{r.take}%</td>
                      <td className="text-right">{r.xgsPct}%</td>
                      <td className="text-right font-mono">{r.olts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/fixed-access" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Fixed Access (PON) →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ CAPACITY / ENERGY ═════════════════════════════════════ */}
      {tab === 'capacity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cells congested Q3 forecast')} value="142"                     delta={tt('2% of total fleet')}     trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Energy intensity')}             value={`${NET.kwhPerGb} kWh/GB`} delta="-14% YoY"                   trend="up"   icon={Leaf} />
          <KpiCard label={tt('Renewable energy')}             value={`${NET.renewablePct}%`}  delta={tt('Net Zero 2030 target')}  trend="up"   icon={Zap} />
          <KpiCard label={tt('Network GWh / month')}          value={`${NET.networkGwhMonth}`} delta="-2.1 GWh YoY"               trend="up"   icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cell Congestion Forecast — 12 months (% fleet)')} insight={{ insight: 'The model forecasts congested fleet share hitting the 85% augmentation trigger by month 9 at current traffic growth rates.', action: 'Approve the Q3 node-split programme for the 42 highest-risk sites now to preserve the 90-day build-lead-time buffer.', impact: 'Acting before the trigger threshold avoids reactive procurement at a 20–25% cost premium versus planned capex.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={congestionForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="cells"     name={tt('Congested %')} stroke={AMBER} strokeWidth={2.4} dot />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Augment or refarm required when fleet congestion > 85%')}</div>
          </Panel>

          <Panel title={tt('Energy Intensity Trend — actual vs target (kWh/GB)')} insight={{ insight: 'Actual energy intensity at 0.094 kWh/GB is tracking below the target line for the first time since Q4-24.', action: 'Lock in the efficiency gains by extending AI-driven RAN sleep-mode to the remaining 30% of sites not yet enrolled.', impact: 'Full sleep-mode deployment is projected to cut network energy consumption by a further 1.8 GWh per month.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={energyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0.08, 0.13]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="kwh"    name={tt('Actual kWh/GB')} fill={BLUE} />
                  <Line type="monotone" dataKey="target" name={tt('Target')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Energy Consumption by Technology (GWh / month)')} insight={{ insight: '4G macro remains the largest single energy consumer at over 40% of total network GWh despite a declining share of active traffic.', action: 'Accelerate 3G sunset and consolidate 200 underutilised 4G macros onto adjacent NR-sharing sites to decommission legacy hardware.', impact: 'Decommissioning 3G and macro consolidation is modelled to reduce monthly network energy by approximately 0.8 GWh.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={energyByTech}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" GWh" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="gwh" name={tt('GWh/month')} radius={[4, 4, 0, 0]}>
                    {energyByTech.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Capacity Hotspots — Top Sites by Congestion Risk')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Site')}</th>
                    <th className="text-right">{tt('Cells')}</th>
                    <th className="text-right">{tt('Util %')}</th>
                    <th className="text-right">{tt('Days to threshold')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {capacityHotspots.map(h => (
                    <tr key={h.site} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{h.site}</td>
                      <td className="text-right">{h.cells}</td>
                      <td className={`text-right font-bold ${h.util >= 88 ? 'text-red-600' : h.util >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{h.util}%</td>
                      <td className={`text-right font-mono ${h.eta < 30 ? 'text-red-600 font-bold' : h.eta < 60 ? 'text-amber-600' : ''}`}>{h.eta}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${ragC(h.risk === 'High' ? 'Red' : h.risk === 'Med' ? 'Amber' : 'Green')}`}>
                          {tt(h.risk)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/ran-energy" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open RAN Energy & ESG →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Capacity & Capex')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Augmentation queue, node-split NPV, cell exhaustion radar and Q3 build approval — full operator dashboard.')}
            </div>
          </div>
          <Link to="/portal/capacity-capex" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <GitBranch className="w-4 h-4" />{tt('Open Capacity & Capex →')}
          </Link>
        </div>
      </>)}

      {/* ══════════════ ROADMAP & TECH DEBT ═══════════════════════ */}
      {tab === 'roadmap' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Active initiatives')} value="4"        delta={tt('of 7 on-track')}           trend="up"   icon={TrendingUp}   accent />
          <KpiCard label={tt('Tech-debt score')}    value="34 / 100" delta={tt('−14 pts YTD')}              trend="up"   icon={AlertTriangle}/>
          <KpiCard label={tt('Debt remediation')}   value="BSD 1.7M/yr" delta={tt('carrying cost')}           trend="down" icon={Gauge}        />
          <KpiCard label={tt('FY26 CapEx total')}   value="BSD 24M"    delta={tt('board approved')}          trend="flat" icon={Activity}     />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Largest investment')} value="Fixed / PON" delta={tt('54% of CapEx — BSD 13M')}   trend="flat" icon={Signal}       />
          <KpiCard label={tt('Open RAN risk')}       value="At-risk"  delta={tt('interop delays')}          trend="down" icon={ShieldCheck}  />
          <KpiCard label={tt('Items resolved Q2')}  value="7"        delta={tt('vs 5 new items')}          trend="up"   icon={ShieldCheck}  />
        </div>

        <Panel title={tt('Technology roadmap initiatives — FY2026')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Initiative')}</th>
                  <th>{tt('Horizon')}</th>
                  <th className="text-right">{tt('Investment')}</th>
                  <th>{tt('Business benefit')}</th>
                  <th className="text-right">{tt('Debt items')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {roadmapInitiatives.map((r) => (
                  <tr key={r.initiative} className="border-t border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{r.initiative}</td>
                    <td className="text-xs font-mono text-vfes-dark/65">{r.horizon}</td>
                    <td className="text-right font-bold text-xs">{r.invest}</td>
                    <td className="text-xs text-vfes-dark/65">{r.benefit}</td>
                    <td className={`text-right font-bold text-xs ${r.techDebt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.techDebt}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(r.status)}`}>{tt(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/architecture" className="font-semibold text-vfes-dark hover:underline">{tt('Architecture →')}</Link>
            <span>·</span>
            <Link to="/portal/capacity-capex" className="font-semibold text-vfes-dark hover:underline">{tt('Capacity & CapEx →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Tech-debt score trend — quarterly (lower is better)')} insight={{ insight: 'Tech-debt score has declined from 48 to 36 over four quarters, with 8 items resolved in Q3-26 against only 1 new item added.', action: 'Ring-fence BSD 4M of the FY2026 cloud budget exclusively for debt clearance to maintain the current remediation velocity.', impact: 'Sustained pace achieves the target score of 20 by Q2-28 and is projected to reduce annual operational risk cost by BSD 6M.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={techDebtTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[25, 55]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="debtScore" name={tt('Debt score')} stroke={AMBER} strokeWidth={2.4} dot />
                  <Bar yAxisId="r" dataKey="resolved"  name={tt('Resolved')}  fill={GREEN} />
                  <Bar yAxisId="r" dataKey="newItems"  name={tt('New items')} fill={'#ef4444'} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">{tt('Debt score dropping consistently — 8 items resolved in Q3-26, only 1 new. Target score ≤20 by Q2-28.')}</div>
          </Panel>

          <Panel title={tt('CapEx allocation by category — FY2026 (BSD 24M)')} insight={{ insight: 'Fixed access (XGS-PON) claims the largest share at 54% of the BSD 24M envelope, consistent with the fibre take-up priority; mobile RAN is second.', action: 'Review the fixed access allocation to confirm the fibre build envelope is sufficient to close the 10K premises-passed gap to the EOY target.', impact: 'Shifting 5 percentage points from RAN to fibre closes the premises-passed shortfall without increasing total spend.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={investAlloc} dataKey="pct" innerRadius={45} outerRadius={75} paddingAngle={2}
                    label={({ cat, pct }: { cat: string; pct: number }) => `${cat} ${pct}%`} labelLine={false}>
                    {investAlloc.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Tech-debt register — top items by carrying cost')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Domain')}</th>
                    <th>{tt('Severity')}</th>
                    <th className="text-right">{tt('Age (mo)')}</th>
                    <th className="text-right">{tt('Cost / yr')}</th>
                    <th>{tt('Effort')}</th>
                    <th>{tt('Remediation plan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {techDebtRegister.map((d) => (
                    <tr key={d.domain} className="border-t border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{d.domain}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${d.severity === 'High' ? 'bg-red-100 text-red-700' : d.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(d.severity)}</span></td>
                      <td className="text-right font-mono text-xs">{d.age}</td>
                      <td className="text-right font-bold text-xs text-amber-600">{d.remMoM}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(d.effort)}</td>
                      <td className="text-xs text-vfes-dark/65">{d.plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/core-5g" className="font-semibold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
              <span>·</span>
              <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network & Engineering →')}</Link>
              <span>·</span>
              <Link to="/portal/mobile-ran" className="font-semibold text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
    </div>
  )
}
