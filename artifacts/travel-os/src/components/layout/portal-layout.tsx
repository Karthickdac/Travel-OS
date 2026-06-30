import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CalendarCheck, Headphones, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/portal/support", label: "Support", icon: Headphones },
];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/portal/dashboard">
              <div className="flex items-center gap-3 cursor-pointer shrink-0">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow">
                  <span className="text-white font-black text-xs leading-none">SMT</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-black tracking-tight text-foreground">Madurai SMT Travels</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Customer Portal</span>
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const isActive = location === href || location.startsWith(`${href}/`);
                return (
                  <Link key={href} href={href}>
                    <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 pr-1">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {user?.name?.charAt(0) || "C"}
                </div>
                <div className="hidden lg:flex flex-col leading-none">
                  <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{user?.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="hidden md:inline-flex gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-background border-t border-border shadow-xl">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const isActive = location === href || location.startsWith(`${href}/`);
                return (
                  <Link key={href} href={href}>
                    <span className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`}>
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors mt-1 border-t border-border"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>

      <footer className="border-t border-border bg-background py-6">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Madurai SMT Travels</span>
          <span className="italic">Safe • Comfortable • Reliable</span>
        </div>
      </footer>
    </div>
  );
}
