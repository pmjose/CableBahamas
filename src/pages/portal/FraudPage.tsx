import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShieldAlert, Phone, Globe, Siren, Brain, ChevronRight, TrendingDown,
  Activity, Lock, FileText, List, BarChart2, Zap, AlertTriangle,
} from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import AskTheData from '../../components/AskTheData'
import tt from '../../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend, Cell, Line, LineChart,
} from 'recharts'

const BLUE = '#FF4438'
const NAVY = '#11567F'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const PURPLE = '#7C3AED'

const PL_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  grossLoss: 180 + Math.round(40 * Math.sin(i / 2)) + (i > 8 ? 60 : 0),
  prevented:  120 + Math.round(30 * Math.sin(i / 2.5 + 1)),
  netLoss:     60 + Math.round(20 * Math.sin(i / 3)),
}))

const FRAUD_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][i],
  simSwap:      40 + Math.round(20 * Math.sin(i / 2)) + (i > 8 ? 18 : 0),
  irsf:         28 + Math.round(12 * Math.sin(i / 3 + 1)),
  wangiri:      60 + Math.round(30 * Math.sin(i / 2.5 + 2)),
  subscription: 22 + Math.round( 8 * Math.sin(i / 2.8 + 0.5)),
}))

const ML_PERF_TREND = [
  { m: 'Jan', precision: 0.88, recall: 0.82, f1: 0.85 },
  { m: 'Feb', precision: 0.89, recall: 0.84, f1: 0.86 },
  { m: 'Mar', precision: 0.90, recall: 0.85, f1: 0.87 },
  { m: 'Apr', precision: 0.92, recall: 0.87, f1: 0.89 },
  { m: 'May', precision: 0.93, recall: 0.89, f1: 0.91 },
  { m: 'Jun', precision: 0.94, recall: 0.91, f1: 0.92 },
]

const LOSS_BY_CAT = [
  { m: 'Jan', irsf: 48, simSwap: 24, subscription: 22, wangiri: 18 },
  { m: 'Feb', irsf: 52, simSwap: 28, subscription: 24, wangiri: 16 },
  { m: 'Mar', irsf: 44, simSwap: 32, subscription: 26, wangiri: 14 },
  { m: 'Apr', irsf: 38, simSwap: 30, subscription: 24, wangiri: 12 },
  { m: 'May', irsf: 32, simSwap: 26, subscription: 21, wangiri: 11 },
  { m: 'Jun', irsf: 28, simSwap: 22, subscription: 18, wangiri: 10 },
]

const IRSF_DEST = [
  { country: 'Latvia',       calls: 1840, lossK: 22.4 },
  { country: 'Somalia',      calls: 1210, lossK: 31.8 },
  { country: 'Cuba',         calls: 980,  lossK: 18.2 },
  { country: 'Sierra Leone', calls: 720,  lossK: 14.6 },
  { country: 'Maldives',     calls: 540,  lossK: 9.1  },
  { country: 'Vanuatu',      calls: 380,  lossK: 7.2  },
]

const IRSF_TREND = [
  { w: 'W1', loss: 48.2, blocked: 22.4 }, { w: 'W2', loss: 52.1, blocked: 28.1 },
  { w: 'W3', loss: 44.8, blocked: 32.6 }, { w: 'W4', loss: 38.4, blocked: 30.2 },
  { w: 'W5', loss: 35.1, blocked: 28.8 }, { w: 'W6', loss: 29.6, blocked: 24.1 },
  { w: 'W7', loss: 24.2, blocked: 20.4 }, { w: 'W8', loss: 21.8, blocked: 18.6 },
]

const WANGIRI_TREND = [
  { m: 'Jan', attempts: 4820, suppressed: 4380 }, { m: 'Feb', attempts: 5240, suppressed: 4870 },
  { m: 'Mar', attempts: 6120, suppressed: 5680 }, { m: 'Apr', attempts: 5840, suppressed: 5520 },
  { m: 'May', attempts: 4980, suppressed: 4730 }, { m: 'Jun', attempts: 5640, suppressed: 5390 },
]

const SUB_FRAUD_TYPES = [
  { type: 'Identity theft',   cases: 382, lossK: 48.2 },
  { type: 'SIM clone',        cases: 241, lossK: 31.4 },
  { type: 'Account takeover', cases: 184, lossK: 24.8 },
  { type: 'Credit abuse',     cases: 152, lossK: 19.1 },
  { type: 'Port hijack',      cases: 128, lossK: 16.8 },
]

const SUB_FRAUD_TREND = [
  { m: 'Jan', cases: 940,  prevented: 680  }, { m: 'Feb', cases: 1020, prevented: 790  },
  { m: 'Mar', cases: 1140, prevented: 920  }, { m: 'Apr', cases: 1080, prevented: 870  },
  { m: 'May', cases: 1240, prevented: 1040 }, { m: 'Jun', cases: 1087, prevented: 960  },
]

const SIGNALING = [
  { vector: 'SS7 Cat-2 (location query)',  blocked: 12840, status: 'firewalled', risk: 'High' },
  { vector: 'SS7 Cat-3 (intercept)',        blocked: 3420,  status: 'firewalled', risk: 'High' },
  { vector: 'Diameter IDR/IDA spoofing',    blocked: 1860,  status: 'firewalled', risk: 'High' },
  { vector: 'GTP-C overbilling',            blocked: 940,   status: 'monitor',    risk: 'Med'  },
  { vector: 'SMS A2P grey-route',           blocked: 28400, status: 'firewalled', risk: 'Med'  },
  { vector: 'SIGTRAN replay attack',        blocked: 540,   status: 'monitor',    risk: 'Med'  },
  { vector: 'Diameter PUR spoofing',        blocked: 320,   status: 'firewalled', risk: 'Low'  },
]

