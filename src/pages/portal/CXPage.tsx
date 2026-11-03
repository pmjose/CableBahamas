import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Headphones, Phone, MessageCircle, Bot, Star, Clock, Sparkles, AlertTriangle,
  TrendingUp, ShieldCheck, GitBranch, ArrowUpRight, Users, Zap, Heart, Send,
  Wrench, Truck, Home, CreditCard, UserPlus, X, RotateCcw, Target,
  ThumbsUp, ThumbsDown, FileText, MessageSquare, Activity, Award, Smartphone,
  Network, Bell, TrendingDown,
} from 'lucide-react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, AreaChart, Area, ComposedChart, ReferenceLine, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { CX_BY_NETWORK } from './_mobile_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ============================== DATA ============================== //

const csatTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'][i],
  csat: 80 + Math.round(Math.sin(i / 2) * 4 + i / 3),
  nps: 30 + Math.round(Math.sin(i / 2) * 5 + i / 2),
  ces: 4.2 + +(Math.sin(i / 3) * 0.3 - i / 60).toFixed(2),
  forecast: i >= 10 ? 86 + i / 2 : null,
}))

// ----- Journeys -----
const journeys = [
  { id: 'onboard',  name: 'Onboarding',         icon: UserPlus,    csat: 78, ces: 4.8, completion: 73, cost: 28, vol: 14200, churn: 8.4 },
  { id: 'billing',  name: 'Billing & payments', icon: CreditCard,  csat: 72, ces: 5.4, completion: 84, cost: 12, vol: 38400, churn: 4.2 },
  { id: 'fault',    name: 'Fault / Tech Sup.',  icon: Wrench,      csat: 81, ces: 5.1, completion: 79, cost: 22, vol: 24600, churn: 6.8 },
  { id: 'move',     name: 'Move home',          icon: Home,        csat: 84, ces: 4.4, completion: 91, cost: 18, vol:  4800, churn: 3.1 },
  { id: 'cancel',   name: 'Cancellation intent',icon: X,           csat: 68, ces: 5.8, completion: 62, cost: 14, vol: 12200, churn: 0,  saveRate: 38 },
  { id: 'winback',  name: 'Win-back',           icon: RotateCcw,   csat: 82, ces: 4.2, completion: 28, cost: 16, vol:  4600, churn: 0 },
]

const journeyDetails: Record<string, { stages: { stage: string; n: number; pain?: string }[] }> = {
  onboard: { stages: [
    { stage: 'Order placed',           n: 14200 },
    { stage: 'Activation pack sent',   n: 13680 },
    { stage: 'Engineer scheduled',     n: 12940 },
    { stage: 'Install complete',       n: 11200, pain: '−13% — install delays in Freeport/Abaco' },
    { stage: 'First-bill explained',   n:  9840, pain: '−12% — bill shock complaints' },
    { stage: 'Day-90 active',          n:  9020 },
  ]},
  billing: { stages: [
    { stage: 'Bill issued',            n: 38400 },
    { stage: 'Self-service viewed',    n: 24800 },
    { stage: 'Dispute raised',         n:  4280, pain: 'Top driver: promo expiry shock' },
    { stage: 'Resolved < 48h',         n:  3120 },
    { stage: 'Repeat contact 14d',     n:   620, pain: '−19.8% repeat rate' },
  ]},
  fault: { stages: [
    { stage: 'Fault reported',         n: 24600 },
    { stage: 'Self-test run',          n: 18400 },
    { stage: 'Bot resolved',           n:  6240 },
    { stage: 'Engineer dispatched',    n:  9800 },
    { stage: 'Truck-roll fix',         n:  8120, pain: '12% need 2nd truck-roll' },
    { stage: 'Closed FCR',             n:  6480 },
  ]},
  move: { stages: [
    { stage: 'Move requested',         n: 4800 },
    { stage: 'New address service-able',n: 4280 },
    { stage: 'Engineer scheduled',     n: 4100 },
    { stage: 'Install complete',       n: 3960 },
    { stage: 'Active at new address',  n: 3920 },
  ]},
  cancel: { stages: [
    { stage: 'Intent detected',        n: 12200 },
    { stage: 'Reached retention agent',n:  9400 },
    { stage: 'Save offer presented',   n:  7800 },
    { stage: 'Retained',               n:  4640, pain: '38% save rate · target 45%' },
  ]},
  winback: { stages: [
    { stage: 'Lapsed-12mo contacted',  n: 4600 },
    { stage: 'Engaged',                n: 1840 },
    { stage: 'Offer accepted',         n:  680 },
    { stage: 'Re-activated',           n:  520 },
  ]},
}

// ----- Voice of Customer (Cortex topic clusters) -----
const vocTopics = [
  { topic: 'Promo expiry / bill shock',     vol: 1820, sentiment: -0.62, deltaWoW:  +18, status: 'EMERGING' },
  { topic: 'Slow speeds — peak hour',       vol: 1240, sentiment: -0.48, deltaWoW:   +4, status: 'STABLE' },
  { topic: 'Install delay Freeport/Abaco',     vol:  680, sentiment: -0.71, deltaWoW:  +42, status: 'EMERGING' },
  { topic: 'TV box reboot loop',            vol:  420, sentiment: -0.54, deltaWoW: +124, status: 'CRITICAL' },
  { topic: 'Mobile coverage rural',         vol:  380, sentiment: -0.32, deltaWoW:   -2, status: 'STABLE' },
  { topic: 'Engineer no-show',              vol:  342, sentiment: -0.78, deltaWoW:  +16, status: 'EMERGING' },
  { topic: 'IVR loop / cant reach agent',   vol:  280, sentiment: -0.81, deltaWoW:   +8, status: 'STABLE' },
  { topic: 'Compliments — engineer Thomas',  vol:   80, sentiment: +0.92, deltaWoW:   +0, status: 'POSITIVE' },
]

const social = [
  { src: 'Trustpilot',          score: 3.4, n: 14820, deltaWoW: -0.1, color: '#10b981' },
  { src: 'Google Reviews',      score: 3.8, n:  4280, deltaWoW: +0.0, color: '#3b82f6' },
  { src: 'Reddit r/bahamas',    score: 2.6, n:   428, deltaWoW: -0.2, color: '#dc2626' },
  { src: 'Twitter / X',         score: 2.9, n:  1240, deltaWoW: +0.1, color: '#f59e0b' },
  { src: 'URCA complaints',   score: 0,   n:    62, deltaWoW: +12,  color: '#dc2626' },
]

// URCA complaints lifecycle
const comreg = [
  { stage: 'Open',                     n: 62, color: '#1e293b' },
  { stage: 'Awaiting customer',        n: 18, color: '#475569' },
  { stage: 'Awaiting our response',    n: 28, color: '#f59e0b' },
  { stage: 'Breach risk (>10wd)',      n:  8, color: '#dc2626' },
  { stage: 'Closed satisfied (last Q)',n:142, color: '#10b981' },
]

// ----- Operations -----
const channels = [
  { ch: 'Voice',         vol: 12450, aht: '6m 12s', csat: 87, costPer: 8.20, color: '#FF4438' },
  { ch: 'Chat (agent)',  vol:  8920, aht: '4m 48s', csat: 91, costPer: 2.40, color: '#f87171' },
  { ch: 'WhatsApp',      vol:  3140, aht: '5m 22s', csat: 89, costPer: 2.80, color: '#fb7185' },
  { ch: 'Email',         vol:  1880, aht: '12h',    csat: 78, costPer: 4.20, color: '#f59e0b' },
  { ch: 'Bot (Cortex)',  vol: 14600, aht: '1m 14s', csat: 72, costPer: 0.18, color: '#10b981' },
  { ch: 'Self-service',  vol: 21340, aht: '—',      csat: 84, costPer: 0.04, color: '#10b981' },
]

const slaIntraday = Array.from({ length: 24 }, (_, i) => ({
  h: `${i.toString().padStart(2,'0')}`,
  sla: 78 + Math.round(Math.sin(i / 3) * 8 - (i === 14 ? 22 : 0) - (i === 19 ? 14 : 0)),
  abandon: 3 + Math.round(Math.sin(i / 3) * 1.5 + (i === 14 ? 6 : 0)),
  queue: 10 + Math.round(Math.sin(i / 3) * 4 + (i === 14 ? 28 : 0)),
}))

