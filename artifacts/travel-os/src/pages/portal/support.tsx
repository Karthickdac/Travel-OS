import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
import { Headphones, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type Ticket = {
  id: string; ticketNumber: string; customerName: string; customerEmail?: string; customerPhone?: string;
  subject: string; message: string; category: string; priority: string; status: string;
  resolution?: string; createdAt: string; resolvedAt?: string;
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

function TicketForm({ defaults, onSave, onCancel }: { defaults: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    customerName: defaults.customerName ?? "",
    customerEmail: defaults.customerEmail ?? "",
    customerPhone: defaults.customerPhone ?? "",
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Your Name *</Label><Input value={form.customerName} onChange={set("customerName")} placeholder="Your name" /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.customerPhone} onChange={set("customerPhone")} placeholder="+91 98765 43210" /></div>
        <div className="space-y-1.5 col-span-2"><Label>Email</Label><Input type="email" value={form.customerEmail} onChange={set("customerEmail")} placeholder="you@email.com" /></div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
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
          <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2"><Label>Subject *</Label><Input value={form.subject} onChange={set("subject")} placeholder="Brief description" /></div>
        <div className="space-y-1.5 col-span-2"><Label>Message *</Label><Textarea value={form.message} onChange={set("message")} rows={4} placeholder="Tell us how we can help…" /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.customerName || !form.subject || !form.message}>Submit Ticket</Button>
      </div>
    </div>
  );
}

export default function PortalSupport() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialog, setDialog] = useState(false);

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/v1/portal/support"],
    queryFn: () => api.get("/portal/support"),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/portal/support", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/portal/support"] });
      setDialog(false);
      toast({ title: "Ticket submitted", description: "Our team will get back to you shortly." });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const all = tickets ?? [];
  const counts = {
    total: all.length,
    open: all.filter((t) => t.status === "open" || t.status === "in_progress").length,
    resolved: all.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  const sorted = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground mt-1">Raise a request and track your support tickets.</p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Tickets", value: counts.total, icon: Headphones, cls: "" },
          { label: "Open", value: counts.open, icon: AlertCircle, cls: "text-amber-600" },
          { label: "Resolved", value: counts.resolved, icon: CheckCircle2, cls: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : !sorted.length ? (
        <Card className="text-center py-16">
          <CardContent className="pt-6">
            <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No support tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Need help? Raise a new ticket and we'll assist you.</p>
            <Button onClick={() => setDialog(true)} className="gap-2 mt-4"><Plus className="h-4 w-4" /> New Ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</span>
                      <Badge variant="outline" className={STATUS_COLOR[t.status] ?? ""}>{t.status?.replace("_", " ")}</Badge>
                      <Badge variant="outline" className={PRIORITY_COLOR[t.priority] ?? ""}>{t.priority}</Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{t.category}</Badge>
                    </div>
                    <p className="font-semibold truncate">{t.subject}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    {t.resolution && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                        <strong>Resolution:</strong> {t.resolution}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <TicketForm
            defaults={{ customerName: user?.name, customerEmail: user?.email }}
            onSave={(d) => createMut.mutate(d)}
            onCancel={() => setDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
