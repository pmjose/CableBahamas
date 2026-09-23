import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3942)
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import { Workflow, Zap, Database, Activity, GitBranch, FileCode, Layers, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Cloud, Box, Play, Pause, Smartphone, BarChart2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine, Cell } from 'recharts'
import { MOBILE_PIPELINES } from './_mobile_data'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED'
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const TABS = [
  { id: 'ingest',     label: 'Ingestion',         icon: Cloud },
  { id: 'pipelines',  label: 'Dynamic Tables',    icon: Workflow },
  { id: 'dbt',        label: 'dbt project',       icon: FileCode },
  { id: 'streams',    label: 'Streams & Tasks',   icon: GitBranch },
  { id: 'snowpipe',   label: 'Snowpipe / Pipes',  icon: Zap },
  { id: 'cost',       label: 'Cost & Health',     icon: Activity },
  { id: 'quality',    label: 'Data Quality',      icon: ShieldCheck },
  { id: 'catalog',    label: 'Catalog & Lineage', icon: Database },
] as const

type TabId = typeof TABS[number]['id']

const STATUS = {
  ok:    { color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle2 },
  warn:  { color: 'text-amber-700 bg-amber-50',     icon: AlertTriangle },
  err:   { color: 'text-rose-700 bg-rose-50',       icon: AlertTriangle },
  idle:  { color: 'text-zinc-700 bg-zinc-100',      icon: Pause },
}

