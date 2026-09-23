import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from 'recharts'
import { Wallet, AlertTriangle, TrendingUp, Sparkles, Smartphone, Database, Server, Zap } from 'lucide-react'
import { MOBILE_COST } from './_mobile_data'

const BLUE = '#FF4438', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'

const COST_TABS = ['Credits', 'Storage', 'Cortex AI', 'Budgets', 'Anomalies', 'Chargeback', 'Forecast', 'Optimization'] as const
type CostTab = typeof COST_TABS[number]

const KPIS = [
  { l: 'Credits MTD',          v: '55,200', sub: 'BSD 105.0K · ↑ 4.2% vs prev mo' },
  { l: 'Forecast EOM',          v: '56,400', sub: 'BSD 107.2K · within budget BSD 110K' },
  { l: 'Storage cost MTD',      v: 'BSD 11.4K',  sub: '7.4 TB active · 2.1 TB time-travel' },
  { l: 'Cortex AI cost MTD',    v: 'BSD 8,420',  sub: '4.6M calls · 14.2M tokens' },
  { l: 'Anomalies open',        v: '3',       sub: '1 H · 2 M', tone: 'amber' },
  { l: 'Idle warehouses 7d',    v: '2',       sub: 'WH_AD_HOC_S · WH_PORTAL_XS', tone: 'amber' },
]

const DAILY = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  ingest:    410 + Math.sin(i / 3) * 40,
  transform: 540 + Math.cos(i / 4) * 60,
  bi:        280 + Math.sin(i / 2) * 30,
  cortex:    240 + i * 4,
  ml:        180 + Math.sin(i / 5) * 25,
}))

const TOP_QUERIES = [
  { id: 'q01ab9', user: 'pbi_service',   wh: 'WH_BI_M',        cred: 142, sec: 480,  txt: 'SELECT … FROM CUSTOMER_360 GROUP BY REGION, BUNDLE …' },
  { id: 'q01ac1', user: 'sc_agent',      wh: 'WH_CORTEX_L',    cred: 98,  sec: 312,  txt: 'CORTEX.SEARCH_PREVIEW(\'KB_CUSTOMER_KB\', …)' },
  { id: 'q01ad4', user: 'pieter.claes',   wh: 'WH_AD_HOC_S',    cred: 84,  sec: 252,  txt: 'SELECT * FROM RAW.NETWORK.CMTS_EVENTS WHERE EVENT_TS …' },
  { id: 'q01ae8', user: 'dbt_runner',    wh: 'WH_TRANSFORM_L', cred: 78,  sec: 642,  txt: 'CREATE OR REPLACE TABLE FACT_NETWORK_KPI AS …' },
  { id: 'q01af2', user: 'sc_agent',      wh: 'WH_CORTEX_L',    cred: 64,  sec: 198,  txt: 'AI_COMPLETE(\'claude-3-5-sonnet\', …)' },
  { id: 'q01ag6', user: 'leen.jacobs',   wh: 'WH_ML_GPU_M',    cred: 52,  sec: 1840, txt: 'snowpark.ml.train xgb_v3 over 1.04M rows' },
  { id: 'q01ah0', user: 'pbi_service',   wh: 'WH_BI_M',        cred: 46,  sec: 168,  txt: 'SELECT … FROM B2B_360 …' },
  { id: 'q01ai3', user: 'reverse_etl',   wh: 'WH_AD_HOC_S',    cred: 38,  sec: 92,   txt: 'COPY INTO @s3_crm/churn_today FROM CHURN_LIST_DAILY' },
]

const ANOMALIES = [
  { sev: 'H', wh: 'WH_TRANSFORM_L', metric: 'credits', delta: '+38% vs 14d avg', cause: 'dbt full refresh — should have been incremental on FACT_BILLING' },
  { sev: 'M', wh: 'WH_CORTEX_L',    metric: 'tokens',  delta: '+22% vs 14d avg', cause: 'CHURN_AGENT system prompt grew 1.4K tokens last deploy' },
  { sev: 'M', wh: 'WH_AD_HOC_S',    metric: 'idle',    delta: '0 queries 6 days', cause: 'leftover dev warehouse — recommend SUSPEND + DROP after 7d' },
]

const OPS = [
  { rec: 'Move WH_BI_M to Gen-2', impact: 'BSD 14.2K / yr', conf: 'high' },
  { rec: 'Convert FACT_BILLING dbt model to incremental', impact: 'BSD 21.4K / yr', conf: 'high' },
  { rec: 'Right-size WH_CORTEX_L to M (avg load 38%)', impact: 'BSD 8.6K / yr', conf: 'medium' },
  { rec: 'Add resource monitor on WH_ML_GPU_M @ 4K credits/mo', impact: 'guardrail', conf: 'high' },
  { rec: 'Apply Storage Lifecycle COOL on RAW.NETWORK.CMTS_EVENTS_HISTORY', impact: 'BSD 4.2K / yr', conf: 'medium' },
  { rec: 'Drop unused materialized view MV_CUST_SEGMENT_LEGACY', impact: 'BSD 1.8K / yr', conf: 'high' },
]

const BY_DOMAIN = [
  { d: 'Customer 360',  c: 8612 },
  { d: 'Network',       c: 7240 },
  { d: 'Finance',       c: 4180 },
  { d: 'B2B',           c: 3420 },
  { d: 'Cortex AI',     c: 4360 },
  { d: 'ML training',   c: 3140 },
  { d: 'Reverse-ETL',   c: 1640 },
  { d: 'Portal / SiS',  c: 1820 },
  { d: 'Ad-hoc',        c: 4000 },
]

