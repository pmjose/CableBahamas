import { seededRandom } from '../../data/scenario'
const scenarioRandom = seededRandom(4109)
import { useState, useMemo, useEffect, useReducer } from 'react'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import {
  Sparkles, TrendingUp, TrendingDown, Wifi, Play, GitCompare, Package, Coins,
  Users, Network, Shield, BarChart3, Activity, FileText,
  Globe, Layers, Target, Gauge, Briefcase, Heart, Clock, Calculator, Scale, Percent,
  Settings, RotateCcw, Save, Download, ChevronDown, ChevronUp, Grid3x3, Smartphone, FlaskConical,
} from 'lucide-react'
import {
  Line, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Legend, Cell, ReferenceLine, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { MOBILE_PLAN_TIERS } from './_mobile_data'
import {
  logitShare, logitCrossElasticity, survivalCurve, effectiveArpu,
  ltv as calcLtv, paybackMonths, bertrandNash, monteCarloEbitda, percentile,
  histogram, optimalPriceGrid, multiYearPnl,
} from './_pricing_math'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }

// ===========================================================================
// CATALOG — full Cable Bahamas 2026 product taxonomy with tariff structure
// ===========================================================================
type Segment = 'B2C' | 'SOHO' | 'SME'
type Lifecycle = 'PROMO' | 'EOC' | 'SVR' | 'WINBACK'
type Channel = 'Digital' | 'Retail' | 'Save Desk' | 'D2D' | 'Partner'

type Product = {
  code: string; name: string; cat: string; segment: Segment
  // Tariff
  list: number; promo: number; svr: number; promoMonths: number
  contractMonths: number; etf: number
  install: number; kitSubsidy: number; activation: number
  // Cost
  cogs: number; care: number
  // Volume
  baseAcq: number; baseChurn: number; baseMig: number; baseBase: number
  // Elasticity (acquisition / churn / migration)
  eAcq: number; eChurn: number; eMig: number
  // Competitive
  movistarPrice: number; digiPrice: number; vodaPrice: number; vooPrice: number
}

const products: Product[] = [
  // ───── Broadband (B2C residential) ─────────────────────────────────────
  { code: 'BB_10G',   name: '10 Gb Fibre (XGS-PON)',                     cat: 'Broadband', segment: 'B2C',
    list: 50,  promo: 35,  svr: 50,  promoMonths: 12, contractMonths: 24, etf: 240, install: 0,   kitSubsidy: 0,  activation: 35,
    cogs: 22, care: 4.0, baseAcq: 1100, baseChurn: 92,  baseMig: 180, baseBase: 38_400,
    eAcq: -1.3, eChurn: 0.5, eMig: 1.0, movistarPrice: 55, digiPrice: 50, vodaPrice: 50, vooPrice: 0 },
  { code: 'BB_2G',   name: '2 Gb Fibre',                                cat: 'Broadband', segment: 'B2C',
    list: 50,  promo: 35,  svr: 50,  promoMonths: 12, contractMonths: 24, etf: 216, install: 0,   kitSubsidy: 0,  activation: 35,
    cogs: 19, care: 3.8, baseAcq: 2200, baseChurn: 165, baseMig: 240, baseBase: 64_800,
    eAcq: -1.4, eChurn: 0.6, eMig: 1.1, movistarPrice: 52,  digiPrice: 48, vodaPrice: 50,  vooPrice: 0 },
  { code: 'BB_1G',   name: '1 Gb Fibre',                                cat: 'Broadband', segment: 'B2C',
    list: 40,  promo: 30,  svr: 40,  promoMonths: 12, contractMonths: 24, etf: 192, install: 0,   kitSubsidy: 0,  activation: 35,
    cogs: 16, care: 3.6, baseAcq: 4820, baseChurn: 380, baseMig: 720, baseBase: 142_500,
    eAcq: -1.6, eChurn: 0.8, eMig: 1.3, movistarPrice: 42,  digiPrice: 38, vodaPrice: 40,  vooPrice: 0 },
  { code: 'BB_600',  name: '600 Mb Fibre',                              cat: 'Broadband', segment: 'B2C',
    list: 35,  promo: 25,  svr: 35,  promoMonths: 12, contractMonths: 24, etf: 168, install: 0,   kitSubsidy: 0,  activation: 35,
    cogs: 14, care: 3.4, baseAcq: 3650, baseChurn: 290, baseMig: 540, baseBase: 98_700,
    eAcq: -1.9, eChurn: 1.0, eMig: 1.4, movistarPrice: 36,  digiPrice: 32, vodaPrice: 35,  vooPrice: 0 },
  { code: 'BB_300',  name: '300 Mb Fibre',                              cat: 'Broadband', segment: 'B2C',
    list: 30,  promo: 22,  svr: 30,  promoMonths: 12, contractMonths: 24, etf: 144, install: 0,   kitSubsidy: 0,  activation: 35,
    cogs: 12, care: 3.2, baseAcq: 1180, baseChurn: 130, baseMig: 220, baseBase: 32_400,
    eAcq: -2.1, eChurn: 1.2, eMig: 1.5, movistarPrice: 32,  digiPrice: 28, vodaPrice: 30,  vooPrice: 0 },

  // ───── TV (REVTV) ──────────────────────────────────────────
  { code: 'TV_TOTAL',     name: 'REVTV (Sports package + Champions + ESPN)', cat: 'TV', segment: 'B2C',
    list: 35, promo: 25, svr: 35, promoMonths: 6, contractMonths: 24, etf: 84, install: 0, kitSubsidy: 0, activation: 0,
    cogs: 18, care: 2.8, baseAcq: 1240, baseChurn: 96, baseMig: 110, baseBase: 28_500,
    eAcq: -1.6, eChurn: 0.8, eMig: 1.1, movistarPrice: 0, digiPrice: 35, vodaPrice: 0, vooPrice: 0 },
  { code: 'TV_ESEN',      name: 'REVTV Start',               cat: 'TV', segment: 'B2C',
    list: 20, promo: 15, svr: 20, promoMonths: 6, contractMonths: 24, etf: 48, install: 0, kitSubsidy: 0, activation: 0,
    cogs: 9,  care: 2.4, baseAcq: 880,  baseChurn: 78, baseMig: 90,  baseBase: 18_200,
    eAcq: -1.5, eChurn: 0.9, eMig: 1.0, movistarPrice: 0, digiPrice: 22, vodaPrice: 0, vooPrice: 0 },
  { code: 'MOV_LIGA',    name: 'Sports add-on Sports package (add-on)',                  cat: 'TV', segment: 'B2C',
    list: 30, promo: 20, svr: 30, promoMonths: 3, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 22, care: 1.4, baseAcq: 620,  baseChurn: 88, baseMig: 0,   baseBase: 12_400,
    eAcq: -1.8, eChurn: 1.1, eMig: 0.9, movistarPrice: 0, digiPrice: 32, vodaPrice: 0, vooPrice: 0 },
  { code: 'ESPN_PACK',  name: 'Caribbean Sports package + ESPN',       cat: 'TV', segment: 'B2C',
    list: 20, promo: 12, svr: 20, promoMonths: 3, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 14, care: 1.2, baseAcq: 410,  baseChurn: 64, baseMig: 0,   baseBase: 7_800,
    eAcq: -1.7, eChurn: 1.0, eMig: 0.8, movistarPrice: 0, digiPrice: 22, vodaPrice: 0, vooPrice: 0 },
  { code: 'HBO_DSNY',    name: 'Max + Disney+',                   cat: 'TV', segment: 'B2C',
    list: 15, promo: 10, svr: 15, promoMonths: 3, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 10, care: 1.0, baseAcq: 380,  baseChurn: 52, baseMig: 0,   baseBase: 6_900,
    eAcq: -1.6, eChurn: 0.8, eMig: 0.9, movistarPrice: 0, digiPrice: 17, vodaPrice: 0, vooPrice: 0 },
  { code: 'KIDS_PACK',     name: 'Kids Pack',                                  cat: 'TV', segment: 'B2C',
    list: 8,  promo: 5,  svr: 8,  promoMonths: 3, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 4,  care: 0.6, baseAcq: 220,  baseChurn: 30, baseMig: 0,   baseBase: 4_200,
    eAcq: -1.4, eChurn: 0.7, eMig: 0.6, movistarPrice: 0, digiPrice: 9, vodaPrice: 0, vooPrice: 0 },
  { code: 'NETFLIX',       name: 'Netflix Standard (bolt-on)',                cat: 'TV', segment: 'B2C',
    list: 14, promo: 10, svr: 14, promoMonths: 3, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 11, care: 0.4, baseAcq: 540,  baseChurn: 48, baseMig: 0,   baseBase: 11_400,
    eAcq: -1.3, eChurn: 0.6, eMig: 0.5, movistarPrice: 0, digiPrice: 13, vodaPrice: 14, vooPrice: 0 },

  // ───── Mobile (aliv Mobile on Rival ISP C) ───────────────────────────────
  { code: 'MOB_UNL',  name: 'aliv Mobile Unlimited 5G+',  cat: 'Mobile', segment: 'B2C',
    list: 35, promo: 25, svr: 35, promoMonths: 6, contractMonths: 12, etf: 60, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 14, care: 2.0, baseAcq: 1640, baseChurn: 152, baseMig: 280, baseBase: 41_200,
    eAcq: -1.7, eChurn: 0.9, eMig: 1.2, movistarPrice: 30, digiPrice: 35, vodaPrice: 35, vooPrice: 30 },
  { code: 'MOB_150',  name: 'aliv Mobile 150GB 5G',      cat: 'Mobile', segment: 'B2C',
    list: 25, promo: 18, svr: 25, promoMonths: 6, contractMonths: 12, etf: 50, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 9,  care: 1.8, baseAcq: 2240, baseChurn: 218, baseMig: 320, baseBase: 52_400,
    eAcq: -1.8, eChurn: 1.0, eMig: 1.1, movistarPrice: 22, digiPrice: 25, vodaPrice: 25, vooPrice: 22 },
  { code: 'MOB_60',   name: 'aliv Mobile 60GB',          cat: 'Mobile', segment: 'B2C',
    list: 20, promo: 14, svr: 20, promoMonths: 6, contractMonths: 12, etf: 40, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 7,  care: 1.6, baseAcq: 1480, baseChurn: 184, baseMig: 240, baseBase: 36_800,
    eAcq: -1.9, eChurn: 1.1, eMig: 1.0, movistarPrice: 18, digiPrice: 20, vodaPrice: 20, vooPrice: 18 },
  { code: 'MOB_25',   name: 'aliv Mobile 25GB',          cat: 'Mobile', segment: 'B2C',
    list: 15, promo: 10, svr: 15, promoMonths: 6, contractMonths: 12, etf: 30, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 5,  care: 1.4, baseAcq: 980,  baseChurn: 142, baseMig: 180, baseBase: 22_400,
    eAcq: -2.0, eChurn: 1.2, eMig: 0.9, movistarPrice: 14, digiPrice: 15, vodaPrice: 15, vooPrice: 14 },
  { code: 'MOB_ROAM', name: 'US Roaming Pack (10GB)',        cat: 'Mobile', segment: 'B2C',
    list: 6,  promo: 5,  svr: 6,  promoMonths: 0, contractMonths: 0,  etf: 0,  install: 0, kitSubsidy: 0, activation: 0,
    cogs: 3,  care: 0.2, baseAcq: 320,  baseChurn: 24, baseMig: 0,   baseBase: 6_800,
    eAcq: -1.4, eChurn: 0.5, eMig: 0.4, movistarPrice: 6, digiPrice: 0, vodaPrice: 7, vooPrice: 5 },
  { code: 'MOB_FAMILY', name: 'Family Multi-SIM (4 lines)',  cat: 'Mobile', segment: 'B2C',
    list: 70, promo: 55, svr: 70, promoMonths: 6, contractMonths: 12, etf: 120, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 28, care: 3.2, baseAcq: 480,  baseChurn: 38, baseMig: 0,   baseBase: 9_400,
    eAcq: -1.5, eChurn: 0.8, eMig: 1.0, movistarPrice: 65, digiPrice: 70, vodaPrice: 75, vooPrice: 60 },

  // ───── Add-ons / CPE ──────────────────────────────────────────────────
  { code: 'WIFI_MESH', name: 'REV WiFi Booster (3-pack)',    cat: 'Add-on', segment: 'B2C',
    list: 8,  promo: 5,  svr: 8,  promoMonths: 6, contractMonths: 0, etf: 0, install: 0, kitSubsidy: 30, activation: 0,
    cogs: 2,  care: 0.4, baseAcq: 720,  baseChurn: 32, baseMig: 0,  baseBase: 14_800,
    eAcq: -1.0, eChurn: 0.4, eMig: 0.5, movistarPrice: 8, digiPrice: 0, vodaPrice: 9, vooPrice: 0 },
  { code: 'HOME_PHONE', name: 'Home Phone (unlimited)', cat: 'Add-on', segment: 'B2C',
    list: 10, promo: 7,  svr: 10, promoMonths: 6, contractMonths: 0, etf: 0, install: 0, kitSubsidy: 0,  activation: 0,
    cogs: 3,  care: 0.6, baseAcq: 290,  baseChurn: 64, baseMig: 0,  baseBase: 9_800,
    eAcq: -1.2, eChurn: 0.6, eMig: 0.4, movistarPrice: 9, digiPrice: 0, vodaPrice: 10, vooPrice: 0 },
  { code: 'STATIC_IP',  name: 'Static IP',                    cat: 'Add-on', segment: 'B2C',
    list: 5,  promo: 5,  svr: 5,  promoMonths: 0, contractMonths: 0, etf: 0, install: 0, kitSubsidy: 0, activation: 0,
    cogs: 1,  care: 0.2, baseAcq: 80,   baseChurn: 8,  baseMig: 0,  baseBase: 1_900,
    eAcq: -0.8, eChurn: 0.3, eMig: 0.2, movistarPrice: 5, digiPrice: 0, vodaPrice: 5, vooPrice: 0 },
  { code: 'SECURITY',   name: 'Cable Bahamas Home',          cat: 'Add-on', segment: 'B2C',
    list: 4,  promo: 3,  svr: 4,  promoMonths: 6, contractMonths: 0, etf: 0, install: 0, kitSubsidy: 0, activation: 0,
    cogs: 1,  care: 0.2, baseAcq: 410,  baseChurn: 38, baseMig: 0,  baseBase: 8_400,
    eAcq: -1.1, eChurn: 0.5, eMig: 0.3, movistarPrice: 5, digiPrice: 0, vodaPrice: 4, vooPrice: 0 },

  // ───── B2B / SOHO ─────────────────────────────────────────────────────
  { code: 'BIZ_BB',     name: 'Cable Bahamas Business Fibre 1 Gb',     cat: 'B2B', segment: 'SOHO',
    list: 95, promo: 75, svr: 95, promoMonths: 6, contractMonths: 24, etf: 360, install: 0, kitSubsidy: 0, activation: 50,
    cogs: 18, care: 6.0, baseAcq: 380,  baseChurn: 24, baseMig: 40,  baseBase: 8_400,
    eAcq: -1.0, eChurn: 0.4, eMig: 0.7, movistarPrice: 100, digiPrice: 0, vodaPrice: 95, vooPrice: 0 },
  { code: 'BIZ_MOB',    name: 'Business Mobile (per line)',  cat: 'B2B', segment: 'SOHO',
    list: 30, promo: 22, svr: 30, promoMonths: 6, contractMonths: 24, etf: 240, install: 0, kitSubsidy: 0, activation: 10,
    cogs: 11, care: 1.8, baseAcq: 880,  baseChurn: 56, baseMig: 0,   baseBase: 16_400,
    eAcq: -1.2, eChurn: 0.6, eMig: 0.8, movistarPrice: 28, digiPrice: 0, vodaPrice: 30, vooPrice: 26 },
  { code: 'BIZ_SIP',    name: 'REVConnect Net (SIP / Cloud Voice)',     cat: 'B2B', segment: 'SME',
    list: 60, promo: 48, svr: 60, promoMonths: 3, contractMonths: 36, etf: 720, install: 250, kitSubsidy: 0, activation: 80,
    cogs: 14, care: 4.4, baseAcq: 92,   baseChurn: 6,  baseMig: 0,   baseBase: 1_200,
    eAcq: -0.8, eChurn: 0.3, eMig: 0.4, movistarPrice: 65, digiPrice: 0, vodaPrice: 60, vooPrice: 0 },
  { code: 'BIZ_LL',     name: 'Dedicated Line 1 Gb (symmetric)',      cat: 'B2B', segment: 'SME',
    list: 450, promo: 380, svr: 450, promoMonths: 0, contractMonths: 36, etf: 5400, install: 1500, kitSubsidy: 0, activation: 200,
    cogs: 110, care: 28, baseAcq: 28,    baseChurn: 2,  baseMig: 0,   baseBase: 380,
    eAcq: -0.6, eChurn: 0.2, eMig: 0.3, movistarPrice: 460, digiPrice: 0, vodaPrice: 450, vooPrice: 0 },
  { code: 'BIZ_M365',   name: 'Microsoft 365 Business (per seat)', cat: 'B2B', segment: 'SOHO',
    list: 14, promo: 10, svr: 14, promoMonths: 3, contractMonths: 12, etf: 60, install: 0, kitSubsidy: 0, activation: 0,
    cogs: 8,  care: 0.8, baseAcq: 240,  baseChurn: 16, baseMig: 0,   baseBase: 4_800,
    eAcq: -0.9, eChurn: 0.4, eMig: 0.3, movistarPrice: 0, digiPrice: 0, vodaPrice: 0, vooPrice: 0 },
]

