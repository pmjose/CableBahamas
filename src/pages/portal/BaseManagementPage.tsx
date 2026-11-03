import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3833)
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Repeat, TrendingUp, ArrowUpDown, Brain, ChevronRight, Users,
  Target, Zap, Activity, Layers, TrendingDown,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AgentAction from '../../components/AgentAction'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import CUST_FACTS from './_customer_facts'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend, Cell, AreaChart, Area, ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const RED = '#EF4444'

// Movement-of-base waterfall (monthly, thousands of subs)
const WATERFALL = [
  { step: 'Opening base', val: 14660, type: 'total' },
  { step: 'Gross adds', val: 41.2, type: 'pos' },
  { step: 'Win-back', val: 4.8, type: 'pos' },
  { step: 'Churn', val: -38.0, type: 'neg' },
  { step: 'Downgrades (net)', val: -4.8, type: 'neg' },
  { step: 'Closing base', val: 14663.2, type: 'total' },
]

const ARPU_MIGRATION = [
  { flow: 'Upgrade (tier up)', subs: 18400, arpuDelta: 8.4 },
  { flow: 'Cross-sell (add line/TV)', subs: 12600, arpuDelta: 12.1 },
  { flow: 'Convergent conversion', subs: 7800, arpuDelta: 18.6 },
  { flow: 'Downgrade (tier down)', subs: -9200, arpuDelta: -6.2 },
  { flow: 'Promo roll-off', subs: 14200, arpuDelta: 5.1 },
]

const NRR_TREND = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26','Q1-27','Q2-27'][i],
  nrr: 99.2 + i * 0.42,
}))

const WINBACK = [
  { stage: 'Lapsed (12mo)', n: 124000 },
  { stage: 'Targeted', n: 68000 },
  { stage: 'Responded', n: 18400 },
  { stage: 'Reactivated', n: 9600 },
]

// ─── Extended data ────────────────────────────────────────────────────────────

const UPSELL_TREND = Array.from({ length: 8 }, (_, i) => ({
  q: ['Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26','Q1-27','Q2-27'][i],
  upsell: 38400 + i * 2200,
  xsell: 12600 + i * 1800,
  target: 52000,
}))

const UPSELL_FUNNEL = [
  { stage: 'Total base',        n: 14663000 },
  { stage: 'Upgrade eligible',  n:  2840000 },
  { stage: 'Propensity ≥ 0.5', n:  1120000 },
  { stage: 'Contacted',         n:   680000 },
  { stage: 'Converted',         n:   142000 },
]

const XSELL_OPPORTUNITIES = [
  { product: 'Mobile → Convergent',   eligible: 842000, propensity: 0.68, arpuLift: 18.6, status: 'Active' },
  { product: 'Solo BB → BB+TV',        eligible: 612000, propensity: 0.54, arpuLift: 12.4, status: 'Active' },
  { product: 'Mobile → BB add-on',     eligible: 384000, propensity: 0.44, arpuLift: 24.2, status: 'Planned' },
  { product: '2P → 3P bundle',         eligible: 228000, propensity: 0.38, arpuLift: 32.8, status: 'Planned' },
  { product: 'BB → Business tier',     eligible:  94000, propensity: 0.31, arpuLift: 48.6, status: 'Pilot' },
]

const COHORT_CHURN = [
  { cohort: '0–1 yr', churnQ1: 8.2, churnQ2: 7.8, churnQ3: 7.4, churnQ4: 7.1, nrr:  95 },
  { cohort: '1–2 yr', churnQ1: 4.2, churnQ2: 4.0, churnQ3: 3.8, churnQ4: 3.6, nrr: 101 },
  { cohort: '2–5 yr', churnQ1: 2.1, churnQ2: 2.0, churnQ3: 1.9, churnQ4: 1.8, nrr: 104 },
  { cohort: '5+ yr',  churnQ1: 1.2, churnQ2: 1.1, churnQ3: 1.0, churnQ4: 0.9, nrr: 107 },
]

const RETENTION_OFFERS_EXT = [
  { offer: '20% discount · 12 mo',    segment: 'Price-sensitive',    accept: 62, cost: 9.4,  roi: 4.2, volume: 18400 },
  { offer: 'Free 5G + 50GB',          segment: 'Network churn risk', accept: 48, cost: 6.0,  roi: 3.6, volume: 12600 },
  { offer: '2nd line −50%',           segment: 'Single-product',     accept: 41, cost: 12.5, roi: 2.8, volume:  9800 },
  { offer: 'BSD 50 loyalty credit',      segment: 'Long-tenure >5yr',   accept: 55, cost: 50.0, roi: 1.4, volume: 22400 },
  { offer: 'Device trade-in',         segment: 'Device-led',          accept: 33, cost: 80.0, roi: 0.9, volume:  6200 },
  { offer: 'Entertainment add-on',    segment: 'Streaming-heavy',     accept: 44, cost: 8.0,  roi: 3.1, volume: 14800 },
]

