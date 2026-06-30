import { useGetPublicPackages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ArrowRight, Phone, Star, Shield, Users, HeadphonesIcon, CheckCircle2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/lang-context";

const HERO_IMAGE = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=85&auto=format&fit=crop";

const DEST_IMAGES = [
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590080875861-dc27c08c1bc5?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1625905254553-4dc51ef00be2?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=600&q=80&auto=format&fit=crop",
];

const SERVICE_ICONS = [Users, MapPin, Shield, HeadphonesIcon, Phone, ArrowRight];

const WHY_IMAGES = [
  "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&auto=format&fit=crop",
];

export default function PublicHome() {
  const { data: packages, isLoading } = useGetPublicPackages();
  const { t } = useLang();

  return (
    <div className="flex flex-col">

      {/* Scrolling Ticker */}
      <div className="bg-primary text-primary-foreground py-2 overflow-hidden mt-16">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap gap-10">
          {[...t.ticker, ...t.ticker].map((item, i) => (
            <span key={i} className="text-xs font-semibold shrink-0 tracking-wide">{item}</span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="South India Travel"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: "brightness(0.32)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />

        <div className="relative z-10 container mx-auto px-4 text-center text-white pt-8">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white/90 mb-6 gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            {t.hero.badge}
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-4 leading-none drop-shadow-xl">
            Madurai<br />
            <span className="text-amber-400">SMT</span> Travels
          </h1>
          <p className="text-lg md:text-2xl font-light text-white/80 italic mb-3">{t.hero.tagline}</p>
          <p className="max-w-xl mx-auto text-base md:text-lg text-white/70 mb-10">{t.hero.desc}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/enquiry">
              <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-xl shadow-primary/20 gap-2">
                {t.hero.book} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:8110806339">
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold bg-white/10 backdrop-blur-sm text-white border-white/40 hover:bg-white/20 gap-2">
                <Phone className="h-4 w-4" /> 8110806339
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {t.stats.map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-black text-amber-400">{s.v}</div>
                <div className="text-xs text-white/60 font-medium mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
          <span className="text-xs font-medium tracking-widest uppercase">{t.hero.scroll}</span>
          <div className="w-px h-8 bg-white/30 rounded-full animate-pulse" />
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 bg-gray-50 dark:bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{t.destinations.eyebrow}</p>
            <h2 className="text-4xl font-black tracking-tight mb-3">{t.destinations.heading}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.destinations.sub}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {t.destCards.map((dest, i) => (
              <div key={dest.name} className="group relative overflow-hidden rounded-2xl aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-1">
                <img
                  src={DEST_IMAGES[i]}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i}/400/500`; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-base leading-tight">{dest.name}</p>
                  <p className="text-white/70 text-xs mt-1 leading-snug">{dest.tagline}</p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{t.packages.eyebrow}</p>
              <h2 className="text-4xl font-black tracking-tight mb-2">{t.packages.heading}</h2>
              <p className="text-muted-foreground">{t.packages.sub}</p>
            </div>
            <a href="tel:8110806339">
              <Button variant="outline" className="mt-4 md:mt-0 gap-2 rounded-full">
                <Phone className="h-4 w-4" /> {t.packages.callBtn}
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-56 w-full rounded-none" />
                  <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div>
                </div>
              ))
            ) : packages?.length ? (
              packages.map((pkg) => (
                <div key={pkg.id} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-card border border-border/40">
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
                      <a href="tel:8110806339">
                        <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-1.5 text-xs">
                          <Phone className="h-3 w-3" /> {t.packages.book}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">{t.packages.noPackages}</div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{t.whyUs.eyebrow}</p>
              <h2 className="text-4xl font-black tracking-tight mb-4 leading-tight whitespace-pre-line">{t.whyUs.heading}</h2>
              <p className="text-muted-foreground text-base mb-8">{t.whyUs.desc}</p>
              <ul className="space-y-3 mb-8">
                {t.whyUs.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 flex-wrap">
                <a href="tel:8110806339">
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-white border-0 gap-2">
                    <Phone className="h-4 w-4" /> {t.whyUs.call}
                  </Button>
                </a>
                <Link href="/enquiry">
                  <Button variant="outline" className="rounded-full gap-2">
                    {t.whyUs.enquire} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {WHY_IMAGES.map((src, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden shadow-lg ${i === 1 ? "mt-6" : i === 3 ? "-mt-6" : ""}`}>
                  <img
                    src={src} alt="Travel"
                    className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/why${i}/400/400`; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{t.services.eyebrow}</p>
            <h2 className="text-4xl font-black tracking-tight mb-3">{t.services.heading}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{t.services.sub}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {t.services.items.map(({ label, desc }, i) => {
              const Icon = SERVICE_ICONS[i];
              return (
                <div key={label} className="group p-6 rounded-2xl border border-border/60 hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-card">
                  <div className="h-12 w-12 rounded-xl bg-primary/8 dark:bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 dark:group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-bold text-base mb-1">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=1920&q=80&auto=format&fit=crop"
          alt="CTA background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.2)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 to-black/70" />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight whitespace-pre-line">{t.cta.heading}</h2>
          <p className="text-white/80 text-lg mb-10 max-w-md mx-auto">{t.cta.sub}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:8110806339">
              <Button size="lg" className="h-16 px-12 rounded-full text-xl font-black bg-white text-orange-700 hover:bg-white/90 border-0 shadow-xl gap-3">
                <Phone className="h-6 w-6" /> 8110806339
              </Button>
            </a>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-base font-bold border-white/50 text-white hover:bg-white/10 gap-2">
                {t.cta.enquire} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-white/50 italic font-medium text-sm">{t.cta.tagline}</p>
        </div>
      </section>

    </div>
  );
}
