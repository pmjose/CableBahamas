import { MONTHLY_REVENUE_LANES, QUARTER_REVENUE_M, round } from '../../data/scenario'
// Mobile / RAN demo data for Cable Bahamas. Deterministic and operator-grade.

export type MobileSite = {
  id: string
  city: string
  region: string
  lat: number
  lng: number
  tech: '5G SA' | '5G NSA' | '4G' | '3G' | '2G'
  vendor: 'Ericsson' | 'Nokia' | 'Huawei' | 'Samsung'
  trafficTBd: number
  congestionPct: number
  uptime: number
}

export const MOBILE_KPIS = {
  cov5gPop: 89.4,
  cov4gPop: 99.6,
  activeSites: 220,
  ownedSites: 160,
  sharedSites: 60,
  avgDLMbps: 145.2,
  avgULMbps: 38.4,
  dropCallPct: 0.42,
  voltePct: 96.3,
  vonrPct: 18.4,
  mos: 4.21,
  postDialDelayMs: 920,
  totalSubscribers: 180_500,
  monthlyDataPB: 412.8,
}

// Spectrum holdings (paired or unpaired MHz per band)
export const SPECTRUM = [
  { band: '700 MHz',  mhz: 20, type: 'FDD',  primary: '5G',  color: '#FF4438' },
  { band: '800 MHz',  mhz: 20, type: 'FDD',  primary: '4G',  color: '#FF8585' },
  { band: '1800 MHz', mhz: 40, type: 'FDD',  primary: '4G',  color: '#FF2D2D' },
  { band: '2100 MHz', mhz: 30, type: 'FDD',  primary: '4G',  color: '#94A3B8' },
  { band: '2600 MHz', mhz: 40, type: 'FDD',  primary: '4G',  color: '#3B82F6' },
  { band: '3500 MHz', mhz: 100, type: 'TDD', primary: '5G',  color: '#10B981' },
  { band: '26 GHz',   mhz: 200, type: 'TDD', primary: '5G mmWave', color: '#8B5CF6' },
]

// 90-day traffic by tech (TB/day)
export const TRAFFIC_BY_TECH: { day: number; t5gSA: number; t5gNSA: number; t4g: number }[] = (() => {
  const out: { day: number; t5gSA: number; t5gNSA: number; t4g: number }[] = []
  for (let i = 0; i < 90; i++) {
    const t5gSA = 28 + i * 0.45 + Math.sin(i / 5) * 2
    const t5gNSA = 142 + i * 0.6 + Math.sin(i / 7) * 4
    const t4g = 240 - i * 0.3 + Math.cos(i / 6) * 5
    out.push({ day: i, t5gSA: Math.round(t5gSA * 10) / 10, t5gNSA: Math.round(t5gNSA * 10) / 10, t4g: Math.round(t4g * 10) / 10 })
  }
  return out
})()

// MNO benchmark — Cable Bahamas vs BTC vs Benchmark A vs Benchmark B
export const MNO_BENCHMARK = [
  { metric: 'DL Throughput (Mbps)', vfes: 145, btc: 152, orange: 138, digi: 121 },
  { metric: 'UL Throughput (Mbps)', vfes: 38,  btc: 41,  orange: 35,  digi: 30 },
  { metric: '5G Coverage (%)',      vfes: 89,  btc: 84,  orange: 87,  digi: 76 },
  { metric: '4G Coverage (%)',      vfes: 99.5, btc: 99.2, orange: 99.4, digi: 98.6 },
  { metric: 'MOS',                  vfes: 4.21, btc: 4.18, orange: 4.14, digi: 4.05 },
  { metric: 'Drop-call (%)',        vfes: 0.42, btc: 0.48, orange: 0.51, digi: 0.62 },
]

// Top 20 cells by traffic
const CITY_LACBLG: Record<string, [number, number]> = {
  Nassau:    [25.0443,  -77.3504],
  Freeport:      [26.5333,  -78.7],
  Abaco:     [26.5412,  -77.0636],
  Eleuthera:     [25.1962,  -76.2431],
  Exuma:    [23.5,  -75.7667],
  Andros:   [24.7064,  -77.7902],
  Bimini:   [25.727,  -79.2972],
  "Long Island":      [23.25,  -75.1],
  Inagua:       [20.95,  -73.6731],
  "New Providence":   [25.06,  -77.345],
}

const VENDORS: MobileSite['vendor'][] = ['Ericsson', 'Nokia', 'Huawei', 'Samsung']
const TECHS: MobileSite['tech'][] = ['5G SA', '5G NSA', '4G', '4G', '4G']

export const TOP_CELLS: MobileSite[] = (() => {
  const cities = Object.keys(CITY_LACBLG)
  const out: MobileSite[] = []
  for (let i = 0; i < 20; i++) {
    const city = cities[i % cities.length]
    const [lat, lng] = CITY_LACBLG[city]
    const offsetX = ((i * 37) % 100 - 50) / 200
    const offsetY = ((i * 53) % 100 - 50) / 200
    out.push({
      id: `CELL-${(10000 + i * 137).toString().padStart(5, '0')}`,
      city,
      region: city,
      lat: lat + offsetY,
      lng: lng + offsetX,
      tech: TECHS[i % TECHS.length],
      vendor: VENDORS[i % VENDORS.length],
      trafficTBd: Math.round((4.8 + (20 - i) * 0.18) * 10) / 10,
      congestionPct: Math.round((75 - i * 1.6) * 10) / 10,
      uptime: 99.5 + ((i * 13) % 50) / 100,
    })
  }
  return out
})()

// Voice quality 12-month trend
export const VOICE_QUALITY: { month: string; dropPct: number; mos: number; pddMs: number }[] = [
  { month: 'Jun', dropPct: 0.62, mos: 4.05, pddMs: 980 },
  { month: 'Jul', dropPct: 0.59, mos: 4.07, pddMs: 970 },
  { month: 'Aug', dropPct: 0.55, mos: 4.10, pddMs: 960 },
  { month: 'Sep', dropPct: 0.52, mos: 4.12, pddMs: 955 },
  { month: 'Oct', dropPct: 0.51, mos: 4.14, pddMs: 950 },
  { month: 'Nov', dropPct: 0.49, mos: 4.16, pddMs: 945 },
  { month: 'Dec', dropPct: 0.48, mos: 4.17, pddMs: 940 },
  { month: 'Jan', dropPct: 0.47, mos: 4.18, pddMs: 935 },
  { month: 'Feb', dropPct: 0.46, mos: 4.19, pddMs: 930 },
  { month: 'Mar', dropPct: 0.45, mos: 4.20, pddMs: 925 },
  { month: 'Apr', dropPct: 0.44, mos: 4.20, pddMs: 922 },
  { month: 'May', dropPct: 0.42, mos: 4.21, pddMs: 920 },
]

// Vendor mix (RAN nodes)
export const VENDOR_MIX = [
  { name: 'Ericsson', value: 38, color: '#0050A0' },
  { name: 'Nokia',    value: 28, color: '#124191' },
  { name: 'Huawei',   value: 22, color: '#E40520' },
  { name: 'Samsung',  value: 12, color: '#1428A0' },
]

// Coverage by region (5G %)
export const COVERAGE_BY_REGION = [
  { region: 'Nassau',         cov5g: 96, cov4g: 100,  sites: 2840 },
  { region: 'Grand Bahama',   cov5g: 94, cov4g: 99.8, sites: 3120 },
  { region: 'New Providence Region', cov5g: 88, cov4g: 99.6, sites: 3680 },
  { region: 'Cat Island Province',  cov5g: 91, cov4g: 99.8, sites: 2240 },
  { region: 'Eleuthera', cov5g: 92, cov4g: 99.7, sites: 1380 },
  { region: 'Abaco',   cov5g: 82, cov4g: 99.2, sites: 1920 },
  { region: 'Cat Island',         cov5g: 78, cov4g: 99.0, sites: 2080 },
  { region: 'Rest of The Bahamas',   cov5g: 84, cov4g: 99.4, sites: 4924 },
]

// Roadmap programmes
export const MOBILE_ROADMAP = [
  { prog: '5G SA national rollout',       rag: 'Green',  pct: 62, eta: 'Q4 2026', capex: 280, owner: 'RAN Engineering' },
  { prog: 'Open RAN New Providence pilot',       rag: 'Amber',  pct: 28, eta: 'Q2 2027', capex: 64,  owner: 'Innovation' },
  { prog: 'Network Slicing for Enterprise',rag: 'Green', pct: 48, eta: 'Q3 2026', capex: 38,  owner: 'B2B' },
  { prog: 'mmWave fixed-wireless trial',  rag: 'Red',    pct: 12, eta: 'Q1 2027', capex: 22,  owner: 'Innovation' },
  { prog: 'Island Towers (demo) tower share expansion',  rag: 'Green',  pct: 78, eta: 'Q3 2026', capex: 85,  owner: 'TowerCo' },
  { prog: 'VoNR rollout',                 rag: 'Green',  pct: 42, eta: 'Q4 2026', capex: 28,  owner: 'Core Voice' },
]

