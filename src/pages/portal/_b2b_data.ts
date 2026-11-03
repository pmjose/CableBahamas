// =============================================================================
// B2B / Wholesale cockpit synthetic data (Cable Bahamas)
// =============================================================================
export type Segment = 'Enterprise' | 'Mid-Market' | 'SMB' | 'Wholesale-Carrier' | 'Wholesale-Infra'
export type Vertical = 'Banking' | 'Public' | 'Retail' | 'Travel' | 'Manufacturing' | 'Education' | 'Healthcare' | 'Hospitality' | 'Media' | 'Tech'
export type AccountStatus = 'Healthy' | 'Watch' | 'At Risk' | 'Renewal' | 'Churned'

export type Account = {
  code: string
  name: string
  segment: Segment
  vertical: Vertical
  region: 'Nassau' | 'Freeport' | 'Abaco' | 'Eleuthera' | 'Long Island' | 'Andros' | 'Bimini' | 'Exuma' | 'Inagua' | 'New Providence' | 'National'
  mrr: number
  arr: number
  sites: number
  circuits: number
  contractEnd: string // ISO YYYY-MM
  wault: number // months
  status: AccountStatus
  nps: number
  health: number // 0-100
  ownerAE: string
  vertId: number
  exec: string
}

export const accounts: Account[] = [
  { code: 'Commonwealth Bank (demo)',    name: 'Commonwealth Bank (demo)',          segment: 'Enterprise',        vertical: 'Banking',       region: 'Nassau',   mrr: 184000, arr: 2208000, sites: 320, circuits: 412, contractEnd: '2027-08', wault: 22, status: 'Healthy',  nps: 48, health: 88, ownerAE: 'Femke Adderley',  vertId: 1, exec: 'Wout Rolle'   },
  { code: 'SN',     name: 'Atlantis Resort Group',  segment: 'Enterprise',        vertical: 'Travel',        region: 'New Providence',  mrr: 142000, arr: 1704000, sites: 18,  circuits: 64,  contractEnd: '2027-02', wault: 4,  status: 'Renewal',  nps: 31, health: 64, ownerAE: 'Daan Bethel',    vertId: 2, exec: 'Wout Rolle'   },
  { code: 'PRIM',    name: 'Super Value Group (demo)',            segment: 'Enterprise',        vertical: 'Retail',        region: 'National',  mrr: 96000,  arr: 1152000, sites: 38,  circuits: 76,  contractEnd: '2028-04', wault: 30, status: 'Healthy',  nps: 52, health: 82, ownerAE: 'Sofie Knowles', vertId: 3, exec: 'Wout Rolle'   },
  { code: 'SNS',     name: 'BPost',                   segment: 'Enterprise',        vertical: 'Public',        region: 'National',  mrr: 78000,  arr: 936000,  sites: 240, circuits: 380, contractEnd: '2026-11', wault: 1,  status: 'Renewal',  nps: 12, health: 48, ownerAE: 'Public Team',  vertId: 4, exec: 'Wout Rolle'  },
  { code: 'TCD',     name: 'KU Eleuthera',               segment: 'Mid-Market',        vertical: 'Education',     region: 'Eleuthera',    mrr: 62000,  arr: 744000,  sites: 12,  circuits: 28,  contractEnd: '2029-01', wault: 39, status: 'Healthy',  nps: 56, health: 90, ownerAE: 'Lars Vermeulen', vertId: 5, exec: 'Thomas Knowles'  },
  { code: 'CRH',     name: 'Besix Group',             segment: 'Enterprise',        vertical: 'Manufacturing', region: 'Nassau',   mrr: 48000,  arr: 576000,  sites: 28,  circuits: 56,  contractEnd: '2027-01', wault: 3,  status: 'At Risk',  nps: -8, health: 38, ownerAE: 'Daan Bethel',    vertId: 6, exec: 'Wout Rolle'   },
  { code: 'Island Bank (demo)',     name: 'Island Bank (demo) Bank',                segment: 'Enterprise',        vertical: 'Banking',       region: 'Nassau',   mrr: 156000, arr: 1872000, sites: 280, circuits: 360, contractEnd: '2027-06', wault: 20, status: 'Healthy',  nps: 44, health: 84, ownerAE: 'Femke Adderley',  vertId: 1, exec: 'Wout Rolle'   },
  { code: 'Island Bank (demo)_OLD', name: 'Scotiabank Bahamas (demo)',      segment: 'Mid-Market',        vertical: 'Banking',       region: 'New Providence',  mrr: 22000,  arr: 264000,  sites: 14,  circuits: 24,  contractEnd: '2026-05', wault: -5, status: 'Churned',  nps: -22, health: 12, ownerAE: 'Femke Adderley', vertId: 1, exec: 'Wout Rolle'   },
  { code: 'SUPERV',  name: 'AML Foods (demo)',          segment: 'Enterprise',        vertical: 'Retail',        region: 'Freeport',     mrr: 88000,  arr: 1056000, sites: 220, circuits: 240, contractEnd: '2027-10', wault: 24, status: 'Healthy',  nps: 39, health: 78, ownerAE: 'Sofie Knowles', vertId: 3, exec: 'Thomas Knowles'  },
  { code: 'DUNNES',  name: 'Carrefour The Bahamas',       segment: 'Enterprise',        vertical: 'Retail',        region: 'Nassau',   mrr: 64000,  arr: 768000,  sites: 142, circuits: 158, contractEnd: '2027-04', wault: 6,  status: 'Watch',    nps: 21, health: 60, ownerAE: 'Sofie Knowles', vertId: 3, exec: 'Thomas Knowles'  },
  { code: 'INTEL',   name: 'Island Manufacturing (demo)',              segment: 'Enterprise',        vertical: 'Tech',          region: 'Andros',  mrr: 220000, arr: 2640000, sites: 4,   circuits: 48,  contractEnd: '2028-07', wault: 33, status: 'Healthy',  nps: 61, health: 92, ownerAE: 'Lars Vermeulen', vertId: 10, exec: 'Wout Rolle'  },
  { code: 'PFIZER',  name: 'UCB Pharma',              segment: 'Enterprise',        vertical: 'Healthcare',    region: 'Freeport',     mrr: 110000, arr: 1320000, sites: 6,   circuits: 32,  contractEnd: '2028-03', wault: 29, status: 'Healthy',  nps: 49, health: 86, ownerAE: 'Lars Vermeulen', vertId: 7, exec: 'Wout Rolle'   },
  { code: 'ESB',     name: 'Fluvius',                 segment: 'Enterprise',        vertical: 'Public',        region: 'Freeport',     mrr: 132000, arr: 1584000, sites: 86,  circuits: 142, contractEnd: '2027-05', wault: 7,  status: 'Renewal',  nps: 28, health: 70, ownerAE: 'Public Team',  vertId: 4, exec: 'Wout Rolle'  },
  { code: 'IBEC',    name: 'VBO-FEB',                 segment: 'Mid-Market',        vertical: 'Public',        region: 'New Providence',  mrr: 18000,  arr: 216000,  sites: 6,   circuits: 12,  contractEnd: '2027-09', wault: 23, status: 'Healthy',  nps: 51, health: 82, ownerAE: 'Public Team',  vertId: 4, exec: 'Thomas Knowles' },
  { code: 'JURYS',   name: 'Van der Valk The Bahamas',    segment: 'Mid-Market',        vertical: 'Hospitality',   region: 'Nassau',   mrr: 36000,  arr: 432000,  sites: 22,  circuits: 28,  contractEnd: '2027-03', wault: 5,  status: 'Watch',    nps: 18, health: 58, ownerAE: 'Daan Bethel',    vertId: 8, exec: 'Thomas Knowles'  },
  { code: 'RTE',     name: 'Local broadcaster',                     segment: 'Enterprise',        vertical: 'Media',         region: 'New Providence',  mrr: 58000,  arr: 696000,  sites: 8,   circuits: 22,  contractEnd: '2027-12', wault: 26, status: 'Healthy',  nps: 42, health: 80, ownerAE: 'Lars Vermeulen', vertId: 9, exec: 'Thomas Knowles'  },
  { code: 'VHI',     name: 'Family Guardian (demo)',       segment: 'Enterprise',        vertical: 'Healthcare',    region: 'New Providence',  mrr: 72000,  arr: 864000,  sites: 9,   circuits: 24,  contractEnd: '2026-12', wault: 2,  status: 'At Risk',  nps: -3, health: 42, ownerAE: 'Lars Vermeulen', vertId: 7, exec: 'Wout Rolle'   },
  { code: 'EIR_W',   name: 'BTC (wholesale)',    segment: 'Wholesale-Carrier', vertical: 'Tech',          region: 'National',  mrr: 240000, arr: 2880000, sites: 0,   circuits: 1820, contractEnd: '2028-05', wault: 31, status: 'Healthy', nps: 22, health: 72, ownerAE: 'Wholesale Desk', vertId: 10, exec: 'Anke Ferguson' },
  { code: 'BT_W',    name: 'Rival ISP A The Bahamas (wholesale)', segment: 'Wholesale-Carrier', vertical: 'Tech',       region: 'National',  mrr: 168000, arr: 2016000, sites: 0,   circuits: 920,  contractEnd: '2027-05', wault: 7,  status: 'Renewal', nps: 18, health: 68, ownerAE: 'Wholesale Desk', vertId: 10, exec: 'Anke Ferguson' },
  { code: 'DGI_W',   name: 'Rival ISP B (wholesale)',         segment: 'Wholesale-Carrier', vertical: 'Media',         region: 'National',  mrr: 132000, arr: 1584000, sites: 0,   circuits: 640,  contractEnd: '2027-11', wault: 25, status: 'Healthy', nps: 31, health: 76, ownerAE: 'Wholesale Desk', vertId: 9, exec: 'Anke Ferguson' },
  { code: 'THREE_W', name: 'Rival ISP C (wholesale)',          segment: 'Wholesale-Carrier', vertical: 'Tech',          region: 'National',  mrr: 96000,  arr: 1152000, sites: 0,   circuits: 380,  contractEnd: '2027-01', wault: 3,  status: 'At Risk', nps: 4, health: 44, ownerAE: 'Wholesale Desk', vertId: 10, exec: 'Anke Ferguson' },
  { code: 'AWS',     name: 'AWS (Cloud Connect)',      segment: 'Wholesale-Infra',   vertical: 'Tech',          region: 'Nassau',   mrr: 280000, arr: 3360000, sites: 0,   circuits: 24,   contractEnd: '2029-05', wault: 43, status: 'Healthy', nps: 64, health: 94, ownerAE: 'Cloud Desk',     vertId: 10, exec: 'Anke Ferguson' },
  { code: 'AZURE',   name: 'Microsoft Azure (ER)',     segment: 'Wholesale-Infra',   vertical: 'Tech',          region: 'Nassau',   mrr: 220000, arr: 2640000, sites: 0,   circuits: 18,   contractEnd: '2028-09', wault: 35, status: 'Healthy', nps: 58, health: 90, ownerAE: 'Cloud Desk',     vertId: 10, exec: 'Anke Ferguson' },
  { code: 'GOOG',    name: 'Google Interconnect',      segment: 'Wholesale-Infra',   vertical: 'Tech',          region: 'Nassau',   mrr: 142000, arr: 1704000, sites: 0,   circuits: 12,   contractEnd: '2028-02', wault: 28, status: 'Healthy', nps: 55, health: 88, ownerAE: 'Cloud Desk',     vertId: 10, exec: 'Anke Ferguson' },
  { code: 'META',    name: 'Meta (Eemshaven DC)',          segment: 'Wholesale-Infra',   vertical: 'Tech',          region: 'Nassau',   mrr: 320000, arr: 3840000, sites: 0,   circuits: 16,   contractEnd: '2029-06', wault: 44, status: 'Healthy', nps: 62, health: 92, ownerAE: 'Cloud Desk',     vertId: 10, exec: 'Anke Ferguson' },
  { code: 'EQX',     name: 'Equinix AMS',              segment: 'Wholesale-Infra',   vertical: 'Tech',          region: 'Nassau',   mrr: 88000,  arr: 1056000, sites: 0,   circuits: 60,   contractEnd: '2027-10', wault: 24, status: 'Healthy', nps: 48, health: 84, ownerAE: 'Cloud Desk',     vertId: 10, exec: 'Anke Ferguson' },
]