// ───── Bundles (multiplay SKUs) ─────────────────────────────────────────
type Bundle = { code: string; name: string; price: number; promoPrice: number; items: string[]; eAcq: number; eChurn: number; baseAcq: number; baseBase: number; cogs: number }
const bundles: Bundle[] = [
  { code: 'BUN_ONE_1G',     name: 'REVConnect 2P · 1 Gb + Unlimited 5G',     price: 80,  promoPrice: 60,  items: ['BB_1G','MOB_UNL'],            eAcq: -1.5, eChurn: 0.65, baseAcq: 1_280, baseBase: 24_400, cogs: 28 },
  { code: 'BUN_ONE_2G',     name: 'REVConnect 2P · 2 Gb + Unlimited 5G',     price: 90,  promoPrice: 70,  items: ['BB_2G','MOB_UNL'],            eAcq: -1.4, eChurn: 0.60, baseAcq: 720,   baseBase: 12_800, cogs: 31 },
  { code: 'BUN_BBTV_1G',    name: 'REVHome · 1 Gb + REVTV',           price: 75,  promoPrice: 60,  items: ['BB_1G','TV_TOTAL'],          eAcq: -1.5, eChurn: 0.70, baseAcq: 640,   baseBase: 11_200, cogs: 32 },
  { code: 'BUN_ONE_TOTAL',  name: 'REVConnect · 2 Gb + TV + 4 Mobile lines + Home Phone', price: 110, promoPrice: 80, items: ['BB_2G','TV_TOTAL','MOB_UNL','HOME_PHONE'], eAcq: -1.3, eChurn: 0.50, baseAcq: 380, baseBase: 6_400, cogs: 46 },
  { code: 'BUN_BIZ_3P',     name: 'Cable Bahamas Business 3P · Fibre + Mobile + M365', price: 110, promoPrice: 90, items: ['BIZ_BB','BIZ_MOB','BIZ_M365'], eAcq: -1.0, eChurn: 0.45, baseAcq: 180,   baseBase: 3_400, cogs: 38 },
]

// ───── Segment elasticity multipliers ───────────────────────────────────
type SegmentKey = {
  tenure: 'all' | 'lt6' | '6_12' | '13_24' | '25p'
  lifecycle: 'all' | Lifecycle
  zone: 'all' | 'fibre' | 'cable' | 'mvno'
  channel: 'all' | Channel
  value: 'all' | 'high' | 'mid' | 'low'
}
const tenureMult: Record<SegmentKey['tenure'], number> = { all: 1.0, lt6: 1.45, '6_12': 1.2, '13_24': 0.85, '25p': 0.55 }
const lifecycleMult: Record<SegmentKey['lifecycle'], number> = { all: 1.0, PROMO: 1.6, EOC: 1.85, SVR: 0.7, WINBACK: 1.4 }
const zoneMult: Record<SegmentKey['zone'], number> = { all: 1.0, fibre: 0.7, cable: 1.3, mvno: 1.5 }
const channelMult: Record<SegmentKey['channel'], number> = { all: 1.0, Digital: 1.15, Retail: 0.95, 'Save Desk': 0.6, D2D: 1.2, Partner: 1.0 }
const valueMult: Record<SegmentKey['value'], number> = { all: 1.0, high: 0.65, mid: 1.0, low: 1.4 }

// ===========================================================================
// CONFIG · the pricing-team's full lever set
// ===========================================================================
type Config = {
  productCode: string
  delta: number
  seg: SegmentKey
  // Tariff overrides (null = use catalog default for the selected SKU)
  ovList: number | null; ovPromo: number | null; ovSvr: number | null
  ovPromoMonths: number | null; ovContractMonths: number | null
  ovEtf: number | null; ovActivation: number | null; ovInstall: number | null; ovKitSubsidy: number | null
  // Cost overrides
  ovCogs: number | null; ovCare: number | null
  cac: number; badDebt: number
  // Elasticity overrides
  ovEAcq: number | null; ovEChurn: number | null; ovEMig: number | null
  logitBeta: number
  // Financial
  wacc: number; ltvHorizon: number; taxRate: number; terminalMult: number
  // Cockpit
  mcDraws: 250 | 1000 | 5000
  sigmaMult: number
  optObjective: 'EBITDA' | 'NPV' | 'Revenue' | 'Subs'
  // Segments
  cohortHorizon: 12 | 24 | 36 | 60
  saveOffer: 'none' | 'off3_6m' | 'off5_12m' | 'speed' | 'bundle'
  weibullK: number
  // Cross
  bundleAttachCoef: number
  cannibIncludeBundles: boolean
  // Compreg
  compAlpha: number; compLagWeeks: number
  cpiBase: number
  vulnerableShare: number; socialTariffCap: number
  nashIters: number
  // P&L
  forecastYears: 3 | 5 | 7 | 10
  churnCapPp: number; regCapPct: number; marginFloor: number
  cogsShock: number; cacShock: number; compMatchPct: number
  // Layout
  assumptionsOpen: boolean
  portfolioMode: boolean
  portfolioDeltas: Record<string, number>
}

const defaultConfig: Config = {
  productCode: 'BB_1G', delta: 0,
  seg: { tenure: 'all', lifecycle: 'all', zone: 'all', channel: 'all', value: 'all' },
  ovList: null, ovPromo: null, ovSvr: null, ovPromoMonths: null, ovContractMonths: null,
  ovEtf: null, ovActivation: null, ovInstall: null, ovKitSubsidy: null,
  ovCogs: null, ovCare: null, cac: 120, badDebt: 1.2,
  ovEAcq: null, ovEChurn: null, ovEMig: null, logitBeta: 0.04,
  wacc: 0.08, ltvHorizon: 60, taxRate: 0.125, terminalMult: 6,
  mcDraws: 1000, sigmaMult: 1.0, optObjective: 'EBITDA',
  cohortHorizon: 24, saveOffer: 'none', weibullK: 0.85,
  bundleAttachCoef: 0.4, cannibIncludeBundles: true,
  compAlpha: 0.5, compLagWeeks: 14, cpiBase: 2.5, vulnerableShare: 0.06, socialTariffCap: 25, nashIters: 25,
  forecastYears: 5, churnCapPp: 1.5, regCapPct: 7, marginFloor: 50,
  cogsShock: 0, cacShock: 0, compMatchPct: 50,
  assumptionsOpen: false, portfolioMode: false, portfolioDeltas: {},
}

const presets: Record<string, Partial<Config>> = {
  Default: {},
  'Aggressive growth': { delta: -8, cac: 180, compAlpha: 0.75, churnCapPp: 3, regCapPct: 10, marginFloor: 40, optObjective: 'Subs' },
  'Defensive back-book': { delta: 4, cac: 90, compAlpha: 0.25, churnCapPp: 1, regCapPct: 5, marginFloor: 60, optObjective: 'EBITDA', saveOffer: 'off5_12m' },
  'Reg-constrained': { delta: 2, cpiBase: 2.5, churnCapPp: 1.5, regCapPct: 3, vulnerableShare: 0.10, marginFloor: 55 },
  'High-volatility MC': { sigmaMult: 2, mcDraws: 5000 },
}

type Action =
  | { type: 'SET'; patch: Partial<Config> }
  | { type: 'RESET' }
  | { type: 'PRESET'; name: keyof typeof presets }
  | { type: 'SET_PORTFOLIO_DELTA'; code: string; delta: number }

function configReducer(state: Config, action: Action): Config {
  switch (action.type) {
    case 'SET': return { ...state, ...action.patch }
    case 'RESET': return { ...defaultConfig, productCode: state.productCode }
    case 'PRESET': return { ...state, ...presets[action.name] }
    case 'SET_PORTFOLIO_DELTA': return { ...state, portfolioDeltas: { ...state.portfolioDeltas, [action.code]: action.delta } }
    default: return state
  }
}

// ===========================================================================
// COMPONENT
// ===========================================================================
type SubTab = 'cockpit' | 'catalog' | 'segments' | 'cross' | 'compreg' | 'pnl' | 'elasticity' | 'margin'

// Bundles converted to product-shape so they flow through the same engine
const bundleAsProduct = (b: Bundle): Product => {
  const items = b.items.map((c) => products.find((x) => x.code === c)).filter(Boolean) as Product[]
  const careAvg = items.length ? items.reduce((a, x) => a + x.care, 0) : 6
  return {
    code: b.code, name: b.name, cat: 'Bundle', segment: b.code.startsWith('BUN_BIZ') ? 'SOHO' : 'B2C',
    list: b.price + 15, promo: b.promoPrice, svr: b.price, promoMonths: 12,
    contractMonths: 24, etf: Math.round(b.price * 2.4), install: 0, kitSubsidy: 0, activation: 35,
    cogs: b.cogs, care: careAvg, baseAcq: b.baseAcq, baseChurn: Math.round(b.baseAcq * 0.08),
    baseMig: Math.round(b.baseAcq * 0.18), baseBase: b.baseBase,
    eAcq: b.eAcq, eChurn: b.eChurn, eMig: 1.0,
    movistarPrice: Math.round(b.price * 1.05), digiPrice: Math.round(b.price * 0.98),
    vodaPrice: Math.round(b.price * 1.02), vooPrice: 0,
  }
}
const allSimSkus: Product[] = [...products, ...bundles.map(bundleAsProduct)]

const CAC_PER_ADD_DEFAULT = 120

