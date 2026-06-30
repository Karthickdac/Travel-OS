import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const isHome = location === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const transparent = isHome && !scrolled && !mobileOpen;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          transparent
            ? "bg-black/50 backdrop-blur-sm border-b border-white/10"
            : "bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 md:h-18 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer shrink-0 group">
                <div className="relative h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow">
                  <span className={`text-white font-black text-xs leading-none tracking-tight`}>SMT</span>
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className={`text-sm font-black tracking-tight transition-colors ${transparent ? "text-white" : "text-foreground"}`}>
                    Madurai SMT Travels
                  </span>
                  <span className={`text-[10px] font-medium transition-colors ${transparent ? "text-white/70" : "text-muted-foreground"}`}>
                    {lang === "en" ? "Safe • Comfortable • Reliable" : "பாதுகாப்பான • வசதியான • நம்பகமான"}
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: "/", label: t.nav.home },
                { href: "/packages", label: t.nav.packages },
                { href: "/enquiry", label: t.nav.contact },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer hover:bg-white/10 ${
                    transparent
                      ? "text-white/90 hover:text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                    {label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "ta" : "en")}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all hover:scale-105 ${
                  transparent
                    ? "border-white/30 text-white bg-white/10 hover:bg-white/20"
                    : "border-border text-foreground bg-muted hover:bg-muted/80"
                }`}
              >
                <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
                <span className={`w-px h-3 ${transparent ? "bg-white/30" : "bg-border"}`} />
                <span className={lang === "ta" ? "opacity-100" : "opacity-40"}>தமிழ்</span>
              </button>

              {/* Phone */}
              <a href="tel:8110806339" className={`hidden lg:flex items-center gap-1.5 text-sm font-bold transition-colors ${
                transparent ? "text-white/90 hover:text-white" : "text-primary hover:text-primary/80"
              }`}>
                <Phone className="h-3.5 w-3.5" /> 8110806339
              </a>

              {/* Admin */}
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden md:inline-flex text-xs font-semibold ${
                    transparent ? "text-white/80 hover:text-white hover:bg-white/10" : ""
                  }`}
                >
                  {t.nav.admin}
                </Button>
              </Link>

              {/* Book Now */}
              <a href="tel:8110806339">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white border-0 rounded-full text-xs font-bold px-4 gap-1.5 shadow-lg shadow-primary/20"
                >
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">{t.nav.bookNow}</span>
                  <span className="sm:hidden">Call</span>
                </Button>
              </a>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
                }`}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-xl border-t border-border/50 shadow-xl">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {[
                { href: "/", label: t.nav.home },
                { href: "/packages", label: t.nav.packages },
                { href: "/enquiry", label: t.nav.contact },
                { href: "/login", label: t.nav.admin },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className="block px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors">
                    {label}
                  </span>
                </Link>
              ))}

              {/* Mobile Lang Toggle */}
              <div className="flex items-center gap-3 px-4 py-3 mt-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Language:</span>
                <button
                  onClick={() => setLang(lang === "en" ? "ta" : "en")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted text-xs font-bold"
                >
                  <span className={lang === "en" ? "text-primary font-black" : "text-muted-foreground"}>EN</span>
                  <span className="text-muted-foreground">|</span>
                  <span className={lang === "ta" ? "text-primary font-black" : "text-muted-foreground"}>தமிழ்</span>
                </button>
              </div>

              <a href="tel:8110806339" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm mt-1">
                <Phone className="h-4 w-4" /> 8110806339 — {lang === "en" ? "Call to Book" : "முன்பதிவு செய்யுங்கள்"}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Push content below fixed header only on non-home pages */}
      {!isHome && <div className="h-16" />}

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow">
                <span className="text-white font-black text-xs leading-none">SMT</span>
              </div>
              <span className="text-base font-black tracking-tight">Madurai SMT Travels</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-4 leading-relaxed">{t.footer.tagline}</p>
            <a href="tel:8110806339" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              <Phone className="h-4 w-4" /> 8110806339
            </a>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">{t.footer.destinations}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.footer.destItems.map((d) => (
                <li key={d}><span className="hover:text-primary cursor-pointer transition-colors">{d}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">{t.footer.services}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.footer.serviceItems.map((s) => (
                <li key={s}><span className="hover:text-primary cursor-pointer transition-colors">{s}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground text-sm uppercase tracking-wider">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/"><span className="hover:text-primary cursor-pointer transition-colors">{t.footer.home}</span></Link></li>
              <li><Link href="/packages"><span className="hover:text-primary cursor-pointer transition-colors">{t.footer.tourPackages}</span></Link></li>
              <li><Link href="/enquiry"><span className="hover:text-primary cursor-pointer transition-colors">{t.footer.contactUs}</span></Link></li>
              <li><Link href="/login"><span className="hover:text-primary cursor-pointer transition-colors">{t.footer.adminLogin}</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {t.footer.copyright}</span>
          <span className="italic font-semibold text-foreground/60">{t.footer.footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
