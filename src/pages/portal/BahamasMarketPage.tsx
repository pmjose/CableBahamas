import { useState } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import { CloudLightning, MapPin, Swords, CalendarClock, Plane, Radio, Users, Wallet, Wifi, ShieldCheck } from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ComposedChart, Line, Area, ReferenceLine,
} from 'recharts'
import {
  STORM, STORM_DAYS, STORM_SERIES, STORM_CREDITS_BSD, STORM_PLAYBOOK, stormState,
  FAMILY_ISLANDS, USO, MARKET_SHARE, PORTING, PORT_NET_6M, COMPETITOR_MOVES,
  URCA_CALENDAR, ROAMING, ROAMING_TTM_BSD_M,
} from '../../data/bahamas_resilience'

const NAVY = '#11567F', CORAL = '#FF4438', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const fmt = (n: number) => n.toLocaleString('en-US')
const pill = (s: string) =>
  ['Ready', 'Approved', 'In delivery', 'Low'].includes(s) ? 'bg-emerald-100 text-emerald-700'
  : ['In draft', 'Submitted', 'Pilot', 'Scheduled', 'Medium'].includes(s) ? 'bg-amber-100 text-amber-700'
  : s === 'Not started' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'

type TabId = 'storm' | 'islands' | 'competition' | 'urca' | 'tourism'
const TABS: { id: TabId; label: string; icon: typeof Radio }[] = [
  { id: 'storm', label: 'Hurricane replay', icon: CloudLightning },
  { id: 'islands', label: 'Family Islands & USO', icon: MapPin },
  { id: 'competition', label: 'Competition & porting', icon: Swords },
  { id: 'urca', label: 'URCA calendar', icon: CalendarClock },
  { id: 'tourism', label: 'Tourism roaming', icon: Plane },
]

export default function BahamasMarketPage() {
  const [tab, setTab] = useState<TabId>('storm')
  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={tt('Bahamas Resilience & Market')}
        subtitle={tt('Hurricane readiness · Family Islands · BTC competition · URCA obligations · tourism — one archipelago view')}
      />
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>
      {tab === 'storm' && <StormTab />}
      {tab === 'islands' && <IslandsTab />}
      {tab === 'competition' && <CompetitionTab />}
      {tab === 'urca' && <UrcaTab />}
      {tab === 'tourism' && <TourismTab />}
      <div className="text-[11px] text-vfes-dark/50 mt-6">{tt('Synthetic, indicative scenario built on the shared 31 Oct 2026 baseline. Storm replay is modelled, not a record of a real event.')}</div>
    </div>
  )
}