const NRR_BRIDGE = [
  { step: 'NRR opening',        v: 100.0, type: 'start' },
  { step: 'Upsell / upgrades',  v:   2.8, type: 'pos'   },
  { step: 'Cross-sell',         v:   1.4, type: 'pos'   },
  { step: 'Price increase',     v:   0.6, type: 'pos'   },
  { step: 'Churn loss',         v:  -1.8, type: 'neg'   },
  { step: 'Downgrade/promo',    v:  -1.2, type: 'neg'   },
  { step: 'NRR closing',        v: 101.8, type: 'total' },
]

const ARPU_BY_SEGMENT = [
  { seg: 'Enterprise 3P+',  arpu: 128, subs:   42000, nrr: 108 },
  { seg: 'SME Convergent',  arpu:  86, subs:   84000, nrr: 106 },
  { seg: 'Consumer 3P',     arpu:  74, subs:  284000, nrr: 105 },
  { seg: 'Consumer 2P',     arpu:  54, subs:  812000, nrr: 103 },
  { seg: 'Consumer Mobile', arpu:  36, subs: 2840000, nrr: 101 },
  { seg: 'Prepaid',         arpu:  14, subs: 1820000, nrr:  97 },
]

// ─── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'movement' | 'arpu' | 'winback' | 'upsell' | 'xsell' | 'cohorts' | 'offers' | 'nrr'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'movement', label: 'Movement & NRR',      icon: Repeat },
  { id: 'arpu',     label: 'ARPU Migration',       icon: ArrowUpDown },
  { id: 'winback',  label: 'Win-back',             icon: Users },
  { id: 'upsell',   label: 'Upsell',               icon: TrendingUp },
  { id: 'xsell',    label: 'Cross-sell',           icon: Layers },
  { id: 'cohorts',  label: 'Tenure Cohorts',       icon: Activity },
  { id: 'offers',   label: 'Retention Offers',     icon: Target },
  { id: 'nrr',      label: 'NRR Bridge',           icon: Zap },
]

