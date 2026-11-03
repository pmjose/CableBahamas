// Generates the CABLEBAHAMAS_DEMO.ANALYTICS_V2 dataset for the Cortex Agent from
// the same fixtures the web app renders, so chat answers and dashboards agree.
// Run: npx tsx snowflake/v2/generate.ts  → writes CSVs + expected totals to snowflake/v2/out
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AR_AGING, COMMERCIAL_BASE, FINANCE, FINANCE_TREND, MONTHLY_REVENUE_LANES, NETWORK_BASE, SCENARIO_DATE, seededRandom } from '../../src/data/scenario'
import { ISLANDS, type Island } from '../../src/data/islands'
import { customers as SAMPLE } from '../../src/data/customers'
import CUST from '../../src/pages/portal/_customer_facts'
import KPI from '../../src/pages/portal/_kpi_facts'
import NET from '../../src/pages/portal/_network_facts'
import { accounts } from '../../src/pages/portal/_b2b_data'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), 'out')
mkdirSync(OUT, { recursive: true })
const rnd = seededRandom(20261031)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
const c2 = (v: number) => Math.round(v * 100) / 100
const AS_OF = SCENARIO_DATE // 2026-10-31

type Row = Record<string, string | number | boolean | null>
const expected: Record<string, number> = {}

function csv(name: string, rows: Row[]) {
  const cols = Object.keys(rows[0])
  const esc = (v: Row[string]) => v === null || v === undefined ? '' : typeof v === 'string' && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : String(v)
  writeFileSync(resolve(OUT, `${name}.csv`), [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n')
  console.log(`${name}: ${rows.length} rows`)
}

/** Split an integer total across weights with largest-remainder rounding (sums exactly). */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0)
  const raw = weights.map(w => total * w / sum)
  const out = raw.map(Math.floor)
  let left = total - out.reduce((s, v) => s + v, 0)
  raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]).slice(0, left).forEach(([, i]) => out[i]++)
  return out
}
/** Force a list of cent amounts to hit an exact total by adjusting the largest. */
function fixTotal(values: number[], total: number) {
  const diff = c2(total - values.reduce((s, v) => s + v, 0))
  let i = 0
  for (let k = 1; k < values.length; k++) if (values[k] > values[i]) i = k
  values[i] = c2(values[i] + diff)
  return values
}

const HUB: Record<Island, { towns: string[]; lat: number; lng: number }> = {
  'New Providence': { towns: ['Nassau', 'Cable Beach', 'Paradise Island', 'Carmichael', 'Fox Hill'], lat: 25.05, lng: -77.35 },
  'Grand Bahama': { towns: ['Freeport', 'Lucaya', 'Eight Mile Rock', 'West End'], lat: 26.53, lng: -78.70 },
  Abaco: { towns: ['Marsh Harbour', 'Treasure Cay', 'Hope Town'], lat: 26.54, lng: -77.06 },
  Eleuthera: { towns: ['Governors Harbour', 'Rock Sound', 'Harbour Island'], lat: 25.20, lng: -76.24 },
  Exuma: { towns: ['George Town', 'Staniel Cay'], lat: 23.52, lng: -75.77 },
  Andros: { towns: ['Andros Town', 'Nicholls Town', 'Fresh Creek'], lat: 24.70, lng: -77.77 },
  'Other Family Islands': { towns: ['Alice Town', 'Clarence Town', 'Matthew Town', 'Arthur\'s Town'], lat: 23.10, lng: -74.95 },
}
const FIRST = ['Maya', 'Jordan', 'Alicia', 'Daniel', 'Simone', 'Marcus', 'Leah', 'Nathan', 'Keisha', 'Dwayne', 'Tamara', 'Andre', 'Shanice', 'Kendrick', 'Latoya', 'Javon', 'Ashley', 'Ricardo', 'Nadia', 'Terrence', 'Crystal', 'Devon', 'Monique', 'Bradley', 'Tiffany', 'Omar', 'Brianna', 'Anthony', 'Renee', 'Kevin']
const LAST = ['Rolle', 'Knowles', 'Bethel', 'Pinder', 'Bain', 'Adderley', 'Ferguson', 'Major', 'Smith', 'Johnson', 'Thompson', 'Moss', 'Sands', 'Cartwright', 'Russell', 'Darling', 'Saunders', 'Gibson', 'Taylor', 'Curry', 'Wilson', 'Strachan', 'Miller', 'Albury', 'Roberts', 'Forbes', 'McKenzie', 'Brown', 'Dean', 'Stuart']