export default function DataEngineeringPage() {
  const [tab, setTab] = useState<TabId>(() => (localStorage.getItem('de-tab') as TabId) || 'ingest')
  const [ingestRange, setIngestRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [costWh, setCostWh] = useState<'all' | 'ingest' | 'transform' | 'bi'>('all')
  const [dtFilter, setDtFilter] = useState<'all' | 'warn' | 'ok'>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [alertDismissed, setAlertDismissed] = useState(false)
  useEffect(() => { localStorage.setItem('de-tab', tab) }, [tab])

  const filteredDts = useMemo(() => {
    const dts = [
      { n: 'CBL_CORE.CONFORMED.DIM_CUSTOMER',         lag: '5 min',  m: 'Incremental', last: '2 min ago',  dur: '14 sec', rin: '1,420',   st: 'ok' },
      { n: 'CBL_CORE.CONFORMED.DIM_PRODUCT',          lag: '15 min', m: 'Incremental', last: '8 min ago',  dur: '4 sec',  rin: '12',      st: 'ok' },
      { n: 'CBL_CORE.CONFORMED.FACT_INTERACTIONS',    lag: '5 min',  m: 'Incremental', last: '1 min ago',  dur: '38 sec', rin: '184,884', st: 'ok' },
      { n: 'CBL_CORE.CONFORMED.FACT_BILLING',         lag: '15 min', m: 'Incremental', last: '6 min ago',  dur: '12 sec', rin: '2,212',   st: 'ok' },
      { n: 'CBL_CORE.CONFORMED.FACT_NETWORK_KPI',     lag: '5 min',  m: 'Incremental', last: '3 min ago',  dur: '1m 24s', rin: '4.2M',    st: 'warn' },
      { n: 'CBL_ANALYTICS.CUSTOMER.CUSTOMER_360',     lag: '60 min', m: 'Incremental', last: '24 min ago', dur: '2m 18s', rin: '6,884',   st: 'ok' },
      { n: 'CBL_ANALYTICS.CUSTOMER.CHURN_LIST_DAILY', lag: '1 day',  m: 'Full',        last: '03:30 UTC',  dur: '4m 22s', rin: '14,212',  st: 'ok' },
      { n: 'CBL_ANALYTICS.PRODUCT.PRODUCT_360',       lag: '60 min', m: 'Incremental', last: '12 min ago', dur: '46 sec', rin: '184',     st: 'ok' },
      { n: 'CBL_ANALYTICS.B2B.B2B_360',               lag: '60 min', m: 'Incremental', last: '8 min ago',  dur: '32 sec', rin: '24',      st: 'ok' },
      { n: 'CBL_ANALYTICS.PEOPLE.PEOPLE_360',         lag: '1 day',  m: 'Full',        last: '05:00 UTC',  dur: '1m 12s', rin: '1,840',   st: 'ok' },
      { n: 'CBL_ANALYTICS.EXEC.EXEC_360',             lag: '1 day',  m: 'Full',        last: '06:00 UTC',  dur: '4m 08s', rin: '184',     st: 'ok' },
      { n: 'CBL_ANALYTICS.RISK_ESG.RISK_360',         lag: '1 day',  m: 'Incremental', last: '04:30 UTC',  dur: '2m 14s', rin: '4,212',   st: 'ok' },
    ]
    return dtFilter === 'all' ? dts : dts.filter(d => d.st === dtFilter)
  }, [dtFilter])

  const catalogItems = useMemo(() => {
    const items = [
      { db: 'CBL_RAW',       sc: 'CRM',      t: 24,  owner: 'INGEST_ROLE',    col: 248 },
      { db: 'CBL_RAW',       sc: 'BILLING',  t: 18,  owner: 'INGEST_ROLE',    col: 186 },
      { db: 'CBL_RAW',       sc: 'NETWORK',  t: 8,   owner: 'INGEST_ROLE',    col: 84 },
      { db: 'CBL_CORE',      sc: 'CONFORMED',t: 42,  owner: 'TRANSFORM_ROLE', col: 412 },
      { db: 'CBL_ANALYTICS', sc: 'CUSTOMER', t: 18,  owner: 'ANALYTICS_ROLE', col: 186 },
      { db: 'CBL_ANALYTICS', sc: 'PRODUCT',  t: 8,   owner: 'ANALYTICS_ROLE', col: 84 },
      { db: 'CBL_ANALYTICS', sc: 'B2B',      t: 12,  owner: 'ANALYTICS_ROLE', col: 124 },
      { db: 'CBL_ML',        sc: 'FEATURES', t: 24,  owner: 'ML_ROLE',        col: 312 },
    ]
    if (!catalogSearch) return items
    const q = catalogSearch.toLowerCase()
    return items.filter(i => i.db.toLowerCase().includes(q) || i.sc.toLowerCase().includes(q))
  }, [catalogSearch])

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={tt('Data Engineering')}
        subtitle={tt('Ingestion · Transformation · Orchestration · Health · 108 pipelines · 42 dynamic tables · 22 tasks')}
        actions={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">{tt('● 96 OK · 12 WARN')}</span>
            <button className="bg-vfes-red text-vfes-dark text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> {tt('Refresh state')}
            </button>
          </div>
        }
      />

      {/* ML Insight Section */}
      <MlInsightSection
        heading="Pipeline intelligence"
        models={[
          { name: 'Anomaly Detector',     metric: 'recall 0.93', sub: 'late / failed pipeline runs' },
          { name: 'Cost Optimizer',       metric: '-18% credits', sub: 'warehouse idle analysis' },
          { name: 'Freshness Forecaster', metric: 'MAPE 3.2%',   sub: 'lag time prediction 24h ahead' },
        ]}
        agentLabel={tt('Run Pipeline Analyst')}
        agentRunningLabel={tt('Scanning pipelines…')}
        agentSteps={[
          tt('Analysed DYNAMIC_TABLE_REFRESH_HISTORY 14d'),
          tt('Ranked pipelines by SLO risk × downstream impact'),
          tt('Detected 3 idle warehouse windows'),
          tt('Generated cost + reliability recommendations'),
        ]}
        agentBlurb={tt('Snowflake event telemetry lets one model see lag, cost, and lineage together — no stitching across systems.')}
        decision={{
          title: tt('Increase FACT_NETWORK_KPI target lag to 7 min; right-size WH_ML_GPU_M'),
          detail: tt('FACT_NETWORK_KPI is the only DT breaching SLO at 1m 24s refresh. Increasing target lag to 7 min gives 2× headroom at zero accuracy cost. WH_ML_GPU_M is idle 28% of time — auto-suspend at 30s saves ~BSD 340/wk.'),
          impact: tt('SLO compliance 100% · ~BSD 28K/yr savings'),
          risk: tt('FACT_NETWORK_KPI downstream BI tiles will lag 2 extra minutes'),
          linkTo: '/portal/cost',
          linkLabel: tt('Cost Intelligence →'),
        }}
        chart={{
          kind: 'area',
          title: tt('Pipeline failures — rolling 30 days'),
          xKey: 'd',
          data: Array.from({ length: 30 }, (_, i) => ({
            d: i + 1,
            fail: i === 12 ? 6 : i === 24 ? 3 : Math.round(scenarioRandom() * 1.5),
            warn: Math.round(1 + scenarioRandom() * 2),
          })),
          series: [
            { key: 'fail', name: tt('Failures'), color: '#EF4444' },
            { key: 'warn', name: tt('Warnings'), color: AMBER },
          ],
          note: tt('Two incidents (D-12 · D-24) were auto-recovered within 10 min via task retry.'),
        }}
      />

      {/* Alert */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">{tt('FACT_NETWORK_KPI refresh p95 = 1m 24s · SLO 5 min · approaching threshold')}</div>
              <div className="text-xs text-amber-800 mt-1">{tt('TASK_FRAUD_SCORING_UDF last run status WARN · investigate before next cycle.')}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/portal/observability" className="text-xs font-bold text-amber-900 hover:underline">{tt('Observability →')}</Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Top-level KPI row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Pipelines healthy')} value="96 / 108"   delta={tt('12 SLO at risk')}          trend="flat" icon={Workflow} accent />
        <KpiCard label={tt('Records / day')}     value="8.4 B"      delta={tt('Snowpipe + Kafka')}        trend="up"   icon={Zap} />
        <KpiCard label={tt('Dynamic tables')}    value="42"         delta={tt('38/42 within SLO')}        trend="up"   icon={Layers} />
        <KpiCard label={tt('Credits 7d')}        value="12,884"     delta={tt('-6% MoM')}                 trend="up"   icon={BarChart2} />
      </div>

      {/* Tabs (executive pill style) */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow shadow-vfes-red/20' : 'text-vfes-dark/65 hover:bg-black/5'}`}>
            <t.icon className="w-4 h-4" />{tt(t.label)}
          </button>
        ))}
      </div>

      {tab === 'ingest' && <Ingest ingestRange={ingestRange} setIngestRange={setIngestRange} />}
      {tab === 'pipelines' && <Pipelines filteredDts={filteredDts} dtFilter={dtFilter} setDtFilter={setDtFilter} />}
      {tab === 'dbt' && <Dbt />}
      {tab === 'streams' && <Streams />}
      {tab === 'snowpipe' && <Snowpipe />}
      {tab === 'cost' && <Cost costWh={costWh} setCostWh={setCostWh} />}
      {tab === 'quality' && <Quality />}
      {tab === 'catalog' && <CatalogLineage catalogSearch={catalogSearch} setCatalogSearch={setCatalogSearch} catalogItems={catalogItems} />}

      {/* Mobile pipelines — always visible */}
      <Panel title={tt('Mobile / RAN pipelines')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('8 mobile pipelines · 16.7B rows/day')}</span>}>
        <table className="w-full text-[12px]">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-1.5">{tt('Pipeline')}</th><th>{tt('Type')}</th><th>{tt('Source')}</th><th>{tt('Target lag')}</th><th>{tt('Daily rows')}</th><th>{tt('Credits / mo')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {MOBILE_PIPELINES.map((p) => (
              <tr key={p.name} className="border-t border-black/5">
                <td className="py-2 font-mono text-xs font-semibold">{p.name}</td>
                <td className="text-[11px] text-vfes-dark/65">{tt(p.type)}</td>
                <td className="text-[11px] text-vfes-dark/65">{p.source}</td>
                <td className="font-mono text-xs">{p.targetLag}</td>
                <td className="font-mono text-xs">{p.dailyRows}</td>
                <td className="font-mono text-xs">{p.creditsMo.toFixed(2)}K</td>
                <td>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === 'healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(p.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-vfes-dark/65 mt-3">{tt('pipe_ran_telemetry is the largest mobile pipeline at 12.4B rows/day continuous · BSD 5.5K/mo. Dynamic Tables transform with 3-min TARGET_LAG to V_RAN_TELEMETRY.')}</div>
        <div className="mt-2 flex gap-3">
          <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Full Pipeline Health →')}</Link>
          <Link to="/portal/observability"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
        </div>
      </Panel>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        {[
          { to: '/portal/architecture',   label: tt('Platform Architecture'), desc: tt('Full Snowflake data platform layers') },
          { to: '/portal/catalog',         label: tt('Data Catalog'),          desc: tt('Tables, columns, tags, lineage') },
          { to: '/portal/semantic-views',  label: tt('Semantic Views'),        desc: tt('Business metrics & NL analytics') },
          { to: '/portal/data-quality',    label: tt('Data Quality'),          desc: tt('DMFs · SLAs · contracts') },
          { to: '/portal/lineage',         label: tt('Data Lineage'),          desc: tt('Upstream / downstream dependencies') },
          { to: '/portal/cost',            label: tt('Cost Intelligence'),     desc: tt('Credits · spend · optimisation') },
          { to: '/portal/data-products',   label: tt('Data Products'),         desc: tt('Shareable data packages') },
          { to: '/portal/data-contracts',  label: tt('Data Contracts'),        desc: tt('Schema + SLA contracts') },
          { to: '/portal/iceberg',         label: tt('Iceberg Tables'),        desc: tt('External open-format tables') },
          { to: '/portal/cdo',             label: tt('CDO Dashboard'),         desc: tt('Chief Data Officer overview') },
          { to: '/portal/environments',    label: tt('Environments'),          desc: tt('DEV / STAGING / PROD config') },
        ].map((l) => (
          <Link key={l.to} to={l.to}
            className="rounded-lg border border-black/5 bg-white p-3 hover:border-vfes-red/30 hover:bg-vfes-red/5 transition block">
            <div className="text-xs font-bold">{l.label}</div>
            <div className="text-[10px] text-vfes-dark/55 mt-0.5">{l.desc}</div>
          </Link>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-6 mt-6 border-t border-black/5">
        {tt('Snowflake event table SNOWFLAKE.TELEMETRY.EVENTS · TASK_HISTORY 14d · DYNAMIC_TABLE_REFRESH_HISTORY 14d · refreshed 02:00 UTC')}
      </div>
    </div>
  )
}

/* -------------------------- INGEST -------------------------- */
function Ingest({ ingestRange, setIngestRange }: { ingestRange: '24h' | '7d' | '30d'; setIngestRange: (v: '24h' | '7d' | '30d') => void }) {
  return (
    <>
      <div className="flex gap-2 mb-4">
        {(['24h', '7d', '30d'] as const).map(r => (
          <button key={r} onClick={() => setIngestRange(r)}
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${ingestRange === r ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{r}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Records / day', v: '8.4 B', s: 'Snowpipe streaming + Kafka' },
          { l: 'Bytes / day',   v: '684 GB', s: 'Compressed' },
          { l: 'Connectors',    v: '12 active', s: '0 paused' },
          { l: 'Ingest p99 lag',v: '8.4 sec',   s: 'Streaming target ≤30s' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{k.l}</div>
            <div className="text-xl font-extrabold mt-1">{k.v}</div>
            <div className="text-[11px] text-vfes-dark/55 mt-0.5">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-black/5 mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Connectors / channels')}</h3>
          <span className="text-[11px] text-vfes-dark/55 font-mono">{tt('SHOW PIPES IN ACCOUNT · SHOW INTEGRATIONS')}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
            <tr>
              <th className="px-5 py-2.5">{tt('Source / channel')}</th>
              <th>{tt('Type')}</th>
              <th>{tt('Target')}</th>
              <th>{tt('Records / 5min')}</th>
              <th>{tt('Lag p95')}</th>
              <th>{tt('Last seen')}</th>
              <th>{tt('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { src: 'amdocs.crm.customers',          ty: 'Openflow CDC (Oracle)', tgt: 'CBL_RAW.CRM.CUSTOMERS_RAW',     r: '1,840',     lag: '12s', last: '5 sec ago',  st: 'ok' },
              { src: 'amdocs.crm.interactions',       ty: 'Openflow CDC (Oracle)', tgt: 'CBL_RAW.CRM.INTERACTIONS_RAW',  r: '184,420',   lag: '14s', last: '2 sec ago',  st: 'ok' },
              { src: 'cisco.bss.invoices',            ty: 'Openflow CDC (Postgres)', tgt: 'CBL_RAW.BILLING.INVOICES_RAW', r: '2,212',    lag: '18s', last: '12 sec ago', st: 'ok' },
              { src: 'cisco.bss.payments',            ty: 'Openflow CDC (Postgres)', tgt: 'CBL_RAW.BILLING.PAYMENTS_RAW', r: '4,884',    lag: '14s', last: '4 sec ago',  st: 'ok' },
              { src: 'kafka.cmts.telemetry',          ty: 'Snowpipe Streaming',      tgt: 'CBL_RAW.NETWORK.CMTS_TELEMETRY', r: '4.2M',   lag: '6s',  last: '1 sec ago',  st: 'ok' },
              { src: 'kafka.oss.alarms',              ty: 'Snowpipe Streaming',      tgt: 'CBL_RAW.NETWORK.OSS_ALARMS',  r: '1.8M',     lag: '8s',  last: '1 sec ago',  st: 'ok' },
              { src: 'adobe.analytics.pageviews',     ty: 'S3 Snowpipe',             tgt: 'CBL_RAW.WEB.PAGEVIEWS_RAW',   r: '684K',     lag: '4m',  last: '2 min ago',  st: 'ok' },
              { src: 'adobe.analytics.events',        ty: 'S3 Snowpipe',             tgt: 'CBL_RAW.WEB.EVENTS_RAW',      r: '1.2M',     lag: '4m',  last: '2 min ago',  st: 'ok' },
              { src: 'salesforce.b2b',                ty: 'Connector (REST bulk)',   tgt: 'CBL_RAW.CRM.SF_B2B_RAW',      r: '12',       lag: '28m', last: '12 min ago', st: 'warn' },
              { src: 'workday.hr',                    ty: 'Connector (RaaS)',        tgt: 'CBL_RAW.HR.WORKERS_RAW',      r: '0 (daily)',lag: 'daily', last: '04:00 UTC', st: 'idle' },
              { src: 'netsuite.gl',                   ty: 'REST API job',            tgt: 'CBL_RAW.FIN.GL_RAW',          r: '184',      lag: '54m', last: '32 min ago', st: 'ok' },
              { src: 'tomorrow.io.weather',           ty: 'Marketplace share',       tgt: 'CBL_SHARES.INBOUND.WEATHER_DAILY', r: '— (share)', lag: '—', last: '04:00 UTC', st: 'ok' },
            ].map((r) => {
              const S = STATUS[r.st as keyof typeof STATUS]
              return (
                <tr key={r.src} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="px-5 py-2 font-mono text-[12px] font-semibold">{r.src}</td>
                  <td className="text-[12px]">{r.ty}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/65">{r.tgt}</td>
                  <td className="font-mono text-[12px] font-bold">{r.r}</td>
                  <td className="font-mono text-[11px]">{r.lag}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/55">{r.last}</td>
                  <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${S.color} flex items-center gap-1 w-fit`}><S.icon className="w-3 h-3" />{r.st}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Throughput — last 24h (records/min)')}</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={Array.from({ length: 24 }, (_, h) => ({
                h: `${String((h + 0) % 24).padStart(2, '0')}:00`,
                cdc: 12000 + Math.round(Math.sin(h / 3) * 4000) + scenarioRandom() * 1000,
                kafka: 6000000 + Math.round(Math.cos(h / 4) * 1500000) + (h > 18 ? 800000 : 0),
                s3: 600000 + Math.round(Math.sin(h / 2) * 200000),
              }))}>
                <defs>
                  <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF4438" stopOpacity={0.5} /><stop offset="100%" stopColor="#FF4438" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="kafka" stroke="#222128" fill="url(#kg)" name={tt('Kafka streaming')} strokeWidth={2} />
                <Area type="monotone" dataKey="s3" stroke="#3B82F6" fill="#3B82F640" name={tt('S3 Snowpipe')} />
                <Area type="monotone" dataKey="cdc" stroke="#10B981" fill="#10B98130" name={tt('Openflow CDC')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Lag distribution by channel')}</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { ch: 'cmts.telemetry',   p50: 2,  p95: 6,  p99: 11 },
                { ch: 'oss.alarms',       p50: 3,  p95: 8,  p99: 14 },
                { ch: 'crm.interactions', p50: 5,  p95: 14, p99: 28 },
                { ch: 'bss.invoices',     p50: 6,  p95: 18, p99: 36 },
                { ch: 'web.events',       p50: 60, p95: 240, p99: 360 },
              ]} layout="vertical">
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="s" />
                <YAxis dataKey="ch" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="p50" fill="#10B981" name={tt('p50')} />
                <Bar dataKey="p95" fill="#FBBF24" name={tt('p95')} />
                <Bar dataKey="p99" fill="#FF4438" name={tt('p99')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Pipeline Health →')}</Link>
        <Link to="/portal/lineage"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        <Link to="/portal/observability"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
      </div>
    </>
  )
}

/* -------------------------- DYNAMIC TABLES -------------------------- */
function Pipelines({ filteredDts, dtFilter, setDtFilter }: {
  filteredDts: { n: string; lag: string; m: string; last: string; dur: string; rin: string; st: string }[]
  dtFilter: 'all' | 'warn' | 'ok'
  setDtFilter: (v: 'all' | 'warn' | 'ok') => void
}) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: tt('Dynamic Tables'), v: '42', s: tt('across CORE + ANALYTICS') },
          { l: tt('On target lag'),  v: '38 / 42', s: tt('90% within SLO') },
          { l: tt('Refresh failures (7d)'), v: '4', s: tt('all auto-recovered') },
          { l: tt('Avg refresh'), v: '3m 42s' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{k.l}</div>
            <div className="text-xl font-extrabold mt-1">{k.v}</div>
            {k.s && <div className="text-[11px] text-vfes-dark/55 mt-0.5">{k.s}</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {(['all', 'ok', 'warn'] as const).map(f => (
          <button key={f} onClick={() => setDtFilter(f)}
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${dtFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(f)}</button>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-black/5 mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('DYNAMIC_TABLE_REFRESH_HISTORY (last refresh per object)')}</h3>
          <span className="text-[11px] text-vfes-dark/55 font-mono">{tt('SHOW DYNAMIC TABLES')}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
            <tr>
              <th className="px-5 py-2.5">{tt('Dynamic table')}</th>
              <th>{tt('Target lag')}</th>
              <th>{tt('Mode')}</th>
              <th>{tt('Last refresh')}</th>
              <th>{tt('Duration')}</th>
              <th>{tt('Rows in')}</th>
              <th>{tt('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDts.map((r) => {
              const S = STATUS[r.st as keyof typeof STATUS]
              return (
                <tr key={r.n} className="border-t border-black/5 hover:bg-vfes-red/5">
                  <td className="px-5 py-2 font-mono text-[12px] font-semibold">{r.n}</td>
                  <td className="font-mono text-[11px]">{r.lag}</td>
                  <td className="text-[12px]">{r.m}</td>
                  <td className="font-mono text-[11px] text-vfes-dark/55">{r.last}</td>
                  <td className="font-mono text-[11px]">{r.dur}</td>
                  <td className="font-mono text-[11px]">{r.rin}</td>
                  <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${S.color} flex items-center gap-1 w-fit`}><S.icon className="w-3 h-3" />{r.st}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Refresh duration trend (CORE — last 14d)')}</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={Array.from({ length: 14 }, (_, i) => ({ d: `D-${13 - i}`, fact_interactions: 38 + Math.round(Math.sin(i / 2) * 8), fact_network: 84 + Math.round(Math.cos(i / 3) * 14), customer_360: 138 + Math.round(Math.sin(i / 4) * 22) }))}>
              <CartesianGrid stroke="#f0f0f0" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="s" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="fact_interactions" stroke={BLUE}  strokeWidth={2} name={tt('FACT_INTERACTIONS')} />
              <Line type="monotone" dataKey="fact_network"      stroke={NAVY}  strokeWidth={2} name={tt('FACT_NETWORK_KPI')} />
              <Line type="monotone" dataKey="customer_360"      stroke={GREEN} strokeWidth={2} name={tt('CUSTOMER_360')} />
              <ReferenceLine y={300} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLO 5min', fontSize: 10, fill: '#B45309' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('All Pipelines →')}</Link>
        <Link to="/portal/lineage"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
      </div>
    </>
  )
}

/* -------------------------- DBT -------------------------- */
function Dbt() {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Models',          v: '184',   s: '12 staging · 96 intermediate · 76 marts' },
          { l: 'Tests passing',   v: '1,212', s: '0 failures · 6 warnings' },
          { l: 'Docs coverage',   v: '96%',   s: 'description + tests' },
          { l: 'Last build',      v: '04:42 UTC', s: 'success · 14m 22s' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{k.l}</div>
            <div className="text-xl font-extrabold mt-1">{k.v}</div>
            {k.s && <div className="text-[11px] text-vfes-dark/55 mt-0.5">{k.s}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl bg-white border border-black/5 p-5 lg:col-span-2 overflow-hidden">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Recent CI runs')}</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-2">{tt('Run')}</th><th>{tt('Trigger')}</th><th>{tt('Author')}</th><th>{tt('Duration')}</th><th>{tt('Models')}</th><th>{tt('Tests')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { id: '#1842', t: 'main · scheduled 04:30', u: 'CI', d: '14m 22s', m: '184', te: '1,212 pass', s: 'ok' },
                { id: '#1841', t: 'PR #284 · feat/churn-driver-shap', u: 'C. Rohan', d: '6m 18s', m: '12 changed', te: '54 pass · 2 warn', s: 'warn' },
                { id: '#1840', t: 'main · scheduled 02:30', u: 'CI', d: '13m 42s', m: '184', te: '1,212 pass', s: 'ok' },
                { id: '#1839', t: 'PR #283 · feat/network-kpi-cluster', u: 'M. Willems', d: '8m 02s', m: '8 changed', te: '38 pass', s: 'ok' },
                { id: '#1838', t: 'main · hotfix/null-iban', u: 'B. De Witte', d: '11m 06s', m: '4 changed', te: '12 pass · 1 fail', s: 'err' },
                { id: '#1837', t: 'main · scheduled 22:30', u: 'CI', d: '13m 58s', m: '184', te: '1,212 pass', s: 'ok' },
              ].map((r) => {
                const S = STATUS[r.s as keyof typeof STATUS]
                return (
                  <tr key={r.id} className="border-t border-black/5">
                    <td className="py-2 font-mono text-[12px] font-bold">{r.id}</td>
                    <td className="text-[12px]">{tt(r.t)}</td>
                    <td className="text-[12px] text-vfes-dark/65">{r.u}</td>
                    <td className="font-mono text-[11px]">{tt(r.d)}</td>
                    <td className="font-mono text-[11px]">{r.m}</td>
                    <td className="font-mono text-[11px]">{r.te}</td>
                    <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${S.color} flex items-center gap-1 w-fit`}><S.icon className="w-3 h-3" />{r.s}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Model layers')}</h3>
          <div className="space-y-3 text-sm">
            {[
              { l: 'staging  (stg_*)',   c: 12,  desc: 'Raw → typed, deduped, renamed' },
              { l: 'intermediate (int_*)',c: 96, desc: 'Business logic & joins' },
              { l: 'marts.dim_*',         c: 18, desc: 'Conformed dimensions (SCD-2)' },
              { l: 'marts.fact_*',        c: 24, desc: 'Conformed facts' },
              { l: 'marts.<domain>_360',  c: 22, desc: '360 wide tables for serving' },
              { l: 'snapshots',           c: 12, desc: 'Type-2 snapshots (90d retention)' },
            ].map((r) => (
              <div key={r.l}>
                <div className="flex justify-between text-xs">
                  <span className="font-mono font-bold">{r.l}</span>
                  <span className="font-mono text-vfes-dark/55">{r.c}</span>
                </div>
                <div className="h-1.5 bg-[#f3f4f7] rounded">
                  <div className="h-1.5 bg-vfes-red rounded" style={{ width: `${(r.c / 96) * 100}%` }} />
                </div>
                <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(r.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Top failing tests (7d)')}</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
            <tr><th className="py-2">{tt('Test')}</th><th>{tt('Severity')}</th><th>{tt('Last seen')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {[
              { t: 'unique_dim_customer__customer_key', sev: 'warn', last: 'D-1', o: 'C. Rohan' },
              { t: 'not_null_fact_interactions__customer_id', sev: 'warn', last: 'D-3', o: 'C. Rohan' },
              { t: 'accepted_values_dim_product__bundle_type', sev: 'error → fixed', last: 'D-5', o: 'A. Declercq' },
              { t: 'relationships_fact_billing__customer_id', sev: 'warn', last: 'D-2', o: 'B. De Witte' },
              { t: 'dbt_expectations_expect_column_kurtosis_arpu', sev: 'warn', last: 'D-1', o: 'A. Declercq' },
            ].map((r) => (
              <tr key={tt(r.t)} className="border-t border-black/5">
                <td className="py-2 font-mono text-[12px]">{tt(r.t)}</td>
                <td><span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{r.sev}</span></td>
                <td className="font-mono text-[11px] text-vfes-dark/55">{r.last}</td>
                <td className="text-[12px]">{r.o}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 flex-wrap">
        <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Pipeline Health →')}</Link>
        <Link to="/portal/data-quality"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
        <Link to="/portal/lineage"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        <Link to="/portal/catalog"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
        <Link to="/portal/environments"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Environments →')}</Link>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5 mt-6">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('dbt CI build time trend — last 6 runs (seconds)')}</h3>
        <div className="h-48">
          <ResponsiveContainer>
            <BarChart data={[
              { run: '#1837', total: 838, models: 184 },
              { run: '#1838', total: 666, models: 4 },
              { run: '#1839', total: 482, models: 8 },
              { run: '#1840', total: 822, models: 184 },
              { run: '#1841', total: 378, models: 12 },
              { run: '#1842', total: 862, models: 184 },
            ]}>
              <CartesianGrid stroke="#f0f0f0" />
              <XAxis dataKey="run" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="s" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name={tt('Build time (s)')} fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
function Streams() {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-white border border-black/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Streams')}</h3>
            <span className="text-[11px] text-vfes-dark/55 font-mono">{tt('SHOW STREAMS')}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
              <tr><th className="px-5 py-2.5">{tt('Stream')}</th><th>{tt('On')}</th><th>{tt('Mode')}</th><th>{tt('Stale')}</th><th>{tt('Pending')}</th></tr>
            </thead>
            <tbody>
              {[
                { n: 'CDC_CUSTOMERS_STREAM',    on: 'CUSTOMERS_RAW',    m: 'append_only', st: 'fresh',  p: '124' },
                { n: 'CDC_INTERACTIONS_STREAM', on: 'INTERACTIONS_RAW', m: 'standard',    st: 'fresh',  p: '8,884' },
                { n: 'CDC_BILLING_STREAM',      on: 'INVOICES_RAW',     m: 'standard',    st: 'fresh',  p: '212' },
                { n: 'CDC_PAYMENTS_STREAM',     on: 'PAYMENTS_RAW',     m: 'append_only', st: 'fresh',  p: '484' },
                { n: 'CDC_NETWORK_STREAM',      on: 'CMTS_TELEMETRY',   m: 'insert_only', st: 'fresh',  p: '184,884' },
                { n: 'CDC_TICKETS_STREAM',      on: 'TICKETS_RAW',      m: 'standard',    st: 'fresh',  p: '42' },
              ].map((s) => (
                <tr key={s.n} className="border-t border-black/5">
                  <td className="px-5 py-2 font-mono text-[12px] font-bold">{s.n}</td>
                  <td className="font-mono text-[11px]">{s.on}</td>
                  <td className="text-[12px]">{s.m}</td>
                  <td><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{s.st}</span></td>
                  <td className="font-mono text-[11px] font-bold">{s.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-white border border-black/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Tasks (DAG roots)')}</h3>
            <span className="text-[11px] text-vfes-dark/55 font-mono">{tt('SHOW TASKS')}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
              <tr><th className="px-5 py-2.5">{tt('Task')}</th><th>{tt('Schedule')}</th><th>{tt('State')}</th><th>{tt('Last run')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { n: 'TASK_DAILY_PEOPLE_REFRESH',  sc: 'CRON 0 5 * * *',           st: 'started', l: '05:02 UTC', s: 'ok' },
                { n: 'TASK_REFRESH_PRODUCT_360',   sc: 'CRON 0 3 * * *',           st: 'started', l: '03:12 UTC', s: 'ok' },
                { n: 'TASK_BUILD_CUSTOMER_360',    sc: 'CRON 0 3 * * *',           st: 'started', l: '03:08 UTC', s: 'ok' },
                { n: 'TASK_REFRESH_RISK_360',     sc: 'CRON 30 4 * * *',           st: 'started', l: '04:42 UTC', s: 'ok' },
                { n: 'TASK_BUILD_EXEC_360',       sc: 'CRON 0 6 * * *',            st: 'started', l: '06:08 UTC', s: 'ok' },
                { n: 'TASK_PROCURE_DAILY',        sc: 'CRON 0 2 * * *',            st: 'started', l: '02:14 UTC', s: 'ok' },
                { n: 'TASK_INGEST_NETSUITE',      sc: 'every 1 hour',              st: 'started', l: '24 min ago',s: 'ok' },
                { n: 'TASK_FRAUD_SCORING_UDF',    sc: 'every 15 min',              st: 'started', l: '4 min ago', s: 'warn' },
              ].map((r) => {
                const S = STATUS[r.s as keyof typeof STATUS]
                return (
                  <tr key={r.n} className="border-t border-black/5">
                    <td className="px-5 py-2 font-mono text-[12px] font-bold">{r.n}</td>
                    <td className="font-mono text-[11px]">{r.sc}</td>
                    <td><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"><Play className="w-2.5 h-2.5" />{r.st}</span></td>
                    <td className="font-mono text-[11px] text-vfes-dark/55">{r.l}</td>
                    <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${S.color} flex items-center gap-1 w-fit`}><S.icon className="w-3 h-3" />{r.s}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5 mb-6">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Task DAG — TASK_BUILD_CUSTOMER_360')}</h3>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-3 min-w-[900px] py-4">
            {[
              { n: 'TASK_BUILD_CUSTOMER_360', sub: 'root · cron 03:00 UTC', dur: '8s' },
              { n: 'CALL_CUSTOMER_360_PROC',  sub: 'snowpark python', dur: '2m 48s' },
              { n: 'POPULATE_FLIGHT_RISK',    sub: 'snowpark ML predict', dur: '1m 12s' },
              { n: 'REFRESH_BUNDLE_PROPENSITY',sub: 'sproc · scoring', dur: '54s' },
              { n: 'NOTIFY_DOWNSTREAM',       sub: 'system$send_email', dur: '2s' },
            ].map((n, i) => (
              <div key={n.n} className="flex items-center gap-3 shrink-0">
                <div className="rounded-lg bg-white border-2 border-vfes-red/30 px-3 py-2 min-w-[170px] shadow-sm">
                  <div className="font-mono text-[11px] font-extrabold">{n.n}</div>
                  <div className="text-[10px] text-vfes-dark/55">{n.sub}</div>
                  <div className="text-[10px] font-mono mt-1 text-emerald-700">✓ {n.dur}</div>
                </div>
                {i < 4 && <div className="text-vfes-dark/40">→</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link to="/portal/cost"          className="text-xs font-bold text-vfes-dark hover:underline">{tt('Cost Intelligence →')}</Link>
        <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5 mt-6">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Stream pending rows — last 7 days')}</h3>
        <div className="h-48">
          <ResponsiveContainer>
            <AreaChart data={Array.from({ length: 7 }, (_, i) => ({
              d: `D-${6 - i}`,
              customers: 100 + Math.round(Math.sin(i) * 40),
              interactions: 8000 + Math.round(Math.cos(i / 1.5) * 2000),
              billing: 200 + Math.round(Math.sin(i / 2) * 80),
            }))}>
              <CartesianGrid stroke="#f0f0f0" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="customers"    name={tt('CDC_CUSTOMERS')}    stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} />
              <Area type="monotone" dataKey="interactions" name={tt('CDC_INTERACTIONS')} stroke={GREEN} fill={GREEN} fillOpacity={0.15} />
              <Area type="monotone" dataKey="billing"      name={tt('CDC_BILLING')}      stroke={AMBER} fill={AMBER} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

/* -------------------------- DATA QUALITY -------------------------- */
function Quality() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('DMF checks')}        value="248"       delta={tt('86 tables monitored')}      trend="up"   icon={ShieldCheck} accent />
        <KpiCard label={tt('Tests passing')}     value="1,212"     delta={tt('0 failures · 6 warn')}      trend="up"   icon={CheckCircle2} />
        <KpiCard label={tt('Data contracts')}    value="18"        delta={tt('all SLA-bound')}             trend="flat" icon={FileCode} />
        <KpiCard label={tt('PII classified')}    value="91%"       delta={tt('Horizon auto-classify')}    trend="up"   icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={tt('DMF checks — freshness & null rate (7d)')}>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={[
                { t: 'DIM_CUSTOMER',      fresh: 99.8, null_rate: 0.1 },
                { t: 'FACT_INTERACTIONS', fresh: 99.6, null_rate: 0.4 },
                { t: 'FACT_BILLING',      fresh: 99.9, null_rate: 0.1 },
                { t: 'FACT_NETWORK_KPI',  fresh: 98.2, null_rate: 0.8 },
                { t: 'CUSTOMER_360',      fresh: 99.4, null_rate: 0.3 },
                { t: 'RISK_360',          fresh: 99.7, null_rate: 0.2 },
              ]}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="t" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[97, 100]} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fresh" name={tt('Freshness %')} fill={GREEN} radius={[4, 4, 0, 0]}>
                  {[{ t: 'DIM_CUSTOMER' }, { t: 'FACT_INTERACTIONS' }, { t: 'FACT_BILLING' }, { t: 'FACT_NETWORK_KPI' }, { t: 'CUSTOMER_360' }, { t: 'RISK_360' }]
                    .map((_, i) => <Cell key={i} fill={i === 3 ? AMBER : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={tt('Data contracts — SLA status')}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
              <tr><th className="py-1.5">{tt('Contract')}</th><th>{tt('Owner')}</th><th>{tt('SLA lag')}</th><th>{tt('Status')}</th></tr>
            </thead>
            <tbody>
              {[
                { c: 'CUSTOMER_360_SLA',    o: 'C. Rohan',    sla: '1h',    s: 'ok' },
                { c: 'BILLING_SLA',         o: 'B. De Witte',  sla: '15m',   s: 'ok' },
                { c: 'NETWORK_KPI_SLA',     o: 'M. Willems',  sla: '5m',    s: 'warn' },
                { c: 'PRODUCT_360_SLA',     o: 'A. Declercq', sla: '1h',    s: 'ok' },
                { c: 'FRAUD_SCORING_SLA',   o: 'L. Knowles', sla: '15m',   s: 'ok' },
                { c: 'B2B_360_SLA',         o: 'B. De Witte',  sla: '1h',    s: 'ok' },
              ].map((r) => (
                <tr key={r.c} className="border-t border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-bold">{r.c}</td>
                  <td className="text-[11px]">{r.o}</td>
                  <td className="font-mono text-[11px]">{r.sla}</td>
                  <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.s === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.s)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/portal/data-contracts" className="mt-3 text-xs font-bold text-vfes-dark hover:underline block">{tt('Data Contracts →')}</Link>
        </Panel>
      </div>

      <Panel title={tt('Top failing dbt tests (7d)')}>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
            <tr><th className="py-1.5">{tt('Test')}</th><th>{tt('Severity')}</th><th>{tt('Last seen')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {[
              { t: 'unique_dim_customer__customer_key',           sev: 'warn', last: 'D-1', o: 'C. Rohan' },
              { t: 'not_null_fact_interactions__customer_id',     sev: 'warn', last: 'D-3', o: 'C. Rohan' },
              { t: 'accepted_values_dim_product__bundle_type',    sev: 'error → fixed', last: 'D-5', o: 'A. Declercq' },
              { t: 'relationships_fact_billing__customer_id',     sev: 'warn', last: 'D-2', o: 'B. De Witte' },
            ].map((r) => (
              <tr key={r.t} className="border-t border-black/5">
                <td className="py-1.5 font-mono text-[12px]">{r.t}</td>
                <td><span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{r.sev}</span></td>
                <td className="font-mono text-[11px] text-vfes-dark/55">{r.last}</td>
                <td className="text-[12px]">{r.o}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex gap-3">
          <Link to="/portal/data-quality"  className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          <Link to="/portal/horizon"       className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
        </div>
      </Panel>
    </>
  )
}

/* -------------------------- CATALOG & LINEAGE -------------------------- */
function CatalogLineage({
  catalogSearch, setCatalogSearch, catalogItems,
}: {
  catalogSearch: string
  setCatalogSearch: (v: string) => void
  catalogItems: { db: string; sc: string; t: number; owner: string; col: number }[]
}) {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label={tt('Databases')}     value="8"        delta={tt('38 schemas')}                trend="flat" icon={Database} accent />
        <KpiCard label={tt('Tables')}        value="524"      delta={tt('4,212 columns tagged')}      trend="up"   icon={Layers} />
        <KpiCard label={tt('Lineage depth')} value="6 hops"   delta={tt('source → serving max')}     trend="flat" icon={GitBranch} />
        <KpiCard label={tt('Search corpora')}value="24"       delta={tt('6 Cortex Search services')} trend="up"   icon={Box} />
      </div>

      <div className="mb-4">
        <input
          className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-vfes-red"
          placeholder={tt('Search databases / schemas…')}
          value={catalogSearch}
          onChange={e => setCatalogSearch(e.target.value)}
        />
      </div>

      <Panel title={tt('Database / schema inventory')}>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
            <tr><th className="py-1.5">{tt('Database')}</th><th>{tt('Schema')}</th><th>{tt('Tables')}</th><th>{tt('Columns')}</th><th>{tt('Owner')}</th></tr>
          </thead>
          <tbody>
            {catalogItems.map((r) => (
              <tr key={`${r.db}.${r.sc}`} className="border-t border-black/5 hover:bg-vfes-red/5">
                <td className="py-1.5 font-mono text-[12px] font-bold">{r.db}</td>
                <td className="font-mono text-[11px]">{r.sc}</td>
                <td className="font-bold">{r.t}</td>
                <td className="font-mono text-[11px]">{r.col}</td>
                <td className="text-[11px] text-vfes-dark/65">{r.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-6">
        <Panel title={tt('Lineage paths — key assets')}>
          <div className="space-y-3">
            {[
              { src: 'amdocs.crm.customers', hops: ['CBL_RAW.CRM.CUSTOMERS_RAW', 'DIM_CUSTOMER', 'CUSTOMER_360', 'ChurnPredictor model'] },
              { src: 'kafka.cmts.telemetry',  hops: ['CBL_RAW.NETWORK.CMTS_TELEMETRY', 'FACT_NETWORK_KPI', 'EXEC_360', 'NOC Agent'] },
              { src: 'cisco.bss.invoices',    hops: ['CBL_RAW.BILLING.INVOICES_RAW', 'FACT_BILLING', 'RISK_360', 'Risk dashboard'] },
            ].map((l) => (
              <div key={l.src} className="rounded-lg border border-black/5 p-3">
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('Source:')} {l.src}</div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {l.hops.map((h, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="font-mono bg-[#fafbfc] border border-black/10 px-1.5 py-0.5 rounded">{h}</span>
                      {i < l.hops.length - 1 && <span className="text-vfes-dark/40">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3">
            <Link to="/portal/lineage"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Full Lineage →')}</Link>
            <Link to="/portal/catalog"     className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Catalog →')}</Link>
            <Link to="/portal/data-products" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Data Products →')}</Link>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={tt('Ingest volume by source — last 7 days (GB)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={[
                { src: 'Kafka CMTS',    gb: 284 },
                { src: 'Kafka OSS',     gb: 126 },
                { src: 'S3 Adobe',      gb: 84 },
                { src: 'OpenFlow CRM',  gb: 42 },
                { src: 'OpenFlow BSS',  gb: 36 },
                { src: 'REST NetSuite', gb: 8 },
              ]}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="src" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" GB" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="gb" name={tt('GB ingested')} radius={[4, 4, 0, 0]}>
                  {[BLUE, NAVY, GREEN, AMBER, PURPLE, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  )
}

/* -------------------------- SNOWPIPE -------------------------- */
function Snowpipe() {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Pipes (classic)', v: '8',  s: 'auto-ingest from S3' },
          { l: 'Pipes (streaming)', v: '12', s: 'high-performance · 6.0 M ev/min' },
          { l: 'Files / day', v: '184,884', s: 'avg 12 KB' },
          { l: 'p99 ingest lag', v: '8.4 s', s: 'streaming SLO ≤30s' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{k.l}</div>
            <div className="text-xl font-extrabold mt-1">{k.v}</div>
            {k.s && <div className="text-[11px] text-vfes-dark/55 mt-0.5">{k.s}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-black/5 mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60">{tt('Pipes — SHOW PIPES')}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc]">
            <tr><th className="px-5 py-2.5">{tt('Pipe')}</th><th>{tt('Type')}</th><th>{tt('Stage / Channel')}</th><th>{tt('Files / 5m')}</th><th>{tt('Auto-ingest')}</th><th>{tt('Status')}</th></tr>
          </thead>
          <tbody>
            {[
              { n: 'PIPE_WEB_PAGEVIEWS',    t: 'classic',    s: '@CBL_RAW.WEB.S3_ADOBE/pageviews/', f: '184',     a: 'TRUE',  st: 'ok' },
              { n: 'PIPE_WEB_EVENTS',       t: 'classic',    s: '@CBL_RAW.WEB.S3_ADOBE/events/',    f: '212',     a: 'TRUE',  st: 'ok' },
              { n: 'PIPE_FIN_NETSUITE',     t: 'classic',    s: '@CBL_RAW.FIN.S3_NETSUITE/',        f: '12',      a: 'TRUE',  st: 'ok' },
              { n: 'PIPE_CMTS_TELEMETRY',   t: 'streaming',  s: 'channel: kafka.cmts.telemetry',     f: '4.2M ev', a: 'STREAM',st: 'ok' },
              { n: 'PIPE_OSS_ALARMS',       t: 'streaming',  s: 'channel: kafka.oss.alarms',         f: '1.8M ev', a: 'STREAM',st: 'ok' },
              { n: 'PIPE_FRAUD_EVENTS',     t: 'streaming',  s: 'channel: kafka.fraud.scored',       f: '12K ev',  a: 'STREAM',st: 'ok' },
              { n: 'PIPE_CONTRACTS_DROP',   t: 'classic',    s: '@CBL_RAW.LEGAL.S3_DOCS/',          f: '4',       a: 'TRUE',  st: 'idle' },
            ].map((r) => {
              const S = STATUS[r.st as keyof typeof STATUS]
              return (
                <tr key={r.n} className="border-t border-black/5">
                  <td className="px-5 py-2 font-mono text-[12px] font-bold">{r.n}</td>
                  <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${r.t === 'streaming' ? 'bg-vfes-red/10 text-vfes-dark' : 'bg-blue-50 text-blue-700'}`}>{tt(r.t)}</span></td>
                  <td className="font-mono text-[11px] text-vfes-dark/65">{r.s}</td>
                  <td className="font-mono text-[11px] font-bold">{r.f}</td>
                  <td className="font-mono text-[10px]">{r.a}</td>
                  <td><span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${S.color} flex items-center gap-1 w-fit`}><S.icon className="w-3 h-3" />{r.st}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white border border-black/5 p-5">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Streaming lag p99 trend — 7 days')}</h3>
        <div className="h-48">
          <ResponsiveContainer>
            <LineChart data={Array.from({ length: 7 }, (_, i) => ({
              d: `D-${6 - i}`,
              cmts: 6 + Math.round(Math.sin(i) * 2),
              oss: 8 + Math.round(Math.cos(i / 1.5) * 2),
              fraud: 4 + Math.round(Math.sin(i / 2) * 1),
            }))}>
              <CartesianGrid stroke="#f0f0f0" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="s" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="cmts"  name={tt('CMTS telemetry')} stroke={BLUE}   strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="oss"   name={tt('OSS alarms')}     stroke={NAVY}   strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fraud" name={tt('Fraud events')}   stroke={GREEN}  strokeWidth={2} dot={false} />
              <ReferenceLine y={30} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLO 30s', fontSize: 10, fill: '#B45309' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link to="/portal/data-engineering" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Pipeline Health →')}</Link>
        <Link to="/portal/observability"    className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
      </div>
    </>
  )
}
function Cost({ costWh, setCostWh }: { costWh: 'all' | 'ingest' | 'transform' | 'bi'; setCostWh: (v: 'all' | 'ingest' | 'transform' | 'bi') => void }) {
  return (
    <>
      <div className="flex gap-2 mb-4">
        {(['all', 'ingest', 'transform', 'bi'] as const).map(w => (
          <button key={w} onClick={() => setCostWh(w)}
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${costWh === w ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65'}`}>{tt(w)}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Credits 7d',    v: '12,884', s: '-6% MoM' },
          { l: 'BSD  spend 7d',    v: 'BSD 42,418' },
          { l: 'Top warehouse', v: 'WH_INGEST_XL', s: '32% of spend' },
          { l: 'Idle %',        v: '4.8%', s: 'auto-suspend ≤60s' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55">{k.l}</div>
            <div className="text-xl font-extrabold mt-1">{k.v}</div>
            {k.s && <div className="text-[11px] text-vfes-dark/55 mt-0.5">{k.s}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Credit consumption — 14 days')}</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={Array.from({ length: 14 }, (_, i) => ({
                d: `D-${13 - i}`,
                ingest: 380 + Math.round(Math.sin(i / 2) * 80),
                transform: 280 + Math.round(Math.cos(i / 3) * 40),
                bi: 184 + Math.round(Math.sin(i / 4) * 30),
                cortex: 124 + Math.round(Math.cos(i / 2) * 22),
                ml: 96 + (i === 4 || i === 11 ? 220 : 0),
              }))}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingest"    stackId="a" fill="#FF4438" name={tt('WH_INGEST_XL')} />
                <Bar dataKey="transform" stackId="a" fill="#3B82F6" name={tt('WH_TRANSFORM_L')} />
                <Bar dataKey="bi"        stackId="a" fill="#10B981" name={tt('WH_BI_M')} />
                <Bar dataKey="cortex"    stackId="a" fill="#8B5CF6" name={tt('WH_CORTEX_L')} />
                <Bar dataKey="ml"        stackId="a" fill="#FBBF24" name={tt('WH_ML_GPU_M')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Pipeline health — last 30d')}</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={Array.from({ length: 30 }, (_, i) => ({ d: i + 1, sla: 95 + (i > 25 ? 4 : Math.sin(i / 3) * 3) + scenarioRandom() * 0.6, fail: i === 12 ? 6 : i === 24 ? 3 : scenarioRandom() * 1.5 }))}>
                <CartesianGrid stroke="#f0f0f0" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} domain={[80, 100]} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="sla" stroke="#10B981" strokeWidth={2} dot={false} name={tt('SLA met %')} />
                <Line yAxisId="r" type="monotone" dataKey="fail" stroke="#222128" strokeWidth={2} dot={false} name={tt('Failed runs')} />
                <ReferenceLine yAxisId="l" y={99} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: 'target 99%', fontSize: 10, fill: '#B45309' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3">{tt('Top 10 pipelines by spend (7d)')}</h3>
          <div className="space-y-2">
            {[
              { n: 'PIPE_CMTS_TELEMETRY',          c: 1842, p: 14.3 },
              { n: 'TASK_BUILD_CUSTOMER_360',      c: 1212, p: 9.4 },
              { n: 'DT FACT_INTERACTIONS',         c: 884,  p: 6.9 },
              { n: 'dbt CI build (main)',          c: 684,  p: 5.3 },
              { n: 'PIPE_OSS_ALARMS',              c: 612,  p: 4.7 },
              { n: 'TASK_REFRESH_PRODUCT_360',     c: 484,  p: 3.8 },
              { n: 'DT CUSTOMER_360',              c: 412,  p: 3.2 },
              { n: 'DT FACT_NETWORK_KPI',          c: 384,  p: 3.0 },
              { n: 'TASK_FRAUD_SCORING_UDF',       c: 282,  p: 2.2 },
              { n: 'PIPE_WEB_EVENTS',              c: 244,  p: 1.9 },
            ].map((r) => (
              <div key={r.n} className="flex items-center gap-3 text-xs">
                <span className="font-mono w-56 truncate">{r.n}</span>
                <div className="flex-1 h-2 bg-[#f3f4f7] rounded">
                  <div className="h-2 bg-vfes-red rounded" style={{ width: `${r.p * 6.5}%` }} />
                </div>
                <span className="font-bold w-16 text-right">{r.c.toLocaleString()}</span>
                <span className="text-vfes-dark/55 w-12 text-right">{r.p}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/5 p-5">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-vfes-dark/60 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" />{tt('Optimisation opportunities')}</h3>
          <div className="space-y-3">
            {[
              { t: 'Right-size WH_ML_GPU_M', d: 'Idle 28% · suggested down-shift to GPU-S during evenings', save: '~BSD 340 / wk' },
              { t: 'Cluster on FACT_INTERACTIONS', d: 'p95 prune ratio 0.18 — adding (INTERACTION_DATE) cluster key estimated', save: '~BSD 180 / wk' },
              { t: 'Search Optimization on TICKETS_RAW', d: 'High point-lookup pattern from agent desktop', save: '~BSD 96 / wk' },
              { t: 'Snowpipe streaming over micro-batch S3', d: 'PIPE_FIN_NETSUITE — cut lag 54m → 8s', save: '~BSD 12 / wk' },
              { t: 'Auto-suspend WH_PORTAL_XS', d: 'Currently 60s — consider 30s', save: '~BSD 18 / wk' },
            ].map((r) => (
              <div key={tt(r.t)} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm">{tt(r.t)}</div>
                  <div className="text-emerald-700 font-extrabold text-xs">{r.save}</div>
                </div>
                <div className="text-xs text-vfes-dark/65 mt-1">{tt(r.d)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
