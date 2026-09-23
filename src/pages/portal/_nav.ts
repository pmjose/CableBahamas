// Canonical navigation model — single source of truth for the sidebar AND the
// ⌘K command palette so they never drift.
import {
  BarChart3, Activity, Users, Megaphone, Wallet, TrendingUp,
  Target, Siren, Headphones, Network, HardHat, Map, PackageSearch, Building2, ShoppingCart, Smartphone,
  Scale, ShieldCheck, UserCog, Sparkles, Gem, Boxes, Filter, SlidersHorizontal,
  Layers, BookOpen, Bot, Workflow,
  GitBranch, ShieldAlert, Wallet as WalletIcon, Activity as ActivityIcon, Key, Eye, Brain, Search as SearchIcon,
  Globe2, Server, Box as BoxIcon, FileText, Siren as SirenIcon, Sparkles as SparklesIcon, ShieldCheck as ShieldIcon,
  Radio, ArrowRightLeft, Leaf, Cpu, Cable, MessageSquareText, Briefcase, HeartPulse, Repeat, Gift, Landmark,
  Boxes as BoxesIcon, ClipboardList, PhoneCall, Store, Gauge, Receipt, Package, LineChart, AppWindow,
  Database,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: any; highlight?: boolean; badge?: string }
export type NavGroup = { name: string; items: NavItem[] }

