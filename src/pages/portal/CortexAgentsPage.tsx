import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tt from '../../i18n/tt'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import {
  Bot, Search, Eye, Sparkles, Activity, Zap, ShieldCheck, ArrowRight,
  Smartphone, Brain, AlertTriangle, CheckCircle2, Clock,
  DollarSign, GitBranch, Gauge, Layers,
} from 'lucide-react'
import { MOBILE_AGENTS } from './_mobile_data'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

type Agent = {
  name: string; fqn: string; status: 'live' | 'staging' | 'r&d'
  llm: string; steward: string; description: string
  semanticView?: string; searchService?: string; customTools?: string[]
  metrics: { calls7d: number; p95Sec: number; success: number; cost7d: number }
  promptHints: string[]; surfaces: string[]
  evalScore?: number; guardrailHits?: number; toolCalls7d?: number
}

const AGENTS: Agent[] = [
  {
    name: 'CEO Briefing Agent', fqn: 'CBL_AI.AGENTS.CEO_BRIEFING_AGENT', status: 'live',
    llm: 'Claude 3.5 Sonnet (cross-region)', steward: 'P. Jose',
    description: 'Daily CEO briefing — stitches financial, customer, network, regulatory and people signals into a 30-second narrative.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.EXEC_360_SV', searchService: 'CBL_AI.SEARCH.KB_REGULATORY_FILINGS',
    customTools: ['fetch_press_sentiment(date)', 'okr_actuals(period)'],
    metrics: { calls7d: 412, p95Sec: 4.2, success: 99.2, cost7d: 11.4 },
    evalScore: 0.94, guardrailHits: 0, toolCalls7d: 824,
    promptHints: ["What changed since yesterday's briefing?", 'Top 3 risks before the board call', 'Brief me on the Freeport outage in 60 seconds'],
    surfaces: ['Snowflake Intelligence tile', 'Executive page · CEO Briefing tab', 'Email digest 06:00 CET'],
  },
  {
    name: 'Churn Co-Pilot', fqn: 'CBL_AI.AGENTS.CHURN_AGENT', status: 'live',
    llm: 'Llama 3.1 70B (Snowflake-hosted)', steward: 'C. Rohan',
    description: "Explains a customer's churn risk, top drivers (SHAP), recommended save offer and expected uplift.",
    semanticView: 'CBL_ANALYTICS.SEMANTIC.CUSTOMER_360_SV', searchService: 'CBL_AI.SEARCH.KB_CUSTOMER_KB',
    customTools: ['shap_explain(customer_id)', 'best_offer(customer_id)'],
    metrics: { calls7d: 2884, p95Sec: 1.8, success: 98.6, cost7d: 18.9 },
    evalScore: 0.91, guardrailHits: 12, toolCalls7d: 5768,
    promptHints: ['Why is customer 884122 at risk?', 'Best save offer for high-CLV broadband-only churners in Freeport', 'Compare churn drivers Q4-25 vs Q1-26'],
    surfaces: ['Customer 360 page', 'Retention agent desktop', 'Snowflake Intelligence tile'],
  },
  {
    name: 'Pricing Strategist', fqn: 'CBL_AI.AGENTS.PRICING_AGENT', status: 'live',
    llm: 'Mistral Large (Snowflake-hosted)', steward: 'A. Declercq',
    description: 'Bundle profitability + competitor scrape parsing → pricing recommendations with elasticity-modelled impact.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.PRODUCT_360_SV', searchService: 'CBL_AI.SEARCH.KB_PRODUCT_CATALOG',
    customTools: ['elasticity_simulate(sku, delta_eur)', 'parse_competitor_promo(url)'],
    metrics: { calls7d: 184, p95Sec: 6.4, success: 96.1, cost7d: 7.8 },
    evalScore: 0.88, guardrailHits: 3, toolCalls7d: 368,
    promptHints: ['Model a +BSD 5 price-up on the 1Gb fibre SKU', 'Top 5 most-elastic SKUs this quarter', 'What did BTC change last week?'],
    surfaces: ['Pricing simulator · "Ask Cortex" panel', 'Strategy page'],
  },
  {
    name: 'B2B Deal Closer', fqn: 'CBL_AI.AGENTS.B2B_DEAL_AGENT', status: 'live',
    llm: 'Claude 3.5 Sonnet', steward: 'L. Claeys',
    description: 'On-call B2B account brief — opportunity scoring, contract terms benchmarking, next-best-action.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.B2B_360_SV', searchService: 'CBL_AI.SEARCH.KB_LEGAL_CONTRACTS',
    customTools: ['salesforce_lookup(account_id)', 'contract_diff(template, draft)'],
    metrics: { calls7d: 312, p95Sec: 3.6, success: 97.4, cost7d: 9.2 },
    evalScore: 0.90, guardrailHits: 1, toolCalls7d: 624,
    promptHints: ['Brief me on Island Bank (demo) before the 10am meeting', 'Compare our SLA to the Benchmark B Group MSA', 'Generate redline for the Belfius renewal'],
    surfaces: ['B2B page', 'Sales · account drill', 'Slack /tln-ai bot'],
  },
  {
    name: 'People HR-BP Assistant', fqn: 'CBL_AI.AGENTS.PEOPLE_AGENT', status: 'live',
    llm: 'Snowflake Arctic (instruction-tuned)', steward: 'D. Adderley',
    description: 'HR business-partner copilot — flight risk explainer, succession depth, manager comparison. Row-access policies enforced per HR-BP territory.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.PEOPLE_360_SV', customTools: ['rls_check(user, employee_id)'],
    metrics: { calls7d: 96, p95Sec: 2.1, success: 99.0, cost7d: 2.4 },
    evalScore: 0.93, guardrailHits: 0, toolCalls7d: 96,
    promptHints: ['Top 5 flight risks in my function this month', 'Who is bus-factor=1 in Network Engineering?', 'Compare manager NPS for my org vs company'],
    surfaces: ['People page · Employee 360 tab', 'Workday tile (embedded)'],
  },
  {
    name: 'Network Ops Triage', fqn: 'CBL_AI.AGENTS.NETWORK_OPS_AGENT', status: 'live',
    llm: 'Llama 3.1 70B', steward: 'M. Willems',
    description: 'On-call NOC engineer assistant — alarm correlation, runbook lookup, MTTR optimisation suggestions.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.NETWORK_KPI_SV', searchService: 'CBL_AI.SEARCH.KB_NETWORK_RUNBOOKS',
    customTools: ['noc_topology(node_id)', 'open_jira_ticket(summary)'],
    metrics: { calls7d: 884, p95Sec: 2.4, success: 98.8, cost7d: 6.1 },
    evalScore: 0.92, guardrailHits: 4, toolCalls7d: 1768,
    promptHints: ["What's causing the Freeport CMTS-12 alarm storm?", 'Find the runbook for OSPF flapping', 'How long since last similar outage?'],
    surfaces: ['War Room page', 'NOC dashboard (embedded)', 'PagerDuty bot'],
  },
  {
    name: 'Compliance Q&A', fqn: 'CBL_AI.AGENTS.COMPLIANCE_AGENT', status: 'live',
    llm: 'Claude 3.5 Sonnet', steward: 'B. De Witte',
    description: 'Answers regulatory and compliance questions grounded in URCA, Telecom controls (scenario), GDPR, NIS2 + internal SOPs.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.RISK_360_SV', searchService: 'CBL_AI.SEARCH.KB_REGULATORY_FILINGS',
    metrics: { calls7d: 142, p95Sec: 3.2, success: 99.4, cost7d: 4.8 },
    evalScore: 0.95, guardrailHits: 0, toolCalls7d: 142,
    promptHints: ["What's the URCA M4 deadline?", 'GDPR DPIA checklist for the new churn agent', 'NIS2 incident reporting timeline'],
    surfaces: ['Risk page', 'Regulatory & ESG page', 'Snowflake Intelligence tile'],
  },
  {
    name: 'War-Room Triage', fqn: 'CBL_AI.AGENTS.WAR_ROOM_TRIAGE', status: 'live',
    llm: 'Claude 3.5 Sonnet (function-calling)', steward: 'P. Jose',
    description: 'Cross-domain incident triage — pulls network, customer, finance and comms tools simultaneously.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.EXEC_360_SV', searchService: 'CBL_AI.SEARCH.KB_NETWORK_RUNBOOKS',
    customTools: ['affected_customers(node_id)', 'draft_comms(audience, severity)', 'escalation_chain(severity)'],
    metrics: { calls7d: 64, p95Sec: 5.8, success: 97.2, cost7d: 3.4 },
    evalScore: 0.87, guardrailHits: 2, toolCalls7d: 192,
    promptHints: ['P1 incident on Freeport CMTS-12 — give me everything', 'Draft customer comms for the current outage', 'Who do I need on the bridge?'],
    surfaces: ['War Room page', 'Slack /war-room bot', 'PagerDuty integration'],
  },
  {
    name: 'Procurement Insights', fqn: 'CBL_AI.AGENTS.PROCUREMENT_AGENT', status: 'staging',
    llm: 'Mistral Large', steward: 'F. Tobin',
    description: 'Spend analytics, vendor risk and tail-spend opportunities. Currently in UAT with 3 category leads.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.PROCURE_360_SV',
    metrics: { calls7d: 28, p95Sec: 2.8, success: 96.4, cost7d: 0.9 },
    evalScore: 0.83, guardrailHits: 0, toolCalls7d: 28,
    promptHints: ['Where are we paying above market on managed services?', 'Vendors with > BSD 500k TTM and no recent RFP'],
    surfaces: ['Procurement page (preview)'],
  },
  {
    name: 'Customer Care AI', fqn: 'CBL_AI.AGENTS.CARE_AGENT', status: 'live',
    llm: 'Snowflake Arctic', steward: 'K. Rolle',
    description: 'Handles tier-1 care interactions — order status, billing queries, self-service activation, complaint routing.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.CUSTOMER_360_SV', searchService: 'CBL_AI.SEARCH.KB_CUSTOMER_KB',
    metrics: { calls7d: 18840, p95Sec: 0.9, success: 97.8, cost7d: 24.2 },
    evalScore: 0.89, guardrailHits: 84, toolCalls7d: 37680,
    promptHints: ['What is the status of order ORD-84821?', 'I want to cancel my broadband service', 'My bill is higher than usual this month'],
    surfaces: ['Contact Centre AI platform', 'Self-serve portal', 'Mobile app chat'],
  },
  {
    name: 'AI Spend Monitor', fqn: 'CBL_AI.AGENTS.SPEND_MONITOR', status: 'live',
    llm: 'Snowflake Arctic (instruction-tuned)', steward: 'P. Jose',
    description: 'Tracks Cortex AI credit burn, anomaly-flags runaway agents, surfaces optimisation opportunities.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.FINANCE_360_SV',
    metrics: { calls7d: 48, p95Sec: 1.2, success: 100.0, cost7d: 0.8 },
    evalScore: 0.96, guardrailHits: 0, toolCalls7d: 96,
    promptHints: ['Which agent spent the most credits this week?', 'Alert if any agent exceeds $50/day', 'Show token spend breakdown by LLM'],
    surfaces: ['AI Spend page', 'CDO dashboard'],
  },
  {
    name: 'Fraud Triage Assistant', fqn: 'CBL_AI.AGENTS.FRAUD_AGENT', status: 'staging',
    llm: 'Claude 3.5 Sonnet', steward: 'L. Bethel',
    description: 'SIM-swap and subscription fraud explainer — surfaces SHAP drivers, velocity signals and recommended holds.',
    semanticView: 'CBL_ANALYTICS.SEMANTIC.CUSTOMER_360_SV', customTools: ['velocity_check(msisdn)', 'hold_account(customer_id, reason)'],
    metrics: { calls7d: 42, p95Sec: 2.6, success: 98.1, cost7d: 1.2 },
    evalScore: 0.91, guardrailHits: 6, toolCalls7d: 84,
    promptHints: ['Explain why customer 44821 was flagged for SIM-swap fraud', 'Show top 10 velocity anomalies today'],
    surfaces: ['Fraud page (UAT)', 'Anti-Fraud team portal'],
  },
]

