import { Router, type IRouter } from "express";
import { eq, count, sum, gte, and } from "drizzle-orm";
import { db, bookingsTable, driversTable, vehiclesTable, leadsTable, quotationsTable, invoicesTable } from "@workspace/db";
import {
  GetCompanyDashboardResponse,
  GetRevenueTrendQueryParams,
  GetRevenueTrendResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCompanyId(req: any): string | null {
  return req.user?.companyId ?? null;
}

router.get("/v1/dashboard", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayBookingsResult] = await db
    .select({ total: count() })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.isDeleted, false), eq(bookingsTable.companyId, companyId), gte(bookingsTable.createdAt, today)));

  const [availableDrivers] = await db
    .select({ total: count() })
    .from(driversTable)
    .where(and(eq(driversTable.isDeleted, false), eq(driversTable.companyId, companyId), eq(driversTable.status, "available")));

  const [totalVehicles] = await db
    .select({ total: count() })
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.isDeleted, false), eq(vehiclesTable.companyId, companyId)));

  const [activeTrips] = await db
    .select({ total: count() })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.isDeleted, false), eq(bookingsTable.companyId, companyId), eq(bookingsTable.status, "in_progress")));

  const [pendingLeads] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(and(eq(leadsTable.isDeleted, false), eq(leadsTable.companyId, companyId), eq(leadsTable.status, "new")));

  const [pendingQuotations] = await db
    .select({ total: count() })
    .from(quotationsTable)
    .where(and(eq(quotationsTable.isDeleted, false), eq(quotationsTable.companyId, companyId), eq(quotationsTable.status, "draft")));

  const [overdueInvoices] = await db
    .select({ total: count() })
    .from(invoicesTable)
    .where(and(eq(invoicesTable.isDeleted, false), eq(invoicesTable.companyId, companyId), eq(invoicesTable.status, "overdue")));

  const paidInvoices = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.isDeleted, false), eq(invoicesTable.companyId, companyId), eq(invoicesTable.status, "paid"), gte(invoicesTable.createdAt, monthStart)));

  const monthlyRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  const todayPaid = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.isDeleted, false), eq(invoicesTable.companyId, companyId), eq(invoicesTable.status, "paid"), gte(invoicesTable.createdAt, today)));
  const todayRevenue = todayPaid.reduce((sum, i) => sum + Number(i.amount), 0);

  res.json(
    GetCompanyDashboardResponse.parse({
      todayBookings: todayBookingsResult.total,
      todayRevenue,
      monthlyRevenue,
      activeTrips: activeTrips.total,
      availableDrivers: availableDrivers.total,
      totalVehicles: totalVehicles.total,
      pendingLeads: pendingLeads.total,
      pendingQuotations: pendingQuotations.total,
      overdueInvoices: overdueInvoices.total,
    })
  );
});

router.get("/v1/dashboard/revenue-trend", async (req, res): Promise<void> => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const query = GetRevenueTrendQueryParams.safeParse(req.query);
  const months = (query.success ? query.data.months : null) ?? 6;

  const trend = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const paidInMonth = await db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.isDeleted, false),
          eq(invoicesTable.companyId, companyId),
          eq(invoicesTable.status, "paid"),
          gte(invoicesTable.createdAt, monthStart)
        )
      );

    const bookingsInMonth = await db
      .select({ total: count() })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.isDeleted, false),
          eq(bookingsTable.companyId, companyId),
          gte(bookingsTable.createdAt, monthStart)
        )
      );

    const revenue = paidInMonth.reduce((s, i) => s + Number(i.amount), 0);
    const monthName = monthStart.toLocaleString("default", { month: "short", year: "2-digit" });

    trend.push({ month: monthName, revenue, bookings: bookingsInMonth[0].total });
  }

  res.json(GetRevenueTrendResponse.parse(trend));
});

export default router;
