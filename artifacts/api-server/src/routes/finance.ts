import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, invoicesTable, expensesTable, companiesTable } from "@workspace/db";
import {
  ListInvoicesResponse,
  CreateInvoiceBody,
  CreateInvoiceResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  UpdateInvoiceResponse,
  ListExpensesResponse,
  CreateExpenseBody,
  CreateExpenseResponse,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  GetFinanceSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let invoiceCounter = 1000;

function mapInvoice(
  i: typeof invoicesTable.$inferSelect,
  company?: typeof companiesTable.$inferSelect | null,
) {
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    customerName: i.customerName,
    customerPhone: i.customerPhone ?? null,
    customerAddress: i.customerAddress ?? null,
    bookingId: i.bookingId ?? null,
    vehicleNumber: i.vehicleNumber ?? null,
    driverName: i.driverName ?? null,
    tripFrom: i.tripFrom ?? null,
    tripTo: i.tripTo ?? null,
    kmsTraveled: i.kmsTraveled ?? null,
    startingKm: i.startingKm ?? null,
    closingKm: i.closingKm ?? null,
    serviceDate: i.serviceDate ?? null,
    description: i.description ?? null,
    hireHours: Number(i.hireHours),
    hireHourRate: Number(i.hireHourRate),
    hireKms: i.hireKms,
    hireKmRate: Number(i.hireKmRate),
    rentDays: Number(i.rentDays),
    rentDayRate: Number(i.rentDayRate),
    fuelKms: i.fuelKms,
    fuelKmRate: Number(i.fuelKmRate),
    battaQty: Number(i.battaQty),
    battaRate: Number(i.battaRate),
    hillsCharge: Number(i.hillsCharge),
    permitCharge: Number(i.permitCharge),
    tollParking: Number(i.tollParking),
    taxRate: i.taxRate,
    sgstRate: Number(i.sgstRate),
    cgstRate: Number(i.cgstRate),
    sgstAmount: Number(i.sgstAmount),
    cgstAmount: Number(i.cgstAmount),
    amount: Number(i.amount),
    taxAmount: Number(i.taxAmount),
    notes: i.notes ?? null,
    status: i.status,
    dueDate: i.dueDate,
    paidAt: i.paidAt?.toISOString() ?? null,
    paymentMode: i.paymentMode ?? null,
    createdAt: i.createdAt.toISOString(),
    company: company
      ? {
          name: company.name ?? null,
          phone: company.phone ?? null,
          gstNumber: company.gstNumber ?? null,
          city: company.city ?? null,
          country: company.country ?? null,
          logo: company.logo ?? null,
          email: company.email ?? null,
        }
      : null,
  };
}

function mapExpense(e: typeof expensesTable.$inferSelect) {
  return {
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    date: e.date,
    description: e.description,
    vendorName: e.vendorName ?? null,
    vehicleId: e.vehicleId ?? null,
    vehicleNumber: e.vehicleNumber ?? null,
    driverId: e.driverId ?? null,
    driverName: e.driverName ?? null,
    notes: e.notes ?? null,
    receiptUrl: e.receiptUrl ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

async function fetchCompany(companyId: string | null | undefined) {
  if (!companyId) return null;
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId));
  return company ?? null;
}

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

