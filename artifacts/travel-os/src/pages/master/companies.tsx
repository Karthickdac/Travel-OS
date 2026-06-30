import { useState } from "react";
import { useListCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Users, Calendar, MapPin, Phone, Mail, Plus, Search, Pencil, Trash2, PauseCircle, PlayCircle, Globe } from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  trial: { label: "Trial", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  suspended: { label: "Suspended", cls: "bg-red-100 text-red-800 border-red-200" },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-700 border-gray-200" },
};

const BLANK = { name: "", email: "", phone: "", plan: "starter", city: "", country: "India", domain: "" };

export default function MasterCompanies() {
  const { data: companies, isLoading } = useListCompanies();
  const { data: plans } = useListPlans();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data: any } | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editStatus, setEditStatus] = useState("active");

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/master/companies"] });

  const all = companies?.data ?? [];
  const filtered = all.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setForm(BLANK); setDialog({ mode: "create", data: null }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, email: c.email, phone: c.phone ?? "", plan: c.plan, city: c.city ?? "", country: c.country ?? "India", domain: c.domain ?? "" });
    setEditStatus(c.status);
    setDialog({ mode: "edit", data: c });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    try {
      if (dialog?.mode === "create") {
        await createCompany.mutateAsync({ data: { name: form.name, email: form.email, phone: form.phone || undefined, plan: form.plan, city: form.city || undefined, country: form.country || undefined, domain: form.domain || undefined } });
        toast({ title: "Company registered" });
      } else {
        await updateCompany.mutateAsync({ id: dialog!.data.id, data: { name: form.name, email: form.email, phone: form.phone || undefined, plan: form.plan, city: form.city || undefined, domain: form.domain || undefined, status: editStatus } });
        toast({ title: "Company updated" });
      }
      refresh();
      setDialog(null);
    } catch { toast({ title: "Failed to save company", variant: "destructive" }); }
  };

  const toggleSuspend = async (company: any) => {
    const newStatus = company.status === "suspended" ? "active" : "suspended";
    try {
      await updateCompany.mutateAsync({ id: company.id, data: { status: newStatus } });
      toast({ title: newStatus === "suspended" ? "Company suspended" : "Company reactivated" });
      refresh();
    } catch { toast({ title: "Failed to update status", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete company "${name}"? This will remove ALL their data.`)) return;
    try {
      await deleteCompany.mutateAsync({ id });
      toast({ title: "Company deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete company", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const planOptions = plans?.length ? plans.map(p => p.name) : ["starter", "growth", "enterprise"];

  const counts = {
    total: all.length,
    active: all.filter(c => c.status === "active").length,
    trial: all.filter(c => c.status === "trial").length,
    suspended: all.filter(c => c.status === "suspended").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-1">All registered tenant companies on the platform.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Register Company</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, cls: "bg-primary/10 text-primary" },
          { label: "Active", value: counts.active, cls: "bg-emerald-100 text-emerald-700" },
          { label: "Trial", value: counts.trial, cls: "bg-blue-100 text-blue-700" },
          { label: "Suspended", value: counts.suspended, cls: "bg-red-100 text-red-700" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.cls}`}>
                <Building2 className="h-4 w-4" />
              </div>
              <div><p className="text-xl font-black">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No companies match" : "No companies registered yet"}</p>
            {!search && <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="h-4 w-4" />Register Company</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(company => {
            const statusMeta = STATUS_META[company.status] ?? STATUS_META.inactive;
            return (
              <Card key={company.id} className={`shadow-sm hover:shadow-md transition-shadow ${company.status === "suspended" ? "opacity-75" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{company.plan}</Badge>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusMeta.cls}`}>{statusMeta.label}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{company.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm text-muted-foreground">
                  {company.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{company.email}</span></div>}
                  {company.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 flex-shrink-0" /><span>{company.phone}</span></div>}
                  {(company.city || company.country) && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span>{[company.city, company.country].filter(Boolean).join(", ")}</span></div>}
                  {company.domain && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate text-xs font-mono">{company.domain}</span></div>}
                  <div className="flex items-center gap-4 pt-2 border-t border-border text-foreground font-medium text-xs">
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />{company.totalUsers ?? 0} users</div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{company.totalBookings ?? 0} bookings</div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 pt-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(company)} className="h-7 text-xs gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleSuspend(company)} className={`h-7 text-xs gap-1 ${company.status === "suspended" ? "text-emerald-600 hover:text-emerald-600" : "text-amber-600 hover:text-amber-600"}`}>
                      {company.status === "suspended" ? <><PlayCircle className="h-3 w-3" />Reactivate</> : <><PauseCircle className="h-3 w-3" />Suspend</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(company.id, company.name)} className="h-7 text-xs gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog?.mode === "create" ? "Register New Company" : `Edit — ${dialog?.data?.name}`}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Company Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="Raj Travels Pvt Ltd" /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={setF("email")} placeholder="admin@company.com" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={setF("phone")} placeholder="9876543210" /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={setF("city")} placeholder="Chennai" /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={setF("country")} placeholder="India" /></div>
            <div className="space-y-1.5"><Label>Domain</Label><Input value={form.domain} onChange={setF("domain")} placeholder="https://rajtravel.com" /></div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planOptions.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {dialog?.mode === "edit" && (
              <div className="col-span-2 space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createCompany.isPending || updateCompany.isPending}>
                {dialog?.mode === "create" ? "Register Company" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
