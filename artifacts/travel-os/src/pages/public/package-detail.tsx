import { useGetPublicPackages, useGetPublicCmsSettings } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, Phone, ArrowLeft, ArrowRight, Check, X, Sparkles } from "lucide-react";
import { getSiteDomain } from "@/lib/site-domain";
import { useSeo } from "@/lib/use-seo";

const SITE_DOMAIN = getSiteDomain();

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const } }),
};

export default function PublicPackageDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: packages, isLoading } = useGetPublicPackages({ domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const contactPhone = cms?.phone || "8110806339";

  const pkg = (packages ?? []).find((p) => p.id === id);
  const brandName = cms?.companyDisplayName || "";
  const seoDescription = pkg
    ? (pkg.description?.slice(0, 155) ||
        `Book ${pkg.title}${pkg.destinationName ? ` to ${pkg.destinationName}` : ""} with ${brandName}. ${pkg.duration ? `${pkg.duration}, ` : ""}best price guaranteed. Enquire now.`)
    : undefined;
  useSeo(
    pkg && brandName
      ? {
          title: `${pkg.title}${pkg.destinationName ? ` — ${pkg.destinationName} Tour Package` : " — Tour Package"} | ${brandName}`,
          description: seoDescription,
          image: pkg.imageUrl || undefined,
          jsonLdId: "seo-jsonld-page",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: pkg.title,
            description: seoDescription,
            image: pkg.imageUrl || undefined,
            touristType: "Leisure",
            provider: { "@type": "TravelAgency", name: brandName },
            offers: { "@type": "Offer", price: pkg.price, priceCurrency: "INR", availability: "https://schema.org/InStock" },
          },
        }
      : { jsonLdId: "seo-jsonld-page", jsonLd: null },
  );
  const related = (packages ?? [])
    .filter((p) => p.id !== id && p.destinationName && pkg?.destinationName && p.destinationName === pkg.destinationName)
    .slice(0, 3);

  const bookHref = pkg
    ? `/enquiry?package=${encodeURIComponent(pkg.title)}${pkg.destinationName ? `&destination=${encodeURIComponent(pkg.destinationName)}` : ""}`
    : "/enquiry";

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
        <Skeleton className="h-[45vh] w-full rounded-none" />
        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="text-center py-24 max-w-md">
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>Package not found</h1>
          <p className="text-muted-foreground mb-8">This tour package may have been removed or is no longer available.</p>
          <Link href="/packages">
            <Button size="lg" className="rounded-full font-bold gap-2"><ArrowLeft className="h-4 w-4" /> Back to Packages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const heroImg = pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/1600/900`;

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[340px] overflow-hidden">
        <img src={heroImg} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/1600/900`; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Link href="/packages">
                <span className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold mb-4 cursor-pointer transition-colors">
                  <ArrowLeft className="h-4 w-4" /> All Packages
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {pkg.packageType && (
                  <span className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full capitalize tracking-wide">{pkg.packageType}</span>
                )}
                {pkg.rating && (
                  <span className="bg-white/15 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {pkg.rating}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg max-w-3xl" style={{ fontFamily: "var(--app-font-serif)" }}>{pkg.title}</h1>
              <div className="flex flex-wrap items-center gap-5 mt-4 text-white/90 font-semibold">
                {pkg.destinationName && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {pkg.destinationName}</span>}
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {pkg.duration} Days</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {pkg.description && (
              <motion.section custom={0} variants={fadeUp} initial="hidden" animate="show">
                <h2 className="text-2xl font-black mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>Overview</h2>
                <p className="text-[16px] leading-relaxed text-muted-foreground whitespace-pre-line">{pkg.description}</p>
              </motion.section>
            )}

            {pkg.highlights && pkg.highlights.length > 0 && (
              <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show">
                <h2 className="text-2xl font-black mb-5 flex items-center gap-2" style={{ fontFamily: "var(--app-font-serif)" }}>
                  <Sparkles className="h-5 w-5 text-primary" /> Highlights
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pkg.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-border/50 rounded-2xl p-4 shadow-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><Star className="h-3.5 w-3.5" /></div>
                      <span className="text-[15px] font-medium text-foreground/90">{h}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {((pkg.inclusions && pkg.inclusions.length > 0) || (pkg.exclusions && pkg.exclusions.length > 0)) && (
              <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-6">
                {pkg.inclusions && pkg.inclusions.length > 0 && (
                  <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-700"><Check className="h-5 w-5" /> What's Included</h3>
                    <ul className="space-y-3">
                      {pkg.inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground/80">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" /> <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.exclusions && pkg.exclusions.length > 0 && (
                  <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600"><X className="h-5 w-5" /> Not Included</h3>
                    <ul className="space-y-3">
                      {pkg.exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground/80">
                          <X className="h-4 w-4 text-red-400 shrink-0 mt-1" /> <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.section>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="lg:sticky lg:top-24 bg-white border border-border/60 rounded-[2rem] p-7 shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Starting from</span>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
                {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                  <span className="text-base text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6">per person · {pkg.duration} days</p>

              <Button size="lg" onClick={() => navigate(bookHref)} className="w-full rounded-full h-14 text-base font-black gap-2 shadow-lg shadow-primary/20 mb-3">
                Book This Package <ArrowRight className="h-5 w-5" />
              </Button>
              <a href={`tel:${contactPhone}`} className="block">
                <Button size="lg" variant="outline" className="w-full rounded-full h-13 text-base font-bold gap-2 border-border">
                  <Phone className="h-4 w-4" /> Call {contactPhone}
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center mt-4">Free consultation · No booking fees · Instant callback</p>
            </motion.div>
          </div>
        </div>

        {/* Related packages */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black mb-8" style={{ fontFamily: "var(--app-font-serif)" }}>More in {pkg.destinationName}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((r) => (
                <motion.div
                  key={r.id}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(`/packages/${r.id}`)}
                  className="group rounded-3xl overflow-hidden bg-white border border-border/50 flex flex-col cursor-pointer transition-all"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img src={r.imageUrl || `https://picsum.photos/seed/${r.destinationName}/800/600`} alt={r.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${r.destinationName}/800/600`; }} />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{r.title}</h3>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-lg font-black text-primary">₹{Number(r.price).toLocaleString()}</span>
                      <span className="text-sm font-bold text-primary flex items-center gap-1">View <ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
