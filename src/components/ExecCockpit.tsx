import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, ChevronRight, type LucideIcon } from 'lucide-react'
import { Panel } from './Panel'
import tt from '../i18n/tt'

// ── Domain links: cross-links from an exec cockpit into their detail pages ──
export type DomainLink = { to: string; label: string; metric: string; icon: LucideIcon }

export function DomainGrid({ title, links }: { title: string; links: DomainLink[] }) {
  return (
    <Panel title={title}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((l) => {
          const Icon = l.icon
          return (
            <Link
              key={l.to}
              to={`/portal/${l.to}`}
              className="group rounded-xl border border-black/5 bg-[#fafbfc] hover:border-vfes-red/30 hover:shadow-sm transition p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-vfes-red/10 text-vfes-dark grid place-items-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{tt(l.label)}</div>
                <div className="text-[11px] text-vfes-dark/55 mt-0.5">{tt(l.metric)}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-vfes-dark/30 group-hover:text-vfes-dark transition shrink-0" />
            </Link>
          )
        })}
      </div>
    </Panel>
  )
}

// ── Priorities: the exec's active workstreams with progress ──
export type Priority = { name: string; owner: string; pct: number; status: 'on-track' | 'at-risk' | 'behind' }

function Bar({ pct, status }: { pct: number; status: Priority['status'] }) {
  const color = status === 'on-track' ? 'bg-vfes-red' : status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-[#f3f4f7] rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export function PriorityList({ title, items }: { title: string; items: Priority[] }) {
  return (
    <Panel title={title}>
      <div className="space-y-3">
        {items.map((p) => (
          <div key={tt(p.name)} className="flex items-center gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{tt(p.name)}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt(p.owner)}</div>
            </div>
            <div className="w-24">
              <Bar pct={p.pct} status={p.status} />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                p.status === 'on-track'
                  ? 'bg-emerald-50 text-emerald-700'
                  : p.status === 'at-risk'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {tt(p.status)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ── Watch-list: risks / decisions awaiting the exec ──
export type WatchItem = { text: string; level: 'high' | 'medium' | 'low' }

export function WatchList({ title, items }: { title: string; items: WatchItem[] }) {
  return (
    <Panel title={title} action={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
      <div className="space-y-2">
        {items.map((w, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5 flex items-start gap-2">
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                w.level === 'high' ? 'bg-red-500' : w.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            />
            <span className="text-sm text-vfes-dark/80">{tt(w.text)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ── Agenda strip: the exec's upcoming cadence (board, reviews) ──
export function AgendaList({ title, items }: { title: string; items: { when: string; what: string }[] }) {
  return (
    <Panel title={title}>
      <div className="space-y-1 text-sm">
        {items.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
            <span className="flex items-center gap-2 text-vfes-dark/75">
              <ChevronRight className="w-3 h-3 text-vfes-dark" /> {tt(a.what)}
            </span>
            <span className="font-bold text-vfes-dark/90 shrink-0">{tt(a.when)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
