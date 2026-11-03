// =============================================================================
// Procurement cockpit synthetic data (Cable Bahamas) — BSD 186M annual spend
// =============================================================================
export type VendorTier = 'Strategic' | 'Preferred' | 'Approved' | 'Tail'
export type KraljicQuadrant = 'Strategic' | 'Leverage' | 'Bottleneck' | 'Routine'
export type Category = 'Network' | 'CPE' | 'Content' | 'Cloud & SaaS' | 'Field services' | 'Energy' | 'Fleet' | 'Marketing' | 'Wayleaves' | 'Roaming' | 'Pro services' | 'Facilities'

export type Vendor = {
  code: string
  name: string
  category: Category
  subcat: string
  tier: VendorTier
  kraljic: KraljicQuadrant
  spend: number // BSD K annual
  ccy: 'BSD' | 'USD' | 'GBP'
  contracts: number
  renewalDate: string
  autoRenew: boolean
  noticeDays: number
  daysToNotice: number
  paymentDays: number
  otif: number
  scoreQuality: number
  scoreDelivery: number
  scoreInnovation: number
  scoreEsg: number
  scoreRisk: number
  cyberRating: 'A' | 'B' | 'C' | 'D' | 'F'
  ecovadis: number // 0-100
  scope3KtCo2e: number
  finHealth: 'Strong' | 'Stable' | 'Watch' | 'Distressed'
  country: string
  diversity: 'None' | 'Bahamian SME' | 'Women-owned' | 'B-Corp'
  altSources: number
  flags: string[]
}

const v = (o: Partial<Vendor> & { code: string; name: string; category: Category; spend: number }): Vendor => ({
  subcat: '', tier: 'Approved', kraljic: 'Routine', ccy: 'BSD', contracts: 1, renewalDate: '2027-06', autoRenew: false,
  noticeDays: 90, daysToNotice: 200, paymentDays: 60, otif: 0.92, scoreQuality: 80, scoreDelivery: 80, scoreInnovation: 60,
  scoreEsg: 60, scoreRisk: 30, cyberRating: 'B', ecovadis: 60, scope3KtCo2e: 1.0, finHealth: 'Stable', country: 'BE',
  diversity: 'None', altSources: 2, flags: [], ...o,
})

