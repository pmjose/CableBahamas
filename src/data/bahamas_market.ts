// Bahamas market ML insights and cross-industry data products. Synthetic and
// indicative: visitor, cruise and storm figures are modelled for the demo, not
// official statistics. Every external product is aggregated with a minimum
// cell size (k ≥ 50 devices or households) and respects Data Protection Act
// consent; no individual-level data leaves Cable Bahamas.
import { FINANCE, round } from './scenario'
import { ISLANDS, type Island } from './islands'

export const K_ANON_MIN = 50

// ─── Tourism & visitor flows ─────────────────────────────────────────────────
// Visitor-days per month from the inbound roaming panel, scaled to the visitor
// population; split by island and source market.
export const VISITOR_MONTHS = [
  { m: 'Nov', stopover: 118, cruise: 520 }, { m: 'Dec', stopover: 156, cruise: 610 }, { m: 'Jan', stopover: 148, cruise: 640 },
  { m: 'Feb', stopover: 152, cruise: 655 }, { m: 'Mar', stopover: 171, cruise: 690 }, { m: 'Apr', stopover: 149, cruise: 610 },
  { m: 'May', stopover: 131, cruise: 560 }, { m: 'Jun', stopover: 138, cruise: 520 }, { m: 'Jul', stopover: 152, cruise: 545 },
  { m: 'Aug', stopover: 124, cruise: 500 }, { m: 'Sep', stopover: 84, cruise: 410 }, { m: 'Oct', stopover: 104, cruise: 470 },
] // thousands of visitors

export const VISITORS_BY_ISLAND: { island: Island; share: number; avgNights: number; spendIndex: number }[] = [
  { island: 'New Providence', share: 62, avgNights: 4.6, spendIndex: 100 }, { island: 'Grand Bahama', share: 12, avgNights: 4.1, spendIndex: 84 },
  { island: 'Exuma', share: 8, avgNights: 6.2, spendIndex: 142 }, { island: 'Eleuthera', share: 6, avgNights: 6.8, spendIndex: 131 },
  { island: 'Abaco', share: 6, avgNights: 6.5, spendIndex: 128 }, { island: 'Andros', share: 2, avgNights: 5.4, spendIndex: 96 },
  { island: 'Other Family Islands', share: 4, avgNights: 5.9, spendIndex: 118 },
]

export const SOURCE_MARKETS = [
  { market: 'United States', share: 81 }, { market: 'Canada', share: 9 }, { market: 'United Kingdom', share: 3 },
  { market: 'Europe (other)', share: 3 }, { market: 'Caribbean & Latin America', share: 4 },
]

// ─── ML insights (model outputs) ─────────────────────────────────────────────
const STOP = (m: string) => VISITOR_MONTHS.find(v => v.m === m)!.stopover

export type MlInsight = {
  id: string; title: string; model: string; method: string; finding: string; value: string; valueLabel: string
  confidence: number; action: string; impactBsd: number; owner: string; route: string
}

