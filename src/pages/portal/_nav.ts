// Canonical navigation model — single source of truth for the sidebar AND the
// ⌘K command palette so they never drift. REV fixed services lead; aliv
// mobile surfaces are grouped separately.
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
      { to: 'cfo', label: 'CFO', icon: Wallet },
      { to: 'coo', label: 'COO', icon: Activity },
      { to: 'cto', label: 'CTO', icon: Cpu },
      { to: 'cio', label: 'CIO', icon: Server },
      { to: 'cco', label: 'CCO', icon: TrendingUp },
      { to: 'cmo', label: 'CMO', icon: Megaphone },
      { to: 'ciso', label: 'CISO', icon: ShieldCheck },
      { to: 'cdo', label: 'CDO', icon: Database },
      { to: 'caio', label: 'CAIO', icon: Brain },
      { to: 'people', label: 'CHRO', icon: UserCog },
      { to: 'strategy', label: 'Strategy & OKRs', icon: Target },
      { to: 'war-room', label: 'War Room', icon: Siren },
      { to: 'investor-relations', label: 'Investor Relations', icon: LineChart },
      { to: 'ai-insights', label: 'AI Insights', icon: Brain },
    ],
  },
  {
    name: 'Customer',
    items: [
      { to: 'customer-360', label: 'Customer 360', icon: Users, highlight: true },
      { to: 'clv', label: 'CLV Explorer', icon: Gem },
      { to: 'churn-retention', label: 'Churn & Retention', icon: HeartPulse },
      { to: 'base-management', label: 'Base Management & NRR', icon: Repeat },
      { to: 'bundle-propensity', label: 'Bundle Propensity', icon: Boxes },
      { to: 'experience', label: 'Customer Experience', icon: Headphones },
      { to: 'contact-center', label: 'Contact Center & Agent Assist', icon: PhoneCall },
      { to: 'voc', label: 'Voice of Customer', icon: MessageSquareText },
      { to: 'loyalty-consent', label: 'Loyalty & Consent', icon: Gift },
      { to: 'digital-app', label: 'Digital App Engagement', icon: AppWindow },
    ],
  },
  {
    name: 'Commercial & Marketing',
    items: [
      { to: 'sales', label: 'Sales', icon: TrendingUp },
      { to: 'channel-dealers', label: 'Channel & Dealers', icon: Store },
      { to: 'marketing', label: 'Marketing', icon: Megaphone },
      { to: 'digital-funnel', label: 'Digital Funnel', icon: Filter },
      { to: 'promotions', label: 'Promotions & Discounts', icon: Filter },
      { to: 'pricing-simulator', label: 'Pricing Simulator', icon: SlidersHorizontal },
      { to: 'price-wargame', label: 'Price-Response War-game', icon: Target },
      { to: 'bundle-profitability', label: 'Bundle Profitability', icon: Sparkles },
      { to: 'product', label: 'Product & Content', icon: PackageSearch },
    ],
  },
  {
    name: 'Network & Technology',
    items: [
      { to: 'network', label: 'Network & Engineering', icon: Network },
      { to: 'coverage', label: 'Coverage Map', icon: Map },
      { to: 'transport', label: 'Transport & Backbone', icon: Cable },
      { to: 'fixed-access', label: 'Fixed Access (PON)', icon: Server },
      { to: 'capacity-capex', label: 'Capacity & Capex', icon: Gauge },
      { to: 'inventory', label: 'Network Inventory & Assets', icon: ClipboardList },
    ],
  },
  {
    name: 'aliv Mobile',
    items: [
      { to: 'mobile-ran', label: 'Mobile RAN', icon: Smartphone, highlight: true },
      { to: 'spectrum', label: 'Spectrum Portfolio', icon: Radio },
      { to: 'core-5g', label: '5G Core Health', icon: Cpu },
      { to: 'slicing', label: '5G Slicing & MEC', icon: Layers },
      { to: 'ran-energy', label: 'RAN Energy', icon: Leaf },
      { to: 'mnp', label: 'Number Portability & Save Desk', icon: ArrowRightLeft },
      { to: 'mvno-wholesale', label: 'MVNO & Wholesale', icon: Radio },
      { to: 'roaming', label: 'Roaming P&L', icon: Globe2 },
      { to: 'device-financing', label: 'Handsets & Trade-in', icon: Smartphone },
    ],
  },
  {
    name: 'Service Operations',
    items: [
      { to: 'operations', label: 'Operations', icon: Activity },
      { to: 'noc-map', label: 'National NOC Map', icon: Globe2, highlight: true },
      { to: 'assurance', label: 'Service Assurance', icon: ActivityIcon },
      { to: 'order-provisioning', label: 'Order & Provisioning', icon: Workflow },
      { to: 'field-ops', label: 'Field Operations', icon: HardHat },
      { to: 'incidents', label: 'Incidents', icon: SirenIcon },
    ],
  },
  {
    name: 'Finance & Procurement',
    items: [
      { to: 'finance', label: 'Finance', icon: Wallet },
      { to: 'billing-charging', label: 'Billing & Charging', icon: Receipt },
      { to: 'revenue-assurance', label: 'Revenue Assurance', icon: ShieldCheck },
      { to: 'debt-collections', label: 'Bad Debt & Collections', icon: WalletIcon },
      { to: 'capital-treasury', label: 'Capital & Treasury', icon: Landmark },
      { to: 'ma-simulator', label: 'M&A Simulator', icon: Briefcase },
      { to: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { to: 'supply-chain', label: 'Supply Chain & Logistics', icon: Package },
    ],
  },
  {
    name: 'Wholesale & B2B',
    items: [
      { to: 'b2b', label: 'B2B / Wholesale', icon: Building2 },
      { to: 'company-360', label: 'Company 360', icon: Building2, highlight: true },
      { to: 'b2b-app', label: 'B2B Native App', icon: BoxesIcon },
    ],
  },
  {
    name: 'Risk, Security & Regulatory',
    items: [
      { to: 'risk', label: 'Risk & Security', icon: ShieldCheck },
      { to: 'fraud', label: 'Fraud & Signaling', icon: ShieldAlert },
      { to: 'trust-center', label: 'Trust Center', icon: ShieldIcon },
      { to: 'rbac', label: 'RBAC Explorer', icon: Key },
      { to: 'horizon', label: 'Horizon', icon: Eye },
      { to: 'regulatory', label: 'Regulatory & ESG', icon: Scale },
      { to: 'urca-pack', label: 'URCA / Regulator Pack', icon: Scale },
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
      { to: 'agentic-workflows', label: 'Agentic Workflows', icon: Workflow, highlight: true },
      { to: 'agents', label: 'Cortex Agents', icon: Bot },
      { to: 'cortex-search', label: 'Cortex Search', icon: SearchIcon },
      { to: 'ml-registry', label: 'ML Registry', icon: Brain },
      { to: 'feature-store', label: 'Feature Store', icon: Boxes },
      { to: 'ai-spend', label: 'AI Spend & Guardrails', icon: ShieldAlert },
    ],
  },
  {
    name: 'Apps & Sharing',
    items: [
      { to: 'sharing', label: 'Sharing & Marketplace', icon: Globe2 },
      { to: 'clean-rooms', label: 'Data Clean Rooms', icon: ShieldIcon },
      { to: 'apps', label: 'Apps & SPCS', icon: Server },
      { to: 'iceberg', label: 'Iceberg & External', icon: BoxIcon },
    ],
  },
]

export default GROUPS
