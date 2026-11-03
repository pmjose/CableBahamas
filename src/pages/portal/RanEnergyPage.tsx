import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Leaf, Zap, Moon, TrendingDown, Brain, ChevronRight, Gauge,
  Sun, DollarSign, Target, Globe, Factory,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Area, AreaChart, Cell,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'
const RED    = '#EF4444'

// ─── existing data ──────────────────────────────────────────────────────────

const ENERGY_TREND = [
  { m: 'Jun', kwhPerGb: 0.142, total: 38.2 },
  { m: 'Jul', kwhPerGb: 0.138, total: 37.1 },
  { m: 'Aug', kwhPerGb: 0.131, total: 36.4 },
  { m: 'Sep', kwhPerGb: 0.124, total: 35.0 },
  { m: 'Oct', kwhPerGb: 0.118, total: 34.2 },
  { m: 'Nov', kwhPerGb: 0.109, total: 33.1 },
  { m: 'Dec', kwhPerGb: 0.104, total: 33.8 },
  { m: 'Jan', kwhPerGb: 0.101, total: 33.4 },
]

const SAVINGS_LEVERS = [
  { lever: 'MIMO deep sleep (night)',     gwh: 4.2, co2: 1180, status: 'live'    },
  { lever: 'Carrier shutdown (low load)', gwh: 3.1, co2: 870,  status: 'live'    },
  { lever: 'AI traffic-aware scheduling', gwh: 2.6, co2: 730,  status: 'pilot'   },
  { lever: 'Site rectifier optimisation', gwh: 1.8, co2: 505,  status: 'live'    },
  { lever: 'Legacy 3G shutdown',          gwh: 5.4, co2: 1515, status: 'rollout' },
]

const ENERGY_MIX = [
  { m: 'Q1', renewable: 62, grid: 38 },
  { m: 'Q2', renewable: 68, grid: 32 },
  { m: 'Q3', renewable: 74, grid: 26 },
  { m: 'Q4', renewable: 79, grid: 21 },
]

const WORST_SITES = [
  { site: 'ANT-CTR-014', region: 'Nassau',    kwhDay: 412, load: 38, flag: 'Always-on idle carriers'  },
  { site: 'GNT-PAT-007', region: 'Freeport', kwhDay: 388, load: 42, flag: 'No sleep schedule'        },
  { site: 'LVN-NRV-021', region: 'Eleuthera',   kwhDay: 356, load: 29, flag: 'Legacy rectifier'         },
  { site: 'BRG-PRT-003', region: 'Abaco',  kwhDay: 341, load: 33, flag: 'Cooling overshoot'        },
  { site: 'MEC-IND-018', region: 'Bimini',    kwhDay: 312, load: 51, flag: 'High traffic review MIMO' },
]

const COST_EXPOSURE = [
  { m: 'Q1', ppaCovered: 62, spotExposed: 38 },
  { m: 'Q2', ppaCovered: 68, spotExposed: 32 },
  { m: 'Q3', ppaCovered: 74, spotExposed: 26 },
  { m: 'Q4', ppaCovered: 79, spotExposed: 21 },
]

// ─── new data ────────────────────────────────────────────────────────────────

const SLEEP_DATA = [
  { type: 'Macro urban 5G',    sites: 1240, gwh: 3.1, pct: 88 },
  { type: 'Macro suburban 5G', sites: 1820, gwh: 4.6, pct: 62 },
  { type: 'Macro rural 4G',    sites: 3410, gwh: 5.2, pct: 41 },
  { type: 'Small cell indoor', sites: 2180, gwh: 0.8, pct: 14 },
  { type: 'Small cell outdoor',sites: 980,  gwh: 1.1, pct: 29 },
]

const SLEEP_SCHEDULE = [
  { region: 'Nassau',    deployedPct: 81, targetPct: 92, gwhRemaining: 0.8 },
  { region: 'Grand Bahama', deployedPct: 74, targetPct: 90, gwhRemaining: 1.1 },
  { region: 'Cat Island', deployedPct: 48, targetPct: 85, gwhRemaining: 2.9 },
  { region: 'Abaco',  deployedPct: 52, targetPct: 85, gwhRemaining: 1.7 },
  { region: 'Cat Island Province',    deployedPct: 63, targetPct: 88, gwhRemaining: 0.6 },
  { region: 'Other',     deployedPct: 31, targetPct: 80, gwhRemaining: 4.2 },
]

const SOLAR_DATA = [
  { region: 'Cat Island',  kWp: 4200, mwh: 6720, pctSites: 38 },
  { region: 'Nassau',     kWp: 1840, mwh: 2580, pctSites: 18 },
  { region: 'Grand Bahama',  kWp: 2100, mwh: 2940, pctSites: 22 },
  { region: 'Abaco',   kWp: 2880, mwh: 4320, pctSites: 31 },
  { region: 'Cat Island Province',     kWp: 640,  mwh: 768,  pctSites: 12 },
  { region: 'Grand Bahama', kWp: 1960, mwh: 3136, pctSites: 54 },
]

