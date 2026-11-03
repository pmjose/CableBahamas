import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Scale, ShieldCheck, Phone, FileText, Brain, ChevronRight,
  Activity, BarChart2, List, Globe, AlertTriangle, Zap, Lock,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  Area, AreaChart, Legend, Line, LineChart,
} from 'recharts'

const BLUE   = '#FF4438'
const GREEN  = '#10B981'
const AMBER  = '#F59E0B'
const RED    = '#EF4444'
const NAVY   = '#11567F'
const PURPLE = '#7C3AED'

const OBLIGATIONS = [
  { obligation: '5G coverage — populated areas',  target: 95,  actual: 96.4, status: 'met'  },
  { obligation: '700 MHz rural coverage',          target: 90,  actual: 91.2, status: 'met'  },
  { obligation: 'FTTH new-build areas',            target: 85,  actual: 82.0, status: 'risk' },
  { obligation: 'Roads & rail corridors 4G',       target: 98,  actual: 98.6, status: 'met'  },
  { obligation: 'Public-sector sites',             target: 100, actual: 99.1, status: 'risk' },
  { obligation: 'Emergency services coverage',     target: 100, actual: 100,  status: 'met'  },
  { obligation: 'Rural Out Islands 4G/5G',        target: 80,  actual: 78.4, status: 'risk' },
]

const COVERAGE_TREND = [
  { m: 'Jun', pop5g: 87.2, pop4g: 98.8, rural700: 89.4 },
  { m: 'Jul', pop5g: 87.8, pop4g: 98.9, rural700: 90.1 },
  { m: 'Aug', pop5g: 88.4, pop4g: 99.0, rural700: 90.6 },
  { m: 'Sep', pop5g: 89.1, pop4g: 99.1, rural700: 90.8 },
  { m: 'Oct', pop5g: 89.8, pop4g: 99.2, rural700: 91.0 },
  { m: 'Nov', pop5g: 90.6, pop4g: 99.2, rural700: 91.2 },
]

const QOS = [
  { kpi: 'Call setup success', val: 99.6, sla: 99.0, unit: '%' },
  { kpi: 'Drop-call rate',      val: 0.42, sla: 1.00, unit: '%' },
  { kpi: 'Data throughput',     val: 96.0, sla: 90.0, unit: '%' },
  { kpi: '112 emergency',       val: 100,  sla: 100,  unit: '%' },
  { kpi: 'SMS delivery',        val: 99.8, sla: 99.0, unit: '%' },
  { kpi: 'MNP completion',      val: 99.2, sla: 98.0, unit: '%' },
]

const QOS_TREND = [
  { m: 'Jun', setupSuccess: 99.3, dropRate: 0.58, emergency: 100 },
  { m: 'Jul', setupSuccess: 99.4, dropRate: 0.54, emergency: 100 },
  { m: 'Aug', setupSuccess: 99.4, dropRate: 0.50, emergency: 100 },
  { m: 'Sep', setupSuccess: 99.5, dropRate: 0.48, emergency: 100 },
  { m: 'Oct', setupSuccess: 99.6, dropRate: 0.44, emergency: 100 },
  { m: 'Nov', setupSuccess: 99.6, dropRate: 0.42, emergency: 100 },
]

const DSAR = [
  { type: 'Access (DPA s.8)',  open: 142, slaDays: 30, breached: 2, avgDays: 14.2 },
  { type: 'Erasure (Art.17)',       open: 88,  slaDays: 30, breached: 0, avgDays: 8.4  },
  { type: 'Portability (Art.20)',   open: 41,  slaDays: 30, breached: 1, avgDays: 12.8 },
  { type: 'Retention metadata',     open: 24,  slaDays: 30, breached: 0, avgDays: 6.2  },
]

const DSAR_TREND = [
  { m: 'Jun', received: 248, resolved: 232, breached: 6 },
  { m: 'Jul', received: 271, resolved: 258, breached: 4 },
  { m: 'Aug', received: 294, resolved: 284, breached: 4 },
  { m: 'Sep', received: 312, resolved: 302, breached: 3 },
  { m: 'Oct', received: 288, resolved: 281, breached: 3 },
  { m: 'Nov', received: 295, resolved: 292, breached: 3 },
]

const MARKET_REVIEWS = [
  { id: 'M1', name: 'Fixed access networks',           status: 'Completed', obligation: 'SMP designation', compliant: true,  deadline: '2024-11' },
  { id: 'M2', 'name': 'Origination on PSTN',            status: 'Active',    obligation: 'Cost-based pricing', compliant: true, deadline: '2026-05' },
  { id: 'M3', name: 'Broadband wholesale (WBA)',        status: 'Active',    obligation: 'Bitstream access', compliant: true,  deadline: '2026-11' },
  { id: 'M4', name: 'Mobile termination rates',        status: 'Active',    obligation: 'Glide-path MTR',   compliant: true,  deadline: '2027-02' },
]

