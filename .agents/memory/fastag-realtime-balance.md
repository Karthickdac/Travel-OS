---
name: FASTag realtime balance
description: How TravelOS keeps FASTag balances current without a bank/NETC API, and the security model for the SMS webhook.
---

# FASTag realtime balance via bank SMS

Direct NETC/bank FASTag *balance* APIs require a commercial bank partnership and are not publicly available. The working alternate used in TravelOS: parse the bank's FASTag transaction SMS — every toll deduction and recharge SMS reliably carries the live "available balance". Parsing it gives near-realtime balances with zero partnership.

Two entry points share one parser (`api-server/src/lib/fastagSms.ts`):
- `POST /v1/fleet/fastag/sms-sync` — authenticated, paste an SMS in the UI.
- `POST /v1/fleet/fastag/sms-webhook` — unauthenticated automation for SMS-forwarding apps.

## Parser gotcha
**Direction detection must check credit BEFORE debit.** The word "recharged" contains the substring "charged" (a debit keyword), so a debit-first check misclassifies recharges. Only matters for the fallback path (when the SMS has no explicit balance), but it silently corrupts balances there.

## Webhook tenant-isolation decision
The webhook is unauthenticated, so it MUST NOT use a single global token with global tag matching — that lets any tenant mutate other tenants' balances.
**Rule:** the webhook token is per-company, derived as `HMAC-SHA256(SESSION_SECRET, "fastag-sms:"+companyId)` (hex). The URL carries `?company=<id>&token=<hmac>`; the handler recomputes the expected token (timing-safe compare) and scopes all matching to that company only. No per-row secret, no schema migration.
**Why:** an architect review flagged the original global-token design as a cross-tenant write vulnerability.
**How to apply:** any unauthenticated webhook that mutates tenant data in this app should encode + verify the tenant from a derived secret and scope DB queries to it.

**Fail-closed:** token derivation must refuse a missing/weak signing key — never `SESSION_SECRET ?? ""`. If the secret is absent the URL endpoint returns `configured:false` and the webhook returns 500, so tokens are never derivable from an empty key.

## SMS→tag matching ambiguity
Match by normalized vehicle number first, then tag last-4. If MORE THAN ONE tag matches (realistic for last-4 collisions), return 409 rather than first-match — never guess which tag to mutate. Fleet write endpoints exclude the `customer` role (customers belong to a company and could otherwise mutate fleet data).
