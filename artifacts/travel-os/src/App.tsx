import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";
import NotFound from "@/pages/not-found";

import { MasterLayout } from "@/components/layout/master-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";

import Login from "@/pages/login";

import MasterDashboard from "@/pages/master/dashboard";
import MasterCompanies from "@/pages/master/companies";
import MasterUsers from "@/pages/master/users";
import MasterPlans from "@/pages/master/plans";
import MasterAnalytics from "@/pages/master/analytics";
import MasterThemes from "@/pages/master/themes";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminBookings from "@/pages/admin/bookings";
import AdminFleet from "@/pages/admin/fleet";
import AdminFastag from "@/pages/admin/fleet/fastag";
import AdminDrivers from "@/pages/admin/drivers";
import AdminUsers from "@/pages/admin/users";
import AdminLeads from "@/pages/admin/crm/leads";
import AdminQuotations from "@/pages/admin/crm/quotations";
import AdminTripRates from "@/pages/admin/trip-rates";
import AdminCustomers from "@/pages/admin/customers";
import AdminDestinations from "@/pages/admin/tours/destinations";
import AdminPackages from "@/pages/admin/tours/packages";
import AdminFinanceSummary from "@/pages/admin/finance/summary";
import AdminFinanceInvoices from "@/pages/admin/finance/invoices";
import AdminFinanceExpenses from "@/pages/admin/finance/expenses";
import AdminVendors from "@/pages/admin/vendors";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import AdminNotifications from "@/pages/admin/notifications";
import AdminCms from "@/pages/admin/cms";
import AdminMarketing from "@/pages/admin/marketing";
import AdminSupport from "@/pages/admin/support";
import AdminFinancePL from "@/pages/admin/finance/pl";
import AdminFinanceGst from "@/pages/admin/finance/gst";
import AdminFinanceRefunds from "@/pages/admin/finance/refunds";
import AdminFinanceCashbook from "@/pages/admin/finance/cashbook";
import AdminFinanceLedger from "@/pages/admin/finance/ledger";
import AdminMarketingReferrals from "@/pages/admin/marketing/referrals";
import AdminMarketingCampaigns from "@/pages/admin/marketing/campaigns";
import AdminMarketingLoyalty from "@/pages/admin/marketing/loyalty";
import AdminCmsMenus from "@/pages/admin/cms/menus";
import AdminCmsSeo from "@/pages/admin/cms/seo";
import AdminCmsHomepage from "@/pages/admin/cms/homepage";
import AdminCmsLayout from "@/pages/admin/cms/layout";
import AdminCmsThemes from "@/pages/admin/cms/themes";
import AdminFleetFuel from "@/pages/admin/fleet/fuel";
import AdminFleetAccidents from "@/pages/admin/fleet/accidents";
import AdminFleetAvailability from "@/pages/admin/fleet/availability";
import AdminFleetTracking from "@/pages/admin/fleet/tracking";
import AdminFleetDevices from "@/pages/admin/fleet/devices";
import AdminDriversLeave from "@/pages/admin/drivers/leave";
import AdminDriversBonusPenalty from "@/pages/admin/drivers/bonus-penalty";
import AdminDriversPerformance from "@/pages/admin/drivers/performance";
import AdminCrmTasks from "@/pages/admin/crm/tasks";
import AdminCustomerProfile from "@/pages/admin/crm/customer-profile";
import AdminReportsOperational from "@/pages/admin/reports/operational";
import AdminSettingsIntegrations from "@/pages/admin/settings/integrations";

import { PortalLayout } from "@/components/layout/portal-layout";
import PortalDashboard from "@/pages/portal/dashboard";
import PortalBookings from "@/pages/portal/bookings";
import PortalSupport from "@/pages/portal/support";

import PublicHome from "@/pages/public/home";
import PublicPackages from "@/pages/public/packages";
import PublicPackageDetail from "@/pages/public/package-detail";
import PublicDestinations from "@/pages/public/destinations";
import PublicDestinationDetail from "@/pages/public/destination-detail";
import PublicEnquiry from "@/pages/public/enquiry";
import PublicContact from "@/pages/public/contact";
import PublicQuote from "@/pages/public/quote";
import PublicTripEstimator from "@/pages/public/trip-estimator";

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
        <Route path="/master/users" component={MasterUsers} />
        <Route path="/master/plans" component={MasterPlans} />
        <Route path="/master/analytics" component={MasterAnalytics} />
        <Route path="/master/themes" component={MasterThemes} />
        <Route component={NotFound} />
      </Switch>
    </MasterLayout>
  );
}