// === Live mobile incidents ===
export type MobileIncident = {
  id: string
  severity: 'P1' | 'P2' | 'P3'
  cell: string
  region: string
  type: 'Drop-call spike' | 'Cell congestion' | 'VoLTE registration fail' | 'VoNR registration fail' | 'RAN backhaul loss' | 'Antenna alignment'
  affectedSubs: number
  startedMin: number
  status: 'Investigating' | 'Mitigating' | 'Recovering'
}

export const MOBILE_INCIDENTS: MobileIncident[] = [
  { id: 'MNI-78421', severity: 'P1', cell: 'CELL-10000', region: 'Nassau',    type: 'RAN backhaul loss',         affectedSubs: 14200, startedMin: 8,  status: 'Mitigating' },
  { id: 'MNI-78420', severity: 'P2', cell: 'CELL-12480', region: 'Freeport', type: 'Cell congestion',           affectedSubs:  4820, startedMin: 22, status: 'Investigating' },
  { id: 'MNI-78419', severity: 'P2', cell: 'CELL-13690', region: 'Eleuthera',   type: 'Drop-call spike',           affectedSubs:  2100, startedMin: 31, status: 'Investigating' },
  { id: 'MNI-78418', severity: 'P3', cell: 'CELL-14962', region: 'Abaco',  type: 'VoLTE registration fail',   affectedSubs:   840, startedMin: 47, status: 'Recovering' },
  { id: 'MNI-78417', severity: 'P3', cell: 'CELL-15482', region: 'Bimini',    type: 'VoNR registration fail',    affectedSubs:   320, startedMin: 62, status: 'Recovering' },
]

// === Mobile field dispatch today ===
export const MOBILE_DISPATCH_TODAY = [
  { type: 'Cell-site visit',     count: 24, eta: 'avg 2h',   crew: 'RAN' },
  { type: 'Antenna swap',        count: 6,  eta: 'avg 4h',   crew: 'Tower' },
  { type: 'RU module replace',   count: 9,  eta: 'avg 90m',  crew: 'RAN' },
  { type: 'Microwave realign',   count: 3,  eta: 'avg 3h',   crew: 'Tower' },
  { type: 'Power/UPS battery',   count: 5,  eta: 'avg 2h',   crew: 'RAN' },
]

// === Mobile inventory (RU/BBU/MEC/antennas) ===
export const MOBILE_INVENTORY = [
  { sku: 'AIR-6488 (Ericsson)',   type: 'Massive MIMO Radio',  qty: 1240, vendor: 'Ericsson', eos: '2030' },
  { sku: 'AAU 5613 (Huawei)',     type: 'Massive MIMO Radio',  qty:  860, vendor: 'Huawei',   eos: '2029' },
  { sku: 'AirScale BBU (Nokia)',  type: 'Baseband Unit',       qty: 2180, vendor: 'Nokia',    eos: '2031' },
  { sku: 'Samsung MEC v3',        type: 'Edge Compute Node',   qty:   42, vendor: 'Samsung',  eos: '2032' },
  { sku: 'Kathrein 4-port',       type: 'Passive Antenna',     qty: 4860, vendor: 'Kathrein', eos: '2028' },
  { sku: 'AirScale 5G mmWave',    type: 'mmWave Radio',        qty:   18, vendor: 'Nokia',    eos: '2033' },
]

// === RAN builds this quarter ===
export const RAN_BUILDS = [
  { region: 'Nassau',         new5gSites: 38, refarmed: 64, totemShared: 22 },
  { region: 'Grand Bahama',   new5gSites: 42, refarmed: 58, totemShared: 28 },
  { region: 'New Providence Region', new5gSites: 56, refarmed: 84, totemShared: 36 },
  { region: 'Cat Island Province',  new5gSites: 28, refarmed: 38, totemShared: 18 },
  { region: 'Eleuthera', new5gSites: 18, refarmed: 24, totemShared: 12 },
  { region: 'Abaco',   new5gSites: 24, refarmed: 32, totemShared: 16 },
  { region: 'Rest of The Bahamas',   new5gSites: 64, refarmed: 96, totemShared: 42 },
]

// === Service uptime split by lane (Fixed/Mobile/Wholesale) ===
export const UPTIME_BY_LANE = [
  { lane: 'Fixed (FTTH)',    slo: 99.95, actual: 99.97, mttr: 28, color: '#3B82F6' },
  { lane: 'Fixed (HFC)',     slo: 99.90, actual: 99.93, mttr: 42, color: '#94A3B8' },
  { lane: 'Mobile RAN',      slo: 99.95, actual: 99.96, mttr: 18, color: '#FF4438' },
  { lane: 'Mobile Core',     slo: 99.99, actual: 99.99, mttr: 6,  color: '#FF8585' },
  { lane: 'Wholesale',       slo: 99.90, actual: 99.92, mttr: 36, color: '#10B981' },
]

// =============================================================================
// CUSTOMER-SIDE MOBILE CUTS — used by Customers section pages
// =============================================================================

// Base mix of customer types (sums to 100)
export const CUSTOMER_MIX_BY_LANE = [
  { lane: 'Fixed-only',  pct: 24, count: 1.04e6, arpu: 32.40, color: '#3B82F6' },
  { lane: 'Mobile-only', pct: 38, count: 1.65e6, arpu: 17.80, color: '#FF4438' },
  { lane: 'Convergent',  pct: 38, count: 1.65e6, arpu: 58.20, color: '#7C3AED' },
]

// CLV by lane — convergents are stickier and higher LTV
export const CLV_BY_LANE = [
  { lane: 'Fixed-only',  clv: 1180, churnAnnual: 14.2, tenureMonths: 38, ebitdaMargin: 31, color: '#3B82F6' },
  { lane: 'Mobile-only', clv:   720, churnAnnual: 18.6, tenureMonths: 26, ebitdaMargin: 28, color: '#FF4438' },
  { lane: 'Convergent',  clv: 2840, churnAnnual:  6.8, tenureMonths: 64, ebitdaMargin: 39, color: '#7C3AED' },
]

// Bundle propensity — mobile-led upgrade signals
export const MOBILE_PROPENSITY = [
  { signal: 'Likely to add mobile line',          target: 312000, lift: 2.4, channel: 'App + email', conversion: 11.8 },
  { signal: 'Likely to upgrade Mobile-only → Convergent', target: 184000, lift: 3.1, channel: 'Outbound + retention', conversion: 14.6 },
  { signal: 'Likely to add 2nd mobile (family)',  target: 142000, lift: 1.9, channel: 'App push',         conversion:  8.4 },
  { signal: 'Likely 5G plan upgrade',             target: 268000, lift: 1.7, channel: 'In-app',           conversion: 12.1 },
  { signal: 'High MNP risk (port-out)',           target:  48000, lift: 4.2, channel: 'Save desk',        conversion: 38.5 },
]

// Digital funnel split — Fixed vs Mobile vs Convergent
export const DIGITAL_FUNNEL_BY_LANE = [
  { stage: 'Visits',      fixed: 184000, mobile: 312000, convergent: 96000 },
  { stage: 'Configurator', fixed:  62000, mobile: 138000, convergent: 41000 },
  { stage: 'Cart',         fixed:  18400, mobile:  52400, convergent: 16800 },
  { stage: 'Checkout',     fixed:   9800, mobile:  31200, convergent: 11200 },
  { stage: 'Activated',    fixed:   8200, mobile:  27800, convergent: 10400 },
]

// CX — VOC + NPS split by network
export const CX_BY_NETWORK = [
  { network: 'Fixed (FTTH)', nps: 42, csat: 4.42, contactRate: 8.4,  topGripe: 'Setup time',          color: '#3B82F6' },
  { network: 'Fixed (HFC)',  nps: 28, csat: 4.18, contactRate: 12.8, topGripe: 'Speed during peak',   color: '#94A3B8' },
  { network: 'Mobile',       nps: 38, csat: 4.28, contactRate: 9.6,  topGripe: 'Indoor coverage',     color: '#FF4438' },
  { network: 'Convergent',   nps: 51, csat: 4.58, contactRate: 6.2,  topGripe: 'Bill clarity',        color: '#7C3AED' },
]

