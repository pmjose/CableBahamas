import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList } from '../../components/ExecCockpit'
import CUST from './_customer_facts'
import {
  BadgeCheck, Gift, Mail, ShieldCheck, Star, TrendingUp, Users, Activity,
  AlertTriangle, Bell, Award, Lock, FileCheck, BarChart2, Calendar,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const ragC = (r: string) =>
  r === 'Low' ? 'bg-emerald-100 text-emerald-700' : r === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
const stP = (s: string) =>
  s === 'Active' || s === 'Completed' || s === 'Processed' || s === 'Recorded'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'In progress' || s === 'Planning'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

// ─── Loyalty tier data ────────────────────────────────────────────────────────
const TIERS = [
  { tier: 'Bronze',   members: 1_480_000, marginIdx: 92,  churn: 1.9, arpu: 32, pts: 180,  nps: 28 },
  { tier: 'Silver',   members:   920_000, marginIdx: 104, churn: 1.4, arpu: 45, pts: 420,  nps: 36 },
  { tier: 'Gold',     members:   412_000, marginIdx: 121, churn: 0.9, arpu: 64, pts: 980,  nps: 48 },
  { tier: 'Platinum', members:   128_000, marginIdx: 138, churn: 0.6, arpu: 92, pts: 2100, nps: 62 },
]

const TIER_TREND = [
  { m: 'Jan', bronze: 1540, silver: 870, gold: 390, platinum: 118 },
  { m: 'Feb', bronze: 1520, silver: 878, gold: 396, platinum: 120 },
  { m: 'Mar', bronze: 1510, silver: 885, gold: 400, platinum: 122 },
  { m: 'Apr', bronze: 1500, silver: 895, gold: 405, platinum: 124 },
  { m: 'May', bronze: 1490, silver: 905, gold: 410, platinum: 126 },
  { m: 'Jun', bronze: 1480, silver: 920, gold: 412, platinum: 128 },
]

// ─── Points liability data ───────────────────────────────────────────────────
const LIABILITY = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26'][i],
  liabilityM: parseFloat((14.2 + i * 0.62).toFixed(2)),
  redeemed:   parseFloat((28   + i * 0.90).toFixed(1)),
  earned:     parseFloat((42   + i * 1.10).toFixed(1)),
  expired:    parseFloat((8    - i * 0.30).toFixed(1)),
}))

const POINTS_BALANCE = [
  { tier: 'Bronze',   avgPts: 180,  dormant: 28 },
  { tier: 'Silver',   avgPts: 420,  dormant: 18 },
  { tier: 'Gold',     avgPts: 980,  dormant: 9  },
  { tier: 'Platinum', avgPts: 2100, dormant: 4  },
]

const POINTS_EXPIRY = [
  { range: '0–30 days',   pts: 4.2,  members: 28_000 },
  { range: '31–60 days',  pts: 6.8,  members: 44_000 },
  { range: '61–90 days',  pts: 9.4,  members: 62_000 },
  { range: '91–180 days', pts: 14.2, members: 94_000 },
]

// ─── Redemption data ─────────────────────────────────────────────────────────
const REWARDS = [
  { reward: 'Bill credit',                   share: 38, cost: 4.2,  satisfaction: 72 },
  { reward: 'Device discount',               share: 24, cost: 12.8, satisfaction: 84 },
  { reward: 'Data boost',                    share: 18, cost: 1.8,  satisfaction: 79 },
  { reward: 'Partner perks (cinema/retail)', share: 12, cost: 2.4,  satisfaction: 88 },
  { reward: 'Charity donation',              share: 8,  cost: 0.8,  satisfaction: 91 },
]

const REDEMPTION_TREND = [
  { m: 'Jan', rate: 24.2, digital: 68 },
  { m: 'Feb', rate: 25.1, digital: 69 },
  { m: 'Mar', rate: 26.0, digital: 71 },
  { m: 'Apr', rate: 27.2, digital: 73 },
  { m: 'May', rate: 28.4, digital: 75 },
  { m: 'Jun', rate: 29.8, digital: 77 },
]

const REDEMPTION_BY_TIER = [
  { tier: 'Bronze',   rate: 18.4, avg_pts:  85 },
  { tier: 'Silver',   rate: 28.2, avg_pts: 210 },
  { tier: 'Gold',     rate: 38.6, avg_pts: 490 },
  { tier: 'Platinum', rate: 52.1, avg_pts: 1240 },
]