const CREDIT_DAILY_TEAM = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  dataeng:  320 + Math.round(Math.sin(i / 4)  * 40),
  bi:       280 + Math.round(Math.cos(i / 3)  * 30),
  cortex:   240 + i * 4,
  ml:       180 + Math.round(Math.sin(i / 5)  * 25),
  platform: 120 + Math.round(Math.cos(i / 6)  * 15),
}))

const STORAGE_BY_DB = [
  { db: 'CBL_CORE',       active_tb: 3.4,  tt_tb: 0.8,  failsafe_tb: 0.4 },
  { db: 'CBL_RAW',        active_tb: 1.8,  tt_tb: 0.4,  failsafe_tb: 0.2 },
  { db: 'CBL_ML',         active_tb: 0.9,  tt_tb: 0.2,  failsafe_tb: 0.1 },
  { db: 'CBL_GOVERNANCE', active_tb: 0.2,  tt_tb: 0.05, failsafe_tb: 0.02 },
  { db: 'CBL_AGENTS',     active_tb: 0.4,  tt_tb: 0.1,  failsafe_tb: 0.05 },
  { db: 'CBL_APPS',       active_tb: 0.1,  tt_tb: 0.02, failsafe_tb: 0.01 },
]

const CORTEX_AI_USAGE = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  analyst_calls: 1200 + Math.round(Math.sin(i / 4) * 200 + i * 20),
  complete_calls: 820  + Math.round(Math.cos(i / 5) * 120 + i * 10),
  search_calls:  2400  + Math.round(Math.sin(i / 3) * 300),
}))

const BUDGET_STATUS = [
  { name: 'ACCOUNT_QUOTA',   used: 38412, limit: 60000, pct: 64.0, alert_pct: 90 },
  { name: 'INGEST_BUDGET',   used: 9824,  limit: 15000, pct: 65.5, alert_pct: 85 },
  { name: 'CORTEX_AI_CAP',   used: 4360,  limit: 6000,  pct: 72.7, alert_pct: 80 },
  { name: 'ML_GPU_GUARD',    used: 1140,  limit: 2000,  pct: 57.0, alert_pct: 90 },
  { name: 'ADHOC_GOVERN',    used: 4012,  limit: 4500,  pct: 89.2, alert_pct: 85 },
  { name: 'BI_TEAM_BUDGET',  used: 5840,  limit: 8000,  pct: 73.0, alert_pct: 85 },
]

const FORECAST_DATA = Array.from({ length: 12 }, (_, i) => ({
  m: `M-${11 - i}`,
  actual:   i < 5 ? null : 52000 + i * 800 + Math.round(Math.sin(i / 3) * 2000),
  forecast: 52000 + i * 800 + Math.round(Math.cos(i / 4) * 1500),
  budget:   56000,
})).reverse()

const CHARGEBACK_TREND = Array.from({ length: 6 }, (_, i) => ({
  m: `M-${5 - i}`,
  customer360: 8200 + i * 120,
  network:     7100 + Math.round(Math.sin(i) * 200),
  finance:     4000 + i * 60,
  b2b:         3300 + Math.round(Math.cos(i) * 150),
  cortex_ai:   4100 + i * 80,
  ml:          3000 + i * 50,
}))

const OPS_IMPACT = [
  { rec: 'Move WH_BI_M to Gen-2',                           impact_eur: 14200, conf: 'high',   effort: 'low' },
  { rec: 'Convert FACT_BILLING dbt model to incremental',   impact_eur: 21400, conf: 'high',   effort: 'med' },
  { rec: 'Right-size WH_CORTEX_L to M (avg load 38%)',      impact_eur: 8600,  conf: 'medium', effort: 'low' },
  { rec: 'Storage Lifecycle COOL on RAW.NETWORK.CMTS_HISTORY', impact_eur: 4200, conf: 'medium', effort: 'low' },
  { rec: 'Drop unused MV_CUST_SEGMENT_LEGACY',              impact_eur: 1800,  conf: 'high',   effort: 'low' },
  { rec: 'Add resource monitor on WH_ML_GPU_M @ 4K/mo',     impact_eur: 0,     conf: 'high',   effort: 'low' },
]

const STORAGE_TREND = Array.from({ length: 6 }, (_, i) => ({
  m: `M-${5 - i}`,
  active: 6.2 + i * 0.2,
  tt:     1.8 + i * 0.05,
  stage:  0.4 + i * 0.02,
}))

