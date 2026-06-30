import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, CarFront, Users, Users2, Map, FileText, Settings, Wallet, Contact, Calendar, BookOpen, Building2, BarChart3, Bell, Receipt, CreditCard, Globe, Nfc } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function PackageIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navGroups = [
    {
      title: "Core",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/bookings", label: "Bookings", icon: Calendar },
      ]
    },
    {
      title: "Fleet & Staff",
      items: [
        { href: "/admin/fleet", label: "Fleet & Vehicles", icon: CarFront },
        { href: "/admin/fleet/fastag", label: "FASTag", icon: Nfc },
        { href: "/admin/drivers", label: "Drivers", icon: Contact },
        { href: "/admin/users", label: "Staff", icon: Users2 },
        { href: "/admin/vendors", label: "Vendors", icon: Building2 },
      ]
    },
    {
      title: "CRM & Sales",
      items: [
        { href: "/admin/crm/leads", label: "Leads Pipeline", icon: Users },
        { href: "/admin/crm/quotations", label: "Quotations", icon: FileText },
        { href: "/admin/customers", label: "Customers", icon: BookOpen },
      ]
    },
    {
      title: "Tours",
      items: [
        { href: "/admin/tours/destinations", label: "Destinations", icon: Map },
        { href: "/admin/tours/packages", label: "Packages", icon: PackageIcon },
      ]
    },
    {
      title: "Finance",
      items: [
        { href: "/admin/finance/summary", label: "Summary", icon: Wallet },
        { href: "/admin/finance/invoices", label: "Invoices", icon: Receipt },
        { href: "/admin/finance/expenses", label: "Expenses", icon: CreditCard },
      ]
    },
    {
      title: "Website",
      items: [
        { href: "/admin/cms", label: "Website CMS", icon: Globe },
      ]
    },
    {
      title: "Analytics & Admin",
      items: [
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        { href: "/admin/notifications", label: "Notifications", icon: Bell },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ]
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/20">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="text-xl font-bold text-sidebar-primary">TravelOS</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">ERP</span>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="px-4 py-6 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h4 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location === item.href || location.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-foreground shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-sidebar-foreground leading-none truncate">{user?.name}</span>
              <span className="text-xs text-sidebar-foreground/70 mt-1 truncate">{user?.email}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
