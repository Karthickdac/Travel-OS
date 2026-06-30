import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@workspace/api-client-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Phone, Mail, Pencil, Trash2, Star, Car, IndianRupee, Receipt } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

function VendorForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: initial?.name ?? "", contactName: initial?.contactName ?? "", phone: initial?.phone ?? "", email: initial?.email ?? "", gstNumber: initial?.gstNumber ?? "", commissionPercent: initial?.commissionPercent ?? "10", status: initial?.status ?? "active" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Company Name *</Label><Input value={form.name} onChange={set("name")} placeholder="City Cabs Co." /></div>
        <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contactName} onChange={set("contactName")} placeholder="John Doe" /></div>
        <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} placeholder="vendor@example.com" /></div>
        <div className="space-y-1.5"><Label>GST Number</Label><Input value={form.gstNumber} onChange={set("gstNumber")} placeholder="22AAAAA0000A1Z5" /></div>
        <div className="space-y-1.5"><Label>Commission (%)</Label><Input type="number" value={form.commissionPercent} onChange={set("commissionPercent")} min="0" max="50" /></div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, commissionPercent: Number(form.commissionPercent) })} disabled={!form.name || !form.phone}>{initial ? "Save Changes" : "Add Vendor"}</Button>
      </div>
    </div>
  );
}

function VehicleForm({ vendorId, initial, onSave, onCancel }: { vendorId: string; initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ vehicleMake: initial?.vehicleMake ?? "", vehicleModel: initial?.vehicleModel ?? "", vehicleNumber: initial?.vehicleNumber ?? "", category: initial?.category ?? "sedan", seatingCapacity: initial?.seatingCapacity ?? "4", ratePerKm: initial?.ratePerKm ?? "", ratePerDay: initial?.ratePerDay ?? "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Make *</Label><Input value={form.vehicleMake} onChange={set("vehicleMake")} placeholder="Toyota" /></div>
        <div className="space-y-1.5"><Label>Model *</Label><Input value={form.vehicleModel} onChange={set("vehicleModel")} placeholder="Innova Crysta" /></div>
        <div className="space-y-1.5"><Label>Vehicle Number *</Label><Input value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="TN01AB1234" /></div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="hatchback">Hatchback</SelectItem><SelectItem value="sedan">Sedan</SelectItem><SelectItem value="suv">SUV</SelectItem><SelectItem value="muv">MUV</SelectItem><SelectItem value="tempo">Tempo Traveller</SelectItem><SelectItem value="bus">Mini Bus</SelectItem><SelectItem value="luxury">Luxury</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Seating Capacity</Label><Input type="number" value={form.seatingCapacity} onChange={set("seatingCapacity")} min="2" max="50" /></div>
        <div className="space-y-1.5"><Label>Rate per KM (₹)</Label><Input type="number" value={form.ratePerKm} onChange={set("ratePerKm")} placeholder="18" /></div>
        <div className="space-y-1.5"><Label>Rate per Day (₹)</Label><Input type="number" value={form.ratePerDay} onChange={set("ratePerDay")} placeholder="2500" /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, seatingCapacity: Number(form.seatingCapacity), ratePerKm: form.ratePerKm ? Number(form.ratePerKm) : undefined, ratePerDay: form.ratePerDay ? Number(form.ratePerDay) : undefined })} disabled={!form.vehicleMake || !form.vehicleModel || !form.vehicleNumber}>{initial?.id ? "Save Changes" : "Add Vehicle"}</Button>
      </div>
    </div>
  );
}

