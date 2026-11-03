import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(3443)
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Brain, CheckCircle2, AlertTriangle, GitBranch, Smartphone,
  Activity, Clock, Zap, Gauge, Layers, ShieldCheck, Database,
  TrendingUp, TrendingDown,
} from 'lucide-react'
import { MOBILE_MODELS } from './_mobile_data'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ReferenceLine, ScatterChart, Scatter,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

const MODELS = [
  { name: 'churn_xgb',          versions: 12, prod: 'v3.1', target: 'WAREHOUSE', task: 'classification', auc: 0.86,  drift_psi: 0.06, last_train: '2025-05-20', owner: 'Ann Vermeulen',  stage: 'prod',    inferences_day: 1200000, framework: 'XGBoost'    },
  { name: 'clv_lgbm',           versions:  8, prod: 'v2.4', target: 'WAREHOUSE', task: 'regression',     mape: 0.084,drift_psi: 0.04, last_train: '2025-05-14', owner: 'Ann Vermeulen',  stage: 'prod',    inferences_day:  840000, framework: 'LightGBM'   },
  { name: 'bundle_lgbm',        versions:  6, prod: 'v1.6', target: 'WAREHOUSE', task: 'multiclass',     auc: 0.82,  drift_psi: 0.08, last_train: '2025-05-12', owner: 'Niels Bodart',   stage: 'prod',    inferences_day:  620000, framework: 'LightGBM'   },
  { name: 'nbo_ranker',         versions:  4, prod: 'v1.2', target: 'SPCS',      task: 'ranking',        ndcg: 0.74, drift_psi: 0.05, last_train: '2025-05-08', owner: 'Niels Bodart',   stage: 'prod',    inferences_day:  380000, framework: 'XGBoost'    },
  { name: 'fraud_detect_iso',   versions:  3, prod: 'v0.9', target: 'WAREHOUSE', task: 'anomaly',        auc: 0.91,  drift_psi: 0.12, last_train: '2025-05-22', owner: 'Lars Bethel',     stage: 'staging', inferences_day:  240000, framework: 'IsolForest' },
  { name: 'arpu_forecast_ts',   versions:  5, prod: 'v1.4', target: 'WAREHOUSE', task: 'forecast',       smape: 0.062,drift_psi:0.03, last_train: '2025-05-18', owner: 'Thomas Knowles', stage: 'prod',    inferences_day:  180000, framework: 'Snowflake'  },
  { name: 'network_alarm_clu',  versions:  2, prod: 'v0.6', target: 'SPCS',      task: 'cluster',        sil: 0.42,  drift_psi: 0.07, last_train: '2025-05-16', owner: 'Network DS',    stage: 'staging', inferences_day:  120000, framework: 'sklearn'    },
  { name: 'doc_extract_arctic', versions:  4, prod: 'v2.1', target: 'WAREHOUSE', task: 'extraction',     f1: 0.93,   drift_psi: 0.04, last_train: '2025-04-30', owner: 'Pieter Knowles',    stage: 'prod',    inferences_day:   84000, framework: 'Snowflake'  },
  { name: 'agent_eval_judge',   versions:  2, prod: 'v1.0', target: 'WAREHOUSE', task: 'llm-judge',      faithfulness: 0.88, drift_psi: 0.02, last_train: '2025-05-02', owner: 'AI platform', stage: 'prod', inferences_day: 24820, framework: 'Snowflake' },
  { name: 'sentiment_arctic',   versions:  3, prod: 'v1.1', target: 'WAREHOUSE', task: 'classification', f1: 0.89,   drift_psi: 0.03, last_train: '2025-05-09', owner: 'CX DS',         stage: 'prod',    inferences_day:   62000, framework: 'Snowflake'  },
  { name: 'churn_xgb_next',     versions:  1, prod: '—',    target: '—',         task: 'classification', auc: 0.88,  drift_psi: 0.00, last_train: '2025-05-22', owner: 'Ann Vermeulen',  stage: 'shadow',  inferences_day:   12000, framework: 'XGBoost'    },
  { name: 'pricing_elasticity', versions:  6, prod: 'v3.2', target: 'WAREHOUSE', task: 'regression',     mape: 0.071,drift_psi: 0.05, last_train: '2025-05-12', owner: 'Pricing DS',    stage: 'prod',    inferences_day:   48000, framework: 'LightGBM'   },
  { name: 'voice_intent_nlu',   versions:  2, prod: 'v0.8', target: 'SPCS',      task: 'classification', f1: 0.91,   drift_psi: 0.06, last_train: '2025-05-04', owner: 'CX DS',         stage: 'prod',    inferences_day:   96000, framework: 'sklearn'    },
  { name: 'b2b_propensity',     versions:  4, prod: 'v1.3', target: 'WAREHOUSE', task: 'classification', auc: 0.79,  drift_psi: 0.09, last_train: '2025-05-15', owner: 'B2B DS',        stage: 'prod',    inferences_day:   36000, framework: 'XGBoost'    },
  { name: 'nps_predictor',      versions:  3, prod: 'v1.1', target: 'WAREHOUSE', task: 'regression',     mape: 0.092,drift_psi: 0.05, last_train: '2025-05-10', owner: 'CX DS',         stage: 'prod',    inferences_day:   28000, framework: 'LightGBM'   },
  { name: 'network_clv_upsell', versions:  2, prod: 'v0.4', target: 'WAREHOUSE', task: 'classification', auc: 0.77,  drift_psi: 0.11, last_train: '2025-05-17', owner: 'Network DS',    stage: 'staging', inferences_day:   18000, framework: 'XGBoost'    },
  { name: 'tariff_recommender', versions:  5, prod: 'v2.0', target: 'WAREHOUSE', task: 'ranking',        ndcg: 0.81, drift_psi: 0.04, last_train: '2025-05-11', owner: 'Product DS',    stage: 'prod',    inferences_day:  220000, framework: 'LightGBM'   },
  { name: 'call_drop_predict',  versions:  2, prod: 'v0.7', target: 'SPCS',      task: 'classification', auc: 0.84,  drift_psi: 0.08, last_train: '2025-05-19', owner: 'Network DS',    stage: 'staging', inferences_day:   44000, framework: 'XGBoost'    },
  { name: 'csat_regressor',     versions:  3, prod: 'v1.2', target: 'WAREHOUSE', task: 'regression',     mape: 0.078,drift_psi: 0.03, last_train: '2025-05-13', owner: 'CX DS',         stage: 'prod',    inferences_day:   32000, framework: 'sklearn'    },
  { name: 'fraud_graph_gnn',    versions:  1, prod: '—',    target: '—',         task: 'classification', auc: 0.94,  drift_psi: 0.00, last_train: '2025-05-21', owner: 'Lars Bethel',     stage: 'shadow',  inferences_day:    8000, framework: 'PyG'        },
  { name: 'energy_optimizer',   versions:  2, prod: 'v0.5', target: 'SPCS',      task: 'optimisation',   mape: 0.055,drift_psi: 0.02, last_train: '2025-05-06', owner: 'Network DS',    stage: 'staging', inferences_day:   14000, framework: 'scipy'      },
  { name: 'handset_upsell',     versions:  4, prod: 'v1.4', target: 'WAREHOUSE', task: 'classification', auc: 0.83,  drift_psi: 0.06, last_train: '2025-05-08', owner: 'Product DS',    stage: 'prod',    inferences_day:  180000, framework: 'XGBoost'    },
  { name: 'contract_value',     versions:  3, prod: 'v1.0', target: 'WAREHOUSE', task: 'regression',     mape: 0.063,drift_psi: 0.04, last_train: '2025-05-15', owner: 'B2B DS',        stage: 'prod',    inferences_day:   22000, framework: 'LightGBM'   },
]