// Marketing — mobile-led campaigns in flight
export const MOBILE_CAMPAIGNS = [
  { name: '5G plan upsell',                channel: 'App + email',        budget: 480, spent: 312, leads: 31200, conv:  9.4, roi: 3.8, status: 'on-track' },
  { name: 'MNP win-back vs BTC',      channel: 'Outbound + SMS',     budget: 320, spent: 218, leads: 18400, conv: 14.2, roi: 5.2, status: 'on-track' },
  { name: 'Family plan switcher',          channel: 'Search + display',   budget: 280, spent: 184, leads: 22600, conv:  6.8, roi: 2.4, status: 'at-risk' },
  { name: 'Convergent upgrade (mobile-only base)', channel: 'Retention',  budget: 240, spent: 162, leads: 14200, conv: 18.6, roi: 6.4, status: 'on-track' },
  { name: 'eSIM activation drive',         channel: 'App push',           budget:  80, spent:  42, leads:  9400, conv:  4.2, roi: 1.8, status: 'monitoring' },
]

// Sales by lane — orders this period (k)
export const SALES_BY_LANE = [
  { lane: 'Fixed-only',  orders: 18.4, revenue:  6.8, margin: 31, color: '#3B82F6' },
  { lane: 'Mobile-only', orders: 64.2, revenue: 11.2, margin: 28, color: '#FF4438' },
  { lane: 'Convergent',  orders: 22.8, revenue: 14.6, margin: 39, color: '#7C3AED' },
]

// AI insights — mobile-themed
export const MOBILE_INSIGHTS = [
  { title: 'Mobile-only base shows BSD 184M Convergent upside',           detail: '184K customers within propensity score >0.7 — bundle to fixed for +BSD 32 ARPU lift', impact: 'BSD 184M', confidence: 0.81, agent: 'Cortex Analyst' },
  { title: 'Top 1% of cells driving 22% of mobile churn',               detail: 'Indoor coverage in Nassau Centre ring — 6.2K port-outs in last 90d are within these footprints', impact: '6.2K saves', confidence: 0.74, agent: 'Cortex Search' },
  { title: 'MNP win-back vs BTC in New Providence Region has 5.2× ROI',  detail: 'eSIM-led journey + 1st-month free promo converts at 14.2% — extend to Cat Island', impact: 'BSD 42M ARR',  confidence: 0.78, agent: 'Cortex Agents' },
]

// =============================================================================
// COMMERCIAL-SIDE MOBILE CUTS — used by Commercial section pages
// =============================================================================

// Finance: revenue & EBITDA split by Fixed vs Mobile lanes (BSD M, last quarter)
export const REVENUE_BY_LANE = MONTHLY_REVENUE_LANES.map(row=>({ ...row, revenue: round(row.revenue/12*QUARTER_REVENUE_M), ebitda: round(row.revenue/12*QUARTER_REVENUE_M*0.375),margin:37.5,growth:5 }))

// Pricing simulator: 5G mobile plan tiers
export const MOBILE_PLAN_TIERS = [
  { tier: 'S',  data: '20 GB',     voice: 'Unlimited', priceVfes: 12.90, priceBTC: 14.99, priceBenchmarkA: 13.99, priceBenchmarkC: 11.90, base: 50000 },
  { tier: 'M',  data: '60 GB',     voice: 'Unlimited', priceVfes: 17.90, priceBTC: 19.99, priceBenchmarkA: 18.99, priceBenchmarkC: 16.90, base: 70000 },
  { tier: 'L',  data: '150 GB',    voice: 'Unlimited', priceVfes: 22.90, priceBTC: 24.99, priceBenchmarkA: 23.99, priceBenchmarkC: 21.90, base: 40000 },
  { tier: 'XL', data: 'Unlimited', voice: 'Unlimited', priceVfes: 29.90, priceBTC: 32.99, priceBenchmarkA: 31.99, priceBenchmarkC: 28.90, base: 20500 },
]

// Bundle profitability: convergent + mobile-attach bundles
export const MOBILE_BUNDLES = [
  { bundle: 'Convergent · FTTH 1G + Mobile XL',  arpu: 78.90, base: 10000, churnAnnual:  4.8, ltv: 3260, mlMargin: 42, status: 'flagship' },
  { bundle: 'Convergent · FTTH 600 + Mobile L',  arpu: 64.90, base: 17000, churnAnnual:  5.6, ltv: 2640, mlMargin: 39, status: 'core' },
  { bundle: 'Convergent · FTTH 300 + Mobile M',  arpu: 49.90, base: 12000, churnAnnual:  6.4, ltv: 1980, mlMargin: 36, status: 'core' },
  { bundle: 'Mobile family pack (3+ lines)',     arpu: 48.90, base: 5000, churnAnnual:  7.2, ltv: 1680, mlMargin: 38, status: 'growth' },
  { bundle: 'Mobile + REVTV',              arpu: 32.90, base: 3000, churnAnnual:  9.4, ltv:   980, mlMargin: 31, status: 'growth' },
  { bundle: 'eSIM-only data plan',               arpu: 14.90, base: 2000, churnAnnual: 12.6, ltv:   420, mlMargin: 28, status: 'pilot' },
]

// Product catalog: mobile products
export const MOBILE_PRODUCTS = [
  { sku: 'V-MOB-XL-5GSA', name: '5G Unlimited XL',         tier: 'XL',  mrr: 29.90, attach:  840000, npsContribution: +6, status: 'live' },
  { sku: 'V-MOB-L-5GSA',  name: '5G L · 150 GB',           tier: 'L',   mrr: 22.90, attach: 1420000, npsContribution: +4, status: 'live' },
  { sku: 'V-MOB-M-5GSA',  name: '5G M · 60 GB',            tier: 'M',   mrr: 17.90, attach: 2680000, npsContribution: +2, status: 'live' },
  { sku: 'V-MOB-S-5GSA',  name: '5G S · 20 GB',            tier: 'S',   mrr: 12.90, attach: 1840000, npsContribution:  0, status: 'live' },
  { sku: 'V-MOB-FAM3',    name: 'Family pack · 3 lines',   tier: 'L',   mrr: 48.90, attach:  248000, npsContribution: +5, status: 'live' },
  { sku: 'V-MOB-ESIM',    name: 'eSIM data plan (digital)', tier: 'M',  mrr: 14.90, attach:   86000, npsContribution: +3, status: 'pilot' },
  { sku: 'V-MOB-IOT-M2M', name: 'IoT / M2M business line', tier: 'B2B', mrr:  4.90, attach: 1240000, npsContribution: +2, status: 'live' },
  { sku: 'V-MOB-VONR',    name: 'VoNR voice add-on',        tier: 'add', mrr:  0.00, attach:  920000, npsContribution: +4, status: 'live' },
]

// B2B mobile: M2M/IoT/MVNO
export const B2B_MOBILE = [
  { segment: 'M2M / IoT lines',          lines: 5500, mrr: 4.90, monthlyRev: 0.027, growth: 22.8, accounts: 1840 },
  { segment: 'Enterprise mobile pool',   lines: 10000, mrr: 24.50, monthlyRev: 0.245, growth:  8.4, accounts: 184 },
  { segment: 'SME mobile bundles',       lines: 15000, mrr: 19.90, monthlyRev: 0.2985, growth:  6.2, accounts: 4280 },
  { segment: 'MVNO wholesale (fictional partners)',lines: 2500, mrr: 6.20, monthlyRev: 0.0155, growth:  3.4, accounts:    8 },
  { segment: 'Private 5G networks',      lines: 100, mrr: 142.0, monthlyRev: 0.0142, growth: 84.2, accounts:   24 },
]

// Procurement: mobile RAN vendor spend (BSD M, TTM PO commitment)
export const MOBILE_RAN_PROCUREMENT = [
  { vendor: 'Ericsson',  category: 'RU + BBU + AMF',     spendTtm: 184.2, openPO:  68.4, paymentTerms: 'NET-60', risk: 'Low',    color: '#0066B3' },
  { vendor: 'Nokia',     category: 'AirScale BBU + RU',  spendTtm:  92.4, openPO:  34.6, paymentTerms: 'NET-60', risk: 'Low',    color: '#124191' },
  { vendor: 'Huawei',    category: 'Refarm + microwave', spendTtm:  42.6, openPO:  12.8, paymentTerms: 'NET-30', risk: 'Watch',  color: '#FF0000' },
  { vendor: 'Samsung',   category: 'Open RAN RU',        spendTtm:  28.4, openPO:  18.2, paymentTerms: 'NET-45', risk: 'Low',    color: '#1428A0' },
  { vendor: 'Mavenir',   category: 'Open RAN CU/DU',     spendTtm:  22.8, openPO:  14.6, paymentTerms: 'NET-30', risk: 'Medium', color: '#7B68EE' },
  { vendor: 'Fujitsu',   category: 'Open RAN RU (pilot)',spendTtm:  12.4, openPO:   8.4, paymentTerms: 'NET-30', risk: 'Medium', color: '#FF0000' },
  { vendor: 'Kathrein',  category: 'Antennas',           spendTtm:  14.2, openPO:   4.8, paymentTerms: 'NET-45', risk: 'Low',    color: '#003F7F' },
  { vendor: 'Island Towers (demo)',     category: 'Tower-share lease',  spendTtm:  64.8, openPO:  16.2, paymentTerms: 'NET-90', risk: 'Low',    color: '#FF4438' },
]

