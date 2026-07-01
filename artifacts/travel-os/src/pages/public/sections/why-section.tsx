import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, slideLeft, slideRight, staggerContainer, scaleIn } from "./_shared";

const WHY_IMAGES = [
  "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80&auto=format&fit=crop",
];

interface WhyProps extends SectionCommon {
  aboutTitle: string;
  aboutText: string;
}

function CtaPair({ t, heroPhone, center }: { t: SectionCommon["t"]; heroPhone: string; center?: boolean }) {
  return (
    <motion.div variants={fadeUp} className={`flex flex-col sm:flex-row gap-4 mt-8 ${center ? "justify-center" : ""}`}>
      <a href={`tel:${heroPhone}`}>
        <motion.div whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(234,88,12,0.3)" }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-2 h-14 px-8 w-full sm:w-auto shadow-lg">
            <Phone className="h-4 w-4" /> {t.whyUs.call}
          </Button>
        </motion.div>
      </a>
      <Link href="/enquiry">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" variant="outline" className="rounded-full gap-2 h-14 px-8 w-full sm:w-auto border-border hover:bg-muted font-bold text-foreground">
            {t.whyUs.enquire} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function WhySection({ t, tokens, variant, heroPhone, aboutTitle, aboutText }: WhyProps) {
  const headingStyle = { fontFamily: tokens.headingFont || 'var(--app-font-serif)' };
  const bullets = t.whyUs.bullets;

  /* ── Centered: heading + bullets centered, no image collage ── */
  if (variant === "centered") {
    return (
      <section className={`${tokens.sectionPadding} bg-background`}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)}>
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-4 text-primary`}>{t.whyUs.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`text-4xl md:text-5xl font-black mb-6 leading-[1.1] whitespace-pre-line text-foreground`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto leading-relaxed">{aboutText}</motion.p>
            <motion.ul variants={staggerContainer(0.08)} className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-left">
              {bullets.map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-[15px] font-semibold text-foreground">{item}</span>
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
      <section className={`${tokens.sectionPadding} bg-[#FAF8F5] relative`}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)}>
            <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-4 text-primary`}>{t.whyUs.eyebrow}</motion.p>
            <motion.h2 variants={fadeUp} className={`text-4xl md:text-5xl font-black mb-6 leading-[1.1] whitespace-pre-line text-foreground`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">{aboutText}</motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer(0.08)}
          >
            {bullets.map((item, i) => (
              <motion.div
                key={item}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", transition: { duration: 0.3 } }}
                className={`p-8 bg-white rounded-3xl border border-border/40 shadow-sm flex flex-col items-start gap-4 group transition-all`}
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <CheckCircle2 className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="font-bold text-lg leading-snug text-foreground" style={headingStyle}>{item}</p>
                <div className="mt-auto pt-4 flex items-center w-full">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground font-black tracking-widest uppercase ml-4 group-hover:text-primary transition-colors">0{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-16 flex justify-center"><CtaPair t={t} heroPhone={heroPhone} center /></div>
        </div>
      </section>
    );
  }

  /* ── Split (default): text + image collage ── */
  return (
    <section className={`${tokens.sectionPadding} bg-background overflow-hidden relative`}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.1)} className="relative z-10">
            <motion.div variants={slideLeft} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary mb-6 gap-2 tracking-widest uppercase">
              {t.whyUs.eyebrow}
            </motion.div>
            <motion.h2 variants={slideLeft} className={`text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] whitespace-pre-line text-foreground`} style={headingStyle}>{aboutTitle}</motion.h2>
            <motion.p variants={slideLeft} className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-xl">{aboutText}</motion.p>
            
            <motion.ul variants={staggerContainer(0.08)} className="space-y-5 mb-10">
              {bullets.map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-4 group">
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="mt-1 shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <CheckCircle2 className="h-4 w-4 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                  </motion.div>
                  <span className="text-[17px] font-medium text-foreground/90 group-hover:text-primary transition-colors duration-300">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
            <CtaPair t={t} heroPhone={heroPhone} />
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-4 sm:gap-6 relative"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer(0.12)}
          >
            {/* Decorative blob behind images */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-amber-400/20 rounded-full blur-[80px] pointer-events-none" />

            {WHY_IMAGES.map((src, i) => (
              <motion.div
                key={i}
                variants={slideRight}
                whileHover={{ scale: 1.03, y: -5, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", transition: { duration: 0.4 } }}
                className={`relative rounded-[2rem] overflow-hidden shadow-xl ${i === 1 ? "mt-12" : i === 3 ? "mt-[-3rem]" : ""}`}
              >
                <div className="absolute inset-0 bg-primary/10 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none z-10" />
                <img
                  src={src} alt="Travel South India"
                  className="w-full h-64 sm:h-80 object-cover hover:scale-110 transition-transform duration-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/why${i}/600/800`; }}
                />
              </motion.div>
            ))}
            
            {/* Trust badge overlay */}
            <motion.div 
              variants={scaleIn}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-3xl shadow-2xl z-20 flex flex-col items-center border border-border/50 backdrop-blur-sm bg-white/90"
            >
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(star => <svg key={star} className="w-5 h-5 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
              </div>
              <p className="font-black text-2xl text-foreground" style={headingStyle}>10+ Years</p>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mt-1">Experience</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}