import { useGetMasterDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, Activity, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MasterDashboard() {
  const { data: stats, isLoading } = useGetMasterDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">Welcome to the master control panel.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time metrics across all tenant companies.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-emerald-500 flex items-center font-medium mr-1">
                {stats.activeCompanies} Active
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-emerald-500 flex items-center font-medium mr-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Platform lifetime
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">Active Tenants</span>
                </div>
                <span className="font-bold">{stats.activeCompanies}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-sm font-medium">Expired Plans</span>
                </div>
                <span className="font-bold flex items-center gap-2">
                  {stats.expiredPlans > 0 && <ShieldAlert className="h-4 w-4 text-destructive" />}
                  {stats.expiredPlans}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">Active Drivers</span>
                </div>
                <span className="font-bold">{stats.activeDrivers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-primary text-primary-foreground border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/10 blur-xl"></div>
          <CardHeader>
            <CardTitle className="text-primary-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="bg-primary-foreground/10 hover:bg-primary-foreground/20 cursor-pointer transition-colors p-3 rounded-md flex items-center justify-between">
              <span className="font-medium text-sm">Onboard New Company</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div className="bg-primary-foreground/10 hover:bg-primary-foreground/20 cursor-pointer transition-colors p-3 rounded-md flex items-center justify-between">
              <span className="font-medium text-sm">Manage Subscription Plans</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div className="bg-primary-foreground/10 hover:bg-primary-foreground/20 cursor-pointer transition-colors p-3 rounded-md flex items-center justify-between">
              <span className="font-medium text-sm">System Logs</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