// ARR waterfall (last FY → next FY, BSD K)
export const arrWaterfall = [
  { stage: 'Opening ARR',  v: 71200, kind: 'open' as const },
  { stage: 'New logos',    v:  9800, kind: 'pos'  as const },
  { stage: 'Expansion',    v:  6400, kind: 'pos'  as const },
  { stage: 'Price uplift', v:  2200, kind: 'pos'  as const },
  { stage: 'Contraction',  v: -1800, kind: 'neg'  as const },
  { stage: 'Churn',        v: -3600, kind: 'neg'  as const },
  { stage: 'FX',           v:  -200, kind: 'neg'  as const },
  { stage: 'Closing ARR',  v: 84000, kind: 'close' as const },
]

// Bookings vs revenue, last 6 quarters (BSD K)
export const bookingsRev = [
  { q: '24Q1', bookings: 14200, revenue: 17800 },
  { q: '24Q2', bookings: 16400, revenue: 18400 },
  { q: '24Q3', bookings: 15800, revenue: 18900 },
  { q: '24Q4', bookings: 19200, revenue: 19600 },
  { q: '25Q1', bookings: 17800, revenue: 19400 },
  { q: '25Q2', bookings: 21200, revenue: 20800 },
]

// Pipeline (BSD M) by stage with weighted value
export const pipelineDetail = [
  { stage: 'Discovery',   open: 18.4, weighted:  2.8, count: 84, slip: 0.18 },
  { stage: 'Qualified',   open: 24.6, weighted:  6.2, count: 56, slip: 0.12 },
  { stage: 'Proposal',    open: 22.2, weighted: 11.1, count: 31, slip: 0.09 },
  { stage: 'Negotiation', open: 14.8, weighted: 10.4, count: 18, slip: 0.06 },
  { stage: 'Closing',     open:  6.4, weighted:  5.4, count:  9, slip: 0.04 },
]