// =============================================================================
// GOVERNANCE-SIDE MOBILE CUTS — used by Governance section pages
// =============================================================================

// Regulatory: mobile / spectrum / 5G / Open RAN obligations
export const MOBILE_REGULATORY = [
  { id: 'URCA-5G-OBL',   body: 'URCA',         topic: 'Spectrum 700 MHz coverage obligation', dueDate: 'Q4 2026', status: 'on-track', impact: '95% pop coverage by Dec-26',                  risk: 'Medium' },
  { id: 'EU-5G-TOOLBOX', body: 'EU Comm.',     topic: 'EU 5G Toolbox · high-risk vendor cap',  dueDate: 'Q2 2027', status: 'on-track', impact: 'Huawei share <20% in core (currently 12%)',  risk: 'Low' },
  { id: 'URCA-MNP-RULE', body: 'URCA',         topic: 'MNP next-day port-in (24h SLA)',         dueDate: 'Live',    status: 'compliant', impact: 'eSIM port-in flow live · 99.4% on-time',     risk: 'Low' },
  { id: 'CCB-700-IND', body: 'URCA',          topic: '700 MHz indoor coverage rural reporting', dueDate: 'Q3 2026', status: 'at-risk',  impact: '38 sites in Cat Island behind plan', risk: 'High' },
  { id: 'URCA-WHOLE-MV', body: 'URCA',         topic: 'MVNO wholesale reference offer (RIO)',   dueDate: 'Live',    status: 'compliant', impact: '4 MVNOs (Mobile Vikings, Scarlet, etc.) on RIO', risk: 'Low' },
  { id: 'APD-LOC-DATA', body: 'APD',           topic: 'Location data · GDPR retention 90d',     dueDate: 'Live',    status: 'compliant', impact: 'Privacy review passed Q1 2026',              risk: 'Low' },
  { id: 'EU-DSA-EID',    body: 'EU Comm.',     topic: 'eID / eSIM identity verification',       dueDate: 'Q1 2027', status: 'in-flight', impact: 'eIDAS 2.0 wallet integration in design',     risk: 'Medium' },
  { id: 'URCA-ROAM',     body: 'BEREC + URCA', topic: 'EU intra-roaming "roam-like-at-home"',   dueDate: 'Live',    status: 'compliant', impact: 'Wholesale caps tracked monthly',             risk: 'Low' },
]

// ESG · RAN energy efficiency (kWh per terabyte traffic)
export const MOBILE_ESG = [
  { metric: 'RAN energy intensity',         value: '2.18 kWh/TB',   target: '1.80 kWh/TB',  trend: -8.4,  ytdProgress: 64, color: '#10B981' },
  { metric: 'Cell-site renewable %',        value: '78%',           target: '90%',          trend: +6.2,  ytdProgress: 72, color: '#10B981' },
  { metric: 'Sleep-mode 4G/5G hours/day',   value: '6.4h',          target: '8.0h',         trend: +1.8,  ytdProgress: 68, color: '#10B981' },
  { metric: 'Scope-2 mobile emissions',     value: '24.6 kt CO₂e',  target: '18.0 kt CO₂e', trend: -12.4, ytdProgress: 56, color: '#10B981' },
  { metric: 'Island Towers (demo) tower-share decarbon.',  value: '5,940 sites',   target: '6,500 sites',  trend: +8.6,  ytdProgress: 91, color: '#10B981' },
]

// Risk · mobile-specific
export const MOBILE_RISKS = [
  { id: 'MOB-R-01', risk: 'SIM-swap fraud (port-out abuse)',                     category: 'Fraud',     likelihood: 'Medium', impact: 'High',     residual: 'Medium', owner: 'CISO + Fraud',     mitigation: 'eKYC + SIM-swap delay 24h + Cortex anomaly detection', trend: 'down' },
  { id: 'MOB-R-02', risk: 'SS7 / Diameter signaling attacks',                     category: 'Cyber',     likelihood: 'Medium', impact: 'High',     residual: 'Medium', owner: 'CISO',             mitigation: 'STP firewall + GSMA SS7 hardening', trend: 'flat' },
  { id: 'MOB-R-03', risk: '5G core / AMF compromise',                             category: 'Cyber',     likelihood: 'Low',    impact: 'Critical', residual: 'Medium', owner: 'CISO',             mitigation: 'NESAS-certified vendors + zero-trust SBA', trend: 'flat' },
  { id: 'MOB-R-04', risk: 'RAN vendor concentration (Ericsson + Nokia 60%)',      category: 'Supplier',  likelihood: 'Low',    impact: 'High',     residual: 'Medium', owner: 'CTO + CPO',        mitigation: 'Open RAN diversification (Samsung/Mavenir/Fujitsu)', trend: 'down' },
  { id: 'MOB-R-05', risk: 'Spectrum auction outcome (3.5 GHz extension 2030)',    category: 'Regulatory',likelihood: 'Medium', impact: 'High',     residual: 'Medium', owner: 'CRO + Reg. affairs', mitigation: 'Long-range capex hedge + spectrum trading', trend: 'flat' },
  { id: 'MOB-R-06', risk: 'mmWave roll-out delay (planning permits)',             category: 'Operational',likelihood: 'High',  impact: 'Medium',   residual: 'Medium', owner: 'COO',              mitigation: 'Island Towers (demo) + small-cell street furniture deals', trend: 'flat' },
  { id: 'MOB-R-07', risk: 'GDPR breach via mobility / location data',             category: 'Privacy',   likelihood: 'Low',    impact: 'High',     residual: 'Low',    owner: 'DPO',              mitigation: 'Pseudonymisation + 90d retention + APD review', trend: 'down' },
  { id: 'MOB-R-08', risk: 'Power grid outage (cell-site battery autonomy 2h)',    category: 'Operational',likelihood: 'Medium', impact: 'High',     residual: 'Medium', owner: 'COO + Field Ops',  mitigation: 'Generators dispatch SLA 35min + battery uplift', trend: 'flat' },
]

// People · Mobile / RAN engineering function (headcount = 364)
export const MOBILE_PEOPLE = [
  { team: 'RAN engineering (5G SA + LTE)', headcount: 142, avgTenure: 4.8, attrition12m:  9.2, openRoles:  8, eNps: 46, color: '#FF4438' },
  { team: '5G core / packet (AMF/SMF/UPF)', headcount:  64, avgTenure: 5.6, attrition12m:  6.8, openRoles:  3, eNps: 52, color: '#FF8585' },
  { team: 'Mobile NOC',                     headcount:  48, avgTenure: 6.2, attrition12m:  8.4, openRoles:  2, eNps: 38, color: '#FF8585' },
  { team: 'Mobile field operations',        headcount:  72, avgTenure: 7.4, attrition12m: 11.2, openRoles:  4, eNps: 32, color: '#FFB0B0' },
  { team: 'Open RAN / SMO / RIC',           headcount:  18, avgTenure: 2.4, attrition12m: 12.8, openRoles:  6, eNps: 56, color: '#7C3AED' },
  { team: 'Spectrum & regulatory',          headcount:  12, avgTenure: 8.6, attrition12m:  4.2, openRoles:  1, eNps: 48, color: '#10B981' },
  { team: 'Mobile product & pricing',       headcount:   8, avgTenure: 5.2, attrition12m:  9.8, openRoles:  1, eNps: 44, color: '#3B82F6' },
]

// =============================================================================
// AI / ML + SECURITY-SIDE MOBILE CUTS
// =============================================================================

