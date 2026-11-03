// =============================================================================
// Product & Content cockpit (senior-PM grade)
// 8 tabs · global filters · BCG matrix · cohort retention · content rate-card
// Now/Next/Later roadmap · VoC · competitive parity · experiments
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import KpiCard from '../../components/KpiCard'
import {
  PackageSearch, Tv, Smartphone, Wifi, Eye, Film, Activity, Layers, Heart,
  Calendar, Briefcase, Users, Shield, BarChart3, Sparkles, TrendingUp, TrendingDown,
  Target, Gauge, AlertTriangle, CheckCircle, Clock, Settings, Globe, Cpu, Award,
  ChevronRight, FlaskConical, Star, Lightbulb, Coins,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis,
  PieChart, Pie,
} from 'recharts'
import { MOBILE_PRODUCTS } from './_mobile_data'
import {
  skus, content, roadmap, shipped, complaints, featureRequests, churnReasons, npsSeries,
  dauMauSeries, retentionCurves, featureUsage, tileClicks, tvHoursByGenre,
  parityMatrix, competitorMoves, experiments, betaProgram, discoveryFunnel,
  cannibFlows, lifecycleColor, buildSkuDetails, type LifecycleStage, type RoadmapItem, type SKU, type SkuDetails,
} from './_product_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const RED_LIGHT = '#FF8585'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const GREY = '#94a3b8'

const catIcon: Record<string, any> = {
  Broadband: Wifi, TV: Tv, Mobile: Smartphone, Bundle: PackageSearch, 'Add-on': Sparkles, B2B: Briefcase,
}

type SubTab = 'portfolio' | 'lifecycle' | 'engagement' | 'content' | 'roadmap' | 'voc' | 'competitive' | 'experiments' | 'sku360'

const subTabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
  { id: 'portfolio',    label: 'Portfolio',         icon: Gauge },
  { id: 'lifecycle',    label: 'Lifecycle',         icon: Heart },
  { id: 'engagement',   label: 'Engagement',        icon: Activity },
  { id: 'content',      label: 'Content Economics', icon: Film },
  { id: 'roadmap',      label: 'Roadmap',           icon: Calendar },
  { id: 'voc',          label: 'Voice of Customer', icon: Users },
  { id: 'competitive',  label: 'Competitive',       icon: Shield },
  { id: 'experiments',  label: 'Experiments',       icon: FlaskConical },
  { id: 'sku360',       label: 'SKU 360',           icon: PackageSearch },
]

type Filters = {
  squad: 'all' | SKU['squad']
  stage: 'all' | LifecycleStage
  region: 'all' | 'nassau' | 'freeport' | 'abaco' | 'rural' | 'new-providence'
  quarter: 'q1' | 'q2' | 'q3' | 'q4'
  // tab-local
  cohort: 'new' | 'mature' | 'decline' | 'all'
  renewalWindow: 6 | 12 | 24
  theme: 'all' | 'Speed' | 'Mobile' | 'TV' | 'AI' | 'Smart Home' | 'Network' | 'Apps'
  confidence: 'all' | 'Committed' | 'Likely' | 'Exploratory'
  competitor: 'all' | 'btc' | 'orange' | 'digi' | 'voo'
  expStatus: 'all' | 'Running' | 'Won' | 'Lost' | 'Inconclusive' | 'Shipped'
}

const defaultFilters: Filters = {
  squad: 'all', stage: 'all', region: 'all', quarter: 'q2',
  cohort: 'all', renewalWindow: 24, theme: 'all', confidence: 'all', competitor: 'all', expStatus: 'all',
}

