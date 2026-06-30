import { useState } from "react";
import { useListPlans, useCreatePlan, useUpdatePlan, useDeletePlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Check, Users, Car, Calendar, Plus, Pencil, Trash2, Star } from "lucide-react";

const BLANK = {
  name: "", price: "", duration: "30",
  maxUsers: "5", maxVehicles: "10",
  maxBookingsPerMonth: "100", features: "",
};

export default function MasterPlans() {
  const { data: plans, isLoading } = useListPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editActive, setEditActive] = useState(true);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/master/plans"] });

  const openCreate = () => { setForm(BLANK); setDialog({ mode: "create", data: null }); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name, price: String(p.price), duration: String(p.duration),
      maxUsers: String(p.maxUsers), maxVehicles: String(p.maxVehicles),
      maxBookingsPerMonth: String(p.maxBookingsPerMonth ?? 100),
      features: (p.features ?? []).join("\n"),
    });
    setEditActive(p.isActive ?? true);
    setDialog({ mode: "edit", data: p });
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast({ title: "Name and price are required", variant: "destructive" }); return; }
    const features = form.features ? form.features.split("\n").map(f => f.trim()).filter(Boolean) : undefined;
    try {
      if (dialog?.mode === "create") {
        await createPlan.mutateAsync({ data: {
          name: form.name, price: parseFloat(form.price),
          duration: parseInt(form.duration) || 30,
          maxUsers: parseInt(form.maxUsers) || 5,
          maxVehicles: parseInt(form.maxVehicles) || 10,
          maxBookingsPerMonth: parseInt(form.maxBookingsPerMonth) || 100,
          features,
        }});
        toast({ title: "Plan created" });
      } else {
        await updatePlan.mutateAsync({ id: dialog!.data.id, data: {
          name: form.name, price: parseFloat(form.price),
          maxUsers: parseInt(form.maxUsers),
          maxVehicles: parseInt(form.maxVehicles),
          isActive: editActive,
        }});
        toast({ title: "Plan updated" });
      }
      refresh();
      setDialog(null);
    } catch { toast({ title: "Failed to save plan", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"?`)) return;
    try {
      await deletePlan.mutateAsync({ id });
      toast({ title: "Plan deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete plan", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Configure pricing tiers for tenant companies.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Plan</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
        </div>
      ) : !plans?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No plans configured yet</p>
            <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Create First Plan</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <Card key={plan.id} className={`shadow-sm relative overflow-hidden flex flex-col ${i === 1 ? "border-primary border-2 shadow-primary/10" : ""} ${!plan.isActive ? "opacity-60" : ""}`}>
              {i === 1 && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Star className="h-3 w-3" />Popular
                </div>
              )}
              {!plan.isActive && (
                <div className="absolute top-0 left-0 bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg">Inactive</div>
              )}
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-extrabold text-foreground">₹{Number(plan.price).toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm"> / {plan.duration} days</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary flex-shrink-0" /><span>Up to <strong className="text-foreground">{plan.maxUsers}</strong> users</span></div>
                  <div className="flex items-center gap-2"><Car className="h-4 w-4 text-primary flex-shrink-0" /><span>Up to <strong className="text-foreground">{plan.maxVehicles}</strong> vehicles</span></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary flex-shrink-0" /><span><strong className="text-foreground">{plan.maxBookingsPerMonth ?? "∞"}</strong> bookings/month</span></div>
                </div>
                {plan.features && plan.features.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 pt-3 border-t border-border/50 justify-end mt-auto">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} className="h-7 text-xs gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(plan.id, plan.name)} className="h-7 text-xs gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "New Subscription Plan" : "Edit Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Plan Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="e.g. Starter, Growth, Enterprise" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Price (₹) *</Label><Input type="number" value={form.price} onChange={setF("price")} placeholder="999" /></div>
              <div className="space-y-1.5"><Label>Duration (days)</Label><Input type="number" value={form.duration} onChange={setF("duration")} disabled={dialog?.mode === "edit"} /></div>
              <div className="space-y-1.5"><Label>Max Users</Label><Input type="number" value={form.maxUsers} onChange={setF("maxUsers")} /></div>
              <div className="space-y-1.5"><Label>Max Vehicles</Label><Input type="number" value={form.maxVehicles} onChange={setF("maxVehicles")} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Max Bookings/Month</Label><Input type="number" value={form.maxBookingsPerMonth} onChange={setF("maxBookingsPerMonth")} disabled={dialog?.mode === "edit"} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <textarea
                value={form.features}
                onChange={setF("features")}
                placeholder={"Custom branding\nPriority support\nAdvanced reports"}
                rows={4}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            {dialog?.mode === "edit" && (
              <div className="flex items-center gap-3">
                <Switch checked={editActive} onCheckedChange={setEditActive} />
                <Label>{editActive ? "Active" : "Inactive"}</Label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending}>
                {dialog?.mode === "create" ? "Create Plan" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