// ─── Partner rewards catalogue ────────────────────────────────────────────────
const PARTNERS = [
  { partner: 'Kinepolis Cinemas',        category: 'Entertainment', ptsRequired:  500, take: 8.4, margin: 'High', status: 'Active'   },
  { partner: 'MediaMarkt',               category: 'Retail',        ptsRequired: 1000, take: 6.2, margin: 'High', status: 'Active'   },
  { partner: 'SNCB (Bahamian Rail)',      category: 'Travel',        ptsRequired: 2000, take: 4.8, margin: 'Med',  status: 'Active'   },
  { partner: 'Amazon Premium',           category: 'Digital',       ptsRequired:  800, take: 9.1, margin: 'Med',  status: 'Active'   },
  { partner: 'Q8 Fuel',                  category: 'Fuel',          ptsRequired:  300, take: 3.6, margin: 'Low',  status: 'Active'   },
  { partner: 'Streaming add-on',      category: 'Streaming',     ptsRequired:  600, take: 5.2, margin: 'High', status: 'Planning' },
  { partner: 'Booking.com Hotel',        category: 'Travel',        ptsRequired: 3000, take: 2.1, margin: 'High', status: 'Planning' },
]

const PARTNER_PERF = [
  { partner: 'Amazon Premium',     redemptions: 91_400, costM: 0.73 },
  { partner: 'Kinepolis Cinemas',  redemptions: 84_200, costM: 0.42 },
  { partner: 'MediaMarkt',         redemptions: 62_100, costM: 0.62 },
  { partner: 'SNCB (Bahamian Rail)',redemptions: 48_200, costM: 0.48 },
  { partner: 'Q8 Fuel',            redemptions: 36_100, costM: 0.18 },
]

// ─── Consent & contactability ─────────────────────────────────────────────────
const CONTACTABLE = [
  { ch: 'SMS',           pct: 74, trend: +2.1, reachM: 2.14 },
  { ch: 'Email',         pct: 68, trend: +1.4, reachM: 1.97 },
  { ch: 'Push (app)',    pct: 58, trend: +3.2, reachM: 1.68 },
  { ch: 'Outbound call', pct: 46, trend: -0.8, reachM: 1.33 },
  { ch: 'WhatsApp',      pct: 38, trend: +4.1, reachM: 1.10 },
  { ch: 'Post (direct)', pct: 22, trend: -1.2, reachM: 0.64 },
]

const CONSENT_TREND = [
  { m: 'Jan', sms: 70, email: 64, push: 52, wa: 30 },
  { m: 'Feb', sms: 71, email: 65, push: 54, wa: 32 },
  { m: 'Mar', sms: 72, email: 66, push: 55, wa: 34 },
  { m: 'Apr', sms: 72, email: 67, push: 56, wa: 36 },
  { m: 'May', sms: 73, email: 67, push: 57, wa: 37 },
  { m: 'Jun', sms: 74, email: 68, push: 58, wa: 38 },
]

const OPT_IN_FUNNEL = [
  { step: 'Base (2.9M)',  value: 100 },
  { step: 'SMS opt-in',   value: 74  },
  { step: 'Email opt-in', value: 68  },
  { step: 'Push enabled', value: 58  },
  { step: 'All-channel',  value: 34  },
]

// ─── Preference centre ─────────────────────────────────────────────────────────
const PREF_TOPICS = [
  { topic: 'Promotions & offers',       opted: 68, declined: 32 },
  { topic: 'New product launches',      opted: 54, declined: 46 },
  { topic: 'Service updates',           opted: 82, declined: 18 },
  { topic: 'Loyalty points summary',    opted: 76, declined: 24 },
  { topic: 'Network maintenance',       opted: 61, declined: 39 },
  { topic: 'Third-party partner deals', opted: 38, declined: 62 },
]

// ─── GDPR purposes ────────────────────────────────────────────────────────────
const GDPR_PURPOSES = [
  { purpose: 'Marketing communications', lawful: 'Consent',         rate: 74,  expiring90d: 8_400,  risk: 'Low'  },
  { purpose: 'Service notifications',    lawful: 'Contract',        rate: 98,  expiring90d: 0,      risk: 'Low'  },
  { purpose: 'Analytics / profiling',    lawful: 'Consent',         rate: 62,  expiring90d: 14_200, risk: 'Med'  },
  { purpose: 'Loyalty programme',        lawful: 'Consent',         rate: 88,  expiring90d: 6_100,  risk: 'Low'  },
  { purpose: 'Third-party sharing',      lawful: 'Consent',         rate: 41,  expiring90d: 22_800, risk: 'High' },
  { purpose: 'Fraud prevention',         lawful: 'Legitimate int.', rate: 100, expiring90d: 0,      risk: 'Low'  },
]

const DSAR_TREND = [
  { m: 'Jan', received: 42, resolved: 40, pending: 2 },
  { m: 'Feb', received: 38, resolved: 37, pending: 1 },
  { m: 'Mar', received: 51, resolved: 48, pending: 3 },
  { m: 'Apr', received: 46, resolved: 45, pending: 1 },
  { m: 'May', received: 55, resolved: 52, pending: 3 },
  { m: 'Jun', received: 49, resolved: 48, pending: 1 },
]

