import { useState, useEffect, useRef, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import tt from '../i18n/tt'
import {
  Sparkles, X, Send, Database, CheckCircle2, Loader2, FileCode, Brain, BarChart3 as ChartIcon, ChevronDown, ChevronRight,
  Bot, Bell, Download, PenLine, ArrowUpRight, Play, ShieldCheck, RotateCcw, User,
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { answer, suggestionsFor, type Reply, type Action, type Block, type Context } from '../assistant/engine'

// Legacy adapter used by tests and older callers.
type LegacyAnswer = {
  reasoning: string
  mart: { db: string; schema: string; view: string; columns: string[] }
  sql: string
  result: { type: 'table' | 'value'; columns?: string[]; rows?: (string | number)[][]; value?: string }
  summary: string
}
export function pickAnswer(q: string): LegacyAnswer {
  const r = answer(q)
  const table = r.blocks.find(b => b.kind === 'table') as Extract<Block, { kind: 'table' }> | undefined
  const [db, schema, view] = (r.sources[0] ?? 'DEMO.SCENARIOS.NO_MATCH').split('.')
  return {
    reasoning: r.reasoning,
    mart: { db, schema, view, columns: [] },
    sql: r.sql,
    result: r.value ? { type: 'value', value: r.value } : { type: 'table', columns: table?.columns, rows: table?.rows },
    summary: r.summary.replace(/\*\*/g, ''),
  }
}

type Msg =
  | { role: 'user'; text: string }
  | { role: 'assistant'; reply: Reply; stage: number; ms: number }

const STEPS = [
  { label: 'Understanding the question', icon: Brain },
  { label: 'Choosing semantic views', icon: Database },
  { label: 'Generating governed SQL', icon: FileCode },
  { label: 'Running on DC_WAREHOUSE', icon: Loader2 },
  { label: 'Writing the answer', icon: ChartIcon },
]
const STEP_MS = 320
const COLORS = ['#FF4438', '#222128', '#3B82F6', '#10B981']

export default function AskTheData() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [ctx, setCtx] = useState<Context>({})
  const busy = msgs.some(m => m.role === 'assistant' && m.stage <= STEPS.length)
  const timers = useRef<number[]>([])
  const bottom = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const suggestions = suggestionsFor(location.pathname)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); setOpen(o => !o) }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-ask-data', onOpen as EventListener)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-ask-data', onOpen as EventListener)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const ask = (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    const reply = answer(t, ctx)
    const ms = 900 + Math.round(t.length * 9) % 700
    setCtx({ lastIntent: reply.intent === 'clarify' ? ctx.lastIntent : reply.intent, island: ctx.island })
    setQ('')
    setMsgs(m => [...m, { role: 'user', text: t }, { role: 'assistant', reply, stage: 0, ms }])
    for (let s = 1; s <= STEPS.length + 1; s++) {
      timers.current.push(window.setTimeout(() => {
        setMsgs(m => m.map((x, i) => (i === m.length - 1 && x.role === 'assistant' ? { ...x, stage: s } : x)))
      }, s * STEP_MS))
    }
  }

  const reset = () => { timers.current.forEach(clearTimeout); setMsgs([]); setCtx({}) }

  const go = (path: string) => { setOpen(false); navigate(`/portal/${path}`) }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <aside onClick={e => e.stopPropagation()} className="relative w-full max-w-[640px] h-full bg-[#f7f8fa] shadow-2xl flex flex-col">
            <header className="bg-gradient-to-r from-vfes-red to-vfes-red-dark text-vfes-dark px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-bold leading-tight">{tt('Cable Bahamas Intelligence')}</div>
                <div className="text-[11px] text-vfes-dark/70">{tt('Snowflake Intelligence · Cortex Agent · 7 semantic views · as of 31 Oct 2026')}</div>
              </div>
              {msgs.length > 0 && (
                <button onClick={reset} title={tt('New conversation')} className="p-1.5 rounded-lg hover:bg-black/10"><RotateCcw className="w-4 h-4" /></button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10"><X className="w-4 h-4" /></button>
            </header>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-5">
              {msgs.length === 0 && (
                <div>
                  <div className="rounded-2xl bg-white border border-black/5 p-5 mb-4">
                    <div className="text-sm font-semibold text-vfes-dark">{tt('Ask anything about the business.')}</div>
                    <div className="text-xs text-vfes-dark/60 mt-1">{tt('Revenue, customers, churn, the network, outages, hurricanes, B2B, URCA and more, by island and period. I show my sources and SQL, and propose actions you can approve.')}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Suggested for this page')}</div>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => ask(s)} className="w-full text-left p-3 rounded-xl bg-white border border-black/5 hover:border-vfes-red/40 transition flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-vfes-red shrink-0" /><span className="flex-1">{tt(s)}</span><ChevronRight className="w-4 h-4 text-vfes-dark/30" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m, i) => m.role === 'user'
                ? (
                  <div key={i} className="flex justify-end gap-2">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-vfes-dark text-white px-4 py-2.5 text-sm">{m.text}</div>
                    <div className="w-7 h-7 rounded-full bg-vfes-dark/10 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5" /></div>
                  </div>
                )
                : <AssistantMessage key={i} m={m} onAsk={ask} onGo={go} last={i === msgs.length - 1} />)}
              <div ref={bottom} />
            </div>

            <form onSubmit={e => { e.preventDefault(); ask(q) }} className="shrink-0 p-4 bg-white border-t border-black/5">
              <div className="relative">
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={tt(msgs.length ? 'Ask a follow-up… e.g. "and in Freeport?"' : 'Ask a question about Cable Bahamas…')}
                  className="w-full bg-[#f3f4f7] rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-vfes-red/30"
                />
                <button type="submit" disabled={!q.trim() || busy} className="absolute right-2 top-1/2 -translate-y-1/2 bg-vfes-red disabled:opacity-30 text-vfes-dark p-2 rounded-lg">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-[10px] text-vfes-dark/45 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />{tt('Synthetic demo data · simulated agent, no live database · actions require your approval · ⌘J to toggle')}
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  )
}

