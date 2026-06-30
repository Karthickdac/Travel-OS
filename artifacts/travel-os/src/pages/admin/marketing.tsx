import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tag, Plus, Pencil, Trash2, Percent, IndianRupee, Calendar, Users, BadgeCheck } from "lucide-react";

type Coupon = {
  id: string; code: string; description?: string; type: string; value: string;
  minBookingAmount?: string; maxDiscount?: string; usageLimit?: number;
  usedCount: number; isActive: boolean; expiresAt?: string; createdAt: string;
};

const BLANK = {
  code: "", description: "", type: "percent", value: "", minBookingAmount: "",
  maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true,
};

function CouponForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string,any>>({ ...BLANK, ...initial, usageLimit: initial?.usageLimit ? String(initial.usageLimit) : "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f: Record<string,any>) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Coupon Code *</Label>
          <Input value={form.code} onChange={set("code")} placeholder="SUMMER20" className="uppercase" />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percentage (%)</SelectItem>
              <SelectItem value="flat">Flat Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{form.type === "percent" ? "Discount %" : "Flat Discount ₹"} *</Label>
          <Input type="number" value={form.value} onChange={set("value")} placeholder={form.type === "percent" ? "20" : "500"} min="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Min Booking Amount (₹)</Label>
          <Input type="number" value={form.minBookingAmount} onChange={set("minBookingAmount")} placeholder="1000" min="0" />
        </div>
        {form.type === "percent" && (
          <div className="space-y-1.5">
            <Label>Max Discount Cap (₹)</Label>
            <Input type="number" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="500" min="0" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Usage Limit</Label>
          <Input type="number" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" min="1" />
        </div>
        <div className="space-y-1.5">
          <Label>Expiry Date</Label>
          <Input type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={set("description")} placeholder="Summer special offer - 20% off all bookings" />
        </div>
        <div className="flex items-center gap-3 col-span-2">
          <Switch checked={form.isActive} onCheckedChange={v => setForm((f: Record<string,any>) => ({ ...f, isActive: v }))} />
          <Label>Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, value: Number(form.value), minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, expiresAt: form.expiresAt || undefined })} disabled={!form.code || !form.value}>
          {initial?.id ? "Save Changes" : "Create Coupon"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminMarketing() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data?: Coupon } | null>(null);
  const [search, setSearch] = useState("");

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/v1/marketing/coupons"],
    queryFn: () => api.get("/marketing/coupons"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/marketing/coupons"] });

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/marketing/coupons", d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Coupon created" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => api.patch(`/marketing/coupons/${id}`, d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Coupon updated" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.delete(`/marketing/coupons/${id}`), onSuccess: () => { refresh(); toast({ title: "Coupon deleted" }); } });

  const handleSave = (d: any) => {
    if (dialog?.mode === "edit" && dialog.data) updateMut.mutate({ id: dialog.data.id, ...d });
    else createMut.mutate(d);
  };

  const filtered = (coupons ?? []).filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || (c.description ?? "").toLowerCase().includes(search.toLowerCase()));
  const active = filtered.filter(c => c.isActive).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground mt-1">Manage discount coupons and promotional offers.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{coupons?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{active}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Used</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(coupons ?? []).reduce((s, c) => s + c.usedCount, 0)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-500">{(coupons?.length ?? 0) - active}</p></CardContent></Card>
      </div>

      <Input placeholder="Search coupons…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No coupons found</p><p className="text-sm text-muted-foreground mt-1">Create your first discount coupon.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const limitReached = c.usageLimit && c.usedCount >= c.usageLimit;
            return (
              <Card key={c.id} className={`shadow-sm hover:shadow-md transition-shadow ${!c.isActive || expired || limitReached ? "opacity-70" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-widest ${c.isActive && !expired && !limitReached ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {c.code}
                      </div>
                    </div>
                    <Badge variant="outline" className={c.isActive && !expired && !limitReached ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"}>
                      {expired ? "Expired" : limitReached ? "Exhausted" : c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {c.description && <CardDescription className="mt-2">{c.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {c.type === "percent" ? <Percent className="h-3.5 w-3.5" /> : <IndianRupee className="h-3.5 w-3.5" />}
                      {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {c.usedCount}/{c.usageLimit ?? "∞"} used
                    </div>
                    {c.minBookingAmount && <div className="flex items-center gap-1.5 text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5" />Min ₹{c.minBookingAmount}</div>}
                    {c.expiresAt && <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(c.expiresAt).toLocaleDateString()}</div>}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", data: c })}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) deleteMut.mutate(c.id); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          </DialogHeader>
          {dialog && <CouponForm initial={dialog.data} onSave={handleSave} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
