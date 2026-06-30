import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, useDeleteLead, useConvertLeadToBooking, LeadSource, LeadStatus } from "@workspace/api-client-react";
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
import { cn } from "@/lib/utils";
import { Users, Phone, MapPin, CircleDollarSign, Calendar, Plus, Search, Pencil, Trash2, MessageSquare, TrendingUp, CheckCircle2, XCircle, LayoutGrid, List, GripVertical, Clock, Percent, ChevronRight, CalendarCheck } from "lucide-react";

interface Stage { key: string; label: string; badge: string; bar: string; }

const STAGES: Stage[] = [
  { key: "new", label: "New", badge: "bg-gray-100 text-gray-700 border-gray-200", bar: "bg-gray-400" },
  { key: "contacted", label: "Contacted", badge: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-500" },
  { key: "qualified", label: "Qualified", badge: "bg-purple-100 text-purple-700 border-purple-200", bar: "bg-purple-500" },
  { key: "quotation_sent", label: "Quotation Sent", badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500" },
  { key: "won", label: "Won", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
  { key: "lost", label: "Lost", badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" },
];

const STAGE_COLORS: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.badge]));
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.label]));

const SOURCE_LABELS: Record<string, string> = {
  website: "Website", phone: "Phone", email: "Email",
  referral: "Referral", whatsapp: "WhatsApp", social: "Social Media", walk_in: "Walk-in",
};

const BLANK_LEAD = { name: "", phone: "", email: "", source: LeadSource.phone, destination: "", travelDate: "", pax: "", budget: "", notes: "" };
const BLANK_UPDATE = { status: "contacted", notes: "", followUpDate: "" };
const BLANK_CONVERT = { type: "tour", pickupDate: "", pickupLocation: "", dropLocation: "", amount: "", advancePaid: "", notes: "" };

const BOOKING_TYPES = ["tour", "outstation", "local_cab", "airport_transfer", "corporate", "wedding", "hourly"];

const BOOKING_TYPE_LABELS: Record<string, string> = {
  tour: "Tour", outstation: "Outstation", local_cab: "Local Cab",
  airport_transfer: "Airport Transfer", corporate: "Corporate", wedding: "Wedding", hourly: "Hourly",
};

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const isOverdue = (d?: string | null) => !!d && new Date(d) < new Date(new Date().toDateString());

