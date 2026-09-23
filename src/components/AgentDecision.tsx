import { useState } from 'react'
import { Sparkles, ChevronRight, ShieldCheck } from 'lucide-react'
import AgentAction, { AgentResult } from './AgentAction'
import tt from '../i18n/tt'

type Props = {
  /** Hero header, e.g. "Save-desk agent" */
  title: string
  /** Run-button label */
  label: string
  /** Button label while running */
  runningLabel?: string
  /** Ordered step descriptions */
  steps: string[]
  /** Optional ms per step */
  stepMs?: number
  /** Hint shown before the agent is run (reveal-on-click) */
  hint?: string
  /** Rich result card shown after the run completes */
  result: AgentResult
  /** Quantified impact chip, revealed with the result */
  impact?: string
  /** Risk / guardrail chip, revealed with the result */
  risk?: string
  /** Cross-link target (hash route), revealed with the result */
  linkTo?: string
  linkLabel?: string
}

/**
 * Single "agent -> decision" hero following the Customer 360 NBA pattern:
 * the recommendation is the OUTPUT of running the agent. Nothing is shown
 * upfront; on click the agent runs, then reveals the rich result card plus an
 * impact / risk / cross-link footer. One recommendation surface, not two.
 */
export default function AgentDecision({
  title, label, runningLabel, steps, stepMs, hint, result, impact, risk, linkTo, linkLabel,
}: Props) {
  const [done, setDone] = useState(false)

  return (
    <div className="mb-6 rounded-2xl border border-vfes-red/20 bg-gradient-to-br from-vfes-red/5 to-white p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2">
        <Sparkles className="w-3 h-3" /> {tt(title)} · {tt('Cortex')}
      </div>

      <AgentAction
        label={label}
        runningLabel={runningLabel}
        steps={steps}
        stepMs={stepMs}
        result={result}
        onComplete={() => setDone(true)}
      />

      {!done && hint && (
        <div className="mt-2 text-xs text-vfes-dark/55">{tt(hint)}</div>
      )}

      {done && (impact || risk || linkTo) && (
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-xs border-t border-black/5 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            {impact && <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold">{tt('Impact')}: {tt(impact)}</span>}
            {risk && <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold">{tt('Risk')}: {tt(risk)}</span>}
          </div>
          {linkTo && (
            <a href={linkTo} className="inline-flex items-center gap-1 text-vfes-dark font-semibold hover:underline shrink-0">
              {tt(linkLabel || 'Open related view')} <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {done && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-vfes-dark/45">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          {tt('Governed by Cortex Guard · Horizon RBAC & row-access policies · fully audited · human-in-the-loop before any customer-facing action.')}
        </div>
      )}
    </div>
  )
}
