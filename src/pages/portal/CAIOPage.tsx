import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import { DomainGrid, PriorityList, WatchList, AgendaList } from '../../components/ExecCockpit'
import {
  Brain, Bot, Sparkles, Search, Layers, Wallet, Boxes, ShieldCheck, Gauge, Cpu, TrendingUp,
  Activity, Bell, AlertTriangle, BarChart2, Database, GitBranch, FileCheck,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

const stP = (s: string) =>
  s === 'Healthy' || s === 'Pass' || s === 'Active' || s === 'Production' || s === 'Passed'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'Watch' || s === 'Staging' || s === 'Warning' || s === 'Retrain'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

// ── Model Registry ────────────────────────────────────────────────────────────
const modelRegistry = [
  { name: 'Churn Predictor v4',       domain: 'CVM',      type: 'XGBoost',     acc: '87.4%', drift: 'None',    status: 'Production', version: 'v4.2', weekly: 28000 },
  { name: 'CLV Estimator',            domain: 'CVM',      type: 'LightGBM',    acc: '82.1%', drift: 'None',    status: 'Production', version: 'v3.1', weekly: 14400 },
  { name: 'NBA Recommender',          domain: 'Marketing',type: 'DNN',         acc: '79.8%', drift: 'Watch',   status: 'Production', version: 'v2.4', weekly: 88000 },
  { name: 'Fraud Classifier RT',      domain: 'Risk',     type: 'XGBoost',     acc: '94.2%', drift: 'None',    status: 'Production', version: 'v5.0', weekly: 320000 },
  { name: 'Care-Assist Agent',        domain: 'CS',       type: 'Cortex Agent',acc: '99.2%', drift: 'None',    status: 'Production', version: 'v1.3', weekly: 48000 },
  { name: 'Sentiment Classifier',     domain: 'CX',       type: 'Cortex AI',   acc: '91.6%', drift: 'None',    status: 'Production', version: 'v2.1', weekly: 62000 },
  { name: 'Price Elasticity Model',   domain: 'Marketing',type: 'Regression',  acc: '74.2%', drift: 'None',    status: 'Production', version: 'v1.8', weekly:  8200 },
  { name: 'Bundle Propensity v2',     domain: 'Sales',    type: 'LightGBM',    acc: '81.3%', drift: 'None',    status: 'Production', version: 'v2.0', weekly: 22400 },
  { name: 'Network Anomaly Detector', domain: 'Network',  type: 'Autoencoder', acc: '89.7%', drift: 'None',    status: 'Production', version: 'v3.2', weekly: 186000 },
  { name: 'Revenue Forecaster',       domain: 'Finance',  type: 'LSTM',        acc: '92.4%', drift: 'None',    status: 'Production', version: 'v4.1', weekly:  4200 },
  { name: 'Debt Collection Scorer',   domain: 'Finance',  type: 'XGBoost',     acc: '76.8%', drift: 'Retrain', status: 'Watch',      version: 'v2.1', weekly:  6800 },
  { name: 'Capacity Forecaster',      domain: 'Network',  type: 'XGBoost',     acc: '84.6%', drift: 'None',    status: 'Production', version: 'v3.4', weekly: 12200 },
  { name: 'VOC Intent Classifier',    domain: 'CX',       type: 'Cortex AI',   acc: '88.2%', drift: 'None',    status: 'Production', version: 'v1.2', weekly: 18600 },
  { name: 'Energy Sleep Optimizer',   domain: 'Network',  type: 'RL',          acc: '94.1%', drift: 'None',    status: 'Production', version: 'v2.0', weekly:  9800 },
  { name: 'B2B Win-Probability',      domain: 'B2B',      type: 'XGBoost',     acc: '71.4%', drift: 'None',    status: 'Staging',    version: 'v1.0', weekly:     0 },
  { name: 'Spectrum Demand Model',    domain: 'Network',  type: 'Regression',  acc: '78.2%', drift: 'None',    status: 'Production', version: 'v1.8', weekly:  2400 },
  { name: 'MNP Win-Back Predictor',   domain: 'Sales',    type: 'LightGBM',    acc: '80.4%', drift: 'None',    status: 'Production', version: 'v2.2', weekly: 16400 },
  { name: 'Content Recommendation',  domain: 'Marketing', type: 'Matrix Factorization', acc: '76.8%', drift: 'None', status: 'Production', version: 'v1.4', weekly: 42000 },
  { name: 'Regulatory Risk Scorer',   domain: 'Risk',     type: 'Rule+ML',     acc: '95.4%', drift: 'None',    status: 'Production', version: 'v2.8', weekly:  1800 },
  { name: 'Inventory Demand Forecast',domain: 'Ops',      type: 'XGBoost',     acc: '83.6%', drift: 'None',    status: 'Production', version: 'v2.0', weekly:  4800 },
  { name: 'QoE Predictor',            domain: 'Network',  type: 'XGBoost',     acc: '86.8%', drift: 'None',    status: 'Production', version: 'v3.1', weekly: 124000 },
  { name: 'Revenue Leakage Detector', domain: 'Finance',  type: 'Isolation Forest', acc: '91.2%', drift: 'None', status: 'Production', version: 'v1.6', weekly:  6400 },
  { name: 'PII Auto-Classifier',      domain: 'Governance',type: 'NLP',        acc: '99.8%', drift: 'None',    status: 'Production', version: 'v4.0', weekly: 28000 },
]

const modelsByDomain = [
  { domain: 'CVM',         count: 2, weekly: 42400, color: BLUE   },
  { domain: 'Marketing',   count: 3, weekly: 72200, color: AMBER  },
  { domain: 'Network',     count: 5, weekly: 334400, color: NAVY  },
  { domain: 'Risk',        count: 2, weekly: 321800, color: PURPLE },
  { domain: 'Finance',     count: 3, weekly: 17400, color: GREEN  },
  { domain: 'Sales',       count: 2, weekly: 22400, color: SLATE  },
  { domain: 'CX',          count: 2, weekly: 80600, color: BLUE   },
]

const modelPerf = [
  { m: 'Jun', production: 18, accuracy: 83.4, drift: 3 },
  { m: 'Jul', production: 19, accuracy: 84.2, drift: 2 },
  { m: 'Aug', production: 20, accuracy: 84.8, drift: 2 },
  { m: 'Sep', production: 21, accuracy: 85.4, drift: 1 },
  { m: 'Oct', production: 22, accuracy: 86.1, drift: 1 },
  { m: 'Nov', production: 23, accuracy: 86.8, drift: 0 },
]

// ── Cortex Agents ─────────────────────────────────────────────────────────────
const agentInventory = [
  { name: 'Care-Assist',         domain: 'CS',       calls7d: 48000,  p95ms: 3200, success: 99.2, tools: 6,  status: 'Production' },
  { name: 'Network Planner',     domain: 'Network',  calls7d: 12800,  p95ms: 4800, success: 97.8, tools: 8,  status: 'Production' },
  { name: 'Sales Advisor',       domain: 'Sales',    calls7d:  9200,  p95ms: 3600, success: 98.4, tools: 5,  status: 'Production' },
  { name: 'Finance Assistant',   domain: 'Finance',  calls7d:  6400,  p95ms: 2800, success: 99.4, tools: 4,  status: 'Production' },
  { name: 'BI Analyst Agent',    domain: 'Analytics',calls7d: 82400,  p95ms: 4200, success: 96.8, tools: 7,  status: 'Production' },
  { name: 'Fraud Investigator',  domain: 'Risk',     calls7d:  4800,  p95ms: 5400, success: 98.8, tools: 9,  status: 'Production' },
  { name: 'B2B Deal Analyst',    domain: 'B2B',      calls7d:  3200,  p95ms: 3800, success: 97.2, tools: 5,  status: 'Staging'    },
  { name: 'Regulatory Checker',  domain: 'Risk',     calls7d:  1600,  p95ms: 6200, success: 99.6, tools: 6,  status: 'Production' },
  { name: 'CX Insights Agent',   domain: 'CX',       calls7d: 28000,  p95ms: 3400, success: 98.2, tools: 5,  status: 'Production' },
  { name: 'Capacity Planner',    domain: 'Network',  calls7d:  4800,  p95ms: 5800, success: 97.4, tools: 7,  status: 'Production' },
  { name: 'HR Self-Serve',       domain: 'HR',       calls7d: 11200,  p95ms: 2400, success: 99.8, tools: 3,  status: 'Production' },
  { name: 'Network NOC Copilot', domain: 'Network',  calls7d: 18400,  p95ms: 3200, success: 98.6, tools: 8,  status: 'Production' },
]
const totalCalls7d = agentInventory.reduce((s, a) => s + a.calls7d, 0)

const agentCallsTrend = [
  { d: 'Mon', calls: 56200 }, { d: 'Tue', calls: 60400 }, { d: 'Wed', calls: 58800 },
  { d: 'Thu', calls: 62400 }, { d: 'Fri', calls: 64800 }, { d: 'Sat', calls: 48200 }, { d: 'Sun', calls: 44800 },
]

const agentCallsMonthly = [
  { m: 'Jun', calls: 1.42, success: 96.4 }, { m: 'Jul', calls: 1.58, success: 97.2 },
  { m: 'Aug', calls: 1.68, success: 97.8 }, { m: 'Sep', calls: 1.82, success: 98.2 },
  { m: 'Oct', calls: 1.96, success: 98.8 }, { m: 'Nov', calls: 2.12, success: 99.0 },
]

// ── Cortex Search & Analyst ────────────────────────────────────────────────────
const searchServices = [
  { name: 'Knowledge Base RAG',    docs: 28400, queries7d: 14200, p95ms: 280, recall: 94.2, status: 'Active' },
  { name: 'Product Catalog Search',docs: 12800, queries7d: 88000, p95ms: 180, recall: 96.8, status: 'Active' },
  { name: 'Regulatory Docs Search',docs:  4200, queries7d:  2800, p95ms: 320, recall: 97.4, status: 'Active' },
  { name: 'NOC Runbook Search',    docs:  1840, queries7d: 18400, p95ms: 240, recall: 92.8, status: 'Active' },
  { name: 'Contract Clauses RAG',  docs:  9600, queries7d:  6400, p95ms: 290, recall: 95.6, status: 'Active' },
]

const semanticViews = [
  { view: 'Customer KPIs',     tables: 8,  metrics: 24, filters: 12, queries7d: 4200, status: 'Active' },
  { view: 'Network Health',    tables: 6,  metrics: 18, filters:  8, queries7d: 6800, status: 'Active' },
  { view: 'Revenue Analytics', tables: 5,  metrics: 22, filters: 10, queries7d: 3400, status: 'Active' },
  { view: 'Sales Pipeline',    tables: 4,  metrics: 14, filters:  6, queries7d: 2800, status: 'Active' },
  { view: 'Finance Summary',   tables: 7,  metrics: 20, filters:  9, queries7d: 2200, status: 'Active' },
  { view: 'HR People View',    tables: 3,  metrics: 10, filters:  4, queries7d:  800, status: 'Active' },
]

// ── AI Spend & ROI ────────────────────────────────────────────────────────────
const aiSpendByUseCase = [
  { uc: 'Care-Assist',       monthly: 8200,  value: 38400,  roi: 4.68, color: BLUE   },
  { uc: 'NBA Engine',        monthly: 4800,  value: 18200,  roi: 3.79, color: GREEN  },
  { uc: 'Fraud Classifier',  monthly: 3400,  value: 42800,  roi: 12.59, color: PURPLE },
  { uc: 'BI Analyst Agent',  monthly: 6200,  value: 14400,  roi: 2.32, color: AMBER  },
  { uc: 'Churn Predictor',   monthly: 2800,  value: 24600,  roi: 8.79, color: NAVY   },
  { uc: 'Network Anomaly',   monthly: 2200,  value:  8800,  roi: 4.0,  color: SLATE  },
]

const spendTrend = [
  { m: 'Jun', cortex: 28400, value: 82000 }, { m: 'Jul', cortex: 30200, value: 88000 },
  { m: 'Aug', cortex: 32400, value: 94000 }, { m: 'Sep', cortex: 34800, value: 102000 },
  { m: 'Oct', cortex: 36200, value: 114000 }, { m: 'Nov', cortex: 38000, value: 124000 },
]

const costPerCall = [
  { m: 'Jun', cpp: 0.062 }, { m: 'Jul', cpp: 0.058 }, { m: 'Aug', cpp: 0.056 },
  { m: 'Sep', cpp: 0.054 }, { m: 'Oct', cpp: 0.052 }, { m: 'Nov', cpp: 0.051 },
]

// ── Responsible AI / AI governance policy ─────────────────────────────────────────────────
const raiChecklist = [
  { check: 'High-risk classification completed (AI policy)', status: 'Pass',   owner: 'AI Governance', due: 'Done'    },
  { check: 'Technical documentation for Tier-1 models',             status: 'Pass',   owner: 'ML Platform',   due: 'Done'    },
  { check: 'Human oversight mechanism — credit scoring',            status: 'Pass',   owner: 'Risk',          due: 'Done'    },
  { check: 'Bias & fairness audit — Churn Predictor',               status: 'Pass',   owner: 'AI Governance', due: 'Done'    },
  { check: 'Training data documentation (Art. 10)',                  status: 'Pass',   owner: 'CDO',           due: 'Done'    },
  { check: 'Conformity assessment — Care-Assist agent',             status: 'Watch',  owner: 'AI Governance', due: '31 Jul'  },
  { check: 'Post-market monitoring plan — all Tier-1',              status: 'Watch',  owner: 'ML Platform',   due: '15 Aug'  },
  { check: 'Incident reporting procedure (Art. 62)',                 status: 'Watch',  owner: 'Legal',         due: '31 Aug'  },
  { check: 'Transparency disclosure to end users',                  status: 'Pass',   owner: 'Product',       due: 'Done'    },
  { check: 'Model cards scenario for all production models',        status: 'Retrain',owner: 'ML Platform',   due: '30 Jul'  },
]

const raiScore = [
  { q: 'Q1-26', score: 62 }, { q: 'Q2-26', score: 71 },
  { q: 'Q3-26', score: 82 }, { q: 'Q4-26', score: 88 },
]

// ── Feature Store ─────────────────────────────────────────────────────────────
const featureGroups = [
  { group: 'Customer Behaviour',  features: 84, models: 6, freshness: '<1h',   consumers: 8, status: 'Active' },
  { group: 'Network Telemetry',   features: 62, models: 5, freshness: '<15min',consumers: 6, status: 'Active' },
  { group: 'Transaction Signals', features: 48, models: 4, freshness: '<5min', consumers: 5, status: 'Active' },
  { group: 'Propensity Signals',  features: 36, models: 3, freshness: '<4h',   consumers: 4, status: 'Active' },
  { group: 'Device & Usage',      features: 28, models: 2, freshness: 'daily', consumers: 3, status: 'Active' },
  { group: 'Geospatial',          features: 18, models: 1, freshness: 'daily', consumers: 2, status: 'Active' },
]

const featureGrowth = [
  { m: 'Jun', features: 228, groups: 5 }, { m: 'Jul', features: 244, groups: 5 },
  { m: 'Aug', features: 258, groups: 6 }, { m: 'Sep', features: 268, groups: 6 },
  { m: 'Oct', features: 274, groups: 6 }, { m: 'Nov', features: 276, groups: 6 },
]

// ── Drift / Monitoring ────────────────────────────────────────────────────────
const driftMonitor = [
  { model: 'Churn Predictor v4',       psi: 0.02, jsd: 0.01, alert: 'None',    lastChecked: '1h',  status: 'Pass'   },
  { model: 'NBA Recommender',          psi: 0.14, jsd: 0.08, alert: 'Feature', lastChecked: '2h',  status: 'Watch'  },
  { model: 'Fraud Classifier RT',      psi: 0.01, jsd: 0.00, alert: 'None',    lastChecked: '1h',  status: 'Pass'   },
  { model: 'CLV Estimator',            psi: 0.03, jsd: 0.02, alert: 'None',    lastChecked: '4h',  status: 'Pass'   },
  { model: 'QoE Predictor',            psi: 0.05, jsd: 0.03, alert: 'None',    lastChecked: '1h',  status: 'Pass'   },
  { model: 'Debt Collection Scorer',   psi: 0.22, jsd: 0.14, alert: 'Concept', lastChecked: '4h',  status: 'Retrain'},
  { model: 'Network Anomaly Detector', psi: 0.04, jsd: 0.02, alert: 'None',    lastChecked: '2h',  status: 'Pass'   },
  { model: 'Bundle Propensity v2',     psi: 0.06, jsd: 0.03, alert: 'None',    lastChecked: '4h',  status: 'Pass'   },
]

const driftTrend = [
  { m: 'Jun', drifted: 4, monitored: 18 }, { m: 'Jul', drifted: 3, monitored: 19 },
  { m: 'Aug', drifted: 2, monitored: 20 }, { m: 'Sep', drifted: 2, monitored: 21 },
  { m: 'Oct', drifted: 1, monitored: 22 }, { m: 'Nov', drifted: 1, monitored: 23 },
]

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'models' | 'agents' | 'search' | 'spend' | 'responsible' | 'features' | 'drift'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',     label: 'Overview',          icon: Gauge       },
  { id: 'models',       label: 'Model Registry',    icon: Cpu         },
  { id: 'agents',       label: 'Cortex Agents',     icon: Bot         },
  { id: 'search',       label: 'Search & Analyst',  icon: Search      },
  { id: 'spend',        label: 'AI Spend & ROI',    icon: Wallet      },
  { id: 'responsible',  label: 'Responsible AI',    icon: ShieldCheck },
  { id: 'features',     label: 'Feature Store',     icon: Sparkles    },
  { id: 'drift',        label: 'Drift & Monitoring',icon: Activity    },
]

