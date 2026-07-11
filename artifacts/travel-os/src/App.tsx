import { lazy, Suspense, Component } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";
import NotFound from "@/pages/not-found";

// Layouts stay eagerly imported so the shell (header/nav/footer) is available
// immediately; each portal's pages are code-split below so a visitor only
// downloads the JavaScript for the section they actually open.
import { MasterLayout } from "@/components/layout/master-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { PortalLayout } from "@/components/layout/portal-layout";

// Route-level code splitting: each page becomes its own chunk loaded on demand.
// This keeps the public website's initial bundle tiny — visitors no longer
// download the entire admin/master ERP just to view the homepage.
const Login = lazy(() => import("@/pages/login"));

const MasterDashboard = lazy(() => import("@/pages/master/dashboard"));
const MasterCompanies = lazy(() => import("@/pages/master/companies"));
const MasterUsers = lazy(() => import("@/pages/master/users"));
const MasterPlans = lazy(() => import("@/pages/master/plans"));
const MasterAnalytics = lazy(() => import("@/pages/master/analytics"));
const MasterThemes = lazy(() => import("@/pages/master/themes"));

const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminBookings = lazy(() => import("@/pages/admin/bookings"));
const AdminFleet = lazy(() => import("@/pages/admin/fleet"));
const AdminFastag = lazy(() => import("@/pages/admin/fleet/fastag"));
const AdminDrivers = lazy(() => import("@/pages/admin/drivers"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminLeads = lazy(() => import("@/pages/admin/crm/leads"));
const AdminQuotations = lazy(() => import("@/pages/admin/crm/quotations"));
const AdminTripRates = lazy(() => import("@/pages/admin/trip-rates"));
const AdminCustomers = lazy(() => import("@/pages/admin/customers"));
const AdminDestinations = lazy(() => import("@/pages/admin/tours/destinations"));
const AdminPackages = lazy(() => import("@/pages/admin/tours/packages"));
const AdminFinanceSummary = lazy(() => import("@/pages/admin/finance/summary"));
const AdminFinanceInvoices = lazy(() => import("@/pages/admin/finance/invoices"));
const AdminFinanceExpenses = lazy(() => import("@/pages/admin/finance/expenses"));
const AdminVendors = lazy(() => import("@/pages/admin/vendors"));
const AdminReports = lazy(() => import("@/pages/admin/reports"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminNotifications = lazy(() => import("@/pages/admin/notifications"));
const AdminCms = lazy(() => import("@/pages/admin/cms"));
const AdminMarketing = lazy(() => import("@/pages/admin/marketing"));
const AdminSupport = lazy(() => import("@/pages/admin/support"));
const AdminFinancePL = lazy(() => import("@/pages/admin/finance/pl"));
const AdminFinanceGst = lazy(() => import("@/pages/admin/finance/gst"));
const AdminFinanceRefunds = lazy(() => import("@/pages/admin/finance/refunds"));
const AdminFinanceCashbook = lazy(() => import("@/pages/admin/finance/cashbook"));
const AdminFinanceLedger = lazy(() => import("@/pages/admin/finance/ledger"));
const AdminMarketingReferrals = lazy(() => import("@/pages/admin/marketing/referrals"));
const AdminMarketingCampaigns = lazy(() => import("@/pages/admin/marketing/campaigns"));
const AdminMarketingLoyalty = lazy(() => import("@/pages/admin/marketing/loyalty"));
const AdminCmsMenus = lazy(() => import("@/pages/admin/cms/menus"));
const AdminCmsSeo = lazy(() => import("@/pages/admin/cms/seo"));
const AdminCmsHomepage = lazy(() => import("@/pages/admin/cms/homepage"));
const AdminCmsTestimonials = lazy(() => import("@/pages/admin/cms/testimonials"));
const AdminCmsLayout = lazy(() => import("@/pages/admin/cms/layout"));
const AdminCmsThemes = lazy(() => import("@/pages/admin/cms/themes"));
const AdminFleetFuel = lazy(() => import("@/pages/admin/fleet/fuel"));
const AdminFleetAccidents = lazy(() => import("@/pages/admin/fleet/accidents"));
const AdminFleetAvailability = lazy(() => import("@/pages/admin/fleet/availability"));
const AdminFleetTracking = lazy(() => import("@/pages/admin/fleet/tracking"));
const AdminFleetDevices = lazy(() => import("@/pages/admin/fleet/devices"));
const AdminDriversLeave = lazy(() => import("@/pages/admin/drivers/leave"));
const AdminDriversBonusPenalty = lazy(() => import("@/pages/admin/drivers/bonus-penalty"));
const AdminDriversPerformance = lazy(() => import("@/pages/admin/drivers/performance"));
const AdminCrmTasks = lazy(() => import("@/pages/admin/crm/tasks"));
const AdminCustomerProfile = lazy(() => import("@/pages/admin/crm/customer-profile"));
const AdminReportsOperational = lazy(() => import("@/pages/admin/reports/operational"));
const AdminSettingsIntegrations = lazy(() => import("@/pages/admin/settings/integrations"));

const PortalDashboard = lazy(() => import("@/pages/portal/dashboard"));
const PortalBookings = lazy(() => import("@/pages/portal/bookings"));
const PortalSupport = lazy(() => import("@/pages/portal/support"));

const PublicHome = lazy(() => import("@/pages/public/home"));
const PublicPackages = lazy(() => import("@/pages/public/packages"));
const PublicPackageDetail = lazy(() => import("@/pages/public/package-detail"));
const PublicDestinations = lazy(() => import("@/pages/public/destinations"));
const PublicDestinationDetail = lazy(() => import("@/pages/public/destination-detail"));
const PublicEnquiry = lazy(() => import("@/pages/public/enquiry"));
const PublicContact = lazy(() => import("@/pages/public/contact"));
const PublicQuote = lazy(() => import("@/pages/public/quote"));
const PublicTripEstimator = lazy(() => import("@/pages/public/trip-estimator"));
const PublicReviews = lazy(() => import("@/pages/public/reviews"));
const PublicBlog = lazy(() => import("@/pages/public/blog"));
const PublicBlogDetail = lazy(() => import("@/pages/public/blog-detail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Treat fetched data as fresh for 60s so quickly navigating between pages
      // doesn't refire the same requests — pages feel instant on return. Kept
      // short so admin/ERP data (bookings, fleet) stays current.
      staleTime: 60 * 1000,
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// Catches failures from lazy() dynamic imports. When a new version is deployed,
// the chunk hashes an already-open tab references no longer exist; loading one
// throws. We reload once to pull the fresh assets instead of getting stuck.
class ChunkErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const isChunkError = /Loading chunk|dynamically imported module|Failed to fetch/i.test(String(error));
    if (isChunkError && !sessionStorage.getItem("chunk-reloaded")) {
      sessionStorage.setItem("chunk-reloaded", "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) return <PageFallback />;
    return this.props.children;
  }
}

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
      <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/master/dashboard" component={MasterDashboard} />
        <Route path="/master/companies" component={MasterCompanies} />
        <Route path="/master/users" component={MasterUsers} />
        <Route path="/master/plans" component={MasterPlans} />
        <Route path="/master/analytics" component={MasterAnalytics} />
        <Route path="/master/themes" component={MasterThemes} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
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
      <Suspense fallback={<PageFallback />}>
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
        <Route path="/admin/cms/testimonials"><AdminOnly component={AdminCmsTestimonials} /></Route>
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
      </Suspense>
    </AdminLayout>
  );
}

function PortalRoutes() {
  return (
    <PortalLayout>
      <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/portal/dashboard" component={PortalDashboard} />
        <Route path="/portal/bookings" component={PortalBookings} />
        <Route path="/portal/support" component={PortalSupport} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </PortalLayout>
  );
}

function PublicRoutes() {
  return (
    <LangProvider>
      <PublicLayout>
        <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={PublicHome} />
          <Route path="/packages" component={PublicPackages} />
          <Route path="/packages/:id" component={PublicPackageDetail} />
          <Route path="/destinations" component={PublicDestinations} />
          <Route path="/destinations/:id" component={PublicDestinationDetail} />
          <Route path="/blog" component={PublicBlog} />
          <Route path="/blog/:slug" component={PublicBlogDetail} />
          <Route path="/trip-estimator" component={PublicTripEstimator} />
          <Route path="/reviews" component={PublicReviews} />
          <Route path="/enquiry" component={PublicEnquiry} />
          <Route path="/contact" component={PublicContact} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </PublicLayout>
    </LangProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Suspense fallback={<PageFallback />}><Login /></Suspense>
      </Route>
      <Route path="/quote/:token">
        <Suspense fallback={<PageFallback />}><PublicQuote /></Suspense>
      </Route>

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
            <ChunkErrorBoundary>
              <Router />
            </ChunkErrorBoundary>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