// Cortex Agents · mobile-domain agents
export const MOBILE_AGENTS = [
  { id: 'AGT-MOB-RAN',   name: 'Mobile RAN Ops Agent',         scope: 'Cell-site triage · alarm correlation · runbook auto-suggest', invocations: '124K/wk', model: 'Claude Sonnet 4', avgLatencyMs: 1240, accuracy: 91, status: 'live' },
  { id: 'AGT-MNP-WIN',   name: 'MNP win-back Agent',           scope: 'Detect port-out signal · personalised retention offer',         invocations:  '38K/wk', model: 'Llama-3.1-70B',  avgLatencyMs:  840, accuracy: 84, status: 'live' },
  { id: 'AGT-SIM-FRAUD', name: 'SIM-swap Fraud Agent',         scope: 'Score swap requests · eKYC trigger · auto-delay 24h',           invocations:  '16K/wk', model: 'Mistral Large 2',avgLatencyMs:  420, accuracy: 96, status: 'live' },
  { id: 'AGT-5G-CAP',    name: '5G Capacity Forecast Agent',   scope: 'Predict cell-load 7d ahead · trigger ENM densification',        invocations:  '8.4K/wk',model: 'Snowflake Arctic',avgLatencyMs:1620, accuracy: 88, status: 'live' },
  { id: 'AGT-OPN-RAN',   name: 'Open RAN Vendor Interop',      scope: 'Diagnose Mavenir↔Fujitsu interop · O-RAN spec match',           invocations:  '1.2K/wk',model: 'Claude Sonnet 4', avgLatencyMs: 2840, accuracy: 76, status: 'pilot' },
]

// Cortex Search · mobile knowledge bases
export const MOBILE_SEARCH_INDEXES = [
  { name: 'RAN_VENDOR_MANUALS',     description: 'Ericsson AIR / Nokia AirScale / Samsung vRAN runbooks', docs: 12480, sizeGb: 28.4, refreshHrs: 24, queriesDay: 4200,   topUser: 'Mobile NOC' },
  { name: 'GSMA_STANDARDS',         description: 'GSMA + 3GPP standards (5G SA, VoNR, SS7 hardening)',     docs:  6240, sizeGb: 14.2, refreshHrs: 168, queriesDay:  840,   topUser: 'RAN engineering' },
  { name: 'EU_5G_TOOLBOX_REGS',     description: 'EU 5G Toolbox · URCA + CCB regulatory corpus',         docs:   840, sizeGb:  2.6, refreshHrs: 24,  queriesDay:  120,   topUser: 'Spectrum & reg.' },
  { name: 'MOBILE_INCIDENT_KB',     description: 'Historical mobile P1/P2/P3 PIRs · root-cause patterns',  docs:  4280, sizeGb:  6.8, refreshHrs: 1,   queriesDay: 2400,   topUser: 'War Room' },
  { name: 'SIM_FRAUD_PATTERNS',     description: 'GSMA fraud patterns + Cable Bahamas SIM-swap case library',       docs:  1240, sizeGb:  1.4, refreshHrs: 6,   queriesDay:  680,   topUser: 'Fraud + CISO' },
]

// Semantic Views · mobile-domain
export const MOBILE_SEMANTIC_VIEWS = [
  { name: 'V_MOBILE_CUSTOMER_360',      tables: 18, dimensions: 42, metrics: 28, owner: 'Mobile Analytics', certified: true,  consumers: 124 },
  { name: 'V_RAN_TELEMETRY',            tables: 12, dimensions: 36, metrics: 64, owner: 'RAN engineering',  certified: true,  consumers:  84 },
  { name: 'V_5G_COVERAGE_MAP',          tables:  8, dimensions: 22, metrics: 14, owner: 'Spectrum',         certified: true,  consumers:  46 },
  { name: 'V_MNP_PORTABILITY',          tables:  6, dimensions: 18, metrics: 12, owner: 'Commercial',       certified: true,  consumers:  62 },
  { name: 'V_MOBILE_REVENUE_LANE',      tables:  9, dimensions: 14, metrics: 22, owner: 'Finance',          certified: true,  consumers:  38 },
  { name: 'V_OPEN_RAN_KPIS',            tables:  4, dimensions: 12, metrics: 18, owner: 'Open RAN',         certified: false, consumers:   8 },
]

// ML Registry · mobile models
export const MOBILE_MODELS = [
  { name: 'mobile_churn_xgb_v3.2',     task: 'Classification', accuracy: 0.84, drift: 0.04, lastRetrained: '6 days ago',  inferences: '1.2M/day', owner: 'Mobile Analytics', status: 'production' },
  { name: 'mnp_portout_lgbm_v2.1',     task: 'Classification', accuracy: 0.81, drift: 0.06, lastRetrained: '12 days ago', inferences: '420K/day', owner: 'Commercial',       status: 'production' },
  { name: 'cell_site_failure_lstm',    task: 'Time-series',    accuracy: 0.88, drift: 0.02, lastRetrained: '4 days ago',  inferences: '22K/day',  owner: 'RAN engineering',  status: 'production' },
  { name: 'sim_swap_fraud_iforest',    task: 'Anomaly',        accuracy: 0.93, drift: 0.05, lastRetrained: '8 days ago',  inferences: '180K/day', owner: 'Fraud + CISO',     status: 'production' },
  { name: 'congestion_forecast_arima', task: 'Time-series',    accuracy: 0.79, drift: 0.08, lastRetrained: '18 days ago', inferences: '46K/day',  owner: 'RAN engineering',  status: 'shadow' },
  { name: 'mobile_clv_dnn_v1.4',       task: 'Regression',     accuracy: 0.86, drift: 0.03, lastRetrained: '5 days ago',  inferences: '8K/day',   owner: 'Mobile Analytics', status: 'production' },
  { name: 'open_ran_anomaly_v0.3',     task: 'Anomaly',        accuracy: 0.71, drift: 0.12, lastRetrained: '2 days ago',  inferences: '4K/day',   owner: 'Open RAN',         status: 'experimental' },
]

// AI Spend · mobile workloads (BSD K monthly)
export const MOBILE_AI_SPEND = [
  { workload: 'Cortex Search · RAN_VENDOR_MANUALS',  monthlyEurK: 18.4, queries: 126000, costPerQuery: 0.146, trend: +6.2, governance: 'OK' },
  { workload: 'Cortex Search · GSMA_STANDARDS',      monthlyEurK:  4.2, queries:  25200, costPerQuery: 0.167, trend: +1.4, governance: 'OK' },
  { workload: 'Cortex Agent · Mobile RAN Ops',       monthlyEurK: 32.4, queries: 496000, costPerQuery: 0.065, trend: +12.4, governance: 'OK' },
  { workload: 'Cortex Agent · MNP win-back',         monthlyEurK: 12.8, queries: 152000, costPerQuery: 0.084, trend: +8.6, governance: 'OK' },
  { workload: 'Cortex Agent · SIM-swap Fraud',       monthlyEurK:  6.4, queries:  64000, costPerQuery: 0.100, trend: +4.2, governance: 'OK' },
  { workload: 'ML inference · mobile_churn_xgb',     monthlyEurK:  8.2, queries: 36e6,    costPerQuery: 0.00023, trend: +2.8, governance: 'OK' },
  { workload: 'ML inference · cell_site_failure',    monthlyEurK:  5.4, queries: 660000, costPerQuery: 0.0082, trend: +3.4, governance: 'OK' },
  { workload: 'AI_PARSE_DOCUMENT · vendor RFQs',     monthlyEurK:  2.8, queries:   840,   costPerQuery: 3.333, trend: +1.2, governance: 'Watch' },
]

// RBAC · mobile-specific roles
export const MOBILE_RBAC_ROLES = [
  { role: 'RAN_ENGINEER',          members: 142, parent: 'NETWORK_OPS',     dataAccess: 'V_RAN_TELEMETRY · V_5G_COVERAGE_MAP', warehouseAccess: 'NETWORK_WH · NETWORK_WH_LARGE',  pii: 'No',  lastReview: '4 days ago' },
  { role: 'MOBILE_NOC',            members:  48, parent: 'NETWORK_OPS',     dataAccess: 'V_RAN_TELEMETRY · V_MOBILE_CUSTOMER_360 (masked)', warehouseAccess: 'NETWORK_WH', pii: 'Masked', lastReview: '7 days ago' },
  { role: 'OPEN_RAN_OPS',          members:  18, parent: 'NETWORK_OPS',     dataAccess: 'V_OPEN_RAN_KPIS',                                  warehouseAccess: 'OPEN_RAN_WH',         pii: 'No',  lastReview: '12 days ago' },
  { role: 'MOBILE_FRAUD_ANALYST',  members:  14, parent: 'SECURITY',        dataAccess: 'V_MNP_PORTABILITY · SIM_FRAUD_PATTERNS',           warehouseAccess: 'FRAUD_WH',            pii: 'Yes (justified)', lastReview: '2 days ago' },
  { role: 'MOBILE_PRODUCT_OWNER',  members:   8, parent: 'COMMERCIAL',      dataAccess: 'V_MOBILE_REVENUE_LANE · V_MNP_PORTABILITY',        warehouseAccess: 'COMMERCIAL_WH',       pii: 'Aggregate only', lastReview: '5 days ago' },
  { role: 'MOBILE_DATA_SCIENTIST', members:  22, parent: 'DATA_SCIENCE',    dataAccess: '6 mobile semantic views (read-only)',              warehouseAccess: 'DS_WH_XL',            pii: 'Masked', lastReview: '3 days ago' },
]