const agents = [
  { name: 'Emma Rolle',   team: 'Retention',  calls: 124, csat: 96, fcr: 88, aht: '5m 48s', repeat: 4,  qa: 94, coach: false },
  { name: 'Thomas Bethel',   team: 'Tech',       calls: 142, csat: 92, fcr: 81, aht: '6m 22s', repeat: 8,  qa: 88, coach: false },
  { name: 'Sofie Bain',   team: 'Billing',    calls:  98, csat: 94, fcr: 85, aht: '5m 12s', repeat: 5,  qa: 91, coach: false },
  { name: 'Lars Knowles', team: 'Sales',      calls:  86, csat: 89, fcr: 76, aht: '8m 04s', repeat: 12, qa: 78, coach: true  },
  { name: 'Lore Adderley',  team: 'Tech',       calls: 132, csat: 91, fcr: 84, aht: '6m 02s', repeat: 7,  qa: 86, coach: false },
  { name: 'Jonas Willems', team: 'Billing',    calls: 102, csat: 74, fcr: 62, aht: '9m 18s', repeat: 22, qa: 64, coach: true  },
  { name: 'Femke Ferguson', team: 'Retention',  calls: 118, csat: 95, fcr: 86, aht: '6m 04s', repeat: 5,  qa: 92, coach: false },
]

const teamRollup = [
  { team: 'Retention',  csat: 95, fcr: 87, aht: 5.9, attrition:  6 },
  { team: 'Tech',       csat: 91, fcr: 82, aht: 6.2, attrition: 12 },
  { team: 'Billing',    csat: 78, fcr: 72, aht: 7.4, attrition: 22, alert: true },
  { team: 'Sales',      csat: 88, fcr: 76, aht: 7.8, attrition: 14 },
]

// Bot containment reality-check
const botTurns = [
  { turns: '1',  contained: 1820, escalated:  240 },
  { turns: '2',  contained: 1680, escalated:  420 },
  { turns: '3',  contained:  920, escalated:  680 },
  { turns: '4',  contained:  420, escalated:  840 },
  { turns: '5+', contained:  140, escalated: 1240 },
]
const botBreakdown = {
  totalSessions: 14600,
  containedCsatHigh: 8420,    // contained & csat ≥ 4
  containedCsatLow: 2180,     // contained but csat < 4
  containedRepeat7d: 1240,    // contained but came back in 7d
  escalated: 2760,
}

// AI-assist (Cortex) for agents
const aiAssist = [
  { feature: 'Live call summarisation',   adoption: 84, timeSaved: 18, accept: 92 },
  { feature: 'Suggested reply (chat)',    adoption: 76, timeSaved: 14, accept: 68 },
  { feature: 'Post-call wrap-up auto',    adoption: 92, timeSaved: 24, accept: 96 },
  { feature: 'KB semantic search',        adoption: 88, timeSaved:  8, accept: 81 },
  { feature: 'Sentiment / coaching flag', adoption: 64, timeSaved:  0, accept: 0 },
]

// ----- Closed loop / churn-attributed -----
const detractorRecovery = [
  { stage: 'Detractor (NPS 0–6)',             n: 1820, color: '#dc2626' },
  { stage: 'Contacted < 48h',                 n: 1240, color: '#f59e0b' },
  { stage: 'Issue resolved',                  n:  820, color: '#3b82f6' },
  { stage: 'Promoted to Passive',             n:  420, color: '#10b981' },
  { stage: 'Promoted to Promoter',            n:  180, color: '#10b981' },
]

// CX → cancellation funnel
const cxToCancel = [
  { contactReason: 'Bill dispute',         contacts: 4280, cancelledIn30d: 142, rate: 3.3 },
  { contactReason: 'Slow speeds',          contacts: 1240, cancelledIn30d:  98, rate: 7.9 },
  { contactReason: 'Install delay',        contacts:  680, cancelledIn30d:  62, rate: 9.1 },
  { contactReason: 'Engineer no-show',     contacts:  342, cancelledIn30d:  48, rate: 14.0 },
  { contactReason: 'TV box error',         contacts:  420, cancelledIn30d:  18, rate: 4.3 },
  { contactReason: 'Mobile coverage',      contacts:  380, cancelledIn30d:  22, rate: 5.8 },
]

// Vulnerable customers
const vulnerable = {
  registered: 18400,
  prsRepairs:  2400,        // priority service register repairs
  slaMet:      94,
  accessibility: { signLanguage: 142, easyRead: 480, voiceOnly: 1240 },
  complaintsThisMonth: 14,
}

// ----- Field ops / Network → CX correlation -----
const networkCxCorr = [
  { day: 'Mon', outage: 0,  csat: 87 },
  { day: 'Tue', outage: 1,  csat: 86 },
  { day: 'Wed', outage: 4,  csat: 78 },
  { day: 'Thu', outage: 8,  csat: 64 },
  { day: 'Fri', outage: 2,  csat: 82 },
  { day: 'Sat', outage: 0,  csat: 88 },
  { day: 'Sun', outage: 0,  csat: 89 },
]

// ----- Action queue -----
const actionQueue = [
  { type: 'Callback',  priority: 'P0', title: '50 detractors with high CLV — 48h SLA',     impact: 'BSD 280K LTV save',       why: '38 NPS≤6 last 7d · CLV>BSD 2K', play: 'Retention agent callback', owner: 'Retention',      cta: 'Push list' },
  { type: 'Fix',       priority: 'P0', title: 'TV box reboot loop — emerging issue',       impact: 'BSD 420K complaint cost', why: '+124% WoW · −0.54 sentiment', play: 'Firmware rollback + KB update', owner: 'Tech / Eng',     cta: 'Open incident' },
  { type: 'Coach',     priority: 'P1', title: 'Jonas Willems — QA 64, repeat 22%',         impact: '+8pp team CSAT',       why: 'AHT outlier · repeat rate 4× peers', play: 'Schedule 1-on-1 with team lead', owner: 'Ops',            cta: 'Schedule' },
  { type: 'KB',        priority: 'P1', title: 'Promo expiry article missing',              impact: '−1.8K calls/mo',       why: '1.8K bill-shock contacts · top topic', play: 'Auto-draft KB article via Cortex', owner: 'Knowledge Mgmt', cta: 'Draft article' },
  { type: 'IVR',       priority: 'P1', title: 'IVR loop — 280 complaints WoW',             impact: '+4pp CSAT',            why: 'Customers cant reach agent on TV path', play: 'Add agent escape after 2 failed selections', owner: 'IVR',            cta: 'Update routing' },
  { type: 'Comply',    priority: 'P0', title: '8 URCA complaints near 10wd breach',      impact: 'Regulatory risk',      why: 'Statutory 10wd response window · day 8-9', play: 'Escalate to senior complaints handler', owner: 'Regulatory',     cta: 'Escalate' },
  { type: 'Recover',   priority: 'P2', title: 'Freeport install backlog — 240 customers',      impact: 'BSD 84K save',            why: 'Onboarding journey −13% drop · CSAT 64',  play: 'Goodwill credit + priority slot', owner: 'Field Ops',      cta: 'Apply credit' },
  { type: 'Promote',   priority: 'P2', title: 'Engineer Thomas — 92% positive sentiment',   impact: 'Brand asset',          why: 'Top promoter mentions · 80 compliments', play: 'Recognition + share to social', owner: 'People',         cta: 'Recognise' },
]

// ── Network CX trend by product segment ─────────────────────────────────────
const networkNpsTrend = [
  { m: 'Jan', mobile: 35, ftth: 42, hfc: 26, conv: 48 },
  { m: 'Feb', mobile: 36, ftth: 43, hfc: 27, conv: 49 },
  { m: 'Mar', mobile: 37, ftth: 44, hfc: 27, conv: 50 },
  { m: 'Apr', mobile: 37, ftth: 45, hfc: 28, conv: 51 },
  { m: 'May', mobile: 38, ftth: 46, hfc: 29, conv: 52 },
  { m: 'Jun', mobile: 38, ftth: 46, hfc: 30, conv: 52 },
]

