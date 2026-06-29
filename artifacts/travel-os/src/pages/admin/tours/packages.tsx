import { useListTourPackages } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, MapPin, Clock, Star, CircleDollarSign } from "lucide-react";

export default function AdminPackages() {
  const { data: packages, isLoading } = useListTourPackages();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tour Packages</h1>
        <p className="text-muted-foreground mt-1">Manage and publish your travel packages.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : !packages?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No packages created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 flex items-center justify-center relative">
                <Package className="h-10 w-10 text-primary/30" />
                {pkg.isActive && (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Live</span>
                )}
                {pkg.packageType && (
                  <span className="absolute top-3 left-3 bg-white/80 text-xs font-medium px-2 py-0.5 rounded-full text-foreground capitalize">{pkg.packageType}</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">{pkg.title}</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{pkg.destinationName}
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />{pkg.duration}N
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {pkg.description && <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                      ₹{Number(pkg.price).toLocaleString()}
                    </div>
                    {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                      <div className="text-xs text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="text-right">
                    {pkg.rating && (
                      <div className="flex items-center gap-1 text-sm text-amber-600 font-semibold justify-end">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {pkg.rating}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{pkg.totalBookings ?? 0} bookings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
