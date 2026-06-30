import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Plus, Pencil, Clock, CheckCircle2, AlertCircle, XCircle, Phone, Mail } from "lucide-react";

type Ticket = {
  id: string; ticketNumber: string; customerName: string; customerEmail?: string; customerPhone?: string;
  subject: string; message: string; category: string; priority: string; status: string;
  assignedTo?: string; resolution?: string; createdAt: string; resolvedAt?: string;
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const BLANK = {
  customerName: "", customerEmail: "", customerPhone: "", subject: "", message: "",
  category: "general", priority: "medium",
};

function TicketForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={form.customerName} onChange={set("customerName")} placeholder="Ravi Kumar" /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.customerPhone} onChange={set("customerPhone")} placeholder="+91 98765 43210" /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.customerEmail} onChange={set("customerEmail")} placeholder="customer@email.com" /></div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="complaint">Complaint</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm((f: any) => ({ ...f, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2"><Label>Subject *</Label><Input value={form.subject} onChange={set("subject")} placeholder="Brief description of the issue" /></div>
        <div className="space-y-1.5 col-span-2"><Label>Message *</Label><Textarea value={form.message} onChange={set("message")} rows={4} placeholder="Detailed description of the issue..." /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.customerName || !form.subject || !form.message}>
          {initial?.id ? "Save Changes" : "Create Ticket"}
        </Button>
      </div>
    </div>
  );
}

function ResolveDialog({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [resolution, setResolution] = useState(ticket.resolution ?? "");
  const [status, setStatus] = useState(ticket.status === "resolved" ? "resolved" : "in_progress");

  const updateMut = useMutation({
    mutationFn: (d: any) => api.patch(`/support/tickets/${ticket.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/support/tickets"] });
      toast({ title: "Ticket updated" });
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Resolution Notes</Label>
        <Textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={4} placeholder="Describe how the issue was resolved..." />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => updateMut.mutate({ status, resolution })}>Update Ticket</Button>
      </div>
    </div>
  );
}

export default function AdminSupport() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: "create" | "resolve"; data?: Ticket } | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/v1/support/tickets"],
    queryFn: () => api.get("/support/tickets"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/support/tickets"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/support/tickets", d),
    onSuccess: () => { refresh(); setDialog(null); toast({ title: "Ticket created" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const all = tickets ?? [];
  const counts = { all: all.length, open: all.filter(t => t.status === "open").length, in_progress: all.filter(t => t.status === "in_progress").length, resolved: all.filter(t => t.status === "resolved").length };

  const filtered = all.filter(t => {
    const matchSearch = t.customerName.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || t.status === tab;
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage customer support requests and complaints.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, cls: "", icon: Ticket },
          { label: "Open", value: counts.open, cls: "text-blue-600", icon: Clock },
          { label: "In Progress", value: counts.in_progress, cls: "text-amber-600", icon: AlertCircle },
          { label: "Resolved", value: counts.resolved, cls: "text-emerald-600", icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <Input placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : !filtered.length ? (
            <Card className="text-center py-16"><CardContent className="pt-6"><Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No tickets found</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(t => (
                <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</span>
                          <Badge variant="outline" className={STATUS_COLOR[t.status]}>{t.status.replace("_", " ")}</Badge>
                          <Badge variant="outline" className={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">{t.category}</Badge>
                        </div>
                        <p className="font-semibold truncate">{t.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{t.customerName}</span>
                          {t.customerPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.customerPhone}</span>}
                          {t.customerEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.customerEmail}</span>}
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        {t.resolution && <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-700"><strong>Resolution:</strong> {t.resolution}</div>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "resolve", data: t })}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "resolve" ? `Update Ticket — ${dialog.data?.ticketNumber}` : "New Support Ticket"}</DialogTitle>
          </DialogHeader>
          {dialog?.mode === "create" && <TicketForm onSave={d => createMut.mutate(d)} onCancel={() => setDialog(null)} />}
          {dialog?.mode === "resolve" && dialog.data && <ResolveDialog ticket={dialog.data} onClose={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