const MARKET_SHARE = [
  { m: 'Jun', fixed: 38.2, mobile: 24.8, broadband: 35.4 },
  { m: 'Jul', fixed: 38.3, mobile: 24.9, broadband: 35.6 },
  { m: 'Aug', fixed: 38.4, mobile: 25.0, broadband: 35.8 },
  { m: 'Sep', fixed: 38.5, mobile: 25.1, broadband: 36.0 },
  { m: 'Oct', fixed: 38.6, mobile: 25.2, broadband: 36.2 },
  { m: 'Nov', fixed: 38.7, mobile: 25.3, broadband: 36.4 },
]

const WHOLESALE_OBS = [
  { obligation: 'Bitstream access (ADSL)',    smp: true,  price: 'BSD 5.42/mo',  compliant: true,  review: '2026-11' },
  { obligation: 'Bitstream access (VDSL)',    smp: true,  price: 'BSD 8.14/mo',  compliant: true,  review: '2026-11' },
  { obligation: 'Physical unbundling (LLU)',  smp: true,  price: 'BSD 9.82/mo',  compliant: true,  review: '2026-11' },
  { obligation: 'Fibre wholesale (WBA)',       smp: true,  price: 'BSD 14.20/mo', compliant: true,  review: '2026-11' },
  { obligation: 'Mobile wholesale (MVNO)',     smp: false, price: 'Negotiated', compliant: true, review: '2027-02' },
  { obligation: 'SMS A2P termination',         smp: false, price: 'BSD 0.024',    compliant: true,  review: '2027-05' },
  { obligation: 'International roaming IOT',  smp: false, price: 'BSD 0.003/MB',  compliant: true, review: '2027-06' },
  { obligation: 'Dark fibre leasing',          smp: true,  price: 'Cost+12%',  compliant: false, review: '2026-08' },
]

const PORTABILITY = [
  { m: 'Jun', portIn: 4820, portOut: 3840, netGain: 980,  successRate: 99.2 },
  { m: 'Jul', portIn: 5240, portOut: 4120, netGain: 1120, successRate: 99.3 },
  { m: 'Aug', portIn: 5680, portOut: 4480, netGain: 1200, successRate: 99.3 },
  { m: 'Sep', portIn: 5120, portOut: 4280, netGain: 840,  successRate: 99.4 },
  { m: 'Oct', portIn: 5480, portOut: 4560, netGain: 920,  successRate: 99.4 },
  { m: 'Nov', portIn: 5840, portOut: 4880, netGain: 960,  successRate: 99.5 },
]

const COMPLIANCE_DEADLINES = [
  { deadline: '2026-12-31', obligation: 'Q2 coverage attestation',    risk: 'Low',  daysLeft: 32, owner: 'Network' },
  { deadline: '2027-01-15', obligation: 'DSAR quarterly report',       risk: 'Low',  daysLeft: 47, owner: 'Privacy' },
  { deadline: '2027-02-28', obligation: 'M4 MTR glide-path reporting', risk: 'Med',  daysLeft: 93, owner: 'Wholesale' },
  { deadline: '2027-03-01', obligation: 'FTTH obligation catch-up',    risk: 'High', daysLeft: 94, owner: 'Network' },
  { deadline: '2027-03-31', obligation: 'Annual QoS report',           risk: 'Low',  daysLeft: 124,owner: 'Operations' },
  { deadline: '2027-05-31', obligation: 'URCA annual filing (EOY)',    risk: 'High', daysLeft: 185,owner: 'Regulatory' },
  { deadline: '2027-06-30', obligation: 'Dark fibre price review',     risk: 'High', daysLeft: 216,owner: 'Wholesale' },
  { deadline: '2027-08-31', obligation: 'WBA market review renewal',   risk: 'Med',  daysLeft: 275,owner: 'Regulatory' },
]

const COMPLIANCE_SCORE_TREND = [
  { q: 'Q3-24', score: 88 }, { q: 'Q4-24', score: 90 },
  { q: 'Q3-25', score: 91 }, { q: 'Q4-25', score: 92 },
  { q: 'Q1-26', score: 93 }, { q: 'Q2-26', score: 94 },
  { q: 'Q3-26', score: 94 }, { q: 'Q4-26', score: 95 },
]

const WHOLESALE_COMPLIANCE_TREND = [
  { m: 'Jun', compliant: 7, nonCompliant: 1 }, { m: 'Jul', compliant: 7, nonCompliant: 1 },
  { m: 'Aug', compliant: 7, nonCompliant: 1 }, { m: 'Sep', compliant: 7, nonCompliant: 1 },
  { m: 'Oct', compliant: 7, nonCompliant: 1 }, { m: 'Nov', compliant: 7, nonCompliant: 1 },
]

const PORT_NET_TREND = [
  { m: 'Jun', netGain: 980 }, { m: 'Jul', netGain: 1120 }, { m: 'Aug', netGain: 1200 },
  { m: 'Sep', netGain: 840 }, { m: 'Oct', netGain: 920  }, { m: 'Nov', netGain: 960  },
]

