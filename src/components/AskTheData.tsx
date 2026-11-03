import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import tt from '../i18n/tt'
import { COMMERCIAL_BASE, FINANCE, QUARTER_REVENUE_M } from '../data/scenario'
import { customers } from '../data/customers'
import { Sparkles, X, Send, Database, CheckCircle2, Loader2, FileCode, Brain, BarChart3 as ChartIcon, Table as TableIcon, MessageSquareText } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

const SUGGESTIONS: Record<string, string[]> = {
  executive: [
    'What is total revenue MTD vs. plan?',
    'Which region grew subscribers fastest this quarter?',
    'Show churn rate trend for the last 12 months',
    'How does our 5G coverage compare to BTC and Rival ISP A?',
    'What is mobile ARPU vs. fixed ARPU this quarter?',
  ],
  operations: [
    'How many P1 incidents are open right now?',
    'Average ticket resolution time by region this week',
    'Which cell-sites are causing the most mobile churn?',
  ],
  'mobile-ran': [
    'What is our 5G SA population coverage today vs. 95% target?',
    'Top 10 congested 5G cells by traffic load',
    'Mobile NPS Cable Bahamas vs. BTC / Rival ISP A / Rival ISP B',
    'How many Island Towers (demo)-shared sites are active?',
  ],
  network: [
    'Show traffic split between fixed FTTH and mobile 5G',
    'Which regions still have <90% 5G coverage?',
  ],
  'customer-360': [
    'Top 10 customers by lifetime value in Freeport',
    'Churn risk distribution for Platinum tier',
    'Which Mobile-only customers are highest propensity to upgrade Convergent?',
  ],
  clv: [
    'What is the average 3-year CLV for Gig1 customers acquired in Q3 2025?',
    'How much CLV is at risk from customers with churn score above 0.8?',
    'Which product tier has the highest CLV-to-CAC ratio?',
    'Compare CLV between Mobile-only, Fixed-only and Convergent',
  ],
  'bundle-propensity': [
    'How many single-play customers have REVConnect propensity > 0.7 AND positive margin?',
    'Average propensity score for customers in Freeport vs. Nassau',
    'Mobile-only customers most likely to upgrade Convergent',
  ],
  'digital-funnel': [
    'M500 cart-to-checkout conversion this week vs. last week',
    'Top 3 reasons customers drop off during M500 checkout',
    'Which traffic source has the highest M500 conversion rate?',
    '5G mobile cart conversion vs. fixed broadband',
  ],
  'pricing-simulator': [
    'Acquisition price elasticity for Gig1 in Nassau for new customers',
    'If we increase M250 by BSD 3, how many existing subs do we lose?',
    'How does our 5G XL plan compare to BTC pricing?',
  ],
  'bundle-profitability': [
    'Average true margin for REVConnect customers vs. broadband-only first 12 months',
    'Discount depth where Mega Bundle becomes margin-negative',
    'Payback period for BB+TV vs. broadband standalone',
    'LTV of Convergent FTTH 1G + Mobile XL vs. standalone mobile',
  ],
  marketing: [
    'Which campaign has the best CAC this month?',
    'Conversion rate by channel for the last 30 days',
    'ROI of MNP win-back campaign vs. BTC',
  ],
  finance: [
    'MRR growth by product line this quarter',
    'AR aging — what is overdue 60+ days?',
    'Revenue split: fixed vs. mobile vs. convergent this quarter',
  ],
  sales: [
    'Top reps by revenue this quarter',
    'Win rate by region for the last 90 days',
    'Mobile-only orders vs. Convergent attach rate this week',
  ],
  procurement: [
    'TTM mobile RAN vendor spend by vendor',
    'Open PO commitment to Ericsson and Nokia',
  ],
  b2b: [
    'M2M / IoT line growth YoY',
    'Private 5G network revenue and account count',
  ],
  default: [
    'What is total revenue this quarter?',
    'How many active customers do we have?',
    'Show me the top performing region',
    'How many mobile subscribers do we have?',
  ],
}

type Mart = { db: string; schema: string; view: string; columns: string[] }
type Answer = {
  reasoning: string
  mart: Mart
  sql: string
  result: { type: 'table' | 'value'; columns?: string[]; rows?: (string | number)[][]; value?: string }
  chart?: { type: 'bar' | 'line'; data: any[]; x: string; y: string; label: string }
  summary: string
}

