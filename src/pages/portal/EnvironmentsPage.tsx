import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { GitBranch, ArrowRight, CheckCircle2, AlertTriangle, Smartphone, Clock, Zap, Server } from 'lucide-react'
import { MOBILE_ENVIRONMENTS } from './_mobile_data'

const BLUE = '#FF4438', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'

const ENV_TABS = ['Environments', 'Deploy History', 'CI/CD', 'Schema Changes', 'Env Drift', 'Clone Ops', 'Release Calendar', 'Promotion'] as const
type EnvTab = typeof ENV_TABS[number]

const ENVS = [
  { e: 'DEV',     account: 'Cable Bahamas-DATA_DEV',  role: 'SYSADMIN_DEV',  warehouses: 4, dbs: 6,  dbt_target: 'dev',     branch: 'feature/*',     lastDeploy: '2025-05-22 14:08' },
  { e: 'STAGE',   account: 'Cable Bahamas-DATA_STG',  role: 'SYSADMIN_STG',  warehouses: 5, dbs: 6,  dbt_target: 'staging', branch: 'main',          lastDeploy: '2025-05-22 02:30' },
  { e: 'PROD',    account: 'Cable Bahamas-DATA_PROD', role: 'SYSADMIN_PROD', warehouses: 7, dbs: 6,  dbt_target: 'prod',    branch: 'release/*',     lastDeploy: '2025-05-21 02:30' },
  { e: 'DR',      account: 'Cable Bahamas-DATA_DR',   role: 'SYSADMIN_DR',   warehouses: 3, dbs: 6,  dbt_target: '—',       branch: '—',             lastDeploy: 'continuous (replication)' },
]

const DEPLOYS = [
  { d: '2025-05-22 14:08', target: 'DEV',   project: 'cbl_core',     status: 'success', author: 'pieter.claes',  changes: '14 models · 4 tests',   commit: 'a8f12b' },
  { d: '2025-05-22 02:30', target: 'STAGE', project: 'cbl_core',     status: 'success', author: 'CI/CD',         changes: '2 models · 0 breaking', commit: '3c01ac' },
  { d: '2025-05-21 02:30', target: 'PROD',  project: 'cbl_core',     status: 'success', author: 'CI/CD',         changes: '8 models · 0 breaking', commit: '14b842' },
  { d: '2025-05-20 18:42', target: 'PROD',  project: 'cbl_ml',       status: 'success', author: 'CI/CD',         changes: 'churn_xgb v3.1',         commit: '88a014' },
  { d: '2025-05-20 14:14', target: 'STAGE', project: 'cbl_governance', status: 'success', author: 'leen.jacobs', changes: '2 masking policies',     commit: '76210a' },
  { d: '2025-05-19 09:00', target: 'PROD',  project: 'cbl_apps',     status: 'success', author: 'CI/CD',         changes: 'portal v1.4.2',          commit: '4c01b8' },
  { d: '2025-05-18 11:24', target: 'STAGE', project: 'cbl_core',     status: 'failed',  author: 'pedro.jose',   changes: 'failed contract test',   commit: '8a4c12' },
  { d: '2025-05-17 02:30', target: 'PROD',  project: 'cbl_core',     status: 'success', author: 'CI/CD',         changes: '4 models',                commit: '02ab84' },
]

const DCM = [
  { p: 'CBL_DCM_CORE',       desc: 'CORE schema · 184 dbt models',         envs: 'DEV/STG/PROD', files: 248, last_apply: '2025-05-22' },
  { p: 'CBL_DCM_GOVERNANCE', desc: 'masking · RLS · tags',                 envs: 'DEV/STG/PROD', files: 64,  last_apply: '2025-05-20' },
  { p: 'CBL_DCM_ML',          desc: 'ML registry · feature views',          envs: 'DEV/STG/PROD', files: 38,  last_apply: '2025-05-20' },
  { p: 'CBL_DCM_AGENTS',      desc: 'Cortex agents · semantic views · KBs', envs: 'DEV/STG/PROD', files: 42,  last_apply: '2025-05-19' },
  { p: 'CBL_DCM_APPS',        desc: 'Streamlit apps · SPCS services',       envs: 'DEV/STG/PROD', files: 22,  last_apply: '2025-05-19' },
]

const CI_CD_RUNS = [
  { id: 'run-2841', branch: 'main',         project: 'cbl_core',       stage: 'PROD',  status: 'success', author: 'CI/CD',        dur_s: 284, tests: '142/142', ts: '2025-05-22 02:30' },
  { id: 'run-2840', branch: 'main',         project: 'cbl_core',       stage: 'STAGE', status: 'success', author: 'CI/CD',        dur_s: 198, tests: '142/142', ts: '2025-05-22 02:15' },
  { id: 'run-2839', branch: 'feature/churn', project: 'cbl_ml',        stage: 'DEV',   status: 'success', author: 'leen.jacobs',  dur_s: 142, tests: '38/38',   ts: '2025-05-21 18:42' },
  { id: 'run-2838', branch: 'feature/rbac',  project: 'cbl_governance', stage: 'DEV',  status: 'failed',  author: 'pedro.jose',   dur_s: 48,  tests: '14/18',   ts: '2025-05-21 14:22' },
  { id: 'run-2837', branch: 'main',         project: 'cbl_apps',       stage: 'PROD',  status: 'success', author: 'CI/CD',        dur_s: 168, tests: '56/56',   ts: '2025-05-20 02:30' },
  { id: 'run-2836', branch: 'release/1.4.2', project: 'cbl_apps',      stage: 'STAGE', status: 'success', author: 'CI/CD',        dur_s: 124, tests: '56/56',   ts: '2025-05-19 22:10' },
]

