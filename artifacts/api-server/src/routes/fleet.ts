import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, vehiclesTable, vehicleCategoriesTable } from "@workspace/db";
import {
  ListVehiclesQueryParams,
  ListVehiclesResponse,
  CreateVehicleBody,
  CreateVehicleResponse,
  GetVehicleParams,
  GetVehicleResponse,
  UpdateVehicleParams,
  UpdateVehicleBody,
  UpdateVehicleResponse,
  DeleteVehicleParams,
  ListVehicleCategoriesResponse,
  CreateVehicleCategoryBody,
  CreateVehicleCategoryResponse,
  GetFleetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapVehicle(v: typeof vehiclesTable.$inferSelect) {
  return {
    id: v.id,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color ?? null,
    category: v.category ?? "Sedan",
    status: v.status,
    driverName: null,
    fuelType: v.fuelType ?? null,
    seatingCapacity: v.seatingCapacity ?? null,
    imageUrl: v.imageUrl ?? null,
    lastService: v.lastService ?? null,
    insuranceExpiry: v.insuranceExpiry ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

function mapCategory(c: typeof vehicleCategoriesTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    baseRate: c.baseRate !== null ? Number(c.baseRate) : null,
    perKmRate: c.perKmRate !== null ? Number(c.perKmRate) : null,
    imageUrl: c.imageUrl ?? null,
  };
}

router.get("/v1/fleet/stats", async (_req, res): Promise<void> => {
  const [total] = await db.select({ total: count() }).from(vehiclesTable).where(eq(vehiclesTable.isDeleted, false));
  const [available] = await db.select({ total: count() }).from(vehiclesTable).where(eq(vehiclesTable.status, "available"));
  const [onTrip] = await db.select({ total: count() }).from(vehiclesTable).where(eq(vehiclesTable.status, "on_trip"));
  const [maintenance] = await db.select({ total: count() }).from(vehiclesTable).where(eq(vehiclesTable.status, "maintenance"));
  const [offRoad] = await db.select({ total: count() }).from(vehiclesTable).where(eq(vehiclesTable.status, "off_road"));

  const utilizationRate = total.total > 0 ? Math.round((onTrip.total / total.total) * 100) : 0;

  res.json(
    GetFleetStatsResponse.parse({
      totalVehicles: total.total,
      available: available.total,
      onTrip: onTrip.total,
      maintenance: maintenance.total,
      offRoad: offRoad.total,
      utilizationRate,
    })
  );
});

router.get("/v1/fleet/vehicles", async (req, res): Promise<void> => {
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.isDeleted, false));
  res.json(ListVehiclesResponse.parse(vehicles.map(mapVehicle)));
});

router.post("/v1/fleet/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db
    .insert(vehiclesTable)
    .values({
      registrationNumber: parsed.data.registrationNumber,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      color: parsed.data.color,
      categoryId: parsed.data.categoryId,
      fuelType: parsed.data.fuelType,
      seatingCapacity: parsed.data.seatingCapacity,
      insuranceExpiry: parsed.data.insuranceExpiry,
      status: "available",
    })
    .returning();

  res.status(201).json(CreateVehicleResponse.parse(mapVehicle(vehicle)));
});

router.get("/v1/fleet/vehicles/:id", async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(GetVehicleResponse.parse(mapVehicle(vehicle)));
});

router.patch("/v1/fleet/vehicles/:id", async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.fuelType !== undefined) updateData.fuelType = parsed.data.fuelType;
  if (parsed.data.lastService !== undefined) updateData.lastService = parsed.data.lastService;
  if (parsed.data.insuranceExpiry !== undefined) updateData.insuranceExpiry = parsed.data.insuranceExpiry;

  const [vehicle] = await db
    .update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(UpdateVehicleResponse.parse(mapVehicle(vehicle)));
});

router.delete("/v1/fleet/vehicles/:id", async (req, res): Promise<void> => {
  const params = DeleteVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.update(vehiclesTable).set({ isDeleted: true }).where(eq(vehiclesTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/v1/fleet/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(vehicleCategoriesTable);
  res.json(ListVehicleCategoriesResponse.parse(categories.map(mapCategory)));
});

router.post("/v1/fleet/categories", async (req, res): Promise<void> => {
  const parsed = CreateVehicleCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db
    .insert(vehicleCategoriesTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      baseRate: parsed.data.baseRate !== undefined ? String(parsed.data.baseRate) : null,
      perKmRate: parsed.data.perKmRate !== undefined ? String(parsed.data.perKmRate) : null,
    })
    .returning();

  res.status(201).json(CreateVehicleCategoryResponse.parse(mapCategory(category)));
});

export default router;