function SettlementForm({ vendorId, onSave, onCancel }: { vendorId: string; onSave: (d: any) => void; onCancel: () => void }) {
  const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [form, setForm] = useState({ month, totalTrips: "", grossAmount: "", commissionAmount: "", netPayable: "", notes: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...form, [k]: e.target.value };
    if (["grossAmount","commissionAmount"].includes(k)) {
      const net = parseFloat(updated.grossAmount || "0") - parseFloat(updated.commissionAmount || "0");
      updated.netPayable = String(Math.max(0, net));
    }
    setForm(updated);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Month</Label><Input type="month" value={form.month} onChange={set("month")} /></div>
        <div className="space-y-1.5"><Label>Total Trips</Label><Input type="number" value={form.totalTrips} onChange={set("totalTrips")} placeholder="0" min="0" /></div>
        <div className="space-y-1.5"><Label>Gross Amount (₹)</Label><Input type="number" value={form.grossAmount} onChange={set("grossAmount")} placeholder="0" /></div>
        <div className="space-y-1.5"><Label>Commission Deduction (₹)</Label><Input type="number" value={form.commissionAmount} onChange={set("commissionAmount")} placeholder="0" /></div>
        <div className="space-y-1.5"><Label>Net Payable (₹)</Label><Input type="number" value={form.netPayable} readOnly className="bg-muted" /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={set("notes")} placeholder="Any remarks..." /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, totalTrips: Number(form.totalTrips) || 0, grossAmount: Number(form.grossAmount) || 0, commissionAmount: Number(form.commissionAmount) || 0, netPayable: Number(form.netPayable) || 0 })} disabled={!form.grossAmount}>Create Settlement</Button>
      </div>
    </div>
  );
}

