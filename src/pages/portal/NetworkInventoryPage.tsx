import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ClipboardList, Server, Radio, Cable, Building2, Boxes,
  AlertTriangle, ChevronRight, Brain, Wrench, Package, ShieldCheck,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import NET from './_network_facts'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, AreaChart, Area, LineChart, Line,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const RED    = '#EF4444'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'

// ─── existing data ───────────────────────────────────────────────────────────

const ASSETS = [
  { cls: 'RAN (radio sites)',     count: NET.activeSites, nbvM: 1840, util: 71, refresh: 2028 },
  { cls: 'Towers & masts',        count: NET.ownedTowers, nbvM: 620,  util: 62, refresh: 2031 },
  { cls: 'Core & 5G SA',          count: 38,              nbvM: 410,  util: 58, refresh: 2027 },
  { cls: 'Transport / fibre',     count: 12840,           nbvM: 980,  util: 64, refresh: 2030 },
  { cls: 'Fixed access (OLT/PON)',count: 2120,            nbvM: 540,  util: 69, refresh: 2029 },
  { cls: 'Edge / MEC',            count: 210,             nbvM: 96,   util: 41, refresh: 2028 },
]

const CMDB = [
  { src: 'OSS auto-discovery',   items: 184200, reconciled: 96 },
  { src: 'Manual / spreadsheet', items: 24800,  reconciled: 61 },
  { src: 'Vendor EMS feed',      items: 142600, reconciled: 99 },
  { src: 'IoT / sensors',        items: 38400,  reconciled: 88 },
]

const LIFECYCLE = [
  { name: 'In service',               value: 78, color: GREEN },
  { name: 'Spare / standby',          value: 9,  color: BLUE  },
  { name: 'End-of-life (refresh due)',value: 8,  color: AMBER },
  { name: 'Stranded / idle',          value: 5,  color: RED   },
]

const FOOTPRINT = [
  { region: 'Nassau',    fibreKm: 18400, ductKm: 9200, sites: 4120 },
  { region: 'Grand Bahama', fibreKm: 15200, ductKm: 7800, sites: 3680 },
  { region: 'Cat Island', fibreKm: 13600, ductKm: 6400, sites: 3940 },
  { region: 'Abaco',  fibreKm: 9800,  ductKm: 4900, sites: 2210 },
  { region: 'Cat Island Province',    fibreKm: 6200,  ductKm: 3100, sites: 1480 },
  { region: 'Other',     fibreKm: 11400, ductKm: 5600, sites: 6754 },
]

// ─── new data ────────────────────────────────────────────────────────────────

// EoL schedule — units coming off support
const EOL_SCHEDULE = [
  { y: '2024', units: 840,  nbvM: 62,  class: 'Core 5G NFs'          },
  { y: '2025', units: 2180, nbvM: 148, class: 'RAN BBU (4G era)'     },
  { y: '2026', units: 1240, nbvM: 96,  class: 'Edge/MEC nodes'       },
  { y: '2027', units: 3680, nbvM: 220, class: 'Microwave hop radios' },
  { y: '2028', units: 5820, nbvM: 380, class: 'RAN AAU (first 5G)'   },
]

// Vendor mix by asset class
const VENDOR_MIX = [
  { vendor: 'Ericsson',  pct: 38, domains: 'RAN, Core 5G',        sla: true  },
  { vendor: 'Nokia',     pct: 24, domains: 'Transport, RAN',      sla: true  },
  { vendor: 'Huawei',    pct: 18, domains: 'RAN (legacy)',        sla: false },
  { vendor: 'Cisco',     pct: 11, domains: 'Edge/MEC, Peering',  sla: true  },
  { vendor: 'Samsung',   pct: 5,  domains: '5G NR pilot',        sla: true  },
  { vendor: 'Other',     pct: 4,  domains: 'Mixed',              sla: false },
]

// Spares inventory
const SPARES = [
  { cls: 'RAN BBU units',       onHand: 142, daysOfCover: 28, minTarget: 14, status: 'ok'   },
  { cls: 'AAU/RRU modules',     onHand: 218, daysOfCover: 21, minTarget: 14, status: 'ok'   },
  { cls: 'Core blade servers',  onHand: 24,  daysOfCover: 62, minTarget: 30, status: 'ok'   },
  { cls: '100G DWDM line cards',onHand: 8,   daysOfCover: 6,  minTarget: 14, status: 'low'  },
  { cls: 'MEC server nodes',    onHand: 12,  daysOfCover: 48, minTarget: 14, status: 'ok'   },
  { cls: 'OLT chassis',         onHand: 3,   daysOfCover: 4,  minTarget: 10, status: 'crit' },
]

