import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import GatePage from './pages/GatePage'
import ProtectedRoute from './auth/ProtectedRoute'

// Lazy-load all heavy pages (each chunked separately, so first paint is fast)
const LandingPage = lazy(() => import('./pages/LandingPage'))
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'))
const ExecutivePage = lazy(() => import('./pages/portal/ExecutivePage'))
const StrategyPage = lazy(() => import('./pages/portal/StrategyPage'))
const WarRoomPage = lazy(() => import('./pages/portal/WarRoomPage'))
const OperationsPage = lazy(() => import('./pages/portal/OperationsPage'))
const NetworkPage = lazy(() => import('./pages/portal/NetworkPage'))
const MobileRanPage = lazy(() => import('./pages/portal/MobileRanPage'))
const FieldOpsPage = lazy(() => import('./pages/portal/FieldOpsPage'))
const CoveragePage = lazy(() => import('./pages/portal/CoveragePage'))
const Customer360Page = lazy(() => import('./pages/portal/Customer360Page'))
const CXPage = lazy(() => import('./pages/portal/CXPage'))
const MarketingPage = lazy(() => import('./pages/portal/MarketingPage'))
const SalesPage = lazy(() => import('./pages/portal/SalesPage'))
const AIInsightsPage = lazy(() => import('./pages/portal/AIInsightsPage'))
const FinancePage = lazy(() => import('./pages/portal/FinancePage'))
const ProductPage = lazy(() => import('./pages/portal/ProductPage'))
const B2BPage = lazy(() => import('./pages/portal/B2BPage'))
const Company360Page = lazy(() => import('./pages/portal/Company360Page'))
const ProcurementPage = lazy(() => import('./pages/portal/ProcurementPage'))
const RegulatoryPage = lazy(() => import('./pages/portal/RegulatoryPage'))
const RiskPage = lazy(() => import('./pages/portal/RiskPage'))
const PeoplePage = lazy(() => import('./pages/portal/PeoplePage'))
const CLVExplorerPage = lazy(() => import('./pages/portal/CLVExplorerPage'))
const BundlePropensityPage = lazy(() => import('./pages/portal/BundlePropensityPage'))
const DigitalFunnelPage = lazy(() => import('./pages/portal/DigitalFunnelPage'))
const PricingSimulatorPage = lazy(() => import('./pages/portal/PricingSimulatorPage'))
const BundleProfitabilityPage = lazy(() => import('./pages/portal/BundleProfitabilityPage'))
const PlatformArchitecturePage = lazy(() => import('./pages/portal/PlatformArchitecturePage'))
const DataCatalogPage = lazy(() => import('./pages/portal/DataCatalogPage'))
const BahamasMarketPage = lazy(() => import('./pages/portal/BahamasMarketPage'))
const BahamasDataPage = lazy(() => import('./pages/portal/BahamasDataPage'))
const AgenticWorkflowsPage = lazy(() => import('./pages/portal/AgenticWorkflowsPage'))
const CortexAgentsPage = lazy(() => import('./pages/portal/CortexAgentsPage'))
const DataEngineeringPage = lazy(() => import('./pages/portal/DataEngineeringPage'))
const LineagePage = lazy(() => import('./pages/portal/LineagePage'))
const DataQualityPage = lazy(() => import('./pages/portal/DataQualityPage'))
const CostIntelligencePage = lazy(() => import('./pages/portal/CostIntelligencePage'))
const ObservabilityPage = lazy(() => import('./pages/portal/ObservabilityPage'))
const RBACExplorerPage = lazy(() => import('./pages/portal/RBACExplorerPage'))
const TrustCenterPage = lazy(() => import('./pages/portal/TrustCenterPage'))
const HorizonPage = lazy(() => import('./pages/portal/HorizonPage'))
const MLRegistryPage = lazy(() => import('./pages/portal/MLRegistryPage'))
const CortexSearchPage = lazy(() => import('./pages/portal/CortexSearchPage'))
const SemanticViewsPage = lazy(() => import('./pages/portal/SemanticViewsPage'))
const AISpendPage = lazy(() => import('./pages/portal/AISpendPage'))
const SharingMarketplacePage = lazy(() => import('./pages/portal/SharingMarketplacePage'))
const AppsCatalogPage = lazy(() => import('./pages/portal/AppsCatalogPage'))
const IcebergPage = lazy(() => import('./pages/portal/IcebergPage'))
const DataProductsPage = lazy(() => import('./pages/portal/DataProductsPage'))
const DataContractsPage = lazy(() => import('./pages/portal/DataContractsPage'))
const EnvironmentsPage = lazy(() => import('./pages/portal/EnvironmentsPage'))
const IncidentsPage = lazy(() => import('./pages/portal/IncidentsPage'))
// Telecom build-out — Phase A
const SpectrumPage = lazy(() => import('./pages/portal/SpectrumPage'))
const MnpPage = lazy(() => import('./pages/portal/MnpPage'))
const RoamingPage = lazy(() => import('./pages/portal/RoamingPage'))
const RanEnergyPage = lazy(() => import('./pages/portal/RanEnergyPage'))
const Core5GPage = lazy(() => import('./pages/portal/Core5GPage'))
const FraudPage = lazy(() => import('./pages/portal/FraudPage'))
// Telecom build-out — Phase B
const TransportPage = lazy(() => import('./pages/portal/TransportPage'))
const FixedAccessPage = lazy(() => import('./pages/portal/FixedAccessPage'))
const SlicingPage = lazy(() => import('./pages/portal/SlicingPage'))
const MvnoWholesalePage = lazy(() => import('./pages/portal/MvnoWholesalePage'))
const DebtCollectionsPage = lazy(() => import('./pages/portal/DebtCollectionsPage'))
const VocPage = lazy(() => import('./pages/portal/VocPage'))
// Telecom build-out — Phase C
const DeviceFinancingPage = lazy(() => import('./pages/portal/DeviceFinancingPage'))
const MaSimulatorPage = lazy(() => import('./pages/portal/MaSimulatorPage'))
const UrcaPackPage = lazy(() => import('./pages/portal/UrcaPackPage'))
const FeatureStorePage = lazy(() => import('./pages/portal/FeatureStorePage'))
const CleanRoomsPage = lazy(() => import('./pages/portal/CleanRoomsPage'))
const B2bAppPage = lazy(() => import('./pages/portal/B2bAppPage'))
const AssurancePage = lazy(() => import('./pages/portal/AssurancePage'))
const NocMapPage = lazy(() => import('./pages/portal/NocMapPage'))
const RevenueAssurancePage = lazy(() => import('./pages/portal/RevenueAssurancePage'))
const NetworkInventoryPage = lazy(() => import('./pages/portal/NetworkInventoryPage'))
const OrderProvisioningPage = lazy(() => import('./pages/portal/OrderProvisioningPage'))
const ContactCenterPage = lazy(() => import('./pages/portal/ContactCenterPage'))
const ChannelDealersPage = lazy(() => import('./pages/portal/ChannelDealersPage'))
const CapacityCapexPage = lazy(() => import('./pages/portal/CapacityCapexPage'))
const BillingChargingPage = lazy(() => import('./pages/portal/BillingChargingPage'))
const SupplyChainPage = lazy(() => import('./pages/portal/SupplyChainPage'))
const InvestorRelationsPage = lazy(() => import('./pages/portal/InvestorRelationsPage'))
const DigitalAppEngagementPage = lazy(() => import('./pages/portal/DigitalAppEngagementPage'))
// Customers board-grade
const ChurnRetentionPage = lazy(() => import('./pages/portal/ChurnRetentionPage'))
const BaseManagementPage = lazy(() => import('./pages/portal/BaseManagementPage'))
const LoyaltyConsentPage = lazy(() => import('./pages/portal/LoyaltyConsentPage'))
// Commercial board-grade
const PromotionsPage = lazy(() => import('./pages/portal/PromotionsPage'))
const PriceWargamePage = lazy(() => import('./pages/portal/PriceWargamePage'))
const CapitalTreasuryPage = lazy(() => import('./pages/portal/CapitalTreasuryPage'))
// Leadership — C-suite cockpits
const CFOPage = lazy(() => import('./pages/portal/CFOPage'))
const COOPage = lazy(() => import('./pages/portal/COOPage'))
const CTOPage = lazy(() => import('./pages/portal/CTOPage'))
const CIOPage = lazy(() => import('./pages/portal/CIOPage'))
const CCOPage = lazy(() => import('./pages/portal/CCOPage'))
const CMOPage = lazy(() => import('./pages/portal/CMOPage'))
const CISOPage = lazy(() => import('./pages/portal/CISOPage'))
const CDOPage = lazy(() => import('./pages/portal/CDOPage'))
const CAIOPage = lazy(() => import('./pages/portal/CAIOPage'))