function VendorDetail({ vendor }: { vendor: any }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [vehicleDialog, setVehicleDialog] = useState<{ mode: string; data?: any } | null>(null);
  const [settlementDialog, setSettlementDialog] = useState(false);

  const { data: vehicles, isLoading: vLoading } = useQuery<any[]>({ queryKey: [`/v1/vendors/${vendor.id}/vehicles`], queryFn: () => api.get(`/vendors/${vendor.id}/vehicles`) });
  const { data: settlements, isLoading: sLoading } = useQuery<any[]>({ queryKey: [`/v1/vendors/${vendor.id}/settlements`], queryFn: () => api.get(`/vendors/${vendor.id}/settlements`) });

  const addVehicleMut = useMutation({ mutationFn: (d: any) => api.post(`/vendors/${vendor.id}/vehicles`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: [`/v1/vendors/${vendor.id}/vehicles`] }); setVehicleDialog(null); toast({ title: "Vehicle added" }); } });
  const delVehicleMut = useMutation({ mutationFn: (id: string) => api.delete(`/vendors/vehicles/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: [`/v1/vendors/${vendor.id}/vehicles`] }) });
  const addSettlementMut = useMutation({ mutationFn: (d: any) => api.post(`/vendors/${vendor.id}/settlements`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: [`/v1/vendors/${vendor.id}/settlements`] }); setSettlementDialog(false); toast({ title: "Settlement created" }); } });
  const paySettlementMut = useMutation({ mutationFn: (id: string) => api.patch(`/vendors/settlements/${id}/pay`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: [`/v1/vendors/${vendor.id}/settlements`] }) });

  return (
    <div className="space-y-4 mt-2">
      <Tabs defaultValue="vehicles">
        <TabsList><TabsTrigger value="vehicles">Vehicles ({vehicles?.length ?? 0})</TabsTrigger><TabsTrigger value="settlements">Settlements ({settlements?.length ?? 0})</TabsTrigger></TabsList>
        <TabsContent value="vehicles" className="mt-3">
          <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setVehicleDialog({ mode: "create" })} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Vehicle</Button></div>
          {vLoading ? <Skeleton className="h-20 w-full" /> : !vehicles?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm"><Car className="h-8 w-8 mx-auto mb-2 opacity-50" />No vehicles added yet</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {vehicles.map((v: any) => (
                <Card key={v.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{v.vehicleMake} {v.vehicleModel}</p>
                        <p className="text-sm text-muted-foreground font-mono">{v.vehicleNumber}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>{v.category} · {v.seatingCapacity} seats</span>
                          {v.ratePerKm && <span>₹{v.ratePerKm}/km</span>}
                          {v.ratePerDay && <span>₹{v.ratePerDay}/day</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if(confirm("Remove vehicle?")) delVehicleMut.mutate(v.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Dialog open={vehicleDialog?.mode === "create"} onOpenChange={() => setVehicleDialog(null)}>
            <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add Vendor Vehicle</DialogTitle></DialogHeader>
              {vehicleDialog && <VehicleForm vendorId={vendor.id} onSave={d => addVehicleMut.mutate(d)} onCancel={() => setVehicleDialog(null)} />}
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="settlements" className="mt-3">
          <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setSettlementDialog(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Settlement</Button></div>
          {sLoading ? <Skeleton className="h-20 w-full" /> : !settlements?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm"><Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />No settlements yet</div>
          ) : (
            <div className="space-y-2">
              {settlements.map((s: any) => (
                <Card key={s.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2"><p className="font-semibold">{s.month}</p><Badge variant="outline" className={s.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{s.status}</Badge></div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>{s.totalTrips} trips</span>
                        <span>Gross: ₹{s.grossAmount}</span>
                        <span>Commission: ₹{s.commissionAmount}</span>
                        <span className="font-semibold text-foreground">Net: ₹{s.netPayable}</span>
                      </div>
                    </div>
                    {s.status !== "paid" && <Button size="sm" variant="outline" onClick={() => { if(confirm("Mark as paid?")) paySettlementMut.mutate(s.id); }} className="gap-1"><IndianRupee className="h-3.5 w-3.5" />Mark Paid</Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Dialog open={settlementDialog} onOpenChange={() => setSettlementDialog(false)}>
            <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Create Settlement</DialogTitle></DialogHeader>
              <SettlementForm vendorId={vendor.id} onSave={d => addSettlementMut.mutate(d)} onCancel={() => setSettlementDialog(false)} />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminVendors() {
  const { data: vendors, isLoading } = useListVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; vendor?: any } | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/vendors"] });

  const handleSave = async (data: any) => {
    try {
      if (dialog?.mode === "edit") { await updateVendor.mutateAsync({ id: dialog.vendor.id, data }); toast({ title: "Vendor updated" }); }
      else { await createVendor.mutateAsync({ data }); toast({ title: "Vendor added" }); }
      refresh(); setDialog(null);
    } catch { toast({ title: "Error saving vendor", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete vendor "${name}"?`)) return;
    try { await deleteVendor.mutateAsync({ id }); toast({ title: "Vendor removed" }); refresh(); }
    catch { toast({ title: "Error deleting vendor", variant: "destructive" }); }
  };

  const filtered = vendors?.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || (v.phone ?? "").includes(search)) ?? [];
  const totalVendors = vendors?.length ?? 0;
  const activeVendors = vendors?.filter(v => v.status === "active").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Vendors</h1><p className="text-muted-foreground mt-1">Manage third-party vehicle providers, their vehicles and settlements.</p></div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2"><Plus className="h-4 w-4" /> Add Vendor</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalVendors}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{activeVendors}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{totalVendors - activeVendors}</p></CardContent></Card>
      </div>

      <Input placeholder="Search vendors by name or phone…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />) :
          !filtered.length ? (
            <div className="col-span-2"><Card className="text-center py-16"><CardContent><Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No vendors found</p></CardContent></Card></div>
          ) : filtered.map(v => (
            <Card key={v.id} className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer ${selected?.id === v.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(selected?.id === v.id ? null : v)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-semibold text-base">{v.name}</p>{v.contactName && <p className="text-xs text-muted-foreground">{v.contactName}</p>}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[v.status ?? "active"]}>{v.status ?? "active"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  {v.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{v.phone}</div>}
                  {v.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{v.email}</div>}
                  {v.commissionPercent && <div className="flex items-center gap-1.5 text-muted-foreground"><Star className="h-3.5 w-3.5" />{v.commissionPercent}% commission</div>}
                  {v.gstNumber && <div className="flex items-center gap-1.5 text-muted-foreground"><Car className="h-3.5 w-3.5" />GST: {v.gstNumber}</div>}
                </div>
                <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", vendor: v })}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(v.id, v.name)}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                </div>
                {selected?.id === v.id && <VendorDetail vendor={v} />}
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Edit Vendor" : "Add New Vendor"}</DialogTitle></DialogHeader>
          {dialog && <VendorForm initial={dialog.vendor} onSave={handleSave} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
