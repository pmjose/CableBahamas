// Cable Bahamas Intelligence: scripted analytical assistant.
// Every figure is computed from the shared fixtures (scenario, KPI, customer,
// network, B2B) so chat answers always agree with the dashboards. No live
// database is queried; SQL is shown as the governed query the agent would run.
import { COMMERCIAL_BASE, FINANCE, FINANCE_TREND, MONTHLY_REVENUE_LANES, NETWORK_BASE, QUARTER_REVENUE_M, TTM_EBITDA_M, TTM_FCF_M, TTM_REVENUE_M, round } from '../data/scenario'
import { customers } from '../data/customers'
import KPI from '../pages/portal/_kpi_facts'
import CUST from '../pages/portal/_customer_facts'
import NET from '../pages/portal/_network_facts'
import { accounts, arAging } from '../pages/portal/_b2b_data'
import { AGENT_FLOWS } from '../pages/portal/_agent_flows'

export type Block =
  | { kind: 'kpis'; items: { label: string; value: string; note?: string }[] }
  | { kind: 'table'; columns: string[]; rows: (string | number)[][] }
  | { kind: 'chart'; type: 'bar' | 'line'; label: string; data: Record<string, string | number>[]; x: string; y: string[] }

export type Action = {
  label: string
  kind: 'workflow' | 'navigate' | 'alert' | 'export' | 'draft'
  target?: string
  detail?: string
}

export type Reply = {
  intent: string
  title: string
  reasoning: string
  sources: string[]
  sql: string
  value?: string
  blocks: Block[]
  summary: string
  actions: Action[]
  followUps: string[]
  confidence: 'High' | 'Medium' | 'Low'
}

export type Context = { lastIntent?: string; island?: Island }

// ─── Shared facts ────────────────────────────────────────────────────────────
export { ISLANDS, type Island } from '../data/islands'
import { ISLANDS, type Island } from '../data/islands'

const CITY_TO_ISLAND: Record<string, Island> = {
  Nassau: 'New Providence', Freeport: 'Grand Bahama', 'Marsh Harbour': 'Abaco', 'Governors Harbour': 'Eleuthera',
  'George Town': 'Exuma', 'Andros Town': 'Andros', 'Alice Town': 'Other Family Islands',
}

const ISLAND_WORDS: [RegExp, Island][] = [
  [/nassau|new providence|paradise island|cable beach/, 'New Providence'],
  [/freeport|grand bahama|lucaya/, 'Grand Bahama'],
  [/abaco|marsh harbour/, 'Abaco'],
  [/eleuthera|governors harbour|harbour island/, 'Eleuthera'],
  [/exuma|george town/, 'Exuma'],
  [/andros/, 'Andros'],
  [/bimini|alice town|family island|out island|long island|inagua|cat island/, 'Other Family Islands'],
]

type Period = 'month' | 'quarter' | 'ytd' | 'ttm'
const PERIOD_LABEL: Record<Period, string> = { month: 'Oct 2026', quarter: 'Aug–Oct 2026', ytd: 'Jan–Oct 2026', ttm: 'Nov 2025–Oct 2026' }
const PERIOD_MONTHS: Record<Period, number> = { month: 1, quarter: 3, ytd: 10, ttm: 12 }

const V = 'CABLEBAHAMAS_DEMO.ANALYTICS'
const SV = {
  customer: `${V}.CUSTOMER_ANALYTICS`, finance: `${V}.FINANCE_ANALYTICS`, service: `${V}.SERVICE_ANALYTICS`,
  network: `${V}.NETWORK_ANALYTICS`, billing: `${V}.BILLING_ANALYTICS`, b2b: `${V}.B2B_ANALYTICS`, product: `${V}.PRODUCT_ANALYTICS`,
}

const n = (v: number) => v.toLocaleString('en-US')
const bsdM = (v: number) => `BSD ${round(v, 2)}M`
const pct = (v: number, d = 1) => `${round(v, d)}%`
const sumRev = (p: Period) => round(FINANCE_TREND.slice(-PERIOD_MONTHS[p]).reduce((s, m) => s + m.revenue, 0), 2)
const sumEbitda = (p: Period) => round(FINANCE_TREND.slice(-PERIOD_MONTHS[p]).reduce((s, m) => s + m.ebitda, 0), 2)
const islandWhere = (i?: Island) => (i ? `\n  AND island = '${i}'` : '')

type Ent = { q: string; island?: Island; period: Period; byIsland: boolean; customer?: (typeof customers)[number] }

function extract(q: string, ctx: Context): Ent {
  const lc = q.toLowerCase()
  const island = ISLAND_WORDS.find(([re]) => re.test(lc))?.[1] ?? (isFollowUp(lc) ? ctx.island : undefined)
  const period: Period =
    /\b(ytd|year to date|this year|so far this year)\b/.test(lc) ? 'ytd'
      : /\b(ttm|12 months|twelve months|last year|annual|yearly|trend|over time|history)\b/.test(lc) ? 'ttm'
        : /\b(month|mtd|october|oct)\b/.test(lc) ? 'month'
          : 'quarter'
  const byIsland = /\b(by|per|each|across) (island|region|area)|which island|island split|islands\b/.test(lc)
  const customer = customers.find(c => c.name.toLowerCase().split(' ').some(part => part.length > 3 && new RegExp(`\\b${part}\\b`).test(lc)) || lc.includes(c.id.toLowerCase()))
  return { q, island, period, byIsland, customer }
}

const isFollowUp = (lc: string) => /^(and|what about|how about|same|now|then|also|ok|in |for |break|split|by |only|show me that|compare)/.test(lc.trim()) || false

// ─── Intents ─────────────────────────────────────────────────────────────────
type Intent = { id: string; kw: [RegExp, number][]; run: (e: Ent) => Omit<Reply, 'intent' | 'confidence'> }

const go = (label: string, target: string): Action => ({ label, kind: 'navigate', target })
const flow = (id: string, label: string): Action => {
  const f = AGENT_FLOWS.find(x => x.id === id)!
  return { label, kind: 'workflow', target: f.home, detail: f.title }
}
const alert = (label: string, detail: string): Action => ({ label, kind: 'alert', detail })
const exportCsv = (label = 'Export result to CSV'): Action => ({ label, kind: 'export' })
const draft = (label: string, detail: string): Action => ({ label, kind: 'draft', detail })

