import { useState } from "react";
import { useListDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver, DriverStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Contact, Phone, Star, Plus, Search, Pencil, Trash2, IdCard,
  UserCheck, Car, AlertCircle, Users,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  on_trip: "bg-blue-100 text-blue-700 border-blue-200",
  off_duty: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  available: <UserCheck className="h-3 w-3" />,
  on_trip: <Car className="h-3 w-3" />,
  off_duty: <AlertCircle className="h-3 w-3" />,
  suspended: <AlertCircle className="h-3 w-3" />,
};

const BLANK = { name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "" };

export default function AdminDrivers() {
  const { data: drivers, isLoading } = useListDrivers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editStatus, setEditStatus] = useState<DriverStatus>(DriverStatus.available);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/drivers"] });

  const filtered = (drivers ?? []).filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = !search || d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.licenseNumber.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => { setForm(BLANK); setEditStatus(DriverStatus.available); setDialog({ mode: "create", data: null }); };
  const openEdit = (d: any) => {
    setForm({ name: d.name, phone: d.phone, email: d.email ?? "", licenseNumber: d.licenseNumber, licenseExpiry: d.licenseExpiry ?? "" });
    setEditStatus(d.status);
    setDialog({ mode: "edit", data: d });
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.licenseNumber) {
      toast({ title: "Name, phone, and license number are required", variant: "destructive" });
      return;
    }
    try {
      if (dialog?.mode === "create") {
        await createDriver.mutateAsync({ data: { name: form.name, phone: form.phone, email: form.email || undefined, licenseNumber: form.licenseNumber, licenseExpiry: form.licenseExpiry || undefined } });
        toast({ title: "Driver added" });
      } else {
        await updateDriver.mutateAsync({ id: dialog!.data.id, data: { licenseExpiry: form.licenseExpiry || undefined, status: editStatus } });
        toast({ title: "Driver updated" });
      }
      refresh();
      setDialog(null);
    } catch {
      toast({ title: "Failed to save driver", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove driver "${name}"?`)) return;
    try {
      await deleteDriver.mutateAsync({ id });
      toast({ title: "Driver removed" });
      refresh();
    } catch {
      toast({ title: "Failed to delete driver", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const counts = { total: drivers?.length ?? 0, available: (drivers ?? []).filter(d => d.status === "available").length, on_trip: (drivers ?? []).filter(d => d.status === "on_trip").length };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage your driver workforce and availability.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Driver</Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Drivers", value: counts.total, color: "bg-primary/10 text-primary", icon: <Users className="h-4 w-4" /> },
          { label: "Available", value: counts.available, color: "bg-emerald-100 text-emerald-700", icon: <UserCheck className="h-4 w-4" /> },
          { label: "On Trip", value: counts.on_trip, color: "bg-blue-100 text-blue-700", icon: <Car className="h-4 w-4" /> },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <div><p className="text-xl font-black">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search driver…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="off_duty">Off Duty</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Contact className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No drivers match your search" : "No drivers added yet"}</p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Driver</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(d => (
            <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-base">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{d.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs gap-1 ${STATUS_COLORS[d.status] ?? ""}`}>
                    {STATUS_ICONS[d.status]}{d.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" />{d.licenseNumber}</p>
                  {d.rating && <p className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" />{d.rating.toFixed(1)} rating</p>}
                  {d.totalTrips !== undefined && <p className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />{d.totalTrips} trips</p>}
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-border/50 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(d)} className="h-7 text-xs gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id, d.name)} className="h-7 text-xs gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Add Driver" : "Edit Driver"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="Driver name" /></div>
            <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={setF("phone")} placeholder="9876543210" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={setF("email")} placeholder="driver@example.com" /></div>
            <div className="space-y-1.5"><Label>License Number *</Label><Input value={form.licenseNumber} onChange={setF("licenseNumber")} placeholder="TN01 20230001234" /></div>
            <div className="space-y-1.5"><Label>License Expiry</Label><Input type="date" value={form.licenseExpiry} onChange={setF("licenseExpiry")} /></div>
            {dialog?.mode === "edit" && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_trip">On Trip</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createDriver.isPending || updateDriver.isPending}>
                {dialog?.mode === "create" ? "Add Driver" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