const FEATURE_VIEWS = [
  { fv: 'CUSTOMER_BEHAVIOR_FV',  entities: 'CUSTOMER_ID', features: 42, freshness: '5 min',  online: true  },
  { fv: 'NETWORK_HEALTH_FV',     entities: 'CMTS_ID',     features: 28, freshness: '1 min',  online: true  },
  { fv: 'BILLING_RECENCY_FV',    entities: 'CUSTOMER_ID', features: 18, freshness: 'daily',  online: false },
  { fv: 'AGENT_FEEDBACK_FV',     entities: 'AGENT_NAME',  features: 12, freshness: 'hourly', online: true  },
  { fv: 'B2B_DEAL_FV',           entities: 'OPP_ID',      features: 22, freshness: 'hourly', online: false },
  { fv: 'PRODUCT_PREF_FV',       entities: 'CUSTOMER_ID', features: 34, freshness: '15 min', online: true  },
  { fv: 'NPS_SIGNALS_FV',        entities: 'CUSTOMER_ID', features: 16, freshness: 'daily',  online: false },
  { fv: 'CHURN_SIGNALS_FV',      entities: 'CUSTOMER_ID', features: 28, freshness: '1 h',    online: true  },
]

const DRIFT = Array.from({ length: 30 }, (_, i) => ({
  d: `D${29 - i}`,
  churn:  0.03 + Math.sin(i / 6) * 0.02,
  clv:    0.02 + Math.sin(i / 5) * 0.015,
  bundle: 0.05 + Math.sin(i / 4) * 0.03,
  fraud:  0.06 + Math.sin(i / 3.5) * 0.05,
}))

const INFERENCE_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  prod:    3800000 + Math.round(Math.sin(i / 4) * 200000),
  staging:  120000 + Math.round(Math.sin(i / 3) * 20000),
  shadow:    20000 + Math.round(Math.sin(i / 5) * 5000),
}))

const AB_HISTORY = [
  { w: 'W1', churn_v3: 0.842, churn_v3_1: 0.860 },
  { w: 'W2', churn_v3: 0.843, churn_v3_1: 0.862 },
  { w: 'W3', churn_v3: 0.841, churn_v3_1: 0.864 },
  { w: 'W4', churn_v3: 0.840, churn_v3_1: 0.865 },
  { w: 'W5', churn_v3: 0.839, churn_v3_1: 0.866 },
  { w: 'W6', churn_v3: 0.840, churn_v3_1: 0.868 },
  { w: 'W7', churn_v3: 0.841, churn_v3_1: 0.869 },
  { w: 'W8', churn_v3: 0.841, churn_v3_1: 0.871 },
]

const RETRAINING_TIMELINE = Array.from({ length: 8 }, (_, i) => ({
  m: `M${i + 1}`,
  scheduled: 4 + Math.round(Math.sin(i / 3) * 1),
  triggered:  1 + Math.round(Math.sin(i / 2) * 1),
  failed:     Math.round(scenarioRandom() * 1),
}))

const STAGE_COLORS: Record<string, string> = {
  prod:    'bg-emerald-100 text-emerald-700',
  staging: 'bg-amber-100 text-amber-700',
  shadow:  'bg-sky-100 text-sky-700',
}

// ── Tabs ──────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'registry' | 'drift' | 'inference' | 'ab' | 'features' | 'governance' | 'lineage'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',         icon: Gauge       },
  { id: 'registry',    label: 'Registry',         icon: Database    },
  { id: 'drift',       label: 'Drift monitor',    icon: AlertTriangle },
  { id: 'inference',   label: 'Inference volume', icon: Activity    },
  { id: 'ab',          label: 'A/B testing',      icon: GitBranch   },
  { id: 'features',    label: 'Feature store',    icon: Layers      },
  { id: 'governance',  label: 'Governance',       icon: ShieldCheck },
  { id: 'lineage',     label: 'Model lineage',    icon: GitBranch   },
]