const ANSWERS: Record<string, Answer> = {
  default: {
    reasoning: 'Interpreting question · identifying entity, metric, time grain · matching to semantic catalog.',
    mart: { db: 'CBL_ANALYTICS', schema: 'CONSUMER', view: 'CUSTOMER_REVENUE_FACT', columns: ['CUSTOMER_ID', 'REVENUE', 'BILLING_PERIOD', 'SEGMENT', 'REGION'] },
    sql: `SELECT SUM(revenue) AS total_revenue\nFROM CBL_ANALYTICS.CONSUMER.CUSTOMER_REVENUE_FACT\nWHERE billing_period >= DATE_TRUNC('quarter', CURRENT_DATE());`,
    result: { type: 'value', value: `BSD ${QUARTER_REVENUE_M}M` },
    summary: `Synthetic trailing-three-month revenue is **BSD ${QUARTER_REVENUE_M}M**. May revenue is **BSD ${FINANCE.monthlyRevenueM}M**. Bundled service revenue is allocated to fixed and mobile lanes, not counted a second time.`,
  },
  clv_gig1_q1: {
    reasoning: 'Detected: metric=CLV, product=Gig1, cohort=Q3 2025 acquisition. Routing to CLV semantic view.',
    mart: { db: 'CBL_ANALYTICS', schema: 'ML_OUTPUTS', view: 'CLV_FORECAST_36M', columns: ['CUSTOMER_ID', 'PRODUCT', 'ACQUISITION_QUARTER', 'PREDICTED_CLV_36M', 'CLV_TIER', 'CHURN_ADJUSTED_CLV'] },
    sql: `SELECT
  AVG(predicted_clv_36m) AS avg_clv,
  COUNT(*) AS customers
FROM CBL_ANALYTICS.ML_OUTPUTS.CLV_FORECAST_36M
WHERE product = 'GIG1'
  AND acquisition_quarter = '2025-Q3';`,
    result: { type: 'table', columns: ['Metric', 'Value'], rows: [['Avg 3-yr CLV', 'BSD 2,684'], ['Customers in cohort', '8,420'], ['Churn-adjusted CLV', 'BSD 2,118'], ['Confidence interval', 'BSD 2,520 – BSD 2,848']] },
    chart: {
      type: 'bar',
      label: 'Avg 36-mo CLV by acquisition quarter (Gig1)',
      x: 'q', y: 'clv',
      data: [
        { q: '2024 Q1', clv: 2480 },
        { q: '2024 Q2', clv: 2540 },
        { q: '2024 Q3', clv: 2580 },
        { q: '2024 Q4', clv: 2620 },
        { q: '2025 Q1', clv: 2684 },
      ],
    },
    summary: 'Average 3-year CLV for Gig1 customers acquired in **Q3 2025** is **BSD 2,684** across 8,420 customers, the highest of any recent cohort. Churn-adjusted CLV is BSD 2,118.',
  },
  clv_at_risk: {
    reasoning: 'Detected: at-risk CLV with threshold churn_score > 0.8. Joining CLV forecast with churn model outputs.',
    mart: { db: 'CBL_ANALYTICS', schema: 'ML_OUTPUTS', view: 'CLV_FORECAST_36M', columns: ['CUSTOMER_ID', 'PREDICTED_CLV_36M', 'CHURN_SCORE', 'TIER'] },
    sql: `SELECT
  COUNT(*) AS at_risk_customers,
  SUM(predicted_clv_36m) AS clv_at_risk
FROM CBL_ANALYTICS.ML_OUTPUTS.CLV_FORECAST_36M
WHERE churn_score > 0.8;`,
    result: { type: 'table', columns: ['Metric', 'Value'], rows: [['Customers at risk', '14,820'], ['Total CLV at risk', 'BSD 38.4M'], ['Avg CLV per customer', 'BSD 2,591'], ['% of portfolio CLV', '2.0%']] },
    summary: 'There are **14,820 customers** with churn score > 0.8, representing **BSD 38.4M of CLV at risk** (2.0% of total portfolio).',
  },
  m500_traffic: {
    reasoning: 'Detected: M500 conversion by traffic source. Routing to digital funnel sessions view.',
    mart: { db: 'CBL_ANALYTICS', schema: 'DIGITAL', view: 'DIGITAL_FUNNEL_SESSIONS', columns: ['SESSION_ID', 'TRAFFIC_SOURCE', 'PRODUCT', 'CONVERTED'] },
    sql: `SELECT
  traffic_source,
  COUNT(*) AS sessions,
  SUM(converted) / COUNT(*) * 100 AS conversion_rate_pct
FROM CBL_ANALYTICS.DIGITAL.DIGITAL_FUNNEL_SESSIONS
WHERE product_viewed = 'M500_FIBRE'
  AND session_start_ts >= DATEADD('day', -7, CURRENT_DATE())
GROUP BY traffic_source
ORDER BY conversion_rate_pct DESC;`,
    chart: {
      type: 'bar',
      label: 'M500 conversion rate by traffic source (last 7 days)',
      x: 'src', y: 'rate',
      data: [
        { src: 'Email', rate: 4.22 },
        { src: 'Direct', rate: 2.64 },
        { src: 'Paid Search', rate: 2.12 },
        { src: 'Organic', rate: 1.84 },
        { src: 'Affiliate', rate: 1.18 },
        { src: 'Social', rate: 0.94 },
      ],
    },
    result: { type: 'table', columns: ['Traffic source', 'Sessions', 'Conv %'], rows: [['Email', '12,800', '4.22%'], ['Direct', '41,200', '2.64%'], ['Paid Search', '62,100', '2.12%'], ['Organic', '84,200', '1.84%'], ['Affiliate', '9,300', '1.18%'], ['Social', '38,400', '0.94%']] },
    summary: '**Email** is the best M500 channel at **4.22%** conversion, 4.5× higher than Social (0.94%). Direct traffic also outperforms paid channels.',
  },
  m500_dropoff: {
    reasoning: 'Detected: drop-off reason analysis for M500 checkout. Calling Cortex AI on chat transcripts.',
    mart: { db: 'CBL_ANALYTICS', schema: 'CORTEX_AI', view: 'PURCHASE_DROPOFF_REASONS', columns: ['SESSION_ID', 'PRODUCT', 'STAGE', 'DROP_OFF_REASON'] },
    sql: `SELECT
  drop_off_reason,
  COUNT(*) AS sessions,
  100.0 * COUNT(*) / SUM(COUNT(*)) OVER () AS pct
FROM CBL_ANALYTICS.CORTEX_AI.PURCHASE_DROPOFF_REASONS
WHERE product = 'M500_FIBRE'
  AND stage = 'CHECKOUT'
GROUP BY drop_off_reason
ORDER BY pct DESC
LIMIT 3;`,
    result: { type: 'table', columns: ['Drop-off reason', '%'], rows: [['Price concern (vs. BTC/Rival ISP A)', '38%'], ['Serviceability check failed', '24%'], ['Credit check fear', '14%']] },
    summary: 'Top 3 M500 checkout drop-off reasons: **Price concern (38%)**, Serviceability check failed (24%), Credit check fear (14%). Classified by Cortex AI from PEGA chat transcripts.',
  },
  pricing_elasticity: {
    reasoning: 'Detected: price elasticity, product=Gig1, region=Nassau, segment=new. Routing to elasticity model outputs.',
    mart: { db: 'CBL_ANALYTICS', schema: 'PRICING', view: 'ELASTICITY_COEFFICIENTS', columns: ['PRODUCT', 'REGION', 'SEGMENT', 'ACQUISITION_BETA', 'CHURN_BETA', 'MIGRATION_BETA'] },
    sql: `SELECT acquisition_beta, churn_beta, migration_beta
FROM CBL_ANALYTICS.PRICING.ELASTICITY_COEFFICIENTS
WHERE product = 'GIG1'
  AND region = 'NASSAU'
  AND segment = 'NEW';`,
    result: { type: 'table', columns: ['Behaviour', 'Elasticity (β)', 'Interpretation'], rows: [['Acquisition', '-1.62', 'Highly elastic'], ['Churn', '0.74', 'Moderate'], ['Migration', '1.31', 'Strong tier-switching']] },
    summary: 'Gig1 acquisition price elasticity in Nassau for new customers is **-1.62** — a 1% price increase reduces new sign-ups by ~1.62%. Churn response is moderate at 0.74.',
  },
  m250_increase: {
    reasoning: 'Detected: scenario simulation, product=M250, delta=+BSD 3. Calling pricing simulation stored procedure.',
    mart: { db: 'CBL_ANALYTICS', schema: 'PRICING', view: 'SIMULATE_PRICE_CHANGE', columns: ['PRODUCT', 'PRICE_DELTA', 'NEW_ACQ', 'INCREMENTAL_CHURN', 'NET_SUBS'] },
    sql: `CALL CBL_ANALYTICS.PRICING.SIMULATE_PRICE_CHANGE(
  product => 'M250',
  price_delta_eur => 3,
  segment => 'EXISTING'
);`,
    result: { type: 'table', columns: ['Metric', 'Value'], rows: [['Existing subs lost (12 mo)', '1,840'], ['Fewer new acquisitions', '620'], ['Total subscriber loss', '2,460'], ['Revenue uplift (BSD /mo)', '+BSD 312K'], ['12-month net P&L', '+BSD 2.8M']] },
    summary: 'Increasing M250 by BSD 3 would lose **1,840 existing subscribers** and **620 new acquisitions** over 12 months — but net P&L is **+BSD 2.8M** because higher ARPU offsets the volume loss.',
  },
  bundle_connect_margin: {
    reasoning: 'Detected: margin comparison, bundle=REVConnect vs. broadband-only, horizon=first 12 months.',
    mart: { db: 'CBL_ANALYTICS', schema: 'COMMERCIAL', view: 'BUNDLE_PROFITABILITY', columns: ['BUNDLE', 'TENURE_MONTH', 'TRUE_MARGIN_PER_MONTH'] },
    sql: `SELECT
  bundle,
  AVG(true_margin_per_month) AS avg_margin
FROM CBL_ANALYTICS.COMMERCIAL.BUNDLE_PROFITABILITY
WHERE tenure_month <= 12
  AND bundle IN ('REVConnect', 'BB_ONLY')
GROUP BY bundle;`,
    chart: {
      type: 'line',
      label: 'Avg true margin / month — first 12 months',
      x: 'm', y: 'margin',
      data: Array.from({ length: 12 }, (_, i) => ({
        m: `M${i + 1}`,
        margin: i < 4 ? 18 + i * 4 : 32 + i,
      })),
    },
    result: { type: 'table', columns: ['Bundle', 'Avg margin / mo', 'vs. baseline'], rows: [['REVConnect (BB + Mobile)', 'BSD 38', '+BSD 14'], ['Broadband only', 'BSD 24', '—']] },
    summary: '**REVConnect customers** generate **BSD 38/month** true margin in their first 12 months — **BSD 14 (58%) more** than broadband-only customers, after accounting for content, network, and CPE costs.',
  },
  bb_top_customers: {
    reasoning: 'Detected: top customers by LTV, region=Freeport. Joining Customer 360 with CLV outputs.',
    mart: { db: 'CBL_ANALYTICS', schema: 'CONSUMER', view: 'CUSTOMER_360', columns: ['CUSTOMER_ID', 'NAME', 'CITY', 'PREDICTED_CLV_36M', 'TIER'] },
    sql: `SELECT customer_id, name, predicted_clv_36m AS clv, tier
FROM CBL_ANALYTICS.CONSUMER.CUSTOMER_360
WHERE city = 'Freeport'
ORDER BY clv DESC
LIMIT 10;`,
    result: {
      type: 'table',
      columns: ['Customer', 'Tier', 'CLV (36m)'],
      rows: [
        ['Thomas Ferguson', 'Gold', 'BSD 8,420'],
        ['Lucas Knowles', 'Platinum', 'BSD 7,980'],
        ['Marie Willems', 'Gold', 'BSD 7,260'],
        ['Wout Bethel', 'Platinum', 'BSD 6,840'],
        ['Emma Vermeulen', 'Gold', 'BSD 6,210'],
      ],
    },
    summary: 'Top Freeport customers by 3-year CLV are led by **Thomas Ferguson (BSD 8,420)** and **Lucas Knowles (BSD 7,980)** — both long-tenure multi-product customers.',
  },
  // ── Mobile / 5G / Convergent answers ─────────────────────────────────────
  mobile_5g_coverage: {
    reasoning: 'Detected: 5G population coverage vs. competitors. Routing to RAN coverage view + MNO benchmark.',
    mart: { db: 'CBL_ANALYTICS', schema: 'NETWORK', view: 'MOBILE_COVERAGE_BENCHMARK', columns: ['MNO', 'POP_COVERAGE_PCT', 'CELL_SITES', 'MEDIAN_DL_MBPS'] },
    sql: `SELECT mno, pop_coverage_pct, cell_sites, median_dl_mbps
FROM CBL_ANALYTICS.NETWORK.MOBILE_COVERAGE_BENCHMARK
WHERE tech = '5G_SA'
ORDER BY pop_coverage_pct DESC;`,
    chart: {
      type: 'bar',
      label: '5G SA population coverage by MNO (%)',
      x: 'mno', y: 'cov',
      data: [
        { mno: 'Cable Bahamas', cov: 89.4 },
        { mno: 'BTC', cov: 84.2 },
        { mno: 'Rival ISP A',   cov: 81.6 },
        { mno: 'Rival ISP B', cov: 72.4 },
      ],
    },
    result: { type: 'table', columns: ['MNO', '5G coverage', 'Cell sites', 'Median DL'], rows: [['Cable Bahamas', '89.4%', '220', '145 Mbps'], ['BTC', '84.2%', '21,420', '128 Mbps'], ['Rival ISP A', '81.6%', '19,860', '112 Mbps'], ['Rival ISP B', '72.4%', '14,200', '96 Mbps']] },
    summary: 'The synthetic Cable Bahamas scenario leads the comparison on **5G SA population coverage at 89.4%** — 5.2 pp ahead of BTC and 7.8 pp ahead of Rival ISP A. Median DL throughput of 145 Mbps is also #1.',
  },
  mobile_arpu: {
    reasoning: 'Detected: ARPU split, fixed vs mobile. Routing to revenue-by-lane view.',
    mart: { db: 'CBL_ANALYTICS', schema: 'FINANCE', view: 'REVENUE_BY_LANE', columns: ['LANE', 'REVENUE_BSD_M', 'SUBS', 'ARPU'] },
    sql: `SELECT lane, revenue_eur_m, subs, arpu
FROM CBL_ANALYTICS.FINANCE.REVENUE_BY_LANE
WHERE quarter = DATE_TRUNC('quarter', CURRENT_DATE())
ORDER BY arpu DESC;`,
    result: { type: 'table', columns: ['Lane', 'ARPU', 'Subs', 'Revenue'], rows: [['Convergent', 'BSD 58.20', '1.65M', 'BSD 98.2M'], ['Fixed (FTTH)', 'BSD 38.40', '1.73M', 'BSD 66.4M'], ['Mobile (Consumer)', 'BSD 17.80', '2.82M', 'BSD 50.2M'], ['Mobile (B2B)', 'BSD 24.50', '0.35M', 'BSD 8.6M']] },
    summary: '**Convergent ARPU is BSD 58.20** — 3.3× standalone Mobile (BSD 17.80) and 1.5× standalone Fixed (BSD 38.40). The Mobile-only → Convergent upsell is the highest-leverage ARPU motion.',
  },
  mobile_only_propensity: {
    reasoning: 'Detected: Mobile-only customers with high propensity to upgrade to Convergent. Routing to ML propensity outputs.',
    mart: { db: 'CBL_ANALYTICS', schema: 'ML_OUTPUTS', view: 'BUNDLE_PROPENSITY', columns: ['CUSTOMER_ID', 'CURRENT_LANE', 'TARGET_BUNDLE', 'SCORE', 'EXPECTED_ARPU_LIFT'] },
    sql: `SELECT COUNT(*) AS customers,
       AVG(score) AS avg_score,
       SUM(expected_arpu_lift) AS arpu_uplift_eur
FROM CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY
WHERE current_lane = 'MOBILE_ONLY'
  AND target_bundle = 'CONVERGENT'
  AND score >= 0.70;`,
    result: { type: 'table', columns: ['Metric', 'Value'], rows: [['Mobile-only addressable', '184,000'], ['Avg propensity score', '0.78'], ['Avg ARPU lift / cust', '+BSD 32.40'], ['Annualised ARR upside', 'BSD 71.5M'], ['Recommended channel', 'Outbound + retention']] },
    summary: '**184,000 Mobile-only customers** score ≥ 0.70 to upgrade Convergent — **BSD 71.5M annualised ARR upside** at +BSD 32.40 ARPU lift each. Best channel: Outbound + retention (14.6% historical conversion).',
  },
  mobile_top_cells: {
    reasoning: 'Detected: top congested 5G cells by traffic load. Routing to RAN telemetry view.',
    mart: { db: 'CBL_ANALYTICS', schema: 'NETWORK', view: 'CELL_SITE_TELEMETRY', columns: ['CELL_ID', 'REGION', 'PEAK_LOAD_PCT', 'AVG_DL_MBPS', 'USERS'] },
    sql: `SELECT cell_id, region, peak_load_pct, avg_dl_mbps, users
FROM CBL_ANALYTICS.NETWORK.CELL_SITE_TELEMETRY
WHERE tech = '5G_SA'
  AND date_trunc('day', ts) = CURRENT_DATE()
ORDER BY peak_load_pct DESC
LIMIT 10;`,
    result: { type: 'table', columns: ['Cell ID', 'Region', 'Peak load', 'Avg DL', 'Users'], rows: [['CEL-ANT-0142', 'Nassau Central', '94%', '82 Mbps', '4,820'], ['CEL-GNT-0088', 'Freeport', '91%', '88 Mbps', '4,210'], ['CEL-ANT-0228', 'Nassau South', '88%', '94 Mbps', '3,940'], ['CEL-VAL-0064', 'Abaco', '86%', '102 Mbps', '3,680'], ['CEL-LVN-0042', 'Eleuthera', '84%', '98 Mbps', '3,420']] },
    summary: 'Top congested 5G cells are concentrated in **Nassau Central (94%) and Freeport (91%)**. Top 1% of cells drive 22% of mobile churn — densification + small-cells in flight.',
  },
  mobile_subscribers: {
    reasoning: 'Detected: mobile subscriber count. Routing to consumer + B2B mobile base view.',
    mart: { db: 'CBL_ANALYTICS', schema: 'CONSUMER', view: 'MOBILE_SUBS_DAILY', columns: ['LINE_TYPE', 'TIER', 'SUBS', 'NET_ADDS_TTM'] },
    sql: `SELECT line_type, SUM(subs) AS subs
FROM CBL_ANALYTICS.CONSUMER.MOBILE_SUBS_DAILY
WHERE date_trunc('day', ts) = CURRENT_DATE()
GROUP BY line_type
ORDER BY subs DESC;`,
    result: { type: 'value', value: COMMERCIAL_BASE.mobileSubscriptions.toLocaleString('en-BS') },
    summary: 'Cable Bahamas has **180.5K mobile subscribers (synthetic)** — illustrative mobile scenario. Split: 150K Consumer · 25K B2B · 5.5K IoT/M2M. +2.1% YoY growth.',
  },
}

