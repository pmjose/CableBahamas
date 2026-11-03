import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { Brain, Plane, Ship, CloudLightning, ShieldCheck, Store, Wifi, Coins, Lock, TrendingUp, Users, ChevronRight } from 'lucide-react'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import tt from '../../i18n/tt'
import {
  ML_INSIGHTS, VISITOR_MONTHS, VISITORS_BY_ISLAND, SOURCE_MARKETS, CRUISE_HOURS, PORT_CALENDAR, STORM_TIMELINE, RECOVERY_BY_ISLAND,
  RISK_BY_ISLAND, CATCHMENTS, INCLUSION_BY_ISLAND, DATA_PRODUCTS, DATA_PRODUCT_ARR, DATA_PRODUCT_PIPELINE, DATA_PRODUCT_SHARE_OF_REVENUE,
  LIVE_ARR, REVENUE_PLAN, ARR_BY_INDUSTRY, PRIVACY_CONTROLS, K_ANON_MIN,
} from '../../data/bahamas_market'

const RED = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }
const k = (v: number) => `BSD ${v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : `${Math.round(v / 1e3)}K`}`
const ICON: Record<string, typeof Plane> = { tourism: Plane, cruise: Ship, hurricane: CloudLightning, insurance: ShieldCheck, catchment: Store, inclusion: Wifi }

type Tab = 'ml' | 'products' | 'money'

