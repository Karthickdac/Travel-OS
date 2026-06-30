import { useState } from "react";
import { useGetPublicPackages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import { MapPin, Clock, Star, Phone, ArrowRight, Search, Filter } from "lucide-react";
import { useLang } from "@/lib/lang-context";

const PACKAGE_TYPES = ["all", "pilgrimage", "family", "adventure", "honeymoon", "luxury", "corporate", "group"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function PublicPackages() {
  const { data: packages, isLoading } = useGetPublicPackages();
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = (packages ?? []).filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.destinationName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.packageType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen pt-16">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-orange-950 via-orange-900 to-teal-900 py-16 px-4 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Explore Our</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Tour Packages</h1>
          <p className="text-white/70 max-w-md mx-auto text-base mb-8">Handcrafted journeys across Tamil Nadu, Kerala & beyond. Book with confidence.</p>
          <div className="flex max-w-md mx-auto gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search destinations or tours…" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-primary" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Type filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {PACKAGE_TYPES.map(type => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors border ${typeFilter === type ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/50"}`}
            >
              {type === "all" ? "All Packages" : type}
            </motion.button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm mb-6">
            Showing <strong>{filtered.length}</strong> package{filtered.length !== 1 ? "s" : ""}
            {typeFilter !== "all" && ` in ${typeFilter}`}
            {search && ` matching "${search}"`}
          </motion.p>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md">
                <Skeleton className="h-52 w-full rounded-none" />
                <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No packages found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filter.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setTypeFilter("all"); }}>Clear filters</Button>
          </motion.div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {filtered.map(pkg => (
              <motion.div
                key={pkg.id}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", transition: { duration: 0.22 } }}
                className="group rounded-2xl overflow-hidden shadow-md bg-card border border-border/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/800/500`}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/500`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {pkg.packageType && (
                    <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full capitalize shadow">
                      {pkg.packageType}
                    </div>
                  )}
                  {pkg.rating && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {pkg.rating}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 text-white text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {pkg.duration} days
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3 text-primary shrink-0" /> {pkg.destinationName}
                  </div>
                  <h3 className="font-bold text-base mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{pkg.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{pkg.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div>
                      <span className="text-xs text-muted-foreground block">Starting from</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
                        {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                          <span className="text-xs text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <a href="tel:8110806339">
                      <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-1.5 text-xs">
                          <Phone className="h-3 w-3" /> Book Now
                        </Button>
                      </motion.div>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 bg-gradient-to-r from-orange-50 to-teal-50 dark:from-orange-950/30 dark:to-teal-950/30 rounded-3xl p-10 text-center border border-border/40"
        >
          <h3 className="text-2xl font-black mb-2">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-6">We create custom itineraries tailored to your group, budget, and dates.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="tel:8110806339">
              <Button size="lg" className="gap-2 rounded-full"><Phone className="h-4 w-4" /> Call 8110806339</Button>
            </a>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="gap-2 rounded-full">Enquire Online <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