export function pickAnswer(q: string): Answer {
  const lc = q.toLowerCase()
  if (lc.includes('revenue') && (lc.includes('month') || lc.includes('mtd'))) return {
    ...ANSWERS.default,
    result: { type: 'value', value: `BSD ${FINANCE.monthlyRevenueM}M` },
    summary: `Synthetic May revenue: BSD ${FINANCE.monthlyRevenueM}M. This is a completed scenario month, not live MTD data.`,
  }
  if (lc.includes('freeport') && (lc.includes('top') || lc.includes('lifetime'))) {
    const matches = customers.filter(customer => customer.city === 'Freeport').sort((left, right) => right.ltv - left.ltv)
    return { ...ANSWERS.bb_top_customers, result: { type: 'table', columns: ['Customer', 'Tier', 'CLV (BSD)'], rows: matches.map(customer => [customer.name, customer.tier, customer.ltv]) }, summary: `The fictional customer sample contains ${matches.length} Freeport customer: ${matches.map(customer => customer.name).join(', ')}. The sample is not the entire subscriber base.` }
  }
  if (lc.includes('arpu') && (lc.includes('mobile') || lc.includes('fixed'))) return {
    ...ANSWERS.mobile_arpu,
    result: { type: 'table', columns: ['Service', 'Monthly ARPU (BSD)', 'Subscriptions'], rows: [['Fixed', COMMERCIAL_BASE.fixedArpu, COMMERCIAL_BASE.fixedSubscriptions], ['Mobile', COMMERCIAL_BASE.mobileArpu, COMMERCIAL_BASE.mobileSubscriptions]] },
    summary: `Synthetic fixed ARPU is BSD ${COMMERCIAL_BASE.fixedArpu}; mobile ARPU is BSD ${COMMERCIAL_BASE.mobileArpu}. Subscriptions are service counts, not unique people.`,
  }
  // Mobile / 5G routes — checked first
  if ((lc.includes('5g') && (lc.includes('coverage') || lc.includes('btc') || lc.includes('orange'))) || (lc.includes('mno') && lc.includes('benchmark'))) return ANSWERS.mobile_5g_coverage
  if (lc.includes('arpu') && (lc.includes('mobile') || lc.includes('fixed') || lc.includes('convergent'))) return ANSWERS.mobile_arpu
  if (lc.includes('mobile-only') || (lc.includes('mobile') && lc.includes('convergent') && (lc.includes('upgrade') || lc.includes('propensity')))) return ANSWERS.mobile_only_propensity
  if ((lc.includes('cell') || lc.includes('5g')) && (lc.includes('congested') || lc.includes('top') || lc.includes('load'))) return ANSWERS.mobile_top_cells
  if (lc.includes('mobile subscriber') || lc.includes('how many mobile') || (lc.includes('mobile') && lc.includes('how many'))) return ANSWERS.mobile_subscribers
  // Existing fixed routes
  if (lc.includes('gig1') && lc.includes('q1')) return ANSWERS.clv_gig1_q1
  if (lc.includes('clv') && (lc.includes('risk') || lc.includes('0.8'))) return ANSWERS.clv_at_risk
  if (lc.includes('m500') && lc.includes('traffic')) return ANSWERS.m500_traffic
  if (lc.includes('m500') && (lc.includes('drop') || lc.includes('reason'))) return ANSWERS.m500_dropoff
  if (lc.includes('elasticity') && lc.includes('nassau')) return ANSWERS.pricing_elasticity
  if (lc.includes('m250') && (lc.includes('increase') || lc.includes('BSD 3'))) return ANSWERS.m250_increase
  if ((lc.includes('revconnect') || lc.includes('bundle')) && lc.includes('margin')) return ANSWERS.bundle_connect_margin
  if (lc.includes('freeport') && (lc.includes('top') || lc.includes('lifetime'))) return ANSWERS.bb_top_customers
  if (lc.includes('revenue') && (lc.includes('quarter') || lc.includes('qtd'))) return ANSWERS.default
  return { reasoning: 'No supported scripted scenario matched this question.', mart: {db:'DEMO',schema:'SCENARIOS',view:'NO_MATCH',columns:[]}, sql:'-- No query executed. This demonstration has no database connection.', result:{type:'value',value:'No scripted answer'}, summary:'This question is not covered by the scripted demo. Try total revenue this quarter, mobile subscriber count, fixed vs mobile ARPU, or REVConnect margin.' }
}