const INTENTS: Intent[] = [
  {
    id: 'variance',
    kw: [[/driv|why|gap to plan|variance|behind plan|below plan|miss|explain/, 4]],
    run: () => {
      const actual = QUARTER_REVENUE_M
      const plan = round(FINANCE_TREND.slice(-3).reduce((s, m) => s + m.plan, 0), 2)
      const gap = round(plan - actual, 2)
      return {
        title: 'Revenue gap to plan · Aug–Oct 2026',
        reasoning: 'Decomposing the revenue variance to plan by driver: volume, price/mix, outage credits and B2B timing.',
        sources: [SV.finance, SV.customer, SV.service],
        sql: `SELECT driver, SUM(variance_bsd) AS variance\nFROM ${SV.finance}_VARIANCE_BRIDGE\nWHERE month BETWEEN '2026-08-01' AND '2026-10-01'\nGROUP BY driver\nORDER BY variance;`,
        blocks: [{ kind: 'table', columns: ['Driver', 'Variance (BSD M)', 'Comment'], rows: [
          ['Grand Bahama churn above plan', round(-gap * 0.38, 2), 'BTC BSD 40 fibre promo'],
          ['Outage credits (Sep storm)', round(-gap * 0.24, 2), 'Abaco and Grand Bahama'],
          ['B2B installs slipping', round(-gap * 0.22, 2), '3 enterprise sites moved to Q1'],
          ['Mobile ARPU mix', round(-gap * 0.16, 2), 'Prepaid share up'],
          ['Total vs plan', -gap, `Plan ${bsdM(plan)}`],
        ] }],
        summary: `Revenue is **${bsdM(gap)} below plan** for Aug–Oct. The biggest driver is **churn in Grand Bahama** (BTC fibre promotion), then **outage credits** from the September storm and **B2B installs** slipping into Q1.`,
        actions: [flow('save-desk', 'Run save-desk agent in Grand Bahama'), flow('b2b-quote', 'Review slipping B2B installs'), go('Open CFO cockpit', 'cfo')],
        followUps: ['What is driving churn in Grand Bahama?', 'How do we compare with BTC?', 'What is the open B2B pipeline?'],
      }
    },
  },
  {
    id: 'overview',
    kw: [[/how are we doing|overview|summary|snapshot|headline|kpis|brief me|briefing|status of the business|performance|dashboard|state of the business/, 4]],
    run: () => {
      // Rank by losses above the national churn rate, so the briefing names the island that is a problem.
      const worst = [...ISLANDS].sort((a, b) => b.fixedSubs * (b.churnPct - KPI.churnRatePct) - a.fixedSubs * (a.churnPct - KPI.churnRatePct))[0]
      return {
        title: 'Executive briefing · 31 Oct 2026',
        reasoning: 'Pulling headline KPIs across finance, customers, network and risk for the latest closed month.',
        sources: [SV.finance, SV.customer, SV.network, SV.service],
        sql: `SELECT metric, value, vs_plan\nFROM ${V}.EXEC_SCORECARD\nWHERE as_of = '2026-10-31';`,
        blocks: [
          { kind: 'kpis', items: [{ label: 'Revenue (Oct)', value: bsdM(FINANCE.monthlyRevenueM) }, { label: 'EBITDA margin', value: pct(KPI.ebitdaMarginPct) }, { label: 'Fixed subs', value: n(COMMERCIAL_BASE.fixedSubscriptions) }, { label: 'Net adds', value: `+${CUST.netAddsMo}` }] },
          { kind: 'kpis', items: [{ label: 'Churn / mo', value: pct(KPI.churnRatePct) }, { label: 'NPS', value: `+${KPI.nps}` }, { label: 'Uptime 30d', value: pct(KPI.uptime30dPct, 2) }, { label: 'Open P1s', value: '2' }] },
          { kind: 'chart', type: 'line', label: 'Monthly revenue vs plan (BSD M)', x: 'm', y: ['revenue', 'plan'], data: FINANCE_TREND.map(m => ({ m: m.m, revenue: m.revenue, plan: m.plan })) },
        ],
        summary: `October revenue was **${bsdM(FINANCE.monthlyRevenueM)}** at a **${pct(KPI.ebitdaMarginPct)} EBITDA margin**, with +${CUST.netAddsMo} net adds. Three things need attention: **${worst.island} churn at ${pct(worst.churnPct)}** (${n(Math.round(worst.fixedSubs * worst.churnPct / 100))} losses a month, mostly to BTC's fibre promotion), **2 open P1 incidents** (1,140 households in Nassau East), and **generator and fuel gaps on Grand Bahama and Abaco** before the storm season ends.`,
        actions: [flow('outage', 'Run proactive-care agent for Nassau East'), flow('hurricane', 'Run hurricane response agent'), go('Open CEO dashboard', 'executive')],
        followUps: [`What is driving churn in ${worst.island}?`, 'Are there any outages right now?', 'What was revenue this quarter vs plan?'],
      }
    },
  },
  {
    id: 'revenue',
    kw: [[/revenue|sales|turnover|top ?line|income/, 3], [/how much (did|do) we (make|earn)/, 3]],
    run: e => {
      if (e.byIsland || e.island) {
        const rows = ISLANDS.filter(i => !e.island || i.island === e.island).map(i => [i.island, n(i.fixedSubs), `BSD ${round(i.fixedSubs * COMMERCIAL_BASE.fixedArpu / 1e6, 2)}M`])
        const total = round(COMMERCIAL_BASE.fixedSubscriptions * COMMERCIAL_BASE.fixedArpu / 1e6, 2)
        return {
          title: e.island ? `Fixed subscription revenue · ${e.island}` : 'Fixed subscription revenue by island',
          reasoning: `Metric = fixed subscription revenue (subscriptions × ARPU) · grain = island · period = ${PERIOD_LABEL.month}. Group revenue is not booked by island, so the island view uses the fixed lane.`,
          sources: [SV.customer, SV.finance],
          sql: `SELECT island,\n       SUM(active_subscriptions) AS subs,\n       SUM(active_subscriptions * arpu_bsd) AS fixed_revenue_bsd\nFROM ${SV.customer}\nWHERE month = '2026-10-01'${islandWhere(e.island)}\nGROUP BY island\nORDER BY fixed_revenue_bsd DESC;`,
          blocks: [{ kind: 'table', columns: ['Island', 'Fixed subs', 'Monthly fixed revenue'], rows }, ...(e.island ? [] : [{ kind: 'chart' as const, type: 'bar' as const, label: 'Monthly fixed revenue by island (BSD M)', x: 'island', y: ['rev'], data: ISLANDS.map(i => ({ island: i.island.replace('Other Family Islands', 'Other FI'), rev: round(i.fixedSubs * COMMERCIAL_BASE.fixedArpu / 1e6, 2) })) }])],
          summary: e.island
            ? `**${e.island}** generates about **${rows[0][2]} a month** in fixed subscription revenue from ${rows[0][1]} subscriptions.`
            : `New Providence carries **${round(47_800 / COMMERCIAL_BASE.fixedSubscriptions * 100, 0)}%** of fixed revenue. Fixed subscriptions bill about **BSD ${total}M a month** in total; group revenue of ${bsdM(FINANCE.monthlyRevenueM)} also includes mobile, business and wholesale.`,
          actions: [go('Open Finance', 'finance'), go('Open National NOC Map', 'noc-map'), exportCsv()],
          followUps: ['What is EBITDA margin this quarter?', 'Which island has the highest churn?', 'Show revenue by service line'],
        }
      }
      const p = e.period
      const value = p === 'quarter' ? `BSD ${QUARTER_REVENUE_M}M` : p === 'ttm' ? `BSD ${TTM_REVENUE_M}M` : bsdM(sumRev(p))
      const plan = round(FINANCE_TREND.slice(-PERIOD_MONTHS[p]).reduce((s, m) => s + m.plan, 0), 2)
      const actual = p === 'quarter' ? QUARTER_REVENUE_M : p === 'ttm' ? TTM_REVENUE_M : sumRev(p)
      return {
        title: `Group revenue · ${PERIOD_LABEL[p]}`,
        reasoning: `Metric = group revenue · period = ${PERIOD_LABEL[p]} · comparing with plan. Bundles are allocated to lanes once, never double counted.`,
        sources: [SV.finance],
        sql: `SELECT SUM(revenue_bsd) AS revenue,\n       SUM(plan_revenue_bsd) AS plan\nFROM ${SV.finance}\nWHERE month BETWEEN '${p === 'month' ? '2026-10-01' : p === 'quarter' ? '2026-08-01' : p === 'ytd' ? '2026-01-01' : '2025-11-01'}' AND '2026-10-01';`,
        value,
        blocks: [
          { kind: 'kpis', items: [{ label: 'Revenue', value }, { label: 'Plan', value: bsdM(plan) }, { label: 'vs plan', value: pct((actual / plan - 1) * 100) }, { label: 'EBITDA margin', value: pct(KPI.ebitdaMarginPct) }] },
          { kind: 'chart', type: 'line', label: 'Monthly revenue vs plan (BSD M)', x: 'm', y: ['revenue', 'plan'], data: FINANCE_TREND.map(m => ({ m: m.m, revenue: m.revenue, plan: m.plan })) },
        ],
        summary: `Revenue for ${PERIOD_LABEL[p]} is **${value}**, ${actual < plan ? `${pct((1 - actual / plan) * 100)} below` : 'ahead of'} plan. October alone was **${bsdM(FINANCE.monthlyRevenueM)}** with EBITDA of ${bsdM(FINANCE.monthlyEbitdaM)} (${pct(KPI.ebitdaMarginPct)} margin).`,
        actions: [go('Open CFO cockpit', 'cfo'), alert('Alert me if monthly revenue misses plan by more than 3%', 'Owner: you · checks after each monthly close'), exportCsv()],
        followUps: ['Break revenue down by service line', 'Revenue by island', 'What is driving the gap to plan?'],
      }
    },
  },
  {
    id: 'revenue_mix',
    kw: [[/service line|lane|mix|split|breakdown|by product|fixed vs mobile|segment/, 2], [/revenue|sales/, 1]],
    run: () => {
      const total = MONTHLY_REVENUE_LANES.reduce((s, l) => s + l.revenue, 0)
      return {
        title: 'Revenue by service line · Oct 2026',
        reasoning: 'Metric = monthly revenue · grain = service lane · bundles allocated once across fixed and mobile lanes.',
        sources: [SV.finance],
        sql: `SELECT revenue_lane, SUM(revenue_bsd) AS revenue\nFROM ${SV.finance}\nWHERE month = '2026-10-01'\nGROUP BY revenue_lane\nORDER BY revenue DESC;`,
        blocks: [
          { kind: 'table', columns: ['Service line', 'Revenue', 'Share'], rows: MONTHLY_REVENUE_LANES.map(l => [l.lane, bsdM(l.revenue), pct(l.revenue / total * 100, 0)]) },
          { kind: 'chart', type: 'bar', label: 'Monthly revenue by service line (BSD M)', x: 'lane', y: ['revenue'], data: MONTHLY_REVENUE_LANES.map(l => ({ lane: l.lane, revenue: l.revenue })) },
        ],
        summary: `Fixed (FTTH + HFC) is **${bsdM(5)}** of the ${bsdM(total)} month (${pct(5 / total * 100, 0)}); aliv mobile adds ${bsdM(4)}, business fixed ${bsdM(2)} and wholesale ${bsdM(1)}.`,
        actions: [go('Open Bundle Profitability', 'bundle-profitability'), exportCsv()],
        followUps: ['What is fixed vs mobile ARPU?', 'How profitable is REVConnect?', 'Revenue trend over 12 months'],
      }
    },
  },
  {
    id: 'ebitda',
    kw: [[/ebitda|margin|profit|p&l|profitability|operating income/, 3]],
    run: e => {
      const p = e.period
      const eb = p === 'ttm' ? TTM_EBITDA_M : sumEbitda(p)
      return {
        title: `EBITDA · ${PERIOD_LABEL[p]}`,
        reasoning: `Metric = EBITDA and margin · period = ${PERIOD_LABEL[p]} · EBITDA = revenue − COGS − sales & marketing − admin.`,
        sources: [SV.finance],
        sql: `SELECT SUM(revenue_bsd) AS revenue,\n       SUM(ebitda_bsd) AS ebitda,\n       SUM(ebitda_bsd) / SUM(revenue_bsd) AS margin\nFROM ${SV.finance}\nWHERE month >= '${p === 'ttm' ? '2025-11-01' : p === 'ytd' ? '2026-01-01' : p === 'quarter' ? '2026-08-01' : '2026-10-01'}';`,
        value: bsdM(eb),
        blocks: [
          { kind: 'kpis', items: [{ label: 'EBITDA', value: bsdM(eb) }, { label: 'Margin', value: pct(KPI.ebitdaMarginPct) }, { label: 'Net debt / EBITDA', value: `${KPI.netDebtEbitdaX}×` }, { label: 'FCF TTM', value: bsdM(TTM_FCF_M) }] },
          { kind: 'table', columns: ['P&L line (Oct 2026)', 'BSD M'], rows: [['Revenue', FINANCE.monthlyRevenueM], ['Cost of sales', -FINANCE.monthlyCogsM], ['Sales & marketing', -FINANCE.monthlySalesMarketingM], ['Admin', -FINANCE.monthlyAdminM], ['EBITDA', FINANCE.monthlyEbitdaM]] },
        ],
        summary: `EBITDA for ${PERIOD_LABEL[p]} is **${bsdM(eb)}** at a **${pct(KPI.ebitdaMarginPct)} margin**. Leverage is ${KPI.netDebtEbitdaX}× net debt to EBITDA, inside the 3.5× covenant.`,
        actions: [go('Open CFO cockpit', 'cfo'), go('Open Capital & Treasury', 'capital-treasury'), exportCsv()],
        followUps: ['What is our free cash flow?', 'Which bundles have the best margin?', 'How much debt is overdue 60+ days?'],
      }
    },
  },
  {
    id: 'cash',
    kw: [[/cash|fcf|free cash|liquidity|debt|leverage|covenant|treasury|capex/, 3]],
    run: () => ({
      title: 'Cash, capex and leverage',
      reasoning: 'Metrics = operating cash, capex, free cash flow, net debt · period = trailing 12 months.',
      sources: [SV.finance],
      sql: `SELECT SUM(operating_cash_bsd) AS ocf,\n       SUM(capex_bsd) AS capex,\n       SUM(operating_cash_bsd - capex_bsd) AS fcf\nFROM ${SV.finance}\nWHERE month >= '2025-11-01';`,
      value: bsdM(TTM_FCF_M),
      blocks: [
        { kind: 'kpis', items: [{ label: 'FCF TTM', value: bsdM(TTM_FCF_M) }, { label: 'Capex / month', value: bsdM(FINANCE.monthlyCapexM) }, { label: 'Net debt', value: bsdM(FINANCE.netDebtM) }, { label: 'Cash', value: bsdM(FINANCE.cashM) }] },
        { kind: 'chart', type: 'bar', label: 'Monthly free cash flow (BSD M)', x: 'm', y: ['fcf'], data: FINANCE_TREND.map(m => ({ m: m.m, fcf: m.fcf })) },
      ],
      summary: `Free cash flow over the last 12 months is **${bsdM(TTM_FCF_M)}** after about ${bsdM(FINANCE.monthlyCapexM)} of capex a month. Net debt is ${bsdM(FINANCE.netDebtM)} (${KPI.netDebtEbitdaX}× EBITDA) with ${bsdM(FINANCE.cashM)} cash.`,
      actions: [go('Open Capital & Treasury', 'capital-treasury'), go('Open Capacity & Capex', 'capacity-capex'), exportCsv()],
      followUps: ['What is EBITDA margin?', 'Show capex by programme', 'How much debt is overdue 60+ days?'],
    }),
  },
  {
    id: 'subscribers',
    kw: [[/subscriber|subs\b|customers do we have|customer base|how many customers|base size|lines|households|homes passed|penetration|take.?up/, 3], [/mobile|fixed|broadband|convergent/, 1]],
    run: e => {
      const lc = e.q.toLowerCase()
      if (/mobile|aliv/.test(lc) && !e.byIsland && !e.island) {
        return {
          title: 'aliv mobile subscriptions',
          reasoning: 'Metric = active mobile subscriptions · snapshot = 31 Oct 2026.',
          sources: [SV.customer],
          sql: `SELECT COUNT(*) AS mobile_subscriptions\nFROM ${SV.customer}\nWHERE service_type = 'MOBILE'\n  AND status = 'ACTIVE'\n  AND snapshot_date = '2026-10-31';`,
          value: n(COMMERCIAL_BASE.mobileSubscriptions),
          blocks: [{ kind: 'kpis', items: [{ label: 'Mobile subs', value: n(COMMERCIAL_BASE.mobileSubscriptions) }, { label: 'Mobile ARPU', value: `BSD ${COMMERCIAL_BASE.mobileArpu}` }, { label: '5G pop. coverage', value: pct(NET.cov5gPop) }, { label: 'Sites', value: n(NETWORK_BASE.activeSites) }] }],
          summary: `aliv has **${n(COMMERCIAL_BASE.mobileSubscriptions)} mobile subscriptions** at BSD ${COMMERCIAL_BASE.mobileArpu} ARPU. ${n(COMMERCIAL_BASE.convergentHouseholds)} households take both fixed and mobile.`,
          actions: [go('Open Mobile RAN', 'mobile-ran'), go('Open Bundle Propensity', 'bundle-propensity')],
          followUps: ['Mobile subscribers by island', 'Which islands have the weakest 5G coverage?', 'How many households are convergent?'],
        }
      }
      const rows = ISLANDS.filter(i => !e.island || i.island === e.island).map(i => [i.island, n(i.fixedSubs), n(i.mobileSubs), n(i.homesPassed), pct(i.fixedSubs / i.homesPassed * 100, 0)])
      return {
        title: e.island ? `Customer base · ${e.island}` : 'Customer base · 31 Oct 2026',
        reasoning: `Metric = active subscriptions and homes passed · grain = ${e.island ? 'one island' : 'island'} · snapshot = 31 Oct 2026. Subscriptions count services, not unique people.`,
        sources: [SV.customer, SV.network],
        sql: `SELECT island,\n       COUNT_IF(service_type = 'FIXED')  AS fixed_subs,\n       COUNT_IF(service_type = 'MOBILE') AS mobile_subs,\n       MAX(homes_passed)                 AS homes_passed\nFROM ${SV.customer}\nWHERE status = 'ACTIVE'\n  AND snapshot_date = '2026-10-31'${islandWhere(e.island)}\nGROUP BY island\nORDER BY fixed_subs DESC;`,
        value: e.island ? undefined : n(COMMERCIAL_BASE.fixedSubscriptions),
        blocks: [
          ...(e.island ? [] : [{ kind: 'kpis' as const, items: [{ label: 'Fixed subs', value: n(COMMERCIAL_BASE.fixedSubscriptions) }, { label: 'Mobile subs', value: n(COMMERCIAL_BASE.mobileSubscriptions) }, { label: 'Convergent HHs', value: n(COMMERCIAL_BASE.convergentHouseholds) }, { label: 'Homes passed', value: n(NETWORK_BASE.homesPassed) }] }]),
          { kind: 'table', columns: ['Island', 'Fixed subs', 'Mobile subs', 'Homes passed', 'Fixed take-up'], rows },
        ],
        summary: e.island
          ? `**${e.island}** has **${rows[0][1]} fixed** and **${rows[0][2]} mobile** subscriptions, with ${rows[0][4]} take-up of ${rows[0][3]} homes passed.`
          : `We serve **${n(COMMERCIAL_BASE.fixedSubscriptions)} fixed** and **${n(COMMERCIAL_BASE.mobileSubscriptions)} mobile** subscriptions; fixed take-up is ${pct(COMMERCIAL_BASE.fixedSubscriptions / NETWORK_BASE.homesPassed * 100, 0)} of ${n(NETWORK_BASE.homesPassed)} homes passed. Net adds are +${COMMERCIAL_BASE.monthlyNetAdds} a month.`,
        actions: [go('Open Base Management', 'base-management'), go('Open Fixed Access', 'fixed-access'), exportCsv()],
        followUps: ['Which island has the highest churn?', 'What were gross and net adds last month?', 'Where is fibre take-up lowest?'],
      }
    },
  },
  {
    id: 'churn',
    kw: [[/churn|attrition|cancel|disconnect|leaving|lost customers|retention|save desk|save rate|at.?risk/, 3]],
    run: e => {
      const rows = [...ISLANDS].sort((a, b) => b.churnPct - a.churnPct).filter(i => !e.island || i.island === e.island)
        .map(i => [i.island, pct(i.churnPct), n(Math.round(i.fixedSubs * i.churnPct / 100)), `BSD ${n(Math.round(i.fixedSubs * i.churnPct / 100 * COMMERCIAL_BASE.fixedArpu))}`])
      const worst = rows[0]
      return {
        title: e.island ? `Churn · ${e.island}` : 'Fixed churn · Oct 2026',
        reasoning: `Metric = monthly fixed churn rate · grain = island · period = Oct 2026 · revenue at risk = lost subscriptions × fixed ARPU.`,
        sources: [SV.customer, SV.service],
        sql: `SELECT island,\n       SUM(disconnects) / AVG(opening_subs) AS churn_rate,\n       SUM(disconnects) AS losses\nFROM ${SV.customer}\nWHERE month = '2026-10-01'\n  AND service_type = 'FIXED'${islandWhere(e.island)}\nGROUP BY island\nORDER BY churn_rate DESC;`,
        value: e.island ? String(worst[1]) : pct(KPI.churnRatePct),
        blocks: [
          { kind: 'kpis', items: [{ label: 'Monthly churn', value: pct(KPI.churnRatePct) }, { label: 'Losses / month', value: n(CUST.churnLossesMo) }, { label: 'Save-desk rate', value: pct(CUST.saveRatePct, 0) }, { label: 'High-risk book', value: n(CUST.predictedChurnBook) }] },
          { kind: 'table', columns: ['Island', 'Churn / mo', 'Losses / mo', 'MRR lost / mo'], rows },
        ],
        summary: e.island
          ? `**${e.island}** churns **${worst[1]} a month**, about ${worst[2]} fixed subscriptions and ${worst[3]} of MRR.`
          : `Fixed churn is **${pct(KPI.churnRatePct)} a month** (${n(CUST.churnLossesMo)} losses). **${worst[0]}** is highest at ${worst[1]}, mostly repeat outages and BTC fibre promotions. The save desk keeps ${pct(CUST.saveRatePct, 0)} of cancellation calls.`,
        actions: [flow('save-desk', 'Run save-desk agent on high-risk customers'), go('Open Churn & Retention', 'churn-retention'), alert('Alert me if any island churn exceeds 1.5%', 'Owner: you · daily check')],
        followUps: ['Which customers are at highest risk?', 'What is driving churn in Grand Bahama?', 'How much CLV is at risk?'],
      }
    },
  },
  {
    id: 'at_risk',
    kw: [[/at.?risk|high risk|likely to (churn|leave)|who (might|will) (leave|churn)|risky customers|churn risk/, 4]],
    run: e => {
      const list = customers.filter(c => c.churnRisk !== 'Low' && (!e.island || CITY_TO_ISLAND[c.city] === e.island)).sort((a, b) => b.ltv - a.ltv)
      return {
        title: 'Customers at risk of churning',
        reasoning: 'Metric = modelled churn risk · joined with 3-year CLV and recent service issues · showing the Customer 360 sample.',
        sources: [SV.customer, SV.service],
        sql: `SELECT customer_id, name, city, tier, churn_risk, clv_36m, mrr\nFROM ${SV.customer}\nWHERE churn_risk IN ('High', 'Medium')${islandWhere(e.island)}\nORDER BY clv_36m DESC\nLIMIT 20;`,
        blocks: [{ kind: 'table', columns: ['Customer', 'Town', 'Tier', 'Risk', 'CLV (BSD)', 'MRR'], rows: list.map(c => [c.name, c.city, c.tier, c.churnRisk, n(c.ltv), `BSD ${c.mrr}`]) }],
        summary: `Across the base, **${n(CUST.predictedChurnBook)} lines** are flagged high-risk. In the Customer 360 sample, **${list.map(c => `${c.name} (${c.churnRisk})`).join(', ') || 'no customers'}** need attention${list[0] ? `; ${list[0].name} carries the most value at BSD ${n(list[0].ltv)}` : ''}.`,
        actions: [flow('save-desk', 'Run save-desk agent'), go('Open Customer 360', 'customer-360'), draft('Draft retention outreach for the at-risk list', 'SMS + email · respects Data Protection Act consent · queued for care-team approval')],
        followUps: ['Tell me about Daniel Pinder', 'What retention offers work best?', 'Churn by island'],
      }
    },
  },
  {
    id: 'top_customers',
    kw: [[/top|best|most valuable|highest|biggest/, 2], [/customer|clv|lifetime value|ltv|value/, 2]],
    run: e => {
      const list = customers.filter(c => !e.island || CITY_TO_ISLAND[c.city] === e.island).sort((a, b) => b.ltv - a.ltv)
      return {
        title: `Top customers by lifetime value${e.island ? ` · ${e.island}` : ''}`,
        reasoning: `Metric = predicted 36-month CLV · ${e.island ? `island = ${e.island}` : 'all islands'} · Customer 360 sample (fictional records).`,
        sources: [SV.customer],
        sql: `SELECT customer_id, name, city, tier, clv_36m\nFROM ${SV.customer}${e.island ? `\nWHERE island = '${e.island}'` : ''}\nORDER BY clv_36m DESC\nLIMIT 10;`,
        blocks: [{ kind: 'table', columns: ['Customer', 'Town', 'Tier', 'CLV (BSD)', 'Tenure'], rows: list.map(c => [c.name, c.city, c.tier, n(c.ltv), `${c.tenureYears} yrs`]) }],
        summary: list.length
          ? `The fictional Customer 360 sample has ${list.length} customer${list.length > 1 ? 's' : ''}${e.island ? ` in ${e.island}` : ''}: **${list.map(c => c.name).join(', ')}**. ${list[0].name} leads at **BSD ${n(list[0].ltv)}**. The sample is not the entire subscriber base.`
          : `No sample customers are recorded for ${e.island}.`,
        actions: [go('Open Customer 360', 'customer-360'), go('Open CLV Explorer', 'clv'), exportCsv()],
        followUps: list[0] ? [`Tell me about ${list[0].name}`, 'Which customers are at risk?', 'Top customers in Freeport'] : ['Top customers overall'],
      }
    },
  },
  {
    id: 'customer_lookup',
    kw: [],
    run: e => {
      const c = e.customer!
      const open = c.invoices.filter(i => i.status !== 'Paid')
      return {
        title: `Customer 360 · ${c.name}`,
        reasoning: `Entity = customer ${c.id} · joining profile, services, billing, interactions and next-best-action.`,
        sources: [SV.customer, SV.billing, SV.service],
        sql: `SELECT *\nFROM ${SV.customer}\nWHERE customer_id = '${c.id}';`,
        blocks: [
          { kind: 'kpis', items: [{ label: 'Tier', value: c.tier }, { label: 'MRR', value: `BSD ${c.mrr}` }, { label: 'CLV', value: `BSD ${n(c.ltv)}` }, { label: 'Churn risk', value: c.churnRisk }] },
          { kind: 'table', columns: ['Service', 'Detail', 'MRR'], rows: c.services.map(s => [s.name, s.speed ?? s.status, `BSD ${s.mrr}`]) },
        ],
        summary: `**${c.name}** (${c.city}, ${c.tenureYears} yrs, ${c.tier}) pays **BSD ${c.mrr}/month** with ${c.churnRisk.toLowerCase()} churn risk. ${open.length ? `${open.length} invoice${open.length > 1 ? 's are' : ' is'} unpaid.` : 'All invoices are paid.'} Last contact: ${c.interactions[0] ? `${c.interactions[0].topic} via ${c.interactions[0].channel} (${c.interactions[0].sentiment.toLowerCase()})` : 'none'}.${c.recommendations[0] ? ` Next best action: **${c.recommendations[0].title}** (${c.recommendations[0].uplift}).` : ''}`,
        actions: [go('Open in Customer 360', 'customer-360'), ...(c.churnRisk !== 'Low' ? [flow('save-desk', 'Run save-desk agent for this customer')] : []), draft(`Draft offer to ${c.name.split(' ')[0]}: ${c.recommendations[0]?.title ?? 'loyalty thank-you'}`, 'Queued for care-agent approval · consent checked')],
        followUps: ['Which customers are at risk?', 'Top customers by lifetime value', 'What retention offers work best?'],
      }
    },
  },
  {
    id: 'arpu',
    kw: [[/arpu|average revenue per|price per customer|spend per customer/, 4]],
    run: () => ({
      title: 'ARPU · Oct 2026',
      reasoning: 'Metric = average monthly revenue per subscription · grain = service type.',
      sources: [SV.customer, SV.finance],
      sql: `SELECT service_type,\n       SUM(revenue_bsd) / AVG(active_subscriptions) AS arpu,\n       AVG(active_subscriptions) AS subs\nFROM ${SV.customer}\nWHERE month = '2026-10-01'\nGROUP BY service_type;`,
      blocks: [{ kind: 'table', columns: ['Service', 'Monthly ARPU (BSD)', 'Subscriptions'], rows: [['Fixed', COMMERCIAL_BASE.fixedArpu, n(COMMERCIAL_BASE.fixedSubscriptions)], ['Mobile', COMMERCIAL_BASE.mobileArpu, n(COMMERCIAL_BASE.mobileSubscriptions)]] }],
      summary: `Fixed ARPU is **BSD ${COMMERCIAL_BASE.fixedArpu}** and mobile ARPU is **BSD ${COMMERCIAL_BASE.mobileArpu}**. Subscriptions are service counts, not unique people; ${n(COMMERCIAL_BASE.convergentHouseholds)} households take both.`,
      actions: [go('Open Pricing Simulator', 'pricing-simulator'), go('Open Bundle Propensity', 'bundle-propensity')],
      followUps: ['How profitable is REVConnect?', 'What happens if we raise prices by BSD 3?', 'Revenue by service line'],
    }),
  },
  {
    id: 'bundle_margin',
    kw: [[/revconnect|revhome|bundle|convergent/, 3], [/margin|profit|payback|worth/, 2]],
    run: () => ({
      title: 'REVConnect vs broadband-only margin',
      reasoning: 'Metric = true margin per month after content, network and CPE costs · cohort = first 12 months of tenure · bundle = REVConnect vs broadband only.',
      sources: [SV.product],
      sql: `SELECT bundle,\n       AVG(true_margin_per_month) AS avg_margin\nFROM ${SV.product}\nWHERE tenure_month <= 12\n  AND bundle IN ('REVConnect', 'BB_ONLY')\nGROUP BY bundle;`,
      blocks: [
        { kind: 'table', columns: ['Bundle', 'Avg margin / mo', 'vs. baseline'], rows: [['REVConnect (BB + Mobile)', 'BSD 38', '+BSD 14'], ['Broadband only', 'BSD 24', '—']] },
        { kind: 'chart', type: 'line', label: 'Avg true margin / month, first 12 months (BSD)', x: 'm', y: ['REVConnect', 'Broadband only'], data: Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, REVConnect: i < 4 ? 18 + i * 4 : 32 + i, 'Broadband only': 20 + Math.min(i, 4) })) },
      ],
      summary: '**REVConnect customers** generate **BSD 38/month** true margin in their first 12 months, **BSD 14 (58%) more** than broadband-only customers, after content, network and CPE costs.',
      actions: [go('Open Bundle Profitability', 'bundle-profitability'), flow('save-desk', 'Offer REVConnect upgrades through the save desk'), exportCsv()],
      followUps: ['Which customers are most likely to take REVConnect?', 'What is fixed vs mobile ARPU?', 'What happens if we raise prices by BSD 3?'],
    }),
  },
  {
    id: 'pricing',
    kw: [[/price|pricing|elasticity|increase|raise|discount|promo|promotion|tariff/, 3]],
    run: () => ({
      title: 'Price change simulation · REVHome 250 +BSD 3',
      reasoning: 'Scenario = +BSD 3/month on the REVHome 250 Mb tier · existing base · 12-month horizon · uses fitted churn and acquisition elasticities.',
      sources: [SV.product, SV.customer],
      sql: `CALL ${V}.SIMULATE_PRICE_CHANGE(\n  product     => 'REVHOME_250',\n  price_delta => 3,\n  segment     => 'EXISTING',\n  horizon_mo  => 12\n);`,
      blocks: [{ kind: 'table', columns: ['Metric', 'Value'], rows: [['Tier subscriptions', '21,600'], ['Extra churn (12 mo)', '410 subs'], ['Fewer new sign-ups', '140'], ['Revenue uplift / month', '+BSD 61K'], ['12-month net revenue', '+BSD 0.58M']] }],
      summary: 'Raising REVHome 250 by **BSD 3** loses about **410 existing** and **140 new** subscriptions over 12 months, but adds **+BSD 0.58M** net revenue. Risk is concentrated in Grand Bahama, where BTC runs a BSD 40 fibre promotion.',
      actions: [go('Open Pricing Simulator', 'pricing-simulator'), go('Open Price-Response War-game', 'price-wargame'), draft('Draft URCA tariff notice for the change', 'Routed to Regulatory Affairs for review')],
      followUps: ['How would BTC respond?', 'Which islands are most price-sensitive?', 'How profitable is REVConnect?'],
    }),
  },
  {
    id: 'competitor',
    kw: [[/btc|competitor|competition|rival|market share|benchmark|vs\.? (btc|them)/, 4]],
    run: () => ({
      title: 'Competitive position vs BTC',
      reasoning: 'Sources = brand tracker, win/loss and churn reasons · last quarter.',
      sources: [SV.customer, SV.product],
      sql: `SELECT operator, awareness, consideration, preference, nps\nFROM ${SV.customer}_BRAND_TRACKER\nWHERE wave = '2026-Q3'\nORDER BY preference DESC;`,
      blocks: [{ kind: 'table', columns: ['Operator', 'Awareness', 'Preference', 'NPS'], rows: [['Cable Bahamas', '75%', '41%', '+38'], ['BTC', '86%', '36%', '+34'], ['Rival ISP A', '68%', '24%', '+28'], ['Rival ISP B', '54%', '16%', '+22']] }],
      summary: 'Cable Bahamas leads on **preference (41% vs 36%)** and **NPS (+38 vs +34)**, but BTC has an **11-point awareness lead**. BTC\'s BSD 40 fibre promotion is the top churn reason in Grand Bahama.',
      actions: [go('Open CMO view', 'cmo'), go('Open Price-Response War-game', 'price-wargame'), alert('Alert me when BTC changes a published tariff', 'Watches price-intelligence feed daily')],
      followUps: ['What happens if we raise prices by BSD 3?', 'Churn by island', 'Which campaigns work best?'],
    }),
  },
  {
    id: 'b2b',
    kw: [[/b2b|business customers|enterprise|pipeline|deal|account|wholesale|sme|smb|corporate|quote/, 3]],
    run: () => {
      const top = [...accounts].filter(a => a.status !== 'Churned').sort((a, b) => b.arr - a.arr).slice(0, 6)
      return {
        title: 'Business & wholesale',
        reasoning: 'Metrics = open pipeline, top accounts by ARR, renewal and health status.',
        sources: [SV.b2b],
        sql: `SELECT account_name, segment, region, arr_bsd, status, contract_end\nFROM ${SV.b2b}\nWHERE status <> 'Churned'\nORDER BY arr_bsd DESC\nLIMIT 6;`,
        value: `BSD ${KPI.b2bPipelineM}M`,
        blocks: [
          { kind: 'kpis', items: [{ label: 'Open pipeline', value: `BSD ${KPI.b2bPipelineM}M` }, { label: 'Business fixed / mo', value: bsdM(2) }, { label: 'Wholesale / mo', value: bsdM(1) }, { label: 'Accounts', value: n(accounts.length) }] },
          { kind: 'table', columns: ['Account', 'Segment', 'Region', 'ARR', 'Status', 'Renews'], rows: top.map(a => [a.name, a.segment, a.region, `BSD ${round(a.arr / 1e6, 2)}M`, a.status, a.contractEnd]) },
        ],
        summary: `Open B2B pipeline is **BSD ${KPI.b2bPipelineM}M**. The largest accounts are **${top.slice(0, 3).map(a => a.name).join(', ')}**. ${top.filter(a => a.status === 'At Risk' || a.status === 'Watch').length} of the top six are on watch or at risk.`,
        actions: [flow('b2b-quote', 'Run B2B quote-to-order agent'), go('Open Company 360', 'company-360'), exportCsv()],
        followUps: ['Which business accounts renew in the next 6 months?', 'How much debt is overdue 60+ days?', 'Quote fibre for an Exuma resort'],
      }
    },
  },
  {
    id: 'collections',
    kw: [[/overdue|debt|collections|aged|aging|ageing|receivable|bad debt|unpaid|dunning|arrears/, 4]],
    run: () => {
      const total = arAging.reduce((s, b) => s + b.amt, 0)
      const over60 = arAging.filter(b => b.bucket === '61-90' || b.bucket === '90+').reduce((s, b) => s + b.amt, 0)
      return {
        title: 'Receivables ageing · business accounts',
        reasoning: 'Metric = open receivables by days past due · business and wholesale ledger · snapshot 31 Oct 2026.',
        sources: [SV.billing],
        sql: `SELECT ageing_bucket, SUM(open_amount_bsd) AS open_amount\nFROM ${SV.billing}\nWHERE ledger = 'B2B'\n  AND snapshot_date = '2026-10-31'\nGROUP BY ageing_bucket\nORDER BY MIN(days_past_due);`,
        value: `BSD ${round(over60 / 1000, 2)}M`,
        blocks: [
          { kind: 'table', columns: ['Days past due', 'Open (BSD K)', 'Share'], rows: arAging.map(b => [b.bucket, n(b.amt), pct(b.amt / total * 100, 0)]) },
          { kind: 'chart', type: 'bar', label: 'Open receivables by age (BSD K)', x: 'bucket', y: ['amt'], data: arAging.map(b => ({ bucket: b.bucket, amt: b.amt })) },
        ],
        summary: `**BSD ${round(over60 / 1000, 2)}M** of business receivables is more than 60 days overdue (${pct(over60 / total * 100, 0)} of BSD ${round(total / 1000, 1)}M open).`,
        actions: [flow('revenue-assurance', 'Run collections agent'), go('Open Bad Debt & Collections', 'debt-collections'), exportCsv()],
        followUps: ['Is there any billing leakage?', 'Which business accounts are at risk?', 'What is our free cash flow?'],
      }
    },
  },
  {
    id: 'revenue_assurance',
    kw: [[/leakage|revenue assurance|billing error|unbilled|reconcil|billing issue|wrong bill/, 4]],
    run: () => ({
      title: 'Revenue assurance · latest reconciliation',
      reasoning: 'Compare provisioned services with billing records · nightly reconciliation 31 Oct 2026.',
      sources: [SV.billing, SV.product],
      sql: `SELECT p.service_type, COUNT(*) AS unbilled_services\nFROM ${SV.product}_PROVISIONED p\nLEFT JOIN ${SV.billing} b USING (service_id)\nWHERE b.service_id IS NULL\nGROUP BY p.service_type;`,
      blocks: [{ kind: 'table', columns: ['Finding', 'Count', 'Monthly impact'], rows: [['Active TV with no billing record', '318', 'BSD 9.8K'], ['Discount past expiry date', '146', 'BSD 2.1K'], ['Static IP not charged (B2B)', '37', 'BSD 1.3K']] }],
      summary: 'Nightly reconciliation found **501 services** billed incorrectly, worth **BSD 13.2K a month** (about BSD 158K a year). Most come from the August 2026 bundle migration.',
      actions: [flow('revenue-assurance', 'Run revenue assurance agent'), go('Open Revenue Assurance', 'revenue-assurance')],
      followUps: ['How much debt is overdue 60+ days?', 'What is EBITDA margin?', 'Revenue by service line'],
    }),
  },
  {
    id: 'network',
    kw: [[/network|sites?\b|towers?|coverage|5g|4g|lte|signal|uptime|availability|capacity|traffic|bandwidth|speed|peak/, 3]],
    run: e => {
      const rows = ISLANDS.filter(i => !e.island || i.island === e.island).map(i => [i.island, i.sites, pct(i.cov5g, 0), n(i.homesPassed)])
      const weakest = [...ISLANDS].sort((a, b) => a.cov5g - b.cov5g)[0]
      return {
        title: e.island ? `Network · ${e.island}` : 'Network by island',
        reasoning: 'Metrics = active sites, 5G population coverage, homes passed, 30-day availability, national peak traffic.',
        sources: [SV.network],
        sql: `SELECT island,\n       COUNT(DISTINCT site_id) AS sites,\n       AVG(pop_coverage_5g) AS cov_5g,\n       MAX(homes_passed) AS homes_passed\nFROM ${SV.network}\nWHERE status = 'ACTIVE'${islandWhere(e.island)}\nGROUP BY island\nORDER BY sites DESC;`,
        value: n(NETWORK_BASE.activeSites),
        blocks: [
          { kind: 'kpis', items: [{ label: 'Active sites', value: `${NETWORK_BASE.activeSites} (${NETWORK_BASE.ownedSites} owned)` }, { label: 'Uptime 30d', value: pct(KPI.uptime30dPct, 2) }, { label: 'Peak traffic', value: `${KPI.corePeakTbps * 1000} Gbps` }, { label: 'MTTR', value: `${NET.mttrMin} min` }] },
          { kind: 'table', columns: ['Island', 'Sites', '5G coverage', 'Homes passed'], rows },
        ],
        summary: e.island
          ? `**${e.island}** has **${rows[0][1]} sites**, ${rows[0][2]} 5G population coverage and ${rows[0][3]} homes passed.`
          : `We run **${NETWORK_BASE.activeSites} sites** (${NETWORK_BASE.ownedSites} owned, ${NETWORK_BASE.sharedSites} shared) at **${pct(KPI.uptime30dPct, 2)}** availability. National peak is ${KPI.corePeakTbps * 1000} Gbps. **${weakest.island}** has the weakest 5G coverage at ${pct(weakest.cov5g, 0)}.`,
        actions: [go('Open National NOC Map', 'noc-map'), go('Open Network & Engineering', 'network'), alert('Alert me if 30-day availability drops below 99.9%', 'Owner: you · hourly check')],
        followUps: ['Are there any outages right now?', 'Are we ready for hurricane season?', 'Which islands have the weakest 5G coverage?'],
      }
    },
  },
  {
    id: 'outage',
    kw: [[/outage|incident|down\b|offline|fault|alarm|p1|interruption|not working|no service/, 4]],
    run: () => ({
      title: 'Live incidents · 31 Oct 2026',
      reasoning: 'Open incidents ranked by customers affected · correlated with alarms and ticket volume.',
      sources: [SV.service, SV.network],
      sql: `SELECT incident_id, area, service, customers_affected, opened_at, eta\nFROM ${SV.service}\nWHERE status = 'OPEN'\nORDER BY customers_affected DESC;`,
      blocks: [
        { kind: 'kpis', items: [{ label: 'Open P1', value: '2' }, { label: 'Customers affected', value: '1,350' }, { label: 'MTTR (30d)', value: `${NET.mttrMin} min` }, { label: 'SLA credit exposure', value: `BSD ${NET.slaCreditExposureK}K` }] },
        { kind: 'table', columns: ['Incident', 'Area', 'Service', 'Customers', 'ETA'], rows: [['INC-30418', 'Nassau East', 'Broadband (CMTS-07)', '1,140', '2h'], ['INC-30422', 'Freeport', 'Business fibre', '23 accounts', '4h'], ['INC-30425', 'Marsh Harbour', 'TV head-end feed', '187', '1h']] },
      ],
      summary: 'Two P1 incidents are open. The largest is **CMTS-07 in Nassau East**, with **1,140 households** offline and a crew 38 minutes away. 23 Freeport business accounts are inside their SLA window.',
      actions: [flow('outage', 'Run proactive-care agent for INC-30418'), go('Open Incidents', 'incidents'), go('Open War Room', 'war-room')],
      followUps: ['Notify affected customers', 'What is our 30-day uptime?', 'Are we ready for hurricane season?'],
    }),
  },
  {
    id: 'hurricane',
    kw: [[/hurricane|storm|cyclone|weather|nema|disaster|resilien|generator|flood|surge/, 5]],
    run: () => ({
      title: 'Hurricane readiness · 2026 season',
      reasoning: 'Exposure = sites, homes passed and customers inside the forecast cone · readiness = spares, generators, fuel and crews by island.',
      sources: [SV.network, SV.customer],
      sql: `SELECT island,\n       COUNT_IF(backup_power = 'GENERATOR') AS sites_with_generator,\n       COUNT(*) AS sites,\n       SUM(aerial_plant_km) AS aerial_km\nFROM ${SV.network}\nGROUP BY island\nORDER BY aerial_km DESC;`,
      blocks: [{ kind: 'table', columns: ['Island', 'Sites', 'With generator', 'Aerial plant', 'Readiness'], rows: [['New Providence', 96, 94, '310 km', 'Ready'], ['Grand Bahama', 38, 29, '260 km', '9 generators short'], ['Abaco', 22, 19, '150 km', 'Fuel short 3.2k gal'], ['Eleuthera', 18, 17, '90 km', 'Ready'], ['Exuma', 14, 14, '60 km', 'Ready'], ['Andros', 12, 10, '70 km', 'Crew gap'], ['Other Family Islands', 20, 16, '80 km', 'Ferry-dependent']] }],
      summary: 'The network is **ready on four islands**. Gaps: **Grand Bahama is 9 generators short** and **Abaco is short 3.2k gallons of fuel**. Both must ship before ferries stop. Auto-credits for outages over 24 hours are armed.',
      actions: [flow('hurricane', 'Run hurricane response agent'), go('Open National NOC Map', 'noc-map'), draft('Draft pre-storm customer SMS', '18,900 consented customers on Abaco and Grand Bahama · approval by COO')],
      followUps: ['How many customers are on Abaco and Grand Bahama?', 'What is our 30-day uptime?', 'Are there any outages right now?'],
    }),
  },
  {
    id: 'care',
    kw: [[/nps|satisfaction|csat|complaint|call cent|contact cent|tickets?|care\b|customer experience|customer support|support (calls?|tickets?|team)|first contact/, 3]],
    run: () => ({
      title: 'Customer experience · Oct 2026',
      reasoning: 'Metrics = NPS, contacts, first-contact resolution, top complaint themes.',
      sources: [SV.service, SV.customer],
      sql: `SELECT complaint_theme, COUNT(*) AS contacts, AVG(handle_time_min) AS aht\nFROM ${SV.service}\nWHERE month = '2026-10-01'\nGROUP BY complaint_theme\nORDER BY contacts DESC\nLIMIT 5;`,
      blocks: [
        { kind: 'kpis', items: [{ label: 'NPS', value: `+${KPI.nps}` }, { label: 'Contacts / mo', value: '21,400' }, { label: 'First-contact resolution', value: '72%' }, { label: 'Digital share', value: '46%' }] },
        { kind: 'table', columns: ['Theme', 'Contacts', 'Trend'], rows: [['Slow speed / Wi-Fi', '5,900', '↑'], ['Billing question', '4,700', '→'], ['Outage / no service', '3,800', '↓'], ['Cancel / switching to BTC', '1,900', '↑'], ['TV channel issue', '1,600', '→']] },
      ],
      summary: `NPS is **+${KPI.nps}**. **Slow speed and Wi-Fi** is the top contact reason (5,900 a month). Cancellation intent to BTC is rising, mostly in Grand Bahama.`,
      actions: [go('Open Contact Center', 'contact-center'), go('Open Voice of Customer', 'voc'), flow('save-desk', 'Route cancellation intents to the save desk')],
      followUps: ['Churn by island', 'What retention offers work best?', 'Are there any outages right now?'],
    }),
  },
  {
    id: 'retention_offers',
    kw: [[/offer|retention offer|save offer|win.?back|what works|incentive/, 3]],
    run: () => ({
      title: 'Retention offers · save desk performance',
      reasoning: 'Offer acceptance, margin cost and 90-day re-churn by offer type · last 90 days.',
      sources: [SV.customer, SV.product],
      sql: `SELECT offer_type, AVG(accepted) AS accept_rate, AVG(margin_give_bsd) AS cost, AVG(rechurn_90d) AS rechurn\nFROM ${SV.customer}_SAVE_DESK\nWHERE offer_date >= DATEADD('day', -90, '2026-10-31')\nGROUP BY offer_type\nORDER BY accept_rate DESC;`,
      blocks: [{ kind: 'table', columns: ['Offer', 'Accept rate', 'Cost / mo', '90-day re-churn'], rows: [['Speed upgrade, same price', '62%', 'BSD 6', '7%'], ['Outage credit + fix visit', '48%', 'BSD 4', '11%'], ['Add mobile line (REVConnect)', '41%', 'BSD 9', '5%'], ['BSD 10 discount, 6 months', '55%', 'BSD 10', '19%']] }],
      summary: '**Speed upgrades at the same price** win most often (62%) at low cost and low re-churn. Plain discounts are accepted but 19% leave again within 90 days.',
      actions: [flow('save-desk', 'Run save-desk agent'), go('Open Churn & Retention', 'churn-retention')],
      followUps: ['Which customers are at risk?', 'How profitable is REVConnect?', 'Churn by island'],
    }),
  },
  {
    id: 'regulatory',
    kw: [[/urca|regulat|compliance|filing|licen[cs]e|data protection|dpa|privacy|consent|legal/, 4]],
    run: () => ({
      title: 'Regulatory status · URCA and data protection',
      reasoning: 'Upcoming filings, quality-of-service metrics vs URCA targets, open data-protection requests.',
      sources: [SV.service, SV.network],
      sql: `SELECT metric, value, urca_target, meets_target\nFROM ${SV.service}_URCA_QOS\nWHERE quarter = '2026-Q3';`,
      blocks: [{ kind: 'table', columns: ['Item', 'Status', 'Due'], rows: [['URCA QoS filing (Q3)', '12 of 14 metrics on target', '10 Nov 2026'], ['Fault repair time · Family Islands', 'Below target (ferry delays)', 'Remediation plan'], ['Data Protection Act requests', '3 open, all within 30 days', 'Rolling'], ['Hurricane outage notices', 'Template approved', 'On event']] }],
      summary: 'The **Q3 URCA quality-of-service filing** is due 10 Nov with **12 of 14 metrics on target**. The two misses are fault-repair times on Andros and Exuma, caused by ferry delays.',
      actions: [flow('urca-pack', 'Run URCA filing agent'), go('Open URCA / Regulator Pack', 'urca-pack'), go('Open Regulatory & ESG', 'regulatory')],
      followUps: ['Are we ready for hurricane season?', 'What is our 30-day uptime?', 'Are there any outages right now?'],
    }),
  },
  {
    id: 'fraud',
    kw: [[/fraud|scam|sim.?swap|irsf|wangiri|identity|stolen/, 4]],
    run: () => ({
      title: 'Fraud watch · last 30 days',
      reasoning: 'Fraud cases by type, loss avoided and losses incurred.',
      sources: [SV.service, SV.billing],
      sql: `SELECT fraud_type, COUNT(*) AS cases, SUM(loss_avoided_bsd) AS avoided, SUM(loss_bsd) AS lost\nFROM ${SV.service}_FRAUD_CASES\nWHERE opened_at >= DATEADD('day', -30, '2026-10-31')\nGROUP BY fraud_type;`,
      blocks: [{ kind: 'table', columns: ['Type', 'Cases', 'Loss avoided', 'Loss'], rows: [['SIM-swap attempts', '42', 'BSD 61K', 'BSD 0'], ['International revenue share (IRSF)', '28', 'BSD 38K', 'BSD 4.2K'], ['Subscription fraud (new accounts)', '34', 'BSD 25K', 'BSD 6.8K']] }],
      summary: 'Fraud controls avoided **BSD 124K** of loss in 30 days. Actual losses were BSD 11K, mostly subscription fraud on new accounts.',
      actions: [go('Open Fraud & Signaling', 'fraud'), alert('Alert me on any SIM-swap from a new device', 'Real-time · routed to fraud team')],
      followUps: ['How much debt is overdue 60+ days?', 'Is there any billing leakage?'],
    }),
  },
  {
    id: 'marketing',
    kw: [[/campaign|marketing|cac|acquisition cost|conversion|funnel|channel|leads?|digital|website|app/, 3]],
    run: () => ({
      title: 'Acquisition and digital funnel · Oct 2026',
      reasoning: 'Conversion and acquisition cost by channel · last 30 days.',
      sources: [SV.customer, SV.product],
      sql: `SELECT channel, SUM(orders) AS orders, SUM(spend_bsd) / SUM(orders) AS cac, SUM(orders) / SUM(sessions) AS conversion\nFROM ${SV.customer}_ACQUISITION\nWHERE month = '2026-10-01'\nGROUP BY channel\nORDER BY cac;`,
      blocks: [{ kind: 'table', columns: ['Channel', 'Orders', 'CAC', 'Conversion'], rows: [['Web & app', '410', 'BSD 62', '3.1%'], ['Stores', '380', 'BSD 88', '—'], ['Field sales', '190', 'BSD 140', '—'], ['Partners & dealers', '138', 'BSD 105', '—']] }],
      summary: `Digital is the cheapest channel at **BSD 62 per order** and brings 37% of the ${n(CUST.grossAddsMo)} gross adds a month. The biggest checkout drop-off is serviceability checks in the Family Islands.`,
      actions: [go('Open Digital Funnel', 'digital-funnel'), go('Open Marketing', 'marketing')],
      followUps: ['How do we compare with BTC?', 'What were gross and net adds last month?', 'How profitable is REVConnect?'],
    }),
  },
  {
    id: 'adds',
    kw: [[/gross adds|net adds|new customers|sign.?ups|growth|acquisition|connections|installs/, 4]],
    run: () => ({
      title: 'Customer movement · Oct 2026',
      reasoning: 'Fixed gross adds minus disconnects equals net adds · Oct 2026.',
      sources: [SV.customer],
      sql: `SELECT SUM(gross_adds) AS gross_adds, SUM(disconnects) AS losses, SUM(gross_adds - disconnects) AS net_adds\nFROM ${SV.customer}\nWHERE month = '2026-10-01' AND service_type = 'FIXED';`,
      value: `+${CUST.netAddsMo}`,
      blocks: [{ kind: 'kpis', items: [{ label: 'Gross adds', value: n(CUST.grossAddsMo) }, { label: 'Losses', value: n(CUST.churnLossesMo) }, { label: 'Net adds', value: `+${CUST.netAddsMo}` }, { label: 'Win-backs', value: n(CUST.winBackMo) }] }],
      summary: `October added **${n(CUST.grossAddsMo)}** fixed subscriptions and lost ${n(CUST.churnLossesMo)}, for **+${CUST.netAddsMo} net adds**. ${n(CUST.winBackMo)} of the adds were win-backs.`,
      actions: [go('Open Base Management', 'base-management'), go('Open Sales', 'sales')],
      followUps: ['Churn by island', 'Which channel has the best CAC?', 'Customer base by island'],
    }),
  },
  {
    id: 'people',
    kw: [[/headcount|employees|staff|people|hr\b|attrition rate|hiring|talent|workforce/, 4]],
    run: () => ({
      title: 'People · Oct 2026',
      reasoning: 'Headcount, regrettable attrition and open roles.',
      sources: ['CABLEBAHAMAS_DEMO.HR.PEOPLE_SV'],
      sql: `SELECT COUNT(*) AS headcount, AVG(regrettable_attrition_12m) AS attrition\nFROM CABLEBAHAMAS_DEMO.HR.PEOPLE_SV\nWHERE status = 'ACTIVE';`,
      blocks: [{ kind: 'kpis', items: [{ label: 'Headcount', value: '1,840' }, { label: 'Regrettable attrition', value: pct(KPI.attritionRegrettablePct) }, { label: 'Total attrition', value: pct(KPI.attritionTotalPct) }, { label: 'eNPS', value: '+14' }] }],
      summary: `Headcount is **1,840** with **${pct(KPI.attritionRegrettablePct)} regrettable attrition**. Network engineering and field technicians on the Family Islands are the hardest roles to fill.`,
      actions: [go('Open CHRO view', 'people')],
      followUps: ['Field crew availability for hurricane season', 'What is EBITDA margin?'],
    }),
  },
  {
    id: 'energy',
    kw: [[/energy|esg|carbon|emission|renewable|solar|sustainab|electricity|power bill|bpl/, 4]],
    run: () => ({
      title: 'Energy and ESG',
      reasoning: 'Network energy use, renewable share and efficiency.',
      sources: [SV.network],
      sql: `SELECT SUM(kwh) / 1e6 AS gwh, SUM(kwh_renewable) / SUM(kwh) AS renewable_share, SUM(kwh) / SUM(gb_carried) AS kwh_per_gb\nFROM ${SV.network}_ENERGY\nWHERE month = '2026-10-01';`,
      blocks: [{ kind: 'kpis', items: [{ label: 'Renewable share', value: pct(NET.renewablePct, 0) }, { label: 'kWh per GB', value: String(NET.kwhPerGb) }, { label: 'Backup generators', value: '199 of 220 sites' }, { label: 'Scope 1+2 vs 2022', value: '-22%' }] }],
      summary: `**${pct(NET.renewablePct, 0)}** of network energy comes from renewables, mainly site solar and battery. Diesel generators remain the hurricane fallback on 199 of 220 sites.`,
      actions: [go('Open Regulatory & ESG', 'regulatory')],
      followUps: ['Are we ready for hurricane season?', 'How many sites do we have by island?'],
    }),
  },
  {
    id: 'agents',
    kw: [[/agent|workflow|automat|agentic|what can you do|help|capabilit/, 4]],
    run: () => ({
      title: 'What I can do',
      reasoning: 'Listing available analytical topics and agentic workflows.',
      sources: Object.values(SV),
      sql: '-- No query needed.',
      blocks: [{ kind: 'table', columns: ['Agentic workflow', 'Triggered by'], rows: AGENT_FLOWS.map(f => [f.title.split(' · ')[0], f.trigger.source]) }],
      summary: 'I answer questions on **revenue, EBITDA, cash, customers, churn, ARPU, bundles, pricing, BTC, B2B, collections, network, outages, hurricanes, care, URCA, fraud, marketing, people and energy**, by island and period. I can also start **seven agentic workflows**, set alerts, draft messages and export results.',
      actions: [go('Open Agentic Workflows', 'agentic-workflows'), flow('hurricane', 'Run hurricane response agent')],
      followUps: ['What was revenue this quarter?', 'Which island has the highest churn?', 'Are we ready for hurricane season?'],
    }),
  },
]

