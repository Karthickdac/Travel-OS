import { useState } from "react";
import { useGetPublicPackages, useGetPublicCmsSettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import { MapPin, Clock, Star, Phone, ArrowRight, Search, Filter } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getSiteDomain } from "@/lib/site-domain";

const SITE_DOMAIN = getSiteDomain();

const PACKAGE_TYPES = ["all", "pilgrimage", "family", "adventure", "honeymoon", "luxury", "corporate", "group"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function PublicPackages() {
  const { data: packages, isLoading } = useGetPublicPackages({ domain: SITE_DOMAIN });
  const { data: cms } = useGetPublicCmsSettings({ domain: SITE_DOMAIN });
  const contactPhone = cms?.phone || "8110806339";
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
    <div className="min-h-screen pt-14 md:pt-16 bg-[#FAF8F5]">
      {/* Hero banner */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1920&q=80&auto=format&fit=crop"
          alt="Packages Hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        
        <motion.div 
          className="relative z-10 container mx-auto"
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            Explore Our
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-xl" style={{ fontFamily: 'var(--app-font-serif)' }}>
            Tour Packages
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl mb-12 font-medium">
            Handcrafted journeys across Tamil Nadu, Kerala & beyond. Discover the beauty of South India.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-2xl flex items-center">
            <Search className="h-5 w-5 text-white/50 ml-4 shrink-0" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search destinations, temples, or keywords..." 
              className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 text-base h-12 px-4 shadow-none" 
            />
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 shrink-0">
              Search
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Type filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PACKAGE_TYPES.map(type => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTypeFilter(type)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all duration-300 shadow-sm ${
                typeFilter === type 
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                  : "bg-white border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {type === "all" ? "All Packages" : type}
            </motion.button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-end mb-8 border-b border-border/60 pb-4">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--app-font-serif)' }}>
              {typeFilter === "all" ? "All Experiences" : `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Tours`}
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> packages
            </p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-3xl overflow-hidden shadow-md bg-white border border-border/50">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="pt-4 mt-4 border-t border-border flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32 bg-white rounded-3xl border border-border border-dashed shadow-sm">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--app-font-serif)' }}>No packages found</h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">We couldn't find any packages matching your search criteria.</p>
            <Button size="lg" className="rounded-full font-bold px-8" onClick={() => { setSearch(""); setTypeFilter("all"); }}>
              View All Packages
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {filtered.map(pkg => (
              <motion.div
                key={pkg.id}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", transition: { duration: 0.3 } }}
                className="group rounded-3xl overflow-hidden bg-white border border-border/50 flex flex-col h-full transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/800/600`}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/600`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  
                  {pkg.packageType && (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-primary text-xs font-black px-3 py-1.5 rounded-full capitalize shadow-sm tracking-widest">
                      {pkg.packageType}
                    </div>
                  )}
                  {pkg.rating && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {pkg.rating}
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-1.5 drop-shadow-md">
                      <MapPin className="h-3.5 w-3.5" /> {pkg.destinationName}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
                      <Clock className="h-4 w-4" /> {pkg.duration} Days
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-2xl mb-3 leading-snug group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--app-font-serif)' }}>{pkg.title}</h3>
                  <p className="text-[15px] text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">{pkg.description}</p>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-border mt-auto">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Starting from</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
                        {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                          <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">₹{Number(pkg.originalPrice).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <a href={`tel:${contactPhone}`}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-5 h-10 gap-2 shadow-md shadow-primary/20">
                          <Phone className="h-4 w-4" /> Book
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
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 relative overflow-hidden rounded-[2.5rem] p-12 md:p-16 text-center text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-700" />
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-black mb-6" style={{ fontFamily: 'var(--app-font-serif)' }}>Can't find what you're looking for?</h3>
            <p className="text-white/90 text-lg md:text-xl mb-10 leading-relaxed font-medium">We create custom itineraries tailored to your group size, specific dates, budget, and desired destinations across South India.</p>
            <div className="flex gap-5 justify-center flex-wrap">
              <a href={`tel:${contactPhone}`}>
                <Button size="lg" className="gap-2 rounded-full h-14 px-8 text-base font-bold bg-white text-primary hover:bg-white/90 shadow-xl w-full sm:w-auto">
                  <Phone className="h-5 w-5" /> Call {contactPhone}
                </Button>
              </a>
              <Link href="/enquiry">
                <Button size="lg" variant="outline" className="gap-2 rounded-full h-14 px-8 text-base font-bold border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 w-full sm:w-auto">
                  Enquire Online <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}