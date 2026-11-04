// Bahamas-specific operating views: hurricane replay, Family Islands service,
// competition & porting, URCA calendar and tourism roaming. Synthetic and
// indicative, derived from the shared baseline (scenario.ts / islands.ts).
import { COMMERCIAL_BASE, round } from './scenario'
import { ISLANDS, type Island } from './islands'
import { VISITOR_MONTHS } from './bahamas_market'

const isl = (n: Island) => ISLANDS.find(i => i.island === n)!

// ─── Hurricane replay: Cat 4 track over Abaco then Grand Bahama ──────────────
// Modelled on a slow-moving Dorian-type track. Day 0 = landfall on Abaco.
export const STORM = { name: 'Hurricane replay · Cat 4 (Dorian-type track)', landfall: 'Abaco, day 0 · Grand Bahama, day 1', stallHours: 36 }

const HIT: Partial<Record<Island, { peakDown: number; dayHit: number; halfLife: number }>> = {
  // peakDown: share of sites / fixed subs out at peak; halfLife: days to halve the outage
  Abaco: { peakDown: 0.86, dayHit: 0, halfLife: 6.5 },
  'Grand Bahama': { peakDown: 0.62, dayHit: 1, halfLife: 3.2 },
  'New Providence': { peakDown: 0.08, dayHit: 1, halfLife: 0.8 },
  Eleuthera: { peakDown: 0.14, dayHit: 0, halfLife: 1.5 },
}

export const STORM_DAYS = [-3, -2, -1, 0, 1, 2, 3, 5, 7, 10, 14, 21, 30]

const downShare = (n: Island, d: number) => {
  const h = HIT[n]
  if (!h || d < h.dayHit) return 0
  return h.peakDown * Math.pow(0.5, (d - h.dayHit) / h.halfLife)
}

export const stormState = (d: number) => {
  const rows = ISLANDS.map(i => {
    const s = downShare(i.island, d)
    return { island: i.island, sitesDown: Math.round(i.sites * s), sites: i.sites, subsOut: Math.round(i.fixedSubs * s), fixedSubs: i.fixedSubs, mobileOut: Math.round(i.mobileSubs * s * 0.7) }
  })
  const subsOut = rows.reduce((a, r) => a + r.subsOut, 0)
  const sitesDown = rows.reduce((a, r) => a + r.sitesDown, 0)
  const mobileOut = rows.reduce((a, r) => a + r.mobileOut, 0)
  // daily fixed revenue not billable while out (credited)
  const dailyCreditBsd = Math.round(subsOut * COMMERCIAL_BASE.fixedArpu / 30)
  return { day: d, rows, subsOut, sitesDown, mobileOut, dailyCreditBsd }
}

export const STORM_SERIES = STORM_DAYS.map(d => {
  const s = stormState(d)
  return { d: d === 0 ? 'Landfall' : d < 0 ? `D${d}` : `D+${d}`, day: d, sitesDown: s.sitesDown, subsOutK: round(s.subsOut / 1000, 1), mobileOutK: round(s.mobileOut / 1000, 1) }
})

// cumulative credits over the 30-day window (trapezoid on the day grid)
export const STORM_CREDITS_BSD = (() => {
  let total = 0
  for (let i = 1; i < STORM_DAYS.length; i++) {
    const a = stormState(STORM_DAYS[i - 1]).dailyCreditBsd, b = stormState(STORM_DAYS[i]).dailyCreditBsd
    total += (a + b) / 2 * (STORM_DAYS[i] - STORM_DAYS[i - 1])
  }
  return Math.round(total)
})()

export const STORM_PLAYBOOK: { day: number; who: string; action: string; system: string }[] = [
  { day: -3, who: 'Resilience lead', action: 'Cone reaches 72h — pre-stage 14 generators and 2 splice crews on Abaco via Marsh Harbour ferry', system: 'Hurricane agent · FieldForce' },
  { day: -2, who: 'Care', action: 'SMS + app push to 15.7K Abaco & Grand Bahama households: prep tips, outage map, payment holiday opt-in', system: 'Braze · Genesys' },
  { day: -1, who: 'NOC', action: 'Fuel top-up to 100% at 60 Abaco/GB sites; reroute Freeport core to Nassau', system: 'NOC · Ericsson EMS' },
  { day: 0, who: 'CEO / War Room', action: 'Landfall Abaco — free aliv roaming & unlimited data for affected islands; NEMA liaison open', system: 'Ericsson OCS · War Room' },
  { day: 1, who: 'Billing', action: 'Auto-suspend billing for out-of-service accounts (disaster-credit rule)', system: 'Cerillion billing' },
  { day: 2, who: 'Network', action: 'Cell-on-wheels at Marsh Harbour clinic and Freeport Rand hospital; satellite backhaul', system: 'RAN · satellite' },
  { day: 5, who: 'Data Products', action: 'Share aggregated displacement data (k ≥ 50) with NEMA and Red Cross', system: 'Snowflake clean room' },
  { day: 10, who: 'Retention', action: 'Targeted save offers to restored households near BTC fibre', system: 'Cortex churn model · CRM' },
  { day: 21, who: 'CFO', action: 'Insurance claim pack and URCA outage report generated from Snowflake', system: 'Cortex Agent · URCA pack' },
]

