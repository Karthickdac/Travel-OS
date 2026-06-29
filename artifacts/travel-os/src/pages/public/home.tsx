import { useGetPublicPackages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowRight, Plane, Star, Phone, Shield, Users, HeadphonesIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DESTINATIONS = [
  { name: "Madurai", tagline: "Temple City of Culture and Heritage", color: "from-orange-600 to-red-700" },
  { name: "Rameshwaram", tagline: "Sacred Island of Lord Ramanathaswamy", color: "from-blue-600 to-indigo-700" },
  { name: "Dhanushkodi", tagline: "The Land End – Where History Meets the Sea", color: "from-teal-600 to-cyan-700" },
  { name: "Kanyakumari", tagline: "Where the Sun Rises and Sets in Glory", color: "from-purple-600 to-pink-700" },
  { name: "Kovalam Beach", tagline: "Relax & Unwind at the Famous Beach Paradise", color: "from-emerald-600 to-green-700" },
  { name: "Trivandrum", tagline: "Spiritual Bliss at the Divine Temples", color: "from-amber-600 to-orange-700" },
  { name: "Jatayu Earth Center", tagline: "Explore the World's Largest Bird Sculpture", color: "from-slate-600 to-gray-700" },
];

const SERVICES = [
  { icon: Users, label: "Family Tours" },
  { icon: Plane, label: "Pilgrimage Trips" },
  { icon: MapPin, label: "Tourist Packages" },
  { icon: ArrowRight, label: "Airport Pickup & Drop" },
  { icon: Shield, label: "Safe & Comfortable Journey" },
  { icon: HeadphonesIcon, label: "24/7 Customer Support" },
];

export default function PublicHome() {
  const { data: packages, isLoading } = useGetPublicPackages();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-20 pb-28">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[100px] z-0" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] z-0" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6 gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Safe • Comfortable • Reliable Travel Service
          </div>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-foreground mb-4">
            Madurai <span className="text-primary">SMT</span> Travels
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-3 italic">
            "Your Journey, Our Responsibility"
          </p>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg mb-10">
            Specialising in pilgrimage tours, family trips and outstation cab services across Tamil Nadu, Kerala and beyond. Book with confidence — we handle everything.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
            <Link href="/enquiry">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:8110806339">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-border gap-2">
                <Phone className="h-4 w-4" /> 8110806339
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center mt-2">
            {[
              { label: "Happy Travellers", value: "5000+" },
              { label: "Years of Service", value: "10+" },
              { label: "Destinations Covered", value: "50+" },
              { label: "Customer Rating", value: "4.9★" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Our Tour Package Destinations</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Handpicked sacred sites, beaches and heritage locations across South India.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.name}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${dest.color} text-white p-5 flex flex-col justify-end min-h-[140px] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10">
                  <p className="font-bold text-base leading-tight">{dest.name}</p>
                  <p className="text-xs text-white/80 mt-1 leading-snug">{dest.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Tour Packages</h2>
              <p className="text-muted-foreground">Our most popular pilgrimage and travel packages.</p>
            </div>
            <Link href="/enquiry">
              <Button variant="ghost" className="mt-4 md:mt-0 text-primary">
                Enquire Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5 mt-2" /></CardContent>
                </Card>
              ))
            ) : packages?.length ? (
              packages.slice(0, 6).map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden border-border/50 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                    {pkg.imageUrl ? (
                      <img src={pkg.imageUrl} alt={pkg.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 text-muted-foreground/30">
                        <Plane className="h-12 w-12" />
                      </div>
                    )}
                    {pkg.packageType && (
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow capitalize">
                        {pkg.packageType}
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        <MapPin className="h-3 w-3 mr-1" /> {pkg.destinationName}
                      </div>
                      {pkg.rating && (
                        <div className="flex items-center text-sm font-semibold text-amber-500">
                          <Star className="h-3 w-3 mr-1 fill-current" /> {pkg.rating}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">{pkg.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {pkg.description || "Experience the best this destination has to offer with our carefully crafted itinerary."}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {pkg.duration} Days
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/50 mt-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Starting from</span>
                      <span className="text-lg font-bold">₹{Number(pkg.price).toLocaleString()}</span>
                      {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                        <span className="text-xs text-muted-foreground line-through ml-2">₹{Number(pkg.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                    <a href="tel:8110806339">
                      <Button size="sm" className="rounded-full text-xs gap-1">
                        <Phone className="h-3 w-3" /> Book Now
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No packages available at the moment. Please check back later.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Our Services</h2>
          <p className="text-primary-foreground/80 mb-12 max-w-xl mx-auto">Everything you need for a safe, comfortable, and memorable journey across South India.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {SERVICES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-5">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Plan Your Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Call us now for bookings and enquiries. We are available 24/7 to help plan your perfect trip.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:8110806339">
              <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold gap-3">
                <Phone className="h-5 w-5" /> 8110806339
              </Button>
            </a>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-base">
                Send Enquiry
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6 italic font-medium">"Your Journey, Our Responsibility"</p>
        </div>
      </section>
    </div>
  );
}
