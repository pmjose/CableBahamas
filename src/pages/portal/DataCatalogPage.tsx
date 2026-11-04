import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel } from '../../components/Panel'
import KpiCard from '../../components/KpiCard'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import {
  Database, ChevronRight, Search, Table2, Eye, Workflow, Bot, FileCode,
  Box, Tag, ShieldCheck, Layers, Sparkles, X, Smartphone, Activity,
  TrendingUp, AlertTriangle, GitBranch, BarChart2, Clock, Star, Users,
  CheckCircle, Zap,
} from 'lucide-react'
import { MOBILE_CATALOG } from './_mobile_data'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ComposedChart, ReferenceLine,
} from 'recharts'

const BLUE = '#FF4438', NAVY = '#11567F', GREEN = '#10B981', AMBER = '#F59E0B', PURPLE = '#7C3AED', SLATE = '#94a3b8'
const TS = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }

type ObjType = 'table' | 'view' | 'mat_view' | 'dyn_table' | 'stage' | 'stream' | 'task' | 'sequence' | 'function' | 'procedure' | 'semantic_view' | 'cortex_search' | 'cortex_agent' | 'pipe'

type Obj = {
  name: string
  type: ObjType
  rows?: string
  size?: string
  cluster?: string
  policy?: string[]
  tags?: string[]
  lag?: string
  last?: string
  owner?: string
  steward?: string
  desc?: string
  cols?: { n: string; t: string; n2?: string; pk?: boolean; mask?: string }[]
}

type Schema = { name: string; objects: Obj[]; desc?: string }
type Db = { name: string; env: 'prod' | 'dev' | 'raw' | 'shared'; schemas: Schema[]; size: string; objects: number; desc?: string }

const TYPE_META: Record<ObjType, { icon: any; label: string; color: string }> = {
  table:         { icon: Table2,    label: 'TABLE',           color: 'text-blue-600 bg-blue-50' },
  view:          { icon: Eye,       label: 'VIEW',            color: 'text-violet-600 bg-violet-50' },
  mat_view:      { icon: Eye,       label: 'MAT VIEW',        color: 'text-violet-700 bg-violet-100' },
  dyn_table:     { icon: Workflow,  label: 'DYNAMIC TABLE',   color: 'text-amber-700 bg-amber-50' },
  stage:         { icon: Box,       label: 'STAGE',           color: 'text-zinc-700 bg-zinc-100' },
  stream:        { icon: Layers,    label: 'STREAM',          color: 'text-cyan-700 bg-cyan-50' },
  task:          { icon: Workflow,  label: 'TASK',            color: 'text-emerald-700 bg-emerald-50' },
  sequence:      { icon: FileCode,  label: 'SEQUENCE',        color: 'text-zinc-600 bg-zinc-100' },
  function:      { icon: FileCode,  label: 'FUNCTION',        color: 'text-rose-700 bg-rose-50' },
  procedure:     { icon: FileCode,  label: 'PROCEDURE',       color: 'text-rose-700 bg-rose-50' },
  semantic_view: { icon: Sparkles,  label: 'SEMANTIC VIEW',   color: 'text-purple-700 bg-purple-50' },
  cortex_search: { icon: Search,    label: 'CORTEX SEARCH',   color: 'text-indigo-700 bg-indigo-50' },
  cortex_agent:  { icon: Bot,       label: 'CORTEX AGENT',    color: 'text-pink-700 bg-pink-50' },
  pipe:          { icon: Workflow,  label: 'PIPE',            color: 'text-sky-700 bg-sky-50' },
}