const ISLAND_AWARE = new Set(['revenue', 'subscribers', 'churn', 'at_risk', 'top_customers', 'network'])

const OFF_TOPIC = /\b(weather in|joke|poem|recipe|football|soccer|movie|bitcoin|stock tip|who are you dating)\b/

// ─── Router ──────────────────────────────────────────────────────────────────
export function answer(q: string, ctx: Context = {}): Reply {
  const lc = q.toLowerCase()
  const e = extract(q, ctx)

  if (e.customer && !/top|best|at.?risk|highest/.test(lc)) return finish('customer_lookup', INTENTS.find(i => i.id === 'customer_lookup')!.run(e), 'High')

  const scored = INTENTS.map(i => ({ i, s: i.kw.reduce((sum, [re, w]) => sum + (re.test(lc) ? w : 0), 0) })).sort((a, b) => b.s - a.s)
  let best = scored[0]
  let forced = false
  // Specific intents win ties over broad ones.
  if (/business|b2b|enterprise|account/.test(lc) && /risk|renew|pipeline/.test(lc)) best = scored.find(x => x.i.id === 'b2b')!
  else if (/\boffers?\b|win.?back/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'retention_offers')!)
  else if (/notify|affected|outage|down right now/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'outage')!)
  else if (/at.?risk|\brisk\b.*customer|customer.*\brisk\b|likely to (churn|leave)/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'at_risk')!)
  else if (/(top|best|most valuable|highest).*(customer|clv|lifetime|value)|(customer|clv|lifetime).*(top|best|highest)/.test(lc) && !/churn/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'top_customers')!)
  else if (/revconnect|revhome|bundle/.test(lc) && /margin|profit|payback|worth/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'bundle_margin')!)
  else if (/(service line|lane|mix|split)/.test(lc) && /revenue|sales/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'revenue_mix')!)
  else if (/churn|leav|cancel/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'churn')!)
  else if (/hurricane|storm/.test(lc)) best = (forced = true, scored.find(x => x.i.id === 'hurricane')!)

  const refines = Boolean(e.island || e.byIsland || /\b(month|quarter|ytd|year|ttm|trend|q[1-4])\b/.test(lc) || /^(and|what about|how about|same|now|then|also|break|split|compare|only)\b/.test(lc.trim()))
  if (best.s < 2 && ctx.lastIntent && refines && !OFF_TOPIC.test(lc)) {
    // Island follow-ups on topics without an island dimension fall back to the customer base view.
    const id = (e.island || e.byIsland) && !ISLAND_AWARE.has(ctx.lastIntent) ? 'subscribers' : ctx.lastIntent
    const prev = INTENTS.find(i => i.id === id)
    if (prev) return finish(prev.id, prev.run({ ...e, byIsland: e.byIsland || /island|region/.test(lc) }), 'Medium')
  }
  if (forced) return finish(best.i.id, best.i.run(e), 'High')
  if (best.s >= 2) return finish(best.i.id, best.i.run(e), best.s >= 4 ? 'High' : 'Medium')
  return clarify(q, OFF_TOPIC.test(lc))
}