// Trust Center · mobile compliance posture
export const MOBILE_TRUST = [
  { control: 'NESAS-certified RAN vendors',        framework: 'GSMA NESAS',     status: 'compliant', lastAssessed: '2026-Q1', evidence: 'Ericsson + Nokia + Samsung NESAS L3', owner: 'CISO' },
  { control: 'SS7 / Diameter STP firewall',        framework: 'GSMA FS.11',     status: 'compliant', lastAssessed: '2026-Q1', evidence: 'Mavenir STP firewall live · 3.2M signals/day', owner: 'CISO' },
  { control: 'eKYC for SIM swap',                  framework: 'URCA + APD',     status: 'compliant', lastAssessed: '2026-Q1', evidence: 'eIDAS 2.0 wallet + 24h delay enforced', owner: 'Fraud + DPO' },
  { control: 'EU 5G Toolbox high-risk vendor cap', framework: 'EU Comm.',       status: 'compliant', lastAssessed: '2026-Q2', evidence: 'Huawei share 12% (cap 20%)', owner: 'CRO' },
  { control: 'Location data 90-day retention',     framework: 'GDPR · APD',    status: 'compliant', lastAssessed: '2026-Q1', evidence: 'Pseudonymisation + automated purge', owner: 'DPO' },
  { control: 'NIS2 mobile network reporting',      framework: 'EU NIS2',        status: 'in-flight', lastAssessed: '2026-Q2', evidence: 'CSIRT integration in deployment', owner: 'CISO' },
  { control: 'O-RAN security profile',             framework: 'O-RAN Alliance', status: 'in-flight', lastAssessed: '2026-Q2', evidence: 'WG11 profile pending pilot sign-off', owner: 'Open RAN' },
]

// Horizon · mobile data classification
export const MOBILE_HORIZON = [
  { object: 'V_MOBILE_CUSTOMER_360',  type: 'Semantic view', sensitivity: 'High',   tags: 'IMSI · MSISDN · Location', maskedColumns: 8,  rowAccessPolicy: 'Yes', lineageDownstream: 12 },
  { object: 'CELL_SITE_TELEMETRY',    type: 'Table',         sensitivity: 'Medium', tags: 'Location · Network',       maskedColumns: 0,  rowAccessPolicy: 'No',  lineageDownstream: 22 },
  { object: 'MNP_PORT_REQUESTS',      type: 'Table',         sensitivity: 'High',   tags: 'PII · MSISDN · Identity',  maskedColumns: 6,  rowAccessPolicy: 'Yes', lineageDownstream:  8 },
  { object: 'SIM_SWAP_REQUESTS',      type: 'Table',         sensitivity: 'Critical', tags: 'PII · IMSI · Auth',      maskedColumns: 11, rowAccessPolicy: 'Yes', lineageDownstream:  4 },
  { object: 'RAN_VENDOR_INVOICES',    type: 'Table',         sensitivity: 'Medium', tags: 'Commercial · Vendor PII',  maskedColumns: 4,  rowAccessPolicy: 'Yes', lineageDownstream:  6 },
  { object: 'MOBILE_LOCATION_LOGS',   type: 'Iceberg',       sensitivity: 'High',   tags: 'Location · GDPR',          maskedColumns: 4,  rowAccessPolicy: 'Yes', lineageDownstream: 14 },
]

// Cost Intelligence · mobile workload spend
export const MOBILE_COST = [
  { workload: 'RAN telemetry pipeline (Snowpipe Streaming)', warehouse: 'NETWORK_WH_LARGE', monthlyCreditsK: 1.84, eurMonthly: 5520, trend: +6.4, owner: 'RAN eng.' },
  { workload: 'Mobile churn ML inference batch',             warehouse: 'DS_WH_XL',         monthlyCreditsK: 0.84, eurMonthly: 2520, trend: +2.4, owner: 'Mobile Analytics' },
  { workload: 'Cortex Agent · MNP win-back',                 warehouse: 'AGENT_WH',         monthlyCreditsK: 0.42, eurMonthly: 1260, trend: +12.4, owner: 'Commercial' },
  { workload: '5G coverage map dashboards',                  warehouse: 'NETWORK_WH',       monthlyCreditsK: 0.36, eurMonthly: 1080, trend: +4.2, owner: 'Spectrum' },
  { workload: 'Cell-site location data masking',             warehouse: 'GOV_WH',           monthlyCreditsK: 0.28, eurMonthly:  840, trend: +1.8, owner: 'DPO' },
  { workload: 'SIM-swap fraud streaming detection',          warehouse: 'FRAUD_WH',         monthlyCreditsK: 0.32, eurMonthly:  960, trend: +3.4, owner: 'Fraud' },
  { workload: 'Mobile B2B IoT/M2M billing',                  warehouse: 'COMMERCIAL_WH',    monthlyCreditsK: 0.24, eurMonthly:  720, trend: +2.2, owner: 'B2B' },
]

// Sharing & Marketplace · mobile data shares
export const MOBILE_SHARES = [
  { name: 'Island Towers (demo)_SITE_PORTFOLIO',   direction: 'Outbound', consumer: 'Island Towers (demo) (SPIE/Vantage)', records: '5,940 sites',  refresh: 'Daily',   lastSync: '2h ago', status: 'live' },
  { name: 'MVNO_USAGE_FEED',        direction: 'Outbound', consumer: 'Mobile Vikings · Scarlet · 4 MVNOs', records: '0.84M lines', refresh: 'Hourly', lastSync: '38m ago',status: 'live' },
  { name: 'URCA_REGULATORY_FEED',   direction: 'Outbound', consumer: 'URCA',                      records: 'KPI rollups',  refresh: 'Monthly',lastSync: '5d ago', status: 'live' },
  { name: 'GROUP_5G_BENCHMARK',     direction: 'Inbound',  consumer: 'Cable Bahamas Group',            records: '5G KPIs (12 OpCos)', refresh: 'Weekly', lastSync: '2d ago', status: 'live' },
  { name: 'OPEN_RAN_LAB_DATA',      direction: 'Outbound', consumer: 'O-RAN Alliance test bench', records: 'lab telemetry',refresh: 'Daily',  lastSync: '6h ago', status: 'pilot' },
  { name: 'IOT_PARTNER_USAGE',      direction: 'Outbound', consumer: 'IoT enterprise customers',  records: '1.24M devices',refresh: 'Hourly', lastSync: '12m ago', status: 'live' },
]

// Apps & SPCS · mobile-domain apps
export const MOBILE_APPS = [
  { name: 'mobile-noc-cockpit',       framework: 'Streamlit-in-Snowflake', users:  240, tier: 'XS',     monthlyCreditsK: 0.18, owner: 'Mobile NOC',     status: 'live' },
  { name: '5g-coverage-explorer',     framework: 'Streamlit-in-Snowflake', users:   86, tier: 'S',      monthlyCreditsK: 0.24, owner: 'Spectrum',        status: 'live' },
  { name: 'mnp-winback-app',          framework: 'Snowflake App + SPCS',   users:  128, tier: 'CPU_M',  monthlyCreditsK: 0.42, owner: 'Commercial',      status: 'live' },
  { name: 'sim-swap-triage',          framework: 'Streamlit-in-Snowflake', users:   18, tier: 'XS',     monthlyCreditsK: 0.12, owner: 'Fraud + CISO',    status: 'live' },
  { name: 'open-ran-vendor-interop',  framework: 'Snowflake App + SPCS',   users:    8, tier: 'GPU_NV_S', monthlyCreditsK: 0.84, owner: 'Open RAN',     status: 'pilot' },
  { name: 'totem-site-planner',       framework: 'Streamlit-in-Snowflake', users:   42, tier: 'S',      monthlyCreditsK: 0.16, owner: 'Field ops',       status: 'live' },
]

// Iceberg & external · mobile data lake
export const MOBILE_ICEBERG = [
  { table: 'RAW_RAN_TELEMETRY',       catalog: 'AWS Glue',         storage: 'S3 · 184 TB',    rows: '12.4B/day', partitionBy: 'date · region · cell_id', externalReader: 'Pyspark · Athena' },
  { table: 'RAW_IOT_M2M_STREAMS',     catalog: 'Polaris',          storage: 'S3 · 28 TB',     rows: '4.2B/day',  partitionBy: 'date · device_class',     externalReader: 'Trino' },
  { table: 'MOBILE_LOCATION_EVENTS',  catalog: 'Polaris',          storage: 'S3 · 96 TB',     rows: '6.8B/day',  partitionBy: 'date · h3_index_l8',      externalReader: 'Spark + Snowflake' },
  { table: 'MNP_PORT_HISTORY',        catalog: 'Snowflake Horizon',storage: 'GCS · 1.2 TB',   rows: '38M total', partitionBy: 'month',                   externalReader: 'BigQuery' },
  { table: 'OPEN_RAN_TEST_RESULTS',   catalog: 'Polaris',          storage: 'Azure ADLS · 4 TB',rows: '142M total', partitionBy: 'date · vendor_pair',  externalReader: 'Databricks' },
]

