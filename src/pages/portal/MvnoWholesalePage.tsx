import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2, Radio, Network, TrendingUp, Brain, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Shield, Users, FileText,
  Activity, DollarSign, Wifi, BarChart2,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentDecision from '../../components/AgentDecision'
import AgentAction from '../../components/AgentAction'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, Scatter, ScatterChart, ZAxis,
  Line, LineChart, Area, AreaChart, Pie, PieChart,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const PURPLE = '#7C3AED'
const SLATE = '#94a3b8'

// ── data ──────────────────────────────────────────────────────────────────────
const MVNO_PARTNERS = [
  { partner: 'Litech Mobile', subs: 412000, arpuWhole: 4.2, margin: 38, status: 'growth' },
  { partner: 'BeConnect',   subs: 286000, arpuWhole: 4.8, margin: 42, status: 'growth' },
  { partner: 'EcoSIM',        subs: 198000, arpuWhole: 3.6, margin: 31, status: 'mature' },
  { partner: 'TalkThuis',     subs: 124000, arpuWhole: 5.1, margin: 44, status: 'growth' },
  { partner: 'BudgetCall',    subs:  96000, arpuWhole: 3.1, margin: 24, status: 'decline' },
]

const WHOLESALE_NGA = [
  { product: 'Bitstream NEBA-local', circuits: 84000, revM: 18.2 },
  { product: 'Dark fibre lease',     circuits:  1240, revM: 12.6 },
  { product: 'Duct access (MARCo)',  circuits:  3800, revM:  6.4 },
  { product: 'Backhaul to towers',   circuits:  8600, revM:  9.8 },
]

const TOWER = [
  { metric: 'Owned towers',           value: '8,420', note: 'TowerCo carve-out candidate' },
  { metric: 'Tenancy ratio',          value:  '1.62', note: 'tenants per tower' },
  { metric: 'Build-to-suit pipeline', value:   '340', note: 'next 18 months' },
  { metric: 'Lease revenue',          value:  'BSD 41M', note: 'annualised, 3rd-party' },
]

const ONBOARDING_PIPELINE = [
  { partner: 'MovesTel',   stage: 'Contracting',      daysElapsed: 18, eta: 'Q3 2026', it: 'pending',     risk: 'low' },
  { partner: 'SuriMobile', stage: 'IT Integration',   daysElapsed: 34, eta: 'Q3 2026', it: 'in-progress', risk: 'medium' },
  { partner: 'VivaVoice',  stage: 'UAT',              daysElapsed: 52, eta: 'Q2 2026', it: 'complete',    risk: 'low' },
  { partner: 'NetFlex',    stage: 'Commercial launch', daysElapsed: 67, eta: 'Q2 2026', it: 'complete',    risk: 'low' },
]

const ONBOARDING_MILESTONES = [
  { m: 'Step 1', task: 'NDA & framework agreement',                           done: true },
  { m: 'Step 2', task: 'Technical access provisioning (SIM range, MCC/MNC)', done: true },
  { m: 'Step 3', task: 'IT integration (billing, HLR, portability)',          done: true },
  { m: 'Step 4', task: 'UAT & SIM card testing',                             done: false },
  { m: 'Step 5', task: 'Commercial launch & go-live',                        done: false },
]

const SLA_METRICS = [
  { partner: 'Litech Mobile', uptime: 99.94, callSetup: 97.8, smsDeliv: 99.1, billing: 99.8, status: 'ok' },
  { partner: 'BeConnect',   uptime: 99.91, callSetup: 96.9, smsDeliv: 98.7, billing: 99.5, status: 'ok' },
  { partner: 'EcoSIM',        uptime: 99.72, callSetup: 95.2, smsDeliv: 97.4, billing: 98.1, status: 'warn' },
  { partner: 'TalkThuis',     uptime: 99.96, callSetup: 98.1, smsDeliv: 99.4, billing: 99.9, status: 'ok' },
  { partner: 'BudgetCall',    uptime: 99.61, callSetup: 93.8, smsDeliv: 96.2, billing: 97.3, status: 'breach' },
]

const SLA_TREND = [
  { m: 'Jan', ok: 4, warn: 1, breach: 0 }, { m: 'Feb', ok: 4, warn: 1, breach: 0 },
  { m: 'Mar', ok: 3, warn: 2, breach: 0 }, { m: 'Apr', ok: 3, warn: 1, breach: 1 },
  { m: 'May', ok: 3, warn: 1, breach: 1 }, { m: 'Jun', ok: 3, warn: 1, breach: 1 },
]

const REVENUE_SHARE_DATA = [
  { partner: 'Litech Mobile', baseRevM: 5.1, volBonusM: 0.4, totalM: 5.5, shareRate: 28 },
  { partner: 'BeConnect',   baseRevM: 4.2, volBonusM: 0.6, totalM: 4.8, shareRate: 30 },
  { partner: 'EcoSIM',        baseRevM: 3.1, volBonusM: 0.1, totalM: 3.2, shareRate: 24 },
  { partner: 'TalkThuis',     baseRevM: 2.8, volBonusM: 0.3, totalM: 3.1, shareRate: 32 },
  { partner: 'BudgetCall',    baseRevM: 1.8, volBonusM: 0.0, totalM: 1.8, shareRate: 18 },
]

const REVENUE_SHARE_QUARTERLY = [
  { q: 'Q3 2025', total: 15.2, margin: 34 }, { q: 'Q4 2025', total: 16.8, margin: 35 },
  { q: 'Q1 2026', total: 17.4, margin: 36 }, { q: 'Q2 2026', total: 18.4, margin: 37 },
]

