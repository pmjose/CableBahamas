import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HeartPulse, UserMinus, ShieldCheck, TrendingDown, Brain, ChevronRight,
  TrendingUp, BarChart3, Activity, Users, Target, Award, Zap, AlertTriangle,
  GitBranch, Layers, Clock, Settings,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import AgentWorkflow from '../../components/AgentWorkflow'
import { flowById } from './_agent_flows'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AgentAction from '../../components/AgentAction'
import tt from '../../i18n/tt'
import CUST_FACTS from './_customer_facts'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'

// Churn by tenure x segment (annualised %)
const TENURE_CHURN = [
  { tenure: '0-6 mo',  consumer: 4.8, premium: 2.1, b2b: 1.4 },
  { tenure: '6-12 mo', consumer: 3.2, premium: 1.6, b2b: 1.1 },
  { tenure: '1-2 yr',  consumer: 2.1, premium: 1.2, b2b: 0.9 },
  { tenure: '2-4 yr',  consumer: 1.4, premium: 0.9, b2b: 0.7 },
  { tenure: '4+ yr',   consumer: 0.9, premium: 0.6, b2b: 0.5 },
]

const SAVE_FUNNEL = [
  { stage: 'Flagged high-risk', n: 38400 },
  { stage: 'Contacted', n: 29800 },
  { stage: 'Offered', n: 24100 },
  { stage: 'Accepted', n: 12300 },
  { stage: 'Saved (90d)', n: 10900 },
]

const RETENTION_ROI = [
  { offer: 'Loyalty discount 12mo', saved: 4200, costK: 38, roi: 4.1 },
  { offer: 'Free speed upgrade', saved: 3100, costK: 24, roi: 3.6 },
  { offer: '2nd line -50%', saved: 2400, costK: 41, roi: 2.4 },
  { offer: 'Retention credit BSD 50', saved: 1900, costK: 95, roi: 1.3 },
]

const CHURN_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i],
  churn: 1.78 - i * 0.033 + (i === 7 ? 0.12 : 0),
}))

const BOOK = [
  { seg: 'High-value · contract-end 30d', lines: 6240, eurK: 482, risk: 88, offer: 'Loyalty 20% · 12mo' },
  { seg: 'Bill-shock detractors', lines: 9120, eurK: 410, risk: 81, offer: 'Bill review + credit' },
  { seg: 'Network-complaint cluster', lines: 5180, eurK: 356, risk: 76, offer: 'Speed upgrade + 50GB' },
  { seg: 'Discount-trained (promo end)', lines: 11400, eurK: 612, risk: 72, offer: 'Step-down promo' },
  { seg: 'Competitor-quote online', lines: 6460, eurK: 280, risk: 69, offer: '2nd line -50%' },
]

// ─── new data ─────────────────────────────────────────────────────────────── //
const CHURN_PRED = CHURN_TREND.map((d, i) => ({
  ...d,
  predicted: +(d.churn + (i % 3 === 0 ? 0.04 : i % 3 === 1 ? -0.03 : 0.01)).toFixed(2),
}))

const COHORT_DATA = [
  { cohort: 'Q3 2023', m3: 4.8, m6: 3.9, m12: 2.8, m24: 1.7 },
  { cohort: 'Q4 2023', m3: 4.5, m6: 3.6, m12: 2.6, m24: 1.6 },
  { cohort: 'Q1 2024', m3: 4.2, m6: 3.4, m12: 2.4, m24: 1.5 },
  { cohort: 'Q2 2024', m3: 3.9, m6: 3.1, m12: 2.2, m24: null },
  { cohort: 'Q3 2024', m3: 3.6, m6: 2.9, m12: 2.0, m24: null },
  { cohort: 'Q4 2024', m3: 3.4, m6: 2.7, m12: null, m24: null },
  { cohort: 'Q1 2025', m3: 3.1, m6: null, m12: null, m24: null },
]

const SAVE_BY_MONTH = Array.from({ length: 12 }, (_, i) => ({
  m: ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i],
  flagged: 3820 - i * 12 + (i === 7 ? 400 : 0),
  saved: 1840 - i * 8 + (i === 7 ? 120 : 0),
  rate: +(48 + i * 0.4 + (i === 7 ? -4 : 0)).toFixed(1),
}))

const CHURN_BY_REASON = [
  { reason: 'Competitor price', pct: 34, trend: -2 },
  { reason: 'Service quality',  pct: 22, trend: +1 },
  { reason: 'Bill shock',       pct: 18, trend: -3 },
  { reason: 'Promo expired',    pct: 14, trend: +4 },
  { reason: 'Moving house',     pct:  7, trend:  0 },
  { reason: 'Financial difficulty', pct: 5, trend: +1 },
]

const COMPETITOR_RISK = [
  { competitor: 'BTC', lostMo: 4820, regained: 1240, netLoss: 3580, avgOffer: 'BSD 25/mo 12 mo' },
  { competitor: 'Rival ISP A',   lostMo: 3140, regained:  980, netLoss: 2160, avgOffer: 'BSD 20/mo 6 mo' },
  { competitor: 'Rival ISP C',    lostMo: 1820, regained:  420, netLoss: 1400, avgOffer: 'BSD 15/mo 3 mo' },
  { competitor: 'Rival ISP B',     lostMo: 2640, regained:  210, netLoss: 2430, avgOffer: 'BSD 10/mo unlimited' },
]

