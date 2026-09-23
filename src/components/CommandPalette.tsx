import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { GROUPS } from '../pages/portal/_nav'
import tt from '../i18n/tt'

type Flat = { to: string; label: string; group: string; icon: any; badge?: string }

const FLAT: Flat[] = GROUPS.flatMap((g) =>
  g.items.map((it) => ({ to: it.to, label: it.label, group: g.name, icon: it.icon, badge: it.badge })),
)

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Open on ⌘K / Ctrl+K, or via the global event from the top-bar search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return FLAT
    return FLAT.filter((f) => f.label.toLowerCase().includes(s) || f.group.toLowerCase().includes(s) || f.to.includes(s))
  }, [q])

  useEffect(() => { setIdx(0) }, [q])

  const go = (to: string) => {
    setOpen(false)
    navigate(`/portal/${to}`)
  }

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[idx]) go(results[idx].to) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-black/5">
          <Search className="w-4 h-4 text-vfes-dark/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={tt('Jump to any page… (try “churn”, “roaming”, “cortex”)')}
            className="flex-1 py-3.5 text-sm bg-transparent focus:outline-none placeholder-vfes-dark/40"
          />
          <kbd className="text-[10px] font-mono bg-black/5 text-vfes-dark/50 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin py-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-vfes-dark/40">{tt('No pages match')} “{q}”.</div>
          )}
          {results.map((r, i) => {
            const Icon = r.icon
            return (
              <button
                key={r.to}
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(r.to)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === idx ? 'bg-vfes-red/8' : 'hover:bg-black/[0.03]'
                }`}
              >
                <span className={`grid place-items-center w-7 h-7 rounded-lg ${i === idx ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-vfes-dark truncate">{tt(r.label)}</span>
                  <span className="block text-[11px] text-vfes-dark/45 truncate">{tt(r.group)}</span>
                </span>
                {r.badge && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{r.badge}</span>}
                {i === idx && <CornerDownLeft className="w-3.5 h-3.5 text-vfes-dark" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-black/5 text-[10px] text-vfes-dark/45">
          <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> {tt('navigate')}</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> {tt('open')}</span>
          <span className="ml-auto">{results.length} {tt('pages')}</span>
        </div>
      </div>
    </div>
  )
}