const SCHEMA_CHANGES = [
  { id: 'SC-0188', db: 'CBL_CORE',       obj: 'CUSTOMER_360',       type: 'ADD COLUMN',    env: 'PROD',  author: 'pieter.claes',  ts: '2025-05-22 02:30', breaking: false },
  { id: 'SC-0187', db: 'CBL_ML',         obj: 'FEATURE_VIEW_CHURN', type: 'ALTER TABLE',   env: 'PROD',  author: 'leen.jacobs',  ts: '2025-05-20 18:42', breaking: false },
  { id: 'SC-0186', db: 'CBL_GOVERNANCE', obj: 'MASKING_PII_V2',     type: 'CREATE POLICY', env: 'PROD',  author: 'CI/CD',        ts: '2025-05-20 14:14', breaking: false },
  { id: 'SC-0185', db: 'CBL_CORE',       obj: 'FACT_BILLING_EVENTS', type: 'DROP COLUMN',   env: 'STAGE', author: 'pedro.jose',   ts: '2025-05-18 11:24', breaking: true  },
  { id: 'SC-0184', db: 'CBL_AGENTS',     obj: 'CUSTOMER_360_SV',    type: 'ALTER SV',      env: 'PROD',  author: 'CI/CD',        ts: '2025-05-17 02:30', breaking: false },
  { id: 'SC-0183', db: 'CBL_CORE',       obj: 'DIM_CUSTOMER',       type: 'ADD INDEX',     env: 'PROD',  author: 'CI/CD',        ts: '2025-05-16 02:30', breaking: false },
]

const ENV_DRIFT = [
  { table: 'CUSTOMER_360',       dev_cols: 84, stage_cols: 82, prod_cols: 82, drift_dev: 2, drift_stage: 0 },
  { table: 'FACT_BILLING_EVENTS', dev_cols: 28, stage_cols: 27, prod_cols: 28, drift_dev: 0, drift_stage: -1 },
  { table: 'DIM_CUSTOMER',       dev_cols: 42, stage_cols: 42, prod_cols: 42, drift_dev: 0, drift_stage: 0 },
  { table: 'AGG_CHURN_RISK',     dev_cols: 18, stage_cols: 16, prod_cols: 16, drift_dev: 2, drift_stage: 0 },
  { table: 'FEATURE_VIEW_CHURN', dev_cols: 22, stage_cols: 22, prod_cols: 20, drift_dev: 0, drift_stage: 2 },
]

const CLONE_OPS = [
  { name: 'DEV_SNAPSHOT_2025_05_22', source: 'Cable Bahamas-DATA_PROD', target: 'Cable Bahamas-DATA_DEV', type: 'zero-copy', size_tb: 7.4, ts: '2025-05-22 00:01', author: 'CI/CD',       status: 'ok' },
  { name: 'STAGE_SYNC_2025_05_22',   source: 'Cable Bahamas-DATA_PROD', target: 'Cable Bahamas-DATA_STG', type: 'zero-copy', size_tb: 7.4, ts: '2025-05-22 00:30', author: 'CI/CD',       status: 'ok' },
  { name: 'ADHOC_TEST_LIAM',         source: 'Cable Bahamas-DATA_STG',  target: 'Cable Bahamas-DATA_DEV', type: 'schema',    size_tb: 0.2, ts: '2025-05-21 09:12', author: 'pieter.claes', status: 'ok' },
  { name: 'ML_FEATURE_CLONE',        source: 'Cable Bahamas-DATA_PROD', target: 'Cable Bahamas-DATA_DEV', type: 'zero-copy', size_tb: 0.9, ts: '2025-05-20 14:00', author: 'leen.jacobs', status: 'ok' },
]

const RELEASE_CALENDAR = [
  { release: 'v1.5.0',  date: '2025-06-04', env: 'PROD',  scope: 'cbl_core · churn v4 · B2B 360',        risk: 'med',  rc_ready: true },
  { release: 'v1.4.3',  date: '2025-05-28', env: 'STAGE', scope: 'cbl_governance · new masking policies', risk: 'low',  rc_ready: true },
  { release: 'v1.5.1',  date: '2025-06-11', env: 'PROD',  scope: 'cbl_agents · semantic-view refactor',   risk: 'high', rc_ready: false },
  { release: 'v1.6.0',  date: '2025-06-25', env: 'PROD',  scope: 'cbl_ml · GPU pipeline + features v2',  risk: 'high', rc_ready: false },
]

