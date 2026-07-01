import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, scaleIn, staggerContainer, SectionHeading } from "./_shared";
import { Link, useLocation } from "wouter";

export interface PublicPackage {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  packageType?: string | null;
  rating?: string | null;
  duration?: number | string | null;
  destinationName?: string | null;
  price: string | number;
  originalPrice?: string | number | null;
}

interface PackagesProps extends SectionCommon {
  packages: PublicPackage[] | undefined;
  isLoading: boolean;
}

function PriceRow({ pkg, t }: { pkg: PublicPackage; t: SectionCommon["t"] }) {
  const [, navigate] = useLocation();
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border/60">
      <div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground block mb-1">{t.packages.from}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
          {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
            <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">₹{Number(pkg.originalPrice).toLocaleString()}</span>
          )}
        </div>
      </div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/packages/${pkg.id}`); }}
          className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-1.5 font-bold shadow-md shadow-primary/20"
        >
          {t.packages.book} <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </div>
  );
}

function PackageCard({
  pkg,
  t,
  tokens,
}: {
  pkg: PublicPackage;
  t: SectionCommon["t"];
  tokens: SectionCommon["tokens"];
}) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", transition: { duration: 0.3 } }}
      onClick={() => navigate(`/packages/${pkg.id}`)}
      className={`group ${tokens.cardRadius} overflow-hidden bg-card border border-border/40 flex flex-col h-full transition-all duration-300 cursor-pointer`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
        <img
          src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/800/600`}
          alt={pkg.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/600`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        {pkg.packageType && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-black px-3 py-1.5 rounded-full capitalize shadow-sm tracking-wide">
            {pkg.packageType}
          </div>
        )}
        
        {pkg.rating && (
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {pkg.rating}
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/90 mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {pkg.destinationName}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="h-4 w-4" /> {pkg.duration} {t.packages.days}
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-xl mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: tokens.headingFont || 'var(--app-font-serif)' }}>{pkg.title}</h3>
        <p className="text-[15px] text-muted-foreground line-clamp-2 mb-6 flex-1">{pkg.description}</p>
        <div className="mt-auto">
          <PriceRow pkg={pkg} t={t} />
        </div>
      </div>
    </motion.div>
  );
}

function PackageListRow({
  pkg,
  t,
  tokens,
}: {
  pkg: PublicPackage;
  t: SectionCommon["t"];
  tokens: SectionCommon["tokens"];
}) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/packages/${pkg.id}`)}
      className={`group flex flex-col sm:flex-row overflow-hidden ${tokens.cardRadius} bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all cursor-pointer`}
    >
      <div className="relative sm:w-80 shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden bg-muted">
        <img
          src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/800/500`}
          alt={pkg.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/500`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 sm:opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
        {pkg.packageType && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-black px-3 py-1.5 rounded-full capitalize shadow-sm tracking-wide">
            {pkg.packageType}
          </div>
        )}
      </div>
      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {pkg.destinationName}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {pkg.duration} {t.packages.days}</span>
          {pkg.rating && (
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {pkg.rating}</span>
          )}
        </div>
        <h3 className="font-bold text-2xl mb-3 leading-snug group-hover:text-primary transition-colors" style={{ fontFamily: tokens.headingFont || 'var(--app-font-serif)' }}>{pkg.title}</h3>
        <p className="text-[15px] text-muted-foreground line-clamp-2 mb-6 flex-1">{pkg.description}</p>
        <PriceRow pkg={pkg} t={t} />
      </div>
    </motion.div>
  );
}

function Header({ t, heroPhone, tokens }: { t: SectionCommon["t"]; heroPhone: string; tokens: SectionCommon["tokens"] }) {
  return (
    <motion.div
      className="flex flex-col md:flex-row md:items-end justify-between mb-12"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer(0.12)}
    >
      <div>
        <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-3 text-primary`}>{t.packages.eyebrow}</motion.p>
        <motion.h2 variants={fadeUp} className={`text-4xl md:text-5xl font-black mb-3 text-foreground`} style={{ fontFamily: tokens.headingFont || 'var(--app-font-serif)' }}>{t.packages.heading}</motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg">{t.packages.sub}</motion.p>
      </div>
      <motion.div variants={fadeUp} className="flex gap-4 mt-6 md:mt-0">
        <Link href="/packages">
          <Button variant="ghost" className="gap-2 rounded-full font-bold hover:bg-primary/5 hover:text-primary">
            View All <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <a href={`tel:${heroPhone}`}>
          <Button variant="outline" className="gap-2 rounded-full font-bold border-border">
            <Phone className="h-4 w-4" /> {t.packages.callBtn}
          </Button>
        </a>
      </motion.div>
    </motion.div>
  );
}

export default function PackagesSection({ t, tokens, variant, heroPhone, packages, isLoading }: PackagesProps) {
  const loadingSkeleton = (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerContainer(0.1)}
    >
      {Array(6).fill(0).map((_, i) => (
        <motion.div key={i} variants={scaleIn} className="rounded-[2rem] overflow-hidden shadow-md bg-card border border-border/50">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="pt-4 border-t border-border/50 flex justify-between">
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const empty = <div className="text-center py-20 text-muted-foreground font-medium bg-muted/30 rounded-3xl border border-border border-dashed">{t.packages.noPackages}</div>;

  const displayPackages = packages?.slice(0, 6) || [];

  let body: React.ReactNode;
  if (isLoading) {
    body = loadingSkeleton;
  } else if (!displayPackages.length) {
    body = empty;
  } else if (variant === "list") {
    body = (
      <motion.div
        className="flex flex-col gap-6 max-w-5xl mx-auto"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {displayPackages.map((pkg) => (
          <PackageListRow key={pkg.id} pkg={pkg} t={t} tokens={tokens} />
        ))}
      </motion.div>
    );
  } else if (variant === "carousel") {
    body = (
      <motion.div
        className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-none"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {displayPackages.map((pkg) => (
          <div key={pkg.id} className="snap-start shrink-0 w-[320px] md:w-[400px]">
            <PackageCard pkg={pkg} t={t} tokens={tokens} />
          </div>
        ))}
      </motion.div>
    );
  } else {
    body = (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {displayPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} t={t} tokens={tokens} />
        ))}
      </motion.div>
    );
  }

  return (
    <section className={`${tokens.sectionPadding} ${tokens.sectionBg}`}>
      <div className="container mx-auto px-4">
        <Header t={t} heroPhone={heroPhone} tokens={tokens} />
        {body}
      </div>
    </section>
  );
}