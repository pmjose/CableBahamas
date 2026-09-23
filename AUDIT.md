# Cable Bahamas Demo Audit

## Scope

Static synthetic demonstration audited on 2026-09-23. The baseline date is 2026-05-31. No actual company financial results, customer records or licensed spectrum holdings are asserted.

## Findings And Repairs

| Finding | Repair | Evidence |
| --- | --- | --- |
| Headline financials retained incompatible scales | Shared scenario source; monthly revenue BSD 12M, EBITDA BSD 4.5M; CEO and Finance/CFO statement values derive from it | Coherence tests and production build |
| Fixed customer movements did not reconcile | Gross adds 1,118 minus losses 818 equals net adds 300 | Coherence test |
| Site totals disagreed across views | Shared total 220 = 160 owned + 60 shared; NOC regions reconcile | Data inspection and tests |
| Geographic subscriber/footprint sums exceeded baseline | Allocated geographic subscriptions to 74,400 and passed premises to 140,000 | Fixture repair |
| Bundle model could emit NaN with strong retention | Nonnegative hazard; zero-churn boundary handled | Boundary tests |
| CPE charged upfront and again through depreciation | Cash contribution no longer deducts depreciation; refresh cash included in discounted flows | Cash-flow tests |
| Post-promotion billing used blended tariff | Actual month uses promotional or full tariff, then bad debt and escalation | Tariff test |
| Unsupported AI questions returned unrelated revenue | Explicit no-match answer; supported revenue, subscriber, ARPU and customer answers use shared fixtures | Answer tests and browser check |
| Customer tenure inconsistent with snapshot | Corrected May 2026 tenure and outdated new-customer status | Customer review |
| Legacy content and market references | Local scenario broadcasters and fictional partner names; removed corrupted text | Source inspection |
| Random fixtures changed between sessions | Seeded generators per module | Determinism test |
| Unkeyed CARTO URLs | Environment-supplied key for all three styles; fail closed if missing | Loaded keyed tiles in browser, credential not logged |
| National map views could omit southern islands | Fit national maps to Bahamas bounds; town drilldowns preserved | Geographic tests and browser inspection |
| Dependency advisories | Upgraded React Router and Vite/plugin; migrated chunk config; Node 24 CI | npm audit: zero vulnerabilities |
| Deployment lacked tests and credential validation | Actions tests before build and checks required repository secret | Workflow review |

## Verification

- 15 regression tests pass across navigation, identity, geography, numerical relationships, cash flow, answer routing and map configuration.
- TypeScript and production build pass on Vite 8.
- All 93 routes rendered in the local browser without missing headings, error boundaries, NaN or Infinity in their initial views.
- Keyed map tiles loaded; visible attribution names CARTO and OpenStreetMap.
- No credentials are included in source, lockfiles or commits. The approved basemap credential is intentionally browser-visible in deployed assets and requests.

## Interpretation Limits

This is not a certified, fully reconciled financial model. Shared baseline facts and the principal financial statements are reconciled. Other independently authored operational panels model separate planning exercises, with different populations and periods; they are not additive company results. A persistent notice makes that distinction explicit. Regulatory, investment, competitive and network-capability scenarios are illustrative and require domain-owner approval before use as factual recommendations.

Route smoke coverage is not exhaustive verification of every tab, export, slider combination or scenario formula. Browser checks and tests establish the listed coverage, not a guarantee that all possible interactions are correct. The client-side entry code is not authentication and the public site must never contain confidential data.

## Publishing

The user explicitly approved public repository `pmjose/CableBahamas`, Actions-based GitHub Pages, and the basemap key being visible to site visitors. The key is stored as an Actions secret and injected only at build time. Provider-side domain restrictions were not changed or verified; restrict the key to the published origin and basemap-only permissions.
