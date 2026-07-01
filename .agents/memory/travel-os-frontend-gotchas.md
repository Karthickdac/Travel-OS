---
name: TravelOS frontend gotchas
description: Recurring non-obvious frontend pitfalls in the travel-os public site (framer-motion typing, dead stock image URLs)
---

## framer-motion `ease` widening to `string`
In typed `Variants` or function-variant objects, a bare string like `ease: "easeOut"` widens to `string`, which does not satisfy framer-motion's `Easing` type → TS error. Fix with `ease: "easeOut" as const`.

## Dead Unsplash photo IDs cause 404s
Some Unsplash `photo-<id>` URLs used in public pages 404 at runtime (images silently fail to load) even though the page compiles fine. Verify hero/section images actually load in a screenshot after editing. When one is dead, swap the photo ID for a known-good Unsplash landscape ID.

**How to apply:** After any change touching public page imagery, take a screenshot to confirm images render — typecheck will not catch broken image URLs.
