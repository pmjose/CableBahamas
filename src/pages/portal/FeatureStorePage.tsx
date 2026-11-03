import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Database, Activity, Brain, ChevronRight, Clock, Zap, AlertTriangle, TrendingUp, RefreshCw, GitBranch, Shield } from 'lucide-react'
import { Panel, PageHeader } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend, ReferenceLine, ComposedChart,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

// ─── Static data ──────────────────────────────────────────────────────────────

const ENTITIES = [
  { entity: 'SUBSCRIBER', keys: 'msisdn',       features: 142, views: 8, desc: 'Mobile/fixed line-level', reuse: 94, active: true  },
  { entity: 'HOUSEHOLD',  keys: 'household_id', features:  64, views: 5, desc: 'Convergent account',       reuse: 72, active: true  },
  { entity: 'SITE',       keys: 'cell_id',       features:  88, views: 6, desc: 'RAN cell & energy',       reuse: 58, active: true  },
  { entity: 'CIRCUIT',    keys: 'circuit_id',    features:  41, views: 3, desc: 'B2B / wholesale',         reuse: 42, active: true  },
  { entity: 'DEVICE',     keys: 'imei',          features:  33, views: 2, desc: 'Handset & EIP',           reuse: 31, active: true  },
  { entity: 'PRODUCT',    keys: 'product_id',    features:  28, views: 2, desc: 'Tariff & bundle',         reuse: 18, active: false },
]

const FEATURE_GROUPS = [
  { group: 'churn_risk',        entity: 'SUBSCRIBER', count: 48, pipeline: 'DT',      freshness: '15 min', owner: 'Data Science',     quality: 98 },
  { group: 'clv_signals',       entity: 'SUBSCRIBER', count: 36, pipeline: 'DT',      freshness: '1 h',    owner: 'Data Science',     quality: 96 },
  { group: 'propensity_bundle', entity: 'HOUSEHOLD',  count: 28, pipeline: 'Snowpark', freshness: '1 h',    owner: 'Marketing AI',     quality: 94 },
  { group: 'site_energy',       entity: 'SITE',       count: 22, pipeline: 'Snowpark', freshness: '5 min',  owner: 'Network Ops AI',   quality: 99 },
  { group: 'fraud_signals',     entity: 'SUBSCRIBER', count: 31, pipeline: 'DT',      freshness: 'real-time', owner: 'Fraud & Risk', quality: 97 },
  { group: 'b2b_health',        entity: 'CIRCUIT',    count: 18, pipeline: 'dbt',     freshness: '1 d',    owner: 'B2B Platform',     quality: 91 },
]

const FEATURE_VIEWS = [
  { fv: 'churn_features_v3',    entity: 'SUBSCRIBER', features: 48, freshness: '15 min',   online: true,  skew: 0.4, p99: 12,  calls: 920000 },
  { fv: 'clv_features_v2',      entity: 'SUBSCRIBER', features: 36, freshness: '1 h',      online: true,  skew: 0.2, p99: 18,  calls: 440000 },
  { fv: 'propensity_bundle_v4', entity: 'HOUSEHOLD',  features: 28, freshness: '1 h',      online: true,  skew: 0.6, p99: 22,  calls: 284000 },
  { fv: 'site_energy_v1',       entity: 'SITE',       features: 22, freshness: '5 min',    online: false, skew: 0.1, p99: 0,   calls:      0 },
  { fv: 'fraud_signals_v2',     entity: 'SUBSCRIBER', features: 31, freshness: 'real-time',online: true,  skew: 0.3, p99:  6,  calls: 2100000 },
  { fv: 'b2b_health_v1',        entity: 'CIRCUIT',    features: 18, freshness: '1 d',      online: false, skew: 0.5, p99: 0,   calls:      0 },
]

const CONSUMERS = [
  { model: 'churn_xgb_v7',         fvs: 'churn_risk + clv_signals',       mode: 'online',    latency: '12 ms', calls: 920000, version: 'v7' },
  { model: 'bundle_propensity_v3', fvs: 'propensity_bundle',               mode: 'online',    latency: '18 ms', calls: 284000, version: 'v3' },
  { model: 'fraud_rf_v4',          fvs: 'fraud_signals',                   mode: 'real-time', latency:  '6 ms', calls: 2100000, version: 'v4'},
  { model: 'energy_optimiser_v2',  fvs: 'site_energy',                     mode: 'batch',     latency: 'nightly', calls: 0, version: 'v2' },
  { model: 'b2b_health_scorer_v2', fvs: 'b2b_health',                      mode: 'batch',     latency: 'daily',   calls: 0, version: 'v2' },
  { model: 'clv_nn_v5',            fvs: 'clv_signals + churn_risk',        mode: 'online',    latency: '28 ms', calls: 180000, version: 'v5' },
]

