import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  DATA_PRODUCTS, K_ANON_MIN, LIVE_ARR, DATA_PRODUCT_ARR, VISITORS_BY_ISLAND, SOURCE_MARKETS, INCLUSION_BY_ISLAND, ML_INSIGHTS, REVENUE_PLAN,
} from '../src/data/bahamas_market'
import { ISLANDS } from '../src/data/islands'

const marketplace = readFileSync(fileURLToPath(new URL('../src/pages/portal/SharingMarketplacePage.tsx', import.meta.url)), 'utf8')

describe('Bahamas data products and ML insights', () => {
  it('live product ARR equals the paid marketplace listings', () => {
    const outbound = marketplace.slice(marketplace.indexOf('const OUTBOUND'), marketplace.indexOf('\n]', marketplace.indexOf('const OUTBOUND')))
    const mrr = [...outbound.matchAll(/mrr: (\d+),/g)].reduce((s, m) => s + Number(m[1]), 0)
    expect(LIVE_ARR).toBe(mrr * 12)
    expect(REVENUE_PLAN.find(r => r.fy === 'FY26')!.arr).toBeCloseTo(DATA_PRODUCT_ARR / 1e6, 2)
  })

  it('every external product meets the minimum aggregation size', () => {
    for (const p of DATA_PRODUCTS) expect(p.minCell, p.name).toBeGreaterThanOrEqual(K_ANON_MIN)
  })

  it('visitor and market shares add to 100% and cover every island', () => {
    expect(VISITORS_BY_ISLAND.reduce((s, v) => s + v.share, 0)).toBe(100)
    expect(SOURCE_MARKETS.reduce((s, v) => s + v.share, 0)).toBe(100)
    expect(new Set(VISITORS_BY_ISLAND.map(v => v.island))).toEqual(new Set(ISLANDS.map(i => i.island)))
  })

  it('visitor forecast insight matches the visitor series', () => {
    const f = ML_INSIGHTS.find(i => i.id === 'visitor-forecast')!
    expect(f.value).toBe('+50%')
    expect(f.finding).toContain('171K in March')
  })

  it('inclusion settlements reconcile to the ML insight and products', () => {
    const below = INCLUSION_BY_ISLAND.reduce((s, r) => s + r.settlementsBelow, 0)
    expect(ML_INSIGHTS.find(i => i.id === 'inclusion-gap')!.value).toBe(String(below))
    expect(DATA_PRODUCTS.find(p => p.id === 'inclusion')!.sample).toContain(`${below} Family Island settlements`)
  })
})
