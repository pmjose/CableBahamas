import { ReactNode } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import tt from '../i18n/tt'

type Props = {
  /** Short headline recommendation */
  title: string
  /** Supporting reasoning line */
  detail: string
  /** Quantified impact, e.g. "+BSD 1.2M EBITDA" */
  impact?: string
  /** Optional risk / downside note */
  risk?: string
  /** Optional cross-link target (hash route, e.g. "#/portal/assurance") */
  linkTo?: string
  linkLabel?: string
  children?: ReactNode
}

/**
 * Consistent "Decision / next-best-action" block used across the
 * Network & Operations cockpit. Renders the so-what -> now-what with
 * quantified impact and an optional cross-link.
 */
export default function DecisionPanel({ title, detail, impact, risk, linkTo, linkLabel, children }: Props) {
  return (
    <div className="rounded-xl border border-vfes-red/20 bg-vfes-red/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-vfes-dark" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark">{tt('Recommended decision')}</span>
      </div>
      <div className="font-bold text-vfes-dark mb-1">{tt(title)}</div>
      <div className="text-sm text-vfes-dark/70">{tt(detail)}</div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {impact && <span className="text-[11px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700">{tt('Impact')}: {tt(impact)}</span>}
        {risk && <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-700">{tt('Risk')}: {tt(risk)}</span>}
      </div>
      {children}
      {linkTo && (
        <a href={linkTo} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-vfes-dark hover:underline">
          {tt(linkLabel || 'Open related view')} <ChevronRight className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