const STATUS_COLOR: Record<string, string> = {
  live:    'bg-emerald-100 text-emerald-700',
  staging: 'bg-amber-100 text-amber-700',
  'r&d':   'bg-zinc-200 text-zinc-700',
}

// ── Chart data ─────────────────────────────────────────────────────────────
const CALLS_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  live:    3200 + Math.round(Math.sin(i / 4) * 800 + i * 80),
  staging: 60   + Math.round(Math.sin(i / 3) * 20),
}))

const SUCCESS_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  success:   97.8 + Math.sin(i / 2) * 0.8,
  guardrail: 0.4  + Math.sin(i / 3) * 0.3,
}))

const TOKEN_DAILY = [
  { d: 'Mon', input: 1280, output: 512 }, { d: 'Tue', input: 1420, output: 568 },
  { d: 'Wed', input: 1380, output: 552 }, { d: 'Thu', input: 1520, output: 608 },
  { d: 'Fri', input: 1640, output: 656 }, { d: 'Sat', input: 820,  output: 328 },
  { d: 'Sun', input: 640,  output: 256 },
]

const GUARDRAIL_EVENTS = [
  { d: 'Mon', pii: 12, hallucination: 4, off_topic: 8 },
  { d: 'Tue', pii: 8,  hallucination: 6, off_topic: 5 },
  { d: 'Wed', pii: 14, hallucination: 3, off_topic: 9 },
  { d: 'Thu', pii: 6,  hallucination: 8, off_topic: 6 },
  { d: 'Fri', pii: 10, hallucination: 5, off_topic: 4 },
  { d: 'Sat', pii: 4,  hallucination: 2, off_topic: 2 },
  { d: 'Sun', pii: 3,  hallucination: 1, off_topic: 1 },
]