const SS7_TREND = [
  { m: 'Jan', cat2: 9840,  cat3: 2410, diameter: 1420 }, { m: 'Feb', cat2: 10200, cat3: 2680, diameter: 1580 },
  { m: 'Mar', cat2: 11400, cat3: 2940, diameter: 1620 }, { m: 'Apr', cat2: 12100, cat3: 3110, diameter: 1740 },
  { m: 'May', cat2: 12480, cat3: 3280, diameter: 1820 }, { m: 'Jun', cat2: 12840, cat3: 3420, diameter: 1860 },
]

const CASES = [
  { id: 'FRD-9821', type: 'SIM Swap',  priority: 'Critical', status: 'Open',     assigned: 'Emma Rolle',  lossK: 12.4, age: 2  },
  { id: 'FRD-9814', type: 'IRSF',      priority: 'High',     status: 'Open',     assigned: 'Lars Knowles', lossK: 8.8,  age: 4  },
  { id: 'FRD-9807', type: 'Wangiri',   priority: 'Medium',   status: 'Review',   assigned: 'Wout Bethel',     lossK: 4.2,  age: 7  },
  { id: 'FRD-9798', type: 'Sub Fraud', priority: 'High',     status: 'Open',     assigned: 'Jonas Willems', lossK: 6.1,  age: 5  },
  { id: 'FRD-9785', type: 'SS7',       priority: 'Critical', status: 'Resolved', assigned: 'Thomas Ferguson',lossK: 18.6, age: 12 },
  { id: 'FRD-9771', type: 'IRSF',      priority: 'Medium',   status: 'Review',   assigned: 'Emma Rolle',  lossK: 3.8,  age: 8  },
  { id: 'FRD-9762', type: 'SIM Swap',  priority: 'High',     status: 'Resolved', assigned: 'Lars Knowles', lossK: 9.4,  age: 15 },
]

const CASE_RES_TIMES = [
  { type: 'SIM Swap',  avgHrs: 2.4, p95: 8.2  },
  { type: 'IRSF',      avgHrs: 4.8, p95: 18.4 },
  { type: 'Wangiri',   avgHrs: 1.2, p95: 4.8  },
  { type: 'SS7',       avgHrs: 6.2, p95: 24.1 },
  { type: 'Sub Fraud', avgHrs: 8.4, p95: 36.2 },
]

const BLOCKLIST_ENTRIES = [
  { type: 'MSISDN',         entries: 48420, added30d: 1840, source: 'ML auto-block', effectiveness: 98 },
  { type: 'IMEI',           entries: 12840, added30d: 420,  source: 'Device DB',     effectiveness: 96 },
  { type: 'IP/ASN',         entries: 8420,  added30d: 280,  source: 'Threat intel',  effectiveness: 94 },
  { type: 'Premium range',  entries: 2840,  added30d: 120,  source: 'IRSF detect',   effectiveness: 99 },
  { type: 'Wangiri number', entries: 94200, added30d: 4820, source: 'Signaling FW',  effectiveness: 91 },
]

const BLOCKLIST_TREND = [
  { m: 'Jan', msisdn: 42000, imei: 11200, ip: 7400 }, { m: 'Feb', msisdn: 43800, imei: 11600, ip: 7600 },
  { m: 'Mar', msisdn: 45200, imei: 12000, ip: 7900 }, { m: 'Apr', msisdn: 46400, imei: 12200, ip: 8100 },
  { m: 'May', msisdn: 47100, imei: 12600, ip: 8300 }, { m: 'Jun', msisdn: 48420, imei: 12840, ip: 8420 },
]

const SIM_SWAP_QUEUE = [
  { id: 'SIM-88412', msisdn: '+1 242 4•• ••3 102', score: 96, signals: 'New device + IMEI change + 02:14 swap + bank login attempt', action: 'Auto-blocked', type: 'blocked' },
  { id: 'SIM-71290', msisdn: '+1 242 4•• ••8 540', score: 88, signals: 'Port + SIM swap < 24h + roaming',                            action: 'Step-up auth', type: 'blocked' },
  { id: 'SIM-33108', msisdn: '+1 242 4•• ••1 877', score: 74, signals: 'IMEI change + high-value account',                           action: 'Review',       type: 'review'  },
  { id: 'SIM-29441', msisdn: '+1 242 4•• ••9 214', score: 82, signals: 'Known fraud pattern + new SIM + SMS redirect',               action: 'Auto-blocked', type: 'blocked' },
  { id: 'SIM-18820', msisdn: '+1 242 4•• ••4 688', score: 68, signals: 'IMEI change only + business account',                        action: 'Review',       type: 'review'  },
]

const FRAUD_BY_REGION = [
  { region: 'Nassau',       simSwap: 42, irsf: 28, wangiri: 62, subscription: 34 },
  { region: 'Grand Bahama', simSwap: 38, irsf: 22, wangiri: 48, subscription: 28 },
  { region: 'Out Islands',      simSwap: 24, irsf: 18, wangiri: 34, subscription: 22 },
  { region: 'Abaco',        simSwap: 18, irsf: 12, wangiri: 28, subscription: 16 },
  { region: 'Eleuthera',simSwap: 14, irsf: 8,  wangiri: 18, subscription: 12 },
  { region: 'Freeport',         simSwap: 10, irsf: 6,  wangiri: 14, subscription: 8  },
]

