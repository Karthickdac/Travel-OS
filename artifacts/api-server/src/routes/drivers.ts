import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, driversTable } from "@workspace/db";
import {
  ListDriversQueryParams,
  ListDriversResponse,
  CreateDriverBody,
  CreateDriverResponse,
  GetDriverParams,
  GetDriverResponse,
  UpdateDriverParams,
  UpdateDriverBody,
  UpdateDriverResponse,
  DeleteDriverParams,
  GetDriverAvailabilityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapDriver(d: typeof driversTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email ?? null,
    status: d.status,
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry ?? null,
    rating: d.rating !== null ? Number(d.rating) : null,
    totalTrips: d.totalTrips,
    photoUrl: d.photoUrl ?? null,
    vehicleAssigned: d.vehicleId ?? null,
    joiningDate: d.joiningDate ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/v1/drivers/availability", async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).where(eq(driversTable.isDeleted, false));
  res.json(
    GetDriverAvailabilityResponse.parse(
      drivers.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        phone: d.phone,
        currentTrip: null,
        rating: d.rating !== null ? Number(d.rating) : null,
      }))
    )
  );
});

router.get("/v1/drivers", async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).where(eq(driversTable.isDeleted, false));
  res.json(ListDriversResponse.parse(drivers.map(mapDriver)));
});

router.post("/v1/drivers", async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [driver] = await db
    .insert(driversTable)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      licenseNumber: parsed.data.licenseNumber,
      licenseExpiry: parsed.data.licenseExpiry,
      joiningDate: parsed.data.joiningDate,
      vehicleId: parsed.data.vehicleId,
    })
    .returning();

  res.status(201).json(CreateDriverResponse.parse(mapDriver(driver)));
});

router.get("/v1/drivers/:id", async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.json(GetDriverResponse.parse(mapDriver(driver)));
});

router.patch("/v1/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.licenseExpiry !== undefined) updateData.licenseExpiry = parsed.data.licenseExpiry;
  if (parsed.data.vehicleId !== undefined) updateData.vehicleId = parsed.data.vehicleId;

  const [driver] = await db
    .update(driversTable)
    .set(updateData)
    .where(eq(driversTable.id, params.data.id))
    .returning();

  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  res.json(UpdateDriverResponse.parse(mapDriver(driver)));
});

router.delete("/v1/drivers/:id", async (req, res): Promise<void> => {
  const params = DeleteDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(driversTable).set({ isDeleted: true }).where(eq(driversTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