function StormTab() {
  const [idx, setIdx] = useState(STORM_DAYS.indexOf(1))
  const day = STORM_DAYS[idx]
  const s = stormState(day)
  const label = day === 0 ? tt('Landfall') : day < 0 ? `D${day}` : `D+${day}`
  const done = STORM_PLAYBOOK.filter(p => p.day <= day)
  return (<>
    <Panel title={`${tt(STORM.name)} · ${tt('landfall')} ${tt(STORM.landfall)}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold w-20">{label}</span>
        <input type="range" min={0} max={STORM_DAYS.length - 1} value={idx} onChange={e => setIdx(Number(e.target.value))} className="flex-1 accent-[#FF4438]" aria-label={tt('Storm day')} />
      </div>
      <div className="flex justify-between text-[10px] text-vfes-dark/50 px-[5.5rem]">
        {STORM_DAYS.map(d => <span key={d}>{d === 0 ? '0' : d}</span>)}
      </div>
    </Panel>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      <KpiCard label={tt('Sites down')} value={`${s.sitesDown} / 220`} delta={tt('of group sites')} trend={s.sitesDown ? 'down' : 'flat'} icon={Radio} accent />
      <KpiCard label={tt('Fixed customers out')} value={fmt(s.subsOut)} delta={`${(s.subsOut / 744).toFixed(1)}% ${tt('of 74.4K')}`} trend={s.subsOut ? 'down' : 'flat'} icon={Users} />
      <KpiCard label={tt('aliv lines without service')} value={fmt(s.mobileOut)} delta={tt('free roaming active')} trend="flat" icon={Wifi} />
      <KpiCard label={tt('Credits accruing / day')} value={`BSD ${fmt(s.dailyCreditBsd)}`} delta={`${tt('30-day total')} BSD ${(STORM_CREDITS_BSD / 1e6).toFixed(2)}M`} trend="down" icon={Wallet} />
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <Panel title={tt('Restoration curve — sites down & customers out (K)')} insight={{ insight: 'Abaco drives the long tail: aerial plant and ferry-only access hold restoration back long after Grand Bahama recovers.', action: 'Pre-stage generators and a splice crew on Abaco at the 72-hour cone, and prioritise clinic and shelter sites.', impact: `Halving Abaco half-life would cut storm credits by roughly a third of the BSD ${(STORM_CREDITS_BSD / 1e6).toFixed(2)}M total.` }}>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={STORM_SERIES}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="d" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area yAxisId="r" dataKey="subsOutK" name={tt('Fixed out (K)')} fill="#fee2e2" stroke={CORAL} />
            <Line yAxisId="l" dataKey="sitesDown" name={tt('Sites down')} stroke={NAVY} strokeWidth={2} dot={false} />
            <ReferenceLine yAxisId="l" x={label} stroke={AMBER} strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={`${tt('By island')} · ${label}`}>
        <div className="space-y-2 text-xs">
          {s.rows.map(r => {
            const pct = r.fixedSubs ? r.subsOut / r.fixedSubs * 100 : 0
            return (
              <div key={r.island}>
                <div className="flex justify-between mb-0.5"><span className="font-bold">{tt(r.island)}</span><span>{r.sitesDown}/{r.sites} {tt('sites')} · {fmt(r.subsOut)} {tt('out')}</span></div>
                <div className="h-2 bg-emerald-100 rounded"><div className="h-2 rounded" style={{ width: `${pct}%`, background: pct > 50 ? CORAL : pct > 10 ? AMBER : GREEN }} /></div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>

    <div className="mt-6">
      <Panel title={tt('Storm playbook — actions executed so far')}>
        <ol className="text-xs space-y-2">
          {STORM_PLAYBOOK.map(p => (
            <li key={p.day + p.action} className={`flex gap-3 ${p.day <= day ? '' : 'opacity-35'}`}>
              <span className="font-mono w-16 shrink-0">{p.day === 0 ? 'D0' : p.day < 0 ? `D${p.day}` : `D+${p.day}`}</span>
              <span className="font-bold w-32 shrink-0">{tt(p.who)}</span>
              <span className="flex-1">{tt(p.action)}</span>
              <span className="text-vfes-dark/50 hidden md:block w-48 shrink-0">{tt(p.system)}</span>
            </li>
          ))}
        </ol>
        <div className="text-[11px] text-vfes-dark/55 mt-3">{done.length}/{STORM_PLAYBOOK.length} {tt('playbook steps complete')} · <Link className="text-vfes-red font-bold" to="/portal/agentic-workflows">{tt('Run the hurricane agent →')}</Link></div>
      </Panel>
    </div>
  </>)
}

function IslandsTab() {
  const homes = FAMILY_ISLANDS.reduce((a, i) => a + i.homesPassed, 0)
  const subs = FAMILY_ISLANDS.reduce((a, i) => a + i.fixedSubs, 0)
  const sites = FAMILY_ISLANDS.reduce((a, i) => a + i.sites, 0)
  return (<>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard label={tt('Homes passed outside Nassau')} value={fmt(homes)} delta={`${Math.round(homes / 1400)}% ${tt('of 140K')}`} trend="flat" icon={MapPin} accent />
      <KpiCard label={tt('Fixed customers outside Nassau')} value={fmt(subs)} delta={`${Math.round(subs / homes * 100)}% ${tt('take-up')}`} trend="up" icon={Users} />
      <KpiCard label={tt('Sites outside Nassau')} value={String(sites)} delta={tt('of 220')} trend="flat" icon={Radio} />
      <KpiCard label={tt('Universal service pool FY27')} value={`BSD ${USO.fundBsdM}M`} delta={`${tt('social tariff')} BSD ${USO.socialTariffBsd}`} trend="flat" icon={ShieldCheck} />
    </div>
    <Panel title={tt('Family Islands — coverage, take-up and logistics')}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">
            {['Island', 'Hub', 'Homes passed', 'Fixed subs', 'Take-up', 'Sites', '5G pop. cov.', 'Backhaul', 'Ferry days to restore'].map(h => <th key={h} className="py-2 pr-3 font-bold">{tt(h)}</th>)}
          </tr></thead>
          <tbody>{FAMILY_ISLANDS.map(i => (
            <tr key={i.island} className="border-b border-black/5">
              <td className="py-2 pr-3 font-bold">{tt(i.island)}</td><td className="py-2 pr-3">{i.hub}</td>
              <td className="py-2 pr-3 font-mono">{fmt(i.homesPassed)}</td><td className="py-2 pr-3 font-mono">{fmt(i.fixedSubs)}</td>
              <td className="py-2 pr-3 font-mono">{i.takeUp}%</td><td className="py-2 pr-3">{i.sites}</td>
              <td className="py-2 pr-3">{i.cov5g}%</td><td className="py-2 pr-3">{tt(i.backhaul)}</td><td className="py-2 pr-3">{i.ferryDays}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Panel>
    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Panel title={tt('Take-up by island (%)')}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={FAMILY_ISLANDS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="island" tick={{ fontSize: 10 }} interval={0} /><YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TS} />
            <Bar dataKey="takeUp" name={tt('Take-up %')} fill={NAVY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={tt('Universal service projects')}>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">{['Project', 'Homes', 'Capex', 'Go-live', 'Status'].map(h => <th key={h} className="py-1.5 pr-2 font-bold">{tt(h)}</th>)}</tr></thead>
          <tbody>{USO.projects.map(p => (
            <tr key={p.name} className="border-b border-black/5">
              <td className="py-1.5 pr-2">{tt(p.name)}</td><td className="py-1.5 pr-2 font-mono">{p.homes ? fmt(p.homes) : '—'}</td>
              <td className="py-1.5 pr-2 font-mono">BSD {p.capexBsdM}M</td><td className="py-1.5 pr-2">{p.go}</td>
              <td className="py-1.5 pr-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(p.status)}`}>{tt(p.status)}</span></td>
            </tr>))}</tbody>
        </table>
      </Panel>
    </div>
  </>)
}

