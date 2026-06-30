import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { motion } from "framer-motion";
import {
  type SectionCommon,
  AnimatedNumber,
  fadeUp,
  scaleIn,
  staggerContainer,
} from "./_shared";

interface HeroProps extends SectionCommon {
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  heroCtaText: string;
  heroBgImage: string;
  stats: readonly { v: string; l: string }[];
}

function HeroStats({ stats, light }: { stats: readonly { v: string; l: string }[]; light: boolean }) {
  return (
    <motion.div variants={staggerContainer(0.1)} className="flex flex-wrap gap-6 md:gap-12">
      {stats.map((s) => (
        <motion.div key={s.l} variants={scaleIn} className="text-center">
          <div className="text-3xl font-black text-amber-400">
            <AnimatedNumber target={s.v} />
          </div>
          <div className={`text-xs font-medium mt-0.5 ${light ? "text-white/60" : "text-muted-foreground"}`}>
            {s.l}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function CtaButtons({
  heroCtaText,
  heroPhone,
  center,
}: {
  heroCtaText: string;
  heroPhone: string;
  center: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`flex flex-col sm:flex-row gap-4 ${center ? "justify-center" : ""}`}
    >
      <Link href="/enquiry">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-xl shadow-primary/30 gap-2">
            {heroCtaText} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Link>
      <a href={`tel:${heroPhone}`}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold bg-white/10 backdrop-blur-sm text-white border-white/40 hover:bg-white/20 gap-2">
            <Phone className="h-4 w-4" /> {heroPhone}
          </Button>
        </motion.div>
      </a>
    </motion.div>
  );
}

export default function HeroSection(props: HeroProps) {
  const { t, tokens, variant, heroTitle, heroSubtitle, heroDesc, heroCtaText, heroBgImage, heroPhone, stats } = props;
  const headingStyle = tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined;

  /* ── Minimal: short, light hero with a thin image strip ── */
  if (variant === "minimal") {
    return (
      <section className="relative bg-background pt-32 pb-16 mt-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl"
            variants={staggerContainer(0.12, 0.1)}
            initial="hidden"
            animate="show"
          >
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-4`}>{t.hero.badge}</motion.p>
            <motion.h1 variants={fadeUp} className={`${tokens.heroHeadingClass} mb-5`} style={headingStyle}>
              {heroTitle}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-3">{heroSubtitle}</motion.p>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground mb-10">{heroDesc}</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link href="/enquiry">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-13 px-9 rounded-full text-base font-bold gap-2">
                    {heroCtaText} <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <a href={`tel:${heroPhone}`}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" className="h-13 px-9 rounded-full text-base font-bold gap-2">
                    <Phone className="h-4 w-4" /> {heroPhone}
                  </Button>
                </motion.div>
              </a>
            </motion.div>
            <HeroStats stats={stats} light={false} />
          </motion.div>
        </div>
        <div className="container mx-auto px-4 mt-12">
          <motion.div
            className="overflow-hidden rounded-2xl h-64 md:h-80"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <img src={heroBgImage} alt={heroTitle} className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Split: text left, image right ── */
  if (variant === "split") {
    return (
      <section className="relative bg-background overflow-hidden pt-28 pb-16 mt-16">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={staggerContainer(0.13, 0.1)} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-semibold mb-6 gap-2"
            >
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {t.hero.badge}
            </motion.div>
            <motion.h1 variants={fadeUp} className={`${tokens.heroHeadingClass} mb-4`} style={headingStyle}>
              {heroTitle}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-2xl font-light text-muted-foreground italic mb-3">{heroSubtitle}</motion.p>
            <motion.p variants={fadeUp} className="max-w-xl text-muted-foreground mb-8">{heroDesc}</motion.p>
            <div className="mb-10"><CtaButtons heroCtaText={heroCtaText} heroPhone={heroPhone} center={false} /></div>
            <HeroStats stats={stats} light={false} />
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl rounded-[2rem]" />
            <img
              src={heroBgImage}
              alt={heroTitle}
              className="relative w-full h-[28rem] lg:h-[34rem] object-cover rounded-3xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Centered (default): full-bleed image, overlay, centered content ── */
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden mt-16">
      <motion.img
        src={heroBgImage}
        alt={heroTitle}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: tokens.heroImageFilter }}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.0 }}
        transition={{ duration: 8, ease: "easeOut" }}
      />
      <div className={`absolute inset-0 ${tokens.heroOverlay}`} />

      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        className="relative z-10 container mx-auto px-4 text-center text-white pt-8"
        variants={staggerContainer(0.15, 0.2)}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white/90 mb-6 gap-2"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          {t.hero.badge}
        </motion.div>

        <motion.h1 variants={fadeUp} className={`${tokens.heroHeadingClass} mb-4 drop-shadow-xl`} style={headingStyle}>
          {heroTitle}
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg md:text-2xl font-light text-white/80 italic mb-3">{heroSubtitle}</motion.p>
        <motion.p variants={fadeUp} className="max-w-xl mx-auto text-base md:text-lg text-white/70 mb-10">{heroDesc}</motion.p>

        <div className="mb-14"><CtaButtons heroCtaText={heroCtaText} heroPhone={heroPhone} center /></div>

        <div className="flex justify-center">
          <HeroStats stats={stats} light />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <span className="text-xs font-medium tracking-widest uppercase">{t.hero.scroll}</span>
        <motion.div
          className="w-px h-8 bg-white/30 rounded-full"
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