export default function BahamasDataPage() {
  const [tab, setTab] = useState<Tab>('ml')
  const [product, setProduct] = useState(DATA_PRODUCTS[0].id)
  const totalImpact = ML_INSIGHTS.reduce((s, i) => s + i.impactBsd, 0)

  return (
    <div>
      <PageHeader
        title="Bahamas ML & Data Products"
        subtitle="Machine-learning insights from the network, and privacy-safe data products for tourism, cruise, public safety, insurance, retail and government"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="ML insights in production" value={ML_INSIGHTS.length} delta={`${k(totalImpact)} annual impact`} trend="up" icon={Brain} accent />
        <KpiCard label="Data products" value={DATA_PRODUCTS.length} delta={`${DATA_PRODUCTS.filter(p => p.status === 'Live').length} live · ${DATA_PRODUCTS.filter(p => p.status !== 'Live').length} pilot/launch`} trend="up" icon={Coins} />
        <KpiCard label="Data product ARR" value={k(DATA_PRODUCT_ARR)} delta={`${DATA_PRODUCT_SHARE_OF_REVENUE}% of group revenue`} trend="up" icon={TrendingUp} />
        <KpiCard label="Open pipeline" value={k(DATA_PRODUCT_PIPELINE)} delta={`${DATA_PRODUCTS.reduce((s, p) => s + p.customers, 0)} paying or pilot customers`} trend="up" icon={Users} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([['ml', 'ML insights'], ['products', 'Data products'], ['money', 'Monetisation & privacy']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === id ? 'bg-vfes-red text-vfes-dark shadow' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>{tt(label)}</button>
        ))}
      </div>

      {tab === 'ml' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ML_INSIGHTS.map(i => (
              <div key={i.id} className="rounded-xl bg-white border border-black/5 shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-vfes-dark">{tt(i.title)}</div>
                  <span className="text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded shrink-0">{i.model}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold text-vfes-dark">{i.value}</div>
                  <div className="text-xs text-vfes-dark/55">{tt(i.valueLabel)}</div>
                </div>
                <p className="text-xs text-vfes-dark/75 mt-2 leading-relaxed">{tt(i.finding)}</p>
                <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs">
                  <span className="font-bold text-emerald-800">{tt('Action')}: </span><span className="text-emerald-900">{tt(i.action)}</span>
                </div>
                <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-vfes-dark/55">
                  <span>{tt('Impact')} <b className="text-vfes-dark">{k(i.impactBsd)}/yr</b> · {tt('confidence')} {Math.round(i.confidence * 100)}%</span>
                  <Link to={`/portal/${i.route}`} className="font-semibold text-vfes-dark hover:underline inline-flex items-center gap-0.5">{tt('Open')} <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <div className="text-[10px] text-vfes-dark/40 mt-1">{tt(i.method)}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Visitor demand forecast · visitors per month (thousands)" insight={{ insight: 'Stopover visitors dip to 84K in September (storm season) and peak at 171K in March; cruise volumes are four to five times stopover but spend far less per head.', action: 'Sell the stopover forecast to hotels and airlines; schedule network maintenance in September.', impact: 'Supports the BSD 240K/yr forecast insight and the Visitor Flows product.' }}>
              <div className="h-64"><ResponsiveContainer>
                <AreaChart data={VISITOR_MONTHS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="m" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cruise" name={tt('Cruise')} stroke={NAVY} fill={NAVY} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="stopover" name={tt('Stopover')} stroke={RED} fill={RED} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer></div>
            </Panel>
            <Panel title="Predicted days to restore service after a Cat 3" insight={{ insight: 'Abaco needs 4.3 days to restore 80% of service and 13.2 days for 95%, against 1.8 and 5.5 on Grand Bahama.', action: 'Pre-stage generators and a splice crew on Abaco before the cone reaches 72 hours.', impact: 'Cuts restoration time and outage credits; supports the BSD 320K/yr recovery insight.' }}>
              <div className="h-64"><ResponsiveContainer>
                <BarChart data={RECOVERY_BY_ISLAND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="island" fontSize={11} /><YAxis fontSize={11} unit="d" /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="restore80" name={tt('80% restored')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="restore95" name={tt('95% restored')} fill={RED} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DATA_PRODUCTS.map(p => {
              const Icon = ICON[p.id]
              const active = product === p.id
              return (
                <button key={p.id} onClick={() => setProduct(p.id)} className={`text-left rounded-xl border p-4 transition ${active ? 'bg-vfes-red/5 border-vfes-red/40 shadow' : 'bg-white border-black/5 hover:border-vfes-red/30'}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-vfes-red" />
                    <div className="text-sm font-bold text-vfes-dark flex-1">{tt(p.name)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Live' ? 'bg-emerald-50 text-emerald-700' : p.status === 'Pilot' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{tt(p.status)}</span>
                  </div>
                  <div className="text-xs text-vfes-dark/65 mt-1.5">{tt(p.tagline)}</div>
                  <div className="text-[11px] text-vfes-dark/50 mt-2">{tt(p.industry)} · {tt('ARR')} <b className="text-vfes-dark">{k(p.arrBsd)}</b> · {p.customers} {tt('customers')}</div>
                </button>
              )
            })}
          </div>

          <ProductDetail id={product} />
        </div>
      )}

      {tab === 'money' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Data product ARR plan (BSD M)" insight={{ insight: `Live products earn ${k(LIVE_ARR)} a year today, the BSD 60K/month marketplace on Sharing & Marketplace. Pilots and launches bring FY26 to ${k(DATA_PRODUCT_ARR)}.`, action: 'Convert the storm-mobility and catchment pilots, then package tourism + risk for the Ministry and the big three insurers.', impact: 'FY28 target BSD 2.4M ARR, about 1.7% of group revenue at near-zero marginal cost.' }}>
              <div className="h-64"><ResponsiveContainer>
                <BarChart data={REVENUE_PLAN}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="fy" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={TS} />
                  <Bar dataKey="arr" name={tt('ARR (BSD M)')} radius={[6, 6, 0, 0]}>{REVENUE_PLAN.map((r, i) => <Cell key={r.fy} fill={i <= 1 ? RED : SLATE} />)}</Bar>
                </BarChart>
              </ResponsiveContainer></div>
            </Panel>
            <Panel title="ARR and pipeline by industry (BSD M)">
              <div className="h-64"><ResponsiveContainer>
                <BarChart data={ARR_BY_INDUSTRY} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="industry" fontSize={10} width={130} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="arr" name={tt('ARR')} stackId="a" fill={RED} />
                  <Bar dataKey="pipeline" name={tt('Pipeline')} stackId="a" fill={NAVY} fillOpacity={0.5} />
                </BarChart>
              </ResponsiveContainer></div>
            </Panel>
          </div>

          <Panel title="Pricing and buyers">
            <div className="overflow-x-auto"><table className="w-full text-xs">
              <thead><tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                <th className="py-2">{tt('Product')}</th><th>{tt('Buyers')}</th><th>{tt('Pricing')}</th><th>{tt('Delivery')}</th><th className="text-right">{tt('ARR')}</th><th className="text-right">{tt('Pipeline')}</th>
              </tr></thead>
              <tbody>{DATA_PRODUCTS.map(p => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="py-2 font-semibold">{tt(p.name)}</td><td>{p.buyers.map(b => tt(b)).join(', ')}</td><td>{tt(p.pricing)}</td><td>{tt(p.delivery)}</td>
                  <td className="text-right font-mono">{k(p.arrBsd)}</td><td className="text-right font-mono">{k(p.pipelineBsd)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Panel>

          <Panel title="Privacy by design · Data Protection Act">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {PRIVACY_CONTROLS.map(c => (
                <div key={c.control} className="rounded-lg bg-[#f7f8fa] p-3">
                  <div className="text-xs font-bold text-vfes-dark flex items-center gap-1.5"><Lock className="w-3 h-3" />{tt(c.control)}</div>
                  <div className="text-[11px] text-vfes-dark/65 mt-1">{tt(c.detail)}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-vfes-dark/50 mt-3">{tt('Visitor, cruise and storm figures are modelled for this synthetic demo, not official statistics.')}</div>
          </Panel>
        </div>
      )}
    </div>
  )
}

function ProductDetail({ id }: { id: string }) {
  const p = DATA_PRODUCTS.find(x => x.id === id)!
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel title={p.name}>
        <div className="space-y-3 text-xs">
          <p className="text-vfes-dark/75">{tt(p.tagline)}</p>
          <div><div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/50 mb-1">{tt('Buyers')}</div>{p.buyers.map(b => <span key={b} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-black/5">{tt(b)}</span>)}</div>
          <div><div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/50 mb-1">{tt('Built from')}</div>{p.inputs.map(b => <div key={b}>· {tt(b)}</div>)}</div>
          <div className="grid grid-cols-2 gap-2">
            <Fact label="Pricing" value={p.pricing} /><Fact label="Refresh" value={p.refresh} />
            <Fact label="Delivery" value={p.delivery} /><Fact label="Minimum cell" value={`${p.minCell} ${tt('devices / households')} (k ≥ ${K_ANON_MIN})`} />
          </div>
          <div className="rounded-lg bg-vfes-red/5 border border-vfes-red/15 p-2.5"><span className="font-bold">{tt('Sample insight')}: </span>{tt(p.sample)}</div>
        </div>
      </Panel>
      <div className="xl:col-span-2"><ProductChart id={id} /></div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#f7f8fa] p-2"><div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt(label)}</div><div className="font-semibold text-vfes-dark mt-0.5">{tt(value)}</div></div>
}

function ProductChart({ id }: { id: string }) {
  if (id === 'tourism') return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Visitor share and length of stay by island">
        <div className="h-64"><ResponsiveContainer>
          <BarChart data={VISITORS_BY_ISLAND.map(v => ({ ...v, island: v.island.replace('Other Family Islands', 'Other FI') }))}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="island" fontSize={10} /><YAxis yAxisId="l" fontSize={11} unit="%" /><YAxis yAxisId="r" orientation="right" fontSize={11} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="share" name={tt('Share of visitors (%)')} fill={RED} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="r" dataKey="avgNights" name={tt('Avg nights')} fill={NAVY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
      <Panel title="Source markets (% of roaming visitors)">
        <div className="h-64"><ResponsiveContainer>
          <BarChart data={SOURCE_MARKETS} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis type="number" fontSize={11} unit="%" /><YAxis type="category" dataKey="market" fontSize={10} width={140} /><Tooltip contentStyle={TS} />
            <Bar dataKey="share" name={tt('Share (%)')} fill={RED} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  )
  if (id === 'cruise') return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Bay Street footfall by hour · 5-ship vs 1-ship day">
        <div className="h-64"><ResponsiveContainer>
          <LineChart data={CRUISE_HOURS}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="h" fontSize={10} /><YAxis fontSize={11} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="fiveShip" name={tt('5 ships in port')} stroke={RED} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="oneShip" name={tt('1 ship in port')} stroke={NAVY} strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer></div>
      </Panel>
      <Panel title="This week at Nassau Cruise Port · ships and cruise visitors">
        <div className="h-64"><ResponsiveContainer>
          <BarChart data={PORT_CALENDAR}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={TS} />
            <Bar dataKey="visitors" name={tt('Cruise visitors')} radius={[4, 4, 0, 0]}>{PORT_CALENDAR.map(d => <Cell key={d.day} fill={d.ships >= 5 ? RED : NAVY} />)}</Bar>
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  )
  if (id === 'hurricane') return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="September storm replay · resident devices present (% of normal)">
        <div className="h-64"><ResponsiveContainer>
          <LineChart data={STORM_TIMELINE}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="t" fontSize={10} /><YAxis fontSize={11} domain={[70, 100]} unit="%" /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="abaco" name={tt('Abaco')} stroke={RED} strokeWidth={2.5} />
            <Line type="monotone" dataKey="grandBahama" name={tt('Grand Bahama')} stroke={NAVY} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer></div>
      </Panel>
      <Panel title="Evacuee devices arriving in Nassau (thousands)">
        <div className="h-64"><ResponsiveContainer>
          <AreaChart data={STORM_TIMELINE}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="t" fontSize={10} /><YAxis fontSize={11} /><Tooltip contentStyle={TS} />
            <Area type="monotone" dataKey="nassauInflow" name={tt('Evacuee devices (K)')} stroke={AMBER} fill={AMBER} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  )
  if (id === 'insurance') return (
    <Panel title="Island Risk Index · hurricane risk score (0–100) and outage days per year">
      <div className="h-72"><ResponsiveContainer>
        <BarChart data={[...RISK_BY_ISLAND].sort((a, b) => b.hurricaneRisk - a.hurricaneRisk).map(r => ({ ...r, island: r.island.replace('Other Family Islands', 'Other FI') }))}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="island" fontSize={10} /><YAxis yAxisId="l" fontSize={11} /><YAxis yAxisId="r" orientation="right" fontSize={11} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="hurricaneRisk" name={tt('Risk score')} radius={[4, 4, 0, 0]}>{[...RISK_BY_ISLAND].sort((a, b) => b.hurricaneRisk - a.hurricaneRisk).map(r => <Cell key={r.island} fill={r.hurricaneRisk >= 70 ? RED : AMBER} />)}</Bar>
          <Bar yAxisId="r" dataKey="outageDaysPerYr" name={tt('Outage days / yr')} fill={NAVY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer></div>
    </Panel>
  )
  if (id === 'catchment') return (
    <Panel title="Weekly catchment by location · visitors vs residents">
      <div className="h-72"><ResponsiveContainer>
        <BarChart data={CATCHMENTS} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="site" fontSize={10} width={150} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="visitorsWk" name={tt('Visitors / week')} stackId="a" fill={RED} />
          <Bar dataKey="residentsWk" name={tt('Residents / week')} stackId="a" fill={NAVY} />
        </BarChart>
      </ResponsiveContainer></div>
    </Panel>
  )
  return (
    <Panel title="Digital inclusion · fixed take-up, 5G coverage and settlements below threshold">
      <div className="h-72"><ResponsiveContainer>
        <BarChart data={INCLUSION_BY_ISLAND.map(r => ({ ...r, island: r.island.replace('Other Family Islands', 'Other FI') }))}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" /><XAxis dataKey="island" fontSize={10} /><YAxis yAxisId="l" fontSize={11} unit="%" /><YAxis yAxisId="r" orientation="right" fontSize={11} /><Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="takeUpPct" name={tt('Fixed take-up (%)')} fill={NAVY} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="l" dataKey="cov5g" name={tt('5G coverage (%)')} fill={GREEN} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="r" dataKey="settlementsBelow" name={tt('Settlements below threshold')} fill={RED} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer></div>
    </Panel>
  )
}
