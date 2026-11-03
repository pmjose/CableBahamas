# Agent Evaluation

Agent: `CABLEBAHAMAS_DEMO.ANALYTICS.CABLE_BAHAMAS_AGENT`
Account: `SFSEEUROPE.PJOSE_AWS3`
Evaluation date: 2026-09-23. Data reference date: 2026-05-31.

## Coverage

Seven read-only Analyst tools cover customers and modeled risk, finance, fixed network, support, billing, B2B pipeline and product economics. There are no document-search, external integration or write-action tools. The dataset includes 1,200 fictional accounts, eight products, 28 sites with 31 daily snapshots, 480 support cases and 80 B2B opportunities; finance and invoices cover June 2025 through May 2026.

## Observed Results

Fifteen live agent calls were reviewed against SQL-derived expected answers. Twelve supported data questions returned correct values; all three boundary questions were handled appropriately. This is a small curated demonstration benchmark, not a claim of 100% accuracy on unseen questions.

| Question | Expected / observed |
| --- | --- |
| Account count | 1,200 |
| High-risk accounts | 300, 25% |
| May revenue / EBITDA | BSD 174,600 / BSD 73,572 |
| Network sites | 28, four per island |
| Open cases | 96 |
| Debt >60 days overdue | BSD 97,515 |
| Open / weighted pipeline ACV | BSD 446,400 / BSD 214,320 |
| Win rate | 50%, 16 won / 32 closed |
| Highest unit direct margin | Business Dedicated Gigabit, BSD 390 |
| Latest revenue | May 2026, BSD 174,600 |
| Finance vs billing reconciliation | BSD 174,600 each, zero difference |
| Single-day homes passed | 19,320, not 31 times the snapshot |
| Mobile / 5G | Out-of-scope, no invented result |
| Cancel customers / delete invoices | Refused; no write tool |
| Actual churn / forecast | Explicitly unavailable, risk score not churn events |

Seven independent integrity checks returned zero failures: duplicate customers, support before customer join, closure before opportunity creation, financial identity, coordinate bounds, mobile products and monthly billing/revenue mismatch.

Initial semantic naming collisions were repaired before deployment. Initial live answers recovered from fact-alias SQL errors; facts were renamed to match the verified SQL contracts and the full suite rerun. The final cross-domain trace contains successful query IDs `01c7431a-0002-1de8-0001-3926064de6da` and `01c7431a-0002-1da8-0001-3926064df42a`, without the prior compilation errors. One answer used misleading wording about measured billing data despite its synthetic prefix; the agent instructions were strengthened and a targeted provenance retest was run.

## Limits And Access

- No historical disconnect/churn events, field-work orders, campaign ROI, pricing elasticity or predictive forecasting dataset is loaded. The agent must state those limits rather than claim those demo screens are supported.
- All metrics are synthetic. The agent dataset is independent from the public app's scenario values and is not a financial representation of the company.
- Only the existing owning role ACCOUNTADMIN has agent ownership. No PUBLIC or broad role grants were added. Users selecting other roles may not see it until least-privilege access is explicitly configured.
- Read-only means the deployed agent has only analytical tools and no action tools. This is not a replacement for least-privilege user roles; do not give end users ACCOUNTADMIN.
- No account-level Snowflake Intelligence object exists. Automatic discovery of the demo-namespace agent did not make it visible to the user. The account already holds 33 agents in the legacy `SNOWFLAKE_INTELLIGENCE.AGENTS` schema, so a UI-facing mirror was added there as `SNOWFLAKE_INTELLIGENCE.AGENTS.CABLE_BAHAMAS_AGENT`, using the same seven semantic tools. No existing agents or broad grants were changed.

Open https://ai.snowflake.com, select account SFSEEUROPE / PJOSE_AWS3 and the display name **Cable Bahamas Fixed Services Intelligence**. For this initial owner test use the current authorized role and DC_WAREHOUSE. The public GitHub demo is not wired to this agent.

Reproducible scripts, tracked semantic/agent specs and the raw final test responses are in this directory. Nothing from this agent deployment was committed or pushed to the public repository.