// Forecast (BSD M)
export const forecast = { commit: 9.2, bestCase: 14.8, pipe: 21.4, target: 12.4, last: 11.8 }

// Win/loss vs competitors (last 24 months)
export const winLoss = [
  { vs: 'BTC',      won: 86, lost: 64, neutral: 12 },
  { vs: 'Cable Bahamas Biz', won: 72, lost: 58, neutral: 8 },
  { vs: 'BT The Bahamas', won: 38, lost: 42, neutral: 4 },
  { vs: 'Rival ISP B Biz',  won: 28, lost: 18, neutral: 6 },
  { vs: 'Adamo',  won: 24, lost: 12, neutral: 4 },
  { vs: 'Rival ISP C Biz', won: 18, lost: 22, neutral: 3 },
  { vs: 'Colt',     won:  6, lost: 14, neutral: 2 },
]

// Renewal cliff next 24 months (ARR BSD K up for renewal)
export const renewalCliff = Array.from({ length: 24 }, (_, i) => {
  const monthsAhead = i + 1
  const base = [4200, 1200, 6800, 2400, 3200, 14200, 1800, 4600, 2200, 5400, 8800, 2200, 1600, 3400, 7200, 1200, 4800, 2200, 5600, 3800, 1400, 6200, 2400, 3600][i]
  return { month: monthsAhead, arr: base, count: Math.max(2, Math.round(base / 360)) }
})