function AssistantMessage({ m, onAsk, onGo, last }: { m: Extract<Msg, { role: 'assistant' }>; onAsk: (q: string) => void; onGo: (p: string) => void; last: boolean }) {
  const { reply, stage } = m
  const [trace, setTrace] = useState(false)
  const done = stage > STEPS.length

  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-vfes-red flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-vfes-dark" /></div>
      <div className="flex-1 min-w-0 space-y-3">
        {!done ? (
          <div className="rounded-2xl rounded-tl-sm bg-white border border-black/5 p-3 space-y-1.5">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const state = stage > i + 1 ? 'done' : stage === i + 1 ? 'run' : 'wait'
              return (
                <div key={s.label} className={`flex items-center gap-2 text-xs ${state === 'wait' ? 'opacity-35' : ''}`}>
                  {state === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : state === 'run' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="font-medium">{tt(s.label)}</span>
                  {state === 'done' && i === 1 && reply.sources[0] && <span className="font-mono text-[10px] text-vfes-dark/50 truncate">{reply.sources.map(x => x.split('.').pop()).join(', ')}</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <button onClick={() => setTrace(t => !t)} className="flex items-center gap-1.5 text-[11px] text-vfes-dark/55 hover:text-vfes-dark">
              {trace ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Brain className="w-3 h-3" /> {tt('Thought for')} {(m.ms / 1000).toFixed(1)}s · {reply.sources.length} {tt('sources')} · {tt('confidence')} {tt(reply.confidence)}
            </button>
            {trace && (
              <div className="rounded-xl bg-white border border-black/5 p-3 space-y-2 text-xs">
                <div className="text-vfes-dark/75">{tt(reply.reasoning)}</div>
                {reply.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1">{reply.sources.map(s => <span key={s} className="font-mono text-[10px] bg-[#f3f4f7] px-1.5 py-0.5 rounded">{s}</span>)}</div>
                )}
                <pre className="bg-[#0d0d10] text-emerald-300 text-[11px] p-3 rounded-lg overflow-x-auto leading-relaxed"><code>{reply.sql}</code></pre>
              </div>
            )}

            <div className="rounded-2xl rounded-tl-sm bg-white border border-black/5 p-4 space-y-3">
              <div className="text-sm font-bold text-vfes-dark">{tt(reply.title)}</div>
              <Streamed text={tt(reply.summary)} animate={last} />
              {reply.blocks.map((b, i) => <BlockView key={i} b={b} />)}
            </div>

            {reply.actions.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1.5">{tt('Proposed actions')}</div>
                <div className="space-y-1.5">{reply.actions.map(a => <ActionRow key={a.label} a={a} onGo={onGo} />)}</div>
              </div>
            )}

            {last && reply.followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reply.followUps.map(f => (
                  <button key={f} onClick={() => onAsk(f)} className="text-xs px-3 py-1.5 rounded-full bg-white border border-black/10 hover:border-vfes-red/50 text-vfes-dark/80">{tt(f)}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Streamed({ text, animate }: { text: string; animate: boolean }) {
  const words = text.split(' ')
  const [count, setCount] = useState(animate ? 0 : words.length)
  useEffect(() => {
    if (count >= words.length) return
    const t = window.setTimeout(() => setCount(c => Math.min(words.length, c + 3)), 30)
    return () => clearTimeout(t)
  }, [count, words.length])
  const shown = words.slice(0, count).join(' ')
  return (
    <div className="text-sm text-vfes-dark/85 leading-relaxed">
      {shown.split('**').map((part, i) => (i % 2 ? <strong key={i} className="text-vfes-dark">{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
      {count < words.length && <span className="inline-block w-1.5 h-3.5 bg-vfes-dark/50 ml-0.5 animate-pulse align-middle" />}
    </div>
  )
}

function BlockView({ b }: { b: Block }) {
  if (b.kind === 'kpis') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {b.items.map(k => (
          <div key={k.label} className="rounded-lg bg-[#f7f8fa] px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt(k.label)}</div>
            <div className="text-sm font-extrabold text-vfes-dark mt-0.5">{tt(k.value)}</div>
          </div>
        ))}
      </div>
    )
  }
  if (b.kind === 'table') {
    return (
      <div className="rounded-lg border border-black/5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-[#f7f8fa]">{b.columns.map(c => <th key={c} className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold whitespace-nowrap">{tt(c)}</th>)}</tr></thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} className="border-t border-black/5">{r.map((v, j) => <td key={j} className={`px-3 py-1.5 whitespace-nowrap ${j === 0 ? 'font-semibold' : ''}`}>{tt(String(v))}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  const Chart = b.type === 'bar' ? BarChart : LineChart
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">{tt(b.label)}</div>
      <div className="h-44">
        <ResponsiveContainer>
          <Chart data={b.data}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <XAxis dataKey={b.x} stroke="#999" fontSize={10} />
            <YAxis stroke="#999" fontSize={10} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            {b.y.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {b.y.map((y, i) => b.type === 'bar'
              ? <Bar key={y} dataKey={y} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
              : <Line key={y} type="monotone" dataKey={y} stroke={COLORS[i]} strokeWidth={2} dot={false} strokeDasharray={i ? '4 3' : undefined} />)}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const ACTION_ICON = { workflow: Play, navigate: ArrowUpRight, alert: Bell, export: Download, draft: PenLine }

function ActionRow({ a, onGo }: { a: Action; onGo: (p: string) => void }) {
  const [state, setState] = useState<'idle' | 'confirm' | 'done'>('idle')
  const Icon = ACTION_ICON[a.kind]
  const needsApproval = a.kind === 'alert' || a.kind === 'draft'

  const click = () => {
    if (a.kind === 'navigate' || a.kind === 'workflow') return onGo(a.target!)
    if (needsApproval && state === 'idle') return setState('confirm')
    setState('done')
  }

  return (
    <div className={`rounded-xl border px-3 py-2 bg-white ${state === 'done' ? 'border-emerald-200' : 'border-black/5'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${a.kind === 'workflow' ? 'text-vfes-red' : 'text-vfes-dark/60'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-vfes-dark">{tt(a.label)}</div>
          {a.detail && state !== 'done' && <div className="text-[11px] text-vfes-dark/50 truncate">{tt(a.detail)}</div>}
          {state === 'done' && (
            <div className="text-[11px] text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />
              {tt(a.kind === 'export' ? 'Export prepared · cable_bahamas_result.csv' : a.kind === 'alert' ? 'Alert created · logged in audit trail' : 'Draft queued for approval · logged in audit trail')}
            </div>
          )}
        </div>
        {state === 'idle' && (
          <button onClick={click} className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${a.kind === 'workflow' ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 hover:bg-black/10'}`}>
            {tt(a.kind === 'workflow' ? 'Launch' : a.kind === 'navigate' ? 'Open' : a.kind === 'export' ? 'Export' : 'Review')}
          </button>
        )}
        {state === 'confirm' && (
          <div className="flex gap-1 shrink-0">
            <button onClick={click} className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600 text-white">{tt('Approve')}</button>
            <button onClick={() => setState('idle')} className="text-[11px] px-2 py-1 rounded-full bg-black/5">{tt('Cancel')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
