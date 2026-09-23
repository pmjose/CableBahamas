# Cable Bahamas C360

Local customer-intelligence demonstration for Cable Bahamas, with REV fixed-service and aliv mobile identities. React 18, TypeScript, Vite, Tailwind, Recharts and Leaflet.

## Data And Scope

All customers, prices, financial results, benchmarks, forecasts and operational metrics are synthetic. Advanced network capabilities (including 5G SA and slicing) are hypothetical planning scenarios, not claims about deployed networks. Regulatory workflows are illustrative, not statements of Bahamas law. EU frameworks retained in scenario pages are comparison frameworks, not Bahamas obligations.

REVConnect and REVHome are fictional scenario bundle labels, not official REV or aliv offers.

This is an independent demonstration, not an official company application. The REV logo and palette were sourced from https://www.rev.bs/ on 2026-09-22. The website identifies REV services as available to Family Island customers; the wider portal models group-level scenarios across the Bahamas and aliv mobile. Product bundles and prices in the demo are not commercial offers.

There is no backend or live Snowflake connection. AI answers are scripted simulations. The entry code is `CableBahamas2026`; this client-side gate is not security and must not protect sensitive data.

## Run Locally

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173/CableBahamas/`.

## Verify

```bash
npm test
npm run build
```

The app uses hash routing and the `/CableBahamas/` asset base. GitHub Actions runs tests, builds and deploys to Pages on pushes to `main`.

## Maps And Deployment

The build reads `VITE_CARTO_BASEMAP_KEY`. GitHub Actions supplies it from repository secret `CARTO_BASEMAP_KEY`. The value is never committed to source. This is a browser basemap credential: visitors can inspect it in deployed JavaScript and tile requests. Restrict its permissions and allowed origins in the provider account. Missing keys display a configuration warning rather than requesting unkeyed tiles.

National maps fit the Bahamas bounds. Customer maps use town-level synthetic locations, not actual service addresses. The network transit scenario includes clearly labelled Florida endpoints. CARTO and OpenStreetMap attribution remains visible.

## Scenario Consistency

`src/data/scenario.ts` owns the May 2026 synthetic baseline and financial history. Shared site and subscription facts, CEO snapshot, finance/CFO statements and supported assistant answers reconcile to it. Other operating panels are independent planning exercises; their populations, periods and forecasts are not additive company totals. See `AUDIT.md` for coverage and limitations.