// ─── Products ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'RH100', name: 'REVHome 100', family: 'Broadband', segment: 'Residential', price: 49, cost: 21, mbps: 100 },
  { id: 'RH250', name: 'REVHome 250', family: 'Broadband', segment: 'Residential', price: 59, cost: 24, mbps: 250 },
  { id: 'RH500', name: 'REVHome 500', family: 'Broadband', segment: 'Residential', price: 69, cost: 27, mbps: 500 },
  { id: 'RH1G', name: 'REVHome 1 Gig', family: 'Broadband', segment: 'Residential', price: 89, cost: 33, mbps: 1000 },
  { id: 'RHTV', name: 'REVHome 500 + TV', family: 'Broadband + TV', segment: 'Residential', price: 99, cost: 46, mbps: 500 },
  { id: 'RCON', name: 'REVConnect (fibre + aliv)', family: 'Convergent', segment: 'Residential', price: 84, cost: 34, mbps: 500 },
  { id: 'VOICE', name: 'REV Home Voice', family: 'Fixed voice', segment: 'Residential', price: 20, cost: 7, mbps: 0 },
  { id: 'BIZ200', name: 'REV Business 200', family: 'Business broadband', segment: 'Business', price: 129, cost: 52, mbps: 200 },
  { id: 'BIZDIA', name: 'REV Business Fibre DIA', family: 'Business connectivity', segment: 'Business', price: 420, cost: 170, mbps: 1000 },
] as const
const MIX = [0.13, 0.27, 0.2, 0.08, 0.12, 0.1, 0.02, 0.06, 0.02] // share of fixed accounts per product
csv('PRODUCTS', PRODUCTS.map(p => ({ PRODUCT_ID: p.id, PRODUCT_NAME: p.name, SERVICE_FAMILY: p.family, CUSTOMER_SEGMENT: p.segment, MONTHLY_PRICE_BSD: p.price, MONTHLY_COST_BSD: p.cost, DOWNLOAD_MBPS: p.mbps })))

// ─── Fixed customers (74,400) ────────────────────────────────────────────────
const fixedRows: Row[] = []
const islandOf: Record<string, Island> = { Nassau: 'New Providence', Freeport: 'Grand Bahama', 'Marsh Harbour': 'Abaco', 'Governors Harbour': 'Eleuthera', 'George Town': 'Exuma', 'Andros Town': 'Andros', 'Alice Town': 'Other Family Islands' }
const productCounts = apportion(COMMERCIAL_BASE.fixedSubscriptions, MIX)
const productPool = productCounts.flatMap((n, i) => Array(n).fill(i)).sort(() => rnd() - 0.5)
const highRiskFixed = 6_300 // of the 21,600 high-risk book; the rest is mobile
let seq = 0
const samplesByIsland = new Map<Island, typeof SAMPLE>()
for (const s of SAMPLE) samplesByIsland.set(islandOf[s.city], [...(samplesByIsland.get(islandOf[s.city]) ?? []), s])
const npsBuckets = (() => { // NPS +38: 52% promoters, 34% passives, 14% detractors
  const n = COMMERCIAL_BASE.fixedSubscriptions
  const [p, pa, d] = apportion(n, [52, 34, 14])
  return [...Array(p).fill(9 + 0), ...Array(pa).fill(7), ...Array(d).fill(4)].sort(() => rnd() - 0.5)
})()
for (const isl of ISLANDS) {
  const samples = samplesByIsland.get(isl.island) ?? []
  for (let k = 0; k < isl.fixedSubs; k++) {
    const sample = samples[k]
    const pIdx = productPool[seq]
    const p = PRODUCTS[pIdx]
    const tenure = sample ? Math.round(sample.tenureYears * 12) : 1 + Math.floor(rnd() * 120)
    const score = sample ? (sample.churnRisk === 'High' ? 0.82 : sample.churnRisk === 'Medium' ? 0.55 : 0.18) : rnd()
    const mrr = sample ? sample.mrr : p.price
    fixedRows.push({
      CUSTOMER_ID: sample ? sample.id : `CBL-${String(200000 + seq).padStart(6, '0')}`,
      CUSTOMER_NAME: sample ? sample.name : `${pick(FIRST)} ${pick(LAST)}`,
      PRODUCT_ID: p.id, PRODUCT_NAME: p.name, SERVICE_FAMILY: p.family, CUSTOMER_SEGMENT: p.segment,
      ISLAND: isl.island, TOWN: sample ? sample.city : (k % 3 === 0 ? isl.hub.split(' ')[0] === 'Bimini' ? 'Alice Town' : HUB[isl.island].towns[0] : pick(HUB[isl.island].towns)),
      JOIN_DATE: new Date(Date.UTC(2026, 9, 31) - tenure * 30.4 * 864e5).toISOString().slice(0, 10),
      TENURE_MONTHS: tenure, CURRENT_MRR_BSD: mrr, CHURN_SCORE: c2(score), CHURN_RISK: 'Low',
      TIER: sample ? sample.tier : mrr >= 99 ? 'Platinum' : mrr >= 69 ? 'Gold' : mrr >= 55 ? 'Silver' : 'Bronze',
      NPS_SCORE: npsBuckets[seq], MARKETING_CONSENT: rnd() < CUST.contactable.sms / 100,
      HAS_ALIV_MOBILE: false,
      EXPECTED_36M_CLV_BSD: sample ? sample.ltv : c2((mrr - p.cost) * 36 * (1 - score * 0.6)),
      SNAPSHOT_DATE: AS_OF,
    })
    seq++
  }
}
// ARPU exact: scale non-sample MRR so average = fixed ARPU.
{
  const target = c2(COMMERCIAL_BASE.fixedSubscriptions * COMMERCIAL_BASE.fixedArpu)
  const sampleIds = new Set(SAMPLE.map(s => s.id))
  const sampleSum = fixedRows.filter(r => sampleIds.has(r.CUSTOMER_ID as string)).reduce((s, r) => s + (r.CURRENT_MRR_BSD as number), 0)
  const rest = fixedRows.filter(r => !sampleIds.has(r.CUSTOMER_ID as string))
  const k = (target - sampleSum) / rest.reduce((s, r) => s + (r.CURRENT_MRR_BSD as number), 0)
  const vals = fixTotal(rest.map(r => c2((r.CURRENT_MRR_BSD as number) * k)), c2(target - sampleSum))
  rest.forEach((r, i) => { r.CURRENT_MRR_BSD = vals[i] })
  expected.fixed_mrr_bsd = target
}
// Churn risk: top scores per island → High, so the high-risk book is exactly highRiskFixed; samples keep their label.
{
  const sampleRisk = new Map(SAMPLE.map(s => [s.id, s.churnRisk]))
  const ranked = fixedRows.filter(r => !sampleRisk.has(r.CUSTOMER_ID as string)).sort((a, b) => (b.CHURN_SCORE as number) - (a.CHURN_SCORE as number))
  const sampleHigh = SAMPLE.filter(s => s.churnRisk === 'High').length
  ranked.forEach((r, i) => { r.CHURN_RISK = i < highRiskFixed - sampleHigh ? 'High' : (r.CHURN_SCORE as number) >= 0.45 ? 'Medium' : 'Low' })
  for (const r of fixedRows) if (sampleRisk.has(r.CUSTOMER_ID as string)) r.CHURN_RISK = sampleRisk.get(r.CUSTOMER_ID as string)!
}
// Convergent households: 39,000 fixed customers also hold an aliv line.
{
  const resi = fixedRows.filter(r => r.CUSTOMER_SEGMENT === 'Residential')
  const conv = resi.filter(r => r.PRODUCT_ID === 'RCON')
  const others = resi.filter(r => r.PRODUCT_ID !== 'RCON').sort(() => rnd() - 0.5)
  ;[...conv, ...others].slice(0, COMMERCIAL_BASE.convergentHouseholds).forEach(r => { r.HAS_ALIV_MOBILE = true })
}
csv('CUSTOMERS', fixedRows)
expected.fixed_customers = fixedRows.length
expected.high_risk_fixed = fixedRows.filter(r => r.CHURN_RISK === 'High').length
expected.convergent_households = fixedRows.filter(r => r.HAS_ALIV_MOBILE).length