export default function AdminLeads() {
  const { data: leads, isLoading } = useListLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLeadToBooking();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState<any | null>(null);
  const [form, setForm] = useState(BLANK_LEAD);
  const [updateForm, setUpdateForm] = useState(BLANK_UPDATE);
  const [convertDialog, setConvertDialog] = useState<any | null>(null);
  const [convertForm, setConvertForm] = useState(BLANK_CONVERT);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["/v1/crm/leads"] });
    qc.invalidateQueries({ queryKey: ["/v1/bookings"] });
  };

  const matchesSearch = (l: any) => {
    const q = search.toLowerCase();
    return !search || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.destination ?? "").toLowerCase().includes(q);
  };

  const searched = (leads ?? []).filter(matchesSearch);
  const filtered = searched.filter(l => statusFilter === "all" || l.status === statusFilter);

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
      await updateLead.mutateAsync({ id: updateDialog.id, data: { status: updateForm.status as LeadStatus, notes: updateForm.notes || undefined, followUpDate: updateForm.followUpDate || undefined } });
      toast({ title: "Lead updated" });
      refresh();
      setUpdateDialog(null);
    } catch { toast({ title: "Failed to update lead", variant: "destructive" }); }
  };

  const openConvert = (lead: any) => {
    setConvertForm({
      type: "tour",
      pickupDate: lead.travelDate ?? "",
      pickupLocation: "",
      dropLocation: lead.destination ?? "",
      amount: lead.budget ? String(lead.budget) : "",
      advancePaid: "",
      notes: lead.notes ?? "",
    });
    setConvertDialog(lead);
  };

  const handleConvert = async () => {
    if (!convertDialog) return;
    try {
      const booking = await convertLead.mutateAsync({ id: convertDialog.id, data: {
        type: convertForm.type || undefined,
        pickupDate: convertForm.pickupDate || undefined,
        pickupLocation: convertForm.pickupLocation || undefined,
        dropLocation: convertForm.dropLocation || undefined,
        amount: convertForm.amount ? parseFloat(convertForm.amount) : undefined,
        advancePaid: convertForm.advancePaid ? parseFloat(convertForm.advancePaid) : undefined,
        notes: convertForm.notes || undefined,
      }});
      toast({ title: "Booking created", description: `${booking.bookingNumber} • lead marked as won` });
      refresh();
      setConvertDialog(null);
    } catch { toast({ title: "Failed to convert lead", variant: "destructive" }); }
  };

  const moveStage = async (lead: any, status: string) => {
    if (lead.status === status) return;
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status: status as LeadStatus } });
      toast({ title: `Moved to ${STAGE_LABELS[status]}` });
      refresh();
    } catch { toast({ title: "Failed to move lead", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"?`)) return;
    try {
      await deleteLead.mutateAsync({ id });
      toast({ title: "Lead deleted" });
      refresh();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const onDrop = (status: string) => {
    setDragOver(null);
    const lead = (leads ?? []).find(l => l.id === dragId);
    setDragId(null);
    if (lead) moveStage(lead, status);
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setUF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const all = leads ?? [];
  const wonCount = all.filter(l => l.status === "won").length;
  const lostCount = all.filter(l => l.status === "lost").length;
  const activeLeads = all.filter(l => !["won", "lost"].includes(l.status));
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.budget ? Number(l.budget) : 0), 0);
  const closed = wonCount + lostCount;
  const conversion = closed ? Math.round((wonCount / closed) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: String(all.length), cls: "bg-primary/10 text-primary", icon: <Users className="h-4 w-4" /> },
    { label: "Active", value: String(activeLeads.length), cls: "bg-blue-100 text-blue-700", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Pipeline Value", value: inr(pipelineValue), cls: "bg-amber-100 text-amber-700", icon: <CircleDollarSign className="h-4 w-4" /> },
    { label: "Won", value: String(wonCount), cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Conversion", value: `${conversion}%`, cls: "bg-purple-100 text-purple-700", icon: <Percent className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track and convert travel enquiries into bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button size="sm" variant={view === "board" ? "secondary" : "ghost"} onClick={() => setView("board")} className="h-8 gap-1.5 text-xs"><LayoutGrid className="h-3.5 w-3.5" />Board</Button>
            <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")} className="h-8 gap-1.5 text-xs"><List className="h-3.5 w-3.5" />List</Button>
          </div>
          <Button onClick={() => { setForm(BLANK_LEAD); setCreateDialog(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Lead</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.cls}`}>{s.icon}</div>
              <div className="min-w-0"><p className="text-xl font-black truncate">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, phone or destination…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{STAGES.map(s => <Skeleton key={s.key} className="h-64 w-full" />)}</div>
      ) : view === "board" ? (
        /* ---- Kanban board ---- */
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map(stage => {
            const items = searched.filter(l => l.status === stage.key);
            const colValue = items.reduce((sum, l) => sum + (l.budget ? Number(l.budget) : 0), 0);
            return (
              <div
                key={stage.key}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(o => (o === stage.key ? null : o))}
                onDrop={() => onDrop(stage.key)}
                className={cn(
                  "flex-1 min-w-[240px] rounded-xl border bg-muted/30 transition-colors",
                  dragOver === stage.key ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border",
                )}
              >
                <div className="p-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", stage.bar)} />
                      <span className="font-semibold text-sm">{stage.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  {colValue > 0 && <p className="text-xs text-muted-foreground mt-1">{inr(colValue)}</p>}
                </div>
                <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 text-center py-6">Drop leads here</p>
                  ) : items.map(lead => {
                    const idx = STAGES.findIndex(s => s.key === lead.status);
                    const next = STAGES[idx + 1];
                    return (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={() => setDragId(lead.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        className={cn("shadow-sm cursor-grab active:cursor-grabbing group", dragId === lead.id && "opacity-40")}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sm truncate">{lead.name}</p>
                                {lead.source && <span className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5 shrink-0">{SOURCE_LABELS[lead.source] ?? lead.source}</span>}
                              </div>
                              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                                {lead.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.destination}</span>}
                                {lead.budget && <span className="flex items-center gap-1 font-medium text-foreground"><CircleDollarSign className="h-3 w-3" />{inr(Number(lead.budget))}</span>}
                                {lead.followUpDate && (
                                  <span className={cn("flex items-center gap-1", isOverdue(lead.followUpDate) && "text-red-600 font-medium")}>
                                    <Clock className="h-3 w-3" />{lead.followUpDate}{isOverdue(lead.followUpDate) && " • overdue"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center flex-wrap gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" onClick={() => openUpdate(lead)} className="h-6 px-1.5 text-[11px] gap-1"><MessageSquare className="h-3 w-3" />Update</Button>
                                {lead.status !== "won" && lead.status !== "lost" && <Button size="sm" variant="ghost" onClick={() => openConvert(lead)} className="h-6 px-1.5 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700"><CalendarCheck className="h-3 w-3" />Convert</Button>}
                                {next && <Button size="sm" variant="ghost" onClick={() => moveStage(lead, next.key)} className="h-6 px-1.5 text-[11px] gap-0.5">{next.label}<ChevronRight className="h-3 w-3" /></Button>}
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(lead.id, lead.name)} className="h-6 w-6 p-0 text-destructive hover:text-destructive ml-auto"><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---- List view ---- */
        <>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!filtered.length ? (
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
                          <Badge variant="outline" className={`text-xs ${STAGE_COLORS[lead.status] ?? ""}`}>{STAGE_LABELS[lead.status] ?? lead.status}</Badge>
                          {lead.source && <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">{SOURCE_LABELS[lead.source] ?? lead.source}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                          {lead.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.destination}</span>}
                          {lead.budget && <span className="flex items-center gap-1"><CircleDollarSign className="h-3 w-3" />{inr(Number(lead.budget))}</span>}
                          {lead.travelDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{lead.travelDate}</span>}
                          {lead.pax && <span>{lead.pax} pax</span>}
                          {lead.followUpDate && <span className={cn("flex items-center gap-1", isOverdue(lead.followUpDate) && "text-red-600 font-medium")}><Clock className="h-3 w-3" />{lead.followUpDate}</span>}
                        </div>
                        {lead.notes && <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">{lead.notes}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openUpdate(lead)} className="h-8 text-xs gap-1"><MessageSquare className="h-3 w-3" />Update</Button>
                        {lead.status !== "won" && lead.status !== "lost" && <Button size="sm" variant="ghost" onClick={() => openConvert(lead)} className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-700"><CalendarCheck className="h-3.5 w-3.5" />Convert</Button>}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(lead.id, lead.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
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
                  {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
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

      <Dialog open={!!convertDialog} onOpenChange={() => setConvertDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Convert to Booking — {convertDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground -mt-1">Creates a confirmed booking from this lead and marks the lead as won.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={convertForm.type} onValueChange={v => setConvertForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOKING_TYPES.map(t => <SelectItem key={t} value={t}>{BOOKING_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Pickup Date</Label><Input type="date" value={convertForm.pickupDate} onChange={e => setConvertForm(f => ({ ...f, pickupDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Pickup Location</Label><Input value={convertForm.pickupLocation} onChange={e => setConvertForm(f => ({ ...f, pickupLocation: e.target.value }))} placeholder="From…" /></div>
              <div className="space-y-1.5"><Label>Drop Location</Label><Input value={convertForm.dropLocation} onChange={e => setConvertForm(f => ({ ...f, dropLocation: e.target.value }))} placeholder="To…" /></div>
              <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={convertForm.amount} onChange={e => setConvertForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Advance Paid (₹)</Label><Input type="number" value={convertForm.advancePaid} onChange={e => setConvertForm(f => ({ ...f, advancePaid: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={convertForm.notes} onChange={e => setConvertForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes…" rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConvertDialog(null)}>Cancel</Button>
              <Button onClick={handleConvert} disabled={convertLead.isPending} className="gap-1"><CalendarCheck className="h-4 w-4" />Create Booking</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
