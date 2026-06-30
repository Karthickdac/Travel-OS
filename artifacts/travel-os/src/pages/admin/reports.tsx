import { useGetRevenueTrend, useListBookings, useListDrivers, useListVehicles, useListExpenses, useListInvoices, useListLeads } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Car, Users, Calendar, IndianRupee, FileText, Target } from "lucide-react";

const COLORS = ["#f97316", "#0d9488", "#3b82f6", "#8b5cf6", "#ec4899", "#eab308"];

function StatCard({ title, value, sub, icon: Icon, trend }: { title: string; value: string | number; sub?: string; icon: any; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const { data: trend, isLoading: trendLoading } = useGetRevenueTrend();
  const { data: bookings } = useListBookings();
  const { data: drivers } = useListDrivers();
  const { data: vehicles } = useListVehicles();
  const { data: expenses } = useListExpenses();
  const { data: invoices } = useListInvoices();
  const { data: leads } = useListLeads();

  const totalRevenue = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount ?? 0), 0) ?? 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount ?? 0), 0) ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  const bookingByStatus = [
    { name: "Enquiry", value: bookings?.data?.filter(b => b.status === "enquiry").length ?? 0 },
    { name: "Confirmed", value: bookings?.data?.filter(b => b.status === "confirmed").length ?? 0 },
    { name: "In Progress", value: bookings?.data?.filter(b => b.status === "in_progress").length ?? 0 },
    { name: "Completed", value: bookings?.data?.filter(b => b.status === "completed").length ?? 0 },
    { name: "Cancelled", value: bookings?.data?.filter(b => b.status === "cancelled").length ?? 0 },
  ].filter(b => b.value > 0);

  const bookingByType = (bookings?.data ?? []).reduce((acc: Record<string, number>, b) => {
    const type = b.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Unknown";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(bookingByType).map(([name, value]) => ({ name, value }));

  const leadFunnel = [
    { stage: "New", count: leads?.filter(l => l.status === "new").length ?? 0 },
    { stage: "Contacted", count: leads?.filter(l => l.status === "contacted").length ?? 0 },
    { stage: "Qualified", count: leads?.filter(l => l.status === "qualified").length ?? 0 },
    { stage: "Won", count: leads?.filter(l => l.status === "won").length ?? 0 },
    { stage: "Lost", count: leads?.filter(l => l.status === "lost").length ?? 0 },
  ];

  const driverAvailability = [
    { name: "Available", value: drivers?.filter(d => d.status === "available").length ?? 0 },
    { name: "On Trip", value: drivers?.filter(d => d.status === "on_trip").length ?? 0 },
    { name: "Off Duty", value: drivers?.filter(d => d.status === "off_duty").length ?? 0 },
    { name: "Inactive", value: drivers?.filter(d => d.status === "inactive").length ?? 0 },
  ].filter(d => d.value > 0);

  const vehicleStatus = [
    { name: "Available", value: vehicles?.filter(v => v.status === "available").length ?? 0 },
    { name: "On Trip", value: vehicles?.filter(v => v.status === "on_trip").length ?? 0 },
    { name: "Maintenance", value: vehicles?.filter(v => v.status === "maintenance").length ?? 0 },
    { name: "Off Road", value: vehicles?.filter(v => v.status === "off_road").length ?? 0 },
  ].filter(v => v.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance overview and insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub="From paid invoices" icon={IndianRupee} trend="up" />
        <StatCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} sub="All categories" icon={TrendingDown} trend="down" />
        <StatCard title="Net Profit" value={`₹${netProfit.toLocaleString()}`} sub={`${profitMargin}% margin`} icon={TrendingUp} trend={netProfit >= 0 ? "up" : "down"} />
        <StatCard title="Total Bookings" value={bookings?.data?.length ?? 0} sub={`${bookings?.data?.filter(b => b.status === "completed").length ?? 0} completed`} icon={Calendar} />
        <StatCard title="Active Drivers" value={drivers?.filter(d => d.status === "available").length ?? 0} sub={`of ${drivers?.length ?? 0} total`} icon={Users} />
        <StatCard title="Fleet Size" value={vehicles?.length ?? 0} sub={`${vehicles?.filter(v => v.status === "available").length ?? 0} available`} icon={Car} />
        <StatCard title="Total Leads" value={leads?.length ?? 0} sub={`${leads?.filter(l => l.status === "won").length ?? 0} won`} icon={Target} />
        <StatCard title="Invoices" value={invoices?.length ?? 0} sub={`${invoices?.filter(i => i.status === "paid").length ?? 0} paid`} icon={FileText} />
      </div>

      {/* Revenue Trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          {trendLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: "#f97316" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking by Status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Bookings by Status</CardTitle>
            <CardDescription>Distribution across lifecycle stages</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={bookingByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {bookingByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-60 flex items-center justify-center text-muted-foreground">No booking data yet</div>}
          </CardContent>
        </Card>

        {/* Lead Funnel */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
            <CardDescription>Conversion pipeline from enquiry to win</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leadFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking by Type */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Bookings by Type</CardTitle>
            <CardDescription>Service type breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-60 flex items-center justify-center text-muted-foreground">No booking data yet</div>}
          </CardContent>
        </Card>

        {/* Driver & Vehicle Status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Fleet & Driver Status</CardTitle>
            <CardDescription>Current availability snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Drivers</p>
              <div className="flex flex-wrap gap-2">
                {driverAvailability.map((d, i) => (
                  <Badge key={d.name} variant="outline" style={{ borderColor: COLORS[i], color: COLORS[i] }}>
                    {d.name}: {d.value}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vehicles</p>
              <div className="flex flex-wrap gap-2">
                {vehicleStatus.map((v, i) => (
                  <Badge key={v.name} variant="outline" style={{ borderColor: COLORS[i], color: COLORS[i] }}>
                    {v.name}: {v.value}
                  </Badge>
                ))}
              </div>
            </div>
            {driverAvailability.length === 0 && vehicleStatus.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No fleet data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
