import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Gauge, TrendingUp, AlertTriangle, ChevronRight, Brain,
  Layers, Banknote, BarChart2, Sliders, DollarSign, Target,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import NET from './_network_facts'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, Area, AreaChart, Scatter, ScatterChart, ZAxis, Line, LineChart,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const RED    = '#EF4444'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'

// ─── existing data ───────────────────────────────────────────────────────────

const HEADROOM = [
  { domain: 'RAN (mobile)',        util: 78, headroom: 22 },
  { domain: '5G Core',             util: 64, headroom: 36 },
  { domain: 'Transport/backbone',  util: 81, headroom: 19 },
  { domain: 'Fixed access (PON)',  util: 69, headroom: 31 },
  { domain: 'Edge / MEC',         util: 41, headroom: 59 },
  { domain: 'Peering / CDN',       util: 86, headroom: 14 },
]

const FORECAST = [
  { m: 'Q1',   traffic: 56, ceiling: 76 },
  { m: 'Q2',   traffic: 61, ceiling: 76 },
  { m: 'Q3',   traffic: 67, ceiling: 76 },
  { m: 'Q4',   traffic: 73, ceiling: 76 },
  { m: 'Q1+1', traffic: 78, ceiling: 76 },
  { m: 'Q2+1', traffic: 84, ceiling: 92 },
]

const PROGRAMMES = [
  { name: '5G SA densification',       capexM: 7, roi: 22, npvM: 13, priority: 'go'      },
  { name: 'Backbone 400G upgrade',     capexM: 4.2, roi: 28, npvM: 11,  priority: 'go'      },
  { name: 'PON FTTH expansion',        capexM: 5.7, roi: 17, npvM: 7.8,  priority: 'go'      },
  { name: 'Edge/MEC build-out',        capexM: 2.6, roi: 9,  npvM: 1.3,  priority: 'hold'    },
  { name: 'Legacy 3G refarm',          capexM: 1.2, roi: 31, npvM: 4.8,  priority: 'go'      },
  { name: 'Rural coverage obligation', capexM: 3.2, roi: 6,  npvM: -0.4,  priority: 'mandate' },
]

const prioColor = (p: string) =>
  p === 'go'      ? 'bg-emerald-50 text-emerald-700'
  : p === 'hold'  ? 'bg-amber-50 text-amber-700'
  : 'bg-blue-50 text-blue-700'

// ─── new data ────────────────────────────────────────────────────────────────

// ROI gate thresholds — per policy & scenario
const ROI_THRESHOLD = 15   // default hurdle rate %
const ROI_GATE_DETAILS = [
  { programme: '5G SA densification',       capexM: 7,  roiBase: 22, roiStress: 16, paybackYr: 4.2, strategic: true  },
  { programme: 'Backbone 400G upgrade',     capexM: 4.2,  roiBase: 28, roiStress: 21, paybackYr: 3.4, strategic: true  },
  { programme: 'PON FTTH expansion',        capexM: 5.7,  roiBase: 17, roiStress: 11, paybackYr: 5.6, strategic: false },
  { programme: 'Edge/MEC build-out',        capexM: 2.6,  roiBase: 9,  roiStress: 4,  paybackYr: 9.8, strategic: false },
  { programme: 'Legacy 3G refarm',          capexM: 1.2,  roiBase: 31, roiStress: 26, paybackYr: 3.0, strategic: true  },
  { programme: 'Rural coverage obligation', capexM: 3.2,  roiBase: 6,  roiStress: 1,  paybackYr: null, strategic: false },
]

// Scenario analysis — traffic growth rates
const SCENARIO_DATA = [
  { m: 'Q1',   base: 56, bull: 56,  bear: 56  },
  { m: 'Q2',   base: 61, bull: 63,  bear: 58  },
  { m: 'Q3',   base: 67, bull: 71,  bear: 63  },
  { m: 'Q4',   base: 73, bull: 79,  bear: 68  },
  { m: 'Q1+1', base: 78, bull: 87,  bear: 71  },
  { m: 'Q2+1', base: 84, bull: 96,  bear: 74  },
  { m: 'Q3+1', base: 91, bull: 106, bear: 77  },
  { m: 'Q4+1', base: 98, bull: 117, bear: 81  },
]

// Utilisation trend over 6 quarters per domain
const UTIL_TREND = [
  { m: 'Q3 22', ran: 68, core: 52, transport: 71, fixed: 61 },
  { m: 'Q4 22', ran: 71, core: 55, transport: 74, fixed: 63 },
  { m: 'Q1 23', ran: 73, core: 57, transport: 76, fixed: 65 },
  { m: 'Q2 23', ran: 75, core: 61, transport: 78, fixed: 67 },
  { m: 'Q3 23', ran: 77, core: 63, transport: 80, fixed: 68 },
  { m: 'Q4 23', ran: 78, core: 64, transport: 81, fixed: 69 },
]

// Demand signals — big traffic drivers
const DEMAND_SIGNALS = [
  { source: 'Video streaming (OTT)', pctOfTotal: 38, growthYoy: 22, trend: 'up'   },
  { source: 'Social / short video',  pctOfTotal: 18, growthYoy: 31, trend: 'up'   },
  { source: 'Enterprise IoT',        pctOfTotal: 12, growthYoy: 44, trend: 'up'   },
  { source: 'Gaming / cloud',        pctOfTotal: 11, growthYoy: 17, trend: 'up'   },
  { source: 'Fixed-mobile sub.',     pctOfTotal: 9,  growthYoy: 28, trend: 'up'   },
  { source: 'Voice / messaging',     pctOfTotal: 7,  growthYoy: -3, trend: 'down' },
  { source: 'Other',                 pctOfTotal: 5,  growthYoy: 8,  trend: 'flat' },
]

