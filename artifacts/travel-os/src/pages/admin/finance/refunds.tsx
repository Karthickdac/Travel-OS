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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, RotateCcw, IndianRupee, Check, X, CheckCheck } from "lucide-react";

type Refund = {
  id: string; invoiceId?: string | null; customerName: string; amount: string;
  reason?: string | null; method: string; status: string;
  requestedAt: string; processedAt?: string | null; notes?: string | null; createdAt: string;
};

const METHODS = [
  { value: "wallet", label: "Wallet" },
  { value: "gateway", label: "Payment Gateway" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  processed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const BLANK = {
  customerName: "", amount: "", reason: "", method: "wallet",
  requestedAt: new Date().toISOString().slice(0, 10), notes: "",
};

export default function AdminFinanceRefunds() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(BLANK);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: refunds, isLoading } = useQuery<Refund[]>({
    queryKey: ["/v1/finance/refunds"],
    queryFn: () => api.get("/finance/refunds"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/refunds"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/finance/refunds", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Refund created" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/finance/refunds/${id}`, d),
    onSuccess: () => { refresh(); toast({ title: "Refund updated" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.customerName || !form.amount) {
      toast({ title: "Customer and amount are required", variant: "destructive" }); return;
    }
    createMut.mutate({
      customerName: form.customerName,
      amount: Number(form.amount),
      reason: form.reason || undefined,
      method: form.method,
      requestedAt: form.requestedAt,
      notes: form.notes || undefined,
    });
  };

  const list = (refunds ?? []).filter(r => statusFilter === "all" || r.status === statusFilter);
  const totalRefunded = (refunds ?? []).filter(r => r.status === "processed").reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const pendingCount = (refunds ?? []).filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refunds</h1>
          <p className="text-muted-foreground mt-1">Manage refund requests and approvals.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />New Refund</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{refunds?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Processed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{(refunds ?? []).filter(r => r.status === "processed").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Refunded</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">₹{totalRefunded.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>Review, approve and process refunds</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-12">
              <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No refunds found</p>
              <p className="text-sm text-muted-foreground mt-1">Create a refund request to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">{r.reason || "—"}</TableCell>
                    <TableCell className="capitalize">{r.method}</TableCell>
                    <TableCell className="text-right font-semibold">₹{Number(r.amount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${STATUS_STYLES[r.status] ?? ""}`}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="h-8 gap-1 text-blue-600" onClick={() => updateMut.mutate({ id: r.id, status: "approved" })}><Check className="h-3.5 w-3.5" />Approve</Button>
                            <Button size="sm" variant="ghost" className="h-8 gap-1 text-destructive" onClick={() => updateMut.mutate({ id: r.id, status: "rejected" })}><X className="h-3.5 w-3.5" />Reject</Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-emerald-600" onClick={() => updateMut.mutate({ id: r.id, status: "processed" })}><CheckCheck className="h-3.5 w-3.5" />Process</Button>
                        )}
                        {(r.status === "rejected" || r.status === "processed") && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Refund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input value={form.customerName} onChange={set("customerName")} placeholder="Customer name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={set("amount")} placeholder="0" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Requested At</Label>
                <Input type="date" value={form.requestedAt} onChange={set("requestedAt")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={set("reason")} placeholder="Reason for refund" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} placeholder="Additional notes" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending}><IndianRupee className="h-4 w-4 mr-1" />Create Refund</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
