import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, X, Siren, ShieldAlert, HeartPulse, Wallet, Cpu, Building2,
  Cable, ShieldCheck, CheckCheck, ChevronRight,
} from 'lucide-react'
import tt from '../i18n/tt'

type Severity = 'critical' | 'warning' | 'info'

type Notification = {
  id: string
  severity: Severity
  icon: any
  title: string
  detail: string
  ts: string
  to: string
  cta: string
}

// Alerts feed — grounded in the same facts the live ticker and pages use, so
// the drawer never contradicts the rest of the demo.
export const NOTIFICATIONS: Notification[] = [
  {
    id: 'INC-2031',
    severity: 'critical',
    icon: Siren,
    title: 'SLA breach — INC-2031',
    detail: 'Freeport metro transport ring degraded; 18.4K customer-impacting minutes accruing.',
    ts: '4 min ago',
    to: '/portal/incidents',
    cta: 'Open incident',
  },
  {
    id: 'churn-sev',
    severity: 'critical',
    icon: HeartPulse,
    title: 'Churn spike — Eleuthera',
    detail: 'Fibre churn propensity +0.4pp week-over-week in the Eleuthera cohort. Save-desk capacity check advised.',
    ts: '22 min ago',
    to: '/portal/churn-retention',
    cta: 'Open Churn & Retention',
  },
  {
    id: 'fraud-sim',
    severity: 'warning',
    icon: ShieldAlert,
    title: 'Fraud — SIM-swap attempts',
    detail: '2 high-risk SIM-swap requests flagged by the signaling model; both held for step-up auth.',
    ts: '1 h ago',
    to: '/portal/fraud',
    cta: 'Open Fraud & Signaling',
  },
  {
    id: 'core-5g',
    severity: 'warning',
    icon: Cpu,
    title: '5G Core — latency elevated',
    detail: 'AMF p95 control-plane latency above target in the Nassau region. Auto-scaling triggered.',
    ts: '2 h ago',
    to: '/portal/core-5g',
    cta: 'Open 5G Core Health',
  },
  {
    id: 'collections',
    severity: 'warning',
    icon: Wallet,
    title: 'Payment failures rising',
    detail: 'Failed direct-debit collections +6% vs prior cycle. Dunning workflow re-prioritised by CLV.',
    ts: '3 h ago',
    to: '/portal/debt-collections',
    cta: 'Open Bad Debt & Collections',
  },
  {
    id: 'b2b-win',
    severity: 'info',
    icon: Building2,
    title: 'B2B win — Island Bank (demo) framework',
    detail: 'Island Bank (demo) connectivity framework signed · BSD 0.42M ARR. Provisioning kickoff scheduled.',
    ts: 'Today 09:10',
    to: '/portal/b2b',
    cta: 'Open B2B / Wholesale',
  },
  {
    id: 'peak',
    severity: 'info',
    icon: Cable,
    title: 'Network peak record',
    detail: 'Core backbone hit 0.42 Tbps peak overnight — within headroom, no action required.',
    ts: 'Today 03:40',
    to: '/portal/transport',
    cta: 'Open Transport & Backbone',
  },
  {
    id: 'cve',
    severity: 'info',
    icon: ShieldCheck,
    title: 'Security — KEV CVEs',
    detail: '2 known-exploited CVEs open; both inside remediation SLA. No exposure on internet-facing assets.',
    ts: 'Yesterday',
    to: '/portal/trust-center',
    cta: 'Open Trust Center',
  },
]

export const UNREAD_COUNT = NOTIFICATIONS.filter((n) => n.severity !== 'info').length

const SEV_STYLES: Record<Severity, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700', label: 'Critical' },
  warning: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700', label: 'Warning' },
  info: { dot: 'bg-vfes-red', chip: 'bg-vfes-red/10 text-vfes-dark', label: 'Info' },
}

export default function NotificationsDrawer() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<Set<string>>(new Set())

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('open-notifications', onOpen as EventListener)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('open-notifications', onOpen as EventListener)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const unread = NOTIFICATIONS.filter((n) => !read.has(n.id)).length

  const markAll = () => {
    setRead(new Set(NOTIFICATIONS.map((n) => n.id)))
    window.dispatchEvent(new Event('notifications-read'))
  }

  const openItem = (n: Notification) => {
    setRead((prev) => new Set(prev).add(n.id))
    setOpen(false)
    navigate(n.to)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[61] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-black/5 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-vfes-dark" />
            <span className="font-bold text-vfes-dark">{tt('Notifications')}</span>
            {unread > 0 && (
              <span className="text-[10px] font-bold bg-vfes-red text-vfes-dark px-1.5 py-0.5 rounded-full">{unread} {tt('new')}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs font-semibold text-vfes-dark/55 hover:text-vfes-dark px-2 py-1 rounded-lg hover:bg-black/5"
            >
              <CheckCheck className="w-3.5 h-3.5" /> {tt('Mark all read')}
            </button>
            <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-black/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-black/5">
          {NOTIFICATIONS.map((n) => {
            const sev = SEV_STYLES[n.severity]
            const isRead = read.has(n.id)
            const Icon = n.icon
            return (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-black/[0.03] transition group ${isRead ? 'opacity-60' : ''}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-9 h-9 rounded-lg grid place-items-center ${sev.chip}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isRead && <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${sev.dot}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sev.chip}`}>{tt(sev.label)}</span>
                    <span className="text-[11px] text-vfes-dark/40">{tt(n.ts)}</span>
                  </div>
                  <div className="font-semibold text-sm text-vfes-dark truncate">{tt(n.title)}</div>
                  <div className="text-xs text-vfes-dark/60 mt-0.5 leading-snug">{tt(n.detail)}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-vfes-dark group-hover:underline">
                    {tt(n.cta)} <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t border-black/5 text-[10px] text-vfes-dark/40 shrink-0">
          {tt('Alerts generated by Snowflake Alerts on streaming network, billing & fraud signals.')}
        </div>
      </aside>
    </>
  )
}
