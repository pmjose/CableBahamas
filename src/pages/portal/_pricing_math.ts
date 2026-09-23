import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3296)
// Pricing math engine — shared helpers for PricingSimulatorPage
// All pure functions (no React, no side effects) so they can be tested / reused.

export type SkuLike = {
  code: string
  svr: number
  list: number
  promo: number
  promoMonths: number
  contractMonths: number
  cogs: number
  care: number
  baseAcq: number
  baseChurn: number
  baseBase: number
  eAcq: number
  eChurn: number
  eirPrice?: number
  skyPrice?: number
  vodaPrice?: number
  threePrice?: number
}

// ─── Logit choice share ────────────────────────────────────────────────────
// V_i = α − β·price ; s_i = exp(V_i) / Σ exp(V_j)
export function logitShare(prices: number[], beta = 0.06, alpha = 5): number[] {
  const V = prices.map((p) => (p > 0 ? alpha - beta * p : -Infinity))
  const exps = V.map((v) => (isFinite(v) ? Math.exp(v) : 0))
  const sum = exps.reduce((a, b) => a + b, 0) || 1
  return exps.map((e) => e / sum)
}

// Cross-price elasticity from logit: ε_ij = −β·p_j·(δ_ij − s_j)
export function logitCrossElasticity(prices: number[], beta = 0.06): number[][] {
  const s = logitShare(prices, beta)
  const n = prices.length
  const M: number[][] = []
  for (let i = 0; i < n; i++) {
    M.push([])
    for (let j = 0; j < n; j++) {
      const delta = i === j ? 1 : 0
      M[i].push(-beta * prices[j] * (delta - s[j]))
    }
  }
  return M
}

// ─── Survival / churn ──────────────────────────────────────────────────────
// Hazard with Weibull-style baseline: h0(t) = λ·k·(λt)^(k−1), modulated by Δp
export function hazard(t: number, dPctChange: number, eChurn: number, lambda = 0.012, k = 0.85): number {
  const baseH = lambda * k * Math.pow(lambda * t, k - 1)
  const priceMult = Math.exp((eChurn * dPctChange) / 100)
  return Math.min(0.6, baseH * priceMult)
}

// Kaplan-Meier-style survival S(t) = Π (1 − h_k)
export function survivalCurve(months: number, dPctChange: number, eChurn: number, k = 0.85): { t: number; S: number; h: number }[] {
  const out: { t: number; S: number; h: number }[] = []
  let S = 1
  for (let t = 1; t <= months; t++) {
    const h = hazard(t, dPctChange, eChurn, 0.012, k)
    S *= 1 - h
    out.push({ t, S, h })
  }
  return out
}

// ─── Promo amortisation ────────────────────────────────────────────────────
// Effective ARPU = blended over contract horizon
export function effectiveArpu(promo: number, svr: number, promoMonths: number, contractMonths: number): number {
  if (contractMonths <= 0) return svr
  const m = Math.min(promoMonths, contractMonths)
  return (promo * m + svr * (contractMonths - m)) / contractMonths
}

// ─── LTV / CAC / Payback / NPV ─────────────────────────────────────────────
export function ltv(arpu: number, cogs: number, care: number, eChurn: number, dPctChange: number, horizon = 60, wacc = 0.08): number {
  const margin = arpu - cogs - care
  let v = 0
  let S = 1
  for (let t = 1; t <= horizon; t++) {
    const h = hazard(t, dPctChange, eChurn)
    S *= 1 - h
    v += (margin * S) / Math.pow(1 + wacc / 12, t)
  }
  return v
}

export function paybackMonths(arpu: number, cogs: number, care: number, cac: number, eChurn: number, dPctChange: number): number {
  const margin = arpu - cogs - care
  if (margin <= 0) return 999
  let cum = 0
  let S = 1
  for (let t = 1; t <= 120; t++) {
    const h = hazard(t, dPctChange, eChurn)
    S *= 1 - h
    cum += margin * S
    if (cum >= cac) return t
  }
  return 999
}

export function npv(cashflows: number[], wacc = 0.08): number {
  return cashflows.reduce((acc, c, i) => acc + c / Math.pow(1 + wacc, i + 1), 0)
}

