import { Router, type IRouter } from "express";
import { eq, count, sum, and, ne, inArray } from "drizzle-orm";
import { db, companiesTable, subscriptionPlansTable, usersTable, bookingsTable, userCompaniesTable } from "@workspace/db";
import {
  ListMasterUsersResponse,
  SetUserCompaniesParams,
  SetUserCompaniesBody,
  SetUserCompaniesResponse,
  GetMasterDashboardResponse,
  ListCompaniesQueryParams,
  ListCompaniesResponse,
  CreateCompanyBody,
  CreateCompanyResponse,
  GetCompanyParams,
  GetCompanyResponse,
  UpdateCompanyParams,
  UpdateCompanyBody,
  UpdateCompanyResponse,
  DeleteCompanyParams,
  SuspendCompanyParams,
  SuspendCompanyResponse,
  ListPlansResponse,
  CreatePlanBody,
  CreatePlanResponse,
  UpdatePlanParams,
  UpdatePlanBody,
  UpdatePlanResponse,
  DeletePlanParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// All /v1/master/* routes require the master_admin role.
router.use("/v1/master", (req, res, next) => {
  if ((req as any).user?.role !== "master_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

function mapCompany(c: typeof companiesTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    status: c.status,
    plan: c.plan,
    domain: c.domain ?? null,
    logo: c.logo ?? null,
    city: c.city ?? null,
    country: c.country ?? null,
    gstNumber: c.gstNumber ?? null,
    totalBookings: c.totalBookings,
    totalUsers: c.totalUsers,
    createdAt: c.createdAt.toISOString(),
    trialEndsAt: c.trialEndsAt?.toISOString() ?? null,
    planExpiresAt: c.planExpiresAt?.toISOString() ?? null,
  };
}

function mapPlan(p: typeof subscriptionPlansTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    duration: p.duration,
    maxUsers: p.maxUsers,
    maxVehicles: p.maxVehicles,
    maxBookingsPerMonth: p.maxBookingsPerMonth ?? null,
    features: p.features ?? [],
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

// Master dashboard
router.get("/v1/master/dashboard", async (req, res): Promise<void> => {
  const [companiesResult] = await db.select({ total: count() }).from(companiesTable);
  const [activeResult] = await db.select({ total: count() }).from(companiesTable).where(eq(companiesTable.status, "active"));
  const [usersResult] = await db.select({ total: count() }).from(usersTable);
  const [bookingsResult] = await db.select({ total: count() }).from(bookingsTable);

  res.json(
    GetMasterDashboardResponse.parse({
      totalCompanies: companiesResult.total,
      activeCompanies: activeResult.total,
      expiredPlans: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalBookings: bookingsResult.total,
      totalUsers: usersResult.total,
      activeDrivers: 0,
    })
  );
});

// Companies
router.get("/v1/master/companies", async (req, res): Promise<void> => {
  const query = ListCompaniesQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const companies = await db.select().from(companiesTable).limit(limit).offset(offset).orderBy(companiesTable.createdAt);
  const [totalResult] = await db.select({ total: count() }).from(companiesTable);

  res.json(
    ListCompaniesResponse.parse({
      data: companies.map(mapCompany),
      total: totalResult.total,
      page,
      limit,
    })
  );
});

router.post("/v1/master/companies", async (req, res): Promise<void> => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [company] = await db
    .insert(companiesTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      plan: parsed.data.plan,
      city: parsed.data.city,
      country: parsed.data.country,
      domain: parsed.data.domain,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning();

  res.status(201).json(CreateCompanyResponse.parse(mapCompany(company)));
});

router.get("/v1/master/companies/:id", async (req, res): Promise<void> => {
  const params = GetCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, params.data.id));
  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(GetCompanyResponse.parse(mapCompany(company)));
});

router.patch("/v1/master/companies/:id", async (req, res): Promise<void> => {
  const params = UpdateCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.plan !== undefined) updateData.plan = parsed.data.plan;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.domain !== undefined) updateData.domain = parsed.data.domain;
  if (parsed.data.city !== undefined) updateData.city = parsed.data.city;

  const [company] = await db
    .update(companiesTable)
    .set(updateData)
    .where(eq(companiesTable.id, params.data.id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(UpdateCompanyResponse.parse(mapCompany(company)));
});

router.delete("/v1/master/companies/:id", async (req, res): Promise<void> => {
  const params = GetCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(companiesTable).where(eq(companiesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/v1/master/companies/:id/suspend", async (req, res): Promise<void> => {
  const params = SuspendCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [company] = await db
    .update(companiesTable)
    .set({ status: "suspended" })
    .where(eq(companiesTable.id, params.data.id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(SuspendCompanyResponse.parse(mapCompany(company)));
});

// Plans
router.get("/v1/master/plans", async (_req, res): Promise<void> => {
  const plans = await db.select().from(subscriptionPlansTable).orderBy(subscriptionPlansTable.price);
  res.json(ListPlansResponse.parse(plans.map(mapPlan)));
});

router.post("/v1/master/plans", async (req, res): Promise<void> => {
  const parsed = CreatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [plan] = await db
    .insert(subscriptionPlansTable)
    .values({
      name: parsed.data.name,
      price: String(parsed.data.price),
      duration: parsed.data.duration,
      maxUsers: parsed.data.maxUsers,
      maxVehicles: parsed.data.maxVehicles,
      maxBookingsPerMonth: parsed.data.maxBookingsPerMonth,
      features: parsed.data.features ?? [],
    })
    .returning();

  res.status(201).json(CreatePlanResponse.parse(mapPlan(plan)));
});

router.patch("/v1/master/plans/:id", async (req, res): Promise<void> => {
  const params = UpdatePlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.maxUsers !== undefined) updateData.maxUsers = parsed.data.maxUsers;
  if (parsed.data.maxVehicles !== undefined) updateData.maxVehicles = parsed.data.maxVehicles;

  const [plan] = await db
    .update(subscriptionPlansTable)
    .set(updateData)
    .where(eq(subscriptionPlansTable.id, params.data.id))
    .returning();

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  res.json(UpdatePlanResponse.parse(mapPlan(plan)));
});

router.delete("/v1/master/plans/:id", async (req, res): Promise<void> => {
  const params = DeletePlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, params.data.id));
  res.sendStatus(204);
});

// Master users with company grouping
router.get("/v1/master/users", async (req, res): Promise<void> => {
  if ((req as any).user?.role !== "master_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const groupRows = await db
    .select({ userId: userCompaniesTable.userId, companyId: userCompaniesTable.companyId })
    .from(userCompaniesTable);

  const grouped = new Map<string, string[]>();
  for (const r of groupRows) {
    const arr = grouped.get(r.userId) ?? [];
    arr.push(r.companyId);
    grouped.set(r.userId, arr);
  }

  res.json(
    ListMasterUsersResponse.parse(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        companyId: u.companyId ?? null,
        isActive: u.isActive,
        companyIds: grouped.get(u.id) ?? [],
      }))
    )
  );
});

router.put("/v1/master/users/:id/companies", async (req, res): Promise<void> => {
  if ((req as any).user?.role !== "master_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = SetUserCompaniesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SetUserCompaniesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const companyIds = Array.from(new Set(parsed.data.companyIds));

  if (companyIds.length > 0) {
    const existing = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(inArray(companiesTable.id, companyIds));
    if (existing.length !== companyIds.length) {
      res.status(400).json({ error: "One or more company ids do not exist" });
      return;
    }
  }

  let currentCompanyId = user.companyId ?? null;
  await db.transaction(async (tx) => {
    await tx.delete(userCompaniesTable).where(eq(userCompaniesTable.userId, user.id));
    if (companyIds.length > 0) {
      await tx
        .insert(userCompaniesTable)
        .values(companyIds.map((companyId) => ({ userId: user.id, companyId })))
        .onConflictDoNothing();
    }
    if (companyIds.length > 0 && (!currentCompanyId || !companyIds.includes(currentCompanyId))) {
      currentCompanyId = companyIds[0];
      await tx.update(usersTable).set({ companyId: currentCompanyId }).where(eq(usersTable.id, user.id));
    }
  });

  res.json(
    SetUserCompaniesResponse.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: currentCompanyId,
      isActive: user.isActive,
      companyIds,
    })
  );
});

export default router;