const DBS: Db[] = [
  {
    name: 'CBL_RAW', env: 'raw', size: '5.4 TB', objects: 96, desc: 'Landing zone — exact source replicas, append-only, retained 90d',
    schemas: [
      { name: 'CRM', desc: 'Amdocs CRM CDC', objects: [
        { name: 'CUSTOMERS_RAW',    type: 'table', rows: '1,042,884', size: '92.4 GB', last: '2 min ago', owner: 'INGEST_SVC', tags: ['SOURCE:AMDOCS', 'PII'], policy: ['mask_email_v2', 'mask_phone_v2'], desc: 'Customer master replica from Amdocs', cols: [
          { n: 'CUSTOMER_ID', t: 'NUMBER(38,0)', pk: true },
          { n: 'EMAIL', t: 'VARCHAR(320)', mask: 'mask_email_v2' },
          { n: 'PHONE_E164', t: 'VARCHAR(20)', mask: 'mask_phone_v2' },
          { n: 'FIRST_NAME', t: 'VARCHAR(120)' },
          { n: 'LAST_NAME', t: 'VARCHAR(120)' },
          { n: 'IBAN_HASH', t: 'BINARY(32)' },
          { n: 'DOB', t: 'DATE', mask: 'mask_date_year' },
          { n: 'CRM_CREATED_AT', t: 'TIMESTAMP_TZ' },
          { n: '_INGESTED_AT', t: 'TIMESTAMP_TZ' },
          { n: '_OP', t: 'VARCHAR(1)' },
        ]},
        { name: 'ACCOUNTS_RAW',     type: 'table', rows: '1,121,402', size: '38.1 GB', last: '2 min ago', owner: 'INGEST_SVC', tags: ['SOURCE:AMDOCS'] },
        { name: 'INTERACTIONS_RAW', type: 'table', rows: '64,221,184', size: '412 GB', last: '2 min ago', cluster: '(INTERACTION_DATE)', owner: 'INGEST_SVC' },
        { name: 'TICKETS_RAW',      type: 'table', rows: '4,884,920', size: '38 GB', last: '2 min ago', owner: 'INGEST_SVC' },
      ]},
      { name: 'BILLING', desc: 'Cerillion BSS billing CDC', objects: [
        { name: 'INVOICES_RAW',      type: 'table', rows: '14,884,202', size: '184 GB', last: '4 min ago', cluster: '(BILL_PERIOD)', tags: ['SOURCE:BSS', 'FINANCIAL'] },
        { name: 'PAYMENTS_RAW',      type: 'table', rows: '12,212,884', size: '92 GB',  last: '4 min ago' },
        { name: 'SUBSCRIPTIONS_RAW', type: 'table', rows: '1,602,884',  size: '24 GB'  },
        { name: 'PLANS_RAW',         type: 'table', rows: '184',        size: '12 MB'  },
      ]},
      { name: 'NETWORK', desc: 'CMTS / DOCSIS / OSS telemetry', objects: [
        { name: 'CMTS_TELEMETRY',  type: 'table', rows: '4.2B',   size: '2.8 TB', cluster: '(EVENT_HOUR, REGION)', tags: ['SOURCE:KAFKA'] },
        { name: 'OSS_ALARMS',      type: 'table', rows: '184M',   size: '512 GB' },
        { name: 'CABLE_PROVISION', type: 'table', rows: '1.04M',  size: '14 GB'  },
      ]},
      { name: 'WEB', desc: 'Adobe Analytics + clickstream', objects: [
        { name: 'PAGEVIEWS_RAW', type: 'table', rows: '1.2B',  size: '180 GB' },
        { name: 'EVENTS_RAW',    type: 'table', rows: '684M',  size: '92 GB'  },
      ]},
      { name: 'HR', desc: 'Workday RaaS', objects: [
        { name: 'WORKERS_RAW', type: 'table', rows: '1,842',   size: '4 MB',  tags: ['PII'], policy: ['mask_salary'] },
        { name: 'PAY_RAW',     type: 'table', rows: '212,884', size: '18 MB', tags: ['PII'], policy: ['mask_salary'] },
      ]},
    ],
  },
  {
    name: 'CBL_CORE', env: 'prod', size: '1.6 TB', objects: 184, desc: 'Conformed business model — dbt-managed, Type-2 history, golden records',
    schemas: [
      { name: 'CONFORMED', desc: 'Stage layer outputs (dbt staging + intermediate)', objects: [
        { name: 'STG_CUSTOMERS',        type: 'view',      rows: '—', size: '—',       desc: 'dbt staging: deduped, casted, renamed' },
        { name: 'STG_INTERACTIONS',     type: 'view',      rows: '—', size: '—'        },
        { name: 'INT_CUSTOMER_BUNDLES', type: 'view',      rows: '—', size: '—'        },
        { name: 'DIM_CUSTOMER',         type: 'dyn_table', rows: '1,042,884', size: '14 GB', lag: '5 min', last: '12 min ago', cluster: '(CUSTOMER_KEY)', tags: ['CONFORMED', 'PII'], policy: ['mask_email_v2'], desc: 'SCD-2 customer dimension', cols: [
          { n: 'CUSTOMER_KEY', t: 'NUMBER(38,0)', pk: true },
          { n: 'CUSTOMER_ID',  t: 'NUMBER(38,0)'           },
          { n: 'FULL_NAME_HASH', t: 'BINARY(32)'           },
          { n: 'EMAIL_DOMAIN', t: 'VARCHAR(120)'           },
          { n: 'COUNTY',       t: 'VARCHAR(40)'            },
          { n: 'TENURE_MONTHS',t: 'NUMBER(6,1)'            },
          { n: 'LIFECYCLE_STAGE', t: 'VARCHAR(20)'         },
          { n: 'IS_CURRENT',   t: 'BOOLEAN'                },
          { n: 'VALID_FROM',   t: 'TIMESTAMP_TZ'           },
          { n: 'VALID_TO',     t: 'TIMESTAMP_TZ'           },
        ]},
        { name: 'DIM_PRODUCT',       type: 'dyn_table', rows: '14,212',    size: '92 MB',  lag: '15 min' },
        { name: 'FACT_INTERACTIONS', type: 'dyn_table', rows: '64,221,184',size: '412 GB', lag: '5 min', cluster: '(INTERACTION_DATE, CHANNEL)' },
        { name: 'FACT_BILLING',      type: 'dyn_table', rows: '14,884,202',size: '184 GB', lag: '15 min' },
        { name: 'FACT_NETWORK_KPI',  type: 'dyn_table', rows: '184M',      size: '92 GB',  lag: '5 min', cluster: '(EVENT_HOUR, NODE_ID)' },
      ]},
      { name: 'EVENTS', desc: 'Streams driving DT incremental refreshes', objects: [
        { name: 'CDC_CUSTOMERS_STREAM',    type: 'stream', last: '2 min ago'  },
        { name: 'CDC_INTERACTIONS_STREAM', type: 'stream', last: '40 sec ago' },
        { name: 'CDC_BILLING_STREAM',      type: 'stream', last: '2 min ago'  },
      ]},
      { name: 'TASKS', desc: 'Snowflake Tasks for orchestration', objects: [
        { name: 'TASK_BUILD_CUSTOMER_360',  type: 'task', last: '04:08 UTC · success' },
        { name: 'TASK_REFRESH_PRODUCT_360', type: 'task', last: '03:12 UTC · success' },
        { name: 'TASK_DAILY_PEOPLE_REFRESH',type: 'task', last: '05:02 UTC · success' },
      ]},
    ],
  },
  {
    name: 'CBL_ANALYTICS', env: 'prod', size: '0.4 TB', objects: 92, desc: '360s, marts, semantic views — scenario serving layer',
    schemas: [
      { name: 'CUSTOMER', desc: 'Customer 360 marts', objects: [
        { name: 'CUSTOMER_360', type: 'table', rows: '1,042,884', size: '6.2 GB', last: '03:00 UTC', cluster: '(CUSTOMER_ID)', steward: 'C. Rohan', tags: ['MART', 'TIER1'], policy: ['mask_email_v2', 'mask_phone_v2'], desc: 'One row per customer · 142 columns · gold tier', cols: [
          { n: 'CUSTOMER_ID',          t: 'NUMBER(38,0)',  pk: true },
          { n: 'TENURE_MONTHS',        t: 'NUMBER(6,1)'   },
          { n: 'BUNDLE_TYPE',          t: 'VARCHAR(20)'   },
          { n: 'ARPU_BLENDED',         t: 'NUMBER(8,2)'   },
          { n: 'CHURN_RISK_30D',       t: 'NUMBER(5,4)'   },
          { n: 'CHURN_RISK_DRIVER',    t: 'VARCHAR(40)'   },
          { n: 'CLV_36M',              t: 'NUMBER(10,2)'  },
          { n: 'NPS_LATEST',           t: 'NUMBER(3,0)'   },
          { n: 'BUNDLE_PROPENSITY_TV', t: 'NUMBER(5,4)'   },
          { n: 'BUNDLE_PROPENSITY_MOBILE', t: 'NUMBER(5,4)' },
          { n: 'LAST_INTERACTION_AT',  t: 'TIMESTAMP_TZ'  },
          { n: 'PRIMARY_CHANNEL',      t: 'VARCHAR(20)'   },
          { n: 'IS_HIGH_VALUE',        t: 'BOOLEAN'       },
          { n: 'COUNTY',               t: 'VARCHAR(40)'   },
        ]},
        { name: 'CUSTOMER_INTERACTIONS_FACT', type: 'view',  rows: '—',         size: '—'      },
        { name: 'CHURN_LIST_DAILY',           type: 'table', rows: '14,212',     size: '12 MB', last: '03:30 UTC' },
        { name: 'CLV_SEGMENT_FACT',           type: 'table', rows: '1,042,884',  size: '64 MB' },
      ]},
      { name: 'PRODUCT', desc: 'Product 360 + bundle profitability', objects: [
        { name: 'PRODUCT_360',          type: 'table', rows: '14,212', size: '92 MB', last: '03:00 UTC', steward: 'A. Declercq', tags: ['MART', 'TIER1'] },
        { name: 'BUNDLE_PROFITABILITY', type: 'view',  rows: '—',      size: '—'      },
        { name: 'PRICING_ELASTICITY',   type: 'table', rows: '24,000', size: '8 MB'   },
      ]},
      { name: 'B2B', objects: [
        { name: 'B2B_360',           type: 'table', rows: '3,884',  size: '8 MB', steward: 'L. Claeys', tags: ['MART'] },
        { name: 'B2B_PIPELINE_FACT', type: 'table', rows: '12,884', size: '4 MB' },
      ]},
      { name: 'PEOPLE', objects: [
        { name: 'PEOPLE_360',       type: 'table', rows: '1,840', size: '14 MB',  steward: 'D. Adderley', tags: ['MART', 'PII'], policy: ['mask_salary', 'rls_people_function'] },
        { name: 'FLIGHT_RISK_DAILY',type: 'table', rows: '1,840', size: '420 KB' },
      ]},
      { name: 'EXEC', objects: [
        { name: 'EXEC_360',          type: 'table', rows: '184', size: '8 MB',  steward: 'P. Jose', tags: ['MART', 'TIER1'] },
        { name: 'CEO_BRIEFING_DAILY',type: 'table', rows: '7',   size: '12 KB' },
      ]},
      { name: 'RISK_ESG', objects: [
        { name: 'RISK_360',    type: 'table', rows: '4,212',   size: '12 MB', steward: 'B. De Witte', tags: ['MART'] },
        { name: 'REG_ESG_360', type: 'table', rows: '888',     size: '6 MB'  },
        { name: 'CARBON_LEDGER',type:'table', rows: '124,884', size: '14 MB' },
      ]},
      { name: 'SEMANTIC', desc: 'Semantic views — Cortex Analyst', objects: [
        { name: 'CUSTOMER_360_SV', type: 'semantic_view', desc: '24 metrics · 38 dimensions · 86 verified queries', steward: 'C. Rohan', tags: ['CORTEX_ANALYST'] },
        { name: 'PRODUCT_360_SV',  type: 'semantic_view', desc: '18 metrics · 22 dimensions · 42 verified queries', steward: 'A. Declercq' },
        { name: 'B2B_360_SV',      type: 'semantic_view' },
        { name: 'PEOPLE_360_SV',   type: 'semantic_view' },
        { name: 'EXEC_360_SV',     type: 'semantic_view' },
        { name: 'RISK_360_SV',     type: 'semantic_view' },
        { name: 'PROCURE_360_SV',  type: 'semantic_view' },
      ]},
    ],
  },
  {
    name: 'CBL_AI', env: 'prod', size: '32 GB', objects: 28, desc: 'Cortex Search services + Cortex Agents + ML feature store',
    schemas: [
      { name: 'SEARCH', desc: 'Cortex Search services', objects: [
        { name: 'KB_POLICIES_DOCS',     type: 'cortex_search', desc: 'Snowflake docs + internal SOPs · 4,884 chunks', tags: ['CORTEX_SEARCH'] },
        { name: 'KB_NETWORK_RUNBOOKS',  type: 'cortex_search', desc: '1,212 runbooks · weekly refresh' },
        { name: 'KB_LEGAL_CONTRACTS',   type: 'cortex_search', desc: 'Doc AI parsed · 884 contracts' },
        { name: 'KB_CUSTOMER_KB',       type: 'cortex_search', desc: 'Customer service KB · 12,884 articles' },
        { name: 'KB_PRODUCT_CATALOG',   type: 'cortex_search', desc: 'Product specs · 3,212 SKUs' },
        { name: 'KB_REGULATORY_FILINGS',type: 'cortex_search', desc: 'URCA regulatory filings · 884 docs' },
      ]},
      { name: 'AGENTS', desc: 'Cortex Agents (Snowflake Intelligence tiles)', objects: [
        { name: 'CEO_BRIEFING_AGENT',  type: 'cortex_agent', steward: 'P. Jose',     desc: '2 tools (Analyst on EXEC_360_SV + Search on regulatory) · Claude 3.5 Sonnet' },
        { name: 'CHURN_AGENT',         type: 'cortex_agent', steward: 'C. Rohan',    desc: 'Customer 360 SV + KB customer · Llama-3.1-70b' },
        { name: 'PRICING_AGENT',       type: 'cortex_agent', steward: 'A. Declercq', desc: 'Product 360 SV + competitor doc parse · Mistral-large' },
        { name: 'B2B_DEAL_AGENT',      type: 'cortex_agent', steward: 'L. Claeys', desc: 'B2B 360 SV + KB legal' },
        { name: 'PEOPLE_AGENT',        type: 'cortex_agent', steward: 'D. Adderley',   desc: 'People 360 SV + RLS · Snowflake Arctic' },
        { name: 'NETWORK_OPS_AGENT',   type: 'cortex_agent', steward: 'M. Willems', desc: 'Network KPI SV + KB runbook · Llama 3.1' },
        { name: 'COMPLIANCE_AGENT',    type: 'cortex_agent', steward: 'B. De Witte',  desc: 'Risk SV + KB regulatory' },
        { name: 'PROCUREMENT_AGENT',   type: 'cortex_agent', steward: 'F. Tobin',    desc: 'Procure 360 SV' },
        { name: 'WAR_ROOM_TRIAGE',     type: 'cortex_agent', steward: 'P. Jose',     desc: 'Cross-domain · 5 tools' },
      ]},
      { name: 'ML_FEATURES', desc: 'Snowpark ML feature store', objects: [
        { name: 'FS_CUSTOMER_FEATURES',     type: 'table', rows: '1,042,884', size: '12 GB', cluster: '(CUSTOMER_ID)' },
        { name: 'FS_NETWORK_NODE_FEATURES', type: 'table', rows: '184,884',   size: '4 GB'  },
        { name: 'FS_EMPLOYEE_FEATURES',     type: 'table', rows: '1,840',     size: '12 MB' },
      ]},
    ],
  },
  {
    name: 'CBL_GOV', env: 'prod', size: '8 GB', objects: 42, desc: 'Horizon governance · masking · row-access policies · audit',
    schemas: [
      { name: 'POLICIES', objects: [
        { name: 'MASK_EMAIL_V2',       type: 'function', desc: 'Conditional masking by ROLE · 14 tables' },
        { name: 'MASK_PHONE_V2',       type: 'function' },
        { name: 'MASK_SALARY',         type: 'function' },
        { name: 'MASK_DATE_YEAR',      type: 'function' },
        { name: 'RLS_PEOPLE_FUNCTION', type: 'function', desc: 'Restricts PEOPLE_360 to MGR_OF or HR_BP' },
        { name: 'RLS_B2B_TERRITORY',   type: 'function' },
      ]},
      { name: 'AUDIT', objects: [
        { name: 'ACCESS_HISTORY_V',      type: 'view',  desc: 'Wraps SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY · 90d' },
        { name: 'POLICY_VIOLATIONS',     type: 'table', rows: '12',  size: '8 KB',  last: '06:00 UTC' },
        { name: 'CLASSIFICATION_LATEST', type: 'view' },
      ]},
    ],
  },
  {
    name: 'CBL_SHARES', env: 'shared', size: '— (inbound)', objects: 8, desc: 'Inbound Marketplace + private shares',
    schemas: [
      { name: 'INBOUND', objects: [
        { name: 'WEATHER_DAILY',       type: 'view', desc: 'Snowflake Marketplace · Tomorrow.io · daily' },
        { name: 'BAHAMAS_NSI_POPULATION_2022', type: 'view', desc: 'Inbound · Bahamas NSI' },
        { name: 'BSDOSTAT_TELCO',      type: 'view', desc: 'Marketplace · Knoema' },
        { name: 'COMPETITOR_PRICING',  type: 'view', desc: 'Private share from BrandAlytics' },
      ]},
    ],
  },
]