function CompetitionTab() {
  return (<>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard label={tt('Fixed broadband share')} value="62%" delta={tt('BTC 31%')} trend="flat" icon={Wifi} accent />
      <KpiCard label={tt('aliv mobile share')} value="41%" delta={tt('BTC 59%')} trend="up" icon={Radio} />
      <KpiCard label={tt('Net ports — 6 months')} value={`${PORT_NET_6M > 0 ? '+' : ''}${fmt(PORT_NET_6M)}`} delta={tt('aliv vs BTC')} trend={PORT_NET_6M > 0 ? 'up' : 'down'} icon={Swords} />
      <KpiCard label={tt('Live competitor moves')} value={String(COMPETITOR_MOVES.length)} delta={tt('2 high threat')} trend="down" icon={Swords} />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <Panel title={tt('Market share by segment (%)')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MARKET_SHARE} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="seg" tick={{ fontSize: 11 }} width={110} />
            <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="rev" stackId="a" name={tt('Cable Bahamas (REV + aliv)')} fill={CORAL} />
            <Bar dataKey="btc" stackId="a" name="BTC" fill="#0a8754" />
            <Bar dataKey="other" stackId="a" name={tt('Other / satellite')} fill={SLATE} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title={tt('Mobile number portability — ports in vs out')} insight={{ insight: 'September turned net-negative as BTC launched its BSD 55 unlimited plan; October recovered with the aliv Unlimited + REVTV bundle.', action: 'Keep the save desk on the port-out request window and target convergent households first.', impact: 'Each 100 net ports retained is about BSD 25K of annual mobile revenue.' }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={PORTING}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="portIn" name={tt('Port-in')} fill={GREEN} radius={[4, 4, 0, 0]} />
            <Bar dataKey="portOut" name={tt('Port-out')} fill={CORAL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <Link to="/portal/mnp" className="text-[11px] font-bold text-vfes-red">{tt('Open Number Portability & Save Desk →')}</Link>
      </Panel>
    </div>
    <div className="mt-6">
      <Panel title={tt('Competitor moves & our response')}>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">{['Date', 'Competitor', 'Move', 'Threat', 'Response'].map(h => <th key={h} className="py-2 pr-3 font-bold">{tt(h)}</th>)}</tr></thead>
          <tbody>{COMPETITOR_MOVES.map(c => (
            <tr key={c.date + c.who} className="border-b border-black/5">
              <td className="py-2 pr-3 whitespace-nowrap">{c.date}</td><td className="py-2 pr-3 font-bold">{c.who}</td><td className="py-2 pr-3">{tt(c.move)}</td>
              <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(c.threat)}`}>{tt(c.threat)}</span></td><td className="py-2 pr-3">{tt(c.response)}</td>
            </tr>))}</tbody>
        </table></div>
      </Panel>
    </div>
  </>)
}

function UrcaTab() {
  return (
    <Panel title={tt('URCA & statutory obligations — next 6 months')}>
      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="text-left text-vfes-dark/55 border-b border-black/10">{['Due', 'Obligation', 'Owner', 'Data source', 'Status'].map(h => <th key={h} className="py-2 pr-3 font-bold">{tt(h)}</th>)}</tr></thead>
        <tbody>{URCA_CALENDAR.map(u => (
          <tr key={u.item} className="border-b border-black/5">
            <td className="py-2 pr-3 font-mono whitespace-nowrap">{u.due}</td><td className="py-2 pr-3 font-bold">{tt(u.item)}</td>
            <td className="py-2 pr-3">{tt(u.owner)}</td><td className="py-2 pr-3 text-vfes-dark/60">{tt(u.source)}</td>
            <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pill(u.status)}`}>{tt(u.status)}</span></td>
          </tr>))}</tbody>
      </table></div>
      <Link to="/portal/urca-pack" className="text-[11px] font-bold text-vfes-red mt-3 inline-block">{tt('Generate the URCA pack with the agent →')}</Link>
    </Panel>
  )
}