const ORCH_FUNNEL = [
  { step: 'Received',    count: 24820 }, { step: 'Classified', count: 24810 },
  { step: 'Tool sel.',   count: 24640 }, { step: 'Executed',   count: 24420 },
  { step: 'Generated',   count: 24210 }, { step: 'Guardrail',  count: 24094 },
  { step: 'Delivered',   count: 24060 },
]

const LATENCY_DIST = [
  { bucket: '<0.5s', cnt: 8420 }, { bucket: '0.5–1s', cnt: 6840 },
  { bucket: '1–2s',  cnt: 5210 }, { bucket: '2–4s',   cnt: 2880 },
  { bucket: '4–8s',  cnt: 1240 }, { bucket: '>8s',    cnt: 230  },
]

const EVAL_COLORS = [BLUE, NAVY, GREEN, AMBER, PURPLE, SLATE, '#EF4444', '#0EA5E9', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6']

// ── Tabs ──────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'inventory' | 'performance' | 'traces' | 'eval' | 'cost' | 'guardrails' | 'orchestration'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',      label: 'Overview',       icon: Gauge       },
  { id: 'inventory',     label: 'Inventory',      icon: Bot         },
  { id: 'performance',   label: 'Performance',    icon: Activity    },
  { id: 'traces',        label: 'Traces',         icon: GitBranch   },
  { id: 'eval',          label: 'Eval scores',    icon: Brain       },
  { id: 'cost',          label: 'Cost & tokens',  icon: DollarSign  },
  { id: 'guardrails',    label: 'Guardrails',     icon: ShieldCheck },
  { id: 'orchestration', label: 'Orchestration',  icon: Layers      },
]