// Wraps an admin-only page: company_staff are redirected to their dashboard so
// they cannot deep-link to pages hidden from their role's menu.
function AdminOnly({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role === "company_staff") return <Redirect to="/admin/dashboard" />;
  return <Component />;
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/fleet/fastag" component={AdminFastag} />
        <Route path="/admin/fleet/fuel" component={AdminFleetFuel} />
        <Route path="/admin/fleet/accidents" component={AdminFleetAccidents} />
        <Route path="/admin/fleet/availability" component={AdminFleetAvailability} />
        <Route path="/admin/fleet/tracking" component={AdminFleetTracking} />
        <Route path="/admin/fleet/devices" component={AdminFleetDevices} />
        <Route path="/admin/fleet" component={AdminFleet} />
        <Route path="/admin/drivers/leave" component={AdminDriversLeave} />
        <Route path="/admin/drivers/bonus-penalty"><AdminOnly component={AdminDriversBonusPenalty} /></Route>
        <Route path="/admin/drivers/performance" component={AdminDriversPerformance} />
        <Route path="/admin/drivers" component={AdminDrivers} />
        <Route path="/admin/users"><AdminOnly component={AdminUsers} /></Route>
        <Route path="/admin/crm/leads" component={AdminLeads} />
        <Route path="/admin/crm/quotations" component={AdminQuotations} />
        <Route path="/admin/crm/tasks" component={AdminCrmTasks} />
        <Route path="/admin/trip-rates" component={AdminTripRates} />
        <Route path="/admin/crm/customer-profile" component={AdminCustomerProfile} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/tours/destinations" component={AdminDestinations} />
        <Route path="/admin/tours/packages" component={AdminPackages} />
        <Route path="/admin/finance/summary"><AdminOnly component={AdminFinanceSummary} /></Route>
        <Route path="/admin/finance/invoices"><AdminOnly component={AdminFinanceInvoices} /></Route>
        <Route path="/admin/finance/expenses"><AdminOnly component={AdminFinanceExpenses} /></Route>
        <Route path="/admin/finance/pl"><AdminOnly component={AdminFinancePL} /></Route>
        <Route path="/admin/finance/gst"><AdminOnly component={AdminFinanceGst} /></Route>
        <Route path="/admin/finance/refunds"><AdminOnly component={AdminFinanceRefunds} /></Route>
        <Route path="/admin/finance/cashbook"><AdminOnly component={AdminFinanceCashbook} /></Route>
        <Route path="/admin/finance/ledger"><AdminOnly component={AdminFinanceLedger} /></Route>
        <Route path="/admin/vendors" component={AdminVendors} />
        <Route path="/admin/reports/operational" component={AdminReportsOperational} />
        <Route path="/admin/reports"><AdminOnly component={AdminReports} /></Route>
        <Route path="/admin/settings/integrations"><AdminOnly component={AdminSettingsIntegrations} /></Route>
        <Route path="/admin/settings"><AdminOnly component={AdminSettings} /></Route>
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/cms/menus"><AdminOnly component={AdminCmsMenus} /></Route>
        <Route path="/admin/cms/seo"><AdminOnly component={AdminCmsSeo} /></Route>
        <Route path="/admin/cms/homepage"><AdminOnly component={AdminCmsHomepage} /></Route>
        <Route path="/admin/cms/layout"><AdminOnly component={AdminCmsLayout} /></Route>
        <Route path="/admin/cms/themes"><AdminOnly component={AdminCmsThemes} /></Route>
        <Route path="/admin/cms"><AdminOnly component={AdminCms} /></Route>
        <Route path="/admin/marketing/referrals"><AdminOnly component={AdminMarketingReferrals} /></Route>
        <Route path="/admin/marketing/campaigns"><AdminOnly component={AdminMarketingCampaigns} /></Route>
        <Route path="/admin/marketing/loyalty"><AdminOnly component={AdminMarketingLoyalty} /></Route>
        <Route path="/admin/marketing"><AdminOnly component={AdminMarketing} /></Route>
        <Route path="/admin/support" component={AdminSupport} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function PortalRoutes() {
  return (
    <PortalLayout>
      <Switch>
        <Route path="/portal/dashboard" component={PortalDashboard} />
        <Route path="/portal/bookings" component={PortalBookings} />
        <Route path="/portal/support" component={PortalSupport} />
        <Route component={NotFound} />
      </Switch>
    </PortalLayout>
  );
}

function PublicRoutes() {
  return (
    <LangProvider>
      <PublicLayout>
        <Switch>
          <Route path="/" component={PublicHome} />
          <Route path="/packages" component={PublicPackages} />
          <Route path="/packages/:id" component={PublicPackageDetail} />
          <Route path="/destinations" component={PublicDestinations} />
          <Route path="/destinations/:id" component={PublicDestinationDetail} />
          <Route path="/trip-estimator" component={PublicTripEstimator} />
          <Route path="/enquiry" component={PublicEnquiry} />
          <Route path="/contact" component={PublicContact} />
          <Route component={NotFound} />
        </Switch>
      </PublicLayout>
    </LangProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/quote/:token" component={PublicQuote} />

      <Route path="/master/*">
        <ProtectedRoute component={MasterRoutes} allowedRoles={["master_admin"]} />
      </Route>

      <Route path="/admin/*">
        <ProtectedRoute component={AdminRoutes} allowedRoles={["company_admin", "company_staff"]} />
      </Route>

      <Route path="/portal/*">
        <ProtectedRoute component={PortalRoutes} allowedRoles={["customer"]} />
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