export default function PricingSimulatorPage() {
  const [sub, setSub] = useState<SubTab>('cockpit')
  const [cfg, dispatch] = useReducer(configReducer, defaultConfig, (init) => {
    if (typeof window === 'undefined') return init
    try {
      const raw = localStorage.getItem('pricing-sim-config')
      if (raw) return { ...init, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return init
  })

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem('pricing-sim-config', JSON.stringify(cfg)) } catch { /* ignore */ }
  }, [cfg])

  // Convenience aliases
  const productCode = cfg.productCode
  const delta = cfg.delta
  const seg = cfg.seg
  const setSeg = (updater: (s: SegmentKey) => SegmentKey) => dispatch({ type: 'SET', patch: { seg: updater(cfg.seg) } })
  const setProductCode = (code: string) => dispatch({ type: 'SET', patch: { productCode: code, delta: 0, ovList: null, ovPromo: null, ovSvr: null, ovPromoMonths: null, ovContractMonths: null, ovEtf: null, ovActivation: null, ovInstall: null, ovKitSubsidy: null, ovCogs: null, ovCare: null, ovEAcq: null, ovEChurn: null, ovEMig: null } })
  const setDelta = (d: number) => dispatch({ type: 'SET', patch: { delta: d } })

  const baseProduct = allSimSkus.find((x) => x.code === productCode) || allSimSkus[0]
  // Apply overrides → effective product
  const p: Product = useMemo(() => ({
    ...baseProduct,
    list: cfg.ovList ?? baseProduct.list,
    promo: cfg.ovPromo ?? baseProduct.promo,
    svr: cfg.ovSvr ?? baseProduct.svr,
    promoMonths: cfg.ovPromoMonths ?? baseProduct.promoMonths,
    contractMonths: cfg.ovContractMonths ?? baseProduct.contractMonths,
    etf: cfg.ovEtf ?? baseProduct.etf,
    activation: cfg.ovActivation ?? baseProduct.activation,
    install: cfg.ovInstall ?? baseProduct.install,
    kitSubsidy: cfg.ovKitSubsidy ?? baseProduct.kitSubsidy,
    cogs: (cfg.ovCogs ?? baseProduct.cogs) * (1 + cfg.cogsShock / 100),
    care: cfg.ovCare ?? baseProduct.care,
    eAcq: cfg.ovEAcq ?? baseProduct.eAcq,
    eChurn: cfg.ovEChurn ?? baseProduct.eChurn,
    eMig: cfg.ovEMig ?? baseProduct.eMig,
  }), [baseProduct, cfg])

  const CAC_PER_ADD = cfg.cac * (1 + cfg.cacShock / 100)
  const newPrice = p.svr + delta
  const pctChange = (delta / p.svr) * 100

  // Segment elasticity multiplier (combines all dimensions)
  const segMult = tenureMult[seg.tenure] * lifecycleMult[seg.lifecycle] * zoneMult[seg.zone] * channelMult[seg.channel] * valueMult[seg.value]

  const acqImpact = pctChange * p.eAcq * segMult
  const churnImpact = pctChange * p.eChurn * segMult
  const migImpact = pctChange * p.eMig

  const acqVol   = Math.round(p.baseAcq   * (1 + acqImpact / 100))
  const churnVol = Math.round(p.baseChurn * (1 + churnImpact / 100))
  const migVol   = Math.round(p.baseMig   * (1 + migImpact / 100))
  const netSubs  = acqVol - churnVol + (delta < 0 ? migVol : -migVol)
  const realisedArpu = newPrice
  const contribMo = realisedArpu - p.cogs - p.care
  const contribPct = (contribMo / realisedArpu) * 100

  const annualRev = (p.baseBase + netSubs) * realisedArpu * 12
  const baselineRev = p.baseBase * p.svr * 12
  const revImpact = annualRev - baselineRev
  const ebitdaImpact = (p.baseBase + netSubs) * contribMo * 12 - p.baseBase * (p.svr - p.cogs - p.care) * 12

  // ─── Quant-grade math engine (memoised per config) ──────────
  const engine = useMemo(() => {
    const ltvVal = calcLtv(realisedArpu, p.cogs, p.care, p.eChurn * segMult, pctChange, cfg.ltvHorizon, cfg.wacc)
    const baselineLtv = calcLtv(p.svr, p.cogs, p.care, p.eChurn * segMult, 0, cfg.ltvHorizon, cfg.wacc)
    const payback = paybackMonths(realisedArpu, p.cogs, p.care, CAC_PER_ADD, p.eChurn * segMult, pctChange)
    const ltvCac = ltvVal / CAC_PER_ADD
    const effArpu = effectiveArpu(p.promo, p.svr, p.promoMonths, p.contractMonths)
    const yieldPct = (realisedArpu / p.list) * 100
    const survival = survivalCurve(36, pctChange, p.eChurn * segMult, cfg.weibullK)
    const survivalBase = survivalCurve(36, 0, p.eChurn * segMult, cfg.weibullK)
    const optimal = optimalPriceGrid(p, segMult, cfg.churnCapPp, cfg.regCapPct)
    const pnl5 = multiYearPnl(p, segMult, pctChange, cfg.forecastYears, cfg.wacc, CAC_PER_ADD)
    const mc = monteCarloEbitda({
      eAcq: p.eAcq, eChurn: p.eChurn, baseAcq: p.baseAcq, baseChurn: p.baseChurn,
      baseBase: p.baseBase, svr: p.svr, cogs: p.cogs, care: p.care,
      pctChange, segMult, sigmaMult: cfg.sigmaMult,
    }, cfg.mcDraws)
    const mcP10 = percentile(mc, 10)
    const mcP50 = percentile(mc, 50)
    const mcP90 = percentile(mc, 90)
    const mcHist = histogram(mc, 22)
    const mcPath = Array.from({ length: 12 }, (_, m) => {
      const monthly = mc.map((v) => (v / 12) * (m + 1))
      monthly.sort((a, b) => a - b)
      return {
        month: `M${m + 1}`,
        P10: percentile(monthly, 10) / 1e6,
        P50: percentile(monthly, 50) / 1e6,
        P90: percentile(monthly, 90) / 1e6,
      }
    })
    return { ltv: ltvVal, baselineLtv, payback, ltvCac, effArpu, yieldPct, survival, survivalBase, optimal, pnl5, mc, mcP10, mcP50, mcP90, mcHist, mcPath }
  }, [productCode, delta, segMult, p, realisedArpu, pctChange, cfg.ltvHorizon, cfg.wacc, cfg.weibullK, cfg.churnCapPp, cfg.regCapPct, cfg.forecastYears, CAC_PER_ADD, cfg.sigmaMult, cfg.mcDraws])

  // Demand curve
  const demand = Array.from({ length: 21 }, (_, i) => {
    const d = (i - 10) * 0.05
    const acqV = p.baseAcq * (1 + d * 100 * p.eAcq * segMult / 100)
    const churnV = p.baseChurn * (1 + d * 100 * p.eChurn * segMult / 100)
    const newP = p.svr * (1 + d)
    const margin = newP - p.cogs - p.care
    const ebV = (p.baseBase + (acqV - churnV)) * margin * 12 / 1e6
    const rev = (p.baseBase + (acqV - churnV)) * newP * 12 / 1e6
    return {
      pct: `${(d * 100).toFixed(0)}%`,
      pctNum: d * 100,
      Acquisition: Math.max(0, Math.round(acqV)),
      Churn: Math.max(0, Math.round(churnV)),
      'Revenue (BSD M)': +rev.toFixed(2),
      'EBITDA (BSD M)': +ebV.toFixed(2),
    }
  })

  // ────────────────────────────────────────────────────────────────────────
  const subTabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
    { id: 'cockpit',  label: 'Cockpit',                      icon: Gauge },
    { id: 'catalog',  label: 'Catalog & Tariff',             icon: Layers },
    { id: 'segments', label: 'Segments & Cohorts',           icon: Users },
    { id: 'cross',    label: 'Cross-elasticity',             icon: Network },
    { id: 'compreg',  label: 'Competitive & Regulatory',     icon: Shield },
    { id: 'pnl',      label: 'P&L & Sensitivity',            icon: BarChart3 },
    { id: 'elasticity', label: 'Elasticity Lab',               icon: FlaskConical },
    { id: 'margin',     label: 'Margin Bridge',                icon: Calculator },
  ]

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Pricing Simulator')}
        subtitle={tt('Portfolio-wide price elasticity · catalog · segments · cross-effects · competitive · P&L')}
        actions={
          <div className="flex items-center gap-2 bg-vfes-red/5 text-vfes-dark px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Use Case 1
          </div>
        }
      />

      <AgentDecision
        title="Price optimiser — elasticity-driven tier moves"
        label="Run Price Optimiser"
        runningLabel="Optimising…"
        steps={[
          'Estimated demand & elasticity per SKU from history',
          'Ran Monte-Carlo on EBITDA across price moves',
          'Found constrained optimum within churn guardrails',
          'Drafted tier moves + competitive-response plan',
        ]}
        hint="Optimiser respects churn & regulatory floors — EBITDA-maximising, not just revenue."
        result={{
          headline: 'Raise the 1Gb tier +BSD 2 and harvest the back-book',
          stats: [
            { label: 'Net Subscribers Δ', value: netSubs.toLocaleString() },
            { label: 'Realised ARPU', value: `BSD ${realisedArpu}` },
            { label: 'EBITDA Δ', value: `BSD ${(ebitdaImpact / 1e6).toFixed(2)}M` },
            { label: 'LTV / CAC', value: `${engine.ltvCac.toFixed(1)}×` },
          ],
          findings: [
            'Elasticity on the 1Gb tier is below 1 and the back-book sits well under front-book ARPU.',
            'A small front-book rise plus a back-book reprice lifts EBITDA with minimal churn.',
          ],
          note: '+BSD 1.4M/yr EBITDA at modelled elasticity',
        }}
        impact="+BSD 1.4M/yr EBITDA at modelled elasticity"
        risk="watch competitive response — stage the move"
        linkTo="#/portal/bundle-profitability"
        linkLabel="Open Bundle Profitability"
      />

      {/* ── Related cockpits ── */}
      <div className="flex flex-wrap gap-2 my-4 px-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 self-center">{tt('Related')}</span>
        <Link to="/portal/bundle-profitability" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Bundle Profitability')}</Link>
        <Link to="/portal/bundle-propensity" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Bundle Propensity')}</Link>
        <Link to="/portal/product" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Product')}</Link>
        <Link to="/portal/sales" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Sales')}</Link>
        <Link to="/portal/marketing" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Marketing')}</Link>
        <Link to="/portal/finance" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Finance')}</Link>
        <Link to="/portal/channel-dealers" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Channel & Dealers')}</Link>
        <Link to="/portal/churn-retention" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Churn & Retention')}</Link>
        <Link to="/portal/promotions" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Promotions')}</Link>
        <Link to="/portal/b2b" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('B2B')}</Link>
        <Link to="/portal/price-wargame" className="px-2.5 py-1 rounded bg-black/5 text-xs font-semibold hover:bg-vfes-red/10 text-vfes-dark/70">{tt('Price Wargame')}</Link>
      </div>
      <MlInsightSection
        heading={tt('Pricing ML')}
        models={[
          { name: tt('Price Elasticity'), metric: '\u22121.6β', sub: tt('XGBoost · 36-mo panel') },
          { name: tt('Churn Propensity'), metric: '18.4%', sub: tt('Logistic Regression') },
          { name: tt('LTV Forecast'), metric: '\u20ac1,240', sub: tt('24-mo · survival model') },
        ]}
        agentLabel={tt('Run Pricing ML Agent')}
        agentSteps={[
          'Loaded 36-month pricing panel from PRICING_EVENTS',
          'Estimated elasticity via diff-in-diff regression',
          'Scored churn propensity per segment × lifecycle',
          'Generated EBITDA-constrained optimal price recommendation',
        ]}
        agentBlurb={tt('3 Snowpark ML models trained on 36-month history. Refresh daily 03:00 UTC.')}
        decision={{
          title: tt('Raise BB_1G by \u20ac2 · harvest the back-book'),
          detail: tt('Elasticity sub-1 on 1Gb tier; back-book ARPU gap of \u20ac12 is recoverable with minimal churn.'),
          impact: tt('+\u20ac1.4M/yr EBITDA'),
          risk: tt('Monitor Rival ISP B response within 14 weeks.'),
          linkTo: '/portal/bundle-profitability',
          linkLabel: tt('Open Bundle Profitability'),
        }}
        chart={{
          kind: 'bar',
          title: tt('Churn propensity by lifecycle · %'),
          data: [
            { state: 'PROMO', propensity: 12 },
            { state: 'EOC', propensity: 22 },
            { state: 'SVR', propensity: 8 },
            { state: 'WINBACK', propensity: 18 },
          ],
          xKey: 'state',
          series: [{ key: 'propensity', name: tt('Churn %'), color: '#FF4438' }],
          unit: '%',
          note: tt('EoC is the highest-risk window. Prioritise retention outreach at M23\u2013M25.'),
          colorBy: { key: 'propensity', high: 20, mid: 14 },
        }}
      />

      {/* Global controls */}
      <Panel>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Product')}</div>
            <select value={productCode} onChange={(e) => setProductCode(e.target.value)}
              className="w-full bg-[#f3f4f7] border border-transparent rounded-lg px-3 py-3 text-sm font-semibold focus:outline-none focus:bg-white focus:border-vfes-red/40">
              {['Broadband', 'TV', 'Mobile', 'Add-on', 'B2B', 'Bundle'].map((cat) => (
                <optgroup key={cat} label={cat}>
                  {allSimSkus.filter((x) => x.cat === cat).map((x) => <option key={x.code} value={x.code}>{tt(x.name)} · BSD {x.svr}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Price change (Δ vs SVR · ±30%)')}</div>
            <input type="range" min={-Math.round(p.svr * 0.30)} max={Math.round(p.svr * 0.30)} step={1} value={delta} onChange={(e) => setDelta(parseInt(e.target.value))} className="w-full accent-vfes-red" />
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-vfes-dark">BSD {newPrice}</span>
              <span className={`text-sm font-bold mb-1 ${delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-vfes-dark/50'}`}>
                {delta > 0 ? '+' : ''}BSD {delta} ({pctChange.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-vfes-dark/55 font-semibold mb-2">{tt('Segment multiplier')}</div>
            <div className="text-3xl font-extrabold text-vfes-dark">{segMult.toFixed(2)}×</div>
            <div className="text-xs text-vfes-dark/55 mt-1">{tt('Tenure × Lifecycle × Zone × Channel × Value tier — set in Segments tab')}</div>
          </div>
        </div>

        {/* Preset / Reset / Export bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-black/5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mr-1">{tt('Preset')}</span>
          <select value="" onChange={(e) => { if (e.target.value) dispatch({ type: 'PRESET', name: e.target.value as keyof typeof presets }) }}
            className="bg-[#f3f4f7] border border-transparent rounded px-2 py-1.5 text-xs font-semibold">
            <option value="">{tt('— pick —')}</option>
            {Object.keys(presets).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={() => dispatch({ type: 'SET', patch: { assumptionsOpen: !cfg.assumptionsOpen } })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-vfes-red/5 text-vfes-dark hover:bg-vfes-red/10">
            <Settings className="w-3.5 h-3.5" /> Assumptions {cfg.assumptionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => dispatch({ type: 'SET', patch: { portfolioMode: !cfg.portfolioMode } })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest ${cfg.portfolioMode ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
            <Grid3x3 className="w-3.5 h-3.5" /> Portfolio mode
          </button>
          <button onClick={() => dispatch({ type: 'RESET' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-black/5 text-vfes-dark/70 hover:bg-black/10">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={() => {
            const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `pricing-scenario-${cfg.productCode}.json`; a.click()
            URL.revokeObjectURL(url)
          }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest bg-black/5 text-vfes-dark/70 hover:bg-black/10">
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <span className="ml-auto text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Auto-saved to localStorage')}</span>
        </div>

        {/* Assumptions drawer */}
        {cfg.assumptionsOpen && (
          <div className="mt-4 pt-4 border-t border-black/5 grid md:grid-cols-5 gap-5">
            {/* Tariff */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Tariff overrides')}</div>
              {[
                { k: 'ovList' as const, lbl: 'List BSD ', def: baseProduct.list },
                { k: 'ovPromo' as const, lbl: 'Promo BSD ', def: baseProduct.promo },
                { k: 'ovSvr' as const, lbl: 'SVR BSD ', def: baseProduct.svr },
                { k: 'ovPromoMonths' as const, lbl: 'Promo months', def: baseProduct.promoMonths },
                { k: 'ovContractMonths' as const, lbl: 'Contract months', def: baseProduct.contractMonths },
                { k: 'ovEtf' as const, lbl: 'ETF BSD ', def: baseProduct.etf },
                { k: 'ovActivation' as const, lbl: 'Activation BSD ', def: baseProduct.activation },
                { k: 'ovInstall' as const, lbl: 'Install BSD ', def: baseProduct.install },
                { k: 'ovKitSubsidy' as const, lbl: 'Kit subsidy BSD ', def: baseProduct.kitSubsidy },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" value={cfg[f.k] ?? f.def} onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: e.target.value === '' ? null : Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
            </div>

            {/* Cost */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Cost')}</div>
              {[
                { k: 'ovCogs' as const, lbl: 'COGS BSD /mo', def: baseProduct.cogs },
                { k: 'ovCare' as const, lbl: 'Care BSD /mo', def: baseProduct.care },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" value={cfg[f.k] ?? f.def} step="0.1" onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: e.target.value === '' ? null : Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('CAC BSD /add')}</span>
                <input type="number" value={cfg.cac} onChange={(e) => dispatch({ type: 'SET', patch: { cac: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Bad debt %')}</span>
                <input type="number" value={cfg.badDebt} step="0.1" onChange={(e) => dispatch({ type: 'SET', patch: { badDebt: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('COGS shock %')}</span>
                <input type="number" value={cfg.cogsShock} onChange={(e) => dispatch({ type: 'SET', patch: { cogsShock: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('CAC shock %')}</span>
                <input type="number" value={cfg.cacShock} onChange={(e) => dispatch({ type: 'SET', patch: { cacShock: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
            </div>

            {/* Elasticity */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Elasticity')}</div>
              {[
                { k: 'ovEAcq' as const, lbl: 'Acq β', def: baseProduct.eAcq },
                { k: 'ovEChurn' as const, lbl: 'Churn β', def: baseProduct.eChurn },
                { k: 'ovEMig' as const, lbl: 'Mig β', def: baseProduct.eMig },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between text-xs py-1">
                  <span className="text-vfes-dark/65">{f.lbl}</span>
                  <input type="number" value={cfg[f.k] ?? f.def} step="0.05" onChange={(e) => dispatch({ type: 'SET', patch: { [f.k]: e.target.value === '' ? null : Number(e.target.value) } as Partial<Config> })}
                    className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
                </div>
              ))}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Logit β')}</span>
                <input type="number" value={cfg.logitBeta} step="0.01" onChange={(e) => dispatch({ type: 'SET', patch: { logitBeta: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Weibull k')}</span>
                <input type="number" value={cfg.weibullK} step="0.05" onChange={(e) => dispatch({ type: 'SET', patch: { weibullK: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('σ multiplier')}</span>
                <input type="number" value={cfg.sigmaMult} step="0.25" onChange={(e) => dispatch({ type: 'SET', patch: { sigmaMult: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
            </div>

            {/* Financial */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Financial')}</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('WACC %')}</span>
                <input type="number" value={(cfg.wacc * 100).toFixed(1)} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { wacc: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('LTV horizon mo')}</span>
                <input type="number" value={cfg.ltvHorizon} onChange={(e) => dispatch({ type: 'SET', patch: { ltvHorizon: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Forecast yrs')}</span>
                <select value={cfg.forecastYears} onChange={(e) => dispatch({ type: 'SET', patch: { forecastYears: Number(e.target.value) as Config['forecastYears'] } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-1 py-0.5 font-semibold">
                  <option value={3}>3</option><option value={5}>5</option><option value={7}>7</option><option value={10}>10</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Tax %')}</span>
                <input type="number" value={(cfg.taxRate * 100).toFixed(1)} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { taxRate: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Term ×EBITDA')}</span>
                <input type="number" value={cfg.terminalMult} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { terminalMult: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('CPI base %')}</span>
                <input type="number" value={cfg.cpiBase} step="0.1" onChange={(e) => dispatch({ type: 'SET', patch: { cpiBase: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
            </div>

            {/* Constraints / Competition */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('Constraints & competition')}</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Churn cap pp')}</span>
                <input type="number" value={cfg.churnCapPp} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { churnCapPp: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('URCA cap %')}</span>
                <input type="number" value={cfg.regCapPct} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { regCapPct: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Margin floor %')}</span>
                <input type="number" value={cfg.marginFloor} step="1" onChange={(e) => dispatch({ type: 'SET', patch: { marginFloor: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Comp α')}</span>
                <input type="number" value={cfg.compAlpha} step="0.05" onChange={(e) => dispatch({ type: 'SET', patch: { compAlpha: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Comp lag wks')}</span>
                <input type="number" value={cfg.compLagWeeks} step="1" onChange={(e) => dispatch({ type: 'SET', patch: { compLagWeeks: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Vuln share %')}</span>
                <input type="number" value={(cfg.vulnerableShare * 100).toFixed(1)} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { vulnerableShare: Number(e.target.value) / 100 } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-vfes-dark/65">{tt('Social cap BSD ')}</span>
                <input type="number" value={cfg.socialTariffCap} onChange={(e) => dispatch({ type: 'SET', patch: { socialTariffCap: Number(e.target.value) } })}
                  className="w-16 text-right bg-[#f3f4f7] rounded px-2 py-0.5 font-semibold" />
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* Sub-tab nav */}
      <div className="flex flex-wrap gap-2 my-6">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition ${sub === id ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Per-tab config strip */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-2.5 rounded-lg bg-vfes-red/5 border border-vfes-red/15 text-xs">
        {sub === 'cockpit' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Cockpit knobs')}</span>
          <label className="flex items-center gap-1.5">MC draws
            <select value={cfg.mcDraws} onChange={(e) => dispatch({ type: 'SET', patch: { mcDraws: Number(e.target.value) as Config['mcDraws'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={250}>250</option><option value={1000}>1,000</option><option value={5000}>5,000</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">σ mult
            <select value={cfg.sigmaMult} onChange={(e) => dispatch({ type: 'SET', patch: { sigmaMult: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Objective
            <select value={cfg.optObjective} onChange={(e) => dispatch({ type: 'SET', patch: { optObjective: e.target.value as Config['optObjective'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="EBITDA">{tt('Max EBITDA')}</option><option value="NPV">{tt('Max NPV')}</option><option value="Revenue">{tt('Max Revenue')}</option><option value="Subs">{tt('Max Subs')}</option>
            </select>
          </label>
        </>)}
        {sub === 'segments' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Cohort knobs')}</span>
          <label className="flex items-center gap-1.5">Horizon
            <select value={cfg.cohortHorizon} onChange={(e) => dispatch({ type: 'SET', patch: { cohortHorizon: Number(e.target.value) as Config['cohortHorizon'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={12}>{tt('12 mo')}</option><option value={24}>{tt('24 mo')}</option><option value={36}>{tt('36 mo')}</option><option value={60}>{tt('60 mo')}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Save offer
            <select value={cfg.saveOffer} onChange={(e) => dispatch({ type: 'SET', patch: { saveOffer: e.target.value as Config['saveOffer'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value="none">{tt('None')}</option><option value="off3_6m">{tt('BSD 3 off 6m')}</option><option value="off5_12m">{tt('BSD 5 off 12m')}</option><option value="speed">{tt('Speed upgrade')}</option><option value="bundle">{tt('Bundle into REVConnect')}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Weibull k
            <input type="number" value={cfg.weibullK} step="0.05" onChange={(e) => dispatch({ type: 'SET', patch: { weibullK: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
        </>)}
        {sub === 'cross' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Cross-elasticity knobs')}</span>
          <label className="flex items-center gap-1.5">Logit β
            <select value={cfg.logitBeta} onChange={(e) => dispatch({ type: 'SET', patch: { logitBeta: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={0.02}>0.02</option><option value={0.04}>0.04</option><option value={0.06}>0.06</option><option value={0.08}>0.08</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Attach coef
            <select value={cfg.bundleAttachCoef} onChange={(e) => dispatch({ type: 'SET', patch: { bundleAttachCoef: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={0.2}>0.2</option><option value={0.4}>0.4</option><option value={0.6}>0.6</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={cfg.cannibIncludeBundles} onChange={(e) => dispatch({ type: 'SET', patch: { cannibIncludeBundles: e.target.checked } })} />{tt('Include bundles in cannibalisation')}</label>
        </>)}
        {sub === 'compreg' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('Comp/reg knobs')}</span>
          <label className="flex items-center gap-1.5">Comp α
            <input type="number" value={cfg.compAlpha} step="0.05" onChange={(e) => dispatch({ type: 'SET', patch: { compAlpha: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Lag wks
            <input type="number" value={cfg.compLagWeeks} onChange={(e) => dispatch({ type: 'SET', patch: { compLagWeeks: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-14" />
          </label>
          <label className="flex items-center gap-1.5">CPI %
            <input type="number" value={cfg.cpiBase} step="0.1" onChange={(e) => dispatch({ type: 'SET', patch: { cpiBase: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Vuln %
            <input type="number" value={(cfg.vulnerableShare * 100).toFixed(1)} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { vulnerableShare: Number(e.target.value) / 100 } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Social cap BSD 
            <input type="number" value={cfg.socialTariffCap} onChange={(e) => dispatch({ type: 'SET', patch: { socialTariffCap: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Nash iters
            <select value={cfg.nashIters} onChange={(e) => dispatch({ type: 'SET', patch: { nashIters: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </label>
        </>)}
        {sub === 'pnl' && (<>
          <span className="font-bold text-vfes-dark uppercase tracking-widest text-[10px]">{tt('P&L knobs')}</span>
          <label className="flex items-center gap-1.5">Forecast yrs
            <select value={cfg.forecastYears} onChange={(e) => dispatch({ type: 'SET', patch: { forecastYears: Number(e.target.value) as Config['forecastYears'] } })} className="bg-white rounded px-1.5 py-0.5 font-semibold">
              <option value={3}>3</option><option value={5}>5</option><option value={7}>7</option><option value={10}>10</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">Churn cap pp
            <input type="number" value={cfg.churnCapPp} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { churnCapPp: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Reg cap %
            <input type="number" value={cfg.regCapPct} step="0.5" onChange={(e) => dispatch({ type: 'SET', patch: { regCapPct: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Margin floor %
            <input type="number" value={cfg.marginFloor} onChange={(e) => dispatch({ type: 'SET', patch: { marginFloor: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">COGS shock %
            <input type="number" value={cfg.cogsShock} onChange={(e) => dispatch({ type: 'SET', patch: { cogsShock: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">CAC shock %
            <input type="number" value={cfg.cacShock} onChange={(e) => dispatch({ type: 'SET', patch: { cacShock: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
          <label className="flex items-center gap-1.5">Comp match %
            <input type="number" value={cfg.compMatchPct} onChange={(e) => dispatch({ type: 'SET', patch: { compMatchPct: Number(e.target.value) } })} className="bg-white rounded px-1.5 py-0.5 font-semibold w-16" />
          </label>
        </>)}
        {sub === 'catalog' && (
          <span className="text-vfes-dark/55 italic">{tt('Catalog tab — use Assumptions drawer for tariff overrides on the active SKU.')}</span>
        )}
        {sub === 'elasticity' && <span className="text-vfes-dark/55 italic">{tt('Elasticity Lab — per-segment β values and price-ladder volume impact.')}</span>}
        {sub === 'margin' && <span className="text-vfes-dark/55 italic">{tt('Margin Bridge — ARPU → true contribution waterfall for the active SKU.')}</span>}
      </div>

      {/* Portfolio mode panel */}
      {cfg.portfolioMode && (
        <Panel title={tt('Mobile plan tiers — Cable Bahamas vs BTC · Rival ISP A · Rival ISP B')} action={<span className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark bg-vfes-red/10 rounded px-2 py-1 flex items-center gap-1"><Smartphone className="w-3 h-3" />{tt('5G SA · all tiers')}</span>}>
          <table className="w-full text-sm mb-4">
            <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
              <tr><th className="py-1.5">{tt('Tier')}</th><th>{tt('Data')}</th><th>{tt('Voice')}</th><th>{tt('Cable Bahamas')}</th><th>{tt('BTC')}</th><th>{tt('Rival ISP A')}</th><th>{tt('Rival ISP B')}</th><th>{tt('Active base')}</th></tr>
            </thead>
            <tbody>
              {MOBILE_PLAN_TIERS.map((p) => (
                <tr key={p.tier} className="border-t border-black/5">
                  <td className="py-2 font-bold text-vfes-dark">{p.tier}</td>
                  <td className="text-xs text-vfes-dark/65">{p.data}</td>
                  <td className="text-xs text-vfes-dark/65">{tt(p.voice)}</td>
                  <td className="font-mono text-xs font-bold">BSD {p.priceVfes.toFixed(2)}</td>
                  <td className="font-mono text-xs">BSD {p.priceBTC.toFixed(2)}</td>
                  <td className="font-mono text-xs">BSD {p.priceBenchmarkA.toFixed(2)}</td>
                  <td className="font-mono text-xs">BSD {p.priceBenchmarkC.toFixed(2)}</td>
                  <td className="font-mono text-xs">{(p.base / 1e6).toFixed(2)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-vfes-dark/65">{tt('Cable Bahamas is priced 7–13% below BTC across all tiers, on par with Rival ISP A, and at a small premium to Rival ISP B — defensible price-elasticity ladder.')}</div>
        </Panel>
      )}

      {cfg.portfolioMode && (
        <Panel title={tt('Portfolio mode · per-SKU Δp simulation')}>
          <div className="text-xs text-vfes-dark/65 mb-3">{tt('Set Δp simultaneously across the broadband ladder, mobile ladder and TV. Aggregate EBITDA / Rev / churn flow into the cockpit when active.')}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {['BB_10G','BB_2G','BB_1G','BB_600','BB_300','MOB_UNL','MOB_150','MOB_60','TV_TOTAL','TV_ESEN'].map((code) => {
              const sku = allSimSkus.find((x) => x.code === code)
              if (!sku) return null
              const d = cfg.portfolioDeltas[code] ?? 0
              const newP = sku.svr + d
              return (
                <div key={code} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="font-semibold text-xs">{code}</div>
                  <div className="text-[10px] text-vfes-dark/55 mb-1">SVR BSD {sku.svr} · new BSD {newP}</div>
                  <input type="range" min={-Math.round(sku.svr * 0.30)} max={Math.round(sku.svr * 0.30)} step={1} value={d} onChange={(e) => dispatch({ type: 'SET_PORTFOLIO_DELTA', code, delta: parseInt(e.target.value) })} className="w-full accent-vfes-red" />
                  <div className="text-[10px] mt-1 font-bold" style={{ color: d > 0 ? '#dc2626' : d < 0 ? '#059669' : '#94a3b8' }}>{d > 0 ? '+' : ''}BSD {d}</div>
                </div>
              )
            })}
          </div>
          {/* Aggregate KPIs */}
          {(() => {
            let aggRev = 0, aggEbitda = 0, aggNet = 0
            ;['BB_10G','BB_2G','BB_1G','BB_600','BB_300','MOB_UNL','MOB_150','MOB_60','TV_TOTAL','TV_ESEN'].forEach((code) => {
              const sku = allSimSkus.find((x) => x.code === code); if (!sku) return
              const d = cfg.portfolioDeltas[code] ?? 0
              const pc = (d / sku.svr) * 100
              const acq = sku.baseAcq * (1 + pc * sku.eAcq / 100)
              const ch = sku.baseChurn * (1 + pc * sku.eChurn / 100)
              const ns = acq - ch
              const newP = sku.svr + d
              const margin = newP - sku.cogs - sku.care
              aggRev += (sku.baseBase + ns) * newP * 12
              aggEbitda += (sku.baseBase + ns) * margin * 12 - sku.baseBase * (sku.svr - sku.cogs - sku.care) * 12
              aggNet += ns
            })
            return (
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <KpiCard label={tt('Portfolio Net Subs Δ')} value={Math.round(aggNet).toLocaleString()} delta="across 10 SKUs" icon={Users} />
                <KpiCard label={tt('Portfolio Revenue')} value={`BSD ${(aggRev/1e6).toFixed(2)}M`} delta="annualised" icon={TrendingUp} />
                <KpiCard label={tt('Portfolio EBITDA Δ')} value={`BSD ${(aggEbitda/1e6).toFixed(2)}M`} delta="vs status quo" trend={aggEbitda > 0 ? 'up' : 'down'} icon={Coins} accent />
              </div>
            )
          })()}
        </Panel>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          COCKPIT
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'cockpit' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('Net Subscribers Δ')} value={netSubs.toLocaleString()} delta={`base ${(p.baseAcq - p.baseChurn).toLocaleString()}`} trend={netSubs > p.baseAcq - p.baseChurn ? 'up' : 'down'} icon={Users} accent />
          <KpiCard label={tt('Realised ARPU')} value={`BSD ${realisedArpu}`} delta={`SVR BSD ${p.svr}`} trend={realisedArpu >= p.svr ? 'up' : 'down'} icon={Coins} />
          <KpiCard label={tt('Contribution / mo')} value={`BSD ${contribMo.toFixed(0)}`} delta={`${contribPct.toFixed(0)}% margin`} trend={contribPct > 50 ? 'up' : 'down'} icon={Target} />
          <KpiCard label={tt('Annual Revenue Δ')} value={`BSD ${(revImpact / 1e6).toFixed(2)}M`} delta="12-mo forecast" trend={revImpact > 0 ? 'up' : 'down'} icon={TrendingUp} />
          <KpiCard label={tt('EBITDA Δ')} value={`BSD ${(ebitdaImpact / 1e6).toFixed(2)}M`} delta="net of cogs + care" trend={ebitdaImpact > 0 ? 'up' : 'down'} icon={Sparkles} />
        </div>

        {/* Unit economics row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label={tt('LTV (60-mo, 8% disc)')} value={`BSD ${engine.ltv.toFixed(0)}`} delta={`base BSD ${engine.baselineLtv.toFixed(0)}`} trend={engine.ltv > engine.baselineLtv ? 'up' : 'down'} icon={Heart} />
          <KpiCard label={tt('CAC (channel-blended)')} value={`BSD ${CAC_PER_ADD}`} delta="acq cost / net add" icon={Coins} />
          <KpiCard label={tt('Payback period')} value={engine.payback < 999 ? `${engine.payback} mo` : '—'} delta="discounted contribution" trend={engine.payback < 24 ? 'up' : 'down'} icon={Clock} />
          <KpiCard label={tt('LTV / CAC ratio')} value={`${engine.ltvCac.toFixed(1)}×`} delta={engine.ltvCac >= 3 ? 'healthy ≥ 3×' : 'below 3×'} trend={engine.ltvCac >= 3 ? 'up' : 'down'} icon={Scale} accent />
          <KpiCard label={tt('Optimal Δp (unconstrained)')} value={`${engine.optimal.unconstrained.dPct > 0 ? '+' : ''}${engine.optimal.unconstrained.dPct}%`} delta={`peak EBITDA BSD ${(engine.optimal.unconstrained.ebitda/1e6).toFixed(2)}M`} icon={Calculator} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Demand curve · acquisition vs churn vs revenue · optimal-price marker')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={demand}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="pct" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="L" stroke="#999" fontSize={11} />
                    <YAxis yAxisId="R" orientation="right" stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="L" type="monotone" dataKey="Acquisition" stroke="#222128" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="L" type="monotone" dataKey="Churn" stroke="#FF8585" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                    <Line yAxisId="R" type="monotone" dataKey="Revenue (BSD M)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="R" type="monotone" dataKey="EBITDA (BSD M)" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                    <ReferenceLine yAxisId="L" x={`${pctChange.toFixed(0)}%`} stroke="#222128" strokeDasharray="4 4" label={{ value: 'Current', fontSize: 10, fill: '#FF4438' }} />
                    <ReferenceLine yAxisId="L" x={`${engine.optimal.unconstrained.dPct}%`} stroke="#10b981" strokeDasharray="2 2" label={{ value: 'Optimum', fontSize: 10, fill: '#10b981' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">3 Snowpark ML regressions · {p.code} · seg×{segMult.toFixed(2)} · model v3.4 · grid-search Δp ∈ [−30%, +30%]</div>
            </Panel>
          </div>

          <Panel title={tt('Monte Carlo · 12-mo EBITDA fan (1,000 draws)')}>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={engine.mcPath}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} unit="M" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="P90" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="P50" stroke="#222128" fill="#FF4438" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="P10" stroke="#94a3b8" fill="#fff" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs space-y-0.5">
              <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('P10')}</span><b>BSD {(engine.mcP10/1e6).toFixed(2)}M</b></div>
              <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('P50 (median)')}</span><b className="text-vfes-dark">BSD {(engine.mcP50/1e6).toFixed(2)}M</b></div>
              <div className="flex justify-between"><span className="text-vfes-dark/55">{tt('P90')}</span><b>BSD {(engine.mcP90/1e6).toFixed(2)}M</b></div>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Constrained optimum')}>
            <div className="space-y-3 text-xs">
              {[
                { lbl: 'Unconstrained', d: engine.optimal.unconstrained, color: 'bg-emerald-100 text-emerald-800' },
                { lbl: 'Churn ≤ +1.5pp', d: engine.optimal.churnConstrained, color: 'bg-amber-100 text-amber-800' },
                { lbl: 'URCA cap (±7%)', d: engine.optimal.regConstrained, color: 'bg-sky-100 text-sky-800' },
              ].map((x) => (
                <div key={x.lbl} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{x.lbl}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${x.color}`}>Δp {x.d.dPct > 0 ? '+' : ''}{x.d.dPct}%</span>
                  </div>
                  <div className="text-vfes-dark/65">EBITDA <b className="text-vfes-dark">BSD {(x.d.ebitda/1e6).toFixed(2)}M</b> · Rev BSD {(x.d.rev/1e6).toFixed(2)}M · churn {x.d.churn >= 0 ? '+' : ''}{x.d.churn.toFixed(1)}pp</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={tt('Elasticity — Acq · Churn · Migration')}>
            <div className="space-y-4">
              {[
                { lbl: 'Acquisition (β)', v: p.eAcq, max: 2.5, color: 'bg-vfes-red' },
                { lbl: 'Churn (β)',       v: p.eChurn, max: 2.5, color: 'bg-vfes-red-light' },
                { lbl: 'Migration (β)',   v: p.eMig, max: 2.5, color: 'bg-vfes-red-dark' },
              ].map((r) => (
                <div key={r.lbl}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{r.lbl}</span>
                    <span className="font-bold text-vfes-dark">{r.v}</span>
                  </div>
                  <div className="h-2 bg-[#f3f4f7] rounded-full overflow-hidden">
                    <div className={`h-full ${r.color}`} style={{ width: `${(Math.abs(r.v) / r.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 rounded-lg bg-[#fafbfc] border border-black/5 text-xs text-vfes-dark/65">
              <Wifi className="w-3.5 h-3.5 inline mr-1 text-vfes-dark" />
              Effective with current segment: <b className="text-vfes-dark">{(p.eAcq * segMult).toFixed(2)}</b> acq · <b className="text-vfes-dark">{(p.eChurn * segMult).toFixed(2)}</b> churn
            </div>
          </Panel>

          <Panel title={tt('Scenario A vs B')} action={<GitCompare className="w-4 h-4 text-vfes-dark" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-2">{tt('A — Status quo')}</div>
                <div className="text-xl font-extrabold">BSD {p.svr}</div>
                <div className="text-xs text-vfes-dark/55 mt-2">Net {(p.baseAcq - p.baseChurn).toLocaleString()}</div>
                <div className="text-xs text-vfes-dark/55">Rev BSD {(baselineRev/1e6).toFixed(1)}M</div>
                <div className="text-xs text-vfes-dark/55">LTV BSD {engine.baselineLtv.toFixed(0)}</div>
              </div>
              <div className="p-3 rounded-lg bg-vfes-red/5 border border-vfes-red/30">
                <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark mb-2">{tt('B — Proposed')}</div>
                <div className="text-xl font-extrabold text-vfes-dark">BSD {newPrice}</div>
                <div className="text-xs text-vfes-dark/55 mt-2">Net {netSubs.toLocaleString()}</div>
                <div className="text-xs text-vfes-dark/55">Rev BSD {(annualRev/1e6).toFixed(1)}M</div>
                <div className="text-xs text-vfes-dark/55">LTV BSD {engine.ltv.toFixed(0)}</div>
              </div>
            </div>
            <button className="mt-3 w-full bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
              <Play className="w-4 h-4" /> Run full simulation
            </button>
          </Panel>
        </div>

        <Panel title={tt('Snowflake Intelligence — Ask the data')}>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              `Acquisition elasticity for ${tt(p.name)} in fibre areas, last 8 quarters?`,
              `If we raise ${p.code} by BSD 3, projected Y1 EBITDA Δ for high-tenure cohort?`,
              `Cross-elasticity: ${p.code} → REVConnect 2P bundle migration probability`,
              `Churn risk vs BTC benchmark at proposed BSD ${newPrice}, 24-mo CLV view`,
            ].map((q) => (
              <button key={q} className="text-left p-3 rounded-lg bg-[#fafbfc] border border-black/5 hover:border-vfes-red/30 transition flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                <span className="flex-1">{q}</span>
              </button>
            ))}
          </div>
        </Panel>
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          CATALOG & TARIFF
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'catalog' && (() => {
        // Front-book vs back-book by category
        const fbBb = ['Broadband','TV','Mobile','Add-on','B2B'].map((cat) => {
          const skus = products.filter((x) => x.cat === cat)
          const fb = skus.reduce((a, x) => a + x.promo, 0) / Math.max(1, skus.length)
          const bb = skus.reduce((a, x) => a + x.svr, 0) / Math.max(1, skus.length)
          return { cat, 'Front-book (BSD )': +fb.toFixed(0), 'Back-book (BSD )': +bb.toFixed(0), Gap: +(bb - fb).toFixed(0) }
        })
        // Promo amortisation curve (effective ARPU by month over contract)
        const amortCurve = Array.from({ length: Math.max(p.contractMonths, 24) }, (_, i) => {
          const m = i + 1
          const inPromo = m <= p.promoMonths
          const headline = inPromo ? p.promo : p.svr
          const cumPromo = Math.min(m, p.promoMonths) * p.promo
          const cumSvr = Math.max(0, m - p.promoMonths) * p.svr
          const effective = (cumPromo + cumSvr) / m
          return { month: `M${m}`, Headline: headline, 'Effective ARPU': +effective.toFixed(1) }
        })
        // Take-rate matrix (Channel × Lifecycle) — share of new acq
        const takeRate = ['Digital','Retail','Save Desk','D2D','Partner'].map((c) => ({
          channel: c,
          PROMO: Math.round(40 + (channelMult[c as Channel] - 1) * 30 + scenarioRandom() * 5),
          EOC: Math.round(30 + (channelMult[c as Channel] - 1) * 20),
          SVR: Math.round(20 + (channelMult[c as Channel] - 1) * 10),
          WINBACK: Math.round(10 + (channelMult[c as Channel] - 1) * 5),
        }))
        return (<>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('SKUs in catalog')} value={allSimSkus.length} delta={`${products.length} units · ${bundles.length} bundles`} icon={Package} />
          <KpiCard label={tt('B2C SKUs')} value={products.filter(x => x.segment === 'B2C').length} delta="Residential" icon={Users} />
          <KpiCard label={tt('B2B SKUs')} value={products.filter(x => x.segment !== 'B2C').length} delta="SOHO + SME" icon={Briefcase} />
          <KpiCard label={tt('Active subs (catalog)')} value={products.reduce((a,b) => a+b.baseBase, 0).toLocaleString()} delta="all SKUs" icon={Activity} />
        </div>

        <Panel title={tt('Full tariff table — list / promo / SVR / effective ARPU / yield / margin / LTV')}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                <tr>
                  <th className="py-2 px-2">{tt('Product')}</th>
                  <th>{tt('Cat')}</th><th>{tt('Seg')}</th>
                  <th className="text-right">{tt('List')}</th>
                  <th className="text-right">{tt('Promo')}</th>
                  <th className="text-right">{tt('SVR')}</th>
                  <th className="text-right">{tt('Eff. ARPU')}</th>
                  <th className="text-right">{tt('FB↔BB gap')}</th>
                  <th className="text-right">{tt('Yield')}</th>
                  <th className="text-right">{tt('ETF')}</th>
                  <th className="text-right">{tt('COGS')}</th>
                  <th className="text-right">{tt('Margin')}</th>
                  <th className="text-right">{tt('LTV (60m)')}</th>
                </tr>
              </thead>
              <tbody>
                {allSimSkus.map((x) => {
                  const eff = effectiveArpu(x.promo, x.svr, x.promoMonths, x.contractMonths)
                  const gap = x.svr - x.promo
                  const yld = (x.svr / x.list) * 100
                  const margin = x.svr - x.cogs - x.care
                  const marginPct = (margin / x.svr) * 100
                  const skuLtv = calcLtv(x.svr, x.cogs, x.care, x.eChurn, 0, 60, 0.08)
                  return (
                    <tr key={x.code} className={`border-t border-black/5 ${x.code === productCode ? 'bg-vfes-red/5' : ''}`}>
                      <td className="py-2 px-2 font-semibold">{tt(x.name)}</td>
                      <td className="text-vfes-dark/60">{x.cat}</td>
                      <td className="text-vfes-dark/60">{x.segment}</td>
                      <td className="text-right">BSD {x.list}</td>
                      <td className="text-right text-emerald-700 font-semibold">BSD {x.promo}</td>
                      <td className="text-right font-semibold">BSD {x.svr}</td>
                      <td className="text-right">BSD {eff.toFixed(1)}</td>
                      <td className="text-right text-amber-700">BSD {gap}</td>
                      <td className="text-right">{yld.toFixed(0)}%</td>
                      <td className="text-right">BSD {x.etf}</td>
                      <td className="text-right text-red-600">BSD {x.cogs}</td>
                      <td className="text-right font-bold text-vfes-dark">BSD {margin.toFixed(0)} <span className="text-vfes-dark/50 font-normal">({marginPct.toFixed(0)}%)</span></td>
                      <td className="text-right font-semibold">BSD {skuLtv.toFixed(0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Front-book vs Back-book ARPU bridge')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={fbBb}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="cat" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} unit="BSD " />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Front-book (BSD )" fill="#94a3b8" radius={[4,4,0,0]} />
                  <Bar dataKey="Back-book (BSD )" fill="#FF4438" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Backbook-to-frontbook gap = migration upside per cohort')}</div>
          </Panel>

          <Panel title={`Promo amortisation · ${p.code} · headline vs effective ARPU`}>
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={amortCurve}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={11} unit="BSD " />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Headline" fill="#FF8585" />
                  <Line type="monotone" dataKey="Effective ARPU" stroke="#222128" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">IFRS-15 / ASC-606 spread · contract {p.contractMonths}m · promo {p.promoMonths}m</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Bundle catalog (multiplay SKUs)')}>
            <table className="w-full text-xs">
              <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                <tr><th className="py-2">{tt('Bundle')}</th><th className="text-right">{tt('Promo')}</th><th className="text-right">{tt('SVR')}</th><th className="text-right">{tt('COGS')}</th><th className="text-right">{tt('Margin')}</th><th className="text-right">{tt('Subs')}</th></tr>
              </thead>
              <tbody>
                {bundles.map((b) => {
                  const m = b.price - b.cogs
                  return (
                    <tr key={b.code} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{tt(b.name)}<div className="text-[10px] text-vfes-dark/45">{b.items.join(' + ')}</div></td>
                      <td className="text-right text-emerald-700 font-semibold">BSD {b.promoPrice}</td>
                      <td className="text-right font-semibold">BSD {b.price}</td>
                      <td className="text-right text-red-600">BSD {b.cogs}</td>
                      <td className="text-right font-bold text-vfes-dark">BSD {m}</td>
                      <td className="text-right">{b.baseBase.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title={tt('Take-rate matrix · Channel × Lifecycle (% of new acq)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th className="py-1.5 text-left">{tt('Channel ↓ / Lifecycle →')}</th>{(['PROMO','EOC','SVR','WINBACK'] as const).map(l => <th key={l} className="px-2">{l}</th>)}</tr></thead>
                <tbody>
                  {takeRate.map((row) => (
                    <tr key={row.channel} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{row.channel}</td>
                      {(['PROMO','EOC','SVR','WINBACK'] as const).map((l) => {
                        const v = row[l]
                        const sat = Math.min(1, v / 60)
                        return <td key={l} className="px-2 py-2 text-center font-bold" style={{ background: `rgba(225,10,10,${sat})`, color: sat > 0.5 ? '#fff' : '#111' }}>{v}%</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Price waterfall — list → realised')}>
          <div className="space-y-3 mt-2">
            {[
              { lbl: 'List price', v: p.list, color: 'bg-vfes-dark/30' },
              { lbl: `Promo discount (months 1–${p.promoMonths})`, v: -(p.list - p.promo), color: 'bg-amber-300' },
              { lbl: 'Loyalty discount (avg)', v: -2, color: 'bg-amber-400' },
              { lbl: 'Save-desk discount (avg)', v: -3, color: 'bg-amber-500' },
              { lbl: 'Realised ARPU (blended)', v: p.list - (p.list - p.promo) - 5, color: 'bg-vfes-red' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-xs w-56 text-vfes-dark/70">{r.lbl}</div>
                <div className="flex-1 h-6 bg-[#f3f4f7] rounded relative">
                  <div className={`h-full ${r.color} rounded`} style={{ width: `${Math.min(100, Math.abs(r.v) / p.list * 100)}%` }} />
                  <span className="absolute right-2 top-0.5 text-xs font-bold text-vfes-dark">{r.v < 0 ? '−' : ''}BSD {Math.abs(r.v)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Front-book vs back-book separated · realised = list − promo − loyalty − retention')}</div>
        </Panel>
        </>)
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          SEGMENTS & COHORTS
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'segments' && (() => {
        // Survival overlay (with Δp vs without)
        const survBase = engine.survivalBase.map((r, i) => ({
          t: r.t, 'S(t) baseline': +(r.S * 100).toFixed(1), 'S(t) at Δp': +(engine.survival[i].S * 100).toFixed(1), 'Hazard h(t)': +(engine.survival[i].h * 100).toFixed(2),
        }))
        // Propensity scores (heuristic: combine multipliers)
        const churnProp = Math.min(99, Math.round(8 * tenureMult[seg.tenure] * lifecycleMult[seg.lifecycle] * channelMult[seg.channel] * valueMult[seg.value]))
        const upgradeProp = Math.min(99, Math.round(22 * (2 - valueMult[seg.value]) * tenureMult[seg.tenure]))
        const downsellProp = Math.min(99, Math.round(15 * valueMult[seg.value] * lifecycleMult[seg.lifecycle]))
        const winbackProp = Math.min(99, Math.round(28 * (seg.lifecycle === 'WINBACK' ? 2 : 1) * valueMult[seg.value]))
        // Save-rate by segment (channel proxy)
        const saveRate = ['Digital','Retail','Save Desk','D2D','Partner'].map((c) => ({
          channel: c,
          'No offer': Math.round(15 * channelMult[c as Channel]),
          'BSD 3 off 6m': Math.round(36 * channelMult[c as Channel]),
          'BSD 5 off 12m': Math.round(54 * channelMult[c as Channel]),
          'Bundle': Math.round(64 * channelMult[c as Channel]),
        }))
        // Cohort revenue retention
        const cohort = Array.from({ length: 24 }, (_, i) => {
          const m = i + 1
          const ret = engine.survival[Math.min(35, m - 1)]?.S || 0.6
          const arpuMult = m <= p.promoMonths ? p.promo / p.svr : 1
          return { m: `M${m}`, 'Net Revenue Retention': +(ret * arpuMult * 100).toFixed(1) }
        })
        return (<>
        <Panel title={tt('Segment filters')}>
          <div className="grid md:grid-cols-5 gap-4">
            {([
              { k: 'tenure',    lbl: 'Tenure',    opts: ['all','lt6','6_12','13_24','25p'] as const, labels: { all:'All', lt6:'<6 mo', '6_12':'6–12', '13_24':'13–24', '25p':'25+ mo' } as Record<string,string> },
              { k: 'lifecycle', lbl: 'Lifecycle', opts: ['all','PROMO','EOC','SVR','WINBACK'] as const, labels: { all:'All', PROMO:'In promo', EOC:'EoC', SVR:'On SVR', WINBACK:'Win-back' } as Record<string,string> },
              { k: 'zone',      lbl: 'Geo / network', opts: ['all','fibre','cable','mvno'] as const, labels: { all:'All', fibre:'Fibre', cable:'Cable', mvno:'MVNO-only' } as Record<string,string> },
              { k: 'channel',   lbl: 'Channel',   opts: ['all','Digital','Retail','Save Desk','D2D','Partner'] as const, labels: {} as Record<string,string> },
              { k: 'value',     lbl: 'Value tier', opts: ['all','high','mid','low'] as const, labels: { all:'All', high:'High CLV', mid:'Mid', low:'Low / at-risk' } as Record<string,string> },
            ] as const).map((f) => (
              <div key={f.k}>
                <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{f.lbl}</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.opts.map((o) => (
                    <button key={o} onClick={() => setSeg((s) => ({ ...s, [f.k]: o } as SegmentKey))}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border ${(seg as Record<string,string>)[f.k] === o ? 'bg-vfes-red text-vfes-dark border-vfes-red' : 'bg-[#f3f4f7] border-transparent hover:border-vfes-red/30'}`}>
                      {f.labels[o] || o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-vfes-red/5 border border-vfes-red/20 text-xs">
            Combined segment elasticity multiplier: <b className="text-vfes-dark text-base">{segMult.toFixed(2)}×</b>
            <span className="text-vfes-dark/55 ml-2">→ effective acq elasticity {(p.eAcq*segMult).toFixed(2)}, churn {(p.eChurn*segMult).toFixed(2)}</span>
          </div>
        </Panel>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <KpiCard label={tt('Tenure × Lifecycle')} value={`${tenureMult[seg.tenure].toFixed(2)} × ${lifecycleMult[seg.lifecycle].toFixed(2)}`} delta="EoC = highest sensitivity" icon={Activity} />
          <KpiCard label={tt('Geo zone')} value={`${zoneMult[seg.zone].toFixed(2)}×`} delta="fibre most loyal" icon={Globe} />
          <KpiCard label={tt('Channel')} value={`${channelMult[seg.channel].toFixed(2)}×`} delta="save-desk most resilient" icon={Briefcase} />
          <KpiCard label={tt('Value tier')} value={`${valueMult[seg.value].toFixed(2)}×`} delta="high-CLV least sensitive" icon={Target} />
        </div>

        {/* Propensity scores */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Churn propensity')} value={`${churnProp}%`} delta="next 12 mo" trend={churnProp > 25 ? 'down' : 'up'} icon={TrendingDown} />
          <KpiCard label={tt('Upgrade propensity')} value={`${upgradeProp}%`} delta="next 12 mo" trend="up" icon={TrendingUp} accent />
          <KpiCard label={tt('Downsell propensity')} value={`${downsellProp}%`} delta="next 12 mo" icon={TrendingDown} />
          <KpiCard label={tt('Win-back propensity')} value={`${winbackProp}%`} delta="if churned" icon={Heart} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Kaplan-Meier survival · with Δp overlay')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={survBase}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="t" stroke="#999" fontSize={10} />
                  <YAxis yAxisId="L" stroke="#999" fontSize={10} unit="%" />
                  <YAxis yAxisId="R" orientation="right" stroke="#999" fontSize={10} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="L" type="monotone" dataKey="S(t) baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                  <Line yAxisId="L" type="monotone" dataKey="S(t) at Δp" stroke="#222128" strokeWidth={2.5} dot={false} />
                  <Bar yAxisId="R" dataKey="Hazard h(t)" fill="#FF8585" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Weibull baseline · h(t,Δp)=h₀(t)·exp(γ·Δp%) · 36-mo horizon')}</div>
          </Panel>

          <Panel title={tt('Save-rate by channel × offer')}>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={saveRate}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="channel" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="No offer" fill="#94a3b8" />
                  <Bar dataKey="BSD 3 off 6m" fill="#FF8585" />
                  <Bar dataKey="BSD 5 off 12m" fill="#FF4438" />
                  <Bar dataKey="Bundle" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Cohort net-revenue retention · 24-month curve')}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={cohort}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="#999" fontSize={10} />
                <YAxis stroke="#999" fontSize={10} unit="%" domain={[0, 110]} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="2 2" />
                <Area type="monotone" dataKey="Net Revenue Retention" stroke="#222128" fill="#FF4438" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">NRR = S(t) × ARPU(t) / ARPU(M0) · effects: promo roll-off (M{p.promoMonths+1}) + survival decay</div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Panel title={tt('Tenure × Lifecycle elasticity heatmap (acq β)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th className="py-1.5 text-left">{tt('Tenure ↓ / Lifecycle →')}</th>{(['PROMO','EOC','SVR','WINBACK'] as const).map(l => <th key={l} className="px-2">{l}</th>)}</tr></thead>
                <tbody>
                  {(['lt6','6_12','13_24','25p'] as const).map((t) => (
                    <tr key={t} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{t}</td>
                      {(['PROMO','EOC','SVR','WINBACK'] as const).map((l) => {
                        const v = p.eAcq * tenureMult[t] * lifecycleMult[l]
                        const sat = Math.min(1, Math.abs(v) / 4)
                        return <td key={l} className="px-2 py-2 text-center font-bold" style={{ background: `rgba(225,10,10,${sat})`, color: sat > 0.5 ? '#fff' : '#111' }}>{v.toFixed(2)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={tt('Channel × Value tier elasticity heatmap (churn β)')}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th className="py-1.5 text-left">{tt('Channel ↓ / Value →')}</th>{(['high','mid','low'] as const).map(v => <th key={v} className="px-2">{v}</th>)}</tr></thead>
                <tbody>
                  {(['Digital','Retail','Save Desk','D2D','Partner'] as const).map((c) => (
                    <tr key={c} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{c}</td>
                      {(['high','mid','low'] as const).map((v) => {
                        const val = p.eChurn * channelMult[c] * valueMult[v]
                        const sat = Math.min(1, val / 2.5)
                        return <td key={v} className="px-2 py-2 text-center font-bold" style={{ background: `rgba(225,10,10,${sat})`, color: sat > 0.5 ? '#fff' : '#111' }}>{val.toFixed(2)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        </>)
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          CROSS-ELASTICITY & CANNIBALISATION
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'cross' && (() => {
        const xMatrix = [
          { from: 'BB_600', to: 'BB_1G',  pull: 0.18, push: -0.12 },
          { from: 'BB_1G',  to: 'BB_2G',  pull: 0.22, push: -0.14 },
          { from: 'BB_2G',  to: 'BB_10G',  pull: 0.12, push: -0.08 },
          { from: 'MOB_60', to: 'MOB_150',pull: 0.28, push: -0.18 },
          { from: 'MOB_150',to: 'MOB_UNL',pull: 0.32, push: -0.20 },
          { from: 'TV_ESEN',to:'TV_TOTAL',pull:0.35, push:-0.22 },
          { from: 'BB_1G',  to: 'BUN_VOLT_1G', pull: 0.42, push: -0.05 },
          { from: 'BB_2G',  to: 'BUN_MEGA',    pull: 0.28, push: -0.06 },
          { from: 'MOB_UNL',to: 'BUN_VOLT_1G', pull: 0.38, push: -0.04 },
        ]
        const flowTo = xMatrix.filter(r => r.from === productCode)
        const flowFrom = xMatrix.filter(r => r.to === productCode)

        // Full N×N logit cross-elasticity matrix (top-9 SKUs)
        const top9 = ['BB_2G','BB_1G','BB_600','MOB_UNL','MOB_150','MOB_60','TV_TOTAL','BUN_VOLT_1G','BUN_MEGA']
          .map((c) => allSimSkus.find((x) => x.code === c)).filter(Boolean) as Product[]
        const top9Prices = top9.map((x) => x.svr)
        const xMtx = logitCrossElasticity(top9Prices, 0.04)

        // Cannibalisation rate
        const totalAcq = flowTo.reduce((a, b) => a + b.pull * p.baseAcq, 0)
        const internalAcq = flowTo.filter((f) => f.to.startsWith('BUN_') || top9.find((s) => s.code === f.to)).reduce((a, b) => a + b.pull * p.baseAcq, 0)
        const cannibPct = totalAcq > 0 ? (internalAcq / totalAcq) * 100 : 0

        // Anchor effect: pull-up from one tier below if THIS price drops
        const anchor = flowFrom.length ? Math.abs(flowFrom[0].push) * 100 : 8

        // Bundle break-even: discount that preserves portfolio EBITDA
        const beBundle = bundles.filter((b) => b.items.includes(p.code)).map((b) => {
          const margin = b.price - b.cogs
          const breakEven = (margin / b.price) * 100
          return { code: b.code, name: b.name, breakEven: +breakEven.toFixed(0) }
        })

        return (<>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Pull-up potential')} value={`${(flowTo.reduce((a,b) => a+b.pull, 0)*100).toFixed(0)}%`} delta="upgrade flow %" trend="up" icon={TrendingUp} />
            <KpiCard label={tt('Push-down risk')} value={`${(flowFrom.reduce((a,b) => a+Math.abs(b.push), 0)*100).toFixed(0)}%`} delta="downgrade flow %" trend="down" icon={TrendingDown} />
            <KpiCard label={tt('Cannibalisation rate')} value={`${cannibPct.toFixed(0)}%`} delta="of net add is internal" icon={Network} />
            <KpiCard label={tt('Anchor effect')} value={`${anchor.toFixed(0)}%`} delta="pull-up from tier-below" trend="up" icon={Target} accent />
          </div>

          <Panel title={tt('Full cross-price elasticity matrix · top-9 SKUs · ε_ij from logit')}>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-vfes-dark/55 uppercase tracking-widest">
                    <th className="py-1.5 px-2">{tt('From ↓ / To →')}</th>
                    {top9.map((s) => <th key={s.code} className="px-2 text-center">{s.code}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {top9.map((from, i) => (
                    <tr key={from.code} className="border-t border-black/5">
                      <td className="py-2 px-2 font-semibold">{from.code}</td>
                      {top9.map((_, j) => {
                        const v = xMtx[i][j]
                        const sat = Math.min(1, Math.abs(v) / 1.2)
                        const isOwn = i === j
                        const color = isOwn ? `rgba(225,10,10,${sat})` : `rgba(16,185,129,${sat})`
                        return <td key={j} className="px-1.5 py-1.5 text-center font-bold" style={{ background: color, color: sat > 0.5 ? '#fff' : '#111' }}>{v.toFixed(2)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Diagonal = own-price (red) · off-diagonal = substitution (green) · ε_ij = −β·p_j·(δ_ij − s_j) · β=0.04')}</div>
          </Panel>

          <Panel title={`Cross-elasticity flows for ${p.code}`}>
            <table className="w-full text-xs">
              <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                <tr><th className="py-2">{tt('From')}</th><th>{tt('→ To')}</th><th className="text-right">{tt('Pull (price ↓ here)')}</th><th className="text-right">{tt('Push (price ↑ here)')}</th><th className="text-right">{tt('Annualised volume')}</th></tr>
              </thead>
              <tbody>
                {xMatrix.map((r, i) => (
                  <tr key={i} className={`border-t border-black/5 ${r.from === productCode || r.to === productCode ? 'bg-vfes-red/5' : ''}`}>
                    <td className="py-2 font-semibold">{r.from}</td>
                    <td className="font-semibold">{r.to}</td>
                    <td className="text-right text-emerald-700 font-bold">+{(r.pull*100).toFixed(0)}%</td>
                    <td className="text-right text-red-600 font-bold">{(r.push*100).toFixed(0)}%</td>
                    <td className="text-right">{Math.round(p.baseAcq * r.pull).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Panel title={tt('Migration flows — Sankey-equivalent bar chart')}>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={xMatrix.filter(r => r.from === productCode || r.to === productCode).map(r => ({
                    flow: `${r.from} → ${r.to}`,
                    Pull: +(r.pull*100).toFixed(1),
                    Push: +(Math.abs(r.push)*100).toFixed(1),
                  }))} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#999" fontSize={11} unit="%" />
                    <YAxis dataKey="flow" type="category" stroke="#999" fontSize={10} width={140} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Pull" fill="#10b981" />
                    <Bar dataKey="Push" fill="#FF8585" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Bundle attach uplift & break-even discount')}>
              <div className="space-y-3">
                {bundles.filter(b => b.items.includes(productCode)).map((b) => {
                  const lift = (Math.abs(delta) / p.svr) * 0.4 * 100
                  const be = beBundle.find((x) => x.code === b.code)
                  return (
                    <div key={b.code} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-sm">{tt(b.name)}</span>
                        <span className="font-bold text-vfes-dark">+{lift.toFixed(1)}%</span>
                      </div>
                      <div className="text-[10px] text-vfes-dark/55">attach lift if {p.code} {delta < 0 ? 'discounted' : 'rises'} BSD {Math.abs(delta)}</div>
                      <div className="h-2 bg-[#f3f4f7] rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-vfes-red" style={{ width: `${Math.min(100, lift * 5)}%` }} />
                      </div>
                      {be && <div className="text-[10px] text-vfes-dark/65 mt-2">Break-even discount: <b>{be.breakEven}%</b>{tt('off · preserves portfolio EBITDA')}</div>}
                    </div>
                  )
                })}
                {bundles.filter(b => b.items.includes(productCode)).length === 0 && (
                  <div className="text-sm text-vfes-dark/55 italic">{p.code} is not currently in any bundle SKU.</div>
                )}
                <div className="p-3 rounded-lg bg-vfes-red/5 border border-vfes-red/20 text-[11px] mt-2">
                  <div className="font-bold text-vfes-dark mb-1">{tt('Substitution vs Complement split')}</div>
                  <div className="text-vfes-dark/70">Substitutes (next-tier same-cat): {flowTo.filter((f) => !f.to.startsWith('BUN_')).length} flows · Complements (bundle pull): {flowTo.filter((f) => f.to.startsWith('BUN_')).length} flows</div>
                </div>
              </div>
            </Panel>
          </div>
        </>)
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          COMPETITIVE & REGULATORY
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'compreg' && (() => {
        const compData = [
          { name: 'Cable Bahamas (B)', price: newPrice },
          { name: 'Cable Bahamas (A)', price: p.svr },
          { name: 'BTC',      price: p.movistarPrice },
          { name: 'Rival ISP B',      price: p.digiPrice },
          { name: 'Cable Bahamas', price: p.vodaPrice },
          { name: 'Rival ISP C',    price: p.vooPrice },
        ].filter(x => x.price > 0)
        const cheapest = Math.min(...compData.map(x => x.price))
        const responseDecay = Array.from({ length: 12 }, (_, w) => ({
          week: `W${w+1}`,
          'Cable Bahamas share': 100 - (w >= 2 ? Math.min(70, w * 6) : 0),
          'BTC share':  100 + (w >= 2 ? Math.min(70, w * 6) : 0),
        }))

        // Bertrand-Nash equilibrium
        const nashPrices0 = [newPrice, p.movistarPrice || p.svr, p.digiPrice || p.svr, p.vodaPrice || p.svr, p.vooPrice || p.svr].map((x) => x || p.svr)
        const nashMc = [p.cogs + p.care, p.cogs * 1.05, p.cogs * 0.95, p.cogs * 1.0, p.cogs * 0.9]
        const nashEq = bertrandNash(nashPrices0, nashMc, 0.05, 25)
        const nashChart = ['Cable Bahamas','BTC','Rival ISP B','Cable Bahamas','Rival ISP C'].map((n, i) => ({
          name: n, Current: Math.round(nashPrices0[i]), Equilibrium: Math.round(nashEq[i]),
        }))

        // CPI uplift simulator (3 scenarios)
        const cpi = [
          { lbl: 'CPI + 0%', uplift: 0 },
          { lbl: 'CPI + 3%', uplift: 0.03 },
          { lbl: 'CPI + 5%', uplift: 0.05 },
        ].map((s) => {
          const upPrice = p.svr * (1 + s.uplift)
          const churnLift = s.uplift * 100 * p.eChurn * segMult
          const cancelRate = Math.max(0, churnLift) / 100
          const incRev = (upPrice - p.svr) * p.baseBase * 12 * (1 - cancelRate)
          const cancelCost = p.baseBase * cancelRate * (p.svr - p.cogs - p.care) * 12
          return { ...s, upPrice: +upPrice.toFixed(2), incRev: +(incRev/1e6).toFixed(2), cancelCost: +(cancelCost/1e6).toFixed(2), net: +((incRev - cancelCost)/1e6).toFixed(2) }
        })

        // Vulnerable carve-out cost
        const vulnerableShare = 0.06
        const vulnerableSocialPrice = 25
        const vulnerableCost = vulnerableShare * p.baseBase * Math.max(0, p.svr - vulnerableSocialPrice) * 12

        return (<>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <KpiCard label={tt('Position vs market')} value={`${newPrice <= cheapest ? '#1' : newPrice <= cheapest * 1.05 ? 'top-3' : 'mid'}`} delta={`cheapest BSD ${cheapest}`} icon={Target} accent />
            <KpiCard label={tt('Headline gap to BTC')} value={`${p.movistarPrice ? ((newPrice - p.movistarPrice)/p.movistarPrice*100).toFixed(0) : '—'}%`} delta={`vs BSD ${p.movistarPrice}`} trend={newPrice <= p.movistarPrice ? 'up' : 'down'} icon={GitCompare} />
            <KpiCard label={tt('Bertrand-Nash · Cable Bahamas')} value={`BSD ${Math.round(nashEq[0])}`} delta={`current BSD ${newPrice}`} icon={Scale} />
            <KpiCard label={tt('URCA risk')} value={Math.abs(pctChange) > 6 ? 'High' : Math.abs(pctChange) > 3 ? 'Med' : 'Low'} delta="CPI+3% rule" trend={Math.abs(pctChange) > 6 ? 'down' : 'up'} icon={Shield} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Competitor benchmark — BSD /mo')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={compData}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="price" radius={[6,6,0,0]}>
                      {compData.map((c, i) => (
                        <Cell key={i} fill={c.name.startsWith('Cable Bahamas') ? '#FF4438' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={tt('Bertrand-Nash equilibrium · current vs best-response')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={nashChart}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="BSD " />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Current" fill="#94a3b8" radius={[4,4,0,0]} />
                    <Bar dataKey="Equilibrium" fill="#FF4438" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('25-iteration fixed-point · p_i* = mc_i + 1/(β·(1−s_i)) · β=0.05')}</div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Competitive response decay — share %')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={responseDecay}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="week" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Cable Bahamas share" stroke="#222128" fill="#FF4438" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="BTC share"  stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('BTC typically matches in 14d · share advantage halves by W6')}</div>
            </Panel>

            <Panel title={tt('CPI uplift simulator · annual mid-contract increase')}>
              <table className="w-full text-xs">
                <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                  <tr><th className="py-2">{tt('Scenario')}</th><th className="text-right">{tt('New price')}</th><th className="text-right">{tt('Inc. revenue')}</th><th className="text-right">{tt('Cancel cost')}</th><th className="text-right">{tt('Net BSD ')}</th></tr>
                </thead>
                <tbody>
                  {cpi.map((s) => (
                    <tr key={s.lbl} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{s.lbl}</td>
                      <td className="text-right">BSD {s.upPrice.toFixed(2)}</td>
                      <td className="text-right text-emerald-700">BSD {s.incRev}M</td>
                      <td className="text-right text-red-600">−BSD {s.cancelCost}M</td>
                      <td className="text-right font-bold text-vfes-dark">BSD {s.net}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                <Shield className="w-3.5 h-3.5 inline mr-1" /> URCA requires 30-day notice + right-to-cancel without ETF for any uplift &gt; CPI+3%
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Vulnerable customer carve-out · BSD 25 social tariff')}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Vulnerable share')}</div>
                  <div className="text-2xl font-extrabold">{(vulnerableShare * 100).toFixed(0)}%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">{tt('Social cap')}</div>
                  <div className="text-2xl font-extrabold">BSD {vulnerableSocialPrice}</div>
                </div>
                <div className="p-3 rounded-lg bg-vfes-red/5 border border-vfes-red/30">
                  <div className="text-[10px] uppercase tracking-widest text-vfes-dark">{tt('Foregone BSD /yr')}</div>
                  <div className="text-2xl font-extrabold text-vfes-dark">BSD {(vulnerableCost/1e6).toFixed(2)}M</div>
                </div>
              </div>
              <div className="text-[10px] text-vfes-dark/55">{tt('Carve-out applies to (i) DSP recipients, (ii) over-65s on state pension, (iii) registered carers · auto-enrolment via DSP API')}</div>
            </Panel>

            <Panel title={tt('Switcher pack · 8 KPI scorecard (URCA)')}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { lbl: 'Auto-port via postcode', ok: true },
                  { lbl: '30-day right-to-cancel', ok: true },
                  { lbl: 'No early termination fee in win-back', ok: true },
                  { lbl: 'Last-bill within 30 days', ok: true },
                  { lbl: 'Compensation for delay', ok: true },
                  { lbl: 'Single-form switching', ok: true },
                  { lbl: 'Equipment return free', ok: false },
                  { lbl: 'Annual price clarity statement', ok: true },
                ].map((r) => (
                  <div key={r.lbl} className={`p-2 rounded border ${r.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <span className={`text-[10px] font-bold ${r.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{r.ok ? '✓' : '!'}</span>
                    <span className="ml-1.5 text-vfes-dark/75">{r.lbl}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title={tt('URCA & regulatory constraints')}>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { lbl: 'Annual CPI+X% cap', v: 'CPI + 3.0% max', sub: 'breach > 7% triggers complaint surge', risk: Math.abs(pctChange) > 6 ? 'High' : Math.abs(pctChange) > 3 ? 'Med' : 'Low' },
                { lbl: 'Advance notice obligation', v: '30 days', sub: 'right-to-cancel without ETF', risk: 'Low' },
                { lbl: 'Vulnerable customer carve-out', v: 'Required', sub: 'social tariff at BSD 25 max', risk: 'Med' },
                { lbl: 'Price clarity (URCA consumer code)', v: 'Compliant', sub: 'all-in monthly + promo end date', risk: 'Low' },
                { lbl: 'Bundle untying rule', v: 'Single SKU break', sub: 'must allow component cancellation', risk: 'Low' },
                { lbl: 'Switching pack (postcode pull)', v: 'Live', sub: 'auto-port, no fees', risk: 'Low' },
              ].map((r) => (
                <div key={r.lbl} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-vfes-dark/55 mb-1">{r.lbl}</div>
                  <div className="font-bold text-sm">{r.v}</div>
                  <div className="text-[11px] text-vfes-dark/55 mt-1">{r.sub}</div>
                  <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.risk === 'High' ? 'bg-red-100 text-red-700' : r.risk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.risk}</div>
                </div>
              ))}
            </div>
          </Panel>
        </>)
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          P&L & SENSITIVITY
          ════════════════════════════════════════════════════════════════════ */}
      {sub === 'pnl' && (() => {
        const annualVolume = (p.baseAcq + p.baseBase) // simplified
        const tornado = [
          { driver: 'Acq elasticity ±20%', low: -Math.abs(p.eAcq * 0.2 * pctChange) * annualVolume * p.svr / 1e6, high: Math.abs(p.eAcq * 0.2 * pctChange) * annualVolume * p.svr / 1e6 },
          { driver: 'Churn elasticity ±20%', low: -Math.abs(p.eChurn * 0.2 * pctChange) * p.baseChurn * 12 * p.svr / 1e6, high: Math.abs(p.eChurn * 0.2 * pctChange) * p.baseChurn * 12 * p.svr / 1e6 },
          { driver: 'COGS ±15%',         low: -Math.abs(p.cogs * 0.15 * p.baseBase * 12) / 1e6, high: Math.abs(p.cogs * 0.15 * p.baseBase * 12) / 1e6 },
          { driver: 'Competitor match ±50%', low: -Math.abs(0.5 * p.baseAcq * p.svr * 12 * 0.1) / 1e6, high: Math.abs(0.5 * p.baseAcq * p.svr * 12 * 0.05) / 1e6 },
          { driver: 'Cannibalisation ±25%', low: -Math.abs(0.25 * p.baseBase * 0.05 * p.svr * 12) / 1e6, high: Math.abs(0.25 * p.baseBase * 0.05 * p.svr * 12) / 1e6 },
        ].sort((a,b) => Math.abs(b.high) - Math.abs(a.high))

        const yProfile = engine.pnl5.rows.map((r) => ({
          year: `Y${r.year}`,
          Subs: Math.round(r.subs),
          Revenue: +(r.rev / 1e6).toFixed(2),
          COGS: +(r.cogs / 1e6).toFixed(2),
          Care: +(r.care / 1e6).toFixed(2),
          CAC: +(r.cac / 1e6).toFixed(2),
          EBITDA: +(r.ebitda / 1e6).toFixed(2),
          Margin: +r.margin.toFixed(1),
        }))

        const saveDeskScenarios = [
          { offer: 'No save offer',       saved: '15%', arpuSave: p.svr,        netRetained: 0.15 * p.svr },
          { offer: 'BSD 3 off for 6 mo',     saved: '38%', arpuSave: p.svr - 3,    netRetained: 0.38 * (p.svr - 3) },
          { offer: 'BSD 5 off for 12 mo',    saved: '54%', arpuSave: p.svr - 5,    netRetained: 0.54 * (p.svr - 5) },
          { offer: 'Speed upgrade free',  saved: '46%', arpuSave: p.svr,        netRetained: 0.46 * p.svr },
          { offer: 'Bundle into REVConnect',    saved: '62%', arpuSave: p.svr + 18,   netRetained: 0.62 * (p.svr + 18) },
        ]

        // Break-even churn pp
        const breakEvenChurn = (() => {
          const margin = p.svr - p.cogs - p.care
          const newMargin = newPrice - p.cogs - p.care
          const ebitdaCurrent = p.baseBase * margin * 12
          const newSubs = ebitdaCurrent / (newMargin * 12)
          return ((p.baseBase - newSubs) / p.baseBase) * 100
        })()

        // Pareto frontier: each Δp point as (Rev, EBITDA, Churn)
        const pareto = engine.optimal.curve.map((c) => ({
          dPct: c.dPct,
          Revenue: +(c.rev / 1e6).toFixed(2),
          EBITDA: +(c.ebitda / 1e6).toFixed(2),
          Churn: +c.churn.toFixed(1),
        }))

        // Optimal price grid as line chart
        const grid = engine.optimal.curve.map((c) => ({ dPct: c.dPct, EBITDA: +(c.ebitda / 1e6).toFixed(2), Revenue: +(c.rev / 1e6).toFixed(2) }))

        // Constrained optima table
        const constraints = [
          { lbl: 'No constraint', d: engine.optimal.unconstrained },
          { lbl: 'Churn ≤ +1.5pp', d: engine.optimal.churnConstrained },
          { lbl: 'URCA cap (±7%)', d: engine.optimal.regConstrained },
          { lbl: 'Margin ≥ 50%', d: engine.optimal.curve.filter((c) => (((p.svr * (1 + c.dPct/100)) - p.cogs - p.care) / (p.svr * (1 + c.dPct/100))) >= 0.5).reduce((a, b) => b.ebitda > a.ebitda ? b : a, engine.optimal.curve[0]) },
          { lbl: 'Combined (all)', d: engine.optimal.curve.filter((c) => c.churn <= 1.5 && Math.abs(c.dPct) <= 7 && (((p.svr * (1 + c.dPct/100)) - p.cogs - p.care) / (p.svr * (1 + c.dPct/100))) >= 0.5).reduce((a, b) => b.ebitda > a.ebitda ? b : a, engine.optimal.curve[15]) },
        ]

        return (<>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard label={tt('Y1 EBITDA Δ')} value={`BSD ${(ebitdaImpact/1e6).toFixed(2)}M`} delta="vs status quo" trend={ebitdaImpact > 0 ? 'up' : 'down'} icon={Coins} accent />
            <KpiCard label={tt('Y1 Revenue Δ')} value={`BSD ${(revImpact/1e6).toFixed(2)}M`} delta="12-mo forecast" trend={revImpact > 0 ? 'up' : 'down'} icon={TrendingUp} />
            <KpiCard label={tt('5-yr NPV (8%)')} value={`BSD ${(engine.pnl5.npv/1e6).toFixed(2)}M`} delta={`terminal BSD ${(engine.pnl5.terminal/1e6).toFixed(1)}M`} trend={engine.pnl5.npv > 0 ? 'up' : 'down'} icon={Sparkles} />
            <KpiCard label={tt('IRR')} value={`${(engine.pnl5.irr * 100).toFixed(1)}%`} delta="cash-on-cash" trend={engine.pnl5.irr > 0.15 ? 'up' : 'down'} icon={Percent} />
            <KpiCard label={tt('Break-even churn')} value={`${breakEvenChurn.toFixed(1)}pp`} delta="max churn absorbed" icon={Shield} />
          </div>

          <Panel title={tt('5-year P&L · subscriber roll-forward · BSD M')}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                  <tr><th className="py-2 px-2">{tt('Year')}</th><th className="text-right">{tt('Subs')}</th><th className="text-right">{tt('Revenue')}</th><th className="text-right">{tt('COGS')}</th><th className="text-right">{tt('Care')}</th><th className="text-right">{tt('CAC')}</th><th className="text-right">{tt('EBITDA')}</th><th className="text-right">{tt('Margin')}</th></tr>
                </thead>
                <tbody>
                  {yProfile.map((r) => (
                    <tr key={r.year} className="border-t border-black/5">
                      <td className="py-2 px-2 font-bold">{r.year}</td>
                      <td className="text-right">{r.Subs.toLocaleString()}</td>
                      <td className="text-right font-semibold">BSD {r.Revenue}M</td>
                      <td className="text-right text-red-600">−BSD {r.COGS}M</td>
                      <td className="text-right text-red-600">−BSD {r.Care}M</td>
                      <td className="text-right text-red-600">−BSD {r.CAC}M</td>
                      <td className="text-right font-bold text-vfes-dark">BSD {r.EBITDA}M</td>
                      <td className="text-right">{r.Margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-6 my-6">
            <Panel title={tt('Margin waterfall — BSD /mo per sub')}>
              <div className="space-y-2">
                {[
                  { lbl: 'Realised ARPU',     v: realisedArpu,      color: '#10b981', sign: '+' },
                  { lbl: '− COGS (network/content)', v: -p.cogs,    color: '#FF8585', sign: '−' },
                  { lbl: '− Care / cost-to-serve',   v: -p.care,    color: '#FF2D2D', sign: '−' },
                  { lbl: '= Contribution margin',    v: contribMo,  color: '#FF4438', sign: '=' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs w-44 text-vfes-dark/70">{r.lbl}</div>
                    <div className="flex-1 h-8 bg-[#f3f4f7] rounded relative">
                      <div className="h-full rounded" style={{ background: r.color, width: `${Math.min(100, Math.abs(r.v)/realisedArpu*100)}%` }} />
                      <span className="absolute right-2 top-1.5 text-xs font-bold text-vfes-dark">{r.sign}BSD {Math.abs(r.v).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-vfes-dark/60">Margin: <b className="text-vfes-dark">{contribPct.toFixed(0)}%</b> · break-even discount {((contribMo / realisedArpu) * 100).toFixed(0)}% off</div>
            </Panel>

            <Panel title={tt('5-yr EBITDA & Revenue (BSD M)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={yProfile}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Revenue" fill="#FF8585" radius={[6,6,0,0]} />
                    <Bar dataKey="EBITDA"  fill="#FF4438" radius={[6,6,0,0]} />
                    <Line type="monotone" dataKey="Margin" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                    <ReferenceLine y={0} stroke="#000" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Panel title={tt('Optimal price grid · EBITDA & Revenue vs Δp')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <ComposedChart data={grid}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="dPct" stroke="#999" fontSize={10} unit="%" />
                    <YAxis stroke="#999" fontSize={11} unit="M" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Revenue" stroke="#FF8585" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="EBITDA" stroke="#222128" strokeWidth={2.5} dot={false} />
                    <ReferenceLine x={engine.optimal.unconstrained.dPct} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Optimum', fontSize: 10, fill: '#10b981' }} />
                    <ReferenceLine x={pctChange.toFixed(0)} stroke="#222128" strokeDasharray="2 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Grid search Δp ∈ [−30%, +30%] · 1% steps')}</div>
            </Panel>

            <Panel title={tt('Monte Carlo · Y1 EBITDA distribution (1,000 draws)')}>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={engine.mcHist}>
                    <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                    <XAxis dataKey="bin" stroke="#999" fontSize={9} interval={2} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#FF4438" radius={[4,4,0,0]} />
                    <ReferenceLine x={`${(engine.mcP10/1e6).toFixed(1)}M`} stroke="#94a3b8" strokeDasharray="2 2" label={{ value: 'P10', fontSize: 10, fill: '#94a3b8' }} />
                    <ReferenceLine x={`${(engine.mcP50/1e6).toFixed(1)}M`} stroke="#10b981" strokeDasharray="2 2" label={{ value: 'P50', fontSize: 10, fill: '#10b981' }} />
                    <ReferenceLine x={`${(engine.mcP90/1e6).toFixed(1)}M`} stroke="#94a3b8" strokeDasharray="2 2" label={{ value: 'P90', fontSize: 10, fill: '#94a3b8' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Sources: ε~N(β,0.15) · CompReact~N(0.5,0.2) · CPI~N(2.5,0.6)%')}</div>
            </Panel>
          </div>

          <Panel title={tt('Pareto frontier · Revenue vs EBITDA · point size = |Δp|')}>
            <div className="h-72">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="Revenue" stroke="#999" fontSize={11} unit="M" name={tt('Revenue')} />
                  <YAxis type="number" dataKey="EBITDA" stroke="#999" fontSize={11} unit="M" name={tt('EBITDA')} />
                  <ZAxis type="number" dataKey="Churn" range={[20, 200]} name={tt('Churn pp')} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={pareto} fill="#FF4438">
                    {pareto.map((pt, i) => (
                      <Cell key={i} fill={pt.dPct === engine.optimal.unconstrained.dPct ? '#10b981' : pt.dPct === 0 ? '#0ea5e9' : '#FF4438'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-vfes-dark/40 uppercase tracking-widest mt-2">{tt('Green = optimum · blue = current · red = grid · z-dim = churn pp impact')}</div>
          </Panel>

          <Panel title={tt('Constrained optima — optimal Δp under 5 constraint sets')}>
            <table className="w-full text-xs mt-2">
              <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                <tr><th className="py-2 px-2">{tt('Constraint')}</th><th className="text-right">{tt('Optimal Δp')}</th><th className="text-right">{tt('EBITDA')}</th><th className="text-right">{tt('Revenue')}</th><th className="text-right">{tt('Churn pp')}</th></tr>
              </thead>
              <tbody>
                {constraints.map((c) => (
                  <tr key={c.lbl} className="border-t border-black/5">
                    <td className="py-2 px-2 font-semibold">{c.lbl}</td>
                    <td className="text-right font-bold text-vfes-dark">{c.d.dPct > 0 ? '+' : ''}{c.d.dPct}%</td>
                    <td className="text-right">BSD {(c.d.ebitda/1e6).toFixed(2)}M</td>
                    <td className="text-right">BSD {(c.d.rev/1e6).toFixed(2)}M</td>
                    <td className="text-right">{c.d.churn.toFixed(1)}pp</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={tt('Sensitivity tornado — drivers ranked by EBITDA impact (BSD M)')}>
            <div className="space-y-2 mt-2">
              {tornado.map((t, i) => {
                const max = Math.max(...tornado.map(x => Math.abs(x.high)))
                const wL = (Math.abs(t.low) / max) * 50
                const wH = (Math.abs(t.high) / max) * 50
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-52 text-xs text-vfes-dark/70">{t.driver}</div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 flex justify-end">
                        <div className="h-5 bg-red-400 rounded-l" style={{ width: `${wL}%` }} />
                      </div>
                      <div className="w-px h-6 bg-vfes-dark/30" />
                      <div className="flex-1">
                        <div className="h-5 bg-emerald-500 rounded-r" style={{ width: `${wH}%` }} />
                      </div>
                    </div>
                    <div className="w-32 text-right text-xs font-bold">BSD {t.low.toFixed(2)}M / +BSD {t.high.toFixed(2)}M</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('Cortex Elasticity Model · v3.4 · Bayesian hierarchical · 8yr panel · 1.04M HHs · R² 0.86 acq / 0.78 churn')}</div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Panel title={tt('Save-desk loop — offer playbook')}>
              <table className="w-full text-xs">
                <thead className="text-left text-vfes-dark/55 uppercase tracking-widest">
                  <tr><th className="py-2">{tt('Offer')}</th><th className="text-right">{tt('Save rate')}</th><th className="text-right">{tt('Net ARPU saved')}</th><th className="text-right">{tt('Retained value')}</th></tr>
                </thead>
                <tbody>
                  {saveDeskScenarios.map((s, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="py-2 font-semibold">{s.offer}</td>
                      <td className="text-right">{s.saved}</td>
                      <td className="text-right">BSD {s.arpuSave.toFixed(0)}</td>
                      <td className="text-right font-bold text-vfes-dark">BSD {s.netRetained.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title={tt('Scenario library')}>
              <div className="space-y-2">
                {[
                  { name: 'CPI +3.0% portfolio rise',  ebitda: '+BSD 6.4M', risk: 'Med', date: '2026-09-01' },
                  { name: 'Loyalty win-back (>24mo)',  ebitda: '+BSD 2.1M', risk: 'Low', date: '2026-Q4' },
                  { name: 'REVConnect 2P promo deepening',   ebitda: '+BSD 3.8M', risk: 'Low', date: '2027-Q1' },
                  { name: 'Mobile −BSD 3 vs Rival ISP C',       ebitda: '+BSD 1.2M', risk: 'Med', date: 'Tactical' },
                  { name: 'BB SVR +BSD 2 back-book',      ebitda: '+BSD 4.6M', risk: 'High',date: 'Pending' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#fafbfc] border border-black/5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{tt(s.name)}</div>
                      <div className="text-[11px] text-vfes-dark/55">{s.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-vfes-dark">{s.ebitda}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.risk === 'High' ? 'bg-red-100 text-red-700' : s.risk === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{s.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Export brief (PDF) · save scenario
              </button>
            </Panel>
          </div>
        </>)
      })()}
      {sub === 'elasticity' && <ElasticityLabTab p={p} pctChange={pctChange} segMult={segMult} />}
      {sub === 'margin' && <MarginBridgeTab p={p} pctChange={pctChange} engine={engine} contribMo={contribMo} contribPct={contribPct} newPrice={newPrice} />}
    </div>
  )
}

// ===========================================================================
// TAB · ELASTICITY LAB
// ===========================================================================
function ElasticityLabTab({ p, pctChange: _pctChange, segMult }: { p: Product; pctChange: number; segMult: number }) {
  const elastData = [
    { segment: tt('All'), acq: +Math.abs(p.eAcq).toFixed(2), churn: +p.eChurn.toFixed(2) },
    { segment: tt('EoC'), acq: +Math.abs(p.eAcq * 1.85).toFixed(2), churn: +(p.eChurn * 1.85).toFixed(2) },
    { segment: tt('PROMO'), acq: +Math.abs(p.eAcq * 1.6).toFixed(2), churn: +(p.eChurn * 1.6).toFixed(2) },
    { segment: tt('SVR'), acq: +Math.abs(p.eAcq * 0.7).toFixed(2), churn: +(p.eChurn * 0.7).toFixed(2) },
    { segment: tt('Fibre'), acq: +Math.abs(p.eAcq * 0.7).toFixed(2), churn: +(p.eChurn * 0.7).toFixed(2) },
    { segment: tt('MVNO'), acq: +Math.abs(p.eAcq * 1.5).toFixed(2), churn: +(p.eChurn * 1.5).toFixed(2) },
  ]
  const arcData = Array.from({ length: 11 }, (_, i) => {
    const pct = (i - 5) * 2
    const effAcq = p.baseAcq * (1 + pct * p.eAcq * segMult / 100)
    const effChurn = p.baseChurn * (1 + pct * p.eChurn * segMult / 100)
    return { pct: `${pct > 0 ? '+' : ''}${pct}%`, acqVol: Math.max(0, Math.round(effAcq)), churnVol: Math.max(0, Math.round(effChurn)), net: Math.round(effAcq - effChurn) }
  })
  return (
    <>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <KpiCard label={tt('Acq elasticity (β)')} value={`${Math.abs(p.eAcq)}`} delta={`eff. ${(Math.abs(p.eAcq) * segMult).toFixed(2)} with segment`} icon={Percent} accent />
        <KpiCard label={tt('Churn elasticity (β)')} value={`${p.eChurn}`} delta={`eff. ${(p.eChurn * segMult).toFixed(2)} with segment`} icon={TrendingDown} />
        <KpiCard label={tt('Relative sensitivity')} value={`${(p.eChurn / Math.max(0.01, Math.abs(p.eAcq))).toFixed(2)}`} delta={tt('churn ÷ acq β ratio')} icon={Activity} />
      </div>
      <Panel title={tt('Elasticity by segment · acquisition & churn β')}>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={elastData}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="segment" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="acq" name={tt('Acq β (abs)')} fill="#FF4438" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churn" name={tt('Churn β')} fill="#FF8585" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title={tt('Price ladder · gross adds / churn / net subs at Δp steps (±10%)')}>
        <table className="w-full text-sm mt-2">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Δp')}</th><th>{tt('Gross adds')}</th><th>{tt('Churn')}</th><th>{tt('Net subs')}</th></tr>
          </thead>
          <tbody>
            {arcData.map((r, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-2 font-mono font-bold text-xs">{r.pct}</td>
                <td className="font-semibold">{r.acqVol.toLocaleString()}</td>
                <td className="text-red-600">{r.churnVol.toLocaleString()}</td>
                <td className={`font-bold ${r.net > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.net > 0 ? '+' : ''}{r.net.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ===========================================================================
// TAB · MARGIN BRIDGE
// ===========================================================================
function MarginBridgeTab({ p, pctChange: _pc2, engine, contribMo, contribPct, newPrice }: { p: Product; pctChange: number; engine: any; contribMo: number; contribPct: number; newPrice: number }) {
  const bridgeData = [
    { name: tt('Baseline ARPU'), value: p.svr, fill: '#10b981' },
    { name: tt('Price Δ'), value: +(newPrice - p.svr).toFixed(2), fill: newPrice >= p.svr ? '#10b981' : '#FF8585' },
    { name: tt('– COGS'), value: -p.cogs, fill: '#FF8585' },
    { name: tt('– Care'), value: -p.care, fill: '#FF8585' },
    { name: tt('True margin'), value: +contribMo.toFixed(2), fill: '#11567F' },
  ]
  const tiers = ['BB_300', 'BB_600', 'BB_1G', 'BB_2G', 'BB_10G'].map((code) => {
    const sku = allSimSkus.find((x) => x.code === code)
    if (!sku) return null
    const m = sku.svr - sku.cogs - sku.care
    return { code, svr: sku.svr, margin: +m.toFixed(0), pct: +((m / sku.svr) * 100).toFixed(0) }
  }).filter(Boolean) as { code: string; svr: number; margin: number; pct: number }[]
  return (
    <>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <KpiCard label={tt('Monthly contribution')} value={`BSD ${contribMo.toFixed(0)}`} delta={`${contribPct.toFixed(0)}% margin yield`} trend={contribPct > 50 ? 'up' : 'flat'} icon={Coins} accent />
        <KpiCard label={tt('Gross margin floor')} value={`${contribPct.toFixed(0)}%`} delta={`COGS BSD ${p.cogs} · care BSD ${p.care}`} trend={contribPct > 45 ? 'up' : 'down'} icon={Percent} />
        <KpiCard label={tt('Break-even months')} value={engine.payback < 999 ? `${engine.payback}m` : '\u2014'} delta={tt('CAC recovery')} trend={engine.payback < 24 ? 'up' : 'down'} icon={Calculator} />
      </div>
      <Panel title={tt('Margin bridge · SVR → true contribution (BSD /sub/mo)')}>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={bridgeData} layout="vertical">
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#999" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#999" fontSize={11} width={130} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`BSD ${Number(v).toFixed(2)}`, '']} />
              <ReferenceLine x={0} stroke="#666" />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {bridgeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title={tt('Broadband tier margin ladder')}>
        <table className="w-full text-sm mt-2">
          <thead className="text-left text-vfes-dark/55 text-xs uppercase tracking-widest">
            <tr><th className="py-2">{tt('Tier')}</th><th>{tt('SVR BSD /mo')}</th><th>{tt('Margin BSD /mo')}</th><th>{tt('Margin %')}</th></tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i} className={`border-t border-black/5 ${t.code === p.code ? 'bg-vfes-red/5 font-bold' : ''}`}>
                <td className="py-2 font-mono text-xs">{t.code}</td>
                <td>BSD {t.svr}</td>
                <td className={`font-bold ${t.margin > 20 ? 'text-emerald-600' : 'text-amber-700'}`}>BSD {t.margin}</td>
                <td>{t.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
