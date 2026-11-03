import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Siren, AlertTriangle, CheckCircle2, Clock, Smartphone, Bell,
  Activity, Wrench, TrendingDown, TrendingUp, Radio, Brain, Zap,
} from 'lucide-react'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import { MOBILE_DATA_INCIDENTS } from './_mobile_data'
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, Legend, Cell, AreaChart, Area,
  ComposedChart, PieChart, Pie, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', SLATE = '#94a3b8', RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const INCIDENTS = [
  { id: 'PI-2031', sev: 'P2', title: 'CMTS DOCSIS event lag spike',       service: 'FACT_NETWORK_KPI',  started: 'today 14:08',  dur: '38 min',  state: 'investigating', owner: 'Network DE',  root: 'upstream Kafka rebalance'                  },
  { id: 'PI-2030', sev: 'P3', title: 'CHURN_LIST_DAILY late by 14m',      service: 'CHURN_LIST_DAILY',  started: 'today 06:42',  dur: '42 min',  state: 'mitigated',     owner: 'ML platform', root: 'feature view freshness'                    },
  { id: 'PI-2028', sev: 'P3', title: 'COMPLIANCE_AGENT 5 jailbreaks',     service: 'COMPLIANCE_AGENT',  started: 'today 09:22',  dur: 'ongoing', state: 'investigating', owner: 'AI platform', root: 'external user attack'                      },
  { id: 'PI-2025', sev: 'P3', title: 'FACT_BILLING refresh failed',       service: 'FACT_BILLING',      started: 'D-1 03:14',    dur: '1h 8m',   state: 'resolved',      owner: 'Billing DE',  root: 'unique constraint violation'               },
  { id: 'PI-2024', sev: 'P2', title: 'WH_TRANSFORM_L credit spike',       service: 'WH_TRANSFORM_L',    started: 'D-1 02:48',    dur: '4h',      state: 'resolved',      owner: 'Data platform', root: 'dbt full refresh accidentally enabled'   },
  { id: 'PI-2018', sev: 'P1', title: 'Freeport CMTS outage cluster 14',  service: 'NETWORK_CORE',      started: 'D-3 09:12',    dur: '2h 14m',  state: 'resolved',      owner: 'Network ops', root: 'fibre cut · contractor strike'             },
]

const TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  p1: i === 26 ? 1 : 0,
  p2: i === 28 || i === 29 ? 1 : i % 8 === 0 ? 1 : 0,
  p3: (i % 3 === 0 ? 1 : 0) + (i % 5 === 0 ? 1 : 0),
  total: 2 + (i % 3 === 0 ? 2 : 0) + (i % 8 === 0 ? 1 : 0),
}))

const MTTR = [
  { svc: 'CUSTOMER_360',  mttr: 22 },
  { svc: 'NETWORK_CORE',  mttr: 84 },
  { svc: 'CHURN_LIST',    mttr: 38 },
  { svc: 'FACT_BILLING',  mttr: 68 },
  { svc: 'COMPLIANCE_AG', mttr: 42 },
  { svc: 'WH_TRANSFORM',  mttr: 240 },
]

const POSTMORTEMS = [
  { id: 'PM-2018-NOC',  d: '2025-10-18', title: 'Freeport CMTS outage · cluster 14',  rca: 'fibre cut by contractor strike outside-window · NMS escalation lag 22 min',         actions: '3 follow-ups · 2 closed' },
  { id: 'PM-2024-PLAT', d: '2025-10-21', title: 'WH_TRANSFORM_L credit spike',          rca: 'dbt full-refresh flag accidentally enabled in PR · slipped past CI · cost BSD 2.4K', actions: 'CI lint added · 1 closed · 1 in-flight' },
  { id: 'PM-2025-BILL', d: '2025-10-21', title: 'FACT_BILLING refresh failed',           rca: 'duplicate INVOICE_ID emitted by upstream BSS during failover',                      actions: 'BSS team unique constraint upgraded' },
]

// ─── Root cause categories ────────────────────────────────────────────────────
const RCA_CATEGORIES = [
  { cat: 'Network / infra',     count: 6,  color: NAVY   },
  { cat: 'Data / pipeline',     count: 5,  color: BLUE   },
  { cat: 'Software / config',   count: 4,  color: AMBER  },
  { cat: 'External (vendor)',   count: 3,  color: SLATE  },
  { cat: 'Human error',         count: 2,  color: RED    },
  { cat: 'Security',            count: 1,  color: '#7C3AED' },
]

