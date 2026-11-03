import { useMemo, useState } from 'react'
import { PageHeader, Panel } from '../../components/Panel'
import AgentDecision from '../../components/AgentDecision'
import AgentAction from '../../components/AgentAction'
import { Link } from 'react-router-dom'
import MlInsightSection from '../../components/MlInsightSection'
import tt from '../../i18n/tt'
import KpiCard from '../../components/KpiCard'
import CartoMap, { MapMarker } from '../../components/CartoMap'
import { TOP_CELLS, MOBILE_KPIS, RAN_BUILDS } from './_mobile_data'
import {
  Server, HardDrive, Network, Cable, Wifi, Building2, MapPin, Search,
  Filter, ChevronRight, ChevronDown, Activity, AlertTriangle, ShieldCheck,
  Box, Boxes, Cpu, Send, Brain, Sparkles, Eye, Edit, Trash2, Plus,
  Download, GitBranch, Calendar, Tag, Globe, Zap, Layers, Smartphone, Radio,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ComposedChart, Line,
} from 'recharts'

const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111' }
const RED = '#FF4438', RED2 = '#FF2D2D', RED3 = '#B50808', RED4 = '#FF8585', RED5 = '#7A0606'
const DARK = '#0B0B0F'

// ───────── inventory data ─────────
type SiteRole = 'Headend' | 'Hub' | 'POP' | 'OLT shelter' | 'Street cabinet' | 'Datacentre'
type SiteStatus = 'In service' | 'Maintenance' | 'Planned' | 'Decommissioning'

const sites = [
  { id: 'SITE-ANT-CW',    name: 'Nassau Central',          role: 'Headend' as SiteRole,        lat: 25.0443, lng:  -77.3504, status: 'In service' as SiteStatus,   devices: 142, hh: 184_000, power: 480, owner: 'Core Eng', built: '2008', refresh: '2027' },
  { id: 'SITE-ANT-PW',    name: 'Nassau Eastern',           role: 'Headend' as SiteRole,        lat: 25.0443, lng: -77.3504, status: 'In service' as SiteStatus,   devices: 124, hh: 142_000, power: 420, owner: 'Core Eng', built: '2010', refresh: '2027' },
  { id: 'SITE-GNT-MH',    name: 'Freeport Downtown',           role: 'Hub' as SiteRole,            lat: 26.5333, lng:  -78.7, status: 'In service' as SiteStatus,   devices: 84,  hh: 84_000,  power: 240, owner: 'Regional Eng', built: '2012', refresh: '2028' },
  { id: 'SITE-BRG-PM',    name: 'Abaco Central',        role: 'Hub' as SiteRole,            lat: 26.5412, lng:  -77.0636, status: 'Maintenance' as SiteStatus,  devices: 64,  hh: 48_000,  power: 180, owner: 'Regional Eng', built: '2014', refresh: '2028' },
  { id: 'SITE-LVN-RH',    name: 'Eleuthera Central',          role: 'Hub' as SiteRole,            lat: 25.1962, lng:  -76.2431, status: 'In service' as SiteStatus,   devices: 58,  hh: 42_000,  power: 160, owner: 'Regional Eng', built: '2013', refresh: '2028' },
  { id: 'SITE-MEC-CN',    name: 'Exuma Central',         role: 'OLT shelter' as SiteRole,    lat: 23.5, lng:  -75.7667, status: 'In service' as SiteStatus,   devices: 32,  hh: 32_000,  power: 90,  owner: 'Access Eng', built: '2018', refresh: '2030' },
  { id: 'SITE-BRU-MK',    name: 'Long Island Centre',             role: 'POP' as SiteRole,            lat: 23.25, lng:  -75.1, status: 'In service' as SiteStatus,   devices: 48,  hh: 38_000,  power: 140, owner: 'Regional Eng', built: '2016', refresh: '2029' },
  { id: 'SITE-HAS-HY',    name: 'Bimini North',     role: 'OLT shelter' as SiteRole,    lat: 25.727, lng:  -79.2972, status: 'In service' as SiteStatus,   devices: 22,  hh: 18_000,  power: 64,  owner: 'Access Eng', built: '2019', refresh: '2030' },
  { id: 'SITE-ANT-IX',    name: 'Local peering Nassau',             role: 'POP' as SiteRole,            lat: 25.0443, lng: -77.3504, status: 'In service' as SiteStatus,   devices: 28,  hh: 0,       power: 120, owner: 'Backbone Eng', built: '2009', refresh: '2027' },
  { id: 'SITE-LRO-01',    name: 'Inagua Cabinet 01',          role: 'Street cabinet' as SiteRole, lat: 20.95, lng:  -73.6731, status: 'In service' as SiteStatus,   devices: 4,   hh: 1_200,   power: 4,   owner: 'Field Ops', built: '2021', refresh: '2032' },
  { id: 'SITE-GNT-CW',    name: 'Freeport East',         role: 'OLT shelter' as SiteRole,    lat: 26.5333, lng: -78.7, status: 'Planned' as SiteStatus,      devices: 0,   hh: 0,       power: 0,   owner: 'Build', built: '—', refresh: '—' },
  { id: 'SITE-ANT-DC',    name: 'Nassau DC',               role: 'Datacentre' as SiteRole,     lat: 25.0443, lng: -77.3504, status: 'In service' as SiteStatus,   devices: 84,  hh: 0,       power: 320, owner: 'Cloud Eng', built: '2015', refresh: '2028' },
]

type DeviceType = 'CMTS' | 'OLT' | 'BNG' | 'P-router' | 'PE-router' | 'Switch' | 'OLT card' | 'CMTS card' | 'ROADM' | 'SBC' | 'Firewall' | 'Optical amp'
type DeviceStatus = 'In service' | 'Maintenance' | 'Spare' | 'Planned' | 'Decom'

