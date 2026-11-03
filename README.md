# Cable Bahamas C360

A React 18, TypeScript and Vite demonstration of customer, financial and network analytics for the Cable Bahamas group. It runs in two places: a public offline version on GitHub Pages, and a live version inside Snowflake whose chat is a real Cortex Agent over data aligned with the dashboards.

## Links

| Resource | Link | Access |
| --- | --- | --- |
| Live app in Snowflake | [Cable Bahamas C360 (live)](https://jfbyezj-sfseeurope-pjose-aws3.snowflakecomputing.app) | Snowflake sign-in; requires role `CABLE_BAHAMAS_VIEWER` |
| Public offline demo | [Cable Bahamas C360](https://pmjose.github.io/CableBahamas/) | Public; demonstration entry code below; scripted chat |
| Source repository | [pmjose/CableBahamas](https://github.com/pmjose/CableBahamas) | Public |
| Deployment workflows | [GitHub Actions](https://github.com/pmjose/CableBahamas/actions) | Public |
| Snowflake Intelligence / CoWork | [Open Snowflake Intelligence](https://ai.snowflake.com) | Account-restricted; select the deployed agent in your authorized account |
| Local development | [Development server](http://localhost:5173/CableBahamas/) | Local machine; start the app first |
| Production preview | [Local build preview](http://localhost:4173/CableBahamas/) | Local machine; build and start preview first |
| Application audit | [AUDIT.md](AUDIT.md) | Repository documentation |
| Rebrand verification | [VERIFICATION.md](VERIFICATION.md) | Repository documentation; historical verification record |
| Agent and data setup | [Snowflake deployment notes](snowflake/README.md) | Repository documentation |
| Agent benchmark | [snowflake/v2/benchmark-results.json](snowflake/v2/benchmark-results.json) | Repository; 20 questions checked against dashboard values |
| Brand reference | [REV](https://www.rev.bs/) | Public; logo and palette reference, not endorsement |

## Business Description And Process

The demonstration is intended for executive, customer-care, finance, network-operations and B2B teams evaluating how customer context, analytical questions and agentic workflows support decisions. It covers the Cable Bahamas group: **REV fixed broadband, television, fixed voice and business connectivity**, plus **aliv mobile** in a separately labelled sidebar group.

| Version | Where | Chat ("Ask the data") | Sign-in |
| --- | --- | --- | --- |
| Live | Snowpark Container Services (`CABLEBAHAMAS_DEMO.APP.WEB`) | Real Cortex Agent `CABLEBAHAMAS_DEMO.ANALYTICS_V2.CABLE_BAHAMAS_AGENT`, run as the signed-in user; shows its semantic views, SQL, tables, charts and proposed actions | Snowflake |
| Offline | GitHub Pages | Scripted engine over the same fixtures, labelled "Offline demo mode" | Demo entry code |

**The agent's data is generated from the dashboards' own baseline** (`snowflake/v2/generate.ts` imports `src/data/*`), so chat answers and screens agree: for example 74,400 fixed and 180,500 mobile subscriptions, BSD 12M October revenue at a 37.5% EBITDA margin, 220 sites and BSD 16.8M receivables. A reconciliation check confirms each total after loading.

Typical demonstration flow:

1. Review executive indicators and identify a customer, financial or service issue.
2. Drill into fictional customer records, billing context or island-level network scenarios.
3. Ask the chat a question; follow up by island or period ("and in Freeport?").
4. Review the answer's sources and SQL, then approve or reject the action the agent proposes. Decisions are written to `ANALYTICS_V2.ACTION_LOG` with your user name.
5. Launch the matching agentic workflow (hurricane, outage, save desk, B2B quote, collections, URCA filing, incident command).

All records, prices, forecasts, benchmarks and operational metrics are **synthetic**, not company disclosures. The reference date is **31 October 2026**. Independent planning panels on some pages are not an additive company-wide model. Regulatory workflows are illustrative, not legal advice. REVConnect and REVHome are fictional bundle labels, not official offers. Approved actions are recorded, not executed. This is an independent demonstration, not an official Cable Bahamas application.

## Screenshots

Captured from the public web demo on 23 September 2026. These show the existing website, not the separate Snowflake Intelligence interface. Labels such as "live", "Cortex" or "forecast" in these screens describe simulated workflows, not live integrations.

### Executive Dashboard

![Executive dashboard with synthetic indicators and scenario chart](docs/screenshots/executive.png)

### Customer 360

![Customer 360 showing a fictional account and service context](docs/screenshots/customer-360.png)

### Bahamas Network Map

![Bahamas network map showing synthetic regional site health and incidents](docs/screenshots/bahamas-network.png)

## Prerequisites

- Node.js **24** and npm, matching the deployment workflow.
- Git for cloning and contributing changes.
- A browser-scoped CARTO basemap credential for map tiles. The rest of the web app runs without it; missing credentials display a map configuration warning.
- For the live version: an authorized Snowflake account with the `CABLE_BAHAMAS_VIEWER` role. To redeploy: Docker, the Snowflake CLI (`snow`) and an admin connection. Local web development does not require Snowflake.

## Quick Start

From the repository root after cloning the source linked above:

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local development link in the Links table. Enter **`CableBahamas2026`** at the demo gate.

Run the checks and production preview:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

The preview command is provided by the project's npm scripts; it has not been separately smoke-tested in this documentation pass.
<!-- unverified: npm run preview -- --host 127.0.0.1 --port 4173 -->

The entry code is hard-coded client-side and is **not authentication**. Do not place confidential information in this public application.

## Usage

### Web Demo

Use the sidebar to navigate leadership, customer, commercial, operations and data-platform scenarios. Customer 360 contains fictional contacts using reserved email addresses. National maps fit the Bahamas; customer maps use approximate town locations rather than actual service addresses. The transit scenario includes explicitly labeled Florida endpoints.

In the offline version, "Ask the data" and other AI controls are scripted simulations over the shared fixtures. In the live version the chat calls the real Cortex Agent; agentic workflow panels remain scripted in both. For a fixed-services-only story, skip the **aliv Mobile** sidebar group.

Regulatory and market context is Bahamian: URCA, the Data Protection Act (ODPC), Central Bank of The Bahamas, NEMA hurricane resilience, BISX, a BSD pegged 1:1 to the USD, BTC as the named competitor and fictional "Rival ISP A/B/C" for other operators. `tests/rebrand.test.ts` fails if European regulation, institutions or placeholders reappear.

### Live App And Agent

Open the live app link and sign in with Snowflake. Your user needs `CABLE_BAHAMAS_VIEWER` (granted with `GRANT ROLE CABLE_BAHAMAS_VIEWER TO USER <name>`). The same agent is also available in Snowflake Intelligence as **Cable Bahamas Intelligence**.

| Object | Identifier |
| --- | --- |
| Web service and public endpoint | `CABLEBAHAMAS_DEMO.APP.WEB` on compute pool `CABLE_BAHAMAS_POOL` (XS, suspends after 1 hour idle) |
| Agent | `CABLEBAHAMAS_DEMO.ANALYTICS_V2.CABLE_BAHAMAS_AGENT` (mirror: `SNOWFLAKE_INTELLIGENCE.AGENTS.CABLE_BAHAMAS_AGENT`) |
| Data and 9 semantic views | `CABLEBAHAMAS_DEMO.ANALYTICS_V2` |
| Proposed actions | `ANALYTICS_V2.ACTION_LOG`, written by the agent's `PROPOSE_ACTION` procedure and decided in the app |
| Roles | `CABLE_BAHAMAS_APP` owns the service; `CABLE_BAHAMAS_VIEWER` for users |
| Warehouse | `DC_WAREHOUSE` |

The service runs with **caller's rights**: every query runs as the signed-in user, limited to the overlap of that user's privileges and the service owner's caller grants, which are scoped to `ANALYTICS_V2` with writes only on `ACTION_LOG`. No credentials are stored in the container. The previous fixed-only agent and its data remain in `CABLEBAHAMAS_DEMO.ANALYTICS` for rollback.

Example questions: *How are we doing this month? · Which island has the highest churn? · Are there any outages right now? · Are we ready for hurricane season? · How much debt is more than 60 days overdue? · What is the open B2B pipeline? · How many mobile subscribers do we have by plan type?*

Answers typically take 15–35 seconds. Rebuild and redeploy steps are in [snowflake/README.md](snowflake/README.md).

## Configuration

| Setting | Purpose | Handling |
| --- | --- | --- |
| `VITE_CARTO_BASEMAP_KEY` | Browser basemap credential consumed by the Vite build | Supply through the approved secret manager or CI environment; never commit its value |
| `CARTO_BASEMAP_KEY` | GitHub Actions repository secret | Workflow maps it to the Vite build variable |
| `/CableBahamas/` | Vite asset base | Configured in `vite.config.ts`; retain for the project Pages URL |
| Hash routing | Client-side route navigation | Allows direct portal links on GitHub Pages |
| `src/data/scenario.ts`, `src/data/islands.ts` | Shared baseline, financial history and island split | Source for both the dashboards and the agent dataset |
| `VITE_CHAT_MODE=live` | Switches the chat to the real agent and skips the demo gate | Set only by `npm run build:spcs` for the Snowflake container |
| `snowflake/v2/`, `spcs/`, `server/` | Agent data generator, semantic views and agent spec, container service and backend | Deployment requires an admin Snowflake connection |

For local map setup in Cortex Code, use `/secrets` to manage the credential and ask the assistant to start the app with the stored key. Do not paste credentials into chat or source files.

The CARTO key is intentionally **browser-visible** in deployed JavaScript and tile requests, even when supplied through an encrypted Actions secret. Limit it to basemap permissions and approved origins. Provider-side restrictions were not verified. CARTO and OpenStreetMap attribution must remain visible.

GitHub Actions runs tests, checks the basemap secret, builds the application and deploys GitHub Pages on pushes to `main` or manual workflow dispatch. Build output and dependencies are ignored by Git. No server-side database credentials belong in the public build.

## Status, License And Contributing

- The offline demo deploys through GitHub Actions on pushes to `main`. The live app deploys with `spcs/deploy.sh`; it is not redeployed automatically.
- Tests: 24 passing, covering coherence, routing, branding, island reconciliation and chat routing.
- Agent benchmark (3 November 2026): **20 of 20** questions matched dashboard values or correctly declined, averaging 25 seconds; the agent proposed an action in 8 answers. See `snowflake/v2/benchmark-results.json`. This does not establish accuracy on all unseen questions.
- Known follow-ups: grant `CABLE_BAHAMAS_VIEWER` to each demo user; automate the container deploy; keep the offline engine and agent aligned when fixtures change (rerun the generator, load and benchmark).
- No license file is currently provided. Do not assume open-source reuse rights. Brand assets remain subject to their owners' rights.
- No contribution guide is present. Discuss proposed changes with the repository owner before submitting them.
