import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, useDeleteLead, LeadSource } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Phone, MapPin, CircleDollarSign, Calendar, Plus, Search, Pencil, Trash2, MessageSquare, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700 border-gray-200",
  contacted: "bg-blue-100 text-blue-700 border-blue-200",
  qualified: "bg-purple-100 text-purple-700 border-purple-200",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Website", phone: "Phone", email: "Email",
  referral: "Referral", whatsapp: "WhatsApp", social: "Social Media", walk_in: "Walk-in",
};

const BLANK_LEAD = { name: "", phone: "", email: "", source: LeadSource.phone, destination: "", travelDate: "", pax: "", budget: "", notes: "" };
const BLANK_UPDATE = { status: "contacted", notes: "", followUpDate: "" };

export default function AdminLeads() {
  const { data: leads, isLoading } = useListLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState<any | null>(null);
  const [form, setForm] = useState(BLANK_LEAD);
  const [updateForm, setUpdateForm] = useState(BLANK_UPDATE);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/crm/leads"] });

  const filtered = (leads ?? []).filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = !search || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.destination ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!form.name || !form.phone) { toast({ title: "Name and phone are required", variant: "destructive" }); return; }
    try {
      await createLead.mutateAsync({ data: {
        name: form.name, phone: form.phone, email: form.email || undefined,
        source: form.source, destination: form.destination || undefined,
        travelDate: form.travelDate || undefined,
        pax: form.pax ? parseInt(form.pax) : undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        notes: form.notes || undefined,
      }});
      toast({ title: "Lead created" });
      refresh();
      setCreateDialog(false);
      setForm(BLANK_LEAD);
    } catch { toast({ title: "Failed to create lead", variant: "destructive" }); }
  };

  const openUpdate = (lead: any) => {
    setUpdateForm({ status: lead.status, notes: lead.notes ?? "", followUpDate: lead.followUpDate ?? "" });
    setUpdateDialog(lead);
  };

  const handleUpdate = async () => {
    try {
      await updateLead.mutateAsync({ id: updateDialog.id, data: { status: updateForm.status, notes: updateForm.notes || undefined, followUpDate: updateForm.followUpDate || undefined } });
      toast({ title: "Lead updated" });
      refresh();
      setUpdateDialog(null);
    } catch { toast({ title: "Failed to update lead", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"?`)) return;
    try {
      await deleteLead.mutateAsync({ id });
      toast({ title: "Lead deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setUF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const stats = {
    total: leads?.length ?? 0,
    won: (leads ?? []).filter(l => l.status === "won").length,
    active: (leads ?? []).filter(l => !["won","lost"].includes(l.status)).length,
    lost: (leads ?? []).filter(l => l.status === "lost").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track and convert travel enquiries into bookings.</p>
        </div>
        <Button onClick={() => { setForm(BLANK_LEAD); setCreateDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total, cls: "bg-primary/10 text-primary", icon: <Users className="h-4 w-4" /> },
          { label: "Active", value: stats.active, cls: "bg-blue-100 text-blue-700", icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Won", value: stats.won, cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Lost", value: stats.lost, cls: "bg-red-100 text-red-700", icon: <XCircle className="h-4 w-4" /> },
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
          <Input placeholder="Search by name, phone or destination…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{search ? "No leads match" : "No leads yet"}</p>
            {!search && <Button onClick={() => { setForm(BLANK_LEAD); setCreateDialog(true); }} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Lead</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{lead.name}</p>
                      <Badge variant="outline" className={`text-xs ${STAGE_COLORS[lead.status] ?? ""}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                      {lead.source && (
                        <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                      {lead.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.destination}</span>}
                      {lead.budget && <span className="flex items-center gap-1"><CircleDollarSign className="h-3 w-3" />₹{Number(lead.budget).toLocaleString()}</span>}
                      {lead.travelDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{lead.travelDate}</span>}
                      {lead.pax && <span>{lead.pax} pax</span>}
                    </div>
                    {lead.notes && <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">{lead.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openUpdate(lead)} className="h-8 text-xs gap-1"><MessageSquare className="h-3 w-3" />Update</Button>
                    <Button size="sm" variant="ghost" onClick={() => openUpdate(lead)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(lead.id, lead.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={setF("name")} placeholder="Customer name" /></div>
            <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={setF("phone")} placeholder="9876543210" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={setF("email")} /></div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Destination</Label><Input value={form.destination} onChange={setF("destination")} placeholder="e.g. Ooty" /></div>
            <div className="space-y-1.5"><Label>Travel Date</Label><Input type="date" value={form.travelDate} onChange={setF("travelDate")} /></div>
            <div className="space-y-1.5"><Label>Pax</Label><Input type="number" value={form.pax} onChange={setF("pax")} placeholder="2" /></div>
            <div className="space-y-1.5"><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={setF("budget")} placeholder="15000" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={setF("notes")} placeholder="Additional details…" rows={2} /></div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createLead.isPending}>Add Lead</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Lead — {updateDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={updateForm.status} onValueChange={v => setUpdateForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Follow-up Date</Label><Input type="date" value={updateForm.followUpDate} onChange={setUF("followUpDate")} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={updateForm.notes} onChange={setUF("notes")} placeholder="Notes…" rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={updateLead.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