// ─── Customer movements (monthly, by island) ─────────────────────────────────
const months = FINANCE_TREND.map((m, i) => ({ label: m.m, start: new Date(Date.UTC(2025, 10 + i, 1)).toISOString().slice(0, 10) }))
const movementRows: Row[] = []
const lossesByIsland = apportion(CUST.churnLossesMo, ISLANDS.map(i => i.fixedSubs * i.churnPct))
const addsByIsland = apportion(CUST.grossAddsMo, ISLANDS.map(i => i.fixedSubs * (i.island === 'Grand Bahama' ? 0.95 : 1)))
const winbackByIsland = apportion(CUST.winBackMo, ISLANDS.map(i => i.fixedSubs))
months.forEach((m, mi) => {
  const back = months.length - 1 - mi // months before October
  ISLANDS.forEach((isl, ii) => {
    const closing = isl.fixedSubs - Math.round((addsByIsland[ii] - lossesByIsland[ii]) * back)
    const wobble = back === 0 ? 0 : Math.round((rnd() - 0.5) * lossesByIsland[ii] * 0.12)
    const losses = lossesByIsland[ii] + wobble
    const adds = addsByIsland[ii] + wobble
    movementRows.push({ MONTH_START: m.start, ISLAND: isl.island, OPENING_SUBS: closing - adds + losses, GROSS_ADDS: adds, DISCONNECTS: losses, WIN_BACKS: back === 0 ? winbackByIsland[ii] : Math.round(winbackByIsland[ii] * (0.9 + rnd() * 0.2)), NET_ADDS: adds - losses, CLOSING_SUBS: closing })
  })
})
csv('CUSTOMER_MOVEMENTS', movementRows)
expected.oct_gross_adds = CUST.grossAddsMo; expected.oct_disconnects = CUST.churnLossesMo; expected.oct_net_adds = CUST.netAddsMo