// IRR via bisection
export function irr(cashflows: number[]): number {
  const f = (r: number) => cashflows.reduce((acc, c, i) => acc + c / Math.pow(1 + r, i), 0)
  let lo = -0.99
  let hi = 5
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ─── Bertrand-Nash equilibrium (heuristic) ─────────────────────────────────
// Best-response: p_i* ≈ mc_i + p_i / |ε_ii(1 − s_i)|
export function bertrandNash(prices: number[], mc: number[], beta = 0.06, iterations = 20): number[] {
  let p = [...prices]
  for (let it = 0; it < iterations; it++) {
    const s = logitShare(p, beta)
    const next = p.map((pi, i) => {
      const denom = Math.max(0.05, beta * (1 - s[i]))
      return Math.max(mc[i] + 1, mc[i] + 1 / denom)
    })
    p = p.map((old, i) => old * 0.6 + next[i] * 0.4)
  }
  return p
}

// ─── Monte Carlo ───────────────────────────────────────────────────────────
// Box-Muller normal sampler
function randn(): number {
  const u1 = scenarioRandom() || 1e-9
  const u2 = scenarioRandom()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export function monteCarloEbitda(
  base: { eAcq: number; eChurn: number; baseAcq: number; baseChurn: number; baseBase: number; svr: number; cogs: number; care: number; pctChange: number; segMult: number; sigmaMult?: number },
  draws = 1000,
): number[] {
  const sm = base.sigmaMult ?? 1
  const out: number[] = []
  for (let d = 0; d < draws; d++) {
    const eA = base.eAcq + 0.15 * sm * randn()
    const eC = base.eChurn + 0.12 * sm * randn()
    const compReact = 0.5 + 0.2 * sm * randn()
    const acqImpact = (base.pctChange * eA * base.segMult) / 100
    const churnImpact = (base.pctChange * eC * base.segMult) / 100
    const acqV = base.baseAcq * (1 + acqImpact) * (1 - Math.max(0, compReact * 0.1))
    const chV = base.baseChurn * (1 + churnImpact)
    const netSubs = acqV - chV
    const newPrice = base.svr * (1 + base.pctChange / 100)
    const margin = newPrice - base.cogs - base.care
    const ebitda = (base.baseBase + netSubs) * margin * 12 - base.baseBase * (base.svr - base.cogs - base.care) * 12
    out.push(ebitda)
  }
  out.sort((a, b) => a - b)
  return out
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)))
  return sorted[idx]
}

// Histogram bins
export function histogram(values: number[], bins = 24): { bin: string; count: number; mid: number }[] {
  if (!values.length) return []
  const min = values[0]
  const max = values[values.length - 1]
  const w = (max - min) / bins || 1
  const counts = Array.from({ length: bins }, () => 0)
  values.forEach((v) => {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / w)))
    counts[i]++
  })
  return counts.map((c, i) => ({
    bin: `${((min + w * i) / 1e6).toFixed(1)}M`,
    count: c,
    mid: min + w * (i + 0.5),
  }))
}

// ─── Optimal price grid ────────────────────────────────────────────────────
// Searches Δp ∈ [−30%, +30%], returns full curve + argmax + constrained optima
export function optimalPriceGrid(p: SkuLike, segMult: number, churnCapPp = 1, regCapPct = 7) {
  const curve: { dPct: number; ebitda: number; rev: number; netSubs: number; churn: number }[] = []
  for (let i = -30; i <= 30; i++) {
    const dPct = i
    const acqImpact = (dPct * p.eAcq * segMult) / 100
    const churnImpact = (dPct * p.eChurn * segMult) / 100
    const acqV = p.baseAcq * (1 + acqImpact)
    const chV = p.baseChurn * (1 + churnImpact)
    const netSubs = acqV - chV
    const newPrice = p.svr * (1 + dPct / 100)
    const margin = newPrice - p.cogs - p.care
    const ebitda = (p.baseBase + netSubs) * margin * 12 - p.baseBase * (p.svr - p.cogs - p.care) * 12
    const rev = (p.baseBase + netSubs) * newPrice * 12
    const churnPp = (chV / p.baseBase - p.baseChurn / p.baseBase) * 100
    curve.push({ dPct, ebitda, rev, netSubs, churn: churnPp })
  }
  const unconstrained = curve.reduce((a, b) => (b.ebitda > a.ebitda ? b : a))
  const churnConstrained = curve.filter((x) => x.churn <= churnCapPp).reduce((a, b) => (b.ebitda > a.ebitda ? b : a), curve[0])
  const regConstrained = curve.filter((x) => Math.abs(x.dPct) <= regCapPct).reduce((a, b) => (b.ebitda > a.ebitda ? b : a), curve[0])
  return { curve, unconstrained, churnConstrained, regConstrained }
}

// ─── Multi-year P&L ────────────────────────────────────────────────────────
export function multiYearPnl(p: SkuLike, segMult: number, dPctChange: number, years = 5, wacc = 0.08, cacPerAdd = 120) {
  const acqImpact = (dPctChange * p.eAcq * segMult) / 100
  const churnImpact = (dPctChange * p.eChurn * segMult) / 100
  const annualAcq = p.baseAcq * (1 + acqImpact)
  const annualChurn = p.baseChurn * 12 * (1 + churnImpact)
  let base = p.baseBase
  const newPrice = p.svr * (1 + dPctChange / 100)
  const rows: { year: number; subs: number; rev: number; cogs: number; care: number; cac: number; ebitda: number; margin: number }[] = []
  let baselineEbitdaY1 = 0
  for (let y = 1; y <= years; y++) {
    const subsAvg = base + annualAcq / 2 - annualChurn / 2
    const rev = subsAvg * newPrice * 12
    const cogs = subsAvg * p.cogs * 12
    const care = subsAvg * p.care * 12
    const cac = annualAcq * cacPerAdd
    const ebitda = rev - cogs - care - cac
    const margin = (ebitda / rev) * 100
    if (y === 1) baselineEbitdaY1 = (p.baseBase * (p.svr - p.cogs - p.care) * 12) - p.baseAcq * cacPerAdd
    rows.push({ year: y, subs: subsAvg, rev, cogs, care, cac, ebitda, margin })
    base = base + annualAcq - annualChurn
  }
  const cf = rows.map((r) => r.ebitda)
  return {
    rows,
    npv: npv(cf, wacc),
    irr: irr([-rows[0].cac, ...cf]),
    terminal: rows[rows.length - 1].ebitda * 6,
    baselineEbitdaY1,
  }
}