export const ML_INSIGHTS: MlInsight[] = [
  { id: 'visitor-forecast', title: 'Visitor demand forecast · winter season', model: 'visitor_demand_ts', method: 'Gradient-boosted time series on roaming panel + flight schedules', finding: `Stopover visitors rise from ${STOP('Oct')}K in October to ${STOP('Dec')}K in December and peak at ${STOP('Mar')}K in March; Exuma's peak runs a week behind New Providence.`, value: `+${Math.round((STOP('Dec') / STOP('Oct') - 1) * 100)}%`, valueLabel: 'Dec vs Oct stopovers', confidence: 0.86, action: 'Pre-provision Wi-Fi and mobile capacity at Cable Beach and Paradise Island resorts; sell the forecast to hotels.', impactBsd: 240_000, owner: 'Data Products', route: 'bahamas-data' },
  { id: 'cruise-footfall', title: 'Cruise-day footfall · Bay Street', model: 'cruise_footfall_xgb', method: 'XGBoost on ship manifests (berth schedule) × hourly device counts', finding: 'Each additional mega-ship in port adds about 4,100 visitors on Bay Street between 10:00 and 15:00; 6-ship days saturate the downtown cells by 11:00.', value: '4.1K', valueLabel: 'visitors / ship', confidence: 0.81, action: 'Add temporary small cells on 6-ship days; offer hourly footfall to Bay Street retailers and the port.', impactBsd: 180_000, owner: 'Network + Data Products', route: 'bahamas-data' },
  { id: 'churn-drivers', title: 'Churn drivers · Grand Bahama', model: 'churn_xgb (SHAP)', method: 'XGBoost churn model with SHAP attribution on 74.4K fixed accounts', finding: 'Two outages in 90 days triples churn odds; BTC fibre availability on the street is the second driver. Together they explain 58% of excess Grand Bahama churn.', value: '58%', valueLabel: 'of excess churn explained', confidence: 0.84, action: 'Pair proactive outage credits with a speed upgrade for households near BTC fibre.', impactBsd: 410_000, owner: 'Retention', route: 'churn-retention' },
  { id: 'storm-recovery', title: 'Hurricane recovery predictor', model: 'storm_recovery_gbm', method: 'Survival model on past storm outages × aerial plant, generator and road access', finding: 'Abaco restoration is predicted to take 2.4× longer than Grand Bahama for the same storm category, driven by aerial plant share and ferry dependence.', value: '2.4×', valueLabel: 'Abaco vs Grand Bahama', confidence: 0.78, action: 'Pre-stage generators and a splice crew on Abaco before the cone reaches 72 hours.', impactBsd: 320_000, owner: 'Resilience', route: 'noc-map' },
  { id: 'outage-anomaly', title: 'Outage anomaly detection', model: 'network_anomaly_iforest', method: 'Isolation forest on site-day availability and alarm counts', finding: 'Three Freeport nodes show the alarm pattern that preceded 4 of the last 5 CMTS failures; expected failure within 10 days.', value: '3', valueLabel: 'nodes at risk', confidence: 0.73, action: 'Schedule preventive card swaps on FPO-007, FPO-012 and FPO-019 this week.', impactBsd: 95_000, owner: 'Network Ops', route: 'incidents' },
  { id: 'inclusion-gap', title: 'Digital inclusion gap', model: 'inclusion_score', method: 'Clustering on coverage, take-up, affordability and device mix by settlement', finding: '41 Family Island settlements fall below the inclusion threshold; 63% of them already have fibre within 2 km.', value: '41', valueLabel: 'settlements below threshold', confidence: 0.8, action: 'Target the universal service fund and a BSD 25 social tariff at the 26 settlements with nearby fibre.', impactBsd: 150_000, owner: 'Regulatory + Strategy', route: 'regulatory' },
]

// ─── Cruise-day footfall (Bay Street, hourly, a 5-ship day vs a 1-ship day) ──
export const CRUISE_HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = 7 + i
  const curve = Math.exp(-((h - 12.5) ** 2) / 7)
  return { h: `${String(h).padStart(2, '0')}:00`, fiveShip: Math.round(1_800 + 20_500 * curve), oneShip: Math.round(1_800 + 4_100 * curve) }
})

export const PORT_CALENDAR = [
  { day: 'Mon', ships: 4, visitors: 18_400 }, { day: 'Tue', ships: 3, visitors: 13_900 }, { day: 'Wed', ships: 5, visitors: 22_300 },
  { day: 'Thu', ships: 6, visitors: 26_800 }, { day: 'Fri', ships: 5, visitors: 21_700 }, { day: 'Sat', ships: 3, visitors: 12_600 },
  { day: 'Sun', ships: 2, visitors: 8_900 },
]

// ─── Hurricane mobility & recovery (storm replay, Sep 2026 Tropical Storm) ───
export const STORM_TIMELINE = [
  { t: 'T-72h', abaco: 100, grandBahama: 100, nassauInflow: 0 }, { t: 'T-48h', abaco: 96, grandBahama: 97, nassauInflow: 1.2 },
  { t: 'T-24h', abaco: 88, grandBahama: 91, nassauInflow: 3.4 }, { t: 'Landfall', abaco: 84, grandBahama: 89, nassauInflow: 4.1 },
  { t: 'T+24h', abaco: 79, grandBahama: 90, nassauInflow: 4.3 }, { t: 'T+72h', abaco: 82, grandBahama: 94, nassauInflow: 3.6 },
  { t: 'T+7d', abaco: 91, grandBahama: 98, nassauInflow: 1.9 }, { t: 'T+14d', abaco: 97, grandBahama: 100, nassauInflow: 0.6 },
] // abaco / grandBahama: resident devices present (% of baseline); nassauInflow: thousands of evacuee devices in Nassau

export const RECOVERY_BY_ISLAND = [
  { island: 'Grand Bahama', restore80: 1.8, restore95: 5.5 }, { island: 'Abaco', restore80: 4.3, restore95: 13.2 },
  { island: 'Eleuthera', restore80: 2.6, restore95: 7.9 }, { island: 'Andros', restore80: 3.4, restore95: 10.6 },
] // days to restore 80% / 95% of service (predicted for a Cat 3)

