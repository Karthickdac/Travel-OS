import { Router } from "express";
import { db } from "@workspace/db";
import { supportTicketsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const genTicketNumber = () => "TKT-" + Date.now().toString(36).toUpperCase();

router.get("/v1/support/tickets", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.companyId, companyId), eq(supportTicketsTable.isDeleted, false)))
    .orderBy(desc(supportTicketsTable.createdAt));
  res.json(rows);
});

router.post("/v1/support/tickets", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { customerName, customerEmail, customerPhone, subject, message, category, priority } = req.body;
  const [row] = await db.insert(supportTicketsTable)
    .values({ companyId, ticketNumber: genTicketNumber(), customerName, customerEmail, customerPhone, subject, message, category: category || "general", priority: priority || "medium" })
    .returning();
  res.status(201).json(row);
});

router.get("/v1/support/tickets/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.companyId, companyId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/v1/support/tickets/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const updates: any = {};
  const fields = ["status","priority","category","assignedTo","resolution"];
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  if (req.body.status === "resolved") updates.resolvedAt = new Date();
  const [row] = await db.update(supportTicketsTable).set(updates)
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.companyId, companyId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/v1/support/tickets/:id", async (req, res): Promise<void> => {
  const companyId = (req as any).user?.companyId;
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(supportTicketsTable).set({ isDeleted: true })
    .where(and(eq(supportTicketsTable.id, req.params.id), eq(supportTicketsTable.companyId, companyId)));
  res.status(204).send();
});

export default router;
