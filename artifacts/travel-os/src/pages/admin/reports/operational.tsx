import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Car, Package, Users, FileText, CalendarRange, Building2, Download, IndianRupee, TrendingUp } from "lucide-react";

function downloadCsv(filename: string, rows: (string | number)[][], headers: string[]) {
  const csvContent = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function asArray<T = any>(d: any): T[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const inr = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: any }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs mt-1 text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center py-10 text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-11 rounded-lg" />
      ))}
    </div>
  );
}

export default function OperationalReports() {
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/v1/fleet/vehicles"],
    queryFn: () => api.get("/fleet/vehicles"),
  });
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/v1/bookings"],
    queryFn: () => api.get("/bookings"),
  });
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["/v1/tours/packages"],
    queryFn: () => api.get("/tours/packages"),
  });
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["/v1/customers"],
    queryFn: () => api.get("/customers"),
  });
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery({
    queryKey: ["/v1/crm/quotations"],
    queryFn: () => api.get("/crm/quotations"),
  });
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/v1/vendors"],
    queryFn: () => api.get("/vendors"),
  });
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["/v1/fleet/availability"],
    queryFn: () => api.get("/fleet/availability"),
  });

  const vehicles = asArray(vehiclesData);
  const bookings = asArray(bookingsData);
  const packages = asArray(packagesData);
  const customers = asArray(customersData);
  const quotations = asArray(quotationsData);
  const vendors = asArray(vendorsData);
  const availability = asArray(availabilityData);

  // ---- Vehicle Utilisation ----
  const totalVehicles = vehicles.length;
  const onTrip = vehicles.filter((v: any) => v.status === "on_trip").length;
  const availableVeh = vehicles.filter((v: any) => v.status === "available").length;
  const utilisationRate = totalVehicles > 0 ? Math.round((onTrip / totalVehicles) * 100) : 0;
  const vehicleRows = vehicles.map((v: any) => {
    const reg = v.registrationNumber ?? "";
    return {
      reg,
      model: `${v.make ?? ""} ${v.model ?? ""}`.trim() || "—",
      category: v.category ?? "—",
      status: v.status ?? "—",
    };
  });
  const utilChart = [
    { name: "On Trip", count: onTrip },
    { name: "Available", count: availableVeh },
    { name: "Maintenance", count: vehicles.filter((v: any) => v.status === "maintenance").length },
    { name: "Off Road", count: vehicles.filter((v: any) => v.status === "off_road").length },
  ].filter((d) => d.count > 0);

  // ---- Tour / Package performance ----
  const totalPackages = packages.length;
  const activePackages = packages.filter((p: any) => p.isActive).length;
  const totalPackageBookings = packages.reduce((s: number, p: any) => s + Number(p.totalBookings ?? 0), 0);
  const packageRows = [...packages]
    .sort((a: any, b: any) => Number(b.totalBookings ?? 0) - Number(a.totalBookings ?? 0))
    .map((p: any) => ({
      title: p.title ?? "—",
      destination: p.destinationName ?? "—",
      type: p.packageType ?? "—",
      price: Number(p.price ?? 0),
      bookings: Number(p.totalBookings ?? 0),
      active: p.isActive,
    }));
  const topPackagesChart = packageRows.slice(0, 6).map((p) => ({ name: p.title.slice(0, 14), count: p.bookings }));

  // ---- Customer report ----
  const totalCustomers = customers.length;
  const totalSpentAll = customers.reduce((s: number, c: any) => s + Number(c.totalSpent ?? 0), 0);
  const totalLoyalty = customers.reduce((s: number, c: any) => s + Number(c.loyaltyPoints ?? 0), 0);
  const customerRows = [...customers]
    .sort((a: any, b: any) => Number(b.totalSpent ?? 0) - Number(a.totalSpent ?? 0))
    .map((c: any) => ({
      name: c.name ?? "—",
      phone: c.phone ?? "—",
      city: c.city ?? "—",
      bookings: Number(c.totalBookings ?? 0),
      spent: Number(c.totalSpent ?? 0),
      loyalty: Number(c.loyaltyPoints ?? 0),
    }));

  // ---- Quotation report ----
  const totalQuotations = quotations.length;
  const acceptedQuotations = quotations.filter((q: any) => q.status === "accepted").length;
  const quotationValue = quotations.reduce((s: number, q: any) => s + Number(q.totalAmount ?? 0), 0);
  const conversionRate = totalQuotations > 0 ? Math.round((acceptedQuotations / totalQuotations) * 100) : 0;
  const quotationRows = quotations.map((q: any) => ({
    number: q.quotationNumber ?? "—",
    customer: q.customerName ?? "—",
    status: q.status ?? "—",
    amount: Number(q.totalAmount ?? 0),
    validUntil: q.validUntil ?? "—",
  }));

  // ---- Occupancy ----
  const blockedVehicleIds = new Set(
    availability.map((a: any) => a.block?.vehicleId).filter(Boolean)
  );
  const blockedCount = blockedVehicleIds.size;
  const occupancyRate = totalVehicles > 0 ? Math.round((blockedCount / totalVehicles) * 100) : 0;
  const occupancyRows = availability.map((a: any) => ({
    reg: a.vehicleRegNo ?? "—",
    model: a.vehicleModel ?? "—",
    reason: a.block?.reason ?? "—",
    from: a.block?.fromDate ?? "—",
    to: a.block?.toDate ?? "—",
    notes: a.block?.notes ?? "—",
  }));

  // ---- Vendor report ----
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v: any) => v.status === "active").length;
  const pendingSettlement = vendors.reduce((s: number, v: any) => s + Number(v.pendingSettlement ?? 0), 0);
  const vendorRows = vendors.map((v: any) => ({
    name: v.name ?? "—",
    contact: v.contactName ?? "—",
    phone: v.phone ?? "—",
    status: v.status ?? "—",
    trips: Number(v.totalTrips ?? 0),
    pending: Number(v.pendingSettlement ?? 0),
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operational Reports</h1>
        <p className="text-muted-foreground mt-1">
          Fleet, tours, customers, quotations, occupancy and vendor performance reports.
        </p>
      </div>

      <Tabs defaultValue="utilisation" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="utilisation" className="gap-1.5"><Car className="h-4 w-4" />Vehicle Utilisation</TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5"><Package className="h-4 w-4" />Tour / Package</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="h-4 w-4" />Customers</TabsTrigger>
          <TabsTrigger value="quotations" className="gap-1.5"><FileText className="h-4 w-4" />Quotations</TabsTrigger>
          <TabsTrigger value="occupancy" className="gap-1.5"><CalendarRange className="h-4 w-4" />Occupancy</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-1.5"><Building2 className="h-4 w-4" />Vendors</TabsTrigger>
        </TabsList>

        {/* Vehicle Utilisation */}
        <TabsContent value="utilisation" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Vehicles" value={totalVehicles} icon={Car} />
            <StatCard title="On Trip" value={onTrip} sub="Currently deployed" icon={TrendingUp} />
            <StatCard title="Available" value={availableVeh} sub="Ready to assign" icon={Car} />
            <StatCard title="Utilisation Rate" value={`${utilisationRate}%`} sub="On trip / total" icon={TrendingUp} />
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Fleet Status Distribution</CardTitle>
              <CardDescription>Vehicles by current status</CardDescription>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : utilChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={utilChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-muted-foreground">No vehicle data yet</div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vehicle Utilisation</CardTitle>
                <CardDescription>Per-vehicle status overview</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "vehicle-utilisation.csv",
                    vehicleRows.map((v) => [v.reg, v.model, v.category, v.status]),
                    ["Registration", "Model", "Category", "Status"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleRows.length === 0 ? (
                      <EmptyRow cols={4} label="No vehicles found" />
                    ) : (
                      vehicleRows.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{v.reg}</TableCell>
                          <TableCell>{v.model}</TableCell>
                          <TableCell>{v.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{v.status.replace(/_/g, " ")}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tour / Package performance */}
        <TabsContent value="packages" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Packages" value={totalPackages} icon={Package} />
            <StatCard title="Active" value={activePackages} sub="Published packages" icon={Package} />
            <StatCard title="Total Bookings" value={totalPackageBookings} sub="Across all packages" icon={TrendingUp} />
            <StatCard title="Total Bookings (all)" value={bookingsLoading ? "—" : bookings.length} sub="System bookings" icon={CalendarRange} />
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Packages by Bookings</CardTitle>
              <CardDescription>Best performing tour packages</CardDescription>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : topPackagesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topPackagesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-muted-foreground">No package data yet</div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Package Performance</CardTitle>
                <CardDescription>Ranked by total bookings</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "package-performance.csv",
                    packageRows.map((p) => [p.title, p.destination, p.type, p.price, p.bookings, p.active ? "Active" : "Inactive"]),
                    ["Package", "Destination", "Type", "Price", "Bookings", "Status"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageRows.length === 0 ? (
                      <EmptyRow cols={6} label="No packages found" />
                    ) : (
                      packageRows.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell>{p.destination}</TableCell>
                          <TableCell className="capitalize">{String(p.type).replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-right">{inr(p.price)}</TableCell>
                          <TableCell className="text-right font-semibold">{p.bookings}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={p.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                              {p.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer report */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Customers" value={totalCustomers} icon={Users} />
            <StatCard title="Total Revenue" value={inr(totalSpentAll)} sub="Lifetime spend" icon={IndianRupee} />
            <StatCard title="Loyalty Points" value={totalLoyalty.toLocaleString("en-IN")} sub="Outstanding points" icon={TrendingUp} />
            <StatCard title="Avg Spend" value={totalCustomers > 0 ? inr(Math.round(totalSpentAll / totalCustomers)) : inr(0)} sub="Per customer" icon={IndianRupee} />
          </div>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Report</CardTitle>
                <CardDescription>Ranked by lifetime spend</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "customer-report.csv",
                    customerRows.map((c) => [c.name, c.phone, c.city, c.bookings, c.spent, c.loyalty]),
                    ["Name", "Phone", "City", "Bookings", "Total Spent", "Loyalty Points"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Loyalty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerRows.length === 0 ? (
                      <EmptyRow cols={6} label="No customers found" />
                    ) : (
                      customerRows.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell>{c.city}</TableCell>
                          <TableCell className="text-right">{c.bookings}</TableCell>
                          <TableCell className="text-right font-semibold">{inr(c.spent)}</TableCell>
                          <TableCell className="text-right">{c.loyalty.toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotation report */}
        <TabsContent value="quotations" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Quotations" value={totalQuotations} icon={FileText} />
            <StatCard title="Accepted" value={acceptedQuotations} sub="Won quotations" icon={TrendingUp} />
            <StatCard title="Conversion Rate" value={`${conversionRate}%`} sub="Accepted / total" icon={TrendingUp} />
            <StatCard title="Pipeline Value" value={inr(quotationValue)} sub="All quotations" icon={IndianRupee} />
          </div>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quotation Report</CardTitle>
                <CardDescription>All quotations and their status</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "quotation-report.csv",
                    quotationRows.map((q) => [q.number, q.customer, q.status, q.amount, q.validUntil]),
                    ["Quotation #", "Customer", "Status", "Amount", "Valid Until"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {quotationsLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Valid Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotationRows.length === 0 ? (
                      <EmptyRow cols={5} label="No quotations found" />
                    ) : (
                      quotationRows.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{q.number}</TableCell>
                          <TableCell>{q.customer}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{String(q.status).replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{inr(q.amount)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{q.validUntil}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Occupancy */}
        <TabsContent value="occupancy" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Vehicles" value={totalVehicles} icon={Car} />
            <StatCard title="Blocked Vehicles" value={blockedCount} sub="Off-road / reserved" icon={CalendarRange} />
            <StatCard title="Occupancy Rate" value={`${occupancyRate}%`} sub="Blocked / total" icon={TrendingUp} />
            <StatCard title="Active Blocks" value={availability.length} sub="Availability records" icon={CalendarRange} />
          </div>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Occupancy Report</CardTitle>
                <CardDescription>Vehicle availability blocks</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "occupancy-report.csv",
                    occupancyRows.map((o) => [o.reg, o.model, o.reason, o.from, o.to, o.notes]),
                    ["Registration", "Model", "Reason", "From", "To", "Notes"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {availabilityLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyRows.length === 0 ? (
                      <EmptyRow cols={6} label="No availability blocks found" />
                    ) : (
                      occupancyRows.map((o, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{o.reg}</TableCell>
                          <TableCell>{o.model}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{String(o.reason).replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.from}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.to}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.notes}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor report */}
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Vendors" value={totalVendors} icon={Building2} />
            <StatCard title="Active" value={activeVendors} sub="Active vendors" icon={Building2} />
            <StatCard title="Total Trips" value={vendors.reduce((s: number, v: any) => s + Number(v.totalTrips ?? 0), 0)} sub="Vendor trips" icon={TrendingUp} />
            <StatCard title="Pending Settlement" value={inr(pendingSettlement)} sub="To be settled" icon={IndianRupee} />
          </div>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendor Report</CardTitle>
                <CardDescription>Vendor activity and settlements</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    "vendor-report.csv",
                    vendorRows.map((v) => [v.name, v.contact, v.phone, v.status, v.trips, v.pending]),
                    ["Vendor", "Contact", "Phone", "Status", "Trips", "Pending Settlement"]
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Trips</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorRows.length === 0 ? (
                      <EmptyRow cols={6} label="No vendors found" />
                    ) : (
                      vendorRows.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>{v.contact}</TableCell>
                          <TableCell>{v.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{String(v.status).replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{v.trips}</TableCell>
                          <TableCell className="text-right font-semibold">{inr(v.pending)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
