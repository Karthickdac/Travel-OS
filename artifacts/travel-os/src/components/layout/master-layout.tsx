import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Package, LogOut, BarChart3, Palette } from "lucide-react";

export function MasterLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { href: "/master/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/master/companies", label: "Companies", icon: Building2 },
    { href: "/master/plans", label: "Plans", icon: Package },
    { href: "/master/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/master/themes", label: "Themes & Plugins", icon: Palette },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/20">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="text-xl font-bold text-sidebar-primary">TravelOS</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">Master</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-foreground">
              {user?.name?.charAt(0) || 'M'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground leading-none">{user?.name}</span>
              <span className="text-xs text-sidebar-foreground/70 mt-1">{user?.email}</span>
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
