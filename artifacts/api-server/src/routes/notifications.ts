import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

function mapNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    entityType: n.entityType ?? null,
    entityId: n.entityId ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/v1/notifications", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.companyId, companyId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);

  res.json(ListNotificationsResponse.parse(rows.map(mapNotification)));
});

router.post("/v1/notifications/:id/read", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.companyId, companyId)))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(mapNotification(notification)));
});

router.post("/v1/notifications/read-all", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.companyId, companyId));

  res.sendStatus(204);
});

export default router;
