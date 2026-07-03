import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, websiteSettingsTable, destinationsTable, tourPackagesTable } from "@workspace/db";
import { resolveCanonical } from "./seo_files";

// Serves the SPA's index.html with per-tenant, per-page SEO meta baked in
// (title, description, canonical, Open Graph, Twitter, JSON-LD) so crawlers
// see real content on first fetch instead of the static placeholder head.
// The client-side useSeo hook upserts the same tags/ids at runtime, so the
// two layers never duplicate elements.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Portal/auth routes are disallowed in robots.txt and get the untouched shell.
const NON_PUBLIC_PREFIXES = ["/admin", "/master", "/portal", "/login"];

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, max = 160): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 100)) + "…";
}

interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  canonical: string;
  siteJsonLd: Record<string, unknown>;
  pageJsonLd?: Record<string, unknown>;
}

interface SiteSettings {
  displayName: string;
  logoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

async function loadSettings(companyId: string): Promise<SiteSettings | null> {
  const [ws] = await db
    .select({
      displayName: websiteSettingsTable.companyDisplayName,
      logoUrl: websiteSettingsTable.logoUrl,
      metaTitle: websiteSettingsTable.metaTitle,
      metaDescription: websiteSettingsTable.metaDescription,
      metaKeywords: websiteSettingsTable.metaKeywords,
    })
    .from(websiteSettingsTable)
    .where(eq(websiteSettingsTable.companyId, companyId));
  if (!ws) return null;
  return { ...ws, displayName: ws.displayName || "TravelOS" };
}

async function buildMeta(req: Request): Promise<PageMeta | null> {
  const reqPath = req.path.replace(/\/+$/, "") || "/";
  if (NON_PUBLIC_PREFIXES.some((p) => reqPath === p || reqPath.startsWith(p + "/"))) return null;

  const resolved = await resolveCanonical(req);
  // Inject tenant metadata only for hosts that map to a real tenant domain.
  // Unknown hosts (spoofed Host headers, direct IP hits, previews) get the
  // untouched shell so no tenant's content leaks under a foreign hostname.
  if (!resolved || !resolved.companyId) return null;
  const companyId = resolved.companyId;
  const settings = await loadSettings(companyId);
  if (!settings) return null;

  const base = resolved.base;
  const canonical = reqPath === "/" ? `${base}/` : `${base}${reqPath}`;
  const siteTitle = settings.metaTitle || settings.displayName;
  const siteDescription = settings.metaDescription || "";
  const siteJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: settings.displayName,
    url: `${base}/`,
    ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
  };

  const common = {
    keywords: settings.metaKeywords || undefined,
    image: settings.logoUrl || undefined,
    canonical,
    siteJsonLd,
  };

  const pkgMatch = reqPath.match(/^\/packages\/([^/]+)$/);
  if (pkgMatch && UUID_RE.test(pkgMatch[1])) {
    const [pkg] = await db
      .select({
        title: tourPackagesTable.title,
        description: tourPackagesTable.description,
        imageUrl: tourPackagesTable.imageUrl,
        price: tourPackagesTable.price,
        duration: tourPackagesTable.duration,
      })
      .from(tourPackagesTable)
      .where(and(eq(tourPackagesTable.id, pkgMatch[1]), eq(tourPackagesTable.companyId, companyId)));
    if (pkg) {
      return {
        ...common,
        title: `${pkg.title} | ${settings.displayName}`,
        description: truncate(pkg.description || `${pkg.title} — book with ${settings.displayName}.`),
        image: pkg.imageUrl || common.image,
        pageJsonLd: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: pkg.title,
          ...(pkg.description ? { description: truncate(pkg.description, 300) } : {}),
          ...(pkg.imageUrl ? { image: pkg.imageUrl } : {}),
          offers: {
            "@type": "Offer",
            price: String(pkg.price),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: canonical,
          },
        },
      };
    }
  }

  const destMatch = reqPath.match(/^\/destinations\/([^/]+)$/);
  if (destMatch && UUID_RE.test(destMatch[1])) {
    const [dest] = await db
      .select({
        name: destinationsTable.name,
        state: destinationsTable.state,
        description: destinationsTable.description,
        imageUrl: destinationsTable.imageUrl,
      })
      .from(destinationsTable)
      .where(and(eq(destinationsTable.id, destMatch[1]), eq(destinationsTable.companyId, companyId)));
    if (dest) {
      const where = dest.state ? `${dest.name}, ${dest.state}` : dest.name;
      return {
        ...common,
        title: `${where} Tour Packages | ${settings.displayName}`,
        description: truncate(dest.description || `Explore ${where} with ${settings.displayName}.`),
        image: dest.imageUrl || common.image,
        pageJsonLd: {
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: dest.name,
          ...(dest.description ? { description: truncate(dest.description, 300) } : {}),
          ...(dest.imageUrl ? { image: dest.imageUrl } : {}),
          url: canonical,
        },
      };
    }
  }

  const staticTitles: Record<string, string> = {
    "/": siteTitle,
    "/packages": `Tour Packages | ${settings.displayName}`,
    "/destinations": `Destinations | ${settings.displayName}`,
    "/enquiry": `Travel Enquiry | ${settings.displayName}`,
    "/contact": `Contact Us | ${settings.displayName}`,
  };

  return {
    ...common,
    title: staticTitles[reqPath] || `${settings.displayName}`,
    description: siteDescription || `${settings.displayName} — tour packages, cabs and travel services.`,
  };
}

