import { useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import tt from '../i18n/tt'

export type AgentResultStat = { label: string; value: string }
export type AgentResult = {
  /** Headline line of the result (e.g. the recommendation produced) */
  headline: string
  /** Optional stat chips shown under the headline */
  stats?: AgentResultStat[]
  /** Optional detailed findings — the generated briefing detail */
  findings?: string[]
  /** Optional closing note */
  note?: string
}

type Props = {
  /** Button label when idle */
  label: string
  /** Button label while running */
  runningLabel?: string
  /** Ordered step descriptions shown as they complete */
  steps: string[]
  /** Optional ms per step (default 850) */
  stepMs?: number
  /** Optional result payload shown after the run completes. If omitted, a
   *  generic completion summary is shown so every agent "produces" output. */
  result?: AgentResult
  /** Optional callback fired once when the run finishes. */
  onComplete?: () => void
}

/**
 * Reusable stepped "Run agent" closed-loop runner. Renders a button that,
 * when clicked, reveals each step as completed in sequence, then shows a
 * result card (cosmetic — this is a demo, no backend call is made).
 */
export default function AgentAction({ label, runningLabel, steps, stepMs = 850, result, onComplete }: Props) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)

  const run = () => {
    setRunning(true); setDone(0)
    steps.forEach((_, i) => setTimeout(() => setDone(i + 1), (i + 1) * stepMs))
    setTimeout(() => { setRunning(false); onComplete?.() }, steps.length * stepMs + 500)
  }

  const complete = done === steps.length && steps.length > 0
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <button onClick={run} disabled={running}
        className="text-[11px] font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded hover:bg-vfes-red-dark disabled:opacity-50 flex items-center gap-1">
        <Brain className="w-3 h-3" /> {running ? tt(runningLabel || 'Running agent…') : tt(label)}
      </button>
      {(running || done > 0) && (
        <div className="mt-3 text-xs space-y-1">
          {steps.map((s, i) => (
            <div key={i} className={done >= i + 1 ? 'text-emerald-600 font-semibold' : 'text-vfes-dark/40'}>
              {done >= i + 1 ? '✓' : '○'} {i + 1}. {tt(s)}
            </div>
          ))}
        </div>
      )}
      {complete && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
            <Sparkles className="w-3 h-3" /> {tt('Result')} · {tt('Cortex')} · {ts}
          </div>
          <div className="text-[12px] font-bold text-vfes-dark">
            {result ? tt(result.headline) : tt('Run complete')}
          </div>
          {result?.stats && result.stats.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {result.stats.map((s) => (
                <span key={s.label} className="inline-flex items-baseline gap-1 bg-white border border-emerald-200 rounded px-2 py-0.5">
                  <span className="text-[9px] uppercase tracking-wide text-vfes-dark/50">{tt(s.label)}</span>
                  <span className="text-[12px] font-bold text-emerald-700">{s.value}</span>
                </span>
              ))}
            </div>
          )}
          {result?.findings && result.findings.length > 0 && (
            <div className="mt-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-vfes-dark/45 mb-1">{tt('Generated findings')}</div>
              <ul className="space-y-1">
                {result.findings.map((f, i) => (
                  <li key={i} className="text-[11px] text-vfes-dark/70 flex gap-1.5 leading-snug">
                    <span className="text-emerald-600 mt-0.5">•</span><span>{tt(f)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-[11px] text-vfes-dark/55 mt-2">
            {result?.note ? tt(result.note) : `${steps.length} ${tt('actions executed · output written to workspace · audit logged')}`}
          </div>
        </div>
      )}
    </div>
  )
}