const contactRateTrend = [
  { m: 'Jan', mobile: 8.4, ftth: 6.2, hfc: 11.8, conv: 5.8 },
  { m: 'Feb', mobile: 8.2, ftth: 6.0, hfc: 11.4, conv: 5.6 },
  { m: 'Mar', mobile: 8.0, ftth: 5.8, hfc: 11.2, conv: 5.4 },
  { m: 'Apr', mobile: 7.9, ftth: 5.7, hfc: 11.0, conv: 5.2 },
  { m: 'May', mobile: 7.8, ftth: 5.6, hfc: 10.8, conv: 5.1 },
  { m: 'Jun', mobile: 7.8, ftth: 5.5, hfc: 10.6, conv: 5.0 },
]

const nxCsatPie = [
  { name: 'FTTH',        value: 46, color: '#FF4438' },
  { name: 'Mobile',      value: 38, color: '#11567F' },
  { name: 'Convergent',  value: 52, color: '#10B981' },
  { name: 'HFC',         value: 30, color: '#F59E0B' },
]

// ── Complaints data ───────────────────────────────────────────────────────────
const complaintsTrend = [
  { m: 'Jan', cnmc: 48, internal: 384, repeat: 62 },
  { m: 'Feb', cnmc: 52, internal: 396, repeat: 58 },
  { m: 'Mar', cnmc: 44, internal: 372, repeat: 54 },
  { m: 'Apr', cnmc: 56, internal: 408, repeat: 60 },
  { m: 'May', cnmc: 58, internal: 420, repeat: 64 },
  { m: 'Jun', cnmc: 62, internal: 432, repeat: 66 },
]

const complaintsRegister = [
  { ref: 'CX-2026-0841', topic: 'Bill dispute — promo expiry',    channel: 'URCA',     status: 'Open',      age: 9,  owner: 'Billing',   risk: 'High' },
  { ref: 'CX-2026-0838', topic: 'Install delay >30d',             channel: 'URCA',     status: 'Open',      age: 8,  owner: 'Field Ops', risk: 'High' },
  { ref: 'CX-2026-0829', topic: 'Speed below contract',           channel: 'URCA',     status: 'Pending',   age: 6,  owner: 'Tech',      risk: 'Med'  },
  { ref: 'CX-2026-0814', topic: 'IVR — unable to reach agent',    channel: 'Internal', status: 'Open',      age: 4,  owner: 'IVR',       risk: 'Low'  },
  { ref: 'CX-2026-0809', topic: 'TV box firmware loop',           channel: 'Internal', status: 'Escalated', age: 3,  owner: 'Tech',      risk: 'High' },
  { ref: 'CX-2026-0798', topic: 'Engineer no-show',               channel: 'Internal', status: 'Resolved',  age: 7,  owner: 'Field Ops', risk: 'Med'  },
  { ref: 'CX-2026-0788', topic: 'Incorrect charge on bill',       channel: 'Social',   status: 'Open',      age: 2,  owner: 'Billing',   risk: 'Low'  },
  { ref: 'CX-2026-0762', topic: 'Coverage complaint rural',       channel: 'Internal', status: 'Closed',    age: 12, owner: 'Network',   risk: 'Low'  },
]

const complaintsByTeam = [
  { team: 'Billing',   n: 142, color: '#FF4438' },
  { team: 'Tech Sup.', n: 98,  color: '#11567F' },
  { team: 'Field Ops', n: 76,  color: '#F59E0B' },
  { team: 'IVR/Self',  n: 64,  color: '#7C3AED' },
  { team: 'Other',     n: 48,  color: '#94a3b8' },
]

// ============================== HELPERS ============================== //

const fmtK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toLocaleString()

// ============================== PAGE ============================== //

const tabs = [
  { id: 'overview',    label: 'Overview',           icon: Activity     },
  { id: 'journeys',    label: 'Journeys',           icon: Heart        },
  { id: 'voice',       label: 'Voice & Reputation', icon: MessageSquare},
  { id: 'ops',         label: 'Operations',         icon: Headphones   },
  { id: 'loop',        label: 'Closed Loop',        icon: RotateCcw    },
  { id: 'actions',     label: 'Actions',            icon: Sparkles     },
  { id: 'network',     label: 'Network CX',         icon: Network      },
  { id: 'complaints',  label: 'Complaints',         icon: FileText     },
] as const
type TabId = typeof tabs[number]['id']

