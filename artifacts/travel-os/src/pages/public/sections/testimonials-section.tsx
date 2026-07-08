import { motion } from "framer-motion";
import { Star, Quote, ExternalLink } from "lucide-react";
import { useGetPublicTestimonials, useGetPublicGoogleReviews } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { fadeUp, staggerContainer } from "./_shared";

const SITE_DOMAIN = getSiteDomain();

function GoogleG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-label="Google">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function StarRow({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

type CardReview = {
  key: string;
  authorName: string;
  rating: number;
  text: string;
  meta: string;
  isGoogle: boolean;
  photoUrl?: string | null;
};

export default function TestimonialsSection() {
  const { data: testimonials } = useGetPublicTestimonials({ domain: SITE_DOMAIN });
  const { data: google } = useGetPublicGoogleReviews({ domain: SITE_DOMAIN });

  const manual: CardReview[] = (testimonials ?? []).map((t) => ({
    key: `m-${t.id}`,
    authorName: t.authorName,
    rating: t.rating,
    text: t.content,
    meta: [t.location, t.tripName].filter(Boolean).join(" · "),
    isGoogle: false,
  }));

  const googleReviews: CardReview[] = (google?.connected ? google.reviews : []).map((r, i) => ({
    key: `g-${i}`,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    meta: r.relativeTime ?? "Google review",
    isGoogle: true,
    photoUrl: r.profilePhotoUrl,
  }));

  const all = [...googleReviews, ...manual];
  if (all.length === 0) return null;

  const hasGoogleRating = !!google?.connected && typeof google.rating === "number";
  const localAvg = all.reduce((s, t) => s + t.rating, 0) / all.length;

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

          {hasGoogleRating ? (
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-3 bg-white border border-border rounded-full px-5 py-2.5 shadow-sm">
                <GoogleG className="h-5 w-5" />
                <span className="font-black text-lg">{google!.rating!.toFixed(1)}</span>
                <StarRow value={google!.rating!} />
                {typeof google!.totalReviews === "number" && (
                  <span className="text-sm text-muted-foreground">({google!.totalReviews} Google reviews)</span>
                )}
              </div>
              {google!.mapsUri && (
                <a
                  href={google!.mapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  See all reviews on Google <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-muted-foreground">
              <StarRow value={localAvg} size="h-5 w-5" />
              <span className="text-sm font-bold text-foreground">{localAvg.toFixed(1)}</span>
              <span className="text-sm">· {all.length} review{all.length > 1 ? "s" : ""}</span>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer(0.08)}
        >
          {all.slice(0, 6).map((t) => (
            <motion.figure
              key={t.key}
              variants={fadeUp}
              className="relative p-7 rounded-3xl bg-[#FAF8F5] border border-border/60 hover:border-primary/25 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <Quote className="h-8 w-8 text-primary/15 absolute top-5 right-6" />
              <div className="flex items-center gap-2 mb-4">
                <StarRow value={t.rating} />
                {t.isGoogle && <GoogleG className="h-4 w-4" />}
              </div>
              <blockquote className="text-[15px] leading-relaxed text-foreground/85 flex-1">
                “{t.text.length > 280 ? `${t.text.slice(0, 280).trimEnd()}…` : t.text}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.authorName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {t.authorName.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{t.authorName}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      {t.isGoogle && <span className="font-semibold">Google</span>}
                      {t.isGoogle && t.meta && <span>·</span>}
                      {t.meta}
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