const FILING_HISTORY = [
  { filing: 'Q4 2025 coverage',   submitted: '2025-12-28', status: 'Accepted', findings: 0 },
  { filing: 'Q1 2026 coverage',   submitted: '2026-03-29', status: 'Accepted', findings: 0 },
  { filing: 'Q2 2026 annual',     submitted: '2026-06-30', status: 'Accepted', findings: 2 },
  { filing: 'Q3 2026 coverage',   submitted: '2026-09-28', status: 'Accepted', findings: 1 },
  { filing: 'Q4 2026 coverage',   submitted: 'Pending',    status: 'Pending',  findings: 0 },
]

type TabId = 'overview' | 'market' | 'coverage' | 'wholesale' | 'qos' | 'portability' | 'compliance' | 'dsar'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',    label: 'Overview',     icon: Activity    },
  { id: 'market',      label: 'Market Reviews',icon: BarChart2  },
  { id: 'coverage',    label: 'Coverage',     icon: Globe       },
  { id: 'wholesale',   label: 'Wholesale',    icon: Scale       },
  { id: 'qos',         label: 'QoS',          icon: ShieldCheck },
  { id: 'portability', label: 'Portability',  icon: Phone       },
  { id: 'compliance',  label: 'Compliance',   icon: List        },
  { id: 'dsar',        label: 'DSAR & Privacy',icon: FileText   },
]