// SLA & service ops (last 12 months)
export const slaSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i],
  uptimeEnt: 99.94 + (Math.sin(i / 1.7) * 0.03),
  uptimeWhsl: 99.97 + (Math.sin(i / 2.1) * 0.02),
  mttrMin: 42 + Math.round(Math.sin(i / 1.3) * 8),
  p1: [3, 5, 2, 6, 4, 7, 3, 4, 5, 2, 3, 4][i],
  creditsK: [12, 22, 8, 38, 18, 44, 14, 22, 28, 9, 12, 18][i],
}))

// Install backlog (orders by status)
export const installBacklog = [
  { status: 'Survey',     count: 142, agedDays: 8 },
  { status: 'Quoted',     count:  86, agedDays: 14 },
  { status: 'Civils',     count:  62, agedDays: 36 },
  { status: 'Wayleave',   count:  44, agedDays: 58 },
  { status: 'Splice',     count:  38, agedDays: 18 },
  { status: 'Test',       count:  24, agedDays: 6 },
  { status: 'Live',       count: 412, agedDays: 0 },
]

// Wholesale interconnect (BSD K MoM net settlement; +ve = Cable Bahamas earns)
export const interconnect = [
  { peer: 'BTC',     net:  +84, minutes: 124, mtr: 0.0049 },
  { peer: 'Rival ISP C',        net:  +62, minutes:  88, mtr: 0.0049 },
  { peer: 'Tele2 The Bahamas', net:  -28, minutes:  54, mtr: 0.0049 },
  { peer: 'Rival ISP B',           net:  +18, minutes:  22, mtr: 0.0049 },
  { peer: 'Colt',        net:  +44, minutes:  72, mtr: 0.0049 },
  { peer: 'BT UK',        net:  +12, minutes:  28, mtr: 0.0044 },
  { peer: 'Tata Comms',   net:  -18, minutes:  48, mtr: 0.0038 },
  { peer: 'Deutsche TKM', net:   +6, minutes:  14, mtr: 0.0042 },
]

// IP transit & peering (Gbps over 12 months)
export const transitSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'][i],
  transitGbps: 1840 + i * 24 + Math.round(Math.sin(i) * 40),
  peeringGbps: 3200 + i * 60 + Math.round(Math.cos(i / 2) * 80),
  cost: 1.18 - i * 0.04, // BSD /Mbps
}))

// IX presence
export const ixPresence = [
  { ix: 'Local peering (Nassau)',  ports: 8, capacityG: 800, peers: 142, util: 0.62 },
  { ix: 'LINX (London)',  ports: 4, capacityG: 400, peers:  86, util: 0.58 },
  { ix: 'AMS-IX',         ports: 2, capacityG: 200, peers:  64, util: 0.48 },
  { ix: 'DE-CIX (Frankfurt)', ports: 2, capacityG: 200, peers: 58, util: 0.42 },
]

// Dark fibre / duct & pole inventory
export const fibreInventory = [
  { region: 'Nassau Metro', routeKm: 1240, lit: 880,  dark: 360, util: 0.71 },
  { region: 'Freeport Metro',   routeKm:  420, lit: 280,  dark: 140, util: 0.67 },
  { region: 'Abaco Metro', routeKm:  220, lit: 140,  dark:  80, util: 0.64 },
  { region: 'Eleuthera',     routeKm:  180, lit: 120,  dark:  60, util: 0.67 },
  { region: 'Long Island',      routeKm:  160, lit:  90,  dark:  70, util: 0.56 },
  { region: 'Long-haul',    routeKm: 2840, lit: 1840, dark: 1000,util: 0.65 },
]