const PEER_BENCHMARK = [
  { metric: tt('Fraud loss / 1K subs BSD '), cablebahamas: 3.8,  peer1: 5.2,  peer2: 6.8,  industry: 5.4  },
  { metric: tt('SIM-swap block rate %'), cablebahamas: 86,   peer1: 72,   peer2: 68,   industry: 74   },
  { metric: tt('IRSF detection AUC'),    cablebahamas: 0.97, peer1: 0.91, peer2: 0.89, industry: 0.91 },
  { metric: tt('Case TTR avg (h)'),      cablebahamas: 3.2,  peer1: 6.4,  peer2: 8.2,  industry: 6.8  },
  { metric: tt('Wangiri suppress %'),    cablebahamas: 96,   peer1: 84,   peer2: 78,   industry: 84   },
]

const PROTECTION_METHODS = [
  { method: 'ML real-time scoring',        coverage: 'SIM swap · subscription', latency: '< 80 ms', precision: '0.94', deployed: true  },
  { method: 'Signaling FW (GSMA FS.11)',   coverage: 'SS7 Cat-2/3 · Diameter',  latency: '< 5 ms',  precision: '—',    deployed: true  },
  { method: 'CDR velocity check',          coverage: 'IRSF · Wangiri',          latency: '< 2 s',   precision: '0.91', deployed: true  },
  { method: 'Biometric step-up (bank API)',coverage: 'High-value SIM swap',      latency: '< 4 s',   precision: '—',    deployed: true  },
  { method: 'Device reputation DB',        coverage: 'IMEI blocklist',           latency: '< 50 ms', precision: '0.96', deployed: true  },
  { method: 'Graph-based anomaly (GNN)',   coverage: 'Subscription rings',       latency: '< 2 min', precision: '0.88', deployed: false },
]

type TabId = 'overview' | 'sim-swap' | 'irsf-wangiri' | 'subscription' | 'signaling' | 'cases' | 'blocklist' | 'pl-analysis'
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview',     label: 'Overview',       icon: Activity    },
  { id: 'sim-swap',     label: 'SIM Swap',        icon: Phone       },
  { id: 'irsf-wangiri', label: 'IRSF / Wangiri', icon: Globe       },
  { id: 'subscription', label: 'Subscription',    icon: FileText    },
  { id: 'signaling',    label: 'Signaling',       icon: ShieldAlert },
  { id: 'cases',        label: 'Cases',           icon: List        },
  { id: 'blocklist',    label: 'Blocklists',      icon: Lock        },
  { id: 'pl-analysis',  label: 'P&L Analysis',    icon: BarChart2   },
]