// Audit findings
const AUDIT_FINDINGS = [
  { id: 'AUD-2023-001', area: 'CMDB accuracy',          severity: 'high',   status: 'open',     finding: 'Manual spreadsheet source 39% unreconciled'     },
  { id: 'AUD-2023-002', area: 'EoL management',          severity: 'high',   status: 'open',     finding: '5G Core fleet EoL 2027 with no refresh plan'    },
  { id: 'AUD-2023-003', area: 'Stranded assets',         severity: 'medium', status: 'in-flight',finding: '5% stranded/idle — reclaim programme started'   },
  { id: 'AUD-2023-004', area: 'Spares adequacy',         severity: 'medium', status: 'open',     finding: 'OLT spares at 4 days of cover vs 10-day target' },
  { id: 'AUD-2023-005', area: 'Vendor SLA coverage',     severity: 'low',    status: 'resolved', finding: 'Huawei legacy RAN no active SLA — resolved Q2'   },
  { id: 'AUD-2023-006', area: 'Physical audit frequency',severity: 'low',    status: 'in-flight',finding: '18% of macro sites not visited in 24+ months'   },
]

// Asset value trend (BSD M)
const VALUE_TREND = [
  { y: '2019', nbvM: 3860, depn: 380 },
  { y: '2020', nbvM: 3920, depn: 390 },
  { y: '2021', nbvM: 4080, depn: 410 },
  { y: '2022', nbvM: 4280, depn: 440 },
  { y: '2023', nbvM: 4486, depn: 462 },
]

// Reconciliation audit log
const RECON_LOG = [
  { run: '2023-Q4', autoDiscov: 96.2, vendorEms: 99.1, manual: 61.4, iotSens: 88.4, delta: 0.3 },
  { run: '2023-Q3', autoDiscov: 95.8, vendorEms: 98.8, manual: 59.1, iotSens: 87.1, delta: 0.8 },
  { run: '2023-Q2', autoDiscov: 94.1, vendorEms: 98.4, manual: 56.8, iotSens: 85.6, delta: 1.2 },
  { run: '2023-Q1', autoDiscov: 92.8, vendorEms: 97.9, manual: 54.2, iotSens: 83.4, delta: 1.9 },
]

const RECON_TREND = [
  { q: '2023-Q1', overall: 86.2 },
  { q: '2023-Q2', overall: 87.4 },
  { q: '2023-Q3', overall: 88.6 },
  { q: '2023-Q4', overall: 89.1 },
]