// Build vs demand milestones
const BUILD_PLAN = [
  { milestone: '400G backbone ring — Nassau↔Freeport', qTarget: 'Q2 27', capexM: 2.4, domain: 'Transport',  status: 'funded'    },
  { milestone: '5G SA core expansion — +30% capacity',  qTarget: 'Q1 27', capexM: 2, domain: '5G Core',    status: 'funded'    },
  { milestone: 'Peering upgrade — +200G CDN cache',     qTarget: 'Q3 27', capexM: 0.9,  domain: 'CDN/Peering',status: 'pending'   },
  { milestone: 'RAN densification — 24 new small cells',qTarget: 'Q3 27', capexM: 2.6, domain: 'RAN',        status: 'funded'    },
  { milestone: 'FTTH passings +18K homes',              qTarget: 'Q4 27', capexM: 3.5, domain: 'Fixed',      status: 'pending'   },
  { milestone: 'Edge MEC pilot — 4 islands',              qTarget: 'Q4 28', capexM: 0.9,  domain: 'Edge/MEC',   status: 'hold'      },
  { milestone: 'Rural coverage Phase 2 — 12 Family Island sites',    qTarget: 'Q4 27', capexM: 1.5, domain: 'RAN Rural',  status: 'mandate'   },
]

// Capex envelope vs spend
const CAPEX_ENVELOPE = [
  { y: '2022', budget: 16, spent: 15.6 },
  { y: '2023', budget: 18, spent: 17.4 },
  { y: '2024', budget: 21, spent: 20.2 },
  { y: '2025', budget: 24, spent: 22.1 },
  { y: '2026', budget: 25, spent: null as number | null },
]

