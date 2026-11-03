import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3436)
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { customers, Customer } from '../../data/customers'
import tt from '../../i18n/tt'
import { enrichCustomer } from '../../data/customerEnrichment'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AgentAction from '../../components/AgentAction'
import {
  User, Mail, Phone, MapPin, Calendar, Wallet, Wifi, Tv, Smartphone, Sparkles, Search,
  Users, ShieldCheck, Activity, AlertTriangle, FileText, MessageSquare, BarChart3,
  Lock, ChevronRight, Bot, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, Minus,
  Zap, AlertCircle, CreditCard, Star, Heart, Gift, Eye, RefreshCw, Phone as PhoneIcon, Send,
  ClipboardList, Award, Headphones, Settings, FileWarning, Target,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell, Legend } from 'recharts'
import CustomerAvatar from '../../components/CustomerAvatar'
import RelationshipGraph from '../../components/RelationshipGraph'
import CartoMap from '../../components/CartoMap'

// Approximate lat/lng per Bahamian city/town for the service-address mini-map
const CITY_LACBLG: Record<string, [number, number]> = {
  Nassau:    [25.0443, -77.3504],
  Freeport:      [26.5333, -78.7],
  Abaco:     [26.5412, -77.0636],
  Eleuthera:     [25.1962, -76.2431],
  Exuma:    [23.5, -75.7667],
  Andros:   [24.7064, -77.7902],
  Bimini:   [25.727, -79.2972],
  'Long Island': [23.25, -75.1],
  Inagua: [20.95, -73.6731],
  'Marsh Harbour': [26.5412, -77.0636],
  'Governors Harbour': [25.1962, -76.2431],
  'George Town': [23.5, -75.7667],
  'Andros Town': [24.7064, -77.7902],
  'Alice Town': [25.727, -79.2972],
}
function latLngFor(city: string, seed: number): [number, number] {
  const base = CITY_LACBLG[city] ?? [25.06, -77.345] // centre of The Bahamas fallback
  // Tiny deterministic offset (<~600m) so multiple customers in same city don't overlap
  const dx = ((seed % 200) - 100) / 20000
  const dy = (((seed >> 4) % 200) - 100) / 20000
  return [base[0] + dy, base[1] + dx]
}
function customerSeed(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}

const DETAIL_TABS = ['Overview', 'Services', 'Network', 'Relationships', 'Billing', 'Care', 'Insights', 'Audit'] as const
type DetailTab = typeof DETAIL_TABS[number]

// Portfolio-level data for analytics tabs
const PORTFOLIO_SEGMENTS = [
  { seg: 'Convergent Premium', customers: 218400, arpu: 92, churn: 0.74, clv: 3240, color: '#FF4438' },
  { seg: 'Broadband + Mobile', customers: 312800, arpu: 68, churn: 1.12, clv: 2180, color: '#11567F' },
  { seg: 'Broadband only',     customers: 184600, arpu: 42, churn: 1.48, clv: 1520, color: '#10B981' },
  { seg: 'Mobile only',        customers: 412000, arpu: 28, churn: 2.24, clv:  980, color: '#F59E0B' },
  { seg: 'B2B / Business',     customers:  26200, arpu: 184, churn: 0.41, clv: 8420, color: '#7C3AED' },
]
const PORTFOLIO_CLV_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  clv: 1780 + i * 5,
  nps: 32 + i * 0.8,
}))
const USAGE_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  dataGB:       +(48 + i * 1.2).toFixed(1),
  streamingHrs: +(22 + i * 0.6).toFixed(1),
}))
const CARE_VOLUME = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  calls:    42000 - i * 280,
  chats:    18000 + i * 400,
  resolved: +(88 + i * 0.2).toFixed(1),
}))
const CAMPAIGN_PERF = [
  { campaign: 'Convergent upsell',   sent: 142000, converted: 8840,  convPct: 6.2, arpuDelta: +18 },
  { campaign: 'FTTH migration',      sent:  84000, converted: 6120,  convPct: 7.3, arpuDelta: +24 },
  { campaign: 'Loyalty renewal',     sent:  38400, converted: 10900, convPct: 28.4, arpuDelta: -4 },
  { campaign: 'Speed upgrade',       sent:  62000, converted: 5240,  convPct: 8.5, arpuDelta: +12 },
  { campaign: 'Family plan attach',  sent:  96000, converted: 7820,  convPct: 8.1, arpuDelta: +22 },
]
const COHORT_PERF = [
  { cohort: '2022 Q1', acquired:  84200, activeNow:  62400, clvNow: 2840, retentionPct: 74 },
  { cohort: '2022 Q3', acquired:  91800, activeNow:  70200, clvNow: 2640, retentionPct: 76 },
  { cohort: '2023 Q1', acquired: 108400, activeNow:  87200, clvNow: 2420, retentionPct: 80 },
  { cohort: '2023 Q3', acquired: 118000, activeNow:  98400, clvNow: 2180, retentionPct: 83 },
  { cohort: '2024 Q1', acquired: 124600, activeNow: 106800, clvNow: 1980, retentionPct: 86 },
  { cohort: '2024 Q3', acquired: 128200, activeNow: 112400, clvNow: 1740, retentionPct: 88 },
]

type TabId = 'profile360' | 'segments' | 'churn-risk' | 'clv' | 'usage' | 'care-analytics' | 'campaigns' | 'cohorts'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'profile360',     label: 'Profile 360',     icon: User         },
  { id: 'segments',       label: 'Segments',         icon: Users        },
  { id: 'churn-risk',     label: 'Churn Risk',       icon: AlertTriangle },
  { id: 'clv',            label: 'CLV',              icon: TrendingUp   },
  { id: 'usage',          label: 'Usage',            icon: Activity     },
  { id: 'care-analytics', label: 'Care Analytics',   icon: Headphones   },
  { id: 'campaigns',      label: 'Campaigns',        icon: Send         },
  { id: 'cohorts',        label: 'Cohorts',          icon: BarChart3    },
]

const tierColor: Record<string, string> = {
  Platinum: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
  Gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-vfes-dark',
  Silver: 'bg-gradient-to-r from-slate-300 to-slate-400 text-vfes-dark',
  Bronze: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
}
const riskColor: Record<string, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-red-50 text-red-700 border-red-200',
}
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

