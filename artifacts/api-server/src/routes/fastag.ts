import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, and, desc } from "drizzle-orm";
import { db, fastagsTable, fastagRechargesTable } from "@workspace/db";
import {
  parseFastagSms,
  computeNewBalance,
  normalizeVehicleNumber,
  type ParsedFastagSms,
} from "../lib/fastagSms";
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

// ─── Realtime balance via bank SMS ────────────────────────────────────────────
// FASTag issuing banks send an SMS on every toll deduction and recharge that
// includes the available balance. Parsing that SMS keeps the stored balance up
// to date in near-realtime without a NETC/bank API partnership.

type FastagRow = typeof fastagsTable.$inferSelect;

// Roles permitted to operate on fleet FASTags. Customers are excluded so a
// customer-portal account cannot mutate their company's fleet balances.
const FLEET_ROLES = new Set(["master_admin", "company_admin", "company_staff"]);

function isFleetUser(req: any): boolean {
  return !!req.user && FLEET_ROLES.has(req.user.role);
}

/**
 * The signing secret for webhook tokens. Returns null (fail-closed) if
 * SESSION_SECRET is missing or too short, so we never derive guessable tokens
 * from an empty/weak key.
 */
function getWebhookSecret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

/**
 * Per-company webhook token. Derived as an HMAC of the company id keyed by
 * SESSION_SECRET so each tenant gets a distinct, unguessable token and the
 * webhook can only ever touch that tenant's tags. No secret is stored per row.
 */
function webhookTokenFor(companyId: string, secret: string): string {
  return createHmac("sha256", secret).update(`fastag-sms:${companyId}`).digest("hex");
}

function tokensMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** All FASTags in `rows` that match the parsed SMS (vehicle number preferred). */
function matchTags(rows: FastagRow[], parsed: ParsedFastagSms): FastagRow[] {
  if (parsed.vehicleNumber) {
    const m = rows.filter(
      (r) => normalizeVehicleNumber(r.vehicleNumber) === parsed.vehicleNumber,
    );
    if (m.length) return m;
  }
  if (parsed.tagLast4) {
    const last4 = parsed.tagLast4;
    const m = rows.filter((r) => r.tagId?.endsWith(last4));
    if (m.length) return m;
  }
  return [];
}

async function applySmsToTag(tag: FastagRow, parsed: ParsedFastagSms) {
  const newBalance = computeNewBalance(parsed, Number(tag.balance));
  if (newBalance == null) return null;
  const [row] = await db
    .update(fastagsTable)
    .set({ balance: String(newBalance), lastCheckedAt: new Date() })
    .where(eq(fastagsTable.id, tag.id))
    .returning();
  return row ?? null;
}

/** Resolve a single matching tag or send the appropriate error response. */
function resolveSingleMatch(
  res: any,
  matches: FastagRow[],
  parsed: ParsedFastagSms,
): FastagRow | null {
  if (matches.length === 0) {
    res.status(404).json({ error: "No matching FASTag found for this SMS", parsed });
    return null;
  }
  if (matches.length > 1) {
    res.status(409).json({
      error: "SMS matched multiple FASTags; cannot safely choose one",
      parsed,
    });
    return null;
  }
  return matches[0]!;
}