function finish(intent: string, r: Omit<Reply, 'intent' | 'confidence'>, confidence: Reply['confidence']): Reply {
  return { intent, confidence, ...r }
}

function clarify(q: string, offTopic: boolean): Reply {
  return {
    intent: 'clarify',
    confidence: 'Low',
    title: offTopic ? 'Outside my scope' : 'Let me narrow that down',
    reasoning: offTopic
      ? 'Question is not about Cable Bahamas business data, so no query was run.'
      : `No single metric matched "${q}". Offering the closest governed topics instead of guessing a number.`,
    sources: [],
    sql: '-- No query executed: the question needs a metric, customer, island or period.',
    value: 'No scripted answer',
    blocks: [{ kind: 'kpis', items: [{ label: 'Revenue (Oct)', value: bsdM(FINANCE.monthlyRevenueM) }, { label: 'Fixed subs', value: n(COMMERCIAL_BASE.fixedSubscriptions) }, { label: 'Churn / mo', value: pct(KPI.churnRatePct) }, { label: 'Uptime 30d', value: pct(KPI.uptime30dPct, 2) }] }],
    summary: offTopic
      ? 'I only answer questions about Cable Bahamas data and operations. Here is today\'s snapshot; pick a topic below or ask about revenue, customers, churn, the network, outages or hurricane readiness.'
      : 'I could not tie that to a specific metric, so I have not guessed a number. Here is today\'s snapshot. Try naming a metric (revenue, churn, ARPU), an island, a customer or a period, or pick one of the questions below.',
    actions: [go('Open Agentic Workflows', 'agentic-workflows')],
    followUps: ['What was revenue this quarter?', 'Which island has the highest churn?', 'Are there any outages right now?', 'What can you do?'],
  }
}

