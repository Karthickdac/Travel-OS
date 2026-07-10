import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, ChevronRight, MapPin, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { motion, AnimatePresence } from "framer-motion";
import { useGetPublicCmsSettings } from "@workspace/api-client-react";
import { getSiteDomain, hexToHslTriplet } from "@/lib/site-domain";
import { resolveSectionLayouts } from "@/lib/homepage-templates";
import { useSeo } from "@/lib/use-seo";
import { ConversionWidgets } from "@/components/layout/conversion-widgets";

const SITE_DOMAIN = getSiteDomain();

function logoAbbr(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 3).map((p) => p[0]).join("");
  return (letters || name.slice(0, 3)).toUpperCase();
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const isHome = location === "/";

  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  // Until the tenant's CMS data loads, render nothing brand-specific rather
  // than a hardcoded placeholder — otherwise every site briefly flashes the
  // wrong company name/phone on first paint before its own data arrives.
  const brandName = cms?.companyDisplayName || "";
  const brandAbbr = brandName ? logoAbbr(brandName) : "";
  const phone = cms?.phone || "";
  const phoneSecondary = cms?.phoneSecondary || "";
  const email = cms?.email || "";
  const address = cms?.address || "";

  // Per-tenant, per-page SEO (title, description, keywords, OG/Twitter,
  // canonical + JSON-LD structured data). All values are CMS-driven.
  const baseTitle = cms?.metaTitle || `${brandName} — Cab Booking & Tour Packages`;
  // Detail pages own their title/description (set via their own useSeo call
  // with item-specific content); the layout must not override them.
  const isDetailPage = /^\/(packages|destinations|blog)\/./.test(location);
  const pageTitle =
    location === "/packages"
      ? `Tour Packages & Holiday Deals | ${brandName}`
      : location === "/enquiry" || location === "/contact"
        ? `Contact & Book a Trip | ${brandName}`
        : baseTitle;
  const pageDescription =
    location === "/packages"
      ? `Browse ${brandName} tour packages — Kodaikanal, Rameshwaram, Kanyakumari, Munnar & South India holiday deals. Best prices, AC cabs, expert drivers. Enquire now.`
      : location === "/enquiry" || location === "/contact"
        ? `Contact ${brandName} for cab booking, outstation taxi and custom tour packages across Tamil Nadu & South India. Call ${phone} or send an enquiry online.`
        : cms?.metaDescription ||
          "Book cabs and tour packages across South India. Best prices, trusted service, 24/7 support.";
  const sameAs = [cms?.socialFacebook, cms?.socialInstagram, cms?.socialYoutube].filter(
    (u): u is string => !!u && /^https?:\/\//.test(u),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: brandName,
    description: cms?.metaDescription || pageDescription,
    telephone: phone,
    email,
    image: cms?.heroBgImage || undefined,
    logo: cms?.logoUrl || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "IN" },
    url: `${window.location.origin}/`,
    areaServed: [
      "Madurai", "Tamil Nadu", "South India", "Kerala",
      "Chennai", "Coimbatore", "Tiruchirappalli", "Trichy", "Salem", "Tirunelveli",
      "Erode", "Vellore", "Thoothukudi", "Tuticorin", "Dindigul", "Thanjavur",
      "Karur", "Namakkal", "Theni", "Virudhunagar", "Sivaganga", "Pudukkottai",
      "Kanyakumari", "Rameshwaram", "Kodaikanal", "Ooty", "Palani", "Velankanni",
      "Kumbakonam", "Chidambaram", "Munnar", "Thekkady", "Pondicherry", "Bangalore",
    ],
    keywords: cms?.metaKeywords || undefined,
    priceRange: "₹₹",
  };
  // Only manage the head once CMS data is present. While loading, pass
  // undefined so we don't overwrite the correct title the server injected
  // into the initial HTML with a placeholder built from an empty brand name.
  const seoReady = !!cms && !isDetailPage;
  useSeo({
    title: seoReady ? pageTitle : undefined,
    description: seoReady ? pageDescription : undefined,
    keywords: cms?.metaKeywords || undefined,
    image: seoReady ? cms?.heroBgImage || undefined : undefined,
    jsonLd: seoReady ? jsonLd : undefined,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Apply the tenant's CMS accent colour to the public theme so each site
  // renders in its own brand colour. Restores the default on unmount.
  useEffect(() => {
    const triplet = hexToHslTriplet(cms?.primaryColor);
    if (!triplet) return;
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--primary");
    root.style.setProperty("--primary", triplet);
    return () => {
      if (prev) root.style.setProperty("--primary", prev);
      else root.style.removeProperty("--primary");
    };
  }, [cms?.primaryColor]);

  useEffect(() => setMobileOpen(false), [location]);

  // The transparent (white-text) navbar only reads well over the dark
  // full-bleed "centered" hero. The "minimal" and "split" hero variants use a
  // light background with dark text, so keep the navbar solid there — otherwise
  // the white menu links become invisible on light-hero tenants.
  // Wait for CMS before trusting the hero variant — otherwise a light-hero
  // tenant would briefly flash a transparent white navbar (defaults resolve to
  // the dark "centered" hero) on first paint.
  const heroVariant = resolveSectionLayouts(cms?.homepageTemplate, cms?.sectionLayouts).hero;
  const darkHero = !!cms && heroVariant === "centered";
  const transparent = isHome && !scrolled && !mobileOpen && darkHero;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans">

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          transparent
            ? "bg-transparent border-b border-white/10"
            : "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-14 md:h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer shrink-0 group">
                <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${transparent ? 'bg-white text-primary' : 'bg-primary text-white group-hover:shadow-primary/30'}`}>
                  <span className="font-black text-sm leading-none tracking-tight">{brandAbbr}</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className={`text-lg font-black tracking-tight transition-colors ${transparent ? "text-white" : "text-foreground"}`}>
                    {brandName}
                  </span>
                  <span className={`text-[11px] font-semibold tracking-wider uppercase mt-1 transition-colors ${transparent ? "text-white/80" : "text-primary"}`}>
                    {lang === "en" ? "Safe • Comfortable • Reliable" : "பாதுகாப்பான • வசதியான • நம்பகமான"}
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {[
                { href: "/", label: t.nav.home },
                { href: "/packages", label: t.nav.packages },
                { href: "/destinations", label: t.nav.destinations },
                { href: "/blog", label: t.nav.blog },
                { href: "/trip-estimator", label: lang === "en" ? "Trip Estimator" : "பயண மதிப்பீடு" },
                { href: "/reviews", label: t.nav.reviews },
                { href: "/enquiry", label: t.nav.contact },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className={`px-4 py-2.5 rounded-full text-[15px] font-semibold transition-all cursor-pointer ${
                    transparent
                      ? "text-white/90 hover:text-white hover:bg-white/15"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}>
                    {label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "ta" : "en")}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all hover:scale-105 ${
                  transparent
                    ? "border-white/30 text-white bg-white/10 hover:bg-white/20"
                    : "border-border text-foreground bg-muted hover:bg-muted/80"
                }`}
              >
                <span className={lang === "en" ? "opacity-100 text-primary" : "opacity-50"}>EN</span>
                <span className={`w-px h-3 ${transparent ? "bg-white/30" : "bg-border"}`} />
                <span className={lang === "ta" ? "opacity-100 text-primary" : "opacity-50"}>தமிழ்</span>
              </button>

              {/* Phone */}
              {phone && (
                <a href={`tel:${phone}`} className={`hidden md:flex items-center gap-2 text-[15px] font-bold transition-colors ${
                  transparent ? "text-white hover:text-white/80" : "text-primary hover:text-primary/80"
                }`}>
                  <Phone className="h-4 w-4" /> {phone}
                </a>
              )}

              {/* Admin */}
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden lg:inline-flex text-sm font-semibold rounded-full ${
                    transparent ? "text-white/80 hover:text-white hover:bg-white/10" : ""
                  }`}
                >
                  {t.nav.admin}
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2 rounded-full transition-colors ${
                  transparent ? "text-white hover:bg-white/20" : "text-foreground hover:bg-muted"
                }`}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-2xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
                {[
                  { href: "/", label: t.nav.home },
                  { href: "/packages", label: t.nav.packages },
                  { href: "/destinations", label: t.nav.destinations },
                  { href: "/blog", label: t.nav.blog },
                  { href: "/trip-estimator", label: lang === "en" ? "Trip Estimator" : "பயண மதிப்பீடு" },
                  { href: "/reviews", label: t.nav.reviews },
                  { href: "/enquiry", label: t.nav.contact },
                  { href: "/login", label: t.nav.admin },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}>
                    <span className="flex items-center justify-between px-5 py-4 rounded-2xl text-base font-bold text-foreground hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors">
                      {label}
                      <ChevronRight className="h-5 w-5 opacity-50" />
                    </span>
                  </Link>
                ))}

                {/* Mobile Lang Toggle */}
                <div className="flex items-center justify-between px-5 py-4 mt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground font-semibold">Language</span>
                  <div className="flex gap-2 bg-muted p-1 rounded-full">
                    <button
                      onClick={() => setLang("en")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === "en" ? "bg-white text-primary shadow" : "text-muted-foreground"}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLang("ta")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === "ta" ? "bg-white text-primary shadow" : "text-muted-foreground"}`}
                    >
                      தமிழ்
                    </button>
                  </div>
                </div>

                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-primary text-white font-bold text-base mt-2 shadow-lg shadow-primary/20">
                  <Phone className="h-5 w-5" /> {phone}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Push content below fixed header only on non-home pages */}
      {!isHome && <div className="h-16 md:h-20" />}

      <main className="flex-1">
        {children}
      </main>

      <ConversionWidgets phone={phone} whatsapp={cms?.socialWhatsapp} brandName={brandName} />

      {/* Footer */}
      <footer className="bg-[#111] text-white/80 pt-20 pb-10 border-t-4 border-primary">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="lg:pr-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm leading-none">{brandAbbr}</span>
              </div>
              <span className="text-xl font-black text-white tracking-tight">{brandName}</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 font-medium text-white/60">{t.footer.tagline}</p>
            <div className="space-y-4">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 text-sm font-bold text-white hover:text-primary transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20">
                    <Phone className="h-4 w-4" />
                  </div>
                  {phone}
                </a>
              )}
              {phoneSecondary && (
                <a href={`tel:${phoneSecondary}`} className="flex items-center gap-3 text-sm font-bold text-white hover:text-primary transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20">
                    <Phone className="h-4 w-4" />
                  </div>
                  {phoneSecondary}
                </a>
              )}
              {address && (
                <div className="flex items-center gap-3 text-sm font-medium text-white/80 group">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  {address}
                </div>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm font-medium text-white/80 hover:text-primary transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20">
                    <Mail className="h-4 w-4" />
                  </div>
                  {email}
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-[0.2em]">{t.footer.destinations}</h4>
            <ul className="space-y-3 text-sm">
              {t.footer.destItems.map((d) => (
                <li key={d}><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{d}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-[0.2em]">{t.footer.services}</h4>
            <ul className="space-y-3 text-sm">
              {t.footer.serviceItems.map((s) => (
                <li key={s}><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{s}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-[0.2em]">{t.footer.quickLinks}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.footer.home}</span></Link></li>
              <li><Link href="/packages"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.footer.tourPackages}</span></Link></li>
              <li><Link href="/blog"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.nav.blog}</span></Link></li>
              <li><Link href="/reviews"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.nav.reviews}</span></Link></li>
              <li><Link href="/enquiry"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.footer.contactUs}</span></Link></li>
              <li><Link href="/login"><span className="hover:text-primary hover:translate-x-1 inline-block cursor-pointer transition-all duration-300">{t.footer.adminLogin}</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-white/40">
          <span>© {new Date().getFullYear()} {brandName ? `${brandName} · ` : ""}{t.footer.copyright}</span>
          <span className="italic font-serif text-[13px] text-white/50">{t.footer.footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
