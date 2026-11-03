# Cable Bahamas Intelligence (Snowflake)

The live chat in the Cable Bahamas app is a real Cortex Agent over `CABLEBAHAMAS_DEMO.ANALYTICS_V2`. Its data is generated from the same files that drive the web dashboards, so answers and screens agree. All data is synthetic, as of **31 October 2026**, in BSD.

## What is deployed

| Object | Purpose |
| --- | --- |
| `CABLEBAHAMAS_DEMO.ANALYTICS_V2` (15 tables) | Customers (74,400 fixed), customer movements, aliv mobile lines (180,500), monthly finance, receivables, support contacts, network sites (220) and daily availability, incidents, URCA QoS, fraud, B2B accounts and pipeline, products, `ACTION_LOG` |
| 9 semantic views | `CUSTOMER`, `MOBILE`, `FINANCE`, `BILLING`, `SERVICE`, `NETWORK`, `OPERATIONS`, `B2B`, `PRODUCT` `_ANALYTICS` |
| `PROPOSE_ACTION` procedure | Agent tool. Inserts a `PENDING_APPROVAL` row into `ACTION_LOG`; never executes anything |
| `ANALYTICS_V2.CABLE_BAHAMAS_AGENT` | The agent the app calls; mirrored to `SNOWFLAKE_INTELLIGENCE.AGENTS.CABLE_BAHAMAS_AGENT` |
| `CABLEBAHAMAS_DEMO.APP.WEB` | Container service (Node/Express) serving the app and `/api/chat`, with caller's rights |

The original fixed-only dataset and agent in `CABLEBAHAMAS_DEMO.ANALYTICS` (31 May 2026) are unchanged and can be used for rollback.

## Rebuild after changing the web fixtures

From the repository root, with the admin connection `PJOSE_AWS3_ADMIN`:

```bash
npx tsx snowflake/v2/generate.ts                                   # CSVs + expected totals → snowflake/v2/out (git-ignored)
snow sql -c PJOSE_AWS3_ADMIN -f snowflake/v2/load.sql             # create/replace ANALYTICS_V2 tables
snow sql -c PJOSE_AWS3_ADMIN -f snowflake/v2/propose_action.sql   # agent tool procedure
node snowflake/v2/build_specs.cjs views                           # 9 semantic views
node snowflake/v2/build_specs.cjs agent                           # writes specs/CABLE_BAHAMAS_AGENT.agent.yaml
snow sql -c PJOSE_AWS3_ADMIN --enable-templating NONE -f snowflake/v2/agent.sql   # create both agent copies
node snowflake/v2/benchmark.cjs                                   # 20 questions vs dashboard values
```

`agent.sql` embeds the spec from `specs/CABLE_BAHAMAS_AGENT.agent.yaml`; regenerate it after changing the agent spec. After loading, compare totals in Snowflake with `snowflake/v2/out/expected.json`: every value (customers, revenue, EBITDA, receivables, sites, homes passed, incidents, pipeline) must match exactly. Recreating the agent drops its grants, so rerun section 2 of `spcs/setup.sql` afterwards.

## Container service

```bash
snow sql -c PJOSE_AWS3_ADMIN --enable-templating NONE -f spcs/setup.sql   # roles, pool, repo, caller grants (once)
VITE_CARTO_BASEMAP_KEY="CARTO_BASEMAP_KEY" spcs/deploy.sh                 # build linux/amd64 image, push, create/alter service
```

Run the deploy from Cortex Code so the CARTO key is injected from the secret store. After the first deploy, run the commented `GRANT SERVICE ROLE` line at the end of `setup.sql`. New endpoint hostnames can take several minutes to resolve in DNS.

- **Caller's rights.** Queries run as the signed-in user, limited to the intersection of that user's privileges and the caller grants on `CABLE_BAHAMAS_APP` (USAGE on the database, `ANALYTICS_V2` schema, warehouse and agent; SELECT on `ANALYTICS_V2` tables and semantic views; INSERT/UPDATE on `ACTION_LOG` only; USAGE on `PROPOSE_ACTION`).
- **Access.** Give a user access with `GRANT ROLE CABLE_BAHAMAS_VIEWER TO USER <name>`. Caller's-rights sessions use the user's default role plus default secondary roles.
- **Cost.** One XS compute-pool node while active (auto-suspends after 1 hour), plus warehouse time for each agent answer.

## Limits

Historical churn events, campaign ROI, pricing elasticity and forecasts are not loaded; the agent says so. Churn risk and CLV are modelled values. Wording varies between runs because answers are generated, but every number comes from tool results over `ANALYTICS_V2`.