const DEPLOY_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D-${13 - i}`,
  dev:   2 + Math.round(Math.abs(Math.sin(i / 3)) * 3),
  stage: Math.round(Math.abs(Math.sin(i / 4))),
  prod:  Math.round(Math.abs(Math.sin(i / 5))),
  failed: Math.round(Math.abs(Math.sin(i / 7)) * 0.8),
}))

const SCHEMA_CHANGE_TREND = Array.from({ length: 14 }, (_, i) => ({
  d: `D-${13 - i}`,
  additive: 2 + Math.round(Math.abs(Math.sin(i / 3)) * 2),
  breaking: [0,0,0,1,0,0,0,0,0,1,0,0,0,0][i],
}))

const CI_METRICS = Array.from({ length: 7 }, (_, i) => ({
  d: `D-${6 - i}`,
  success_rate: 94 + Math.round(Math.sin(i / 2) * 3),
  avg_dur_s:    182 + Math.round(Math.cos(i / 3) * 20),
  runs:         4 + [1, 0, 2, 1, 0, 1, 2][i],
}))

export default function EnvironmentsPage() {
  const [tab, setTab] = useState<EnvTab>('Environments')
  const [deployTarget, setDeployTarget] = useState<'all' | 'DEV' | 'STAGE' | 'PROD'>('all')
  const [schemaType, setSchemaType] = useState<'all' | 'breaking' | 'additive'>('all')
  const [cloneEnv, setCloneEnv] = useState('all')
  const [releaseRisk, setReleaseRisk] = useState<'all' | 'high' | 'med' | 'low'>('all')
  const [driftTable, setDriftTable] = useState<'all' | 'dev' | 'stage'>('all')
  const [ciProject, setCiProject] = useState('all')

  const filteredDeploys = useMemo(() =>
    deployTarget === 'all' ? DEPLOYS : DEPLOYS.filter(d => d.target === deployTarget)
  , [deployTarget])

  const filteredSchemas = useMemo(() =>
    schemaType === 'all'
      ? SCHEMA_CHANGES
      : SCHEMA_CHANGES.filter(s => schemaType === 'breaking' ? s.breaking : !s.breaking)
  , [schemaType])

  const filteredReleases = useMemo(() =>
    releaseRisk === 'all' ? RELEASE_CALENDAR : RELEASE_CALENDAR.filter(r => r.risk === releaseRisk)
  , [releaseRisk])

  const filteredDrift = useMemo(() =>
    ENV_DRIFT.filter(d => driftTable === 'all' || (driftTable === 'dev' ? d.drift_dev > 0 : d.drift_stage > 0))
  , [driftTable])

  const filteredCi = useMemo(() =>
    ciProject === 'all' ? CI_CD_RUNS : CI_CD_RUNS.filter(c => c.project === ciProject)
  , [ciProject])

  const deploySuccessRate = useMemo(() => {
    const ok = DEPLOYS.filter(d => d.status === 'success').length
    return ((ok / DEPLOYS.length) * 100).toFixed(0)
  }, [])

  const totalDcmFiles = useMemo(() =>
    DCM.reduce((s, d) => s + d.files, 0)
  , [])

  const upcomingHighRisk = useMemo(() =>
    RELEASE_CALENDAR.filter(r => r.risk === 'high').length
  , [])

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title={tt('Environments & promotion')}
        subtitle={tt('DEV → STAGE → PROD → DR · CI/CD · DCM projects · schema changes · env drift · clone ops · release calendar')}
      />

      {/* KPI row 1 */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label={tt('Environments')}
          value="4"
          delta={tt('DEV · STAGE · PROD · DR')}
          trend="up"
          icon={Server}
        />
        <KpiCard
          label={tt('Deploy success rate 7d')}
          value={`${deploySuccessRate}%`}
          delta={tt('7 deploys · 1 failed')}
          trend="up"
          icon={CheckCircle2}
        />
        <KpiCard
          label={tt('DCM projects')}
          value="5"
          delta={`${totalDcmFiles} ${tt('files · all 3 envs')}`}
          trend="up"
          icon={GitBranch}
        />
        <KpiCard
          label={tt('Schema changes 7d')}
          value="6"
          delta={tt('1 breaking · 5 additive')}
          trend="down"
          icon={AlertTriangle}
        />
        <KpiCard
          label={tt('Upcoming releases')}
          value="4"
          delta={`${upcomingHighRisk} ${tt('high-risk · approval needed')}`}
          accent
          icon={Clock}
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label={tt('Clone ops 7d')}
          value="4"
          delta={tt('3 zero-copy · 1 schema')}
          trend="up"
          icon={Zap}
        />
        <KpiCard
          label={tt('Env drift tables')}
          value="2"
          delta={tt('DEV has 2 extra cols')}
          accent
        />
        <KpiCard
          label={tt('CI/CD avg duration')}
          value="198s"
          delta={tt('+12s vs 7d avg')}
          trend="down"
          icon={Clock}
        />
        <KpiCard
          label={tt('PROD release cadence')}
          value="nightly"
          delta={tt('02:00 UTC window')}
          trend="up"
        />
        <KpiCard
          label={tt('DR replication lag')}
          value="<1m"
          delta={tt('continuous · cross-region')}
          trend="up"
          icon={Server}
        />
      </div>

      {/* Env health summary */}
      <Panel title={tt('Environment health summary · Cable Bahamas CI/CD platform')}>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">{tt('All envs healthy')}</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">4 / 4</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{tt('DEV · STAGE · PROD · DR · all reachable')}</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-sky-700 font-bold">{tt('CI/CD pipelines')}</div>
            <div className="text-2xl font-extrabold text-sky-700 mt-1">5 active</div>
            <div className="text-[10px] text-sky-600 mt-0.5">{tt('GitHub Actions · avg 198s run time')}</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{tt('Schema drift')}</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">2 tables</div>
            <div className="text-[10px] text-amber-600 mt-0.5">{tt('DEV has 4 extra cols vs PROD baseline')}</div>
          </div>
          <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
            <div className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">{tt('Next PROD release')}</div>
            <div className="text-2xl font-extrabold text-violet-700 mt-1">2025-05-28</div>
            <div className="text-[10px] text-violet-600 mt-0.5">{tt('v1.4.3 · LOW risk · RC ready')}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3 border-t border-black/5 pt-3 text-[11px]">
          <span className="text-vfes-dark/50">{tt('Quick links:')}</span>
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/observability"    className="text-vfes-dark font-semibold hover:underline">{tt('Observability')}</Link>
          <Link to="/portal/cost"             className="text-vfes-dark font-semibold hover:underline">{tt('Cost intelligence')}</Link>
          <Link to="/portal/data-products"    className="text-vfes-dark font-semibold hover:underline">{tt('Data products')}</Link>
        </div>
      </Panel>

      {/* ML Insight */}
      <MlInsightSection
        heading="Deploy risk scoring"
        models={[
          { name: 'DEPLOY_RISK_MODEL',     metric: '94.2%', sub: 'accuracy · trained on 6-month CI/CD history' },
          { name: 'SCHEMA_IMPACT_SCORE',   metric: '0.88',  sub: 'F1 · predicts downstream breakage from schema change' },
          { name: 'ENV_DRIFT_CLASSIFIER',  metric: '96.1%', sub: 'precision · flags DEV/PROD column divergence' },
        ]}
        agentLabel="Run deployment risk assessment"
        agentSteps={[
          'Diff DEV vs STAGE vs PROD schema for target objects',
          'Score change set via SCHEMA_IMPACT_SCORE',
          'Check ENV_DRIFT_CLASSIFIER for column divergence',
          'Query CI_CD_RUNS history for similar change patterns',
          'Output risk level, impacted downstream tables, and recommended rollback plan',
        ]}
        agentBlurb="Cortex Analyst + Snowflake ML models assess deployment risk before promotion, detect schema drift between environments, and recommend safe release windows."
        decision={{
          title:     'v1.5.1 semantic-view refactor flagged as HIGH RISK — approval required',
          detail:    'CUSTOMER_360_SV refactor changes 4 metric definitions used by 3 downstream Cortex agents and 2 Streamlit dashboards. SCHEMA_IMPACT_SCORE: 0.82. Recommend: promote to STAGE first, run agent smoke tests, hold PROD until sign-off from CDO.',
          impact:    'Prevents regression in CEO_BRIEFING_AGENT and CRO_REVENUE_ANALYST',
          risk:      'Manual smoke test adds 4h to release window',
          linkTo:    '/portal/data-contracts',
          linkLabel: 'View data contracts',
        }}
        chart={{
          kind:  'bar',
          title: 'Deployment risk score · last 14 CI/CD runs',
          data:  Array.from({ length: 14 }, (_, i) => ({
            d:    `D-${13 - i}`,
            risk: parseFloat((0.1 + Math.abs(Math.sin(i / 3)) * 0.6 + (i === 6 ? 0.2 : 0)).toFixed(2)),
          })),
          xKey: 'd',
          series: [{ key: 'risk', name: 'Deploy risk score', color: AMBER }],
          colorBy: { key: 'risk', high: 0.6, mid: 0.3 },
          note: 'Score > 0.6 = high risk. Run D-7 spike corresponds to the breaking FACT_BILLING_EVENTS schema change.',
        }}
      />

      {/* 8-pill tab bar */}
      <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 border border-black/5 w-fit">
        {ENV_TABS.map((t) => (
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

      {/* ─── Tab: Environments ──────────────────────────────── */}
      {tab === 'Environments' && (<>
        <div className="grid grid-cols-4 gap-3">
          {ENVS.map((e) => (
            <div key={e.e} className="bg-white rounded-xl border border-black/5 p-4">
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold mb-1">{tt(e.e)}</div>
              <div className="font-mono text-[12px] font-bold">{e.account}</div>
              <div className="text-[11px] text-vfes-dark/65 mt-2">{e.warehouses} {tt('WH')} · {e.dbs} {tt('DBs')}</div>
              <div className="text-[11px] text-vfes-dark/65">{tt('target:')} <span className="font-mono">{e.dbt_target}</span></div>
              <div className="text-[11px] text-vfes-dark/65">{tt('branch:')} <span className="font-mono">{e.branch}</span></div>
              <div className="text-[10px] text-vfes-dark/55 mt-2 pt-2 border-t border-black/5">{tt('last deploy')} {e.lastDeploy}</div>
            </div>
          ))}
        </div>
        <Panel title={tt('Promotion flow · DEV → STAGE → PROD → DR')}>
          <div className="flex items-center gap-2 overflow-x-auto py-4">
            {ENVS.map((e, i) => (
              <div key={e.e} className="flex items-center gap-2">
                <div className={`px-4 py-3 rounded-lg border-2 ${e.e === 'PROD' ? 'border-emerald-400 bg-emerald-50' : e.e === 'DR' ? 'border-violet-300 bg-violet-50' : 'border-zinc-300 bg-white'} min-w-[180px]`}>
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/50 font-bold">{e.e}</div>
                  <div className="font-mono text-[11px] font-bold">{e.account}</div>
                  <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt('via')} {e.dbt_target}</div>
                </div>
                {i < ENVS.length - 1 && <ArrowRight className="w-5 h-5 text-vfes-dark/40 shrink-0" />}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-vfes-dark/55 mt-2">
            {tt('PR → CI tests → STAGE smoke → manual approval → PROD nightly window 02:00 UTC · DR cross-region replication continuous')}
          </div>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/catalog"           className="text-vfes-dark font-semibold hover:underline">{tt('Catalog · object browser')}</Link>
          <Link to="/portal/cost"              className="text-vfes-dark font-semibold hover:underline">{tt('Cost by environment')}</Link>
        </div>
        <Panel title={tt('Environment comparison · warehouses / databases / schemas')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ENVS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="e" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="warehouses" fill={BLUE}  name={tt('Warehouses')} />
              <Bar dataKey="dbs"        fill={GREEN} name={tt('Databases')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Cable Bahamas uses Snowflake Business Critical edition across all environments. PROD and DR run in AWS us-east-1 with cross-region replication to us-west-2. DEV and STAGE use zero-copy clones from PROD nightly. All environments share the same Snowflake organization for unified governance via RBAC and masking policies.')}
        </div>
      </>)}

      {/* ─── Tab: Deploy History ────────────────────────────── */}
      {tab === 'Deploy History' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Target:')}</span>
          {(['all', 'DEV', 'STAGE', 'PROD'] as const).map(v => (
            <button
              key={v}
              onClick={() => setDeployTarget(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${deployTarget === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-vfes-dark/50">
            {tt('Deploy success rate:')} <span className="font-bold text-emerald-600">{deploySuccessRate}%</span>
          </span>
        </div>
        <Panel title={tt('Recent deployments · filtered')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('When')}</th>
                <th className="text-left">{tt('Target')}</th>
                <th className="text-left">{tt('Project')}</th>
                <th className="text-left">{tt('Status')}</th>
                <th className="text-left">{tt('Author')}</th>
                <th className="text-left">{tt('Changes')}</th>
                <th className="text-left">{tt('Commit')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeploys.map((d, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[10px]">{d.d}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${d.target === 'PROD' ? 'bg-emerald-100 text-emerald-700' : d.target === 'STAGE' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {d.target}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]">{d.project}</td>
                  <td>
                    {d.status === 'success'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  </td>
                  <td className="text-[11px]">{d.author}</td>
                  <td className="text-[11px] text-vfes-dark/70">{d.changes}</td>
                  <td className="font-mono text-[10px] text-vfes-dark">{d.commit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Deploy frequency · 14d')}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={DEPLOY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="dev"    stackId="a" stroke={BLUE}    fill={BLUE}    fillOpacity={0.3} name={tt('DEV')} />
              <Area type="monotone" dataKey="stage"  stackId="a" stroke={AMBER}   fill={AMBER}   fillOpacity={0.3} name={tt('STAGE')} />
              <Area type="monotone" dataKey="prod"   stackId="a" stroke={GREEN}   fill={GREEN}   fillOpacity={0.3} name={tt('PROD')} />
              <Area type="monotone" dataKey="failed" stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name={tt('Failed')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Deploy frequency trend · 14d · DEV / STAGE / PROD')}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={DEPLOY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="dev"   stackId="a" stroke={BLUE}  fill={BLUE}  fillOpacity={0.3} name={tt('DEV')} />
              <Area type="monotone" dataKey="stage" stackId="a" stroke={AMBER} fill={AMBER} fillOpacity={0.3} name={tt('STAGE')} />
              <Area type="monotone" dataKey="prod"  stackId="a" stroke={GREEN} fill={GREEN} fillOpacity={0.3} name={tt('PROD')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-engineering" className="text-vfes-dark font-semibold hover:underline">{tt('Data engineering')}</Link>
          <Link to="/portal/lineage"           className="text-vfes-dark font-semibold hover:underline">{tt('Lineage · change impact')}</Link>
        </div>
      </>)}

      {/* ─── Tab: CI/CD ─────────────────────────────────────── */}
      {tab === 'CI/CD' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Project:')}</span>
          {['all', 'cbl_core', 'cbl_ml', 'cbl_governance', 'cbl_apps'].map(v => (
            <button
              key={v}
              onClick={() => setCiProject(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${ciProject === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <Panel title={tt('CI/CD run history · filtered')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Run ID')}</th>
                <th className="text-left">{tt('Branch')}</th>
                <th className="text-left">{tt('Project')}</th>
                <th className="text-left">{tt('Stage')}</th>
                <th className="text-left">{tt('Status')}</th>
                <th className="text-left">{tt('Author')}</th>
                <th className="text-right">{tt('Dur s')}</th>
                <th className="text-left">{tt('Tests')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCi.map((c) => (
                <tr key={c.id} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark text-[11px]">{c.id}</td>
                  <td className="font-mono text-[11px]">{c.branch}</td>
                  <td className="font-mono text-[11px]">{c.project}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.stage === 'PROD' ? 'bg-emerald-100 text-emerald-700' : c.stage === 'STAGE' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td>
                    {c.status === 'success'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  </td>
                  <td className="text-[11px]">{c.author}</td>
                  <td className="text-right font-mono">{c.dur_s}</td>
                  <td className="font-mono text-[11px]">{c.tests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('CI/CD metrics · 7d success rate / avg duration')}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CI_METRICS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="success_rate" stroke={GREEN} strokeWidth={2} name={tt('Success rate %')} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('CI/CD run duration trend · 7d avg (s)')}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={CI_METRICS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="avg_dur_s" fill={BLUE} name={tt('Avg duration s')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('CI provider')}</div>
            <div className="font-mono font-bold">GitHub Actions</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('main + feature branches')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('IaC / schema mgmt')}</div>
            <div className="font-mono font-bold">snow DCM + dbt</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('5 DCM projects · 184 dbt models')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Test framework')}</div>
            <div className="font-mono font-bold">dbt tests + data contracts</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('142 model tests · 18 contract checks')}</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-800">
          {tt('CI/CD pipeline stages: (1) lint + compile dbt, (2) run unit tests, (3) data contract validation, (4) STAGE deploy + smoke, (5) PROD release gate with manual CDO approval for breaking changes. Median pipeline time: 198 seconds. PROD window: 02:00-04:00 UTC nightly.')}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-quality" className="text-vfes-dark font-semibold hover:underline">{tt('Data quality · contract tests')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark font-semibold hover:underline">{tt('Observability · pipeline health')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Schema Changes ────────────────────────────── */}
      {tab === 'Schema Changes' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Filter:')}</span>
          {(['all', 'breaking', 'additive'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSchemaType(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${schemaType === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <Panel title={tt('Schema change log · last 14 changes')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('ID')}</th>
                <th className="text-left">{tt('Database')}</th>
                <th className="text-left">{tt('Object')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-left">{tt('Env')}</th>
                <th className="text-left">{tt('Author')}</th>
                <th className="text-left">{tt('Timestamp')}</th>
                <th className="text-left">{tt('Breaking')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemas.map((s) => (
                <tr key={s.id} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark text-[11px]">{s.id}</td>
                  <td className="font-mono text-[11px]">{s.db}</td>
                  <td className="font-mono text-[11px] font-semibold">{s.obj}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(s.type)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.env === 'PROD' ? 'bg-emerald-100 text-emerald-700' : s.env === 'STAGE' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {s.env}
                    </span>
                  </td>
                  <td className="text-[11px]">{s.author}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/55">{s.ts}</td>
                  <td>
                    {s.breaking
                      ? <span className="text-[10px] font-bold text-rose-600 uppercase">YES</span>
                      : <span className="text-[10px] text-emerald-600 uppercase">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title={tt('Schema change trend · 14d additive vs breaking')}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={SCHEMA_CHANGE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="additive" stackId="a" stroke={GREEN}   fill={GREEN}   fillOpacity={0.3} name={tt('Additive')} />
              <Area type="monotone" dataKey="breaking" stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name={tt('Breaking')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={tt('Schema change trend · 14d additive vs breaking')}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={SCHEMA_CHANGE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="additive" stackId="a" stroke={GREEN}   fill={GREEN}   fillOpacity={0.3} name={tt('Additive')} />
              <Area type="monotone" dataKey="breaking" stackId="a" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name={tt('Breaking')} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 grid grid-cols-4 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Breaking changes 7d')}</div>
            <div className="text-2xl font-extrabold text-rose-600">1</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('FACT_BILLING_EVENTS DROP COLUMN')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Additive changes 7d')}</div>
            <div className="text-2xl font-extrabold text-emerald-600">5</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('ADD COLUMN · CREATE POLICY · ALTER SV')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Contract test failures')}</div>
            <div className="text-2xl font-extrabold text-amber-600">1</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('run-2838 · STAGE contract check')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Avg review time')}</div>
            <div className="text-2xl font-extrabold">4.2h</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('breaking changes require CDO sign-off')}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-contracts" className="text-vfes-dark font-semibold hover:underline">{tt('Data contracts · schema SLAs')}</Link>
          <Link to="/portal/lineage"        className="text-vfes-dark font-semibold hover:underline">{tt('Lineage · downstream impact')}</Link>
          <Link to="/portal/horizon"        className="text-vfes-dark font-semibold hover:underline">{tt('Horizon · governance')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Env Drift ─────────────────────────────────── */}
      {tab === 'Env Drift' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Show:')}</span>
          {(['all', 'dev', 'stage'] as const).map(v => (
            <button
              key={v}
              onClick={() => setDriftTable(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${driftTable === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v === 'dev' ? 'DEV drift' : v === 'stage' ? 'STAGE drift' : 'All tables')}
            </button>
          ))}
        </div>
        <Panel title={tt('Schema drift · DEV vs STAGE vs PROD column counts')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Table')}</th>
                <th className="text-right">{tt('DEV cols')}</th>
                <th className="text-right">{tt('STAGE cols')}</th>
                <th className="text-right">{tt('PROD cols')}</th>
                <th className="text-right">{tt('DEV drift')}</th>
                <th className="text-right">{tt('STAGE drift')}</th>
                <th className="text-left">{tt('Risk')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrift.map((d) => (
                <tr key={d.table} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{d.table}</td>
                  <td className="text-right font-mono">{d.dev_cols}</td>
                  <td className="text-right font-mono">{d.stage_cols}</td>
                  <td className="text-right font-mono">{d.prod_cols}</td>
                  <td className={`text-right font-mono font-bold ${d.drift_dev > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {d.drift_dev > 0 ? `+${d.drift_dev}` : '—'}
                  </td>
                  <td className={`text-right font-mono font-bold ${d.drift_stage !== 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {d.drift_stage !== 0 ? `${d.drift_stage > 0 ? '+' : ''}${d.drift_stage}` : '—'}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${d.drift_dev + Math.abs(d.drift_stage) > 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {d.drift_dev + Math.abs(d.drift_stage) > 2 ? tt('DRIFT') : tt('OK')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">
            {tt('Drift = columns in target env not present in PROD baseline. DEV drift is expected during feature development. STAGE drift against PROD is a promotion blocker.')}
          </div>
        </Panel>
        <Panel title={tt('Env drift · column delta chart · DEV / STAGE vs PROD')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ENV_DRIFT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="table" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="drift_dev"   fill={AMBER}   name={tt('DEV drift cols')} />
              <Bar dataKey="drift_stage" fill="#dc2626" name={tt('STAGE drift cols')} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-vfes-dark/50 mt-2">
            {tt('Positive = extra columns in that env vs PROD. Negative = columns missing vs PROD (promotion blocker). Zero = aligned.')}
          </div>
        </Panel>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/catalog"        className="text-vfes-dark font-semibold hover:underline">{tt('Catalog · schema browser')}</Link>
          <Link to="/portal/data-contracts" className="text-vfes-dark font-semibold hover:underline">{tt('Data contracts')}</Link>
          <Link to="/portal/data-quality"   className="text-vfes-dark font-semibold hover:underline">{tt('Data quality checks')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Clone Ops ─────────────────────────────────── */}
      {tab === 'Clone Ops' && (<>
        <Panel title={tt('Zero-copy clone operations · last 30 days')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Clone name')}</th>
                <th className="text-left">{tt('Source env')}</th>
                <th className="text-left">{tt('Target env')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-right">{tt('Size TB')}</th>
                <th className="text-left">{tt('Author')}</th>
                <th className="text-left">{tt('Timestamp')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {CLONE_OPS.map((c) => (
                <tr key={c.name} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-[11px] font-semibold">{c.name}</td>
                  <td className="font-mono text-[11px]">{c.source}</td>
                  <td className="font-mono text-[11px]">{c.target}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.type === 'zero-copy' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                      {tt(c.type)}
                    </span>
                  </td>
                  <td className="text-right font-mono">{c.size_tb.toFixed(1)}</td>
                  <td className="text-[11px]">{c.author}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/55">{c.ts}</td>
                  <td>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">
            {tt('Zero-copy clones share storage with the source — no additional storage cost until data diverges. CI/CD clones DEV and STAGE from PROD nightly to ensure consistent test data.')}
          </div>
        </Panel>
        <div className="mt-4 grid grid-cols-3 gap-4 text-[11px]">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold">{tt('Clone storage overhead')}</div>
            <div className="text-2xl font-extrabold mt-1">~0 TB</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('Zero-copy · no divergence yet')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold">{tt('Nightly clone duration')}</div>
            <div className="text-2xl font-extrabold mt-1">~12s</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('Metadata-only · instant provisioning')}</div>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold">{tt('Total data cloned (logical)')}</div>
            <div className="text-2xl font-extrabold mt-1">16.8 TB</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('Across 4 clone operations this week')}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cost"        className="text-vfes-dark font-semibold hover:underline">{tt('Cost intelligence · storage')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark font-semibold hover:underline">{tt('Observability · freshness')}</Link>
        </div>
        <Panel title={tt('Clone cost vs logical size · all recent operations')}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CLONE_OPS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" TB" />
              <Tooltip />
              <Bar dataKey="size_tb" fill={BLUE} name={tt('Logical size TB')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </>)}

      {/* ─── Tab: Release Calendar ──────────────────────────── */}
      {tab === 'Release Calendar' && (<>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-vfes-dark/55">{tt('Risk level:')}</span>
          {(['all', 'high', 'med', 'low'] as const).map(v => (
            <button
              key={v}
              onClick={() => setReleaseRisk(v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${releaseRisk === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/60'}`}
            >
              {tt(v)}
            </button>
          ))}
        </div>
        <Panel title={tt('Upcoming releases · release calendar')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Release')}</th>
                <th className="text-left">{tt('Target date')}</th>
                <th className="text-left">{tt('Env')}</th>
                <th className="text-left">{tt('Scope')}</th>
                <th className="text-left">{tt('Risk')}</th>
                <th className="text-left">{tt('RC ready')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReleases.map((r) => (
                <tr key={r.release} className="border-b border-black/5">
                  <td className="py-1.5 font-mono text-vfes-dark font-bold">{r.release}</td>
                  <td className="font-mono text-[11px]">{r.date}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.env === 'PROD' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.env}
                    </span>
                  </td>
                  <td className="text-[11px] text-vfes-dark/70 max-w-[300px]">{tt(r.scope)}</td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.risk === 'high' ? 'bg-rose-100 text-rose-700' : r.risk === 'med' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {tt(r.risk)}
                    </span>
                  </td>
                  <td>
                    {r.rc_ready
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] text-vfes-dark/50 mt-2">
            {tt('PROD releases require: RC tagged, all CI tests green, data contract tests pass, manual CDO sign-off for breaking changes, minimum 24h STAGE soak.')}
          </div>
        </Panel>
        <Panel title={tt('Release risk distribution · upcoming · all envs')}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { risk: tt('Low'),  count: RELEASE_CALENDAR.filter(r => r.risk === 'low').length  },
              { risk: tt('Med'),  count: RELEASE_CALENDAR.filter(r => r.risk === 'med').length  },
              { risk: tt('High'), count: RELEASE_CALENDAR.filter(r => r.risk === 'high').length },
            ]}>
              <XAxis dataKey="risk" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" name={tt('Releases')}>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Releases pending RC')}</div>
            <div className="text-2xl font-extrabold text-amber-600">2</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('v1.5.1 + v1.6.0 · approvals needed')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Next PROD window')}</div>
            <div className="text-2xl font-extrabold mt-1 text-[16px]">2025-05-28</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('v1.4.3 governance policies · LOW risk')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('High-risk releases 30d')}</div>
            <div className="text-2xl font-extrabold text-rose-600">2</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('v1.5.1 SV refactor · v1.6.0 ML GPU pipeline')}</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
          {tt('HIGH risk releases require: DEPLOY_RISK_MODEL score < 0.6, SCHEMA_IMPACT_SCORE < 0.5, all data contract tests pass, CDO sign-off, and 48h STAGE soak period. Current queue: v1.5.1 (score 0.82) and v1.6.0 (score 0.71) are both pending CDO review.')}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/data-contracts" className="text-vfes-dark font-semibold hover:underline">{tt('Data contracts · release gates')}</Link>
          <Link to="/portal/ai-insights"    className="text-vfes-dark font-semibold hover:underline">{tt('AI insights · release forecasts')}</Link>
          <Link to="/portal/agents"         className="text-vfes-dark font-semibold hover:underline">{tt('Agents · smoke tests')}</Link>
        </div>
      </>)}

      {/* ─── Tab: Promotion ─────────────────────────────────── */}
      {tab === 'Promotion' && (<>
        <Panel title={tt('DCM (Database Change Management) projects')}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Project')}</th>
                <th className="text-left">{tt('Description')}</th>
                <th className="text-left">{tt('Envs')}</th>
                <th className="text-right">{tt('Files')}</th>
                <th className="text-left">{tt('Last apply')}</th>
              </tr>
            </thead>
            <tbody>
              {DCM.map((d) => (
                <tr key={d.p} className="border-b border-black/5">
                  <td className="py-1.5 font-mono font-semibold">{d.p}</td>
                  <td className="text-[11px]">{tt(d.desc)}</td>
                  <td className="font-mono text-[10px]">{d.envs}</td>
                  <td className="text-right font-mono">{d.files}</td>
                  <td className="font-mono text-[10px]">{d.last_apply}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={tt('Mobile / RAN environments')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5 mobile envs · 7.2K credits/mo')}</span>}>
          <table className="w-full text-[12px]">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr>
                <th className="py-1.5">{tt('Environment')}</th>
                <th>{tt('Type')}</th>
                <th>{tt('Warehouse')}</th>
                <th>{tt('Credits / mo')}</th>
                <th>{tt('Owner')}</th>
                <th>{tt('Data freshness')}</th>
                <th>{tt('Locked')}</th>
                <th>{tt('Policy')}</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_ENVIRONMENTS.map((e) => (
                <tr key={e.name} className="border-t border-black/5">
                  <td className="py-2 font-mono text-xs font-bold text-vfes-dark">{e.name}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(e.type)}</td>
                  <td className="font-mono text-xs">{e.warehouse}</td>
                  <td className="font-mono text-xs">{e.creditsMo.toFixed(1)}K</td>
                  <td className="text-[11px]">{tt(e.owner)}</td>
                  <td className="font-mono text-xs">{tt(e.dataFreshness)}</td>
                  <td className="font-mono text-xs">{e.locked ? '🔒' : '—'}</td>
                  <td className="text-[11px] text-vfes-dark/65">{tt(e.policy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65 mt-3">
            {tt('MOBILE_PROD locked under change-control + approvals. MOBILE_ML uses GPU pools + Snowpark Container Services for model training.')}
          </div>
        </Panel>
        <Panel title={tt('DCM project file count · all projects')}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={DCM} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="p" type="category" tick={{ fontSize: 9 }} width={140} />
              <Tooltip />
              <Bar dataKey="files" fill={PURPLE} name={tt('Files')} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('MOBILE_PROD locked under change-control + approvals. MOBILE_ML uses GPU pools + Snowpark Container Services for model training. Mobile environments share the same governance policies (masking, RBAC) as the core Cable Bahamas data platform via centralized DCM_GOVERNANCE project.')}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Total DCM files')}</div>
            <div className="text-2xl font-extrabold mt-1">{DCM.reduce((s, d) => s + d.files, 0)}</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('across 5 DCM projects · 3 envs each')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('Last DCM apply')}</div>
            <div className="text-2xl font-extrabold mt-1 text-[16px]">2025-05-22</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('CBL_DCM_CORE · PROD env · all clean')}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-vfes-dark/45 font-bold mb-1">{tt('DCM drift checks')}</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600">0</div>
            <div className="text-[10px] text-vfes-dark/55">{tt('all envs in sync with manifest')}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <Link to="/portal/cost"        className="text-vfes-dark font-semibold hover:underline">{tt('Cost by environment')}</Link>
          <Link to="/portal/rbac"        className="text-vfes-dark font-semibold hover:underline">{tt('RBAC · env permissions')}</Link>
          <Link to="/portal/observability" className="text-vfes-dark font-semibold hover:underline">{tt('Observability · env health')}</Link>
        </div>
      </>)}

      <div className="border-t border-black/5 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold mb-3">
          {tt('Related Snowflake surfaces')}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <Link to="/portal/catalog" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Catalog')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Browse objects')}</div>
          </Link>
          <Link to="/portal/lineage" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Lineage')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Change impact')}</div>
          </Link>
          <Link to="/portal/data-contracts" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Data contracts')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Schema SLAs')}</div>
          </Link>
          <Link to="/portal/observability" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Observability')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Pipeline health')}</div>
          </Link>
          <Link to="/portal/cost" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Cost')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Credits per env')}</div>
          </Link>
          <Link to="/portal/data-engineering" className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition">
            <div className="text-[11px] font-semibold">{tt('Data engineering')}</div>
            <div className="text-[10px] text-vfes-dark/50">{tt('Pipelines · dbt')}</div>
          </Link>
        </div>
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-black/5 text-[11px] text-vfes-dark/60">
          {tt('Environment management uses Snowflake Database Change Management (snow dcm), dbt Cloud for model transformations, GitHub Actions for CI/CD automation, and Snowflake zero-copy cloning for fast DEV/STAGE provisioning from PROD snapshots. All environment changes are recorded in ACCOUNT_USAGE.QUERY_HISTORY and monitored via the Observability event table.')}
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 font-bold flex items-center gap-2">
        <GitBranch className="w-3 h-3" />
        {tt('source: GitHub Actions · snow dcm · dbt Cloud runs · Snowflake replication')}
      </div>
      <div className="text-[10px] text-vfes-dark/30 flex items-center gap-2 mt-1">
        {tt('deploy risk: DEPLOY_RISK_MODEL · SCHEMA_IMPACT_SCORE · ENV_DRIFT_CLASSIFIER — all Snowflake ML models · Model Registry · retrained weekly on CI/CD history')}
      </div>
      <div className="text-[10px] text-vfes-dark/25 mt-1">
        {tt('Environments schema: CBL_GOV · object: ENVIRONMENT_REGISTRY · refreshed on each CI/CD run · version controlled via GitHub')}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-vfes-dark/50">
        <div>{tt('4 environments · DEV / STAGE / PROD / DR')}</div>
        <div>{tt('5 DCM projects · 414 total managed files')}</div>
        <div>{tt('7 deploys last 7d · 87.5% success rate')}</div>
        <div>{tt('02:00 UTC nightly PROD release window')}</div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-vfes-dark/40">
        <div>{tt('Snowflake Business Critical · AWS us-east-1')}</div>
        <div>{tt('DR: cross-region replication to us-west-2')}</div>
        <div>{tt('Zero-copy clone provisioning: ~12s nightly')}</div>
        <div>{tt('Deploy risk model retrained weekly · 6-month window')}</div>
      </div>
      <div className="mt-1 grid grid-cols-4 gap-2 text-[10px] text-vfes-dark/30">
        <div>{tt('dbt: 184 models · 5 sources · 142 tests')}</div>
        <div>{tt('DCM: 5 projects · 414 files · YAML-based IaC')}</div>
        <div>{tt('CI gate: lint → test → contract → stage smoke')}</div>
        <div>{tt('PROD gate: manual CDO sign-off for breaking changes')}</div>
      </div>
    </div>
  )
}
