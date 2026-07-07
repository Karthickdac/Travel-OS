import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, leadsTable, quotationsTable, bookingsTable, companiesTable } from "@workspace/db";
import { createNotification } from "../lib/notify";
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
  ConvertLeadToBookingParams,
  ConvertLeadToBookingBody,
  ConvertLeadToBookingResponse,
  SendQuotationParams,
  SendQuotationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

class ConvertConflict extends Error {}

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
    customerPhone: q.customerPhone ?? null,
    publicToken: q.publicToken,
    sentAt: q.sentAt ? q.sentAt.toISOString() : null,
    respondedAt: q.respondedAt ? q.respondedAt.toISOString() : null,
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
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const leads = await db.select().from(leadsTable).where(and(eq(leadsTable.isDeleted, false), eq(leadsTable.companyId, companyId)));
  res.json(ListLeadsResponse.parse(leads.map(mapLead)));
});

router.post("/v1/crm/leads", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      companyId,
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

  await createNotification(companyId, {
    type: "lead.created",
    title: "New Lead",
    message: `${lead.name} added as a lead (source: ${lead.source})`,
    entityType: "lead",
    entityId: lead.id,
  });

  res.status(201).json(CreateLeadResponse.parse(mapLead(lead)));
});

router.get("/v1/crm/pipeline", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const statuses = ["new", "contacted", "qualified", "quotation_sent", "won", "lost"];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const [result] = await db.select({ total: count() }).from(leadsTable).where(and(eq(leadsTable.status, status), eq(leadsTable.companyId, companyId)));
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
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.companyId, companyId)));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(GetLeadResponse.parse(mapLead(lead)));
});

router.patch("/v1/crm/leads/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
    .where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.companyId, companyId)))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(mapLead(lead)));
});

router.delete("/v1/crm/leads/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(leadsTable).set({ isDeleted: true }).where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.companyId, companyId)));
  res.sendStatus(204);
});

// Quotations
router.get("/v1/crm/quotations", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const quotations = await db.select().from(quotationsTable).where(and(eq(quotationsTable.isDeleted, false), eq(quotationsTable.companyId, companyId)));
  res.json(ListQuotationsResponse.parse(quotations.map(mapQuotation)));
});

router.post("/v1/crm/quotations", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
      companyId,
      quotationNumber: `QT${quotationCounter}`,
      leadId: parsed.data.leadId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      validUntil: parsed.data.validUntil,
      items: parsed.data.items,
      totalAmount: String(totalAmount),
      taxAmount: String(taxAmount),
      notes: parsed.data.notes,
    })
    .returning();

  await createNotification(companyId, {
    type: "quotation.created",
    title: "New Quotation",
    message: `Quotation ${quotation.quotationNumber} created for ${quotation.customerName}`,
    entityType: "quotation",
    entityId: quotation.id,
  });

  res.status(201).json(CreateQuotationResponse.parse(mapQuotation(quotation)));
});

function buildWhatsAppUrl(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

router.post("/v1/crm/quotations/:id/send", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = SendQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(quotationsTable)
    .where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)));
  if (!existing || existing.isDeleted) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  if (existing.status !== "draft" && existing.status !== "sent") {
    res.status(400).json({ error: "Quotation cannot be sent in its current status" });
    return;
  }

  const [quotation] = await db
    .update(quotationsTable)
    .set({ status: "sent", sentAt: new Date() })
    .where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)))
    .returning();

  const [company] = await db
    .select({ name: companiesTable.name, domain: companiesTable.domain })
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId));

  const companyName = company?.name ?? "";
  let publicUrl = company?.domain
    ? `https://${company.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/quote/${quotation.publicToken}`
    : `/quote/${quotation.publicToken}`;

  let whatsappUrl: string | null = null;
  if (quotation.customerPhone) {
    const host = req.headers.host;
    const absoluteUrl = publicUrl.startsWith("http")
      ? publicUrl
      : `https://${host ?? ""}${publicUrl}`;
    const total = Number(quotation.totalAmount) + Number(quotation.taxAmount);
    const message = `Hello ${quotation.customerName}, here is your quotation ${quotation.quotationNumber} from ${companyName} for ₹${total}. View & approve: ${absoluteUrl}. Valid until ${quotation.validUntil}.`;
    whatsappUrl = buildWhatsAppUrl(quotation.customerPhone, message);
  }

  res.json(
    SendQuotationResponse.parse({
      quotation: mapQuotation(quotation),
      publicUrl,
      whatsappUrl,
    })
  );
});

