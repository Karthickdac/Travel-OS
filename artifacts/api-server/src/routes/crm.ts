import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, leadsTable, quotationsTable, bookingsTable } from "@workspace/db";
import {
  ListLeadsQueryParams,
  ListLeadsResponse,
  CreateLeadBody,
  CreateLeadResponse,
  GetLeadParams,
  GetLeadResponse,
  UpdateLeadParams,
  UpdateLeadBody,
  UpdateLeadResponse,
  DeleteLeadParams,
  GetLeadPipelineResponse,
  ListQuotationsQueryParams,
  ListQuotationsResponse,
  CreateQuotationBody,
  CreateQuotationResponse,
  GetQuotationParams,
  GetQuotationResponse,
  UpdateQuotationParams,
  UpdateQuotationBody,
  UpdateQuotationResponse,
  DeleteQuotationParams,
  ConvertQuotationToBookingParams,
  ConvertQuotationToBookingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let quotationCounter = 100;
let bookingCounter = 2000;

function mapLead(l: typeof leadsTable.$inferSelect) {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email ?? null,
    source: l.source,
    status: l.status,
    assignedTo: l.assignedTo ?? null,
    travelDate: l.travelDate ?? null,
    destination: l.destination ?? null,
    pax: l.pax ?? null,
    budget: l.budget !== null ? Number(l.budget) : null,
    notes: l.notes ?? null,
    followUpDate: l.followUpDate ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

function mapQuotation(q: typeof quotationsTable.$inferSelect) {
  return {
    id: q.id,
    quotationNumber: q.quotationNumber,
    leadId: q.leadId ?? "",
    customerName: q.customerName,
    customerEmail: q.customerEmail ?? null,
    status: q.status,
    totalAmount: Number(q.totalAmount),
    taxAmount: Number(q.taxAmount),
    validUntil: q.validUntil,
    items: (q.items as Array<{ description: string; quantity: number; unitPrice: number; total: number }>) || [],
    notes: q.notes ?? null,
    createdAt: q.createdAt.toISOString(),
  };
}

// Leads
router.get("/v1/crm/leads", async (req, res): Promise<void> => {
  const leads = await db.select().from(leadsTable).where(eq(leadsTable.isDeleted, false));
  res.json(ListLeadsResponse.parse(leads.map(mapLead)));
});

router.post("/v1/crm/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      source: parsed.data.source,
      destination: parsed.data.destination,
      travelDate: parsed.data.travelDate,
      pax: parsed.data.pax,
      budget: parsed.data.budget !== undefined ? String(parsed.data.budget) : null,
      notes: parsed.data.notes,
      status: "new",
    })
    .returning();

  res.status(201).json(CreateLeadResponse.parse(mapLead(lead)));
});

router.get("/v1/crm/pipeline", async (_req, res): Promise<void> => {
  const statuses = ["new", "contacted", "qualified", "quotation_sent", "won", "lost"];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const [result] = await db.select({ total: count() }).from(leadsTable).where(eq(leadsTable.status, status));
    counts[status] = result.total;
  }

  res.json(
    GetLeadPipelineResponse.parse({
      new: counts["new"] || 0,
      contacted: counts["contacted"] || 0,
      qualified: counts["qualified"] || 0,
      quotationSent: counts["quotation_sent"] || 0,
      won: counts["won"] || 0,
      lost: counts["lost"] || 0,
    })
  );
});

router.get("/v1/crm/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(GetLeadResponse.parse(mapLead(lead)));
});

router.patch("/v1/crm/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.assignedTo !== undefined) updateData.assignedTo = parsed.data.assignedTo;
  if (parsed.data.followUpDate !== undefined) updateData.followUpDate = parsed.data.followUpDate;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [lead] = await db
    .update(leadsTable)
    .set(updateData)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(mapLead(lead)));
});

router.delete("/v1/crm/leads/:id", async (req, res): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(leadsTable).set({ isDeleted: true }).where(eq(leadsTable.id, params.data.id));
  res.sendStatus(204);
});

// Quotations
router.get("/v1/crm/quotations", async (_req, res): Promise<void> => {
  const quotations = await db.select().from(quotationsTable).where(eq(quotationsTable.isDeleted, false));
  res.json(ListQuotationsResponse.parse(quotations.map(mapQuotation)));
});

router.post("/v1/crm/quotations", async (req, res): Promise<void> => {
  const parsed = CreateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  quotationCounter++;
  const totalAmount = parsed.data.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = totalAmount * 0.18;

  const [quotation] = await db
    .insert(quotationsTable)
    .values({
      quotationNumber: `QT${quotationCounter}`,
      leadId: parsed.data.leadId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      validUntil: parsed.data.validUntil,
      items: parsed.data.items,
      totalAmount: String(totalAmount),
      taxAmount: String(taxAmount),
      notes: parsed.data.notes,
    })
    .returning();

  res.status(201).json(CreateQuotationResponse.parse(mapQuotation(quotation)));
});

router.get("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const params = GetQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, params.data.id));
  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(GetQuotationResponse.parse(mapQuotation(quotation)));
});

router.patch("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const params = UpdateQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.validUntil !== undefined) updateData.validUntil = parsed.data.validUntil;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [quotation] = await db
    .update(quotationsTable)
    .set(updateData)
    .where(eq(quotationsTable.id, params.data.id))
    .returning();

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(UpdateQuotationResponse.parse(mapQuotation(quotation)));
});

router.delete("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const params = DeleteQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(quotationsTable).set({ isDeleted: true }).where(eq(quotationsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/v1/crm/quotations/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertQuotationToBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, params.data.id));
  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  bookingCounter++;
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      bookingNumber: `BK${bookingCounter}`,
      type: "tour",
      status: "confirmed",
      pickupDate: new Date(),
      pickupLocation: "TBD",
      dropLocation: "TBD",
      customerName: quotation.customerName,
      amount: quotation.totalAmount,
      advancePaid: "0",
    })
    .returning();

  await db.update(quotationsTable).set({ status: "converted" }).where(eq(quotationsTable.id, params.data.id));

  const mapped = {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    type: booking.type,
    status: booking.status,
    pickupDate: booking.pickupDate.toISOString(),
    pickupLocation: booking.pickupLocation,
    dropLocation: booking.dropLocation,
    customerName: booking.customerName,
    customerPhone: null,
    amount: Number(booking.amount),
    advancePaid: Number(booking.advancePaid),
    driverName: null,
    vehicleNumber: null,
    vehicleCategory: null,
    notes: null,
    createdAt: booking.createdAt.toISOString(),
  };

  res.status(201).json(ConvertQuotationToBookingResponse.parse(mapped));
});

export default router;
