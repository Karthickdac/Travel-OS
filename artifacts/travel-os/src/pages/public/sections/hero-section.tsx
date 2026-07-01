import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const DEFAULT_IMAGES = [
  "/images/hero-1.png",
  "/images/hero-2.png",
  "/images/hero-3.png",
  "/images/hero-4.png",
  "/images/hero-5.png",
];

function HeroStats({ stats, light }: { stats: readonly { v: string; l: string }[]; light: boolean }) {
  return (
    <motion.div variants={staggerContainer(0.1)} className="flex flex-wrap gap-8 md:gap-16 mt-8 justify-center">
      {stats.map((s) => (
        <motion.div key={s.l} variants={scaleIn} className="text-center">
          <div className={`text-3xl md:text-4xl font-black ${light ? "text-primary" : "text-primary"}`}>
            <AnimatedNumber target={s.v} />
          </div>
          <div className={`text-xs md:text-sm font-semibold mt-1 tracking-wider uppercase ${light ? "text-white/80" : "text-muted-foreground"}`}>
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
          <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-xl shadow-primary/30 gap-2 w-full sm:w-auto">
            {heroCtaText} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Link>
      <a href={`tel:${heroPhone}`}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold bg-white/10 backdrop-blur-md text-white border-white/40 hover:bg-white/20 gap-2 w-full sm:w-auto shadow-lg">
            <Phone className="h-4 w-4" /> {heroPhone}
          </Button>
        </motion.div>
      </a>
    </motion.div>
  );
}

export default function HeroSection(props: HeroProps) {
  const { t, tokens, variant, heroTitle, heroSubtitle, heroDesc, heroCtaText, heroBgImage, heroPhone, stats } = props;
  const headingStyle = { fontFamily: tokens.headingFont || 'var(--app-font-serif)' };

  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If heroBgImage is the unsplash default, don't duplicate it if we have generated images
    const isDefaultUnsplash = heroBgImage.includes("images.unsplash.com");
    let imgs = [];
    if (heroBgImage && !isDefaultUnsplash) {
      imgs = [heroBgImage, ...DEFAULT_IMAGES];
    } else {
      imgs = DEFAULT_IMAGES;
    }
    setImages(imgs);
  }, [heroBgImage]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  /* ── Minimal: short, light hero with a thin image strip ── */
  if (variant === "minimal") {
    return (
      <section className="relative bg-background pt-32 pb-16">
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
            className="overflow-hidden rounded-2xl h-64 md:h-80 relative"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            {images.length > 0 && (
              <img src={images[currentIndex]} alt={heroTitle} className="w-full h-full object-cover animate-kenburns" />
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Split: text left, image right ── */
  if (variant === "split") {
    return (
      <section className="relative bg-background overflow-hidden pt-28 pb-16">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={staggerContainer(0.13, 0.1)} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-semibold mb-6 gap-2"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
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
            <div className="relative w-full h-[28rem] lg:h-[34rem] overflow-hidden rounded-3xl shadow-2xl">
              <AnimatePresence initial={false}>
                {images.length > 0 && (
                  <motion.img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={heroTitle}
                    className="absolute inset-0 w-full h-full object-cover animate-kenburns"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Centered (default): full-bleed image slideshow, overlay, centered content ── */
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <AnimatePresence initial={false}>
        {images.length > 0 && (
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={heroTitle}
            className="absolute inset-0 w-full h-full object-cover animate-kenburns"
            style={{ filter: tokens.heroImageFilter || 'brightness(0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          />
        )}
      </AnimatePresence>
      <div className={`absolute inset-0 ${tokens.heroOverlay || 'bg-gradient-to-b from-black/60 via-black/30 to-black/80'}`} />

      <motion.div
        className="relative z-10 container mx-auto px-4 text-center text-white pt-20"
        variants={staggerContainer(0.15, 0.2)}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center rounded-full border border-white/20 bg-black/20 backdrop-blur-md px-5 py-2 text-sm font-semibold text-white mb-8 gap-2 shadow-xl"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="ml-2 text-white/90">{t.hero.badge}</span>
        </motion.div>

        <motion.h1 variants={fadeUp} className={`text-5xl sm:text-7xl md:text-8xl font-black mb-6 drop-shadow-2xl leading-tight ${tokens.heroHeadingClass}`} style={headingStyle}>
          {heroTitle}
        </motion.h1>

        <motion.p variants={fadeUp} className="text-xl md:text-3xl font-light text-white/90 italic mb-6 drop-shadow-lg" style={headingStyle}>
          {heroSubtitle}
        </motion.p>
        
        <motion.p variants={fadeUp} className="max-w-2xl mx-auto text-base md:text-lg text-white/80 mb-12 drop-shadow-md">
          {heroDesc}
        </motion.p>

        <div className="mb-16"><CtaButtons heroCtaText={heroCtaText} heroPhone={heroPhone} center /></div>

        <div className="flex justify-center pt-8 border-t border-white/10 max-w-4xl mx-auto">
          <HeroStats stats={stats} light />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-xs font-bold tracking-[0.2em] uppercase">{t.hero.scroll}</span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-white to-transparent rounded-full"
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 0.8, 0.3], transformOrigin: "top" }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
