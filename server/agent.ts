/** Normalises a DATA_AGENT_RUN response into the UI chat contract. */

export interface ChatStep { label: string; detail?: string }
export interface ChatTable { title?: string; columns: string[]; rows: (string | number | null)[][] }
export interface ChatChart { label: string; type: 'bar' | 'line'; x: string; y: string[]; data: Record<string, string | number>[] }
export interface ChatAction {
  id: string
  label: string
  kind: 'workflow' | 'navigate' | 'approval'
  target?: string
  detail?: string
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
}
export interface ChatResult {
  text: string
  steps: ChatStep[]
  sources: string[]
  sql: string[]
  tables: ChatTable[]
  charts: ChatChart[]
  suggestions: string[]
  actions: ChatAction[]
}

const MAX_ROWS = 50
const SEMANTIC_VIEWS = [
  'CUSTOMER_ANALYTICS', 'OPERATIONS_ANALYTICS', 'NETWORK_ANALYTICS', 'FINANCE_ANALYTICS',
  'BILLING_ANALYTICS', 'B2B_ANALYTICS', 'MOBILE_ANALYTICS', 'PRODUCT_ANALYTICS',
]

const DERIVED: Record<string, { kind: 'workflow' | 'navigate'; target: string; label: string }> = {
  CUSTOMER_ANALYTICS: { kind: 'workflow', target: 'churn-retention', label: 'Run save-desk agent' },
  OPERATIONS_ANALYTICS: { kind: 'workflow', target: 'incidents', label: 'Run proactive-care agent' },
  NETWORK_ANALYTICS: { kind: 'navigate', target: 'noc-map', label: 'Open National NOC Map' },
  FINANCE_ANALYTICS: { kind: 'navigate', target: 'cfo', label: 'Open CFO cockpit' },
  BILLING_ANALYTICS: { kind: 'workflow', target: 'revenue-assurance', label: 'Run collections agent' },
  B2B_ANALYTICS: { kind: 'workflow', target: 'company-360', label: 'Run B2B quote-to-order agent' },
  MOBILE_ANALYTICS: { kind: 'navigate', target: 'mobile-ran', label: 'Open Mobile RAN' },
  PRODUCT_ANALYTICS: { kind: 'navigate', target: 'bundle-profitability', label: 'Open Bundle Profitability' },
}

type Obj = Record<string, any>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== 'string') return v
  try { return JSON.parse(v) } catch { return v }
}

/** Maps a tool name onto a known semantic view, if any (tool names may be lower-case or prefixed). */
function semanticView(name: string): string | undefined {
  const up = name.toUpperCase()
  return SEMANTIC_VIEWS.find((v) => up === v || up.endsWith(`.${v}`) || up.includes(v))
}

function cell(v: unknown): string | number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' || typeof v === 'string') return v
  return JSON.stringify(v)
}

function toTable(rs: unknown, title?: string): ChatTable | undefined {
  if (!isObj(rs)) return undefined
  const rowType = rs.resultSetMetaData?.rowType ?? rs.resultSetMetadata?.rowType
  const data = rs.data
  if (!Array.isArray(data)) return undefined
  const columns: string[] = Array.isArray(rowType)
    ? rowType.map((c: Obj, i: number) => String(c?.name ?? `col${i + 1}`))
    : (Array.isArray(data[0]) ? data[0].map((_: unknown, i: number) => `col${i + 1}`) : [])
  const rows = data.slice(0, MAX_ROWS).map((r: unknown) =>
    Array.isArray(r) ? r.map(cell) : isObj(r) ? columns.map((c) => cell(r[c])) : [cell(r)],
  )
  return { ...(title ? { title } : {}), columns, rows }
}

/** Collects every string value under a key named "sql", recursively. */
function collectSql(v: unknown, out: string[], depth = 0): void {
  if (depth > 6 || v === null || typeof v !== 'object') return
  if (Array.isArray(v)) { v.forEach((x) => collectSql(x, out, depth + 1)); return }
  for (const [k, val] of Object.entries(v)) {
    if (k.toLowerCase() === 'sql' && typeof val === 'string' && val.trim()) out.push(val.trim())
    else collectSql(val, out, depth + 1)
  }
}

function num(v: unknown): string | number {
  if (typeof v === 'number') return v
  const n = Number(v)
  return typeof v === 'string' && v.trim() !== '' && Number.isFinite(n) ? n : String(v ?? '')
}

/** Converts a simple vega-lite bar/line spec into the UI chart shape. Returns undefined when unsupported. */
export function vegaToChart(specRaw: unknown): ChatChart | undefined {
  const spec = parseMaybeJson(specRaw)
  if (!isObj(spec)) return undefined
  const layer = Array.isArray(spec.layer) && spec.layer.length ? spec.layer[0] : spec
  const markRaw = layer.mark ?? spec.mark
  const mark = typeof markRaw === 'string' ? markRaw : markRaw?.type
  if (mark !== 'bar' && mark !== 'line') return undefined
  const enc = layer.encoding ?? spec.encoding
  const values = spec.data?.values ?? layer.data?.values
  if (!isObj(enc) || !Array.isArray(values)) return undefined
  let xField: string | undefined = enc.x?.field
  let yField: string | undefined = enc.y?.field
  // Horizontal bars: quantitative on x, category on y.
  if (enc.x?.type === 'quantitative' && enc.y?.type !== 'quantitative') [xField, yField] = [yField, xField]
  if (!xField || !yField) return undefined
  const series: string | undefined = enc.color?.field
  const label = String(spec.title?.text ?? spec.title ?? spec.description ?? `${yField} by ${xField}`)

  if (series && series !== xField) {
    const byX = new Map<string, Record<string, string | number>>()
    const ys: string[] = []
    for (const r of values as Obj[]) {
      const xv = String(r[xField!] ?? '')
      const s = String(r[series] ?? '')
      if (!ys.includes(s)) ys.push(s)
      const row = byX.get(xv) ?? { [xField!]: xv }
      row[s] = num(r[yField!])
      byX.set(xv, row)
    }
    return { label, type: mark, x: xField, y: ys, data: [...byX.values()].slice(0, 500) }
  }
  const data = (values as Obj[]).slice(0, 500).map((r) => ({ [xField!]: String(r[xField!] ?? ''), [yField!]: num(r[yField!]) }))
  return { label, type: mark, x: xField, y: [yField], data }
}