// ─── Major incident timeline ──────────────────────────────────────────────────
const MAJOR_INCIDENTS = [
  { id: 'MI-001', date: '2025-10-18', title: 'Freeport CMTS fibre cut', dur: '2h14m', impact: '4,820 subs', status: 'Closed', change: false },
  { id: 'MI-002', date: '2025-09-29', title: 'UPF cluster-B session loss', dur: '1h38m', impact: '2,100 sessions', status: 'Closed', change: true },
  { id: 'MI-003', date: '2025-09-12', title: 'Nassau transport link OSPF flap', dur: '48m', impact: '840 B2B subs', status: 'Closed', change: false },
  { id: 'MI-004', date: '2025-08-24', title: 'WH_TRANSFORM_L dbt credit spike', dur: '4h', impact: 'BSD 2.4K cost', status: 'Closed', change: false },
  { id: 'MI-005', date: '2025-07-11', title: 'Peering Local peering packet drop storm', dur: '22m', impact: '12,000 subs', status: 'Closed', change: true },
]

// ─── On-call team rotation ────────────────────────────────────────────────────
const ONCALL_TEAMS = [
  { team: 'NOC bridge',     oncall: 'L. Knowles',  escalation: 'M. Willems',   incidents30d: 6, mttd: 3,  mttr: 28 },
  { team: 'RAN ops',        oncall: 'A. Ferguson',   escalation: 'F. Rolle',   incidents30d: 4, mttd: 8,  mttr: 48 },
  { team: 'Core ops',       oncall: 'P. Vermeulen', escalation: 'C. Bethel',      incidents30d: 3, mttd: 5,  mttr: 38 },
  { team: 'Transport ops',  oncall: 'R. Adderley',   escalation: 'B. Knowles',  incidents30d: 2, mttd: 12, mttr: 62 },
  { team: 'Data platform',  oncall: 'J. Ferguson',   escalation: 'I. Rolle',   incidents30d: 5, mttd: 6,  mttr: 42 },
]

// ─── MTTD / MTTR trend ───────────────────────────────────────────────────────
const MTTD_MTTR_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i],
  mttd: 12 - i * 0.5 + (i === 4 ? 3 : 0),
  mttr: 58 - i * 1.8 + (i === 4 ? 10 : 0),
}))

// ─── Change-related incidents ─────────────────────────────────────────────────
const CHANGE_INCIDENTS = [
  { wk: 'W1', change_rel: 2, non_change: 4 }, { wk: 'W2', change_rel: 1, non_change: 5 },
  { wk: 'W3', change_rel: 3, non_change: 3 }, { wk: 'W4', change_rel: 1, non_change: 4 },
  { wk: 'W5', change_rel: 0, non_change: 3 }, { wk: 'W6', change_rel: 2, non_change: 2 },
  { wk: 'W7', change_rel: 1, non_change: 3 }, { wk: 'W8', change_rel: 1, non_change: 2 },
]

// ─── SLO burn (incidents) ─────────────────────────────────────────────────────
const SLO_BURN = [
  { service: 'NETWORK_CORE',  budget: 100, burned: 84, status: 'Red'   },
  { service: 'FACT_BILLING',  budget: 100, burned: 68, status: 'Amber' },
  { service: 'WH_TRANSFORM',  budget: 100, burned: 52, status: 'Amber' },
  { service: 'CHURN_LIST',    budget: 100, burned: 38, status: 'Green' },
  { service: 'CUSTOMER_360',  budget: 100, burned: 22, status: 'Green' },
]

// ─── Problem register ─────────────────────────────────────────────────────────
const KNOWN_ISSUES = [
  { id: 'PRB-0098', title: 'Local peering micro-congestion firmware bug', sev: 'P2', cim: 1840, eta: '2026-12-18' },
  { id: 'PRB-0092', title: 'UPF N4 race condition geo-redundancy',  sev: 'P2', cim: 1230, eta: '2027-01-01' },
  { id: 'PRB-0085', title: 'Freeport PON ONT serial collision',      sev: 'P3', cim: 640,  eta: '2026-12-25' },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'board' | 'mttd' | 'rca' | 'timeline' | 'problems' | 'mobile' | 'oncall'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',  label: 'Overview',           icon: Activity      },
  { id: 'board',     label: 'Incident Board',      icon: Siren         },
  { id: 'mttd',      label: 'MTTD / MTTR',         icon: Clock         },
  { id: 'rca',       label: 'Root Cause',          icon: Wrench        },
  { id: 'timeline',  label: 'Major Incidents',     icon: AlertTriangle },
  { id: 'problems',  label: 'Problem Mgmt',        icon: Brain         },
  { id: 'mobile',    label: 'Mobile / RAN',        icon: Smartphone    },
  { id: 'oncall',    label: 'On-call',             icon: Bell          },
]

