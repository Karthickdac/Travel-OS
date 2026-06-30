import { useGetPublicPackages, useGetPublicCmsSettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Phone, Shield, Users, HeadphonesIcon } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { motion } from "framer-motion";
import { getTemplate, resolveSectionLayouts } from "@/lib/homepage-templates";
import { fadeUp, fadeIn, scaleIn, staggerContainer } from "./sections/_shared";
import HeroSection from "./sections/hero-section";
import DestinationsSection from "./sections/destinations-section";
import PackagesSection, { type PublicPackage } from "./sections/packages-section";
import WhySection from "./sections/why-section";

const HERO_IMAGE = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=85&auto=format&fit=crop";
const SERVICE_ICONS = [Users, MapPin, Shield, HeadphonesIcon, Phone, ArrowRight];

const SITE_DOMAIN = window.location.hostname;

export default function PublicHome() {
  const { data: packages, isLoading } = useGetPublicPackages({ domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const { t } = useLang();

  const template = getTemplate(cms?.homepageTemplate);
  const tokens = template.tokens;
  const layouts = resolveSectionLayouts(cms?.homepageTemplate, cms?.sectionLayouts);

  const heroTitle = cms?.heroTitle || "Madurai SMT Travels";
  const heroSubtitle = cms?.heroSubtitle || t.hero.tagline;
  const heroDesc = cms?.heroDesc || t.hero.desc;
  const heroCtaText = cms?.heroCtaText || t.hero.book;
  const heroPhone = cms?.phone || cms?.heroCtaPhone || "8110806339";
  const heroBgImage = cms?.heroBgImage || HERO_IMAGE;
  const announcementItems = cms?.announcementBar
    ? cms.announcementBar.split("|").map(s => s.trim()).filter(Boolean)
    : t.ticker;
  const cmsStats = cms ? [
    { v: cms.stat1Value || "5000+", l: cms.stat1Label || "Happy Customers" },
    { v: cms.stat2Value || "12+", l: cms.stat2Label || "Years Experience" },
    { v: cms.stat3Value || "50+", l: cms.stat3Label || "Vehicles" },
    { v: cms.stat4Value || "200+", l: cms.stat4Label || "Tour Packages" },
  ] : t.stats;
  const ctaTitle = cms?.ctaTitle || t.cta.heading;
  const ctaSubtitle = cms?.ctaSubtitle || t.cta.sub;
  const aboutTitle = cms?.aboutTitle || t.whyUs.heading;
  const aboutText = cms?.aboutText || t.whyUs.desc;

  const showDestinations = cms?.showDestinations ?? true;
  const showPackages = cms?.showPackages ?? true;

  return (
    <div className="flex flex-col overflow-x-hidden">

      {/* Scrolling Ticker */}
      <div className="bg-primary text-primary-foreground py-2 overflow-hidden mt-16">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap gap-10">
          {[...announcementItems, ...announcementItems].map((item, i) => (
            <span key={i} className="text-xs font-semibold shrink-0 tracking-wide">{item}</span>
          ))}
        </div>
      </div>

      <HeroSection
        t={t}
        tokens={tokens}
        variant={layouts.hero}
        heroPhone={heroPhone}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroDesc={heroDesc}
        heroCtaText={heroCtaText}
        heroBgImage={heroBgImage}
        stats={cmsStats}
      />

      {showDestinations && (
        <DestinationsSection t={t} tokens={tokens} variant={layouts.destinations} heroPhone={heroPhone} />
      )}

      {showPackages && (
        <PackagesSection
          t={t}
          tokens={tokens}
          variant={layouts.packages}
          heroPhone={heroPhone}
          packages={packages as PublicPackage[] | undefined}
          isLoading={isLoading}
        />
      )}

      <WhySection
        t={t}
        tokens={tokens}
        variant={layouts.whyUs}
        heroPhone={heroPhone}
        aboutTitle={aboutTitle}
        aboutText={aboutText}
      />

      {/* Services */}
      <section className={`${tokens.sectionPadding} ${tokens.sectionBg}`}>
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12 max-w-2xl mx-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer(0.1)}
          >
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-2`}>{t.services.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`${tokens.headingClass} mb-3`} style={tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined}>{t.services.heading}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mx-auto">{t.services.sub}</motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {t.services.items.map(({ label, desc }, i) => {
              const Icon = SERVICE_ICONS[i];
              return (
                <motion.div
                  key={label}
                  variants={scaleIn}
                  whileHover={{ y: -6, boxShadow: "0 16px 32px -8px rgba(0,0,0,0.12)", transition: { duration: 0.22 } }}
                  className={`group p-6 ${tokens.cardRadius} ${tokens.cardClass} hover:border-primary/20 transition-colors duration-300`}
                >
                  <motion.div
                    className="h-12 w-12 rounded-xl bg-primary/[0.08] flex items-center justify-center mb-4"
                    whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                  >
                    {Icon && <Icon className="h-6 w-6 text-primary" />}
                  </motion.div>
                  <p className="font-bold text-base mb-1">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=1920&q=80&auto=format&fit=crop"
          alt="CTA background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.2)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 to-black/70" />

        <motion.div
          className="relative z-10 container mx-auto px-4 text-center text-white"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.15)}
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 leading-tight whitespace-pre-line" style={tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined}>{ctaTitle}</motion.h2>
          <motion.p variants={fadeUp} className="text-white/80 text-lg mb-10 max-w-md mx-auto">{ctaSubtitle}</motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${heroPhone}`}>
              <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-16 px-12 rounded-full text-xl font-black bg-white text-orange-700 hover:bg-white/90 border-0 shadow-xl gap-3">
                  <Phone className="h-6 w-6" /> {heroPhone}
                </Button>
              </motion.div>
            </a>
            <Link href="/enquiry">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-base font-bold border-white/50 text-white hover:bg-white/10 gap-2">
                  {t.cta.enquire} <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-8 text-white/50 italic font-medium text-sm">{t.cta.tagline}</motion.p>
        </motion.div>
      </section>

    </div>
  );
}
