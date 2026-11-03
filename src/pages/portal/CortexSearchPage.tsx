import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3660)
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { Search, FileText, Eye, Smartphone, Activity, Zap, Brain, AlertTriangle, CheckCircle2, Clock, Gauge, Layers, ShieldCheck, Database, Sparkles } from 'lucide-react'
import { MOBILE_SEARCH_INDEXES } from './_mobile_data'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const SERVICES = [
  { name: 'KB_CUSTOMER_KB',         on: 'CBL_AI.KB.CUSTOMER_DOCS',     docs: 14820, mb: 412,  refresh: 'incremental · 5 min', model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '2 min ago', cache_hit: '78%', recall5: 0.94, mrr: 0.86, qday: 4820 },
  { name: 'KB_NETWORK_RUNBOOKS',    on: 'CBL_AI.KB.NETWORK_RUNBOOKS',  docs: 4210,  mb: 184,  refresh: 'on-change',          model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '14 min ago', cache_hit: '82%', recall5: 0.96, mrr: 0.90, qday: 2140 },
  { name: 'KB_LEGAL_CONTRACTS',     on: 'CBL_AI.KB.CONTRACTS',         docs: 1820,  mb: 612,  refresh: 'daily',              model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '4 h ago',   cache_hit: '64%', recall5: 0.82, mrr: 0.71, qday: 840  },
  { name: 'KB_REGULATORY_FILINGS',  on: 'CBL_AI.KB.FILINGS',           docs: 1240,  mb: 322,  refresh: 'daily',              model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '6 h ago',   cache_hit: '71%', recall5: 0.84, mrr: 0.74, qday: 620  },
  { name: 'KB_PRODUCT_CATALOG',     on: 'CBL_AI.KB.PRODUCT_CATALOG',   docs: 824,   mb: 28,   refresh: 'on-change',          model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '8 min ago', cache_hit: '89%', recall5: 0.97, mrr: 0.92, qday: 3120 },
  { name: 'KB_POLICIES_DOCS',       on: 'CBL_AI.KB.POLICY_DOCS',       docs: 612,   mb: 18,   refresh: 'on-change',          model: 'snowflake-arctic-embed-l-v2.0', warehouse: 'WH_CORTEX_L', last: '12 min ago',cache_hit: '85%', recall5: 0.91, mrr: 0.84, qday: 480  },
]

const TOP_QUERIES = [
  { q: 'fibre activation steps freeport',                     calls: 412, hit_rate: '94%', service: 'KB_CUSTOMER_KB'       },
  { q: 'churn save offer £24.99 18-month',                calls: 318, hit_rate: '88%', service: 'KB_CUSTOMER_KB'       },
  { q: 'CMTS DOCSIS 4.0 reset procedure',                 calls: 246, hit_rate: '96%', service: 'KB_NETWORK_RUNBOOKS'  },
  { q: 'URCA complaint escalation policy',              calls: 184, hit_rate: '90%', service: 'KB_REGULATORY_FILINGS'},
  { q: 'Island Bank (demo) framework agreement renewal terms',     calls: 142, hit_rate: '78%', service: 'KB_LEGAL_CONTRACTS'   },
  { q: 'DPA DSAR fulfilment SOP',                        calls: 96,  hit_rate: '92%', service: 'KB_POLICIES_DOCS'     },
  { q: '5G NR SA slice activation enterprise',            calls: 84,  hit_rate: '91%', service: 'KB_NETWORK_RUNBOOKS'  },
  { q: 'roaming tariff The Bahamas-US data cap 2025',           calls: 76,  hit_rate: '87%', service: 'KB_PRODUCT_CATALOG'   },
]

const LATENCY = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  p50: 180 + Math.sin(i / 3) * 30,
  p95: 320 + Math.sin(i / 4) * 60,
  p99: 480 + Math.sin(i / 4.5) * 80,
}))

const QUERY_VOLUME = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  customer:   4200 + Math.round(Math.sin(i / 4) * 400),
  network:    2100 + Math.round(Math.sin(i / 3) * 200),
  product:    3000 + Math.round(Math.sin(i / 4.5) * 300),
  legal:      820  + Math.round(Math.sin(i / 5) * 100),
  regulatory: 600  + Math.round(Math.sin(i / 6) * 80),
}))

const FRESHNESS_EVENTS = Array.from({ length: 12 }, (_, i) => ({
  h: `${i * 2}:00`,
  customer_lag: 4.8 + Math.sin(i / 4) * 1.2,
  network_lag:  0.9 + Math.sin(i / 3) * 0.3,
  product_lag:  7.2 + Math.sin(i / 5) * 2.1,
}))

const EMBEDDING_BENCH = [
  { model: 'arctic-embed-l-v2.0', recall5: 0.94, latency_ms: 48, size_mb: 612 },
  { model: 'arctic-embed-m-v1.5', recall5: 0.89, latency_ms: 28, size_mb: 240 },
  { model: 'e5-large-v2',         recall5: 0.91, latency_ms: 36, size_mb: 380 },
  { model: 'bge-large-en-v1.5',   recall5: 0.92, latency_ms: 40, size_mb: 420 },
]

const CHUNK_BENCH = [
  { strategy: '512 tok fixed',    recall5: 0.88, mrr: 0.80, note: 'Baseline'             },
  { strategy: '256 tok fixed',    recall5: 0.86, mrr: 0.77, note: 'Better for short Q'   },
  { strategy: 'Sentence-aware',   recall5: 0.94, mrr: 0.87, note: 'Current · deployed'   },
  { strategy: 'Paragraph-aware',  recall5: 0.93, mrr: 0.86, note: 'Alt candidate'        },
  { strategy: 'Semantic-sliding', recall5: 0.96, mrr: 0.90, note: 'In evaluation'         },
]

const CACHE_HIT_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  customer: 76 + Math.sin(i / 4) * 4,
  network:  80 + Math.sin(i / 3) * 3,
  product:  87 + Math.sin(i / 5) * 2,
}))

const RECALL_TREND = Array.from({ length: 8 }, (_, i) => ({
  w: `W${i + 1}`,
  customer:   0.92 + Math.sin(i / 3) * 0.02,
  network:    0.95 + Math.sin(i / 4) * 0.01,
  legal:      0.80 + Math.sin(i / 2.5) * 0.03,
  regulatory: 0.82 + Math.sin(i / 3) * 0.02,
}))

