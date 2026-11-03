import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Tag, TrendingDown, TrendingUp, AlertTriangle, Brain, ChevronRight,
  Percent, Calendar, BarChart2, FlaskConical, ShieldCheck,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine, PieChart, Pie,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'

// ─── Promo catalog ──────────────────────────────────────────────────────────
const PROMOS = [
  { promo: 'MEGADEAL 50% / 6mo',      take: 22, marginGiveK: 412, day90Churn: 22, roi: 0.8, uplift: 8.2,  cannibal: 12.4, verdict: 'retire', segment: 'Mass market' },
  { promo: 'Convergent -BSD 20 / 6mo',   take: 18, marginGiveK: 286, day90Churn: 11, roi: 2.4, uplift: 12.1, cannibal:  4.8, verdict: 'keep',   segment: 'Convergent' },
  { promo: 'Fibre 1Gb -BSD 10 / 12mo',   take: 31, marginGiveK: 198, day90Churn:  8, roi: 3.1, uplift: 18.4, cannibal:  2.1, verdict: 'keep',   segment: 'Fixed broadband' },
  { promo: 'Mobile 2nd line -50%',     take: 14, marginGiveK: 142, day90Churn:  9, roi: 2.0, uplift:  7.6, cannibal:  5.2, verdict: 'tune',   segment: 'Mobile' },
  { promo: 'Black Friday device BSD 0',   take:  9, marginGiveK:  96, day90Churn: 14, roi: 1.2, uplift:  4.8, cannibal:  3.8, verdict: 'tune',   segment: 'Device' },
  { promo: 'Roaming +US -BSD 5 / 3mo',   take: 11, marginGiveK:  62, day90Churn:  7, roi: 2.8, uplift:  6.2, cannibal:  1.4, verdict: 'keep',   segment: 'Mobile' },
  { promo: 'SME bundle -15% 12mo',     take:  8, marginGiveK:  88, day90Churn:  6, roi: 3.4, uplift:  9.1, cannibal:  0.8, verdict: 'keep',   segment: 'B2B SME' },
]

// ─── ROI trend ───────────────────────────────────────────────────────────────
const ROI_TREND = [
  { m: 'Jun', avgROI: 1.8, bestROI: 2.8, worstROI: 0.8 },
  { m: 'Jul', avgROI: 1.9, bestROI: 2.9, worstROI: 0.8 },
  { m: 'Aug', avgROI: 2.0, bestROI: 3.0, worstROI: 0.9 },
  { m: 'Sep', avgROI: 2.1, bestROI: 3.1, worstROI: 0.9 },
  { m: 'Oct', avgROI: 2.2, bestROI: 3.2, worstROI: 1.0 },
  { m: 'Nov', avgROI: 2.3, bestROI: 3.4, worstROI: 1.2 },
]

// ─── Give-away trend ─────────────────────────────────────────────────────────
const GIVEAWAY_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i],
  givePct: 8.4 - i * 0.18 + (i === 3 ? 2.2 : 0),
  target: 7.0,
}))

// ─── Give-away by segment ────────────────────────────────────────────────────
const GIVEAWAY_SEG = [
  { seg: 'Mass market', giveK: 412, pct: 37.5 },
  { seg: 'Convergent',  giveK: 286, pct: 26.0 },
  { seg: 'Fixed BB',    giveK: 198, pct: 18.0 },
  { seg: 'Mobile',      giveK: 204, pct: 18.5 },
]

// ─── Promo cliff ─────────────────────────────────────────────────────────────
const CLIFF = [
  { cohort: 'Promo end · Mar', subs: 24800, churnAtCliff: 18 },
  { cohort: 'Promo end · Apr', subs: 31200, churnAtCliff: 22 },
  { cohort: 'Promo end · May', subs: 27600, churnAtCliff: 16 },
  { cohort: 'Promo end · Jun', subs: 29400, churnAtCliff: 19 },
  { cohort: 'Promo end · Jul', subs: 22100, churnAtCliff: 14 },
  { cohort: 'Promo end · Aug', subs: 18600, churnAtCliff: 11 },
]

// ─── Step-down treatment cohort ──────────────────────────────────────────────
const STEPDOWN = [
  { cohort: 'Control (no action)',       churn30: 14.2, churn60: 20.8, churn90: 22.1 },
  { cohort: 'Email + step-down offer',   churn30:  9.4, churn60: 13.2, churn90: 14.8 },
  { cohort: 'Outbound call',             churn30:  7.8, churn60: 11.4, churn90: 12.6 },
  { cohort: 'App push + step-down',      churn30:  8.6, churn60: 12.1, churn90: 13.4 },
]

