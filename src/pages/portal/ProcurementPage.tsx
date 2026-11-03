// =============================================================================
// Procurement cockpit — senior CPO grade
// 9 tabs · Executive-style pill nav · BSD 186M spend · 442 vendors · 240 contracts
// =============================================================================
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import KpiCard from '../../components/KpiCard'
import {
  ShoppingCart, FileSignature, Truck, AlertTriangle, Activity, Globe, Building2,
  Coins, TrendingUp, TrendingDown, Heart, Award, Calendar, Target, Shield, Leaf,
  Package, Cpu, Cloud, Zap, FlaskConical, ChevronRight, MessageSquare, CheckCircle,
  Clock, RefreshCw, Layers, Users, FileText, Smartphone,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, PieChart, Pie,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { MOBILE_RAN_PROCUREMENT } from './_mobile_data'
import {
  vendors, spendByCategory, spendByCcy, spendByCountry, spendTrend, directIndirect,
  capexOpex, compliance, renewalCliff, noticeAlerts, rfxPipeline, savingsTracker,
  savingsByCategory, risks, inventory, leadTimeTrend, warehouses, scope3ByCategory,
  ecovadisDist, diversitySpend, benchmark, buildVendorDetails,
  type Vendor, type Category, type KraljicQuadrant,
} from './_procurement_data'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const TEAL = '#0d9488'
const GREY = '#94a3b8'

const PIE = [RED, RED2, AMBER, BLUE, PURPLE, TEAL, GREEN, GREY, '#0ea5e9', '#f97316']

const tabs = [
  { id: 'overview',  label: 'Overview',           icon: Activity },
  { id: 'spend',     label: 'Spend Cube',         icon: Layers },
  { id: 'vendors',   label: 'Vendors',            icon: Building2 },
  { id: 'contracts', label: 'Contracts',          icon: FileSignature },
  { id: 'sourcing',  label: 'Sourcing',           icon: Target },
  { id: 'risk',      label: 'Risk & Resilience',  icon: Shield },
  { id: 'esg',       label: 'Sustainability',     icon: Leaf },
  { id: 'inventory', label: 'Inventory & SC',     icon: Package },
  { id: 'vendor360', label: 'Vendor 360',         icon: Award },
] as const
type TabId = typeof tabs[number]['id']

const cyberColor: Record<string, string> = { A: 'bg-emerald-50 text-emerald-700', B: 'bg-blue-50 text-blue-700', C: 'bg-amber-50 text-amber-700', D: 'bg-orange-50 text-orange-700', F: 'bg-red-50 text-red-700' }
const finColor: Record<string, string> = { Strong: 'bg-emerald-50 text-emerald-700', Stable: 'bg-blue-50 text-blue-700', Watch: 'bg-amber-50 text-amber-700', Distressed: 'bg-red-50 text-red-700' }
const sevColor: Record<string, string> = { Low: 'bg-emerald-50 text-emerald-700', Medium: 'bg-amber-50 text-amber-700', High: 'bg-red-50 text-red-700' }

export default function ProcurementPage() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    try { const raw = localStorage.getItem('procurement-tab') as TabId; if (raw) return raw } catch { /* ignore */ }
    return 'overview'
  })
  useEffect(() => { try { localStorage.setItem('procurement-tab', tab) } catch { /* ignore */ } }, [tab])
  const [selectedVendor, setSelectedVendor] = useState<string>(() => {
    if (typeof window === 'undefined') return 'CSCO'
    const m = window.location.hash.match(/[?&]v=([A-Z0-9_]+)/)
    if (m) return m[1]
    try { const raw = localStorage.getItem('procurement-vendor'); if (raw) return raw } catch { /* ignore */ }
    return 'CSCO'
  })
  useEffect(() => { try { localStorage.setItem('procurement-vendor', selectedVendor) } catch { /* ignore */ } }, [selectedVendor])
  const drillInto = (code: string) => { setSelectedVendor(code); setTab('vendor360') }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Procurement')}
        subtitle={tt('BSD 186M annual spend · 442 vendors · 240 contracts · live CPO cockpit')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Award className="w-3.5 h-3.5" />{tt('CPO Cockpit')}</div>}
      />

      <MlInsightSection
        heading="Procurement intelligence"
        models={[
          { name: 'Spend / Maverick-spend Anomaly', metric: 'recall 0.86', sub: 'off-contract detection' },
          { name: 'Supplier-risk Predictor', metric: 'AUC 0.84', sub: 'delivery & financial risk' },
          { name: 'Savings Recommender', metric: 'top-k', sub: 'consolidation opportunities' },
        ]}
        agentLabel="Run Procurement Radar" agentRunningLabel="Scoring…"
        agentSteps={[
          'Detected maverick / off-contract spend (anomaly)',
          'Scored suppliers on delivery & financial risk',
          'Recommended consolidation & renegotiation savings',
          'Drafted actions & owners for sourcing',
        ]}
        agentBlurb="Anomaly detection on spend plus supplier-risk scoring finds savings and exposure that line-item review misses."
        decision={{
          title: 'Eliminate maverick spend & de-risk the top-2 critical suppliers',
          detail: 'The model finds off-contract spend concentrated in IT & facilities and flags two single-source suppliers with rising financial-risk scores. Channel spend to contract and qualify a second source.',
          impact: 'savings on tail spend · supply-continuity protection',
          risk: 'second-sourcing has switching cost — phase critical items first',
          linkTo: '#/portal/supply-chain', linkLabel: 'Open Supply Chain',
        }}
        chart={{
          kind: 'bar', title: 'Maverick (off-contract) spend by category (BSD K)', xKey: 'cat', unit: 'K',
          data: [
            { cat: 'IT / software', spend: 420 }, { cat: 'Facilities', spend: 310 },
            { cat: 'Marketing', spend: 180 }, { cat: 'Logistics', spend: 95 }, { cat: 'Network', spend: 60 },
          ],
          series: [{ key: 'spend', name: 'Off-contract BSD K', color: '#FF4438' }],
          colorBy: { key: 'spend', high: 300, mid: 150 },
          note: 'IT and facilities drive most off-contract spend — channel to framework agreements first.',
        }}
      />

      <AgentDecision
        title="Savings-pipeline agent"
        label="Run Savings Pipeline"
        runningLabel="Sourcing…"
        steps={[
          'Scanned spend by category for consolidation',
          'Benchmarked vendor rates vs market index',
          'Identified RFP & renegotiation candidates',
          'Built a savings pipeline with owners & dates',
        ]}
        hint="Turns spend analytics into a tracked, owner-assigned savings pipeline."
        result={{
          headline: 'Consolidate RAN vendor spend and hedge FX exposure',
          stats: [
            { label: 'Annual spend', value: 'BSD 186M' },
            { label: 'Savings realised', value: `BSD ${savingsTracker.realised}M` },
            { label: 'Active contracts', value: '240' },
            { label: 'OTIF (top-10)', value: '92%' },
          ],
          findings: [
            'RAN is the largest category and is split across vendors; consolidation plus a multi-year framework unlocks volume discount.',
            'Open FX exposure on USD kit warrants a hedge.',
          ],
          note: 'savings-pipeline target on BSD 186M spend',
        }}
        impact="savings-pipeline target on BSD 186M spend"
        risk="single-vendor RAN raises supply concentration risk"
        linkTo="#/portal/finance"
        linkLabel="Open Finance"
      />

      {/* Tab nav (Executive style: pill row, white card) */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {tab === 'overview'   && <OverviewTab drillInto={drillInto} />}
      {tab === 'spend'      && <SpendTab />}
      {tab === 'vendors'    && <VendorsTab drillInto={drillInto} />}
      {tab === 'contracts'  && <ContractsTab drillInto={drillInto} />}
      {tab === 'sourcing'   && <SourcingTab />}
      {tab === 'risk'       && <RiskTab drillInto={drillInto} />}
      {tab === 'esg'        && <EsgTab />}
      {tab === 'inventory'  && <InventoryTab />}
      {tab === 'vendor360'  && <Vendor360Tab code={selectedVendor} setCode={setSelectedVendor} />}

      {/* ── Related cockpits ── */}
      <Panel title={tt('Related cockpits')}>
        <p className="text-xs text-vfes-dark/55 mb-3">{tt('Jump to related procurement, financial and operational cockpits.')}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/portal/finance" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Coins className="w-3.5 h-3.5" />{tt('Finance')}</Link>
          <Link to="/portal/capital-treasury" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><TrendingUp className="w-3.5 h-3.5" />{tt('Capital & Treasury')}</Link>
          <Link to="/portal/supply-chain" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Truck className="w-3.5 h-3.5" />{tt('Supply Chain')}</Link>
          <Link to="/portal/cost" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Activity className="w-3.5 h-3.5" />{tt('Cost Intelligence')}</Link>
          <Link to="/portal/cfo" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Globe className="w-3.5 h-3.5" />{tt('CFO Dashboard')}</Link>
          <Link to="/portal/b2b" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Users className="w-3.5 h-3.5" />{tt('B2B')}</Link>
          <Link to="/portal/revenue-assurance" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><TrendingDown className="w-3.5 h-3.5" />{tt('Revenue Assurance')}</Link>
          <Link to="/portal/billing-charging" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Zap className="w-3.5 h-3.5" />{tt('Billing & Charging')}</Link>
          <Link to="/portal/regulatory" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Shield className="w-3.5 h-3.5" />{tt('Regulatory')}</Link>
          <Link to="/portal/ma-simulator" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><FlaskConical className="w-3.5 h-3.5" />{tt('M&A Simulator')}</Link>
          <Link to="/portal/ai-insights" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><RefreshCw className="w-3.5 h-3.5" />{tt('AI Insights')}</Link>
          <Link to="/portal/sales" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Award className="w-3.5 h-3.5" />{tt('Sales')}</Link>
          <Link to="/portal/investor-relations" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vfes-red/5 text-vfes-dark font-semibold hover:bg-vfes-red/10 transition"><Heart className="w-3.5 h-3.5" />{tt('Investor Relations')}</Link>
        </div>
      </Panel>

      <div className="mt-10 text-[10px] text-vfes-dark/40 text-center font-semibold uppercase tracking-widest">
        Snowpark ML vendor-risk model · 442 vendors · semantic view PROCURE_360 · model procurement-cockpit v1.0 · refreshed daily 02:00 UTC
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------- OVERVIEW
function OverviewTab({ drillInto }: { drillInto: (c: string) => void }) {
  const totalSpend = vendors.reduce((s, v) => s + v.spend, 0) / 1000
  const top10 = [...vendors].sort((a, b) => b.spend - a.spend).slice(0, 10)
  const top10Share = top10.reduce((s, v) => s + v.spend, 0) / vendors.reduce((s, v) => s + v.spend, 0)
  const fxNonBsd = vendors.filter((v) => v.ccy !== 'BSD').reduce((s, v) => s + v.spend, 0) / 1000
  const renewalsNext90 = vendors.filter((v) => v.daysToNotice > 0 && v.daysToNotice <= 90).length

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Annual spend')} value={`BSD ${totalSpend.toFixed(0)}M`} delta="-2.4% vs plan" trend="up" icon={ShoppingCart} accent />
        <KpiCard label={tt('Savings realised (FY)')} value={`BSD ${savingsTracker.realised}M`} delta={`vs BSD ${savingsTracker.targetFY}M target`} trend="up" icon={Coins} />
        <KpiCard label={tt('Spend under management')} value={`${(compliance.spendUnderManagement * 100).toFixed(0)}%`} delta={`maverick ${(compliance.maverickSpendPct * 100).toFixed(0)}%`} trend="up" icon={Shield} />
        <KpiCard label={tt('Top-10 concentration')} value={`${(top10Share * 100).toFixed(0)}%`} delta="of spend" trend="flat" icon={AlertTriangle} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Active contracts')} value="240" delta={`${noticeAlerts.length} notice OPEN`} trend="flat" icon={FileSignature} />
        <KpiCard label={tt('Renewals < 90 days')} value={`${renewalsNext90}`} delta="action required" trend="down" icon={Calendar} />
        <KpiCard label={tt('Non-BSD FX exposure')} value={`BSD ${fxNonBsd.toFixed(0)}M`} delta="USD/GBP" trend="flat" icon={Globe} />
        <KpiCard label={tt('OTIF (top-10)')} value="92%" delta="-1 pt vs plan" trend="down" icon={Truck} />
      </div>

      {/* Mobile RAN vendor spend (TTM) */}
      <Panel title={tt('Mobile RAN vendor spend (TTM · BSD M)')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5G SA + Open RAN + Island Towers (demo)')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Category')}</th><th>{tt('Spend TTM')}</th><th>{tt('Open PO')}</th><th>{tt('Terms')}</th><th>{tt('Risk')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_RAN_PROCUREMENT.map((v) => (
              <tr key={v.vendor} className="border-t border-black/5">
                <td className="py-2 font-semibold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />{v.vendor}</td>
                <td className="text-xs text-vfes-dark/65">{tt(v.category)}</td>
                <td className="font-mono text-xs font-bold">BSD {v.spendTtm.toFixed(1)}M</td>
                <td className="font-mono text-xs">BSD {v.openPO.toFixed(1)}M</td>
                <td className="font-mono text-xs text-vfes-dark/65">{v.paymentTerms}</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.risk === 'Low' ? 'bg-emerald-50 text-emerald-700' : v.risk === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{tt(v.risk)}</span>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-vfes-dark/20 font-bold">
              <td className="py-2">{tt('Total mobile RAN')}</td>
              <td></td>
              <td className="font-mono text-xs">BSD {MOBILE_RAN_PROCUREMENT.reduce((s,v)=>s+v.spendTtm,0).toFixed(1)}M</td>
              <td className="font-mono text-xs">BSD {MOBILE_RAN_PROCUREMENT.reduce((s,v)=>s+v.openPO,0).toFixed(1)}M</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Ericsson + Nokia represent 60% of mobile RAN spend (5G SA macro footprint). Huawei is on Watch under the high-risk vendor policy — limited to refarm + microwave only. Open RAN spend rising via Samsung / Mavenir / Fujitsu (BSD 63.6M TTM combined).')}</div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('Spend trend by category (BSD K · 8Q)')}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={spendTrend}>
                <CartesianGrid stroke="#eef0f3" />
                <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="Network" stackId="a" stroke={RED} fill={RED} />
                <Area dataKey="Content" stackId="a" stroke={RED2} fill={RED2} />
                <Area dataKey="CPE" stackId="a" stroke={AMBER} fill={AMBER} />
                <Area dataKey="Cloud & SaaS" stackId="a" stroke={BLUE} fill={BLUE} />
                <Area dataKey="Energy" stackId="a" stroke={PURPLE} fill={PURPLE} />
                <Area dataKey="Other" stackId="a" stroke={GREY} fill={GREY} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Spend by category')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={spendByCategory} dataKey="spend" nameKey="category" innerRadius={50} outerRadius={100}>
                {spendByCategory.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${(Number(v) / 1000).toFixed(1)}M`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Top-10 vendors by spend')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Category')}</th><th>{tt('Spend BSD K')}</th><th>{tt('CCY')}</th><th>{tt('Tier')}</th></tr>
            </thead>
            <tbody>
              {top10.map((v) => (
                <tr key={v.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(v.code)}>
                  <td className="py-2 font-semibold">{tt(v.name)} <ChevronRight className="inline w-3 h-3 text-vfes-dark/30" /></td>
                  <td className="text-vfes-dark/60 text-xs">{tt(v.category)}</td>
                  <td>BSD {v.spend.toLocaleString()}</td>
                  <td>{v.ccy}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${v.tier === 'Strategic' ? 'bg-red-50 text-red-700' : v.tier === 'Preferred' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>{v.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Savings P&L')}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Mini label={tt('Target FY')} value={`BSD ${savingsTracker.targetFY}M`} />
            <Mini label={tt('Identified')} value={`BSD ${savingsTracker.identified}M`} positive />
            <Mini label={tt('Contracted')} value={`BSD ${savingsTracker.contracted}M`} positive />
            <Mini label={tt('Realised')} value={`BSD ${savingsTracker.realised}M`} positive />
            <Mini label={tt('Cost avoidance')} value={`BSD ${savingsTracker.costAvoidance}M`} />
            <Mini label={tt('Leakage')} value={`BSD ${savingsTracker.leakage}M`} negative />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={savingsByCategory}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="target" fill={GREY} name={tt('Target BSD M')} />
              <Bar dataKey="realised" fill={RED} name={tt('Realised BSD M')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Spend optimisation opportunities — BSD 11.0M identified')}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { cat: tt('Network RAN'),      opp: tt('Multi-year framework consolidation'),    saving: 'BSD 4.2M', prob: 'High' },
            { cat: tt('Cloud & SaaS'),     opp: tt('Volume commitment + BYOL conversion'),   saving: 'BSD 2.1M', prob: 'High' },
            { cat: tt('IT & Software'),    opp: tt('Maverick spend → catalogue channels'),   saving: 'BSD 1.8M', prob: 'Medium' },
            { cat: tt('Energy'),           opp: tt('Green PPA + forward hedge'),               saving: 'BSD 1.4M', prob: 'Medium' },
            { cat: tt('Content & Media'),  opp: tt('Content rights portfolio consolidation'), saving: 'BSD 0.8M', prob: 'Medium' },
            { cat: tt('Facilities'),       opp: tt('Soft-service rebundle'),                   saving: 'BSD 0.9M', prob: 'Low' },
            { cat: tt('Logistics'),        opp: tt('3PL renegotiation + lane pricing'),        saving: 'BSD 0.6M', prob: 'Low' },
            { cat: tt('Real estate'),      opp: tt('Lease portfolio renegotiation'),           saving: 'BSD 0.4M', prob: 'Low' },
          ].map((o) => (
            <div key={o.cat} className="p-3 rounded-lg bg-zinc-50 border border-black/5">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{o.cat}</div>
              <div className="text-sm font-semibold mt-1">{o.opp}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-emerald-600 font-extrabold text-base">{o.saving}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${o.prob === 'High' ? 'bg-emerald-50 text-emerald-700' : o.prob === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-700'}`}>{o.prob}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-black/5 text-xs text-vfes-dark/55">
          {tt('Total identified savings pipeline')} <span className="font-extrabold text-emerald-600">BSD 11.0M</span> · {tt('tracking against BSD 14M FY target · Network RAN consolidation is the highest-value lever')}
        </div>
      </Panel>

      <SiPrompts prompts={[
        'Show top vendors with notice window opening in next 60 days.',
        'Which categories are over plan year-to-date?',
        'List savings leaks by vendor where invoiced price > contracted price.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- SPEND CUBE
function SpendTab() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Direct spend')} value="BSD 102M" delta="55%" trend="flat" icon={Cpu} accent />
        <KpiCard label={tt('Indirect spend')} value="BSD 62M" delta="33%" trend="flat" icon={FileText} />
        <KpiCard label={tt('Capex / Opex')} value="BSD 64M / BSD 122M" delta="34% capex" trend="flat" icon={Layers} />
        <KpiCard label={tt('Tail spend')} value="BSD 11.2M" delta="412 vendors" trend="down" icon={Package} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title={tt('Direct vs indirect (BSD M)')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={directIndirect} dataKey="value" nameKey="type" outerRadius={90} label>
                {directIndirect.map((_, i) => <Cell key={i} fill={[RED, BLUE, AMBER][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}M`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Capex vs opex (BSD M)')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={capexOpex} dataKey="value" nameKey="type" outerRadius={90} label>
                {capexOpex.map((_, i) => <Cell key={i} fill={[RED, GREEN][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}M`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Currency exposure (BSD K)')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={spendByCcy} dataKey="spend" nameKey="ccy" outerRadius={90} label>
                {spendByCcy.map((_, i) => <Cell key={i} fill={[RED, BLUE, AMBER][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${(Number(v) / 1000).toFixed(1)}M`} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Spend by country (BSD K)')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={spendByCountry} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={50} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Bar dataKey="spend" fill={RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('P2P compliance KPIs')}>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Spend under management', compliance.spendUnderManagement, true],
                ['PO-backed spend', compliance.poBacked, true],
                ['3-way match rate', compliance.threeWayMatchRate, true],
                ['Catalogue adoption', compliance.catalogueAdoption, true],
                ['Maverick spend', compliance.maverickSpendPct, false],
                ['Early-pay discount capture', compliance.earlyPayDiscountCapture, true],
              ].map(([label, val, hi]) => (
                <tr key={label as string} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold w-1/3">{label}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded">
                        <div className={`h-full rounded ${hi ? ((val as number) >= 0.8 ? 'bg-emerald-500' : (val as number) >= 0.5 ? 'bg-amber-500' : 'bg-vfes-red') : ((val as number) <= 0.05 ? 'bg-emerald-500' : (val as number) <= 0.1 ? 'bg-amber-500' : 'bg-vfes-red')}`} style={{ width: `${(val as number) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{((val as number) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-black/5"><td className="py-2.5 font-semibold">{tt('DPO / DSO')}</td><td>{compliance.dpo}d / {compliance.dso}d</td></tr>
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Compute spend cube by category × cost-centre × month for last 12 months.',
        'List off-PO (maverick) spend vendors over BSD 100K.',
        'Show FX exposure by vendor and forward-cover position.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- VENDORS
function VendorsTab({ drillInto }: { drillInto: (c: string) => void }) {
  const [catFilter, setCatFilter] = useState<'all' | Category>('all')
  const [tierFilter, setTierFilter] = useState<'all' | Vendor['tier']>('all')
  const filtered = useMemo(() => vendors.filter((v) =>
    (catFilter === 'all' || v.category === catFilter) &&
    (tierFilter === 'all' || v.tier === tierFilter)
  ).sort((a, b) => b.spend - a.spend), [catFilter, tierFilter])

  // Kraljic scatter
  const kraljicData = vendors.map((v) => ({
    code: v.code, name: v.name, spend: v.spend,
    risk: v.scoreRisk + (v.altSources === 0 ? 30 : 0),
    impact: v.spend / 200,
    quad: v.kraljic,
  }))
  const quadColor: Record<KraljicQuadrant, string> = { Strategic: RED, Leverage: BLUE, Bottleneck: AMBER, Routine: GREEN }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as any)} className="bg-white border border-black/10 rounded-lg px-3 py-2 text-sm font-semibold">
          <option value="all">{tt('All categories')}</option>
          {Array.from(new Set(vendors.map((v) => v.category))).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as any)} className="bg-white border border-black/10 rounded-lg px-3 py-2 text-sm font-semibold">
          <option value="all">{tt('All tiers')}</option>
          <option>{tt('Strategic')}</option><option>{tt('Preferred')}</option><option>{tt('Approved')}</option><option>{tt('Tail')}</option>
        </select>
        <span className="text-xs text-vfes-dark/55 self-center">{filtered.length} vendors · BSD {(filtered.reduce((s, v) => s + v.spend, 0) / 1000).toFixed(1)}M</span>
      </div>

      <Panel title={tt('Kraljic matrix — risk × spend impact')}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid stroke="#eef0f3" />
            <XAxis type="number" dataKey="impact" name={tt('Spend impact')} tick={{ fontSize: 11 }} label={{ value: 'Spend impact →', fontSize: 10, position: 'bottom', offset: -4 }} />
            <YAxis type="number" dataKey="risk" name={tt('Supply risk')} tick={{ fontSize: 11 }} label={{ value: 'Supply risk →', fontSize: 10, angle: -90, position: 'left' }} />
            <ZAxis type="number" dataKey="spend" range={[40, 800]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any, p: any) => [`${p.payload.name} (${p.payload.quad})`, '']} />
            <ReferenceLine x={50} stroke="#1f2937" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#1f2937" strokeDasharray="3 3" />
            <Scatter data={kraljicData} onClick={(d: any) => d?.code && drillInto(d.code)}>
              {kraljicData.map((d, i) => <Cell key={i} fill={quadColor[d.quad]} cursor="pointer" />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: RED }} />{tt('Strategic')}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: BLUE }} />{tt('Leverage')}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: AMBER }} />{tt('Bottleneck')}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: GREEN }} />{tt('Routine')}</span>
        </div>
      </Panel>

      <Panel title={`Vendor scorecard (${filtered.length})`}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Vendor')}</th><th>{tt('Category')}</th><th>{tt('Spend BSD K')}</th><th>{tt('CCY')}</th><th>{tt('Tier')}</th><th>{tt('Kraljic')}</th><th>{tt('OTIF')}</th><th>{tt('Cyber')}</th><th>{tt('EcoVadis')}</th><th>{tt('Fin')}</th><th>{tt('Alt')}</th></tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(v.code)}>
                <td className="py-2 font-semibold">{tt(v.name)}</td>
                <td className="text-vfes-dark/60 text-xs">{tt(v.category)}</td>
                <td>BSD {v.spend.toLocaleString()}</td>
                <td>{v.ccy}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${v.tier === 'Strategic' ? 'bg-red-50 text-red-700' : v.tier === 'Preferred' ? 'bg-blue-50 text-blue-700' : v.tier === 'Tail' ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-100 text-zinc-700'}`}>{v.tier}</span></td>
                <td className="text-xs">{v.kraljic}</td>
                <td className={v.otif >= 0.95 ? 'text-emerald-600 font-bold' : v.otif >= 0.9 ? 'text-amber-600 font-bold' : 'text-vfes-dark font-bold'}>{(v.otif * 100).toFixed(0)}%</td>
                <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cyberColor[v.cyberRating]}`}>{v.cyberRating}</span></td>
                <td>{v.ecovadis || '—'}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${finColor[v.finHealth]}`}>{v.finHealth}</span></td>
                <td className={v.altSources === 0 ? 'text-vfes-dark font-bold' : ''}>{v.altSources}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- CONTRACTS
function ContractsTab({ drillInto }: { drillInto: (c: string) => void }) {
  const next6 = renewalCliff.slice(0, 6).reduce((s, x) => s + x.value, 0) / 1000
  const next12 = renewalCliff.slice(0, 12).reduce((s, x) => s + x.value, 0) / 1000

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Active contracts')} value="240" delta="14 strategic" trend="flat" icon={FileSignature} accent />
        <KpiCard label={tt('BSD  up next 6mo')} value={`BSD ${next6.toFixed(1)}M`} delta="renewal cliff" trend="down" icon={Calendar} />
        <KpiCard label={tt('BSD  up next 12mo')} value={`BSD ${next12.toFixed(1)}M`} delta="48% of book" trend="flat" icon={Clock} />
        <KpiCard label={tt('Notice OPEN')} value={`${noticeAlerts.length}`} delta="action required" trend="down" icon={AlertTriangle} />
      </div>

      <Panel title={tt('Renewal cliff · next 24 months (BSD K)')}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={renewalCliff}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'months ahead', fontSize: 10, position: 'bottom', offset: -4 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="value" fill={RED} name={tt('BSD K renewing')} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" dataKey="count" stroke="#1f2937" strokeWidth={2} dot={{ r: 3 }} name={tt('# contracts')} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={`Notice-window alerts (${noticeAlerts.length})`}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Vendor')}</th><th>{tt('Category')}</th><th>{tt('Spend BSD K')}</th><th>{tt('Renewal')}</th><th>{tt('Notice (days)')}</th><th>{tt('Days remaining')}</th><th>{tt('Auto-renew')}</th></tr>
          </thead>
          <tbody>
            {noticeAlerts.map((v) => (
              <tr key={v.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(v.code)}>
                <td className="py-2 font-semibold">{tt(v.name)}</td>
                <td className="text-vfes-dark/60 text-xs">{tt(v.category)}</td>
                <td>BSD {v.spend.toLocaleString()}</td>
                <td>{v.renewalDate}</td>
                <td>{v.noticeDays}</td>
                <td className={v.daysToNotice <= 30 ? 'text-vfes-dark font-bold' : v.daysToNotice <= 60 ? 'text-amber-600 font-bold' : ''}>{v.daysToNotice}d</td>
                <td>{v.autoRenew ? <span className="text-vfes-dark font-bold text-xs">{tt('YES')}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <SiPrompts prompts={[
        'List all auto-renew contracts opening in next 90 days.',
        'Find contracts with CPI indexation > 3% — inflation exposure.',
        'Show MFN clauses across the contract book.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- SOURCING
function SourcingTab() {
  const totalRfx = rfxPipeline.reduce((s, r) => s + r.value, 0)
  const totalIdent = rfxPipeline.reduce((s, r) => s + r.identified, 0)

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Active RFx')} value={`${rfxPipeline.length}`} delta={`BSD ${totalRfx}M addressable`} trend="up" icon={Target} accent />
        <KpiCard label={tt('Savings identified')} value={`BSD ${totalIdent.toFixed(1)}M`} delta={`${((totalIdent / totalRfx) * 100).toFixed(0)}% of value`} trend="up" icon={Coins} />
        <KpiCard label={tt('Avg cycle time')} value="84d" delta="-12d YoY" trend="up" icon={Clock} />
        <KpiCard label={tt('Avg # bidders')} value="3.6" delta="competitive tension" trend="up" icon={Users} />
      </div>

      <Panel title={tt('Active RFx pipeline')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('RFx')}</th><th>{tt('Category')}</th><th>{tt('Stage')}</th><th>{tt('Value BSD M')}</th><th>{tt('Identified savings BSD M')}</th><th>{tt('Bidders')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {rfxPipeline.map((r) => (
              <tr key={r.rfx} className="border-t border-black/5">
                <td className="py-2 font-semibold text-xs">{r.rfx}</td>
                <td className="text-vfes-dark/60 text-xs">{tt(r.category)}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${r.stage === 'Awarded' ? 'bg-emerald-50 text-emerald-700' : r.stage === 'Negotiation' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>{r.stage}</span></td>
                <td>BSD {r.value}M</td>
                <td className="text-emerald-600 font-bold">BSD {r.identified}M</td>
                <td>{r.vendors}</td>
                <td className="text-vfes-dark/70 text-xs">{tt(r.owner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title={tt('Cost benchmark — Cable Bahamas vs market vs peer (100 = market)')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={benchmark}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="lever" tick={{ fontSize: 10 }} />
            <YAxis domain={[80, 115]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={100} stroke="#1f2937" strokeDasharray="3 3" />
            <Bar dataKey="vfes" fill={RED} name={tt('Cable Bahamas')} />
            <Bar dataKey="market" fill={GREY} name={tt('Market')} />
            <Bar dataKey="peer" fill={BLUE} name={tt('Peer telco')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title={tt('Savings by category — target vs realised')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={savingsByCategory}>
            <CartesianGrid stroke="#eef0f3" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="target" fill={GREY} name={tt('Target BSD M')} />
            <Bar dataKey="realised" fill={RED} name={tt('Realised BSD M')} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  )
}

// ----------------------------------------------------------------------------- RISK
function RiskTab({ drillInto }: { drillInto: (c: string) => void }) {
  const single = vendors.filter((v) => v.altSources === 0)
  const cyberWeak = vendors.filter((v) => v.cyberRating === 'C' || v.cyberRating === 'D' || v.cyberRating === 'F')
  const finRisk = vendors.filter((v) => v.finHealth === 'Watch' || v.finHealth === 'Distressed')

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Single-source vendors')} value={`${single.length}`} delta={`BSD ${single.reduce((s, v) => s + v.spend, 0) / 1000} M`} trend="down" icon={AlertTriangle} accent />
        <KpiCard label={tt('Cyber rating C+')} value={`${cyberWeak.length}`} delta="URCA cyber attestation" trend="down" icon={Shield} />
        <KpiCard label={tt('Financial-health watch')} value={`${finRisk.length}`} delta="D&B downgrade" trend="down" icon={TrendingDown} />
        <KpiCard label={tt('Open risk register')} value={`${risks.length}`} delta={`${risks.filter((r) => r.sev === 'High').length} high`} trend="flat" icon={Activity} />
      </div>

      <Panel title={tt('Risk register (open)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('ID')}</th><th>{tt('Vendor')}</th><th>{tt('Kind')}</th><th>{tt('Severity')}</th><th>{tt('Detail')}</th><th>{tt('Owner')}</th><th>{tt('Due')}</th></tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs">{r.id}</td>
                <td className="font-semibold">{r.vendor}</td>
                <td>{r.kind}</td>
                <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sevColor[r.sev]}`}>{r.sev}</span></td>
                <td className="text-vfes-dark/70 text-xs">{r.detail}</td>
                <td className="text-xs">{tt(r.owner)}</td>
                <td className="text-xs text-vfes-dark/60">{r.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`Single-source vendors (${single.length})`}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Category')}</th><th>{tt('Spend BSD K')}</th></tr>
            </thead>
            <tbody>
              {single.map((v) => (
                <tr key={v.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(v.code)}>
                  <td className="py-2 font-semibold">{tt(v.name)}</td>
                  <td className="text-vfes-dark/60 text-xs">{tt(v.category)}</td>
                  <td className="font-bold">BSD {v.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={`Cyber rating C+ (${cyberWeak.length})`}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Rating')}</th><th>{tt('Spend BSD K')}</th></tr>
            </thead>
            <tbody>
              {cyberWeak.map((v) => (
                <tr key={v.code} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer" onClick={() => drillInto(v.code)}>
                  <td className="py-2 font-semibold">{tt(v.name)}</td>
                  <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cyberColor[v.cyberRating]}`}>{v.cyberRating}</span></td>
                  <td>BSD {v.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Forecast vendor financial-health risk using Snowpark ML model.',
        'Show all URCA cyber-required vendors lacking attestation.',
        'List geopolitical exposure: Russia, China-restricted sub-suppliers.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- ESG
function EsgTab() {
  const totalScope3 = scope3ByCategory.reduce((s, x) => s + x.ktCo2e, 0)
  const bahamianSme = diversitySpend.find((d) => d.kind === 'Bahamian SME')?.value ?? 0
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Scope-3 (procurement)')} value={`${totalScope3.toFixed(1)} ktCO₂e`} delta="-6% YoY" trend="up" icon={Leaf} accent />
        <KpiCard label={tt('Bahamian SME spend')} value={`BSD ${bahamianSme}M`} delta="+BSD 2.4M YoY" trend="up" icon={Heart} />
        <KpiCard label={tt('EcoVadis ≥ 50')} value={`${ecovadisDist[0].count + ecovadisDist[1].count}`} delta="of top 86" trend="up" icon={CheckCircle} />
        <KpiCard label={tt('CDP-disclosed vendors')} value="62%" delta="+8 pts" trend="up" icon={FileText} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Scope-3 by category (ktCO₂e)')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scope3ByCategory.sort((a, b) => b.ktCo2e - a.ktCo2e)} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="ktCo2e" fill={GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('EcoVadis distribution')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ecovadisDist}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ecovadisDist.map((_, i) => <Cell key={i} fill={[GREEN, BLUE, AMBER, RED, GREY][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Diversity spend (BSD M)')}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={diversitySpend} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid stroke="#eef0f3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="kind" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}M`} />
            <Bar dataKey="value" fill={PURPLE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SiPrompts prompts={[
        'Top vendors by Scope-3 emissions — set reduction target.',
        'List vendors below EcoVadis 50 — improvement plan.',
        'Track Bahamian SME spend trajectory toward 15% target.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- INVENTORY
function InventoryTab() {
  const stockOuts = inventory.filter((i) => i.weeksCover < 6)
  const aged = inventory.filter((i) => i.ageDays > 90)
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Stock-out risk SKUs')} value={`${stockOuts.length}`} delta="< 6 weeks cover" trend="down" icon={AlertTriangle} accent />
        <KpiCard label={tt('Aged stock SKUs')} value={`${aged.length}`} delta="> 90 days" trend="down" icon={Clock} />
        <KpiCard label={tt('OTIF (top-10)')} value="92%" delta="-1 pt YoY" trend="down" icon={Truck} />
        <KpiCard label={tt('Forecast accuracy')} value="86%" delta="+4 pts" trend="up" icon={Target} />
      </div>

      <Panel title={tt('CPE / device inventory')}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('SKU')}</th><th>{tt('On hand')}</th><th>{tt('On order')}</th><th>{tt('Weeks cover')}</th><th>{tt('Age (days)')}</th><th>{tt('Lead time')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {inventory.map((i) => (
              <tr key={i.sku} className="border-t border-black/5">
                <td className="py-2 font-semibold font-mono text-xs">{i.sku}</td>
                <td>{i.onHand.toLocaleString()}</td>
                <td>{i.onOrder.toLocaleString()}</td>
                <td className={i.weeksCover < 6 ? 'text-vfes-dark font-bold' : i.weeksCover < 12 ? 'text-amber-600' : 'text-emerald-600'}>{i.weeksCover}w</td>
                <td className={i.ageDays > 90 ? 'text-vfes-dark font-bold' : ''}>{i.ageDays}d</td>
                <td>{i.leadTime}d</td>
                <td>{i.statusOk ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-vfes-dark" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Lead-time trend (days · 12mo)')}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={leadTimeTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="cpe" stroke={RED} strokeWidth={2} name={tt('CPE/ONT')} />
              <Line dataKey="router" stroke={BLUE} strokeWidth={2} name={tt('Router')} />
              <Line dataKey="cards" stroke={AMBER} strokeWidth={2} name={tt('Network cards')} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Warehouse footprint')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Warehouse')}</th><th>{tt('In')}</th><th>{tt('Out')}</th><th>{tt('Util')}</th><th>{tt('Picks/day')}</th></tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.wh} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{w.wh}</td>
                  <td>{w.kpisIn.toLocaleString()}</td>
                  <td>{w.kpisOut.toLocaleString()}</td>
                  <td>{(w.util * 100).toFixed(0)}%</td>
                  <td>{w.picksPerDay.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        'Predict stock-out risk by SKU using demand-forecast model.',
        'List slow-moving stock > 90 days — write-off candidates.',
        'Forecast CPE need for fibre rollout 2026 H2.',
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- VENDOR 360
function Vendor360Tab({ code, setCode }: { code: string; setCode: (c: string) => void }) {
  const det = useMemo(() => buildVendorDetails(code), [code])
  const v = det.vendor
  const flagSeverityColor: Record<string, string> = { info: 'bg-blue-50 text-blue-700 border-blue-200', warn: 'bg-amber-50 text-amber-700 border-amber-200', crit: 'bg-red-50 text-red-700 border-red-200' }

  return (
    <>
      <div className="bg-vfes-red/5 border-l-4 border-vfes-red rounded-r-lg px-4 py-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-vfes-dark/70">
        <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Vendor drill-down')}</span>
        <label className="flex items-center gap-1.5">Pick vendor
          <select value={code} onChange={(e) => setCode(e.target.value)} className="bg-white rounded px-1.5 py-0.5 font-semibold">
            {Array.from(new Set(vendors.map((vd) => vd.category))).map((cat) => (
              <optgroup key={cat} label={cat}>
                {vendors.filter((vd) => vd.category === cat).map((vd) => <option key={vd.code} value={vd.code}>{tt(vd.name)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="ml-auto text-[10px] text-vfes-dark/40">{tt('Click any vendor row in other tabs to drill in')}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">{tt(v.category)} · {v.subcat} · {v.country} · {v.ccy}</div>
            <div className="text-3xl font-extrabold mt-1">{tt(v.name)}</div>
            <div className="text-sm text-white/70 mt-1">Tier {v.tier} · Kraljic {v.kraljic} · Renewal {v.renewalDate} · Notice {v.noticeDays}d ({v.daysToNotice}d remaining)</div>
          </div>
          <div className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest ${v.finHealth === 'Strong' ? 'bg-emerald-500' : v.finHealth === 'Stable' ? 'bg-blue-500' : v.finHealth === 'Watch' ? 'bg-amber-500' : 'bg-vfes-red'}`}>{v.finHealth}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Annual spend')} value={`BSD ${(v.spend / 1000).toFixed(1)}M`} delta={`${v.contracts} contracts`} trend="flat" icon={Coins} accent />
        <KpiCard label={tt('OTIF')} value={`${(v.otif * 100).toFixed(0)}%`} delta={v.otif >= 0.95 ? 'on plan' : 'below SLA'} trend={v.otif >= 0.95 ? 'up' : 'down'} icon={Truck} />
        <KpiCard label={tt('Cyber / EcoVadis')} value={`${v.cyberRating} / ${v.ecovadis || '—'}`} delta="ratings" trend="flat" icon={Shield} />
        <KpiCard label={tt('Alt sources')} value={`${v.altSources}`} delta={v.altSources === 0 ? 'single-source!' : 'qualified'} trend={v.altSources === 0 ? 'down' : 'up'} icon={Layers} />
      </div>

      {det.flagsAuto.length > 0 && (
        <Panel title={`Risk flags (${det.flagsAuto.length})`}>
          <div className="grid md:grid-cols-2 gap-2">
            {det.flagsAuto.map((f, i) => (
              <div key={i} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${flagSeverityColor[f.sev]}`}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold">{f.kind} · {f.sev}</span>
                  <div>{tt(f.text)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Spend trend (BSD K · 8Q)')}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={det.spendTrend}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="q" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `BSD ${v}K`} />
              <Area dataKey="spend" stroke={RED} fill={RED} fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Price index (12mo · 100 = baseline)')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={det.pricePoints}>
              <CartesianGrid stroke="#eef0f3" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 120]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={100} stroke="#1f2937" strokeDasharray="3 3" />
              <Line dataKey="index" stroke={RED} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={tt('Scorecard')}>
        <div className="grid md:grid-cols-5 gap-3">
          {[
            { k: 'Quality', v: v.scoreQuality }, { k: 'Delivery', v: v.scoreDelivery },
            { k: 'Innovation', v: v.scoreInnovation }, { k: 'ESG', v: v.scoreEsg },
            { k: 'Risk (lower=better)', v: 100 - v.scoreRisk },
          ].map((s) => (
            <div key={s.k} className="p-3 bg-zinc-50 rounded-lg">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{s.k}</div>
              <div className="text-2xl font-extrabold mt-1">{s.v}</div>
              <div className="h-1.5 bg-zinc-200 rounded mt-1.5"><div className={`h-full rounded ${s.v >= 80 ? 'bg-emerald-500' : s.v >= 60 ? 'bg-amber-500' : 'bg-vfes-red'}`} style={{ width: `${s.v}%` }} /></div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Active contracts')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('ID')}</th><th>{tt('Type')}</th><th>{tt('End')}</th><th>{tt('BSD K')}</th><th>{tt('Auto')}</th><th>{tt('MFN')}</th><th>{tt('CPI')}</th></tr>
            </thead>
            <tbody>
              {det.contractsList.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{c.id}</td>
                  <td className="text-xs">{c.type}</td>
                  <td className="text-xs">{c.end}</td>
                  <td>BSD {c.value.toLocaleString()}</td>
                  <td>{c.auto ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : '—'}</td>
                  <td>{c.mfn ? '✓' : '—'}</td>
                  <td>{c.cpi ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Alternate sources')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Vendor')}</th><th>{tt('Readiness')}</th><th>{tt('Gap (months)')}</th></tr>
            </thead>
            <tbody>
              {det.altSources.map((a, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2 font-semibold">{tt(a.name)}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${a.readiness === 'Ready' ? 'bg-emerald-50 text-emerald-700' : a.readiness === 'Qualifying' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{a.readiness}</span></td>
                  <td>{a.gapMonths}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Open POs')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('PO')}</th><th>{tt('ETA')}</th><th>BSD </th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {det.openOrders.map((o) => (
                <tr key={o.po} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{o.po}</td>
                  <td className="text-xs">{o.eta}</td>
                  <td>BSD {o.value.toLocaleString()}</td>
                  <td className="text-xs">{tt(o.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Recent invoices')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Invoice')}</th><th>BSD </th><th>{tt('Due')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {det.invoices.map((iv) => (
                <tr key={iv.inv} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs">{iv.inv}</td>
                  <td>BSD {iv.amt.toLocaleString()}</td>
                  <td className="text-xs">{iv.due}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${iv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : iv.status === 'Disputed' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>{tt(iv.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SiPrompts prompts={[
        `Show ${tt(v.name)}'s spend trend vs contracted price.`,
        `Forecast ${tt(v.name)} renewal price under inflation scenarios.`,
        `Find alternate suppliers for ${tt(v.name)} with EcoVadis ≥ 60.`,
        `List all POs > BSD 100K with ${tt(v.name)} pending GR.`,
      ]} />
    </>
  )
}

// ----------------------------------------------------------------------------- Helpers
function Mini({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5">
      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{label}</div>
      <div className={`text-lg font-extrabold mt-0.5 ${positive ? 'text-emerald-600' : negative ? 'text-vfes-dark' : ''}`}>{value}</div>
    </div>
  )
}
function SiPrompts({ prompts }: { prompts: string[] }) {
  return (
    <Panel title={tt('Snowflake Intelligence — try a question')}>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <div key={i} className="inline-flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-vfes-red/10">
            <MessageSquare className="w-3.5 h-3.5" /> {p}
          </div>
        ))}
      </div>
    </Panel>
  )
}
