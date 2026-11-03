import { describe, expect, it } from 'vitest'
import { FINANCE, FINANCE_TREND, MONTHLY_REVENUE_LANES, QUARTER_REVENUE_M, seededRandom } from '../src/data/scenario'
import { basemapUrl } from '../src/data/basemaps'
import CUST from '../src/pages/portal/_customer_facts'
import NET from '../src/pages/portal/_network_facts'
import { MOBILE_KPIS, REVENUE_BY_LANE } from '../src/pages/portal/_mobile_data'
import { customers } from '../src/data/customers'
import { bundleCatalog, cohortCashflow, survival, bundleNpv } from '../src/pages/portal/_bundle_math'
import { pickAnswer } from '../src/components/AskTheData'

describe('canonical scenario reconciliation', () => {
  it('reconciles customers, shared site counts and revenue lanes', () => {
    expect(CUST.grossAddsMo - CUST.churnLossesMo).toBe(CUST.netAddsMo)
    expect(CUST.convergentHouseholds).toBeLessThanOrEqual(CUST.fixedSubs)
    expect(NET.ownedSites + NET.sharedSites).toBe(NET.activeSites)
    expect(NET.activeSites).toBe(MOBILE_KPIS.activeSites)
    expect(NET.mobileSubs).toBe(MOBILE_KPIS.totalSubscribers)
    expect(MONTHLY_REVENUE_LANES.reduce((sum, row) => sum + row.revenue, 0)).toBe(FINANCE.monthlyRevenueM)
    expect(REVENUE_BY_LANE.reduce((sum, row) => sum + row.revenue, 0)).toBeCloseTo(QUARTER_REVENUE_M)
  })
  it('reconciles P&L and cash flow without double counting', () => {
    expect(FINANCE.monthlyRevenueM - FINANCE.monthlyCogsM - FINANCE.monthlySalesMarketingM - FINANCE.monthlyAdminM).toBeCloseTo(FINANCE.monthlyEbitdaM)
    for (const month of FINANCE_TREND) expect(month.ocf + month.capex).toBeCloseTo(month.fcf)
    for (const customer of customers) expect(customer.services.reduce((sum, service) => sum + service.mrr, 0)).toBe(customer.mrr)
  })
  it('returns safe, consistent scripted answers', () => {
    expect(pickAnswer('total revenue this quarter').result.value).toBe(`BSD ${QUARTER_REVENUE_M}M`)
    expect(pickAnswer('how many mobile subscribers').result.value).toBe('180,500')
    expect(pickAnswer('top lifetime value in Freeport').summary).toContain('Jordan Knowles')
    expect(pickAnswer('unsupported question').result.value).toBe('No scripted answer')
    expect(pickAnswer('total revenue this quarter').sql).toContain('FINANCE_ANALYTICS')
  })
  it('keeps retention survival bounded and CPE cash charged once', () => {
    expect(survival(12, 0, 0, 0.85).every(row => row.S === 1 && row.h === 0)).toBe(true)
    expect(survival(12, 1, 2).every(row => row.S === 1)).toBe(true)
    const bundle = { ...bundleCatalog[0], baseChurnPct: 0, haloChurnReductionPp: 0 }
    const rows = cohortCashflow(bundle, { horizon: 12, wacc: 0, channelMult: 1, geoMult: 1 })
    expect(rows[0].cumCash).toBeCloseTo(-bundle.cac - bundle.install - bundle.cpe + rows[0].contribution)
    expect(rows[6].arpu).toBeCloseTo(bundle.list * (1 - bundle.badDebtPct / 100))
    expect(Number.isFinite(bundleNpv(rows))).toBe(true)
    expect(bundleNpv([])).toBe(0)
  })
  it('uses keyed basemaps and does not issue unkeyed fallback requests', () => {
    for (const style of ['voyager', 'positron', 'dark'] as const) {
      expect(basemapUrl(style, 'test-only')).toContain('?key=test-only')
      expect(basemapUrl(style, '')).toBeNull()
      expect(basemapUrl(style, '<unresolved>')).toBeNull()
    }
    const first = seededRandom(42), second = seededRandom(42)
    expect(Array.from({length: 5}, first)).toEqual(Array.from({length: 5}, second))
  })
})
