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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, BookOpen, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

type Entry = {
  id: string; date: string; type: string; category: string;
  description?: string | null; amount: string; paymentMode: string; reference?: string | null;
};

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const BLANK = {
  date: new Date().toISOString().slice(0, 10), type: "in", category: "",
  description: "", amount: "", paymentMode: "cash", reference: "",
};

export default function AdminFinanceCashbook() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(BLANK);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: entries, isLoading } = useQuery<Entry[]>({
    queryKey: ["/v1/finance/cashbook"],
    queryFn: () => api.get("/finance/cashbook"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/finance/cashbook"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/finance/cashbook", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Entry added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/cashbook/${id}`),
    onSuccess: () => { refresh(); toast({ title: "Entry deleted" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.category || !form.amount) {
      toast({ title: "Category and amount are required", variant: "destructive" }); return;
    }
    createMut.mutate({
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description || undefined,
      amount: Number(form.amount),
      paymentMode: form.paymentMode,
      reference: form.reference || undefined,
    });
  };

  const all = entries ?? [];
  const totalIn = all.filter(e => e.type === "in").reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const totalOut = all.filter(e => e.type === "out").reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const balance = totalIn - totalOut;

  const list = all.filter(e => typeFilter === "all" || e.type === typeFilter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Book</h1>
          <p className="text-muted-foreground mt-1">Track cash inflows and outflows.</p>
        </div>
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total In</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">₹{totalIn.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Out</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-500">₹{totalOut.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className={`text-2xl font-bold ${balance >= 0 ? "text-foreground" : "text-red-500"}`}>₹{balance.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in">Cash In</SelectItem>
            <SelectItem value="out">Cash Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>All cash book transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No entries found</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first cash book entry.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date ? new Date(e.date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.type === "in" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                        {e.type === "in" ? "In" : "Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{e.category}</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">{e.description || "—"}</TableCell>
                    <TableCell className="capitalize">{e.paymentMode}</TableCell>
                    <TableCell className="text-muted-foreground">{e.reference || "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${e.type === "in" ? "text-emerald-600" : "text-red-500"}`}>
                      {e.type === "in" ? "+" : "-"}₹{Number(e.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => { if (confirm("Delete this entry?")) deleteMut.mutate(e.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
          <DialogHeader><DialogTitle>Add Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Cash In</SelectItem>
                    <SelectItem value="out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input value={form.category} onChange={set("category")} placeholder="e.g. Booking payment" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={set("amount")} placeholder="0" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input value={form.reference} onChange={set("reference")} placeholder="Txn / ref no." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={set("description")} placeholder="Optional description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending}>Add Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
