// Agentic workflow scripts for the AgentWorkflow player. Synthetic scenarios on
// the shared baseline (74,400 fixed subscriptions, 220 sites, fixed ARPU
// BSD 63.66, as of 31 Oct 2026). Every customer-facing or financial action sits
// behind a human approval gate.

export type AgentFlow = {
  id: string
  title: string
  summary: string
  orchestrator: string
  agents: string[]
  trigger: { event: string; source: string }
  plan: string[]
  tools: { tool: string; result: string }[]
  approval: { ask: string; approver: string; guardrail: string }
  actions: { label: string; system: string }[]
  outcome: { label: string; value: string }[]
  home: string
}

export const AGENT_FLOWS: AgentFlow[] = [
  {
    id: 'hurricane',
    title: 'Hurricane response · Tropical Storm to Category 3',
    summary: 'Forecast track crosses Abaco and Grand Bahama in 54 hours. The agent sizes exposure, pre-stages crews and spares across islands, drafts customer and URCA notices, then sequences restoration and outage credits.',
    orchestrator: 'Resilience Orchestrator',
    agents: ['Network Ops Agent', 'Field Logistics Agent', 'Customer Comms Agent', 'Finance Agent'],
    trigger: { event: 'NHC advisory #14 · Cat 3 track over Abaco + Grand Bahama in 54h', source: 'Weather feed (Marketplace) · NEMA alert level Orange' },
    plan: [
      'Intersect forecast cone with headends, nodes and aerial plant',
      'Rank exposed customers by criticality (hospitals, hotels, B2B SLA, vulnerable)',
      'Pre-stage generators, fuel and spares before ports close',
      'Draft customer SMS and URCA outage pre-notice',
      'Prepare restoration sequence and credit policy for post-storm',
    ],
    tools: [
      { tool: 'NETWORK_ANALYTICS · cone_overlay()', result: '2 headends, 31 nodes, 412 km aerial plant inside cone' },
      { tool: 'CUSTOMER_ANALYTICS · exposure()', result: '18,900 fixed subs exposed · 6 hospitals/clinics · 42 B2B SLA sites' },
      { tool: 'INVENTORY · spares_by_island()', result: 'Freeport short 9 generators · Marsh Harbour short 3.2k gal fuel' },
      { tool: 'FIELD · crew_availability()', result: '27 crews available · ferry cut-off Thu 18:00' },
      { tool: 'CORTEX_SEARCH · hurricane_runbook', result: 'Runbook HR-04 v3 · URCA notice template §6' },
    ],
    approval: { ask: 'Ship 9 generators + 3.2k gal fuel on Wed ferry, stand down non-critical installs, send pre-storm SMS to 18,900 customers', approver: 'COO + Head of Network', guardrail: 'Spend cap BSD 180K without CFO · SMS respects DPA consent flags' },
    actions: [
      { label: 'Logistics order raised · 9 generators + fuel to Freeport and Marsh Harbour', system: 'ERP' },
      { label: '64 non-critical installs rescheduled after storm', system: 'Field service' },
      { label: 'Pre-storm SMS queued to 18,900 consented customers', system: 'Messaging' },
      { label: 'URCA outage pre-notice filed', system: 'Regulatory portal' },
      { label: 'Restoration priority list published to NOC', system: 'NOC' },
      { label: 'Auto-credit rule armed · >24h outage = pro-rata credit', system: 'Billing' },
    ],
    outcome: [
      { label: 'Exposed customers', value: '18,900' },
      { label: 'Est. restoration time', value: '-38%' },
      { label: 'Credits pre-approved', value: 'BSD 410K cap' },
      { label: 'Approval to action', value: '6 min' },
    ],
    home: 'noc-map',
  },
  {
    id: 'outage',
    title: 'Outage to proactive care · Node failure, Nassau East',
    summary: 'A CMTS alarm takes 1,140 customers offline. The agent correlates the alarm, suppresses duplicate tickets and truck rolls, notifies customers before they call, credits SLA accounts and flags churn risk to the save desk.',
    orchestrator: 'Service Assurance Agent',
    agents: ['Network Ops Agent', 'Care Agent', 'Billing Agent', 'Save-desk Agent'],
    trigger: { event: 'CMTS-07 · 3 upstream ports down · Nassau East', source: 'Network alarm stream · 07:42' },
    plan: [
      'Correlate alarm to node and affected households',
      'Suppress duplicate tickets and truck rolls',
      'Notify customers with ETA before they call',
      'Credit SLA business accounts automatically',
      'Hand churn-risk customers to the save desk',
    ],
    tools: [
      { tool: 'NETWORK_ANALYTICS · impact(CMTS-07)', result: '1,140 households · 23 business accounts affected' },
      { tool: 'SERVICE_ANALYTICS · open_tickets()', result: '212 tickets already open · 61 truck rolls scheduled' },
      { tool: 'FIELD · nearest_crew()', result: 'Crew N-04 · ETA 38 min · fibre splice kit on board' },
      { tool: 'CUSTOMER_ANALYTICS · churn_risk()', result: '96 high-risk households (2nd outage in 90 days)' },
    ],
    approval: { ask: 'Merge 212 tickets into master incident, cancel 61 truck rolls, notify 1,140 customers, credit 23 SLA accounts', approver: 'NOC shift lead', guardrail: 'Credits within SLA contract terms · no retention offer without save-desk review' },
    actions: [
      { label: 'Master incident INC-30418 created · 212 tickets linked', system: 'ITSM' },
      { label: '61 truck rolls cancelled', system: 'Field service' },
      { label: 'SMS + app push with 2h ETA sent to 1,140 households', system: 'Messaging' },
      { label: 'SLA credits posted to 23 business accounts', system: 'Billing' },
      { label: '96 high-risk households queued for save-desk callback', system: 'CRM' },
    ],
    outcome: [
      { label: 'Calls avoided', value: '~640' },
      { label: 'Truck rolls saved', value: 'BSD 7.3K' },
      { label: 'SLA credits', value: 'BSD 4.1K' },
      { label: 'Churn exposure flagged', value: 'BSD 6.1K MRR' },
    ],
    home: 'incidents',
  },
  {
    id: 'save-desk',
    title: 'Save desk · Cancellation intent to retention offer',
    summary: 'A long-tenure REVHome customer says they are switching to BTC. The agent reads the account, checks consent, picks an offer inside approved margin limits and queues it for the care agent to accept.',
    orchestrator: 'Churn Co-Pilot',
    agents: ['Customer 360 Agent', 'Offer Agent', 'Consent Agent'],
    trigger: { event: 'Chat intent "cancel · moving to BTC" · account CBL-10422', source: 'Digital care chat · 14:05' },
    plan: [
      'Pull account history, tenure, usage and recent service issues',
      'Estimate churn probability and lifetime value',
      'Check Data Protection Act consent for retention contact',
      'Select best offer within margin guardrails',
      'Draft message and queue for care agent approval',
    ],
    tools: [
      { tool: 'CUSTOMER_ANALYTICS · profile(CBL-10422)', result: '7.2 yr tenure · REVHome 500 Mb + TV · 2 outages in 60 days' },
      { tool: 'ML · churn_model()', result: 'Churn probability 71% · 3-yr CLV BSD 2,290' },
      { tool: 'CONSENT · check(CBL-10422)', result: 'Retention contact allowed · SMS + email' },
      { tool: 'PRODUCT_ANALYTICS · offer_ladder()', result: 'Speed upgrade to 1 Gb at same price · margin impact BSD 6/mo' },
    ],
    approval: { ask: 'Offer free upgrade to 1 Gb for 12 months plus BSD 20 one-off outage credit', approver: 'Care agent (Tier 2)', guardrail: 'Max margin give BSD 10/mo · no offer that undercuts BTC floor price' },
    actions: [
      { label: 'Offer presented in chat and accepted by customer', system: 'Care chat' },
      { label: 'Plan change to REVHome 1 Gb scheduled', system: 'Order management' },
      { label: 'BSD 20 credit posted', system: 'Billing' },
      { label: 'Network ticket raised for repeat outages at node', system: 'ITSM' },
    ],
    outcome: [
      { label: 'Customer saved', value: 'Yes' },
      { label: 'CLV protected', value: 'BSD 2,290' },
      { label: 'Margin give', value: 'BSD 6/mo' },
      { label: 'Handle time', value: '4 min' },
    ],
    home: 'churn-retention',
  },
  {
    id: 'b2b-quote',
    title: 'B2B quote to order · Resort fibre and managed Wi-Fi',
    summary: 'An Exuma resort asks for 1 Gb dedicated internet, managed Wi-Fi and backup. The agent checks feasibility against network inventory, prices above the floor, drafts the SLA and routes approval.',
    orchestrator: 'B2B Deal Closer',
    agents: ['Feasibility Agent', 'Pricing Agent', 'Contract Agent'],
    trigger: { event: 'RFQ from Exuma resort · 1 Gb DIA + managed Wi-Fi (180 APs) + LTE backup', source: 'B2B portal · account manager inbox' },
    plan: [
      'Check fibre reach and capacity at the site',
      'Estimate build cost and lead time',
      'Price against floor and competitor benchmark',
      'Draft quote and SLA from approved templates',
      'Route for commercial approval',
    ],
    tools: [
      { tool: 'NETWORK_INVENTORY · feasibility(site)', result: 'Fibre 1.4 km from George Town POP · 10G capacity available' },
      { tool: 'CAPEX · build_estimate()', result: 'Build BSD 62K · lead time 6 weeks' },
      { tool: 'B2B_ANALYTICS · price_floor()', result: 'Floor BSD 4,950/mo · BTC benchmark BSD 5,600/mo' },
      { tool: 'CORTEX_SEARCH · contract_templates', result: 'Hospitality SLA v4 · 99.9% availability · 4h restore' },
    ],
    approval: { ask: 'Quote BSD 5,350/mo, 36-month term, BSD 62K build absorbed, 99.9% SLA', approver: 'B2B Sales Director', guardrail: 'Payback under 18 months · discount ≤ 10% below list' },
    actions: [
      { label: 'Quote Q-26-1187 generated and sent to customer', system: 'CPQ' },
      { label: 'Opportunity updated to Proposal · BSD 193K TCV', system: 'CRM' },
      { label: 'Provisional build slot reserved with field team', system: 'Field service' },
    ],
    outcome: [
      { label: 'Quote turnaround', value: '2 days → 25 min' },
      { label: 'Contract value', value: 'BSD 193K' },
      { label: 'Payback', value: '12 months' },
      { label: 'Margin vs floor', value: '+8%' },
    ],
    home: 'company-360',
  },
  {
    id: 'revenue-assurance',
    title: 'Revenue assurance and collections · Billing leakage',
    summary: 'Reconciliation finds active TV services that are not being billed, and a growing 60-day debt bucket. The agent opens a leakage case, corrects billing going forward and runs dunning inside policy.',
    orchestrator: 'Revenue Assurance Agent',
    agents: ['Reconciliation Agent', 'Billing Agent', 'Collections Agent'],
    trigger: { event: 'Nightly reconciliation · 318 active TV services with no billing record', source: 'Provisioning vs billing reconciliation · 02:00' },
    plan: [
      'Validate mismatches against provisioning and order history',
      'Size monthly leakage and back-billing exposure',
      'Correct billing going forward',
      'Segment the 60-day debt bucket by risk and consent',
      'Apply dunning steps within policy',
    ],
    tools: [
      { tool: 'BILLING_ANALYTICS · recon(tv)', result: '318 confirmed · root cause: bundle migration script Aug 2026' },
      { tool: 'BILLING_ANALYTICS · leakage()', result: 'BSD 9.8K/mo leakage · BSD 24K since migration' },
      { tool: 'FINANCE_ANALYTICS · aging()', result: '60+ day bucket BSD 1.1M · 2,140 accounts' },
      { tool: 'CONSENT · contactability()', result: '1,870 contactable by SMS · 270 letter only' },
    ],
    approval: { ask: 'Correct billing for 318 services from next cycle, waive back-billing, start dunning step 2 for 1,870 accounts', approver: 'Head of Revenue Assurance', guardrail: 'No back-billing without customer notice · no suspension of vulnerable customers' },
    actions: [
      { label: 'Billing corrected for 318 services from next cycle', system: 'Billing' },
      { label: 'Leakage case RA-26-044 opened with root cause', system: 'RA case manager' },
      { label: 'Dunning step 2 SMS sent to 1,870 accounts', system: 'Messaging' },
      { label: '41 vulnerable accounts routed to care instead of dunning', system: 'CRM' },
    ],
    outcome: [
      { label: 'Leakage stopped', value: 'BSD 118K/yr' },
      { label: 'Expected recovery', value: 'BSD 290K' },
      { label: 'Vulnerable protected', value: '41 accounts' },
      { label: 'Manual hours saved', value: '~60' },
    ],
    home: 'revenue-assurance',
  },
  {
    id: 'urca-pack',
    title: 'URCA quality-of-service filing · Q3 2026 pack',
    summary: 'The quarterly URCA filing is due. The agent assembles each metric from governed data with lineage, compares it with targets, flags gaps and drafts the cover letter for sign-off.',
    orchestrator: 'Compliance Q&A Agent',
    agents: ['Regulatory Data Agent', 'Lineage Agent', 'Drafting Agent'],
    trigger: { event: 'URCA QoS submission due in 10 days · Q3 2026', source: 'Regulatory calendar' },
    plan: [
      'Pull each QoS metric from certified semantic views',
      'Verify lineage and data quality for every figure',
      'Compare against URCA targets and last quarter',
      'Explain any misses with root cause',
      'Draft cover letter and evidence pack',
    ],
    tools: [
      { tool: 'SERVICE_ANALYTICS · qos_metrics(Q3)', result: '14 metrics · 12 meet target · 2 below' },
      { tool: 'LINEAGE · trace(qos_metrics)', result: 'All 14 traced to source · 0 failed DQ checks' },
      { tool: 'NETWORK_ANALYTICS · misses()', result: 'Fault repair time missed on Andros + Exuma (ferry delays)' },
      { tool: 'CORTEX_SEARCH · urca_rules', result: 'URCA QoS framework · reporting template v2' },
    ],
    approval: { ask: 'Submit Q3 pack with 2 explained misses and remediation plan', approver: 'Head of Regulatory Affairs', guardrail: 'Every figure must trace to a certified view · legal review of narrative' },
    actions: [
      { label: 'Evidence pack generated · 14 metrics with lineage', system: 'Snowflake' },
      { label: 'Cover letter drafted and sent for legal review', system: 'Document workflow' },
      { label: 'Remediation action logged for Family Island repair times', system: 'GRC' },
    ],
    outcome: [
      { label: 'Preparation time', value: '3 weeks → 1 day' },
      { label: 'Metrics traced', value: '14 / 14' },
      { label: 'Target misses explained', value: '2' },
      { label: 'Filing status', value: 'Ready for sign-off' },
    ],
    home: 'urca-pack',
  },
  {
    id: 'multi-agent',
    title: 'Multi-agent command · Major incident during storm season',
    summary: 'A coordinating agent splits one major incident across specialist agents for network, care, field and finance, tracks their hand-offs and gives the executive team one status view.',
    orchestrator: 'Command Orchestrator',
    agents: ['Network Ops Agent', 'Care Agent', 'Field Logistics Agent', 'Finance Agent', 'Comms Agent'],
    trigger: { event: 'Subsea link Nassau–Freeport degraded · 40% capacity loss', source: 'Transport monitoring · war room opened' },
    plan: [
      'Network agent: reroute traffic over microwave and Florida transit',
      'Care agent: estimate customer impact and prepare messaging',
      'Field agent: dispatch marine repair partner',
      'Finance agent: size revenue and SLA exposure',
      'Comms agent: draft executive and URCA updates',
    ],
    tools: [
      { tool: 'TRANSPORT · reroute_options()', result: 'Microwave + Florida transit restore 85% capacity' },
      { tool: 'CUSTOMER_ANALYTICS · impact(Grand Bahama)', result: '11,200 households · 140 business accounts slowed' },
      { tool: 'FIELD · marine_partner()', result: 'Repair vessel available · 36h to site' },
      { tool: 'FINANCE_ANALYTICS · sla_exposure()', result: 'SLA exposure BSD 38K if repair > 48h' },
    ],
    approval: { ask: 'Apply reroute, dispatch repair vessel (BSD 95K), notify Grand Bahama customers, brief URCA', approver: 'CTO (incident commander)', guardrail: 'Vendor spend over BSD 50K needs CFO notification' },
    actions: [
      { label: 'Traffic rerouted · capacity back to 85%', system: 'Network controller' },
      { label: 'Repair vessel dispatched · PO raised', system: 'ERP' },
      { label: 'Customer notice sent to 11,200 households', system: 'Messaging' },
      { label: 'Executive and URCA status update issued', system: 'War room' },
    ],
    outcome: [
      { label: 'Capacity restored', value: '85% in 22 min' },
      { label: 'Agents coordinated', value: '5' },
      { label: 'SLA exposure avoided', value: 'BSD 38K' },
      { label: 'Single status view', value: 'Live' },
    ],
    home: 'war-room',
  },
]

export const flowById = (id: string) => AGENT_FLOWS.find(f => f.id === id)!
