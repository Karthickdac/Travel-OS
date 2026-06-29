import { useListBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Phone, Car, CircleDollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  enquiry: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeLabel: Record<string, string> = {
  airport_transfer: "Airport Transfer",
  outstation: "Outstation",
  local_cab: "Local Cab",
  tour: "Tour",
  corporate: "Corporate",
};

export default function AdminBookings() {
  const { data: bookings, isLoading } = useListBookings();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">All trips and reservations.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : !bookings?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-muted-foreground text-sm mt-1">New bookings will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground">{b.bookingNumber}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {b.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                      {typeLabel[b.type] ?? b.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-lg">
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    ₹{Number(b.amount).toLocaleString()}
                  </div>
                </div>
                <CardTitle className="text-base">{b.customerName}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground pt-0">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{b.customerPhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{b.pickupDate ? format(new Date(b.pickupDate), "MMM d, yyyy HH:mm") : "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{b.pickupLocation} → {b.dropLocation}</span>
                </div>
                {(b.driverName || b.vehicleNumber) && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Car className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{[b.driverName, b.vehicleNumber].filter(Boolean).join(" · ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
