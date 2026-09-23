import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3182)
// =============================================================================
// Bundle Profitability — quant engine (UC3)
// All helpers are pure & deterministic given inputs (Box-Muller seeded by Math.random)
// =============================================================================

export type BundleSKU = {
  code: string
  name: string
  category: 'BB+TV' | 'BB+Mobile' | 'Mega' | 'Baseline'
  // Tariff
  list: number          // BSD /mo scenario
  promo: number         // BSD /mo promo
  promoMonths: number   // promo length
  contractMonths: number
  // Cost build-up BSD /mo (variable)
  network: number       // bandwidth/peering/last-mile
  mvno: number          // mobile wholesale (0 if no mobile)
  contentLinear: number // linear TV rights
  contentSvod: number   // SVOD wholesale (Streaming add-on/Netflix/Disney+)
  care: number          // contact-centre allocation
  badDebtPct: number    // % of revenue lost
  // Upfront one-time costs
  cac: number           // acquisition (channel-blended)
  install: number       // truck-roll incidence × cost
  cpe: number           // capex on hardware
  cpeDepMonths: number  // amortisation schedule
  // Operational
  baseAcq: number       // monthly gross adds (book-of-business basis)
  baseChurnPct: number  // monthly involuntary+voluntary base churn
  haloChurnReductionPp: number // pp churn reduction from bundling (REVConnect halo)
  takeRate: number      // attach rate (used for portfolio mix)
  // Halo / cross-product
  bbArpuLift: number    // BSD /mo lift on the BB leg when bundled
}

// -------------------------------------------------------------------------
// Illustrative bundle composition (matches PricingSimulator catalog)
// -------------------------------------------------------------------------
export const bundleCatalog: BundleSKU[] = [
  { code: 'BIT',         name: 'REVHome (600 Mb + TV Essential)',           category: 'BB+TV',     list: 55,  promo: 35, promoMonths: 6,  contractMonths: 24, network: 9,  mvno: 0,  contentLinear: 8,  contentSvod: 6,  care: 4.5, badDebtPct: 1.1, cac: 80,  install: 35, cpe: 110, cpeDepMonths: 36, baseAcq: 1850, baseChurnPct: 1.4, haloChurnReductionPp: 0.20, takeRate: 0.18, bbArpuLift: 0 },
  { code: 'BB_TV_1G',    name: '1 Gb + REVTV',             category: 'BB+TV',     list: 75,  promo: 50, promoMonths: 6,  contractMonths: 24, network: 11, mvno: 0,  contentLinear: 12, contentSvod: 10, care: 5.0, badDebtPct: 1.1, cac: 85,  install: 35, cpe: 120, cpeDepMonths: 36, baseAcq: 2400, baseChurnPct: 1.3, haloChurnReductionPp: 0.22, takeRate: 0.22, bbArpuLift: 0 },
  { code: 'BB_TV_LIGA',  name: '1 Gb + TV + Sports add-on · Sports package',      category: 'BB+TV',     list: 95,  promo: 65, promoMonths: 6,  contractMonths: 24, network: 11, mvno: 0,  contentLinear: 18, contentSvod: 22, care: 5.0, badDebtPct: 1.0, cac: 90,  install: 35, cpe: 130, cpeDepMonths: 36, baseAcq: 1100, baseChurnPct: 1.1, haloChurnReductionPp: 0.30, takeRate: 0.10, bbArpuLift: 0 },
  { code: 'BB_TV_HBO',   name: '1 Gb + TV + Max + Disney+',        category: 'BB+TV',     list: 85,  promo: 55, promoMonths: 6,  contractMonths: 24, network: 11, mvno: 0,  contentLinear: 12, contentSvod: 18, care: 5.0, badDebtPct: 1.1, cac: 88,  install: 35, cpe: 130, cpeDepMonths: 36, baseAcq: 950,  baseChurnPct: 1.2, haloChurnReductionPp: 0.25, takeRate: 0.09, bbArpuLift: 0 },
  { code: 'BB_MOB_600',  name: '600 Mb + aliv Mobile Unlimited',    category: 'BB+Mobile', list: 70,  promo: 45, promoMonths: 6,  contractMonths: 24, network: 9,  mvno: 9,  contentLinear: 0,  contentSvod: 0,  care: 4.0, badDebtPct: 1.0, cac: 70,  install: 35, cpe: 80,  cpeDepMonths: 36, baseAcq: 1700, baseChurnPct: 1.0, haloChurnReductionPp: 0.35, takeRate: 0.16, bbArpuLift: 4 },
  { code: 'BB_MOB_1G',   name: '1 Gb + aliv Mobile Unlimited (REVConnect)', category: 'BB+Mobile', list: 80,  promo: 55, promoMonths: 6,  contractMonths: 24, network: 11, mvno: 9,  contentLinear: 0,  contentSvod: 0,  care: 4.0, badDebtPct: 1.0, cac: 75,  install: 35, cpe: 90,  cpeDepMonths: 36, baseAcq: 2100, baseChurnPct: 0.9, haloChurnReductionPp: 0.38, takeRate: 0.20, bbArpuLift: 4 },
  { code: 'ONE_TOTAL',   name: 'REVConnect — 2 Gb + TV + 4 mobile lines + Home Phone', category: 'Mega',  list: 110, promo: 80, promoMonths: 6,  contractMonths: 24, network: 14, mvno: 9,  contentLinear: 18, contentSvod: 18, care: 6.0, badDebtPct: 1.0, cac: 100, install: 45, cpe: 180, cpeDepMonths: 36, baseAcq: 480,  baseChurnPct: 0.8, haloChurnReductionPp: 0.42, takeRate: 0.05, bbArpuLift: 6 },
  { code: 'BB_ONLY',     name: '600 Mb Fibre (baseline)',              category: 'Baseline',  list: 35,  promo: 25, promoMonths: 6,  contractMonths: 24, network: 8,  mvno: 0,  contentLinear: 0,  contentSvod: 0,  care: 3.0, badDebtPct: 1.2, cac: 50,  install: 30, cpe: 60,  cpeDepMonths: 36, baseAcq: 2900, baseChurnPct: 1.6, haloChurnReductionPp: 0.0,  takeRate: 0.30, bbArpuLift: 0 },
]