// Tags in the static index.html that the server re-emits with real values.
const MANAGED_META_RE =
  /^\s*<meta\s+(?:name|property)="(?:description|robots|og:title|og:description|og:type|twitter:card|twitter:title|twitter:description)"[^>]*\/?>\s*$\n?/gm;

function jsonLdScript(id: string, data: Record<string, unknown>): string {
  return `<script id="${id}" type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

export function injectMeta(html: string, meta: PageMeta): string {
  const title = htmlEscape(meta.title);
  const description = htmlEscape(meta.description);
  const canonical = htmlEscape(meta.canonical);
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    ...(meta.keywords ? [`<meta name="keywords" content="${htmlEscape(meta.keywords)}" />`] : []),
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:site_name" content="${title}" />`,
    ...(meta.image ? [`<meta property="og:image" content="${htmlEscape(meta.image)}" />`] : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    ...(meta.image ? [`<meta name="twitter:image" content="${htmlEscape(meta.image)}" />`] : []),
    jsonLdScript("seo-jsonld", meta.siteJsonLd),
    ...(meta.pageJsonLd ? [jsonLdScript("seo-jsonld-page", meta.pageJsonLd)] : []),
  ];
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*\n?/, "")
    .replace(MANAGED_META_RE, "")
    .replace("</head>", `    ${lines.join("\n    ")}\n  </head>`);
}

let indexCache: { path: string; mtimeMs: number; html: string } | null = null;

async function loadIndexHtml(indexHtmlPath: string): Promise<string> {
  const stat = await fsp.stat(indexHtmlPath);
  if (indexCache && indexCache.path === indexHtmlPath && indexCache.mtimeMs === stat.mtimeMs) {
    return indexCache.html;
  }
  const html = await fsp.readFile(indexHtmlPath, "utf8");
  indexCache = { path: indexHtmlPath, mtimeMs: stat.mtimeMs, html };
  return html;
}

/** Finds the built SPA's index.html: $CLIENT_DIST first, then common self-hosted layouts. */
export function resolveClientDist(): string | null {
  const candidates = [
    process.env.CLIENT_DIST,
    path.resolve(process.cwd(), "../travel-os/dist/public"),
    path.resolve(process.cwd(), "artifacts/travel-os/dist/public"),
  ].filter((p): p is string => !!p);
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

export function createSeoHtmlMiddleware(clientDist: string) {
  const indexHtmlPath = path.join(clientDist, "index.html");
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.includes(".")) return next();
    let html: string;
    try {
      html = await loadIndexHtml(indexHtmlPath);
    } catch {
      return next();
    }
    try {
      const meta = await buildMeta(req);
      if (meta) html = injectMeta(html, meta);
    } catch (err) {
      req.log?.error({ err }, "seo html injection failed; serving untouched shell");
    }
    res.type("html").setHeader("Cache-Control", "no-cache").send(html);
  };
}
