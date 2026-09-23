import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  PhoneCall, Headphones, Bot, Clock, Smile, ChevronRight, Brain,
  TicketCheck, TrendingUp, Users, Star, AlertTriangle, Activity,
  Award, Zap, MessageSquare, Shield, Gauge,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, Area, AreaChart, PieChart, Pie, LineChart, Line,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE  = '#FF4438'
const NAVY  = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'
const RED   = '#EF4444'

// ─── Channel volumes ──────────────────────────────────────────────────────────
const CHANNELS = [
  { ch: 'Voice (IVR+agent)', contacts: 248_000, deflected: 38, csat: 78, cost: 5.20 },
  { ch: 'App / chat',        contacts: 412_000, deflected: 64, csat: 84, cost: 1.80 },
  { ch: 'WhatsApp',          contacts: 186_000, deflected: 71, csat: 86, cost: 1.40 },
  { ch: 'Web self-service',  contacts: 320_000, deflected: 82, csat: 80, cost: 0.60 },
  { ch: 'Store',             contacts:  94_000, deflected: 12, csat: 88, cost: 8.40 },
]

// ─── Call drivers ─────────────────────────────────────────────────────────────
const DRIVERS = [
  { reason: 'Billing query',           vol: 31, aht: 6.2,  fcr: 74, category: 'Billing',    cortex: 88 },
  { reason: 'Technical / no service',  vol: 24, aht: 9.8,  fcr: 61, category: 'Technical',  cortex: 72 },
  { reason: 'Plan change / upgrade',   vol: 16, aht: 7.1,  fcr: 82, category: 'Commercial', cortex: 91 },
  { reason: 'Activation',             vol: 12, aht: 8.4,  fcr: 68, category: 'Technical',  cortex: 65 },
  { reason: 'Cancellation',           vol:  9, aht: 11.2, fcr: 57, category: 'Retention',  cortex: 78 },
  { reason: 'Roaming',                vol:  8, aht: 5.6,  fcr: 79, category: 'Billing',    cortex: 85 },
]

// ─── Queue intraday data ──────────────────────────────────────────────────────
const QUEUE_BY_DAY: Record<string, { h: string; wait: number; abandon: number; sla: number }[]> = {
  Mon: Array.from({ length: 12 }, (_, i) => ({
    h: `${8 + i}:00`,
    wait:    Number((2.4 + Math.sin(i / 2) * 1.8).toFixed(1)),
    abandon: 3 + Math.round(Math.sin(i / 2) * 2),
    sla:     88 - Math.round(Math.sin(i / 2) * 8),
  })),
  Tue: Array.from({ length: 12 }, (_, i) => ({
    h: `${8 + i}:00`,
    wait:    Number((2.2 + Math.sin(i / 2.2) * 1.6).toFixed(1)),
    abandon: 2 + Math.round(Math.sin(i / 2.2) * 2),
    sla:     90 - Math.round(Math.sin(i / 2.2) * 7),
  })),
  Wed: Array.from({ length: 12 }, (_, i) => ({
    h: `${8 + i}:00`,
    wait:    Number((2.6 + Math.sin(i / 1.9) * 2.0).toFixed(1)),
    abandon: 4 + Math.round(Math.sin(i / 1.9) * 2),
    sla:     85 - Math.round(Math.sin(i / 1.9) * 9),
  })),
}

// ─── AHT trend ───────────────────────────────────────────────────────────────
const AHT_TREND = [
  { m: 'Jan', assisted: 6.1, baseline: 8.4, occupancy: 78 },
  { m: 'Feb', assisted: 5.8, baseline: 8.3, occupancy: 79 },
  { m: 'Mar', assisted: 5.4, baseline: 8.2, occupancy: 80 },
  { m: 'Apr', assisted: 5.0, baseline: 8.1, occupancy: 81 },
  { m: 'May', assisted: 4.6, baseline: 8.0, occupancy: 82 },
  { m: 'Jun', assisted: 4.3, baseline: 8.0, occupancy: 83 },
]

// ─── FCR trend ────────────────────────────────────────────────────────────────
const FCR_TREND = [
  { m: 'Jan', fcr: 68, target: 75 },
  { m: 'Feb', fcr: 70, target: 75 },
  { m: 'Mar', fcr: 71, target: 75 },
  { m: 'Apr', fcr: 73, target: 75 },
  { m: 'May', fcr: 74, target: 75 },
  { m: 'Jun', fcr: 76, target: 75 },
]

// ─── SLA weekly trend ─────────────────────────────────────────────────────────
const SLA_TREND = [
  { w: 'W1', sla: 86, target: 90 },
  { w: 'W2', sla: 87, target: 90 },
  { w: 'W3', sla: 83, target: 90 },
  { w: 'W4', sla: 88, target: 90 },
  { w: 'W5', sla: 89, target: 90 },
  { w: 'W6', sla: 91, target: 90 },
]

