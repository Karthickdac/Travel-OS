import { useGetPublicPackages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowRight, Plane, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicHome() {
  const { data: packages, isLoading } = useGetPublicPackages();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] z-0" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] z-0" />
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Discover the world with us
          </div>
          
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-foreground mb-6">
            Journey beyond the <span className="text-primary">ordinary</span>.
          </h1>
          
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl mb-10">
            Curated travel experiences, luxury transport, and unforgettable adventures designed just for you. Your next great story starts here.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/packages">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full">
                Explore Packages <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-border">
                Plan Custom Trip
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Experiences</h2>
              <p className="text-muted-foreground">Handpicked destinations for your next escape.</p>
            </div>
            <Link href="/packages">
              <Button variant="ghost" className="mt-4 md:mt-0 text-primary">
                View all packages <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5 mt-2" /></CardContent>
                </Card>
              ))
            ) : packages?.length ? (
              packages.slice(0, 3).map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {pkg.imageUrl ? (
                      <img src={pkg.imageUrl} alt={pkg.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground/30">
                        <Plane className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {pkg.packageType}
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        <MapPin className="h-3 w-3 mr-1" /> {pkg.destinationName}
                      </div>
                      {pkg.rating && (
                        <div className="flex items-center text-sm font-medium text-amber-500">
                          <Star className="h-3 w-3 mr-1 fill-current" /> {pkg.rating}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">{pkg.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {pkg.description || "Experience the best this destination has to offer with our carefully crafted itinerary."}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-primary" /> {pkg.duration} Days
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/50 mt-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Starting from</span>
                      <span className="text-xl font-bold">${pkg.price}</span>
                    </div>
                    <Link href={`/packages/${pkg.id}`}>
                      <Button size="sm" className="rounded-full">Details</Button>
                    </Link>
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
    </div>
  );
}