const TARIFF_SCHEDULE = [
  { product: 'Voice (national out)', unit: 'min', floorEur: 0.0012,  currentEur: 0.0018,  regulatory: 'URCA', margin: 33 },
  { product: "Voice (int'l EU)",     unit: 'min', floorEur: 0.0040,  currentEur: 0.0055,  regulatory: 'RLAH', margin: 27 },
  { product: 'Data (4G/5G)',         unit: 'MB',  floorEur: 0.00080, currentEur: 0.00115, regulatory: 'URCA', margin: 30 },
  { product: 'SMS (national)',       unit: 'msg', floorEur: 0.00200, currentEur: 0.00290, regulatory: 'URCA', margin: 29 },
  { product: 'MMS',                  unit: 'msg', floorEur: 0.01200, currentEur: 0.01650, regulatory: 'none', margin: 27 },
  { product: 'VoLTE (HD)',           unit: 'min', floorEur: 0.0014,  currentEur: 0.0022,  regulatory: 'none', margin: 37 },
]

const TRAFFIC_MONTHLY = [
  { m: 'Jan', litech: 42.1, ibconn: 28.6, eco: 18.2, talkhog: 12.4, budget: 8.1 },
  { m: 'Feb', litech: 43.8, ibconn: 29.4, eco: 17.9, talkhog: 13.1, budget: 7.8 },
  { m: 'Mar', litech: 46.2, ibconn: 31.2, eco: 18.4, talkhog: 14.0, budget: 7.4 },
  { m: 'Apr', litech: 48.7, ibconn: 32.8, eco: 18.1, talkhog: 14.8, budget: 7.1 },
  { m: 'May', litech: 51.3, ibconn: 34.6, eco: 17.6, talkhog: 15.7, budget: 6.8 },
  { m: 'Jun', litech: 53.9, ibconn: 36.1, eco: 17.2, talkhog: 16.4, budget: 6.4 },
]

const TRAFFIC_MIX = [
  { name: 'Data (4G/5G)', value: 68 },
  { name: 'Voice',        value: 22 },
  { name: 'SMS/MMS',      value: 10 },
]

const ARPU_TREND = [
  { m: 'Jan', arpu: 3.9 }, { m: 'Feb', arpu: 4.0 }, { m: 'Mar', arpu: 4.1 },
  { m: 'Apr', arpu: 4.1 }, { m: 'May', arpu: 4.2 }, { m: 'Jun', arpu: 4.2 },
]

const TOWER_TENANCY = [
  { q: 'Q3 25', rev: 9.8, tenancy: 1.54 }, { q: 'Q4 25', rev: 10.1, tenancy: 1.57 },
  { q: 'Q1 26', rev: 10.3, tenancy: 1.59 }, { q: 'Q2 26', rev: 10.8, tenancy: 1.62 },
]

const ONBOARD_TTL = [
  { cohort: 'H1 2025', days: 71 }, { cohort: 'H2 2025', days: 65 },
  { cohort: 'Q1 2026', days: 62 }, { cohort: 'Q2 2026', days: 58 },
]

const ML_MARGIN_PRED = [
  { partner: 'Litech',      current: 38, predicted: 40 },
  { partner: 'BeConnect', current: 42, predicted: 43 },
  { partner: 'EcoSIM',      current: 31, predicted: 30 },
  { partner: 'TalkThuis',   current: 44, predicted: 46 },
  { partner: 'BudgetCall',  current: 24, predicted: 19 },
]

// ── tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'mvno' | 'nga' | 'towers' | 'onboarding' | 'sla' | 'revenue-share' | 'tariffs' | 'traffic'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'mvno',          label: 'MVNO Partners',  icon: Radio },
  { id: 'nga',           label: 'NGA Wholesale',  icon: Network },
  { id: 'towers',        label: 'Towers',         icon: Building2 },
  { id: 'onboarding',    label: 'Onboarding',     icon: Users },
  { id: 'sla',           label: 'SLA',            icon: Shield },
  { id: 'revenue-share', label: 'Revenue Share',  icon: DollarSign },
  { id: 'tariffs',       label: 'Tariffs',        icon: FileText },
  { id: 'traffic',       label: 'Traffic',        icon: Activity },
]