// ─── Occupancy trend ─────────────────────────────────────────────────────────
const OCC_TREND = [
  { m: 'Jan', billing: 79, technical: 88, retention: 74 },
  { m: 'Feb', billing: 80, technical: 89, retention: 76 },
  { m: 'Mar', billing: 81, technical: 90, retention: 75 },
  { m: 'Apr', billing: 82, technical: 91, retention: 77 },
  { m: 'May', billing: 83, technical: 92, retention: 78 },
  { m: 'Jun', billing: 83, technical: 91, retention: 79 },
]

// ─── Skill groups ─────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  { group: 'Billing & Payments',  waiting: 12, agents: 24, util: 82, sla: 88, aht: 6.2 },
  { group: 'Technical Support',   waiting: 28, agents: 18, util: 91, sla: 72, aht: 9.8 },
  { group: 'Retention / Saves',   waiting:  4, agents:  8, util: 78, sla: 94, aht: 11.2 },
  { group: 'New Sales',           waiting:  6, agents: 12, util: 70, sla: 96, aht:  7.1 },
  { group: 'Roaming / Intl',      waiting:  2, agents:  6, util: 58, sla: 98, aht:  5.6 },
  { group: 'Activations',         waiting:  8, agents: 10, util: 74, sla: 90, aht:  8.4 },
]

// ─── Agent leaderboard ───────────────────────────────────────────────────────
const AGENTS = [
  { name: 'Emma Rolle',    aht: 4.1, fcr: 84, sat: 4.8, contacts: 142, cortexUse: 94, skill: 'Billing'   },
  { name: 'Lars Knowles',   aht: 4.4, fcr: 82, sat: 4.7, contacts: 138, cortexUse: 91, skill: 'Technical' },
  { name: 'Sofie Bethel',      aht: 4.6, fcr: 81, sat: 4.7, contacts: 135, cortexUse: 88, skill: 'Billing'   },
  { name: 'Daan Ferguson',    aht: 4.8, fcr: 79, sat: 4.6, contacts: 130, cortexUse: 86, skill: 'Retention' },
  { name: 'Lore Adderley',    aht: 5.0, fcr: 78, sat: 4.5, contacts: 128, cortexUse: 82, skill: 'Technical' },
  { name: 'Jonas Willems',   aht: 5.2, fcr: 76, sat: 4.4, contacts: 124, cortexUse: 79, skill: 'Sales'     },
  { name: 'Marie Vermeulen', aht: 5.4, fcr: 75, sat: 4.4, contacts: 120, cortexUse: 76, skill: 'Billing'   },
  { name: 'Thomas Bain',    aht: 5.8, fcr: 72, sat: 4.2, contacts: 115, cortexUse: 68, skill: 'Technical' },
]

// ─── Cortex assist by skill ──────────────────────────────────────────────────
const ASSIST_BY_SKILL = [
  { skill: 'Billing',   ahtBefore: 8.4,  ahtAfter: 4.8, fcrLift: 12, csatLift: 8  },
  { skill: 'Technical', ahtBefore: 10.2, ahtAfter: 7.2, fcrLift: 8,  csatLift: 6  },
  { skill: 'Retention', ahtBefore: 13.4, ahtAfter: 9.8, fcrLift: 14, csatLift: 11 },
  { skill: 'Sales',     ahtBefore: 8.8,  ahtAfter: 6.0, fcrLift: 10, csatLift: 7  },
]

// ─── QA scores ───────────────────────────────────────────────────────────────
const QA_SCORES = [
  { criterion: 'Greeting & ID',      score: 92, benchmark: 90 },
  { criterion: 'Empathy & tone',     score: 84, benchmark: 85 },
  { criterion: 'Technical accuracy', score: 78, benchmark: 80 },
  { criterion: 'FCR behaviour',      score: 74, benchmark: 78 },
  { criterion: 'Wrap-up & notes',    score: 88, benchmark: 85 },
  { criterion: 'Compliance check',   score: 95, benchmark: 92 },
]

const COACHING_PIPELINE = [
  { agent: 'Thomas Bain',    issue: 'AHT above team median',  priority: 'High',   status: 'In coaching' },
  { agent: 'Marie Vermeulen', issue: 'FCR declining 3 weeks',  priority: 'High',   status: 'Scheduled'   },
  { agent: 'Jonas Willems',   issue: 'Low Cortex adoption',    priority: 'Medium', status: 'Scheduled'   },
  { agent: 'Lore Adderley',    issue: 'Empathy score drop',     priority: 'Medium', status: 'Notified'    },
]

// ─── QA trend & automation stats ─────────────────────────────────────────────
const QA_TREND = [
  { m: 'Jan', avgScore: 79, compliance: 88, cortexFlag: 12 },
  { m: 'Feb', avgScore: 80, compliance: 89, cortexFlag: 14 },
  { m: 'Mar', avgScore: 81, compliance: 90, cortexFlag: 18 },
  { m: 'Apr', avgScore: 83, compliance: 92, cortexFlag: 22 },
  { m: 'May', avgScore: 84, compliance: 94, cortexFlag: 24 },
  { m: 'Jun', avgScore: 85, compliance: 95, cortexFlag: 28 },
]

