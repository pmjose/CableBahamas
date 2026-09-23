export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  county: string
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Platinum'
  tenureYears: number
  ltv: number
  mrr: number
  churnRisk: 'Low' | 'Medium' | 'High'
  sentiment: number
  status: 'Active' | 'At Risk' | 'New'
  joined: string
  services: { name: string; speed?: string; mrr: number; status: string; since: string }[]
  invoices: { id: string; date: string; amount: number; status: 'Paid' | 'Open' | 'Overdue' }[]
  interactions: { date: string; channel: string; topic: string; sentiment: 'Positive' | 'Neutral' | 'Negative' }[]
  recommendations: { title: string; reason: string; uplift: string; type: 'Upsell' | 'Retention' | 'Upgrade' }[]
}

export const customers: Customer[] = [
  {
    id: 'CBL-100482',
    name: 'Maya Rolle',
    email: 'maya.rolle@example.com',
    phone: '+1 242 555-0100',
    address: '14 Bay Street',
    city: 'Nassau',
    county: 'New Providence',
    tier: 'Platinum',
    tenureYears: 8,
    ltv: 14250,
    mrr: 148,
    churnRisk: 'Low',
    sentiment: 92,
    status: 'Active',
    joined: '2018-03-12',
    services: [
      { name: '1 Gb Fibre', speed: '1 Gb/s', mrr: 40, status: 'Active', since: '2018-03-12' },
      { name: 'REVTV', mrr: 35, status: 'Active', since: '2019-07-01' },
      { name: 'Sports add-on', mrr: 30, status: 'Active', since: '2020-08-14' },
      { name: 'aliv Mobile Unlimited 5G', mrr: 35, status: 'Active', since: '2022-11-15' },
      { name: 'REV WiFi Booster (3-pack)', mrr: 8, status: 'Active', since: '2023-04-20' },
    ],
    invoices: [
      { id: 'INV-92341', date: '2026-05-01', amount: 148, status: 'Paid' },
      { id: 'INV-91802', date: '2026-04-01', amount: 148, status: 'Paid' },
      { id: 'INV-91265', date: '2026-03-01', amount: 148, status: 'Paid' },
      { id: 'INV-90733', date: '2026-02-01', amount: 148, status: 'Paid' },
      { id: 'INV-90221', date: '2026-01-01', amount: 143, status: 'Paid' },
      { id: 'INV-89712', date: '2025-12-01', amount: 143, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-05-10', channel: 'App', topic: 'Speed test request', sentiment: 'Positive' },
      { date: '2026-04-22', channel: 'Chat', topic: 'TV remote setup', sentiment: 'Positive' },
      { date: '2026-03-04', channel: 'Call', topic: 'Annual review', sentiment: 'Positive' },
    ],
    recommendations: [
      { title: 'Upgrade a 2 Gb Fibre', reason: 'Power user, 4+ devices streaming concurrently', uplift: '+BSD 10 MRR', type: 'Upgrade' },
      { title: 'Add second mobile line', reason: 'REVConnect eligible, 35% bundle discount', uplift: '+BSD 25 MRR', type: 'Upsell' },
    ],
  },
  {
    id: 'CBL-100765',
    name: 'Jordan Knowles',
    email: 'jordan.knowles@example.com',
    phone: '+1 242 555-0101',
    address: '28 Coral Road',
    city: 'Freeport',
    county: 'Grand Bahama',
    tier: 'Gold',
    tenureYears: 5,
    ltv: 8420,
    mrr: 95,
    churnRisk: 'Medium',
    sentiment: 64,
    status: 'At Risk',
    joined: '2021-01-08',
    services: [
      { name: '600 Mb Fibre', speed: '600 Mb/s', mrr: 35, status: 'Active', since: '2021-01-08' },
      { name: 'REVTV', mrr: 35, status: 'Active', since: '2021-01-08' },
      { name: 'aliv Mobile 150GB 5G', mrr: 25, status: 'Active', since: '2023-05-20' },
    ],
    invoices: [
      { id: 'INV-92340', date: '2026-05-01', amount: 95, status: 'Paid' },
      { id: 'INV-91801', date: '2026-04-01', amount: 95, status: 'Overdue' },
      { id: 'INV-91264', date: '2026-03-01', amount: 95, status: 'Paid' },
      { id: 'INV-90732', date: '2026-02-01', amount: 95, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-05-15', channel: 'Call', topic: 'Billing dispute', sentiment: 'Negative' },
      { date: '2026-04-30', channel: 'Chat', topic: 'Outage report', sentiment: 'Negative' },
      { date: '2026-04-12', channel: 'Field', topic: 'Wi-Fi extender install', sentiment: 'Neutral' },
    ],
    recommendations: [
      { title: 'Retention offer: BSD 15/mo discount for 6 months', reason: 'Two negative interactions in 30 days', uplift: 'Reduce churn 38%', type: 'Retention' },
      { title: 'Free Wi-Fi 6 Pro upgrade', reason: 'Coverage complaint flagged in field visit', uplift: 'NPS +20', type: 'Retention' },
    ],
  },
  {
    id: 'CBL-101203',
    name: 'Alicia Bethel',
    email: 'alicia.bethel@example.com',
    phone: '+1 242 555-0102',
    address: '7 Harbour Lane',
    city: 'Marsh Harbour',
    county: 'Abaco',
    tier: 'Silver',
    tenureYears: 2,
    ltv: 2880,
    mrr: 55,
    churnRisk: 'Low',
    sentiment: 81,
    status: 'Active',
    joined: '2024-02-18',
    services: [
      { name: '600 Mb Fibre', speed: '600 Mb/s', mrr: 35, status: 'Active', since: '2024-02-18' },
      { name: 'aliv Mobile 60GB', mrr: 20, status: 'Active', since: '2024-02-18' },
    ],
    invoices: [
      { id: 'INV-92339', date: '2026-05-01', amount: 55, status: 'Paid' },
      { id: 'INV-91800', date: '2026-04-01', amount: 55, status: 'Paid' },
      { id: 'INV-91263', date: '2026-03-01', amount: 55, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-05-02', channel: 'App', topic: 'Plan comparison', sentiment: 'Positive' },
    ],
    recommendations: [
      { title: 'Add REVTV Start', reason: 'No TV product, high streaming usage detected', uplift: '+BSD 15 MRR', type: 'Upsell' },
    ],
  },
  {
    id: 'CBL-101977',
    name: 'Daniel Pinder',
    email: 'daniel.pinder@example.com',
    phone: '+1 242 555-0103',
    address: '22 Queen Street',
    city: 'Governors Harbour',
    county: 'Eleuthera',
    tier: 'Bronze',
    tenureYears: 1,
    ltv: 720,
    mrr: 45,
    churnRisk: 'High',
    sentiment: 38,
    status: 'At Risk',
    joined: '2025-04-30',
    services: [
      { name: '300 Mb Fibre', speed: '300 Mb/s', mrr: 30, status: 'Active', since: '2025-04-30' },
      { name: 'aliv Mobile 25GB', mrr: 15, status: 'Active', since: '2025-04-30' },
    ],
    invoices: [
      { id: 'INV-92338', date: '2026-05-01', amount: 45, status: 'Overdue' },
      { id: 'INV-91799', date: '2026-04-01', amount: 45, status: 'Overdue' },
      { id: 'INV-91262', date: '2026-03-01', amount: 45, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-05-18', channel: 'Call', topic: 'Cancellation request', sentiment: 'Negative' },
      { date: '2026-05-05', channel: 'Chat', topic: 'Slow speeds complaint', sentiment: 'Negative' },
    ],
    recommendations: [
      { title: 'Save offer: 50% off 6 months + free upgrade', reason: 'Cancellation flagged, two payments overdue', uplift: 'Reduce churn 65%', type: 'Retention' },
    ],
  },
  {
    id: 'CBL-102540',
    name: 'Simone Bain',
    email: 'simone.bain@example.com',
    phone: '+1 242 555-0104',
    address: '9 Palm Avenue',
    city: 'George Town',
    county: 'Exuma',
    tier: 'Gold',
    tenureYears: 5,
    ltv: 9100,
    mrr: 95,
    churnRisk: 'Low',
    sentiment: 88,
    status: 'Active',
    joined: '2020-06-14',
    services: [
      { name: '1 Gb Fibre', speed: '1 Gb/s', mrr: 40, status: 'Active', since: '2022-08-01' },
      { name: 'REVTV', mrr: 35, status: 'Active', since: '2020-06-14' },
      { name: 'aliv Mobile 60GB', mrr: 20, status: 'Active', since: '2025-01-10' },
    ],
    invoices: [
      { id: 'INV-92337', date: '2026-05-01', amount: 95, status: 'Paid' },
      { id: 'INV-91798', date: '2026-04-01', amount: 95, status: 'Paid' },
      { id: 'INV-91261', date: '2026-03-01', amount: 95, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-05-12', channel: 'App', topic: 'Bill download', sentiment: 'Neutral' },
      { date: '2026-03-22', channel: 'Chat', topic: 'New phone purchase', sentiment: 'Positive' },
    ],
    recommendations: [
      { title: 'Upgrade mobile to Unlimited 5G+', reason: 'Hits 60GB cap monthly', uplift: '+BSD 15 MRR', type: 'Upgrade' },
    ],
  },
  {
    id: 'CBL-102998',
    name: 'Marcus Adderley',
    email: 'marcus.adderley@example.com',
    phone: '+1 242 555-0105',
    address: '31 Eastern Road',
    city: 'Nassau',
    county: 'New Providence',
    tier: 'Silver',
    tenureYears: 3,
    ltv: 4320,
    mrr: 70,
    churnRisk: 'Low',
    sentiment: 76,
    status: 'Active',
    joined: '2023-03-01',
    services: [
      { name: '600 Mb Fibre', speed: '600 Mb/s', mrr: 35, status: 'Active', since: '2023-03-01' },
      { name: 'REVTV Start', mrr: 20, status: 'Active', since: '2023-03-01' },
      { name: 'aliv Mobile 25GB', mrr: 15, status: 'Active', since: '2024-09-12' },
    ],
    invoices: [
      { id: 'INV-92336', date: '2026-05-01', amount: 70, status: 'Paid' },
      { id: 'INV-91797', date: '2026-04-01', amount: 70, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-04-08', channel: 'App', topic: 'Self-care login', sentiment: 'Neutral' },
    ],
    recommendations: [
      { title: 'Upgrade a 1 Gb Fibre', reason: 'Multi-device household', uplift: '+BSD 5 MRR', type: 'Upgrade' },
    ],
  },
  {
    id: 'CBL-103412',
    name: 'Leah Ferguson',
    email: 'leah.ferguson@example.com',
    phone: '+1 242 555-0106',
    address: '12 Seaview Drive',
    city: 'Andros Town',
    county: 'Andros',
    tier: 'Platinum',
    tenureYears: 10,
    ltv: 18750,
    mrr: 180,
    churnRisk: 'Low',
    sentiment: 95,
    status: 'Active',
    joined: '2016-02-20',
    services: [
      { name: '2 Gb Fibre', speed: '2 Gb/s', mrr: 50, status: 'Active', since: '2024-01-15' },
      { name: 'REVTV', mrr: 35, status: 'Active', since: '2016-02-20' },
      { name: 'Sports add-on', mrr: 30, status: 'Active', since: '2017-09-10' },
      { name: 'Max + Disney+', mrr: 15, status: 'Active', since: '2019-04-22' },
      { name: 'aliv Mobile Unlimited 5G ×2', mrr: 50, status: 'Active', since: '2023-04-01' },
      { name: 'Home Phone (unlimited fixed line)', mrr: 0, status: 'Active', since: '2016-02-20' },
    ],
    invoices: [
      { id: 'INV-92335', date: '2026-05-01', amount: 180, status: 'Paid' },
      { id: 'INV-91796', date: '2026-04-01', amount: 180, status: 'Paid' },
      { id: 'INV-91260', date: '2026-03-01', amount: 180, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-04-18', channel: 'Field', topic: 'Wi-Fi 6 Pro install', sentiment: 'Positive' },
    ],
    recommendations: [
      { title: 'Loyalty reward: 2 months free', reason: '10-year anniversary', uplift: 'NPS +30', type: 'Retention' },
    ],
  },
  {
    id: 'CBL-104088',
    name: 'Nathan Major',
    email: 'nathan.major@example.com',
    phone: '+1 242 555-0107',
    address: '5 Kings Highway',
    city: 'Alice Town',
    county: 'Bimini',
    tier: 'Bronze',
    tenureYears: 0,
    ltv: 540,
    mrr: 35,
    churnRisk: 'Medium',
    sentiment: 55,
    status: 'Active',
    joined: '2025-08-01',
    services: [
      { name: '600 Mb Fibre', speed: '600 Mb/s', mrr: 35, status: 'Active', since: '2025-08-01' },
    ],
    invoices: [
      { id: 'INV-92334', date: '2026-05-01', amount: 35, status: 'Paid' },
      { id: 'INV-91795', date: '2026-04-01', amount: 35, status: 'Paid' },
    ],
    interactions: [
      { date: '2026-03-15', channel: 'Chat', topic: 'Setup help', sentiment: 'Neutral' },
    ],
    recommendations: [
      { title: 'REVConnect bundle (fibre + mobile)', reason: 'Standalone broadband customer', uplift: '+BSD 20 MRR', type: 'Upsell' },
      { title: 'Add REVTV Start', reason: 'No TV', uplift: '+BSD 20 MRR', type: 'Upsell' },
    ],
  },
]