export default function MvnoWholesalePage() {
  const { i18n } = useTranslation()

  // ── hooks (≥10) ────────────────────────────────────────────────────────────
  const [tab, setTab]                         = useState<TabId>('mvno')
  const [partnerFilter, setPartnerFilter]     = useState<string>('all')
  const [marginThreshold, setMarginThreshold] = useState<number>(30)
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [trafficView, setTrafficView]         = useState<'data' | 'voice' | 'sms'>('data')
  const [tariffSort, setTariffSort]           = useState<'margin' | 'floor'>('margin')
  const chartRef = useRef<HTMLDivElement>(null)

  const totalSubs = MVNO_PARTNERS.reduce((s, p) => s + p.subs, 0)
  const ngaRev    = WHOLESALE_NGA.reduce((s, p) => s + p.revM, 0)

  // interactive useMemo — recalculates when user changes filter/threshold/sort
  const filteredPartners = useMemo(
    () => partnerFilter === 'all' ? MVNO_PARTNERS : MVNO_PARTNERS.filter(p => p.status === partnerFilter),
    [partnerFilter],
  )
  const underMargin = useMemo(
    () => MVNO_PARTNERS.filter(p => p.margin < marginThreshold),
    [marginThreshold],
  )
  const totalRevenueShare = useMemo(
    () => REVENUE_SHARE_DATA.reduce((s, p) => s + p.totalM, 0), [],
  )
  const sortedTariffs = useMemo(
    () => [...TARIFF_SCHEDULE].sort((a, b) =>
      tariffSort === 'margin' ? b.margin - a.margin : a.floorEur - b.floorEur),
    [tariffSort],
  )
  const slaBreaches = useMemo(() => SLA_METRICS.filter(p => p.status === 'breach'), [])

  const statusColor = useCallback((s: string) =>
    s === 'growth' ? 'bg-emerald-50 text-emerald-700'
      : s === 'mature' ? 'bg-blue-50 text-blue-700'
      : 'bg-red-50 text-red-700', [])

  const slaColor  = (s: string) => s === 'ok' ? 'bg-emerald-50 text-emerald-700' : s === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  const itColor   = (s: string) => s === 'complete' ? 'bg-emerald-50 text-emerald-700' : s === 'in-progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
  const riskColor = (s: string) => s === 'low' ? 'bg-emerald-50 text-emerald-700' : s === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('MVNO & Wholesale')}
        subtitle={tt('Host-network MVNO partners · NGA wholesale · tower tenancy · onboarding · SLA · revenue share')}
        actions={<span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{(totalSubs / 1e6).toFixed(2)}M {tt('wholesale subs')}</span>}
      />

      {/* ── ML Insight ── */}
      <MlInsightSection
        heading={tt('Wholesale & MVNO intelligence')}
        models={[
          { name: tt('Partner churn predictor'), metric: '91%',    sub: tt('AUC · 30-day horizon') },
          { name: tt('Margin optimiser'),         metric: '+3.2 pp', sub: tt('avg margin uplift modelled') },
          { name: tt('Traffic anomaly detector'), metric: '0.4%',   sub: tt('false-positive rate') },
        ]}
        agentLabel={tt('Run MVNO Intelligence Agent')}
        agentRunningLabel={tt('Scoring partners…')}
        agentSteps={[
          tt('Scored all partners on margin, growth & concentration'),
          tt('Ran churn probability model on each MVNO'),
          tt('Identified tariff gaps vs regulatory floor'),
          tt('Drafted renegotiation and sunset recommendations'),
        ]}
        agentBlurb={tt('ML models running in Snowflake ML, surfaced via the Model Registry. Features derived from hourly CDR aggregations in the Feature Store.')}
        decision={{
          title:    tt('Renegotiate BudgetCall; grow TalkThuis & BeConnect'),
          detail:   tt('BudgetCall margin is 24% (below 30% threshold) and subs declining 6% QoQ. ML churn model: 78% 6-month exit probability.'),
          impact:   tt('+2.4 pp blended margin if renegotiated'),
          risk:     tt('exiting a partner frees host capacity but loses volume'),
          linkTo:   '/portal/finance',
          linkLabel: tt('Open Finance P&L'),
        }}
        chart={{
          kind:  'bar',
          title: tt('ML-predicted partner margin trajectory (next 2 quarters)'),
          data:  ML_MARGIN_PRED,
          xKey:  'partner',
          series: [
            { key: 'current',   name: tt('Current margin %'),   color: BLUE },
            { key: 'predicted', name: tt('Predicted margin %'), color: AMBER },
          ],
          unit: '%',
          note: tt('BudgetCall shows accelerating margin compression — ML model confidence 91%.'),
        }}
      />

      {/* ── pill tabs (8) ── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === t.id ? 'text-vfes-dark border-vfes-red' : 'text-vfes-dark/60 border-transparent hover:text-vfes-dark'
              }`}>
              <Icon className="w-4 h-4" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════  MVNO  ══════════════════════════════════ */}
      {tab === 'mvno' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Filter:')}</span>
            {['all', 'growth', 'mature', 'decline'].map(f => (
              <button key={f} onClick={() => setPartnerFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${partnerFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(f)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('MVNO subscribers')}    value={`${(totalSubs / 1e6).toFixed(2)}M`} delta={tt('+8.4% YoY')}      trend="up"   icon={Radio}      accent />
            <KpiCard label={tt('Wholesale ARPU')}      value="BSD 4.2"                               delta={tt('blended')}        trend="flat" icon={TrendingUp} />
            <KpiCard label={tt('Avg partner margin')}  value="36%"                                delta={tt('+2 pp YoY')}     trend="up"   icon={Building2} />
            <KpiCard label={tt('Active MVNO partners')} value="5"                                 delta={tt('1 in onboarding')} trend="up"  icon={Radio} />
          </div>

          {/* interactive margin-threshold control — useMemo depends on this */}
          <div className="flex items-center gap-4 mb-4 bg-white rounded-xl border border-black/5 p-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Margin alert threshold:')}</span>
            <input type="range" min={15} max={45} value={marginThreshold}
              onChange={e => setMarginThreshold(+e.target.value)} className="w-40 accent-vfes-red" />
            <span className="font-bold text-vfes-dark text-sm">{marginThreshold}%</span>
            <span className="text-xs text-vfes-dark/55">{underMargin.length} {tt('partners below threshold')}</span>
          </div>

          <Panel title={tt('MVNO partner book')}
            action={<AgentAction label={tt('Run Partner Optimiser')} runningLabel={tt('Scoring…')}
              steps={[
                tt('Scored partners on margin, growth & concentration'),
                tt('Flagged sub-target rate cards for renegotiation'),
                tt('Modelled churn risk per partner agreement'),
                tt('Drafted renew / grow / sunset recommendations'),
              ]} />}
          >
            <div className="h-64 mb-4" ref={chartRef}>
              <ResponsiveContainer>
                <BarChart data={filteredPartners}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [
                    `${Number(v).toLocaleString('en-BS')} subs · BSD ${p.payload.arpuWhole} ARPU · ${p.payload.margin}% margin`, tt('Partner'),
                  ]} />
                  <Bar dataKey="subs" radius={[6, 6, 0, 0]}>
                    {filteredPartners.map((p, i) => (
                      <Cell key={i} fill={p.status === 'growth' ? GREEN : p.status === 'mature' ? BLUE : AMBER} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Subscribers')}</th>
                    <th className="px-3 py-2 text-right">{tt('Wholesale ARPU')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map(p => (
                    <tr key={p.partner}
                      className={`border-b border-black/5 cursor-pointer hover:bg-[#fafbfc] ${selectedPartner === p.partner ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedPartner(p.partner === selectedPartner ? null : p.partner)}>
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.subs.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.arpuWhole.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        <span className={p.margin < marginThreshold ? 'text-red-600 font-bold' : ''}>{p.margin}%</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedPartner && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <strong>{selectedPartner}</strong> — {tt('click row to toggle · see SLA tab for detailed metrics')}
              </div>
            )}
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('BudgetCall margin eroding at 24% — review wholesale rate card or sunset partnership.')} <ChevronRight className="w-3 h-3" />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/finance"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance P&L')}</Link>
              <Link to="/portal/sales"            className="text-vfes-dark font-semibold hover:underline">{tt('→ Partner sales pipeline')}</Link>
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & settlement')}</Link>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Partner P&L — margin × scale (bubble = ARPU)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ScatterChart margin={{ left: 10, bottom: 10 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="subs" name={tt('Subs')} stroke="#999" fontSize={11}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                      label={{ value: tt('Subscribers'), position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis type="number" dataKey="margin" name={tt('Margin')} unit="%" stroke="#999" fontSize={11}
                      label={{ value: tt('Margin %'), angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis type="number" dataKey="arpuWhole" range={[120, 500]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }}
                      formatter={(v: any, n: any) => [n === 'subs' ? Number(v).toLocaleString('en-BS') : v, tt(n)]} />
                    <Scatter data={filteredPartners} fill={BLUE}>
                      {filteredPartners.map((p, i) => (
                        <Cell key={i} fill={p.status === 'growth' ? GREEN : p.status === 'mature' ? BLUE : AMBER} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('TalkThuis & BeConnect sit top-right (high margin, scaling) — grow them; BudgetCall is the laggard.')}
              </div>
            </Panel>

            <Panel title={tt('Wholesale ARPU trend (blended · last 6M)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={ARPU_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="BSD " domain={[3.5, 4.5]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`BSD ${v}`, tt('Blended ARPU')]} />
                    <Line type="monotone" dataKey="arpu" stroke={NAVY} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <Link to="/portal/roaming"           className="text-vfes-dark font-semibold hover:underline">{tt('→ Roaming P&L')}</Link>
                <Link to="/portal/network"           className="text-vfes-dark font-semibold hover:underline">{tt('→ Network capacity')}</Link>
                <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('→ Pricing simulator')}</Link>
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <AgentDecision
              title={tt('MVNO Partner Optimiser')}
              label={tt('Run Partner Optimiser')}
              runningLabel={tt('Scoring…')}
              steps={[
                tt('Scored partners on margin, growth & concentration'),
                tt('Flagged sub-target rate cards for renegotiation'),
                tt('Modelled churn risk per partner agreement'),
                tt('Drafted renew / grow / sunset recommendations'),
              ]}
              result={{
                headline: tt('Renegotiate BudgetCall; grow TalkThuis & BeConnect'),
                stats: [
                  { label: tt('MVNO subscribers'),    value: `${(totalSubs / 1e6).toFixed(2)}M` },
                  { label: tt('Wholesale ARPU'),       value: 'BSD 4.2' },
                  { label: tt('Avg partner margin'),   value: '36%' },
                  { label: tt('Active MVNO partners'), value: '5' },
                ],
                findings: [
                  tt('BudgetCall runs a 24% margin and is declining — rework the rate card or exit.'),
                  tt('The high-margin growth partners warrant capacity commitments and joint go-to-market.'),
                ],
                note: tt('+wholesale margin mix · lower laggard drag'),
              }}
              impact={tt('+wholesale margin mix · lower laggard drag')}
              risk={tt('exiting a partner frees host capacity but loses volume')}
              linkTo="/portal/b2b"
              linkLabel={tt('Open B2B portal')}
            />
          </div>
        </>
      )}

      {/* ═══════════════════════════  NGA  ═══════════════════════════════════ */}
      {tab === 'nga' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('NGA wholesale revenue')} value={`BSD ${ngaRev.toFixed(1)}M`} delta={tt('annualised')}  trend="up"   icon={Network}  accent />
            <KpiCard label={tt('Bitstream circuits')}    value="84K"                       delta={tt('NEBA-local')} trend="up"   icon={Wifi} />
            <KpiCard label={tt('Dark fibre leases')}     value="1,240"                     delta={tt('+12% YoY')}  trend="up"   icon={Network} />
            <KpiCard label={tt('Duct access MARCo km')}  value="3,800"                     delta={tt('route km')}  trend="flat" icon={Network} />
          </div>

          <Panel title={tt('NGA wholesale — circuits & revenue')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={WHOLESALE_NGA} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} unit="M" />
                  <YAxis type="category" dataKey="product" stroke="#999" fontSize={10} width={150} />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v: any, _n: any, p: any) => [`BSD ${v}M · ${p.payload.circuits.toLocaleString('en-BS')} circuits`, tt('Wholesale')]} />
                  <Bar dataKey="revM" radius={[0, 6, 6, 0]} fill={NAVY} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Total NGA wholesale revenue')}: <span className="font-bold">BSD {ngaRev.toFixed(1)}M</span> {tt('annualised')}
            </div>
          </Panel>

          <Panel title={tt('NGA product detail')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Product')}</th>
                    <th className="px-3 py-2 text-right">{tt('Circuits')}</th>
                    <th className="px-3 py-2 text-right">{tt('Revenue BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Rev/circuit BSD ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {WHOLESALE_NGA.map(p => (
                    <tr key={p.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(p.product)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.circuits.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.revM.toFixed(1)}M</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {((p.revM * 1e6) / p.circuits).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/network" className="text-vfes-dark font-semibold hover:underline">{tt('→ Network topology')}</Link>
              <Link to="/portal/product" className="text-vfes-dark font-semibold hover:underline">{tt('→ Product catalogue')}</Link>
            </div>
          </Panel>

          <Panel title={tt('NGA wholesale revenue — quarterly trend (BSD M)')}>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={[
                  { q: 'Q3 25', neba: 16.8, dark: 11.4, duct: 5.9, back: 8.6 },
                  { q: 'Q4 25', neba: 17.2, dark: 11.8, duct: 6.1, back: 9.0 },
                  { q: 'Q1 26', neba: 17.8, dark: 12.2, duct: 6.2, back: 9.4 },
                  { q: 'Q2 26', neba: 18.2, dark: 12.6, duct: 6.4, back: 9.8 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`BSD ${v}M`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="neba" stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.7} name={tt('Bitstream NEBA')} />
                  <Area type="monotone" dataKey="dark" stackId="1" stroke={NAVY}   fill={NAVY}   fillOpacity={0.7} name={tt('Dark fibre')} />
                  <Area type="monotone" dataKey="duct" stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.7} name={tt('Duct access')} />
                  <Area type="monotone" dataKey="back" stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.7} name={tt('Backhaul')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('All NGA product lines growing — Bitstream NEBA-local dominates at 38% of total wholesale revenue.')}
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  TOWERS  ════════════════════════════════ */}
      {tab === 'towers' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Owned towers')}           value="8,420"  delta={tt('TowerCo candidate')} trend="flat" icon={Building2} accent />
            <KpiCard label={tt('Tenancy ratio')}          value="1.62×"  delta={tt('+0.05 YoY')}        trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Build-to-suit pipeline')} value="340"    delta={tt('next 18 months')}    trend="up"   icon={Building2} />
            <KpiCard label={tt('Lease revenue (annual)')} value="BSD 41M"   delta={tt('+6% YoY')}          trend="up"   icon={DollarSign} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {TOWER.map(t => (
              <Panel key={t.metric} title={tt(t.metric)}>
                <div className="text-3xl font-extrabold text-vfes-dark">{t.value}</div>
                <div className="text-xs text-vfes-dark/55 mt-2">{tt(t.note)}</div>
              </Panel>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={tt('Tower tenancy revenue — quarterly')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={TOWER_TENANCY}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="q" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="M" />
                    <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="l" type="monotone" dataKey="rev"     stroke={BLUE}  strokeWidth={2.5} name={tt('Revenue BSD M')} />
                    <Line yAxisId="r" type="monotone" dataKey="tenancy" stroke={AMBER} strokeWidth={2.5} name={tt('Tenancy ratio')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('Tenancy ratio improving each quarter — target 1.8× by 2027 to support TowerCo thesis.')}
              </div>
            </Panel>

            <Panel title={tt('TowerCo thesis')}>
              <div className="text-sm text-vfes-dark/70">
                {tt('8,420 owned towers at 1.62 tenancy ratio support a carve-out valuation of 18–22× EV/EBITDA based on comparable European TowerCo transactions. A carve-out would unlock capital while retaining anchor-tenant control.')}
              </div>
              <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" /> {tt('See M&A Simulator for full carve-out NPV and leverage impact.')} <ChevronRight className="w-3 h-3" />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <Link to="/portal/finance"     className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance & NPV')}</Link>
                <Link to="/portal/company-360" className="text-vfes-dark font-semibold hover:underline">{tt('→ Company 360')}</Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ═══════════════════════════  ONBOARDING  ════════════════════════════ */}
      {tab === 'onboarding' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Partners in onboarding')} value="4"    delta={tt('2 launch-ready')}          trend="up"   icon={Users}        accent />
            <KpiCard label={tt('Avg days to launch')}     value="58"   delta={tt('–4 days vs prior cohort')} trend="up"   icon={Clock} />
            <KpiCard label={tt('IT integration issues')}  value="2"    delta={tt('MovesTel & SuriMobile')}   trend="flat" icon={AlertTriangle} />
            <KpiCard label={tt('SIM provisioning lag')}   value="4h"   delta={tt('target 2h')}               trend="down" icon={Radio} />
          </div>

          <Panel title={tt('Onboarding pipeline')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2">{tt('Stage')}</th>
                    <th className="px-3 py-2 text-right">{tt('Days elapsed')}</th>
                    <th className="px-3 py-2">{tt('ETA')}</th>
                    <th className="px-3 py-2">{tt('IT integration')}</th>
                    <th className="px-3 py-2">{tt('Risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ONBOARDING_PIPELINE.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2">{tt(p.stage)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.daysElapsed}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.eta}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${itColor(p.it)}`}>{tt(p.it)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(p.risk)}`}>{tt(p.risk)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('SuriMobile IT integration stalled — flag to TechOps for escalation.')} <ChevronRight className="w-3 h-3" />
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Standard onboarding milestones')}>
              <div className="space-y-2">
                {ONBOARDING_MILESTONES.map((ms, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-black/5">
                    {ms.done
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                    <span className="text-xs font-mono text-vfes-dark/55 shrink-0">{ms.m}</span>
                    <span className="text-sm">{tt(ms.task)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <Link to="/portal/b2b"     className="text-vfes-dark font-semibold hover:underline">{tt('→ B2B portal')}</Link>
                <Link to="/portal/network" className="text-vfes-dark font-semibold hover:underline">{tt('→ Network provisioning')}</Link>
              </div>
            </Panel>

            <Panel title={tt('Time-to-launch by cohort')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={ONBOARD_TTL}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit={tt('d')} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} ${tt('days')}`, tt('Time-to-launch')]} />
                    <Bar dataKey="days" fill={GREEN} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('Improving cohort over cohort — target sub-50 days by Q4 2026 via portal self-serve onboarding.')}
              </div>
            </Panel>
          </div>

          <Panel title={tt('Onboarding cost & revenue — 12-month view')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { phase: 'NDA',          costK: 8,  revK: 0 },
                  { phase: 'Provisioning', costK: 24, revK: 0 },
                  { phase: 'IT Integr.',   costK: 62, revK: 0 },
                  { phase: 'UAT',          costK: 18, revK: 0 },
                  { phase: 'Launch',       costK: 12, revK: 180 },
                  { phase: 'Month 3',      costK: 4,  revK: 420 },
                  { phase: 'Month 6',      costK: 2,  revK: 680 },
                  { phase: 'Month 12',     costK: 2,  revK: 920 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="phase" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="K" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`BSD ${v}K`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="costK" fill={AMBER} radius={[6, 6, 0, 0]} name={tt('Onboarding cost BSD K')} />
                  <Bar dataKey="revK"  fill={GREEN} radius={[6, 6, 0, 0]} name={tt('Incremental revenue BSD K')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Average payback period for a new MVNO partner: 4.2 months. Revenue ramp accelerates after month 3 as marketing campaigns roll out.')}
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  SLA  ═══════════════════════════════════ */}
      {tab === 'sla' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Partners monitored')} value="5/5"    delta={tt('all active')}          trend="flat" icon={Shield}       accent />
            <KpiCard label={tt('SLA breaches')}       value={String(slaBreaches.length)} delta={tt('BudgetCall')} trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('Avg uptime (all)')}   value="99.83%" delta={tt('target 99.9%')}        trend="flat" icon={CheckCircle} />
            <KpiCard label={tt('Billing accuracy')}   value="98.9%"  delta={tt('blended')}             trend="up"   icon={BarChart2} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Call setup rate (avg)')} value="96.4%" delta={tt('BudgetCall drags avg')} trend="flat" icon={Activity} />
            <KpiCard label={tt('SMS delivery rate')}     value="98.2%" delta={tt('blended 5 partners')}   trend="up"   icon={Activity} />
            <KpiCard label={tt('SLA reviews due')}       value="2"     delta={tt('EcoSIM & BudgetCall')}  trend="flat" icon={Clock} />
            <KpiCard label={tt('Penalty exposure')}      value="BSD 48K"  delta={tt('if breach unresolved')} trend="down" icon={AlertTriangle} />
          </div>

          <Panel title={tt('SLA compliance by partner')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Uptime %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Call setup %')}</th>
                    <th className="px-3 py-2 text-right">{tt('SMS delivery %')}</th>
                    <th className="px-3 py-2 text-right">{tt('Billing acc. %')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SLA_METRICS.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className={`px-3 py-2 text-right font-mono ${p.uptime < 99.9 ? 'text-amber-600 font-bold' : ''}`}>{p.uptime.toFixed(2)}%</td>
                      <td className={`px-3 py-2 text-right font-mono ${p.callSetup < 96 ? 'text-red-600 font-bold' : ''}`}>{p.callSetup.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right font-mono">{p.smsDeliv.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right font-mono">{p.billing.toFixed(1)}%</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${slaColor(p.status)}`}>{tt(p.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('SLA status trend — monthly')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={SLA_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="ok"     stackId="1" stroke={GREEN}    fill={GREEN}    name={tt('OK')} />
                  <Area type="monotone" dataKey="warn"   stackId="1" stroke={AMBER}    fill={AMBER}    name={tt('Warning')} />
                  <Area type="monotone" dataKey="breach" stackId="1" stroke="#EF4444" fill="#EF4444"  name={tt('Breach')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" /> {tt('BudgetCall call-setup at 93.8% — below 95% SLA floor. Issue breach notice and remediation plan.')} <ChevronRight className="w-3 h-3" />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/network"    className="text-vfes-dark font-semibold hover:underline">{tt('→ Network quality')}</Link>
              <Link to="/portal/ai-insights" className="text-vfes-dark font-semibold hover:underline">{tt('→ AI Insights')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  REVENUE SHARE  ═════════════════════════ */}
      {tab === 'revenue-share' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Q2 revenue share total')} value={`BSD ${totalRevenueShare.toFixed(1)}M`} delta={tt('+9% QoQ')}          trend="up"   icon={DollarSign} accent />
            <KpiCard label={tt('Volume bonus paid')}       value="BSD 1.4M"          delta={tt('4 partners qualify')}  trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Avg share rate')}          value="26.4%"           delta={tt('blended weighted')}    trend="up"   icon={BarChart2} />
            <KpiCard label={tt('Quarterly settlement')}    value={tt('On track')}  delta={tt('due 15 Jul')}          trend="flat" icon={CheckCircle} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Partners above target rate')} value="4/5"   delta={tt('BudgetCall below')}  trend="flat" icon={Shield} />
            <KpiCard label={tt('Settlement cycle')}           value={tt('Monthly')} delta={tt('auto-reconciled')}   trend="flat" icon={Clock} />
            <KpiCard label={tt('Highest share rate')}         value="32%"   delta={tt('TalkThuis')}          trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Lowest share rate')}          value="18%"   delta={tt('BudgetCall — review')} trend="down" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Q2 2026 revenue share by partner')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={REVENUE_SHARE_DATA}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="partner" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="M" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`BSD ${v}M`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseRevM"  stackId="a" fill={NAVY}  radius={[0, 0, 0, 0]} name={tt('Base revenue')} />
                  <Bar dataKey="volBonusM" stackId="a" fill={GREEN} radius={[6, 6, 0, 0]} name={tt('Volume bonus')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Revenue share settlement — Q2 2026')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Base BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Volume bonus BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Total BSD M')}</th>
                    <th className="px-3 py-2 text-right">{tt('Share rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {REVENUE_SHARE_DATA.map(p => (
                    <tr key={p.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{p.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.baseRevM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {p.volBonusM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">BSD {p.totalM.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.shareRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Quarterly revenue share trend')}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={REVENUE_SHARE_QUARTERLY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit="M" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="total"  stroke={NAVY}  strokeWidth={2.5} name={tt('Total BSD M')} />
                  <Line yAxisId="r" type="monotone" dataKey="margin" stroke={GREEN} strokeWidth={2.5} name={tt('Blended margin %')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & settlement')}</Link>
              <Link to="/portal/finance"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance P&L')}</Link>
            </div>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  TARIFFS  ═══════════════════════════════ */}
      {tab === 'tariffs' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active tariff lines')}  value="6"        delta={tt('URCA regulated')}         trend="flat" icon={FileText}   accent />
            <KpiCard label={tt('Avg tariff margin')}    value="30.5%"    delta={tt('+0.8 pp YoY')}           trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Floor vs current gap')} value="+38%"     delta={tt('avg premium over floor')} trend="up"   icon={BarChart2} />
            <KpiCard label={tt('Next URCA review')}     value="Q4 2026"  delta={tt('scheduled')}             trend="flat" icon={Clock} />
          </div>

          {/* interactive tariff sort — useMemo depends on this */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('Sort by:')}</span>
            {(['margin', 'floor'] as const).map(s => (
              <button key={s} onClick={() => setTariffSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${tariffSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(s === 'margin' ? 'Margin (high→low)' : 'Floor price (low→high)')}
              </button>
            ))}
          </div>

          <Panel title={tt('Wholesale tariff schedule')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Product')}</th>
                    <th className="px-3 py-2 text-right">{tt('Unit')}</th>
                    <th className="px-3 py-2 text-right">{tt('Floor (BSD )')}</th>
                    <th className="px-3 py-2 text-right">{tt('Current (BSD )')}</th>
                    <th className="px-3 py-2">{tt('Regulator')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTariffs.map(t => (
                    <tr key={t.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(t.product)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{tt(t.unit)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {t.floorEur.toFixed(5)}</td>
                      <td className="px-3 py-2 text-right font-mono">BSD {t.currentEur.toFixed(5)}</td>
                      <td className="px-3 py-2 text-xs">{t.regulatory}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold"
                        style={{ color: t.margin >= 30 ? GREEN : AMBER }}>{t.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('Floor prices set by URCA/RLAH. Current tariffs must remain above floor. Margins calculated vs incremental cost.')}
            </div>
          </Panel>

          <Panel title={tt('Margin by tariff product')}>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={TARIFF_SCHEDULE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="product" stroke="#999" fontSize={9} angle={-15} textAnchor="end" height={44} />
                  <YAxis stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Margin')]} />
                  <Bar dataKey="margin" radius={[6, 6, 0, 0]}>
                    {TARIFF_SCHEDULE.map((t, i) => <Cell key={i} fill={t.margin >= 30 ? GREEN : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link to="/portal/pricing-simulator" className="text-vfes-dark font-semibold hover:underline">{tt('→ Pricing simulator')}</Link>
              <Link to="/portal/marketing"         className="text-vfes-dark font-semibold hover:underline">{tt('→ Go-to-market')}</Link>
            </div>

            <Panel title={tt('Tariff compliance watch — floor vs current headroom')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                      <th className="px-3 py-2">{tt('Product')}</th>
                      <th className="px-3 py-2 text-right">{tt('Headroom BSD ')}</th>
                      <th className="px-3 py-2 text-right">{tt('Headroom %')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TARIFF_SCHEDULE.map(t => {
                      const headroom = t.currentEur - t.floorEur
                      const headroomPct = ((headroom / t.floorEur) * 100).toFixed(0)
                      return (
                        <tr key={t.product} className="border-b border-black/5 hover:bg-[#fafbfc]">
                          <td className="px-3 py-2 font-semibold">{tt(t.product)}</td>
                          <td className="px-3 py-2 text-right font-mono">BSD {headroom.toFixed(5)}</td>
                          <td className="px-3 py-2 text-right font-mono" style={{ color: +headroomPct > 30 ? GREEN : AMBER }}>{headroomPct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-vfes-dark/55">
                {tt('All tariffs maintain adequate headroom above URCA/RLAH floors. VoLTE (HD) has the most room for competitive adjustment.')}
              </div>
            </Panel>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════  TRAFFIC  ═══════════════════════════════ */}
      {tab === 'traffic' && (
        <>
          {/* interactive traffic view — drives label display */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest">{tt('View:')}</span>
            {(['data', 'voice', 'sms'] as const).map(v => (
              <button key={v} onClick={() => setTrafficView(v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${trafficView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60 hover:bg-black/10'}`}>
                {tt(v.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total data traffic (Jun)')} value="130 TB" delta={tt('+4.8% MoM')}    trend="up"   icon={Activity}     accent />
            <KpiCard label={tt('Litech share')}              value="41.5%"  delta={tt('largest MVNO')} trend="up"   icon={Radio} />
            <KpiCard label={tt('Data share of traffic')}     value="68%"    delta={tt('+3 pp YoY')}   trend="up"   icon={Wifi} />
            <KpiCard label={tt('BudgetCall decline')}        value="–4.3%"  delta={tt('MoM drop')}    trend="down" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Monthly traffic by MVNO (TB) — view: ') + tt(trafficView.toUpperCase())}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={TRAFFIC_MONTHLY}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit=" TB" />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any) => [`${v} TB`, tt(n)]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="litech"  stackId="1" stroke={BLUE}   fill={BLUE}   fillOpacity={0.85} name="Litech" />
                  <Area type="monotone" dataKey="ibconn"  stackId="1" stroke={NAVY}   fill={NAVY}   fillOpacity={0.85} name="BeConnect" />
                  <Area type="monotone" dataKey="eco"     stackId="1" stroke={GREEN}  fill={GREEN}  fillOpacity={0.85} name="EcoSIM" />
                  <Area type="monotone" dataKey="talkhog" stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.85} name="TalkThuis" />
                  <Area type="monotone" dataKey="budget"  stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.85} name="BudgetCall" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Panel title={tt('Traffic mix (Jun 2026)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={TRAFFIC_MIX} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {TRAFFIC_MIX.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}%`, tt('Share')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Q2 vs Q1 traffic comparison (TB)')}>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={[
                    { partner: 'Litech',      q1: 138, q2: 144 },
                    { partner: 'BeConnect', q1: 88,  q2: 96 },
                    { partner: 'EcoSIM',      q1: 54,  q2: 53 },
                    { partner: 'TalkThuis',   q1: 42,  q2: 46 },
                    { partner: 'BudgetCall',  q1: 24,  q2: 21 },
                  ]}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="partner" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} unit=" TB" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="q1" fill={SLATE} radius={[6, 6, 0, 0]} name={tt('Q1 2026')} />
                    <Bar dataKey="q2" fill={BLUE}  radius={[6, 6, 0, 0]} name={tt('Q2 2026')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <Link to="/portal/network"      className="text-vfes-dark font-semibold hover:underline">{tt('→ Network capacity')}</Link>
            <Link to="/portal/ai-insights"  className="text-vfes-dark font-semibold hover:underline">{tt('→ AI traffic insights')}</Link>
            <Link to="/portal/customer-360" className="text-vfes-dark font-semibold hover:underline">{tt('→ Customer 360')}</Link>
            <Link to="/portal/digital-app"  className="text-vfes-dark font-semibold hover:underline">{tt('→ Digital app')}</Link>
          </div>

          <Panel title={tt('Traffic share by MVNO — Jun 2026')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Partner')}</th>
                    <th className="px-3 py-2 text-right">{tt('Jun traffic (TB)')}</th>
                    <th className="px-3 py-2 text-right">{tt('Share')}</th>
                    <th className="px-3 py-2 text-right">{tt('MoM change')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { partner: 'Litech Mobile', tb: 53.9, share: 41.5, mom: '+4.9%' },
                    { partner: 'BeConnect',   tb: 36.1, share: 27.8, mom: '+4.3%' },
                    { partner: 'EcoSIM',        tb: 17.2, share: 13.2, mom: '–2.3%' },
                    { partner: 'TalkThuis',     tb: 16.4, share: 12.6, mom: '+4.5%' },
                    { partner: 'BudgetCall',    tb:  6.4, share:  4.9, mom: '–5.9%' },
                  ].map(r => (
                    <tr key={r.partner} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{r.partner}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.tb}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.share}%</td>
                      <td className={`px-3 py-2 text-right font-mono text-xs ${r.mom.startsWith('–') ? 'text-red-600' : 'text-emerald-600'} font-bold`}>{r.mom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">
              {tt('BudgetCall traffic declining for 3 consecutive months — indicative of subscriber churn ahead of contract renegotiation.')}
            </div>
          </Panel>
        </>
      )}

      {/* ── cross-portfolio navigation ── */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-black/5 shadow-sm">
        <div className="text-xs font-semibold text-vfes-dark/55 uppercase tracking-widest mb-3">{tt('Related modules')}</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/portal/roaming"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Roaming P&L')}</Link>
          <Link to="/portal/b2b"              className="text-vfes-dark font-semibold hover:underline">{tt('→ B2B Self-serve portal')}</Link>
          <Link to="/portal/billing-charging" className="text-vfes-dark font-semibold hover:underline">{tt('→ Billing & charging')}</Link>
          <Link to="/portal/finance"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Finance & P&L')}</Link>
          <Link to="/portal/network"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Network capacity')}</Link>
          <Link to="/portal/sales"            className="text-vfes-dark font-semibold hover:underline">{tt('→ Sales pipeline')}</Link>
          <Link to="/portal/product"          className="text-vfes-dark font-semibold hover:underline">{tt('→ Product catalogue')}</Link>
          <Link to="/portal/ai-insights"      className="text-vfes-dark font-semibold hover:underline">{tt('→ AI Insights')}</Link>
          <Link to="/portal/marketing"        className="text-vfes-dark font-semibold hover:underline">{tt('→ Marketing')}</Link>
          <Link to="/portal/company-360"      className="text-vfes-dark font-semibold hover:underline">{tt('→ Company 360')}</Link>
        </div>
      </div>

      <AskTheData />
    </div>
  )
}