const devices = [
  { id: 'DEV-00142', name: 'CMTS-ANT-CW-01',  type: 'CMTS' as DeviceType,        vendor: 'Cisco',   model: 'cBR-8',           serial: 'FOC2541AB12', site: 'SITE-ANT-CW', rack: 'A4',  ru: 12, ipMgmt: '10.42.1.12',   firmware: 'IOS-XE 17.9.5', license: '2 yr · expires 2027', util: 76, downstream: '32 chan', upstream: '8 chan',  ports: '24× 100G', status: 'In service' as DeviceStatus, eos: '2027-12', subs: 38_400 },
  { id: 'DEV-00143', name: 'CMTS-ANT-CW-02',  type: 'CMTS' as DeviceType,        vendor: 'Cisco',   model: 'cBR-8',           serial: 'FOC2541AB18', site: 'SITE-ANT-CW', rack: 'A5',  ru: 12, ipMgmt: '10.42.1.13',   firmware: 'IOS-XE 17.9.5', license: '2 yr · expires 2027', util: 84, downstream: '32 chan', upstream: '8 chan',  ports: '24× 100G', status: 'In service' as DeviceStatus, eos: '2027-12', subs: 42_100 },
  { id: 'DEV-00188', name: 'CMTS-GNT-MH-01',  type: 'CMTS' as DeviceType,        vendor: 'Cisco',   model: 'cBR-8',           serial: 'FOC2611BC22', site: 'SITE-GNT-MH', rack: 'B2',  ru: 12, ipMgmt: '10.44.1.12',   firmware: 'IOS-XE 17.9.5', license: 'Active',              util: 71, downstream: '24 chan', upstream: '8 chan',  ports: '16× 100G', status: 'In service' as DeviceStatus, eos: '2027-12', subs: 28_400 },
  { id: 'DEV-00204', name: 'CMTS-BRG-PM-01',  type: 'CMTS' as DeviceType,        vendor: 'Casa',    model: 'C100G',          serial: 'CAS18A2412',  site: 'SITE-BRG-PM', rack: 'C1',  ru: 8,  ipMgmt: '10.46.1.12',   firmware: 'CASA 5.6.2',   license: 'Expiring 90d',         util: 92, downstream: '16 chan', upstream: '4 chan',  ports: '8× 100G',  status: 'Maintenance' as DeviceStatus, eos: '2025-09', subs: 16_800 },
  { id: 'DEV-00301', name: 'OLT-ANT-PW-01',   type: 'OLT' as DeviceType,         vendor: 'Nokia',   model: '7360 ISAM FX-16', serial: 'NK7360A8412', site: 'SITE-ANT-PW', rack: 'D2',  ru: 9,  ipMgmt: '10.42.2.21',   firmware: 'TWP 100.2',    license: 'Active',              util: 58, downstream: 'XGS-PON',  upstream: 'GPON',     ports: '128× PON', status: 'In service' as DeviceStatus, eos: '—',       subs: 24_000 },
  { id: 'DEV-00302', name: 'OLT-MEC-CN-01',   type: 'OLT' as DeviceType,         vendor: 'Adtran',  model: 'SDX 6320',        serial: 'AD6320B441',  site: 'SITE-MEC-CN', rack: 'E1',  ru: 6,  ipMgmt: '10.48.2.21',   firmware: 'AOS 6.4',      license: 'Active',              util: 41, downstream: 'XGS-PON',  upstream: 'GPON',     ports: '64× PON',  status: 'In service' as DeviceStatus, eos: '—',       subs: 12_000 },
  { id: 'DEV-00303', name: 'OLT-HAS-HY-01',   type: 'OLT' as DeviceType,         vendor: 'Adtran',  model: 'SDX 6320',        serial: 'AD6320C188',  site: 'SITE-HAS-HY', rack: 'F1',  ru: 6,  ipMgmt: '10.50.2.21',   firmware: 'AOS 6.4',      license: 'Active',              util: 36, downstream: 'XGS-PON',  upstream: 'GPON',     ports: '32× PON',  status: 'In service' as DeviceStatus, eos: '—',       subs: 6_000 },
  { id: 'DEV-00420', name: 'BNG-ANT-CW-01',   type: 'BNG' as DeviceType,         vendor: 'Nokia',   model: '7750 SR-7s',      serial: 'NK7750D6021', site: 'SITE-ANT-CW', rack: 'A1',  ru: 14, ipMgmt: '10.42.0.10',   firmware: 'SR OS 23.10',  license: 'Active',              util: 64, downstream: '—',        upstream: '—',         ports: '8× 400G',  status: 'In service' as DeviceStatus, eos: '—',       subs: 380_000 },
  { id: 'DEV-00421', name: 'BNG-ANT-PW-01',   type: 'BNG' as DeviceType,         vendor: 'Nokia',   model: '7750 SR-7s',      serial: 'NK7750D6044', site: 'SITE-ANT-PW', rack: 'D1',  ru: 14, ipMgmt: '10.42.0.11',   firmware: 'SR OS 23.10',  license: 'Active',              util: 56, downstream: '—',        upstream: '—',         ports: '8× 400G',  status: 'In service' as DeviceStatus, eos: '—',       subs: 320_000 },
  { id: 'DEV-00510', name: 'P-RTR-ANT-CW-01', type: 'P-router' as DeviceType,    vendor: 'Nokia',   model: '7750 SR-14s',     serial: 'NK7750E1102', site: 'SITE-ANT-CW', rack: 'A2',  ru: 22, ipMgmt: '10.42.0.20',   firmware: 'SR OS 23.10',  license: 'Active',              util: 62, downstream: '—',        upstream: '—',         ports: '32× 400G', status: 'In service' as DeviceStatus, eos: '—',       subs: 0 },
  { id: 'DEV-00511', name: 'P-RTR-GNT-MH-01', type: 'P-router' as DeviceType,    vendor: 'Nokia',   model: '7750 SR-7s',      serial: 'NK7750E1108', site: 'SITE-GNT-MH', rack: 'B1',  ru: 14, ipMgmt: '10.44.0.20',   firmware: 'SR OS 23.10',  license: 'Active',              util: 71, downstream: '—',        upstream: '—',         ports: '16× 400G', status: 'In service' as DeviceStatus, eos: '—',       subs: 0 },
  { id: 'DEV-00610', name: 'PE-RTR-Local peering-01',  type: 'PE-router' as DeviceType,   vendor: 'Cisco',   model: 'NCS-540',         serial: 'CS540F2241',  site: 'SITE-ANT-IX', rack: 'X1',  ru: 4,  ipMgmt: '198.51.100.1', firmware: 'IOS-XR 7.10',  license: 'Active',              util: 84, downstream: '—',        upstream: '—',         ports: '8× 100G',  status: 'In service' as DeviceStatus, eos: '—',       subs: 0 },
  { id: 'DEV-00710', name: 'ROADM-ANT-CW-01', type: 'ROADM' as DeviceType,        vendor: 'Ciena',   model: '6500 D7',         serial: 'CN6500G3318', site: 'SITE-ANT-CW', rack: 'A6',  ru: 7,  ipMgmt: '10.42.9.10',   firmware: 'WaveServer 21.4', license: 'Active',           util: 58, downstream: '—',        upstream: '—',         ports: '88λ',      status: 'In service' as DeviceStatus, eos: '—',       subs: 0 },
  { id: 'DEV-00810', name: 'SBC-ANT-CW-01',   type: 'SBC' as DeviceType,         vendor: 'Oracle',  model: 'AP 6300',          serial: 'OR6300H4421', site: 'SITE-ANT-CW', rack: 'A8',  ru: 2,  ipMgmt: '10.42.5.10',   firmware: 'ECZ 9.1',      license: 'Active',              util: 42, downstream: '—',        upstream: '—',         ports: '4× 10G',   status: 'In service' as DeviceStatus, eos: '—',       subs: 96_000 },
  { id: 'DEV-00811', name: 'FW-CORE-ANT-01',  type: 'Firewall' as DeviceType,     vendor: 'Palo Alto', model: 'PA-5450',       serial: 'PA5450I8821', site: 'SITE-ANT-CW', rack: 'A9',  ru: 3,  ipMgmt: '10.42.6.10',   firmware: 'PAN-OS 11.1',  license: 'Threat-prev active', util: 38, downstream: '—',        upstream: '—',         ports: '16× 100G', status: 'In service' as DeviceStatus, eos: '—',       subs: 0 },
  { id: 'DEV-00910', name: 'CMTS-LEG-ANT-04', type: 'CMTS' as DeviceType,         vendor: 'Casa',    model: 'C100G',           serial: 'CAS17A0014',  site: 'SITE-ANT-CW', rack: 'A12', ru: 8,  ipMgmt: '10.42.1.18',   firmware: 'CASA 5.4.0',   license: 'Expired',              util: 0,  downstream: '—',        upstream: '—',         ports: '8× 100G',  status: 'Decom' as DeviceStatus, eos: '2025-09', subs: 0 },
  { id: 'DEV-01010', name: 'OLT-GNT-CW-01',   type: 'OLT' as DeviceType,         vendor: 'Adtran',  model: 'SDX 6320',         serial: '—',           site: 'SITE-GNT-CW', rack: '—',   ru: 6,  ipMgmt: '—',            firmware: '—',           license: '—',                    util: 0,  downstream: 'XGS-PON',  upstream: 'GPON',     ports: '64× PON',  status: 'Planned' as DeviceStatus, eos: '—', subs: 0 },
  { id: 'DEV-01100', name: 'CMTS-SPARE-01',   type: 'CMTS' as DeviceType,         vendor: 'Cisco',   model: 'cBR-8',            serial: 'FOC2611BC44', site: 'SITE-ANT-DC', rack: 'SP', ru: 12, ipMgmt: '—',            firmware: 'IOS-XE 17.9.5', license: 'Unallocated',         util: 0,  downstream: '—',        upstream: '—',         ports: '24× 100G', status: 'Spare' as DeviceStatus, eos: '2028-04', subs: 0 },
]

// Connectivity / topology
type LinkType = 'Backbone' | 'Aggregation' | 'Access' | 'Peering' | 'Inter-DC'
const links = [
  { id: 'LNK-00041', a: 'P-RTR-ANT-CW-01',  z: 'P-RTR-GNT-MH-01', type: 'Backbone' as LinkType,    capacity: '4×400G', util: 72, distance: 264, fibre: 'pair-12 / cable-CW-GNT-08', status: 'Up' },
  { id: 'LNK-00042', a: 'P-RTR-ANT-CW-01',  z: 'BNG-ANT-CW-01',   type: 'Aggregation' as LinkType, capacity: '2×400G', util: 64, distance: 0.05, fibre: 'patch-A2-A1-04', status: 'Up' },
  { id: 'LNK-00043', a: 'P-RTR-ANT-CW-01',  z: 'PE-RTR-Local peering-01',  type: 'Peering' as LinkType,     capacity: '8×100G', util: 84, distance: 12,    fibre: 'cable-CW-Local peering-02', status: 'Up' },
  { id: 'LNK-00044', a: 'BNG-ANT-CW-01',    z: 'CMTS-ANT-CW-01',  type: 'Aggregation' as LinkType, capacity: '4×100G', util: 76, distance: 0.02, fibre: 'patch-A1-A4-08', status: 'Up' },
  { id: 'LNK-00045', a: 'BNG-ANT-CW-01',    z: 'OLT-ANT-PW-01',   type: 'Aggregation' as LinkType, capacity: '2×100G', util: 48, distance: 8,    fibre: 'cable-CW-PW-04',   status: 'Up' },
  { id: 'LNK-00046', a: 'P-RTR-GNT-MH-01',  z: 'CMTS-GNT-MH-01',  type: 'Aggregation' as LinkType, capacity: '2×100G', util: 71, distance: 0.04, fibre: 'patch-B1-B2-02', status: 'Up' },
  { id: 'LNK-00047', a: 'P-RTR-ANT-CW-01',  z: 'P-RTR-GNT-MH-01', type: 'Backbone' as LinkType,    capacity: '4×400G (B-side)', util: 18, distance: 268, fibre: 'pair-14 / cable-CW-GNT-09', status: 'Up · standby' },
  { id: 'LNK-00048', a: 'CMTS-BRG-PM-01',   z: 'P-RTR-GNT-MH-01', type: 'Aggregation' as LinkType, capacity: '2×100G', util: 88, distance: 188, fibre: 'cable-BRG-GNT-04', status: 'Watch' },
]

