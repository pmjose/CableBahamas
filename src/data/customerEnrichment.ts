import type { Customer } from './customers'
import { customers } from './customers'

// Deterministic helpers seeded from the customer ID
function seedNum(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
function pick<T>(arr: T[], n: number): T { return arr[n % arr.length] }

// 1. Identity & Household
export type HouseholdMember = { name: string; relation: string; primary?: boolean; line?: string }
export type SystemId = { source: string; id: string; status: 'matched' | 'unmatched' }
export type Consent = { channel: string; granted: boolean; date: string; source: string }

// 2. Network & Service Health
export type ModemStatus = { online: boolean; uptimeHours: number; lastReboot: string; model: string; mac: string; firmware: string; downstreamPower: string; upstreamPower: string; snr: string; packetLoss: string; lastSpeedTest: { down: number; up: number; ts: string } }
export type MobileDevice = {
  msisdn: string
  imei: string
  model: string
  os: string
  lineName: string
  network: '5G SA' | '5G NSA' | '4G LTE' | '3G'
  signalDbm: number // RSRP
  bars: 1 | 2 | 3 | 4 | 5
  lastActivity: string
  cell: string
  voltePresent: boolean
  vowifiPresent: boolean
  dataUsedGB: number
  dataCapGB: number | 'Unlimited'
  voiceMinutes: number
  smsCount: number
  esim: boolean
  roaming: boolean
}
export type TvDevice = {
  online: boolean
  model: string // V6, Stream, Stream 4K
  serial: string
  ip: string
  uptimeHours: number
  lastActivity: string
  channelsWatched7d: number
  topChannel: string
  recordings: number
  storageUsedPct: number
  appVersion: string
}
export type OutageExposure = { affected: boolean; incidentId?: string; severity?: string; eta?: string; reason?: string; domain?: 'Fixed' | 'Mobile' | 'TV' }
export type TruckRoll = { date: string; reason: string; engineer: string; outcome: string; rating: number }

// 3. Commercial / Contract
export type ContractInfo = { status: 'In contract' | 'Out of contract' | 'Rolling'; endDate: string; daysRemaining: number; etf: number; planName: string; minTerm: number }
export type Discount = { name: string; pct: number; expires: string; mrrImpact: number }
export type OrderItem = { id: string; type: string; status: string; scheduled: string }

// 4. Engagement & Digital
export type AppUsage = { lastLogin: string; sessions30d: number; mau: boolean; topFeatures: string[]; appRating?: number }
export type NpsScore = { date: string; score: number; verbatim: string }
export type TobiTranscript = { date: string; intent: string; resolution: 'Resolved' | 'Handed off'; messages: number }

// 5. Predictive AI
export type ChurnReason = { code: string; weight: number }
export type NextBestAction = { id: string; title: string; channel: string; uplift: string; eligibility: 'Eligible' | 'Cooldown' | 'Suppressed'; cooldownDays: number; expectedValue: number; confidence: number; reasonCode: string }

// 6. Care & Operational
export type Case = { id: string; title: string; priority: 'P1' | 'P2' | 'P3' | 'P4'; status: 'Open' | 'In Progress' | 'Awaiting Customer' | 'Resolved'; opened: string; sla: string; slaBreach: boolean; owner: string; lastUpdate: string }
export type AgentNote = { date: string; agent: string; note: string; aiSummary: string }
export type SentimentDriver = { driver: string; impact: number; trend: 'up' | 'down' | 'flat' }

// 7. Value & Loyalty
export type Referral = { date: string; referredTo: string; status: 'Pending' | 'Activated' | 'Expired'; reward: number }
export type Milestone = { name: string; date: string; eligibleFor: string }

// 8. Risk & Compliance
export type PiiAccess = { date: string; user: string; role: string; reason: string }

// Relationship graph
export type RelNodeKind = 'self' | 'household' | 'business' | 'partner' | 'authorised' | 'address' | 'referral' | 'employer' | 'landlord'
export type RelNode = {
  id: string
  label: string
  kind: RelNodeKind
  subtitle?: string
  vmCustomerId?: string
  details: { k: string; v: string }[]
  isCustomer: boolean
}
export type RelEdge = { from: string; to: string; label: string; strength: 1 | 2 | 3 }
export type RelationshipGraph = { nodes: RelNode[]; edges: RelEdge[] }
// 10. Comparative
export type CohortStat = { metric: string; thisCustomer: number; cohortMedian: number; percentile: number }

export type EnrichedCustomer = {
  // 1
  household: HouseholdMember[]
  systemIds: SystemId[]
  consents: Consent[]
  vulnerable: { flag: boolean; reason?: string }
  accessibility: string[]
  // 2 — multi-device
  hasBroadband: boolean
  hasMobile: boolean
  hasTv: boolean
  modem: ModemStatus | null
  mobileDevices: MobileDevice[]
  tvDevice: TvDevice | null
  outage: OutageExposure
  premiseTech: { tech: string; modemModel: string; pods: number; meshHealth: number } | null
  truckRolls: TruckRoll[]
  doNotDispatch: boolean
  // 3
  contract: ContractInfo
  priceRise: { sent: boolean; date: string; pctIncrease: number; ack: boolean }
  discounts: Discount[]
  orders: OrderItem[]
  paymentMethod: { type: 'Direct Debit' | 'Card' | 'Transfer'; last4: string; failedCount: number; dunningStage: 0 | 1 | 2 | 3 }
  // 4
  app: AppUsage
  nps: NpsScore[]
  tobi: TobiTranscript[]
  journey: { date: string; channel: string; intent: string; outcome: string }[]
  // 5
  churn: { score: number; band: 'Low' | 'Medium' | 'High'; reasons: ChurnReason[]; modelVersion: string; confidence: number }
  clv: { current: number; forecast36m: number; trend: 'up' | 'down' | 'flat' }
  nba: NextBestAction[]
  bundlePropensity: { bundle: string; probability: number; willPayUpTo: number }[]
  priceSensitivity: 'Premium' | 'Standard' | 'Value' | 'Discount-led'
  complaintRisk: number
  fraudScore: number
  creditScore: number
  // 6
  cases: Case[]
  promises: { type: string; due: string; breachRisk: 'Low' | 'Medium' | 'High' }[]
  agentNotes: AgentNote[]
  sentimentDrivers: SentimentDriver[]
  fieldRating: number
  // 7
  cohortRank: { tier: string; engagementPercentile: number; valuePercentile: number }
  referrals: Referral[]
  milestones: Milestone[]
  moveHistory: { date: string; from: string; to: string; type: string }[]
  // 8
  comregFlag: boolean
  badDebt: { writeOff: number; status: string }
  piiAccess: PiiAccess[]
  // 10
  cohort: CohortStat[]
  playbook: { intent: string; script: string; nextStep: string }
  // Relationship graph
  graph: RelationshipGraph
}

const FIRST_NAMES_FEMALE = ['Emma', 'Marie', 'Sofie', 'Anke', 'Elke', 'Femke', 'Lore', 'Britt']
const FIRST_NAMES_MALE = ['Lucas', 'Thomas', 'Lars', 'Daan', 'Wout', 'Jonas', 'Senne', 'Milan']
const RELATIONS = ['Partner', 'Child', 'Parent', 'Flatmate', 'Sibling']

function future(today: Date, days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function past(today: Date, days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function enrichCustomer(c: Customer): EnrichedCustomer {
  const seed = seedNum(c.id)
  const today = new Date('2026-05-22')

  // ---- 1. Identity & Household ----
  const householdSize = 1 + (seed % 4) // 1-4
  const household: HouseholdMember[] = [{ name: c.name, relation: 'Account holder', primary: true, line: c.phone }]
  const lastName = c.name.split(' ').slice(-1)[0]
  for (let i = 1; i < householdSize; i++) {
    const isFemale = (seed >> (i + 2)) % 2 === 0
    const fn = isFemale ? FIRST_NAMES_FEMALE[(seed >> i) % FIRST_NAMES_FEMALE.length] : FIRST_NAMES_MALE[(seed >> i) % FIRST_NAMES_MALE.length]
    household.push({
      name: `${fn} ${lastName}`,
      relation: RELATIONS[(seed >> i) % RELATIONS.length],
      line: i === 1 ? `+1 242 4${(seed >> i) % 10}${(seed % 9)} ${(100 + (seed % 800)).toString().padStart(3, '0')} ${(100 + (seed >> 5) % 899).toString()}` : undefined,
    })
  }

  const systemIds: SystemId[] = [
    { source: 'Kenan/Arbor (Billing)', id: `KN-${1000000 + (seed % 9000000)}`, status: 'matched' },
    { source: 'Salesforce CRM', id: `0035g${(seed % 99999).toString().padStart(5, '0')}`, status: 'matched' },
    { source: 'MyREV Account', id: c.email.split('@')[0], status: 'matched' },
    { source: 'aliv Mobile Core', id: `CBL-${(seed % 99999).toString().padStart(5, '0')}`, status: c.services.some(s => s.name.includes('Mobile') || s.name.includes('Mobile')) ? 'matched' : 'unmatched' },
    { source: 'PEGA ADT', id: `PG-${(seed % 999999).toString().padStart(6, '0')}`, status: 'matched' },
  ]

  const consents: Consent[] = [
    { channel: 'Email — Marketing', granted: (seed & 1) === 0, date: past(today, 120 + seed % 200), source: 'MyREV preferences' },
    { channel: 'SMS — Marketing', granted: (seed & 2) === 0, date: past(today, 90 + seed % 200), source: 'Webform' },
    { channel: 'Voice — Marketing', granted: (seed & 4) === 0, date: past(today, 365 + seed % 100), source: 'Inbound call' },
    { channel: 'Post — Marketing', granted: false, date: past(today, 800), source: 'Default' },
    { channel: 'Service notifications', granted: true, date: c.joined, source: 'T&Cs (mandatory)' },
  ]

  const vulnerable = c.tenureYears > 7 && (seed % 5 === 0)
    ? { flag: true, reason: 'Self-declared health-affected (network outages)' }
    : { flag: false }
  const accessibility = vulnerable.flag ? ['Large-print bills', 'Priority outage SMS'] : []

  // ---- 2. Network & Service Health (per-device) ----
  const broadbandSvc = c.services.find(s => /broadband|fibre|fibre|fiber|ftth|fttc|fttx|dsl|adsl|vdsl|cable/i.test(s.name))
  const tvSvc = c.services.find(s => s.name.toLowerCase().includes('tv') || s.name.toLowerCase().includes('streaming'))
  // Expand "aliv Mobile Unlimited 5G ×2" into 2 separate device entries
  const mobileSvcsRaw = c.services.filter(s => s.name.toLowerCase().includes('mobile'))
  const mobileSvcs: typeof c.services = []
  mobileSvcsRaw.forEach(s => {
    const m = s.name.match(/×\s*(\d+)|x\s*(\d+)/i)
    const count = m ? parseInt(m[1] ?? m[2], 10) : 1
    for (let i = 0; i < count; i++) mobileSvcs.push({ ...s, name: s.name.replace(/\s*[×x]\s*\d+/i, '').trim() })
  })
  const hasBroadband = !!broadbandSvc
  const hasMobile = mobileSvcs.length > 0
  const hasTv = !!tvSvc

  // outage may target any product domain the customer has
  const hasOutage = c.churnRisk === 'High' && (seed % 3 === 0)
  const outageDomain: 'Fixed' | 'Mobile' | 'TV' = hasBroadband ? 'Fixed' : hasMobile ? 'Mobile' : 'TV'
  const outage: OutageExposure = hasOutage
    ? {
        affected: true,
        incidentId: `INC-2031`,
        severity: 'P2',
        eta: future(today, 0).replace(/.*T?/, '') + ' 18:30',
        reason: outageDomain === 'Fixed' ? 'OLT firmware rollout — Eleuthera'
              : outageDomain === 'Mobile' ? 'RAN cell-site degradation — Eleuthera Noord'
              : 'EPG sync delay — REVTV (vendor-side)',
        domain: outageDomain,
      }
    : { affected: false }

  // ---- Broadband modem (only if customer has broadband) ----
  let modem: ModemStatus | null = null
  let premiseTech: { tech: string; modemModel: string; pods: number; meshHealth: number } | null = null
  if (hasBroadband) {
    const fixedOutage = hasOutage && outageDomain === 'Fixed'
    const isOnline = !fixedOutage
    const modemModel = pick(['HG658c', 'Wi-Fi 6 Pro', 'Wi-Fi 6E Mesh'], seed)
    modem = {
      online: isOnline,
      uptimeHours: isOnline ? 24 + (seed % 1200) : 0,
      lastReboot: past(today, 1 + (seed % 60)),
      model: modemModel,
      mac: `00:1A:2B:${(seed % 99).toString(16).padStart(2, '0').toUpperCase()}:${((seed >> 4) % 99).toString(16).padStart(2, '0').toUpperCase()}:${((seed >> 8) % 99).toString(16).padStart(2, '0').toUpperCase()}`,
      firmware: pick(['9.1.116T', '9.1.118T', '9.1.120R'], seed),
      downstreamPower: `${-2 + (seed % 8)} dBmV`,
      upstreamPower: `${42 + (seed % 6)} dBmV`,
      snr: `${36 + (seed % 6)} dB`,
      packetLoss: `${(seed % 30) / 100}%`,
      lastSpeedTest: {
        down: /2\s*Gb/i.test(broadbandSvc?.speed ?? '') ? 1850 + (seed % 150)
            : /1\s*Gb/i.test(broadbandSvc?.speed ?? '') ? 920 + (seed % 80)
            : /600/.test(broadbandSvc?.speed ?? '') ? 560 + (seed % 40)
            : /300/.test(broadbandSvc?.speed ?? '') ? 285 + (seed % 15)
            : 480 + (seed % 30),
        up: 50 + (seed % 50),
        ts: past(today, 1 + (seed % 14)),
      },
    }
    const accessTech = /fibre|fibre|fiber|ftth/i.test(broadbandSvc?.name ?? '') ? 'FTTH (PON)'
      : /cable|docsis|hfc/i.test(broadbandSvc?.name ?? '') ? 'DOCSIS 3.1 (HFC)'
      : /fttc|vdsl/i.test(broadbandSvc?.name ?? '') ? 'FTTC'
      : pick(['DOCSIS 3.1 (HFC)', 'FTTH (PON)', 'FTTC'], seed)
    premiseTech = {
      tech: accessTech,
      modemModel,
      pods: c.tier === 'Platinum' ? 3 : c.tier === 'Gold' ? 2 : (seed % 2),
      meshHealth: 70 + (seed % 28),
    }
  }

  // ---- Mobile devices (one per mobile line) ----
  const phoneModels = [
    'Apple iPhone 16 Pro Max',
    'Apple iPhone 16 Pro',
    'Apple iPhone 16',
    'Apple iPhone 15 Pro',
    'Samsung Galaxy S25 Ultra',
    'Samsung Galaxy S25+',
    'Samsung Galaxy S24 FE',
    'Google Pixel 9 Pro',
    'Google Pixel 9',
  ]
  const osMap: Record<string, string> = {
    'Apple iPhone 16 Pro Max': 'iOS 18.4',
    'Apple iPhone 16 Pro': 'iOS 18.4',
    'Apple iPhone 16': 'iOS 18.3',
    'Apple iPhone 15 Pro': 'iOS 18.2',
    'Samsung Galaxy S25 Ultra': 'Android 15 (One UI 7)',
    'Samsung Galaxy S25+': 'Android 15 (One UI 7)',
    'Samsung Galaxy S24 FE': 'Android 15 (One UI 7)',
    'Google Pixel 9 Pro': 'Android 15',
    'Google Pixel 9': 'Android 15',
  }
  const mobileDevices: MobileDevice[] = mobileSvcs.map((svc, idx) => {
    const localSeed = seed + idx * 7919
    const isMobileOutage = hasOutage && outageDomain === 'Mobile' && idx === 0
    const model = phoneModels[(localSeed >> 2) % phoneModels.length]
    const cap = svc.name.includes('Unlimited') ? 'Unlimited' as const
              : svc.name.includes('100') ? 100
              : svc.name.includes('50') ? 50
              : svc.name.includes('20') ? 20
              : 10
    const used = cap === 'Unlimited' ? 80 + (localSeed % 60) : Math.min(cap as number, Math.round(((localSeed % 90) / 100) * (cap as number)))
    const network: '5G SA' | '5G NSA' | '4G LTE' = svc.name.includes('5G') ? (localSeed % 3 === 0 ? '5G SA' : '5G NSA') : '4G LTE'
    const signalDbm = isMobileOutage ? -115 - (localSeed % 8) : -75 - (localSeed % 30)
    const bars: 1 | 2 | 3 | 4 | 5 = signalDbm > -85 ? 5 : signalDbm > -95 ? 4 : signalDbm > -105 ? 3 : signalDbm > -115 ? 2 : 1
    const lastDigits = (localSeed % 9000 + 1000).toString()
    const msisdn = `+1 242 8${(localSeed % 4) + 3} ${(localSeed % 900 + 100).toString().padStart(3, '0')} ${lastDigits}`
    return {
      msisdn,
      imei: (350000000000000 + (localSeed % 999999999)).toString(),
      model,
      os: osMap[model] ?? 'Android 15',
      lineName: idx === 0 ? 'Primary line' : idx === 1 ? 'Family line' : `Line ${idx + 1}`,
      network,
      signalDbm,
      bars,
      lastActivity: isMobileOutage ? past(today, 0) + ' 14:22 (lost connection)' : past(today, 0) + ' ' + (10 + (localSeed % 14)) + ':' + ((localSeed % 60).toString().padStart(2, '0')),
      cell: 'CELL-' + (3000 + (localSeed % 5000)) + ' (' + c.city + ')',
      voltePresent: true,
      vowifiPresent: (localSeed % 3) !== 0,
      dataUsedGB: used,
      dataCapGB: cap,
      voiceMinutes: 60 + (localSeed % 400),
      smsCount: 5 + (localSeed % 80),
      esim: (localSeed % 2) === 0,
      roaming: false,
    }
  })

  // ---- TV device (if customer has TV/Streaming) ----
  let tvDevice: TvDevice | null = null
  if (hasTv) {
    const tvOutage = hasOutage && outageDomain === 'TV'
    const tvSeed = seed + 4639
    const model = pick(['REVTV 4K', 'REVTV Box', 'REVTV Stream'], tvSeed)
    tvDevice = {
      online: !tvOutage,
      model,
      serial: 'V6-' + (tvSeed % 9999999).toString().padStart(7, '0'),
      ip: '10.' + (tvSeed % 250) + '.' + ((tvSeed >> 4) % 250) + '.' + ((tvSeed >> 8) % 250),
      uptimeHours: tvOutage ? 0 : 48 + (tvSeed % 800),
      lastActivity: past(today, 0) + ' ' + (18 + (tvSeed % 4)) + ':' + ((tvSeed % 60).toString().padStart(2, '0')),
      channelsWatched7d: 8 + (tvSeed % 18),
      topChannel: pick(['Één', 'VTM', 'Canvas', 'Sports add-on', 'DAZN', 'Play4'], tvSeed),
      recordings: tvSeed % 22,
      storageUsedPct: 30 + (tvSeed % 60),
      appVersion: pick(['v3.4.1', 'v3.4.2', 'v3.5.0'], tvSeed),
    }
  }

  const truckRolls: TruckRoll[] = c.tenureYears > 2 ? [
    { date: past(today, 90 + (seed % 200)), reason: 'Wi-Fi coverage issue', engineer: 'David M.', outcome: 'Mesh pod added', rating: 4 + (seed % 2) },
    ...(c.tenureYears > 5 ? [{ date: past(today, 400 + (seed % 200)), reason: 'Modem replacement', engineer: 'Karel P.', outcome: 'Replaced HG658c → Wi-Fi 6 Pro', rating: 5 }] : []),
  ] : []
  const doNotDispatch = c.churnRisk === 'High' && (seed % 4 === 0)

  // ---- 3. Commercial / Contract ----
  const daysSinceJoin = Math.floor((today.getTime() - new Date(c.joined).getTime()) / 86400000)
  const contractTermDays = 365 * 2
  const cycle = daysSinceJoin % contractTermDays
  const daysRemaining = contractTermDays - cycle
  const inContract = daysRemaining > 0 && daysRemaining < contractTermDays
  const contract: ContractInfo = {
    status: inContract ? 'In contract' : daysRemaining < 30 ? 'Rolling' : 'Out of contract',
    endDate: future(today, daysRemaining),
    daysRemaining,
    etf: inContract ? Math.round((daysRemaining / 30) * (c.mrr * 0.3)) : 0,
    planName: c.services[0]?.name ?? 'Standard',
    minTerm: 24,
  }

  const priceRiseApplied = c.tenureYears >= 1
  const priceRise = {
    sent: priceRiseApplied,
    date: priceRiseApplied ? past(today, 60 + (seed % 30)) : '',
    pctIncrease: 3.9 + (seed % 3) / 10,
    ack: priceRiseApplied && (seed % 2 === 0),
  }

  const discounts: Discount[] = [
    ...(c.tenureYears <= 1 ? [{ name: 'New customer discount', pct: 20, expires: future(today, 60 + (seed % 90)), mrrImpact: -Math.round(c.mrr * 0.2) }] : []),
    ...(c.tenureYears > 3 ? [{ name: 'Loyalty bundle discount', pct: 10, expires: future(today, 200), mrrImpact: -Math.round(c.mrr * 0.1) }] : []),
  ]

  const orders: OrderItem[] = c.churnRisk === 'High' ? [
    { id: `ORD-${(seed % 99999).toString().padStart(5, '0')}`, type: 'Plan downgrade', status: 'Pending', scheduled: future(today, 7) },
  ] : c.recommendations.length > 0 && (seed % 3 === 0) ? [
    { id: `ORD-${(seed % 99999).toString().padStart(5, '0')}`, type: 'Speed upgrade', status: 'Scheduled', scheduled: future(today, 5) },
  ] : []

  const failedCount = c.invoices.filter(i => i.status === 'Overdue').length
  const paymentMethod = {
    type: 'Direct Debit' as const,
    last4: ((seed % 9000) + 1000).toString(),
    failedCount,
    dunningStage: Math.min(failedCount, 3) as 0 | 1 | 2 | 3,
  }

  // ---- 4. Engagement & Digital ----
  const app: AppUsage = {
    lastLogin: past(today, 1 + (seed % 30)),
    sessions30d: 4 + (seed % 22),
    mau: (seed % 4) !== 0,
    topFeatures: ['View bill', 'Speed test', 'Self-care', 'Manage Wi-Fi'].slice(0, 2 + (seed % 3)),
    appRating: 3 + (seed % 3),
  }

  const nps: NpsScore[] = [
    { date: past(today, 14), score: c.sentiment > 75 ? 9 : c.sentiment > 50 ? 7 : 4, verbatim: c.sentiment > 75 ? 'Service is excellent, never had issues' : c.sentiment > 50 ? 'Decent but could be cheaper' : 'Speeds inconsistent at peak hours' },
    { date: past(today, 100), score: c.sentiment > 75 ? 10 : c.sentiment > 50 ? 8 : 5, verbatim: '' },
    { date: past(today, 200), score: c.sentiment > 75 ? 9 : 7, verbatim: '' },
  ]

  const tobi: TobiTranscript[] = (seed % 3 !== 0) ? [
    { date: past(today, 10 + (seed % 30)), intent: 'Bill explanation', resolution: 'Resolved', messages: 6 + (seed % 8) },
    ...(c.churnRisk !== 'Low' ? [{ date: past(today, 5), intent: 'Cancellation enquiry', resolution: 'Handed off' as const, messages: 12 }] : []),
  ] : []

  const journey = c.interactions.slice(0, 5).map((it) => ({
    date: it.date, channel: it.channel, intent: it.topic, outcome: it.sentiment,
  }))

  // ---- 5. Predictive AI ----
  const churnScoreVal = c.churnRisk === 'High' ? 65 + (seed % 25) : c.churnRisk === 'Medium' ? 35 + (seed % 25) : 5 + (seed % 20)
  const churn = {
    score: churnScoreVal,
    band: c.churnRisk,
    reasons: c.churnRisk === 'High' ? [
      { code: 'NEG_INTERACTION_30D', weight: 0.34 },
      { code: 'OVERDUE_INVOICE_X2', weight: 0.27 },
      { code: 'COMPETITOR_PRICE_GAP', weight: 0.18 },
    ] : c.churnRisk === 'Medium' ? [
      { code: 'CONTRACT_END_60D', weight: 0.31 },
      { code: 'NPS_DROP', weight: 0.22 },
      { code: 'LOW_APP_ENGAGEMENT', weight: 0.15 },
    ] : [
      { code: 'STABLE_PAYMENTS', weight: -0.42 },
      { code: 'HIGH_TENURE', weight: -0.31 },
    ],
    modelVersion: 'churn_v3.7',
    confidence: 0.82 + (seed % 15) / 100,
  }

  const clvForecast = Math.round(c.ltv * (1 + (c.churnRisk === 'Low' ? 0.6 : c.churnRisk === 'Medium' ? 0.3 : 0.05) + ((seed % 20) / 100)))
  const clv = { current: c.ltv, forecast36m: clvForecast, trend: c.churnRisk === 'High' ? 'down' as const : c.churnRisk === 'Low' ? 'up' as const : 'flat' as const }

  const nba: NextBestAction[] = c.recommendations.map((r, i) => ({
    id: `NBA-${i + 1}`,
    title: r.title,
    channel: i === 0 ? 'Outbound call' : i === 1 ? 'Email' : 'In-app',
    uplift: r.uplift,
    eligibility: i === 0 ? 'Eligible' : i === 1 ? 'Cooldown' : 'Eligible',
    cooldownDays: i === 1 ? 7 : 0,
    expectedValue: 50 + (seed % 200) + i * 30,
    confidence: 0.7 + (i * 0.05) + (seed % 20) / 100,
    reasonCode: r.type === 'Retention' ? 'CHURN_PREVENT' : r.type === 'Upsell' ? 'WALLET_SHARE' : 'TIER_UPGRADE',
  }))

  const bundlePropensity = [
    { bundle: 'Broadband + TV + Mobile', probability: 0.4 + (seed % 50) / 100, willPayUpTo: 95 + (seed % 30) },
    { bundle: 'Fibre + Sports add-on', probability: 0.25 + (seed % 40) / 100, willPayUpTo: 110 + (seed % 20) },
  ]

  const priceSensitivity = c.tier === 'Platinum' ? 'Premium' as const : c.tier === 'Gold' ? 'Standard' as const : c.tier === 'Silver' ? 'Value' as const : 'Discount-led' as const

  // ---- 6. Care & Operational ----
  const cases: Case[] = c.churnRisk === 'High' ? [
    { id: `CS-${(seed % 99999).toString().padStart(5, '0')}`, title: 'Cancellation request — pending save offer', priority: 'P1', status: 'In Progress', opened: past(today, 2), sla: '4h remaining', slaBreach: false, owner: 'Marie O.', lastUpdate: '14m ago' },
    { id: `CS-${((seed + 1) % 99999).toString().padStart(5, '0')}`, title: 'Slow speeds investigation', priority: 'P3', status: 'Awaiting Customer', opened: past(today, 8), sla: '32h remaining', slaBreach: false, owner: 'NOC', lastUpdate: '2d ago' },
  ] : c.churnRisk === 'Medium' ? [
    { id: `CS-${(seed % 99999).toString().padStart(5, '0')}`, title: 'Bill query', priority: 'P3', status: 'Resolved', opened: past(today, 6), sla: 'Met', slaBreach: false, owner: 'Tom L.', lastUpdate: '1d ago' },
  ] : []

  const promises = cases.length > 0 ? [
    { type: 'Call back', due: future(today, 1), breachRisk: 'Medium' as const },
  ] : []

  const agentNotes: AgentNote[] = [
    { date: past(today, 8 + (seed % 14)), agent: 'Marie O. (Retention)', note: 'Customer mentioned price comparison vs BTC. Open to TV bundle if priced ≤BSD 95. No urgency to switch.', aiSummary: 'Price-sensitive · TV upsell opportunity · Low immediate churn intent' },
    { date: past(today, 30 + (seed % 30)), agent: 'Tom L. (Tech)', note: 'Wi-Fi reach issue at upstairs office. Mesh pod offered — accepted. Scheduled install.', aiSummary: 'Coverage complaint resolved with hardware' },
  ]

  const sentimentDrivers: SentimentDriver[] = c.sentiment > 75 ? [
    { driver: 'Service reliability', impact: 32, trend: 'up' },
    { driver: 'Speed performance', impact: 28, trend: 'up' },
    { driver: 'App experience', impact: 18, trend: 'flat' },
  ] : c.sentiment > 50 ? [
    { driver: 'Pricing', impact: -22, trend: 'down' },
    { driver: 'Service reliability', impact: 18, trend: 'flat' },
    { driver: 'Bundle value', impact: -12, trend: 'down' },
  ] : [
    { driver: 'Outage frequency', impact: -38, trend: 'down' },
    { driver: 'Pricing', impact: -28, trend: 'down' },
    { driver: 'Agent wait time', impact: -22, trend: 'down' },
    { driver: 'Tenure goodwill', impact: 12, trend: 'flat' },
  ]
  const fieldRating = 4 + (seed % 2)

  // ---- 7. Value & Loyalty ----
  const cohortRank = {
    tier: c.tier,
    engagementPercentile: c.churnRisk === 'High' ? 15 + (seed % 20) : 50 + (seed % 45),
    valuePercentile: c.tier === 'Platinum' ? 85 + (seed % 14) : c.tier === 'Gold' ? 60 + (seed % 25) : 30 + (seed % 30),
  }
  const referrals: Referral[] = c.tier === 'Platinum' || c.tier === 'Gold' ? [
    { date: past(today, 200), referredTo: 'A. Friend', status: 'Activated', reward: 50 },
  ] : []
  const milestones: Milestone[] = c.tenureYears >= 5 ? [
    { name: `${c.tenureYears}-year anniversary`, date: c.joined.replace(c.joined.slice(0, 4), today.getFullYear().toString()), eligibleFor: '2 months free or hardware upgrade' },
  ] : c.tenureYears >= 1 ? [
    { name: `${c.tenureYears}-year tenure`, date: c.joined.replace(c.joined.slice(0, 4), today.getFullYear().toString()), eligibleFor: 'Discounted speed upgrade' },
  ] : []
  const moveHistory = c.tenureYears > 4 ? [
    { date: past(today, 400 + (seed % 300)), from: 'Old address', to: c.address, type: 'House move (kept service)' },
  ] : []

  // ---- 8. Risk & Compliance ----
  const comregFlag = c.churnRisk === 'High' && (seed % 7 === 0)
  const badDebt = { writeOff: 0, status: 'No write-off history' }
  const piiAccess: PiiAccess[] = [
    { date: past(today, 0), user: 'Emma O.', role: 'Retention Agent', reason: 'Live call — case CS-' + (seed % 99999) },
    { date: past(today, 1), user: 'Tobi (Bot)', role: 'AI Assistant', reason: 'Self-service intent: bill query' },
    { date: past(today, 4), user: 'Lars Jose', role: 'Admin', reason: 'C360 review' },
    { date: past(today, 12), user: 'Snowflake Service Account', role: 'ETL', reason: 'Daily sync to ML model' },
  ]

  // ---- 10. Comparative ----
  const cohort: CohortStat[] = [
    { metric: 'MRR', thisCustomer: c.mrr, cohortMedian: c.tier === 'Platinum' ? 135 : c.tier === 'Gold' ? 88 : c.tier === 'Silver' ? 58 : 38, percentile: cohortRank.valuePercentile },
    { metric: 'Tenure (yrs)', thisCustomer: c.tenureYears, cohortMedian: 4, percentile: c.tenureYears > 4 ? 75 : 35 },
    { metric: 'NPS', thisCustomer: nps[0].score, cohortMedian: 7, percentile: c.sentiment > 75 ? 80 : 40 },
    { metric: 'App sessions / 30d', thisCustomer: app.sessions30d, cohortMedian: 9, percentile: app.sessions30d > 9 ? 70 : 30 },
  ]

  const playbook = c.churnRisk === 'High' ? {
    intent: 'Save / retain',
    script: '"I can see you\'ve had two service calls recently — I\'m really sorry. Let me see what we can do to make this right..."',
    nextStep: 'Offer 50% off 6 months + upgrade free Wi-Fi 6 Pro · escalate to L2 if declined',
  } : c.churnRisk === 'Medium' ? {
    intent: 'Re-engage / contract review',
    script: '"Just noticed your contract is approaching renewal — would you like me to review your current usage and see if there\'s a better fit?"',
    nextStep: 'Quote loyalty pricing on current plan + suggest bundle add-on',
  } : {
    intent: 'Upsell / appreciation',
    script: '"Thank you for being a loyal Cable Bahamas customer! Based on how you use your service, I think you would benefit from our 1 Gb Fibre plan..."',
    nextStep: 'Soft-pitch upgrade · log MAU score',
  }

  // ---- Relationship graph ----
  const graph: RelationshipGraph = (() => {
    const nodes: RelNode[] = []
    const edges: RelEdge[] = []
    const selfId = c.id
    nodes.push({
      id: selfId,
      label: c.name,
      kind: 'self',
      subtitle: `${c.tier} · ${c.id}`,
      isCustomer: true,
      vmCustomerId: c.id,
      details: [
        { k: 'Tier', v: c.tier },
        { k: 'Tenure', v: `${c.tenureYears} yrs` },
        { k: 'MRR', v: `BSD ${c.mrr}` },
        { k: 'Address', v: `${c.city}, ${c.county}` },
      ],
    })

    // Household members
    household.forEach((h, i) => {
      const id = `${selfId}-hh-${i}`
      nodes.push({
        id,
        label: h.name,
        kind: 'household',
        subtitle: h.relation,
        isCustomer: false,
        details: [
          { k: 'Relation', v: h.relation },
          ...(h.line ? [{ k: 'Mobile line', v: h.line }] : []),
          { k: 'Same address', v: `${c.city}` },
          { k: 'Source', v: 'Self-declared / Salesforce' },
        ],
      })
      edges.push({ from: selfId, to: id, label: h.relation, strength: 3 })
    })

    // Business / employer link (some customers work at a business which is also a VM customer)
    if (seed % 3 !== 0) {
      const businesses = [
        { id: 'CBL-B-2210', name: 'Rolle Construction (demo)', sector: 'Construction', city: c.city, employees: 24 },
        { id: 'CBL-B-3104', name: 'Eleuthera Coffee Roasters', sector: 'Hospitality', city: 'Eleuthera', employees: 12 },
        { id: 'CBL-B-4087', name: 'Scheldt Marketing', sector: 'Professional services', city: 'Freeport', employees: 58 },
        { id: 'CBL-B-5512', name: 'Family Islands Logistics', sector: 'Transport', city: 'Abaco', employees: 110 },
        { id: 'CBL-B-6603', name: 'Nassau Tech Hub', sector: 'IT services', city: 'Freeport', employees: 35 },
      ]
      const biz = businesses[seed % businesses.length]
      nodes.push({
        id: biz.id,
        label: biz.name,
        kind: 'business',
        subtitle: 'Cable Bahamas Business customer',
        isCustomer: true,
        vmCustomerId: biz.id,
        details: [
          { k: 'Sector', v: biz.sector },
          { k: 'Employees', v: `${biz.employees}` },
          { k: 'HQ', v: biz.city },
          { k: 'Products', v: 'Cable Bahamas Business Fibre 1 Gb · 8 lines mobile lines · SIP trunk' },
          { k: 'Account ID', v: biz.id },
          { k: 'Relationship', v: 'Employee · contract signatory' },
        ],
      })
      edges.push({ from: selfId, to: biz.id, label: 'Works at', strength: 2 })
    }

    // Partner — sometimes a separate Cable Bahamas consumer customer
    if (seed % 4 === 0 && customers.length > 1) {
      const partner = customers.find(x => x.id !== c.id && x.city === c.city) ?? customers.find(x => x.id !== c.id)
      if (partner) {
        nodes.push({
          id: partner.id,
          label: partner.name,
          kind: 'partner',
          subtitle: 'Linked household — separate account',
          isCustomer: true,
          vmCustomerId: partner.id,
          details: [
            { k: 'Relationship', v: 'Partner / cohabitee' },
            { k: 'Their tier', v: partner.tier },
            { k: 'Their MRR', v: `BSD ${partner.mrr}` },
            { k: 'Address match', v: partner.city === c.city ? 'Same city' : 'Different city' },
            { k: 'Account ID', v: partner.id },
          ],
        })
        edges.push({ from: selfId, to: partner.id, label: 'Partner', strength: 3 })
      }
    }

    // Authorised contact (someone who can speak on the account)
    const auth = `${pick(FIRST_NAMES_FEMALE.concat(FIRST_NAMES_MALE), seed + 9)} ${pick(['Ferguson', 'Bethel', 'Rolle', 'Knowles', 'Adderley'], seed + 13)}`
    nodes.push({
      id: `${selfId}-auth`,
      label: auth,
      kind: 'authorised',
      subtitle: 'Authorised on account',
      isCustomer: false,
      details: [
        { k: 'Permission', v: 'Speak / pay / order' },
        { k: 'Granted', v: past(today, 200 + (seed % 800)) },
        { k: 'Source', v: 'Voice authorisation (Care call)' },
      ],
    })
    edges.push({ from: selfId, to: `${selfId}-auth`, label: 'Authorised', strength: 1 })

    // Address — premise as a node so multi-occupancy is visible
    nodes.push({
      id: `${selfId}-addr`,
      label: `${c.city} premise`,
      kind: 'address',
      subtitle: `${c.county}`,
      isCustomer: false,
      details: [
        { k: 'Postal code', v: `${(2000 + (seed % 7000)).toString()}` },
        { k: 'Premise type', v: pick(['Detached', 'Semi-detached', 'Apartment', 'Terrace'], seed) },
        { k: 'Connected accounts', v: `${1 + (seed % 2)}` },
        { k: 'Access tech', v: e_premiseTechFallback(premiseTech) },
      ],
    })
    edges.push({ from: selfId, to: `${selfId}-addr`, label: 'Lives at', strength: 2 })

    // Referral relationship — outgoing referral to another customer
    if (referrals.length > 0) {
      const r = referrals[0]
      nodes.push({
        id: `${selfId}-ref-0`,
        label: r.referredTo,
        kind: 'referral',
        subtitle: r.status === 'Activated' ? 'New customer · referred' : 'Referral pending',
        isCustomer: r.status === 'Activated',
        details: [
          { k: 'Referred on', v: r.date },
          { k: 'Status', v: r.status },
          { k: 'Reward', v: `BSD ${r.reward}` },
        ],
      })
      edges.push({ from: selfId, to: `${selfId}-ref-0`, label: 'Referred', strength: 1 })
    }

    return { nodes, edges }
  })()

  return {
    household, systemIds, consents, vulnerable, accessibility,
    hasBroadband, hasMobile, hasTv,
    modem, mobileDevices, tvDevice, outage, premiseTech, truckRolls, doNotDispatch,
    contract, priceRise, discounts, orders, paymentMethod,
    app, nps, tobi, journey,
    churn, clv, nba, bundlePropensity, priceSensitivity, complaintRisk: c.sentiment < 50 ? 0.6 : 0.15, fraudScore: 0.05 + (seed % 10) / 100, creditScore: 700 + (seed % 150),
    cases, promises, agentNotes, sentimentDrivers, fieldRating,
    cohortRank, referrals, milestones, moveHistory,
    comregFlag, badDebt, piiAccess,
    cohort, playbook,
    graph,
  }
}

function e_premiseTechFallback(p: { tech: string; modemModel: string; pods: number; meshHealth: number } | null): string {
  return p?.tech ?? 'Mobile-only / no fixed line'
}
