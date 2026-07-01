import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, LayoutDashboard, CarFront, Users, Users2, Map, FileText, Settings, Wallet, Contact, Calendar, BookOpen, Building2, BarChart3, Bell, Receipt, CreditCard, Globe, Nfc, Tag, Headphones, Fuel, AlertTriangle, CalendarClock, Award, Gauge, ListTodo, Megaphone, Palette, Plug, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronDown, LayoutTemplate, Navigation, Radio } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function PackageIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}

type NavItem = { href: string; label: string; icon: any; adminOnly?: boolean };
type NavGroup = { title: string; adminOnly?: boolean; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    ],
  },
  {
    title: "Fleet & Staff",
    items: [
      { href: "/admin/fleet", label: "Fleet & Vehicles", icon: CarFront },
      { href: "/admin/fleet/fastag", label: "FASTag", icon: Nfc },
      { href: "/admin/fleet/fuel", label: "Fuel Logs", icon: Fuel },
      { href: "/admin/fleet/accidents", label: "Accidents", icon: AlertTriangle },
      { href: "/admin/fleet/availability", label: "Availability", icon: CalendarClock },
      { href: "/admin/fleet/tracking", label: "Live Tracking", icon: Navigation },
      { href: "/admin/fleet/devices", label: "GPS Devices", icon: Radio },
      { href: "/admin/drivers", label: "Drivers", icon: Contact },
      { href: "/admin/drivers/leave", label: "Driver Leave", icon: CalendarClock },
      { href: "/admin/drivers/bonus-penalty", label: "Bonus & Penalty", icon: Award, adminOnly: true },
      { href: "/admin/drivers/performance", label: "Driver Performance", icon: Gauge },
      { href: "/admin/users", label: "Staff", icon: Users2, adminOnly: true },
      { href: "/admin/vendors", label: "Vendors", icon: Building2 },
    ],
  },
  {
    title: "CRM & Sales",
    items: [
      { href: "/admin/crm/leads", label: "Leads Pipeline", icon: Users },
      { href: "/admin/crm/quotations", label: "Quotations", icon: FileText },
      { href: "/admin/crm/tasks", label: "Follow-up Tasks", icon: ListTodo },
      { href: "/admin/customers", label: "Customers", icon: BookOpen },
      { href: "/admin/crm/customer-profile", label: "Customer 360", icon: Contact },
    ],
  },
  {
    title: "Tours",
    items: [
      { href: "/admin/tours/destinations", label: "Destinations", icon: Map },
      { href: "/admin/tours/packages", label: "Packages", icon: PackageIcon },
    ],
  },
  {
    title: "Finance",
    adminOnly: true,
    items: [
      { href: "/admin/finance/summary", label: "Summary", icon: Wallet },
      { href: "/admin/finance/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/finance/expenses", label: "Expenses", icon: CreditCard },
      { href: "/admin/finance/pl", label: "P&L Report", icon: BarChart3 },
      { href: "/admin/finance/gst", label: "GST Report", icon: FileText },
      { href: "/admin/finance/refunds", label: "Refunds", icon: Wallet },
      { href: "/admin/finance/cashbook", label: "Cash Book", icon: BookOpen },
      { href: "/admin/finance/ledger", label: "Ledger", icon: Receipt },
    ],
  },
  {
    title: "Marketing",
    adminOnly: true,
    items: [
      { href: "/admin/marketing", label: "Coupons", icon: Tag },
      { href: "/admin/marketing/referrals", label: "Referrals", icon: Users },
      { href: "/admin/marketing/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/admin/marketing/loyalty", label: "Loyalty", icon: Award },
    ],
  },
  {
    title: "Website",
    adminOnly: true,
    items: [
      { href: "/admin/cms", label: "Website CMS", icon: Globe },
      { href: "/admin/cms/homepage", label: "Homepage Builder", icon: LayoutDashboard },
      { href: "/admin/cms/layout", label: "Website Layout", icon: LayoutTemplate },
      { href: "/admin/cms/menus", label: "Menus", icon: ListTodo },
      { href: "/admin/cms/seo", label: "SEO", icon: Globe },
      { href: "/admin/cms/themes", label: "Theme Engine", icon: Palette },
    ],
  },
  {
    title: "Analytics & Admin",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true },
      { href: "/admin/reports/operational", label: "Operational Reports", icon: Gauge },
      { href: "/admin/support", label: "Support Tickets", icon: Headphones },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/admin/settings/integrations", label: "Integrations", icon: Plug, adminOnly: true },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("admin-sidebar-collapsed") === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("admin-sidebar-groups") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-groups", JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: prev[title] === false ? true : false }));

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // company_admin and master_admin see everything; company_staff sees only
  // operational (non-admin-only) menus.
  const isAdmin = user?.role === "company_admin" || user?.role === "master_admin";
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isAdmin || (!item.adminOnly && !group.adminOnly)),
  })).filter((group) => group.items.length > 0);

  const roleLabel =
    user?.role === "company_admin"
      ? "Admin"
      : user?.role === "company_staff"
        ? "Staff"
        : user?.role === "master_admin"
          ? "Master"
          : "ERP";

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/20">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-sidebar border-b border-sidebar-border">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-sidebar-primary">TravelOS</span>
        <div className="w-9" />
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col z-40",
          "fixed inset-y-0 left-0 w-64 transition-all duration-200 ease-in-out",
          "md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-16" : "md:w-64",
        )}
      >
        <div
          className={cn(
            "h-16 flex items-center border-b border-sidebar-border",
            collapsed ? "md:justify-center md:px-0 px-6" : "px-6",
          )}
        >
          {!collapsed && (
            <>
              <span className="text-xl font-bold text-sidebar-primary">TravelOS</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                {roleLabel}
              </span>
            </>
          )}
          {/* Desktop collapse toggle */}
          <button
            type="button"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "hidden md:inline-flex items-center justify-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed ? "" : "ml-auto",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          {/* Mobile close */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn("py-6 space-y-3", collapsed ? "md:px-2 px-4" : "px-4")}>
            {navGroups.map((group) => {
              // In icon-rail mode every group is shown (icons only); otherwise the
              // header toggles the group open/closed (default open).
              const isOpen = collapsed || openGroups[group.title] !== false;
              return (
                <div key={group.title}>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between px-3 mb-1 py-1 rounded-md text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <span>{group.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 shrink-0",
                          isOpen ? "" : "-rotate-90",
                        )}
                      />
                    </button>
                  )}
                  {isOpen && (
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = location === item.href || location.startsWith(`${item.href}/`);
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href}>
                            <div
                              title={collapsed ? item.label : undefined}
                              className={cn(
                                "flex items-center gap-3 rounded-md transition-colors cursor-pointer text-sm font-medium px-3 py-2",
                                collapsed ? "md:justify-center md:px-0" : "",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className={cn(collapsed ? "md:hidden" : "")}>{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        <div className={cn("border-t border-sidebar-border", collapsed ? "md:p-2 p-4" : "p-4")}>
          <div
            className={cn(
              "flex items-center gap-3 mb-4",
              collapsed ? "md:justify-center md:px-0 px-2" : "px-2",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-foreground shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className={cn("flex flex-col overflow-hidden", collapsed ? "md:hidden" : "")}>
              <span className="text-sm font-medium text-sidebar-foreground leading-none truncate">{user?.name}</span>
              <span className="text-xs text-sidebar-foreground/70 mt-1 truncate">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="outline"
            title={collapsed ? "Log out" : undefined}
            className={cn(
              "w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "md:justify-center md:px-0 justify-start" : "justify-start",
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-4 w-4", collapsed ? "md:mr-0 mr-2" : "mr-2")} />
            <span className={cn(collapsed ? "md:hidden" : "")}>Log out</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