const ENV_COLOR: Record<string, string> = {
  prod:   'bg-emerald-100 text-emerald-700',
  dev:    'bg-amber-100 text-amber-700',
  raw:    'bg-zinc-200 text-zinc-700',
  shared: 'bg-violet-100 text-violet-700',
}

const OBJECT_TYPE_DIST = [
  { type: 'TABLE',          count: 84,  color: BLUE   },
  { type: 'DYNAMIC TABLE',  count: 18,  color: AMBER  },
  { type: 'VIEW',           count: 48,  color: PURPLE },
  { type: 'CORTEX AGENT',   count: 9,   color: '#f43f5e' },
  { type: 'CORTEX SEARCH',  count: 6,   color: NAVY   },
  { type: 'SEMANTIC VIEW',  count: 7,   color: '#8b5cf6' },
  { type: 'FUNCTION',       count: 12,  color: GREEN  },
  { type: 'STREAM',         count: 8,   color: SLATE  },
  { type: 'TASK',           count: 6,   color: '#06b6d4' },
]

const FRESHNESS_DATA = [
  { db: 'CBL_RAW',       fresh: 100, stale: 0  },
  { db: 'CBL_CORE',      fresh: 98,  stale: 2  },
  { db: 'CBL_ANALYTICS', fresh: 96,  stale: 4  },
  { db: 'CBL_AI',        fresh: 92,  stale: 8  },
  { db: 'CBL_GOV',       fresh: 88,  stale: 12 },
  { db: 'CBL_SHARES',    fresh: 84,  stale: 16 },
]

