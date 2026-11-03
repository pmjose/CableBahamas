// Canonical network facts — single source of truth reused across the
// Network & Operations pages so headline numbers never disagree.

export const NET_FACTS = {
  activeSites: 220,
  ownedSites: 160,
  sharedSites: 60,
  ownedTowers: 0,
  towerTenancy: 1.58,

  mobileSubs: 180_500,
  fixedHomesPassed: 140_000,
  fixedSubs: 74_400, // aligned to CUST_FACTS.fixedSubs (broadband base)

  // Coverage
  cov5gPop: 89.4,
  cov4gPop: 99.6,

  // Spectrum (sub-6 GHz licensed shown separately from mmWave)
  spectrumSub6Mhz: 290,
  spectrumMmwaveMhz: 400,

  // Transport
  coreCapacityTbps: 1.5,

  // Energy
  kwhPerGb: 0.101,
  networkGwhMonth: 33.4,
  renewablePct: 79,

  // Core
  coreUptimePct: 99.96,

  // Assurance baselines
  mttaMin: 4.2,
  mttrMin: 38,
  cimMonth: 18420, // customer-impacting minutes
  slaCreditExposureK: 142, // BSD thousands
} as const

export default NET_FACTS
