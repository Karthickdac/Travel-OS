import { Router, type IRouter } from "express";
import { eq, count, desc, and } from "drizzle-orm";
import { db, bookingsTable, driversTable, vehiclesTable } from "@workspace/db";
import { createNotification } from "../lib/notify";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  DeleteBookingParams,
  AssignBookingParams,
  AssignBookingBody,
  AssignBookingResponse,
  CancelBookingParams,
  CancelBookingResponse,
  GetRecentBookingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

let bookingCounter = 1000;

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

router.get("/v1/dashboard/recent-bookings", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.companyId, companyId))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(10);
  res.json(GetRecentBookingsResponse.parse(bookings.map(mapBooking)));
});

router.get("/v1/bookings", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const query = ListBookingsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.isDeleted, false), eq(bookingsTable.companyId, companyId)))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ total: count() })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.isDeleted, false), eq(bookingsTable.companyId, companyId)));

  res.json(
    ListBookingsResponse.parse({
      data: bookings.map(mapBooking),
      total: totalResult.total,
      page,
      limit,
    })
  );
});

router.post("/v1/bookings", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  bookingCounter++;
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      companyId,
      bookingNumber: `BK${bookingCounter}`,
      type: parsed.data.type,
      status: "enquiry",
      pickupDate: new Date(parsed.data.pickupDate),
      pickupLocation: parsed.data.pickupLocation,
      dropLocation: parsed.data.dropLocation,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      amount: String(parsed.data.amount),
      advancePaid: String(parsed.data.advancePaid ?? 0),
      notes: parsed.data.notes,
    })
    .returning();

  await createNotification(companyId, {
    type: "booking.created",
    title: "New Booking",
    message: `New booking ${booking.bookingNumber} for ${booking.customerName}`,
    entityType: "booking",
    entityId: booking.id,
  });

  res.status(201).json(CreateBookingResponse.parse(mapBooking(booking)));
});

router.get("/v1/bookings/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, params.data.id), eq(bookingsTable.companyId, companyId)));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(mapBooking(booking)));
});

router.patch("/v1/bookings/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.pickupDate !== undefined) updateData.pickupDate = new Date(parsed.data.pickupDate);
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [booking] = await db
    .update(bookingsTable)
    .set(updateData)
    .where(and(eq(bookingsTable.id, params.data.id), eq(bookingsTable.companyId, companyId)))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (parsed.data.status === "confirmed") {
    await createNotification(companyId, {
      type: "booking.confirmed",
      title: "Booking Confirmed",
      message: `Booking ${booking.bookingNumber} for ${booking.customerName} is confirmed`,
      entityType: "booking",
      entityId: booking.id,
    });
  }

  res.json(UpdateBookingResponse.parse(mapBooking(booking)));
});

router.delete("/v1/bookings/:id", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .update(bookingsTable)
    .set({ isDeleted: true })
    .where(and(eq(bookingsTable.id, params.data.id), eq(bookingsTable.companyId, companyId)));
  res.sendStatus(204);
});

router.post("/v1/bookings/:id/assign", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = AssignBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [driver] = await db
    .select()
    .from(driversTable)
    .where(and(eq(driversTable.id, parsed.data.driverId), eq(driversTable.companyId, companyId)));
  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.id, parsed.data.vehicleId), eq(vehiclesTable.companyId, companyId)));

  const [booking] = await db
    .update(bookingsTable)
    .set({
      driverId: parsed.data.driverId,
      driverName: driver?.name,
      vehicleId: parsed.data.vehicleId,
      vehicleNumber: vehicle?.registrationNumber,
      vehicleCategory: vehicle?.category,
      status: "assigned",
    })
    .where(and(eq(bookingsTable.id, params.data.id), eq(bookingsTable.companyId, companyId)))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  await createNotification(companyId, {
    type: "booking.assigned",
    title: "Driver Assigned",
    message: `Driver ${driver?.name ?? "unknown"} assigned to booking ${booking.bookingNumber}`,
    entityType: "booking",
    entityId: booking.id,
  });

  res.json(AssignBookingResponse.parse(mapBooking(booking)));
});

router.post("/v1/bookings/:id/cancel", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(and(eq(bookingsTable.id, params.data.id), eq(bookingsTable.companyId, companyId)))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(CancelBookingResponse.parse(mapBooking(booking)));
});

export default router;