export const vendors: Vendor[] = [
  v({ code: 'CSCO', name: 'Cisco Systems',     category: 'Network', subcat: 'Routing/switching', spend: 14200, ccy: 'USD', tier: 'Strategic', kraljic: 'Strategic', contracts: 12, renewalDate: '2027-06', noticeDays: 180, daysToNotice: 64,  otif: 0.94, scoreQuality: 92, scoreDelivery: 88, scoreInnovation: 86, scoreEsg: 78, scoreRisk: 18, cyberRating: 'A', ecovadis: 78, scope3KtCo2e: 4.2, finHealth: 'Strong', country: 'US', altSources: 2, flags: ['USD FX exposure', 'Dual-source path: Juniper'] }),
  v({ code: 'NOK',  name: 'Nokia',             category: 'Network', subcat: '5G core / RAN',     spend: 11600, ccy: 'BSD', tier: 'Strategic', kraljic: 'Strategic', contracts: 8,  renewalDate: '2026-12', noticeDays: 180, daysToNotice: 22,  otif: 0.91, scoreQuality: 90, scoreDelivery: 84, scoreInnovation: 82, scoreEsg: 84, scoreRisk: 24, cyberRating: 'A', ecovadis: 82, scope3KtCo2e: 3.8, finHealth: 'Stable', country: 'FI', altSources: 1, flags: ['Notice window OPEN', 'Single-source 5G core'] }),
  v({ code: 'CSCP', name: 'CommScope',         category: 'CPE',     subcat: 'ONT/CPE',           spend:  8400, ccy: 'USD', tier: 'Strategic', kraljic: 'Leverage',  contracts: 4,  renewalDate: '2027-08', noticeDays: 90,  daysToNotice: 184, otif: 0.88, scoreQuality: 84, scoreDelivery: 78, scoreInnovation: 64, scoreEsg: 62, scoreRisk: 36, cyberRating: 'B', ecovadis: 64, scope3KtCo2e: 6.4, finHealth: 'Watch', country: 'US', altSources: 3, flags: ['Financial watchlist', 'Lead time +18d vs PY'] }),
  v({ code: 'PLS',  name: 'Sports add-on (Cable Bahamas)',       category: 'Content', subcat: 'TV/Sport rights',   spend: 18400, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck',contracts: 6,  renewalDate: '2027-01', noticeDays: 120, daysToNotice: 38,  otif: 0.99, scoreQuality: 92, scoreDelivery: 99, scoreInnovation: 70, scoreEsg: 72, scoreRisk: 28, cyberRating: 'A', ecovadis: 72, scope3KtCo2e: 0.8, finHealth: 'Strong', country: 'BE', altSources: 0, flags: ['Renewal critical', 'FX-neutral'] }),
  v({ code: 'CMCS', name: 'Illustrative holding company / Sunrise', category: 'Content', subcat: 'Platform & content',spend: 22800, ccy: 'USD', tier: 'Strategic', kraljic: 'Strategic', contracts: 3,  renewalDate: '2028-11', noticeDays: 365, daysToNotice: 540, otif: 0.96, scoreQuality: 88, scoreDelivery: 90, scoreInnovation: 84, scoreEsg: 70, scoreRisk: 22, cyberRating: 'A', ecovadis: 76, scope3KtCo2e: 1.4, finHealth: 'Strong', country: 'BE', altSources: 0, flags: ['Largest single vendor 12% of spend'] }),
  v({ code: 'AWS',  name: 'AWS',               category: 'Cloud & SaaS', subcat: 'Public cloud', spend:  4600, ccy: 'USD', tier: 'Strategic', kraljic: 'Strategic', contracts: 2,  renewalDate: '2028-05', noticeDays: 30,  daysToNotice: 540, otif: 1.00, scoreQuality: 96, scoreDelivery: 99, scoreInnovation: 92, scoreEsg: 80, scoreRisk: 16, cyberRating: 'A', ecovadis: 80, scope3KtCo2e: 0.6, finHealth: 'Strong', country: 'US', altSources: 2, flags: ['Reserved instance optimisation BSD 420K'] }),
  v({ code: 'SFDC', name: 'Salesforce',        category: 'Cloud & SaaS', subcat: 'CRM',          spend:  2800, ccy: 'USD', tier: 'Preferred',kraljic: 'Leverage',  contracts: 1,  renewalDate: '2027-09', noticeDays: 60,  daysToNotice: 320, otif: 1.00, scoreQuality: 86, scoreDelivery: 96, scoreInnovation: 78, scoreEsg: 78, scoreRisk: 20, cyberRating: 'A', ecovadis: 80, scope3KtCo2e: 0.2, finHealth: 'Strong', country: 'US', altSources: 2 }),
  v({ code: 'KN',   name: 'Island Civils (demo)',                category: 'Field services', subcat: 'Civils/install', spend: 12800, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 4, renewalDate: '2027-03', noticeDays: 90, daysToNotice: 124, otif: 0.86, scoreQuality: 78, scoreDelivery: 74, scoreInnovation: 50, scoreEsg: 68, scoreRisk: 38, cyberRating: 'C', ecovadis: 58, scope3KtCo2e: 8.2, finHealth: 'Stable', country: 'BE', altSources: 2, flags: ['SLA breach 2x last quarter'] }),
  v({ code: 'ACTV', name: 'Imtech',                  category: 'Field services', subcat: 'Field engineers', spend: 6400, ccy: 'BSD', tier: 'Preferred', kraljic: 'Routine', contracts: 2, renewalDate: '2027-05', noticeDays: 60, daysToNotice: 174, otif: 0.84, scoreQuality: 76, scoreDelivery: 80, scoreInnovation: 48, scoreEsg: 62, scoreRisk: 32, cyberRating: 'C', ecovadis: 56, scope3KtCo2e: 4.4, finHealth: 'Stable', country: 'BE', altSources: 3, diversity: 'Bahamian SME' }),
  v({ code: 'ESBT', name: 'Island utility (demo) (wayleaves)',       category: 'Wayleaves', subcat: 'Pole/duct access', spend: 8800, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 2, renewalDate: 'rolling', noticeDays: 0, daysToNotice: 0, otif: 0.92, scoreQuality: 88, scoreDelivery: 86, scoreInnovation: 40, scoreEsg: 72, scoreRisk: 24, cyberRating: 'B', ecovadis: 70, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'BE', altSources: 0, flags: ['Regulated rate · URCA'] }),
  v({ code: 'ESBE', name: 'Engie The Bahamas',           category: 'Energy',  subcat: 'Electricity (DC + sites)', spend: 14400, ccy: 'BSD', tier: 'Strategic', kraljic: 'Leverage', contracts: 3, renewalDate: '2027-04', noticeDays: 90, daysToNotice: 156, otif: 1.00, scoreQuality: 84, scoreDelivery: 96, scoreInnovation: 60, scoreEsg: 64, scoreRisk: 28, cyberRating: 'B', ecovadis: 66, scope3KtCo2e: 12.8, finHealth: 'Strong', country: 'BE', altSources: 3, flags: ['Inflation pass-through BSD 420K'] }),
  v({ code: 'EIRG', name: 'Island utility (demo) Grid',               category: 'Energy',  subcat: 'Grid connection',   spend:  1800, ccy: 'BSD', tier: 'Approved', kraljic: 'Bottleneck', contracts: 1, renewalDate: '2028-09', noticeDays: 180, daysToNotice: 720, otif: 1.00, scoreQuality: 82, scoreDelivery: 92, scoreInnovation: 50, scoreEsg: 72, scoreRisk: 18, cyberRating: 'B', ecovadis: 68, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'BE', altSources: 0 }),
  v({ code: 'AKAM', name: 'Akamai',            category: 'Cloud & SaaS', subcat: 'CDN/security', spend:  2100, ccy: 'USD', tier: 'Preferred', kraljic: 'Leverage', contracts: 2, renewalDate: '2027-02', noticeDays: 30, daysToNotice: 75,  otif: 0.99, scoreQuality: 88, scoreDelivery: 98, scoreInnovation: 76, scoreEsg: 74, scoreRisk: 22, cyberRating: 'A', ecovadis: 76, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'US', altSources: 3 }),
  v({ code: 'JUNP', name: 'Juniper Networks',  category: 'Network', subcat: 'Edge/MPLS',         spend:  3200, ccy: 'USD', tier: 'Preferred', kraljic: 'Leverage', contracts: 3, renewalDate: '2027-07', noticeDays: 90, daysToNotice: 270, otif: 0.92, scoreQuality: 88, scoreDelivery: 86, scoreInnovation: 78, scoreEsg: 72, scoreRisk: 22, cyberRating: 'A', ecovadis: 74, scope3KtCo2e: 1.2, finHealth: 'Strong', country: 'US', altSources: 2 }),
  v({ code: 'ERIC', name: 'Ericsson',          category: 'Network', subcat: 'RAN backup',        spend:  2200, ccy: 'BSD', tier: 'Approved', kraljic: 'Strategic', contracts: 2, renewalDate: '2028-01', noticeDays: 180, daysToNotice: 460, otif: 0.90, scoreQuality: 88, scoreDelivery: 82, scoreInnovation: 84, scoreEsg: 86, scoreRisk: 24, cyberRating: 'A', ecovadis: 84, scope3KtCo2e: 1.4, finHealth: 'Stable', country: 'SE', altSources: 1 }),
  v({ code: 'INFOSYS', name: 'Infosys', category: 'Pro services', subcat: 'IT services', spend: 5200, ccy: 'BSD', tier: 'Preferred', kraljic: 'Leverage', contracts: 4, renewalDate: '2027-08', noticeDays: 90, daysToNotice: 290, otif: 0.94, scoreQuality: 84, scoreDelivery: 88, scoreInnovation: 70, scoreEsg: 72, scoreRisk: 26, cyberRating: 'B', ecovadis: 72, scope3KtCo2e: 0.8, finHealth: 'Strong', country: 'IN', altSources: 4 }),
  v({ code: 'DELL', name: 'Dell Technologies', category: 'Cloud & SaaS', subcat: 'Server/storage', spend: 3800, ccy: 'USD', tier: 'Preferred', kraljic: 'Leverage', contracts: 3, renewalDate: '2027-04', noticeDays: 60, daysToNotice: 162, otif: 0.92, scoreQuality: 88, scoreDelivery: 86, scoreInnovation: 70, scoreEsg: 70, scoreRisk: 24, cyberRating: 'A', ecovadis: 72, scope3KtCo2e: 2.2, finHealth: 'Strong', country: 'US', altSources: 3 }),
  v({ code: 'IBM',  name: 'IBM',               category: 'Pro services', subcat: 'Mainframe/AI', spend: 4400, ccy: 'BSD', tier: 'Preferred', kraljic: 'Strategic', contracts: 5, renewalDate: '2027-11', noticeDays: 180, daysToNotice: 380, otif: 0.94, scoreQuality: 86, scoreDelivery: 86, scoreInnovation: 78, scoreEsg: 76, scoreRisk: 22, cyberRating: 'A', ecovadis: 76, scope3KtCo2e: 1.6, finHealth: 'Strong', country: 'US', altSources: 2 }),
  v({ code: 'GAA',  name: 'Sports package Rights', category: 'Content', subcat: 'Sport rights',      spend:  3800, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 1, renewalDate: '2028-05', noticeDays: 90, daysToNotice: 540, otif: 1.00, scoreQuality: 95, scoreDelivery: 100, scoreInnovation: 50, scoreEsg: 80, scoreRisk: 16, cyberRating: 'B', ecovadis: 70, scope3KtCo2e: 0.2, finHealth: 'Strong', country: 'BE', altSources: 0 }),
  v({ code: 'PL',   name: 'Sports package',    category: 'Content', subcat: 'Sport rights',      spend:  6200, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 1, renewalDate: '2027-10', noticeDays: 365, daysToNotice: 360, otif: 1.00, scoreQuality: 96, scoreDelivery: 100, scoreInnovation: 60, scoreEsg: 72, scoreRisk: 18, cyberRating: 'B', ecovadis: 68, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'BE', altSources: 0, flags: ['Auction cycle 2027'] }),
  v({ code: 'NBCU', name: 'VTM / DPG Media',       category: 'Content', subcat: 'Studio content',    spend:  4800, ccy: 'USD', tier: 'Strategic', kraljic: 'Strategic', contracts: 2, renewalDate: '2027-05', noticeDays: 180, daysToNotice: 178, otif: 1.00, scoreQuality: 92, scoreDelivery: 99, scoreInnovation: 78, scoreEsg: 70, scoreRisk: 22, cyberRating: 'A', ecovadis: 70, scope3KtCo2e: 0.6, finHealth: 'Strong', country: 'BE', altSources: 1, flags: ['Notice window OPEN'] }),
  v({ code: 'TFL',  name: 'Volvo Trucks The Bahamas',     category: 'Fleet',   subcat: 'Field van leasing', spend:  2200, ccy: 'BSD', tier: 'Approved', kraljic: 'Routine', contracts: 1, renewalDate: '2028-02', noticeDays: 60, daysToNotice: 410, otif: 0.96, scoreQuality: 80, scoreDelivery: 86, scoreInnovation: 56, scoreEsg: 78, scoreRisk: 22, cyberRating: 'C', ecovadis: 66, scope3KtCo2e: 4.8, finHealth: 'Stable', country: 'BE', altSources: 3, diversity: 'Bahamian SME' }),
  v({ code: 'OFM',  name: 'Publicis The Bahamas',         category: 'Marketing', subcat: 'Above-the-line', spend: 4400, ccy: 'BSD', tier: 'Preferred', kraljic: 'Leverage', contracts: 3, renewalDate: '2027-03', noticeDays: 60, daysToNotice: 124, otif: 0.92, scoreQuality: 80, scoreDelivery: 84, scoreInnovation: 76, scoreEsg: 64, scoreRisk: 26, cyberRating: 'C', ecovadis: 60, scope3KtCo2e: 0.6, finHealth: 'Stable', country: 'BE', altSources: 4, diversity: 'Bahamian SME' }),
  v({ code: 'GOOG', name: 'Google Ads',        category: 'Marketing', subcat: 'Digital media',    spend:  3600, ccy: 'BSD', tier: 'Preferred', kraljic: 'Leverage', contracts: 1, renewalDate: 'rolling', noticeDays: 0, daysToNotice: 0, otif: 1.00, scoreQuality: 88, scoreDelivery: 96, scoreInnovation: 84, scoreEsg: 70, scoreRisk: 18, cyberRating: 'A', ecovadis: 78, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'ES', altSources: 2 }),
  v({ code: 'META', name: 'Meta Ads',          category: 'Marketing', subcat: 'Digital media',    spend:  2400, ccy: 'BSD', tier: 'Approved', kraljic: 'Routine', contracts: 1, renewalDate: 'rolling', noticeDays: 0, daysToNotice: 0, otif: 1.00, scoreQuality: 84, scoreDelivery: 94, scoreInnovation: 78, scoreEsg: 60, scoreRisk: 22, cyberRating: 'A', ecovadis: 64, scope3KtCo2e: 0.4, finHealth: 'Strong', country: 'ES', altSources: 2 }),
  v({ code: 'JLL',  name: 'JLL (facilities)',  category: 'Facilities', subcat: 'Office estate',   spend:  3200, ccy: 'BSD', tier: 'Preferred', kraljic: 'Routine', contracts: 1, renewalDate: '2028-05', noticeDays: 180, daysToNotice: 540, otif: 0.96, scoreQuality: 86, scoreDelivery: 90, scoreInnovation: 60, scoreEsg: 80, scoreRisk: 18, cyberRating: 'B', ecovadis: 80, scope3KtCo2e: 0.8, finHealth: 'Strong', country: 'ES', altSources: 4 }),
  v({ code: 'ROAM', name: 'Roaming partners (15)', category: 'Roaming', subcat: 'Wholesale roaming', spend: 5800, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 15, renewalDate: 'various', noticeDays: 90, daysToNotice: 0, otif: 0.94, scoreQuality: 78, scoreDelivery: 86, scoreInnovation: 50, scoreEsg: 64, scoreRisk: 30, cyberRating: 'B', ecovadis: 62, scope3KtCo2e: 0.4, finHealth: 'Stable', country: 'US', altSources: 0 }),
  v({ code: 'OFCM', name: 'URCA (spectrum fees)',  category: 'Wayleaves', subcat: 'Spectrum licence', spend: 5400, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 4, renewalDate: '2030+', noticeDays: 0, daysToNotice: 0, otif: 1.00, scoreQuality: 100, scoreDelivery: 100, scoreInnovation: 0, scoreEsg: 80, scoreRisk: 12, cyberRating: 'A', ecovadis: 0, scope3KtCo2e: 0, finHealth: 'Strong', country: 'BE', altSources: 0, flags: ['Statutory · multi-year liability'] }),
  v({ code: 'MAST', name: 'TDF The Bahamas (mast lease)', category: 'Facilities', subcat: 'Mast/rooftop', spend: 6800, ccy: 'BSD', tier: 'Strategic', kraljic: 'Bottleneck', contracts: 8, renewalDate: '2029-05', noticeDays: 365, daysToNotice: 920, otif: 0.99, scoreQuality: 86, scoreDelivery: 94, scoreInnovation: 50, scoreEsg: 72, scoreRisk: 22, cyberRating: 'B', ecovadis: 70, scope3KtCo2e: 0.6, finHealth: 'Stable', country: 'BE', altSources: 1 }),
  v({ code: 'TAIL', name: 'Tail spend (412 vendors)', category: 'Pro services', subcat: 'Long-tail', spend: 11200, ccy: 'BSD', tier: 'Tail', kraljic: 'Routine', contracts: 412, renewalDate: 'various', noticeDays: 0, daysToNotice: 0, otif: 0.86, scoreQuality: 70, scoreDelivery: 72, scoreInnovation: 40, scoreEsg: 50, scoreRisk: 42, cyberRating: 'C', ecovadis: 50, scope3KtCo2e: 2.2, finHealth: 'Stable', country: 'BE', altSources: 99, flags: ['Consolidation lever BSD 1.4M'] }),
]

// Spend cube
export const spendByCategory = (() => {
  const map = new Map<Category, number>()
  vendors.forEach((vd) => map.set(vd.category, (map.get(vd.category) ?? 0) + vd.spend))
  return Array.from(map.entries()).map(([category, spend]) => ({ category, spend })).sort((a, b) => b.spend - a.spend)
})()

export const spendByCcy = (() => {
  const map = new Map<string, number>()
  vendors.forEach((vd) => map.set(vd.ccy, (map.get(vd.ccy) ?? 0) + vd.spend))
  return Array.from(map.entries()).map(([ccy, spend]) => ({ ccy, spend }))
})()

export const spendByCountry = (() => {
  const map = new Map<string, number>()
  vendors.forEach((vd) => map.set(vd.country, (map.get(vd.country) ?? 0) + vd.spend))
  return Array.from(map.entries()).map(([country, spend]) => ({ country, spend })).sort((a, b) => b.spend - a.spend)
})()

// Quarterly spend trend (BSD K) by category — last 8 quarters
export const spendTrend = Array.from({ length: 8 }, (_, i) => ({
  q: ['23Q3','23Q4','24Q1','24Q2','24Q3','24Q4','25Q1','25Q2'][i],
  Network:        Math.round(7800  + i * 60  + Math.sin(i / 1.4) * 240),
  CPE:            Math.round(2400  + i * 40  + Math.cos(i / 1.6) * 180),
  Content:        Math.round(13200 + i * 80  + Math.sin(i / 2.0) * 480),
  'Cloud & SaaS': Math.round(3200  + i * 200 + Math.cos(i / 1.2) * 120),
  Energy:         Math.round(3600  + i * 140 + Math.sin(i / 1.7) * 160),
  Other:          Math.round(8000  + i * 80  + Math.sin(i / 2.4) * 220),
}))

// Direct vs indirect, capex vs opex
export const directIndirect = [
  { type: 'Direct (Network/CPE/Content)', value: 102 },
  { type: 'Indirect (SG&A/IT/Mkt/Pro)',   value:  62 },
  { type: 'Statutory (spectrum/wayleave)', value: 22 },
]
export const capexOpex = [
  { type: 'Capex',  value: 64 },
  { type: 'Opex',   value: 122 },
]

// Maverick / off-contract spend
export const compliance = {
  spendUnderManagement: 0.84,
  poBacked: 0.91,
  catalogueAdoption: 0.62,
  threeWayMatchRate: 0.88,
  maverickSpendPct: 0.07,
  earlyPayDiscountCapture: 0.42,
  dso: 64,
  dpo: 62,
}

// Renewal cliff next 24 months (BSD K)
export const renewalCliff = Array.from({ length: 24 }, (_, i) => {
  const base = [0, 11600, 22800, 7200, 0, 18400, 4400, 4800, 2100, 12800, 6400, 14400, 0, 6800, 0, 3200, 4400, 11600, 0, 6200, 0, 8400, 0, 4400][i]
  const cnt = Math.max(0, Math.round(base / 4000))
  return { month: i + 1, value: base, count: cnt }
})

// Auto-renew alerts (notice window open / closing soon)
export const noticeAlerts = vendors.filter((vd) => vd.daysToNotice > 0 && vd.daysToNotice <= vd.noticeDays).sort((a, b) => a.daysToNotice - b.daysToNotice)

// Sourcing pipeline (RFx)
export const rfxPipeline = [
  { rfx: 'RFP-2026-01 5G RAN refresh',         category: 'Network',      stage: 'Negotiation', value: 24, identified: 3.2, owner: 'C. Adderley', vendors: 3 },
  { rfx: 'RFP-2026-04 CPE next-gen ONT',       category: 'CPE',          stage: 'Evaluation',  value: 18, identified: 2.4, owner: 'L. Knowles', vendors: 4 },
  { rfx: 'RFP-2026-07 Content platform DAI',   category: 'Content',      stage: 'Awarded',     value: 14, identified: 1.8, owner: 'M. Rolle',  vendors: 2 },
  { rfx: 'RFP-2026-09 Cloud commit renewal',   category: 'Cloud & SaaS', stage: 'Negotiation', value: 12, identified: 1.6, owner: 'A. Willems',  vendors: 2 },
  { rfx: 'RFP-2026-11 Field-services panel',   category: 'Field services', stage: 'Bid open',  value: 22, identified: 2.8, owner: 'D. Knowles', vendors: 5 },
  { rfx: 'RFP-2026-13 Mast / rooftop master',  category: 'Facilities',   stage: 'Discovery',   value:  8, identified: 0.4, owner: 'A. Willems',  vendors: 3 },
  { rfx: 'RA-2026-02 Tail-spend wave 1',       category: 'Pro services', stage: 'Reverse-auction', value: 6, identified: 1.4, owner: 'L. Knowles', vendors: 12 },
  { rfx: 'RFP-2026-15 Subsea capacity',        category: 'Network',      stage: 'Discovery',   value: 18, identified: 2.0, owner: 'C. Adderley',  vendors: 2 },
]

// Savings P&L
export const savingsTracker = {
  targetFY: 12.0,
  identified: 14.8,
  contracted: 9.6,
  realised: 6.4,
  leakage: 0.8,
  costAvoidance: 4.2,
  costReduction: 2.2,
}

// Savings by category (BSD M realised)
export const savingsByCategory = [
  { category: 'Network',         target: 3.2, realised: 1.8 },
  { category: 'CPE',             target: 1.8, realised: 1.2 },
  { category: 'Content',         target: 2.4, realised: 1.4 },
  { category: 'Cloud & SaaS',    target: 1.6, realised: 0.9 },
  { category: 'Field services',  target: 1.2, realised: 0.4 },
  { category: 'Energy',          target: 0.8, realised: 0.3 },
  { category: 'Marketing',       target: 0.6, realised: 0.2 },
  { category: 'Pro services',    target: 0.4, realised: 0.2 },
]

// Risk register
export const risks = [
  { id: 'R-001', vendor: 'CommScope', kind: 'Financial',   sev: 'Medium', detail: 'D&B downgraded to B2', owner: 'L. De Vos',  due: '2027-02-28' },
  { id: 'R-002', vendor: 'Sports add-on', kind: 'Renewal',   sev: 'High',   detail: 'Single source for live sport — exit cost BSD 18M', owner: 'M. Ó Conn', due: '2027-01-15' },
  { id: 'R-003', vendor: 'Nokia',       kind: 'Single source', sev: 'High', detail: '5G core single-vendor, qual Ericsson dual', owner: 'C. Adderley', due: '2027-05-31' },
  { id: 'R-004', vendor: 'Island Civils (demo)',   kind: 'Operational', sev: 'Medium', detail: 'OTIF below SLA 2 quarters running', owner: 'D. Knowles', due: '2026-12-31' },
  { id: 'R-005', vendor: 'AWS',       kind: 'Concentration', sev: 'Low', detail: 'No multi-cloud failover — RPO 24h', owner: 'A. Knowles',  due: '2027-06-30' },
  { id: 'R-006', vendor: 'CommScope', kind: 'Geopolitical', sev: 'Medium', detail: 'Taiwan supplier exposure for ASICs', owner: 'L. De Vos',  due: '2027-04-30' },
  { id: 'R-007', vendor: 'Tail (412)', kind: 'Cyber',     sev: 'Medium', detail: 'URCA cyber: 38 vendors lacking attestation', owner: 'A. Knowles',  due: '2027-03-15' },
  { id: 'R-008', vendor: 'Roaming x15', kind: 'Sanctions', sev: 'Low',   detail: 'Annual sanctions screening due', owner: 'C. Willems', due: '2027-02-01' },
]

// Inventory (CPE, ONT, SIM, STB)
export const inventory = [
  { sku: 'ONT-G2',   onHand: 4200, onOrder: 1800, weeksCover: 12, ageDays: 38, leadTime: 84, statusOk: true },
  { sku: 'ONT-G3',   onHand:  840, onOrder: 4200, weeksCover:  3, ageDays: 12, leadTime: 110, statusOk: false },
  { sku: 'STB-4K',   onHand: 1820, onOrder:  600, weeksCover: 18, ageDays: 86, leadTime: 56, statusOk: true },
  { sku: 'WIFI-POD', onHand: 6400, onOrder: 2200, weeksCover: 22, ageDays: 24, leadTime: 42, statusOk: true },
  { sku: 'SIM-PRE',  onHand: 84000,onOrder: 60000,weeksCover: 14, ageDays: 18, leadTime: 28, statusOk: true },
  { sku: 'eSIM',     onHand: 12000,onOrder: 18000,weeksCover:  6, ageDays:  8, leadTime: 21, statusOk: true },
  { sku: 'ROUTER-AX',onHand:  220, onOrder: 1800, weeksCover:  2, ageDays:  6, leadTime: 92, statusOk: false },
  { sku: 'CPE-VOIP', onHand: 1100, onOrder:    0, weeksCover: 28, ageDays:184, leadTime: 56, statusOk: false },
]

// Lead-time trend (days · 12 months)
export const leadTimeTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i],
  cpe:    72 + Math.round(Math.sin(i / 1.5) * 12),
  router: 88 + Math.round(Math.cos(i / 1.7) * 18),
  cards:  64 + Math.round(Math.sin(i / 2.1) * 8),
}))

