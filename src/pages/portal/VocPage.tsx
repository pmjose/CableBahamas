import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MessageSquareText, Brain, ChevronRight, ThumbsDown, ThumbsUp, Sparkles,
  TrendingUp, TrendingDown, Star, AlertTriangle, Activity, Users,
  BarChart2, Filter, RefreshCw, Clock, Mail, MessageCircle,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, PieChart, Pie,
  ComposedChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts'

const BLUE   = '#FF4438'
const NAVY   = '#11567F'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE  = '#94a3b8'
const RED    = '#EF4444'

// ─── Topic taxonomy ───────────────────────────────────────────────────────────
const TOPICS = [
  { topic: 'Billing / charges',    vol: 4820, sentiment: -0.42, deltaWoW: 18,  category: 'Billing',    cortexConf: 94 },
  { topic: 'Network / coverage',   vol: 3640, sentiment: -0.31, deltaWoW: 42,  category: 'Technical',  cortexConf: 91 },
  { topic: 'Roaming confusion',    vol: 2180, sentiment: -0.28, deltaWoW: -8,  category: 'Billing',    cortexConf: 88 },
  { topic: 'Plan / upgrade',       vol: 1960, sentiment:  0.12, deltaWoW:  4,  category: 'Commercial', cortexConf: 86 },
  { topic: 'Device / handset',     vol: 1420, sentiment:  0.04, deltaWoW: -3,  category: 'Device',     cortexConf: 82 },
  { topic: 'Cancellation intent',  vol:  980, sentiment: -0.66, deltaWoW: 24,  category: 'Retention',  cortexConf: 90 },
  { topic: 'Praise / thanks',      vol:  740, sentiment:  0.78, deltaWoW:  6,  category: 'Positive',   cortexConf: 97 },
  { topic: 'Speed / performance',  vol:  680, sentiment: -0.21, deltaWoW: 12,  category: 'Technical',  cortexConf: 85 },
]