// -------------------------------------------------------------------------
// Channels & Geographies (cost differentials)
// -------------------------------------------------------------------------
export const channelCacMult: Record<string, number> = { all: 1.0, direct: 0.85, retail: 1.20, b2b: 0.95 }
export const channelChurnMult: Record<string, number> = { all: 1.0, direct: 0.90, retail: 1.10, b2b: 0.85 }
export const geoCostMult: Record<string, number> = { all: 1.0, familyIslands: 1.0, newProvidence: 1.02 }

// -------------------------------------------------------------------------
// Effective ARPU = list − promo amort − bill credits − loyalty − badDebt
// -------------------------------------------------------------------------
export function effectiveArpu(b: BundleSKU, promoOverride?: number, billCredits = 0, loyaltyDiscount = 0, cpiEscalator = 0): number {
  const promo = promoOverride ?? b.promo
  const promoBlend = (promo * b.promoMonths + b.list * (b.contractMonths - b.promoMonths)) / b.contractMonths
  const afterCredits = promoBlend - billCredits - loyaltyDiscount
  const escalated = afterCredits * (1 + cpiEscalator / 100 / 2) // half-period weighting
  return Math.max(0, escalated * (1 - b.badDebtPct / 100))
}

// -------------------------------------------------------------------------
// Monthly contribution (true margin)
//  = ARPU − network − mvno − contentLinear − contentSvod − care + bbArpuLift
// -------------------------------------------------------------------------
export function monthlyContribution(b: BundleSKU, arpu: number, channelMult = 1, geoMult = 1, cogsShock = 0, contentShock = 0, mvnoShock = 0): number {
  const network = b.network * geoMult * (1 + cogsShock / 100)
  const mvno = b.mvno * (1 + mvnoShock / 100)
  const content = (b.contentLinear + b.contentSvod) * (1 + contentShock / 100)
  const care = b.care * channelMult
  return arpu + b.bbArpuLift - network - mvno - content - care
}