function getKey(path: string): string {
  const seg = path.split('/').filter(Boolean).pop() || 'default'
  return SUGGESTIONS[seg] ? seg : 'default'
}

type StepKey = 'reason' | 'mart' | 'sql' | 'execute' | 'render'
type StepState = 'pending' | 'running' | 'done'

const STEP_LABELS: Record<StepKey, { running: string; done: string; icon: any }> = {
  reason: { running: 'Reasoning about your question…', done: 'Question understood', icon: Brain },
  mart: { running: 'Searching the semantic catalog…', done: 'Datamart selected', icon: Database },
  sql: { running: 'Generating SQL…', done: 'SQL generated', icon: FileCode },
  execute: { running: 'Executing on warehouse ANALYTICS_WH…', done: 'Query executed', icon: Loader2 },
  render: { running: 'Formatting results…', done: 'Results ready', icon: ChartIcon },
}

const TIMINGS: Record<StepKey, number> = {
  reason: 1800,
  mart: 2000,
  sql: 2600,
  execute: 3000,
  render: 1800,
}

export default function AskTheData() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    reason: 'pending', mart: 'pending', sql: 'pending', execute: 'pending', render: 'pending',
  })
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [shown, setShown] = useState<{ mart: boolean; sql: boolean; result: boolean }>({ mart: false, sql: false, result: false })
  const timeoutsRef = useRef<number[]>([])

  const location = useLocation()
  const key = getKey(location.pathname)
  const suggestions = SUGGESTIONS[key]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-ask-data', onOpen as EventListener)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-ask-data', onOpen as EventListener)
    }
  }, [])

  const reset = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current = []
    setRunning(false)
    setAnswer(null)
    setSteps({ reason: 'pending', mart: 'pending', sql: 'pending', execute: 'pending', render: 'pending' })
    setShown({ mart: false, sql: false, result: false })
  }

  const ask = (text: string) => {
    reset()
    setQ(text)
    setRunning(true)
    const ans = pickAnswer(text)

    const order: StepKey[] = ['reason', 'mart', 'sql', 'execute', 'render']
    let elapsed = 0
    order.forEach((step, idx) => {
      // start
      const t1 = window.setTimeout(() => {
        setSteps((s) => ({ ...s, [step]: 'running' }))
      }, elapsed)
      timeoutsRef.current.push(t1)

      elapsed += TIMINGS[step]

      // end + reveal panels
      const t2 = window.setTimeout(() => {
        setSteps((s) => ({ ...s, [step]: 'done' }))
        if (step === 'mart') setShown((s) => ({ ...s, mart: true }))
        if (step === 'sql') setShown((s) => ({ ...s, sql: true }))
        if (step === 'render') {
          setShown((s) => ({ ...s, result: true }))
          setAnswer(ans)
          setRunning(false)
        }
      }, elapsed)
      timeoutsRef.current.push(t2)
    })
  }

  const close = () => { setOpen(false); reset(); setQ('') }

  const renderStepIcon = (step: StepKey) => {
    const state = steps[step]
    const Icon = STEP_LABELS[step].icon
    if (state === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    if (state === 'running') return <Loader2 className="w-4 h-4 text-vfes-dark animate-spin" />
    return <Icon className="w-4 h-4 text-vfes-dark/30" />
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-12" onClick={close}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-vfes-red to-vfes-red-dark text-vfes-dark px-5 py-4 flex items-center gap-3 shrink-0">
              <Sparkles className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-bold">{tt('Ask the data')}</div>
                <div className="text-xs text-vfes-dark/70">{tt('Powered by Snowflake Intelligence · Cortex Analyst')}</div>
              </div>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-black/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto scrollbar-thin">
              <form
                onSubmit={(e) => { e.preventDefault(); if (q.trim() && !running) ask(q) }}
                className="relative mb-4"
              >
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tt('Ask a question about your data…')}
                  disabled={running}
                  className="w-full bg-[#f3f4f7] border border-transparent rounded-xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:bg-white focus:border-vfes-red/40 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!q.trim() || running}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-vfes-red disabled:bg-vfes-red/30 hover:bg-vfes-red-dark text-vfes-dark p-2.5 rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {!running && !answer && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2 flex items-center gap-2">
                    <Database className="w-3 h-3" /> {tt('Suggestions for this page')}
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="w-full text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 hover:bg-white transition flex items-start gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                        <span className="flex-1">{tt(s)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(running || answer) && (
                <div className="space-y-4">
                  {/* Step list */}
                  <div className="space-y-2">
                    {(['reason', 'mart', 'sql', 'execute', 'render'] as StepKey[]).map((step) => {
                      const state = steps[step]
                      return (
                        <div
                          key={step}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                            state === 'running' ? 'bg-vfes-red/5 border-vfes-red/30' :
                            state === 'done' ? 'bg-emerald-50/50 border-emerald-100' :
                            'bg-[#fafbfc] border-black/5 opacity-50'
                          }`}
                        >
                          {renderStepIcon(step)}
                          <span className="text-sm font-semibold flex-1">
                            {state === 'done' ? STEP_LABELS[step].done : STEP_LABELS[step].running}
                          </span>
                          {state === 'running' && (
                            <span className="text-xs text-vfes-dark font-mono">…</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Reasoning */}
                  {steps.reason === 'done' && answer && (
                    <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1 flex items-center gap-1.5">
                        <Brain className="w-3 h-3" /> {tt('Reasoning')}
                      </div>
                      <div className="text-sm text-vfes-dark/75">{tt(answer.reasoning)}</div>
                    </div>
                  )}

                  {/* Datamart */}
                  {shown.mart && answer && (
                    <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2 flex items-center gap-1.5">
                        <Database className="w-3 h-3" /> {tt('Selected datamart')}
                      </div>
                      <div className="font-mono text-sm font-bold text-vfes-dark">
                        {answer.mart.db}.{answer.mart.schema}.{answer.mart.view}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {answer.mart.columns.map((c) => (
                          <span key={c} className="text-[10px] bg-white border border-black/5 px-2 py-0.5 rounded font-mono">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SQL */}
                  {shown.sql && answer && (
                    <div className="rounded-lg overflow-hidden border border-black/5">
                      <div className="bg-vfes-dark text-white px-3 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                        <FileCode className="w-3 h-3" /> {tt('Generated SQL')}
                      </div>
                      <pre className="bg-[#0d0d10] text-emerald-300 text-xs p-4 overflow-x-auto leading-relaxed">
                        <code>{answer.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* Result */}
                  {shown.result && answer && (
                    <>
                      {answer.chart && (
                        <div className="rounded-lg p-4 bg-white border border-black/5">
                          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2 flex items-center gap-1.5">
                            <ChartIcon className="w-3 h-3" /> {tt(answer.chart.label)}
                          </div>
                          <div className="h-56">
                            <ResponsiveContainer>
                              {answer.chart.type === 'bar' ? (
                                <BarChart data={answer.chart.data}>
                                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                                  <XAxis dataKey={answer.chart.x} stroke="#999" fontSize={11} />
                                  <YAxis stroke="#999" fontSize={11} />
                                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                                  <Bar dataKey={answer.chart.y} fill="#FF4438" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              ) : (
                                <LineChart data={answer.chart.data}>
                                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                                  <XAxis dataKey={answer.chart.x} stroke="#999" fontSize={11} />
                                  <YAxis stroke="#999" fontSize={11} />
                                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                                  <Line type="monotone" dataKey={answer.chart.y} stroke="#222128" strokeWidth={2.5} dot={{ fill: '#FF4438' }} />
                                </LineChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {answer.result.type === 'table' && answer.result.rows && (
                        <div className="rounded-lg overflow-hidden border border-black/5">
                          <div className="bg-[#fafbfc] px-3 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60 border-b border-black/5">
                            <TableIcon className="w-3 h-3" /> {tt('Result')}
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-white">
                                {answer.result.columns!.map((c) => (
                                  <th key={c} className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold border-b border-black/5">{tt(c)}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {answer.result.rows.map((row, i) => (
                                <tr key={i} className="border-b border-black/5 last:border-0 hover:bg-[#fafbfc]">
                                  {row.map((v, j) => (
                                    <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-semibold' : ''}`}>{tt(String(v))}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {answer.result.type === 'value' && (
                        <div className="rounded-lg bg-vfes-red/5 border border-vfes-red/15 p-5 text-center">
                          <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold mb-1">{tt('Result')}</div>
                          <div className="text-4xl font-extrabold text-vfes-dark">{answer.result.value}</div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="rounded-lg p-4 bg-gradient-to-br from-vfes-red/5 to-transparent border border-vfes-red/15">
                        <div className="text-[10px] uppercase tracking-widest text-vfes-dark font-bold mb-2 flex items-center gap-1.5">
                          <MessageSquareText className="w-3 h-3" /> {tt('Answer')}
                        </div>
                        <div className="text-sm text-vfes-dark/85 leading-relaxed">
                          {tt(answer.summary).split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-vfes-dark">{part}</strong> : part)}
                        </div>
                      </div>

                      <button
                        onClick={() => { reset(); setQ('') }}
                        className="text-xs font-bold text-vfes-dark hover:underline"
                      >
                        {tt('Ask another question')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
