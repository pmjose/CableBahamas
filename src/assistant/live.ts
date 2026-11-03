// Live client for the Cable Bahamas Cortex Agent backend (same origin, SPCS).
// Only used when VITE_CHAT_MODE === 'live'; the offline build never calls it.

export const IS_LIVE = import.meta.env.VITE_CHAT_MODE === 'live'

export type ChatMessage = { role: 'user' | 'assistant'; text: string }
export type LiveStep = { label: string; detail?: string }
export type LiveTable = { title?: string; columns: string[]; rows: (string | number | null)[][] }
export type LiveChart = { label: string; type: 'bar' | 'line'; x: string; y: string[]; data: Record<string, string | number>[] }
export type LiveAction = { id: string; label: string; kind: 'workflow' | 'navigate' | 'approval'; target?: string; detail?: string; status?: string }
export type LiveReply = {
  text: string
  steps: LiveStep[]
  sources: string[]
  sql: string[]
  tables: LiveTable[]
  charts: LiveChart[]
  suggestions: string[]
  actions: LiveAction[]
  ms: number
}
export type Me = { user: string; role: string }
export type ActionResult = { id: string; status: string }

const TIMEOUT_MS = 180_000
const ROLE = 'CABLE_BAHAMAS_VIEWER'

export class LiveError extends Error {
  constructor(message: string, public status?: number) { super(message) }
}

function friendly(status: number, serverMsg?: string): string {
  if (status === 401 || status === 403) return `You do not have access to the Cable Bahamas agent (role ${ROLE})`
  if (status === 404) return 'The agent service was not found. Check that the backend is deployed.'
  if (status === 408 || status === 504) return 'The agent took too long'
  if (status === 429) return 'The agent is busy right now. Please try again in a moment.'
  if (status >= 500) return serverMsg ? `The agent hit an error: ${serverMsg}` : 'The agent hit an error. Please try again.'
  return serverMsg || `Request failed (${status})`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const ctl = new AbortController()
  const timer = window.setTimeout(() => ctl.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
      signal: ctl.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new LiveError('The agent took too long', 408)
    throw new LiveError('Could not reach the agent. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }
  let body: unknown = null
  try { body = await res.json() } catch { /* non-JSON body */ }
  if (!res.ok) {
    const msg = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : undefined
    throw new LiveError(friendly(res.status, msg), res.status)
  }
  if (body === null) throw new LiveError('The agent returned an unreadable response.')
  return body as T
}

export function me(): Promise<Me> {
  return request<Me>('/api/me')
}

export async function chat(messages: ChatMessage[]): Promise<LiveReply> {
  const r = await request<Partial<LiveReply>>('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })
  return {
    text: r.text ?? '', steps: r.steps ?? [], sources: r.sources ?? [], sql: r.sql ?? [], tables: r.tables ?? [],
    charts: r.charts ?? [], suggestions: r.suggestions ?? [], actions: r.actions ?? [], ms: r.ms ?? 0,
  }
}

export function approve(id: string): Promise<ActionResult> {
  return request<ActionResult>(`/api/actions/${encodeURIComponent(id)}/approve`, { method: 'POST' })
}

export function reject(id: string): Promise<ActionResult> {
  return request<ActionResult>(`/api/actions/${encodeURIComponent(id)}/reject`, { method: 'POST' })
}

// Fully-qualified semantic view name for display.
export function fqSource(s: string): string {
  return s.includes('.') ? s : `CABLEBAHAMAS_DEMO.ANALYTICS_V2.${s}`
}
