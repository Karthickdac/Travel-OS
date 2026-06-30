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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Pencil, Trash2, Send, Mail, MessageSquare, Smartphone, Bell, Users } from "lucide-react";

type Campaign = {
  id: string; name: string; channel: string; subject?: string; message?: string;
  audience: string; status: string; scheduledAt?: string; sentAt?: string;
  sentCount: number; createdAt: string;
};

const BLANK = { name: "", channel: "email", subject: "", message: "", audience: "all", status: "draft", scheduledAt: "" };

const CHANNEL_ICONS: Record<string, any> = { email: Mail, sms: MessageSquare, whatsapp: Smartphone, push: Bell };
const CHANNEL_STYLES: Record<string, string> = {
  email: "bg-blue-50 text-blue-700 border-blue-200",
  sms: "bg-purple-50 text-purple-700 border-purple-200",
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  push: "bg-amber-50 text-amber-700 border-amber-200",
};
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function CampaignForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ ...BLANK, ...initial, scheduledAt: initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Campaign Name *</Label>
          <Input value={form.name} onChange={set("name")} placeholder="Diwali Special Offer" />
        </div>
        <div className="space-y-1.5">
          <Label>Channel *</Label>
          <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Audience *</Label>
          <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Schedule At</Label>
          <Input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Subject</Label>
          <Input value={form.subject} onChange={set("subject")} placeholder="Get 25% off this festive season!" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Message</Label>
          <Textarea value={form.message} onChange={set("message")} placeholder="Write your campaign message…" rows={4} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, scheduledAt: form.scheduledAt || undefined })} disabled={!form.name}>
          {initial?.id ? "Save Changes" : "Create Campaign"}
        </Button>
      </div>
    </div>
  );
}

export default function MarketingCampaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; data?: Campaign } | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/v1/marketing/campaigns"],
    queryFn: () => api.get("/marketing/campaigns"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/marketing/campaigns"] });

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/marketing/campaigns", d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Campaign created" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }: any) => api.patch(`/marketing/campaigns/${id}`, d), onSuccess: () => { refresh(); setDialog(null); toast({ title: "Campaign updated" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const sendMut = useMutation({ mutationFn: (id: string) => api.patch(`/marketing/campaigns/${id}`, { status: "sent" }), onSuccess: () => { refresh(); toast({ title: "Campaign sent" }); }, onError: (e: any) => toast({ title: e.message, variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.delete(`/marketing/campaigns/${id}`), onSuccess: () => { refresh(); toast({ title: "Campaign deleted" }); } });

  const handleSave = (d: any) => {
    if (dialog?.mode === "edit" && dialog.data) updateMut.mutate({ id: dialog.data.id, ...d });
    else createMut.mutate(d);
  };

  const list = campaigns ?? [];
  const sent = list.filter((c) => c.status === "sent").length;
  const scheduled = list.filter((c) => c.status === "scheduled").length;
  const totalReach = list.reduce((s, c) => s + (c.sentCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage marketing campaigns across channels.</p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{list.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{sent}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-600">{scheduled}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalReach.toLocaleString("en-IN")}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : !list.length ? (
        <Card className="text-center py-16"><CardContent className="pt-6"><Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No campaigns yet</p><p className="text-sm text-muted-foreground mt-1">Create your first marketing campaign.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((c) => {
            const Icon = CHANNEL_ICONS[c.channel] ?? Mail;
            return (
              <Card key={c.id} className={`shadow-sm hover:shadow-md transition-shadow ${c.status === "sent" ? "opacity-90" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><Icon className="h-4 w-4" /></div>
                      <CardTitle className="text-base truncate">{c.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[c.status] ?? ""}>{c.status}</Badge>
                  </div>
                  {c.subject && <CardDescription className="mt-2 line-clamp-1">{c.subject}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {c.message && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.message}</p>}
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <Badge variant="outline" className={CHANNEL_STYLES[c.channel] ?? ""}>{c.channel}</Badge>
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" />{c.audience}</span>
                    {c.sentCount > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><Send className="h-3.5 w-3.5" />{c.sentCount} sent</span>}
                  </div>
                  <div className="flex gap-2 justify-end">
                    {c.status !== "sent" && (
                      <Button size="sm" variant="outline" className="text-emerald-700 gap-1" onClick={() => { if (confirm(`Send campaign "${c.name}" now?`)) sendMut.mutate(c.id); }}>
                        <Send className="h-3.5 w-3.5" /> Send
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", data: c })}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete campaign "${c.name}"?`)) deleteMut.mutate(c.id); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          {dialog && <CampaignForm initial={dialog.data} onSave={handleSave} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