// ─── aliv mobile (180,500) ───────────────────────────────────────────────────
const PLANS = [
  { name: 'aliv Prepaid', type: 'Prepaid', arpu: 14 }, { name: 'aliv Postpaid 25GB', type: 'Postpaid', arpu: 30 },
  { name: 'aliv Postpaid Unlimited', type: 'Postpaid', arpu: 45 }, { name: 'aliv Business', type: 'Business', arpu: 38 }, { name: 'aliv IoT', type: 'IoT', arpu: 4 },
]
const mobileRows: Row[] = []
{
  const [consumer, business, iot] = [150_000, 25_000, 5_500]
  const consumerSplit = apportion(consumer, [0.62, 0.25, 0.13])
  const plan = [...Array(consumerSplit[0]).fill(0), ...Array(consumerSplit[1]).fill(1), ...Array(consumerSplit[2]).fill(2), ...Array(business).fill(3), ...Array(iot).fill(4)].sort(() => rnd() - 0.5)
  const convIds = fixedRows.filter(r => r.HAS_ALIV_MOBILE).map(r => [r.CUSTOMER_ID as string, r.ISLAND as Island] as const)
  let n = 0
  const highMobile = CUST.predictedChurnBook - highRiskFixed
  for (const isl of ISLANDS) for (let k = 0; k < isl.mobileSubs; k++, n++) {
    const pl = PLANS[plan[n]]
    mobileRows.push({ LINE_ID: `ALV-${String(500000 + n)}`, CUSTOMER_ID: null, ISLAND: isl.island, PLAN_NAME: pl.name, PLAN_TYPE: pl.type, MONTHLY_ARPU_BSD: pl.arpu, DATA_GB_MONTH: pl.type === 'IoT' ? 0.1 : c2(2 + rnd() * 30), CHURN_RISK: 'Low', ACTIVATION_DATE: new Date(Date.UTC(2026, 9, 31) - Math.floor(rnd() * 2900) * 864e5).toISOString().slice(0, 10), SNAPSHOT_DATE: AS_OF })
  }
  // Link convergent households to a consumer line on the same island.
  const free = new Map<Island, Row[]>()
  for (const r of mobileRows) if (r.PLAN_TYPE !== 'Business' && r.PLAN_TYPE !== 'IoT') free.set(r.ISLAND as Island, [...(free.get(r.ISLAND as Island) ?? []), r])
  for (const [id, isl] of convIds) { const r = free.get(isl)?.pop(); if (r) r.CUSTOMER_ID = id }
  mobileRows.sort(() => rnd() - 0.5).slice(0, highMobile).forEach(r => { r.CHURN_RISK = 'High' })
  const target = c2(COMMERCIAL_BASE.mobileSubscriptions * COMMERCIAL_BASE.mobileArpu)
  const k = target / mobileRows.reduce((s, r) => s + (r.MONTHLY_ARPU_BSD as number), 0)
  const vals = fixTotal(mobileRows.map(r => c2((r.MONTHLY_ARPU_BSD as number) * k)), target)
  mobileRows.forEach((r, i) => { r.MONTHLY_ARPU_BSD = vals[i] })
  expected.mobile_lines = mobileRows.length
  expected.mobile_revenue_bsd = target
}
csv('MOBILE_SUBSCRIPTIONS', mobileRows)

// ─── Monthly finance (service line × island) ─────────────────────────────────
const financeRows: Row[] = []
const laneTotal = MONTHLY_REVENUE_LANES.reduce((s, l) => s + l.revenue, 0)
FINANCE_TREND.forEach((m, mi) => {
  const cells: { lane: string; island: Island; w: number }[] = []
  for (const lane of MONTHLY_REVENUE_LANES) for (const isl of ISLANDS) {
    const base = lane.lane.startsWith('Mobile') ? isl.mobileSubs : lane.lane === 'Wholesale' ? (isl.island === 'New Providence' ? 1 : 0) : isl.fixedSubs
    cells.push({ lane: lane.lane, island: isl.island, w: lane.revenue / laneTotal * base / (lane.lane === 'Wholesale' ? 1 : lane.lane.startsWith('Mobile') ? COMMERCIAL_BASE.mobileSubscriptions : COMMERCIAL_BASE.fixedSubscriptions) })
  }
  const cents = (v: number) => Math.round(v * 1e6 * 100)
  const rev = apportion(cents(m.revenue), cells.map(c => c.w))
  const plan = apportion(cents(m.plan), cells.map(c => c.w))
  const ebitda = apportion(cents(m.ebitda), cells.map(c => c.w))
  const capex = apportion(cents(FINANCE.monthlyCapexM), cells.map(c => c.w))
  cells.forEach((c, i) => {
    if (c.w === 0) return
    const r = rev[i] / 100
    const cogs = c2(r * FINANCE.monthlyCogsM / FINANCE.monthlyRevenueM)
    financeRows.push({ MONTH_START: months[mi].start, SERVICE_LINE: c.lane, ISLAND: c.island, REVENUE_BSD: r, BUDGET_REVENUE_BSD: plan[i] / 100, COST_OF_SERVICE_BSD: cogs, OPERATING_EXPENSE_BSD: c2(r - cogs - ebitda[i] / 100), EBITDA_BSD: ebitda[i] / 100, CAPEX_BSD: capex[i] / 100 })
  })
})
csv('MONTHLY_FINANCE', financeRows)
expected.oct_revenue_bsd = c2(FINANCE_TREND[11].revenue * 1e6)
expected.oct_ebitda_bsd = c2(FINANCE_TREND[11].ebitda * 1e6)
expected.ttm_revenue_bsd = c2(FINANCE_TREND.reduce((s, m) => s + m.revenue, 0) * 1e6)

