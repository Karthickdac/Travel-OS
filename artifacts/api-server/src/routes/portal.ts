import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, bookingsTable, customersTable, supportTicketsTable } from "@workspace/db";

const router: IRouter = Router();

// All /portal/* routes are restricted to authenticated users with the
// `customer` role. Non-customers (admins/staff/master) and unauthenticated
// requests are rejected before any data is read.
router.use("/v1/portal", (req: any, res, next): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "customer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

async function resolveCustomer(req: any) {
  const email = req.user?.email as string | undefined;
  if (!email) return null;
  const companyId = req.user?.companyId as string | undefined;
  const conditions = [
    sql`lower(${customersTable.email}) = ${email.toLowerCase()}`,
    eq(customersTable.isDeleted, false),
  ];
  // Scope to the principal's tenant to avoid cross-tenant collisions on
  // duplicate emails.
  if (companyId) conditions.push(eq(customersTable.companyId, companyId));
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(...conditions));
  return customer ?? null;
}

function mapBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    id: b.id,
    bookingNumber: b.bookingNumber,
    type: b.type,
    status: b.status,
    pickupDate: b.pickupDate.toISOString(),
    pickupLocation: b.pickupLocation,
    dropLocation: b.dropLocation,
    customerName: b.customerName,
    customerPhone: b.customerPhone ?? null,
    amount: Number(b.amount),
    advancePaid: Number(b.advancePaid),
    driverName: b.driverName ?? null,
    vehicleNumber: b.vehicleNumber ?? null,
    vehicleCategory: b.vehicleCategory ?? null,
    notes: b.notes ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/v1/portal/profile", async (req, res): Promise<void> => {
  const customer = await resolveCustomer(req);
  if (!customer) {
    res.status(404).json({ error: "Customer profile not found" });
    return;
  }
  res.json(customer);
});

router.get("/v1/portal/bookings", async (req, res): Promise<void> => {
  const customer = await resolveCustomer(req);
  if (!customer) {
    res.json([]);
    return;
  }
  const rows = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.customerId, customer.id), eq(bookingsTable.isDeleted, false)))
    .orderBy(desc(bookingsTable.createdAt));
  res.json(rows.map(mapBooking));
});

router.get("/v1/portal/support", async (req, res): Promise<void> => {
  const customer = await resolveCustomer(req);
  if (!customer || !customer.email) {
    res.json([]);
    return;
  }
  const rows = await db
    .select()
    .from(supportTicketsTable)
    .where(
      and(
        eq(supportTicketsTable.customerEmail, customer.email),
        eq(supportTicketsTable.isDeleted, false),
      ),
    )
    .orderBy(desc(supportTicketsTable.createdAt));
  res.json(rows);
});

router.post("/v1/portal/support", async (req, res): Promise<void> => {
  const customer = await resolveCustomer(req);
  if (!customer) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const companyId = (req as any).user?.companyId ?? customer.companyId;
  if (!companyId) {
    res.status(400).json({ error: "No company associated with this account" });
    return;
  }
  const { subject, message, category, priority } = req.body ?? {};
  if (typeof subject !== "string" || !subject.trim() || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "subject and message are required" });
    return;
  }
  const [row] = await db
    .insert(supportTicketsTable)
    .values({
      companyId,
      ticketNumber: "TKT-" + Date.now().toString(36).toUpperCase(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      subject,
      message,
      category: category || "general",
      priority: priority || "medium",
    })
    .returning();
  res.status(201).json(row);
});

export default router;
