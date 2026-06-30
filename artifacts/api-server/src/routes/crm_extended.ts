import { Router } from "express";
import { db } from "@workspace/db";
import { followUpTasksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function companyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

router.get("/v1/crm/tasks", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(followUpTasksTable).where(eq(followUpTasksTable.companyId, cid)).orderBy(desc(followUpTasksTable.dueDate));
  res.json(rows);
});

router.post("/v1/crm/tasks", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { leadId, title, relatedTo, assignedTo, dueDate, priority, notes } = req.body;
  const [created] = await db.insert(followUpTasksTable).values({
    companyId: cid, leadId: leadId || null, title, relatedTo, assignedTo, dueDate,
    priority: priority || "medium", notes,
  }).returning();
  res.status(201).json(created);
});

router.patch("/v1/crm/tasks/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, assignedTo, dueDate, priority, status, notes } = req.body;
  const patch: any = {};
  for (const [k, v] of Object.entries({ title, assignedTo, dueDate, priority, status, notes })) {
    if (v !== undefined) patch[k] = v;
  }
  const [updated] = await db.update(followUpTasksTable).set(patch)
    .where(and(eq(followUpTasksTable.id, req.params.id), eq(followUpTasksTable.companyId, cid))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/v1/crm/tasks/:id", async (req, res): Promise<void> => {
  const cid = companyId(req);
  if (!cid) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(followUpTasksTable).where(and(eq(followUpTasksTable.id, req.params.id), eq(followUpTasksTable.companyId, cid)));
  res.status(204).end();
});

export default router;