// ─── Receivables at 31 Oct (open items) ──────────────────────────────────────
const arRows: Row[] = []
{
  const buckets = [{ b: 'Current', d: [0, 0] }, { b: '1-30 days', d: [1, 30] }, { b: '31-60 days', d: [31, 60] }, { b: '61-90 days', d: [61, 90] }, { b: '90+ days', d: [91, 180] }]
  const consumers = fixedRows.filter(r => r.CUSTOMER_SEGMENT === 'Residential')
  const share = [1, 0.22, 0.07, 0.035, 0.03] // share of consumers with an open item in each bucket
  const b2bAcc = accounts.filter(a => a.status !== 'Churned')
  let id = 0
  AR_AGING.forEach((bk, bi) => {
    const consumerTotal = c2((bk.group - bk.b2b) * 1e6)
    const n = Math.round(consumers.length * share[bi])
    const pool = [...consumers].sort(() => rnd() - 0.5).slice(0, n)
    const amts = fixTotal(apportion(Math.round(consumerTotal * 100), pool.map(r => r.CURRENT_MRR_BSD as number)).map(v => v / 100), consumerTotal)
    pool.forEach((r, i) => arRows.push({ INVOICE_ID: `INV-${String(++id).padStart(7, '0')}`, CUSTOMER_ID: r.CUSTOMER_ID, ACCOUNT_NAME: r.CUSTOMER_NAME, LEDGER: 'Consumer', ISLAND: r.ISLAND, AGEING_BUCKET: bk.bucket, DAYS_OVERDUE: buckets[bi].d[0] + Math.floor(rnd() * (buckets[bi].d[1] - buckets[bi].d[0] + 1)), OUTSTANDING_BSD: amts[i], AS_OF_DATE: AS_OF }))
    const b2bTotal = c2(bk.b2b * 1e6)
    const bAmts = fixTotal(apportion(Math.round(b2bTotal * 100), b2bAcc.map(a => a.mrr * (bi === 0 ? 1 : a.status === 'At Risk' || a.status === 'Watch' ? 4 : 0.3))).map(v => v / 100), b2bTotal)
    b2bAcc.forEach((a, i) => { if (bAmts[i] > 0) arRows.push({ INVOICE_ID: `INV-${String(++id).padStart(7, '0')}`, CUSTOMER_ID: a.code, ACCOUNT_NAME: a.name, LEDGER: 'Business', ISLAND: a.region === 'Nassau' || a.region === 'New Providence' ? 'New Providence' : a.region === 'Freeport' ? 'Grand Bahama' : a.region === 'National' ? 'New Providence' : a.region, AGEING_BUCKET: bk.bucket, DAYS_OVERDUE: buckets[bi].d[0] + Math.floor(rnd() * (buckets[bi].d[1] - buckets[bi].d[0] + 1)), OUTSTANDING_BSD: bAmts[i], AS_OF_DATE: AS_OF }) })
  })
  expected.ar_total_bsd = c2(AR_AGING.reduce((s, b) => s + b.group, 0) * 1e6)
  expected.ar_over_60_bsd = c2((AR_AGING[3].group + AR_AGING[4].group) * 1e6)
  expected.ar_b2b_bsd = c2(AR_AGING.reduce((s, b) => s + b.b2b, 0) * 1e6)
}
csv('RECEIVABLES', arRows)

// ─── Support contacts (Oct 2026) ─────────────────────────────────────────────
const THEMES: [string, number][] = [['Slow speed / Wi-Fi', 5_900], ['Billing question', 4_700], ['Outage / no service', 3_800], ['Cancel / switching to BTC', 1_900], ['TV channel issue', 1_600], ['Move / new install', 2_100], ['Other', 1_400]]
const caseRows: Row[] = []
{
  const total = THEMES.reduce((s, [, n]) => s + n, 0)
  const islands = apportion(total, ISLANDS.map(i => i.fixedSubs))
  const islandPool = islands.flatMap((n, i) => Array(n).fill(ISLANDS[i].island)).sort(() => rnd() - 0.5)
  const fcr = apportion(total, [72, 28]); const digital = apportion(total, [46, 54])
  const fcrPool = [...Array(fcr[0]).fill(true), ...Array(fcr[1]).fill(false)].sort(() => rnd() - 0.5)
  const digPool = [...Array(digital[0]).fill(true), ...Array(digital[1]).fill(false)].sort(() => rnd() - 0.5)
  let n = 0
  for (const [theme, count] of THEMES) for (let k = 0; k < count; k++, n++) {
    const day = 1 + Math.floor(rnd() * 31)
    const digitalCh = digPool[n]
    caseRows.push({ CASE_ID: `CS-${String(800000 + n)}`, ISLAND: islandPool[n], OPENED_DATE: `2026-10-${String(day).padStart(2, '0')}`, THEME: theme, CHANNEL: digitalCh ? pick(['App', 'Web chat', 'WhatsApp']) : pick(['Phone', 'Store']), DIGITAL: digitalCh, FIRST_CONTACT_RESOLVED: fcrPool[n], HANDLE_TIME_MIN: c2(4 + rnd() * 14), CSAT_SCORE: Math.min(5, Math.max(1, Math.round(3.9 + (rnd() - 0.5) * 2.4))), STATUS: day > 29 && rnd() < 0.3 ? 'Open' : 'Resolved' })
  }
  expected.oct_contacts = total
}
csv('SUPPORT_CASES', caseRows)