export default function CXPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [journey, setJourney] = useState<string>('onboard')
  const [pushed, setPushed] = useState<string[]>([])
  const [liveTime, setLiveTime] = useState<string>('')
  const [complaintFilter, setComplaintFilter] = useState<string>('All')
  const [nxSegment, setNxSegment] = useState<string>('All')
  const [alertVisible, setAlertVisible] = useState(true)
  const [npsSortKey, setNpsSortKey] = useState<'nps' | 'csat'>('nps')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const dismissAlert = useCallback(() => setAlertVisible(false), [])

  // ---------------- KPI rollups ----------------
  const totalContacts = useMemo(() => channels.reduce((s, c) => s + c.vol, 0), [])
  const totalCost = useMemo(() => channels.reduce((s, c) => s + c.vol * c.costPer, 0), [])
  const blendedCost = totalCost / totalContacts
  const contactDeflectionSave = useMemo(() => (channels.find((c) => c.ch === 'Bot (Cortex)')!.vol + channels.find((c) => c.ch === 'Self-service')!.vol) * (8.20 - 0.18), [])
  const churnFromCx = useMemo(() => cxToCancel.reduce((s, r) => s + r.cancelledIn30d, 0), [])

  const filteredComplaints = useMemo(
    () => complaintFilter === 'All' ? complaintsRegister : complaintsRegister.filter(c => c.channel === complaintFilter || c.status === complaintFilter),
    [complaintFilter],
  )

  const sortedNxData = useMemo(
    () => [...networkNpsTrend].map(d => d),
    [nxSegment],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Customer Experience')}
        subtitle={tt('End-to-end CX · Cortex VoC mining · URCA & vulnerable customers · contact-centre ops')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" /> {tt('Live · Genesys + Cortex feed')} {liveTime}
            </span>
          </div>
        }
      />

      <a href="#/portal/mnp" className="flex items-center gap-2 mb-6 text-xs font-bold text-vfes-dark bg-vfes-red/5 border border-vfes-red/20 rounded-lg px-3 py-2 w-fit hover:bg-vfes-red/10">
        {tt('Detractors at churn risk → open MNP Save Desk for next-best retention offer')} →
      </a>

      {/* ── ML Insight Section ─────────────────────────────────────────────── */}
      <MlInsightSection
        heading={tt('Customer experience intelligence')}
        models={[
          { name: tt('Churn-intent classifier'), metric: 'AUC 0.88', sub: tt('XGBoost · real-time scoring') },
          { name: tt('VoC topic model'), metric: 'F1 0.84', sub: tt('Cortex Complete · llama3.1-70b') },
          { name: tt('CES predictor'), metric: 'RMSE 0.31', sub: tt('Gradient-boost · post-contact') },
        ]}
        agentLabel={tt('Run CX Intelligence Agent')}
        agentRunningLabel={tt('Clustering…')}
        agentSteps={[
          tt('Clustered contacts across all channels into 8 root causes'),
          tt('Scored 14,600 bot sessions for true containment vs frustrated hangup'),
          tt('Ranked complaint drivers by churn-risk × volume × CLV exposure'),
          tt('Generated recommended action list with owner & SLA assignment'),
        ]}
        agentBlurb={tt('One unified CX lake — contacts, bot logs, NPS surveys, URCA cases — lets a single model see the full customer effort path, so complaint triage is revenue-aware instead of siloed.')}
        decision={{
          title: tt('Fix billing-clarity first — it is the top CX and churn driver'),
          detail: tt('Billing confusion accounts for 1,820 contacts per week, −0.62 sentiment, and a 3.3% cancel rate within 30 days. A proactive bill-explainer pushed on promo expiry reduces contacts and protects NPS.'),
          impact: tt('−contact rate · +NPS · lower bill-shock churn · −BSD 48K/mo cost'),
          risk: tt('Needs billing-system data join for accuracy — validate before scaling'),
          linkTo: '#/portal/contact-center',
          linkLabel: tt('Open Contact Centre'),
        }}
        chart={{
          kind: 'line',
          title: tt('CSAT / NPS 12-month trajectory with Cortex forecast'),
          xKey: 'm',
          unit: '',
          data: csatTrend,
          series: [
            { key: 'csat',     name: tt('CSAT'),     color: '#FF4438' },
            { key: 'nps',      name: tt('NPS'),      color: '#10B981' },
            { key: 'forecast', name: tt('Forecast'), color: '#FF4438', dashed: true },
          ],
          note: tt('Dashed line = Cortex 4-week forecast · on track for CSAT 88 by end of Q3'),
        }}
      />

      <AgentDecision
        title="Deflect the top complaint driver (Cortex)"
        label="Run CX Deflection Agent" runningLabel="Clustering…"
        steps={[
          'Auto-clustered contacts across all channels',
          'Identified billing-clarity as top driver',
          'Generated self-serve + proactive comms fix',
          'Routed detractors to retention before they churn',
        ]}
        hint="Closes the loop from complaint cluster to fix to retention."
        result={{
          headline: 'Attack billing-clarity complaints — the top CX & churn driver',
          stats: [
            { label: 'CSAT', value: '86%' },
            { label: 'NPS', value: '+38' },
            { label: 'Bot containment', value: '72%' },
            { label: 'Cost / contact', value: 'BSD 2.14' },
          ],
          findings: [
            'Billing confusion is the largest complaint cluster and a leading churn signal.',
            'A proactive bill-explainer deflects contacts and protects NPS.',
            'Route detractors to retention before they churn — close the loop from cluster to fix.',
          ],
          note: 'Needs billing-system data join for accuracy — validate before scaling.',
        }}
        impact="-contact rate · +NPS · lower bill-shock churn"
        risk="needs billing-system data join for accuracy"
        linkTo="#/portal/voc" linkLabel="Open Voice of Customer"
      />

      {/* ── Related cockpits ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
        <span className="font-bold uppercase tracking-widest text-vfes-dark/45 text-[10px]">{tt('Related cockpits:')}</span>
        <Link to="/portal/customer-360"     className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Customer 360')}</Link>
        <Link to="/portal/contact-center"   className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Contact Centre')}</Link>
        <Link to="/portal/voc"              className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Voice of Customer')}</Link>
        <Link to="/portal/churn-retention"  className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Churn & Retention')}</Link>
        <Link to="/portal/marketing"        className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Marketing')}</Link>
        <Link to="/portal/ai-insights"      className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('AI Insights')}</Link>
        <Link to="/portal/operations"       className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Operations')}</Link>
        <Link to="/portal/billing-charging" className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Billing')}</Link>
        <Link to="/portal/field-ops"        className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Field Ops')}</Link>
        <Link to="/portal/network"          className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Network')}</Link>
        <Link to="/portal/base-management"  className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Base Management')}</Link>
        <Link to="/portal/experience"       className="px-3 py-1 rounded-full border border-black/10 font-semibold hover:border-vfes-red/50 hover:text-vfes-dark transition">{tt('Experience')}</Link>
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <>
          {/* Row 1 — Headline KPIs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard label={tt('CSAT')}   value="87"  delta="+3 pts"    trend="up" icon={Star} accent />
            <KpiCard label={tt('NPS')}    value="+38" delta="+4 pts"    trend="up" icon={ThumbsUp} />
            <KpiCard label={tt('Customer Effort Score')} value="4.6" delta="lower = better · −0.3" trend="up" icon={Zap} />
            <KpiCard label={tt('First Contact Resolution')} value="74%" delta="repeat 26% · target <20%" trend="flat" icon={Phone} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Cost-to-serve')}            value={`BSD ${blendedCost.toFixed(2)}`} delta={`Σ BSD ${(totalCost/1000).toFixed(0)}K / day`}     trend="flat" icon={Headphones} />
            <KpiCard label={tt('Deflection saving')}        value={`BSD ${(contactDeflectionSave/1000).toFixed(0)}K`}      delta="vs all-voice baseline / day"        trend="up"   icon={Bot} />
            <KpiCard label={tt('Churn attributed to CX')}   value={`${churnFromCx}`}                                    delta={`${((churnFromCx/totalContacts)*100).toFixed(1)}% of contacts cancel <30d`} trend="down" icon={X} />
            <KpiCard label={tt('URCA complaints')}        value="62"                                                  delta="8 near breach · 10wd SLA"           trend="down" icon={ShieldCheck} />
          </div>

          {/* CX split by network — Fixed FTTH/HFC vs Mobile vs Convergent */}
          <Panel title={tt('CX by network — NPS · CSAT · contact rate')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Convergent leads CX')}</span>}>
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr><th className="py-1.5">{tt('Network')}</th><th>{tt('NPS')}</th><th>{tt('CSAT')}</th><th>{tt('Contact rate')}</th><th>{tt('Top gripe')}</th></tr>
              </thead>
              <tbody>
                {CX_BY_NETWORK.map((n) => (
                  <tr key={n.network} className="border-t border-black/5">
                    <td className="py-2 font-semibold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: n.color }} />{tt(n.network)}</td>
                    <td className={`font-bold ${n.nps >= 45 ? 'text-emerald-600' : n.nps >= 35 ? 'text-vfes-dark' : 'text-amber-600'}`}>+{n.nps}</td>
                    <td className="font-mono text-xs">{n.csat.toFixed(2)}</td>
                    <td className="font-mono text-xs">{n.contactRate.toFixed(1)}%</td>
                    <td className="text-xs text-vfes-dark/65">{tt(n.topGripe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Mobile NPS +38 leads BTC (+32) and Rival ISP A (+31). HFC remains the laggard — prioritise DOCSIS 4.0 cutover or fibre overbuild in HFC pockets.')}</div>
          </Panel>

          {/* Trend with forecast + Top complaint drivers */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Panel title={tt('CSAT / NPS / CES — 12mo with 4-week Cortex forecast')} action={<TrendingUp className="w-4 h-4 text-vfes-dark" />}>
                <div className="h-72">
                  <ResponsiveContainer>
                    <ComposedChart data={csatTrend}>
                      <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                      <XAxis dataKey="m" stroke="#999" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#999" fontSize={11} domain={[20, 95]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} domain={[3.5, 6]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line yAxisId="left" type="monotone" dataKey="csat" stroke="#222128" strokeWidth={2.5} dot />
                      <Line yAxisId="left" type="monotone" dataKey="nps"  stroke="#3b82f6" strokeWidth={2} dot />
                      <Line yAxisId="left" type="monotone" dataKey="forecast" stroke="#222128" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="ces"  stroke="#10b981" strokeWidth={2} dot />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-3 text-[11px] mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vfes-red" />{tt('CSAT (left)')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500" />{tt('NPS (left)')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500" />{tt('CES (right)')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-vfes-red" />{tt('Forecast')}</span>
                </div>
              </Panel>
            </div>

            <Panel title={tt('Top complaint drivers (Cortex auto-clustered)')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
              {vocTopics.slice(0, 6).map((x) => (
                <div key={x.topic} className="py-2 border-b border-black/5 last:border-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-vfes-dark/75 truncate pr-2">{x.topic}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        x.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        x.status === 'EMERGING' ? 'bg-amber-50 text-amber-700' :
                        x.status === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{tt(x.status)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-vfes-dark/55">
                    <span>{x.vol.toLocaleString()}</span>
                    <span>·</span>
                    <span>{x.sentiment > 0 ? '+' : ''}{x.sentiment.toFixed(2)} sent.</span>
                    <span>·</span>
                    <span className={x.deltaWoW > 20 ? 'text-red-600 font-bold' : 'text-vfes-dark/55'}>{x.deltaWoW > 0 ? '+' : ''}{x.deltaWoW}% WoW</span>
                  </div>
                </div>
              ))}
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('SNOWFLAKE.CORTEX.COMPLETE · llama3.1-70b')}</div>
            </Panel>
          </div>

          {/* Network → CX correlation */}
          <Panel title={tt('Network outage → CX correlation (last 7 days)')} action={<Activity className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="h-44">
              <ResponsiveContainer>
                <ComposedChart data={networkCxCorr}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={11} domain={[60, 95]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar yAxisId="left" dataKey="outage" fill="#dc2626" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="csat" stroke="#222128" strokeWidth={2.5} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-vfes-dark/55 mt-2">
              Thursday outage (8 incidents) → CSAT dropped to 64 same-day · <span className="font-bold text-red-600">{tt('−23 pts')}</span> · NOC → CX feed live
            </div>
          </Panel>
        </>
      )}

      {tab === 'journeys' && (
        <>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {journeys.map((j) => {
              const Icon = j.icon
              const active = journey === j.id
              return (
                <button key={j.id} onClick={() => setJourney(j.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    active ? 'bg-vfes-red text-vfes-dark border-vfes-red shadow-lg shadow-vfes-red/25' : 'bg-white border-black/5 hover:border-vfes-red/30'
                  }`}>
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-vfes-dark'}`} />
                    <span className={`text-[9px] font-mono ${active ? 'text-white/80' : 'text-vfes-dark/45'}`}>{(j.vol/1000).toFixed(1)}K</span>
                  </div>
                  <div className={`font-bold text-xs mt-2 ${active ? 'text-white' : ''}`}>{tt(j.name)}</div>
                  <div className={`grid grid-cols-2 gap-1 mt-2 text-[10px] ${active ? 'text-white/85' : 'text-vfes-dark/55'}`}>
                    <span>CSAT <span className="font-bold">{j.csat}</span></span>
                    <span>CES <span className="font-bold">{j.ces}</span></span>
                    <span>Done <span className="font-bold">{j.completion}%</span></span>
                    <span>BSD /cust <span className="font-bold">{j.cost}</span></span>
                  </div>
                </button>
              )
            })}
          </div>

          <Panel title={`Journey detail · ${journeys.find((j) => j.id === journey)?.name}`}>
            <div className="space-y-2">
              {journeyDetails[journey].stages.map((s, i) => {
                const top = journeyDetails[journey].stages[0].n
                const w = (s.n / top) * 100
                const drop = i > 0 ? (1 - s.n / journeyDetails[journey].stages[i-1].n) * 100 : 0
                return (
                  <div key={s.stage} className="grid grid-cols-[180px,1fr,100px] items-center gap-3 text-xs">
                    <span className="font-semibold text-vfes-dark/75 truncate">{s.stage}</span>
                    <div className="relative h-7 bg-black/[0.03] rounded">
                      <div className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-vfes-red-dark to-vfes-red-light flex items-center px-3 text-vfes-dark font-bold text-[11px]" style={{ width: `${Math.max(w, 4)}%` }}>
                        {fmtK(s.n)}
                      </div>
                      {s.pain && (
                        <div className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {s.pain}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{((s.n / top) * 100).toFixed(0)}%</div>
                      {i > 0 && <div className="text-[10px] text-red-600 font-mono">−{drop.toFixed(0)}%</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Panel title={tt('Onboarding NPS — first 90 days')} action={<UserPlus className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Day 1 — install')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700">+52</div>
                </div>
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Day 30 — first bill')}</div>
                  <div className="text-2xl font-extrabold text-amber-600">+18</div>
                  <div className="text-[10px] text-red-600">{tt('−34 bill shock')}</div>
                </div>
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Day 90 — settled')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700">+32</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-vfes-dark/55">Time-to-first-value (engineer install): <span className="font-bold">{tt('5.4 days')}</span>{tt('avg · 89% within 7d')}</div>
            </Panel>

            <Panel title={tt('Cancellation save funnel')} action={<X className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Save rate')}</div>
                  <div className="text-2xl font-extrabold text-amber-600">38%</div>
                  <div className="text-[10px] text-vfes-dark/55">{tt('Target 45%')}</div>
                </div>
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('CLV saved / Q')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{tt('BSD 8.2M')}</div>
                </div>
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Avg save offer')}</div>
                  <div className="text-2xl font-extrabold">BSD 42</div>
                </div>
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Saved → 90d retained')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700">76%</div>
                </div>
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === 'voice' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {social.map((s) => (
              <div key={s.src} className="bg-white p-4 rounded-xl border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold">{s.src}</div>
                <div className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>
                  {s.src === 'URCA complaints' ? s.n : `${s.score} / 5`}
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">
                  {s.src === 'URCA complaints' ? `${s.deltaWoW > 0 ? '+' : ''}${s.deltaWoW} WoW` : `${s.n.toLocaleString()} reviews · ${s.deltaWoW >= 0 ? '+' : ''}${s.deltaWoW.toFixed(1)} WoW`}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Cortex VoC — auto-clustered topics across all channels')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Topic')}</th><th>{tt('Volume')}</th><th>{tt('Sentiment')}</th><th>{tt('Δ WoW')}</th><th>{tt('Status')}</th></tr>
                </thead>
                <tbody>
                  {vocTopics.map((t) => (
                    <tr key={t.topic} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{t.topic}</td>
                      <td className="font-mono text-xs">{t.vol.toLocaleString()}</td>
                      <td className={`font-mono text-xs ${t.sentiment > 0 ? 'text-emerald-600' : t.sentiment < -0.5 ? 'text-red-600' : 'text-amber-600'}`}>{t.sentiment > 0 ? '+' : ''}{t.sentiment.toFixed(2)}</td>
                      <td className={`font-mono text-xs font-bold ${t.deltaWoW > 50 ? 'text-red-600' : t.deltaWoW > 10 ? 'text-amber-600' : 'text-vfes-dark/55'}`}>{t.deltaWoW > 0 ? '+' : ''}{t.deltaWoW}%</td>
                      <td>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          t.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          t.status === 'EMERGING' ? 'bg-amber-50 text-amber-700' :
                          t.status === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{tt(t.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('CBL_CX.VOC.TOPIC_CLUSTERS · llama3.1-70b · refresh hourly')}</div>
            </Panel>

            <Panel title={tt('URCA complaints lifecycle')} action={<ShieldCheck className="w-4 h-4 text-red-600" />}>
              <div className="space-y-1.5">
                {comreg.map((s) => {
                  const max = 142
                  const w = (s.n / max) * 100
                  return (
                    <div key={s.stage} className="grid grid-cols-[200px,1fr,60px] items-center gap-2 text-xs">
                      <span className="font-semibold text-vfes-dark/75 truncate">{s.stage}</span>
                      <div className="relative h-5 bg-black/[0.03] rounded">
                        <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${w}%`, background: s.color }} />
                      </div>
                      <span className="font-mono text-right font-bold">{s.n}</span>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5 text-[11px]">
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Statutory SLA')}</div><div className="font-bold">{tt('10 working days')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Breaches YTD')}</div><div className="font-bold text-red-600">2</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Resolution rate')}</div><div className="font-bold text-emerald-700">94%</div></div>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Vulnerable customers — Priority Service Register')} action={<Heart className="w-4 h-4 text-red-600" />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('PSR registered')}</div>
                <div className="text-xl font-extrabold">{(vulnerable.registered/1000).toFixed(1)}K</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Priority repairs (90d)')}</div>
                <div className="text-xl font-extrabold">{vulnerable.prsRepairs.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('SLA met')}</div>
                <div className="text-xl font-extrabold text-emerald-700">{vulnerable.slaMet}%</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Sign-language sessions')}</div>
                <div className="text-xl font-extrabold">{vulnerable.accessibility.signLanguage}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Vulnerable complaints')}</div>
                <div className="text-xl font-extrabold text-amber-600">{vulnerable.complaintsThisMonth}</div>
              </div>
            </div>
          </Panel>
        </>
      )}

      {tab === 'ops' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Service level')}      value="78%"   delta="<30s · target 80%"          trend="down" icon={Clock} />
            <KpiCard label={tt('Abandonment rate')}   value="6.2%"  delta="+1.2pp vs target"            trend="down" icon={X} />
            <KpiCard label={tt('Schedule adherence')} value="91%"   delta="+2pp"                        trend="up"   icon={Award} />
            <KpiCard label={tt('AI-assist adoption')} value="80%"   delta="+18pp QoQ"                   trend="up"   icon={Sparkles} accent />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Channel mix — volume × cost-per-contact × CSAT')} action={<MessageCircle className="w-4 h-4 text-vfes-dark/40" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Channel')}</th><th>{tt('Volume')}</th><th>{tt('AHT')}</th><th>{tt('CSAT')}</th><th>{tt('BSD /contact')}</th><th>{tt('Daily BSD ')}</th></tr>
                </thead>
                <tbody>
                  {channels.map((c) => (
                    <tr key={c.ch} className="border-t border-black/5">
                      <td className="py-2 font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        {c.ch}
                      </td>
                      <td className="font-mono">{c.vol.toLocaleString()}</td>
                      <td className="text-xs">{c.aht}</td>
                      <td className={c.csat >= 88 ? 'text-emerald-600 font-bold' : c.csat >= 80 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>{c.csat}</td>
                      <td className="font-mono">BSD {c.costPer.toFixed(2)}</td>
                      <td className="font-mono font-bold">BSD {((c.vol * c.costPer)/1000).toFixed(1)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title={tt('Intra-day SLA · abandonment · queue depth')} action={<Activity className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="h-56">
                <ResponsiveContainer>
                  <ComposedChart data={slaIntraday}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="#999" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#999" fontSize={10} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine yAxisId="left" y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'SLA target 80%', fontSize: 9, fill: '#10b981' }} />
                    <Area yAxisId="left" type="monotone" dataKey="sla" stroke="#222128" fill="#FF4438" fillOpacity={0.15} strokeWidth={2} />
                    <Bar  yAxisId="right" dataKey="queue" fill="#cbd5e1" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-vfes-dark/55 mt-2">
                14:00 spike: <span className="font-bold text-red-600">{tt('SLA dropped to 56%')}</span>, queue 38 deep — Cortex flagged Freeport outage
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Bot containment — reality check')} action={<Bot className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Headline containment')}</div>
                  <div className="text-2xl font-extrabold">81%</div>
                  <div className="text-[10px] text-vfes-dark/55">{tt('11.8K of 14.6K sessions')}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-700">{tt('Contained & CSAT ≥ 4')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{Math.round((botBreakdown.containedCsatHigh / botBreakdown.totalSessions) * 100)}%</div>
                  <div className="text-[10px] text-emerald-700">{(botBreakdown.containedCsatHigh/1000).toFixed(1)}K — true success</div>
                </div>
                <div className="p-3 bg-amber-50 rounded border border-amber-200">
                  <div className="text-[10px] uppercase tracking-widest text-amber-700">{tt('Contained · CSAT &lt; 4')}</div>
                  <div className="text-2xl font-extrabold text-amber-700">{Math.round((botBreakdown.containedCsatLow / botBreakdown.totalSessions) * 100)}%</div>
                  <div className="text-[10px] text-amber-700">{(botBreakdown.containedCsatLow/1000).toFixed(1)}K — frustrated hangups</div>
                </div>
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="text-[10px] uppercase tracking-widest text-red-700">{tt('Repeat &lt; 7d')}</div>
                  <div className="text-2xl font-extrabold text-red-700">{Math.round((botBreakdown.containedRepeat7d / botBreakdown.totalSessions) * 100)}%</div>
                  <div className="text-[10px] text-red-700">{(botBreakdown.containedRepeat7d/1000).toFixed(1)}K — false containment</div>
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Sessions by bot turns before resolution / escalation')}</div>
              <div className="h-32">
                <ResponsiveContainer>
                  <BarChart data={botTurns}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="turns" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="contained" stackId="a" fill="#10b981" />
                    <Bar dataKey="escalated" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('AI-assist (Cortex) usage by feature')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Feature')}</th><th>{tt('Adoption')}</th><th>{tt('Time saved/call')}</th><th>{tt('Accept rate')}</th></tr>
                </thead>
                <tbody>
                  {aiAssist.map((a) => (
                    <tr key={a.feature} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{a.feature}</td>
                      <td className="font-mono">{a.adoption}%</td>
                      <td className="font-mono">{a.timeSaved > 0 ? `${a.timeSaved}s` : '—'}</td>
                      <td className={`font-mono ${a.accept > 80 ? 'text-emerald-600' : a.accept > 50 ? 'text-amber-600' : 'text-vfes-dark/45'}`}>{a.accept > 0 ? `${a.accept}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-black/5 text-[11px]">
                <span className="text-vfes-dark/55">{tt('Cortex saves')}</span><span className="font-bold text-emerald-700">{tt('~14s/call avg')}</span>
                <span className="text-vfes-dark/55"> — </span><span className="font-bold">{tt('BSD 212K / month')}</span>
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title={tt('Team rollup')} action={<Users className="w-4 h-4 text-vfes-dark/40" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Team')}</th><th>{tt('CSAT')}</th><th>{tt('FCR')}</th><th>{tt('AHT')}</th><th>{tt('Attrition')}</th></tr>
                </thead>
                <tbody>
                  {teamRollup.map((t) => (
                    <tr key={t.team} className={`border-t border-black/5 ${t.alert ? 'bg-red-50/50' : ''}`}>
                      <td className="py-2 font-semibold flex items-center gap-1.5">
                        {t.team}
                        {t.alert && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                      </td>
                      <td className={`font-mono font-bold ${t.csat >= 90 ? 'text-emerald-600' : t.csat >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{t.csat}</td>
                      <td className="font-mono">{t.fcr}%</td>
                      <td className="font-mono">{t.aht}m</td>
                      <td className={`font-mono ${t.attrition > 18 ? 'text-red-600 font-bold' : t.attrition > 12 ? 'text-amber-600' : 'text-vfes-dark/65'}`}>{t.attrition}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-red-700">
                <span className="font-bold">{tt('Billing team')}</span>: 22% attrition is driving CSAT 78 — coaching + retention bonus
              </div>
            </Panel>

            <Panel title={tt('Top agents · QA & coaching flags')} action={<Headphones className="w-4 h-4 text-vfes-dark/40" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Agent')}</th><th>{tt('CSAT')}</th><th>{tt('FCR')}</th><th>{tt('Repeat')}</th><th>{tt('QA')}</th><th /></tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={tt(a.name)} className={`border-t border-black/5 ${a.coach ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2 font-semibold text-xs">{tt(a.name)}<div className="text-[10px] text-vfes-dark/55">{a.team}</div></td>
                      <td className={`font-mono font-bold ${a.csat >= 90 ? 'text-emerald-600' : a.csat >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{a.csat}</td>
                      <td className="font-mono">{a.fcr}%</td>
                      <td className={`font-mono ${a.repeat > 15 ? 'text-red-600 font-bold' : 'text-vfes-dark/65'}`}>{a.repeat}%</td>
                      <td className="font-mono">{a.qa}</td>
                      <td>{a.coach && <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{tt('Coach')}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}

      {tab === 'loop' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Detractors recovered')}   value={`${detractorRecovery[3].n + detractorRecovery[4].n}`} delta={`${Math.round(((detractorRecovery[3].n + detractorRecovery[4].n)/detractorRecovery[0].n)*100)}% of detractors`} trend="up" icon={Heart} accent />
            <KpiCard label={tt('Detractor → Promoter')}   value={`${detractorRecovery[4].n}`} delta="closed-loop NPS recovery" trend="up" icon={ThumbsUp} />
            <KpiCard label={tt('CX-driven cancels (30d)')} value={`${churnFromCx}`} delta={`BSD ${(churnFromCx*1900/1000).toFixed(0)}K LTV at risk`} trend="down" icon={X} />
            <KpiCard label={tt('Save rate (intent calls)')} value="38%" delta="target 45% · Δ −7pp" trend="down" icon={ShieldCheck} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Detractor recovery funnel — closed loop NPS')} action={<RotateCcw className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="space-y-2">
                {detractorRecovery.map((s, i) => {
                  const top = detractorRecovery[0].n
                  const w = (s.n / top) * 100
                  const drop = i > 0 ? (1 - s.n / detractorRecovery[i-1].n) * 100 : 0
                  return (
                    <div key={s.stage} className="grid grid-cols-[200px,1fr,80px] items-center gap-3 text-xs">
                      <span className="font-semibold text-vfes-dark/75 truncate">{s.stage}</span>
                      <div className="relative h-7 bg-black/[0.03] rounded">
                        <div className="absolute inset-y-0 left-0 rounded flex items-center px-2 text-white font-bold text-[11px]" style={{ width: `${Math.max(w, 4)}%`, background: s.color }}>
                          {s.n.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{((s.n/top)*100).toFixed(0)}%</div>
                        {i > 0 && <div className="text-[10px] text-red-600 font-mono">−{drop.toFixed(0)}%</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Cost per recovery')}</div><div className="font-bold">BSD 48</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('CLV recovered / Q')}</div><div className="font-bold text-emerald-700">{tt('BSD 1.14M')}</div></div>
              </div>
            </Panel>

            <Panel title={tt('CX → cancellation 30d · by contact reason')} action={<X className="w-4 h-4 text-vfes-dark/40" />}>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr><th className="py-2">{tt('Contact reason')}</th><th>{tt('Contacts')}</th><th>{tt('Cancelled &lt;30d')}</th><th>{tt('Rate')}</th></tr>
                </thead>
                <tbody>
                  {cxToCancel.map((r) => (
                    <tr key={r.contactReason} className="border-t border-black/5">
                      <td className="py-2 font-semibold text-xs">{r.contactReason}</td>
                      <td className="font-mono">{r.contacts.toLocaleString()}</td>
                      <td className="font-mono">{r.cancelledIn30d}</td>
                      <td className={`font-mono font-bold ${r.rate > 10 ? 'text-red-600' : r.rate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.rate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-black/5 text-[11px]">
                <span className="text-red-700 font-bold">{tt('Engineer no-show 14% cancel rate')}</span> — top CX-driven churn lever; field ops fix has highest LTV ROI
              </div>
            </Panel>
          </div>

          <Panel title={tt('CX → Retention auto-handoff')} action={<Send className="w-4 h-4 text-vfes-dark" />}>
            <div className="grid md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Churn-intent detected')}</div>
                <div className="text-xl font-extrabold">2,840</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('Cortex sentiment + keywords')}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Auto-routed to retention')}</div>
                <div className="text-xl font-extrabold text-emerald-700">2,180</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('77% capture')}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('NBA case created')}</div>
                <div className="text-xl font-extrabold">1,840</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('→ Bundle/Pricing/Comp')}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded border border-black/5">
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Saved within 7d')}</div>
                <div className="text-xl font-extrabold text-emerald-700">1,240</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('67% save vs 38% baseline')}</div>
              </div>
            </div>
          </Panel>
        </>
      )}

      {tab === 'actions' && (
        <>
          <Panel title={tt('Action Queue — what CX should do NOW')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                <tr><th className="py-2">{tt('Type')}</th><th>P</th><th>{tt('Action')}</th><th>{tt('Impact')}</th><th>{tt('Why · play')}</th><th>{tt('Owner')}</th><th /></tr>
              </thead>
              <tbody>
                {actionQueue.map((a) => {
                  const isPushed = pushed.includes(a.title)
                  return (
                    <tr key={tt(a.title)} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          a.type === 'Callback' ? 'bg-blue-50 text-blue-700' :
                          a.type === 'Fix' || a.type === 'Comply' ? 'bg-red-50 text-red-700' :
                          a.type === 'Coach' || a.type === 'Recover' ? 'bg-amber-50 text-amber-700' :
                          a.type === 'Promote' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{a.type}</span>
                      </td>
                      <td><span className={`text-[10px] font-mono font-bold ${a.priority === 'P0' ? 'text-red-600' : a.priority === 'P1' ? 'text-amber-600' : 'text-vfes-dark/55'}`}>{a.priority}</span></td>
                      <td className="font-semibold">{tt(a.title)}</td>
                      <td className="font-bold text-emerald-700 text-xs">{a.impact}</td>
                      <td className="text-xs text-vfes-dark/70 max-w-[300px]">{a.why}<div className="text-[10px] text-vfes-dark/45 mt-0.5">→ {a.play}</div></td>
                      <td className="text-xs">{tt(a.owner)}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setPushed((p) => p.includes(a.title) ? p : [...p, a.title])}
                          disabled={isPushed}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 ml-auto ${
                            isPushed ? 'bg-emerald-50 text-emerald-700 cursor-default' : 'bg-vfes-red text-vfes-dark hover:bg-vfes-red/90'
                          }`}>
                          {isPushed ? <><ShieldCheck className="w-3 h-3" />{tt('Queued')}</> : <><Send className="w-3 h-3" /> {a.cta}</>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Panel title={tt('Model card — cx_voc_v3 · sentiment · churn-intent')} action={<GitBranch className="w-4 h-4 text-vfes-dark/40" />}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('VoC topic clustering')}</div><div className="font-semibold">{tt('Cortex Complete · llama3.1-70b')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Sentiment')}</div><div className="font-semibold">{tt('Cortex Sentiment · multilingual')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Churn-intent classifier')}</div><div className="font-semibold">{tt('XGBoost · AUC 0.88')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Speech-to-text')}</div><div className="font-semibold">{tt('Whisper-Large · Bahamian-EN tuned')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Refresh')}</div><div className="font-semibold">{tt('Hourly · Snowpipe Streaming')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Owner')}</div><div className="font-semibold">{tt('CX Analytics · S. Rolle')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('DPA basis')}</div><div className="font-semibold">{tt('Service contract · DPIA-2024-CX-08')}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('PII redaction')}</div><div className="font-semibold text-emerald-700">{tt('Pre-cluster · regex + LLM')}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
                <span className="font-mono text-vfes-dark/55">{tt('CBL_CX.VOC.* ⨝ ML_OUTPUTS.CHURN_INTENT')}</span>
                <a className="text-vfes-dark font-semibold flex items-center gap-1 hover:underline" href="#">Open lineage <ArrowUpRight className="w-3 h-3" /></a>
              </div>
            </Panel>

            <Panel title={tt('Snowflake Intelligence — Ask the data')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
              <div className="space-y-2 text-sm">
                {[
                  'Which 50 detractors with CLV > BSD 2K should we call back today?',
                  'Show topics with sentiment delta < -0.3 last 7 days — what is emerging?',
                  'Which agents have repeat-contact > 15% AND QA < 75? Coaching list.',
                  'Of customers contacted for "engineer no-show" last 30 days, how many cancelled?',
                  'Forecast URCA complaint volume next 30 days at current run-rate.',
                  'Which knowledge-base articles need updating based on bot-escalation reasons?',
                ].map((q) => (
                  <button key={q} className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                    <span className="flex-1">{q}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('CUSTOMER_EXPERIENCE')}</span></div>
            </Panel>
          </div>
        </>
      )}

      {/* ═══════════════ NETWORK CX ══════════════════════════════════════════ */}
      {tab === 'network' && (
        <>
          {alertVisible && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-amber-900 text-sm">
                  {tt('HFC contact rate 10.6% — 2× FTTH · Thu outage drove CSAT to 64 same-day')}
                </div>
                <div className="text-xs text-amber-800 mt-1">
                  {tt('Prioritise DOCSIS 4.0 cutover in HFC pockets. Convergent segment leads NPS +52.')}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/portal/network" className="text-xs font-bold text-amber-900 hover:underline">{tt('Open Network →')}</Link>
                <button onClick={dismissAlert} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Convergent NPS')}      value="+52"   delta={tt('+14 vs HFC · market leader')} trend="up"   icon={TrendingUp}  accent />
            <KpiCard label={tt('FTTH NPS')}             value="+46"   delta="+3 pts QoQ"                       trend="up"   icon={Activity}   />
            <KpiCard label={tt('Mobile NPS')}            value="+38"   delta={tt('leads BTC +32')}         trend="up"   icon={Smartphone} />
            <KpiCard label={tt('HFC NPS')}               value="+30"   delta={tt('laggard · DOCSIS fix needed')} trend="down" icon={TrendingDown}/>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Convergent contact rate')} value="5.0%"  delta="-0.8pp YTD"  trend="up"   icon={Phone}     />
            <KpiCard label={tt('FTTH contact rate')}        value="5.5%"  delta="-0.7pp YTD"  trend="up"   icon={Phone}     />
            <KpiCard label={tt('Mobile contact rate')}      value="7.8%"  delta="-0.6pp YTD"  trend="up"   icon={Phone}     />
            <KpiCard label={tt('HFC contact rate')}         value="10.6%" delta={tt('+2× FTTH · top priority')} trend="down" icon={AlertTriangle}/>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('NPS by product segment — 6-month trend')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={networkNpsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[20, 60]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="conv"   name={tt('Convergent')} stroke="#10B981" strokeWidth={2.4} dot />
                    <Line type="monotone" dataKey="ftth"   name={tt('FTTH')}       stroke="#222128" strokeWidth={2}   dot />
                    <Line type="monotone" dataKey="mobile" name={tt('Mobile')}     stroke="#11567F" strokeWidth={2}   dot />
                    <Line type="monotone" dataKey="hfc"    name={tt('HFC')}        stroke="#F59E0B" strokeWidth={1.8} dot={false} strokeDasharray="4 4" />
                    <ReferenceLine y={38} stroke="#94a3b8" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Dashed line = overall NPS benchmark 38 · Convergent and FTTH above; HFC and Mobile converging')}</div>
            </Panel>

            <Panel title={tt('Contact rate by segment — 6-month trend (%)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={contactRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="hfc"    name={tt('HFC')}        stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="mobile" name={tt('Mobile')}     stroke="#11567F" fill="#11567F" fillOpacity={0.1}  strokeWidth={2} />
                    <Area type="monotone" dataKey="ftth"   name={tt('FTTH')}       stroke="#222128" fill="#FF4438" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="conv"   name={tt('Convergent')} stroke="#10B981" fill="#10B981" fillOpacity={0.2}  strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <Panel title={tt('CSAT distribution by segment')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={nxCsatPie} dataKey="value" innerRadius={38} outerRadius={68} paddingAngle={3}
                      label={({ name, value }: { name: string; value: number }) => `${name} +${value}`} labelLine={false}>
                      {nxCsatPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="lg:col-span-2">
              <Panel title={tt('CX by network — NPS · CSAT · contact rate · top gripe')}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Segment')}</th>
                      <th className="text-right">{tt('NPS')}</th>
                      <th className="text-right">{tt('CSAT')}</th>
                      <th className="text-right">{tt('Contact rate')}</th>
                      <th>{tt('Top gripe')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CX_BY_NETWORK.map((n) => (
                      <tr key={n.network} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: n.color }} />{tt(n.network)}
                        </td>
                        <td className={`text-right font-bold ${n.nps >= 45 ? 'text-emerald-600' : n.nps >= 35 ? 'text-vfes-dark' : 'text-amber-600'}`}>+{n.nps}</td>
                        <td className="text-right font-mono text-xs">{n.csat.toFixed(2)}</td>
                        <td className="text-right font-mono text-xs">{n.contactRate.toFixed(1)}%</td>
                        <td className="text-xs text-vfes-dark/65">{tt(n.topGripe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
                  <Link to="/portal/network"         className="font-semibold text-vfes-dark hover:underline">{tt('Network →')}</Link>
                  <span>·</span>
                  <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
                  <span>·</span>
                  <Link to="/portal/field-ops"       className="font-semibold text-vfes-dark hover:underline">{tt('Field Ops →')}</Link>
                </div>
              </Panel>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Network & Engineering')}</div>
              <div className="text-sm text-vfes-dark/80">
                {tt('5G coverage · RAN performance · core uptime and its direct impact on CX metrics.')}
              </div>
            </div>
            <Link to="/portal/network" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
              <Network className="w-4 h-4" />{tt('Open Network →')}
            </Link>
          </div>
        </>
      )}

      {/* ═══════════════ COMPLAINTS ══════════════════════════════════════════ */}
      {tab === 'complaints' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('URCA open complaints')} value="62"   delta={tt('8 near 10wd breach')}        trend="down" icon={AlertTriangle} accent />
            <KpiCard label={tt('Internal complaints')}   value="432"  delta="+3% WoW"                         trend="down" icon={FileText}      />
            <KpiCard label={tt('Repeat contacts (14d)')} value="66"   delta={tt('+2 WoW · top: TV box')}      trend="down" icon={RotateCcw}     />
            <KpiCard label={tt('Resolution rate')}       value="94%"  delta={tt('URCA · illustrative 10wd')}     trend="up"   icon={ShieldCheck}   />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Breaches YTD')}          value="2"    delta={tt('illustrative 10wd SLA')}        trend="down" icon={AlertTriangle}  />
            <KpiCard label={tt('Avg resolution time')}   value="6.2d" delta="-0.4d QoQ"                       trend="up"   icon={Clock}          />
            <KpiCard label={tt('Billing complaints')}    value="142"  delta={tt('33% of total')}              trend="flat" icon={CreditCard}     />
            <KpiCard label={tt('Tech Sup. complaints')}  value="98"   delta={tt('23% · TV box top driver')}   trend="down" icon={Wrench}         />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Complaint volume trend — URCA vs internal vs repeat (6mo)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={complaintsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  yAxisId="l" dataKey="internal" name={tt('Internal')} fill="#FF4438" stackId="a" />
                    <Bar  yAxisId="l" dataKey="cnmc"     name={tt('URCA')}     fill="#dc2626" stackId="a" />
                    <Line yAxisId="r" type="monotone" dataKey="repeat" name={tt('Repeat 14d')} stroke="#F59E0B" strokeWidth={2.4} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('URCA complaints +29% over 6 months — billing and install delays primary drivers')}</div>
            </Panel>

            <Panel title={tt('Complaints by team — volume distribution')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={complaintsByTeam} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="team" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="n" name={tt('Complaints')} radius={[0, 4, 4, 0]}>
                      {complaintsByTeam.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
                <Link to="/portal/billing-charging" className="font-semibold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
                <span>·</span>
                <Link to="/portal/contact-center"   className="font-semibold text-vfes-dark hover:underline">{tt('Contact Centre →')}</Link>
              </div>
            </Panel>
          </div>

          {/* URCA trend sparkline */}
          <Panel title={tt('URCA complaint intake vs resolution — last 6 months')} >
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={complaintsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cnmc"   name={tt('URCA open')} fill="#dc2626" radius={[4,4,0,0]} />
                  <Bar dataKey="repeat" name={tt('Repeat 14d')} fill="#F59E0B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('URCA open count +29% over 6 months — 8 cases near the 10-working-day illustrative deadline')}</div>
          </Panel>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
            {['All', 'URCA', 'Internal', 'Social', 'Open', 'Escalated', 'Resolved'].map(f => (
              <button key={f} onClick={() => setComplaintFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${complaintFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>

          <Panel title={tt('Complaint register — active cases')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Ref')}</th>
                    <th>{tt('Topic')}</th>
                    <th>{tt('Channel')}</th>
                    <th className="text-right">{tt('Age (d)')}</th>
                    <th>{tt('Status')}</th>
                    <th>{tt('Owner')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map(c => (
                    <tr key={c.ref} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-mono text-xs">{c.ref}</td>
                      <td className="font-semibold text-xs">{tt(c.topic)}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.channel === 'URCA' ? 'bg-red-100 text-red-700' : c.channel === 'Social' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.channel}
                        </span>
                      </td>
                      <td className={`text-right font-mono font-bold ${c.age >= 8 ? 'text-red-600' : c.age >= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.age}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'Escalated' ? 'bg-red-100 text-red-700' : c.status === 'Open' || c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {tt(c.status)}
                        </span>
                      </td>
                      <td className="text-xs">{tt(c.owner)}</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.risk === 'High' ? 'bg-red-100 text-red-700' : c.risk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {tt(c.risk)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/voc"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Voice of Customer →')}</Link>
              <Link to="/portal/agents"       className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Agent Portal →')}</Link>
            </div>
          </Panel>

          <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Sales & Retention')}</div>
              <div className="text-sm text-vfes-dark/80">
                {tt('38 customers with URCA complaints are also in the churn-intent model — route to retention desk.')}
              </div>
            </div>
            <Link to="/portal/sales" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
              <Target className="w-4 h-4" />{tt('Open Sales & Retention →')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