export default function CostIntelligencePage() {
  const [tab, setTab] = useState<CostTab>('Credits')
  const [credTeamFilter, setCredTeamFilter] = useState('all')
  const [storageDb, setStorageDb] = useState('all')
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'warn'>('all')
  const [anomalyOpen, setAnomalyOpen] = useState(true)
  const [forecastMode, setForecastMode] = useState<'month' | 'quarter'>('month')
  const [chargebackTeam, setChargebackTeam] = useState('all')

  const filteredBudgets = useMemo(() =>
    budgetFilter === 'warn'
      ? BUDGET_STATUS.filter(b => b.pct >= b.alert_pct)
      : BUDGET_STATUS
  , [budgetFilter])

  const totalCredits = useMemo(() =>
    KPIS.find(k => k.l === 'Credits MTD')?.v ?? '55,200'
  , [])

  const storageTotal = useMemo(() =>
    STORAGE_BY_DB.reduce((s, d) => s + d.active_tb + d.tt_tb + d.failsafe_tb, 0).toFixed(1)
  , [])

  const chargebackData = useMemo(() =>
    CHARGEBACK_TREND[CHARGEBACK_TREND.length - 1]
  , [])

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title={tt('Cost intelligence')}
        subtitle={tt('credits · storage · Cortex AI · anomalies · budgets · chargeback · forecast · ACCOUNT_USAGE · refreshed hourly')}
      />

      {/* KPI row 1 */}
      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label={tt('Credits MTD')}
          value="55,200"
          delta={tt('BSD 105.0K · ↑ 4.2% vs prev mo')}
          trend="down"
          icon={Wallet}
        />
        <KpiCard
          label={tt('Forecast EOM')}
          value="56,400"
          delta={tt('BSD 107.2K · within budget')}
          trend="up"
          icon={TrendingUp}
        />
        <KpiCard
          label={tt('Storage cost MTD')}
          value="BSD 11.4K"
          delta={tt('7.4 TB active · 2.1 TB TT')}
          trend="up"
          icon={Database}
        />
        <KpiCard
          label={tt('Cortex AI cost MTD')}
          value="BSD 8,420"
          delta={tt('4.6M calls · 14.2M tokens')}
          trend="down"
          icon={Zap}
        />
        <KpiCard
          label={tt('Anomalies open')}
          value="3"
          delta={tt('1H · 2M')}
          accent
          icon={AlertTriangle}
        />
        <KpiCard
          label={tt('Idle warehouses 7d')}
          value="2"
          delta={tt('WH_AD_HOC_S · WH_PORTAL_XS')}
          accent
          icon={Server}
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-6 gap-4">
        <KpiCard
          label={tt('Potential savings / yr')}
          value="BSD 50.2K"
          delta={tt('6 optimizations available')}
          trend="up"
          icon={Sparkles}
        />
        <KpiCard
          label={tt('Budget utilization')}
          value="64%"
          delta={tt('BSD 38.4K / BSD 60K account quota')}
          trend="up"
          icon={Wallet}
        />
        <KpiCard
          label={tt('Top team spend MTD')}
          value="C360"
          delta={tt('8,612 credits · BSD 16.4K')}
          trend="down"
        />
        <KpiCard
          label={tt('ML GPU credits MTD')}
          value="1,140"
          delta={tt('57% of 2K cap · under guard')}
          trend="up"
          icon={Server}
        />
        <KpiCard
          label={tt('Storage efficiency')}
          value={`${storageTotal} TB`}
          delta={tt('7.4 TB active · lifecycle OK')}
          trend="up"
          icon={Database}
        />
        <KpiCard
          label={tt('Active resource monitors')}
          value="5"
          delta={tt('1 near limit · ADHOC_GOVERN 89%')}
          accent
        />
      </div>

      {/* Cost health summary */}
      <Panel title={tt('Snowflake cost health · Cable Bahamas platform · current month')}>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">{tt('Budget status')}</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">UNDER</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{tt('56.4K vs 60K quota · 94%')}</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{tt('Open anomalies')}</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">3</div>
            <div className="text-[10px] text-amber-600 mt-0.5">{tt('1 HIGH · 2 MED · all warehouse-related')}</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-sky-700 font-bold">{tt('Savings identified')}</div>
            <div className="text-2xl font-extrabold text-sky-700 mt-1">BSD 50.2K</div>
            <div className="text-[10px] text-sky-600 mt-0.5">{tt('6 actions · 2 quick wins confirmed')}</div>
          </div>
          <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">{tt('MoM credit growth')}</div>
            <div className="text-2xl font-extrabold text-violet-700 mt-1">+4.2%</div>
            <div className="text-[10px] text-violet-600 mt-0.5">{tt('Cortex AI driving incremental growth')}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-black/5 pt-3">
          {[
            { l: tt('Compute MTD'),  v: '55,200 credits', sub: tt('BSD 105K · 7 warehouses') },
            { l: tt('Storage MTD'), v: 'BSD 11.4K',          sub: tt('7.4 TB active · lifecycle active') },
            { l: tt('Cortex AI MTD'), v: 'BSD 8,420',        sub: tt('4.6M API calls · 14.2M tokens') },
            { l: tt('Total platform cost MTD'), v: 'BSD 124.8K', sub: tt('within BSD 135K monthly target') },
          ].map(s => (
            <div key={s.l} className="bg-zinc-50 rounded-lg p-2.5">
              <div className="text-[9px] uppercase tracking-widest text-vfes-dark/45 font-bold">{s.l}</div>
              <div className="text-[13px] font-bold mt-0.5">{s.v}</div>
              <div className="text-[9px] text-vfes-dark/55">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-3 border-t border-black/5 pt-3 text-[11px]">
          <span className="text-vfes-dark/50">{tt('Quick links:')}</span>
          <Link to="/portal/observability" className="text-vfes-dark font-semibold hover:underline">{tt('Observability')}</Link>
          <Link to="/portal/data-products" className="text-vfes-dark font-semibold hover:underline">{tt('Data products')}</Link>
          <Link to="/portal/data-quality"  className="text-vfes-dark font-semibold hover:underline">{tt('Data quality')}</Link>
        </div>
      </Panel>

      {/* ML Insight */}
      <MlInsightSection
        heading="Cost anomaly detection"
        models={[
          { name: 'CREDIT_ANOMALY_V2',     metric: '96.8%', sub: 'precision · rolling 14d baseline' },
          { name: 'COST_FORECAST_MODEL',   metric: '±2.1K', sub: 'EOM credit forecast · SARIMA + XGB' },
          { name: 'IDLE_DETECT_CLASSIFIER', metric: '0.92',  sub: 'F1 · detects idle WH / MV / tables' },
        ]}
        agentLabel="Run cost anomaly scan"
        agentSteps={[
          'Query ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY last 14d',
          'Score each warehouse against CREDIT_ANOMALY_V2',
          'Forecast EOM credits via COST_FORECAST_MODEL',
          'Identify idle resources with IDLE_DETECT_CLASSIFIER',
          'Generate ranked optimization recommendations with estimated savings',
        ]}
        agentBlurb="Cortex Analyst + Snowflake ML models detect credit anomalies, forecast month-end spend, and identify idle resources to surface actionable savings backed by ACCOUNT_USAGE."
        decision={{
          title:     'FACT_BILLING dbt full-refresh anomaly · BSD 21.4K/yr optimization',
          detail:    'WH_TRANSFORM_L used 38% more credits than 14d average this week. Root cause: FACT_BILLING dbt model ran as full refresh instead of incremental — 48 GB scanned vs expected 1.2 GB. Converting to incremental saves ~BSD 21.4K/yr.',
          impact:    '21.4K BSD / year savings · Gen-2 WH migration adds 14.2K BSD',
          risk:      'Incremental refactor requires dbt contract test update',
          linkTo:    '/portal/data-engineering',
          linkLabel: 'Open data engineering',
        }}
        chart={{
          kind:  'bar',
          title: 'Credit anomaly score by warehouse · current week',
          data: [
            { wh: 'WH_TRANSFORM_L', score: 0.82 }, { wh: 'WH_CORTEX_L',    score: 0.54 },
            { wh: 'WH_BI_M',        score: 0.24 }, { wh: 'WH_ML_GPU_M',    score: 0.38 },
            { wh: 'WH_AD_HOC_S',    score: 0.71 }, { wh: 'WH_INGEST_S',    score: 0.18 },
            { wh: 'WH_PORTAL_XS',   score: 0.68 },
          ],
          xKey: 'wh',
          series: [{ key: 'score', name: 'Anomaly score', color: AMBER }],
          colorBy: { key: 'score', high: 0.7, mid: 0.4 },
          note: 'Score > 0.7 = anomaly alert. WH_TRANSFORM_L and WH_AD_HOC_S flagged this week.',
        }}
      />

      {/* 8-pill tab bar */}
      <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {COST_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
              tab === t ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/60 hover:bg-black/5'
            }`}
          >
            {tt(t)}
          </button>
        ))}
      </div>

      {/* ─── Tab: Credits ────────────────────────────────────── */}
      {tab === 'Credits' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Team:')}</span>
          {['all', 'dataeng', 'bi', 'cortex', 'ml', 'platform'].map(v => (
            <button
              key={v}
              onClick={() => setCredTeamFilter(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${credTeamFilter === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Panel title={tt('Credit consumption · 30 days · stacked by team')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={CREDIT_DAILY_TEAM}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="dataeng"  stackId="a" fill={BLUE}    name={tt('Data eng')} />
                  <Bar dataKey="bi"       stackId="a" fill={AMBER}   name={tt('BI')} />
                  <Bar dataKey="cortex"   stackId="a" fill="#dc2626" name={tt('Cortex AI')} />
                  <Bar dataKey="ml"       stackId="a" fill={GREEN}   name={tt('ML')} />
                  <Bar dataKey="platform" stackId="a" fill={SLATE}   name={tt('Platform')} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title={tt('Top queries by credits — last 24h')}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Query ID')}</th>
                    <th className="text-left">{tt('User')}</th>
                    <th className="text-left">{tt('Warehouse')}</th>
                    <th className="text-right">{tt('Credits')}</th>
                    <th className="text-right">{tt('Sec')}</th>
                    <th className="text-left">{tt('Text')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_QUERIES.map((q) => (
                    <tr key={q.id} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-vfes-dark text-[11px]">{q.id}</td>
                      <td className="font-mono text-[11px]">{q.user}</td>
                      <td className="font-mono text-[11px] text-vfes-dark/70">{q.wh}</td>
                      <td className="text-right font-mono font-bold">{q.cred}</td>
                      <td className="text-right font-mono text-vfes-dark/60">{q.sec}</td>
                      <td className="font-mono text-[10px] text-vfes-dark/70 truncate max-w-[400px]">{q.txt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <div className="col-span-4 space-y-4">
            <Panel title={tt('Chargeback by domain · MTD credits')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={BY_DOMAIN} layout="vertical" margin={{ left: 50 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="d" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="c" fill="#dc2626" name={tt('Credits')} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title={tt('Resource monitors')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Monitor')}</th>
                    <th className="text-right">{tt('Used')}</th>
                    <th className="text-right">{tt('%')}</th>
                  </tr>
                </thead>
                <tbody>
                  {BUDGET_STATUS.map((b) => {
                    const pct = b.pct
                    return (
                      <tr key={b.name} className="border-b border-black/5">
                        <td className="py-1.5 font-mono text-[11px]">{b.name}</td>
                        <td className="text-right font-mono">{b.used.toLocaleString()}</td>
                        <td className="text-right font-mono">
                          <span className={`font-bold ${pct > 85 ? 'text-rose-600' : pct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/observability"   className="text-vfes-dark font-semibold hover:underline">{tt('Observability · warehouse load')}</Link>
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/architecture"     className="text-vfes-dark font-semibold hover:underline">{tt('Architecture')}</Link>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Credit totals include compute (warehouse metering), Snowpipe streaming, serverless tasks, dynamic tables, Cortex AI functions, and SPCS compute pools. Storage costs billed separately at BSD 0.023/GB/month. Cortex AI charged per-token for AI Complete and per-query for Analyst and Search.')}
        </div>
        <Panel title={tt('Mobile / RAN workload spend · credits per domain')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Telemetry · ML · Cortex · Gov')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Workload')}</th>
                <th>{tt('Warehouse')}</th>
                <th>{tt('Credits / mo')}</th>
                <th>{tt('BSD  / mo')}</th>
                <th>{tt('Trend')}</th>
                <th>{tt('Owner')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_COST.map((w) => (
                <tr key={w.workload} className="border-t border-black/5">
                  <td className="py-2 font-semibold text-xs">{tt(w.workload)}</td>
                  <td className="font-mono text-xs text-vfes-dark/65">{w.warehouse}</td>
                  <td className="font-mono text-xs">{w.monthlyCreditsK.toFixed(2)}K</td>
                  <td className="font-mono text-xs font-bold">BSD {w.eurMonthly.toLocaleString()}</td>
                  <td className={`font-bold text-xs ${w.trend > 8 ? 'text-amber-600' : 'text-emerald-600'}`}>+{w.trend.toFixed(1)}%</td>
                  <td className="text-[11px]">{tt(w.owner)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-vfes-dark/20 font-bold">
                <td className="py-2">{tt('Total mobile workload')}</td>
                <td></td>
                <td className="font-mono text-xs">{MOBILE_COST.reduce((s, w) => s + w.monthlyCreditsK, 0).toFixed(2)}K</td>
                <td className="font-mono text-xs">BSD {MOBILE_COST.reduce((s, w) => s + w.eurMonthly, 0).toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('RAN telemetry pipeline is the largest mobile workload at BSD 5.5K/month. Cortex Agent · MNP win-back +12.4% trend — under review by Commercial owner.')}</div>
        </Panel>
        <Panel title={tt('Top queries by credits · last 24h')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Query ID')}</th>
                <th className="text-left">{tt('User')}</th>
                <th className="text-left">{tt('Warehouse')}</th>
                <th className="text-right">{tt('Credits')}</th>
                <th className="text-right">{tt('Sec')}</th>
                <th className="text-left">{tt('Text snippet')}</th>
              </tr>
            </thead>
            <tbody>
              {TOP_QUERIES.map((q) => (
                <tr key={q.id} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark text-[11px]">{q.id}</td>
                  <td className="font-mono text-[11px]">{q.user}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/70">{q.wh}</td>
                  <td className="text-right font-mono font-bold">{q.cred}</td>
                  <td className="text-right font-mono text-vfes-dark/60">{q.sec}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70 truncate max-w-[400px]">{q.txt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">
            {tt('Source: SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY · credits_used_cloud_services + credits_used_compute_credits · last 24h window.')}
          </div>
        </Panel>
        <Panel title={tt('Credit consumption · 30 days (ingest / transform / BI / Cortex / ML)')}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={DAILY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="ingest"    stackId="a" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} name={tt('Ingest')} />
              <Area type="monotone" dataKey="transform" stackId="a" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name={tt('Transform')} />
              <Area type="monotone" dataKey="bi"        stackId="a" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name={tt('BI')} />
              <Area type="monotone" dataKey="cortex"    stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} name={tt('Cortex AI')} />
              <Area type="monotone" dataKey="ml"        stackId="a" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name={tt('ML')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/observability"    className="text-vfes-dark font-semibold hover:underline">{tt('Observability · warehouse load')}</Link>
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/architecture"     className="text-vfes-dark font-semibold hover:underline">{tt('Architecture · Gen-2 migration')}</Link>
          <Link to="/portal/lineage"          className="text-vfes-dark font-semibold hover:underline">{tt('Lineage · upstream cost')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Storage ────────────────────────────────────── */}
      {tab === 'Storage' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Database:')}</span>
          {['all', 'CBL_CORE', 'CBL_RAW', 'CBL_ML'].map(v => (
            <button
              key={v}
              onClick={() => setStorageDb(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${storageDb === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={tt('Storage by database · active + TT + failsafe (TB)')}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Database')}</th>
                  <th className="text-right">{tt('Active TB')}</th>
                  <th className="text-right">{tt('Time-travel TB')}</th>
                  <th className="text-right">{tt('Failsafe TB')}</th>
                  <th className="text-right">{tt('Total TB')}</th>
                </tr>
              </thead>
              <tbody>
                {STORAGE_BY_DB
                  .filter(d => storageDb === 'all' || d.db === storageDb)
                  .map((d) => (
                  <tr key={d.db} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[11px] font-semibold">{d.db}</td>
                    <td className="text-right font-mono">{d.active_tb.toFixed(1)}</td>
                    <td className="text-right font-mono text-amber-600">{d.tt_tb.toFixed(2)}</td>
                    <td className="text-right font-mono text-zinc-400">{d.failsafe_tb.toFixed(2)}</td>
                    <td className="text-right font-mono font-bold">{(d.active_tb + d.tt_tb + d.failsafe_tb).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tt('Storage trend · 6 months · active / TT / stage')}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={STORAGE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" TB" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="active" stackId="a" stroke={BLUE}  fill={BLUE}  fillOpacity={0.3} name={tt('Active TB')} />
                <Area type="monotone" dataKey="tt"     stackId="a" stroke={AMBER} fill={AMBER} fillOpacity={0.4} name={tt('Time-travel TB')} />
                <Area type="monotone" dataKey="stage"  stackId="a" stroke={SLATE} fill={SLATE} fillOpacity={0.3} name={tt('Stage TB')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Total storage cost MTD')}</div>
            <div className="font-mono font-bold text-lg">BSD 11.4K</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('7.4 TB active · 2.1 TB time-travel · 0.6 TB failsafe')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Storage growth MoM')}</div>
            <div className="font-mono font-bold text-lg text-amber-600">+6.8%</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('Driven by RAN telemetry raw history')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Time-travel reduction opportunity')}</div>
            <div className="font-mono font-bold text-lg text-emerald-600">BSD 2.1K/mo</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('Apply COOL lifecycle to RAW history tables')}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/catalog"       className="text-vfes-dark font-semibold hover:underline">{tt('Catalog · table sizes')}</Link>
          <Link to="/portal/data-products" className="text-vfes-dark font-semibold hover:underline">{tt('Data products')}</Link>
          <Link to="/portal/lineage"       className="text-vfes-dark font-semibold hover:underline">{tt('Lineage · upstream cost')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Cortex AI ──────────────────────────────────── */}
      {tab === 'Cortex AI' && (<>
        <Panel title={tt('Cortex AI usage · 30d · analyst / complete / search calls')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={CORTEX_AI_USAGE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="analyst_calls"  stroke={BLUE}  strokeWidth={2} dot={false} name={tt('Analyst calls')} />
              <Line type="monotone" dataKey="complete_calls" stroke={GREEN} strokeWidth={2} dot={false} name={tt('Complete calls')} />
              <Line type="monotone" dataKey="search_calls"   stroke={AMBER} strokeWidth={2} dot={false} name={tt('Search calls')} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Cortex Analyst MTD')}</div>
            <div className="text-2xl font-extrabold mt-1">36.0K</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('avg 1,200 calls/day · ↑ 18% MoM')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('AI Complete tokens MTD')}</div>
            <div className="text-2xl font-extrabold mt-1">14.2M</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('claude-3-5-sonnet primary model')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Cortex Search queries MTD')}</div>
            <div className="text-2xl font-extrabold mt-1">72.0K</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('KB_CUSTOMER_KB primary index')}</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Cortex AI usage pulls from SNOWFLAKE.ACCOUNT_USAGE.CORTEX_FUNCTIONS_USAGE. Analyst calls billed per query at $0.15/1K tokens. AI Complete billed per million tokens by model (claude-3-5-sonnet: $3/M input, $15/M output). Search billed per 1K indexed tokens + $0.001 per query.')}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/agents"         className="text-vfes-dark font-semibold hover:underline">{tt('Cortex agents')}</Link>
          <Link to="/portal/semantic-views" className="text-vfes-dark font-semibold hover:underline">{tt('Semantic views')}</Link>
          <Link to="/portal/ai-insights"    className="text-vfes-dark font-semibold hover:underline">{tt('AI insights')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Budgets ────────────────────────────────────── */}
      {tab === 'Budgets' && (<>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-vfes-dark/55">{tt('Show:')}</span>
          {(['all', 'warn'] as const).map(v => (
            <button
              key={v}
              onClick={() => setBudgetFilter(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${budgetFilter === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {v === 'all' ? tt('All monitors') : tt('Near limit only')}
            </button>
          ))}
        </div>
        <Panel title={tt('Resource monitors · credit utilization')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Monitor')}</th>
                <th className="text-right">{tt('Used')}</th>
                <th className="text-right">{tt('Limit')}</th>
                <th className="text-right">{tt('Utilization')}</th>
                <th className="text-right">{tt('Alert at')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map((b) => (
                <tr key={b.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{b.name}</td>
                  <td className="text-right font-mono">{b.used.toLocaleString()}</td>
                  <td className="text-right font-mono">{b.limit.toLocaleString()}</td>
                  <td className="text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.pct > 85 ? 'bg-rose-500' : b.pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(b.pct, 100)}%` }}
                        />
                      </div>
                      <span className={`font-bold ${b.pct > 85 ? 'text-rose-600' : b.pct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {b.pct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right font-mono text-vfes-dark/55">{b.alert_pct}%</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${b.pct >= b.alert_pct ? 'bg-rose-100 text-rose-700' : b.pct > 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {b.pct >= b.alert_pct ? tt('WARN') : tt('OK')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Budget utilization · all resource monitors · visual')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={filteredBudgets} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="pct" name={tt('Utilization %')}>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Resource monitors suspend warehouses automatically at the credit limit to prevent runaway spend. ADHOC_GOVERN is at 89.2% utilization — 1 week at current burn rate will hit the limit. Recommend: increase limit to 5K or suspend WH_AD_HOC_S immediately.')}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/observability" className="text-vfes-dark font-semibold hover:underline">{tt('Observability · WH load')}</Link>
          <Link to="/portal/cio"           className="text-vfes-dark font-semibold hover:underline">{tt('CIO dashboard')}</Link>
        </div>
      </>)}
      {tab === 'Anomalies' && (<>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-vfes-dark/55">{tt('Open anomalies:')}</span>
          <span
            onClick={() => setAnomalyOpen(!anomalyOpen)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${anomalyOpen ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
          >
            {anomalyOpen ? tt('Open only') : tt('All')}
          </span>
          <span className="ml-auto text-[10px] text-vfes-dark/50">
            {tt('Anomaly engine: CREDIT_ANOMALY_V2 · rolling 14d baseline · updated hourly')}
          </span>
        </div>
        <div className="space-y-3">
          {ANOMALIES.map((a, i) => (
            <div key={i} className="border border-amber-200 bg-amber-50/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] font-bold">{a.wh}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${a.sev === 'H' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{a.sev}</span>
              </div>
              <div className="text-[12px] font-semibold">{a.metric} · <span className="font-bold text-amber-700">{a.delta}</span></div>
              <div className="text-[11px] text-vfes-dark/65 mt-1">{a.cause}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px]">
          <Link to="/portal/incidents"  className="text-vfes-dark font-semibold hover:underline">{tt('Incident management')}</Link>
          <Link to="/portal/horizon"    className="text-vfes-dark font-semibold hover:underline">{tt('Horizon security')}</Link>
          <Link to="/portal/cdo"        className="text-vfes-dark font-semibold hover:underline">{tt('CDO dashboard')}</Link>
        </div>
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
          {tt('Anomaly detection compares each warehouse\'s daily credit usage against its rolling 14-day average. Threshold: +25% for MEDIUM, +40% for HIGH. False-positive rate < 2% based on 90-day backtest on Cable Bahamas account history.')}
        </div>
        <Panel title={tt('Credit anomaly score by warehouse · current week')}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { wh: 'WH_TRANSFORM_L', score: 0.82 }, { wh: 'WH_CORTEX_L',  score: 0.54 },
              { wh: 'WH_BI_M',        score: 0.24 }, { wh: 'WH_ML_GPU_M', score: 0.38 },
              { wh: 'WH_AD_HOC_S',    score: 0.71 }, { wh: 'WH_INGEST_S', score: 0.18 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="wh" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} />
              <Tooltip />
              <Bar dataKey="score" fill={AMBER} name={tt('Anomaly score')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </>)}

      {/* ─── Tab: Chargeback ─────────────────────────────────── */}
      {tab === 'Chargeback' && (<>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-vfes-dark/55">{tt('Filter team:')}</span>
          {['all', 'customer360', 'network', 'finance', 'b2b'].map(v => (
            <button
              key={v}
              onClick={() => setChargebackTeam(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${chargebackTeam === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <Panel title={tt('Chargeback trend · 6 months · by domain team')}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={CHARGEBACK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="customer360" stackId="a" stroke={BLUE}   fill={BLUE}    fillOpacity={0.3} name={tt('Customer 360')} />
              <Area type="monotone" dataKey="network"     stackId="a" stroke={GREEN}  fill={GREEN}   fillOpacity={0.3} name={tt('Network')} />
              <Area type="monotone" dataKey="finance"     stackId="a" stroke={AMBER}  fill={AMBER}   fillOpacity={0.3} name={tt('Finance')} />
              <Area type="monotone" dataKey="b2b"         stackId="a" stroke={PURPLE} fill={PURPLE}  fillOpacity={0.3} name={tt('B2B')} />
              <Area type="monotone" dataKey="cortex_ai"   stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} name={tt('Cortex AI')} />
              <Area type="monotone" dataKey="ml"          stackId="a" stroke={SLATE}  fill={SLATE}   fillOpacity={0.3} name={tt('ML')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Current month chargeback · latest snapshot')}</div>
            <div className="space-y-1 text-[12px]">
              {chargebackData && Object.entries(chargebackData)
                .filter(([k]) => k !== 'm')
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-black/5 pb-1">
                    <span>{tt(k)}</span>
                    <span className="font-mono font-bold">{(v as number).toLocaleString()} {tt('credits')}</span>
                  </div>
                ))}
            </div>
          </div>
          <Panel title={tt('Mobile / RAN workload spend')}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('Workload')}</th>
                  <th>{tt('Warehouse')}</th>
                  <th>{tt('Credits / mo')}</th>
                  <th>{tt('BSD  / mo')}</th>
                  <th>{tt('Trend')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_COST.map((w) => (
                  <tr key={w.workload} className="border-t border-black/5">
                    <td className="py-2 font-semibold text-xs">{tt(w.workload)}</td>
                    <td className="font-mono text-xs text-vfes-dark/65">{w.warehouse}</td>
                    <td className="font-mono text-xs">{w.monthlyCreditsK.toFixed(2)}K</td>
                    <td className="font-mono text-xs font-bold">BSD {w.eurMonthly.toLocaleString()}</td>
                    <td className={`font-bold text-xs ${w.trend > 8 ? 'text-amber-600' : 'text-emerald-600'}`}>+{w.trend.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Customer 360 MTD')}</div>
            <div className="font-mono font-bold text-lg">8,612</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('credits · BSD 16.4K · largest domain')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Network MTD')}</div>
            <div className="font-mono font-bold text-lg">7,240</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('credits · BSD 13.8K · RAN telemetry')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Cortex AI MTD')}</div>
            <div className="font-mono font-bold text-lg text-amber-600">4,360</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('credits · BSD 8.3K · +18% MoM')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Ad-hoc MTD')}</div>
            <div className="font-mono font-bold text-lg text-amber-600">4,000</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('credits · BSD 7.6K · idle WH included')}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cio"    className="text-vfes-dark font-semibold hover:underline">{tt('CIO cost view')}</Link>
          <Link to="/portal/rbac"   className="text-vfes-dark font-semibold hover:underline">{tt('RBAC · cost centers')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Forecast ───────────────────────────────────── */}
      {tab === 'Forecast' && (<>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-vfes-dark/55">{tt('Horizon:')}</span>
          {(['month', 'quarter'] as const).map(v => (
            <button
              key={v}
              onClick={() => setForecastMode(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${forecastMode === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v === 'month' ? 'This month' : 'This quarter')}
            </button>
          ))}
        </div>
        <Panel title={tt('Credit forecast · actual vs forecast vs budget · 12 months')}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={FORECAST_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actual"   stroke={BLUE}    strokeWidth={2.5} name={tt('Actual')}   dot={{ r: 3 }} />
              <Line type="monotone" dataKey="forecast" stroke={AMBER}   strokeWidth={2}   name={tt('Forecast')} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="budget"   stroke="#dc2626" strokeWidth={1.5} name={tt('Budget')}   strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('EOM forecast')}</div>
            <div className="text-2xl font-extrabold mt-1 text-amber-600">56,400</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('BSD 107.2K · within budget')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Budget headroom')}</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600">3,600</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('BSD 6.8K remaining vs BSD 110K budget')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Forecast confidence')}</div>
            <div className="text-2xl font-extrabold mt-1">94%</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('SARIMA + XGB ensemble · 14d calibration')}</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('EOM forecast uses SARIMA + XGBoost ensemble model trained on 6-month credit history, with exogenous features: weekday indicators, scheduled dbt run flags, AI agent call volume, and ML training run schedule. Confidence interval is ±5% at 94% probability.')}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cio"  className="text-vfes-dark font-semibold hover:underline">{tt('CIO cost forecast')}</Link>
          <Link to="/portal/cdo"  className="text-vfes-dark font-semibold hover:underline">{tt('CDO data cost view')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Optimization ───────────────────────────────── */}
      {tab === 'Optimization' && (<>
        <Panel title={tt('Optimization opportunities (auto-detected by IDLE_DETECT_CLASSIFIER + rule engine)')}>
          <div className="space-y-3">
            {OPS.map((o, i) => (
              <div key={i} className="flex items-center justify-between border border-black/5 rounded-lg p-3 bg-gradient-to-r from-emerald-50/40 to-white">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-[12px]">{tt(o.rec)}</div>
                    <div className="text-[10px] text-vfes-dark/55">{tt('est. savings ·')} {o.impact}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${o.conf === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {tt(o.conf)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={tt('Optimization impact summary · annual savings potential')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={OPS_IMPACT} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" BSD" />
              <YAxis dataKey="rec" type="category" tick={{ fontSize: 10 }} width={200} />
              <Tooltip />
              <Bar dataKey="impact_eur" fill={GREEN} name={tt('Annual savings BSD')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Optimization · annual impact summary · ranked by savings')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Recommendation')}</th>
                <th className="text-right">{tt('Savings BSD/yr')}</th>
                <th className="text-left">{tt('Effort')}</th>
                <th className="text-left">{tt('Confidence')}</th>
              </tr>
            </thead>
            <tbody>
              {OPS_IMPACT.map((o, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 text-[11px]">{tt(o.rec)}</td>
                  <td className="text-right font-mono font-bold">
                    {o.impact_eur > 0 ? `BSD ${o.impact_eur.toLocaleString()}` : tt('guardrail')}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${o.effort === 'low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(o.effort)}
                    </span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${o.conf === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt(o.conf)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 border-t border-black/5 pt-2">
            <span className="text-[11px] text-vfes-dark/65">{tt('Total identified annual savings:')}</span>
            <span className="font-mono font-bold text-emerald-600">BSD {OPS_IMPACT.reduce((s, o) => s + o.impact_eur, 0).toLocaleString()} {tt('/ yr')}</span>
          </div>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering · incremental pipelines')}</Link>
          <Link to="/portal/architecture"     className="text-vfes-dark font-semibold hover:underline">{tt('Architecture · Gen-2 migration')}</Link>
          <Link to="/portal/lineage"          className="text-vfes-dark font-semibold hover:underline">{tt('Lineage · upstream cost attribution')}</Link>
        </div>
      </>)}

      <div className="border-t border-black/5 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold mb-3">
          {tt('Related Snowflake surfaces')}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <Link to="/portal/observability" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Observability')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Pipeline · WH load')}</div>
          </Link>
          <Link to="/portal/catalog" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Catalog')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Browse objects')}</div>
          </Link>
          <Link to="/portal/environments" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Environments')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('DEV → PROD costs')}</div>
          </Link>
          <Link to="/portal/data-quality" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Data quality')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('DMF coverage')}</div>
          </Link>
          <Link to="/portal/cio" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('CIO view')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Executive cost KPIs')}</div>
          </Link>
          <Link to="/portal/agents" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Agents')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('AI usage · cost')}</div>
          </Link>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Cost intelligence pulls from SNOWFLAKE.ACCOUNT_USAGE views: WAREHOUSE_METERING_HISTORY, STORAGE_USAGE, QUERY_HISTORY, CORTEX_FUNCTIONS_USAGE, METERING_DAILY_HISTORY. All anomaly detection models are trained in Snowflake ML and served from the Model Registry. Forecast uses SARIMA + XGBoost ensemble with 14-day calibration window. Chargeback allocations use tag-based cost attribution via resource monitors.')}
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <Wallet className="w-3 h-3" />
        {tt('source: SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY · QUERY_HISTORY · CORTEX_USAGE · refreshed hourly')}
      </div>
      <div className="text-[10px] text-vfes-dark/25 mt-1">
        {tt('anomaly models: CREDIT_ANOMALY_V2 · COST_FORECAST_MODEL · IDLE_DETECT_CLASSIFIER')}
        {' — '}
        {tt('all trained in Snowflake ML · served from Model Registry · calibrated weekly')}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-vfes-dark/25">
        <div>{tt('ACCOUNT_USAGE latency: ~3h for metering views')}</div>
        <div>{tt('Anomaly baseline: rolling 14d p75/p95 per warehouse')}</div>
        <div>{tt('Forecast horizon: EOM + 3-month rolling projection')}</div>
        <div>{tt('Chargeback tag: COST_CENTER applied via resource monitor')}</div>
      </div>
      <div className="mt-1 grid grid-cols-4 gap-2 text-[10px] text-vfes-dark/20">
        <div>{tt('Total warehouses: 7 · 2 idle · 5 active')}</div>
        <div>{tt('Total credits available this period: 60,000')}</div>
        <div>{tt('Storage pricing: BSD 0.023 / GB / month (active)')}</div>
        <div>{tt('Cortex AI: $0.15/1K tokens · Search: $0.001/query')}</div>
      </div>
    </div>
  )
}
