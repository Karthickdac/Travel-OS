import { useState } from "react";
import { useListVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Phone, Mail, Pencil, Trash2, Star, Car } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

function VendorForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    contactName: initial?.contactName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    gstNumber: initial?.gstNumber ?? "",
    commissionPercent: initial?.commissionPercent ?? "10",
    status: initial?.status ?? "active",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

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
          <select value={form.status} onChange={set("status")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, commissionPercent: Number(form.commissionPercent) })} disabled={!form.name || !form.phone}>
          {initial ? "Save Changes" : "Add Vendor"}
        </Button>
      </div>
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
  const [search, setSearch] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/vendors"] });

  const handleSave = async (data: any) => {
    try {
      if (dialog?.mode === "edit") {
        await updateVendor.mutateAsync({ id: dialog.vendor.id, data });
        toast({ title: "Vendor updated" });
      } else {
        await createVendor.mutateAsync({ data });
        toast({ title: "Vendor added" });
      }
      refresh();
      setDialog(null);
    } catch {
      toast({ title: "Error saving vendor", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete vendor "${name}"?`)) return;
    try {
      await deleteVendor.mutateAsync({ id });
      toast({ title: "Vendor removed" });
      refresh();
    } catch {
      toast({ title: "Error deleting vendor", variant: "destructive" });
    }
  };

  const filtered = vendors?.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.phone ?? "").includes(search)
  ) ?? [];

  const totalVendors = vendors?.length ?? 0;
  const activeVendors = vendors?.filter(v => v.status === "active").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground mt-1">Manage third-party vehicle and service providers.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalVendors}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{activeVendors}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{totalVendors - activeVendors}</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search vendors by name or phone…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16"><CardContent><Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No vendors found</p><p className="text-muted-foreground text-sm mt-1">Add your first vendor partner.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(v => (
            <Card key={v.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">{v.name}</p>
                      {v.contactName && <p className="text-xs text-muted-foreground">{v.contactName}</p>}
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[v.status ?? "active"]}>
                    {v.status ?? "active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  {v.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{v.phone}</div>}
                  {v.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{v.email}</div>}
                  {v.commissionPercent && <div className="flex items-center gap-1.5 text-muted-foreground"><Star className="h-3.5 w-3.5" />{v.commissionPercent}% commission</div>}
                  {v.gstNumber && <div className="flex items-center gap-1.5 text-muted-foreground"><Car className="h-3.5 w-3.5" />GST: {v.gstNumber}</div>}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", vendor: v })}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(v.id, v.name)}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>
          {dialog && <VendorForm initial={dialog.vendor} onSave={handleSave} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