// ─── Network sites (220) + October daily ─────────────────────────────────────
const READINESS: Record<Island, { gen: number; aerial: number; status: string }> = {
  'New Providence': { gen: 94, aerial: 310, status: 'Ready' }, 'Grand Bahama': { gen: 29, aerial: 260, status: '9 generators short' },
  Abaco: { gen: 19, aerial: 150, status: 'Fuel short 3.2k gal' }, Eleuthera: { gen: 17, aerial: 90, status: 'Ready' },
  Exuma: { gen: 14, aerial: 60, status: 'Ready' }, Andros: { gen: 10, aerial: 70, status: 'Crew gap' }, 'Other Family Islands': { gen: 16, aerial: 80, status: 'Ferry-dependent' },
}
const siteRows: Row[] = []; const dailyRows: Row[] = []
{
  const ownedPerIsland = apportion(NETWORK_BASE.ownedSites, ISLANDS.map(i => i.sites))
  const prefix: Record<Island, string> = { 'New Providence': 'NAS', 'Grand Bahama': 'FPO', Abaco: 'MHH', Eleuthera: 'ELH', Exuma: 'GGT', Andros: 'ASD', 'Other Family Islands': 'OFI' }
  ISLANDS.forEach((isl, ii) => {
    const homes = apportion(isl.homesPassed, Array.from({ length: isl.sites }, () => 0.5 + rnd()))
    const subs = apportion(isl.fixedSubs, homes)
    const aerial = apportion(READINESS[isl.island].aerial * 10, homes)
    for (let k = 0; k < isl.sites; k++) {
      const h = HUB[isl.island]
      siteRows.push({ SITE_ID: `${prefix[isl.island]}-${String(k + 1).padStart(3, '0')}`, ISLAND: isl.island, TOWN: h.towns[k % h.towns.length], LATITUDE: c2(h.lat + (rnd() - 0.5) * 0.3), LONGITUDE: c2(h.lng + (rnd() - 0.5) * 0.3), SITE_TYPE: k === 0 ? 'Headend' : k % 5 === 0 ? 'Hub' : 'Node + cell', OWNERSHIP: k < ownedPerIsland[ii] ? 'Owned' : 'Shared', HAS_GENERATOR: k < READINESS[isl.island].gen, AERIAL_PLANT_KM: aerial[k] / 10, HOMES_PASSED: homes[k], FIXED_SUBSCRIBERS: subs[k], POP_COVERAGE_5G_PCT: isl.cov5g, HURRICANE_READINESS: READINESS[isl.island].status, STATUS: 'Active' })
    }
  })
  const availMin = Math.round(siteRows.length * 31 * 1440 * (1 - KPI.uptime30dPct / 100))
  const outage = apportion(availMin, Array.from({ length: siteRows.length * 31 }, () => (rnd() < 0.06 ? rnd() * 10 : 0)))
  let n = 0
  for (let d = 1; d <= 31; d++) for (const s of siteRows) {
    dailyRows.push({ SITE_ID: s.SITE_ID, ISLAND: s.ISLAND, OBSERVED_DATE: `2026-10-${String(d).padStart(2, '0')}`, AVAILABILITY_PCT: c2(100 - outage[n] / 14.4), OUTAGE_MINUTES: outage[n], PEAK_TRAFFIC_GBPS: c2((s.HOMES_PASSED as number) / NETWORK_BASE.homesPassed * KPI.corePeakTbps * 1000 * (0.9 + rnd() * 0.1)), UTILISATION_PCT: c2(45 + rnd() * 40), AVG_DOWNLOAD_MBPS: c2(180 + rnd() * 160) })
    n++
  }
  expected.sites = siteRows.length; expected.owned_sites = NETWORK_BASE.ownedSites
  expected.homes_passed = NETWORK_BASE.homesPassed; expected.sites_with_generator = siteRows.filter(s => s.HAS_GENERATOR).length
  expected.oct_outage_minutes = availMin
}
csv('NETWORK_SITES', siteRows)
csv('NETWORK_DAILY', dailyRows)

