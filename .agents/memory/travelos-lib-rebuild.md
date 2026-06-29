---
name: TravelOS lib rebuild rule
description: Must run typecheck:libs before api-server typecheck after DB schema changes
---

After adding new tables or exports to `lib/db/src/schema/`, the compiled `.d.ts` declarations become stale. The api-server then gets TS2305 errors ("Module '@workspace/db' has no exported member 'xTable'") even though the source is correct.

**Fix:** Run `pnpm run typecheck:libs` first to rebuild all lib declarations, then `pnpm --filter @workspace/api-server run typecheck`.

**Why:** lib packages are composite and emit declarations via `tsc --build`. Leaf packages (api-server) read the compiled .d.ts, not the source. Stale .d.ts = missing exports.

**How to apply:** Any time lib/db schema files change, always run typecheck:libs before any leaf typecheck.