// -------------------------------------------------------------------------
// Weibull-style hazard + survival
// -------------------------------------------------------------------------
export function survival(months: number, baseChurnPct: number, haloPp = 0, k = 0.85, savePp = 0): { t: number; S: number; h: number }[] {
  const lambda = Math.max(0, (baseChurnPct - haloPp - savePp) / 100)
  const out: { t: number; S: number; h: number }[] = []
  let S = 1
  for (let t = 1; t <= months; t++) {
    const h = lambda === 0 ? 0 : Math.min(0.6, lambda * k * Math.pow(lambda * t, k - 1) * (t === 7 ? 1.6 : 1))
    S *= 1 - h
    out.push({ t, S, h })
  }
  return out
}

// -------------------------------------------------------------------------
// Cohort cash-flow (per-subscriber, monthly) — the heart of the engine
// -------------------------------------------------------------------------
export type CashflowRow = {
  month: number
  S: number          // surviving share
  arpu: number
  cogs: number
  cac: number        // upfront, only M0
  cpe: number        // amortised
  contribution: number
  cumCash: number
  discFactor: number
  pvCash: number
}

export function cohortCashflow(
  b: BundleSKU,
  cfg: {
    horizon: number; wacc: number; channelMult: number; geoMult: number
    promoOverride?: number; billCredits?: number; loyaltyDiscount?: number; cpiEscalator?: number
    cogsShock?: number; contentShock?: number; mvnoShock?: number
    weibullK?: number; saveOfferPp?: number; refreshAtM24?: boolean
    cacOverride?: number; cpeOverride?: number; cpeDepOverride?: number
  },
): CashflowRow[] {
  const arpuBase = effectiveArpu(b, cfg.promoOverride, cfg.billCredits, cfg.loyaltyDiscount, cfg.cpiEscalator)
  const cac = (cfg.cacOverride ?? b.cac) * cfg.channelMult + b.install
  const cpe = (cfg.cpeOverride ?? b.cpe)
  const dep = cfg.cpeDepOverride ?? b.cpeDepMonths
  const cpeMonthly = cpe / dep
  const surv = survival(cfg.horizon, b.baseChurnPct, b.haloChurnReductionPp, cfg.weibullK ?? 0.85, cfg.saveOfferPp ?? 0)

  const rows: CashflowRow[] = []
  let cum = -cac - cpe // upfront capex hit at M0
  for (let m = 1; m <= cfg.horizon; m++) {
    const S = surv[m - 1].S
    // promo blend in early months
    const inPromo = m <= b.promoMonths
    const tariff = inPromo ? (cfg.promoOverride ?? b.promo) : b.list
    const arpu = Math.max(0, tariff - (cfg.billCredits ?? 0) - (cfg.loyaltyDiscount ?? 0)) * (1 - b.badDebtPct / 100) * Math.pow(1 + (cfg.cpiEscalator ?? 0) / 100, Math.floor((m - 1) / 12))
    const contribLive = monthlyContribution(b, arpu, cfg.channelMult, cfg.geoMult, cfg.cogsShock, cfg.contentShock, cfg.mvnoShock)
    const cpeAlloc = m <= dep ? cpeMonthly : 0
    const contribution = contribLive * S
    const refreshCash = cfg.refreshAtM24 && m === 24 ? cpe * 0.6 : 0
    cum += contribution
    cum -= refreshCash
    const discFactor = 1 / Math.pow(1 + cfg.wacc / 12, m)
    rows.push({
      month: m, S, arpu, cogs: arpu + b.bbArpuLift - contribLive,
      cac: m === 1 ? cac : 0,
      cpe: cpeAlloc, contribution, cumCash: cum,
      discFactor, pvCash: (contribution - refreshCash) * discFactor,
    })
  }
  return rows
}