// ─── Consent audit log ────────────────────────────────────────────────────────
const AUDIT_LOG = [
  { id: 'A-4421', event: 'Consent withdrawn — marketing SMS',    channel: 'App',   ts: '2026-06-28 14:32', status: 'Processed',   impact: 'Removed from 3 campaigns'  },
  { id: 'A-4420', event: 'DSAR: data access request filed',      channel: 'Web',   ts: '2026-06-28 11:18', status: 'In progress', impact: '30-day response window'     },
  { id: 'A-4419', event: 'New consent collected via IVR',        channel: 'IVR',   ts: '2026-06-27 09:44', status: 'Recorded',    impact: 'Push campaign eligible'     },
  { id: 'A-4418', event: 'Bulk opt-in refresh — loyalty app',    channel: 'App',   ts: '2026-06-26 16:02', status: 'Processed',   impact: '+2,840 opt-ins SMS'         },
  { id: 'A-4417', event: 'Purpose expiry — analytics consent',   channel: 'CRM',   ts: '2026-06-25 08:30', status: 'Expired',     impact: 'Re-permission queue'        },
  { id: 'A-4416', event: 'Right to erasure request',             channel: 'Web',   ts: '2026-06-24 17:55', status: 'Completed',   impact: 'PII purged within SLA'      },
  { id: 'A-4415', event: 'Consent renewed — email marketing',    channel: 'Email', ts: '2026-06-23 12:10', status: 'Processed',   impact: 'Email list updated'         },
  { id: 'A-4414', event: 'Opt-out request — all channels',       channel: 'Web',   ts: '2026-06-22 09:05', status: 'Completed',   impact: 'Suppressed from all lists'  },
]

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'tiers' | 'points' | 'redemption' | 'rewards' | 'consent' | 'gdpr' | 'audit'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',   label: 'Overview',           icon: Activity   },
  { id: 'tiers',      label: 'Loyalty Tiers',      icon: BadgeCheck },
  { id: 'points',     label: 'Points & Liability', icon: Gift       },
  { id: 'redemption', label: 'Redemption',          icon: Star       },
  { id: 'rewards',    label: 'Rewards Catalogue',   icon: Award      },
  { id: 'consent',    label: 'Consent & Reach',     icon: Mail       },
  { id: 'gdpr',       label: 'GDPR / Privacy',      icon: ShieldCheck },
  { id: 'audit',      label: 'Consent Audit',       icon: FileCheck  },
]

