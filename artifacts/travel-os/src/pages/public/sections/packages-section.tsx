import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type SectionCommon, fadeUp, scaleIn, staggerContainer } from "./_shared";

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

function PriceRow({ pkg, t, heroPhone }: { pkg: PublicPackage; t: SectionCommon["t"]; heroPhone: string }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/50">
      <div>
        <span className="text-xs text-muted-foreground block">{t.packages.from}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
          {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
            <span className="text-xs text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</span>
          )}
        </div>
      </div>
      <a href={`tel:${heroPhone}`}>
        <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
          <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-1.5 text-xs">
            <Phone className="h-3 w-3" /> {t.packages.book}
          </Button>
        </motion.div>
      </a>
    </div>
  );
}

function PackageCard({
  pkg,
  t,
  heroPhone,
  tokens,
}: {
  pkg: PublicPackage;
  t: SectionCommon["t"];
  heroPhone: string;
  tokens: SectionCommon["tokens"];
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.18)", transition: { duration: 0.25 } }}
      className={`group ${tokens.cardRadius} overflow-hidden ${tokens.cardClass}`}
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
          <Clock className="h-3.5 w-3.5" /> {pkg.duration} {t.packages.days}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 text-primary shrink-0" /> {pkg.destinationName}
        </div>
        <h3 className="font-bold text-base mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-1">{pkg.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{pkg.description}</p>
        <PriceRow pkg={pkg} t={t} heroPhone={heroPhone} />
      </div>
    </motion.div>
  );
}

function PackageListRow({
  pkg,
  t,
  heroPhone,
  tokens,
}: {
  pkg: PublicPackage;
  t: SectionCommon["t"];
  heroPhone: string;
  tokens: SectionCommon["tokens"];
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`group flex flex-col sm:flex-row overflow-hidden ${tokens.cardRadius} ${tokens.cardClass}`}
    >
      <div className="relative sm:w-72 shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden bg-muted">
        <img
          src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destinationName}/800/500`}
          alt={pkg.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/500`; }}
        />
        {pkg.packageType && (
          <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full capitalize shadow">
            {pkg.packageType}
          </div>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <MapPin className="h-3 w-3 text-primary shrink-0" /> {pkg.destinationName}
          <span className="mx-1">•</span>
          <Clock className="h-3 w-3 shrink-0" /> {pkg.duration} {t.packages.days}
          {pkg.rating && (
            <>
              <span className="mx-1">•</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {pkg.rating}
            </>
          )}
        </div>
        <h3 className="font-bold text-lg mb-1 leading-snug group-hover:text-primary transition-colors">{pkg.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{pkg.description}</p>
        <PriceRow pkg={pkg} t={t} heroPhone={heroPhone} />
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
        <motion.p variants={fadeUp} className={`${tokens.eyebrowClass} mb-2`}>{t.packages.eyebrow}</motion.p>
        <motion.h2 variants={fadeUp} className={`${tokens.headingClass} mb-2`} style={tokens.headingFont ? { fontFamily: tokens.headingFont } : undefined}>{t.packages.heading}</motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground">{t.packages.sub}</motion.p>
      </div>
      <motion.div variants={fadeUp}>
        <a href={`tel:${heroPhone}`}>
          <Button variant="outline" className="mt-4 md:mt-0 gap-2 rounded-full">
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerContainer(0.1)}
    >
      {Array(6).fill(0).map((_, i) => (
        <motion.div key={i} variants={scaleIn} className="rounded-2xl overflow-hidden shadow-md">
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div>
        </motion.div>
      ))}
    </motion.div>
  );

  const empty = <div className="text-center py-12 text-muted-foreground">{t.packages.noPackages}</div>;

  let body: React.ReactNode;
  if (isLoading) {
    body = loadingSkeleton;
  } else if (!packages?.length) {
    body = empty;
  } else if (variant === "list") {
    body = (
      <motion.div
        className="flex flex-col gap-5 max-w-4xl mx-auto"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {packages.map((pkg) => (
          <PackageListRow key={pkg.id} pkg={pkg} t={t} heroPhone={heroPhone} tokens={tokens} />
        ))}
      </motion.div>
    );
  } else if (variant === "carousel") {
    body = (
      <motion.div
        className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {packages.map((pkg) => (
          <div key={pkg.id} className="snap-start shrink-0 w-[300px] md:w-[340px]">
            <PackageCard pkg={pkg} t={t} heroPhone={heroPhone} tokens={tokens} />
          </div>
        ))}
      </motion.div>
    );
  } else {
    body = (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        variants={staggerContainer(0.1)}
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} t={t} heroPhone={heroPhone} tokens={tokens} />
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
