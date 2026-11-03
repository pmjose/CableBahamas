// =============================================================================
// Product & Content cockpit — fixture data
// Illustrative scenario catalog and synthetic PM telemetry (October 2026)
// =============================================================================

export type LifecycleStage = 'Intro' | 'Growth' | 'Mature' | 'Decline'
export type Confidence = 'Committed' | 'Likely' | 'Exploratory'
export type RoadmapStatus = 'Now' | 'Next' | 'Later'
export type Theme = 'Speed' | 'Mobile' | 'TV' | 'AI' | 'Smart Home' | 'Network' | 'Apps'

// -------------------------------------------------------------------------
// SKU portfolio (22 items)
// -------------------------------------------------------------------------
export type SKU = {
  code: string
  name: string
  cat: 'Broadband' | 'TV' | 'Mobile' | 'Bundle' | 'Add-on' | 'B2B'
  stage: LifecycleStage
  launchDate: string          // ISO yyyy-mm
  take: number                // % of base
  mrr: number                 // BSD /mo SVR
  trend: number               // % MoM take-rate change
  gmPct: number               // gross margin %
  nps: number                 // -100 to +100
  dauPct: number              // DAU as % of subs
  churnPct: number            // monthly
  cac: number
  ltv: number
  squad: 'BB' | 'TV' | 'Mobile' | 'Bundles' | 'Apps'
  okr: string
  cannibPair?: string
  share: number               // relative market share index (1.0 = leader)
  growth: number              // YoY growth %
  refreshDate: string         // last refresh
  status: 'GA' | 'Beta' | 'EOL' | 'New'
}

export const skus: SKU[] = [
  { code: 'BB_10G',    name: '10 Gb Fibre (XGS-PON)',                  cat: 'Broadband', stage: 'Intro',   launchDate: '2026-04', take: 2,  mrr: 50,  trend: 62,  gmPct: 38, nps: 52, dauPct: 88, churnPct: 0.6, cac: 130, ltv: 2400, squad: 'BB',      okr: 'Speed leadership', share: 0.4, growth: 88,  refreshDate: '2026-04', status: 'New' },
  { code: 'BB_2G',     name: '2 Gb Fibre',                            cat: 'Broadband', stage: 'Growth',  launchDate: '2025-02', take: 8,  mrr: 50,  trend: 34,  gmPct: 42, nps: 48, dauPct: 86, churnPct: 0.8, cac: 110, ltv: 2200, squad: 'BB',      okr: 'Speed leadership', share: 0.7, growth: 52,  refreshDate: '2025-09', status: 'GA' },
  { code: 'BB_1G',     name: '1 Gb Fibre',                            cat: 'Broadband', stage: 'Mature',  launchDate: '2022-08', take: 28, mrr: 40,  trend: 18,  gmPct: 48, nps: 42, dauPct: 80, churnPct: 1.2, cac: 95,  ltv: 1900, squad: 'BB',      okr: 'Mass-market',      share: 1.2, growth: 12,  refreshDate: '2025-03', status: 'GA' },
  { code: 'BB_600',    name: '600 Mb Fibre',                          cat: 'Broadband', stage: 'Mature',  launchDate: '2021-11', take: 42, mrr: 35,  trend: 4,   gmPct: 51, nps: 35, dauPct: 75, churnPct: 1.6, cac: 78,  ltv: 1620, squad: 'BB',      okr: 'Mass-market',      share: 1.4, growth: 4,   refreshDate: '2024-09', status: 'GA' },
  { code: 'BB_300',    name: '300 Mb Fibre (legacy)',                 cat: 'Broadband', stage: 'Decline', launchDate: '2018-04', take: 4,  mrr: 30,  trend: -22, gmPct: 56, nps: 18, dauPct: 60, churnPct: 2.4, cac: 60,  ltv: 980,  squad: 'BB',      okr: 'Sunset',           cannibPair: 'BB_600', share: 0.6, growth: -32, refreshDate: '2023-02', status: 'EOL' },
  { code: 'TV_TOTAL',  name: 'REVTV',                     cat: 'TV',        stage: 'Growth',  launchDate: '2024-09', take: 24, mrr: 35,  trend: 12,  gmPct: 28, nps: 38, dauPct: 64, churnPct: 1.4, cac: 50,  ltv: 1100, squad: 'TV',      okr: 'TV pivot to streaming', share: 0.9, growth: 22, refreshDate: '2025-07', status: 'GA' },
  { code: 'TV_ESEN',   name: 'REVTV Start',                  cat: 'TV',        stage: 'Mature',  launchDate: '2024-09', take: 14, mrr: 20,  trend: 8,   gmPct: 35, nps: 28, dauPct: 52, churnPct: 1.8, cac: 45,  ltv: 720,  squad: 'TV',      okr: 'TV pivot to streaming', share: 0.6, growth: 8,  refreshDate: '2025-07', status: 'GA' },
  { code: 'TV_BOX',    name: 'REVTV Box (set-top, EOL 2027)',   cat: 'TV',        stage: 'Decline', launchDate: '2019-09', take: 18, mrr: 42,  trend: -14, gmPct: 22, nps: 22, dauPct: 70, churnPct: 2.0, cac: 75,  ltv: 980,  squad: 'TV',      okr: 'Sunset',           cannibPair: 'TV_TOTAL', share: 0.8, growth: -28, refreshDate: '2023-11', status: 'EOL' },
  { code: 'MOV_LIGA',  name: 'Sports add-on Sports package (add-on)',          cat: 'Add-on',    stage: 'Growth',  launchDate: '2021-01', take: 11, mrr: 30,  trend: 6,   gmPct: 32, nps: 56, dauPct: 82, churnPct: 1.2, cac: 35,  ltv: 1300, squad: 'TV',      okr: 'Premium content',  share: 1.0, growth: 12,  refreshDate: '2026-01', status: 'GA' },
  { code: 'ESPN_PACK', name: 'Caribbean Sports package + ESPN',              cat: 'Add-on',    stage: 'Intro',   launchDate: '2026-01', take: 6,  mrr: 20,  trend: 22,  gmPct: 25, nps: 44, dauPct: 75, churnPct: 1.4, cac: 30,  ltv: 720,  squad: 'TV',      okr: 'Premium content',  share: 0.7, growth: 65,  refreshDate: '2026-01', status: 'New' },
  { code: 'HBO_DSNY',  name: 'Max + Disney+',                     cat: 'Add-on',    stage: 'Mature',  launchDate: '2022-04', take: 8,  mrr: 15,  trend: 4,   gmPct: 38, nps: 34, dauPct: 58, churnPct: 1.6, cac: 25,  ltv: 540,  squad: 'TV',      okr: 'Premium content',  share: 0.9, growth: 6,   refreshDate: '2025-04', status: 'GA' },
  { code: 'MOB_UNL',   name: 'aliv Mobile Unlimited 5G',           cat: 'Mobile',    stage: 'Growth',  launchDate: '2024-06', take: 12, mrr: 35,  trend: 28,  gmPct: 32, nps: 46, dauPct: 92, churnPct: 1.0, cac: 45,  ltv: 1320, squad: 'Mobile',  okr: 'Mobile attach',    share: 0.5, growth: 38,  refreshDate: '2025-11', status: 'GA' },
  { code: 'MOB_150',   name: 'aliv Mobile 150GB 5G',               cat: 'Mobile',    stage: 'Mature',  launchDate: '2023-08', take: 14, mrr: 25,  trend: 14,  gmPct: 38, nps: 38, dauPct: 88, churnPct: 1.2, cac: 38,  ltv: 920,  squad: 'Mobile',  okr: 'Mobile attach',    share: 0.6, growth: 14,  refreshDate: '2025-08', status: 'GA' },
  { code: 'MOB_60',    name: 'aliv Mobile 60GB',                   cat: 'Mobile',    stage: 'Mature',  launchDate: '2022-11', take: 18, mrr: 20,  trend: 6,   gmPct: 42, nps: 32, dauPct: 84, churnPct: 1.4, cac: 32,  ltv: 720,  squad: 'Mobile',  okr: 'Mass-market',      share: 0.7, growth: 6,   refreshDate: '2025-02', status: 'GA' },
  { code: 'MOB_25',    name: 'aliv Mobile 25GB',                   cat: 'Mobile',    stage: 'Decline', launchDate: '2021-09', take: 16, mrr: 15,  trend: 2,   gmPct: 46, nps: 24, dauPct: 78, churnPct: 1.8, cac: 28,  ltv: 540,  squad: 'Mobile',  okr: 'Mass-market',      cannibPair: 'MOB_60', share: 0.5, growth: -2, refreshDate: '2024-04', status: 'GA' },
  { code: 'ONE_TOTAL', name: 'REVConnect (2 Gb + TV + 4 Mobile + Home Phone)', cat: 'Bundle', stage: 'Growth',  launchDate: '2024-08', take: 6,  mrr: 110, trend: 44,  gmPct: 26, nps: 58, dauPct: 90, churnPct: 0.8, cac: 110, ltv: 4350, squad: 'Bundles', okr: 'Bundle uplift',    share: 0.8, growth: 58,  refreshDate: '2025-08', status: 'GA' },
  { code: 'BB_TV_LIGA', name: '1 Gb + TV + Sports add-on · Sports package',      cat: 'Bundle',    stage: 'Mature',  launchDate: '2024-01', take: 5,  mrr: 95,  trend: 18,  gmPct: 28, nps: 50, dauPct: 88, churnPct: 1.0, cac: 95,  ltv: 3450, squad: 'Bundles', okr: 'Bundle uplift',    share: 0.7, growth: 22,  refreshDate: '2025-01', status: 'GA' },
  { code: 'REVConnect',       name: 'REVConnect — 1 Gb + Mobile Unlimited',   cat: 'Bundle',    stage: 'Growth',  launchDate: '2024-11', take: 9,  mrr: 80,  trend: 34,  gmPct: 32, nps: 54, dauPct: 86, churnPct: 0.7, cac: 80,  ltv: 3150, squad: 'Bundles', okr: 'Bundle uplift',    share: 0.6, growth: 48,  refreshDate: '2025-11', status: 'GA' },
  { code: 'BIT',       name: 'REVHome (600 Mb + TV Essential)',            cat: 'Bundle',    stage: 'Mature',  launchDate: '2023-04', take: 14, mrr: 55,  trend: 12,  gmPct: 30, nps: 42, dauPct: 80, churnPct: 1.2, cac: 80,  ltv: 2280, squad: 'Bundles', okr: 'Mass-market',      share: 1.0, growth: 14,  refreshDate: '2024-09', status: 'GA' },
  { code: 'WIFI_MESH', name: 'REV WiFi Booster (3-pack)',          cat: 'Add-on',    stage: 'Growth',  launchDate: '2025-02', take: 22, mrr: 8,   trend: 18,  gmPct: 45, nps: 64, dauPct: 0,  churnPct: 0.8, cac: 25,  ltv: 280,  squad: 'BB',      okr: 'Wi-Fi quality',    share: 0.9, growth: 32,  refreshDate: '2025-02', status: 'GA' },
  { code: 'WIFI_GUAR', name: 'Cable Bahamas Wi-Fi Guarantee (BSD 150 credit)', cat: 'Add-on',    stage: 'Growth',  launchDate: '2025-06', take: 38, mrr: 0,   trend: 88,  gmPct: 0,  nps: 72, dauPct: 0,  churnPct: 0.4, cac: 0,   ltv: 0,    squad: 'BB',      okr: 'Wi-Fi quality',    share: 1.5, growth: 142, refreshDate: '2025-06', status: 'New' },
  { code: 'FIJO',      name: 'REVTALK (unlimited)',          cat: 'Add-on',    stage: 'Decline', launchDate: '2017-01', take: 14, mrr: 10,  trend: -8,  gmPct: 65, nps: 18, dauPct: 8,  churnPct: 2.6, cac: 5,   ltv: 240,  squad: 'BB',      okr: 'Sunset',           share: 0.4, growth: -18, refreshDate: '2021-08', status: 'EOL' },
]