function parseProposedAction(content: unknown): ChatAction | undefined {
  const items = Array.isArray(content) ? content : [content]
  for (const it of items) {
    let payload: unknown = isObj(it) ? (it.json ?? it.text ?? it) : it
    payload = parseMaybeJson(payload)
    // Stored-procedure tools often wrap the return value, e.g. {PROPOSE_ACTION: "{...}"} or {result: ...}.
    for (let i = 0; i < 3 && isObj(payload) && !('action_id' in payload) && !('ACTION_ID' in payload); i++) {
      const vals = Object.values(payload)
      if (vals.length !== 1) {
        const inner = vals.find((v) => isObj(parseMaybeJson(v)))
        if (!inner) break
        payload = parseMaybeJson(inner)
      } else payload = parseMaybeJson(vals[0])
    }
    if (!isObj(payload)) continue
    const id = payload.action_id ?? payload.ACTION_ID
    if (!id) continue
    return {
      id: String(id),
      label: String(payload.title ?? payload.TITLE ?? 'Proposed action'),
      kind: 'approval',
      detail: payload.detail ?? payload.DETAIL ? String(payload.detail ?? payload.DETAIL) : undefined,
      status: 'PENDING_APPROVAL',
    }
  }
  return undefined
}

export function normaliseAgentResponse(raw: unknown, warehouse: string): ChatResult {
  const resp = parseMaybeJson(raw)
  const content: unknown[] = isObj(resp) && Array.isArray(resp.content) ? resp.content : []
  const res: ChatResult = { text: '', steps: [], sources: [], sql: [], tables: [], charts: [], suggestions: [], actions: [] }
  const texts: string[] = []

  for (const item of content) {
    if (!isObj(item)) continue
    switch (item.type) {
      case 'text': {
        const t = typeof item.text === 'string' ? item.text : item.text?.text
        if (t) texts.push(t)
        break
      }
      case 'tool_use': {
        const tu = item.tool_use ?? item
        const name = String(tu.name ?? 'tool')
        const sv = semanticView(name)
        if (sv) {
          res.steps.push({ label: `Queried ${sv}`, detail: 'semantic view' })
          if (!res.sources.includes(sv)) res.sources.push(sv)
        } else if (name === 'system_execute_sql' || /sql/i.test(String(tu.type ?? ''))) {
          res.steps.push({ label: `Ran SQL on ${warehouse}` })
        } else if (/chart/i.test(name)) {
          res.steps.push({ label: 'Built chart' })
        } else {
          res.steps.push({ label: `Called ${name}`, ...(tu.type ? { detail: String(tu.type) } : {}) })
        }
        collectSql(parseMaybeJson(tu.input), res.sql)
        break
      }
      case 'tool_result': {
        const tr = item.tool_result ?? item
        const name = String(tr.name ?? '')
        const trContent = Array.isArray(tr.content) ? tr.content : [tr.content]
        if (name.toUpperCase().includes('PROPOSE_ACTION')) {
          const a = parseProposedAction(trContent)
          if (a && !res.actions.some((x) => x.id === a.id)) res.actions.push(a)
        }
        for (const c of trContent) {
          const json = parseMaybeJson(isObj(c) ? c.json : undefined)
          collectSql(json, res.sql)
          if (name === 'system_execute_sql' && isObj(json) && json.result_set) {
            const t = toTable(json.result_set)
            if (t) res.tables.push(t)
          }
        }
        break
      }
      case 'table': {
        const tb = item.table ?? item
        const t = toTable(tb.result_set ?? tb.resultSet, tb.title)
        if (t) {
          // Prefer the explicit table over a duplicate raw SQL result of the same query.
          res.tables.push(t)
        }
        break
      }
      case 'chart': {
        const ch = item.chart ?? item
        const c = vegaToChart(ch.chart_spec ?? ch.spec)
        if (c) res.charts.push(c)
        break
      }
      case 'suggested_queries': {
        const qs = item.suggested_queries
        if (Array.isArray(qs)) for (const q of qs) {
          const s = typeof q === 'string' ? q : q?.query
          if (s) res.suggestions.push(String(s))
        }
        break
      }
      default:
        break
    }
  }

  res.text = texts.join('\n\n').trim()
  res.sql = [...new Set(res.sql)]
  // If explicit 'table' items exist, drop raw SQL result tables to avoid duplicates.
  const explicit = content.filter((c) => isObj(c) && c.type === 'table').length
  if (explicit > 0) res.tables = res.tables.slice(res.tables.length - explicit)

  let added = 0
  const add = (a: { kind: 'workflow' | 'navigate'; target: string; label: string }) => {
    if (added >= 2) return
    const id = `nav-${a.target}`
    if (res.actions.some((x) => x.id === id)) return
    res.actions.push({ id, ...a })
    added++
  }
  const stormy = /hurricane|storm/i.test(res.text)
  for (const s of res.sources) {
    if (s === 'OPERATIONS_ANALYTICS' && stormy) add({ kind: 'workflow', target: 'noc-map', label: 'Run hurricane response agent' })
    const d = DERIVED[s]
    if (d) add(d)
  }
  return res
}