const COACHING_OUTCOMES = [
  { outcome: 'AHT reduced ≥10%',      agents: 8,  pct: 73 },
  { outcome: 'FCR recovered to target',agents: 6,  pct: 60 },
  { outcome: 'CSAT improved ≥0.3',     agents: 9,  pct: 82 },
  { outcome: 'Cortex adoption >80%',   agents: 11, pct: 91 },
]

// ─── Deflection savings tracker ──────────────────────────────────────────────
const DEFLECTION_SAVINGS = [
  { m: 'Jan', savings: 124, contacts: 41200 },
  { m: 'Feb', savings: 136, contacts: 45300 },
  { m: 'Mar', savings: 148, contacts: 49400 },
  { m: 'Apr', savings: 162, contacts: 54000 },
  { m: 'May', savings: 174, contacts: 58000 },
  { m: 'Jun', savings: 188, contacts: 62700 },
]

const SENTIMENT = [
  { name: 'Positive', value: 58, color: GREEN },
  { name: 'Neutral',  value: 30, color: BLUE  },
  { name: 'Negative', value: 12, color: RED   },
]

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'channels' | 'queue' | 'aht' | 'drivers' | 'leaderboard' | 'assist' | 'coaching'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',    label: 'Overview'              },
  { id: 'channels',    label: 'Channels & Deflection' },
  { id: 'queue',       label: 'Queue & SLA'            },
  { id: 'aht',         label: 'AHT & FCR'              },
  { id: 'drivers',     label: 'Call Drivers'           },
  { id: 'leaderboard', label: 'Agent Leaderboard'      },
  { id: 'assist',      label: 'Agent Assist'           },
  { id: 'coaching',    label: 'Coaching & QA'          },
]

