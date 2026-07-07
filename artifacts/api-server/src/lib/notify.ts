import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * Fire-and-forget notification creation. Never throws — failures are logged via
 * the logger singleton so a notification error can't crash the originating request.
 */
export async function createNotification(
  companyId: string | null | undefined,
  input: NotificationInput,
): Promise<void> {
  try {
    if (!companyId) return;
    await db.insert(notificationsTable).values({
      companyId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    });
  } catch (err) {
    logger.error({ err }, "failed to create notification");
  }
}
