import { useState } from "react";
import { useListVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, VehicleStatus } from "@workspace/api-client-react";
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
import { Car, Fuel, Users, Plus, Search, Pencil, Trash2, AlertCircle, CheckCircle2, Wrench } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  on_trip: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  off_road: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  available: <CheckCircle2 className="h-3 w-3" />,
  on_trip: <Car className="h-3 w-3" />,
  maintenance: <Wrench className="h-3 w-3" />,
  off_road: <AlertCircle className="h-3 w-3" />,
};

const BLANK = { registrationNumber: "", make: "", model: "", year: new Date().getFullYear().toString(), color: "", categoryId: "sedan", fuelType: "petrol", seatingCapacity: "4", insuranceExpiry: "" };

const CATEGORIES = ["sedan", "suv", "tempo", "bus", "van", "luxury", "mini_bus"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "cng", "hybrid"];

export default function AdminFleet() {
  const { data: vehicles, isLoading } = useListVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editStatus, setEditStatus] = useState<VehicleStatus>(VehicleStatus.available);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/vehicles"] });

  const filtered = (vehicles ?? []).filter(v => {
    const q = search.toLowerCase();
    const matchesSearch = !search || v.registrationNumber.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => { setForm(BLANK); setEditStatus(VehicleStatus.available); setDialog({ mode: "create", data: null }); };
  const openEdit = (v: any) => {
    setForm({
      registrationNumber: v.registrationNumber, make: v.make, model: v.model, year: String(v.year),
      color: v.color ?? "", categoryId: v.category, fuelType: v.fuelType ?? "petrol",
      seatingCapacity: String(v.seatingCapacity ?? 4), insuranceExpiry: v.insuranceExpiry ?? "",
    });
    setEditStatus(v.status);
    setDialog({ mode: "edit", data: v });
  };

  const handleSave = async () => {
    if (!form.registrationNumber || !form.make || !form.model) {
      toast({ title: "Registration, make, and model are required", variant: "destructive" });
      return;
    }
    const payload = {
      registrationNumber: form.registrationNumber,
      make: form.make,
      model: form.model,
      year: parseInt(form.year) || new Date().getFullYear(),
      color: form.color || undefined,
      categoryId: form.categoryId,
      fuelType: form.fuelType || undefined,
      seatingCapacity: parseInt(form.seatingCapacity) || undefined,
      insuranceExpiry: form.insuranceExpiry || undefined,
    };
    try {
      if (dialog?.mode === "create") {
        await createVehicle.mutateAsync({ data: payload });
        toast({ title: "Vehicle added" });
      } else {
        await updateVehicle.mutateAsync({ id: dialog!.data.id, data: { ...payload, status: editStatus } });
        toast({ title: "Vehicle updated" });
      }
      refresh();
      setDialog(null);
    } catch {
      toast({ title: "Failed to save vehicle", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove vehicle "${name}"?`)) return;
    try {
      await deleteVehicle.mutateAsync({ id });
      toast({ title: "Vehicle removed" });
      refresh();
    } catch {
      toast({ title: "Failed to delete vehicle", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const counts = {
    total: vehicles?.length ?? 0,
    available: (vehicles ?? []).filter(v => v.status === "available").length,
    on_trip: (vehicles ?? []).filter(v => v.status === "on_trip").length,
    maintenance: (vehicles ?? []).filter(v => v.status === "maintenance").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet & Vehicles</h1>
          <p className="text-muted-foreground mt-1">Manage your vehicle fleet and availability.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Vehicle</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, cls: "bg-primary/10 text-primary", icon: <Car className="h-4 w-4" /> },
          { label: "Available", value: counts.available, cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "On Trip", value: counts.on_trip, cls: "bg-blue-100 text-blue-700", icon: <Car className="h-4 w-4" /> },
          { label: "Maintenance", value: counts.maintenance, cls: "bg-amber-100 text-amber-700", icon: <Wrench className="h-4 w-4" /> },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.cls}`}>{s.icon}</div>
              <div><p className="text-xl font-black">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vehicle…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="off_road">Off Road</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No vehicles match" : "No vehicles added yet"}</p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Vehicle</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(v => (
            <Card key={v.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={`text-xs gap-1 ${STATUS_COLORS[v.status] ?? ""}`}>
                    {STATUS_ICONS[v.status]}{v.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="font-semibold text-sm mt-2">{v.make} {v.model} <span className="text-muted-foreground font-normal">({v.year})</span></p>
                <p className="text-xs font-mono text-muted-foreground">{v.registrationNumber}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {v.fuelType && <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuelType}</span>}
                  {v.seatingCapacity && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{v.seatingCapacity} seats</span>}
                  {v.color && <span>{v.color}</span>}
                </div>
                {v.driverName && <p className="text-xs text-muted-foreground mt-1">Driver: <span className="text-foreground">{v.driverName}</span></p>}
                <div className="flex gap-1 mt-3 pt-3 border-t border-border/50 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(v)} className="h-7 text-xs gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id, `${v.make} ${v.model}`)} className="h-7 text-xs gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Add Vehicle" : "Edit Vehicle"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Registration Number *</Label><Input value={form.registrationNumber} onChange={setF("registrationNumber")} placeholder="TN58 AB 1234" className="font-mono" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Make *</Label><Input value={form.make} onChange={setF("make")} placeholder="Toyota" /></div>
            <div className="space-y-1.5"><Label>Model *</Label><Input value={form.model} onChange={setF("model")} placeholder="Innova" /></div>
            <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={setF("year")} placeholder="2022" /></div>
            <div className="space-y-1.5"><Label>Color</Label><Input value={form.color} onChange={setF("color")} placeholder="White" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, x => x.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={v => setForm(f => ({ ...f, fuelType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Seating Capacity</Label><Input type="number" value={form.seatingCapacity} onChange={setF("seatingCapacity")} placeholder="7" /></div>
            <div className="space-y-1.5"><Label>Insurance Expiry</Label><Input type="date" value={form.insuranceExpiry} onChange={setF("insuranceExpiry")} /></div>
            {dialog?.mode === "edit" && (
              <div className="col-span-2 space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_trip">On Trip</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="off_road">Off Road</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createVehicle.isPending || updateVehicle.isPending}>
                {dialog?.mode === "create" ? "Add Vehicle" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