const PPA_CONTRACTS = [
  { supplier: 'Luminus Solar I', gwh: 142, bsd: 58, expiry: 2028, tech: 'Solar PV',     region: 'Cat Island'   },
  { supplier: 'Aspiravi Wind II',    gwh: 98,  bsd: 62, expiry: 2029, tech: 'Onshore wind', region: 'Abaco'     },
  { supplier: 'Eneco Wind III',     gwh: 74,  bsd: 61, expiry: 2030, tech: 'Onshore wind', region: 'Cat Island'     },
  { supplier: 'Aspiravi Solar IV',  gwh: 56,  bsd: 64, expiry: 2027, tech: 'Solar PV',     region: 'Rum Cay'      },
  { supplier: 'TotalEnergies Green I',    gwh: 42,  bsd: 65, expiry: 2031, tech: 'Solar+BESS',   region: 'Exuma' },
]

const SCOPE_TREND = [
  { m: 'Q1', s1: 8.2, s2: 42.1, s3: 24.6 },
  { m: 'Q2', s1: 7.8, s2: 38.4, s3: 23.8 },
  { m: 'Q3', s1: 7.4, s2: 33.2, s3: 23.1 },
  { m: 'Q4', s1: 7.1, s2: 28.8, s3: 22.4 },
]

const SCOPE_SUMMARY = [
  { scope: 'Scope 1 — diesel & fuel',   ktCo2: 7.1,  pctChange: -14, driver: 'Generator fuel, fleet vehicles' },
  { scope: 'Scope 2 — electricity',     ktCo2: 28.8, pctChange: -32, driver: 'Network sites, offices, DCs'    },
  { scope: 'Scope 3 — supply chain',    ktCo2: 22.4, pctChange:  -9, driver: 'Hardware mfg, logistics, waste' },
]

const OPEX_TREND = [
  { m: 'Q1 22', opex: 11.2 }, { m: 'Q2 22', opex: 10.8 },
  { m: 'Q3 22', opex: 10.4 }, { m: 'Q4 22', opex: 10.1 },
  { m: 'Q1 23', opex: 10.6 }, { m: 'Q2 23', opex: 9.8  },
  { m: 'Q3 23', opex: 9.4  }, { m: 'Q4 23', opex: 9.6  },
]

const OPEX_BY_CLASS = [
  { cls: 'Macro 5G sites',     eurMonth: 3.6, pctSpot: 18, pctPpa: 82 },
  { cls: 'Macro 4G sites',     eurMonth: 2.9, pctSpot: 22, pctPpa: 78 },
  { cls: 'Small cells',        eurMonth: 0.8, pctSpot: 41, pctPpa: 59 },
  { cls: 'Core & cloud DCs',   eurMonth: 1.4, pctSpot: 31, pctPpa: 69 },
  { cls: 'Transport nodes',    eurMonth: 0.5, pctSpot: 28, pctPpa: 72 },
  { cls: 'Offices & misc',     eurMonth: 0.3, pctSpot: 55, pctPpa: 45 },
]

const SBTI_DATA = [
  { year: '2024', target: -15, actual: -18 },
  { year: '2025', target: -25, actual: -22 },
  { year: '2026', target: -35, actual: null as number | null },
  { year: '2027', target: -45, actual: null as number | null },
  { year: '2028', target: -55, actual: null as number | null },
  { year: '2030', target: -70, actual: null as number | null },
  { year: '2035', target: -85, actual: null as number | null },
  { year: '2040', target: -100,actual: null as number | null },
]

const SITE_AUDIT = [
  { site: 'ANT-CTR-014', region: 'Nassau',    kwhDay: 412, load: 38, ppa: true,  solar: false, sleep: false, flag: 'Always-on idle carriers'  },
  { site: 'GNT-PAT-007', region: 'Freeport', kwhDay: 388, load: 42, ppa: true,  solar: true,  sleep: false, flag: 'No sleep schedule'         },
  { site: 'LVN-NRV-021', region: 'Eleuthera',   kwhDay: 356, load: 29, ppa: true,  solar: true,  sleep: false, flag: 'Legacy rectifier'          },
  { site: 'BRG-PRT-003', region: 'Abaco',  kwhDay: 341, load: 33, ppa: false, solar: false, sleep: true,  flag: 'Cooling overshoot'         },
  { site: 'MEC-IND-018', region: 'Bimini',    kwhDay: 312, load: 51, ppa: true,  solar: false, sleep: true,  flag: 'High traffic — review MIMO'},
  { site: 'HAS-SOUTH-012', region: 'Cat Island',   kwhDay: 298, load: 26, ppa: true,  solar: true,  sleep: false, flag: 'Night load > day load'     },
  { site: 'HAS-EST-009', region: 'Exuma',  kwhDay: 284, load: 44, ppa: false, solar: false, sleep: false, flag: 'No PPA — full spot'        },
  { site: 'KOR-CST-004', region: 'Andros',    kwhDay: 271, load: 37, ppa: true,  solar: true,  sleep: true,  flag: 'Best-practice reference'  },
]