// POST /v1/fleet/fastag/sms-sync — authenticated: paste a bank SMS to auto-update.
// Body: { message: string, fastagId?: string }
router.post("/v1/fleet/fastag/sms-sync", async (req, res) => {
  if (!(req as any).user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isFleetUser(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const message = typeof req.body?.message === "string" ? req.body.message : "";
  const fastagId = typeof req.body?.fastagId === "string" ? req.body.fastagId : null;
  if (!message.trim()) { res.status(400).json({ error: "message is required" }); return; }

  try {
    const parsed = parseFastagSms(message);
    if (parsed.availableBalance == null && parsed.amount == null) {
      res.status(422).json({ error: "Could not read a balance or amount from this SMS", parsed });
      return;
    }

    // Always scope to the caller's company. master_admin (no company) may operate
    // across all tenants by design.
    const companyId = getCompanyId(req);
    const rows = companyId
      ? await db.select().from(fastagsTable).where(
          and(eq(fastagsTable.companyId, companyId), eq(fastagsTable.isDeleted, false)),
        )
      : await db.select().from(fastagsTable).where(eq(fastagsTable.isDeleted, false));

    const matches = fastagId ? rows.filter((r) => r.id === fastagId) : matchTags(rows, parsed);
    const tag = resolveSingleMatch(res, matches, parsed);
    if (!tag) return;

    const updated = await applySmsToTag(tag, parsed);
    if (!updated) {
      res.status(422).json({ error: "SMS did not contain enough information to update the balance", parsed });
      return;
    }
    res.json({ updated: mapFastag(updated), parsed });
  } catch (err) {
    req.log.error({ err }, "Failed to sync FASTag from SMS");
    res.status(500).json({ error: "Failed to sync from SMS" });
  }
});

// GET /v1/fleet/fastag/sms-webhook-url — authenticated: returns the caller's
// company-scoped automation webhook URL for an SMS-forwarding app.
router.get("/v1/fleet/fastag/sms-webhook-url", (req, res) => {
  if (!(req as any).user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isFleetUser(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const companyId = getCompanyId(req);
  const secret = getWebhookSecret();
  if (!companyId || !secret) { res.json({ configured: false, url: null }); return; }

  const token = webhookTokenFor(companyId, secret);
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0]?.trim();
  const origin = domain ? `https://${domain}` : `${req.protocol}://${req.get("host")}`;
  res.json({
    configured: true,
    url: `${origin}/api/v1/fleet/fastag/sms-webhook?company=${companyId}&token=${token}`,
  });
});

// POST /v1/fleet/fastag/sms-webhook?company=...&token=... — for SMS-forwarding
// apps/gateways. Unauthenticated, protected by a per-company token. Only ever
// touches the FASTags of the company encoded in the (validated) token.
router.post("/v1/fleet/fastag/sms-webhook", async (req, res) => {
  const companyId =
    (typeof req.query.company === "string" ? req.query.company : "") ||
    (req.headers["x-webhook-company"] as string | undefined) ||
    "";
  const provided =
    (typeof req.query.token === "string" ? req.query.token : "") ||
    (req.headers["x-webhook-token"] as string | undefined) ||
    "";
  const secret = getWebhookSecret();
  if (!secret) {
    req.log.error("FASTag webhook called but SESSION_SECRET is missing/weak");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }
  if (!companyId || !provided || !tokensMatch(provided, webhookTokenFor(companyId, secret))) {
    res.status(401).json({ error: "Invalid or missing webhook credentials" });
    return;
  }

  // Accept common forwarder payload shapes: { message } | { text } | { body }.
  const message =
    (typeof req.body?.message === "string" && req.body.message) ||
    (typeof req.body?.text === "string" && req.body.text) ||
    (typeof req.body?.body === "string" && req.body.body) ||
    "";
  if (!message.trim()) { res.status(400).json({ error: "No SMS text in payload" }); return; }

  try {
    const parsed = parseFastagSms(message);
    const rows = await db.select().from(fastagsTable).where(
      and(eq(fastagsTable.companyId, companyId), eq(fastagsTable.isDeleted, false)),
    );
    const matches = matchTags(rows, parsed);
    const tag = resolveSingleMatch(res, matches, parsed);
    if (!tag) {
      req.log.warn({ parsed, companyId }, "FASTag SMS webhook: no single matching tag");
      return;
    }
    const updated = await applySmsToTag(tag, parsed);
    if (!updated) {
      res.status(422).json({ error: "Insufficient data in SMS", parsed });
      return;
    }
    req.log.info({ tagId: updated.id, balance: updated.balance }, "FASTag balance auto-updated from SMS");
    res.json({ updated: mapFastag(updated), parsed });
  } catch (err) {
    req.log.error({ err }, "FASTag SMS webhook failed");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
