export const SCENARIO_DATE = '2026-10-31'
export const round = (value: number, decimals = 2) => Number(value.toFixed(decimals))

export const COMMERCIAL_BASE = {
  fixedSubscriptions: 74_400,
  mobileSubscriptions: 180_500,
  convergentHouseholds: 39_000,
  fixedArpu: 63.66,
  mobileArpu: 21,
  monthlyChurnPct: 1.1,
  monthlyNetAdds: 300,
} as const

export const MONTHLY_REVENUE_LANES = [
  { lane: 'Fixed (FTTH)', revenue: 3, color: '#3B82F6' },
  { lane: 'Fixed (HFC)', revenue: 2, color: '#94A3B8' },
  { lane: 'Mobile (Consumer)', revenue: 3.2, color: '#FF4438' },
  { lane: 'Mobile (B2B)', revenue: 0.8, color: '#FF8585' },
  { lane: 'Business fixed', revenue: 2, color: '#7C3AED' },
  { lane: 'Wholesale', revenue: 1, color: '#10B981' },
]

export const FINANCE = {
  monthlyRevenueM: 12,
  monthlyEbitdaM: 4.5,
  monthlyCogsM: 4.8,
  monthlySalesMarketingM: 1.8,
  monthlyAdminM: 0.9,
  monthlyDepreciationM: 1.5,
  monthlyInterestM: 0.6,
  monthlyTaxM: 0.3,
  monthlyOperatingCashM: 3.2,
  monthlyCapexM: 2,
  netDebtM: 162,
  cashM: 24,
} as const

export const FINANCE_TREND = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, index) => {
  const revenue = round(FINANCE.monthlyRevenueM * (0.89 + index * 0.01))
  const ebitda = round(revenue * 0.375)
  return { m: month, revenue, ebitda, plan: round(revenue * 1.02), ocf: round(3.2 * revenue / 12), capex: -2, fcf: round(3.2 * revenue / 12 - 2) }
})

export const QUARTER_REVENUE_M = round(FINANCE_TREND.slice(-3).reduce((total, month) => total + month.revenue, 0))
export const TTM_REVENUE_M = round(FINANCE_TREND.reduce((total, month) => total + month.revenue, 0))
export const TTM_EBITDA_M = round(FINANCE_TREND.reduce((total, month) => total + month.ebitda, 0))
export const TTM_FCF_M = round(FINANCE_TREND.reduce((total, month) => total + month.fcf, 0))

// Receivables ageing at 31 Oct 2026, BSD M. Sized to 42 days sales outstanding:
// group 16.8M on BSD 12M/month; B2B 4.2M on business + wholesale BSD 3M/month.
export const AR_AGING = [
  { bucket: 'Current', group: 11.6, b2b: 3.0 },
  { bucket: '1-30 days', group: 3.1, b2b: 0.75 },
  { bucket: '31-60 days', group: 1.0, b2b: 0.25 },
  { bucket: '61-90 days', group: 0.55, b2b: 0.1 },
  { bucket: '90+ days', group: 0.55, b2b: 0.1 },
] as const
export const AR_TOTAL_M = round(AR_AGING.reduce((s, b) => s + b.group, 0), 2)
export const DSO_DAYS = 42

export const NETWORK_BASE = { activeSites: 220, ownedSites: 160, sharedSites: 60, homesPassed: 140_000 } as const

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}