export default function MLRegistryPage() {
  const [tab, setTab]               = useState<TabId>('overview')
  const [selected, setSelected]     = useState(MODELS[0].name)
  const [stageFilter, setStageFilter] = useState('All')
  const [taskFilter, setTaskFilter]   = useState('All')
  const [driftSort, setDriftSort]     = useState<'psi' | 'inferences'>('psi')
  const [liveTime, setLiveTime]       = useState('')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const m = useMemo(() => MODELS.find(x => x.name === selected)!, [selected])

  const filteredModels = useMemo(
    () => MODELS.filter(x =>
      (stageFilter === 'All' || x.stage === stageFilter) &&
      (taskFilter === 'All' || x.task === taskFilter)
    ),
    [stageFilter, taskFilter],
  )

  const sortedDrift = useMemo(
    () => [...MODELS].sort((a, b) =>
      driftSort === 'psi'
        ? b.drift_psi - a.drift_psi
        : b.inferences_day - a.inferences_day
    ),
    [driftSort],
  )

  const totalInferencesDay = useMemo(
    () => MODELS.filter(x => x.stage === 'prod').reduce((s, x) => s + x.inferences_day, 0),
    [],
  )

  const driftAlerts = useMemo(
    () => MODELS.filter(x => x.drift_psi > 0.10).length,
    [],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('ML Registry')}
        subtitle={tt('Snowpark ML registry · 23 models · 4 staging · 3 shadow · drift monitoring · feature store · A/B')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/ai-spend" className="bg-vfes-red text-vfes-dark font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
              <Brain className="w-3.5 h-3.5" /> {tt('AI Spend')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ──────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Model registry intelligence"
        models={[
          { name: 'churn_xgb',          metric: 'AUC 0.86', sub: tt('1.2M inferences/day · drift 0.06') },
          { name: 'fraud_detect_iso',    metric: 'AUC 0.91', sub: tt('PSI 0.12 — drift alert active')   },
          { name: 'doc_extract_arctic',  metric: 'F1 0.93',  sub: tt('agent-tool inference · 84K/day')   },
        ]}
        agentLabel={tt('Run Model Ops Review')}
        agentRunningLabel={tt('Analysing registry…')}
        agentSteps={[
          tt('Scanned all 23 models for drift PSI > 0.10'),
          tt('Found 2 alerts: fraud_detect_iso (PSI 0.12) and network_clv_upsell (PSI 0.11)'),
          tt('Triggered retraining job for fraud_detect_iso — expected 4h completion'),
          tt('Generated model cards and governance reports for quarterly review'),
        ]}
        agentBlurb={tt('All models are trained, versioned, and served from Snowflake — no separate MLOps infrastructure. Model Monitor computes PSI daily; drift alerts feed directly into the agent ops queue.')}
        decision={{
          title: tt('Retrain fraud_detect_iso immediately — PSI 0.12 exceeds 0.10 threshold'),
          detail: tt('Population Stability Index for fraud_detect_iso has been above the 0.10 alert level for 3 consecutive days. The model is deployed at 240K inferences/day, so degraded precision translates directly to missed fraud events.'),
          impact: tt('fraud precision +8% · ~BSD 1.4M prevented fraud exposure'),
          risk: tt('Retraining requires approved fraud labels from the last 60d — Legal approval pending'),
          linkTo: '#/portal/ml-registry',
          linkLabel: tt('Open ML Registry'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Drift PSI — top 8 models (threshold 0.10)'),
          xKey: 'name',
          data: [...MODELS].sort((a, b) => b.drift_psi - a.drift_psi).slice(0, 8).map(x => ({
            name: x.name.split('_')[0],
            psi: x.drift_psi,
          })),
          series: [{ key: 'psi', name: 'Drift PSI', color: AMBER }],
          colorBy: { key: 'psi', high: 0.10, mid: 0.07 },
          note: tt('fraud_detect_iso and network_clv_upsell above threshold — retraining queued.'),
        }}
      />

      {/* ── Alert banner ───────────────────────────────────────────────── */}
      {driftAlerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{driftAlerts} {tt('models with PSI drift > 0.10 — retraining recommended')}</div>
            <div className="text-xs text-amber-800 mt-1">{tt('fraud_detect_iso PSI 0.12 · network_clv_upsell PSI 0.11 · both above 0.10 alert threshold.')}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/portal/data-quality" className="text-xs font-bold text-amber-900 hover:underline">{tt('Data Quality →')}</Link>
          </div>
        </div>
      )}

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
          <KpiCard label={tt('Models total')}          value={String(MODELS.length)}     delta={tt('23 in registry')}   trend="up"   icon={Brain}        accent />
          <KpiCard label={tt('In production')}         value={String(MODELS.filter(x => x.stage === 'prod').length)}    delta={tt('actively serving')} trend="up" icon={CheckCircle2} />
          <KpiCard label={tt('Predictions / day')}     value={`${(totalInferencesDay / 1_000_000).toFixed(1)}M`}       delta={tt('+6% vs prior 7d')} trend="up"  icon={Activity}     />
          <KpiCard label={tt('Drift alerts')}          value={String(driftAlerts)}        delta={tt('PSI > 0.10')}       trend="down" icon={AlertTriangle} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Versions total')}        value={String(MODELS.reduce((s, x) => s + x.versions, 0))} delta={tt('across all models')} trend="flat" icon={GitBranch} />
          <KpiCard label={tt('Feature views')}         value={String(FEATURE_VIEWS.length)} delta={tt('8 views active')} trend="flat" icon={Layers} />
          <KpiCard label={tt('Frameworks')}            value="5"                          delta={tt('XGB · LGBM · Arctic · sklearn · PyG')} trend="flat" icon={Zap} />
          <KpiCard label={tt('Staging models')}        value={String(MODELS.filter(x => x.stage === 'staging').length)} delta={tt('in UAT')} trend="flat" icon={Clock} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Inference volume — prod vs staging vs shadow (14d)')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={INFERENCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="prod"    stroke={BLUE}   fill={BLUE}   fillOpacity={0.2} name={tt('Production')} />
                <Area type="monotone" dataKey="staging" stroke={AMBER}  fill={AMBER}  fillOpacity={0.2} name={tt('Staging')}    />
                <Area type="monotone" dataKey="shadow"  stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} name={tt('Shadow')}     />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Stage distribution')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Production', value: MODELS.filter(x => x.stage === 'prod').length,    color: GREEN  },
                    { name: 'Staging',    value: MODELS.filter(x => x.stage === 'staging').length, color: AMBER  },
                    { name: 'Shadow',     value: MODELS.filter(x => x.stage === 'shadow').length,  color: BLUE   },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[GREEN, AMBER, BLUE].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Registry — top 10 by inference volume')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Model')}</th>
                    <th className="text-left">{tt('Stage')}</th>
                    <th className="text-right">{tt('Inf/day')}</th>
                    <th className="text-right">{tt('Drift PSI')}</th>
                    <th className="text-left">{tt('Task')}</th>
                    <th className="text-left">{tt('Owner')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...MODELS].sort((a, b) => b.inferences_day - a.inferences_day).slice(0, 10).map(x => (
                    <tr key={x.name}
                      className={`border-b border-black/5 cursor-pointer hover:bg-black/5 ${selected === x.name ? 'bg-vfes-red/5' : ''}`}
                      onClick={() => { setSelected(x.name); setTab('registry') }}>
                      <td className="py-1.5 font-mono font-semibold text-[10px]">{x.name}</td>
                      <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STAGE_COLORS[x.stage]}`}>{x.stage}</span></td>
                      <td className="text-right font-mono text-[10px]">{(x.inferences_day / 1000).toFixed(0)}K</td>
                      <td className={`text-right font-mono ${x.drift_psi > 0.10 ? 'text-amber-600 font-bold' : ''}`}>{x.drift_psi}</td>
                      <td className="text-[10px]">{x.task}</td>
                      <td className="text-[10px]">{tt(x.owner)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <div className="space-y-3">
            <Panel title={tt('Quick links')}>
              <div className="space-y-2 text-sm">
                <Link to="/portal/agents"       className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"><Brain className="w-4 h-4" />{tt('Cortex Agents')}</Link>
                <Link to="/portal/cortex-search" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"><Layers className="w-4 h-4" />{tt('Cortex Search')}</Link>
                <Link to="/portal/feature-store" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100"><Database className="w-4 h-4" />{tt('Feature Store')}</Link>
                <Link to="/portal/data-quality"  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"><ShieldCheck className="w-4 h-4" />{tt('Data Quality')}</Link>
                <Link to="/portal/ai-insights"   className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100"><Activity className="w-4 h-4" />{tt('AI Insights')}</Link>
                <Link to="/portal/lineage"       className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100"><GitBranch className="w-4 h-4" />{tt('Data Lineage')}</Link>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ════ REGISTRY ══════════════════════════════════════════════════ */}
      {tab === 'registry' && (<>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Stage:')}</span>
          {['All', 'prod', 'staging', 'shadow'].map(s => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${stageFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {tt(s)}
            </button>
          ))}
          <span className="text-xs text-vfes-dark/40">|</span>
          {['All', 'classification', 'regression', 'ranking', 'forecast', 'anomaly'].map(t => (
            <button key={t} onClick={() => setTaskFilter(t)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${taskFilter === t ? 'bg-vfes-dark text-white' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {t}
            </button>
          ))}
          <span className="text-xs font-mono text-vfes-dark/50 ml-2">{filteredModels.length} {tt('models')}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Panel title={tt('Model registry')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Model')}</th>
                    <th className="text-left">{tt('Stage')}</th>
                    <th className="text-left">{tt('Prod ver')}</th>
                    <th className="text-left">{tt('Target')}</th>
                    <th className="text-left">{tt('Task')}</th>
                    <th className="text-right">{tt('Drift PSI')}</th>
                    <th className="text-left">{tt('Owner')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map(x => (
                    <tr key={x.name}
                      className={`border-b border-black/5 cursor-pointer ${selected === x.name ? 'bg-vfes-red/5' : 'hover:bg-black/5'}`}
                      onClick={() => setSelected(x.name)}>
                      <td className="py-1.5 font-mono font-semibold">{x.name}</td>
                      <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STAGE_COLORS[x.stage]}`}>{x.stage}</span></td>
                      <td className="font-mono">{x.prod}</td>
                      <td className="text-[10px]">{x.target}</td>
                      <td className="text-[10px]">{x.task}</td>
                      <td className={`text-right font-mono ${x.drift_psi > 0.10 ? 'text-amber-600 font-bold' : ''}`}>{x.drift_psi}</td>
                      <td className="text-[10px]">{tt(x.owner)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <div className="mt-4">
              <Panel title={tt('Mobile / RAN models')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('7 models')}</span>}>
                <table className="w-full text-[12px]">
                  <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                    <tr>
                      <th className="py-1.5">{tt('Model')}</th>
                      <th>{tt('Task')}</th>
                      <th>{tt('Accuracy')}</th>
                      <th>{tt('Drift')}</th>
                      <th>{tt('Inferences')}</th>
                      <th>{tt('Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOBILE_MODELS.map(mm => (
                      <tr key={mm.name} className="border-t border-black/5">
                        <td className="py-2 font-mono text-xs font-semibold">{mm.name}</td>
                        <td className="text-[11px] text-vfes-dark/65">{tt(mm.task)}</td>
                        <td className={`font-mono text-xs font-bold ${mm.accuracy >= 0.85 ? 'text-emerald-600' : mm.accuracy >= 0.75 ? 'text-vfes-dark' : 'text-amber-600'}`}>{(mm.accuracy * 100).toFixed(0)}%</td>
                        <td className={`font-mono text-xs ${mm.drift > 0.1 ? 'text-amber-600' : 'text-emerald-600'}`}>{mm.drift.toFixed(2)}</td>
                        <td className="font-mono text-xs">{mm.inferences}</td>
                        <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${mm.status === 'production' ? 'bg-emerald-50 text-emerald-700' : mm.status === 'shadow' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{tt(mm.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Panel title={tt(m.name)}>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Prod version')}</div><div className="font-mono font-bold">{m.prod}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Target')}</div><div className="font-mono">{m.target}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Task')}</div><div>{m.task}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Last train')}</div><div className="font-mono">{m.last_train}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Owner')}</div><div>{tt(m.owner)}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Versions')}</div><div className="font-mono">{m.versions}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Framework')}</div><div className="font-mono">{m.framework}</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-vfes-dark/50 font-bold">{tt('Inf/day')}</div><div className="font-mono">{(m.inferences_day / 1000).toFixed(0)}K</div></div>
              </div>
              <div className="mt-3 bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
                <div className="text-vfes-dark/40 text-[9px] uppercase tracking-widest mb-1">{tt('SQL inference')}</div>
                <div>SELECT</div>
                <div>  CUSTOMER_ID,</div>
                <div className="text-amber-300">  CBL_AI.MODELS.{m.name}!PREDICT(*) AS PRED</div>
                <div>FROM CBL_ANALYTICS.CUSTOMER.CUSTOMER_360;</div>
              </div>
            </Panel>

            <Panel title={tt('Feature store')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Feature view')}</th>
                    <th className="text-left">{tt('Entity')}</th>
                    <th className="text-right">{tt('Feat.')}</th>
                    <th className="text-left">{tt('Fresh')}</th>
                    <th className="text-left">{tt('Online')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_VIEWS.slice(0, 5).map(f => (
                    <tr key={f.fv} className="border-b border-black/5">
                      <td className="py-1.5 font-mono text-[10px]">{f.fv}</td>
                      <td className="font-mono text-[10px]">{f.entities}</td>
                      <td className="text-right font-mono">{f.features}</td>
                      <td className="text-[10px]">{f.freshness}</td>
                      <td>{f.online ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="text-[10px] text-vfes-dark/40">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ════ DRIFT MONITOR ═════════════════════════════════════════════ */}
      {tab === 'drift' && (<>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Sort:')}</span>
          <button onClick={() => setDriftSort('psi')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${driftSort === 'psi' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By PSI')}
          </button>
          <button onClick={() => setDriftSort('inferences')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${driftSort === 'inferences' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By inferences')}
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Drift alerts active')} value={String(driftAlerts)} delta={tt('PSI > 0.10')}       trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('Models monitored')}    value={String(MODELS.filter(x => x.stage === 'prod').length)} delta={tt('daily PSI')} trend="flat" icon={Activity} />
          <KpiCard label={tt('Avg drift PSI')}       value={(MODELS.reduce((s, x) => s + x.drift_psi, 0) / MODELS.length).toFixed(3)} delta={tt('fleet median')} trend="flat" icon={Gauge} />
        </div>
        <Panel title={tt('Drift PSI · 30d — top 4 models')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={DRIFT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0.10} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'alert 0.10', fontSize: 10 }} />
              <Line type="monotone" dataKey="churn"  stroke={BLUE}   strokeWidth={2} dot={false} name={tt('churn_xgb')}         />
              <Line type="monotone" dataKey="clv"    stroke={NAVY}   strokeWidth={2} dot={false} name={tt('clv_lgbm')}           />
              <Line type="monotone" dataKey="bundle" stroke={GREEN}  strokeWidth={2} dot={false} name={tt('bundle_lgbm')}        />
              <Line type="monotone" dataKey="fraud"  stroke={AMBER}  strokeWidth={2} dot={false} name={tt('fraud_detect_iso')}   />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-6">
          <Panel title={tt('Drift PSI ranking — all prod models')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sortedDrift.filter(x => x.stage === 'prod').map(x => ({ name: x.name.split('_')[0], psi: x.drift_psi }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" domain={[0, 0.15]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine x={0.10} stroke={AMBER} strokeDasharray="3 3" />
                <Bar dataKey="psi" radius={[0, 4, 4, 0]} name={tt('Drift PSI')}>
                  {sortedDrift.filter(x => x.stage === 'prod').map((x, i) => (
                    <Cell key={i} fill={x.drift_psi > 0.10 ? '#EF4444' : x.drift_psi > 0.07 ? AMBER : GREEN} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ INFERENCE VOLUME ══════════════════════════════════════════ */}
      {tab === 'inference' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Prod inferences/day')} value={`${(totalInferencesDay / 1_000_000).toFixed(1)}M`} delta={tt('+6%')} trend="up" icon={Activity} accent />
          <KpiCard label={tt('Peak inferences/s')}   value="52.4"   delta={tt('evening peak')}  trend="flat" icon={Zap}    />
          <KpiCard label={tt('SPCS-served models')}  value={String(MODELS.filter(x => x.target === 'SPCS').length)} delta={tt('low-latency')} trend="flat" icon={Gauge} />
        </div>
        <Panel title={tt('Inference volume — 14d')}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={INFERENCE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="prod"    stroke={BLUE}   fill={BLUE}   fillOpacity={0.2} name={tt('Production')} />
              <Area type="monotone" dataKey="staging" stroke={AMBER}  fill={AMBER}  fillOpacity={0.2} name={tt('Staging')}    />
              <Area type="monotone" dataKey="shadow"  stroke={PURPLE} fill={PURPLE} fillOpacity={0.2} name={tt('Shadow')}     />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Inferences/day by model — top 8')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...MODELS].sort((a, b) => b.inferences_day - a.inferences_day).slice(0, 8).map(x => ({ name: x.name.split('_')[0], inf: x.inferences_day / 1000 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="K" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={64} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="inf" fill={NAVY} radius={[0, 4, 4, 0]} name={tt('Inf/day (K)')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Retraining schedule — 8 months')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={RETRAINING_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="scheduled" fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Scheduled')} />
                <Bar dataKey="triggered" fill={AMBER} radius={[4, 4, 0, 0]} name={tt('Drift-triggered')} />
                <Bar dataKey="failed"    fill={SLATE} radius={[4, 4, 0, 0]} name={tt('Failed')}    />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ A/B TESTING ═══════════════════════════════════════════════ */}
      {tab === 'ab' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Active A/B tests')} value="3" delta={tt('churn · b2b · nbo')} trend="flat" icon={GitBranch} accent />
          <KpiCard label={tt('Winner identified')} value="churn_xgb_next" delta={tt('AUC +2 pp')} trend="up" icon={TrendingUp} />
          <KpiCard label={tt('Promotion ETA')}    value="Q3-26"          delta={tt('post UAT')} trend="flat" icon={Clock} />
        </div>
        <Panel title={tt('churn_xgb v3.0 vs churn_xgb_next v3.1 — AUC over 8 weeks')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={AB_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="w" tick={{ fontSize: 10 }} />
              <YAxis domain={[0.83, 0.88]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="churn_v3"   stroke={SLATE} strokeWidth={2}   dot={false} name={tt('v3.0 control')}    />
              <Line type="monotone" dataKey="churn_v3_1" stroke={GREEN} strokeWidth={2.4} dot={false} name={tt('v3.1 challenger')} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-6">
          <Panel title={tt('A/B test registry')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Test name')}</th>
                  <th className="text-left">{tt('Control')}</th>
                  <th className="text-left">{tt('Challenger')}</th>
                  <th className="text-right">{tt('Split')}</th>
                  <th className="text-right">{tt('Weeks')}</th>
                  <th className="text-right">{tt('Δ AUC/MAPE')}</th>
                  <th className="text-left">{tt('Status')}</th>
                  <th className="text-left">{tt('Decision')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { test: 'churn_xgb A/B',      ctrl: 'v3.0', chal: 'v3.1', split: '50/50', weeks: 8, delta: '+0.030 AUC', status: 'Running',  dec: 'Promote v3.1 in Q3' },
                  { test: 'b2b_propensity A/B',  ctrl: 'v1.2', chal: 'v1.3', split: '70/30', weeks: 4, delta: '+0.012 AUC', status: 'Running',  dec: 'Under evaluation'    },
                  { test: 'nbo_ranker A/B',       ctrl: 'v1.1', chal: 'v1.2', split: '50/50', weeks: 6, delta: '+0.018 NDCG', status: 'Running', dec: 'Promote pending QA'  },
                  { test: 'clv_lgbm A/B',         ctrl: 'v2.3', chal: 'v2.4', split: '50/50', weeks: 8, delta: '+0.009 MAPE', status: 'Complete', dec: 'v2.4 promoted Apr'  },
                ].map(r => (
                  <tr key={r.test} className="border-b border-black/5">
                    <td className="py-1.5 font-mono font-semibold text-[10px]">{r.test}</td>
                    <td className="font-mono text-[10px]">{r.ctrl}</td>
                    <td className="font-mono text-[10px]">{r.chal}</td>
                    <td className="text-right font-mono">{r.split}</td>
                    <td className="text-right font-mono">{r.weeks}</td>
                    <td className="text-right font-mono text-emerald-600 font-bold">{r.delta}</td>
                    <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${r.status === 'Running' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{tt(r.status)}</span></td>
                    <td className="text-[10px] text-vfes-dark/70">{tt(r.dec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ════ FEATURE STORE ═════════════════════════════════════════════ */}
      {tab === 'features' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Feature views')}   value={String(FEATURE_VIEWS.length)} delta={tt('8 active')} trend="flat" icon={Layers}   accent />
          <KpiCard label={tt('Total features')}  value={String(FEATURE_VIEWS.reduce((s, f) => s + f.features, 0))} delta={tt('across all views')} trend="flat" icon={Database} />
          <KpiCard label={tt('Online-capable')}  value={String(FEATURE_VIEWS.filter(f => f.online).length)} delta={tt('real-time serving')} trend="flat" icon={Zap} />
        </div>
        <Panel title={tt('Feature views')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Feature view')}</th>
                <th className="text-left">{tt('Entity')}</th>
                <th className="text-right">{tt('Features')}</th>
                <th className="text-left">{tt('Freshness')}</th>
                <th className="text-left">{tt('Online')}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_VIEWS.map(f => (
                <tr key={f.fv} className="border-b border-black/5">
                  <td className="py-1.5 font-mono">{f.fv}</td>
                  <td className="font-mono text-[10px]">{f.entities}</td>
                  <td className="text-right font-mono">{f.features}</td>
                  <td className="text-[10px]">{f.freshness}</td>
                  <td>{f.online ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="text-[10px] text-vfes-dark/40">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Feature count by view')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FEATURE_VIEWS.map(f => ({ name: f.fv.replace('_FV', ''), features: f.features }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="features" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('Features')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Online vs offline feature views')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { name: 'Online',  value: FEATURE_VIEWS.filter(f => f.online).length,  color: GREEN },
                  { name: 'Offline', value: FEATURE_VIEWS.filter(f => !f.online).length, color: SLATE },
                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[GREEN, SLATE].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ GOVERNANCE ════════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Models with model card')} value={String(MODELS.filter(x => x.stage === 'prod').length)} delta={tt('all prod models')} trend="up" icon={ShieldCheck} accent />
          <KpiCard label={tt('DPA-compliant')}         value="100%"  delta={tt('PII features masked')}   trend="up"   icon={CheckCircle2} />
          <KpiCard label={tt('Risk review due')}        value="2"     delta={tt('Q3-26 review cycle')}    trend="flat" icon={AlertTriangle} />
        </div>
        <Panel title={tt('Model governance register')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Model')}</th>
                <th className="text-left">{tt('Owner')}</th>
                <th className="text-left">{tt('Risk level')}</th>
                <th className="text-left">{tt('DPA basis')}</th>
                <th className="text-left">{tt('Last review')}</th>
                <th className="text-left">{tt('Model card')}</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.filter(x => x.stage === 'prod').slice(0, 10).map(x => (
                <tr key={x.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold text-[10px]">{x.name}</td>
                  <td className="text-[10px]">{tt(x.owner)}</td>
                  <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${x.drift_psi > 0.08 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{x.drift_psi > 0.08 ? tt('Medium') : tt('Low')}</span></td>
                  <td className="text-[10px] text-vfes-dark/70">Art. 6(1)(f)</td>
                  <td className="font-mono text-[10px]">2026-Q1</td>
                  <td><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="mt-4 flex items-center gap-4 text-xs">
          <Link to="/portal/horizon"     className="font-semibold text-purple-700 hover:underline">{tt('→ Horizon / Compliance')}</Link>
          <Link to="/portal/cdo"         className="font-semibold text-sky-700 hover:underline">{tt('→ CDO Dashboard')}</Link>
          <Link to="/portal/data-quality" className="font-semibold text-rose-700 hover:underline">{tt('→ Data Quality')}</Link>
          <Link to="/portal/catalog"     className="font-semibold text-amber-700 hover:underline">{tt('→ Object Catalog')}</Link>
        </div>
      </>)}

      {/* ════ LINEAGE ═══════════════════════════════════════════════════ */}
      {tab === 'lineage' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Upstream sources')} value="12" delta={tt('tables + views')} trend="flat" icon={Database}  accent />
          <KpiCard label={tt('Downstream apps')}  value="8"  delta={tt('agents + pipelines')} trend="flat" icon={Layers} />
          <KpiCard label={tt('Lineage depth avg')} value="4.2" delta={tt('hops')} trend="flat" icon={GitBranch} />
        </div>
        <Panel title={tt('Model lineage map — key models')}>
          <div className="space-y-3 text-xs">
            {MODELS.filter(x => x.stage === 'prod').slice(0, 6).map(x => (
              <div key={x.name} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafbfc] border border-black/5">
                <Brain className="w-3.5 h-3.5 text-vfes-dark shrink-0" />
                <span className="font-mono font-semibold flex-1">{x.name}</span>
                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">{x.framework}</span>
                <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">{x.task}</span>
                <Link to="/portal/lineage" className="text-[10px] text-vfes-dark font-bold hover:underline">{tt('View →')}</Link>
              </div>
            ))}
          </div>
        </Panel>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Model → Agent dependencies')}>
            <div className="space-y-2 text-xs">
              {[
                { model: 'churn_xgb',         agent: 'Churn Co-Pilot',    tool: 'shap_explain(customer_id)'  },
                { model: 'doc_extract_arctic', agent: 'Compliance Q&A',   tool: 'kb_regulatory(query)'       },
                { model: 'agent_eval_judge',   agent: 'All agents',       tool: 'eval_judge(response, ref)'  },
                { model: 'sentiment_arctic',   agent: 'Customer Care AI', tool: 'classify_intent(utterance)' },
                { model: 'fraud_detect_iso',   agent: 'Fraud Triage',     tool: 'velocity_check(msisdn)'     },
              ].map(r => (
                <div key={r.model} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafbfc] border border-black/5">
                  <Brain className="w-3 h-3 text-sky-700 shrink-0" />
                  <span className="font-mono text-[10px] font-semibold">{r.model}</span>
                  <span className="text-vfes-dark/50">→</span>
                  <span className="text-[10px] font-semibold">{tt(r.agent)}</span>
                  <span className="font-mono text-[9px] text-vfes-dark/50 ml-auto">{r.tool}</span>
                </div>
              ))}
              <div className="mt-2">
                <Link to="/portal/agents"  className="text-xs font-semibold text-sky-700 hover:underline">{tt('→ Cortex Agents')}</Link>
              </div>
            </div>
          </Panel>
          <Panel title={tt('Model → Feature view dependencies')}>
            <div className="space-y-2 text-xs">
              {[
                { model: 'churn_xgb',          fv: 'CUSTOMER_BEHAVIOR_FV + CHURN_SIGNALS_FV' },
                { model: 'clv_lgbm',            fv: 'CUSTOMER_BEHAVIOR_FV + BILLING_RECENCY_FV' },
                { model: 'nbo_ranker',          fv: 'PRODUCT_PREF_FV + CUSTOMER_BEHAVIOR_FV'  },
                { model: 'b2b_propensity',      fv: 'B2B_DEAL_FV + BILLING_RECENCY_FV'        },
                { model: 'network_alarm_clu',   fv: 'NETWORK_HEALTH_FV'                        },
              ].map(r => (
                <div key={r.model} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafbfc] border border-black/5">
                  <Brain className="w-3 h-3 text-purple-700 shrink-0" />
                  <span className="font-mono text-[10px] font-semibold">{r.model}</span>
                  <span className="text-vfes-dark/50">→</span>
                  <span className="font-mono text-[9px] text-vfes-dark/70 ml-auto">{r.fv}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <Link to="/portal/feature-store" className="text-xs font-semibold text-purple-700 hover:underline">{tt('→ Feature Store')}</Link>
                <Link to="/portal/lineage"       className="text-xs font-semibold text-sky-700 hover:underline">{tt('→ Data Lineage')}</Link>
              </div>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ── Overview extras — model cards + framework breakdown ────────── */}
      {tab === 'overview' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Framework distribution')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { name: 'XGBoost',   value: MODELS.filter(x => x.framework === 'XGBoost').length,   color: BLUE   },
                  { name: 'LightGBM',  value: MODELS.filter(x => x.framework === 'LightGBM').length,  color: NAVY   },
                  { name: 'Snowflake', value: MODELS.filter(x => x.framework === 'Snowflake').length, color: GREEN  },
                  { name: 'sklearn',   value: MODELS.filter(x => x.framework === 'sklearn').length,   color: AMBER  },
                  { name: 'Other',     value: MODELS.filter(x => !['XGBoost','LightGBM','Snowflake','sklearn'].includes(x.framework)).length, color: PURPLE },
                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[BLUE, NAVY, GREEN, AMBER, PURPLE].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Inference/day by task type')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { task: 'classif.',  inf: MODELS.filter(x => x.task === 'classification').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
                { task: 'regression', inf: MODELS.filter(x => x.task === 'regression').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
                { task: 'ranking',   inf: MODELS.filter(x => x.task === 'ranking').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
                { task: 'forecast',  inf: MODELS.filter(x => x.task === 'forecast').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
                { task: 'anomaly',   inf: MODELS.filter(x => x.task === 'anomaly').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
                { task: 'extract',   inf: MODELS.filter(x => x.task === 'extraction').reduce((s, x) => s + x.inferences_day, 0) / 1000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="task" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="K" />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="inf" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('Inf/day (K)')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {/* ── Drift extras ── accuracy scatter ────────────────────────────── */}
      {tab === 'drift' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Drift PSI vs inference volume — prod models')}>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" dataKey="inf" name={tt('Inf/day')} tick={{ fontSize: 10 }} unit="K" />
                <YAxis type="number" dataKey="psi" name={tt('PSI')} tick={{ fontSize: 10 }} domain={[0, 0.15]} />
                <Tooltip contentStyle={TS} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={0.10} stroke={AMBER} strokeDasharray="3 3" />
                <Scatter
                  data={MODELS.filter(x => x.stage === 'prod').map(x => ({ inf: x.inferences_day / 1000, psi: x.drift_psi, name: x.name }))}
                  fill={BLUE} name={tt('Prod models')}>
                  {MODELS.filter(x => x.stage === 'prod').map((x, i) => (
                    <Cell key={i} fill={x.drift_psi > 0.10 ? '#EF4444' : x.drift_psi > 0.07 ? AMBER : GREEN} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Retraining trigger log — last 90 days')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Date')}</th>
                  <th className="text-left">{tt('Model')}</th>
                  <th className="text-left">{tt('Trigger')}</th>
                  <th className="text-right">{tt('PSI before')}</th>
                  <th className="text-right">{tt('PSI after')}</th>
                  <th className="text-left">{tt('Result')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { d: '2026-06-20', model: 'fraud_detect_iso',   trigger: 'Drift alert PSI 0.12', before: 0.12, after: 0.04, result: 'Success — queued' },
                  { d: '2026-06-12', model: 'network_clv_upsell', trigger: 'Drift alert PSI 0.11', before: 0.11, after: null, result: 'In progress'        },
                  { d: '2026-05-28', model: 'bundle_lgbm',        trigger: 'Scheduled (monthly)',  before: 0.07, after: 0.03, result: 'Success'            },
                  { d: '2026-05-14', model: 'churn_xgb',          trigger: 'Scheduled (monthly)',  before: 0.05, after: 0.02, result: 'Success'            },
                  { d: '2026-04-30', model: 'b2b_propensity',     trigger: 'Drift alert PSI 0.10', before: 0.10, after: 0.05, result: 'Success'            },
                  { d: '2026-04-15', model: 'voice_intent_nlu',   trigger: 'Scheduled (quarterly)',before: 0.08, after: 0.03, result: 'Success'            },
                ].map(r => (
                  <tr key={r.d + r.model} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px]">{r.d}</td>
                    <td className="font-mono text-[10px] font-semibold">{r.model}</td>
                    <td className="text-[10px] text-vfes-dark/70">{tt(r.trigger)}</td>
                    <td className="text-right font-mono text-amber-600">{r.before}</td>
                    <td className={`text-right font-mono ${r.after ? 'text-emerald-600' : 'text-vfes-dark/40'}`}>{r.after ?? '—'}</td>
                    <td className="text-[10px] font-semibold text-emerald-700">{tt(r.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* ── Inference extras ── model SQL references ─────────────────── */}
      {tab === 'inference' && (
        <div className="mt-6">
          <Panel title={tt('SQL inference patterns')}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
                <div className="text-white/40 text-[9px] uppercase tracking-widest mb-2">{tt('BATCH INFERENCE — warehouse')}</div>
                <div>SELECT CUSTOMER_ID,</div>
                <div className="text-amber-300">  CBL_AI.MODELS.CHURN_XGB!PREDICT(*) AS PRED</div>
                <div>FROM CBL_ANALYTICS.CUSTOMER.CUSTOMER_360</div>
                <div>WHERE SEGMENT = 'HIGH_CLV';</div>
              </div>
              <div className="bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
                <div className="text-white/40 text-[9px] uppercase tracking-widest mb-2">{tt('REAL-TIME — SPCS endpoint')}</div>
                <div>POST /api/v1/models/nbo_ranker/predict</div>
                <div>{`{`}</div>
                <div className="text-amber-300">  "customer_id": "884122",</div>
                <div className="text-amber-300">  "context": "homepage_visit"</div>
                <div>{`}`}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/agents"         className="font-semibold text-vfes-dark hover:underline">{tt('→ Cortex Agents')}</Link>
              <Link to="/portal/feature-store"  className="font-semibold text-sky-700 hover:underline">{tt('→ Feature Store')}</Link>
              <Link to="/portal/ai-spend"       className="font-semibold text-purple-700 hover:underline">{tt('→ AI Spend')}</Link>
              <Link to="/portal/customer-360"   className="font-semibold text-amber-700 hover:underline">{tt('→ Customer 360')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Governance extras — compliance notes ─────────────────────── */}
      {tab === 'governance' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('DPA & URCA compliance notes')}>
            <div className="space-y-3 text-xs text-vfes-dark/70">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="font-bold text-purple-900 mb-1">{tt('Art. 6(1)(f) — Legitimate Interest')}</div>
                <div>{tt('Churn prediction models process subscriber data under legitimate interest basis. A DPIA was completed Q4-25. Data retention: 13 months rolling.')}</div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="font-bold text-sky-900 mb-1">{tt('URCA M4 — Roaming fairness')}</div>
                <div>{tt('Tariff recommendation model subject to URCA M4 fairness constraint: no roaming-adjacent features may be used. Enforced via feature view allow-list in TARIFF_RECOMMENDER_FV.')}</div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Link to="/portal/horizon"     className="font-semibold text-purple-700 hover:underline">{tt('→ Horizon')}</Link>
                <Link to="/portal/cdo"         className="font-semibold text-sky-700 hover:underline">{tt('→ CDO')}</Link>
                <Link to="/portal/data-quality" className="font-semibold text-rose-700 hover:underline">{tt('→ Data Quality')}</Link>
              </div>
            </div>
          </Panel>
          <Panel title={tt('Audit trail — recent model actions')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Date')}</th>
                  <th className="text-left">{tt('Model')}</th>
                  <th className="text-left">{tt('Action')}</th>
                  <th className="text-left">{tt('By')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { d: '2026-06-24', model: 'churn_xgb',        action: 'Version v3.1 registered',  by: 'Ann Vermeulen'  },
                  { d: '2026-06-22', model: 'fraud_detect_iso',  action: 'Drift alert raised',       by: 'Model Monitor' },
                  { d: '2026-06-20', model: 'bundle_lgbm',       action: 'Deployed to production',   by: 'Niels Bodart'   },
                  { d: '2026-06-18', model: 'doc_extract_arctic',action: 'Model card updated',       by: 'Pieter Knowles'    },
                  { d: '2026-06-14', model: 'agent_eval_judge',  action: 'Eval run completed',       by: 'AI platform'   },
                  { d: '2026-06-10', model: 'pricing_elasticity',action: 'Governance review passed', by: 'Pricing DS'    },
                ].map(r => (
                  <tr key={r.d + r.model} className="border-b border-black/5">
                    <td className="py-1.5 font-mono text-[10px]">{r.d}</td>
                    <td className="font-mono text-[10px] font-semibold">{r.model}</td>
                    <td className="text-[10px]">{tt(r.action)}</td>
                    <td className="text-[10px] text-vfes-dark/70">{r.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* ── Features extras — freshness details ─────────────────────────── */}
      {tab === 'features' && (
        <div className="mt-6">
          <Panel title={tt('Feature view SQL reference')}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
                <div className="text-white/40 text-[9px] uppercase tracking-widest mb-2">{tt('RETRIEVE ONLINE FEATURES')}</div>
                <div>SELECT *</div>
                <div>FROM CBL_AI.FEATURE_STORE.CUSTOMER_BEHAVIOR_FV</div>
                <div className="text-amber-300">WHERE CUSTOMER_ID = '884122'</div>
                <div>  AND AS_OF = SYSDATE();</div>
              </div>
              <div className="bg-[#0f172a] text-emerald-200 font-mono text-[11px] rounded p-3 leading-relaxed">
                <div className="text-white/40 text-[9px] uppercase tracking-widest mb-2">{tt('TRAINING DATASET GENERATION')}</div>
                <div>SELECT fv.*, label.CHURNED</div>
                <div>FROM CBL_AI.FEATURE_STORE.CHURN_SIGNALS_FV fv</div>
                <div>JOIN CBL_ANALYTICS.CHURN.LABELS label</div>
                <div className="text-amber-300">  ON fv.CUSTOMER_ID = label.CUSTOMER_ID</div>
                <div>WHERE label.PERIOD = 'Q1-26';</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <Link to="/portal/lineage"       className="font-semibold text-sky-700 hover:underline">{tt('→ Data Lineage')}</Link>
              <Link to="/portal/data-quality"  className="font-semibold text-rose-700 hover:underline">{tt('→ Data Quality')}</Link>
              <Link to="/portal/catalog"       className="font-semibold text-purple-700 hover:underline">{tt('→ Catalog')}</Link>
              <Link to="/portal/churn-retention" className="font-semibold text-amber-700 hover:underline">{tt('→ Churn & Retention')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── A/B extras — lift analysis ─────────────────────────────────── */}
      {tab === 'ab' && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Statistical significance — churn_xgb A/B')}>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-50 border border-black/10">
                  <div className="font-bold text-vfes-dark/60 text-[10px] uppercase tracking-widest">{tt('Control v3.0')}</div>
                  <div className="text-2xl font-extrabold text-vfes-dark mt-1">0.841</div>
                  <div className="text-[10px] text-vfes-dark/55">AUC · 50% traffic · 8 weeks</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-700 text-[10px] uppercase tracking-widest">{tt('Challenger v3.1')}</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">0.871</div>
                  <div className="text-[10px] text-emerald-600">AUC · 50% traffic · 8 weeks</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="font-bold text-purple-900 mb-1">{tt('Statistical conclusion')}</div>
                <div className="text-vfes-dark/70">{tt('p-value 0.002 (< 0.05) — statistically significant. Δ AUC +0.030 translates to ~BSD 420K additional churn prevented per quarter at current call volumes.')}</div>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <Link to="/portal/churn-retention" className="font-semibold text-sky-700 hover:underline">{tt('→ Churn & Retention')}</Link>
                <Link to="/portal/ai-insights"     className="font-semibold text-vfes-dark hover:underline">{tt('→ AI Insights')}</Link>
                <Link to="/portal/customer-360"    className="font-semibold text-amber-700 hover:underline">{tt('→ Customer 360')}</Link>
              </div>
            </div>
          </Panel>
          <Panel title={tt('Promotion checklist — churn_xgb_next v3.1')}>
            <div className="space-y-2 text-xs">
              {[
                { step: 'Statistical significance confirmed (p < 0.05)', done: true  },
                { step: 'Model card updated and reviewed',                done: true  },
                { step: 'Privacy impact sign-off (DPA refresh)',   done: true  },
                { step: 'Feature view compatibility check',               done: true  },
                { step: 'UAT sign-off by Ann Vermeulen',                   done: false },
                { step: 'Canary rollout (10%) approved',                  done: false },
                { step: 'Full production promotion',                      done: false },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafbfc] border border-black/5">
                  {s.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  <span className={s.done ? 'text-vfes-dark' : 'text-amber-700'}>{tt(s.step)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between flex-wrap gap-4">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
          <Brain className="w-3 h-3" />
          {tt('Source: CBL_AI.MODELS · MODEL_MONITOR · FEATURE_STORE · MODEL_REGISTRY')}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/portal/agents"         className="font-semibold text-vfes-dark hover:underline">{tt('Agents')}</Link>
          <Link to="/portal/cortex-search"  className="font-semibold text-sky-700 hover:underline">{tt('Cortex Search')}</Link>
          <Link to="/portal/ai-spend"       className="font-semibold text-purple-700 hover:underline">{tt('AI Spend')}</Link>
          <Link to="/portal/ai-insights"    className="font-semibold text-amber-700 hover:underline">{tt('AI Insights')}</Link>
          <Link to="/portal/horizon"        className="font-semibold text-purple-700 hover:underline">{tt('Horizon')}</Link>
          <Link to="/portal/catalog"        className="font-semibold text-sky-700 hover:underline">{tt('Catalog')}</Link>
          <Link to="/portal/lineage"        className="font-semibold text-green-700 hover:underline">{tt('Lineage')}</Link>
          <Link to="/portal/cdo"            className="font-semibold text-navy-700 hover:underline">{tt('CDO')}</Link>
          <Link to="/portal/fraud"          className="font-semibold text-rose-700 hover:underline">{tt('Fraud')}</Link>
        </div>
      </div>
    </div>
  )
}