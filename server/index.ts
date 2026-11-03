import path from 'node:path'
import express, { type NextFunction, type Request, type Response } from 'express'
import { HttpError, WAREHOUSE, withSession } from './snowflake.js'
import { normaliseAgentResponse } from './agent.js'

const PORT = Number(process.env.PORT || 8080)
const AGENT_FQN = process.env.AGENT_FQN || 'CABLEBAHAMAS_DEMO.ANALYTICS_V2.CABLE_BAHAMAS_AGENT'
const AGENT_TIMEOUT_MS = 170_000
const ACTION_ID_RE = /^[A-Za-z0-9-]{1,64}$/
const DIST = process.env.DIST_DIR || path.resolve(process.cwd(), 'dist')

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

const callerToken = (req: Request) => req.header('Sf-Context-Current-User-Token') || undefined
const wrap = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res).catch(next)

app.get('/api/health', (req, res) => {
  const user = req.header('Sf-Context-Current-User')
  res.json({ ok: true, ...(user ? { user } : {}) })
})

app.get('/api/me', wrap(async (req, res) => {
  const rows = await withSession(callerToken(req), (s) => s.query('SELECT CURRENT_USER() AS U, CURRENT_ROLE() AS R'))
  res.json({ user: rows[0]?.U ?? null, role: rows[0]?.R ?? null })
}))

interface InMsg { role: 'user' | 'assistant'; text: string }

app.post('/api/chat', wrap(async (req, res) => {
  const started = Date.now()
  const msgs = (req.body?.messages ?? []) as InMsg[]
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 50) throw new HttpError(400, 'messages must be a non-empty array (max 50)')
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.text !== 'string' || !m.text.trim() || m.text.length > 20_000) {
      throw new HttpError(400, 'each message needs role user|assistant and non-empty text')
    }
  }
  const request = JSON.stringify({
    messages: msgs.map((m) => ({ role: m.role, content: [{ type: 'text', text: m.text }] })),
    stream: false,
  })
  const raw = await withSession(callerToken(req), async (s) => {
    await s.query(`USE WAREHOUSE IDENTIFIER(?)`, [WAREHOUSE])
    const rows = await s.query('SELECT SNOWFLAKE.CORTEX.DATA_AGENT_RUN(?, ?) AS R', [AGENT_FQN, request], AGENT_TIMEOUT_MS)
    return rows[0]?.R
  })
  res.json({ ...normaliseAgentResponse(raw, WAREHOUSE), ms: Date.now() - started })
}))

const decide = (status: 'APPROVED' | 'REJECTED') => wrap(async (req, res) => {
  const id = String(req.params.id)
  if (!ACTION_ID_RE.test(id)) throw new HttpError(400, 'invalid action id')
  const rows = await withSession(callerToken(req), async (s) => {
    await s.query(`USE WAREHOUSE IDENTIFIER(?)`, [WAREHOUSE])
    return s.query(
      `UPDATE CABLEBAHAMAS_DEMO.ANALYTICS_V2.ACTION_LOG
          SET STATUS = ?, DECIDED_BY = CURRENT_USER(), DECIDED_AT = CURRENT_TIMESTAMP()
        WHERE ACTION_ID = ? AND STATUS = 'PENDING_APPROVAL'`,
      [status, id],
    )
  })
  const updated = Number((rows[0] as Record<string, unknown>)?.['number of rows updated'] ?? 0)
  if (updated === 0) throw new HttpError(409, 'action not found or no longer pending')
  res.json({ id, status })
})
app.post('/api/actions/:id/approve', decide('APPROVED'))
app.post('/api/actions/:id/reject', decide('REJECTED'))

app.use('/api', (_req, res) => { res.status(404).json({ error: 'not found' }) })

// Static SPA: hashed assets are immutable, index.html is never cached.
app.use('/assets', express.static(path.join(DIST, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }))
app.use(express.static(DIST, { index: false, maxAge: '1h' }))
app.get(/.*/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(DIST, 'index.html'))
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof HttpError ? err.status : (err as { status?: number })?.status ?? 500
  const message = err instanceof Error ? err.message : 'internal error'
  if (status >= 500) console.error(`[error] ${status} ${message}`)
  if (!res.headersSent) res.status(status).json({ error: message })
})

const server = app.listen(PORT, '0.0.0.0', () => console.log(`cablebahamas-web listening on :${PORT} (dist=${DIST})`))
server.requestTimeout = 180_000
server.headersTimeout = 185_000