const FEATURE_LIST = [
  { name: 'avg_arpu_90d',           group: 'clv_signals',    type: 'float', freshness: '1 h',      reuse: 4, drift: 0.12, status: 'OK'   },
  { name: 'churn_prob_v3',          group: 'churn_risk',     type: 'float', freshness: '15 min',   reuse: 6, drift: 0.08, status: 'OK'   },
  { name: 'data_usage_delta_30d',   group: 'churn_risk',     type: 'float', freshness: '15 min',   reuse: 5, drift: 0.22, status: 'Watch'},
  { name: 'num_complaints_90d',     group: 'churn_risk',     type: 'int',   freshness: '1 h',      reuse: 3, drift: 0.04, status: 'OK'   },
  { name: 'has_bundled_contract',   group: 'clv_signals',    type: 'bool',  freshness: '1 h',      reuse: 5, drift: 0.01, status: 'OK'   },
  { name: 'fraud_score_rt',         group: 'fraud_signals',  type: 'float', freshness: 'real-time',reuse: 3, drift: 0.09, status: 'OK'   },
  { name: 'cell_congestion_index',  group: 'site_energy',    type: 'float', freshness: '5 min',    reuse: 2, drift: 0.31, status: 'Watch'},
  { name: 'b2b_mrr_delta_q',        group: 'b2b_health',     type: 'float', freshness: '1 d',      reuse: 2, drift: 0.18, status: 'OK'   },
  { name: 'propensity_upsell_tv',   group: 'propensity_bundle', type: 'float', freshness: '1 h',  reuse: 3, drift: 0.42, status: 'Watch'},
  { name: 'roaming_events_7d',      group: 'churn_risk',     type: 'int',   freshness: '1 h',      reuse: 2, drift: 0.06, status: 'OK'   },
  { name: 'energy_pue_site',        group: 'site_energy',    type: 'float', freshness: '5 min',    reuse: 1, drift: 0.14, status: 'OK'   },
  { name: 'device_age_days',        group: 'churn_risk',     type: 'int',   freshness: '1 d',      reuse: 4, drift: 0.03, status: 'OK'   },
]

const FRESHNESS_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  stale: Math.max(0, 3 + Math.round(Math.sin(i / 4) * 2)),
  lag: 12 + Math.round(Math.sin(i / 3.5) * 4),
}))

