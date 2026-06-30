import { Router } from "express";
import { db } from "@workspace/db";
import { refundsTable, cashBookTable, ledgerEntriesTable, invoicesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

// ---- Refunds ----
router.get("/v1/finance/refunds", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(refundsTable).where(eq(refundsTable.companyId, cid)).orderBy(desc(refundsTable.requestedAt));
  res.json(rows);
});

router.post("/v1/finance/refunds", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { invoiceId, customerName, amount, reason, method, requestedAt, notes } = req.body;
  const [created] = await db.insert(refundsTable).values({
    companyId: cid, invoiceId: invoiceId || null, customerName, amount, reason, method: method || "wallet",
    requestedAt: requestedAt || new Date().toISOString().slice(0, 10), notes,
  }).returning();
  res.status(201).json(created);
});

router.patch("/v1/finance/refunds/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { status, notes } = req.body;
  const patch: any = {};
  if (status !== undefined) { patch.status = status; if (status === "processed") patch.processedAt = new Date(); }
  if (notes !== undefined) patch.notes = notes;
  const [updated] = await db.update(refundsTable).set(patch)
    .where(and(eq(refundsTable.id, req.params.id), eq(refundsTable.companyId, cid))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ---- Cash Book ----
router.get("/v1/finance/cashbook", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(cashBookTable).where(eq(cashBookTable.companyId, cid)).orderBy(desc(cashBookTable.date));
  res.json(rows);
});

router.post("/v1/finance/cashbook", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { date, type, category, description, amount, paymentMode, reference } = req.body;
  const [created] = await db.insert(cashBookTable).values({
    companyId: cid, date, type, category, description, amount, paymentMode: paymentMode || "cash", reference,
  }).returning();
  res.status(201).json(created);
});

router.delete("/v1/finance/cashbook/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(cashBookTable).where(and(eq(cashBookTable.id, req.params.id), eq(cashBookTable.companyId, cid)));
  res.status(204).end();
});

// ---- Ledger ----
router.get("/v1/finance/ledger", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { accountType } = req.query as { accountType?: string };
  const rows = await db.select().from(ledgerEntriesTable).where(eq(ledgerEntriesTable.companyId, cid)).orderBy(desc(ledgerEntriesTable.date));
  res.json(accountType ? rows.filter(r => r.accountType === accountType) : rows);
});

router.post("/v1/finance/ledger", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { accountType, accountName, date, description, debit, credit, reference } = req.body;
  const [created] = await db.insert(ledgerEntriesTable).values({
    companyId: cid, accountType, accountName, date, description, debit: debit || "0", credit: credit || "0", reference,
  }).returning();
  res.status(201).json(created);
});

// ---- GST Summary (derived from invoices) ----
router.get("/v1/finance/gst-summary", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.companyId, cid)).orderBy(desc(invoicesTable.createdAt));
  const byMonth: Record<string, { month: string; taxable: number; gst: number; total: number; count: number }> = {};
  for (const inv of invoices) {
    const month = (inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt)).slice(0, 7);
    const taxable = parseFloat(inv.amount ?? "0");
    const gst = parseFloat(inv.taxAmount ?? "0");
    if (!byMonth[month]) byMonth[month] = { month, taxable: 0, gst: 0, total: 0, count: 0 };
    byMonth[month].taxable += taxable;
    byMonth[month].gst += gst;
    byMonth[month].total += taxable + gst;
    byMonth[month].count += 1;
  }
  res.json(Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month)));
});

export default router;