// IPAM
const subnets = [
  { cidr: '10.42.0.0/16',   site: 'SITE-ANT-CW', purpose: 'Mgmt + service · Nassau Central', util: 64, vlan: 'multi', owner: 'Core Eng' },
  { cidr: '10.44.0.0/16',   site: 'SITE-GNT-MH', purpose: 'Mgmt + service · Freeport',     util: 48, vlan: 'multi', owner: 'Regional Eng' },
  { cidr: '10.46.0.0/16',   site: 'SITE-BRG-PM', purpose: 'Mgmt + service · Abaco',   util: 56, vlan: 'multi', owner: 'Regional Eng' },
  { cidr: '10.48.0.0/16',   site: 'SITE-MEC-CN', purpose: 'Mgmt + service · Exuma', util: 38, vlan: 'multi', owner: 'Access Eng' },
  { cidr: '198.51.100.0/24', site: 'SITE-ANT-IX', purpose: 'Local peering peering link-net',     util: 84, vlan: '1010',  owner: 'Backbone Eng' },
  { cidr: '2a02:8c00::/32',  site: 'National',    purpose: 'IPv6 customer pool',         util: 41, vlan: '—',     owner: 'IP Eng' },
  { cidr: '195.7.32.0/19',   site: 'National',    purpose: 'IPv4 customer pool',          util: 92, vlan: '—',     owner: 'IP Eng' },
  { cidr: 'AS41552',         site: 'Global',       purpose: 'BGP ASN · customer prefixes', util: 0,  vlan: '—',     owner: 'IP Eng' },
]

const vlans = [
  { id: 100,  name: 'Mgmt-OOB',         scope: 'National', svc: 'Out-of-band mgmt', count: 412 },
  { id: 200,  name: 'Mgmt-INB',         scope: 'National', svc: 'In-band mgmt',     count: 412 },
  { id: 300,  name: 'Residential-BB',   scope: 'National', svc: 'Customer BB',       count: 380_000 },
  { id: 400,  name: 'Residential-IPTV', scope: 'National', svc: 'Linear TV',          count: 142_000 },
  { id: 500,  name: 'Residential-Voice', scope: 'National', svc: 'Hosted voice',     count: 96_000 },
  { id: 600,  name: 'B2B-Fibre',         scope: 'National', svc: 'B2B dedicated',     count: 4_800 },
  { id: 1010, name: 'Peering-Local peering',      scope: 'Nassau',   svc: 'IXP peering',       count: 12 },
  { id: 1020, name: 'Peering-LINX',      scope: 'Nassau',   svc: 'IXP peering',       count: 8 },
]

// Cable / fibre plant
const cables = [
  { id: 'CBL-CW-GNT-08', a: 'Nassau Central', z: 'Freeport Downtown',  type: 'Single-mode 144f', length: 264, status: 'In service', spare: 96 },
  { id: 'CBL-CW-GNT-09', a: 'Nassau Central', z: 'Freeport Downtown',  type: 'Single-mode 144f', length: 268, status: 'In service · standby', spare: 102 },
  { id: 'CBL-CW-PW-04',  a: 'Nassau Central', z: 'Nassau Eastern', type: 'Single-mode 288f', length: 8,   status: 'In service', spare: 196 },
  { id: 'CBL-CW-Local peering-02', a: 'Nassau Central', z: 'Local peering',          type: 'Single-mode 96f',  length: 12,  status: 'In service', spare: 64 },
  { id: 'CBL-BRG-GNT-04', a: 'Abaco',          z: 'Freeport Downtown', type: 'Single-mode 144f', length: 188, status: 'Watch · OTDR drift', spare: 88 },
  { id: 'CBL-CW-LVN-03',  a: 'Nassau Central', z: 'Eleuthera Central', type: 'Single-mode 144f', length: 196, status: 'In service', spare: 92 },
]

// Lifecycle / EOL pipeline
const lifecycle = [
  { stage: 'Planned',          n: 142, color: '#94a3b8' },
  { stage: 'Ordered',          n: 84,  color: RED4 },
  { stage: 'Staged · spares', n: 38,  color: RED2 },
  { stage: 'In service',       n: 4_820, color: '#10b981' },
  { stage: 'Maintenance',      n: 18,  color: '#f59e0b' },
  { stage: 'Decommissioning',  n: 8,   color: '#ef4444' },
]

const eolDevices = [
  { equip: 'Casa C100G CMTS',          count: 12, eos: '2025-09', risk: 'High',   plan: 'Migrate to Cisco cBR-8' },
  { equip: 'CommScope ARRIS Hub 4 (CPE)', count: 124_000, eos: '2026-Q2', risk: 'Medium', plan: 'Swap to Wi-Fi 6 Pro by 2027' },
  { equip: 'Cisco cBR-8 (legacy line cards)', count: 22, eos: '2027-Q4', risk: 'Medium', plan: 'Refresh CapEx locked' },
  { equip: 'Adtran SDX 6320 (legacy fw)', count: 8,  eos: '—',       risk: 'Low',    plan: 'Steady-state' },
]

// Vendor mix
const vendorMix = [
  { name: 'Cisco',     value: 38, color: RED },
  { name: 'Nokia',     value: 28, color: RED2 },
  { name: 'Adtran',    value: 12, color: RED4 },
  { name: 'Casa',      value: 6,  color: '#94a3b8' },
  { name: 'CommScope', value: 8,  color: RED5 },
  { name: 'Ciena',     value: 4,  color: RED3 },
  { name: 'Other',     value: 4,  color: '#0ea5e9' },
]

const deviceTypeMix = [
  { type: 'CMTS',     n: 78 },
  { type: 'OLT',      n: 142 },
  { type: 'BNG',      n: 12 },
  { type: 'P-router', n: 18 },
  { type: 'PE-router', n: 24 },
  { type: 'Switch',   n: 480 },
  { type: 'ROADM',    n: 14 },
  { type: 'SBC',      n: 8 },
  { type: 'Firewall', n: 16 },
  { type: 'CPE',      n: 1_600_000 },
]

// Audit log
const auditLog = [
  { ts: '14:32', user: 'pjose@example.com',     action: 'Updated firmware on CMTS-ANT-CW-01 → IOS-XE 17.9.5',  ticket: 'CHG-12041' },
  { ts: '11:48', user: 'sysauto@example.com',   action: 'Auto-imported 24 new ONTs from OLT-ANT-PW-01',         ticket: 'AUTO-INV' },
  { ts: '10:14', user: 'rwouters@example.com',   action: 'Decommissioned CMTS-LEG-ANT-04',                     ticket: 'CHG-12036' },
  { ts: 'Yest',  user: 'mjacobs@example.com',  action: 'Created site SITE-GNT-CW (Freeport East · Planned)', ticket: 'PRJ-2241' },
  { ts: 'Yest',  user: 'sysauto@example.com',   action: 'License renewal alert · CMTS-BRG-PM-01 expiring 90d',  ticket: 'AUTO-LIC' },
  { ts: '2d',    user: 'pjose@example.com',     action: 'Allocated subnet 10.50.0.0/16 to SITE-HAS-HY',         ticket: 'IPAM-441' },
]

// AI prompts
const cortexPrompts = [
  { q: 'Which devices are reaching EOS in the next 12 months?',          sql: 'SELECT * FROM DEVICES WHERE eos_date < DATEADD(month, 12, CURRENT_DATE)' },
  { q: 'Show all CMTSs above 80% util',                                   sql: 'SELECT * FROM DEVICES WHERE type = \'CMTS\' AND util > 80' },
  { q: 'Free /24 subnets I can allocate to Freeport',                         sql: 'CALL ipam_find_free_block(region=>\'freeport\', size=>\'/24\')' },
  { q: 'Topology blast radius if Nassau-Central headend goes down',             sql: 'CALL topology_blast_radius(site=>\'SITE-ANT-CW\')' },
  { q: 'Stranded capacity — sites < 50% util with high CapEx',            sql: 'SELECT * FROM SITE_UTIL WHERE util < 50 AND capex_book_value > 1000000' },
  { q: 'List all unallocated spare devices with active warranty',         sql: 'SELECT * FROM DEVICES WHERE status = \'Spare\' AND warranty_active = TRUE' },
]

// ───────── coverage analytics data ─────────
const coverageByRegion = [
  { region: 'Nassau',    cov4g: 99.2, cov5g: 84.1, ftth: 91.3 },
  { region: 'Freeport', cov4g: 98.8, cov5g: 79.4, ftth: 88.7 },
  { region: 'Abaco',  cov4g: 97.6, cov5g: 64.2, ftth: 72.1 },
  { region: 'Eleuthera',   cov4g: 96.4, cov5g: 58.9, ftth: 65.4 },
  { region: 'Bimini',    cov4g: 97.1, cov5g: 61.3, ftth: 69.8 },
  { region: 'Exuma',  cov4g: 95.8, cov5g: 49.7, ftth: 58.2 },
  { region: 'Andros',    cov4g: 95.2, cov5g: 44.1, ftth: 52.6 },
  { region: 'Long Island',  cov4g: 94.1, cov5g: 38.4, ftth: 44.9 },
]

const coverageTrend = [
  { month: 'Jan', pop4g: 95.8, pop5g: 52.1 },
  { month: 'Feb', pop4g: 96.1, pop5g: 54.3 },
  { month: 'Mar', pop4g: 96.4, pop5g: 57.8 },
  { month: 'Apr', pop4g: 96.7, pop5g: 61.2 },
  { month: 'May', pop4g: 97.1, pop5g: 64.9 },
  { month: 'Jun', pop4g: 97.4, pop5g: 68.1 },
]

const techCoverageMix = [
  { name: '5G SA',  value: 18, color: '#FF4438' },
  { name: '5G NSA', value: 41, color: '#0ea5e9' },
  { name: '4G',     value: 31, color: RED2 },
  { name: 'FTTH',   value: 10, color: RED4 },
]