// Terrestrial / transit capacity
export const subseaCapacity = [
  { cable: 'BE↔UK (BT)',              capacityTbps: 20, soldTbps: 14.2, route: 'BE → UK',  liveDate: '2022-08' },
  { cable: 'BE↔NL (Eurofiber)',       capacityTbps: 40, soldTbps: 28.6, route: 'BE → NL',  liveDate: '2021-11' },
  { cable: 'BE↔DE (DE-CIX Frankfurt)',capacityTbps: 30, soldTbps: 18.4, route: 'BE → DE',  liveDate: '2021-04' },
  { cable: 'BE↔FR (Paris)',           capacityTbps: 24, soldTbps: 12.8, route: 'BE → FR',  liveDate: '2022-02' },
  { cable: 'BE↔UK backup',            capacityTbps: 10, soldTbps:  4.2, route: 'BE → UK',  liveDate: '2023-10' },
]

// DC / colo
export const dcInventory = [
  { dc: 'Nassau DC1',  kwSold: 4200, kwBuilt: 5400, pue: 1.32 },
  { dc: 'Nassau DC2',  kwSold: 3600, kwBuilt: 4800, pue: 1.28 },
  { dc: 'Freeport (Cockburn Town)',kwSold: 1800, kwBuilt: 2400, pue: 1.36 },
  { dc: 'Bimini',     kwSold: 880, kwBuilt: 1200, pue: 1.42 },
]

// Service-line revenue & growth (last FY, BSD K)
export const serviceLines = [
  { svc: 'DIA',                 rev: 18400, growth: 0.18, gm: 0.62, attach: 0.92 },
  { svc: 'MPLS / SD-WAN',       rev: 12800, growth: 0.11, gm: 0.58, attach: 0.41 },
  { svc: 'Hosted Voice / SIP',  rev:  8600, growth: 0.06, gm: 0.54, attach: 0.36 },
  { svc: 'Cloud Connect',       rev:  6200, growth: 0.34, gm: 0.66, attach: 0.22 },
  { svc: 'Mobile B2B / IoT',    rev:  4400, growth: 0.22, gm: 0.42, attach: 0.18 },
  { svc: 'Cyber & Managed',     rev:  3800, growth: 0.41, gm: 0.48, attach: 0.14 },
  { svc: 'UCaaS / MS Teams',    rev:  3200, growth: 0.28, gm: 0.51, attach: 0.12 },
  { svc: 'Wholesale dark fibre',rev:  6800, growth: 0.08, gm: 0.74, attach: 0.0  },
  { svc: 'Colocation / DC',     rev:  9600, growth: 0.16, gm: 0.68, attach: 0.0  },
  { svc: 'IP transit / peering',rev:  3200, growth: 0.04, gm: 0.71, attach: 0.0  },
]

// SMB cohort retention (% surviving)
export const smbCohorts = [
  { cohort: '2023 Q1', m0: 100, m6: 92, m12: 84, m18: 78, m24: 74 },
  { cohort: '2023 Q3', m0: 100, m6: 91, m12: 82, m18: 76, m24: 72 },
  { cohort: '2024 Q1', m0: 100, m6: 93, m12: 86, m18: 80, m24: 0 },
  { cohort: '2024 Q3', m0: 100, m6: 94, m12: 88, m18: 0,  m24: 0 },
  { cohort: '2025 Q1', m0: 100, m6: 95, m12: 0,  m18: 0,  m24: 0 },
]

// SMB ARPU & churn by sector
export const smbBySector = [
  { sector: 'Retail / Hospitality', count: 4200, arpu: 312, churn: 0.018 },
  { sector: 'Professional services', count: 3800, arpu: 268, churn: 0.014 },
  { sector: 'Trades / Construction', count: 2400, arpu: 224, churn: 0.022 },
  { sector: 'Healthcare / Care',    count: 1600, arpu: 348, churn: 0.011 },
  { sector: 'Education / NGO',      count:  800, arpu: 286, churn: 0.009 },
  { sector: 'Other',                count: 1400, arpu: 204, churn: 0.024 },
]

// Sales reps / quota attainment
export const salesReps = [
  { rep: 'Camille N.',     segment: 'Enterprise', quota: 2400, attain: 0.92, pipe: 5.8, deals: 12 },
  { rep: 'Thomas D.',      segment: 'Enterprise', quota: 2400, attain: 0.78, pipe: 6.4, deals: 18 },
  { rep: 'Ann K.',     segment: 'Enterprise', quota: 2200, attain: 1.08, pipe: 4.2, deals: 9  },
  { rep: 'Luis O.',      segment: 'Enterprise', quota: 2400, attain: 1.12, pipe: 7.8, deals: 14 },
  { rep: 'Sofie M.',    segment: 'Mid-Market', quota: 1400, attain: 0.84, pipe: 3.2, deals: 22 },
  { rep: 'David B.',     segment: 'Mid-Market', quota: 1400, attain: 0.96, pipe: 2.8, deals: 24 },
  { rep: 'SMB Inside',   segment: 'SMB',        quota: 3200, attain: 1.04, pipe: 4.4, deals: 384 },
  { rep: 'Wholesale Desk', segment: 'Wholesale-Carrier', quota: 4400, attain: 0.88, pipe: 8.6, deals: 6 },
  { rep: 'Cloud Desk',   segment: 'Wholesale-Infra', quota: 5200, attain: 1.16, pipe: 12.4, deals: 4 },
]

