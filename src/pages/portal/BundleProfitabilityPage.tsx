// =============================================================================
// Bundle Profitability — UC3 (finance-grade rebuild)
// 7 tabs · Config object · reducer · localStorage · Assumptions drawer · presets
// =============================================================================
import { useState, useMemo, useEffect, useReducer } from 'react'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import KpiCard from '../../components/KpiCard'
import {
  Sparkles, Coins, TrendingUp, TrendingDown, Calculator, AlertTriangle, Settings, RotateCcw,
  Download, ChevronDown, ChevronUp, Grid3x3, Activity, Layers, Shield, Briefcase, BarChart3,
  Gauge, Target, Heart, Clock, Network, Tv, Smartphone, Users, FileText, Scale, Globe, Percent,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { MOBILE_BUNDLES } from './_mobile_data'
import {
  bundleCatalog, channelCacMult, channelChurnMult, geoCostMult,
  effectiveArpu, monthlyContribution, cohortCashflow, bundleNpv, bundleIrr, paybackMonths,
  tornadoSensitivity, breakEvenSurface, monteCarloNpv, percentile, fiveYearPnl,
  type BundleSKU,
} from './_bundle_math'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438'
const RED2 = '#FF2D2D'
const RED_LIGHT = '#FF8585'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const BLUE = '#3b82f6'
const GREY = '#94a3b8'

// ===========================================================================
// CONFIG
// ===========================================================================
type Config = {
  bundleCode: string
  channel: 'all' | 'direct' | 'retail' | 'b2b'
  geo: 'all' | 'familyIslands' | 'newProvidence'
  cohort: 'new' | 'backbook' | 'all'
  // Discount waterfall
  promoOverride: number | null
  promoMonths: number | null
  billCredits: number
  loyaltyDiscount: number
  cpiEscalator: number
  // Cost overrides
  ovNetwork: number | null; ovContent: number | null; ovCare: number | null
  ovCac: number | null; ovInstall: number | null; ovCpe: number | null
  cpeDepMonths: 24 | 36 | 48
  badDebtPct: number
  // Mobile leg
  mvnoWholesale: number | null
  // Cost shocks
  cogsShock: number; contentShock: number; mvnoShock: number; cacShock: number
  // Content rights
  contentEscalator: number; contentRenewalYear: number
  // Financial
  wacc: number; taxRate: number; horizon: 36 | 60 | 84 | 120; terminalMult: number
  // Cohort
  weibullK: number
  saveOffer: 'none' | 'speed' | 'discount' | 'bundle'
  refreshAtM24: boolean
  // Sensitivity
  mcDraws: 250 | 1000 | 5000; sigmaMult: number
  // Scenarios
  scenario: 'base' | 'sky_renewal' | 'comreg_cap' | 'recession' | 'comp_match'
  // Portfolio
  portfolioMix: Record<string, number>
  haloEnabled: boolean
  cannibEnabled: boolean
  // Comp/reg
  baiLevy: number; usoContrib: number; vulnerableShare: number; socialCap: number
  benchmarkSet: 'all' | 'digi' | 'btc' | 'voo'
  // Biz case
  forecastYears: 3 | 5 | 7 | 10
  hurdleRate: number
  // Layout
  assumptionsOpen: boolean
}

const defaultConfig: Config = {
  bundleCode: 'BB_MOB_1G',
  channel: 'all', geo: 'all', cohort: 'all',
  promoOverride: null, promoMonths: null, billCredits: 0, loyaltyDiscount: 0, cpiEscalator: 2.5,
  ovNetwork: null, ovContent: null, ovCare: null, ovCac: null, ovInstall: null, ovCpe: null,
  cpeDepMonths: 36, badDebtPct: 1.0, mvnoWholesale: null,
  cogsShock: 0, contentShock: 0, mvnoShock: 0, cacShock: 0,
  contentEscalator: 4, contentRenewalYear: 2026,
  wacc: 0.08, taxRate: 0.125, horizon: 60, terminalMult: 6,
  weibullK: 0.85, saveOffer: 'none', refreshAtM24: false,
  mcDraws: 1000, sigmaMult: 1.0, scenario: 'base',
  portfolioMix: { BIT: 18, BB_TV_1G: 22, BB_TV_LIGA: 10, BB_TV_HBO: 9, BB_MOB_600: 16, BB_MOB_1G: 20, MEGA: 5 },
  haloEnabled: true, cannibEnabled: true,
  baiLevy: 0.5, usoContrib: 0.3, vulnerableShare: 0.06, socialCap: 25,
  benchmarkSet: 'all',
  forecastYears: 5, hurdleRate: 0.10,
  assumptionsOpen: false,
}

const presets: Record<string, Partial<Config>> = {
  Default: {},
  'Aggressive bundle push': { promoOverride: null, billCredits: 5, loyaltyDiscount: 3, ovCac: 110, haloEnabled: true, refreshAtM24: true, scenario: 'base' },
  'Defensive margin': { billCredits: 0, loyaltyDiscount: 0, contentShock: -5, ovCac: 60, refreshAtM24: false, scenario: 'base' },
  'Content-cost stress': { contentShock: 15, contentEscalator: 6, scenario: 'sky_renewal', mcDraws: 5000, sigmaMult: 1.5 },
  'Recession scenario': { cogsShock: 4, contentShock: 5, badDebtPct: 1.8, scenario: 'recession', sigmaMult: 1.5 },
}

type Action =
  | { type: 'SET'; patch: Partial<Config> }
  | { type: 'RESET' }
  | { type: 'PRESET'; name: keyof typeof presets }
  | { type: 'SET_MIX'; code: string; pct: number }

function configReducer(state: Config, action: Action): Config {
  switch (action.type) {
    case 'SET': return { ...state, ...action.patch }
    case 'RESET': return { ...defaultConfig, bundleCode: state.bundleCode }
    case 'PRESET': return { ...state, ...presets[action.name] }
    case 'SET_MIX': return { ...state, portfolioMix: { ...state.portfolioMix, [action.code]: action.pct } }
    default: return state
  }
}

// ===========================================================================
// SUB-TABS
// ===========================================================================
type SubTab = 'cockpit' | 'catalog' | 'cohort' | 'sensitivity' | 'portfolio' | 'compreg' | 'bizcase' | 'cohortmargin'

const subTabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
  { id: 'cockpit',    label: 'Cockpit',          icon: Gauge },
  { id: 'catalog',    label: 'Bundle Catalog',   icon: Layers },
  { id: 'cohort',     label: 'Cohort Economics', icon: Heart },
  { id: 'sensitivity',label: 'Sensitivity',      icon: Activity },
  { id: 'portfolio',  label: 'Portfolio Mix',    icon: Grid3x3 },
  { id: 'compreg',    label: 'Comp & Reg',       icon: Shield },
  { id: 'bizcase',    label: 'Business Case',    icon: Briefcase },
  { id: 'cohortmargin', label: 'Cohort Margin',   icon: BarChart3 },
]