const RECOVERY_CURVE = Array.from({ length: 12 }, (_, i) => ({
  m: `M${i + 1}`,
  active:  +(100 - i * 3.5 + (i < 3 ? 1.5 : 0)).toFixed(1),
  churned: +(i * 3.5 - (i < 3 ? 1.5 : 0)).toFixed(1),
}))

const MODEL_METRICS = [
  { version: 'v3.5', auc: 0.82, precision: 0.71, recall: 0.68, f1: 0.69, date: '2025-01' },
  { version: 'v3.8', auc: 0.84, precision: 0.74, recall: 0.71, f1: 0.72, date: '2025-04' },
  { version: 'v4.0', auc: 0.87, precision: 0.78, recall: 0.74, f1: 0.76, date: '2025-07' },
  { version: 'v4.2', auc: 0.89, precision: 0.81, recall: 0.77, f1: 0.79, date: '2025-10' },
]

const SEGMENT_RISK: { seg: string; customers: number; risk: number; arpu: number; action: string }[] = [
  { seg: 'High-value · FTTH',        customers:  48200, risk: 28, arpu:  84, action: 'Proactive NBO' },
  { seg: 'Mobile-only · postpaid',   customers: 124800, risk: 42, arpu:  32, action: 'Bundle attach' },
  { seg: 'Convergent · promo end',   customers:  38600, risk: 68, arpu:  92, action: 'Step-down promo' },
  { seg: 'Contract-end 30d',         customers:  22400, risk: 81, arpu:  74, action: 'Loyalty offer' },
  { seg: 'Competitor overbuild',     customers:  16800, risk: 74, arpu:  56, action: 'FTTH upgrade path' },
  { seg: 'Bill-shock 3 mo',          customers:  29200, risk: 77, arpu:  48, action: 'Bill review + credit' },
]

type TabId = 'overview' | 'book' | 'roi' | 'cohorts' | 'saves' | 'analytics' | 'segments' | 'models'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',  label: 'Overview',      icon: HeartPulse },
  { id: 'book',      label: 'Churn Book',    icon: UserMinus  },
  { id: 'roi',       label: 'Save ROI',      icon: ShieldCheck },
  { id: 'cohorts',   label: 'Cohorts',       icon: Layers     },
  { id: 'saves',     label: 'Save Campaigns',icon: Award      },
  { id: 'analytics', label: 'Analytics',     icon: Activity   },
  { id: 'segments',  label: 'Segments',      icon: Users      },
  { id: 'models',    label: 'Models',        icon: GitBranch  },
]

