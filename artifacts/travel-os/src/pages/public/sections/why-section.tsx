import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, slideLeft, slideRight, staggerContainer } from "./_shared";

const WHY_IMAGES = [
  "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&auto=format&fit=crop",
];

interface WhyProps extends SectionCommon {
  aboutTitle: string;
  aboutText: string;
}

function CtaPair({ t, heroPhone, center }: { t: SectionCommon["t"]; heroPhone: string; center?: boolean }) {
  return (
    <motion.div variants={fadeUp} className={`flex gap-4 flex-wrap ${center ? "justify-center" : ""}`}>
      <a href={`tel:${heroPhone}`}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-2">
            <Phone className="h-4 w-4" /> {t.whyUs.call}
          </Button>
        </motion.div>
      </a>
      <Link href="/enquiry">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button variant="outline" className="rounded-full gap-2">
            {t.whyUs.enquire} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function WhySection({ t, tokens, variant, heroPhone, aboutTitle, aboutText }: WhyProps) {
  const headingStyle = tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined;
  const bullets = t.whyUs.bullets;

  /* ── Centered: heading + bullets centered, no image collage ── */
  if (variant === "centered") {
    return (
      <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)}>
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-2`}>{t.whyUs.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`${tokens.headingClass} mb-4 leading-tight whitespace-pre-line`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-base mb-8 max-w-xl mx-auto">{aboutText}</motion.p>
            <motion.ul variants={staggerContainer(0.08)} className="grid sm:grid-cols-2 gap-3 mb-8 text-left max-w-xl mx-auto">
              {bullets.map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
            <CtaPair t={t} heroPhone={heroPhone} center />
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Cards: each benefit as its own card ── */
  if (variant === "cards") {
    return (
      <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-12" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)}>
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-2`}>{t.whyUs.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`${tokens.headingClass} mb-3 leading-tight whitespace-pre-line`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">{aboutText}</motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {bullets.map((item, i) => (
              <motion.div
                key={item}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.22 } }}
                className={`p-6 ${tokens.cardRadius} ${tokens.cardClass} flex flex-col items-start gap-3`}
              >
                <div className="h-11 w-11 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-sm leading-snug">{item}</p>
                <span className="text-xs text-muted-foreground font-medium">0{i + 1}</span>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-10 flex justify-center"><CtaPair t={t} heroPhone={heroPhone} center /></div>
        </div>
      </section>
    );
  }

  /* ── Split (default): text + image collage ── */
  return (
    <section className={`${tokens.sectionPadding} ${tokens.altSectionBg}`}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)}>
            <motion.p variants={slideLeft} className={`${tokens.eyebrowClass} mb-2`}>{t.whyUs.eyebrow}</motion.p>
            <motion.h2 variants={slideLeft} className={`${tokens.headingClass} mb-4 leading-tight whitespace-pre-line`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={slideLeft} className="text-muted-foreground text-base mb-8">{aboutText}</motion.p>
            <motion.ul variants={staggerContainer(0.08)} className="space-y-3 mb-8">
              {bullets.map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  </motion.div>
                  <span className="text-sm font-medium">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
            <CtaPair t={t} heroPhone={heroPhone} />
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer(0.12)}
          >
            {WHY_IMAGES.map((src, i) => (
              <motion.div
                key={i}
                variants={slideRight}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                className={`rounded-2xl overflow-hidden shadow-lg ${i === 1 ? "mt-6" : i === 3 ? "-mt-6" : ""}`}
              >
                <img
                  src={src} alt="Travel"
                  className="w-full aspect-square object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/why${i}/400/400`; }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