const DRIFT_TREND = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${29 - i}`,
  features_drifted: Math.round(2 + i * 0.08 + Math.sin(i / 3) * 1.5),
  psi_avg: parseFloat((0.08 + i * 0.002 + Math.sin(i / 5) * 0.02).toFixed(3)),
}))

const LINEAGE = [
  { table: 'SUBSCRIBER_BASE',          downstream: 4, pipelines: 'churn_risk, clv_signals, fraud_signals, churn_risk', latency: '— source' },
  { table: 'churn_features_v3 (FV)',   downstream: 3, pipelines: 'churn_xgb_v7, clv_nn_v5, CEO_BRIEFING_AGENT',         latency: '15 min'   },
  { table: 'clv_features_v2 (FV)',     downstream: 2, pipelines: 'churn_xgb_v7, clv_nn_v5',                              latency: '1 h'      },
  { table: 'propensity_bundle_v4 (FV)',downstream: 1, pipelines: 'bundle_propensity_v3',                                 latency: '1 h'      },
  { table: 'fraud_signals_v2 (FV)',    downstream: 1, pipelines: 'fraud_rf_v4',                                          latency: 'real-time'},
  { table: 'site_energy_v1 (FV)',      downstream: 1, pipelines: 'energy_optimiser_v2',                                  latency: '5 min'    },
]

const COST_DATA = [
  { group: 'churn_risk',         compute: 480, storage: 120, total: 600, calls: 920000 },
  { group: 'fraud_signals',      compute: 380, storage:  80, total: 460, calls: 2100000 },
  { group: 'clv_signals',        compute: 220, storage:  60, total: 280, calls: 440000 },
  { group: 'propensity_bundle',  compute: 180, storage:  40, total: 220, calls: 284000 },
  { group: 'site_energy',        compute: 140, storage:  30, total: 170, calls:       0 },
  { group: 'b2b_health',         compute:  80, storage:  20, total: 100, calls:       0 },
]

const REUSE_TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'][i],
  reuse: 48 + i * 4,
  models: 2 + Math.floor(i * 0.5),
}))

const PIE_ENTITIES = ENTITIES.map((e, i) => ({
  name: e.entity, value: e.features, color: [BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE][i],
}))

type TabId = 'overview' | 'groups' | 'features' | 'entities' | 'freshness' | 'lineage' | 'drift' | 'materialization'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',        label: 'Overview'        },
  { id: 'groups',          label: 'Feature Groups'  },
  { id: 'features',        label: 'Features'        },
  { id: 'entities',        label: 'Entities'        },
  { id: 'freshness',       label: 'Freshness'       },
  { id: 'lineage',         label: 'Lineage'         },
  { id: 'drift',           label: 'Drift'           },
  { id: 'materialization', label: 'Materialization' },
]

const totalFeatures = ENTITIES.reduce((s, e) => s + e.features, 0)

export default function FeatureStorePage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [entityFilter, setEntityFilter] = useState<string>('All')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [groupSort, setGroupSort] = useState<'count' | 'quality'>('count')
  const [featureGroup, setFeatureGroup] = useState<string>('all')
  const [driftSort, setDriftSort] = useState<'drift' | 'reuse'>('drift')
  const [costMetric, setCostMetric] = useState<'total' | 'compute'>('total')
  const [liveTime, setLiveTime] = useState<string>('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const filteredViews = useMemo(
    () => {
      let v = FEATURE_VIEWS
      if (entityFilter !== 'All') v = v.filter(fv => fv.entity === entityFilter)
      if (onlineOnly) v = v.filter(fv => fv.online)
      return v
    },
    [entityFilter, onlineOnly],
  )

  const sortedGroups = useMemo(
    () => [...FEATURE_GROUPS].sort((a, b) => b[groupSort] - a[groupSort]),
    [groupSort],
  )

  const filteredFeatures = useMemo(
    () => featureGroup === 'all' ? FEATURE_LIST : FEATURE_LIST.filter(f => f.group === featureGroup),
    [featureGroup],
  )

  const sortedDrift = useMemo(
    () => {
      const key = driftSort === 'drift' ? 'drift' : 'reuse'
      return [...FEATURE_LIST].sort((a, b) => b[key] - a[key])
    },
    [driftSort],
  )

  const sortedCost = useMemo(
    () => [...COST_DATA].sort((a, b) => b[costMetric] - a[costMetric]),
    [costMetric],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Feature Store')}
        subtitle={tt('Snowflake Feature Store · entities · feature groups · online/offline serving · freshness · drift · lineage · materialization cost')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <span className="bg-vfes-red/10 text-vfes-dark px-2.5 py-1 rounded-full font-bold text-xs">
              {totalFeatures} {tt('features')}
            </span>
          </div>
        }
      />

      {/* ── ML Insight Section ───────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Feature Store intelligence"
        models={[
          { name: 'Drift Detector',         metric: 'recall 0.92', sub: tt('PSI-based feature drift') },
          { name: 'Freshness Monitor',       metric: 'p99 < 20 ms', sub: tt('online store latency SLA') },
          { name: 'Reuse Recommender',       metric: '+40% reuse',  sub: tt('cross-team feature sharing') },
        ]}
        agentLabel={tt('Run Feature Analyst')}
        agentRunningLabel={tt('Scanning…')}
        agentSteps={[
          tt('Scanned all 276 features for PSI drift > 0.20'),
          tt('Identified 3 features needing retraining'),
          tt('Ranked materialization cost by feature group'),
          tt('Suggested 12 new cross-team reuse opportunities'),
        ]}
        agentBlurb={tt('Centralising features in Snowflake Feature Store eliminates dual-serving drift: training data and online lookups share the same materialised tables, so model performance matches offline evaluation exactly.')}
        decision={{
          title: tt('Retrain propensity_bundle — 3 features drifted beyond PSI 0.20'),
          detail: tt('propensity_upsell_tv, cell_congestion_index and data_usage_delta_30d have population stability index > 0.20. propensity_bundle_v3 was trained on Q2-26 data; re-training on current distribution closes the gap before summer churn season.'),
          impact: tt('propensity model +3.1 AUC · churn prevention value BSD 420K'),
          risk: tt('Re-training window: 48h — marketing campaigns should be paused meanwhile'),
          linkTo: '/portal/ml-registry',
          linkLabel: tt('Open ML Registry'),
        }}
        chart={{
          kind: 'line',
          title: tt('Feature drift — PSI average (30 days)'),
          xKey: 'd',
          data: DRIFT_TREND,
          series: [{ key: 'psi_avg', name: tt('Avg PSI'), color: AMBER }],
          note: tt('PSI > 0.20 triggers automatic retraining recommendation.'),
        }}
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { l: tt('Feature groups'),          v: '6'       },
          { l: tt('Total features'),           v: totalFeatures.toString() },
          { l: tt('Online-served views'),      v: '4 / 6'  },
          { l: tt('Entities'),                 v: '6'       },
          { l: tt('Avg freshness'),            v: '< 1 h'  },
          { l: tt('Drifted features'),         v: '3'       },
        ].map(k => (
          <div key={k.l} className="bg-white rounded-xl border border-black/5 p-3">
            <div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{k.l}</div>
            <div className="mt-1 text-xl font-extrabold">{k.v}</div>
          </div>
        ))}
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-vfes-red text-vfes-dark shadow' : 'text-vfes-dark/70 hover:bg-black/5'}`}>
            {tt(t.label)}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total features')}     value={totalFeatures} delta={tt('+24 this quarter')}      trend="up"   icon={Database} accent />
          <KpiCard label={tt('Online-served views')} value="4 / 6"         delta={tt('low-latency serving')}  trend="up"   icon={Activity}        />
          <KpiCard label={tt('Avg freshness')}       value="< 1 h"         delta={tt('most views')}            trend="up"   icon={Clock}           />
          <KpiCard label={tt('Feature reuse rate')}  value="74%"           delta={tt('+8 pp QoQ')}             trend="up"   icon={TrendingUp}      />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Feature distribution by entity')}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={PIE_ENTITIES} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {PIE_ENTITIES.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={tt('Feature groups — count & quality score')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={FEATURE_GROUPS} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 9 }} width={150} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="count"   name={tt('Features')} fill={BLUE}  radius={[0, 4, 4, 0]} />
                <Bar dataKey="quality" name={tt('Quality %')} fill={GREEN} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Feature reuse trend — 12 months')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={REUSE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="reuse" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name={tt('Reuse %')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={tt('Model consumers — feature view usage')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Model')}</th>
                    <th>{tt('Feature views used')}</th>
                    <th>{tt('Mode')}</th>
                    <th className="text-right">{tt('Latency')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CONSUMERS.map(c => (
                    <tr key={c.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs font-bold">{c.model}</td>
                      <td className="text-xs text-vfes-dark/70">{c.fvs}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.mode === 'real-time' ? 'bg-rose-100 text-rose-700' : c.mode === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{tt(c.mode)}</span>
                      </td>
                      <td className="text-right font-mono text-xs">{c.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-vfes-dark/50">
              <Link to="/portal/ml-registry" className="font-semibold text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
              <span>·</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-[#FF4438]/10 to-transparent border border-[#FF4438]/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#11567F] mb-1">{tt('Online Store')}</div>
            <div className="text-2xl font-extrabold text-[#11567F]">4</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('feature views · p99 < 22 ms')}</div>
            <Link to="/portal/ai-insights" className="text-xs font-bold text-[#222128] hover:underline mt-2 inline-block">{tt('AI Insights →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-1">{tt('Batch / Offline')}</div>
            <div className="text-2xl font-extrabold text-[#10B981]">2</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('site_energy + b2b_health')}</div>
            <Link to="/portal/data-engineering" className="text-xs font-bold text-[#10B981] hover:underline mt-2 inline-block">{tt('Data Engineering →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-1">{tt('Drifted features')}</div>
            <div className="text-2xl font-extrabold text-[#F59E0B]">3</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('PSI > 0.20 · retrain flagged')}</div>
            <Link to="/portal/ml-registry" className="text-xs font-bold text-[#F59E0B] hover:underline mt-2 inline-block">{tt('ML Registry →')}</Link>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
          <Brain className="w-3 h-3" /> {tt('source: Snowflake Feature Store · FEATURE_STORE.FEATURE_VIEWS · refreshed every 15 min')}
        </div>
      </>)}

      {/* ══════════════ FEATURE GROUPS ════════════════════════════════════════ */}
      {tab === 'groups' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Feature groups')}   value="6"    delta={tt('across 5 entities')}     trend="flat" icon={Boxes}     accent />
          <KpiCard label={tt('Total features')}   value={totalFeatures} delta={tt('+24 this quarter')} trend="up" icon={Database}       />
          <KpiCard label={tt('Avg quality score')} value="96%" delta={tt('+2 pp QoQ')}              trend="up"   icon={Shield}          />
          <KpiCard label={tt('DT-powered groups')} value="3"   delta={tt('lowest latency pipeline')} trend="flat" icon={Zap}            />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['count', 'quality'] as const).map(k => (
            <button key={k} onClick={() => setGroupSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${groupSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'count' ? tt('Feature count') : tt('Quality score')}
            </button>
          ))}
        </div>

        <Panel title={tt('Feature groups — summary')}>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Group')}</th>
                  <th>{tt('Entity')}</th>
                  <th className="text-right">{tt('Features')}</th>
                  <th>{tt('Pipeline')}</th>
                  <th>{tt('Freshness')}</th>
                  <th>{tt('Owner')}</th>
                  <th className="text-right">{tt('Quality %')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroups.map(g => (
                  <tr key={g.group} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono font-bold text-xs">{g.group}</td>
                    <td className="font-mono text-xs text-vfes-dark/70">{g.entity}</td>
                    <td className="text-right font-mono text-xs">{g.count}</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${g.pipeline === 'DT' ? 'bg-blue-100 text-blue-700' : g.pipeline === 'Snowpark' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{g.pipeline}</span></td>
                    <td className="text-xs text-vfes-dark/70">{g.freshness}</td>
                    <td className="text-xs text-vfes-dark/70">{g.owner}</td>
                    <td className={`text-right font-bold text-xs ${g.quality >= 97 ? 'text-emerald-600' : g.quality >= 93 ? 'text-blue-600' : 'text-amber-600'}`}>{g.quality}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Feature count by group')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sortedGroups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="group" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('Features')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Quality score by group')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sortedGroups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="group" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[85, 100]} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="quality" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Quality %')} />
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
            <span>·</span>
            <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
            <span>·</span>
            <Link to="/portal/ml-registry" className="font-semibold text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Feature group ownership & SLA summary')}>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <KpiCard label={tt('Teams owning groups')} value="5"   delta={tt('Data Sci · Mktg · NOC · Fraud · B2B')} trend="flat" icon={Boxes}     />
              <KpiCard label={tt('DT pipeline groups')}  value="3"   delta={tt('auto-refresh · lowest latency')}       trend="flat" icon={RefreshCw}  />
              <KpiCard label={tt('SLA breaches 30d')}    value="0"   delta={tt('all groups within SLA')}               trend="up"   icon={Shield}     />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Group')}</th>
                    <th>{tt('Owner team')}</th>
                    <th>{tt('Pipeline')}</th>
                    <th className="text-right">{tt('Features')}</th>
                    <th className="text-right">{tt('Quality %')}</th>
                    <th>{tt('SLA freshness')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_GROUPS.map(g => (
                    <tr key={g.group} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono font-bold text-xs">{g.group}</td>
                      <td className="text-xs text-vfes-dark/70">{g.owner}</td>
                      <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${g.pipeline === 'DT' ? 'bg-blue-100 text-blue-700' : g.pipeline === 'Snowpark' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{g.pipeline}</span></td>
                      <td className="text-right font-mono text-xs">{g.count}</td>
                      <td className={`text-right font-bold text-xs ${g.quality >= 97 ? 'text-emerald-600' : g.quality >= 93 ? 'text-blue-600' : 'text-amber-600'}`}>{g.quality}%</td>
                      <td className="text-xs font-mono text-vfes-dark/70">{g.freshness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/cdo" className="font-semibold text-vfes-dark hover:underline">{tt('CDO →')}</Link>
              <span>·</span>
              <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
              <span>·</span>
              <Link to="/portal/semantic-views" className="font-semibold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {tab === 'features' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total features')}  value={totalFeatures} delta={tt('across 6 groups')} trend="up"   icon={Database} accent />
          <KpiCard label={tt('Real-time')}        value="31"            delta={tt('fraud_signals_v2')} trend="flat" icon={Zap}            />
          <KpiCard label={tt('Drifted (PSI>0.2)')} value="3"           delta={tt('retrain flagged')} trend="down" icon={AlertTriangle}   />
          <KpiCard label={tt('Avg reuse')}         value="3.2x"         delta={tt('models per feature')} trend="up" icon={TrendingUp}    />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Group filter:')}</span>
          {['all', ...FEATURE_GROUPS.map(g => g.group)].map(g => (
            <button key={g} onClick={() => setFeatureGroup(g)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${featureGroup === g ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {g === 'all' ? tt('All') : g}
            </button>
          ))}
        </div>

        <Panel title={tt('Feature catalogue')}>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Feature name')}</th>
                  <th>{tt('Group')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Freshness')}</th>
                  <th className="text-right">{tt('Reuse')}</th>
                  <th className="text-right">{tt('Drift (PSI)')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map(f => (
                  <tr key={f.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono text-xs font-bold">{f.name}</td>
                    <td className="font-mono text-xs text-vfes-dark/70">{f.group}</td>
                    <td><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{f.type}</span></td>
                    <td className="text-xs text-vfes-dark/70">{f.freshness}</td>
                    <td className="text-right font-mono text-xs">{f.reuse}x</td>
                    <td className={`text-right font-bold text-xs ${f.drift > 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}>{f.drift.toFixed(2)}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${f.status === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{tt(f.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Feature reuse frequency (top 10)')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={FEATURE_LIST.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={170} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="reuse" fill={BLUE} radius={[0, 4, 4, 0]} name={tt('Reuse count')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('PSI drift score (top 10)')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...FEATURE_LIST].sort((a, b) => b.drift - a.drift).slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} domain={[0, 0.5]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={170} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="drift" name={tt('PSI score')} radius={[0, 4, 4, 0]}>
                    {[...FEATURE_LIST].sort((a, b) => b.drift - a.drift).slice(0, 10).map((f, i) => (
                      <Cell key={i} fill={f.drift > 0.2 ? AMBER : GREEN} />
                    ))}
                  </Bar>
                  <ReferenceLine x={0.2} stroke="#ef4444" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
            <span>·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ ENTITIES ══════════════════════════════════════════════ */}
      {tab === 'entities' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Entities')}          value="6"    delta={tt('telco domain model')}   trend="flat" icon={Boxes}     accent />
          <KpiCard label={tt('Total features')}    value={totalFeatures} delta={tt('+24 this quarter')} trend="up" icon={Database}  />
          <KpiCard label={tt('Online-served')}     value="4 / 6" delta={tt('entities with online FV')} trend="up" icon={Activity} />
          <KpiCard label={tt('Subscriber features')} value="142" delta={tt('largest entity')}       trend="up"   icon={Brain}       />
        </div>

        <Panel title={tt('Entities — Snowflake Feature Store')}>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Entity')}</th>
                  <th className="px-3 py-2">{tt('Join key')}</th>
                  <th className="px-3 py-2">{tt('Description')}</th>
                  <th className="px-3 py-2 text-right">{tt('Features')}</th>
                  <th className="px-3 py-2 text-right">{tt('Views')}</th>
                  <th className="px-3 py-2 text-right">{tt('Reuse %')}</th>
                  <th className="px-3 py-2">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map(e => (
                  <tr key={e.entity} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono font-bold">{e.entity}</td>
                    <td className="px-3 py-2 font-mono text-xs text-vfes-dark/70">{e.keys}</td>
                    <td className="px-3 py-2 text-xs">{tt(e.desc)}</td>
                    <td className="px-3 py-2 text-right font-mono">{e.features}</td>
                    <td className="px-3 py-2 text-right font-mono">{e.views}</td>
                    <td className={`px-3 py-2 text-right font-bold text-xs ${e.reuse >= 80 ? 'text-emerald-600' : e.reuse >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>{e.reuse}%</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${e.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {e.active ? tt('active') : tt('inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Features by entity')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ENTITIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="entity" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="features" name={tt('Features')} radius={[4, 4, 0, 0]}>
                    {ENTITIES.map((_, i) => <Cell key={i} fill={[BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE][i % 6]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Reuse rate by entity')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ENTITIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="entity" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="reuse" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Reuse %')} />
                  <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-vfes-dark font-bold">
            <Brain className="w-3 h-3" /> {tt('SUBSCRIBER entity powers churn, CLV & fraud — single source of truth eliminates feature drift.')} <ChevronRight className="w-3 h-3" />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/customer-360" className="font-semibold text-vfes-dark hover:underline">{tt('Customer 360 →')}</Link>
            <span>·</span>
            <Link to="/portal/churn-retention" className="font-semibold text-vfes-dark hover:underline">{tt('Churn & Retention →')}</Link>
            <span>·</span>
            <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Entity reuse & model consumer matrix')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Entity')}</th>
                    <th className="text-right">{tt('Total features')}</th>
                    <th className="text-right">{tt('Feature views')}</th>
                    <th className="text-right">{tt('Reuse %')}</th>
                    <th>{tt('Primary use cases')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ENTITIES.map(e => (
                    <tr key={e.entity} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono font-bold">{e.entity}</td>
                      <td className="text-right font-mono">{e.features}</td>
                      <td className="text-right font-mono">{e.views}</td>
                      <td className={`text-right font-bold text-xs ${e.reuse >= 80 ? 'text-emerald-600' : e.reuse >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>{e.reuse}%</td>
                      <td className="text-xs text-vfes-dark/60">{tt(e.desc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
              <Link to="/portal/ml-registry" className="font-semibold text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
              <span>·</span>
              <Link to="/portal/ai-spend" className="font-semibold text-vfes-dark hover:underline">{tt('AI Spend →')}</Link>
              <span>·</span>
              <Link to="/portal/agents" className="font-semibold text-vfes-dark hover:underline">{tt('Agents →')}</Link>
              <span>·</span>
              <Link to="/portal/semantic-views" className="font-semibold text-vfes-dark hover:underline">{tt('Semantic Views →')}</Link>
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-vfes-dark/35">{tt('source: Snowflake Feature Store entity registry · refreshed on deployment')}</div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ FRESHNESS ═════════════════════════════════════════════ */}
      {tab === 'freshness' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Real-time features')} value="31"   delta={tt('fraud_signals_v2')}      trend="flat" icon={Zap}      accent />
          <KpiCard label={tt('Sub-15-min features')} value="48"  delta={tt('churn_features_v3')}      trend="flat" icon={Clock}         />
          <KpiCard label={tt('Stale features today')} value="2"  delta={tt('b2b_health — daily lag')} trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('p99 online latency')}   value="22 ms" delta={tt('SLA 30 ms')}           trend="up"   icon={Activity}     />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Entity:')}</span>
          {['All', ...ENTITIES.map(e => e.entity)].map(e => (
            <button key={e} onClick={() => setEntityFilter(e)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${entityFilter === e ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {e}
            </button>
          ))}
          <button onClick={() => setOnlineOnly(!onlineOnly)}
            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ml-2 ${onlineOnly ? 'bg-emerald-600 text-white' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
            {tt('Online only')}
          </button>
        </div>

        <Panel title={tt('Feature views — freshness & serving latency')}>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('Feature view')}</th>
                  <th className="px-3 py-2">{tt('Entity')}</th>
                  <th className="px-3 py-2 text-right">{tt('Features')}</th>
                  <th className="px-3 py-2">{tt('Freshness')}</th>
                  <th className="px-3 py-2">{tt('Serving')}</th>
                  <th className="px-3 py-2 text-right">{tt('p99 ms')}</th>
                  <th className="px-3 py-2 text-right">{tt('Calls MTD')}</th>
                  <th className="px-3 py-2 text-right">{tt('Skew %')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredViews.map(f => (
                  <tr key={f.fv} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2 font-mono text-xs font-bold">{f.fv}</td>
                    <td className="px-3 py-2 font-mono text-xs text-vfes-dark/70">{f.entity}</td>
                    <td className="px-3 py-2 text-right font-mono">{f.features}</td>
                    <td className="px-3 py-2 text-xs">{f.freshness}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{f.online ? tt('online') : tt('offline')}</span></td>
                    <td className={`px-3 py-2 text-right font-mono ${f.p99 > 20 ? 'text-amber-600 font-bold' : f.p99 > 0 ? 'text-emerald-600' : 'text-vfes-dark/40'}`}>{f.p99 > 0 ? f.p99 : '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{f.calls > 0 ? (f.calls >= 1e6 ? (f.calls / 1e6).toFixed(1) + 'M' : (f.calls / 1e3).toFixed(0) + 'K') : '—'}</td>
                    <td className={`px-3 py-2 text-right font-mono ${f.skew > 0.5 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>{f.skew.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Stale features — 30 day count')}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={FRESHNESS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="stale" stroke="#ef4444" strokeWidth={2} dot={false} name={tt('Stale features')} />
                  <ReferenceLine y={4} stroke={AMBER} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Average ingestion lag (minutes)')}</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={FRESHNESS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} unit=" min" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="lag" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name={tt('Avg lag min')} />
                  <ReferenceLine y={15} stroke={AMBER} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
            <span>·</span>
            <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline">{tt('Data Quality →')}</Link>
            <span>·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ LINEAGE ═══════════════════════════════════════════════ */}
      {tab === 'lineage' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Source tables')}     value="3"   delta={tt('SUBSCRIBER_BASE + 2')} trend="flat" icon={Database}  accent />
          <KpiCard label={tt('Feature views')}     value="6"   delta={tt('downstream objects')}  trend="flat" icon={Boxes}           />
          <KpiCard label={tt('Model consumers')}   value="6"   delta={tt('registry models')}      trend="flat" icon={Brain}           />
          <KpiCard label={tt('SUBSCRIBER lineage depth')} value="3" delta={tt('source → FV → model')} trend="flat" icon={GitBranch}  />
        </div>

        <Panel title={tt('Feature lineage — source tables to models')}>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Object')}</th>
                  <th className="text-right">{tt('Downstream consumers')}</th>
                  <th>{tt('Pipeline / models')}</th>
                  <th>{tt('Refresh lag')}</th>
                </tr>
              </thead>
              <tbody>
                {LINEAGE.map(l => (
                  <tr key={l.table} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono text-xs font-bold">{l.table}</td>
                    <td className="text-right font-bold text-xs">{l.downstream}</td>
                    <td className="text-xs text-vfes-dark/70">{l.pipelines}</td>
                    <td className="text-xs font-mono text-vfes-dark/70">{l.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Downstream consumers per object')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={LINEAGE} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="table" type="category" tick={{ fontSize: 8 }} width={180} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="downstream" fill={NAVY} radius={[0, 4, 4, 0]} name={tt('Consumers')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-2">{tt('Feature reuse trend — 12 months')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={REUSE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="reuse" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Reuse %')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" /> {tt('Shared feature views cut model build time 40% and guarantee consistent definitions across teams.')} <ChevronRight className="w-3 h-3" />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/ml-registry" className="font-semibold text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
            <span>·</span>
            <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
            <span>·</span>
            <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ DRIFT ═════════════════════════════════════════════════ */}
      {tab === 'drift' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Features drifted')}  value="3"    delta={tt('PSI > 0.20')}           trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Avg PSI score')}      value="0.11" delta={tt('+0.02 vs prior 30d')}  trend="down" icon={Activity}            />
          <KpiCard label={tt('Retraining triggered')} value="1" delta={tt('propensity_bundle')}    trend="flat" icon={RefreshCw}            />
          <KpiCard label={tt('Models at risk')}     value="2"    delta={tt('bundle_propensity_v3 + clv_nn_v5')} trend="down" icon={Brain} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['drift', 'reuse'] as const).map(k => (
            <button key={k} onClick={() => setDriftSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${driftSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'drift' ? tt('PSI drift') : tt('Reuse count')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('PSI drift trend — 30 days avg')}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={DRIFT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 9 }} interval={4} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="psi_avg" stroke={AMBER} strokeWidth={2} dot={false} name={tt('Avg PSI')} />
                <Bar  yAxisId="r" dataKey="features_drifted" fill="#ef4444" fillOpacity={0.6} name={tt('Features drifted')} />
                <ReferenceLine yAxisId="l" y={0.2} stroke="#ef4444" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={tt('Feature drift scorecard')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Feature')}</th>
                    <th>{tt('Group')}</th>
                    <th className="text-right">{tt('PSI')}</th>
                    <th className="text-right">{tt('Reuse')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrift.map(f => (
                    <tr key={f.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-1.5 font-mono text-xs font-bold">{f.name}</td>
                      <td className="font-mono text-xs text-vfes-dark/70">{f.group}</td>
                      <td className={`text-right font-bold text-xs ${f.drift > 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}>{f.drift.toFixed(2)}</td>
                      <td className="text-right font-mono text-xs">{f.reuse}x</td>
                      <td>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${f.status === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{tt(f.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Drift impact on model consumers')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Model')}</th>
                  <th>{tt('Feature views')}</th>
                  <th>{tt('Drifted features')}</th>
                  <th>{tt('Recommendation')}</th>
                </tr>
              </thead>
              <tbody>
                {CONSUMERS.map(c => {
                  const drifted = FEATURE_LIST.filter(f => f.status === 'Watch' && c.fvs.includes(f.group.replace('_', '_'))).length
                  return (
                    <tr key={c.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 font-mono text-xs font-bold">{c.model}</td>
                      <td className="text-xs text-vfes-dark/70">{c.fvs}</td>
                      <td className={`font-bold text-xs ${drifted > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{drifted}</td>
                      <td className="text-xs">{drifted > 0 ? tt('Schedule retrain') : tt('No action needed')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/ml-registry" className="font-semibold text-vfes-dark hover:underline">{tt('ML Registry →')}</Link>
            <span>·</span>
            <Link to="/portal/ai-insights" className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ MATERIALIZATION ═══════════════════════════════════════ */}
      {tab === 'materialization' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total compute cost')} value="BSD 1,830" delta={tt('credit equivalent')}  trend="up"   icon={Activity} accent />
          <KpiCard label={tt('Largest group')}       value="churn_risk" delta={tt('BSD 600 / month')}  trend="flat" icon={Database}        />
          <KpiCard label={tt('Online refreshes / hr')} value="4"      delta={tt('avg across views')} trend="flat" icon={RefreshCw}      />
          <KpiCard label={tt('Cost / 1M calls')}     value="BSD 0.28"   delta={tt('blended avg')}       trend="up"   icon={Zap}            />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Metric:')}</span>
          {(['total', 'compute'] as const).map(k => (
            <button key={k} onClick={() => setCostMetric(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${costMetric === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'total' ? tt('Total cost') : tt('Compute only')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Materialization cost by feature group · BSD /month')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sortedCost} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="BSD " />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 9 }} width={150} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="compute" name={tt('Compute BSD ')} stackId="a" fill={BLUE}  radius={[0, 0, 0, 0]} />
                <Bar dataKey="storage" name={tt('Storage BSD ')} stackId="a" fill={NAVY}  radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={tt('Online calls vs cost — efficiency')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sortedCost} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 9 }} width={150} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="calls" name={tt('Calls MTD')} fill={GREEN} radius={[0, 4, 4, 0]}>
                  {sortedCost.map((_, i) => <Cell key={i} fill={sortedCost[i].calls > 0 ? GREEN : SLATE} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel title={tt('Materialization scorecard — compute + storage + calls')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Feature group')}</th>
                  <th className="text-right">{tt('Compute BSD ')}</th>
                  <th className="text-right">{tt('Storage BSD ')}</th>
                  <th className="text-right">{tt('Total BSD ')}</th>
                  <th className="text-right">{tt('Calls MTD')}</th>
                  <th className="text-right">{tt('BSD  / 1M calls')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedCost.map(c => (
                  <tr key={c.group} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-mono font-bold text-xs">{c.group}</td>
                    <td className="text-right font-mono text-xs">BSD {c.compute}</td>
                    <td className="text-right font-mono text-xs">BSD {c.storage}</td>
                    <td className="text-right font-bold text-xs">BSD {c.total}</td>
                    <td className="text-right font-mono text-xs">{c.calls > 0 ? (c.calls >= 1e6 ? (c.calls / 1e6).toFixed(1) + 'M' : (c.calls / 1e3).toFixed(0) + 'K') : '—'}</td>
                    <td className="text-right font-mono text-xs text-emerald-600">{c.calls > 0 ? 'BSD ' + ((c.total / c.calls) * 1e6).toFixed(2) : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-vfes-dark/20 font-bold bg-[#fafbfc]">
                  <td className="py-2">{tt('Total')}</td>
                  <td className="text-right font-mono text-xs">BSD {sortedCost.reduce((s, c) => s + c.compute, 0)}</td>
                  <td className="text-right font-mono text-xs">BSD {sortedCost.reduce((s, c) => s + c.storage, 0)}</td>
                  <td className="text-right font-bold text-xs">BSD {sortedCost.reduce((s, c) => s + c.total, 0)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-vfes-dark/50">
            <Link to="/portal/cost" className="font-semibold text-vfes-dark hover:underline">{tt('Cost centre →')}</Link>
            <span>·</span>
            <Link to="/portal/ai-spend" className="font-semibold text-vfes-dark hover:underline">{tt('AI Spend →')}</Link>
            <span>·</span>
            <Link to="/portal/data-engineering" className="font-semibold text-vfes-dark hover:underline">{tt('Data Engineering →')}</Link>
            <span>·</span>
            <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
          </div>
        </Panel>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#FF4438]/5 to-transparent border border-[#FF4438]/15 p-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
            <Brain className="w-3 h-3" /> {tt('source: Snowflake Feature Store · FEATURE_STORE.FEATURE_VIEWS · ACCOUNT_USAGE · refreshed every 15 min')}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/portal/data-engineering" className="text-[10px] font-bold text-[#222128] hover:underline shrink-0">{tt('Data Engineering →')}</Link>
            <Link to="/portal/cost" className="text-[10px] font-bold text-[#222128] hover:underline shrink-0">{tt('Cost →')}</Link>
          </div>
        </div>
      </>)}

    </div>
  )
}