function ServiceIcon({ name }: { name: string }) {
  if (name.toLowerCase().includes('broadband')) return <Wifi className="w-4 h-4" />
  if (name.toLowerCase().includes('tv')) return <Tv className="w-4 h-4" />
  if (name.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />
  return <Sparkles className="w-4 h-4" />
}

function Stat({ label, value, sub, color = 'text-vfes-dark' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{label}</div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-vfes-dark/55">{sub}</div>}
    </div>
  )
}

const _MlI: any = () => null // dead-code alias keeps orphaned content from showing 2 MlInsightSection instances
function _Orphaned({ tab, totalPortfolioCustomers, avgPortfolioARPU }: any) {
  return (
    <>
      {/* \u2500\u2500 Tab: segments \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'segments' && (
        <>
          <_MlI
            heading="Customer segmentation"
            models={[
              { name: 'Segment classifier v3.1', metric: 'F1 0.84',    sub: 'XGBoost · 8 segments' },
              { name: 'Upsell propensity',       metric: 'AUC 0.81',   sub: 'Logistic · convergent attach' },
              { name: 'Segment CLV model',       metric: 'MAPE 5.1%',  sub: 'GBR · 36-month NPV' },
            ]}
            agentLabel="Run Segmentation Agent"
            agentRunningLabel="Classifying base…"
            agentSteps={[
              'Classified 1.15M customers into value segments',
              'Computed CLV gap by segment vs Convergent',
              'Identified 184K Mobile-only for convergent pitch',
              'Ranked high-ARPU segments for proactive NBO',
            ]}
            agentBlurb="Classifies the base into strategic segments and ranks them by CLV gap opportunity."
            decision={{
              title: 'Convergent upsell is the primary value-creation lever',
              detail: '184K Mobile-only customers have 2.4× CLV headroom if converted to convergent — top priority for marketing.',
              impact: '+\u20ac368M portfolio CLV if 10% converted',
              risk: 'Over-targeting causes saturation — cap frequency per segment',
              linkTo: '#/portal/bundle-propensity',
              linkLabel: 'Open Bundle Propensity',
            }}
            chart={{
              kind: 'bar',
              title: 'Segment CLV vs churn rate',
              data: PORTFOLIO_SEGMENTS.map(s => ({ seg: s.seg.split(' ')[0], clv: s.clv, churn: s.churn })),
              xKey: 'seg',
              series: [{ key: 'clv', name: 'Avg CLV \u20ac', color: '#FF4438' }],
              note: 'Convergent Premium delivers 3.3\u00d7 CLV vs Mobile-only — convergent mix is the key lever.',
            }}
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total customers')}        value={`${(totalPortfolioCustomers / 1_000_000).toFixed(2)}M`} delta={tt('+2.4K MoM')}         trend="up"   icon={Users}       accent />
            <KpiCard label={tt('Portfolio avg ARPU')}     value={`\u20ac${avgPortfolioARPU}`}                              delta={tt('+\u20ac1.2 MoM')}        trend="up"   icon={TrendingUp}  />
            <KpiCard label={tt('Convergent penetration')} value="18.9%"                                                   delta={tt('+1.2 pp YoY')}       trend="up"   icon={Activity}    />
            <KpiCard label={tt('Mobile-only upsell pool')} value="184K"                                                  delta={tt('CLV headroom 2.4\u00d7')} trend="up"   icon={Smartphone}  />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Segment distribution \u2014 customers')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${(v/1000).toFixed(0)}K`, tt('Customers')]} />
                    <Bar dataKey="customers" radius={[6,6,0,0]} name={tt('Customers')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Segment ARPU vs churn heatmap')}>
              <div className="space-y-2 mt-2">
                {PORTFOLIO_SEGMENTS.map(s => (
                  <div key={s.seg} className="flex items-center gap-3 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-xs font-semibold w-40 truncate">{tt(s.seg)}</span>
                    <div className="flex-1 text-xs flex items-center gap-2">
                      <span className="font-mono font-bold">\u20ac{s.arpu}</span>
                      <div className="h-2 flex-1 bg-black/5 rounded">
                        <div className="h-2 rounded" style={{ width: `${(s.arpu/184)*100}%`, background: s.color }} />
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.churn > 2 ? 'bg-red-50 text-red-600' : s.churn > 1 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{s.churn}% {tt('churn')}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/base-management"   className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
            <Link to="/portal/bundle-propensity" className="text-vfes-dark hover:underline">{tt('Bundle Propensity \u2192')}</Link>
            <Link to="/portal/clv"               className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: churn-risk \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'churn-risk' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Blended churn')}    value="1.52%"  delta={tt('-0.18 pp YoY')}   trend="up"   icon={TrendingDown}  accent />
            <KpiCard label={tt('High-risk book')}   value="38.4K"  delta={tt('lines flagged')}  trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('ARPU at risk/mo')}  value="\u20ac2.14M" delta={tt('if unaddressed')} trend="down" icon={TrendingDown} />
            <KpiCard label={tt('Save rate')}         value="51%"    delta={tt('+4 pp vs target')} trend="up"   icon={ShieldCheck}  />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Churn risk by segment')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="churn" radius={[6,6,0,0]} name={tt('Churn %')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.churn > 2 ? '#EF4444' : s.churn > 1 ? '#F59E0B' : '#10B981'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Portfolio CLV trend')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={PORTFOLIO_CLV_TREND}>
                    <defs>
                      <linearGradient id="clvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#FF4438" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF4438" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="clv" stroke="#222128" strokeWidth={2} fill="url(#clvFill)" name={tt('Avg CLV \u20ac')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/churn-retention"  className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
            <Link to="/portal/mnp"              className="text-vfes-dark hover:underline">{tt('MNP Save Desk \u2192')}</Link>
            <Link to="/portal/contact-center"   className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: clv \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'clv' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Portfolio CLV (36m)')} value="\u20ac1.91B"  delta={tt('+4.8% MoM')}     trend="up"   icon={TrendingUp} accent />
            <KpiCard label={tt('Avg CLV / customer')}  value="\u20ac1,840" delta={tt('+\u20ac42 MoM')}     trend="up"   icon={Sparkles} />
            <KpiCard label={tt('CLV : CAC ratio')}     value="6.7\u00d7"   delta={tt('best-in-class')} trend="up"   icon={Target}   />
            <KpiCard label={tt('CAC payback')}          value="9.4 mo"   delta={tt('\u22121.2 mo YoY')} trend="up"   icon={Clock}    />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('CLV by segment')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="clv" radius={[6,6,0,0]} name={tt('Avg CLV \u20ac')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('CLV trend \u2014 12 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={PORTFOLIO_CLV_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} domain={[1750, 1900]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="clv" stroke="#222128" strokeWidth={2.5} name={tt('Avg CLV \u20ac')} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/clv"              className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
            <Link to="/portal/ai-insights"      className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
            <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline">{tt('Pricing Simulator \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: usage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'usage' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Avg data/month')} value="49.2 GB"  delta={tt('+12% YoY')}     trend="up" icon={Activity}     accent />
            <KpiCard label={tt('Streaming share')} value="62%"     delta={tt('of data usage')} trend="up" icon={TrendingUp}   />
            <KpiCard label={tt('5G adoption')}     value="38.4%"   delta={tt('+8 pp YoY')}    trend="up" icon={Zap}          />
            <KpiCard label={tt('Peak congestion')} value="12\u201314h" delta={tt('daily window')} trend="flat" icon={AlertTriangle} />
          </div>

          <Panel title={tt('Data + streaming usage \u2014 12 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={USAGE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit=" GB" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit=" hr" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="dataGB"       fill="#FF4438" radius={[3,3,0,0]} name={tt('Data GB/mo')} />
                  <Line yAxisId="r" type="monotone" dataKey="streamingHrs" stroke="#10B981" strokeWidth={2} name={tt('Streaming hrs/mo')} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/experience"     className="text-vfes-dark hover:underline">{tt('Experience \u2192')}</Link>
            <Link to="/portal/network"        className="text-vfes-dark hover:underline">{tt('Network \u2192')}</Link>
            <Link to="/portal/digital-app"    className="text-vfes-dark hover:underline">{tt('Digital App \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: care-analytics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'care-analytics' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Calls / 100 customers')} value="3.6"  delta={tt('-0.4 MoM')}   trend="up"   icon={Headphones}  accent />
            <KpiCard label={tt('First-call resolution')} value="71%"  delta={tt('+2 pp QoQ')}  trend="up"   icon={CheckCircle2} />
            <KpiCard label={tt('CSAT score')}             value="4.2/5" delta={tt('+0.1 MoM')} trend="up"   icon={Star}         />
            <KpiCard label={tt('Digital deflection')}    value="42%"  delta={tt('+6 pp YoY')}  trend="up"   icon={Activity}     />
          </div>

          <Panel title={tt('Care volume \u2014 calls & chats (12 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={CARE_VOLUME}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="calls" fill="#11567F" radius={[3,3,0,0]} name={tt('Calls')} />
                  <Bar  yAxisId="l" dataKey="chats" fill="#FF4438" radius={[3,3,0,0]} name={tt('Chats')} />
                  <Line yAxisId="r" type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} name={tt('FCR %')} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/contact-center" className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
            <Link to="/portal/voc"            className="text-vfes-dark hover:underline">{tt('Voice of Customer \u2192')}</Link>
            <Link to="/portal/experience"     className="text-vfes-dark hover:underline">{tt('Experience \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: campaigns \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'campaigns' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active campaigns')}    value="12"      delta={tt('across 5 segments')}  trend="flat" icon={Send}        accent />
            <KpiCard label={tt('Conversions MTD')}     value="38.9K"   delta={tt('+14% vs target')}     trend="up"   icon={TrendingUp}  />
            <KpiCard label={tt('Avg conversion rate')} value="11.2%"   delta={tt('+1.8 pp MoM')}        trend="up"   icon={Target}      />
            <KpiCard label={tt('Campaign ARPU uplift')} value="\u20ac14.4" delta={tt('avg per convert')} trend="up"   icon={Award}       />
          </div>

          <Panel title={tt('Campaign performance \u2014 YTD')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Campaign')}</th>
                    <th className="py-2 px-3 text-right">{tt('Sent')}</th>
                    <th className="py-2 px-3 text-right">{tt('Converted')}</th>
                    <th className="py-2 px-3 text-right">{tt('Conv. %')}</th>
                    <th className="py-2 px-3 text-right">{tt('ARPU \u0394')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGN_PERF.map(c => (
                    <tr key={c.campaign} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 px-3 font-semibold">{tt(c.campaign)}</td>
                      <td className="py-2 px-3 text-right font-mono">{(c.sent/1000).toFixed(0)}K</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">{(c.converted/1000).toFixed(1)}K</td>
                      <td className="py-2 px-3 text-right font-bold">{c.convPct}%</td>
                      <td className={`py-2 px-3 text-right font-bold ${c.arpuDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{c.arpuDelta > 0 ? '+' : ''}\u20ac{c.arpuDelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/marketing"       className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
            <Link to="/portal/loyalty-consent" className="text-vfes-dark hover:underline">{tt('Loyalty & Consent \u2192')}</Link>
            <Link to="/portal/digital-app"     className="text-vfes-dark hover:underline">{tt('Digital App \u2192')}</Link>
          </div>
        </>
      )}

      {/* \u2500\u2500 Tab: cohorts \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {tab === 'cohorts' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Cohorts tracked')}     value="24"     delta={tt('quarterly cohorts')}    trend="flat" icon={BarChart3}   accent />
            <KpiCard label={tt('Avg retention 12m')}   value="82%"    delta={tt('+4 pp vs 2022')}        trend="up"   icon={ShieldCheck} />
            <KpiCard label={tt('Best cohort CLV')}     value="\u20ac2,840" delta={tt('2022 Q1 cohort')} trend="up"   icon={Award}       />
            <KpiCard label={tt('CLV growth YoY')}      value="+8.2%"  delta={tt('vs industry +4.8%')}   trend="up"   icon={TrendingUp}  />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Acquisition cohort retention')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={COHORT_PERF}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="retentionPct" radius={[6,6,0,0]} name={tt('Retention %')}>
                      {COHORT_PERF.map((c, i) => <Cell key={i} fill={c.retentionPct >= 85 ? '#10B981' : c.retentionPct >= 78 ? '#FF4438' : '#F59E0B'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Cohort CLV trajectory')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={COHORT_PERF}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="clvNow" stroke="#222128" strokeWidth={2.5} name={tt('CLV now \u20ac')} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/clv"              className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
            <Link to="/portal/churn-retention"  className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
            <Link to="/portal/ai-insights"      className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
          </div>
        </>
      )}
    </>
  )
}

function Pill({ children, color = 'bg-black/5 text-vfes-dark/70' }: { children: any; color?: string }) {
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${color}`}>{children}</span>
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-600" />
  return <Minus className="w-3.5 h-3.5 text-vfes-dark/40" />
}

export default function Customer360Page() {
  const [selectedId, setSelectedId] = useState(customers[0].id)
  const [innerTab, setInnerTab] = useState<DetailTab>('Overview')
  const [tab, setTab] = useState<TabId>('profile360')
  const [search, setSearch] = useState('')
  const [actionToast, setActionToast] = useState<string | null>(null)
  const [nbaGenerated, setNbaGenerated] = useState(false)
  // Reset the NBA reveal whenever the selected customer changes.
  useEffect(() => { setNbaGenerated(false) }, [selectedId])

  // Portfolio-level computed stats
  const totalPortfolioCustomers = useMemo(
    () => PORTFOLIO_SEGMENTS.reduce((s, seg) => s + seg.customers, 0),
    [],
  )
  const avgPortfolioARPU = useMemo(
    () => Math.round(PORTFOLIO_SEGMENTS.reduce((s, seg) => s + seg.arpu * seg.customers, 0) / totalPortfolioCustomers),
    [totalPortfolioCustomers],
  )

  const c: Customer = customers.find((x) => x.id === selectedId) ?? customers[0]
  const e = enrichCustomer(c)
  const filtered = customers.filter(
    (x) => x.name.toLowerCase().includes(search.toLowerCase()) || x.id.includes(search)
  )

  const billingSeries = [...c.invoices].reverse().map((i) => ({ m: i.date.slice(0, 7), amt: i.amount }))
  const npsSeries = [...e.nps].reverse().map((n) => ({ m: n.date.slice(0, 7), score: n.score }))

  // Single source of truth for the NBA — the Generate button, the Recommended
  // Decision panel and the right-rail "Top NBA" card all read from e.nba[0].
  const nba0 = e.nba[0]
  const nbaAlt = e.nba.slice(1, 3)
  const isRetention = nba0?.reasonCode === 'CHURN_PREVENT'
  const cooldownAlt = e.nba.find((n) => n.eligibility === 'Cooldown')
  const reasonText: Record<string, string> = {
    CHURN_PREVENT: `Churn risk is the dominant signal — defend the relationship before chasing revenue.`,
    WALLET_SHARE: `Low churn risk (${e.churn.band}) with wallet headroom — lead with a value-add upsell, not a discount.`,
    TIER_UPGRADE: `Strong tenure and +${c.sentiment} sentiment support a tier move rather than a save offer.`,
  }
  const nbaRationale = nba0 ? (reasonText[nba0.reasonCode] ?? 'Highest expected-value compliant action selected for this profile.') : ''
  const nbaGuardrail = cooldownAlt
    ? `Guardrail: "${tt(cooldownAlt.title)}" is in a ${cooldownAlt.cooldownDays}-day cooldown — present the single eligible offer only; all actions audited via approvals.`
    : `Guardrail: respect contact-policy caps — one offer this cycle; all actions audited via approvals.`
  const nbaResult = nba0 ? {
    headline: `Recommended: ${tt(nba0.title)}`,
    stats: [
      { label: 'Expected value', value: `BSD ${nba0.expectedValue}` },
      { label: 'Confidence', value: `${(nba0.confidence * 100).toFixed(0)}%` },
      { label: 'Best channel', value: nba0.channel },
      { label: 'Modelled uplift', value: nba0.uplift },
    ],
    findings: [
      nbaRationale,
      isRetention
        ? `Contract ends in ${e.contract.daysRemaining} days — retention timing is tight; act on the highest-value line first.`
        : `Contract runs ${e.contract.daysRemaining} more days — no retention pressure, so this is a growth play rather than a save.`,
      nbaAlt.length ? `Ranked alternatives: ${nbaAlt.map((n) => `${tt(n.title)} (EV BSD ${n.expectedValue})`).join(' · ')}.` : 'No compliant alternatives cleared the value threshold.',
      nbaGuardrail,
    ],
    note: 'Same decision is mirrored to the agent desktop and the MyREV app — one NBA, every channel.',
  } : undefined

  const fireAction = (msg: string) => {
    setActionToast(msg)
    setTimeout(() => setActionToast(null), 3000)
  }

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Customer 360')}
        subtitle={tt('Unified, real-time view across billing, network, care, AI signals & compliance.')}
      />

      <div className="mb-6 rounded-2xl border border-vfes-red/20 bg-gradient-to-br from-vfes-red/5 to-white p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vfes-dark mb-2">
          <Sparkles className="w-3 h-3" /> {tt('Next-best-action for this customer (Cortex)')}
        </div>
        <div className="pt-1">
          <AgentAction key={selectedId} label="Generate Next-Best-Action" runningLabel="Reasoning…"
            steps={[
              'Fused billing, usage, care & network signals',
              'Scored retain / upsell / care propensities',
              'Selected highest-value compliant action',
              'Pushed to agent desktop & MyREV app',
            ]}
            result={nbaResult}
            onComplete={() => setNbaGenerated(true)} />
        </div>
        {!nbaGenerated && (
          <div className="mt-2 text-xs text-vfes-dark/55">{tt('Click Generate to score retain / upsell / care propensities and produce the highest-value compliant action for this customer.')}</div>
        )}
        {nbaGenerated && nba0 && (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-xs border-t border-black/5 pt-3">
            <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold">{tt(isRetention ? "don't stack offers — respect contact-policy caps" : 'single eligible offer this cycle — respect cooldowns')}</span>
            <div className="flex items-center gap-3">
              <a href={isRetention ? '#/portal/churn-retention' : '#/portal/bundle-propensity'} className="text-vfes-dark font-semibold hover:underline">{tt(isRetention ? 'Open Churn & Retention' : 'Open Bundle Propensity')} →</a>
              <button onClick={() => fireAction(`NBA "${tt(nba0.title)}" ${tt('applied · approval requested')}`)} className="shrink-0 bg-vfes-red text-vfes-dark text-xs font-bold px-5 py-2 rounded-lg hover:bg-vfes-red-dark">{tt('Apply')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {actionToast && (
        <div className="fixed top-20 right-6 z-50 bg-vfes-dark text-white px-4 py-3 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {actionToast}
        </div>
      )}

      {/* ── Outer portfolio tab nav ──────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ── Tab: profile360 (master-detail) ──────────────────── */}
      {tab === 'profile360' && (
      <div className="grid lg:grid-cols-[260px,1fr,320px] gap-6">
        {/* === Customer list === */}
        <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4 h-fit lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vfes-dark/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tt('Search…')}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-vfes-red/40"
            />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.map((x) => (
              <button
                key={x.id}
                onClick={() => setSelectedId(x.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition border ${
                  x.id === selectedId
                    ? 'bg-vfes-red/5 border-vfes-red/30'
                    : 'border-transparent hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CustomerAvatar seed={x.id} name={tt(x.name)} size={36} className="shrink-0 rounded-full ring-1 ring-black/5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{tt(x.name)}</div>
                      <div className="text-xs text-vfes-dark/55 truncate">{x.id} · {x.city}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${riskColor[x.churnRisk]}`}>
                    {tt(x.churnRisk)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* === Customer detail === */}
        <div className="space-y-6 min-w-0">
          {/* Header card with flags */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 -mr-32 -mt-32 rounded-full bg-vfes-red/5 pointer-events-none" />
            <div className="relative flex items-start gap-5 flex-wrap">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-vfes-red/20 shadow-sm shrink-0 bg-gradient-to-br from-amber-50 to-amber-100">
                <CustomerAvatar seed={c.id} name={tt(c.name)} size={80} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-extrabold">{tt(c.name)}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tierColor[c.tier]}`}>{tt(c.tier)}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${riskColor[c.churnRisk]}`}>{tt(c.churnRisk)} {tt('churn risk')}</span>
                  {e.vulnerable.flag && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Vulnerable
                    </span>
                  )}
                  {e.outage.affected && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Outage exposure
                    </span>
                  )}
                  {e.comregFlag && <Pill color="bg-amber-50 text-amber-700">{tt('URCA flagged')}</Pill>}
                  {e.doNotDispatch && <Pill color="bg-red-50 text-red-700">{tt('Do not dispatch')}</Pill>}
                </div>
                <div className="text-vfes-dark/60 text-sm mt-1 flex flex-wrap gap-x-5 gap-y-1">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {c.id}</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.city}, {c.county}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {tt('Member since')} {c.joined}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {tt('Household')}: {e.household.length}</span>
                </div>
              </div>
            </div>

            {/* Key signals strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 relative">
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label={tt('Lifetime Value')} value={`BSD ${c.ltv.toLocaleString()}`} sub={`${tt('Forecast 36m')}: BSD ${e.clv.forecast36m.toLocaleString()}`} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label={tt('MRR')} value={`BSD ${c.mrr}`} sub={`${e.cohortRank.valuePercentile}º ${tt('%ile in tier')}`} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label={tt('Tenure')} value={`${c.tenureYears} ${tt('yrs')}`} sub={`${e.cohortRank.engagementPercentile}º ${tt('%ile engaged')}`} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label={tt('Churn score')} value={`${e.churn.score}/100`} sub={`v${e.churn.modelVersion} · ${(e.churn.confidence * 100).toFixed(0)}% conf`} color={e.churn.score > 60 ? 'text-red-600' : e.churn.score > 30 ? 'text-amber-600' : 'text-emerald-600'} /></div>
              <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3"><Stat label={tt('Sentiment')} value={`${c.sentiment}`} sub={c.sentiment > 75 ? tt('Promoter') : c.sentiment > 50 ? tt('Passive') : tt('Detractor')} color={c.sentiment > 75 ? 'text-emerald-600' : c.sentiment < 50 ? 'text-red-600' : 'text-amber-600'} /></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-black/10 overflow-x-auto">
            {DETAIL_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setInnerTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold transition relative whitespace-nowrap ${
                  innerTab === t ? 'text-vfes-dark' : 'text-vfes-dark/55 hover:text-vfes-dark'
                }`}
              >
                {tt(t)}
                {innerTab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-vfes-red" />}
              </button>
            ))}
          </div>

          {/* === OVERVIEW === */}
          {innerTab === 'Overview' && (
            <div className="space-y-6">
              {/* Service address + Carto map */}
              <Panel title={tt('Service address')} action={<MapPin className="w-4 h-4 text-vfes-dark/40" />}>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-2 text-sm">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Installation address')}</div>
                      <div className="font-bold text-base mt-1">{c.address}</div>
                      <div className="text-vfes-dark/70">{c.city}, {c.county}</div>
                      <div className="text-vfes-dark/55 text-xs">{tt('The Bahamas')}</div>
                    </div>
                    <div className="pt-2 border-t border-black/5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Postcode')}</div>
                        <div className="font-mono font-semibold">
                          {c.city.slice(0,1).toUpperCase()}{(customerSeed(c.id) % 90 + 10)} {(customerSeed(c.id) % 9000 + 1000)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Premise type')}</div>
                        <div className="font-semibold">
                          {(['Detached', 'Semi-detached', 'Apartment', 'Terrace'])[customerSeed(c.id) % 4] && tt((['Detached', 'Semi-detached', 'Apartment', 'Terrace'])[customerSeed(c.id) % 4])}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Access tech')}</div>
                        <div className="font-semibold">{tt(e.premiseTech?.tech ?? 'Mobile-only')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Coverage')}</div>
                        <div className="font-semibold text-emerald-700">{tt('In-footprint')}</div>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address + ', ' + c.city + ', The Bahamas')}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5"
                      >
                        {tt('Directions')}
                      </a>
                      <button
                        onClick={() => fireAction('Engineer ETA requested for service address')}
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5"
                      >
                        {tt('Engineer ETA')}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <CartoMap
                      key={c.id}
                      basemap="voyager"
                      height={260}
                      center={latLngFor(c.city, customerSeed(c.id))}
                      zoom={14}
                      markers={[{
                        name: c.name,
                        lat: latLngFor(c.city, customerSeed(c.id))[0],
                        lng: latLngFor(c.city, customerSeed(c.id))[1],
                        radius: 12,
                        color: '#FF4438',
                        pulse: e.outage.affected,
                        tooltip: `${c.address}<br/>${c.city}, ${c.county}<br/>${c.tier} · ${c.id}`,
                      }]}
                    />
                  </div>
                </div>
              </Panel>

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Household & Identity')} action={<Users className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="space-y-2">
                    {e.household.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0">
                        <div>
                          <div className="font-semibold">{tt(m.name)} {m.primary && <Pill color="bg-vfes-red/10 text-vfes-dark ml-1">{tt('Primary')}</Pill>}</div>
                          <div className="text-xs text-vfes-dark/55">{tt(m.relation)} {m.line && `· ${m.line}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Single Customer View — system IDs')}</div>
                    <div className="space-y-1 text-xs">
                      {e.systemIds.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-vfes-dark/60">{tt(s.source)}</span>
                          <span className="font-mono">{s.id}</span>
                          {s.status === 'matched' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title={tt('Consent & Preferences (Data Protection Act)')} action={<ShieldCheck className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="space-y-1.5 text-sm">
                    {e.consents.map((cs, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                        <div>
                          <div className="font-semibold text-xs">{tt(cs.channel)}</div>
                          <div className="text-[10px] text-vfes-dark/55">{tt(cs.source)} · {cs.date}</div>
                        </div>
                        {cs.granted ? <Pill color="bg-emerald-50 text-emerald-700">{tt('Opt-in')}</Pill> : <Pill color="bg-red-50 text-red-700">{tt('Opt-out')}</Pill>}
                      </div>
                    ))}
                  </div>
                  {e.vulnerable.flag && (
                    <div className="mt-3 pt-3 border-t border-black/5 bg-purple-50 -mx-4 px-4 py-2 rounded-b">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-purple-700">{tt('Vulnerable customer')}</div>
                      <div className="text-xs">{e.vulnerable.reason}</div>
                      <div className="text-xs text-vfes-dark/60 mt-1">Accommodations: {e.accessibility.join(', ')}</div>
                    </div>
                  )}
                </Panel>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Spend (last 6 mo)')}>
                  <div className="h-44">
                    <ResponsiveContainer>
                      <LineChart data={billingSeries}>
                        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                        <XAxis dataKey="m" stroke="#999" fontSize={11} />
                        <YAxis stroke="#999" fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="amt" stroke="#222128" strokeWidth={2} dot={{ fill: '#FF4438' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
                <Panel title={tt('Cohort comparison')} action={<BarChart3 className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="space-y-3">
                    {e.cohort.map((s) => (
                      <div key={s.metric}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold">{tt(s.metric)}</span>
                          <span className="text-vfes-dark/55">{s.thisCustomer} <span className="text-vfes-dark/35">{tt('vs cohort')} {s.cohortMedian}</span></span>
                        </div>
                        <div className="relative h-2 bg-black/5 rounded">
                          <div className="absolute top-0 left-0 h-2 bg-vfes-red rounded" style={{ width: `${s.percentile}%` }} />
                        </div>
                        <div className="text-[10px] text-vfes-dark/55 mt-0.5">{s.percentile}º {tt('percentile in')} {tt(c.tier)} {tt('tier')}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {/* Talk-track / playbook */}
              <Panel title={`${tt('Recommended playbook')} — ${tt(e.playbook.intent)}`} action={<ClipboardList className="w-4 h-4 text-vfes-dark" />}>
                <div className="bg-[#fafbfc] border-l-4 border-vfes-red p-3 rounded-r text-sm italic text-vfes-dark/80">{tt(e.playbook.script)}</div>
                <div className="text-xs text-vfes-dark/65 mt-2"><span className="font-bold">{tt('Next step:')}</span> {tt(e.playbook.nextStep)}</div>
              </Panel>
            </div>
          )}

          {/* === SERVICES === */}
          {innerTab === 'Services' && (
            <div className="space-y-6">
              <Panel title={tt('Active services')}>
                <div className="space-y-3">
                  {c.services.map((s) => (
                    <div key={tt(s.name)} className="flex items-center gap-4 p-4 rounded-lg bg-[#fafbfc] border border-black/5">
                      <div className="w-10 h-10 rounded-lg bg-vfes-red/10 text-vfes-dark grid place-items-center"><ServiceIcon name={tt(s.name)} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{tt(s.name)}</div>
                        <div className="text-xs text-vfes-dark/55">Active since {s.since} {s.speed && `· ${s.speed}`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">BSD {s.mrr}</div>
                        <div className="text-xs text-vfes-dark/55">{tt('/ month')}</div>
                      </div>
                      <Pill color="bg-emerald-50 text-emerald-700">{tt(s.status)}</Pill>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Mobile · plan & usage (tech-aware) */}
              <Panel title={tt('Mobile · plan & usage')} action={<Link to="/portal/mobile-ran" className="text-xs font-bold text-vfes-dark hover:underline flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Open Mobile RAN →')}</Link>}>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Active mobile lines')}</div>
                    <div className="text-2xl font-extrabold">{(((c.id?.charCodeAt(0) ?? 67) % 3) + 1)}</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('1 primary · family lines included')}</div>
                  </div>
                  <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('5G plan tier')}</div>
                    <div className="text-2xl font-extrabold">{['XL', 'L', 'M'][((c.id?.charCodeAt(1) ?? 70) % 3)]}</div>
                    <div className="text-[10px] text-emerald-600">{tt('5G SA active')} · 145 Mbps</div>
                  </div>
                  <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Voice MOS (30d)')}</div>
                    <div className="text-2xl font-extrabold">{(4.05 + (((c.id?.charCodeAt(2) ?? 80) % 30) / 100)).toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-600">{tt('above MNO avg 4.10')}</div>
                  </div>
                  <div className="rounded-lg border border-black/5 p-3 bg-[#fafbfc]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('MNP port-out risk')}</div>
                    <div className={`text-2xl font-extrabold ${((c.id?.charCodeAt(3) ?? 70) % 100) > 70 ? 'text-red-600' : ((c.id?.charCodeAt(3) ?? 70) % 100) > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{((c.id?.charCodeAt(3) ?? 70) % 100) > 70 ? tt('High') : ((c.id?.charCodeAt(3) ?? 70) % 100) > 40 ? tt('Medium') : tt('Low')}</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('vs BTC / Rival ISP A')}</div>
                  </div>
                </div>
              </Panel>

              <div className="grid md:grid-cols-2 gap-6">
                {e.premiseTech ? (
                  <Panel title={tt('Premise tech')}>
                    <dl className="text-sm space-y-2">
                      <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Access tech')}</dt><dd className="font-semibold">{e.premiseTech.tech}</dd></div>
                      <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Modem model')}</dt><dd className="font-semibold">{e.premiseTech.modemModel}</dd></div>
                      <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Wi-Fi pods')}</dt><dd className="font-semibold">{e.premiseTech.pods}</dd></div>
                      <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Mesh health')}</dt><dd className="font-semibold">{e.premiseTech.meshHealth}%</dd></div>
                    </dl>
                  </Panel>
                ) : (
                  <Panel title={tt('Premise tech')}><div className="text-sm text-vfes-dark/55">{tt('No fixed-line service on this account.')}</div></Panel>
                )}
                <Panel title={tt('Bundle propensity (next-best-bundle)')}>
                  <div className="space-y-2">
                    {e.bundlePropensity.map((b, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{b.bundle}</span>
                          <span>{(b.probability * 100).toFixed(0)}% · ≤BSD {b.willPayUpTo}</span>
                        </div>
                        <div className="h-1.5 bg-black/5 rounded">
                          <div className="h-1.5 bg-vfes-red rounded" style={{ width: `${b.probability * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Source: CBL_ANALYTICS.ML_OUTPUTS.BUNDLE_PROPENSITY · UC2')}</div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* === NETWORK === */}
          {innerTab === 'Network' && (
            <div className="space-y-6">
              {/* Outage exposure (cross-domain) */}
              <Panel title={tt('Outage exposure')} action={<AlertTriangle className={`w-4 h-4 ${e.outage.affected ? 'text-red-500' : 'text-vfes-dark/40'}`} />}>
                {e.outage.affected ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 font-bold text-red-700">
                      <AlertCircle className="w-4 h-4" /> Affected by {e.outage.incidentId} · {e.outage.severity} · {e.outage.domain} domain
                    </div>
                    <div className="text-sm mt-1">{e.outage.reason}</div>
                    <div className="text-xs text-vfes-dark/65 mt-2">ETA: {e.outage.eta}</div>
                    <a href="#/portal/war-room" className="inline-block mt-3 text-xs font-semibold text-vfes-dark hover:underline">{tt('Open in War Room →')}</a>
                  </div>
                ) : (
                  <div className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Not affected by any open incident across {[e.hasBroadband && 'Fixed', e.hasMobile && 'Mobile', e.hasTv && 'TV'].filter(Boolean).join(' / ')} domains</div>
                )}
              </Panel>

              {/* === BROADBAND / MODEM === */}
              {e.hasBroadband && e.modem && (
                <Panel title={`Broadband — ${e.modem.model}`} action={<Wifi className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-[#fafbfc] border border-black/5 mb-4">
                    <div className={`w-3 h-3 rounded-full ${e.modem.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <div className="font-bold">{e.modem.online ? 'Online' : 'OFFLINE'}</div>
                      <div className="text-xs text-vfes-dark/55">
                        {e.modem.online ? `Up ${Math.floor(e.modem.uptimeHours / 24)}d ${e.modem.uptimeHours % 24}h` : 'Last seen ' + e.modem.lastReboot}
                        · FW {e.modem.firmware} · {e.premiseTech?.tech}
                      </div>
                    </div>
                    <button onClick={() => fireAction('Modem reboot dispatched')} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Reboot
                    </button>
                    <button onClick={() => fireAction('Speed test triggered')} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Speed test
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <Stat label={tt('Last speedtest down')} value={`${e.modem.lastSpeedTest.down} Mbps`} sub={e.modem.lastSpeedTest.ts} />
                    <Stat label={tt('Last speedtest up')} value={`${e.modem.lastSpeedTest.up} Mbps`} sub={e.modem.lastSpeedTest.ts} />
                    <Stat label={tt('Down / Up power')} value={`${e.modem.downstreamPower} / ${e.modem.upstreamPower}`} />
                    <Stat label={tt('SNR / Packet loss')} value={`${e.modem.snr} / ${e.modem.packetLoss}`} />
                  </div>
                  {e.premiseTech && (
                    <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Stat label={tt('Wi-Fi pods')} value={`${e.premiseTech.pods}`} />
                      <Stat label={tt('Mesh health')} value={`${e.premiseTech.meshHealth}%`} color={e.premiseTech.meshHealth > 80 ? 'text-emerald-600' : 'text-amber-600'} />
                      <Stat label={tt('Tech')} value={e.premiseTech.tech} />
                      <Stat label={tt('MAC')} value={e.modem.mac} />
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Source: BESIX Router Telemetry · Snowpipe Streaming')}</div>
                </Panel>
              )}

              {/* === MOBILE DEVICES === */}
              {e.hasMobile && e.mobileDevices.map((d, i) => (
                <Panel key={d.imei} title={`Mobile — ${d.lineName} · ${d.model}`} action={<Smartphone className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-[#fafbfc] border border-black/5 mb-4">
                    {/* Signal bars */}
                    <div className="flex items-end gap-0.5 h-7">
                      {[1, 2, 3, 4, 5].map((b) => (
                        <div key={b} className={`w-1.5 rounded-sm ${b <= d.bars ? (d.bars > 3 ? 'bg-emerald-500' : d.bars > 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-black/10'}`} style={{ height: `${b * 20}%` }} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold flex items-center gap-2">
                        {d.network}
                        <span className="text-xs font-normal text-vfes-dark/55">{d.signalDbm} dBm RSRP · {d.cell}</span>
                      </div>
                      <div className="text-xs text-vfes-dark/55">
                        {d.msisdn} · {d.os} · IMEI {d.imei.slice(0, 8)}…
                        {d.esim && <span className="ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold">{tt('eSIM')}</span>}
                        {d.voltePresent && <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">{tt('VoLTE')}</span>}
                        {d.vowifiPresent && <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">{tt('VoWiFi')}</span>}
                        {d.roaming && <span className="ml-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold">{tt('Roaming')}</span>}
                      </div>
                    </div>
                    <button onClick={() => fireAction(`Provisioning push sent to ${d.msisdn}`)} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <Send className="w-3 h-3" /> Push provisioning
                    </button>
                    <button onClick={() => fireAction(`Cell-site test requested for ${d.cell}`)} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Cell test
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Data — this cycle')}</div>
                      <div className="text-lg font-extrabold">
                        {d.dataUsedGB} <span className="text-sm font-normal text-vfes-dark/55">/ {d.dataCapGB === 'Unlimited' ? '∞' : `${d.dataCapGB} GB`}</span>
                      </div>
                      {d.dataCapGB !== 'Unlimited' && (
                        <div className="mt-1 h-1.5 bg-black/5 rounded">
                          <div className={`h-1.5 rounded ${d.dataUsedGB / (d.dataCapGB as number) > 0.85 ? 'bg-red-500' : d.dataUsedGB / (d.dataCapGB as number) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (d.dataUsedGB / (d.dataCapGB as number)) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <Stat label={tt('Voice this month')} value={`${d.voiceMinutes} min`} />
                    <Stat label={tt('SMS this month')} value={`${d.smsCount}`} />
                    <Stat label={tt('Last activity')} value={d.lastActivity.split(' ').slice(1).join(' ')} sub={d.lastActivity.split(' ')[0]} color={d.lastActivity.includes('lost') ? 'text-red-600' : 'text-vfes-dark'} />
                  </div>
                  <div className="mt-2 text-[10px] text-vfes-dark/55">{tt('Source: Cable Bahamas RAN telemetry · MNP/CRM (Salesforce) · device IMEI register · refresh ~5 min')}</div>
                </Panel>
              ))}

              {/* === TV DEVICE === */}
              {e.hasTv && e.tvDevice && (
                <Panel title={`TV — ${e.tvDevice.model}`} action={<Tv className="w-4 h-4 text-vfes-dark/40" />}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-[#fafbfc] border border-black/5 mb-4">
                    <div className={`w-3 h-3 rounded-full ${e.tvDevice.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <div className="font-bold">{e.tvDevice.online ? 'Online' : 'OFFLINE'}</div>
                      <div className="text-xs text-vfes-dark/55">
                        {e.tvDevice.online ? `Up ${Math.floor(e.tvDevice.uptimeHours / 24)}d ${e.tvDevice.uptimeHours % 24}h` : 'Box not responding'}
                        · App {e.tvDevice.appVersion} · S/N {e.tvDevice.serial}
                      </div>
                    </div>
                    <button onClick={() => fireAction('TV box reboot dispatched')} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Reboot
                    </button>
                    <button onClick={() => fireAction('EPG / app refresh pushed')} className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5 flex items-center gap-1">
                      <Send className="w-3 h-3" /> Push EPG
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <Stat label={tt('Channels watched (7d)')} value={`${e.tvDevice.channelsWatched7d}`} />
                    <Stat label={tt('Top channel')} value={e.tvDevice.topChannel} />
                    <Stat label={tt('Recordings')} value={`${e.tvDevice.recordings}`} sub={`${e.tvDevice.storageUsedPct}% storage`} />
                    <Stat label={tt('Last activity')} value={e.tvDevice.lastActivity.split(' ').slice(1).join(' ')} sub={e.tvDevice.lastActivity.split(' ')[0]} />
                  </div>
                  <div className="mt-2 text-[10px] text-vfes-dark/55">Source: REVTV Box platform telemetry · Cerillion middleware · IP {e.tvDevice.ip}</div>
                </Panel>
              )}

              {/* No-device fallback */}
              {!e.hasBroadband && !e.hasMobile && !e.hasTv && (
                <Panel title={tt('No connected devices on file')}><div className="text-sm text-vfes-dark/55">{tt('This customer has no active services with telemetry.')}</div></Panel>
              )}

              {/* Truck rolls */}
              <Panel title={tt('Field engineer history')}>
                {e.truckRolls.length === 0 ? (
                  <div className="text-sm text-vfes-dark/55">{tt('No site visits on record.')}</div>
                ) : (
                  <div className="space-y-2">
                    {e.truckRolls.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                        <div className="text-xs text-vfes-dark/55 w-24 shrink-0">{t.date}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{t.reason}</div>
                          <div className="text-xs text-vfes-dark/55">{t.engineer} · {t.outcome}</div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= t.rating ? 'text-amber-500 fill-amber-500' : 'text-black/15'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* === RELATIONSHIPS === */}
          {innerTab === 'Relationships' && (
            <div className="space-y-6">
              <Panel title={tt('Relationship graph')} action={<Users className="w-4 h-4 text-vfes-dark/40" />}>
                <div className="text-xs text-vfes-dark/60 mb-3">
                  Hover any node for full details. Green dot ● indicates an Rival ISP A customer — click to open their 360.
                  Built from <span className="font-mono">{tt('CRM Salesforce')}</span>, <span className="font-mono">{tt('CBL_ANALYTICS.IDENTITY.HOUSEHOLD_GRAPH')}</span> and <span className="font-mono">{tt('CBL_BUSINESS.ACCOUNTS')}</span>.
                </div>
                <RelationshipGraph
                  graph={e.graph}
                  onOpenCustomer={(id) => {
                    const exists = customers.find(x => x.id === id)
                    if (exists) {
                      setSelectedId(id)
                      setInnerTab('Overview')
                    } else {
                      fireAction(`Opening linked account ${id} in new context…`)
                    }
                  }}
                />
              </Panel>

              <Panel title={tt('Relationship summary')}>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Linked nodes')}</div>
                    <div className="text-2xl font-extrabold mt-1">{e.graph.nodes.length - 1}</div>
                    <div className="text-xs text-vfes-dark/55 mt-1">{tt('Excluding the account holder')}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Cable Bahamas customer links')}</div>
                    <div className="text-2xl font-extrabold mt-1">{e.graph.nodes.filter(n => n.isCustomer && n.kind !== 'self').length}</div>
                    <div className="text-xs text-vfes-dark/55 mt-1">{tt('Each represents cross-sell / household value')}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Household size')}</div>
                    <div className="text-2xl font-extrabold mt-1">{e.household.length + 1}</div>
                    <div className="text-xs text-vfes-dark/55 mt-1">{tt('Self-declared + observed mobile lines')}</div>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* === BILLING === */}
          {innerTab === 'Billing' && (
            <div className="space-y-6">
              {/* Contract status */}
              <Panel title={tt('Contract')} action={<FileText className="w-4 h-4 text-vfes-dark/40" />}>
                <div className="grid md:grid-cols-4 gap-4">
                  <Stat label={tt('Status')} value={e.contract.status} color={e.contract.status === 'In contract' ? 'text-emerald-600' : 'text-amber-600'} />
                  <Stat label={tt('End date')} value={e.contract.endDate} sub={`${e.contract.daysRemaining} days`} color={e.contract.daysRemaining < 60 ? 'text-red-600' : 'text-vfes-dark'} />
                  <Stat label={tt('Plan')} value={e.contract.planName} sub={`${e.contract.minTerm}m term`} />
                  <Stat label={tt('ETF')} value={`BSD ${e.contract.etf}`} sub="Early-termination fee" />
                </div>
                {e.priceRise.sent && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                    <span className="font-bold">Annual price rise: +{e.priceRise.pctIncrease.toFixed(1)}%</span> notification sent {e.priceRise.date} · {e.priceRise.ack ? 'Customer acknowledged' : 'Awaiting acknowledgement'}
                  </div>
                )}
              </Panel>

              {/* Active discounts */}
              <Panel title={tt('Active discounts (cliff watch)')} action={<Gift className="w-4 h-4 text-vfes-dark/40" />}>
                {e.discounts.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No active discounts.')}</div> : (
                  <div className="space-y-2">
                    {e.discounts.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded bg-[#fafbfc] border border-black/5">
                        <div>
                          <div className="font-semibold text-sm">{tt(d.name)}</div>
                          <div className="text-xs text-vfes-dark/55">{d.pct}% off · expires {d.expires}</div>
                        </div>
                        <div className="font-bold text-red-600">{d.mrrImpact > 0 ? '+' : ''}BSD {d.mrrImpact}/mo</div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Payment + dunning */}
              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Payment method')} action={<CreditCard className="w-4 h-4 text-vfes-dark/40" />}>
                  <dl className="text-sm space-y-2">
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Method')}</dt><dd className="font-semibold">{e.paymentMethod.type}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Last 4')}</dt><dd className="font-mono">•••• {e.paymentMethod.last4}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Failed attempts')}</dt><dd className={e.paymentMethod.failedCount > 0 ? 'text-red-600 font-bold' : ''}>{e.paymentMethod.failedCount}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Dunning stage')}</dt><dd>{e.paymentMethod.dunningStage === 0 ? 'None' : e.paymentMethod.dunningStage === 1 ? 'Reminder sent' : e.paymentMethod.dunningStage === 2 ? 'Service warning' : 'Pre-suspension'}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Credit score')}</dt><dd className="font-bold">{e.creditScore}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Bad debt')}</dt><dd>{e.badDebt.status}</dd></div>
                  </dl>
                </Panel>
                <Panel title={tt('Open orders')}>
                  {e.orders.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No open orders.')}</div> : (
                    <div className="space-y-2">
                      {e.orders.map((o) => (
                        <div key={o.id} className="p-3 rounded bg-[#fafbfc] border border-black/5">
                          <div className="flex justify-between">
                            <span className="font-semibold text-sm">{o.type}</span>
                            <Pill color="bg-amber-50 text-amber-700">{tt(o.status)}</Pill>
                          </div>
                          <div className="text-xs text-vfes-dark/55 mt-1">{o.id} · scheduled {o.scheduled}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Invoices */}
              <Panel title={tt('Last 6 invoices')}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-2">{tt('Invoice')}</th><th>{tt('Date')}</th><th>{tt('Amount')}</th><th>{tt('Status')}</th></tr>
                    </thead>
                    <tbody>
                      {c.invoices.map((i) => (
                        <tr key={i.id} className="border-t border-black/5">
                          <td className="py-3 font-mono">{i.id}</td>
                          <td>{i.date}</td>
                          <td className="font-semibold">BSD {i.amount}</td>
                          <td><Pill color={i.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : i.status === 'Open' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}>{tt(i.status)}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {/* === CARE === */}
          {innerTab === 'Care' && (
            <div className="space-y-6">
              <Panel title={tt('Open cases & SLA')} action={<Headphones className="w-4 h-4 text-vfes-dark/40" />}>
                {e.cases.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No open cases.')}</div> : (
                  <div className="space-y-2">
                    {e.cases.map((cs) => (
                      <div key={cs.id} className="p-3 rounded bg-[#fafbfc] border border-black/5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Pill color={cs.priority === 'P1' ? 'bg-red-50 text-red-700' : cs.priority === 'P2' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'}>{cs.priority}</Pill>
                            <span className="font-semibold text-sm truncate">{tt(cs.title)}</span>
                          </div>
                          <Pill color={cs.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : cs.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}>{tt(cs.status)}</Pill>
                        </div>
                        <div className="text-xs text-vfes-dark/55 mt-1 flex flex-wrap gap-3">
                          <span>{cs.id}</span>
                          <span>Owner {tt(cs.owner)}</span>
                          <span>SLA {cs.sla}</span>
                          <span>Updated {cs.lastUpdate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {e.promises.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Promises')}</div>
                    {e.promises.map((p, i) => (
                      <div key={i} className="text-sm flex items-center gap-3 p-2 bg-[#fafbfc] rounded">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold">{p.type}</span>
                        <span className="text-vfes-dark/55">due {p.due}</span>
                        <Pill color={p.breachRisk === 'High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}>{p.breachRisk} breach risk</Pill>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Recent touchpoints')}>
                  <div className="space-y-2">
                    {c.interactions.map((it, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded bg-[#fafbfc] border border-black/5">
                        <div className="text-xs text-vfes-dark/55 w-24 shrink-0">{it.date}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{it.topic}</div>
                          <div className="text-xs text-vfes-dark/55">{it.channel}</div>
                        </div>
                        <Pill color={it.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700' : it.sentiment === 'Negative' ? 'bg-red-50 text-red-700' : 'bg-black/5 text-vfes-dark/70'}>{it.sentiment}</Pill>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title={tt('Tobi (chatbot) transcripts')} action={<Bot className="w-4 h-4 text-vfes-dark/40" />}>
                  {e.tobi.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No bot interactions in last 30d.')}</div> : (
                    <div className="space-y-2">
                      {e.tobi.map((t, i) => (
                        <div key={i} className="p-3 rounded bg-[#fafbfc] border border-black/5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{t.intent}</span>
                            <Pill color={t.resolution === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{t.resolution}</Pill>
                          </div>
                          <div className="text-xs text-vfes-dark/55 mt-1">{t.date} · {t.messages} msgs</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel title={tt('Agent notes (Cortex AI summarised)')} action={<MessageSquare className="w-4 h-4 text-vfes-dark/40" />}>
                <div className="space-y-3">
                  {e.agentNotes.map((n, i) => (
                    <div key={i} className="p-3 rounded bg-[#fafbfc] border border-black/5">
                      <div className="flex items-center justify-between text-xs text-vfes-dark/55 mb-1">
                        <span className="font-semibold">{n.agent}</span>
                        <span>{n.date}</span>
                      </div>
                      <div className="text-sm">{n.note}</div>
                      <div className="text-xs italic text-vfes-dark mt-2 flex items-start gap-1">
                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> <span>{n.aiSummary}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('NPS history')}>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <LineChart data={npsSeries}>
                        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                        <XAxis dataKey="m" stroke="#999" fontSize={11} />
                        <YAxis domain={[0, 10]} stroke="#999" fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="score" stroke="#222128" strokeWidth={2} dot={{ fill: '#FF4438' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs italic text-vfes-dark/65 mt-2">"{e.nps[0].verbatim}"</div>
                </Panel>
                <Panel title={tt('Sentiment drivers (Cortex AI on transcripts)')}>
                  <div className="space-y-2">
                    {e.sentimentDrivers.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <TrendIcon trend={d.trend} />
                        <span className="flex-1">{d.driver}</span>
                        <span className={`font-bold ${d.impact > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{d.impact > 0 ? '+' : ''}{d.impact}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* === INSIGHTS (Predictive) === */}
          {innerTab === 'Insights' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Panel title={tt('Churn score')}>
                  <div className={`text-4xl font-extrabold ${e.churn.score > 60 ? 'text-red-600' : e.churn.score > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{e.churn.score}<span className="text-sm font-normal text-vfes-dark/55">/100</span></div>
                  <div className="text-xs text-vfes-dark/55 mb-3">Model {e.churn.modelVersion} · {(e.churn.confidence * 100).toFixed(0)}% confidence</div>
                  <div className="space-y-1.5 text-xs">
                    {e.churn.reasons.map((r) => (
                      <div key={r.code} className="flex items-center justify-between">
                        <span className="font-mono text-[10px]">{r.code}</span>
                        <span className={`font-bold ${r.weight > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.weight > 0 ? '+' : ''}{(r.weight * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title={tt('CLV (current → 36m)')}>
                  <div className="text-4xl font-extrabold">BSD {e.clv.current.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <TrendIcon trend={e.clv.trend} />
                    <span className="font-bold">BSD {e.clv.forecast36m.toLocaleString()}</span>
                    <span className="text-vfes-dark/55">{tt('forecast 36m')}</span>
                  </div>
                  <a href="#/portal/clv-explorer" className="inline-block text-xs font-semibold text-vfes-dark hover:underline mt-3">{tt('Open CLV Explorer →')}</a>
                </Panel>
                <Panel title={tt('Risk profile')}>
                  <dl className="text-sm space-y-1.5">
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Price sensitivity')}</dt><dd className="font-semibold">{e.priceSensitivity}</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Complaint risk')}</dt><dd className={e.complaintRisk > 0.4 ? 'text-red-600 font-bold' : ''}>{(e.complaintRisk * 100).toFixed(0)}%</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Fraud score')}</dt><dd>{(e.fraudScore * 100).toFixed(1)}%</dd></div>
                    <div className="flex justify-between"><dt className="text-vfes-dark/55">{tt('Credit score')}</dt><dd className="font-bold">{e.creditScore}</dd></div>
                  </dl>
                </Panel>
              </div>

              {/* NBA list */}
              <Panel title={tt('Next-best-action queue (ranked)')} action={<Sparkles className="w-4 h-4 text-vfes-dark" />}>
                <div className="space-y-3">
                  {e.nba.map((n, i) => (
                    <div key={n.id} className="p-4 rounded-lg bg-[#fafbfc] border border-black/5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold w-6 h-6 rounded-full bg-vfes-red text-vfes-dark grid place-items-center">{i + 1}</span>
                        <span className="font-bold flex-1">{tt(n.title)}</span>
                        <Pill color={n.eligibility === 'Eligible' ? 'bg-emerald-50 text-emerald-700' : n.eligibility === 'Cooldown' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}>{n.eligibility}{n.cooldownDays > 0 ? ` ${n.cooldownDays}d` : ''}</Pill>
                      </div>
                      <div className="text-xs text-vfes-dark/55 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        <span><span className="font-semibold">{tt('Channel:')}</span> {n.channel}</span>
                        <span><span className="font-semibold">{tt('Reason:')}</span> <span className="font-mono">{n.reasonCode}</span></span>
                        <span><span className="font-semibold">{tt('EV:')}</span> BSD {n.expectedValue}</span>
                        <span><span className="font-semibold">{tt('Confidence:')}</span> {(n.confidence * 100).toFixed(0)}%</span>
                        <span><span className="font-semibold">{tt('Uplift:')}</span> <span className="text-emerald-600 font-bold">{n.uplift}</span></span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => fireAction(`Action "${tt(n.title)}" applied · approval requested`)} disabled={n.eligibility !== 'Eligible'} className="text-xs font-semibold px-3 py-1.5 bg-vfes-red text-vfes-dark rounded disabled:opacity-50 hover:bg-vfes-red-dark">{tt('Apply now')}</button>
                        <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('Suppress')}</button>
                        <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-black/10 rounded hover:bg-black/5">{tt('View model')}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-3">{tt('Source: CBL_ANALYTICS.ML_OUTPUTS.NEXT_BEST_ACTION · model registry: nba_v4.2 · last refresh today 03:14')}</div>
              </Panel>

              <div className="grid md:grid-cols-2 gap-6">
                <Panel title={tt('Loyalty milestones')} action={<Award className="w-4 h-4 text-vfes-dark/40" />}>
                  {e.milestones.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No milestones.')}</div> : (
                    <div className="space-y-2">
                      {e.milestones.map((m, i) => (
                        <div key={i} className="p-3 rounded bg-amber-50 border border-amber-200">
                          <div className="font-semibold text-sm">{tt(m.name)}</div>
                          <div className="text-xs text-vfes-dark/55">{m.date} · Eligible for: {m.eligibleFor}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
                <Panel title={tt('Referrals & moves')}>
                  <div className="text-xs text-vfes-dark/55 mb-2 font-semibold uppercase tracking-widest">{tt('Referrals')}</div>
                  {e.referrals.length === 0 ? <div className="text-sm text-vfes-dark/55 mb-3">{tt('None yet.')}</div> : (
                    <div className="space-y-1 mb-3">
                      {e.referrals.map((r, i) => (
                        <div key={i} className="text-sm flex justify-between">
                          <span>{r.referredTo} · {r.date}</span>
                          <span className="font-bold text-emerald-600">BSD {r.reward} · {tt(r.status)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-vfes-dark/55 mb-2 font-semibold uppercase tracking-widest">{tt('Move history')}</div>
                  {e.moveHistory.length === 0 ? <div className="text-sm text-vfes-dark/55">{tt('No moves.')}</div> : (
                    e.moveHistory.map((m, i) => (
                      <div key={i} className="text-sm">{m.date}: {m.type} (kept service)</div>
                    ))
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* === AUDIT === */}
          {innerTab === 'Audit' && (
            <div className="space-y-6">
              <Panel title={tt('PII access log (last 30 days)')} action={<Eye className="w-4 h-4 text-vfes-dark/40" />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                      <tr><th className="py-2">{tt('Date')}</th><th>{tt('User')}</th><th>{tt('Role')}</th><th>{tt('Reason')}</th></tr>
                    </thead>
                    <tbody>
                      {e.piiAccess.map((p, i) => (
                        <tr key={i} className="border-t border-black/5">
                          <td className="py-2.5 font-mono text-xs">{p.date}</td>
                          <td>{p.user}</td>
                          <td className="text-vfes-dark/65">{tt(p.role)}</td>
                          <td className="text-vfes-dark/65">{p.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-2">{tt('Source: SNOWFLAKE.HORIZON.ACCESS_HISTORY · row-level audit on customer PII columns')}</div>
              </Panel>

              <Panel title={tt('Compliance flags')} action={<FileWarning className="w-4 h-4 text-vfes-dark/40" />}>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between"><dt>{tt('URCA complaint flag')}</dt><dd>{e.comregFlag ? <Pill color="bg-red-50 text-red-700">{tt('YES — escalate')}</Pill> : <Pill color="bg-emerald-50 text-emerald-700">{tt('No')}</Pill>}</dd></div>
                  <div className="flex justify-between"><dt>{tt('Bad debt write-off')}</dt><dd>{e.badDebt.status}</dd></div>
                  <div className="flex justify-between"><dt>{tt('Vulnerable customer')}</dt><dd>{e.vulnerable.flag ? <Pill color="bg-purple-50 text-purple-700">{e.vulnerable.reason}</Pill> : <span className="text-vfes-dark/55">{tt('No')}</span>}</dd></div>
                  <div className="flex justify-between"><dt>{tt('Right-to-be-forgotten')}</dt><dd className="text-vfes-dark/55">{tt('No request on file')}</dd></div>
                </dl>
              </Panel>
            </div>
          )}
        </div>

        {/* === RIGHT RAIL — sticky action panel === */}
        <div className="space-y-4 lg:sticky lg:top-4 h-fit">
          {/* Contract countdown */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-1">{tt('Contract countdown')}</div>
            <div className={`text-2xl font-extrabold ${e.contract.daysRemaining < 60 ? 'text-red-600' : e.contract.daysRemaining < 180 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {e.contract.daysRemaining}d
            </div>
            <div className="text-xs text-vfes-dark/55">{tt('until')} {e.contract.endDate}</div>
            <div className="mt-2 h-1.5 bg-black/5 rounded">
              <div className={`h-1.5 rounded ${e.contract.daysRemaining < 60 ? 'bg-red-500' : 'bg-vfes-red'}`} style={{ width: `${Math.max(5, 100 - (e.contract.daysRemaining / 730) * 100)}%` }} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl bg-white border border-black/5 shadow-sm p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-vfes-dark/55 mb-2">{tt('Quick actions')}</div>
            <div className="space-y-1.5">
              <button onClick={() => fireAction('Retention offer applied · BSD 15/mo for 6 months')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-vfes-red/5 hover:bg-vfes-red/10 text-vfes-dark flex items-center justify-between">
                {tt('Apply retention offer')} <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('Callback scheduled for tomorrow 10:00')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><PhoneIcon className="w-3 h-3" />{tt('Schedule callback')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('SMS sent · "We\'re sorry, here\'s BSD 10 credit"')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Send className="w-3 h-3" />{tt('Send SMS apology')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('Case CS-' + Math.floor(scenarioRandom() * 99999) + ' opened')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-3 h-3" />{tt('Open case')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('Truck roll requested · approval pending')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Zap className="w-3 h-3" />{tt('Dispatch engineer')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('Credit raised — BSD 30 (manager approval required)')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Wallet className="w-3 h-3" />{tt('Raise credit')}</span> <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => fireAction('Tier change requested')} className="w-full text-left text-xs font-semibold px-3 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center justify-between">
                <span className="flex items-center gap-2"><Settings className="w-3 h-3" />{tt('Change tier')}</span> <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[10px] text-vfes-dark/55 mt-3 flex items-center gap-1"><Lock className="w-3 h-3" />{tt('All actions audited · approvals via PEGA')}</div>
          </div>
        </div>
      </div>
      )} {/* end tab === 'profile360' */}

      {/* ── Tab: segments ─────────────────────────────────────────────────────── */}
      {tab === 'segments' && (
        <>
          <MlInsightSection
            heading="Customer segmentation"
            models={[
              { name: 'Segment classifier v3.1', metric: 'F1 0.84',    sub: 'XGBoost · 8 segments' },
              { name: 'Upsell propensity',       metric: 'AUC 0.81',   sub: 'Logistic · convergent attach' },
              { name: 'Segment CLV model',       metric: 'MAPE 5.1%',  sub: 'GBR · 36-month NPV' },
            ]}
            agentLabel="Run Segmentation Agent"
            agentRunningLabel="Classifying base…"
            agentSteps={[
              'Classified 1.15M customers into value segments',
              'Computed CLV gap by segment vs Convergent',
              'Identified 184K Mobile-only for convergent pitch',
              'Ranked high-ARPU segments for proactive NBO',
            ]}
            agentBlurb="Classifies the base into strategic segments and ranks them by CLV gap opportunity."
            decision={{
              title: 'Convergent upsell is the primary value-creation lever',
              detail: '184K Mobile-only customers have 2.4\u00d7 CLV headroom if converted to convergent \u2014 top priority for marketing.',
              impact: '+\u20ac368M portfolio CLV if 10% converted',
              risk: 'Over-targeting causes saturation \u2014 cap frequency per segment',
              linkTo: '#/portal/bundle-propensity',
              linkLabel: 'Open Bundle Propensity',
            }}
            chart={{
              kind: 'bar',
              title: 'Segment CLV vs churn rate',
              data: PORTFOLIO_SEGMENTS.map(s => ({ seg: s.seg.split(' ')[0], clv: s.clv, churn: s.churn })),
              xKey: 'seg',
              series: [{ key: 'clv', name: 'Avg CLV \u20ac', color: '#FF4438' }],
              note: 'Convergent Premium delivers 3.3\u00d7 CLV vs Mobile-only \u2014 convergent mix is the key lever.',
            }}
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Total customers')}         value={`${(totalPortfolioCustomers / 1_000_000).toFixed(2)}M`} delta={tt('+2.4K MoM')}           trend="up"   icon={Users}       accent />
            <KpiCard label={tt('Portfolio avg ARPU')}      value={`\u20ac${avgPortfolioARPU}`}                              delta={tt('+\u20ac1.2 MoM')}          trend="up"   icon={TrendingUp}  />
            <KpiCard label={tt('Convergent penetration')}  value="18.9%"                                                   delta={tt('+1.2 pp YoY')}         trend="up"   icon={Activity}    />
            <KpiCard label={tt('Mobile-only upsell pool')} value="184K"                                                    delta={tt('CLV headroom 2.4\u00d7')} trend="up"   icon={Smartphone}  />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Segment distribution \u2014 customers')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${(v/1000).toFixed(0)}K`, tt('Customers')]} />
                    <Bar dataKey="customers" radius={[6,6,0,0]} name={tt('Customers')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('Segment ARPU vs churn heatmap')}>
              <div className="space-y-2 mt-2">
                {PORTFOLIO_SEGMENTS.map(s => (
                  <div key={s.seg} className="flex items-center gap-3 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-xs font-semibold w-40 truncate">{tt(s.seg)}</span>
                    <div className="flex-1 text-xs flex items-center gap-2">
                      <span className="font-mono font-bold">\u20ac{s.arpu}</span>
                      <div className="h-2 flex-1 bg-black/5 rounded">
                        <div className="h-2 rounded" style={{ width: `${(s.arpu / 184) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.churn > 2 ? 'bg-red-50 text-red-600' : s.churn > 1 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{s.churn}% {tt('churn')}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/base-management"   className="text-vfes-dark hover:underline">{tt('Base Management \u2192')}</Link>
            <Link to="/portal/bundle-propensity" className="text-vfes-dark hover:underline">{tt('Bundle Propensity \u2192')}</Link>
            <Link to="/portal/clv"               className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: churn-risk ─────────────────────────────────────────────────────── */}
      {tab === 'churn-risk' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Blended churn')}   value="1.52%"     delta={tt('-0.18 pp YoY')}   trend="up"   icon={TrendingDown}  accent />
            <KpiCard label={tt('High-risk book')}  value="38.4K"     delta={tt('lines flagged')}  trend="down" icon={AlertTriangle} />
            <KpiCard label={tt('ARPU at risk/mo')} value="\u20ac2.14M" delta={tt('if unaddressed')} trend="down" icon={TrendingDown}  />
            <KpiCard label={tt('Save rate')}        value="51%"       delta={tt('+4 pp vs target')} trend="up"   icon={ShieldCheck}  />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Churn risk by segment')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="churn" radius={[6,6,0,0]} name={tt('Churn %')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.churn > 2 ? '#EF4444' : s.churn > 1 ? '#F59E0B' : '#10B981'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('Portfolio CLV trend')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={PORTFOLIO_CLV_TREND}>
                    <defs>
                      <linearGradient id="clvFill2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#FF4438" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF4438" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="clv" stroke="#222128" strokeWidth={2} fill="url(#clvFill2)" name={tt('Avg CLV \u20ac')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/churn-retention" className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
            <Link to="/portal/mnp"             className="text-vfes-dark hover:underline">{tt('MNP Save Desk \u2192')}</Link>
            <Link to="/portal/contact-center"  className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: clv ──────────────────────────────────────────────────────────────── */}
      {tab === 'clv' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Portfolio CLV (36m)')} value="\u20ac1.91B"  delta={tt('+4.8% MoM')}     trend="up" icon={TrendingUp} accent />
            <KpiCard label={tt('Avg CLV / customer')}  value="\u20ac1,840" delta={tt('+\u20ac42 MoM')}     trend="up" icon={Sparkles} />
            <KpiCard label={tt('CLV : CAC ratio')}     value="6.7\u00d7"   delta={tt('best-in-class')} trend="up" icon={Target}   />
            <KpiCard label={tt('CAC payback')}          value="9.4 mo"   delta={tt('\u22121.2 mo YoY')} trend="up" icon={Clock}    />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('CLV by segment')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={PORTFOLIO_SEGMENTS}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="seg" stroke="#999" fontSize={9} tickFormatter={v => tt(v).split(' ')[0]} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="clv" radius={[6,6,0,0]} name={tt('Avg CLV \u20ac')}>
                      {PORTFOLIO_SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('CLV trend \u2014 12 months')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={PORTFOLIO_CLV_TREND}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} domain={[1750, 1900]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="clv" stroke="#222128" strokeWidth={2.5} name={tt('Avg CLV \u20ac')} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/clv"               className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
            <Link to="/portal/ai-insights"       className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
            <Link to="/portal/pricing-simulator" className="text-vfes-dark hover:underline">{tt('Pricing Simulator \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: usage ───────────────────────────────────────────────────────────── */}
      {tab === 'usage' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Avg data/month')}  value="49.2 GB" delta={tt('+12% YoY')}     trend="up"   icon={Activity}     accent />
            <KpiCard label={tt('Streaming share')} value="62%"     delta={tt('of data usage')} trend="up"   icon={TrendingUp}   />
            <KpiCard label={tt('5G adoption')}     value="38.4%"   delta={tt('+8 pp YoY')}    trend="up"   icon={Zap}          />
            <KpiCard label={tt('Peak congestion')} value="12\u201314h" delta={tt('daily window')} trend="flat" icon={AlertTriangle} />
          </div>
          <Panel title={tt('Data + streaming usage \u2014 12 months')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={USAGE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} unit=" GB" />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit=" hr" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="dataGB"       fill="#FF4438" radius={[3,3,0,0]} name={tt('Data GB/mo')} />
                  <Line yAxisId="r" type="monotone" dataKey="streamingHrs" stroke="#10B981" strokeWidth={2} name={tt('Streaming hrs/mo')} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/experience"  className="text-vfes-dark hover:underline">{tt('Experience \u2192')}</Link>
            <Link to="/portal/network"     className="text-vfes-dark hover:underline">{tt('Network \u2192')}</Link>
            <Link to="/portal/digital-app" className="text-vfes-dark hover:underline">{tt('Digital App \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: care-analytics ──────────────────────────────────────────────────── */}
      {tab === 'care-analytics' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Calls / 100 customers')} value="3.6"   delta={tt('-0.4 MoM')}   trend="up"  icon={Headphones}   accent />
            <KpiCard label={tt('First-call resolution')} value="71%"   delta={tt('+2 pp QoQ')}  trend="up"  icon={CheckCircle2} />
            <KpiCard label={tt('CSAT score')}             value="4.2/5" delta={tt('+0.1 MoM')}  trend="up"  icon={Star}         />
            <KpiCard label={tt('Digital deflection')}    value="42%"   delta={tt('+6 pp YoY')}  trend="up"  icon={Activity}     />
          </div>
          <Panel title={tt('Care volume \u2014 calls & chats (12 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={CARE_VOLUME}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#999" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#999" fontSize={11} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="calls" fill="#11567F" radius={[3,3,0,0]} name={tt('Calls')} />
                  <Bar  yAxisId="l" dataKey="chats" fill="#FF4438" radius={[3,3,0,0]} name={tt('Chats')} />
                  <Line yAxisId="r" type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} name={tt('FCR %')} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/contact-center" className="text-vfes-dark hover:underline">{tt('Contact Center \u2192')}</Link>
            <Link to="/portal/voc"            className="text-vfes-dark hover:underline">{tt('Voice of Customer \u2192')}</Link>
            <Link to="/portal/experience"     className="text-vfes-dark hover:underline">{tt('Experience \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: campaigns ───────────────────────────────────────────────────────── */}
      {tab === 'campaigns' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Active campaigns')}     value="12"       delta={tt('across 5 segments')}  trend="flat" icon={Send}       accent />
            <KpiCard label={tt('Conversions MTD')}      value="38.9K"    delta={tt('+14% vs target')}     trend="up"   icon={TrendingUp} />
            <KpiCard label={tt('Avg conversion rate')}  value="11.2%"    delta={tt('+1.8 pp MoM')}        trend="up"   icon={Target}     />
            <KpiCard label={tt('Campaign ARPU uplift')} value="\u20ac14.4" delta={tt('avg per convert')} trend="up"   icon={Award}      />
          </div>
          <Panel title={tt('Campaign performance \u2014 YTD')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2 px-3">{tt('Campaign')}</th>
                    <th className="py-2 px-3 text-right">{tt('Sent')}</th>
                    <th className="py-2 px-3 text-right">{tt('Converted')}</th>
                    <th className="py-2 px-3 text-right">{tt('Conv. %')}</th>
                    <th className="py-2 px-3 text-right">{tt('ARPU \u0394')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGN_PERF.map(c => (
                    <tr key={c.campaign} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 px-3 font-semibold">{tt(c.campaign)}</td>
                      <td className="py-2 px-3 text-right font-mono">{(c.sent/1000).toFixed(0)}K</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">{(c.converted/1000).toFixed(1)}K</td>
                      <td className="py-2 px-3 text-right font-bold">{c.convPct}%</td>
                      <td className={`py-2 px-3 text-right font-bold ${c.arpuDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{c.arpuDelta > 0 ? '+' : ''}\u20ac{c.arpuDelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="mt-4 flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/marketing"       className="text-vfes-dark hover:underline">{tt('Marketing \u2192')}</Link>
            <Link to="/portal/loyalty-consent" className="text-vfes-dark hover:underline">{tt('Loyalty & Consent \u2192')}</Link>
            <Link to="/portal/digital-app"     className="text-vfes-dark hover:underline">{tt('Digital App \u2192')}</Link>
          </div>
        </>
      )}

      {/* ── Tab: cohorts ─────────────────────────────────────────────────────────── */}
      {tab === 'cohorts' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Cohorts tracked')}    value="24"          delta={tt('quarterly cohorts')}    trend="flat" icon={BarChart3}   accent />
            <KpiCard label={tt('Avg retention 12m')}  value="82%"         delta={tt('+4 pp vs 2022')}        trend="up"   icon={ShieldCheck} />
            <KpiCard label={tt('Best cohort CLV')}    value="\u20ac2,840" delta={tt('2022 Q1 cohort')}       trend="up"   icon={Award}       />
            <KpiCard label={tt('CLV growth YoY')}     value="+8.2%"       delta={tt('vs industry +4.8%')}   trend="up"   icon={TrendingUp}  />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Acquisition cohort retention')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={COHORT_PERF}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="retentionPct" radius={[6,6,0,0]} name={tt('Retention %')}>
                      {COHORT_PERF.map((c, i) => <Cell key={i} fill={c.retentionPct >= 85 ? '#10B981' : c.retentionPct >= 78 ? '#FF4438' : '#F59E0B'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title={tt('Cohort CLV trajectory')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={COHORT_PERF}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={11} tickFormatter={v => `\u20ac${v}`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="clvNow" stroke="#222128" strokeWidth={2.5} name={tt('CLV now \u20ac')} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="flex gap-3 flex-wrap text-xs font-semibold">
            <Link to="/portal/clv"             className="text-vfes-dark hover:underline">{tt('CLV Explorer \u2192')}</Link>
            <Link to="/portal/churn-retention" className="text-vfes-dark hover:underline">{tt('Churn & Retention \u2192')}</Link>
            <Link to="/portal/ai-insights"     className="text-vfes-dark hover:underline">{tt('AI Insights \u2192')}</Link>
          </div>
        </>
      )}
    </div>
  )
}