export const GROUPS: NavGroup[] = [
  {
    name: 'Leadership',
    items: [
      { to: 'executive', label: 'CEO', icon: BarChart3 },
      { to: 'cfo', label: 'CFO', icon: Wallet, badge: 'NEW' },
      { to: 'coo', label: 'COO', icon: Activity, badge: 'NEW' },
      { to: 'cto', label: 'CTO', icon: Cpu, badge: 'NEW' },
      { to: 'cio', label: 'CIO', icon: Server, badge: 'NEW' },
      { to: 'cco', label: 'CCO', icon: TrendingUp, badge: 'NEW' },
      { to: 'cmo', label: 'CMO', icon: Megaphone, badge: 'NEW' },
      { to: 'ciso', label: 'CISO', icon: ShieldCheck, badge: 'NEW' },
      { to: 'cdo', label: 'CDO', icon: Database, badge: 'NEW' },
      { to: 'caio', label: 'CAIO', icon: Brain, badge: 'NEW' },
      { to: 'people', label: 'CHRO', icon: UserCog },
      { to: 'strategy', label: 'Strategy & OKRs', icon: Target },
      { to: 'war-room', label: 'War Room', icon: Siren },
      { to: 'investor-relations', label: 'Investor Relations', icon: LineChart, badge: 'NEW' },
      { to: 'ai-insights', label: 'AI Insights', icon: Brain },
    ],
  },
  {
    name: 'Customer',
    items: [
      { to: 'customer-360', label: 'Customer 360', icon: Users, highlight: true },
      { to: 'clv', label: 'CLV Explorer', icon: Gem },
      { to: 'churn-retention', label: 'Churn & Retention', icon: HeartPulse, badge: 'NEW' },
      { to: 'base-management', label: 'Base Management & NRR', icon: Repeat, badge: 'NEW' },
      { to: 'mnp', label: 'MNP Flow & Save Desk', icon: ArrowRightLeft, badge: 'NEW' },
      { to: 'bundle-propensity', label: 'Bundle Propensity', icon: Boxes },
      { to: 'experience', label: 'Customer Experience', icon: Headphones },
      { to: 'contact-center', label: 'Contact Center & Agent Assist', icon: PhoneCall, badge: 'NEW' },
      { to: 'voc', label: 'Voice of Customer', icon: MessageSquareText, badge: 'NEW' },
      { to: 'loyalty-consent', label: 'Loyalty & Consent', icon: Gift, badge: 'NEW' },
      { to: 'digital-app', label: 'Digital App Engagement', icon: AppWindow, badge: 'NEW' },
    ],
  },
  {
    name: 'Commercial & Marketing',
    items: [
      { to: 'sales', label: 'Sales', icon: TrendingUp },
      { to: 'channel-dealers', label: 'Channel & Dealers', icon: Store, badge: 'NEW' },
      { to: 'marketing', label: 'Marketing', icon: Megaphone },
      { to: 'digital-funnel', label: 'Digital Funnel', icon: Filter },
      { to: 'promotions', label: 'Promotions & Discounts', icon: Filter, badge: 'NEW' },
      { to: 'pricing-simulator', label: 'Pricing Simulator', icon: SlidersHorizontal },
      { to: 'price-wargame', label: 'Price-Response War-game', icon: Target, badge: 'NEW' },
      { to: 'bundle-profitability', label: 'Bundle Profitability', icon: Sparkles },
      { to: 'product', label: 'Product & Content', icon: PackageSearch },
      { to: 'device-financing', label: 'Device & Trade-in', icon: Smartphone, badge: 'NEW' },
    ],
  },
  {
    name: 'Network & Technology',
    items: [
      { to: 'network', label: 'Network & Engineering', icon: Network },
      { to: 'mobile-ran', label: 'Mobile RAN', icon: Smartphone, highlight: true },
      { to: 'coverage', label: 'Coverage Map', icon: Map },
      { to: 'spectrum', label: 'Spectrum Portfolio', icon: Radio, badge: 'NEW' },
      { to: 'core-5g', label: '5G Core Health', icon: Cpu, badge: 'NEW' },
      { to: 'transport', label: 'Transport & Backbone', icon: Cable, badge: 'NEW' },
      { to: 'fixed-access', label: 'Fixed Access (PON)', icon: Server, badge: 'NEW' },
      { to: 'slicing', label: '5G Slicing & MEC', icon: Layers, badge: 'NEW' },
      { to: 'ran-energy', label: 'RAN Energy & ESG', icon: Leaf, badge: 'NEW' },
      { to: 'capacity-capex', label: 'Capacity & Capex', icon: Gauge, badge: 'NEW' },
      { to: 'inventory', label: 'Network Inventory & Assets', icon: ClipboardList, badge: 'NEW' },
    ],
  },
  {
    name: 'Service Operations',
    items: [
      { to: 'operations', label: 'Operations', icon: Activity },
      { to: 'noc-map', label: 'National NOC Map', icon: Globe2, highlight: true, badge: 'NEW' },
      { to: 'assurance', label: 'Service Assurance', icon: ActivityIcon, badge: 'NEW' },
      { to: 'order-provisioning', label: 'Order & Provisioning', icon: Workflow, badge: 'NEW' },
      { to: 'field-ops', label: 'Field Operations', icon: HardHat },
      { to: 'incidents', label: 'Incidents', icon: SirenIcon },
    ],
  },
  {
    name: 'Finance & Procurement',
    items: [
      { to: 'finance', label: 'Finance', icon: Wallet },
      { to: 'billing-charging', label: 'Billing & Charging', icon: Receipt, badge: 'NEW' },
      { to: 'revenue-assurance', label: 'Revenue Assurance', icon: ShieldCheck, badge: 'NEW' },
      { to: 'debt-collections', label: 'Bad Debt & Collections', icon: WalletIcon, badge: 'NEW' },
      { to: 'capital-treasury', label: 'Capital & Treasury', icon: Landmark, badge: 'NEW' },
      { to: 'ma-simulator', label: 'M&A Simulator', icon: Briefcase, badge: 'NEW' },
      { to: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { to: 'supply-chain', label: 'Supply Chain & Logistics', icon: Package, badge: 'NEW' },
    ],
  },
  {
    name: 'Wholesale & B2B',
    items: [
      { to: 'b2b', label: 'B2B / Wholesale', icon: Building2 },
      { to: 'company-360', label: 'Company 360', icon: Building2, highlight: true, badge: 'NEW' },
      { to: 'mvno-wholesale', label: 'MVNO & Wholesale', icon: Radio, badge: 'NEW' },
      { to: 'roaming', label: 'Roaming P&L', icon: Globe2, badge: 'NEW' },
      { to: 'b2b-app', label: 'B2B Native App', icon: BoxesIcon, badge: 'NEW' },
    ],
  },
  {
    name: 'Risk, Security & Regulatory',
    items: [
      { to: 'risk', label: 'Risk & Security', icon: ShieldCheck },
      { to: 'fraud', label: 'Fraud & Signaling', icon: ShieldAlert, badge: 'NEW' },
      { to: 'trust-center', label: 'Trust Center', icon: ShieldIcon },
      { to: 'rbac', label: 'RBAC Explorer', icon: Key },
      { to: 'horizon', label: 'Horizon', icon: Eye },
      { to: 'regulatory', label: 'Regulatory & ESG', icon: Scale },
      { to: 'urca-pack', label: 'URCA / Regulator Pack', icon: Scale, badge: 'NEW' },
    ],
  },
  {
    name: 'Data & Governance',
    items: [
      { to: 'architecture', label: 'Architecture', icon: Layers },
      { to: 'catalog', label: 'Data Catalog', icon: BookOpen },
      { to: 'data-products', label: 'Data Products', icon: SparklesIcon },
      { to: 'data-contracts', label: 'Data Contracts', icon: FileText },
      { to: 'lineage', label: 'Lineage & Impact', icon: GitBranch },
      { to: 'data-engineering', label: 'Data Engineering', icon: Workflow },
      { to: 'data-quality', label: 'Data Quality', icon: ShieldIcon },
      { to: 'semantic-views', label: 'Semantic Views', icon: Eye },
      { to: 'observability', label: 'Observability', icon: ActivityIcon },
      { to: 'environments', label: 'Environments', icon: GitBranch },
      { to: 'cost', label: 'Cost Intelligence', icon: WalletIcon },
    ],
  },
  {
    name: 'AI & ML',
    items: [
      { to: 'agents', label: 'Cortex Agents', icon: Bot },
      { to: 'cortex-search', label: 'Cortex Search', icon: SearchIcon },
      { to: 'ml-registry', label: 'ML Registry', icon: Brain },
      { to: 'feature-store', label: 'Feature Store', icon: Boxes, badge: 'NEW' },
      { to: 'ai-spend', label: 'AI Spend & Guardrails', icon: ShieldAlert },
    ],
  },
  {
    name: 'Apps & Sharing',
    items: [
      { to: 'sharing', label: 'Sharing & Marketplace', icon: Globe2 },
      { to: 'clean-rooms', label: 'Data Clean Rooms', icon: ShieldIcon, badge: 'NEW' },
      { to: 'apps', label: 'Apps & SPCS', icon: Server },
      { to: 'iceberg', label: 'Iceberg & External', icon: BoxIcon },
    ],
  },
]

export default GROUPS
