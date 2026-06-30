import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, fastagsTable, fastagRechargesTable } from "@workspace/db";
import {
  ListFastagsResponse,
  CreateFastagBody,
  CreateFastagResponse,
  UpdateFastagParams,
  UpdateFastagBody,
  UpdateFastagResponse,
  DeleteFastagParams,
  GetFastagRechargesParams,
  GetFastagRechargesResponse,
  CreateFastagRechargeParams,
  CreateFastagRechargeBody,
  CreateFastagRechargeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapFastag(f: typeof fastagsTable.$inferSelect) {
  return {
    id: f.id,
    vehicleId: f.vehicleId ?? null,
    vehicleNumber: f.vehicleNumber,
    tagId: f.tagId,
    bank: f.bank,
    balance: Number(f.balance),
    lowBalanceThreshold: Number(f.lowBalanceThreshold),
    status: f.status,
    lastCheckedAt: f.lastCheckedAt?.toISOString() ?? null,
    notes: f.notes ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

function mapRecharge(r: typeof fastagRechargesTable.$inferSelect) {
  return {
    id: r.id,
    fastagId: r.fastagId ?? null,
    amount: Number(r.amount),
    transactionRef: r.transactionRef ?? null,
    rechargeMode: r.rechargeMode,
    balanceBefore: r.balanceBefore != null ? Number(r.balanceBefore) : null,
    balanceAfter: r.balanceAfter != null ? Number(r.balanceAfter) : null,
    rechargedBy: r.rechargedBy ?? null,
    notes: r.notes ?? null,
    rechargedAt: r.rechargedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// GET /v1/fleet/fastag — list all FASTag records for company
router.get("/v1/fleet/fastag", async (req, res) => {
  const companyId = getCompanyId(req);
  const parsed = ListFastagsResponse.safeParse;
  try {
    const rows = companyId
      ? await db.select().from(fastagsTable).where(
          and(eq(fastagsTable.companyId, companyId), eq(fastagsTable.isDeleted, false))
        ).orderBy(desc(fastagsTable.createdAt))
      : await db.select().from(fastagsTable).where(eq(fastagsTable.isDeleted, false));
    res.json(rows.map(mapFastag));
  } catch (err) {
    req.log.error({ err }, "Failed to list FASTags");
    res.status(500).json({ error: "Failed to fetch FASTags" });
  }
});

// POST /v1/fleet/fastag — register a new FASTag
router.post("/v1/fleet/fastag", async (req, res) => {
  const companyId = getCompanyId(req);
  const body = CreateFastagBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", issues: body.error.issues });
    return;
  }
  try {
    const [row] = await db.insert(fastagsTable).values({
      companyId: companyId ?? undefined,
      vehicleId: body.data.vehicleId ?? undefined,
      vehicleNumber: body.data.vehicleNumber,
      tagId: body.data.tagId,
      bank: body.data.bank ?? "other",
      balance: String(body.data.balance ?? 0),
      lowBalanceThreshold: String(body.data.lowBalanceThreshold ?? 200),
      status: body.data.status ?? "active",
      notes: body.data.notes ?? undefined,
    }).returning();
    res.status(201).json(mapFastag(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create FASTag");
    res.status(500).json({ error: "Failed to create FASTag" });
  }
});

// PATCH /v1/fleet/fastag/:id — update balance / details
router.patch("/v1/fleet/fastag/:id", async (req, res) => {
  const params = UpdateFastagParams.safeParse(req.params);
  const body = UpdateFastagBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const updates: Partial<typeof fastagsTable.$inferInsert> = {};
    if (body.data.balance !== undefined) updates.balance = String(body.data.balance);
    if (body.data.status !== undefined) updates.status = body.data.status;
    if (body.data.bank !== undefined) updates.bank = body.data.bank;
    if (body.data.lowBalanceThreshold !== undefined) updates.lowBalanceThreshold = String(body.data.lowBalanceThreshold);
    if (body.data.notes !== undefined) updates.notes = body.data.notes;
    if (body.data.lastCheckedAt !== undefined) updates.lastCheckedAt = new Date(body.data.lastCheckedAt);

    const [row] = await db.update(fastagsTable).set(updates).where(eq(fastagsTable.id, params.data.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapFastag(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update FASTag");
    res.status(500).json({ error: "Failed to update FASTag" });
  }
});

// DELETE /v1/fleet/fastag/:id — soft-delete
router.delete("/v1/fleet/fastag/:id", async (req, res) => {
  const params = DeleteFastagParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.update(fastagsTable).set({ isDeleted: true }).where(eq(fastagsTable.id, params.data.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete FASTag");
    res.status(500).json({ error: "Failed to delete FASTag" });
  }
});

// GET /v1/fleet/fastag/:id/recharges — list recharge history
router.get("/v1/fleet/fastag/:id/recharges", async (req, res) => {
  const params = GetFastagRechargesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const rows = await db.select().from(fastagRechargesTable)
      .where(eq(fastagRechargesTable.fastagId, params.data.id))
      .orderBy(desc(fastagRechargesTable.rechargedAt));
    res.json(rows.map(mapRecharge));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recharge history");
    res.status(500).json({ error: "Failed to fetch recharge history" });
  }
});

// POST /v1/fleet/fastag/:id/recharge — record a recharge & update balance
router.post("/v1/fleet/fastag/:id/recharge", async (req, res) => {
  const params = CreateFastagRechargeParams.safeParse(req.params);
  const body = CreateFastagRechargeBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input", issues: body.success ? undefined : body.error.issues });
    return;
  }
  try {
    const companyId = getCompanyId(req);
    const [tag] = await db.select().from(fastagsTable).where(eq(fastagsTable.id, params.data.id)).limit(1);
    if (!tag) { res.status(404).json({ error: "FASTag not found" }); return; }

    const balanceBefore = Number(tag.balance);
    const balanceAfter = balanceBefore + Number(body.data.amount);

    // Record the recharge
    const [recharge] = await db.insert(fastagRechargesTable).values({
      companyId: companyId ?? undefined,
      fastagId: params.data.id,
      amount: String(body.data.amount),
      transactionRef: body.data.transactionRef ?? undefined,
      rechargeMode: body.data.rechargeMode ?? "upi",
      balanceBefore: String(balanceBefore),
      balanceAfter: String(balanceAfter),
      rechargedBy: body.data.rechargedBy ?? undefined,
      notes: body.data.notes ?? undefined,
    }).returning();

    // Update the FASTag balance
    await db.update(fastagsTable).set({
      balance: String(balanceAfter),
      lastCheckedAt: new Date(),
    }).where(eq(fastagsTable.id, params.data.id));

    res.status(201).json(mapRecharge(recharge));
  } catch (err) {
    req.log.error({ err }, "Failed to record recharge");
    res.status(500).json({ error: "Failed to record recharge" });
  }
});

export default router;
