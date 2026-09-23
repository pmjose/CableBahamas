import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import tt from '../../i18n/tt'
import LanguageToggle from '../../components/LanguageToggle'
import { Search, Bell, LogOut, Home, Sparkles, Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import AskTheData from '../../components/AskTheData'
import CommandPalette from '../../components/CommandPalette'
import NotificationsDrawer, { UNREAD_COUNT } from '../../components/NotificationsDrawer'
import ErrorBoundary from '../../components/ErrorBoundary'
import { GROUPS } from './_nav'
import KPI, { fixedSubsM } from './_kpi_facts'

export default function PortalLayout() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(UNREAD_COUNT)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/') }

  // Collapsible nav groups — Leadership open by default, all others collapsed.
  const activeGroup = GROUPS.find((g) => g.items.some((it) => location.pathname === `/portal/${it.to}`))?.name
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Leadership: true })
  const toggleGroup = (name: string) => setOpenGroups((o) => ({ ...o, [name]: !o[name] }))
  // Auto-expand the group that contains the current page so the active item is visible.
  useEffect(() => { if (activeGroup) setOpenGroups((o) => ({ ...o, [activeGroup]: true })) }, [activeGroup])

  // Close the mobile sidebar whenever the route changes
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const onRead = () => setUnread(0)
    window.addEventListener('notifications-read', onRead as EventListener)
    return () => window.removeEventListener('notifications-read', onRead as EventListener)
  }, [])

  return (
    <div className="flex h-screen bg-[#f6f7fb] text-vfes-dark">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-black/5 flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 h-16 flex items-center gap-3 border-b border-black/5">
          <img
            src="/CableBahamas/rev-logo.png"
            alt="REV"
            className="h-7 w-auto"
          />
          <span className="text-vfes-dark text-sm font-bold leading-tight">Cable Bahamas</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-black/5"
            aria-label={tt('Close menu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin" aria-label={tt('Primary')}>
          {GROUPS.map((g) => {
            const open = !!openGroups[g.name]
            return (
            <div key={tt(g.name)}>
              <button
                onClick={() => toggleGroup(g.name)}
                className="w-full flex items-center justify-between px-3 mb-1.5 text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold hover:text-vfes-dark/70 transition"
                aria-expanded={open}
              >
                <span>{t(g.name)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
              </button>
              {open && (
              <div className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon, highlight, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition ${
                        isActive
                          ? 'bg-vfes-red text-vfes-dark shadow-md shadow-vfes-red/25'
                          : 'text-vfes-dark/70 hover:bg-black/5 hover:text-vfes-dark'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 truncate">{t(label)}</span>
                    {highlight && (
                      <span className="text-[9px] font-bold bg-vfes-red/10 text-vfes-dark px-1.5 py-0.5 rounded">★</span>
                    )}
                    {badge && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
              )}
            </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-black/5 space-y-1">
          <Link to="/landing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-vfes-dark/70 hover:bg-black/5 hover:text-vfes-dark">
            <Home className="w-4 h-4" /> {t('Back to site')}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-vfes-dark/70 hover:bg-black/5 hover:text-vfes-dark">
            <LogOut className="w-4 h-4" /> {t('Sign out')}
          </button>
        </div>
        <div className="h-9 bg-vfes-dark text-white flex items-center justify-center gap-2 border-t border-black/10">
          <span className="w-1.5 h-1.5 rounded-full bg-vfes-red animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">{tt('CABLE_BAHAMAS LIVE')}</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-black/5 px-4 md:px-6 flex items-center justify-between gap-3 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-black/5 shrink-0"
            aria-label={tt('Open menu')}
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="relative w-full max-w-md md:w-96 min-w-0 text-left group"
            aria-label={tt('Search or jump to any page…')}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vfes-dark/40" />
            <span className="block w-full bg-[#f3f4f7] group-hover:bg-white border border-transparent group-hover:border-vfes-red/30 rounded-lg pl-9 pr-16 py-2 text-sm text-vfes-dark/40 transition">
              {t('Search or jump to any page…')}
            </span>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-black/10 px-1.5 py-0.5 rounded font-mono text-vfes-dark/50">{tt('⌘K')}</span>
          </button>
          <div className="flex items-center gap-3">
            <LanguageToggle variant="light" />
            <button
              onClick={() => window.dispatchEvent(new Event('open-ask-data'))}
              className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold px-4 py-2 rounded-full shadow shadow-vfes-red/30 flex items-center gap-2 group text-sm"
              aria-label={tt('Ask the data')}
            >
              <Sparkles className="w-4 h-4 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">{t('Ask the data')}</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event('open-notifications'))}
              className="p-2 rounded-lg hover:bg-black/5 relative"
              aria-label={tt('Notifications')}
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-vfes-red text-vfes-dark text-[9px] font-bold grid place-items-center leading-none">{unread}</span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-black/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vfes-red to-vfes-red-dark grid place-items-center text-xs font-bold text-vfes-dark">{tt('PJ')}</div>
              <div className="hidden md:block text-xs leading-tight">
                <div className="font-semibold">{tt('Pieter Knowles')}</div>
                <div className="text-vfes-dark/50">{tt('Admin')}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-2 text-xs bg-amber-50 text-amber-950 border-b border-amber-200">
          Synthetic demo data · baseline 31 May 2026. CEO snapshot, finance headlines and shared subscription/site totals use one baseline. Other panels are independent planning scenarios, not additive company results. No live data or legal guidance.
        </div>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        <Ticker />
      </div>

      <AskTheData />
      <CommandPalette />
      <NotificationsDrawer />
    </div>
  )
}

const TICKER_ITEMS: { label: string; value: string; up?: boolean; down?: boolean }[] = [
  { label: 'Cable Bahamas',           value: 'BSD 26.20',  up: true },
  { label: 'BSD/USD',        value: '1.000' },
  { label: 'BSD/GBP',        value: '0.842',  down: true },
  { label: 'Brent',          value: '$78.2',  up: true },
  { label: 'Subs',           value: `${fixedSubsM}M`,  up: true },
  { label: 'Net adds (Q)',   value: `+${KPI.netAddsQK}K`,  up: true },
  { label: 'Churn',          value: `${KPI.churnRatePct}%`,  up: true },
  { label: 'NPS',            value: `+${KPI.nps}`,    up: true },
  { label: 'Revenue (Q)',    value: `BSD ${KPI.revenueQtrM}M`, up: true },
  { label: 'EBITDA',         value: `BSD ${KPI.ebitdaM}M` },
  { label: 'EBITDA margin',  value: `${KPI.ebitdaMarginPct}%`,  up: true },
  { label: 'FCF TTM',        value: `BSD ${KPI.fcfTtmM}M`,   up: true },
  { label: 'Pipeline B2B',   value: `BSD ${KPI.b2bPipelineM}M`, up: true },
  { label: 'Uptime 30d',     value: `${KPI.uptime30dPct}%`, up: true },
  { label: 'P1 incidents',   value: '2',      down: true },
  { label: 'Freeport outage',    value: 'restored 09:30' },
  { label: 'Network peak',   value: `${KPI.corePeakTbps} Tbps` },
  { label: 'Island Bank (demo) framework',  value: 'WON · BSD 4.2M ARR', up: true },
  { label: 'Benchmark B renewal',    value: 'BSD 18M · CEO sign-off' },
  { label: 'URCA M4',      value: 'response 14d' },
  { label: 'KEV CVEs open',  value: '2 · all in SLA' },
  { label: 'Fraud loss YTD', value: 'BSD 316K',  up: true },
  { label: 'Headcount',      value: '1,840',  up: true },
  { label: 'Attrition 12m',  value: `${KPI.attritionRegrettablePct}%`,   up: true },
  { label: 'eNPS',           value: '+14' },
  { label: 'Net Zero S1+S2', value: '-22%' },
  { label: 'Renewable energy', value: `${KPI.renewablePct}%`,  up: true },
  { label: 'TSR 5-yr',       value: `+${KPI.tsr5yrPct}%`,   up: true },
  { label: 'Credit',         value: KPI.creditRating },
  { label: 'Press sentiment',value: '+68 wk', up: true },
]

function Ticker() {
  return (
    <div className="h-9 bg-vfes-dark text-white border-t border-black/10 flex items-center overflow-hidden relative" aria-hidden="true">
      <div className="flex animate-ticker whitespace-nowrap motion-reduce:animate-none hover:[animation-play-state:paused]">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-5 text-xs">
            <span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">{tt(t.label)}</span>
            <span className="font-bold">{t.value}</span>
            {t.up && <span className="text-emerald-400">▲</span>}
            {t.down && <span className="text-red-400">▼</span>}
            <span className="text-white/20">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