// ===========================================================================
// COMPONENT
// ===========================================================================
export default function BundleProfitabilityPage() {
  const [sub, setSub] = useState<SubTab>('cockpit')
  const [cfg, dispatch] = useReducer(configReducer, defaultConfig, (init) => {
    if (typeof window === 'undefined') return init
    try {
      const raw = localStorage.getItem('bundle-profit-config')
      if (raw) return { ...init, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return init
  })

  useEffect(() => {
    try { localStorage.setItem('bundle-profit-config', JSON.stringify(cfg)) } catch { /* ignore */ }
  }, [cfg])

  const setBundleCode = (code: string) => dispatch({ type: 'SET', patch: { bundleCode: code, promoOverride: null, ovNetwork: null, ovContent: null, ovCare: null, ovCac: null, ovInstall: null, ovCpe: null, mvnoWholesale: null } })

  const baseBundle = bundleCatalog.find((b) => b.code === cfg.bundleCode) || bundleCatalog[0]

  // Effective bundle with overrides applied
  const b: BundleSKU = useMemo(() => ({
    ...baseBundle,
    promo: cfg.promoOverride ?? baseBundle.promo,
    promoMonths: cfg.promoMonths ?? baseBundle.promoMonths,
    network: cfg.ovNetwork ?? baseBundle.network,
    contentLinear: cfg.ovContent != null ? cfg.ovContent * (baseBundle.contentLinear / Math.max(1, baseBundle.contentLinear + baseBundle.contentSvod)) : baseBundle.contentLinear,
    contentSvod: cfg.ovContent != null ? cfg.ovContent * (baseBundle.contentSvod / Math.max(1, baseBundle.contentLinear + baseBundle.contentSvod)) : baseBundle.contentSvod,
    care: cfg.ovCare ?? baseBundle.care,
    cac: cfg.ovCac ?? baseBundle.cac,
    install: cfg.ovInstall ?? baseBundle.install,
    cpe: cfg.ovCpe ?? baseBundle.cpe,
    cpeDepMonths: cfg.cpeDepMonths,
    mvno: cfg.mvnoWholesale ?? baseBundle.mvno,
    badDebtPct: cfg.badDebtPct,
    haloChurnReductionPp: cfg.haloEnabled ? baseBundle.haloChurnReductionPp : 0,
  }), [baseBundle, cfg])

  const channelMult = channelCacMult[cfg.channel]
  const geoMult = geoCostMult[cfg.geo]

  // Build cashflow once, reuse
  const cashflowCfg = useMemo(() => ({
    horizon: cfg.horizon, wacc: cfg.wacc, channelMult, geoMult,
    promoOverride: cfg.promoOverride ?? undefined,
    billCredits: cfg.billCredits, loyaltyDiscount: cfg.loyaltyDiscount, cpiEscalator: cfg.cpiEscalator,
    cogsShock: cfg.cogsShock + (cfg.scenario === 'recession' ? 4 : 0),
    contentShock: cfg.contentShock + (cfg.scenario === 'sky_renewal' ? 15 : 0) + (cfg.scenario === 'comp_match' ? -5 : 0),
    mvnoShock: cfg.mvnoShock,
    weibullK: cfg.weibullK,
    saveOfferPp: cfg.saveOffer === 'discount' ? 0.3 : cfg.saveOffer === 'speed' ? 0.2 : cfg.saveOffer === 'bundle' ? 0.5 : 0,
    refreshAtM24: cfg.refreshAtM24,
    cacOverride: cfg.ovCac ?? undefined,
    cpeOverride: cfg.ovCpe ?? undefined,
    cpeDepOverride: cfg.cpeDepMonths,
  }), [cfg, channelMult, geoMult])

  const engine = useMemo(() => {
    const rows = cohortCashflow(b, cashflowCfg)
    const npv = bundleNpv(rows, cfg.terminalMult, cfg.wacc)
    const irr = bundleIrr(rows)
    const payback = paybackMonths(rows)
    const arpu = effectiveArpu(b, cfg.promoOverride ?? undefined, cfg.billCredits, cfg.loyaltyDiscount, cfg.cpiEscalator)
    const monthlyMargin = monthlyContribution(b, arpu, channelMult, geoMult, cashflowCfg.cogsShock, cashflowCfg.contentShock, cfg.mvnoShock)
    const annualMargin = monthlyMargin * 12 - (b.cac * channelMult + b.install)
    const ltv = rows.reduce((a, r) => a + r.pvCash, 0)
    const ltvCac = ltv / Math.max(1, b.cac * channelMult + b.install)
    const tornado = tornadoSensitivity(b, cashflowCfg, cfg.terminalMult, cfg.wacc)
    const surface = breakEvenSurface(b, cashflowCfg, cfg.terminalMult, cfg.wacc)
    const mc = monteCarloNpv(b, cashflowCfg, cfg.terminalMult, cfg.wacc, cfg.mcDraws, cfg.sigmaMult)
    const pnl = fiveYearPnl(b, cashflowCfg, cfg.forecastYears, 50000, cfg.taxRate)
    return { rows, npv, irr, payback, arpu, monthlyMargin, annualMargin, ltv, ltvCac, tornado, surface, mc, pnl }
  }, [b, cashflowCfg, cfg.terminalMult, cfg.wacc, cfg.promoOverride, cfg.billCredits, cfg.loyaltyDiscount, cfg.cpiEscalator, cfg.mcDraws, cfg.sigmaMult, cfg.forecastYears, cfg.taxRate, channelMult, geoMult, cfg.mvnoShock])

  const upfrontTotal = (b.cac * channelMult + b.install + b.cpe)
  const goNoGo = engine.npv > 0 && engine.irr > cfg.hurdleRate ? 'GO' : 'NO-GO'

  // ─── HEADER + GLOBAL CONTROLS + TOOLBAR + ASSUMPTIONS DRAWER ─────────────
  return (
    <div className="p-8">
      <PageHeader
        title={tt('Bundle Profitability')}
        subtitle={tt('Cohort cash-flow · NPV/IRR · sensitivity · 5-yr business case · URCA-aware')}
        actions={<div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5" />{tt('Use Case 3')}</div>}
      />

      <AgentDecision
        title="Rank bundles by NPV per gross-add"
        label="Run Bundle Optimiser" runningLabel="Modelling…"
        steps={[
          'Built 60-month cohort cash-flow per bundle',
          'Computed NPV/IRR & payback per gross-add',
          'Ranked bundles; flagged negative-NPV promos',
          'Recommended push / fix / retire actions',
        ]}
        hint="True-margin NPV — not list ARPU — decides which bundles to push."
        result={{
          headline: 'Push the convergent bundle; retire the MEGADEAL promo',
          stats: [
            { label: 'Realised ARPU', value: 'BSD 65' },
            { label: 'CAC payback', value: '14m' },
            { label: 'LTV / CAC', value: '3.8×' },
            { label: 'IRR', value: '18.2%' },
          ],
          findings: [
            'Convergent leads NPV-per-gross-add while the deep-discount MEGADEAL trains Day-90 churn and runs negative-NPV.',
            'Reallocating acquisition spend to convergent bundles compounds margin over the cohort lifecycle.',
            'Flag and retire negative-NPV promos — replace with CLV-sized retention offers on the back-book.',
          ],
          note: 'True-margin NPV per gross-add is the ranking criterion — not list ARPU.',
        }}
        impact="+NPV/gross-add · lower discount-trained churn"
        risk="retiring a hero promo can dent gross-add volume"
        linkTo="#/portal/bundle-propensity" linkLabel="Open Bundle Propensity"
      />

      {/* ── Related cockpits ── */}
      <div className="flex flex-wrap gap-2 my-4 px-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 self-center">{tt('Related')}</span>
        <Link to="/portal/pricing-simulator" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Pricing Simulator')}</Link>
        <Link to="/portal/bundle-propensity" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Bundle Propensity')}</Link>
        <Link to="/portal/product" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Product')}</Link>
        <Link to="/portal/finance" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Finance')}</Link>
        <Link to="/portal/sales" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Sales')}</Link>
        <Link to="/portal/marketing" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Marketing')}</Link>
        <Link to="/portal/churn-retention" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Churn & Retention')}</Link>
        <Link to="/portal/channel-dealers" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Channel & Dealers')}</Link>
        <Link to="/portal/mvno-wholesale" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('MVNO & Wholesale')}</Link>
        <Link to="/portal/b2b" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('B2B')}</Link>
        <Link to="/portal/promotions" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Promotions')}</Link>
      </div>
      <MlInsightSection
        heading={tt('Bundle ML')}
        models={[
          { name: tt('NPV Predictor'), metric: '\u20ac342', sub: tt('LightGBM · 60-mo horizon') },
          { name: tt('Bundle Propensity'), metric: '38%', sub: tt('XGBoost classifier') },
          { name: tt('Churn Survival'), metric: 'k=0.85', sub: tt('Weibull · Snowflake ML') },
        ]}
        agentLabel={tt('Run Bundle ML Agent')}
        agentSteps={[
          'Loaded bundle cashflow panel from BUNDLE_CASHFLOW table',
          'Computed per-bundle NPV per gross-add with cohort regression',
          'Scored bundle propensity for each HH via XGBoost',
          'Ranked bundles by NPV-per-gross-add with churn constraints',
        ]}
        agentBlurb={tt('3 Snowpark ML models trained on 1.04M HH panel. Refreshed daily 03:00 UTC.')}
        decision={{
          title: tt('Push convergent bundle · retire MEGADEAL promo'),
          detail: tt('Convergent leads NPV-per-gross-add. MEGADEAL runs negative-NPV and trains Day-90 churn.'),
          impact: tt('+NPV/gross-add · lower discount-trained churn'),
          risk: tt('Retiring hero promo may dent gross-add volume short-term.'),
          linkTo: '/portal/bundle-propensity',
          linkLabel: tt('Open Bundle Propensity'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Bundle NPV per gross-add · ranking'),
          data: [
            { code: 'MEGA', npv: -120 },
            { code: 'BIT', npv: 180 },
            { code: 'BB_TV_1G', npv: 280 },
            { code: 'BB_MOB_1G', npv: 340 },
            { code: 'BB_TV_LIGA', npv: 210 },
          ],
          xKey: 'code',
          series: [{ key: 'npv', name: tt('NPV \u20ac'), color: '#10b981' }],
          note: tt('MEGADEAL is the only negative-NPV bundle. Retire or re-price.'),
          colorBy: { key: 'npv', high: 300, mid: 150 },
        }}
      />

      {/* Global controls */}
      <Panel>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Bundle')}</div>
            <select value={cfg.bundleCode} onChange={(e) => setBundleCode(e.target.value)}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-3 text-sm font-semibold focus:outline-none focus:bg-white focus:border-vfes-red/40">
              {['BB+TV', 'BB+Mobile', 'Mega', 'Baseline'].map((cat) => (
                <optgroup key={cat} label={cat}>
                  {bundleCatalog.filter((x) => x.category === cat).map((x) => <option key={x.code} value={x.code}>{tt(x.name)} · BSD {x.list}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Channel')}</div>
            <select value={cfg.channel} onChange={(e) => dispatch({ type: 'SET', patch: { channel: e.target.value as Config['channel'] } })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-3 text-sm font-semibold">
              <option value="all">{tt('All channels')}</option>
              <option value="direct">{tt('Direct (CAC ×0.85)')}</option>
              <option value="retail">{tt('Retail partner (CAC ×1.20)')}</option>
              <option value="b2b">{tt('B2B partner (CAC ×0.95)')}</option>
            </select>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Geography')}</div>
            <select value={cfg.geo} onChange={(e) => dispatch({ type: 'SET', patch: { geo: e.target.value as Config['geo'] } })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-3 text-sm font-semibold">
              <option value="all">{tt('All The Bahamas')}</option>
              <option value="familyIslands">{tt('Family Islands')}</option>
              <option value="newProvidence">{tt('Out Islands (cost +5%)')}</option>
            </select>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Cohort')}</div>
            <select value={cfg.cohort} onChange={(e) => dispatch({ type: 'SET', patch: { cohort: e.target.value as Config['cohort'] } })}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-3 text-sm font-semibold">
              <option value="all">{tt('All vintages')}</option>
              <option value="new">{tt('New (M1-M12)')}</option>
              <option value="backbook">{tt('Back-book (24m+)')}</option>
            </select>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-black/5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mr-1">{tt('Preset')}</span>
          <select value="" onChange={(e) => { if (e.target.value) dispatch({ type: 'PRESET', name: e.target.value as keyof typeof presets }) }}
            className="bg-[#f3f4f7] border border-transparent rounded px-2 py-1.5 text-xs font-semibold">
            <option value="">{tt('— pick —')}</option>
            {Object.keys(presets).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={() => dispatch({ type: 'SET', patch: { assumptionsOpen: !cfg.assumptionsOpen } })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-vfes-red/5 text-vfes-dark hover:bg-vfes-red/10">
            <Settings className="w-3.5 h-3.5" /> Assumptions {cfg.assumptionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => dispatch({ type: 'RESET' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-black/5 text-vfes-dark/70 hover:bg-black/10">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={() => {
            const blob = new Blob([JSON.stringify({ cfg, npv: engine.npv, irr: engine.irr, payback: engine.payback, ltv: engine.ltv, ltvCac: engine.ltvCac }, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `bundle-business-case-${cfg.bundleCode}.json`; a.click()
            URL.revokeObjectURL(url)
          }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-black/5 text-vfes-dark/70 hover:bg-black/10">
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button onClick={() => {
            const headers = ['month', 'S', 'arpu', 'cpe', 'contribution', 'cumCash', 'pvCash']
            const csv = [headers.join(','), ...engine.rows.map((r) => headers.map((h) => (r as any)[h]?.toFixed?.(2) ?? r[h as keyof typeof r]).join(','))].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `bundle-cashflow-${cfg.bundleCode}.csv`; a.click()
            URL.revokeObjectURL(url)
          }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-black/5 text-vfes-dark/70 hover:bg-black/10">
            <FileText className="w-3.5 h-3.5" /> Export CSV
          </button>
          <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest ${goNoGo === 'GO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <Target className="w-3.5 h-3.5" /> {goNoGo} · NPV BSD {(engine.npv).toFixed(0)} · IRR {(engine.irr * 100).toFixed(1)}% · Hurdle {(cfg.hurdleRate * 100).toFixed(0)}%
          </span>
        </div>

        {/* Assumptions drawer */}
        {cfg.assumptionsOpen && (
          <div className="mt-4 pt-4 border-t border-black/5 grid md:grid-cols-5 gap-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Tariff & discount')}</div>
              {[
                { k: 'promoOverride' as const, lbl: 'Promo BSD /mo', def: baseBundle.promo },
                { k: 'promoMonths' as const, lbl: 'Promo months', def: baseBundle.promoMonths },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" value={cfg[f.k] ?? f.def} onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: e.target.value === '' ? null : Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
              {[
                { k: 'billCredits' as const, lbl: 'Bill credits BSD ' },
                { k: 'loyaltyDiscount' as const, lbl: 'Loyalty disc BSD ' },
                { k: 'cpiEscalator' as const, lbl: 'CPI escalator %' },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" step="0.5" value={cfg[f.k]} onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Cost rate-card')}</div>
              {[
                { k: 'ovNetwork' as const, lbl: 'Network BSD /mo', def: baseBundle.network },
                { k: 'ovContent' as const, lbl: 'Content BSD /mo', def: baseBundle.contentLinear + baseBundle.contentSvod },
                { k: 'ovCare' as const, lbl: 'Care BSD /mo', def: baseBundle.care },
                { k: 'mvnoWholesale' as const, lbl: 'MVNO BSD /mo', def: baseBundle.mvno },
                { k: 'ovCac' as const, lbl: 'CAC BSD ', def: baseBundle.cac },
                { k: 'ovInstall' as const, lbl: 'Install BSD ', def: baseBundle.install },
                { k: 'ovCpe' as const, lbl: 'CPE BSD ', def: baseBundle.cpe },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" step="0.5" value={cfg[f.k] ?? f.def} onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: e.target.value === '' ? null : Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Shocks & scenarios')}</div>
              {[
                { k: 'cogsShock' as const, lbl: 'COGS shock %' },
                { k: 'contentShock' as const, lbl: 'Content shock %' },
                { k: 'mvnoShock' as const, lbl: 'MVNO shock %' },
                { k: 'cacShock' as const, lbl: 'CAC shock %' },
                { k: 'badDebtPct' as const, lbl: 'Bad debt %' },
                { k: 'contentEscalator' as const, lbl: 'Content esc %/yr' },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" step="0.5" value={cfg[f.k]} onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Scenario')}</span>
                <select value={cfg.scenario} onChange={(e) => dispatch({ type: 'SET', patch: { scenario: e.target.value as Config['scenario'] } })}
                  className="bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold text-[10px]">
                  <option value="base">{tt('Base')}</option><option value="sky_renewal">{tt('Benchmark B +15%')}</option><option value="comreg_cap">{tt('URCA cap')}</option><option value="recession">{tt('Recession')}</option><option value="comp_match">{tt('Comp match')}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Financial')}</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('WACC %')}</span>
                <input type="number" step="0.5" value={(cfg.wacc * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET', patch: { wacc: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Hurdle %')}</span>
                <input type="number" step="0.5" value={(cfg.hurdleRate * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET', patch: { hurdleRate: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Tax %')}</span>
                <input type="number" step="0.5" value={(cfg.taxRate * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET', patch: { taxRate: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Term ×EBITDA')}</span>
                <input type="number" step="0.5" value={cfg.terminalMult} onChange={(e) => dispatch({ type: 'SET', patch: { terminalMult: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Horizon mo')}</span>
                <select value={cfg.horizon} onChange={(e) => dispatch({ type: 'SET', patch: { horizon: Number(e.target.value) as Config['horizon'] } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold">
                  <option value={36}>36</option><option value={60}>60</option><option value={84}>84</option><option value={120}>120</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('CPE dep mo')}</span>
                <select value={cfg.cpeDepMonths} onChange={(e) => dispatch({ type: 'SET', patch: { cpeDepMonths: Number(e.target.value) as Config['cpeDepMonths'] } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold">
                  <option value={24}>24</option><option value={36}>36</option><option value={48}>48</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Forecast yrs')}</span>
                <select value={cfg.forecastYears} onChange={(e) => dispatch({ type: 'SET', patch: { forecastYears: Number(e.target.value) as Config['forecastYears'] } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold">
                  <option value={3}>3</option><option value={5}>5</option><option value={7}>7</option><option value={10}>10</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Cohort & reg')}</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Weibull k')}</span>
                <input type="number" step="0.05" value={cfg.weibullK} onChange={(e) => dispatch({ type: 'SET', patch: { weibullK: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Save offer')}</span>
                <select value={cfg.saveOffer} onChange={(e) => dispatch({ type: 'SET', patch: { saveOffer: e.target.value as Config['saveOffer'] } })}
                  className="bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold text-[10px]">
                  <option value="none">{tt('None')}</option><option value="discount">{tt('Discount')}</option><option value="speed">{tt('Speed')}</option><option value="bundle">{tt('Bundle')}</option>
                </select>
              </div>
              <label className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('CPE refresh @ M24')}</span>
                <input type="checkbox" checked={cfg.refreshAtM24} onChange={(e) => dispatch({ type: 'SET', patch: { refreshAtM24: e.target.checked } })} />
              </label>
              <label className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Halo credit on')}</span>
                <input type="checkbox" checked={cfg.haloEnabled} onChange={(e) => dispatch({ type: 'SET', patch: { haloEnabled: e.target.checked } })} />
              </label>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('BAI levy %')}</span>
                <input type="number" step="0.1" value={cfg.baiLevy} onChange={(e) => dispatch({ type: 'SET', patch: { baiLevy: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('USO contrib %')}</span>
                <input type="number" step="0.1" value={cfg.usoContrib} onChange={(e) => dispatch({ type: 'SET', patch: { usoContrib: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Vuln share %')}</span>
                <input type="number" step="0.5" value={(cfg.vulnerableShare * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET', patch: { vulnerableShare: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
            </div>
          </div>
        )}
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
        {sub === 'cockpit' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Cockpit knobs')}</span>
          <label className="flex items-center gap-1.5">σ mult
            <select value={cfg.sigmaMult} onChange={(e) => dispatch({ type: 'SET', patch: { sigmaMult: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">MC draws
            <select value={cfg.mcDraws} onChange={(e) => dispatch({ type: 'SET', patch: { mcDraws: Number(e.target.value) as Config['mcDraws'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={250}>250</option><option value={1000}>1,000</option><option value={5000}>5,000</option>
            </select>
          </label>
        </>)}
        {sub === 'cohort' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Cohort knobs')}</span>
          <label className="flex items-center gap-1.5">Horizon mo
            <select value={cfg.horizon} onChange={(e) => dispatch({ type: 'SET', patch: { horizon: Number(e.target.value) as Config['horizon'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={36}>36</option><option value={60}>60</option><option value={84}>84</option><option value={120}>120</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Save offer
            <select value={cfg.saveOffer} onChange={(e) => dispatch({ type: 'SET', patch: { saveOffer: e.target.value as Config['saveOffer'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="none">{tt('None')}</option><option value="discount">{tt('Discount')}</option><option value="speed">{tt('Speed')}</option><option value="bundle">{tt('Bundle')}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={cfg.refreshAtM24} onChange={(e) => dispatch({ type: 'SET', patch: { refreshAtM24: e.target.checked } })} />{tt('Refresh @ M24')}</label>
        </>)}
        {sub === 'sensitivity' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Sensitivity knobs')}</span>
          <label className="flex items-center gap-1.5">Scenario
            <select value={cfg.scenario} onChange={(e) => dispatch({ type: 'SET', patch: { scenario: e.target.value as Config['scenario'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="base">{tt('Base')}</option><option value="sky_renewal">{tt('Benchmark B renewal +15%')}</option><option value="comreg_cap">{tt('URCA cap')}</option><option value="recession">{tt('Recession')}</option><option value="comp_match">{tt('Comp match')}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">σ mult
            <select value={cfg.sigmaMult} onChange={(e) => dispatch({ type: 'SET', patch: { sigmaMult: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">MC draws
            <select value={cfg.mcDraws} onChange={(e) => dispatch({ type: 'SET', patch: { mcDraws: Number(e.target.value) as Config['mcDraws'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={250}>250</option><option value={1000}>1,000</option><option value={5000}>5,000</option>
            </select>
          </label>
        </>)}
        {sub === 'portfolio' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Portfolio knobs')}</span>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={cfg.haloEnabled} onChange={(e) => dispatch({ type: 'SET', patch: { haloEnabled: e.target.checked } })} />{tt('Halo credit')}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={cfg.cannibEnabled} onChange={(e) => dispatch({ type: 'SET', patch: { cannibEnabled: e.target.checked } })} />{tt('Cannibalisation')}</label>
        </>)}
        {sub === 'compreg' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Comp/reg knobs')}</span>
          <label className="flex items-center gap-1.5">Benchmark
            <select value={cfg.benchmarkSet} onChange={(e) => dispatch({ type: 'SET', patch: { benchmarkSet: e.target.value as Config['benchmarkSet'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="all">{tt('All')}</option><option value="digi">{tt('Benchmark B only')}</option><option value="btc">{tt('BTC only')}</option><option value="voo">{tt('Benchmark C')}</option>
            </select>
          </label>
        </>)}
        {sub === 'bizcase' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Business case knobs')}</span>
          <label className="flex items-center gap-1.5">Forecast yrs
            <select value={cfg.forecastYears} onChange={(e) => dispatch({ type: 'SET', patch: { forecastYears: Number(e.target.value) as Config['forecastYears'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={3}>3</option><option value={5}>5</option><option value={7}>7</option><option value={10}>10</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Hurdle %
            <input type="number" step="0.5" value={(cfg.hurdleRate * 100).toFixed(1)} onChange={(e) => dispatch({ type: 'SET', patch: { hurdleRate: Number(e.target.value) / 100 } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Term ×EBITDA
            <input type="number" step="0.5" value={cfg.terminalMult} onChange={(e) => dispatch({ type: 'SET', patch: { terminalMult: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
        </>)}
        {sub === 'catalog' && <span className="text-vfes-dark/55 italic">{tt('Click any row to load that bundle into the cockpit.')}</span>}
        {sub === 'cohortmargin' && <span className="text-vfes-dark/55 italic">{tt('Cohort Margin — monthly contribution evolution and bundle margin ladder.')}</span>}
      </div>

      {/* ─── TAB CONTENT ──────────────────────────────────────────────── */}
      {sub === 'cockpit' && <CockpitTab b={b} engine={engine} cfg={cfg} upfrontTotal={upfrontTotal} />}
      {sub === 'catalog' && <CatalogTab cfg={cfg} cashflowCfg={cashflowCfg} setBundleCode={setBundleCode} />}
      {sub === 'cohort' && <CohortTab b={b} engine={engine} cfg={cfg} cashflowCfg={cashflowCfg} />}
      {sub === 'sensitivity' && <SensitivityTab b={b} engine={engine} cfg={cfg} />}
      {sub === 'portfolio' && <PortfolioTab cfg={cfg} cashflowCfg={cashflowCfg} dispatch={dispatch} />}
      {sub === 'compreg' && <CompRegTab cfg={cfg} b={b} engine={engine} />}
      {sub === 'bizcase' && <BizCaseTab b={b} cfg={cfg} engine={engine} goNoGo={goNoGo} />}
      {sub === 'cohortmargin' && <CohortMarginTab b={b} engine={engine} cfg={cfg} />}

      <div className="mt-6 text-[10px] text-vfes-dark/40 uppercase tracking-widest text-center">
        4 Snowpark ML cohort regressions · {b.code} · halo {cfg.haloEnabled ? 'on' : 'off'} · scenario {cfg.scenario} · WACC {(cfg.wacc * 100).toFixed(1)}% · model bundle-econ v2.1 · 8yr panel · 1.04M HHs
      </div>
    </div>
  )
}

// ===========================================================================
// TAB · COCKPIT
// ===========================================================================
function CockpitTab({ b, engine, cfg, upfrontTotal }: { b: BundleSKU; engine: any; cfg: Config; upfrontTotal: number }) {
  const promoBlend = effectiveArpu(b, cfg.promoOverride ?? undefined, cfg.billCredits, cfg.loyaltyDiscount, cfg.cpiEscalator)
  const waterfall = [
    { name: 'List ARPU',     val: b.list,                     color: GREEN, type: 'add' },
    { name: 'Promo amort',   val: -(b.list - promoBlend),     color: RED_LIGHT, type: 'sub' },
    { name: 'Bill credits',  val: -cfg.billCredits,           color: RED_LIGHT, type: 'sub' },
    { name: 'Loyalty disc',  val: -cfg.loyaltyDiscount,       color: RED_LIGHT, type: 'sub' },
    { name: 'Bad debt',      val: -(promoBlend * b.badDebtPct / 100), color: RED_LIGHT, type: 'sub' },
    { name: 'Network',       val: -b.network,                 color: RED2, type: 'sub' },
    { name: 'MVNO',          val: -b.mvno,                    color: RED2, type: 'sub' },
    { name: 'Content',       val: -(b.contentLinear + b.contentSvod), color: RED, type: 'sub' },
    { name: 'Care',          val: -b.care,                    color: RED, type: 'sub' },
    { name: 'CAC amort',     val: -((b.cac + b.install) / 24), color: RED, type: 'sub' },
    { name: 'CPE amort',     val: -(b.cpe / b.cpeDepMonths),  color: RED, type: 'sub' },
    { name: 'True margin',   val: engine.monthlyMargin - (b.cac + b.install) / 24 - (b.cpe / b.cpeDepMonths), color: '#0b5b88', type: 'total' },
  ]

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label={tt('Realised ARPU')} value={`BSD ${promoBlend.toFixed(0)}`} delta={`list BSD ${b.list}`} icon={Coins} accent />
        <KpiCard label={tt('True monthly margin')} value={`BSD ${engine.monthlyMargin.toFixed(0)}`} delta={`${(engine.monthlyMargin / promoBlend * 100).toFixed(0)}% margin`} trend={engine.monthlyMargin > 0 ? 'up' : 'down'} icon={TrendingUp} />
        <KpiCard label={tt('CAC payback')} value={`${engine.payback}m`} delta={`upfront BSD ${upfrontTotal.toFixed(0)}`} trend={engine.payback < 18 ? 'up' : 'down'} icon={Clock} />
        <KpiCard label={tt('LTV / CAC')} value={`${engine.ltvCac.toFixed(2)}×`} delta={engine.ltvCac > 3 ? 'Healthy' : engine.ltvCac > 1 ? 'Marginal' : 'Dilutive'} trend={engine.ltvCac > 3 ? 'up' : 'down'} icon={Heart} />
        <KpiCard label={`NPV @ WACC ${(cfg.wacc * 100).toFixed(0)}%`} value={`BSD ${engine.npv.toFixed(0)}`} delta={`${cfg.horizon}mo + terminal`} trend={engine.npv > 0 ? 'up' : 'down'} icon={Calculator} accent />
        <KpiCard label={tt('IRR')} value={`${(engine.irr * 100).toFixed(1)}%`} delta={`hurdle ${(cfg.hurdleRate * 100).toFixed(0)}%`} trend={engine.irr > cfg.hurdleRate ? 'up' : 'down'} icon={Activity} />
      </div>

      {/* Convergent + Mobile-attach bundles */}
      <Panel title={tt('Convergent + Mobile-attach bundles — ARPU · LTV · ML margin')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Convergent leads margin + LTV')}</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Bundle')}</th><th>{tt('Active base')}</th><th>{tt('ARPU')}</th><th>{tt('Annual churn')}</th><th>{tt('LTV')}</th><th>{tt('ML margin')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_BUNDLES.map((b) => (
              <tr key={b.bundle} className="border-t border-black/5">
                <td className="py-2 font-semibold">{tt(b.bundle)}</td>
                <td className="font-mono text-xs">{(b.base / 1000).toFixed(0)}K</td>
                <td className="font-mono text-xs font-bold">BSD {b.arpu.toFixed(2)}</td>
                <td className="font-mono text-xs">{b.churnAnnual.toFixed(1)}%</td>
                <td className="font-mono text-xs">BSD {b.ltv.toLocaleString()}</td>
                <td className={`font-mono text-xs font-bold ${b.mlMargin >= 39 ? 'text-emerald-600' : b.mlMargin >= 32 ? 'text-vfes-dark' : 'text-amber-600'}`}>{b.mlMargin}%</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${b.status === 'flagship' ? 'bg-vfes-red/10 text-vfes-dark' : b.status === 'core' ? 'bg-blue-50 text-blue-700' : b.status === 'growth' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(b.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('Convergent FTTH 1G + Mobile XL is the flagship: 4.8% annual churn vs Mobile-only 18.6%, 42% ML margin, BSD 3,260 LTV — nearly 4× standalone mobile.')}</div>
      </Panel>

      {engine.npv < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-bold text-red-900">{tt('NPV negative:')}</span>
            <span className="text-red-800"> {tt(b.name)} destroys BSD {Math.abs(engine.npv).toFixed(0)} per gross-add at current assumptions. Tighten content costs, reduce CAC, or raise tariff before launch.</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Panel title={tt('P&L bridge — list ARPU → true margin (BSD /sub/mo)')}>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={waterfall} layout="vertical">
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#999" fontSize={11} width={110} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(2)}`, '']} />
                  <ReferenceLine x={0} stroke="#666" />
                  <Bar dataKey="val" radius={[0, 6, 6, 0]}>
                    {waterfall.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title={tt('Cumulative cash · M0 → M60')}>
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={engine.rows.map((r: any) => ({ month: r.month, cum: r.cumCash }))}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v.toFixed(0)}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <ReferenceLine y={0} stroke="#666" />
                <ReferenceLine x={engine.payback < 999 ? engine.payback : null} stroke={GREEN} strokeDasharray="4 4" label={{ value: `Payback M${engine.payback}`, fontSize: 10, fill: GREEN }} />
                <Area type="monotone" dataKey="cum" stroke={RED} fill={RED} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">Upfront −BSD {upfrontTotal.toFixed(0)} (CAC + install + CPE) · breakeven at month {engine.payback}.</div>
        </Panel>
      </div>

      <Panel title={tt('Snowflake Intelligence — Ask the data')}>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {[
            `What's the 5-yr NPV of ${tt(b.name)} at ${(cfg.hurdleRate * 100).toFixed(0)}% hurdle, including content renewal in ${cfg.contentRenewalYear}?`,
            `Which channel produces the highest LTV/CAC for ${tt(b.name)}?`,
            `At what discount depth does ${tt(b.name)} break NPV-negative under Sports add-on · Sports package +15% renewal?`,
            `How many months until ${tt(b.name)} cash-positive net of CPE refresh at M24?`,
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
// TAB · CATALOG
// ===========================================================================
function CatalogTab({ cfg, cashflowCfg, setBundleCode }: { cfg: Config; cashflowCfg: any; setBundleCode: (c: string) => void }) {
  const rows = bundleCatalog.map((sku) => {
    const arpu = effectiveArpu(sku, undefined, cfg.billCredits, cfg.loyaltyDiscount, cfg.cpiEscalator)
    const monthly = monthlyContribution(sku, arpu, channelCacMult[cfg.channel], geoCostMult[cfg.geo], cashflowCfg.cogsShock, cashflowCfg.contentShock, cfg.mvnoShock)
    const cf = cohortCashflow(sku, cashflowCfg)
    const npv = bundleNpv(cf, cfg.terminalMult, cfg.wacc)
    const pb = paybackMonths(cf)
    const ltv = cf.reduce((a, r) => a + r.pvCash, 0)
    const ltvCac = ltv / Math.max(1, sku.cac + sku.install)
    return { sku, arpu, monthly, npv, pb, ltvCac }
  })

  return (
    <>
      <Panel title={tt('Bundle rate-card — true margin & NPV @ current assumptions')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-2">{tt('Bundle')}</th>
                <th>{tt('Cat')}</th>
                <th>{tt('List')}</th>
                <th>{tt('Promo')}</th>
                <th>{tt('Realised')}</th>
                <th>{tt('Network')}</th>
                <th>{tt('MVNO')}</th>
                <th>{tt('Content')}</th>
                <th>{tt('Care')}</th>
                <th>{tt('CAC')}</th>
                <th>{tt('CPE')}</th>
                <th>{tt('Margin BSD /mo')}</th>
                <th>{tt('Payback')}</th>
                <th>{tt('LTV/CAC')}</th>
                <th>{tt('NPV BSD ')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sku, arpu, monthly, npv, pb, ltvCac }) => (
                <tr key={sku.code} onClick={() => setBundleCode(sku.code)}
                  className={`border-t border-black/5 cursor-pointer hover:bg-[#fafbfc] ${sku.code === cfg.bundleCode ? 'bg-vfes-red/5' : ''}`}>
                  <td className="py-2.5 font-semibold">{tt(sku.name)}</td>
                  <td className="text-xs text-vfes-dark/60">{tt(sku.category)}</td>
                  <td>BSD {sku.list}</td>
                  <td>BSD {sku.promo}</td>
                  <td className="font-bold">BSD {arpu.toFixed(0)}</td>
                  <td className="text-red-600">BSD {sku.network}</td>
                  <td className="text-red-600">BSD {sku.mvno}</td>
                  <td className="text-red-600">BSD {sku.contentLinear + sku.contentSvod}</td>
                  <td className="text-red-600">BSD {sku.care}</td>
                  <td>BSD {sku.cac}</td>
                  <td>BSD {sku.cpe}</td>
                  <td className={`font-bold ${monthly > 30 ? 'text-emerald-600' : monthly > 0 ? 'text-amber-700' : 'text-red-600'}`}>BSD {monthly.toFixed(0)}</td>
                  <td className={`font-semibold ${pb < 18 ? 'text-emerald-600' : pb < 30 ? 'text-amber-700' : 'text-red-600'}`}>{pb}m</td>
                  <td className={`font-semibold ${ltvCac > 3 ? 'text-emerald-600' : ltvCac > 1 ? 'text-amber-700' : 'text-red-600'}`}>{ltvCac.toFixed(2)}×</td>
                  <td className={`font-bold ${npv > 200 ? 'text-emerald-600' : npv > 0 ? 'text-amber-700' : 'text-red-600'}`}>BSD {npv.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('NPV ranking (BSD  per gross-add)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={[...rows].sort((a, b) => b.npv - a.npv)} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} />
                <YAxis type="category" dataKey="sku.code" stroke="#999" fontSize={11} width={110} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <ReferenceLine x={0} stroke="#666" />
                <Bar dataKey="npv" radius={[0, 6, 6, 0]}>
                  {rows.map((r, i) => <Cell key={i} fill={r.npv > 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={tt('LTV/CAC quadrant — payback (x) vs LTV/CAC (y)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="pb" name={tt('Payback')} unit="m" stroke="#999" fontSize={11} />
                <YAxis type="number" dataKey="ltvCac" name={tt('LTV/CAC')} stroke="#999" fontSize={11} />
                <ZAxis type="number" range={[60, 400]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, n: any) => [n === 'pb' ? `${v}m` : `${Number(v).toFixed(2)}×`, n]} />
                <ReferenceLine x={18} stroke={AMBER} strokeDasharray="4 4" />
                <ReferenceLine y={3} stroke={GREEN} strokeDasharray="4 4" />
                <Scatter data={rows.map((r) => ({ ...r, code: r.sku.code }))} fill={RED}>
                  {rows.map((r, i) => <Cell key={i} fill={r.ltvCac > 3 && r.pb < 18 ? GREEN : r.ltvCac > 1 ? AMBER : RED} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Upper-left quadrant (fast payback + LTV/CAC ≥ 3×) is healthy.')}</div>
        </Panel>
      </div>
    </>
  )
}

// ===========================================================================
// TAB · COHORT
// ===========================================================================
function CohortTab({ b, engine, cfg, cashflowCfg }: { b: BundleSKU; engine: any; cfg: Config; cashflowCfg: any }) {
  // Three vintages: simulate 2022 / 2023 / 2024 cohort by adjusting churn
  const vintages = [
    { name: '2022 vintage', churnAdj: -0.1, color: BLUE },
    { name: '2023 vintage', churnAdj: 0.0, color: RED },
    { name: '2024 vintage', churnAdj: 0.2, color: AMBER },
  ]
  const vintageData = engine.rows.map((r: any) => {
    const row: any = { month: r.month }
    vintages.forEach((v) => {
      const adjB = { ...b, baseChurnPct: b.baseChurnPct + v.churnAdj }
      const cf = cohortCashflow(adjB, cashflowCfg)
      const found = cf.find((x) => x.month === r.month)
      row[v.name] = found?.cumCash ?? 0
    })
    return row
  })

  const survivalData = engine.rows.map((r: any) => ({ month: r.month, survival: r.S * 100 }))
  const monthlyContrib = engine.rows.map((r: any) => ({ month: r.month, contribution: r.contribution, pv: r.pvCash }))

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('5-yr LTV (PV)')} value={`BSD ${engine.ltv.toFixed(0)}`} delta={`disc @ ${(cfg.wacc * 100).toFixed(0)}%`} icon={Heart} accent />
        <KpiCard label={tt('LTV / CAC')} value={`${engine.ltvCac.toFixed(2)}×`} delta={engine.ltvCac > 3 ? 'Healthy' : 'Watch'} trend={engine.ltvCac > 3 ? 'up' : 'down'} icon={TrendingUp} />
        <KpiCard label={`Survival M${cfg.horizon}`} value={`${(engine.rows[engine.rows.length - 1]?.S * 100).toFixed(0)}%`} delta={`Weibull k=${cfg.weibullK}`} icon={Activity} />
        <KpiCard label={tt('Promo-cliff impact')} value="−BSD 8/sub" delta="M7 churn spike modelled" trend="down" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Cohort vintage cumulative cash (BSD /sub, M0 → M60)')}>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={vintageData}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v.toFixed(0)}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#666" />
                {vintages.map((v) => <Line key={tt(v.name)} type="monotone" dataKey={tt(v.name)} stroke={v.color} dot={false} strokeWidth={2} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={`Kaplan-Meier survival (Weibull k=${cfg.weibullK}, halo=${b.haloChurnReductionPp.toFixed(2)}pp)`}>
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={survivalData}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Survival']} />
                <ReferenceLine x={7} stroke={AMBER} strokeDasharray="4 4" label={{ value: 'Promo cliff M7', fontSize: 10, fill: AMBER }} />
                <ReferenceLine x={24} stroke={BLUE} strokeDasharray="4 4" label={{ value: 'Contract end M24', fontSize: 10, fill: BLUE }} />
                <Area type="monotone" dataKey="survival" stroke={RED} fill={RED} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title={tt('Per-month contribution & present value (BSD /sub)')}>
        <div className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={monthlyContrib}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v.toFixed(0)}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(2)}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="contribution" name={tt('Contribution BSD ')} fill={RED2} />
              <Line type="monotone" dataKey="pv" name={tt('PV cashflow BSD ')} stroke="#0b5b88" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('PV curve flattens as discounting compounds — healthy bundles need front-loaded cash.')}</div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · SENSITIVITY
// ===========================================================================
function SensitivityTab({ b, engine, cfg }: { b: BundleSKU; engine: any; cfg: Config }) {
  const tornado = engine.tornado.map((t: any) => ({ driver: t.driver, swing: t.high - t.low, low: t.low - t.baseNpv, high: t.high - t.baseNpv }))
  const surfaceMin = Math.min(...engine.surface.map((s: any) => s.npv))
  const surfaceMax = Math.max(...engine.surface.map((s: any) => s.npv))
  const colorScale = (v: number) => {
    const t = (v - surfaceMin) / Math.max(1, surfaceMax - surfaceMin)
    const r = Math.round(225 - t * 215)
    const g = Math.round(10 + t * 195)
    const bl = Math.round(10 + t * 60)
    return `rgb(${r},${g},${bl})`
  }

  // MC histogram bins
  const mcMin = engine.mc[0]
  const mcMax = engine.mc[engine.mc.length - 1]
  const bins = 24
  const w = (mcMax - mcMin) / bins
  const hist = Array.from({ length: bins }, (_, i) => {
    const lo = mcMin + i * w
    const hi = lo + w
    const count = engine.mc.filter((v: number) => v >= lo && v < hi).length
    return { bin: lo.toFixed(0), count, mid: (lo + hi) / 2 }
  })
  const p10 = percentile(engine.mc, 10), p50 = percentile(engine.mc, 50), p90 = percentile(engine.mc, 90)

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={`MC P10 NPV (${cfg.mcDraws.toLocaleString()} draws)`} value={`BSD ${p10.toFixed(0)}`} delta="downside" trend="down" icon={TrendingDown} />
        <KpiCard label={tt('MC P50 NPV')} value={`BSD ${p50.toFixed(0)}`} delta="median" icon={Calculator} accent />
        <KpiCard label={tt('MC P90 NPV')} value={`BSD ${p90.toFixed(0)}`} delta="upside" trend="up" icon={TrendingUp} />
        <KpiCard label={tt('P(NPV > 0)')} value={`${((engine.mc.filter((v: number) => v > 0).length / engine.mc.length) * 100).toFixed(0)}%`} delta="prob of value-create" icon={Target} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('Tornado — top 8 NPV drivers (BSD  swing per gross-add)')}>
          <div className="h-96">
            <ResponsiveContainer>
              <BarChart data={tornado} layout="vertical">
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#999" fontSize={11} />
                <YAxis type="category" dataKey="driver" stroke="#999" fontSize={11} width={140} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <ReferenceLine x={0} stroke="#666" />
                <Bar dataKey="low" stackId="t" fill={RED} radius={[0, 0, 0, 0]} />
                <Bar dataKey="high" stackId="t" fill={GREEN} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Sorted by absolute NPV swing. Content cost typically dominates for BB+TV; MVNO wholesale dominates for BB+Mobile.')}</div>
        </Panel>
        <Panel title={tt('Monte Carlo NPV distribution')}>
          <div className="h-96">
            <ResponsiveContainer>
              <BarChart data={hist}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="bin" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine x={hist.findIndex((h) => h.mid >= p10).toString()} stroke={AMBER} strokeDasharray="4 4" label={{ value: 'P10', fontSize: 10 }} />
                <ReferenceLine x={hist.findIndex((h) => h.mid >= p50).toString()} stroke={GREEN} strokeDasharray="4 4" label={{ value: 'P50', fontSize: 10 }} />
                <Bar dataKey="count" fill={RED2} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title={tt('Break-even surface — discount × content cost shock (NPV BSD )')}>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-vfes-dark/55">Disc % \ Content Δ%</th>
                {[-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30].map((c) => <th key={c} className="p-2 text-right text-vfes-dark/55">{c > 0 ? '+' : ''}{c}%</th>)}
              </tr>
            </thead>
            <tbody>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((d) => (
                <tr key={d}>
                  <td className="p-2 text-left font-bold">{d}%</td>
                  {[-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30].map((c) => {
                    const cell = engine.surface.find((s: any) => s.discount === d && s.contentShock === c)
                    if (!cell) return <td key={c} className="p-2 bg-gray-100" />
                    return <td key={c} className="p-2 text-right font-semibold text-white" style={{ background: colorScale(cell.npv) }}>BSD {cell.npv.toFixed(0)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Green = NPV positive · red = destroys value. Find your tolerable discount/content combo.')}</div>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · PORTFOLIO
// ===========================================================================
function PortfolioTab({ cfg, cashflowCfg, dispatch }: { cfg: Config; cashflowCfg: any; dispatch: React.Dispatch<Action> }) {
  const totalPct = Object.values(cfg.portfolioMix).reduce((a, b) => a + b, 0)
  const portfolioRows = bundleCatalog.filter((s) => s.code !== 'BB_ONLY').map((sku) => {
    const pct = cfg.portfolioMix[sku.code] ?? 0
    const cf = cohortCashflow(sku, cashflowCfg)
    const npv = bundleNpv(cf, cfg.terminalMult, cfg.wacc)
    return { sku, pct, npv, weighted: (npv * pct) / 100 }
  })
  const portfolioNpv = portfolioRows.reduce((a, r) => a + r.weighted, 0)
  const haloCredit = cfg.haloEnabled ? portfolioRows.reduce((a, r) => a + (r.sku.haloChurnReductionPp * r.pct * r.sku.list * 12 * 0.02), 0) : 0
  const cannibCost = cfg.cannibEnabled ? portfolioRows.reduce((a, r) => a + (r.pct * r.sku.list * 0.05), 0) : 0

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Mix sum')} value={`${totalPct}%`} delta={totalPct === 100 ? 'Balanced' : 'Re-balance'} trend={totalPct === 100 ? 'up' : 'down'} icon={Target} />
        <KpiCard label={tt('Weighted portfolio NPV')} value={`BSD ${portfolioNpv.toFixed(0)}`} delta="per gross-add blended" icon={Calculator} accent />
        <KpiCard label={tt('Halo credit')} value={`BSD ${haloCredit.toFixed(0)}`} delta={cfg.haloEnabled ? 'REVConnect churn-save BSD ' : 'Disabled'} trend="up" icon={Heart} />
        <KpiCard label={tt('Cannibalisation cost')} value={`BSD ${cannibCost.toFixed(0)}`} delta={cfg.cannibEnabled ? 'BB-only erosion' : 'Disabled'} trend="down" icon={TrendingDown} />
      </div>

      <Panel title={tt('Portfolio mix · per-SKU adoption %')}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bundleCatalog.filter((s) => s.code !== 'BB_ONLY').map((sku) => {
            const pct = cfg.portfolioMix[sku.code] ?? 0
            return (
              <div key={sku.code} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                <div className="font-semibold text-xs">{sku.code}</div>
                <div className="text-[10px] text-vfes-dark/55 mb-1">{tt(sku.name)}</div>
                <input type="range" min={0} max={50} step={1} value={pct} onChange={(e) => dispatch({ type: 'SET_MIX', code: sku.code, pct: parseInt(e.target.value) })} className="w-full accent-vfes-red" />
                <div className="text-[10px] mt-1 font-bold text-vfes-dark">{pct}%</div>
              </div>
            )
          })}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('Weighted contribution to portfolio NPV (BSD )')}>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={portfolioRows.map((r) => ({ code: r.sku.code, weighted: r.weighted, npv: r.npv }))}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="code" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${v.toFixed(0)}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(0)}`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="weighted" name={tt('Weighted NPV (BSD )')} fill={RED} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={tt('Cannibalisation matrix (BB+TV → BB+Mobile substitution)')}>
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('From')}</th><th>{tt('To')}</th><th>{tt('% subs')}</th><th>{tt('ARPU Δ BSD ')}</th><th>{tt('Margin Δ BSD ')}</th></tr>
            </thead>
            <tbody>
              {[
                { from: 'BB only', to: 'BB+TV', pct: 12, arpu: 25, margin: 5 },
                { from: 'BB only', to: 'BB+Mob', pct: 18, arpu: 25, margin: 12 },
                { from: 'BB+TV', to: 'Mega', pct: 6, arpu: 40, margin: 8 },
                { from: 'BB+Mob', to: 'BB+TV+Sport', pct: 4, arpu: 30, margin: 4 },
                { from: 'BB+TV', to: 'BB+Mob (substitute)', pct: 3, arpu: 0, margin: -2 },
              ].map((r, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="py-2.5 font-semibold">{r.from}</td>
                  <td>{r.to}</td>
                  <td>{r.pct}%</td>
                  <td className="font-bold text-emerald-600">+BSD {r.arpu}</td>
                  <td className={`font-bold ${r.margin > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.margin > 0 ? '+' : ''}BSD {r.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/55 mt-2">Net of cannibalisation, bundle-up motion creates +BSD {(haloCredit - cannibCost).toFixed(0)}/yr per 1% mix shift.</div>
        </Panel>
      </div>
    </>
  )
}

// ===========================================================================
// TAB · COMP & REG
// ===========================================================================
function CompRegTab({ cfg, b, engine }: { cfg: Config; b: BundleSKU; engine: any }) {
  const benchmarks = [
    { competitor: 'Sports add-on',          slot: 'BB+TV',     speed: '1 Gb', tv: '300 ch', price: 95,  promo: 65, set: 'digi' },
    { competitor: 'Sports add-on + Sports', slot: 'BB+TV',     speed: '1 Gb', tv: '+Sports', price: 145, promo: 99, set: 'digi' },
    { competitor: 'BTC Fibre Max',       slot: 'BB+TV',     speed: '1 Gb', tv: '180 ch', price: 99,  promo: 49, set: 'btc' },
    { competitor: 'BTC Bundle Mobile',   slot: 'BB+Mobile', speed: '1 Gb', tv: '–',       price: 89,  promo: 45, set: 'btc' },
    { competitor: 'BTC Flex',  slot: 'BB+TV',     speed: '1 Gb', tv: 'Premium', price: 92,  promo: 59, set: 'btc' },
    { competitor: 'Benchmark C Box+',       slot: 'BB+Mobile', speed: '1 Gb', tv: '–',       price: 72,  promo: 42, set: 'voo' },
    { competitor: 'Cable Bahamas — selected',     slot: b.category,  speed: b.code.includes('1G') ? '1 Gb' : b.code.includes('500') ? '500 Mb' : '2 Gb', tv: b.code.includes('TV') ? 'Streaming' : '–', price: b.list, promo: b.promo, set: 'vfes' },
  ].filter((x) => cfg.benchmarkSet === 'all' || x.set === cfg.benchmarkSet || x.set === 'vfes')

  const arpuIndex = (b.list / 95) * 100
  const headroom = (engine.monthlyMargin / b.list) * 100

  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('ARPU index vs market')} value={`${arpuIndex.toFixed(0)}`} delta={arpuIndex > 100 ? 'Premium-priced' : 'Value-priced'} icon={Globe} accent />
        <KpiCard label={tt('Margin headroom')} value={`${headroom.toFixed(0)}%`} delta="of list ARPU" trend={headroom > 30 ? 'up' : 'down'} icon={Percent} />
        <KpiCard label={tt('URCA cap headroom')} value={`+${(7 - cfg.cpiEscalator).toFixed(1)}pp`} delta="vs 7% annual cap" icon={Scale} />
        <KpiCard label={tt('Vulnerable carve-out')} value={`${(cfg.vulnerableShare * 100).toFixed(1)}%`} delta={`social cap BSD ${cfg.socialCap}`} icon={Shield} />
      </div>

      <Panel title={tt('Competitor benchmark — same slot/speed/TV')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Competitor')}</th><th>{tt('Slot')}</th><th>{tt('Speed')}</th><th>{tt('TV')}</th><th>{tt('List BSD ')}</th><th>{tt('Promo BSD ')}</th><th>{tt('Δ vs Cable Bahamas')}</th></tr>
            </thead>
            <tbody>
              {benchmarks.map((c, i) => (
                <tr key={i} className={`border-t border-black/5 ${c.set === 'vfes' ? 'bg-vfes-red/5 font-bold' : ''}`}>
                  <td className="py-2.5">{c.competitor}</td>
                  <td>{c.slot}</td>
                  <td>{c.speed}</td>
                  <td>{c.tv}</td>
                  <td>BSD {c.price}</td>
                  <td>BSD {c.promo}</td>
                  <td className={c.price - b.list > 0 ? 'text-emerald-600' : c.price === b.list ? 'text-vfes-dark/50' : 'text-red-600'}>{c.set === 'vfes' ? '—' : `${c.price - b.list > 0 ? '+' : ''}BSD ${c.price - b.list}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('Regulatory levies & contributions')}>
          <div className="space-y-3">
            {[
              { name: 'Bahamian content levy (CRC)', val: cfg.baiLevy, note: '% of TV revenue' },
              { name: 'USO contribution', val: cfg.usoContrib, note: '% of telecoms revenue' },
              { name: 'EU roaming impact (mobile leg)', val: 0.4, note: 'BSD /sub margin drag' },
            ].map((l) => (
              <div key={tt(l.name)}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tt(l.name)}</span>
                  <span className="font-bold">{l.val}%</span>
                </div>
                <div className="text-[10px] text-vfes-dark/55">{l.note}</div>
                <div className="h-2 bg-[#f3f4f7] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-vfes-red" style={{ width: `${Math.min(100, l.val * 20)}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-2 border-t border-black/5 flex justify-between">
              <span className="font-bold">{tt('Total levy drag')}</span>
              <span className="font-bold text-vfes-dark">~BSD {((cfg.baiLevy + cfg.usoContrib) * b.list / 100).toFixed(2)}/sub/mo</span>
            </div>
          </div>
        </Panel>
        <Panel title={tt('URCA compliance checklist')}>
          <div className="space-y-2 text-sm">
            {[
              { ok: cfg.cpiEscalator <= 7, txt: 'CPI escalator ≤ 7% annual cap' },
              { ok: b.contractMonths <= 24, txt: 'Contract length ≤ 24 months' },
              { ok: b.promoMonths <= 12, txt: 'Promo period ≤ 12 months' },
              { ok: cfg.vulnerableShare >= 0.05, txt: 'Vulnerable customer carve-out ≥ 5%' },
              { ok: cfg.socialCap > 0, txt: 'Social tariff defined' },
              { ok: true, txt: 'Switching SLA — 1 working day' },
            ].map((c, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${c.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                <span className="font-bold">{c.ok ? '✓' : '✗'}</span>
                <span className="text-xs">{c.txt}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

// ===========================================================================
// TAB · BUSINESS CASE
// ===========================================================================
function BizCaseTab({ b, cfg, engine, goNoGo }: { b: BundleSKU; cfg: Config; engine: any; goNoGo: 'GO' | 'NO-GO' }) {
  const pnl = engine.pnl
  const totalNpv = pnl.reduce((a: number, r: any) => a + r.fcf / Math.pow(1 + cfg.wacc, r.year), 0)
  const terminal = (pnl[pnl.length - 1]?.ebitda * cfg.terminalMult) / Math.pow(1 + cfg.wacc, pnl.length)
  const npvWithTerminal = totalNpv + terminal

  return (
    <>
      <div className={`p-5 rounded-xl mb-6 ${goNoGo === 'GO' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Target className={`w-6 h-6 ${goNoGo === 'GO' ? 'text-emerald-600' : 'text-red-600'}`} />
          <span className={`text-xl font-extrabold ${goNoGo === 'GO' ? 'text-emerald-900' : 'text-red-900'}`}>{goNoGo} — {tt(b.name)}</span>
        </div>
        <div className="text-sm">
          <span className="font-bold">{cfg.forecastYears}-yr NPV:</span> BSD {npvWithTerminal.toFixed(0)} per gross-add (incl. terminal value at {cfg.terminalMult}× exit EBITDA, discounted at WACC {(cfg.wacc * 100).toFixed(1)}%) ·
          <span className="font-bold ml-2">{tt('IRR:')}</span> {(engine.irr * 100).toFixed(1)}% vs hurdle {(cfg.hurdleRate * 100).toFixed(0)}% ·
          <span className="font-bold ml-2">{tt('Payback:')}</span> M{engine.payback}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[
            `Top risk · content rights renewal ${cfg.contentRenewalYear} (escalator ${cfg.contentEscalator}%)`,
            `Top risk · MVNO wholesale increase exposure BSD ${b.mvno}/sub`,
            `Top risk · URCA cap headroom ${(7 - cfg.cpiEscalator).toFixed(1)}pp before review trigger`,
          ].map((t, i) => (
            <span key={i} className="px-2 py-1 rounded bg-white/60 border border-black/5">{t}</span>
          ))}
        </div>
      </div>

      <Panel title={`${cfg.forecastYears}-year P&L · subscriber roll-forward`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-2">{tt('Year')}</th><th>{tt('Open subs')}</th><th>{tt('Gross adds')}</th><th>{tt('Churn')}</th><th>{tt('Close subs')}</th><th>{tt('ARPU BSD ')}</th><th>{tt('Revenue BSD m')}</th><th>{tt('Content BSD m')}</th><th>{tt('Network BSD m')}</th><th>{tt('Care BSD m')}</th><th>{tt('CAC BSD m')}</th><th>{tt('Capex BSD m')}</th><th>{tt('EBITDA BSD m')}</th><th>{tt('Margin %')}</th><th>{tt('FCF BSD m')}</th></tr>
            </thead>
            <tbody>
              {pnl.map((r: any) => (
                <tr key={r.year} className="border-t border-black/5">
                  <td className="py-2.5 font-bold">Y{r.year}</td>
                  <td>{(r.openSubs / 1000).toFixed(1)}k</td>
                  <td className="text-emerald-600">+{(r.grossAdds / 1000).toFixed(1)}k</td>
                  <td className="text-red-600">−{(r.churn / 1000).toFixed(1)}k</td>
                  <td className="font-bold">{(r.closeSubs / 1000).toFixed(1)}k</td>
                  <td>BSD {r.arpu.toFixed(0)}</td>
                  <td className="font-bold">BSD {(r.revenue / 1e6).toFixed(1)}</td>
                  <td className="text-red-600">BSD {(r.contentCost / 1e6).toFixed(1)}</td>
                  <td className="text-red-600">BSD {(r.networkCost / 1e6).toFixed(1)}</td>
                  <td className="text-red-600">BSD {(r.careCost / 1e6).toFixed(1)}</td>
                  <td className="text-red-600">BSD {(r.cac / 1e6).toFixed(1)}</td>
                  <td className="text-red-600">BSD {(r.capex / 1e6).toFixed(1)}</td>
                  <td className={`font-bold ${r.ebitda > 0 ? 'text-emerald-600' : 'text-red-600'}`}>BSD {(r.ebitda / 1e6).toFixed(1)}</td>
                  <td className={`font-semibold ${r.ebitdaMargin > 30 ? 'text-emerald-600' : r.ebitdaMargin > 15 ? 'text-amber-700' : 'text-red-600'}`}>{r.ebitdaMargin.toFixed(1)}%</td>
                  <td className={`font-bold ${r.fcf > 0 ? 'text-emerald-600' : 'text-red-600'}`}>BSD {(r.fcf / 1e6).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Panel title={tt('EBITDA & FCF trajectory (BSD m)')}>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={pnl}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke="#999" fontSize={11} tickFormatter={(v) => `Y${v}`} />
                <YAxis stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${(v / 1e6).toFixed(0)}m`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${(Number(v) / 1e6).toFixed(1)}m`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#666" />
                <Bar dataKey="ebitda" name={tt('EBITDA')} fill={RED} />
                <Line type="monotone" dataKey="fcf" name={tt('FCF (post-tax post-capex)')} stroke="#0b5b88" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={tt('NPV waterfall (BSD )')}>
          <div className="space-y-2 text-sm">
            {pnl.map((r: any) => {
              const pv = r.fcf / Math.pow(1 + cfg.wacc, r.year)
              return (
                <div key={r.year} className="flex justify-between border-b border-black/5 pb-1">
                  <span>Y{r.year} FCF</span>
                  <span>BSD {(r.fcf / 1e6).toFixed(2)}m</span>
                  <span className="text-vfes-dark/55">→ PV BSD {(pv / 1e6).toFixed(2)}m</span>
                </div>
              )
            })}
            <div className="flex justify-between border-b border-black/5 pb-1 text-[#0b5b88]">
              <span>Terminal value @ {cfg.terminalMult}× EBITDA</span>
              <span>BSD {((pnl[pnl.length - 1]?.ebitda * cfg.terminalMult) / 1e6).toFixed(2)}m</span>
              <span className="text-vfes-dark/55">→ PV BSD {(terminal / 1e6).toFixed(2)}m</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-vfes-dark text-base">
              <span>{tt('Total NPV')}</span>
              <span>BSD {(npvWithTerminal / 1e6).toFixed(2)}m</span>
            </div>
            <div className="text-[10px] text-vfes-dark/55 mt-2">
              Discounted at WACC {(cfg.wacc * 100).toFixed(1)}%. {goNoGo === 'GO' ? '✅ Above hurdle. Recommend launch.' : '❌ Below hurdle. Re-engineer pricing or cost.'}
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}

// ===========================================================================
// TAB · COHORT MARGIN
// ===========================================================================
function CohortMarginTab({ b, engine, cfg }: { b: BundleSKU; engine: any; cfg: Config }) {
  const marginData = (engine.rows as any[]).slice(0, Math.min(36, engine.rows.length)).map((r: any) => ({
    month: r.month,
    margin: +Number(r.contribution).toFixed(2),
    cumMargin: +Number(r.cumCash).toFixed(2),
  }))

  const tierMargins = bundleCatalog.map((sku) => ({
    name: sku.code,
    list: sku.list,
    rawMargin: +(sku.list - sku.network - sku.mvno - sku.contentLinear - sku.contentSvod - sku.care).toFixed(0),
    pct: +((sku.list - sku.network - sku.mvno - sku.contentLinear - sku.contentSvod - sku.care) / Math.max(1, sku.list) * 100).toFixed(0),
  }))

  const m12Margin = (engine.rows as any[]).slice(0, 12).reduce((a: number, r: any) => a + Number(r.contribution), 0)
  const m24Margin = (engine.rows as any[]).slice(0, 24).reduce((a: number, r: any) => a + Number(r.contribution), 0)

  return (
    <>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <KpiCard label={tt('Monthly contribution')} value={`BSD ${engine.monthlyMargin.toFixed(0)}`} delta={`${(engine.monthlyMargin / Math.max(1, b.list) * 100).toFixed(0)}% margin yield`} trend={engine.monthlyMargin > 0 ? 'up' : 'down'} icon={Coins} accent />
        <KpiCard label={tt('Cumulative M12 margin')} value={`BSD ${m12Margin.toFixed(0)}`} delta={tt('per subscriber')} icon={TrendingUp} />
        <KpiCard label={tt('Cumulative M24 margin')} value={`BSD ${m24Margin.toFixed(0)}`} delta={`vs upfront BSD ${(b.cac + b.install).toFixed(0)}`} trend={m24Margin > b.cac + b.install ? 'up' : 'down'} icon={TrendingUp} />
      </div>

      <Panel title={tt('Cohort margin evolution · monthly contribution (BSD /sub)')}>
        <div className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={marginData}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#999" fontSize={11} />
              <YAxis yAxisId="L" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${Number(v).toFixed(0)}`} />
              <YAxis yAxisId="R" orientation="right" stroke="#999" fontSize={11} tickFormatter={(v) => `BSD ${Number(v).toFixed(0)}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(2)}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="L" dataKey="margin" name={tt('Monthly margin BSD ')} fill={RED} radius={[4, 4, 0, 0]} />
              <Line yAxisId="R" type="monotone" dataKey="cumMargin" name={tt('Cumulative BSD ')} stroke={GREEN} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Monthly margin rises as promo period ends. Promo cliff at M7 visible as a contribution dip.')}</div>
      </Panel>

      <Panel title={tt('Bundle margin ladder · raw margin BSD /sub/mo vs margin %')}>
        <table className="w-full text-sm mt-2">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Bundle')}</th><th>{tt('List BSD ')}</th><th>{tt('Raw margin BSD ')}</th><th>{tt('Margin %')}</th></tr>
          </thead>
          <tbody>
            {tierMargins.map((t, i) => (
              <tr key={i} className={`border-t border-black/5 ${t.name === b.code ? 'bg-vfes-red/5 font-bold' : ''}`}>
                <td className="py-2 font-mono text-xs">{t.name}</td>
                <td>BSD {t.list}</td>
                <td className={`font-bold ${t.rawMargin > 30 ? 'text-emerald-600' : t.rawMargin > 15 ? 'text-amber-700' : 'text-red-600'}`}>BSD {t.rawMargin}</td>
                <td>{t.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
