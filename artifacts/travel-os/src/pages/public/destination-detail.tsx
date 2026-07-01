import { useGetPublicDestinations, useGetPublicPackages } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, ArrowRight, Clock, Tag, Sparkles } from "lucide-react";
import { getSiteDomain } from "@/lib/site-domain";

const SITE_DOMAIN = getSiteDomain();

const DEST_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1600&q=80&auto=format&fit=crop",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const } }),
};

export default function PublicDestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: destinations, isLoading } = useGetPublicDestinations({ domain: SITE_DOMAIN });
  const { data: packages } = useGetPublicPackages({ domain: SITE_DOMAIN });

  const dest = (destinations ?? []).find((d) => d.id === id);
  const destIndex = (destinations ?? []).findIndex((d) => d.id === id);
  const relatedPackages = (packages ?? []).filter(
    (p) => p.destinationId === id || (dest?.name && p.destinationName === dest.name),
  );

  const enquiryHref = dest ? `/enquiry?destination=${encodeURIComponent(dest.name)}` : "/enquiry";

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
        <Skeleton className="h-[45vh] w-full rounded-none" />
        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
          <Skeleton className="h-10 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="text-center py-24 max-w-md">
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>Destination not found</h1>
          <p className="text-muted-foreground mb-8">This destination may have been removed or is no longer available.</p>
          <Link href="/destinations">
            <Button size="lg" className="rounded-full font-bold gap-2"><ArrowLeft className="h-4 w-4" /> All Destinations</Button>
          </Link>
        </div>
      </div>
    );
  }

  const heroImg = dest.imageUrl || DEST_IMAGES[(destIndex < 0 ? 0 : destIndex) % DEST_IMAGES.length];

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[380px] overflow-hidden">
        <img src={heroImg} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = DEST_IMAGES[0]; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Link href="/destinations">
                <span className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold mb-4 cursor-pointer transition-colors">
                  <ArrowLeft className="h-4 w-4" /> All Destinations
                </span>
              </Link>
              <div className="flex items-center gap-1.5 text-primary text-sm font-bold uppercase tracking-widest mb-2 drop-shadow-md">
                <MapPin className="h-4 w-4" /> {[dest.state, dest.country].filter(Boolean).join(", ")}
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg" style={{ fontFamily: "var(--app-font-serif)" }}>{dest.name}</h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {dest.description && (
              <motion.section custom={0} variants={fadeUp} initial="hidden" animate="show">
                <h2 className="text-2xl font-black mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>About {dest.name}</h2>
                <p className="text-[16px] leading-relaxed text-muted-foreground whitespace-pre-line">{dest.description}</p>
              </motion.section>
            )}

            {dest.tags && dest.tags.length > 0 && (
              <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show">
                <h2 className="text-2xl font-black mb-5 flex items-center gap-2" style={{ fontFamily: "var(--app-font-serif)" }}>
                  <Sparkles className="h-5 w-5 text-primary" /> Highlights
                </h2>
                <div className="flex flex-wrap gap-3">
                  {dest.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-white border border-border/60 text-foreground/80 text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm">
                      <Tag className="h-3.5 w-3.5 text-primary" /> {tag}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Related packages */}
            {relatedPackages.length > 0 && (
              <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show">
                <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "var(--app-font-serif)" }}>Tour Packages in {dest.name}</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {relatedPackages.map((p) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ y: -6 }}
                      onClick={() => navigate(`/packages/${p.id}`)}
                      className="group rounded-3xl overflow-hidden bg-white border border-border/50 flex flex-col cursor-pointer transition-all"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img src={p.imageUrl || heroImg} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = DEST_IMAGES[0]; }} />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4"><Clock className="h-3.5 w-3.5" /> {p.duration} Days</div>
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-lg font-black text-primary">₹{Number(p.price).toLocaleString()}</span>
                          <span className="text-sm font-bold text-primary flex items-center gap-1">View <ArrowRight className="h-4 w-4" /></span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* CTA sidebar */}
          <div className="lg:col-span-1">
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="lg:sticky lg:top-24 bg-gradient-to-br from-primary to-primary/80 text-white rounded-[2rem] p-8 shadow-xl">
              <h3 className="text-2xl font-black mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>Plan your trip to {dest.name}</h3>
              <p className="text-white/85 text-[15px] leading-relaxed mb-7">Tell us your dates and preferences — our travel experts will craft a custom itinerary just for you.</p>
              <Button size="lg" variant="secondary" onClick={() => navigate(enquiryHref)} className="w-full rounded-full h-14 text-base font-black gap-2 bg-white text-primary hover:bg-white/90">
                Enquire Now <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-xs text-white/70 text-center mt-4">Free consultation · Instant callback</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
