import { useGetPublicPackages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  MapPin, Clock, ArrowRight, Phone, Star, Shield, Users,
  HeadphonesIcon, CheckCircle2, ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const HERO_IMAGE = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=85&auto=format&fit=crop";

const DESTINATIONS = [
  {
    name: "Madurai",
    tagline: "Temple City of Culture and Heritage",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Rameshwaram",
    tagline: "Sacred Island of Lord Ramanathaswamy",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Dhanushkodi",
    tagline: "The Land End – Where History Meets the Sea",
    image: "https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Kanyakumari",
    tagline: "Where the Sun Rises and Sets in Glory",
    image: "https://images.unsplash.com/photo-1590080875861-dc27c08c1bc5?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Kovalam Beach",
    tagline: "Relax & Unwind at the Famous Beach Paradise",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Trivandrum",
    tagline: "Spiritual Bliss at the Divine Temples",
    image: "https://images.unsplash.com/photo-1625905254553-4dc51ef00be2?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Jatayu Earth Center",
    tagline: "World's Largest Bird Sculpture",
    image: "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=600&q=80&auto=format&fit=crop",
  },
];

const SERVICES = [
  { icon: Users, label: "Family Tours", desc: "Tailored packages for families of all sizes" },
  { icon: MapPin, label: "Pilgrimage Trips", desc: "Sacred journeys to holy temples & sites" },
  { icon: Shield, label: "Safe Travel", desc: "Experienced drivers & insured vehicles" },
  { icon: HeadphonesIcon, label: "24/7 Support", desc: "Always available for bookings & help" },
  { icon: CheckCircle2, label: "Airport Transfer", desc: "Pickup & drop from any airport" },
  { icon: Phone, label: "Outstation Cab", desc: "Comfortable cabs for long distance travel" },
];

const WHY_US = [
  "10+ years of trusted service in South India",
  "Fleet of well-maintained AC vehicles",
  "Experienced, licensed & courteous drivers",
  "Transparent pricing — no hidden charges",
  "Customised itineraries for groups & families",
  "Pilgrimage expertise: Madurai · Rameshwaram · Kanyakumari",
];

const TICKER_ITEMS = [
  "🏛️ Madurai Meenakshi Temple", "🌊 Rameshwaram Pilgrimage", "🌅 Kanyakumari Sunrise",
  "🦅 Jatayu Earth Center", "🏖️ Kovalam Beach", "📞 8110806339", "🚗 AC Innova & Crysta Fleet",
  "✅ Safe & Comfortable Travel", "⭐ 4.9 Customer Rating", "🕍 Dhanushkodi Land's End",
];

export default function PublicHome() {
  const { data: packages, isLoading } = useGetPublicPackages();

  return (
    <div className="flex flex-col">

      {/* Scrolling Ticker */}
      <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap gap-12">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-sm font-medium shrink-0">{item}</span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="South India Travel"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: "brightness(0.35)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white/90 mb-6 gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            Trusted by 5000+ Happy Travellers
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-4 leading-none drop-shadow-xl">
            Madurai<br />
            <span className="text-red-400">SMT</span> Travels
          </h1>
          <p className="text-lg md:text-2xl font-light text-white/80 italic mb-3">
            "Your Journey, Our Responsibility"
          </p>
          <p className="max-w-xl mx-auto text-base md:text-lg text-white/70 mb-10">
            Premium pilgrimage tours, family trips & outstation cab services across Tamil Nadu and Kerala.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/enquiry">
              <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold bg-red-600 hover:bg-red-700 text-white border-0 shadow-xl gap-2">
                Book Your Trip <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:8110806339">
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-base font-bold bg-white/10 backdrop-blur-sm text-white border-white/40 hover:bg-white/20 gap-2">
                <Phone className="h-4 w-4" /> 8110806339
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {[
              { v: "5000+", l: "Happy Travellers" },
              { v: "10+", l: "Years of Service" },
              { v: "50+", l: "Destinations" },
              { v: "4.9★", l: "Customer Rating" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-black text-red-400">{s.v}</div>
                <div className="text-xs text-white/60 font-medium mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/30 rounded-full animate-pulse"></div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 bg-gray-50 dark:bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Where We Take You</p>
            <h2 className="text-4xl font-black tracking-tight mb-3">Our Tour Destinations</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Handpicked pilgrimage sites, beaches and heritage landmarks across South India.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DESTINATIONS.map((dest) => (
              <div key={dest.name} className="group relative overflow-hidden rounded-2xl aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-1">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.name}/400/500`;
                  }}
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
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Best Value Trips</p>
              <h2 className="text-4xl font-black tracking-tight mb-2">Featured Tour Packages</h2>
              <p className="text-muted-foreground">All-inclusive packages with transport, stay & guide.</p>
            </div>
            <a href="tel:8110806339">
              <Button variant="outline" className="mt-4 md:mt-0 gap-2 rounded-full">
                <Phone className="h-4 w-4" /> Call to Customise
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-56 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : packages?.length ? (
              packages.map((pkg) => (
                <div key={pkg.id} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-card border border-border/40">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {pkg.imageUrl ? (
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.destinationName}/800/500`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://picsum.photos/seed/${pkg.destinationName}/800/500`}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Type badge */}
                    {pkg.packageType && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full capitalize shadow">
                        {pkg.packageType}
                      </div>
                    )}

                    {/* Rating */}
                    {pkg.rating && (
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {pkg.rating}
                      </div>
                    )}

                    {/* Duration overlay */}
                    <div className="absolute bottom-3 left-3 text-white text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {pkg.duration} Days
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 text-primary shrink-0" /> {pkg.destinationName}
                    </div>
                    <h3 className="font-bold text-base mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {pkg.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <span className="text-xs text-muted-foreground block">Starting from</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-primary">₹{Number(pkg.price).toLocaleString()}</span>
                          {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                            <span className="text-xs text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <a href="tel:8110806339">
                        <Button size="sm" className="rounded-full bg-red-600 hover:bg-red-700 text-white border-0 gap-1.5 text-xs">
                          <Phone className="h-3 w-3" /> Book
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No packages available. Please check back later.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Why Travellers Trust Us</p>
              <h2 className="text-4xl font-black tracking-tight mb-4 leading-tight">The Madurai SMT<br />Travels Promise</h2>
              <p className="text-muted-foreground text-base mb-8">
                Over a decade of taking families, pilgrims and corporate groups safely across South India's most iconic destinations. We don't just arrange travel — we craft memories.
              </p>
              <ul className="space-y-3">
                {WHY_US.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-4">
                <a href="tel:8110806339">
                  <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white border-0 gap-2">
                    <Phone className="h-4 w-4" /> Call Now
                  </Button>
                </a>
                <Link href="/enquiry">
                  <Button variant="outline" className="rounded-full gap-2">
                    Send Enquiry <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-3">
              {[
                "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1626196340148-c7b0de7c0ffd?w=400&q=80&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&auto=format&fit=crop",
              ].map((src, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden shadow-lg ${i === 1 ? "mt-6" : i === 3 ? "-mt-6" : ""}`}>
                  <img
                    src={src}
                    alt="Travel"
                    className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/travel${i}/400/400`;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">What We Offer</p>
            <h2 className="text-4xl font-black tracking-tight mb-3">Our Services</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything for a safe, comfortable and memorable South India journey.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {SERVICES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group p-6 rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-card">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-bold text-base mb-1">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1561361058-c24e1d9bd0ac?w=1920&q=80&auto=format&fit=crop"
          alt="Travel CTA"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.25)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-red-900/60" />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Ready to Plan Your<br />Dream Journey?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-md mx-auto">
            Call us now for instant bookings and customised tour packages. We're available 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:8110806339">
              <Button size="lg" className="h-16 px-12 rounded-full text-xl font-black bg-white text-red-700 hover:bg-white/90 border-0 shadow-xl gap-3">
                <Phone className="h-6 w-6" /> 8110806339
              </Button>
            </a>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-base font-bold border-white/50 text-white hover:bg-white/10 gap-2">
                Send Enquiry <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-white/60 italic font-medium text-sm">
            "Your Journey, Our Responsibility" — Madurai SMT Travels
          </p>
        </div>
      </section>

    </div>
  );
}