export default function ChurnRetentionPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('overview')
  const [riskThreshold, setRiskThreshold] = useState(70)
  const [modelVersion, setModelVersion] = useState('v4.2')
  const [cohortYear, setCohortYear] = useState(2024)
  const [segmentSort, setSegmentSort] = useState<'risk' | 'arpu' | 'customers'>('risk')
  const [detailOpen, setDetailOpen] = useState<string | null>(null)
  const [showSaveDetail, setShowSaveDetail] = useState(false)
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => { setDetailOpen(null) }, [tab])

  const filteredBook = useMemo(
    () => BOOK.filter(b => b.risk >= riskThreshold),
    [riskThreshold],
  )
  const sortedSegments = useMemo(
    () => [...SEGMENT_RISK].sort((a, b) => b[segmentSort] - a[segmentSort]),
    [segmentSort],
  )

  const maxFunnel = SAVE_FUNNEL[0].n

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Churn & Retention')}
        subtitle={tt('Predicted-churn book · save funnel · retention-spend ROI · closed-loop saves')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">{CUST_FACTS.churnRatePct}% {tt('churn')}</span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold">{CUST_FACTS.saveRatePct}% {tt('save rate')}</span>
          </div>
        }
      />

      <div className="mb-6"><AgentWorkflow flow={flowById('save-desk')} compact /></div>

      {/* ─────────────────────────────────────────────────────── */}

      {/* ── ML Insight ─────────────────────────────────────────── */}
      <MlInsightSection
        heading="Churn prediction"
        models={[
          { name: 'Churn Classifier v4.2', metric: 'AUC 0.89', sub: 'GBM + Survival · 38.4K high-risk' },
          { name: 'Save-response model',   metric: '68% acc',   sub: 'Logistic · 142 features' },
          { name: 'CLV-at-risk model',     metric: '\u20ac2.14M/mo', sub: 'Survival · 90-day window' },
        ]}
        agentLabel="Run Churn Scoring Agent"
        agentRunningLabel="Scoring base…"
        agentSteps={[
          'Scored the base \u2192 38.4K high-risk lines',
          'Clustered by churn driver (price, network, bill, promo)',
          'Matched next-best save offer by ROI & elasticity',
          'Routed to MNP Save Desk + suppressed marketing',
        ]}
        agentBlurb="Scores the full base hourly and builds the predicted-churn book."
        decision={{
          title: 'Prioritise high-value contract-end book this week',
          detail: '6,240 high-value lines hit contract-end in 30 days at 88% risk — loyalty offer protects most ARPU per BSD.',
          impact: '\u20ac482K/mo ARPU protected',
          risk: 'Over-discounting trains future churn — cap depth by segment',
          linkTo: '#/portal/mnp',
          linkLabel: 'Open MNP Save Desk',
        }}
        chart={{
          kind: 'line',
          title: 'Churn prediction vs actual — 12 months',
          data: CHURN_PRED,
          xKey: 'm',
          series: [
            { key: 'churn',     name: 'Actual churn', color: '#FF4438' },
            { key: 'predicted', name: 'Predicted',     color: '#10B981', dashed: true },
          ],
          unit: '%',
          note: 'Model MAPE 4.2% · drift PSI 0.04 — tracking well through Apr promo-cliff.',
        }}
      />

      {/* ── KPI strip (12 cards) ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label={tt('Blended churn')}         value={`${CUST_FACTS.churnRatePct}%`}                                        delta={tt('-0.18 pp YoY')}         trend="up"   icon={TrendingDown} accent />
        <KpiCard label={tt('Predicted-churn book')} value={`${(CUST_FACTS.predictedChurnBook / 1000).toFixed(1)}K`}               delta={tt('lines flagged')}        trend="down" icon={UserMinus} />
        <KpiCard label={tt('ARPU at risk / mo')}    value={`\u20ac${(CUST_FACTS.eurAtRiskMoK / 1000).toFixed(2)}M`}                delta={tt('if unaddressed')}       trend="down" icon={TrendingDown} />
        <KpiCard label={tt('Save rate')}             value={`${CUST_FACTS.saveRatePct}%`}                                          delta={tt('+4 pp vs target')}      trend="up"   icon={ShieldCheck} />
        <KpiCard label={tt('Saves YTD')}             value="10,940"                                                                delta={tt('+18% vs prior year')}   trend="up"   icon={Award} />
        <KpiCard label={tt('Avg save cost')}         value="\u20ac28"                                                                delta={tt('per saved customer')}   trend="up"   icon={Target} />
        <KpiCard label={tt('Model AUC')}             value="0.89"                                                                  delta={tt('GBM v4.2 · stable')}    trend="up"   icon={GitBranch} />
        <KpiCard label={tt('Competitor win-back')}   value="22%"                                                                   delta={tt('of churned regained')}  trend="up"   icon={TrendingUp} />
        <KpiCard label={tt('MNP port-ins MoM')}      value="+3.2K"                                                                 delta={tt('net positive')}         trend="up"   icon={Activity} />
        <KpiCard label={tt('Contact-to-save rate')} value="41%"                                                                   delta={tt('+6 pp QoQ')}            trend="up"   icon={HeartPulse} />
        <KpiCard label={tt('Proactive saves')}       value="62%"                                                                   delta={tt('pre-complaint saves')}  trend="up"   icon={Zap} />
        <KpiCard label={tt('Churn budget used')}     value="84%"                                                                   delta={tt('of quarterly allocation')} trend="down" icon={BarChart3} />
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === t.id ? 'text-vfes-dark border-vfes-red' : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════ TAB: overview ══════════════ */}
      {tab === 'overview' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Churn by tenure × segment (annualised %)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={TENURE_CHURN}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="tenure" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="consumer" fill={NAVY} name={tt('Consumer')} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="premium"  fill={BLUE} name={tt('Premium')}  radius={[3, 3, 0, 0]} />
                    <Bar dataKey="b2b"      fill={GREEN} name={tt('B2B')}     radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('First-year consumer churn is 5× the 4-year cohort — onboarding is the leverage point.')}</div>
            </Panel>
            <Panel title={tt('Save funnel — flagged → saved')}>
              <div className="space-y-2.5 mt-2">
                {SAVE_FUNNEL.map((s, i) => (
                  <div key={s.stage} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span>{tt(s.stage)}</span>
                      <span className="font-mono text-xs">{s.n.toLocaleString('en-BS')}</span>
                    </div>
                    <div className="h-2 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(s.n / maxFunnel) * 100}%`, background: i === SAVE_FUNNEL.length - 1 ? GREEN : BLUE }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('28% of flagged lines are saved — biggest drop is contacted→offered (route faster).')}</div>
            </Panel>
          </div>

          <Panel title={tt('Blended churn — 12 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={CHURN_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[1.2, 2]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, '']} />
                  <Line type="monotone" dataKey="churn" stroke={BLUE} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Apr uptick = promo-cliff cohort; trend down as AI save-routing matures.')}</div>
          </Panel>

          <Panel title={tt('Portfolio health snapshot')} action={<AlertTriangle className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Consumer churn')}</div>
                <div className="text-2xl font-extrabold text-red-600">1.52%</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('−0.18 pp YoY')}</div>
              </div>
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Premium churn')}</div>
                <div className="text-2xl font-extrabold text-amber-600">0.74%</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('−0.06 pp YoY')}</div>
              </div>
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('B2B churn')}</div>
                <div className="text-2xl font-extrabold text-emerald-600">0.41%</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('−0.02 pp YoY')}</div>
              </div>
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Convergent churn')}</div>
                <div className="text-2xl font-extrabold text-emerald-600">0.62%</div>
                <div className="text-[10px] text-vfes-dark/55">{tt('−0.11 pp YoY')}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Convergent customers churn at 3.2× lower rate than mobile-only — primary case for the bundle attach motion.')}</div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/churn-retention" className="text-vfes-dark hover:underline">{tt('Churn & Retention')}</Link>
            <Link to="/portal/customer-360"    className="text-vfes-dark hover:underline">{tt('Customer 360 \u2192')}</Link>
            <Link to="/portal/clv"             className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
            <Link to="/portal/mnp"             className="text-vfes-dark hover:underline">{tt('MNP Save Desk \u2192')}</Link>
            <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: book ══════════════════ */}
      {tab === 'book' && (
        <>
          <div className="mb-4 p-4 rounded-xl bg-white border border-black/5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold">{tt('Risk threshold filter')}</span>
              <span className="font-bold text-vfes-dark">{tt('\u2265')} {riskThreshold}%</span>
            </div>
            <input type="range" min={50} max={95} step={5} value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              className="w-full accent-vfes-red" />
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Showing')} {filteredBook.length} {tt('segments at or above threshold')}</div>
          </div>

          <Panel
            title={tt('Predicted-churn book — next-best save offer')}
            action={<AgentAction label={tt('Run Retention Agent')} runningLabel={tt('Scoring\u2026')}
              steps={[
                tt('Scored the base \u2192 38.4K high-risk lines'),
                tt('Clustered by churn driver (price, network, bill, promo)'),
                tt('Matched next-best save offer by ROI & elasticity'),
                tt('Routed to MNP Save Desk + suppressed marketing'),
              ]} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Risk segment')}</th>
                    <th className="px-3 py-2 text-right">{tt('Lines')}</th>
                    <th className="px-3 py-2 text-right">{tt('ARPU at risk \u20acK/mo')}</th>
                    <th className="px-3 py-2 text-right">{tt('Risk')}</th>
                    <th className="px-3 py-2">{tt('Recommended offer')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBook.map(b => (
                    <tr key={b.seg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(b.seg)}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.lines.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">\u20ac{b.eurK}K</td>
                      <td className="px-3 py-2 text-right"><span className={`font-bold ${b.risk >= 85 ? 'text-red-600' : b.risk >= 75 ? 'text-amber-600' : 'text-vfes-dark/70'}`}>{b.risk}%</span></td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-vfes-red/10 text-vfes-dark">{tt(b.offer)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Discount-trained cohort is the biggest \u20ac book — step-down promo beats blanket credit.')} <ChevronRight className="w-3 h-3" /></div>
          </Panel>

          <div className="mt-4">
            <AgentDecision
              title={tt('Retention agent')}
              label={tt('Run Retention Agent')} runningLabel={tt('Scoring\u2026')}
              steps={[
                tt('Scored the base \u2192 38.4K high-risk lines'),
                tt('Clustered by churn driver (price, network, bill, promo)'),
                tt('Matched next-best save offer by ROI & elasticity'),
                tt('Routed to MNP Save Desk + suppressed marketing'),
              ]}
              result={{
                headline: tt('Prioritise the high-value contract-end book this week'),
                stats: [
                  { label: tt('Blended churn'),        value: '1.52%' },
                  { label: tt('Predicted-churn book'), value: '38.4K' },
                  { label: tt('ARPU at risk / mo'),    value: '\u20ac2.14M' },
                  { label: tt('Save rate'),             value: '51%' },
                ],
                findings: [
                  tt('6,240 high-value lines hit contract-end in 30 days at 88% risk.'),
                  tt('A targeted loyalty offer here protects the most ARPU per BSD of retention spend.'),
                  tt('Discount-trained cohort is the biggest \u20ac book — step-down promo beats blanket credit.'),
                ],
                note: tt('Over-discounting trains future churn — cap depth by segment.'),
              }}
              impact={tt('\u20ac482K/mo ARPU protected')}
              risk={tt('over-discounting trains future churn — cap depth')}
              linkTo="#/portal/mnp" linkLabel={tt('Open MNP Save Desk')}
            />
          </div>

          <Panel title={tt('Churn book summary — by driver cluster')}>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-4 text-center">
                <div className="text-2xl font-extrabold text-red-600">38.4K</div>
                <div className="text-xs text-vfes-dark/55 mt-1">{tt('Total high-risk lines')}</div>
                <div className="text-[10px] text-vfes-dark/45 mt-1">{tt('Churn score > 70%')}</div>
              </div>
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-4 text-center">
                <div className="text-2xl font-extrabold text-amber-600">BSD 2.14M</div>
                <div className="text-xs text-vfes-dark/55 mt-1">{tt('ARPU at risk / month')}</div>
                <div className="text-[10px] text-vfes-dark/45 mt-1">{tt('If all churned unaddressed')}</div>
              </div>
              <div className="rounded-lg border border-black/5 bg-[#fafbfc] p-4 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">51%</div>
                <div className="text-xs text-vfes-dark/55 mt-1">{tt('Current save rate')}</div>
                <div className="text-[10px] text-vfes-dark/45 mt-1">{tt('+4 pp above target')}</div>
              </div>
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/mnp"             className="text-vfes-dark hover:underline">{tt('MNP Save Desk \u2192')}</Link>
            <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
            <Link to="/portal/base-management" className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: roi ═══════════════════ */}
      {tab === 'roi' && (
        <>
          <Panel title={tt('Retention-spend ROI by offer')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={RETENTION_ROI}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="offer" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} saved · \u20ac${p.payload.costK}K · ${p.payload.roi}\u00d7 ROI`, tt('Offer')]} />
                  <Bar dataKey="saved" radius={[6, 6, 0, 0]}>
                    {RETENTION_ROI.map((r, i) => <Cell key={i} fill={r.roi >= 3 ? GREEN : r.roi >= 2 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('Loyalty discount returns 4.1\u00d7 vs 1.3\u00d7 for blanket credit — shift retention budget accordingly.')}</div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Post-save recovery — 12-month retention curve')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={RECOVERY_CURVE}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="active"  stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Still active %')} />
                    <Area type="monotone" dataKey="churned" stroke={RED}   fill={RED}   fillOpacity={0.1} name={tt('Re-churned %')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('58% of saved customers remain after 12 months — re-churn peaks M4\u2013M6 (promo cliff).')}</div>
            </Panel>

            <Panel title={tt('Competitor win-back performance')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2 px-2">{tt('Competitor')}</th>
                      <th className="py-2 px-2 text-right">{tt('Lost/mo')}</th>
                      <th className="py-2 px-2 text-right">{tt('Regained')}</th>
                      <th className="py-2 px-2 text-right">{tt('Net loss')}</th>
                      <th className="py-2 px-2">{tt('Typical counter-offer')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPETITOR_RISK.map(r => (
                      <tr key={r.competitor} className="border-b border-black/5">
                        <td className="py-2 px-2 font-semibold">{r.competitor}</td>
                        <td className="py-2 px-2 text-right font-mono text-red-600">{r.lostMo.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-600">{r.regained.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-red-600">\u2212{r.netLoss.toLocaleString()}</td>
                        <td className="py-2 px-2 text-xs">{r.avgOffer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Save investment summary')}>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3 text-center">
                <div className="text-2xl font-extrabold text-vfes-dark">\u20ac1.1M</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('Quarterly retention spend')}</div>
              </div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">3.8\u00d7</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('Blended ROI on spend')}</div>
              </div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3 text-center">
                <div className="text-2xl font-extrabold">\u20ac28</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('Avg cost per save')}</div>
              </div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3 text-center">
                <div className="text-2xl font-extrabold text-amber-600">58%</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('12-month retention of saved')}</div>
              </div>
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/marketing"       className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
            <Link to="/portal/voc"             className="text-vfes-dark hover:underline">{tt('Voice of Customer \u2192')}</Link>
            <Link to="/portal/loyalty-consent" className="text-vfes-dark hover:underline">{tt('Loyalty & Consent \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: cohorts ═══════════════ */}
      {tab === 'cohorts' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm font-semibold">{tt('Cohort year:')}</span>
            {[2023, 2024, 2025].map(y => (
              <button key={y} onClick={() => setCohortYear(y)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${cohortYear === y ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
                {y}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Cohort churn — by quarter of acquisition')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={COHORT_DATA}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[0, 6]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="m3"  stroke={BLUE}  strokeWidth={2} name={tt('M3 churn')}  dot />
                    <Line type="monotone" dataKey="m6"  stroke={GREEN} strokeWidth={2} name={tt('M6 churn')}  dot />
                    <Line type="monotone" dataKey="m12" stroke={AMBER} strokeWidth={2} name={tt('M12 churn')} dot />
                    <Line type="monotone" dataKey="m24" stroke={RED}   strokeWidth={2} name={tt('M24 churn')} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Later cohorts show lower M3/M6 churn — onboarding improvements taking hold.')}</div>
            </Panel>

            <Panel title={tt('Save-by-month performance')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={SAVE_BY_MONTH}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  yAxisId="l" dataKey="flagged" fill={BLUE}  radius={[3,3,0,0]} name={tt('Flagged')} opacity={0.6} />
                    <Bar  yAxisId="l" dataKey="saved"   fill={GREEN} radius={[3,3,0,0]} name={tt('Saved')} />
                    <Line yAxisId="r" type="monotone" dataKey="rate" stroke={RED} strokeWidth={2} name={tt('Save rate %')} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Save rate climbing steadily — Apr dip from promo-cliff volume spike.')}</div>
            </Panel>
          </div>

          <Panel title={tt('Cohort retention matrix')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3 text-left">{tt('Cohort')}</th>
                    <th className="py-2 px-3 text-center">{tt('Size')}</th>
                    <th className="py-2 px-3 text-center">{tt('M3')}</th>
                    <th className="py-2 px-3 text-center">{tt('M6')}</th>
                    <th className="py-2 px-3 text-center">{tt('M12')}</th>
                    <th className="py-2 px-3 text-center">{tt('M24')}</th>
                    <th className="py-2 px-3 text-center">{tt('Active now')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COHORT_DATA.map((c, i) => (
                    <tr key={c.cohort} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 px-3 font-semibold">{c.cohort}</td>
                      <td className="py-2 px-3 text-center font-mono text-vfes-dark/65">{((8 - i) * 12 + 28).toFixed(0)}K</td>
                      {[c.m3, c.m6, c.m12, c.m24].map((v, j) => (
                        <td key={j} className="py-2 px-3 text-center">
                          {v == null ? <span className="text-vfes-dark/30">{tt('n/a')}</span> : (
                            <span className={`font-mono font-semibold ${
                              v >= 4 ? 'text-red-600' : v >= 3 ? 'text-amber-600' : v >= 2 ? 'text-vfes-dark/70' : 'text-emerald-600'
                            }`}>{v.toFixed(1)}%</span>
                          )}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center font-mono text-emerald-600 font-semibold">
                        {(100 - (c.m24 ?? c.m12 ?? c.m6 ?? c.m3) * 8).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-vfes-dark/55">{tt('Green = low churn · Red = high churn · n/a = cohort not yet reached that milestone.')}</div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/ai-insights"    className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
            <Link to="/portal/base-management" className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
            <Link to="/portal/clv"             className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: saves ═════════════════ */}
      {tab === 'saves' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold">{tt('Filter:')}</span>
            {(['all', 'active', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setCampaignFilter(f)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg capitalize ${campaignFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Churn reason breakdown')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={CHURN_BY_REASON} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                    <YAxis type="category" dataKey="reason" stroke="#999" fontSize={10} width={135} tickFormatter={tt} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pct" radius={[0, 6, 6, 0]} name={tt('% of churners')}>
                      {CHURN_BY_REASON.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, RED, '#7C3AED'][i % 6]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Competitor price is the #1 driver — counter-offer positioning is the primary lever.')}</div>
            </Panel>

            <Panel title={tt('Save campaign performance — last 12 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={SAVE_BY_MONTH}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  yAxisId="l" dataKey="saved" fill={GREEN} radius={[3,3,0,0]} name={tt('Customers saved')} />
                    <Line yAxisId="r" type="monotone" dataKey="rate" stroke={AMBER} strokeWidth={2.5} name={tt('Save rate %')} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1">
                <button onClick={() => setShowSaveDetail(v => !v)} className="text-xs font-semibold text-vfes-dark hover:underline">
                  {showSaveDetail ? tt('Hide detail') : tt('Show monthly detail')}
                </button>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Save desk performance — rolling 12 months')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Month')}</th>
                    <th className="py-2 px-3 text-right">{tt('Flagged')}</th>
                    <th className="py-2 px-3 text-right">{tt('Saved')}</th>
                    <th className="py-2 px-3 text-right">{tt('Save rate')}</th>
                    <th className="py-2 px-3 text-right">{tt('ARPU saved \u20ac')}</th>
                    <th className="py-2 px-3 text-right">{tt('Spend \u20ac')}</th>
                    <th className="py-2 px-3 text-right">{tt('ROI \u00d7')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SAVE_BY_MONTH.slice(0, 6).map((m, i) => (
                    <tr key={m.m} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 px-3 font-semibold">{tt(m.m)}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.flagged.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.saved.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right"><span className={`font-bold text-xs ${m.rate >= 50 ? 'text-emerald-600' : m.rate >= 45 ? 'text-amber-600' : 'text-red-600'}`}>{m.rate}%</span></td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">BSD {(m.saved * 52).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-vfes-dark/65">BSD {(m.saved * 14).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold">{(52 / 14).toFixed(1)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">{tt('Source: CBL_ANALYTICS.RETENTION.SAVE_DESK_PERF · refreshed daily')}</div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/war-room"        className="text-vfes-dark hover:underline">{tt('War Room \u2192')}</Link>
            <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
            <Link to="/portal/marketing"       className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: analytics ═════════════ */}
      {tab === 'analytics' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Churn trend — 12 months with target')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={CHURN_TREND}>
                    <defs>
                      <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={BLUE} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[1.2, 2.0]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={1.65} stroke={AMBER} strokeDasharray="4 4" label={{ value: tt('Target'), fontSize: 10, fill: AMBER }} />
                    <Area type="monotone" dataKey="churn" stroke={BLUE} strokeWidth={2} fill="url(#churnFill)" name={tt('Churn %')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Prediction vs actual — 12 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={CHURN_PRED}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} domain={[1.2, 2.0]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="churn"     stroke={BLUE}  strokeWidth={2.5} name={tt('Actual')}    dot={false} />
                    <Line type="monotone" dataKey="predicted" stroke={GREEN} strokeWidth={2}   name={tt('Predicted')} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('MAPE 4.2% · drift PSI 0.04 — tracking well.')}</div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Churn reason breakdown')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={CHURN_BY_REASON} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                    <YAxis type="category" dataKey="reason" stroke="#999" fontSize={10} width={140} tickFormatter={tt} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pct" radius={[0, 6, 6, 0]} name={tt('% of churners')}>
                      {CHURN_BY_REASON.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, RED, '#7C3AED'][i % 6]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('Competitor intelligence — net loss/month')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={COMPETITOR_RISK}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="competitor" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="lostMo"   fill={RED}   radius={[3,3,0,0]} name={tt('Lost/mo')} />
                    <Bar dataKey="regained" fill={GREEN} radius={[3,3,0,0]} name={tt('Regained')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Churn reason detail')} action={<Clock className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Reason')}</th>
                    <th className="py-2 px-3 text-right">{tt('Share %')}</th>
                    <th className="py-2 px-3 text-right">{tt('YoY trend pp')}</th>
                    <th className="py-2 px-3">{tt('Counter-play')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CHURN_BY_REASON.map(r => (
                    <tr key={r.reason} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 px-3 font-semibold">{tt(r.reason)}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.pct}%</td>
                      <td className={`py-2 px-3 text-right font-bold font-mono ${r.trend < 0 ? 'text-emerald-600' : r.trend > 0 ? 'text-red-600' : 'text-vfes-dark/55'}`}>{r.trend > 0 ? '+' : ''}{r.trend} pp</td>
                      <td className="py-2 px-3 text-xs text-vfes-dark/70">{tt(r.reason === 'Competitor price' ? 'Price-match + loyalty' : r.reason === 'Service quality' ? 'Proactive fix + SLA credit' : r.reason === 'Bill shock' ? 'Bill review + alert' : r.reason === 'Promo expired' ? 'Step-down renewal' : r.reason === 'Moving house' ? 'Relocation concierge' : 'Payment plan')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Churn reduction roadmap \u2014 Q1 2026 priorities')}>
            <div className="space-y-3">
              {[
                { priority: '1', action: tt('Accelerate contract-end book routing — reduce flagged→offered latency from 4.2d to 1d'), impact: tt('\u20ac180K/mo'), owner: tt('Save Desk') },
                { priority: '2', action: tt('Step-down promo for discount-trained cohort — replace blanket credit with tiered renewal'), impact: tt('\u20ac120K/mo'), owner: tt('Product') },
                { priority: '3', action: tt('FTTH migration path for FTTC at-risk — proactive upgrade invitation before competitor offers'), impact: tt('\u20ac95K/mo'), owner: tt('Network') },
                { priority: '4', action: tt('Onboarding NPS intervention at M2 — catch early detractors before M6 churn cliff'), impact: tt('\u20ac74K/mo'), owner: tt('Care') },
                { priority: '5', action: tt('Bill-shock suppression — automated threshold alert + credit before complaint'), impact: tt('\u20ac58K/mo'), owner: tt('Billing') },
              ].map(r => (
                <div key={r.priority} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <span className="w-6 h-6 rounded-full bg-vfes-red text-vfes-dark text-xs font-bold grid place-items-center shrink-0 mt-0.5">{r.priority}</span>
                  <div className="flex-1 text-sm">{r.action}</div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 text-sm">{r.impact}</div>
                    <div className="text-[10px] text-vfes-dark/55">{r.owner}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/voc"             className="text-vfes-dark hover:underline">{tt('Voice of Customer \u2192')}</Link>
            <Link to="/portal/loyalty-consent" className="text-vfes-dark hover:underline">{tt('Loyalty & Consent \u2192')}</Link>
            <Link to="/portal/digital-app"     className="text-vfes-dark hover:underline">{tt('Digital App \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: segments ══════════════ */}
      {tab === 'segments' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold">{tt('Sort by:')}</span>
            {(['risk', 'arpu', 'customers'] as const).map(s => (
              <button key={s} onClick={() => setSegmentSort(s)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg capitalize ${segmentSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
                {tt(s)}
              </button>
            ))}
          </div>

          <Panel title={tt('Risk segment heatmap')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Segment')}</th>
                    <th className="py-2 px-3 text-right">{tt('Customers')}</th>
                    <th className="py-2 px-3 text-right">{tt('Churn risk')}</th>
                    <th className="py-2 px-3 text-right">{tt('Avg ARPU \u20ac')}</th>
                    <th className="py-2 px-3">{tt('Recommended action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSegments.map(s => (
                    <tr key={s.seg} className={`border-b border-black/5 hover:bg-[#fafbfc] cursor-pointer ${detailOpen === s.seg ? 'bg-vfes-red/5' : ''}`}
                      onClick={() => setDetailOpen(v => v === s.seg ? null : s.seg)}>
                      <td className="py-2 px-3 font-semibold">{tt(s.seg)}</td>
                      <td className="py-2 px-3 text-right font-mono">{s.customers.toLocaleString('en-BS')}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-20 bg-black/5 rounded overflow-hidden">
                            <div className="h-2 rounded" style={{ width: `${s.risk}%`, background: s.risk >= 75 ? RED : s.risk >= 55 ? AMBER : GREEN }} />
                          </div>
                          <span className={`font-bold text-xs ${s.risk >= 75 ? 'text-red-600' : s.risk >= 55 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.risk}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">\u20ac{s.arpu}</td>
                      <td className="py-2 px-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-vfes-red/10 text-vfes-dark">{tt(s.action)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Segment risk vs ARPU scatter')}>              
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={sortedSegments}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="%" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="l" dataKey="risk" fill={RED}  radius={[3,3,0,0]} name={tt('Churn risk %')} />
                    <Bar yAxisId="r" dataKey="arpu" fill={BLUE} radius={[3,3,0,0]} name={tt('Avg ARPU \u20ac')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('Segment customer volume')}>              
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={sortedSegments} layout="vertical">
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} />
                    <YAxis type="category" dataKey="seg" stroke="#999" fontSize={9} width={130} tickFormatter={v => tt(v).split(' ·')[0]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="customers" radius={[0,6,6,0]} name={tt('Customers')}>
                      {sortedSegments.map((_s, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, RED, '#7C3AED'][i % 6]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/base-management"   className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
            <Link to="/portal/bundle-propensity" className="text-vfes-dark hover:underline">{tt('Bundle Propensity \u2192')}</Link>
            <Link to="/portal/marketing"         className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
          </div>
        </>
      )}

      {/* ═══════════════════════════ TAB: models ════════════════ */}
      {tab === 'models' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Model performance history')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={MODEL_METRICS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="version" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} domain={[0.6, 1]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="auc" stroke={BLUE}  strokeWidth={2.5} name="AUC" dot />
                    <Line type="monotone" dataKey="f1"  stroke={GREEN} strokeWidth={2.5} name="F1"  dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Retention ROI — offer vs ROI multiple')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={RETENTION_ROI}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="offer" stroke="#999" fontSize={9} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="roi" radius={[6, 6, 0, 0]} name={tt('ROI \u00d7')}>
                      {RETENTION_ROI.map((r, i) => <Cell key={i} fill={r.roi >= 3 ? GREEN : r.roi >= 2 ? AMBER : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Model registry — churn models')}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold">{tt('Active version:')}</span>
              {MODEL_METRICS.map(m => (
                <button key={m.version} onClick={() => setModelVersion(m.version)}
                  className={`text-xs px-2.5 py-1 rounded font-semibold ${modelVersion === m.version ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70'}`}>
                  {m.version}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Version')}</th>
                    <th className="py-2 px-3 text-center">AUC</th>
                    <th className="py-2 px-3 text-center">{tt('Precision')}</th>
                    <th className="py-2 px-3 text-center">{tt('Recall')}</th>
                    <th className="py-2 px-3 text-center">F1</th>
                    <th className="py-2 px-3">{tt('Trained')}</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {MODEL_METRICS.map(m => (
                    <tr key={m.version} className={`border-b border-black/5 ${m.version === modelVersion ? 'bg-vfes-red/5' : 'hover:bg-[#fafbfc]'}`}>
                      <td className="py-2 px-3 font-bold font-mono">{m.version} {m.version === modelVersion && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tt('Active')}</span>}</td>
                      <td className="py-2 px-3 text-center font-mono">{m.auc}</td>
                      <td className="py-2 px-3 text-center font-mono">{m.precision}</td>
                      <td className="py-2 px-3 text-center font-mono">{m.recall}</td>
                      <td className="py-2 px-3 text-center font-mono">{m.f1}</td>
                      <td className="py-2 px-3 text-vfes-dark/60">{m.date}</td>
                      <td className="py-2 px-3">
                        <button onClick={() => setModelVersion(m.version)} disabled={m.version === modelVersion}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded bg-vfes-red/10 text-vfes-dark disabled:opacity-40">
                          {m.version === modelVersion ? tt('Active') : tt('Promote')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Model feature importance — top 10 drivers')} action={<Settings className="w-4 h-4 text-vfes-dark/40" />}>
            <div className="space-y-1.5">
              {[
                { feat: 'Out-of-contract days',       imp: 0.182 },
                { feat: 'Promo dependency score',     imp: 0.164 },
                { feat: 'Bill-shock index (90d)',     imp: 0.141 },
                { feat: 'Tenure (months)',             imp: 0.128 },
                { feat: 'Competitor NBO lookup',      imp: 0.112 },
                { feat: 'Care contacts (3 mo)',       imp: 0.097 },
                { feat: 'Speed test failures (30d)',  imp: 0.082 },
                { feat: 'Bundle depth',               imp: 0.074 },
                { feat: 'MNP enquiry flag',           imp: 0.068 },
                { feat: 'Payment missed (6 mo)',      imp: 0.051 },
              ].map(f => (
                <div key={f.feat} className="grid grid-cols-[200px,1fr,60px] items-center gap-2 text-xs">
                  <span className="truncate text-vfes-dark/75">{tt(f.feat)}</span>
                  <div className="h-2 bg-black/5 rounded overflow-hidden">
                    <div className="h-2 rounded bg-vfes-red" style={{ width: `${f.imp * 550}%` }} />
                  </div>
                  <span className="font-mono text-right text-vfes-dark/65">{f.imp.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Source: CBL_ANALYTICS.ML_OUTPUTS.CHURN_V4_2 · SHAP values · 142 features total')}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-vfes-dark/40">{tt('Powered by Snowpark ML · served from Model Registry · features from Feature Store · DPA basis: Legitimate Interest · DPIA-2024-CHURN-07')}</div>
          </Panel>

          <div className="mt-4 p-4 rounded-xl bg-[#fafbfc] border border-black/5 text-xs text-vfes-dark/65">
            <span className="font-semibold text-vfes-dark">{tt('Guardrails:')}</span> {tt('Model output suppressed for customers under URCA complaint review. Contact-policy cap: one offer per 30-day window. All promotions subject to manager approval for discounts above 25%. Vulnerable-customer flag overrides all churn models.')}
          </div>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/ai-insights" className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
            <Link to="/portal/operations"  className="text-vfes-dark hover:underline">{tt('Operations \u2192')}</Link>
          </div>
        </>
      )}
      {/* ── Churn & Retention · end of page ─ */}
    </div>
  )
}
