// Benchmarks the live Cable Bahamas agent against the web demo baseline.
// Each case asks a question through SNOWFLAKE.CORTEX.DATA_AGENT_RUN and checks the
// answer text for the values the dashboards show. Results → snowflake/v2/benchmark-results.json
// Run: node snowflake/v2/benchmark.cjs   (uses the PJOSE_AWS3_ADMIN connection)
const { spawnSync } = require('node:child_process')
const { writeFileSync } = require('node:fs')
const path = require('node:path')

const CONN = process.env.SF_CONNECTION || 'PJOSE_AWS3_ADMIN'
const AGENT = 'CABLEBAHAMAS_DEMO.ANALYTICS_V2.CABLE_BAHAMAS_AGENT'

// [question, list of acceptable patterns that must ALL appear (each entry may be an array of alternatives), expected tool]
const CASES = [
  ['How many fixed customers do we have?', [['74,400', '74400', '74.4K']], 'CUSTOMER_ANALYTICS'],
  ['How many fixed customers are in New Providence?', [['47,800', '47800', '47.8K']], 'CUSTOMER_ANALYTICS'],
  ['What was revenue and EBITDA in October 2026?', [['12.0M', '12M', '12,000,000', '12.00M', '12 million'], ['4.5M', '4,500,000', '4.50M', '4.5 million']], 'FINANCE_ANALYTICS'],
  ['What is our EBITDA margin this month?', [['37.5']], 'FINANCE_ANALYTICS'],
  ['What were gross adds, disconnects and net adds in October?', [['1,118', '1118'], ['818'], ['300']], 'CUSTOMER_ANALYTICS'],
  ['Which island has the highest churn this month?', [['Andros', 'Grand Bahama']], 'CUSTOMER_ANALYTICS'],
  ['How many mobile subscribers do we have?', [['180,500', '180500', '180.5K']], 'MOBILE_ANALYTICS'],
  ['How many households are convergent with aliv mobile?', [['39,000', '39000', '39K']], 'CUSTOMER_ANALYTICS'],
  ['How much debt is more than 60 days overdue?', [['1.1M', '1,100,000', '1.10M', '1.1 million']], 'BILLING_ANALYTICS'],
  ['What are total receivables?', [['16.8M', '16,800,000', '16.80M', '16.8 million']], 'BILLING_ANALYTICS'],
  ['How many network sites and homes passed do we have?', [['220'], ['140,000', '140000', '140K']], 'NETWORK_ANALYTICS'],
  ['What was network availability in October?', [['99.94']], 'NETWORK_ANALYTICS'],
  ['Are there any outages right now?', [['INC-30418', 'Nassau East'], ['1,140', '1140']], 'OPERATIONS_ANALYTICS'],
  ['Are we ready for hurricane season?', [['Grand Bahama'], ['generator']], 'NETWORK_ANALYTICS'],
  ['What is our URCA filing status?', [['12'], ['14']], 'OPERATIONS_ANALYTICS'],
  ['What is the open B2B pipeline?', [['4.2M', '4,200,000', '4.20M', '4.2 million']], 'B2B_ANALYTICS'],
  ['What were the top reasons customers contacted us this month?', [['Slow speed', 'Wi-Fi']], 'SERVICE_ANALYTICS'],
  ['How much fraud loss did we avoid this month?', [['124', '124,000', '124K']], 'OPERATIONS_ANALYTICS'],
  ['Which products have the best direct margin?', [['REV']], 'PRODUCT_ANALYTICS'],
  ['What will the weather be in Nassau tomorrow?', [["don't have", 'do not have', 'not available', 'outside', 'no data', 'cannot', "can't", 'not in']], null],
]

function ask(q) {
  const body = JSON.stringify({ messages: [{ role: 'user', content: [{ type: 'text', text: q }] }], stream: false })
  const sql = `SELECT SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${AGENT}', $$${body}$$) AS R`
  const t0 = Date.now()
  const r = spawnSync('snow', ['sql', '-c', CONN, '--enable-templating', 'NONE', '--format', 'JSON', '-q', sql], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 280_000 })
  const ms = Date.now() - t0
  try {
    const v = JSON.parse(JSON.parse(r.stdout.slice(r.stdout.indexOf('[')))[0].R)
    const text = v.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
    const tools = v.content.filter(c => c.type === 'tool_use').map(c => c.tool_use.name)
    return { text, tools, ms }
  } catch (e) { return { text: '', tools: [], ms, error: (r.stderr || r.stdout || String(e)).slice(0, 400) } }
}

const results = []
for (const [q, must, tool] of CASES) {
  const a = ask(q)
  const norm = a.text.replace(/\*\*/g, '')
  const missing = must.filter(alts => !alts.some(p => norm.toLowerCase().includes(p.toLowerCase())))
  // The agent may query via the named semantic view or run governed SQL directly.
  const toolOk = tool === null || a.tools.includes(tool) || a.tools.includes('system_execute_sql')
  const pass = !a.error && missing.length === 0 && toolOk
  results.push({ question: q, pass, ms: a.ms, tools: a.tools, expectedTool: tool, missing: missing.map(m => m[0]), error: a.error, answer: a.text.slice(0, 900) })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${(a.ms / 1000).toFixed(0).padStart(3)}s  ${q}${pass ? '' : `  → missing ${JSON.stringify(missing.map(m => m[0]))} tools ${JSON.stringify(a.tools)}${a.error ? ' ERR ' + a.error.slice(0, 120) : ''}`}`)
}
const passed = results.filter(r => r.pass).length
writeFileSync(path.join(__dirname, 'benchmark-results.json'), JSON.stringify({ agent: AGENT, runAt: new Date().toISOString(), passed, total: results.length, results }, null, 2))
console.log(`\n${passed}/${results.length} passed`)
