import { useState, useMemo } from "react";
import { useListVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, VehicleStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Car, Fuel, Users, Plus, Search, Pencil, Trash2, AlertCircle,
  CheckCircle2, Wrench, ShieldAlert, Calendar, LayoutGrid, List,
  Clock, AlertTriangle, Bus, Truck,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  on_trip:   { label: "On Trip",   cls: "bg-blue-100 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  maintenance:{ label: "Maintenance", cls: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-500" },
  off_road:  { label: "Off Road",  cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  sedan:    <Car className="h-5 w-5" />,
  suv:      <Car className="h-5 w-5" />,
  luxury:   <Car className="h-5 w-5" />,
  tempo:    <Truck className="h-5 w-5" />,
  van:      <Truck className="h-5 w-5" />,
  bus:      <Bus className="h-5 w-5" />,
  mini_bus: <Bus className="h-5 w-5" />,
};

const CATEGORIES = ["sedan", "suv", "tempo", "bus", "van", "luxury", "mini_bus"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "cng", "hybrid"];

const BLANK = {
  registrationNumber: "", make: "", model: "",
  year: new Date().getFullYear().toString(),
  color: "", categoryId: "sedan", fuelType: "petrol",
  seatingCapacity: "4", insuranceExpiry: "", lastService: "",
};

function expiryStatus(dateStr?: string | null): { label: string; cls: string; icon: React.ReactNode; days: number } | null {
  if (!dateStr) return null;
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0)  return { label: `Expired ${Math.abs(days)}d ago`, cls: "text-red-600 bg-red-50 border-red-200", icon: <AlertCircle className="h-3 w-3" />, days };
  if (days <= 30) return { label: `Expires in ${days}d`, cls: "text-amber-600 bg-amber-50 border-amber-200", icon: <AlertTriangle className="h-3 w-3" />, days };
  return { label: `Valid until ${format(parseISO(dateStr), "dd MMM yyyy")}`, cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" />, days };
}

function serviceStatus(dateStr?: string | null): { label: string; cls: string; days: number } | null {
  if (!dateStr) return null;
  const days = differenceInDays(new Date(), parseISO(dateStr));
  if (days > 180) return { label: `${days}d since service — Overdue!`, cls: "text-red-600", days };
  if (days > 90)  return { label: `${days}d since last service`, cls: "text-amber-600", days };
  return { label: `Serviced ${days}d ago`, cls: "text-emerald-600", days };
}

function VehicleCard({ v, onEdit, onDelete, onStatusChange }: { v: any; onEdit: () => void; onDelete: () => void; onStatusChange: (status: string) => void }) {
  const meta = STATUS_META[v.status] ?? STATUS_META.off_road;
  const insurance = expiryStatus(v.insuranceExpiry);
  const service = serviceStatus(v.lastService);
  const Icon = CATEGORY_ICONS[v.category] ?? <Car className="h-5 w-5" />;
  const hasAlert = (insurance && insurance.days < 30) || (service && service.days > 180);

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all ${hasAlert ? "border-amber-200" : ""}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${meta.cls.split(" ")[0]} ${meta.cls.split(" ")[1]}`}>
              {Icon}
            </div>
            <div>
              <p className="font-bold text-sm">{v.make} {v.model}</p>
              <p className="text-xs text-muted-foreground font-mono">{v.registrationNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <span className={`text-xs font-medium border px-1.5 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.year}</span>
          {v.fuelType && <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuelType}</span>}
          {v.seatingCapacity && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{v.seatingCapacity} seats</span>}
          {v.color && <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: v.color.toLowerCase() }} />
            {v.color}
          </span>}
          {v.category && <span className="capitalize col-span-2 flex items-center gap-1"><Car className="h-3 w-3" />{v.category.replace("_", " ")}</span>}
          {v.driverName && <span className="col-span-2 text-foreground font-medium">Driver: {v.driverName}</span>}
        </div>

        {/* Document / Service alerts */}
        <div className="space-y-1.5 mb-3">
          {insurance && (
            <div className={`flex items-center gap-1.5 text-xs font-medium border rounded px-2 py-1 ${insurance.cls}`}>
              <ShieldAlert className="h-3 w-3 flex-shrink-0" />
              <span>Insurance: {insurance.label}</span>
            </div>
          )}
          {service && (
            <div className={`flex items-center gap-1.5 text-xs ${service.cls}`}>
              <Wrench className="h-3 w-3 flex-shrink-0" />
              <span>{service.label}</span>
            </div>
          )}
        </div>

        {/* Quick status change */}
        <div className="flex gap-1 flex-wrap mb-2">
          {Object.entries(STATUS_META).map(([s, m]) => s !== v.status && (
            <button key={s} onClick={() => onStatusChange(s)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-opacity opacity-60 hover:opacity-100 ${m.cls}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1 pt-2 border-t border-border/50 justify-end">
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 text-xs gap-1"><Pencil className="h-3 w-3" />Edit</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 text-xs gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Remove</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminFleet() {
  const { data: vehicles, isLoading } = useListVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editStatus, setEditStatus] = useState<VehicleStatus>(VehicleStatus.available);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/vehicles"] });

  const filtered = useMemo(() => (vehicles ?? []).filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !search || v.registrationNumber.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    const matchCat = catFilter === "all" || v.category === catFilter;
    return matchSearch && matchStatus && matchCat;
  }), [vehicles, search, statusFilter, catFilter]);

  const counts = useMemo(() => ({
    total: vehicles?.length ?? 0,
    available: (vehicles ?? []).filter(v => v.status === "available").length,
    on_trip: (vehicles ?? []).filter(v => v.status === "on_trip").length,
    maintenance: (vehicles ?? []).filter(v => v.status === "maintenance").length,
    alerts: (vehicles ?? []).filter(v => {
      const ins = expiryStatus(v.insuranceExpiry);
      const svc = serviceStatus(v.lastService);
      return (ins && ins.days < 30) || (svc && svc.days > 180);
    }).length,
  }), [vehicles]);

  const openCreate = () => { setForm(BLANK); setEditStatus(VehicleStatus.available); setDialog({ mode: "create", data: null }); };
  const openEdit = (v: any) => {
    setForm({
      registrationNumber: v.registrationNumber, make: v.make, model: v.model,
      year: String(v.year), color: v.color ?? "", categoryId: v.category,
      fuelType: v.fuelType ?? "petrol", seatingCapacity: String(v.seatingCapacity ?? 4),
      insuranceExpiry: v.insuranceExpiry ?? "", lastService: v.lastService ?? "",
    });
    setEditStatus(v.status);
    setDialog({ mode: "edit", data: v });
  };

  const handleSave = async () => {
    if (!form.registrationNumber || !form.make || !form.model) {
      toast({ title: "Registration, make, and model are required", variant: "destructive" });
      return;
    }
    try {
      if (dialog?.mode === "create") {
        await createVehicle.mutateAsync({ data: {
          registrationNumber: form.registrationNumber, make: form.make, model: form.model,
          year: parseInt(form.year) || new Date().getFullYear(),
          color: form.color || undefined, categoryId: form.categoryId,
          fuelType: form.fuelType || undefined,
          seatingCapacity: parseInt(form.seatingCapacity) || undefined,
          insuranceExpiry: form.insuranceExpiry || undefined,
        }});
        toast({ title: "Vehicle added to fleet" });
      } else {
        await updateVehicle.mutateAsync({ id: dialog!.data.id, data: {
          status: editStatus, color: form.color || undefined,
          fuelType: form.fuelType || undefined,
          lastService: form.lastService || undefined,
          insuranceExpiry: form.insuranceExpiry || undefined,
        }});
        toast({ title: "Vehicle updated" });
      }
      refresh();
      setDialog(null);
    } catch {
      toast({ title: "Failed to save vehicle", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from fleet?`)) return;
    try {
      await deleteVehicle.mutateAsync({ id });
      toast({ title: "Vehicle removed" });
      refresh();
    } catch {
      toast({ title: "Failed to remove vehicle", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateVehicle.mutateAsync({ id, data: { status } });
      toast({ title: `Status updated to ${status.replace("_", " ")}` });
      refresh();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Track vehicles, maintenance, and document expiry.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Vehicle</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total, cls: "bg-primary/10 text-primary", icon: <Car className="h-4 w-4" />, filter: "all" },
          { label: "Available", value: counts.available, cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" />, filter: "available" },
          { label: "On Trip", value: counts.on_trip, cls: "bg-blue-100 text-blue-700", icon: <Car className="h-4 w-4" />, filter: "on_trip" },
          { label: "Maintenance", value: counts.maintenance, cls: "bg-amber-100 text-amber-700", icon: <Wrench className="h-4 w-4" />, filter: "maintenance" },
          { label: "Need Attention", value: counts.alerts, cls: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-4 w-4" />, filter: "all" },
        ].map(s => (
          <Card key={s.label} className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === s.filter && s.filter !== "all" ? "ring-2 ring-primary" : ""}`} onClick={() => setStatusFilter(s.filter)}>
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.cls}`}>{s.icon}</div>
              <div><p className="text-xl font-black">{s.value}</p><p className="text-xs text-muted-foreground leading-none mt-0.5">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by reg, make, model…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="off_road">Off Road</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, x => x.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex border border-input rounded-md overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Tabs for sub-views */}
      <Tabs defaultValue="fleet">
        <TabsList>
          <TabsTrigger value="fleet">All Vehicles</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {counts.alerts > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{counts.alerts}</span>}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Log</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 w-full" />)}
            </div>
          ) : !filtered.length ? (
            <Card className="text-center py-16"><CardContent>
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{search || catFilter !== "all" ? "No vehicles match the filters" : "No vehicles added yet"}</p>
              {!search && catFilter === "all" && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Vehicle</Button>}
            </CardContent></Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(v => (
                <VehicleCard key={v.id} v={v}
                  onEdit={() => openEdit(v)}
                  onDelete={() => handleDelete(v.id, `${v.make} ${v.model}`)}
                  onStatusChange={(s) => handleStatusChange(v.id, s)}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <div className="divide-y divide-border">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                  <span>Vehicle</span><span>Category</span><span>Fuel / Seats</span><span>Status</span><span>Insurance</span><span></span>
                </div>
                {filtered.map(v => {
                  const meta = STATUS_META[v.status] ?? STATUS_META.off_road;
                  const ins = expiryStatus(v.insuranceExpiry);
                  return (
                    <div key={v.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                      <div>
                        <p className="font-semibold text-sm">{v.make} {v.model} <span className="text-muted-foreground font-normal">({v.year})</span></p>
                        <p className="text-xs font-mono text-muted-foreground">{v.registrationNumber}</p>
                      </div>
                      <span className="capitalize text-sm text-muted-foreground">{v.category?.replace("_", " ")}</span>
                      <span className="text-sm text-muted-foreground">{v.fuelType} / {v.seatingCapacity}s</span>
                      <Badge variant="outline" className={`text-xs w-fit ${meta.cls}`}>{meta.label}</Badge>
                      <span className={`text-xs ${ins ? (ins.days < 0 ? "text-red-600" : ins.days <= 30 ? "text-amber-600" : "text-emerald-600") : "text-muted-foreground"}`}>
                        {ins ? (ins.days < 0 ? "Expired" : `${ins.days}d`) : "—"}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(v)} className="h-7 w-7 p-0"><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id, `${v.make} ${v.model}`)} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-3">
            {(vehicles ?? []).filter(v => {
              const ins = expiryStatus(v.insuranceExpiry);
              const svc = serviceStatus(v.lastService);
              return (ins && ins.days < 30) || (svc && svc.days > 180);
            }).length === 0 ? (
              <Card className="text-center py-12"><CardContent>
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium">All documents are up to date</p>
                <p className="text-sm text-muted-foreground mt-1">No vehicles need immediate attention.</p>
              </CardContent></Card>
            ) : (vehicles ?? []).filter(v => {
              const ins = expiryStatus(v.insuranceExpiry);
              const svc = serviceStatus(v.lastService);
              return (ins && ins.days < 30) || (svc && svc.days > 180);
            }).map(v => {
              const ins = expiryStatus(v.insuranceExpiry);
              const svc = serviceStatus(v.lastService);
              return (
                <Card key={v.id} className="shadow-sm border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{v.make} {v.model} <span className="text-muted-foreground font-normal font-mono text-sm">— {v.registrationNumber}</span></p>
                        <div className="mt-1.5 space-y-1">
                          {ins && ins.days < 30 && (
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${ins.days < 0 ? "text-red-600" : "text-amber-600"}`}>
                              <ShieldAlert className="h-3 w-3" />Insurance: {ins.label}
                            </div>
                          )}
                          {svc && svc.days > 180 && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                              <Wrench className="h-3 w-3" />Service overdue: {svc.label}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEdit(v)} className="h-7 text-xs gap-1 flex-shrink-0"><Pencil className="h-3 w-3" />Update</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="space-y-3">
            {(vehicles ?? []).filter(v => v.status === "maintenance" || v.lastService).length === 0 ? (
              <Card className="text-center py-12"><CardContent>
                <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No maintenance records yet</p>
                <p className="text-sm text-muted-foreground mt-1">Set a vehicle to maintenance status or record last service dates.</p>
              </CardContent></Card>
            ) : (
              <>
                {(vehicles ?? []).filter(v => v.status === "maintenance").length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5"><Wrench className="h-4 w-4" />Currently in Maintenance</h3>
                    <div className="space-y-2">
                      {(vehicles ?? []).filter(v => v.status === "maintenance").map(v => (
                        <Card key={v.id} className="border-amber-200 shadow-sm">
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Wrench className="h-4 w-4" /></div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{v.make} {v.model}</p>
                              <p className="text-xs text-muted-foreground font-mono">{v.registrationNumber}</p>
                            </div>
                            {v.lastService && <div className="text-xs text-right text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />Last serviced: {format(parseISO(v.lastService), "dd MMM yyyy")}</div>}
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(v.id, "available")} className="h-7 text-xs gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" />Mark Ready</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Service History</h3>
                  <Card className="shadow-sm">
                    <div className="divide-y divide-border">
                      {(vehicles ?? []).filter(v => v.lastService).sort((a, b) => (b.lastService ?? "").localeCompare(a.lastService ?? "")).map(v => {
                        const svc = serviceStatus(v.lastService);
                        return (
                          <div key={v.id} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Wrench className="h-4 w-4 text-muted-foreground" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{v.make} {v.model} <span className="text-muted-foreground font-mono text-xs">— {v.registrationNumber}</span></p>
                              {v.lastService && <p className="text-xs text-muted-foreground">{format(parseISO(v.lastService), "dd MMMM yyyy")}</p>}
                            </div>
                            {svc && <span className={`text-xs font-medium ${svc.cls}`}>{svc.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Add Vehicle to Fleet" : `Edit — ${dialog?.data?.registrationNumber}`}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Registration Number *</Label>
              <Input value={form.registrationNumber} onChange={setF("registrationNumber")} placeholder="TN58 AB 1234" className="font-mono" disabled={dialog?.mode === "edit"} />
            </div>
            <div className="space-y-1.5"><Label>Make *</Label><Input value={form.make} onChange={setF("make")} placeholder="Toyota" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Model *</Label><Input value={form.model} onChange={setF("model")} placeholder="Innova Crysta" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={setF("year")} placeholder="2022" disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Color</Label><Input value={form.color} onChange={setF("color")} placeholder="White" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))} disabled={dialog?.mode === "edit"}>
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
            <div className="space-y-1.5"><Label>Seating Capacity</Label><Input type="number" value={form.seatingCapacity} onChange={setF("seatingCapacity")} disabled={dialog?.mode === "edit"} /></div>
            <div className="space-y-1.5"><Label>Insurance Expiry</Label><Input type="date" value={form.insuranceExpiry} onChange={setF("insuranceExpiry")} /></div>
            <div className="space-y-1.5"><Label>Last Service Date</Label><Input type="date" value={form.lastService} onChange={setF("lastService")} /></div>
            {dialog?.mode === "edit" && (
              <div className="col-span-2 space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">✅ Available</SelectItem>
                    <SelectItem value="on_trip">🚗 On Trip</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                    <SelectItem value="off_road">⛔ Off Road</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createVehicle.isPending || updateVehicle.isPending}>
                {dialog?.mode === "create" ? "Add to Fleet" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
