import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Search, Car, CircleDollarSign } from "lucide-react";

type Booking = {
  id: string; bookingNumber: string; type: string; status: string;
  pickupDate: string; pickupLocation: string; dropLocation: string;
  customerName: string; customerPhone?: string | null; amount: number; advancePaid: number;
  driverName?: string | null; vehicleNumber?: string | null; vehicleCategory?: string | null;
  notes?: string | null; createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  enquiry: "bg-gray-100 text-gray-700 border-gray-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function asArray<T>(d: any): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d.data)) return d.data as T[];
  return [];
}

export default function PortalBookings() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["/v1/portal/bookings"],
    queryFn: () => api.get<any>("/portal/bookings"),
  });

  const all = asArray<Booking>(raw);
  const counts = {
    all: all.length,
    upcoming: all.filter((b) => ["enquiry", "confirmed", "assigned", "in_progress"].includes(b.status)).length,
    completed: all.filter((b) => b.status === "completed").length,
    cancelled: all.filter((b) => b.status === "cancelled").length,
  };

  const filtered = all
    .filter((b) => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        b.bookingNumber?.toLowerCase().includes(s) ||
        b.pickupLocation?.toLowerCase().includes(s) ||
        b.dropLocation?.toLowerCase().includes(s);
      const matchTab =
        tab === "all" ||
        (tab === "upcoming" && ["enquiry", "confirmed", "assigned", "in_progress"].includes(b.status)) ||
        (tab === "completed" && b.status === "completed") ||
        (tab === "cancelled" && b.status === "cancelled");
      return matchSearch && matchTab;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">View and track all your trips with us.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bookings…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : !filtered.length ? (
            <Card className="text-center py-16">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No bookings found</p>
                <p className="text-sm text-muted-foreground mt-1">Your trips will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((b) => (
                <Card key={b.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-mono">{b.bookingNumber}</CardTitle>
                        <Badge variant="outline" className={STATUS_COLORS[b.status] ?? ""}>{b.status?.replace("_", " ")}</Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{b.type?.replace("_", " ")}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(b.pickupDate).toLocaleString("en-IN")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{b.pickupLocation} → {b.dropLocation}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Route</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Car className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{b.vehicleNumber || b.vehicleCategory || "To be assigned"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.driverName ? `Driver: ${b.driverName}` : "Vehicle / Driver"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">₹{Number(b.amount).toLocaleString("en-IN")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Advance ₹{Number(b.advancePaid ?? 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>
                    {b.notes && <p className="text-sm text-muted-foreground mt-3 border-t border-border pt-3">{b.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