// Health-score buckets
export const healthBuckets = [
  { band: '90-100', count: 64, label: 'Champion' },
  { band: '70-89',  count: 142, label: 'Healthy' },
  { band: '50-69',  count: 86, label: 'Watch' },
  { band: '30-49',  count: 28, label: 'At Risk' },
  { band: '0-29',   count: 8,  label: 'Critical' },
]

// Unit economics by segment
export const unitEcon = [
  { segment: 'Enterprise',        cac: 18400, ltv: 184000, payback: 14, gm: 0.61 },
  { segment: 'Mid-Market',        cac:  6200, ltv:  42000, payback: 11, gm: 0.56 },
  { segment: 'SMB',               cac:   480, ltv:  4400,  payback:  9, gm: 0.48 },
  { segment: 'Wholesale-Carrier', cac: 22000, ltv: 380000, payback: 18, gm: 0.42 },
  { segment: 'Wholesale-Infra',   cac: 38000, ltv: 920000, payback: 22, gm: 0.71 },
]

// AR aging
export const arAging = [
  { bucket: 'Current',     amt: 14200 },
  { bucket: '1-30',        amt:  3800 },
  { bucket: '31-60',       amt:  1400 },
  { bucket: '61-90',       amt:   620 },
  { bucket: '90+',         amt:   840 },
]

// Tender / framework calendar
export const tenders = [
  { name: 'OGP Lot 4 (Connectivity)',   close: '2027-02-18', value: 28, status: 'Bidding',  win: 0.42 },
  { name: 'SNS eHealth WAN',            close: '2026-12-22', value: 22, status: 'Bidding',  win: 0.55 },
  { name: 'GovNet Refresh',             close: '2027-04-04', value: 38, status: 'Tracking', win: 0.28 },
  { name: 'Dept of Education schools',  close: '2027-03-30', value: 18, status: 'Bidding',  win: 0.62 },
  { name: 'FOD FinanciÃ«n secure WAN',        close: '2027-06-15', value:  8, status: 'Tracking', win: 0.40 },
  { name: 'Bahamian Federal Police',          close: '2027-05-12', value: 14, status: 'Bidding',  win: 0.34 },
]

// Competitive price index (100 = market avg)
export const priceIndex = [
  { svc: 'DIA 1G',          cablebahamas:  98, btc: 102, orange: 104, bt: 108, adamo:  94 },
  { svc: 'DIA 10G',         cablebahamas:  94, btc: 100, orange: 102, bt: 110, adamo:  90 },
  { svc: 'SD-WAN site',     cablebahamas: 102, btc:  98, orange:  96, bt: 104, adamo: 100 },
  { svc: 'SIP trunk (10ch)', cablebahamas: 96, btc: 100, orange: 102, bt: 108, adamo:  95 },
  { svc: 'Cloud Connect 1G',cablebahamas:  92, btc: 104, orange: 102, bt: 100, adamo:  98 },
  { svc: 'Colo 1kW',        cablebahamas:  98, btc: 102, orange: 100, bt: 102, adamo:  96 },
]

// Regulatory / SMP markets
export const regulatory = [
  { item: 'SMP Market 1 (WLR equiv.)',     status: 'Compliant',    risk: 'Low',    next: '2027-02 review' },
  { item: 'SMP Market 3a (FTTC wholesale)', status: 'Compliant',    risk: 'Low',    next: '2027-05 EoI test' },
  { item: 'SMP Market 3b (FTTH wholesale)', status: 'Compliant',    risk: 'Medium', next: '2027-01 margin-squeeze' },
  { item: 'SMP Market 4 (Leased lines)',    status: 'Investigation', risk: 'High',   next: 'URCA case 26-04' },
  { item: 'USO net cost claim',             status: 'Filed',        risk: 'Medium', next: '2027-03 decision' },
  { item: 'URCA cyber self-assessment',           status: 'Compliant',    risk: 'Low',    next: '2027-06 review' },
  { item: 'CBOB IT risk guidelines (bank customers)',     status: 'On track',     risk: 'Medium', next: '2027-05 deadline' },
]

