import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vendorsTable } from "@workspace/db";
import {
  ListVendorsResponse,
  CreateVendorBody,
  CreateVendorResponse,
  GetVendorParams,
  GetVendorResponse,
  UpdateVendorParams,
  UpdateVendorBody,
  UpdateVendorResponse,
  DeleteVendorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapVendor(v: typeof vendorsTable.$inferSelect) {
  return {
    id: v.id,
    name: v.name,
    contactName: v.contactName,
    phone: v.phone,
    email: v.email ?? null,
    status: v.status,
    gstNumber: v.gstNumber ?? null,
    commissionPercent: v.commissionPercent !== null ? Number(v.commissionPercent) : null,
    totalTrips: v.totalTrips,
    pendingSettlement: Number(v.pendingSettlement),
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/v1/vendors", async (_req, res): Promise<void> => {
  const vendors = await db.select().from(vendorsTable).where(eq(vendorsTable.isDeleted, false));
  res.json(ListVendorsResponse.parse(vendors.map(mapVendor)));
});

router.post("/v1/vendors", async (req, res): Promise<void> => {
  const parsed = CreateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vendor] = await db
    .insert(vendorsTable)
    .values({
      name: parsed.data.name,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      gstNumber: parsed.data.gstNumber,
      commissionPercent: parsed.data.commissionPercent !== undefined ? String(parsed.data.commissionPercent) : null,
    })
    .returning();

  res.status(201).json(CreateVendorResponse.parse(mapVendor(vendor)));
});

router.get("/v1/vendors/:id", async (req, res): Promise<void> => {
  const params = GetVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, params.data.id));
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.json(GetVendorResponse.parse(mapVendor(vendor)));
});

router.patch("/v1/vendors/:id", async (req, res): Promise<void> => {
  const params = UpdateVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.contactName !== undefined) updateData.contactName = parsed.data.contactName;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.commissionPercent !== undefined) updateData.commissionPercent = String(parsed.data.commissionPercent);

  const [vendor] = await db
    .update(vendorsTable)
    .set(updateData)
    .where(eq(vendorsTable.id, params.data.id))
    .returning();

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.json(UpdateVendorResponse.parse(mapVendor(vendor)));
});

router.delete("/v1/vendors/:id", async (req, res): Promise<void> => {
  const params = DeleteVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(vendorsTable).set({ isDeleted: true }).where(eq(vendorsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
