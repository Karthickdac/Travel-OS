import { useState } from "react";
import {
  useListFastags, useCreateFastag, useUpdateFastag, useDeleteFastag,
  useGetFastagRecharges, useCreateFastagRecharge, useListVehicles,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CreditCard, Plus, Zap, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, History, Car, Trash2, Pencil, IndianRupee,
  Building2, ArrowUpRight, Clock, MessageSquareText, Sparkles, Copy, Webhook,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const BANKS = [
  { value: "hdfc",    label: "HDFC Bank" },
  { value: "icici",   label: "ICICI Bank" },
  { value: "sbi",     label: "SBI" },
  { value: "axis",    label: "Axis Bank" },
  { value: "paytm",   label: "Paytm Payments Bank" },
  { value: "kotak",   label: "Kotak Mahindra Bank" },
  { value: "idfc",    label: "IDFC First Bank" },
  { value: "yes",     label: "Yes Bank" },
  { value: "airtel",  label: "Airtel Payments Bank" },
  { value: "other",   label: "Other Bank" },
];

const RECHARGE_MODES = [
  { value: "upi",           label: "UPI" },
  { value: "net_banking",   label: "Net Banking" },
  { value: "debit_card",    label: "Debit Card" },
  { value: "credit_card",   label: "Credit Card" },
  { value: "cash",          label: "Cash at Bank" },
  { value: "neft",          label: "NEFT / IMPS" },
];

function statusBadge(status: string) {
  if (status === "active")      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
  if (status === "inactive")    return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>;
  if (status === "blacklisted") return <Badge className="bg-red-100 text-red-700 border-red-200">Blacklisted</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function bankLabel(val: string) {
  return BANKS.find(b => b.value === val)?.label ?? val;
}

// ─── Recharge History Panel ───────────────────────────────────────────────────
function RechargeHistory({ fastagId, vehicleNumber }: { fastagId: string; vehicleNumber: string }) {
  const { data: recharges, isLoading } = useGetFastagRecharges(fastagId);
  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!recharges?.length) return (
    <div className="py-8 text-center text-muted-foreground">
      <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No recharges recorded yet</p>
    </div>
  );
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {recharges.map(r => (
        <div key={r.id} className="flex items-start justify-between p-3 rounded-lg border bg-card gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">+₹{Number(r.amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {r.rechargeMode?.replace("_", " ").toUpperCase()}
                {r.transactionRef && <span className="font-mono ml-2 text-[10px]">#{r.transactionRef}</span>}
              </p>
              {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{format(parseISO(r.rechargedAt), "dd MMM yyyy")}</p>
            {r.balanceBefore != null && r.balanceAfter != null && (
              <p className="text-xs text-muted-foreground">
                ₹{Number(r.balanceBefore).toLocaleString()} → ₹{Number(r.balanceAfter).toLocaleString()}
              </p>
            )}
            {r.rechargedBy && <p className="text-xs text-muted-foreground">{r.rechargedBy}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fastag Card ─────────────────────────────────────────────────────────────
function FastagCard({
  tag, onEdit, onDelete, onRecharge, onHistory, onRefresh,
}: {
  tag: any; onEdit: () => void; onDelete: () => void;
  onRecharge: () => void; onHistory: () => void; onRefresh: () => void;
}) {
  const balance = Number(tag.balance);
  const threshold = Number(tag.lowBalanceThreshold);
  const isLow = balance < threshold;
  const balancePct = Math.min(100, (balance / Math.max(threshold * 3, 600)) * 100);

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow border-l-4 ${isLow ? "border-l-red-400" : "border-l-emerald-400"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isLow ? "bg-red-100" : "bg-emerald-100"}`}>
              <CreditCard className={`h-5 w-5 ${isLow ? "text-red-600" : "text-emerald-600"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-base">{tag.vehicleNumber}</p>
                {statusBadge(tag.status)}
                {isLow && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />Low
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{tag.tagId}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={onRefresh} title="Update Balance">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onHistory} title="Recharge History">
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="text-xs text-muted-foreground">Alert at ₹{threshold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black ${isLow ? "text-red-600" : "text-emerald-600"}`}>
              ₹{balance.toLocaleString()}
            </div>
            <div className="flex-1">
              <Progress value={balancePct} className={`h-2 ${isLow ? "[&>div]:bg-red-400" : "[&>div]:bg-emerald-400"}`} />
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            <span>{bankLabel(tag.bank)}</span>
          </div>
          {tag.lastCheckedAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Checked {format(parseISO(tag.lastCheckedAt), "dd MMM HH:mm")}</span>
            </div>
          )}
        </div>

        {/* Recharge button */}
        <Button
          size="sm"
          className={`w-full mt-3 gap-2 ${isLow ? "bg-red-600 hover:bg-red-700" : ""}`}
          onClick={onRecharge}
        >
          <Zap className="h-3.5 w-3.5" />
          {isLow ? "Recharge Now!" : "Record Recharge"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const EMPTY_TAG_FORM = { vehicleId: "", vehicleNumber: "", tagId: "", bank: "hdfc", balance: "0", lowBalanceThreshold: "200", notes: "" };
const EMPTY_RECHARGE = { amount: "", transactionRef: "", rechargeMode: "upi", rechargedBy: "", notes: "" };
const EMPTY_BALANCE = { balance: "", notes: "" };

export default function AdminFastagPage() {
  const { data: fastags, isLoading } = useListFastags();
  const { data: vehicles } = useListVehicles();
  const createFastag = useCreateFastag();
  const updateFastag = useUpdateFastag();
  const deleteFastag = useDeleteFastag();
  const createRecharge = useCreateFastagRecharge();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editTag, setEditTag] = useState<any>(null);
  const [rechargeTag, setRechargeTag] = useState<any>(null);
  const [historyTag, setHistoryTag] = useState<any>(null);
  const [refreshTag, setRefreshTag] = useState<any>(null);

  const [tagForm, setTagForm] = useState(EMPTY_TAG_FORM);
  const [rechargeForm, setRechargeForm] = useState(EMPTY_RECHARGE);
  const [balanceForm, setBalanceForm] = useState(EMPTY_BALANCE);
  const [smsText, setSmsText] = useState("");
  const [smsSyncing, setSmsSyncing] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/fleet/fastag"] });

  const { data: webhookInfo } = useQuery({
    queryKey: ["/v1/fleet/fastag/sms-webhook-url"],
    queryFn: () => api.get<{ configured: boolean; url: string | null }>("/fleet/fastag/sms-webhook-url"),
    enabled: showWebhook,
  });

  const handleSmsSync = async () => {
    if (!smsText.trim()) { toast({ title: "Paste the bank SMS first", variant: "destructive" }); return; }
    setSmsSyncing(true);
    try {
      const r = await api.post<{ updated: { balance: number }; parsed: any }>(
        "/fleet/fastag/sms-sync",
        { message: smsText, fastagId: refreshTag?.id },
      );
      toast({ title: `Balance updated to ₹${Number(r.updated.balance).toLocaleString()}`, description: "Read from bank SMS" });
      setBalanceForm(f => ({ ...f, balance: String(r.updated.balance) }));
      setSmsText("");
      refresh();
      setRefreshTag(null);
    } catch (e: any) {
      toast({ title: "Couldn't read balance from SMS", description: e?.message ?? "Try Manual entry instead", variant: "destructive" });
    } finally {
      setSmsSyncing(false);
    }
  };

  const lowCount = (fastags ?? []).filter(f => Number(f.balance) < Number(f.lowBalanceThreshold)).length;
  const totalBalance = (fastags ?? []).reduce((s, f) => s + Number(f.balance), 0);

  const setTF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setTagForm(f => ({ ...f, [k]: e.target.value }));

  const handleVehicleSelect = (vehicleId: string) => {
    const v = (vehicles ?? []).find(v => v.id === vehicleId);
    setTagForm(f => ({ ...f, vehicleId, vehicleNumber: v?.registrationNumber ?? "" }));
  };

  const openCreate = () => { setTagForm(EMPTY_TAG_FORM); setShowCreate(true); };
  const openEdit = (tag: any) => {
    setTagForm({ vehicleId: tag.vehicleId ?? "", vehicleNumber: tag.vehicleNumber, tagId: tag.tagId, bank: tag.bank, balance: String(tag.balance), lowBalanceThreshold: String(tag.lowBalanceThreshold), notes: tag.notes ?? "" });
    setEditTag(tag);
  };

  const handleSaveTag = async () => {
    if (!tagForm.vehicleNumber || !tagForm.tagId) { toast({ title: "Vehicle number and Tag ID are required", variant: "destructive" }); return; }
    try {
      if (editTag) {
        await updateFastag.mutateAsync({ id: editTag.id, data: { bank: tagForm.bank, lowBalanceThreshold: Number(tagForm.lowBalanceThreshold), notes: tagForm.notes || undefined } });
        toast({ title: "FASTag updated" });
        setEditTag(null);
      } else {
        await createFastag.mutateAsync({ data: { vehicleId: tagForm.vehicleId || undefined, vehicleNumber: tagForm.vehicleNumber, tagId: tagForm.tagId, bank: tagForm.bank, balance: Number(tagForm.balance), lowBalanceThreshold: Number(tagForm.lowBalanceThreshold), notes: tagForm.notes || undefined } });
        toast({ title: "FASTag registered" });
        setShowCreate(false);
      }
      refresh();
    } catch { toast({ title: "Failed to save FASTag", variant: "destructive" }); }
  };

  const handleDelete = async (tag: any) => {
    if (!confirm(`Remove FASTag for ${tag.vehicleNumber}?`)) return;
    try { await deleteFastag.mutateAsync({ id: tag.id }); toast({ title: "FASTag removed" }); refresh(); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleRecharge = async () => {
    if (!rechargeForm.amount) { toast({ title: "Enter amount", variant: "destructive" }); return; }
    try {
      await createRecharge.mutateAsync({ id: rechargeTag.id, data: { amount: Number(rechargeForm.amount), transactionRef: rechargeForm.transactionRef || undefined, rechargeMode: rechargeForm.rechargeMode, rechargedBy: rechargeForm.rechargedBy || undefined, notes: rechargeForm.notes || undefined } });
      toast({ title: `₹${Number(rechargeForm.amount).toLocaleString()} recharge recorded` });
      setRechargeTag(null);
      setRechargeForm(EMPTY_RECHARGE);
      refresh();
    } catch { toast({ title: "Failed to record recharge", variant: "destructive" }); }
  };

  const handleRefreshBalance = async () => {
    if (!balanceForm.balance) { toast({ title: "Enter current balance", variant: "destructive" }); return; }
    try {
      await updateFastag.mutateAsync({ id: refreshTag.id, data: { balance: Number(balanceForm.balance), lastCheckedAt: new Date().toISOString(), notes: balanceForm.notes || undefined } });
      toast({ title: "Balance updated" });
      setRefreshTag(null);
      setBalanceForm(EMPTY_BALANCE);
      refresh();
    } catch { toast({ title: "Failed to update balance", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FASTag Management</h1>
          <p className="text-muted-foreground mt-1">Track FASTag balances and record recharges for your fleet vehicles.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Register FASTag</Button>
      </div>

      {/* Info banner about realtime SMS auto-update */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
        <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
        <div className="flex-1">
          <span className="font-semibold">Realtime balance from bank SMS.</span>{" "}
          Direct NETC/bank balance APIs need a bank partnership — instead, every toll deduction and recharge SMS from
          your bank already carries the live balance. Open <strong>Update Balance</strong> on any tag and paste that SMS to
          auto-update instantly, or set up <strong>auto-sync</strong> to forward those SMS automatically.
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0 border-emerald-300 bg-white" onClick={() => setShowWebhook(true)}>
          <Webhook className="h-3.5 w-3.5" />Auto-sync setup
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Tags</p>
            <p className="text-2xl font-black">{fastags?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Combined Balance</p>
            <p className="text-2xl font-black text-emerald-700">₹{totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${lowCount > 0 ? "border-red-200 bg-red-50/30" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {lowCount > 0 && <AlertTriangle className="h-4 w-4 text-red-600" />}
              <p className="text-xs text-muted-foreground font-medium">Low Balance</p>
            </div>
            <p className={`text-2xl font-black ${lowCount > 0 ? "text-red-600" : ""}`}>{lowCount} vehicle{lowCount !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Active Tags</p>
            <p className="text-2xl font-black">{fastags?.filter(f => f.status === "active").length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tag grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : !fastags?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No FASTags registered yet</p>
            <p className="text-sm text-muted-foreground mb-4">Register each vehicle's FASTag to track balances and recharges.</p>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Register First FASTag</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fastags.map(tag => (
            <FastagCard
              key={tag.id}
              tag={tag}
              onEdit={() => openEdit(tag)}
              onDelete={() => handleDelete(tag)}
              onRecharge={() => { setRechargeTag(tag); setRechargeForm(EMPTY_RECHARGE); }}
              onHistory={() => setHistoryTag(tag)}
              onRefresh={() => { setRefreshTag(tag); setBalanceForm({ balance: String(tag.balance), notes: "" }); }}
            />
          ))}
        </div>
      )}

      {/* Register FASTag dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Register FASTag</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vehicle (from fleet)</Label>
              <Select value={tagForm.vehicleId} onValueChange={handleVehicleSelect}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Enter manually</SelectItem>
                  {(vehicles ?? []).map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle Number *</Label>
                <Input value={tagForm.vehicleNumber} onChange={setTF("vehicleNumber")} placeholder="TN58AB1234" />
              </div>
              <div className="space-y-1.5">
                <Label>FASTag ID *</Label>
                <Input value={tagForm.tagId} onChange={setTF("tagId")} placeholder="9999XXXXXXXXXX" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Issuing Bank</Label>
              <Select value={tagForm.bank} onValueChange={v => setTagForm(f => ({ ...f, bank: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BANKS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Current Balance (₹)</Label>
                <Input type="number" value={tagForm.balance} onChange={setTF("balance")} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Low Balance Alert (₹)</Label>
                <Input type="number" value={tagForm.lowBalanceThreshold} onChange={setTF("lowBalanceThreshold")} placeholder="200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={tagForm.notes} onChange={setTF("notes")} placeholder="e.g. HDFC FASTag, wallet ID…" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSaveTag} disabled={createFastag.isPending}>Register FASTag</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit FASTag dialog */}
      <Dialog open={!!editTag} onOpenChange={() => setEditTag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit FASTag — {editTag?.vehicleNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Issuing Bank</Label>
              <Select value={tagForm.bank} onValueChange={v => setTagForm(f => ({ ...f, bank: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BANKS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Low Balance Alert (₹)</Label>
              <Input type="number" value={tagForm.lowBalanceThreshold} onChange={setTF("lowBalanceThreshold")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={tagForm.notes} onChange={setTF("notes")} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTag(null)}>Cancel</Button>
              <Button onClick={handleSaveTag} disabled={updateFastag.isPending}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge dialog */}
      <Dialog open={!!rechargeTag} onOpenChange={() => setRechargeTag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Record Recharge — {rechargeTag?.vehicleNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="font-black text-lg">₹{Number(rechargeTag?.balance ?? 0).toLocaleString()}</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Recharge Amount (₹) *</Label>
              <Input type="number" value={rechargeForm.amount} onChange={e => setRechargeForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" className="text-xl font-bold" autoFocus />
              {rechargeForm.amount && (
                <p className="text-xs text-emerald-700 font-semibold">
                  New balance: ₹{(Number(rechargeTag?.balance ?? 0) + Number(rechargeForm.amount)).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select value={rechargeForm.rechargeMode} onValueChange={v => setRechargeForm(f => ({ ...f, rechargeMode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECHARGE_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Transaction Ref / UTR</Label>
                <Input value={rechargeForm.transactionRef} onChange={e => setRechargeForm(f => ({ ...f, transactionRef: e.target.value }))} placeholder="UTR / TXN ID" />
              </div>
              <div className="space-y-1.5">
                <Label>Recharged By</Label>
                <Input value={rechargeForm.rechargedBy} onChange={e => setRechargeForm(f => ({ ...f, rechargedBy: e.target.value }))} placeholder="Staff name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={rechargeForm.notes} onChange={e => setRechargeForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional remarks…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRechargeTag(null)}>Cancel</Button>
              <Button onClick={handleRecharge} disabled={createRecharge.isPending} className="gap-2">
                <Zap className="h-4 w-4" />Record Recharge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance refresh dialog */}
      <Dialog open={!!refreshTag} onOpenChange={() => setRefreshTag(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Update Balance — {refreshTag?.vehicleNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Realtime: read balance from the bank SMS */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <MessageSquareText className="h-4 w-4" />Paste bank SMS (realtime)
              </div>
              <p className="text-xs text-emerald-700/90">
                Paste the latest toll-deduction or recharge SMS from your bank. We'll read the live balance and update it automatically.
              </p>
              <Textarea
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                rows={3}
                placeholder="e.g. Toll of Rs.85.00 deducted on FASTag for TN58AB1234. Avl Bal: Rs.415.00 -HDFC Bank"
                className="bg-white text-xs"
              />
              <Button size="sm" onClick={handleSmsSync} disabled={smsSyncing} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />{smsSyncing ? "Reading…" : "Read balance from SMS"}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">or enter manually</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label>Current Balance (₹) *</Label>
              <Input type="number" value={balanceForm.balance} onChange={e => setBalanceForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" className="text-xl font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={balanceForm.notes} onChange={e => setBalanceForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRefreshTag(null)}>Cancel</Button>
              <Button onClick={handleRefreshBalance} disabled={updateFastag.isPending} className="gap-2">
                <RefreshCw className="h-4 w-4" />Update Balance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-sync (webhook) setup dialog */}
      <Dialog open={showWebhook} onOpenChange={setShowWebhook}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />Auto-sync FASTag balances
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              For fully automatic realtime updates, forward your bank's FASTag SMS to the webhook below using a free
              SMS-forwarding app (e.g. <strong>SMS to URL Forwarder</strong> on Android) on the phone that receives the alerts.
              Each toll deduction or recharge SMS will update the matching vehicle's balance within seconds.
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Install an SMS-to-webhook forwarder app on the SIM that gets the FASTag SMS.</li>
              <li>Set the request method to <strong>POST</strong> and the body to send the full SMS text (field <code className="text-xs bg-muted px-1 rounded">message</code>, <code className="text-xs bg-muted px-1 rounded">text</code>, or <code className="text-xs bg-muted px-1 rounded">body</code>).</li>
              <li>Paste this webhook URL as the destination:</li>
            </ol>
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={webhookInfo?.url ?? "Loading…"} className="font-mono text-xs" onFocus={e => e.currentTarget.select()} />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!webhookInfo?.url}
                  onClick={() => { if (webhookInfo?.url) { navigator.clipboard.writeText(webhookInfo.url); toast({ title: "Webhook URL copied" }); } }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this URL private — the token in it authorises balance updates. The SMS must contain the vehicle number
                or the FASTag's last 4 digits so we can match it to the right tag.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowWebhook(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge history dialog */}
      <Dialog open={!!historyTag} onOpenChange={() => setHistoryTag(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recharge History — {historyTag?.vehicleNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">{historyTag?.tagId}</span>
            <span className="font-bold">Balance: ₹{Number(historyTag?.balance ?? 0).toLocaleString()}</span>
          </div>
          {historyTag && <RechargeHistory fastagId={historyTag.id} vehicleNumber={historyTag.vehicleNumber} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