// =============================================================================
// PLATFORM & DATA-SIDE MOBILE CUTS
// =============================================================================

// Architecture · mobile data flow stages
export const MOBILE_ARCHITECTURE = [
  { stage: 'Sources',     description: '220 cell-sites · 1.24M IoT devices · MNP CDC · SIM-swap events', tech: 'Ericsson ENM · Nokia NetAct · Kafka · MNP gateway' },
  { stage: 'Ingest',      description: 'Snowpipe Streaming (12.4B rows/day RAN) + Openflow CDC',            tech: 'Snowpipe Streaming · Openflow · Kafka Connect' },
  { stage: 'Lakehouse',   description: '312 TB Iceberg (RAW_RAN_TELEMETRY · MOBILE_LOCATION_EVENTS · IoT)',  tech: 'Iceberg + Polaris + AWS Glue' },
  { stage: 'Transform',   description: 'Dynamic Tables · 12 mobile lanes · 3-min TARGET_LAG',                tech: 'Dynamic Tables · Snowpark Python · dbt' },
  { stage: 'Serve',       description: '6 mobile semantic views · 7 ML models · 5 Cortex agents · 6 apps',   tech: 'Cortex Analyst · ML Registry · Cortex Search · SiS' },
  { stage: 'Govern',      description: 'Tags (IMSI/MSISDN/Loc) · masking · RAP · 90-day retention · NESAS',  tech: 'Horizon · DMFs · Trust Center · Object tags' },
]

// Data Catalog · mobile tables/views
export const MOBILE_CATALOG = [
  { name: 'CELL_SITE_TELEMETRY',     domain: 'Network',   sensitivity: 'Medium',   rows: '12.4B/day', certified: true,  owner: 'RAN engineering',  description: '5G/4G cell KPIs · throughput · users · MOS' },
  { name: 'MOBILE_SUBS_DAILY',       domain: 'Consumer',  sensitivity: 'High',     rows: '13.6M',     certified: true,  owner: 'Mobile Analytics', description: 'Daily snapshot of mobile subscribers by tier' },
  { name: 'MNP_PORT_REQUESTS',       domain: 'Commercial',sensitivity: 'High',     rows: '38M total', certified: true,  owner: 'Commercial',       description: 'MNP port-in/port-out events from URCA gateway' },
  { name: 'SIM_SWAP_REQUESTS',       domain: 'Security',  sensitivity: 'Critical', rows: '180K/day',  certified: true,  owner: 'Fraud + CISO',     description: 'SIM-swap requests with eKYC + risk score' },
  { name: 'IOT_M2M_USAGE',           domain: 'B2B',       sensitivity: 'Medium',   rows: '4.2B/day',  certified: true,  owner: 'B2B',              description: 'IoT/M2M line usage events for 1.24M devices' },
  { name: 'RAN_VENDOR_INVOICES',     domain: 'Commercial',sensitivity: 'Medium',   rows: '12K/qtr',   certified: true,  owner: 'Procurement',      description: 'RAN vendor purchase orders + invoices' },
  { name: 'MOBILE_LOCATION_EVENTS',  domain: 'Network',   sensitivity: 'High',     rows: '6.8B/day',  certified: false, owner: 'Spectrum',         description: 'Cell-attached location events (H3 L8)' },
  { name: 'OPEN_RAN_TEST_RESULTS',   domain: 'Network',   sensitivity: 'Low',      rows: '142M',      certified: false, owner: 'Open RAN',         description: 'Vendor interop test bench results' },
]

// Data Products · mobile-domain
export const MOBILE_DATA_PRODUCTS = [
  { name: '5G Coverage Insights',          owner: 'Spectrum',         consumers: 24, freshness: 'Daily',  slo: '99.5%',  status: 'live',     description: 'Live coverage % by region + 5G SA quality' },
  { name: 'MNP Win-back Signal',           owner: 'Commercial',       consumers: 18, freshness: '15 min', slo: '99.9%',  status: 'live',     description: 'Real-time port-out risk score per MSISDN' },
  { name: 'RAN Energy Efficiency',         owner: 'RAN engineering',  consumers:  8, freshness: 'Hourly', slo: '99.5%',  status: 'live',     description: 'kWh/TB · sleep-mode · Island Towers (demo) share' },
  { name: 'Mobile Customer 360',           owner: 'Mobile Analytics', consumers: 124,freshness: 'Hourly', slo: '99.9%',  status: 'live',     description: 'Unified mobile customer view across consumer + B2B' },
  { name: 'Cell-site Health Score',        owner: 'Mobile NOC',       consumers: 12, freshness: '5 min',  slo: '99.95%', status: 'live',     description: 'Composite health score per cell + dispatch trigger' },
  { name: 'Open RAN Vendor Performance',   owner: 'Open RAN',         consumers:  6, freshness: 'Daily',  slo: '99%',    status: 'pilot',    description: 'Vendor-pair KPIs (Mavenir↔Fujitsu, Samsung↔Mavenir)' },
  { name: 'IoT/M2M Usage Feed',            owner: 'B2B',              consumers: 38, freshness: 'Hourly', slo: '99.5%',  status: 'live',     description: 'Per-device usage + billing events' },
]

// Data Contracts · mobile-domain
export const MOBILE_CONTRACTS = [
  { id: 'CTR-MOB-001', producer: 'RAN engineering',  consumer: 'Mobile NOC',     dataset: 'CELL_SITE_TELEMETRY', sla: '5 min freshness', breaches30d: 0, status: 'active' },
  { id: 'CTR-MOB-002', producer: 'Commercial',       consumer: 'Mobile NOC',     dataset: 'MNP_PORT_REQUESTS',   sla: '15 min freshness', breaches30d: 1, status: 'active' },
  { id: 'CTR-MOB-003', producer: 'Mobile Analytics', consumer: 'Marketing',      dataset: 'MOBILE_SUBS_DAILY',   sla: 'Daily 06:00 CET',  breaches30d: 0, status: 'active' },
  { id: 'CTR-MOB-004', producer: 'Procurement',      consumer: 'Finance',        dataset: 'RAN_VENDOR_INVOICES', sla: 'Monthly close',    breaches30d: 0, status: 'active' },
  { id: 'CTR-MOB-005', producer: 'Spectrum',         consumer: 'Field ops',      dataset: '5G Coverage Insights',sla: 'Daily 02:00 CET',  breaches30d: 0, status: 'active' },
  { id: 'CTR-MOB-006', producer: 'Fraud + CISO',     consumer: 'Mobile Analytics', dataset: 'SIM_SWAP_REQUESTS (masked)', sla: '30 min freshness', breaches30d: 2, status: 'review' },
  { id: 'CTR-MOB-007', producer: 'B2B',              consumer: 'IoT customers',  dataset: 'IoT/M2M Usage Feed',  sla: 'Hourly · 99.5% SLO', breaches30d: 0, status: 'active' },
]

// Lineage · mobile flows
export const MOBILE_LINEAGE = [
  { upstream: 'RAW_RAN_TELEMETRY (Iceberg)',     downstream: 'CELL_SITE_TELEMETRY (DT)',   transform: 'Dynamic Table · 3-min TARGET_LAG · Snowpark Python', criticality: 'High' },
  { upstream: 'CELL_SITE_TELEMETRY',             downstream: 'V_RAN_TELEMETRY',            transform: 'Semantic view · 64 metrics · 36 dimensions',          criticality: 'High' },
  { upstream: 'V_RAN_TELEMETRY',                 downstream: 'mobile_churn_xgb',           transform: 'ML feature pipeline · feature store',                  criticality: 'Medium' },
  { upstream: 'V_RAN_TELEMETRY',                 downstream: 'Cell-site Health Score',     transform: 'dbt model + DMF threshold check',                      criticality: 'High' },
  { upstream: 'MNP_PORT_REQUESTS (CDC)',         downstream: 'V_MNP_PORTABILITY',          transform: 'Stream + DT · masked MSISDN',                          criticality: 'High' },
  { upstream: 'V_MNP_PORTABILITY',               downstream: 'mnp_portout_lgbm',           transform: 'ML inference · 420K predictions/day',                  criticality: 'High' },
  { upstream: 'mnp_portout_lgbm',                downstream: 'MNP Win-back Agent (Cortex)', transform: 'Cortex Agent + retention API',                        criticality: 'High' },
  { upstream: 'SIM_SWAP_REQUESTS',               downstream: 'sim_swap_fraud_iforest',     transform: 'Streaming anomaly detection · 96% accuracy',           criticality: 'Critical' },
]