const SENSITIVITY_DIST = [
  { cat: 'PII',       count: 24, color: '#ef4444' },
  { cat: 'Financial', count: 18, color: AMBER     },
  { cat: 'Internal',  count: 68, color: NAVY      },
  { cat: 'Public',    count: 40, color: GREEN     },
]

const TAG_POPULAR = [
  { tag: 'TIER1',        objects: 6,  color: AMBER  },
  { tag: 'MART',         objects: 12, color: BLUE   },
  { tag: 'PII',          objects: 8,  color: '#ef4444' },
  { tag: 'CORTEX_ANALYST', objects: 7, color: PURPLE },
  { tag: 'FINANCIAL',    objects: 4,  color: GREEN  },
  { tag: 'CONFORMED',    objects: 9,  color: NAVY   },
  { tag: 'CORTEX_SEARCH',objects: 6,  color: '#8b5cf6' },
  { tag: 'SOURCE:AMDOCS',objects: 4,  color: SLATE  },
]

const POLICY_SUMMARY = [
  { policy: 'mask_email_v2',         type: 'Masking',    tables: 14, status: 'active' },
  { policy: 'mask_phone_v2',         type: 'Masking',    tables: 8,  status: 'active' },
  { policy: 'mask_salary',           type: 'Masking',    tables: 2,  status: 'active' },
  { policy: 'mask_date_year',        type: 'Masking',    tables: 4,  status: 'active' },
  { policy: 'rls_people_function',   type: 'Row Access', tables: 1,  status: 'active' },
  { policy: 'rls_b2b_territory',     type: 'Row Access', tables: 1,  status: 'active' },
]

const USAGE_TREND = [
  { m: 'Jun', queries: 12400, unique_users: 38 },
  { m: 'Jul', queries: 13800, unique_users: 42 },
  { m: 'Aug', queries: 14200, unique_users: 44 },
  { m: 'Sep', queries: 15600, unique_users: 46 },
  { m: 'Oct', queries: 17200, unique_users: 48 },
  { m: 'Nov', queries: 18400, unique_users: 52 },
]

type TabId = 'overview' | 'browser' | 'search' | 'ownership' | 'governance' | 'tags' | 'popularity' | 'quality'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview',    label: 'Overview',       icon: Activity    },
  { id: 'browser',     label: 'Schema Browser', icon: Database    },
  { id: 'search',      label: 'Search',          icon: Search      },
  { id: 'ownership',   label: 'Ownership',       icon: Users       },
  { id: 'governance',  label: 'Governance',      icon: ShieldCheck },
  { id: 'tags',        label: 'Tags & Classes',  icon: Tag         },
  { id: 'popularity',  label: 'Popularity',      icon: Star        },
  { id: 'quality',     label: 'Quality',         icon: CheckCircle },
]