type TabId = 'register' | 'footprint' | 'cmdb' | 'lifecycle' | 'vendor' | 'spares' | 'audit' | 'recon'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'register',  label: 'Asset register',   icon: Boxes       },
  { id: 'footprint', label: 'Footprint & fibre', icon: Cable       },
  { id: 'cmdb',      label: 'CMDB hygiene',      icon: ClipboardList },
  { id: 'lifecycle', label: 'EoL schedule',       icon: AlertTriangle },
  { id: 'vendor',    label: 'Vendor mix',         icon: Building2   },
  { id: 'spares',    label: 'Spares inventory',   icon: Package     },
  { id: 'audit',     label: 'Audit findings',     icon: ShieldCheck },
  { id: 'recon',     label: 'Reconciliation',     icon: Server      },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function NetworkInventoryPage() {
  const { i18n } = useTranslation()

  // hooks 1–6: state
  const [tab,        setTab]       = useState<TabId>('register')
  const [showAll,    setShowAll]   = useState(false)
  const [auditFilter,setAuditFilter] = useState<'all' | 'open' | 'high'>('all')
  const [vendorSort, setVendorSort]  = useState<'pct' | 'vendor'>('pct')
  const [refreshYear,setRefreshYear] = useState<number>(2028) // interactive: show assets refreshing ≤ year

  // hooks 7–12: derived
  const totalNbv = useMemo(
    () => ASSETS.reduce((s, a) => s + a.nbvM, 0),
    [],
  )
  const totalFibre = useMemo(
    () => FOOTPRINT.reduce((s, f) => s + f.fibreKm, 0),
    [],
  )
  const totalDuct = useMemo(
    () => FOOTPRINT.reduce((s, f) => s + f.ductKm, 0),
    [],
  )
  const stranded = useMemo(
    () => LIFECYCLE.find((l) => l.name.startsWith('Stranded'))?.value ?? 0,
    [],
  )
  const cmdbItems = useMemo(
    () => CMDB.reduce((s, c) => s + c.items, 0),
    [],
  )
  const cmdbRec = useMemo(
    () => Math.round(CMDB.reduce((s, c) => s + c.items * c.reconciled, 0) / cmdbItems),
    [cmdbItems],
  )
  // interactive useMemo: assets due for refresh by selected year
  const refreshDue = useMemo(
    () => ASSETS.filter((a) => a.refresh <= refreshYear),
    [refreshYear],
  )
  const filteredVendors = useMemo(
    () => vendorSort === 'pct'
      ? [...VENDOR_MIX].sort((a, b) => b.pct - a.pct)
      : [...VENDOR_MIX].sort((a, b) => a.vendor.localeCompare(b.vendor)),
    [vendorSort],
  )
  const filteredAudit = useMemo(() => {
    if (auditFilter === 'open')   return AUDIT_FINDINGS.filter((f) => f.status !== 'resolved')
    if (auditFilter === 'high')   return AUDIT_FINDINGS.filter((f) => f.severity === 'high')
    return AUDIT_FINDINGS
  }, [auditFilter])

  // hook 13: side-effect
  useEffect(() => { /* analytics placeholder */ }, [tab])

  return (
    <div className="p-8" key={i18n.language}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title={tt('Network Inventory & Assets')}
        subtitle={tt('Asset register · net book value · CMDB reconciliation · fibre & duct footprint')}
        actions={
          <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">
            BSD {(totalNbv / 1000).toFixed(1)}B {tt('NBV')}
          </span>
        }
      />

      {/* ─── Top KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Asset net book value')}   value={`BSD ${(totalNbv / 1000).toFixed(2)}B`}     delta={tt('6 asset classes')}                              trend="flat" icon={Boxes}         accent />
        <KpiCard label={tt('Active sites')}           value={NET.activeSites.toLocaleString('en-BS')}  delta={`${NET.ownedSites.toLocaleString('en-BS')} ${tt('owned')}`} trend="up" icon={Radio} />
        <KpiCard label={tt('Fibre footprint')}        value={`${(totalFibre / 1000).toFixed(0)}K km`}  delta={`${(totalDuct / 1000).toFixed(0)}K km ${tt('duct')}`} trend="up"  icon={Cable} />
        <KpiCard label={tt('Stranded / idle assets')} value={`${stranded}%`}                           delta={tt('reclaim candidate')}                            trend="down" icon={AlertTriangle} />
      </div>

      {/* ─── ML insight section ──────────────────────────────────── */}
      <MlInsightSection
        heading={tt('Asset intelligence')}
        models={[
          { name: 'EoL Risk Scorer',          metric: 'AUC 0.93',   sub: tt('asset-level failure-before-replacement risk') },
          { name: 'Stranded Asset Classifier', metric: 'F1 0.88',   sub: tt('traffic-based idle/stranded detection')       },
          { name: 'Refresh Sequencer',         metric: '+BSD 12M NPV',  sub: tt('optimal capex ordering vs risk')              },
        ]}
        agentLabel={tt('Run Asset Optimiser')}
        agentRunningLabel={tt('Scanning…')}
        agentSteps={[
          tt('Reconciled CMDB against OSS auto-discovery'),
          tt('Flagged stranded & end-of-life assets by NBV'),
          tt('Matched refresh schedule to capex envelope'),
          tt('Drafted reclaim / decommission / refresh plan'),
        ]}
        agentBlurb={tt('A clean asset register is the basis for capex planning, TowerCo carve-outs and insurance valuation.')}
        decision={{
          title:    tt('Reclaim stranded assets; pull forward 5G Core refresh'),
          detail:   tt('5% stranded/idle assets and a 2027 Core EoL create two compounding risks — address both before the next capex cycle.'),
          impact:   tt('opex + rates savings · cleaner capex plan'),
          risk:     tt('decommissioning needs traffic-migration guardrails'),
          linkTo:   '/portal/finance',
          linkLabel: tt('Open Finance'),
        }}
        chart={{
          kind:   'bar',
          title:  tt('Net book value by asset class (BSD M)'),
          data:   ASSETS,
          xKey:   'cls',
          series: [{ key: 'nbvM', name: tt('NBV BSD M'), color: BLUE }],
          unit:   'M',
          note:   tt('Amber = sub-50% utilisation (Edge/MEC) — review before further build.'),
        }}
      />

      {/* ─── Interactive refresh horizon control ─────────────────── */}
      <div className="mb-6">
        <Panel title={tt('Interactive refresh horizon — assets due for refresh by year')}>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-semibold text-vfes-dark/70 whitespace-nowrap">
              {tt('Show refresh due by')}: <span className="text-vfes-dark font-bold">{refreshYear}</span>
            </label>
            <input
              type="range" min={2024} max={2032} step={1} value={refreshYear}
              onChange={(e) => setRefreshYear(Number(e.target.value))}
              className="flex-1 accent-vfes-red"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label={tt('Classes due')}      value={`${refreshDue.length} / ${ASSETS.length}`}                           delta={`≤ ${refreshYear}`}            trend="flat" icon={AlertTriangle} accent />
            <KpiCard label={tt('Units affected')}   value={refreshDue.reduce((s, a) => s + a.count, 0).toLocaleString('en-BS')} delta={tt('units to refresh')}        trend="flat" icon={Wrench} />
            <KpiCard label={tt('NBV at risk (BSD M)')} value={`BSD ${refreshDue.reduce((s, a) => s + a.nbvM, 0)}M`}                   delta={tt('book value of refresh set')} trend="flat" icon={Boxes} />
            <KpiCard label={tt('Avg utilisation')}  value={`${refreshDue.length ? Math.round(refreshDue.reduce((s, a) => s + a.util, 0) / refreshDue.length) : 0}%`} delta={tt('of refresh set')} trend="flat" icon={Radio} />
          </div>
        </Panel>
      </div>

      {/* ─── Agent decision ──────────────────────────────────────── */}
      <AgentDecision
        title="Asset optimisation agent"
        label={tt('Run Asset Optimiser')}
        runningLabel={tt('Scanning…')}
        steps={[
          tt('Reconciled CMDB against OSS auto-discovery'),
          tt('Flagged stranded & end-of-life assets by NBV'),
          tt('Matched refresh schedule to capex envelope'),
          tt('Drafted reclaim / decommission / refresh plan'),
        ]}
        hint={tt('A clean asset register is the basis for capex planning, TowerCo carve-outs and insurance valuation.')}
        result={{
          headline: tt('Reclaim stranded assets; pull forward 5G Core refresh'),
          stats: [
            { label: tt('Asset NBV'),       value: `BSD ${(totalNbv / 1000).toFixed(2)}B` },
            { label: tt('Active sites'),    value: NET.activeSites.toLocaleString('en-BS') },
            { label: tt('Fibre footprint'), value: `${(totalFibre / 1000).toFixed(0)}K km` },
            { label: tt('Stranded / idle'), value: `${stranded}%` },
          ],
          findings: [
            tt('5% of assets are stranded/idle — reclaim or decommission to cut opex and rates.'),
            tt('The 5G Core fleet hits end-of-life in 2027 with the lowest utilisation.'),
            tt('Sequence its refresh ahead of lower-risk classes.'),
          ],
          note: tt('opex + rates savings · cleaner capex plan'),
        }}
        impact={tt('opex + rates savings · cleaner capex plan')}
        risk={tt('decommissioning needs traffic-migration guardrails')}
        linkTo="#/portal/finance"
        linkLabel={tt('Open Finance')}
      />

      {/* ─── Tab navigation ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-vfes-dark border-vfes-red'
                  : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
              }`}
            >
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ─── Tab: register ───────────────────────────────────────── */}
      {tab === 'register' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Net book value by asset class (BSD M)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={ASSETS} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="M" />
                    <YAxis type="category" dataKey="cls" stroke="#999" fontSize={9} width={120} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`BSD ${v}M · ${p.payload.count.toLocaleString('en-BS')} units · ${p.payload.util}% util`, tt('Class')]} />
                    <Bar dataKey="nbvM" radius={[0, 6, 6, 0]}>
                      {ASSETS.map((a, i) => <Cell key={i} fill={a.util < 50 ? AMBER : BLUE} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Amber = sub-50% utilisation (Edge/MEC) — review before further build.')}</div>
            </Panel>

            <Panel title={tt('Lifecycle status (% of assets)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={LIFECYCLE} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {LIFECYCLE.map((l, i) => <Cell key={i} fill={l.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {tt('13% of fleet is end-of-life or stranded — refresh & reclaim plan attached.')}
                <ChevronRight className="w-3 h-3" />
              </div>
            </Panel>
          </div>

          <Panel title={tt('Asset register — detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Asset class')}</th>
                    <th className="px-3 py-2 text-right">{tt('Units')}</th>
                    <th className="px-3 py-2 text-right">{tt('NBV BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Utilisation')}</th>
                    <th className="px-3 py-2 text-right">{tt('Refresh due')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSETS.map((a) => (
                    <tr key={a.cls} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(a.cls)}</td>
                      <td className="px-3 py-2 text-right font-mono">{a.count.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {a.nbvM}M</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={a.util < 50 ? 'text-amber-600 font-bold' : ''}>{a.util}%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{a.refresh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Asset value trend — NBV and annual depreciation (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={VALUE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="y" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="nbvM"  fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('NBV BSD M')} />
                  <Bar dataKey="depn"  fill={AMBER} radius={[4, 4, 0, 0]} name={tt('Depreciation BSD M')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
            <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Insurance & valuation note')}</div>
            <p className="text-xs text-vfes-dark/55 leading-relaxed">
              {tt('Asset NBV is the primary basis for the annual insurance renewal. The CMDB is reconciled before each renewal to ensure coverage matches the registered fleet. Stranded and decommissioned assets must be removed from the register within 90 days to avoid over-insuring. The Finance team uses the Snowflake asset data feed to automate the annual schedule submission.')}
            </p>
            <div className="mt-2 flex gap-3 text-xs">
              <Link to="/portal/finance"
                className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
                {tt('Open Finance')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/regulatory"
                className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
                {tt('Open Regulatory')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ─── Tab: footprint ──────────────────────────────────────── */}
      {tab === 'footprint' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Total fibre (km)')}  value={`${(totalFibre / 1000).toFixed(0)}K km`} delta={tt('6 regions')}                                trend="up"   icon={Cable}    accent />
            <KpiCard label={tt('Total duct (km)')}   value={`${(totalDuct / 1000).toFixed(0)}K km`}  delta={tt('owned duct asset')}                         trend="up"   icon={Cable} />
            <KpiCard label={tt('Sites on fibre')}    value={NET.activeSites.toLocaleString('en-BS')}  delta={tt('fibre-connected')}                          trend="flat" icon={Radio} />
            <KpiCard label={tt('Spare duct %')}      value="18%"                                       delta={tt('leasable to alt-nets')}                    trend="flat" icon={Building2} />
          </div>

          <Panel title={tt('Fibre & duct footprint by region (km) · sites')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={FOOTPRINT}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} km · ${p.payload.sites.toLocaleString('en-BS')} sites`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fibreKm" fill={BLUE} radius={[6, 6, 0, 0]} name={tt('Fibre km')} />
                  <Bar dataKey="ductKm"  fill={NAVY} radius={[6, 6, 0, 0]} name={tt('Duct km')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Duct ownership is a wholesale asset — spare duct can be leased to MVNOs and alt-nets (see MVNO & Wholesale).')}
            </div>
          </Panel>

          <Panel title={tt('Sites per region — fibre coverage')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={FOOTPRINT}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toLocaleString('en-BS')} sites`, '']} />
                  <Bar dataKey="sites" fill={PURPLE} radius={[4, 4, 0, 0]} name={tt('Sites')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Fibre footprint detail by region')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('Fibre km')}</th>
                    <th className="px-3 py-2 text-right">{tt('Duct km')}</th>
                    <th className="px-3 py-2 text-right">{tt('Sites')}</th>
                    <th className="px-3 py-2 text-right">{tt('km / site')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FOOTPRINT.map((r) => (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.fibreKm.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.ductKm.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.sites.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{(r.fibreKm / r.sites).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: cmdb ───────────────────────────────────────────── */}
      {tab === 'cmdb' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Config items')}     value={cmdbItems.toLocaleString('en-BS')}  delta={tt('4 sources')}           trend="flat" icon={ClipboardList} />
            <KpiCard label={tt('Reconciled')}        value={`${cmdbRec}%`}                       delta={tt('weighted avg')}        trend="up"   icon={Server}        accent />
            <KpiCard label={tt('Owned towers')}      value={NET.ownedTowers.toLocaleString('en-BS')} delta={`${NET.towerTenancy} ${tt('tenancy')}`} trend="up" icon={Building2} />
            <KpiCard label={tt('Manual-source gap')} value="39%"                                 delta={tt('unreconciled')}        trend="down" icon={AlertTriangle}  />
          </div>

          <div className="h-64">
            <Panel title={tt('Reconciliation rate by CMDB source (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={CMDB}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="src" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% reconciled · ${p.payload.items.toLocaleString('en-BS')} items`, '']} />
                    <Bar dataKey="reconciled" radius={[6, 6, 0, 0]}>
                      {CMDB.map((c, i) => (
                        <Cell key={i} fill={c.reconciled < 70 ? RED : c.reconciled < 90 ? AMBER : GREEN} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {tt('Manual/spreadsheet source is only 61% reconciled — migrate to OSS auto-discovery to close the gap.')}
              </div>
            </Panel>
          </div>
          <div className="mt-4">
            <Panel title={tt('CMDB source detail — items and reconciliation rate')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Source')}</th>
                      <th className="px-3 py-2 text-right">{tt('Items')}</th>
                      <th className="px-3 py-2 text-right">{tt('Reconciled %')}</th>
                      <th className="px-3 py-2 text-right">{tt('Unreconciled items')}</th>
                      <th className="px-3 py-2">{tt('Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CMDB.map((c) => (
                      <tr key={c.src} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold text-xs">{tt(c.src)}</td>
                        <td className="px-3 py-2 text-right font-mono">{c.items.toLocaleString('en-BS')}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={c.reconciled < 70 ? 'text-red-600 font-bold' : c.reconciled < 90 ? 'text-amber-600' : 'text-emerald-700'}>
                            {c.reconciled}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">
                          {Math.round(c.items * (1 - c.reconciled / 100)).toLocaleString('en-BS')}
                        </td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/70">
                          {c.reconciled < 70 ? tt('Migrate to OSS auto-discovery') : c.reconciled < 90 ? tt('Review unmatched items') : tt('Monitor — no action')}
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
      {tab === 'lifecycle' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('EoL units in 2–3yr')}    value="3,020"  delta={tt('units ending support')}  trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('Earliest EoL class')}    value="Core 5G" delta={tt('2027 — highest risk')}  trend="down" icon={Server} />
            <KpiCard label={tt('Refresh capex implied')} value="BSD 460M"   delta={tt('5yr refresh envelope')} trend="flat" icon={Boxes} />
            <KpiCard label={tt('Currently on support')}  value="87%"     delta={tt('of fleet')}             trend="flat" icon={ShieldCheck} />
          </div>

          <Panel title={tt('EoL units & NBV by class — annual schedule')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={EOL_SCHEDULE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="y" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="left"  stroke="#999" fontSize={11} unit="u" />
                  <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left"  dataKey="units" fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Units')} />
                  <Bar yAxisId="right" dataKey="nbvM"  fill={AMBER} radius={[4, 4, 0, 0]} name={tt('NBV BSD M')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('EoL class registry — risk and refresh priority')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Year')}</th>
                    <th className="px-3 py-2">{tt('Asset class')}</th>
                    <th className="px-3 py-2 text-right">{tt('Units')}</th>
                    <th className="px-3 py-2 text-right">{tt('NBV BSD M')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {EOL_SCHEDULE.map((e) => (
                    <tr key={e.y} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono font-bold">{e.y}</td>
                      <td className="px-3 py-2 text-xs">{tt(e.class)}</td>
                      <td className="px-3 py-2 text-right font-mono">{e.units.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {e.nbvM}M</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          e.y <= '2025' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {e.y <= '2025' ? tt('fund now') : tt('plan')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: vendor ─────────────────────────────────────────── */}
      {tab === 'vendor' && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setVendorSort('pct')}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${vendorSort === 'pct' ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60'}`}
            >
              {tt('Sort by share')}
            </button>
            <button
              onClick={() => setVendorSort('vendor')}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${vendorSort === 'vendor' ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60'}`}
            >
              {tt('Sort alphabetical')}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Vendors with active SLA')} value="4 / 6"  delta={tt('Huawei + Other expired')} trend="flat" icon={ShieldCheck} accent />
            <KpiCard label={tt('Largest vendor share')}    value="Ericsson 38%" delta={tt('RAN + Core 5G')}   trend="flat" icon={Building2} />
            <KpiCard label={tt('Dual-vendor domains')}     value="2"            delta={tt('RAN: ERN + NKI')}  trend="flat" icon={Server} />
          </div>

          <Panel title={tt('Vendor share of network fleet (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={filteredVendors} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="vendor" stroke="#999" fontSize={11} width={70} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% · ${p.payload.domains} · SLA: ${p.payload.sla ? 'yes' : 'no'}`, '']} />
                  <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                    {filteredVendors.map((v, i) => (
                      <Cell key={i} fill={v.sla ? BLUE : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Red = no active SLA. Huawei legacy RAN (18% of fleet) has no current support contract — risk of parts unavailability.')}
            </div>
          </Panel>

          <Panel title={tt('Vendor registry — domains, SLA and risk')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Vendor')}</th>
                    <th className="px-3 py-2 text-right">{tt('Fleet share %')}</th>
                    <th className="px-3 py-2">{tt('Domains')}</th>
                    <th className="px-3 py-2 text-center">{tt('Active SLA')}</th>
                    <th className="px-3 py-2">{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => (
                    <tr key={v.vendor} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{v.vendor}</td>
                      <td className="px-3 py-2 text-right font-mono">{v.pct}%</td>
                      <td className="px-3 py-2 text-xs">{tt(v.domains)}</td>
                      <td className="px-3 py-2 text-center">{v.sla ? '✓' : <span className="text-red-500 font-bold">✗</span>}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.sla ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {v.sla ? tt('managed') : tt('exposed')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: spares ─────────────────────────────────────────── */}
      {tab === 'spares' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Classes at critical')}  value="1"      delta={tt('OLT chassis — 4 days')} trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('Classes at low')}       value="1"      delta={tt('DWDM — 6 days')}        trend="down" icon={Package} />
            <KpiCard label={tt('Classes adequate')}     value="4 / 6"  delta={tt('≥ 14 days of cover')}  trend="up"   icon={ShieldCheck} />
            <KpiCard label={tt('Total spares value')}   value="BSD 8.4M"  delta={tt('at replacement cost')} trend="flat" icon={Boxes} />
          </div>

          <Panel title={tt('Spares inventory — days of cover by class')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={SPARES} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit=" days" />
                  <YAxis type="category" dataKey="cls" stroke="#999" fontSize={10} width={140} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} days of cover · ${p.payload.onHand} on hand`, '']} />
                  <Bar dataKey="daysOfCover" radius={[0, 6, 6, 0]}>
                    {SPARES.map((s, i) => (
                      <Cell key={i} fill={s.status === 'crit' ? RED : s.status === 'low' ? AMBER : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Spares inventory register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Class')}</th>
                    <th className="px-3 py-2 text-right">{tt('On hand')}</th>
                    <th className="px-3 py-2 text-right">{tt('Days of cover')}</th>
                    <th className="px-3 py-2 text-right">{tt('Min target (days)')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SPARES.map((s) => (
                    <tr key={s.cls} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(s.cls)}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.onHand}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={s.status === 'crit' ? 'text-red-600 font-bold' : s.status === 'low' ? 'text-amber-600 font-bold' : ''}>
                          {s.daysOfCover}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{s.minTarget}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'crit' ? 'bg-red-50 text-red-700' : s.status === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {tt(s.status === 'crit' ? 'critical' : s.status === 'low' ? 'low' : 'ok')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {tt('OLT chassis at 4 days — raise urgent PO via Procurement. 100G DWDM cards at 6 days — expedite.')}
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: audit ──────────────────────────────────────────── */}
      {tab === 'audit' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-xs font-semibold text-vfes-dark/70">{tt('Filter')}:</span>
            {(['all', 'open', 'high'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAuditFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  auditFilter === f ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'
                }`}
              >
                {tt(f === 'all' ? 'All findings' : f === 'open' ? 'Open only' : 'High severity')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Open findings')}    value={`${AUDIT_FINDINGS.filter((f) => f.status !== 'resolved').length}`} delta={tt('incl. in-flight')} trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('High severity')}    value={`${AUDIT_FINDINGS.filter((f) => f.severity === 'high').length}`}   delta={tt('require action')}  trend="down" icon={ShieldCheck} />
            <KpiCard label={tt('Resolved in Q2')}  value="1"   delta={tt('Huawei SLA closed')} trend="up" icon={Brain} />
          </div>

          <Panel title={tt('Audit findings register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('ID')}</th>
                    <th className="px-3 py-2">{tt('Area')}</th>
                    <th className="px-3 py-2">{tt('Severity')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                    <th className="px-3 py-2">{tt('Finding')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((f) => (
                    <tr key={f.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{f.id}</td>
                      <td className="px-3 py-2 text-xs font-semibold">{tt(f.area)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f.severity === 'high' ? 'bg-red-50 text-red-700' : f.severity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {tt(f.severity)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : f.status === 'in-flight' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {tt(f.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(f.finding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: recon ──────────────────────────────────────────── */}
      {tab === 'recon' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Overall reconciliation')} value={`${cmdbRec}%`}   delta={tt('weighted by items')}  trend="up" icon={Server}        accent />
            <KpiCard label={tt('Best source')}            value="Vendor EMS 99%"  delta={tt('highest coverage')}   trend="up" icon={ShieldCheck} />
            <KpiCard label={tt('Gap source')}             value="Manual 61%"      delta={tt('lowest accuracy')}    trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('QoQ improvement')}        value="+0.5pp"          delta={tt('Q3 to Q4')}           trend="up" icon={Brain} />
          </div>

          <Panel title={tt('Reconciliation rate trend — overall weighted % by quarter')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={RECON_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[82, 94]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Overall reconciled')]} />
                  <Line type="monotone" dataKey="overall" stroke={GREEN} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Steady improvement as OSS auto-discovery coverage expands — target 94% by end of 2024.')}
            </div>
          </Panel>

          <Panel title={tt('Reconciliation by source — quarterly run log')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Run date')}</th>
                    <th className="px-3 py-2 text-right">{tt('OSS disco %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Vendor EMS %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Manual %')}</th>
                    <th className="px-3 py-2 text-right">{tt('IoT %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Delta (pp)')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RECON_LOG.map((r) => (
                    <tr key={r.run} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{r.run}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.autoDiscov}%</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700">{r.vendorEms}%</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600 font-bold">{r.manual}%</td>
                      <td className="px-3 py-2 text-right font-mono">{r.iotSens}%</td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">+{r.delta}pp</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="text-xs font-bold text-amber-800 mb-1">{tt('Improvement path')}</div>
            <p className="text-xs text-amber-700 leading-relaxed">
              {tt('The manual/spreadsheet source (24,800 items, 61% reconciled) is the primary drag on overall accuracy. Migrating these records to the OSS auto-discovery workflow would add ~3pp to the overall rate. Target: begin migration in Q1 2024 with IT and Network Ops.')}
            </p>
          </div>
        </>
      )}

      {/* ─── Asset governance summary ────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Asset governance — process, data lineage & owners')}>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Refresh & lifecycle')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('Core 5G refresh — fund 2024 capex programme')}</li>
                <li>{tt('RAN BBU (4G era) — plan refresh from 2025')}</li>
                <li>{tt('Edge/MEC — review vs demand before refresh')}</li>
                <li>{tt('EoL schedule reviewed quarterly with CTO')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('CMDB improvement path')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('Migrate manual records to OSS auto-discovery')}</li>
                <li>{tt('Target 94% overall reconciliation by Q4 24')}</li>
                <li>{tt('Vendor EMS feeds to be re-certified annually')}</li>
                <li>{tt('IoT sensor coverage to expand to 95% of sites')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Spares emergency actions')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('OLT chassis: raise PO immediately (4 days cover)')}</li>
                <li>{tt('100G DWDM: expedite order (6 days cover)')}</li>
                <li>{tt('Review min-target levels with Procurement Q1')}</li>
                <li>{tt('Consider regional buffer stocking for high-risk classes')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link to="/portal/capacity-capex"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
              {tt('Capacity & Capex')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/procurement"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
              {tt('Procurement')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/finance"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
              {tt('Finance')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* ─── Asset health score ──────────────────────────────────── */}
      <div className="mt-4">
        <Panel title={tt('Asset health score summary — by class')}>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { cls: 'RAN (radio sites)',     score: 71, reason: tt('Good utilisation; sleep-mode partially deployed'),      color: AMBER },
              { cls: 'Core & 5G SA',          score: 52, reason: tt('EoL 2027 with no refresh plan — highest risk class'),    color: RED   },
              { cls: 'Transport / fibre',     score: 68, reason: tt('Solid utilisation; 400G upgrade in plan'),               color: AMBER },
              { cls: 'Towers & masts',        score: 82, reason: tt('Good structure; TowerCo asset — monitor lease terms'),   color: GREEN },
              { cls: 'Fixed access (OLT/PON)',score: 74, reason: tt('Refresh 2029; OLT spares critical — action needed'),    color: AMBER },
              { cls: 'Edge / MEC',            score: 41, reason: tt('Low utilisation; hold further build until demand clear'), color: RED   },
            ].map((a) => (
              <div key={a.cls} className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-vfes-dark">{tt(a.cls)}</span>
                  <span className="text-sm font-extrabold" style={{ color: a.color }}>{a.score}</span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${a.score}%`, background: a.color }} />
                </div>
                <div className="text-[10px] text-vfes-dark/55">{a.reason}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">
            {tt('Health score combines utilisation, EoL proximity, SLA coverage, and CMDB reconciliation rate. Scale 0–100.')}
          </div>
        </Panel>
      </div>

      {/* ─── TowerCo & wholesale duct note ──────────────────────── */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="text-xs font-bold text-blue-800 mb-2">{tt('TowerCo carve-out opportunity')}</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            {tt('The 3,840 owned towers at BSD 620M NBV are a candidate for a TowerCo sale-and-leaseback programme. Benchmark transactions imply 12–15× EBITDA multiples, which would yield BSD 420–480M proceeds and release capex for active network investment.')}
          </p>
          <div className="mt-2">
            <Link to="/portal/finance"
              className="text-xs font-semibold text-blue-800 hover:underline inline-flex items-center gap-1">
              {tt('Open Finance')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="text-xs font-bold text-emerald-800 mb-2">{tt('Wholesale duct leasing')}</div>
          <p className="text-xs text-emerald-700 leading-relaxed">
            {tt('18% of owned duct is estimated to be spare and leasable to alt-nets, ISPs and utility operators. At BSD 4–6/m/yr, the 13,700 km of spare duct represents a BSD 55–83M/yr annual revenue opportunity with near-zero incremental capex.')}
          </p>
          <div className="mt-2">
            <Link to="/portal/regulatory"
              className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1">
              {tt('Open Regulatory')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Related cockpits ────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-vfes-dark/45 mb-1">{tt('Related cockpits')}</h3>
        <p className="text-xs text-vfes-dark/40 mb-3">{tt('Navigate to adjacent cockpits for detailed domain views, capex planning and financial integration.')}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/network"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Network overview')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/mobile-ran"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Mobile RAN')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/core-5g"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Core 5G')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/transport"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Transport')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/capacity-capex"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Capacity & Capex')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/ran-energy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('RAN Energy')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/procurement"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Procurement')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/supply-chain"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Supply Chain')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/finance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Finance')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/cto"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('CTO')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/ai-insights"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('AI Insights')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/operations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Operations')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
        <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Data sourcing — how this page is powered')}</div>
        <p className="text-xs text-vfes-dark/55 leading-relaxed">
          {tt('Asset register data flows from the CMDB, vendor EMS feeds, and OSS auto-discovery into Snowflake dynamic tables (refreshed daily). The ML EoL Risk Scorer and Stranded Asset Classifier retrain weekly. The asset health score is recomputed nightly and scenario to this dashboard automatically.')}
        </p>
        <div className="mt-2">
          <Link to="/portal/ai-insights"
            className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
            {tt('Open AI Insights')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <AskTheData />
    </div>
  )
}
