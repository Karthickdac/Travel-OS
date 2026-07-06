import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  CreateUserResponse,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
} from "@workspace/api-zod";
import { hashPassword } from "./auth";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

function mapUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    companyId: u.companyId ?? null,
    phone: u.phone ?? null,
    avatar: u.avatar ?? null,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/v1/users", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const query = ListUsersQueryParams.safeParse(req.query);
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.companyId, companyId))
    .orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(users.map(mapUser)));
});

router.post("/v1/users", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      companyId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: hashPassword(parsed.data.password),
      phone: parsed.data.phone,
    })
    .returning();

  res.status(201).json(CreateUserResponse.parse(mapUser(user)));
});

router.get("/v1/users/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, companyId)));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(mapUser(user)));
});

router.patch("/v1/users/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, companyId)))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(mapUser(user)));
});

router.delete("/v1/users/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(usersTable).where(and(eq(usersTable.id, params.data.id), eq(usersTable.companyId, companyId)));
  res.sendStatus(204);
});

export default router;