function TourismTab() {
  const peak = ROAMING.reduce((a, r) => r.roamingK > a.roamingK ? r : a)
  return (<>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard label={tt('Inbound roaming — TTM')} value={`BSD ${ROAMING_TTM_BSD_M}M`} delta={tt('stopover + cruise')} trend="up" icon={Plane} accent />
      <KpiCard label={tt('Peak month')} value={peak.m} delta={`BSD ${fmt(peak.roamingK)}K`} trend="up" icon={CalendarClock} />
      <KpiCard label={tt('Tourist eSIMs — TTM')} value={`${ROAMING.reduce((a, r) => a + r.esimK, 0).toFixed(0)}K`} delta={tt('aliv Visitor eSIM')} trend="up" icon={Wifi} />
      <KpiCard label={tt('Visitors — TTM')} value={`${(ROAMING.reduce((a, r) => a + r.visitorsK, 0) / 1000).toFixed(1)}M`} delta={tt('stopover + cruise')} trend="flat" icon={Users} />
    </div>
    <Panel title={tt('Visitors (K) vs inbound roaming revenue (BSD K)')} insight={{ insight: 'Roaming revenue follows stopover visitors far more than cruise visitors — a stopover guest is worth about 6× a cruise passenger.', action: 'Push the aliv Visitor eSIM at LPIA arrivals and hotel check-in, where stopover guests land.', impact: 'Converting 5% more stopover visitors to eSIM adds roughly BSD 0.2M a year.' }}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={ROAMING}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis yAxisId="l" tick={{ fontSize: 11 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={TS} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="visitorsK" name={tt('Visitors (K)')} fill="#dbeafe" />
          <Line yAxisId="r" dataKey="roamingK" name={tt('Roaming (BSD K)')} stroke={CORAL} strokeWidth={2} dot />
        </ComposedChart>
      </ResponsiveContainer>
      <Link to="/portal/bahamas-data" className="text-[11px] font-bold text-vfes-red">{tt('See tourism data products →')}</Link>
    </Panel>
  </>)
}
