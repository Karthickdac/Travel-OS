---
name: Public city autocomplete
description: Why the public enquiry form uses a server-side geocoding proxy instead of the per-company Google Maps key
---

# Public city autocomplete

The public enquiry form's From/To city fields autocomplete via a **server-side
geocoding proxy** (`GET /api/v1/public/geocode?q=`) backed by Photon (OpenStreetMap),
not the per-company `googleMapsKey` setting.

**Why:**
- The public form is unauthenticated and tenant-agnostic, so there is no reliable
  company `googleMapsKey` to read, and exposing any key client-side is undesirable.
- Photon needs no API key and no billing, so it works out of the box on every tenant.
- A server proxy avoids CORS, keeps any future key server-side, and centralises
  caching + rate limiting.

**How to apply:**
- The proxy is India-biased (lat/lon + location_bias_scale) but returns global cities.
- It fails soft (always returns `{ suggestions: [] }`, even on upstream errors), so the
  client `AutocompleteInput` falls back to the static `POPULAR_DESTINATIONS` list.
- It has in-memory caching + naive per-IP rate limiting; keep those if you refactor.
- `AutocompleteInput` clears its remote results on every keystroke to prevent stale
  suggestions from a previous query overriding the current one — preserve that behavior.
