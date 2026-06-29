import { useListDrivers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Contact, Phone, Star, Activity } from "lucide-react";

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  on_trip: "bg-blue-100 text-blue-700",
  off_duty: "bg-gray-100 text-gray-700",
  suspended: "bg-red-100 text-red-700",
};

export default function AdminDrivers() {
  const { data: drivers, isLoading } = useListDrivers();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
        <p className="text-muted-foreground mt-1">Manage your driver workforce.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : !drivers?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Contact className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No drivers added</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {d.name.charAt(0)}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {d.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
                <CardTitle className="mt-2">{d.name}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{d.licenseNumber}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />{d.phone}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {d.rating ?? "N/A"}
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    {d.totalTrips ?? 0} trips
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