router.get("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db.select().from(quotationsTable).where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)));
  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(GetQuotationResponse.parse(mapQuotation(quotation)));
});

router.patch("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
  if (parsed.data.customerPhone !== undefined) updateData.customerPhone = parsed.data.customerPhone;
  if (parsed.data.customerEmail !== undefined) updateData.customerEmail = parsed.data.customerEmail;

  const [quotation] = await db
    .update(quotationsTable)
    .set(updateData)
    .where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)))
    .returning();

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(UpdateQuotationResponse.parse(mapQuotation(quotation)));
});

router.delete("/v1/crm/quotations/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(quotationsTable).set({ isDeleted: true }).where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)));
  res.sendStatus(204);
});

router.post("/v1/crm/quotations/:id/convert", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = ConvertQuotationToBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db.select().from(quotationsTable).where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)));
  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  bookingCounter++;
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      companyId,
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

  await db.update(quotationsTable).set({ status: "converted" }).where(and(eq(quotationsTable.id, params.data.id), eq(quotationsTable.companyId, companyId)));

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

router.post("/v1/crm/leads/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertLeadToBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ConvertLeadToBookingBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as any).user as { role?: string; companyId?: string | null } | undefined;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead || lead.isDeleted) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  // Tenant isolation: company users may only convert their own company's leads.
  if (user.role !== "master_admin" && lead.companyId !== user.companyId) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  if (lead.status === "won") {
    res.status(409).json({ error: "Lead has already been converted" });
    return;
  }

  const body = parsed.data;

  const booking = await db.transaction(async (tx) => {
    // Re-read inside the transaction with a row lock to prevent duplicate conversions.
    const [locked] = await tx
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, lead.id))
      .for("update");
    if (!locked || locked.status === "won") {
      throw new ConvertConflict();
    }
    bookingCounter++;
    const [created] = await tx
      .insert(bookingsTable)
      .values({
        companyId: locked.companyId,
        bookingNumber: `BK${bookingCounter}`,
        type: body.type || "tour",
        status: "confirmed",
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : (locked.travelDate ? new Date(locked.travelDate) : new Date()),
        pickupLocation: body.pickupLocation || "TBD",
        dropLocation: body.dropLocation || locked.destination || "TBD",
        customerName: locked.name,
        customerPhone: locked.phone,
        amount: body.amount != null ? String(body.amount) : (locked.budget ?? "0"),
        advancePaid: body.advancePaid != null ? String(body.advancePaid) : "0",
        notes: body.notes || locked.notes || null,
      })
      .returning();
    // Mark the lead as won once it has produced a booking.
    await tx.update(leadsTable).set({ status: "won" }).where(eq(leadsTable.id, locked.id));
    return created;
  }).catch((err: unknown) => {
    if (err instanceof ConvertConflict) return null;
    throw err;
  });

  if (!booking) {
    res.status(409).json({ error: "Lead has already been converted" });
    return;
  }

  const mapped = {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    type: booking.type,
    status: booking.status,
    pickupDate: booking.pickupDate.toISOString(),
    pickupLocation: booking.pickupLocation,
    dropLocation: booking.dropLocation,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone ?? null,
    amount: Number(booking.amount),
    advancePaid: Number(booking.advancePaid),
    driverName: null,
    vehicleNumber: null,
    vehicleCategory: null,
    notes: booking.notes ?? null,
    createdAt: booking.createdAt.toISOString(),
  };

  res.status(201).json(ConvertLeadToBookingResponse.parse(mapped));
});

export default router;
