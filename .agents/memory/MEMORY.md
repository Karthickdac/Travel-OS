# Memory Index

- [API Server dev restart](api-server-dev-restart.md) — api-server dev builds once at startup; restart the workflow after route/spec/lib changes or you'll test a stale bundle.
- [VPS deployment](vps-deployment.md) — 5 tenant sites run on user's CloudPanel VPS, not Replit; deploy = user git pull + node build + systemctl restart, never pnpm.
- [Tenant scoping](tenant-scoping.md) — isolation is enforced per-handler (no central guard); every admin route must filter by req.user.companyId or it leaks across tenants.
