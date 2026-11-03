// Island allocation of the national baseline. Each column sums to the totals in
// scenario.ts / _mobile_data.ts; tests enforce this.
import { COVERAGE_BY_REGION } from '../pages/portal/_mobile_data'

export type Island = 'New Providence' | 'Grand Bahama' | 'Abaco' | 'Eleuthera' | 'Exuma' | 'Andros' | 'Other Family Islands'

// Island allocation; each column sums to the national baseline. Island churn
// rates weight to the national 1.1% (818 fixed losses a month).
export const ISLANDS: { island: Island; hub: string; fixedSubs: number; mobileSubs: number; homesPassed: number; churnPct: number; sites: number; cov5g: number }[] = (() => {
  const cov = (r: string) => COVERAGE_BY_REGION.find(c => c.region === r)!
  const base: [Island, string, number, number, number, number, string][] = [
    ['New Providence', 'Nassau', 47_800, 112_000, 84_000, 1.0, 'New Providence'],
    ['Grand Bahama', 'Freeport', 12_600, 30_500, 25_000, 1.4, 'Grand Bahama'],
    ['Abaco', 'Marsh Harbour', 4_300, 10_400, 9_000, 1.2, 'Abaco'],
    ['Eleuthera', 'Governors Harbour', 3_200, 8_600, 7_500, 1.2, 'Eleuthera'],
    ['Exuma', 'George Town', 2_700, 7_200, 5_500, 0.8, 'Exuma'],
    ['Andros', 'Andros Town', 1_500, 4_800, 4_000, 1.4, 'Andros'],
    ['Other Family Islands', 'Bimini & others', 2_300, 7_000, 5_000, 1.4, 'Other Family Islands'],
  ]
  return base.map(([island, hub, fixedSubs, mobileSubs, homesPassed, churnPct, region]) => ({
    island, hub, fixedSubs, mobileSubs, homesPassed, churnPct, sites: cov(region).sites, cov5g: cov(region).cov5g,
  }))
})()