// ─── A/B tests ───────────────────────────────────────────────────────────────
const AB_TESTS = [
  { test: 'Fibre promo: -BSD 10 vs -BSD 15',   status: 'Concluded', winner: '-BSD 10 / 12mo', liftPct: 4.2,  uplift: '+BSD 0.18M/yr margin' },
  { test: 'Bundle: device vs services',   status: 'Concluded', winner: 'Services',    liftPct: 8.1,  uplift: '+BSD 0.34M/yr margin' },
  { test: 'Cliff: email vs push',          status: 'Live',      winner: 'TBD',         liftPct: null, uplift: '20K subs in test'  },
  { test: 'SME: -15% vs free month',      status: 'Planned',   winner: '—',           liftPct: null, uplift: 'Start Jan 2027'    },
]

// ─── Calendar ────────────────────────────────────────────────────────────────
const CALENDAR = [
  { month: 'Dec', event: 'Roaming summer push',     segment: 'Mobile',    budget: 'BSD 380K',  status: 'live'    },
  { month: 'Jan', event: 'Back to School device',   segment: 'Device',    budget: 'BSD 220K',  status: 'live'    },
  { month: 'Feb', event: 'Convergent autumn promo', segment: 'Convergent',budget: 'BSD 640K',  status: 'planned' },
  { month: 'Mar', event: 'SME quarter-end offer',   segment: 'B2B SME',   budget: 'BSD 180K',  status: 'planned' },
  { month: 'Apr', event: 'Black Friday 2026',        segment: 'Mass market',budget: 'BSD 1.1M', status: 'planned' },
  { month: 'May', event: 'Christmas bundle',         segment: 'Convergent',budget: 'BSD 820K', status: 'planned' },
]

// ─── Governance ──────────────────────────────────────────────────────────────
const APPROVALS = [
  { req: 'Retention discount > 30%',  policy: 'Manager approval', breaches: 142, status: 'enforced' },
  { req: 'Stacked promos (>1 active)',policy: 'Blocked',           breaches:  38, status: 'enforced' },
  { req: 'Below-floor pricing',       policy: 'CFO sign-off',      breaches:   6, status: 'enforced' },
  { req: 'Promo > 12 months',         policy: 'Auto-expire',       breaches:  21, status: 'warn'     },
  { req: 'Cross-segment stacking',    policy: 'Blocked',           breaches:   4, status: 'enforced' },
]

type TabId = 'register' | 'roi' | 'leakage' | 'cliff' | 'abtests' | 'calendar' | 'governance' | 'cannibalism'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'register',    label: 'Promo Register',   icon: Tag           },
  { id: 'roi',         label: 'ROI Analysis',     icon: TrendingUp    },
  { id: 'leakage',     label: 'Margin Give-away', icon: TrendingDown  },
  { id: 'cliff',       label: 'Promo Cliff',      icon: AlertTriangle },
  { id: 'abtests',     label: 'A/B Tests',        icon: FlaskConical  },
  { id: 'calendar',    label: 'Promo Calendar',   icon: Calendar      },
  { id: 'governance',  label: 'Discount Policy',  icon: ShieldCheck   },
  { id: 'cannibalism', label: 'Cannibalism',      icon: BarChart2     },
]

const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

