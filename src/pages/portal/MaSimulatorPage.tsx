import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import KPI from './_kpi_facts'
import {
  Briefcase, TrendingUp, Brain, Building2, Scale, Target, Globe,
  DollarSign, Percent, Activity, AlertTriangle, Layers, BarChart2,
  ShieldCheck, Zap, Bell,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ─── Existing deal pipeline (preserved) ──────────────────────────────────────
const DEALS = [
  { deal: 'TowerCo carve-out',     ev: 4200, ebitda: 230, multiple: 18.3, type: 'divest',  status: 'Active'   },
  { deal: 'FTTH JV (50/50)',        ev: 2800, ebitda: 175, multiple: 16.0, type: 'jv',      status: 'LOI'      },
  { deal: 'Fixed-wireless swap',   ev:  640, ebitda:  48, multiple: 13.3, type: 'swap',    status: 'Exploring'},
  { deal: 'MVNO acquisition',      ev:  380, ebitda:  31, multiple: 12.3, type: 'acquire', status: 'Active'   },
]

// ─── Existing NPV sensitivity tornado (preserved) ────────────────────────────
const TORNADO = [
  { driver: 'EV/EBITDA multiple ±2×', swing: 920 },
  { driver: 'Tenancy ratio ±0.2',     swing: 540 },
  { driver: 'Tower count ±10%',        swing: 410 },
  { driver: 'Leaseback term ±2y',      swing: 380 },
  { driver: 'Lease escalator ±50bps',  swing: 210 },
].sort((a, b) => b.swing - a.swing)

// ─── Target screening ─────────────────────────────────────────────────────────
const TARGETS = [
  { name: 'TowerCo The Bahamas',      type: 'Infrastructure',  ev: 4200, evEbitda: 18.3, synergy: 120, strategic: 'High',   fcfImpact: '+BSD 8M',  riskLevel: 'Low'    },
  { name: 'FTTH NetCo JV',       type: 'Fixed network',   ev: 2800, evEbitda: 16.0, synergy: 95,  strategic: 'High',   fcfImpact: '+BSD 6M',  riskLevel: 'Low'    },
  { name: 'CloudCom SME MVNO',   type: 'Mobile virtual',  ev:  380, evEbitda: 12.3, synergy: 42,  strategic: 'Medium', fcfImpact: '+BSD 3M',  riskLevel: 'Medium' },
  { name: 'FWA Swap — Rural Out Islands',  type: 'Asset swap',      ev:  640, evEbitda: 13.3, synergy: 28,  strategic: 'Low',    fcfImpact: '+BSD 2M',  riskLevel: 'Low'    },
  { name: 'IoT Platform (SaaS)', type: 'Digital B2B',     ev:  220, evEbitda: 22.0, synergy: 15,  strategic: 'Medium', fcfImpact: '+BSD 1M',  riskLevel: 'High'   },
  { name: 'EdgeDC (4 sites)',    type: 'Edge compute',    ev:  480, evEbitda: 14.8, synergy: 32,  strategic: 'Medium', fcfImpact: '+BSD 3M',  riskLevel: 'Medium' },
]

// ─── Synergy model ────────────────────────────────────────────────────────────
const SYNERGY_PHASES = [
  { yr: 'Y1', costSyn: 20, revSyn: 5,  oneOff: 35 },
  { yr: 'Y2', costSyn: 55, revSyn: 18, oneOff: 15 },
  { yr: 'Y3', costSyn: 80, revSyn: 38, oneOff: 8  },
  { yr: 'Y4', costSyn: 95, revSyn: 52, oneOff: 3  },
  { yr: 'Y5', costSyn: 105, revSyn: 62, oneOff: 0 },
]

// ─── Financing mix ────────────────────────────────────────────────────────────
const FINANCING_MIX = [
  { name: 'Senior debt',     pct: 45, cost: 3.2, color: NAVY   },
  { name: 'Hybrid bond',     pct: 20, cost: 5.4, color: BLUE   },
  { name: 'Equity proceeds', pct: 20, cost: 9.2, color: PURPLE },
  { name: 'Asset disposal',  pct: 15, cost: 0.0, color: GREEN  },
]

// ─── Valuation comps ─────────────────────────────────────────────────────────
const TOWER_COMPS = [
  { co: 'SPIE (BSD)',    evEbitda: 21.4, yield: 3.8, color: SLATE  },
  { co: 'ATC Europe',      evEbitda: 20.1, yield: 4.1, color: SLATE  },
  { co: 'Vantage Towers',  evEbitda: 19.2, yield: 4.4, color: BLUE   },
  { co: 'Cable Bahamas TowerCo (target)', evEbitda: 18.3, yield: 4.7, color: GREEN },
  { co: 'Telxius residual', evEbitda: 17.1, yield: 5.0, color: SLATE },
]

const ACCRETION_CURVE = [
  { yr: 'Close', eps: -0.8 },
  { yr: 'Y1',    eps: -0.3 },
  { yr: 'Y2',    eps:  0.2 },
  { yr: 'Y3',    eps:  0.7 },
  { yr: 'Y4',    eps:  1.1 },
  { yr: 'Y5',    eps:  1.4 },
]

// ─── Deal scenarios ───────────────────────────────────────────────────────────
const SCENARIOS = [
  { name: 'Base case',   ev: 4200, towers: 8420, multiple: 18.3, synergy: 160, delevX: 1.8, epsY3: '+0.7%', prob: 55 },
  { name: 'Bull case',   ev: 4800, towers: 8420, multiple: 21.0, synergy: 200, delevX: 2.1, epsY3: '+1.8%', prob: 25 },
  { name: 'Bear case',   ev: 3500, towers: 7000, multiple: 15.2, synergy: 100, delevX: 1.2, epsY3: '-0.2%', prob: 20 },
]

// ─── Due diligence tracker ────────────────────────────────────────────────────
const DD_WORKSTREAMS = [
  { stream: 'Financial (VDD)',    lead: 'EY',              complete: 92, status: 'Active',   eta: 'Jul 15' },
  { stream: 'Legal / Regulatory', lead: 'Stibbe',    complete: 78, status: 'Active',   eta: 'Jul 22' },
  { stream: 'Commercial / IMS',   lead: 'McKinsey',       complete: 88, status: 'Active',   eta: 'Jul 12' },
  { stream: 'Tax & Structures',   lead: 'Deloitte',       complete: 65, status: 'Active',   eta: 'Jul 28' },
  { stream: 'IT / Network',       lead: 'Internal CTO',   complete: 70, status: 'Watch',    eta: 'Aug 5'  },
  { stream: 'Leaseback pricing',  lead: 'Internal Tsy',   complete: 55, status: 'Planning', eta: 'Aug 10' },
]

// ─── Leverage bridge post-deal ────────────────────────────────────────────────
const LEVERAGE_BRIDGE = [
  { step: 'Pre-deal leverage',   val: 2.60,  type: 'open' },
  { step: 'Tower EBITDA out',    val: 0.13,  type: 'neg'  },
  { step: 'Debt repaid',         val: -1.40, type: 'pos'  },
  { step: 'Interest saved',      val: -0.08, type: 'pos'  },
  { step: 'Post-deal leverage',  val: 1.25,  type: 'close'},
]

// ─── Post-close synergy waterfall ────────────────────────────────────────────
const SYNERGY_WATERFALL = [
  { item: 'Cost synergies Y5',  value:  105, type: 'pos' },
  { item: 'Revenue synergies',  value:   62, type: 'pos' },
  { item: 'One-off costs',      value:  -61, type: 'neg' },
  { item: 'Tax leakage',        value:  -18, type: 'neg' },
  { item: 'Net run-rate NPV',   value:  600, type: 'total'},
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'screening' | 'valuation' | 'synergies' | 'financing' | 'scenarios' | 'due-diligence' | 'accretion'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',       label: 'Overview',         icon: BarChart2   },
  { id: 'screening',      label: 'Target Screening', icon: Target      },
  { id: 'valuation',      label: 'Valuation',        icon: Scale       },
  { id: 'synergies',      label: 'Synergy Model',    icon: Layers      },
  { id: 'financing',      label: 'Financing Mix',    icon: DollarSign  },
  { id: 'scenarios',      label: 'Deal Scenarios',   icon: Globe       },
  { id: 'due-diligence',  label: 'Due Diligence',    icon: ShieldCheck },
  { id: 'accretion',      label: 'Accretion/Dilution', icon: TrendingUp },
]

export default function MaSimulatorPage() {
  const [tab, setTab] = useState<TabId>('overview')

  // Existing sliders (preserved)
  const [towers, setTowers] = useState(8420)
  const [multiple, setMultiple] = useState(18)
  const [tenancy, setTenancy] = useState(1.62)
  const [retainPct, setRetainPct] = useState(100)

  // New interactive controls
  const [synPct, setSynPct] = useState<number>(100)
  const [debtPct, setDebtPct] = useState<number>(45)
  const [premiumPct, setPremiumPct] = useState<number>(0)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  // ─── Core model (existing, preserved) ─────────────────────────────────────
  const ebitdaPerTower = 0.0273
  const towerEbitda = useMemo(
    () => towers * ebitdaPerTower * (tenancy / 1.62),
    [towers, tenancy],
  )
  const ev = useMemo(() => towerEbitda * multiple, [towerEbitda, multiple])
  const leasebackCost = useMemo(() => towers * 0.012 * (retainPct / 100), [towers, retainPct])
  const netProceeds = useMemo(() => ev - leasebackCost * 8, [ev, leasebackCost])

  const groupEbitda = 1760
  const netDebt = 4900
  const leverageBefore = useMemo(() => netDebt / groupEbitda, [])
  const leverageAfter = useMemo(
    () => (netDebt - netProceeds) / (groupEbitda - towerEbitda),
    [netProceeds, towerEbitda],
  )
  const interestSaved = useMemo(() => netProceeds * 0.045, [netProceeds])
  const epsDelta = useMemo(
    () => ((interestSaved - towerEbitda) / groupEbitda) * 100,
    [interestSaved, towerEbitda],
  )
  const leverageReduction = useMemo(() => netProceeds / 1000, [netProceeds])

  // ─── Derived synergy/financing ────────────────────────────────────────────
  const adjustedSynergy = useMemo(
    () => SYNERGY_PHASES.map(s => ({
      ...s,
      costSyn: Math.round(s.costSyn * synPct / 100),
      revSyn:  Math.round(s.revSyn  * synPct / 100),
    })),
    [synPct],
  )

  const blendedCost = useMemo(() => {
    const eqCost = 9.2, debtCost = 3.2, hybridCost = 5.4
    const eqPct = (100 - debtPct) / 2
    return +((debtPct / 100 * debtCost + eqPct / 100 * eqCost + eqPct / 100 * hybridCost)).toFixed(2)
  }, [debtPct])

  const adjustedEv = useMemo(() => ev * (1 + premiumPct / 100), [ev, premiumPct])

  const typeColor = (t: string) =>
    t === 'divest' ? GREEN : t === 'jv' ? BLUE : t === 'acquire' ? PURPLE : NAVY

  return (
    <div className="p-8">
      <PageHeader
        title={tt('M&A & Carve-out Simulator')}
        subtitle={tt('TowerCo carve-out · FTTH JV · target screening · synergy model · accretion/dilution')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">{tt('Scenario model')}</span>
            {liveTime && <span className="text-vfes-dark/40 text-[10px] font-mono">{liveTime}</span>}
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="M&A intelligence"
        models={[
          { name: 'Deal Valuation Model',  metric: 'MAPE 6.2%',   sub: 'EV/EBITDA vs comps'              },
          { name: 'Synergy Predictor',      metric: 'R² 0.81',     sub: 'cost & revenue capture timing'   },
          { name: 'Accretion Forecaster',   metric: 'precision 0.87', sub: 'EPS dilution path Y1–Y5'     },
        ]}
        agentLabel="Run M&A Agent"
        agentRunningLabel="Modelling…"
        agentSteps={[
          'Screened 6 inorganic targets by strategic fit × capital efficiency',
          'Valued TowerCo at 18.3× EV/EBITDA vs comps (18–21× range)',
          'Modelled leaseback PV, net proceeds and leverage bridge',
          'Stress-tested accretion path in bull/base/bear scenarios',
        ]}
        agentBlurb="One deal model — valuation, synergies, leverage and EPS — on a single data platform; the AI can run 10,000 Monte Carlo paths in seconds."
        decision={{
          title: 'Proceed with TowerCo carve-out at 18–19× EV/EBITDA; use proceeds to deleverage to 1.25×',
          detail: 'At the modelled multiple (18.3×) the carve-out generates net proceeds of BSD 4.0B+ which, applied to debt repayment, cuts net debt/EBITDA from 2.60× to 1.25× — creating 1.35× turns of dry powder for spectrum and future M&A.',
          impact: 'net debt/EBITDA 2.60× → 1.25× · EPS accretive by Y2',
          risk: 'leaseback escalator lock-in — cap to CPI +50bps in the term sheet',
          linkTo: '/portal/capital-treasury',
          linkLabel: 'Open Capital & Treasury',
        }}
        chart={{
          kind: 'bar',
          title: 'Deal pipeline — enterprise value (BSD M)',
          xKey: 'deal',
          unit: 'M',
          data: DEALS,
          series: [{ key: 'ev', name: 'EV BSD M', color: NAVY }],
          colorBy: { key: 'ev', high: 3000, mid: 500 },
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-blue-900 text-sm">{tt('TowerCo EY VDD 92% complete · LOI signed for FTTH JV · Term sheet expected Q3')}</div>
              <div className="text-xs text-blue-800 mt-1">{tt('Board sign-off for exclusivity expected at Jul-10 capital committee. Due diligence to complete Aug-10.')}</div>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-blue-600 hover:underline shrink-0">{tt('Dismiss')}</button>
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
          <KpiCard label={tt('Implied EV')}            value={`BSD ${(ev / 1000).toFixed(2)}B`}         delta={`${multiple}× EV/EBITDA`}             trend="up"   icon={TrendingUp} accent />
          <KpiCard label={tt('TowerCo EBITDA')}        value={`BSD ${towerEbitda.toFixed(0)}M`}          delta={`${tenancy.toFixed(2)} ${tt('tenancy')}`} trend="flat" icon={Building2} />
          <KpiCard label={tt('Net proceeds')}           value={`BSD ${(netProceeds / 1000).toFixed(2)}B`} delta={tt('after leaseback PV')}              trend="up"   icon={Briefcase} />
          <KpiCard label={tt('Leverage reduction')}    value={`${leverageReduction.toFixed(1)}×`}     delta={tt('net debt/EBITDA turns')}           trend="up"   icon={Scale} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active deals')} value={`${DEALS.length}`} delta={tt('in pipeline')} trend="flat" icon={Activity} />
          <KpiCard label={tt('Leverage before')} value={`${leverageBefore.toFixed(2)}×`} delta={tt('current group')} trend="flat" icon={BarChart2} />
          <KpiCard label={tt('Leverage after')} value={`${leverageAfter.toFixed(2)}×`} delta={tt('post-deal pro-forma')} trend="up" icon={Layers} />
          <KpiCard label={tt('EPS accretion Y3')} value={`${ACCRETION_CURVE[3].eps > 0 ? '+' : ''}${ACCRETION_CURVE[3].eps}%`} delta={tt('Year 3 accretion')} trend={ACCRETION_CURVE[3].eps >= 0 ? 'up' : 'down'} icon={Percent} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('TowerCo carve-out simulator')}>
            <div className="space-y-4 mt-2">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{tt('Towers in scope')}</span><span className="font-mono font-bold">{towers.toLocaleString('en-BS')}</span></div>
                <input type="range" min={2000} max={8420} step={100} value={towers} onChange={e => setTowers(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{tt('EV/EBITDA multiple')}</span><span className="font-mono font-bold">{multiple}×</span></div>
                <input type="range" min={12} max={24} step={0.5} value={multiple} onChange={e => setMultiple(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{tt('Tenancy ratio')}</span><span className="font-mono font-bold">{tenancy.toFixed(2)}</span></div>
                <input type="range" min={1.2} max={2.4} step={0.01} value={tenancy} onChange={e => setTenancy(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{tt('Anchor-tenant leaseback %')}</span><span className="font-mono font-bold">{retainPct}%</span></div>
                <input type="range" min={50} max={100} step={5} value={retainPct} onChange={e => setRetainPct(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-[#f6f7fb] p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Implied EV')}</span><span className="font-bold">BSD {(ev / 1000).toFixed(2)}B</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Leaseback PV (8y)')}</span><span className="font-bold text-red-600">−BSD {(leasebackCost * 8 / 1000).toFixed(2)}B</span></div>
              <div className="flex justify-between border-t border-black/10 pt-1 mt-1"><span className="font-semibold">{tt('Net proceeds')}</span><span className="font-extrabold text-emerald-700">BSD {(netProceeds / 1000).toFixed(2)}B</span></div>
            </div>
          </Panel>

          <Panel title={tt('Deal pipeline — EV by transaction (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DEALS} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="deal" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={TS} formatter={(v: number, _n: any, p: any) => [`BSD ${v}M · ${p.payload.multiple}× · BSD ${p.payload.ebitda}M EBITDA`, tt('Deal')]} />
                  <Bar dataKey="ev" radius={[0, 4, 4, 0]} name={tt('EV BSD M')}>
                    {DEALS.map((d, i) => <Cell key={i} fill={typeColor(d.type)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-4">
          <Panel title={tt('Leverage & EPS — post-deal vs pre-deal')}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[#f6f7fb] p-4">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Net debt / EBITDA')}</div>
                <div className="text-2xl font-extrabold mt-1">
                  {leverageBefore.toFixed(2)}× → <span className={leverageAfter < leverageBefore ? 'text-emerald-700' : 'text-red-600'}>{leverageAfter.toFixed(2)}×</span>
                </div>
              </div>
              <div className="rounded-lg bg-[#f6f7fb] p-4">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('EPS accretion / (dilution)')}</div>
                <div className={`text-2xl font-extrabold mt-1 ${epsDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {epsDelta >= 0 ? '+' : ''}{epsDelta.toFixed(1)}%
                </div>
              </div>
            </div>
          </Panel>

          <Panel title={tt('NPV sensitivity — net proceeds swing (BSD M)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={TORNADO} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="driver" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`±BSD ${v}M`, tt('Swing')]} />
                  <Bar dataKey="swing" radius={[0, 4, 4, 0]} fill={NAVY} name={tt('NPV swing')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
          <span>·</span>
          <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
          <span>·</span>
          <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <span>·</span>
          <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO Dashboard →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Deal timeline — key milestones')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Milestone')}</th>
                    <th>{tt('Date')}</th>
                    <th>{tt('Owner')}</th>
                    <th>{tt('Status')}</th>
                    <th>{tt('Detail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ms: 'Board M&A mandate approved',          date: 'Apr 15',    owner: 'Board',          status: 'Done',    note: 'Unanimous — carve-out + JV approved' },
                    { ms: 'EY VDD commenced',                    date: 'May 2',     owner: 'EY',             status: 'Done',    note: 'Financial vendor DD in progress'     },
                    { ms: 'LOI signed — FTTH JV',               date: 'May 28',    owner: 'CEO',            status: 'Done',    note: 'Exclusivity period 90d'              },
                    { ms: 'McKinsey commercial DD',              date: 'Jun 1',     owner: 'McKinsey',       status: 'Done',    note: '88% complete'                        },
                    { ms: 'Stibbe legal sign-off',          date: 'Jul 22',    owner: 'Stibbe',    status: 'Active',  note: '78% complete'                        },
                    { ms: 'Deloitte tax structure final',        date: 'Jul 28',    owner: 'Deloitte',       status: 'Active',  note: 'Transfer pricing at risk'            },
                    { ms: 'Capital committee exclusivity vote',  date: 'Jul 10',    owner: 'CFO / Tsy',      status: 'Active',  note: 'Board pre-approved'                  },
                    { ms: 'IT/network red lines agreed',         date: 'Aug 5',     owner: 'CTO',            status: 'Watch',   note: 'Leaseback RAN sharing terms'         },
                    { ms: 'Final bid submitted',                 date: 'Aug 22',    owner: 'CEO / CFO',      status: 'Planned', note: 'Subject to DD sign-off'              },
                    { ms: 'Transaction close',                   date: 'Sep 30',    owner: 'Board',          status: 'Planned', note: 'Regulatory clearance 6–8w'           },
                  ].map(row => (
                    <tr key={row.ms} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(row.ms)}</td>
                      <td className="font-mono text-xs">{row.date}</td>
                      <td className="text-xs text-vfes-dark/65">{row.owner}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${row.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Active' ? 'bg-blue-100 text-blue-700' : row.status === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{tt(row.status)}</span></td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.note)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
              <Link to="/portal/procurement" className="font-semibold text-vfes-dark hover:underline">{tt('Procurement →')}</Link>
              <span>·</span>
              <Link to="/portal/supply-chain" className="font-semibold text-vfes-dark hover:underline">{tt('Supply Chain →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ TARGET SCREENING ══════════════════════════════════════ */}
      {tab === 'screening' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Targets screened')} value={`${TARGETS.length}`} delta={tt('active pipeline')} trend="flat" icon={Target} accent />
          <KpiCard label={tt('High strategic fit')} value="2" delta={tt('TowerCo + FTTH JV')} trend="up" icon={ShieldCheck} />
          <KpiCard label={tt('Total EV universe')} value={`BSD ${(TARGETS.reduce((s, t) => s + t.ev, 0) / 1000).toFixed(1)}B`} delta={tt('screened targets')} trend="flat" icon={DollarSign} />
          <KpiCard label={tt('Synergy pool')} value={`BSD ${TARGETS.reduce((s, t) => s + t.synergy, 0)}M`} delta={tt('run-rate potential')} trend="up" icon={Zap} />
        </div>

        <Panel title={tt('Target universe — strategic screening register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Target')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('EV BSD M')}</th>
                  <th className="text-right">{tt('EV/EBITDA')}</th>
                  <th className="text-right">{tt('Synergy BSD M')}</th>
                  <th>{tt('Strategic fit')}</th>
                  <th>{tt('Risk')}</th>
                </tr>
              </thead>
              <tbody>
                {TARGETS.map(t => (
                  <tr key={t.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{t.name}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(t.type)}</td>
                    <td className="text-right font-bold font-mono text-xs">BSD {t.ev}M</td>
                    <td className="text-right font-mono text-xs">{t.evEbitda}×</td>
                    <td className="text-right font-bold text-emerald-600 text-xs">BSD {t.synergy}M</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${t.strategic === 'High' ? 'bg-emerald-100 text-emerald-700' : t.strategic === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{tt(t.strategic)}</span></td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${t.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' : t.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tt(t.riskLevel)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
            <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
            <span>·</span>
            <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Target EV vs EV/EBITDA multiple scatter')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={TARGETS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" domain={[0, 5000]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="×" domain={[0, 25]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="l" dataKey="ev" name={tt('EV BSD M')} fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="evEbitda" name={tt('EV/EBITDA ×')} stroke={AMBER} strokeWidth={2} dot />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <span className="font-bold">{tt('Screening note:')}</span> {tt('IoT Platform premium (22×) reflects growth optionality, not current profitability — fund only if NPV exceeds WACC hurdle at mid-point synergy case.')}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/device-financing" className="font-semibold text-vfes-dark hover:underline">{tt('Device Financing →')}</Link>
          <span>·</span>
          <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
        </div>
      </>)}

      {/* ══════════════ VALUATION ═════════════════════════════════════════════ */}
      {tab === 'valuation' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('TowerCo EV (base)')} value={`BSD ${(ev / 1000).toFixed(2)}B`} delta={`${multiple}× EV/EBITDA`} trend="up" icon={Scale} accent />
          <KpiCard label={tt('Tower EBITDA')} value={`BSD ${towerEbitda.toFixed(0)}M`} delta={tt('at modelled tenancy')} trend="flat" icon={Building2} />
          <KpiCard label={tt('Premium to comps')} value={`${premiumPct > 0 ? '+' : ''}${premiumPct}%`} delta={tt('adjust slider')} trend="flat" icon={Percent} />
          <KpiCard label={tt('Adjusted EV')} value={`BSD ${(adjustedEv / 1000).toFixed(2)}B`} delta={tt('incl. control premium')} trend="up" icon={TrendingUp} />
        </div>

        <Panel title={tt('Control premium slider')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('Control premium %')}</span>
                  <span className="font-mono font-bold">{premiumPct > 0 ? '+' : ''}{premiumPct}%</span>
                </div>
                <input type="range" min={-5} max={15} step={1} value={premiumPct} onChange={e => setPremiumPct(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div className="rounded-lg bg-[#f6f7fb] p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Base EV')}</span><span className="font-bold">BSD {(ev / 1000).toFixed(2)}B</span></div>
                <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Premium')}</span><span className={`font-bold ${premiumPct >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{premiumPct >= 0 ? '+' : ''}BSD {(ev * premiumPct / 100 / 1000).toFixed(2)}B</span></div>
                <div className="flex justify-between border-t border-black/10 pt-1"><span className="font-semibold">{tt('Adjusted EV')}</span><span className="font-extrabold text-blue-700">BSD {(adjustedEv / 1000).toFixed(2)}B</span></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Tower infra comp set — EV/EBITDA (×)')}</div>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={TOWER_COMPS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="×" domain={[14, 24]} />
                    <YAxis type="category" dataKey="co" tick={{ fontSize: 9 }} width={130} />
                    <Tooltip contentStyle={TS} formatter={(v: number) => `${v}×`} />
                    <Bar dataKey="evEbitda" name={tt('EV/EBITDA')} radius={[0, 4, 4, 0]}>
                      {TOWER_COMPS.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                    <ReferenceLine x={18.3} stroke={RED} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Panel>

        <div className="mt-4 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
          <span>·</span>
          <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Tower infrastructure comps — detailed metrics')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Company')}</th>
                    <th className="text-right">{tt('EV/EBITDA')}</th>
                    <th className="text-right">{tt('Dividend yield')}</th>
                    <th className="text-right">{tt('Tenancy ratio')}</th>
                    <th>{tt('Notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { co: 'SPIE',           evE: 21.4, yield: 3.8, tenancy: 1.82, note: 'Premium for scale + growth pipeline'     },
                    { co: 'American Tower EU', evE: 20.1, yield: 4.1, tenancy: 1.74, note: 'USD re-rating; BSD premium over peers'    },
                    { co: 'Vantage Towers',    evE: 19.2, yield: 4.4, tenancy: 1.61, note: 'BTP carve-out — anchor tenant 85%'   },
                    { co: 'Cable Bahamas TowerCo', evE: 18.3, yield: 4.7, tenancy: 1.62, note: 'Target — 1.3× headroom vs comps average'  },
                    { co: 'Telxius (residual)', evE: 17.1, yield: 5.0, tenancy: 1.44, note: 'Sold down; lower quality portfolio'       },
                  ].map(row => (
                    <tr key={row.co} className={`border-b border-black/5 hover:bg-[#fafbfc] ${row.co === 'Cable Bahamas TowerCo' ? 'bg-blue-50/50' : ''}`}>
                      <td className={`py-2.5 font-semibold text-xs ${row.co === 'Cable Bahamas TowerCo' ? 'text-blue-700' : ''}`}>{row.co}</td>
                      <td className="text-right font-bold font-mono text-xs">{row.evE}×</td>
                      <td className="text-right font-mono text-xs">{row.yield}%</td>
                      <td className="text-right font-mono text-xs">{row.tenancy}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.note)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45">{tt('Cable Bahamas TowerCo at 18.3× represents a 4% discount to the peer median — justified by lower tenancy (1.62 vs 1.72 median). Grow tenancy to 1.80 to support a 19-20× ask.')}</div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'synergies' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Y5 cost synergies')} value="BSD 105M" delta={tt('run-rate per annum')} trend="up" icon={Layers} accent />
          <KpiCard label={tt('Y5 revenue synergies')} value="BSD 62M" delta={tt('anchor tenant upsell + IoT')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Synergy capture rate')} value={`${synPct}%`} delta={tt('adjust slider')} trend="flat" icon={Percent} />
          <KpiCard label={tt('NPV of synergies')} value="BSD 600M" delta={tt('net of one-off costs')} trend="up" icon={DollarSign} />
        </div>

        <Panel title={tt('Synergy capture rate')}>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>{tt('Synergy capture rate')}</span>
              <span className="font-mono font-bold">{synPct}%</span>
            </div>
            <input type="range" min={60} max={120} step={5} value={synPct} onChange={e => setSynPct(+e.target.value)} className="w-full accent-vfes-red" />
            <div className="text-[10px] text-vfes-dark/45">{tt('Adjust to model optimistic/conservative synergy realisation.')}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={adjustedSynergy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="M" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="costSyn" name={tt('Cost synergies')} fill={GREEN} stackId="s" />
                <Bar yAxisId="l" dataKey="revSyn"  name={tt('Rev synergies')}  fill={BLUE}  stackId="s" />
                <Line yAxisId="r" type="monotone" dataKey="oneOff" name={tt('One-off costs')} stroke={RED} strokeWidth={2} strokeDasharray="4 4" dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Synergy waterfall — NPV net of one-off costs (BSD M)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={SYNERGY_WATERFALL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="item" tick={{ fontSize: 9 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="value" name={tt('BSD M')} radius={[0, 4, 4, 0]}>
                    {SYNERGY_WATERFALL.map((w, i) => <Cell key={i} fill={w.type === 'neg' ? RED : w.type === 'total' ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <span>·</span>
          <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Synergy phasing register — by category (BSD M)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Category')}</th>
                    <th className="text-right">{tt('Y1')}</th>
                    <th className="text-right">{tt('Y2')}</th>
                    <th className="text-right">{tt('Y3')}</th>
                    <th className="text-right">{tt('Y5 run-rate')}</th>
                    <th>{tt('Driver')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Opex — shared services',      y1:  8, y2: 22, y3: 34, y5:  42, driver: 'Finance, HR, IT consolidation'       },
                    { cat: 'Network cost reduction',       y1:  6, y2: 16, y3: 24, y5:  32, driver: 'RAN sharing, SLA simplification'      },
                    { cat: 'Procurement leverage',         y1:  4, y2: 10, y3: 14, y5:  18, driver: 'Combined vendor scale'                },
                    { cat: 'Capital avoidance',            y1:  2, y2:  7, y3:  8, y5:  13, driver: 'Avoid parallel tower builds'          },
                    { cat: 'Revenue — anchor upsell',      y1:  3, y2:  9, y3: 20, y5:  38, driver: 'DAS, 5G densification, IoT backhaul'  },
                    { cat: 'Revenue — 3rd-party tenants',  y1:  2, y2:  9, y3: 18, y5:  24, driver: 'MNO + MVNO sub-leasing pipeline'      },
                  ].map(row => (
                    <tr key={row.cat} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-semibold text-xs">{tt(row.cat)}</td>
                      <td className="text-right font-mono text-xs">BSD {row.y1}M</td>
                      <td className="text-right font-mono text-xs">BSD {row.y2}M</td>
                      <td className="text-right font-mono text-xs">BSD {row.y3}M</td>
                      <td className="text-right font-bold text-xs text-emerald-600">BSD {row.y5}M</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.driver)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Y5 total = BSD 167M · capture rate assumption 100% in base case. Adjust the slider above for bear/bull.')}</div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'financing' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Senior debt %')} value={`${debtPct}%`} delta={tt('adjust slider')} trend="flat" icon={DollarSign} accent />
          <KpiCard label={tt('Blended cost')} value={`${blendedCost}%`} delta={tt('weighted all-in')} trend="flat" icon={Percent} />
          <KpiCard label={tt('Post-deal leverage')} value={`${leverageAfter.toFixed(2)}×`} delta={tt('pro-forma')} trend="up" icon={Scale} />
          <KpiCard label={tt('Rating headroom')} value="BBB+" delta={tt('maintained at base case')} trend="flat" icon={ShieldCheck} />
        </div>

        <Panel title={tt('Financing mix — debt vs equity proportion')}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt('Senior debt %')}</span>
                  <span className="font-mono font-bold">{debtPct}%</span>
                </div>
                <input type="range" min={20} max={75} step={5} value={debtPct} onChange={e => setDebtPct(+e.target.value)} className="w-full accent-vfes-red" />
              </div>
              <div className="rounded-lg bg-[#f6f7fb] p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Senior debt')}</span><span className="font-bold">{debtPct}% · @3.2%</span></div>
                <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Hybrid bond')}</span><span className="font-bold">{Math.round((100 - debtPct) / 2)}% · @5.4%</span></div>
                <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Equity / disposal')}</span><span className="font-bold">{Math.round((100 - debtPct) / 2)}% · @9.2%</span></div>
                <div className="flex justify-between border-t pt-1 border-black/10"><span className="font-semibold">{tt('Blended cost')}</span><span className="font-extrabold text-blue-700">{blendedCost}%</span></div>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={FINANCING_MIX} dataKey="pct" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(d: any) => `${d.pct}%`}>
                    {FINANCING_MIX.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
        <div className="mt-4 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/capital-treasury" className="font-semibold text-vfes-dark hover:underline">{tt('Capital & Treasury →')}</Link>
          <span>·</span>
          <Link to="/portal/revenue-assurance" className="font-semibold text-vfes-dark hover:underline">{tt('Revenue Assurance →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Financing instrument comparison')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Instrument')}</th>
                    <th className="text-right">{tt('Amount BSD M')}</th>
                    <th className="text-right">{tt('All-in cost')}</th>
                    <th className="text-right">{tt('Maturity')}</th>
                    <th>{tt('Leverage impact')}</th>
                    <th>{tt('Rating view')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { inst: 'Senior bond (7yr)',     amt: 1800, cost: '3.2%',  mat: '7yr',  lev: '+1.0×', rat: 'BBB+ maintained' },
                    { inst: 'Hybrid bond (10yr)',    amt:  800, cost: '5.4%',  mat: '10yr', lev: '+0.0×', rat: '50% equity credit at S&P' },
                    { inst: 'Equity placement',      amt:  800, cost: '9.2%',  mat: '—',    lev: '−0.5×', rat: 'Dilutive to existing' },
                    { inst: 'Asset disposal (2 DCs)', amt: 600, cost: '0.0%',  mat: '—',    lev: '−0.3×', rat: 'Positive FCF/debt' },
                    { inst: 'Bridge facility (6m)',  amt: 1500, cost: '3.8%',  mat: '6m',   lev: '+0.8×', rat: 'Temp — to be termed out' },
                  ].map(row => (
                    <tr key={row.inst} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(row.inst)}</td>
                      <td className="text-right font-bold font-mono text-xs">BSD {row.amt}M</td>
                      <td className="text-right font-mono text-xs">{row.cost}</td>
                      <td className="text-right font-mono text-xs">{row.mat}</td>
                      <td className="font-mono text-xs">{row.lev}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.rat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'scenarios' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Base case prob')} value="55%" delta={tt('18.3× · BSD 4.0B proceeds')} trend="flat" icon={Globe} accent />
          <KpiCard label={tt('Bull case prob')} value="25%" delta={tt('21× · BSD 4.8B proceeds')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Bear case prob')} value="20%" delta={tt('15.2× · BSD 3.5B proceeds')} trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Deal scenario comparison — EV, synergies, leverage and EPS')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Scenario')}</th>
                  <th className="text-right">{tt('EV BSD M')}</th>
                  <th className="text-right">{tt('Multiple')}</th>
                  <th className="text-right">{tt('Synergy BSD M')}</th>
                  <th className="text-right">{tt('Post-deal lev')}</th>
                  <th className="text-right">{tt('EPS Y3')}</th>
                  <th className="text-right">{tt('Prob %')}</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map(s => (
                  <tr key={s.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(s.name)}</td>
                    <td className="text-right font-bold font-mono text-xs">BSD {s.ev}M</td>
                    <td className="text-right font-mono text-xs">{s.multiple}×</td>
                    <td className="text-right text-emerald-600 font-bold text-xs">BSD {s.synergy}M</td>
                    <td className="text-right font-mono text-xs">{s.delevX}×</td>
                    <td className={`text-right font-bold text-xs ${s.epsY3.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{s.epsY3}</td>
                    <td className="text-right font-bold text-xs">{s.prob}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Scenario EV comparison (BSD M)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={SCENARIOS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" domain={[0, 5500]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="ev" name={tt('EV BSD M')} radius={[4, 4, 0, 0]}>
                    {SCENARIOS.map((s, i) => <Cell key={i} fill={i === 0 ? BLUE : i === 1 ? GREEN : AMBER} />)}
                  </Bar>
                  <Bar dataKey="synergy" name={tt('Synergy BSD M')} fill={PURPLE} opacity={0.8} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
          <Link to="/portal/cfo" className="font-semibold text-vfes-dark hover:underline">{tt('CFO Dashboard →')}</Link>
          <span>·</span>
          <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span>·</span>
          <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
        </div>

        <div className="mt-6">
          <Panel title={tt('Scenario weighted average — blended outcome (prob × value)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  { label: 'Weighted EV',       base: 4200 * 0.55, bull: 4800 * 0.25, bear: 3500 * 0.20 },
                  { label: 'Weighted proceeds', base: 3960 * 0.55, bull: 4540 * 0.25, bear: 3200 * 0.20 },
                  { label: 'Weighted synergy',  base:  160 * 0.55, bull:  200 * 0.25, bear:  100 * 0.20 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="base" name={tt('Base (55%)')} fill={BLUE} stackId="a" />
                  <Bar dataKey="bull" name={tt('Bull (25%)')} fill={GREEN} stackId="a" />
                  <Bar dataKey="bear" name={tt('Bear (20%)')} fill={AMBER} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Probability-weighted EV = BSD 4.16B · proceeds = BSD 3.92B · synergy = BSD 133M. Skew is materially positive — deal value is robust.')}</div>
          </Panel>
        </div>
      </>)}

      {/* */}
      {tab === 'due-diligence' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Workstreams active')} value="6" delta={tt('all in progress')} trend="flat" icon={ShieldCheck} accent />
          <KpiCard label={tt('VDD completion')} value="92%" delta={tt('EY · ETA Jul 15')} trend="up" icon={Activity} />
          <KpiCard label={tt('Legal sign-off')} value="78%" delta={tt('Stibbe')} trend="up" icon={Scale} />
          <KpiCard label={tt('Expected close')} value="Sep-26" delta={tt('subject to board + CC')} trend="flat" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Due diligence workstream tracker')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Workstream')}</th>
                  <th>{tt('Lead')}</th>
                  <th className="text-right">{tt('Complete %')}</th>
                  <th>{tt('ETA')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {DD_WORKSTREAMS.map(d => (
                  <tr key={d.stream} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(d.stream)}</td>
                    <td className="text-xs text-vfes-dark/65">{d.lead}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${d.complete}%`, background: d.complete >= 85 ? GREEN : AMBER }} />
                        </div>
                        <span className="font-bold text-xs">{d.complete}%</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{d.eta}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${d.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : d.status === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{tt(d.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
            <Link to="/portal/regulatory" className="font-semibold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
            <span>·</span>
            <Link to="/portal/network" className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('DD workstream progress — completion %')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={DD_WORKSTREAMS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="stream" tick={{ fontSize: 9 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="complete" name={tt('Complete %')} radius={[0, 4, 4, 0]}>
                    {DD_WORKSTREAMS.map((d, i) => <Cell key={i} fill={d.complete >= 85 ? GREEN : d.complete >= 65 ? BLUE : AMBER} />)}
                  </Bar>
                  <ReferenceLine x={80} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Red line = 80% threshold to proceed to exclusivity. IT/Network and leaseback pricing are the critical-path items.')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('M&A risk register — top deal execution risks')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Risk')}</th>
                    <th>{tt('Category')}</th>
                    <th className="text-right">{tt('Likelihood')}</th>
                    <th className="text-right">{tt('Impact BSD M')}</th>
                    <th>{tt('Mitigation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { risk: 'Leaseback escalator locks in above-inflation cost', cat: 'Commercial',  like: 'Med',  imp: 120, mit: 'Cap at CPI +50bps in term sheet'         },
                    { risk: 'Regulatory delay (URCA referral)',                  cat: 'Regulatory',  like: 'Low',  imp: 200, mit: 'Pre-notify; informal contact done'        },
                    { risk: 'Interest-rate spike between signing and close',     cat: 'Financial',   like: 'Med',  imp: 80,  mit: 'Rate lock on bridge facility at signing'  },
                    { risk: 'IT/network separation cost overrun',                cat: 'Operational', like: 'High', imp: 60,  mit: 'Fixed-price carve-out TSA with Wipro'      },
                    { risk: 'Valuation comp re-rating (SPIE down)',           cat: 'Market',      like: 'Low',  imp: 400, mit: 'Floor price covenant in SPA'              },
                    { risk: 'Tax leakage on asset transfer (stamp duty)',        cat: 'Tax',         like: 'Med',  imp: 45,  mit: 'Holding-co structure via Deloitte'         },
                  ].map(row => (
                    <tr key={row.risk} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(row.risk)}</td>
                      <td><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700">{tt(row.cat)}</span></td>
                      <td className={`text-right text-xs font-bold ${row.like === 'High' ? 'text-red-600' : row.like === 'Med' ? 'text-amber-600' : 'text-emerald-600'}`}>{tt(row.like)}</td>
                      <td className="text-right font-mono text-xs text-red-600">BSD {row.imp}M</td>
                      <td className="text-xs text-vfes-dark/65">{tt(row.mit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ ACCRETION/DILUTION ════════════════════════════════════ */}
      {tab === 'accretion' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EPS at close')} value="-0.8%" delta={tt('dilutive at close')} trend="down" icon={TrendingUp} accent />
          <KpiCard label={tt('Break-even year')} value="Y2" delta={tt('accretive from Y2 onwards')} trend="up" icon={Activity} />
          <KpiCard label={tt('EPS Year 3')} value="+0.7%" delta={tt('accretive')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('EPS Year 5')} value="+1.4%" delta={tt('full synergy run-rate')} trend="up" icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('EPS accretion / (dilution) path — Y0 to Y5 (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ACCRETION_CURVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[-1.5, 2.0]} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v >= 0 ? '+' : ''}${v}%`} />
                  <ReferenceLine y={0} stroke={RED} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="eps" name={tt('EPS accretion %')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Break-even at Y2 — synergy ramp compensates for lost tower EBITDA by end of Y1.')}</div>
          </Panel>

          <Panel title={tt('Leverage bridge — pre to post-deal (×)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={LEVERAGE_BRIDGE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="×" domain={[-1.5, 3]} />
                  <YAxis type="category" dataKey="step" tick={{ fontSize: 9 }} width={140} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}×`} />
                  <Bar dataKey="val" name={tt('×')} radius={[0, 4, 4, 0]}>
                    {LEVERAGE_BRIDGE.map((b, i) => <Cell key={i} fill={b.type === 'open' || b.type === 'close' ? BLUE : b.type === 'pos' ? GREEN : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Key accretion sensitivities')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Driver')}</th>
                  <th>{tt('Bear')}</th>
                  <th>{tt('Base')}</th>
                  <th>{tt('Bull')}</th>
                  <th>{tt('Swing')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { driver: 'EPS Year 2',           bear: '-0.5%', base: '+0.2%', bull: '+0.8%', swing: '1.3pp' },
                  { driver: 'EPS Year 3',            bear: '-0.2%', base: '+0.7%', bull: '+1.8%', swing: '2.0pp' },
                  { driver: 'Post-deal leverage (×)', bear: '1.90×', base: '1.25×', bull: '0.85×', swing: '1.05×' },
                  { driver: 'Interest saved (BSD M/yr)', bear: 'BSD 160M',  base: 'BSD 180M',  bull: 'BSD 216M',  swing: 'BSD 56M' },
                ].map(r => (
                  <tr key={r.driver} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{tt(r.driver)}</td>
                    <td className="font-mono text-xs text-red-600">{r.bear}</td>
                    <td className="font-mono font-bold text-xs">{r.base}</td>
                    <td className="font-mono text-xs text-emerald-600">{r.bull}</td>
                    <td className="font-mono text-xs text-vfes-dark/55">{r.swing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-vfes-dark/50">
            <Link to="/portal/finance" className="font-semibold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
            <span>·</span>
            <Link to="/portal/investor-relations" className="font-semibold text-vfes-dark hover:underline">{tt('Investor Relations →')}</Link>
            <span>·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('EBITDA bridge — group P&L impact of carve-out (BSD M/yr)')}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={[
                  { step: 'Group EBITDA (pre)',    val: 1760, type: 'open'  },
                  { step: 'Tower EBITDA out',       val: -Math.round(towerEbitda), type: 'neg'   },
                  { step: 'Interest saved (yr1)',   val:  Math.round(interestSaved), type: 'pos'   },
                  { step: 'Synergy Y1 (est.)',      val:  25,  type: 'pos'  },
                  { step: 'Group EBITDA (post)',     val: 1760 - Math.round(towerEbitda) + Math.round(interestSaved) + 25, type: 'close' },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis type="category" dataKey="step" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => `BSD ${v}M`} />
                  <Bar dataKey="val" name={tt('BSD M')} radius={[0, 4, 4, 0]}>
                    {[
                      { type: 'open'  },
                      { type: 'neg'   },
                      { type: 'pos'   },
                      { type: 'pos'   },
                      { type: 'close' },
                    ].map((b, i) => <Cell key={i} fill={b.type === 'neg' ? AMBER : b.type === 'close' ? BLUE : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Year 1 EBITDA is lower as tower earnings leave, but interest savings partially offset. Full re-accretion via synergies by Year 2.')}</div>
          </Panel>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#222128] mb-1">{tt('Treasury link')}</div>
          <div className="text-sm text-vfes-dark/75">{tt('Proceeds of BSD 4.0B+ flow directly to debt repayment, cutting net debt/EBITDA from 2.60× to 1.25×. This creates 1.35× turns of headroom below the 3.5× covenant — capacity for spectrum, FTTH JV and the next M&A cycle.')}</div>
          <div className="mt-2 flex items-center gap-3">
            <Link to="/portal/capital-treasury" className="text-xs font-bold text-[#222128] hover:underline">{tt('Open Capital & Treasury →')}</Link>
            <Link to="/portal/debt-collections" className="text-xs font-bold text-[#222128] hover:underline">{tt('Debt Collections →')}</Link>
          </div>
        </div>
      </>)}
    </div>
  )
}
