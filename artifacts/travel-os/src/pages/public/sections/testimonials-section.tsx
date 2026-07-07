import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useGetPublicTestimonials } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { fadeUp, staggerContainer } from "./_shared";

const SITE_DOMAIN = getSiteDomain();

export default function TestimonialsSection() {
  const { data: testimonials } = useGetPublicTestimonials({ domain: SITE_DOMAIN });

  if (!testimonials || testimonials.length === 0) return null;

  const avg =
    testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length;

  return (
    <section className="py-20 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12 max-w-2xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.1)}
        >
          <motion.p variants={fadeUp} className="inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.2em] mb-3 bg-primary/5 border border-primary/15 px-4 py-1.5 rounded-full">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Happy Travellers
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            What Our <span className="text-primary">Customers Say</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-5 w-5 ${n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </span>
            <span className="text-sm font-bold text-foreground">{avg.toFixed(1)}</span>
            <span className="text-sm">· {testimonials.length} review{testimonials.length > 1 ? "s" : ""}</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer(0.08)}
        >
          {testimonials.slice(0, 6).map((t) => (
            <motion.figure
              key={t.id}
              variants={fadeUp}
              className="relative p-7 rounded-3xl bg-[#FAF8F5] border border-border/60 hover:border-primary/25 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <Quote className="h-8 w-8 text-primary/15 absolute top-5 right-6" />
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <blockquote className="text-[15px] leading-relaxed text-foreground/85 flex-1">
                “{t.content}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                    {t.authorName.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{t.authorName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[t.location, t.tripName].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
