---
name: Object storage image uploads
description: How local image uploads work in TravelOS and the auth/access decisions behind them
---

# Image uploads (Replit Object Storage)

All image fields across the admin/CMS UI use local file upload (no URL text inputs), backed by Replit Object Storage via a presigned-PUT flow.

## Routing
- Storage routes are mounted under `/api` (NOT `/api/v1`). Endpoints: `POST /api/storage/uploads/request-url`, `GET /api/storage/objects/*`, `GET /api/storage/public-objects/*`.
- The proxy routes `/api` → api-server; the app's own `router.use(storageRouter)` mounts them.

## Access model (deliberate)
- **Upload-URL minting requires auth.** `POST /storage/uploads/request-url` rejects requests without `req.user` (401) and enforces image-only MIME + 10MB size before signing.
  - **Why:** anonymous URL minting lets anyone write to the bucket (cost/abuse). Flagged by architect review.
  - **How to apply:** `req.user` is attached by the global Bearer-token middleware in `routes/index.ts`. The client hook (`lib/use-upload.ts`) must send `Authorization: Bearer <localStorage 'token'>`.
- **Object serving is intentionally public** (`GET /storage/objects/*` has no auth/ACL). These are public website assets (logos, package covers, hero/blog images) rendered on the customer-facing site, so they must load without a token. Do not add auth here unless the asset class changes to private.

## Data model
- The DB stores the **full serving URL** (`/api/storage/objects/...`), not the bare objectPath, so existing `<img src={value}>` render unchanged. `objectServingUrl(objectPath)` builds it. Trade-off accepted: simpler render path vs. tighter coupling to the route prefix.