export default function FraudPage() {
  const { i18n } = useTranslation()
  const [tab, setTab]               = useState<TabId>('overview')
  const [simFilter, setSimFilter]   = useState<'all' | 'blocked' | 'review'>('all')
  const [irsfSort, setIrsfSort]     = useState<'loss' | 'calls'>('loss')
  const [caseStatus, setCaseStatus] = useState<string>('all')
  const [alertVisible, setAlertVisible] = useState(true)
  const [liveTime, setLiveTime]     = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredSim = useMemo(
    () => simFilter === 'all' ? SIM_SWAP_QUEUE : SIM_SWAP_QUEUE.filter(s => s.type === simFilter),
    [simFilter],
  )
  const sortedIrsf = useMemo(
    () => [...IRSF_DEST].sort((a, b) => irsfSort === 'loss' ? b.lossK - a.lossK : b.calls - a.calls),
    [irsfSort],
  )
  const filteredCases = useMemo(
    () => caseStatus === 'all' ? CASES : CASES.filter(c => c.status === caseStatus),
    [caseStatus],
  )

  const sigColor  = (s: string) => s === 'firewalled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  const riskColor = (r: string) => r === 'High' ? 'bg-red-50 text-red-700' : r === 'Med' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
  const caseCol   = (s: string) => s === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : s === 'Review' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  const priCol    = (p: string) => p === 'Critical' ? 'bg-red-50 text-red-700' : p === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'

  return (
    <div className="p-8" key={i18n.language}>
      <PageHeader
        title={tt('Fraud & Signaling Security')}
        subtitle={tt('SIM swap · IRSF · Wangiri · SS7/Diameter firewall · fraud loss P&L · case management')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold text-xs">{tt('3 active threats')}</span>
          </div>
        }
      />

      {/* ── ML Intelligence ────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Fraud detection"
        models={[
          { name: 'SIM-Swap Detector', metric: 'precision 0.94', sub: 'IMEI + swap time + bank signal' },
          { name: 'IRSF Classifier',   metric: 'AUC 0.97',       sub: 'premium-rate CDR scoring'      },
          { name: 'Subscription Risk', metric: 'recall 0.91',    sub: 'identity + credit abuse model' },
        ]}
        agentLabel={tt('Run Fraud Hunter')}
        agentRunningLabel={tt('Correlating…')}
        agentSteps={[
          'Correlated SS7/Diameter signalling anomalies with CDR spikes',
          'Blocked in-flight SIM-swap & Wangiri patterns via API hook',
          'Throttled high-risk IRSF call destinations in real-time',
          'Opened cases with pre-attached evidence for the fraud team',
        ]}
        agentBlurb={tt('Detection without automated response just documents the loss. The agent acts in-flight on correlated signals across CDR, signalling and CRM data.')}
        decision={{
          title: tt('Block high-risk IRSF destinations; enforce SIM-swap step-up auth'),
          detail: tt('IRSF to a handful of premium-rate ranges drives most weekly loss. Block and require step-up on SIM-swap for high-value lines.'),
          impact: tt('cuts fraud loss · protects revenue assurance'),
          risk:   tt('over-blocking can hit legitimate traffic — allowlist known good'),
          linkTo: '/portal/risk',
          linkLabel: tt('Open Risk Centre'),
        }}
        chart={{
          kind: 'area',
          title: tt('Fraud detections — 12 months (counts)'),
          xKey: 'm',
          data: FRAUD_TREND,
          series: [
            { key: 'wangiri',      name: tt('Wangiri'),      color: NAVY   },
            { key: 'simSwap',      name: tt('SIM swap'),     color: RED    },
            { key: 'irsf',         name: tt('IRSF'),         color: AMBER  },
            { key: 'subscription', name: tt('Subscription'), color: PURPLE },
          ],
          note: tt('SIM-swap spike since Jun tracks a phishing campaign — step-up auth deployed.'),
        }}
        registryNote={tt('Fraud models trained weekly on CDR + signalling features in Snowflake. Served from Model Registry with daily drift checks.')}
      />

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {alertVisible && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 text-sm">{tt('Active: IRSF to Somalia premium range · SIM-swap cluster in Nassau · SS7 Cat-3 probe from unknown origin')}</div>
              <div className="text-xs text-red-700 mt-1">{tt('Automated blocks in place — fraud team review required for case escalation.')}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/incidents" className="text-xs font-bold text-red-900 hover:underline">{tt('Open Incidents →')}</Link>
              <button onClick={() => setAlertVisible(false)} className="text-[10px] text-red-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tt('Fraud loss (week)')}         value="BSD 48.2K" delta={tt('-18% WoW — detections up')} trend="up"   icon={TrendingDown} accent />
        <KpiCard label={tt('SIM-swap blocked (30d)')}    value="1,284"  delta={tt('+22% vs prior month')}      trend="up"   icon={ShieldAlert}  />
        <KpiCard label={tt('Signaling attacks blocked')} value="47.5K"  delta={tt('SS7 + Diameter + A2P')}     trend="flat" icon={Globe}        />
        <KpiCard label={tt('Wangiri suppressed')}        value="91%"    delta={tt('auto-blocked')}              trend="up"   icon={Phone}        />
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
          <Panel title={tt('Fraud loss P&L — 12 months (BSD K)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={PL_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="grossLoss" stroke={RED}   fill={RED}   fillOpacity={0.25} name={tt('Gross loss BSD K')} />
                  <Area type="monotone" dataKey="prevented" stroke={GREEN} fill={GREEN} fillOpacity={0.25} name={tt('Prevented BSD K')} />
                  <Area type="monotone" dataKey="netLoss"   stroke={AMBER} fill={AMBER} fillOpacity={0.25} name={tt('Net loss BSD K')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />{tt('Net loss down 18% WoW — automated blocks working effectively.')}
              </div>
              <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing Impact →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('ML detection precision & recall — 6-month trend')}>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={ML_PERF_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} domain={[0.80, 1.00]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="precision" stroke={BLUE}  strokeWidth={2.4} dot name={tt('Precision')} />
                  <Line type="monotone" dataKey="recall"    stroke={GREEN} strokeWidth={2.4} dot name={tt('Recall')} />
                  <Line type="monotone" dataKey="f1"        stroke={AMBER} strokeWidth={1.8} strokeDasharray="4 4" dot={false} name={tt('F1 score')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('Models retrained weekly on new fraud signals via Snowflake Feature Store.')}</span>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('ML precision (SIM-swap)')} value="0.94"  delta={tt('+0.02 MoM')}           trend="up"   icon={Zap}         />
          <KpiCard label={tt('False positive rate')}     value="0.6%"  delta={tt('-0.2 pp MoM')}          trend="up"   icon={Activity}    />
          <KpiCard label={tt('Auto-block rate')}         value="78%"   delta={tt('of all detections')}    trend="up"   icon={Lock}        />
          <KpiCard label={tt('Cases resolved (30d)')}    value="284"   delta={tt('avg 3.2h TTR')}         trend="up"   icon={FileText}    />
        </div>

        <div className="mt-4">
          <Panel title={tt('Fraud detections by region — top 6 CCAA (counts)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={FRAUD_BY_REGION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="simSwap"      fill={RED}    radius={[4, 4, 0, 0]} name={tt('SIM swap')} />
                  <Bar dataKey="irsf"         fill={AMBER}  radius={[4, 4, 0, 0]} name={tt('IRSF')} />
                  <Bar dataKey="wangiri"      fill={NAVY}   radius={[4, 4, 0, 0]} name={tt('Wangiri')} />
                  <Bar dataKey="subscription" fill={PURPLE} radius={[4, 4, 0, 0]} name={tt('Subscription')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Nassau and Grand Bahama account for 65% of total detections — higher urban density and digital-banking adoption.')}</div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Industry benchmark — Cable Bahamas vs peer operators')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Metric')}</th>
                    <th className="px-3 py-2 text-right text-vfes-dark">{tt('Cable Bahamas')}</th>
                    <th className="px-3 py-2 text-right">{tt('Peer A')}</th>
                    <th className="px-3 py-2 text-right">{tt('Peer B')}</th>
                    <th className="px-3 py-2 text-right">{tt('Industry avg')}</th>
                    <th className="px-3 py-2">{tt('Position')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PEER_BENCHMARK.map(b => {
                    const best = b.metric.includes('loss') || b.metric.includes('TTR')
                      ? Math.min(b.cablebahamas, b.peer1, b.peer2, b.industry)
                      : Math.max(b.cablebahamas, b.peer1, b.peer2, b.industry)
                    const leading = b.cablebahamas === best
                    return (
                      <tr key={b.metric} className="border-b border-black/5 hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-semibold text-xs">{b.metric}</td>
                        <td className={`px-3 py-2 text-right font-bold ${leading ? 'text-emerald-600' : 'text-vfes-dark'}`}>{b.cablebahamas}</td>
                        <td className="px-3 py-2 text-right text-vfes-dark/65">{b.peer1}</td>
                        <td className="px-3 py-2 text-right text-vfes-dark/65">{b.peer2}</td>
                        <td className="px-3 py-2 text-right text-vfes-dark/65">{b.industry}</td>
                        <td className="px-3 py-2">
                          {leading
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{tt('#1')}</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{tt('Watch')}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('Benchmarks sourced from GSMA fraud analytics consortium — anonymised Q1 2026.')}</span>
              <Link to="/portal/risk" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Risk Centre →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Cross-domain security links')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('Fraud signals feed Risk, CISO, Trust Centre and Revenue Assurance dashboards in real-time.')}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/risk"         className="text-xs font-bold bg-vfes-red text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-vfes-red-dark">{tt('Risk Centre')}</Link>
            <Link to="/portal/trust-center" className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5">{tt('Trust Centre')}</Link>
            <Link to="/portal/ciso"         className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5">{tt('CISO')}</Link>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-gradient-to-br from-vfes-red/10 to-transparent border border-vfes-red/20 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-vfes-dark mb-1">{tt('Fraud intelligence feeds')}</div>
            <div className="text-sm text-vfes-dark/80">{tt('GSMA Fraud & Security Group · INTERPOL SAST · Europol cybercrime unit — signals enriched into Snowflake in near real-time.')}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/trust-center" className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5 shrink-0">{tt('Trust Centre')}</Link>
            <Link to="/portal/ciso"         className="text-xs font-bold bg-white border border-black/10 text-vfes-dark px-3 py-1.5 rounded-lg hover:bg-black/5 shrink-0">{tt('CISO')}</Link>
          </div>
        </div>
      </>)}

      {tab === 'sim-swap' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Swaps detected (30d)')}  value="1,284" delta={tt('+22% vs prior month')}  trend="up"   icon={ShieldAlert} accent />
          <KpiCard label={tt('Auto-blocked')}           value="1,104" delta={tt('86% auto-rate')}         trend="up"   icon={Lock}        />
          <KpiCard label={tt('Step-up auth triggered')} value="148"   delta={tt('bank-flagged accounts')} trend="flat" icon={Phone}       />
          <KpiCard label={tt('Avg ML risk score')}      value="84"    delta={tt('threshold 70')}          trend="flat" icon={Activity}    />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'blocked', 'review'] as const).map(f => (
            <button key={f} onClick={() => setSimFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${simFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <Panel title={tt('SIM-swap risk queue — real-time ML scoring')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Case ID')}</th>
                  <th className="px-3 py-2">{tt('MSISDN')}</th>
                  <th className="px-3 py-2 text-right">{tt('Risk score')}</th>
                  <th className="px-3 py-2">{tt('Fraud signals')}</th>
                  <th className="px-3 py-2">{tt('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSim.map(c => (
                  <tr key={c.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.msisdn}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-bold ${c.score >= 90 ? 'text-red-600' : c.score >= 75 ? 'text-amber-600' : 'text-vfes-dark/70'}`}>{c.score}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/70">{tt(c.signals)}</td>
                    <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-vfes-red/10 text-vfes-dark">{tt(c.action)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Closed loop: IMEI + bank signal → score → auto-block → notify customer + bank.')}<ChevronRight className="w-3 h-3" />
            </div>
            <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          </div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('SIM-swap detections — 12-month trend (count)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={FRAUD_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="simSwap" stroke={RED} fill={RED} fillOpacity={0.3} name={tt('SIM swap detections')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-vfes-dark/55">{tt('Spike from Jun correlates with phishing campaign — step-up auth deployed as countermeasure.')}</span>
              <Link to="/portal/horizon" className="font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            </div>
          </Panel>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Bank API integrations')} value="12"    delta={tt('notified on block')}    trend="flat" icon={Activity}    />
          <KpiCard label={tt('Step-up SMS sent')}      value="148"   delta={tt('verified 98%')}         trend="up"   icon={Phone}       />
          <KpiCard label={tt('ML model version')}      value="v4.2"  delta={tt('deployed 8 Jun')}       trend="flat" icon={Zap}         />
          <KpiCard label={tt('Score threshold')}       value="70"    delta={tt('FP 0.6% at threshold')} trend="flat" icon={ShieldAlert} />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </>)}

      {tab === 'irsf-wangiri' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('IRSF loss (month)')}     value="BSD 192K"  delta={tt('-24% MoM')}            trend="up"   icon={TrendingDown} accent />
          <KpiCard label={tt('Hot-list destinations')} value="6"      delta={tt('auto-throttled')}       trend="flat" icon={Globe}        />
          <KpiCard label={tt('Wangiri attempts (mo)')} value="5,640"  delta={tt('+13% MoM in attempts')} trend="down" icon={Phone}        />
          <KpiCard label={tt('Wangiri suppression')}   value="96%"    delta={tt('+5 pp MoM')}            trend="up"   icon={ShieldAlert}  />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort IRSF by:')}</span>
          {(['loss', 'calls'] as const).map(k => (
            <button key={k} onClick={() => setIrsfSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${irsfSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'loss' ? tt('Loss BSD K') : tt('Call volume')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('IRSF — top premium-rate destinations')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sortedIrsf} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="country" stroke="#999" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} calls · BSD ${p.payload.lossK}K loss`, tt('IRSF')]} />
                  <Bar dataKey="calls" radius={[0, 4, 4, 0]}>
                    {sortedIrsf.map((_, i) => <Cell key={i} fill={i < 2 ? RED : AMBER} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Top 3 ranges auto-throttled; hot-list synced to billing in near real-time.')}</div>
          </Panel>

          <Panel title={tt('IRSF weekly loss vs prevented (BSD K)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={IRSF_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="w" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="loss"    stroke={RED}   fill={RED}   fillOpacity={0.2} name={tt('Net loss BSD K')} />
                  <Area type="monotone" dataKey="blocked" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Prevented BSD K')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Wangiri suppression — monthly trend (attempts vs suppressed)')}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={WANGIRI_TREND}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="attempts"   fill={AMBER} name={tt('Attempts')}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="suppressed" fill={GREEN} name={tt('Suppressed')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Signaling firewall blocks Wangiri rings in < 2s — no revenue leakage to premium range.')}
            </span>
            <Link to="/portal/network" className="font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          </div>
        </Panel>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={tt('Hotlist sync latency')}   value="< 2s"   delta={tt('to billing in real-time')} trend="up"   icon={Zap}         />
          <KpiCard label={tt('Premium ranges blocked')} value="2,840"  delta={tt('in IRSF blocklist')}       trend="flat" icon={Lock}         />
          <KpiCard label={tt('IRSF exposure (active)')} value="BSD 89K"   delta={tt('pending throttle')}        trend="down" icon={AlertTriangle}/>
          <KpiCard label={tt('Wangiri FW rules')}       value="14"     delta={tt('GSMA FS.37 rulesets')}     trend="flat" icon={ShieldAlert}  />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/network" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Network →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/roaming" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Roaming →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
        </div>
      </>)}

      {tab === 'subscription' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Sub fraud cases (30d)')} value="1,087" delta={tt('+8% MoM')}              trend="down" icon={FileText}   accent />
          <KpiCard label={tt('Prevented loss')}         value="BSD 124K" delta={tt('88% block rate')}       trend="up"   icon={Lock}      />
          <KpiCard label={tt('Identity theft cases')}   value="382"   delta={tt('top category')}         trend="down" icon={ShieldAlert}/>
          <KpiCard label={tt('Port hijack detected')}   value="128"   delta={tt('+21% MoM')}             trend="down" icon={Phone}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Subscription fraud — cases by type')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={SUB_FRAUD_TYPES} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#999" fontSize={11} />
                  <YAxis type="category" dataKey="type" stroke="#999" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} cases · BSD ${p.payload.lossK}K exposure`, tt('Fraud type')]} />
                  <Bar dataKey="cases" radius={[0, 4, 4, 0]}>
                    {SUB_FRAUD_TYPES.map((_, i) => <Cell key={i} fill={i === 0 ? RED : i === 1 ? AMBER : BLUE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Subscription fraud — detected vs prevented (monthly)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={SUB_FRAUD_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cases"     stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('Detected')} />
                  <Area type="monotone" dataKey="prevented" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Prevented')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Subscription fraud — regional breakdown (detected cases by CCAA)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={FRAUD_BY_REGION}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="subscription" fill={PURPLE} radius={[4, 4, 0, 0]} name={tt('Subscription fraud cases')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Identity theft concentrated in high-digital-adoption urban areas. Rural cases mainly credit abuse.')}</div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/rbac"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('RBAC Controls →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </>)}

      {tab === 'signaling' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SS7 Cat-2 blocked (30d)')}  value="12,840" delta={tt('location queries')}    trend="flat" icon={ShieldAlert} accent />
          <KpiCard label={tt('SS7 Cat-3 blocked')}         value="3,420"  delta={tt('intercept attempts')}  trend="flat" icon={Lock}        />
          <KpiCard label={tt('Diameter spoofing blocked')} value="1,860"  delta={tt('IDR/IDA vectors')}     trend="flat" icon={Globe}       />
          <KpiCard label={tt('A2P grey-route blocked')}    value="28.4K"  delta={tt('SMS spam')}            trend="flat" icon={Phone}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Signaling firewall — blocked vectors (30d)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Attack vector')}</th>
                    <th className="px-3 py-2 text-right">{tt('Blocked')}</th>
                    <th className="px-3 py-2">{tt('Risk')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SIGNALING.map(s => (
                    <tr key={s.vector} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 text-xs">{tt(s.vector)}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.blocked.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskColor(s.risk)}`}>{tt(s.risk)}</span></td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sigColor(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('GSMA FS.11 / FS.19 rulesets applied; GTP-C under enhanced monitoring.')}</span>
              <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('SS7 / Diameter attack trend — 6 months')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={SS7_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cat2"     stroke={RED}   fill={RED}   fillOpacity={0.2} name={tt('SS7 Cat-2')} />
                  <Area type="monotone" dataKey="cat3"     stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('SS7 Cat-3')} />
                  <Area type="monotone" dataKey="diameter" stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('Diameter')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Volume rising YoY — firewall rules updated monthly from GSMA threat intelligence feed.')}</div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Anti-fraud protection stack — deployed countermeasures')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Method')}</th>
                    <th className="px-3 py-2">{tt('Coverage')}</th>
                    <th className="px-3 py-2 text-right">{tt('Latency')}</th>
                    <th className="px-3 py-2 text-right">{tt('Precision')}</th>
                    <th className="px-3 py-2">{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PROTECTION_METHODS.map(m => (
                    <tr key={m.method} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(m.method)}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/65">{tt(m.coverage)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{m.latency}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{m.precision}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.deployed ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {m.deployed ? tt('Live') : tt('In trial')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />{tt('GNN for subscription rings in trial — graduates to production on 0.90 precision threshold.')}
              </div>
              <Link to="/portal/ai-insights" className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/roaming"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Roaming Security →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/ciso"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('CISO Dashboard →')}</Link>
        </div>
      </>)}

      {tab === 'cases' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Open cases')}       value="4"     delta={tt('2 critical')}          trend="down" icon={Siren}        accent />
          <KpiCard label={tt('Resolved (30d)')}   value="284"   delta={tt('avg 3.2h TTR')}         trend="up"   icon={Activity}    />
          <KpiCard label={tt('Avg loss / case')}  value="BSD 8.4K" delta={tt('-12% MoM')}             trend="up"   icon={TrendingDown}/>
          <KpiCard label={tt('Escalated cases')}  value="12"    delta={tt('to legal / LEA')}       trend="flat" icon={AlertTriangle}/>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Status filter:')}</span>
          {['all', 'Open', 'Review', 'Resolved'].map(s => (
            <button key={s} onClick={() => setCaseStatus(s)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${caseStatus === s ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(s)}
            </button>
          ))}
        </div>

        <Panel title={tt('Fraud case management queue')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Case ID')}</th>
                  <th className="px-3 py-2">{tt('Type')}</th>
                  <th className="px-3 py-2">{tt('Priority')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                  <th className="px-3 py-2">{tt('Assigned')}</th>
                  <th className="px-3 py-2 text-right">{tt('Loss BSD K')}</th>
                  <th className="px-3 py-2 text-right">{tt('Age (d)')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => (
                  <tr key={c.id} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                    <td className="px-3 py-2 text-xs">{tt(c.type)}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priCol(c.priority)}`}>{tt(c.priority)}</span></td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${caseCol(c.status)}`}>{tt(c.status)}</span></td>
                    <td className="px-3 py-2 text-xs text-vfes-dark/70">{c.assigned}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{c.lossK}</td>
                    <td className={`px-3 py-2 text-right font-mono ${c.age > 10 ? 'text-amber-600 font-bold' : ''}`}>{c.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />{tt('Cases auto-opened from ML detections — evidence pre-attached for analyst review.')}
            </div>
            <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Incidents →')}</Link>
          </div>
        </Panel>

        <div className="mt-4">
          <Panel title={tt('Case resolution time by fraud type — avg vs P95 (hours)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={CASE_RES_TIMES}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="type" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgHrs" fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Avg hours')} />
                  <Bar dataKey="p95"    fill={AMBER} radius={[4, 4, 0, 0]} name={tt('P95 hours')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('SIM-swap cases close fastest (avg 2.4h) due to automated bank notification flow.')}</div>
          </Panel>
        </div>
        <div className="mt-4">
          <Panel title={tt('Case aging analysis — open cases by days outstanding')}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  { bucket: '< 1d', open: 8, critical: 2 }, { bucket: '1-3d', open: 6, critical: 2 },
                  { bucket: '3-7d', open: 4, critical: 1 }, { bucket: '7-14d', open: 3, critical: 0 },
                  { bucket: '> 14d', open: 2, critical: 0 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="open"     fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('All open')} />
                  <Bar dataKey="critical" fill={RED}   radius={[4, 4, 0, 0]} name={tt('Critical')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('SLA: Critical cases must be resolved within 4h. Escalate any critical case > 1d to fraud lead.')}</span>
              <Link to="/portal/incidents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Incidents →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'blocklist' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total blocklist entries')} value="166.7K" delta={tt('+6.5K MoM')}        trend="flat" icon={Lock}      accent />
          <KpiCard label={tt('Wangiri numbers')}         value="94.2K"  delta={tt('auto-updated')}     trend="flat" icon={Phone}     />
          <KpiCard label={tt('MSISDN blocks')}           value="48.4K"  delta={tt('ML auto-block')}    trend="up"   icon={ShieldAlert}/>
          <KpiCard label={tt('Avg effectiveness')}       value="95.6%"  delta={tt('across all lists')} trend="up"   icon={Activity}  />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Blocklist entries by type — 30-day activity')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Type')}</th>
                    <th className="px-3 py-2 text-right">{tt('Entries')}</th>
                    <th className="px-3 py-2 text-right">{tt('Added 30d')}</th>
                    <th className="px-3 py-2">{tt('Source')}</th>
                    <th className="px-3 py-2 text-right">{tt('Effectiveness %')}</th>
                  </tr>
                </thead>
                <tbody>
                  {BLOCKLIST_ENTRIES.map(b => (
                    <tr key={b.type} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2 font-semibold text-xs">{tt(b.type)}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.entries.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">+{b.added30d.toLocaleString('en-BS')}</td>
                      <td className="px-3 py-2 text-xs text-vfes-dark/60">{tt(b.source)}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-600">{b.effectiveness}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Blocklist growth trend — 6 months (MSISDN · IMEI · IP)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={BLOCKLIST_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="msisdn" stroke={RED}   fill={RED}   fillOpacity={0.2} name={tt('MSISDN')} />
                  <Area type="monotone" dataKey="imei"   stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('IMEI')} />
                  <Area type="monotone" dataKey="ip"     stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('IP/ASN')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Blocklist effectiveness — false positive rate trend (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={[
                  { m: 'Jan', fpRate: 1.8, coverage: 94, autoAdd: 82 },
                  { m: 'Feb', fpRate: 1.6, coverage: 95, autoAdd: 84 },
                  { m: 'Mar', fpRate: 1.4, coverage: 95, autoAdd: 86 },
                  { m: 'Apr', fpRate: 1.2, coverage: 96, autoAdd: 88 },
                  { m: 'May', fpRate: 1.0, coverage: 96, autoAdd: 90 },
                  { m: 'Jun', fpRate: 0.8, coverage: 97, autoAdd: 92 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="fpRate"   stroke={RED}   strokeWidth={2} dot name={tt('False positive %')} />
                  <Line type="monotone" dataKey="coverage" stroke={GREEN} strokeWidth={2} dot name={tt('Coverage %')} />
                  <Line type="monotone" dataKey="autoAdd"  stroke={BLUE}  strokeWidth={2} strokeDasharray="4 4" dot={false} name={tt('Auto-add %')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-vfes-dark font-bold flex items-center gap-1">
                <Brain className="w-3 h-3" />{tt('FP rate down to 0.8% — ML-tuned expiry prevents stale entries blocking legitimate customers.')}
              </div>
              <Link to="/portal/customer-360" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/trust-center" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Trust Centre →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/rbac"         className="text-xs font-bold text-vfes-dark hover:underline">{tt('RBAC Controls →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/horizon"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </>)}

      {tab === 'pl-analysis' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Gross fraud loss (YTD)')} value="BSD 1.84M" delta={tt('-22% vs prior year')}  trend="up"   icon={TrendingDown}  accent />
          <KpiCard label={tt('Prevented loss (YTD)')}   value="BSD 1.24M" delta={tt('67% recovery rate')}   trend="up"   icon={Lock}          />
          <KpiCard label={tt('Net fraud loss (YTD)')}   value="BSD 600K"  delta={tt('-18% vs prior year')}  trend="up"   icon={Activity}      />
          <KpiCard label={tt('Prevention ROI')}         value="14.8×"  delta={tt('BSD 1 spent → BSD 14.8 saved')} trend="up" icon={AlertTriangle}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title={tt('Fraud P&L — gross loss · prevented · net (BSD K/month)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={PL_TREND}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="grossLoss" fill={RED}   radius={[4, 4, 0, 0]} name={tt('Gross loss BSD K')} />
                  <Bar dataKey="prevented" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Prevented BSD K')} />
                  <Bar dataKey="netLoss"   fill={AMBER} radius={[4, 4, 0, 0]} name={tt('Net loss BSD K')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Prevention rate improves each month as ML models re-train on new fraud patterns.')}</div>
          </Panel>

          <Panel title={tt('Fraud loss by category — stacked monthly breakdown (BSD K)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={LOSS_BY_CAT}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="irsf"         stackId="1" stroke={RED}    fill={RED}    fillOpacity={0.5} name={tt('IRSF')} />
                  <Area type="monotone" dataKey="simSwap"      stackId="1" stroke={AMBER}  fill={AMBER}  fillOpacity={0.5} name={tt('SIM swap')} />
                  <Area type="monotone" dataKey="subscription" stackId="1" stroke={PURPLE} fill={PURPLE} fillOpacity={0.5} name={tt('Subscription')} />
                  <Area type="monotone" dataKey="wangiri"      stackId="1" stroke={NAVY}   fill={NAVY}   fillOpacity={0.5} name={tt('Wangiri')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title={tt('Fraud P&L — cost of prevention vs saved loss (BSD K/month)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={[
                  { m: 'Jan', preventCost: 12.4, savedLoss: 142, netBenefit: 129.6 },
                  { m: 'Feb', preventCost: 13.2, savedLoss: 168, netBenefit: 154.8 },
                  { m: 'Mar', preventCost: 13.8, savedLoss: 182, netBenefit: 168.2 },
                  { m: 'Apr', preventCost: 13.4, savedLoss: 174, netBenefit: 160.6 },
                  { m: 'May', preventCost: 14.2, savedLoss: 192, netBenefit: 177.8 },
                  { m: 'Jun', preventCost: 14.8, savedLoss: 204, netBenefit: 189.2 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="preventCost" stroke={RED}   strokeWidth={2} dot name={tt('Prevention cost BSD K')} />
                  <Line type="monotone" dataKey="savedLoss"   stroke={GREEN} strokeWidth={2} dot name={tt('Loss saved BSD K')} />
                  <Line type="monotone" dataKey="netBenefit"  stroke={BLUE}  strokeWidth={2} strokeDasharray="4 4" dot={false} name={tt('Net benefit BSD K')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-vfes-dark/55">{tt('ROI improving MoM — ML retraining cycles and blocklist tuning lower false positives while blocking more fraud.')}</span>
              <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/portal/billing-charging" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Billing & Charging →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/urca-pack"        className="text-xs font-bold text-vfes-dark hover:underline">{tt('URCA Regulator Pack →')}</Link>
          <span className="text-vfes-dark/30">·</span>
          <Link to="/portal/ai-insights"      className="text-xs font-bold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
        </div>
      </>)}

      <AskTheData />
    </div>
  )
}