const USAGE_BY_APP = [
  { app: 'Snowflake Intelligence', qday: 6840, color: BLUE   },
  { app: 'Customer 360',           qday: 3120, color: NAVY   },
  { app: 'NOC Dashboard',          qday: 2140, color: GREEN  },
  { app: 'B2B / Sales',            qday: 840,  color: AMBER  },
  { app: 'Compliance portal',      qday: 620,  color: PURPLE },
  { app: 'Self-serve portal',      qday: 460,  color: SLATE  },
]

// ── Tabs ──────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'services' | 'quality' | 'latency' | 'embeddings' | 'chunking' | 'usage' | 'mobile'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',   label: 'Overview',      icon: Gauge    },
  { id: 'services',   label: 'Services',      icon: Database },
  { id: 'quality',    label: 'Retrieval quality', icon: Brain  },
  { id: 'latency',    label: 'Latency',       icon: Clock    },
  { id: 'embeddings', label: 'Embeddings',    icon: Layers   },
  { id: 'chunking',   label: 'Chunking',      icon: FileText },
  { id: 'usage',      label: 'Usage by app',  icon: Activity },
  { id: 'mobile',     label: 'Mobile indexes', icon: Smartphone },
]

export default function CortexSearchPage() {
  const [tab, setTab]               = useState<TabId>('overview')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [recallSort, setRecallSort] = useState<'recall' | 'qday'>('recall')
  const [liveTime, setLiveTime]     = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const totalQday = useMemo(() => SERVICES.reduce((s, x) => s + x.qday, 0), [])

  const sortedServices = useMemo(
    () => [...SERVICES].sort((a, b) =>
      recallSort === 'recall' ? b.recall5 - a.recall5 : b.qday - a.qday
    ),
    [recallSort],
  )

  const filteredServices = useMemo(
    () => serviceFilter === 'All' ? SERVICES : SERVICES.filter(s => s.name.includes(serviceFilter)),
    [serviceFilter],
  )

  const avgRecall = useMemo(
    () => (SERVICES.reduce((s, x) => s + x.recall5, 0) / SERVICES.length).toFixed(2),
    [],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Cortex Search')}
        subtitle={tt('6 services · 23.5K indexed documents · 1.6 GB · embeddings · RAG quality · 14.6K calls/day')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {tt('All services healthy · ')}{liveTime}
            </span>
            <Link to="/portal/ai-insights" className="bg-vfes-red text-vfes-dark font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
              <Brain className="w-3.5 h-3.5" /> {tt('AI Insights')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ──────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Search intelligence"
        models={[
          { name: 'doc_extract_arctic', metric: 'F1 0.93', sub: tt('document chunking quality · 5 services') },
          { name: 'agent_eval_judge',   metric: avgRecall, sub: tt('avg Recall@5 across services') },
          { name: 'sentiment_arctic',   metric: 'F1 0.89', sub: tt('query intent classifier') },
        ]}
        agentLabel={tt('Run Search Quality Review')}
        agentRunningLabel={tt('Evaluating retrieval…')}
        agentSteps={[
          tt('Pulled Recall@5, MRR and faithfulness for all 6 services'),
          tt('Flagged KB_LEGAL_CONTRACTS — Recall@5 0.82 below 0.90 fleet median'),
          tt('Identified sentence-aware chunking as upgrade path for legal corpus'),
          tt('Generated action item: re-chunk KB_LEGAL_CONTRACTS with semantic-sliding strategy'),
        ]}
        agentBlurb={tt('Cortex Search embeddings are built on snowflake-arctic-embed-l-v2.0 — Snowflake-native, no external API calls, freshness guaranteed by incremental refresh tied directly to source tables.')}
        decision={{
          title: tt('Re-chunk KB_LEGAL_CONTRACTS with semantic-sliding strategy'),
          detail: tt('KB_LEGAL_CONTRACTS Recall@5 at 0.82 — lowest in fleet. The legal corpus contains long, clause-heavy documents where fixed-size chunking loses context across paragraphs. Semantic-sliding chunking (in eval) shows +14 pp improvement in pilot.'),
          impact: tt('Recall@5 0.82 → 0.96 · B2B deal accuracy +12%'),
          risk: tt('Re-chunking requires full re-index (4 h window) — schedule maintenance'),
          linkTo: '#/portal/ai-insights',
          linkLabel: tt('Open AI Insights'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Query volume by service — calls/day'),
          xKey: 'name',
          data: SERVICES.map(s => ({ name: s.name.replace('KB_', ''), qday: s.qday })),
          series: [{ key: 'qday', name: tt('Queries/day'), color: BLUE }],
          note: tt('KB_CUSTOMER_KB is the busiest service (4.8K calls/day) — powered by Customer 360 and Snowflake Intelligence.'),
        }}
      />

      {/* ── Tab nav ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map(t => {
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

      {/* ════ OVERVIEW ══════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Services')}          value="6"      delta={tt('all healthy')}        trend="up"   icon={Database}   accent />
          <KpiCard label={tt('Indexed docs')}      value="23.5K"  delta={tt('+1.2K this week')}    trend="up"   icon={FileText}         />
          <KpiCard label={tt('Index size')}        value="1.6 GB" delta={tt('1.76 GB allocated')}  trend="flat" icon={Layers}          />
          <KpiCard label={tt('Calls / day')}       value="14.6K"  delta={tt('+8% vs prior week')}  trend="up"   icon={Activity}        />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('p95 latency')}       value="320 ms" delta={tt('SLA 500ms')}           trend="up"   icon={Clock}           />
          <KpiCard label={tt('Avg cache hit')}     value="78%"    delta={tt('+3 pp vs prior 7d')}   trend="up"   icon={Gauge}           />
          <KpiCard label={tt('Avg Recall@5')}      value={avgRecall} delta={tt('fleet average')}    trend="up"   icon={Brain}           />
          <KpiCard label={tt('Embedding model')}   value="arctic-l-v2" delta={tt('Snowflake-native')} trend="flat" icon={Zap}          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Query volume — all services 14d')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={QUERY_VOLUME}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="customer"   stroke={BLUE}   fill={BLUE}   fillOpacity={0.15} name={tt('Customer KB')}   />
                <Area type="monotone" dataKey="network"    stroke={NAVY}   fill={NAVY}   fillOpacity={0.15} name={tt('Network')}        />
                <Area type="monotone" dataKey="product"    stroke={GREEN}  fill={GREEN}  fillOpacity={0.15} name={tt('Product')}        />
                <Area type="monotone" dataKey="legal"      stroke={AMBER}  fill={AMBER}  fillOpacity={0.15} name={tt('Legal')}          />
                <Area type="monotone" dataKey="regulatory" stroke={PURPLE} fill={PURPLE} fillOpacity={0.15} name={tt('Regulatory')}    />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Latency p50 / p95 / p99 — 24h (ms)')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={LATENCY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" ms" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={500} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLA 500ms', fontSize: 10 }} />
                <Line type="monotone" dataKey="p50" stroke={GREEN}  strokeWidth={2} dot={false} name={tt('p50')} />
                <Line type="monotone" dataKey="p95" stroke={BLUE}   strokeWidth={2} dot={false} name={tt('p95')} />
                <Line type="monotone" dataKey="p99" stroke={PURPLE} strokeWidth={2} dot={false} name={tt('p99')} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Service summary')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Service')}</th>
                    <th className="text-right">{tt('Docs')}</th>
                    <th className="text-right">{tt('Q/day')}</th>
                    <th className="text-right">{tt('Recall@5')}</th>
                    <th className="text-right">{tt('Cache')}</th>
                    <th className="text-left">{tt('Last refresh')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map(s => (
                    <tr key={s.name} className="border-b border-black/5">
                      <td className="py-1.5 font-mono font-semibold text-[11px]">{s.name}</td>
                      <td className="text-right font-mono">{s.docs.toLocaleString()}</td>
                      <td className="text-right font-mono">{s.qday.toLocaleString()}</td>
                      <td className={`text-right font-mono ${s.recall5 < 0.90 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>{s.recall5}</td>
                      <td className="text-right font-mono text-emerald-600">{s.cache_hit}</td>
                      <td className="text-[10px] text-vfes-dark/60">{s.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <div className="space-y-3">
            <Panel title={tt('Quick links')}>
              <div className="space-y-2 text-sm">
                <Link to="/portal/agents"          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"><Search className="w-4 h-4" />{tt('Cortex Agents')}</Link>
                <Link to="/portal/semantic-views"  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"><Eye className="w-4 h-4" />{tt('Semantic Views')}</Link>
                <Link to="/portal/ml-registry"     className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100"><Brain className="w-4 h-4" />{tt('ML Registry')}</Link>
                <Link to="/portal/data-quality"    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"><ShieldCheck className="w-4 h-4" />{tt('Data Quality')}</Link>
                <Link to="/portal/catalog"         className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100"><Database className="w-4 h-4" />{tt('Catalog')}</Link>
                <Link to="/portal/lineage"         className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100"><Layers className="w-4 h-4" />{tt('Data Lineage')}</Link>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Top queries (24h)')}>
          <div className="space-y-2">
            {TOP_QUERIES.map((q, i) => (
              <div key={i} className="flex items-center justify-between border-b border-black/5 pb-2">
                <div className="flex-1">
                  <div className="text-[12px] font-semibold flex items-center gap-1.5"><Search className="w-3 h-3 text-vfes-dark" />"{tt(q.q)}"</div>
                  <div className="text-[10px] text-vfes-dark/55">{q.calls} {tt('calls')} · {tt('hit rate')} {q.hit_rate} · {q.service}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Alert / action items for overview */}
        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title={tt('Action items — recommended improvements')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Service')}</th>
                    <th className="text-left">{tt('Finding')}</th>
                    <th className="text-left">{tt('Action')}</th>
                    <th className="text-left">{tt('Impact')}</th>
                    <th className="text-left">{tt('Priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { svc: 'KB_LEGAL_CONTRACTS',    finding: 'Recall@5 0.82 — lowest in fleet',         action: 'Switch to semantic-sliding chunking', impact: '+14 pp Recall@5', p: 'High'   },
                    { svc: 'KB_REGULATORY_FILINGS', finding: 'MRR 0.74 — below 0.80 target',            action: 'Expand golden eval set to 80 Q',       impact: '+8 pp MRR',      p: 'Medium' },
                    { svc: 'KB_CUSTOMER_KB',        finding: 'Cache hit 78% — improve with TTL tuning', action: 'Increase query cache TTL to 15 min',   impact: '+6 pp cache hit', p: 'Low'   },
                    { svc: 'KB_PRODUCT_CATALOG',    finding: 'Recall@5 0.97 — potential to lead fleet', action: 'Promote as model for others',          impact: 'Fleet avg +2 pp', p: 'Low'   },
                  ].map(r => (
                    <tr key={r.svc} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-[10px] font-semibold">{r.svc.replace('KB_', '')}</td>
                      <td className="text-[10px] text-vfes-dark/70">{tt(r.finding)}</td>
                      <td className="text-[10px]">{tt(r.action)}</td>
                      <td className="text-[10px] text-emerald-600 font-semibold">{tt(r.impact)}</td>
                      <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${r.p === 'High' ? 'bg-red-100 text-red-700' : r.p === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>{tt(r.p)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <Link to="/portal/ai-insights"    className="font-semibold text-vfes-dark hover:underline">{tt('→ AI Insights')}</Link>
                <Link to="/portal/data-quality"   className="font-semibold text-sky-700 hover:underline">{tt('→ Data Quality')}</Link>
                <Link to="/portal/feature-store"  className="font-semibold text-purple-700 hover:underline">{tt('→ Feature Store')}</Link>
              </div>
            </Panel>
          </div>
          <div>
            <Panel title={tt('Index size distribution')}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={SERVICES.map(s => ({ name: s.name.replace('KB_', ''), value: s.mb }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {SERVICES.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ════ SERVICES ══════════════════════════════════════════════════ */}
      {tab === 'services' && (<>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Filter:')}</span>
          {['All', 'CUSTOMER', 'NETWORK', 'LEGAL', 'REGULATORY', 'PRODUCT'].map(f => (
            <button key={f} onClick={() => setServiceFilter(f)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${serviceFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {f}
            </button>
          ))}
        </div>

        <Panel title={tt('Service catalog')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Service')}</th>
                <th className="text-left">{tt('Source table')}</th>
                <th className="text-right">{tt('Docs')}</th>
                <th className="text-right">{tt('Size')}</th>
                <th className="text-left">{tt('Refresh')}</th>
                <th className="text-left">{tt('Model')}</th>
                <th className="text-left">{tt('WH')}</th>
                <th className="text-left">{tt('Last refresh')}</th>
                <th className="text-right">{tt('Cache hit')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(s => (
                <tr key={s.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{s.name}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/70">{s.on}</td>
                  <td className="text-right font-mono">{s.docs.toLocaleString()}</td>
                  <td className="text-right font-mono">{s.mb} MB</td>
                  <td className="text-[10px]">{s.refresh}</td>
                  <td className="font-mono text-[9px] text-vfes-dark/60">{s.model}</td>
                  <td className="font-mono text-[10px]">{s.warehouse}</td>
                  <td className="text-[10px] text-vfes-dark/60">{s.last}</td>
                  <td className="text-right font-mono text-emerald-600">{s.cache_hit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Index freshness — rolling lag (minutes)')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={FRESHNESS_EVENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" min" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={10} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'alert 10min', fontSize: 10 }} />
                <Line type="monotone" dataKey="customer_lag" stroke={BLUE}   strokeWidth={2} dot={false} name={tt('Customer KB lag')} />
                <Line type="monotone" dataKey="network_lag"  stroke={GREEN}  strokeWidth={2} dot={false} name={tt('Network lag')}     />
                <Line type="monotone" dataKey="product_lag"  stroke={AMBER}  strokeWidth={2} dot={false} name={tt('Product lag')}     />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Service SQL reference')}>
            <div className="bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
              <div className="text-vfes-dark/40 text-[9px] uppercase tracking-widest mb-2">{tt('SHOW CORTEX SEARCH SERVICES')}</div>
              <div className="text-amber-300">SHOW CORTEX SEARCH SERVICES IN SCHEMA CBL_AI.SEARCH;</div>
              <div className="mt-2 text-emerald-200">{tt('SELECT')}</div>
              <div className="ml-2">  SNOWFLAKE.CORTEX.SEARCH_PREVIEW(</div>
              <div className="ml-4">    'CBL_AI.SEARCH.KB_CUSTOMER_KB',</div>
              <div className="ml-4">    <span className="text-amber-300">'fibre activation steps'</span>,</div>
              <div className="ml-4">    <span className="text-amber-300">'CONTENT'</span></div>
              <div className="ml-2">  ) AS results;</div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/agents"         className="font-semibold text-vfes-dark hover:underline">{tt('→ Cortex Agents')}</Link>
              <Link to="/portal/ai-spend"       className="font-semibold text-sky-700 hover:underline">{tt('→ AI Spend')}</Link>
              <Link to="/portal/caio"           className="font-semibold text-purple-700 hover:underline">{tt('→ CAIO Dashboard')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ RETRIEVAL QUALITY ═════════════════════════════════════════ */}
      {tab === 'quality' && (<>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Sort:')}</span>
          <button onClick={() => setRecallSort('recall')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${recallSort === 'recall' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By Recall@5')}
          </button>
          <button onClick={() => setRecallSort('qday')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${recallSort === 'qday' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By query volume')}
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Avg Recall@5')}     value={avgRecall} delta={tt('fleet median')}      trend="up"   icon={Brain}  accent />
          <KpiCard label={tt('Avg MRR')}          value="0.83"      delta={tt('target 0.85')}        trend="up"   icon={Activity}      />
          <KpiCard label={tt('Faithfulness avg')} value="91.7%"     delta={tt('golden eval sets')}   trend="up"   icon={CheckCircle2}  />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Recall@5 by service — last eval run')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sortedServices.map(s => ({ name: s.name.replace('KB_', ''), recall: s.recall5 * 100 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" domain={[75, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={88} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine x={90} stroke={AMBER} strokeDasharray="3 3" label={{ value: '90% target', fontSize: 10 }} />
                <Bar dataKey="recall" radius={[0, 4, 4, 0]} name={tt('Recall@5 %')}>
                  {sortedServices.map((s, i) => <Cell key={i} fill={s.recall5 >= 0.90 ? GREEN : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Recall@5 trend — 8 weeks')}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={RECALL_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="w" tick={{ fontSize: 10 }} />
                <YAxis domain={[0.75, 1.00]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.90} stroke={AMBER} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="customer"   stroke={BLUE}   strokeWidth={2} dot={false} name={tt('Customer KB')}   />
                <Line type="monotone" dataKey="network"    stroke={GREEN}  strokeWidth={2} dot={false} name={tt('Network')}        />
                <Line type="monotone" dataKey="legal"      stroke={AMBER}  strokeWidth={2} dot={false} name={tt('Legal')}          />
                <Line type="monotone" dataKey="regulatory" stroke={PURPLE} strokeWidth={2} dot={false} name={tt('Regulatory')}    />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Full eval detail — last run')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Service')}</th>
                <th className="text-right">{tt('Recall@5')}</th>
                <th className="text-right">{tt('MRR')}</th>
                <th className="text-right">{tt('Faithfulness')}</th>
                <th className="text-right">{tt('Hit-rate')}</th>
                <th className="text-left">{tt('Eval set')}</th>
                <th className="text-left">{tt('Link')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['KB_CUSTOMER_KB',        0.94, 0.86, 0.92, 0.91, '120 Q · CSAT golden'],
                ['KB_NETWORK_RUNBOOKS',   0.96, 0.90, 0.94, 0.93, '80 Q · NOC gold'],
                ['KB_LEGAL_CONTRACTS',    0.82, 0.71, 0.86, 0.78, '64 Q · Legal panel'],
                ['KB_REGULATORY_FILINGS', 0.84, 0.74, 0.88, 0.82, '52 Q · Compliance'],
                ['KB_PRODUCT_CATALOG',    0.97, 0.92, 0.95, 0.94, '40 Q · Product team'],
                ['KB_POLICIES_DOCS',      0.91, 0.84, 0.93, 0.89, '36 Q · HR'],
              ].map((r: any) => (
                <tr key={r[0]} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{r[0]}</td>
                  <td className={`text-right font-mono ${r[1] < 0.90 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>{r[1]}</td>
                  <td className="text-right font-mono">{r[2]}</td>
                  <td className="text-right font-mono">{r[3]}</td>
                  <td className="text-right font-mono">{r[4]}</td>
                  <td className="text-[10px] text-vfes-dark/60">{r[5]}</td>
                  <td><Link to="/portal/ai-insights" className="text-[10px] text-vfes-dark hover:underline font-bold">{tt('Details →')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </>)}

      {/* ════ LATENCY ═══════════════════════════════════════════════════ */}
      {tab === 'latency' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('p50 latency')} value="180 ms" delta={tt('vs 195ms prior 7d')} trend="up"   icon={Clock}         accent />
          <KpiCard label={tt('p95 latency')} value="320 ms" delta={tt('SLA 500ms')}          trend="up"   icon={Activity}            />
          <KpiCard label={tt('p99 latency')} value="480 ms" delta={tt('within SLA')}         trend="flat" icon={AlertTriangle}       />
        </div>
        <Panel title={tt('Latency by percentile — 24h (ms)')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={LATENCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="h" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" ms" />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={500} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLA 500ms', fontSize: 10 }} />
              <Line type="monotone" dataKey="p50" stroke={GREEN}  strokeWidth={2.4} dot={false} name={tt('p50')} />
              <Line type="monotone" dataKey="p95" stroke={BLUE}   strokeWidth={2.4} dot={false} name={tt('p95')} />
              <Line type="monotone" dataKey="p99" stroke={PURPLE} strokeWidth={2.4} dot={false} name={tt('p99')} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Cache hit rate trend — 14d')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={CACHE_HIT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis domain={[70, 95]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="customer" stroke={BLUE}  strokeWidth={2} dot={false} name={tt('Customer KB')} />
                <Line type="monotone" dataKey="network"  stroke={GREEN} strokeWidth={2} dot={false} name={tt('Network')}     />
                <Line type="monotone" dataKey="product"  stroke={AMBER} strokeWidth={2} dot={false} name={tt('Product')}     />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Latency by service (p95 ms)')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SERVICES.map(s => ({ name: s.name.replace('KB_', ''), p95: Math.round(280 + scenarioRandom() * 140) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" ms" />
                <Tooltip contentStyle={TS} />
                <ReferenceLine y={500} stroke={AMBER} strokeDasharray="3 3" />
                <Bar dataKey="p95" fill={NAVY} radius={[4, 4, 0, 0]} name={tt('p95 ms')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ EMBEDDINGS ════════════════════════════════════════════════ */}
      {tab === 'embeddings' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Active model')}    value="arctic-l-v2" delta={tt('Snowflake-native')}  trend="flat" icon={Brain}   accent />
          <KpiCard label={tt('Embedding dim')}   value="1,024"       delta={tt('dense vectors')}      trend="flat" icon={Zap}          />
          <KpiCard label={tt('Index rebuild lag')} value="4 h"       delta={tt('on schema change')}   trend="flat" icon={Clock}       />
        </div>
        <Panel title={tt('Embedding model benchmark — Cable Bahamas corpus (200 golden Q)')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Model')}</th>
                <th className="text-right">{tt('Recall@5')}</th>
                <th className="text-right">{tt('Embed latency ms')}</th>
                <th className="text-right">{tt('Model size MB')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {EMBEDDING_BENCH.map(m => (
                <tr key={m.model} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{m.model}</td>
                  <td className={`text-right font-mono ${m.recall5 >= 0.93 ? 'text-emerald-600 font-bold' : ''}`}>{m.recall5}</td>
                  <td className="text-right font-mono">{m.latency_ms}</td>
                  <td className="text-right font-mono">{m.size_mb}</td>
                  <td>
                    {m.model.includes('arctic-embed-l-v2.0')
                      ? <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold uppercase px-1.5 py-0.5 rounded">{tt('Deployed')}</span>
                      : <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold uppercase px-1.5 py-0.5 rounded">{tt('Benchmarked')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Recall@5 vs embed latency — model comparison')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={EMBEDDING_BENCH.map(m => ({ name: m.model.slice(0, 16), recall: m.recall5 * 100, latency: m.latency_ms }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="l" domain={[80, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} unit=" ms" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="recall"  fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Recall@5 %')}      />
                <Bar yAxisId="r" dataKey="latency" fill={SLATE} radius={[4, 4, 0, 0]} name={tt('Embed latency ms')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Embedding notes')}>
            <div className="space-y-3 text-xs text-vfes-dark/70">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900 mb-1">{tt('snowflake-arctic-embed-l-v2.0')}</div>
                <div>{tt('Currently deployed across all 6 services. Snowflake-native — no external API calls, embeddings computed in-warehouse. 1,024-dim dense vectors, cosine similarity.')}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">{tt('Upcoming: arctic-embed-xl-v3.0')}</div>
                <div>{tt('1,536 dimensions. Pilot on KB_LEGAL_CONTRACTS — projected +6 pp Recall@5. GA in Q1-27. Will require full re-index (~4h per service).')}</div>
              </div>
              <div className="mt-3">
                <Link to="/portal/ml-registry"   className="text-xs font-semibold text-sky-700 hover:underline block">{tt('→ ML Registry')}</Link>
                <Link to="/portal/feature-store" className="text-xs font-semibold text-sky-700 hover:underline block mt-1">{tt('→ Feature Store')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ CHUNKING ══════════════════════════════════════════════════ */}
      {tab === 'chunking' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Current strategy')} value="Sentence-aware" delta={tt('deployed')}        trend="up"   icon={FileText} accent />
          <KpiCard label={tt('Avg chunk size')}   value="~380 tok"        delta={tt('adaptive')}         trend="flat" icon={Layers}         />
          <KpiCard label={tt('Re-index time')}    value="4 h"             delta={tt('full corpus')}       trend="flat" icon={Clock}          />
        </div>
        <Panel title={tt('Chunking strategy benchmark — Cable Bahamas corpus')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Strategy')}</th>
                <th className="text-right">{tt('Recall@5')}</th>
                <th className="text-right">{tt('MRR')}</th>
                <th className="text-left">{tt('Notes')}</th>
              </tr>
            </thead>
            <tbody>
              {CHUNK_BENCH.map(c => (
                <tr key={c.strategy} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{tt(c.strategy)}</td>
                  <td className={`text-right font-mono ${c.recall5 >= 0.93 ? 'text-emerald-600 font-bold' : c.recall5 >= 0.90 ? '' : 'text-amber-600'}`}>{c.recall5}</td>
                  <td className="text-right font-mono">{c.mrr}</td>
                  <td className="text-[10px] text-vfes-dark/60">{tt(c.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Recall@5 — chunking strategies')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CHUNK_BENCH.map(c => ({ name: c.strategy.split(' ')[0], recall: c.recall5 * 100, mrr: c.mrr * 100 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="recall" fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Recall@5 %')} />
                <Bar dataKey="mrr"    fill={GREEN} radius={[4, 4, 0, 0]} name={tt('MRR %')}       />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Semantic-sliding pilot — KB_LEGAL_CONTRACTS')}>
            <div className="space-y-3 text-xs text-vfes-dark/70">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">{tt('Current: Sentence-aware (Recall@5 0.82)')}</div>
                <div>{tt('Fixed sentence boundaries break long legal clauses. The model cannot retrieve context that spans clause boundaries.')}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900 mb-1">{tt('Pilot: Semantic-sliding (Recall@5 0.96)')}</div>
                <div>{tt('+14 pp in 30-Q pilot. Sliding window with 20% overlap — clauses stay intact. Re-index ETA 4h. Scheduled for Q3 maintenance window.')}</div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Link to="/portal/data-quality" className="font-semibold text-rose-700 hover:underline">{tt('→ Data Quality')}</Link>
                <Link to="/portal/ai-insights"  className="font-semibold text-vfes-dark hover:underline">{tt('→ AI Insights')}</Link>
                <Link to="/portal/horizon"       className="font-semibold text-sky-700 hover:underline">{tt('→ Horizon')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ USAGE BY APP ══════════════════════════════════════════════ */}
      {tab === 'usage' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Total queries / day')} value={totalQday.toLocaleString()} delta={tt('+8% vs prior week')} trend="up" icon={Activity} accent />
          <KpiCard label={tt('Top consumer')}         value="Snowflake Intelligence"     delta={tt('6.8K calls/day')}   trend="up" icon={Sparkles}      />
          <KpiCard label={tt('Apps integrated')}      value="6"                           delta={tt('active')}           trend="flat" icon={Layers}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Queries by app — calls/day')}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={USAGE_BY_APP} dataKey="qday" nameKey="app" cx="50%" cy="50%" outerRadius={90} label>
                  {USAGE_BY_APP.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Query volume trend — top apps (14d)')}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={QUERY_VOLUME}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="customer" stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('Customer 360 / SI')} />
                <Area type="monotone" dataKey="network"  stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('NOC Dashboard')}     />
                <Area type="monotone" dataKey="product"  stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('B2B / Sales')}       />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('App usage detail')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Application')}</th>
                <th className="text-right">{tt('Q/day')}</th>
                <th className="text-right">{tt('% of total')}</th>
                <th className="text-left">{tt('Primary service')}</th>
                <th className="text-left">{tt('Route')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { app: 'Snowflake Intelligence', qday: 6840, svc: 'KB_CUSTOMER_KB + KB_REGULATORY_FILINGS', route: '/portal/caio'           },
                { app: 'Customer 360',           qday: 3120, svc: 'KB_CUSTOMER_KB',                         route: '/portal/customer-360'    },
                { app: 'NOC Dashboard',          qday: 2140, svc: 'KB_NETWORK_RUNBOOKS',                    route: '/portal/contact-center'  },
                { app: 'B2B / Sales',            qday: 840,  svc: 'KB_LEGAL_CONTRACTS',                     route: '/portal/agents'          },
                { app: 'Compliance portal',      qday: 620,  svc: 'KB_REGULATORY_FILINGS',                  route: '/portal/horizon'         },
                { app: 'Self-serve portal',      qday: 460,  svc: 'KB_CUSTOMER_KB + KB_PRODUCT_CATALOG',    route: '/portal/churn-retention' },
              ].map(r => (
                <tr key={r.app} className="border-b border-black/5">
                  <td className="py-1.5 font-semibold">{tt(r.app)}</td>
                  <td className="text-right font-mono">{r.qday.toLocaleString()}</td>
                  <td className="text-right font-mono">{(r.qday / totalQday * 100).toFixed(0)}%</td>
                  <td className="text-[10px] font-mono text-vfes-dark/70">{r.svc}</td>
                  <td><Link to={r.route} className="text-[10px] text-vfes-dark font-bold hover:underline">{tt('Open →')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </>)}

      {/* ════ MOBILE INDEXES ════════════════════════════════════════════ */}
      {tab === 'mobile' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Mobile indexes')}   value="5"      delta={tt('RAN · GSMA · regs · PIRs')} trend="flat" icon={Smartphone} accent />
          <KpiCard label={tt('Total docs')}        value="18.4K"  delta={tt('vendor manuals + specs')}   trend="up"   icon={FileText}         />
          <KpiCard label={tt('Top query volume')}  value="4.2K/d" delta={tt('RAN_VENDOR_MANUALS')}        trend="up"   icon={Activity}         />
        </div>
        <Panel title={tt('Mobile / RAN knowledge bases')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('Vendor manuals · GSMA · regs · PIRs')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Index')}</th>
                <th>{tt('Description')}</th>
                <th>{tt('Docs')}</th>
                <th>{tt('Size')}</th>
                <th>{tt('Refresh')}</th>
                <th>{tt('Queries / day')}</th>
                <th>{tt('Top user')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_SEARCH_INDEXES.map(idx => (
                <tr key={idx.name} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-semibold">{idx.name}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(idx.description)}</td>
                  <td className="font-mono text-xs">{idx.docs.toLocaleString()}</td>
                  <td className="font-mono text-xs">{idx.sizeGb} GB</td>
                  <td className="font-mono text-xs">{idx.refreshHrs}h</td>
                  <td className="font-mono text-xs font-bold">{idx.queriesDay.toLocaleString()}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(idx.topUser)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-[11px] text-vfes-dark/65">{tt('RAN_VENDOR_MANUALS is the busiest mobile index (4,200 queries/day) — Mobile NOC primary user for runbook lookups during alarms.')}</div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link to="/portal/agents"          className="font-semibold text-sky-700 hover:underline">{tt('→ Cortex Agents')}</Link>
            <Link to="/portal/data-quality"    className="font-semibold text-sky-700 hover:underline">{tt('→ Data Quality')}</Link>
            <Link to="/portal/catalog"         className="font-semibold text-sky-700 hover:underline">{tt('→ Object Catalog')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ── Cross-service correlation panel (always visible in quality/latency/usage) ── */}
      {(tab === 'quality' || tab === 'latency' || tab === 'usage') && (
        <div className="mt-6">
          <Panel title={tt('Service health matrix')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Service')}</th>
                  <th className="text-right">{tt('Docs')}</th>
                  <th className="text-right">{tt('Q/day')}</th>
                  <th className="text-right">{tt('Recall@5')}</th>
                  <th className="text-right">{tt('MRR')}</th>
                  <th className="text-right">{tt('Cache')}</th>
                  <th className="text-right">{tt('p95 ms')}</th>
                  <th className="text-right">{tt('Size MB')}</th>
                  <th className="text-left">{tt('Refresh')}</th>
                  <th className="text-left">{tt('Last')}</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s, si) => {
                  const p95 = [310, 280, 420, 390, 295, 318][si]
                  const mrr = [0.86, 0.90, 0.71, 0.74, 0.92, 0.84][si]
                  return (
                    <tr key={s.name} className="border-b border-black/5 hover:bg-black/5">
                      <td className="py-1.5 font-mono font-semibold text-[10px]">{s.name}</td>
                      <td className="text-right font-mono">{s.docs.toLocaleString()}</td>
                      <td className="text-right font-mono">{s.qday.toLocaleString()}</td>
                      <td className={`text-right font-mono font-bold ${s.recall5 < 0.90 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.recall5}</td>
                      <td className={`text-right font-mono ${mrr < 0.80 ? 'text-amber-600' : ''}`}>{mrr}</td>
                      <td className="text-right font-mono text-emerald-600">{s.cache_hit}</td>
                      <td className={`text-right font-mono ${p95 > 400 ? 'text-amber-600' : ''}`}>{p95}</td>
                      <td className="text-right font-mono">{s.mb}</td>
                      <td className="text-[10px]">{s.refresh}</td>
                      <td className="text-[10px] text-vfes-dark/60">{s.last}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-vfes-dark/50 flex items-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{tt('Recall@5 ≥ 0.90')}</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" />{tt('Recall@5 < 0.90')}</span>
              <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline ml-auto">{tt('→ Data Quality')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Governance anchor ──────────────────────────────────────────── */}
      {tab === 'services' && (
        <div className="mt-6">
          <Panel title={tt('Governance & access control')}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-xs">
                <div className="font-bold text-sm">{tt('Row-access & masking')}</div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-bold text-purple-900 mb-1">{tt('DPA · URCA · URCA cyber')}</div>
                  <div className="text-vfes-dark/70">{tt('All search results pass through the masking pipeline before returning to the agent. PII fields (account number, NIB number, address) are masked to DPA-compliant tokens.')}</div>
                </div>
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                  <div className="font-bold text-sky-900 mb-1">{tt('Row-access policies')}</div>
                  <div className="text-vfes-dark/70">{tt('KB_LEGAL_CONTRACTS enforces row-access by role — Sales can only see their account documents. HR documents are restricted to HR-BP territory.')}</div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Link to="/portal/horizon"   className="font-semibold text-purple-700 hover:underline">{tt('→ Horizon')}</Link>
                  <Link to="/portal/cdo"       className="font-semibold text-sky-700 hover:underline">{tt('→ CDO Dashboard')}</Link>
                  <Link to="/portal/catalog"   className="font-semibold text-amber-700 hover:underline">{tt('→ Catalog')}</Link>
                </div>
              </div>
              <div>
                <div className="font-bold text-sm mb-3">{tt('Service access by role')}</div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                      <th className="text-left py-1.5">{tt('Service')}</th>
                      <th className="text-left">{tt('Roles with access')}</th>
                      <th className="text-left">{tt('Masking')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { svc: 'KB_CUSTOMER_KB',        roles: 'CX, Retention, SI',     mask: 'PII' },
                      { svc: 'KB_NETWORK_RUNBOOKS',   roles: 'NOC, Engineering',       mask: 'None' },
                      { svc: 'KB_LEGAL_CONTRACTS',    roles: 'Legal, B2B Sales',       mask: 'Clauses' },
                      { svc: 'KB_REGULATORY_FILINGS', roles: 'Compliance, Exec',       mask: 'None' },
                      { svc: 'KB_PRODUCT_CATALOG',    roles: 'All authenticated',      mask: 'Pricing' },
                      { svc: 'KB_POLICIES_DOCS',      roles: 'HR-BP (territory)',      mask: 'PII' },
                    ].map(r => (
                      <tr key={r.svc} className="border-b border-black/5">
                        <td className="py-1.5 font-mono text-[10px]">{r.svc.replace('KB_', '')}</td>
                        <td className="text-[10px]">{tt(r.roles)}</td>
                        <td className={`text-[10px] font-bold ${r.mask !== 'None' ? 'text-amber-600' : 'text-vfes-dark/40'}`}>{tt(r.mask)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Eval trends visible in quality tab ─────────────────────────── */}
      {tab === 'quality' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('MRR trend — all services (8w)')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={Array.from({ length: 8 }, (_, i) => ({
                w: `W${i + 1}`,
                customer:   0.84 + Math.sin(i / 3) * 0.02,
                network:    0.88 + Math.sin(i / 4) * 0.02,
                product:    0.90 + Math.sin(i / 5) * 0.015,
                legal:      0.70 + Math.sin(i / 2.5) * 0.03,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="w" tick={{ fontSize: 10 }} />
                <YAxis domain={[0.65, 1.00]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.80} stroke={AMBER} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="customer" stroke={BLUE}   strokeWidth={2} dot={false} name={tt('Customer KB')} />
                <Line type="monotone" dataKey="network"  stroke={GREEN}  strokeWidth={2} dot={false} name={tt('Network')}     />
                <Line type="monotone" dataKey="product"  stroke={AMBER}  strokeWidth={2} dot={false} name={tt('Product')}     />
                <Line type="monotone" dataKey="legal"    stroke={PURPLE} strokeWidth={2} dot={false} name={tt('Legal')}       />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Faithfulness score — per eval set')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SERVICES.map(s => ({ name: s.name.replace('KB_', ''), faith: s.recall5 * 0.97 * 100 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="faith" fill={NAVY} radius={[4, 4, 0, 0]} name={tt('Faithfulness %')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {/* ── Ops log — always visible in mobile tab ─────────────────────── */}
      {tab === 'mobile' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Mobile index query volume trend — 7d')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={Array.from({ length: 7 }, (_, i) => ({
                d: `D${i + 1}`,
                ran_manuals: 3800 + Math.round(Math.sin(i / 3) * 400),
                gsma_specs:  1200 + Math.round(Math.sin(i / 4) * 200),
                oran_docs:   420  + Math.round(Math.sin(i / 5) * 80),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ran_manuals" stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('RAN Manuals')} />
                <Area type="monotone" dataKey="gsma_specs"  stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('GSMA Specs')}  />
                <Area type="monotone" dataKey="oran_docs"   stroke={AMBER} fill={AMBER} fillOpacity={0.2} name={tt('O-RAN Docs')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Mobile index agent integration')}>
            <div className="space-y-2 text-xs text-vfes-dark/70">
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="font-bold text-sky-900 mb-1">{tt('Network Ops Triage Agent → KB_NETWORK_RUNBOOKS + RAN_VENDOR_MANUALS')}</div>
                <div>{tt('84% of mobile index queries come via the NOC agent. On P2+ incidents, the agent automatically cross-references CMTS alarm codes with vendor runbooks.')}</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="font-bold text-purple-900 mb-1">{tt('Open RAN Vendor Interop → ORAN_SPECS + vendor manuals')}</div>
                <div>{tt('Mavenir↔Fujitsu signature verification uses semantic search over O-RAN WG4 conformance test specs — 420 queries/day in pilot.')}</div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Link to="/portal/agents"      className="font-semibold text-sky-700 hover:underline">{tt('→ Cortex Agents')}</Link>
                <Link to="/portal/cdo"         className="font-semibold text-sky-700 hover:underline">{tt('→ CDO Dashboard')}</Link>
                <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('→ AI Insights')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Service changelog — always rendered in services tab ─────────── */}
      {tab === 'services' && (
        <div className="mt-6">
          <Panel title={tt('Service changelog — last 30 days')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Date')}</th>
                  <th className="text-left">{tt('Service')}</th>
                  <th className="text-left">{tt('Change')}</th>
                  <th className="text-left">{tt('By')}</th>
                  <th className="text-left">{tt('Result')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '2026-11-24', svc: 'KB_CUSTOMER_KB',       change: 'Re-index after schema migration',        by: 'AI Platform',  result: 'Recall@5 +2 pp'   },
                  { date: '2026-11-20', svc: 'KB_PRODUCT_CATALOG',   change: 'Added 120 new SKU documents',             by: 'Product DS',   result: 'Docs 704 → 824'    },
                  { date: '2026-11-18', svc: 'KB_NETWORK_RUNBOOKS',  change: 'Added DOCSIS 4.0 runbook chapter',       by: 'Network Eng',  result: 'Docs +48'           },
                  { date: '2026-11-14', svc: 'KB_REGULATORY_FILINGS',change: 'URCA M4 filing indexed',                 by: 'Compliance',   result: 'New doc available'  },
                  { date: '2026-11-10', svc: 'KB_LEGAL_CONTRACTS',   change: 'Commonwealth Bank (demo) renewal contract added',             by: 'B2B Sales',    result: 'Docs +1'            },
                  { date: '2026-11-05', svc: 'KB_POLICIES_DOCS',     change: 'HR policy v3.1 uploaded',                by: 'HR-BP',        result: 'Docs updated'       },
                ].map(r => (
                  <tr key={r.date + r.svc} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px]">{r.date}</td>
                    <td className="font-mono text-[10px] font-semibold">{r.svc.replace('KB_', '')}</td>
                    <td className="text-[10px]">{tt(r.change)}</td>
                    <td className="text-[10px] text-vfes-dark/70">{r.by}</td>
                    <td className="text-[10px] text-emerald-600 font-semibold">{tt(r.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/lineage"     className="font-semibold text-sky-700 hover:underline">{tt('→ Data Lineage')}</Link>
              <Link to="/portal/data-quality" className="font-semibold text-rose-700 hover:underline">{tt('→ Data Quality')}</Link>
              <Link to="/portal/catalog"     className="font-semibold text-purple-700 hover:underline">{tt('→ Catalog')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-black/5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
            <FileText className="w-3 h-3" />
            {tt('Source: SHOW CORTEX SEARCH SERVICES · CORTEX_SEARCH_USAGE · refreshed continuously')}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/portal/agents"         className="font-semibold text-vfes-dark hover:underline">{tt('Agents')}</Link>
            <Link to="/portal/ml-registry"    className="font-semibold text-sky-700 hover:underline">{tt('ML Registry')}</Link>
            <Link to="/portal/ai-spend"       className="font-semibold text-purple-700 hover:underline">{tt('AI Spend')}</Link>
            <Link to="/portal/horizon"        className="font-semibold text-amber-700 hover:underline">{tt('Horizon')}</Link>
            <Link to="/portal/cdo"            className="font-semibold text-sky-700 hover:underline">{tt('CDO')}</Link>
            <Link to="/portal/caio"           className="font-semibold text-purple-700 hover:underline">{tt('CAIO')}</Link>
          </div>
        </div>
        <div className="text-[10px] text-vfes-dark/40 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          {tt('All Cortex Search results pass through DPA masking policies · URCA-compliant data handling · audit trail in CBL_GOV.AUDIT.ACCESS_HISTORY_V')}
        </div>
      </div>
    </div>
  )
}