import { motion } from "framer-motion";
import { Quote, ExternalLink, MessageSquareQuote, Phone } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetPublicTestimonials, useGetPublicGoogleReviews, useGetPublicCmsSettings } from "@workspace/api-client-react";
import { getSiteDomain } from "@/lib/site-domain";
import { useSeo } from "@/lib/use-seo";
import { useLang } from "@/lib/lang-context";
import { fadeUp, staggerContainer } from "./sections/_shared";
import { GoogleG, StarRow } from "./sections/testimonials-section";

const SITE_DOMAIN = getSiteDomain();

type CardReview = {
  key: string;
  authorName: string;
  rating: number;
  text: string;
  meta: string;
  isGoogle: boolean;
  photoUrl?: string | null;
};

export default function PublicReviews() {
  const { lang } = useLang();
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const { data: testimonials, isLoading: loadingManual } = useGetPublicTestimonials({ domain: SITE_DOMAIN });
  const { data: google, isLoading: loadingGoogle } = useGetPublicGoogleReviews({ domain: SITE_DOMAIN });

  const brandName = cms?.companyDisplayName || "";
  const phone = cms?.phone || "8110806339";

  useSeo({
    title: brandName ? `Customer Reviews & Ratings | ${brandName}` : undefined,
    description: brandName
      ? `Read genuine customer reviews and Google ratings for ${brandName}. Trusted cab booking and tour packages across Tamil Nadu & South India.`
      : undefined,
  });

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
  const isLoading = loadingManual || loadingGoogle;
  const hasGoogleRating = !!google?.connected && typeof google.rating === "number";
  const localAvg = all.length > 0 ? all.reduce((s, t) => s + t.rating, 0) / all.length : 0;

  return (
    <div className="bg-white">
      {/* Page header */}
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-primary/5 to-white border-b border-border/50">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial="hidden" animate="show" variants={staggerContainer(0.1)}>
            <motion.p variants={fadeUp} className="inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4 bg-primary/5 border border-primary/15 px-4 py-1.5 rounded-full">
              <MessageSquareQuote className="w-4 h-4" /> {lang === "en" ? "Customer Reviews" : "வாடிக்கையாளர் மதிப்புரைகள்"}
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
              {lang === "en" ? (
                <>What Our <span className="text-primary">Customers Say</span></>
              ) : (
                <>எங்கள் <span className="text-primary">வாடிக்கையாளர்கள்</span> சொல்வது</>
              )}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground text-base md:text-lg mb-6">
              {lang === "en"
                ? `Real experiences from travellers who booked with ${brandName}.`
                : `${brandName} உடன் பயணித்தவர்களின் உண்மையான அனுபவங்கள்.`}
            </motion.p>

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
                    {lang === "en" ? "See all reviews on Google" : "Google-இல் அனைத்து மதிப்புரைகளையும் பார்க்க"} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </motion.div>
            ) : all.length > 0 ? (
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-muted-foreground">
                <StarRow value={localAvg} size="h-5 w-5" />
                <span className="text-sm font-bold text-foreground">{localAvg.toFixed(1)}</span>
                <span className="text-sm">· {all.length} review{all.length > 1 ? "s" : ""}</span>
              </motion.div>
            ) : null}

            {google?.writeReviewUri && (
              <motion.div variants={fadeUp} className="mt-5">
                <a href={google.writeReviewUri} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full font-bold gap-2">
                    <GoogleG className="h-4 w-4" />
                    {lang === "en" ? "Review us on Google" : "Google-இல் எங்களை மதிப்பிடுங்கள்"}
                  </Button>
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-52 rounded-3xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : all.length === 0 ? (
            <div className="text-center max-w-md mx-auto py-12">
              <MessageSquareQuote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {lang === "en" ? "No reviews yet" : "இன்னும் மதிப்புரைகள் இல்லை"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {lang === "en"
                  ? "Be our next happy traveller — book a trip and share your experience!"
                  : "எங்களுடன் பயணித்து உங்கள் அனுபவத்தை பகிருங்கள்!"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
              variants={staggerContainer(0.06)}
            >
              {all.map((t) => (
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
                    “{t.text}”
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
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-3xl bg-primary text-white text-center px-6 py-12 shadow-xl shadow-primary/20">
            <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
              {lang === "en" ? "Ready for your own great trip?" : "உங்கள் அடுத்த பயணத்திற்கு தயாரா?"}
            </h2>
            <p className="text-white/85 mb-6 text-sm md:text-base">
              {lang === "en"
                ? "Join our happy travellers — enquire now and we'll plan everything for you."
                : "இப்போதே விசாரிக்கவும் — உங்கள் பயணத்தை நாங்கள் திட்டமிடுகிறோம்."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={`tel:${phone}`}>
                <Button size="lg" variant="secondary" className="rounded-full font-bold gap-2">
                  <Phone className="h-4 w-4" /> {phone}
                </Button>
              </a>
              <Link href="/enquiry">
                <Button size="lg" className="rounded-full font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30">
                  {lang === "en" ? "Send Enquiry" : "விசாரணை அனுப்பு"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
