import { useEffect } from "react";

export interface SeoInput {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("data-seo", "1");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo", "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Imperatively manages the document head for public (customer-facing) pages so
 * each tenant site is fully indexable: title, description, keywords, canonical,
 * Open Graph / Twitter cards, and JSON-LD structured data. Driven by CMS data,
 * never hardcoded per tenant.
 */
export function useSeo({ title, description, keywords, image, canonical, jsonLd }: SeoInput) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) upsertMeta('meta[name="description"]', { name: "description", content: description });
    if (keywords) upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
    upsertMeta('meta[name="robots"]', { name: "robots", content: "index, follow, max-image-preview:large" });

    const url = canonical || `${window.location.origin}${window.location.pathname}`;
    upsertLink("canonical", url);

    // Open Graph
    if (title) upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    if (description) upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    if (title) upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: title });
    if (image) upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });

    // Twitter
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    if (title) upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    if (description) upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    if (image) upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    // JSON-LD structured data
    const LD_ID = "seo-jsonld";
    let ld = document.getElementById(LD_ID);
    if (jsonLd) {
      if (!ld) {
        ld = document.createElement("script");
        ld.id = LD_ID;
        ld.setAttribute("type", "application/ld+json");
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify(jsonLd);
    } else if (ld) {
      ld.remove();
    }
  }, [title, description, keywords, image, canonical, jsonLd]);
}