// ─── Family Islands & universal service ──────────────────────────────────────
export const FAMILY_ISLANDS = ISLANDS.filter(i => i.island !== 'New Providence').map(i => ({
  island: i.island, hub: i.hub, homesPassed: i.homesPassed, fixedSubs: i.fixedSubs,
  takeUp: Math.round(i.fixedSubs / i.homesPassed * 100), sites: i.sites, cov5g: i.cov5g,
  backhaul: ({ 'Grand Bahama': 'Subsea fibre (BDSNi)', Abaco: 'Subsea fibre', Eleuthera: 'Subsea fibre', Exuma: 'Subsea fibre', Andros: 'Microwave + subsea', 'Other Family Islands': 'Microwave / satellite' } as Record<string, string>)[i.island],
  ferryDays: ({ 'Grand Bahama': 1, Abaco: 1, Eleuthera: 1, Exuma: 2, Andros: 1, 'Other Family Islands': 3 } as Record<string, number>)[i.island],
}))

export const USO = {
  fundBsdM: 2.4, // universal service contribution pool, FY2027
  socialTariffBsd: 25,
  projects: [
    { name: 'Andros fibre extension — Fresh Creek to Nicholls Town', homes: 1_100, capexBsdM: 1.6, status: 'Approved', go: 'Q2-27' },
    { name: 'Long Island & Cat Island 4G densification (6 sites)', homes: 900, capexBsdM: 0.9, status: 'Submitted', go: 'Q3-27' },
    { name: 'Exuma Cays fixed-wireless (FWA) pilot', homes: 350, capexBsdM: 0.4, status: 'Pilot', go: 'Q1-27' },
    { name: 'Schools connectivity — 38 Family Island schools at 1 Gbps', homes: 0, capexBsdM: 0.7, status: 'In delivery', go: 'Q4-26' },
  ],
}

// ─── Competition & number portability ───────────────────────────────────────
export const MARKET_SHARE = [
  { seg: 'Fixed broadband', rev: 62, btc: 31, other: 7 },
  { seg: 'Pay TV', rev: 78, btc: 12, other: 10 },
  { seg: 'Mobile (subs)', rev: 41, btc: 59, other: 0 },
  { seg: 'Enterprise / DIA', rev: 48, btc: 45, other: 7 },
]

export const PORTING = [
  { m: 'May', portIn: 1_340, portOut: 1_190 }, { m: 'Jun', portIn: 1_410, portOut: 1_220 },
  { m: 'Jul', portIn: 1_520, portOut: 1_260 }, { m: 'Aug', portIn: 1_380, portOut: 1_310 },
  { m: 'Sep', portIn: 1_120, portOut: 1_350 }, { m: 'Oct', portIn: 1_610, portOut: 1_290 },
]
export const PORT_NET_6M = PORTING.reduce((s, p) => s + p.portIn - p.portOut, 0)

export const COMPETITOR_MOVES = [
  { date: '14 Oct 2026', who: 'BTC', move: 'Fibre Max 1 Gbps at BSD 99 in Eastern New Providence', threat: 'High', response: 'Speed upgrade to 1 Gbps for at-risk REV households within 2 km of BTC fibre' },
  { date: '02 Oct 2026', who: 'BTC', move: 'Unlimited postpaid at BSD 55 with Disney+ bundle', threat: 'Medium', response: 'aliv Unlimited + REVTV app bundle; target convergent households' },
  { date: '19 Sep 2026', who: 'Starlink', move: 'Residential service marketed in Exuma and Long Island', threat: 'Medium', response: 'FWA pilot in Exuma Cays; position on price, local support and storm restoration' },
  { date: '28 Aug 2026', who: 'BTC', move: 'Grand Bahama fibre build announced (8K homes)', threat: 'High', response: 'Pre-emptive 24-month contracts with outage-credit guarantee' },
]

// ─── URCA regulatory calendar ────────────────────────────────────────────────
export const URCA_CALENDAR = [
  { due: '07 Nov 2026', item: 'Q3 Quality of Service report (fixed + mobile KPIs)', owner: 'Regulatory', status: 'Ready', source: 'URCA pack · Snowflake' },
  { due: '15 Nov 2026', item: 'Hurricane-season network resilience filing', owner: 'Network', status: 'In draft', source: 'NOC · storm model' },
  { due: '30 Nov 2026', item: 'Universal service contribution return', owner: 'Finance', status: 'In draft', source: 'NetSuite · Snowflake' },
  { due: '15 Dec 2026', item: 'Spectrum licence fee — 3.5 GHz band', owner: 'Finance', status: 'Scheduled', source: 'Spectrum register' },
  { due: '31 Jan 2027', item: 'Annual consumer complaints statistics', owner: 'Care', status: 'Not started', source: 'Genesys · ServiceNow' },
  { due: '28 Feb 2027', item: 'Number portability performance report', owner: 'Regulatory', status: 'Not started', source: 'MNP clearing house' },
  { due: '31 Mar 2027', item: 'Data Protection Act — annual processing register review', owner: 'DPO', status: 'Not started', source: 'Horizon catalog · tags' },
]

// ─── Tourism roaming ─────────────────────────────────────────────────────────
// Inbound roaming revenue tracks visitor arrivals (thousand visitors × BSD per visitor).
export const ROAMING = VISITOR_MONTHS.map(v => ({
  m: v.m, visitorsK: v.stopover + v.cruise,
  roamingK: round(v.stopover * 3.1 + v.cruise * 0.55, 0), // BSD thousands
  esimK: round(v.stopover * 0.42, 1), // aliv tourist eSIMs sold (thousands)
}))
export const ROAMING_TTM_BSD_M = round(ROAMING.reduce((s, r) => s + r.roamingK, 0) / 1000, 2)
