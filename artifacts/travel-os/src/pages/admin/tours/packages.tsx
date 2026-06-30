import { useState } from "react";
import { useListTourPackages, useCreateTourPackage, useUpdateTourPackage, useDeleteTourPackage, useListDestinations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, Clock, CircleDollarSign, Plus, Search, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";

const PKG_TYPES = ["day_trip", "weekend", "honeymoon", "group", "pilgrimage", "adventure", "corporate"];

const BLANK = {
  title: "", description: "", duration: "3", price: "", originalPrice: "",
  destinationId: "", packageType: "day_trip",
};

export default function AdminPackages() {
  const { data: packages, isLoading } = useListTourPackages();
  const { data: destinations } = useListDestinations();
  const createPackage = useCreateTourPackage();
  const updatePackage = useUpdateTourPackage();
  const deletePackage = useDeleteTourPackage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/tours/packages"] });

  const filtered = (packages ?? []).filter(p => {
    const q = search.toLowerCase();
    return !search || p.title.toLowerCase().includes(q) || (p.destinationName ?? "").toLowerCase().includes(q) || (p.packageType ?? "").includes(q);
  });

  const openCreate = () => { setForm(BLANK); setDialog({ mode: "create", data: null }); };
  const openEdit = (p: any) => {
    setForm({
      title: p.title, description: p.description ?? "", duration: String(p.duration),
      price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      destinationId: p.destinationId, packageType: p.packageType ?? "day_trip",
    });
    setDialog({ mode: "edit", data: p });
  };

  const handleSave = async () => {
    if (!form.title || !form.price || !form.destinationId) {
      toast({ title: "Title, price, and destination are required", variant: "destructive" });
      return;
    }
    try {
      if (dialog?.mode === "create") {
        await createPackage.mutateAsync({ data: {
          title: form.title, description: form.description || undefined,
          duration: parseInt(form.duration) || 1,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
          destinationId: form.destinationId, packageType: form.packageType,
        }});
        toast({ title: "Package created" });
      } else {
        await updatePackage.mutateAsync({ id: dialog!.data.id, data: {
          title: form.title, description: form.description || undefined,
          price: parseFloat(form.price),
        }});
        toast({ title: "Package updated" });
      }
      refresh();
      setDialog(null);
    } catch { toast({ title: "Failed to save package", variant: "destructive" }); }
  };

  const toggleActive = async (pkg: any) => {
    try {
      await updatePackage.mutateAsync({ id: pkg.id, data: { isActive: !pkg.isActive } });
      refresh();
      toast({ title: pkg.isActive ? "Package unpublished" : "Package published" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete package "${title}"?`)) return;
    try {
      await deletePackage.mutateAsync({ id });
      toast({ title: "Package deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tour Packages</h1>
          <p className="text-muted-foreground mt-1">Create and publish packages to your website.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Package</Button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{packages?.length ?? 0}</span> total ·
        <span className="font-medium text-emerald-600">{(packages ?? []).filter(p => p.isActive).length}</span> live ·
        <span className="font-medium text-gray-500">{(packages ?? []).filter(p => !p.isActive).length}</span> draft
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search packages…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No packages match" : "No packages created yet"}</p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />New Package</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(pkg => (
            <Card key={pkg.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 flex items-center justify-center relative">
                <Package className="h-10 w-10 text-primary/30" />
                {pkg.isActive ? (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Live</span>
                ) : (
                  <span className="absolute top-3 right-3 bg-gray-400 text-white text-xs font-medium px-2 py-0.5 rounded-full">Draft</span>
                )}
                {pkg.packageType && (
                  <span className="absolute top-3 left-3 bg-white/80 text-xs font-medium px-2 py-0.5 rounded-full text-foreground capitalize">{pkg.packageType.replace("_", " ")}</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug line-clamp-2">{pkg.title}</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{pkg.destinationName}
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />{pkg.duration}N
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {pkg.description && <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                      ₹{Number(pkg.price).toLocaleString()}
                    </div>
                    {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                      <div className="text-xs text-muted-foreground line-through">₹{Number(pkg.originalPrice).toLocaleString()}</div>
                    )}
                  </div>
                  {pkg.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{pkg.rating}</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!pkg.isActive} onCheckedChange={() => toggleActive(pkg)} />
                    <span className="text-xs text-muted-foreground">{pkg.isActive ? "Published" : "Draft"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id, pkg.title)} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "New Tour Package" : "Edit Package"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={setF("title")} placeholder="e.g. Ooty 3-Day Honeymoon Package" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destination *</Label>
                <Select value={form.destinationId} onValueChange={v => setForm(f => ({ ...f, destinationId: v }))} disabled={dialog?.mode === "edit"}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>
                    {(destinations ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Package Type</Label>
                <Select value={form.packageType} onValueChange={v => setForm(f => ({ ...f, packageType: v }))} disabled={dialog?.mode === "edit"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PKG_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Duration (nights) *</Label><Input type="number" value={form.duration} onChange={setF("duration")} disabled={dialog?.mode === "edit"} /></div>
              <div className="space-y-1.5"><Label>Price (₹) *</Label><Input type="number" value={form.price} onChange={setF("price")} placeholder="15000" /></div>
              <div className="space-y-1.5 col-span-2"><Label>Original Price (₹) — for discount display</Label><Input type="number" value={form.originalPrice} onChange={setF("originalPrice")} placeholder="18000" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={setF("description")} rows={3} placeholder="What's included, highlights…" /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createPackage.isPending || updatePackage.isPending}>
                {dialog?.mode === "create" ? "Create Package" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