// ─── Incidents (Oct 2026) ────────────────────────────────────────────────────
const incidentRows: Row[] = [
  { INCIDENT_ID: 'INC-30418', ISLAND: 'New Providence', AREA: 'Nassau East', SERVICE: 'Broadband (CMTS-07)', PRIORITY: 'P1', STATUS: 'Open', OPENED_AT: '2026-10-31 07:42:00', RESOLVED_AT: null, CUSTOMERS_AFFECTED: 1140, BUSINESS_ACCOUNTS_AFFECTED: 23, MTTR_MIN: null, ROOT_CAUSE: 'Upstream port failure on CMTS-07' },
  { INCIDENT_ID: 'INC-30422', ISLAND: 'Grand Bahama', AREA: 'Freeport', SERVICE: 'Business fibre', PRIORITY: 'P1', STATUS: 'Open', OPENED_AT: '2026-10-31 09:05:00', RESOLVED_AT: null, CUSTOMERS_AFFECTED: 0, BUSINESS_ACCOUNTS_AFFECTED: 23, MTTR_MIN: null, ROOT_CAUSE: 'Fibre cut, road works' },
  { INCIDENT_ID: 'INC-30425', ISLAND: 'Abaco', AREA: 'Marsh Harbour', SERVICE: 'TV head-end feed', PRIORITY: 'P2', STATUS: 'Open', OPENED_AT: '2026-10-31 10:20:00', RESOLVED_AT: null, CUSTOMERS_AFFECTED: 187, BUSINESS_ACCOUNTS_AFFECTED: 0, MTTR_MIN: null, ROOT_CAUSE: 'Satellite receiver fault' },
]
{
  const resolved = 176
  const mttr = apportion(NET.mttrMin * resolved, Array.from({ length: resolved }, () => 0.3 + rnd() * 1.4))
  const cim = apportion(NET.cimMonth, Array.from({ length: resolved }, () => rnd()))
  const isl = apportion(resolved, ISLANDS.map(i => i.sites)).flatMap((n, i) => Array(n).fill(ISLANDS[i].island)).sort(() => rnd() - 0.5)
  for (let k = 0; k < resolved; k++) {
    const day = 1 + Math.floor(rnd() * 30); const h = 6 + Math.floor(rnd() * 14)
    const opened = new Date(Date.UTC(2026, 9, day, h, Math.floor(rnd() * 60)))
    const res = new Date(opened.getTime() + mttr[k] * 6e4)
    incidentRows.push({ INCIDENT_ID: `INC-${30000 + k}`, ISLAND: isl[k], AREA: pick(HUB[isl[k] as Island].towns), SERVICE: pick(['Broadband', 'TV', 'Fixed voice', 'Mobile', 'Business fibre']), PRIORITY: rnd() < 0.08 ? 'P1' : rnd() < 0.4 ? 'P2' : 'P3', STATUS: 'Resolved', OPENED_AT: opened.toISOString().slice(0, 19).replace('T', ' '), RESOLVED_AT: res.toISOString().slice(0, 19).replace('T', ' '), CUSTOMERS_AFFECTED: Math.max(1, Math.round(cim[k] / Math.max(1, mttr[k]) * 8)), BUSINESS_ACCOUNTS_AFFECTED: Math.floor(rnd() * 3), MTTR_MIN: mttr[k], ROOT_CAUSE: pick(['Power', 'Fibre cut', 'Equipment fault', 'Software', 'Weather']) })
  }
  expected.open_incidents = 3; expected.resolved_incidents = resolved; expected.avg_mttr_min = NET.mttrMin
}
csv('INCIDENTS', incidentRows)

