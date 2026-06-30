import { Router, type IRouter } from "express";
import { eq, count, sum, lt } from "drizzle-orm";
import { db, invoicesTable, expensesTable } from "@workspace/db";
import {
  ListInvoicesQueryParams,
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

function mapInvoice(i: typeof invoicesTable.$inferSelect) {
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    customerName: i.customerName,
    bookingId: i.bookingId ?? null,
    amount: Number(i.amount),
    taxAmount: Number(i.taxAmount),
    status: i.status,
    dueDate: i.dueDate,
    paidAt: i.paidAt?.toISOString() ?? null,
    paymentMode: i.paymentMode ?? null,
    createdAt: i.createdAt.toISOString(),
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
    receiptUrl: e.receiptUrl ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/v1/finance/invoices", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.isDeleted, false));
  res.json(ListInvoicesResponse.parse(invoices.map(mapInvoice)));
});

router.post("/v1/finance/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  invoiceCounter++;
  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      invoiceNumber: `INV${invoiceCounter}`,
      customerName: parsed.data.customerName,
      bookingId: parsed.data.bookingId,
      amount: String(parsed.data.amount),
      taxAmount: String(parsed.data.taxAmount ?? 0),
      dueDate: parsed.data.dueDate,
      status: "draft",
    })
    .returning();

  res.status(201).json(CreateInvoiceResponse.parse(mapInvoice(invoice)));
});

router.get("/v1/finance/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(GetInvoiceResponse.parse(mapInvoice(invoice)));
});

router.patch("/v1/finance/invoices/:id", async (req, res): Promise<void> => {
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

  const [invoice] = await db
    .update(invoicesTable)
    .set(updateData)
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(UpdateInvoiceResponse.parse(mapInvoice(invoice)));
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

  const [expense] = await db
    .insert(expensesTable)
    .values({
      category: parsed.data.category,
      amount: String(parsed.data.amount),
      date: parsed.data.date,
      description: parsed.data.description,
      vendorName: parsed.data.vendorName,
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
