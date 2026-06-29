import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";

import { MasterLayout } from "@/components/layout/master-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";

import Login from "@/pages/login";

import MasterDashboard from "@/pages/master/dashboard";
import MasterCompanies from "@/pages/master/companies";
import MasterPlans from "@/pages/master/plans";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminBookings from "@/pages/admin/bookings";
import AdminFleet from "@/pages/admin/fleet";
import AdminDrivers from "@/pages/admin/drivers";
import AdminUsers from "@/pages/admin/users";
import AdminLeads from "@/pages/admin/crm/leads";
import AdminQuotations from "@/pages/admin/crm/quotations";
import AdminCustomers from "@/pages/admin/customers";
import AdminDestinations from "@/pages/admin/tours/destinations";
import AdminPackages from "@/pages/admin/tours/packages";
import AdminFinanceSummary from "@/pages/admin/finance/summary";

import PublicHome from "@/pages/public/home";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "master_admin") return <Redirect to="/master/dashboard" />;
    if (user.role === "company_admin" || user.role === "company_staff") return <Redirect to="/admin/dashboard" />;
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function MasterRoutes() {
  return (
    <MasterLayout>
      <Switch>
        <Route path="/master/dashboard" component={MasterDashboard} />
        <Route path="/master/companies" component={MasterCompanies} />
        <Route path="/master/plans" component={MasterPlans} />
        <Route component={NotFound} />
      </Switch>
    </MasterLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/fleet" component={AdminFleet} />
        <Route path="/admin/drivers" component={AdminDrivers} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/crm/leads" component={AdminLeads} />
        <Route path="/admin/crm/quotations" component={AdminQuotations} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/tours/destinations" component={AdminDestinations} />
        <Route path="/admin/tours/packages" component={AdminPackages} />
        <Route path="/admin/finance/summary" component={AdminFinanceSummary} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={PublicHome} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/master/*">
        <ProtectedRoute component={MasterRoutes} allowedRoles={["master_admin"]} />
      </Route>

      <Route path="/admin/*">
        <ProtectedRoute component={AdminRoutes} allowedRoles={["company_admin", "company_staff"]} />
      </Route>

      <Route path="/*">
        <PublicRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