// ─── Insurance & catchment risk ──────────────────────────────────────────────
export const RISK_BY_ISLAND: { island: Island; hurricaneRisk: number; outageDaysPerYr: number; aerialShare: number; insuredValueIdx: number }[] = [
  { island: 'New Providence', hurricaneRisk: 54, outageDaysPerYr: 0.6, aerialShare: 38, insuredValueIdx: 100 },
  { island: 'Grand Bahama', hurricaneRisk: 71, outageDaysPerYr: 1.4, aerialShare: 52, insuredValueIdx: 61 },
  { island: 'Abaco', hurricaneRisk: 83, outageDaysPerYr: 2.3, aerialShare: 64, insuredValueIdx: 34 },
  { island: 'Eleuthera', hurricaneRisk: 66, outageDaysPerYr: 1.2, aerialShare: 49, insuredValueIdx: 28 },
  { island: 'Exuma', hurricaneRisk: 62, outageDaysPerYr: 1.0, aerialShare: 44, insuredValueIdx: 31 },
  { island: 'Andros', hurricaneRisk: 74, outageDaysPerYr: 1.9, aerialShare: 58, insuredValueIdx: 12 },
  { island: 'Other Family Islands', hurricaneRisk: 70, outageDaysPerYr: 1.7, aerialShare: 55, insuredValueIdx: 18 },
] // hurricaneRisk 0–100 composite (exposure × plant fragility × historical outage)

export const CATCHMENTS = [
  { site: 'Cable Beach strip', visitorsWk: 41_000, residentsWk: 22_000, topOrigin: 'US visitors (stopover)' },
  { site: 'Bay Street, Nassau', visitorsWk: 118_000, residentsWk: 35_000, topOrigin: 'Cruise visitors' },
  { site: 'Harbour Bay plaza', visitorsWk: 6_000, residentsWk: 48_000, topOrigin: 'Eastern New Providence residents' },
  { site: 'Port Lucaya Marketplace', visitorsWk: 14_000, residentsWk: 9_000, topOrigin: 'Cruise + stopover' },
  { site: 'George Town, Exuma', visitorsWk: 7_500, residentsWk: 2_600, topOrigin: 'Yacht and stopover visitors' },
]

// ─── Digital inclusion ───────────────────────────────────────────────────────
export const INCLUSION_BY_ISLAND = ISLANDS.map(i => ({
  island: i.island,
  takeUpPct: Math.round(i.fixedSubs / i.homesPassed * 100),
  cov5g: i.cov5g,
  settlementsBelow: { 'New Providence': 0, 'Grand Bahama': 3, Abaco: 7, Eleuthera: 8, Exuma: 6, Andros: 9, 'Other Family Islands': 8 }[i.island],
}))

// ─── Data products catalog and monetisation ──────────────────────────────────
export type DataProduct = {
  id: string; name: string; tagline: string; industry: string; buyers: string[]; inputs: string[]
  delivery: string; pricing: string; refresh: string; minCell: number
  customers: number; arrBsd: number; pipelineBsd: number; status: 'Live' | 'Pilot' | 'Launching'
  sample: string
}