type TabId = 'headroom' | 'forecast' | 'capex' | 'roi' | 'scenario' | 'utilisation' | 'demand' | 'build'
const TABS: { id: TabId; label: string }[] = [
  { id: 'headroom',    label: 'Capacity headroom'    },
  { id: 'forecast',    label: 'Traffic forecast'     },
  { id: 'capex',       label: 'Capex prioritisation' },
  { id: 'roi',         label: 'ROI gates'            },
  { id: 'scenario',    label: 'Scenario'             },
  { id: 'utilisation', label: 'Utilisation trend'    },
  { id: 'demand',      label: 'Demand signals'       },
  { id: 'build',       label: 'Build plan'           },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function CapacityCapexPage() {
  const { i18n } = useTranslation()

  // hooks 1–6: state
  const [tab,         setTab]        = useState<TabId>('headroom')
  const [hurdleRate,  setHurdleRate] = useState(ROI_THRESHOLD)   // interactive control
  const [scenario,    setScenario]   = useState<'base' | 'bull' | 'bear'>('base')
  const [showAll,     setShowAll]    = useState(false)
  const [domainFilter,setDomainFilter] = useState('all')
  const [capexView,   setCapexView]  = useState<'table' | 'chart'>('chart')

  // hooks 7–12: derived
  const totalCapex = useMemo(
    () => PROGRAMMES.reduce((s, p) => s + p.capexM, 0),
    [],
  )
  const goCapex = useMemo(
    () => PROGRAMMES.filter((p) => p.priority === 'go').reduce((s, p) => s + p.capexM, 0),
    [],
  )
  const breach = useMemo(
    () => FORECAST.find((f) => f.traffic > f.ceiling),
    [],
  )
  const tightest = useMemo(
    () => [...HEADROOM].sort((a, b) => a.headroom - b.headroom)[0],
    [],
  )
  // interactive: programmes that pass the hurdle rate
  const goProgrammes = useMemo(
    () => ROI_GATE_DETAILS.filter((p) => p.roiBase >= hurdleRate),
    [hurdleRate],
  )
  const filteredBuild = useMemo(
    () => domainFilter === 'all' ? BUILD_PLAN : BUILD_PLAN.filter((b) => b.domain === domainFilter),
    [domainFilter],
  )

  // hook 13: side-effect
  useEffect(() => { /* analytics placeholder */ }, [tab])

  return (
    <div className="p-8" key={i18n.language}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title={tt('Capacity & Capex')}
        subtitle={tt('Demand vs capacity headroom · traffic forecast · capex prioritisation by NPV')}
        actions={
          <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">
            BSD {totalCapex}M {tt('capex plan')}
          </span>
        }
      />

      {/* ─── Top KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Tightest domain')}  value={tightest.domain}        delta={`${tightest.headroom}% ${tt('headroom')}`} trend="down" icon={AlertTriangle} accent />
        <KpiCard label={tt('Core capacity')}    value="1,500 Gbps" delta={tt('backbone')}              trend="flat" icon={Layers} />
        <KpiCard label={tt('Capex plan')}       value={`BSD ${totalCapex}M`}      delta={`BSD ${goCapex}M ${tt('high-ROI')}`}  trend="flat" icon={Banknote} />
        <KpiCard label={tt('Forecast breach')}  value={breach ? breach.m : '—'} delta={tt('traffic > ceiling')}          trend="down" icon={TrendingUp} />
      </div>

      {/* ─── ML insight section ──────────────────────────────────── */}
      <MlInsightSection
        heading={tt('Capacity & demand intelligence')}
        models={[
          { name: 'Traffic Demand Forecaster',    metric: 'MAPE 4.1%', sub: tt('domain-level 6-month forecast')     },
          { name: 'Congestion Risk Classifier',   metric: 'F1 0.89',   sub: tt('site-cluster congestion early-warn') },
          { name: 'Capex ROI Scorer',             metric: '+BSD 1.5M NPV', sub: tt('programme ranking vs hurdle rate')  },
        ]}
        agentLabel={tt('Run Capacity Planner')}
        agentRunningLabel={tt('Modelling…')}
        agentSteps={[
          tt('Forecast traffic by domain & site cluster'),
          tt('Identified congestion before SLA breach'),
          tt('Ranked capex programmes by NPV & obligation'),
          tt('Drafted the build plan within the capex envelope'),
        ]}
        agentBlurb={tt('Build too early and capital sits idle; too late and you breach SLAs — the planner sequences spend to demand.')}
        decision={{
          title:    tt('Fund backbone 400G & 5G densification now; hold Edge/MEC'),
          detail:   tt('Peering/CDN and transport are the tightest domains; traffic breaches the ceiling at Q1+1.'),
          impact:   tt('avoids SLA breach · BSD /PB capital efficiency'),
          risk:     tt('rural coverage is mandated (negative NPV) — fund as obligation'),
          linkTo:   '/portal/finance',
          linkLabel: tt('Open Finance'),
        }}
        chart={{
          kind:   'area',
          title:  tt('Traffic forecast vs capacity ceiling (PB/month)'),
          data:   FORECAST,
          xKey:   'm',
          series: [
            { key: 'ceiling', name: tt('Capacity ceiling'), color: AMBER },
            { key: 'traffic', name: tt('Forecast traffic'), color: BLUE  },
          ],
          unit:   ' PB',
          note:   tt('Traffic crosses the current ceiling at Q1 next year — the 400G upgrade lifts it (step at Q2+1).'),
        }}
      />

      {/* ─── Interactive ROI hurdle control ──────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Panel title={tt('Interactive ROI hurdle rate — adjust to filter programmes')}>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-semibold text-vfes-dark/70 whitespace-nowrap">
              {tt('Hurdle rate')}: <span className="text-vfes-dark font-bold">{hurdleRate}%</span>
            </label>
            <input
              type="range" min={5} max={35} step={1} value={hurdleRate}
              onChange={(e) => setHurdleRate(Number(e.target.value))}
              className="flex-1 accent-vfes-red"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label={tt('Programmes passing')}  value={`${goProgrammes.length} / ${ROI_GATE_DETAILS.length}`} delta={tt('at current hurdle')} trend="flat" icon={Target}   accent />
            <KpiCard label={tt('Approved capex BSD M')}   value={`BSD ${goProgrammes.reduce((s, p) => s + p.capexM, 0)}M`} delta={tt('to fund')}          trend="flat" icon={Banknote} />
            <KpiCard label={tt('Held capex BSD M')}       value={`BSD ${ROI_GATE_DETAILS.filter((p) => p.roiBase < hurdleRate).reduce((s, p) => s + p.capexM, 0)}M`} delta={tt('below hurdle')} trend="down" icon={AlertTriangle} />
          </div>
        </Panel>

        <AgentDecision
          title="Capacity planning agent"
          label={tt('Run Capacity Planner')}
          runningLabel={tt('Modelling…')}
          steps={[
            tt('Forecast traffic by domain & site cluster'),
            tt('Identified congestion before SLA breach'),
            tt('Ranked capex programmes by NPV & obligation'),
            tt('Drafted the build plan within the capex envelope'),
          ]}
          hint={tt('Build too early and capital sits idle; too late and you breach SLAs — the planner sequences spend to demand.')}
          result={{
            headline: tt('Fund backbone 400G & 5G densification now; hold Edge/MEC'),
            stats: [
              { label: tt('Tightest domain'), value: 'Peering/CDN 14%' },
              { label: tt('Capex plan'),       value: 'BSD 24M'           },
              { label: tt('High-ROI approved'),value: 'BSD 18M'           },
              { label: tt('Forecast breach'),  value: 'Q1+1'            },
            ],
            findings: [
              tt('Peering/CDN and transport are the tightest (14–19% headroom) — traffic breaches the ceiling next year.'),
              tt('Prioritise the high-NPV backbone and densification programmes above the hurdle rate.'),
              tt('Hold the low-ROI Edge build until demand materialises from enterprise 5G contracts.'),
            ],
            note: tt('Rural coverage is mandated (negative NPV) — fund as obligation, not by ROI ranking.'),
          }}
          impact={tt('avoids SLA breach · BSD /PB capital efficiency')}
          risk={tt('rural coverage is mandated (negative NPV) — fund as obligation')}
          linkTo="#/portal/finance"
          linkLabel={tt('Open Finance')}
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

      {/* ─── Network capacity summary strip ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Backbone capacity')}  value="1,500 Gbps" delta={tt('400G core ring')}       trend="flat" icon={Layers}       accent />
        <KpiCard label={tt('5G NR active sites')} value={NET.activeSites.toLocaleString('en-BS')} delta={tt('of total RAN')} trend="up"   icon={Gauge} />
        <KpiCard label={tt('Active spectrum MHz')} value="680 MHz"                        delta={tt('700–3500 bands')}       trend="flat" icon={BarChart2} />
        <KpiCard label={tt('Peak traffic (Gbps)')} value="420"                           delta={tt('Gbps peak hour')}       trend="up"   icon={TrendingUp} />
      </div>
      {tab === 'headroom' && (
        <>
          <Panel title={tt('Capacity utilisation & headroom by domain (%)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={HEADROOM} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="domain" stroke="#999" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% utilised · ${p.payload.headroom}% headroom`, tt('Domain')]} />
                  <Bar dataKey="util" radius={[0, 6, 6, 0]}>
                    {HEADROOM.map((h, i) => (
                      <Cell key={i} fill={h.headroom <= 15 ? RED : h.headroom <= 25 ? AMBER : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {tt('Peering/CDN (14%) and transport (19%) are the constraints — upgrade ahead of demand.')}
              <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('Domain headroom vs upgrade investment requirement')}>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Domain')}</th>
                    <th className="px-3 py-2 text-right">{tt('Utilisation %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Headroom %')}</th>
                    <th className="px-3 py-2">{tt('Risk level')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {HEADROOM.map((h) => (
                    <tr key={h.domain} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(h.domain)}</td>
                      <td className="px-3 py-2 text-right font-mono">{h.util}%</td>
                      <td className="px-3 py-2 text-right font-mono">{h.headroom}%</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          h.headroom <= 15 ? 'bg-red-50 text-red-700'
                          : h.headroom <= 25 ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {h.headroom <= 15 ? tt('critical') : h.headroom <= 25 ? tt('watch') : tt('ok')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/55">
                        {h.headroom <= 15
                          ? tt('Fund upgrade now')
                          : h.headroom <= 25
                          ? tt('Order long-lead equipment')
                          : tt('Monitor quarterly')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: forecast ───────────────────────────────────────── */}
      {tab === 'forecast' && (
        <>
          <Panel title={tt('Traffic forecast vs capacity ceiling (PB/month)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={FORECAST}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" PB" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} PB`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="ceiling" stroke={AMBER} fill={AMBER} fillOpacity={0.1} name={tt('Capacity ceiling')} />
                  <Area type="monotone" dataKey="traffic" stroke={BLUE}  fill={BLUE}  fillOpacity={0.3} name={tt('Forecast traffic')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Traffic crosses the current ceiling at Q1 next year — the 400G upgrade lifts it (step at Q2+1).')}
            </div>
          </Panel>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] font-bold uppercase text-vfes-dark/45 mb-1">{tt('Growth CAGR assumption')}</div>
              <div className="text-xl font-extrabold text-vfes-dark">+22%</div>
              <div className="text-[11px] text-vfes-dark/55">{tt('per annum — last 6 quarters actual')}</div>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] font-bold uppercase text-vfes-dark/45 mb-1">{tt('400G lift')}</div>
              <div className="text-xl font-extrabold text-blue-600">+16 PB</div>
              <div className="text-[11px] text-vfes-dark/55">{tt('buys 14 months runway at current growth')}</div>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-[10px] font-bold uppercase text-vfes-dark/45 mb-1">{tt('Next breach (post-upgrade)')}</div>
              <div className="text-xl font-extrabold text-amber-600">Q4+2</div>
              <div className="text-[11px] text-vfes-dark/55">{tt('plan second ring for 2025 budget')}</div>
            </div>
          </div>
        </>
      )}

      {/* ─── Tab: capex ──────────────────────────────────────────── */}
      {tab === 'capex' && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCapexView('chart')}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${capexView === 'chart' ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'}`}
            >
              {tt('Bubble chart')}
            </button>
            <button
              onClick={() => setCapexView('table')}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${capexView === 'table' ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'}`}
            >
              {tt('Table view')}
            </button>
          </div>

          {capexView === 'chart' && (
            <Panel title={tt('Capex programmes — capex vs ROI (bubble = NPV)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ScatterChart margin={{ left: 10, bottom: 10 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="capexM" name={tt('Capex')} unit="M" stroke="#999" fontSize={11}
                      label={{ value: tt('Capex BSD M'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis type="number" dataKey="roi" name={tt('ROI')} unit="%" stroke="#999" fontSize={11}
                      label={{ value: tt('ROI %'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis type="number" dataKey="npvM" range={[80, 460]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, n: any) => [v, tt(n as string)]} />
                    <Scatter data={PROGRAMMES}>
                      {PROGRAMMES.map((p, i) => (
                        <Cell key={i} fill={p.priority === 'go' ? GREEN : p.priority === 'hold' ? AMBER : BLUE} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('Top-right = fund (high ROI, reasonable capex). Edge/MEC sits bottom-right; rural is a mandate (negative NPV).')}
              </div>
            </Panel>
          )}

          {capexView === 'table' && (
            <Panel title={tt('Capex programme prioritisation')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Programme')}</th>
                      <th className="px-3 py-2 text-right">{tt('Capex BSD M')}</th>
                      <th className="px-3 py-2 text-right">{tt('ROI %')}</th>
                      <th className="px-3 py-2 text-right">{tt('NPV BSD M')}</th>
                      <th className="px-3 py-2">{tt('Decision')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROGRAMMES.map((p) => (
                      <tr key={p.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold">{tt(p.name)}</td>
                        <td className="px-3 py-2 text-right font-mono">BSD {p.capexM}M</td>
                        <td className="px-3 py-2 text-right font-mono">{p.roi}%</td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={p.npvM < 0 ? 'text-red-600 font-bold' : ''}>BSD {p.npvM}M</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prioColor(p.priority)}`}>{tt(p.priority)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <Panel title={tt('Capex envelope vs spend (BSD M)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CAPEX_ENVELOPE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="y" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" domain={[100, 260]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}M`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" fill={SLATE} radius={[4, 4, 0, 0]} name={tt('Budget')} />
                  <Bar dataKey="spent"  fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Spent')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Consistent underspend vs budget — indicates realistic planning or execution delays. Review programme gating cadence.')}
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: roi ────────────────────────────────────────────── */}
      {tab === 'roi' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Programmes above hurdle')}   value={`${goProgrammes.length} / ${ROI_GATE_DETAILS.length}`} delta={`≥${hurdleRate}% ROI`}     trend="flat" icon={Target}   accent />
            <KpiCard label={tt('Approved capex at hurdle')}  value={`BSD ${goProgrammes.reduce((s, p) => s + p.capexM, 0)}M`}  delta={tt('pass gate')}          trend="flat" icon={Banknote} />
            <KpiCard label={tt('Fastest payback')}           value="3.0 yr"                                                   delta={tt('3G refarm')}          trend="up"   icon={TrendingUp} />
          </div>

          <Panel title={tt('Programme payback period (years)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={ROI_GATE_DETAILS.filter((p) => p.paybackYr !== null)} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit=" yr" domain={[0, 12]} />
                  <YAxis type="category" dataKey="programme" stroke="#999" fontSize={9} width={160} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} years`, tt('Payback')]} />
                  <Bar dataKey="paybackYr" radius={[0, 6, 6, 0]}>
                    {ROI_GATE_DETAILS.filter((p) => p.paybackYr !== null).map((p, i) => (
                      <Cell key={i} fill={p.paybackYr !== null && p.paybackYr <= 4 ? GREEN : p.paybackYr !== null && p.paybackYr <= 6 ? AMBER : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('ROI gate analysis — base ROI vs stress-case ROI')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={ROI_GATE_DETAILS} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 40]} />
                  <YAxis type="category" dataKey="programme" stroke="#999" fontSize={9} width={160} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="roiBase"   fill={BLUE}  radius={[0, 4, 4, 0]} name={tt('Base ROI %')}   />
                  <Bar dataKey="roiStress" fill={AMBER} radius={[0, 4, 4, 0]} name={tt('Stress ROI %')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('PON FTTH falls below the hurdle in the stress case — ensure demand-linked milestone triggers before committing capex.')}
            </div>
          </Panel>

          <Panel title={tt('ROI gate detail — payback, strategic flag & stress case')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Programme')}</th>
                    <th className="px-3 py-2 text-right">{tt('Capex BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('ROI base %')}</th>
                    <th className="px-3 py-2 text-right">{tt('ROI stress %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Payback yr')}</th>
                    <th className="px-3 py-2 text-center">{tt('Strategic')}</th>
                    <th className="px-3 py-2">{tt('Gate decision')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROI_GATE_DETAILS.map((p) => {
                    const passesHurdle = p.roiBase >= hurdleRate
                    return (
                      <tr key={p.programme} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold text-xs">{tt(p.programme)}</td>
                        <td className="px-3 py-2 text-right font-mono">BSD {p.capexM}M</td>
                        <td className="px-3 py-2 text-right font-mono">{p.roiBase}%</td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className={p.roiStress < hurdleRate ? 'text-amber-600 font-bold' : ''}>{p.roiStress}%</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{p.paybackYr !== null ? `${p.paybackYr}y` : '—'}</td>
                        <td className="px-3 py-2 text-center">{p.strategic ? '✓' : '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${passesHurdle ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {passesHurdle ? tt('fund') : tt('hold')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: scenario ───────────────────────────────────────── */}
      {tab === 'scenario' && (
        <>
          <div className="flex gap-2 mb-4">
            {(['base', 'bull', 'bear'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${
                  scenario === s ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'
                }`}
              >
                {tt(s === 'base' ? 'Base case' : s === 'bull' ? 'Bull case (+20%)' : 'Bear case (-15%)')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard label={tt('Scenario')}              value={tt(scenario === 'base' ? 'Base' : scenario === 'bull' ? 'Bull' : 'Bear')}
              delta={tt(scenario === 'base' ? 'consensus forecast' : scenario === 'bull' ? '+20% growth' : '-15% growth')}
              trend={scenario === 'bull' ? 'up' : scenario === 'bear' ? 'down' : 'flat'} icon={BarChart2} accent />
            <KpiCard label={tt('Forecast breach (base)')} value="Q1+1"  delta={tt('traffic > ceiling')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Bull breach')}            value="Q4 23" delta={tt('3 quarters earlier')} trend="down" icon={TrendingUp} />
          </div>

          <Panel title={tt('Traffic scenario: base · bull · bear (PB/month)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={SCENARIO_DATA}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" PB" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} PB`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="base" stroke={BLUE}  strokeWidth={3}   dot={{ r: 2 }} name={tt('Base')} />
                  <Line type="monotone" dataKey="bull" stroke={GREEN} strokeWidth={2}   strokeDasharray="4 3" dot={false} name={tt('Bull +20%')} />
                  <Line type="monotone" dataKey="bear" stroke={AMBER} strokeWidth={2}   strokeDasharray="4 3" dot={false} name={tt('Bear -15%')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('In the bull case the ceiling is breached 3 quarters earlier. The 400G upgrade must have a 12-month lead time — order now to cover bull risk.')}
            </div>
          </Panel>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs font-bold text-blue-800 mb-2">{tt('Bull case (+20% CAGR)')}</div>
              <p className="text-xs text-blue-700 leading-relaxed">
                {tt('If streaming and IoT exceed consensus, Peering/CDN saturates at Q4 this year. Risk mitigation: pre-order 200G of CDN cache capacity now and lock a contingency port at NAP of the Americas (Miami) to add capacity in under 60 days.')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs font-bold text-emerald-800 mb-2">{tt('Bear case (-15% growth)')}</div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {tt('In the bear scenario the PON FTTH ROI falls below the hurdle in stress. Recommend demand-linked milestone tranches — commit Phase 1 now, gate Phase 2 on 18-month take-up rate.')}
              </p>
            </div>
          </div>

          <Panel title={tt('Scenario capex implications')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Scenario')}</th>
                    <th className="px-3 py-2 text-right">{tt('CAGR')}</th>
                    <th className="px-3 py-2 text-right">{tt('Breach at')}</th>
                    <th className="px-3 py-2 text-right">{tt('Capex BSD M')}</th>
                    <th className="px-3 py-2">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sc: 'Bull (+20%)', cagr: '+20%', breach: 'Q4 26', capex: 'BSD 27M', action: 'Pre-order CDN cache; accelerate densification' },
                    { sc: 'Base (+22%)', cagr: '+22%', breach: 'Q1+1',  capex: 'BSD 24M', action: 'Fund 400G and 5G densification'              },
                    { sc: 'Bear (-15%)', cagr: '+15%', breach: 'Q3+1',  capex: 'BSD 20M', action: 'Milestone-gate FTTH; hold Edge/MEC'          },
                  ].map((s) => (
                    <tr key={s.sc} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-bold">{tt(s.sc)}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.cagr}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.breach}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.capex}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(s.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: utilisation ────────────────────────────────────── */}
      {tab === 'utilisation' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('RAN utilisation (Q4)')}         value="78%"  delta={tt('+10pp YoY')} trend="down" icon={Gauge}   accent />
            <KpiCard label={tt('5G Core utilisation (Q4)')}     value="64%"  delta={tt('+12pp YoY')} trend="down" icon={Layers}  />
            <KpiCard label={tt('Transport utilisation (Q4)')}   value="81%"  delta={tt('+10pp YoY')} trend="down" icon={Sliders} />
            <KpiCard label={tt('Fixed access utilisation (Q4)')}value="69%"  delta={tt('+8pp YoY')}  trend="down" icon={BarChart2} />
          </div>

          <Panel title={tt('Utilisation trend by domain — 6 quarters (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={UTIL_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[40, 95]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ran"       stroke={BLUE}   strokeWidth={2.4} dot={{ r: 2 }} name={tt('RAN')} />
                  <Line type="monotone" dataKey="core"      stroke={GREEN}  strokeWidth={2.4} dot={{ r: 2 }} name={tt('Core 5G')} />
                  <Line type="monotone" dataKey="transport" stroke={AMBER}  strokeWidth={2.4} dot={{ r: 2 }} name={tt('Transport')} />
                  <Line type="monotone" dataKey="fixed"     stroke={PURPLE} strokeWidth={2.4} dot={{ r: 2 }} name={tt('Fixed access')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('All domains trending up — transport is within 6 months of the 85% advisory threshold at current growth rates.')}
            </div>
          </Panel>

          <Panel title={tt('Utilisation vs capacity upgrade timeline')}>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Domain')}</th>
                    <th className="px-3 py-2 text-right">{tt('Current util %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Advisory threshold')}</th>
                    <th className="px-3 py-2 text-right">{tt('Months to threshold')}</th>
                    <th className="px-3 py-2">{tt('Upgrade programme')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { domain: 'Peering / CDN',      util: 86, threshold: 85, mths: 0,  prog: 'CDN cache +200G'          },
                    { domain: 'Transport/backbone', util: 81, threshold: 85, mths: 5,  prog: '400G ring programme'       },
                    { domain: 'RAN (mobile)',       util: 78, threshold: 85, mths: 9,  prog: '5G SA densification'       },
                    { domain: 'Fixed access',       util: 69, threshold: 85, mths: 18, prog: 'PON FTTH expansion'        },
                    { domain: '5G Core',            util: 64, threshold: 85, mths: 24, prog: '5G SA core +30% capacity'  },
                    { domain: 'Edge / MEC',         util: 41, threshold: 80, mths: 48, prog: 'MEC build-out (on hold)'   },
                  ].map((r) => (
                    <tr key={r.domain} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(r.domain)}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.util}%</td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{r.threshold}%</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={r.mths === 0 ? 'text-red-600 font-bold' : r.mths <= 6 ? 'text-amber-600 font-bold' : 'text-emerald-700'}>
                          {r.mths === 0 ? tt('NOW') : `${r.mths}m`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(r.prog)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {/* ─── Tab: demand ─────────────────────────────────────────── */}
      {tab === 'demand' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Fastest-growing segment')} value="IoT +44%" delta={tt('YoY traffic growth')} trend="up" icon={TrendingUp} accent />
            <KpiCard label={tt('Largest segment')}         value="Video 38%" delta={tt('of total traffic')}  trend="up" icon={BarChart2} />
            <KpiCard label={tt('Declining segment')}       value="Voice −3%" delta={tt('VoIP migration')}    trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('YoY total growth')}        value="+24%"       delta={tt('total traffic')}     trend="up" icon={Gauge} />
          </div>

          <Panel title={tt('Traffic demand by service category — share & YoY growth')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DEMAND_SIGNALS} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="source" stroke="#999" fontSize={10} width={140} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% · YoY ${p.payload.growthYoy > 0 ? '+' : ''}${p.payload.growthYoy}%`, '']} />
                  <Bar dataKey="pctOfTotal" radius={[0, 6, 6, 0]}>
                    {DEMAND_SIGNALS.map((d, i) => (
                      <Cell key={i} fill={d.growthYoy > 25 ? RED : d.growthYoy > 10 ? AMBER : d.growthYoy < 0 ? SLATE : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Enterprise IoT and social/video are growing fastest — size capacity around the top 3 drivers, not the average.')}
            </div>
          </Panel>

          <Panel title={tt('Demand signal registry')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Service category')}</th>
                    <th className="px-3 py-2 text-right">{tt('Share %')}</th>
                    <th className="px-3 py-2 text-right">{tt('YoY growth %')}</th>
                    <th className="px-3 py-2">{tt('Trend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMAND_SIGNALS.map((d) => (
                    <tr key={d.source} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(d.source)}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.pctOfTotal}%</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={d.growthYoy > 25 ? 'text-red-600 font-bold' : d.growthYoy < 0 ? 'text-slate-500' : 'text-emerald-700'}>
                          {d.growthYoy > 0 ? '+' : ''}{d.growthYoy}%
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.trend === 'up' ? 'bg-blue-50 text-blue-700' : d.trend === 'down' ? 'bg-slate-50 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                          {tt(d.trend)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
            <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Demand forecast methodology')}</div>
            <p className="text-xs text-vfes-dark/55 leading-relaxed">
              {tt('Traffic demand is forecast using an ML ensemble trained on 6 quarters of per-site hourly counters, correlated with subscriber growth, device mix, and content provider CDN telemetry. Enterprise IoT is modelled separately using signed SLA commitments as a floor.')}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/portal/ai-insights"
                className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
                {tt('Open AI Insights')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/mobile-ran"
                className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
                {tt('Open Mobile RAN')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ─── Tab: build ──────────────────────────────────────────── */}
      {tab === 'build' && (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-xs font-semibold text-vfes-dark/70">{tt('Filter domain')}:</span>
            {['all', 'Transport', 'RAN', '5G Core', 'Fixed', 'CDN/Peering', 'Edge/MEC', 'RAN Rural'].map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  domainFilter === d ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'border-black/15 text-vfes-dark/60 hover:border-vfes-red/40'
                }`}
              >
                {tt(d === 'all' ? 'All domains' : d)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('Total milestones')}  value={`${BUILD_PLAN.length}`}                                           delta={tt('across 6 domains')}  trend="flat" icon={Target}   accent />
            <KpiCard label={tt('Funded milestones')} value={`${BUILD_PLAN.filter((b) => b.status === 'funded').length}`}      delta={tt('capex committed')}   trend="flat" icon={Banknote} />
            <KpiCard label={tt('Pending approval')}  value={`${BUILD_PLAN.filter((b) => b.status === 'pending').length}`}     delta={tt('awaiting gate')}     trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('Mandated spend')}    value={`BSD ${BUILD_PLAN.filter((b) => b.status === 'mandate').reduce((s, b) => s + b.capexM, 0)}M`} delta={tt('regulatory obligation')} trend="flat" icon={DollarSign} />
          </div>

          <Panel title={tt('Capex by domain — funded vs pending vs mandate (BSD M)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={['Transport','RAN','5G Core','Fixed','CDN/Peering','Edge/MEC','RAN Rural'].map((domain) => ({
                  domain,
                  funded:  BUILD_PLAN.filter((b) => b.domain === domain && b.status === 'funded').reduce((s, b) => s + b.capexM, 0),
                  pending: BUILD_PLAN.filter((b) => b.domain === domain && b.status === 'pending').reduce((s, b) => s + b.capexM, 0),
                  mandate: BUILD_PLAN.filter((b) => b.domain === domain && b.status === 'mandate').reduce((s, b) => s + b.capexM, 0),
                }))} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="M" />
                  <YAxis type="category" dataKey="domain" stroke="#999" fontSize={9} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="funded"  fill={GREEN} stackId="a" radius={[0, 0, 0, 0]} name={tt('Funded')} />
                  <Bar dataKey="pending" fill={AMBER} stackId="a" radius={[0, 0, 0, 0]} name={tt('Pending')} />
                  <Bar dataKey="mandate" fill={BLUE}  stackId="a" radius={[0, 4, 4, 0]} name={tt('Mandate')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Build plan vs demand milestones')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Milestone')}</th>
                    <th className="px-3 py-2">{tt('Domain')}</th>
                    <th className="px-3 py-2 text-right">{tt('Target Q')}</th>
                    <th className="px-3 py-2 text-right">{tt('Capex BSD M')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuild.map((b) => (
                    <tr key={b.milestone} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 text-xs">{tt(b.milestone)}</td>
                      <td className="px-3 py-2 text-xs">{tt(b.domain)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{b.qTarget}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {b.capexM}M</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          b.status === 'funded'  ? 'bg-emerald-50 text-emerald-700'
                          : b.status === 'pending' ? 'bg-amber-50 text-amber-700'
                          : b.status === 'hold'    ? 'bg-slate-50 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                        }`}>
                          {tt(b.status)}
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

      {/* ─── Capex programme efficiency summary ─────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Capex programme governance — efficiency ratios')}>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('NPV per BSD 1 capex')}      value="BSD 1.84"  delta={tt('go programmes only')}      trend="up"   icon={Target}   accent />
            <KpiCard label={tt('Avg payback (go progs)')} value="3.9 yr" delta={tt('vs hurdle 5yr max')}       trend="up"   icon={Banknote} />
            <KpiCard label={tt('Mandated / non-ROI')}    value="BSD 3.2M"   delta={tt('13% of total envelope')}   trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('Underspend vs budget')}  value="BSD 1.9M"   delta={tt('in 2025 — review gating')} trend="flat" icon={Sliders} />
          </div>
          <div className="text-xs text-vfes-dark/55 leading-relaxed">
            {tt('The capex ROI scoring model runs on Snowflake Cortex — each programme is scored monthly against the latest demand forecast. Hurdle rate is configurable via the slider on the ROI gates tab. Rural mandates are tracked separately as a regulatory obligation line.')}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/portal/finance"
              className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
              {tt('Open Finance')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/regulatory"
              className="text-xs font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
              {tt('Open Regulatory')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* ─── Planning process summary ────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Capacity planning process — data lineage & governance')}>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Data sources')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('OSS/BSS counters (per-site, hourly)')}</li>
                <li>{tt('CDN provider traffic telemetry')}</li>
                <li>{tt('Enterprise SLA commitments')}</li>
                <li>{tt('Content provider growth forecasts')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('ML models (Snowflake)')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('Traffic demand forecaster — MAPE 4.1%')}</li>
                <li>{tt('Congestion risk classifier — F1 0.89')}</li>
                <li>{tt('Capex ROI scorer — +BSD 1.5M NPV lift')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl border border-black/5 bg-[#fafbfc]">
              <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Governance cadence')}</div>
              <ul className="text-xs text-vfes-dark/55 space-y-1 list-disc list-inside">
                <li>{tt('Weekly: automated headroom alert if domain > 82%')}</li>
                <li>{tt('Monthly: ROI gate re-score vs latest forecast')}</li>
                <li>{tt('Quarterly: scenario review with CFO and CTO')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Link to="/portal/cto"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
              {tt('Open CTO')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/operations"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
              {tt('Open Operations')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/noc-map"
              className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1 ml-4">
              {tt('NOC Map')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* ─── Supply-chain dependency note ───────────────────────── */}
      <div className="mt-4 mb-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
        <div className="text-xs font-bold text-amber-800 mb-2">{tt('Supply-chain lead-time risk')}</div>
        <p className="text-xs text-amber-700 leading-relaxed">
          {tt('400G line cards and coherent optics currently carry 28-week lead times from Ciena and Nokia. The backbone upgrade programme must place orders by Q1 24 to land before traffic breaches ceiling at Q1+1. Procurement has been notified — confirm PO release gate is in the Q4 review agenda.')}
        </p>
        <div className="mt-2 flex gap-3 text-xs">
          <Link to="/portal/procurement"
            className="font-semibold text-amber-800 hover:underline inline-flex items-center gap-1">
            {tt('Open Procurement')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/supply-chain"
            className="font-semibold text-amber-800 hover:underline inline-flex items-center gap-1 ml-4">
            {tt('Open Supply Chain')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ─── Related cockpits ────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-vfes-dark/45 mb-1">{tt('Related cockpits')}</h3>
        <p className="text-xs text-vfes-dark/40 mb-3">{tt('Navigate to adjacent cockpits for detailed domain views and financial model integration.')}</p>
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
          <Link to="/portal/fixed-access"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Fixed access')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/spectrum"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Spectrum')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/ran-energy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('RAN Energy')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/inventory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Network Inventory')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/finance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Finance')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/cto"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('CTO')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/regulatory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Regulatory')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/ai-insights"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('AI Insights')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/slicing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Network Slicing')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/coverage"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('Coverage')} <ChevronRight className="w-3 h-3" />
          </Link>
          <Link to="/portal/noc-map"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-vfes-dark/70 hover:border-vfes-red hover:text-vfes-dark transition">
            {tt('NOC Map')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
        <div className="text-xs font-bold text-vfes-dark/70 mb-2">{tt('Data sourcing — how this page is powered')}</div>
        <p className="text-xs text-vfes-dark/55 leading-relaxed">
          {tt('All capacity and capex data flows via Snowflake dynamic tables from OSS counter feeds (refreshed hourly), vendor EMS (daily), and the capex management system (weekly). The ML models for traffic forecasting and ROI scoring are served from the Snowflake Model Registry and retrain automatically every Sunday at 02:00 UTC.')}
        </p>
        <div className="mt-2 flex gap-3 text-xs">
          <Link to="/portal/ai-insights"
            className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-1">
            {tt('Open AI Insights')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
