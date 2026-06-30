import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Mail, MapPin, Award, Wallet, CalendarClock, Search, Users, Package } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  totalBookings?: number;
  totalSpent?: string | number;
  loyaltyPoints?: number;
  lastBookingDate?: string | null;
  photoUrl?: string | null;
};

type Booking = {
  id: string;
  bookingNumber: string;
  type?: string;
  status?: string;
  pickupDate?: string;
  pickupLocation?: string;
  dropLocation?: string;
  customerName?: string;
  customerPhone?: string | null;
  customerId?: string | null;
  amount?: string | number;
};

const STATUS_COLORS: Record<string, string> = {
  enquiry: "bg-gray-100 text-gray-700 border-gray-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  ongoing: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function inr(v?: string | number) {
  const n = Number(v ?? 0);
  return "₹" + (isNaN(n) ? 0 : n).toLocaleString("en-IN");
}

export default function AdminCustomerProfile() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/v1/customers"],
    queryFn: () => api.get("/customers"),
  });

  const { data: bookingsRaw } = useQuery<any>({
    queryKey: ["/v1/bookings"],
    queryFn: () => api.get("/bookings"),
  });

  const allBookings: Booking[] = Array.isArray(bookingsRaw) ? bookingsRaw : (bookingsRaw?.data ?? []);

  const selected = (customers ?? []).find((c) => c.id === selectedId) ?? null;

  const customerBookings = selected
    ? allBookings.filter((b) => b.customerId === selected.id || (b.customerPhone && selected.phone && b.customerPhone === selected.phone) || (b.customerName && b.customerName.toLowerCase() === selected.name.toLowerCase()))
    : [];

  const filtered = (customers ?? []).filter((c) => {
    const q = search.toLowerCase();
    return !search || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer 360</h1>
        <p className="text-muted-foreground mt-1">Select a customer to view their full profile and history.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customers</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !filtered.length ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No customers found</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto divide-y">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${selectedId === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile detail */}
        <div className="lg:col-span-2 space-y-6">
          {!selected ? (
            <Card className="text-center py-20 shadow-sm">
              <CardContent className="pt-6">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No customer selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose a customer from the list to view their profile.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header card */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl flex-shrink-0">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold">{selected.name}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{selected.phone}</span>
                        {selected.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{selected.email}</span>}
                        {selected.city && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Bookings", value: selected.totalBookings ?? customerBookings.length, cls: "bg-blue-100 text-blue-700", icon: <Package className="h-4 w-4" /> },
                  { label: "Total Spent", value: inr(selected.totalSpent), cls: "bg-emerald-100 text-emerald-700", icon: <Wallet className="h-4 w-4" /> },
                  { label: "Loyalty Points", value: selected.loyaltyPoints ?? 0, cls: "bg-amber-100 text-amber-700", icon: <Award className="h-4 w-4" /> },
                  { label: "Last Booking", value: selected.lastBookingDate ? new Date(selected.lastBookingDate).toLocaleDateString() : "—", cls: "bg-purple-100 text-purple-700", icon: <CalendarClock className="h-4 w-4" /> },
                ].map((s) => (
                  <Card key={s.label} className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.cls}`}>{s.icon}</div>
                      <div className="min-w-0"><p className="text-lg font-black truncate">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bookings history */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                  {!customerBookings.length ? (
                    <div className="text-center py-10">
                      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No bookings found for this customer.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerBookings.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 border rounded-lg p-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{b.bookingNumber}</p>
                              {b.status && <Badge variant="outline" className={`text-xs ${STATUS_COLORS[b.status] ?? ""}`}>{b.status}</Badge>}
                              {b.type && <span className="text-xs text-muted-foreground">{b.type.replace(/_/g, " ")}</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                              {b.pickupDate && <span>{new Date(b.pickupDate).toLocaleDateString()}</span>}
                              {(b.pickupLocation || b.dropLocation) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.pickupLocation} → {b.dropLocation}</span>}
                            </div>
                          </div>
                          <p className="font-semibold text-sm">{inr(b.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