router.get("/v1/finance/invoices", async (req, res): Promise<void> => {
  const cid = getCompanyId(req);
  if (!cid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(invoicesTable)
    .leftJoin(companiesTable, eq(invoicesTable.companyId, companiesTable.id))
    .where(and(eq(invoicesTable.isDeleted, false), eq(invoicesTable.companyId, cid)));
  res.json(ListInvoicesResponse.parse(rows.map((r) => mapInvoice(r.invoices, r.companies))));
});

router.post("/v1/finance/invoices", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  invoiceCounter++;
  const d = parsed.data;

  const lineTotal =
    (d.hireHours ?? 0) * (d.hireHourRate ?? 0) +
    (d.hireKms ?? 0) * (d.hireKmRate ?? 0) +
    (d.rentDays ?? 0) * (d.rentDayRate ?? 0) +
    (d.fuelKms ?? 0) * (d.fuelKmRate ?? 0) +
    (d.battaQty ?? 0) * (d.battaRate ?? 0) +
    (d.hillsCharge ?? 0) +
    (d.permitCharge ?? 0) +
    (d.tollParking ?? 0);
  const subtotal = lineTotal > 0 ? lineTotal : d.amount ?? 0;
  const sgstRate = d.sgstRate ?? 0;
  const cgstRate = d.cgstRate ?? 0;
  const sgstAmount = Math.round(subtotal * sgstRate) / 100;
  const cgstAmount = Math.round(subtotal * cgstRate) / 100;
  const taxAmount = Math.round((sgstAmount + cgstAmount) * 100) / 100;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      companyId,
      invoiceNumber: `INV${invoiceCounter}`,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerAddress: d.customerAddress,
      bookingId: d.bookingId,
      vehicleNumber: d.vehicleNumber,
      driverName: d.driverName,
      tripFrom: d.tripFrom,
      tripTo: d.tripTo,
      kmsTraveled: d.kmsTraveled,
      startingKm: d.startingKm,
      closingKm: d.closingKm,
      serviceDate: d.serviceDate,
      description: d.description,
      hireHours: String(d.hireHours ?? 0),
      hireHourRate: String(d.hireHourRate ?? 0),
      hireKms: d.hireKms ?? 0,
      hireKmRate: String(d.hireKmRate ?? 0),
      rentDays: String(d.rentDays ?? 0),
      rentDayRate: String(d.rentDayRate ?? 0),
      fuelKms: d.fuelKms ?? 0,
      fuelKmRate: String(d.fuelKmRate ?? 0),
      battaQty: String(d.battaQty ?? 0),
      battaRate: String(d.battaRate ?? 0),
      hillsCharge: String(d.hillsCharge ?? 0),
      permitCharge: String(d.permitCharge ?? 0),
      tollParking: String(d.tollParking ?? 0),
      taxRate: d.taxRate ?? Math.round(sgstRate + cgstRate),
      sgstRate: String(sgstRate),
      cgstRate: String(cgstRate),
      sgstAmount: String(sgstAmount),
      cgstAmount: String(cgstAmount),
      amount: String(subtotal),
      taxAmount: String(taxAmount),
      dueDate: d.dueDate,
      paymentMode: d.paymentMode,
      notes: d.notes,
      status: "draft",
    })
    .returning();

  const company = await fetchCompany(invoice.companyId);
  res.status(201).json(CreateInvoiceResponse.parse(mapInvoice(invoice, company)));
});

router.get("/v1/finance/invoices/:id", async (req, res): Promise<void> => {
  const cid = getCompanyId(req);
  if (!cid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.companyId, cid)));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const company = await fetchCompany(invoice.companyId);
  res.json(GetInvoiceResponse.parse(mapInvoice(invoice, company)));
});

router.patch("/v1/finance/invoices/:id", async (req, res): Promise<void> => {
  const cid = getCompanyId(req);
  if (!cid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.paymentMode !== undefined) updateData.paymentMode = parsed.data.paymentMode;
  if (parsed.data.paidAt !== undefined) updateData.paidAt = new Date(parsed.data.paidAt);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [invoice] = await db
    .update(invoicesTable)
    .set(updateData)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.companyId, cid)))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const company = await fetchCompany(invoice.companyId);
  res.json(UpdateInvoiceResponse.parse(mapInvoice(invoice, company)));
});

router.get("/v1/finance/expenses", async (_req, res): Promise<void> => {
  const expenses = await db.select().from(expensesTable).where(eq(expensesTable.isDeleted, false));
  res.json(ListExpensesResponse.parse(expenses.map(mapExpense)));
});

router.post("/v1/finance/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const [expense] = await db
    .insert(expensesTable)
    .values({
      category: d.category,
      amount: String(d.amount),
      date: d.date,
      description: d.description,
      vendorName: d.vendorName,
      vehicleId: d.vehicleId,
      vehicleNumber: d.vehicleNumber,
      driverId: d.driverId,
      driverName: d.driverName,
      notes: d.notes,
    })
    .returning();

  res.status(201).json(CreateExpenseResponse.parse(mapExpense(expense)));
});

router.patch("/v1/finance/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.vendorName !== undefined) updateData.vendorName = parsed.data.vendorName;
  if (parsed.data.vehicleId !== undefined) updateData.vehicleId = parsed.data.vehicleId || null;
  if (parsed.data.vehicleNumber !== undefined) updateData.vehicleNumber = parsed.data.vehicleNumber;
  if (parsed.data.driverId !== undefined) updateData.driverId = parsed.data.driverId || null;
  if (parsed.data.driverName !== undefined) updateData.driverName = parsed.data.driverName;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  const [expense] = await db
    .update(expensesTable)
    .set(updateData)
    .where(eq(expensesTable.id, params.data.id))
    .returning();
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(mapExpense(expense));
});

router.delete("/v1/finance/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .update(expensesTable)
    .set({ isDeleted: true })
    .where(eq(expensesTable.id, params.data.id));
  res.status(204).send();
});

router.get("/v1/finance/summary", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.isDeleted, false));
  const expenses = await db.select().from(expensesTable).where(eq(expensesTable.isDeleted, false));

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "draft");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const grossMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  res.json(
    GetFinanceSummaryResponse.parse({
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingInvoices: pendingInvoices.length,
      overdueAmount,
      paidInvoices: paidInvoices.length,
      grossMargin,
    })
  );
});

export default router;
