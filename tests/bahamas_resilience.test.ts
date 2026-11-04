import { describe, it, expect } from 'vitest'
import { ISLANDS } from '../src/data/islands'
import { NETWORK_BASE, COMMERCIAL_BASE } from '../src/data/scenario'
import { stormState, STORM_DAYS, FAMILY_ISLANDS, PORTING, PORT_NET_6M, STORM_CREDITS_BSD } from '../src/data/bahamas_resilience'

describe('bahamas resilience', () => {
  it('storm never exceeds island capacity and is zero before landfall', () => {
    for (const d of STORM_DAYS) {
      const s = stormState(d)
      s.rows.forEach(r => { expect(r.sitesDown).toBeLessThanOrEqual(r.sites); expect(r.subsOut).toBeLessThanOrEqual(r.fixedSubs) })
      expect(s.sitesDown).toBeLessThanOrEqual(NETWORK_BASE.activeSites)
      if (d < 0) expect(s.subsOut).toBe(0)
    }
  })
  it('storm credits stay a fraction of one month of fixed revenue', () => {
    expect(STORM_CREDITS_BSD).toBeLessThan(COMMERCIAL_BASE.fixedSubscriptions * COMMERCIAL_BASE.fixedArpu)
  })
  it('family islands are the national totals minus New Providence', () => {
    const np = ISLANDS.find(i => i.island === 'New Providence')!
    expect(FAMILY_ISLANDS.reduce((a, i) => a + i.homesPassed, 0)).toBe(NETWORK_BASE.homesPassed - np.homesPassed)
    expect(FAMILY_ISLANDS.reduce((a, i) => a + i.fixedSubs, 0)).toBe(COMMERCIAL_BASE.fixedSubscriptions - np.fixedSubs)
  })
  it('net ports match the monthly series', () => {
    expect(PORT_NET_6M).toBe(PORTING.reduce((a, p) => a + p.portIn - p.portOut, 0))
  })
})
