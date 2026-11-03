"""One-off localisation pass: replaces inherited European regulatory, market and
competitor references with Bahamas equivalents across src/. Ordered: specific
phrases first, generic tokens last. Applied identically to page source and the
identity-mapped en.ts locale so tt() keys keep matching."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'src'

PHRASES = [
    # Macro and FX: BSD is pegged 1:1 to USD
    ("{ i: 'BE GDP',          v: '+1.1%', delta: '↑' }", "{ i: 'Bahamas GDP',     v: '+1.9%', delta: '↑' }"),
    ("{ i: 'BE consumer conf.', v: '-8',   delta: '↓' }", "{ i: 'Stopover arrivals', v: '+6%',  delta: '↑' }"),
    ("{ i: 'ECB rate',         v: '2.75%', delta: '↓' }", "{ i: 'CBOB discount rate', v: '4.00%', delta: '→' }"),
    ("{ i: 'BSD/USD',          v: '1.082',  delta: '→' }", "{ i: 'BSD/USD (peg)',    v: '1.000',  delta: '→' }"),
    ('BE GDP', 'Bahamas GDP'), ('BE consumer conf.', 'Stopover arrivals'),
    ('ECB rate hold at 3.25%', 'CBOB discount rate hold at 4.00%'),
    ('ECB rate normalisation', 'US rate normalisation'), ('ECB rate', 'CBOB discount rate'),
    ("{ instr: 'BSD/USD forward · content licences',      notional:  12, expiry: 'Mar 27', mtm:  0.4, status: 'Active' },\n", ''),
    ("{ instr: 'BSD/USD forward · multinational ops',     notional:   8, expiry: 'Jun 27', mtm: -0.2, status: 'Active' },\n", ''),
    ("{ instr: 'BSD/USD forward · content',  notional: 12, expiry: 'Mar 27', mtm: 0.4, status: 'Active' },\n", ''),
    ("{ instr: 'BSD/USD forward · multinational ops',   notional: 8,  expiry: 'Jun 27', mtm: -0.2, status: 'Active' },\n", ''),
    ("{ driver: 'FX BSD/USD ±5%',  upside:  0.6, downside:  -0.6 },", "{ driver: 'Hurricane outage ±1 event', upside:  0.6, downside:  -2.8 },"),
    ("{ driver: 'FX BSD/USD ±5%',     upside: 0.2, downside: -0.2 },", "{ driver: 'Hurricane outage ±1 event', upside: 0.2, downside: -2.8 },"),
    ("{ pair: 'BSD/USD', notional: 320, hedgedRate: 1.082,  marketRate: 1.079,  mtm: -0.96, maturity: 'Q4-26', type: 'Forward' },",
     "{ pair: 'BSD/USD', notional: 320, hedgedRate: 1.000,  marketRate: 1.000,  mtm:  0.00, maturity: 'Peg',   type: 'Fixed peg' },"),
    ("'BSD/USD content forward'", "'Content licences paid in USD'"),
    ("'Mar 2027 · MtM +BSD 0.4M'", "'1:1 peg · no FX hedge required'"),
    ('FX BSD/USD ±5%', 'Hurricane outage ±1 event'),
    ('BSD/USD forward · content licences', 'Content licences (USD, 1:1 peg)'),
    ('BSD/USD forward · content', 'Content licences (USD, 1:1 peg)'),
    ('BSD/USD forward · multinational ops', 'USD supplier payments (1:1 peg)'),
    ('Energy hedge · grid electricity (New Providence Airlines)', 'Fuel surcharge hedge · grid electricity (BPL)'),
    ('New Providence Airlines Telecom Group', 'Atlantis Resort Group'),
    ('New Providence Airlines Group', 'Atlantis Resort Group'),
    ('New Providence Airlines · IoT fleet', 'Port Authority · IoT fleet'),
    ('costPerEuro', 'costPerBsd'),
    # Privacy and data protection
    ('Consent & Preferences (GDPR / ePrivacy)', 'Consent & Preferences (Data Protection Act)'),
    ('CONSENT & PREFERENCES (GDPR / EPRIVACY)', 'CONSENT & PREFERENCES (DATA PROTECTION ACT)'),
    ('Full GDPR register, DPO dashboard, Bahamian DPA interaction log and ePrivacy consent mapping.',
     'Full Data Protection Act register, privacy officer dashboard, Data Protection Commissioner log and consent mapping.'),
    ('GDPR data residency (EU only)', 'Data residency (Bahamas / US-East)'),
    ('GDPR data residency (EU)', 'Data residency (Bahamas / US-East)'),
    ('all data EU-only', 'all data in approved regions'), ('all data EU only', 'all data in approved regions'),
    ('Access (GDPR Art.15)', 'Access (DPA s.8)'),
    ('GDPR / DPIA sign-off (Art. 6(1)(f) refresh)', 'Privacy impact sign-off (DPA refresh)'),
    ('GDPR Art.6 lawful bases', 'DPA lawful purposes'),
    ('GDPR DPIA checklist', 'Privacy impact checklist'),
    ('MSISDN, NIF, address', 'account number, NIB number, address'),
    ('GDPR-compliant', 'DPA-compliant'), ('GDPR_SUBJECT', 'DPA_SUBJECT'),
    ('GDPR-1', 'DPA-1'), ('GDPR-2', 'DPA-2'), ('GDPR-3', 'DPA-3'),
    ('GDPR / ePrivacy', 'Data Protection Act'), ('GDPR · ePrivacy', 'Data Protection Act'),
    ('ePrivacy', 'consent rules'), ('EPRIVACY', 'CONSENT RULES'),
    ('GDPR · APD', 'Data Protection Act'), ('GSMA · EU · URCA · APD', 'GSMA · URCA · DPA'),
    ('Loyens & Loeff', 'Higgs & Johnson'),
    # Cyber, AI, ESG and telecom regulation
    ('NIS2 / DORA · URCA lawful intercept', 'URCA cyber guidelines · lawful intercept'),
    ('DORA (financial customers)', 'CBOB IT risk guidelines (bank customers)'),
    ('EU-5G-TOOLBOX', 'URCA-VENDOR-RISK'),
    ('EU 5G Toolbox · URCA + CCB regulatory corpus', 'URCA regulatory corpus'),
    ('EU 5G Toolbox · high-risk vendor cap', 'High-risk vendor policy'),
    ('EU 5G Toolbox high-risk vendor cap', 'High-risk vendor policy'),
    ('under EU 5G Toolbox', 'under the high-risk vendor policy'),
    ('EU 5G Toolbox', 'high-risk vendor policy'),
    ('European Electronic Comms Code', 'Communications Act 2009'),
    ('EECC (KB/AR transposition 2022)', 'Communications Act 2009'), ('EECC', 'Comms Act 2009'),
    ('EU-US DPF + SCCs', 'Cross-border transfer clauses'), ('EU-DSA-EID', 'URCA-CONSUMER'),
    ('EU DG-CONNECT', 'Ministry of Economic Affairs'),
    ('EU Pay-Transparency Directive (2026 deadline)', 'Employment Act pay-equity review'),
    ('above the threshold that triggers mandatory disclosure under the 2026 EU directive',
     'above the internal pay-equity review threshold'),
    ('EU Taxonomy alignment', 'Climate-resilience capex share'), ('EU Taxonomy capex', 'Climate-resilience capex'),
    ('EU Taxonomy', 'Climate resilience'), ('EU/EFRAG', 'ISSB'),
    ('CSRD / ESRS', 'ISSB / BISX'), ('CSRD limited assurance', 'Sustainability limited assurance'),
    ('CSRD datapoints', 'Sustainability datapoints'), ('CSRD reporting', 'sustainability reporting'),
    ('CSRD compliance', 'sustainability reporting'), ('CSRD & Ratings', 'Sustainability & Ratings'),
    ('ESRS', 'ISSB'), ('EFRAG', 'ISSB'), ('CSRD', 'Sustainability report'),
    ('EU AI Act high-risk classification', 'AI governance high-risk classification'),
    ('High-risk classification completed (EU AI Act Art. 6)', 'High-risk classification completed (AI policy)'),
    ('(EU AI Act)', '(AI governance policy)'), ('EU AI Act Readiness', 'AI Governance Readiness'),
    ('EU AI Act readiness', 'AI governance readiness'),
    ('an EU AI Act governance reference', 'a regional AI governance reference'),
    ('EU AI Act', 'AI governance policy'), ('High-risk (AI Act)', 'High-risk (AI policy)'),
    ('AI Act non-conformity', 'AI policy non-conformity'), ('AI Act risk', 'AI policy risk'),
    ("'AI Act'", "'AI policy'"),
    ('Aligned with NIS2', 'Aligned with URCA cyber guidelines'),
    ('NIS2 24h notification filed', 'URCA 24h incident notification filed'),
    ('NIS2 mobile reporting', 'URCA incident reporting'),
    ('EU NIS2', 'URCA cyber'), ('Cyber & NIS2', 'Cyber & URCA'),
    ('NIS2_SCOPE', 'CYBER_SCOPE'), ('NIS2', 'URCA cyber'), ('DORA', 'CBOB IT risk'),
    ('GDPR', 'DPA'),
    # Market, vendors, partners
    ('DAZN Sports package + Eurosport', 'Caribbean Sports package + ESPN'),
    ('DAZN Sports package', 'Caribbean Sports package'), ('DAZN', 'ESPN'),
    ('Securitas, Tyco, BTC Prosegur', 'ADT, Tyco, BTC SmartHome'),
    ('American Tower EU', 'Digicel Tower Co'), ('comparable European TowerCo transactions', 'comparable Caribbean TowerCo transactions'),
    ('versus European peers', 'versus Caribbean peers'),
    ('Comparable EU auctions imply', 'Comparable regional auctions imply'),
    ('EU comparable auction pricing', 'Regional comparable auction pricing'),
    ('vs EU comparable auctions', 'vs regional comparable auctions'),
    ('based on EU comparables', 'based on regional comparables'),
    ('EU harmonisation status by band', 'CITEL harmonisation status by band'),
    ('EU harmonised bands', 'CITEL harmonised bands'),
    ('IRISH_CSO_DATA', 'BAHAMAS_NSI_DATA'), ('irishSme', 'bahamianSme'),
    ('westeurope', 'eastus2'), ('europe-west2', 'us-east1'), ('Cisco NOC EU', 'Cisco NOC Americas'),
    ('botnet origin Eastern Europe', 'botnet origin offshore'),
    ('EU CDN · gaming', 'US CDN · gaming'), ('EU SMB telecoms', 'Caribbean SMB telecoms'),
    ('EU telco regulatory stack', 'URCA regulatory stack'), ('EU telco signalling', 'Telco signalling'),
    ('URCA & EU Telco', 'URCA & Telecom'), ('EU TRG funding tranche 2', 'Universal service fund tranche 2'),
    ('EU benchmark', 'Caribbean benchmark'), ('EU inbound visitors', 'US inbound visitors'),
    ('Leisure (EU)', 'Leisure (US)'), ('Business (EU)', 'Business (US)'), ('EU/UK', 'US/Canada'),
    ('5 EU · 3 RoW', '5 US · 3 RoW'), ('EU · B2B · HR', 'Bahamas · B2B · HR'),
    ('France, Germany and UK are the top 3 inbound sources — correlate with EU outbound steering share.',
     'US, Canada and UK are the top 3 inbound sources — correlate with US outbound steering share.'),
    ('EU Roaming Reg renewal vote (impact: -BSD 3.2M ARPU)', 'URCA retail-pricing consultation (impact: -BSD 3.2M ARPU)'),
    ('EU Roaming Pack (10GB)', 'US Roaming Pack (10GB)'), ('EU roaming impact (mobile leg)', 'US roaming impact (mobile leg)'),
    ('EU intra-roaming "roam-like-at-home"', 'US/Canada roam-like-at-home bundles'),
    ('EU regulated (RLAH)', 'US/Canada bundled'), ('EU RLAH', 'US/Canada bundle'), ('RLAH', 'bundled'),
    ('EU regulated', 'US/Canada bundled'), ('EU vs ROW', 'US vs ROW'), ('EU vs RoW', 'US vs RoW'),
    ('EU destinations', 'US destinations'), ('EU Comm.', 'URCA'),
]

TOKEN_SUBS = [
    (r'\bBenchmark A\b', 'Rival ISP A'), (r'\bBenchmark B\b', 'Rival ISP B'), (r'\bBenchmark C\b', 'Rival ISP C'),
    (r"'EU'", "'US'"), (r'\bEU\b', 'US'),
]


def main() -> None:
    for path in ROOT.rglob('*.ts*'):
        text = original = path.read_text()
        for old, new in PHRASES:
            text = text.replace(old, new)
        for pattern, new in TOKEN_SUBS:
            text = re.sub(pattern, new, text)
        if text != original:
            path.write_text(text)
            print(path.relative_to(ROOT))


if __name__ == '__main__' and not __import__('sys').argv[1:]:
    main()


# Second pass: fixes generic EU→US fallout and remaining Belgian/Irish entities.
SECOND = [
    ("{ code: 'URCA cyber',  name: 'URCA cyber Directive (cyber)',         body: 'CCB',",
     "{ code: 'URCA cyber',  name: 'URCA Cybersecurity Guidelines',        body: 'URCA',"),
    ("name: 'Data Protection Act',                body: 'APD',    inForce: '2018-05'",
     "name: 'Data Protection Act 2003',           body: 'ODPC',   inForce: '2003-04'"),
    ("name: 'AI governance policy',                      body: 'US',", "name: 'AI governance policy',                      body: 'Board',"),
    ("name: 'CBOB IT risk guidelines (bank customers)',     body: 'US',", "name: 'CBOB IT risk guidelines (bank customers)',     body: 'CBOB',"),
    ("{ code: 'CRA',   name: 'Cyber Resilience Act (CPE)',     body: 'US',     inForce: '2027-12'",
     "{ code: 'CPE',   name: 'URCA type approval (CPE)',       body: 'URCA',   inForce: '2027-12'"),
    ("{ code: 'CER',   name: 'Critical Entities Resilience',   body: 'CCB',",
     "{ code: 'NEMA',  name: 'Critical infrastructure & hurricane resilience', body: 'NEMA',"),
    ("name: 'Climate resilience',                    body: 'US',", "name: 'Climate resilience',                    body: 'BISX',"),
    ("{ code: 'DATAACT',name:'Data Act (IoT)',                 body: 'US',",
     "{ code: 'ETA',   name:'Electronic Communications & Transactions Act', body: 'Govt',"),
    ("evidence: 'SCC v2 + DPF'", "evidence: 'Transfer clauses'"),
    ('112 routing', '911/919 routing'),
    ('GP2C', 'number-transfer'),
    ('URCA · APD · CCB · BCA · US stack · Sustainability report', 'URCA · ODPC · CBOB · NEMA · BISX'),
    ('URCA · APD · CCB · CCPC · US stack · Sustainability report', 'URCA · ODPC · CBOB · NEMA · BISX'),
    ('URCA · US · CCB · APD', 'URCA · ODPC · CBOB · NEMA'),
    ('URCA / US Telco / DPA / URCA cyber / AI Act', 'URCA / DPA / cyber / AI governance'),
    ("body: 'APD'", "body: 'ODPC'"), ("id: 'APD-", "id: 'ODPC-"), ('APD review open', 'ODPC review open'),
    ("body: 'CCB'", "body: 'URCA'"), ("id: 'CCB-", "id: 'URCA-C-"),
    ("'APD'", "'ODPC'"), ("'CCB'", "'URCA'"), ("'BCA'", "'URCA'"),
    ('Price clarity (UCD/US)', 'Price clarity (URCA consumer code)'),
    ('Regulatory fines (US/URCA enforcement)', 'Regulatory fines (URCA enforcement)'),
    ('URCA + US regulatory filings', 'URCA regulatory filings'),
    ('US harmonisation status per EC/CEPT decisions.', 'Harmonisation status per CITEL / ITU Region 2.'),
    ('EC/CEPT', 'CITEL'), ('CEPT ECC/DEC/', 'CITEL PCC.II/'),
    ('comparable US bands', 'comparable regional bands'), ('US auction comparables', 'regional auction comparables'),
    ('comparable US auctions', 'comparable regional auctions'), ('US-harmonised', 'ITU Region 2 harmonised'),
    ('CBL_CORP_VPN + US', 'CBL_CORP_VPN + Bahamas'),
    ("region: 'US'", "region: 'US-East'"), ("regions: 'US'", "regions: 'US-East'"),
    ('POP & Peering Map · Carto (IE + US)', 'POP & Peering Map · Carto (Bahamas + Florida)'),
    ('Whisper-Large · IE-EN tuned', 'Whisper-Large · Bahamian-EN tuned'),
    ("'Three IE'", "'Rival ISP C'"), ("'IE GDP'", "'Bahamas GDP'"), ("'IE consumer conf.'", "'Stopover arrivals'"),
    ("'BE GDP'", "'Bahamas GDP'"),
    ('BEL20 telco peers', 'BISX listed peers'), ('Wallet / Bancontact', 'Wallet / Sand Dollar'),
    ('STATBEL_POPULATION_', 'BAHAMAS_NSI_POPULATION_'), ('STATBEL_DATA', 'BAHAMAS_NSI_DATA'),
    ('Statbel Open Data', 'Bahamas National Statistical Institute'), ('Statbel', 'Bahamas NSI'),
    ('CAIXABANK_FRAMEWORK', 'ISLAND_BANK_FRAMEWORK'), ('CAIXABANK_', 'ISLAND_BANK_'), ('CaixaBank', 'Island Bank (demo)'),
    ('Belfius Bank', 'Commonwealth Bank (demo)'), ('Belfius Insurance', 'Family Guardian (demo)'),
    ('Bank: Belfius / ING The Bahamas tri-party', 'Bank: RBC Royal Bank / CIBC FirstCaribbean tri-party'),
    ('Belfius', 'Commonwealth Bank (demo)'), ('BNP Paribas Fortis', 'Scotiabank Bahamas (demo)'),
    ('Colruyt Group', 'Super Value Group (demo)'), ('Colruyt Mobile', 'Super Value Mobile (demo)'),
    ('Delhaize Group', 'AML Foods (demo)'), ('Delhaize', 'AML Foods (demo)'),
    ('floorEur', 'floorBsd'), ('currentEur', 'currentBsd'),
]
COUNTRY_TAG = re.compile(r"(country: '(?:France|Germany|Italy|Netherlands|Spain|Portugal|Belgium|Ireland|Austria|Greece|Poland)'[^}]*type: )'US'")


def second() -> None:
    for path in ROOT.rglob('*.ts*'):
        text = original = path.read_text()
        for old, new in SECOND:
            text = text.replace(old, new)
        text = COUNTRY_TAG.sub(r"\1'RoW'", text)
        if text != original:
            path.write_text(text)
            print(path.relative_to(ROOT))


if __name__ == '__main__' and __import__('sys').argv[1:] == ['--second']:
    second()
