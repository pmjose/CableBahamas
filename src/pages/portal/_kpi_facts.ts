// Canonical company-level headline KPIs — the single source of truth for the
// numbers that appear in MULTIPLE places (ticker, Executive scorecard, Finance).
// Subscriber/ARPU/churn figures are re-exported from the domain fact modules so
// there is exactly one place each number is defined.
import CUST from './_customer_facts'
import NET from './_network_facts'
import { FINANCE, QUARTER_REVENUE_M, TTM_EBITDA_M, TTM_FCF_M, round } from '../../data/scenario'

export const KPI = {
  revenueMoM: FINANCE.monthlyRevenueM,
  revenueQtrM: QUARTER_REVENUE_M,
  ebitdaM: FINANCE.monthlyEbitdaM,
  ebitdaMarginPct: round(FINANCE.monthlyEbitdaM / FINANCE.monthlyRevenueM * 100, 1),
  fcfTtmM: TTM_FCF_M,
  netDebtEbitdaX: round(FINANCE.netDebtM / TTM_EBITDA_M, 2),

  // Commercial
  b2bPipelineM: 4.2,

  // Subscribers (sourced from the customer fact module — never redefined here)
  fixedSubs: CUST.fixedSubs,
  mobileSubs: CUST.mobileSubs,
  churnRatePct: CUST.churnRatePct,      // 1.1
  netAddsQK: CUST.netAddsMo * 3 / 1000,
  nps: CUST.nps,                        // 38
  arpuMobile: CUST.arpuMobile,
  arpuFixed: CUST.arpuFixed,

  // Network (sourced from the network fact module)
  uptime30dPct: 99.94,
  corePeakTbps: 3.84,
  renewablePct: NET.renewablePct,

  // Corp
  tsr5yrPct: 72,
  creditRating: 'BB Stable',

  // People (company-wide 12-month attrition — single source of truth)
  attritionRegrettablePct: 8.1,         // regrettable/voluntary (board headline)
  attritionTotalPct: 13.6,              // total incl. involuntary (People trend)
} as const

// Display helper: fixed-sub base as "1.06M"
export const fixedSubsM = (KPI.fixedSubs / 1_000_000).toFixed(2)

export default KPI