const PPA_BSD_MWH  = 62
const SPOT_DEFAULT = 118

type TabId = 'overview' | 'sleep' | 'solar' | 'ppa' | 'co2' | 'opex' | 'sbti' | 'sites'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview'          },
  { id: 'sleep',    label: 'Sleep mode'         },
  { id: 'solar',    label: 'Solar & renewables' },
  { id: 'ppa',      label: 'PPA contracts'      },
  { id: 'co2',      label: 'Scope-2 CO₂'       },
  { id: 'opex',     label: 'Energy OPEX'        },
  { id: 'sbti',     label: 'SBTi targets'       },
  { id: 'sites',    label: 'Site audit'         },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function RanEnergyPage() {
  const { i18n } = useTranslation()

  // hooks 1–6: state
  const [tab,          setTab]          = useState<TabId>('overview')
  const [running,      setRunning]      = useState(false)
  const [step,         setStep]         = useState(0)
  const [showAllSites, setShowAllSites] = useState(false)
  const [spotRate,     setSpotRate]     = useState(SPOT_DEFAULT)   // interactive control
  const [regionFilter, setRegionFilter] = useState('all')

  // hooks 7–12: derived / interactive useMemo
  const totalGwh = useMemo(
    () => SAVINGS_LEVERS.reduce((s, l) => s + l.gwh, 0),
    [],
  )
  const totalCo2 = useMemo(
    () => SAVINGS_LEVERS.reduce((s, l) => s + l.co2, 0),
    [],
  )
  const savingsAtRate = useMemo(
    () => (totalGwh * 1000 * spotRate / 1e6).toFixed(1),
    [totalGwh, spotRate],
  )
  const filteredSolar = useMemo(
    () => regionFilter === 'all' ? SOLAR_DATA : SOLAR_DATA.filter((r) => r.region === regionFilter),
    [regionFilter],
  )
  const totalSolarMwh = useMemo(
    () => SOLAR_DATA.reduce((s, r) => s + r.mwh, 0),
    [],
  )
  const totalPpaGwh = useMemo(
    () => PPA_CONTRACTS.reduce((s, p) => s + p.gwh, 0),
    [],
  )

  // hook 13: side-effect (tab analytics)
  useEffect(() => { /* analytics placeholder */ }, [tab])

  const statusColor = (s: string) =>
    s === 'live' ? 'bg-emerald-50 text-emerald-700'
    : s === 'pilot' ? 'bg-amber-50 text-amber-700'
    : 'bg-blue-50 text-blue-700'

  const runOptimise = () => {
    setRunning(true); setStep(0)
    ;[1, 2, 3].forEach((s, i) => setTimeout(() => setStep(s), (i + 1) * 850))
    setTimeout(() => setRunning(false), 3000)
  }

  const displayedSites = showAllSites ? SITE_AUDIT : SITE_AUDIT.slice(0, 5)

  return (
    <div className="p-8" key={i18n.language}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title={tt('RAN Energy & ESG Ops')}
        subtitle={tt('kWh/GB · sleep-mode savings · scope-2 emissions · renewable mix')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">{tt('Net-zero 2040')}</span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">-29% {tt('kWh/GB YoY')}</span>
          </div>
        }
      />

      {/* ─── Top KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Energy intensity')}          value="0.101 kWh/GB" delta={tt('-29% YoY')}          trend="up"   icon={Gauge}       accent />
        <KpiCard label={tt('Network energy (GWh/mo)')}   value="33.4"         delta={tt('-12% YoY')}          trend="up"   icon={Zap} />
        <KpiCard label={tt('Renewable mix')}              value="79%"          delta={tt('+17 pp YoY')}        trend="up"   icon={Leaf} />
        <KpiCard label={tt('Scope-2 saved YTD')}         value={`${totalCo2.toLocaleString('en-BS')} t`} delta={tt('CO₂e avoided')} trend="up" icon={TrendingDown} />
      </div>

      {/* ─── ML insight section ──────────────────────────────────── */}
      <MlInsightSection
        heading={tt('RAN energy intelligence')}
        models={[
          { name: 'Site Energy Anomaly Detector', metric: 'F1 0.91',   sub: tt('per-site hourly outlier detection') },
          { name: 'Sleep-Mode Impact Predictor',  metric: 'MAPE 3.2%', sub: tt('GWh saved before/after deployment') },
          { name: 'Renewable Dispatch Optimiser', metric: '−8.4% cost',sub: tt('PPA vs spot real-time dispatch')    },
        ]}
        agentLabel={tt('Run Energy Optimiser')}
        agentRunningLabel={tt('Modelling…')}
        agentSteps={[
          tt('Scored all sites for energy anomalies'),
          tt('Ranked sleep-mode candidates by GWh impact'),
          tt('Modelled PPA vs spot dispatch savings'),
          tt('Produced ranked action list with BSD -value'),
        ]}
        agentBlurb={tt('The agent prices each efficiency lever at current spot rates and ranks by BSD  + scope-2 impact.')}
        decision={{
          title:    tt('Fund 3G shutdown + MIMO sleep — energy is a BSD  lever, not just CO₂'),
          detail:   tt('At current spot, the lever pipeline is worth substantial annual savings.'),
          impact:   `~BSD ${savingsAtRate}M/yr energy cost + scope-2 cut`,
          risk:     tt('3G shutdown needs VoLTE fallback coverage check'),
          linkTo:   '/portal/mobile-ran',
          linkLabel: tt('Open Mobile RAN'),
        }}
        chart={{
          kind:   'line',
          title:  tt('Energy intensity trend — kWh per GB'),
          data:   ENERGY_TREND,
          xKey:   'm',
          series: [{ key: 'kwhPerGb', name: tt('kWh/GB'), color: BLUE }],
          unit:   '',
          note:   tt('Traffic grew 24% while absolute energy fell 12% — efficiency decoupling on track.'),
        }}
      />

      {/* ─── Interactive savings model ───────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Panel title={tt('Interactive savings model — adjust spot price')}>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-semibold text-vfes-dark/70 whitespace-nowrap">
              {tt('Spot rate')}: <span className="text-vfes-dark font-bold">BSD {spotRate}/MWh</span>
            </label>
            <input
              type="range" min={60} max={220} step={5} value={spotRate}
              onChange={(e) => setSpotRate(Number(e.target.value))}
              className="flex-1 accent-vfes-red"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label={tt('Savings at rate')}    value={`BSD ${savingsAtRate}M/yr`}      delta={`${totalGwh.toFixed(0)} GWh/yr`}      trend="up" icon={Zap}       accent />
            <KpiCard label={tt('Annual energy spend')} value="BSD 38.4M"                      delta={tt('-BSD 4.6M YoY')}                      trend="up" icon={DollarSign} />
            <KpiCard label={tt('PPA saving vs spot')}  value={`BSD ${spotRate - PPA_BSD_MWH}/MWh`} delta={tt('locked vs market')}           trend="up" icon={Globe} />
          </div>
          <div className="mt-4 text-xs text-vfes-dark/55 border-t border-black/5 pt-3">
            {tt('PPA locked at BSD 62/MWh — every BSD 1 rise in spot adds ~BSD 0.25M annual exposure on the unhedged portion.')}
          </div>
        </Panel>

        <AgentDecision
          title="RAN energy agent"
          label={tt('Run Energy Optimiser')}
          runningLabel={tt('Modelling…')}
          steps={[
            tt('Quantified the GWh/yr lever pipeline at spot'),
            tt('Modelled spot-vs-PPA exposure reduction'),
            tt('Checked VoLTE fallback for 3G shutdown'),
            tt('Ranked levers by BSD  + scope-2 impact'),
          ]}
          hint={tt('The agent prices each efficiency lever at spot and ranks them by cost and scope-2 impact.')}
          result={{
            headline: tt('Fund the 3G shutdown + MIMO sleep now — energy is a BSD  lever'),
            stats: [
              { label: tt('Lever pipeline'), value: `${totalGwh.toFixed(0)} GWh/yr` },
              { label: tt('Value at spot'),  value: `~BSD ${savingsAtRate}M/yr`        },
              { label: tt('Renewable mix'),  value: '79%'                           },
            ],
            findings: [
              tt('The 17.1 GWh/yr addressable pipeline at spot prices is real money, not just CO₂ credits.'),
              tt('Shrinking the spot-exposed base via PPAs also reduces bill volatility quarter-on-quarter.'),
            ],
            note: tt('3G shutdown needs a VoLTE fallback coverage check before funding.'),
          }}
          impact={`~BSD ${savingsAtRate}M/yr energy cost + scope-2 cut`}
          risk={tt('3G shutdown needs VoLTE fallback coverage check')}
          linkTo="#/portal/mobile-ran"
          linkLabel={tt('Open Mobile RAN')}
        />
      </div>

      {/* ─── Tab navigation ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === t.id
                ? 'text-vfes-dark border-vfes-red'
                : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
            }`}
          >
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ─── Tab: overview ───────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Energy intensity — kWh per GB carried')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={ENERGY_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} domain={[0.08, 0.15]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} kWh/GB`, '']} />
                    <Line type="monotone" dataKey="kwhPerGb" stroke={BLUE} strokeWidth={3} dot={{ r: 3 }} name={tt('kWh/GB')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Traffic grew 24% while absolute energy fell 12% — efficiency decoupling on track.')}</div>
            </Panel>

            <Panel title={tt('Renewable vs grid mix (%)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={ENERGY_MIX}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="renewable" stackId="1" stroke={GREEN} fill={GREEN} name={tt('Renewable (PPA)')} />
                    <Area type="monotone" dataKey="grid"      stackId="1" stroke={SLATE} fill={SLATE} name={tt('Grid')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Leaf className="w-3 h-3" /> {tt('79% renewable via PPAs — on glide-path to 100% by 2030.')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('Energy-saving levers — GWh & CO₂e impact')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={SAVINGS_LEVERS} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit=" GWh" />
                  <YAxis type="category" dataKey="lever" stroke="#999" fontSize={10} width={170} tickFormatter={(v) => tt(v)} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} GWh · ${p.payload.co2} t CO₂e`, tt('Saving')]} />
                  <Bar dataKey="gwh" radius={[0, 6, 6, 0]}>
                    {SAVINGS_LEVERS.map((l, i) => (
                      <Cell key={i} fill={l.status === 'live' ? GREEN : l.status === 'pilot' ? AMBER : BLUE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SAVINGS_LEVERS.map((l) => (
                <span key={l.lever} className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(l.status)}`}>
                  {tt(l.lever)} — {l.gwh} GWh
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">
              {tt('Total addressable savings')}: <span className="font-bold">{totalGwh.toFixed(1)} GWh/yr</span>
              {' ≈ '}<span className="font-bold text-emerald-700">BSD {savingsAtRate}M/yr</span> {tt('at selected spot price')}
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Energy cost exposure — PPA-covered vs spot-exposed (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={COST_EXPOSURE}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="ppaCovered"  stackId="1" stroke={GREEN} fill={GREEN} name={tt('PPA-locked (BSD 62/MWh)')} />
                    <Area type="monotone" dataKey="spotExposed" stackId="1" stroke={AMBER} fill={AMBER} name={tt('Spot-exposed (BSD 118/MWh)')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('Every point shifted from spot to PPA saves ~BSD 56/MWh — efficiency also shrinks the exposed base.')}
              </div>
            </Panel>

            <Panel
              title={tt('Worst-offender sites — AI energy audit')}
              action={
                <button
                  onClick={runOptimise}
                  disabled={running}
                  className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1"
                >
                  <Moon className="w-3 h-3" />
                  {running ? tt('Optimising…') : tt('Apply Sleep Policy')}
                </button>
              }
            >
              {running && (
                <div className="mb-3 text-xs space-y-1">
                  <div className={step >= 1 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>
                    {step >= 1 ? '✓' : '○'} {tt('1. Identified idle carriers on 5 sites')}
                  </div>
                  <div className={step >= 2 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>
                    {step >= 2 ? '✓' : '○'} {tt('2. Simulated MIMO sleep — no SLA breach')}
                  </div>
                  <div className={step >= 3 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>
                    {step >= 3 ? '✓' : '○'} {tt('3. Scheduled night-time deep sleep 00:30–05:30')}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Site')}</th>
                      <th className="px-3 py-2">{tt('Region')}</th>
                      <th className="px-3 py-2 text-right">{tt('kWh/day')}</th>
                      <th className="px-3 py-2 text-right">{tt('Load %')}</th>
                      <th className="px-3 py-2">{tt('Flag')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WORST_SITES.map((s) => (
                      <tr key={s.site} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-mono text-xs">{s.site}</td>
                        <td className="px-3 py-2">{s.region}</td>
                        <td className="px-3 py-2 text-right font-mono text-red-600 font-bold">{s.kwhDay}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.load}%</td>
                        <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(s.flag)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {tt('Low-load sites with idle carriers = quick win — 1.2 GWh/yr from these 5 sites alone.')}
                <ChevronRight className="w-3 h-3" />
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ─── Tab: sleep ──────────────────────────────────────────── */}
      {tab === 'sleep' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Sleep-mode sites deployed')} value="9,630"       delta={tt('of 220 total')}        trend="up"   icon={Moon}       accent />
            <KpiCard label={tt('GWh saved via sleep')}       value="9.3 GWh/yr"  delta={tt('live deployments')}       trend="up"   icon={Zap} />
            <KpiCard label={tt('Avg energy reduction')}      value="18%"          delta={tt('per sleep-enabled site')} trend="up"   icon={TrendingDown} />
            <KpiCard label={tt('Deployment coverage')}       value="43%"          delta={tt('target 80% by Q4')}       trend="up"   icon={Target} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Sleep mode GWh savings by site type')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={SLEEP_DATA} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit=" GWh" />
                    <YAxis type="category" dataKey="type" stroke="#999" fontSize={10} width={130} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} GWh · ${p.payload.sites.toLocaleString()} sites`, '']} />
                    <Bar dataKey="gwh" fill={GREEN} radius={[0, 6, 6, 0]} name={tt('GWh saved')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Sleep deployment coverage by site type (%)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={SLEEP_DATA} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="type" stroke="#999" fontSize={10} width={130} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}% deployed`, '']} />
                    <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                      {SLEEP_DATA.map((d, i) => (
                        <Cell key={i} fill={d.pct >= 60 ? GREEN : d.pct >= 30 ? AMBER : RED} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {tt('Small cells and rural 4G still < 30% deployed — highest remaining GWh upside.')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('Regional sleep deployment schedule')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('Deployed %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Target %')}</th>
                    <th className="px-3 py-2 text-right">{tt('GWh remaining')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SLEEP_SCHEDULE.map((r) => (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.deployedPct}%</td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.targetPct}%</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">{r.gwhRemaining} GWh</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.deployedPct >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {r.deployedPct >= 70 ? tt('on track') : tt('lagging')}
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

      {/* ─── Tab: solar ──────────────────────────────────────────── */}
      {tab === 'solar' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Total solar installed')}    value="13.6 MWp"                         delta={tt('across 6 regions')}          trend="up" icon={Sun}    accent />
            <KpiCard label={tt('Annual solar generation')}  value={`${(totalSolarMwh / 1000).toFixed(1)} GWh/yr`} delta={tt('on-site self-generation')} trend="up" icon={Zap} />
            <KpiCard label={tt('Sites with solar')}         value="28%"                              delta={tt('target 60% by 2027')}         trend="up" icon={Leaf} />
          </div>

          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-xs font-semibold text-vfes-dark/70">{tt('Filter region')}:</span>
            {['all', 'Cat Island', 'Nassau', 'Grand Bahama', 'Abaco', 'Cat Island Province', 'Grand Bahama'].map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  regionFilter === r
                    ? 'bg-vfes-red text-vfes-dark border-vfes-red'
                    : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'
                }`}
              >
                {tt(r === 'all' ? 'All regions' : r)}
              </button>
            ))}
          </div>

          <Panel title={tt('Solar installed capacity & annual generation by region')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={filteredSolar}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, n: any, p: any) => [
                      `${Number(v).toLocaleString('en-BS')} · ${p.payload.pctSites}% ${tt('of sites')}`,
                      n === 'kWp' ? tt('kWp installed') : tt('MWh/yr generated'),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="kWp" fill={AMBER} radius={[6, 6, 0, 0]} name={tt('kWp installed')} />
                  <Bar dataKey="mwh" fill={GREEN} radius={[6, 6, 0, 0]} name={tt('MWh/yr generated')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Cat Island and Exuma have highest solar yield per installed kWp — prioritise expansion here.')}
            </div>
          </Panel>

          <Panel title={tt('Solar summary by region')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('kWp installed')}</th>
                    <th className="px-3 py-2 text-right">{tt('MWh/yr')}</th>
                    <th className="px-3 py-2 text-right">{tt('Sites with solar %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Yield (MWh/kWp)')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SOLAR_DATA.map((r) => (
                    <tr key={r.region} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.kWp.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.mwh.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.pctSites}%</td>
                      <td className="px-3 py-2 text-right font-mono">{(r.mwh / r.kWp).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: ppa ────────────────────────────────────────────── */}
      {tab === 'ppa' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Total GWh contracted')} value={`${totalPpaGwh} GWh/yr`} delta={tt('5 active PPAs')} trend="flat" icon={Globe}       accent />
            <KpiCard label={tt('Avg PPA rate')}          value="BSD 61/MWh"                 delta={tt('vs BSD 118 spot')} trend="up"   icon={DollarSign} />
            <KpiCard label={tt('Annual saving vs spot')} value="BSD 23.4M"                  delta={tt('at current spot')} trend="up" icon={TrendingDown} />
          </div>

          <Panel title={tt('PPA volumes by supplier (GWh/yr)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PPA_CONTRACTS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit=" GWh" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} GWh · BSD ${p.payload.bsd}/MWh · ${p.payload.tech}`, '']} />
                  <Bar dataKey="gwh" fill={GREEN} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('PPA contract registry')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Supplier')}</th>
                    <th className="px-3 py-2">{tt('Technology')}</th>
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('GWh/yr')}</th>
                    <th className="px-3 py-2 text-right">{tt('Rate BSD /MWh')}</th>
                    <th className="px-3 py-2 text-right">{tt('Expiry')}</th>
                    <th className="px-3 py-2 text-right">{tt('Saving vs spot')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PPA_CONTRACTS.map((p) => (
                    <tr key={p.supplier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.supplier}</td>
                      <td className="px-3 py-2 text-xs">{tt(p.tech)}</td>
                      <td className="px-3 py-2 text-xs">{p.region}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.gwh}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.bsd}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.expiry}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">
                        BSD {((spotRate - p.bsd) * p.gwh * 1000 / 1e6).toFixed(1)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Saving vs spot is computed at the current interactive spot rate — move the slider on the Overview tab to update.')}
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: co2 ────────────────────────────────────────────── */}
      {tab === 'co2' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Scope 1 — fuel')}         value="7.1 kt CO₂e"  delta={tt('-14% vs 2022')} trend="up" icon={Factory} />
            <KpiCard label={tt('Scope 2 — electricity')}  value="28.8 kt CO₂e" delta={tt('-32% vs 2022')} trend="up" icon={Zap}     accent />
            <KpiCard label={tt('Scope 3 — supply chain')} value="22.4 kt CO₂e" delta={tt('-9% vs 2022')}  trend="up" icon={Globe} />
          </div>

          <Panel title={tt('Scope 1 · 2 · 3 emissions trend (kt CO₂e / quarter)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={SCOPE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" kt" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="s1" stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.5} name={tt('Scope 1 fuel')} />
                  <Area type="monotone" dataKey="s2" stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.4} name={tt('Scope 2 electricity')} />
                  <Area type="monotone" dataKey="s3" stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.3} name={tt('Scope 3 supply chain')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Scope 2 declining fastest as PPA coverage grows — renewable sourcing is the dominant lever.')}
            </div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
            <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Regulatory context — Climate resilience & sustainability reporting')}</div>
            <p className="text-xs text-vfes-dark/55 leading-relaxed">
              {tt('Under Sustainability report Article 29a, the company must disclose Scope 1, 2 and 3 GHG emissions annually. The current Snowflake data pipeline automates collection from OSS, billing and logistics feeds, reducing manual effort from 6 weeks to 3 days.')}
            </p>
            <div className="mt-2 flex gap-2">
              <Link to="/portal/regulatory"
                className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
                {tt('Open Regulatory')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/finance"
                className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
                {tt('Open Finance')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <Panel title={tt('Emissions breakdown & drivers')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Scope')}</th>
                    <th className="px-3 py-2 text-right">{tt('kt CO₂e (Q4)')}</th>
                    <th className="px-3 py-2 text-right">{tt('vs 2022 %')}</th>
                    <th className="px-3 py-2">{tt('Primary driver')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SCOPE_SUMMARY.map((s) => (
                    <tr key={s.scope} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(s.scope)}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.ktCo2}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">{s.pctChange}%</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(s.driver)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: opex ───────────────────────────────────────────── */}
      {tab === 'opex' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Energy OPEX (Q4 23)')}      value="BSD 9.4M"  delta={tt('-16% vs Q4 22')}         trend="up" icon={DollarSign} accent />
            <KpiCard label={tt('OPEX / site / day')}        value="BSD 1.23"  delta={tt('-BSD 0.24 YoY')}            trend="up" icon={Gauge} />
            <KpiCard label={tt('PPA portion of OPEX')}      value="74%"    delta={tt('locked vs spot')}         trend="up" icon={Leaf} />
            <KpiCard label={tt('Energy OPEX as % of total')}value="12.4%"  delta={tt('2nd largest cost item')}  trend="flat" icon={Factory} />
          </div>
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
            <span className="font-bold">{tt('Risk flag')}:</span>{' '}
            {tt('Offices & miscellaneous have only 45% PPA coverage. At BSD 118/MWh spot, this represents an unhedged exposure of ~BSD 0.6M/yr. Recommend including in the next PPA procurement cycle.')}
          </div>

          <Panel title={tt('Quarterly energy OPEX (BSD M)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={OPEX_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="M" domain={[8, 12]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, tt('Energy OPEX')]} />
                  <Line type="monotone" dataKey="opex" stroke={BLUE} strokeWidth={3} dot={{ r: 3 }} name={tt('BSD M/quarter')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Downward trend driven by PPA ramp-up and efficiency programme — volatility risk remains on spot-exposed portion.')}
            </div>
          </Panel>

          <Panel title={tt('Energy OPEX breakdown by asset class (BSD M/month)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={OPEX_BY_CLASS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="M" />
                  <YAxis type="category" dataKey="cls" stroke="#999" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`BSD ${v}M · ${p.payload.pctPpa}% PPA`, '']} />
                  <Bar dataKey="eurMonth" fill={NAVY} radius={[0, 6, 6, 0]} name={tt('BSD M/month')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Offices & misc have lowest PPA coverage (45%) — easiest target for next PPA procurement cycle.')}
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: sbti ───────────────────────────────────────────── */}
      {tab === 'sbti' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <KpiCard label={tt('2024 vs SBTi target')} value="-18%"  delta={tt('target -15% → ahead')} trend="up" icon={Target}      accent />
            <KpiCard label={tt('2025 trajectory')}      value="-22%"  delta={tt('target -25% → gap')}   trend="up" icon={TrendingDown} />
          </div>

          <Panel title={tt('SBTi target vs actual — % reduction vs 2020 baseline')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={SBTI_DATA}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [v !== null ? `${v}%` : tt('(planned)'), tt(n as string)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="target" fill={SLATE} radius={[4, 4, 0, 0]} name={tt('SBTi target')} />
                  <Bar dataKey="actual" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Actual / forecast')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Ahead of 2024 target; 2025 requires accelerating PPA coverage and 3G shutdown to close the -3pp gap.')}
            </div>
          </Panel>

          <Panel title={tt('SBTi milestone registry')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Year')}</th>
                    <th className="px-3 py-2 text-right">{tt('SBTi target %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Actual / forecast %')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                    <th className="px-3 py-2">{tt('Gap to close')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SBTI_DATA.map((s) => {
                    const ahead = s.actual !== null && s.actual <= s.target
                    const gap   = s.actual !== null ? s.target - s.actual : null
                    return (
                      <tr key={s.year} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-mono font-bold">{s.year}</td>
                        <td className="px-3 py-2 text-right font-mono">{s.target}%</td>
                        <td className="px-3 py-2 text-right font-mono">{s.actual !== null ? `${s.actual}%` : '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ahead ? 'bg-emerald-50 text-emerald-700'
                            : s.actual !== null ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-50 text-slate-600'
                          }`}>
                            {ahead ? tt('ahead') : s.actual !== null ? tt('gap') : tt('planned')}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {gap !== null ? (gap < 0 ? `+${Math.abs(gap)}pp` : gap > 0 ? `-${gap}pp` : tt('on target')) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Net-zero by 2040 requires full electrification, 100% renewable sourcing, and a credible Scope 3 reduction programme.')}
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: sites ──────────────────────────────────────────── */}
      {tab === 'sites' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-vfes-dark/60">{tt('Showing top energy-consuming sites with efficiency flags')}</span>
            <button
              onClick={() => setShowAllSites(!showAllSites)}
              className="text-xs font-semibold text-vfes-dark hover:underline"
            >
              {showAllSites ? tt('Show top 5') : tt('Show all 8')}
            </button>
          </div>

          <Panel title={tt('Site energy audit — consumption, hedging & efficiency controls')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Site ID')}</th>
                    <th className="px-3 py-2">{tt('Region')}</th>
                    <th className="px-3 py-2 text-right">{tt('kWh/day')}</th>
                    <th className="px-3 py-2 text-right">{tt('Load %')}</th>
                    <th className="px-3 py-2 text-center">{tt('PPA')}</th>
                    <th className="px-3 py-2 text-center">{tt('Solar')}</th>
                    <th className="px-3 py-2 text-center">{tt('Sleep')}</th>
                    <th className="px-3 py-2">{tt('Flag')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSites.map((s) => (
                    <tr key={s.site} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-mono text-xs">{s.site}</td>
                      <td className="px-3 py-2">{s.region}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-red-600">{s.kwhDay}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.load}%</td>
                      <td className="px-3 py-2 text-center text-sm">{s.ppa   ? '✓' : <span className="text-red-500">✗</span>}</td>
                      <td className="px-3 py-2 text-center text-sm">{s.solar ? '✓' : <span className="text-amber-500">—</span>}</td>
                      <td className="px-3 py-2 text-center text-sm">{s.sleep ? '✓' : <span className="text-red-500">✗</span>}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(s.flag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Sites lacking all three controls (PPA + solar + sleep) represent the highest combined cost and CO₂ exposure.')}
            </div>
          </Panel>

          <Panel title={tt('Site energy consumption distribution')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SITE_AUDIT}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="site" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit=" kWh" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} kWh/day`, '']} />
                  <Bar dataKey="kwhDay" radius={[4, 4, 0, 0]}>
                    {SITE_AUDIT.map((s, i) => (
                      <Cell key={i} fill={s.ppa && s.sleep ? GREEN : s.ppa ? AMBER : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Green = PPA + sleep active · Amber = PPA only · Red = neither')}</div>
          </Panel>
        </>
      )}

      {/* ─── Energy best-practice summary ───────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Energy efficiency programme — key actions & owners')}>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-black/5 bg-emerald-50">
              <div className="text-xs font-bold text-emerald-800 mb-1">{tt('Completed — Q1 2024')}</div>
              <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
                <li>{tt('MIMO deep sleep deployed on 1,240 urban 5G sites')}</li>
                <li>{tt('Luminus Solar PPA I signed — 142 GWh/yr')}</li>
                <li>{tt('Site rectifier optimisation on 180 macro sites')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-amber-50">
              <div className="text-xs font-bold text-amber-800 mb-1">{tt('In progress — Q2 2024')}</div>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>{tt('Rural 4G sleep deployment — 41% complete, target 80%')}</li>
                <li>{tt('TotalEnergies Green PPA I final contract signature')}</li>
                <li>{tt('AI traffic-aware scheduling — pilot on 120 sites')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-blue-50">
              <div className="text-xs font-bold text-blue-800 mb-1">{tt('Planned — H2 2024')}</div>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>{tt('Legacy 3G shutdown — VoLTE fallback verification first')}</li>
                <li>{tt('Expand solar to 60% of sites by 2027')}</li>
                <li>{tt('Scope 3 supplier emissions programme launch')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs text-vfes-dark/55 border-t border-black/5 pt-3">
            {tt('Programme tracked in Snowflake — actions auto-linked to site IDs and PPA contract registry for single-pane-of-glass reporting.')}
          </div>
        </Panel>
      </div>

      {/* ─── Related cockpits ────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-vfes-dark/45 mb-3">{tt('Related cockpits')}</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/mobile-ran"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Mobile RAN')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/network"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Network overview')} <ChevronRight className="w-3 h-3" />
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
          <Link to="/portal/inventory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Network Inventory')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/regulatory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Regulatory')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/finance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Finance')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/cto"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibond text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
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
          <Link to="/portal/procurement"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Procurement')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <AskTheData />
    </div>
  )
}
