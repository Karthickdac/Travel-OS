import { Router } from "express";
import { db } from "@workspace/db";
import { companySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

const EDITABLE = [
  "theme", "primaryColor", "secondaryColor", "accentColor", "fontFamily", "borderRadius",
  "darkMode", "customCss", "customJs", "cookieConsentText", "whatsappToken", "smsGatewayKey",
  "googleMapsKey", "googlePlaceId", "razorpayKeyId", "stripePublishableKey",
] as const;

router.get("/v1/company/settings", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  let [row] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.companyId, cid)).limit(1);
  if (!row) {
    [row] = await db.insert(companySettingsTable).values({ companyId: cid }).returning();
  }
  res.json(row);
});

router.put("/v1/company/settings", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const patch: any = {};
  for (const key of EDITABLE) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  const [existing] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.companyId, cid)).limit(1);
  if (existing) {
    const [updated] = await db.update(companySettingsTable).set(patch).where(eq(companySettingsTable.id, existing.id)).returning();
    res.json(updated);
    return;
  }
  const [created] = await db.insert(companySettingsTable).values({ companyId: cid, ...patch }).returning();
  res.status(201).json(created);
});

export default router;