export default function PromotionsPage() {
  const { i18n } = useTranslation()

  // ─── Hooks ───────────────────────────────────────────────────────────────
  const [tab, setTab]             = useState<TabId>('register')
  const [promoSort, setPromoSort] = useState<'roi' | 'take' | 'marginGiveK'>('roi')
  const [cliffView, setCliffView] = useState<'all' | 'stepdown'>('all')
  const [giveSegFilter, setGiveSegFilter] = useState<'all' | 'Mobile' | 'Fixed' | 'Convergent'>('all')
  const [calMonth, setCalMonth]   = useState<string>('All')
  const [abFilter, setAbFilter]   = useState<'All' | 'Concluded' | 'Live' | 'Planned'>('All')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]   = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sortedPromos = useMemo(
    () => [...PROMOS].sort((a, b) => b[promoSort] - a[promoSort]),
    [promoSort],
  )

  const filteredAb = useMemo(
    () => abFilter === 'All' ? AB_TESTS : AB_TESTS.filter(t => t.status === abFilter),
    [abFilter],
  )

  const filteredCalendar = useMemo(
    () => calMonth === 'All' ? CALENDAR : CALENDAR.filter(c => c.month === calMonth),
    [calMonth],
  )

  const totalGiveK = PROMOS.reduce((s, p) => s + p.marginGiveK, 0)
  const bestROI    = Math.max(...PROMOS.map(p => p.roi))
  const verdictColor = (v: string) =>
    v === 'keep' ? 'bg-emerald-50 text-emerald-700' : v === 'tune' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Promotions & Discount Governance')}
        subtitle={tt('Offer catalog · ROI · uplift & cannibalism · redemption · A/B tests · calendar · governance')}
        actions={
          <div className="flex items-center gap-2">
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">BSD {(totalGiveK / 1000).toFixed(1)}M/mo {tt('give-away')}</span>
            {liveTime && <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">{liveTime}</span>}
          </div>
        }
      />

      {/* ── ML Insight Section ─────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Promotions intelligence"
        models={[
          { name: 'Promo ROI Predictor',   metric: 'R² 0.86',   sub: 'true ROI net of Day-90 churn' },
          { name: 'Uplift Estimator',       metric: '+12.1% avg', sub: 'incremental gross adds' },
          { name: 'Cliff Churn Predictor',  metric: 'recall 0.87', sub: 'promo-end churn early-warning' },
        ]}
        agentLabel={tt('Run Promo Audit')}
        agentRunningLabel={tt('Auditing…')}
        agentSteps={[
          tt('Joined promo take-up, margin give-away and Day-90 cohort churn'),
          tt('Computed true ROI net of Day-90 churn for all active promotions'),
          tt('Classified each promo: keep / tune / retire with margin guardrails'),
          tt('Drafted promo calendar and A/B test recommendations for Q3'),
        ]}
        agentBlurb={tt('Promotions drive short-term volume — but only if the Day-90 churn is controlled. True ROI accounts for both the acquisition benefit and the post-promo churn cost.')}
        decision={{
          title:   tt('Retire MEGADEAL; reallocate budget to the 3.1× fibre promo'),
          detail:  tt('MEGADEAL (0.8× ROI, 22% Day-90 churn) is value-destructive. Retiring it and shifting budget to the fibre 1Gb promo (3.1× ROI, 8% churn) recovers +BSD 0.4M/mo margin.'),
          impact:  tt('+BSD 0.4M/mo margin recovered · base quality improves'),
          risk:    tt('hero-promo retirement can temporarily dent headline gross-adds'),
          linkTo:  '#/portal/bundle-profitability',
          linkLabel: tt('Open Bundle Profitability'),
        }}
        chart={{
          kind: 'bar',
          title: tt('True ROI by promotion'),
          xKey: 'promo',
          data: PROMOS.map(p => ({ promo: p.promo.slice(0, 22), roi: p.roi })),
          series: [{ key: 'roi', name: tt('True ROI ×'), color: BLUE }],
          colorBy: { key: 'roi', high: 2.5, mid: 1.0 },
          note: tt('ROI < 1.0 = value-destructive. ROI > 2.0 = strong. Target: all active promos > 1.5×.'),
        }}
      />

      {/* ── Alert ─────────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('MEGADEAL: 0.8× ROI and 22% Day-90 churn · Apr cliff cohort: 31,200 subs at risk')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Governance: promo-duration auto-expire rule at warn-only — needs enforcement. 21 zombie promos active.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/churn-retention" className="text-xs font-bold text-amber-900 hover:underline">{tt('Churn →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Margin give-away / mo')}    value={`BSD ${(totalGiveK / 1000).toFixed(1)}M`} delta={tt('-1.8 pp of revenue YoY')} trend="up"   icon={TrendingDown} accent />
        <KpiCard label={tt('Active promotions')}          value={`${PROMOS.length}`}                   delta={tt('1 flagged to retire')}      trend="flat" icon={Tag}                />
        <KpiCard label={tt('Best promo ROI')}             value={`${bestROI.toFixed(1)}×`}             delta={tt('Fibre 1Gb — keep & scale')} trend="up"   icon={TrendingUp}         />
        <KpiCard label={tt('Discount-policy breaches')}  value="211"                                   delta={tt('auto-flagged this month')}   trend="down" icon={AlertTriangle}      />
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
            }`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══ REGISTER ══════════════════════════════════════════════════════════ */}
      {tab === 'register' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['roi', 'take', 'marginGiveK'] as const).map(k => (
            <button key={k} onClick={() => setPromoSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                promoSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'roi' ? tt('ROI') : k === 'take' ? tt('Take rate') : tt('Give-away')}
            </button>
          ))}
        </div>

        <Panel title={tt('Promotion register — ROI, Day-90 churn, uplift & verdict')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Promotion')}</th>
                  <th className="px-3 py-2">{tt('Segment')}</th>
                  <th className="px-3 py-2 text-right">{tt('Take %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Give BSD K/mo')}</th>
                  <th className="px-3 py-2 text-right">{tt('Day-90 churn')}</th>
                  <th className="px-3 py-2 text-right">{tt('Uplift %')}</th>
                  <th className="px-3 py-2 text-right">{tt('True ROI')}</th>
                  <th className="px-3 py-2">{tt('Verdict')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPromos.map(p => (
                  <tr key={p.promo} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(p.promo)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/60">{tt(p.segment)}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.take}%</td>
                    <td className="px-3 py-2 text-right font-mono">BSD {p.marginGiveK}K</td>
                    <td className={`px-3 py-2 text-right font-mono ${
                      p.day90Churn > 15 ? 'text-red-600 font-bold' : p.day90Churn > 10 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{p.day90Churn}%</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">{p.uplift}%</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${
                      p.roi >= 2 ? 'text-emerald-600' : p.roi >= 1 ? 'text-amber-600' : 'text-red-600'
                    }`}>{p.roi.toFixed(1)}×</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${verdictColor(p.verdict)}`}>{tt(p.verdict)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" />{tt('MEGADEAL: 0.8× ROI and 22% Day-90 churn — value-destructive, retire it.')}
            <ChevronRight className="w-3 h-3" />
          </div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('ROI vs Day-90 churn — scatter by promo')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedPromos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="promo" tick={{ fontSize: 7 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="roi"        name={tt('ROI ×')}          fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="day90Churn" name={tt('Day-90 churn %')} fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Uplift vs cannibalism by promo (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={sortedPromos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="promo" tick={{ fontSize: 7 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="uplift"   name={tt('Uplift %')}       fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cannibal" name={tt('Cannibalism %')}  fill={RED}   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ ROI ══════════════════════════════════════════════════════════════ */}
      {tab === 'roi' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Best ROI')}        value={`${bestROI.toFixed(1)}×`} delta={tt('Fibre 1Gb — keep')}            trend="up"   icon={TrendingUp}  accent />
          <KpiCard label={tt('Worst ROI')}       value="0.8×"                      delta={tt('MEGADEAL — retire')}         trend="down" icon={TrendingDown}       />
          <KpiCard label={tt('Avg portfolio ROI')} value="2.3×"                   delta={tt('+0.5 YTD')}                   trend="up"   icon={BarChart2}          />
          <KpiCard label={tt('Promos to retire')} value="1"                        delta={tt('value-destructive threshold')} trend="flat" icon={AlertTriangle}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Average portfolio ROI trend — 6 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={ROI_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="×" domain={[0, 4]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avgROI"   name={tt('Avg ROI')}   stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="bestROI"  name={tt('Best ROI')}  stroke={GREEN} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="worstROI" name={tt('Worst ROI')} stroke={RED}   strokeWidth={1.8} strokeDasharray="2 4" dot={false} />
                  <ReferenceLine y={1.0} stroke={RED}  strokeDasharray="3 3" />
                  <ReferenceLine y={2.0} stroke={GREEN} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Red line = break-even (1.0×) · Green line = target (2.0×). Avg ROI improving as governance tightens.')}</div>
          </Panel>

          <Panel title={tt('ROI distribution — pie by verdict')}>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: tt('Keep'),   value: PROMOS.filter(p => p.verdict === 'keep').length,   fill: GREEN  },
                      { name: tt('Tune'),   value: PROMOS.filter(p => p.verdict === 'tune').length,   fill: AMBER  },
                      { name: tt('Retire'), value: PROMOS.filter(p => p.verdict === 'retire').length, fill: RED    },
                    ]}
                    dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  >
                    {[GREEN, AMBER, RED].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link to="/portal/bundle-profitability" className="font-bold text-vfes-dark hover:underline">{tt('Bundle Profitability →')}</Link>
          <Link to="/portal/pricing-simulator"    className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator →')}</Link>
          <Link to="/portal/finance"              className="font-bold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
        </div>
      </>)}

      {/* ══ LEAKAGE ══════════════════════════════════════════════════════════ */}
      {tab === 'leakage' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Give-away / mo')}       value={`BSD ${(totalGiveK / 1000).toFixed(1)}M`} delta={tt('8.6% of revenue')}      trend="up"   icon={TrendingDown} accent />
          <KpiCard label={tt('Highest segment')}       value="Mass market"                            delta={tt('BSD 412K — retire target')}  trend="down" icon={AlertTriangle}       />
          <KpiCard label={tt('Lowest segment')}        value="B2B SME"                                delta={tt('BSD 88K — best ratio')}      trend="up"   icon={TrendingUp}         />
          <KpiCard label={tt('Target give-away')}      value="≤7%"                                   delta={tt('of revenue')}              trend="flat" icon={Percent}            />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Segment:')}</span>
          {(['all', 'Mobile', 'Fixed', 'Convergent'] as const).map(k => (
            <button key={k} onClick={() => setGiveSegFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                giveSegFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {tt(k === 'all' ? 'All segments' : k)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Margin give-away as % of revenue — 12 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={GIVEAWAY_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[5, 12]} unit="%" />
                  <Tooltip contentStyle={TS} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="givePct" name={tt('Give-away %')} fill={BLUE} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" name={tt('Target 7%')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Dec Black-Friday spike aside, discount intensity is trending down as governance tightens.')}</div>
          </Panel>

          <Panel title={tt('Give-away split by segment (BSD K/mo)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={GIVEAWAY_SEG}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="seg" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="giveK" name={tt('Give-away BSD K')} radius={[4, 4, 0, 0]}>
                    {GIVEAWAY_SEG.map((_, i) => <Cell key={i} fill={[BLUE, AMBER, GREEN, PURPLE][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══ CLIFF ════════════════════════════════════════════════════════════ */}
      {tab === 'cliff' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Apr cliff cohort')} value="31,200" delta={tt('subs at 22% cliff churn')} trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Step-down lift')}   value="−7.3pp" delta={tt('outbound call treatment')}  trend="up"   icon={TrendingUp}        />
          <KpiCard label={tt('Cohorts on watch')} value="4"       delta={tt('rolling off H1 2027')}     trend="flat" icon={Calendar}          />
          <KpiCard label={tt('Treated subs')}     value="18,200" delta={tt('receiving step-down')}      trend="up"   icon={ShieldCheck}       />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['all', 'stepdown'] as const).map(k => (
            <button key={k} onClick={() => setCliffView(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                cliffView === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>
              {k === 'all' ? tt('All cohorts') : tt('Step-down treatment')}
            </button>
          ))}
        </div>

        {cliffView === 'all' ? (
          <Panel title={tt('Promo-cliff churn — cohorts rolling off promo')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={CLIFF}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TS}
                    formatter={(v: any, _n: any, p: any) => [
                      `${v}% churn · ${p.payload.subs.toLocaleString('en-BS')} subs`, tt('Cohort'),
                    ]}
                  />
                  <ReferenceLine y={20} stroke={RED} strokeDasharray="3 3" />
                  <Bar dataKey="churnAtCliff" radius={[6, 6, 0, 0]}>
                    {CLIFF.map((c, i) => <Cell key={i} fill={c.churnAtCliff >= 20 ? RED : c.churnAtCliff >= 15 ? AMBER : GREEN} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Apr cohort churns 22% at promo-end — pre-empt with a step-down offer 30 days out.')}
            </div>
          </Panel>
        ) : (
          <Panel title={tt('Step-down treatment — churn at 30 / 60 / 90 days by cohort type')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={STEPDOWN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="cohort" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="churn30" name={tt('Churn 30d %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churn60" name={tt('Churn 60d %')} fill={AMBER} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churn90" name={tt('Churn 90d %')} fill={RED}   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Outbound call is the most effective treatment — saves 9.5pp at Day-90 vs control.')}</div>
          </Panel>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline">{tt('Open Churn & Retention →')}</Link>
          <Link to="/portal/customer-360"    className="font-bold text-vfes-dark hover:underline">{tt('Open Customer 360 →')}</Link>
        </div>
      </>)}

      {/* ══ A/B TESTS ════════════════════════════════════════════════════════ */}
      {tab === 'abtests' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Tests concluded')} value="2" delta={tt('winners implemented')}  trend="up"   icon={FlaskConical} accent />
          <KpiCard label={tt('Tests live')}       value="1" delta={tt('cliff email vs push')}  trend="flat" icon={FlaskConical}       />
          <KpiCard label={tt('Tests planned')}    value="1" delta={tt('SME bundle — Aug')}     trend="flat" icon={Calendar}          />
          <KpiCard label={tt('Avg lift per test')} value="+6.2%" delta={tt('uplift on winner')} trend="up"   icon={TrendingUp}       />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['All', 'Concluded', 'Live', 'Planned'] as const).map(k => (
            <button key={k} onClick={() => setAbFilter(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                abFilter === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>{tt(k)}</button>
          ))}
        </div>

        <Panel title={tt('A/B test register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Test')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Winner')}</th>
                  <th className="px-3 py-2 text-right">{tt('Lift %')}</th>
                  <th className="px-3 py-2">{tt('Margin impact')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAb.map(t => (
                  <tr key={t.test} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(t.test)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'Concluded' ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'Live' ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-50 text-slate-600'
                      }`}>{tt(t.status)}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-xs">{t.winner}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {t.liftPct !== null ? `+${t.liftPct}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{t.uplift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/digital-funnel" className="font-bold text-vfes-dark hover:underline">{tt('Digital Funnel →')}</Link>
          <Link to="/portal/marketing"      className="font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
          <Link to="/portal/ai-insights"    className="font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}

      {/* ══ CALENDAR ═════════════════════════════════════════════════════════ */}
      {tab === 'calendar' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live campaigns')}    value="2"      delta={tt('Jul–Jan 2027')}           trend="flat" icon={Calendar}   accent />
          <KpiCard label={tt('Planned campaigns')} value="4"      delta={tt('Sep–May 2027')}           trend="flat" icon={Calendar}        />
          <KpiCard label={tt('H2 budget')}          value="BSD 2.7M" delta={tt('approved')}               trend="flat" icon={Percent}        />
          <KpiCard label={tt('Black Friday budget')} value="BSD 1.1M" delta={tt('largest campaign')}     trend="flat" icon={Tag}            />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Month:')}</span>
          {(['All', ...CALENDAR.map(c => c.month)] as const).map(k => (
            <button key={k} onClick={() => setCalMonth(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                calMonth === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'
              }`}>{k}</button>
          ))}
        </div>

        <Panel title={tt('Promotional calendar — H1 2027')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Month')}</th>
                  <th className="px-3 py-2">{tt('Campaign')}</th>
                  <th className="px-3 py-2">{tt('Segment')}</th>
                  <th className="px-3 py-2 text-right">{tt('Budget')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalendar.map(c => (
                  <tr key={c.event} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono font-semibold">{c.month}</td>
                    <td className="px-3 py-2 font-semibold text-xs">{tt(c.event)}</td>
                    <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt(c.segment)}</td>
                    <td className="px-3 py-2 text-right font-bold">{c.budget}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                      }`}>{tt(c.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/sales"    className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
            <Link to="/portal/product"  className="font-bold text-vfes-dark hover:underline">{tt('Product →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══ GOVERNANCE ═══════════════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Policy breaches / mo')} value="211"   delta={tt('auto-flagged')}         trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Enforced controls')}     value="4"     delta={tt('of 5 active policies')}  trend="up"   icon={ShieldCheck}       />
          <KpiCard label={tt('Warn-only controls')}    value="1"     delta={tt('auto-expire — upgrade')} trend="flat" icon={AlertTriangle}     />
          <KpiCard label={tt('Below-floor breaches')}  value="6"     delta={tt('CFO review pending')}    trend="down" icon={Percent}           />
        </div>

        <Panel title={tt('Discount-policy controls & breach register')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Control')}</th>
                  <th className="px-3 py-2">{tt('Policy')}</th>
                  <th className="px-3 py-2 text-right">{tt('Breaches (mo)')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {APPROVALS.map(a => (
                  <tr key={a.req} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(a.req)}</td>
                    <td className="px-3 py-2 text-vfes-dark/70 text-xs">{tt(a.policy)}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.breaches}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        a.status === 'enforced' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{tt(a.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" />{tt('Promo-duration auto-expire only at warn — enforce to stop zombie promos eroding ARPU.')}
          </div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/finance"           className="font-bold text-vfes-dark hover:underline">{tt('Finance →')}</Link>
          <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline">{tt('Pricing Simulator →')}</Link>
          <Link to="/portal/price-wargame"     className="font-bold text-vfes-dark hover:underline">{tt('Price War-game →')}</Link>
        </div>
      </>)}

      {/* ══ CANNIBALISM ══════════════════════════════════════════════════════ */}
      {tab === 'cannibalism' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Highest cannibalism')} value="12.4%" delta={tt('MEGADEAL — mass market')}      trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Lowest cannibalism')}  value="0.8%"  delta={tt('SME bundle — isolated seg')}   trend="up"   icon={TrendingUp}        />
          <KpiCard label={tt('Avg uplift')}           value="9.5%" delta={tt('incremental gross adds')}       trend="up"   icon={TrendingUp}        />
          <KpiCard label={tt('Net incremental')}      value="+8.7%" delta={tt('uplift minus cannibalism')}    trend="up"   icon={TrendingUp}        />
        </div>

        <Panel title={tt('Uplift vs cannibalism — net incremental adds by promotion (%)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={PROMOS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="promo" width={200} tick={{ fontSize: 8 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="uplift"   name={tt('Uplift %')}       fill={GREEN} radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="cannibal" name={tt('Cannibalism %')}  fill={RED}   radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('MEGADEAL has the highest cannibalism (12.4%) — it cannibalises convergent customers more than it acquires new ones. This is the primary driver of its 0.8× ROI.')}
          </div>
        </Panel>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/channel-dealers"  className="font-bold text-vfes-dark hover:underline">{tt('Channel & Dealers →')}</Link>
          <Link to="/portal/mvno-wholesale"   className="font-bold text-vfes-dark hover:underline">{tt('MVNO & Wholesale →')}</Link>
          <Link to="/portal/b2b"              className="font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
        </div>
      </>)}

      {/* ── Permanent bottom section — always visible ──────────────────────── */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('ROI trend — portfolio average vs best vs worst (6 months)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={ROI_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="×" domain={[0, 4]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avgROI"   name={tt('Avg ROI')}   stroke={BLUE}  strokeWidth={2.4} dot />
                <Line type="monotone" dataKey="bestROI"  name={tt('Best ROI')}  stroke={GREEN} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="worstROI" name={tt('Worst ROI')} stroke={RED}   strokeWidth={1.8} strokeDasharray="2 4" dot={false} />
                <ReferenceLine y={1.0} stroke={RED}   strokeDasharray="3 3" />
                <ReferenceLine y={2.0} stroke={GREEN} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Average ROI improving as governance tightens — red line = break-even, green = target.')}</div>
        </Panel>

        <Panel title={tt('Give-away intensity vs 7% target (12 months)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <ComposedChart data={GIVEAWAY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[5, 12]} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar  dataKey="givePct" name={tt('Give-away %')}  fill={BLUE}  radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="target" name={tt('Target 7%')} stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Promo cliff waterfall ───────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Promo-cliff upcoming cohorts — subs at risk vs cliff churn %')}>
          <div className="h-52">
            <ResponsiveContainer>
              <ComposedChart data={CLIFF}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="cohort" stroke="#999" fontSize={9} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="%" />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="churnAtCliff" name={tt('Cliff churn %')} radius={[4, 4, 0, 0]}>
                  {CLIFF.map((c, i) => <Cell key={i} fill={c.churnAtCliff >= 20 ? RED : c.churnAtCliff >= 15 ? AMBER : GREEN} />)}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="subs" name={tt('Subs at risk')} stroke={NAVY} strokeWidth={1.6} strokeDasharray="4 4" dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Step-down arm comparison ────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Step-down treatment effectiveness — churn by arm (Day-30/60/90)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={STEPDOWN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="cohort" tick={{ fontSize: 8 }} angle={-10} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="churn30" name={tt('Day-30 %')} fill={GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="churn60" name={tt('Day-60 %')} fill={AMBER} radius={[4, 4, 0, 0]} />
                <Bar dataKey="churn90" name={tt('Day-90 %')} fill={RED}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-vfes-dark/55">
            {tt('Outbound call saves 9.5pp at Day-90 vs control. App push preferred at scale for cost efficiency.')}
          </div>
        </Panel>
      </div>

      {/* ── Full promo portfolio ────────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Full promo portfolio — all promotions with cannibalism data')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Promotion')}</th>
                  <th className="px-3 py-2">{tt('Segment')}</th>
                  <th className="px-3 py-2 text-right">{tt('Take %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Give BSD K')}</th>
                  <th className="px-3 py-2 text-right">{tt('Uplift %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Cannibal %')}</th>
                  <th className="px-3 py-2 text-right">{tt('ROI')}</th>
                  <th className="px-3 py-2">{tt('Verdict')}</th>
                </tr>
              </thead>
              <tbody>
                {PROMOS.map(p => (
                  <tr key={p.promo} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(p.promo)}</td>
                    <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt(p.segment)}</td>
                    <td className="px-3 py-2 text-right font-mono">{p.take}%</td>
                    <td className="px-3 py-2 text-right font-mono">BSD {p.marginGiveK}K</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">{p.uplift}%</td>
                    <td className={`px-3 py-2 text-right font-mono ${p.cannibal > 8 ? 'text-red-600 font-bold' : p.cannibal > 4 ? 'text-amber-600' : 'text-vfes-dark'}`}>{p.cannibal}%</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${p.roi >= 2 ? 'text-emerald-600' : p.roi >= 1 ? 'text-amber-600' : 'text-red-600'}`}>{p.roi.toFixed(1)}×</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.verdict === 'keep' ? 'bg-emerald-50 text-emerald-700'
                          : p.verdict === 'tune' ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>{tt(p.verdict)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/channel-dealers"    className="font-bold text-vfes-dark hover:underline">{tt('Channel & Dealers →')}</Link>
            <Link to="/portal/bundle-profitability" className="font-bold text-vfes-dark hover:underline">{tt('Bundle Profitability →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Quick links ──────────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-xl border border-black/5 bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Related pages')}</div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/portal/sales"             className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Sales')}</Link>
          <Link to="/portal/churn-retention"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Churn & Retention')}</Link>
          <Link to="/portal/bundle-profitability" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Bundle Profitability')}</Link>
          <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Pricing Simulator')}</Link>
          <Link to="/portal/channel-dealers"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Channel & Dealers')}</Link>
          <Link to="/portal/marketing"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Marketing')}</Link>
          <Link to="/portal/digital-funnel"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Digital Funnel')}</Link>
          <Link to="/portal/finance"           className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Finance')}</Link>
          <Link to="/portal/price-wargame"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Price War-game')}</Link>
          <Link to="/portal/ai-insights"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
          <Link to="/portal/customer-360"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Customer 360')}</Link>
          <Link to="/portal/company-360"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Company 360')}</Link>
          <Link to="/portal/mvno-wholesale"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('MVNO & Wholesale')}</Link>
          <Link to="/portal/b2b"              className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('B2B')}</Link>
        </div>
      </div>

      {/* ── A/B test register table ─────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('A/B test register — all tests')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Test')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Winner')}</th>
                  <th className="px-3 py-2 text-right">{tt('Lift %')}</th>
                  <th className="px-3 py-2">{tt('Margin impact')}</th>
                </tr>
              </thead>
              <tbody>
                {AB_TESTS.map(t => (
                  <tr key={t.test} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(t.test)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'Concluded' ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'Live' ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-50 text-slate-600'
                      }`}>{tt(t.status)}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-xs">{t.winner}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">
                      {t.liftPct !== null ? `+${t.liftPct}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{t.uplift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Promo calendar table ────────────────────────────────────────────── */}
      <div className="mt-6">
        <Panel title={tt('Promotional calendar — H1 2027 all events')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Month')}</th>
                  <th className="px-3 py-2">{tt('Campaign')}</th>
                  <th className="px-3 py-2">{tt('Segment')}</th>
                  <th className="px-3 py-2 text-right">{tt('Budget')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {CALENDAR.map(c => (
                  <tr key={c.event} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono font-semibold">{c.month}</td>
                    <td className="px-3 py-2 font-semibold text-xs">{tt(c.event)}</td>
                    <td className="px-3 py-2 text-vfes-dark/60 text-xs">{tt(c.segment)}</td>
                    <td className="px-3 py-2 text-right font-bold">{c.budget}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                      }`}>{tt(c.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <Link to="/portal/sales"   className="font-bold text-vfes-dark hover:underline">{tt('Sales →')}</Link>
            <Link to="/portal/product" className="font-bold text-vfes-dark hover:underline">{tt('Product →')}</Link>
          </div>
        </Panel>
      </div>

      {/* ── Uplift bar chart ─────────────────────────────────────────────────── */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Panel title={tt('Uplift vs cannibalism — net incremental by promo (%)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={PROMOS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="promo" width={190} tick={{ fontSize: 7 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="uplift"   name={tt('Uplift %')}      fill={GREEN} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cannibal" name={tt('Cannibalism %')} fill={RED}   radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Day-90 churn by promotion (%)')}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={sortedPromos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="promo" width={190} tick={{ fontSize: 7 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="day90Churn" name={tt('Day-90 churn %')} radius={[0, 4, 4, 0]}>
                  {sortedPromos.map((p, i) => <Cell key={i} fill={p.day90Churn >= 15 ? RED : p.day90Churn >= 10 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Action CTA ──────────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Promotions intelligence')}</div>
          <div className="text-sm text-vfes-dark/80 mb-1">
            {tt('Retire MEGADEAL, enforce promo-duration auto-expire, and deploy app-push step-down to the Apr cliff cohort. Expected recovery: +BSD 0.4M/mo margin.')}
          </div>
          <div className="text-xs text-vfes-dark/55">
            {tt('Recommended cadence: weekly promo performance review · monthly ROI reforecast · quarterly A/B test harvest.')}
          </div>
        </div>
        <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-full hover:bg-vfes-red-dark flex items-center gap-2 shrink-0">
          <Brain className="w-4 h-4" />{tt('Open AI Insights →')}
        </Link>
      </div>

      {/* ── Governance & additional notes ───────────────────────────────────── */}
      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Governance summary — full controls register')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Control')}</th>
                    <th className="px-3 py-2">{tt('Policy')}</th>
                    <th className="px-3 py-2 text-right">{tt('Breaches')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {APPROVALS.map(a => (
                    <tr key={a.req} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(a.req)}</td>
                      <td className="px-3 py-2 text-vfes-dark/70 text-xs">{tt(a.policy)}</td>
                      <td className="px-3 py-2 text-right font-mono">{a.breaches}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${a.status === 'enforced' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {tt(a.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <div>
          <Panel title={tt('Quick links')}>
            <div className="flex flex-col gap-2 text-xs font-semibold py-1">
              <Link to="/portal/sales"             className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Sales')}</Link>
              <Link to="/portal/churn-retention"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Churn & Retention')}</Link>
              <Link to="/portal/channel-dealers"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Channel & Dealers')}</Link>
              <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Pricing Simulator')}</Link>
              <Link to="/portal/finance"           className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Finance')}</Link>
              <Link to="/portal/price-wargame"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Price War-game')}</Link>
              <Link to="/portal/digital-funnel"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Digital Funnel')}</Link>
              <Link to="/portal/marketing"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Marketing')}</Link>
              <Link to="/portal/company-360"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Company 360')}</Link>
              <Link to="/portal/customer-360"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" />{tt('Customer 360')}</Link>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Quick links row (always visible) ───────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55 mb-3">{tt('Related pages')}</div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/portal/sales"             className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Sales')}</Link>
          <Link to="/portal/churn-retention"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Churn & Retention')}</Link>
          <Link to="/portal/bundle-profitability" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Bundle Profitability')}</Link>
          <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Pricing Simulator')}</Link>
          <Link to="/portal/channel-dealers"   className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Channel & Dealers')}</Link>
          <Link to="/portal/marketing"         className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Marketing')}</Link>
          <Link to="/portal/digital-funnel"    className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Digital Funnel')}</Link>
          <Link to="/portal/finance"           className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Finance')}</Link>
          <Link to="/portal/price-wargame"     className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Price War-game')}</Link>
          <Link to="/portal/ai-insights"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
          <Link to="/portal/customer-360"      className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Customer 360')}</Link>
          <Link to="/portal/company-360"       className="text-vfes-dark hover:underline flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{tt('Company 360')}</Link>
        </div>
      </div>
    </div>
  )
}
