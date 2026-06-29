---
name: TravelOS auth token injection
description: How the Bearer token gets from localStorage into every API request
---

The custom fetch (`lib/api-client-react/src/custom-fetch.ts`) supports `setAuthTokenGetter(getter)`. When set, it calls the getter before each fetch and attaches `Authorization: Bearer <token>` if a non-null string is returned.

In `artifacts/travel-os/src/lib/auth-context.tsx`, the `AuthProvider` calls `setAuthTokenGetter(() => token)` inside a `useEffect` that re-runs whenever `token` changes. On logout it calls `setAuthTokenGetter(null)`.

**Why:** This is the correct pattern for web apps in this monorepo. Do NOT use session cookies or pass token through QueryClient defaultOptions — the custom fetch handles injection transparently.

**How to apply:** If adding a new web artifact that calls the same API, use the same pattern: import `setAuthTokenGetter` from `@workspace/api-client-react` and register a getter in the auth context.

Token format: `base64(userId:timestamp:travelos)` — SHA256+salt hash is used for verification on the server, not embedded in the token.
