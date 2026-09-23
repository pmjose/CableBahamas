import { ReactNode } from 'react'
import tt from '../i18n/tt'
import { ChartInsight, ChartInsightData } from './ChartInsight'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-vfes-dark">{tt(title)}</h1>
        {subtitle && <p className="text-vfes-dark/55 mt-1">{tt(subtitle)}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Panel({ title, children, action, insight }: { title?: string; children: ReactNode; action?: ReactNode; insight?: ChartInsightData }) {
  return (
    <div className="rounded-xl bg-white border border-black/5 shadow-sm p-5">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt(title)}</h3>
          {action}
        </div>
      )}
      {children}
      {insight && <ChartInsight data={insight} />}
    </div>
  )
}