// Data Engineering · mobile pipelines
export const MOBILE_PIPELINES = [
  { name: 'pipe_ran_telemetry',         type: 'Snowpipe Streaming', source: 'Kafka (Ericsson ENM + Nokia NetAct)', targetLag: 'continuous', dailyRows: '12.4B', creditsMo: 1.84, status: 'healthy' },
  { name: 'pipe_iot_m2m_streams',       type: 'Snowpipe Streaming', source: 'Kafka (IoT Hub)',                     targetLag: 'continuous', dailyRows: '4.2B',  creditsMo: 0.62, status: 'healthy' },
  { name: 'pipe_mnp_cdc',               type: 'Openflow CDC',       source: 'PostgreSQL (URCA gateway)',           targetLag: '15 min',     dailyRows: '180K',  creditsMo: 0.18, status: 'healthy' },
  { name: 'pipe_sim_swap_events',       type: 'Snowpipe Streaming', source: 'Auth API webhook',                    targetLag: 'continuous', dailyRows: '180K',  creditsMo: 0.14, status: 'healthy' },
  { name: 'dt_cell_site_telemetry',     type: 'Dynamic Table',      source: 'RAW_RAN_TELEMETRY',                   targetLag: '3 min',      dailyRows: '12.4B', creditsMo: 0.84, status: 'healthy' },
  { name: 'dt_mobile_subs_daily',       type: 'Dynamic Table',      source: 'BSS + CRM',                           targetLag: '60 min',     dailyRows: '13.6M', creditsMo: 0.24, status: 'healthy' },
  { name: 'dt_mobile_revenue_lane',     type: 'Dynamic Table',      source: 'BSS + Finance ledger',                targetLag: '24 h',       dailyRows: '88M',   creditsMo: 0.18, status: 'healthy' },
  { name: 'dt_open_ran_test_results',   type: 'Dynamic Table',      source: 'Test bench S3',                       targetLag: '60 min',     dailyRows: '142K',  creditsMo: 0.06, status: 'experimental' },
]

// Data Quality · mobile DMFs
export const MOBILE_DMF = [
  { dmf: 'cell_site_freshness',          target: 'CELL_SITE_TELEMETRY',     check: 'Freshness ≤ 5 min', threshold: '5 min',  measured: '2 min',   passing: 99.94, owner: 'RAN eng.' },
  { dmf: 'mnp_port_completeness',        target: 'MNP_PORT_REQUESTS',       check: 'NULL_COUNT(msisdn) = 0', threshold: '0', measured: '0',       passing: 100.0, owner: 'Commercial' },
  { dmf: 'mobile_subs_unique',           target: 'MOBILE_SUBS_DAILY',       check: 'UNIQUE(customer_id, date)', threshold: '0 dupes', measured: '0', passing: 100.0, owner: 'Mobile Analytics' },
  { dmf: 'sim_swap_volume_anomaly',      target: 'SIM_SWAP_REQUESTS',       check: 'Volume z-score < 3', threshold: '3σ',     measured: '1.2σ',    passing: 99.8,  owner: 'Fraud + CISO' },
  { dmf: 'iot_event_drop',               target: 'IOT_M2M_USAGE',           check: 'Hourly volume > baseline × 0.7', threshold: '0.7×', measured: '0.96×', passing: 99.6, owner: 'B2B' },
  { dmf: 'mos_score_range',              target: 'CELL_SITE_TELEMETRY',     check: 'voice_mos BETWEEN 1 AND 5',  threshold: '[1,5]',  measured: 'OK',  passing: 99.99, owner: 'RAN eng.' },
  { dmf: 'ran_telemetry_volume',         target: 'RAW_RAN_TELEMETRY',       check: 'Daily rows ≥ 10B', threshold: '10B',     measured: '12.4B',   passing: 100.0, owner: 'Data eng.' },
  { dmf: 'mnp_porttime_sla',             target: 'MNP_PORT_REQUESTS',       check: 'port_time < 24h',  threshold: '24 h',    measured: 'p95 18h', passing: 99.4,  owner: 'Commercial' },
]

// Observability · mobile workloads
export const MOBILE_OBSERVABILITY = [
  { workload: 'pipe_ran_telemetry',     metric: 'Stream lag',        target: '≤ 30 s',    current: '12 s',  status: 'OK',   trend: 'flat' },
  { workload: 'dt_cell_site_telemetry', metric: 'TARGET_LAG',         target: '≤ 3 min',   current: '2.4 min', status: 'OK',  trend: 'flat' },
  { workload: 'mobile_churn_xgb',       metric: 'Inference p95',      target: '≤ 800 ms',  current: '420 ms', status: 'OK',  trend: 'down' },
  { workload: 'sim_swap_fraud_iforest', metric: 'Drift PSI',          target: '≤ 0.10',    current: '0.05',   status: 'OK',  trend: 'flat' },
  { workload: 'V_RAN_TELEMETRY',        metric: 'Query p95',          target: '≤ 4 s',     current: '6.2 s',  status: 'Watch', trend: 'up' },
  { workload: 'pipe_iot_m2m_streams',   metric: 'Backpressure',       target: '0',         current: '12K msgs', status: 'Watch', trend: 'up' },
  { workload: 'AGT-MNP-WIN',            metric: 'Agent error rate',   target: '≤ 1%',      current: '0.4%',   status: 'OK',  trend: 'flat' },
  { workload: 'pipe_mnp_cdc',           metric: 'Replication lag',    target: '≤ 15 min',  current: '8 min',  status: 'OK',  trend: 'flat' },
]

// Incidents · mobile data-platform incidents
export const MOBILE_DATA_INCIDENTS = [
  { id: 'DATA-INC-2031', title: 'RAN telemetry stream lag spike (Nassau)', severity: 'P2', detected: '2h 14m ago',  workload: 'pipe_ran_telemetry',    status: 'Mitigated', cause: 'Kafka broker rebalance' },
  { id: 'DATA-INC-2032', title: 'IoT/M2M stream backpressure',              severity: 'P3', detected: '4h 38m ago',  workload: 'pipe_iot_m2m_streams',  status: 'Investigating', cause: 'Surge from new IoT customer fleet' },
  { id: 'DATA-INC-2033', title: 'V_RAN_TELEMETRY query p95 breach',         severity: 'P3', detected: '8h 02m ago',  workload: 'V_RAN_TELEMETRY',       status: 'Active',    cause: 'Missing clustering key on cell_id' },
  { id: 'DATA-INC-2034', title: 'MNP CDC lag (URCA gateway)',               severity: 'P3', detected: '12h 24m ago', workload: 'pipe_mnp_cdc',          status: 'Resolved',  cause: 'URCA gateway maintenance window' },
  { id: 'DATA-INC-2035', title: 'mobile_churn_xgb drift PSI = 0.12',        severity: 'P3', detected: '1d 04h ago',  workload: 'mobile_churn_xgb',      status: 'Resolved',  cause: 'Retrained model · drift back to 0.04' },
]

// Environments · mobile workloads
export const MOBILE_ENVIRONMENTS = [
  { name: 'MOBILE_PROD',  type: 'Production',  warehouse: 'NETWORK_WH_LARGE', creditsMo: 4.2, owner: 'Platform',         dataFreshness: 'Live',     locked: true,  policy: 'Change-control + approvals' },
  { name: 'MOBILE_QA',    type: 'QA',          warehouse: 'NETWORK_WH',       creditsMo: 0.8, owner: 'Platform',         dataFreshness: 'Daily clone', locked: false, policy: 'Auto-clone from PROD' },
  { name: 'MOBILE_DEV',   type: 'Development', warehouse: 'DEV_WH',           creditsMo: 0.4, owner: 'Mobile Analytics', dataFreshness: 'Weekly clone', locked: false, policy: 'Free experimentation' },
  { name: 'MOBILE_SBOX',  type: 'Sandbox',     warehouse: 'SANDBOX_WH',       creditsMo: 0.2, owner: 'Open RAN',         dataFreshness: 'On-demand', locked: false, policy: 'TTL 14 days' },
  { name: 'MOBILE_ML',    type: 'ML training', warehouse: 'DS_WH_XL',         creditsMo: 1.6, owner: 'Mobile Analytics', dataFreshness: 'Snapshot',  locked: false, policy: 'GPU pools + Snowpark Container Services' },
]