// ─── Sentiment 30-day trend ───────────────────────────────────────────────────
const SENTIMENT_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D${i + 1}`,
  sentiment: parseFloat((-0.05 + 0.18 * Math.sin(i / 2) - (i === 9 ? 0.35 : 0)).toFixed(3)),
  volume:    Math.round(14200 + 1800 * Math.sin(i / 4)),
}))

// ─── Channel volumes ──────────────────────────────────────────────────────────
const CHANNELS = [
  { ch: 'Voice (call centre)', vol: 9200,  autoResolved: 0,  avgSent: -0.18, nps: 24 },
  { ch: 'Chat / WhatsApp',     vol: 6400,  autoResolved: 58, avgSent: -0.08, nps: 32 },
  { ch: 'App reviews',         vol: 1800,  autoResolved: 0,  avgSent: -0.22, nps: 28 },
  { ch: 'Social / X',          vol: 1240,  autoResolved: 0,  avgSent: -0.38, nps: 14 },
  { ch: 'Email',               vol:  980,  autoResolved: 34, avgSent: -0.12, nps: 30 },
  { ch: 'App store',           vol:  840,  autoResolved: 0,  avgSent: -0.24, nps: 20 },
]

// ─── NPS driver data ──────────────────────────────────────────────────────────
const NPS_DRIVERS = [
  { driver: 'Network reliability', impact: 0.42, currentScore: 74, gap: 0, category: 'Network'    },
  { driver: 'Price / value',       impact: 0.38, currentScore: 62, gap: 10, category: 'Billing'   },
  { driver: 'App usability',       impact: 0.31, currentScore: 68, gap: 5,  category: 'Digital'   },
  { driver: 'Issue resolution',    impact: 0.28, currentScore: 58, gap: 12, category: 'Service'   },
  { driver: 'Agent friendliness',  impact: 0.24, currentScore: 80, gap: 0,  category: 'Service'   },
  { driver: 'Billing clarity',     impact: 0.22, currentScore: 56, gap: 14, category: 'Billing'   },
  { driver: '5G availability',     impact: 0.18, currentScore: 71, gap: 3,  category: 'Network'   },
]

// ─── NPS trend ────────────────────────────────────────────────────────────────
const NPS_TREND = [
  { m: 'Jun', nps: 22, promoters: 48, detractors: 26, passives: 26 },
  { m: 'Jul', nps: 24, promoters: 49, detractors: 25, passives: 26 },
  { m: 'Aug', nps: 23, promoters: 48, detractors: 25, passives: 27 },
  { m: 'Sep', nps: 26, promoters: 50, detractors: 24, passives: 26 },
  { m: 'Oct', nps: 28, promoters: 52, detractors: 24, passives: 24 },
  { m: 'Nov', nps: 30, promoters: 54, detractors: 24, passives: 22 },
]

// ─── Theme trends (weekly) ────────────────────────────────────────────────────
const THEME_TREND = [
  { w: 'W1', billing: 4400, network: 2800, roaming: 2400, cancellation: 820 },
  { w: 'W2', billing: 4600, network: 3200, roaming: 2300, cancellation: 880 },
  { w: 'W3', billing: 4700, network: 3800, roaming: 2250, cancellation: 910 },
  { w: 'W4', billing: 4820, network: 3640, roaming: 2180, cancellation: 980 },
]

// ─── Verbatim samples ─────────────────────────────────────────────────────────
const VERBATIMS = [
  { txt: '"They charged me BSD 14 extra without warning — 3 calls and nobody fixes it."',      topic: 'Billing',          sent: 'neg', channel: 'Voice',   score: -0.72 },
  { txt: '"No 5G coverage in my area for a week now — absolutely unacceptable service."',   topic: 'Network',          sent: 'neg', channel: 'Twitter', score: -0.68 },
  { txt: '"The switch to 1Gb fibre was super fast, really happy with the technician."',      topic: 'Praise',           sent: 'pos', channel: 'App',     score:  0.88 },
  { txt: '"Cortex chat solved my roaming issue instantly — never had to wait for agent."',   topic: 'Praise',           sent: 'pos', channel: 'Chat',    score:  0.82 },
  { txt: '"I\u2019ve been a customer for 10 years and the app never shows my correct bill."',     topic: 'Billing',          sent: 'neg', channel: 'App',     score: -0.58 },
  { txt: '"The retention team actually listened and gave me a fair deal — impressed."',      topic: 'Plan / upgrade',   sent: 'pos', channel: 'Voice',   score:  0.74 },
]

// ─── Closed-loop tracker ──────────────────────────────────────────────────────
const CLOSED_LOOP = [
  { action: 'Billing-explainer update',   owner: 'Product',    status: 'In progress', eta: 'Jul-14', tickets: 312, expected: '−18% billing mentions' },
  { action: 'Network update push alerts', owner: 'NOC',        status: 'Live',        eta: 'Done',   tickets: 248, expected: '−22% network NPS impact' },
  { action: 'Roaming FAQ chatbot flow',   owner: 'Digital CX', status: 'In review',   eta: 'Jul-21', tickets: 184, expected: '+12% deflection' },
  { action: 'Detractor outreach batch',   owner: 'Retention',  status: 'Scheduled',   eta: 'Jul-10', tickets: 142, expected: '+4 NPS pp' },
  { action: 'App bill-view redesign',     owner: 'App team',   status: 'Planned',     eta: 'Aug-01', tickets: 110, expected: '+8 app store rating' },
]

// ─── Sentiment heatmap (topic × channel) ─────────────────────────────────────
const SENTIMENT_HEATMAP = [
  { topic: 'Billing',      voice: -0.45, chat: -0.38, app: -0.52, social: -0.62, email: -0.28 },
  { topic: 'Network',      voice: -0.34, chat: -0.28, app: -0.32, social: -0.48, email: -0.22 },
  { topic: 'Roaming',      voice: -0.30, chat: -0.22, app: -0.28, social: -0.40, email: -0.18 },
  { topic: 'Plan/upgrade', voice:  0.10, chat:  0.18, app:  0.08, social: -0.04, email:  0.14 },
  { topic: 'Cancellation', voice: -0.68, chat: -0.60, app: -0.72, social: -0.80, email: -0.44 },
  { topic: 'Praise',       voice:  0.72, chat:  0.80, app:  0.84, social:  0.70, email:  0.68 },
]

// ─── Detractor journey data ───────────────────────────────────────────────────
const DETRACTOR_JOURNEY = [
  { stage: 'Detractor flagged', count: 980, pct: 100 },
  { stage: 'Cortex routed',     count: 890, pct: 91  },
  { stage: 'Agent contacted',   count: 620, pct: 63  },
  { stage: 'Offer made',        count: 480, pct: 49  },
  { stage: 'Saved',             count: 320, pct: 33  },
  { stage: 'NPS re-surveyed',   count: 210, pct: 21  },
]

// ─── Survey response rate trend ───────────────────────────────────────────────
const SURVEY_TREND = [
  { m: 'Jun', response: 18, completion: 84, nps: 22 },
  { m: 'Jul', response: 19, completion: 85, nps: 24 },
  { m: 'Aug', response: 20, completion: 86, nps: 23 },
  { m: 'Sep', response: 21, completion: 87, nps: 26 },
  { m: 'Oct', response: 22, completion: 88, nps: 28 },
  { m: 'Nov', response: 23, completion: 89, nps: 30 },
]

// ─── Topic sentiment scatter data ────────────────────────────────────────────
const TOPIC_SCATTER = TOPICS.map(t => ({
  name: t.topic, vol: t.vol, sentiment: t.sentiment, wow: t.deltaWoW,
}))

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'topics' | 'sentiment' | 'nps' | 'channels' | 'verbatims' | 'closedloop' | 'themes'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',   label: 'Overview'            },
  { id: 'topics',     label: 'Topic Mining'         },
  { id: 'sentiment',  label: 'Sentiment Trends'     },
  { id: 'nps',        label: 'NPS Drivers'          },
  { id: 'channels',   label: 'Channel Feedback'     },
  { id: 'verbatims',  label: 'Verbatims'            },
  { id: 'closedloop', label: 'Closed-Loop'          },
  { id: 'themes',     label: 'Theme Trends'         },
]

export default function VocPage() {
  const { i18n } = useTranslation()

  // ── hooks ──────────────────────────────────────────────────────────────────
  const [tab,           setTab]           = useState<TabId>('overview')
  const [topicFilter,   setTopicFilter]   = useState<string>('All')
  const [sentimentWin,  setSentimentWin]  = useState<14 | 30>(14)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime,      setLiveTime]      = useState<string>('')
  const [verbatimFilter, setVerbatimFilter] = useState<'all' | 'neg' | 'pos'>('all')
  const [loopSort,      setLoopSort]      = useState<'eta' | 'tickets'>('tickets')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const totalVol = useMemo(() => TOPICS.reduce((s, t) => s + t.vol, 0), [])

  const filteredTopics = useMemo(
    () => topicFilter === 'All' ? TOPICS : TOPICS.filter(t => t.category === topicFilter),
    [topicFilter],
  )

  const sentimentData = useMemo(
    () => SENTIMENT_TREND.slice(sentimentWin === 14 ? 16 : 0),
    [sentimentWin],
  )

  const filteredVerbatims = useMemo(
    () => verbatimFilter === 'all' ? VERBATIMS : VERBATIMS.filter(v => v.sent === verbatimFilter),
    [verbatimFilter],
  )

  const sortedLoop = useMemo(
    () => [...CLOSED_LOOP].sort((a, b) =>
      loopSort === 'tickets' ? b.tickets - a.tickets : a.eta.localeCompare(b.eta)),
    [loopSort],
  )

  const topicCategories = useMemo(
    () => ['All', ...Array.from(new Set(TOPICS.map(t => t.category)))],
    [],
  )

  const netSentiment = useMemo(
    () => (TOPICS.reduce((s, t) => s + t.vol * t.sentiment, 0) / totalVol).toFixed(2),
    [totalVol],
  )

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Voice of Customer (VoC)')}
        subtitle={tt('Transcripts → Cortex AI topic + sentiment → escalation · all channels')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {totalVol.toLocaleString('en-BS')} {tt('mentions / day · ')}{liveTime}
            </span>
            <Link to="/portal/ai-insights" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Brain className="w-4 h-4" /> {tt('AI Insights')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="VoC intelligence"
        models={[
          { name: 'Topic Classifier',    metric: 'F1 0.91',     sub: 'AI_CLASSIFY — 32 topic taxonomy'      },
          { name: 'Sentiment Scorer',    metric: 'RMSE 0.06',   sub: 'AI_SENTIMENT — utterance-level'       },
          { name: 'NPS Predictor',       metric: 'AUC 0.84',    sub: 'post-interaction NPS probability'     },
        ]}
        agentLabel="Run VoC Triage"
        agentRunningLabel="Classifying…"
        agentSteps={[
          'Classified all mentions by topic & sentiment (Cortex AI_CLASSIFY + AI_SENTIMENT)',
          'Routed detractors to the save desk with full context attached',
          'Drafted channel responses for the top 3 negative drivers',
          'Filed product defects to engineering with evidence packets',
        ]}
        agentBlurb="Unstructured feedback becomes routed, actioned work — not a dashboard nobody reads. Cortex reads every transcript, classifies the topic, scores sentiment and auto-routes the right action."
        decision={{
          title:    'Fix billing-clarity and network-notification gaps; contact detractors within 48h',
          detail:   'Billing and network are the top two negative drivers by volume × sentiment. A billing-explainer update and proactive network-outage push alerts together remove the root cause for ~42% of negative mentions. Detractor outreach within 48h has a 33% save rate.',
          impact:   '+4 NPS pp · −42% negative mention volume · 33% detractor save rate',
          risk:     'Acting on noisy low-volume topics — weight actions by volume × sentiment score',
          linkTo:   '#/portal/churn-retention',
          linkLabel:'Open Churn & Retention',
        }}
        chart={{
          kind:   'bar',
          title:  'Topic volume — daily mentions by driver',
          xKey:   'topic',
          data:   TOPICS,
          series: [{ key: 'vol', name: 'Daily mentions', color: NAVY }],
          colorBy: { key: 'vol', high: 4000, mid: 2000 },
          note:   'Billing and network dominate. Network volume up 42% WoW — Freeport outage correlation confirmed.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('Network topic +42% WoW · Cancellation intent volume +24% · Net sentiment −0.31 deteriorating')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Freeport outage impact visible in feedback. Detractor escalation batch scheduled for tomorrow.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/network" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Network →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">
                {tt('Dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Daily mentions')}      value={totalVol.toLocaleString('en-BS')} delta={tt('across 6 channels')}  trend="flat" icon={MessageSquareText} accent />
        <KpiCard label={tt('Net sentiment')}        value={netSentiment}                      delta={tt('−0.21 vs last week')} trend="down" icon={ThumbsDown} />
        <KpiCard label={tt('Chat auto-resolved')}   value="58%"                               delta={tt('Cortex deflection')} trend="up"   icon={Sparkles}  />
        <KpiCard label={tt('NPS (latest wave)')}    value="+30"                               delta={tt('+8 vs Jan')}         trend="up"   icon={Star}      />
      </div>

      {/* ── Tab nav — 8 pills ───────────────────────────────────────────────── */}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Escalations triggered')} value="142"    delta={tt('network topic spike')} trend="down" icon={ThumbsDown}   />
          <KpiCard label={tt('Detractor save rate')}   value="33%"    delta={tt('of contacted')}        trend="up"   icon={TrendingUp}   />
          <KpiCard label={tt('Topics tracked')}        value="32"     delta={tt('Cortex taxonomy')}     trend="flat" icon={BarChart2}    />
          <KpiCard label={tt('Avg Cortex conf.')}      value="89%"    delta={tt('classification score')} trend="up"  icon={Brain}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Topic volume & sentiment (Cortex AI_CLASSIFY + AI_SENTIMENT)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Topic')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume')}</th>
                    <th className="px-3 py-2 text-right">{tt('Sentiment')}</th>
                    <th className="px-3 py-2 text-right">{tt('WoW')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TOPICS.map(t => (
                    <tr key={t.topic} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(t.topic)}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.vol.toLocaleString('en-BS')}</td>
                      <td className={`px-3 py-2 text-right font-mono ${t.sentiment > 0 ? 'text-emerald-600' : t.sentiment < -0.4 ? 'text-red-600' : 'text-amber-600'}`}>
                        {t.sentiment > 0 ? '+' : ''}{t.sentiment.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${t.deltaWoW > 20 ? 'text-red-600' : t.deltaWoW > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {t.deltaWoW > 0 ? '+' : ''}{t.deltaWoW}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {tt('Network topic +42% WoW — correlates with Freeport outage; cancellation intent rising.')}
              <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <Panel title={tt('Net sentiment — 14 days')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={sentimentData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} domain={[-0.5, 0.3]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toFixed(2), tt('Sentiment')]} />
                  <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="sentiment" stroke={BLUE} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('D10 trough = same-day outage impact; closed-loop alert fired to NOC and CX.')}
            </div>
          </Panel>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Link to="/portal/contact-center" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <MessageCircle className="w-5 h-5 text-[#222128] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Contact Center')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('AHT · FCR · queues')}</div>
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
          <Link to="/portal/customer-360" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/5 hover:border-vfes-red/30 hover:shadow-sm transition">
            <Users className="w-5 h-5 text-[#10B981] shrink-0" />
            <div>
              <div className="text-xs font-bold text-vfes-dark">{tt('Customer 360')}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Full customer view')}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-vfes-dark/30 ml-auto" />
          </Link>
        </div>
        {/* Recent escalations summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <KpiCard label={tt('Billing alert')}      value="+9.5%"  delta={tt('4-week trend')}       trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Network alert')}      value="+42%"   delta={tt('outage-driven')}      trend="down" icon={Activity}     />
          <KpiCard label={tt('Cancellation risk')}  value="+19%"   delta={tt('save desk notified')} trend="down" icon={TrendingDown} />
          <KpiCard label={tt('Closed-loop rate')}   value="63%"    delta={tt('detractors contacted')} trend="up" icon={RefreshCw}   />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/45 mb-3">{tt('Related domains')}</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/portal/contact-center"  className="font-semibold text-[#222128] hover:underline">{tt('Contact Center →')}</Link>
            <Link to="/portal/churn-retention" className="font-semibold text-[#F59E0B] hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/experience"      className="font-semibold text-[#7C3AED] hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/operations"      className="font-semibold text-[#10B981] hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/network"         className="font-semibold text-[#11567F] hover:underline">{tt('Network →')}</Link>
            <Link to="/portal/marketing"       className="font-semibold text-[#94a3b8] hover:underline">{tt('Marketing →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ TOPIC MINING ═══════════════════════════════════════════ */}
      {tab === 'topics' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Topics tracked')}     value="32"          delta={tt('Cortex taxonomy')}    trend="flat" icon={BarChart2}  accent />
          <KpiCard label={tt('Top negative topic')} value={tt('Billing')}   delta={tt('4,820 mentions')} trend="down" icon={ThumbsDown} />
          <KpiCard label={tt('Top positive topic')} value={tt('Praise')}    delta={tt('0.78 sentiment')} trend="up"   icon={ThumbsUp}  />
          <KpiCard label={tt('Avg confidence')}     value="89%"         delta={tt('Cortex classify')}   trend="up"   icon={Sparkles}  />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Category:')}</span>
          {topicCategories.map(cat => (
            <button key={cat} onClick={() => setTopicFilter(cat)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${topicFilter === cat ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(cat)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Topic volume — daily mentions')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredTopics} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="topic" stroke="#999" fontSize={9} width={135} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="vol" name={tt('Mentions/day')} radius={[0, 4, 4, 0]}>
                    {filteredTopics.map((t, i) => <Cell key={i} fill={t.sentiment < -0.4 ? RED : t.sentiment < 0 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Topic sentiment score (AI_SENTIMENT)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredTopics} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[-1, 1]} />
                  <YAxis type="category" dataKey="topic" stroke="#999" fontSize={9} width={135} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toFixed(2), tt('Sentiment')]} />
                  <ReferenceLine x={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Bar dataKey="sentiment" name={tt('Sentiment')} radius={[0, 4, 4, 0]}>
                    {filteredTopics.map((t, i) => <Cell key={i} fill={t.sentiment > 0 ? GREEN : t.sentiment < -0.4 ? RED : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Topic detail — volume, sentiment, WoW change & Cortex confidence')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Topic')}</th>
                  <th className="px-3 py-2">{tt('Category')}</th>
                  <th className="px-3 py-2 text-right">{tt('Volume')}</th>
                  <th className="px-3 py-2 text-right">{tt('Sentiment')}</th>
                  <th className="px-3 py-2 text-right">{tt('WoW')}</th>
                  <th className="px-3 py-2 text-right">{tt('Cortex %')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map(t => (
                  <tr key={t.topic} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(t.topic)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(t.category)}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.vol.toLocaleString('en-BS')}</td>
                    <td className={`px-3 py-2 text-right font-mono ${t.sentiment > 0 ? 'text-emerald-600' : t.sentiment < -0.4 ? 'text-red-600' : 'text-amber-600'}`}>
                      {t.sentiment > 0 ? '+' : ''}{t.sentiment.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 text-right font-bold font-mono ${t.deltaWoW > 20 ? 'text-red-600' : t.deltaWoW > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {t.deltaWoW > 0 ? '+' : ''}{t.deltaWoW}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">{t.cortexConf}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/cortex-search" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
            <Link to="/portal/ai-insights"   className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
        <Panel title={tt('Topic velocity radar — WoW change by category (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={TOPICS}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="topic" stroke="#999" fontSize={8} />
                <YAxis stroke="#999" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v) > 0 ? '+' : ''}${v}%`, tt('WoW change')]} />
                <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                <Bar dataKey="deltaWoW" name={tt('WoW change %')} radius={[4, 4, 0, 0]}>
                  {TOPICS.map((t, i) => <Cell key={i} fill={t.deltaWoW > 20 ? RED : t.deltaWoW > 0 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-xs text-vfes-dark/55">
            {tt('Network +42% and cancellation +24% flagged for closed-loop routing.')}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/operations"      className="font-semibold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ SENTIMENT TRENDS ══════════════════════════════════════ */}
      {tab === 'sentiment' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Net sentiment')}       value={netSentiment}  delta={tt('−0.21 vs last wk')} trend="down" icon={ThumbsDown}   accent />
          <KpiCard label={tt('Positive mentions')}   value="18%"           delta={tt('Praise volume')}    trend="up"   icon={ThumbsUp}      />
          <KpiCard label={tt('Negative mentions')}   value="62%"           delta={tt('Billing+Network')}  trend="down" icon={ThumbsDown}    />
          <KpiCard label={tt('Neutral mentions')}    value="20%"           delta={tt('plan/device')}      trend="flat" icon={Activity}      />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Window:')}</span>
          {([14, 30] as const).map(w => (
            <button key={w} onClick={() => setSentimentWin(w)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${sentimentWin === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(`${w} days`)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Net sentiment trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={sentimentData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="#999" fontSize={10} interval={sentimentWin === 30 ? 4 : 1} />
                  <YAxis stroke="#999" fontSize={11} domain={[-0.6, 0.4]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toFixed(3), tt('Sentiment')]} />
                  <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="sentiment" stroke={BLUE} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Mention volume trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={sentimentData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="#999" fontSize={10} interval={sentimentWin === 30 ? 4 : 1} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toLocaleString('en-BS'), tt('Mentions')]} />
                  <Area type="monotone" dataKey="volume" stroke={NAVY} fill={NAVY} fillOpacity={0.15} name={tt('Volume')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Sentiment heatmap — topic × channel')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Topic')}</th>
                  <th className="px-3 py-2 text-right">{tt('Voice')}</th>
                  <th className="px-3 py-2 text-right">{tt('Chat')}</th>
                  <th className="px-3 py-2 text-right">{tt('App')}</th>
                  <th className="px-3 py-2 text-right">{tt('Social')}</th>
                  <th className="px-3 py-2 text-right">{tt('Email')}</th>
                </tr>
              </thead>
              <tbody>
                {SENTIMENT_HEATMAP.map(r => {
                  const cell = (v: number) => (
                    <td className={`px-3 py-2 text-right font-mono text-xs font-bold ${v > 0 ? 'text-emerald-600' : v < -0.5 ? 'text-red-600' : v < -0.3 ? 'text-amber-600' : 'text-orange-500'}`}>
                      {v > 0 ? '+' : ''}{v.toFixed(2)}
                    </td>
                  )
                  return (
                    <tr key={r.topic} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(r.topic)}</td>
                      {cell(r.voice)}{cell(r.chat)}{cell(r.app)}{cell(r.social)}{cell(r.email)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/operations" className="font-semibold text-vfes-dark hover:underline">{tt('Operations →')}</Link>
            <Link to="/portal/network"    className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ NPS DRIVERS ═══════════════════════════════════════════ */}
      {tab === 'nps' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('NPS latest wave')}   value="+30"   delta={tt('+8 vs Jan')}         trend="up"   icon={Star}       accent />
          <KpiCard label={tt('Promoters')}          value="54%"   delta={tt('+6 pp vs Jan')}      trend="up"   icon={ThumbsUp}  />
          <KpiCard label={tt('Detractors')}         value="24%"   delta={tt('−2 pp vs Jan')}      trend="up"   icon={ThumbsDown} />
          <KpiCard label={tt('Top NPS driver')}     value={tt('Network')} delta={tt('impact 0.42')} trend="flat" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('NPS driver importance × current score')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={NPS_DRIVERS} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[0, 0.5]} />
                  <YAxis type="category" dataKey="driver" stroke="#999" fontSize={9} width={135} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toFixed(2), tt('Impact')]} />
                  <Bar dataKey="impact" name={tt('NPS impact weight')} radius={[0, 4, 4, 0]}>
                    {NPS_DRIVERS.map((d, i) => <Cell key={i} fill={d.currentScore < 62 ? RED : d.currentScore < 70 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Red = score below benchmark. Billing clarity and issue resolution have high impact but low scores — priority fix.')}
            </div>
          </Panel>

          <Panel title={tt('NPS trend — promoters, detractors, passives (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={NPS_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="promoters"   stroke={GREEN}  fill={GREEN}  fillOpacity={0.2} name={tt('Promoters %')}  />
                  <Area type="monotone" dataKey="passives"    stroke={SLATE}  fill={SLATE}  fillOpacity={0.15} name={tt('Passives %')} />
                  <Area type="monotone" dataKey="detractors"  stroke={RED}    fill={RED}    fillOpacity={0.15} name={tt('Detractors %')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('NPS driver scorecard — importance, score & gap to benchmark')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Driver')}</th>
                  <th className="px-3 py-2">{tt('Category')}</th>
                  <th className="px-3 py-2 text-right">{tt('Impact wt.')}</th>
                  <th className="px-3 py-2 text-right">{tt('Score / 100')}</th>
                  <th className="px-3 py-2 text-right">{tt('Gap pp')}</th>
                </tr>
              </thead>
              <tbody>
                {NPS_DRIVERS.map(d => (
                  <tr key={d.driver} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(d.driver)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(d.category)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{d.impact.toFixed(2)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${d.currentScore >= 72 ? 'text-emerald-600' : d.currentScore >= 62 ? 'text-amber-600' : 'text-red-600'}`}>{d.currentScore}</td>
                    <td className={`px-3 py-2 text-right font-mono ${d.gap > 8 ? 'text-red-600 font-bold' : d.gap > 3 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.gap > 0 ? `−${d.gap}` : '✓'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/experience"      className="font-semibold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
          </div>
        </Panel>

        <Panel title={tt('Survey response rate & NPS — 6-month trend')}>
          <div className="h-56">
            <ResponsiveContainer>
              <ComposedChart data={SURVEY_TREND}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={11} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="%" />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[0, 50]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar  yAxisId="r" dataKey="nps"        name={tt('NPS score')}      fill={BLUE}  />
                <Line yAxisId="l" type="monotone" dataKey="response"   name={tt('Response rate %')} stroke={GREEN} strokeWidth={2} dot />
                <Line yAxisId="l" type="monotone" dataKey="completion" name={tt('Completion %')}    stroke={AMBER} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/experience"    className="font-semibold text-vfes-dark hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/marketing"     className="font-semibold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CHANNEL FEEDBACK ══════════════════════════════════════ */}
      {tab === 'channels' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total daily vol')} value={totalVol.toLocaleString('en-BS')} delta={tt('6 channels')}        trend="flat" icon={MessageSquareText} accent />
          <KpiCard label={tt('Chat deflection')} value="58%"                               delta={tt('Cortex assist')}     trend="up"   icon={Sparkles}          />
          <KpiCard label={tt('Best NPS channel')}value={tt('Chat / WA')}                   delta={tt('NPS +32')}          trend="up"   icon={Star}              />
          <KpiCard label={tt('Worst NPS ch.')}   value={tt('Social / X')}                  delta={tt('NPS +14 only')}     trend="down" icon={TrendingDown}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Channel volume — daily mentions')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CHANNELS} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="ch" stroke="#999" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="vol" radius={[0, 4, 4, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.autoResolved > 0 ? GREEN : NAVY} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('NPS by channel')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CHANNELS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="ch" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} domain={[0, 45]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`+${v}`, tt('NPS')]} />
                  <Bar dataKey="nps" name={tt('NPS')} radius={[4, 4, 0, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.nps >= 30 ? GREEN : c.nps >= 24 ? BLUE : AMBER} />)}
                  </Bar>
                  <ReferenceLine y={28} stroke={GREEN} strokeDasharray="3 3"
                    label={{ value: tt('Target 28'), position: 'right', fontSize: 10, fill: GREEN }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Channel sentiment — avg score comparison')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CHANNELS} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[-0.5, 0.1]} />
                  <YAxis type="category" dataKey="ch" stroke="#999" fontSize={9} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toFixed(2), tt('Avg sentiment')]} />
                  <ReferenceLine x={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Bar dataKey="avgSent" name={tt('Avg sentiment')} radius={[0, 4, 4, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.avgSent > -0.15 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Social/X most negative (−0.38) — brand monitoring and rapid response needed.')}
            </div>
          </Panel>

          <Panel title={tt('Auto-resolution rate — Cortex-enabled channels')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={CHANNELS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="ch" stroke="#999" fontSize={9} />
                  <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 70]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Auto-resolved')]} />
                  <Bar dataKey="autoResolved" name={tt('Auto-resolved %')} radius={[4, 4, 0, 0]}>
                    {CHANNELS.map((c, i) => <Cell key={i} fill={c.autoResolved >= 50 ? GREEN : c.autoResolved > 0 ? BLUE : SLATE} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={GREEN} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {tt('Chat/WA at 58% auto-resolution — email at 34%. Voice and social: zero today, target 20% by Q4.')}
            </div>
          </Panel>
        </div>

        <Panel title={tt('Channel scorecard — volume, auto-resolution, sentiment & NPS')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Channel')}</th>
                  <th className="px-3 py-2 text-right">{tt('Vol/day')}</th>
                  <th className="px-3 py-2 text-right">{tt('Auto-resolved')}</th>
                  <th className="px-3 py-2 text-right">{tt('Avg sentiment')}</th>
                  <th className="px-3 py-2 text-right">{tt('NPS')}</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map(c => (
                  <tr key={c.ch} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold">{tt(c.ch)}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.vol.toLocaleString('en-BS')}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.autoResolved > 0 ? 'text-emerald-600' : 'text-vfes-dark/40'}`}>{c.autoResolved > 0 ? `${c.autoResolved}%` : '—'}</td>
                    <td className={`px-3 py-2 text-right font-mono ${c.avgSent > -0.15 ? 'text-amber-600' : 'text-red-600 font-bold'}`}>{c.avgSent.toFixed(2)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.nps >= 30 ? 'text-emerald-600' : c.nps >= 24 ? 'text-blue-600' : 'text-amber-600'}`}>+{c.nps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/contact-center" className="font-semibold text-vfes-dark hover:underline">{tt('Contact Center →')}</Link>
            <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ VERBATIMS ══════════════════════════════════════════════ */}
      {tab === 'verbatims' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Verbatims/day')} value="1,240"    delta={tt('sampled by Cortex')} trend="flat" icon={MessageSquareText} accent />
          <KpiCard label={tt('Neg verbatims')} value="62%"      delta={tt('billing+network')}   trend="down" icon={ThumbsDown}         />
          <KpiCard label={tt('Pos verbatims')} value="18%"      delta={tt('praise+plan')}       trend="up"   icon={ThumbsUp}           />
          <KpiCard label={tt('Escalated')}     value="142"      delta={tt('auto-routed')}        trend="flat" icon={AlertTriangle}      />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'neg', 'pos'] as const).map(f => (
            <button key={f} onClick={() => setVerbatimFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${verbatimFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {f === 'all' ? tt('All') : f === 'neg' ? tt('Negative') : tt('Positive')}
            </button>
          ))}
        </div>

        <Panel title={tt('Sample verbatims — Cortex AI_CLASSIFY + AI_SENTIMENT tagged')}>
          <div className="space-y-3 mt-1">
            {filteredVerbatims.map((q, i) => (
              <div key={i} className="flex items-start gap-3 text-sm border-b border-black/5 pb-3">
                {q.sent === 'pos'
                  ? <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  : <ThumbsDown className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="text-vfes-dark/80 italic">{tt(q.txt)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${q.sent === 'pos' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{tt(q.topic)}</span>
                    <span className="text-[10px] text-vfes-dark/45 bg-[#f0f4f8] px-1.5 py-0.5 rounded">{tt(q.channel)}</span>
                    <span className={`text-[10px] font-bold font-mono ${q.score > 0 ? 'text-emerald-600' : q.score < -0.5 ? 'text-red-600' : 'text-amber-600'}`}>{q.score > 0 ? '+' : ''}{q.score.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {tt('AI_CLASSIFY tags topic; AI_SENTIMENT scores tone; high-risk routes to retention.')}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link to="/portal/agents"        className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Agents →')}</Link>
            <Link to="/portal/cortex-search" className="font-semibold text-vfes-dark hover:underline">{tt('Cortex Search →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CLOSED-LOOP ════════════════════════════════════════════ */}
      {tab === 'closedloop' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Actions in flight')} value="5"     delta={tt('Cortex-triggered')} trend="flat" icon={RefreshCw}  accent />
          <KpiCard label={tt('Tickets addressed')} value="996"   delta={tt('across 5 actions')} trend="up"   icon={Activity}   />
          <KpiCard label={tt('Detractor save rt')} value="33%"   delta={tt('of contacted')}     trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Expected NPS lift')} value="+4 pp" delta={tt('from batch')}        trend="up"   icon={Star}       />
        </div>

        <Panel title={tt('Closed-loop action tracker — Cortex-generated fix queue')}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
            {(['tickets', 'eta'] as const).map(k => (
              <button key={k} onClick={() => setLoopSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${loopSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'tickets' ? tt('Tickets') : tt('ETA')}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Action')}</th>
                  <th className="px-3 py-2">{tt('Owner')}</th>
                  <th className="px-3 py-2 text-right">{tt('Tickets')}</th>
                  <th className="px-3 py-2">{tt('ETA')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Expected impact')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedLoop.map(c => (
                  <tr key={c.action} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(c.action)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(c.owner)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold">{c.tickets}</td>
                    <td className="px-3 py-2 text-xs font-mono">{c.eta}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'Live' ? 'bg-emerald-100 text-emerald-700' : c.status === 'In progress' ? 'bg-blue-100 text-blue-700' : c.status === 'In review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {tt(c.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-emerald-700 font-semibold">{tt(c.expected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/field-ops"       className="font-semibold text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Detractor journey funnel — monthly cohort')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={DETRACTOR_JOURNEY} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="stage" stroke="#999" fontSize={9} width={130} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Completion')]} />
                  <Bar dataKey="pct" name={tt('Completion %')} radius={[0, 4, 4, 0]}>
                    {DETRACTOR_JOURNEY.map((d, i) => <Cell key={i} fill={d.pct >= 80 ? GREEN : d.pct >= 40 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('63% contacted, 33% saved — improving the "offer made" step from 49% → 60% is the highest-ROI intervention.')}
            </div>
          </Panel>

          <Panel title={tt('Closed-loop NPS trend')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={NPS_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[10, 45]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="nps" stroke={GREEN} strokeWidth={2.4} dot name={tt('NPS score')} />
                  <ReferenceLine y={30} stroke={SLATE} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('NPS rising consistently since closed-loop programme launched in Q1 — +8 pp in 6 months.')}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ THEME TRENDS ═══════════════════════════════════════════ */}
      {tab === 'themes' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Billing trend')}    value="+9.5%"  delta={tt('4 weeks')}         trend="down" icon={TrendingUp}   accent />
          <KpiCard label={tt('Network trend')}    value="+30%"   delta={tt('outage impact')}   trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Roaming trend')}    value="−9.2%"  delta={tt('summer promo')}   trend="up"   icon={TrendingDown}  />
          <KpiCard label={tt('Cancellation')}     value="+19%"   delta={tt('correlates NPS')} trend="down" icon={TrendingUp}    />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Weekly theme volume trend — key drivers')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={THEME_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="w" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="billing"       stroke={RED}    fill={RED}    fillOpacity={0.15} name={tt('Billing')}      />
                  <Area type="monotone" dataKey="network"       stroke={AMBER}  fill={AMBER}  fillOpacity={0.2}  name={tt('Network')}      />
                  <Area type="monotone" dataKey="roaming"       stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} name={tt('Roaming')}      />
                  <Area type="monotone" dataKey="cancellation"  stroke={PURPLE} fill={PURPLE} fillOpacity={0.2}  name={tt('Cancellation')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Topic volume vs sentiment — bubble chart')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="vol"       stroke="#999" fontSize={11} name={tt('Volume')} label={{ value: tt('Volume'), position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis type="number" dataKey="sentiment" stroke="#999" fontSize={11} name={tt('Sentiment')} domain={[-0.8, 0.9]} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-white border border-black/10 rounded-lg p-2 text-xs shadow">
                          <div className="font-bold">{d.name}</div>
                          <div>{tt('Volume')}: {d.vol}</div>
                          <div>{tt('Sentiment')}: {Number(d.sentiment).toFixed(2)}</div>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={0} stroke={SLATE} strokeDasharray="2 2" />
                  <Scatter data={TOPIC_SCATTER} fill={BLUE}>
                    {TOPIC_SCATTER.map((d, i) => <Cell key={i} fill={d.sentiment < -0.4 ? RED : d.sentiment < 0 ? AMBER : GREEN} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Top-left = high-volume negative: priority targets. Cancellation intent bottom-left: extreme sentiment despite lower volume.')}
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-[#222128] mb-1">{tt('VoC → action pipeline')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Cortex reads every feedback mention, classifies the theme, scores sentiment and files a fix task — automatically.')}
            </div>
          </div>
          <Link to="/portal/ai-insights"
            className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4" /> {tt('Open AI Insights →')}
          </Link>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/45 mb-3">{tt('Related domains')}</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/portal/contact-center"  className="font-semibold text-[#222128] hover:underline">{tt('Contact Center →')}</Link>
            <Link to="/portal/churn-retention" className="font-semibold text-[#F59E0B] hover:underline">{tt('Churn & Retention →')}</Link>
            <Link to="/portal/experience"      className="font-semibold text-[#7C3AED] hover:underline">{tt('Experience →')}</Link>
            <Link to="/portal/network"         className="font-semibold text-[#10B981] hover:underline">{tt('Network →')}</Link>
            <Link to="/portal/sales"           className="font-semibold text-[#11567F] hover:underline">{tt('Sales →')}</Link>
            <Link to="/portal/agents"          className="font-semibold text-[#94a3b8] hover:underline">{tt('Cortex Agents →')}</Link>
          </div>
        </div>
      </>)}

      <AskTheData />
    </div>
  )
}
