import { useListDestinations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Package } from "lucide-react";

export default function AdminDestinations() {
  const { data: destinations, isLoading } = useListDestinations();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Destinations</h1>
        <p className="text-muted-foreground mt-1">Manage travel destinations and locations.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : !destinations?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No destinations added</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map((d) => (
            <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Map className="h-10 w-10 text-primary/40" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{d.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{[d.state, d.country].filter(Boolean).join(", ")}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.description && <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>}
                {d.tags && d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {d.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border">
                  <Package className="h-3.5 w-3.5" />
                  <span>{d.totalPackages ?? 0} packages</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
