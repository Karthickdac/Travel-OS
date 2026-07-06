import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
  CreateCustomerBody,
  CreateCustomerResponse,
  GetCustomerParams,
  GetCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

function mapCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? null,
    city: c.city ?? null,
    totalBookings: c.totalBookings,
    totalSpent: Number(c.totalSpent),
    loyaltyPoints: c.loyaltyPoints,
    lastBookingDate: c.lastBookingDate?.toISOString() ?? null,
    photoUrl: c.photoUrl ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/v1/customers", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const customers = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.isDeleted, false), eq(customersTable.companyId, companyId)));
  res.json(ListCustomersResponse.parse(customers.map(mapCustomer)));
});

router.post("/v1/customers", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values({
      companyId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
    })
    .returning();

  res.status(201).json(CreateCustomerResponse.parse(mapCustomer(customer)));
});

router.get("/v1/customers/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, params.data.id), eq(customersTable.companyId, companyId)));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(GetCustomerResponse.parse(mapCustomer(customer)));
});

router.patch("/v1/customers/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.city !== undefined) updateData.city = parsed.data.city;

  const [customer] = await db
    .update(customersTable)
    .set(updateData)
    .where(and(eq(customersTable.id, params.data.id), eq(customersTable.companyId, companyId)))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(UpdateCustomerResponse.parse(mapCustomer(customer)));
});

router.delete("/v1/customers/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .update(customersTable)
    .set({ isDeleted: true })
    .where(and(eq(customersTable.id, params.data.id), eq(customersTable.companyId, companyId)));
  res.sendStatus(204);
});

export default router;