// ─── Page suggestions (all answerable) ───────────────────────────────────────
const S: Record<string, string[]> = {
  executive: ['What was revenue this quarter vs plan?', 'What is EBITDA margin?', 'Which island has the highest churn?', 'Are we ready for hurricane season?'],
  cfo: ['What is EBITDA margin this year?', 'What is our free cash flow?', 'Revenue by service line', 'How much debt is overdue 60+ days?'],
  finance: ['Revenue this quarter vs plan', 'Revenue by service line', 'How much debt is overdue 60+ days?', 'Is there any billing leakage?'],
  'customer-360': ['Top customers by lifetime value in Freeport', 'Which customers are at risk?', 'Tell me about Daniel Pinder', 'What retention offers work best?'],
  'churn-retention': ['Which island has the highest churn?', 'Which customers are at risk?', 'What retention offers work best?', 'How do we compare with BTC?'],
  network: ['How many sites do we have by island?', 'Which islands have the weakest 5G coverage?', 'Are there any outages right now?', 'Are we ready for hurricane season?'],
  'noc-map': ['Are there any outages right now?', 'Are we ready for hurricane season?', 'How many sites do we have by island?'],
  incidents: ['Are there any outages right now?', 'What is our 30-day uptime?', 'Are we ready for hurricane season?'],
  b2b: ['What is the open B2B pipeline?', 'How much debt is overdue 60+ days?', 'Quote fibre for an Exuma resort'],
  'company-360': ['What is the open B2B pipeline?', 'Which business accounts are at risk?', 'Quote fibre for an Exuma resort'],
  'pricing-simulator': ['What happens if we raise prices by BSD 3?', 'How do we compare with BTC?', 'What is fixed vs mobile ARPU?'],
  'bundle-profitability': ['How profitable is REVConnect vs broadband only?', 'What is fixed vs mobile ARPU?', 'Revenue by service line'],
  regulatory: ['What is our URCA filing status?', 'Are we ready for hurricane season?', 'How many data protection requests are open?'],
  'urca-pack': ['What is our URCA filing status?', 'What is our 30-day uptime?'],
  fraud: ['What fraud did we stop this month?', 'Is there any billing leakage?'],
  'revenue-assurance': ['Is there any billing leakage?', 'How much debt is overdue 60+ days?'],
  'debt-collections': ['How much debt is overdue 60+ days?', 'Is there any billing leakage?'],
  marketing: ['Which channel has the best CAC?', 'How do we compare with BTC?', 'What were gross and net adds last month?'],
  'mobile-ran': ['How many mobile subscribers do we have?', 'Which islands have the weakest 5G coverage?'],
  'agentic-workflows': ['What can you do?', 'Are we ready for hurricane season?', 'Are there any outages right now?'],
  default: ['What was revenue this quarter?', 'How many customers do we have by island?', 'Which island has the highest churn?', 'Are we ready for hurricane season?'],
}

export function suggestionsFor(pathname: string): string[] {
  const seg = pathname.split('/').filter(Boolean).pop() || 'default'
  return S[seg] ?? S.default
}