export default function ContactCenterPage() {
  const { i18n } = useTranslation()

  // ── hooks ──────────────────────────────────────────────────────────────────
  const [tab,           setTab]           = useState<TabId>('overview')
  const [driverFilter,  setDriverFilter]  = useState<string>('All')
  const [leaderSort,    setLeaderSort]    = useState<'aht' | 'fcr' | 'sat'>('sat')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime,      setLiveTime]      = useState<string>('')
  const [queueDay,      setQueueDay]      = useState<string>('Mon')
  const [showTarget,    setShowTarget]    = useState(true)

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const totalContacts = useMemo(() => CHANNELS.reduce((s, c) => s + c.contacts, 0), [])

  const wAvg = (key: 'deflected' | 'csat') =>
    Math.round(CHANNELS.reduce((s, c) => s + c.contacts * c[key], 0) / totalContacts)

  const filteredDrivers = useMemo(
    () => driverFilter === 'All' ? DRIVERS : DRIVERS.filter(d => d.category === driverFilter),
    [driverFilter],
  )

  const sortedAgents = useMemo(
    () => [...AGENTS].sort((a, b) =>
      leaderSort === 'aht' ? a.aht - b.aht :
      leaderSort === 'fcr' ? b.fcr - a.fcr : b.sat - a.sat),
    [leaderSort],
  )

  const queueData = useMemo(
    () => QUEUE_BY_DAY[queueDay] ?? QUEUE_BY_DAY['Mon'],
    [queueDay],
  )

  const driverCategories = useMemo(
    () => ['All', ...Array.from(new Set(DRIVERS.map(d => d.category)))],
    [],
  )

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Contact Center & Agent Assist')}
        subtitle={tt('Omnichannel volume · deflection · AHT / FCR · Cortex agent-assist copilot')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/ai-insights" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Brain className="w-4 h-4" /> {tt('AI Insights')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Contact centre intelligence"
        models={[
          { name: 'AHT Predictor',      metric: 'MAE 0.4 min', sub: 'per-call handle-time forecast'       },
          { name: 'Deflection Ranker',   metric: 'AUC 0.87',    sub: 'intent → self-serve route score'    },
          { name: 'CSAT Propensity',     metric: 'recall 0.83', sub: 'post-call satisfaction prediction'  },
        ]}
        agentLabel="Run Contact Centre Planner"
        agentRunningLabel="Optimising…"
        agentSteps={[
          'Scored all open contacts by deflection probability (Cortex)',
          'Identified the top 3 call driver categories for self-serve migration',
          'Ranked agents by assist-adoption gap and filed coaching tasks',
          'Drafted the capacity plan for the Q3 peak period',
        ]}
        agentBlurb="A unified contact telemetry lake lets the planner see the full omnichannel journey — from IVR intent to agent wrap-up — and optimise cost-to-serve while protecting CSAT."
        decision={{
          title:    'Extend Cortex agent-assist to voice; migrate billing & roaming to self-serve',
          detail:   'Agent-assist reduces AHT by ~30% on chat but is not yet live on voice — extending it saves ~BSD 1.8M/year in handle cost. Billing and roaming have high FCR and high volume: migrating them to WhatsApp self-serve frees agents for retention calls.',
          impact:   '−30% AHT · +12 pp FCR · agents freed for saves',
          risk:     'Self-serve must not strand vulnerable customers — keep a human escalation path',
          linkTo:   '#/portal/churn-retention',
          linkLabel:'Open Churn & Retention',
        }}
        chart={{
          kind:   'area',
          title:  'AHT trend — Cortex-assisted vs baseline (min)',
          xKey:   'm',
          unit:   ' min',
          data:   AHT_TREND,
          series: [
            { key: 'baseline', name: 'Baseline (no assist)', color: AMBER },
            { key: 'assisted', name: 'Cortex-assisted',       color: GREEN },
          ],
          note: 'Assisted AHT fell from 6.1 to 4.3 min; baseline held flat — clean counterfactual.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Technical support queue SLA at 72% — 28 contacts waiting · Technical skill group at 91% occupancy')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Recommend routing overflow to Tier-2 chat agents. Cortex auto-classification enabled.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/operations" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Operations →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav — 8 pills ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
            }`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <KpiCard label={tt('Contacts / mo')}     value={`${(totalContacts / 1_000).toFixed(0)}K`} delta={tt('5 channels')}        trend="flat" icon={PhoneCall}   accent />
          <KpiCard label={tt('Deflection rate')}    value={`${wAvg('deflected')}%`}                  delta={tt('to digital')}        trend="up"   icon={Bot}         />
          <KpiCard label={tt('Weighted CSAT')}      value={`${wAvg('csat')}`}                        delta={tt('+4 vs last Q')}      trend="up"   icon={Smile}       />
          <KpiCard label={tt('Avg handle time')}    value="4.3 min"                                  delta={tt('−30% with assist')}  trend="up"   icon={Clock}       />
          <KpiCard label={tt('FCR rate')}           value="76%"                                      delta={tt('+8 pp YoY')}         trend="up"   icon={TicketCheck} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Agent occupancy')}   value="83%"  delta={tt('technical grp 91%')} trend="down" icon={Headphones} />
          <KpiCard label={tt('SLA ≤20s answer')}   value="88%"  delta={tt('target 90%')}        trend="up"   icon={Gauge}      />
          <KpiCard label={tt('Abandon rate')}       value="3.2%" delta={tt('−0.4 pp WoW')}      trend="up"   icon={Activity}   />
          <KpiCard label={tt('Cortex assist rate')} value="68%"  delta={tt('voice rollout Q3')} trend="up"   icon={Zap}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Channel mix — contacts & deflection rate (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CHANNELS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="ch" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, _n: any, p: any) =>
                      [`${v}% · ${p.payload.contacts.toLocaleString('en-BS')} contacts · CSAT ${p.payload.csat}`, tt('Deflection')]
                    }
                  />
                  <Bar dataKey="deflected" radius={[6, 6, 0, 0]}>
                    {CHANNELS.map((c, i) => (
                      <Cell key={i} fill={c.deflected >= 70 ? GREEN : c.deflected >= 40 ? BLUE : AMBER} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Voice & store have the lowest deflection — priority targets for self-serve migration.')}
            </div>
          </Panel>

          <Panel title={tt('Interaction sentiment — Cortex AI_SENTIMENT')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SENTIMENT} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {SENTIMENT.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {tt('12% negative — auto-routed to senior agents with retention offer pre-loaded.')}
              <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>
        </div>

        {/* Quick-nav links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Link to="/portal/customer-360" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <Users className="w-5 h-5 text-[#222128] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Customer 360')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Full customer view')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-vfes-dark/30 ml-auto" />
          </Link>
          <Link to="/portal/voc" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <MessageSquare className="w-5 h-5 text-[#10B981] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Voice of Customer')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Sentiment & topics')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-vfes-dark/30 ml-auto" />
          </Link>
          <Link to="/portal/churn-retention" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <TrendingUp className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Churn & Retention')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Save desk · risk')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-vfes-dark/30 ml-auto" />
          </Link>
          <Link to="/portal/experience" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <Star className="w-5 h-5 text-[#7C3AED] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Experience')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('NPS · CSAT · CES')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-vfes-dark/30 ml-auto" />
          </Link>
        </div>
        {/* Navigation links to related domains */}
        <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/45 mb-3">{tt('Related domains')}</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/portal/customer-360"  className="font-semibold text-[#222128] hover:underline">{tt('Customer 360 →')}</Link>
            <Link to="/portal/voc"           className="font-semibold text-[#10B981] hover:underline">{tt('Voice of Customer →')}</Link>
            <Link to="/portal/churn-retention" className="font-semibold text-[#F59E0B] hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/experience"    className="font-semibold text-[#7C3AED] hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/ai-insights"   className="font-semibold text-[#11567F] hover:underline">{tt('AI Insights →')}</Link>
            <Link to="/portal/agents"        className="font-semibold text-[#94a3b8] hover:underline">{tt('Cortex Agents →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ CHANNELS & DEFLECTION ══════════════════════════════════ */}
      {tab === 'channels' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total contacts / mo')}  value={`${(totalContacts / 1_000).toFixed(0)}K`} delta={tt('all channels')}    trend="flat" icon={PhoneCall} accent />
          <KpiCard label={tt('Digital deflection')}    value={`${wAvg('deflected')}%`}                  delta={tt('WA+app+web')}      trend="up"   icon={Bot}      />
          <KpiCard label={tt('Weighted CSAT')}         value={`${wAvg('csat')}`}                        delta={tt('+4 vs last Q')}   trend="up"   icon={Smile}    />
          <KpiCard label={tt('Cost per contact (avg)')} value="BSD 2.90"                                   delta={tt('−BSD 0.40 QoQ')}     trend="up"   icon={Activity} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Deflection rate by channel (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CHANNELS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="ch" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="deflected" name={tt('Deflection %')} radius={[6, 6, 0, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.deflected >= 70 ? GREEN : c.deflected >= 40 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cost per contact by channel (BSD )')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CHANNELS} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="BSD " />
                  <YAxis type="category" dataKey="ch" stroke="#999" fontSize={9} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}`, tt('Cost')]} />
                  <Bar dataKey="cost" name={tt('Cost/contact')} radius={[0, 4, 4, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.cost > 5 ? RED : c.cost > 2 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Store at BSD 8.40/contact — high-value appointments only. Web self-serve at BSD 0.60 is the migration target.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('CSAT by channel — satisfaction score comparison')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={CHANNELS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="ch" stroke="#999" fontSize={9} />
                <YAxis stroke="#999" fontSize={11} unit="" domain={[70, 95]} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [v, tt('CSAT score')]} />
                <Bar dataKey="csat" name={tt('CSAT')} radius={[4, 4, 0, 0]}>
                  {CHANNELS.map((c, i) => <Cell key={i} fill={c.csat >= 85 ? GREEN : c.csat >= 80 ? BLUE : AMBER} />)}
                </Bar>
                <ReferenceLine y={82} stroke={GREEN} strokeDasharray="3 3"
                  label={{ value: tt('Target 82'), position: 'right', fontSize: 10, fill: GREEN }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">
            {tt('Store highest CSAT (88) but lowest volume — digital channels closing the gap as Cortex improves.')}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link to="/portal/experience"  className="font-semibold text-vfes-dark hover:underline">{tt('Experience dashboard →')}</Link>
            <Link to="/portal/sales"       className="font-semibold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
          </div>
        </Panel>

        <Panel title={tt('Channel scorecard — contacts, deflection, CSAT, cost')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Channel')}</th>
                  <th className="px-3 py-2 text-right">{tt('Contacts/mo')}</th>
                  <th className="px-3 py-2 text-right">{tt('Deflection %')}</th>
                  <th className="px-3 py-2 text-right">{tt('CSAT')}</th>
                  <th className="px-3 py-2 text-right">{tt('Cost/contact')}</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map(c => (
                  <tr key={c.ch} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(c.ch)}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.contacts.toLocaleString('en-BS')}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.deflected >= 70 ? 'text-emerald-600' : c.deflected >= 40 ? 'text-blue-600' : 'text-amber-600'}`}>{c.deflected}%</td>
                    <td className="px-3 py-2 text-right font-mono">{c.csat}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.cost > 5 ? 'text-red-600' : c.cost > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>BSD {c.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]">
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            <Link to="/portal/cortex-search"    className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ QUEUE & SLA ════════════════════════════════════════════ */}
      {tab === 'queue' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SLA ≤20s answer')} value="88%"  delta={tt('target 90%')}      trend="up"   icon={Gauge}     accent />
          <KpiCard label={tt('Avg wait time')}    value="2.8m" delta={tt('−0.4 min WoW')}   trend="up"   icon={Clock}      />
          <KpiCard label={tt('Abandon rate')}     value="3.2%" delta={tt('target ≤3%')}     trend="down" icon={Activity}  />
          <KpiCard label={tt('Contacts waiting')} value="60"   delta={tt('live right now')}  trend="flat" icon={PhoneCall} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Day:')}</span>
          {(['Mon', 'Tue', 'Wed'] as const).map(d => (
            <button key={d} onClick={() => setQueueDay(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${queueDay === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(d)}
            </button>
          ))}
          <label className="flex items-center gap-1.5 ml-4 text-xs font-semibold text-vfes-dark/65 cursor-pointer">
            <input type="checkbox" checked={showTarget} onChange={e => setShowTarget(e.target.checked)} className="rounded" />
            {tt('Show target line')}
          </label>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Average wait time — intraday (min)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={queueData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="h" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit=" m" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(1)} min`, tt('Wait')]} />
                  {showTarget && (
                    <ReferenceLine y={3} stroke={RED} strokeDasharray="3 3"
                      label={{ value: tt('3m target'), position: 'right', fontSize: 10, fill: RED }} />
                  )}
                  <Line type="monotone" dataKey="wait" stroke={BLUE} strokeWidth={2.4} dot={false} name={tt('Wait time')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('SLA % — answered within 20 seconds')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={SLA_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="w" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[75, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sla" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name={tt('SLA %')} />
                  {showTarget && <ReferenceLine y={90} stroke={GREEN} strokeDasharray="3 3" />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('W3 dip correlates with technical outage — overflow routing activated.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Skill group queue status — live')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Skill group')}</th>
                  <th className="px-3 py-2 text-right">{tt('Waiting')}</th>
                  <th className="px-3 py-2 text-right">{tt('Agents')}</th>
                  <th className="px-3 py-2 text-right">{tt('Occupancy')}</th>
                  <th className="px-3 py-2 text-right">{tt('SLA %')}</th>
                  <th className="px-3 py-2 text-right">{tt('AHT (min)')}</th>
                </tr>
              </thead>
              <tbody>
                {SKILL_GROUPS.map(g => (
                  <tr key={g.group} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(g.group)}</td>
                    <td className={`px-3 py-2 text-right font-bold font-mono ${g.waiting > 20 ? 'text-red-600' : g.waiting > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{g.waiting}</td>
                    <td className="px-3 py-2 text-right font-mono">{g.agents}</td>
                    <td className={`px-3 py-2 text-right font-bold ${g.util >= 90 ? 'text-red-600' : g.util >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{g.util}%</td>
                    <td className={`px-3 py-2 text-right font-bold ${g.sla < 80 ? 'text-red-600' : g.sla < 90 ? 'text-amber-600' : 'text-emerald-600'}`}>{g.sla}%</td>
                    <td className="px-3 py-2 text-right font-mono">{g.aht}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]">
            <Link to="/portal/operations" className="font-semibold text-vfes-dark hover:underline">{tt('Operations dashboard →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ AHT & FCR ══════════════════════════════════════════════ */}
      {tab === 'aht' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg handle time')} value="4.3 min" delta={tt('−30% with assist')}  trend="up"   icon={Clock}       accent />
          <KpiCard label={tt('FCR rate')}         value="76%"     delta={tt('+8 pp YoY')}         trend="up"   icon={TicketCheck}  />
          <KpiCard label={tt('Agent occupancy')} value="83%"     delta={tt('Technical grp 91%')} trend="down" icon={Headphones}  />
          <KpiCard label={tt('After-call work')} value="1.8 min" delta={tt('Cortex auto-notes')} trend="up"   icon={Award}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AHT trend — assisted vs baseline (min)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={AHT_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" m" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} min`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="baseline" stroke={AMBER} fill={AMBER} fillOpacity={0.15} name={tt('Without assist')} />
                  <Area type="monotone" dataKey="assisted"  stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('With assist')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('First-contact resolution — 6-month trend (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={FCR_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[60, 85]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fcr" name={tt('FCR %')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Target 75%')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Occupancy trend by skill group (%)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={OCC_TREND}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="%" domain={[65, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={90} stroke={RED} strokeDasharray="3 3"
                  label={{ value: tt('90% SLA risk'), position: 'right', fontSize: 10, fill: RED }} />
                <Line type="monotone" dataKey="billing"   stroke={BLUE}   strokeWidth={2} dot={false} name={tt('Billing')} />
                <Line type="monotone" dataKey="technical" stroke={AMBER}  strokeWidth={2} dot={false} name={tt('Technical')} />
                <Line type="monotone" dataKey="retention" stroke={PURPLE} strokeWidth={2} dot={false} name={tt('Retention')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {tt('Technical consistently >90% — cancellation/retention has highest AHT: priority for extend assist.')}
          </div>
        </Panel>

        <Panel title={tt('Top contact reasons — AHT, FCR & Cortex assist score')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Reason')}</th>
                  <th className="px-3 py-2 text-right">{tt('Vol %')}</th>
                  <th className="px-3 py-2 text-right">{tt('AHT (min)')}</th>
                  <th className="px-3 py-2 text-right">{tt('FCR %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Cortex %')}</th>
                </tr>
              </thead>
              <tbody>
                {DRIVERS.map(d => (
                  <tr key={d.reason} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(d.reason)}</td>
                    <td className="px-3 py-2 text-right font-mono">{d.vol}%</td>
                    <td className={`px-3 py-2 text-right font-mono ${d.aht > 9 ? 'text-red-600 font-bold' : d.aht > 7 ? 'text-amber-600' : ''}`}>{d.aht}</td>
                    <td className={`px-3 py-2 text-right font-mono ${d.fcr < 65 ? 'text-amber-600 font-bold' : d.fcr >= 80 ? 'text-emerald-600 font-bold' : ''}`}>{d.fcr}%</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">{d.cortex}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-vfes-dark/55">
            <TicketCheck className="w-3 h-3" />
            {tt('Cancellation/retention: lowest FCR (57%), highest AHT — immediate priority for assist extension.')}
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CALL DRIVERS ═══════════════════════════════════════════ */}
      {tab === 'drivers' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {driverCategories.map(cat => (
            <button key={cat} onClick={() => setDriverFilter(cat)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${driverFilter === cat ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(cat)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Billing drivers')}    value="39%"  delta={tt('of total volume')}   trend="flat" icon={Activity}      accent />
          <KpiCard label={tt('Technical drivers')}  value="36%"  delta={tt('FCR opportunity')}   trend="down" icon={AlertTriangle}  />
          <KpiCard label={tt('Retention contacts')} value="9%"   delta={tt('highest AHT')}       trend="flat" icon={TrendingUp}    />
          <KpiCard label={tt('Avg Cortex assist')}  value="80%"  delta={tt('answer confidence')} trend="up"   icon={Brain}         />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Call driver volume % — filtered by category')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredDrivers} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="reason" stroke="#999" fontSize={9} width={145} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="vol" name={tt('Volume %')} fill={NAVY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cortex assist confidence by driver (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredDrivers} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="reason" stroke="#999" fontSize={9} width={145} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cortex" name={tt('Assist confidence %')} radius={[0, 4, 4, 0]}>
                    {filteredDrivers.map((d, i) => <Cell key={i} fill={d.cortex >= 85 ? GREEN : d.cortex >= 70 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {tt('Activation at 65% — upload additional knowledge articles to Cortex Search.')}
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4 text-xs mt-2">
          <Link to="/portal/ai-insights"  className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <Link to="/portal/agents"       className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Agents →')}</Link>
          <Link to="/portal/cortex-search" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
        </div>
      </>)}

      {/* ══════════════ AGENT LEADERBOARD ══════════════════════════════════════ */}
      {tab === 'leaderboard' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Team CSAT avg')}    value="4.5 / 5" delta={tt('+0.3 vs last mo')} trend="up"   icon={Star}        accent />
          <KpiCard label={tt('Team FCR avg')}      value="78%"     delta={tt('+5 pp YoY')}       trend="up"   icon={TicketCheck}  />
          <KpiCard label={tt('Team AHT avg')}      value="5.0 min" delta={tt('target 5.5')}      trend="up"   icon={Clock}        />
          <KpiCard label={tt('Cortex adoption')}  value="83%"     delta={tt('all agents')}       trend="up"   icon={Zap}          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['sat', 'fcr', 'aht'] as const).map(k => (
            <button key={k} onClick={() => setLeaderSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${leaderSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'sat' ? tt('CSAT') : k === 'fcr' ? tt('FCR') : tt('AHT')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Agent leaderboard — CSAT score (sorted)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sortedAgents} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[3.5, 5]} />
                  <YAxis type="category" dataKey="name" stroke="#999" fontSize={9} width={110} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sat" name={tt('CSAT / 5')} radius={[0, 4, 4, 0]}>
                    {sortedAgents.map((a, i) => <Cell key={i} fill={a.sat >= 4.6 ? GREEN : a.sat >= 4.3 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Agent performance table')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-2 py-2">{tt('Agent')}</th>
                    <th className="px-2 py-2 text-right">{tt('AHT')}</th>
                    <th className="px-2 py-2 text-right">{tt('FCR')}</th>
                    <th className="px-2 py-2 text-right">{tt('CSAT')}</th>
                    <th className="px-2 py-2 text-right">{tt('Cortex %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map((a, idx) => (
                    <tr key={a.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-2 py-1.5 font-semibold text-xs">{idx + 1}. {a.name}</td>
                      <td className={`px-2 py-1.5 text-right font-mono text-xs ${a.aht > 5.5 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>{a.aht}</td>
                      <td className={`px-2 py-1.5 text-right font-mono text-xs ${a.fcr < 76 ? 'text-amber-600' : 'text-emerald-600 font-bold'}`}>{a.fcr}%</td>
                      <td className="px-2 py-1.5 text-right font-bold text-xs">{a.sat}</td>
                      <td className={`px-2 py-1.5 text-right font-mono text-xs ${a.cortexUse < 75 ? 'text-amber-600' : 'text-emerald-700'}`}>{a.cortexUse}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/agents"    className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Agents →')}</Link>
              <Link to="/portal/marketing" className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ AGENT ASSIST ═══════════════════════════════════════════ */}
      {tab === 'assist' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Assist adoption')}  value="68%"     delta={tt('voice rollout Q3')}  trend="up"   icon={Zap}        accent />
          <KpiCard label={tt('AHT reduction')}    value="−30%"    delta={tt('4.3 vs 8.0 min')}   trend="up"   icon={Clock}       />
          <KpiCard label={tt('FCR lift')}         value="+12 pp"  delta={tt('vs no-assist')}      trend="up"   icon={TicketCheck} />
          <KpiCard label={tt('Wrap-up time')}     value="1.8 min" delta={tt('Cortex auto-note')}  trend="up"   icon={Award}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AHT — before vs after Cortex assist, by skill group (min)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ASSIST_BY_SKILL}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="skill" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" m" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} min`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ahtBefore" name={tt('Before assist')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ahtAfter"  name={tt('After assist')}  fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('FCR & CSAT lift from Cortex assist (pp improvement)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ASSIST_BY_SKILL}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="skill" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" pp" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fcrLift"  name={tt('FCR lift (pp)')}  fill={BLUE}   radius={[4, 4, 0, 0]} />
                  <Bar dataKey="csatLift" name={tt('CSAT lift (pp)')} fill={PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/network"   className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
              <Link to="/portal/field-ops" className="font-semibold text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('How Cortex agent-assist works — step by step')}>
          <div className="grid md:grid-cols-4 gap-4 mt-2">
            {([
              { step: '1', title: tt('Pull 360° context'),  detail: tt('Cortex Search retrieves customer history, last 3 contacts, open tickets, contract') },
              { step: '2', title: tt('Summarise & intent'), detail: tt('LLM summarises the call intent and flags any churn or retention signals') },
              { step: '3', title: tt('Suggest next action'),detail: tt('NBA engine proposes the best resolution or retention offer for the agent') },
              { step: '4', title: tt('Auto wrap-up'),       detail: tt('Cortex writes the disposition code, CRM note and follow-up task automatically') },
            ] as const).map(s => (
              <div key={s.step} className="rounded-xl bg-[#fafbfc] border border-black/5 p-4 border-t-4" style={{ borderTopColor: BLUE }}>
                <div className="text-xs font-bold text-[#222128] uppercase tracking-widest mb-1">{tt('Step')} {s.step}</div>
                <div className="text-sm font-bold text-vfes-dark mb-1">{s.title}</div>
                <div className="text-xs text-vfes-dark/60">{s.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <Link to="/portal/sales"        className="font-semibold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
            <Link to="/portal/cortex-search" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ COACHING & QA ══════════════════════════════════════════ */}
      {tab === 'coaching' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg QA score')}         value="85 / 100" delta={tt('+3 vs last mo')}  trend="up"   icon={Award}    accent />
          <KpiCard label={tt('Calls evaluated/mo')}   value="1,240"    delta={tt('5% sample')}       trend="flat" icon={Activity}  />
          <KpiCard label={tt('In coaching now')}      value="4 agents" delta={tt('AI-triggered')}    trend="flat" icon={Users}     />
          <KpiCard label={tt('Compliance pass rate')} value="95%"      delta={tt('target 92%')}      trend="up"   icon={Shield}   />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('QA scores by criterion — actual vs benchmark')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={QA_SCORES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="criterion" stroke="#999" fontSize={8} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[60, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="score"     name={tt('Actual')}    fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name={tt('Benchmark')} fill={SLATE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Empathy & tone and FCR behaviour below benchmark — coaching plans filed for the 4 at-risk agents.')}
            </div>
          </Panel>

          <Panel title={tt('Coaching pipeline — AI-triggered actions')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Agent')}</th>
                    <th className="px-3 py-2">{tt('Issue identified')}</th>
                    <th className="px-3 py-2">{tt('Priority')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COACHING_PIPELINE.map(c => (
                    <tr key={c.agent} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{c.agent}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(c.issue)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tt(c.priority)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-vfes-dark font-bold">
              <Brain className="w-3 h-3" />
              {tt('Cortex analyses every call transcript and auto-files coaching tasks for agents below threshold.')}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('QA score trend — avg score & compliance rate (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={QA_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[70, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avgScore"   stroke={BLUE}   strokeWidth={2.4} dot name={tt('QA avg score')}      />
                  <Line type="monotone" dataKey="compliance" stroke={GREEN}  strokeWidth={2}   dot={false} name={tt('Compliance %')} />
                  <Line type="monotone" dataKey="cortexFlag" stroke={AMBER}  strokeWidth={1.8} dot={false} strokeDasharray="4 4" name={tt('Cortex flags/day')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Cortex flagging rate rising as model improves — every flag auto-triggers a coaching review.')}
            </div>
          </Panel>

          <Panel title={tt('Coaching outcomes — % of agents who improved after coaching')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={COACHING_OUTCOMES} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="outcome" stroke="#999" fontSize={8} width={170} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Success rate')]} />
                  <Bar dataKey="pct" name={tt('Success rate')} radius={[0, 4, 4, 0]}>
                    {COACHING_OUTCOMES.map((c, i) => <Cell key={i} fill={c.pct >= 80 ? GREEN : c.pct >= 65 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Deflection cost savings — monthly (BSD K avoided)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={DEFLECTION_SAVINGS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} unit="KBSD " />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}K`, tt('Savings')]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="savings" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Deflection savings (BSD K)')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
            <Link to="/portal/ai-insights"      className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>

        <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4 flex items-center justify-between mt-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-[#222128] mb-1">{tt('AI-powered quality & coaching')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Every call transcript scored by Cortex AI · coaching tasks auto-filed · compliance checks automated.')}
            </div>
          </div>
          <Link to="/portal/experience"
            className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <Star className="w-4 h-4" /> {tt('Open Experience →')}
          </Link>
        </div>
      </>)}

      <AskTheData />
    </div>
  )
}
