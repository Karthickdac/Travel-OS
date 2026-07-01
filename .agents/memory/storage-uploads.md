---
name: Object storage image uploads
description: How local image uploads work in TravelOS and the auth/access decisions behind them
---

# Image uploads (pluggable object storage)

All image fields across the admin/CMS UI use local file upload (no URL text inputs) via a two-step request-url → PUT flow. The storage layer is **pluggable** via `STORAGE_BACKEND` env: default = Replit Object Storage (GCS sidecar at `127.0.0.1:1106`, only works on Replit); `local` = filesystem backend for self-hosting on a VPS.

## Backends
- **Replit/GCS (default):** presigned GCS PUT URL via sidecar. Won't work off Replit (sidecar absent).
- **Local (`STORAGE_BACKEND=local`):** writes to `LOCAL_STORAGE_DIR` (default `<repo>/storage-data`) under `private/uploads/<uuid>` + `<uuid>.meta.json` (contentType). The upload URL is an **absolute same-origin** URL (built from req host/`X-Forwarded-Proto`) pointing at `PUT /api/storage/upload-target/<uuid>?exp&sig`, signed with HMAC-SHA256(`objectId:exp`, `SESSION_SECRET`). The response schema requires `format: uri`, so a relative URL fails Zod — must be absolute. `SESSION_SECRET` is mandatory for local signing.
  - **Why:** self-hosting (e.g. VPS at kyro360.in) has no Replit sidecar; local disk needs no external service.
  - Size cap 10MB enforced twice (Content-Length precheck + streaming byte backstop); partial files cleaned up on failure; path-traversal guarded on disk reads.

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