// =============================================================================
// Account 360 deterministic synth
// =============================================================================
export type AccountDetails = {
  account: Account
  arrTrend: { month: string; arr: number }[]
  serviceMix: { svc: string; mrr: number }[]
  sites: { region: string; count: number; circuits: number }[]
  contracts: { id: string; svc: string; start: string; end: string; mrr: number; auto: boolean }[]
  pipeline: { opp: string; stage: string; value: number; close: string }[]
  tickets: { month: string; p1: number; p2: number; p3: number }[]
  slaHistory: { month: string; uptime: number; credits: number }[]
  npsTrend: { q: string; nps: number }[]
  qbrs: { date: string; status: string; sponsor: string }[]
  contacts: { role: string; name: string; sentiment: 'Champion' | 'Supporter' | 'Neutral' | 'Detractor' }[]
  ar: { bucket: string; amt: number }[]
  flags: { kind: 'churn' | 'price' | 'sla' | 'reg' | 'esg' | 'comp'; severity: 'info' | 'warn' | 'crit'; text: string }[]
  expansionPlay: { play: string; rationale: string; tcv: number; prob: number }[]
}

function hashCode(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }; return h >>> 0 }
function mulberry32(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export function buildAccountDetails(code: string): AccountDetails {
  const acc = accounts.find((a) => a.code === code) ?? accounts[0]
  const r = mulberry32(hashCode(acc.code))
  const months = ['Jul24','Aug','Sep','Oct','Nov','Dec','Jan25','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan26','Feb','Mar','Apr','May','Jun']
  const baseArr = acc.arr / 12
  const arrTrend = months.map((m, i) => ({ month: m, arr: Math.round(baseArr * (0.78 + i * 0.012 + (r() - 0.5) * 0.06)) }))

  const svcPool = ['DIA', 'MPLS', 'SD-WAN', 'SIP', 'Cloud Connect', 'Mobile B2B', 'Cyber', 'UCaaS', 'Colo']
  const nSvc = 3 + Math.floor(r() * 5)
  const chosen = svcPool.slice().sort(() => r() - 0.5).slice(0, nSvc)
  const serviceMix = chosen.map((svc) => ({ svc, mrr: Math.round((acc.mrr / nSvc) * (0.6 + r() * 0.8)) }))

  const regs = ['Nassau', 'Freeport', 'Abaco', 'Eleuthera', 'Long Island', 'National']
  const nReg = Math.min(acc.sites > 50 ? 5 : 3, regs.length)
  const sites = regs.slice(0, nReg).map((region) => {
    const c = Math.max(1, Math.round((acc.sites / nReg) * (0.4 + r() * 1.2)))
    return { region, count: c, circuits: Math.round(c * (1 + r() * 0.8)) }
  })

  const contracts = serviceMix.slice(0, 4).map((s, i) => ({
    id: `C-${acc.code}-${1000 + i}`,
    svc: s.svc,
    start: `202${3 + Math.floor(r() * 2)}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}`,
    end: acc.contractEnd,
    mrr: s.mrr,
    auto: r() > 0.5,
  }))

  const pipeStages = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closing']
  const nPipe = 1 + Math.floor(r() * 3)
  const pipeline = Array.from({ length: nPipe }, (_, i) => ({
    opp: ['Bandwidth upgrade', 'SD-WAN refresh', 'Cyber bolt-on', 'Mobile fleet', 'Cloud Connect 10G', 'New site rollout'][Math.floor(r() * 6)],
    stage: pipeStages[Math.floor(r() * pipeStages.length)],
    value: Math.round(acc.mrr * (0.2 + r() * 1.4) * (1 + i * 0.3)),
    close: `2026-${String(7 + Math.floor(r() * 6)).padStart(2, '0')}`,
  }))

  const tkMonths = ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov']
  const ticketScale = Math.max(1, Math.round(acc.circuits / 40))
  const tickets = tkMonths.map(() => ({
    month: '',
    p1: Math.round(r() * ticketScale * 0.4),
    p2: Math.round(r() * ticketScale * 1.2),
    p3: Math.round(r() * ticketScale * 3),
  })).map((t, i) => ({ ...t, month: tkMonths[i] }))

  const slaHistory = tkMonths.map(() => ({
    month: '',
    uptime: 99.90 + r() * 0.099,
    credits: Math.round(r() * acc.mrr * 0.01),
  })).map((s, i) => ({ ...s, month: tkMonths[i] }))

  const npsTrend = ['24Q1', '24Q2', '24Q3', '24Q4', '25Q1', '25Q2'].map((q, i) => ({
    q,
    nps: Math.round(acc.nps + (r() - 0.5) * 24 + (i - 3) * 2),
  }))

  const qbrs = Array.from({ length: 4 }, (_, i) => ({
    date: `202${5 + Math.floor(i / 4)}-${String(3 * (i + 1)).padStart(2, '0')}`,
    status: r() > 0.2 ? 'Held' : 'Missed',
    sponsor: ['CIO', 'CTO', 'COO', 'CFO', 'IT Director'][Math.floor(r() * 5)],
  }))

  const contacts = [
    { role: 'CIO',           name: 'Senior Exec A', sentiment: r() > 0.4 ? 'Champion' : 'Supporter' },
    { role: 'IT Director',   name: 'Senior Exec B', sentiment: r() > 0.5 ? 'Supporter' : 'Neutral' },
    { role: 'Network Lead',  name: 'Senior Exec C', sentiment: r() > 0.7 ? 'Champion' : 'Supporter' },
    { role: 'Procurement',   name: 'Senior Exec D', sentiment: r() > 0.6 ? 'Neutral' : 'Detractor' },
    { role: 'Security Lead', name: 'Senior Exec E', sentiment: r() > 0.5 ? 'Supporter' : 'Neutral' },
  ] as AccountDetails['contacts']

  const ar = [
    { bucket: 'Current', amt: Math.round(acc.mrr * 1.2 * (0.8 + r() * 0.4) / 1000) },
    { bucket: '1-30',    amt: Math.round(acc.mrr * 0.4 * r() / 1000) },
    { bucket: '31-60',   amt: Math.round(acc.mrr * 0.15 * r() / 1000) },
    { bucket: '61-90',   amt: Math.round(acc.mrr * 0.06 * r() / 1000) },
    { bucket: '90+',     amt: Math.round(acc.mrr * 0.04 * r() / 1000) },
  ]

  // Risk flags
  const flags: AccountDetails['flags'] = []
  if (acc.wault < 6 && acc.wault >= 0) flags.push({ kind: 'churn', severity: 'crit', text: `Renewal in ${acc.wault} months · WAULT below trigger` })
  if (acc.health < 50) flags.push({ kind: 'churn', severity: 'crit', text: `Health score ${acc.health} – exec save plan required` })
  else if (acc.health < 70) flags.push({ kind: 'churn', severity: 'warn', text: `Health ${acc.health} drifting – schedule QBR` })
  if (acc.nps < 0) flags.push({ kind: 'churn', severity: 'warn', text: `NPS ${acc.nps} – detractor risk, sentiment negative` })
  const slaAvg = slaHistory.reduce((a, b) => a + b.uptime, 0) / slaHistory.length
  if (slaAvg < 99.95) flags.push({ kind: 'sla', severity: 'warn', text: `SLA avg ${slaAvg.toFixed(3)}% below 99.95 threshold` })
  if (ar[3].amt + ar[4].amt > acc.mrr * 0.1) flags.push({ kind: 'churn', severity: 'warn', text: `AR aged 60+ exceeds 10% of MRR` })
  if (acc.vertical === 'Banking') flags.push({ kind: 'reg', severity: 'info', text: `CBOB IT risk reporting required – financial customer` })
  if (acc.vertical === 'Public') flags.push({ kind: 'reg', severity: 'info', text: `OGP framework dependency – tender renewal exposure` })
  if (acc.segment === 'Enterprise' && r() > 0.5) flags.push({ kind: 'esg', severity: 'info', text: `Scope-3 reporting requested – preparing emissions disclosure` })
  if (r() > 0.6) flags.push({ kind: 'comp', severity: 'info', text: `Competitor (BTC Biz / Cable Bahamas Biz) approached IT Director` })
  if (acc.segment.startsWith('Wholesale')) flags.push({ kind: 'price', severity: 'info', text: `Margin-squeeze test scheduled · URCA M3b` })

  const playPool = [
    { play: 'DIA upgrade 1G → 10G',     rationale: 'Utilisation >78% peak',    tcv: Math.round(acc.mrr * 6  * (1 + r())), prob: 0.4 + r() * 0.4 },
    { play: 'SD-WAN refresh',           rationale: 'MPLS contract maturing',  tcv: Math.round(acc.mrr * 8  * (1 + r())), prob: 0.3 + r() * 0.4 },
    { play: 'Cyber/SASE bolt-on',       rationale: 'URCA cyber readiness gap',      tcv: Math.round(acc.mrr * 4  * (1 + r())), prob: 0.4 + r() * 0.3 },
    { play: 'Cloud Connect (Azure ER)', rationale: 'O365 latency complaints', tcv: Math.round(acc.mrr * 3  * (1 + r())), prob: 0.5 + r() * 0.3 },
    { play: 'Mobile fleet consolidation',rationale: 'Multi-vendor inefficient',tcv: Math.round(acc.mrr * 5  * (1 + r())), prob: 0.3 + r() * 0.4 },
    { play: 'Managed UCaaS (Teams DR)', rationale: 'Legacy PBX EoL 2027',     tcv: Math.round(acc.mrr * 3  * (1 + r())), prob: 0.4 + r() * 0.4 },
  ]
  const expansionPlay = playPool.slice(0, 4).sort((a, b) => b.prob - a.prob)

  return { account: acc, arrTrend, serviceMix, sites, contracts, pipeline, tickets, slaHistory, npsTrend, qbrs, contacts, ar, flags, expansionPlay }
}
