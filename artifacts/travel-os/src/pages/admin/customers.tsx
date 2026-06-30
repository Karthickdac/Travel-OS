import { useState } from "react";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Mail, Phone, MapPin, Star, CircleDollarSign, Plus, Search,
  Pencil, Trash2, Users, TrendingUp, Calendar,
} from "lucide-react";
import { format } from "date-fns";

const BLANK = { name: "", phone: "", email: "", city: "" };

export default function AdminCustomers() {
  const { data: customers, isLoading } = useListCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/customers"] });

  const filtered = (customers ?? []).filter(c => {
    const q = search.toLowerCase();
    return !search || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
  });

  const openCreate = () => { setForm(BLANK); setDialog({ mode: "create", data: null }); };
  const openEdit = (c: any) => { setForm({ name: c.name, phone: c.phone, email: c.email ?? "", city: c.city ?? "" }); setDialog({ mode: "edit", data: c }); };

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast({ title: "Name and phone are required", variant: "destructive" }); return; }
    try {
      if (dialog?.mode === "create") {
        await createCustomer.mutateAsync({ data: { name: form.name, phone: form.phone, email: form.email || undefined, city: form.city || undefined } });
        toast({ title: "Customer added" });
      } else {
        await updateCustomer.mutateAsync({ id: dialog!.data.id, data: { name: form.name, email: form.email || undefined, city: form.city || undefined } });
        toast({ title: "Customer updated" });
      }
      refresh();
      setDialog(null);
    } catch {
      toast({ title: "Failed to save customer", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCustomer.mutateAsync({ id });
      toast({ title: "Customer deleted" });
      refresh();
    } catch {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const totalSpent = (customers ?? []).reduce((s, c) => s + Number(c.totalSpent ?? 0), 0);
  const totalBookings = (customers ?? []).reduce((s, c) => s + (c.totalBookings ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Your customer database and travel history.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Customer</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black">{customers?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black">{totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black">₹{(totalSpent / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No customers match your search" : "No customers yet"}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {search ? "Try different search terms." : "Add your first customer to get started."}
            </p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Customer</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-base flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.loyaltyPoints && c.loyaltyPoints > 0 ? (
                        <Badge variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
                          <Star className="h-2.5 w-2.5" />{c.loyaltyPoints} pts
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                      {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-center text-sm flex-shrink-0">
                    <div>
                      <p className="font-bold">{c.totalBookings ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-600">₹{Number(c.totalSpent ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Spent</p>
                    </div>
                    {c.lastBookingDate && (
                      <div>
                        <p className="font-bold text-xs">{format(new Date(c.lastBookingDate), "MMM d, yy")}</p>
                        <p className="text-xs text-muted-foreground">Last trip</p>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8 w-8 p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id, c.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Add Customer" : "Edit Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={setF("name")} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={setF("phone")} placeholder="9876543210" disabled={dialog?.mode === "edit"} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={setF("email")} placeholder="customer@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={setF("city")} placeholder="e.g. Madurai" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createCustomer.isPending || updateCustomer.isPending}>
                {dialog?.mode === "create" ? "Add Customer" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
