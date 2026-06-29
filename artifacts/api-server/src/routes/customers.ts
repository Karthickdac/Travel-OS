import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

router.get("/v1/customers", async (_req, res): Promise<void> => {
  const customers = await db.select().from(customersTable).where(eq(customersTable.isDeleted, false));
  res.json(ListCustomersResponse.parse(customers.map(mapCustomer)));
});

router.post("/v1/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
    })
    .returning();

  res.status(201).json(CreateCustomerResponse.parse(mapCustomer(customer)));
});

router.get("/v1/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(GetCustomerResponse.parse(mapCustomer(customer)));
});

router.patch("/v1/customers/:id", async (req, res): Promise<void> => {
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
    .where(eq(customersTable.id, params.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(UpdateCustomerResponse.parse(mapCustomer(customer)));
});

router.delete("/v1/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(customersTable).set({ isDeleted: true }).where(eq(customersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
