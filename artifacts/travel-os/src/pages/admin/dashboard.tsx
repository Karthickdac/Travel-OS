import { useGetCompanyDashboard, useGetRevenueTrend, useGetRecentBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, CreditCard, CarFront, FileText, ArrowUpRight, TrendingUp, CircleDollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetCompanyDashboard();
  const { data: trend, isLoading: trendLoading } = useGetRevenueTrend({ months: 6 });
  const { data: recentBookings, isLoading: bookingsLoading } = useGetRecentBookings();

  const isLoading = statsLoading || trendLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Today's snapshot.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active trips: <span className="font-medium text-foreground">{stats.activeTrips}</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly: <span className="font-medium text-foreground">₹{stats.monthlyRevenue.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CarFront className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.availableDrivers} <span className="text-lg text-muted-foreground font-normal">avail</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of <span className="font-medium text-foreground">{stats.totalVehicles}</span> total vehicles
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover-elevate border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Action Needed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending leads to follow up
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "var(--color-muted-foreground)"}} />
                  <YAxis tickFormatter={(val) => `₹${(val/1000).toFixed(0)}K`} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "var(--color-muted-foreground)"}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value: number) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest confirmed trips</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-md">
                      <CarFront className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.pickupLocation} to {booking.dropLocation}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">₹{Number(booking.amount).toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(booking.pickupDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No recent bookings</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