// -------------------------------------------------------------------------
// NPV & IRR — pure helpers
// -------------------------------------------------------------------------
export function bundleNpv(rows: CashflowRow[], terminalMult = 6, wacc = 0.08): number {
  if (!rows.length) return 0
  const sumPv = rows.reduce((a, r) => a + r.pvCash, 0)
  const lastRow = rows[rows.length - 1]
  const monthlyContrib = rows.slice(-12).reduce((a, r) => a + r.contribution, 0)
  const terminalAnnual = monthlyContrib
  const terminal = terminalAnnual * terminalMult * (lastRow?.discFactor ?? 0)
  const upfront = rows[0]?.cumCash - rows[0]?.contribution // initial −cac−cpe
  return sumPv + terminal + upfront
}

export function bundleIrr(rows: CashflowRow[]): number {
  // monthly cash array starting with upfront negative, then contributions
  const cash: number[] = []
  if (!rows.length) return 0
  cash.push(rows[0].cumCash - rows[0].contribution) // upfront
  rows.forEach((r) => cash.push(r.contribution))
  // bisection
  let lo = -0.99, hi = 5
  const npvAt = (r: number) => cash.reduce((a, c, i) => a + c / Math.pow(1 + r, i / 12), 0)
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (npvAt(mid) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function paybackMonths(rows: CashflowRow[]): number {
  for (const r of rows) if (r.cumCash >= 0) return r.month
  return 999
}

// -------------------------------------------------------------------------
// Tornado sensitivity — bumps each driver low/high, returns ΔNPV
// -------------------------------------------------------------------------
export type TornadoRow = { driver: string; low: number; high: number; baseNpv: number }
export function tornadoSensitivity(b: BundleSKU, baseCfg: Parameters<typeof cohortCashflow>[1], terminalMult: number, wacc: number): TornadoRow[] {
  const baseNpv = bundleNpv(cohortCashflow(b, baseCfg), terminalMult, wacc)
  const drivers: { name: string; mut: (c: typeof baseCfg, sign: 1 | -1) => typeof baseCfg }[] = [
    { name: 'Content rights ±15%', mut: (c, s) => ({ ...c, contentShock: (c.contentShock ?? 0) + s * 15 }) },
    { name: 'MVNO wholesale ±10%', mut: (c, s) => ({ ...c, mvnoShock: (c.mvnoShock ?? 0) + s * 10 }) },
    { name: 'COGS / network ±10%', mut: (c, s) => ({ ...c, cogsShock: (c.cogsShock ?? 0) + s * 10 }) },
    { name: 'Churn ±1pp', mut: (c, s) => ({ ...c, saveOfferPp: (c.saveOfferPp ?? 0) - s * 1 }) },
    { name: 'CAC ±BSD 20', mut: (c, s) => ({ ...c, cacOverride: (c.cacOverride ?? b.cac) + s * 20 }) },
    { name: 'CPE ±20%', mut: (c, s) => ({ ...c, cpeOverride: (c.cpeOverride ?? b.cpe) * (1 + s * 0.2) }) },
    { name: 'Take-rate ±5pp', mut: (c, s) => ({ ...c, billCredits: (c.billCredits ?? 0) + s * 2.5 }) }, // proxy
    { name: 'WACC ±200bp', mut: (c) => c },
  ]
  return drivers.map(({ name, mut }) => {
    const lowCfg = mut(baseCfg, -1)
    const highCfg = mut(baseCfg, 1)
    const lowW = name.includes('WACC') ? wacc + 0.02 : wacc
    const highW = name.includes('WACC') ? wacc - 0.02 : wacc
    const low = bundleNpv(cohortCashflow(b, lowCfg), terminalMult, lowW)
    const high = bundleNpv(cohortCashflow(b, highCfg), terminalMult, highW)
    return { driver: name, low, high, baseNpv }
  }).sort((a, c) => Math.abs(c.high - c.low) - Math.abs(a.high - a.low))
}

// -------------------------------------------------------------------------
// Break-even surface (2D heatmap data)
// -------------------------------------------------------------------------
export function breakEvenSurface(b: BundleSKU, baseCfg: Parameters<typeof cohortCashflow>[1], terminalMult: number, wacc: number): { discount: number; contentShock: number; npv: number }[] {
  const out: { discount: number; contentShock: number; npv: number }[] = []
  for (let d = 0; d <= 50; d += 5) {
    for (let c = -20; c <= 30; c += 5) {
      const promoEffective = b.list * (1 - d / 100)
      const cfg2 = { ...baseCfg, promoOverride: promoEffective, contentShock: c }
      const npv = bundleNpv(cohortCashflow(b, cfg2), terminalMult, wacc)
      out.push({ discount: d, contentShock: c, npv })
    }
  }
  return out
}

// -------------------------------------------------------------------------
// Monte Carlo on NPV with σ on key drivers
// -------------------------------------------------------------------------
function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = scenarioRandom()
  while (v === 0) v = scenarioRandom()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function monteCarloNpv(b: BundleSKU, baseCfg: Parameters<typeof cohortCashflow>[1], terminalMult: number, wacc: number, draws = 1000, sigmaMult = 1): number[] {
  const out: number[] = []
  for (let d = 0; d < draws; d++) {
    const cfg2 = {
      ...baseCfg,
      contentShock: (baseCfg.contentShock ?? 0) + 8 * sigmaMult * randn(),
      mvnoShock: (baseCfg.mvnoShock ?? 0) + 5 * sigmaMult * randn(),
      cogsShock: (baseCfg.cogsShock ?? 0) + 4 * sigmaMult * randn(),
      saveOfferPp: (baseCfg.saveOfferPp ?? 0) + 0.5 * sigmaMult * randn(),
    }
    out.push(bundleNpv(cohortCashflow(b, cfg2), terminalMult, wacc))
  }
  out.sort((a, c) => a - c)
  return out
}

export function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0
  const i = Math.floor((arr.length - 1) * (p / 100))
  return arr[Math.max(0, Math.min(arr.length - 1, i))]
}

// -------------------------------------------------------------------------
// 5-yr P&L (subs roll-forward)
// -------------------------------------------------------------------------
export type PnlYear = {
  year: number; openSubs: number; grossAdds: number; churn: number; closeSubs: number
  arpu: number; revenue: number; contentCost: number; networkCost: number; careCost: number
  cac: number; cpe: number; ebitda: number; ebitdaMargin: number; capex: number; fcf: number
}

export function fiveYearPnl(b: BundleSKU, baseCfg: Parameters<typeof cohortCashflow>[1], years: number, openBase: number, taxRate: number): PnlYear[] {
  const arpu = effectiveArpu(b, baseCfg.promoOverride, baseCfg.billCredits, baseCfg.loyaltyDiscount, baseCfg.cpiEscalator)
  const out: PnlYear[] = []
  let openSubs = openBase
  for (let y = 1; y <= years; y++) {
    const grossAdds = b.baseAcq * 12 * Math.pow(1.02, y - 1)
    const churnRate = (b.baseChurnPct - b.haloChurnReductionPp) / 100
    const churn = (openSubs + grossAdds / 2) * churnRate * 12
    const closeSubs = openSubs + grossAdds - churn
    const avgSubs = (openSubs + closeSubs) / 2
    const revenue = avgSubs * arpu * 12
    const contentCost = avgSubs * (b.contentLinear + b.contentSvod) * 12 * (1 + (baseCfg.contentShock ?? 0) / 100)
    const networkCost = avgSubs * (b.network + b.mvno) * 12 * (1 + (baseCfg.cogsShock ?? 0) / 100)
    const careCost = avgSubs * b.care * 12
    const cac = grossAdds * (baseCfg.cacOverride ?? b.cac) * baseCfg.channelMult
    const capex = grossAdds * (baseCfg.cpeOverride ?? b.cpe)
    const cpe = avgSubs * ((baseCfg.cpeOverride ?? b.cpe) / b.cpeDepMonths) * 12
    const ebitda = revenue - contentCost - networkCost - careCost - cac
    const ebitdaMargin = (ebitda / revenue) * 100
    const fcf = ebitda * (1 - taxRate) - capex
    out.push({ year: y, openSubs, grossAdds, churn, closeSubs, arpu, revenue, contentCost, networkCost, careCost, cac, cpe, ebitda, ebitdaMargin, capex, fcf })
    openSubs = closeSubs
  }
  return out
}
