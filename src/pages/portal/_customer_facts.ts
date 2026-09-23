// Canonical customer-base facts — single source of truth reused across the
// Customers section so headline numbers never disagree (aligns to Executive
// and Customer 360).

import { COMMERCIAL_BASE } from '../../data/scenario'

const monthlyLosses = Math.round(COMMERCIAL_BASE.fixedSubscriptions * COMMERCIAL_BASE.monthlyChurnPct / 100)

export const CUST_FACTS = {
  fixedSubs: COMMERCIAL_BASE.fixedSubscriptions,
  mobileSubs: COMMERCIAL_BASE.mobileSubscriptions,
  convergentHouseholds: COMMERCIAL_BASE.convergentHouseholds,

  // Movement (monthly)
  grossAddsMo: monthlyLosses + COMMERCIAL_BASE.monthlyNetAdds,
  churnLossesMo: monthlyLosses,
  churnRatePct: COMMERCIAL_BASE.monthlyChurnPct,
  netAddsMo: COMMERCIAL_BASE.monthlyNetAdds,
  winBackMo: 100,

  arpuFixed: COMMERCIAL_BASE.fixedArpu,
  arpuMobile: COMMERCIAL_BASE.mobileArpu,
  nps: 38,

  // Retention
  saveRatePct: 51,
  retentionSpendMoK: 1_180, // BSD thousands / month
  predictedChurnBook: 21_600, // lines flagged high-risk
  eurAtRiskMoK: 1_240, // BSD thousands of ARPU at risk / month

  // Loyalty
  loyaltyMembers: 62_000,
  pointsLiabilityM: 8.4, // BSD millions
  redemptionPct: 34,

  // Reachability (consent)
  contactable: { email: 71, sms: 84, push: 58, call: 46 },
} as const

export default CUST_FACTS