// Warehouse footprint
export const warehouses = [
  { wh: 'Nassau DC',    kpisIn: 12400, kpisOut: 11800, util: 0.82, picksPerDay: 1840 },
  { wh: 'Freeport',         kpisIn:  3400, kpisOut:  3100, util: 0.68, picksPerDay:  420 },
  { wh: 'Bimini',      kpisIn:  1800, kpisOut:  1700, util: 0.62, picksPerDay:  220 },
]

// Sustainability
export const scope3ByCategory = [
  { category: 'Energy',          ktCo2e: 12.8 },
  { category: 'Field services',  ktCo2e: 12.6 },
  { category: 'CPE',             ktCo2e: 6.4 },
  { category: 'Network',         ktCo2e: 11.8 },
  { category: 'Fleet',           ktCo2e: 4.8 },
  { category: 'Content',         ktCo2e: 3.4 },
  { category: 'Pro services',    ktCo2e: 3.0 },
  { category: 'Cloud & SaaS',    ktCo2e: 2.2 },
  { category: 'Other',           ktCo2e: 2.4 },
]
export const ecovadisDist = [
  { band: '70-100', label: 'Advanced',    count: 18 },
  { band: '50-69',  label: 'Confirmed',   count: 32 },
  { band: '30-49',  label: 'Engaged',     count: 22 },
  { band: '0-29',   label: 'Insufficient',count: 8 },
  { band: 'N/A',    label: 'Not assessed',count: 6 },
]
export const diversitySpend = [
  { kind: 'Bahamian SME',     value: 18.4 },
  { kind: 'Women-owned',   value:  4.2 },
  { kind: 'B-Corp',        value:  2.6 },
  { kind: 'Standard',      value: 160.8 },
]

