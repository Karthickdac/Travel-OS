---
name: Notifications & quotation sharing
description: How in-app notifications and public quotation links/WhatsApp sending work.
---

# Notifications & quotation sharing

- In-app notifications are company-scoped rows in `notifications`; created server-side via the fire-and-forget `createNotification` helper (never throws into the request). Wire new business events through it, not ad-hoc inserts.
- Quotation statuses are `draft, sent, approved, rejected, expired, converted` — **never** "accepted". **Why:** UI once used "accepted" while API enum said "approved", breaking Zod response validation on update.
- Quotations are shared via `publicToken` (uuid): public page `/quote/<token>`; unauth API under `/v1/public/quotations/:token`. The respond endpoint must only allow status `sent`, non-expired (`validUntil >= today`), not yet responded — guards live server-side, not just in UI.
- Public quotation URL is built from `companies.domain` when set (`https://<domain>/quote/<token>`), else relative.
- Sending is one click: `POST /v1/crm/quotations/:id/send` sets sent+sentAt and returns publicUrl + wa.me link. WhatsApp deep links: strip non-digits, prefix 91 for 10-digit Indian numbers (`buildWhatsAppUrl` in travel-os lib, mirrored server-side). No WhatsApp API/keys — links only.
- Frontend bell polls `useListNotifications` every 30s; after mutations invalidate with the generated `get*QueryKey()` helpers (hand-written key arrays won't match Orval's path-style keys).