// ─── URCA QoS (Q3 2026) and fraud (Oct 2026) ─────────────────────────────────
const QOS: [string, number, number, string][] = [
  ['Network availability %', 99.94, 99.9, '>='], ['Fault repair within 24h % (New Providence)', 92, 90, '>='], ['Fault repair within 24h % (Grand Bahama)', 90, 90, '>='],
  ['Fault repair within 24h % (Andros)', 78, 90, '>='], ['Fault repair within 24h % (Exuma)', 81, 90, '>='], ['Install within 10 days %', 91, 85, '>='],
  ['Billing complaints per 1,000 accounts', 3.1, 5, '<='], ['Call centre answer within 60s %', 82, 80, '>='], ['Broadband speed vs advertised %', 94, 90, '>='],
  ['Dropped call rate % (aliv)', 0.42, 1, '<='], ['911/919 routing accuracy %', 99.98, 99.95, '>='], ['Complaint resolution within 30 days %', 96, 95, '>='],
  ['Number transfer success %', 96, 95, '>='], ['Outage notification within 2h %', 98, 95, '>='],
]
csv('URCA_QOS', QOS.map(([m, v, t, op]) => ({ QUARTER: '2026-Q3', METRIC: m, VALUE: v, URCA_TARGET: t, COMPARISON: op, MEETS_TARGET: op === '>=' ? v >= t : v <= t, FILING_DUE: '2026-11-10' })))
expected.qos_metrics = QOS.length; expected.qos_met = QOS.filter(([, v, t, op]) => op === '>=' ? v >= t : v <= t).length
const FRAUD: [string, number, number, number][] = [['SIM-swap attempt', 42, 61_000, 0], ['International revenue share (IRSF)', 28, 38_000, 4_200], ['Subscription fraud', 34, 25_000, 6_800]]
const fraudRows: Row[] = []
for (const [type, n, avoided, lost] of FRAUD) {
  const a = apportion(avoided, Array.from({ length: n }, () => rnd())); const l = apportion(lost, Array.from({ length: n }, () => rnd()))
  for (let k = 0; k < n; k++) fraudRows.push({ CASE_ID: `FR-${type.slice(0, 3).toUpperCase()}-${k + 1}`, FRAUD_TYPE: type, OPENED_DATE: `2026-10-${String(1 + Math.floor(rnd() * 31)).padStart(2, '0')}`, LOSS_AVOIDED_BSD: a[k], LOSS_BSD: l[k], STATUS: 'Closed' })
}
csv('FRAUD_CASES', fraudRows)

// ─── B2B accounts and pipeline ───────────────────────────────────────────────
const islandFromRegion = (r: string): string => (r === 'Nassau' || r === 'New Providence' ? 'New Providence' : r === 'Freeport' ? 'Grand Bahama' : r === 'National' ? 'National' : r)
csv('B2B_ACCOUNTS', accounts.map(a => ({ ACCOUNT_ID: a.code, ACCOUNT_NAME: a.name, SEGMENT: a.segment, VERTICAL: a.vertical, ISLAND: islandFromRegion(a.region), MRR_BSD: a.mrr, ARR_BSD: a.arr, SITES: a.sites, CIRCUITS: a.circuits, CONTRACT_END: `${a.contractEnd}-01`, STATUS: a.status, HEALTH_SCORE: a.health, NPS: a.nps, ACCOUNT_OWNER: a.ownerAE })))
{
  const STAGES: [string, number][] = [['Qualification', 0.2], ['Proposal', 0.45], ['Negotiation', 0.7]]
  const open = 24
  const acv = apportion(Math.round(KPI.b2bPipelineM * 1e6), Array.from({ length: open }, () => 0.3 + rnd() * 2))
  const rows: Row[] = acv.map((v, k) => {
    const [stage, p] = STAGES[k % 3]
    return { OPPORTUNITY_ID: `OPP-${9001 + k}`, ACCOUNT_NAME: k === 0 ? 'Exuma resort (demo)' : pick(['Atlantis Resort Group', 'Island Retail Group (demo)', 'Commonwealth Bank (demo)', 'Grand Bahama Shipyard (demo)', 'Bahamasair (demo)', 'Cable Beach Hotel (demo)', 'Family Guardian (demo)', 'Super Value Group (demo)']), ISLAND: k === 0 ? 'Exuma' : pick(['New Providence', 'Grand Bahama', 'Abaco', 'Eleuthera']), PRODUCT: pick(['Business Fibre DIA', 'Managed Wi-Fi', 'SD-WAN', 'Cloud Connect', 'aliv Business fleet']), STAGE: stage, WIN_PROBABILITY: p, ANNUAL_CONTRACT_VALUE_BSD: v, EXPECTED_CLOSE: `2027-0${1 + (k % 6)}-15`, OWNER_NAME: pick(['K. Bethel', 'R. Knowles', 'S. Rolle', 'D. Smith']) }
  })
  for (let k = 0; k < 18; k++) rows.push({ OPPORTUNITY_ID: `OPP-${8801 + k}`, ACCOUNT_NAME: pick(['Atlantis Resort Group', 'AML Foods (demo)', 'Bahamas Post Office (demo)', 'Grand Bahama Power (demo)']), ISLAND: pick(['New Providence', 'Grand Bahama']), PRODUCT: pick(['Business Fibre DIA', 'SD-WAN', 'Managed Wi-Fi']), STAGE: k < 11 ? 'Closed Won' : 'Closed Lost', WIN_PROBABILITY: k < 11 ? 1 : 0, ANNUAL_CONTRACT_VALUE_BSD: Math.round(40_000 + rnd() * 160_000), EXPECTED_CLOSE: `2026-${String(5 + (k % 5)).padStart(2, '0')}-15`, OWNER_NAME: pick(['K. Bethel', 'R. Knowles', 'S. Rolle', 'D. Smith']) })
  csv('B2B_PIPELINE', rows)
  expected.open_pipeline_bsd = Math.round(KPI.b2bPipelineM * 1e6)
}

writeFileSync(resolve(OUT, 'expected.json'), JSON.stringify(expected, null, 2))
console.log('expected totals →', resolve(OUT, 'expected.json'))