const spectrumBySite = [
  { site: 'Nassau',    mhz700: 20, mhz1800: 40, mhz2100: 40, mhz3500: 100 },
  { site: 'Freeport', mhz700: 20, mhz1800: 40, mhz2100: 40, mhz3500: 100 },
  { site: 'Abaco',  mhz700: 20, mhz1800: 30, mhz2100: 30, mhz3500: 80  },
  { site: 'Eleuthera',   mhz700: 20, mhz1800: 30, mhz2100: 20, mhz3500: 60  },
  { site: 'Bimini',    mhz700: 20, mhz1800: 20, mhz2100: 20, mhz3500: 60  },
]

const signalQualityDist = [
  { range: 'Excellent', pct: 42, color: '#10b981' },
  { range: 'Good',      pct: 31, color: '#FF4438' },
  { range: 'Fair',      pct: 18, color: '#f59e0b' },
  { range: 'Poor',      pct: 9,  color: '#ef4444' },
]

const capacityVsDemand = [
  { metro: 'Nassau',    capacity: 840, demand: 720 },
  { metro: 'Freeport', capacity: 620, demand: 540 },
  { metro: 'Abaco',  capacity: 380, demand: 310 },
  { metro: 'Eleuthera',   capacity: 280, demand: 240 },
  { metro: 'Bimini',    capacity: 220, demand: 185 },
  { metro: 'Exuma',  capacity: 180, demand: 148 },
]

const competitorCoverage = [
  { region: 'Nassau',    ours: 99.2, btc: 99.5, orange: 98.1, digi: 94.2 },
  { region: 'Freeport', ours: 98.8, btc: 99.1, orange: 97.4, digi: 91.8 },
  { region: 'Abaco',  ours: 97.6, btc: 97.9, orange: 95.1, digi: 88.4 },
  { region: 'Eleuthera',   ours: 96.4, btc: 96.8, orange: 93.7, digi: 85.2 },
  { region: 'Bimini',    ours: 97.1, btc: 97.3, orange: 94.8, digi: 86.9 },
]

const indoorOutdoorCov = [
  { city: 'Nassau',    indoor: 94.1, outdoor: 99.2 },
  { city: 'Freeport', indoor: 92.8, outdoor: 98.8 },
  { city: 'Abaco',  indoor: 88.4, outdoor: 97.6 },
  { city: 'Eleuthera',   indoor: 86.1, outdoor: 96.4 },
  { city: 'Bimini',    indoor: 87.9, outdoor: 97.1 },
  { city: 'Exuma',  indoor: 82.4, outdoor: 95.8 },
]

// ───────── tabs ─────────
type TabId = 'overview' | 'sites' | 'devices' | 'topo' | 'ipam' | 'recon' | 'lifec' | 'ai'
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview',         icon: Activity },
  { id: 'sites',    label: 'Sites',            icon: Building2 },
  { id: 'devices',  label: 'Devices',          icon: Server },
  { id: 'topo',     label: 'Topology & Cable', icon: Cable },
  { id: 'ipam',     label: 'IPAM & VLAN',      icon: Network },
  { id: 'recon',    label: 'Reconciliation',   icon: GitBranch },
  { id: 'lifec',    label: 'Lifecycle & Audit', icon: Calendar },
  { id: 'ai',       label: 'AI Inventory',     icon: Brain },
]

const statusPill = (s: string) => {
  if (s === 'In service' || s === 'Up') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Spare') return 'bg-blue-100 text-blue-700'
  if (s === 'Maintenance' || s === 'Watch' || s.includes('standby') || s.includes('Watch')) return 'bg-amber-100 text-amber-700'
  if (s === 'Planned') return 'bg-slate-200 text-slate-700'
  if (s === 'Decom' || s === 'Decommissioning') return 'bg-red-100 text-red-700'
  return 'bg-black/5 text-vfes-dark/65'
}
const riskPill = (r: string) => r === 'High' ? 'bg-red-100 text-red-700' : r === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
const typeBadgeColor = (t: string) => {
  if (t === 'CMTS' || t === 'OLT') return 'bg-vfes-red/10 text-vfes-dark'
  if (t === 'BNG' || t === 'P-router' || t === 'PE-router') return 'bg-blue-50 text-blue-700'
  if (t === 'ROADM' || t === 'Optical amp') return 'bg-purple-50 text-purple-700'
  if (t === 'SBC') return 'bg-amber-50 text-amber-700'
  if (t === 'Firewall') return 'bg-red-50 text-red-700'
  return 'bg-black/5 text-vfes-dark/65'
}
const linkTypePill = (t: string) => t === 'Backbone' ? 'bg-vfes-red/10 text-vfes-dark' : t === 'Peering' ? 'bg-blue-50 text-blue-700' : t === 'Aggregation' ? 'bg-amber-50 text-amber-700' : 'bg-black/5 text-vfes-dark/65'

const DEVICE_TYPES = ['All', 'CMTS', 'OLT', 'BNG', 'P-router', 'PE-router', 'ROADM', 'SBC', 'Firewall'] as const
const DEVICE_STATUSES = ['All', 'In service', 'Maintenance', 'Spare', 'Planned', 'Decom'] as const

