import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, companiesTable, companySettingsTable } from "@workspace/db";
import { GetPublicGoogleReviewsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function normalizeHost(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split(":")[0];
}

async function resolveCompanyIdByDomain(domain: string): Promise<string | null> {
  const normalized = normalizeHost(domain);
  if (!normalized) return null;
  const companies = await db.select({ id: companiesTable.id, domain: companiesTable.domain }).from(companiesTable);
  const match = companies.find((c) => {
    if (!c.domain) return false;
    const stored = normalizeHost(c.domain);
    return stored === normalized || normalized.endsWith(`.${stored}`) || stored.endsWith(`.${normalized}`);
  });
  return match?.id ?? null;
}

type GoogleSummary = {
  connected: boolean;
  rating: number | null;
  totalReviews: number | null;
  mapsUri: string | null;
  writeReviewUri: string | null;
  reviews: Array<{
    authorName: string;
    rating: number;
    text: string;
    relativeTime: string | null;
    profilePhotoUrl: string | null;
  }>;
};

const NOT_CONNECTED: GoogleSummary = { connected: false, rating: null, totalReviews: null, mapsUri: null, writeReviewUri: null, reviews: [] };

function writeReviewUriFor(placeId: string | null | undefined): string | null {
  const id = placeId?.trim();
  return id ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}` : null;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for successful lookups
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for failed lookups
const FETCH_TIMEOUT_MS = 5000;
const cache = new Map<string, { at: number; ttl: number; data: GoogleSummary }>();

async function fetchGoogleSummary(placeId: string, apiKey: string): Promise<GoogleSummary | null> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const resp = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) return null;
  const data: any = await resp.json();
  const reviews = Array.isArray(data.reviews)
    ? data.reviews
        .filter((r: any) => r?.text?.text && r?.rating)
        .map((r: any) => ({
          authorName: r.authorAttribution?.displayName ?? "Google user",
          rating: Math.max(1, Math.min(5, Math.round(r.rating))),
          text: String(r.text.text),
          relativeTime: r.relativePublishTimeDescription ?? null,
          profilePhotoUrl: r.authorAttribution?.photoUri ?? null,
        }))
    : [];
  return {
    connected: true,
    rating: typeof data.rating === "number" ? data.rating : null,
    totalReviews: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
    mapsUri: data.googleMapsUri ?? null,
    writeReviewUri: writeReviewUriFor(placeId),
    reviews,
  };
}

router.get("/v1/public/google-reviews", async (req, res): Promise<void> => {
  const companyIdParam = req.query.companyId as string | undefined;
  const domain = req.query.domain as string | undefined;
  let companyId = companyIdParam;
  if (!companyId && domain) {
    companyId = (await resolveCompanyIdByDomain(domain)) ?? undefined;
  }
  if (!companyId) {
    const [firstCompany] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .orderBy(asc(companiesTable.id))
      .limit(1);
    companyId = firstCompany?.id;
  }
  if (!companyId) {
    res.json(GetPublicGoogleReviewsResponse.parse(NOT_CONNECTED));
    return;
  }

  const cached = cache.get(companyId);
  if (cached && Date.now() - cached.at < cached.ttl) {
    res.json(GetPublicGoogleReviewsResponse.parse(cached.data));
    return;
  }

  const [settings] = await db
    .select({ apiKey: companySettingsTable.googleMapsKey, placeId: companySettingsTable.googlePlaceId })
    .from(companySettingsTable)
    .where(eq(companySettingsTable.companyId, companyId))
    .limit(1);

  // The "write a review" link only needs the Place ID — expose it even when
  // the Places API key is missing or failing, so sites can collect Google
  // reviews before the full read integration is set up.
  const notConnected: GoogleSummary = { ...NOT_CONNECTED, writeReviewUri: writeReviewUriFor(settings?.placeId) };

  if (!settings?.apiKey || !settings?.placeId) {
    res.json(GetPublicGoogleReviewsResponse.parse(notConnected));
    return;
  }

  try {
    const summary = await fetchGoogleSummary(settings.placeId.trim(), settings.apiKey.trim());
    if (!summary) {
      req.log.warn({ companyId }, "Google Places API returned non-OK for google-reviews");
      cache.set(companyId, { at: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS, data: notConnected });
      res.json(GetPublicGoogleReviewsResponse.parse(notConnected));
      return;
    }
    cache.set(companyId, { at: Date.now(), ttl: CACHE_TTL_MS, data: summary });
    res.json(GetPublicGoogleReviewsResponse.parse(summary));
  } catch (err) {
    req.log.error({ err, companyId }, "Failed to fetch Google reviews");
    cache.set(companyId, { at: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS, data: notConnected });
    res.json(GetPublicGoogleReviewsResponse.parse(notConnected));
  }
});

export default router;