function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-vfes-red animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-vfes-red animate-pulse" style={{ animationDelay: '0.15s' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-vfes-red animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-vfes-dark/40 font-bold">Loading</div>
      </div>
    </div>
  )
}

export default function App() {
  const { i18n } = useTranslation()
  return (
    <Suspense fallback={<PageLoader />} key={i18n.language}>
      <Routes>
        <Route path="/" element={<GatePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="executive" replace />} />
            {/* Leadership */}
            <Route path="executive" element={<ExecutivePage />} />
            <Route path="cfo" element={<CFOPage />} />
            <Route path="coo" element={<COOPage />} />
            <Route path="cto" element={<CTOPage />} />
            <Route path="cio" element={<CIOPage />} />
            <Route path="cco" element={<CCOPage />} />
            <Route path="cmo" element={<CMOPage />} />
            <Route path="ciso" element={<CISOPage />} />
            <Route path="cdo" element={<CDOPage />} />
            <Route path="caio" element={<CAIOPage />} />
            <Route path="strategy" element={<StrategyPage />} />
            <Route path="war-room" element={<WarRoomPage />} />
            {/* Customers */}
            <Route path="customer-360" element={<Customer360Page />} />
            <Route path="clv" element={<CLVExplorerPage />} />
            <Route path="bundle-propensity" element={<BundlePropensityPage />} />
            <Route path="digital-funnel" element={<DigitalFunnelPage />} />
            <Route path="experience" element={<CXPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="ai-insights" element={<AIInsightsPage />} />
            {/* Network & Operations */}
            <Route path="operations" element={<OperationsPage />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="mobile-ran" element={<MobileRanPage />} />
            <Route path="field-ops" element={<FieldOpsPage />} />
            <Route path="coverage" element={<CoveragePage />} />
            <Route path="noc-map" element={<NocMapPage />} />
            {/* Commercial */}
            <Route path="finance" element={<FinancePage />} />
            <Route path="pricing-simulator" element={<PricingSimulatorPage />} />
            <Route path="bundle-profitability" element={<BundleProfitabilityPage />} />
            <Route path="product" element={<ProductPage />} />
            <Route path="b2b" element={<B2BPage />} />
            <Route path="company-360" element={<Company360Page />} />
            <Route path="procurement" element={<ProcurementPage />} />
            {/* Governance */}
            <Route path="regulatory" element={<RegulatoryPage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="people" element={<PeoplePage />} />

            {/* Platform & Data */}
            <Route path="architecture" element={<PlatformArchitecturePage />} />
            <Route path="catalog" element={<DataCatalogPage />} />
            <Route path="agentic-workflows" element={<AgenticWorkflowsPage />} />
            <Route path="bahamas-data" element={<BahamasDataPage />} />
            <Route path="bahamas-market" element={<BahamasMarketPage />} />
            <Route path="agents" element={<CortexAgentsPage />} />
            <Route path="data-engineering" element={<DataEngineeringPage />} />
            <Route path="lineage" element={<LineagePage />} />
            <Route path="data-quality" element={<DataQualityPage />} />
            <Route path="cost" element={<CostIntelligencePage />} />
            <Route path="observability" element={<ObservabilityPage />} />
            <Route path="rbac" element={<RBACExplorerPage />} />
            <Route path="trust-center" element={<TrustCenterPage />} />
            <Route path="horizon" element={<HorizonPage />} />
            <Route path="ml-registry" element={<MLRegistryPage />} />
            <Route path="cortex-search" element={<CortexSearchPage />} />
            <Route path="semantic-views" element={<SemanticViewsPage />} />
            <Route path="ai-spend" element={<AISpendPage />} />
            <Route path="sharing" element={<SharingMarketplacePage />} />
            <Route path="apps" element={<AppsCatalogPage />} />
            <Route path="iceberg" element={<IcebergPage />} />
            <Route path="data-products" element={<DataProductsPage />} />
            <Route path="data-contracts" element={<DataContractsPage />} />
            <Route path="environments" element={<EnvironmentsPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            {/* Telecom build-out — Phase A */}
            <Route path="spectrum" element={<SpectrumPage />} />
            <Route path="mnp" element={<MnpPage />} />
            <Route path="roaming" element={<RoamingPage />} />
            <Route path="ran-energy" element={<RanEnergyPage />} />
            <Route path="core-5g" element={<Core5GPage />} />
            <Route path="fraud" element={<FraudPage />} />
            {/* Telecom build-out — Phase B */}
            <Route path="transport" element={<TransportPage />} />
            <Route path="fixed-access" element={<FixedAccessPage />} />
            <Route path="slicing" element={<SlicingPage />} />
            <Route path="mvno-wholesale" element={<MvnoWholesalePage />} />
            <Route path="inventory" element={<NetworkInventoryPage />} />
            <Route path="order-provisioning" element={<OrderProvisioningPage />} />
            <Route path="contact-center" element={<ContactCenterPage />} />
            <Route path="channel-dealers" element={<ChannelDealersPage />} />
            <Route path="capacity-capex" element={<CapacityCapexPage />} />
            <Route path="billing-charging" element={<BillingChargingPage />} />
            <Route path="supply-chain" element={<SupplyChainPage />} />
            <Route path="investor-relations" element={<InvestorRelationsPage />} />
            <Route path="digital-app" element={<DigitalAppEngagementPage />} />
            <Route path="debt-collections" element={<DebtCollectionsPage />} />
            <Route path="voc" element={<VocPage />} />
            {/* Telecom build-out — Phase C */}
            <Route path="device-financing" element={<DeviceFinancingPage />} />
            <Route path="ma-simulator" element={<MaSimulatorPage />} />
            <Route path="urca-pack" element={<UrcaPackPage />} />
            <Route path="feature-store" element={<FeatureStorePage />} />
            <Route path="clean-rooms" element={<CleanRoomsPage />} />
            <Route path="b2b-app" element={<B2bAppPage />} />
            <Route path="assurance" element={<AssurancePage />} />
            <Route path="revenue-assurance" element={<RevenueAssurancePage />} />
            <Route path="churn-retention" element={<ChurnRetentionPage />} />
            <Route path="base-management" element={<BaseManagementPage />} />
            <Route path="loyalty-consent" element={<LoyaltyConsentPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="price-wargame" element={<PriceWargamePage />} />
            <Route path="capital-treasury" element={<CapitalTreasuryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