export default function UrcaPackPage() {
  const { i18n } = useTranslation()
  const [tab, setTab]                   = useState<TabId>('overview')
  const [deadlineSort, setDeadlineSort] = useState<'date' | 'risk'>('date')
  const [qosView, setQosView]           = useState<'chart' | 'table'>('chart')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [portYear, setPortYear]         = useState<string>('2026')
  const [wholesaleFilter, setWholesaleFilter] = useState<'all' | 'smp' | 'non-smp'>('all')
  const [filingCountdown, setFilingCountdown] = useState(32)

  useEffect(() => {
    const target = new Date('2027-01-31')
    const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000)
    setFilingCountdown(Math.max(0, diff))
  }, [])

  const sortedDeadlines = useMemo(
    () => [...COMPLIANCE_DEADLINES].sort((a, b) =>
      deadlineSort === 'date' ? a.daysLeft - b.daysLeft : (a.risk === 'High' ? -1 : a.risk === 'Med' ? 0 : 1) - (b.risk === 'High' ? -1 : b.risk === 'Med' ? 0 : 1)
    ),
    [deadlineSort],
  )
  const filteredWholesale = useMemo(
    () => wholesaleFilter === 'all' ? WHOLESALE_OBS
      : wholesaleFilter === 'smp' ? WHOLESALE_OBS.filter(w => w.smp)
      : WHOLESALE_OBS.filter(w => !w.smp),
    [wholesaleFilter],
  )
  const filteredPortability = useMemo(
    () => portYear === '2026' ? PORTABILITY : PORTABILITY,
    [portYear],
  )

  const statusColor = (s: string) =>
    s === 'met' ? 'bg-emerald-50 text-emerald-700' : s === 'risk' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  const riskColor = (r: string) =>
    r === 'High' ? 'bg-red-50 text-red-700' : r === 'Med' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('URCA / Regulator Pack')}
        subtitle={tt('Coverage obligations · QoS attestation · 911/919 routing · DSAR SLA · market reviews · wholesale')}
        actions={
          <div className="flex items-center gap-2">
            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold text-xs">
              {filingCountdown}{tt('d to Q2 filing')}
            </span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">{tt('Q4 2026 filing')}</span>
          </div>
        }
      />

      {/* ── ML Intelligence ────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Compliance intelligence"
        models={[
          { name: 'Coverage Gap Detector',   metric: 'MAPE 3.2%',     sub: 'municipality-level obligation forecast' },
          { name: 'QoS Anomaly Model',        metric: 'precision 0.93', sub: 'degradation before SLA breach'          },
          { name: 'DSAR SLA Predictor',       metric: 'recall 0.94',    sub: 'at-risk request early-warning'          },
        ]}
        agentLabel={tt('Run Compliance Pack')}
        agentRunningLabel={tt('Assembling…')}
        agentSteps={[
          'Gathered coverage-obligation evidence by municipality',
          'Validated QoS attestation against measured KPIs',
          'Checked 112 emergency routing & DSAR SLA adherence',
          'Assembled the URCA filing with a full audit trail',
        ]}
        agentBlurb={tt('The filing is generated from governed Snowflake data with lineage — not hand-built in spreadsheets the night before the deadline.')}
        decision={{
          title: tt('Close the coverage-obligation gap before the filing deadline'),
          detail: tt('A small number of rural municipalities and rural areas sit below licensed obligations. Prioritise civil works now — build lead-times mean these sites must start immediately.'),
          impact: tt('avoids regulatory finding · protects spectrum licence'),
          risk:   tt('build lead-times — start at-risk sites first'),
          linkTo: '/portal/regulatory',
          linkLabel: tt('Open Regulatory & ESG'),
        }}
        chart={{
          kind: 'line',
          title: tt('5G population coverage trajectory — % (monthly)'),
          xKey: 'm',
          unit: '%',
          data: COVERAGE_TREND,
          series: [
            { key: 'pop5g',   name: tt('5G pop coverage'), color: BLUE  },
            { key: 'rural700',name: tt('700 MHz rural'),   color: GREEN },
          ],
          note: tt('On the curve to Q4 target — FTTH and rural sites are the swing factors.'),
        }}
        registryNote={tt('Models trained on NRA measurement data in Snowflake. Evidence lineage available for regulator inspection.')}
      />

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">{tt('FTTH new-build 3 pp below target · Rural Out Islands 4G at 78.4% (target 80%) · Dark fibre price review overdue')}</div>
              <div className="text-xs text-amber-800 mt-1">{tt('Pending civil works and price-fixing action must be completed before the Q3 attestation window.')}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/network" className="text-xs font-bold text-amber-900 hover:underline">{tt('Network →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Obligations met')}   value="4 / 7"  delta={tt('3 at risk')}            trend="flat" icon={Scale}       accent />
        <KpiCard label={tt('5G pop coverage')}   value="90.6%"  delta={tt('target 95% Q4')}         trend="up"   icon={ShieldCheck} />
        <KpiCard label={tt('911/919 routing')}        value="100%"   delta={tt('compliant')}             trend="up"   icon={Phone}       />
        <KpiCard label={tt('DSAR SLA breaches')} value="3"      delta={tt('of 295 requests')}       trend="flat" icon={FileText}    />
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${active ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
              <Icon className="w-3.5 h-3.5" />{tt(t.label)}
            </button>
          )
        })}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Coverage obligations — target vs actual (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={OBLIGATIONS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} domain={[70, 105]} />
                  <YAxis type="category" dataKey="obligation" stroke="#999" fontSize={9} width={160} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}% (target ${p.payload.target}%)`, tt('Actual')]} />
                  <Bar dataKey="actual" radius={[0, 4, 4, 0]}>
                    {OBLIGATIONS.map((o, i) => <Cell key={i} fill={o.actual >= o.target ? GREEN : o.actual >= o.target - 3 ? AMBER : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('3 obligations short — FTTH civil works and rural coverage are critical path items.')}
            </div>
          </Panel>

          <Panel title={tt('Compliance score trend — quarterly (100 = fully compliant)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={COMPLIANCE_SCORE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} domain={[80, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name={tt('Compliance score')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Consistent improvement — dark fibre and rural coverage are the remaining gap items.')}</div>
          </Panel>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Market reviews active')} value="3"     delta={tt('M2 · M3 · M4')}           trend="flat" icon={BarChart2} />
          <KpiCard label={tt('Wholesale obligations')} value="8"     delta={tt('1 non-compliant')}         trend="flat" icon={Scale}    />
          <KpiCard label={tt('Portability net gain')}  value="+960"  delta={tt('Nov 2026')}                trend="up"   icon={Phone}   />
          <KpiCard label={tt('Compliance score')}      value="95/100" delta={tt('+1 pt QoQ')}              trend="up"   icon={Activity}/>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Regulatory links')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Regulatory data flows directly from governed Snowflake tables — full evidence lineage for auditor review.')}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/regulatory"  className="text-xs font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-vfes-red-dark">{tt('Regulatory')}</Link>
            <Link to="/portal/risk"        className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5">{tt('Risk Centre')}</Link>
            <Link to="/portal/trust-center" className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5">{tt('Trust Centre')}</Link>
          </div>
        </div>
        <div className="mt-4">
          <Panel title={tt('URCA filing history — recent submissions & findings')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Filing')}</th>
                    <th className="px-3 py-2">{tt('Submitted')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                    <th className="px-3 py-2 text-right">{tt('Findings')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FILING_HISTORY.map(f => (
                    <tr key={f.filing} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(f.filing)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{f.submitted}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(f.status)}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${f.findings > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{f.findings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('Q2 2026 annual had 2 findings — FTTH gap and 112 delay event — both remediated in Q3 2026.')}</span>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/risk"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('Risk Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('FTTH civil works')}       value="14"     delta={tt('sites started')}       trend="up"   icon={Zap}         />
          <KpiCard label={tt('Next filing deadline')}   value={`${filingCountdown}d`} delta={tt('Q4 2026 URCA')} trend="flat" icon={AlertTriangle}/>
          <KpiCard label={tt('Open findings')}          value="3"      delta={tt('from Q2 2026')}        trend="flat" icon={Lock}         />
          <KpiCard label={tt('Last audit result')}      value="Pass"   delta={tt('1 minor finding')}     trend="up"   icon={ShieldCheck}  />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/risk"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('Risk Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
        </div>
      </>)}

      {tab === 'market' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active market reviews')} value="3"      delta={tt('M2 · M3 · M4')}      trend="flat" icon={BarChart2}  accent />
          <KpiCard label={tt('SMP obligations')}        value="5"      delta={tt('all compliant')}     trend="up"   icon={Scale}     />
          <KpiCard label={tt('Fixed market share')}     value="38.7%"  delta={tt('+0.5 pp YoY')}      trend="flat" icon={Globe}     />
          <KpiCard label={tt('Mobile market share')}    value="25.3%"  delta={tt('+0.5 pp YoY')}      trend="up"   icon={Phone}     />
        </div>

        <Panel title={tt('Market reviews — status & obligations')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Review')}</th>
                  <th className="px-3 py-2">{tt('Market')}</th>
                  <th className="px-3 py-2">{tt('Obligation')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Compliant')}</th>
                  <th className="px-3 py-2">{tt('Deadline')}</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_REVIEWS.map(m => (
                  <tr key={m.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-bold font-mono text-xs">{m.id}</td>
                    <td className="px-3 py-2 font-semibold text-xs">{tt(m.name)}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(m.obligation)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{tt(m.status)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.compliant ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{m.compliant ? tt('Yes') : tt('No')}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-vfes-dark/65">{m.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-vfes-dark/55">{tt('All active SMP obligations compliant at last audit. M3 WBA renewal due Q4 2026.')}</span>
            <Link to="/portal/regulatory" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          </div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Market share trend — fixed · mobile · broadband (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={MARKET_SHARE}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[20, 45]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="fixed"     stroke={BLUE}   fill={BLUE}   fillOpacity={0.2} name={tt('Fixed %')} />
                  <Area type="monotone" dataKey="broadband" stroke={GREEN}  fill={GREEN}  fillOpacity={0.2} name={tt('Broadband %')} />
                  <Area type="monotone" dataKey="mobile"    stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} name={tt('Mobile %')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('SMP thresholds: fixed >35% and broadband >35% are above notification level — obligations apply.')}</span>
              <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
            </div>
          </Panel>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('SMP markets')}          value="2"      delta={tt('fixed + broadband')}    trend="flat" icon={Scale}     />
          <KpiCard label={tt('MTR (mobile)')}          value="BSD 0.0028"delta={tt('URCA glide-path')}      trend="up"   icon={Phone}    />
          <KpiCard label={tt('Reference offer')}       value="Active" delta={tt('scenario Jun 2026')}   trend="up"   icon={FileText} />
          <KpiCard label={tt('Next M3 review')}        value="Q4 2026"delta={tt('WBA renewal')}          trend="flat" icon={BarChart2}/>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/network"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
        </div>
      </>)}

      {tab === 'coverage' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Obligations met')}    value="4 / 7"  delta={tt('3 at risk')}              trend="flat" icon={Scale}       accent />
          <KpiCard label={tt('5G pop coverage')}    value="90.6%"  delta={tt('target 95%')}              trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('700 MHz rural')}      value="91.2%"  delta={tt('target 90% — met')}        trend="up"   icon={Globe}       />
          <KpiCard label={tt('FTTH new-build')}     value="82.0%"  delta={tt('-3 pp vs target')}         trend="down" icon={AlertTriangle}/>
        </div>

        <Panel title={tt('Coverage obligations — target vs actual')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Obligation')}</th>
                  <th className="px-3 py-2 text-right">{tt('Target %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Actual %')}</th>
                  <th className="px-3 py-2 text-right">{tt('Gap')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {OBLIGATIONS.map(o => (
                  <tr key={o.obligation} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2">{tt(o.obligation)}</td>
                    <td className="px-3 py-2 text-right font-mono">{o.target}%</td>
                    <td className="px-3 py-2 text-right">
                      <span className={o.actual >= o.target ? 'text-emerald-600 font-bold font-mono' : 'text-red-600 font-bold font-mono'}>{o.actual}%</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      <span className={o.actual >= o.target ? 'text-emerald-600' : 'text-red-600 font-bold'}>
                        {o.actual >= o.target ? `+${(o.actual - o.target).toFixed(1)}` : `${(o.actual - o.target).toFixed(1)}`}
                      </span>
                    </td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(o.status)}`}>{tt(o.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('FTTH 3 pp short and rural sites 1.6 pp short — civil works must start now to meet the Q3 attestation.')}<ChevronRight className="w-3 h-3" />
            </div>
            <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Coverage trajectory — 5G pop · 700 MHz rural (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={COVERAGE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[85, 100]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pop5g"    stroke={BLUE}  strokeWidth={2.4} dot name={tt('5G pop %')} />
                  <Line type="monotone" dataKey="rural700" stroke={GREEN} strokeWidth={2.4} dot name={tt('700 MHz rural %')} />
                  <Line type="monotone" dataKey="pop4g"    stroke={AMBER} strokeWidth={1.6} strokeDasharray="4 4" dot={false} name={tt('4G pop %')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('All three trajectories improving — rural municipality permit acceleration is the key risk to the 5G target.')}</span>
              <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            </div>
          </Panel>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Municipality audits')}    value="1,842" delta={tt('of 2,134 completed')} trend="up"   icon={Activity}    />
          <KpiCard label={tt('Rural sites at-risk')}  value="3"     delta={tt('-1.6 pp gap')}         trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('FTTH civil works open')}  value="14"    delta={tt('sites started')}       trend="up"   icon={Zap}         />
          <KpiCard label={tt('Permit blockers')}        value="4"     delta={tt('municipal pending')} trend="flat" icon={Lock}        />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/network"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/incidents"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
        </div>
      </>)}

      {tab === 'wholesale' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total obligations')}    value="8"      delta={tt('1 non-compliant')}      trend="flat" icon={Scale}       accent />
          <KpiCard label={tt('SMP obligations')}      value="5"      delta={tt('all compliant')}        trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Reference offer filed')}value="Yes"    delta={tt('scenario Q3 2026')}    trend="up"   icon={FileText}   />
          <KpiCard label={tt('Price reviews pending')}value="2"      delta={tt('dark fibre + LLU')}     trend="flat" icon={AlertTriangle}/>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'smp', 'non-smp'] as const).map(f => (
            <button key={f} onClick={() => setWholesaleFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${wholesaleFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {f === 'all' ? tt('All') : f === 'smp' ? tt('SMP') : tt('Non-SMP')}
            </button>
          ))}
        </div>

        <Panel title={tt('Wholesale obligations — prices & compliance status')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Obligation')}</th>
                  <th className="px-3 py-2">{tt('SMP')}</th>
                  <th className="px-3 py-2 text-right">{tt('Reference price')}</th>
                  <th className="px-3 py-2">{tt('Compliant')}</th>
                  <th className="px-3 py-2">{tt('Review date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWholesale.map(w => (
                  <tr key={w.obligation} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-semibold text-xs">{tt(w.obligation)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${w.smp ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{w.smp ? tt('SMP') : tt('Non-SMP')}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{w.price}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${w.compliant ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{w.compliant ? tt('Yes') : tt('Non-compliant')}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-vfes-dark/65">{w.review}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Dark fibre price review overdue — submit cost model to URCA by 31 Aug 2027.')}<ChevronRight className="w-3 h-3" />
            </div>
            <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
          </div>
        </Panel>
        <div className="mt-4">
          <Panel title={tt('Wholesale compliance — obligations met vs non-compliant (monthly)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={WHOLESALE_COMPLIANCE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="compliant"    fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Compliant')} />
                  <Bar dataKey="nonCompliant" fill={RED}   radius={[4, 4, 0, 0]} name={tt('Non-compliant')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('Dark fibre has been non-compliant since Q1 — cost model submission overdue to URCA.')}</span>
              <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/network"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
        </div>
      </>)}

      {tab === 'qos' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('KPIs compliant')}      value="6 / 6"  delta={tt('all green')}            trend="up"   icon={ShieldCheck} accent />
          <KpiCard label={tt('Call setup success')}  value="99.6%"  delta={tt('floor 99.0%')}          trend="up"   icon={Phone}       />
          <KpiCard label={tt('112 emergency')}        value="100%"   delta={tt('compliant')}            trend="up"   icon={Zap}         />
          <KpiCard label={tt('Drop-call rate')}       value="0.42%"  delta={tt('floor 1.0% — clear')}  trend="up"   icon={Activity}    />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('View:')}</span>
          {(['chart', 'table'] as const).map(v => (
            <button key={v} onClick={() => setQosView(v)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${qosView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {v === 'chart' ? tt('Chart') : tt('Table')}
            </button>
          ))}
        </div>

        {qosView === 'chart' && (
          <Panel title={tt('QoS attestation — measured vs regulated floor')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={QOS}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="kpi" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v}${p.payload.unit} (floor ${p.payload.sla}${p.payload.unit})`, tt('KPI')]} />
                  <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                    {QOS.map((q, i) => <Cell key={i} fill={q.val >= q.sla ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('All QoS KPIs clear the URCA regulated floor — figures auto-extracted from the network data warehouse.')}</div>
          </Panel>
        )}

        {qosView === 'table' && (
          <Panel title={tt('QoS attestation table — measured KPIs vs SLA floor')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('KPI')}</th>
                    <th className="px-3 py-2 text-right">{tt('Measured')}</th>
                    <th className="px-3 py-2 text-right">{tt('SLA floor')}</th>
                    <th className="px-3 py-2 text-right">{tt('Margin')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {QOS.map(q => (
                    <tr key={q.kpi} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold">{tt(q.kpi)}</td>
                      <td className="px-3 py-2 text-right font-bold font-mono">{q.val}{q.unit}</td>
                      <td className="px-3 py-2 text-right font-mono text-vfes-dark/55">{q.sla}{q.unit}</td>
                      <td className={`px-3 py-2 text-right font-bold font-mono ${q.val >= q.sla ? 'text-emerald-600' : 'text-red-600'}`}>
                        {q.val >= q.sla ? `+${Math.abs(q.val - q.sla).toFixed(2)}` : `-${Math.abs(q.val - q.sla).toFixed(2)}`}
                      </td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.val >= q.sla ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{q.val >= q.sla ? tt('Pass') : tt('Fail')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <div className="mt-4">
          <Panel title={tt('QoS trend — call setup success & drop-call rate (6 months)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={QOS_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="setupSuccess" stroke={GREEN} strokeWidth={2.4} dot name={tt('Setup success %')} />
                  <Line type="monotone" dataKey="dropRate"     stroke={RED}   strokeWidth={2}   dot name={tt('Drop rate %')} />
                  <Line type="monotone" dataKey="emergency"    stroke={BLUE}  strokeWidth={1.6} strokeDasharray="4 4" dot={false} name={tt('112 %')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('QoS improving consistently — all six KPIs above regulatory floor for 6+ consecutive months.')}</span>
              <Link to="/portal/core-5g" className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
            </div>
          </Panel>
        </div>
        <div className="mt-4">
          <Panel title={tt('QoS compliance notes — methodology & data sources')}>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: GREEN }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('Measurement method')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Automated probes on representative network sample. CDF measurement per URCA Resolution 2021/8.')}</div>
              </div>
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: BLUE }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('Data source')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Network OSS telemetry → Snowflake data lake → governed QoS view. Full lineage available for audit.')}</div>
              </div>
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: AMBER }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('Filing schedule')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Quarterly attestation by 28th of month after period end. Annual QoS report by 31 Oct.')}</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/core-5g"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('5G Core →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/network"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/regulatory"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
        </div>
      </>)}

      {tab === 'portability' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Port-in (Jun)')}          value="5,840" delta={tt('+360 MoM')}          trend="up"   icon={Phone}       accent />
          <KpiCard label={tt('Net gain (Jun)')}          value="+960"  delta={tt('port-in vs port-out')} trend="up"  icon={Activity}   />
          <KpiCard label={tt('MNP success rate')}        value="99.5%" delta={tt('+0.1 pp MoM')}       trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Avg port completion')}     value="1.8h"  delta={tt('target < 4h')}       trend="up"   icon={Zap}         />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Year:')}</span>
          {['2025', '2026'].map(y => (
            <button key={y} onClick={() => setPortYear(y)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${portYear === y ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {y}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Number portability volumes — port-in vs port-out (monthly)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={filteredPortability}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="portIn"  fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Port-in')} />
                  <Bar dataKey="portOut" fill={AMBER} radius={[4, 4, 0, 0]} name={tt('Port-out')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('MNP success rate trend (%)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={filteredPortability}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[98.5, 100]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="successRate" stroke={GREEN} strokeWidth={2.4} dot name={tt('MNP success %')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('MNP success rate consistently above 99% — URCA regulatory floor is 98%.')}</div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        </div>
        <div className="mt-4">
          <Panel title={tt('Number portability — net gain trend (monthly)')}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={PORT_NET_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="netGain" stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('Net gain')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Positive net gain every month — competitive pricing and 5G coverage driving port-ins from BTC and Rival ISP A.')}</div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Port-in (YTD)')}          value="32.8K" delta={tt('+8% vs prior year')} trend="up"   icon={Phone}       />
          <KpiCard label={tt('Port-out (YTD)')}         value="27.0K" delta={tt('+3% vs prior year')} trend="flat" icon={Activity}    />
          <KpiCard label={tt('Net YTD')}                 value="+5.8K" delta={tt('positive — good')}   trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Failed ports (YTD)')}     value="186"   delta={tt('0.3% failure rate')}  trend="up"   icon={AlertTriangle}/>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/fraud" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Fraud →')}</Link>
        </div>
      </>)}

      {tab === 'compliance' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Deadlines (90d)')}    value="2"       delta={tt('1 high-risk')}       trend="flat" icon={AlertTriangle} accent />
          <KpiCard label={tt('High-risk items')}     value="3"       delta={tt('filing · rural · fibre')} trend="flat" icon={Lock}   />
          <KpiCard label={tt('Overall score')}       value="95/100"  delta={tt('+1 pt QoQ')}        trend="up"   icon={Activity}     />
          <KpiCard label={tt('Filing in')}           value={`${filingCountdown}d`} delta={tt('Q4 2026')} trend="flat" icon={FileText}  />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['date', 'risk'] as const).map(s => (
            <button key={s} onClick={() => setDeadlineSort(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${deadlineSort === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {s === 'date' ? tt('Date') : tt('Risk')}
            </button>
          ))}
        </div>

        <Panel title={tt('Compliance deadlines — sorted by proximity / risk')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Deadline')}</th>
                  <th className="px-3 py-2">{tt('Obligation')}</th>
                  <th className="px-3 py-2 text-right">{tt('Days left')}</th>
                  <th className="px-3 py-2">{tt('Owner')}</th>
                  <th className="px-3 py-2">{tt('Risk')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedDeadlines.map(d => (
                  <tr key={d.deadline} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs">{d.deadline}</td>
                    <td className="px-3 py-2 font-semibold text-xs">{tt(d.obligation)}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${d.daysLeft < 60 ? 'text-red-600' : d.daysLeft < 120 ? 'text-amber-600' : ''}`}>{d.daysLeft}</td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(d.owner)}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(d.risk)}`}>{tt(d.risk)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('FTTH catch-up and dark fibre review are the highest-risk items — assign owners immediately.')}<ChevronRight className="w-3 h-3" />
            </div>
            <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
          </div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Compliance score trend — quarterly')}>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={COMPLIANCE_SCORE_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="q" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} domain={[80, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Score')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/ciso"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('CISO →')}</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Remediation plans')}      value="2"      delta={tt('FTTH + rural sites')}      trend="flat" icon={AlertTriangle}/>
          <KpiCard label={tt('Regulator meetings')}     value="3"      delta={tt('Q3 scheduled')}        trend="flat" icon={FileText}    />
          <KpiCard label={tt('Evidence packages')}      value="12"     delta={tt('ready for Q2')}        trend="up"   icon={Lock}        />
          <KpiCard label={tt('Automated submissions')}  value="4"      delta={tt('of 12 filings')}       trend="up"   icon={Zap}         />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/regulatory"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Regulatory →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/incidents"   className="text-xs font-bold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </>)}

      {tab === 'dsar' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open DSARs')}           value="295"  delta={tt('3 breached SLA')}      trend="flat" icon={FileText}   accent />
          <KpiCard label={tt('Breach rate')}           value="1.0%" delta={tt('target < 2%')}         trend="up"   icon={ShieldCheck}/>
          <KpiCard label={tt('Avg completion (days)')} value="10.4" delta={tt('target < 30d')}        trend="up"   icon={Activity}   />
          <KpiCard label={tt('Erasure requests')}      value="88"   delta={tt('0 breaches')}          trend="up"   icon={Lock}       />
        </div>

        <Panel title={tt('DSAR queue & SLA analysis by request type')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Request type')}</th>
                  <th className="px-3 py-2 text-right">{tt('Open')}</th>
                  <th className="px-3 py-2 text-right">{tt('SLA (days)')}</th>
                  <th className="px-3 py-2 text-right">{tt('Avg comp. (d)')}</th>
                  <th className="px-3 py-2 text-right">{tt('Breached')}</th>
                </tr>
              </thead>
              <tbody>
                {DSAR.map(d => (
                  <tr key={d.type} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2">{tt(d.type)}</td>
                    <td className="px-3 py-2 text-right font-mono">{d.open}</td>
                    <td className="px-3 py-2 text-right font-mono">{d.slaDays}</td>
                    <td className="px-3 py-2 text-right font-mono">{d.avgDays}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${d.breached > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{d.breached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('3 DSARs breached the 30-day SLA — auto-route ageing requests to the privacy desk.')}<ChevronRight className="w-3 h-3" />
            </div>
            <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
          </div>
        </Panel>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <Panel title={tt('DSAR volume — received vs resolved (monthly)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={DSAR_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="received" fill={AMBER} radius={[4, 4, 0, 0]} name={tt('Received')} />
                  <Bar dataKey="resolved" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Resolved')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('DSAR SLA breach trend (monthly count)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={DSAR_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="breached" stroke={RED} strokeWidth={2.4} dot name={tt('Breaches')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Breach count improving — automated routing to privacy desk deployed in Apr reduces ageing risk.')}</div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/ai-insights"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/ciso"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('CISO →')}</Link>
        </div>
        <div className="mt-4">
          <Panel title={tt('DSAR data governance — processing framework')}>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: BLUE }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('Request intake')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Portal + email + phone. Auto-classified by AI_EXTRACT. Assigned to privacy desk within 24h.')}</div>
              </div>
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: GREEN }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('Data retrieval')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Snowflake governed views span CRM, billing, OSS and CDR. Single query covers all personal data domains.')}</div>
              </div>
              <div className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: AMBER }}>
                <div className="text-[11px] font-bold text-vfes-dark mb-1">{tt('SLA monitoring')}</div>
                <div className="text-xs text-vfes-dark/65">{tt('Automated SLA tracker flags requests at Day 20. Breach alerts go to DPO and Privacy desk lead.')}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('DPA compliance tracked in Snowflake. Full request-to-response lineage retained for 5 years.')}</span>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/ai-insights"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/ciso"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('CISO →')}</Link>
        </div>
      </>)}

      <AskTheData />
    </div>
  )
}