// -------------------------------------------------------------------------
// Content library (12 items with full economics)
// -------------------------------------------------------------------------
export type ContentItem = {
  name: string
  partner: 'Sports add-on' | 'BTC' | 'Netflix' | 'Amazon' | 'Disney' | 'Apple' | 'WBD' | 'Local broadcaster' | 'ESPN'
  genre: 'Sports' | 'Cinema' | 'SVOD' | 'Linear' | 'Kids' | 'News' | 'Local'
  cost: number              // BSD m / yr
  viewers: number
  viewerHours: number       // m hrs / yr
  attributedSubs: number    // # subs attributable to this content
  mg: number                // minimum guarantee BSD m
  exclusivity: 'Exclusive' | 'Non-exclusive' | 'Co-exclusive'
  renewalDate: string
  revShare: number          // % to partner (for SVOD)
  windowing: 'Live' | 'Linear+VOD' | 'VOD' | 'Catch-up'
  saveOfferUse: number      // % of retention saves using this
}
export const content: ContentItem[] = [
  { name: 'Sports add-on · Sports package',      partner: 'Sports add-on', genre: 'Sports',  cost: 18.4, viewers: 480000, viewerHours: 86,  attributedSubs: 142000, mg: 16.0, exclusivity: 'Co-exclusive',   renewalDate: '2027-12', revShare: 0,  windowing: 'Live',       saveOfferUse: 38 },
  { name: 'Sports add-on Cine',       partner: 'Sports add-on', genre: 'Cinema',  cost: 8.6,  viewers: 312000, viewerHours: 44,  attributedSubs: 78000,  mg: 7.5,  exclusivity: 'Co-exclusive',   renewalDate: '2027-05', revShare: 0,  windowing: 'Linear+VOD', saveOfferUse: 18 },
  { name: 'Netflix (carrier billing)', partner: 'Netflix',   genre: 'SVOD',    cost: 6.2,  viewers: 412000, viewerHours: 72,  attributedSubs: 24000,  mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2027-08', revShare: 12, windowing: 'VOD',        saveOfferUse: 6 },
  { name: 'Prime Video (integrated)',  partner: 'Amazon',    genre: 'SVOD',    cost: 4.8,  viewers: 224000, viewerHours: 38,  attributedSubs: 12000,  mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2027-02', revShare: 10, windowing: 'VOD',        saveOfferUse: 3 },
  { name: 'Caribbean Sports package',              partner: 'ESPN',      genre: 'Sports',  cost: 7.2,  viewers: 142000, viewerHours: 24,  attributedSubs: 38000,  mg: 6.5,  exclusivity: 'Exclusive',      renewalDate: '2026-11', revShare: 0,  windowing: 'Live',       saveOfferUse: 14 },
  { name: 'Disney+',                   partner: 'Disney',    genre: 'SVOD',    cost: 3.6,  viewers: 156000, viewerHours: 28,  attributedSubs: 8000,   mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2027-06', revShare: 14, windowing: 'VOD',        saveOfferUse: 4 },
  { name: 'Apple TV+',                 partner: 'Apple',     genre: 'SVOD',    cost: 2.4,  viewers: 92000,  viewerHours: 18,  attributedSubs: 4000,   mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2027-09', revShare: 15, windowing: 'VOD',        saveOfferUse: 2 },
  { name: 'OUR TV (scenario)',           partner: 'Local broadcaster',       genre: 'Local',   cost: 0.0,  viewers: 188000, viewerHours: 28,  attributedSubs: 18000,  mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2029-05', revShare: 0,  windowing: 'Catch-up',   saveOfferUse: 1 },
  { name: 'ZNS (scenario)',               partner: 'Local broadcaster',       genre: 'Local',   cost: 0.0,  viewers: 64000,  viewerHours: 12,  attributedSubs: 6000,   mg: 0,    exclusivity: 'Non-exclusive',  renewalDate: '2029-05', revShare: 0,  windowing: 'Catch-up',   saveOfferUse: 0 },
  { name: 'Max',                   partner: 'WBD',       genre: 'Cinema',  cost: 2.8,  viewers: 56000,  viewerHours: 11,  attributedSubs: 14000,  mg: 2.4,  exclusivity: 'Exclusive',      renewalDate: '2027-01', revShare: 0,  windowing: 'VOD',        saveOfferUse: 6 },
  { name: 'Disney+ Junior',            partner: 'Disney',    genre: 'Kids',    cost: 1.2,  viewers: 38000,  viewerHours: 8,   attributedSubs: 2000,   mg: 1.0,  exclusivity: 'Co-exclusive',   renewalDate: '2027-05', revShare: 0,  windowing: 'Linear+VOD', saveOfferUse: 1 },
  { name: 'CNN International + News pack',   partner: 'WBD',       genre: 'News',    cost: 0.8,  viewers: 102000, viewerHours: 14,  attributedSubs: 0,      mg: 0.6,  exclusivity: 'Non-exclusive',  renewalDate: '2027-07', revShare: 0,  windowing: 'Live',       saveOfferUse: 0 },
]

// -------------------------------------------------------------------------
// Roadmap (14 items in Now/Next/Later)
// -------------------------------------------------------------------------
export type RoadmapItem = {
  id: string
  title: string
  status: RoadmapStatus
  theme: Theme
  squad: string
  okr: string
  invest: string                  // BSD /heads/Q
  confidence: Confidence
  evidence: string
  successMetric: string
  risks: string
  betaSignups?: number
  betaNps?: number
  eta: string
}
export const roadmap: RoadmapItem[] = [
  { id: 'R01', title: '10 Gb Fibre Beta (Nassau)',             status: 'Now',   theme: 'Speed',      squad: 'BB',      okr: 'Speed leadership',     invest: 'BSD 2.4M / 4 hd / Q3',    confidence: 'Committed',  evidence: '500 wait-list signups · 92% NPS in lab', successMetric: '500 paying betas by Q2 2027',                risks: 'XGS-PON CPE supply',                                  betaSignups: 502, betaNps: 92, eta: 'Q1 2027' },
  { id: 'R02', title: 'Wi-Fi 6 Pro router refresh',          status: 'Now',   theme: 'Network',    squad: 'BB',      okr: 'Wi-Fi quality',        invest: 'BSD 8.6M / 12 hd / FY26', confidence: 'Committed',  evidence: 'NPS uplift +8pp in pilot · 3% truck-roll reduction',  successMetric: 'Roll out to 20K households by Q4 2027',         risks: 'Component shortage',                                  eta: 'Q2 2027' },
  { id: 'R03', title: 'AI Bill Explainer (MyREV app)',   status: 'Now',   theme: 'AI',         squad: 'Apps',    okr: 'Care deflection',      invest: 'BSD 480K / 3 hd / Q3',    confidence: 'Likely',     evidence: '24% of first-bill calls = "what is this charge"', successMetric: '−15% bill-related calls',                       risks: 'Hallucination on edge cases — RAG only',              eta: 'Q2 2027' },
  { id: 'R04', title: 'eSIM-only mobile activation (<60s)',    status: 'Next',  theme: 'Mobile',     squad: 'Mobile',  okr: 'Mobile attach',        invest: 'BSD 1.2M / 5 hd / Q4',    confidence: 'Committed',  evidence: 'Cable Bahamas eSIM API GA · 38% of new iPhones eSIM-capable', successMetric: 'eSIM = 25% of new mobile activations Q3 2027', risks: 'BSS provisioning latency',                            eta: 'Q3 2027' },
  { id: 'R05', title: 'REVTV 4K Plus (premium streaming)',status: 'Next',  theme: 'TV',        squad: 'TV',      okr: 'TV pivot to streaming',invest: 'BSD 3.1M / 8 hd / Q4',    confidence: 'Likely',     evidence: 'TV Total NPS 38 · Sports add-on growing in market',  successMetric: '60K subs in first 12 months',                  risks: 'Cannibalisation of TV Total',                         eta: 'Q3 2027' },
  { id: 'R06', title: 'REVConnect+ multi-line mobile',       status: 'Next',  theme: 'Mobile',     squad: 'Bundles', okr: 'Bundle uplift',        invest: 'BSD 1.8M / 4 hd / Q4',    confidence: 'Likely',     evidence: '32% of REVConnect customers asked for "additional lines"', successMetric: 'Avg 2.3 mobile lines per REVConnect HH',           risks: 'Margin compression on additional lines',              eta: 'Q4 2027' },
  { id: 'R07', title: 'Save-offer ML personalisation',         status: 'Next',  theme: 'AI',         squad: 'Apps',    okr: 'Save rate',            invest: 'BSD 720K / 4 hd / Q4',    confidence: 'Committed',  evidence: 'Pilot save-rate +6pp on 12K calls · BSD 4.2M LTV impact', successMetric: 'Save-rate 38% → 44% by Q4 2027',           risks: 'Bias in offer assignment',                            eta: 'Q3 2027' },
  { id: 'R08', title: 'Cable Bahamas Home', status: 'Later', theme: 'Smart Home', squad: 'BB',      okr: 'Adjacency revenue',    invest: 'BSD 4.8M / 14 hd / FY27', confidence: 'Exploratory',evidence: '14 customer interviews · 22% intent at BSD 15/mo',    successMetric: '5K households Y1 · BSD 75K MRR',                          risks: 'Adjacency commodity (ADT, Tyco, BTC SmartHome)', eta: 'H1 2028' },
  { id: 'R09', title: 'IPTV en app (cordless TV)',             status: 'Later', theme: 'TV',         squad: 'TV',      okr: 'TV pivot to streaming',invest: 'BSD 2.4M / 6 hd / FY27', confidence: 'Exploratory',evidence: 'REVTV Box EOL 2027 · streaming-first cohort grows', successMetric: 'TV-only subs without STB: 30K Y1',         risks: 'Sports add-on parity',                              eta: 'H1 2028' },
  { id: 'R10', title: 'Carbon dashboard for customers',        status: 'Later', theme: 'Apps',       squad: 'Apps',    okr: 'ESG / Brand',          invest: 'BSD 280K / 2 hd / FY27', confidence: 'Exploratory',evidence: 'Cable Bahamas Group ESG mandate · sustainability reporting',     successMetric: 'Brand NPS +3pp · sustainability reporting',             risks: 'Data accuracy',                                       eta: 'H1 2028' },
  { id: 'R11', title: 'API marketplace for B2B partners',      status: 'Later', theme: 'Network',    squad: 'BB',      okr: 'B2B revenue',          invest: 'BSD 3.6M / 9 hd / FY27', confidence: 'Exploratory',evidence: 'BTC, Rival ISP A have public APIs · 18 partner asks', successMetric: 'BSD 4M ARR Y1',                                  risks: 'PSD2/CBOB IT risk compliance',                                eta: '2028' },
  { id: 'R12', title: 'WiFi 7 mesh extender retail',           status: 'Later', theme: 'Network',    squad: 'BB',      okr: 'Wi-Fi quality',        invest: 'BSD 1.2M / 3 hd / Q1',   confidence: 'Likely',     evidence: 'Mesh take-rate 22% → mesh wanted by 2-floor HHs',  successMetric: '15% attach to BB+',                            risks: 'Cannibalises Smart Mesh',                             eta: 'Q3 2027' },
  { id: 'R13', title: 'Fixed-wireless 5G fallback',            status: 'Later', theme: 'Network',    squad: 'BB',      okr: 'Reliability',          invest: 'BSD 2.0M / 6 hd / FY27', confidence: 'Exploratory',evidence: '4.2K outages/yr · NPS hit on outage',              successMetric: '<8min average outage perceived',               risks: 'RAN dependency',                                      eta: 'H1 2028' },
  { id: 'R14', title: 'Personalised pricing offers',           status: 'Later', theme: 'AI',         squad: 'Apps',    okr: 'Yield management',     invest: 'BSD 640K / 3 hd / FY27', confidence: 'Exploratory',evidence: 'UC1 elasticity model · BSD 3.4M EBITDA upside in sim',successMetric: '+BSD 2M annualised yield',                        risks: 'URCA regulator scrutiny',                             eta: 'H1 2028' },
]

export const shipped = [
  { q: 'Q4 2026', title: 'Cable Bahamas Wi-Fi Guarantee (BSD 150 credit)', metric: '38% take-rate · NPS 72 · −1.4pp churn',     outcome: 'beat plan' },
  { q: 'Q4 2026', title: 'MyREV app v9 (Snowflake-backed)', metric: 'MAU 62K (+9.4%) · D7 retention 64%',     outcome: 'on plan' },
  { q: 'Q3 2026', title: 'Caribbean Sports package add-on',          metric: '6% take · NPS 44 · +BSD 1.2M MRR',             outcome: 'on plan' },
  { q: 'Q3 2026', title: '10 Gb Fibre commercial launch', metric: '2% take · NPS 52 · +BSD 840K MRR',             outcome: 'beat plan' },
]

// -------------------------------------------------------------------------
// Voice of Customer
// -------------------------------------------------------------------------
export type Complaint = {
  theme: string
  volume: number       // monthly
  costToServe: number  // BSD /mo
  trend: number        // %
  cat: string
}
export const complaints: Complaint[] = [
  { theme: 'Wi-Fi dead-spot in 2nd floor / garden',       volume: 8400, costToServe: 19.6, trend: -8,  cat: 'Quality' },
  { theme: 'Bill higher than expected',                   volume: 6200, costToServe: 12.4, trend: -22, cat: 'Billing' },
  { theme: 'Streaming buffering / TV freeze',             volume: 4900, costToServe: 22.8, trend: -14, cat: 'Quality' },
  { theme: 'Cancel — switching to BTC / Rival ISP A', volume: 3800, costToServe: 38.5, trend: 4,   cat: 'Retention' },
  { theme: 'Mobile signal indoors',                       volume: 3100, costToServe: 16.5, trend: -2,  cat: 'Mobile' },
  { theme: 'App login / password reset',                  volume: 2700, costToServe: 4.2,  trend: -42, cat: 'Apps' },
  { theme: 'Install / appointment missed',                volume: 1900, costToServe: 64.0, trend: -18, cat: 'Install' },
  { theme: 'Sports add-on / ESPN not working',           volume: 1600, costToServe: 22.5, trend: 18,  cat: 'Content' },
  { theme: 'One mobile not added to bundle',              volume: 1100, costToServe: 14.5, trend: -28, cat: 'Bundle' },
  { theme: 'Out-of-contract price jump',                  volume: 980,  costToServe: 28.0, trend: 12,  cat: 'Pricing' },
]

export type FeatureRequest = {
  title: string
  votes: number
  cat: string
  status: 'Triaged' | 'Discovery' | 'Building' | 'Beta' | 'Shipped' | 'Won\'t do'
  squad: string
}
export const featureRequests: FeatureRequest[] = [
  { title: '4K HDR on all Sports add-on · Sports package games',                 votes: 4820, cat: 'TV',       status: 'Building',  squad: 'TV' },
  { title: 'Offline downloads in MyREV app',                    votes: 3640, cat: 'Apps',     status: 'Discovery', squad: 'Apps' },
  { title: 'Pause Wi-Fi for kids by device',                          votes: 3120, cat: 'Network',  status: 'Beta',      squad: 'BB' },
  { title: 'Multi-room TV without extra box',                         votes: 2980, cat: 'TV',       status: 'Discovery', squad: 'TV' },
  { title: 'eSIM activation in app',                                  votes: 2840, cat: 'Mobile',   status: 'Building',  squad: 'Mobile' },
  { title: 'Bill split between flatmates',                            votes: 2440, cat: 'Billing',  status: 'Triaged',   squad: 'Apps' },
  { title: 'Smart-home camera bundle',                                votes: 2280, cat: 'Adj',      status: 'Discovery', squad: 'BB' },
  { title: 'Voice assistant in Streaming TV remote',                  votes: 1960, cat: 'TV',       status: 'Triaged',   squad: 'TV' },
  { title: 'Per-channel parental controls',                           votes: 1740, cat: 'TV',       status: 'Shipped',   squad: 'TV' },
  { title: 'Apple Watch eSIM',                                        votes: 1620, cat: 'Mobile',   status: 'Triaged',   squad: 'Mobile' },
]

export type ChurnReason = { reason: string; pct: number }
export const churnReasons: ChurnReason[] = [
  { reason: 'Price (out-of-contract jump)', pct: 32 },
  { reason: 'Switched to BTC',         pct: 18 },
  { reason: 'Switched to Rival ISP A',           pct: 14 },
  { reason: 'Moved house — no service',     pct: 12 },
  { reason: 'Quality / outage frustration', pct: 11 },
  { reason: 'Switched to Rival ISP B/Rival ISP C',   pct: 7 },
  { reason: 'Bereavement / hardship',       pct: 4 },
  { reason: 'Other / unknown',              pct: 2 },
]

// NPS series 12 months
export const npsSeries = [
  { m: 'Jun-25', portfolio: 28, app: 42, install: 22, support: 18 },
  { m: 'Jul-25', portfolio: 30, app: 44, install: 24, support: 20 },
  { m: 'Aug-25', portfolio: 30, app: 46, install: 28, support: 22 },
  { m: 'Sep-25', portfolio: 32, app: 48, install: 30, support: 24 },
  { m: 'Oct-25', portfolio: 34, app: 50, install: 32, support: 26 },
  { m: 'Nov-25', portfolio: 33, app: 52, install: 30, support: 28 },
  { m: 'Dec-25', portfolio: 35, app: 54, install: 28, support: 30 },
  { m: 'Jan-26', portfolio: 36, app: 56, install: 32, support: 32 },
  { m: 'Feb-26', portfolio: 38, app: 58, install: 34, support: 34 },
  { m: 'Mar-26', portfolio: 40, app: 60, install: 38, support: 36 },
  { m: 'Apr-26', portfolio: 42, app: 62, install: 40, support: 38 },
  { m: 'May-26', portfolio: 44, app: 64, install: 42, support: 40 },
]

// -------------------------------------------------------------------------
// Engagement
// -------------------------------------------------------------------------
export const dauMauSeries = Array.from({ length: 90 }, (_, i) => ({
  day: i + 1,
  DAU: Math.round(180_000 + i * 600 + Math.sin(i / 3) * 8000),
  WAU: Math.round(420_000 + i * 1200 + Math.sin(i / 3) * 12000),
  MAU: Math.round(580_000 + i * 1400 + Math.sin(i / 30) * 6000),
}))

export const retentionCurves = [
  { day: 'D0',  value: 100 },
  { day: 'D1',  value: 78  },
  { day: 'D7',  value: 64  },
  { day: 'D14', value: 56  },
  { day: 'D30', value: 48  },
  { day: 'D60', value: 42  },
  { day: 'D90', value: 38  },
]

export const featureUsage = [
  { feature: 'Bill view',          new: 92, mature: 88, decline: 76 },
  { feature: 'Pay bill',           new: 78, mature: 82, decline: 80 },
  { feature: 'Channel guide',      new: 56, mature: 70, decline: 84 },
  { feature: 'Restart router',     new: 42, mature: 38, decline: 32 },
  { feature: 'Outage check',       new: 28, mature: 32, decline: 36 },
  { feature: 'Live chat',          new: 22, mature: 24, decline: 28 },
  { feature: 'Add-on upsell',      new: 18, mature: 14, decline: 10 },
  { feature: 'Wi-Fi controls',     new: 38, mature: 32, decline: 22 },
  { feature: 'Mobile usage',       new: 64, mature: 56, decline: 48 },
]

export const tileClicks = [
  { tile: 'My bill',           clicks: 184_000 },
  { tile: 'Channels',          clicks: 142_000 },
  { tile: 'Wi-Fi',             clicks: 124_000 },
  { tile: 'Mobile',            clicks: 92_000  },
  { tile: 'Restart router',    clicks: 86_000  },
  { tile: 'Add-ons',           clicks: 38_000  },
  { tile: 'Help',              clicks: 32_000  },
  { tile: 'Switch to REVConnect',    clicks: 28_000  },
]

export const tvHoursByGenre = [
  { genre: 'Sports',    Live: 42, VOD: 12 },
  { genre: 'Drama',     Live: 18, VOD: 28 },
  { genre: 'News',      Live: 22, VOD: 4  },
  { genre: 'Movies',    Live: 8,  VOD: 22 },
  { genre: 'Kids',      Live: 12, VOD: 14 },
  { genre: 'Reality',   Live: 14, VOD: 6  },
  { genre: 'Docs',      Live: 4,  VOD: 8  },
]

// -------------------------------------------------------------------------
// Competitive
// -------------------------------------------------------------------------
export type ParityRow = {
  feature: string
  cablebahamas: 'yes' | 'beta' | 'no' | 'lead'
  btc: 'yes' | 'beta' | 'no' | 'lead'
  orange: 'yes' | 'beta' | 'no' | 'lead'
  voo: 'yes' | 'beta' | 'no' | 'lead'
  digi: 'yes' | 'beta' | 'no' | 'lead'
}
export const parityMatrix: ParityRow[] = [
  { feature: '10 Gb fibre',               cablebahamas: 'lead', btc: 'beta', orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: '2 Gb fibre',                cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'beta', digi: 'no'  },
  { feature: '1 Gb fibre',                cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'yes' },
  { feature: 'Wi-Fi 7 router',            cablebahamas: 'lead', btc: 'no',   orange: 'no',   voo: 'beta', digi: 'no'  },
  { feature: 'Wi-Fi guarantee',           cablebahamas: 'lead', btc: 'no',   orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'Streaming TV (no STB)',     cablebahamas: 'yes',  btc: 'lead', orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'Sports package inclusion',         cablebahamas: 'yes',  btc: 'lead', orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'Netflix carrier billing',   cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'no'  },
  { feature: 'eSIM activation',           cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'lead'},
  { feature: 'Unlimited 5G mobile',       cablebahamas: 'lead', btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'yes' },
  { feature: 'Multi-line mobile',         cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'lead'},
  { feature: 'Bundle (One Total)',        cablebahamas: 'lead', btc: 'yes',  orange: 'yes',  voo: 'beta', digi: 'no'  },
  { feature: '24-mo contract option',     cablebahamas: 'yes',  btc: 'yes',  orange: 'yes',  voo: 'yes',  digi: 'yes' },
  { feature: 'Cable Bahamas Home',  cablebahamas: 'yes',  btc: 'beta', orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'AI bill explainer',         cablebahamas: 'beta', btc: 'no',   orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'Carbon dashboard',          cablebahamas: 'no',   btc: 'no',   orange: 'no',   voo: 'no',   digi: 'no'  },
  { feature: 'B2B API marketplace',       cablebahamas: 'yes',  btc: 'yes',  orange: 'beta', voo: 'no',   digi: 'no'  },
  { feature: 'Fixed-wireless 5G',         cablebahamas: 'yes',  btc: 'no',   orange: 'yes',  voo: 'lead', digi: 'lead'},
]

export const competitorMoves = [
  { date: '2026-10-12', who: 'BTC', move: 'Sports add-on price increase 4.4% (CPI+3.9)' },
  { date: '2026-10-04', who: 'Rival ISP A',   move: 'Rival ISP A Love Total BSD 15/mo discount 12 months' },
  { date: '2026-09-28', who: 'Rival ISP B', move: 'Rival ISP B 1 Gb fibre launched in Eleuthera' },
  { date: '2026-09-20', who: 'Rival ISP B',     move: 'Multi-line family plan (4 SIMs BSD 40)' },
  { date: '2026-09-10', who: 'BTC', move: 'Sports add-on Sports package + Champions BSD 35/mo bundle' },
]

// -------------------------------------------------------------------------
// Experiments
// -------------------------------------------------------------------------
export type Experiment = {
  id: string
  hypothesis: string
  surface: string
  status: 'Running' | 'Won' | 'Lost' | 'Inconclusive' | 'Shipped'
  variantUplift: number   // % vs control
  pValue: number
  n: number
  eta: string
  squad: string
}
export const experiments: Experiment[] = [
  { id: 'EXP-241', hypothesis: 'Showing LTV/CAC ratio in upsell card increases bundle conversion',         surface: 'MyREV upsell',  status: 'Running',      variantUplift: 4.2,  pValue: 0.08, n: 18400, eta: '2026-11-12', squad: 'Apps' },
  { id: 'EXP-238', hypothesis: 'BSD 15 off 6mo retention save outperforms speed-upgrade for BB-only churn',  surface: 'Outbound retention', status: 'Won',          variantUplift: 6.8,  pValue: 0.01, n: 12200, eta: 'Shipped',     squad: 'Apps' },
  { id: 'EXP-236', hypothesis: 'Promo end-date countdown banner reduces M7 churn cliff',                  surface: 'MyREV home',     status: 'Running',      variantUplift: 2.4,  pValue: 0.14, n: 24800, eta: '2026-11-22', squad: 'Apps' },
  { id: 'EXP-234', hypothesis: 'AI-generated bill summary lowers bill-related calls',                     surface: 'MyREV bill',     status: 'Running',      variantUplift: 12.5, pValue: 0.00, n:  8400, eta: '2026-11-04', squad: 'Apps' },
  { id: 'EXP-231', hypothesis: 'REVConnect cross-sell on mobile-only customers via in-app',             surface: 'Mobile app',          status: 'Won',          variantUplift: 8.4,  pValue: 0.00, n: 16200, eta: 'Shipped',     squad: 'Bundles' },
  { id: 'EXP-228', hypothesis: 'Smart Mesh upsell at install time vs M30',                                surface: 'Order flow',          status: 'Won',          variantUplift: 22,   pValue: 0.00, n:  7400, eta: 'Shipped',     squad: 'BB' },
  { id: 'EXP-225', hypothesis: 'Sports add-on · Sports package trial week as save offer beats BSD 5 off',               surface: 'Outbound retention', status: 'Lost',         variantUplift: -2.4, pValue: 0.04, n:  9200, eta: 'Stopped',    squad: 'TV' },
  { id: 'EXP-222', hypothesis: 'Reordering channel tiles by usage increases tile CTR',                    surface: 'TV remote app',      status: 'Inconclusive', variantUplift: 0.6,  pValue: 0.42, n: 12800, eta: 'Stopped',    squad: 'TV' },
  { id: 'EXP-218', hypothesis: 'Free 1-mo Max for first-bill shock recovery',                         surface: 'Outbound NPS',        status: 'Won',          variantUplift: 11.2, pValue: 0.00, n:  4400, eta: 'Shipped',     squad: 'TV' },
  { id: 'EXP-215', hypothesis: 'Carbon estimate on bill reduces churn 0.3pp',                             surface: 'MyREV bill',     status: 'Running',      variantUplift: 0.4,  pValue: 0.32, n: 18800, eta: '2026-12-10', squad: 'Apps' },
]

export const betaProgram = [
  { name: '10 Gb Fibre Beta',          signups: 502,  active: 410, nps: 92, defectRate: 1.2, eta: 'Q1 2027' },
  { name: 'eSIM <60s Beta',            signups: 8400, active: 6900, nps: 78, defectRate: 0.8, eta: 'Q3 2027' },
  { name: 'Cable Bahamas Home Pilot',      signups: 312,  active: 224, nps: 64, defectRate: 4.4, eta: 'Q2 2027' },
  { name: 'AI Bill Explainer Beta',    signups: 2800, active: 2400, nps: 72, defectRate: 0.4, eta: 'Q2 2027' },
  { name: 'One+ multi-line Pilot',     signups: 480,  active: 380, nps: 68, defectRate: 1.8, eta: 'Q4 2027' },
]

export const discoveryFunnel = [
  { stage: 'Idea backlog',  count: 64 },
  { stage: 'Discovery',     count: 22 },
  { stage: 'Prototype',     count: 14 },
  { stage: 'Beta',          count: 5  },
  { stage: 'Shipped',       count: 4  },
]

// -------------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------------
export const lifecycleColor: Record<LifecycleStage, string> = {
  Intro: '#3b82f6', Growth: '#10b981', Mature: '#f59e0b', Decline: '#dc2626',
}

export const cannibFlows = [
  { from: 'BB_600',    to: 'BB_1G',     subs: 1840 },
  { from: 'BB_1G',     to: 'BB_2G',     subs: 920  },
  { from: 'BB_2G',     to: 'BB_10G',    subs: 320  },
  { from: 'TV_BOX',    to: 'TV_TOTAL',  subs: 4400 },
  { from: 'TV_BOX',    to: 'TV_ESEN',   subs: 2200 },
  { from: 'BB_300',    to: 'BB_600',    subs: 980  },
  { from: 'MOB_25',    to: 'MOB_60',    subs: 1640 },
  { from: 'MOB_60',    to: 'MOB_150',   subs: 820  },
  { from: 'MOB_150',   to: 'MOB_UNL',   subs: 380  },
  { from: 'FIJO',      to: 'BB_600',    subs: 540  },
]

// =============================================================================
// SKU 360 — drill-down details (synth, deterministic per SKU)
// =============================================================================
export type SkuDetails = {
  sku: SKU
  totalSubs: number
  newThisQtr: number
  realisedArpu: number
  yieldPct: number
  monthlyContrib: number
  annualContrib: number
  ltvCac: number
  byRegion:    { region: string;  subs: number; arpu: number; nps: number }[]
  byChannel:   { channel: string; subs: number; cac: number;  conv: number }[]
  byTenure:    { bucket: string;  subs: number; arpu: number; churn: number }[]
  byValueTier: { tier: string;    subs: number; arpu: number }[]
  byAge:       { bucket: string;  subs: number }[]
  byHHType:    { type: string;    subs: number }[]
  acquisitionTrend: { month: string; gross: number; churn: number; net: number }[]
  cohortSurvival: { month: number; v2024: number; v2025: number; v2026: number }[]
  attach:    { addon: string; rate: number; impact: string }[]
  upsellPath:{ from: string; to: string; convPct: number }[]
  funnel:    { stage: string; count: number; conv: number }[]
  pnl:       { line: string; value: number; type: 'add' | 'sub' | 'total' }[]
  ticketsBy: { topic: string; volume: number; cost: number; trend: number }[]
  competitorEquiv: { competitor: string; product: string; price: number; gap: number; note: string }[]
  relatedRoadmap: string[]
  flags: { kind: 'price' | 'churn' | 'content' | 'tech' | 'reg' | 'comp'; msg: string; severity: 'info' | 'warn' | 'crit' }[]
}

// deterministic seedable PRNG (mulberry32)
function hashCode(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSkuDetails(sku: SKU): SkuDetails {
  const r = mulberry32(hashCode(sku.code))
  const rand = (lo: number, hi: number) => lo + (hi - lo) * r()
  const intRand = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1))

  // Total subs from take rate × The Bahamas HHs (~ 13.6M Cable Bahamas base)
  const totalSubs = Math.round((sku.take / 100) * 180_500 * (0.85 + r() * 0.3))
  const newThisQtr = Math.round(totalSubs * (sku.trend > 0 ? sku.trend / 200 : 0.01) + intRand(200, 1200))
  const realisedArpu = +(sku.mrr * (0.78 + r() * 0.18)).toFixed(1)
  const yieldPct = +((realisedArpu / sku.mrr) * 100).toFixed(1)
  const monthlyContrib = +(realisedArpu * sku.gmPct / 100).toFixed(1)
  const annualContrib = +(monthlyContrib * 12 - sku.cac).toFixed(0)
  const ltvCac = +(sku.ltv / Math.max(1, sku.cac)).toFixed(2)

  // Geography — 5 regions with realistic Cable Bahamas skew
  const regionWeights = sku.cat === 'B2B'
    ? [0.55, 0.18, 0.10, 0.07, 0.10]
    : sku.cat === 'Mobile'
    ? [0.42, 0.16, 0.10, 0.18, 0.14]
    : [0.40, 0.18, 0.12, 0.18, 0.12]
  const regions = ['Nassau', 'Freeport', 'Abaco', 'Eleuthera', 'Rest of The Bahamas']
  const byRegion = regions.map((region, i) => ({
    region,
    subs: Math.round(totalSubs * regionWeights[i] * (0.92 + r() * 0.16)),
    arpu: +(realisedArpu * (0.95 + r() * 0.10)).toFixed(1),
    nps: Math.round(sku.nps + (r() - 0.5) * 12),
  }))

  // Channel — Direct/Retail/B2B/Voice/Door-to-door
  const channels = sku.cat === 'B2B'
    ? [{ name: 'B2B partner', w: 0.65 }, { name: 'Digital',  w: 0.18 }, { name: 'Voice',  w: 0.12 }, { name: 'Retail', w: 0.05 }]
    : sku.cat === 'Mobile'
    ? [{ name: 'Digital',     w: 0.52 }, { name: 'Retail',   w: 0.28 }, { name: 'Voice',  w: 0.14 }, { name: 'Door-to-door', w: 0.06 }]
    : [{ name: 'Digital',     w: 0.46 }, { name: 'Retail',   w: 0.22 }, { name: 'Voice',  w: 0.18 }, { name: 'Door-to-door', w: 0.10 }, { name: 'B2B', w: 0.04 }]
  const byChannel = channels.map((c) => ({
    channel: c.name,
    subs: Math.round(totalSubs * c.w * (0.94 + r() * 0.12)),
    cac:  Math.round(sku.cac * (c.name === 'Digital' ? 0.85 : c.name === 'Retail' ? 1.20 : c.name === 'Voice' ? 1.05 : c.name === 'B2B' || c.name === 'B2B partner' ? 0.95 : 1.10)),
    conv: +(rand(2.0, 8.5)).toFixed(1),
  }))

  // Tenure
  const tenureWeights = sku.stage === 'Decline' ? [0.06, 0.12, 0.20, 0.62] : sku.stage === 'Intro' ? [0.55, 0.30, 0.12, 0.03] : sku.stage === 'Growth' ? [0.32, 0.28, 0.24, 0.16] : [0.18, 0.20, 0.30, 0.32]
  const byTenure = ['0-6m', '6-12m', '12-24m', '24m+'].map((bucket, i) => ({
    bucket,
    subs: Math.round(totalSubs * tenureWeights[i]),
    arpu: +(realisedArpu * (i === 0 ? 0.78 : i === 1 ? 0.86 : i === 2 ? 0.96 : 1.04)).toFixed(1), // out-of-contract pays SVR
    churn: +((sku.churnPct * (i === 0 ? 0.6 : i === 1 ? 1.0 : i === 2 ? 1.6 : 1.2))).toFixed(2),
  }))

  // Value tier
  const byValueTier = [
    { tier: 'Prime',      subs: Math.round(totalSubs * (sku.cat === 'B2B' ? 0.55 : 0.32)), arpu: +(realisedArpu * 1.18).toFixed(1) },
    { tier: 'Mass',       subs: Math.round(totalSubs * 0.58), arpu: realisedArpu },
    { tier: 'Vulnerable', subs: Math.round(totalSubs * 0.10), arpu: +(realisedArpu * 0.72).toFixed(1) },
  ]

  // Age band
  const ageWeights = sku.cat === 'Mobile' ? [0.18, 0.28, 0.22, 0.16, 0.10, 0.06] : sku.cat === 'TV' ? [0.06, 0.14, 0.20, 0.24, 0.22, 0.14] : [0.08, 0.20, 0.24, 0.22, 0.16, 0.10]
  const byAge = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((bucket, i) => ({ bucket, subs: Math.round(totalSubs * ageWeights[i]) }))

  // Household type
  const byHHType = [
    { type: 'Single',  subs: Math.round(totalSubs * 0.28) },
    { type: 'Couple',  subs: Math.round(totalSubs * 0.30) },
    { type: 'Family',  subs: Math.round(totalSubs * 0.32) },
    { type: 'Sharers', subs: Math.round(totalSubs * 0.10) },
  ]

  // 24-month acquisition trend
  const acquisitionTrend: { month: string; gross: number; churn: number; net: number }[] = []
  const months = ['Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24','Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26']
  for (let i = 0; i < 24; i++) {
    const baseGross = totalSubs * 0.018 * (1 + sku.trend / 100 * (i / 24))
    const baseChurn = totalSubs * sku.churnPct / 100
    const noise = 0.85 + r() * 0.30
    const gross = Math.round(baseGross * noise)
    const churn = Math.round(baseChurn * (0.85 + r() * 0.30))
    acquisitionTrend.push({ month: months[i], gross, churn, net: gross - churn })
  }

  // Cohort survival (Weibull-ish, 3 vintages)
  const cohortSurvival: { month: number; v2024: number; v2025: number; v2026: number }[] = []
  for (let m = 0; m <= 24; m++) {
    const lambda = sku.churnPct / 100
    const k = 0.85
    const s = (vintageAge: number) => Math.max(0, Math.min(100, 100 * Math.exp(-Math.pow(lambda * (m + vintageAge / 4), k)) * (1 - (m === 7 ? 0.04 : 0))))
    cohortSurvival.push({ month: m, v2024: +s(8).toFixed(1), v2025: +s(4).toFixed(1), v2026: +s(0).toFixed(1) })
  }

  // Attach (depends on category)
  const attach = sku.cat === 'Broadband'
    ? [
        { addon: 'REV WiFi Booster (3-pack)',     rate: +(rand(18, 32)).toFixed(0), impact: '+BSD 8 MRR · −0.4pp churn' },
        { addon: 'Cable Bahamas Wi-Fi Guarantee',       rate: +(rand(28, 44)).toFixed(0), impact: '+0pp MRR · NPS +12' },
        { addon: 'REVTV',                rate: +(rand(12, 22)).toFixed(0), impact: '+BSD 35 MRR · −0.3pp churn' },
        { addon: 'aliv Mobile attach',             rate: +(rand(10, 24)).toFixed(0), impact: '+BSD 25 MRR · −0.5pp churn (REVConnect)' },
      ]
    : sku.cat === 'TV'
    ? [
        { addon: 'Sports add-on · Sports package',          rate: +(rand(20, 38)).toFixed(0), impact: '+BSD 30 MRR · NPS +18' },
        { addon: 'Max + Disney+',            rate: +(rand(14, 26)).toFixed(0), impact: '+BSD 15 MRR' },
        { addon: 'Caribbean Sports package + ESPN',     rate: +(rand(8, 18)).toFixed(0),  impact: '+BSD 20 MRR' },
        { addon: 'Multi-room',                   rate: +(rand(6, 12)).toFixed(0),  impact: '+BSD 10 MRR' },
      ]
    : sku.cat === 'Mobile'
    ? [
        { addon: 'eSIM secondary line',          rate: +(rand(8, 18)).toFixed(0),  impact: '+BSD 12 MRR' },
        { addon: 'International roaming pack',   rate: +(rand(14, 26)).toFixed(0), impact: '+BSD 8 MRR seasonal' },
        { addon: 'Apple Watch eSIM',             rate: +(rand(3, 8)).toFixed(0),   impact: '+BSD 5 MRR' },
      ]
    : [
        { addon: 'Smart Mesh',                   rate: +(rand(20, 30)).toFixed(0), impact: '+BSD 8 MRR' },
        { addon: 'Multi-room TV',                rate: +(rand(12, 22)).toFixed(0), impact: '+BSD 10 MRR' },
        { addon: 'eSIM secondary line',          rate: +(rand(10, 18)).toFixed(0), impact: '+BSD 12 MRR' },
      ]

  // Upsell path
  const upsellPath = sku.cat === 'Broadband' && sku.code !== 'BB_10G'
    ? [
        { from: sku.code, to: 'BB_2G',     convPct: +(rand(4, 9)).toFixed(1) },
        { from: sku.code, to: 'REVConnect',       convPct: +(rand(8, 14)).toFixed(1) },
        { from: sku.code, to: 'BIT',       convPct: +(rand(6, 12)).toFixed(1) },
        { from: sku.code, to: 'ONE_TOTAL', convPct: +(rand(2, 5)).toFixed(1) },
      ]
    : sku.cat === 'Mobile' && sku.code !== 'MOB_UNL'
    ? [
        { from: sku.code, to: 'MOB_UNL',   convPct: +(rand(4, 8)).toFixed(1) },
        { from: sku.code, to: 'REVConnect',       convPct: +(rand(6, 12)).toFixed(1) },
      ]
    : sku.cat === 'TV'
    ? [
        { from: sku.code, to: 'BB_TV_LIGA', convPct: +(rand(3, 8)).toFixed(1) },
        { from: sku.code, to: 'ONE_TOTAL',  convPct: +(rand(2, 5)).toFixed(1) },
      ]
    : [
        { from: sku.code, to: 'ONE_TOTAL',  convPct: +(rand(3, 7)).toFixed(1) },
      ]

  // Funnel
  const baseImpressions = totalSubs * (4 + r() * 6)
  const funnelRaw = [
    { stage: 'Impression',  count: Math.round(baseImpressions) },
    { stage: 'PDP view',    count: Math.round(baseImpressions * (0.18 + r() * 0.06)) },
    { stage: 'Cart add',    count: Math.round(baseImpressions * (0.06 + r() * 0.02)) },
    { stage: 'Order',       count: Math.round(baseImpressions * (0.025 + r() * 0.01)) },
    { stage: 'Activated',   count: Math.round(baseImpressions * (0.022 + r() * 0.008)) },
  ]
  const funnel = funnelRaw.map((f, i) => ({ ...f, conv: i === 0 ? 100 : +((f.count / funnelRaw[i - 1].count) * 100).toFixed(1) }))

  // P&L per sub
  const cogs = +(realisedArpu * (1 - sku.gmPct / 100) * 0.55).toFixed(1)
  const care = +(realisedArpu * 0.05).toFixed(1)
  const content = sku.cat === 'TV' || sku.cat === 'Bundle' ? +(realisedArpu * 0.18).toFixed(1) : 0
  const cacAmort = +(sku.cac / 24).toFixed(1)
  const cpeAmort = +(sku.cat === 'Broadband' ? 3.5 : sku.cat === 'TV' ? 4.0 : sku.cat === 'Bundle' ? 5.5 : 0.0)
  const margin = +(realisedArpu - cogs - care - content - cacAmort - cpeAmort).toFixed(1)
  const pnl: SkuDetails['pnl'] = [
    { line: 'List ARPU',     value: sku.mrr,         type: 'add' },
    { line: 'Promo amort',   value: -+(sku.mrr - realisedArpu).toFixed(1), type: 'sub' },
    { line: 'Realised ARPU', value: realisedArpu,    type: 'total' },
    { line: 'COGS',          value: -cogs,           type: 'sub' },
    { line: 'Care',          value: -care,           type: 'sub' },
    ...(content > 0 ? [{ line: 'Content', value: -content, type: 'sub' as const }] : []),
    { line: 'CAC amort',     value: -cacAmort,       type: 'sub' },
    ...(cpeAmort > 0 ? [{ line: 'CPE amort', value: -cpeAmort, type: 'sub' as const }] : []),
    { line: 'Contribution',  value: margin,          type: 'total' },
  ]

  // Tickets by topic
  const ticketsBy = sku.cat === 'Broadband'
    ? [
        { topic: 'Wi-Fi dead-spot / 2nd floor',     volume: intRand(800, 2400), cost: 19.6, trend: -8 },
        { topic: 'Speed below advertised',          volume: intRand(400, 1200), cost: 22.4, trend: -4 },
        { topic: 'Outage / no service',             volume: intRand(200, 800),  cost: 32.0, trend: -2 },
        { topic: 'Bill higher than expected',       volume: intRand(300, 900),  cost: 12.4, trend: -22 },
        { topic: 'Out-of-contract price jump',      volume: intRand(120, 380),  cost: 28.0, trend: 12 },
      ]
    : sku.cat === 'TV'
    ? [
        { topic: 'Streaming buffering / freeze',    volume: intRand(800, 2200), cost: 22.8, trend: -14 },
        { topic: 'Sports add-on / ESPN not working', volume: intRand(200, 800), cost: 22.5, trend: 18 },
        { topic: 'Channel missing',                 volume: intRand(150, 450),  cost: 14.2, trend: -6 },
        { topic: 'Remote / box restart',            volume: intRand(140, 420),  cost: 9.5,  trend: 0 },
      ]
    : sku.cat === 'Mobile'
    ? [
        { topic: 'Mobile signal indoors',           volume: intRand(400, 1400), cost: 16.5, trend: -2 },
        { topic: 'eSIM activation',                 volume: intRand(150, 500),  cost: 11.0, trend: -28 },
        { topic: 'Roaming charges',                 volume: intRand(80, 300),   cost: 18.4, trend: -8 },
      ]
    : [
        { topic: 'One mobile not added to bundle',  volume: intRand(80, 380),   cost: 14.5, trend: -28 },
        { topic: 'Bundle install / appointment',    volume: intRand(120, 480),  cost: 64.0, trend: -18 },
        { topic: 'Wi-Fi + TV bundling complaints',  volume: intRand(80, 300),   cost: 22.4, trend: -10 },
      ]

  // Competitor equivalent
  const baseMov = sku.mrr + intRand(-5, 8)
  const baseOra = sku.mrr + intRand(-12, 5)
  const baseMM  = sku.mrr + intRand(-8, 6)
  const competitorEquiv: SkuDetails['competitorEquiv'] = []
  if (sku.cat === 'Broadband') {
    competitorEquiv.push(
      { competitor: 'BTC', product: `Flex ${sku.code.includes('600') ? '600 Mb' : sku.code.includes('1G') ? '1 Gb' : sku.code.includes('2G') ? '2 Gb' : sku.code.includes('10G') ? '— (no 10 Gb tier)' : '300 Mb'}`, price: baseMov, gap: baseMov - sku.mrr,  note: sku.code === 'BB_10G' ? 'Cable Bahamas only at 10 Gb tier' : 'Match' },
      { competitor: 'Rival ISP A',   product: `Love Fibre ${sku.code.includes('600') ? '600' : sku.code.includes('1G') ? '1G' : '2G'}`,                                          price: baseOra, gap: baseOra - sku.mrr,  note: 'Match' },
      { competitor: 'Rival ISP B', product: `MM Fibre ${sku.code.includes('1G') ? '1G' : '600'}`,                                                                              price: baseMM,  gap: baseMM - sku.mrr,  note: 'Match' },
    )
  } else if (sku.cat === 'TV') {
    competitorEquiv.push(
      { competitor: 'BTC', product: 'Sports add-on Total', price: 95 + intRand(-5, 10),  gap: 95 - sku.mrr, note: 'BTC leads bundle' },
      { competitor: 'Rival ISP A',   product: 'Rival ISP A TV (180ch)',    price: 49 + intRand(-5, 8),   gap: 49 - sku.mrr, note: 'Cheaper / fewer channels' },
    )
  } else if (sku.cat === 'Mobile') {
    competitorEquiv.push(
      { competitor: 'Rival ISP B',     product: sku.code.includes('UNL') ? 'Rival ISP B Unlimited 5G' : 'Rival ISP B 100GB', price: sku.mrr + intRand(-8, 0), gap: -5, note: 'Rival ISP B leads MNO direct' },
      { competitor: 'Rival ISP A',   product: sku.code.includes('UNL') ? 'Rival ISP A Unlimited' : 'Rival ISP A 100GB', price: sku.mrr + intRand(-2, 6), gap: 2,  note: 'Match' },
      { competitor: 'BTC', product: sku.code.includes('UNL') ? 'BTC Unlimited' : 'BTC 100GB', price: sku.mrr + intRand(-4, 4), gap: 0, note: 'Match' },
    )
  } else if (sku.cat === 'Bundle') {
    competitorEquiv.push(
      { competitor: 'BTC', product: 'BTC Flex Total',  price: sku.mrr + intRand(0, 12),  gap: 6,  note: 'BTC premium' },
      { competitor: 'Rival ISP A',   product: 'Rival ISP A Love Total',      price: sku.mrr + intRand(-15, 0), gap: -8, note: 'Rival ISP A cheapest' },
    )
  } else {
    competitorEquiv.push(
      { competitor: 'BTC', product: 'BTC equivalent', price: sku.mrr + intRand(-3, 5), gap: 1, note: 'Match' },
    )
  }

  // Roadmap items touching this SKU (filter by category/theme)
  const relatedRoadmap: string[] = []
  if (sku.cat === 'Broadband' && sku.mrr >= 80) relatedRoadmap.push('R01', 'R02', 'R12')
  if (sku.cat === 'Broadband') relatedRoadmap.push('R02', 'R13')
  if (sku.cat === 'Mobile') relatedRoadmap.push('R04', 'R06')
  if (sku.cat === 'TV') relatedRoadmap.push('R05', 'R09')
  if (sku.cat === 'Bundle') relatedRoadmap.push('R06', 'R07')
  if (sku.code === 'BB_10G') relatedRoadmap.push('R01')
  if (sku.cat === 'Add-on' && sku.code === 'WIFI_MESH') relatedRoadmap.push('R12')

  // Risk flags (auto-generated)
  const flags: SkuDetails['flags'] = []
  if (sku.churnPct > 1.5) flags.push({ kind: 'churn', severity: 'warn', msg: `Monthly churn ${sku.churnPct.toFixed(1)}% exceeds portfolio benchmark 1.2%` })
  if (yieldPct < 75) flags.push({ kind: 'price', severity: 'warn', msg: `Realised ARPU ${yieldPct.toFixed(0)}% of list — promo dilution heavy` })
  if (yieldPct > 92) flags.push({ kind: 'price', severity: 'info', msg: `High yield ${yieldPct.toFixed(0)}% — limited promo headroom` })
  if (sku.gmPct < 30) flags.push({ kind: 'content', severity: 'crit', msg: `GM ${sku.gmPct}% below 30% floor — content/network costs eroding margin` })
  if (sku.stage === 'Decline') flags.push({ kind: 'tech', severity: 'crit', msg: `${sku.stage} stage — sunset candidate, plan migration to ${sku.cannibPair ?? 'growth SKU'}` })
  const c1 = competitorEquiv[0]
  if (c1 && c1.gap < -8) flags.push({ kind: 'comp', severity: 'warn', msg: `${c1.competitor} undercuts by BSD ${Math.abs(c1.gap)} — defensive risk` })
  const oocPct = byTenure[3]?.subs / Math.max(1, totalSubs)
  if (oocPct > 0.4) flags.push({ kind: 'churn', severity: 'warn', msg: `${(oocPct * 100).toFixed(0)}% of base out-of-contract — engage retention` })
  if (sku.cat === 'TV') flags.push({ kind: 'reg', severity: 'info', msg: `URCA content levy ~0.5% applies to this SKU` })
  if (flags.length === 0) flags.push({ kind: 'price', severity: 'info', msg: 'No material risk flags · SKU operating in healthy range' })

  return {
    sku, totalSubs, newThisQtr, realisedArpu, yieldPct, monthlyContrib, annualContrib, ltvCac,
    byRegion, byChannel, byTenure, byValueTier, byAge, byHHType,
    acquisitionTrend, cohortSurvival, attach, upsellPath, funnel, pnl, ticketsBy, competitorEquiv, relatedRoadmap, flags,
  }
}