// Live products reconcile to the BSD 60K/month marketplace on Sharing & Marketplace:
// Cruise-Day Footfall = CBL_AGGREGATED_FOOTFALL (BSD 18K/mo); Visitor Flows + Island Risk
// Index = CBL_NETWORK_INTEL_LISTING (BSD 42K/mo). Pilots and launches are additional.
export const DATA_PRODUCTS: DataProduct[] = [
  { id: 'tourism', name: 'Visitor Flows Bahamas', tagline: 'Where visitors go, how long they stay and where they come from, by island and week.', industry: 'Tourism & hospitality', buyers: ['Ministry of Tourism', 'Resorts and hotel groups', 'Airlines and tour operators'], inputs: ['Inbound roaming (aliv)', 'Wi-Fi presence at partner hotels', 'Flight schedules'], delivery: 'Snowflake private listing + monthly report', pricing: 'BSD 4,000–12,000 / month by tier', refresh: 'Weekly', minCell: 100, customers: 6, arrBsd: 288_000, pipelineBsd: 380_000, status: 'Live', sample: 'Exuma visitors stay 6.2 nights on average against 4.6 in New Providence, with 42% higher spend.' },
  { id: 'cruise', name: 'Cruise-Day Footfall', tagline: 'Hourly footfall around Nassau and Freeport cruise ports, forecast from the berth schedule.', industry: 'Retail & transport', buyers: ['Nassau Cruise Port', 'Bay Street retailers', 'Taxi and tour operators'], inputs: ['Device counts per cell (aggregated)', 'Berth schedule'], delivery: 'API + dashboard (Streamlit in Snowflake)', pricing: 'BSD 600 / month per retailer; enterprise BSD 6,000', refresh: 'Hourly', minCell: 50, customers: 22, arrBsd: 216_000, pipelineBsd: 140_000, status: 'Live', sample: 'On a 5-ship day Bay Street footfall peaks at about 22,000 between 12:00 and 13:00.' },
  { id: 'hurricane', name: 'Storm Mobility & Recovery', tagline: 'Evacuation flows and service restoration by island, before, during and after storms.', industry: 'Public safety & relief', buyers: ['NEMA', 'Red Cross and relief NGOs', 'Insurers (claims teams)'], inputs: ['Device presence by island (aggregated)', 'Network restoration telemetry'], delivery: 'Secure share; free to NEMA, paid for insurers', pricing: 'Free for public safety; BSD 25,000 per season for insurers', refresh: 'Every 15 min during an event', minCell: 50, customers: 4, arrBsd: 75_000, pipelineBsd: 150_000, status: 'Pilot', sample: 'In the September storm, 4,300 Abaco devices moved to Nassau within 24 hours of landfall.' },
  { id: 'insurance', name: 'Island Risk Index', tagline: 'Hurricane exposure, outage history and infrastructure fragility by neighbourhood.', industry: 'Insurance & banking', buyers: ['Property insurers', 'Banks (mortgage risk)', 'Reinsurers'], inputs: ['Outage history per site', 'Aerial vs underground plant', 'Generator coverage'], delivery: 'Snowflake data clean room', pricing: 'BSD 72,000 / year per insurer', refresh: 'Monthly', minCell: 50, customers: 3, arrBsd: 216_000, pipelineBsd: 240_000, status: 'Live', sample: 'Abaco scores 83/100 on hurricane risk, driven by 64% aerial plant and 2.3 outage days a year.' },
  { id: 'catchment', name: 'Retail & Real-Estate Catchment', tagline: 'Who visits a location, when and from where, for site selection and leasing.', industry: 'Retail & real estate', buyers: ['Supermarket and retail chains', 'Family Island developers', 'Commercial landlords'], inputs: ['Aggregated device origin–destination', 'Census-style household counts'], delivery: 'Clean room + quarterly site reports', pricing: 'BSD 3,500 per site study; BSD 30,000 / year subscription', refresh: 'Monthly', minCell: 50, customers: 5, arrBsd: 105_000, pipelineBsd: 160_000, status: 'Pilot', sample: 'Harbour Bay plaza draws 48,000 residents a week, mostly from eastern New Providence.' },
  { id: 'inclusion', name: 'Digital Inclusion Atlas', tagline: 'Coverage, take-up and affordability gaps by settlement for policy and funding.', industry: 'Government & development', buyers: ['URCA', 'Ministry of Economic Affairs', 'Central Bank (Sand Dollar adoption)', 'Development banks'], inputs: ['Coverage and take-up by settlement', 'Device and plan mix (aggregated)'], delivery: 'Free open-data tier + funded deep-dive', pricing: 'Open data free; analysis projects BSD 40,000–90,000', refresh: 'Quarterly', minCell: 50, customers: 2, arrBsd: 60_000, pipelineBsd: 130_000, status: 'Launching', sample: '41 Family Island settlements are below the inclusion threshold, and 26 have fibre within 2 km.' },
]

export const LIVE_ARR = DATA_PRODUCTS.filter(p => p.status === 'Live').reduce((s, p) => s + p.arrBsd, 0)
export const DATA_PRODUCT_ARR = DATA_PRODUCTS.reduce((s, p) => s + p.arrBsd, 0)
export const DATA_PRODUCT_PIPELINE = DATA_PRODUCTS.reduce((s, p) => s + p.pipelineBsd, 0)
export const DATA_PRODUCT_SHARE_OF_REVENUE = round(DATA_PRODUCT_ARR / (FINANCE.monthlyRevenueM * 12e6) * 100, 2)

export const REVENUE_PLAN = [
  { fy: 'FY25', arr: 0.31 }, { fy: 'FY26', arr: round(DATA_PRODUCT_ARR / 1e6, 2) }, { fy: 'FY27', arr: 1.55 }, { fy: 'FY28', arr: 2.4 },
] // BSD M ARR

export const ARR_BY_INDUSTRY = DATA_PRODUCTS.map(p => ({ industry: p.industry, arr: round(p.arrBsd / 1e6, 3), pipeline: round(p.pipelineBsd / 1e6, 3) }))

export const PRIVACY_CONTROLS = [
  { control: 'Minimum cell size', detail: `No figure below ${K_ANON_MIN} devices or households; suppressed otherwise.` },
  { control: 'Consent', detail: 'Residential data used only where Data Protection Act consent allows analytics; opt-outs excluded within 24h.' },
  { control: 'No individual data', detail: 'Only aggregates leave Cable Bahamas; partners run joins in a clean room, never on raw rows.' },
  { control: 'Roaming visitors', detail: 'Inbound roamers are counted, never identified; home operator and country only.' },
  { control: 'Public safety', detail: 'Storm mobility is free to NEMA and relief agencies; commercial buyers get delayed, coarser data.' },
  { control: 'Audit', detail: 'Every query by a partner is logged and reviewable by the Data Protection Officer.' },
]
