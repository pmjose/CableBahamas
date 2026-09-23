import { useState } from 'react'
import { Sparkles, ChevronDown, Lightbulb, Zap, TrendingUp } from 'lucide-react'
import tt from '../i18n/tt'

export type ChartInsightData = { insight: string; action: string; impact: string }

const BLUE = '#FF4438'

// Collapsed-by-default AI widget shown under a chart. Reveals an Insight (what the
// data shows), an Action (what to do) and the Impact (expected business outcome).
export function ChartInsight({ data }: { data: ChartInsightData }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border-t border-black/5 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vfes-dark/60 hover:text-vfes-dark transition"
        aria-expanded={open}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: BLUE }} />
        {tt('AI insight')}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2.5 space-y-2 text-xs text-vfes-dark/80">
          <div className="flex gap-2">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: BLUE }} />
            <div><span className="font-semibold text-vfes-dark">{tt('Insight')}: </span>{tt(data.insight)}</div>
          </div>
          <div className="flex gap-2">
            <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#F59E0B' }} />
            <div><span className="font-semibold text-vfes-dark">{tt('Action')}: </span>{tt(data.action)}</div>
          </div>
          <div className="flex gap-2">
            <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#10B981' }} />
            <div><span className="font-semibold text-vfes-dark">{tt('Impact')}: </span>{tt(data.impact)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartInsight
