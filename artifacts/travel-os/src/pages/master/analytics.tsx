import { useGetMasterDashboard, useListCompanies, useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, Users, CreditCard, TrendingUp, Activity, Globe, CheckCircle2, AlertCircle } from "lucide-react";

const COLORS = ["#f97316", "#0d9488", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function MasterAnalytics() {
  const { data: stats, isLoading } = useGetMasterDashboard();
  const { data: companies } = useListCompanies();
  const { data: plans } = useListPlans();

  const activeCompanies = companies?.data?.filter(c => c.status === "active").length ?? 0;
  const suspendedCompanies = companies?.data?.filter(c => c.status === "suspended").length ?? 0;
  const totalCompanies = companies?.data?.length ?? 0;

  const planDist = (plans ?? []).map((p, i) => ({
    name: p.name,
    companies: companies?.data?.filter(c => c.plan === p.name).length ?? 0,
    color: COLORS[i % COLORS.length],
  }));

  const mockMonthlyRevenue = [
    { month: "Jan", revenue: 124000, companies: 12 },
    { month: "Feb", revenue: 148000, companies: 14 },
    { month: "Mar", revenue: 162000, companies: 15 },
    { month: "Apr", revenue: 175000, companies: 17 },
    { month: "May", revenue: 198000, companies: 19 },
    { month: "Jun", revenue: 221000, companies: 21 },
  ];

  const systemHealth = [
    { name: "API", status: "healthy", latency: "48ms" },
    { name: "Database", status: "healthy", latency: "12ms" },
    { name: "Storage", status: "healthy", usage: "34%" },
    { name: "Cache", status: "healthy", hit: "94%" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time insights across all tenant companies.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Total Companies", value: stats?.totalCompanies ?? totalCompanies, sub: `${activeCompanies} active`, icon: Building2, color: "text-primary" },
            { title: "Active Subscriptions", value: activeCompanies, sub: `${suspendedCompanies} suspended`, icon: CreditCard, color: "text-emerald-600" },
            { title: "Total Bookings", value: (stats?.totalBookings ?? 0).toLocaleString(), sub: "Across all companies", icon: Activity, color: "text-blue-600" },
            { title: "Total Users", value: (stats?.totalUsers ?? 0).toLocaleString(), sub: "All roles", icon: Users, color: "text-purple-600" },
          ].map(s => (
            <Card key={s.title} className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Platform Revenue Trend</CardTitle>
            <CardDescription>Monthly subscription revenue (INR)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mockMonthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Company Growth</CardTitle>
            <CardDescription>New companies onboarded per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mockMonthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="companies" fill="#0d9488" radius={[6, 6, 0, 0]} name="Companies" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Companies per subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            {planDist.some(p => p.companies > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planDist} dataKey="companies" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Assign plans to companies to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Infrastructure status snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemHealth.map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${s.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="font-medium text-sm">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.latency && <Badge variant="outline" className="text-xs font-mono">{s.latency}</Badge>}
                  {s.usage && <Badge variant="outline" className="text-xs">{s.usage} used</Badge>}
                  {s.hit && <Badge variant="outline" className="text-xs">{s.hit} hit rate</Badge>}
                  {s.status === "healthy" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground text-center">Last checked: just now • All systems operational</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent companies */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tenant Companies</CardTitle>
          <CardDescription>All registered travel companies on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {!companies?.data?.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">No companies registered yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {companies.data.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600"}>{c.status ?? "active"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