export default function BaseManagementPage() {
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<TabId>('movement')
  const [cohortFilter, setCohortFilter] = useState<string>('All')
  const [offerSort, setOfferSort] = useState<'roi' | 'accepted'>('roi')
  const [showDormant, setShowDormant] = useState(false)
  const [nrrLive, setNrrLive] = useState(102.1)
  const maxWb = WINBACK[0].n

  useEffect(() => {
    const id = setInterval(() => setNrrLive(v => parseFloat((v + (scenarioRandom() - 0.48) * 0.02).toFixed(2))), 8000)
    return () => clearInterval(id)
  }, [])

  const filteredCohorts = useMemo(
    () => cohortFilter === 'All' ? COHORT_CHURN : COHORT_CHURN.filter(c => c.cohort === cohortFilter),
    [cohortFilter],
  )

  const sortedOffers = useMemo(
    () => [...RETENTION_OFFERS_EXT].sort((a, b) => offerSort === 'roi' ? b.roi - a.roi : b.accept - a.accept),
    [offerSort],
  )

  const bridgeDrivers = useMemo(
    () => NRR_BRIDGE.filter(s => s.type !== 'total' && s.type !== 'start'),
    [],
  )

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Base Management & NRR')}
        subtitle={tt('Base movement · net revenue retention · ARPU migration · win-back')}
        actions={<span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-xs">NRR {nrrLive}%</span>}
      />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <KpiCard label={tt('Gross adds / month')} value={`${(CUST_FACTS.grossAddsMo / 1000).toFixed(1)}K`} delta={tt('acquisition engine')} trend="up" icon={TrendingUp} accent />
        <KpiCard label={tt('Net adds / month')} value={`+${(CUST_FACTS.netAddsMo / 1000).toFixed(1)}K`} delta={tt('positive 4 months')} trend="up" icon={Repeat} />
        <KpiCard label={tt('Net revenue retention')} value={`${nrrLive}%`} delta={tt('+0.4 pp QoQ')} trend="up" icon={ArrowUpDown} />
        <KpiCard label={tt('Win-back / month')} value={`${(CUST_FACTS.winBackMo / 1000).toFixed(1)}K`} delta={tt('reactivations')} trend="up" icon={Users} />
        <KpiCard label={tt('Total base (M)')} value="14.66" delta={tt('net +3.2K this month')} trend="up" icon={Activity} />
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label={tt('Upsell conversions / month')} value="142K" delta={tt('+12% MoM')} trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Cross-sell / month')} value="38K" delta={tt('convergent +22%')} trend="up" icon={Layers} />
        <KpiCard label={tt('Average ARPU (BSD )')} value="BSD 48.4" delta={tt('+BSD 1.2 QoQ')} trend="up" icon={ArrowUpDown} />
        <KpiCard label={tt('Save-desk success rate')} value="51%" delta={tt('+4 pp vs target')} trend="up" icon={Target} />
        <KpiCard label={tt('At-risk dormant subscribers')} value="124K" delta={tt('12 months inactive')} trend="down" icon={TrendingDown} />
      </div>

      {/* ML Insight Section */}
      <MlInsightSection
        heading="Base management intelligence"
        models={[
          { name: 'NRR Forecaster', metric: 'MAPE 2.8%', sub: 'NRR trajectory 90 days' },
          { name: 'Upsell Propensity Model', metric: 'AUC 0.88', sub: 'tier upgrade scoring' },
          { name: 'Retention Offer Engine', metric: '+3.1× ROI', sub: 'personalised offer by CLV' },
        ]}
        agentLabel="Run Base Optimiser"
        agentRunningLabel="Optimising…"
        agentSteps={[
          'Identified upgrade-ready & downgrade-risk cohorts',
          'Matched cross-sell / convergent offers by propensity',
          'Sequenced contacts within contact-policy caps',
          'Routed to Marketing & Sales for execution',
        ]}
        agentBlurb="A unified view of the base — movement, ARPU migration, cohorts and NRR bridge — ensures every commercial action starts from the same subscriber truth."
        decision={{
          title: 'Defend NRR by tackling year-1 churn and promo roll-off',
          detail: 'NRR is positive but tight — year-1 churn and post-promo degradation are the biggest gaps. Fixing onboarding and roll-off offers with the ML engine lifts NRR to >103% within two quarters.',
          impact: '+0.6 pp NRR ≈ BSD 6–8M annual revenue',
          risk: 'Roll-off offers can erode ARPU if over-generous — cap by segment',
          linkTo: '#/portal/churn-retention',
          linkLabel: 'Open Churn & Retention',
        }}
        chart={{
          kind: 'area',
          title: 'NRR trajectory — 8 quarters',
          xKey: 'q',
          unit: '%',
          data: NRR_TREND,
          series: [{ key: 'nrr', name: 'NRR %', color: BLUE }],
          note: 'NRR above 100% — expansion outpaces churns + downgrades.',
        }}
        registryNote="Models trained in Snowflake ML · served from Model Registry · features from subscriber Feature Store."
      />

      {/* Tab nav */}
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

      {/* ══ MOVEMENT & NRR ════════════════════════════════════════════════════ */}
      {tab === 'movement' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Base movement — monthly (K subs)')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={WATERFALL.filter(w => w.type !== 'total')}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="step" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}K`, '']} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {WATERFALL.filter(w => w.type !== 'total').map((w, i) => <Cell key={i} fill={w.type === 'pos' ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">{tt('Opening 14.66M → closing 14.66M; gross adds + win-back outpace churns + downgrades.')}</div>
            </Panel>
            <Panel title={tt('Net revenue retention — 8 quarters')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={NRR_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} domain={[98, 104]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'NRR']} />
                    <Line type="monotone" dataKey="nrr" stroke={BLUE} strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('NRR above 100% — expansion outpaces churns + downgrades.')}
              </div>
            </Panel>
          </div>

          <AgentDecision
            title="Base management agent"
            label="Run Base Optimiser" runningLabel="Optimising…"
            steps={[
              'Identified upgrade-ready & downgrade-risk cohorts',
              'Matched cross-sell / convergent offers by propensity',
              'Sequenced contacts within contact-policy caps',
              'Routed to Marketing & Sales for execution',
            ]}
            result={{
              headline: 'Defend NRR by tackling year-1 churn and promo roll-off',
              stats: [
                { label: 'Gross adds / month', value: '41.2K' },
                { label: 'Net adds / month', value: '+3.2K' },
                { label: 'Net revenue retention', value: '102.1%' },
                { label: 'Win-back / month', value: '4.8K' },
              ],
              findings: [
                'NRR is positive but tight — year-1 churn and post-promo degradation are the biggest gaps.',
                'Fixing onboarding and roll-off offers compounds the NRR.',
                'Convergent conversion adds the highest ARPU (+BSD 18.6) — make it the default lever.',
              ],
              note: 'Roll-off offers can erode ARPU if over-generous — cap by segment.',
            }}
            impact="+0.6 pp NRR ≈ BSD 6–8M annual revenue"
            risk="roll-off offers can erode ARPU if over-generous"
            linkTo="#/portal/churn-retention" linkLabel="Open Churn & Retention"
          />

          <div className="mt-4">
            <Panel title={tt('Base management actions — top priorities')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Lever')}</th>
                      <th>{tt('Owner')}</th>
                      <th className="text-right">{tt('Target base')}</th>
                      <th className="text-right">{tt('NRR lift est.')}</th>
                      <th className="text-right">{tt('Revenue BSD M')}</th>
                      <th>{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { lever: 'Year-1 onboarding campaign',        owner: 'CRM & Retention',      base: '2.1M',  nrrLift: '+0.3 pp', rev: 'BSD 3.2M',  status: 'Active' },
                      { lever: 'Promo roll-off → standard price',   owner: 'Pricing',              base: '840K',  nrrLift: '+0.2 pp', rev: 'BSD 2.1M',  status: 'Active' },
                      { lever: 'Convergent Rival ISP B churn risk',         owner: 'Base Mgmt + MNP',      base: '380K',  nrrLift: '+0.1 pp', rev: 'BSD 1.1M',  status: 'Planned' },
                      { lever: '5G upsell for 2-5 yr cohort',        owner: 'Digital Commercial',   base: '1.2M',  nrrLift: '+0.4 pp', rev: 'BSD 4.8M',  status: 'Active' },
                      { lever: 'Win-back lapsed 12-18 months',       owner: 'Marketing & Loyalty',  base: '124K',  nrrLift: '+0.1 pp', rev: 'BSD 0.8M',  status: 'Pilot' },
                    ].map(a => (
                      <tr key={a.lever} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold text-xs">{tt(a.lever)}</td>
                        <td className="text-xs text-vfes-dark/65">{a.owner}</td>
                        <td className="text-right font-mono text-xs">{a.base}</td>
                        <td className="text-right font-bold text-emerald-600">{a.nrrLift}</td>
                        <td className="text-right font-bold text-emerald-600">{a.rev}</td>
                        <td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            a.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                            a.status === 'Planned' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>{tt(a.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
                {tt('Source:')} <span className="font-mono">CBL_ANALYTICS.BASE_MGMT.ACTION_QUEUE</span> · {tt('updated daily')}
              </div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Churn & Retention')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/bundle-propensity" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Bundle Propensity')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/clv" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('CLV Model')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      {/* ══ ARPU MIGRATION ════════════════════════════════════════════════════ */}
      {tab === 'arpu' && (
        <>
          <Panel
            title={tt('ARPU migration — value flows')}
            action={<AgentAction label="Run Base Optimiser" runningLabel="Optimising…"
              steps={[
                'Identified upgrade-ready & downgrade-risk cohorts',
                'Matched cross-sell / convergent offers by propensity',
                'Sequenced contacts within contact-policy caps',
                'Routed to Marketing & Sales for execution',
              ]} />}
          >
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={ARPU_MIGRATION} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="flow" stroke="#999" fontSize={10} width={150} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString('en-BS')} subs · BSD ${p.payload.arpuDelta} ARPU Δ`, tt('Flow')]} />
                  <Bar dataKey="subs" radius={[0, 4, 4, 0]}>
                    {ARPU_MIGRATION.map((a, i) => <Cell key={i} fill={a.subs >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('Convergent conversion adds the highest ARPU (+BSD 18.6) — make it the default lever.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Average ARPU by customer segment')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={ARPU_BY_SEGMENT} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="BSD " />
                    <YAxis type="category" dataKey="seg" stroke="#999" fontSize={10} width={150} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}`, 'ARPU']} />
                    <Bar dataKey="arpu" fill={NAVY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 text-xs">
                <Link to="/portal/pricing-simulator" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                  {tt('Pricing Simulator')} <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to="/portal/product" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                  {tt('Product Catalogue')} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Monthly ARPU bridge — price movements and product mix')}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 mb-1">{tt('ARPU uplift')}</div>
                  <div className="text-xl font-extrabold text-emerald-700">+BSD 2.1</div>
                  <div className="text-[11px] text-emerald-600">{tt('Tier upgrade + convergent')}</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-red-600 mb-1">{tt('ARPU dilution')}</div>
                  <div className="text-xl font-extrabold text-red-700">−BSD 0.9</div>
                  <div className="text-[11px] text-red-600">{tt('Downgrade + promo roll-off')}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-1">{tt('Net ARPU Δ')}</div>
                  <div className="text-xl font-extrabold text-blue-700">+BSD 1.2</div>
                  <div className="text-[11px] text-blue-600">{tt('+2.5% QoQ · on target')}</div>
                </div>
              </div>
              <div className="text-[10px] text-vfes-dark/45 uppercase tracking-widest">
                {tt('Source:')} <span className="font-mono">CBL_ANALYTICS.REVENUE.ARPU_BRIDGE_V2</span> · {tt('Closed month data')}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ══ WIN-BACK ══════════════════════════════════════════════════════════ */}
      {tab === 'winback' && (
        <Panel title={tt('Win-back funnel — lapsed → reactivated')}>
          <div className="space-y-2.5 mt-2">
            {WINBACK.map((s, i) => (
              <div key={s.stage} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span>{tt(s.stage)}</span>
                  <span className="font-mono text-xs">{s.n.toLocaleString('en-BS')}</span>
                </div>
                <div className="h-2 rounded bg-black/5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(s.n / maxWb) * 100}%`, background: i === WINBACK.length - 1 ? GREEN : NAVY }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('7.7% of lapsed subscribers reactivate — target the 12-month cohort before the recycling window.')}
          </div>
          <div className="mt-4">
            <Panel title={tt('Win-back trend — monthly activations 12 months')}>
              <div className="h-52">
                <ResponsiveContainer>
                  <ComposedChart data={Array.from({ length: 12 }, (_, i) => ({
                    m: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'][i],
                    activ: 7800 + Math.round(Math.sin(i / 2.5) * 1200 + i * 140),
                    target: 9600,
                    cost: 46 + i * 1.8,
                  }))}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={10} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(1)}K`} />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="BSD " />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar  yAxisId="l" dataKey="activ"  fill={GREEN} radius={[4,4,0,0]} name={tt('Reactivated')} />
                    <Line yAxisId="l" type="monotone" dataKey="target" stroke={NAVY} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name={tt('Monthly target')} />
                    <Line yAxisId="r" type="monotone" dataKey="cost"   stroke={RED}  strokeWidth={1.8} dot={false} name={tt('Average cost BSD ')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Reactivations rising — win-back cost increasing; tighten trade-in eligibility to maintain ROI.')}</div>
            </Panel>
          </div>

          <div className="mt-4 grid lg:grid-cols-3 gap-3">
            {[
              { ch: 'Outbound call',  rate: 14.2, vol: 9600,  cost: 12, badge: 'Priority' },
              { ch: 'SMS / RCS',      rate:  6.8, vol: 6400,  cost:  2, badge: 'Scale' },
              { ch: 'Email nurture',  rate:  3.1, vol: 3200,  cost:  1, badge: 'Volume' },
              { ch: 'App push',       rate:  8.4, vol: 4800,  cost:  0, badge: 'Digital' },
              { ch: 'Retail',         rate: 18.6, vol: 1800,  cost: 28, badge: 'Premium' },
              { ch: 'Door-to-door',   rate: 21.2, vol:  600,  cost: 84, badge: 'High-value' },
            ].map(c => (
              <div key={c.ch} className="rounded-xl border border-black/5 bg-[#fafbfc] p-3">
                <div className="text-xs font-bold mb-1">{tt(c.ch)}</div>
                <div className="text-2xl font-extrabold text-vfes-dark">{c.rate}%</div>
                <div className="text-[10px] text-vfes-dark/55 mt-1">{(c.vol/1000).toFixed(1)}K reactivated · cost BSD {c.cost}/contact</div>
                <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-vfes-red/10 text-vfes-dark">{tt(c.badge)}</span>
              </div>
            ))}
          </div>

          {showDormant && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {tt('124K lapsed subscribers — last activity 12–18 months ago. Exclude from standard campaigns; run dedicated win-back journey with device trade-in incentive.')}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={() => setShowDormant(d => !d)}
              className="text-xs font-bold text-vfes-dark border border-vfes-red/30 px-3 py-1.5 rounded hover:bg-vfes-red/5">
              {showDormant ? tt('Hide dormant detail') : tt('Show dormant detail')}
            </button>
            <Link to="/portal/mnp" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('MNP Flow')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/marketing" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Marketing Campaigns')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Panel>
      )}

      {/* ══ UPSELL ════════════════════════════════════════════════════════════ */}
      {tab === 'upsell' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Upsell & cross-sell — 8 quarters')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={UPSELL_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}K`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="upsell" fill={BLUE}  name={tt('Upsell')}       radius={[4, 4, 0, 0]} />
                    <Bar dataKey="xsell"  fill={GREEN} name={tt('Cross-sell')}   radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="target" stroke={RED} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name={tt('Target')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Upsell consistently above target; cross-sell accelerating in H2-26.')}</div>
            </Panel>

            <Panel title={tt('Upsell eligibility funnel')}>
              <div className="space-y-2.5 mt-2">
                {UPSELL_FUNNEL.map((s, i) => (
                  <div key={s.stage} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">{tt(s.stage)}</span>
                      <span className="font-mono text-xs">{(s.n / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="h-2 rounded bg-black/5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(s.n / UPSELL_FUNNEL[0].n) * 100}%`, background: i === UPSELL_FUNNEL.length - 1 ? GREEN : BLUE }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('Conversion 12.7% on eligibles — top decile 4.2× vs random.')}
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={tt('Upsell campaign calendar — Q3-Q2 2027')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="py-2">{tt('Campaign')}</th>
                      <th>{tt('Channel')}</th>
                      <th className="text-right">{tt('Audience')}</th>
                      <th className="text-right">{tt('Est. conv.')}</th>
                      <th className="text-right">{tt('ARPU lift')}</th>
                      <th>{tt('Launch')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { camp: '5G upgrade for 2-5yr cohort',  canal: 'App + Outbound', aud: '1.2M',  conv: '152K', lift: '+BSD 8.4',  launch: 'Jul-26' },
                      { camp: 'Convergent Rival ISP B churn risk',    canal: 'Outbound + SMS', aud: '380K',  conv:  '48K', lift: '+BSD 18.6', launch: 'Jul-26' },
                      { camp: 'BB+TV bundle 2P',               canal: 'Retail + App',   aud: '612K',  conv:  '72K', lift: '+BSD 12.4', launch: 'Aug-26' },
                      { camp: 'Mega prepaid upgrade',           canal: 'SMS + Retail',   aud: '228K',  conv:  '28K', lift: '+BSD 24.2', launch: 'Sep-26' },
                      { camp: 'B2B Business tier SoHo',        canal: 'Phone + EDM',    aud: '94K',   conv:  '11K', lift: '+BSD 48.6', launch: 'Oct-26' },
                    ].map(c => (
                      <tr key={c.camp} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="py-2.5 font-semibold text-xs">{tt(c.camp)}</td>
                        <td className="text-xs text-vfes-dark/65">{tt(c.canal)}</td>
                        <td className="text-right font-mono text-xs">{c.aud}</td>
                        <td className="text-right font-bold text-emerald-600">{c.conv}</td>
                        <td className="text-right font-bold text-emerald-600">{c.lift}</td>
                        <td className="text-xs font-mono text-vfes-dark/65">{c.launch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <Link to="/portal/marketing" className="font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
                <Link to="/portal/voc" className="font-bold text-vfes-dark hover:underline">{tt('VOC →')}</Link>
                <Link to="/portal/experience" className="font-bold text-vfes-dark hover:underline">{tt('Experiencia →')}</Link>
              </div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <Link to="/portal/bundle-propensity" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Bundle propensity')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/sales" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Sales Dashboard')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      {/* ══ CROSS-SELL ════════════════════════════════════════════════════════ */}
      {tab === 'xsell' && (
        <>
          <Panel title={tt('Cross-sell opportunity matrix — eligible base × ARPU lift × propensity')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={XSELL_OPPORTUNITIES} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="product" stroke="#999" fontSize={10} width={180} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(0)}K subs`]} />
                  <Bar dataKey="eligible" fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Product flow')}</th>
                    <th className="text-right">{tt('Eligible')}</th>
                    <th className="text-right">{tt('Propensity')}</th>
                    <th className="text-right">{tt('ARPU lift BSD ')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {XSELL_OPPORTUNITIES.map(o => (
                    <tr key={o.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(o.product)}</td>
                      <td className="text-right font-mono text-xs">{(o.eligible / 1000).toFixed(0)}K</td>
                      <td className="text-right font-bold">{(o.propensity * 100).toFixed(0)}%</td>
                      <td className="text-right font-bold text-emerald-600">+BSD {o.arpuLift}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          o.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          o.status === 'Planned' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{tt(o.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
            <Panel title={tt('ARPU lift impact by cross-sell flow — 12 months')}>
              <div className="h-52">
                <ResponsiveContainer>
                  <AreaChart data={Array.from({ length: 12 }, (_, i) => ({
                    m: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'][i],
                    converg: Math.round(6800 + i * 420 + Math.sin(i) * 480),
                    bbTv:    Math.round(5200 + i * 280 + Math.sin(i + 1) * 360),
                    bbMob:   Math.round(3100 + i * 180 + Math.sin(i + 2) * 240),
                  }))}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v)/1000).toFixed(1)}K subs`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="converg" stroke={BLUE}  fill={BLUE}  fillOpacity={0.25} name={tt('Mobile → Convergent')} />
                    <Area type="monotone" dataKey="bbTv"    stroke={NAVY}  fill={NAVY}  fillOpacity={0.20} name={tt('BB → BB+TV')} />
                    <Area type="monotone" dataKey="bbMob"   stroke={GREEN} fill={GREEN} fillOpacity={0.20} name={tt('Mobile → BB add-on')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">{tt('Convergent dominates by volume and ARPU lift — BB+TV growing faster quarter-on-quarter.')}</div>
            </Panel>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <Link to="/portal/bundle-propensity" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Bundle Propensity')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/loyalty-consent" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Consent & Loyalty')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          </Panel>
        </>
      )}

      {/* ══ TENURE COHORTS ════════════════════════════════════════════════════ */}
      {tab === 'cohorts' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Cohort:')}</span>
            {['All', ...COHORT_CHURN.map(c => c.cohort)].map(c => (
              <button key={c} onClick={() => setCohortFilter(c)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${cohortFilter === c ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {c === 'All' ? tt('All') : c}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Churn rate by tenure cohort — quarterly (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={filteredCohorts}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="churnQ1" stroke={RED}   strokeWidth={2} name={tt('Q1 churn %')} />
                    <Line type="monotone" dataKey="churnQ2" stroke={NAVY}  strokeWidth={2} name={tt('Q2 churn %')} />
                    <Line type="monotone" dataKey="churnQ3" stroke={BLUE}  strokeWidth={2} name={tt('Q3 churn %')} />
                    <Line type="monotone" dataKey="churnQ4" stroke={GREEN} strokeWidth={2} name={tt('Q4 churn %')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('NRR by cohort — longer tenure = higher NRR')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={COHORT_CHURN}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[90, 112]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'NRR']} />
                    <ReferenceLine y={100} stroke={GREEN} strokeDasharray="3 3" />
                    <Bar dataKey="nrr" radius={[4, 4, 0, 0]}>
                      {COHORT_CHURN.map((c, i) => <Cell key={i} fill={c.nrr >= 100 ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('The 0-1 year cohort is the only one with NRR <100% — onboarding investment pays back within 18 months.')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('Tenure cohort scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Cohort')}</th>
                    <th className="text-right">{tt('Q1 churn %')}</th>
                    <th className="text-right">{tt('Q2 churn %')}</th>
                    <th className="text-right">{tt('Q3 churn %')}</th>
                    <th className="text-right">{tt('Q4 churn %')}</th>
                    <th className="text-right">{tt('NRR')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COHORT_CHURN.map(c => (
                    <tr key={c.cohort} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold">{c.cohort}</td>
                      <td className={`text-right font-bold ${c.churnQ1 > 5 ? 'text-red-600' : c.churnQ1 > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.churnQ1}%</td>
                      <td className={`text-right font-bold ${c.churnQ2 > 5 ? 'text-red-600' : c.churnQ2 > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.churnQ2}%</td>
                      <td className={`text-right font-bold ${c.churnQ3 > 5 ? 'text-red-600' : c.churnQ3 > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.churnQ3}%</td>
                      <td className={`text-right font-bold ${c.churnQ4 > 5 ? 'text-red-600' : c.churnQ4 > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.churnQ4}%</td>
                      <td className={`text-right font-bold ${c.nrr >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>{c.nrr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <Link to="/portal/churn-retention" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('Churn & Retention')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/clv" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('CLV Model')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/customer-360" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('Customer 360')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </Panel>

          <div className="mt-4">
            <Panel title={tt('Financial impact by lifecycle — cumulative NRR per cohort')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={[
                    { yr: 'Year 1', c01: 95,  c12: null, c25: null, c5p: null },
                    { yr: 'Year 2', c01: 98,  c12: 101,  c25: null, c5p: null },
                    { yr: 'Year 3', c01: 100, c12: 103,  c25: 104,  c5p: null },
                    { yr: 'Year 4', c01: 101, c12: 104,  c25: 105,  c5p: 107  },
                    { yr: 'Year 5', c01: 102, c12: 105,  c25: 106,  c5p: 108  },
                  ]}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="yr" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="%" domain={[92, 112]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => v !== null ? [`${v}%`, ''] : ['—', '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={100} stroke={GREEN} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="c01"  stroke={RED}   fill={RED}   fillOpacity={0.15} strokeWidth={2} name={tt('Cohort 0-1yr')} connectNulls={false} />
                    <Area type="monotone" dataKey="c12"  stroke={NAVY}  fill={NAVY}  fillOpacity={0.15} strokeWidth={2} name={tt('Cohort 1-2yr')} connectNulls={false} />
                    <Area type="monotone" dataKey="c25"  stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} strokeWidth={2} name={tt('Cohort 2-5yr')} connectNulls={false} />
                    <Area type="monotone" dataKey="c5p"  stroke={GREEN} fill={GREEN} fillOpacity={0.15} strokeWidth={2} name={tt('Cohort 5+yr')} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('Each cohort crosses NRR 100% in year 2 if the right lever is activated — the 0-1yr gap disappears with intensive onboarding.')}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ══ RETENTION OFFERS ══════════════════════════════════════════════════ */}
      {tab === 'offers' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
            {(['roi', 'accepted'] as const).map(k => (
              <button key={k} onClick={() => setOfferSort(k)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${offerSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                {k === 'roi' ? tt('By ROI') : tt('By acceptance')}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('Retention offer ROI')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sortedOffers} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={(v) => `${v}×`} />
                    <YAxis type="category" dataKey="offer" stroke="#999" fontSize={9} width={160} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}×`, 'ROI']} />
                    <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                      {sortedOffers.map((o, i) => <Cell key={i} fill={o.roi >= 3 ? GREEN : o.roi >= 2 ? BLUE : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Acceptance rate by offer (%)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sortedOffers}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="offer" stroke="#999" fontSize={8} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Acceptance')]} />
                    <Bar dataKey="accept" fill={NAVY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Retention offer scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Offer')}</th>
                    <th>{tt('Target segment')}</th>
                    <th className="text-right">{tt('Acceptance %')}</th>
                    <th className="text-right">{tt('Cost BSD ')}</th>
                    <th className="text-right">{tt('ROI')}</th>
                    <th className="text-right">{tt('Volume / month')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOffers.map(o => (
                    <tr key={o.offer} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(o.offer)}</td>
                      <td className="text-xs text-vfes-dark/65">{tt(o.segment)}</td>
                      <td className="text-right font-mono">{o.accept}%</td>
                      <td className="text-right font-mono">BSD {o.cost.toFixed(1)}</td>
                      <td className={`text-right font-bold ${o.roi >= 3 ? 'text-emerald-600' : o.roi >= 2 ? 'text-blue-600' : 'text-red-600'}`}>{o.roi.toFixed(1)}×</td>
                      <td className="text-right font-mono">{o.volume.toLocaleString('en-BS')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <Link to="/portal/contact-center" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('Contact Center')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/ai-insights" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('AI Insights')} <ChevronRight className="w-3 h-3" />
              </Link>
              <Link to="/portal/promotions" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
                {tt('Promotions')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </Panel>
        </>
      )}

      {/* ══ NRR BRIDGE ════════════════════════════════════════════════════════ */}
      {tab === 'nrr' && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Panel title={tt('NRR bridge — current quarter drivers')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={bridgeDrivers}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="step" stroke="#999" fontSize={9} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#999" fontSize={11} unit=" pp" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v > 0 ? '+' : ''}${Number(v).toFixed(1)} pp`, '']} />
                    <ReferenceLine y={0} stroke="#999" />
                    <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                      {bridgeDrivers.map((s, i) => <Cell key={i} fill={s.v >= 0 ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('NRR closing:')} <span className="font-bold text-emerald-600">101.8%</span> {tt('— upsell + cross-sell + price outpace churn loss + downgrade.')}
              </div>
            </Panel>

            <Panel title={tt('NRR trend — 8 quarters')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={NRR_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} domain={[97, 105]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'NRR']} />
                    <ReferenceLine y={100} stroke={GREEN} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="nrr" stroke={BLUE} strokeWidth={2.4} fill={BLUE} fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-vfes-dark/55">
                {tt('8-quarter trajectory to NRR 105% target EOY 2026 — on track.')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('NRR by customer segment — current quarter')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Segment')}</th>
                    <th className="text-right">{tt('ARPU BSD ')}</th>
                    <th className="text-right">{tt('Subs')}</th>
                    <th className="text-right">{tt('NRR %')}</th>
                    <th className="text-right">{tt('Rev. contribution BSD M')}</th>
                    <th>{tt('RAG Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ARPU_BY_SEGMENT.map(s => (
                    <tr key={s.seg} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{tt(s.seg)}</td>
                      <td className="text-right font-mono">BSD {s.arpu}</td>
                      <td className="text-right font-mono text-xs">{(s.subs / 1000).toFixed(0)}K</td>
                      <td className={`text-right font-bold ${s.nrr >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>{s.nrr}%</td>
                      <td className="text-right font-mono text-xs">BSD {((s.arpu * s.subs) / 1_000_000).toFixed(1)}M</td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.nrr >= 105 ? 'bg-emerald-50 text-emerald-700' :
                          s.nrr >= 100 ? 'bg-blue-50 text-blue-700' :
                          'bg-red-50 text-red-700'
                        }`}>{s.nrr >= 105 ? tt('Excellent') : s.nrr >= 100 ? tt('On target') : tt('Watch')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/45 uppercase tracking-widest">
              {tt('Revenue contribution = ARPU × subs · NRR measured on prior-period recurring revenue.')}
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Upsell & cross-sell — 8 quarters cumulative')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={UPSELL_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${(Number(v)/1000).toFixed(1)}K`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="upsell" stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('Upsell')} />
                    <Area type="monotone" dataKey="xsell"  stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Cross-sell')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard label={tt('Total upsell Q4-26')} value="55.2K" delta={tt('+5.2K vs Q1')} trend="up" icon={TrendingUp} />
                <KpiCard label={tt('Total cross-sell Q4-26')} value="25.8K" delta={tt('+3.4K vs Q1')} trend="up" icon={Layers} />
              </div>
              <div className="p-4 rounded-xl border border-black/5 bg-[#fafbfc]">
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Recommended next actions')}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 mt-0.5 shrink-0" /><span>{tt('Scale 5G upsell campaign in 2-5yr cohort — highest portfolio ROI')}</span></div>
                  <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 shrink-0" /><span>{tt('Activate Convergent cross-sell for Mobile-only eligibles — 842K targets')}</span></div>
                  <div className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shrink-0" /><span>{tt('Review BB→Business tier offer — low propensity but very high ARPU lift')}</span></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to="/portal/marketing" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('Marketing →')}</Link>
                  <span className="text-vfes-dark/30">·</span>
                  <Link to="/portal/digital-app" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('App Digital →')}</Link>
                  <span className="text-vfes-dark/30">·</span>
                  <Link to="/portal/b2b" className="text-[10px] font-bold text-vfes-dark hover:underline">{tt('B2B →')}</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <Link to="/portal/executive" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Executive Dashboard')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/finance" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Finance')} <ChevronRight className="w-3 h-3" />
            </Link>
            <Link to="/portal/operations" className="font-bold text-vfes-dark hover:underline flex items-center gap-1">
              {tt('Operations')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl bg-gradient-to-br from-vfes-red/8 to-transparent border border-vfes-red/15 p-5">
        <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Base management summary — priority actions')}</div>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-vfes-dark/70">
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Defend NRR')}</div>
            <div>{tt('Activate anti roll-off offers 30d before contract end for 840K customers in promo period — potential +0.2 pp NRR.')}</div>
            <Link to="/portal/promotions" className="text-vfes-dark font-semibold mt-1 inline-block hover:underline">{tt('Promotions →')}</Link>
          </div>
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Grow via convergent')}</div>
            <div>{tt('842K Mobile-only with propensity ≥ 0.68 — best ARPU lift lever (+BSD 18.6). Prioritise App channel and high-value outbound.')}</div>
            <Link to="/portal/bundle-propensity" className="text-vfes-dark font-semibold mt-1 inline-block hover:underline">{tt('Bundle Propensity →')}</Link>
          </div>
          <div>
            <div className="font-bold text-vfes-dark mb-1">{tt('Year-1 cohort onboarding')}</div>
            <div>{tt('Reduce year-1 churn from 8.2% → 5% via proactive journey — NRR 100% crossing in year 2 vs current year 3.')}</div>
            <Link to="/portal/experience" className="text-vfes-dark font-semibold mt-1 inline-block hover:underline">{tt('Experience →')}</Link>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-vfes-dark/35 uppercase tracking-widest border-t border-black/5 pt-3">
        {tt('Data updated daily \u00b7 Primary source:')} <span className="font-mono">CBL_ANALYTICS.BASE_MGMT</span> \u00b7 {tt('Models in Snowflake Model Registry')}
      </div>

      <AskTheData />
    </div>
  )
}