export default function ProductPage() {
  const [sub, setSub] = useState<SubTab>('portfolio')
  const [selectedSku, setSelectedSku] = useState<string>(() => {
    if (typeof window === 'undefined') return 'BB_1G'
    const m = window.location.hash.match(/[?&]sku=([A-Z0-9_]+)/)
    if (m) return m[1]
    try { const raw = localStorage.getItem('product-cockpit-sku'); if (raw) return raw } catch { /* ignore */ }
    return 'BB_1G'
  })
  useEffect(() => { try { localStorage.setItem('product-cockpit-sku', selectedSku) } catch { /* ignore */ } }, [selectedSku])
  const drillInto = (code: string) => { setSelectedSku(code); setSub('sku360') }
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window === 'undefined') return defaultFilters
    try { const raw = localStorage.getItem('product-cockpit-filters'); if (raw) return { ...defaultFilters, ...JSON.parse(raw) } } catch { /* ignore */ }
    return defaultFilters
  })
  useEffect(() => { try { localStorage.setItem('product-cockpit-filters', JSON.stringify(filters)) } catch { /* ignore */ } }, [filters])
  useEffect(() => {
    const scoped = filters.squad === 'all' ? skus : skus.filter((s) => s.squad === filters.squad)
    if (!scoped.find((s) => s.code === selectedSku)) setSelectedSku(scoped[0]?.code ?? 'BB_1G')
     
  }, [filters.squad])
  const setF = (patch: Partial<Filters>) => setFilters((s) => ({ ...s, ...patch }))

  // Filtered SKU set
  const filteredSkus = useMemo(() => skus.filter((s) =>
    (filters.squad === 'all' || s.squad === filters.squad) &&
    (filters.stage === 'all' || s.stage === filters.stage)
  ), [filters.squad, filters.stage])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Product & Content')}
        subtitle={tt('22 SKUs · 12 content deals · 14 roadmap items · 10 active experiments · live PM cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('PM Cockpit')}</div>}
      />

      <AgentDecision
        title={tt('Portfolio rationalisation (Cortex)')}
        label="Run Portfolio Rationalisation"
        runningLabel="Analysing…"
        steps={[
          'Scored SKUs on margin, growth & cannibalisation',
          'Placed each on the BCG grid (star/cash/dog)',
          'Identified sunset candidates & overlaps',
          'Drafted retire / refresh / invest roadmap',
        ]}
        hint={tt('Turns the catalogue into a ranked retire / refresh / invest plan.')}
        result={{
          headline: 'Sunset the EOL set-top SKUs; reinvest in streaming TV',
          stats: [
            { label: 'Active SKUs', value: '22' },
            { label: 'Content ROI', value: '2.3×' },
            { label: 'App MAUs', value: '612K' },
            { label: 'Portfolio NPS', value: '38' },
          ],
          findings: [
            'Declining-stage set-top SKUs carry low margin and cannibalise TV Total.',
            'Retiring them and steering subs to streaming protects TV margin and simplifies the catalogue.',
          ],
          note: 'Migration friction for legacy STB base is the key risk.',
        }}
        impact="+TV margin · lower support cost"
        risk="migration friction for legacy STB base"
        linkTo="#/portal/bundle-profitability"
        linkLabel="Open Bundle Profitability"
      />

      {/* ── Related cockpits ── */}
      <div className="flex flex-wrap gap-2 my-4 px-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 self-center">{tt('Related')}</span>
        <Link to="/portal/pricing-simulator" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Pricing Simulator')}</Link>
        <Link to="/portal/bundle-profitability" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Bundle Profitability')}</Link>
        <Link to="/portal/bundle-propensity" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Bundle Propensity')}</Link>
        <Link to="/portal/sales" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Sales')}</Link>
        <Link to="/portal/marketing" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Marketing')}</Link>
        <Link to="/portal/churn-retention" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Churn & Retention')}</Link>
        <Link to="/portal/customer-360" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Customer 360')}</Link>
        <Link to="/portal/ai-insights" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('AI Insights')}</Link>
        <Link to="/portal/channel-dealers" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Channel & Dealers')}</Link>
        <Link to="/portal/promotions" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Promotions')}</Link>
        <Link to="/portal/finance" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Finance')}</Link>
      </div>
      <MlInsightSection
        heading={tt('Product ML')}
        models={[
          { name: tt('SKU Propensity'), metric: '72%', sub: tt('XGBoost · 22 SKUs') },
          { name: tt('Cannibalisation'), metric: '\u22124.2%', sub: tt('Causal ML · Snowflake') },
          { name: tt('Content ROI'), metric: '2.3×', sub: tt('Attribution model') },
        ]}
        agentLabel={tt('Run Portfolio Rationalisation')}
        agentSteps={[
          'Scored SKUs on margin, growth and cannibalisation',
          'Placed each on the BCG grid (star/cash/dog)',
          'Identified sunset candidates and overlaps',
          'Drafted retire / refresh / invest roadmap',
        ]}
        agentBlurb={tt('Snowpark ML portfolio model. 22 SKUs · 12 content deals. Refreshed daily 03:00 UTC.')}
        decision={{
          title: tt('Sunset EOL set-top SKUs · reinvest in streaming TV'),
          detail: tt('Declining-stage STB SKUs carry low margin and cannibalise REVTV. Retiring them protects TV margin and simplifies the catalogue.'),
          impact: tt('+TV margin · lower support cost'),
          risk: tt('Migration friction for legacy STB base.'),
          linkTo: '/portal/bundle-profitability',
          linkLabel: tt('Open Bundle Profitability'),
        }}
        chart={{
          kind: 'bar',
          title: tt('SKU gross margin % by lifecycle stage'),
          data: [
            { stage: tt('Intro'), margin: 28 },
            { stage: tt('Growth'), margin: 42 },
            { stage: tt('Mature'), margin: 38 },
            { stage: tt('Decline'), margin: 21 },
          ],
          xKey: 'stage',
          series: [{ key: 'margin', name: tt('Gross margin %'), color: '#10b981' }],
          unit: '%',
          note: tt('Decline-stage SKUs average 21% margin vs 42% in Growth — sunset priority.'),
          colorBy: { key: 'margin', high: 40, mid: 30 },
        }}
      />

      {/* Global filters */}
      <Panel>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Squad')}</div>
            <select value={filters.squad} onChange={(e) => setF({ squad: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All squads')}</option><option value="BB">{tt('Broadband')}</option><option value="TV">{tt('TV')}</option><option value="Mobile">{tt('Mobile')}</option><option value="Bundles">{tt('Bundles')}</option><option value="Apps">{tt('Apps')}</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Lifecycle')}</div>
            <select value={filters.stage} onChange={(e) => setF({ stage: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All stages')}</option><option value="Intro">{tt('Intro')}</option><option value="Growth">{tt('Growth')}</option><option value="Mature">{tt('Mature')}</option><option value="Decline">{tt('Decline')}</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Region')}</div>
            <select value={filters.region} onChange={(e) => setF({ region: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="all">{tt('All The Bahamas')}</option><option value="nassau">{tt('Nassau')}</option><option value="freeport">{tt('Freeport')}</option><option value="abaco">{tt('Abaco')}</option><option value="rural">{tt('Rest of The Bahamas')}</option><option value="new-providence">{tt('New Providence')}</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold mb-1">{tt('Quarter')}</div>
            <select value={filters.quarter} onChange={(e) => setF({ quarter: e.target.value as any })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="q1">{tt('Q3 2026')}</option><option value="q2">{tt('Q4 2026')}</option><option value="q3">{tt('Q1 2027')}</option><option value="q4">{tt('Q2 2027')}</option>
            </select>
          </div>
        </div>
      </Panel>

      {/* Sub-tab nav */}
      <div className="flex flex-wrap gap-2 my-6">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition ${sub === id ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Per-tab knob strip */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-2.5 rounded-lg bg-vfes-red/5 border border-vfes-red/15 text-xs">
        {sub === 'portfolio' && <span className="text-vfes-dark/55 italic">{tt('Use global filters above. Click a SKU row to drill in.')}</span>}
        {sub === 'lifecycle' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Lifecycle knobs')}</span>
          <label className="flex items-center gap-1.5">Cohort
            <select value={filters.cohort} onChange={(e) => setF({ cohort: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="new">{tt('New (M0-M12)')}</option><option value="mature">{tt('Mature (M12-M36)')}</option><option value="decline">{tt('Decline (36m+)')}</option>
            </select>
          </label>
        </>}
        {sub === 'engagement' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Engagement knobs')}</span>
          <label className="flex items-center gap-1.5">Cohort
            <select value={filters.cohort} onChange={(e) => setF({ cohort: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="new">{tt('New')}</option><option value="mature">{tt('Mature')}</option><option value="decline">{tt('Decline')}</option>
            </select>
          </label>
        </>}
        {sub === 'content' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Content knobs')}</span>
          <label className="flex items-center gap-1.5">Renewal window
            <select value={filters.renewalWindow} onChange={(e) => setF({ renewalWindow: Number(e.target.value) as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={6}>{tt('6 mo')}</option><option value={12}>{tt('12 mo')}</option><option value={24}>{tt('24 mo')}</option>
            </select>
          </label>
        </>}
        {sub === 'roadmap' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Roadmap knobs')}</span>
          <label className="flex items-center gap-1.5">Theme
            <select value={filters.theme} onChange={(e) => setF({ theme: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="Speed">{tt('Speed')}</option><option value="Mobile">{tt('Mobile')}</option><option value="TV">{tt('TV')}</option><option value="AI">{tt('AI')}</option><option value="Smart Home">{tt('Smart Home')}</option><option value="Network">{tt('Network')}</option><option value="Apps">{tt('Apps')}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Confidence
            <select value={filters.confidence} onChange={(e) => setF({ confidence: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="Committed">{tt('Committed')}</option><option value="Likely">{tt('Likely')}</option><option value="Exploratory">{tt('Exploratory')}</option>
            </select>
          </label>
        </>}
        {sub === 'voc' && <span className="text-vfes-dark/55 italic">{tt('Filtered by squad above. NLP-extracted from chat + call transcripts (12-mo window).')}</span>}
        {sub === 'competitive' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Competitive knobs')}</span>
          <label className="flex items-center gap-1.5">Highlight
            <select value={filters.competitor} onChange={(e) => setF({ competitor: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="btc">{tt('BTC')}</option><option value="orange">{tt('Rival ISP A')}</option><option value="digi">{tt('Rival ISP B')}</option><option value="voo">{tt('Rival ISP C')}</option>
            </select>
          </label>
        </>}
        {sub === 'experiments' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Experiment knobs')}</span>
          <label className="flex items-center gap-1.5">Status
            <select value={filters.expStatus} onChange={(e) => setF({ expStatus: e.target.value as any })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="Running">{tt('Running')}</option><option value="Won">{tt('Won')}</option><option value="Lost">{tt('Lost')}</option><option value="Inconclusive">{tt('Inconclusive')}</option><option value="Shipped">{tt('Shipped')}</option>
            </select>
          </label>
        </>}
        {sub === 'sku360' && <>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('SKU drill-down')}</span>
          <label className="flex items-center gap-1.5">Pick SKU
            <select value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              {(() => {
                const scoped = filters.squad === 'all' ? skus : skus.filter((s) => s.squad === filters.squad)
                const cats = Array.from(new Set(scoped.map((s) => s.cat)))
                return cats.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {scoped.filter((s) => s.cat === cat).map((s) => <option key={s.code} value={s.code}>{s.code} · {tt(s.name)}</option>)}
                  </optgroup>
                ))
              })()}
            </select>
          </label>
          <span className="text-[10px] text-vfes-dark/55">{filters.squad === 'all' ? 'All squads' : `Scoped to ${filters.squad}`} · {filters.squad === 'all' ? skus.length : skus.filter((s) => s.squad === filters.squad).length} SKUs</span>
          <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('Auto-saved · click any SKU code in other tabs to drill in')}</span>
        </>}
      </div>

      {sub === 'portfolio' && <PortfolioTab skuList={filteredSkus} drillInto={drillInto} />}
      {sub === 'lifecycle' && <LifecycleTab skuList={filteredSkus} drillInto={drillInto} />}
      {sub === 'engagement' && <EngagementTab cohort={filters.cohort} />}
      {sub === 'content' && <ContentTab renewalWindow={filters.renewalWindow} />}
      {sub === 'roadmap' && <RoadmapTab theme={filters.theme} confidence={filters.confidence} />}
      {sub === 'voc' && <VocTab drillInto={drillInto} />}
      {sub === 'competitive' && <CompetitiveTab highlight={filters.competitor} />}
      {sub === 'experiments' && <ExperimentsTab status={filters.expStatus} />}
      {sub === 'sku360' && <Sku360Tab code={selectedSku} setSku={setSelectedSku} />}

      <div className="mt-6 text-[10px] text-vfes-dark/40 uppercase tracking-widest text-center">
        4 Snowpark ML cohort regressions · 22 SKUs · {filteredSkus.length} after filter · semantic view PRODUCT_360 · model product-cockpit v1.4 · refreshed daily 03:00 UTC
      </div>
    </div>
  )
}

// ===========================================================================
// TAB · PORTFOLIO
// ===========================================================================
function PortfolioTab({ skuList, drillInto }: { skuList: SKU[]; drillInto: (c: string) => void }) {
  const totalMrr = skuList.reduce((a, s) => a + s.mrr * s.take, 0)
  const avgArpu = skuList.reduce((a, s) => a + s.mrr * s.take, 0) / Math.max(1, skuList.reduce((a, s) => a + s.take, 0))
  const portNps = Math.round(skuList.reduce((a, s) => a + s.nps * s.take, 0) / Math.max(1, skuList.reduce((a, s) => a + s.take, 0)))
  const stars = skuList.filter((s) => s.share > 0.9 && s.growth > 15).length
  const dogs = skuList.filter((s) => s.share < 0.7 && s.growth < 10).length

  // BCG matrix — share (x) × growth (y), bubble size = MRR contribution
  const bcgData = skuList.map((s) => ({ ...s, value: s.mrr * s.take }))

  const mrrByCat = ['Broadband', 'TV', 'Mobile', 'Bundle', 'Add-on', 'B2B'].map((cat) => {
    const stages: Record<LifecycleStage, number> = { Intro: 0, Growth: 0, Mature: 0, Decline: 0 }
    skuList.filter((s) => s.cat === cat).forEach((s) => { stages[s.stage] += s.mrr * s.take })
    return { cat, ...stages }
  })

  const top10 = [...skuList].sort((a, b) => b.mrr * b.take - a.mrr * a.take).slice(0, 10)
  const bottom5 = [...skuList].filter((s) => s.stage === 'Decline' || s.trend < 0 || s.gmPct < 30).slice(0, 5)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label={tt('Active SKUs')} value={`${skuList.length}`} delta={`${stars} stars · ${dogs} dogs`} icon={PackageSearch} accent />
        <KpiCard label={tt('Avg ARPU')} value={`BSD ${avgArpu.toFixed(2)}`} delta="weighted by take-rate" icon={TrendingUp} />
        <KpiCard label={tt('Net SKU MRR')} value={`BSD ${(totalMrr / 100).toFixed(1)}M`} delta="annualised BSD /100 HHs" icon={Gauge} />
        <KpiCard label={tt('Portfolio NPS')} value={`${portNps}`} delta="rolling 90d" trend={portNps > 35 ? 'up' : 'flat'} icon={Heart} />
        <KpiCard label={tt('App MAUs')} value="612K" delta="+9.4% MoM" trend="up" icon={Eye} />
        <KpiCard label={tt('Content ROI')} value="2.3×" delta="cost vs attributed LTV" trend="up" icon={Film} />
      </div>

      {/* Mobile product catalogue */}
      <Panel title={tt('Mobile catalogue — 5G plans · family · eSIM · IoT')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('8 SKUs · Cable Bahamas')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('SKU')}</th><th>{tt('Name')}</th><th>{tt('Tier')}</th><th>{tt('MRR')}</th><th>{tt('Active base')}</th><th>{tt('NPS contrib.')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_PRODUCTS.map((p) => (
              <tr key={p.sku} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs text-vfes-dark/65">{p.sku}</td>
                <td className="font-semibold">{tt(p.name)}</td>
                <td className="text-xs"><span className="px-1.5 py-0.5 rounded bg-black/5 font-bold">{p.tier}</span></td>
                <td className="font-mono text-xs font-bold">BSD {p.mrr.toFixed(2)}</td>
                <td className="font-mono text-xs">{(p.attach / 1000).toFixed(0)}K</td>
                <td className={`font-mono text-xs font-bold ${p.npsContribution >= 4 ? 'text-emerald-600' : p.npsContribution >= 2 ? 'text-vfes-dark' : 'text-vfes-dark/55'}`}>{p.npsContribution > 0 ? '+' : ''}{p.npsContribution}</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(p.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('5G M (60GB) is the volume anchor at 2.68M lines. Family pack carries strongest NPS contribution. eSIM-only is the only pilot SKU — promote to live in Q2 once activation funnel hits 25K/mo.')}</div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('BCG matrix · relative share × YoY growth (bubble = MRR)')}>
          <div className="h-96">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="share" name={tt('Relative share')} stroke="#999" fontSize={11} domain={[0, 1.6]} label={{ value: 'Relative share →', position: 'bottom', fontSize: 11, offset: -5 }} />
                <YAxis type="number" dataKey="growth" name={tt('YoY growth')} stroke="#999" fontSize={11} domain={[-40, 160]} label={{ value: 'YoY growth %', angle: -90, position: 'left', fontSize: 11 }} />
                <ZAxis type="number" dataKey="value" range={[60, 800]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }}
                  formatter={(v: any, n: any) => [n === 'share' ? `${Number(v).toFixed(2)}×` : n === 'growth' ? `${Number(v).toFixed(0)}%` : v, n]} />
                <ReferenceLine x={1.0} stroke={GREY} strokeDasharray="4 4" />
                <ReferenceLine y={15} stroke={GREY} strokeDasharray="4 4" />
                <Scatter data={bcgData}>
                  {bcgData.map((s, i) => <Cell key={i} fill={s.share > 1 && s.growth > 15 ? GREEN : s.share > 1 ? AMBER : s.growth > 15 ? BLUE : RED} fillOpacity={0.7} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: GREEN }} />{tt('Stars (high share + growth)')}</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: AMBER }} />{tt('Cash cows (high share)')}</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: BLUE }} />{tt('Question marks (high growth)')}</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: RED }} />{tt('Dogs (low share & growth)')}</div>
          </div>
        </Panel>

        <Panel title={tt('MRR contribution by category × lifecycle stage (BSD /100 HHs)')}>
          <div className="h-96">
            <ResponsiveContainer>
              <BarChart data={mrrByCat}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="cat" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Intro" stackId="s" fill={lifecycleColor.Intro} />
                <Bar dataKey="Growth" stackId="s" fill={lifecycleColor.Growth} />
                <Bar dataKey="Mature" stackId="s" fill={lifecycleColor.Mature} />
                <Bar dataKey="Decline" stackId="s" fill={lifecycleColor.Decline} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Top 10 SKUs by MRR contribution')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('SKU')}</th><th>{tt('Cat')}</th><th>{tt('Stage')}</th><th>{tt('Take')}</th><th>{tt('MRR')}</th><th>{tt('NPS')}</th><th>{tt('GM%')}</th><th>{tt('BSD MRR')}</th></tr>
            </thead>
            <tbody>
              {top10.map((s) => {
                const Icon = catIcon[s.cat] || PackageSearch
                return (
                  <tr key={s.code} onClick={() => drillInto(s.code)} className="border-t border-black/5 hover:bg-[#fafbfc] cursor-pointer">
                    <td className="py-2"><div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-vfes-dark shrink-0" /><span className="font-semibold text-xs">{tt(s.name)}</span></div></td>
                    <td className="text-xs">{s.cat}</td>
                    <td><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${lifecycleColor[s.stage]}20`, color: lifecycleColor[s.stage] }}>{s.stage}</span></td>
                    <td>{s.take}%</td>
                    <td>BSD {s.mrr}</td>
                    <td className={s.nps > 40 ? 'text-emerald-600 font-semibold' : s.nps > 25 ? 'text-amber-700' : 'text-red-600 font-semibold'}>{s.nps}</td>
                    <td>{s.gmPct}%</td>
                    <td className="font-bold text-vfes-dark">BSD {(s.mrr * s.take).toFixed(0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Sunset candidates · low margin / declining')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('SKU')}</th><th>{tt('Stage')}</th><th>{tt('Trend')}</th><th>{tt('GM%')}</th><th>{tt('Recommendation')}</th></tr>
            </thead>
            <tbody>
              {bottom5.map((s) => (
                <tr key={s.code} onClick={() => drillInto(s.code)} className="border-t border-black/5 cursor-pointer hover:bg-[#fafbfc]">
                  <td className="py-2 font-semibold text-xs">{tt(s.name)}</td>
                  <td><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${lifecycleColor[s.stage]}20`, color: lifecycleColor[s.stage] }}>{s.stage}</span></td>
                  <td className={s.trend < 0 ? 'text-red-600 font-semibold' : 'text-amber-700'}>{s.trend > 0 ? '+' : ''}{s.trend}%</td>
                  <td>{s.gmPct}%</td>
                  <td className="text-xs">{s.stage === 'Decline' ? 'Sunset · migrate to ' + (s.cannibPair ?? 'BB_600') : 'Refresh · price re-engineer'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-3 rounded-lg bg-vfes-red/5 border border-vfes-red/15">
            <div className="text-xs font-bold text-vfes-dark mb-1">{tt('PM recommendation')}</div>
            <div className="text-xs">{tt('3 SKUs flagged for sunset (BB_250, TV_360, PHONE) — combined BSD 4.8M annualised savings if migrated to growth SKUs over Q3-Q2 2027.')}</div>
          </div>
        </Panel>
      </div>

      <Panel title={tt('Snowflake Intelligence — Ask the data')}>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {[
            'Which 3 SKUs have the highest LTV/CAC and the lowest take-rate (under-marketed gems)?',
            'Show me sunset candidates with their migration targets and NPV impact of phasing them out.',
            'What is the cannibalisation between TV_360 and REVTV?',
            'Compare BB_2G vs BB_5G adoption curves first 6 months post-launch.',
          ].map((q) => (
            <button key={q} className="text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
              <span className="flex-1">{q}</span>
            </button>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · LIFECYCLE
// ===========================================================================
function LifecycleTab({ skuList, drillInto }: { skuList: SKU[]; drillInto: (c: string) => void }) {
  const stages: LifecycleStage[] = ['Intro', 'Growth', 'Mature', 'Decline']
  const stageCounts = stages.map((stage) => ({ stage, count: skuList.filter((s) => s.stage === stage).length, mrr: skuList.filter((s) => s.stage === stage).reduce((a, s) => a + s.mrr * s.take, 0) }))

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {stageCounts.map((sc) => (
          <KpiCard key={sc.stage} label={`${sc.stage} stage`} value={`${sc.count} SKUs`} delta={`BSD ${sc.mrr.toFixed(0)} MRR/100HH`} icon={Heart} accent={sc.stage === 'Growth'} />
        ))}
      </div>

      <Panel title={tt('Lifecycle distribution · count of SKUs per stage')}>
        <div className="grid grid-cols-4 gap-3">
          {stageCounts.map((sc) => (
            <div key={sc.stage} className="p-4 rounded-lg" style={{ background: `${lifecycleColor[sc.stage]}10`, border: `1px solid ${lifecycleColor[sc.stage]}30` }}>
              <div className="text-xs uppercase tracking-widest font-bold" style={{ color: lifecycleColor[sc.stage] }}>{sc.stage}</div>
              <div className="text-3xl font-extrabold mt-1" style={{ color: lifecycleColor[sc.stage] }}>{sc.count}</div>
              <div className="text-[10px] text-vfes-dark/55 mt-1">{tt('SKUs in stage')}</div>
              <div className="mt-2 space-y-1">
                {skuList.filter((s) => s.stage === sc.stage).map((s) => (
                  <div key={s.code} onClick={() => drillInto(s.code)} className="text-[10px] flex justify-between cursor-pointer hover:underline">
                    <span className="truncate">{s.code}</span>
                    <span className="text-vfes-dark/50">{s.take}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('Cannibalisation flows · subs migrating between SKUs (last 90d)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('From')}</th><th></th><th>{tt('To')}</th><th>{tt('Subs migrated')}</th></tr>
            </thead>
            <tbody>
              {cannibFlows.map((f, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{f.from}</td>
                  <td className="text-vfes-dark"><ChevronRight className="w-3 h-3" /></td>
                  <td className="font-semibold text-xs">{f.to}</td>
                  <td className="text-vfes-dark font-bold">{f.subs.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Refresh cadence · last refresh date by SKU')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('SKU')}</th><th>{tt('Stage')}</th><th>{tt('Last refresh')}</th><th>{tt('Months ago')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[...skuList].sort((a, b) => a.refreshDate.localeCompare(b.refreshDate)).slice(0, 8).map((s) => {
                const monthsAgo = Math.round((new Date('2026-10-01').getTime() - new Date(s.refreshDate + '-01').getTime()) / (30 * 86400 * 1000))
                return (
                  <tr key={s.code} className="border-t border-black/5">
                    <td className="py-2 font-semibold text-xs">{tt(s.name)}</td>
                    <td><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${lifecycleColor[s.stage]}20`, color: lifecycleColor[s.stage] }}>{s.stage}</span></td>
                    <td>{s.refreshDate}</td>
                    <td>{monthsAgo}m</td>
                    <td className={monthsAgo > 18 ? 'text-red-600 font-semibold' : monthsAgo > 12 ? 'text-amber-700' : 'text-emerald-600'}>{monthsAgo > 18 ? '⚠ Stale' : monthsAgo > 12 ? 'Due review' : '✓ Fresh'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title={tt('Take-rate trend by lifecycle stage')}>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={skuList.sort((a, b) => b.trend - a.trend).slice(0, 14)}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="code" stroke="#999" fontSize={10} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(0)}%`, '']} />
              <ReferenceLine y={0} stroke="#666" />
              <Bar dataKey="trend" radius={[6, 6, 0, 0]}>
                {skuList.map((s, i) => <Cell key={i} fill={lifecycleColor[s.stage]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · ENGAGEMENT
// ===========================================================================
function EngagementTab({ cohort }: { cohort: string }) {
  const stickiness = ((dauMauSeries[dauMauSeries.length - 1].DAU / dauMauSeries[dauMauSeries.length - 1].MAU) * 100).toFixed(0)

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('DAU/MAU stickiness')} value={`${stickiness}%`} delta="industry P75 ≈ 30%" trend="up" icon={Activity} accent />
        <KpiCard label={tt('App-store rating')} value="4.6★" delta="+0.2 vs Q1" trend="up" icon={Star} />
        <KpiCard label={tt('D7 retention')} value="64%" delta="cohort median" trend="up" icon={Heart} />
        <KpiCard label={tt('Avg session')} value="3m 22s" delta="+18s MoM" trend="up" icon={Clock} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('DAU / WAU / MAU · 90 days')}>
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={dauMauSeries}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(0)}K`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="MAU" stroke={BLUE} fill={BLUE} fillOpacity={0.1} />
                <Area type="monotone" dataKey="WAU" stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
                <Area type="monotone" dataKey="DAU" stroke={RED} fill={RED} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('D0 → D90 retention curve')}>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={retentionCurves}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(0)}%`, 'Retained']} />
                <ReferenceLine y={50} stroke={AMBER} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" stroke={RED} strokeWidth={3} dot={{ fill: RED, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('D7 above 60% is healthy SaaS-grade. D30 above 40% indicates strong product-market fit.')}</div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`Per-feature usage · ${cohort === 'all' ? 'all cohorts' : cohort + ' cohort'} (% of MAU)`}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={featureUsage} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="feature" stroke="#999" fontSize={11} width={130} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="new" name={tt('New cohort')} fill={BLUE} />
                <Bar dataKey="mature" name={tt('Mature cohort')} fill={AMBER} />
                <Bar dataKey="decline" name={tt('Decline cohort')} fill={RED} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('MyREV tile-click ranking (last 30 days)')}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={tileClicks} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="tile" stroke="#999" fontSize={11} width={120} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(0)}K clicks`, '']} />
                <Bar dataKey="clicks" fill={RED} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title={tt('TV viewing hours by genre · linear vs VOD (m hrs / month)')}>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={tvHoursByGenre}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="genre" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v}m`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}m hrs`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Live" stackId="t" fill={RED} />
              <Bar dataKey="VOD" stackId="t" fill={BLUE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Drama and Movies skew VOD-heavy → prioritise streaming-quality features over linear-only enhancements for those genres.')}</div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · CONTENT ECONOMICS
// ===========================================================================
function ContentTab({ renewalWindow }: { renewalWindow: number }) {
  const totalSpend = content.reduce((a, c) => a + c.cost, 0)
  const totalAttribSubs = content.reduce((a, c) => a + c.attributedSubs, 0)
  const totalViewerHours = content.reduce((a, c) => a + c.viewerHours, 0)
  const renewalsAtRisk = content.filter((c) => {
    const months = (new Date(c.renewalDate).getTime() - new Date('2026-10-01').getTime()) / (30 * 86400 * 1000)
    return months <= renewalWindow
  })
  const costPerHour = (totalSpend * 1e6) / (totalViewerHours * 1e6)
  const costPerSub = (totalSpend * 1e6) / Math.max(1, totalAttribSubs)

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Total content spend')} value={`BSD ${totalSpend.toFixed(1)}M`} delta="annualised" icon={Film} accent />
        <KpiCard label={tt('Cost per viewer-hour')} value={`BSD ${costPerHour.toFixed(3)}`} delta="across portfolio" icon={Eye} />
        <KpiCard label={tt('Cost per attributed sub')} value={`BSD ${costPerSub.toFixed(0)}`} delta="LTV avg BSD 1,800" icon={Target} />
        <KpiCard label={tt('Renewals next 24mo')} value={`${renewalsAtRisk.length}`} delta={`BSD ${renewalsAtRisk.reduce((a, c) => a + c.cost, 0).toFixed(1)}M at risk`} trend={renewalsAtRisk.length > 4 ? 'down' : 'flat'} icon={AlertTriangle} />
      </div>

      <Panel title={tt('Content rate-card · cost vs attribution')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
              <tr><th className="py-2">{tt('Content')}</th><th>{tt('Partner')}</th><th>{tt('Genre')}</th><th>{tt('Cost BSD m')}</th><th>{tt('Viewers')}</th><th>{tt('Hrs/yr')}</th><th>{tt('BSD /viewer-hr')}</th><th>{tt('Attrib subs')}</th><th>{tt('BSD /sub')}</th><th>{tt('MG')}</th><th>{tt('Excl.')}</th><th>{tt('Renewal')}</th><th>{tt('Save use')}</th></tr>
            </thead>
            <tbody>
              {content.map((c) => {
                const cph = (c.cost * 1e6) / (c.viewerHours * 1e6)
                const cps = c.attributedSubs > 0 ? (c.cost * 1e6) / c.attributedSubs : 0
                const monthsToRenew = Math.round((new Date(c.renewalDate).getTime() - new Date('2026-10-01').getTime()) / (30 * 86400 * 1000))
                return (
                  <tr key={tt(c.name)} className="border-t border-black/5">
                    <td className="py-2 font-semibold text-xs">{tt(c.name)}</td>
                    <td className="text-xs">{c.partner}</td>
                    <td className="text-xs">{c.genre}</td>
                    <td className="font-bold">BSD {c.cost.toFixed(1)}</td>
                    <td>{(c.viewers / 1000).toFixed(0)}K</td>
                    <td>{c.viewerHours}m</td>
                    <td className={cph < 0.15 ? 'text-emerald-600' : cph < 0.30 ? 'text-amber-700' : 'text-red-600'}>BSD {cph.toFixed(3)}</td>
                    <td>{(c.attributedSubs / 1000).toFixed(0)}K</td>
                    <td className={cps === 0 ? 'text-vfes-dark/40' : cps < 100 ? 'text-emerald-600 font-semibold' : cps < 300 ? 'text-amber-700' : 'text-red-600 font-semibold'}>{cps === 0 ? '—' : `BSD ${cps.toFixed(0)}`}</td>
                    <td className={c.cost < c.mg ? 'text-red-600' : 'text-vfes-dark/60'}>BSD {c.mg.toFixed(1)}</td>
                    <td className="text-[10px]">{c.exclusivity}</td>
                    <td className={monthsToRenew < 6 ? 'text-red-600 font-bold' : monthsToRenew < 12 ? 'text-amber-700 font-semibold' : ''}>{c.renewalDate}</td>
                    <td className="font-bold text-vfes-dark">{c.saveOfferUse}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={`Renewal calendar · next ${renewalWindow} months`}>
          <div className="space-y-2">
            {[...content].sort((a, b) => a.renewalDate.localeCompare(b.renewalDate)).slice(0, 8).map((c) => {
              const months = Math.round((new Date(c.renewalDate).getTime() - new Date('2026-10-01').getTime()) / (30 * 86400 * 1000))
              const pct = Math.min(100, (months / 36) * 100)
              return (
                <div key={tt(c.name)}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{tt(c.name)}</span>
                    <span className={months < 6 ? 'text-red-600 font-bold' : months < 12 ? 'text-amber-700 font-semibold' : 'text-vfes-dark/60'}>{c.renewalDate} · {months}mo</span>
                  </div>
                  <div className="h-2 bg-[#f3f4f7] rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: months < 6 ? RED : months < 12 ? AMBER : GREEN }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title={tt('Cost vs viewer-hours · efficiency scatter')}>
          <div className="h-80">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="viewerHours" name={tt('Viewer hours (m)')} stroke="#999" fontSize={11} />
                <YAxis type="number" dataKey="cost" name={tt('Cost BSD m')} stroke="#999" fontSize={11} />
                <ZAxis range={[60, 300]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, n: any) => [n === 'cost' ? `BSD ${v}m` : `${v}m hrs`, n]} />
                <Scatter data={content}>
                  {content.map((c, i) => <Cell key={i} fill={c.genre === 'Sports' ? RED : c.genre === 'Cinema' ? AMBER : c.genre === 'SVOD' ? BLUE : GREEN} fillOpacity={0.7} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Down-and-right = good (high engagement, low cost). Sports add-on · Sports package up-right = expensive but heavily used.')}</div>
        </Panel>
      </div>

      <Panel title={tt('Save-offer attribution · which content drives churn-saves')}>
        <div className="grid md:grid-cols-3 gap-4">
          {[...content].sort((a, b) => b.saveOfferUse - a.saveOfferUse).slice(0, 6).map((c) => (
            <div key={tt(c.name)} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
              <div className="font-semibold text-xs mb-1">{tt(c.name)}</div>
              <div className="text-3xl font-extrabold text-vfes-dark">{c.saveOfferUse}%</div>
              <div className="text-[10px] text-vfes-dark/55 mb-2">{tt('of retention saves use this')}</div>
              <div className="text-[10px]">Cost BSD {c.cost.toFixed(1)}M · LTV recovered ~BSD {(c.saveOfferUse * 18.4).toFixed(0)}M</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-900">{tt('Insight:')}</span>
          <span className="text-emerald-800">{tt('Sports add-on · Sports package ROI = 3.2× when you include save-offer attribution. Premium Sports spend earns its keep at &gt; 12% save-rate threshold.')}</span>
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · ROADMAP
// ===========================================================================
function RoadmapTab({ theme, confidence }: { theme: string; confidence: string }) {
  const filtered = roadmap.filter((r) =>
    (theme === 'all' || r.theme === theme) &&
    (confidence === 'all' || r.confidence === confidence)
  )

  const lanes: ('Now' | 'Next' | 'Later')[] = ['Now', 'Next', 'Later']
  const confColor: Record<string, string> = { Committed: GREEN, Likely: AMBER, Exploratory: BLUE }
  const themeColor: Record<string, string> = { Speed: RED, Mobile: BLUE, TV: AMBER, AI: '#8b5cf6', 'Smart Home': '#0891b2', Network: '#0b5b88', Apps: '#10b981' }

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Items in flight')} value={`${filtered.length}`} delta={`${roadmap.filter((r) => r.confidence === 'Committed').length} committed`} icon={Calendar} accent />
        <KpiCard label={tt('Beta signups (active)')} value={`${roadmap.filter((r) => r.betaSignups).reduce((a, r) => a + (r.betaSignups || 0), 0).toLocaleString()}`} delta="across 5 betas" trend="up" icon={Users} />
        <KpiCard label={tt('Investment Q3-Q4')} value="BSD 18.4M" delta="committed only" icon={Briefcase} />
        <KpiCard label={tt('Shipped last quarter')} value={`${shipped.length} items`} delta={`${shipped.filter((s) => s.outcome === 'beat plan').length} beat plan`} trend="up" icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {lanes.map((lane) => (
          <Panel key={lane} title={`${lane} · ${filtered.filter((r) => r.status === lane).length} items`}>
            <div className="space-y-3">
              {filtered.filter((r) => r.status === lane).map((r) => (
                <div key={r.id} className="p-3 rounded-lg border" style={{ borderColor: `${themeColor[r.theme]}40`, background: `${themeColor[r.theme]}05` }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: themeColor[r.theme] }}>{r.theme}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${confColor[r.confidence]}20`, color: confColor[r.confidence] }}>{r.confidence}</span>
                  </div>
                  <div className="font-bold text-sm mb-1">{tt(r.title)}</div>
                  <div className="text-[10px] text-vfes-dark/65 mb-1"><span className="font-semibold">{tt('OKR:')}</span> {r.okr}</div>
                  <div className="text-[10px] text-vfes-dark/65 mb-1"><span className="font-semibold">{tt('Invest:')}</span> {r.invest}</div>
                  <div className="text-[10px] text-vfes-dark/65 mb-1"><span className="font-semibold">{tt('Evidence:')}</span> {r.evidence}</div>
                  <div className="text-[10px] text-vfes-dark/65 mb-1"><span className="font-semibold">{tt('Success:')}</span> {r.successMetric}</div>
                  <div className="text-[10px] text-vfes-dark/65 mb-1"><span className="font-semibold">{tt('Risk:')}</span> {r.risks}</div>
                  {r.betaSignups != null && (
                    <div className="mt-2 text-[10px] flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{r.betaSignups.toLocaleString()} signups</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">NPS {r.betaNps}</span>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{r.id} · ETA {r.eta}</div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Panel title={tt('Shipped last quarter · outcome vs commitment')}>
        <div className="space-y-2">
          {shipped.map((s, i) => (
            <div key={i} className={`p-3 rounded-lg flex items-center gap-3 ${s.outcome === 'beat plan' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <CheckCircle className={`w-5 h-5 shrink-0 ${s.outcome === 'beat plan' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div className="flex-1">
                <div className="font-bold text-sm">{tt(s.title)}</div>
                <div className="text-xs text-vfes-dark/70">{s.metric}</div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${s.outcome === 'beat plan' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>{s.outcome}</span>
              <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{s.q}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · VOICE OF CUSTOMER
// ===========================================================================
function VocTab({ drillInto }: { drillInto: (c: string) => void }) {
  const portfolioNps = npsSeries[npsSeries.length - 1].portfolio
  const totalCalls = complaints.reduce((a, c) => a + c.volume, 0)
  const topComplaintPct = ((complaints[0].volume / totalCalls) * 100).toFixed(0)

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Portfolio NPS')} value={`${portfolioNps}`} delta={`+${portfolioNps - npsSeries[0].portfolio} vs Jun-25`} trend="up" icon={Heart} accent />
        <KpiCard label={tt('Top complaint share')} value={`${topComplaintPct}%`} delta={complaints[0].theme} trend="down" icon={AlertTriangle} />
        <KpiCard label={tt('Feature requests open')} value={`${featureRequests.filter((f) => f.status !== 'Shipped' && f.status !== "Won't do").length}`} delta={`${featureRequests.reduce((a, f) => a + f.votes, 0).toLocaleString()} votes`} icon={Lightbulb} />
        <KpiCard label={tt('Save-offer success')} value="42%" delta="of save attempts succeed" trend="up" icon={Target} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('NPS by touchpoint · 12-month trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={npsSeries}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[0, 80]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={50} stroke={GREEN} strokeDasharray="4 4" label={{ value: 'World-class', fontSize: 10, fill: GREEN }} />
                  <Line type="monotone" dataKey="portfolio" stroke={RED} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="app" stroke={BLUE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="install" stroke={AMBER} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="support" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Churn reasons · last 90d')}>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={churnReasons} dataKey="pct" nameKey="reason" outerRadius={80} label={(e: any) => `${e.pct}%`} labelLine={false} fontSize={10}>
                  {churnReasons.map((_, i) => <Cell key={i} fill={[RED, RED2, AMBER, BLUE, '#8b5cf6', GREEN, GREY, '#475569'][i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Top complaint themes · NLP-extracted from chat + call transcripts')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Theme')}</th><th>{tt('Vol/mo')}</th><th>{tt('Cost/mo BSD ')}</th><th>{tt('Trend')}</th></tr>
            </thead>
            <tbody>
              {complaints.map((c, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2"><div className="text-xs"><span className="font-semibold">{c.theme}</span><div className="text-[10px] text-vfes-dark/50">{c.cat}</div></div></td>
                  <td className="font-bold">{c.volume.toLocaleString()}</td>
                  <td className="text-red-600">BSD {c.costToServe.toFixed(1)}</td>
                  <td className={c.trend < -10 ? 'text-emerald-600 font-bold' : c.trend < 0 ? 'text-emerald-600' : c.trend > 10 ? 'text-red-600 font-bold' : 'text-amber-700'}>{c.trend > 0 ? '+' : ''}{c.trend}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Feature requests · top 10 by votes')}>
          <div className="space-y-2">
            {featureRequests.map((f) => (
              <div key={tt(f.title)} className="flex items-center gap-2 py-1 border-b border-black/5">
                <span className="font-bold text-vfes-dark text-sm w-12 text-right">{f.votes.toLocaleString()}</span>
                <span className="text-[10px] text-vfes-dark/55 w-12 uppercase">{f.cat}</span>
                <span className="flex-1 text-xs">{tt(f.title)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  f.status === 'Shipped' ? 'bg-emerald-100 text-emerald-800' :
                  f.status === 'Beta' ? 'bg-blue-100 text-blue-800' :
                  f.status === 'Building' ? 'bg-amber-100 text-amber-800' :
                  f.status === 'Discovery' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-700'
                }`}>{tt(f.status)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={tt('NPS by SKU · sorted')}>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={[...skus].sort((a, b) => b.nps - a.nps).slice(0, 14)} layout="vertical">
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#999" fontSize={11} domain={[0, 80]} />
              <YAxis type="category" dataKey="code" stroke="#999" fontSize={10} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine x={50} stroke={GREEN} strokeDasharray="4 4" />
              <Bar dataKey="nps" radius={[0, 6, 6, 0]} onClick={(d: any) => d?.code && drillInto(d.code)} cursor="pointer">
                {skus.slice(0, 14).map((s, i) => <Cell key={i} fill={s.nps > 50 ? GREEN : s.nps > 30 ? AMBER : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · COMPETITIVE
// ===========================================================================
function CompetitiveTab({ highlight }: { highlight: string }) {
  const cellColor = (v: 'yes' | 'beta' | 'no' | 'lead') => v === 'lead' ? GREEN : v === 'yes' ? '#84cc16' : v === 'beta' ? AMBER : '#e5e7eb'
  const cellLabel = (v: 'yes' | 'beta' | 'no' | 'lead') => v === 'lead' ? '★' : v === 'yes' ? '✓' : v === 'beta' ? 'β' : '✗'

  const featuresLeading = parityMatrix.filter((r) => r.cablebahamas === 'lead').length
  const featuresBehind = parityMatrix.filter((r) => r.cablebahamas === 'no' && [r.btc, r.orange, r.voo, r.digi].some((x) => x === 'yes' || x === 'lead')).length
  const innovationIndex = ((featuresLeading * 2 - featuresBehind) / parityMatrix.length * 100).toFixed(0)

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Features leading')} value={`${featuresLeading}`} delta={`out of ${parityMatrix.length}`} trend="up" icon={Award} accent />
        <KpiCard label={tt('Features behind')} value={`${featuresBehind}`} delta="competitor has it, we don't" trend={featuresBehind > 4 ? 'down' : 'flat'} icon={AlertTriangle} />
        <KpiCard label={tt('Innovation index')} value={`${innovationIndex}`} delta="(2×lead − behind) / total" trend="up" icon={Sparkles} />
        <KpiCard label={tt('Time-to-launch index')} value="−12d" delta="ahead of competitor avg" trend="up" icon={Clock} />
      </div>

      <Panel title={tt('Feature parity matrix · ★ leading · ✓ have · β beta · ✗ none')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-vfes-dark/55 text-xs uppercase tracking-widest">{tt('Feature')}</th>
                {(['cablebahamas', 'btc', 'orange', 'voo', 'digi'] as const).map((c) => (
                  <th key={c} className={`text-center p-2 text-xs uppercase tracking-widest ${highlight !== 'all' && highlight === c ? 'text-vfes-dark' : 'text-vfes-dark/55'} ${c === 'cablebahamas' ? 'bg-vfes-red/5' : ''}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parityMatrix.map((r, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="p-2 font-semibold text-xs">{r.feature}</td>
                  {(['cablebahamas', 'btc', 'orange', 'voo', 'digi'] as const).map((c) => (
                    <td key={c} className={`p-2 text-center text-xs font-bold ${c === 'cablebahamas' ? 'bg-vfes-red/5' : ''}`}>
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white" style={{ background: cellColor(r[c]) }}>
                        {cellLabel(r[c])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('Recent competitor moves · last 30 days')}>
          <div className="space-y-2">
            {competitorMoves.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-0.5">{m.date}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  m.who === 'Rival ISP B' ? 'bg-blue-100 text-blue-800' :
                  m.who === 'BTC' ? 'bg-emerald-100 text-emerald-800' :
                  m.who === 'Cable Bahamas' ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }`}>{m.who}</span>
                <span className="flex-1 text-xs">{m.move}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={tt('Speed-tier ladder vs market (Mb/s available)')}>
          <div className="space-y-3">
            {[
              { tier: '10 Gb', cablebahamas: 'beta', btc: 0, orange: 0, voo: 0, digi: 0, cablebahamasVal: 'Beta' },
              { tier: '5 Gb', cablebahamas: 'yes', btc: 0, orange: 'beta', voo: 0, digi: 0, cablebahamasVal: 'GA' },
              { tier: '2 Gb', cablebahamas: 'yes', btc: 0, orange: 'yes', voo: 'beta', digi: 0, cablebahamasVal: 'GA' },
              { tier: '1 Gb', cablebahamas: 'yes', btc: 'yes', orange: 'yes', voo: 'yes', digi: 0, cablebahamasVal: 'GA' },
              { tier: '600 Mb', cablebahamas: 'yes', btc: 'yes', orange: 'yes', voo: 'yes', digi: 0, cablebahamasVal: 'GA' },
            ].map((t) => (
              <div key={t.tier} className="flex items-center gap-3">
                <span className="font-bold text-sm w-16">{t.tier}</span>
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {(['cablebahamas', 'btc', 'orange', 'voo', 'digi'] as const).map((c) => (
                    <div key={c} className={`h-8 rounded flex items-center justify-center text-[10px] font-bold ${(t as any)[c] === 'yes' ? 'bg-emerald-500 text-white' : (t as any)[c] === 'beta' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'}`}>{c}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-3">{tt('Cable Bahamas leads at 2 Gb+ tiers; trails Rival ISP C The Bahamas on mobile-only fixed-wireless 5G.')}</div>
        </Panel>
      </div>
    </>
  )
}

// ===========================================================================
// TAB · SKU 360 (drill-down)
// ===========================================================================
function Sku360Tab({ code, setSku }: { code: string; setSku: (c: string) => void }) {
  const sku = skus.find((s) => s.code === code) || skus[0]
  const d = useMemo(() => buildSkuDetails(sku), [sku])
  const Icon = catIcon[sku.cat] || PackageSearch

  const sevColor: Record<string, string> = { info: BLUE, warn: AMBER, crit: RED }
  const sevBg:    Record<string, string> = { info: 'bg-blue-50 border-blue-200 text-blue-900', warn: 'bg-amber-50 border-amber-200 text-amber-900', crit: 'bg-red-50 border-red-200 text-red-900' }
  const flagIcon: Record<string, any> = { price: Target, churn: TrendingDown, content: Film, tech: Cpu, reg: Shield, comp: Award }
  const relRoad = roadmap.filter((r) => d.relatedRoadmap.includes(r.id))

  return (
    <>
      {/* SKU header card */}
      <Panel>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-vfes-red/10 flex items-center justify-center"><Icon className="w-7 h-7 text-vfes-dark" /></div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-semibold">{sku.cat} · {sku.code} · launched {sku.launchDate}</div>
              <div className="text-2xl font-extrabold">{tt(sku.name)}</div>
              <div className="text-xs text-vfes-dark/65 mt-0.5">List BSD {sku.mrr}/mo · realised BSD {d.realisedArpu} ({d.yieldPct}% yield) · GM {sku.gmPct}% · OKR: {sku.okr}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded" style={{ background: `${lifecycleColor[sku.stage]}20`, color: lifecycleColor[sku.stage] }}>{sku.stage}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${sku.nps > 50 ? 'bg-emerald-100 text-emerald-800' : sku.nps > 30 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>NPS {sku.nps}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-100 text-blue-800">LTV/CAC {d.ltvCac}×</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-vfes-red/10 text-vfes-dark">{sku.squad}</span>
          </div>
        </div>
      </Panel>

      {/* KPI hero — 8 cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
        <KpiCard label={tt('Active subscribers')} value={`${(d.totalSubs / 1000).toFixed(1)}K`} delta={`+${d.newThisQtr.toLocaleString()} this qtr`} trend={sku.trend > 0 ? 'up' : 'down'} icon={Users} accent />
        <KpiCard label={tt('MRR contribution')} value={`BSD ${(d.totalSubs * d.realisedArpu / 1e6).toFixed(2)}M`} delta={`vs BSD ${(d.totalSubs * sku.mrr / 1e6).toFixed(2)}M list`} icon={Coins} />
        <KpiCard label={tt('Take-rate')} value={`${sku.take}%`} delta={`portfolio avg ${(skus.reduce((a, s) => a + s.take, 0) / skus.length).toFixed(0)}%`} trend={sku.take > 12 ? 'up' : 'flat'} icon={Gauge} />
        <KpiCard label={tt('Realised ARPU')} value={`BSD ${d.realisedArpu}`} delta={`yield ${d.yieldPct}%`} trend={d.yieldPct > 85 ? 'up' : 'down'} icon={TrendingUp} />
        <KpiCard label={tt('Gross margin')} value={`${sku.gmPct}%`} delta={`BSD ${d.monthlyContrib}/sub/mo`} trend={sku.gmPct > 35 ? 'up' : 'down'} icon={Briefcase} />
        <KpiCard label={tt('LTV / CAC')} value={`${d.ltvCac}×`} delta={`LTV BSD ${sku.ltv} · CAC BSD ${sku.cac}`} trend={d.ltvCac > 8 ? 'up' : d.ltvCac > 3 ? 'flat' : 'down'} icon={Heart} />
        <KpiCard label={tt('Monthly churn')} value={`${sku.churnPct.toFixed(1)}%`} delta="benchmark 1.2%" trend={sku.churnPct < 1.2 ? 'up' : 'down'} icon={TrendingDown} />
        <KpiCard label={tt('Annual contribution')} value={`BSD ${d.annualContrib}`} delta="per sub net of CAC" trend={d.annualContrib > 0 ? 'up' : 'down'} icon={Sparkles} accent />
      </div>

      {/* Risk flags */}
      <Panel title={tt('Risk flags · auto-generated from data')}>
        <div className="grid md:grid-cols-2 gap-2">
          {d.flags.map((f, i) => {
            const FlagIcon = flagIcon[f.kind] || AlertTriangle
            return (
              <div key={i} className={`p-3 rounded-lg border flex items-start gap-2 ${sevBg[f.severity]}`}>
                <FlagIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: sevColor[f.severity] }} />
                <div className="flex-1 text-xs"><span className="font-bold uppercase tracking-widest text-[10px] mr-2">{f.kind}</span>{f.msg}</div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{f.severity}</span>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* P&L bridge + acquisition trend */}
      <div className="grid lg:grid-cols-2 gap-6 my-6">
        <Panel title={tt('Per-subscriber P&L bridge (BSD /mo)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.pnl} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} />
                <YAxis type="category" dataKey="line" stroke="#999" fontSize={11} width={110} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(2)}`, '']} />
                <ReferenceLine x={0} stroke="#666" />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {d.pnl.map((p, i) => <Cell key={i} fill={p.type === 'add' ? GREEN : p.type === 'total' ? '#0b5b88' : p.value < 0 ? RED : RED_LIGHT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Acquisition trend · 24 months')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={d.acquisitionTrend}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#999" fontSize={9} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name={tt('Gross adds')} fill={GREEN} />
                <Bar dataKey="churn" name={tt('Churn')}      fill={RED_LIGHT} />
                <Line type="monotone" dataKey="net" name={tt('Net')} stroke={RED} strokeWidth={2} dot={false} />
                <ReferenceLine y={0} stroke="#666" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Where they're selling more · Geography + Channel + Tenure */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Where · subscribers by region')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={d.byRegion}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="region" stroke="#999" fontSize={10} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="subs" name={tt('Subs')} fill={RED} radius={[6, 6, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="nps" name={tt('NPS')} stroke={BLUE} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">Top region: <span className="font-bold">{[...d.byRegion].sort((a, b) => b.subs - a.subs)[0].region}</span> · ARPU BSD {[...d.byRegion].sort((a, b) => b.arpu - a.arpu)[0].arpu} · NPS {[...d.byRegion].sort((a, b) => b.nps - a.nps)[0].nps}</div>
        </Panel>

        <Panel title={tt('How · acquisition channel mix')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={d.byChannel}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="channel" stroke="#999" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="subs" name={tt('Subs')} fill={RED2} radius={[6, 6, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="cac" name={tt('CAC BSD ')} stroke={AMBER} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">Cheapest channel: <span className="font-bold">{[...d.byChannel].sort((a, b) => a.cac - b.cac)[0].channel}</span> @ BSD {[...d.byChannel].sort((a, b) => a.cac - b.cac)[0].cac} CAC · best conv {[...d.byChannel].sort((a, b) => b.conv - a.conv)[0].conv}%</div>
        </Panel>

        <Panel title={tt('Tenure mix · 0-6m to 24m+')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={d.byTenure}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" stroke="#999" fontSize={11} />
                <YAxis yAxisId="l" stroke="#999" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="subs" name={tt('Subs')} fill={BLUE} radius={[6, 6, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="churn" name={tt('Churn %')} stroke={RED} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{((d.byTenure[3].subs / d.totalSubs) * 100).toFixed(0)}% of base out-of-contract — retention priority.</div>
        </Panel>
      </div>

      {/* To who · customer mix donuts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Who · value tier')}>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.byValueTier} dataKey="subs" nameKey="tier" outerRadius={75} label={(e: any) => `${e.tier} ${((e.subs / d.totalSubs) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  <Cell fill={GREEN} /><Cell fill={RED} /><Cell fill={AMBER} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}K subs`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55">Prime ARPU BSD {d.byValueTier[0].arpu} · Mass BSD {d.byValueTier[1].arpu} · Vulnerable BSD {d.byValueTier[2].arpu}</div>
        </Panel>

        <Panel title={tt('Who · age band')}>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.byAge} dataKey="subs" nameKey="bucket" outerRadius={75} label={(e: any) => `${e.bucket}`} labelLine={false} fontSize={10}>
                  {d.byAge.map((_, i) => <Cell key={i} fill={[BLUE, '#3b82f6', RED, RED2, AMBER, GREY][i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}K`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55">Modal age band: <span className="font-bold">{[...d.byAge].sort((a, b) => b.subs - a.subs)[0].bucket}</span></div>
        </Panel>

        <Panel title={tt('Who · household type')}>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.byHHType} dataKey="subs" nameKey="type" outerRadius={75} label={(e: any) => `${e.type}`} labelLine={false} fontSize={10}>
                  <Cell fill={GREY} /><Cell fill={BLUE} /><Cell fill={GREEN} /><Cell fill={AMBER} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}K HHs`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55">{((d.byHHType[2].subs / d.totalSubs) * 100).toFixed(0)}% Family households — highest LTV cohort.</div>
        </Panel>
      </div>

      {/* Funnel + Cohort survival */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Acquisition funnel · Impression → Activated')}>
          <div className="space-y-3">
            {d.funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-sm">{f.stage}</span>
                  <span className="text-xs">
                    <span className="font-bold text-vfes-dark">{f.count.toLocaleString()}</span>
                    {i > 0 && <span className="text-vfes-dark/55 ml-2">{f.conv.toFixed(1)}% conv</span>}
                  </span>
                </div>
                <div className="h-3 bg-[#f3f4f7] rounded-full overflow-hidden">
                  <div className="h-full bg-vfes-red transition-all" style={{ width: `${(f.count / d.funnel[0].count) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-3">PDP→Cart conversion {d.funnel[2].conv.toFixed(1)}% (industry P75 ≈ 30% for this category).</div>
        </Panel>

        <Panel title={tt('Cohort survival · 2024 / 2025 / 2026 vintages')}>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={d.cohortSurvival}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x={7} stroke={AMBER} strokeDasharray="4 4" label={{ value: 'Promo cliff', fontSize: 9, fill: AMBER }} />
                <Line type="monotone" dataKey="v2024" stroke={BLUE} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="v2025" stroke={AMBER} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="v2026" stroke={RED} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Attach + Upsell */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Add-on attach · what they buy with this SKU')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Add-on')}</th><th>{tt('Attach %')}</th><th>{tt('Impact')}</th></tr>
            </thead>
            <tbody>
              {d.attach.map((a, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{a.addon}</td>
                  <td className="font-bold text-vfes-dark">{a.rate}%</td>
                  <td className="text-xs text-emerald-700">{a.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Upsell ladder · where customers move next')}>
          <div className="space-y-3">
            {d.upsellPath.map((u, i) => (
              <div key={i} onClick={() => setSku(u.to)} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5 cursor-pointer hover:border-vfes-red/30 flex items-center gap-3">
                <span className="font-mono text-xs font-bold">{u.from}</span>
                <ChevronRight className="w-4 h-4 text-vfes-dark" />
                <span className="font-mono text-xs font-bold text-vfes-dark">{u.to}</span>
                <span className="ml-auto font-bold text-emerald-600">{u.convPct}%</span>
                <span className="text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('click to drill')}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Tickets + Competitor + Roadmap */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Top support topics for this SKU')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Topic')}</th><th>{tt('Vol')}</th><th>{tt('BSD /mo')}</th><th>Δ</th></tr>
            </thead>
            <tbody>
              {d.ticketsBy.map((t, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 text-xs">{t.topic}</td>
                  <td className="font-semibold">{t.volume.toLocaleString()}</td>
                  <td className="text-red-600">BSD {t.cost.toFixed(1)}</td>
                  <td className={t.trend < 0 ? 'text-emerald-600 font-semibold' : t.trend > 5 ? 'text-red-600 font-bold' : 'text-amber-700'}>{t.trend > 0 ? '+' : ''}{t.trend}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Competitor equivalents')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Competitor')}</th><th>{tt('Product')}</th><th>{tt('Price')}</th><th>{tt('Gap')}</th></tr>
            </thead>
            <tbody>
              {d.competitorEquiv.map((c, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2"><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.competitor === 'Rival ISP B' ? 'bg-blue-100 text-blue-800' : c.competitor === 'BTC' ? 'bg-emerald-100 text-emerald-800' : c.competitor === 'Cable Bahamas' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>{c.competitor}</span></td>
                  <td className="text-xs">{c.product}</td>
                  <td className="font-bold">BSD {c.price}</td>
                  <td className={c.gap < -5 ? 'text-red-600 font-bold' : c.gap > 5 ? 'text-emerald-600 font-bold' : 'text-vfes-dark/60'}>{c.gap > 0 ? '+' : ''}BSD {c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Negative gap = competitor cheaper. Positive = Cable Bahamas premium.')}</div>
        </Panel>

        <Panel title={tt('Roadmap items touching this SKU')}>
          {relRoad.length === 0 && <div className="text-xs text-vfes-dark/50 italic">{tt('No active roadmap items targeting this SKU.')}</div>}
          <div className="space-y-2">
            {relRoad.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-vfes-red/20 bg-vfes-red/5">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark">{r.theme}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-vfes-dark/70">{r.confidence}</span>
                </div>
                <div className="font-bold text-sm">{tt(r.title)}</div>
                <div className="text-[10px] text-vfes-dark/65 mt-1">{r.successMetric}</div>
                <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-1">{r.id} · ETA {r.eta}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* AI prompts */}
      <Panel title={tt('Snowflake Intelligence — Ask the data about this SKU')}>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {[
            `What is the M0 → M24 retention for ${sku.code} new vintage vs back-book, and why does the M7 cliff happen?`,
            `Show me the channel that produces the highest LTV/CAC for ${sku.code} — and quantify CAC arbitrage opportunity.`,
            `Which add-ons attach best to ${sku.code} and what is the incremental margin per attach?`,
            `For ${sku.code}, which competitor moves in the last 30 days are most likely to drive defection?`,
            `Where is ${tt(sku.name)} growing fastest by region × age band × value tier — find the winning cohort.`,
          ].map((q) => (
            <button key={q} className="text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
              <span className="flex-1">{q}</span>
            </button>
          ))}
        </div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · EXPERIMENTS
// ===========================================================================
function ExperimentsTab({ status }: { status: string }) {
  const filtered = experiments.filter((e) => status === 'all' || e.status === status)
  const won = experiments.filter((e) => e.status === 'Won' || e.status === 'Shipped').length
  const winRate = ((won / experiments.length) * 100).toFixed(0)
  const avgLift = (experiments.filter((e) => e.status === 'Won' || e.status === 'Shipped').reduce((a, e) => a + e.variantUplift, 0) / Math.max(1, won)).toFixed(1)
  const running = experiments.filter((e) => e.status === 'Running').length

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Active tests')} value={`${running}`} delta={`${experiments.length} total`} icon={FlaskConical} accent />
        <KpiCard label={tt('Win rate')} value={`${winRate}%`} delta="of completed tests" trend="up" icon={Award} />
        <KpiCard label={tt('Avg lift (winners)')} value={`+${avgLift}%`} delta="on key metric" trend="up" icon={TrendingUp} />
        <KpiCard label={tt('Tests / quarter')} value="14" delta="P75 SaaS benchmark" icon={Target} />
      </div>

      <Panel title={tt('Experiments log')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('ID')}</th><th>{tt('Hypothesis')}</th><th>{tt('Surface')}</th><th>{tt('Squad')}</th><th>{tt('Status')}</th><th>{tt('Lift')}</th><th>p</th><th>n</th><th>{tt('ETA')}</th></tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-black/5">
                  <td className="py-2 font-mono text-[10px] text-vfes-dark/60">{e.id}</td>
                  <td className="text-xs">{e.hypothesis}</td>
                  <td className="text-xs text-vfes-dark/65">{e.surface}</td>
                  <td className="text-[10px] uppercase font-bold">{e.squad}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      e.status === 'Running' ? 'bg-blue-100 text-blue-800' :
                      e.status === 'Won' || e.status === 'Shipped' ? 'bg-emerald-100 text-emerald-800' :
                      e.status === 'Lost' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>{tt(e.status)}</span>
                  </td>
                  <td className={`font-bold ${e.variantUplift > 5 ? 'text-emerald-600' : e.variantUplift > 0 ? 'text-amber-700' : 'text-red-600'}`}>{e.variantUplift > 0 ? '+' : ''}{e.variantUplift.toFixed(1)}%</td>
                  <td className={`font-mono text-xs ${e.pValue < 0.05 ? 'font-bold text-emerald-600' : 'text-vfes-dark/60'}`}>{e.pValue.toFixed(2)}</td>
                  <td className="font-mono text-xs">{e.n.toLocaleString()}</td>
                  <td className="text-[10px] text-vfes-dark/60">{e.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('Beta program tracker')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Beta')}</th><th>{tt('Signups')}</th><th>{tt('Active')}</th><th>{tt('NPS')}</th><th>{tt('Defect %')}</th><th>{tt('ETA GA')}</th></tr>
            </thead>
            <tbody>
              {betaProgram.map((b, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(b.name)}</td>
                  <td>{b.signups.toLocaleString()}</td>
                  <td>{b.active.toLocaleString()}</td>
                  <td className={b.nps > 70 ? 'text-emerald-600 font-bold' : b.nps > 50 ? 'text-amber-700' : 'text-red-600'}>{b.nps}</td>
                  <td className={b.defectRate < 1 ? 'text-emerald-600' : b.defectRate < 3 ? 'text-amber-700' : 'text-red-600 font-bold'}>{b.defectRate.toFixed(1)}%</td>
                  <td className="text-[10px]">{b.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Discovery funnel · ideas → shipped')}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={discoveryFunnel} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} />
                <YAxis type="category" dataKey="stage" stroke="#999" fontSize={11} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {discoveryFunnel.map((_, i) => <Cell key={i} fill={[GREY, BLUE, AMBER, RED, GREEN][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Conversion 64 → 4 = 6.3% idea-to-ship rate; industry healthy benchmark 4-8%.')}</div>
        </Panel>
      </div>
    </>
  )
}