export default function LoyaltyConsentPage() {
  const [tab, setTab]                   = useState<TabId>('overview')
  const [tierFilter, setTierFilter]     = useState<string>('All')
  const [consentSort, setConsentSort]   = useState<'pct' | 'reachM'>('pct')
  const [gdprFilter, setGdprFilter]     = useState<'All' | 'Consent' | 'Contract'>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]         = useState<string>('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredTiers = useMemo(
    () => tierFilter === 'All' ? TIERS : TIERS.filter(t => t.tier === tierFilter),
    [tierFilter],
  )

  const sortedConsent = useMemo(
    () => [...CONTACTABLE].sort((a, b) => consentSort === 'pct' ? b.pct - a.pct : b.reachM - a.reachM),
    [consentSort],
  )

  const filteredGdpr = useMemo(
    () => gdprFilter === 'All'
      ? GDPR_PURPOSES
      : GDPR_PURPOSES.filter(p => gdprFilter === 'Consent' ? p.lawful === 'Consent' : p.lawful === 'Contract'),
    [gdprFilter],
  )

  const totalMembers = useMemo(() => TIERS.reduce((s, t) => s + t.members, 0), [])
  const latestLiability = LIABILITY[LIABILITY.length - 1].liabilityM

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Loyalty & Consent')}
        subtitle={tt('Loyalty tiers · points liability · redemption · consent & contactability · GDPR preference centre')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{(totalMembers / 1e6).toFixed(2)}M {tt('members · ')}{liveTime}
            </span>
            <Link to="/portal/marketing" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Mail className="w-4 h-4" /> {tt('Open Marketing')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Loyalty intelligence"
        models={[
          { name: 'Tier Migration Model',    metric: 'AUC 0.88',    sub: 'Silver→Gold propensity · 90d window' },
          { name: 'Points Expiry Predictor', metric: 'MAPE 6.2%',   sub: 'breakage forecast for IFRS provision' },
          { name: 'Consent Decay Model',     metric: 'recall 0.86', sub: 're-permission trigger timing' },
        ]}
        agentLabel="Run Loyalty Optimiser"
        agentRunningLabel="Analysing…"
        agentSteps={[
          'Scored 920K Silver members on CLV and churn propensity',
          'Ranked upgrade candidates by margin uplift vs reward cost',
          'Forecasted IFRS points breakage for next 2 quarters',
          'Identified 22,800 consent records expiring within 90 days — drafted re-permission wave',
        ]}
        agentBlurb="Connecting loyalty tier data to consent and CLV in a single data platform lets one model optimise tier migration, reward cost and re-permission in the same run — something that took three siloed teams weeks now completes overnight."
        decision={{
          title: 'Prioritise Silver→Gold migration for top CLV cohort + immediate 22K re-permission wave',
          detail: 'The tier model identifies 84,000 Silver members with high CLV and elevated churn propensity as upgrade candidates. Gold membership cuts churn by 0.5 pp and lifts margin index by 17 pts. Simultaneously 22,800 third-party sharing consents expire in 90 days — a proactive re-permission campaign prevents a hard suppression that breaks partner revenue.',
          impact: '−0.5 pp churn on migrated cohort · BSD 2.1M annual margin uplift · retain partner consent revenue',
          risk: 'Reward cost — fund Silver→Gold bonus from retention budget not incremental spend. Re-permission must use compliant double-opt-in.',
          linkTo: '#/portal/churn-retention',
          linkLabel: 'Open Churn & Retention',
        }}
        chart={{
          kind: 'line',
          title: 'Loyalty member count by tier — 6-month trajectory (thousands)',
          xKey: 'm',
          unit: 'K',
          data: TIER_TREND,
          series: [
            { key: 'gold',     name: 'Gold',     color: AMBER  },
            { key: 'silver',   name: 'Silver',   color: BLUE   },
            { key: 'platinum', name: 'Platinum', color: PURPLE },
            { key: 'bronze',   name: 'Bronze',   color: SLATE  },
          ],
          note: 'Gold and Platinum growing — Bronze declining as members upgrade tier.',
        }}
      />

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('22,800 third-party consent records expire within 90 days · 14,200 analytics consents due for renewal')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Re-permission wave must launch within 30 days to prevent partner revenue impact and GDPR non-compliance.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/regulatory" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open Regulatory →')}
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
          <KpiCard label={tt('Loyalty members')}   value={`${(totalMembers / 1e6).toFixed(2)}M`}   delta={tt('64% of mobile base enrolled')} trend="up"   icon={BadgeCheck} accent />
          <KpiCard label={tt('Points liability')}   value={`BSD ${latestLiability.toFixed(1)}M`}       delta={tt('on balance sheet IFRS')}        trend="flat" icon={Gift}       />
          <KpiCard label={tt('Redemption rate')}    value={`${CUST.redemptionPct}%`}                 delta={tt('+3 pp YoY')}                    trend="up"   icon={Star}       />
          <KpiCard label={tt('SMS contactable')}    value={`${CUST.contactable.sms}%`}               delta={tt('marketing-permissioned')}       trend="flat" icon={Mail}       />
          <KpiCard label={tt('GDPR compliance')}    value="98.4%"                                     delta={tt('consent coverage score')}       trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Gold + Platinum')}   value="540K"    delta={tt('18% of enrolled base')}       trend="up"   icon={Award}        />
          <KpiCard label={tt('Avg pts balance')}   value="480 pts" delta={tt('Gold avg 980 pts')}            trend="up"   icon={BarChart2}    />
          <KpiCard label={tt('DSAR requests')}      value="49 / mo" delta={tt('all within 30-day SLA')}      trend="flat" icon={FileCheck}    />
          <KpiCard label={tt('Re-permission due')} value="37K"     delta={tt('90-day consent expiry')}      trend="down" icon={AlertTriangle} />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('Loyalty & consent domain')}
            links={[
              { to: 'churn-retention', label: 'Churn & Retention',  metric: tt('Tier impact on churn'),        icon: TrendingUp  },
              { to: 'customer-360',    label: 'Customer 360',        metric: tt('Full loyalty profile'),        icon: Users       },
              { to: 'clv',             label: 'CLV',                 metric: tt('ARPU by tier · margin index'), icon: Star        },
              { to: 'marketing',       label: 'Marketing',           metric: tt('Consent-gated campaigns'),     icon: Mail        },
              { to: 'trust-center',    label: 'Trust Center',        metric: tt('Privacy & GDPR posture'),      icon: ShieldCheck },
              { to: 'base-management', label: 'Base Management',     metric: tt('Tier migration pipeline'),     icon: BadgeCheck  },
              { to: 'regulatory',      label: 'Regulatory',          metric: tt('GDPR · ePrivacy · URCA'),      icon: Lock        },
              { to: 'ai-insights',     label: 'AI Insights',         metric: tt('Model recommendations'),       icon: Activity    },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('Loyalty programme FY2026 priorities')}
              items={[
                { name: 'Silver→Gold migration — 84K candidates',  owner: tt('Loyalty · CMO office'),      pct: 42, status: 'on-track' },
                { name: 'Re-permission wave — 37K records',        owner: tt('Privacy · CRM team'),        pct: 15, status: 'at-risk'  },
                { name: 'Partner catalogue expansion — 2 new',     owner: tt('Partnerships · L. Rolle'),  pct: 68, status: 'on-track' },
                { name: 'Points liability IFRS provision review',  owner: tt('Finance · Loyalty ops'),     pct: 80, status: 'on-track' },
                { name: 'WhatsApp consent channel launch',         owner: tt('Digital · Compliance'),      pct: 55, status: 'on-track' },
              ]}
            />
          </div>
          <WatchList
            title={tt('Loyalty watch items')}
            items={[
              { text: tt('22,800 third-party consents expire in 90d — partner revenue at risk'), level: 'high'   },
              { text: tt('Bill-credit redemption 38% — crowding out partner perks'),             level: 'medium' },
              { text: tt('Booking.com partner integration delayed to Q3'),                       level: 'medium' },
              { text: tt('Bronze→Silver migration flat for 2 months'),                           level: 'low'    },
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tier membership trend — 6 months (thousands)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={TIER_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gold"     name={tt('Gold')}     stroke={AMBER}  fill={AMBER}  fillOpacity={0.2} />
                  <Area type="monotone" dataKey="silver"   name={tt('Silver')}   stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} />
                  <Area type="monotone" dataKey="platinum" name={tt('Platinum')} stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/base-management" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Base Management →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Consent opt-in rates by channel (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONTACTABLE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="ch" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="pct" name={tt('Opt-in %')} radius={[4, 4, 0, 0]}>
                    {CONTACTABLE.map((c, i) => <Cell key={i} fill={c.pct >= 70 ? GREEN : c.pct >= 55 ? BLUE : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Marketing →')}</Link>
              <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('WhatsApp growing fastest (+4.1 pp)')}</span>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ LOYALTY TIERS ══════════════════════════════════════════ */}
      {tab === 'tiers' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total enrolled')}  value={`${(totalMembers / 1e6).toFixed(2)}M`} delta={tt('64% of mobile base')} trend="up"   icon={BadgeCheck} accent />
          <KpiCard label={tt('Gold + Platinum')} value="540K"  delta={tt('+18K QoQ')}          trend="up"   icon={Award}     />
          <KpiCard label={tt('Gold churn')}      value="0.9%"  delta={tt('vs 1.9% Bronze')}    trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('Platinum NPS')}    value="62"    delta={tt('vs 28 Bronze')}       trend="up"   icon={Star}      />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter tier:')}</span>
          {['All', ...TIERS.map(t => t.tier)].map(f => (
            <button key={f} onClick={() => setTierFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${tierFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tier scorecard — ARPU, margin index, NPS & churn')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Tier')}</th>
                    <th className="text-right">{tt('Members')}</th>
                    <th className="text-right">{tt('ARPU BSD ')}</th>
                    <th className="text-right">{tt('Margin idx')}</th>
                    <th className="text-right">{tt('NPS')}</th>
                    <th className="text-right">{tt('Churn %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTiers.map(t => (
                    <tr key={t.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{t.tier}</td>
                      <td className="text-right font-mono text-xs">{t.members.toLocaleString('en-BS')}</td>
                      <td className="text-right font-bold">BSD {t.arpu}</td>
                      <td className={`text-right font-bold ${t.marginIdx >= 120 ? 'text-emerald-600' : t.marginIdx >= 100 ? 'text-blue-600' : 'text-vfes-dark'}`}>{t.marginIdx}</td>
                      <td className={`text-right font-bold ${t.nps >= 50 ? 'text-emerald-600' : t.nps >= 35 ? 'text-blue-600' : 'text-amber-600'}`}>{t.nps}</td>
                      <td className={`text-right font-bold ${t.churn <= 0.9 ? 'text-emerald-600' : t.churn <= 1.4 ? 'text-amber-600' : 'text-red-600'}`}>{t.churn}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/clv" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open CLV →')}</Link>
              <Link to="/portal/churn-retention" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Churn & Retention →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Margin index & NPS by tier')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredTiers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} domain={[80, 150]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[20, 70]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="marginIdx" name={tt('Margin index')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="nps"       name={tt('NPS')}          fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Tier membership trend — monthly (thousands)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={TIER_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="K" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="gold"     name={tt('Gold')}     stroke={AMBER}  strokeWidth={2.4} dot />
                <Line type="monotone" dataKey="silver"   name={tt('Silver')}   stroke={BLUE}   strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="platinum" name={tt('Platinum')} stroke={PURPLE} strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="bronze"   name={tt('Bronze')}   stroke={SLATE}  strokeWidth={1.4} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            <span className="text-[10px] text-vfes-dark/40">{tt('Bronze declining as members upgrade — positive signal')}</span>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ POINTS & LIABILITY ════════════════════════════════════ */}
      {tab === 'points' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total liability')}    value={`BSD ${latestLiability.toFixed(1)}M`} delta={tt('IFRS 15 deferred revenue')}    trend="flat" icon={Gift}          accent />
          <KpiCard label={tt('Earn rate')}           value="42.8%"                              delta={tt('of base actively earning')}   trend="up"   icon={TrendingUp}   />
          <KpiCard label={tt('Expiring in 90d')}     value="BSD 6.8M"                              delta={tt('pts · 134K members at risk')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Dormant pts holders')} value="22%"                                delta={tt('no activity 6 months')}       trend="down" icon={Activity}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Points liability & redemption — 8 quarters')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={LIABILITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" domain={[10, 22]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="liabilityM" name={tt('Liability BSD M')}   fill={NAVY} />
                  <Line yAxisId="r" type="monotone" dataKey="redeemed" name={tt('Redemption %')} stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Liability grows with enrolment; rising redemption keeps breakage within IFRS provisions.')}</div>
          </Panel>

          <Panel title={tt('Points earned vs expired per quarter')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={LIABILITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="earned"  name={tt('Earned %')}  fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expired" name={tt('Expired %')} fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Average points balance & dormant share by tier')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Tier')}</th>
                    <th className="text-right">{tt('Avg pts')}</th>
                    <th className="text-right">{tt('Dormant %')}</th>
                    <th className="text-right">{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {POINTS_BALANCE.map(p => (
                    <tr key={p.tier} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{p.tier}</td>
                      <td className="text-right font-bold font-mono">{p.avgPts.toLocaleString()} pts</td>
                      <td className={`text-right font-bold ${p.dormant >= 20 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.dormant}%</td>
                      <td className={`text-right text-xs ${p.dormant >= 20 ? 'text-amber-600 font-bold' : 'text-vfes-dark/55'}`}>{p.dormant >= 20 ? tt('Re-engage') : tt('Low')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Points expiry pipeline — by time horizon')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={POINTS_EXPIRY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="M" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="pts"     name={tt('Pts BSD M expiring')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="members" name={tt('Members at risk')} fill={SLATE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ REDEMPTION ════════════════════════════════════════════ */}
      {tab === 'redemption' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Redemption rate')}    value={`${CUST.redemptionPct}%`} delta={tt('+3 pp YoY')}             trend="up"   icon={Star}       accent />
          <KpiCard label={tt('Digital redemption')} value="77%"                       delta={tt('of all redemptions')}   trend="up"   icon={Activity}   />
          <KpiCard label={tt('Avg pts redeemed')}   value="380 pts"                   delta={tt('per transaction')}      trend="up"   icon={Gift}       />
          <KpiCard label={tt('Redemption cost')}    value="BSD 22.5M"                    delta={tt('annualised FY2026')}    trend="flat" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Redemption rate & digital channel — trend (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={REDEMPTION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="rate"    name={tt('Redemption rate %')} stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="digital" name={tt('Digital share %')}   stroke={GREEN} strokeWidth={2}   dot={false} strokeDasharray="4 4" />
                  <ReferenceLine y={30} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber line = 30% annual target')}</div>
          </Panel>

          <Panel title={tt('Redemption mix by reward type')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={REWARDS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 50]} />
                  <YAxis type="category" dataKey="reward" tick={{ fontSize: 9 }} width={160} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="share" name={tt('Share %')} radius={[0, 4, 4, 0]}>
                    {REWARDS.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Bill credit dominates — partner perks have headroom and higher satisfaction scores.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Redemption rate & avg pts redeemed by tier')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={REDEMPTION_BY_TIER}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" pts" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="rate"    name={tt('Redemption rate %')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                <Bar yAxisId="r" dataKey="avg_pts" name={tt('Avg pts redeemed')} fill={AMBER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/promotions" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Promotions →')}</Link>
            <span className="text-[10px] text-vfes-dark/40">{tt('Platinum redeems 3× more pts per transaction — keeps liability manageable')}</span>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ REWARDS CATALOGUE ═════════════════════════════════════ */}
      {tab === 'rewards' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active partners')}  value="5"     delta={tt('+ 2 in pipeline')}    trend="up"   icon={Award}     accent />
          <KpiCard label={tt('Top satisfaction')} value="91%"   delta={tt('Charity donation')}   trend="up"   icon={Star}      />
          <KpiCard label={tt('Top take-up')}       value="9.1%"  delta={tt('Amazon Premium')}     trend="up"   icon={TrendingUp} />
          <KpiCard label={tt('New partners Q3')}  value="2"     delta={tt('BTC TV+ · Booking.com')} trend="up"   icon={Calendar}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Partner catalogue — all rewards')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Partner')}</th>
                    <th>{tt('Category')}</th>
                    <th className="text-right">{tt('Min pts')}</th>
                    <th className="text-right">{tt('Take %')}</th>
                    <th>{tt('Margin')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PARTNERS.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{p.partner}</td>
                      <td className="text-xs text-vfes-dark/65">{p.category}</td>
                      <td className="text-right font-mono text-xs">{p.ptsRequired.toLocaleString()}</td>
                      <td className="text-right font-bold text-xs">{p.take}%</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(p.margin === 'High' ? 'Low' : p.margin === 'Med' ? 'Med' : 'High')}`}>{tt(p.margin)}</span></td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stP(p.status)}`}>{tt(p.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Partner redemption volume')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={PARTNER_PERF} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="partner" tick={{ fontSize: 8 }} width={140} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="redemptions" name={tt('Redemptions')} fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/sales" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Sales →')}</Link>
              <span className="text-[10px] text-vfes-dark/40">{tt('Amazon & Kinepolis drive 60% of partner redemptions')}</span>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Reward satisfaction score by type (%)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={REWARDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="reward" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[60, 100]} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="satisfaction" name={tt('Satisfaction %')} radius={[4, 4, 0, 0]}>
                  {REWARDS.map((r, i) => <Cell key={i} fill={r.satisfaction >= 88 ? GREEN : r.satisfaction >= 78 ? BLUE : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CONSENT & REACH ════════════════════════════════════════ */}
      {tab === 'consent' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SMS reach')}   value={`${CUST.contactable.sms}%`}   delta={tt('2.14M contactable')}  trend="up"   icon={Mail}        accent />
          <KpiCard label={tt('Email reach')} value={`${CUST.contactable.email}%`} delta={tt('1.97M contactable')}  trend="up"   icon={Mail}        />
          <KpiCard label={tt('Push reach')}  value={`${CUST.contactable.push}%`}  delta={tt('1.68M contactable')}  trend="up"   icon={Bell}        />
          <KpiCard label={tt('All-channel')} value="34%"                           delta={tt('consented to all 5')} trend="up"   icon={ShieldCheck} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['pct', 'reachM'] as const).map(k => (
            <button key={k} onClick={() => setConsentSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${consentSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'pct' ? tt('Opt-in %') : tt('Reach M')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Consent opt-in rates by channel')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Channel')}</th>
                    <th className="text-right">{tt('Opt-in %')}</th>
                    <th className="text-right">{tt('Reach M')}</th>
                    <th className="text-right">{tt('Trend QoQ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedConsent.map(c => (
                    <tr key={c.ch} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{tt(c.ch)}</td>
                      <td className={`text-right font-bold ${c.pct >= 70 ? 'text-emerald-600' : c.pct >= 55 ? 'text-blue-600' : 'text-amber-600'}`}>{c.pct}%</td>
                      <td className="text-right font-mono">{c.reachM}M</td>
                      <td className={`text-right font-bold ${c.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{c.trend > 0 ? '+' : ''}{c.trend} pp</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Marketing campaigns →')}</Link>
              <Link to="/portal/contact-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Contact Center →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Consent trend by channel — 6 months (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={CONSENT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[28, 80]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="sms"   name="SMS"      stroke={BLUE}   strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="email" name="Email"    stroke={NAVY}   strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="push"  name="Push"     stroke={GREEN}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="wa"    name="WhatsApp" stroke={PURPLE} strokeWidth={2}   strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Preference centre — topic opt-in rates (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={PREF_TOPICS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="topic" tick={{ fontSize: 9 }} width={170} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="opted"    name={tt('Opted in')} stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="declined" name={tt('Declined')} stackId="a" fill={SLATE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
              <span className="text-[10px] text-vfes-dark/40">{tt('Third-party deals lowest opt-in — consent-wall not viable')}</span>
            </div>
          </Panel>

          <Panel title={tt('Opt-in funnel (% of 2.9M base)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={OPT_IN_FUNNEL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="step" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 110]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="value" name={tt('% of base')} radius={[4, 4, 0, 0]}>
                    {OPT_IN_FUNNEL.map((_, i) => <Cell key={i} fill={[NAVY, BLUE, GREEN, AMBER, PURPLE][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ GDPR / PRIVACY ════════════════════════════════════════ */}
      {tab === 'gdpr' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Compliance score')}    value="98.4%"   delta={tt('consent coverage')}        trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('DSAR SLA compliance')} value="100%"    delta={tt('all within 30 days')}      trend="up"   icon={FileCheck}    />
          <KpiCard label={tt('Consents expiring')}   value="37K"     delta={tt('within 90 days')}          trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Active purposes')}     value="6"       delta={tt('GDPR Art.6 lawful bases')} trend="flat" icon={Lock}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Lawful basis:')}</span>
          {(['All', 'Consent', 'Contract'] as const).map(k => (
            <button key={k} onClick={() => setGdprFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${gdprFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(k)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('GDPR processing purposes — consent rates & expiry risk')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Purpose')}</th>
                    <th>{tt('Lawful basis')}</th>
                    <th className="text-right">{tt('Coverage %')}</th>
                    <th className="text-right">{tt('Expiring 90d')}</th>
                    <th>{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGdpr.map(p => (
                    <tr key={p.purpose} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{p.purpose}</td>
                      <td className="text-xs text-vfes-dark/65">{p.lawful}</td>
                      <td className={`text-right font-bold ${p.rate >= 90 ? 'text-emerald-600' : p.rate >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>{p.rate}%</td>
                      <td className={`text-right font-mono text-xs ${p.expiring90d > 10000 ? 'text-red-600 font-bold' : p.expiring90d > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.expiring90d.toLocaleString()}</td>
                      <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ragC(p.risk)}`}>{tt(p.risk)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/portal/regulatory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Regulatory →')}</Link>
              <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('DSAR requests — received vs resolved monthly')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={DSAR_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="received" name={tt('Received')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name={tt('Resolved')} fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('100% DSAR SLA compliance year-to-date — all resolved within 30-day illustrative window.')}</div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-transparent border border-purple-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-purple-700 mb-1">{tt('Privacy & Regulatory')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Full GDPR register, DPO dashboard, Bahamian DPA interaction log and ePrivacy consent mapping.')}
            </div>
          </div>
          <Link to="/portal/regulatory" className="bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-purple-800 flex items-center gap-2 shrink-0">
            <Lock className="w-4 h-4" />{tt('Open Regulatory →')}
          </Link>
        </div>
      </>)}

      {/* ══════════════ CONSENT AUDIT ══════════════════════════════════════════ */}
      {tab === 'audit' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Events today')}      value="142"    delta={tt('consent changes')}         trend="flat" icon={FileCheck}     accent />
          <KpiCard label={tt('Withdrawals MTD')}   value="2,840"  delta={tt('chiefly marketing SMS')}   trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('New opt-ins MTD')}   value="8,420"  delta={tt('net +5,580')}              trend="up"   icon={BadgeCheck}   />
          <KpiCard label={tt('Erasure requests')}  value="12"     delta={tt('all within 30d SLA')}      trend="up"   icon={Lock}         />
        </div>

        <Panel title={tt('Consent audit trail — recent events')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('Event')}</th>
                  <th>{tt('Channel')}</th>
                  <th>{tt('Timestamp')}</th>
                  <th>{tt('Status')}</th>
                  <th>{tt('Impact')}</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map(a => (
                  <tr key={a.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-mono text-xs">{a.id}</td>
                    <td className="font-semibold text-xs max-w-[200px]">{a.event}</td>
                    <td className="text-xs text-vfes-dark/65">{a.channel}</td>
                    <td className="font-mono text-xs text-vfes-dark/65">{a.ts}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stP(a.status)}`}>{tt(a.status)}</span></td>
                    <td className="text-xs text-vfes-dark/65">{a.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Center →')}</Link>
            <span className="text-[10px] text-vfes-dark/40">·</span>
            <Link to="/portal/regulatory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
            <span className="text-[10px] text-vfes-dark/40">·</span>
            <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Consent state changes — 6-month volume')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CONSENT_TREND.map((d, i) => ({ m: d.m, withdrawn: [280,220,310,290,340,284][i], gained: [820,760,940,890,1020,842][i] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="gained"    name={tt('New opt-ins')} fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawn" name={tt('Withdrawals')} fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Net consent balance — monthly net change')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={CONSENT_TREND.map((d, i) => ({ m: d.m, net: [540,540,630,600,680,558][i] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="net" name={tt('Net change')} stroke={BLUE} fill={BLUE} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('AI Insights')}</div>
            <div className="text-sm text-vfes-dark/80">
              {tt('Full loyalty model scorecard, consent decay predictions and re-permission wave builder.')}
            </div>
          </div>
          <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
            <Activity className="w-4 h-4" />{tt('Open AI Insights →')}
          </Link>
        </div>
      </>)}

      {/* ── Cross-domain quick links (all tabs) ───────────────────────────── */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Loyalty tier distribution (% of enrolled base)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={TIERS.map(t => ({ name: t.tier, value: t.members }))} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {TIERS.map((_, i) => <Cell key={i} fill={[SLATE, BLUE, AMBER, PURPLE][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => v.toLocaleString('en-BS')} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={tt('Redemption rate by tier — current quarter')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={REDEMPTION_BY_TIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 60]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="rate" name={tt('Redemption %')} radius={[4, 4, 0, 0]}>
                    {REDEMPTION_BY_TIER.map((_, i) => <Cell key={i} fill={[SLATE, BLUE, AMBER, PURPLE][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/40 mb-3">{tt('Related pages')}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/executive"        className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Executive →')}</Link>
          <Link to="/portal/customer-360"     className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Customer 360 →')}</Link>
          <Link to="/portal/clv"              className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('CLV →')}</Link>
          <Link to="/portal/churn-retention"  className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Churn & Retention →')}</Link>
          <Link to="/portal/marketing"        className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Marketing →')}</Link>
          <Link to="/portal/promotions"       className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Promotions →')}</Link>
          <Link to="/portal/contact-center"   className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Contact Center →')}</Link>
          <Link to="/portal/voc"              className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Voice of Customer →')}</Link>
          <Link to="/portal/base-management"  className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Base Management →')}</Link>
          <Link to="/portal/trust-center"     className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Trust Center →')}</Link>
          <Link to="/portal/regulatory"       className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Regulatory →')}</Link>
          <Link to="/portal/ai-insights"      className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('AI Insights →')}</Link>
          <Link to="/portal/agents"           className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Agents →')}</Link>
          <Link to="/portal/digital-app"      className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Digital App →')}</Link>
          <Link to="/portal/bundle-propensity" className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Bundle Propensity →')}</Link>
          <Link to="/portal/experience"       className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/65 hover:bg-vfes-red/10 hover:text-vfes-dark transition">{tt('Experience →')}</Link>
        </div>
      </div>
    </div>
  )
}
