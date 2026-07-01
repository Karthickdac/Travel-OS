import { useGetPublicDestinations } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import { MapPin, ArrowRight, Compass } from "lucide-react";
import { getSiteDomain } from "@/lib/site-domain";

const SITE_DOMAIN = getSiteDomain();

const DEST_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80&auto=format&fit=crop",
];

const fadeUp: Variants = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function PublicDestinations() {
  const { data: destinations, isLoading } = useGetPublicDestinations({ domain: SITE_DOMAIN });
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1920&q=80&auto=format&fit=crop" alt="Destinations" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.35)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        <motion.div className="relative z-10 container mx-auto" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">Discover</div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-xl" style={{ fontFamily: "var(--app-font-serif)" }}>Destinations</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl font-medium">Explore the temples, beaches, hills and heritage of South India — each with its own story to tell.</p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden shadow-md bg-white border border-border/50">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-6 space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
              </div>
            ))}
          </div>
        ) : !destinations || destinations.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-border border-dashed shadow-sm">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6"><Compass className="h-10 w-10 text-muted-foreground" /></div>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>No destinations yet</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">Destinations will appear here once they are added.</p>
          </div>
        ) : (
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={stagger} initial="hidden" animate="show">
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
                onClick={() => navigate(`/destinations/${dest.id}`)}
                className="group rounded-3xl overflow-hidden bg-white border border-border/50 flex flex-col cursor-pointer transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img src={dest.imageUrl || DEST_IMAGES[i % DEST_IMAGES.length]} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = DEST_IMAGES[i % DEST_IMAGES.length]; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-1 drop-shadow-md">
                      <MapPin className="h-3.5 w-3.5" /> {dest.state || dest.country}
                    </div>
                    <p className="text-2xl font-black drop-shadow-lg" style={{ fontFamily: "var(--app-font-serif)" }}>{dest.name}</p>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[15px] text-muted-foreground line-clamp-3 mb-5 flex-1 leading-relaxed">{dest.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm font-bold text-muted-foreground">{(dest.totalPackages ?? 0) > 0 ? `${dest.totalPackages} package${(dest.totalPackages ?? 0) > 1 ? "s" : ""}` : "Explore"}</span>
                    <span className="text-sm font-bold text-primary flex items-center gap-1">View Details <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
