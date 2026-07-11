---
name: Public site performance
description: Why the public tenant sites were slow and the patterns that fix it — keep these when adding pages/images.
---

# Public tenant site performance

Two structural perf sinks existed on the public travel websites; both are now fixed. Keep these patterns:

## 1. Hero images must be WebP, not PNG
The 5 hero slideshow images were full-res PNGs totalling ~8MB (~1.6MB each, 1408x768). Converted to WebP → ~652KB total (~100-170KB each) at quality 80, no visible quality loss.
- Convert with ImageMagick (`sharp` is NOT installed): `magick in.png -quality 80 -define webp:method=6 out.webp`.
- **How to apply:** any new hero/marketing image added to `artifacts/travel-os/public/images` should be WebP. Never commit multi-MB PNG/JPEG heroes.

## 2. Routes must stay React.lazy() code-split
`App.tsx` originally eager-imported ~70 page components, so a public visitor's initial bundle contained the ENTIRE admin+master ERP (incl. Recharts ~384KB, Leaflet ~154KB). All pages are now `lazy(() => import(...))` with a `<Suspense fallback={<PageFallback/>}>` inside each portal layout's `<Switch>` (Master/Admin/Portal/Public) and around the top-level `/login` + `/quote` routes. Layouts, NotFound, ProtectedRoute, AdminOnly stay eager.
- **Why:** heavy admin-only libs now emit as their own chunks loaded on demand, so public visitors never download them.
- **How to apply:** when adding a page to `App.tsx`, add it as a `lazy()` const, not a static import — otherwise it re-bloats the shared bundle. A `ChunkErrorBoundary` (reload-once on stale-chunk failure after a deploy) wraps the router; keep it.

## 3. React Query staleTime is global at 60s
Short on purpose: long enough to dedupe rapid navigation refetches, short enough that admin/ERP data (bookings, fleet) stays current. Do not raise it globally — scope longer staleTimes per-query if a specific public dataset needs it.