export default function CAIOPage() {
  const [tab, setTab]               = useState<TabId>('overview')
  const [modelDomain, setModelDomain] = useState<string>('All')
  const [driftSort, setDriftSort]   = useState<'psi' | 'model'>('psi')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]     = useState<string>('')
  const [agentSort, setAgentSort]   = useState<'calls' | 'success'>('calls')
  const [raiFilter, setRaiFilter]   = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredModels = useMemo(
    () => modelDomain === 'All' ? modelRegistry : modelRegistry.filter(m => m.domain === modelDomain),
    [modelDomain],
  )

  const sortedDrift = useMemo(
    () => [...driftMonitor].sort((a, b) => driftSort === 'psi' ? b.psi - a.psi : a.model.localeCompare(b.model)),
    [driftSort],
  )

  const sortedAgents = useMemo(
    () => [...agentInventory].sort((a, b) => agentSort === 'calls' ? b.calls7d - a.calls7d : b.success - a.success),
    [agentSort],
  )

  const filteredRai = useMemo(
    () => raiFilter === 'All' ? raiChecklist : raiChecklist.filter(r => r.status === raiFilter),
    [raiFilter],
  )

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Chief AI Officer')}
        subtitle={tt('Office of the CAIO · Dr. Nele Coppens · FY2026 Q2 · models · agents · responsible AI')}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{(totalCalls7d / 1000).toFixed(0)}{tt('K calls/7d · ')}{liveTime}
            </span>
            <Link to="/portal/agents" className="bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Bot className="w-4 h-4" /> {tt('Open Cortex Agents')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="AI portfolio intelligence"
        models={[
          { name: 'Model-performance Monitor', metric: '0 drifted',      sub: 'production accuracy + drift' },
          { name: 'Agent-quality Evaluator',   metric: '99.2% success',  sub: 'grounded-answer scoring'     },
          { name: 'AI-spend Optimiser',        metric: '−18% / call',    sub: 'model-routing efficiency'    },
        ]}
        agentLabel="Run AI Portfolio Review"
        agentRunningLabel="Evaluating…"
        agentSteps={[
          'Inventoried every model and agent in production',
          'Scored accuracy, drift and grounded-answer quality',
          'Reconciled Cortex spend against attributed value',
          'Checked each use case against the responsible-AI policy',
        ]}
        agentBlurb="Models, agents and their training data share one governed platform — so every AI decision is explainable, cost-attributed and policy-checked before it reaches a customer."
        decision={{
          title: 'Promote the Care-assist agent from pilot to full rollout',
          detail: 'The Care-assist agent hit 99.2% grounded-answer success and cut average handle time 14% in pilot. Promoting it to the full contact-centre — with the responsible-AI guardrails already in place — scales the deflection benefit without adding risk.',
          impact: '+BSD 1.6M annual saving · AHT −14%',
          risk: 'keep human-in-the-loop for billing disputes > BSD 200',
          linkTo: '#/portal/agents',
          linkLabel: 'Open Cortex Agents',
        }}
        chart={{
          kind: 'line',
          title: 'AI-attributed value — actual vs plan (BSD M / quarter)',
          xKey: 'q',
          unit: 'M',
          data: [
            { q: 'Q1-26', actual: 2.1, plan: 2.0 },
            { q: 'Q2-26', actual: 3.0, plan: 2.8 },
            { q: 'Q3-26', actual: 3.9, plan: 3.6 },
            { q: 'Q4-26', actual: 4.8, plan: 4.4 },
          ],
          series: [
            { key: 'actual', name: 'Actual', color: PURPLE },
            { key: 'plan',   name: 'Plan',   color: NAVY, dashed: true },
          ],
          note: 'Value is measured as cost saved + revenue lifted, attributed per use case.',
        }}
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {tt('AI governance readiness at 88% · Debt Collection Scorer concept drift detected · NBA Recommender feature drift (PSI 0.14)')}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {tt('Model cards missing for 3 Tier-1 models. Debt Collection retrain queued. Care-Assist conformity assessment due 31 Jul.')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/portal/ml-registry" className="text-xs font-bold text-amber-900 hover:underline">
                {tt('Open ML Registry →')}
              </Link>
              <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab nav ──────────────────────────────────────────────────────────── */}
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

      {/* ══════════════ OVERVIEW ════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Models in production')} value="23"     delta="+4 this quarter"       trend="up"   icon={Cpu}         accent />
          <KpiCard label={tt('Cortex calls (7d)')}     value="412K"   delta="p95 4.2s"              trend="up"   icon={Bot}               />
          <KpiCard label={tt('AI value (TTM)')}        value="BSD 14.8M" delta="cost saved + revenue"  trend="up"   icon={TrendingUp}         />
          <KpiCard label={tt('AI spend (MTD)')}        value="BSD 38K"   delta="-18% per call"          trend="up"   icon={Wallet}             />
          <KpiCard label={tt('Governed agents')}       value="100%"   delta="responsible-AI policy" trend="flat" icon={ShieldCheck}        />
        </div>

        <div className="mb-6">
          <DomainGrid
            title={tt('CAIO domain')}
            links={[
              { to: 'ai-insights',    label: 'AI Insights',     metric: tt('Cross-domain ML signals'),            icon: Brain      },
              { to: 'agents',         label: 'Cortex Agents',   metric: tt('Agentic workflows · 412K calls/7d'), icon: Bot        },
              { to: 'ml-registry',    label: 'ML Registry',     metric: tt('23 models · versions · lineage'),     icon: Boxes      },
              { to: 'cortex-search',  label: 'Cortex Search',   metric: tt('RAG over governed documents'),        icon: Search     },
              { to: 'semantic-views', label: 'Semantic Views',  metric: tt('Cortex Analyst metric layer'),        icon: Layers     },
              { to: 'feature-store',  label: 'Feature Store',   metric: tt('Reusable governed features'),         icon: Sparkles   },
              { to: 'ai-spend',       label: 'AI Spend',        metric: tt('Cortex credits · ROI per use case'), icon: Wallet     },
              { to: 'data-quality',   label: 'Data Quality',    metric: tt('Training-data trust signals'),        icon: Gauge      },
              { to: 'horizon',        label: 'AI Governance',   metric: tt('Policies · access · responsible AI'),icon: ShieldCheck},
            ]}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PriorityList
              title={tt('CAIO priorities — FY2026')}
              items={[
                { name: 'Scale Care-assist agent to full contact centre',      owner: tt('Applied AI · N. Coppens'),   pct: 69, status: 'on-track' },
                { name: 'Responsible-AI policy + AI governance readiness',        owner: tt('AI Governance'),           pct: 88, status: 'on-track' },
                { name: 'Cortex spend optimisation (model routing)',          owner: tt('ML Platform'),             pct: 74, status: 'on-track' },
                { name: 'Semantic layer coverage for self-serve analytics',   owner: tt('Analytics Engineering'),   pct: 51, status: 'at-risk'  },
                { name: 'Model-monitoring for every Tier-1 model',            owner: tt('ML Platform'),             pct: 36, status: 'behind'   },
              ]}
            />
          </div>
          <WatchList
            title={tt('On the CAIO desk')}
            items={[
              { text: tt('AI governance high-risk classification review for credit scoring'), level: 'high'   },
              { text: tt('Care-assist pilot at 99.2% — ready to scale'),                  level: 'low'    },
              { text: tt('NBA Recommender showing feature drift — retrain queued'),        level: 'medium' },
              { text: tt('Cortex spend +12% MoM — routing optimisation in flight'),       level: 'medium' },
            ]}
          />
        </div>

        <div className="mb-6">
          <AgendaList
            title={tt('CAIO cadence')}
            items={[
              { what: tt('AI portfolio review'),            when: tt('Tue 24 Jun') },
              { what: tt('Responsible-AI council'),         when: tt('Mon 7 Jul')  },
              { what: tt('Model risk & monitoring review'), when: tt('Thu 17 Jul') },
              { what: tt('AI value & roadmap — board'),     when: tt('Wed 24 Jul') },
            ]}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-purple-600 mb-2">{tt('Model fleet')}</div>
            <div className="text-2xl font-extrabold text-purple-700">23 / 23</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('production models · 0 drifted · 1 retrain queued')}</div>
            <Link to="/portal/ml-registry" className="text-xs font-bold text-purple-600 hover:underline mt-2 block">{tt('Open ML Registry →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-2">{tt('Cortex agents')}</div>
            <div className="text-2xl font-extrabold text-blue-700">12 agents</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('11 in production · 412K calls / 7d · 98.6% success rate')}</div>
            <Link to="/portal/agents" className="text-xs font-bold text-blue-600 hover:underline mt-2 block">{tt('Open Agents →')}</Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 p-4">
            <div className="text-xs uppercase tracking-widest font-bold text-green-600 mb-2">{tt('AI value (TTM)')}</div>
            <div className="text-2xl font-extrabold text-green-700">BSD 14.8M</div>
            <div className="text-xs text-vfes-dark/60 mt-1">{tt('cost saved + revenue lifted · ROI avg 6.4× per use case')}</div>
            <Link to="/portal/ai-spend" className="text-xs font-bold text-green-600 hover:underline mt-2 block">{tt('Open AI Spend →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ MODEL REGISTRY ══════════════════════════════════════════ */}
      {tab === 'models' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Models in production')} value="23"     delta="+4 this quarter"  trend="up"   icon={Cpu}          accent />
          <KpiCard label={tt('Models staging')}        value="2"      delta="review in progress" trend="flat" icon={Boxes}             />
          <KpiCard label={tt('With model cards')}      value="20/23"  delta="3 cards pending"  trend="up"   icon={BarChart2}         />
          <KpiCard label={tt('Retrain queued')}        value="1"      delta="Debt Coll. Scorer" trend="down" icon={AlertTriangle}     />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Domain:')}</span>
          {['All', ...Array.from(new Set(modelRegistry.map(m => m.domain)))].map(d => (
            <button key={d} onClick={() => setModelDomain(d)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${modelDomain === d ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {d}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Models in Production — weekly call volume by domain')} insight={{ insight: 'Fraud and churn models dominate inference traffic, collectively driving over 60% of weekly call volume across all production domains.', action: 'Prioritize GPU capacity planning and SLA alerting for the two highest-volume domains ahead of the next quarterly demand surge.', impact: 'Preventing latency breaches in revenue-critical domains protects AI attribution value and avoids customer-facing service degradation.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={modelsByDomain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), 'Calls/week']} />
                  <Bar dataKey="weekly" name={tt('Calls / week')} radius={[4, 4, 0, 0]}>
                    {modelsByDomain.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Model Fleet — production count & avg accuracy (6 months)')} insight={{ insight: 'Fleet accuracy has held above 91% for four consecutive months despite a 15% increase in the number of production models.', action: 'Maintain current retraining cadence and extend automated drift monitoring to all models promoted in the last two months.', impact: 'Sustaining accuracy above the governance threshold of 90% keeps the model risk register clear and reduces audit escalation risk.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={modelPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[80, 92]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="production" name={tt('# in prod')}   fill={BLUE}   radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="accuracy" name={tt('Avg accuracy %')} stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Model Registry — 23 models')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Model')}</th>
                  <th>{tt('Domain')}</th>
                  <th>{tt('Type')}</th>
                  <th className="text-right">{tt('Accuracy')}</th>
                  <th>{tt('Drift')}</th>
                  <th className="text-right">{tt('Calls/week')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map(m => (
                  <tr key={m.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2 font-semibold text-xs">{m.name}</td>
                    <td className="text-xs text-vfes-dark/65">{m.domain}</td>
                    <td className="text-xs text-vfes-dark/55">{m.type}</td>
                    <td className="text-right font-bold text-xs">{m.acc}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${m.drift === 'None' ? 'bg-emerald-100 text-emerald-700' : m.drift === 'Watch' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {tt(m.drift)}
                      </span>
                    </td>
                    <td className="text-right font-mono text-xs">{m.weekly === 0 ? '—' : m.weekly.toLocaleString()}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(m.status)}`}>{tt(m.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/ml-registry" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Full ML Registry →')}</Link>
            <Link to="/portal/feature-store" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Feature Store →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ CORTEX AGENTS ═══════════════════════════════════════════ */}
      {tab === 'agents' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total calls (7d)')}  value="412K"  delta="p95 4.2s latency" trend="up"   icon={Bot}         accent />
          <KpiCard label={tt('Success rate')}       value="98.6%" delta="+0.4 pp QoQ"      trend="up"   icon={Gauge}             />
          <KpiCard label={tt('Active agents')}      value="12"    delta="11 production"     trend="up"   icon={Boxes}             />
          <KpiCard label={tt('Avg tools / agent')}  value="5.9"   delta="Cortex + SQL"       trend="flat" icon={Sparkles}          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['calls', 'success'] as const).map(k => (
            <button key={k} onClick={() => setAgentSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${agentSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'calls' ? tt('Calls ↓') : tt('Success ↓')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Agent Calls — 7-day rolling (K/day)')} insight={{ insight: 'Agent call volume has increased 38% over the trailing seven days, with a midweek spike consistent with campaign-driven demand.', action: 'Pre-scale Cortex agent compute pools before the next scheduled marketing campaign to prevent queue saturation at peak.', impact: 'Proactive compute scaling eliminates customer-facing latency degradation and preserves the NPS benefit of GenAI-assisted resolution.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={agentCallsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [v.toLocaleString(), 'Calls']} />
                  <Area type="monotone" dataKey="calls" name={tt('Calls')} stroke={PURPLE} fill={PURPLE} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Agent Calls Monthly — volume & success rate')} insight={{ insight: 'Monthly call volume reached a new high while success rate declined two points, signaling prompt quality or retrieval context degradation.', action: 'Trigger a red-team evaluation on the three agents with the lowest success rates and refine their retrieval window configurations.', impact: 'Recovering success rate above 95% protects NPS contribution attributed to AI resolution and reduces costly human re-escalation.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={agentCallsMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[95, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="calls"   name={tt('Calls M')}         fill={PURPLE} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="success" name={tt('Success %')} stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Cortex Agent Inventory — 12 agents')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Agent')}</th>
                  <th>{tt('Domain')}</th>
                  <th className="text-right">{tt('Calls/7d')}</th>
                  <th className="text-right">{tt('p95 latency')}</th>
                  <th className="text-right">{tt('Success %')}</th>
                  <th className="text-right">{tt('Tools')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map(a => (
                  <tr key={a.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{a.name}</td>
                    <td className="text-xs text-vfes-dark/65">{a.domain}</td>
                    <td className="text-right font-mono text-xs">{a.calls7d.toLocaleString()}</td>
                    <td className={`text-right font-bold text-xs ${a.p95ms > 5000 ? 'text-amber-600' : 'text-emerald-600'}`}>{(a.p95ms / 1000).toFixed(1)}s</td>
                    <td className={`text-right font-bold text-xs ${a.success >= 99 ? 'text-emerald-600' : a.success >= 97 ? 'text-amber-600' : 'text-red-600'}`}>{a.success}%</td>
                    <td className="text-right font-mono text-xs">{a.tools}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(a.status)}`}>{tt(a.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/agents" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cortex Agents →')}</Link>
          </div>
        </Panel>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-[#FF4438]/8 to-transparent border border-[#FF4438]/20 p-5">
          <div className="text-xs uppercase tracking-widest font-bold text-[#222128] mb-3">{tt('Agent architecture')}</div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-vfes-dark/70">
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Tools used')}</div>
              {tt('Each agent combines Cortex Search (RAG), Cortex Analyst (text-to-SQL), Python functions and governed Snowflake data — no uncontrolled web access.')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Guardrails')}</div>
              {tt('All agents run with a fixed system prompt reviewed by AI Governance. Human-in-the-loop is mandatory for billing disputes over BSD 200 and all regulatory decisions.')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Evaluation')}</div>
              {tt('Agent-quality evaluator scores grounded-answer success (expected: 99%+) on a weekly holdout set. Failures auto-file a model risk ticket.')}
            </div>
          </div>
          <div className="mt-3 flex gap-4">
            <Link to="/portal/ai-insights" className="text-xs font-bold text-[#222128] hover:underline">{tt('Open AI Insights →')}</Link>
            <Link to="/portal/clean-rooms" className="text-xs font-bold text-[#222128] hover:underline">{tt('Open Clean Rooms →')}</Link>
          </div>
        </div>
      </>)}

      {/* ══════════════ SEARCH & ANALYST ════════════════════════════════════════ */}
      {tab === 'search' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cortex Search services')} value="5"      delta="130K docs indexed"  trend="up"   icon={Search}    accent />
          <KpiCard label={tt('Search queries (7d)')}    value="130K"   delta="p95 280ms"           trend="up"   icon={Activity}        />
          <KpiCard label={tt('Semantic views')}          value="6"      delta="38 verified queries" trend="up"   icon={Layers}          />
          <KpiCard label={tt('Analyst queries (7d)')}   value="19.4K"  delta="from 5 SVs"          trend="up"   icon={BarChart2}       />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cortex Search — 5 services')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Service')}</th>
                    <th className="text-right">{tt('Docs')}</th>
                    <th className="text-right">{tt('Queries/7d')}</th>
                    <th className="text-right">{tt('p95 ms')}</th>
                    <th className="text-right">{tt('Recall')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchServices.map(s => (
                    <tr key={s.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2.5 font-semibold text-xs">{s.name}</td>
                      <td className="text-right font-mono text-xs">{s.docs.toLocaleString()}</td>
                      <td className="text-right font-mono text-xs">{s.queries7d.toLocaleString()}</td>
                      <td className={`text-right font-bold text-xs ${s.p95ms > 300 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.p95ms}</td>
                      <td className={`text-right font-bold text-xs ${s.recall >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{s.recall}%</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(s.status)}`}>{tt(s.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/cortex-search" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Cortex Search →')}</Link>
            </div>
          </Panel>

          <Panel title={tt('Semantic Views — metric layer coverage')} insight={{ insight: 'Three semantic views exceed 80 verified queries while two remain below 30, revealing uneven AI-ready metric coverage across business domains.', action: 'Assign domain stewards to the two lowest-coverage views and seed verified queries from the last 30 days of analyst requests.', impact: 'Closing coverage gaps accelerates self-service analytics adoption and reduces ad-hoc SQL load on the data engineering team.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={semanticViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="view" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="metrics"  name={tt('Metrics')}  stackId="a" fill={BLUE}   radius={[0, 0, 0, 0]} />
                  <Bar dataKey="filters"  name={tt('Filters')}  stackId="a" fill={GREEN}  radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <Link to="/portal/semantic-views" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Semantic Views →')}</Link>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Semantic View Details — query activity & metrics')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('View')}</th>
                  <th className="text-right">{tt('Tables')}</th>
                  <th className="text-right">{tt('Metrics')}</th>
                  <th className="text-right">{tt('Filters')}</th>
                  <th className="text-right">{tt('Queries/7d')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {semanticViews.map(v => (
                  <tr key={v.view} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{v.view}</td>
                    <td className="text-right font-mono">{v.tables}</td>
                    <td className="text-right font-bold">{v.metrics}</td>
                    <td className="text-right">{v.filters}</td>
                    <td className="text-right font-mono text-xs">{v.queries7d.toLocaleString()}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(v.status)}`}>{tt(v.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ AI SPEND & ROI ═══════════════════════════════════════════ */}
      {tab === 'spend' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cortex spend (MTD)')} value="BSD 38K"   delta="-18% per call"   trend="up"   icon={Wallet}     accent />
          <KpiCard label={tt('AI value (TTM)')}      value="BSD 14.8M" delta="cost + revenue"  trend="up"   icon={TrendingUp}       />
          <KpiCard label={tt('Portfolio ROI')}       value="6.4×"   delta="+0.8× QoQ"        trend="up"   icon={Gauge}            />
          <KpiCard label={tt('Cost / call')}         value="BSD 0.051" delta="-18% YoY"         trend="up"   icon={Activity}         />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AI Spend vs Attributed Value (BSD K / month)')} insight={{ insight: 'Attributed business value has exceeded Cortex spend every month for six consecutive months, confirming a structurally positive ROI ratio.', action: 'Use the widening value gap as the primary evidence to accelerate budget approval for two pending GenAI use-case expansions.', impact: 'Securing incremental investment while ROI proof is strong locks in AI capability ahead of competitors who are still in experimentation.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  dataKey="cortex" name={tt('Cortex spend BSD ')} fill={PURPLE} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="value"  name={tt('Value BSD ')}        stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Cost Per Call Trend — BSD ')} insight={{ insight: 'Inference cost per call has fallen from BSD 0.067 to BSD 0.048 over six months as model optimization and request batching take effect.', action: 'Negotiate a volume-tier commitment with Snowflake Cortex now to lock in pricing while the downward cost trajectory provides leverage.', impact: 'Securing a volume commitment before year-end budget cycles is projected to reduce AI infrastructure cost by an estimated 12-18%.' }}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={costPerCall}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0.04, 0.07]} />
                    <Tooltip contentStyle={TS} />
                    <Line type="monotone" dataKey="cpp" name={tt('BSD  / call')} stroke={PURPLE} strokeWidth={2.4} dot />
                    <ReferenceLine y={0.05} stroke={AMBER} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Amber = BSD 0.05 target. Model routing cuts cost via smaller models for simple queries.')}</div>
          </Panel>
        </div>

        <Panel title={tt('ROI by Use Case — monthly spend vs attributed value')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Use case')}</th>
                  <th className="text-right">{tt('Monthly spend BSD ')}</th>
                  <th className="text-right">{tt('Monthly value BSD ')}</th>
                  <th className="text-right">{tt('ROI ×')}</th>
                </tr>
              </thead>
              <tbody>
                {[...aiSpendByUseCase].sort((a, b) => b.roi - a.roi).map(u => (
                  <tr key={u.uc} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold">{u.uc}</td>
                    <td className="text-right font-mono text-xs">BSD {u.monthly.toLocaleString()}</td>
                    <td className="text-right font-mono text-xs">BSD {u.value.toLocaleString()}</td>
                    <td className={`text-right font-bold ${u.roi >= 8 ? 'text-emerald-600' : u.roi >= 4 ? 'text-amber-600' : 'text-red-600'}`}>{u.roi.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/ai-spend" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI Spend →')}</Link>
          </div>
        </Panel>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Panel title={tt('AI Spend Distribution by Use Case')} insight={{ insight: 'Churn prediction and network anomaly detection together consume 55% of monthly AI spend, limiting budget headroom for emerging use cases.', action: 'Conduct an inference optimization audit on the top two spend categories to identify batching and caching opportunities worth 10-15% savings.', impact: 'Reallocating freed budget to GenAI customer care pilots accelerates time-to-value for the next generation of AI revenue drivers.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={aiSpendByUseCase} dataKey="monthly" nameKey="uc" innerRadius={36} outerRadius={72} paddingAngle={2}>
                    {aiSpendByUseCase.map((u, i) => <Cell key={i} fill={u.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`BSD ${v.toLocaleString()}`, 'Monthly spend']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-purple-600 mb-1">{tt('Total AI budget (annualised)')}</div>
              <div className="text-2xl font-extrabold text-purple-700">BSD 456K</div>
              <div className="text-xs text-vfes-dark/60 mt-1">{tt('vs BSD 14.8M attributed value — 32.5× portfolio ROI')}</div>
              <Link to="/portal/ai-spend" className="text-xs font-bold text-purple-600 hover:underline mt-2 block">{tt('Full AI spend breakdown →')}</Link>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
              <div className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1">{tt('Model routing savings')}</div>
              <div className="text-2xl font-extrabold text-emerald-700">−18%</div>
              <div className="text-xs text-vfes-dark/60 mt-1">{tt('cost / call via cortex-llama-3.1-8b for simple queries (routing saves BSD 84K/yr)')}</div>
              <Link to="/portal/agents" className="text-xs font-bold text-emerald-600 hover:underline mt-2 block">{tt('Review agent routing →')}</Link>
            </div>
          </div>
        </div>
      </>)}

      {/* ══════════════ RESPONSIBLE AI ══════════════════════════════════════════ */}
      {tab === 'responsible' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('AI governance readiness')}    value="88%"  delta="target 100% Dec-26"    trend="up"   icon={ShieldCheck}  accent />
          <KpiCard label={tt('Policies enforced')}      value="4"    delta="RAI council approved"  trend="flat" icon={FileCheck}          />
          <KpiCard label={tt('Open RAI findings')}      value="3"    delta="-5 vs prior month"      trend="up"   icon={AlertTriangle}      />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'Pass', 'Watch', 'Retrain'].map(f => (
            <button key={f} onClick={() => setRaiFilter(f)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${raiFilter === f ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {tt(f)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('AI Governance Readiness — quarterly trajectory (%)')} insight={{ insight: 'Readiness has risen from 58% to 84% over four quarters, but the trajectory must reach 95% before the illustrative compliance deadline.', action: 'Focus the next sprint exclusively on the six failing controls in explainability and data provenance to close the remaining gap.', impact: 'Achieving 95% ahead of deadline eliminates regulatory fine exposure and positions the company as a regional AI governance reference.' }}>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={raiScore}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="q" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[55, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="score" name={tt('Readiness %')} stroke={PURPLE} strokeWidth={2.4} dot />
                  <ReferenceLine y={100} stroke={GREEN} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Target 100% by May-2027. Care-Assist conformity assessment due Jul.')}</div>
          </Panel>

          <Panel title={tt('Responsible AI Checklist — 10 controls')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="py-2">{tt('Control')}</th>
                    <th>{tt('Owner')}</th>
                    <th>{tt('Due')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRai.map(r => (
                    <tr key={r.check} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-2 text-xs font-semibold pr-3 max-w-[220px]">{r.check}</td>
                      <td className="text-xs text-vfes-dark/65 whitespace-nowrap">{r.owner}</td>
                      <td className="text-xs font-mono whitespace-nowrap">{r.due}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(r.status)}`}>{tt(r.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open AI Governance (Horizon) →')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { label: tt('High-risk (Art. 6)'),       count: 4,  cleared: 4,  color: GREEN  },
            { label: tt('Limited risk (Art. 52)'),    count: 8,  cleared: 8,  color: BLUE   },
            { label: tt('Minimal risk'),              count: 11, cleared: 11, color: SLATE  },
            { label: tt('Model cards complete'),      count: 20, cleared: 23, color: AMBER  },
            { label: tt('Human oversight active'),    count: 4,  cleared: 4,  color: GREEN  },
            { label: tt('Bias audits done (Tier-1)'), count: 6,  cleared: 8,  color: PURPLE },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-white border border-black/5 p-4">
              <div className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: c.color }}>{c.label}</div>
              <div className="text-xl font-extrabold text-vfes-dark">{c.cleared}/{c.count}</div>
              <div className="mt-2 h-1.5 rounded-full bg-black/5">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.round(c.cleared / c.count * 100)}%`, backgroundColor: c.color }} />
              </div>
              <div className="text-[10px] text-vfes-dark/45 mt-1">{Math.round(c.cleared / c.count * 100)}% {tt('complete')}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════ FEATURE STORE ════════════════════════════════════════════ */}
      {tab === 'features' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total features')}       value="276"  delta="+48 YTD"           trend="up"   icon={Sparkles}    accent />
          <KpiCard label={tt('Feature groups')}       value="6"    delta="across 6 domains"  trend="up"   icon={Database}          />
          <KpiCard label={tt('Serving models')}       value="21"   delta="using feature store" trend="up"  icon={Cpu}              />
          <KpiCard label={tt('Freshness SLA met')}    value="100%" delta="all groups on SLA"  trend="flat" icon={GitBranch}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Feature Growth — count & groups (6 months)')} insight={{ insight: 'Total feature count grew 40% in six months while group count remained flat, indicating feature sprawl accumulating within existing groups.', action: 'Introduce a feature governance review gate requiring a redundancy check before any new feature is promoted to the production store.', impact: 'Reducing feature sprawl cuts training pipeline compute cost and improves model interpretability scores required for AI Act compliance.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={featureGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 8]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="l" dataKey="features" name={tt('Total features')} fill={BLUE}  radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="groups"   name={tt('Groups')}        stroke={GREEN} strokeWidth={2.4} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Feature Distribution by Group')} insight={{ insight: 'Customer behavior features represent nearly half the feature store, creating a concentration risk tied to a single upstream data source.', action: 'Accelerate network and operational data feature development to diversify the store and reduce single-source dependency over two quarters.', impact: 'A more balanced feature distribution improves model robustness and reduces single-point-of-failure risk across production predictions.' }}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={featureGroups.map(g => ({ name: g.group, value: g.features }))}
                      dataKey="value" innerRadius={38} outerRadius={75} paddingAngle={2}
                    >
                      {featureGroups.map((_, i) => <Cell key={i} fill={[BLUE,NAVY,GREEN,AMBER,PURPLE,SLATE][i % 6]} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Feature Store Groups — detail')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Group')}</th>
                  <th className="text-right">{tt('Features')}</th>
                  <th className="text-right">{tt('Models')}</th>
                  <th>{tt('Freshness')}</th>
                  <th className="text-right">{tt('Consumers')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {featureGroups.map(g => (
                  <tr key={g.group} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{g.group}</td>
                    <td className="text-right font-bold">{g.features}</td>
                    <td className="text-right">{g.models}</td>
                    <td className="text-xs font-mono">{g.freshness}</td>
                    <td className="text-right">{g.consumers}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(g.status)}`}>{tt(g.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link to="/portal/feature-store" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open Feature Store →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ DRIFT & MONITORING ══════════════════════════════════════ */}
      {tab === 'drift' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Models monitored')} value="23"    delta="100% coverage"     trend="up"   icon={Activity}     accent />
          <KpiCard label={tt('Drifted models')}   value="1"     delta="Debt Coll. retrain" trend="down" icon={AlertTriangle}      />
          <KpiCard label={tt('Avg PSI')}           value="0.042" delta="fleet average"      trend="up"   icon={Gauge}             />
          <KpiCard label={tt('Feature drift flags')} value="1"  delta="NBA Recommender"    trend="down" icon={Brain}             />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Sort by:')}</span>
          {(['psi', 'model'] as const).map(k => (
            <button key={k} onClick={() => setDriftSort(k)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${driftSort === k ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {k === 'psi' ? tt('PSI ↓') : tt('Name')}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Drifted Models Trend — count per month')} insight={{ insight: 'Drifted model count peaked at 4 in month three but has recovered to 1, reflecting improved retraining velocity from the new MLOps pipeline.', action: 'Codify the retraining trigger thresholds that drove this recovery into a standard AI operations runbook for all model owners.', impact: 'Formalizing the response playbook reduces mean-time-to-retrain and keeps the drifted model count at or near zero going forward.' }}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={driftTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar  yAxisId="r" dataKey="monitored" name={tt('Models monitored')} fill={BLUE}  fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="l" type="monotone" dataKey="drifted"   name={tt('Drifted')} stroke={AMBER} strokeWidth={2.4} dot />
                  <ReferenceLine yAxisId="l" y={0} stroke={GREEN} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/45 mt-2">{tt('Green baseline = target: zero drifted models. Retraining velocity prevents accumulation.')}</div>
          </Panel>

          <Panel title={tt('Feature Drift — PSI distribution across models')} insight={{ insight: 'Two models exceed the critical PSI threshold of 0.2 and four sit in the amber warning band, requiring immediate governance escalation.', action: 'Escalate the two red-zone models to data science for emergency retraining within 48 hours and freeze their predictions pending review.', impact: 'Remediating critical drift prevents silent prediction degradation that would erode the measured ROI of churn and fraud models.' }}>
            <div className="h-264">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sortedDrift}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="model" tick={{ fontSize: 7 }} angle={-30} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TS} />
                    <Bar dataKey="psi" name="PSI" radius={[4, 4, 0, 0]}>
                      {sortedDrift.map((d, i) => <Cell key={i} fill={d.psi > 0.2 ? '#ef4444' : d.psi > 0.1 ? AMBER : GREEN} />)}
                    </Bar>
                    <ReferenceLine y={0.2} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={0.1} stroke={AMBER} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Drift Monitor — 8 key models')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="py-2">{tt('Model')}</th>
                  <th className="text-right">{tt('PSI')}</th>
                  <th className="text-right">{tt('JSD')}</th>
                  <th>{tt('Alert type')}</th>
                  <th>{tt('Checked')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrift.map(d => (
                  <tr key={d.model} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-2.5 font-semibold text-xs">{d.model}</td>
                    <td className={`text-right font-bold text-xs ${d.psi > 0.2 ? 'text-red-600' : d.psi > 0.1 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.psi.toFixed(2)}</td>
                    <td className="text-right font-mono text-xs">{d.jsd.toFixed(2)}</td>
                    <td>
                      {d.alert !== 'None'
                        ? <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-red-100 text-red-700">{tt(d.alert)}</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 text-vfes-dark/40">{tt('None')}</span>}
                    </td>
                    <td className="text-xs text-vfes-dark/55">{d.lastChecked} ago</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stP(d.status)}`}>{tt(d.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to="/portal/ml-registry" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Open ML Registry →')}</Link>
            <Link to="/portal/data-quality" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Check training data quality →')}</Link>
          </div>
        </Panel>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-5">
          <div className="text-xs uppercase tracking-widest font-bold text-purple-600 mb-3">{tt('Drift detection methodology')}</div>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-vfes-dark/70">
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('PSI thresholds')}</div>
              {tt('PSI < 0.1: no action · PSI 0.1–0.2: investigate · PSI > 0.2: mandatory retrain. Checks run every 4 hours on Tier-1 models.')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Retrain pipeline')}</div>
              {tt('Auto-triggered retrains via Snowpark ML pipelines. Target: model requalified and back in production within 48h of drift flag.')}
            </div>
            <div>
              <div className="font-semibold text-vfes-dark mb-1">{tt('Training data quality')}</div>
              {tt('Feature freshness, schema and DMF scores are checked before every training run. Failing checks block the pipeline automatically.')}
            </div>
          </div>
          <div className="mt-3 flex gap-4">
            <Link to="/portal/feature-store" className="text-xs font-bold text-purple-600 hover:underline">{tt('Open Feature Store →')}</Link>
            <Link to="/portal/observability" className="text-xs font-bold text-purple-600 hover:underline">{tt('ML Pipeline Observability →')}</Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <Link to="/portal/ml-registry"   className="bg-white border border-black/10 rounded-lg px-4 py-2 text-xs font-bold text-vfes-dark hover:shadow-md transition flex items-center gap-2"><Cpu       className="w-4 h-4 text-vfes-dark" />{tt('Open ML Registry')}</Link>
          <Link to="/portal/ai-spend"      className="bg-white border border-black/10 rounded-lg px-4 py-2 text-xs font-bold text-vfes-dark hover:shadow-md transition flex items-center gap-2"><Wallet    className="w-4 h-4 text-vfes-dark" />{tt('Open AI Spend')}</Link>
          <Link to="/portal/feature-store" className="bg-white border border-black/10 rounded-lg px-4 py-2 text-xs font-bold text-vfes-dark hover:shadow-md transition flex items-center gap-2"><Sparkles  className="w-4 h-4 text-vfes-dark" />{tt('Open Feature Store')}</Link>
          <Link to="/portal/horizon"       className="bg-white border border-black/10 rounded-lg px-4 py-2 text-xs font-bold text-vfes-dark hover:shadow-md transition flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-vfes-dark" />{tt('Open Horizon')}</Link>
        </div>
      </>)}
      {/* ── End CAIO page ─────────────────────────────────────────────────────── */}
    </div>
  )
}
