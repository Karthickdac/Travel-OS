import { useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Fuel, Users } from "lucide-react";

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  on_trip: "bg-blue-100 text-blue-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-700",
};

export default function AdminFleet() {
  const { data: vehicles, isLoading } = useListVehicles();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet & Vehicles</h1>
        <p className="text-muted-foreground mt-1">Manage your vehicle fleet.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : !vehicles?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No vehicles added</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {v.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
                <CardTitle className="mt-2">{v.make} {v.model}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{v.registrationNumber}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {v.seatingCapacity} seats</span>
                  <span className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5" /> {v.fuelType}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <span className="text-foreground font-medium">{v.category}</span>
                  <span>{v.year} · {v.color}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
