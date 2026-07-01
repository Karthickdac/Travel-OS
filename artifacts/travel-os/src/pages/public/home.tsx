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
      <div className="bg-primary text-primary-foreground py-2 overflow-hidden fixed top-[56px] md:top-[64px] left-0 right-0 z-40 shadow-sm border-b border-white/20">
        <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap gap-12">
          {[...announcementItems, ...announcementItems, ...announcementItems].map((item, i) => (
            <span key={i} className="text-xs font-bold uppercase tracking-[0.15em] shrink-0 text-white flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              {item}
            </span>
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

      <WhySection
        t={t}
        tokens={tokens}
        variant={layouts.whyUs}
        heroPhone={heroPhone}
        aboutTitle={aboutTitle}
        aboutText={aboutText}
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

      {/* Services */}
      <section className={`py-24 bg-[#FAF8F5] relative`}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16 max-w-2xl mx-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer(0.1)}
          >
            <motion.p variants={fadeUp} className={`text-primary font-bold text-sm uppercase tracking-[0.2em] mb-3`}>{t.services.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`text-4xl md:text-5xl font-black mb-4 tracking-tight`} style={{ fontFamily: 'var(--app-font-serif)' }}>{t.services.heading}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-md mx-auto">{t.services.sub}</motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {t.services.items.map(({ label, desc }, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <motion.div
                  key={label}
                  variants={scaleIn}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)", transition: { duration: 0.3 } }}
                  className={`group p-8 rounded-3xl bg-white border border-border/50 hover:border-primary/20 transition-all duration-300`}
                >
                  <motion.div
                    className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white text-primary transition-colors duration-300"
                  >
                    {Icon && <Icon className="h-6 w-6" />}
                  </motion.div>
                  <p className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--app-font-serif)' }}>{label}</p>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1920&q=80&auto=format&fit=crop"
          alt="CTA background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.3) contrast(1.1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-black/80 mix-blend-multiply" />
        
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

        <motion.div
          className="relative z-10 container mx-auto px-4 text-center text-white"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.15)}
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] whitespace-pre-line drop-shadow-lg" style={{ fontFamily: 'var(--app-font-serif)' }}>{ctaTitle}</motion.h2>
          <motion.p variants={fadeUp} className="text-white/90 text-lg md:text-xl mb-12 max-w-2xl mx-auto drop-shadow">{ctaSubtitle}</motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 justify-center">
            <a href={`tel:${heroPhone}`}>
              <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.3)" }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-16 px-12 rounded-full text-lg font-black bg-white text-primary hover:bg-white/90 border-0 shadow-2xl gap-3 w-full sm:w-auto">
                  <Phone className="h-5 w-5" /> {heroPhone}
                </Button>
              </motion.div>
            </a>
            <Link href="/enquiry">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-base font-bold border-white/50 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 gap-2 w-full sm:w-auto">
                  {t.cta.enquire} <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-12 text-white/60 italic font-serif text-[15px] tracking-wide">{t.cta.tagline}</motion.p>
        </motion.div>
      </section>

    </div>
  );
}