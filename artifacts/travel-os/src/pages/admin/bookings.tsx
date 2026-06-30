import { useState } from "react";
import {
  useListBookings, useCreateBooking, useUpdateBooking, useAssignBooking,
  useListDrivers, useListVehicles,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Phone, Car, CircleDollarSign, Plus, UserCheck, Filter, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  enquiry: "bg-gray-100 text-gray-700 border-gray-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const TRIP_TYPES = [
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "outstation", label: "Outstation" },
  { value: "local_cab", label: "Local Cab" },
  { value: "tour", label: "Tour" },
  { value: "corporate", label: "Corporate" },
];

const STATUS_OPTIONS = ["enquiry", "confirmed", "in_progress", "completed", "cancelled"];

const BLANK_FORM = {
  type: "outstation",
  customerName: "",
  customerPhone: "",
  pickupDate: new Date().toISOString().slice(0, 16),
  pickupLocation: "",
  dropLocation: "",
  amount: "",
  advancePaid: "",
  notes: "",
};

export default function AdminBookings() {
  const { data: bookings, isLoading } = useListBookings();
  const { data: drivers } = useListDrivers();
  const { data: vehicles } = useListVehicles();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const assignBooking = useAssignBooking();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ driverId: "", vehicleId: "" });
  const [form, setForm] = useState(BLANK_FORM);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/bookings"] });

  const filteredBookings = (bookings?.data ?? []).filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || b.customerName?.toLowerCase().includes(q)
      || b.bookingNumber?.toLowerCase().includes(q)
      || b.pickupLocation?.toLowerCase().includes(q)
      || b.dropLocation?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.customerName || !form.pickupLocation || !form.dropLocation || !form.amount) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      await createBooking.mutateAsync({
        data: {
          type: form.type,
          customerName: form.customerName,
          customerPhone: form.customerPhone || undefined,
          pickupDate: form.pickupDate,
          pickupLocation: form.pickupLocation,
          dropLocation: form.dropLocation,
          amount: Number(form.amount),
          advancePaid: form.advancePaid ? Number(form.advancePaid) : undefined,
          notes: form.notes || undefined,
        },
      });
      toast({ title: "Booking created" });
      refresh();
      setShowCreate(false);
      setForm(BLANK_FORM);
    } catch {
      toast({ title: "Failed to create booking", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateBooking.mutateAsync({ id, data: { status } });
      toast({ title: `Status updated to ${status}` });
      refresh();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignForm.driverId || !assignForm.vehicleId) {
      toast({ title: "Select both driver and vehicle", variant: "destructive" });
      return;
    }
    try {
      await assignBooking.mutateAsync({ id: assignTarget, data: assignForm });
      toast({ title: "Driver and vehicle assigned" });
      refresh();
      setAssignTarget(null);
      setAssignForm({ driverId: "", vehicleId: "" });
    } catch {
      toast({ title: "Failed to assign", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const totalRevenue = (bookings?.data ?? [])
    .filter(b => b.status === "completed")
    .reduce((s, b) => s + Number(b.amount ?? 0), 0);

  const counts = {
    total: bookings?.data?.length ?? 0,
    confirmed: bookings?.data?.filter(b => b.status === "confirmed").length ?? 0,
    inProgress: bookings?.data?.filter(b => b.status === "in_progress").length ?? 0,
    completed: bookings?.data?.filter(b => b.status === "completed").length ?? 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage all trips and reservations.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />New Booking
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Confirmed", value: counts.confirmed, color: "text-blue-600" },
          { label: "In Progress", value: counts.inProgress, color: "text-amber-600" },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "text-emerald-600" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, booking #, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : !filteredBookings.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search || statusFilter !== "all" ? "No matching bookings" : "No bookings yet"}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first booking to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(b => (
            <Card key={b.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{b.bookingNumber}</span>
                    <Badge variant="outline" className={STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-700"}>
                      {b.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                    <span className="text-xs border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      {TRIP_TYPES.find(t => t.value === b.type)?.label ?? b.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status selector */}
                    <select
                      value={b.status}
                      onChange={e => handleStatusChange(b.id, e.target.value)}
                      className="border border-input rounded-md px-2 py-1 text-xs bg-background"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                    {/* Assign driver/vehicle */}
                    {(b.status === "confirmed" || b.status === "in_progress") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setAssignTarget(b.id); setAssignForm({ driverId: "", vehicleId: "" }); }}
                        className="gap-1 text-xs h-7"
                      >
                        <UserCheck className="h-3 w-3" />Assign
                      </Button>
                    )}
                    <div className="flex items-center gap-1 font-black text-primary">
                      <CircleDollarSign className="h-4 w-4" />
                      ₹{Number(b.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-base">{b.customerName}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground pt-0">
                {b.customerPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <a href={`tel:${b.customerPhone}`} className="hover:text-foreground">{b.customerPhone}</a>
                  </div>
                )}
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
                {b.advancePaid && Number(b.advancePaid) > 0 && (
                  <div className="text-xs">
                    Advance: <span className="font-semibold text-emerald-600">₹{Number(b.advancePaid).toLocaleString()}</span>
                    <span className="text-muted-foreground"> / Balance: ₹{(Number(b.amount) - Number(b.advancePaid)).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Booking Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Trip Type</Label>
                <select value={form.type} onChange={setF("type")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                  {TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={setF("customerName")} placeholder="Customer name" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.customerPhone} onChange={setF("customerPhone")} placeholder="9876543210" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Pickup Date & Time *</Label>
                <Input type="datetime-local" value={form.pickupDate} onChange={setF("pickupDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>Pickup Location *</Label>
                <Input value={form.pickupLocation} onChange={setF("pickupLocation")} placeholder="e.g. Madurai Railway Station" />
              </div>
              <div className="space-y-1.5">
                <Label>Drop Location *</Label>
                <Input value={form.dropLocation} onChange={setF("dropLocation")} placeholder="e.g. Rameswaram" />
              </div>
              <div className="space-y-1.5">
                <Label>Total Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={setF("amount")} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Advance Paid (₹)</Label>
                <Input type="number" value={form.advancePaid} onChange={setF("advancePaid")} placeholder="0" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={setF("notes")}
                  rows={2}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
                  placeholder="Special instructions, preferences…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createBooking.isPending}>
                {createBooking.isPending ? "Creating…" : "Create Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver/Vehicle Dialog */}
      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Driver & Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Driver</Label>
              <select
                value={assignForm.driverId}
                onChange={e => setAssignForm(f => ({ ...f, driverId: e.target.value }))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Select driver…</option>
                {(drivers ?? [])
                  .filter(d => d.status === "available")
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <select
                value={assignForm.vehicleId}
                onChange={e => setAssignForm(f => ({ ...f, vehicleId: e.target.value }))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Select vehicle…</option>
                {(vehicles ?? [])
                  .filter(v => v.status === "available")
                  .map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={!assignForm.driverId || !assignForm.vehicleId || assignBooking.isPending}
              >
                {assignBooking.isPending ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
