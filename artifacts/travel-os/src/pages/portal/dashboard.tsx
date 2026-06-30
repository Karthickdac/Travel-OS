import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Star, Headphones, MapPin, ArrowRight, Calendar, Plus } from "lucide-react";

type Booking = {
  id: string; bookingNumber: string; type: string; status: string;
  pickupDate: string; pickupLocation: string; dropLocation: string;
  customerName: string; amount: number; createdAt: string;
};

type Ticket = { id: string; status: string };

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

export default function PortalDashboard() {
  const { user } = useAuth();

  const { data: bookingsRaw, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/v1/portal/bookings"],
    queryFn: () => api.get<any>("/portal/bookings"),
  });

  const { data: ticketsRaw } = useQuery({
    queryKey: ["/v1/portal/support"],
    queryFn: () => api.get<any>("/portal/support"),
  });

  const { data: profile } = useQuery({
    queryKey: ["/v1/portal/profile"],
    queryFn: () => api.get<any>("/portal/profile"),
    retry: false,
  });

  const bookings = asArray<Booking>(bookingsRaw);
  const tickets = asArray<Ticket>(ticketsRaw);
  const openTickets = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;
  const loyaltyPoints = (profile as any)?.loyaltyPoints ?? (user as any)?.loyaltyPoints ?? 0;

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, cls: "text-blue-600" },
    { label: "Loyalty Points", value: loyaltyPoints.toLocaleString("en-IN"), icon: Star, cls: "text-amber-600" },
    { label: "Open Tickets", value: openTickets, icon: Headphones, cls: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your trips and account.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.cls}`} />
            </CardHeader>
            <CardContent><p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link href="/portal/bookings">
              <Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : !recent.length ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No bookings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your trips will appear here once booked.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{b.bookingNumber}</span>
                        <Badge variant="outline" className={STATUS_COLORS[b.status] ?? ""}>{b.status?.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm font-medium flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {b.pickupLocation} → {b.dropLocation}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(b.pickupDate).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">₹{Number(b.amount).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/portal/bookings">
              <Button variant="outline" className="w-full justify-start gap-2"><CalendarCheck className="h-4 w-4" /> View My Bookings</Button>
            </Link>
            <Link href="/portal/support">
              <Button variant="outline" className="w-full justify-start gap-2"><Headphones className="h-4 w-4" /> Get Support</Button>
            </Link>
            <Link href="/portal/support">
              <Button variant="outline" className="w-full justify-start gap-2"><Plus className="h-4 w-4" /> Raise a Ticket</Button>
            </Link>
            <Link href="/packages">
              <Button className="w-full justify-start gap-2"><MapPin className="h-4 w-4" /> Explore Packages</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