// Sourcing benchmarks (vendor cost vs market index 100)
export const benchmark = [
  { lever: 'Network OEM unit price',  cablebahamas: 96, market: 100, peer: 98 },
  { lever: 'CPE bill of materials',   cablebahamas: 102, market: 100, peer: 99 },
  { lever: 'Content per-sub cost',    cablebahamas: 104, market: 100, peer: 100 },
  { lever: 'Cloud BSD /vCPU·hr',         cablebahamas:  92, market: 100, peer:  96 },
  { lever: 'Field labour BSD /install',  cablebahamas: 108, market: 100, peer: 102 },
  { lever: 'Energy BSD /MWh',            cablebahamas:  98, market: 100, peer: 100 },
]

// =============================================================================
// Vendor 360 deterministic synth
// =============================================================================
function hashCode(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }; return h >>> 0 }
function mulberry32(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export type VendorDetails = {
  vendor: Vendor
  spendTrend: { q: string; spend: number }[]
  contractsList: { id: string; type: string; start: string; end: string; value: number; auto: boolean; mfn: boolean; cpi: boolean }[]
  poTrend: { m: string; po: number; gr: number }[]
  pricePoints: { m: string; index: number }[]
  altSources: { name: string; readiness: 'Ready' | 'Qualifying' | 'None'; gapMonths: number }[]
  contacts: { role: string; name: string }[]
  openOrders: { po: string; eta: string; value: number; status: string }[]
  invoices: { inv: string; date: string; amt: number; due: string; status: string }[]
  flagsAuto: { kind: string; sev: 'info' | 'warn' | 'crit'; text: string }[]
}

export function buildVendorDetails(code: string): VendorDetails {
  const vd = vendors.find((x) => x.code === code) ?? vendors[0]
  const r = mulberry32(hashCode(vd.code))
  const spendTrend = ['23Q3','23Q4','24Q1','24Q2','24Q3','24Q4','25Q1','25Q2'].map((q, i) => ({ q, spend: Math.round((vd.spend / 4) * (0.7 + i * 0.04 + (r() - 0.5) * 0.2)) }))

  const contractTypes = ['MSA', 'SOW', 'License', 'Lease', 'Rebate', 'Support']
  const nC = Math.max(1, Math.min(vd.contracts, 6))
  const contractsList = Array.from({ length: nC }, (_, i) => ({
    id: `${vd.code}-CT-${1000 + i}`,
    type: contractTypes[i % contractTypes.length],
    start: `202${2 + Math.floor(r() * 3)}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}`,
    end: vd.renewalDate,
    value: Math.round((vd.spend / nC) * (0.6 + r() * 1.2)),
    auto: r() > 0.5,
    mfn: r() > 0.7,
    cpi: r() > 0.4,
  }))

  const poTrend = ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'].map(() => ({
    m: '', po: Math.round(vd.spend / 12 * (0.7 + r() * 0.6)), gr: Math.round(vd.spend / 12 * (0.65 + r() * 0.6)),
  })).map((x, i) => ({ ...x, m: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i] }))

  const pricePoints = ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'].map(() => ({
    m: '', index: 100 + Math.round((r() - 0.5) * 14),
  })).map((x, i) => ({ ...x, m: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i] }))

  const altPool = ['Juniper', 'Ericsson', 'Nokia', 'Cisco', 'Huawei (restricted)', 'ZTE (restricted)', 'Calix', 'Adtran', 'Open Compute', 'Microsoft', 'GCP', 'OCI']
  const altSources = altPool.slice().sort(() => r() - 0.5).slice(0, 3).map((name) => ({
    name,
    readiness: (['Ready', 'Qualifying', 'None'] as const)[Math.floor(r() * 3)],
    gapMonths: Math.round(r() * 18),
  }))

  const contacts = [
    { role: 'Account Director', name: 'Senior Exec A' },
    { role: 'Solution Architect', name: 'Senior Exec B' },
    { role: 'Customer Success', name: 'Senior Exec C' },
    { role: 'Finance/Billing', name: 'Senior Exec D' },
  ]

  const openOrders = Array.from({ length: 3 + Math.floor(r() * 4) }, (_, i) => ({
    po: `PO-${vd.code}-${5000 + i}`,
    eta: `2026-${String(7 + Math.floor(r() * 6)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`,
    value: Math.round((vd.spend / 24) * (0.5 + r() * 1.5)),
    status: (['Open','Shipped','Delayed','Acknowledged'] as const)[Math.floor(r() * 4)],
  }))

  const invoices = Array.from({ length: 4 }, (_, i) => ({
    inv: `INV-${vd.code}-${9000 + i}`,
    date: `2026-${String(1 + Math.floor(r() * 6)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`,
    amt: Math.round((vd.spend / 12) * (0.4 + r() * 1.2)),
    due: `2026-${String(7 + Math.floor(r() * 4)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`,
    status: (['Paid','Approved','Open','Disputed'] as const)[Math.floor(r() * 4)],
  }))

  const flagsAuto: VendorDetails['flagsAuto'] = []
  if (vd.daysToNotice > 0 && vd.daysToNotice <= vd.noticeDays) flagsAuto.push({ kind: 'renewal', sev: 'crit', text: `Notice window OPEN — ${vd.daysToNotice}d to deadline` })
  if (vd.altSources === 0) flagsAuto.push({ kind: 'risk', sev: 'crit', text: 'Single-source — no qualified alternate' })
  if (vd.finHealth === 'Watch' || vd.finHealth === 'Distressed') flagsAuto.push({ kind: 'risk', sev: 'warn', text: `Financial health: ${vd.finHealth}` })
  if (vd.otif < 0.9) flagsAuto.push({ kind: 'ops', sev: 'warn', text: `OTIF ${(vd.otif * 100).toFixed(0)}% below 90% target` })
  if (vd.cyberRating === 'C' || vd.cyberRating === 'D' || vd.cyberRating === 'F') flagsAuto.push({ kind: 'cyber', sev: 'warn', text: `Cyber rating ${vd.cyberRating} — URCA cyber attestation required` })
  if (vd.ecovadis < 50 && vd.ecovadis > 0) flagsAuto.push({ kind: 'esg', sev: 'info', text: `EcoVadis ${vd.ecovadis} below preferred-vendor floor` })
  if (vd.ccy !== 'BSD') flagsAuto.push({ kind: 'fx', sev: 'info', text: `${vd.ccy} FX exposure — hedge review` })
  if (vd.autoRenew) flagsAuto.push({ kind: 'renewal', sev: 'warn', text: 'Auto-renew clause active — set notice reminder' })
  vd.flags.forEach((f) => flagsAuto.push({ kind: 'note', sev: 'info', text: f }))

  return { vendor: vd, spendTrend, contractsList, poTrend, pricePoints, altSources, contacts, openOrders, invoices, flagsAuto }
}
