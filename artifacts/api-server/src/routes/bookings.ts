import { Router, type IRouter } from "express";
import { eq, count, desc, and } from "drizzle-orm";
import { db, bookingsTable, driversTable, vehiclesTable } from "@workspace/db";
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

router.get("/v1/dashboard/recent-bookings", async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)).limit(10);
  res.json(GetRecentBookingsResponse.parse(bookings.map(mapBooking)));
});

router.get("/v1/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.isDeleted, false))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ total: count() }).from(bookingsTable).where(eq(bookingsTable.isDeleted, false));

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
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  bookingCounter++;
  const [booking] = await db
    .insert(bookingsTable)
    .values({
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

  res.status(201).json(CreateBookingResponse.parse(mapBooking(booking)));
});

router.get("/v1/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(mapBooking(booking)));
});

router.patch("/v1/bookings/:id", async (req, res): Promise<void> => {
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
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateBookingResponse.parse(mapBooking(booking)));
});

router.delete("/v1/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(bookingsTable).set({ isDeleted: true }).where(eq(bookingsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/v1/bookings/:id/assign", async (req, res): Promise<void> => {
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

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, parsed.data.driverId));
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));

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
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(AssignBookingResponse.parse(mapBooking(booking)));
});

router.post("/v1/bookings/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(CancelBookingResponse.parse(mapBooking(booking)));
});

export default router;