const sevC = (s: string) =>
  s === 'P1' ? 'bg-rose-100 text-rose-700' : s === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
const stateC = (s: string) =>
  s === 'resolved' ? 'bg-emerald-100 text-emerald-700' : s === 'mitigated' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
const ragC = (r: string) =>
  r === 'Green' ? 'bg-emerald-100 text-emerald-700' : r === 'Amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

export default function IncidentsPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [sevFilter, setSevFilter] = useState<string>('All')
  const [stateFilter, setStateFilter] = useState<string>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime] = useState<string>('')
  const [mttdSort, setMttdSort] = useState<'mttr' | 'mttd'>('mttr')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredIncidents = useMemo(
    () => INCIDENTS.filter(i => {
      if (sevFilter !== 'All' && i.sev !== sevFilter) return false
      if (stateFilter !== 'All' && i.state !== stateFilter) return false
      return true
    }),
    [sevFilter, stateFilter],
  )

  const sortedOnCall = useMemo(
    () => [...ONCALL_TEAMS].sort((a, b) => mttdSort === 'mttr' ? a.mttr - b.mttr : a.mttd - b.mttd),
    [mttdSort],
  )

  const openCount = INCIDENTS.filter(i => i.state !== 'resolved').length

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Incidents · On-call · Postmortems')}
        subtitle={tt('Incident board · MTTD/MTTR · root-cause categories · major incident timeline · problem management · on-call')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {tt('Live · ')}{liveTime} · {openCount} {tt('open')}
            </span>
          </div>
        }
      />

      {/* ── ML Intelligence ───────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Incident intelligence"
        models={[
          { name: 'MTTD Predictor',      metric: 'MAE 2.1 min',    sub: 'time-to-detect from alert stream'   },
          { name: 'RCA Classifier',      metric: 'accuracy 91.4%', sub: '6 root-cause categories'            },
          { name: 'Recurrence Detector', metric: 'recall 0.87',    sub: 'flags known-issue patterns early'    },
        ]}
        agentLabel="Run Incident Triage Agent"
        agentRunningLabel="Triaging…"
        agentSteps={[
          'Classified 17 open incidents by RCA category using Cortex AI',
          'Flagged 3 potential known-issue recurrences from problem register',
          'Generated MTTR estimates for all P1/P2 based on historical data',
          'Drafted escalation paths for on-call rotation',
        ]}
        agentBlurb="A single model trained on 3 years of incident history spots recurrence patterns in seconds — turning a 22-minute triage into a 7-second AI correlation."
        decision={{
          title: 'Enable AI-driven incident triage for all P1/P2 events',
          detail: 'The RCA classifier achieves 91.4% accuracy across 6 categories. Routing every P1/P2 through it before human triage cuts MTTD by ~40% and prevents false-escalation noise.',
          impact: '-40% MTTD · -22% MTTR · false-positive incidents halved',
          risk: 'Classifier confidence < 80% should still route to human review',
          linkTo: '#/portal/assurance',
          linkLabel: 'Open Assurance Dashboard',
        }}
        chart={{
          kind: 'bar',
          title: 'MTTR by service — last 30 days (minutes)',
          xKey: 'svc',
          unit: 'm',
          data: MTTR,
          series: [{ key: 'mttr', name: 'MTTR (min)', color: NAVY }],
          colorBy: { key: 'mttr', high: 80, mid: 40 },
          note: 'WH_TRANSFORM outlier driven by runaway dbt full-refresh — CI gate now in place.',
        }}
      />

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Siren className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-900 text-sm">
                {tt('3 open incidents · P2 CMTS investigating · P3 compliance agent active · WH_TRANSFORM SLO 52% burned')}
              </div>
              <div className="text-xs text-rose-800 mt-1">
                {tt('V_RAN_TELEMETRY p95 breach (DATA-INC-2033) is the only active mobile incident — clustering-key fix queued for next maintenance window.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/war-room"  className="text-xs font-bold text-rose-900 hover:underline">{tt('War Room →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-rose-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
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

      {/* ═══════════════ OVERVIEW ══════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <KpiCard label={tt('Open incidents')} value={String(openCount)} trend="down" icon={Siren}         accent />
          <KpiCard label={tt('P1 (30d)')}       value="1"                 trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('P2 (30d)')}       value="4"                 trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('P3 (30d)')}       value="12"                trend="up"   icon={CheckCircle2}  />
          <KpiCard label={tt('MTTR 30d')}       value="38 min"            delta="-14m YoY" trend="up" icon={Clock} />
          <KpiCard label={tt('SLO burn (data)')}value="14%"               delta={tt('of budget')} trend="up" icon={TrendingDown} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Incident frequency — 30 days')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p3" name="P3" stackId="a" fill={BLUE}      />
                  <Bar dataKey="p2" name="P2" stackId="a" fill={AMBER}     />
                  <Bar dataKey="p1" name="P1" stackId="a" fill="#dc2626"   />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('MTTR by service (min)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={MTTR} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="svc" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} radius={[0,4,4,0]}>
                    {MTTR.map((m, i) => <Cell key={i} fill={m.mttr > 120 ? RED : m.mttr > 50 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine x={60} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Root-cause categories (30d)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={RCA_CATEGORIES} dataKey="count" nameKey="cat" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {RCA_CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Change-related incidents — 8 weeks')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CHANGE_INCIDENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="change_rel"  name={tt('Change-related')} fill={AMBER} stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="non_change"  name={tt('Non-change')}     fill={BLUE}  stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-rose-50 to-transparent border border-rose-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Quick links')}</div>
            <div className="flex gap-4 flex-wrap text-xs font-semibold text-vfes-dark/70">
              <Link to="/portal/assurance"   className="hover:text-vfes-dark">{tt('Assurance →')}</Link>
              <Link to="/portal/war-room"    className="hover:text-vfes-dark">{tt('War Room →')}</Link>
              <Link to="/portal/operations"  className="hover:text-vfes-dark">{tt('Operations →')}</Link>
              <Link to="/portal/noc-map"     className="hover:text-vfes-dark">{tt('NOC Map →')}</Link>
              <Link to="/portal/contact-center" className="hover:text-vfes-dark">{tt('Contact Centre →')}</Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Panel title={tt('MTTD & MTTR trend — 12 months')}>
            <div className="h-56">
              <ResponsiveContainer>
                <ComposedChart data={MTTD_MTTR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="m" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="m" domain={[0, 20]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="mttr" name={tt('MTTR')} fill={NAVY}  radius={[4,4,0,0]} />
                  <Line yAxisId="r" type="monotone" dataKey="mttd" name={tt('MTTD')} stroke={BLUE} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('SLO error-budget burn by service (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SLO_BURN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="service" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="burned" name={tt('Budget burned %')} radius={[4,4,0,0]}>
                    {SLO_BURN.map((s, i) => <Cell key={i} fill={s.burned > 60 ? RED : s.burned > 35 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed = 50% burn alert threshold. NETWORK_CORE at 84% — immediate action required.')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('On-call performance — MTTD & MTTR by team')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ONCALL_TEAMS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mttd" name={tt('MTTD (min)')} fill={BLUE}  radius={[4,4,0,0]} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} fill={NAVY}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/coo"         className="text-vfes-dark hover:underline">{tt('COO →')}</Link>
              <Link to="/portal/cto"         className="text-vfes-dark hover:underline">{tt('CTO →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ INCIDENT BOARD ════════════════════════════════════ */}
      {tab === 'board' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Open incidents')} value={String(openCount)} trend="down" icon={Siren}         accent />
          <KpiCard label={tt('Investigating')}  value="2"                 trend="down" icon={AlertTriangle}       />
          <KpiCard label={tt('Mitigated')}      value="1"                 trend="up"   icon={CheckCircle2}        />
          <KpiCard label={tt('Resolved (30d)')} value="14"                trend="up"   icon={TrendingUp}          />
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Severity:')}</span>
          {['All','P1','P2','P3'].map(s => (
            <button key={s} onClick={() => setSevFilter(s)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${sevFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>{s}</button>
          ))}
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 ml-2">{tt('State:')}</span>
          {['All','investigating','mitigated','resolved'].map(s => (
            <button key={s} onClick={() => setStateFilter(s)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${stateFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>{tt(s)}</button>
          ))}
        </div>

        <Panel title={tt('Incidents — last 30 days')}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('ID')}</th>
                  <th className="text-left">{tt('Sev')}</th>
                  <th className="text-left">{tt('Title')}</th>
                  <th className="text-left">{tt('Service')}</th>
                  <th className="text-left">{tt('Started')}</th>
                  <th className="text-left">{tt('Duration')}</th>
                  <th className="text-left">{tt('State')}</th>
                  <th className="text-left">{tt('Owner')}</th>
                  <th className="text-left">{tt('Root cause')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((i) => (
                  <tr key={i.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-vfes-dark font-bold">{i.id}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevC(i.sev)}`}>{i.sev}</span></td>
                    <td className="text-[12px] font-semibold max-w-[200px]">{tt(i.title)}</td>
                    <td className="font-mono text-[10px]">{i.service}</td>
                    <td className="font-mono text-[10px]">{i.started}</td>
                    <td className="font-mono text-[10px]">{i.dur}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${stateC(i.state)}`}>{tt(i.state)}</span></td>
                    <td className="text-[11px]">{tt(i.owner)}</td>
                    <td className="text-[11px] text-vfes-dark/70 max-w-[160px]">{tt(i.root)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Incident frequency · 30d')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={TREND}>
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="p3" name="P3" stackId="a" fill={BLUE}    />
                  <Bar dataKey="p2" name="P2" stackId="a" fill={AMBER}   />
                  <Bar dataKey="p1" name="P1" stackId="a" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ MTTD / MTTR ═══════════════════════════════════════ */}
      {tab === 'mttd' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MTTD (30d avg)')}  value="5.8 min"   delta="-2.1 min YoY"   trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('MTTR (30d avg)')}  value="38 min"    delta="-14 min YoY"     trend="up"   icon={Wrench}            />
          <KpiCard label={tt('P1 MTTR')}         value="2h 14m"    delta={tt('latest P1')} trend="flat" icon={Clock}             />
          <KpiCard label={tt('AI triage speedup')}value="7 sec"    delta={tt('vs 22 min manual')} trend="up" icon={Brain}        />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort on-call by:')}</span>
          {(['mttr', 'mttd'] as const).map(k => (
            <button key={k} onClick={() => setMttdSort(k)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${mttdSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MTTD & MTTR trend — 12 months (min)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={MTTD_MTTR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="m" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="m" domain={[0, 20]} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v.toFixed(1)} min`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="mttr"  name={tt('MTTR')}  fill={NAVY}  radius={[4,4,0,0]} />
                  <Line yAxisId="r" type="monotone" dataKey="mttd" name={tt('MTTD')} stroke={BLUE} strokeWidth={2} dot />
                  <ReferenceLine yAxisId="l" y={40} stroke={AMBER} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Jan spike = storm cluster. Dashed = 40 min MTTR target FY2026.')}</div>
          </Panel>
          <Panel title={tt('MTTR by service (min)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={MTTR} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="svc" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} radius={[0,4,4,0]}>
                    {MTTR.map((m, i) => <Cell key={i} fill={m.mttr > 120 ? RED : m.mttr > 50 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('On-call team MTTD & MTTR comparison')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Team')}</th>
                  <th>{tt('On-call')}</th>
                  <th className="text-right">{tt('Incidents (30d)')}</th>
                  <th className="text-right">{tt('MTTD (min)')}</th>
                  <th className="text-right">{tt('MTTR (min)')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedOnCall.map(t => (
                  <tr key={t.team} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(t.team)}</td>
                    <td className="text-xs text-vfes-dark/65">{t.oncall}</td>
                    <td className="text-right font-mono">{t.incidents30d}</td>
                    <td className={`text-right font-bold ${t.mttd > 10 ? 'text-red-600' : t.mttd > 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.mttd}</td>
                    <td className={`text-right font-bold ${t.mttr > 50 ? 'text-red-600' : t.mttr > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.mttr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/assurance"  className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <Link to="/portal/operations" className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/noc-map"    className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('MTTD & MTTR — all services comparison')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={ONCALL_TEAMS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mttd" name={tt('MTTD (min)')} fill={BLUE}  radius={[2,2,0,0]} />
                  <Bar dataKey="mttr" name={tt('MTTR (min)')} fill={NAVY}  radius={[2,2,0,0]} />
                  <ReferenceLine y={40} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <Link to="/portal/cto"         className="text-vfes-dark hover:underline">{tt('CTO →')}</Link>
              <Link to="/portal/coo"         className="text-vfes-dark hover:underline">{tt('COO →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ ROOT CAUSE ════════════════════════════════════════ */}
      {tab === 'rca' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total incidents (30d)')} value="17"   delta={tt('all categories')}            trend="flat" icon={Activity}    accent />
          <KpiCard label={tt('Network / infra')}       value="6"    delta={tt('largest RCA category')}      trend="down" icon={Radio}             />
          <KpiCard label={tt('Data / pipeline')}       value="5"    delta={tt('2nd category')}              trend="flat" icon={Zap}              />
          <KpiCard label={tt('Change-related %')}      value="29%"  delta={tt('-4pp vs M-1')}               trend="up"   icon={TrendingDown}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Root cause categories — incident volume (30d)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={RCA_CATEGORIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cat" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Incidents')} radius={[4,4,0,0]}>
                    {RCA_CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('RCA distribution — pie view')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={RCA_CATEGORIES} dataKey="count" nameKey="cat" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {RCA_CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Change-related incidents — 8 weeks')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={CHANGE_INCIDENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="change_rel"  name={tt('Change-related')} fill={AMBER} stackId="a" />
                <Bar dataKey="non_change"  name={tt('Non-change')}     fill={BLUE}  stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/network"     className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('RCA category breakdown — full detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('RCA Category')}</th>
                    <th className="text-right">{tt('Count (30d)')}</th>
                    <th className="text-right">{tt('% of total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {RCA_CATEGORIES.map(c => (
                    <tr key={c.cat} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                        {tt(c.cat)}
                      </td>
                      <td className="text-right font-mono">{c.count}</td>
                      <td className="text-right font-bold">{((c.count / 21) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
              <Link to="/portal/mobile-ran"  className="text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
              <Link to="/portal/core-5g"     className="text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Change-related vs non-change — area trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={CHANGE_INCIDENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="change_rel" name={tt('Change-related')} stroke={AMBER} fill={AMBER} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="non_change" name={tt('Non-change')}     stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/capacity-capex"  className="text-vfes-dark hover:underline">{tt('Capacity & Capex →')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
              <Link to="/portal/customer-360"    className="text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}
      {tab === 'timeline' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Major incidents (90d)')} value="5"      delta={tt('all closed')}          trend="up"   icon={Siren}       accent />
          <KpiCard label={tt('Change-related MI')}     value="2/5"    delta={tt('Local peering · UPF')}       trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Postmortems done')}      value="3/5"    delta={tt('2 in progress')}       trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Action items open')}     value="4"      delta={tt('6 of 10 closed')}      trend="up"   icon={Wrench}             />
        </div>

        <Panel title={tt('Major incident timeline')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Date')}</th>
                  <th>{tt('Title')}</th>
                  <th className="text-right">{tt('Duration')}</th>
                  <th>{tt('Impact')}</th>
                  <th>{tt('Change?')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {MAJOR_INCIDENTS.map(m => (
                  <tr key={m.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{m.id}</td>
                    <td className="font-mono text-xs">{m.date}</td>
                    <td className="font-semibold text-xs max-w-[240px]">{tt(m.title)}</td>
                    <td className="text-right font-mono text-xs">{m.dur}</td>
                    <td className="text-xs text-vfes-dark/65">{m.impact}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${m.change ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{m.change ? tt('Yes') : tt('No')}</span></td>
                    <td><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt(m.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Postmortems')}>
            <div className="space-y-3">
              {POSTMORTEMS.map((p) => (
                <div key={p.id} className="border border-black/5 rounded-xl p-3 hover:bg-[#fafbfc]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-vfes-dark font-bold">{p.id}</span>
                    <span className="text-[10px] text-vfes-dark/55">{p.d}</span>
                    <span className="font-semibold text-xs">{tt(p.title)}</span>
                  </div>
                  <div className="text-[11px] mt-1"><span className="font-bold uppercase text-[9px] text-vfes-dark/50 tracking-widest">{tt('RCA')}</span> · {p.rca}</div>
                  <div className="text-[11px] mt-0.5"><span className="font-bold uppercase text-[9px] text-vfes-dark/50 tracking-widest">{tt('Actions')}</span> · {p.actions}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
              <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Major incident duration comparison (min)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  { id: 'MI-001', mins: 134 }, { id: 'MI-002', mins: 98  },
                  { id: 'MI-003', mins: 48  }, { id: 'MI-004', mins: 240 },
                  { id: 'MI-005', mins: 22  },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="mins" name={tt('Duration (min)')} fill={NAVY} radius={[4,4,0,0]} />
                  <ReferenceLine y={60} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ PROBLEM MANAGEMENT ══════════════════════════════ */}
      {tab === 'problems' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Known problems')}       value="3"       delta={tt('all with workarounds')}   trend="flat" icon={Brain}       accent />
          <KpiCard label={tt('Carrying CIM (mo)')}    value="3,710"   delta={tt('across 3 problems')}      trend="down" icon={Activity}         />
          <KpiCard label={tt('SLO impact')}           value="2 svc"   delta={tt('NETWORK_CORE · WH_TRF')} trend="down" icon={TrendingDown}     />
          <KpiCard label={tt('Avg days to ETA')}      value="31 d"    delta={tt('Jul–Aug fixes')}          trend="flat" icon={Clock}            />
        </div>

        <Panel title={tt('Known problem register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Problem ID')}</th>
                  <th>{tt('Sev')}</th>
                  <th>{tt('Title')}</th>
                  <th className="text-right">{tt('CIM')}</th>
                  <th>{tt('Fix ETA')}</th>
                </tr>
              </thead>
              <tbody>
                {KNOWN_ISSUES.map(p => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs font-bold text-vfes-dark">{p.id}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${sevC(p.sev)}`}>{p.sev}</span></td>
                    <td className="text-xs font-semibold max-w-[280px]">{tt(p.title)}</td>
                    <td className="text-right font-mono text-xs">{p.cim.toLocaleString('en-BS')}</td>
                    <td className="font-mono text-xs">{p.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
            <Link to="/portal/network"     className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
            <Link to="/portal/core-5g"     className="text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('SLO error budget burn rate by service')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SLO_BURN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="service" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="burned" name={tt('Budget burned %')} radius={[4,4,0,0]}>
                    {SLO_BURN.map((s, i) => <Cell key={i} fill={s.burned > 60 ? RED : s.burned > 35 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
        <div className="mt-6">
          <Panel title={tt('SLO error budget burn by service (%)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={SLO_BURN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="service" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="burned" name={tt('Budget burned %')} radius={[4,4,0,0]}>
                    {SLO_BURN.map((s, i) => <Cell key={i} fill={s.burned > 60 ? RED : s.burned > 35 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/fraud"       className="text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ MOBILE / RAN ══════════════════════════════════════ */}
      {tab === 'mobile' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Mobile incidents (30d)')} value="5"   delta="1 active · 1 mitigated"   trend="down" icon={Smartphone}  accent />
          <KpiCard label={tt('Active mobile incident')} value="1"   delta={tt('V_RAN_TELEMETRY')}    trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Resolved mobile')}        value="3"   delta={tt('all in past week')}   trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Mobile MTTR')}            value="42m" delta="-8m vs M-1"               trend="up"   icon={Clock}             />
        </div>

        <Panel title={tt('Mobile / RAN data-platform incidents')}
          action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5 incidents · 1 active · 1 mitigated')}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Title')}</th><th>{tt('Severity')}</th><th>{tt('Detected')}</th><th>{tt('Workload')}</th><th>{tt('Cause')}</th><th>{tt('Status')}</th></tr>
              </thead>
              <tbody>
                {MOBILE_DATA_INCIDENTS.map((i) => (
                  <tr key={i.id} className="border-t border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono text-xs">{i.id}</td>
                    <td className="font-semibold text-xs">{tt(i.title)}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevC(i.severity)}`}>{i.severity}</span></td>
                    <td className="font-mono text-xs text-vfes-dark/65">{i.detected}</td>
                    <td className="font-mono text-xs text-vfes-dark/65">{i.workload}</td>
                    <td className="text-[11px] text-vfes-dark/65">{tt(i.cause)}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${i.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : i.status === 'Mitigated' ? 'bg-blue-50 text-blue-700' : i.status === 'Investigating' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{tt(i.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('V_RAN_TELEMETRY p95 breach (DATA-INC-2033) is the only Active mobile incident — clustering-key fix queued for next maintenance window.')}</div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Mobile incident MTTR trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={MTTD_MTTR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="mttr" name={tt('MTTR')} stroke={NAVY} fill={NAVY} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="mttd" name={tt('MTTD')} stroke={BLUE} fill={BLUE} fillOpacity={0.1}  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/mobile-ran"  className="text-vfes-dark hover:underline">{tt('Mobile RAN →')}</Link>
              <Link to="/portal/assurance"   className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/noc-map"     className="text-vfes-dark hover:underline">{tt('NOC Map →')}</Link>
            </div>
          </Panel>
          <Panel title={tt('Mobile RCA category breakdown')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={RCA_CATEGORIES.slice(0, 4)} dataKey="count" nameKey="cat" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {RCA_CATEGORIES.slice(0, 4).map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════════════ ON-CALL ═══════════════════════════════════════════ */}
      {tab === 'oncall' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('On-call teams')}        value="5"     delta={tt('active rotations')}     trend="flat" icon={Bell}        accent />
          <KpiCard label={tt('Avg MTTR (on-call)')}   value="43m"   delta="-6m vs Q1"                  trend="up"   icon={Clock}             />
          <KpiCard label={tt('Best MTTR team')}       value="28m"   delta={tt('NOC bridge')}            trend="up"   icon={TrendingUp}        />
          <KpiCard label={tt('Incidents (30d)')}      value="20"    delta={tt('5 teams')}               trend="down" icon={Activity}          />
        </div>

        <Panel title={tt('On-call rotation & metrics')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Team')}</th>
                  <th>{tt('On-call now')}</th>
                  <th>{tt('Escalation')}</th>
                  <th className="text-right">{tt('Incidents (30d)')}</th>
                  <th className="text-right">{tt('MTTD (min)')}</th>
                  <th className="text-right">{tt('MTTR (min)')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedOnCall.map(t => (
                  <tr key={t.team} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{tt(t.team)}</td>
                    <td className="text-xs">{t.oncall}</td>
                    <td className="text-xs text-vfes-dark/55">{t.escalation}</td>
                    <td className="text-right font-mono">{t.incidents30d}</td>
                    <td className={`text-right font-bold ${t.mttd > 10 ? 'text-red-600' : t.mttd > 6 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.mttd}</td>
                    <td className={`text-right font-bold ${t.mttr > 50 ? 'text-red-600' : t.mttr > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.mttr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <Link to="/portal/war-room"    className="text-vfes-dark hover:underline">{tt('War Room →')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            <Link to="/portal/coo"         className="text-vfes-dark hover:underline">{tt('COO →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Incident volume by on-call team')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ONCALL_TEAMS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="incidents30d" name={tt('Incidents (30d)')} fill={NAVY} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"  className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/cto"        className="text-vfes-dark hover:underline">{tt('CTO →')}</Link>
              <Link to="/portal/network"    className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Incident volume by on-call team')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={ONCALL_TEAMS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="incidents30d" name={tt('Incidents (30d)')} fill={NAVY} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-semibold">
              <Link to="/portal/assurance"  className="text-vfes-dark hover:underline">{tt('Assurance →')}</Link>
              <Link to="/portal/cto"        className="text-vfes-dark hover:underline">{tt('CTO →')}</Link>
              <Link to="/portal/network"    className="text-vfes-dark hover:underline">{tt('Network →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ─── source attribution ──────────────────────────────────────────── */}
      <div className="mt-8 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Siren className="w-3 h-3" /> {tt('Source: PagerDuty · on-call rotation · event_table traces · postmortem repo cablebahamas-incidents · Snowflake Cortex AI')}
      </div>

      {/* ─── navigation footer ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-vfes-dark/60 border-t border-black/5 pt-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/40">{tt('See also:')}</span>
        <Link to="/portal/assurance"   className="hover:text-vfes-dark">{tt('Assurance →')}</Link>
        <Link to="/portal/war-room"    className="hover:text-vfes-dark">{tt('War Room →')}</Link>
        <Link to="/portal/operations"  className="hover:text-vfes-dark">{tt('Operations →')}</Link>
        <Link to="/portal/noc-map"     className="hover:text-vfes-dark">{tt('NOC Map →')}</Link>
        <Link to="/portal/network"     className="hover:text-vfes-dark">{tt('Network →')}</Link>
        <Link to="/portal/coo"         className="hover:text-vfes-dark">{tt('COO →')}</Link>
        <Link to="/portal/cto"         className="hover:text-vfes-dark">{tt('CTO →')}</Link>
        <Link to="/portal/contact-center" className="hover:text-vfes-dark">{tt('Contact Centre →')}</Link>
        <Link to="/portal/ai-insights"    className="hover:text-vfes-dark">{tt('AI Insights →')}</Link>
        <Link to="/portal/capacity-capex" className="hover:text-vfes-dark">{tt('Capacity & Capex →')}</Link>
        <Link to="/portal/fraud"          className="hover:text-vfes-dark">{tt('Fraud →')}</Link>
        <Link to="/portal/billing-charging" className="hover:text-vfes-dark">{tt('Billing & Charging →')}</Link>
        <Link to="/portal/customer-360"   className="hover:text-vfes-dark">{tt('Customer 360 →')}</Link>
        <Link to="/portal/mobile-ran"     className="hover:text-vfes-dark">{tt('Mobile RAN →')}</Link>
        <Link to="/portal/core-5g"        className="hover:text-vfes-dark">{tt('5G Core →')}</Link>
        <Link to="/portal/order-provisioning" className="hover:text-vfes-dark">{tt('Order & Provisioning →')}</Link>
        <Link to="/portal/assurance" className="hover:text-vfes-dark">{tt('Assurance Overview →')}</Link>
        <Link to="/portal/coo" className="hover:text-vfes-dark">{tt('COO Summary →')}</Link>
      </div>
    </div>
  )
}
