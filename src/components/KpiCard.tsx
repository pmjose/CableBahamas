import { ReactNode } from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import tt from '../i18n/tt'

type Props = {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  icon?: LucideIcon
  accent?: boolean
  children?: ReactNode
}

export default function KpiCard({ label, value, delta, trend, icon: Icon, accent, children }: Props) {
  return (
    <div className={`rounded-xl p-5 border transition ${
      accent
        ? 'bg-gradient-to-br from-vfes-red to-vfes-red-dark border-vfes-red/30 text-vfes-dark shadow-lg shadow-vfes-red/20'
        : 'bg-white border-black/5 text-vfes-dark shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`text-xs uppercase tracking-widest ${accent ? 'text-white/80' : 'text-vfes-dark/55'}`}>{tt(label)}</div>
        {Icon && <Icon className={`w-4 h-4 ${accent ? 'text-white/85' : 'text-vfes-dark'}`} />}
      </div>
      <div className="text-3xl font-extrabold leading-none">{value}</div>
      {delta && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
          accent
            ? 'text-white/90'
            : trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-vfes-dark/50'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {tt(delta)}
        </div>
      )}
      {children}
    </div>
  )
}
