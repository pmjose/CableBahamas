import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList } from '../../components/ExecCockpit'
import CUST from './_customer_facts'
import {
  Smartphone, Star, Activity, Users, TrendingUp, Bell,
  ShieldCheck, BarChart2, Zap, AlertTriangle, RefreshCw, MessageSquare, Wifi,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8', RED = '#EF4444'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const ragC = (r: string) =>
  r === 'Low' || r === 'Good' ? 'bg-emerald-100 text-emerald-700' :
  r === 'Med' || r === 'Average' ? 'bg-amber-100 text-amber-700' :
  'bg-red-100 text-red-700'
const stP = (s: string) =>
  s === 'Launched' || s === 'Live' || s === 'Resolved' || s === 'Stable'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Beta' || s === 'In progress' || s === 'Monitoring'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

// ─── MAU / DAU trend ─────────────────────────────────────────────────────────
const ENGAGE = [
  { m: 'Jan', mau: 6.2, dau: 2.1, wau: 3.8 },
  { m: 'Feb', mau: 6.5, dau: 2.2, wau: 4.0 },
  { m: 'Mar', mau: 6.9, dau: 2.4, wau: 4.3 },
  { m: 'Apr', mau: 7.3, dau: 2.7, wau: 4.6 },
  { m: 'May', mau: 7.8, dau: 3.0, wau: 5.0 },
  { m: 'Jun', mau: 8.2, dau: 3.3, wau: 5.3 },
]

const SESSION_TREND = [
  { m: 'Jan', avgSessions: 4.2, avgDurMin: 3.1 },
  { m: 'Feb', avgSessions: 4.4, avgDurMin: 3.2 },
  { m: 'Mar', avgSessions: 4.6, avgDurMin: 3.3 },
  { m: 'Apr', avgSessions: 4.8, avgDurMin: 3.5 },
  { m: 'May', avgSessions: 5.1, avgDurMin: 3.7 },
  { m: 'Jun', avgSessions: 5.3, avgDurMin: 3.9 },
]

// ─── In-app journeys ─────────────────────────────────────────────────────────
const JOURNEYS = [
  { journey: 'View / pay bill',        sessions: 4_120_000, containment: 92, dropOff: 8  },
  { journey: 'Data usage check',       sessions: 3_680_000, containment: 96, dropOff: 4  },
  { journey: 'Plan change / upgrade',  sessions: 1_240_000, containment: 71, dropOff: 29 },
  { journey: 'Add-on / roaming pass',  sessions:   980_000, containment: 84, dropOff: 16 },
  { journey: 'Support / chat',         sessions:   760_000, containment: 63, dropOff: 37 },
  { journey: 'Troubleshoot service',   sessions:   540_000, containment: 58, dropOff: 42 },
  { journey: 'Loyalty points check',   sessions:   320_000, containment: 88, dropOff: 12 },
  { journey: 'Device insurance claim', sessions:   180_000, containment: 48, dropOff: 52 },
]

const JOURNEY_TREND = [
  { m: 'Jan', bill: 88, plan: 65, support: 56 },
  { m: 'Feb', bill: 89, plan: 67, support: 58 },
  { m: 'Mar', bill: 90, plan: 68, support: 59 },
  { m: 'Apr', bill: 91, plan: 70, support: 61 },
  { m: 'May', bill: 91, plan: 71, support: 62 },
  { m: 'Jun', bill: 92, plan: 71, support: 63 },
]

// ─── Feature adoption ─────────────────────────────────────────────────────────
const FEATURES = [
  { feature: 'Biometric login',      adoptionPct: 82, nps: 68, status: 'Launched' },
  { feature: 'E-bill (paperless)',   adoptionPct: 74, nps: 62, status: 'Launched' },
  { feature: 'Live chat widget',     adoptionPct: 58, nps: 54, status: 'Launched' },
  { feature: 'Data gifting',         adoptionPct: 42, nps: 71, status: 'Launched' },
  { feature: 'AI assistant (beta)',  adoptionPct: 28, nps: 58, status: 'Beta'     },
  { feature: 'Smart Roaming toggle', adoptionPct: 24, nps: 66, status: 'Launched' },
  { feature: 'Loyalty wallet',       adoptionPct: 38, nps: 60, status: 'Launched' },
  { feature: 'Network health map',   adoptionPct: 18, nps: 72, status: 'Beta'     },
]

const FEATURE_LAUNCH = [
  { m: 'Jan', biometric: 72, ebill: 68, chat: 48, gifting: 22 },
  { m: 'Feb', biometric: 74, ebill: 69, chat: 50, gifting: 28 },
  { m: 'Mar', biometric: 77, ebill: 71, chat: 52, gifting: 34 },
  { m: 'Apr', biometric: 79, ebill: 72, chat: 54, gifting: 38 },
  { m: 'May', biometric: 81, ebill: 73, chat: 56, gifting: 40 },
  { m: 'Jun', biometric: 82, ebill: 74, chat: 58, gifting: 42 },
]

// ─── Digital adoption funnel ──────────────────────────────────────────────────
const ADOPTION = [
  { seg: 'Registered',       value: 84, fill: NAVY  },
  { seg: 'Active (30d)',     value: 60, fill: BLUE  },
  { seg: 'Self-serve (bill)',value: 47, fill: GREEN },
  { seg: 'Digital-only',     value: 34, fill: AMBER },
]

// ─── App store ratings ────────────────────────────────────────────────────────
const RATINGS = [
  { name: '5★', value: 58, color: GREEN  },
  { name: '4★', value: 22, color: BLUE   },
  { name: '3★', value: 9,  color: SLATE  },
  { name: '2★', value: 5,  color: AMBER  },
  { name: '1★', value: 6,  color: RED    },
]

const RATING_TREND = [
  { m: 'Jan', ios: 4.0, android: 3.8 },
  { m: 'Feb', ios: 4.1, android: 3.9 },
  { m: 'Mar', ios: 4.1, android: 4.0 },
  { m: 'Apr', ios: 4.2, android: 4.0 },
  { m: 'May', ios: 4.2, android: 4.1 },
  { m: 'Jun', ios: 4.3, android: 4.2 },
]

const REVIEW_TOPICS = [
  { topic: 'Login & authentication', negative: 38, positive: 12 },
  { topic: 'Payment & billing',      negative: 28, positive: 24 },
  { topic: 'Data usage info',        negative: 8,  positive: 62 },
  { topic: 'Chat & support',         negative: 22, positive: 18 },
  { topic: 'App speed',              negative: 18, positive: 42 },
  { topic: 'Loyalty rewards',        negative: 6,  positive: 58 },
]

// ─── Push & in-app campaigns ──────────────────────────────────────────────────
const CAMPAIGNS = [
  { name: 'Loyalty points reminder',  channel: 'Push',   sent: 1_240_000, opens: 34.2, ctr: 8.4,  conv: 2.8  },
  { name: 'Plan upgrade Q2',          channel: 'In-app', sent:   580_000, opens: 62.1, ctr: 14.2, conv: 5.1  },
  { name: '5G area notification',     channel: 'Push',   sent: 2_100_000, opens: 28.4, ctr: 6.2,  conv: 1.4  },
  { name: 'Bill due reminder',        channel: 'Push',   sent:   940_000, opens: 58.8, ctr: 18.4, conv: 12.1 },
  { name: 'Roaming pack offer',       channel: 'In-app', sent:   240_000, opens: 74.2, ctr: 22.1, conv: 8.4  },
  { name: 'Churn-risk save offer',    channel: 'In-app', sent:    48_000, opens: 68.4, ctr: 28.2, conv: 14.8 },
]

const PUSH_TREND = [
  { m: 'Jan', openRate: 30.2, ctr: 7.4 },
  { m: 'Feb', openRate: 31.4, ctr: 7.8 },
  { m: 'Mar', openRate: 32.1, ctr: 8.0 },
  { m: 'Apr', openRate: 33.2, ctr: 8.4 },
  { m: 'May', openRate: 34.0, ctr: 8.8 },
  { m: 'Jun', openRate: 34.8, ctr: 9.1 },
]

// ─── Performance & crash data ─────────────────────────────────────────────────
const PERF_TREND = [
  { m: 'Jan', crashRate: 0.82, startupMs: 2400, apiP95: 380 },
  { m: 'Feb', crashRate: 0.78, startupMs: 2280, apiP95: 360 },
  { m: 'Mar', crashRate: 0.74, startupMs: 2180, apiP95: 340 },
  { m: 'Apr', crashRate: 0.70, startupMs: 2080, apiP95: 320 },
  { m: 'May', crashRate: 0.66, startupMs: 1980, apiP95: 300 },
  { m: 'Jun', crashRate: 0.62, startupMs: 1860, apiP95: 284 },
]

const CRASH_BY_OS = [
  { os: 'iOS 17',     crashRate: 0.42, sessions: 4_200_000 },
  { os: 'iOS 16',     crashRate: 0.68, sessions: 1_800_000 },
  { os: 'Android 14', crashRate: 0.58, sessions: 140_000 },
  { os: 'Android 13', crashRate: 0.82, sessions: 2_100_000 },
  { os: 'Android 12', crashRate: 1.24, sessions:   980_000 },
]

const INCIDENTS = [
  { id: 'INC-884', title: 'Login timeout on Android 12',     severity: 'High',   status: 'Resolved',   affected: '24K users',  duration: '48 min'  },
  { id: 'INC-881', title: 'Payment flow crash (iOS 17.4)',    severity: 'High',   status: 'Resolved',   affected: '8.2K users', duration: '22 min'  },
  { id: 'INC-878', title: 'Push notification delivery lag',  severity: 'Medium', status: 'Monitoring', affected: '140K users', duration: 'Ongoing' },
  { id: 'INC-874', title: 'Data usage chart not loading',    severity: 'Low',    status: 'Resolved',   affected: '2.1K users', duration: '14 min'  },
  { id: 'INC-868', title: 'Roaming pass add-on 500 error',   severity: 'High',   status: 'Resolved',   affected: '3.8K users', duration: '31 min'  },
]

const SESSION_FUNNEL = [
  { step: 'App open',        value: 100 },
  { step: 'Authenticated',   value: 88  },
  { step: 'Home screen',     value: 82  },
  { step: 'Navigated (any)', value: 72  },
  { step: 'Action done',     value: 58  },
  { step: 'Returned 7d',     value: 44  },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'engagement' | 'journeys' | 'features' | 'campaigns' | 'sentiment' | 'performance' | 'adoption'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',    label: 'Overview',         icon: Activity      },
  { id: 'engagement',  label: 'MAU / DAU',         icon: Smartphone    },
  { id: 'journeys',    label: 'In-app Journeys',   icon: RefreshCw     },
  { id: 'features',    label: 'Feature Adoption',  icon: Zap           },
  { id: 'campaigns',   label: 'Push & In-app',      icon: Bell          },
  { id: 'sentiment',   label: 'App Store',          icon: Star          },
  { id: 'performance', label: 'Crash & Perf',       icon: AlertTriangle },
  { id: 'adoption',    label: 'Digital Adoption',   icon: Users         },
]

export default function DigitalAppEngagementPage() {
  const [tab, setTab]                 = useState<TabId>('overview')
  const [journeySort, setJourneySort] = useState<'sessions' | 'containment'>('sessions')
  const [osFilter, setOsFilter]       = useState<'All' | 'iOS' | 'Android'>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]       = useState<string>('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedJourneys = useMemo(
    () => [...JOURNEYS].sort((a, b) => journeySort === 'sessions' ? b.sessions - a.sessions : a.containment - b.containment),
    [journeySort],
  )

  const filteredCrash = useMemo(
    () => osFilter === 'All' ? CRASH_BY_OS : CRASH_BY_OS.filter(c => c.os.toLowerCase().startsWith(osFilter.toLowerCase())),
    [osFilter],
  )

  const latestMAU = ENGAGE[ENGAGE.length - 1].mau
  const latestDAU = ENGAGE[ENGAGE.length - 1].dau
  const stickiness = ((latestDAU / latestMAU) * 100).toFixed(0)
  const digitalContain = Math.round(JOURNEYS.reduce((s, j) => s + j.sessions * j.containment, 0) / JOURNEYS.reduce((s, j) => s + j.sessions, 0))
  const rating = (RATINGS.reduce((s, r, i) => s + (5 - i) * r.value, 0) / 100).toFixed(1)

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Digital App Engagement')}
        subtitle={tt('MyREV app · MAU/DAU · in-app journeys · feature adoption · push campaigns · crash/perf')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{latestMAU}M MAU · {liveTime}
            </span>
            <Link to="/portal/contact-center" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> {tt('Contact Center')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Digital app intelligence"
        models={[
          { name: 'Containment Predictor', metric: 'AUC 0.91',    sub: 'journey drop-off · 7-day forward' },
          { name: 'Feature Adoption Model', metric: 'NDCG 0.84',  sub: 'feature recommendation engine' },
          { name: 'Churn-from-app Model',   metric: 'recall 0.88', sub: 'dormancy → churn signal 30d' },
        ]}
        agentLabel="Run Engagement Optimiser"
        agentRunningLabel="Analysing…"
        agentSteps={[
          'Scored journeys by volume × drop-off × call-deflection value',
          'Found friction in plan-change (29% drop) and troubleshoot (42% drop)',
          'Personalised in-app nudges drafted for low-containment intents',
          'Churn-risk cohort identified from app dormancy — routed to save campaign',
        ]}
        agentBlurb="Unifying app telemetry, CRM churn scores and contact-center tickets in one data platform lets a single model see when a journey frustration becomes a churn signal — the deflection opportunity is visible before the customer calls."
        decision={{
          title: 'Fix plan-change and troubleshoot flows to lift containment past 90%',
          detail: 'Plan-change (71% containment) and troubleshoot (58%) generate the most contact-center overflow. A redesigned step-by-step wizard and an early AI-chat escalation path (pre-loading device diagnostics and account state) can close the gap. The dormancy model flags 220K users with no activity in 14+ days as early-churn candidates — a personalised re-engagement push with one-tap bill-check is the recommended trigger.',
          impact: 'digital containment +6 pp · ~BSD 3.4M annual cost-to-serve reduction · churn save on 18K users',
          risk: 'do not trap vulnerable users in digital-only — always surface a human path within 3 taps',
          linkTo: '#/portal/contact-center',
          linkLabel: 'Open Contact Center',
        }}
        chart={{
          kind: 'line',
          title: 'Digital containment by journey — 6-month trend (%)',
          xKey: 'm',
          unit: '%',
          data: JOURNEY_TREND,
          series: [
            { key: 'bill',    name: 'Bill / pay',    color: GREEN  },
            { key: 'plan',    name: 'Plan change',   color: BLUE   },
            { key: 'support', name: 'Support/chat',  color: AMBER  },
          ],
          note: 'Billing near ceiling; plan-change and support are the containment growth opportunity.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('INC-878 push delivery lag affecting 140K users · Android 12 crash rate 1.24% exceeds 1.0% threshold')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Push infra team on-call — ETA resolution 2h. Android 12 users on auto-degraded flow pending fix.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/experience" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Experience →')}
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
          <KpiCard label={tt('MAU')}               value={`${latestMAU}M`}       delta={`${((latestMAU / (CUST.mobileSubs / 1e6)) * 100).toFixed(0)}% ${tt('of base')}`} trend="up" icon={Smartphone} accent />
          <KpiCard label={tt('Stickiness DAU/MAU')} value={`${stickiness}%`}      delta={tt('+3 pp YTD')}                  trend="up"   icon={Activity}     />
          <KpiCard label={tt('Digital containment')} value={`${digitalContain}%`} delta={tt('self-serve completion')}       trend="up"   icon={RefreshCw}    />
          <KpiCard label={tt('App store rating')}   value={`${rating}★`}          delta={tt('58% 5-star')}                  trend="up"   icon={Star}         />
          <KpiCard label={tt('Crash rate')}         value="0.62%"                 delta={tt('−0.20 pp YTD')}                trend="up"   icon={AlertTriangle} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg sessions / MAU')} value="5.3 / mo" delta={tt('+1.1 YTD')}           trend="up"   icon={BarChart2}    />
          <KpiCard label={tt('Avg session dur.')}   value="3.9 min"  delta={tt('+0.8 min YTD')}       trend="up"   icon={TrendingUp}   />
          <KpiCard label={tt('Digital-only users')} value="34%"      delta={tt('no contact-centre')}  trend="up"   icon={Users}        />
          <KpiCard label={tt('Push open rate')}     value="34.8%"    delta={tt('+4.6 pp YTD')}        trend="up"   icon={Bell}         />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('Digital app domain')}
            links={[
              { to: 'experience',      label: 'Experience',        metric: tt('NPS · CSAT · ratings'),        icon: Star          },
              { to: 'contact-center',  label: 'Contact Center',    metric: tt('Digital deflection KPIs'),     icon: MessageSquare },
              { to: 'churn-retention', label: 'Churn & Retention', metric: tt('Dormancy → churn signal'),     icon: TrendingUp    },
              { to: 'marketing',       label: 'Marketing',         metric: tt('Push + in-app campaigns'),     icon: Bell          },
              { to: 'loyalty-consent', label: 'Loyalty & Consent', metric: tt('Loyalty wallet · points'),     icon: ShieldCheck   },
              { to: 'voc',             label: 'Voice of Customer', metric: tt('App reviews · NPS driver'),    icon: Activity      },
              { to: 'ai-insights',     label: 'AI Insights',       metric: tt('Containment & adoption'),      icon: BarChart2     },
              { to: 'agents',          label: 'Agents',            metric: tt('In-app AI assistant'),         icon: Wifi          },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Digital app priorities FY2026')}
              items={[
                { name: 'Plan-change wizard redesign — target 85% containment', owner: tt('Digital Product · A. Willems'), pct: 40, status: 'on-track' },
                { name: 'AI assistant GA (beta → 50% of users)',                 owner: tt('AI Platform · Digital'),       pct: 28, status: 'on-track' },
                { name: 'Android 12 crash remediation',                          owner: tt('Mobile Engineering'),          pct: 70, status: 'at-risk'  },
                { name: 'Push infra upgrade (delivery lag fix)',                  owner: tt('Platform · DevOps'),           pct: 85, status: 'on-track' },
                { name: 'MAU target 10M by Q4-26',                               owner: tt('Digital · CMO office'),        pct: 62, status: 'on-track' },
              ]}
            />
          </div>
          <WatchList
            title={tt('App watch items')}
            items={[
              { text: tt('INC-878 push delivery lag affecting 140K — resolution in progress'), level: 'high'   },
              { text: tt('Android 12 crash rate 1.24% — exceeds 1.0% threshold'),              level: 'high'   },
              { text: tt('Plan-change dropout 29% — friction in step 3'),                      level: 'medium' },
              { text: tt('AI assistant CSAT 58% in beta — prompt quality work underway'),      level: 'medium' },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('MAU & DAU trend — 6 months (millions)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={ENGAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="mau" name="MAU" stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="wau" name="WAU" stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="dau" name="DAU" stroke={GREEN} fill={GREEN} fillOpacity={0.2}  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/experience" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Experience →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Digital containment by journey — current (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={JOURNEYS.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="journey" tick={{ fontSize: 8 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="containment" name={tt('Containment %')} radius={[0, 4, 4, 0]}>
                    {JOURNEYS.slice(0, 6).map((j, i) => <Cell key={i} fill={j.containment >= 85 ? GREEN : j.containment >= 70 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/contact-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Contact Center →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ MAU / DAU ENGAGEMENT ══════════════════════════════════ */}
      {tab === 'engagement' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('MAU')}              value={`${latestMAU}M`}  delta="+32% YTD"         trend="up"   icon={Smartphone} accent />
          <KpiCard label={tt('DAU')}              value={`${latestDAU}M`}  delta="+57% YTD"         trend="up"   icon={Activity}   />
          <KpiCard label={tt('Stickiness')}       value={`${stickiness}%`} delta={tt('+3 pp YTD')}  trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Avg dur / session')} value="3.9 min"          delta={tt('+26% YTD')}   trend="up"   icon={BarChart2}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Monthly, weekly & daily active users (millions)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={ENGAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="mau" name="MAU" stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="wau" name="WAU" stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
                  <Area type="monotone" dataKey="dau" name="DAU" stroke={GREEN} fill={GREEN} fillOpacity={0.2}  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('MAU up 32% YTD; stickiness at 40% — app is the primary service channel.')}</div>
          </Panel>

          <Panel title={tt('Sessions per user & session duration — trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={SESSION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[3.5, 6.5]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="avgSessions" name={tt('Sessions/user')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="avgDurMin" name={tt('Duration min')} stroke={AMBER} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Digital adoption funnel — % of mobile base')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={ADOPTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="seg" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="value" name={tt('% of base')} radius={[4, 4, 0, 0]}>
                  {ADOPTION.map((a, i) => <Cell key={i} fill={a.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ IN-APP JOURNEYS ════════════════════════════════════════ */}
      {tab === 'journeys' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg containment')} value={`${digitalContain}%`} delta={tt('weighted avg')}    trend="up"   icon={RefreshCw}     accent />
          <KpiCard label={tt('Top journey')}      value="Data check"           delta="96% containment"       trend="up"   icon={Activity}      />
          <KpiCard label={tt('Problem journey')}  value="Troubleshoot"         delta="58% containment"       trend="down" icon={AlertTriangle}  />
          <KpiCard label={tt('Total sessions')}   value="11.8M / mo"           delta={tt('+28% YoY')}        trend="up"   icon={Users}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['sessions', 'containment'] as const).map(k => (
            <button key={k} onClick={() => setJourneySort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${journeySort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'sessions' ? tt('Sessions') : tt('Containment')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Journey containment scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Journey')}</th>
                    <th className="text-right">{tt('Sessions')}</th>
                    <th className="text-right">{tt('Contained %')}</th>
                    <th className="text-right">{tt('Drop-off %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJourneys.map(j => (
                    <tr key={j.journey} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{j.journey}</td>
                      <td className="text-right font-mono text-xs">{(j.sessions / 1e6).toFixed(2)}M</td>
                      <td className={`text-right font-bold ${j.containment >= 85 ? 'text-emerald-600' : j.containment >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>{j.containment}%</td>
                      <td className={`text-right font-bold ${j.dropOff >= 30 ? 'text-red-600' : j.dropOff >= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>{j.dropOff}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link to="/portal/contact-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Contact Center →')}</Link>
              <Link to="/portal/experience"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Containment trend — billing, plan-change, support (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={JOURNEY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[50, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="bill"    name={tt('Bill / pay')}  stroke={GREEN} strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="plan"    name={tt('Plan change')} stroke={BLUE}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="support" name={tt('Support')}     stroke={AMBER} strokeWidth={2}   strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={90} stroke={GREEN} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Session funnel — from app open to return visit (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={SESSION_FUNNEL}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="step" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 110]} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="value" name={tt('% of sessions')} radius={[4, 4, 0, 0]}>
                  {SESSION_FUNNEL.map((_, i) => <Cell key={i} fill={[NAVY, BLUE, BLUE, GREEN, AMBER, PURPLE][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ FEATURE ADOPTION ══════════════════════════════════════ */}
      {tab === 'features' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Top feature')}      value="Biometric login" delta="82% adoption"              trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Highest NPS')}       value="Data gifting"    delta="NPS 71"                    trend="up"   icon={Star}        />
          <KpiCard label={tt('Features in beta')} value="2"               delta={tt('AI assistant + map')}  trend="flat" icon={Zap}         />
          <KpiCard label={tt('New GA target')}     value="Network map"     delta={tt('Q3-26')}               trend="up"   icon={Wifi}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Feature adoption & NPS')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Feature')}</th>
                    <th className="text-right">{tt('Adoption %')}</th>
                    <th className="text-right">{tt('NPS')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(f => (
                    <tr key={f.feature} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{f.feature}</td>
                      <td className={`text-right font-bold ${f.adoptionPct >= 70 ? 'text-emerald-600' : f.adoptionPct >= 40 ? 'text-blue-600' : 'text-amber-600'}`}>{f.adoptionPct}%</td>
                      <td className={`text-right font-bold ${f.nps >= 65 ? 'text-emerald-600' : f.nps >= 55 ? 'text-blue-600' : 'text-amber-600'}`}>{f.nps}</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stP(f.status)}`}>{tt(f.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/product" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Product →')}</Link>
              <Link to="/portal/voc"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Voice of Customer →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Feature adoption growth — 6-month trend (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={FEATURE_LAUNCH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="biometric" name={tt('Biometric')} stroke={BLUE}   strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="ebill"     name={tt('E-bill')}    stroke={NAVY}   strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="chat"      name={tt('Live chat')} stroke={GREEN}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="gifting"   name={tt('Data gift')} stroke={AMBER}  strokeWidth={2}   strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ PUSH & IN-APP CAMPAIGNS ═══════════════════════════════ */}
      {tab === 'campaigns' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Push open rate')}  value="34.8%"   delta={tt('+4.6 pp YTD')}  trend="up"   icon={Bell}       accent />
          <KpiCard label={tt('In-app CTR')}      value="22.1%"   delta={tt('top campaign')}  trend="up"   icon={BarChart2}  />
          <KpiCard label={tt('Best conv.')}       value="14.8%"   delta={tt('churn save')}    trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Active campaigns')} value="6"       delta="2 push · 4 in-app"  trend="flat" icon={Activity}  />
        </div>

        <Panel title={tt('Push & in-app campaign performance')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Campaign')}</th>
                  <th>{tt('Channel')}</th>
                  <th className="text-right">{tt('Sent')}</th>
                  <th className="text-right">{tt('Open %')}</th>
                  <th className="text-right">{tt('CTR %')}</th>
                  <th className="text-right">{tt('Conv %')}</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map(c => (
                  <tr key={c.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{c.name}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.channel === 'In-app' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{tt(c.channel)}</span></td>
                    <td className="text-right font-mono text-xs">{(c.sent / 1e6).toFixed(2)}M</td>
                    <td className={`text-right font-bold ${c.opens >= 55 ? 'text-emerald-600' : c.opens >= 30 ? 'text-blue-600' : 'text-amber-600'}`}>{c.opens}%</td>
                    <td className={`text-right font-bold ${c.ctr >= 15 ? 'text-emerald-600' : c.ctr >= 8 ? 'text-blue-600' : 'text-amber-600'}`}>{c.ctr}%</td>
                    <td className={`text-right font-bold ${c.conv >= 8 ? 'text-emerald-600' : c.conv >= 3 ? 'text-blue-600' : 'text-amber-600'}`}>{c.conv}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/marketing"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
            <Link to="/portal/promotions" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Promotions →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Push open rate & CTR — 6-month trend (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={PUSH_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="openRate" name={tt('Open rate %')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="ctr" name={tt('CTR %')} stroke={AMBER} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Campaign conversion by name (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CAMPAIGNS} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 20]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={160} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="conv" name={tt('Conversion %')} radius={[0, 4, 4, 0]}>
                    {CAMPAIGNS.map((c, i) => <Cell key={i} fill={c.conv >= 8 ? GREEN : c.conv >= 3 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ APP STORE SENTIMENT ═══════════════════════════════════ */}
      {tab === 'sentiment' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Avg rating')}    value={`${rating}★`}  delta={tt('+0.4★ YTD')}            trend="up"   icon={Star}          accent />
          <KpiCard label={tt('5-star share')}  value="58%"            delta={tt('+8 pp YTD')}             trend="up"   icon={TrendingUp}    />
          <KpiCard label={tt('Top complaint')} value="Login friction"  delta={tt('38% of 1-2★')}          trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('iOS vs Android')} value="4.3 vs 4.2"    delta={tt('iOS leads')}             trend="up"   icon={Smartphone}   />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('App store rating distribution (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={RATINGS} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {RATINGS.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('iOS vs Android rating — 6-month trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={RATING_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[3.6, 4.5]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ios"     name="iOS"     stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="android" name="Android" stroke={GREEN} strokeWidth={2}   dot={false} />
                  <ReferenceLine y={4.0} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber line = 4.0 threshold for app store featuring eligibility')}</div>
          </Panel>
        </div>

        <Panel title={tt('Review topic analysis — positive vs negative mentions (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={REVIEW_TOPICS} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 9 }} width={160} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="positive" name={tt('Positive %')} fill={GREEN} radius={[0, 4, 4, 0]} />
                <Bar dataKey="negative" name={tt('Negative %')} fill={RED}   radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/voc" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Voice of Customer →')}</Link>
            <span className="text-[10px] text-vfes-dark/40">{tt('Login friction is #1 fix — biometric expansion targeted Q3')}</span>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CRASH & PERFORMANCE ═══════════════════════════════════ */}
      {tab === 'performance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Crash rate')}      value="0.62%"   delta={tt('−0.20 pp YTD')}        trend="up"   icon={AlertTriangle} accent />
          <KpiCard label={tt('App startup')}      value="1.86 s"  delta={tt('−0.54 s YTD')}         trend="up"   icon={Zap}           />
          <KpiCard label={tt('API P95')}          value="284 ms"  delta={tt('−96 ms YTD')}           trend="up"   icon={Activity}      />
          <KpiCard label={tt('Active incidents')} value="1"       delta="INC-878 push lag"           trend="down" icon={ShieldCheck}   />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('OS filter:')}</span>
          {(['All', 'iOS', 'Android'] as const).map(k => (
            <button key={k} onClick={() => setOsFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${osFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(k)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Crash rate & startup time — 6-month trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={PERF_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[0.5, 1.0]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" ms" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="crashRate"  name={tt('Crash rate %')} stroke={RED}  strokeWidth={2.4} dot />
                  <Bar  yAxisId="r"                 dataKey="startupMs"  name={tt('Startup ms')}   fill={BLUE}   radius={[4, 4, 0, 0]} />
                  <ReferenceLine yAxisId="l" y={1.0} stroke={RED} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Crash rate by OS version (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredCrash}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="os" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 1.5]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="crashRate" name={tt('Crash rate %')} radius={[4, 4, 0, 0]}>
                    {filteredCrash.map((c, i) => <Cell key={i} fill={c.crashRate >= 1.0 ? RED : c.crashRate >= 0.7 ? AMBER : GREEN} />)}
                  </Bar>
                  <ReferenceLine y={1.0} stroke={RED} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Recent app incidents')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Title')}</th>
                  <th>{tt('Severity')}</th>
                  <th>{tt('Status')}</th>
                  <th>{tt('Affected')}</th>
                  <th>{tt('Duration')}</th>
                </tr>
              </thead>
              <tbody>
                {INCIDENTS.map(i => (
                  <tr key={i.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs">{i.id}</td>
                    <td className="font-semibold text-xs">{i.title}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(i.severity === 'Low' ? 'Low' : i.severity === 'Medium' ? 'Med' : 'High')}`}>{tt(i.severity)}</span></td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stP(i.status)}`}>{tt(i.status)}</span></td>
                    <td className="text-xs text-vfes-dark/65">{i.affected}</td>
                    <td className="font-mono text-xs">{i.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/experience" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/network"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ DIGITAL ADOPTION ══════════════════════════════════════ */}
      {tab === 'adoption' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Registered on app')} value="84%"  delta={tt('of mobile base')}     trend="up"   icon={Smartphone} accent />
          <KpiCard label={tt('Active 30d')}         value="60%"  delta={tt('of base')}             trend="up"   icon={Activity}   />
          <KpiCard label={tt('Self-serve (bill)')}  value="47%"  delta={tt('of base')}             trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Digital-only')}       value="34%"  delta={tt('no contact-centre')}  trend="up"   icon={Users}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Digital adoption funnel (% of mobile base)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ADOPTION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="seg" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="value" name={tt('% of base')} radius={[4, 4, 0, 0]}>
                    {ADOPTION.map((a, i) => <Cell key={i} fill={a.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Digital-only is most cost-efficient — growth investment in digital containment yields highest ROI.')}</div>
          </Panel>

          <Panel title={tt('MAU as % of mobile base — 6-month trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={ENGAGE.map(e => ({ m: e.m, pctBase: parseFloat(((e.mau / (CUST.mobileSubs / 1e6)) * 100).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="pctBase" name={tt('MAU % of base')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ── Cross-domain quick links ────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/40 mb-3">{tt('Related pages')}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/executive"        className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Executive →')}</Link>
          <Link to="/portal/customer-360"     className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Customer 360 →')}</Link>
          <Link to="/portal/clv"              className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('CLV →')}</Link>
          <Link to="/portal/churn-retention"  className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Churn & Retention →')}</Link>
          <Link to="/portal/experience"       className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Experience →')}</Link>
          <Link to="/portal/contact-center"   className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Contact Center →')}</Link>
          <Link to="/portal/voc"              className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Voice of Customer →')}</Link>
          <Link to="/portal/marketing"        className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Marketing →')}</Link>
          <Link to="/portal/loyalty-consent"  className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Loyalty & Consent →')}</Link>
          <Link to="/portal/base-management"  className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Base Management →')}</Link>
          <Link to="/portal/promotions"       className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Promotions →')}</Link>
          <Link to="/portal/ai-insights"      className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('AI Insights →')}</Link>
          <Link to="/portal/agents"           className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Agents →')}</Link>
          <Link to="/portal/product"          className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Product →')}</Link>
          <Link to="/portal/network"          className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Network →')}</Link>
          <Link to="/portal/trust-center"     className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Trust Center →')}</Link>
          <Link to="/portal/fraud"            className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Fraud →')}</Link>
        </div>
      </div>
    </div>
  )
}