export default function DataCatalogPage() {
  const [tab, setTab]           = useState<TabId>('overview')
  const [dbIdx, setDbIdx]       = useState(2)
  const [schemaIdx, setSchemaIdx] = useState(0)
  const [obj, setObj]           = useState<Obj | null>(null)
  const [q, setQ]               = useState('')
  const [typeFilter, setTypeFilter] = useState<ObjType | 'all'>('all')
  const [sensitivityFilter, setSensitivityFilter] = useState<string>('All')
  const [liveTime, setLiveTime] = useState('')
  const [searchQ, setSearchQ]   = useState('')
  const [tagFilter, setTagFilter] = useState<string>('All')

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BS', { hour: '2-digit', minute: '2-digit' })
    setLiveTime(fmt())
    const id = setInterval(() => setLiveTime(fmt()), 60_000)
    return () => clearInterval(id)
  }, [])

  const db     = DBS[dbIdx]
  const schema = db.schemas[schemaIdx] || db.schemas[0]

  const objects = useMemo(
    () => (schema?.objects || []).filter((o) =>
      (typeFilter === 'all' || o.type === typeFilter) &&
      (q === '' || o.name.toLowerCase().includes(q.toLowerCase()))
    ),
    [schema, typeFilter, q],
  )

  const allObjects = useMemo(
    () => DBS.flatMap(d => d.schemas.flatMap(s => s.objects.map(o => ({ ...o, db: d.name, schema: s.name })))),
    [],
  )

  const searchResults = useMemo(
    () => searchQ.length < 2 ? [] : allObjects.filter(o => o.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 20),
    [searchQ, allObjects],
  )

  const sensitiveObjects = useMemo(
    () => allObjects.filter(o => o.tags?.some(t => t === 'PII' || t === 'FINANCIAL') || (o.policy && o.policy.length > 0)),
    [],
  )

  const totalObjects = DBS.reduce((s, d) => s + d.objects, 0)

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={tt('Data Catalog')}
        subtitle={`${DBS.length} ${tt('databases')} · ${totalObjects} ${tt('objects')} · ${tt('governed by Horizon · last classification 04:00 UTC')}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tt('Live · ')}{liveTime}
            </span>
            <Link to="/portal/horizon" className="bg-vfes-red text-vfes-dark text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {tt('Horizon')}
            </Link>
          </div>
        }
      />

      {/* ── ML Intelligence ─────────────────────────────────────────────────── */}
      <MlInsightSection
        heading="Catalog intelligence"
        models={[
          { name: 'Sensitivity Classifier', metric: '98.4% acc', sub: 'PII/financial auto-tag'       },
          { name: 'Schema Drift Detector',  metric: 'F1 0.91',   sub: 'breaking-change early warning' },
          { name: 'Usage Ranker',            metric: 'NDCG 0.88', sub: 'object popularity scoring'    },
        ]}
        agentLabel="Run Catalog Analyst"
        agentRunningLabel="Scanning…"
        agentSteps={[
          'Scanning 1,121 tables/views for untagged sensitive columns via SYSTEM$CLASSIFY',
          'Identifying objects with no steward assignment (OBJECT_CONTACTS gap)',
          'Ranking top 20 tables by query volume and freshness risk',
          'Drafting governance action list for CDO review',
        ]}
        agentBlurb="Snowflake Horizon classification runs SYSTEM$CLASSIFY daily — every PII and financial column is automatically tagged, masking policies attached, and ownership tracked via OBJECT_CONTACTS."
        decision={{
          title: 'Assign stewards to 42 untagged TIER1 objects — governance gap',
          detail: 'Horizon classification found 42 high-query objects with no OBJECT_CONTACTS steward assigned. These include 12 tables with FINANCIAL tags and 8 with PII. Steward assignment is the prerequisite for data contracts and product certification.',
          impact: 'closes stewardship gap · unblocks 8 data product certifications',
          risk: 'CDO office sign-off needed for PII tables',
          linkTo: '#/portal/catalog',
          linkLabel: 'Open Data Catalog',
        }}
        chart={{
          kind: 'bar',
          title: 'Object type distribution — catalog inventory',
          xKey: 'type',
          data: OBJECT_TYPE_DIST,
          series: [{ key: 'count', name: 'Objects', color: BLUE }],
          note: '84 tables are the largest object class. 9 Cortex Agents and 7 Semantic Views form the AI serving layer.',
        }}
      />

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
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

      {/* ══════════════ OVERVIEW ══════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard label={tt('Total objects')}      value={String(totalObjects)}  delta="+18 MoM"              trend="up"   icon={Database}    accent />
          <KpiCard label={tt('Databases')}           value={String(DBS.length)}    delta={tt('prod + raw + shared')} trend="flat" icon={Layers} />
          <KpiCard label={tt('Governed objects')}    value="94%"                   delta="+2 pp MoM"            trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('PII tagged')}           value="32"                    delta={tt('auto-classified')} trend="up"   icon={Tag}         />
          <KpiCard label={tt('Masking policies')}    value="6"                     delta={tt('14 tables covered')} trend="flat" icon={ShieldCheck} />
          <KpiCard label={tt('Unassigned stewards')} value="42"                    delta={tt('action needed')}   trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Object type distribution')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={OBJECT_TYPE_DIST}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="type" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="count" name={tt('Count')} radius={[4, 4, 0, 0]}>
                    {OBJECT_TYPE_DIST.map((o, i) => <Cell key={i} fill={o.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Object freshness by database (%)')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={FRESHNESS_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="db" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fresh" name={tt('Fresh')}  stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="stale" name={tt('Stale')}  stackId="a" fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Sensitivity classification')}>
            <div className="h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SENSITIVITY_DIST} dataKey="count" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {SENSITIVITY_DIST.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <Panel title={tt('Quick links')}>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/portal/lineage" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('Lineage')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
                <Link to="/portal/data-quality" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('Data Quality')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
                <Link to="/portal/semantic-views" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('Semantic Views')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
                <Link to="/portal/data-products" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('Data Products')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
                <Link to="/portal/agents" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('Cortex Agents')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
                <Link to="/portal/rbac" className="flex items-center justify-between p-2.5 rounded-lg border border-black/5 hover:bg-[#fafbfc]">
                  <span className="text-sm font-semibold">{tt('RBAC')}</span>
                  <span className="text-[10px] font-bold text-vfes-dark">{tt('Open →')}</span>
                </Link>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={tt('Usage trend — catalog queries & unique users (6 months)')}>
          <div className="h-48">
            <ResponsiveContainer>
              <ComposedChart data={USAGE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar  yAxisId="l" dataKey="queries"      name={tt('Queries')}       fill={BLUE}  radius={[4, 4, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="unique_users" name={tt('Unique users')} stroke={AMBER} strokeWidth={2.4} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ SCHEMA BROWSER ════════════════════════════════════════ */}
      {tab === 'browser' && (<>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vfes-dark/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('Filter objects…')} className="bg-white border border-black/10 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="bg-white border border-black/10 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">{tt('All types')}</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{tt(v.label)}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-black/5 overflow-hidden grid grid-cols-12 min-h-[640px]">
          <div className="col-span-3 border-r border-black/5 bg-[#fafbfc]">
            <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">{tt('Databases')}</div>
              <span className="text-[10px] font-mono text-vfes-dark/50">{DBS.length}</span>
            </div>
            <div className="p-2 space-y-0.5 overflow-y-auto max-h-[600px]">
              {DBS.map((d, i) => (
                <button key={d.name} onClick={() => { setDbIdx(i); setSchemaIdx(0); setObj(null) }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-start gap-2 transition ${i === dbIdx ? 'bg-vfes-red/10 ring-1 ring-vfes-red/30' : 'hover:bg-black/5'}`}>
                  <Database className={`w-4 h-4 mt-0.5 ${i === dbIdx ? 'text-vfes-dark' : 'text-vfes-dark/50'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[12px] font-bold truncate">{tt(d.name)}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded ${ENV_COLOR[d.env]}`}>{d.env}</span>
                      <span className="text-[10px] text-vfes-dark/55 font-mono">{d.size} · {d.objects} obj</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-3 border-r border-black/5">
            <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">{tt('Schemas')}</div>
                <div className="text-[10px] font-mono text-vfes-dark/50">{tt(db.name)}</div>
              </div>
              <span className="text-[10px] font-mono text-vfes-dark/50">{db.schemas.length}</span>
            </div>
            <div className="p-2 space-y-0.5 overflow-y-auto max-h-[600px]">
              {db.schemas.map((s, i) => (
                <button key={s.name} onClick={() => { setSchemaIdx(i); setObj(null) }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition ${i === schemaIdx ? 'bg-vfes-red/10 ring-1 ring-vfes-red/30' : 'hover:bg-black/5'}`}>
                  <ChevronRight className={`w-3.5 h-3.5 ${i === schemaIdx ? 'text-vfes-dark rotate-90' : 'text-vfes-dark/40'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[12px] font-bold truncate">{tt(s.name)}</div>
                    {s.desc && <div className="text-[10px] text-vfes-dark/55 truncate">{tt(s.desc)}</div>}
                  </div>
                  <span className="text-[10px] font-mono text-vfes-dark/50">{s.objects.length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-6">
            <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60">{tt('Objects')}</div>
                <div className="text-[10px] font-mono text-vfes-dark/50">{tt(db.name)}.{tt(schema.name)}</div>
              </div>
              <span className="text-[10px] font-mono text-vfes-dark/50">{objects.length}</span>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 bg-[#fafbfc] sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">{tt('Name')}</th>
                    <th>{tt('Type')}</th>
                    <th>{tt('Rows')}</th>
                    <th>{tt('Size')}</th>
                    <th>{tt('Last refresh')}</th>
                  </tr>
                </thead>
                <tbody>
                  {objects.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-vfes-dark/45 text-sm">{tt('No objects match.')}</td></tr>
                  )}
                  {objects.map((o) => {
                    const t = TYPE_META[o.type]
                    return (
                      <tr key={o.name} onClick={() => setObj(o)} className="border-t border-black/5 hover:bg-vfes-red/5 cursor-pointer">
                        <td className="px-4 py-2 font-mono text-[12px] font-semibold text-vfes-dark">{tt(o.name)}</td>
                        <td><span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${t.color}`}>{tt(t.label)}</span></td>
                        <td className="font-mono text-[11px] text-vfes-dark/70">{o.rows ?? '—'}</td>
                        <td className="font-mono text-[11px] text-vfes-dark/70">{o.size ?? '—'}</td>
                        <td className="font-mono text-[11px] text-vfes-dark/70">{o.last ?? o.lag ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile catalog */}
        <div className="mt-6">
          <Panel title={tt('Mobile / RAN catalog')} action={
            <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />{tt('8 mobile-domain objects')}
            </span>}>
            <table className="w-full text-[12px]">
              <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
                <tr>
                  <th className="py-1.5">{tt('Object')}</th>
                  <th>{tt('Domain')}</th>
                  <th>{tt('Sensitivity')}</th>
                  <th>{tt('Rows')}</th>
                  <th>{tt('Certified')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {MOBILE_CATALOG.map((c) => (
                  <tr key={c.name} className="border-t border-black/5">
                    <td className="py-2 font-mono text-xs font-semibold">
                      {c.name}
                      <div className="text-[10px] text-vfes-dark/55 mt-0.5">{tt(c.description)}</div>
                    </td>
                    <td className="text-[11px] text-vfes-dark/65">{tt(c.domain)}</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.sensitivity === 'Critical' ? 'bg-red-50 text-red-700' : c.sensitivity === 'High' ? 'bg-amber-50 text-amber-700' : c.sensitivity === 'Medium' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {tt(c.sensitivity)}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{c.rows}</td>
                    <td>
                      {c.certified
                        ? <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tt('certified')}</span>
                        : <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{tt('pilot')}</span>}
                    </td>
                    <td className="text-[11px]">{tt(c.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-vfes-dark/65 mt-3">
              {tt('SIM_SWAP_REQUESTS is the only Critical-sensitivity mobile asset (180K/day, eKYC-protected). MOBILE_LOCATION_EVENTS pending certification once DPA retention DMF is automated.')}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ SEARCH ════════════════════════════════════════════════ */}
      {tab === 'search' && (<>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vfes-dark/40" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder={tt('Search all 1,121 objects by name, type, tag…')}
            className="bg-white border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full max-w-xl" />
        </div>

        {searchResults.length > 0 && (
          <Panel title={`${tt('Search results')} — ${searchResults.length} ${tt('matches')}`}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Object')}</th>
                  <th className="text-left">{tt('Database')}</th>
                  <th className="text-left">{tt('Schema')}</th>
                  <th className="text-left">{tt('Type')}</th>
                  <th className="text-left">{tt('Description')}</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((o, i) => {
                  const t = TYPE_META[o.type]
                  return (
                    <tr key={i} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="py-1.5 font-mono font-semibold text-xs">{o.name}</td>
                      <td className="font-mono text-[10px]">{(o as any).db}</td>
                      <td className="font-mono text-[10px]">{(o as any).schema}</td>
                      <td><span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${t.color}`}>{tt(t.label)}</span></td>
                      <td className="text-[11px] text-vfes-dark/65 truncate max-w-xs">{o.desc ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>
        )}

        {searchQ.length < 2 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title={tt('Popular searches')}>
              <div className="space-y-2">
                {['CUSTOMER_360', 'CHURN_LIST_DAILY', 'DIM_CUSTOMER', 'CMTS_TELEMETRY', 'EXEC_360_SV', 'KB_POLICIES_DOCS', 'MASK_EMAIL_V2', 'FACT_BILLING'].map(name => (
                  <button key={name} onClick={() => setSearchQ(name)}
                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#fafbfc] text-sm font-mono font-semibold text-vfes-dark/80">
                    <Search className="w-3 h-3 text-vfes-dark/40" /> {name}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title={tt('Recently viewed objects')}>
              <div className="space-y-2">
                {[
                  { name: 'CUSTOMER_360', db: 'CBL_ANALYTICS', type: 'table' as ObjType, last: '5 min ago' },
                  { name: 'CHURN_AGENT',  db: 'CBL_AI',        type: 'cortex_agent' as ObjType, last: '18 min ago' },
                  { name: 'CUSTOMERS_RAW', db: 'CBL_RAW',      type: 'table' as ObjType, last: '32 min ago' },
                  { name: 'CUSTOMER_360_SV', db: 'CBL_ANALYTICS', type: 'semantic_view' as ObjType, last: '1h ago' },
                ].map(r => (
                  <div key={r.name} className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-[#fafbfc]">
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${TYPE_META[r.type].color}`}>{TYPE_META[r.type].label}</span>
                    <span className="font-mono text-sm font-semibold flex-1">{r.name}</span>
                    <span className="font-mono text-[10px] text-vfes-dark/50">{r.db}</span>
                    <span className="text-[10px] text-vfes-dark/40">{r.last}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </>)}

      {/* ══════════════ OWNERSHIP ═════════════════════════════════════════════ */}
      {tab === 'ownership' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Objects with steward')} value="79%"  delta={tt('of all objects')}       trend="up"   icon={Users}      accent />
          <KpiCard label={tt('Stewards assigned')}    value="12"   delta={tt('across 8 domains')}     trend="up"   icon={CheckCircle} />
          <KpiCard label={tt('OBJECT_CONTACTS set')}  value="184"  delta={tt('TIER1 + PII covered')}  trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Unassigned (TIER1)')}   value="12"   delta={tt('action required')}      trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Steward register — data stewards by domain')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Steward')}</th>
                <th className="text-left">{tt('Domain')}</th>
                <th className="text-left">{tt('Key objects')}</th>
                <th className="text-right">{tt('Objects owned')}</th>
                <th className="text-left">{tt('Certified products')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Emma Rolle",   domain: 'Customer',    objects: 'CUSTOMER_360, CHURN_LIST_DAILY',    count: 18, products: 2 },
                { name: 'Niels Bodart',      domain: 'Product',     objects: 'PRODUCT_360, PRICING_ELASTICITY',   count: 8,  products: 1 },
                { name: 'L. Claeys',      domain: 'B2B',         objects: 'B2B_360, B2B_PIPELINE_FACT',        count: 6,  products: 1 },
                { name: 'D. Vermeulen',     domain: 'People',      objects: 'PEOPLE_360, FLIGHT_RISK_DAILY',     count: 4,  products: 1 },
                { name: 'B. De Witte',       domain: 'Risk',        objects: 'RISK_360, REG_ESG_360',             count: 6,  products: 0 },
                { name: 'P. Jose',          domain: 'Executive',   objects: 'EXEC_360, CEO_BRIEFING_DAILY',      count: 4,  products: 1 },
                { name: 'Thomas Knowles',  domain: 'Finance',     objects: 'FINANCE_LEDGER, AUDIT tables',      count: 8,  products: 1 },
                { name: 'Network ops',      domain: 'Network',     objects: 'FACT_NETWORK_KPI, CMTS_TELEMETRY',  count: 12, products: 1 },
              ].map(s => (
                <tr key={s.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-semibold text-xs">{s.name}</td>
                  <td className="text-[11px]">{tt(s.domain)}</td>
                  <td className="font-mono text-[10px] text-vfes-dark/65">{s.objects}</td>
                  <td className="text-right font-mono">{s.count}</td>
                  <td className="text-right font-mono">
                    {s.products > 0
                      ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{s.products}</span>
                      : <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{tt('pending')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon Catalog →')}</Link>
            <Link to="/portal/cdo" className="text-xs font-bold text-vfes-dark hover:underline">{tt('CDO Dashboard →')}</Link>
          </div>
        </Panel>
      </>)}

      {/* ══════════════ GOVERNANCE ════════════════════════════════════════════ */}
      {tab === 'governance' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Masking policies')}   value="6"    delta={tt('active')}           trend="flat" icon={ShieldCheck} accent />
          <KpiCard label={tt('Row-access policies')} value="2"   delta={tt('HR + B2B')}          trend="flat" icon={Layers}     />
          <KpiCard label={tt('Tables covered')}      value="20"  delta={tt('masking + RLS')}     trend="up"   icon={Database}   />
          <KpiCard label={tt('Policy violations')}   value="12"  delta={tt('YTD · audited')}     trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Policy register — masking and row-access policies')}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                <th className="text-left py-2">{tt('Policy')}</th>
                <th className="text-left">{tt('Type')}</th>
                <th className="text-right">{tt('Tables')}</th>
                <th className="text-left">{tt('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {POLICY_SUMMARY.map(p => (
                <tr key={p.policy} className="border-b border-black/5 hover:bg-[#fafbfc]">
                  <td className="py-1.5 font-mono text-xs font-semibold">{p.policy}</td>
                  <td><span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.type === 'Masking' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'}`}>{tt(p.type)}</span></td>
                  <td className="text-right font-mono">{p.tables}</td>
                  <td><span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tt(p.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/portal/horizon" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Horizon →')}</Link>
            <Link to="/portal/rbac" className="text-xs font-bold text-vfes-dark hover:underline">{tt('RBAC →')}</Link>
            <Link to="/portal/observability" className="text-xs font-bold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Sensitive objects — PII and Financial')}>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-vfes-dark/50 border-b border-black/5">
                  <th className="text-left py-2">{tt('Object')}</th>
                  <th className="text-left">{tt('Tags')}</th>
                  <th className="text-left">{tt('Policies')}</th>
                </tr>
              </thead>
              <tbody>
                {sensitiveObjects.slice(0, 8).map(o => (
                  <tr key={o.name} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="py-1.5 font-mono text-xs font-semibold">{o.name}</td>
                    <td className="flex gap-1 flex-wrap py-1">
                      {(o.tags ?? []).map(t => (
                        <span key={t} className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded font-mono">{t}</span>
                      ))}
                    </td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{(o.policy ?? []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={tt('Sensitivity distribution')}>
            <div className="h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SENSITIVITY_DIST} dataKey="count" innerRadius={35} outerRadius={68} paddingAngle={2}
                    label={({ cat, count }: { cat: string; count: number }) => `${cat} (${count})`} labelLine={false}>
                    {SENSITIVITY_DIST.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ TAGS & CLASSES ════════════════════════════════════════ */}
      {tab === 'tags' && (<>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-vfes-dark/55">{tt('Filter:')}</span>
          {['All', 'TIER1', 'MART', 'PII', 'CORTEX_ANALYST'].map(t => (
            <button key={t} onClick={() => setTagFilter(t)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${tagFilter === t ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Unique tags')}       value="18"   delta={tt('system + custom')} trend="flat" icon={Tag}        accent />
          <KpiCard label={tt('Auto-classified')}   value="40"   delta={tt('SYSTEM$CLASSIFY')} trend="up"   icon={Sparkles}   />
          <KpiCard label={tt('Custom tags')}       value="12"   delta={tt('user-defined')}    trend="up"   icon={Star}       />
          <KpiCard label={tt('Untagged TIER1')}    value="4"    delta={tt('action needed')}   trend="down" icon={AlertTriangle} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Tag popularity — objects per tag')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={TAG_POPULAR} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="tag" tick={{ fontSize: 9 }} width={110} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="objects" name={tt('Objects')} radius={[0, 4, 4, 0]}>
                    {TAG_POPULAR.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('SYSTEM$CLASSIFY results — latest run')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={[
                  { m: 'Jun', auto: 28, manual: 12, gap: 20 },
                  { m: 'Jul', auto: 30, manual: 13, gap: 18 },
                  { m: 'Aug', auto: 32, manual: 14, gap: 16 },
                  { m: 'Sep', auto: 34, manual: 14, gap: 14 },
                  { m: 'Oct', auto: 36, manual: 15, gap: 12 },
                  { m: 'Nov', auto: 40, manual: 16, gap: 8  },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="auto"   name={tt('Auto-tagged')}   stroke={GREEN} fill={GREEN} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="manual" name={tt('Manually tagged')} stroke={BLUE}  fill={BLUE}  fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ POPULARITY ════════════════════════════════════════════ */}
      {tab === 'popularity' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Most queried')}      value="CUSTOMER_360" delta={tt('482 queries 7d')}   trend="up"   icon={Star}      accent />
          <KpiCard label={tt('Unique users 7d')}   value="52"           delta="+4 WoW"                  trend="up"   icon={Users}     />
          <KpiCard label={tt('Total queries 7d')} value="18,400"         delta="+12% WoW"                trend="up"   icon={Activity}  />
          <KpiCard label={tt('Zero-query objects')} value="42"           delta={tt('dormant')}          trend="down" icon={Clock}     />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Top 8 objects by query volume — 7d')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'CUSTOMER_360',    queries: 482 },
                  { name: 'FACT_BILLING',    queries: 396 },
                  { name: 'CHURN_AGENT',     queries: 312 },
                  { name: 'DIM_CUSTOMER',    queries: 284 },
                  { name: 'CUSTOMER_360_SV', queries: 264 },
                  { name: 'EXEC_360',        queries: 188 },
                  { name: 'CMTS_TELEMETRY',  queries: 142 },
                  { name: 'FACT_NETWORK_KPI',queries: 124 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={130} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="queries" name={tt('Queries 7d')} fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Query volume trend — 6 months')}>
            <div className="h-264">
              <ResponsiveContainer height={264}>
                <LineChart data={USAGE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="queries"      name={tt('Queries')}       stroke={BLUE}  strokeWidth={2.4} dot />
                  <Line type="monotone" dataKey="unique_users" name={tt('Unique users')}  stroke={AMBER} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                  <ReferenceLine y={15000} stroke={PURPLE} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ══════════════ QUALITY ═══════════════════════════════════════════════ */}
      {tab === 'quality' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Objects with DMF')}    value="9"    delta={tt('freshness checks')}   trend="up"   icon={Zap}        accent />
          <KpiCard label={tt('Data quality score')}  value="94%"  delta="+2 pp MoM"                trend="up"   icon={CheckCircle} />
          <KpiCard label={tt('Freshness violations')} value="3"   delta={tt('>24h stale')}          trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Classification runs')} value="184"  delta={tt('last 30d')}            trend="up"   icon={BarChart2}   />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Quality score by layer')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { layer: tt('Raw'),     score: 98 },
                  { layer: tt('Core'),    score: 96 },
                  { layer: tt('Marts'),   score: 94 },
                  { layer: tt('Semantic'),score: 98 },
                  { layer: tt('AI'),      score: 88 },
                  { layer: tt('Gov'),     score: 92 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="layer" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[80, 100]} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="score" name={tt('Quality score')} radius={[4, 4, 0, 0]}>
                    {[0,1,2,3,4,5].map(i => <Cell key={i} fill={[GREEN, GREEN, BLUE, GREEN, AMBER, BLUE][i]} />)}
                  </Bar>
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Freshness by database — % objects fresh')}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={FRESHNESS_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="db" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[70, 105]} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="fresh" name={tt('Fresh %')} stroke={GREEN} fill={GREEN} fillOpacity={0.3} />
                  <ReferenceLine y={95} stroke={AMBER} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-3 mt-4 text-[10px] text-vfes-dark/50">
          <Link to="/portal/data-quality" className="font-semibold text-vfes-dark hover:underline">{tt('Data Quality detail →')}</Link>
          <span>·</span>
          <Link to="/portal/observability" className="font-semibold text-vfes-dark hover:underline">{tt('Observability →')}</Link>
          <span>·</span>
          <Link to="/portal/lineage" className="font-semibold text-vfes-dark hover:underline">{tt('Lineage →')}</Link>
        </div>
      </>)}

      {/* Object detail drawer ─────────────────────────────────────────────── */}
      {obj && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setObj(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-vfes-dark to-zinc-800 text-white px-6 py-5 sticky top-0 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest font-mono text-white/60">{tt(db.name)}.{tt(schema.name)}</div>
                  <div className="font-mono text-2xl font-extrabold truncate">{tt(obj.name)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${TYPE_META[obj.type].color}`}>{TYPE_META[obj.type].label}</span>
                    {obj.tags?.map((t) => (
                      <span key={t} className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/15 text-white/90 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setObj(null)} className="p-1.5 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
              </div>
              {obj.desc && <div className="text-sm text-white/80 mt-3">{tt(obj.desc)}</div>}
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Stat k="Rows"         v={obj.rows ?? '—'} />
                <Stat k="Size"         v={obj.size ?? '—'} />
                <Stat k="Cluster key"  v={obj.cluster ?? '—'} mono />
                <Stat k="Owner role"   v={obj.owner ?? 'TRANSFORMER'} mono />
                <Stat k="Steward"      v={obj.steward ?? '—'} />
                <Stat k="Last refresh" v={obj.last ?? obj.lag ?? '—'} />
              </div>

              {obj.policy && obj.policy.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />{tt('Policies attached')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {obj.policy.map((p) => (
                      <span key={p} className="font-mono text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {obj.cols && obj.cols.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60 mb-2">{tt('Columns')} ({obj.cols.length})</div>
                  <div className="rounded-lg border border-black/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#fafbfc] text-vfes-dark/55 uppercase text-[9px] tracking-widest">
                        <tr>
                          <th className="text-left px-3 py-2">#</th>
                          <th className="text-left">{tt('Column')}</th>
                          <th className="text-left">{tt('Type')}</th>
                          <th className="text-left">{tt('Notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obj.cols.map((c, i) => (
                          <tr key={c.n} className="border-t border-black/5">
                            <td className="px-3 py-1.5 text-vfes-dark/40">{i + 1}</td>
                            <td className="font-mono font-semibold">
                              {c.n} {c.pk && <span className="text-[9px] bg-vfes-red text-vfes-dark px-1 rounded ml-1">{tt('PK')}</span>}
                            </td>
                            <td className="font-mono text-vfes-dark/70">{tt(c.t)}</td>
                            <td className="text-vfes-dark/55 text-[11px]">
                              {c.mask && <span className="font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">policy: {c.mask}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/60 mb-2">{tt('Sample query')}</div>
                <pre className="bg-[#0f172a] text-emerald-200 text-[11px] font-mono rounded-lg p-3 overflow-x-auto">{`SELECT *
FROM ${tt(db.name)}.${tt(schema.name)}.${tt(obj.name)}
WHERE 1=1
LIMIT 100;`}</pre>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button className="bg-vfes-red text-vfes-dark text-xs font-bold px-3 py-1.5 rounded">{tt('Open in worksheet')}</button>
                <button className="bg-white border border-black/10 text-xs font-bold px-3 py-1.5 rounded">{tt('View lineage')}</button>
                <button className="bg-white border border-black/10 text-xs font-bold px-3 py-1.5 rounded">{tt('Permissions')}</button>
                <button className="bg-white border border-black/10 text-xs font-bold px-3 py-1.5 rounded">{tt('Profile data')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/40 pt-6 mt-6 border-t border-black/5">
        {tt('Snowflake Horizon · classification SYSTEM$CLASSIFY daily · masking 14 active · row-access 6 active · refreshed 04:00 UTC')}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-vfes-dark/40">
        <Link to="/portal/lineage"       className="hover:text-vfes-dark">{tt('Lineage')}</Link>
        <span>·</span>
        <Link to="/portal/data-quality"  className="hover:text-vfes-dark">{tt('Data Quality')}</Link>
        <span>·</span>
        <Link to="/portal/data-products" className="hover:text-vfes-dark">{tt('Data Products')}</Link>
        <span>·</span>
        <Link to="/portal/semantic-views" className="hover:text-vfes-dark">{tt('Semantic Views')}</Link>
        <span>·</span>
        <Link to="/portal/horizon"        className="hover:text-vfes-dark">{tt('Horizon')}</Link>
      </div>
    </div>
  )
}

function Stat({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-[#fafbfc] border border-black/5 p-3">
      <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{k}</div>
      <div className={`text-sm font-bold mt-0.5 ${mono ? 'font-mono' : ''}`}>{v}</div>
    </div>
  )
}
