import { Router, type IRouter, type Request } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, companiesTable, websiteSettingsTable, destinationsTable, tourPackagesTable } from "@workspace/db";

// Serves per-tenant robots.txt and sitemap.xml at the domain root so each
// customer website is fully crawlable. Mounted at the app root (NOT under
// /api) and routed to this service via the api-server artifact paths.
const router: IRouter = Router();

function normalizeHost(h: string): string {
  return h.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/:\d+$/, "").toLowerCase();
}

// Accept only RFC-compliant hostname characters (optionally with a port). This
// is the trust boundary: the requested host comes from client-controllable
// headers, so anything else is rejected before it can reach the output.
function isValidHost(h: string): boolean {
  return h.length <= 253 && /^[a-zA-Z0-9.-]+(:\d+)?$/.test(h);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function resolveCompanyIdByDomain(domain: string): Promise<string | null> {
  const normalized = normalizeHost(domain);
  if (!normalized || normalized === "localhost" || normalized.endsWith(".replit.dev") || normalized.endsWith(".replit.app")) {
    return null;
  }
  const companies = await db.select({ id: companiesTable.id, domain: companiesTable.domain }).from(companiesTable);
  const match = companies.find((c) => {
    if (!c.domain) return false;
    const stored = normalizeHost(c.domain);
    return stored === normalized || stored === `www.${normalized}` || `www.${stored}` === normalized;
  });
  return match?.id ?? null;
}

function getRequestedHost(req: Request): string {
  const fwd = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
  return fwd || req.headers.host || "";
}

// Derives a safe canonical base URL and the resolved tenant. For a known
// tenant the URL is built from the DB-stored domain (authoritative, immune to
// host-header spoofing). For unknown-but-valid hosts (e.g. the *.replit.app
// deployment URL, or dev via ?domain=) the validated host is used as-is.
async function resolveCanonical(req: Request): Promise<{ base: string; companyId: string | null } | null> {
  const rawHost = ((req.query.domain as string | undefined) || getRequestedHost(req)).trim();
  if (!rawHost || !isValidHost(rawHost)) return null;

  const companyId = await resolveCompanyIdByDomain(rawHost);
  if (companyId) {
    const [c] = await db.select({ domain: companiesTable.domain }).from(companiesTable).where(eq(companiesTable.id, companyId));
    const canonicalHost = c?.domain ? normalizeHost(c.domain) : normalizeHost(rawHost);
    return { base: `https://${canonicalHost}`, companyId };
  }

  const host = normalizeHost(rawHost);
  const proto = host === "localhost" || host.startsWith("127.") ? "http" : "https";
  return { base: `${proto}://${host}`, companyId: null };
}

const PUBLIC_PATHS: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/packages", priority: "0.9", changefreq: "weekly" },
  { path: "/destinations", priority: "0.9", changefreq: "weekly" },
  { path: "/enquiry", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
];

// Mirrors the public catalog endpoints' behavior: when the host maps to no
// tenant, fall back to the first company so the sitemap lists exactly the
// URLs the rendered site links to.
async function resolveContentCompanyId(companyId: string | null): Promise<string | null> {
  if (companyId) return companyId;
  const [firstCompany] = await db
    .select({ id: companiesTable.id })
    .from(companiesTable)
    .orderBy(asc(companiesTable.id))
    .limit(1);
  return firstCompany?.id ?? null;
}

router.get("/robots.txt", async (req, res): Promise<void> => {
  const resolved = await resolveCanonical(req);
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /master",
    "Disallow: /portal",
    "Disallow: /login",
    "Disallow: /api",
  ];
  if (resolved?.base) lines.push(`Sitemap: ${resolved.base}/sitemap.xml`);
  res.type("text/plain").send(lines.join("\n") + "\n");
});

router.get("/sitemap.xml", async (req, res): Promise<void> => {
  const resolved = await resolveCanonical(req);
  if (!resolved) {
    res.status(404).type("text/plain").send("Not found\n");
    return;
  }
  const { base, companyId } = resolved;

  let lastmod = new Date().toISOString();
  try {
    if (companyId) {
      const [ws] = await db
        .select({ updatedAt: websiteSettingsTable.updatedAt })
        .from(websiteSettingsTable)
        .where(eq(websiteSettingsTable.companyId, companyId));
      if (ws?.updatedAt) lastmod = new Date(ws.updatedAt).toISOString();
    }
  } catch (err) {
    req.log?.error({ err }, "sitemap lastmod lookup failed");
  }

  const entries = PUBLIC_PATHS.map(
    ({ path, priority, changefreq }) =>
      `  <url>\n    <loc>${xmlEscape(base + path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  );

  try {
    const contentCompanyId = await resolveContentCompanyId(companyId);
    if (contentCompanyId) {
      const [dests, pkgs] = await Promise.all([
        db
          .select({ id: destinationsTable.id, updatedAt: destinationsTable.updatedAt })
          .from(destinationsTable)
          .where(eq(destinationsTable.companyId, contentCompanyId)),
        db
          .select({ id: tourPackagesTable.id, updatedAt: tourPackagesTable.updatedAt })
          .from(tourPackagesTable)
          .where(and(eq(tourPackagesTable.isActive, true), eq(tourPackagesTable.companyId, contentCompanyId))),
      ]);
      for (const d of dests) {
        const mod = d.updatedAt ? new Date(d.updatedAt).toISOString() : lastmod;
        entries.push(
          `  <url>\n    <loc>${xmlEscape(`${base}/destinations/${d.id}`)}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        );
      }
      for (const p of pkgs) {
        const mod = p.updatedAt ? new Date(p.updatedAt).toISOString() : lastmod;
        entries.push(
          `  <url>\n    <loc>${xmlEscape(`${base}/packages/${p.id}`)}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        );
      }
    }
  } catch (err) {
    req.log?.error({ err }, "sitemap dynamic urls lookup failed");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
  res.type("application/xml").send(xml);
});

export default router;
