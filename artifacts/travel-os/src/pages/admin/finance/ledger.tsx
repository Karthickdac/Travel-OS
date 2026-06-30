import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookText } from "lucide-react";

type Ledger = {
  id: string; accountType: string; accountName: string; date: string;
  description?: string | null; debit: string; credit: string; reference?: string | null;
};

const BLANK = {
  accountName: "", date: new Date().toISOString().slice(0, 10),
  description: "", debit: "", credit: "", reference: "",
};

function LedgerTable({ accountType }: { accountType: "customer" | "vendor" }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(BLANK);

  const key = ["/v1/finance/ledger", accountType];
  const { data: entries, isLoading } = useQuery<Ledger[]>({
    queryKey: key,
    queryFn: () => api.get(`/finance/ledger?accountType=${accountType}`),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/finance/ledger", d),
    onSuccess: () => { refresh(); setOpen(false); setForm(BLANK); toast({ title: "Entry added" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.accountName) {
      toast({ title: "Account name is required", variant: "destructive" }); return;
    }
    if (!form.debit && !form.credit) {
      toast({ title: "Enter a debit or credit amount", variant: "destructive" }); return;
    }
    createMut.mutate({
      accountType,
      accountName: form.accountName,
      date: form.date,
      description: form.description || undefined,
      debit: form.debit ? Number(form.debit) : 0,
      credit: form.credit ? Number(form.credit) : 0,
      reference: form.reference || undefined,
    });
  };

  const rows = entries ?? [];
  const totalDebit = rows.reduce((s, r) => s + Number(r.debit ?? 0), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit ?? 0), 0);
  const balance = totalDebit - totalCredit;

  const sorted = [...rows].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  let running = 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">₹{totalDebit.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">₹{totalCredit.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${balance >= 0 ? "text-foreground" : "text-red-500"}`}>₹{balance.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setForm(BLANK); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Entry</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="capitalize">{accountType} Ledger</CardTitle>
          <CardDescription>Debit, credit and running balance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !sorted.length ? (
            <div className="text-center py-12">
              <BookText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No ledger entries</p>
              <p className="text-sm text-muted-foreground mt-1">Add a {accountType} ledger entry to begin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(r => {
                  running += Number(r.debit ?? 0) - Number(r.credit ?? 0);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="font-medium">{r.accountName}</TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">{r.description || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.reference || "—"}</TableCell>
                      <TableCell className="text-right">{Number(r.debit ?? 0) ? `₹${Number(r.debit).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-right">{Number(r.credit ?? 0) ? `₹${Number(r.credit).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className={`text-right font-semibold ${running >= 0 ? "text-foreground" : "text-red-500"}`}>₹{running.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="capitalize">Add {accountType} Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Account Name *</Label>
                <Input value={form.accountName} onChange={set("accountName")} placeholder={`${accountType === "customer" ? "Customer" : "Vendor"} name`} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input value={form.reference} onChange={set("reference")} placeholder="Ref no." />
              </div>
              <div className="space-y-1.5">
                <Label>Debit (₹)</Label>
                <Input type="number" value={form.debit} onChange={set("debit")} placeholder="0" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Credit (₹)</Label>
                <Input type="number" value={form.credit} onChange={set("credit")} placeholder="0" min="0" />
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

export default function AdminFinanceLedger() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
        <p className="text-muted-foreground mt-1">Customer and vendor accounts with running balances.</p>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">Customer Ledger</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4">
          <LedgerTable accountType="customer" />
        </TabsContent>
        <TabsContent value="vendor" className="mt-4">
          <LedgerTable accountType="vendor" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