export default function CoveragePage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [mapView, setMapView] = useState<'all' | 'fixed' | 'mobile' | '5g'>('all')
  const [deviceQuery, setDeviceQuery] = useState('')
  const [deviceType, setDeviceType] = useState<typeof DEVICE_TYPES[number]>('All')
  const [deviceStatus, setDeviceStatus] = useState<typeof DEVICE_STATUSES[number]>('All')
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [expandedSite, setExpandedSite] = useState<string | null>('SITE-ANT-CW')

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (deviceType !== 'All' && d.type !== deviceType) return false
      if (deviceStatus !== 'All' && d.status !== deviceStatus) return false
      if (deviceQuery) {
        const q = deviceQuery.toLowerCase()
        return (
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.serial.toLowerCase().includes(q) ||
          d.ipMgmt.toLowerCase().includes(q) ||
          d.site.toLowerCase().includes(q) ||
          d.vendor.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [deviceQuery, deviceType, deviceStatus])

  const siteMarkers: MapMarker[] = useMemo(() => sites.map((s) => {
    const role = s.role
    const color = role === 'Headend' ? RED : role === 'Datacentre' ? RED5 : role === 'POP' ? RED3 : role === 'Hub' ? RED2 : role === 'OLT shelter' ? RED4 : '#94a3b8'
    const radius = 8 + Math.log10(Math.max(s.devices, 1)) * 4
    return {
      name: s.id,
      lat: s.lat,
      lng: s.lng,
      radius,
      color,
      pulse: s.status === 'Maintenance',
      tooltip: `${tt(s.name)} · ${tt(s.role)} · ${s.devices} devices · ${tt(s.status)}`,
    }
  }), [])

  // Mobile-only markers (cell sites)
  const cellMarkers: MapMarker[] = useMemo(() => TOP_CELLS.map((c) => ({
    name: c.id,
    lat: c.lat,
    lng: c.lng,
    radius: 6 + c.trafficTBd / 2,
    color: c.tech.startsWith('5G') ? '#FF4438' : '#FF8585',
    pulse: c.tech === '5G SA',
    tooltip: `${c.id} · ${c.tech} · ${c.vendor}<br/>${c.city} · ${c.trafficTBd} TB/day`,
  })), [])

  // Combined markers based on toggle
  const combinedMarkers: MapMarker[] = useMemo(() => {
    if (mapView === 'fixed')  return siteMarkers
    if (mapView === 'mobile') return cellMarkers
    if (mapView === '5g')     return cellMarkers.filter((_, i) => TOP_CELLS[i].tech.startsWith('5G'))
    return [...siteMarkers, ...cellMarkers]
  }, [mapView, siteMarkers, cellMarkers])

  const totalDevices = devices.length
  const inServiceDevices = devices.filter(d => d.status === 'In service').length
  const spareDevices = devices.filter(d => d.status === 'Spare').length
  const eolNext12mo = devices.filter(d => d.eos !== '—' && d.eos.startsWith('2025') || d.eos.startsWith('2026')).length

  return (
    <div className="p-8">
      <PageHeader
        title={tt('Network Inventory · Coverage')}
        subtitle={tt('Sites · devices · topology · IPAM · lifecycle · audit · AI assistant')}
        actions={
          <div className="flex items-center gap-2">
            <button className="text-[11px] font-bold text-vfes-dark bg-vfes-red px-3 py-1.5 rounded hover:bg-vfes-red-dark flex items-center gap-1.5">
              <Plus className="w-3 h-3" />Add device
            </button>
            <button className="text-[11px] font-bold text-vfes-dark/70 bg-black/5 px-3 py-1.5 rounded hover:bg-black/10 flex items-center gap-1.5">
              <Download className="w-3 h-3" />Export CSV
            </button>
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-discovery on · NetBox-style
            </span>
          </div>
        }
      />

      <a href="#/portal/fixed-access" className="flex items-center gap-2 mb-6 text-xs font-bold text-vfes-dark bg-vfes-red/5 border border-vfes-red/20 rounded-lg px-3 py-2 w-fit hover:bg-vfes-red/10">
        {tt('FTTH overbuild & PON capacity → open Fixed Access for investment-priority areas')} →
      </a>

      <AgentDecision
        title="Inventory audit agent"
        label="Run Inventory Audit" runningLabel="Scanning…"
        steps={[
          'Diffed inventory model vs live topology discovery',
          'Flagged 1.2% stale / drifted records',
          'Scored audit & assurance-correlation risk',
          'Proposed reconciliation before next audit',
        ]}
        hint="The agent diffs the inventory model against live topology and flags records to reconcile before the audit."
        result={{
          headline: 'Reconcile 1.2% stale inventory records before the next audit',
          stats: [
            { label: 'Stale records', value: '1.2%' },
            { label: 'Outcome', value: 'Cleaner correlation' },
            { label: 'Method', value: 'Discovery-diff' },
          ],
          findings: [
            'Auto-discovery flagged drift between the inventory model and live topology.',
            'Clean records keep assurance correlation and capacity planning trustworthy.',
          ],
          note: 'Automate the reconciliation via the discovery diff to avoid manual effort.',
        }}
        impact="cleaner alarm correlation · fewer false dispatches"
        risk="manual reconciliation effort — automate via discovery diff"
        linkTo="#/portal/assurance" linkLabel="Open Service Assurance"
      />

      {/* alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">{tt('EoS · 12 Casa C100G CMTS reaching End-of-Support 2025-09')}</div>
            <div className="text-xs text-amber-800 mt-1">
              Migration to Cisco cBR-8 in progress · 8 of 12 staged ·
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('CapEx BSD 4.8M locked')}</span>
              <span className="ml-2 font-mono bg-white/70 px-1.5 py-0.5 rounded">{tt('11 license renewals pending')}</span>
            </div>
          </div>
          <button className="text-xs font-bold text-amber-900 hover:underline shrink-0">{tt('Open lifecycle →')}</button>
        </div>
      </div>

      {/* Related cockpits — static portal links (not in a map) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/portal/coverage"       className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Coverage')}</Link>
        <Link to="/portal/network"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Network')}</Link>
        <Link to="/portal/inventory"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Inventory')}</Link>
        <Link to="/portal/mobile-ran"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Mobile RAN')}</Link>
        <Link to="/portal/fixed-access"   className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Fixed Access')}</Link>
        <Link to="/portal/noc-map"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('NOC Map')}</Link>
        <Link to="/portal/assurance"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Assurance')}</Link>
        <Link to="/portal/operations"     className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Operations')}</Link>
        <Link to="/portal/field-ops"      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Field Ops')}</Link>
        <Link to="/portal/capacity-capex" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Capacity & CapEx')}</Link>
        <Link to="/portal/slicing"        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('Network Slicing')}</Link>
        <Link to="/portal/war-room"       className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-vfes-red/10 hover:text-vfes-dark">{tt('War Room')}</Link>
      </div>

      {/* tab nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-black/5 w-fit">
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

      {/* ═══════ OVERVIEW ═══════ */}
      {tab === 'overview' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard label={tt('Total sites')}        value={`${sites.length}`}                     delta={`${sites.filter(s=>s.status==='In service').length} in service`} trend="up"   icon={Building2} accent />
          <KpiCard label={tt('Devices in service')} value={`${inServiceDevices}`}                   delta={`${spareDevices} spare`}        trend="up"   icon={Server} />
          <KpiCard label={tt('Subnets · IPAM')}     value={`${subnets.length}`}                    delta="2 IPv4 / 1 IPv6 / ASN"        trend="flat" icon={Network} />
          <KpiCard label={tt('Cable plant · km')}   value="1,184 km"                                delta={`${cables.length} routes`}    trend="up"   icon={Cable} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EoS next 12 mo')}     value={`${eolNext12mo}`}                       delta="critical: 12 Casa CMTS"        trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Vendors active')}     value={`${vendorMix.length}`}                   delta="diversity index 0.78"          trend="up"   icon={Tag} />
          <KpiCard label={tt('VLANs allocated')}    value={`${vlans.length}`}                      delta="of 4096"                       trend="flat" icon={Layers} />
          <KpiCard label={tt('License risk · 90d')}  value="14"                                     delta="renew before exp"              trend="down" icon={ShieldCheck} />
        </div>

        {/* Mobile inventory KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Cell sites · active')}  value={MOBILE_KPIS.activeSites.toLocaleString('en-BS')} delta={`${MOBILE_KPIS.ownedSites.toLocaleString('en-BS')} ${tt('owned')} · ${MOBILE_KPIS.sharedSites.toLocaleString('en-BS')} ${tt('Island Towers (demo)')}`} trend="up" icon={Smartphone} accent />
          <KpiCard label={tt('5G coverage')}           value={`${MOBILE_KPIS.cov5gPop}%`} delta={tt('+3.4 pp YoY')} trend="up" icon={Radio} />
          <KpiCard label={tt('4G coverage')}           value={`${MOBILE_KPIS.cov4gPop}%`} delta={tt('best-in-class')} trend="flat" icon={Radio} />
          <KpiCard label={tt('Spectrum (MHz)')}        value="450 MHz" delta={tt('paired + 3.5 GHz TDD + mmWave')} trend="flat" icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel
              title={tt('National Site Map · All Roles')}
              action={
                <div className="flex gap-1">
                  {(['all','fixed','mobile','5g'] as const).map(v => (
                    <button key={v} onClick={() => setMapView(v)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${mapView === v ? 'bg-vfes-red text-vfes-dark' : 'bg-black/5 text-vfes-dark/65 hover:bg-black/10'}`}>
                      {v === 'all' ? tt('All') : v === 'fixed' ? tt('Fixed') : v === 'mobile' ? tt('Mobile') : tt('5G only')}
                    </button>
                  ))}
                </div>
              }
            >
              <CartoMap markers={combinedMarkers} basemap="voyager" height={420} center={[24.7, -76.5]} zoom={6} />
              <div className="mt-2 flex items-center gap-4 text-[10px] text-vfes-dark/65 uppercase tracking-widest flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />{tt('Headend')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED2 }} />{tt('Hub')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED3 }} />{tt('POP')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED4 }} />{tt('OLT shelter')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RED5 }} />{tt('Datacentre')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />{tt('Cabinet')}</span>
                <span className="ml-auto">{tt('Bubble = device count · pulse = maintenance')}</span>
              </div>
            </Panel>
          </div>

          <Panel title={tt('Vendor Mix')}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={vendorMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {vendorMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest text-center">{tt('% by device count · diversity 0.78')}</div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Device Type Distribution')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={deviceTypeMix} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 11 }} scale="log" domain={[1, 10_000_000]} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="n" fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-vfes-dark/55 uppercase tracking-widest">{tt('Log scale · CPE excluded from main inventory views')}</div>
          </Panel>

          <Panel title={tt('Lifecycle State')}>
            <div className="space-y-2">
              {lifecycle.map((l) => (
                <div key={l.stage} className="flex items-center gap-3 text-sm">
                  <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  <div className="w-40 font-semibold">{l.stage}</div>
                  <div className="flex-1 h-6 bg-black/5 rounded">
                    <div className="h-full rounded flex items-center justify-end pr-2 text-[10px] text-white font-bold" style={{ width: `${(l.n / lifecycle[3].n) * 100}%`, background: l.color }}>
                      {l.n.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Coverage by region · 4G / 5G / FTTH (%)')}>  
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageByRegion} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                  <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="cov4g" name={tt('4G')} fill={RED2} radius={[3,3,0,0]} />
                  <Bar dataKey="cov5g" name={tt('5G')} fill={RED} radius={[3,3,0,0]} />
                  <Bar dataKey="ftth" name={tt('FTTH')} fill={RED4} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Population coverage trend (%)')}>  
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverageTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="pop4g" name={tt('4G pop.')} stroke={RED2} fill={RED2} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="pop5g" name={tt('5G pop.')} stroke={RED} fill={RED} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Panel title={tt('Technology coverage mix')}>  
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={techCoverageMix} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={2}>
                    {techCoverageMix.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Spectrum by city (MHz)')}>  
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spectrumBySite} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="site" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} MHz`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="mhz700" name="700 MHz" stackId="a" fill={RED5} />
                  <Bar dataKey="mhz1800" name="1800 MHz" stackId="a" fill={RED3} />
                  <Bar dataKey="mhz2100" name="2100 MHz" stackId="a" fill={RED2} />
                  <Bar dataKey="mhz3500" name="3500 MHz" stackId="a" fill={RED} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Signal quality · distribution')}>  
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalQualityDist} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="range" tick={{ fontSize: 9 }} width={76} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Bar dataKey="pct" name={tt('% connections')} radius={[0,4,4,0]}>
                    {signalQualityDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ SITES ═══════ */}
      {tab === 'sites' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total sites')}      value={`${sites.length}`}                                       delta="National"          trend="flat" icon={Building2} accent />
          <KpiCard label={tt('Headends')}          value={`${sites.filter(s=>s.role==='Headend').length}`}        delta="Tier-1"            trend="up"   icon={Server} />
          <KpiCard label={tt('Hubs / POPs')}       value={`${sites.filter(s=>s.role==='Hub'||s.role==='POP').length}`} delta="Regional"         trend="up"   icon={Network} />
          <KpiCard label={tt('Power draw · total')} value={`${sites.reduce((s,x)=>s+x.power,0)} kW`}              delta="-3% YoY"           trend="up"   icon={Zap} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Panel title={tt('Capacity vs Demand · metro areas (Gbps)')}>  
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={capacityVsDemand} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="metro" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Gbps`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="capacity" name={tt('Capacity')} fill={RED} radius={[4,4,0,0]} />
                  <Bar dataKey="demand" name={tt('Demand')} fill={RED4} radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="demand" stroke="#374151" strokeWidth={2} dot={false} legendType="none" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={tt('Indoor vs outdoor coverage (%)')}>  
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indoorOutdoorCov} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="indoor" name={tt('Indoor')} fill={RED3} radius={[4,4,0,0]} />
                  <Bar dataKey="outdoor" name={tt('Outdoor')} fill={RED} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title={tt('Site Tree · click to expand · drill into devices')}>
          <div className="space-y-1">
            {sites.map((s) => (
              <div key={s.id} className="border border-black/5 rounded-lg">
                <button onClick={() => { setExpandedSite(expandedSite === s.id ? null : s.id); setSelectedSite(s.id) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-black/[0.02] ${selectedSite === s.id ? 'bg-vfes-red/5' : ''}`}>
                  {expandedSite === s.id ? <ChevronDown className="w-4 h-4 text-vfes-dark/55" /> : <ChevronRight className="w-4 h-4 text-vfes-dark/55" />}
                  <Building2 className="w-4 h-4 text-vfes-dark" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">{tt(s.name)} <span className="font-mono text-[10px] text-vfes-dark/45 ml-1">{s.id}</span></div>
                    <div className="text-[10px] text-vfes-dark/55">{tt(s.role)} · {s.lat.toFixed(3)}, {s.lng.toFixed(3)} · built {s.built} · refresh {s.refresh} · owner {tt(s.owner)}</div>
                  </div>
                  <div className="text-xs text-vfes-dark/65 hidden md:block">{s.devices} devices · {s.hh.toLocaleString()} HHs · {s.power} kW</div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(s.status)}`}>{tt(s.status)}</span>
                  <button className="text-vfes-dark/40 hover:text-vfes-dark"><Eye className="w-3.5 h-3.5" /></button>
                  <button className="text-vfes-dark/40 hover:text-vfes-dark"><Edit className="w-3.5 h-3.5" /></button>
                </button>

                {expandedSite === s.id && (
                  <div className="border-t border-black/5 bg-[#fafbfc] p-3">
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Coordinates')}</div><div className="font-mono text-xs">{s.lat}, {s.lng}</div></div>
                      <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('HHs served')}</div><div className="text-xs font-bold">{s.hh.toLocaleString()}</div></div>
                      <div><div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold">{tt('Power draw')}</div><div className="text-xs font-bold">{s.power} kW</div></div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 font-bold mb-2">{tt('Devices at site')}</div>
                    {devices.filter(d => d.site === s.id).length === 0 && <div className="text-xs text-vfes-dark/55 italic">{tt('No devices commissioned at this site yet.')}</div>}
                    {devices.filter(d => d.site === s.id).map((d) => (
                      <div key={d.id} className="flex items-center gap-3 py-1.5 border-b border-black/5 text-sm">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${typeBadgeColor(d.type)}`}>{d.type}</span>
                        <span className="font-mono text-[10px] text-vfes-dark/55">{d.id}</span>
                        <span className="font-semibold flex-1">{tt(d.name)}</span>
                        <span className="text-xs text-vfes-dark/65 hidden md:block">{d.vendor} · {d.model}</span>
                        <span className="text-xs">Rack {d.rack} · {d.ru}U</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusPill(d.status)}`}>{tt(d.status)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </>)}

      {/* ═══════ DEVICES ═══════ */}
      {tab === 'devices' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Total devices')}     value={`${totalDevices}`}                                     delta="excl. CPE"           trend="flat" icon={Server} accent />
          <KpiCard label={tt('In service')}        value={`${inServiceDevices}`}                                  delta={`${Math.round(inServiceDevices/totalDevices*100)}%`} trend="up" icon={Activity} />
          <KpiCard label={tt('Spares')}            value={`${spareDevices}`}                                      delta="ready to deploy"     trend="up"   icon={Box} />
          <KpiCard label={tt('Decom queued')}       value={`${devices.filter(d=>d.status==='Decom').length}`}    delta="Casa CMTS legacy"    trend="down" icon={Trash2} />
        </div>

        <Panel
          title={tt('Device Inventory')}
          action={
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1 bg-black/5 rounded px-2 py-1">
                <Search className="w-3.5 h-3.5 text-vfes-dark/55" />
                <input value={deviceQuery} onChange={(e) => setDeviceQuery(e.target.value)}
                  placeholder={tt('Search name / ID / serial / IP / vendor')}
                  className="bg-transparent outline-none text-xs w-72" />
              </div>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as typeof DEVICE_TYPES[number])}
                className="text-[10px] font-bold uppercase tracking-widest bg-black/5 px-2 py-1 rounded">
                {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={deviceStatus} onChange={(e) => setDeviceStatus(e.target.value as typeof DEVICE_STATUSES[number])}
                className="text-[10px] font-bold uppercase tracking-widest bg-black/5 px-2 py-1 rounded">
                {DEVICE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest sticky top-0 bg-white">
                <tr>
                  <th className="py-2">{tt('Device')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Vendor / Model')}</th>
                  <th>{tt('Serial')}</th>
                  <th>{tt('Site')}</th>
                  <th>{tt('Rack')}</th>
                  <th>{tt('Mgmt IP')}</th>
                  <th>{tt('Firmware')}</th>
                  <th>{tt('License')}</th>
                  <th className="text-right">{tt('Util')}</th>
                  <th>{tt('Status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="border-t border-black/5 hover:bg-black/[0.02]">
                    <td className="py-2.5">
                      <div className="font-semibold text-xs">{tt(d.name)}</div>
                      <div className="font-mono text-[10px] text-vfes-dark/55">{d.id}</div>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${typeBadgeColor(d.type)}`}>{d.type}</span></td>
                    <td className="text-xs"><div className="font-semibold">{d.vendor}</div><div className="text-[10px] text-vfes-dark/55">{d.model}</div></td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{d.serial}</td>
                    <td className="text-xs text-vfes-dark/65 font-mono">{d.site}</td>
                    <td className="text-xs">{d.rack} · {d.ru}U</td>
                    <td className="font-mono text-[10px] text-vfes-dark/65">{d.ipMgmt}</td>
                    <td className="text-[10px] font-mono text-vfes-dark/65">{d.firmware}</td>
                    <td className={`text-[10px] ${d.license.includes('Expir') ? 'text-amber-600 font-bold' : d.license === 'Active' ? 'text-emerald-600' : 'text-vfes-dark/65'}`}>{d.license}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 bg-black/5 rounded">
                          <div className={`h-full rounded ${d.util > 85 ? 'bg-red-500' : d.util > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${d.util}%` }} />
                        </div>
                        <span className="text-[10px] font-bold w-7">{d.util}%</span>
                      </div>
                    </td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(d.status)}`}>{tt(d.status)}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button title={tt('View')} className="text-vfes-dark/40 hover:text-vfes-dark p-1"><Eye className="w-3.5 h-3.5" /></button>
                        <button title={tt('Edit')} className="text-vfes-dark/40 hover:text-vfes-dark p-1"><Edit className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDevices.length === 0 && (
                  <tr><td colSpan={12} className="py-8 text-center text-xs text-vfes-dark/45 italic">{tt('No devices match the filter.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-vfes-dark/45 uppercase tracking-widest">Showing {filteredDevices.length} of {totalDevices} · auto-refresh from NetBox / OSS sync · all changes audit-logged</div>
        </Panel>
      </>)}

      {/* ═══════ TOPOLOGY & CABLE ═══════ */}
      {tab === 'topo' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Active links')}      value={`${links.filter(l=>l.status.startsWith('Up')).length}`} delta={`${links.length} total`}    trend="up"   icon={GitBranch} accent />
          <KpiCard label={tt('Cable plant')}        value={`${cables.length}`}                                    delta="1,184 km combined"           trend="flat" icon={Cable} />
          <KpiCard label={tt('Spare fibre %')}      value="64%"                                                   delta="strong reserve"              trend="up"   icon={ShieldCheck} />
          <KpiCard label={tt('Top link util')}      value="88%"                                                   delta="GAL→CRK aggregation"         trend="down" icon={AlertTriangle} />
        </div>

        <Panel title={tt('Logical Links · Topology')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('ID')}</th>
                  <th>{tt('A-end')}</th>
                  <th>{tt('Z-end')}</th>
                  <th>{tt('Type')}</th>
                  <th>{tt('Capacity')}</th>
                  <th className="text-right">{tt('Util')}</th>
                  <th className="text-right">{tt('Distance')}</th>
                  <th>{tt('Fibre')}</th>
                  <th>{tt('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-[10px] text-vfes-dark/55">{l.id}</td>
                    <td className="font-semibold text-xs">{l.a}</td>
                    <td className="font-semibold text-xs">{l.z}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${linkTypePill(l.type)}`}>{l.type}</span></td>
                    <td className="text-xs">{l.capacity}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 bg-black/5 rounded">
                          <div className={`h-full rounded ${l.util > 80 ? 'bg-red-500' : l.util > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${l.util}%` }} />
                        </div>
                        <span className="text-[10px] font-bold w-7">{l.util}%</span>
                      </div>
                    </td>
                    <td className="text-right text-xs">{l.distance} km</td>
                    <td className="font-mono text-[10px] text-vfes-dark/55">{l.fibre}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(l.status)}`}>{tt(l.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Physical Cable / Fibre Plant')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Cable ID')}</th>
                    <th>{tt('A-site')}</th>
                    <th>{tt('Z-site')}</th>
                    <th>{tt('Type')}</th>
                    <th className="text-right">{tt('Length')}</th>
                    <th className="text-right">{tt('Spare fibres')}</th>
                    <th>{tt('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cables.map((c) => (
                    <tr key={c.id} className="border-t border-black/5">
                      <td className="py-2.5 font-mono text-[10px] text-vfes-dark/65">{c.id}</td>
                      <td className="text-xs font-semibold">{c.a}</td>
                      <td className="text-xs font-semibold">{c.z}</td>
                      <td className="text-xs">{c.type}</td>
                      <td className="text-right text-xs">{c.length} km</td>
                      <td className="text-right font-bold text-emerald-600">{c.spare}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusPill(c.status)}`}>{tt(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Competitor comparison · 4G coverage by region (%)')}>  
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competitorCoverage} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="ours" name={tt('Cable Bahamas')} fill={RED} radius={[4,4,0,0]} />
                  <Bar dataKey="btc" name="BTC" fill="#0ea5e9" radius={[4,4,0,0]} />
                  <Bar dataKey="orange" name="Rival ISP A" fill="#f97316" radius={[4,4,0,0]} />
                  <Bar dataKey="digi" name="Rival ISP B" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ IPAM & VLAN ═══════ */}
      {tab === 'ipam' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Subnets · IPAM')}     value={`${subnets.length}`} delta="2 IPv4 / 1 IPv6 / ASN"   trend="flat" icon={Network} accent />
          <KpiCard label={tt('IPv4 pool · util')}   value="92%"                  delta="195.7.32.0/19 critical"  trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('IPv6 pool · util')}   value="41%"                  delta="2a02:8c00::/32"          trend="up"   icon={Globe} />
          <KpiCard label={tt('VLANs allocated')}    value={`${vlans.length}`}    delta="of 4096"                trend="flat" icon={Layers} />
        </div>

        <Panel title={tt('IPAM · Subnets & ASN')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('CIDR / ASN')}</th>
                  <th>{tt('Site / scope')}</th>
                  <th>{tt('Purpose')}</th>
                  <th className="text-right">{tt('Util')}</th>
                  <th>{tt('VLAN')}</th>
                  <th>{tt('Owner')}</th>
                </tr>
              </thead>
              <tbody>
                {subnets.map((s) => (
                  <tr key={s.cidr} className="border-t border-black/5">
                    <td className="py-2.5 font-mono text-xs font-bold">{s.cidr}</td>
                    <td className="text-xs">{s.site}</td>
                    <td className="text-xs text-vfes-dark/65">{s.purpose}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 bg-black/5 rounded">
                          <div className={`h-full rounded ${s.util > 85 ? 'bg-red-500' : s.util > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${s.util}%` }} />
                        </div>
                        <span className="text-[10px] font-bold w-7">{s.util}%</span>
                      </div>
                    </td>
                    <td className="text-xs">{s.vlan}</td>
                    <td className="text-xs text-vfes-dark/65">{tt(s.owner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('VLAN Registry')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('VLAN ID')}</th>
                    <th>{tt('Name')}</th>
                    <th>{tt('Scope')}</th>
                    <th>{tt('Service')}</th>
                    <th className="text-right">{tt('Endpoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vlans.map((v) => (
                    <tr key={v.id} className="border-t border-black/5">
                      <td className="py-2.5 font-mono font-bold">{v.id}</td>
                      <td className="font-semibold text-xs">{tt(v.name)}</td>
                      <td className="text-xs text-vfes-dark/65">{v.scope}</td>
                      <td className="text-xs">{v.svc}</td>
                      <td className="text-right font-bold">{v.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ RECONCILIATION ═══════ */}
      {tab === 'recon' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Golden-record match')} value="98.6%" delta={tt('logical ↔ physical')} trend="up" icon={GitBranch} accent />
          <KpiCard label={tt('Discrepancies open')} value="318" delta={tt('-42% MoM with auto-discovery')} trend="up" icon={AlertTriangle} />
          <KpiCard label={tt('Provisionable ports')} value="812K" delta={tt('free-to-sell capacity')} trend="flat" icon={Network} />
          <KpiCard label={tt('Circuits unbilled')} value="142" delta={tt('inventory ↔ billing gap')} trend="down" icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel
            title={tt('Logical ↔ physical reconciliation')}
            action={<AgentAction label="Reconcile inventory" runningLabel="Reconciling…"
              steps={[
                'Diffed NetBox golden record vs SNMP/NETCONF discovery',
                'Found 318 discrepancies (ghost ports, missing devices)',
                'Auto-resolved 274 low-risk; raised 44 for review',
                'Synced corrected records back to source of truth',
              ]} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                    <th className="px-3 py-2">{tt('Discrepancy type')}</th>
                    <th className="px-3 py-2 text-right">{tt('Count')}</th>
                    <th className="px-3 py-2">{tt('Disposition')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { t: 'Ghost port (in model, not discovered)', n: 124, d: 'auto-resolved' },
                    { t: 'Shadow device (discovered, not in model)', n: 96, d: 'auto-resolved' },
                    { t: 'Attribute drift (speed/VLAN mismatch)', n: 54, d: 'auto-resolved' },
                    { t: 'Orphan circuit (no parent site)', n: 28, d: 'review' },
                    { t: 'Duplicate asset tag', n: 16, d: 'review' },
                  ].map((r) => (
                    <tr key={r.t} className="border-b border-black/5 hover:bg-[#fafbfc]">
                      <td className="px-3 py-2">{tt(r.t)}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.n}</td>
                      <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.d === 'auto-resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tt(r.d)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('86% of discrepancies auto-resolve — only orphan circuits & duplicate tags need a human.')} <ChevronRight className="w-3 h-3" /></div>
          </Panel>

          <Panel title={tt('Provisionable capacity & spares')}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { region: 'Nassau', free: 184, spares: 42 },
                  { region: 'Freeport', free: 142, spares: 31 },
                  { region: 'Abaco', free: 96, spares: 18 },
                  { region: 'Eleuthera', free: 88, spares: 14 },
                  { region: 'Bimini', free: 64, spares: 11 },
                ]}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#999" fontSize={11} />
                  <YAxis stroke="#999" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v}K`, n === 'free' ? tt('Free ports') : tt('Spare units')]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="free" fill={RED} name={tt('Free ports (K)')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spares" fill="#94A3B8" name={tt('Spare units (K)')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-vfes-dark/55">{tt('Free-to-sell capacity by region drives sales feasibility & where to hold spares.')}</div>
          </Panel>
        </div>

        <Panel title={tt('Circuit inventory ↔ billing reconciliation')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-vfes-dark/55 border-b border-black/5">
                  <th className="px-3 py-2">{tt('State')}</th>
                  <th className="px-3 py-2 text-right">{tt('Circuits')}</th>
                  <th className="px-3 py-2 text-right">{tt('BSD K / month')}</th>
                  <th className="px-3 py-2">{tt('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: 'Active in inventory · billed', n: 84210, k: 0, a: 'ok' },
                  { s: 'Active · not billed (leak)', n: 142, k: 38, a: 'raise charge' },
                  { s: 'Billed · ceased in inventory', n: 64, k: 11, a: 'stop charge' },
                  { s: 'Inventory orphan · no contract', n: 38, k: 0, a: 'investigate' },
                ].map((r) => (
                  <tr key={r.s} className="border-b border-black/5 hover:bg-[#fafbfc]">
                    <td className="px-3 py-2">{tt(r.s)}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.n.toLocaleString('en-BS')}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.k > 0 ? `BSD ${r.k}K` : '—'}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.a === 'ok' ? 'bg-emerald-50 text-emerald-700' : r.a === 'investigate' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{tt(r.a)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-vfes-dark font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> {tt('142 active circuits are unbilled — feeds directly into Revenue Assurance leakage.')} <ChevronRight className="w-3 h-3" /></div>
        </Panel>

        <div className="mt-4">
          <AgentDecision
            title="Inventory ↔ billing agent"
            label="Run Self-Healing Sync" runningLabel="Reconciling…"
            steps={[
              'Reconciled golden record vs live discovery',
              'Joined inventory to billing & contracts',
              'Quantified unbilled-circuit leakage',
              'Drafted self-healing close-the-loop plan',
            ]}
            hint="The agent closes the loop from inventory to billing and quantifies recoverable leakage."
            result={{
              headline: 'Make the golden record self-healing and feed it to Revenue Assurance',
              stats: [
                { label: 'Auto-resolved', value: '86%' },
                { label: 'Circuit leakage', value: 'BSD 49K/mo' },
                { label: 'Unbilled circuits', value: '142' },
              ],
              findings: [
                'Auto-discovery already resolves 86% of discrepancies.',
                'Closing the loop to billing turns inventory accuracy into recovered revenue and trustworthy provisioning capacity.',
              ],
              note: 'Orphan circuits need a contract-data join before charges can be raised.',
            }}
            impact="BSD 49K/mo circuit leakage recoverable · cleaner provisioning"
            risk="orphan circuits need contract-data join"
            linkTo="#/portal/revenue-assurance" linkLabel="Open Revenue Assurance"
          />
        </div>
      </>)}

      {/* ═══════ LIFECYCLE & AUDIT ═══════ */}
      {tab === 'lifec' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('EoS next 12 mo')}      value={`${eolDevices.length} families`} delta="3 high-risk"          trend="down" icon={AlertTriangle} accent />
          <KpiCard label={tt('License renewals · 90d')} value="14"                              delta="11 critical"           trend="down" icon={ShieldCheck} />
          <KpiCard label={tt('Devices in maintenance')} value={`${devices.filter(d=>d.status==='Maintenance').length}`} delta="active changes" trend="flat" icon={Activity} />
          <KpiCard label={tt('Audit events · 24h')}   value={`${auditLog.length}`}            delta="all logged"            trend="up"   icon={ShieldCheck} />
        </div>

        <Panel title={tt('EoS / EoL Watchlist')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2">{tt('Equipment family')}</th>
                  <th className="text-right">{tt('Count')}</th>
                  <th>{tt('EoS / EoL')}</th>
                  <th>{tt('Risk')}</th>
                  <th>{tt('Plan')}</th>
                </tr>
              </thead>
              <tbody>
                {eolDevices.map((e) => (
                  <tr key={e.equip} className="border-t border-black/5">
                    <td className="py-2.5 font-semibold">{e.equip}</td>
                    <td className="text-right font-bold">{e.count.toLocaleString()}</td>
                    <td className="text-xs">{e.eos}</td>
                    <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${riskPill(e.risk)}`}>{e.risk}</span></td>
                    <td className="text-xs">{e.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Panel title={tt('Audit Log · Last 24h')}>
            <div className="space-y-2">
              {auditLog.map((a, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-black/5 pb-2 text-sm">
                  <div className="w-12 text-[10px] text-vfes-dark/55 font-mono shrink-0">{a.ts}</div>
                  <div className="flex-1">
                    <div className="text-xs">{tt(a.action)}</div>
                    <div className="text-[10px] text-vfes-dark/55 mt-0.5"><span className="font-mono">{a.user}</span> · ticket <span className="font-mono">{a.ticket}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>)}

      {/* ═══════ AI INVENTORY ═══════ */}
      {tab === 'ai' && (<>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label={tt('Auto-discovered devices · 24h')} value="412" delta="from SNMP / NETCONF / NetBox API" trend="up" icon={Sparkles} accent />
          <KpiCard label={tt('Stale records flagged')}          value="24"  delta="not seen in 30d"               trend="down" icon={AlertTriangle} />
          <KpiCard label={tt('Cortex queries · wk')}            value="284" delta="+18% vs LW"                    trend="up"   icon={Brain} />
          <KpiCard label={tt('License optimisations')}          value="BSD 84K" delta="potential savings YTD"        trend="up"   icon={ShieldCheck} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Panel title={tt('Cortex Analyst · Inventory Prompts')}>
              <div className="space-y-2">
                {cortexPrompts.map((p, i) => (
                  <div key={i} className="border border-black/5 rounded-lg p-3 hover:bg-black/[0.02] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-vfes-dark shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.q}</div>
                        <code className="text-[10px] text-vfes-dark/55 font-mono mt-1 block">{p.sql}</code>
                      </div>
                      <Send className="w-3.5 h-3.5 text-vfes-dark/30 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">Powered by Cortex Analyst · Semantic View: <span className="font-mono">{tt('NETWORK_INVENTORY_360')}</span>{tt('· Cortex Search: device docs + runbooks')}</div>
            </Panel>
          </div>
          <Panel title={tt('Inventory Health · Model Card')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Source of truth')}</span><span className="font-bold">{tt('NetBox + Snowflake')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Auto-discovery')}</span><span className="font-bold text-emerald-600">{tt('SNMP / NETCONF')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Sync interval')}</span><span className="font-bold">{tt('15 min')}</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Records reconciled')}</span><span className="font-bold">98.6%</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Stale (30d unseen)')}</span><span className="font-bold text-amber-600">24</span></div>
              <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-vfes-dark/65">{tt('Owner')}</span><span className="font-bold">{tt('Inventory Eng')}</span></div>
              <div className="flex justify-between"><span className="text-vfes-dark/65">{tt('Audit retention')}</span><span className="font-bold">{tt('7 years')}</span></div>
            </div>
            <div className="mt-3 text-[10px] text-vfes-dark/40 uppercase tracking-widest">{tt('All edits captured to immutable audit table')}</div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title={tt('Inventory Health by Region · AI Score')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-vfes-dark/55 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="py-2">{tt('Region / Site cluster')}</th>
                    <th className="text-right">{tt('Devices')}</th>
                    <th className="text-right">{tt('Reconciled')}</th>
                    <th className="text-right">{tt('AI health score')}</th>
                    <th className="text-right">{tt('Stale records')}</th>
                    <th>{tt('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { region: 'Nassau · Central',       devices: 266, recon: 99.1, score: 96, stale: 2,  action: 'ok' },
                    { region: 'Freeport · Downtown',       devices: 84,  recon: 98.8, score: 94, stale: 4,  action: 'ok' },
                    { region: 'Abaco · Central',    devices: 64,  recon: 97.4, score: 88, stale: 9,  action: 'review' },
                    { region: 'Eleuthera · Central',      devices: 58,  recon: 98.2, score: 91, stale: 6,  action: 'ok' },
                    { region: 'Exuma · Central',     devices: 32,  recon: 99.6, score: 98, stale: 1,  action: 'ok' },
                    { region: 'Bimini · North', devices: 22,  recon: 99.2, score: 97, stale: 1,  action: 'ok' },
                    { region: 'Long Island · Centre',         devices: 48,  recon: 97.1, score: 85, stale: 12, action: 'alert' },
                    { region: 'Nassau · Local peering',         devices: 28,  recon: 100,  score: 99, stale: 0,  action: 'ok' },
                  ].map((r) => (
                    <tr key={r.region} className="border-t border-black/5">
                      <td className="py-2.5 font-semibold">{tt(r.region)}</td>
                      <td className="text-right font-mono">{r.devices}</td>
                      <td className={`text-right font-bold ${r.recon >= 99 ? 'text-emerald-600' : r.recon >= 98 ? 'text-amber-600' : 'text-red-600'}`}>{r.recon}%</td>
                      <td className="text-right">
                        <span className={`font-bold text-sm ${r.score >= 95 ? 'text-emerald-600' : r.score >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{r.score}</span>
                        <span className="text-[10px] text-vfes-dark/40">/100</span>
                      </td>
                      <td className={`text-right ${r.stale > 8 ? 'text-red-600 font-bold' : r.stale > 3 ? 'text-amber-600' : 'text-vfes-dark/65'}`}>{r.stale}</td>
                      <td><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${r.action === 'ok' ? 'bg-emerald-50 text-emerald-700' : r.action === 'review' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{tt(r.action)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-black/5">
              <Link to="/portal/assurance"  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-vfes-red/10 text-vfes-dark hover:bg-vfes-red/20">{tt('Service Assurance →')}</Link>
              <Link to="/portal/field-ops"  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('Field Ops')}</Link>
              <Link to="/portal/operations" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('Operations')}</Link>
              <Link to="/portal/ai-insights" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-vfes-dark/70 hover:bg-black/10">{tt('AI Insights')}</Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <MlInsightSection
            heading={tt('Inventory intelligence')}
            models={[
              { name: tt('Auto-reconciler'),       metric: '86% auto-resolve',    sub: tt('golden record diff') },
              { name: tt('Stale-record Detector'), metric: 'recall 0.94',          sub: tt('30d unseen device') },
              { name: tt('Leakage Estimator'),     metric: 'BSD 49K/mo recoverable',  sub: tt('unbilled circuit model') },
            ]}
            agentLabel={tt('Run Inventory Audit')}
            agentRunningLabel={tt('Scanning…')}
            agentSteps={[
              tt('Diffed NetBox golden record vs SNMP / NETCONF discovery'),
              tt('Found and classified all discrepancies by type and risk'),
              tt('Auto-resolved 86% of low-risk records'),
              tt('Quantified unbilled-circuit leakage and raised charge actions'),
            ]}
            agentBlurb={tt('A single Snowflake table joins the inventory golden record, live discovery, billing, and contracts — so the reconciliation loop closes automatically and leakage surfaces in real time.')}
            decision={{
              title: tt('Make the golden record self-healing and feed it to Revenue Assurance'),
              detail: tt('Auto-discovery already resolves 86% of discrepancies. Closing the loop to billing turns inventory accuracy into recovered revenue.'),
              impact: tt('BSD 49K/mo circuit leakage recoverable · cleaner provisioning · audit-ready'),
              risk: tt('Orphan circuits need a contract-data join before charges can be raised'),
              linkTo: '/portal/assurance',
              linkLabel: tt('Open Service Assurance →'),
            }}
            chart={{
              kind: 'bar' as const,
              title: tt('Discrepancy resolution by type'),
              data: [
                { t: 'Ghost port',       auto: 124, manual: 0 },
                { t: 'Shadow device',    auto: 96,  manual: 0 },
                { t: 'Attr drift',       auto: 54,  manual: 0 },
                { t: 'Orphan circuit',   auto: 0,   manual: 28 },
                { t: 'Duplicate asset',  auto: 0,   manual: 16 },
              ],
              xKey: 't',
              series: [
                { key: 'auto',   name: tt('Auto-resolved'), color: '#10B981' },
                { key: 'manual', name: tt('Manual review'),  color: '#F59E0B' },
              ],
              note: tt('86% auto-resolved · only orphan circuits & duplicate tags need human review'),
            }}
            registryNote={tt('INVENTORY_RECON_V3 · Snowflake ML Registry · NetBox sync')}
          />
        </div>
      </>)}
    </div>
  )
}
