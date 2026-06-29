import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, GetMeResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "travelos_salt").digest("hex");
}

function generateToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}:travelos`).toString("base64");
}

function parseToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    return userId || null;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string | undefined): Promise<typeof usersTable.$inferSelect | null> {
  if (!token) return null;
  const userId = parseToken(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user || null;
}

router.post("/v1/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    token,
    user: {
      ...safeUser,
      companyId: safeUser.companyId ?? null,
      phone: safeUser.phone ?? null,
      avatar: safeUser.avatar ?? null,
      createdAt: safeUser.createdAt.toISOString(),
    },
  });
});

router.post("/v1/auth/logout", async (_req, res): Promise<void> => {
  res.sendStatus(204);
});

router.get("/v1/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  const user = await getUserFromToken(token);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json(
    GetMeResponse.parse({
      ...safeUser,
      companyId: safeUser.companyId ?? null,
      phone: safeUser.phone ?? null,
      avatar: safeUser.avatar ?? null,
      createdAt: safeUser.createdAt.toISOString(),
    })
  );
});

export { hashPassword };
export default router;