export default function CortexAgentsPage() {
  const [tab, setTab]                       = useState<TabId>('overview')
  const [picked, setPicked]                 = useState<Agent>(AGENTS[0])
  const [statusFilter, setStatusFilter]     = useState('All')
  const [llmFilter, setLlmFilter]           = useState('All')
  const [evalSort, setEvalSort]             = useState<'score' | 'calls'>('score')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [liveTime, setLiveTime]             = useState('')
  const [traceAgent, setTraceAgent]         = useState('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filteredAgents = useMemo(
    () => AGENTS.filter(a =>
      (statusFilter === 'All' || a.status === statusFilter) &&
      (llmFilter === 'All' || a.llm.includes(llmFilter))
    ),
    [statusFilter, llmFilter],
  )

  const totals = useMemo(
    () => AGENTS.reduce((acc, a) => ({
      calls: acc.calls + a.metrics.calls7d,
      cost:  acc.cost  + a.metrics.cost7d,
      tools: acc.tools + (a.toolCalls7d ?? 0),
    }), { calls: 0, cost: 0, tools: 0 }),
    [],
  )

  const sortedEval = useMemo(
    () => [...AGENTS].sort((a, b) =>
      evalSort === 'score'
        ? (b.evalScore ?? 0) - (a.evalScore ?? 0)
        : b.metrics.calls7d - a.metrics.calls7d
    ),
    [evalSort],
  )

  const avgEval = useMemo(
    () => (AGENTS.reduce((s, a) => s + (a.evalScore ?? 0), 0) / AGENTS.length * 100).toFixed(1),
    [],
  )

  const handlePick = useCallback((a: Agent) => { setPicked(a); setTab('inventory') }, [])

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Cortex Agents')}
        subtitle={tt('12 agents · 10 live · 2 staging · Cortex Analyst + Cortex Search + Snowflake-hosted LLMs')}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {tt('ALL HEALTHY · ')}{liveTime}
            </span>
            <Link to="/portal/caio" className="bg-vfes-red text-vfes-dark font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> {tt('CAIO Dashboard')}
            </Link>
          </div>
        }
      />

      {/* ── ML Insight ──────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Agent intelligence"
        models={[
          { name: 'agent_eval_judge', metric: `${avgEval}%`, sub: tt('avg faithfulness · 12 agents') },
          { name: 'churn_xgb (agent tool)', metric: 'AUC 0.86', sub: tt('Churn Co-Pilot SHAP layer') },
          { name: 'doc_extract_arctic', metric: 'F1 0.93', sub: tt('Contract & compliance RAG') },
        ]}
        agentLabel={tt('Run Agent Ops Review')}
        agentRunningLabel={tt('Analysing agent fleet…')}
        agentSteps={[
          tt('Pulled call volumes, latency and cost for all 12 agents'),
          tt('Flagged Customer Care AI — highest guardrail-hit ratio (84 PII events/7d)'),
          tt('Identified 3 agents with eval score < 0.90 and volume > 100 calls/7d'),
          tt('Generated prompt-tuning action items per agent steward'),
        ]}
        agentBlurb={tt('All agent telemetry — calls, tokens, eval scores, guardrail hits — flows through CBL_AI.TELEMETRY.AGENT_CALLS, enabling cross-agent SQL analytics in one Snowflake table.')}
        decision={{
          title: tt('Prompt-tune Pricing Strategist and War-Room Triage'),
          detail: tt('Both agents show eval scores below the 0.90 fleet median with meaningful call volume. Prompt-tuning against the golden eval set is expected to add +3–5 pp faithfulness without LLM upgrade.'),
          impact: tt('fleet avg eval to 92%+ · reduces escalations −8%'),
          risk: tt('Eval set may lag recent product catalogue changes — sync with Pricing DS first'),
          linkTo: '#/portal/ai-insights',
          linkLabel: tt('Open AI Insights'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Agent calls / 7d — top 8 agents'),
          xKey: 'name',
          data: AGENTS.slice(0, 8).map(a => ({ name: a.name.split(' ')[0], calls: a.metrics.calls7d })),
          series: [{ key: 'calls', name: tt('Calls / 7d'), color: BLUE }],
          note: tt('Customer Care AI dominates (18.8K/7d); Churn Co-Pilot second at 2.9K/7d.'),
        }}
      />

      {/* ── Alert banner ───────────────────────────────────────────────── */}
      {!alertDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('Customer Care AI: 84 PII guardrail events in 7d — review masking policy coverage')}</div>
            <div className="text-xs text-amber-800 mt-1">{tt('Pricing Strategist eval 0.88 below 0.90 fleet median · War-Room Triage p95 5.8s above SLA threshold.')}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/portal/horizon" className="text-xs font-bold text-amber-900 hover:underline">{tt('Open Horizon →')}</Link>
            <button onClick={() => setAlertDismissed(true)} className="text-[10px] text-amber-600 hover:underline">{tt('Dismiss')}</button>
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
          <KpiCard label={tt('Calls (7d)')}          value={totals.calls.toLocaleString()} delta={tt('+18% vs prior 7d')} trend="up"   icon={Activity}    accent />
          <KpiCard label={tt('Avg success rate')}    value="98.4%"                          delta={tt('+0.3 pp')}          trend="up"   icon={CheckCircle2}       />
          <KpiCard label={tt('Fleet p95 latency')}   value="3.4 s"                          delta={tt('−0.4s vs prior 7d')} trend="up"  icon={Clock}              />
          <KpiCard label={tt('Cost (7d)')}           value={`$${totals.cost.toFixed(0)}`}   delta={tt('−6% vs prior 7d')}  trend="up"   icon={DollarSign}         />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Live agents')}         value={String(AGENTS.filter(a => a.status === 'live').length)} delta={tt('10 of 12')} trend="flat" icon={Bot} />
          <KpiCard label={tt('Tool calls (7d)')}     value={`${(totals.tools / 1000).toFixed(1)}K`} delta={tt('+12%')} trend="up" icon={Zap} />
          <KpiCard label={tt('Guardrail hits (7d)')} value={String(AGENTS.reduce((s, a) => s + (a.guardrailHits ?? 0), 0))} delta={tt('112 events')} trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Avg eval score')}      value={`${avgEval}%`} delta={tt('target 90%')} trend="up" icon={Brain} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Daily call volume — all agents (14d)')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CALLS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="live"    stroke={BLUE}  fill={BLUE}  fillOpacity={0.15} name={tt('Live agents')}    />
                <Area type="monotone" dataKey="staging" stroke={AMBER} fill={AMBER} fillOpacity={0.15} name={tt('Staging agents')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Latency distribution — all calls 7d')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={LATENCY_DIST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="cnt" fill={NAVY} radius={[4, 4, 0, 0]} name={tt('Calls')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Fleet at a glance')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                    <th className="text-left py-2">{tt('Agent')}</th>
                    <th className="text-left">{tt('Status')}</th>
                    <th className="text-right">{tt('Calls')}</th>
                    <th className="text-right">{tt('p95 s')}</th>
                    <th className="text-right">{tt('Success')}</th>
                    <th className="text-right">{tt('Eval')}</th>
                    <th className="text-right">{tt('Cost $')}</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map(a => (
                    <tr key={a.name}
                      className={`border-b border-black/5 cursor-pointer hover:bg-black/5 ${picked.name === a.name ? 'bg-vfes-red/5' : ''}`}
                      onClick={() => handlePick(a)}>
                      <td className="py-1.5 font-semibold">{tt(a.name)}</td>
                      <td><span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_COLOR[a.status]}`}>{a.status}</span></td>
                      <td className="text-right font-mono">{a.metrics.calls7d.toLocaleString()}</td>
                      <td className={`text-right font-mono ${a.metrics.p95Sec > 5 ? 'text-amber-600 font-bold' : ''}`}>{a.metrics.p95Sec}</td>
                      <td className="text-right font-mono">{a.metrics.success}%</td>
                      <td className={`text-right font-mono ${(a.evalScore ?? 0) < 0.90 ? 'text-amber-600' : 'text-emerald-600'}`}>{((a.evalScore ?? 0) * 100).toFixed(0)}%</td>
                      <td className="text-right font-mono">{a.metrics.cost7d.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <div className="space-y-3">
            <Panel title={tt('Quick links')}>
              <div className="space-y-2 text-sm">
                <Link to="/portal/cortex-search"  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"><Search className="w-4 h-4" />{tt('Cortex Search')}</Link>
                <Link to="/portal/semantic-views" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"><Eye className="w-4 h-4" />{tt('Semantic Views')}</Link>
                <Link to="/portal/ml-registry"    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100"><Brain className="w-4 h-4" />{tt('ML Registry')}</Link>
                <Link to="/portal/ai-spend"       className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100"><DollarSign className="w-4 h-4" />{tt('AI Spend')}</Link>
                <Link to="/portal/ai-insights"    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100"><Sparkles className="w-4 h-4" />{tt('AI Insights')}</Link>
                <Link to="/portal/data-quality"   className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"><ShieldCheck className="w-4 h-4" />{tt('Data Quality')}</Link>
              </div>
            </Panel>
            <Panel title={tt('Platform links')}>
              <div className="space-y-1.5 text-xs">
                <Link to="/portal/caio"    className="block font-semibold text-vfes-dark hover:underline">{tt('→ CAIO Dashboard')}</Link>
                <Link to="/portal/cdo"     className="block font-semibold text-sky-700 hover:underline">{tt('→ CDO / Data Catalog')}</Link>
                <Link to="/portal/catalog" className="block font-semibold text-purple-700 hover:underline">{tt('→ Object Catalog')}</Link>
                <Link to="/portal/lineage" className="block font-semibold text-navy-700 hover:underline">{tt('→ Data Lineage')}</Link>
              </div>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ════ INVENTORY ═════════════════════════════════════════════════ */}
      {tab === 'inventory' && (<>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Filter:')}</span>
          {['All', 'live', 'staging'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${statusFilter === s ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {tt(s)}
            </button>
          ))}
          <span className="text-xs text-vfes-dark/40">|</span>
          {['All', 'Claude', 'Llama', 'Mistral', 'Arctic'].map(l => (
            <button key={l} onClick={() => setLlmFilter(l)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${llmFilter === l ? 'bg-vfes-dark text-white' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {l}
            </button>
          ))}
          <span className="text-xs text-vfes-dark/50 ml-2 font-mono">{filteredAgents.length} {tt('agents')}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <div className="rounded-xl bg-white border border-black/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">{tt('Registered agents')}</div>
                <span className="text-[10px] font-mono text-vfes-dark/50">{filteredAgents.length}</span>
              </div>
              <div className="divide-y divide-black/5 max-h-[720px] overflow-y-auto">
                {filteredAgents.map(a => (
                  <button key={a.name} onClick={() => setPicked(a)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${picked.name === a.name ? 'bg-vfes-red/5 border-l-4 border-vfes-red' : 'hover:bg-black/5 border-l-4 border-transparent'}`}>
                    <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${picked.name === a.name ? 'bg-vfes-red text-vfes-dark' : 'bg-vfes-dark/5 text-vfes-dark'}`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm truncate">{tt(a.name)}</div>
                        <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${STATUS_COLOR[a.status]}`}>{a.status}</span>
                      </div>
                      <div className="font-mono text-[10px] text-vfes-dark/55 truncate">{a.fqn}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-vfes-dark/55 font-mono">
                        <span>{a.metrics.calls7d.toLocaleString()} {tt('calls/7d')}</span>
                        <span>p95 {a.metrics.p95Sec}s</span>
                        <span>{tt('eval')} {((a.evalScore ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">{picked.fqn}</div>
                    <div className="text-2xl font-extrabold flex items-center gap-2 mt-1"><Bot className="w-5 h-5" /> {tt(picked.name)}</div>
                    <div className="text-sm text-white/80 mt-1.5 max-w-2xl">{tt(picked.description)}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-1 rounded ${STATUS_COLOR[picked.status]}`}>{tt(picked.status)}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/15">
                  <div><div className="text-[10px] uppercase text-white/55 tracking-widest">{tt('LLM')}</div><div className="text-xs font-bold mt-0.5">{picked.llm}</div></div>
                  <div><div className="text-[10px] uppercase text-white/55 tracking-widest">{tt('Steward')}</div><div className="text-xs font-bold mt-0.5">{picked.steward}</div></div>
                  <div><div className="text-[10px] uppercase text-white/55 tracking-widest">{tt('Calls 7d')}</div><div className="text-xs font-bold mt-0.5">{picked.metrics.calls7d.toLocaleString()}</div></div>
                  <div><div className="text-[10px] uppercase text-white/55 tracking-widest">{tt('Eval score')}</div><div className="text-xs font-bold mt-0.5 text-emerald-400">{((picked.evalScore ?? 0) * 100).toFixed(0)}%</div></div>
                </div>
              </div>
            </div>

            <Panel title={tt('Tools & integrations')}>
              <div className="space-y-2 text-sm">
                {picked.semanticView && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <Eye className="w-4 h-4 text-purple-700" />
                    <div className="flex-1">
                      <div className="font-bold text-purple-900 text-xs uppercase tracking-widest">{tt('Cortex Analyst')}</div>
                      <div className="font-mono text-[12px] text-purple-900">{picked.semanticView}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                  </div>
                )}
                {picked.searchService && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                    <Search className="w-4 h-4 text-indigo-700" />
                    <div className="flex-1">
                      <div className="font-bold text-indigo-900 text-xs uppercase tracking-widest">{tt('Cortex Search')}</div>
                      <div className="font-mono text-[12px] text-indigo-900">{picked.searchService}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                  </div>
                )}
                {picked.customTools?.map(t => (
                  <div key={t} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Zap className="w-4 h-4 text-amber-700" />
                    <div className="flex-1">
                      <div className="font-bold text-amber-900 text-xs uppercase tracking-widest">{tt('Custom function')}</div>
                      <div className="font-mono text-[12px] text-amber-900">{t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid md:grid-cols-2 gap-4">
              <Panel title={tt('Verified prompts')}>
                <div className="space-y-2">
                  {picked.promptHints.map(p => (
                    <div key={p} className="text-[12px] bg-[#fafbfc] border border-black/5 rounded-lg px-3 py-2 flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-vfes-dark mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title={tt('Surfaces')}>
                <div className="space-y-1.5 text-sm">
                  {picked.surfaces.map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-vfes-red" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 space-y-1">
                  <Link to="/portal/customer-360"    className="text-xs font-semibold text-sky-700 hover:underline block">{tt('→ Customer 360')}</Link>
                  <Link to="/portal/churn-retention" className="text-xs font-semibold text-sky-700 hover:underline block">{tt('→ Churn & Retention')}</Link>
                  <Link to="/portal/contact-center"  className="text-xs font-semibold text-sky-700 hover:underline block">{tt('→ Contact Center')}</Link>
                  <Link to="/portal/fraud"           className="text-xs font-semibold text-sky-700 hover:underline block">{tt('→ Fraud Detection')}</Link>
                </div>
              </Panel>
            </div>

            <Panel title={tt('Mobile-domain agents')} action={<span className="text-[10px] uppercase font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5 mobile agents')}</span>}>
              <table className="w-full text-xs">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55">
                  <tr>
                    <th className="py-1.5">{tt('Agent')}</th>
                    <th>{tt('Model')}</th>
                    <th>{tt('Invocations')}</th>
                    <th>{tt('Accuracy')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOBILE_AGENTS.map(a => (
                    <tr key={a.id} className="border-t border-black/5">
                      <td className="py-2 font-semibold flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-vfes-dark" />{tt(a.name)}</td>
                      <td className="font-mono text-[10px]">{a.model}</td>
                      <td className="font-mono">{a.invocations}</td>
                      <td className={`font-mono font-bold ${a.accuracy >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{a.accuracy}%</td>
                      <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
      </>)}

      {/* ════ PERFORMANCE ═══════════════════════════════════════════════ */}
      {tab === 'performance' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('p50 latency (fleet)')} value="1.4 s"  delta={tt('vs 1.6s prior 7d')} trend="up"   icon={Clock}       />
          <KpiCard label={tt('p95 latency (fleet)')} value="3.4 s"  delta={tt('vs 3.8s prior 7d')} trend="up"   icon={Activity}    />
          <KpiCard label={tt('p99 latency (fleet)')} value="6.2 s"  delta={tt('SLA 8s')}            trend="flat" icon={AlertTriangle} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Success rate & guardrail events — 14d')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={SUCCESS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" domain={[96, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine yAxisId="l" y={98} stroke={AMBER} strokeDasharray="3 3" label={{ value: 'SLA 98%', fontSize: 10 }} />
                <Line yAxisId="l" type="monotone" dataKey="success"   stroke={GREEN}  strokeWidth={2.4} dot={false} name={tt('Success %')}       />
                <Line yAxisId="r" type="monotone" dataKey="guardrail" stroke={PURPLE} strokeWidth={2}   dot={false} name={tt('Guardrail events')} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('p95 latency by agent (seconds)')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={AGENTS.map(a => ({ name: a.name.split(' ')[0], p95: a.metrics.p95Sec }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 8]} unit="s" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={72} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine x={5} stroke={AMBER} strokeDasharray="3 3" />
                <Bar dataKey="p95" fill={BLUE} radius={[0, 4, 4, 0]} name={tt('p95 s')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Token usage — input vs output (7d, thousands)')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TOKEN_DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="input"  fill={BLUE}  radius={[4, 4, 0, 0]} name={tt('Input tokens')}  />
                <Bar dataKey="output" fill={GREEN} radius={[4, 4, 0, 0]} name={tt('Output tokens')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('LLM share by call volume (7d)')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Snowflake Arctic', value: 18984, color: BLUE   },
                    { name: 'Llama 3.1 70B',    value: 2980,  color: NAVY   },
                    { name: 'Claude 3.5 Sonnet', value: 994,  color: PURPLE },
                    { name: 'Mistral Large',     value: 254,  color: AMBER  },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[BLUE, NAVY, PURPLE, AMBER].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ TRACES ════════════════════════════════════════════════════ */}
      {tab === 'traces' && (<>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Agent:')}</span>
          {['All', ...AGENTS.slice(0, 6).map(a => a.name.split(' ')[0])].map(n => (
            <button key={n} onClick={() => setTraceAgent(n)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${traceAgent === n ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70 hover:bg-black/5'}`}>
              {n}
            </button>
          ))}
        </div>

        <Panel title={tt('Orchestration funnel — calls this week')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ORCH_FUNNEL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="step" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[23500, 25000]} />
              <Tooltip contentStyle={TS} />
              <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('Calls')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Recent trace log')}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Time')}</th>
                  <th className="text-left">{tt('Agent')}</th>
                  <th className="text-left">{tt('User')}</th>
                  <th className="text-left">{tt('Surface')}</th>
                  <th className="text-right">{tt('Tokens')}</th>
                  <th className="text-right">{tt('Latency')}</th>
                  <th className="text-left">{tt('Tools')}</th>
                  <th className="text-left">{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: '2 min ago',  agent: 'CEO Briefing Agent',    u: 'P. Jose',      s: 'Snowflake Intelligence', tok: '4,212', l: '3.8s', tools: 'okr_actuals,fetch_press',   ok: true  },
                  { t: '8 min ago',  agent: 'Churn Co-Pilot',        u: 'C. Rohan',     s: 'Customer 360',           tok: '1,884', l: '1.6s', tools: 'shap_explain,best_offer',   ok: true  },
                  { t: '14 min ago', agent: 'B2B Deal Closer',       u: 'L. Claeys',  s: 'B2B page',               tok: '6,420', l: '4.2s', tools: 'salesforce_lookup',         ok: true  },
                  { t: '24 min ago', agent: 'Network Ops Triage',    u: 'M. Willems',   s: 'NOC dashboard',          tok: '2,840', l: '2.1s', tools: 'noc_topology',              ok: true  },
                  { t: '42 min ago', agent: 'War-Room Triage',       u: 'P. Jose',      s: 'War Room',               tok: '8,884', l: '5.8s', tools: 'affected_customers,draft',  ok: true  },
                  { t: '1 h ago',    agent: 'Customer Care AI',      u: 'Portal user',  s: 'Self-serve portal',      tok: '512',   l: '0.9s', tools: 'kb_lookup',                 ok: false },
                  { t: '1 h ago',    agent: 'Compliance Q&A',        u: 'B. De Witte',   s: 'Risk page',              tok: '3,120', l: '3.2s', tools: 'kb_regulatory',             ok: true  },
                  { t: '2 h ago',    agent: 'Pricing Strategist',    u: 'A. Declercq',  s: 'Strategy page',          tok: '5,640', l: '6.4s', tools: 'elasticity_simulate',       ok: true  },
                ].map((r, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="py-1.5 font-mono text-vfes-dark/55 text-[11px]">{tt(r.t)}</td>
                    <td className="font-semibold text-[11px]">{tt(r.agent)}</td>
                    <td>{r.u}</td>
                    <td className="text-vfes-dark/70">{r.s}</td>
                    <td className="text-right font-mono">{r.tok}</td>
                    <td className="text-right font-mono">{r.l}</td>
                    <td className="font-mono text-[10px] text-vfes-dark/60">{r.tools}</td>
                    <td>
                      {r.ok
                        ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">200</span>
                        : <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{tt('429 throttled')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </>)}

      {/* ════ EVAL SCORES ═══════════════════════════════════════════════ */}
      {tab === 'eval' && (<>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold text-vfes-dark/60 uppercase tracking-widest">{tt('Sort:')}</span>
          <button onClick={() => setEvalSort('score')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${evalSort === 'score' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By eval score')}
          </button>
          <button onClick={() => setEvalSort('calls')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition ${evalSort === 'calls' ? 'bg-vfes-red text-vfes-dark' : 'bg-white border border-black/10 text-vfes-dark/70'}`}>
            {tt('By call volume')}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Fleet avg eval score')} value={`${avgEval}%`}  delta={tt('target 90%')}  trend="up"   icon={Brain}       />
          <KpiCard label={tt('Agents above 0.90')}    value={String(AGENTS.filter(a => (a.evalScore ?? 0) >= 0.90).length)} delta={tt('of 12 agents')} trend="flat" icon={CheckCircle2} />
          <KpiCard label={tt('Last eval run')}         value="Today"          delta={tt('24h cadence')} trend="flat" icon={Clock}        />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Eval scores by agent — faithfulness · 7d golden set')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sortedEval.map(a => ({ name: a.name.split(' ')[0], score: ((a.evalScore ?? 0) * 100) }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" domain={[75, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={72} />
                <Tooltip contentStyle={TS} />
                <ReferenceLine x={90} stroke={AMBER} strokeDasharray="3 3" label={{ value: '90% target', fontSize: 10 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} name={tt('Eval score %')}>
                  {sortedEval.map((a, i) => <Cell key={i} fill={(a.evalScore ?? 0) >= 0.90 ? GREEN : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Eval score trend — top 4 agents (30d)')}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={Array.from({ length: 8 }, (_, i) => ({
                d: `W${i + 1}`,
                churn:      0.89 + Math.sin(i / 3) * 0.03,
                compliance: 0.93 + Math.sin(i / 4) * 0.02,
                pricing:    0.86 + Math.sin(i / 2.5) * 0.04,
                warroom:    0.85 + Math.sin(i / 3.5) * 0.03,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis domain={[0.80, 1.00]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.90} stroke={AMBER} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="churn"      stroke={BLUE}   strokeWidth={2} dot={false} name={tt('Churn Co-Pilot')}      />
                <Line type="monotone" dataKey="compliance" stroke={GREEN}  strokeWidth={2} dot={false} name={tt('Compliance Q&A')}      />
                <Line type="monotone" dataKey="pricing"    stroke={AMBER}  strokeWidth={2} dot={false} name={tt('Pricing Strategist')}  />
                <Line type="monotone" dataKey="warroom"    stroke={PURPLE} strokeWidth={2} dot={false} name={tt('War-Room Triage')}     />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel title={tt('Eval detail — last run')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Agent')}</th>
                <th className="text-right">{tt('Faithfulness')}</th>
                <th className="text-right">{tt('Relevance')}</th>
                <th className="text-right">{tt('Groundedness')}</th>
                <th className="text-right">{tt('Coherence')}</th>
                <th className="text-left">{tt('Eval set')}</th>
                <th className="text-left">{tt('Link')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CEO Briefing Agent',    0.94, 0.92, 0.95, 0.91, '80 Q · Executive'],
                ['Churn Co-Pilot',        0.91, 0.89, 0.92, 0.88, '120 Q · Retention'],
                ['Pricing Strategist',    0.88, 0.86, 0.89, 0.84, '64 Q · Pricing DS'],
                ['B2B Deal Closer',       0.90, 0.88, 0.91, 0.87, '60 Q · B2B Sales'],
                ['Network Ops Triage',    0.92, 0.91, 0.93, 0.90, '80 Q · NOC gold'],
                ['Compliance Q&A',        0.95, 0.94, 0.96, 0.93, '52 Q · Compliance'],
                ['War-Room Triage',       0.87, 0.85, 0.88, 0.84, '40 Q · Incident'],
                ['Customer Care AI',      0.89, 0.87, 0.90, 0.86, '200 Q · CSAT gold'],
              ].map((r: any) => (
                <tr key={r[0]} className="border-b border-black/5">
                  <td className="py-1.5 font-semibold">{tt(r[0])}</td>
                  <td className={`text-right font-mono ${r[1] < 0.90 ? 'text-amber-600' : 'text-emerald-600'}`}>{r[1]}</td>
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

      {/* ════ COST & TOKENS ═════════════════════════════════════════════ */}
      {tab === 'cost' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Total cost (7d)')}     value={`$${totals.cost.toFixed(0)}`} delta={tt('−6% vs prior week')} trend="up"   icon={DollarSign} accent />
          <KpiCard label={tt('Total tokens (7d)')}   value="14.2M"                         delta={tt('+11%')}              trend="down" icon={Zap}                />
          <KpiCard label={tt('Cost per 1K tokens')}  value="$0.006"                        delta={tt('blended rate')}       trend="flat" icon={Activity}            />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Cost by agent — 7d ($)')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={AGENTS.map(a => ({ name: a.name.split(' ')[0], cost: a.metrics.cost7d })).sort((a, b) => b.cost - a.cost)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="$" />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="cost" fill={PURPLE} radius={[4, 4, 0, 0]} name={tt('Cost 7d $')} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={tt('Daily token burn — 7d (thousands)')}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={TOKEN_DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="input"  stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} name={tt('Input')}  />
                <Area type="monotone" dataKey="output" stroke={GREEN} fill={GREEN} fillOpacity={0.2} name={tt('Output')} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title={tt('Cost breakdown by agent')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Agent')}</th>
                <th className="text-right">{tt('Calls 7d')}</th>
                <th className="text-right">{tt('Tool calls')}</th>
                <th className="text-right">{tt('Cost 7d $')}</th>
                <th className="text-right">{tt('$/call')}</th>
                <th className="text-right">{tt('% of fleet')}</th>
              </tr>
            </thead>
            <tbody>
              {[...AGENTS].sort((a, b) => b.metrics.cost7d - a.metrics.cost7d).map(a => (
                <tr key={a.name} className="border-b border-black/5">
                  <td className="py-1.5 font-semibold">{tt(a.name)}</td>
                  <td className="text-right font-mono">{a.metrics.calls7d.toLocaleString()}</td>
                  <td className="text-right font-mono">{(a.toolCalls7d ?? 0).toLocaleString()}</td>
                  <td className="text-right font-mono font-bold">${a.metrics.cost7d.toFixed(2)}</td>
                  <td className="text-right font-mono text-[10px]">${(a.metrics.cost7d / Math.max(a.metrics.calls7d, 1)).toFixed(3)}</td>
                  <td className="text-right font-mono text-[10px]">{(a.metrics.cost7d / totals.cost * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </>)}

      {/* ════ GUARDRAILS ════════════════════════════════════════════════ */}
      {tab === 'guardrails' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Guardrail events (7d)')} value={String(AGENTS.reduce((s, a) => s + (a.guardrailHits ?? 0), 0))} delta={tt('112 total')} trend="flat" icon={ShieldCheck} accent />
          <KpiCard label={tt('PII events')}            value="57"   delta={tt('51% of all events')} trend="flat" icon={AlertTriangle} />
          <KpiCard label={tt('Blocked responses')}     value="8"    delta={tt('0.03% of calls')}    trend="up"   icon={CheckCircle2}  />
        </div>
        <Panel title={tt('Guardrail events by type — 7d')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={GUARDRAIL_EVENTS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TS} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pii"           stackId="a" fill={PURPLE} name={tt('PII detected')}     />
              <Bar dataKey="hallucination" stackId="a" fill={AMBER}  name={tt('Hallucination')}    />
              <Bar dataKey="off_topic"     stackId="a" fill={SLATE}  name={tt('Off-topic')}         radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-6">
          <Panel title={tt('Guardrail policy configuration')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Policy')}</th>
                  <th className="text-left">{tt('Scope')}</th>
                  <th className="text-left">{tt('Action')}</th>
                  <th className="text-left">{tt('Enabled')}</th>
                  <th className="text-right">{tt('Hits 7d')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { policy: 'PII masking (GDPR)',        scope: 'All agents', action: 'Redact & log', enabled: true,  hits: 57  },
                  { policy: 'Hallucination threshold',   scope: 'All agents', action: 'Warn user',   enabled: true,  hits: 29  },
                  { policy: 'Off-topic filter',          scope: 'All agents', action: 'Reroute',     enabled: true,  hits: 18  },
                  { policy: 'Block response (high risk)', scope: 'Customer Care AI, Fraud', action: 'Block + alert', enabled: true, hits: 8 },
                  { policy: 'Rate limit (429)',           scope: 'All agents', action: 'Throttle',   enabled: true,  hits: 4   },
                  { policy: 'Competitor name guard',     scope: 'Pricing Strategist', action: 'Redact', enabled: false, hits: 0 },
                ].map(p => (
                  <tr key={p.policy} className="border-b border-black/5">
                    <td className="py-1.5 font-semibold">{tt(p.policy)}</td>
                    <td className="text-[10px] text-vfes-dark/70">{tt(p.scope)}</td>
                    <td className="text-[10px]">{tt(p.action)}</td>
                    <td>{p.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="text-[10px] text-vfes-dark/40">—</span>}</td>
                    <td className={`text-right font-mono ${p.hits > 20 ? 'text-amber-600 font-bold' : ''}`}>{p.hits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-vfes-dark/50 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              {tt('Cortex Guard enabled · PII via masking policies · audit in CBL_GOV.AUDIT.ACCESS_HISTORY_V · ')}
              <Link to="/portal/horizon" className="font-semibold text-vfes-dark hover:underline">{tt('Open Horizon')}</Link>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ════ ORCHESTRATION ═════════════════════════════════════════════ */}
      {tab === 'orchestration' && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Calls this week')}  value="24,820" delta={tt('+18%')}       trend="up"   icon={Activity}   accent />
          <KpiCard label={tt('Delivery rate')}    value="96.9%"  delta={tt('3.1% dropped')} trend="flat" icon={CheckCircle2} />
          <KpiCard label={tt('Tool call rate')}   value="98.5%"  delta={tt('per call avg')} trend="up"   icon={Zap}         />
        </div>

        <Panel title={tt('Orchestration funnel — step-by-step drop-off')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ORCH_FUNNEL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="step" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[23500, 25000]} />
              <Tooltip contentStyle={TS} />
              <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} name={tt('Calls')} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 text-xs text-vfes-dark/55">{tt('760 calls (3.07%) lost between query received and delivery — primary causes: tool timeout (0.88%), guardrail block (0.47%), throttle (0.32%), LLM error (0.12%).')}</div>
        </Panel>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <Panel title={tt('Agent dependency map')}>
            <div className="space-y-2 text-xs">
              {AGENTS.slice(0, 6).map(a => (
                <div key={a.name} className="flex items-center gap-2 p-2 rounded-lg bg-[#fafbfc] border border-black/5">
                  <Bot className="w-3.5 h-3.5 text-vfes-dark shrink-0" />
                  <span className="font-semibold flex-1 truncate">{tt(a.name)}</span>
                  <div className="flex items-center gap-1">
                    {a.semanticView && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Analyst</span>}
                    {a.searchService && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Search</span>}
                    {a.customTools && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{a.customTools.length} fns</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-vfes-dark/50">
              {tt('Full topology in ')}
              <Link to="/portal/lineage" className="font-semibold text-vfes-dark hover:underline">{tt('Data Lineage →')}</Link>
            </div>
          </Panel>
          <Panel title={tt('SLA compliance — rolling 30d')}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={Array.from({ length: 8 }, (_, i) => ({ w: `W${i + 1}`, sla: 97.2 + Math.sin(i / 2.5) * 0.8, target: 98 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="w" tick={{ fontSize: 10 }} />
                <YAxis domain={[95, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={98} stroke={AMBER} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="sla"    stroke={GREEN} strokeWidth={2.4} dot={false} name={tt('Delivery SLA %')} />
                <Line type="monotone" dataKey="target" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name={tt('98% target')} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </>)}

      {/* ════ MOBILE AGENTS (visible in all tabs as anchored section) ═══ */}
      {tab === 'overview' && (
        <div className="mt-6">
          <Panel title={tt('Mobile-domain agents — RAN Ops · MNP win-back · SIM-swap fraud · 5G capacity · Open RAN')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5 agents · 4 live · 1 pilot')}</span>}>
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('Agent')}</th>
                  <th>{tt('Scope')}</th>
                  <th>{tt('Model')}</th>
                  <th>{tt('Invocations')}</th>
                  <th>{tt('Accuracy')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_AGENTS.map(a => (
                  <tr key={a.id} className="border-t border-black/5">
                    <td className="py-2 font-semibold flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-vfes-dark" />{tt(a.name)}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(a.scope)}</td>
                    <td className="text-xs font-mono">{a.model}</td>
                    <td className="font-mono text-xs">{a.invocations}</td>
                    <td className={`font-mono text-xs font-bold ${a.accuracy >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{a.accuracy}%</td>
                    <td><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[11px] text-vfes-dark/65">{tt('Mobile RAN Ops Agent runs at scale (124K invocations/wk) with 91% accuracy. SIM-swap Fraud Agent leads accuracy (96%). Open RAN Vendor Interop is the only pilot — Mavenir↔Fujitsu signature library still small.')}</div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <Link to="/portal/contact-center"  className="font-semibold text-sky-700 hover:underline">{tt('→ Contact Center')}</Link>
              <Link to="/portal/fraud"           className="font-semibold text-sky-700 hover:underline">{tt('→ Fraud Detection')}</Link>
              <Link to="/portal/churn-retention" className="font-semibold text-sky-700 hover:underline">{tt('→ Churn & Retention')}</Link>
              <Link to="/portal/customer-360"    className="font-semibold text-sky-700 hover:underline">{tt('→ Customer 360')}</Link>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between flex-wrap gap-4">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          {tt('Cortex Guard enabled · all agents PII-aware via masking policies · audit in CBL_GOV.AUDIT.ACCESS_HISTORY_V')}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/portal/ai-insights"   className="font-semibold text-vfes-dark hover:underline">{tt('AI Insights')}</Link>
          <Link to="/portal/feature-store" className="font-semibold text-sky-700 hover:underline">{tt('Feature Store')}</Link>
          <Link to="/portal/catalog"       className="font-semibold text-purple-700 hover:underline">{tt('Catalog')}</Link>
        </div>
      </div>
    </div>
  )
}
