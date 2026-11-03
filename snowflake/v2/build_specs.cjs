// Builds and deploys the V2 semantic views and the Cable Bahamas agent spec.
// Column types come from INFORMATION_SCHEMA; metrics, descriptions and verified
// queries are defined here. Usage:
//   node snowflake/v2/build_specs.cjs views   → write + deploy 9 semantic views
//   node snowflake/v2/build_specs.cjs agent   → write + save the agent (both copies)
const { spawnSync } = require('node:child_process')
const { mkdirSync } = require('node:fs')
const path = require('node:path')

const DB = 'CABLEBAHAMAS_DEMO', SCHEMA = 'ANALYTICS_V2', P = `${DB}.${SCHEMA}`
const CONN = process.env.SF_CONNECTION || 'PJOSE_AWS3_ADMIN'
const OUT = path.join(__dirname, 'specs')
mkdirSync(OUT, { recursive: true })

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(r.status || 1) }
  return r.stdout
}
function columns() {
  const out = run('snow', ['sql', '-c', CONN, '--format', 'JSON', '-q',
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM ${DB}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${SCHEMA}' ORDER BY TABLE_NAME, ORDINAL_POSITION`])
  const rows = JSON.parse(out.slice(out.indexOf('[')))
  const by = {}
  for (const r of rows) (by[r.TABLE_NAME] ||= []).push([r.COLUMN_NAME, r.DATA_TYPE])
  return by
}

const RULES = 'All data is synthetic demo data for Cable Bahamas (REV fixed and aliv mobile), generated from the web demo baseline. Reference date 2026-10-31: "latest", "current", "this month" or "today" mean October 2026; "this quarter" means August–October 2026 unless the user names a calendar quarter; "year to date" means January–October 2026. Never use CURRENT_DATE. Currency is BSD (pegged 1:1 to USD). Percentages are 0-100. Use ratio of sums for weighted rates. Do not sum snapshot counts across dates. Do not join unrelated fact tables. Islands: New Providence (Nassau), Grand Bahama (Freeport), Abaco, Eleuthera, Exuma, Andros, Other Family Islands (Bimini and others).'

const D = [
  { name: 'CUSTOMER_ANALYTICS', desc: 'Fixed (REV) customers at 2026-10-31: one row per fixed account (74,400) with island, product, MRR, churn risk, 36-month CLV, NPS, consent and whether the household also has aliv mobile (convergent). CUSTOMER_MOVEMENTS has monthly gross adds, disconnects, win-backs and net adds by island (Nov 2025–Oct 2026).',
    tables: { CUSTOMERS: 'One row per fixed customer account, snapshot 2026-10-31.', CUSTOMER_MOVEMENTS: 'Monthly fixed subscriber movement by island. Churn rate = disconnects / opening_subs.' },
    metrics: { CUSTOMERS: { fixed_customers: 'COUNT(DISTINCT CUSTOMER_ID)', fixed_mrr_bsd: 'SUM(CURRENT_MRR_BSD)', fixed_arpu_bsd: 'AVG(CURRENT_MRR_BSD)', high_risk_customers: "COUNT_IF(CHURN_RISK = 'High')", clv_36m_bsd: 'SUM(EXPECTED_36M_CLV_BSD)', convergent_households: 'COUNT_IF(HAS_ALIV_MOBILE)', nps: '100.0 * (COUNT_IF(NPS_SCORE >= 9) - COUNT_IF(NPS_SCORE <= 6)) / NULLIF(COUNT(NPS_SCORE), 0)' },
      CUSTOMER_MOVEMENTS: { gross_adds: 'SUM(GROSS_ADDS)', disconnects: 'SUM(DISCONNECTS)', net_adds: 'SUM(NET_ADDS)', win_backs: 'SUM(WIN_BACKS)', churn_rate_pct: '100.0 * SUM(DISCONNECTS) / NULLIF(SUM(OPENING_SUBS), 0)' } },
    vq: [['How many fixed customers do we have by island?', `SELECT ISLAND, COUNT(*) AS FIXED_CUSTOMERS FROM ${P}.CUSTOMERS GROUP BY ISLAND ORDER BY FIXED_CUSTOMERS DESC`],
      ['Which island has the highest churn this month?', `SELECT ISLAND, 100.0*SUM(DISCONNECTS)/SUM(OPENING_SUBS) AS CHURN_RATE_PCT, SUM(DISCONNECTS) AS DISCONNECTS FROM ${P}.CUSTOMER_MOVEMENTS WHERE MONTH_START='2026-10-01' GROUP BY ISLAND ORDER BY CHURN_RATE_PCT DESC`],
      ['Which high-value customers are at high churn risk?', `SELECT CUSTOMER_ID, CUSTOMER_NAME, ISLAND, TOWN, TIER, CURRENT_MRR_BSD, EXPECTED_36M_CLV_BSD FROM ${P}.CUSTOMERS WHERE CHURN_RISK='High' ORDER BY EXPECTED_36M_CLV_BSD DESC LIMIT 20`]] },
  { name: 'MOBILE_ANALYTICS', desc: 'aliv mobile lines at 2026-10-31: one row per line (180,500) with island, plan, plan type (Prepaid, Postpaid, Business, IoT), monthly ARPU, data usage and churn risk. CUSTOMER_ID is set when the line belongs to a convergent REV household.',
    tables: { MOBILE_SUBSCRIPTIONS: 'One row per active aliv mobile line, snapshot 2026-10-31.' },
    metrics: { MOBILE_SUBSCRIPTIONS: { mobile_lines: 'COUNT(DISTINCT LINE_ID)', mobile_revenue_bsd: 'SUM(MONTHLY_ARPU_BSD)', mobile_arpu_bsd: 'AVG(MONTHLY_ARPU_BSD)', convergent_lines: 'COUNT_IF(CUSTOMER_ID IS NOT NULL)', high_risk_lines: "COUNT_IF(CHURN_RISK = 'High')" } },
    vq: [['How many mobile subscribers do we have by plan type?', `SELECT PLAN_TYPE, COUNT(*) AS LINES, AVG(MONTHLY_ARPU_BSD) AS ARPU_BSD FROM ${P}.MOBILE_SUBSCRIPTIONS GROUP BY PLAN_TYPE ORDER BY LINES DESC`]] },
  { name: 'FINANCE_ANALYTICS', desc: 'Monthly group P&L by service line and island, Nov 2025–Oct 2026: revenue, budget (plan), cost of service, operating expense, EBITDA and capex in BSD. Service lines: Fixed (FTTH), Fixed (HFC), Mobile (Consumer), Mobile (B2B), Business fixed, Wholesale.',
    tables: { MONTHLY_FINANCE: 'One row per month × service line × island. Sum rows for totals.' },
    metrics: { MONTHLY_FINANCE: { revenue_bsd: 'SUM(REVENUE_BSD)', budget_revenue_bsd: 'SUM(BUDGET_REVENUE_BSD)', revenue_vs_plan_bsd: 'SUM(REVENUE_BSD) - SUM(BUDGET_REVENUE_BSD)', ebitda_bsd: 'SUM(EBITDA_BSD)', ebitda_margin_pct: '100.0 * SUM(EBITDA_BSD) / NULLIF(SUM(REVENUE_BSD), 0)', capex_bsd: 'SUM(CAPEX_BSD)', cost_of_service_bsd: 'SUM(COST_OF_SERVICE_BSD)', operating_expense_bsd: 'SUM(OPERATING_EXPENSE_BSD)' } },
    vq: [['What was revenue and EBITDA in October 2026?', `SELECT SUM(REVENUE_BSD) AS REVENUE_BSD, SUM(EBITDA_BSD) AS EBITDA_BSD, 100*SUM(EBITDA_BSD)/SUM(REVENUE_BSD) AS EBITDA_MARGIN_PCT FROM ${P}.MONTHLY_FINANCE WHERE MONTH_START='2026-10-01'`],
      ['Show monthly revenue vs plan', `SELECT MONTH_START, SUM(REVENUE_BSD) AS REVENUE_BSD, SUM(BUDGET_REVENUE_BSD) AS PLAN_BSD FROM ${P}.MONTHLY_FINANCE GROUP BY MONTH_START ORDER BY MONTH_START`],
      ['Revenue by service line this month', `SELECT SERVICE_LINE, SUM(REVENUE_BSD) AS REVENUE_BSD FROM ${P}.MONTHLY_FINANCE WHERE MONTH_START='2026-10-01' GROUP BY SERVICE_LINE ORDER BY REVENUE_BSD DESC`]] },
  { name: 'BILLING_ANALYTICS', desc: 'Open receivables at 2026-10-31 for consumer and business ledgers: one row per open item with ageing bucket and days overdue. Total BSD 16.8M (42 days sales outstanding).',
    tables: { RECEIVABLES: 'One row per open receivable item at 2026-10-31.' },
    metrics: { RECEIVABLES: { outstanding_bsd: 'SUM(OUTSTANDING_BSD)', overdue_60_plus_bsd: 'SUM(IFF(DAYS_OVERDUE > 60, OUTSTANDING_BSD, 0))', open_items: 'COUNT(DISTINCT INVOICE_ID)' } },
    vq: [['How much debt is more than 60 days overdue?', `SELECT LEDGER, SUM(OUTSTANDING_BSD) AS OVERDUE_60_PLUS_BSD FROM ${P}.RECEIVABLES WHERE DAYS_OVERDUE > 60 GROUP BY LEDGER`],
      ['Show receivables by ageing bucket', `SELECT AGEING_BUCKET, SUM(OUTSTANDING_BSD) AS OUTSTANDING_BSD FROM ${P}.RECEIVABLES GROUP BY AGEING_BUCKET ORDER BY MIN(DAYS_OVERDUE)`]] },
  { name: 'SERVICE_ANALYTICS', desc: 'Customer care contacts in October 2026 (21,400): theme, channel, island, first-contact resolution, handle time, CSAT. Includes cancellation intent ("Cancel / switching to BTC").',
    tables: { SUPPORT_CASES: 'One row per customer contact opened in October 2026.' },
    metrics: { SUPPORT_CASES: { contacts: 'COUNT(DISTINCT CASE_ID)', first_contact_resolution_pct: '100.0 * COUNT_IF(FIRST_CONTACT_RESOLVED) / NULLIF(COUNT(*), 0)', digital_share_pct: '100.0 * COUNT_IF(DIGITAL) / NULLIF(COUNT(*), 0)', avg_handle_time_min: 'AVG(HANDLE_TIME_MIN)', avg_csat: 'AVG(CSAT_SCORE)' } },
    vq: [['What are the top reasons customers contacted us this month?', `SELECT THEME, COUNT(*) AS CONTACTS FROM ${P}.SUPPORT_CASES GROUP BY THEME ORDER BY CONTACTS DESC`]] },
  { name: 'NETWORK_ANALYTICS', desc: 'Network sites (220) with island, ownership, homes passed, fixed subscribers, 5G population coverage, generator backup, aerial plant km and hurricane readiness; plus NETWORK_DAILY site-day availability, outage minutes and peak traffic for October 2026.',
    tables: { NETWORK_SITES: 'One row per active site (220).', NETWORK_DAILY: 'One row per site per day in October 2026.' },
    rel: [{ name: 'daily_to_site', left_table: 'NETWORK_DAILY', right_table: 'NETWORK_SITES', relationship_columns: [{ left_column: 'SITE_ID', right_column: 'SITE_ID' }] }],
    metrics: { NETWORK_SITES: { sites: 'COUNT(DISTINCT SITE_ID)', homes_passed: 'SUM(HOMES_PASSED)', fixed_subscribers: 'SUM(FIXED_SUBSCRIBERS)', take_up_pct: '100.0 * SUM(FIXED_SUBSCRIBERS) / NULLIF(SUM(HOMES_PASSED), 0)', sites_with_generator: 'COUNT_IF(HAS_GENERATOR)', aerial_plant_km: 'SUM(AERIAL_PLANT_KM)' },
      NETWORK_DAILY: { availability_pct: '100.0 * (1 - SUM(OUTAGE_MINUTES) / NULLIF(COUNT(*) * 1440, 0))', outage_minutes: 'SUM(OUTAGE_MINUTES)' } },
    vq: [['How many sites and homes passed do we have by island?', `SELECT ISLAND, COUNT(*) AS SITES, SUM(HOMES_PASSED) AS HOMES_PASSED, AVG(POP_COVERAGE_5G_PCT) AS COV_5G_PCT FROM ${P}.NETWORK_SITES GROUP BY ISLAND ORDER BY SITES DESC`],
      ['Are we ready for hurricane season?', `SELECT ISLAND, COUNT(*) AS SITES, COUNT_IF(HAS_GENERATOR) AS WITH_GENERATOR, SUM(AERIAL_PLANT_KM) AS AERIAL_KM, MAX(HURRICANE_READINESS) AS READINESS FROM ${P}.NETWORK_SITES GROUP BY ISLAND ORDER BY AERIAL_KM DESC`]] },
  { name: 'OPERATIONS_ANALYTICS', desc: 'Operations and regulatory: INCIDENTS (October 2026, open and resolved, customers affected, MTTR), URCA_QOS (Q3 2026 quality-of-service metrics vs URCA targets, filing due 2026-11-10) and FRAUD_CASES (October 2026 loss avoided and loss).',
    tables: { INCIDENTS: 'One row per network/service incident in October 2026.', URCA_QOS: 'One row per URCA quality-of-service metric for Q3 2026.', FRAUD_CASES: 'One row per fraud case in October 2026.' },
    metrics: { INCIDENTS: { incidents: 'COUNT(DISTINCT INCIDENT_ID)', open_incidents: "COUNT_IF(STATUS = 'Open')", customers_affected: 'SUM(CUSTOMERS_AFFECTED)', avg_mttr_min: 'AVG(MTTR_MIN)' },
      URCA_QOS: { qos_metrics: 'COUNT(*)', qos_metrics_met: 'COUNT_IF(MEETS_TARGET)' },
      FRAUD_CASES: { fraud_cases: 'COUNT(DISTINCT CASE_ID)', loss_avoided_bsd: 'SUM(LOSS_AVOIDED_BSD)', fraud_loss_bsd: 'SUM(LOSS_BSD)' } },
    vq: [['Are there any outages right now?', `SELECT INCIDENT_ID, ISLAND, AREA, SERVICE, PRIORITY, CUSTOMERS_AFFECTED, BUSINESS_ACCOUNTS_AFFECTED, OPENED_AT FROM ${P}.INCIDENTS WHERE STATUS='Open' ORDER BY CUSTOMERS_AFFECTED DESC`],
      ['What is our URCA filing status?', `SELECT METRIC, VALUE, URCA_TARGET, MEETS_TARGET FROM ${P}.URCA_QOS ORDER BY MEETS_TARGET, METRIC`]] },
  { name: 'B2B_ANALYTICS', desc: 'Business and wholesale: B2B_ACCOUNTS (26 named accounts with segment, island, MRR, ARR, contract end, status, health) and B2B_PIPELINE (open pipeline BSD 4.2M across Qualification, Proposal, Negotiation, plus recent won/lost). ACV is annual BSD, not recognised revenue.',
    tables: { B2B_ACCOUNTS: 'One row per named business or wholesale account.', B2B_PIPELINE: 'One row per sales opportunity.' },
    metrics: { B2B_ACCOUNTS: { accounts: 'COUNT(DISTINCT ACCOUNT_ID)', arr_bsd: 'SUM(ARR_BSD)', accounts_at_risk: "COUNT_IF(STATUS IN ('At Risk', 'Watch'))" },
      B2B_PIPELINE: { open_pipeline_bsd: "SUM(IFF(STAGE IN ('Qualification', 'Proposal', 'Negotiation'), ANNUAL_CONTRACT_VALUE_BSD, 0))", weighted_pipeline_bsd: "SUM(IFF(STAGE IN ('Qualification', 'Proposal', 'Negotiation'), ANNUAL_CONTRACT_VALUE_BSD * WIN_PROBABILITY, 0))", win_rate_pct: "100.0 * COUNT_IF(STAGE = 'Closed Won') / NULLIF(COUNT_IF(STAGE IN ('Closed Won', 'Closed Lost')), 0)" } },
    vq: [['What is the open B2B pipeline by stage?', `SELECT STAGE, COUNT(*) AS OPPORTUNITIES, SUM(ANNUAL_CONTRACT_VALUE_BSD) AS ACV_BSD FROM ${P}.B2B_PIPELINE WHERE STAGE IN ('Qualification','Proposal','Negotiation') GROUP BY STAGE`],
      ['Which business accounts are at risk?', `SELECT ACCOUNT_NAME, SEGMENT, ISLAND, ARR_BSD, STATUS, CONTRACT_END FROM ${P}.B2B_ACCOUNTS WHERE STATUS IN ('At Risk','Watch','Renewal') ORDER BY ARR_BSD DESC`]] },
  { name: 'PRODUCT_ANALYTICS', desc: 'REV fixed product catalogue (REVHome tiers, REVHome + TV, REVConnect convergent bundle, voice, business): monthly price, direct monthly cost and speed. Direct margin excludes overhead.',
    tables: { PRODUCTS: 'One row per fixed product.' },
    metrics: { PRODUCTS: { products: 'COUNT(DISTINCT PRODUCT_ID)', avg_price_bsd: 'AVG(MONTHLY_PRICE_BSD)', avg_direct_margin_bsd: 'AVG(MONTHLY_PRICE_BSD - MONTHLY_COST_BSD)' } },
    vq: [['Which products have the largest direct margin?', `SELECT PRODUCT_NAME, MONTHLY_PRICE_BSD, MONTHLY_PRICE_BSD - MONTHLY_COST_BSD AS DIRECT_MARGIN_BSD FROM ${P}.PRODUCTS ORDER BY DIRECT_MARGIN_BSD DESC`]] },
]

const KIND = t => /NUMBER|FLOAT|DECIMAL|INT/.test(t) ? 'fact' : /DATE|TIME/.test(t) ? 'time' : 'dim'
const SQLT = t => /BOOLEAN/.test(t) ? 'BOOLEAN' : /DATE/.test(t) && !/TIME/.test(t) ? 'DATE' : /TIME/.test(t) ? 'TIMESTAMP' : /NUMBER|FLOAT|DECIMAL|INT/.test(t) ? 'NUMBER' : 'VARCHAR'
const human = s => s.toLowerCase().replaceAll('_', ' ')

function viewSpec(d, cols) {
  return {
    name: d.name, description: d.desc, module_custom_instructions: { sql_generation: RULES },
    tables: Object.entries(d.tables).map(([t, tdesc]) => {
      const cs = cols[t]; if (!cs) throw new Error(`missing table ${t}`)
      return {
        name: t, description: tdesc, base_table: { database: DB, schema: SCHEMA, table: t },
        ...(t === 'CUSTOMERS' ? { primary_key: { columns: ['CUSTOMER_ID'] } } : t === 'NETWORK_SITES' ? { primary_key: { columns: ['SITE_ID'] } } : {}),
        dimensions: cs.filter(([, ty]) => KIND(ty) === 'dim').map(([c, ty]) => ({ name: c.toLowerCase(), expr: c, data_type: SQLT(ty), description: human(c) })),
        time_dimensions: cs.filter(([, ty]) => KIND(ty) === 'time').map(([c, ty]) => ({ name: c.toLowerCase(), expr: c, data_type: SQLT(ty), description: human(c) })),
        facts: cs.filter(([, ty]) => KIND(ty) === 'fact').map(([c, ty]) => ({ name: c.toLowerCase(), expr: c, data_type: SQLT(ty), description: human(c) })),
        metrics: Object.entries(d.metrics[t] || {}).map(([m, expr]) => { const n = cs.some(([c]) => c.toLowerCase() === m) ? `total_${m}` : m; return { name: n, expr, description: human(m) } }),
      }
    }),
    ...(d.rel ? { relationships: d.rel } : {}),
    verified_queries: d.vq.map(([q, sql], i) => ({ name: `${d.name.toLowerCase()}_${i + 1}`, question: q, sql, use_as_onboarding_question: i === 0 })),
  }
}

if (process.argv[2] === 'views') {
  const cols = columns()
  for (const d of D) {
    const file = path.join(OUT, `${d.name}.sv.yaml`)
    run('cortex', ['agent-studio', 'sv-write', '--yaml-content', JSON.stringify(viewSpec(d, cols)), '--file-path', file, '--connection', CONN])
    console.log(run('cortex', ['agent-studio', 'sv-deploy', '--file-path', file, '--fqn', `${P}.${d.name}`, '--connection', CONN]).trim().split('\n').slice(-2).join(' '))
  }
} else if (process.argv[2] === 'agent') {
  const route = 'Route: customers, churn, at-risk customers, CLV, NPS, adds/disconnects → CUSTOMER_ANALYTICS; aliv mobile lines, plans, mobile ARPU → MOBILE_ANALYTICS; revenue, plan, EBITDA, capex, service-line mix → FINANCE_ANALYTICS; receivables, overdue debt, collections → BILLING_ANALYTICS; care contacts, complaint themes, CSAT, first-contact resolution → SERVICE_ANALYTICS; sites, homes passed, take-up, 5G coverage, availability, hurricane readiness, generators → NETWORK_ANALYTICS; outages, incidents, MTTR, URCA QoS filing, fraud → OPERATIONS_ANALYTICS; business accounts, pipeline, renewals, win rate → B2B_ANALYTICS; tariffs, bundles, product margin → PRODUCT_ANALYTICS. For multi-domain questions query each tool separately and compare at the same grain; never add pipeline ACV to revenue.'
  const spec = {
    models: { orchestration: 'auto' },
    orchestration: { budget: { seconds: 150, tokens: 20000 } },
    instructions: {
      system: 'You are Cable Bahamas Intelligence, an analyst for the Cable Bahamas group (REV fixed broadband, TV and voice; aliv mobile; business and wholesale) in The Bahamas. All data is a synthetic demo generated from the dashboards the user is looking at, as of 31 October 2026; never present it as real company disclosures. Answer only from tool results; never invent numbers. You may propose actions, but you never execute them: use PROPOSE_ACTION to log a proposal for human approval.',
      orchestration: `${RULES} ${route} When the user asks a follow-up ("and in Freeport?", "by island", "last quarter"), reuse the previous question's metric and change only the filter or grain. If a question is outside the data (e.g. weather forecasts, real share price, personal data), say so and suggest the closest supported question. When the analysis reveals a clear operational next step (e.g. high churn on an island, open P1 outage, overdue B2B debt, hurricane readiness gaps, URCA target misses), call PROPOSE_ACTION once with a short title, a one-sentence detail and a category, then mention in the answer that it awaits approval.`,
      response: 'Lead with the answer in one or two sentences with the key number in bold, stating the period and BSD. Then a short table or bullets with exact values. Then "**What stands out**" with at most three bullets. Then "**Recommended next steps**" with one to three concrete actions (who and what). Keep it under 220 words. Create a native chart automatically for trends (line), rankings and island comparisons (sorted bars). Never chart a single value. Mention that data is synthetic in one short phrase, not a disclaimer paragraph.',
      sample_questions: ['How are we doing this month?', 'Which island has the highest churn?', 'Are there any outages right now?', 'Are we ready for hurricane season?', 'How much debt is more than 60 days overdue?', 'What is the open B2B pipeline?', 'How many mobile subscribers do we have by plan type?'].map(question => ({ question })),
    },
    tools: [
      ...D.map(d => ({ tool_spec: { type: 'cortex_analyst_text_to_sql', name: d.name, description: d.desc } })),
      { tool_spec: { type: 'generic', name: 'PROPOSE_ACTION', description: 'Log a proposed operational action for human approval in ACTION_LOG. Does not execute anything. Returns the new action_id.', input_schema: { type: 'object', properties: { title: { type: 'string', description: 'Short imperative title, e.g. "Run save-desk outreach for Grand Bahama high-risk customers"' }, detail: { type: 'string', description: 'One sentence with the evidence and expected impact' }, category: { type: 'string', description: 'One of: retention, outage, hurricane, collections, b2b, regulatory, pricing, other' } }, required: ['title', 'detail', 'category'] } } },
    ],
    tool_resources: {
      ...Object.fromEntries(D.map(d => [d.name, { semantic_view: `${P}.${d.name}`, execution_environment: { type: 'warehouse', warehouse: 'DC_WAREHOUSE' } }])),
      PROPOSE_ACTION: { type: 'procedure', identifier: `${P}.PROPOSE_ACTION`, execution_environment: { type: 'warehouse', warehouse: 'DC_WAREHOUSE' } },
    },
  }
  const file = path.join(OUT, 'CABLE_BAHAMAS_AGENT.agent.yaml')
  run('cortex', ['agent-studio', 'agent-write', '--yaml-content', JSON.stringify(spec), '--file-path', file, '--connection', CONN])
  for (const fqn of [`${P}.CABLE_BAHAMAS_AGENT`, ...(process.argv[3] === '--mirror' ? ['SNOWFLAKE_INTELLIGENCE.AGENTS.CABLE_BAHAMAS_AGENT'] : [])])
    console.log(fqn, run('cortex', ['agent-studio', 'agent-save', '--file-path', file, '--fqn', fqn, '--connection', CONN]).trim().split('\n').slice(-2).join(' '))
} else {
  console.error('usage: node snowflake/v2/build_specs.cjs views|agent [--mirror]')
  process.exit(1)
}
